using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Desktop.REST {
    [DataContract]
    public class LogInRequest {
        [DataMember(Name = "clientId")]
        public string ClientId { get; set; }
    }
}
