declare module "@salesforce/apex/TemplateLibraryController.getLibraryTemplates" {
  export default function getLibraryTemplates(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateLibraryController.cloneLibraryTemplates" {
  export default function cloneLibraryTemplates(param: {sourceTemplateIds: any, targetOrgId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateLibraryController.getAssignableOrganisations" {
  export default function getAssignableOrganisations(param: {templateId: any}): Promise<any>;
}
declare module "@salesforce/apex/TemplateLibraryController.saveTemplateAssignments" {
  export default function saveTemplateAssignments(param: {templateId: any, assignedOrgIds: any}): Promise<any>;
}
