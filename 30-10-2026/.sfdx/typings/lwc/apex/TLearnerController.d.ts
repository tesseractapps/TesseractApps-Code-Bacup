declare module "@salesforce/apex/TLearnerController.createTLearner" {
  export default function createTLearner(param: {title: any, description: any, organizationId: any, awsJson: any, platformValue: any, roleValue: any, expireDate: any}): Promise<any>;
}
declare module "@salesforce/apex/TLearnerController.fetchTLearners" {
  export default function fetchTLearners(param: {organizationId: any, platformValue: any, roleValue: any}): Promise<any>;
}
declare module "@salesforce/apex/TLearnerController.getOrganisations" {
  export default function getOrganisations(): Promise<any>;
}
