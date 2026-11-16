declare module "@salesforce/apex/RecipientEmailSender.startEmailSequence" {
  export default function startEmailSequence(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/RecipientEmailSender.sendRecordEmail" {
  export default function sendRecordEmail(param: {recordId: any, email: any, baseUrl: any}): Promise<any>;
}
