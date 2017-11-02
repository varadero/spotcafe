import { Component, Input, Output, EventEmitter } from '@angular/core';

import { IApplicationProfileFile } from '../../../../../shared/interfaces/application-profile-file';
import { IBaseEntity } from '../../../../../shared/interfaces/base-entity';

@Component({
    selector: 'spotcafe-application-profile-file',
    templateUrl: 'application-profile-file.component.html',
    styleUrls: ['./application-profiles.component.css']
})
export class ApplicationProfileFileComponent {
    @Input() applicationProfileFile: IApplicationProfileFile;
    @Input() applicationGroups: IBaseEntity[];
    @Input() selectedApplicationGroup: IBaseEntity;

    @Output() groupSelected = new EventEmitter<IBaseEntity>();

    imageFileChanged(file: File, applicationProfileFile: IApplicationProfileFile): void {
        if (file) {
            const fileReader = new FileReader();
            fileReader.addEventListener('load', () => {
                applicationProfileFile.image = fileReader.result;
                applicationProfileFile.imageFileName = file.name;
            });
            fileReader.readAsDataURL(file);
        }
    }
}
