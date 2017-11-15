using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Desktop.REST {
    public class RestClientBase {
        protected string ClientDeviceId { get; set; }
        protected Serializer Serializer = new Serializer();

        private HttpClient client;
        private string baseApiPath;
        private ClientToken token;

        public RestClientBase(string serviceHost, string baseApiPath, string clientDeviceId) {
            this.baseApiPath = baseApiPath.EndsWith("/") ? baseApiPath : baseApiPath + "/";
            this.ClientDeviceId = clientDeviceId;
            client = new HttpClient();
            client.DefaultRequestHeaders.Add("Connection", "close");
            var ub = new UriBuilder();
            ub.Scheme = "https";
            ub.Host = serviceHost;
            client.BaseAddress = ub.Uri;
        }

        public void SetToken(ClientToken token) {
            this.token = token;
            this.client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token.Token);
        }

        protected async Task<T> Get<T>(string urlPath) {
            var response = await client.GetAsync(GetApiPath(urlPath));
            response.EnsureSuccessStatusCode();
            var body = await response.Content.ReadAsStringAsync();
            var result = Serializer.Deserialize<T>(body);
            return result;
        }

        protected async Task<T> Post<T>(string urlPath, object data) {
            var serialized = Serializer.Serialize(data);
            var response = await client.PostAsync(GetApiPath(urlPath), new StringContent(serialized, Encoding.UTF8, "application/json"));
            response.EnsureSuccessStatusCode();
            var body = await response.Content.ReadAsStringAsync();
            var result = Serializer.Deserialize<T>(body);
            return result;
        }

        private string GetApiPath(string path) {
            return this.baseApiPath + path;
        }
    }
}
