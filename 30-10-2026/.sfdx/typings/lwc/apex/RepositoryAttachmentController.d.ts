declare module "@salesforce/apex/RepositoryAttachmentController.fetchClientFiles" {
  export default function fetchClientFiles(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/RepositoryAttachmentController.UpdateFileSize" {
  export default function UpdateFileSize(param: {recordId: any, filesize: any}): Promise<any>;
}
declare module "@salesforce/apex/RepositoryAttachmentController.fetchRepositoryData" {
  export default function fetchRepositoryData(param: {organisationId: any}): Promise<any>;
}
declare module "@salesforce/apex/RepositoryAttachmentController.deleteRepository" {
  export default function deleteRepository(param: {repData: any}): Promise<any>;
}
declare module "@salesforce/apex/RepositoryAttachmentController.getRelatedFilesByRecordId" {
  export default function getRelatedFilesByRecordId(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/RepositoryAttachmentController.saveFileToAttachment" {
  export default function saveFileToAttachment(param: {csvContent: any, objectId: any}): Promise<any>;
}
declare module "@salesforce/apex/RepositoryAttachmentController.getRepoData" {
  export default function getRepoData(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/RepositoryAttachmentController.attachFiles" {
  export default function attachFiles(param: {RepositoryId: any, Awsjson: any, attachmentId: any}): Promise<any>;
}
declare module "@salesforce/apex/RepositoryAttachmentController.getRepositoryHistoryLog" {
  export default function getRepositoryHistoryLog(param: {repositoryId: any}): Promise<any>;
}
declare module "@salesforce/apex/RepositoryAttachmentController.getRepoTypes" {
  export default function getRepoTypes(param: {organisationId: any}): Promise<any>;
}
declare module "@salesforce/apex/RepositoryAttachmentController.saveNewRepoType" {
  export default function saveNewRepoType(param: {organisationId: any, newType: any}): Promise<any>;
}
declare module "@salesforce/apex/RepositoryAttachmentController.deleteRepoType" {
  export default function deleteRepoType(param: {organisationId: any, typeToDelete: any}): Promise<any>;
}
declare module "@salesforce/apex/RepositoryAttachmentController.renameRepoType" {
  export default function renameRepoType(param: {organisationId: any, oldType: any, newType: any}): Promise<any>;
}
declare module "@salesforce/apex/RepositoryAttachmentController.archiveRepositoryAttachment" {
  export default function archiveRepositoryAttachment(param: {attachmentId: any}): Promise<any>;
}
declare module "@salesforce/apex/RepositoryAttachmentController.restoreRepositoryAttachment" {
  export default function restoreRepositoryAttachment(param: {attachmentId: any}): Promise<any>;
}
declare module "@salesforce/apex/RepositoryAttachmentController.getArchivedRepositoryAttachments" {
  export default function getArchivedRepositoryAttachments(param: {organisationId: any}): Promise<any>;
}
