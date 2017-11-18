using System;
using System.Collections.Generic;
using System.Configuration.Install;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.ServiceProcess;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace SpotCafe.Service {
    class Program {
        static void Main(string[] args) {
            var serviceFileLocation = Assembly.GetExecutingAssembly().Location;
            if (!args.Contains("/c") && !args.Contains("/install-in-current-folder")) {
                var folder = Path.GetDirectoryName(serviceFileLocation);
                if (folder.ToUpper() != Environment.SystemDirectory.ToUpper()) {
                    Console.WriteLine($"ERROR: Copy files to {Environment.SystemDirectory} and start from there or use flag /install-in-current-folder");
                    Console.Read();
                    return;
                }
            }
            //var install = args.Length > 0 && args.Contains("/i");
            //if (install) {
            //    Console.WriteLine($"Installing service {serviceFileLocation}");
            //    try {
            //        ManagedInstallerClass.InstallHelper(new string[] { serviceFileLocation });
            //        ServiceController sc = new ServiceController(Service.Name);
            //        sc.Start();
            //        Console.WriteLine();
            //        Console.WriteLine("Spotcafe service was installed. Restart for the changes to take effect. Press ENTER to exit");
            //        Console.Read();
            //    } catch (Exception ex) {
            //        Console.WriteLine($"Can't install service: {ex}");
            //        Console.Read();
            //    }
            //    return;
            //}

            var interactive = Environment.UserInteractive;
            var asConsole = args.Length > 0 && args.Contains("/c");
            if (interactive && !asConsole) {
                Console.WriteLine($"Installing service {serviceFileLocation}");
                try {
                    ManagedInstallerClass.InstallHelper(new string[] { serviceFileLocation });
                    ServiceController sc = new ServiceController(Service.Name);
                    sc.Start();
                    Console.WriteLine();
                    Console.WriteLine("Spotcafe service was installed. Restart for the changes to take effect. Press ENTER to exit");
                    Console.Read();
                } catch (Exception ex) {
                    Console.WriteLine($"Can't install service: {ex}");
                    Console.Read();
                }
                return;
                //var target = "";
                //try {
                //    try {
                //        ServiceController sc = new ServiceController(Service.Name);
                //        sc.Stop();
                //        sc.WaitForStatus(ServiceControllerStatus.Stopped, TimeSpan.FromSeconds(10));
                //    } catch (Exception ex) {
                //        Console.WriteLine($"Can't stop service: {ex}");
                //    }
                //    target = Path.Combine(Environment.SystemDirectory, Path.GetFileName(serviceFileLocation));
                //    try {
                //        Console.WriteLine("Uninstalling current service");
                //        ManagedInstallerClass.InstallHelper(new string[] { "/u", target });
                //        Thread.Sleep(TimeSpan.FromSeconds(3));
                //    } catch (Exception ex) {
                //        Console.WriteLine($"Uninstaling service error: {ex}");
                //    }
                //    using (var file = new FileStream(target, FileMode.Create, FileAccess.Write)) {
                //        var sourceBytes = File.ReadAllBytes(serviceFileLocation);
                //        file.Write(sourceBytes, 0, sourceBytes.Length);
                //    }
                //    // Process.Start(target, "/i");
                //} catch (Exception ex) {
                //    Console.WriteLine($"Can't copy service file to {target}");
                //    Console.WriteLine(ex.ToString());
                //    Console.Read();
                //}
                //return;
            }

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
