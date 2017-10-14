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
using System.Threading;
using System.Threading.Tasks;

namespace SpotCafe.Service {
    class Service : ServiceBase {
        public static readonly string Name = "SpotCafe Service";

        private Logger logger;
        private ServerDiscoverer discoverer;
        private string configFileFullPath;
        private ServiceConfiguration serviceConfig;
        private IPEndPoint remoteEndPoint;
        private Serializer serializer;
        private const int downloadClientFilesTriesCount = 10;
        private TimeSpan downloadClientFilesDelayBetweenRetries = TimeSpan.FromSeconds(6);
        private ClientStartupData clientStartupData = null;
        private const string clientFileNameToStart = "SpotCafe.Desktop.exe";
        private string clientAppFullPath;
        private string pathForClientFiles;
        private SessionChangeDescription lastSessionChangeDescription;
        private Interop.PROCESS_INFORMATION lastSuccessClientAppExecuteResult;
        private bool useConsoleSession = false;
        private bool clientFilesExtracted;
        private Timer keepClientAppAliveTimer;
        private TimeSpan keepClientAppAliveTimerInterval = TimeSpan.FromSeconds(10);
        private const string clientAppMutexName = @"Global\7D23335A-9D10-4462-B1AF-A2C729C1B509";
        private TimeSpan discoverySearchInterval = TimeSpan.FromSeconds(10);

        public Service() {
            InitializeComponent();
            keepClientAppAliveTimer = new Timer(new TimerCallback(KeepClientAppAlive));
            base.ServiceName = Name;
        }

        public void Start(string[] args) {
            OnStart(args);
        }

        protected override void OnStart(string[] args) {
            serializer = new Serializer();
            try {
                logger = new Logger(Name);
            } catch (Exception ex) {
                Console.WriteLine($"Error when creating logger: {ex}");
            }
            ServicePointManager.ServerCertificateValidationCallback = ServiceCertificateValidationCallback;
            var interop = new Interop();
            if (args != null && args.Length > 0) {
                var argsText = string.Join(" ", args);
                Log($"Starting up with arguments {argsText}", LogEventIds.StartingUpWithArguments);
                useConsoleSession = args.Contains("/use-console-session");
            } else {
                Log("Starting up without arguments", LogEventIds.StartingUpWithoutArguments);
            }

            configFileFullPath = Path.GetFullPath("SpotCafe.Service.Configuration.json");
            pathForClientFiles = Path.GetFullPath("SpotCafeClientFiles");
            Log($"Config file: {configFileFullPath} ; path for client files: {pathForClientFiles}", LogEventIds.ConfigFile);

            serviceConfig = GetServiceConfiguration();
            discoverer = new ServerDiscoverer(serviceConfig.ClientDeviceId, Environment.MachineName, serviceConfig.ServerIp, discoverySearchInterval);
            discoverer.DiscoveryDataReceived += Discoverer_DataReceived;
            StartServerDiscovery();
            base.OnStart(args);
        }

        protected override void OnSessionChange(SessionChangeDescription changeDescription) {
            lastSessionChangeDescription = changeDescription;
            Log($"Session change Reason={changeDescription.Reason} SessionID={changeDescription.SessionId}", LogEventIds.SessionChange);
            if (clientFilesExtracted) {
                ExecuteStartupClientFileIfLoggedIn();
            } else {
                LogWarning($"Client files still not extracted", LogEventIds.ClienFilesStillNotExtracted);
            }
            base.OnSessionChange(changeDescription);
        }

        protected override void OnStop() {
            Log("Stopping", LogEventIds.Stopping);
            base.OnStop();
        }

        protected override void OnShutdown() {
            Log("Shutting down", LogEventIds.ShuttingDown);
            base.OnShutdown();
        }

