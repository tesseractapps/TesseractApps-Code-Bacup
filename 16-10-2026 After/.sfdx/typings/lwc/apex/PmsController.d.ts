declare module "@salesforce/apex/PmsController.saveTemplate1" {
  export default function saveTemplate1(param: {templateData: any, kpiList: any, okrList: any, competencyList: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsController.saveTemplate" {
  export default function saveTemplate(param: {templateData: any, kpiList: any, okrList: any, competencyList: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsController.getRoleTemplatesByFacility" {
  export default function getRoleTemplatesByFacility(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsController.getTemplatesByFacility" {
  export default function getTemplatesByFacility(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsController.getTemplatesById" {
  export default function getTemplatesById(param: {templateId: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsController.getStaffsByOrg" {
  export default function getStaffsByOrg(param: {orgId: any, facilityId: any, roleNames: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsController.createRoleTemplateFromBase" {
  export default function createRoleTemplateFromBase(param: {baseTemplateId: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsController.applyTemplateToStaff" {
  export default function applyTemplateToStaff(param: {templateId: any, staffIds: any, effectiveDate: any, roles: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsController.getStaffsByTemplateId" {
  export default function getStaffsByTemplateId(param: {templateId: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsController.saveFullReviewCycle" {
  export default function saveFullReviewCycle(param: {data: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsController.getReviewCycles" {
  export default function getReviewCycles(param: {facilityId: any, financialYear: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsController.getReviewCycleInEdit" {
  export default function getReviewCycleInEdit(param: {reviewCycleId: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsController.getAllStaffTemplates" {
  export default function getAllStaffTemplates(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsController.getStaffTemplateDetailsById" {
  export default function getStaffTemplateDetailsById(param: {templateId: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsController.saveHrResponseData" {
  export default function saveHrResponseData(param: {hrData: any, templateId: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsController.ReassignToManager" {
  export default function ReassignToManager(param: {staffTemplateId: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsController.getAllGoalsByFacility" {
  export default function getAllGoalsByFacility(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsController.getHrCoachingSessions" {
  export default function getHrCoachingSessions(param: {facilityId: any}): Promise<any>;
}
