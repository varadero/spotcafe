using SpotCafe.Desktop.REST;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.Linq;
using System.Net;
using System.Net.Security;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace SpotCafe.Desktop {
    public partial class MainForm : Form {
        private MainFormState _state;

        public MainForm() {
            InitializeComponent();
        }

        public void Start(MainFormStartArgs args) {
            // Accept all service sertificates
            ServicePointManager.ServerCertificateValidationCallback = ServiceCertificateValidationCallback;

            InitializeState(args);
            StartSecureThread();

            // Try to log in
            LogInDevice();
        }

        private void ProcessCurrentData(CurrentData currentData) {
            if (currentData == null) {
                return;
            }
            textBox1.Text = currentData.IsStarted.ToString();
            var switched = SwitchDesktops(currentData.IsStarted);
            if (!switched) {
                Log($"Error on switching desktop: {Marshal.GetLastWin32Error()}");
            }
        }

        private bool SwitchDesktops(bool isStarted) {
#if DEBUG
            return true;
#endif
            var desktopHandle = isStarted ? _state.StartArgs.StartupDesktopHandle : _state.StartArgs.SecureDesktopHandle;
            return Interop.SwitchDesktop(desktopHandle);
        }

        private void StartSecureThread() {
            _state.SecureThread.Start(_state.SecureThreadState);
        }

        private void SecureThread(object state) {
            var threadState = (SecureThreadState)state;
            Interop.SetThreadDesktop(threadState.SecureDesktopHandle);
            threadState.SecureForm = new SecureForm();
            threadState.SecureForm.SignIn += SecureForm_SignIn;
            var secureFormStartArgs = new SecureFormStartArgs();
            threadState.SecureForm.Start(secureFormStartArgs);
            Application.Run(threadState.SecureForm);
        }

        private async void SecureForm_SignIn(object sender, SignInEventArgs e) {
            try {
                var logInRes = await _state.ClientRest.LogInClient(e.Username, e.Password);
                if (logInRes.Disabled) {
                    e.Success = false;
                    _state.SecureThreadState.SecureForm.SignInResult(false, "Client account is disabled");
                    return;
                }
                if (logInRes.ClientAlreadyInUse) {
                    e.Success = false;
                    _state.SecureThreadState.SecureForm.SignInResult(false, $"Client account already in use at {logInRes.ClientAlreadyInUseDeviceName}");
                    return;
                }
                if (logInRes.DeviceAlreadyStarted) {
                    e.Success = false;
                    _state.SecureThreadState.SecureForm.SignInResult(false, "Device already started");
                    return;
                }
                if (logInRes.NotEnoughCredit) {
                    e.Success = false;
                    _state.SecureThreadState.SecureForm.SignInResult(false, "Not enough credit");
                    return;
                }
                e.Success = true;
                _state.ClientToken = logInRes.Token;
                _state.SecureThreadState.SecureForm.SignInResult(true, "");
            } catch (Exception ex) {
                LogError($"Error on sign in: {ex}");
                _state.SecureThreadState.SecureForm.SignInResult(false, "User name or password is invalid");
            }
        }

        private async void CurrentDataTimer_Tick(object sender, EventArgs e) {
            try {
                _state.CurrentDataTimer.Stop();
                var currentData = await _state.DeviceRest.GetCurrentData();
                ProcessCurrentData(currentData);
            } catch (Exception ex) {
                LogError($"Error on getting current data: {ex}");
            } finally {
                _state.CurrentDataTimer.Start();
            }
        }

        private async void LogInDevice() {
            for (var i = 0; i < 10000; i++) {
                try {
                    _state.DeviceToken = await _state.DeviceRest.LogInDevice();
                    _state.DeviceRest.SetToken(_state.DeviceToken);
                    StartWebSocketManager(_state.DeviceToken.Token);
                    CurrentDataTimer_Tick(_state.CurrentDataTimer, EventArgs.Empty);
                    StartCurrentDataTimer();
                    break;
                } catch (Exception ex) {
                    LogError($"Error logging in: {ex}");
                    await Task.Delay(TimeSpan.FromSeconds(5));
                }
            }
        }

        private void StartWebSocketManager(string token) {
            if (_state.WebSocketManager != null) {
                _state.WebSocketManager = null;
            }
            var wssAddr = $"wss://{_state.StartArgs.CommandLineArguments.ServerIP}/api/websocket";
            _state.WebSocketManager = new WebSocketManager();
            _state.WebSocketManager.Start(wssAddr, _state.DeviceToken.Token, true, false);
            _state.WebSocketManager.SocketEvent += WebSocketManager_SocketEvent;
        }

        private void WebSocketManager_SocketEvent(object sender, WebSocketEventArgs e) {
            Log($"WebSocket event: {e.Name}");
            if (e.Name == SocketEventName.Message) {
                Log($"WebSocket message: {e.Data.Name}");
                if (e.Data.Name == "get-folder-content") {
                    var folderName = (string)e.Data.Data;
                }
            }
        }

        private void StartCurrentDataTimer() {
            _state.CurrentDataTimer.Start();
        }

        private bool ServiceCertificateValidationCallback(object sender, X509Certificate certificate, X509Chain chain, SslPolicyErrors sslPolicyErrors) {
            var thumbprintArg = _state.StartArgs.CommandLineArguments.ServerCertificateThumbprint;
            if (!string.IsNullOrWhiteSpace(thumbprintArg)) {
                var certThumbprint = certificate.GetCertHashString();
                if (certThumbprint != thumbprintArg) {
                    LogError($"Certificate thumbprint {certThumbprint} does not match configuration thumbprint {thumbprintArg}");
                    return false;
                }
            }
            return true;
        }

        private void Log(string message) {
            _state.Logger.Log(message);
        }

        private void LogError(string message) {
            _state.Logger.LogError(message);
        }

        protected override void OnFormClosing(FormClosingEventArgs e) {
            var secureForm = _state.SecureThreadState?.SecureForm;
            if (secureForm != null) {
                try {
                    secureForm.Invoke((MethodInvoker)delegate {
                        secureForm.Close();
                    });
                } catch (Exception ex) {
                    LogError($"Can't close secure form: {ex}");
                }
            }
            base.OnFormClosing(e);
        }

        private void InitializeState(MainFormStartArgs args) {
            _state = new MainFormState();
            _state.StartArgs = args;
            _state.Logger = args.Logger;

            // Poll timer for current data (which contains isStarted flag etc.)
            _state.CurrentDataTimer = new System.Windows.Forms.Timer();
            _state.CurrentDataTimer.Interval = (int)TimeSpan.FromSeconds(5).TotalMilliseconds;
            _state.CurrentDataTimer.Tick += CurrentDataTimer_Tick;

            // REST clients for communication with the server
            _state.DeviceRest = new DeviceRestClient(_state.StartArgs.CommandLineArguments.ServerIP, "api", _state.StartArgs.CommandLineArguments.ClientDeviceId);
            _state.ClientRest = new ClientRestClient(_state.StartArgs.CommandLineArguments.ServerIP, "api", _state.StartArgs.CommandLineArguments.ClientDeviceId);

            _state.SecureThreadState = new SecureThreadState();
            _state.SecureThreadState.SecureDesktopHandle = _state.StartArgs.SecureDesktopHandle;
            _state.SecureThread = new Thread(new ParameterizedThreadStart(SecureThread));
        }

        private class MainFormState {
            public ClientToken DeviceToken { get; set; }
            public DeviceRestClient DeviceRest { get; set; }
            public ClientToken ClientToken { get; set; }
            public ClientRestClient ClientRest { get; set; }
            public Logger Logger { get; set; }
            public System.Windows.Forms.Timer CurrentDataTimer { get; set; }
            public Thread SecureThread { get; set; }
            public MainFormStartArgs StartArgs { get; set; }
            public SecureThreadState SecureThreadState { get; set; }
            public WebSocketManager WebSocketManager { get; set; }
        }

        private class SecureThreadState {
            public SecureForm SecureForm { get; set; }
            public IntPtr SecureDesktopHandle { get; set; }
        }
    }
}