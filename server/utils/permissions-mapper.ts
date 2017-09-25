export class PermissionsMapper {
    static administratorEmployeeId = 'AD0CA48F-E266-48EA-BFB7-0C03147E442C';
    static administratorRoleId = 'D2595A95-630C-4E66-9B2E-1F804154FDF5';

    permissionIds: {
        employeesView: string;
        employeesModify: string;
        clientDevicesView: string;
        clientDevicesModify: string;
        rolesView: string;
        rolesModify: string;
        permissionsView: string;
        permissionsModify: string;
        clientDevicesStatusView: string;
        clientDevicesStatusModify: string;
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
        po.push(pids.rolesView = '4EE5A359-B891-4C98-BE26-99033A456DE0');
        po.push(pids.rolesModify = '88BA6EBF-A9EB-4BC0-BC1F-520F56F94918');
        po.push(pids.permissionsView = '534A9C1D-0D77-42AB-92F6-3E7F27317689');
        po.push(pids.permissionsModify = 'AAF07984-BCE8-41F2-A5E6-8C1D7FFBB0B2');
        po.push(pids.clientDevicesStatusView = '23C1D054-11D6-4DCB-A597-67F665D6328B');
        po.push(pids.clientDevicesStatusModify = '73016218-9257-46ED-ACF4-17006B3CEA3E');
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
