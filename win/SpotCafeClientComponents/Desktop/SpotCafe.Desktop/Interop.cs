using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Desktop {
    public class Interop {
        [DllImport("user32.dll", SetLastError = true)]
        public static extern IntPtr GetThreadDesktop(uint dwThreadId);

        [DllImport("kernel32.dll")]
        public static extern uint GetCurrentThreadId();

        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool GetUserObjectInformation(
            IntPtr hObj,
            int nIndex,
            [Out] byte[] pvInfo,
            uint nLength,
            out uint lpnLengthNeeded
        );

        public enum ObjectInformationIndex {
            UOI_NAME = 2
        }

        public static string GetProcessDesktopName() {
            var desktopHandle = GetThreadDesktop(GetCurrentThreadId());
            var pvInfo = new byte[100];
            var objInfoResult = GetUserObjectInformation(desktopHandle, (int)ObjectInformationIndex.UOI_NAME, pvInfo, (uint)pvInfo.Length, out uint lengthNeeded);
            if (!objInfoResult) {
                pvInfo = new byte[lengthNeeded];
                objInfoResult = GetUserObjectInformation(desktopHandle, (int)ObjectInformationIndex.UOI_NAME, pvInfo, (uint)pvInfo.Length, out lengthNeeded);
            }
            if (!objInfoResult || lengthNeeded < 1) {
                return null;
            }
            var desktopName = Encoding.UTF8.GetString(pvInfo, 0, (int)lengthNeeded - 1);
            return desktopName;
        }
    }
}
