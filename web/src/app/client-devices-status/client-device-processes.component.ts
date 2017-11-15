import { Component, Input, Output, EventEmitter } from '@angular/core';

import { IProcessInfo } from '../../../../shared/interfaces/web-socket/get-processes-response';
import { IIdWithName } from '../../../../shared/interfaces/id-with-name';

@Component({
    selector: 'spotcafe-client-device-processes',
    templateUrl: './client-device-processes.component.html',
    styleUrls: ['./client-device-processes.component.css']
})
export class ClientDeviceProcessesComponent {
    @Input() deviceName: string;
    @Input() processes: IProcessInfo[];
    @Input() actions: IIdWithName[];

    @Output() closed = new EventEmitter();
    @Output() refreshed = new EventEmitter();
    @Output() processKilled = new EventEmitter<IProcessInfo>();
    @Output() actionExecuted = new EventEmitter<IIdWithName>();

    selectedProcess: IProcessInfo | null;
    selectedAction: IIdWithName;

    killProcess(process: IProcessInfo): void {
        this.processKilled.next(process);
        this.selectedProcess = null;
    }

    selectProcess(process: IProcessInfo): void {
        this.selectedProcess = process;
    }
}
