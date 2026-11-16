declare module "@salesforce/apex/SupportParticipantController.saveParticipants" {
  export default function saveParticipants(param: {participantJson: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.getAllParticipants" {
  export default function getAllParticipants(): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.getParticipantsPaged" {
  export default function getParticipantsPaged(param: {pageSize: any, pageNumber: any, searchName: any, participantType: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.updateParticipantPin" {
  export default function updateParticipantPin(param: {participantId: any, isPinned: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.getTasksByDateRange" {
  export default function getTasksByDateRange(param: {startDate: any, endDate: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.updateTaskDate" {
  export default function updateTaskDate(param: {taskId: any, newDate: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.saveTimeEntry" {
  export default function saveTimeEntry(param: {formJson: any, fundingJson: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.fetchParticipantNDISCatalogue" {
  export default function fetchParticipantNDISCatalogue(param: {serviceType: any, serviceDate: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.fetchParticipantCatalogues" {
  export default function fetchParticipantCatalogues(param: {supportClientId: any, serviceType: any, state: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.saveParticipantCatalogues" {
  export default function saveParticipantCatalogues(param: {supportClientId: any, selectedItems: any, isEditMode: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.fetchParticipantServiceGroups" {
  export default function fetchParticipantServiceGroups(param: {supportClientId: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.fetchServiceTypes" {
  export default function fetchServiceTypes(): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.getSupportEntriesPaged" {
  export default function getSupportEntriesPaged(param: {pageSize: any, pageNumber: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.saveSupportEntry" {
  export default function saveSupportEntry(param: {recordId: any, participantId: any, providerId: any, serviceType: any, supportItemName: any, supportItemNumber: any, serviceDate: any, hours: any, rate: any, claimStatus: any, dataSource: any, notes: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.fetchParticipantsForEntry" {
  export default function fetchParticipantsForEntry(): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.fetchServiceTypesByParticipant" {
  export default function fetchServiceTypesByParticipant(param: {participantId: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.fetchSupportItemsForEntry" {
  export default function fetchSupportItemsForEntry(param: {participantId: any, serviceType: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.fetchSupportItemsForNotes" {
  export default function fetchSupportItemsForNotes(param: {participantId: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.getParticipantsPagedforNotes" {
  export default function getParticipantsPagedforNotes(param: {pageSize: any, pageNumber: any, participantType: any, searchKey: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.createUpdatepdateParticipantContacts" {
  export default function createUpdatepdateParticipantContacts(param: {clientId: any, contactData: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.getParticipantDetails" {
  export default function getParticipantDetails(param: {participantId: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.fetchSupportCoordinatorCatalogue" {
  export default function fetchSupportCoordinatorCatalogue(param: {serviceType: any, serviceDate: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.fetchParticipantSupportCoordinatorCatalogues" {
  export default function fetchParticipantSupportCoordinatorCatalogues(param: {supportClientId: any, serviceType: any, state: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.fetchCoordinatorServiceTypes" {
  export default function fetchCoordinatorServiceTypes(): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.getServiceTypesByParticipant" {
  export default function getServiceTypesByParticipant(param: {participantId: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.saveSupportNote" {
  export default function saveSupportNote(param: {noteData: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.getContactAttachmentCounts" {
  export default function getContactAttachmentCounts(param: {contactIds: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.getAllContactAttachments" {
  export default function getAllContactAttachments(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.getContactAttachments" {
  export default function getContactAttachments(param: {contactId: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.deleteContactAttachment" {
  export default function deleteContactAttachment(param: {attachmentId: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.updateCaseNoteActivity" {
  export default function updateCaseNoteActivity(param: {noteId: any, activityDetails: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportParticipantController.deleteContacts" {
  export default function deleteContacts(param: {contactIds: any}): Promise<any>;
}
