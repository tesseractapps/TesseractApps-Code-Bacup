declare module "@salesforce/apex/myTemplates.saveTemplateData" {
  export default function saveTemplateData(param: {templateId: any, fileName: any, fileUrl: any, placeholderJSON: any, orgId: any, key: any, templateName: any, description: any, type: any, status: any}): Promise<any>;
}
declare module "@salesforce/apex/myTemplates.getAllTemplates" {
  export default function getAllTemplates(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/myTemplates.getArchivedTemplates" {
  export default function getArchivedTemplates(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/myTemplates.getSavedTemplates" {
  export default function getSavedTemplates(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/myTemplates.fetchTemplateData" {
  export default function fetchTemplateData(param: {templateId: any}): Promise<any>;
}
declare module "@salesforce/apex/myTemplates.updateTemplateStatus" {
  export default function updateTemplateStatus(param: {templateId: any, actionType: any}): Promise<any>;
}
declare module "@salesforce/apex/myTemplates.getStaffByFacilities" {
  export default function getStaffByFacilities(param: {facIdlist: any}): Promise<any>;
}
declare module "@salesforce/apex/myTemplates.getParticipantAndContactOptions" {
  export default function getParticipantAndContactOptions(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/myTemplates.getRecipientDetailsByEmail" {
  export default function getRecipientDetailsByEmail(param: {email: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/myTemplates.getRecipientDemographicDetails" {
  export default function getRecipientDemographicDetails(param: {sendDocumentFormJson: any}): Promise<any>;
}
declare module "@salesforce/apex/myTemplates.storePdfRecord" {
  export default function storePdfRecord(param: {pdfUrl: any, parentRecordId: any, orgId: any, documentName: any, recipientJson: any, fingerprint: any}): Promise<any>;
}
declare module "@salesforce/apex/myTemplates.deleteTemplate" {
  export default function deleteTemplate(param: {templateId: any}): Promise<any>;
}
declare module "@salesforce/apex/myTemplates.saveCustomFieldConfig" {
  export default function saveCustomFieldConfig(param: {orgId: any, fieldConfig: any}): Promise<any>;
}
declare module "@salesforce/apex/myTemplates.removeCustomFieldConfig" {
  export default function removeCustomFieldConfig(param: {orgId: any, label: any, type: any}): Promise<any>;
}
declare module "@salesforce/apex/myTemplates.getCustomFieldConfig" {
  export default function getCustomFieldConfig(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/myTemplates.saveTemplateShares" {
  export default function saveTemplateShares(param: {templateId: any, staffIds: any}): Promise<any>;
}
declare module "@salesforce/apex/myTemplates.getCurrentUserType" {
  export default function getCurrentUserType(): Promise<any>;
}
declare module "@salesforce/apex/myTemplates.sendTemplateEmail" {
  export default function sendTemplateEmail(param: {toEmails: any, ccEmails: any, templateName: any, documentUrl: any, recipientName: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/myTemplates.getOrgBranding" {
  export default function getOrgBranding(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/myTemplates.getOrganisationName" {
  export default function getOrganisationName(param: {orgId: any}): Promise<any>;
}
