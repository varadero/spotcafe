using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Desktop.REST {
    [DataContract]
    public class LogInClientRequest {
        [DataMember(Name = "username")]
        public string Username { get; set; }

        [DataMember(Name = "password")]
        public string Password { get; set; }

        // TODO Chane this to token that will come from the service
        [DataMember(Name = "clientDeviceId")]
        public string ClientDeviceId { get; set; }
    }
}
