declare module "@salesforce/apex/StaffNotesController.upsertNote" {
  export default function upsertNote(param: {noteId: any, title: any, description: any, staffId: any, facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffNotesController.getNotes" {
  export default function getNotes(param: {staffId: any, facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffNotesController.attachNoteFiles" {
  export default function attachNoteFiles(param: {noteId: any, awsJson: any, attachmentId: any}): Promise<any>;
}
