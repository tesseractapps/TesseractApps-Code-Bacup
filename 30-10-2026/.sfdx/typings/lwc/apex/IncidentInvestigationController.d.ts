declare module "@salesforce/apex/IncidentInvestigationController.getDashboardData" {
  export default function getDashboardData(param: {activeFilter: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentInvestigationController.startAssessment" {
  export default function startAssessment(param: {responseId: any, investigatorId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentInvestigationController.updateCorrectiveAction" {
  export default function updateCorrectiveAction(param: {actionId: any, status: any, notes: any, description: any, attachments: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentInvestigationController.getIncidentResponseForAssessment" {
  export default function getIncidentResponseForAssessment(param: {responseId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentInvestigationController.saveInvestigation" {
  export default function saveInvestigation(param: {investigationData: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentInvestigationController.saveIncidentEvidence" {
  export default function saveIncidentEvidence(param: {attachments: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentInvestigationController.saveCorrectiveAction" {
  export default function saveCorrectiveAction(param: {actionData: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentInvestigationController.getInvestigationForAssessment" {
  export default function getInvestigationForAssessment(param: {responseId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentInvestigationController.getActionRegisterData" {
  export default function getActionRegisterData(param: {activeFilter: any, orgId: any, facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentInvestigationController.saveNdisSubmission" {
  export default function saveNdisSubmission(param: {submission: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentInvestigationController.getLoggedInStaffDetails" {
  export default function getLoggedInStaffDetails(): Promise<any>;
}
declare module "@salesforce/apex/IncidentInvestigationController.deleteIncidentEvidence" {
  export default function deleteIncidentEvidence(param: {evidenceId: any, evidenceType: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentInvestigationController.getCorrectiveActionAttachments" {
  export default function getCorrectiveActionAttachments(param: {actionId: any}): Promise<any>;
}
declare module "@salesforce/apex/IncidentInvestigationController.getCorrectiveActionByIdOrUid" {
  export default function getCorrectiveActionByIdOrUid(param: {actionKey: any}): Promise<any>;
}
