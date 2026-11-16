declare module "@salesforce/apex/CreateCompanyController.getFacility" {
  export default function getFacility(param: {orgidtrack: any}): Promise<any>;
}
declare module "@salesforce/apex/CreateCompanyController.insertCompany" {
  export default function insertCompany(param: {companyId: any}): Promise<any>;
}
declare module "@salesforce/apex/CreateCompanyController.saveFinancialYearApex" {
  export default function saveFinancialYearApex(param: {selectedCompanyIds: any, year: any, endMonth: any}): Promise<any>;
}
declare module "@salesforce/apex/CreateCompanyController.saveActivityStatement" {
  export default function saveActivityStatement(param: {companyId: any, activityStatementData: any}): Promise<any>;
}
declare module "@salesforce/apex/CreateCompanyController.getCompany" {
  export default function getCompany(param: {selectedCompany: any, orgid: any}): Promise<any>;
}
declare module "@salesforce/apex/CreateCompanyController.checkCompanyName" {
  export default function checkCompanyName(param: {companyName: any}): Promise<any>;
}
declare module "@salesforce/apex/CreateCompanyController.getUserOrganisation" {
  export default function getUserOrganisation(): Promise<any>;
}
declare module "@salesforce/apex/CreateCompanyController.getProfiles" {
  export default function getProfiles(param: {radioCompanyId: any}): Promise<any>;
}
declare module "@salesforce/apex/CreateCompanyController.insertAccountList" {
  export default function insertAccountList(param: {companyId: any, industryId: any}): Promise<any>;
}
declare module "@salesforce/apex/CreateCompanyController.getLedgerItems" {
  export default function getLedgerItems(param: {companyId: any}): Promise<any>;
}
declare module "@salesforce/apex/CreateCompanyController.getAccountingData" {
  export default function getAccountingData(param: {selectedIndustry: any}): Promise<any>;
}
declare module "@salesforce/apex/CreateCompanyController.checkItemTransactions" {
  export default function checkItemTransactions(param: {itemId: any}): Promise<any>;
}
declare module "@salesforce/apex/CreateCompanyController.checkDuplicateEntityProfile" {
  export default function checkDuplicateEntityProfile(param: {name: any, firstName: any, lastName: any, recordId: any, companyId: any}): Promise<any>;
}
