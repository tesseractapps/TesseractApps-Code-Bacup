declare module "@salesforce/apex/RosterTemplateController.saveTemplate" {
  export default function saveTemplate(param: {templateName: any, templateType: any, startDate: any, endDate: any, facilityId: any, multiFacility: any, ShiftIds: any, ServiceIds: any, isSavedFromCopyPaste: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterTemplateController.getTemplates" {
  export default function getTemplates(param: {facilityIds: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterTemplateController.deleteRosterTemplate" {
  export default function deleteRosterTemplate(param: {templateId: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterTemplateController.createRosterTemplates" {
  export default function createRosterTemplates(param: {rosterTemplate: any, startDate: any, endDate: any, facilityIdList: any, copyChecklist: any, copyParticipant: any, copyShiftNotes: any, selectedShiftIds: any, selectedServiceIds: any, skippedShiftIds: any, destinationShiftIdsToDelete: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterTemplateController.getStaffWithApprovedLeaves" {
  export default function getStaffWithApprovedLeaves(param: {startDate: any, endDate: any, facilityIdList: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterTemplateController.getRosterCopyPreview" {
  export default function getRosterCopyPreview(param: {shiftIds: any}): Promise<any>;
}
