import * as fs from 'fs';

import { IDatabaseConfig, IDatabaseProviderConfig } from '../config/database';
import { DatabaseProvider } from './database-provider';


export class DatabaseProviderHelper {
    /**
     * Creates ne instance of database provider configured in connection-data.json
     * @param databaseConfig {IDatabaseConfig} Database configuration
     */
    getProvider(databaseConfig: IDatabaseConfig): DatabaseProvider {
        // Find default provider configuration
        const defaultProviderName = databaseConfig.databaseProviders.defaultProvider;
        let providerConfig: IDatabaseProviderConfig | null = null;
        for (let i = 0; i < databaseConfig.databaseProviders.providers.length; i++) {
            const currentProviderConfig = databaseConfig.databaseProviders.providers[i];
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
        // We need to find property which is a function and which name ends with 'DatabaseProvider' by convention
        const loadedModulePropNames = Object.getOwnPropertyNames(loadedModule);
        let providerClassConstructor: any = null;
        const profiderNameSuffix = 'DatabaseProvider';
        for (let i = 0; i < loadedModulePropNames.length; i++) {
            const modulePropName = loadedModulePropNames[i];
            if (typeof loadedModule[modulePropName] === 'function' && modulePropName.endsWith(profiderNameSuffix)) {
                providerClassConstructor = loadedModule[modulePropName];
                break;
            }
        }

        let providerInstance: DatabaseProvider;
        if (providerClassConstructor) {
            // Database rovider class constructor is found - make new instance
            providerInstance = new providerClassConstructor();
        } else {
            // Exported class with specified convention name is not found
            // Assume that loaded module exports default function, which when executed returns new instance
            providerInstance = loadedModule();
        }

        // Initialze the instance
        providerInstance.initialize(providerConfig.config);
        return providerInstance;
    }
}
