import * as Koa from 'koa';
import * as route from 'koa-route';

import { DatabaseProvider } from '../database-provider/database-provider';
import { IClientDevice } from '../../shared/interfaces/client-device';
// import { IEmployeeWithRolesAndPermissions } from '../../shared/interfaces/employee-with-roles-and-permissions';
// import { IServerToken } from './interfaces/server-token';
// import { ErrorMessage } from '../utils/error-message';
// import { IEmployeeWithRoles } from '../../shared/interfaces/employee-with-roles';

export class ClientDevicesRoutes {
    // private errorMessage = new ErrorMessage();

    constructor(private dataProvider: DatabaseProvider, private apiPrefix: string) {
    }

    getClientDevices(): any {
        return route.post(this.apiPrefix + 'client-devices', this.getClientDevicesImpl.bind(this));
    }

    private async getClientDevicesImpl(ctx: Koa.Context, next: () => Promise<any>): Promise<IClientDevice[]> {
        const clientDevices = await this.dataProvider.getClientDevices();
        return clientDevices;
    }
}
