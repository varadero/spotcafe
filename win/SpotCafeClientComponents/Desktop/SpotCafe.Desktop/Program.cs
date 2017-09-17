using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace SpotCafe.Desktop {
    static class Program {
        private static Mutex mutex;
        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main() {
            if (!RegisterMutex()) {
                // Already running
                return;
            }
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }

        static bool RegisterMutex() {
            var appGuid = new Guid("7D23335A-9D10-4462-B1AF-A2C729C1B509");
            mutex = new Mutex(false, "Global\\" + appGuid, out bool createdNew);
            return createdNew;
        }
    }
}
