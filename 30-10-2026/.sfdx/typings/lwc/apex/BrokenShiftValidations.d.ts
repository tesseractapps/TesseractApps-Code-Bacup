declare module "@salesforce/apex/BrokenShiftValidations.validateBrokenShiftSegments" {
  export default function validateBrokenShiftSegments(param: {shiftStartDate: any, shiftStartTime: any, shiftEndDate: any, shiftEndTime: any, segmentsJson: any, employmentType: any, staffId: any, role: any}): Promise<any>;
}
declare module "@salesforce/apex/BrokenShiftValidations.getBrokenShiftsData" {
  export default function getBrokenShiftsData(param: {AddshiftId: any}): Promise<any>;
}
declare module "@salesforce/apex/BrokenShiftValidations.shouldRemoveMinimumEngagement" {
  export default function shouldRemoveMinimumEngagement(param: {addShiftId: any, currentShiftId: any, currentEditedDuration: any}): Promise<any>;
}
