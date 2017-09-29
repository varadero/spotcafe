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
using System.Threading.Tasks;
using System.Windows.Forms;

namespace SpotCafe.Desktop {
    public partial class MainForm : Form {
        private string clientId;
        private string serverIp;
        private ClientToken clientToken;
        private RestClient rest;
        private Logger logger;
        private Timer currentDataTimer;
        private IntPtr secureDekstopHandle;
        private IntPtr startupDesktopHandle;
        private CommandLineArgs commandLineArgs;

        public MainForm() {
            InitializeComponent();
            var args = Environment.GetCommandLineArgs();
            logger = new Logger(Program.GetLogFileFullPath());
            logger.Log($"Starting with arguments {string.Join(" ", args)}");
            var cmdArgsParser = new CommandLineArgsParser();
            commandLineArgs = cmdArgsParser.Parse(args);
            clientId = commandLineArgs.ClientID;
            serverIp = commandLineArgs.ServerIP;
            logger.Log($"ClientID={clientId} ; ServerIP={serverIp}");
            startupDesktopHandle = Program.GetStartupDesktopHandle();
            logger.Log($"Startup desktop handle: {startupDesktopHandle}");
            secureDekstopHandle = CreateSecureDesktop();
            logger.Log($"Secure desktop handle: {secureDekstopHandle}");
            ServicePointManager.ServerCertificateValidationCallback = ServiceCertificateValidationCallback;
            currentDataTimer = new Timer();
            currentDataTimer.Interval = (int)TimeSpan.FromSeconds(5).TotalMilliseconds;
            currentDataTimer.Tick += CurrentDataTimer_Tick;
            rest = new RestClient(serverIp, "api", clientId);
            LogInDevice();
        }

        private void ProcessCurrentData(CurrentData currentData) {
            if (currentData == null) {
                return;
            }
            textBox1.Text = currentData.IsStarted.ToString();
            var switched = SwitchSesktops(currentData.IsStarted);
            if (!switched) {
                logger.Log($"Error on switching desktop: {Marshal.GetLastWin32Error()}");
            }
        }

        private bool SwitchSesktops(bool isStarted) {
#if DEBUG
            textBox1.Text = isStarted.ToString();
            return true;
#endif
            var desktopHandle = isStarted ? startupDesktopHandle : secureDekstopHandle;
            return Interop.SwitchDesktop(desktopHandle);
        }

        private async void CurrentDataTimer_Tick(object sender, EventArgs e) {
            try {
                currentDataTimer.Stop();
                var currentData = await rest.GetCurrentData();
                ProcessCurrentData(currentData);
            } catch (Exception ex) {
                logger.LogError($"Error on getting current data: {ex}");
            } finally {
                currentDataTimer.Start();
            }
        }

        private async void LogInDevice() {
            for (var i = 0; i < 100; i++) {
                try {
                    clientToken = await rest.LogIn();
                    rest.SetToken(clientToken);
                    // TODO Start the application
                    CurrentDataTimer_Tick(currentDataTimer, EventArgs.Empty);
                    StartCurrentDataTimer();
                    break;
                } catch (Exception ex) {
                    logger.LogError($"Error logging in: {ex}");
                    await Task.Delay(TimeSpan.FromSeconds(5));
                }
            }
        }

        private void StartCurrentDataTimer() {
            currentDataTimer.Start();
        }

        private bool ServiceCertificateValidationCallback(object sender, X509Certificate certificate, X509Chain chain, SslPolicyErrors sslPolicyErrors) {
            //if (!string.IsNullOrWhiteSpace(serviceConfig.ServerCertificateThumbprint)) {
            //    var certThumbprint = certificate.GetCertHashString();
            //    if (certThumbprint != serviceConfig.ServerCertificateThumbprint) {
            //        LogError($"Certificate thumbprint {certThumbprint} does not match configuration thumbprint {serviceConfig.ServerCertificateThumbprint}", LogEventIds.ServiceCertificateThumbprintError);
            //        return false;
            //    }
            //}
            return true;
        }

        private IntPtr CreateSecureDesktop() {
            var desktopHandle = Interop.CreateDesktop("SpotCafeDesktop", IntPtr.Zero, IntPtr.Zero, 0, Interop.DesktopAccessRights.GENERIC_ALL, IntPtr.Zero);
            return desktopHandle;
        }
    }
}
