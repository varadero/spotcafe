using SpotCafe.Service.Discovery;
using SpotCafe.Service.REST;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net;
using System.Net.Security;
using System.Runtime.InteropServices;
using System.Security.Cryptography.X509Certificates;
using System.ServiceProcess;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Service {
    class Service : ServiceBase {
        public static readonly string Name = "SpotCafe.Service";

        private Logger logger;
        private ServerDiscoverer discoverer;
        private string configFileFullPath;
        private ServiceConfiguration serviceConfig;
        private IPEndPoint remoteEndPoint;
        private Serializer serializer;
        private const int downloadClientFilesTriesCount = 10;
        private TimeSpan downloadClientFilesDelayBetweenRetries = TimeSpan.FromSeconds(6);
        private ClientFilesData clientFiles = null;
        private const string clientFileNameToStart = "SpotCafe.Desktop.exe";
        private string pathForClientFiles;
        private SessionChangeDescription lastSessionChangeDescription;
        private Interop.PROCESS_INFORMATION lastClientAppExecuteResult;
        private bool useConsoleSession = false;
        private Dictionary<uint, Nullable<Interop.PROCESS_INFORMATION>> executeResults;
        private bool clientFilesExtracted;

        public Service() {
            InitializeComponent();
            executeResults = new Dictionary<uint, Interop.PROCESS_INFORMATION?>();
            ServiceName = Name;
        }

        public void Start(string[] args) {
            OnStart(args);
        }

        protected override void OnStart(string[] args) {
            serializer = new Serializer();
            try {
                logger = new Logger();
            } catch (Exception ex) {
                Console.WriteLine($"Error when creating logger: {ex}");
            }
            ServicePointManager.ServerCertificateValidationCallback = ServiceCertificateValidationCallback;
            var interop = new Interop();
            if (args != null && args.Length > 0) {
                var argsText = string.Join(" ", args);
                Log("Starting up with arguments " + argsText);
                useConsoleSession = args.Contains("/use-console-session");
            } else {
                Log("Starting up without arguments");
            }

            configFileFullPath = Path.GetFullPath("SpotCafe.Service.Configuration.json");
            pathForClientFiles = Path.GetFullPath("SpotCafeClientFiles");
            Log($"Config file: {configFileFullPath}");
            Log($"Path for client files: {pathForClientFiles}");

            serviceConfig = GetServiceConfiguration();
            discoverer = new ServerDiscoverer(serviceConfig.ClientId, Environment.MachineName, serviceConfig.ServerIp, TimeSpan.FromMilliseconds(10000));
            discoverer.DiscoveryDataReceived += Discoverer_DataReceived;
            StartServerDiscovery();
            base.OnStart(args);
        }

        protected override void OnSessionChange(SessionChangeDescription changeDescription) {
            lastSessionChangeDescription = changeDescription;
            Log($"Session change Reason={changeDescription.Reason} SessionID={changeDescription.SessionId}");
            if (clientFilesExtracted) {
                ExecuteStartupClientFileIfLoggedIn();
            } else {
                Log($"Client files still not extracted");
            }
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

        private void ExecuteStartupClientFileIfLoggedIn() {
            // TODO Execute startup client file also if the service is started while the user is already logged in...
            var appToRun = (clientFiles != null && !string.IsNullOrWhiteSpace(clientFiles.StartupName)) ? clientFiles.StartupName : clientFileNameToStart;
            var pathToApp = Path.Combine(pathForClientFiles, appToRun);
            uint sessionId = 0;
            if (useConsoleSession) {
                sessionId = Interop.WTSGetActiveConsoleSessionId();
            } else {
                if (IsSessionChangeReasonShouldStartClientApp(lastSessionChangeDescription)) {
                    sessionId = (uint)lastSessionChangeDescription.SessionId;
                }
            }
            if (sessionId > 0) {
                var procs = Process.GetProcessesByName(clientFileNameToStart).Where(x => !x.HasExited);
                var existingExecuteResult = GetExecuteResult(sessionId);
                if (existingExecuteResult != null) {
                    Log($"There is already application with Id={existingExecuteResult.Value.dwProcessId} executed on SessionId={sessionId}");
                    return;
                }
                // TODO
                // When user is switched, a new session is created user selection screen
                // This session is created only for user selection screen and it seems that all applications created in that session
                // Are "moved" to their parent process session when the user logs in
                // We shouldn't create anything in that session - probably by allowing only one instance of client file
                // Until we find a way to detect such sessions, we will rely on single-instance logic of the client app
                // This will make our lastClientAppExecuteResult invalid
                Log($"Executing {pathToApp} on session {sessionId}");
                lastClientAppExecuteResult = ExecuteProcessOnLoggedUserDesktop(sessionId, pathToApp);
                SetExecuteResult(sessionId, lastClientAppExecuteResult);
                Log($"App execute result: ProcessId={lastClientAppExecuteResult.dwProcessId}");
            }
            // TODO Start a timer to check if the lastClientAppExecuteResult hProcess (and the process with name "SpotCafe.Desktop.exe' and correct path) is still alive and if not - call this method again 
            // TODO Information for PROCESS_INFORMATION structure From MSDN: If the function succeeds, be sure to call the CloseHandle function to close the hProcess and hThread handles when you are finished with them
        }

        private void SetExecuteResult(uint sessionId, Interop.PROCESS_INFORMATION pi) {
            if (GetExecuteResult(sessionId) == null) {
                executeResults.Add(sessionId, pi);
            } else {
                executeResults[sessionId] = pi;
            }
        }

        private Interop.PROCESS_INFORMATION? GetExecuteResult(uint sessionId) {
            if (executeResults.TryGetValue(sessionId, out Interop.PROCESS_INFORMATION? pi)) {
                return pi;
            } else {
                return null;
            }
        }

        private bool ServiceCertificateValidationCallback(object sender, X509Certificate certificate, X509Chain chain, SslPolicyErrors sslPolicyErrors) {
            if (!string.IsNullOrWhiteSpace(serviceConfig.ServerCertificateThumbprint)) {
                var certThumbprint = certificate.GetCertHashString();
                if (certThumbprint != serviceConfig.ServerCertificateThumbprint) {
                    Log($"Certificate thumbprint {certThumbprint} does not match configuration thumbprint {serviceConfig.ServerCertificateThumbprint}", EventLogEntryType.Error);
                    return false;
                }
            }
            return true;
        }

        private async void Discoverer_DataReceived(object sender, DiscoveryDataReceivedEventArgs e) {
            Log("Data received from discoverer");
            var text = Encoding.UTF8.GetString(e.Data);
            Log($"Discovery data received from {e.RemoteEndPoint.Address}: {text}");
            try {
                // If data contains necessary information - stop further discovering
                if (e.Response != null && e.Response.Approved) {
                    e.StopDiscover = true;
                    discoverer.StopDiscovery();
                    remoteEndPoint = e.RemoteEndPoint;
                    clientFiles = await DownloadClientFiles();
                    if (clientFiles != null) {
                        ExecuteStartupClientFileIfLoggedIn();
                    } else {

                    }
                }
            } catch (Exception ex) {
                Log($"Discovery data is not a valid JSON: {ex}", EventLogEntryType.Error);
            }
        }

        private bool IsSessionChangeReasonShouldStartClientApp(SessionChangeDescription changeDescription) {
            var reasons = new SessionChangeReason[] { SessionChangeReason.SessionLogon, SessionChangeReason.ConsoleConnect };
            if (changeDescription.SessionId != 0 && reasons.Contains(changeDescription.Reason)) {
                return true;
            }
            return false;
        }

        private Interop.PROCESS_INFORMATION ExecuteProcessOnLoggedUserDesktop(uint sessionId, string appName) {
            Interop.WTSQueryUserToken(sessionId, out IntPtr tokenHandle);
            var sa = new Interop.SECURITY_ATTRIBUTES();
            sa.nLength = Marshal.SizeOf(sa);
            Interop.DuplicateTokenEx(tokenHandle, Interop.MAXIMUM_ALLOWED, ref sa, Interop.SECURITY_IMPERSONATION_LEVEL.SecurityIdentification, Interop.TOKEN_TYPE.TokenPrimary, out IntPtr duplicatedToken);
            var si = new Interop.STARTUPINFO();
            si.cb = Marshal.SizeOf(si);
            si.lpDesktop = @"winsta0\default";
            var dwCreationFlags = Interop.NORMAL_PRIORITY_CLASS;
            Interop.CreateProcessAsUser(duplicatedToken, null, appName, ref sa, ref sa, false, dwCreationFlags, IntPtr.Zero, null, ref si, out Interop.PROCESS_INFORMATION pi);
            return pi;
        }

        private async Task<ClientFilesData> DownloadClientFiles() {
            var client = new RestClient(remoteEndPoint.Address.ToString(), "api");
            for (var i = 0; i < downloadClientFilesTriesCount; i++) {
                try {
                    var clientFilesResponse = await client.GetClientFiles();
                    clientFiles = serializer.Deserialize<ClientFilesData>(clientFilesResponse);
                    break;
                } catch (Exception ex) {
                    Log($"Error {i + 1}/{downloadClientFilesTriesCount} on loading client files: {ex}", EventLogEntryType.Error);
                    await Task.Delay(downloadClientFilesDelayBetweenRetries);
                }
            }
            if (clientFiles != null && clientFiles.Files != null && clientFiles.Files.Length > 0) {
                // Client files were downloaded - extract them
                try {
                    Directory.CreateDirectory(pathForClientFiles);
                    ExtractClientFiles(clientFiles, pathForClientFiles);
                    clientFilesExtracted = true;
                } catch (Exception ex) {
                    Log($"Can't extract client files. Will try to use local ones if exists. Error {ex}");
                }
            }
            return clientFiles;
        }

        private void ExtractClientFiles(ClientFilesData data, string folder) {
            foreach (var item in data.Files) {
                if (!string.IsNullOrWhiteSpace(item.Base64Content)) {
                    var extractedFile = Path.Combine(folder, Guid.NewGuid().ToString());
                    extractedFile = Path.ChangeExtension(extractedFile, ".zip");
                    try {
                        var fileBytes = Convert.FromBase64String(item.Base64Content);
                        File.WriteAllBytes(extractedFile, fileBytes);
                        using (var zf = ZipFile.OpenRead(extractedFile)) {
                            foreach (var zipEntry in zf.Entries) {
                                var destinationFile = Path.Combine(folder, zipEntry.Name);
                                if (File.Exists(destinationFile)) {
                                    File.SetAttributes(destinationFile, FileAttributes.Normal);
                                }
                                zipEntry.ExtractToFile(destinationFile, true);
                            }
                        }
                    } finally {
                        try {
                            if (File.Exists(extractedFile)) {
                                File.Delete(extractedFile);
                            }
                        } catch { }
                    }
                }
            }
        }

        private void StartServerDiscovery() {
            discoverer.StartDiscovery();
        }

        private void SaveServiceConfiguration() {
            try {
                File.WriteAllText(configFileFullPath, serializer.Serialize(serviceConfig));
            } catch (Exception ex) {
                Log($"Can't save configuration: {ex}", EventLogEntryType.Error);
            }
        }

        private ServiceConfiguration GetServiceConfiguration() {
            ServiceConfiguration config;
            try {
                Log($"Loading configuration from {configFileFullPath}");
                config = serializer.Deserialize<ServiceConfiguration>(File.ReadAllText(configFileFullPath));
                if (config != null) {
                    Log($"Configuration ClientId={config.ClientId}");
                } else {
                    Log($"Configuration is null");
                }
            } catch (Exception loadEx) {
                Log($"Can't load configuration. Will create default config file: {loadEx}", EventLogEntryType.Error);
                config = new ServiceConfiguration {
                    ClientId = Guid.NewGuid().ToString()
                };
                try {
                    File.WriteAllText(configFileFullPath, serializer.Serialize(config));
                    Log($"Configuration written to {configFileFullPath}");
                    Log($"Configuration ClientId={config.ClientId}");
                } catch (Exception writeEx) {
                    // Probably no access for writing
                    Log($"Can't save configuration. It must be manually selected, otherwise new ClientId will be generated on each start-up. Error: {writeEx}", EventLogEntryType.Error);
                }
            }
            return config;
        }

        private void Log(string message, EventLogEntryType type = EventLogEntryType.Information) {
            Console.WriteLine($"{DateTime.Now}: {type}: {message}");
            if (logger != null) {
                try {
                    logger.Log(message, type);
                } catch { }
            }
        }

        private void InitializeComponent() {
            // 
            // Service
            // 
            this.CanHandleSessionChangeEvent = true;
        }
    }
}
