declare module "@salesforce/apex/AddShiftStaffView.getStaffData" {
  export default function getStaffData(param: {roles: any, startDate: any, endDate: any, facIdlist: any, orgID: any, weekDataJson: any, name: any, shiftTypeList: any, statusList: any, refreshKey: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftStaffView.deleterecurShifts" {
  export default function deleterecurShifts(param: {refId: any, recurDate: any, recuringShiftsToDelete: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftStaffView.deleteShiftNotification" {
  export default function deleteShiftNotification(param: {shiftId: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftStaffView.getRecurringShiftDates" {
  export default function getRecurringShiftDates(param: {refId: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftStaffView.updateRecurringShiftChecklist" {
  export default function updateRecurringShiftChecklist(param: {refId: any, recuringShiftsToDelete: any, checklistJson: any, deletedChecklistJson: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftStaffView.markParentShiftsAsDeleted" {
  export default function markParentShiftsAsDeleted(param: {addShiftIds: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftStaffView.getDayDetails" {
  export default function getDayDetails(param: {startDate: any, endDate: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftStaffView.deleteShiftServices" {
  export default function deleteShiftServices(param: {serviceIds: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftStaffView.deleteShifts" {
  export default function deleteShifts(param: {shiftWithStaffIds: any}): Promise<any>;
}
