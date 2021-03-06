import { Connection, ConnectionConfig } from 'tedious';

export class ConnectionPool {
    private items: IConnectionPoolItem[];
    private poolItemsCreated = 0;
    private defaultPoolConfig = {
        idleTimeout: 60000,
        maxConnections: 100,
        timeToLive: 120000
    };
    // private cleanupTimer: NodeJS.Timer;
    private lastClenaup: number;
    private config: {
        maxConnections: number;
        idleTimeout: number;
        timeToLive: number;
    };
    private logMessagePrefix = 'CONNECTION-POOL';

    private statistics: IStatistics;

    constructor(poolConfig: IConnectionPoolConfig, private logger: { log: Function, error: Function }) {
        this.config = <any>{};
        if (!poolConfig) {
            poolConfig = <IConnectionPoolConfig>{};
        }
        // this.config = poolConfig;
        this.config.idleTimeout = poolConfig.idleTimeout || this.defaultPoolConfig.idleTimeout;
        this.config.maxConnections = poolConfig.maxConnections || this.defaultPoolConfig.maxConnections;
        this.config.timeToLive = poolConfig.timeToLive || this.defaultPoolConfig.timeToLive;
        this.items = [];
        this.statistics = {
            totalConnectionsCreated: 0,
            totalTimesReused: 0,
            connectionErrors: 0,
            connectionErrorMessages: 0
        };
        // TODO The following for some strange reason doesn't work
        // It will work if setInterval result is not assigned to this.cleanupTimer
        // this.cleanupTimer = setInterval(() => {
        //     this.cleanUpPool();
        // }, this.poolConfig.timeToLive);

        // // TODO The following works
        // const cleanupTimer = setInterval(() => {
        //     this.cleanUpPool();
        // }, this.poolConfig.timeToLive);
        // this.cleanupTimer = cleanupTimer;
        this.lastClenaup = Date.now();
    }

