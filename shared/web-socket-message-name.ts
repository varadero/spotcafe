export enum WebSocketMessageName {
    ping = 'ping',
    getDrivesRequest = 'get-drives-request',
    getDrivesResponse = 'get-drives-response',
    getFolderItemsRequest = 'get-folder-items-request',
    getFolderItemsResponse = 'get-folder-items-response',
    startDevice = 'start-device',
    stopDevice = 'stop-device',
    getProcessesRequest = 'get-processes-request',
    getProcessesResponse = 'get-processes-response',
    killProcessRequest = 'kill-process-request',
    deviceNotFoundError = 'device-not-found-error',
    executeActionRequest = 'execute-action-request'
}

export enum WebSocketMessageErrorNumber {
    deviceNotConnected = 1
}
