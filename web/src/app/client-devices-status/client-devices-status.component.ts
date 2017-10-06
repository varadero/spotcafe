import { Component, OnInit, OnDestroy } from '@angular/core';

// import { IClientDeviceStatus } from '../../../../shared/interfaces/client-device-status';
import { DataService } from '../core/data.service';
import { IClentDeviceStatusDisplay, ClientDevicesStatusService } from './client-devices-status.service';
// import { IStartClientDeviceResult } from '../../../../shared/interfaces/start-client-device-result';

@Component({
  templateUrl: './client-devices-status.component.html'
})
export class ClientDevicesStatusComponent implements OnInit, OnDestroy {
  clientDevicesStatus: IClentDeviceStatusDisplay[];

  private intervalHandle: number;
  private refreshInterval = 3000;

  constructor(
    private dataSvc: DataService,
    private statusSvc: ClientDevicesStatusService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.stopInterval();
  }

  async startDevice(deviceId: string): Promise<void> {
    try {
      const result = await this.dataSvc.startClientDevice(deviceId);
      if (result.alreadyStarted) {
        // TODO Device is already started
      }
      // TODO Instead of refreshing all devices, return device status in the result
      this.loadData();
    } catch (err) {
    } finally {
    }
  }

  async stopDevice(deviceId: string): Promise<void> {
    try {
      const result = await this.dataSvc.stopClientDevice(deviceId);
      if (result.alreadyStopped) {
        // TODO Device is already stopped
      }
      // TODO Instead of refreshing all devices, return device status in the result
      this.loadData();
    } catch (err) {
    } finally {
    }
  }

  private async loadData(): Promise<void> {
    this.stopInterval();
    try {
      const clientDevicesStatus = await this.dataSvc.getClientDevicesStatus();
      // TODO Merge with existing in order to avoid rerendering every element
      this.clientDevicesStatus = this.statusSvc.convertToClientDevicesStatusDisplay(clientDevicesStatus);
    } catch (err) {
      // TODO Show error
    } finally {
      this.startInterval();
    }
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

