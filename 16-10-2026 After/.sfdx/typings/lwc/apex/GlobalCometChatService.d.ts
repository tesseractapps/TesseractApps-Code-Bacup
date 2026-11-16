declare module "@salesforce/apex/GlobalCometChatService.getCredentials" {
  export default function getCredentials(param: {organisationId: any}): Promise<any>;
}
declare module "@salesforce/apex/GlobalCometChatService.getMyNotifications" {
  export default function getMyNotifications(param: {pageSize: any, pageNumber: any}): Promise<any>;
}
declare module "@salesforce/apex/GlobalCometChatService.clearNotificationsForSender" {
  export default function clearNotificationsForSender(param: {senderUserId: any, organisationId: any}): Promise<any>;
}
declare module "@salesforce/apex/GlobalCometChatService.getAllOrganisations" {
  export default function getAllOrganisations(): Promise<any>;
}
