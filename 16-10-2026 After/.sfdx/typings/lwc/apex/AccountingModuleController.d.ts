declare module "@salesforce/apex/AccountingModuleController.getAccountingData" {
  export default function getAccountingData(): Promise<any>;
}
declare module "@salesforce/apex/AccountingModuleController.getAccountListByCompany" {
  export default function getAccountListByCompany(param: {sDate: any, eDate: any, companyId: any, isActive: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingModuleController.getAccountListByCompanyNew" {
  export default function getAccountListByCompanyNew(param: {companyId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingModuleController.getLedgerItems" {
  export default function getLedgerItems(param: {companyId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingModuleController.getLedgerItemsforExpenses" {
  export default function getLedgerItemsforExpenses(param: {companyId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingModuleController.createJournalEntries" {
  export default function createJournalEntries(param: {companyId: any, totalAmount: any, taxAmount: any, subTotal: any, selectedItem: any, description: any, entryType: any, selectedCardType: any, selectedEntityName: any, taxInclusive: any, terms: any, invoiceDate: any, postDate: any, invoiceNo: any, comments: any, createdFromExpenses: any, isGeneralSales: any, amount: any, tax: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingModuleController.getRelatedRecords" {
  export default function getRelatedRecords(param: {sDate: any, eDate: any, itemId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingModuleController.getEntities" {
  export default function getEntities(param: {itemId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingModuleController.getEntityProfileTax" {
  export default function getEntityProfileTax(param: {entityId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingModuleController.getCompanyOnEdit" {
  export default function getCompanyOnEdit(param: {companyId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingModuleController.updateCompany" {
  export default function updateCompany(param: {companyData: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingModuleController.getEntityOnEdit" {
  export default function getEntityOnEdit(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingModuleController.getAccountingInvoice" {
  export default function getAccountingInvoice(param: {sDate: any, eDate: any, companyId: any, isRFQ: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingModuleController.getAccountingInvoiceById" {
  export default function getAccountingInvoiceById(param: {invoiceId: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingModuleController.UpdateDataFromInvoice" {
  export default function UpdateDataFromInvoice(param: {salesEntryJson: any, salesEntryListJson: any, amountEntryJson: any, isRFQ: any, isParticipantInvoice: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingModuleController.deleteMatchingRecords" {
  export default function deleteMatchingRecords(param: {deletedIdsJson: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingModuleController.getAllSalesInvoice" {
  export default function getAllSalesInvoice(param: {sDate: any, eDate: any, companyId: any, isRFQ: any}): Promise<any>;
}
declare module "@salesforce/apex/AccountingModuleController.getOrganisationEmail" {
  export default function getOrganisationEmail(param: {companyId: any}): Promise<any>;
}
