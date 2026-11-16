declare module "@salesforce/apex/WyzedAuthService.getCoursesRaw" {
  export default function getCoursesRaw(): Promise<any>;
}
declare module "@salesforce/apex/WyzedAuthService.loadWyzedAndStaffData" {
  export default function loadWyzedAndStaffData(): Promise<any>;
}
declare module "@salesforce/apex/WyzedAuthService.createLearnerMinimal" {
  export default function createLearnerMinimal(param: {firstname: any, surname: any, email: any, isLearner: any, isAdmin: any}): Promise<any>;
}
declare module "@salesforce/apex/WyzedAuthService.updateWyzedId" {
  export default function updateWyzedId(param: {staffId: any, wyzedId: any, wyzedLearner: any}): Promise<any>;
}
