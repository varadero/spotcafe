#if DEBUG
//you have nothing to do here but c# requires it
#else
#define NOT_DEBUG //define a symbol specifying a non debug environment
#endif

using SpotCafe.Desktop.REST;
using SpotCafe.Service.Contracts;
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
using System.Security.Principal;
using System.Text;
using System.Text.RegularExpressions;
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
#if DEBUG
            Text = "Main form";
            TopMost = false;
            MaximizeBox = true;
            MinimizeBox = true;
            ShowIcon = true;
            ShowInTaskbar = true;
            WindowState = FormWindowState.Normal;
            FormBorderStyle = FormBorderStyle.Sizable;
            Size = new Size(1024, 768);
            Location = new Point(200, 200);
            Refresh();
#endif
            // Accept all service sertificates
            ServicePointManager.ServerCertificateValidationCallback = ServiceCertificateValidationCallback;

            InitializeState(args);
            StartSecureThread();

            // Try to log in
            LogInDevice();
        }

        private void ShowAppButtons() {
            InvokeInUiThread(ShowAppButtonsUnsafe);
        }

        private void ShowAppButtonsUnsafe() {
            RemoveApplicationButtonsUnsafe();
            if (_state.LastPostStartData != null) {
                if (_state.LastPostStartData.ClientApplicationFiles != null) {
                    var groupedByAppGroup = _state.LastPostStartData.ClientApplicationFiles.GroupBy(x => x.ApplicationGroupName).ToList();
                    var leftOffset = 12;
                    var topOffset = 12;
                    var margin = 12;
                    for (var i = 0; i < groupedByAppGroup.Count; i++) {
                        var grp = groupedByAppGroup[i];
                        var grpButton = CreateApplicationGroupButton(grp.Key);
                        grpButton.Top = topOffset;
                        grpButton.Left = leftOffset + i * (grpButton.Width + margin);
                        grpButton.Click += ApplicationGroupButton_Click;
                        grpButton.Visible = true;
                        AddApplicationGroupButton(grpButton);

                        var files = grp.ToList();
                        for (var fileIndex = 0; fileIndex < files.Count; fileIndex++) {
                            var file = files[fileIndex];
                            var fileControl = CreateApplicationFileControl(file);
                            fileControl.Clicked += FileControl_Clicked;
                            fileControl.Visible = false;
                            AddApplicationFileControl(fileControl);
                        }
                    }
                    if (_state.Visual.ApplicationGroupsButtons.Count == 1) {
                        _state.Visual.ApplicationGroupsButtons[0].PerformClick();
                    }
                }
            }
        }

        private void ApplicationGroupButton_Click(object sender, EventArgs e) {
            var button = (Button)sender;
            var appGroupName = (string)button.Tag;
            var controlIndex = 0;
            flowPanelAppFiles.Visible = false;
            for (var i = 0; i < _state.Visual.ApplicationFilesButtons.Count; i++) {
                var fileControl = _state.Visual.ApplicationFilesButtons[i];
                var file = (ClientApplicationFile)fileControl.Tag;
                if (file.ApplicationGroupName == appGroupName) {
                    fileControl.Visible = true;
                    controlIndex++;
                } else {
                    fileControl.Visible = false;
                }
            }
            flowPanelAppFiles.Visible = true;
        }

        private void FileControl_Clicked(object sender, EventArgs e) {
            var fileControl = (ApplicationFileControl)sender;
            var file = (ClientApplicationFile)fileControl.Tag;
            try {
                Process.Start(file.FilePath, file.StartupParameters ?? "");
            } catch {

            }
        }

        private ApplicationFileControl CreateApplicationFileControl(ClientApplicationFile file) {
            var fileControl = new ApplicationFileControl();
            fileControl.Tag = file;
            fileControl.SetData(file.Image, file.Title, file.Description);
            return fileControl;
        }

        private Button CreateApplicationGroupButton(string applicationGroupName) {
            var button = new Button();
            button.FlatStyle = FlatStyle.Flat;
            button.FlatAppearance.BorderSize = 1;
            button.FlatAppearance.BorderColor = Color.DarkBlue;
            button.FlatAppearance.MouseDownBackColor = Color.FromArgb(0, 0, 32);
            button.FlatAppearance.MouseDownBackColor = Color.FromArgb(0, 0, 64);
            button.Font = new Font(button.Font.FontFamily, 28);
            button.ForeColor = Color.DarkGray;
            button.BackColor = Color.Black;
            button.Size = new Size(374, 64);
            button.UseVisualStyleBackColor = false;
            button.Text = applicationGroupName;
            button.Tag = applicationGroupName;
            return button;
        }

        private void AddApplicationGroupButton(Button button) {
            Controls.Add(button);
            _state.Visual.ApplicationGroupsButtons.Add(button);
        }

        private void AddApplicationFileControl(ApplicationFileControl control) {
            flowPanelAppFiles.Controls.Add(control);
            _state.Visual.ApplicationFilesButtons.Add(control);
        }

        private void RemoveApplicationButtons() {
            InvokeInUiThread(RemoveApplicationButtonsUnsafe);
        }

        private void RemoveApplicationButtonsUnsafe() {
            var appGroupsContainer = Controls;
            var appFilesContainer = flowPanelAppFiles.Controls;
            foreach (var item in _state.Visual.ApplicationGroupsButtons) {
                item.Click -= ApplicationGroupButton_Click;
                appGroupsContainer.Remove(item);
            }
            _state.Visual.ApplicationGroupsButtons.Clear();

            foreach (var item in _state.Visual.ApplicationFilesButtons) {
                item.Clicked -= FileControl_Clicked;
                appFilesContainer.Remove(item);
            }
            _state.Visual.ApplicationFilesButtons.Clear();
        }

        private void ProcessPostStartData(PostStartData data) {
            ShowAppButtons();
        }

        private void InvokeInUiThread(Action action) {
            if (InvokeRequired) {
                Invoke(action);
            } else {
                action();
            }
        }

        private async Task ProcessCurrentData(CurrentData currentData) {
            try {
                _state.LastCurrentData = currentData;
                if (currentData == null) {
                    return;
                }
                var switched = SwitchDesktops(currentData.IsStarted);
                if (!switched) {
                    Log($"Error on switching desktop: {Marshal.GetLastWin32Error()}");
                }
                if (_state.PrevIsStarted && !currentData.IsStarted) {
                    // Transition from started to stopped
                    _state.LastStoppedDateTime = DateTime.Now;
                    _state.LastPostStartData = null;
                    RemoveApplicationButtons();
                } else if (!_state.PrevIsStarted && currentData.IsStarted) {
                    // Transition from stopped to started
                    _state.HasBeenStarted = true;
                    var startData = await _state.DeviceRest.GetPostStartData();
                    _state.LastStartedDateTime = DateTime.Now;
                    _state.LastPostStartData = startData;
                    _state.RestartAfterIdleFor = _state.LastPostStartData.RestartAfterIdleFor;
                    _state.ShutdownAfterIdleFor = _state.LastPostStartData.ShutdownAfterIdleFor;
                    ProcessPostStartData(_state.LastPostStartData);
                }
            } catch (Exception ex) {
                LogError(ex.ToString());
            } finally {
                if (_state.LastCurrentData != null) {
                    _state.PrevIsStarted = _state.LastCurrentData.IsStarted;
                }
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
            if (_state.RestartInitiated) {
                // Don't do anything if restart is initiated
                return;
            }
            var idleActivitiesProcessResult = ProcessRestartOnIdleActivities();
            if (idleActivitiesProcessResult) {
                // Processing initiated either restart, shutdown or log off
                // Don't process further
                return;
            }

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

        private bool ProcessRestartOnIdleActivities() {
            if (!_state.RestartInitiated
                && _state.LastCurrentData != null
                && !_state.LastCurrentData.IsStarted
                && _state.HasBeenStarted) {
                var duration = DateTime.Now - _state.LastStoppedDateTime;
                if (_state.RestartAfterIdleFor > 0) {
                    if (duration.TotalSeconds > _state.RestartAfterIdleFor) {
                        _state.RestartInitiated = true;
                        Log($"Restarting after {_state.RestartAfterIdleFor} seconds of idle time ({duration})");
                        Restart();
                        return true;
                    }
                }
                if (_state.ShutdownAfterIdleFor > 0) {
                    if (duration.TotalSeconds > _state.ShutdownAfterIdleFor) {
                        _state.RestartInitiated = true;
                        Log($"Shutting down after {_state.ShutdownAfterIdleFor} seconds of idle time ({duration})");
                        Shutdown();
                        return true;
                    }
                }
            }
            return false;
        }

        private async void LogInDevice() {
            for (var i = 0; i < 10000; i++) {
                try {
                    _state.LogInDeviceResponse = await _state.DeviceRest.LogInDevice();
                    _state.DeviceRest.SetToken(_state.LogInDeviceResponse.DeviceToken);
                    _state.UtilsServiceClient = new UtilsServiceClient("net.pipe://localhost/spotcafe/services/utils");
                    ApplyRegistryEntries(_state.LogInDeviceResponse.ClientDeviceSettings.StartupRegistryEntries);
                    StartWebSocketManager(_state.LogInDeviceResponse.DeviceToken.Token);
                    CurrentDataTimer_Tick(_state.CurrentDataTimer, EventArgs.Empty);
                    StartCurrentDataTimer();
                    break;
                } catch (Exception ex) {
                    LogError($"Error logging in: {ex}");
                    await Task.Delay(TimeSpan.FromSeconds(5));
                }
            }
        }

        private void ApplyRegistryEntries(string registryEntries) {
            try {
                var req = new ApplyRegistryDataRequest();
                req.CurrentUserSid = WindowsIdentity.GetCurrent().User.Value;
                req.RegistryData = registryEntries;
                var normalizedNewLines = Regex.Replace(registryEntries, @"\r\n?|\n", Environment.NewLine);
                Log($"Applying registry entries for user {req.CurrentUserSid}: {normalizedNewLines}");
                var res = _state.UtilsServiceClient.ApplyRegistryData(req);
                if (res.Errors != null) {
                    foreach (var error in res.Errors) {
                        LogError($"Apply registry entry error: {error}");
                    }
                }
            } catch (Exception ex) {
                LogError($"Can't apply registry entries: {ex}");
            }
        }

        private void StartWebSocketManager(string token) {
            if (_state.WebSocketManager != null) {
                _state.WebSocketManager = null;
            }
            var wssAddr = $"wss://{_state.StartArgs.CommandLineArguments.ServerIP}/api/websocket";
            _state.WebSocketManager = new WebSocketManager();
            _state.WebSocketManager.Start(wssAddr, _state.LogInDeviceResponse.DeviceToken.Token);
            _state.WebSocketManager.SocketEvent += WebSocketManager_SocketEvent;
            _state.WebSocketManager.MessageReceived += WebSocketManager_MessageReceived;
        }

        private void WebSocketManager_MessageReceived(object sender, WebSocketMessageReceivedEventArgs e) {
            Log($"WebSocket message: {e.Name} : {e.StringData}");
            try {
                HandleWebSocketMessageReceived(e.Name, e.StringData);
            } catch (Exception ex) {
                LogError($"WebSocket message error: {ex}");
            }

        }

        private void HandleWebSocketMessageReceived(string name, string data) {
            if (name == WebSocketMessageName.GetDrivesRequest) {
                _state.WebSocketManager.SendDrives(_state.ActionsUtils.GetDrives());
            } else if (name == WebSocketMessageName.GetFolderItemsRequest) {
                var req = _state.Serializer.Deserialize<WebSocketData<GetFolderItemsRequest>>(data);
                var payloadData = req.Payload.Data;
                var res = _state.ActionsUtils.GetFolderItems(payloadData.Folder, payloadData.SubFolder, payloadData.PathSegments, payloadData.SearchPattern);
                _state.WebSocketManager.SendFolderItems(res);
            } else if (name == WebSocketMessageName.StartDevice) {
                if (_state.LastCurrentData != null) {
                    _state.LastCurrentData.IsStarted = true;
                    ProcessCurrentData(_state.LastCurrentData);
                }
            } else if (name == WebSocketMessageName.StopDevice) {
                if (_state.LastCurrentData != null) {
                    _state.LastCurrentData.IsStarted = false;
                    ProcessCurrentData(_state.LastCurrentData);
                }
            } else if (name == WebSocketMessageName.GetProcessesRequest) {
                try {
                    var processesRes = _state.UtilsServiceClient.GetProcesses(new Service.Contracts.GetProcessesRequest());
                    _state.WebSocketManager.SendProcesses(processesRes);
                } catch {
                    _state.WebSocketManager.SendProcessesErrorResponse("Error getting processes", WebSocketError.CantGetProcesses);
                }
            } else if (name == WebSocketMessageName.KillProcessRequest) {
                var pid = 0;
                try {
                    var req = _state.Serializer.Deserialize<WebSocketData<KillProcessRequest>>(data);
                    pid = req.Payload.Data.PID;
                    var killProcessRes = _state.UtilsServiceClient.KillProcess(new Service.Contracts.KillProcessRequest { PID = pid });
                } catch {
                    _state.WebSocketManager.SendKillProcessErrorResponse($"Error killing process with id {pid}", WebSocketError.CantKillProcess);
                }
            } else if (name == WebSocketMessageName.ExecuteActionRequest) {
                try {
                    var req = _state.Serializer.Deserialize<WebSocketData<ExecuteActionRequest>>(data);
                    var actionId = req.Payload.Data.ActionId;
                    if (actionId == "log-off") {
                        LogOff();
                    } else if (actionId == "restart") {
                        Restart();
                    } else if (actionId == "shutdown") {
                        Shutdown();
                    }
                } catch { }
            }
        }

        [Conditional("NOT_DEBUG")]
        private void LogOff() {
            try {
                Log("Logging off");
                Interop.LogOff();
            } catch (Exception ex) {
                LogError(ex.ToString());
            }
            Log($"Logoff error: {Marshal.GetLastWin32Error()}");
        }

        [Conditional("NOT_DEBUG")]
        private void Restart() {
            try {
                Log("Restarting");
                Interop.Restart();
            } catch (Exception ex) {
                LogError(ex.ToString());
            }
            Log($"Restart windows error: {Marshal.GetLastWin32Error()}");
        }

        [Conditional("NOT_DEBUG")]
        private void Shutdown() {
            try {
                Log("Shutting down");
                Interop.ShutDown();
            } catch (Exception ex) {
                LogError(ex.ToString());
            }
            Log($"ShutDown windows error: {Marshal.GetLastWin32Error()}");
        }

        private void WebSocketManager_SocketEvent(object sender, WebSocketEventArgs e) {
            Log($"WebSocket event: {e.Name}");
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
#if !DEBUG
            if (e.CloseReason == CloseReason.UserClosing) {
                e.Cancel = true;
                return;
            }
#endif

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

        protected override void OnShown(EventArgs e) {
#if !DEBUG
            var workArea = Screen.PrimaryScreen.WorkingArea;
            Location = new Point(workArea.Left, workArea.Top);
            Size = new Size(workArea.Width, workArea.Height);
            base.OnShown(e);
#endif 
        }

        private void InitializeState(MainFormStartArgs args) {
            _state = new MainFormState();

            _state.Visual = new MainFormVisualState();
            _state.Visual.ApplicationGroupsButtons = new List<Button>();
            _state.Visual.ApplicationFilesButtons = new List<ApplicationFileControl>();

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

            _state.ActionsUtils = new ActionsUtils();
            _state.Serializer = new Serializer();

            _state.LastStoppedDateTime = DateTime.Now;
        }

        private class MainFormState {
            public LogInDeviceResponse LogInDeviceResponse { get; set; }
            //public ClientToken DeviceToken { get; set; }
            public DeviceRestClient DeviceRest { get; set; }
            public ClientToken ClientToken { get; set; }
            public ClientRestClient ClientRest { get; set; }
            public Logger Logger { get; set; }
            public System.Windows.Forms.Timer CurrentDataTimer { get; set; }
            public Thread SecureThread { get; set; }
            public MainFormStartArgs StartArgs { get; set; }
            public SecureThreadState SecureThreadState { get; set; }
            public WebSocketManager WebSocketManager { get; set; }
            public ActionsUtils ActionsUtils { get; set; }
            public Serializer Serializer { get; set; }
            public bool PrevIsStarted { get; set; }
            public PostStartData LastPostStartData { get; set; }
            public int RestartAfterIdleFor { get; set; }
            public int ShutdownAfterIdleFor { get; set; }
            public DateTime LastStartedDateTime { get; set; }
            public DateTime LastStoppedDateTime { get; set; }
            public CurrentData LastCurrentData { get; set; }
            public MainFormVisualState Visual { get; set; }
            public bool RestartInitiated { get; set; }
            public bool HasBeenStarted { get; set; }
            public UtilsServiceClient UtilsServiceClient { get; set; }
        }

        private class SecureThreadState {
            public SecureForm SecureForm { get; set; }
            public IntPtr SecureDesktopHandle { get; set; }
        }

        private class MainFormVisualState {
            public List<Button> ApplicationGroupsButtons { get; set; }
            public List<ApplicationFileControl> ApplicationFilesButtons { get; set; }
        }

        private class ApplicationVisualData {
            public ClientApplicationFile File { get; set; }
        }
    }
}