declare module "@salesforce/apex/TicketManager.createTicket" {
  export default function createTicket(param: {ticket: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.getOrganisations" {
  export default function getOrganisations(): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.getTickets" {
  export default function getTickets(param: {orgId: any, orgName: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.getUsersByOrganizationName" {
  export default function getUsersByOrganizationName(param: {orgName: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.saveOrganisationSettings" {
  export default function saveOrganisationSettings(param: {orgId: any, supportEmail: any, selectedUsers: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.getUsersByIds" {
  export default function getUsersByIds(param: {userIds: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.getOrgNameById" {
  export default function getOrgNameById(param: {orgid: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.getTicketDetailsById" {
  export default function getTicketDetailsById(param: {ticketId: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.getTicketingMembers" {
  export default function getTicketingMembers(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.updateTicket" {
  export default function updateTicket(param: {updatedTicket: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.appendConversationEntry" {
  export default function appendConversationEntry(param: {ticketId: any, sender: any, timestamp: any, message: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.updateResolution" {
  export default function updateResolution(param: {ticketId: any, resolutionText: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.getStatusPicklistValues" {
  export default function getStatusPicklistValues(): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.appendHistoryEntry" {
  export default function appendHistoryEntry(param: {ticketId: any, actionType: any, content: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.appendHistoryEntries" {
  export default function appendHistoryEntries(param: {ticketId: any, changes: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.getHistoryLog" {
  export default function getHistoryLog(param: {ticketId: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.deletePostAttachmentFromTicket" {
  export default function deletePostAttachmentFromTicket(param: {ticketId: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.sendTicketNotificationEmails" {
  export default function sendTicketNotificationEmails(param: {ticketId: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.sendAssignedTicketNotificationEmails" {
  export default function sendAssignedTicketNotificationEmails(param: {ticketId: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.sendAssignedTicketNotificationEmailsWithEmail" {
  export default function sendAssignedTicketNotificationEmailsWithEmail(param: {ticketId: any, assigneeEmail: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.sendAssignmentEmailOnStatusOnly" {
  export default function sendAssignmentEmailOnStatusOnly(param: {ticketId: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.sendCommentOnlyEmailNotification" {
  export default function sendCommentOnlyEmailNotification(param: {ticketId: any, commentText: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.sendResolvedTicketEmail" {
  export default function sendResolvedTicketEmail(param: {ticketId: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.getManagerNameFromFacility" {
  export default function getManagerNameFromFacility(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.getContactNumberByEmail" {
  export default function getContactNumberByEmail(param: {email: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.getStaffByEmail" {
  export default function getStaffByEmail(param: {email: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.insertTicketAttachments" {
  export default function insertTicketAttachments(param: {ticketId: any, Awsjson: any, postattachment: any, attachmentid: any}): Promise<any>;
}
declare module "@salesforce/apex/TicketManager.getStaffNamesByUserIds" {
  export default function getStaffNamesByUserIds(param: {userIds: any}): Promise<any>;
}
