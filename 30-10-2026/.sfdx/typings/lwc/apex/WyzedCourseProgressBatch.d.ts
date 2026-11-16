declare module "@salesforce/apex/WyzedCourseProgressBatch.getUserCoursesWithProgress" {
  export default function getUserCoursesWithProgress(param: {userId: any}): Promise<any>;
}
declare module "@salesforce/apex/WyzedCourseProgressBatch.getUserCoursesWithProgressJSON" {
  export default function getUserCoursesWithProgressJSON(): Promise<any>;
}
declare module "@salesforce/apex/WyzedCourseProgressBatch.assignSingleCourseToMultipleUsers" {
  export default function assignSingleCourseToMultipleUsers(param: {courseId: any, courseOwnerUserId: any, learnerUserIds: any}): Promise<any>;
}
declare module "@salesforce/apex/WyzedCourseProgressBatch.getStaffByFacilityAndRoles" {
  export default function getStaffByFacilityAndRoles(param: {selectedRoleFacilityValues: any}): Promise<any>;
}
