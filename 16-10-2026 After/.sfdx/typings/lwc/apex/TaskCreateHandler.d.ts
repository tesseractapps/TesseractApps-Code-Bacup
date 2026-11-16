declare module "@salesforce/apex/TaskCreateHandler.listOfUsers" {
  export default function listOfUsers(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/TaskCreateHandler.getOrgName" {
  export default function getOrgName(): Promise<any>;
}
declare module "@salesforce/apex/TaskCreateHandler.getOrgLogo" {
  export default function getOrgLogo(): Promise<any>;
}
declare module "@salesforce/apex/TaskCreateHandler.createTaskRecord" {
  export default function createTaskRecord(param: {userId: any, statusValue: any, subjectValue: any, priorityValue: any, dueDateValue: any, commentsValue: any}): Promise<any>;
}
declare module "@salesforce/apex/TaskCreateHandler.createTask" {
  export default function createTask(param: {taskRecord: any}): Promise<any>;
}
declare module "@salesforce/apex/TaskCreateHandler.getParticipantShifts" {
  export default function getParticipantShifts(param: {participantId: any, shiftDate: any}): Promise<any>;
}
declare module "@salesforce/apex/TaskCreateHandler.getTasksById" {
  export default function getTasksById(param: {taskId: any}): Promise<any>;
}
declare module "@salesforce/apex/TaskCreateHandler.getTaskAttachments" {
  export default function getTaskAttachments(param: {taskId: any}): Promise<any>;
}
declare module "@salesforce/apex/TaskCreateHandler.getTasksByParticipant" {
  export default function getTasksByParticipant(param: {participantId: any}): Promise<any>;
}
declare module "@salesforce/apex/TaskCreateHandler.getStaffById" {
  export default function getStaffById(param: {recordId: any}): Promise<any>;
}
