declare module "@salesforce/apex/issueRegisterSearch.searchIssues" {
  export default function searchIssues(param: {listOfsearchString: any, typeofIssue: any}): Promise<any>;
}
declare module "@salesforce/apex/issueRegisterSearch.getIssues" {
  export default function getIssues(param: {typeofIssue: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/issueRegisterSearch.getIssuesbyId" {
  export default function getIssuesbyId(param: {caseid: any}): Promise<any>;
}
declare module "@salesforce/apex/issueRegisterSearch.saveCaseRecord" {
  export default function saveCaseRecord(param: {organisationName: any, firstName: any, others: any, lastName: any, clientId: any, facilityId: any, role: any, email: any, phone: any, status: any, priorityValue: any, raisedByValue: any, issueTypeValue: any, incidentDate: any, incidentTime: any, allegedDate: any, allegedTime: any, description: any, reportToPolice: any, regardingtheIssue: any, policeComments: any, actionsTaken: any, additionalInfo: any, futureActions: any, participantValue: any, subContractorValue: any, selectedParticipant: any, selectedFacility: any, selectedStaff: any, selectedEmployee: any, staffid: any, jsonsignature: any}): Promise<any>;
}
declare module "@salesforce/apex/issueRegisterSearch.updateCaseRecord" {
  export default function updateCaseRecord(param: {recordId: any, organisationName: any, firstName: any, others: any, lastName: any, clientId: any, facilityId: any, role: any, email: any, phone: any, status: any, priorityValue: any, raisedByValue: any, issueTypeValue: any, incidentDate: any, incidentTime: any, allegedDate: any, allegedTime: any, description: any, reportToPolice: any, regardingtheIssue: any, policeComments: any, actionsTaken: any, additionalInfo: any, futureActions: any, participantValue: any, subContractorValue: any, selectedParticipant: any, selectedFacility: any, selectedStaff: any, selectedEmployee: any, jsonsignature: any}): Promise<any>;
}
declare module "@salesforce/apex/issueRegisterSearch.getLeads" {
  export default function getLeads(): Promise<any>;
}
declare module "@salesforce/apex/issueRegisterSearch.getUserLicense" {
  export default function getUserLicense(): Promise<any>;
}
declare module "@salesforce/apex/issueRegisterSearch.getEmployeeData" {
  export default function getEmployeeData(param: {facilityid: any}): Promise<any>;
}
declare module "@salesforce/apex/issueRegisterSearch.getUserDetails" {
  export default function getUserDetails(): Promise<any>;
}
declare module "@salesforce/apex/issueRegisterSearch.getImageAsBase64" {
  export default function getImageAsBase64(param: {refId: any}): Promise<any>;
}
declare module "@salesforce/apex/issueRegisterSearch.getCaseHistoryLog" {
  export default function getCaseHistoryLog(param: {caseId: any}): Promise<any>;
}
declare module "@salesforce/apex/issueRegisterSearch.getIncidents" {
  export default function getIncidents(param: {userRole: any, currentUserId: any}): Promise<any>;
}
