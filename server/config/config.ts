export interface IAppConfig {
    httpServer: IHttpServerConfig;
}

export interface IHttpServerConfig {
    host: string;
    port: number;
    webAppFolder: string;
}
