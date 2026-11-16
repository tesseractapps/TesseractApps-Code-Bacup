declare module "@salesforce/apex/BillingAgreementController.upsertAgreement" {
  export default function upsertAgreement(param: {agreementId: any, name: any, description: any}): Promise<any>;
}
declare module "@salesforce/apex/BillingAgreementController.getAgreements" {
  export default function getAgreements(): Promise<any>;
}
declare module "@salesforce/apex/BillingAgreementController.deleteAgreement" {
  export default function deleteAgreement(param: {agreementId: any}): Promise<any>;
}
declare module "@salesforce/apex/BillingAgreementController.attachAgreementFiles" {
  export default function attachAgreementFiles(param: {agreementId: any, awsJson: any, attachmentId: any}): Promise<any>;
}
declare module "@salesforce/apex/BillingAgreementController.getAllInvoicesForOrganisation" {
  export default function getAllInvoicesForOrganisation(): Promise<any>;
}
