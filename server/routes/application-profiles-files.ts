import * as route from 'koa-route';

import { StorageProvider } from '../storage/storage-provider';
import { RoutesBase } from './routes-base';
import { IApplicationProfileFile } from '../../shared/interfaces/application-profile-file';

export class ApplicationProfilesFilesRoutes extends RoutesBase {

    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
    }

    addFile(): any {
        return route.post(this.apiPrefix + 'application-profiles-files', async ctx => {
            await this.handleResult(ctx, () => this.addFileImpl(ctx.request.body));
        });
    }

    deleteFile(): any {
        return route.delete(this.apiPrefix + 'application-profiles-files/:id', async (ctx, fileId: string) => {
            await this.handleResult(ctx, () => this.deleteFileImpl(fileId));
        });
    }

    private async addFileImpl(file: IApplicationProfileFile): Promise<void> {
        await this.storageProvider.addApplicationProfileFile(file);
    }

    private async deleteFileImpl(fileId: string): Promise<void> {
        await this.storageProvider.deleteApplicationProfileFile(fileId);
    }
}
