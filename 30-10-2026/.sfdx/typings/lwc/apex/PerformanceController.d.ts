declare module "@salesforce/apex/PerformanceController.getStaffList" {
  export default function getStaffList(param: {userType: any, orgid: any, selectedYear: any}): Promise<any>;
}
declare module "@salesforce/apex/PerformanceController.getStaffReviewerDetails" {
  export default function getStaffReviewerDetails(param: {staffOrReviewerId: any, isReviewer: any}): Promise<any>;
}
declare module "@salesforce/apex/PerformanceController.getLibraryGoals" {
  export default function getLibraryGoals(param: {levelId: any, staffRole: any, facilityId: any, orgid: any}): Promise<any>;
}
declare module "@salesforce/apex/PerformanceController.fetchLibraryGoalDetails" {
  export default function fetchLibraryGoalDetails(param: {libraryGoalId: any}): Promise<any>;
}
declare module "@salesforce/apex/PerformanceController.getUserData" {
  export default function getUserData(): Promise<any>;
}
declare module "@salesforce/apex/PerformanceController.getUserDetails" {
  export default function getUserDetails(): Promise<any>;
}
declare module "@salesforce/apex/PerformanceController.getReviewer" {
  export default function getReviewer(param: {orgid: any}): Promise<any>;
}
declare module "@salesforce/apex/PerformanceController.getPerformanceRecords" {
  export default function getPerformanceRecords(param: {orgid: any, userType: any}): Promise<any>;
}
declare module "@salesforce/apex/PerformanceController.insertPerformanceGoal" {
  export default function insertPerformanceGoal(param: {performanceGoalId: any, goalDataList: any}): Promise<any>;
}
declare module "@salesforce/apex/PerformanceController.getPerformanceById" {
  export default function getPerformanceById(param: {performanceId: any}): Promise<any>;
}
declare module "@salesforce/apex/PerformanceController.getGoalsByPerformanceId" {
  export default function getGoalsByPerformanceId(param: {performanceId: any}): Promise<any>;
}
declare module "@salesforce/apex/PerformanceController.updateGoalData" {
  export default function updateGoalData(param: {goalList: any}): Promise<any>;
}
declare module "@salesforce/apex/PerformanceController.updatePerformanceStatus" {
  export default function updatePerformanceStatus(param: {goalList: any}): Promise<any>;
}
declare module "@salesforce/apex/PerformanceController.checkPerformanceRecordExist" {
  export default function checkPerformanceRecordExist(param: {staffId: any, selectedYear: any}): Promise<any>;
}
declare module "@salesforce/apex/PerformanceController.updatePerformanceOutcome" {
  export default function updatePerformanceOutcome(param: {performanceId: any}): Promise<any>;
}
