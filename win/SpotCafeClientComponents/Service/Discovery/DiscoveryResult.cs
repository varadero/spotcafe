using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Service.Discovery {
    [DataContract]
    class DiscoveryResult {
        [DataMember(Name = "approved")]
        public bool Approved { get; set; }
    }
}
