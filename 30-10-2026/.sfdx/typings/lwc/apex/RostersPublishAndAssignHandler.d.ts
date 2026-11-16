declare module "@salesforce/apex/RostersPublishAndAssignHandler.rosterPublish" {
  export default function rosterPublish(param: {addshiftData: any, startdate: any, enddate: any, facilityVal: any, selectedStaffIds: any}): Promise<any>;
}
declare module "@salesforce/apex/RostersPublishAndAssignHandler.getStaffHourlyRates" {
  export default function getStaffHourlyRates(param: {addShiftList: any, startdate: any, enddate: any, facilityVal: any}): Promise<any>;
}
declare module "@salesforce/apex/RostersPublishAndAssignHandler.AssignShiftsInDrag" {
  export default function AssignShiftsInDrag(param: {rate: any, StaffId: any, refId: any, shiftId: any, draggingShiftDate: any, droppedShiftDate: any, staffDateConflictsJson: any}): Promise<any>;
}
declare module "@salesforce/apex/RostersPublishAndAssignHandler.getDragDrogShifts" {
  export default function getDragDrogShifts(param: {StaffId: any, refId: any, shiftId: any, draggingShiftDate: any, droppedShiftDate: any}): Promise<any>;
}
