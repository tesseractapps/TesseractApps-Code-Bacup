declare module "@salesforce/apex/ShiftReportsController.getShiftWithStaffData" {
  export default function getShiftWithStaffData(param: {role: any, employmentType: any, startWeekDate: any, endWeekDate: any, location: any, facilityIds: any, signStatus: any, sortField: any, sortDirection: any}): Promise<any>;
}
declare module "@salesforce/apex/ShiftReportsController.getAddShiftById" {
  export default function getAddShiftById(param: {shiftId: any}): Promise<any>;
}
declare module "@salesforce/apex/ShiftReportsController.getShiftWithCases" {
  export default function getShiftWithCases(param: {shiftId: any}): Promise<any>;
}
declare module "@salesforce/apex/ShiftReportsController.getCasesByStaff" {
  export default function getCasesByStaff(param: {staffId: any, StartDate: any}): Promise<any>;
}
declare module "@salesforce/apex/ShiftReportsController.getjournalsByStaff" {
  export default function getjournalsByStaff(param: {staffId: any, StartDate: any, ClientId: any}): Promise<any>;
}
declare module "@salesforce/apex/ShiftReportsController.getformsByStaff" {
  export default function getformsByStaff(param: {staffId: any, StartDate: any, ClientId: any}): Promise<any>;
}
declare module "@salesforce/apex/ShiftReportsController.createTemplate" {
  export default function createTemplate(param: {templateName: any, facilityId: any, templateJson: any, templateId: any}): Promise<any>;
}
declare module "@salesforce/apex/ShiftReportsController.getTemplatesByFacility" {
  export default function getTemplatesByFacility(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/ShiftReportsController.deleteTemplate" {
  export default function deleteTemplate(param: {templateId: any}): Promise<any>;
}
declare module "@salesforce/apex/ShiftReportsController.getAllExportData" {
  export default function getAllExportData(param: {role: any, employmentType: any, startWeekDate: any, endWeekDate: any, location: any, facilityIds: any, shiftIds: any}): Promise<any>;
}
