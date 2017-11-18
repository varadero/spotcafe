using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Service.WindowsRegistry {
    public class RegDataWriter {
        public void Write(IEnumerable<RegRecord> records, string keyPrefix, string currentUserSid) {
            foreach (var record in records) {
                if (string.IsNullOrEmpty(keyPrefix) || record.Key.StartsWith(keyPrefix)) {
                    WriteRecord(record, currentUserSid);
                }
            }
        }

        private void WriteRecord(RegRecord record, string currentUserSid) {
            var keyParts = record.Key.Split('\\');
            var rootKeyName = keyParts[0];
            var subKeyPath = record.Key.Substring(record.Key.IndexOf("\\") + 1);
            RegistryKey rootKey = null;
            if (keyParts[0] == "HKEY_CURRENT_USER" || keyParts[0] == "HKCU") {
                rootKey = Registry.Users;
                subKeyPath = currentUserSid + "\\" + subKeyPath;
            } else if (keyParts[0] == "HKEY_LOCAL_MACHINE" || keyParts[0] == "HKLM") {
                rootKey = Registry.LocalMachine;
            } else if (keyParts[0] == "HKEY_CLASSES_ROOT" || keyParts[0] == "HKCR") {
            } else {
            }
            if (rootKey == null) {
                return;
            }
            if (record.MustRemove) {
                rootKey.DeleteSubKeyTree(subKeyPath);
            } else {
                using (var key = rootKey.CreateSubKey(subKeyPath, RegistryKeyPermissionCheck.ReadWriteSubTree)) {
                    WriteRegItems(key, record.Items);
                }
            }
        }

        private RegistryKey OpenOrCreateSubKey(RegistryKey rootKey, string subKey) {
            var keyParts = subKey.Split('\\');
            var subPathParts = keyParts.ToArray();
            var regKey = rootKey;
            var regKeys = new List<RegistryKey>();
            foreach (string keyName in subPathParts) {
                regKey = regKey.CreateSubKey(keyName, RegistryKeyPermissionCheck.ReadWriteSubTree);
                regKeys.Add(regKey);
            }
            foreach (var createdKey in regKeys.Take(regKeys.Count - 1)) {
                createdKey.Close();
            }
            return regKey;
        }

        private void WriteRegItems(RegistryKey key, IEnumerable<RegItem> regItems) {
            if (regItems == null) {
                return;
            }
            var nonNullRegItems = regItems.Where(x => x != null);
            foreach (var regItem in nonNullRegItems) {
                if (regItem.MustRemove) {
                    key.DeleteValue(regItem.Name);
                } else if (regItem.Error == null && regItem.Kind != RegistryValueKind.Unknown && regItem.Kind != RegistryValueKind.None) {
                    if (regItem.Value != null) {
                        key.SetValue(regItem.Name, regItem.Value, regItem.Kind);
                    }
                }
            }
        }
    }
}
