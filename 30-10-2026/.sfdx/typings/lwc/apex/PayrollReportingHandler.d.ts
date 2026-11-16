declare module "@salesforce/apex/PayrollReportingHandler.fetchExpenses" {
  export default function fetchExpenses(param: {startDate: any, endDate: any, facility: any}): Promise<any>;
}
declare module "@salesforce/apex/PayrollReportingHandler.fetchInvoices" {
  export default function fetchInvoices(param: {startDate: any, endDate: any, orgName: any}): Promise<any>;
}
declare module "@salesforce/apex/PayrollReportingHandler.fetchStaffPayrollSetting" {
  export default function fetchStaffPayrollSetting(param: {startDate: any, endDate: any, orgName: any, facilityName: any}): Promise<any>;
}
