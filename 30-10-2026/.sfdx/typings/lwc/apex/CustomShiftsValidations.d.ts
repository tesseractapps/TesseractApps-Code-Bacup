declare module "@salesforce/apex/CustomShiftsValidations.validateSegments" {
  export default function validateSegments(param: {shiftStartDate: any, shiftStartTime: any, shiftEndDate: any, shiftEndTime: any, segmentsJson: any, StaffId: any, role: any}): Promise<any>;
}
declare module "@salesforce/apex/CustomShiftsValidations.calculateHourlyRate" {
  export default function calculateHourlyRate(param: {staff: any, roleRec: any, shiftType: any, dayName: any, isHoliday: any}): Promise<any>;
}
