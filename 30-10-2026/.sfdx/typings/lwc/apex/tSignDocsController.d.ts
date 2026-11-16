declare module "@salesforce/apex/tSignDocsController.getDocumentRecords" {
  export default function getDocumentRecords(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/tSignDocsController.fetchPDF" {
  export default function fetchPDF(param: {pdfUrl: any}): Promise<any>;
}
declare module "@salesforce/apex/tSignDocsController.updateComments" {
  export default function updateComments(param: {recordId: any, newComment: any}): Promise<any>;
}
declare module "@salesforce/apex/tSignDocsController.getComments" {
  export default function getComments(param: {recordId: any, cacheBuster: any}): Promise<any>;
}
declare module "@salesforce/apex/tSignDocsController.getTemplates" {
  export default function getTemplates(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/tSignDocsController.getAllTemplates" {
  export default function getAllTemplates(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/tSignDocsController.getTemplatesCT" {
  export default function getTemplatesCT(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/tSignDocsController.createTemplate" {
  export default function createTemplate(param: {name: any, type: any, orgId: any, url: any, awsjson: any}): Promise<any>;
}
declare module "@salesforce/apex/tSignDocsController.updateTemplate" {
  export default function updateTemplate(param: {templateId: any, name: any, type: any, awsUrl: any, Awsjson: any}): Promise<any>;
}
declare module "@salesforce/apex/tSignDocsController.awsupdateTemplate" {
  export default function awsupdateTemplate(param: {templateId: any, url: any, awsjson: any}): Promise<any>;
}
declare module "@salesforce/apex/tSignDocsController.getQuoteDocumentRecords" {
  export default function getQuoteDocumentRecords(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/tSignDocsController.getDashboardCounts" {
  export default function getDashboardCounts(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/tSignDocsController.getDashboardRecords" {
  export default function getDashboardRecords(param: {orgId: any, cardType: any}): Promise<any>;
}
declare module "@salesforce/apex/tSignDocsController.getRecentActivities" {
  export default function getRecentActivities(param: {orgId: any}): Promise<any>;
}
