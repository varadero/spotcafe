using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Desktop.REST {
    [DataContract]
    public class PostStartData {
        [DataMember(Name = "clientApplicationFiles")]
        public ClientApplicationFile[] ClientApplicationFiles { get; set; }
    }

    [DataContract]
    public class ClientApplicationFile {
        [DataMember(Name = "filePath")]
        public string FilePath { get; set; }

        [DataMember(Name = "startupParameters")]
        public string StartupParameters { get; set; }

        [DataMember(Name = "applicationGroupName")]
        public string ApplicationGroupName { get; set; }

        [DataMember(Name = "description")]
        public string Description { get; set; }

        [DataMember(Name = "image")]
        public string Image { get; set; }

        [DataMember(Name = "title")]
        public string Title { get; set; }
    }
}
