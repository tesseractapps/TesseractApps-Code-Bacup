declare module "@salesforce/apex/RoasterManagementHandler.getStaffAlocationData" {
  export default function getStaffAlocationData(param: {staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/RoasterManagementHandler.getAlocationData" {
  export default function getAlocationData(param: {datePicker: any, facName: any}): Promise<any>;
}
declare module "@salesforce/apex/RoasterManagementHandler.getStaffAllocation" {
  export default function getStaffAllocation(param: {facId: any}): Promise<any>;
}
declare module "@salesforce/apex/RoasterManagementHandler.getRosterAllocationGroupedByWeek" {
  export default function getRosterAllocationGroupedByWeek(param: {staffId: any, StartDate: any, endDate: any}): Promise<any>;
}
declare module "@salesforce/apex/RoasterManagementHandler.getIctList" {
  export default function getIctList(param: {staffId: any, StartDate: any, endDate: any}): Promise<any>;
}
declare module "@salesforce/apex/RoasterManagementHandler.createAllocation" {
  export default function createAllocation(param: {sDate: any, staffId: any, whours: any, starttime: any, endtime: any, breakTime: any, status: any, startTimeString: any, endTimeString: any, isupdate: any, allocationId: any}): Promise<any>;
}
declare module "@salesforce/apex/RoasterManagementHandler.createTimeSheet" {
  export default function createTimeSheet(param: {WeekStartDate: any, WeekendDate: any, allocationIds: any, duration: any, staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/RoasterManagementHandler.clonePreviousDayAllocation" {
  export default function clonePreviousDayAllocation(param: {selectedDate: any, staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/RoasterManagementHandler.updateTimeSheets" {
  export default function updateTimeSheets(param: {WeekStartDate: any, WeekendDate: any, staffId: any}): Promise<any>;
}
