import { Component, Input } from '@angular/core';

import { IBaseEntity } from '../../../../../shared/interfaces/base-entity';

@Component({
    selector: 'spotcafe-base-entity',
    templateUrl: './base-entity.component.html'
})
export class BaseEntityComponent {
    @Input() entity: IBaseEntity;
}
