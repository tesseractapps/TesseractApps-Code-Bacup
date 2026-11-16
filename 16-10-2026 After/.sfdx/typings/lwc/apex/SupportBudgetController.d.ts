declare module "@salesforce/apex/SupportBudgetController.createSupportBudget" {
  export default function createSupportBudget(param: {participantId: any, serviceType: any, serviceItem: any, unitPrice: any, totalHours: any, totalAmount: any, actualAmount: any, startTime: any, endTime: any, recurrenceDates: any, invoiceNo: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportBudgetController.getSupportBudgets" {
  export default function getSupportBudgets(param: {participantId: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportBudgetController.deleteSupportBudget" {
  export default function deleteSupportBudget(param: {budgetId: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportBudgetController.updateSupportBudget" {
  export default function updateSupportBudget(param: {budgetId: any, serviceType: any, serviceItem: any, unitPrice: any, totalHours: any, totalAmount: any, actualAmount: any, startTime: any, endTime: any, recurrenceDates: any, amazonFileUrl: any, invoiceNo: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportBudgetController.validateBudgetDates" {
  export default function validateBudgetDates(param: {participantId: any, recurrenceDates: any, isEditMode: any, budgetId: any}): Promise<any>;
}
