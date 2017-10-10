using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace SpotCafe.Desktop {
    static class Program {
        private static string logFileFullPath;
        private static Logger logger;
        private static Mutex mutex;
        private const string mutexName = @"Global\7D23335A-9D10-4462-B1AF-A2C729C1B509";

        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main() {
            logFileFullPath = Path.Combine(Application.CommonAppDataPath, $"SpotCafe.Desktop.{Environment.UserName}.log.txt");
            try {
                logger = new Logger(logFileFullPath);
            } catch { }
            if (Process.GetCurrentProcess().SessionId == 0) {
                Log($"Will not start in session {Process.GetCurrentProcess().SessionId} of user {Environment.UserName}");
                return;
            }
            var inputDesktopName = Interop.GetInputDesktopName();
            if (!string.Equals(inputDesktopName, "default", StringComparison.OrdinalIgnoreCase)) {
                Log($"Will not start on input desktop '{inputDesktopName}'");
                return;
            }

            Log($"Starting in session {Process.GetCurrentProcess().SessionId} of user {Environment.UserName} on desktop {inputDesktopName}");
            if (!RegisterMutex()) {
                // Already running
                Log("Application is already running");
                return;
            }

            var args = Environment.GetCommandLineArgs();
            Log($"Starting with arguments {string.Join(" ", args)}");
            var cmdArgsParser = new CommandLineArgsParser();
            var commandLineArgs = cmdArgsParser.Parse(args);
            logger.Log($"ClientID={commandLineArgs.ClientId} ; ServerIP={commandLineArgs.ServerIP}");

            var startupDesktopHandle = Interop.GetInputDesktopHandle();
#if DEBUG
            // Send broadcast data to the server
            System.Net.Sockets.UdpClient uc = new System.Net.Sockets.UdpClient(64128, System.Net.Sockets.AddressFamily.InterNetwork);
            uc.MulticastLoopback = false;
            var json = "{\"clientId\":\"" + commandLineArgs.ClientId + "\",";
            json += "\"clientName\":\"" + Environment.MachineName + "\"}";
            var arr = System.Text.Encoding.UTF8.GetBytes(json);
            uc.Send(arr, arr.Length, hostname: "localhost", port: 64129);
            var secureDesktopHandle = startupDesktopHandle;
#else
            var secureDesktopHandle = CreateSecureDesktop();
#endif
            var mainForm = new MainForm();
            mainForm.Start(new MainFormStartArgs {
                StartupDesktopHandle = startupDesktopHandle,
                SecureDesktopHandle = secureDesktopHandle,
                CommandLineArguments = commandLineArgs,
                Logger = logger
            });
            Application.EnableVisualStyles();
            //Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(mainForm);
        }

        public static string GetLogFileFullPath() {
            return logFileFullPath;
        }

        private static IntPtr CreateSecureDesktop() {
            var desktopHandle = Interop.CreateDesktop("SpotCafeSecureDesktop", IntPtr.Zero, IntPtr.Zero, 0, Interop.DesktopAccessRights.GENERIC_ALL, IntPtr.Zero);
            return desktopHandle;
        }

        private static bool RegisterMutex() {
            var mutexIsNew = false;
            try {
                mutex = Mutex.OpenExisting(mutexName);
                return false;
            } catch (WaitHandleCannotBeOpenedException) {
                try {
                    SecurityIdentifier sid = new SecurityIdentifier(WellKnownSidType.WorldSid, null);
                    MutexSecurity mSec = new MutexSecurity();
                    MutexAccessRule rule = new MutexAccessRule(sid, MutexRights.FullControl, AccessControlType.Allow);
                    mSec.AddAccessRule(rule);
                    mutex = new Mutex(false, mutexName, out mutexIsNew, mSec);
                } catch {
                    return false;
                }
            }
            return mutexIsNew;
        }

        private static void Log(string message) {
            logger.Log(message);
        }

        private static void LogError(string message) {
            logger.LogError(message);
        }
    }
}
