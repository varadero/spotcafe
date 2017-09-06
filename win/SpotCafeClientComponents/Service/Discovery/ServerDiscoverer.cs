using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;

namespace SpotCafe.Service.Discovery {
    class ServerDiscoverer {
        private System.Net.Sockets.UdpClient uc;
        private string serverIp;
        private Timer discoveryTimer;
        private DiscoveryBroadcastData broadcastData;
        private bool discoveryStopped;
        private int discoverPort;

        public event EventHandler<DiscoveryDataReceivedEventArgs> DiscoveryDataReceived;

        public ServerDiscoverer(string clientId, string clientName, string serverIp) {
            this.serverIp = serverIp;
            discoverPort = 64129;
            broadcastData = new DiscoveryBroadcastData { ClientId = clientId, ClientName = clientName };
            discoveryTimer = new Timer(new TimerCallback(DiscoveryTimerCallback), null, Timeout.InfiniteTimeSpan, Timeout.InfiniteTimeSpan);
        }

        public void StartDiscovery() {
            InitUdp();
            discoveryTimer.Change(TimeSpan.FromSeconds(0), TimeSpan.FromSeconds(5));
            discoveryStopped = false;
        }

        public void StopDiscovery() {
            discoveryStopped = true;
            StopDiscoveryTimer();
        }

        protected virtual void OnDataReceived(byte[] data, IPEndPoint remoteEndpoint) {
            if (discoveryStopped) {
                return;
            }
            var handler = DiscoveryDataReceived;
            if (handler != null) {
                DiscoveryResponse discoveryResponse = null;
                try {
                    JavaScriptSerializer jsSer = new JavaScriptSerializer();
                    var text = Encoding.UTF8.GetString(data);
                    discoveryResponse = jsSer.Deserialize<DiscoveryResponse>(text);
                } catch { }
                DiscoveryDataReceived(this, new DiscoveryDataReceivedEventArgs { Response = discoveryResponse, Data = data, RemoteEndPoint = remoteEndpoint });
            }
        }

        private void StartDiscoveryTimer() {
            discoveryTimer.Change(TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(5));
        }

        private void StopDiscoveryTimer() {
            discoveryTimer.Change(Timeout.InfiniteTimeSpan, Timeout.InfiniteTimeSpan);
        }

        private void DiscoveryTimerCallback(object state) {
            StopDiscoveryTimer();
            try {
                SendData();
            } catch { }
            StartDiscoveryTimer();
        }

        private async void InitUdp() {
            var freePort = 0;
            for (var port = 64128; port < 64257; port++) {
                try {
                    uc = new System.Net.Sockets.UdpClient(port, System.Net.Sockets.AddressFamily.InterNetwork);
                    freePort = port;
                    break;
                } catch { }
            }
            if (freePort == 0) {
                uc = new System.Net.Sockets.UdpClient(0, AddressFamily.InterNetwork);
                freePort = ((IPEndPoint)uc.Client.LocalEndPoint).Port;
            }

            try {
                var udpReceiveResult = await StartReceiving();
                OnDataReceived(udpReceiveResult.Buffer, udpReceiveResult.RemoteEndPoint);
            } catch { }
        }

        private async Task<UdpReceiveResult> StartReceiving() {
            var result = await uc.ReceiveAsync();
            return result;
        }

        private void SendData() {
            JavaScriptSerializer jsSer = new JavaScriptSerializer();
            var arr = Encoding.UTF8.GetBytes(jsSer.Serialize(broadcastData));
            try {
                var host = serverIp;
                if (host == null || host.Trim().Length == 0) {
                    host = "255.255.255.255";
                }
                uc.Send(arr, arr.Length, host, discoverPort);
            } catch {
            }
        }
    }
}
