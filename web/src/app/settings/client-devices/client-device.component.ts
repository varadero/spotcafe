import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { IClientDeviceDisplay } from './client-device-display';

@Component({
    selector: 'spotcafe-client-device',
    templateUrl: 'client-device.component.html'
})
export class ClientDeviceComponent implements OnInit {
    @Input() clientDeviceDisplay: IClientDeviceDisplay;
    @Output() update = new EventEmitter();

    ngOnInit(): void {
    }
}
