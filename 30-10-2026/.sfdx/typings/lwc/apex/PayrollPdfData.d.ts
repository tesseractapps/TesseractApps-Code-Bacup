declare module "@salesforce/apex/PayrollPdfData.statusPayrollSetting" {
  export default function statusPayrollSetting(param: {paysetId: any}): Promise<any>;
}
declare module "@salesforce/apex/PayrollPdfData.updateSubmit" {
  export default function updateSubmit(param: {paysetId: any, statusValue: any, changedpayDate: any}): Promise<any>;
}
declare module "@salesforce/apex/PayrollPdfData.payrollRun" {
  export default function payrollRun(param: {staffPayrollId: any}): Promise<any>;
}
