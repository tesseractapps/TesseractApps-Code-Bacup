declare module "@salesforce/apex/ClientSearchController.fetchFacilitiess" {
  export default function fetchFacilitiess(param: {cname: any, isTrue: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientSearchController.statusClient" {
  export default function statusClient(param: {IdValue: any, status: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientSearchController.fetchParticipantWithPagination" {
  export default function fetchParticipantWithPagination(param: {searchText: any, facilityIds: any, isTrue: any, pageSize: any, pageNumber: any, refreshKey: any, isActive: any, sortField: any, sortDirection: any}): Promise<any>;
}
