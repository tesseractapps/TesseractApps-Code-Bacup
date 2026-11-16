declare module "@salesforce/apex/SignInCheckListAndNotesHandler.getCheckListByShiftId" {
  export default function getCheckListByShiftId(param: {addShiftId: any, selectedShift: any}): Promise<any>;
}
declare module "@salesforce/apex/SignInCheckListAndNotesHandler.updateCheckListRecords" {
  export default function updateCheckListRecords(param: {checklistUpdatesJson: any}): Promise<any>;
}
declare module "@salesforce/apex/SignInCheckListAndNotesHandler.addShiftActivity" {
  export default function addShiftActivity(param: {shiftStaffId: any, Activity: any}): Promise<any>;
}
declare module "@salesforce/apex/SignInCheckListAndNotesHandler.getActivityLog" {
  export default function getActivityLog(param: {shiftWithStaffID: any}): Promise<any>;
}
