declare module "@salesforce/apex/ServiceSupportPlanHandler.getResourceName" {
  export default function getResourceName(param: {ResouceName: any}): Promise<any>;
}
declare module "@salesforce/apex/ServiceSupportPlanHandler.fetchSupId" {
  export default function fetchSupId(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/ServiceSupportPlanHandler.fetchFiles" {
  export default function fetchFiles(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/ServiceSupportPlanHandler.serviceSupportList" {
  export default function serviceSupportList(param: {clientId: any, sDate: any, eDate: any}): Promise<any>;
}
declare module "@salesforce/apex/ServiceSupportPlanHandler.getServicesAndSupportPlans" {
  export default function getServicesAndSupportPlans(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/ServiceSupportPlanHandler.getServicesAndSupportPlansByDate" {
  export default function getServicesAndSupportPlansByDate(param: {clientId: any, datePicker: any}): Promise<any>;
}
declare module "@salesforce/apex/ServiceSupportPlanHandler.createSupportRecord" {
  export default function createSupportRecord(param: {serviceNameValue: any, serviceStatusValue: any, state: any, startTime: any, endTime: any, serviceStartDateValue: any, recordId: any, fundID: any, staffID: any, selectedNdisIdValue: any, duartion: any, shiftWithStaffId: any, ShiftList: any}): Promise<any>;
}
declare module "@salesforce/apex/ServiceSupportPlanHandler.getSupportData" {
  export default function getSupportData(param: {SPIdList: any}): Promise<any>;
}
declare module "@salesforce/apex/ServiceSupportPlanHandler.getClientFunds" {
  export default function getClientFunds(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/ServiceSupportPlanHandler.getNDISServiceItemNames" {
  export default function getNDISServiceItemNames(param: {sNDISServiceItemNames: any}): Promise<any>;
}
declare module "@salesforce/apex/ServiceSupportPlanHandler.getInvoices" {
  export default function getInvoices(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/ServiceSupportPlanHandler.updateServiceStatus" {
  export default function updateServiceStatus(param: {selectedIds: any}): Promise<any>;
}
declare module "@salesforce/apex/ServiceSupportPlanHandler.getNDISServiceLineItem" {
  export default function getNDISServiceLineItem(param: {ServiceItemNames: any, ServiceDate: any}): Promise<any>;
}
declare module "@salesforce/apex/ServiceSupportPlanHandler.getNDISServiceLineItem1" {
  export default function getNDISServiceLineItem1(param: {ServiceItemNames: any, ServiceDate: any, clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/ServiceSupportPlanHandler.getInvoiceListInPayroll" {
  export default function getInvoiceListInPayroll(param: {orgId: any, sDate: any, eDate: any}): Promise<any>;
}
declare module "@salesforce/apex/ServiceSupportPlanHandler.getServicesByShift" {
  export default function getServicesByShift(param: {shiftStaffId: any}): Promise<any>;
}
declare module "@salesforce/apex/ServiceSupportPlanHandler.getServicesByDate" {
  export default function getServicesByDate(param: {participantId: any, startDate: any}): Promise<any>;
}
declare module "@salesforce/apex/ServiceSupportPlanHandler.getServicesAndSupportPlansforDashboard" {
  export default function getServicesAndSupportPlansforDashboard(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/ServiceSupportPlanHandler.insertClientFundTrackerLinks" {
  export default function insertClientFundTrackerLinks(param: {fundTrackerId: any, participantId: any, selectedCatalogIds: any, state: any, catalogToJunctionMap: any, serviceMetaMap: any, accountingService: any}): Promise<any>;
}
declare module "@salesforce/apex/ServiceSupportPlanHandler.getServicesByShiftImperative" {
  export default function getServicesByShiftImperative(param: {shiftStaffId: any}): Promise<any>;
}
declare module "@salesforce/apex/ServiceSupportPlanHandler.getParticipantNamesByShiftIds" {
  export default function getParticipantNamesByShiftIds(param: {shiftWithStaffIds: any}): Promise<any>;
}
