export interface IClientDevice {
    id: string;
    name: string;
    address: string;
    description: string;
    approved: boolean;
    approvedAt?: number;
}
