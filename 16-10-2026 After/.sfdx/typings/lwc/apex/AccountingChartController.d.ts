declare module "@salesforce/apex/AccountingChartController.getSalesPurchasesChart" {
  export default function getSalesPurchasesChart(param: {companyId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingChartController.getSalesStatusListByMonth" {
  export default function getSalesStatusListByMonth(param: {companyId: any, selectedMonth: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingChartController.getPurchasesStatusListByMonth" {
  export default function getPurchasesStatusListByMonth(param: {companyId: any, selectedMonth: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingChartController.calculateChartTotalLiability" {
  export default function calculateChartTotalLiability(param: {companyId: any, selectedMonths: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingChartController.calculateChartTotalAssets" {
  export default function calculateChartTotalAssets(param: {companyId: any, selectedMonths: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingChartController.getPurchasesCountChart" {
  export default function getPurchasesCountChart(param: {companyId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingChartController.updateDataFromPurchases" {
  export default function updateDataFromPurchases(param: {salesEntryJson: any, salesEntryListJson: any, amountEntryJson: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingChartController.getAccountingPurchases" {
  export default function getAccountingPurchases(param: {sDate: any, eDate: any, companyId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingChartController.getAccountingPurchasesInEdit" {
  export default function getAccountingPurchasesInEdit(param: {invoiceId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingChartController.getAllLedgerItems" {
  export default function getAllLedgerItems(param: {companyId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingChartController.getAccountingGeneralLedger" {
  export default function getAccountingGeneralLedger(param: {sDate: any, eDate: any, companyId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingChartController.getGeneralLedgerInEdit" {
  export default function getGeneralLedgerInEdit(param: {invoiceId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingChartController.getentityEmail" {
  export default function getentityEmail(param: {entryId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingChartController.getentityEmailForInvoices" {
  export default function getentityEmailForInvoices(param: {invoiceId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingChartController.getInvoiceHistoryDetails" {
  export default function getInvoiceHistoryDetails(param: {invoiceId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingChartController.checkDateOverlapIct" {
  export default function checkDateOverlapIct(param: {sDate: any, eDate: any, companyId: any, ictInvoiceEntry: any, staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingChartController.saveUpdateRfqInvoice" {
  export default function saveUpdateRfqInvoice(param: {salesEntryJson: any, salesEntryListJson: any, amountEntryJson: any, isRFQ: any, isParticipantInvoice: any, isInvoiceFromIct: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingChartController.deleteMatchingRecordsRfq" {
  export default function deleteMatchingRecordsRfq(param: {deletedIdsJson: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingChartController.saveUpdategeneralLedgerData" {
  export default function saveUpdategeneralLedgerData(param: {salesEntryJson: any, salesEntryListJson: any, companyId: any}): Promise<any>;
}
