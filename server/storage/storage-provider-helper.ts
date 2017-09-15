import { IStorageConfig, IStorageProviderConfig } from '../config/storage-interfaces';
import { StorageProvider } from './storage-provider';


export class StorageProviderHelper {
    /**
     * Creates ne instance of storage provider configured in connection-data.json
     * @param storageConfig {IStorageConfig} Storage configuration
     * @param logger {any} A logger object with functions log and error
     */
    getProvider(storageConfig: IStorageConfig, logger: any): StorageProvider {
        // Find default provider configuration
        const defaultProviderName = storageConfig.storageProviders.defaultProvider;
        let providerConfig: IStorageProviderConfig | null = null;
        for (let i = 0; i < storageConfig.storageProviders.providers.length; i++) {
            const currentProviderConfig = storageConfig.storageProviders.providers[i];
            if (currentProviderConfig.name === defaultProviderName) {
                providerConfig = currentProviderConfig;
                break;
            }
        }
        if (!providerConfig) {
            throw new Error(`Can't find default provider '${defaultProviderName}'. Check config file.`);
        }

        const loadedModule = require(providerConfig.module);
        // The loaded module contains all exported members
        // We need to find property which is a function and which name ends with 'StorageProvider' by convention
        const loadedModulePropNames = Object.getOwnPropertyNames(loadedModule);
        let providerClassConstructor: any = null;
        const profiderNameSuffix = 'StorageProvider';
        for (let i = 0; i < loadedModulePropNames.length; i++) {
            const modulePropName = loadedModulePropNames[i];
            if (typeof loadedModule[modulePropName] === 'function' && modulePropName.endsWith(profiderNameSuffix)) {
                providerClassConstructor = loadedModule[modulePropName];
                break;
            }
        }

        let providerInstance: StorageProvider;
        if (providerClassConstructor) {
            // Storage provider class constructor is found - make new instance
            providerInstance = new providerClassConstructor();
        } else {
            // Exported class with specified convention name is not found
            // Assume that loaded module exports default function, which when executed returns new instance
            providerInstance = loadedModule();
        }

        // Initialze the instance
        providerInstance.initialize(providerConfig.config, logger);
        return providerInstance;
    }
}
