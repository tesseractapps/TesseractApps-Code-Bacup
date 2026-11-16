declare module "@salesforce/apex/FacilityDocumentController.getDocuments" {
  export default function getDocuments(param: {facilityId: any, refreshKey: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityDocumentController.saveDocument" {
  export default function saveDocument(param: {recordData: any, facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityDocumentController.getOrganisationDocuments" {
  export default function getOrganisationDocuments(param: {organisationId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityDocumentController.saveDocumentForOrganisation" {
  export default function saveDocumentForOrganisation(param: {recordData: any, organisationId: any, orgFlag: any, facilityIds: any, selectedRoles: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityDocumentController.UpdateDocumentForOrganisation" {
  export default function UpdateDocumentForOrganisation(param: {recordId: any, fieldName: any, value: any, organisationId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityDocumentController.getFacilityRecords" {
  export default function getFacilityRecords(param: {recordIds: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityDocumentController.deleteDocument" {
  export default function deleteDocument(param: {recId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityDocumentController.deleteOrganisationDocument" {
  export default function deleteOrganisationDocument(param: {documentId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityDocumentController.getFacilityRoles" {
  export default function getFacilityRoles(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityDocumentController.saveTraining" {
  export default function saveTraining(param: {recordData: any, facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityDocumentController.saveIdentity" {
  export default function saveIdentity(param: {recordData: any, facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityDocumentController.saveFacilityComplianceSettings" {
  export default function saveFacilityComplianceSettings(param: {settings: any, facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityDocumentController.loadFacilityComplianceSettings" {
  export default function loadFacilityComplianceSettings(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityDocumentController.syncFacilityDocuments" {
  export default function syncFacilityDocuments(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityDocumentController.getFacilityIdentityDocuments" {
  export default function getFacilityIdentityDocuments(param: {facilityId: any, staffId: any, currentDocumentId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityDocumentController.getOrganisationRoles" {
  export default function getOrganisationRoles(param: {organisationId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityDocumentController.getPremiumStatusFromFacility" {
  export default function getPremiumStatusFromFacility(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityDocumentController.getMandatoryStaffDocuments" {
  export default function getMandatoryStaffDocuments(param: {organisationId: any, facilityIds: any, staffRoles: any}): Promise<any>;
}
declare module "@salesforce/apex/FacilityDocumentController.getMandatoryFacilityDocuments" {
  export default function getMandatoryFacilityDocuments(param: {facilityIds: any, staffRoles: any}): Promise<any>;
}
