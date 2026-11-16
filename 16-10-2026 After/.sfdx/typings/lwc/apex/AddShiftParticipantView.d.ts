declare module "@salesforce/apex/AddShiftParticipantView.getParticipantData" {
  export default function getParticipantData(param: {startDate: any, endDate: any, facIdlist: any, orgID: any, weekDataJson: any, name: any, shiftTypeList: any, statusList: any, refreshKey: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftParticipantView.getOverlappingShiftsData" {
  export default function getOverlappingShiftsData(param: {strtTimeText: any, endTimeText: any, StaffID: any, startdate: any, shiftType: any, ShiftwithStaffId: any}): Promise<any>;
}
declare module "@salesforce/apex/AddShiftParticipantView.getShiftTypes" {
  export default function getShiftTypes(param: {facIdlist: any}): Promise<any>;
}
