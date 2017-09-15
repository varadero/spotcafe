export interface IStorageConfig {
    /**
     * Configuration for storage providers
     */
    storageProviders: IStorageProvidersConfig;
    /**
     * Multiple other keys containing arbitrary data
     */
    [key: string]: any;
}

export interface IStorageProvidersConfig {
    /**
     * Thе name of the provider in 'providers' array to use
     */
    defaultProvider: string;
    /**
     * Array with all providers
     */
    providers: IStorageProviderConfig[];
}

export interface IStorageProviderConfig {
    /**
     * Name of the provider - arbitrary string unique for each provider
     */
    name: string;
    /**
     * Module name path for storage provider - relative of 'storage' folder
     */
    module: string;
    /**
     * The configuration for the provider
     */
    config: any;
}
