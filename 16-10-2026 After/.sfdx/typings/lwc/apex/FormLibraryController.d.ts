declare module "@salesforce/apex/FormLibraryController.checkCanAssignPermission" {
  export default function checkCanAssignPermission(): Promise<any>;
}
declare module "@salesforce/apex/FormLibraryController.getLibraryForms" {
  export default function getLibraryForms(param: {orgId: any, audience: any, searchKey: any}): Promise<any>;
}
declare module "@salesforce/apex/FormLibraryController.getAvailableOrganisations" {
  export default function getAvailableOrganisations(): Promise<any>;
}
declare module "@salesforce/apex/FormLibraryController.getFormAssignments" {
  export default function getFormAssignments(param: {formId: any}): Promise<any>;
}
declare module "@salesforce/apex/FormLibraryController.saveFormAssignments" {
  export default function saveFormAssignments(param: {formId: any, organisationIds: any}): Promise<any>;
}
declare module "@salesforce/apex/FormLibraryController.cloneLibraryForms" {
  export default function cloneLibraryForms(param: {sourceFormIds: any, targetOrgId: any}): Promise<any>;
}
