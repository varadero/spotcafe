import { Component, Input, Output, EventEmitter } from '@angular/core';

import { IApplicationProfileFile } from '../../../../../shared/interfaces/application-profile-file';

@Component({
    selector: 'spotcafe-application-profile-file-list-item',
    templateUrl: 'application-profile-file-list-item.component.html'
})
export class ApplicationProfileFileListItemComponent {
    @Input() applicationProfileFile: IApplicationProfileFile;
    @Input() showImage: boolean;

    @Output() removeSelected = new EventEmitter<void>();

    private allowedKeys: string[];

    constructor() {
        this.setAllowedKeys();
    }

    allowReadOnlyKeys(event: KeyboardEvent): void {
        if (this.allowedKeys.indexOf(event.key) < 0) {
            event.preventDefault();
            return;
        }
    }

    private setAllowedKeys(): void {
        this.allowedKeys = [
            'ArrowLeft',
            'ArrowRight',
            'ArrowTop',
            'ArrowBottom',
            'End',
            'Home'
        ];
    }
}