    async getConnection(config: ConnectionConfig): Promise<Connection | null> {
        const now = Date.now();
        const timeDiff = now - this.lastClenaup;
        if (timeDiff > this.config.timeToLive) {
            this.lastClenaup = now;
            this.cleanUpPool();
        }
        let connectedItem = this.getFirstConectedPoolItem(config);
        if (!connectedItem) {
            // No free connection pool item is found
            const maxConnections = this.config.maxConnections || 100;
            if (this.items.length === maxConnections) {
                // No more free slots in the pool for new items
                const msg = 'The pool is full';
                this.logError(msg);
                return Promise.reject(msg);
            }
            let newConnection: Connection | null = null;
            try {
                newConnection = await this.connectNewConnection(config);
                // Connection was successfully created
                this.poolItemsCreated++;
                connectedItem = <IConnectionPoolItem>{};
                connectedItem.sequenceNumber = this.poolItemsCreated;
                connectedItem.createdAt = new Date().getTime();
                connectedItem.connection = newConnection;
                connectedItem.config = config;
                connectedItem.inUse = true;
                connectedItem.lastPulledAt = connectedItem.createdAt;
                connectedItem.usedCount = 1;
                connectedItem.disposing = false;
                this.statistics.totalConnectionsCreated++;
                this.items.push(connectedItem);
            } catch (err) {
                // Error when creating connection
                this.logError('Connection error', err);
                try {
                    if (newConnection) {
                        (<Connection>newConnection).close();
                    }
                } catch (err) { }
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
            this.statistics.totalTimesReused++;
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

    dispose(): void {
        // clearInterval(this.cleanupTimer);
        for (let i = this.items.length - 1; i >= 0; i--) {
            const connection = this.items[i].connection;
            connection.reset(() => { });
            connection.removeAllListeners('connect');
            connection.removeAllListeners('error');
            connection.removeAllListeners('errorMessage');
            connection.removeAllListeners('end');
            connection.removeAllListeners();
            connection.close();
            this.items.splice(i, 1);
        }
    }

    /**
     * Creates new connection with given configuration
     * @param config Connection configuration
     */
    async connectNewConnection(config: ConnectionConfig): Promise<Connection> {
        return new Promise<Connection>((resolve, reject) => {
            let conn: Connection;
            try {
                conn = new Connection(config);
            } catch (err) {
                return reject(err);
            }
            conn.on('connect', err => {
                // conn.removeAllListeners();
                if (err) { return reject(err); }
                return resolve(conn);
            });
            conn.on('error', err => {
                this.statistics.connectionErrors++;
                this.markConnectionForCleanUp(conn);
                this.cleanUpPool();
                this.logError('Connection message', err);
            });
            conn.on('errorMessage', err => {
                this.statistics.connectionErrorMessages++;
                this.markConnectionForCleanUp(conn);
                this.cleanUpPool();
                let errText = '';
                try {
                    errText = JSON.stringify(err);
                } catch (stringifyErr) {
                }
                this.logError('Connection error message', errText);
            });
        });
    }

    private markConnectionForCleanUp(connection: Connection): void {
        const poolItem = this.getPoolItemByConnection(connection);
        if (!poolItem) {
            return;
        }
        if (poolItem) {
            poolItem.forCleanUp = true;
        }
    }

    private getFirstConectedPoolItem(config: ConnectionConfig): IConnectionPoolItem | null {
        const now = new Date().getTime();
        const timeToLive = this.config.timeToLive || this.defaultPoolConfig.timeToLive;
        const firstNotInUse = this.items.find(x =>
            !x.forCleanUp
            && !x.inUse
            && !x.disposing
            && x.config === config
            && ((now - x.createdAt) < timeToLive)
        );
        if (firstNotInUse) {
            return firstNotInUse;
        }

        return null;
    }

    private getPoolItemByConnection(connection: Connection): IConnectionPoolItem | null {
        const poolItem = this.items.find(x => x.connection === connection);
        return poolItem || null;
    }

    private cleanUpPool(): void {
        const itemsLengthBefore = this.items.length;
        const now = new Date().getTime();
        const idleTimeout = this.config.idleTimeout || this.defaultPoolConfig.idleTimeout;
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            const notInUseAndNotDisposing = !item.inUse && !item.disposing;
            const tooOld = (now - item.lastReleasedAt) > idleTimeout;
            if (item.forCleanUp || (notInUseAndNotDisposing && tooOld)) {
                item.disposing = true;
                const connection = item.connection;
                // connection.on('end', () => {
                //     const index = this.items.findIndex(x => x.connection === connection);
                //     this.items.splice(index, 1);
                // });
                try {
                    connection.close();
                } catch (err) { }
                this.items.splice(i, 1);
            }
        }
        let logMsg = `Pool cleaned up. ${this.items.length}/${itemsLengthBefore} connections left.`;
        logMsg += ` ${this.statistics.totalConnectionsCreated} total connections created.`;
        logMsg += ` ${this.statistics.totalTimesReused} total times reused.`;
        this.logInfo(logMsg);
    }

    private logError(message?: any, ...optionalParams: any[]) {
        if (this.logger) {
            this.logger.error(this.logMessagePrefix + ' ' + message, ...optionalParams);
        }
    }

    private logInfo(message?: any, ...optionalParams: any[]) {
        if (this.logger) {
            this.logger.log(this.logMessagePrefix + ' ' + message, ...optionalParams);
        }
    }
}

export interface IConnectionPoolConfig {
    maxConnections?: number;
    idleTimeout?: number;
    timeToLive?: number;
}

interface IConnectionPoolItem {
    sequenceNumber: number;
    connection: Connection;
    config: ConnectionConfig;
    createdAt: number;
    lastPulledAt: number;
    lastReleasedAt: number;
    usedCount: number;
    inUse: boolean;
    disposing: boolean;
    forCleanUp: boolean;
}

interface IStatistics {
    totalTimesReused: number;
    totalConnectionsCreated: number;
    connectionErrors: number;
    connectionErrorMessages: number;
}
