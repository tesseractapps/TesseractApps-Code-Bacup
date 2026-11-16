declare module "@salesforce/apex/RosterAutoScheduleHandler.assignShifts" {
  export default function assignShifts(param: {startDate: any, endDate: any, AutoScheduleParameters: any, facList: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterAutoScheduleHandler.currnetLoggedInFcaility" {
  export default function currnetLoggedInFcaility(param: {UserEmail: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterAutoScheduleHandler.publishShifts" {
  export default function publishShifts(param: {startDate: any, endDate: any, facList: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterAutoScheduleHandler.publishShiftsFromCopyPaste" {
  export default function publishShiftsFromCopyPaste(param: {shiftIds: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterAutoScheduleHandler.UnpublishShiftsFromCopyPaste" {
  export default function UnpublishShiftsFromCopyPaste(param: {shiftIds: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterAutoScheduleHandler.getPublishData" {
  export default function getPublishData(param: {startDate: any, endDate: any, facList: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterAutoScheduleHandler.preventStaffAvailabilityDuplicates" {
  export default function preventStaffAvailabilityDuplicates(param: {startDate: any, endDate: any, startTime: any, endTime: any, staffId: any, AvailId: any}): Promise<any>;
}
