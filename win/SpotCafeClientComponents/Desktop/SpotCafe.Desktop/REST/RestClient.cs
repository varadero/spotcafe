using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Desktop.REST {
    public class RestClient {
        private HttpClient client;
        private string baseApiPath;
        private string clientId;
        private ClientToken clientToken;
        private Serializer serializer = new Serializer();

        public RestClient(string serviceHost, string baseApiPath, string clientId) {
            this.baseApiPath = baseApiPath.EndsWith("/") ? baseApiPath : baseApiPath + "/";
            this.clientId = clientId;
            client = new HttpClient();
            var ub = new UriBuilder();
            ub.Scheme = "https";
            ub.Host = serviceHost;
            client.BaseAddress = ub.Uri;
        }

        public void SetToken(ClientToken clientToken) {
            this.clientToken = clientToken;
            this.client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", clientToken.Token);
        }

        public async Task<ClientToken> LogIn() {
            var req = new LogInRequest { ClientId = clientId };
            var body = await Post("login-device", req);
            var token = serializer.Deserialize<ClientToken>(body);
            return token;
        }

        public async Task<CurrentData> GetCurrentData() {
            return await Get<CurrentData>("client-device-current-data");
        }

        private async Task<T> Get<T>(string urlPath) {
            var response = await client.GetAsync(GetApiPath(urlPath));
            response.EnsureSuccessStatusCode();
            var body = await response.Content.ReadAsStringAsync();
            var result = serializer.Deserialize<T>(body);
            return result;
        }

        private async Task<string> Post<T>(string urlPath, T data) {
            var serialized = serializer.Serialize(data);
            var response = await client.PostAsync(GetApiPath(urlPath), new StringContent(serialized, Encoding.UTF8, "application/json"));
            response.EnsureSuccessStatusCode();
            var body = await response.Content.ReadAsStringAsync();
            return body;
        }

        private string GetApiPath(string path) {
            return this.baseApiPath + path;
        }
    }
}
