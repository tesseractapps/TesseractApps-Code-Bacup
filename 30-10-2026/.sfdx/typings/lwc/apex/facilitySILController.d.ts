declare module "@salesforce/apex/facilitySILController.fetchActiveParticipants" {
  export default function fetchActiveParticipants(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/facilitySILController.fetchServiceTypes" {
  export default function fetchServiceTypes(): Promise<any>;
}
declare module "@salesforce/apex/facilitySILController.fetchParticipantNDISCatalogue" {
  export default function fetchParticipantNDISCatalogue(param: {serviceType: any, serviceDate: any}): Promise<any>;
}
declare module "@salesforce/apex/facilitySILController.fetchSILRecords" {
  export default function fetchSILRecords(param: {facilityId: any, limitSize: any, offsetVal: any}): Promise<any>;
}
declare module "@salesforce/apex/facilitySILController.saveSIL" {
  export default function saveSIL(param: {requestJson: any}): Promise<any>;
}
declare module "@salesforce/apex/facilitySILController.fetchSILRecordById" {
  export default function fetchSILRecordById(param: {silId: any, state: any}): Promise<any>;
}
declare module "@salesforce/apex/facilitySILController.updateSILStatus" {
  export default function updateSILStatus(param: {silId: any, status: any}): Promise<any>;
}
