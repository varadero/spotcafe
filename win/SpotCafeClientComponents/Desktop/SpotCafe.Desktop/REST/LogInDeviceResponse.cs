using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Desktop.REST {
    [DataContract]
    public class LogInDeviceResponse {
        [DataMember(Name = "deviceToken")]
        public ClientToken DeviceToken { get; set; }

        [DataMember(Name = "clientDeviceSettings")]
        public ClientDeviceSettings ClientDeviceSettings { get; set; }
    }

    [DataContract]
    public class ClientDeviceSettings {
        [DataMember(Name = "startupRegistryEntries")]
        public string StartupRegistryEntries { get; set; }
    }
}