        private void ExecuteStartupClientFileIfLoggedIn() {
#if DEBUG
            if (string.Equals(Environment.MachineName, "svincho", StringComparison.OrdinalIgnoreCase)) {
                return;
            }
#endif
            // TODO Execute startup client file also if the service is started while the user is already logged in...
            uint sessionId = 0;
            if (useConsoleSession) {
                sessionId = Interop.WTSGetActiveConsoleSessionId();
            } else {
                if (IsSessionChangeReasonShouldStartClientApp(lastSessionChangeDescription)) {
                    sessionId = (uint)lastSessionChangeDescription.SessionId;
                }
            }
            if (sessionId > 0) {
                // TODO
                // When user is switched, a new session is created user selection screen
                // This session is created only for user selection screen and it seems that all applications created in that session
                // Are "moved" to their parent process session when the user logs in
                // We shouldn't create anything in that session - probably by allowing only one instance of client file
                // Until we find a way to detect such sessions, we will rely on single-instance logic of the client app
                // This will make our lastClientAppExecuteResult invalid
                Log($"Executing {clientAppFullPath} on session {sessionId}", LogEventIds.ExecutingClientApp);
                var procInfo = ExecuteProcessOnLoggedUserDesktop(sessionId, clientAppFullPath);
                if (procInfo.dwProcessId != 0) {
                    lastSuccessClientAppExecuteResult = procInfo;
                    Log($"App execute result: ProcessId={procInfo.dwProcessId}", LogEventIds.ClientAppExecuteResult);
                } else {
                    LogError($"App execute failed. Last error number {Marshal.GetLastWin32Error()} and HRESULT {Marshal.GetHRForLastWin32Error()}", LogEventIds.ClientAppExecutionFailed);
                }
            }
            // Start a timer to check if the client Mutex exists and if not - call this method again 
            StartKeepClientAppAliveTimer();
        }

        private void KeepClientAppAlive(object state) {
            StopKeepClientAppAliveTimer();
            try {
                var mutex = Mutex.OpenExisting(clientAppMutexName);
                mutex.Dispose();
            } catch (WaitHandleCannotBeOpenedException) {
                LogWarning($"Client mutex not found", LogEventIds.ClientAppMutexNotFound);
                ExecuteStartupClientFileIfLoggedIn();
                return;
            } catch (Exception ex) {
                LogError($"Error on opening client application mutex: {ex}", LogEventIds.ClientAppMutexOpenError);
            }
            StartKeepClientAppAliveTimer();
        }

        private void StartKeepClientAppAliveTimer() {
            keepClientAppAliveTimer.Change(keepClientAppAliveTimerInterval, keepClientAppAliveTimerInterval);
        }

        private void StopKeepClientAppAliveTimer() {
            keepClientAppAliveTimer.Change(Timeout.InfiniteTimeSpan, Timeout.InfiniteTimeSpan);
        }

        private bool ServiceCertificateValidationCallback(object sender, X509Certificate certificate, X509Chain chain, SslPolicyErrors sslPolicyErrors) {
            if (!string.IsNullOrWhiteSpace(serviceConfig.ServerCertificateThumbprint)) {
                var certThumbprint = certificate.GetCertHashString();
                if (certThumbprint != serviceConfig.ServerCertificateThumbprint) {
                    LogError($"Certificate thumbprint {certThumbprint} does not match configuration thumbprint {serviceConfig.ServerCertificateThumbprint}", LogEventIds.ServiceCertificateThumbprintError);
                    return false;
                }
            }
            return true;
        }

        private async void Discoverer_DataReceived(object sender, DiscoveryDataReceivedEventArgs e) {
            var text = Encoding.UTF8.GetString(e.Data);
            Log($"Discovery data received from {e.RemoteEndPoint.Address}: {text}", LogEventIds.DataReceivedFromDiscoverer);
            try {
                // If data contains necessary information - stop further discovering
                if (e.Response != null && e.Response.Approved) {
                    e.StopDiscover = true;
                    discoverer.StopDiscovery();
                    remoteEndPoint = e.RemoteEndPoint;
                    clientStartupData = await DownloadClientFiles();
                    var clientFiles = clientStartupData?.ClientFiles;
                    if (clientFiles != null) {
                        var appToRun = (clientFiles != null && !string.IsNullOrWhiteSpace(clientFiles.StartupName)) ? clientFiles.StartupName : clientFileNameToStart;
                        clientAppFullPath = Path.Combine(pathForClientFiles, appToRun);
                        ExecuteStartupClientFileIfLoggedIn();
                    } else {
                        LogError("No startup data received from the server", LogEventIds.NoStartupDataReceived);
                    }
                }
            } catch (Exception ex) {
                LogError($"Discovery data is not a valid JSON: {ex}", LogEventIds.DiscoveryDataNotValidJson);
            }
        }

        private bool IsSessionChangeReasonShouldStartClientApp(SessionChangeDescription changeDescription) {
            var reasons = new SessionChangeReason[] {
                SessionChangeReason.SessionLogon,
                SessionChangeReason.ConsoleConnect,
                SessionChangeReason.RemoteConnect,
                SessionChangeReason.SessionUnlock
            };
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
            var serverIp = serviceConfig.ServerIp;
            if (string.IsNullOrWhiteSpace(serverIp)) {
                serverIp = remoteEndPoint.Address.ToString();
            }

            Interop.CreateProcessAsUser(
                duplicatedToken,
                appName,
                $"client-device-id={serviceConfig.ClientDeviceId} server-ip={serverIp} server-certificate-thumbprint={serviceConfig.ServerCertificateThumbprint}",
                ref sa,
                ref sa,
                false,
                dwCreationFlags,
                IntPtr.Zero,
                null,
                ref si,
                out Interop.PROCESS_INFORMATION pi
            );
            return pi;
        }

