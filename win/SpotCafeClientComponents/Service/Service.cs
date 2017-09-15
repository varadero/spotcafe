using SpotCafe.Service.Discovery;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Runtime.InteropServices;
using System.ServiceProcess;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Service {
    class Service : ServiceBase {
        public static readonly string Name = "SpotCafe.Service";

        private Logger logger;
        private ServerDiscoverer discoverer;
        private string configFileName = "SpotCafe.Service-Configuration.json";
        private ServiceConfiguration serviceConfig;
        private IPEndPoint remoteEndPoint;
        private Serializer serializer;

        [Flags]
        public enum ProcessAccessFlags : uint {
            All = 0x001F0FFF,
            Terminate = 0x00000001,
            CreateThread = 0x00000002,
            VirtualMemoryOperation = 0x00000008,
            VirtualMemoryRead = 0x00000010,
            VirtualMemoryWrite = 0x00000020,
            DuplicateHandle = 0x00000040,
            CreateProcess = 0x000000080,
            SetQuota = 0x00000100,
            SetInformation = 0x00000200,
            QueryInformation = 0x00000400,
            QueryLimitedInformation = 0x00001000,
            Synchronize = 0x00100000
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct SECURITY_ATTRIBUTES {
            public int nLength;
            public IntPtr lpSecurityDescriptor;
            public int bInheritHandle;
        }

        public enum SECURITY_IMPERSONATION_LEVEL {
            SecurityAnonymous,
            SecurityIdentification,
            SecurityImpersonation,
            SecurityDelegation
        }

        public enum TOKEN_TYPE {
            TokenPrimary = 1,
            TokenImpersonation
        }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        struct STARTUPINFO {
            public Int32 cb;
            public string lpReserved;
            public string lpDesktop;
            public string lpTitle;
            public Int32 dwX;
            public Int32 dwY;
            public Int32 dwXSize;
            public Int32 dwYSize;
            public Int32 dwXCountChars;
            public Int32 dwYCountChars;
            public Int32 dwFillAttribute;
            public Int32 dwFlags;
            public Int16 wShowWindow;
            public Int16 cbReserved2;
            public IntPtr lpReserved2;
            public IntPtr hStdInput;
            public IntPtr hStdOutput;
            public IntPtr hStdError;
        }

        [StructLayout(LayoutKind.Sequential)]
        internal struct PROCESS_INFORMATION {
            public IntPtr hProcess;
            public IntPtr hThread;
            public int dwProcessId;
            public int dwThreadId;
        }

        public const UInt32 TOKEN_DUPLICATE = 0x0002;
        public const UInt32 MAXIMUM_ALLOWED = 0x02000000;
        public const UInt32 NORMAL_PRIORITY_CLASS = 0x00000020;
        public const string appToStart = "notepad.exe";

        [DllImport("kernel32.dll", SetLastError = true)]
        public static extern IntPtr OpenProcess(ProcessAccessFlags processAccess, bool bInheritHandle, int processId);

        [DllImport("kernel32.dll", SetLastError = true)]
        public static extern bool OpenProcessToken(IntPtr processHandle, UInt32 desiredAccess, out IntPtr tokenHandle);

        [DllImport("advapi32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        public extern static bool DuplicateTokenEx(
            IntPtr hExistingToken,
            uint dwDesiredAccess,
            ref SECURITY_ATTRIBUTES lpTokenAttributes,
            SECURITY_IMPERSONATION_LEVEL ImpersonationLevel,
            TOKEN_TYPE TokenType,
            out IntPtr phNewToken
        );

        [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        static extern bool CreateProcessAsUser(
            IntPtr hToken,
            string lpApplicationName,
            string lpCommandLine,
            ref SECURITY_ATTRIBUTES lpProcessAttributes,
            ref SECURITY_ATTRIBUTES lpThreadAttributes,
            bool bInheritHandles,
            uint dwCreationFlags,
            IntPtr lpEnvironment,
            string lpCurrentDirectory,
            ref STARTUPINFO lpStartupInfo,
            out PROCESS_INFORMATION lpProcessInformation
        );

        public Service() {
            InitializeComponent();
            serializer = new Serializer();
            ServiceName = Name;
        }

        public void Start(string[] args) {
            OnStart(args);
        }

        protected override void OnStart(string[] args) {
            try {
                logger = new Logger();
            } catch (Exception ex) {
                Console.WriteLine("Error when creating logger: {0}", ex);
            }
            var interop = new Interop();
            var id = interop.GetCurrentWindowsIdentity();
            if (args != null && args.Length > 0) {
                var argsText = string.Join(" ", args);
                Log("Starting up with arguments " + argsText);
                if (args.Contains("/start-app-on-user-desktop")) {
                    ExecuteProcessOnLoggedUserDesktop(1, appToStart);
                }
            } else {
                Log("Starting up without arguments");
            }
            serviceConfig = GetServiceConfiguration();
            discoverer = new ServerDiscoverer(serviceConfig.ClientId, Environment.MachineName, serviceConfig.ServiceIp, TimeSpan.FromMilliseconds(700));
            discoverer.DiscoveryDataReceived += Discoverer_DataReceived;
            StartServerDiscovery();
            base.OnStart(args);
        }

        protected override void OnSessionChange(SessionChangeDescription changeDescription) {
            Log("Session change Reason=" + changeDescription.Reason + " SessionID=" + changeDescription.SessionId.ToString());
            ExecuteProcessOnLoggedUserDesktop(changeDescription.SessionId, appToStart);
            base.OnSessionChange(changeDescription);
        }

        protected override void OnStop() {
            Log("Stopping");
            base.OnStop();
        }

        protected override void OnShutdown() {
            Log("Shutting down");
            base.OnShutdown();
        }

        private void Discoverer_DataReceived(object sender, DiscoveryDataReceivedEventArgs e) {
            Log("Data received from discoverer");
            var text = Encoding.UTF8.GetString(e.Data);
            Log(string.Format("Discovery data received from {0}: {1}", e.RemoteEndPoint.Address.ToString(), text));
            try {
                // If data contains necessary information - stop further discovering
                if (e.Response != null && e.Response.Approved) {
                    e.StopDiscover = true;
                    discoverer.StopDiscovery();
                    remoteEndPoint = e.RemoteEndPoint;
                    ConnectToServer();
                }
            } catch (Exception ex) {
                Log(string.Format("Discovery data is not a valid JSON: {0}", ex));
            }
        }

        private void ExecuteProcessOnLoggedUserDesktop(int sessionId, string appName) {
            var processes = Process.GetProcessesByName("winlogon");
            var winlogonProcess = processes.FirstOrDefault(x => x.SessionId == sessionId);
            if (winlogonProcess != null) {
                // TODO Use WTSQueryUserToken to get user token by session id
                var hProcess = OpenProcess(ProcessAccessFlags.All, false, winlogonProcess.Id);
                IntPtr tokenHandle;
                OpenProcessToken(hProcess, TOKEN_DUPLICATE, out tokenHandle);
                var sa = new SECURITY_ATTRIBUTES();
                sa.nLength = Marshal.SizeOf(sa);
                IntPtr duplicatedToken;
                DuplicateTokenEx(tokenHandle, MAXIMUM_ALLOWED, ref sa, SECURITY_IMPERSONATION_LEVEL.SecurityIdentification, TOKEN_TYPE.TokenPrimary, out duplicatedToken);
                var si = new STARTUPINFO();
                si.cb = Marshal.SizeOf(si);
                si.lpDesktop = @"winsta0\default";
                var dwCreationFlags = NORMAL_PRIORITY_CLASS;
                PROCESS_INFORMATION pi;
                CreateProcessAsUser(duplicatedToken, null, appName, ref sa, ref sa, false, dwCreationFlags, IntPtr.Zero, null, ref si, out pi);
            }
        }

        private void ConnectToServer() {
            // TODO Make initial request to the server authenticating with ClientId
            Log(string.Format("Using server {0}", remoteEndPoint.Address.ToString()));
        }

        private void StartServerDiscovery() {
            discoverer.StartDiscovery();
        }

        private void Log(string message, EventLogEntryType type = EventLogEntryType.Information) {
            Console.WriteLine("{0}: {1}: {2}", DateTime.Now, type, message);
            if (logger != null) {
                try {
                    logger.Log(message, type);
                } catch { }
            }
        }

        private void SaveServiceConfiguration() {
            try {
                File.WriteAllText(configFileName, serializer.Serialize(serviceConfig));
            } catch (Exception ex) {
                Log(string.Format("Can't save configuration: {0}", ex));
            }
        }

        private ServiceConfiguration GetServiceConfiguration() {
            ServiceConfiguration config;
            try {
                config = serializer.Deserialize<ServiceConfiguration>(File.ReadAllText(configFileName));
            } catch (Exception loadEx) {
                Log(string.Format("Can't load configuration. Will create default config file: {0}", loadEx));
                config = new ServiceConfiguration();
                config.ClientId = Guid.NewGuid().ToString();
                try {
                    File.WriteAllText(configFileName, serializer.Serialize(config));
                    Log(string.Format("Configuration written to {0}", configFileName));
                } catch (Exception writeEx) {
                    // Probably no access for writing
                    Log(string.Format("Can't save configuration: {0}", writeEx));
                }
            }
            return config;
        }

        private void InitializeComponent() {
            // 
            // Service
            // 
            this.CanHandleSessionChangeEvent = true;

        }
    }
}
