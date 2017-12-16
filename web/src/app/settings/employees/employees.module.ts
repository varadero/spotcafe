import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';

import { EmployeesRoutnigModule } from './employees-routing.module';
import { EmployeesService } from './employees.service';
import { EmployeesComponent } from './employees.component';

@NgModule({
    declarations: [EmployeesComponent],
    imports: [
        SharedModule,
        EmployeesRoutnigModule
    ],
    providers: [EmployeesService]
})
export class EmployeesModule { }
