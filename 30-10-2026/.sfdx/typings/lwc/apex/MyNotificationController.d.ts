declare module "@salesforce/apex/MyNotificationController.getUserNotifications" {
  export default function getUserNotifications(): Promise<any>;
}
declare module "@salesforce/apex/MyNotificationController.getUserNotificationscount" {
  export default function getUserNotificationscount(): Promise<any>;
}
declare module "@salesforce/apex/MyNotificationController.markNotificationAsRead" {
  export default function markNotificationAsRead(param: {notificationIds: any}): Promise<any>;
}
