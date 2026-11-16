declare module "@salesforce/apex/Support_GoalsController.getParticipantGoals" {
  export default function getParticipantGoals(): Promise<any>;
}
declare module "@salesforce/apex/Support_GoalsController.getActiveParticipants" {
  export default function getActiveParticipants(): Promise<any>;
}
declare module "@salesforce/apex/Support_GoalsController.getActiveProviders" {
  export default function getActiveProviders(): Promise<any>;
}
declare module "@salesforce/apex/Support_GoalsController.saveGoalWithSubGoals" {
  export default function saveGoalWithSubGoals(param: {payloadJson: any}): Promise<any>;
}
declare module "@salesforce/apex/Support_GoalsController.getParticipantGoalsPaged" {
  export default function getParticipantGoalsPaged(param: {pageSize: any, pageNumber: any}): Promise<any>;
}
declare module "@salesforce/apex/Support_GoalsController.getGoalReviews" {
  export default function getGoalReviews(param: {goalId: any}): Promise<any>;
}
declare module "@salesforce/apex/Support_GoalsController.saveGoalReview" {
  export default function saveGoalReview(param: {reviewRec: any}): Promise<any>;
}
declare module "@salesforce/apex/Support_GoalsController.getGlobalDashboardMetrics" {
  export default function getGlobalDashboardMetrics(): Promise<any>;
}
declare module "@salesforce/apex/Support_GoalsController.getNotesByGoal" {
  export default function getNotesByGoal(param: {goalId: any}): Promise<any>;
}
declare module "@salesforce/apex/Support_GoalsController.updateSubGoalStatus" {
  export default function updateSubGoalStatus(param: {subGoalId: any, status: any}): Promise<any>;
}
