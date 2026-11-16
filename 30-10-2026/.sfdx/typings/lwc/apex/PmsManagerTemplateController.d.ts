declare module "@salesforce/apex/PmsManagerTemplateController.getTemplatesByManager" {
  export default function getTemplatesByManager(param: {managerId: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsManagerTemplateController.SubmitManagerResponse" {
  export default function SubmitManagerResponse(param: {requestJson: any, isSubmit: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsManagerTemplateController.ReassignToStaff" {
  export default function ReassignToStaff(param: {staffTemplateId: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsManagerTemplateController.getGoalsByManager" {
  export default function getGoalsByManager(param: {facilityId: any, managerId: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsManagerTemplateController.getCoachingSessions" {
  export default function getCoachingSessions(param: {facilityId: any, managerId: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsManagerTemplateController.saveCoachingData" {
  export default function saveCoachingData(param: {facilityId: any, coachingData: any, actionList: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsManagerTemplateController.getCoachingSessionDetails" {
  export default function getCoachingSessionDetails(param: {coachingId: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsManagerTemplateController.changeRequestCoaching" {
  export default function changeRequestCoaching(param: {coachingId: any, isManager: any, isHr: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsManagerTemplateController.getManagersAndHrByFacility" {
  export default function getManagersAndHrByFacility(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/PmsManagerTemplateController.createOrUpdateManagerCoaching" {
  export default function createOrUpdateManagerCoaching(param: {facilityId: any, coachingData: any, actionList: any, staffDataList: any}): Promise<any>;
}
