using SpotCafe.Service.Contracts;
using System;
using System.Collections.Generic;
using System.Linq;
using System.ServiceModel;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Service.Contracts {
    [ServiceContract]
    public interface IUtilsService {
        [OperationContract]
        ApplyRegistryDataResponse ApplyRegistryData(ApplyRegistryDataRequest request);

        [OperationContract]
        GetProcessesResponse GetProcesses(GetProcessesRequest request);

        [OperationContract]
        KillProcessResponse KillProcess(KillProcessRequest request);
    }
}
