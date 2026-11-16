declare module "@salesforce/apex/ActivityStatementHandler.getActivityStatement" {
  export default function getActivityStatement(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/ActivityStatementHandler.getStatementData" {
  export default function getStatementData(param: {formType: any, startDate: any, endDate: any}): Promise<any>;
}
declare module "@salesforce/apex/ActivityStatementHandler.fetchStaffByOrgId" {
  export default function fetchStaffByOrgId(): Promise<any>;
}
declare module "@salesforce/apex/ActivityStatementHandler.fetchFeedback" {
  export default function fetchFeedback(param: {clientId: any}): Promise<any>;
}
