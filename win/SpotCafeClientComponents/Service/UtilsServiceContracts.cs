using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Service.Contracts {
    [DataContract]
    public class ExecuteActionRequest {
        [DataMember(Name = "actionId")]
        public string ActionId { get; set; }
    }

    [DataContract]
    public class ApplyRegistryDataRequest {
        [DataMember(Name = "registryData")]
        public string RegistryData { get; set; }

        [DataMember(Name = "currentUserSid")]
        public string CurrentUserSid { get; set; }
    }

    [DataContract]
    public class ApplyRegistryDataResponse {
        [DataMember(Name = "errors")]
        public string[] Errors { get; set; }
    }

    [DataContract]
    public class GetProcessesRequest {
    }

    [DataContract]
    public class GetProcessesResponse {
        [DataMember(Name = "processInfos")]
        public ProcessInfo[] ProcessInfos { get; set; }
    }

    [DataContract]
    public class KillProcessRequest {
        [DataMember(Name = "pid")]
        public int PID { get; set; }
    }

    [DataContract]
    public class KillProcessResponse {
    }

    [DataContract]
    public class ProcessInfo {
        [DataMember(Name = "name")]
        public string Name { get; set; }

        [DataMember(Name = "path")]
        public string Path { get; set; }

        [DataMember(Name = "pid")]
        public int PID { get; set; }
    }
}
