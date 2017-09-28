using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Desktop {
    public class Logger {
        private static object locker = new object();
        private string logFile;

        public Logger(string logFile) {
            this.logFile = logFile;
        }

        public void Log(string message) => Log(message, "Info");
        public void LogError(string message) => Log(message, "Error");

        private void Log(string message, string type) {
            try {
                lock (locker) {
                    File.AppendAllText(logFile, $"{DateTime.Now}: {type}: {message}{Environment.NewLine}");
                }
            } catch { }
        }

        //private void SetFullAccessToLogFile(string file) {
        //    try {
        //        File.Open(file, FileMode.OpenOrCreate).Close();
        //    } catch { }
        //    try {
        //        var fs = new FileSecurity();
        //        var fsar = new FileSystemAccessRule(
        //            new SecurityIdentifier(WellKnownSidType.WorldSid, null),
        //            FileSystemRights.FullControl,
        //            InheritanceFlags.ObjectInherit | InheritanceFlags.ContainerInherit,
        //            PropagationFlags.NoPropagateInherit, AccessControlType.Allow
        //        );
        //        fs.AddAccessRule(fsar);
        //        File.SetAccessControl(file, fs);
        //    } catch { }
        //}
    }
}
