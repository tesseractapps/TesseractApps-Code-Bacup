declare module "@salesforce/apex/TesseractInvoiceHandler.listofInvoices" {
  export default function listofInvoices(param: {invParentId: any}): Promise<any>;
}
declare module "@salesforce/apex/TesseractInvoiceHandler.listofInvoicesParent" {
  export default function listofInvoicesParent(param: {sDate: any, eDate: any}): Promise<any>;
}
declare module "@salesforce/apex/TesseractInvoiceHandler.insertInvoice" {
  export default function insertInvoice(param: {JsonString: any, dateIssue: any, includeGst: any, invoiceTo: any, dueDate: any, invoiceStatus: any, fileref: any, invName: any}): Promise<any>;
}
declare module "@salesforce/apex/TesseractInvoiceHandler.updateInvoice" {
  export default function updateInvoice(param: {invID: any, statusVal: any, typeOfUpdate: any}): Promise<any>;
}
declare module "@salesforce/apex/TesseractInvoiceHandler.saveSearchKey" {
  export default function saveSearchKey(param: {emailKey: any}): Promise<any>;
}
declare module "@salesforce/apex/TesseractInvoiceHandler.getSearchKeys" {
  export default function getSearchKeys(): Promise<any>;
}
declare module "@salesforce/apex/TesseractInvoiceHandler.sendEmail" {
  export default function sendEmail(param: {base64: any, staffEmail: any, orgName: any, fileName: any}): Promise<any>;
}
declare module "@salesforce/apex/TesseractInvoiceHandler.getInvoiceParentHistory" {
  export default function getInvoiceParentHistory(param: {parentID: any}): Promise<any>;
}
