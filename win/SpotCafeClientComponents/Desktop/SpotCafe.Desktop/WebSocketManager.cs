using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.WebSockets;
using System.Runtime.Serialization;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace SpotCafe.Desktop {
    public class WebSocketManager {
        public event EventHandler<WebSocketEventArgs> SocketEvent;

        private WebSocketManagerState _state;

        public WebSocketManager() {
            InitializeState();
        }

        public async void Start(string baseUrl, string token, bool reconnectOnClose, bool reconnectOnError) {
            _state.ReconnectOnClose = reconnectOnClose;
            _state.ReconnectOnError = reconnectOnError;
            _state.Uri = new Uri(baseUrl + "?token=" + token);
            await ConnectWebSocket();
        }

        protected virtual void OnConnected() {
            SocketEvent?.Invoke(this, new WebSocketEventArgs { Name = SocketEventName.Open });
        }

        protected virtual void OnMessage(WebSocketData data) {
            SocketEvent?.Invoke(this, new WebSocketEventArgs { Name = SocketEventName.Message, Data = data });
        }

        private async Task ConnectWebSocket() {
            var ws = new ClientWebSocket();
            try {
                await ws.ConnectAsync(_state.Uri, CancellationToken.None);
                _state.WebSocket = ws;
                StartReceiving();
                StartPinging();
                OnConnected();
            } catch (Exception) {

            }
        }

        private async void StartReceiving() {
            var buffer = new ArraySegment<byte>(new Byte[8192]);

            WebSocketReceiveResult result = null;
            bool closed = false;

            using (var ms = new MemoryStream()) {
                do {
                    try {
                        result = await _state.WebSocket.ReceiveAsync(buffer, CancellationToken.None);
                        if (result.CloseStatus != null) {
                            closed = true;
                            break;
                        } else {
                            ms.Write(buffer.Array, buffer.Offset, result.Count);
                        }
                    } catch {
                        closed = true;
                        break;
                    }
                }
                while (!result.EndOfMessage);

                if (!closed) {
                    try {
                        ms.Seek(0, SeekOrigin.Begin);
                        if (result.MessageType == WebSocketMessageType.Text) {
                            var data = Encoding.UTF8.GetString(ms.ToArray());
                            var deserialized = _state.Serializer.Deserialize<WebSocketData>(data);
                            OnMessage(deserialized);
                        } else if (result.MessageType == WebSocketMessageType.Binary) {
                            // Still don't have binary messages
                        }
                    } catch {
                    } finally {
                        StartReceiving();
                    }
                }
            }
        }

        private void Dispose() {
            try {
                StopPinging();
                _state.ReconnectTimer.Change(Timeout.InfiniteTimeSpan, Timeout.InfiniteTimeSpan);
                if (_state.WebSocket != null) {
                    _state.WebSocket.Abort();
                    _state.WebSocket.Dispose();
                    _state.WebSocket = null;
                }
            } catch (Exception) {
            }
        }

        private void StartPinging() {
            StopPinging();
            _state.PingTimer.Change(_state.PingTimerInterval, _state.PingTimerInterval);
        }

        private void StopPinging() {
            _state.PingTimer.Change(Timeout.InfiniteTimeSpan, Timeout.InfiniteTimeSpan);
        }

        private async void PingTimerCallback(object state) {
            if (_state.PingStarted) {
                return;
            }
            try {
                var buffer = GetArraySegment(new WebSocketData { Name = "ping" });
                await _state.WebSocket.SendAsync(buffer, WebSocketMessageType.Text, true, new CancellationToken());
            } catch {

            } finally {
                _state.PingStarted = false;
            }
        }

        private void StarReconnectTimer() {
            _state.ReconnectTimer.Change(_state.ReconnectTimerInterval, _state.ReconnectTimerInterval);
        }

        private void ReconnectTimerCallback(object state) {
            try {
                if (_state.WebSocket != null) {
                    if (_state.WebSocket.State == WebSocketState.Open
                        || _state.WebSocket.State == WebSocketState.Connecting) {
                        // Already opened or connecting - don't try to reconnect such connection
                        return;
                    }
                }
                Dispose();
                ConnectWebSocket();
            } catch { }
        }

        private ArraySegment<byte> GetArraySegment(WebSocketData data) {
            var json = _state.Serializer.Serialize(data);
            var bytes = Encoding.UTF8.GetBytes(json);
            var result = new ArraySegment<byte>(bytes);
            return result;
        }

        private void InitializeState() {
            _state = new WebSocketManagerState();
            _state.PingTimer = new Timer(PingTimerCallback);
            _state.PingTimerInterval = TimeSpan.FromSeconds(10);
            _state.ReconnectTimer = new Timer(ReconnectTimerCallback);
            _state.ReconnectTimerInterval = TimeSpan.FromSeconds(3);
            _state.Serializer = new Serializer();
        }

        private class WebSocketManagerState {
            public bool ReconnectOnClose { get; set; }
            public bool ReconnectOnError { get; set; }
            public Uri Uri { get; set; }
            public ClientWebSocket WebSocket { get; set; }
            public Timer PingTimer { get; set; }
            public TimeSpan PingTimerInterval { get; set; }
            public bool PingStarted { get; set; }
            public Timer ReconnectTimer { get; set; }
            public TimeSpan ReconnectTimerInterval { get; set; }
            public Serializer Serializer { get; set; }
        }
    }

    public enum SocketEventName {
        Unknown = 0,
        Open = 1,
        Message = 2,
        Error = 3,
        Close = 4
    }

    public class WebSocketEventArgs : EventArgs {
        public SocketEventName Name { get; set; }
        public WebSocketData Data { get; set; }
    }

    [DataContract]
    public class WebSocketData {
        [DataMember(Name = "name")]
        public string Name { get; set; }

        [DataMember(Name = "data")]
        public object Data { get; set; }
    }
}
