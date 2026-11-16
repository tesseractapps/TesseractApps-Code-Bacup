declare module "@salesforce/apex/RosterCreation.createShift" {
  export default function createShift(param: {addShift: any, rsh: any, addShiftupdateFlag: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterCreation.getFatigueData" {
  export default function getFatigueData(param: {staffId: any, strtTimeText: any, startdate: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterCreation.getFundsData" {
  export default function getFundsData(param: {fundsId: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterCreation.validateStaffAvailabilityWithReasons" {
  export default function validateStaffAvailabilityWithReasons(param: {staffIds: any, inputDates: any, startTimeStr: any, endTimeStr: any, isAvailability: any, isEditMode: any, currentShiftId: any, currentAvailabilityId: any, shiftFacilityId: any, shiftRole: any, shiftType: any, otherGroupShiftShiftIds: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterCreation.unAssignedList" {
  export default function unAssignedList(param: {shiftWithStaffId: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterCreation.updateShiftQuantity" {
  export default function updateShiftQuantity(param: {shiftId: any, quantity: any}): Promise<any>;
}
