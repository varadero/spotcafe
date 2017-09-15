using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Service {
    class Logger {
        private static string source;

        public Logger() {
            AssemblyTitleAttribute attributes = (AssemblyTitleAttribute)Attribute.GetCustomAttribute(Assembly.GetExecutingAssembly(), typeof(AssemblyTitleAttribute), false);
            source = attributes?.Title ?? "SpotCafe.Service";
            if (!EventLog.SourceExists(source)) {
                EventLog.CreateEventSource(source, "Application");
            }
        }

        public void Log(string message, EventLogEntryType type = EventLogEntryType.Information) {
            // EventLog.WriteEntry(source, message, type);
        }
    }
}
