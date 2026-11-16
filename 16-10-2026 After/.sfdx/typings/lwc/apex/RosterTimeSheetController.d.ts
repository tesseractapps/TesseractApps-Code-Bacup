declare module "@salesforce/apex/RosterTimeSheetController.getStaffShiftData" {
  export default function getStaffShiftData(param: {staffIds: any, weekStartDate: any, weekEndDate: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterTimeSheetController.updateAllocations" {
  export default function updateAllocations(param: {shiftIDlist: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterTimeSheetController.getCheckListByShiftId" {
  export default function getCheckListByShiftId(param: {addShiftId: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterTimeSheetController.editAllocation" {
  export default function editAllocation(param: {allocationId: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterTimeSheetController.holidayListbyOrg" {
  export default function holidayListbyOrg(param: {state: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterTimeSheetController.StaffsRolesWiseList" {
  export default function StaffsRolesWiseList(param: {orgId: any, facIdlist: any, roles: any, name: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterTimeSheetController.getMismatchedShifts" {
  export default function getMismatchedShifts(param: {staffId: any, weekStart: any, weekEnd: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterTimeSheetController.getShiftServiceAndSupportPlans" {
  export default function getShiftServiceAndSupportPlans(param: {shiftIds: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterTimeSheetController.getClientJournals" {
  export default function getClientJournals(param: {shiftId: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterTimeSheetController.getDynamicFormsByIds" {
  export default function getDynamicFormsByIds(param: {formIds: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterTimeSheetController.updateActualStartTime" {
  export default function updateActualStartTime(param: {shiftId: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterTimeSheetController.updateActualEndTime" {
  export default function updateActualEndTime(param: {shiftId: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterTimeSheetController.updateReimbursementStatus" {
  export default function updateReimbursementStatus(param: {reimbursementId: any, status: any, approverComments: any}): Promise<any>;
}
