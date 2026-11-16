declare module "@salesforce/apex/AgreementsHandler.fetchClientFiles" {
  export default function fetchClientFiles(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/AgreementsHandler.UpdateFileSize" {
  export default function UpdateFileSize(param: {clientId: any, filesize: any}): Promise<any>;
}
declare module "@salesforce/apex/AgreementsHandler.fetchRepositoryData" {
  export default function fetchRepositoryData(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/AgreementsHandler.deleteRepository" {
  export default function deleteRepository(param: {repData: any}): Promise<any>;
}
declare module "@salesforce/apex/AgreementsHandler.getRelatedFilesByRecordId" {
  export default function getRelatedFilesByRecordId(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/AgreementsHandler.checkSignatureStatus" {
  export default function checkSignatureStatus(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/AgreementsHandler.checkAttachmentSignatureStatus" {
  export default function checkAttachmentSignatureStatus(param: {recordId: any}): Promise<any>;
}
