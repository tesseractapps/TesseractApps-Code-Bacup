declare module "@salesforce/apex/UserAccessController.getUserAccessDetails" {
  export default function getUserAccessDetails(param: {selectedroleValue: any, userId: any, facilityValue: any}): Promise<any>;
}
declare module "@salesforce/apex/UserAccessController.getUserAccessDetailsforresetPassword" {
  export default function getUserAccessDetailsforresetPassword(param: {userId: any}): Promise<any>;
}
declare module "@salesforce/apex/UserAccessController.updateUserModuleNames" {
  export default function updateUserModuleNames(param: {userIds: any, modules: any}): Promise<any>;
}
declare module "@salesforce/apex/UserAccessController.getUserModules" {
  export default function getUserModules(param: {userIds: any}): Promise<any>;
}
declare module "@salesforce/apex/UserAccessController.updateUserModuleNames1" {
  export default function updateUserModuleNames1(param: {staffId: any, modules: any}): Promise<any>;
}
declare module "@salesforce/apex/UserAccessController.getstaffId" {
  export default function getstaffId(param: {userId: any}): Promise<any>;
}
declare module "@salesforce/apex/UserAccessController.resetPortalPassword" {
  export default function resetPortalPassword(param: {ResetpasswordUserId: any}): Promise<any>;
}
declare module "@salesforce/apex/UserAccessController.getUserAccessDetailsforAccessManager1" {
  export default function getUserAccessDetailsforAccessManager1(param: {userId: any, facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/UserAccessController.getUserOrgName" {
  export default function getUserOrgName(): Promise<any>;
}
declare module "@salesforce/apex/UserAccessController.getStaffEmailAndModules" {
  export default function getStaffEmailAndModules(param: {userId: any}): Promise<any>;
}
declare module "@salesforce/apex/UserAccessController.getStaffDetails" {
  export default function getStaffDetails(param: {staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/UserAccessController.getstaffId1" {
  export default function getstaffId1(param: {userId: any}): Promise<any>;
}
declare module "@salesforce/apex/UserAccessController.getstaffId2" {
  export default function getstaffId2(param: {userId: any}): Promise<any>;
}
declare module "@salesforce/apex/UserAccessController.getstaffId3" {
  export default function getstaffId3(): Promise<any>;
}
declare module "@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo" {
  export default function getCurrentLoggedUserInfo(): Promise<any>;
}
declare module "@salesforce/apex/UserAccessController.updateStaffDetails" {
  export default function updateStaffDetails(param: {userDetails: any}): Promise<any>;
}
declare module "@salesforce/apex/UserAccessController.getStaffAccessDetails" {
  export default function getStaffAccessDetails(param: {userId: any, facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/UserAccessController.getSelectedStaffDetails" {
  export default function getSelectedStaffDetails(param: {staffId1: any}): Promise<any>;
}
declare module "@salesforce/apex/UserAccessController.saveStaffDetails" {
  export default function saveStaffDetails(param: {staffDetails: any}): Promise<any>;
}
declare module "@salesforce/apex/UserAccessController.saveStaffDetailsBulk" {
  export default function saveStaffDetailsBulk(param: {staffDetailsList: any}): Promise<any>;
}
declare module "@salesforce/apex/UserAccessController.checkUserExists" {
  export default function checkUserExists(param: {emailAddress: any}): Promise<any>;
}
declare module "@salesforce/apex/UserAccessController.isGuardianUserActive" {
  export default function isGuardianUserActive(param: {email: any}): Promise<any>;
}
