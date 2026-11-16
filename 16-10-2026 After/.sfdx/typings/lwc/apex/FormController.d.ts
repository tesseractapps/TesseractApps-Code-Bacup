declare module "@salesforce/apex/FormController.saveForm" {
  export default function saveForm(param: {formName: any, formJson: any, formType: any, orgId: any, audience: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.doesPublishedFormExist" {
  export default function doesPublishedFormExist(param: {formName: any, orgId: any, audience: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.getForms" {
  export default function getForms(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.getFormsByClient" {
  export default function getFormsByClient(param: {clientId: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.saveFormResponse" {
  export default function saveFormResponse(param: {formId: any, responseJson: any, orgId: any, clientId: any, formName: any, formType: any, status: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.getFormResponses" {
  export default function getFormResponses(): Promise<any>;
}
declare module "@salesforce/apex/FormController.getFormResponsesByClient" {
  export default function getFormResponsesByClient(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.getClientEmailByClientId" {
  export default function getClientEmailByClientId(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.getFormResponsesFiltered" {
  export default function getFormResponsesFiltered(param: {audience: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.updateFormResponse" {
  export default function updateFormResponse(param: {responseId: any, responseJson: any, status: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.updateAwsFields" {
  export default function updateAwsFields(param: {responseId: any, awsUrl: any, awsJson: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.deleteFormResponse" {
  export default function deleteFormResponse(param: {responseId: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.getParticipantsFilter" {
  export default function getParticipantsFilter(param: {facilityIds: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.getParticipants" {
  export default function getParticipants(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.getAvailableForms" {
  export default function getAvailableForms(): Promise<any>;
}
declare module "@salesforce/apex/FormController.getAccessibleForms" {
  export default function getAccessibleForms(param: {participantId: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.getParticipantForms" {
  export default function getParticipantForms(param: {participantId: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.grantAccessToParticipants" {
  export default function grantAccessToParticipants(param: {participantIds: any, formId: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.revokeAccessFromParticipants" {
  export default function revokeAccessFromParticipants(param: {participantIds: any, formId: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.uploadFileToSalesforce" {
  export default function uploadFileToSalesforce(param: {base64Data: any, fileName: any, contentType: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.getStaffEmailByName" {
  export default function getStaffEmailByName(param: {nameValue: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.getFacilityByUserEmail" {
  export default function getFacilityByUserEmail(param: {userEmail: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.sendFormDetailsToStaff" {
  export default function sendFormDetailsToStaff(param: {emailAddress: any, formDataHtml: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.getParticipantsByOrgId" {
  export default function getParticipantsByOrgId(param: {orgid: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.checkFormSignatureStatus" {
  export default function checkFormSignatureStatus(param: {formResponseId: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.fetchFacilitiess" {
  export default function fetchFacilitiess(): Promise<any>;
}
declare module "@salesforce/apex/FormController.getStaffForCurrentUser" {
  export default function getStaffForCurrentUser(): Promise<any>;
}
declare module "@salesforce/apex/FormController.getAccessibleStaffForms" {
  export default function getAccessibleStaffForms(param: {staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.saveStaffFormResponse" {
  export default function saveStaffFormResponse(param: {formId: any, responseJson: any, orgId: any, staffId: any, formName: any, formType: any, status: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.updateStaffFormResponse" {
  export default function updateStaffFormResponse(param: {responseId: any, responseJson: any, status: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.getFormResponsesByStaff" {
  export default function getFormResponsesByStaff(param: {staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/FormController.getEmployeeData" {
  export default function getEmployeeData(param: {facilityid: any}): Promise<any>;
}
