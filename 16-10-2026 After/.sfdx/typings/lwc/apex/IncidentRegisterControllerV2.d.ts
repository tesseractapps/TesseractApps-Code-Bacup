declare module "@salesforce/apex/IncidentRegisterControllerV2.getForms" {
  export default function getForms(): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.getAvailableForms" {
  export default function getAvailableForms(): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.saveFormResponse" {
  export default function saveFormResponse(param: {formId: any, responseJson: any, orgId: any, clientId: any, participantId: any, formName: any, formType: any, statusValue: any, assignedStaffId: any, severity: any, facilityId: any, priorityStaffIds: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.getFormResponses" {
  export default function getFormResponses(param: {orgId: any, facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.getFormDetailsById" {
  export default function getFormDetailsById(param: {formId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.getPreviousFormData" {
  export default function getPreviousFormData(param: {responseId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.updateFormWithHistory" {
  export default function updateFormWithHistory(param: {responseId: any, responseJson: any, historyLog: any, statusValue: any, assignedStaffId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.getFormResponsesByClient" {
  export default function getFormResponsesByClient(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.updateFormResponse" {
  export default function updateFormResponse(param: {responseId: any, responseJson: any, statusValue: any, assignedStaffId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.syncIncidentMetadataFromInvestigation" {
  export default function syncIncidentMetadataFromInvestigation(param: {responseId: any, statusValue: any, assignedStaffId: any, priorityValue: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.deleteFormResponse" {
  export default function deleteFormResponse(param: {responseId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.getStaffRecords" {
  export default function getStaffRecords(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.getAccessibleForms" {
  export default function getAccessibleForms(param: {staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.grantAccessToStaff" {
  export default function grantAccessToStaff(param: {staffIds: any, selectedFormIds: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.clearGrantedForms" {
  export default function clearGrantedForms(param: {staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.getOrgLogo" {
  export default function getOrgLogo(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.getEmployeeData" {
  export default function getEmployeeData(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.appendFormsToStaff" {
  export default function appendFormsToStaff(param: {staffIds: any, formIds: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.deleteLayout" {
  export default function deleteLayout(param: {layoutId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.saveForm" {
  export default function saveForm(param: {formName: any, formJson: any, formType: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.doesPublishedFormExist" {
  export default function doesPublishedFormExist(param: {formName: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.getFormsForUser" {
  export default function getFormsForUser(param: {userType: any, userEmail: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.getParticipants" {
  export default function getParticipants(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.getStaffEmailById" {
  export default function getStaffEmailById(param: {staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.fetchImageAsBase64" {
  export default function fetchImageAsBase64(param: {url: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.getStaffsByOrg" {
  export default function getStaffsByOrg(param: {recordId: any, facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.sendFormDetailsToStaffEdit" {
  export default function sendFormDetailsToStaffEdit(param: {emailAddress: any, formDataHtml: any, orgId: any, participantName: any, assignedToName: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.sendFormDetailsToStaff" {
  export default function sendFormDetailsToStaff(param: {emailAddress: any, formDataHtml: any, orgId: any, participantName: any, assignedToName: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.getAdminUsersForOrg" {
  export default function getAdminUsersForOrg(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.saveIncidentNotificationConfig" {
  export default function saveIncidentNotificationConfig(param: {orgId: any, configJson: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.getIncidentNotificationConfig" {
  export default function getIncidentNotificationConfig(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentRegisterControllerV2.getUnreadIncidentRecordIds" {
  export default function getUnreadIncidentRecordIds(param: {staffId: any}): Promise<any>;
}
