export interface IAppConfig {
    httpServer: IHttpServerConfig;
    logging: ILogConfig;
}

export interface IHttpServerConfig {
    host: string;
    port: number;
    secure: boolean;
    redirectHttpToHttps: boolean;
    webAppFolder: string;
}

export interface ILogConfig {
    filePath: string;
}
