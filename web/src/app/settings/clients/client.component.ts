import { Component, Input } from '@angular/core';
import { IClientDisplay } from './client-display';

@Component({
    selector: 'spotcafe-client',
    templateUrl: './client.component.html'
})
export class ClientComponent {
    @Input() clientDisplay: IClientDisplay;
    @Input() hidePasswords: boolean;
}
