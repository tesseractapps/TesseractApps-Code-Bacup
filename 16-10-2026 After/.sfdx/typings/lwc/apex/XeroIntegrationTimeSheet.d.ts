declare module "@salesforce/apex/XeroIntegrationTimeSheet.sendSelectedPayPeriodTimesheets" {
  export default function sendSelectedPayPeriodTimesheets(param: {staffIds: any, startDates: any, endDates: any, categoryRateSelections: any}): Promise<any>;
}
declare module "@salesforce/apex/XeroIntegrationTimeSheet.validatePayPeriodBeforeRateSelector" {
  export default function validatePayPeriodBeforeRateSelector(param: {staffIds: any, startDateStr: any, endDateStr: any}): Promise<any>;
}
