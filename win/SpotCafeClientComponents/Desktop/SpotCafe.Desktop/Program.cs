﻿using System;
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
        private static Logger logger;
        private static Mutex mutex;

        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main() {
            var logFileFullPath = Path.Combine(Application.CommonAppDataPath, $"SpotCafe.Desktop.{Environment.UserName}.log.txt");
            try {
                logger = new Logger(logFileFullPath);
            } catch { }
            if (Process.GetCurrentProcess().SessionId == 0) {
                return;
            }

            Log($"Starting in session {Process.GetCurrentProcess().SessionId} of user {Environment.UserName}");

            if (!RegisterMutex()) {
                // Already running
                Log("Application is already running");
                return;
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }

        static bool RegisterMutex() {
            var appGuid = new Guid("7D23335A-9D10-4462-B1AF-A2C729C1B509");
            var mutexName = "Global\\" + appGuid;
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
