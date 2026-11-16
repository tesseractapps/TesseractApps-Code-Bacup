declare module "@salesforce/apex/LeaveController.getLeaves" {
  export default function getLeaves(param: {recordId: any, OrgId: any}): Promise<any>;
}
declare module "@salesforce/apex/LeaveController.getLeavesByOrg" {
  export default function getLeavesByOrg(param: {orgId: any, startDate: any, endDate: any}): Promise<any>;
}
declare module "@salesforce/apex/LeaveController.getHolidayCount" {
  export default function getHolidayCount(param: {startDate: any, endDate: any, state: any}): Promise<any>;
}
declare module "@salesforce/apex/LeaveController.getHolidayList" {
  export default function getHolidayList(param: {state: any, financialYear: any}): Promise<any>;
}
declare module "@salesforce/apex/LeaveController.holidayListbyOrg" {
  export default function holidayListbyOrg(param: {datePicker: any, state: any}): Promise<any>;
}
declare module "@salesforce/apex/LeaveController.getApprovedLeaves" {
  export default function getApprovedLeaves(param: {datePicker: any, staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/LeaveController.updateLeaveStatus" {
  export default function updateLeaveStatus(param: {leaveId: any, statusValue: any, cancelComments: any}): Promise<any>;
}
declare module "@salesforce/apex/LeaveController.getLeavesByUserRole" {
  export default function getLeavesByUserRole(param: {orgId: any, startDate: any, endDate: any}): Promise<any>;
}
declare module "@salesforce/apex/LeaveController.getLeaveById" {
  export default function getLeaveById(param: {recordId: any, leaveId: any}): Promise<any>;
}
declare module "@salesforce/apex/LeaveController.sendLeaveNotification" {
  export default function sendLeaveNotification(param: {leaveId: any}): Promise<any>;
}
declare module "@salesforce/apex/LeaveController.validateLeaveThreshold" {
  export default function validateLeaveThreshold(param: {fromDate: any, toDate: any, facilityId: any}): Promise<any>;
}
