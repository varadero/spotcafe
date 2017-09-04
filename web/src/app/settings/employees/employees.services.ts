import { Injectable } from '@angular/core';

import { IRole } from '../../../../../shared/interfaces/role';
import { IEmployeeWithRoles } from '../../../../../shared/interfaces/employee-with-roles';

@Injectable()
export class EmployeesServce {
    getSanitizedEmployeeWithRoles(employeeWithRoles: IEmployeeWithRoles): IEmployeeWithRoles {
        const result = {...employeeWithRoles};
        result.roles = [...employeeWithRoles.roles];
        // Remove not selected roles
        result.roles = (<ISelectableRole[]>result.roles).filter(x => x.selected);
        // Remove 'selected' property
        result.roles = result.roles.map(x => (<IRole>{
            id: x.id
        }));
        return result;
    }

    getNewEmployeeErrors(employeeWithRoles: INewEmployeeWithRoles): INewEmployeeErrors {
        const result: INewEmployeeErrors = <INewEmployeeErrors>{};
        if (!employeeWithRoles.employee.username || !employeeWithRoles.employee.username.trim()) {
            result.hasErrors = true;
            result.usernameNotSupplied = true;
        }
        if (!employeeWithRoles.password
            || !employeeWithRoles.password.trim()
            || employeeWithRoles.password !== employeeWithRoles.confirmPassword) {
            result.hasErrors = true;
            result.passwordsDontMatch = true;
        }
        return result;
    }

    addAllRolesToAllEmployees(employeesWithRoles: IEmployeeWithRoles[], allRoles: IRole[]): void {
        for (let i = 0; i < employeesWithRoles.length; i++) {
            const employeeWithRole = employeesWithRoles[i];
            const employeeRoles = <ISelectableRole[]>employeeWithRole.roles;
            employeeRoles.forEach(x => x.selected = true);
            this.addMissingRoles(employeeWithRole.roles, allRoles);
        }
    }

    addMissingRoles(roles: IRole[], allRoles: IRole[]): void {
        for (let i = 0; i < allRoles.length; i++) {
            const role = allRoles[i];
            const existingRole = this.getRoleById(roles, role.id);
            if (!existingRole) {
                const selectableRole = <ISelectableRole>role;
                selectableRole.selected = false;
                roles.push(selectableRole);
            }
        }
    }

    private getRoleById(roles: IRole[], roleId: string): IRole {
        for (let i = 0; i < roles.length; i++) {
            const role = roles[i];
            if (role.id === roleId) {
                return role;
            }
        }
        return null;
    }
}

export interface INewEmployeeWithRoles extends IEmployeeWithRoles {
    password: string;
    confirmPassword: string;
}

export interface INewEmployeeErrors {
    hasErrors: boolean;
    usernameNotSupplied: boolean;
    passwordsDontMatch: boolean;
}

export interface ISelectableRole extends IRole {
    selected: boolean;
}
