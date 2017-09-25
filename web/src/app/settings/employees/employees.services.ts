import { Injectable } from '@angular/core';

import { IRole } from '../../../../../shared/interfaces/role';
import { IEmployeeWithRoles } from '../../../../../shared/interfaces/employee-with-roles';
import { IEmployee } from '../../../../../shared/interfaces/employee';

@Injectable()
export class EmployeesService {
    cloneRoles(roles: IRole[]): IRole[] {
        const result: IRole[] = [];
        for (let i = 0; i < roles.length; i++) {
            const role = roles[i];
            result.push({
                description: role.description,
                id: role.id,
                name: role.name

            });
        }
        return result;
    }

    getSanitizedEmployeeWithRoles(employeeWithRoles: IEmployeeWithRoles): IEmployeeWithRoles {
        const result = { ...employeeWithRoles };
        result.roles = [...employeeWithRoles.roles];
        // Remove not selected roles
        result.roles = (<ISelectableRole[]>result.roles).filter(x => x.selected);
        // Remove 'selected' property
        result.roles = result.roles.map(x => (<IRole>{
            id: x.id
        }));
        return result;
    }

    getNewEmployeeErrors(employeeWithRoles: INewEmployeeWithSelectableRoles): INewEmployeeErrors {
        const employee = employeeWithRoles.employee;
        // Get employee errors
        const result: INewEmployeeErrors = this.getEmployeeErrors(employee);
        // Add specific errors for new employee
        if (!employee.password
            || !employee.password.trim()
            || employee.password !== employeeWithRoles.confirmPassword) {
            result.passwordsDontMatch = true;
        }
        if (employee.password && employee.password.length < 6) {
            result.passwordTooShort = true;
        }
        result.hasErrors = result.passwordsDontMatch || result.passwordTooShort || result.usernameNotSupplied;
        return result;
    }

    getEmployeeErrors(employee: IEmployee): INewEmployeeErrors {
        const result: INewEmployeeErrors = <INewEmployeeErrors>{};
        if (!employee.username || !employee.username.trim()) {
            result.usernameNotSupplied = true;
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

    private getRoleById(roles: IRole[], roleId: string): IRole | null {
        for (let i = 0; i < roles.length; i++) {
            const role = roles[i];
            if (role.id === roleId) {
                return role;
            }
        }
        return null;
    }
}

export interface INewEmployeeWithSelectableRoles extends IEmployeeWithSelectableRoles {
    confirmPassword: string;
}

export interface INewEmployeeErrors {
    hasErrors: boolean;
    usernameNotSupplied: boolean;
    passwordsDontMatch: boolean;
    passwordTooShort: boolean;
}

export interface IEmployeeWithSelectableRoles {
    employee: IEmployee;
    roles: ISelectableRole[];
}

export interface ISelectableRole extends IRole {
    selected: boolean;
}
