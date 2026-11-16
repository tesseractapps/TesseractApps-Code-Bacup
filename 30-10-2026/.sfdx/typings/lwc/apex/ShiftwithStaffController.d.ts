declare module "@salesforce/apex/ShiftwithStaffController.getShiftData" {
  export default function getShiftData(param: {userId: any, facilityId: any, startDate: any, endDate: any}): Promise<any>;
}
declare module "@salesforce/apex/ShiftwithStaffController.getStaffWeekData" {
  export default function getStaffWeekData(): Promise<any>;
}
declare module "@salesforce/apex/ShiftwithStaffController.gettimesheetData" {
  export default function gettimesheetData(param: {userId: any, selectedRange: any}): Promise<any>;
}
declare module "@salesforce/apex/ShiftwithStaffController.getAllShiftWithSatff" {
  export default function getAllShiftWithSatff(param: {staffId: any, StartDate: any, EndDate: any}): Promise<any>;
}
declare module "@salesforce/apex/ShiftwithStaffController.updateShiftDetails" {
  export default function updateShiftDetails(param: {enableGeolocation: any, enableSignin: any, enableSignout: any, selectedComments: any, selectedComments1: any, staffId: any, shiftwithstaffId: any}): Promise<any>;
}
declare module "@salesforce/apex/ShiftwithStaffController.deleteCheckList" {
  export default function deleteCheckList(param: {checkListId: any}): Promise<any>;
}
declare module "@salesforce/apex/ShiftwithStaffController.getShiftStatusSummary" {
  export default function getShiftStatusSummary(param: {startDateTime: any, endDateTime: any, toggleLabel: any, facilitySearch: any, facilityName: any, rolefilter: any, roleName: any}): Promise<any>;
}
declare module "@salesforce/apex/ShiftwithStaffController.getRejectedShiftData" {
  export default function getRejectedShiftData(param: {facilityId: any}): Promise<any>;
}
