using System;
using System.Collections.Generic;
using System.Linq;
using System.ServiceProcess;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Service {
    class Program {
        static void Main(string[] args) {
            var asConsole = args.Length > 0 && args.Contains("/c");
            if (asConsole) {
                var service = new Service();
                service.Start(args);
                Console.ReadKey();
                service.Stop();
                return;
            } else {
                using (var service = new Service()) {
                    ServiceBase.Run(service);
                }
            }
        }
    }
}
