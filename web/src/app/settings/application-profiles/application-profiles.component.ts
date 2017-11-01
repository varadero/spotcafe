import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

import { DataService } from '../../core/data.service';
import { ErrorsService } from '../../shared/errors.service';
import { WebSocketService, IWebSocketEventArgs } from '../../core/web-socket.service';
import { WebSocketMessageName } from '../../../../../shared/web-socket-message-name';
import { IWebSocketData } from '../../../../../shared/interfaces/web-socket/web-socket-data';
// import { IGetDrivesRequest } from '../../../../../shared/interfaces/web-socket/get-drives-request';
import { IGetDrivesResponse } from '../../../../../shared/interfaces/web-socket/get-drives-response';
import { IGetFolderItemsRequest } from '../../../../../shared/interfaces/web-socket/get-folder-items-request';
import { IGetFolderItemsResponse } from '../../../../../shared/interfaces/web-socket/get-folder-items-response';
import { IClientDevice } from '../../../../../shared/interfaces/client-device';
import { DisplayMessagesComponent } from '../../shared/display-messages.component';
import { IBaseEntity } from '../../../../../shared/interfaces/base-entity';

@Component({
    templateUrl: './application-profiles.component.html',
    styleUrls: ['./application-profiles.component.css']
})
export class ApplicationProfilesComponent implements OnInit, OnDestroy {

    private wsObs: Subject<IWebSocketEventArgs>;
    private subscription: Subscription;

    drives: string[] = [];
    devices: IClientDevice[] = [];
    selectedDevice: IClientDevice;
    selectedDrive: string;
    currentFolder = '';
    selectedFile = '';
    currentPathSegments: string[] = [];
    directories: string[] = [];
    files: string[] = [];

    applicationGroups: IBaseEntity[] = [];
    selectedApplicationGroup: IBaseEntity;
    newApplicationGroup: IBaseEntity;

    @ViewChild('loadInfoMessagesComponent') private loadInfoMessagesComponent: DisplayMessagesComponent;
    @ViewChild('newApplicationGroupMessagesComponent') private newApplicationGroupMessagesComponent: DisplayMessagesComponent;
    @ViewChild('updateApplicationGroupMessagesComponent') private updateApplicationGroupMessagesComponent: DisplayMessagesComponent;

    constructor(
        private dataSvc: DataService,
        private wsSvc: WebSocketService,
        private errorsSvc: ErrorsService) {
        if (this.dataSvc) { }
    }

