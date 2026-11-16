declare module "@salesforce/apex/XeroIntegrationController.syncXeroEarningsRates" {
  export default function syncXeroEarningsRates(): Promise<any>;
}
declare module "@salesforce/apex/XeroIntegrationController.getXeroEmployees" {
  export default function getXeroEmployees(): Promise<any>;
}
declare module "@salesforce/apex/XeroIntegrationController.getFullXeroEmployee" {
  export default function getFullXeroEmployee(param: {employeeId: any}): Promise<any>;
}
declare module "@salesforce/apex/XeroIntegrationController.fetchStaffList" {
  export default function fetchStaffList(): Promise<any>;
}
declare module "@salesforce/apex/XeroIntegrationController.fetchEntityList" {
  export default function fetchEntityList(): Promise<any>;
}
declare module "@salesforce/apex/XeroIntegrationController.createOrUpdateXeroEmployee" {
  export default function createOrUpdateXeroEmployee(param: {staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/XeroIntegrationController.getXeroContacts" {
  export default function getXeroContacts(): Promise<any>;
}
declare module "@salesforce/apex/XeroIntegrationController.createOrUpdateXeroContacts" {
  export default function createOrUpdateXeroContacts(param: {entityId: any}): Promise<any>;
}
declare module "@salesforce/apex/XeroIntegrationController.saveEntity" {
  export default function saveEntity(param: {entityData: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/XeroIntegrationController.fetchXeroEntityList" {
  export default function fetchXeroEntityList(param: {orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/XeroIntegrationController.updateXeroEmployeeIds" {
  export default function updateXeroEmployeeIds(param: {staffMappings: any}): Promise<any>;
}
declare module "@salesforce/apex/XeroIntegrationController.createOrUpdateXeroInvoice" {
  export default function createOrUpdateXeroInvoice(param: {invoiceId: any, accountId: any}): Promise<any>;
}
declare module "@salesforce/apex/XeroIntegrationController.updateXeroEntityIds" {
  export default function updateXeroEntityIds(param: {entityMappings: any}): Promise<any>;
}
declare module "@salesforce/apex/XeroIntegrationController.processInoviceStatus" {
  export default function processInoviceStatus(): Promise<any>;
}
declare module "@salesforce/apex/XeroIntegrationController.syncXero" {
  export default function syncXero(param: {clientId: any, clientSecret: any}): Promise<any>;
}
declare module "@salesforce/apex/XeroIntegrationController.getXeroAccounts" {
  export default function getXeroAccounts(): Promise<any>;
}
declare module "@salesforce/apex/XeroIntegrationController.updateStaffInSystemFromXero" {
  export default function updateStaffInSystemFromXero(param: {xeroEmployeeIds: any}): Promise<any>;
}
declare module "@salesforce/apex/XeroIntegrationController.updateEntitiesInSystemFromXero" {
  export default function updateEntitiesInSystemFromXero(param: {xeroContactIds: any}): Promise<any>;
}
declare module "@salesforce/apex/XeroIntegrationController.updateStaffInXeroFromSystem" {
  export default function updateStaffInXeroFromSystem(param: {xeroEmployeeIds: any}): Promise<any>;
}
declare module "@salesforce/apex/XeroIntegrationController.updateEntitiesInXeroFromSystem" {
  export default function updateEntitiesInXeroFromSystem(param: {xeroContactIds: any}): Promise<any>;
}
declare module "@salesforce/apex/XeroIntegrationController.checkDuplicateEntity" {
  export default function checkDuplicateEntity(param: {firstName: any, lastName: any, orgId: any}): Promise<any>;
}
declare module "@salesforce/apex/XeroIntegrationController.bulkCreateStaffInXero" {
  export default function bulkCreateStaffInXero(param: {staffIds: any}): Promise<any>;
}
declare module "@salesforce/apex/XeroIntegrationController.bulkCreateEntitiesInXero" {
  export default function bulkCreateEntitiesInXero(param: {entityIds: any}): Promise<any>;
}
