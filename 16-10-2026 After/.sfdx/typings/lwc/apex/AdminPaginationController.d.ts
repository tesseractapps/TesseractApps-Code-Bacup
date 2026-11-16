declare module "@salesforce/apex/AdminPaginationController.fetchStaffPaginatedData" {
  export default function fetchStaffPaginatedData(param: {searchText: any, facilityId: any, pageSize: any, pageNumber: any, isActive: any, sortField: any, sortDirection: any}): Promise<any>;
}
declare module "@salesforce/apex/AdminPaginationController.fetchStaffForDropdown" {
  export default function fetchStaffForDropdown(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/AdminPaginationController.getStaffsByFacility" {
  export default function getStaffsByFacility(param: {facilityId: any}): Promise<any>;
}
