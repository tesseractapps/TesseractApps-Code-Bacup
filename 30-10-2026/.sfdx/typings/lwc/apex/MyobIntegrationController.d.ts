declare module "@salesforce/apex/MyobIntegrationController.getMyobAuthLink" {
  export default function getMyobAuthLink(param: {redirectUrl: any}): Promise<any>;
}
declare module "@salesforce/apex/MyobIntegrationController.exchangeMyobCodeForToken" {
  export default function exchangeMyobCodeForToken(param: {code: any, redirectUrl: any}): Promise<any>;
}
declare module "@salesforce/apex/MyobIntegrationController.refreshMyobToken" {
  export default function refreshMyobToken(param: {refreshToken: any}): Promise<any>;
}
declare module "@salesforce/apex/MyobIntegrationController.getMyobCompanyFiles" {
  export default function getMyobCompanyFiles(param: {accessToken: any, refreshToken: any, businessId: any}): Promise<any>;
}
declare module "@salesforce/apex/MyobIntegrationController.getCompanyFileDetails" {
  export default function getCompanyFileDetails(param: {accessToken: any, companyFileGuid: any}): Promise<any>;
}
declare module "@salesforce/apex/MyobIntegrationController.getMyobEmployees" {
  export default function getMyobEmployees(param: {accessToken: any, refreshToken: any, companyFileGuid: any}): Promise<any>;
}
declare module "@salesforce/apex/MyobIntegrationController.getMyobCustomers" {
  export default function getMyobCustomers(param: {accessToken: any, refreshToken: any, companyFileGuid: any}): Promise<any>;
}
declare module "@salesforce/apex/MyobIntegrationController.getMyobSuppliers" {
  export default function getMyobSuppliers(param: {accessToken: any, refreshToken: any, companyFileGuid: any}): Promise<any>;
}
declare module "@salesforce/apex/MyobIntegrationController.createMyobEmployee" {
  export default function createMyobEmployee(param: {accessToken: any, refreshToken: any, companyFileUri: any, staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/MyobIntegrationController.createEntityInMYOB" {
  export default function createEntityInMYOB(param: {entityId: any, companyFileUri: any, refreshToken: any, accessToken: any}): Promise<any>;
}
declare module "@salesforce/apex/MyobIntegrationController.createMyobInvoice" {
  export default function createMyobInvoice(param: {invoiceId: any, accessToken: any, refreshToken: any, companyFileUri: any}): Promise<any>;
}
declare module "@salesforce/apex/MyobIntegrationController.getMyobInvoices" {
  export default function getMyobInvoices(param: {accessToken: any, refreshToken: any, companyFileUri: any}): Promise<any>;
}
declare module "@salesforce/apex/MyobIntegrationController.createMyobTimesheet" {
  export default function createMyobTimesheet(param: {staffId: any, startDateStr: any, endDateStr: any, accessToken: any, refreshToken: any, companyFileUri: any}): Promise<any>;
}
declare module "@salesforce/apex/MyobIntegrationController.getMyobInvoicesfromMYOB" {
  export default function getMyobInvoicesfromMYOB(param: {accessToken: any, refreshToken: any, companyFileUri: any}): Promise<any>;
}
