import * as route from 'koa-route';

import { DatabaseProvider } from '../database-provider/database-provider';
import { RoutesBase } from './routes-base';

export class RolesRoutes extends RoutesBase {
    constructor(private dataProvider: DatabaseProvider, private apiPrefix: string) {
        super();
    }

    getAllRoles(): any {
        return route.get(this.apiPrefix + 'roles', async ctx => {
            await this.handleResult(ctx, () => this.dataProvider.getRoles());
        });
    }
}
