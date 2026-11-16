declare module "@salesforce/apex/ClientAttachmentHandler.fetchClientFiles" {
  export default function fetchClientFiles(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.UpdateFileSize" {
  export default function UpdateFileSize(param: {clientId: any, filesize: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.fetchRepositoryData" {
  export default function fetchRepositoryData(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.deleteRepository" {
  export default function deleteRepository(param: {repData: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.getRelatedFilesByRecordId" {
  export default function getRelatedFilesByRecordId(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.fetchStaffByDoc" {
  export default function fetchStaffByDoc(param: {docId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.saveParticipantDocShares" {
  export default function saveParticipantDocShares(param: {docId: any, staffIds: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.fetchAttachmentsForStaff" {
  export default function fetchAttachmentsForStaff(param: {clientId: any, folderId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.fetchClientAttachmentsSecure" {
  export default function fetchClientAttachmentsSecure(param: {clientId: any, folderId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.getFolders" {
  export default function getFolders(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.createFolder" {
  export default function createFolder(param: {name: any, parentId: any, clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.updateFolderName" {
  export default function updateFolderName(param: {folderId: any, newName: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.loadContacts" {
  export default function loadContacts(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.deleteContactAttachment" {
  export default function deleteContactAttachment(param: {attachmentId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.getContactAttachments" {
  export default function getContactAttachments(param: {contactId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.getContactAttachmentCounts" {
  export default function getContactAttachmentCounts(param: {contactIds: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.getAllContactAttachments" {
  export default function getAllContactAttachments(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.saveFolderShares" {
  export default function saveFolderShares(param: {folderId: any, staffIds: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.fetchFolderSharedStaff" {
  export default function fetchFolderSharedStaff(param: {folderId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.archiveAttachment" {
  export default function archiveAttachment(param: {attachmentId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.restoreAttachment" {
  export default function restoreAttachment(param: {attachmentId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.getArchivedAttachments" {
  export default function getArchivedAttachments(param: {clientId: any, folderId: any, isPublic: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.canDeleteFolder" {
  export default function canDeleteFolder(param: {folderId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.deleteFolder" {
  export default function deleteFolder(param: {folderId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.getAllArchivedParticipantAttachments" {
  export default function getAllArchivedParticipantAttachments(): Promise<any>;
}
declare module "@salesforce/apex/ClientAttachmentHandler.getPublicAttachments" {
  export default function getPublicAttachments(param: {clientId: any}): Promise<any>;
}
