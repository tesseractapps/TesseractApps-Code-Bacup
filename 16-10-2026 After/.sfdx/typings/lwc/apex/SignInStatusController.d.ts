declare module "@salesforce/apex/SignInStatusController.getSignInCounts" {
  export default function getSignInCounts(param: {userId: any, facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/SignInStatusController.getSignInStaffDetails" {
  export default function getSignInStaffDetails(param: {status: any, facilityId: any, filterStartDate: any, filterEndDate: any, dateRange: any}): Promise<any>;
}
