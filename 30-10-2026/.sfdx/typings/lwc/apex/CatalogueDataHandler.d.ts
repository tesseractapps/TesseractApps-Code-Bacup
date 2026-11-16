declare module "@salesforce/apex/CatalogueDataHandler.getCatalogueData" {
  export default function getCatalogueData(param: {serviceType: any, clientId: any, accountingService: any, dateOfService: any}): Promise<any>;
}
declare module "@salesforce/apex/CatalogueDataHandler.getCatalogueDataByClient" {
  export default function getCatalogueDataByClient(param: {clientId: any, accountingService: any, dateOfService: any}): Promise<any>;
}
