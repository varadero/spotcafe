﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Service.Discovery {
    class DiscoveryDataReceivedEventArgs {
        public byte[] Data { get; set; }
        public DiscoveryResult Response { get; set; }
        public IPEndPoint RemoteEndPoint { get; set; }
        public bool StopDiscover { get; set; }
    }
}
