declare module "@salesforce/apex/HRTraining.getTrainings" {
  export default function getTrainings(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/HRTraining.getTrainingById" {
  export default function getTrainingById(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/HRTraining.getStaffAssignmentsbyId" {
  export default function getStaffAssignmentsbyId(param: {staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/HRTraining.getAssignmentsById" {
  export default function getAssignmentsById(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/HRTraining.createTraining" {
  export default function createTraining(param: {name: any, startDate: any, endDate: any, description: any, courses: any, CurrentOrgId: any}): Promise<any>;
}
declare module "@salesforce/apex/HRTraining.upsertTrainings" {
  export default function upsertTrainings(param: {modulesJson: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/HRTraining.upsertFacilityCompliance" {
  export default function upsertFacilityCompliance(param: {requestJson: any}): Promise<any>;
}
declare module "@salesforce/apex/HRTraining.getFacilityComplianceByTraining" {
  export default function getFacilityComplianceByTraining(param: {trainingId: any}): Promise<any>;
}
declare module "@salesforce/apex/HRTraining.updateTrainingToggle" {
  export default function updateTrainingToggle(param: {trainingId: any, fieldName: any, fieldValue: any}): Promise<any>;
}
