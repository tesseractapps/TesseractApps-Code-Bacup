declare module "@salesforce/apex/CatalogueController.saveCatalogue" {
  export default function saveCatalogue(param: {formDataJson: any}): Promise<any>;
}
declare module "@salesforce/apex/CatalogueController.processBulkSelectedRecords" {
  export default function processBulkSelectedRecords(param: {facilityId: any, selectedRecordsJson: any}): Promise<any>;
}
declare module "@salesforce/apex/CatalogueController.getfacilityselectedCatalogue" {
  export default function getfacilityselectedCatalogue(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/CatalogueController.getServiceCataloguesByClient" {
  export default function getServiceCataloguesByClient(param: {clientId: any, approvedDate: any}): Promise<any>;
}
declare module "@salesforce/apex/CatalogueController.removeServiceGroup" {
  export default function removeServiceGroup(param: {clientId: any, serviceGroupId: any}): Promise<any>;
}
declare module "@salesforce/apex/CatalogueController.handleUncheckOrgWise" {
  export default function handleUncheckOrgWise(param: {ndisCatalogueId: any}): Promise<any>;
}
declare module "@salesforce/apex/CatalogueController.processBulkUncheckOrgWise" {
  export default function processBulkUncheckOrgWise(param: {ndisCatalogueIds: any}): Promise<any>;
}
declare module "@salesforce/apex/CatalogueController.getServiceLineItem" {
  export default function getServiceLineItem(param: {ServiceDate: any}): Promise<any>;
}
declare module "@salesforce/apex/CatalogueController.getNewServiceTypeLineItem" {
  export default function getNewServiceTypeLineItem(param: {financialYear: any, industry: any}): Promise<any>;
}
declare module "@salesforce/apex/CatalogueController.saveServiceCatalogues" {
  export default function saveServiceCatalogues(param: {serviceJson: any}): Promise<any>;
}
declare module "@salesforce/apex/CatalogueController.getServiceCatalogues" {
  export default function getServiceCatalogues(): Promise<any>;
}
declare module "@salesforce/apex/CatalogueController.saveServiceCatalogueFacilities" {
  export default function saveServiceCatalogueFacilities(param: {facilityJson: any}): Promise<any>;
}
declare module "@salesforce/apex/CatalogueController.handleFacilityUncheck" {
  export default function handleFacilityUncheck(param: {facilityId: any, serviceCatalogueIds: any}): Promise<any>;
}
declare module "@salesforce/apex/CatalogueController.processBulkFacilityUncheck" {
  export default function processBulkFacilityUncheck(param: {facilityIds: any, serviceCatalogueIds: any}): Promise<any>;
}
