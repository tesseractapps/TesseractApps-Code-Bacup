declare module "@salesforce/apex/StaffController.fetchStaffs" {
  export default function fetchStaffs(param: {recordId: any, firstname: any, lastname: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.statusStaff" {
  export default function statusStaff(param: {IdValue: any, status: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.checkFutureShifts" {
  export default function checkFutureShifts(param: {staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.fetchStaff" {
  export default function fetchStaff(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.getStaffById" {
  export default function getStaffById(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.getStaffsByOrg" {
  export default function getStaffsByOrg(param: {recordId: any, FacilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.updateLeaveApprover" {
  export default function updateLeaveApprover(param: {staffId: any, approverId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.getStaffById1" {
  export default function getStaffById1(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.getStaffByStatus" {
  export default function getStaffByStatus(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.getStaffByEmail" {
  export default function getStaffByEmail(param: {email: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.getStaffHistory" {
  export default function getStaffHistory(param: {staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.fetchStaffList" {
  export default function fetchStaffList(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.StaffsRolesWiseList" {
  export default function StaffsRolesWiseList(param: {orgId: any, facIdlist: any, roles: any, name: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.getShadAwards" {
  export default function getShadAwards(param: {categoryType: any, jobType: any, classificationType: any, classificationPayType: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.getNursingAwrds" {
  export default function getNursingAwrds(param: {categoryType: any, jobType: any, classificationType: any, classificationPayType: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.getChildcareAwrds" {
  export default function getChildcareAwrds(param: {categoryType: any, jobType: any, classificationType: any, classificationPayType: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.insertPreTax" {
  export default function insertPreTax(param: {JsonString: any, staffID: any, isPretax: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.fetchFacilitiess" {
  export default function fetchFacilitiess(): Promise<any>;
}
declare module "@salesforce/apex/StaffController.getShiftTypeCssMap" {
  export default function getShiftTypeCssMap(): Promise<any>;
}
declare module "@salesforce/apex/StaffController.getOverlappingShiftsData" {
  export default function getOverlappingShiftsData(param: {strtTimeText: any, endTimeText: any, StaffID: any, startdate: any, shiftType: any, ShiftwithStaffId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.getCompanyBasedOnFacility" {
  export default function getCompanyBasedOnFacility(param: {selectedfacility: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.getRoleOptions" {
  export default function getRoleOptions(param: {staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.getRoleOptionsByFacility" {
  export default function getRoleOptionsByFacility(param: {facilityIdList: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.updateDocumentStatus" {
  export default function updateDocumentStatus(param: {documentId: any, status: any, comments: any, isEditOperation: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.fetchStaffDocuments" {
  export default function fetchStaffDocuments(): Promise<any>;
}
declare module "@salesforce/apex/StaffController.fetchSharedDocuments" {
  export default function fetchSharedDocuments(): Promise<any>;
}
declare module "@salesforce/apex/StaffController.fetchstaffBydoc" {
  export default function fetchstaffBydoc(param: {docId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.saveStaffDocShares" {
  export default function saveStaffDocShares(param: {docId: any, staffIds: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.fetchParticipantDocs" {
  export default function fetchParticipantDocs(): Promise<any>;
}
declare module "@salesforce/apex/StaffController.getStaffDocumentHistory" {
  export default function getStaffDocumentHistory(param: {documentId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.logDocumentView" {
  export default function logDocumentView(param: {documentId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.generateOtp" {
  export default function generateOtp(param: {recordId: any, fieldType: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.verifyOtp" {
  export default function verifyOtp(param: {recordId: any, fieldType: any, enteredOtp: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.archiveChildStaffDocument" {
  export default function archiveChildStaffDocument(param: {documentId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.getArchivedAttachments" {
  export default function getArchivedAttachments(param: {staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.restoreDocument" {
  export default function restoreDocument(param: {documentId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffController.getAllArchivedStaffDocuments" {
  export default function getAllArchivedStaffDocuments(): Promise<any>;
}
declare module "@salesforce/apex/StaffController.getParticipantShareStaffUsers" {
  export default function getParticipantShareStaffUsers(): Promise<any>;
}
declare module "@salesforce/apex/StaffController.getClientShareStaffUsers" {
  export default function getClientShareStaffUsers(param: {facilityId: any}): Promise<any>;
}
