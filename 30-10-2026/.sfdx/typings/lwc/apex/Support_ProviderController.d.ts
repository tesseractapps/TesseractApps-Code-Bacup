declare module "@salesforce/apex/Support_ProviderController.saveProvider" {
  export default function saveProvider(param: {providerData: any}): Promise<any>;
}
declare module "@salesforce/apex/Support_ProviderController.getProviders" {
  export default function getProviders(param: {selectedServiceType: any}): Promise<any>;
}
declare module "@salesforce/apex/Support_ProviderController.getProvidersPaged" {
  export default function getProvidersPaged(param: {pageSize: any, pageNumber: any, searchKey: any}): Promise<any>;
}
declare module "@salesforce/apex/Support_ProviderController.getDashboardMetrics" {
  export default function getDashboardMetrics(): Promise<any>;
}
