declare module "@salesforce/apex/SupportBillingController.serviceSupportList" {
  export default function serviceSupportList(param: {clientIds: any, startDateStr: any, endDateStr: any, orgid: any, cacheBuster: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportBillingController.getBulkServicesHandler" {
  export default function getBulkServicesHandler(param: {PartcipantIdList: any, sDate: any, eDate: any, orgid: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportBillingController.generateInvoices" {
  export default function generateInvoices(param: {salesEntryJson: any, salesEntryListJson: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportBillingController.updateQty" {
  export default function updateQty(param: {recordId: any, newQty: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportBillingController.getSupportInvoiceById" {
  export default function getSupportInvoiceById(param: {invoiceId: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportBillingController.cancelInvoiceById" {
  export default function cancelInvoiceById(param: {invoiceId: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportBillingController.getEmailBodySupportInvoice" {
  export default function getEmailBodySupportInvoice(param: {invoiceId: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportBillingController.sendEmailForSupportInvoice" {
  export default function sendEmailForSupportInvoice(param: {invoiceId: any, toAddress: any, ccAddress: any, url: any, subject: any, body: any}): Promise<any>;
}
