declare module "@salesforce/apex/PayRunHandler.fetchPayrollStaff" {
  export default function fetchPayrollStaff(): Promise<any>;
}
declare module "@salesforce/apex/PayRunHandler.staffAllocationCalculation" {
  export default function staffAllocationCalculation(param: {payrollId: any}): Promise<any>;
}
declare module "@salesforce/apex/PayRunHandler.updateGovReportStatus" {
  export default function updateGovReportStatus(param: {payrollId: any, refId: any, status: any}): Promise<any>;
}
declare module "@salesforce/apex/PayRunHandler.fetchPayrollStaff1" {
  export default function fetchPayrollStaff1(param: {payrollGroupName: any, Status: any}): Promise<any>;
}
declare module "@salesforce/apex/PayRunHandler.getCustomMetaData" {
  export default function getCustomMetaData(param: {PayDate: any}): Promise<any>;
}
declare module "@salesforce/apex/PayRunHandler.updatePayeventIndicator" {
  export default function updatePayeventIndicator(param: {idList: any}): Promise<any>;
}
declare module "@salesforce/apex/PayRunHandler.getFinalisedList" {
  export default function getFinalisedList(param: {idList: any}): Promise<any>;
}
declare module "@salesforce/apex/PayRunHandler.insertSTPFinalise" {
  export default function insertSTPFinalise(param: {staffPayIDList: any, typeOfsubmission: any, output: any, refID: any}): Promise<any>;
}
declare module "@salesforce/apex/PayRunHandler.getFinalisedActivityLog" {
  export default function getFinalisedActivityLog(param: {staffPayID: any}): Promise<any>;
}
declare module "@salesforce/apex/PayRunHandler.saveSTPResponse" {
  export default function saveSTPResponse(param: {paySettingId: any, typeOfsubmission: any, output: any, refID: any}): Promise<any>;
}
declare module "@salesforce/apex/PayRunHandler.getSTPActivityLog" {
  export default function getSTPActivityLog(param: {paySetID: any}): Promise<any>;
}
