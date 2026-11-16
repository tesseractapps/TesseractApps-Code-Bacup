declare module "@salesforce/apex/RosterInvoicesHandler.getCompanyAndAccountData" {
  export default function getCompanyAndAccountData(param: {participantIdList: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.getCompanyAndAccountData1" {
  export default function getCompanyAndAccountData1(param: {participantIdList: any, dashboardFacilityId: any, entityIds: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.serviceSupportList" {
  export default function serviceSupportList(param: {clientIds: any, startDateStr: any, endDateStr: any, orgid: any, name: any, status: any, accountingService: any, cacheBuster: any, planType: any, refreshKey: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.getAddShiftData" {
  export default function getAddShiftData(param: {AddShift: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.updateQty" {
  export default function updateQty(param: {recordId: any, newQty: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.getShiftsTypeByFacility" {
  export default function getShiftsTypeByFacility(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.fetchEntity" {
  export default function fetchEntity(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.fetchCompanyByFacility" {
  export default function fetchCompanyByFacility(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.fetchEntityfromFundtracker" {
  export default function fetchEntityfromFundtracker(param: {fundTrackerId: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.cancelInvoiceById" {
  export default function cancelInvoiceById(param: {invoiceId: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.getReimbursementsByShiftStaffIds" {
  export default function getReimbursementsByShiftStaffIds(param: {shiftStaffIds: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.getEmailBodyServiceInvoice" {
  export default function getEmailBodyServiceInvoice(param: {invoiceid: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.sendEmailforServiceInvoice" {
  export default function sendEmailforServiceInvoice(param: {invoiceid: any, toAddress: any, ccAddress: any, url: any, subject: any, body: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.createUpdateXeroInvoice" {
  export default function createUpdateXeroInvoice(param: {salesEntryJson: any, salesEntryListJson: any, amountEntryJson: any, isParticipantInvoice: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.getAccountingInvoiceByIdXero" {
  export default function getAccountingInvoiceByIdXero(param: {invoiceId: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.getentityEmailForXeroInvoices" {
  export default function getentityEmailForXeroInvoices(param: {invoiceId: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.getBulkServicesHandler" {
  export default function getBulkServicesHandler(param: {PartcipantIdList: any, sDate: any, eDate: any, orgid: any, name: any, planType: any, refreshKey: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.getParticipantFacilityMap" {
  export default function getParticipantFacilityMap(param: {participantIds: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.sendBulkServiceInvoiceEmails" {
  export default function sendBulkServiceInvoiceEmails(param: {invoiceIds: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.saveServiceSupportPlans" {
  export default function saveServiceSupportPlans(param: {services: any, accountingService: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.getPlanTypeOptions" {
  export default function getPlanTypeOptions(): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.exportInvoicesCSV" {
  export default function exportInvoicesCSV(param: {invoiceIds: any, isNDIS: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.updateEntity" {
  export default function updateEntity(param: {recordId: any, entityValue: any, accountingService: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.checkEntityInvoice" {
  export default function checkEntityInvoice(param: {invoiceId: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.getServiceFundTrackerEntities" {
  export default function getServiceFundTrackerEntities(param: {fundTrackerIds: any, supportCatalogueIds: any, facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.updateServiceEntity" {
  export default function updateServiceEntity(param: {serviceId: any, entityId: any, accountingService: any}): Promise<any>;
}
declare module "@salesforce/apex/RosterInvoicesHandler.updateInvoiceStatus" {
  export default function updateInvoiceStatus(param: {invoiceId: any, status: any, accountingService: any}): Promise<any>;
}
