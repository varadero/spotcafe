using System;
using System.Collections.Generic;
using System.Configuration.Install;
using System.Linq;
using System.ServiceProcess;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel;

namespace SpotCafe.Service {
    class ServiceInstaller : Installer {
        public ServiceInstaller() {
            var spi = new ServiceProcessInstaller();
            var si = new System.ServiceProcess.ServiceInstaller();

            spi.Account = ServiceAccount.LocalSystem;
            spi.Username = null;
            spi.Password = null;

            si.ServiceName = Service.Name;
            si.DisplayName = Service.Name;
            si.StartType = ServiceStartMode.Automatic;

            Installers.Add(spi);
            Installers.Add(si);
        }
    }
}
