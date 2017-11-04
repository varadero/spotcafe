export enum WebSocketMessageName {
    ping = 'ping',
    getDrivesRequest = 'get-drives-request',
    getDrivesResponse = 'get-drives-response',
    getFolderItemsRequest = 'get-folder-items-request',
    getFolderItemsResponse = 'get-folder-items-response',
    startDevice = 'start-device',
    stopDevice = 'stop-device'
}

export enum WebSocketMessageErrorNumber {
    deviceNotConnected = 1
}
