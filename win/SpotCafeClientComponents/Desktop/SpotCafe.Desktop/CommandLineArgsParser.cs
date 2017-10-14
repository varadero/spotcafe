using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Desktop {
    public class CommandLineArgsParser {
        public CommandLineArgs Parse(string[] args) {
            var result = new CommandLineArgs();
            foreach (var item in args) {
                var parts = item.Split(new string[] { "=" }, 2, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length == 2) {
                    var name = parts[0].ToLower();
                    var value = parts[1];
                    if (name == "client-device-id") {
                        result.ClientDeviceId = value;
                    } else if (name == "server-ip") {
                        result.ServerIP = value;
                    } else if (name == "server-certificate-thumbprint") {
                        result.ServerCertificateThumbprint = value;
                    }
                }
            }
            return result;
        }
    }
}
