declare module "@salesforce/apex/ParticipantDetailsHandler.listOfClientjounel" {
  export default function listOfClientjounel(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/ParticipantDetailsHandler.listOfClientJournalByParticipantsAndShift" {
  export default function listOfClientJournalByParticipantsAndShift(param: {participantIds: any, shiftId: any}): Promise<any>;
}
declare module "@salesforce/apex/ParticipantDetailsHandler.saveDesc" {
  export default function saveDesc(param: {recordId: any, jounelId: any, description: any, jNoteType: any, correctionReason: any, shiftId: any}): Promise<any>;
}
declare module "@salesforce/apex/ParticipantDetailsHandler.communityPage" {
  export default function communityPage(): Promise<any>;
}
declare module "@salesforce/apex/ParticipantDetailsHandler.saveJournalAttachments" {
  export default function saveJournalAttachments(param: {journalId: any, uploadedFilesJson: any}): Promise<any>;
}
declare module "@salesforce/apex/ParticipantDetailsHandler.getCorrectionAttachments" {
  export default function getCorrectionAttachments(param: {correctionIds: any}): Promise<any>;
}
