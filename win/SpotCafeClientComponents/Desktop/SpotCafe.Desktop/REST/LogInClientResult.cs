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
        public Boolean Disabled { get; set; }

        [DataMember(Name = "pricePerHour")]
        public decimal PricePerHour { get; set; }
    }
}
