using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Service {
    [DataContract]
    class ServiceConfiguration {
        [DataMember]
        public string ClientDeviceId { get; set; }
        [DataMember]
        public string ServerIp { get; set; }
        [DataMember]
        public string ServerCertificateThumbprint { get; set; }
    }
}
