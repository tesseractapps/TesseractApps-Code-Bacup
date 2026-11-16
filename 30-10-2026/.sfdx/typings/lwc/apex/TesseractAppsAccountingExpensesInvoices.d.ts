declare module "@salesforce/apex/TesseractAppsAccountingExpensesInvoices.getEntityProfiles" {
  export default function getEntityProfiles(param: {companyId: any, entryType: any}): Promise<any>;
}
declare module "@salesforce/apex/TesseractAppsAccountingExpensesInvoices.getExpenseOnEdit" {
  export default function getExpenseOnEdit(param: {expenseID: any}): Promise<any>;
}
declare module "@salesforce/apex/TesseractAppsAccountingExpensesInvoices.updateExpense" {
  export default function updateExpense(param: {updatedExpense: any}): Promise<any>;
}
declare module "@salesforce/apex/TesseractAppsAccountingExpensesInvoices.getEntryOnEdit" {
  export default function getEntryOnEdit(param: {entryID: any}): Promise<any>;
}
declare module "@salesforce/apex/TesseractAppsAccountingExpensesInvoices.updateSalesEntry" {
  export default function updateSalesEntry(param: {updatedExpense: any}): Promise<any>;
}
declare module "@salesforce/apex/TesseractAppsAccountingExpensesInvoices.updateInvoice" {
  export default function updateInvoice(param: {updatedInvoice: any, updatedInvoiceEntry: any}): Promise<any>;
}
declare module "@salesforce/apex/TesseractAppsAccountingExpensesInvoices.saveIctInvoiceData" {
  export default function saveIctInvoiceData(param: {salesEntryJson: any, invoiceRowListJson: any, amountEntryJson: any, ictInvoiceEntry: any}): Promise<any>;
}
declare module "@salesforce/apex/TesseractAppsAccountingExpensesInvoices.getIctInvoice" {
  export default function getIctInvoice(param: {sDate: any, eDate: any, companyId: any, ictInvoiceEntry: any, staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/TesseractAppsAccountingExpensesInvoices.getRMInvoice" {
  export default function getRMInvoice(param: {sDate: any, eDate: any, companyId: any, rmInvoiceEntry: any}): Promise<any>;
}
declare module "@salesforce/apex/TesseractAppsAccountingExpensesInvoices.saveRMInvoiceData" {
  export default function saveRMInvoiceData(param: {salesEntryJson: any, invoiceRowListJson: any, amountEntryJson: any, rmInvoiceEntry: any}): Promise<any>;
}
declare module "@salesforce/apex/TesseractAppsAccountingExpensesInvoices.deleteExpenseRecord" {
  export default function deleteExpenseRecord(param: {expenseId: any}): Promise<any>;
}
declare module "@salesforce/apex/TesseractAppsAccountingExpensesInvoices.saveNewAccountList" {
  export default function saveNewAccountList(param: {industry: any, newIndustry: any, companyId: any, hierarchyJson: any}): Promise<any>;
}
declare module "@salesforce/apex/TesseractAppsAccountingExpensesInvoices.getNewHierarchyData" {
  export default function getNewHierarchyData(param: {selectedIndustry: any, companyId: any}): Promise<any>;
}
declare module "@salesforce/apex/TesseractAppsAccountingExpensesInvoices.updateLedgerItemName" {
  export default function updateLedgerItemName(param: {itemId: any, updatedName: any}): Promise<any>;
}
declare module "@salesforce/apex/TesseractAppsAccountingExpensesInvoices.insertLedgerItem" {
  export default function insertLedgerItem(param: {accountNumber: any, name: any, ledgerId: any, subCategoryId: any, categoryId: any}): Promise<any>;
}
declare module "@salesforce/apex/TesseractAppsAccountingExpensesInvoices.insertCategory" {
  export default function insertCategory(param: {accountNumber: any, name: any, companyId: any}): Promise<any>;
}
declare module "@salesforce/apex/TesseractAppsAccountingExpensesInvoices.insertSubCategory" {
  export default function insertSubCategory(param: {accountNumber: any, name: any, categoryId: any}): Promise<any>;
}
declare module "@salesforce/apex/TesseractAppsAccountingExpensesInvoices.insertLedger" {
  export default function insertLedger(param: {accountNumber: any, name: any, subCategoryId: any, categoryId: any}): Promise<any>;
}
