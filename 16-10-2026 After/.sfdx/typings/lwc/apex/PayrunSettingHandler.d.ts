declare module "@salesforce/apex/PayrunSettingHandler.staffPayroll" {
  export default function staffPayroll(param: {payrollId: any}): Promise<any>;
}
declare module "@salesforce/apex/PayrunSettingHandler.accpetedStaffPayroll" {
  export default function accpetedStaffPayroll(param: {payrollId: any}): Promise<any>;
}
declare module "@salesforce/apex/PayrunSettingHandler.getLastPayDate" {
  export default function getLastPayDate(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/PayrunSettingHandler.staffPayrollDate" {
  export default function staffPayrollDate(param: {payrollId: any}): Promise<any>;
}
declare module "@salesforce/apex/PayrunSettingHandler.fetchFacilitiesByOrgId" {
  export default function fetchFacilitiesByOrgId(): Promise<any>;
}
declare module "@salesforce/apex/PayrunSettingHandler.getpPaySettings" {
  export default function getpPaySettings(): Promise<any>;
}
declare module "@salesforce/apex/PayrunSettingHandler.newStaffList" {
  export default function newStaffList(param: {payrollSettingId: any}): Promise<any>;
}
declare module "@salesforce/apex/PayrunSettingHandler.payrollRun" {
  export default function payrollRun(param: {employmentType: any}): Promise<any>;
}
declare module "@salesforce/apex/PayrunSettingHandler.updatePayset" {
  export default function updatePayset(param: {paysetId: any, jsonStringStaffPayollId: any}): Promise<any>;
}
declare module "@salesforce/apex/PayrunSettingHandler.insertInvoice" {
  export default function insertInvoice(param: {JsonString: any, jsonStringStaffPayollId: any, facilityid: any, periodStartDate: any, periodEndDate: any, nextPayDate: any, frequency: any, groupName: any}): Promise<any>;
}
declare module "@salesforce/apex/PayrunSettingHandler.getValidationLogs" {
  export default function getValidationLogs(param: {payrollId: any}): Promise<any>;
}
