declare module "@salesforce/apex/OZEDIController.createClientManual" {
  export default function createClientManual(): Promise<any>;
}
declare module "@salesforce/apex/OZEDIController.createClientTransfer" {
  export default function createClientTransfer(): Promise<any>;
}
declare module "@salesforce/apex/OZEDIController.fetchPaymentConfiguration" {
  export default function fetchPaymentConfiguration(): Promise<any>;
}
declare module "@salesforce/apex/OZEDIController.uploadMVR" {
  export default function uploadMVR(param: {employeeId: any}): Promise<any>;
}
declare module "@salesforce/apex/OZEDIController.processSuperannuation" {
  export default function processSuperannuation(param: {paySetId: any}): Promise<any>;
}
declare module "@salesforce/apex/OZEDIController.checkContributionStatus" {
  export default function checkContributionStatus(param: {uploadUuid: any}): Promise<any>;
}
declare module "@salesforce/apex/OZEDIController.sendContribution" {
  export default function sendContribution(param: {uploadUuid: any}): Promise<any>;
}
declare module "@salesforce/apex/OZEDIController.getValidationHistory" {
  export default function getValidationHistory(param: {staffPayrollId: any}): Promise<any>;
}
declare module "@salesforce/apex/OZEDIController.getValidationSummary" {
  export default function getValidationSummary(param: {paySetId: any}): Promise<any>;
}
declare module "@salesforce/apex/OZEDIController.getValidationLogs" {
  export default function getValidationLogs(param: {paySetId: any}): Promise<any>;
}
declare module "@salesforce/apex/OZEDIController.retrySpecificFailedContributions" {
  export default function retrySpecificFailedContributions(param: {logIds: any, paySetId: any}): Promise<any>;
}
declare module "@salesforce/apex/OZEDIController.getEmployeesNeedingMVR" {
  export default function getEmployeesNeedingMVR(param: {paySetId: any}): Promise<any>;
}
declare module "@salesforce/apex/OZEDIController.generateABAFile" {
  export default function generateABAFile(param: {paySetId: any}): Promise<any>;
}
declare module "@salesforce/apex/OZEDIController.processPayrunPayment" {
  export default function processPayrunPayment(param: {paySetId: any}): Promise<any>;
}
