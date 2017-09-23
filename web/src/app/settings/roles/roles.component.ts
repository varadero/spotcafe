import { Component, OnInit, ViewChild } from '@angular/core';

import { DataService } from '../../core/data.service';
import { IRoleWithPermissions } from '../../../../../shared/interfaces/role-with-permissions';
import { IRoleWithPermissionsIds } from '../../../../../shared/interfaces/role-with-permissions-ids';
import { IPermission } from '../../../../../shared/interfaces/permission';
import { RolesService, ISelectablePermission, IRoleErrors, IRoleWithSelectablePermissions } from './roles.service';
import { DisplayMessagesComponent } from '../../shared/display-messages.component';
import { ErrorsService } from '../../shared/errors.service';

@Component({
    templateUrl: './roles.component.html'
})
export class RolesComponent implements OnInit {
    selectedRoleWithPermissions: IRoleWithSelectablePermissions;
    newRoleWithPermissions: IRoleWithSelectablePermissions;
    rolesWithPermissions: IRoleWithSelectablePermissions[];
    permissions: ISelectablePermission[];
    existingRoleErrors: IRoleErrors = {
        hasErrors: false,
        nameIsEmpty: false
    };
    newRoleErrors: IRoleErrors = {
        hasErrors: false,
        nameIsEmpty: false
    };

    @ViewChild('updateRoleMessagesComponent') private updateRoleMessagesComponent: DisplayMessagesComponent;
    @ViewChild('newRoleMessagesComponent') private newRoleMessagesComponent: DisplayMessagesComponent;

    constructor(
        private dataSvc: DataService,
        private rolesService: RolesService,
        private errorsSvc: ErrorsService
    ) { }

    ngOnInit(): void {
        this.resetNewRoleWithPermissions();
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
            this.addSuccessMessage(`Role ${roleWithPermissions.role.name} has been updated`, this.updateRoleMessagesComponent);
            this.loadData();
        } catch (err) {
            this.handleError(err, this.updateRoleMessagesComponent, 'Updating role error:');
        } finally {
        }
    }

    async createRoleWithPermissions(newRoleWithPermissions: IRoleWithSelectablePermissions): Promise<void> {
        this.newRoleErrors = this.rolesService.getRoleErrors(newRoleWithPermissions.role);
        if (this.newRoleErrors.hasErrors) {
            return;
        }

        try {
            const sanitizedEmployeeWithRoles = this.rolesService.getSanitizedRoleWithPermissions(newRoleWithPermissions);
            const roleName = sanitizedEmployeeWithRoles.role.name;
            const createdRoleResult = await this.dataSvc.createRoleWithPermissionsIds(sanitizedEmployeeWithRoles);
            if (!createdRoleResult.alreadyExists) {
                this.addSuccessMessage(`Role ${roleName} has been created`, this.newRoleMessagesComponent);
                this.resetNewRoleWithPermissions();
                this.loadData();
            } else {
                this.addErrorMessage(`Role with name ${roleName} already exists`, this.newRoleMessagesComponent);
            }
        } catch (err) {
            this.handleError(err, this.newRoleMessagesComponent, 'Create role error:');
        } finally {
        }
    }

    private resetNewRoleWithPermissions(): void {
        this.newRoleWithPermissions = <IRoleWithSelectablePermissions>{
            role: {
                description: '',
                id: '',
                name: ''
            },
            permissions: []
        };
    }

    private async loadData(): Promise<void> {
        try {
            // Remember currently selected role with permissions
            const selectedRoleId = this.selectedRoleWithPermissions ? this.selectedRoleWithPermissions.role.id : null;
            const [rolesWithPermissionsIds, permissions] = await Promise.all([
                this.dataSvc.getRolesWithPermissionsIds(),
                this.dataSvc.getPermissions()]
            );
            this.permissions = this.rolesService.clonePermissions(permissions);
            this.rolesWithPermissions = this.rolesService.createRolesWithPermissions(rolesWithPermissionsIds, this.permissions);
            this.selectedRoleWithPermissions = this.rolesWithPermissions.find(x => x.role.id === selectedRoleId);
            this.newRoleWithPermissions.permissions = this.rolesService.clonePermissions(permissions);
        } catch (err) {
        } finally {
        }
    }

    private addSuccessMessage(text: string, messagesComponent: DisplayMessagesComponent): void {
        messagesComponent.addSuccessMessage(text);
    }

    private addErrorMessage(text: string, messageComponent: DisplayMessagesComponent): void {
        messageComponent.addErrorMessage(text);
    }

    private handleError(err: any, messagesComponent: DisplayMessagesComponent, messagePrefix: string): void {
        const errMessage = this.errorsSvc.getNetworkErrorMessage(err, messagePrefix);
        messagesComponent.addErrorMessage(errMessage);
    }
}
