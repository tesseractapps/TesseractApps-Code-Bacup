declare module "@salesforce/apex/PayRollExpenseHandler.getExpensesData" {
  export default function getExpensesData(param: {staffId: any, startDate: any, endDate: any}): Promise<any>;
}
declare module "@salesforce/apex/PayRollExpenseHandler.createExpensesAds" {
  export default function createExpensesAds(param: {typeofExpense: any, subType: any, dateValue: any, comments: any, amount: any, selectedValue: any, gst: any}): Promise<any>;
}
declare module "@salesforce/apex/PayRollExpenseHandler.deleteRepository" {
  export default function deleteRepository(param: {repData: any}): Promise<any>;
}
declare module "@salesforce/apex/PayRollExpenseHandler.UpdateFileSize" {
  export default function UpdateFileSize(param: {recordId: any, filesize: any}): Promise<any>;
}
declare module "@salesforce/apex/PayRollExpenseHandler.saveFile" {
  export default function saveFile(param: {selectedValue: any, base64Data: any}): Promise<any>;
}
declare module "@salesforce/apex/PayRollExpenseHandler.insertExpenses" {
  export default function insertExpenses(param: {expenseJson: any}): Promise<any>;
}
declare module "@salesforce/apex/PayRollExpenseHandler.insertInvoices" {
  export default function insertInvoices(param: {expenseJson: any}): Promise<any>;
}
declare module "@salesforce/apex/PayRollExpenseHandler.saveSearchKey" {
  export default function saveSearchKey(param: {searchKey: any}): Promise<any>;
}
declare module "@salesforce/apex/PayRollExpenseHandler.getSearchKeys" {
  export default function getSearchKeys(): Promise<any>;
}
declare module "@salesforce/apex/PayRollExpenseHandler.getExpenses" {
  export default function getExpenses(param: {typeofExpense: any}): Promise<any>;
}
