declare module "@salesforce/apex/AwsBatchController.uploadFiles" {
  export default function uploadFiles(param: {files: any}): Promise<any>;
}
declare module "@salesforce/apex/AwsBatchController.overwriteFiles" {
  export default function overwriteFiles(param: {files: any}): Promise<any>;
}
declare module "@salesforce/apex/AwsBatchController.deleteFiles" {
  export default function deleteFiles(param: {keys: any}): Promise<any>;
}
declare module "@salesforce/apex/AwsBatchController.getUploadConfig" {
  export default function getUploadConfig(param: {moduleName: any}): Promise<any>;
}
declare module "@salesforce/apex/AwsBatchController.deleteFilesFromAwsJson" {
  export default function deleteFilesFromAwsJson(param: {awsJsonText: any}): Promise<any>;
}
