declare module "@salesforce/apex/GovReportsAPICallout.GetAccessToken" {
  export default function GetAccessToken(): Promise<any>;
}
declare module "@salesforce/apex/GovReportsAPICallout.GetSignatureValue" {
  export default function GetSignatureValue(param: {datainp: any}): Promise<any>;
}
declare module "@salesforce/apex/GovReportsAPICallout.submitPayload" {
  export default function submitPayload(param: {data: any, isUpdate: any}): Promise<any>;
}
declare module "@salesforce/apex/GovReportsAPICallout.getPullRequest" {
  export default function getPullRequest(param: {payLoad: any, agentData: any}): Promise<any>;
}
