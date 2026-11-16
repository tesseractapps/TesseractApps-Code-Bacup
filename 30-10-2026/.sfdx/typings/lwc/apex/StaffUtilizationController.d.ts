declare module "@salesforce/apex/StaffUtilizationController.getStaffUtilizationData" {
  export default function getStaffUtilizationData(param: {facility: any, role: any, employmentType: any, pageNumber: any, pageSize: any, startWeekDate: any, endWeekDate: any, statusforApex: any, sortField: any, sortDirection: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffUtilizationController.exportStaffData" {
  export default function exportStaffData(param: {facility: any, role: any, employmentType: any, startWeekDate: any, endWeekDate: any, statusforApex: any}): Promise<any>;
}
