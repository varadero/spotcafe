export interface IRouteActionResult<T> {
    status?: number;
    error?: IRouteActionResultError;
    value?: T;
}

export interface IRouteActionResultError {
    message: string;
    number?: number | undefined;
}
