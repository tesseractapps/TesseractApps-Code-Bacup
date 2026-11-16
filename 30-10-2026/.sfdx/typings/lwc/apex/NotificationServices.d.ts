declare module "@salesforce/apex/NotificationServices.getUserNotifications" {
  export default function getUserNotifications(): Promise<any>;
}
declare module "@salesforce/apex/NotificationServices.getSessionId" {
  export default function getSessionId(): Promise<any>;
}
declare module "@salesforce/apex/NotificationServices.getLoggedInStaffId" {
  export default function getLoggedInStaffId(): Promise<any>;
}
declare module "@salesforce/apex/NotificationServices.sendLeaveStatusNotification" {
  export default function sendLeaveStatusNotification(param: {leaveId: any}): Promise<any>;
}
declare module "@salesforce/apex/NotificationServices.getUnreadLeaveRecordIds" {
  export default function getUnreadLeaveRecordIds(param: {staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/NotificationServices.getUnreadRejectedShiftIds" {
  export default function getUnreadRejectedShiftIds(param: {staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/NotificationServices.getUnreadReimbursementIds" {
  export default function getUnreadReimbursementIds(param: {staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/NotificationServices.getUnreadFundsTrackerIds" {
  export default function getUnreadFundsTrackerIds(param: {staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/NotificationServices.markNotificationRead" {
  export default function markNotificationRead(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/NotificationServices.getParticipantFromFundTracker" {
  export default function getParticipantFromFundTracker(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/NotificationServices.markIncidentNotificationRead" {
  export default function markIncidentNotificationRead(param: {recordId: any}): Promise<any>;
}
