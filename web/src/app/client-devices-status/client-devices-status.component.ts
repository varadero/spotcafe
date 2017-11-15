import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

// import { IClientDeviceStatus } from '../../../../shared/interfaces/client-device-status';
import { DataService } from '../core/data.service';
import { IClentDeviceStatusDisplay, ClientDevicesStatusService } from './client-devices-status.service';
import { WebSocketService, IWebSocketEventArgs } from '../core/web-socket.service';
import { IWebSocketData } from '../../../../shared/interfaces/web-socket/web-socket-data';
import { MessagesService } from '../shared/messages.service';
import { ErrorsService } from '../shared/errors.service';
import { WebSocketUtilsService } from '../core/web-socket-utils.service';
import { WebSocketMessageName } from '../../../../shared/web-socket-message-name';
import { IGetProcessesResponse, IProcessInfo } from '../../../../shared/interfaces/web-socket/get-processes-response';
import { IKillProcessRequest } from '../../../../shared/interfaces/web-socket/kill-process-request';
import { IIdWithName } from '../../../../shared/interfaces/id-with-name';
import { IExecuteActionRequest } from '../../../../shared/interfaces/web-socket/execute-action-request';

// import { IStartClientDeviceResult } from '../../../../shared/interfaces/start-client-device-result';

enum UtilNames {
  taskManager = 'task-manager'
}

@Component({
  templateUrl: './client-devices-status.component.html'
})
export class ClientDevicesStatusComponent implements OnInit, OnDestroy {
  clientDevicesStatus: IClentDeviceStatusDisplay[];
  utilNames = UtilNames;
  deviceActions: IIdWithName[];

  private intervalHandle: number;
  private refreshInterval = 3000;
  private wsObs: Subject<IWebSocketEventArgs>;
  private subscription: Subscription;
  private lastDeviceRequestedProcesses: string;

  constructor(
    private dataSvc: DataService,
    private statusSvc: ClientDevicesStatusService,
    private wsSvc: WebSocketService,
    private wsUtilsSvc: WebSocketUtilsService,
    private msgSvc: MessagesService,
    private errorsSvc: ErrorsService
  ) { }

  ngOnInit(): void {
    this.deviceActions = [
      { id: 'log-off', name: 'Log off' },
      { id: 'restart', name: 'Restart' },
      { id: 'shutdown', name: 'Shutdown' }
    ];
    this.wsObs = this.wsSvc.getSubject();
    this.subscription = this.wsObs.subscribe(value => {
      this.handleWebSocketMessage(value);
    });
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.stopInterval();
  }

  async startDevice(device: IClentDeviceStatusDisplay): Promise<void> {
    try {
      const result = await this.dataSvc.startClientDevice(device.deviceId);
      if (result.alreadyStartedInfo.alreadyStarted) {
        // TODO Device is already started
      } else if (result.alreadyStartedInfo.clientAccountAlreadyInUse) {
        // Client accoun is already in use - can happen if employees are able to start computer on behalf of a client
      } else if (result.notEnoughCredit) {
        // The client has not enough credit
      }
      // TODO Instead of refreshing all devices, return device status in the result
      this.loadData();
    } catch (err) {
    } finally {
    }
  }

  async stopDevice(device: IClentDeviceStatusDisplay): Promise<void> {
    try {
      const result = await this.dataSvc.stopClientDevice(device.deviceId);
      if (result.alreadyStopped) {
        // TODO Device is already stopped
      }
      // TODO Instead of refreshing all devices, return device status in the result
      this.loadData();
    } catch (err) {
    } finally {
    }
  }

  deviceActionExecuted(device: IClentDeviceStatusDisplay, action: IIdWithName): void {
    if (!device || !action || !action.id) {
      return;
    }
    this.wsSvc.send({
      name: WebSocketMessageName.executeActionRequest,
      payload: {
        data: <IExecuteActionRequest>{
          actionId: action.id
        }
      },
      targetDeviceId: device.deviceId
    });
  }

  getDeviceProcesses(device: IClentDeviceStatusDisplay): void {
    if (!device || !device.deviceId) {
      return;
    }
    this.lastDeviceRequestedProcesses = device.deviceId;
    this.wsSvc.send({
      name: WebSocketMessageName.getProcessesRequest,
      payload: { data: null },
      targetDeviceId: device.deviceId
    });
  }

  killDeviceProcess(device: IClentDeviceStatusDisplay, process: IProcessInfo): void {
    if (!device || !device.deviceId || !process || !process.pid) {
      return;
    }
    this.wsSvc.send({
      name: WebSocketMessageName.killProcessRequest,
      payload: {
        data: <IKillProcessRequest>{
          pid: process.pid
        }
      },
      targetDeviceId: device.deviceId
    });
  }

  deviceUtilsSelected(device: IClentDeviceStatusDisplay, utilName: UtilNames): void {
    this.toggleDeviceUtil(device, utilName, true);
  }

  deviceUtilsClosed(device: IClentDeviceStatusDisplay, utilName: UtilNames): void {
    this.toggleDeviceUtil(device, utilName, false);
  }

  private toggleDeviceUtil(device: IClentDeviceStatusDisplay, utilName: UtilNames, visible: boolean): void {
    if (utilName === UtilNames.taskManager) {
      device.displayItems.utilTaskManagerVisible = visible;
      if (!visible) {
        device.displayItems.processes = [];
      }
    }
  }

  private handleWebSocketMessage(socketEvent: IWebSocketEventArgs): void {
    if (socketEvent.name === 'message') {
      try {
        const msgEvent = <MessageEvent>socketEvent.data;
        const data = <IWebSocketData>JSON.parse(msgEvent.data);
        if (data.payload && data.payload.error) {
          this.handleError(data.payload, 'Loading data from device error');
          return;
        }

        if (this.wsUtilsSvc.matchesMessage(data, WebSocketMessageName.getProcessesResponse, this.lastDeviceRequestedProcesses)) {
          this.handleGetProcessesResponse(data, this.lastDeviceRequestedProcesses);
        }
      } catch (err) { }
    }
  }

  private handleGetProcessesResponse(data: IWebSocketData, senderClientDeviceId: string): void {
    const deviceRequestedProcesses = this.clientDevicesStatus.find(x => x.deviceId === senderClientDeviceId);
    if (deviceRequestedProcesses && data.payload) {
      const resp = <IGetProcessesResponse>data.payload.data;
      if (resp) {
        deviceRequestedProcesses.displayItems.processes = resp.processInfos;
      }
    }
  }

  private async loadData(): Promise<void> {
    this.stopInterval();
    try {
      const clientDevicesStatus = await this.dataSvc.getClientDevicesStatus();
      // TODO Merge with existing in order to avoid rerendering every element
      // TODO which will override properties of IClentDeviceStatusDisplay like utilsvisible
      const clientDevicesStatusDisplay = this.statusSvc.convertToClientDevicesStatusDisplay(clientDevicesStatus, this.clientDevicesStatus);
      this.clientDevicesStatus = clientDevicesStatusDisplay;
    } catch (err) {
      // TODO Show error
    } finally {
      this.startInterval();
    }
  }

  private handleError(err: any, messagePrefix: string): void {
    const errMessage = this.errorsSvc.getNetworkErrorMessage(err, messagePrefix);
    this.msgSvc.addErrorMessage(errMessage);
  }

  private stopInterval(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = 0;
    }
  }

  private startInterval(): void {
    if (this.intervalHandle) {
      return;
    }
    this.intervalHandle = window.setInterval(() => this.loadData(), this.refreshInterval);
  }
}

