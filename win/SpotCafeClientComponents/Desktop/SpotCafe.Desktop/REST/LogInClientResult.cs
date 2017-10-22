using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Desktop.REST {
    [DataContract]
    public class LogInClientResult {
        [DataMember(Name = "credit")]
        public decimal Credit { get; set; }

        [DataMember(Name = "token")]
        public ClientToken Token { get; set; }

        [DataMember(Name = "disabled")]
        public bool Disabled { get; set; }

        [DataMember(Name = "pricePerHour")]
        public decimal PricePerHour { get; set; }

        [DataMember(Name = "deviceAlreadyStarted")]
        public bool DeviceAlreadyStarted { get; set; }

        [DataMember(Name = "clientAlreadyInUse")]
        public bool ClientAlreadyInUse { get; set; }

        [DataMember(Name = "clientAlreadyInUseDeviceName")]
        public string ClientAlreadyInUseDeviceName { get; set; }

        [DataMember(Name = "notEnoughCredit")]
        public bool NotEnoughCredit { get; set; }
    }
}
