declare module "@salesforce/apex/StaffAvailabilityController.getstaffId" {
  export default function getstaffId(param: {userId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffAvailabilityController.saveStaffData" {
  export default function saveStaffData(param: {avaliableId: any, shiftDateStr: any, shiftType: any, isRecurring: any, weeklyDays: any, startTime: any, endTime: any, staffId: any, endDate: any, typeOfRecur: any, recurEvery: any, monthlyDay: any, shfitEndDate: any, shiftName: any, validationData: any, originalDates: any, availableValue: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffAvailabilityController.handleSelectedAvailability" {
  export default function handleSelectedAvailability(param: {availabilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffAvailabilityController.getServicesAndSupportPlansByDate" {
  export default function getServicesAndSupportPlansByDate(param: {userId: any, datePicker: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffAvailabilityController.getServiceType" {
  export default function getServiceType(param: {clientId: any, financialYear: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffAvailabilityController.getStaffOptions" {
  export default function getStaffOptions(param: {role: any, participantId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffAvailabilityController.getCatalogueData" {
  export default function getCatalogueData(param: {serviceType: any, clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffAvailabilityController.saveShiftData" {
  export default function saveShiftData(param: {shiftData: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffAvailabilityController.getParticipantAvailability" {
  export default function getParticipantAvailability(param: {clientId: any, datePicker: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffAvailabilityController.getStaffAvailability" {
  export default function getStaffAvailability(param: {datePicker: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffAvailabilityController.processSingleShift" {
  export default function processSingleShift(param: {avaliableId: any, shiftDate: any, startTime: any, endTime: any, staffId: any, shiftId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffAvailabilityController.saveRoleOrder" {
  export default function saveRoleOrder(param: {newOrder: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffAvailabilityController.getRoleOrder" {
  export default function getRoleOrder(): Promise<any>;
}
