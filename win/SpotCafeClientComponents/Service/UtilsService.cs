using SpotCafe.Service.Contracts;
using SpotCafe.Service.WindowsRegistry;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;

namespace SpotCafe.Service {
    class UtilsService : IUtilsService {

        public ApplyRegistryDataResponse ApplyRegistryData(ApplyRegistryDataRequest request) {
            var response = new ApplyRegistryDataResponse();
            var errors = new List<string>();
            try {
                var regReader = new RegDataReader();
                regReader.Init(request.RegistryData);
                var records = new List<RegRecord>();
                while (true) {
                    var record = regReader.Next();
                    if (record != null) {
                        records.Add(record);
                    } else {
                        break;
                    }
                }
                foreach (var record in records) {
                    if (record.Items != null) {
                        foreach (var item in record.Items) {
                            if (item != null && item.Error != null) {
                                errors.Add(item.Error.Message);
                            }
                        }
                    }
                }
                response.Errors = errors.ToArray();
                var regWriter = new RegDataWriter();
                regWriter.Write(records, null, request.CurrentUserSid);
            } catch { }
            return response;
        }

        public GetProcessesResponse GetProcesses(GetProcessesRequest request) {
            var response = new GetProcessesResponse();
            var procInfos = new List<ProcessInfo>();
            try {
                var processes = Process.GetProcesses();
                foreach (var process in processes) {
                    var procInfo = new ProcessInfo();
                    procInfo.Name = process.ProcessName;
                    procInfo.PID = process.Id;
                    try {
                        procInfo.Path = process.MainModule.FileName;
                    } catch { }
                    procInfos.Add(procInfo);
                }
                response.ProcessInfos = procInfos.OrderBy(x => x.Name).ToArray();
            } catch { }
            return response;
        }

        public KillProcessResponse KillProcess(KillProcessRequest request) {
            try {
                Process.GetProcessById(request.PID).Kill();
            } catch { }
            return new KillProcessResponse();
        }
    }
}
