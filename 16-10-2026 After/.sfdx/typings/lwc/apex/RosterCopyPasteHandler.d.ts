declare module "@salesforce/apex/RosterCopyPasteHandler.pasteSelectedRosters" {
  export default function pasteSelectedRosters(param: {shiftIds: any, serviceIds: any, targetStartDate: any, copyChecklist: any, copyParticipant: any, copyShiftNotes: any, skippedShiftIds: any, destinationShiftIdsToDelete: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterCopyPasteHandler.getShiftIdsByTemplate" {
  export default function getShiftIdsByTemplate(param: {templateId: any, facilityIds: any, startDate: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterCopyPasteHandler.getServiceIdsByTemplate" {
  export default function getServiceIdsByTemplate(param: {templateId: any, shiftIds: any, startDate: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterCopyPasteHandler.unAssignParticipantShifts" {
  export default function unAssignParticipantShifts(param: {shiftIds: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterCopyPasteHandler.reAssignStaffToShifts" {
  export default function reAssignStaffToShifts(param: {shiftIds: any, staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterCopyPasteHandler.swapShiftStaff" {
  export default function swapShiftStaff(param: {draggedShiftId: any, droppedShiftId: any}): Promise<any>;
}
