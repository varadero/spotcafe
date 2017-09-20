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

        [DllImport("user32.dll", SetLastError = true)]
        static extern IntPtr OpenInputDesktop(uint dwFlags, bool fInherit, uint dwDesiredAccess);

        public enum ObjectInformationIndex {
            UOI_NAME = 2
        }

        public enum DesktopAccess : uint {
            DESKTOP_READOBJECTS = 1
        }

        public static string GetInputDesktopName() {
            var inputDesktopHandle = OpenInputDesktop(0, false, (uint)DesktopAccess.DESKTOP_READOBJECTS);
            return GetDesktopName(inputDesktopHandle);
        }

        public static string GetProcessDesktopName() {
            var desktopHandle = GetThreadDesktop(GetCurrentThreadId());
            return GetDesktopName(desktopHandle);
        }

        public static string GetDesktopName(IntPtr desktopHandle) {
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
