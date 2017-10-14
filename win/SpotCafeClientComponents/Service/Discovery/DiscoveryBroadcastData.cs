using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Service.Discovery {
    [DataContract]
    class DiscoveryBroadcastData {
        [DataMember(Name = "clientDeviceId")]
        public string ClientDeviceId { get; set; }
        [DataMember(Name = "clientDeviceName")]
        public string ClientDeviceName { get; set; }
    }
}
