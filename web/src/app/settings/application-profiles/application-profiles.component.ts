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
import { IApplicationProfileWithFiles } from '../../../../../shared/interfaces/application-profile-with-files';
import { IApplicationProfileFile } from '../../../../../shared/interfaces/application-profile-file';

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
    currentPathSegments: string[] = [];
    directories: string[] = [];
    files: string[] = [];
    filter = '*.exe';
    showProfileFilesImages = false;

    applicationGroups: IBaseEntity[] = [];
    selectedApplicationGroup: IBaseEntity;
    newApplicationGroup: IBaseEntity;

    applicationProfiles: IApplicationProfileWithFiles[] = [];
    selectedApplicationProfile: IApplicationProfileWithFiles;
    newApplicationProfile: IBaseEntity;

    newApplicationProfileFile: IApplicationProfileFile;
    selectedApplicationGroupForNewfile: IBaseEntity;

    @ViewChild('newApplicationGroupMessagesComponent') private newApplicationGroupMessagesComponent: DisplayMessagesComponent;
    @ViewChild('updateApplicationGroupMessagesComponent') private updateApplicationGroupMessagesComponent: DisplayMessagesComponent;

    @ViewChild('loadApplicationProfilesMessagesComponent') private loadApplicationProfilesMessagesComponent: DisplayMessagesComponent;
    @ViewChild('newApplicationProfileMessagesComponent') private newApplicationProfileMessagesComponent: DisplayMessagesComponent;
    @ViewChild('updateApplicationProfileMessagesComponent') private updateApplicationProfileMessagesComponent: DisplayMessagesComponent;
    @ViewChild('addFileTоProfileMessagesComponent') private addFileTоProfileMessagesComponent: DisplayMessagesComponent;

    @ViewChild('deviceMessagesComponent') private deviceMessagesComponent: DisplayMessagesComponent;

    constructor(
        private dataSvc: DataService,
        private wsSvc: WebSocketService,
        private errorsSvc: ErrorsService) {
        if (this.dataSvc) { }
    }

    async ngOnInit(): Promise<void> {
        this.resetNewApplicationGroup();
        this.resetNewApplicationProfile();
        this.resetNewApplicationProfileFile();
        this.wsObs = this.wsSvc.getSubject();
        this.subscription = this.wsObs.subscribe(value => {
            this.handleWebSocketMessage(value);
        });
        this.loadAllData();
    }

    canAddFileToSelectedProfile(): boolean {
        if (this.selectedApplicationProfile
            && this.selectedApplicationProfile.profile
            && this.selectedApplicationProfile.profile.id
            && this.newApplicationProfileFile.filePath
            && this.selectedApplicationGroupForNewfile
            && this.selectedApplicationGroupForNewfile.id) {
            return true;
        }
        return false;
    }

    async loadAllData(): Promise<void> {
        try {
            await this.loadApplicationGroups();
            await this.loadApplicationProfiles();
            await this.loadDevices();
        } catch (err) {
            this.handleError(err, this.loadApplicationProfilesMessagesComponent, 'Load data error:');
        }
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    async addFileToProfile(applicationProfileFile: IApplicationProfileFile, profileId: string): Promise<void> {
        const msgComponent = this.addFileTоProfileMessagesComponent;
        try {
            applicationProfileFile.applicationGroupId = this.selectedApplicationGroupForNewfile.id;
            applicationProfileFile.applicationProfileId = profileId;
            const profile = this.applicationProfiles.find(x => x.profile.id === profileId);
            await this.dataSvc.addFileToApplicationProfile(applicationProfileFile);
            const profileName = profile ? profile.profile.name : '';
            const filePath = applicationProfileFile.filePath;
            msgComponent.addSuccessMessage(`Application file '${filePath}' was added to profile '${profileName}'`);
            await this.loadApplicationProfiles();
            this.setSelectedProfile(profileId);
        } catch (err) {
            this.handleError(err, msgComponent, 'Adding new application file failed:');
        } finally {
        }
    }

    async removeFileFromProfile(fileId: string): Promise<void> {
        try {
            const selectedProfileId = this.selectedApplicationProfile ? this.selectedApplicationProfile.profile.id : '';
            await this.dataSvc.removeFileFromApplicationProfile(fileId);
            await this.loadApplicationProfiles();
            this.setSelectedProfile(selectedProfileId);
        } catch (err) {
            this.handleError(err, this.loadApplicationProfilesMessagesComponent, 'Delete application profile error:');
        } finally {

        }
    }

    async loadApplicationProfiles(): Promise<void> {
        try {
            const profiles = await this.dataSvc.getApplicationProfilesWithFiles();
            this.applicationProfiles = profiles;
        } catch (err) {
            this.handleError(err, this.loadApplicationProfilesMessagesComponent, 'Load application profiles error:');
        } finally {

        }
    }

    async createApplicationProfile(applicationProfile: IBaseEntity): Promise<void> {
        const msgComponent = this.newApplicationProfileMessagesComponent;
        try {
            const createResult = await this.dataSvc.createApplicationProfile(applicationProfile);
            if (createResult.alreadyExists) {
                msgComponent.addErrorMessage(`Profile with name '${applicationProfile.name}' already exist`);
            } else {
                msgComponent.addSuccessMessage(`Profile '${applicationProfile.name}' was created`);
            }
        } catch (err) {
            this.handleError(err, msgComponent, 'Creating new application profile error:');
        }
    }

    async updateApplicationProfile(applicationProfile: IBaseEntity): Promise<void> {
        const msgComponent = this.updateApplicationProfileMessagesComponent;
        try {
            const createResult = await this.dataSvc.updateApplicationProfile(applicationProfile);
            if (createResult.alreadyExists) {
                msgComponent.addErrorMessage(`Profile with name '${applicationProfile.name}' already exist`);
            } else {
                msgComponent.addSuccessMessage(`Profile '${applicationProfile.name}' was updated`);
            }
        } catch (err) {
            this.handleError(err, msgComponent, 'Updating application profile error:');
        }
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
                    folder: drive,
                    searchPattern: this.filter
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
                    subFolder: subFolder,
                    searchPattern: this.filter
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
                    pathSegments: this.currentPathSegments.slice(0, index + 1),
                    searchPattern: this.filter
                }
            }
        });
    }

    fileSelected(file: string): void {
        this.newApplicationProfileFile.filePath = this.currentFolder + '\\' + file;
    }

    async loadDevices(): Promise<void> {
        try {
            this.devices = await this.dataSvc.getClientDevices();
        } catch (err) {
        } finally {
        }
    }

    private setSelectedProfile(profileId: string): void {
        if (!profileId) {
            return;
        }
        const selectedProfile = this.applicationProfiles.find(x => x.profile.id === profileId);
        if (selectedProfile) {
            this.selectedApplicationProfile = selectedProfile;
        }
    }

    private handleWebSocketMessage(socketEvent: IWebSocketEventArgs): void {
        if (socketEvent.name === 'message') {
            try {
                const msgEvent = <MessageEvent>socketEvent.data;
                const data = <IWebSocketData>JSON.parse(msgEvent.data);
                if (data.payload && data.payload.error) {
                    this.handleError(data.payload, this.deviceMessagesComponent, 'Loading data from device error');
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
            this.currentFolder = resp.folder;
            this.currentPathSegments = resp.pathSegments;
            this.directories = resp.directories;
            this.files = resp.files;
            if (!resp.success) {
                this.deviceMessagesComponent.addErrorMessage(`Can't load selected folder`);
                return;
            }
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

    private resetNewApplicationProfileFile(): void {
        this.newApplicationProfileFile = {
            applicationGroupId: '',
            applicationGroupName: '',
            applicationProfileId: '',
            applicationProfileName: '',
            description: '',
            filePath: '',
            id: '',
            image: '',
            imageFileName: ''
        };
    }

    private resetNewApplicationProfile(): void {
        this.newApplicationProfile = {
            id: '',
            name: '',
            description: ''
        };
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
}
