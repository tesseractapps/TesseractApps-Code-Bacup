declare module "@salesforce/apex/StaffStatusController.getBankDetailsRequestData" {
  export default function getBankDetailsRequestData(param: {taskId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffStatusController.updateBankDetailsRequest" {
  export default function updateBankDetailsRequest(param: {taskId: any, approverComments: any, saveOption: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffStatusController.getStaffCounts" {
  export default function getStaffCounts(param: {userId: any, facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffStatusController.getClientCounts" {
  export default function getClientCounts(param: {userId: any, facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffStatusController.getStaffDetailsByStatus" {
  export default function getStaffDetailsByStatus(param: {status: any, facilityId: any}): Promise<any>;
}
