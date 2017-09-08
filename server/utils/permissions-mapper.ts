export class PermissionsMapper {
    permissionIds: {
        employeesView: string;
        employeesModify: string;
        clientDevicesView: string;
        clientDevicesModify: string;
    };
    private permissionsOrder: string[] = [];

    constructor() {
        this.permissionIds = <any>{};
        const pids = this.permissionIds;
        const po = this.permissionsOrder;
        po.push(pids.employeesView = 'E0E615C4-8727-41D3-BE61-682CC765D2D8');
        po.push(pids.employeesModify = 'C2986027-3D76-4455-81EC-DB93D9327710');
        po.push(pids.clientDevicesView = 'E6508163-0FBA-4EAB-BCC7-2B2984318503');
        po.push(pids.clientDevicesModify = 'DB936DD5-0CEB-4BFA-98FE-344F68484BE7');
    }

    mapToBinaryString(permissionIds: string[]): string {
        let result = '';
        for (let i = 0; i < this.permissionsOrder.length; i++) {
            const exists = permissionIds.includes(this.permissionsOrder[i]);
            result += exists ? '1' : '0';
        }
        return result;
    }

    mapToPermissionIds(binaryString: string): string[] {
        const result = [];
        for (let i = 0; i < binaryString.length; i++) {
            if (binaryString[i] === '1') {
                result.push(this.permissionsOrder[i]);
            }
        }
        return result;
    }

    hasPermission(permissionId: string, binaryString: string): boolean {
        const index = this.permissionsOrder.indexOf(permissionId);
        if (index < 0) {
            return false;
        }
        return binaryString[index] === '1';
    }

    hasAnyPermission(permissionsIds: string[], binaryString: string): boolean {
        for (let i = 0; i < permissionsIds.length; i++) {
            if (this.hasPermission(permissionsIds[i], binaryString)) {
                return true;
            }
        }
        return false;
    }
}