declare module "@salesforce/apex/FacilityController.fetchFacilitiesByOrgId" {
  export default function fetchFacilitiesByOrgId(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityController.fetchFacilitiesByOrgIdCommunity" {
  export default function fetchFacilitiesByOrgIdCommunity(param: {recordId: any, firstname: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityController.statusFacility" {
  export default function statusFacility(param: {IdValue: any, status: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityController.getfacilityById" {
  export default function getfacilityById(param: {facId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityController.savefacilityRoles" {
  export default function savefacilityRoles(param: {facilityId: any, options: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityController.getFacilityRoles" {
  export default function getFacilityRoles(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityController.getServicesData" {
  export default function getServicesData(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityController.fetchBulkRoles" {
  export default function fetchBulkRoles(param: {facilityIDList: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityController.createFacilityOnBulk" {
  export default function createFacilityOnBulk(param: {records: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityController.saveFacilityComplianceSettings" {
  export default function saveFacilityComplianceSettings(param: {settings: any, facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityController.loadFacilityComplianceSettings" {
  export default function loadFacilityComplianceSettings(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityController.getCompanyAndEntityStatus" {
  export default function getCompanyAndEntityStatus(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityController.updateFundTrackerWithEntity" {
  export default function updateFundTrackerWithEntity(param: {fundTrackerId: any, entityId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityController.getServiceLineItem" {
  export default function getServiceLineItem(param: {ServiceDate: any, recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityController.createEntityOnBulk" {
  export default function createEntityOnBulk(param: {records: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityController.getOrgEmailForBulk" {
  export default function getOrgEmailForBulk(param: {companyId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityController.updateMobielSetting" {
  export default function updateMobielSetting(param: {facilityId: any, enableSignInRequest: any, enableSignOutRequest: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityController.checkActiveStaffAndParticipants" {
  export default function checkActiveStaffAndParticipants(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityController.isFacilityActive" {
  export default function isFacilityActive(param: {facilityName: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityController.updateSilSetting" {
  export default function updateSilSetting(param: {facilityId: any, enableSIL: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityController.getSilStatus" {
  export default function getSilStatus(param: {facilityId: any}): Promise<any>;
}
