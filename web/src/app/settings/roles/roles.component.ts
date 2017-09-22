import { Component, OnInit, ViewChild } from '@angular/core';

import { DataService } from '../../core/data.service';
import { IRoleWithPermissions } from '../../../../../shared/interfaces/role-with-permissions';
import { IRoleWithPermissionsIds } from '../../../../../shared/interfaces/role-with-permissions-ids';
import { IPermission } from '../../../../../shared/interfaces/permission';
import { RolesService, ISelectablePermission, IRoleErrors } from './roles.service';
import { DisplayMessagesComponent } from '../../shared/display-messages.component';
import { ErrorsService } from '../../shared/errors.service';

@Component({
    templateUrl: './roles.component.html'
})
export class RolesComponent implements OnInit {
    selectedRoleWithPermissions: IRoleWithPermissions;
    rolesWithPermissions: IRoleWithPermissions[];
    permissions: IPermission[];
    existingRoleErrors: IRoleErrors = {
        hasErrors: false,
        nameIsEmpty: false
    };

    @ViewChild('updateRoleMessagesComponent') private updateRoleMessagesComponent: DisplayMessagesComponent;

    constructor(
        private dataSvc: DataService,
        private rolesService: RolesService,
        private errorsSvc: ErrorsService
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    async updateRoleWithPermissions(roleWithPermissions: IRoleWithPermissions): Promise<void> {
        this.existingRoleErrors = this.rolesService.getRoleErrors(roleWithPermissions.role);
        if (this.existingRoleErrors.hasErrors) {
            return;
        }

        const selectablePermissions = <ISelectablePermission[]>roleWithPermissions.permissions;
        const roleWithPermissionsIds: IRoleWithPermissionsIds = {
            role: roleWithPermissions.role,
            permissionsIds: selectablePermissions.filter(x => x.selected).map(x => x.id)
        };
        try {
            await this.dataSvc.updateRoleWithPermissionsIds(roleWithPermissionsIds);
        } catch (err) {
            this.handleError(err, this.updateRoleMessagesComponent, 'Updating role error:');
        } finally {
        }
        this.loadData();
    }

    private async loadData(): Promise<void> {
        try {
            // Remember currently selected role with permissions
            const selectedRoleId = this.selectedRoleWithPermissions ? this.selectedRoleWithPermissions.role.id : null;
            const [rolesWithPermissionsIds, permissions] = await Promise.all([
                this.dataSvc.getRolesWithPermissionsIds(),
                this.dataSvc.getPermissions()]
            );
            this.permissions = permissions;
            this.rolesWithPermissions = this.rolesService.createRolesWithPermissions(rolesWithPermissionsIds, this.permissions);
            this.selectedRoleWithPermissions = this.rolesWithPermissions.find(x => x.role.id === selectedRoleId);
        } catch (err) {
        } finally {
        }
    }

    private addErrorMessage(text: string, messageComponent: DisplayMessagesComponent): void {
        messageComponent.addErrorMessage(text);
    }

    private handleError(err: any, messagesComponent: DisplayMessagesComponent, messagePrefix: string): void {
        const errMessage = this.errorsSvc.getNetworkErrorMessage(err, messagePrefix);
        messagesComponent.addErrorMessage(errMessage);
    }
}
