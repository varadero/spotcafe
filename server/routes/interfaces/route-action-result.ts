export interface IRouteActionResult<T> {
    status?: number;
    error?: {
        message: string;
        number?: number | undefined;
    };
    value?: T;
}
