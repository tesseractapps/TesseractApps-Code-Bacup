declare module "@salesforce/apex/SmartReportsHandler.getRolesByFacilities" {
  export default function getRolesByFacilities(param: {facilityIds: any}): Promise<any>;
}
declare module "@salesforce/apex/SmartReportsHandler.getStaffByFacilityAndRoles" {
  export default function getStaffByFacilityAndRoles(param: {facilityId: any, roleNames: any, employmentType: any}): Promise<any>;
}
declare module "@salesforce/apex/SmartReportsHandler.getShiftWithSmartStaffData" {
  export default function getShiftWithSmartStaffData(param: {role: any, employmentType: any, startWeekDate: any, endWeekDate: any, location: any, facilityIds: any, staffIds: any}): Promise<any>;
}
declare module "@salesforce/apex/SmartReportsHandler.getTemplatesByFacility" {
  export default function getTemplatesByFacility(param: {facilityId: any, reportType: any}): Promise<any>;
}
declare module "@salesforce/apex/SmartReportsHandler.createTemplate" {
  export default function createTemplate(param: {templateName: any, facilityId: any, templateJson: any, templateId: any, reportType: any}): Promise<any>;
}
declare module "@salesforce/apex/SmartReportsHandler.getRejectedShiftsForSmartReports" {
  export default function getRejectedShiftsForSmartReports(param: {startDateStr: any, endDateStr: any, orgId: any, facilityIds: any, staffIds: any, role: any}): Promise<any>;
}
declare module "@salesforce/apex/SmartReportsHandler.getAllReimbursements" {
  export default function getAllReimbursements(param: {startDate: any, endDate: any, status: any, facilityIds: any}): Promise<any>;
}
declare module "@salesforce/apex/SmartReportsHandler.fetchStaffs" {
  export default function fetchStaffs(param: {facilityIds: any, status: any, employmentType: any, staffIds: any, roleNames: any}): Promise<any>;
}
declare module "@salesforce/apex/SmartReportsHandler.fetchFacilitiess" {
  export default function fetchFacilitiess(param: {facilityIds: any, status: any}): Promise<any>;
}
declare module "@salesforce/apex/SmartReportsHandler.getStaffUtilizationData" {
  export default function getStaffUtilizationData(param: {facility: any, role: any, employmentType: any, startWeekDate: any, endWeekDate: any}): Promise<any>;
}
declare module "@salesforce/apex/SmartReportsHandler.createFavorite" {
  export default function createFavorite(param: {facilityId: any, reportType: any, filterKey: any, filtersJson: any}): Promise<any>;
}
declare module "@salesforce/apex/SmartReportsHandler.deleteFavorite" {
  export default function deleteFavorite(param: {favoriteId: any}): Promise<any>;
}
declare module "@salesforce/apex/SmartReportsHandler.createShiftReportLog" {
  export default function createShiftReportLog(param: {startDate: any, endDate: any, facilityId: any, exportType: any, reportType: any, selectedDateRange: any, filtersJson: any, filterKey: any}): Promise<any>;
}
declare module "@salesforce/apex/SmartReportsHandler.updateShiftReportLog" {
  export default function updateShiftReportLog(param: {exportId: any, isCompleted: any}): Promise<any>;
}
declare module "@salesforce/apex/SmartReportsHandler.getFavoriteReports" {
  export default function getFavoriteReports(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/SmartReportsHandler.getReportExportLogs" {
  export default function getReportExportLogs(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/SmartReportsHandler.getAllReportExportLogs" {
  export default function getAllReportExportLogs(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/SmartReportsHandler.processStaffSelection" {
  export default function processStaffSelection(param: {staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/SmartReportsHandler.sendFacilityToApex" {
  export default function sendFacilityToApex(param: {facilityIds: any}): Promise<any>;
}
declare module "@salesforce/apex/SmartReportsHandler.sendFacilityToApexforParticipant" {
  export default function sendFacilityToApexforParticipant(param: {facilityIds: any}): Promise<any>;
}
declare module "@salesforce/apex/SmartReportsHandler.getParticipantServiceDeliveryReport" {
  export default function getParticipantServiceDeliveryReport(param: {facilityIds: any, participantIds: any, startDate: any, endDate: any}): Promise<any>;
}
declare module "@salesforce/apex/SmartReportsHandler.sendReportEmail" {
  export default function sendReportEmail(param: {base64Data: any, fileName: any, toAddress: any, ccAddress: any, subject: any, body: any, exportType: any}): Promise<any>;
}
declare module "@salesforce/apex/SmartReportsHandler.getGrossProfitMarginReport" {
  export default function getGrossProfitMarginReport(param: {facilityIds: any, participantIds: any, staffIds: any, shiftTypes: any, startDate: any, endDate: any}): Promise<any>;
}
