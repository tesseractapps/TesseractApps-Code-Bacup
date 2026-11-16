declare module "@salesforce/apex/SupportCoordinatorAttachmentController.createAttachment" {
  export default function createAttachment(param: {attachmentName: any, attachmentType: any, otherComments: any, expiryDate: any, userId: any, comments: any, supportClientId: any, folderId: any, amazonUrl: any, fileKey: any, fileName: any, fileSize: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportCoordinatorAttachmentController.getAttachments" {
  export default function getAttachments(param: {supportClientId: any, folderId: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportCoordinatorAttachmentController.deleteAttachment" {
  export default function deleteAttachment(param: {attachmentId: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportCoordinatorAttachmentController.updateAttachment" {
  export default function updateAttachment(param: {attachmentId: any, attachmentName: any, attachmentType: any, otherComments: any, expiryDate: any, userId: any, comments: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportCoordinatorAttachmentController.getFolders" {
  export default function getFolders(param: {supportClientId: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportCoordinatorAttachmentController.createFolder" {
  export default function createFolder(param: {name: any, parentId: any, supportClientId: any}): Promise<any>;
}
