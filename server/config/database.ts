export interface IDatabaseConfig {
    /**
     * Configuration for database providers
     */
    databaseProviders: IDatabaseProvidersConfig;
    /**
     * Multiple other keys containing arbitrary data
     */
    [key: string]: any;
}

export interface IDatabaseProvidersConfig {
    /**
     * Thе name of the provider in 'providers' array to use
     */
    defaultProvider: string;
    /**
     * Array with all providers
     */
    providers: IDatabaseProviderConfig[];
}

export interface IDatabaseProviderConfig {
    /**
     * Name of the provider - arbitrary string unique for each provider
     */
    name: string;
    /**
     * Module name path for database prvider - relative of 'database-provider' folder
     */
    module: string;
    /**
     * The configuration for the provider
     */
    config: any;
}
