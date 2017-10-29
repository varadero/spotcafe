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
    }
}
