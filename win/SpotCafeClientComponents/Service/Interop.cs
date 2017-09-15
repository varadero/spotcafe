using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Security.Principal;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Service {
    class Interop {
        public WindowsIdentity GetCurrentWindowsIdentity() {
            return WindowsIdentity.GetCurrent(TokenAccessLevels.AllAccess);
        }
    }
}
