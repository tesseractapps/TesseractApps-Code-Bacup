declare module "@salesforce/apex/OnBoardingController.createOnboardingRawAndEmail" {
  export default function createOnboardingRawAndEmail(param: {rows: any, baseUrl: any, facilityId: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/OnBoardingController.getOnboardingList" {
  export default function getOnboardingList(param: {maxRows: any, facilityId: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/OnBoardingController.getOnboardingListByOrg" {
  export default function getOnboardingListByOrg(param: {maxRows: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/OnBoardingController.sendOnboardingEmails" {
  export default function sendOnboardingEmails(param: {onboardingIds: any, baseUrl: any}): Promise<any>;
}
declare module "@salesforce/apex/OnBoardingController.sendOnboardingReminderEmails" {
  export default function sendOnboardingReminderEmails(param: {onboardingIds: any, baseUrl: any}): Promise<any>;
}
declare module "@salesforce/apex/OnBoardingController.isLinkActive" {
  export default function isLinkActive(param: {onboardingId: any}): Promise<any>;
}
declare module "@salesforce/apex/OnBoardingController.saveOnboardingReceivedDataR" {
  export default function saveOnboardingReceivedDataR(param: {onboardingId: any, payloadJson: any, deactivateLink: any}): Promise<any>;
}
declare module "@salesforce/apex/OnBoardingController.getReceivedData" {
  export default function getReceivedData(param: {onboardingId: any}): Promise<any>;
}
declare module "@salesforce/apex/OnBoardingController.approveOnboarding" {
  export default function approveOnboarding(param: {onboardingId: any, userAccountNeeded: any, payloadJson: any}): Promise<any>;
}
declare module "@salesforce/apex/OnBoardingController.createAccountsContactsAndStaff" {
  export default function createAccountsContactsAndStaff(param: {records: any}): Promise<any>;
}
declare module "@salesforce/apex/OnBoardingController.getOrgLogoUrlById" {
  export default function getOrgLogoUrlById(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/OnBoardingController.getFacilityManagerName" {
  export default function getFacilityManagerName(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/OnBoardingController.getOnboardingCounts" {
  export default function getOnboardingCounts(param: {facilityId: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/OnBoardingController.getEmailNotSent" {
  export default function getEmailNotSent(param: {orgId: any, facilityId: any, maxRows: any}): Promise<any>;
}
declare module "@salesforce/apex/OnBoardingController.getOnboardingRoleAndUserType" {
  export default function getOnboardingRoleAndUserType(param: {onboardingId: any}): Promise<any>;
}
declare module "@salesforce/apex/OnBoardingController.getExistingEmails" {
  export default function getExistingEmails(param: {emails: any}): Promise<any>;
}
declare module "@salesforce/apex/OnBoardingController.updateOnboardingJsonR" {
  export default function updateOnboardingJsonR(param: {onboardingId: any, payloadJson: any}): Promise<any>;
}
