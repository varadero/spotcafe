import { Component, Input, Output, EventEmitter } from '@angular/core';

import { IApplicationProfileFile } from '../../../../../shared/interfaces/application-profile-file';

@Component({
    selector: 'spotcafe-application-profile-file-list-item',
    templateUrl: 'application-profile-file-list-item.component.html',
    styleUrls: ['./application-profiles.component.css']
})
export class ApplicationProfileFileListItemComponent {
    @Input() applicationProfileFile: IApplicationProfileFile;
    @Input() showImage: boolean;

    @Output() removeSelected = new EventEmitter<void>();
}
