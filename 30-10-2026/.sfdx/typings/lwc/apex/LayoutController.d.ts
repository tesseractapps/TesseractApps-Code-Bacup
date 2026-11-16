declare module "@salesforce/apex/LayoutController.saveLayout" {
  export default function saveLayout(param: {layoutData: any, layoutName: any, title: any, actionType: any, orgId: any, formModule: any, audience: any}): Promise<any>;
}
declare module "@salesforce/apex/LayoutController.doesLayoutTitleExist" {
  export default function doesLayoutTitleExist(param: {title: any, orgId: any, audience: any}): Promise<any>;
}
declare module "@salesforce/apex/LayoutController.deleteLayout" {
  export default function deleteLayout(param: {layoutName: any}): Promise<any>;
}
declare module "@salesforce/apex/LayoutController.getLayoutData" {
  export default function getLayoutData(param: {layoutName: any}): Promise<any>;
}
declare module "@salesforce/apex/LayoutController.getAllLayouts" {
  export default function getAllLayouts(param: {orgId: any, formModule: any}): Promise<any>;
}
declare module "@salesforce/apex/LayoutController.getDefaultFormLayout" {
  export default function getDefaultFormLayout(param: {layoutName: any}): Promise<any>;
}
declare module "@salesforce/apex/LayoutController.getUnifiedForms" {
  export default function getUnifiedForms(param: {orgId: any, formModule: any, audience: any}): Promise<any>;
}
declare module "@salesforce/apex/LayoutController.fetchStaffRolesByFacility" {
  export default function fetchStaffRolesByFacility(param: {facilityIds: any}): Promise<any>;
}
declare module "@salesforce/apex/LayoutController.getStaffForAssign" {
  export default function getStaffForAssign(param: {facilityIds: any, roleNames: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/LayoutController.grantAccessToParticipantsBulk" {
  export default function grantAccessToParticipantsBulk(param: {allParticipantIds: any, selectedParticipantIds: any, formIds: any, appendOnly: any}): Promise<any>;
}
declare module "@salesforce/apex/LayoutController.grantAccessToStaffBulk" {
  export default function grantAccessToStaffBulk(param: {allStaffIds: any, selectedStaffIds: any, formIds: any, appendOnly: any}): Promise<any>;
}
declare module "@salesforce/apex/LayoutController.getDynamicFormData" {
  export default function getDynamicFormData(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/LayoutController.deleteDynamicForm" {
  export default function deleteDynamicForm(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/LayoutController.saveFormWithVersion" {
  export default function saveFormWithVersion(param: {recordId: any, formName: any, formJson: any, formType: any, orgId: any, audience: any, formGroupId: any, isVersionEditFlow: any}): Promise<any>;
}
