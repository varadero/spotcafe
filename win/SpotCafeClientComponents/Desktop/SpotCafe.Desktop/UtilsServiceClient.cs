using SpotCafe.Service.Contracts;
using System;
using System.Collections.Generic;
using System.Linq;
using System.ServiceModel;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Desktop {
    class UtilsServiceClient : IUtilsService {

        private string endpointUrl;

        public UtilsServiceClient(string endpointUrl) {
            this.endpointUrl = endpointUrl;
        }

        public ApplyRegistryDataResponse ApplyRegistryData(ApplyRegistryDataRequest request) {
            return UseChannel(x => x.ApplyRegistryData(request));
        }

        public GetProcessesResponse GetProcesses(GetProcessesRequest request) {
            return UseChannel(x => x.GetProcesses(request));
        }

        public KillProcessResponse KillProcess(KillProcessRequest request) {
            return UseChannel(x => x.KillProcess(request));
        }

        private TResult UseChannel<TResult>(Func<IUtilsService, TResult> func) {
            TResult result;
            ChannelFactory<IUtilsService> pipeFactory = new ChannelFactory<IUtilsService>(
                new NetNamedPipeBinding(),
                new EndpointAddress(endpointUrl)
            );
            IUtilsService channel = pipeFactory.CreateChannel();
            result = func(channel);
            try {
                pipeFactory.Close();
            } catch { }

            return result;
        }
    }
}
