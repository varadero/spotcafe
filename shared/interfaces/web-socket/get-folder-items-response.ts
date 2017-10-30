export interface IGetFolderItemsResponse {
    pathSegments: string[];
    folder: string;
    directories: string[];
    files: string[];
    success: boolean;
}
