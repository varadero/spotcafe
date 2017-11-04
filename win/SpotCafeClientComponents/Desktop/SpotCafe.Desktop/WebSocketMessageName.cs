using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Desktop {
    public static class WebSocketMessageName {
        public const string Ping = "ping";
        public const string GetDrivesRequest = "get-drives-request";
        public const string GetDrivesResponse = "get-drives-response";
        public const string GetFolderItemsRequest = "get-folder-items-request";
        public const string GetFolderItemsResponse = "get-folder-items-response";
        public const string StartDevice = "start-device";
        public const string StopDevice = "stop-device";
    }
}
