declare module "@salesforce/apex/ClientFundTransferHandler.fundTrackerSpent" {
  export default function fundTrackerSpent(param: {fundRecord: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.fetchfundTracker" {
  export default function fetchfundTracker(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.fundTrackerSpentAmount" {
  export default function fundTrackerSpentAmount(param: {clientId: any, approvedAmount: any, availableFund: any, spentFund: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.saveFundTracker" {
  export default function saveFundTracker(param: {fundRecord: any, amount: any, gst: any, description: any, serviceDate: any, serviceStatus: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.fundTrackerRecord" {
  export default function fundTrackerRecord(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.savFundTransfer" {
  export default function savFundTransfer(param: {clientId: any, amountApprovedValue: any, amountApprovedDateValue: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.getSelectedSupportItems" {
  export default function getSelectedSupportItems(param: {fundTrackerId: any, clientId: any, state: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.deletedSelectedId" {
  export default function deletedSelectedId(param: {selectedDeletedId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.checkFundExists" {
  export default function checkFundExists(param: {clientId: any, serviceType: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.getNDISCatalog" {
  export default function getNDISCatalog(param: {ndisId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.getFacilityDetails" {
  export default function getFacilityDetails(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.getFundSplits" {
  export default function getFundSplits(param: {fundTrackerId: any, clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.saveFundSplits" {
  export default function saveFundSplits(param: {fundTrackerId: any, splits: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.updateFundSplits" {
  export default function updateFundSplits(param: {fundTrackerId: any, splits: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.replaceFundSplits" {
  export default function replaceFundSplits(param: {fundTrackerId: any, newSplits: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.previewSpentForPeriods" {
  export default function previewSpentForPeriods(param: {clientId: any, fundTrackerId: any, periods: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.recalculateFundPeriods" {
  export default function recalculateFundPeriods(param: {fundTrackerId: any, clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.getClientDetails" {
  export default function getClientDetails(param: {searchTerm: any, facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.getClients" {
  export default function getClients(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.createClient" {
  export default function createClient(param: {newClient: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.updateClient" {
  export default function updateClient(param: {clientToUpdate: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.getNDISData" {
  export default function getNDISData(param: {ServiceDate: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.getOrganisation" {
  export default function getOrganisation(): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.checkThresholds" {
  export default function checkThresholds(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.generateThresholdNotifications" {
  export default function generateThresholdNotifications(param: {clientId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.deleteFundSplits" {
  export default function deleteFundSplits(param: {fundTrackerId: any}): Promise<any>;
}
declare module "@salesforce/apex/ClientFundTransferHandler.deleteFundsTracker" {
  export default function deleteFundsTracker(param: {accountId: any}): Promise<any>;
}
