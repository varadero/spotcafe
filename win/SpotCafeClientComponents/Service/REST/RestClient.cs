﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Service.REST {
    public class RestClient {
        private HttpClient client;
        private string baseApiPath;

        public RestClient(string serviceHost, string baseApiPath) {
            this.baseApiPath = baseApiPath.EndsWith("/") ? baseApiPath : baseApiPath + "/";
            client = new HttpClient();
            var ub = new UriBuilder();
            ub.Scheme = "https";
            ub.Host = serviceHost;
            client.BaseAddress = ub.Uri;
        }

        public async Task<string> GetClientFiles() {
            var response = await client.GetAsync(GetApiPath("client-files"));
            response.EnsureSuccessStatusCode();
            var body = await response.Content.ReadAsStringAsync();
            return body;
        }

        private string GetApiPath(string path) {
            return this.baseApiPath + path;
        }
    }
}
