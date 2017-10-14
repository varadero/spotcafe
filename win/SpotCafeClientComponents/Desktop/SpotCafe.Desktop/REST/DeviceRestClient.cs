using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Desktop.REST {
    public class DeviceRestClient : RestClientBase {
        public DeviceRestClient(string serviceHost, string baseApiPath, string clientDeviceId)
            : base(serviceHost, baseApiPath, clientDeviceId) {
        }


        public async Task<ClientToken> LogInDevice() {
            var req = new LogInDeviceRequest { ClientDeviceId = ClientDeviceId };
            var result = await Post<ClientToken>("login-device", req);
            return result;
        }

        public async Task<CurrentData> GetCurrentData() {
            return await Get<CurrentData>("client-device-current-data");
        }
    }
}
