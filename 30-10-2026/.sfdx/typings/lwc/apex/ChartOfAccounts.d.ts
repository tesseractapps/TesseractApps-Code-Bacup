declare module "@salesforce/apex/ChartOfAccounts.getKeyWords" {
  export default function getKeyWords(param: {orgName: any}): Promise<any>;
}
declare module "@salesforce/apex/ChartOfAccounts.createRawData" {
  export default function createRawData(param: {AccountsJsonString: any, orgName: any}): Promise<any>;
}
declare module "@salesforce/apex/ChartOfAccounts.getFinalAccountsdata" {
  export default function getFinalAccountsdata(param: {startDate: any, endDate: any, orgName: any}): Promise<any>;
}
