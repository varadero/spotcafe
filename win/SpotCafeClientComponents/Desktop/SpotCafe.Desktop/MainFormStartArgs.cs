using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Desktop {
    public class MainFormStartArgs {
        public IntPtr StartupDesktopHandle { get; set; }
        public IntPtr SecureDesktopHandle { get; set; }
        public Logger Logger { get; set; }
        public CommandLineArgs CommandLineArguments { get; set; }
    }
}
