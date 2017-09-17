using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Service {
    [DataContract]
    public class ClientFilesData {
        [DataMember(Name = "files")]
        public ClientFileInfo[] Files { get; set; }

        [DataMember(Name = "startupName")]
        public string StartupName { get; set; }
    }
}
