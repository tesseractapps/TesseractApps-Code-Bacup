declare module "@salesforce/apex/AccountingBankingController.getLedgerItemsAssetsLiabilities" {
  export default function getLedgerItemsAssetsLiabilities(param: {companyId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingBankingController.getInvoicesBasedOnEntity" {
  export default function getInvoicesBasedOnEntity(param: {companyId: any, entityId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingBankingController.createPaymentWithInvoiceUpdates" {
  export default function createPaymentWithInvoiceUpdates(param: {paymentRecord: any, invoiceList: any, isSpendMoney: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingBankingController.updateLedgerItemId" {
  export default function updateLedgerItemId(param: {ledgerItemId: any, amount: any, category: any, entryType: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingBankingController.updateDataForCashPayment" {
  export default function updateDataForCashPayment(param: {salesEntryJson: any, salesEntryListJson: any, amountEntryJson: any, paymentJson: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingBankingController.updateDataForCashReceipt" {
  export default function updateDataForCashReceipt(param: {salesEntryJson: any, salesEntryListJson: any, amountEntryJson: any, paymentJson: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingBankingController.getAccountingPaymentPdf" {
  export default function getAccountingPaymentPdf(param: {paymentId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingBankingController.getentityEmailForPaymentInvoices" {
  export default function getentityEmailForPaymentInvoices(param: {invoiceId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingBankingController.getEmailBodyforParentInvoices" {
  export default function getEmailBodyforParentInvoices(param: {invoiceid: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingBankingController.sendEmailforInvoicePayments" {
  export default function sendEmailforInvoicePayments(param: {invoiceid: any, toAddress: any, ccAddress: any, url: any, subject: any, body: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingBankingController.getNextOverpaymentNumber" {
  export default function getNextOverpaymentNumber(param: {companyId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingBankingController.saveOverpaymentRecord" {
  export default function saveOverpaymentRecord(param: {companyId: any, paymentId: any, amount: any, paymentDate: any, opNumber: any, isSpendMoney: any}): Promise<any>;
}
