declare module "@salesforce/apex/RiskMatrixController.getRiskMatrix" {
  export default function getRiskMatrix(): Promise<any>;
}
declare module "@salesforce/apex/RiskMatrixController.insertRiskRecords" {
  export default function insertRiskRecords(param: {riskRecordsJson: any}): Promise<any>;
}
declare module "@salesforce/apex/RiskMatrixController.getRiskRecords" {
  export default function getRiskRecords(param: {clientId: any}): Promise<any>;
}
