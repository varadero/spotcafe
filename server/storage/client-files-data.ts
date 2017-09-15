export interface IClientFilesData {
    files: IClientFileInfo[];
    startupName: string;
}

export interface IClientFileInfo {
    name: string;
    base64Content: string;
}
