declare module "@salesforce/apex/ClientDataController.fetchFacilitiess" {
  export default function fetchFacilitiess(param: {recordId: any, firstname: any, lastname: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientDataController.fetchFacilitiessforissueregister" {
  export default function fetchFacilitiessforissueregister(param: {recordId: any, firstname: any, lastname: any, facilityid: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientDataController.getClientById" {
  export default function getClientById(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientDataController.getClientByEmail" {
  export default function getClientByEmail(param: {email: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientDataController.statusClient" {
  export default function statusClient(param: {IdValue: any, status: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientDataController.checkFutureServices" {
  export default function checkFutureServices(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientDataController.insertStaffRecords" {
  export default function insertStaffRecords(param: {clientId: any, roleId: any, selectedStaff: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientDataController.getStaffData" {
  export default function getStaffData(param: {clientId: any, facilityId: any, role: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientDataController.updateStaffAssignments" {
  export default function updateStaffAssignments(param: {clientId: any, assignmentsJSON: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientDataController.updateParticipantContacts" {
  export default function updateParticipantContacts(param: {clientId: any, contactData: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientDataController.getParticipantJournal" {
  export default function getParticipantJournal(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientDataController.getParticipantdetails" {
  export default function getParticipantdetails(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientDataController.saveStatusData" {
  export default function saveStatusData(param: {isAvailable: any, isUnavailable: any, clientId: any, medications: any, allergies: any, notes: any, unavailableStartDate: any, unavailableEndDate: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientDataController.createClientsOnBulk" {
  export default function createClientsOnBulk(param: {templateType: any, records: any, facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientDataController.deleteContacts" {
  export default function deleteContacts(param: {contactIds: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientDataController.getTabPreferredNames" {
  export default function getTabPreferredNames(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientDataController.saveTabPreferredName" {
  export default function saveTabPreferredName(param: {facilityId: any, tabKey: any, preferredName: any, scope: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientDataController.saveParticipantChecklist" {
  export default function saveParticipantChecklist(param: {clientId: any, checklistItemsJson: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientDataController.getParticipantChecklist" {
  export default function getParticipantChecklist(param: {clientId: any}): Promise<any>;
}
