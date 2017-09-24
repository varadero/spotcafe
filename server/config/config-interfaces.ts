export interface IAppConfig {
    httpServer: IHttpServerConfig;
}

export interface IHttpServerConfig {
    host: string;
    port: number;
    secure: boolean;
    redirectHttpToHttps: boolean;
    webAppFolder: string;
}
