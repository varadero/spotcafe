using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Service {
    public class LogEventIds {
        public const int StartingUpWithArguments = 1;
        public const int StartingUpWithoutArguments = 2;
        public const int ConfigFile = 3;
        //public const int PathForClientFiles = 4;
        public const int SessionChange = 5;
        public const int ClienFilesStillNotExtracted = 6;
        public const int Stopping = 7;
        public const int ShuttingDown = 8;
        public const int ExecutingClientApp = 9;
        public const int ClientAppExecuteResult = 10;
        public const int ClientAppExecutionFailed = 11;
        public const int ClientAppMutexNotFound = 12;
        public const int ClientAppMutexOpenError = 13;
        public const int ServiceCertificateThumbprintError = 14;
        public const int DataReceivedFromDiscoverer = 15;
        public const int DiscoveryDataNotValidJson = 16;
        public const int ErrorDownloadingClientFiles = 17;
        public const int ExtractingClientFiles = 18;
        public const int SaveServiceConfiguration = 19;
        public const int SaveServiceConfigurationError = 20;
        public const int LoadingServiceConfiguration = 21;
        public const int DownloadingClientFiles = 22;
        public const int StartServerDiscovery = 23;
        public const int NoStartupDataReceived = 24;
    }
}
