declare module "@salesforce/apex/AwardController.getAwards" {
  export default function getAwards(param: {recordId: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/AwardController.getAwardsByOrg" {
  export default function getAwardsByOrg(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/AwardController.getAwardById" {
  export default function getAwardById(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/AwardController.getFacilityAwards" {
  export default function getFacilityAwards(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/AwardController.addAwardToFacility" {
  export default function addAwardToFacility(param: {facilityId: any, awardName: any}): Promise<any>;
}
declare module "@salesforce/apex/AwardController.deleteAwardFromFacility" {
  export default function deleteAwardFromFacility(param: {facilityId: any, awardName: any}): Promise<any>;
}
declare module "@salesforce/apex/AwardController.getStaffList" {
  export default function getStaffList(param: {orgId: any, facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/AwardController.getStaffListforRosterManager" {
  export default function getStaffListforRosterManager(param: {orgId: any, facilityId: any, shiftDate: any, endDate: any, startTime: any, endTime: any, Role: any}): Promise<any>;
}
