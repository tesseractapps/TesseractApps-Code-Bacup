declare module "@salesforce/apex/StaffEmailNotificationController.sendShiftEmails" {
  export default function sendShiftEmails(param: {shiftId: any, roleId: any, facilityId: any, staffId: any, isrecur: any, Sdate: any, Edate: any, typeOfRecur: any, recurEvery: any, weeklyDays: any, monthlyDay: any, groupShift: any, splitShift: any, isAddshiftView: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffEmailNotificationController.sendSplitEmails" {
  export default function sendSplitEmails(param: {shiftId: any, roleId: any, facilityId: any, staffId: any, isrecur: any, Sdate: any, Edate: any, typeOfRecur: any, recurEvery: any, weeklyDays: any, monthlyDay: any, groupShift: any, splitShift: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffEmailNotificationController.getStaffOptions" {
  export default function getStaffOptions(param: {templateId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffEmailNotificationController.fetchStaffByTemplate" {
  export default function fetchStaffByTemplate(param: {templateId: any}): Promise<any>;
}
