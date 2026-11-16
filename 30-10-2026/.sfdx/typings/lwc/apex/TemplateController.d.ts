declare module "@salesforce/apex/TemplateController.createOfferTemplate" {
  export default function createOfferTemplate(param: {fileName: any, picklistValue: any, orgId: any, serviceId: any, quoteId: any, formId: any, attachmentId: any, hrId: any, url: any, documentTypeId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.deleteOfferTemplate" {
  export default function deleteOfferTemplate(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.getUploadedFileUrl" {
  export default function getUploadedFileUrl(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.savePlaceholders" {
  export default function savePlaceholders(param: {recordId: any, placeholderJSON: any, documentTypeId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.getPlaceholders" {
  export default function getPlaceholders(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.getOfferTemplates" {
  export default function getOfferTemplates(param: {searchKey: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.updateNameInPdfId" {
  export default function updateNameInPdfId(param: {name: any, recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.getPlaceholdersForTemplate" {
  export default function getPlaceholdersForTemplate(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.getAllOfferTemplates" {
  export default function getAllOfferTemplates(): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.saveImageToSalesforce" {
  export default function saveImageToSalesforce(param: {recordId: any, base64Content: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.uploadImageAsPdfToAWS" {
  export default function uploadImageAsPdfToAWS(param: {recordId: any, imageBase64: any, fileName: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.getImageBase64" {
  export default function getImageBase64(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.saveEmailsToBackend" {
  export default function saveEmailsToBackend(param: {recordId: any, emails: any, newJoineeEmail: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.saveFirstName" {
  export default function saveFirstName(param: {recordId: any, name: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.getOfferTemplateDetails" {
  export default function getOfferTemplateDetails(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.getChildSignatureDetails" {
  export default function getChildSignatureDetails(param: {recordId: any, currentUserEmail: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.getCertificateValidationData" {
  export default function getCertificateValidationData(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.getAllChildSignatures" {
  export default function getAllChildSignatures(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.sendRecordEmail" {
  export default function sendRecordEmail(param: {recordId: any, email: any, baseUrl: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.updateCurrentRecipient" {
  export default function updateCurrentRecipient(param: {recordId: any, currentRecipientEmail: any, status: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.getAllRecipients" {
  export default function getAllRecipients(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.notifyNextRecipient" {
  export default function notifyNextRecipient(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.getFileNameFromRecord" {
  export default function getFileNameFromRecord(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.getUploadedSignUrl" {
  export default function getUploadedSignUrl(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.getCurrentUserEmail" {
  export default function getCurrentUserEmail(): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.startEmailSequence" {
  export default function startEmailSequence(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.advanceEmailSequence" {
  export default function advanceEmailSequence(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.getCurrentRecipientInfo" {
  export default function getCurrentRecipientInfo(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.getNextRecipient" {
  export default function getNextRecipient(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.getChildSignatureUrl" {
  export default function getChildSignatureUrl(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.saveMessage" {
  export default function saveMessage(param: {recordId: any, message: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.fetchMessages" {
  export default function fetchMessages(param: {recordId: any, cacheBuster: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.getTSignURL" {
  export default function getTSignURL(): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.updateRecordWithAWSUrl" {
  export default function updateRecordWithAWSUrl(param: {recordId: any, awsUrl: any, serviceId: any, quoteId: any, hrId: any, formId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.deactivateLink" {
  export default function deactivateLink(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.saveTemplateData" {
  export default function saveTemplateData(param: {fileName: any, fileUrl: any, placeholderJSON: any, OrgId: any, key: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.getCompletionCertificatePayload" {
  export default function getCompletionCertificatePayload(param: {recordId: any, currentRecipientEmail: any, currentRecipientAudit: any, totalPages: any, envelopeStatus: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.getOfferTemplateCustomFields" {
  export default function getOfferTemplateCustomFields(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.createOfferTemplateCustomField" {
  export default function createOfferTemplateCustomField(param: {label: any, dataType: any, options: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.updateOfferTemplateCustomField" {
  export default function updateOfferTemplateCustomField(param: {fieldId: any, label: any, dataType: any, options: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateController.deactivateOfferTemplateCustomField" {
  export default function deactivateOfferTemplateCustomField(param: {fieldId: any}): Promise<any>;
}
