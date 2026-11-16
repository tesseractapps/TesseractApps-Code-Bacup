declare module "@salesforce/apex/StaffAvailabilityValidation.validateStaffAvailabilityWithReasons" {
  export default function validateStaffAvailabilityWithReasons(param: {staffIds: any, inputDates: any, startTimeStr: any, endTimeStr: any, isAvailability: any, isEditMode: any, currentShiftId: any, currentAvailabilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffAvailabilityValidation.checkShiftWithinAvailability" {
  export default function checkShiftWithinAvailability(param: {staffIds: any, inputDates: any, startTimeStr: any, endTimeStr: any, shiftType: any, facilityMode: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffAvailabilityValidation.getStaffAvailability" {
  export default function getStaffAvailability(param: {staffId: any, startDate: any, endDate: any}): Promise<any>;
}