        private async Task<ClientStartupData> DownloadClientFiles() {
            var serviceHost = remoteEndPoint.Address.ToString();
            var client = new RestClient(serviceHost, "api");
            ClientStartupData clientStartupDataResult = null;
            for (var i = 0; i < downloadClientFilesTriesCount; i++) {
                try {
                    Log($"Downloading client files from {serviceHost}", LogEventIds.DownloadingClientFiles);
                    var clientStartupDataResponse = await client.GetClientStartupData();
                    clientStartupDataResult = serializer.Deserialize<ClientStartupData>(clientStartupDataResponse);
                    break;
                } catch (Exception ex) {
                    LogError($"Error {i + 1}/{downloadClientFilesTriesCount} on loading client files: {ex}", LogEventIds.ErrorDownloadingClientFiles);
                    await Task.Delay(downloadClientFilesDelayBetweenRetries);
                }
            }
            var clientFiles = clientStartupDataResult?.ClientFiles;
            if (clientFiles != null && clientFiles.Files != null && clientFiles.Files.Length > 0) {
                // Client files were downloaded - extract them
                try {
                    Log($"Extracting client files to {pathForClientFiles}", LogEventIds.ExtractingClientFiles);
                    Directory.CreateDirectory(pathForClientFiles);
                    ExtractClientFiles(clientFiles, pathForClientFiles);
                    clientFilesExtracted = true;
                } catch (Exception ex) {
                    // TODO Implement using existing files on client files extraction error
                    LogError($"Can't extract client files. Will try to use local ones if exists. Error {ex}", LogEventIds.ExtractingClientFiles);
                }
            } else {
                LogError("There is no client files data", LogEventIds.DownloadingClientFiles);
            }
            return clientStartupDataResult;
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
            Log("Starting server discovery", LogEventIds.StartServerDiscovery);
            discoverer.StartDiscovery();
        }

        private void SaveServiceConfiguration(ServiceConfiguration config) {
            try {
                File.WriteAllText(configFileFullPath, serializer.Serialize(config));
                Log($"Configuration written to {configFileFullPath} with ClientDeviceId={config.ClientDeviceId}", LogEventIds.SaveServiceConfiguration);
            } catch (Exception ex) {
                LogError($"Can't save configuration. It must be manually selected, otherwise new ClientDeviecId will be generated on each start-up. Error: {ex}", LogEventIds.SaveServiceConfigurationError);
            }
        }

        private ServiceConfiguration GetServiceConfiguration() {
            ServiceConfiguration config;
            try {
                Log($"Loading service configuration from {configFileFullPath}", LogEventIds.LoadingServiceConfiguration);
                config = serializer.Deserialize<ServiceConfiguration>(File.ReadAllText(configFileFullPath));
                if (config != null && !string.IsNullOrWhiteSpace(config.ClientDeviceId)) {
                    Log($"Configuration ClientDeviceId={config.ClientDeviceId}", LogEventIds.LoadingServiceConfiguration);
                } else {
                    LogWarning($"Configuration is null or ClientDeviceId is missing", LogEventIds.LoadingServiceConfiguration);
                    if (config == null) {
                        config = new ServiceConfiguration();
                    }
                    config.ClientDeviceId = Guid.NewGuid().ToString();
                    SaveServiceConfiguration(config);
                }
            } catch (Exception loadEx) {
                LogWarning($"Can't load configuration. Will create default config file: {loadEx}", LogEventIds.LoadingServiceConfiguration);
                config = new ServiceConfiguration {
                    ClientDeviceId = Guid.NewGuid().ToString()
                };
                SaveServiceConfiguration(config);
            }
            return config;
        }

        private void Log(string message, EventLogEntryType type, int eventId) {
            Console.WriteLine($"{DateTime.Now}: {type}: {message}");
            if (logger != null) {
                try {
                    logger.Log(message, type, eventId);
                } catch { }
            }
        }

        private void Log(string message, int eventId) {
            Log(message, EventLogEntryType.Information, eventId);
        }

        private void LogError(string message, int eventId) {
            Log(message, EventLogEntryType.Error, eventId);
        }

        private void LogWarning(string message, int eventId) {
            Log(message, EventLogEntryType.Warning, eventId);
        }

        private void InitializeComponent() {
            // 
            // Service
            // 
            CanHandleSessionChangeEvent = true;
        }
    }
}
