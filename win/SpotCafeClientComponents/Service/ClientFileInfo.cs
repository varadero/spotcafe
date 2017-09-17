using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Service {
    [DataContract]
    public class ClientFileInfo {
        [DataMember(Name = "name")]
        public string Name { get; set; }

        [DataMember(Name = "base64Content")]
        public string Base64Content { get; set; }
    }
}
