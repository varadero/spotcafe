using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Desktop {
    public class ActionsUtils {
        public GetDrivesResult GetDrives() {
            var result = new GetDrivesResult();
            try {
                result.Drives = Directory.GetLogicalDrives();
            } catch { }
            return result;
        }
    }

    [DataContract]
    public class GetDrivesResult {
        [DataMember(Name = "drives")]
        public string[] Drives { get; set; }
    }
}


