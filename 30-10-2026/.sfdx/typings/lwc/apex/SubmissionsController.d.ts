declare module "@salesforce/apex/SubmissionsController.PendingReimbursementsforMobile" {
  export default function PendingReimbursementsforMobile(param: {startDate: any}): Promise<any>;
}
declare module "@salesforce/apex/SubmissionsController.PendingReimbursements" {
  export default function PendingReimbursements(param: {sdate: any, edate: any, status: any}): Promise<any>;
}
declare module "@salesforce/apex/SubmissionsController.getAllReimbursementsforMobile" {
  export default function getAllReimbursementsforMobile(param: {startDate: any}): Promise<any>;
}
declare module "@salesforce/apex/SubmissionsController.getAllReimbursements" {
  export default function getAllReimbursements(param: {startDate: any, endDate: any, status: any}): Promise<any>;
}
declare module "@salesforce/apex/SubmissionsController.getReimbursementById" {
  export default function getReimbursementById(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/SubmissionsController.getShiftReimbursements" {
  export default function getShiftReimbursements(param: {shiftId: any}): Promise<any>;
}
declare module "@salesforce/apex/SubmissionsController.PendingShifts1" {
  export default function PendingShifts1(param: {sdate: any, edate: any}): Promise<any>;
}
declare module "@salesforce/apex/SubmissionsController.getClientNameByShiftWithStaff" {
  export default function getClientNameByShiftWithStaff(param: {shiftWithStaffId: any}): Promise<any>;
}
declare module "@salesforce/apex/SubmissionsController.getClientServiceItems" {
  export default function getClientServiceItems(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/SubmissionsController.updateInvoiceAndReimbursementBulk" {
  export default function updateInvoiceAndReimbursementBulk(param: {reimbursementId: any, payloadList: any, status: any, comments: any}): Promise<any>;
}
declare module "@salesforce/apex/SubmissionsController.getChildRows" {
  export default function getChildRows(param: {serviceIds: any, reimbursementId: any}): Promise<any>;
}
declare module "@salesforce/apex/SubmissionsController.StaffShifts" {
  export default function StaffShifts(param: {staffId: any, shiftDate: any}): Promise<any>;
}
