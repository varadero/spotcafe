import * as dgram from 'dgram';
import { Subject } from 'rxjs/Subject';

import { DatabaseProvider } from './database-provider/database-provider';
import { Logger } from './utils/logger';

export class UdpDiscoveryListener {
    error$ = new Subject<Error>();
    message$ = new Subject<{ socket: dgram.Socket, buffer: Buffer, remoteInfo: dgram.AddressInfo }>();
    bound$ = new Subject<dgram.Socket>();

    constructor(private dataProvider: DatabaseProvider, private logger: Logger) { }

    listen(): void {
        this.dataProvider = this.dataProvider;
        const socket = dgram.createSocket('udp4');

        socket.on('error', err => {
            this.logger.error('Discovery servie error', err);
            socket.close(() => {
                this.listen();
            });
        });

        socket.on('message', async (msg, rinfo) => {
            const clientAppAddr = `IP: ${rinfo.address} ; Port:${rinfo.port}`;
            this.logger.log(`Client application discovery info: ${clientAppAddr}`);
            try {
                const str = msg.toString('utf8');
                const obj = <{ clientId: string, clientName: string }>JSON.parse(str);
                this.logger.log('Client application discovery data', obj);
                const registerResult = await this.dataProvider.registerClientDevice(obj.clientId, obj.clientName, rinfo.address);
                const discoveryResponse = {
                    approved: registerResult.clientDevice.approved
                };
                socket.send(JSON.stringify(discoveryResponse), rinfo.port, rinfo.address, (sendErr, bytesCount) => {
                    if (sendErr) {
                        this.logger.error('Discovery service send data error', sendErr);
                    } else {
                        this.logger.log(`${bytesCount} bytes sent to discovery client application at ${rinfo.address}`);
                    }
                });
                // const responseObj = {address:};
                // server.send('echo', rinfo.port, rinfo.address);
            } catch (err) {
                this.logger.error('Client application discovery data error', err);
            }
        });

        socket.bind(64129, undefined, () => {
            const socketAddr = socket.address();
            this.logger.log(`Discovery service listening at ${socketAddr.address}:${socketAddr.port}`);
        });
    }
}
