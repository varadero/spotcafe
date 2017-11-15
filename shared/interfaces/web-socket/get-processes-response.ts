export interface IGetProcessesResponse {
    processInfos: IProcessInfo[];
}

export interface IProcessInfo {
    name: string;
    path: string;
    pid: number;
}
