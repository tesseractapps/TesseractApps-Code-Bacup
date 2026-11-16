declare module "@salesforce/apex/AddShiftController.allocationList" {
  export default function allocationList(param: {roles: any, startDate: any, endDate: any, facilities: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftController.getShiftList" {
  export default function getShiftList(param: {role: any, startDate: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftController.getShiftStaff" {
  export default function getShiftStaff(param: {ShiftIds: any, staff: any, statusList: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftController.getAvailableStaff" {
  export default function getAvailableStaff(param: {Role: any, startDate: any, startime: any, endtime: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftController.getAvailableStaffforRosterManager" {
  export default function getAvailableStaffforRosterManager(param: {Role: any, startDate: any, endDate: any, startime: any, endtime: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftController.getEOIStaff" {
  export default function getEOIStaff(param: {Role: any, shiftId: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftController.getcurrentStaff" {
  export default function getcurrentStaff(param: {startDate: any, endDate: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftController.Rejectedshifts" {
  export default function Rejectedshifts(param: {shiftStaffId: any, comments: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftController.getRejectedShifts" {
  export default function getRejectedShifts(param: {datePicker: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftController.getRejectedShiftsbyDates" {
  export default function getRejectedShiftsbyDates(param: {Sdate: any, edate: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftController.RejectedshiftAllocation" {
  export default function RejectedshiftAllocation(param: {shiftId: any, StaffId: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftController.updateStaffShift" {
  export default function updateStaffShift(param: {IdValue: any, status: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftController.allocateMultipleStaff" {
  export default function allocateMultipleStaff(param: {shiftId: any, staffJson: any, shiftDate: any, shiftwithstaff: any, isExecutedFromMobile: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftController.handleAllocation" {
  export default function handleAllocation(param: {shiftId: any, EOI: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftController.roleBasedShift" {
  export default function roleBasedShift(param: {startDate: any, endDate: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftController.getFacilityAddress" {
  export default function getFacilityAddress(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftController.getAllShiftWithSatff" {
  export default function getAllShiftWithSatff(param: {faciID: any, StartDate: any, EndDate: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftController.getSetHours" {
  export default function getSetHours(): Promise<any>;
}
declare module "@salesforce/apex/AddShiftController.updateShiftStaff" {
  export default function updateShiftStaff(param: {ShiftWithStaffId: any, StaffID: any, comments: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftController.getAddShiftDataById" {
  export default function getAddShiftDataById(param: {shiftId: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftController.getMultipleShiftsdata" {
  export default function getMultipleShiftsdata(param: {shiftDate: any, staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftController.getShiftDataByShiftId" {
  export default function getShiftDataByShiftId(param: {ShiftId: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftController.updateShiftCancellation" {
  export default function updateShiftCancellation(param: {shiftId: any, payloadJson: any}): Promise<any>;
}
