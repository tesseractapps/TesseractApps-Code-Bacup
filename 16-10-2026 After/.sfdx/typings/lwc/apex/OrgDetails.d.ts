declare module "@salesforce/apex/OrgDetails.orgName" {
  export default function orgName(): Promise<any>;
}
declare module "@salesforce/apex/OrgDetails.orgDetails" {
  export default function orgDetails(): Promise<any>;
}
declare module "@salesforce/apex/OrgDetails.orgDetailsCommunity" {
  export default function orgDetailsCommunity(): Promise<any>;
}
declare module "@salesforce/apex/OrgDetails.orgDetailsRoster" {
  export default function orgDetailsRoster(): Promise<any>;
}
declare module "@salesforce/apex/OrgDetails.updateUserOrganisation" {
  export default function updateUserOrganisation(param: {userId: any, orgName: any}): Promise<any>;
}
declare module "@salesforce/apex/OrgDetails.getUserOrg" {
  export default function getUserOrg(param: {userId: any}): Promise<any>;
}
declare module "@salesforce/apex/OrgDetails.generateCustomGUID" {
  export default function generateCustomGUID(): Promise<any>;
}
declare module "@salesforce/apex/OrgDetails.updateWeekStartDay" {
  export default function updateWeekStartDay(param: {orgId: any, weekStartDay: any, defaultView: any, defaultTimesheetRange: any, fortnightStartDate: any}): Promise<any>;
}
declare module "@salesforce/apex/OrgDetails.RejectedShiftSettings" {
  export default function RejectedShiftSettings(param: {orgId: any, rejectShiftHours: any}): Promise<any>;
}
declare module "@salesforce/apex/OrgDetails.saveInvoiceDueDays" {
  export default function saveInvoiceDueDays(param: {orgId: any, invoiceDueDays: any}): Promise<any>;
}
declare module "@salesforce/apex/OrgDetails.updateOrgInvoiceFormat" {
  export default function updateOrgInvoiceFormat(param: {orgId: any, invoiceFormat: any}): Promise<any>;
}
