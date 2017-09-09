import { Component, OnInit, ViewChild } from '@angular/core';

import { DataService } from '../../core/data.sevice';
import { DisplayMessagesComponent } from '../../shared/display-messages.component';
import { IRole } from '../../../../../shared/interfaces/role';
import { IEmployeeWithRoles } from '../../../../../shared/interfaces/employee-with-roles';
import { EmployeesService, INewEmployeeWithRoles, INewEmployeeErrors, ISelectableRole } from './employees.services';
import { IEmployee } from '../../../../../shared/interfaces/employee';

@Component({
    templateUrl: './employees.component.html'
})
export class EmployeesComponent implements OnInit {
    employeesWithRoles: IEmployeeWithRoles[];
    selectedEmployeeWithRoles: IEmployeeWithRoles;
    roles: IRole[] = [];
    newEmployeeWithRoles: INewEmployeeWithRoles;
    newEmployeeErrors: INewEmployeeErrors = {
        hasErrors: false,
        usernameNotSupplied: false,
        passwordsDontMatch: false,
        passwordTooShort: false
    };
    waiting = {
        loadEmployees: false,
        updateEmployee: false,
        createEmployee: false
    };

    @ViewChild('updateEmployeeMessagesComponent') private updateEmployeeMessagesComponent: DisplayMessagesComponent;
    @ViewChild('newEmployeeMessagesComponent') private newEmployeeMessagesComponent: DisplayMessagesComponent;
    @ViewChild('loadEmployeesMessagesComponent') private loadEmployeesMessagesComponent: DisplayMessagesComponent;

    constructor(
        private dataSvc: DataService,
        private employeesSvc: EmployeesService
    ) { }

    async ngOnInit(): Promise<void> {
        this.resetNewEmployeeWithRoles();
        this.loadData();
    }

    async updateEmployeeWithRoles(employeeWithRoles: IEmployeeWithRoles): Promise<void> {
        this.waiting.updateEmployee = true;
        try {
            const sanitizedEmployeeWithRoles = this.employeesSvc.getSanitizedEmployeeWithRoles(employeeWithRoles);
            const updateResponse = await this.dataSvc.updateEmployeeWithRoles(sanitizedEmployeeWithRoles);
            const username = employeeWithRoles.employee.username;
            this.addSuccessMessage(`Employee ${username} has been updated`, this.updateEmployeeMessagesComponent);
        } catch (err) {
            this.handleError(err, this.updateEmployeeMessagesComponent, 'Update employee error');
        } finally {
            this.waiting.updateEmployee = false;
        }
    }

    async createEmployeeWithRoles(employeeWithRoles: INewEmployeeWithRoles): Promise<void> {
        this.newEmployeeErrors = this.employeesSvc.getNewEmployeeErrors(employeeWithRoles);
        if (this.newEmployeeErrors.hasErrors) {
            return;
        }
        try {
            this.waiting.createEmployee = true;
            const sanitizedEmployeeWithRoles = this.employeesSvc.getSanitizedEmployeeWithRoles(employeeWithRoles);
            const username = sanitizedEmployeeWithRoles.employee.username;
            const createdEmployeeResult = await this.dataSvc.createEmployeeWithRoles(sanitizedEmployeeWithRoles);
            if (!createdEmployeeResult.alreadyExists) {
                this.addSuccessMessage(`Employee ${username} has been created`, this.newEmployeeMessagesComponent);
                this.resetNewEmployeeWithRoles();
                this.loadData();
            } else {
                this.addErrorMessage(`Employee with user name ${username} already exists`, this.newEmployeeMessagesComponent);
            }
        } catch (err) {
            this.handleError(err, this.newEmployeeMessagesComponent, 'Create employee error');
        } finally {
            this.waiting.createEmployee = true;
        }
    }

    private async loadData(): Promise<void> {
        try {
            this.waiting.loadEmployees = true;
            // Remember currently selected employee
            const selectedEmployeeId = this.selectedEmployeeWithRoles ? this.selectedEmployeeWithRoles.employee.id : null;
            const res = await Promise.all([this.dataSvc.getEmployeesWithRoles(), this.dataSvc.getRoles()]);
            this.employeesWithRoles = res[0];
            this.roles = res[1];
            this.resetNewEmployeeWithRoles();
            this.employeesSvc.addAllRolesToAllEmployees(this.employeesWithRoles, this.roles);
            // Restore selected employee after data was reloaded
            this.selectedEmployeeWithRoles = this.employeesWithRoles.find(x => x.employee.id === selectedEmployeeId);
        } catch (err) {
            this.handleError(err, this.loadEmployeesMessagesComponent, 'Loading employees and roles error');
        } finally {
            this.waiting.loadEmployees = false;
        }
    }

    private resetNewEmployeeWithRoles(): void {
        this.newEmployeeWithRoles = <INewEmployeeWithRoles>{
            employee: {
                disabled: false,
                email: '',
                firstName: '',
                id: '',
                lastName: '',
                password: '',
                username: ''
            },
            roles: this.employeesSvc.cloneRoles(this.roles)
        };
    }

    private addSuccessMessage(text: string, messagesComponent: DisplayMessagesComponent): void {
        messagesComponent.addSuccessMessage(text);
    }

    private addErrorMessage(text: string, messageComponent: DisplayMessagesComponent): void {
        messageComponent.addErrorMessage(text);
    }

    private handleError(err: any, messagesComponent: DisplayMessagesComponent, messagePrefix: string): void {
        if (err.error && err.error.message) {
            messagesComponent.addErrorMessage(`${messagePrefix} ${err.error.message}`);
        } else {
            messagesComponent.addErrorMessage(`${messagePrefix} ${err.status} ${err.statusText}`);
        }
    }
}