    ngOnInit(): void {
        this.resetNewApplicationGroup();
        this.wsObs = this.wsSvc.getSubject();
        this.subscription = this.wsObs.subscribe(value => {
            this.handleWebSocketMessage(value);
        });
        this.loadApplicationGroups();
        this.loadDevices();
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    async updateApplicationGroup(applicationGroup: IBaseEntity): Promise<void> {
        const msgComponent = this.updateApplicationGroupMessagesComponent;
        try {
            const id = applicationGroup.id;
            const updateResult = await this.dataSvc.updateApplicationGroup(applicationGroup);
            if (updateResult.alreadyExists) {
                msgComponent.addErrorMessage(`Group with name '${applicationGroup.name}' already exist`);
            } else {
                msgComponent.addSuccessMessage(`Group '${applicationGroup.name}' was updated`);
                await this.loadApplicationGroups();
                const previouslySelectedAppGroup = this.applicationGroups.find(x => x.id === id);
                if (previouslySelectedAppGroup) {
                    this.selectedApplicationGroup = previouslySelectedAppGroup;
                }
            }
        } catch (err) {
            this.handleError(err, msgComponent, 'Update group error:');
        } finally {

        }
    }

    async createApplicationGroup(newApplicationGroup: IBaseEntity): Promise<void> {
        try {
            const createResult = await this.dataSvc.createApplicationGroup(newApplicationGroup);
            if (createResult.alreadyExists) {
                this.newApplicationGroupMessagesComponent.addErrorMessage(`Group with name '${newApplicationGroup.name}' already exist`);
            } else {
                this.newApplicationGroupMessagesComponent.addSuccessMessage(`Group '${newApplicationGroup.name}' was created`);
                this.resetNewApplicationGroup();
                this.loadApplicationGroups();
            }
        } catch (err) {
            this.handleError(err, this.newApplicationGroupMessagesComponent, 'Create group error:');
        } finally {

        }
    }

    async loadApplicationGroups(): Promise<void> {
        try {
            const appGroups = await this.dataSvc.getApplicationGroups();
            this.applicationGroups = appGroups;
        } catch (err) {

        } finally {

        }
    }

    loadDrives(deviceId: string): void {
        this.drives = [];
        this.wsSvc.send({
            name: WebSocketMessageName.getDrivesRequest,
            targetDeviceId: deviceId,
            payload: {
                data: null
            }
        });
    }

    driveSelected(drive: string): void {
        this.wsSvc.send({
            name: WebSocketMessageName.getFolderItemsRequest,
            targetDeviceId: this.selectedDevice.id,
            payload: {
                data: <IGetFolderItemsRequest>{
                    folder: drive
                }
            }
        });
    }

    subFolderSelected(subFolder: string): void {
        this.wsSvc.send({
            name: WebSocketMessageName.getFolderItemsRequest,
            targetDeviceId: this.selectedDevice.id,
            payload: {
                data: <IGetFolderItemsRequest>{
                    folder: this.currentFolder,
                    subFolder: subFolder
                }
            }
        });
    }

    segmentIndexSelected(index: number): void {
        this.wsSvc.send({
            name: WebSocketMessageName.getFolderItemsRequest,
            targetDeviceId: this.selectedDevice.id,
            payload: {
                data: <IGetFolderItemsRequest>{
                    pathSegments: this.currentPathSegments.slice(0, index + 1)
                }
            }
        });
    }

    fileSelected(file: string): void {
        this.selectedFile = this.currentFolder + '\\' + file;
    }

    async loadDevices(): Promise<void> {
        try {
            this.devices = await this.dataSvc.getClientDevices();
        } catch (err) {
        } finally {
        }
    }

    private handleWebSocketMessage(socketEvent: IWebSocketEventArgs): void {
        if (socketEvent.name === 'message') {
            try {
                const msgEvent = <MessageEvent>socketEvent.data;
                const data = <IWebSocketData>JSON.parse(msgEvent.data);
                if (data.payload && data.payload.error) {
                    this.handleError(data.payload, this.loadInfoMessagesComponent, 'Loading data from device error');
                    return;
                }

                if (this.matchesMessage(data, WebSocketMessageName.getDrivesResponse, this.selectedDevice)) {
                    this.handleGetDrivesResponse(data);
                } else if (this.matchesMessage(data, WebSocketMessageName.getFolderItemsResponse, this.selectedDevice)) {
                    this.handleGetFolderItemsResponse(data);
                }
            } catch (err) { }
        }
    }

    private handleGetFolderItemsResponse(data: IWebSocketData): void {
        if (data.payload) {
            const resp = <IGetFolderItemsResponse>data.payload.data;
            if (!resp.success) {
                this.loadInfoMessagesComponent.addErrorMessage(`Can't load selected folder`);
                return;
            }
            this.currentFolder = resp.folder;
            this.currentPathSegments = resp.pathSegments;
            this.directories = resp.directories;
            this.files = resp.files;
        }
    }

    private handleGetDrivesResponse(data: IWebSocketData): void {
        if (data.payload) {
            const resp = <IGetDrivesResponse>data.payload.data;
            this.drives = resp.drives;
            this.selectedDrive = '';
        }
    }

    private matchesMessage(msg: IWebSocketData, messageName: WebSocketMessageName, selectedDevice: IClientDevice): boolean {
        if (!msg.sender) {
            return false;
        }
        if (msg.name === messageName && selectedDevice && msg.sender.deviceId === selectedDevice.id) {
            // This data is for the selected device
            return true;
        }
        return false;
    }

    private resetNewApplicationGroup(): void {
        this.newApplicationGroup = {
            id: '',
            name: '',
            description: ''
        };
    }

    private handleError(err: any, messagesComponent: DisplayMessagesComponent, messagePrefix: string): void {
        const errMessage = this.errorsSvc.getNetworkErrorMessage(err, messagePrefix);
        messagesComponent.addErrorMessage(errMessage);
    }

    // private handleError(err: any, messagesComponent: DisplayMessagesComponent, messagePrefix: string): void {
    //     if (err && err.error && err.error.message) {
    //         messagesComponent.addErrorMessage(`${messagePrefix} ${err.error.message}`);
    //     } else {
    //         messagesComponent.addErrorMessage(`${messagePrefix} ${err.status} ${err.statusText}`);
    //     }
    // }
}
