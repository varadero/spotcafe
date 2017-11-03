using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Desktop {
    public class ActionsUtils {
        public GetDrivesResponse GetDrives() {
            var result = new GetDrivesResponse();
            try {
                result.Drives = Directory.GetLogicalDrives();
            } catch { }
            return result;
        }

        public GetFolderItemsResponse GetFolderItems(string folder, string subFolder, string[] pathSegments, string searchPattern) {
            var result = new GetFolderItemsResponse();
            try {
                if (pathSegments != null && pathSegments.Length > 0) {
                    var nonemptySegments = pathSegments.Where(x => !string.IsNullOrWhiteSpace(x)).ToArray();
                    folder = string.Join(Path.DirectorySeparatorChar.ToString(), nonemptySegments) + Path.DirectorySeparatorChar.ToString();
                    subFolder = "";
                }
                var fullPath = Path.Combine(folder, subFolder ?? "");
                result.Folder = fullPath;
                result.PathSegments = fullPath.Split(new char[] { Path.DirectorySeparatorChar }, StringSplitOptions.RemoveEmptyEntries);
                var dirs = Directory.EnumerateDirectories(fullPath)
                    .Select(x => Path.GetFileName(x)).OrderBy(x => x).ToArray();
                var files = Directory.EnumerateFiles(fullPath, searchPattern ?? "*.*")
                    .Select(x => Path.GetFileName(x)).OrderBy(x => x).ToArray();
                result.Directories = dirs;
                result.Files = files;
                result.Success = true;
            } catch { }
            return result;
        }
    }

    [DataContract]
    public class GetDrivesResponse {
        [DataMember(Name = "drives")]
        public string[] Drives { get; set; }
    }

    [DataContract]
    public class GetFolderItemsRequest {
        [DataMember(Name = "folder")]
        public string Folder { get; set; }

        [DataMember(Name = "pathSegments")]
        public string[] PathSegments { get; set; }

        [DataMember(Name = "subFolder")]
        public string SubFolder { get; set; }

        [DataMember(Name = "searchPattern")]
        public string SearchPattern { get; set; }
    }

    [DataContract]
    public class GetFolderItemsResponse {
        [DataMember(Name = "pathSegments")]
        public string[] PathSegments { get; set; }

        [DataMember(Name = "folder")]
        public string Folder { get; set; }

        [DataMember(Name = "directories")]
        public string[] Directories { get; set; }

        [DataMember(Name = "files")]
        public string[] Files { get; set; }

        [DataMember(Name = "success")]
        public bool Success { get; set; }
    }
}


