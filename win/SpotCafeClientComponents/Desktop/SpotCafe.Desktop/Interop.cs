using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Desktop {
    public class Interop {
        public enum ObjectInformationIndex {
            UOI_NAME = 2
        }

        //public enum DesktopAccess : uint {
        //    DESKTOP_READOBJECTS = 1
        //}

        [Flags]
        public enum DesktopAccessRights : uint {
            DESKTOP_READOBJECTS = 0x00000001,
            DESKTOP_CREATEWINDOW = 0x00000002,
            DESKTOP_CREATEMENU = 0x00000004,
            DESKTOP_HOOKCONTROL = 0x00000008,
            DESKTOP_JOURNALRECORD = 0x00000010,
            DESKTOP_JOURNALPLAYBACK = 0x00000020,
            DESKTOP_ENUMERATE = 0x00000040,
            DESKTOP_WRITEOBJECTS = 0x00000080,
            DESKTOP_SWITCHDESKTOP = 0x00000100,

            GENERIC_ALL = (DESKTOP_READOBJECTS | DESKTOP_CREATEWINDOW | DESKTOP_CREATEMENU |
                DESKTOP_HOOKCONTROL | DESKTOP_JOURNALRECORD | DESKTOP_JOURNALPLAYBACK |
                DESKTOP_ENUMERATE | DESKTOP_WRITEOBJECTS | DESKTOP_SWITCHDESKTOP)
        };

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

        [DllImport("user32.dll")]
        public static extern bool SwitchDesktop(IntPtr hDesktop);

        [DllImport("user32.dll")]
        public static extern IntPtr CreateDesktop(
            string lpszDesktop,
            IntPtr lpszDevice,
            IntPtr pDevmode,
            int dwFlags,
            DesktopAccessRights dwDesiredAccess,
            IntPtr lpsa
        );

        public static IntPtr GetInputDesktopHandle() {
            return OpenInputDesktop(0, false, (uint)DesktopAccessRights.GENERIC_ALL);
        }

        public static string GetInputDesktopName() {
            return GetDesktopName(GetInputDesktopHandle());
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
