declare module "@salesforce/apex/RFQHandler.insertRFQ" {
  export default function insertRFQ(param: {JsonString: any, OrgId: any, dateIssue: any, includeGst: any, rfqTo: any, dueDate: any, fileref: any, rfqName: any, status: any}): Promise<any>;
}
declare module "@salesforce/apex/RFQHandler.getAllRFQData" {
  export default function getAllRFQData(param: {sDate: any, eDate: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/RFQHandler.getAllRFQchildData" {
  export default function getAllRFQchildData(param: {parentId: any}): Promise<any>;
}
declare module "@salesforce/apex/RFQHandler.getRFQHistory" {
  export default function getRFQHistory(param: {parentID: any}): Promise<any>;
}
declare module "@salesforce/apex/RFQHandler.updateRFQ" {
  export default function updateRFQ(param: {parentID: any}): Promise<any>;
}
declare module "@salesforce/apex/RFQHandler.sendEmail" {
  export default function sendEmail(param: {base64: any, staffEmail: any, orgName: any, fileName: any}): Promise<any>;
}
