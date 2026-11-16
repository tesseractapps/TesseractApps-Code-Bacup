declare module "@salesforce/apex/LayoutIncidentController.saveLayout" {
  export default function saveLayout(param: {layoutData: any, layoutName: any, title: any, actionType: any, orgId: any, formModule: any}): Promise<any>;
}
declare module "@salesforce/apex/LayoutIncidentController.doesLayoutTitleExist" {
  export default function doesLayoutTitleExist(param: {title: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/LayoutIncidentController.deleteLayout" {
  export default function deleteLayout(param: {layoutId: any}): Promise<any>;
}
declare module "@salesforce/apex/LayoutIncidentController.getLayoutData" {
  export default function getLayoutData(param: {layoutName: any}): Promise<any>;
}
declare module "@salesforce/apex/LayoutIncidentController.getLayoutDataById" {
  export default function getLayoutDataById(param: {templateId: any}): Promise<any>;
}
declare module "@salesforce/apex/LayoutIncidentController.getAllLayouts" {
  export default function getAllLayouts(param: {orgId: any, formModule: any}): Promise<any>;
}
declare module "@salesforce/apex/LayoutIncidentController.getDefaultFormLayout" {
  export default function getDefaultFormLayout(param: {layoutName: any}): Promise<any>;
}
declare module "@salesforce/apex/LayoutIncidentController.getUnifiedForms" {
  export default function getUnifiedForms(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/LayoutIncidentController.getDynamicFormData" {
  export default function getDynamicFormData(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/LayoutIncidentController.deleteDynamicForm" {
  export default function deleteDynamicForm(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/LayoutIncidentController.saveFormWithVersion" {
  export default function saveFormWithVersion(param: {recordId: any, formName: any, formJson: any, formType: any, orgId: any, formGroupId: any, isVersionEditFlow: any}): Promise<any>;
}
