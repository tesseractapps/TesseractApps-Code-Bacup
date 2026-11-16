declare module "@salesforce/apex/SupportCoordinationReports.getParticipantUtilization" {
  export default function getParticipantUtilization(param: {participantIds: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportCoordinationReports.getParticipantReconciliation" {
  export default function getParticipantReconciliation(param: {participantIds: any, fromDate: any, toDate: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportCoordinationReports.getParticipantCaseNotes" {
  export default function getParticipantCaseNotes(param: {participantIds: any, fromDate: any, toDate: any}): Promise<any>;
}
declare module "@salesforce/apex/SupportCoordinationReports.getProviderReport" {
  export default function getProviderReport(): Promise<any>;
}
