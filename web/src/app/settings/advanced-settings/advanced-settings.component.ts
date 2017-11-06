import { Component, ViewChild } from '@angular/core';

import { DataService } from '../../core/data.service';
import { ISetting } from '../../../../../shared/interfaces/setting';
import { DisplayMessagesComponent } from '../../shared/display-messages.component';
import { ErrorsService } from '../../shared/errors.service';

@Component({
    templateUrl: './advanced-settings.component.html',
    styleUrls: ['./advanced-settings.component.css']
})
export class AdvancedSettingsComponent {
    settings: ISetting[];
    nameSearchText = '';

    private allowedKeys: string[];

    @ViewChild('updateSettingMessagesComponent') private updateSettingMessagesComponent: DisplayMessagesComponent;
    @ViewChild('loadSettingMessagesComponent') private loadSettingMessagesComponent: DisplayMessagesComponent;

    constructor(private dataSvc: DataService, private errorsSvc: ErrorsService) {
        this.setAllowedKeys();
    }

    async loadSettings(nameSearchText: string): Promise<void> {
        try {
            this.settings = await this.dataSvc.getSettings(nameSearchText);
        } catch (err) {
            this.handleError(err, this.loadSettingMessagesComponent, 'Load settings error:');
        } finally {

        }
    }

    async updateSetting(setting: ISetting): Promise<void> {
        try {
            await this.dataSvc.updateSetting(setting);
            this.updateSettingMessagesComponent.addSuccessMessage(`Advanced setting '${setting.name}' was updated`);
        } catch (err) {
            this.handleError(err, this.updateSettingMessagesComponent, 'Update settings error:');
        } finally {

        }
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

    private handleError(err: any, messagesComponent: DisplayMessagesComponent, messagePrefix: string): void {
        const errMessage = this.errorsSvc.getNetworkErrorMessage(err, messagePrefix);
        messagesComponent.addErrorMessage(errMessage);
    }
}
