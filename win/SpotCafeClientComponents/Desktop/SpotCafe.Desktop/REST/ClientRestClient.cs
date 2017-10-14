using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Desktop.REST {
    public class ClientRestClient : RestClientBase {
        public ClientRestClient(string serviceHost, string baseApiPath, string clientDeviceId)
            : base(serviceHost, baseApiPath, clientDeviceId) {
        }

        public async Task<LogInClientResult> LogInClient(string username, string password) {
            var req = new LogInClientRequest { Username = username, Password = password, ClientDeviceId = ClientDeviceId };
            var result = await Post<LogInClientResult>("login-client", req);
            return result;
        }
    }
}
