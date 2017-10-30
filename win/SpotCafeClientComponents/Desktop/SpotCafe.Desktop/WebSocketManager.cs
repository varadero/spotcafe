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
        public event EventHandler<WebSocketMessageReceivedEventArgs> MessageReceived;

        private WebSocketManagerState _state;

        public WebSocketManager() {
            InitializeState();
        }

        public async void Start(string baseUrl, string token) {
            _state.Uri = new Uri(baseUrl + "?token=" + token);
            try {
                await ConnectWebSocket();
            } catch { }
            StartReconnectTimer();
        }

        public void SendDrives(GetDrivesResponse data) {
            Send(WebSocketMessageName.GetDrivesResponse, data);
        }

        public void SendFolderItems(GetFolderItemsResponse data) {
            Send(WebSocketMessageName.GetFolderItemsResponse, data);
        }

        public void Send<T>(string name, T data) {
            try {
                var wsData = new WebSocketData<T> { Name = name, Payload = new WebSocketPayload<T> { Data = data } };
                var arrData = GetArraySegment(wsData);
                _state.WebSocket.SendAsync(arrData, WebSocketMessageType.Text, true, CancellationToken.None);
            } catch { }
        }

        protected virtual void OnConnected() {
            SocketEvent?.Invoke(this, new WebSocketEventArgs { Name = SocketEventName.Open });
        }

        protected virtual void OnMessage(string name, string stringData) {
            MessageReceived?.Invoke(this, new WebSocketMessageReceivedEventArgs { Name = name, StringData = stringData });
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
                            var deserialized = _state.Serializer.Deserialize<WebSocketData<object>>(data);
                            OnMessage(deserialized.Name, data);
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
                _state.PingStarted = true;
                var buffer = GetArraySegment(new WebSocketData<object> { Name = WebSocketMessageName.Ping });
                await _state.WebSocket.SendAsync(buffer, WebSocketMessageType.Text, true, new CancellationToken());
            } catch {

            } finally {
                _state.PingStarted = false;
            }
        }

        private void StartReconnectTimer() {
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
                StartReconnectTimer();
            } catch { }
        }

        private ArraySegment<byte> GetArraySegment(object data) {
            var json = GetSerializedJsonSring(data);
            var bytes = Encoding.UTF8.GetBytes(json);
            var result = new ArraySegment<byte>(bytes);
            return result;
        }

        private string GetSerializedJsonSring(object data) {
            var json = _state.Serializer.Serialize(data);
            return json;
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
        Error = 2,
        Close = 3
    }

    public class WebSocketMessageReceivedEventArgs : EventArgs {
        public string Name { get; set; }
        public string StringData { get; set; }
    }

    public class WebSocketEventArgs : EventArgs {
        public SocketEventName Name { get; set; }
        public WebSocketData<object> Data { get; set; }
    }

    [DataContract]
    public class WebSocketData<T> {
        [DataMember(Name = "name")]
        public string Name { get; set; }

        [DataMember(Name = "payload")]
        public WebSocketPayload<T> Payload { get; set; }
    }


    [DataContract]
    public class WebSocketPayload<T> {
        [DataMember(Name = "data")]
        public T Data { get; set; }

        [DataMember(Name = "error")]
        public WebSocketPayloadError Error { get; set; }
    }

    [DataContract]
    public class WebSocketPayloadError {
        [DataMember(Name = "message")]
        public string Message { get; set; }

        [DataMember(Name = "number")]
        public int Number { get; set; }
    }
}
