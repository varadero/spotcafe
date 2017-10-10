﻿using SpotCafe.Desktop.REST;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
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
            var switched = SwitchSesktops(currentData.IsStarted);
            if (!switched) {
                Log($"Error on switching desktop: {Marshal.GetLastWin32Error()}");
            }
        }

        private bool SwitchSesktops(bool isStarted) {
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

        private void SecureForm_SignIn(object sender, SignInEventArgs e) {
            try {

            } catch (Exception ex) {
                LogError($"Error on sign in: {ex}");
            }
            _state.SecureThreadState.SecureForm.SignInResult(false, "User name or password is invalid");
        }

        private async void CurrentDataTimer_Tick(object sender, EventArgs e) {
            try {
                _state.CurrentDataTimer.Stop();
                var currentData = await _state.Rest.GetCurrentData();
                ProcessCurrentData(currentData);
            } catch (Exception ex) {
                LogError($"Error on getting current data: {ex}");
            } finally {
                _state.CurrentDataTimer.Start();
            }
        }

        private async void LogInDevice() {
            for (var i = 0; i < 100; i++) {
                try {
                    _state.ClientToken = await _state.Rest.LogIn();
                    _state.Rest.SetToken(_state.ClientToken);
                    // TODO Start the application
                    CurrentDataTimer_Tick(_state.CurrentDataTimer, EventArgs.Empty);
                    StartCurrentDataTimer();
                    break;
                } catch (Exception ex) {
                    LogError($"Error logging in: {ex}");
                    await Task.Delay(TimeSpan.FromSeconds(5));
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

            // REST client for communication with the server
            _state.Rest = new RestClient(_state.StartArgs.CommandLineArguments.ServerIP, "api", _state.StartArgs.CommandLineArguments.ClientId);

            _state.SecureThreadState = new SecureThreadState();
            _state.SecureThreadState.SecureDesktopHandle = _state.StartArgs.SecureDesktopHandle;
            _state.SecureThread = new Thread(new ParameterizedThreadStart(SecureThread));
        }

        private class MainFormState {
            public ClientToken ClientToken { get; set; }
            public RestClient Rest { get; set; }
            public Logger Logger { get; set; }
            public System.Windows.Forms.Timer CurrentDataTimer { get; set; }
            public Thread SecureThread { get; set; }
            public MainFormStartArgs StartArgs { get; set; }
            public SecureThreadState SecureThreadState { get; set; }
        }
        private class SecureThreadState {
            public SecureForm SecureForm { get; set; }
            public IntPtr SecureDesktopHandle { get; set; }
        }
    }
}