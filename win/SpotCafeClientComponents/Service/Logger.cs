using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Service {
    class Logger {
        private string eventSource;

        public Logger(string eventSource) {
            this.eventSource = eventSource;
            if (!EventLog.SourceExists(eventSource)) {
                EventLog.CreateEventSource(eventSource, "Application");
            }
        }

        public void Log(string message, int eventId) {
            EventLog.WriteEntry(eventSource, message, EventLogEntryType.Information, eventId);
        }

        public void Log(string message, EventLogEntryType type, int eventId) {
            EventLog.WriteEntry(eventSource, message, type, eventId);
        }
    }
}
