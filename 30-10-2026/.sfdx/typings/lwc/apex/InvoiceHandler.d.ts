declare module "@salesforce/apex/InvoiceHandler.organizationDetails" {
  export default function organizationDetails(): Promise<any>;
}
declare module "@salesforce/apex/InvoiceHandler.organizationDetailsForRoster" {
  export default function organizationDetailsForRoster(): Promise<any>;
}
declare module "@salesforce/apex/InvoiceHandler.listofInvoices" {
  export default function listofInvoices(param: {invParentId: any}): Promise<any>;
}
declare module "@salesforce/apex/InvoiceHandler.listofInvoicesParent" {
  export default function listofInvoicesParent(param: {sDate: any, eDate: any, staffID: any}): Promise<any>;
}
declare module "@salesforce/apex/InvoiceHandler.insertInvoice" {
  export default function insertInvoice(param: {JsonString: any, OrgId: any, dateIssue: any, invoice: any, includeGst: any, startDate: any, enddate: any, staffID: any, invoiceTo: any, dueDate: any, invoiceStatus: any, fileref: any, invName: any}): Promise<any>;
}
declare module "@salesforce/apex/InvoiceHandler.updateInvoice" {
  export default function updateInvoice(param: {invID: any, statusVal: any, typeOfUpdate: any}): Promise<any>;
}
declare module "@salesforce/apex/InvoiceHandler.saveSearchKey" {
  export default function saveSearchKey(param: {emailKey: any}): Promise<any>;
}
declare module "@salesforce/apex/InvoiceHandler.getSearchKeys" {
  export default function getSearchKeys(): Promise<any>;
}
declare module "@salesforce/apex/InvoiceHandler.sendEmail" {
  export default function sendEmail(param: {base64: any, staffEmail: any, orgName: any, fileName: any}): Promise<any>;
}
declare module "@salesforce/apex/InvoiceHandler.getInvoiceParentHistory" {
  export default function getInvoiceParentHistory(param: {parentID: any}): Promise<any>;
}
declare module "@salesforce/apex/InvoiceHandler.getAccountingInvoiceById" {
  export default function getAccountingInvoiceById(param: {invoiceId: any}): Promise<any>;
}
declare module "@salesforce/apex/InvoiceHandler.getAccountingInvoiceInEdit" {
  export default function getAccountingInvoiceInEdit(param: {invoiceId: any}): Promise<any>;
}
declare module "@salesforce/apex/InvoiceHandler.getEmailBody" {
  export default function getEmailBody(param: {invoiceid: any}): Promise<any>;
}
declare module "@salesforce/apex/InvoiceHandler.sendEmailforInvoiceforSales" {
  export default function sendEmailforInvoiceforSales(param: {invoiceid: any, toAddress: any, ccAddress: any, url: any, subject: any, body: any}): Promise<any>;
}
declare module "@salesforce/apex/InvoiceHandler.sendEmailforInvoice" {
  export default function sendEmailforInvoice(param: {invoiceid: any, toAddress: any, ccAddress: any, url: any, invoiceStartDate: any, invoiceEndDate: any, subject: any, body: any}): Promise<any>;
}
declare module "@salesforce/apex/InvoiceHandler.getEmailBodyICT" {
  export default function getEmailBodyICT(param: {invoiceid: any, invoiceStartDate: any, invoiceEndDate: any}): Promise<any>;
}
declare module "@salesforce/apex/InvoiceHandler.sendEmailforInvoiceforPurchases" {
  export default function sendEmailforInvoiceforPurchases(param: {invoiceid: any, toAddress: any, ccAddress: any, subject: any, body: any}): Promise<any>;
}
declare module "@salesforce/apex/InvoiceHandler.reverseInvoice" {
  export default function reverseInvoice(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/InvoiceHandler.saveUpdateManageInvoice" {
  export default function saveUpdateManageInvoice(param: {salesEntryJson: any, salesEntryListJson: any, amountEntryJson: any, acknowledgedByName: any}): Promise<any>;
}
declare module "@salesforce/apex/InvoiceHandler.createUpdateManualXeroInvoice" {
  export default function createUpdateManualXeroInvoice(param: {salesEntryJson: any, salesEntryListJson: any, amountEntryJson: any, isParticipantInvoice: any, acknowledgedByName: any}): Promise<any>;
}
declare module "@salesforce/apex/InvoiceHandler.getXeroInvoiceHistoryDetails" {
  export default function getXeroInvoiceHistoryDetails(param: {invoiceId: any}): Promise<any>;
}
declare module "@salesforce/apex/InvoiceHandler.deleteMatchingXeroRecords" {
  export default function deleteMatchingXeroRecords(param: {deletedIdsJson: any}): Promise<any>;
}
