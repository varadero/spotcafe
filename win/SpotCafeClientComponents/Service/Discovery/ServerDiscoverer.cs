using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace SpotCafe.Service.Discovery {
    class ServerDiscoverer {
        public event EventHandler<DiscoveryDataReceivedEventArgs> DiscoveryDataReceived;

        private System.Net.Sockets.UdpClient uc;
        private string serverIp;
        private Timer discoveryTimer;
        private DiscoveryBroadcastData broadcastData;
        private bool discoveryStopped;
        private int discoverPort;
        private Serializer serializer;
        private TimeSpan searchInterval;

        public ServerDiscoverer(string clientId, string clientName, string serverIp, TimeSpan searchInterval) {
            serializer = new Serializer();
            this.serverIp = serverIp;
            this.searchInterval = searchInterval;
            discoverPort = 64129;
            broadcastData = new DiscoveryBroadcastData { ClientId = clientId, ClientName = clientName };
            discoveryTimer = new Timer(new TimerCallback(DiscoveryTimerCallback), null, Timeout.InfiniteTimeSpan, Timeout.InfiniteTimeSpan);
        }

        public void StartDiscovery() {
            InitUdp();
            discoveryTimer.Change(TimeSpan.FromSeconds(0), searchInterval);
            discoveryStopped = false;
        }

        public void StopDiscovery() {
            discoveryStopped = true;
            StopDiscoveryTimer();
        }

        protected async virtual void OnDataReceived(byte[] data, IPEndPoint remoteEndpoint) {
            if (discoveryStopped) {
                return;
            }
            var handler = DiscoveryDataReceived;
            if (handler != null) {
                DiscoveryResponse discoveryResponse = null;
                try {
                    var text = Encoding.UTF8.GetString(data);
                    discoveryResponse = serializer.Deserialize<DiscoveryResponse>(text);
                } catch { }
                var args = new DiscoveryDataReceivedEventArgs { Response = discoveryResponse, Data = data, RemoteEndPoint = remoteEndpoint };
                DiscoveryDataReceived(this, args);
                if (!args.StopDiscover) {
                    try {
                        await StartReceiving();
                    } catch { }
                } else {
                    StopDiscovery();
                }
            }
        }

        private void StartDiscoveryTimer() {
            discoveryTimer.Change(searchInterval, searchInterval);
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
                await StartReceiving();
            } catch { }
        }

        private async Task<UdpReceiveResult> StartReceiving() {
            var result = await uc.ReceiveAsync();
            OnDataReceived(result.Buffer, result.RemoteEndPoint);
            return result;
        }

        private void SendData() {
            var arr = Encoding.UTF8.GetBytes(serializer.Serialize(broadcastData));
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
