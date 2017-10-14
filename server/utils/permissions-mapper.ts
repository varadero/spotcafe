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
        clientDeviceFullAccess: string;
        devicesGroupsView: string;
        devicesGroupsModify: string;
        clientsGroupsView: string;
        clientsGroupsModify: string;
        clientsView: string;
        clientsModify: string;
        clientFullAccess: string;
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
        po.push(pids.clientDeviceFullAccess = 'A4137DA8-1632-4357-95C4-8634F39D5B67');
        po.push(pids.devicesGroupsView = '0757BE66-05B8-425E-ACBC-64D32D06827F');
        po.push(pids.devicesGroupsModify = '0887CD1B-D3C7-4F75-99DE-475A01CA251C');
        po.push(pids.clientsGroupsView = '6B59A7A0-F3D9-4514-883C-EAD1FE264D9C');
        po.push(pids.clientsGroupsModify = 'BC0BB9E9-5D42-4D99-A94D-BB40B4BB22B4');
        po.push(pids.clientsView = '2745ED16-1FCD-4F4A-B1D3-AC4916E5D7E7');
        po.push(pids.clientsModify = 'D2DD76AE-1403-46E9-881E-F6048ABD8410');
        po.push(pids.clientFullAccess = '5C10C8F1-B92F-4630-85A8-63B06FABBFD9');
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
