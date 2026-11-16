declare module "@salesforce/apex/SignInController.PendingShifts" {
  export default function PendingShifts(param: {startDate: any}): Promise<any>;
}
declare module "@salesforce/apex/SignInController.updateSignInTime" {
  export default function updateSignInTime(param: {loginTime: any, signinId: any, isSignInFromWeb: any}): Promise<any>;
}
declare module "@salesforce/apex/SignInController.updateSignoutTime" {
  export default function updateSignoutTime(param: {logOutTime: any, signinId: any, shiftNotes: any, isSignOutFromWeb: any, SleepoverNightShiftHours: any, nightShiftHourComments: any, extendedComments: any}): Promise<any>;
}
declare module "@salesforce/apex/SignInController.craeteReimbursement" {
  export default function craeteReimbursement(param: {signinId: any, Amount: any, MileageAndOthers: any, comments: any, isupdate: any, reimbId: any, typeofvehicle: any, transportType: any, startTime: any, endTime: any, transportMode: any, expenseType: any, activityVehicleType: any, multipleExpensesJson: any, odoMeterStart: any, OdoMeterEnd: any, orgAdmin: any}): Promise<any>;
}
declare module "@salesforce/apex/SignInController.requestSignIn" {
  export default function requestSignIn(param: {shiftId: any}): Promise<any>;
}
declare module "@salesforce/apex/SignInController.requestSignOut" {
  export default function requestSignOut(param: {shiftId: any}): Promise<any>;
}
declare module "@salesforce/apex/SignInController.createBreakTimeRecord" {
  export default function createBreakTimeRecord(param: {shiftId: any, breakInTime: any, breakStartDate: any}): Promise<any>;
}
declare module "@salesforce/apex/SignInController.updateBreakTimeRecord" {
  export default function updateBreakTimeRecord(param: {breakId: any, breakOutTime: any, breakEndDate: any}): Promise<any>;
}
declare module "@salesforce/apex/SignInController.updateSelectedBreakCheckboxes" {
  export default function updateSelectedBreakCheckboxes(param: {parentShiftId: any, breakRecords: any}): Promise<any>;
}
declare module "@salesforce/apex/SignInController.getShiftDetailsById" {
  export default function getShiftDetailsById(param: {shiftId: any}): Promise<any>;
}
declare module "@salesforce/apex/SignInController.createReimbursementAndApprove" {
  export default function createReimbursementAndApprove(param: {signinId: any, Amount: any, MileageAndOthers: any, comments: any, isupdate: any, reimbId: any, typeofvehicle: any, transportType: any, startTime: any, endTime: any, transportMode: any, expenseType: any, activityVehicleType: any, multipleExpensesJson: any, odoMeterStart: any, OdoMeterEnd: any, approverComments: any, payloadList: any}): Promise<any>;
}
