using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Desktop.REST {
    [DataContract]
    public class ClientToken {
        [DataMember(Name = "expiresIn")]
        public int ExpiresIn { get; set; }

        [DataMember(Name = "permissions")]
        public string Permissions { get; set; }

        [DataMember(Name = "token")]
        public string Token { get; set; }
    }
}
