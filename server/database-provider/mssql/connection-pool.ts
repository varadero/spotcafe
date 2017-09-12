import { Connection, ConnectionConfig } from 'tedious';

export class ConnectionPool {
    private items: IConnectionPoolItem[];
    private poolItemsCreated = 0;
    private defaultPoolConfig = {
        idleTimeout: 60000,
        maxConnections: 100,
        timeToLive: 120000
    };

    constructor(private poolConfig: IConnectionPoolConfig, private logger: { log: Function, error: Function }) {
        this.poolConfig = <IConnectionPoolConfig>{};
        if (!poolConfig) {
            poolConfig = <IConnectionPoolConfig>{};
        }
        this.poolConfig.idleTimeout = poolConfig.idleTimeout || this.defaultPoolConfig.idleTimeout;
        this.poolConfig.maxConnections = poolConfig.maxConnections || this.defaultPoolConfig.maxConnections;
        this.poolConfig.timeToLive = poolConfig.timeToLive || this.defaultPoolConfig.timeToLive;
        this.items = [];
        setInterval(() => {
            this.cleanUpPool();
        }, this.poolConfig.timeToLive);
    }

    async getConnection(config: ConnectionConfig): Promise<Connection | null> {
        let connectedItem = this.getFirstConectedPoolItem();
        if (!connectedItem) {
            // No free connection pool item is found
            const maxConnections = this.poolConfig.maxConnections || 100;
            if (this.items.length === maxConnections) {
                // No more free slots in the pool for new items
                const msg = 'The pool is full';
                this.logError(msg);
                return Promise.reject(msg);
            }
            let newConnection: Connection | null = null;
            try {
                newConnection = await this.connect(config);
                // Connection was successfully created
                this.poolItemsCreated++;
                connectedItem = <IConnectionPoolItem>{};
                connectedItem.sequenceNumber = this.poolItemsCreated;
                connectedItem.createdAt = new Date().getTime();
                connectedItem.connection = newConnection;
                connectedItem.inUse = true;
                connectedItem.lastPulledAt = connectedItem.createdAt;
                connectedItem.usedCount = 1;
                connectedItem.disposing = false;
                this.items.push(connectedItem);
            } catch (err) {
                // Error when creating connection
                this.logError('Connection error', err);
            }
            if (!newConnection) {
                // Connection was not created for some reason
                this.logError('Could not create connection');
            }
            return newConnection;
        } else {
            // Free connection is found
            connectedItem.inUse = true;
            connectedItem.lastPulledAt = new Date().getTime();
            connectedItem.usedCount++;
            return connectedItem.connection;
        }
    }

    /**
     * Returns connection in the pool for future use
     * @param connection Connection
     */
    releaseConnection(connection: Connection): void {
        const poolItem = this.items.find(x => x.connection === connection);
        if (poolItem) {
            poolItem.lastReleasedAt = new Date().getTime();
            poolItem.inUse = false;
        }
    }

    /**
     * Creates new connection with given configuration
     * @param config Connection configuration
     */
    private async connect(config: ConnectionConfig): Promise<Connection> {
        return new Promise<Connection>((resolve, reject) => {
            let conn: Connection;
            try {
                conn = new Connection(config);
            } catch (err) {
                return reject(err);
            }
            conn.on('connect', err => {
                if (err) { return reject(err); }
                return resolve(conn);
            });
            conn.on('errorMessage', err => {
                this.logError('Connection error message', err);
            });
        });
    }

    private getFirstConectedPoolItem(): IConnectionPoolItem | null {
        const now = new Date().getTime();
        const timeToLive = this.poolConfig.timeToLive || this.defaultPoolConfig.timeToLive;
        const firstNotInUse = this.items.find(x => !x.inUse && !x.disposing && ((now - x.createdAt) < timeToLive));
        if (firstNotInUse) {
            return firstNotInUse;
        }

        return null;
    }

    private cleanUpPool(): void {
        const now = new Date().getTime();
        const idleTimeout = this.poolConfig.idleTimeout || this.defaultPoolConfig.idleTimeout;
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            if (!item.inUse && !item.disposing && (now - item.lastReleasedAt) > idleTimeout) {
                item.disposing = true;
                const connection = item.connection;
                connection.on('end', () => {
                    const index = this.items.findIndex(x => x.connection === connection);
                    this.items.splice(index, 1);
                });
                connection.close();
            }
        }
    }

    private logError(message?: any, ...optionalParams: any[]) {
        if (this.logger) {
            this.logger.error(message, ...optionalParams);
        }
    }

    // private logInfo(message?: any, ...optionalParams: any[]) {
    //     if (this.logger) {
    //         this.logger.log(message, ...optionalParams);
    //     }
    // }
}

export interface IConnectionPoolConfig {
    maxConnections?: number;
    idleTimeout?: number;
    timeToLive?: number;
}

interface IConnectionPoolItem {
    sequenceNumber: number;
    connection: Connection;
    createdAt: number;
    lastPulledAt: number;
    lastReleasedAt: number;
    usedCount: number;
    inUse: boolean;
    disposing: boolean;
}
