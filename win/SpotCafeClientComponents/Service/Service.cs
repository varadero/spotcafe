using SpotCafe.Service.Discovery;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.ServiceProcess;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Service {
    class Service : ServiceBase {
        public static readonly string Name = "SpotCafe.Service";

        private Logger logger;
        private ServerDiscoverer discoverer;
        private string configFileName = "SpotCafe.Service-Configuration.json";
        private ServiceConfiguration serviceConfig;
        private IPEndPoint remoteEndPoint;
        private Serializer serializer;

        public Service() {
            serializer = new Serializer();
            ServiceName = Name;
        }

        public void Start(string[] args) {
            OnStart(args);
        }

        protected override void OnStart(string[] args) {
            try {
                logger = new Logger();
            } catch (Exception ex) {
                Console.WriteLine("Error when creating logger: {0}", ex);
            }
            if (args != null && args.Length > 0) {
                var argsText = string.Join(" ", args);
                Log("Starting up with arguments " + argsText);
            } else {
                Log("Starting up without arguments");
            }
            serviceConfig = GetServiceConfiguration();
            discoverer = new ServerDiscoverer(serviceConfig.ClientId, Environment.MachineName, serviceConfig.ServiceIp);
            discoverer.DiscoveryDataReceived += Discoverer_DataReceived;
            StartServerDiscovery();
            base.OnStart(args);
        }

        protected override void OnSessionChange(SessionChangeDescription changeDescription) {
            Log("Session change Reason=" + changeDescription.Reason + " SessionID=" + changeDescription.SessionId.ToString());
            base.OnSessionChange(changeDescription);
        }

        protected override void OnStop() {
            Log("Stopping");
            base.OnStop();
        }

        protected override void OnShutdown() {
            Log("Shutting down");
            base.OnShutdown();
        }

        private void Discoverer_DataReceived(object sender, DiscoveryDataReceivedEventArgs e) {
            Log("Data received from discoverer");
            var text = Encoding.UTF8.GetString(e.Data);
            Log(string.Format("Discovery data received from {0}: {1}", e.RemoteEndPoint.Address.ToString(), text));
            try {
                // If data contains necessary information - stop further discovering
                if (e.Response != null && e.Response.Approved) {
                    e.StopDiscover = true;
                    discoverer.StopDiscovery();
                    remoteEndPoint = e.RemoteEndPoint;
                    ConnectToServer();
                }
            } catch (Exception ex) {
                Log(string.Format("Discovery data is not a valid JSON: {0}", ex));
            }
        }

        private void ConnectToServer() {
            // TODO Make initial request to the server authenticating with ClientId
            Log(string.Format("Connection to {0}", remoteEndPoint.ToString()));
        }

        private void StartServerDiscovery() {
            discoverer.StartDiscovery();
        }

        private void Log(string message, EventLogEntryType type = EventLogEntryType.Information) {
            Console.WriteLine("{0}: {1}: {2}", DateTime.Now, type, message);
            if (logger != null) {
                try {
                    logger.Log(message, type);
                } catch { }
            }
        }

        private void SaveServiceConfiguration() {
            try {
                File.WriteAllText(configFileName, serializer.Serialize(serviceConfig));
            } catch (Exception ex) {
                Log(string.Format("Can't save configuration: {0}", ex));
            }
        }

        private ServiceConfiguration GetServiceConfiguration() {
            ServiceConfiguration config;
            try {
                config = serializer.Deserialize<ServiceConfiguration>(File.ReadAllText(configFileName));
            } catch (Exception loadEx) {
                Log(string.Format("Can't load configuration. Will create default config file: {0}", loadEx));
                config = new ServiceConfiguration();
                config.ClientId = Guid.NewGuid().ToString();
                try {
                    File.WriteAllText(configFileName, serializer.Serialize(config));
                    Log(string.Format("Configuration written to {0}", configFileName));
                } catch (Exception writeEx) {
                    // Probably no access for writing
                    Log(string.Format("Can't save configuration: {0}", writeEx));
                }
            }
            return config;
        }
    }
}
