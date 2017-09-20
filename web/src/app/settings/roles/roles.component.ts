import { Component, OnInit } from '@angular/core';

import { DataService } from '../../core/data.service';
import { IRoleWithPermissions } from '../../../../../shared/interfaces/role-with-permissions';
import { IRoleWithPermissionsIds } from '../../../../../shared/interfaces/role-with-permissions-ids';
import { IPermission } from '../../../../../shared/interfaces/permission';
import { RolesService } from './roles.service';

@Component({
    templateUrl: './roles.component.html'
})
export class RolesComponent implements OnInit {
    selectedRoleWithPermissions: IRoleWithPermissions;
    rolesWithPermissions: IRoleWithPermissions[];
    permissions: IPermission[];

    constructor(
        private dataSvc: DataService,
        private rolesService: RolesService) {
    }

    ngOnInit(): void {
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
        // try {
        //     this.waiting.loadEmployees = true;
        //     // Remember currently selected employee
        //     const selectedEmployeeId = this.selectedEmployeeWithRoles ? this.selectedEmployeeWithRoles.employee.id : null;
        //     const res = await Promise.all([this.dataSvc.getEmployeesWithRoles(), this.dataSvc.getRoles()]);
        //     this.employeesWithRoles = res[0];
        //     this.roles = res[1];
        //     this.resetNewEmployeeWithRoles();
        //     this.employeesSvc.addAllRolesToAllEmployees(this.employeesWithRoles, this.roles);
        //     // Restore selected employee after data was reloaded
        //     this.selectedEmployeeWithRoles = this.employeesWithRoles.find(x => x.employee.id === selectedEmployeeId);
        // } catch (err) {
        //     this.handleError(err, this.loadEmployeesMessagesComponent, 'Loading employees and roles error');
        // } finally {
        //     this.waiting.loadEmployees = false;
        // }
    }
}
