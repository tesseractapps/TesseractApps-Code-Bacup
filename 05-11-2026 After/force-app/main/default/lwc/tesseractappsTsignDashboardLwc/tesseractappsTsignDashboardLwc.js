import { LightningElement, track, wire, api } from "lwc";
import { getRecord } from "lightning/uiRecordApi";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import {
  subscribe,
  unsubscribe,
  MessageContext
} from "lightning/messageService";

// ---- Apex ----
import orgDetails from "@salesforce/apex/TsignOrgDetails.orgDetails";
import fetchFacilitiessForDashboard from "@salesforce/apex/TsignOrgDetails.fetchFacilitiessForDashboard";
import getStaffByEmail from "@salesforce/apex/StaffController.getStaffByEmail";
import getStaffEmailAndModules from "@salesforce/apex/TsignUserManagementController.getStaffEmailAndModules";
import getStaffDetailsByStatus from "@salesforce/apex/StaffStatusController.getStaffDetailsByStatus";
import getSignInStaffDetails from "@salesforce/apex/SignInStatusController.getSignInStaffDetails";
import getLeaveStaffDetails from "@salesforce/apex/PerformanceManagmentChartController.getLeaveStaffDetails";
import getClientById from "@salesforce/apex/ClientDataController.getClientByEmail";
import getCurrentLoggedUserInfo from "@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo";
import getstaffId from "@salesforce/apex/UserAccessController.getstaffId3";
import getFacilityCurrentUser from "@salesforce/apex/PortalUserController.getFacilityCurrentUser";
import fetchUserNotifications from "@salesforce/apex/MyNotificationController.getUserNotifications";
import markNotificationAsRead from "@salesforce/apex/MyNotificationController.markNotificationAsRead";
import getUserNotificationscount from "@salesforce/apex/MyNotificationController.getUserNotificationscount";

// ---- Schema / static resources / message channels ----
import Id from "@salesforce/user/Id";
import UserNameFld from "@salesforce/schema/User.Name";
import UserEmail from "@salesforce/schema/User.Email";
import UsrRoleName from "@salesforce/schema/User.User_Role__c";
import UserTypeOfUser from "@salesforce/schema/User.Type_of_User__c";
import UserTypeName from "@salesforce/schema/User.User_Type__c";
import ITSupport from "@salesforce/schema/User.IT_Support__c";
import ENABLE_TESSA from "@salesforce/schema/User.Enable_Tessa__c";
import TesseractLogo from "@salesforce/resourceUrl/TesseractLogo";
import Tlogo from "@salesforce/resourceUrl/Tlogo";
import Tdark from "@salesforce/resourceUrl/Tdark";
import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";
import TESSA_LOGO_BETA from "@salesforce/resourceUrl/TessaLogoBeta";
import TSIGN_MESSAGE_CHANNEL from "@salesforce/messageChannel/TsignMessageChannel__c";
import FOOTER_MESSAGE_CHANNEL from "@salesforce/messageChannel/FooterMessageChannel__c";
import DASHBOARD_REDIRECT_CHANNEL from "@salesforce/messageChannel/DashboardRedirectMessageChannel__c";
import BOT_ACTION_CHANNEL from "@salesforce/messageChannel/BotActionMessageChannel__c";
import FACILITY_DATA_REFRESH_EVENT from "@salesforce/messageChannel/facilityDataRefreshEvent__c";

import updateOrgLogo from '@salesforce/apex/TsignOrgDetails.updateOrgLogo';
import getUserNameInfo from '@salesforce/apex/TsignUserManagementController.getUserNameInfo';

/* =====================================================================
 * CONSTANTS
 * ===================================================================== */

const menu = (field) => `.menu-link[data-field="${field}"]`;
const subMenu = (field) => `.subcat a[data-field="${field}"]`;

// Build a record UID from a 15/18 char Salesforce Id, e.g. inc-xxxx-xxxx-xxxx
const toRecordUid = (prefix, id) =>
  `${prefix}-${id.substring(3, 7)}-${id.substring(7, 11)}-${id.substring(11, 15)}`;

const TIME_INTERVALS = [
  { label: "year", seconds: 31536000 },
  { label: "mon", seconds: 2592000 },
  { label: "week", seconds: 604800 },
  { label: "day", seconds: 86400 },
  { label: "hr", seconds: 3600 },
  { label: "min", seconds: 60 },
  { label: "sec", seconds: 1 }
];

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  for (const { label, seconds: size } of TIME_INTERVALS) {
    const count = Math.floor(seconds / size);
    if (count >= 1) return `${count} ${label}${count !== 1 ? "s" : ""} ago`;
  }
  return "just now";
}

const NAME_DEFAULTS = {
  participant: "Participant",
  facility: "Facility",
  staff: "Staff"
};

const SENIOR_ROLES = new Set([
  "Portal Account Partner Executive",
  "Portal Account Partner Manager",
  "CEO",
  "Admin"
]);

const SIGN_IN_STATUSES = ["Completed", "InProgress", "Accepted"];
const LEAVE_STATUSES = ["Requested", "Approved", "Rejected"];

// ---- Hash router ----
// URL model: #/<parent-slug>/<module-slug>/<record-uid>/<tab-slug>/<mode>
const SLUG_OVERRIDES = {
  Repository: "documents",
  "Clock In & Clock Out": "clock-in-and-out",
  "Awards & Recognition": "awards",
  "MP Awards & Recognition": "myawards",
  "My Profile": "myprofile",
  "Training & Evaluation": "training",
  "MP Training & Evaluation": "mytraining",
  "Leave Management": "leave-management",
  "MP Leave Management": "myleave-management",
  "Incident Register": "incident-register",
  "MP Reports": "myreports",
  ManageForm: "myforms",
  "MP Performance Management": "myperformance-management",
  "Staff Availability": "myavailability",
  "Sign In": "signin",
  "Sign in": "signin"
};

const UID_PREFIX_REGEX =
  /^(fac|x|org|stf|par|sft|awd|trn|lev|inc|doc|stfdoc|partdoc|jrn|att|fdb|sch|rsk|rem|ica|irr)-/i;
const SF_ID_REGEX = /^[a-z0-9]{15}$|^[a-z0-9]{18}$/i;

const BOUNDARY_SLUGS = new Set([
  "create",
  "issue-award",
  "learning",
  "rejected-shifts",
  "invoices",
  "efficiency-report",
  "roster-settings",
  "shift-reports",
  "monthly-calendar",
  "staff-view",
  "participant-view",
  "cashbout",
  "termination-payout",
  "leave-calendar",
  "all-staff",
  "settings",
  "organisation",
  "approvals",
  "submissions",
  "user-management",
  "staff-management",
  "reset-password",
  "user-report",
  "incidents",
  "action-register",
  "actions"
]);

// slugs that mean "open create flow" instead of "open record"
const CREATE_LIKE_SLUGS = new Set([
  "create",
  "issue-award",
  "learning",
  "cashbout",
  "termination-payout",
  "leave-calendar",
  "all-staff"
]);

// Child components are driven through their existing @api methods.
const openByUid = (c, uid, tab, isEdit) => c.openByUID(uid, tab, isEdit);
const createWithStep = (c, step) => c.openCreate(step);
const fullAdapter = (selector) => ({
  selector,
  open: openByUid,
  create: createWithStep
});
const openOnlyAdapter = (selector) => ({ selector, open: openByUid });

const RECORD_ADAPTERS = {
  Staff: fullAdapter("c-staff-data-community"),
  "Facility Staff": fullAdapter("c-staff-data-community"),
  "Human Resources Staff": fullAdapter("c-tesseract-apps-create-employee"),
  "Human Resources": fullAdapter("c-tesseract-apps-create-employee"),
  Participant: fullAdapter("c-client-data-with-pagination"),
  Participants: fullAdapter("c-participant-module-lwc"),
  Admin: {
    selector: "c-org-lwc-community",
    open: openByUid,
    create: (c) => c.openCreate()
  },
  Facility: fullAdapter("c-facility-data-community"),
  "Access Manager": fullAdapter("c-tesseract-apps-user-management-lwc"),
  "Roster Manager": fullAdapter("c-tesseract-apps-roster-creation"),
  Timesheet: openOnlyAdapter("c-tesseract-apps-roster-time-sheet-lwc"),
  Reimbursement: openOnlyAdapter("c-staff-submissions-lwc"),
  "Awards & Recognition": fullAdapter("c-awards-and-recognization-lwc"),
  "MP Awards & Recognition": fullAdapter("c-awards-and-recognization-lwc"),
  "Training & Evaluation": fullAdapter("c-tesseract-apps-wyzed-training"),
  "MP Training & Evaluation": fullAdapter("c-hr-training"),
  "Leave Management": fullAdapter("c-leave-management-lwc"),
  "MP Leave Management": fullAdapter("c-staff-leave-management-lwc"),
  "Incident Register": fullAdapter("c-form-incident-v2"),
  Repository: openOnlyAdapter("c-repository")
};

// Parent module -> flag that expands its submenu (used when replaying a deep link)
const PARENT_VISIBILITY_FLAGS = {
  Admin: "isAdminMenuVisible",
  "Human Resources": "isHrMenuVisible",
  "Roster Manager": "isRosterMenuVisible",
  Payroll: "isPayrollMenuVisible",
  Accounting: "isAccountingMenuVisible",
  "My Profile": "isMyProfileMenuVisible",
  "Support Coordinator": "supportCoordinatormoduleflag"
};

// ---- Module / menu flags ----
// Every flag below must also be declared as a class field (LWC reactivity).
const MODULE_FLAGS = [
  "dashboardflag", "Adminflag", "facilityflag", "clientflag", "participantLoginFlag",
  "staffflag", "rewardsFlag", "hrstaffflag", "trainingFlag", "leaveFlag",
  "myTemplatesFlag", "recruitmentFlag", "addshiftFlag", "shiftacceptFlag",
  "rosterTimeSheet", "submissionFlag", "SignInFlag", "participantFlag",
  "payrollFlag", "payrollexpenseFlag", "payrollinvoiceFlag", "payrollwagesFlag",
  "payrollSettingsFlag", "incidentFlag", "repositoryFlag", "smartReportsFlag",
  "AccountingFlag", "MasterDBFlag", "StaffAvailabilityFlag", "profileflag",
  "awardFlag", "profiletrainingFlag", "reportsFlag", "masterFlag",
  "accessManagerflag", "tSignflag", "tSupportflag", "supportCoordinatorflag",
  "supportParticipantflag", "supportTaskflag", "supportGoalsflag",
  "supportProvidersflag", "supportNotesflag", "supportBillingflag",
  "supportReportsflag", "documentflag", "performanceManagementflag",
  "myProfilePerformanceFlag", "libraryGoalflag", "userAccessManagementflag",
  "userResetPasswordflag", "userStaffManagementflag", "userStaffReportflag",
  "Icttimesheetflag", "formsflag", "ticketflag", "manageformsflag",
  "accountingReportsFlag", "ndisPayrollFlag", "ndisPayrollinvoiceFlag",
  "ndisBankFeedFlag", "ndisPayrollSettingsFlag", "chatterFlag", "TlearnerFlag",
  "CMSFlag", "XeroFlag", "MyobFlag", "QuickBooksFlag", "Tsmart",
  "ndisQuoteToolFlag", "ManageInvoiceFlag", "RejectedFlag", "RejectedReportsFlag",
  "contactUsTicketFlag", "TsignFloders", "TsignOrganisation", "TsignProfile",
  "TsignContacts", "TsignReports", "tsignSubscriptionFlag"
];

const MENU_FLAGS = [
  "isAdminMenuVisible", "isHrMenuVisible", "isRosterMenuVisible",
  "isPayrollMenuVisible", "isMyProfileMenuVisible", "isUserManagementVisible",
  "isAccountingMenuVisible", "supportCoordinatormoduleflag", "isTSignVisible",
  "isFormsVisible"
];

// Sidebar module -> facility dropdown disabled
const NON_FACILITY_MODULES = new Set([
  "My Profile",  "T Support", "Admin", "Facility", "Facility Admin",
  "Repository", "MP Awards & Recognition", "MP Training & Evaluation",
  "MP Leave Management", "MP Reports", "MP Performance Management",
  "Staff Availability", "Manage Library Goal", "Document", "T Learner", "Chatter",
  "NDIS Payroll", "NDIS Sales and Purchases", "Bank Feed", "NDIS Payroll Settings",
  "Accounting", "General Ledger", "Chart of Accounts", "Sign In", "My Templates",
  "Support Coordinator", "Support Participants", "Support Providers",
  "Support Notes", "Support Tasks", "Support Goals", "Support Billing",
  "Support Reports", "Forms"
]);

// Clicking an already-expanded parent collapses it and shows the parent landing view.
//   menu: expanded flag | off: sub flags to clear | on: parent flag to show
//   reset: "resetXxx" flag -> remount parent | retrigger: always remount
const PARENT_RETURN = {
  Admin: {
    menu: "isAdminMenuVisible",
    off: ["facilityflag", "clientflag", "participantLoginFlag", "staffflag"],
    on: "Adminflag",
    crumb: "Admin"
  },
  "Facility Admin": {
    menu: "isAdminMenuVisible",
    off: ["clientflag", "participantLoginFlag", "staffflag"],
    on: "facilityflag",
    crumb: "Admin"
  },
  "Human Resources": {
    menu: "isHrMenuVisible",
    off: ["rewardsFlag", "recruitmentFlag", "trainingFlag", "leaveFlag", "myTemplatesFlag", "performanceManagementflag", "libraryGoalflag"],
    on: "hrstaffflag",
    reset: "resetHrModuleStaffFlag",
    crumb: "Human Resources"
  },
  "Roster Manager": {
    menu: "isRosterMenuVisible",
    off: ["shiftacceptFlag", "rosterTimeSheet", "submissionFlag", "RejectedFlag", "ManageInvoiceFlag", "RejectedReportsFlag"],
    on: "addshiftFlag",
    reset: "resetRosterModuleFlag",
    crumb: "Roster Manager"
  },
  Payroll: {
    menu: "isPayrollMenuVisible",
    off: ["payrollexpenseFlag", "payrollinvoiceFlag", "payrollwagesFlag", "payrollSettingsFlag"],
    on: "payrollFlag",
    crumb: "Payroll"
  },
  Accounting: {
    menu: "isAccountingMenuVisible",
    off: ["MasterDBFlag", "AccountingFlag", "accountingReportsFlag", "ndisPayrollFlag", "ndisPayrollinvoiceFlag", "ndisBankFeedFlag", "ndisPayrollSettingsFlag"],
    on: "masterFlag",
    crumb: "Accounting"
  },
  "My Profile": {
    menu: "isMyProfileMenuVisible",
    off: ["awardFlag", "profiletrainingFlag", "reportsFlag", "myProfilePerformanceFlag", "bellNotification", "StaffAvailabilityFlag", "manageformsflag"],
    on: "profileflag",
    crumb: "My Profile"
  },
  "Support Coordinator": {
    menu: "supportCoordinatormoduleflag",
    off: ["supportParticipantflag", "supportTaskflag", "supportGoalsflag", "supportProvidersflag", "supportNotesflag", "supportBillingflag", "supportReportsflag"],
    on: "supportCoordinatorflag",
    crumb: "Support Coordinator"
  },
  "Access Manager": {
    menu: "isUserManagementVisible",
    off: ["userAccessManagementflag", "userStaffManagementflag", "userResetPasswordflag", "userStaffReportflag"],
    on: "accessManagerflag",
    retrigger: true,
    crumb: "Access Manager"
  },
  "T sign": {
    menu: "isTSignVisible",
    off: ["documentflag"],
    on: "tSignflag",
    crumb: "T sign"
  },
  Forms: {
    menu: "isFormsVisible",
    off: ["manageformsflag"],
    on: "formsflag",
    crumb: "Forms"
  }
};

// Sidebar click -> which flag renders, which menu expands, breadcrumb.
//   sub: true  -> submenu click (else main menu click)
//   retrigger  -> unmount/remount the flag      reset: "resetXxx" -> remount only when set
//   crumb      -> [category, subcategory]; "@facility" / "@participant" resolve at runtime
const MODULE_ROUTES = {
  Dashboard: { flag: "dashboardflag", crumb: ["Dashboard"] },
  TicketManager: { flag: "ticketflag" },

  // Admin
  Admin: { menu: "isAdminMenuVisible", flag: "Adminflag", retrigger: true, crumb: ["Admin"] },
  Facility: { menu: "isAdminMenuVisible", flag: "facilityflag", retrigger: true, sub: true, crumb: ["Admin", "@facility"] },
  Participant: { menu: "isAdminMenuVisible", flag: "clientflag", retrigger: true, sub: true, crumb: ["Admin", "@participant"] },
  Staff: { menu: "isAdminMenuVisible", flag: "staffflag", retrigger: true, sub: true, crumb: ["Admin", "Staff"] },
  "Facility Admin": { menu: "isAdminMenuVisible", flag: "facilityflag", crumb: ["Admin"] },
  "Facility Participant": { menu: "isAdminMenuVisible", flag: "clientflag", sub: true, crumb: ["Admin", "Participant"] },
  "Facility Staff": { menu: "isAdminMenuVisible", flag: "staffflag", sub: true, crumb: ["Admin", "Staff"] },

  // Human Resources
  "Human Resources": { menu: "isHrMenuVisible", flag: "hrstaffflag", reset: "resetHrModuleStaffFlag", crumb: ["Human Resources"] },
  "Awards & Recognition": { menu: "isHrMenuVisible", flag: "rewardsFlag", sub: true, crumb: ["Human Resources", "Awards"] },
  Recruitment: { menu: "isHrMenuVisible", flag: "recruitmentFlag", sub: true, crumb: ["Human Resources", "Recruitment"] },
  "Training & Evaluation": { menu: "isHrMenuVisible", flag: "trainingFlag", sub: true, crumb: ["Human Resources", "Training"] },
  "Leave Management": { menu: "isHrMenuVisible", flag: "leaveFlag", reset: "resetHrLeaveSubModuleFlag", sub: true, crumb: ["Human Resources", "Leave Management"] },

  // My Profile
  "Staff Availability": { menu: "isMyProfileMenuVisible", flag: "StaffAvailabilityFlag", sub: true, crumb: ["My Profile", "My Availability"] },

  // Roster Manager
  "Roster Manager": { menu: "isRosterMenuVisible", flag: "addshiftFlag", crumb: ["Roster Manager"] },
  "My Roster": { menu: "isRosterMenuVisible", flag: "shiftacceptFlag", sub: true, crumb: ["Roster Manager", "My Roster"] },
  RejectedShift: { menu: "isRosterMenuVisible", flag: "RejectedFlag", reset: "resetRosterRejectedSubFlag", sub: true, crumb: ["Roster Manager", "Rejected Shift"] },
  ManageInvoices: { menu: "isRosterMenuVisible", flag: "ManageInvoiceFlag", sub: true, crumb: ["Roster Manager", "Manage Invoices"] },
  RejectedReports: { menu: "isRosterMenuVisible", flag: "RejectedReportsFlag", sub: true, crumb: ["Roster Manager", "Rejected Reports"] },
  Timesheet: { menu: "isRosterMenuVisible", flag: "rosterTimeSheet", reset: "resetTimesheetSubModuleFlag", sub: true, crumb: ["Roster Manager", "Timesheet"] },
  Reimbursement: { menu: "isRosterMenuVisible", flag: "submissionFlag", retrigger: true, sub: true, crumb: ["Roster Manager", "Reimbursement"] },
  "Roster Manager Staff": { menu: "isRosterMenuVisible", flag: "shiftacceptFlag", crumb: ["Roster Manager"] },

  // Top-level modules
  "Sign In": { flag: "SignInFlag", crumb: ["Sign In"] },
  Participants: { flag: "participantFlag", reset: "resetParticipantModuleFlag", crumb: ["@participant"] },
  "Incident Register": { flag: "incidentFlag", reset: "resetIncidentModuleFlag", crumb: ["Incident Register"] },
  Repository: { flag: "repositoryFlag", crumb: ["Documents"] },
  Templates: { flag: "myTemplatesFlag", crumb: ["Templates"] },
  "ICT Timesheet": { flag: "Icttimesheetflag", crumb: ["ICT Timesheet"] },

  // Payroll
  Payroll: { menu: "isPayrollMenuVisible", flag: "payrollFlag", crumb: ["Payroll"] },
  Expenses: { menu: "isPayrollMenuVisible", flag: "payrollexpenseFlag", sub: true, crumb: ["Payroll", "Expenses"] },
  Invoices: { menu: "isPayrollMenuVisible", flag: "payrollinvoiceFlag", sub: true, crumb: ["Payroll", "Invoices"] },
  Wages: { menu: "isPayrollMenuVisible", flag: "payrollwagesFlag", sub: true, crumb: ["Payroll", "Wages"] },
  "Payroll Settings": { menu: "isPayrollMenuVisible", flag: "payrollSettingsFlag", sub: true, crumb: ["Payroll", "Settings"] },

  // Accounting
  Accounting: { menu: "isAccountingMenuVisible", flag: "masterFlag", crumb: ["Accounting"] },
  "NDIS Payroll": { menu: "isAccountingMenuVisible", flag: "ndisPayrollFlag", sub: true, crumb: ["Accounting", "Payroll"] },
  "NDIS Sales and Purchases": { menu: "isAccountingMenuVisible", flag: "ndisPayrollinvoiceFlag", sub: true, crumb: ["Accounting", "Sales and Purchases"] },
  "Bank Feed": { menu: "isAccountingMenuVisible", flag: "ndisBankFeedFlag", sub: true, crumb: ["Accounting", "Bank Feed"] },
  "NDIS Payroll Settings": { menu: "isAccountingMenuVisible", flag: "ndisPayrollSettingsFlag", sub: true, crumb: ["Accounting", "Settings"] },
  "General Ledger": { menu: "isAccountingMenuVisible", flag: "MasterDBFlag", sub: true, crumb: ["Accounting", "General Ledger"] },
  "Chart of Accounts": { menu: "isAccountingMenuVisible", flag: "AccountingFlag", sub: true, crumb: ["Accounting", "Chart of Accounts"] },

  // Support Coordinator
  "Support Coordinator": { menu: "supportCoordinatormoduleflag", flag: "supportCoordinatorflag", off: ["StaffAvailabilityFlag"], crumb: ["Support Coordinator"] },
  "Support Participants": { menu: "supportCoordinatormoduleflag", flag: "supportParticipantflag", sub: true, crumb: ["Support Coordinator", "Participants"] },
  "Support Tasks": { menu: "supportCoordinatormoduleflag", flag: "supportTaskflag", sub: true, crumb: ["Support Coordinator", "Tasks"] },
  "Support Goals": { menu: "supportCoordinatormoduleflag", flag: "supportGoalsflag", sub: true, crumb: ["Support Coordinator", "Goals"] },
  "Support Providers": { menu: "supportCoordinatormoduleflag", flag: "supportProvidersflag", sub: true, crumb: ["Support Coordinator", "Providers"] },
  "Support Notes": { menu: "supportCoordinatormoduleflag", flag: "supportNotesflag", sub: true, crumb: ["Support Coordinator", "Case Notes"] },
  "Support Billing": { menu: "supportCoordinatormoduleflag", flag: "supportBillingflag", sub: true, crumb: ["Support Coordinator", "Billing"] },
  "Support Reports": { menu: "supportCoordinatormoduleflag", flag: "supportReportsflag", sub: true, crumb: ["Support Coordinator", "Reports"] },

  // Access Manager
  "Access Manager": { menu: "isUserManagementVisible", flag: "accessManagerflag", retrigger: true, crumb: ["Access Manager"] },
  "Staff Management": { menu: "isUserManagementVisible", flag: "userStaffManagementflag", sub: true, crumb: ["Access Manager", "Staff Management"] },
  "User Management": { menu: "isUserManagementVisible", flag: "userAccessManagementflag", sub: true, crumb: ["Access Manager", "User Management"] },
  "Reset Password": { menu: "isUserManagementVisible", flag: "userResetPasswordflag", sub: true, crumb: ["Access Manager", "Reset Password"] },
  "User Report": { menu: "isUserManagementVisible", flag: "userStaffReportflag", sub: true, crumb: ["Access Manager", "User Report"] },

  // T sign / misc
  "T sign": { menu: "isTSignVisible", flag: "tSignflag", crumb: ["T sign"] },
  "T Support": { flag: "tSupportflag", crumb: ["T support"] },
  Document: { menu: "isTSignVisible", flag: "documentflag", sub: true, crumb: ["T sign", "Document"] },
  Forms: { menu: "isFormsVisible", flag: "formsflag", retrigger: true, crumb: ["Forms"] },
  "T Learner": { flag: "TlearnerFlag", crumb: ["T Learner"] },
  Chatter: { flag: "chatterFlag", crumb: ["ChaT"] },
  "Smart Reports": { flag: "smartReportsFlag", retrigger: true, crumb: ["Reports"] },
  CMS: { flag: "CMSFlag", collapseSidebar: true, crumb: ["CMS"] },
  Xero: { flag: "XeroFlag", retrigger: true, crumb: ["Xero"] },
  MYOB: { flag: "MyobFlag", retrigger: true, crumb: ["MYOB"] },
  QUICKBOOKS: { flag: "QuickBooksFlag", crumb: ["Quick Books"] },
  ndisquotetool: { flag: "ndisQuoteToolFlag", crumb: ["NDIS Quote Tool"] },

  // T sign shell
  Folders: { flag: "TsignFloders", crumb: ["Folders"] },
  "My Organisation": { flag: "TsignOrganisation", crumb: ["My Organisation"] },
  "My Profile": { flag: "TsignProfile", crumb: ["My Profile"] },
  Contacts: { flag: "TsignContacts", crumb: ["Contacts"] },
  Reports: { flag: "TsignReports", crumb: ["Reports"] }
};

// Active module name -> flag to remount when facility changes
const FLAG_BY_MODULE = {
  Dashboard: "dashboardflag",
  Admin: "Adminflag",
  Participant: "clientflag",
  "Facility Participant": "clientflag",
  Staff: "staffflag",
  "Facility Staff": "staffflag",
  "Staff ICT": "staffflag",
  "Human Resources": "hrstaffflag",
  "Leave Management": "leaveFlag",
  "MP Leave Management": "leaveFlag",
  "Awards & Recognition": "rewardsFlag",
  "MP Awards & Recognition": "rewardsFlag",
  Recruitment: "recruitmentFlag",
  "Training & Evaluation": "trainingFlag",
  "MP Training & Evaluation": "profiletrainingFlag",
  "Roster Manager": "addshiftFlag",
  ManageInvoices: "ManageInvoiceFlag",
  RejectedShift: "RejectedFlag",
  RejectedReports: "RejectedReportsFlag",
  Timesheet: "rosterTimeSheet",
  Reimbursement: "submissionFlag",
  "My Roster": "shiftacceptFlag",
  "Roster Manager Staff": "shiftacceptFlag",
  "Incident Register": "incidentFlag",
  "Access Manager": "accessManagerflag",
  "User Management": "userAccessManagementflag",
  "Staff Management": "userStaffManagementflag",
  "Reset Password": "userResetPasswordflag",
  "User Report": "userStaffReportflag",
  "ICT Timesheet": "Icttimesheetflag",
  Forms: "formsflag",
  ManageForm: "manageformsflag",
   Templates: "myTemplatesFlag",
  "My Profile": "profileflag",
  "MP Reports": "reportsFlag",
  "MP Performance Management": "myProfilePerformanceFlag",
  "Staff Availability": "StaffAvailabilityFlag",
  "Performance Management": "performanceManagementflag",
  "Manage Library Goal": "libraryGoalflag",
  Payroll: "payrollFlag",
  Expenses: "payrollexpenseFlag",
  Invoices: "payrollinvoiceFlag",
  Wages: "payrollwagesFlag",
  "Payroll Settings": "payrollSettingsFlag",
  "NDIS Payroll": "ndisPayrollFlag",
  "NDIS Sales and Purchases": "ndisPayrollinvoiceFlag",
  "NDIS Payroll Settings": "ndisPayrollSettingsFlag",
  "Bank Feed": "ndisBankFeedFlag",
  Accounting: "masterFlag",
  "General Ledger": "MasterDBFlag",
  "Chart of Accounts": "AccountingFlag",
  Reports: "accountingReportsFlag",
  "Sign In": "SignInFlag",
  Repository: "repositoryFlag",
  "Smart Reports": "smartReportsFlag",
  ndisquotetool: "ndisQuoteToolFlag",
  Contacts: "TsignContacts",
  "My Organisation":"TsignOrganisation"
};

// LMS redirect: submodule -> parent module
const SUBMODULE_PARENT = {
  "Leave Management": "Human Resources",
  "Awards & Recognition": "Human Resources",
  "Performance Management": "Human Resources",
  "Facility Staff": "Facility Admin",
  Staff: "Admin",
  Facility: "Admin",
  Participant: "Admin",
  Invoices: "Payroll",
  Expenses: "Payroll",
  Recruitment: "Human Resources",
  "Training & Evaluation": "Human Resources",
  "User Management": "Access Manager",
  "Reset Password": "Access Manager",
  "Staff Management": "Access Manager",
  "Staff Availability": "My Profile",
  "MP Reports": "My Profile",
  Reimbursement: "Roster Manager"
};

// Notification-bell "dashboardredirect" payloads
const DASHBOARD_EVENTS = {
  Award: { flag: "rewardsFlag", clicks: [menu("Human Resources"), subMenu("Awards & Recognition")] },
  Trainings: { flag: "trainingFlag", clicks: [menu("Human Resources"), subMenu("Training & Evaluation")] },
  Jobs: { flag: "recruitmentFlag", clicks: [menu("Human Resources"), subMenu("Recruitment")] },
  "Human Resources": { flag: "staffflag", clicks: [menu("Human Resources")] },
  "Sign in": { flag: "SignInFlag", clicks: [menu("Sign In")] },
  "Roster Manager": { flag: "addshiftFlag", staffView: true, clicks: [menu("Roster Manager")] },
  Invoice: { flag: "payrollinvoiceFlag", clicks: [menu("Payroll"), subMenu("Invoices")] },
  "Incident Register": { flag: "incidentFlag", clicks: [menu("Incident Register")] },
  "Performance Management": { flag: "performanceManagementflag", clicks: [menu("Human Resources"), subMenu("Performance Management")] },
  "Participant Details": { flag: "participantFlag", clicks: [menu("Participants")] },
  "Leave Management": { flag: "leaveFlag", clicks: [menu("Human Resources"), subMenu("Leave Management")] },
  "Staff Details": { flag: "staffflag", clicks: [menu("Admin"), subMenu("Staff")] },
  "Rejected Shifts": { flag: "RejectedFlag", clicks: [menu("Roster Manager"), subMenu("RejectedShift")] },
  "Manage Invoices": { flag: "ManageInvoiceFlag", clicks: [menu("Roster Manager"), subMenu("ManageInvoices")] },
  "ICT Timesheet": { flag: "Icttimesheetflag", clicks: [menu("ICT Timesheet")] },
  "My details": { flag: "shiftacceptFlag", clicks: [menu("Roster Manager Staff")] },
  "Staff Performance Management": { flag: "myProfilePerformanceFlag", clicks: [menu("My Profile"), subMenu("MP Performance Management")] },
  "Hr Performance Management": { flag: "performanceManagementflag", clicks: [menu("Human Resources"), subMenu("Performance Management")] },
  "staff Leave Management": { clicks: [menu("My Profile"), subMenu("MP Leave Management")] }
};

// Notification title -> where to go (simple cases; incidents handled separately)
const NOTIFICATION_ROUTES = {};
const addNotificationRoutes = (names, route) =>
  names.forEach((name) => {
    NOTIFICATION_ROUTES[name] = route;
  });

addNotificationRoutes(["Shift Starting Soon", "Shift Ending Soon"], {
  flag: "SignInFlag",
  clicks: [menu("Sign In")]
});
addNotificationRoutes(["Reimbursement Approval Request"], {
  flag: "addshiftFlag",
  staffView: true,
  clicks: [menu("Roster Manager"), subMenu("Reimbursement")]
});
addNotificationRoutes(["Leave Request"], {
  flag: "leaveFlag",
  clicks: [menu("Human Resources"), subMenu("Leave Management")]
});
addNotificationRoutes(["You have been awarded", "Congratulations on receiving a award."], {
  flag: "awardFlag",
  clicks: [menu("My Profile"), subMenu("MP Awards & Recognition")]
});
addNotificationRoutes(["Approval Status"], {
  flag: "submissionFlag",
  clicks: [menu("Roster Manager Staff"), menu("Roster Manager"), subMenu("Reimbursement")]
});
addNotificationRoutes(["My details"], {
  flag: "shiftacceptFlag",
  clicks: [menu("Roster Manager Staff")]
});
addNotificationRoutes(
  [
    ...["1 Month", "7 Days", "6 Days", "5 Days", "4 Days", "3 Days", "2 Days", "1 Day"].map(
      (s) => `Document Expiry in ${s}`
    ),
    "Your document has been approved",
    "Your document has been rejected"
  ],
  { flag: "profileflag", bell: true, clicks: [menu("My Profile")] }
);
addNotificationRoutes(
  [
    "Shift Allocation Notification",
    "Shift Assignment Notification-EOI",
    "Recurring Shift Notification - Daily",
    "Recurring Shift Notification - Weekly",
    "Recurring Shift Notification - Fortnightly",
    "Recurring Shift Notification - Monthly",
    "Shift Assignment - Notification",
    "Shift Notification"
  ],
  {
    flag: "shiftacceptFlag",
    clicks: [menu("Roster Manager Staff"), menu("Roster Manager"), subMenu("My Roster")]
  }
);
addNotificationRoutes(
  [
    "Correction Created in Client Journal",
    "New Task Assigned",
    "Participant Document Expiry in 2 Days"
  ],
  { flag: "participantFlag", participant: true, clicks: [menu("Participants")] }
);

const NO_NAVIGATION_NOTIFICATIONS = new Set([
  "Document is updated",
  "New document is uploaded",
  "Service Requested",
  "New Service Created",
  "Staff assigned",
  "Service Updated"
]);

const CORRECTIVE_ACTION_NOTIFICATIONS = new Set([
  "Corrective Action Overdue",
  "Corrective Action Assigned",
  "Corrective Action Completed"
]);

const INCIDENT_NOTIFICATIONS = new Set([
  "NDIS 5-Day Report Overdue",
  "NDIS 5-Day Report Due Today",
  "Reminder: NDIS 5-Day Report Due Tomorrow",
  "Reminder: NDIS 5-Day Report Due in 2 Days",
  "Reminder: NDIS 5-Day Report Due in 3 Days",
  "Reminder: NDIS Initial Notification Pending",
  "NDIS Initial Notification Overdue",
  "Incident Assigned",
  "New Incident Assigned"
]);

// Alt + key -> [field, content]
const SHORTCUTS = {
  b: ["dashboard", "Dashboard"],
  a: ["Admin", "Admin"],
  m: ["Access Manager", "Access Manager"],
  h: ["Human Resources", "Human Resources"],
  r: ["Roster Manager", "Roster Manager"],
  p: ["Participants", "Participants"],
  t: ["ICT Timesheet", "ICT Timesheet"],
  i: ["Incident Register", "Incident Register"],
  n: ["T sign", "T sign"],
  o: ["My Profile", "My Profile"],
  s: ["Sign In", "Sign In"],
  y: ["Repository", "Repository"],
  l: ["T Learner", "T Learner"],
  x: ["Xero", "Xero"],
  g: ["Accounting", "Accounting"]
};

const SUPPORT_COORDINATOR_SHORTCUTS = {
  s: ["supportCoordinator", "supportCoordinator"],
  p: ["supportParticipants", "supportParticipants"],
  t: ["supportTasks", "supportTasks"],
  g: ["supportGoals", "supportGoals"],
  o: ["supportProviders", "supportProviders"],
  n: ["supportNotes", "supportNotes"],
  b: ["supportBilling", "supportBilling"],
  r: ["supportReports", "supportReports"]
};

const ALWAYS_ALLOWED_SHORTCUTS = ["dashboard", "chatter", "t learner"];

const LOCAL_NAVIGATION_KEYS = [
  "clientRecordId",
  "activeClientTab",
  "activeAdminClientTab",
  "adminClientRecordId",
  "adminStaffRecordId",
  "activeAdminStaffTab",
  "hrStaffRecordId",
  "timesheetViewFlag",
  "timesheetStaffId",
  "timesheetStaffName",
  "timesheetIsChecked"
];

const GLOBAL_PATH_STYLE = `
  .slds-path__item.slds-is-complete .slds-path__stage { display: none !important; }
  .slds-path__item.slds-is-complete .slds-path__title,
  .slds-path__item.slds-is-complete:hover .slds-path__title {
    display: block !important; opacity: 1 !important; visibility: visible !important;
    transform: none !important; color: #fff !important; width: auto !important; height: auto !important;
  }
  .slds-path__item.slds-is-complete:hover .slds-path__stage { display: none !important; }
`;

const GLOBAL_NO_DATA_STYLE = `
  .no-data {
    grid-column: 1 / -1 !important; text-align: center !important;
    justify-content: center !important; align-items: center !important;
    display: flex !important; width: 100% !important; padding: 20px !important;
    color: var(--ta-color-text-light) !important; font-size: 22px !important; margin: 0 !important;
  }
`;

const MAX_FILE_SIZE = 1 * 1024 * 1024;

/* =====================================================================
 * COMPONENT
 * ===================================================================== */

export default class TesseractNdisApp extends LightningElement {
  @wire(MessageContext) messageContext;

  // ---- hash router state ----
  _routeModule = ""; // e.g. "admin/facility"
  _routeSubView = ""; // e.g. "x-Bo00-000D-2DHp/details/edit"
  _routeRestored = false; // restoreFromUrl() runs once after the menu renders
  _internalHashWrite = false; // suppress our own hashchange echo
  _isRestoring = false;
  // deep-link snapshot taken on the first line of connectedCallback (refresh gotcha)
  _dlModule = "";
  _dlSub = "";
  _dlConsumed = false;

  // ---- subscriptions / listeners / timers ----
  subscriptionBot;
  footerSubscription;
  tsignSubscription;
  dashboardSubscription;
  facilityRefreshSubscription;
  intervalId;
  mediaQuery;
  themeMedia;
  styleElements = [];
  siteforceObserver;
  boundHandleOutsideClick;
  boundShortcutHandler;

  // ---- module / menu flags (reset through MODULE_FLAGS / MENU_FLAGS) ----
  dashboardflag = false; Adminflag = false; facilityflag = false; clientflag = false;
  participantLoginFlag = false; staffflag = false; rewardsFlag = false; hrflag = true;
  hrstaffflag = false; trainingFlag = false; leaveFlag = false; myTemplatesFlag = false;
  recruitmentFlag = false; addshiftFlag = false; shiftacceptFlag = false;
  rosterTimeSheet = false; submissionFlag = false; SignInFlag = false;
  participantFlag = false; payrollFlag = false; payrollexpenseFlag = false;
  payrollinvoiceFlag = false; payrollwagesFlag = false; payrollSettingsFlag = false;
  incidentFlag = false; repositoryFlag = false; smartReportsFlag = false;
  AccountingFlag = false; MasterDBFlag = false; StaffAvailabilityFlag = false;
  profileflag = false; awardFlag = false; profiletrainingFlag = false; reportsFlag = false;
  masterFlag = false; accessManagerflag = false; tSignflag = true; tSupportflag = false;
  supportCoordinatorflag = false; supportParticipantflag = false; supportTaskflag = false;
  supportGoalsflag = false; supportProvidersflag = false; supportNotesflag = false;
  supportBillingflag = false; supportReportsflag = false; documentflag = false;
  performanceManagementflag = false; myProfilePerformanceFlag = false;
  libraryGoalflag = false; userAccessManagementflag = false; userResetPasswordflag = false;
  userStaffManagementflag = false; userStaffReportflag = false; Icttimesheetflag = false;
  formsflag = false; ticketflag = false; manageformsflag = false;
  accountingReportsFlag = false; ndisPayrollFlag = false; ndisPayrollinvoiceFlag = false;
  ndisBankFeedFlag = false; ndisPayrollSettingsFlag = false; chatterFlag = false;
  TlearnerFlag = false; CMSFlag = false; XeroFlag = false; MyobFlag = false;
  QuickBooksFlag = false; Tsmart = false; ndisQuoteToolFlag = false;
  ManageInvoiceFlag = false; RejectedFlag = false; RejectedReportsFlag = false;
  contactUsTicketFlag = false; TsignFloders = false; TsignOrganisation = false;
  TsignProfile = false; TsignContacts = false; TsignReports = false;

  isAdminMenuVisible = false; isHrMenuVisible = false; isRosterMenuVisible = false;
  isPayrollMenuVisible = false; isMyProfileMenuVisible = false;
  isUserManagementVisible = false; isAccountingMenuVisible = false;
  supportCoordinatormoduleflag = false; isTSignVisible = false; isFormsVisible = false;

  // "remount module on re-click" switches (set by clearMainModuleStorage / clearSubmoduleStorage)
  resetHrModuleStaffFlag = false;
  resetParticipantModuleFlag = false;
  resetRosterModuleFlag = false;
  resetTimesheetSubModuleFlag = false;
  resetHrLeaveSubModuleFlag = false;
  resetRosterRejectedSubFlag = false;
  resetIncidentModuleFlag = false;

  // ---- user / org ----
  Orgid;
  StaffId;
  orgname;
  orgfullname;
  orglogo;
  state;
  Orgabn;
  Otherleavetype;
  accountingServices;
  currentUser;
  currentUserEmail;
  currentUserRole;
  currentUserType;
  userType;
  IsItSupport;
  typeofuser = false;
  enableTessa = false;
  displayName;
  usererror;
  error;
  isLibraryGoal = false;
  isFacilityAdmin = false;
  isAdminChat = false;
  cmsDisplay = false;
  TSupportModule = false;
  isSupportCoordinator = false;
  supportcoordinatorNDisflag = false;
  supportCoordUserModule = false;
  supportCoordinator = false;
  isOrganisationAccount = false;
  isIndividualAccount = false;
  isStartPlanUser = false;
  showUpgradeModal = false;
  bellNotification = false;
  @track modules = [];
  @track clientData = [];
  @track staffId = null;

  // ---- participant (LWC wire) ----
  ndisFlag;
  ndisCreateFlag = false;
  individualFlag = false;
  CompanyFlag = false;
  participantName;
  clientId;
  @track participantdetails;
  @track riskIndexDetailsFromChild = {};

  // ---- navigation state ----
  activeMenu = "";
  activeSubmenu = "";
  dashboardActiveFlag = "";
  isStaffView = false;
  staffid = "";
  staffidflag;
  isTaskNavigation = false;
  openFromTask = false;
  taskLeaveId = null;
  isAutoOpeningSubmodule = false;
  navigatedParticipantId;
  navigatedRecordId;
  navigatedAction;

  // ---- layout ----
  isSidebarExpanded = false; // connectedCallback toggles it open once the shell is ready
  isMobileMenuOpen = false;
  isLoading = true;
  showLogoutDialog = false;
  showTessaAI = false;
  releaseNotes = false;
  privacyDis = false;
  TandC = false;
  showReleaseUpdate = false;
  modalKey = 0;
  isPrintMode = false;
  hideFacilityForIct = false;
  tessalogobeta = TESSA_LOGO_BETA;
  tLogoUrl = `${Loading_Logo}/TLogo.png`;
  tImageUrl = `${Loading_Logo}/T.png`;

  // ---- facility dropdown ----
  isFacilityDropdownDisabled = false;
  isOpen = false;
  facilityValue;
  facilityLabel;
  facilityPrefreedName;
  participantPrefreedName;
  staffPrefreedName;
  facilitySearchKey = "";
  @track allFacilities = [];
  @track finalListFacilities = [];

  // ---- notifications ----
  showNotifications = false;
  notificationCount = 0;
  notificationSearchTerm = "";
  @track allNotifications = [];
  @track filterednotification = [];
  @track items = [];

  // ---- T sign context ----
  tsignreUrl = "";
  serviceId = "";
  quoteId = null;
  formId = null;
  hrId = null;
  attachmentId = null;
  source;
  tsignEmail;
  staffEmail;
  myProfileModule = false;
  templatesModules = false;
  tSignModule = false;
  flodersModule = false;
  myOrgModule = false;
  contactsModule = false;
  reportsModule = false;

  // ---- sign in / out request modal ----
  signInRequesttemplate = false;
  signin = false;
  signout = false;
  shiftEnableGeolocation = false;
  shiftEnableSignin = false;
  shiftEnableSignout = false;
  shiftwithstaffId;
  staffIdforweekly;
  staffName;
  Shifttype;
  StaffRole;
  shifttimmings;
  shiftDate;
  signOutComments;
  SelectedComments = "";
  SelectedComments1 = "";
  isAtLoc;
  distFromLoc;

  // ---- bank details request modal ----
  bankDetailsRequest = false;
  xeroEmployeeId = "";
  existingAccountName = "";
  existingAccountNumber = "";
  existingBSB = "";
  requestedAccountName = "";
  requestedAccountNumber = "";
  requestedBSB = "";
  bankComments = "";
  approverComments = "";
  bankTaskId = "";
  selectedSaveOption = "onlyInSystem";
  saveOptions = [
    { label: "Only in System", value: "onlyInSystem" },
    { label: "Both in System and Xero", value: "bothSystemAndXero" }
  ];

  // ---- staff status modal ----
  showStaffStatusModal = false;
  staffStatusLabel = "";
  staffStatusKey;
  staffStatusLoading = false;
  staffSearchKey = "";
  @track staffStatusList = [];
  allStaffStatusList = [];

  _pendingBotTask = null;

    @track orglogo = '';         
    @track isModalOpen = false;
    @track previewUrl = '';      
    @track errorMessage = '';
    @track isLogoLoading = false;
     @track tempNewJson =''
    
    // Reference logic tracking properties
    @track isFileExpand = false;
    @track uploadedFile = null;
    selectedFile = null; // The local file selected by the user
    oldFileKey = '';     // The existing AWS key from the DB      
    
    // Track the existing AWS key so we can delete it after successful update
    oldLogoKey = '';

    stripeModuleOpened = false;
    tsignSubscriptionFlag = false;
    planBannerPromise = null;
    // header + subscription screen - filled by loadPlanBanner()
    showPlanBanner = false;
    planDaysText = "";
    planActionLabel = "";
    planBadgeLabel = ""; 
    subscriberEmail = "";
    stripeCustomerId = "";
    subscriptionOrgId = "";
    planExpired = false;
    planExpiredTitle = "";
    planExpiredMessage = "";
    planExpiredButtonLabel = "";
    stripeReturnPending = false; 
    accountTypeChanged = false;

  /* ------------------------------------------------------------------
   * Getters
   * ---------------------------------------------------------------- */

  get logoUrl() {
    return this.tLogoUrl;
  }
  get imageUrl() {
    return this.tImageUrl;
  }
  get logoUrl12() {
    return TesseractLogo;
  }
  get showNotificationBadges() {
    return this.userType !== "NDIS Staff" && this.userType !== "ICT Staff";
  }
  get sidebarClass() {
    let cls = this.isSidebarExpanded
      ? "sidebar sidebar-expanded"
      : "sidebar sidebar-collapsed";
    if (this.isMobileMenuOpen) cls += " mobile-open";
    return cls;
  }
  get mainContentClass() {
    return this.isSidebarExpanded ? "main-content" : "main-content main-content-expanded";
  }
  get toggleIconName() {
    return this.isSidebarExpanded ? "arrow_back_ios_new" : "lists";
  }
  get sidebarToggleClass() {
    return `sidebar-toggle ${this.isSidebarExpanded ? "sidebar-toggle-expanded" : "sidebar-toggle-collapsed"}`;
  }
  get logoClass() {
    return this.isSidebarExpanded ? "logo expanded" : "logo collapsed";
  }
  get subcatClass() {
    return this.isSidebarExpanded ? "subcat expanded" : "subcat collapsed";
  }
  get facilityDropdownClass() {
    return this.isSidebarExpanded
      ? "facilitydropdown sidebar-expanded"
      : "facilitydropdown sidebar-collapsed";
  }
  get dropdownClass() {
    return `slds-dropdown slds-dropdown_small custom-scroll ${this.isOpen ? "slds-show" : "slds-hide"}`;
  }
  get chevronClass() {
    return `material-icons chevron-icon ${this.isOpen ? "rotated" : ""}`;
  }
  get unreadCount() {
    return this.notificationCount || (this.items || []).filter((i) => !i.read).length;
  }
  get rosterPrintClass() {
    return this.isPrintMode ? "roster-print-wrapper print-active" : "roster-print-wrapper";
  }
  get showSaveOptionsRadios() {
    return this.accountingServices === "Xero" && !!this.xeroEmployeeId;
  }
  get isLeaveStatus() {
    return LEAVE_STATUSES.includes(this.staffStatusKey);
  }
  get isDocsExpiryStatus() {
    return this.staffStatusKey === "visaExpiry";
  }
  get isSignInStatus() {
    return SIGN_IN_STATUSES.includes(this.staffStatusKey);
  }
  get isAcceptedStatus() {
    return this.staffStatusKey === "Accepted";
  }
  get signInTableClass() {
    if (!this.isSignInStatus) return "staff-table";
    return this.isAcceptedStatus ? "staff-table signin-3col" : "staff-table signin-4col";
  }
  get signInRowClass() {
    return this.isAcceptedStatus ? "signin-3col" : "signin-4col";
  }
get showTSignCreator() { //manendra added this getter to check if the user is logged in and has orgid to show the TSign Creator
   return this.tSignflag && !!this.Orgid;
 }
  /* ------------------------------------------------------------------
   * Lifecycle
   * ---------------------------------------------------------------- */

  async connectedCallback() {
    // Refresh gotcha: snapshot the deep link BEFORE any module auto-opens.
    this._captureInitialDeepLink();
    this._loadGreeting();
    this._boundHashChange = this._onHashChange.bind(this);
    window.addEventListener("hashchange", this._boundHashChange);
    this._boundSubroute = this.handleSubrouteUpdate.bind(this);
    this.template.addEventListener("subrouteupdate", this._boundSubroute);
    //this._boundAccountTypeChange = this.handleAccountTypeChange.bind(this);
    //this.template.addEventListener("tsignaccounttypechange", this._boundAccountTypeChange);
    this._boundRecordFacilityResolved = this.handleRecordFacilityResolved.bind(this);
    this.template.addEventListener("recordfacilityresolved", this._boundRecordFacilityResolved);

        // Add these inside your connectedCallback() method
    this.boundBlockContextMenu = this.blockContextMenu.bind(this);
    this.boundBlockDevTools = this.blockDevTools.bind(this);

    document.addEventListener("contextmenu", this.boundBlockContextMenu);
    window.addEventListener("keydown", this.boundBlockDevTools);

   

    let userData = null;
    try {
      userData = await getCurrentLoggedUserInfo();
        console.log('TSign dashboard step 1 - user info loaded');
    } catch (e) {
      console.error("getCurrentLoggedUserInfo failed", e);
    }

    const isSupportCoordinatorUser = userData?.User_Type__c === "Support Coordinator";
    const isScFlagUser = !isSupportCoordinatorUser && userData?.SC__c === true;
    if (isSupportCoordinatorUser || isScFlagUser) {
      this.isSupportCoordinator = isSupportCoordinatorUser;
      this.supportcoordinatorNDisflag = isScFlagUser;
      this.supportCoordUserModule = true;
      this.supportCoordinator = true;
      this.smartReportsFlag = false;
    }

    // Global side effect (affects child components too): mute console unless logs enabled.
    if (!userData?.Enable_Logs__c) {
      console.log = console.warn = console.error = console.info = () => {};
    }

    this.loadNotificationCount();
    this.intervalId = setInterval(() => this.loadNotificationCount(), 30000);
    this.isLoading = true;

    const storedFacilityId = localStorage.getItem("defaultFacilityId");
    const storedFacilityLabel = localStorage.getItem("defaultFacilityLabel");
    if (storedFacilityId && storedFacilityLabel) {
      this.facilityValue = storedFacilityId;
      this.facilityLabel = storedFacilityLabel;
    }

    this.subscriptionBot = subscribe(this.messageContext, BOT_ACTION_CHANNEL, (payload) =>
      this.handleBotAction(payload)
    );

    this.userType = userData?.User_Type__c;
    await this.refreshFacilityDropdown();
    console.log('TSign dashboard step 2 - facilities loaded');

    this._setupTheme();

    this.mediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio * 96}dpi)`);
    this.mediaQuery?.addEventListener?.("change", this.dpiChangeHandler);

    this.handleSidebarToggle(); // opens the sidebar (initial state is collapsed)
     console.log('TSign dashboard step 3 - sidebar opened');
    this.subscribeToFooterMessage();
    this.subscribeToTsignMessage();
    this.subscribeToDashboardMessage();
    this.subscribeFacilityRefresh();

    this.planBannerPromise = this._loadOrgDetails(); 
    //this._loadOrgDetails();
    this.openModuleAfterStripe();        
    this._hideSiteHeader();
    this._injectGlobalStyle("global-no-data-style", GLOBAL_NO_DATA_STYLE);
    this._injectGlobalStyle("global-slds-path-style", GLOBAL_PATH_STYLE);

    setTimeout(() => this.fetchStaffDetails(), 2000);
    this.updateBreadcrumb("Dashboard");

    if (isSupportCoordinatorUser || userData?.SC__c === true) {
      this.supportCoordinatorflag = true;
      this.supportCoordinatormoduleflag = false; // let handleModuleClick take the normal open path
      this.StaffAvailabilityFlag = false;
      this.smartReportsFlag = false;
      setTimeout(() => this.handleModuleClick(this._fakeEvent("T sign", "T sign")), 500);
    } else {
      this.setActiveMenu("T sign");
    }

    setTimeout(() => {
      this.isLoading = false;
    }, 3000);

    this.removeSiteforceBorder();

    this.boundHandleOutsideClick = this.handleOutsideClick.bind(this);
    document.addEventListener("click", this.boundHandleOutsideClick);
    this.boundShortcutHandler = this.handleKeyboardShortcuts.bind(this);
    window.addEventListener("keydown", this.boundShortcutHandler);
    window.addEventListener("closedropdowns", this.handleCloseDropdowns);
  }

  disconnectedCallback() {
    clearInterval(this.intervalId);
    document.removeEventListener("click", this.boundHandleOutsideClick);
    window.removeEventListener("keydown", this.boundShortcutHandler);
    window.removeEventListener("closedropdowns", this.handleCloseDropdowns);
    window.removeEventListener("hashchange", this._boundHashChange);
      // Add these inside your disconnectedCallback() method
  document.removeEventListener("contextmenu", this.boundBlockContextMenu);
  window.removeEventListener("keydown", this.boundBlockDevTools);
    this.template.removeEventListener("subrouteupdate", this._boundSubroute);
    this.template.removeEventListener("recordfacilityresolved", this._boundRecordFacilityResolved);
    this.mediaQuery?.removeEventListener?.("change", this.dpiChangeHandler);
    this.themeMedia?.removeEventListener?.("change", this._onThemeChange);
    this.siteforceObserver?.disconnect();
    this.styleElements.forEach((el) => el.remove());
    this.styleElements = [];

    [
      this.subscriptionBot,
      this.footerSubscription,
      this.tsignSubscription,
      this.dashboardSubscription,
      this.facilityRefreshSubscription
    ].forEach((sub) => sub && unsubscribe(sub));
  }

  renderedCallback() {
    // Replay the URL once the TARGET module link exists. Module links are gated behind
    // flags set only after Apex resolves, so waiting for "any" .menu-link is too early.
    if (!this._routeRestored && this._hashTargetModuleReady()) {
      this._routeRestored = true;
      this.restoreFromUrl();
    }

    // Native tooltip = visible sidebar label
    this.template.querySelectorAll(".sidebar a, .sidebar .menu-link").forEach((link) => {
      const span = link.querySelector("span");
      if (!span) return;
      let text = "";
      span.childNodes.forEach((node) => {
        if (node.nodeType === 3) text += node.textContent; // text node
      });
      text = text.trim();
      if (text) link.setAttribute("title", text);
    });

    // Bot task waiting for the HR staff component to render
    if (this._pendingBotTask?.type === "change_staff_status") {
      const cmp = this.template.querySelector("c-tesseract-apps-create-employee");
      if (cmp && typeof cmp.changeStatusByName === "function") {
        const { name, targetStatus } = this._pendingBotTask;
        this._pendingBotTask = null;
        cmp.changeStatusByName(name, targetStatus);
      }
    }
  }

      // 1. Block Right-Click (Context Menu)
    blockContextMenu(event) {
      event.preventDefault();
      return false;
    }

    // 2. Block Common Developer Tools Shortcuts
    blockDevTools(event) {
      // Block F12
      if (event.key === "F12" || event.keyCode === 123) {
        event.preventDefault();
        return false;
      }

      // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Windows/Linux)
      // Block Cmd+Opt+I, Cmd+Opt+J, Cmd+Opt+C (Mac)
      if (
        (event.ctrlKey && event.shiftKey && ["I", "J", "C"].includes(event.key.toUpperCase())) ||
        (event.metaKey && event.altKey && ["I", "J", "C"].includes(event.key.toUpperCase()))
      ) {
        event.preventDefault();
        return false;
      }

      // Block Ctrl+U / Cmd+U (View Page Source)
      if ((event.ctrlKey || event.metaKey) && event.key.toUpperCase() === "U") {
        event.preventDefault();
        return false;
      }
    }

  /* ------------------------------------------------------------------
   * Wires
   * ---------------------------------------------------------------- */

  @wire(getRecord, {
    recordId: Id,
    fields: [UserNameFld, UserEmail, UsrRoleName, UserTypeName, ITSupport, UserTypeOfUser, ENABLE_TESSA]
  })
  userDetails({ error, data }) {
    if (data) {
      const f = data.fields;
      this.currentUser = f.Name.value;
      this.currentUserEmail = f.Email.value;
      this.currentUserRole = f.User_Role__c.value;
      this.currentUserType = f.User_Type__c.value;
      this.IsItSupport = f.IT_Support__c.value;
      this.typeofuser = f.Type_of_User__c.value;
      this.enableTessa = f.Enable_Tessa__c.value;

      const role = this.currentUserRole;
      const type = this.currentUserType;

      if (type === "Support Coordinator") {
        this.dashboardflag = false;
        this.supportCoordinatorflag = true;
        this.supportCoordinator = true;
      }
      this.isLibraryGoal = ["HR Admin", "NDIS Org Admin", "Facility Admin"].includes(type);
      if (type === "Facility Admin") this.isFacilityAdmin = true;

      this.TSupportModule =
        (role === "Portal Account Partner Executive" || role === "CEO") &&
        this.IsItSupport === "Yes";
      this.cmsDisplay = this.typeofuser === "NDIS" && SENIOR_ROLES.has(role);
      this.isAdminChat = type === "Support" || type === "Accountant for Organisation";
    } else if (error) {
      this.usererror = error;
    }
  }

  @wire(getClientById, { email: "$currentUserEmail" })
  wiredParticipant({ data, error }) {
    if (data?.length) {
      this.clientData = data;
      this.clientId = data[0].Id;
      this.participantName = data[0].Name__c;
      const typeOfService = data[0].Facility__r?.Type_of_Service__c;
      const participantType = data[0].ParticipantType__c ?? null;

      this.ndisFlag = typeOfService === "NDIS";
      this.ndisCreateFlag = this.ndisFlag;
      this.individualFlag = !this.ndisFlag && participantType === "Individual";
      this.CompanyFlag = !this.ndisFlag && participantType === "Company";
    } else if (error) {
      this.handleError(error);
    }
  }

  @wire(getStaffByEmail, { email: "$currentUserEmail" })
  wiredClient({ data, error }) {
    if (data?.length) {
      this.clientData = data;
      this.StaffId = data[0].Id;
    } else if (error) {
      this.handleError(error);
    }
  }

  @wire(getstaffId)
  wiredStaffId({ error, data }) {
    if (data) {
      this.staffId = data;
      this.displayName = data.Display_Nickname__c;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.staffId = undefined;
      console.error("Error fetching Staff ID:", JSON.stringify(error));
    }
  }

  handleError(error) {
    this.error = error;
    console.error("Dashboard error:", JSON.stringify(error));
  }

  /* ------------------------------------------------------------------
   * Small helpers
   * ---------------------------------------------------------------- */

  _fakeEvent(field, content = "") {
    return {
      currentTarget: { dataset: { field, content } },
      target: { dataset: { field, content } },
      preventDefault() {},
      stopPropagation() {}
    };
  }

  showToast(title, message, variant, mode = "dismissable") {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant, mode }));
  }

  simulateClick(selector) {
    setTimeout(() => {
      const element = this.template.querySelector(selector);
      if (element) element.dispatchEvent(new Event("click"));
    });
  }

  _goToHash(path) {
    window.location.hash = `#${path}`;
  }

  _injectGlobalStyle(id, css) {
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.innerText = css;
    document.head.appendChild(style);
    this.styleElements.push(style);
  }

  _setupTheme() {
    this.themeMedia = window.matchMedia?.("(prefers-color-scheme: dark)");
    this.updateFavicon(this.themeMedia?.matches ? Tdark : Tlogo);
    if (this.themeMedia) {
      this._onThemeChange = (e) => this.updateFavicon(e.matches ? Tdark : Tlogo);
      this.themeMedia.addEventListener("change", this._onThemeChange);
    }
  }

  updateFavicon(iconUrl) {
    document.querySelector("link[rel*='icon']")?.remove();
    const link = document.createElement("link");
    link.type = "image/png";
    link.rel = "icon";
    link.href = iconUrl;
    document.head.appendChild(link);
  }

  // _loadOrgDetails() {
  //   orgDetails()
  //     .then((response) => {
  //       if (!response) return;
  //       this.Orgid = response.Id;
  //       this.orgfullname = response.Name;
  //       this.orgname = response.Name ? response.Name.split(" ").slice(0, 2).join(" ") : "";
  //       this.state = response.Address_Latest__StateCode__s;
  //       this.Orgabn = response.ABN__c;
  //       this.Otherleavetype = response.Other_Leave_Type__c;
  //       this.accountingServices = response.Accounting_Services__c;
  //       if (this.accountingServices) {
  //         localStorage.setItem("orgAccountingServices", this.accountingServices);
  //       }
  //     //  this.orglogo = this._extractLogoSrc(response.Organization_Logo__c);
  //       this.isIndividualAccount = response.Account_Type__c === "Individual";
  //       this.isOrganisationAccount = response.Account_Type__c === "Organisation";
  //       this.openModuleAfterStripe(); 

  //       this.orglogo = response.Logo_URL__c;
  //       this.oldFileKey = response.Logo_key__c; 
  //       this.isIndividualAccount = response.Account_Type__c === "Individual";
  //       this.isOrganisationAccount = response.Account_Type__c === "Organisation";
  //     })
  //     .catch((error) => console.error("Error fetching Org Details:", error));
  // }
    _loadOrgDetails() {
    return orgDetails()
      .then((response) => {
        if (!response) {
          this.setPlanDetails(null);
          return;
        }
        this.Orgid = response.Id;
        this.orgfullname = response.Name;
        this.orgname = response.Name ? response.Name.split(" ").slice(0, 2).join(" ") : "";
        this.state = response.Address_Latest__StateCode__s;
        this.Orgabn = response.ABN__c;
        this.Otherleavetype = response.Other_Leave_Type__c;
        this.accountingServices = response.Accounting_Services__c;
        if (this.accountingServices) {
          localStorage.setItem("orgAccountingServices", this.accountingServices);
        }
      //  this.orglogo = this._extractLogoSrc(response.Organization_Logo__c);
        this.orglogo = response.Logo_URL__c;
        this.oldFileKey = response.Logo_key__c; 
        const firstLoad = !this.subscriptionOrgId;            // nothing loaded yet on this page
        const wasOrganisation = this.isOrganisationAccount;
        this.isIndividualAccount = response.Account_Type__c === "Individual";
        this.isOrganisationAccount = response.Account_Type__c === "Organisation";
        if (!firstLoad && wasOrganisation !== this.isOrganisationAccount) {
          this.accountTypeChanged = true;
          console.log("TSign dashboard - account type changed to " + response.Account_Type__c + " - page reloads on Back");
        }
        this.tempNewJson = response.Org_Logo_JSON__c;; 
        this.setPlanDetails(response);   // header: days remaining + Upgrade Now, and subscription screen details
      })
      .catch((error) => {
        console.error("Error fetching Org Details:", error);
        this.setPlanDetails(null);
      });
  }
  /* Header greeting: Hi, name + default signature */
  greetingName = '';
  greetingSignatureUrl = '';
  greetingSignatureMethod = '';

  get hasGreetingSignature() {
    return !!this.greetingSignatureUrl;
  }

  get greetingSignatureClass() {
    return this.greetingSignatureMethod === 'Type'
      ? 'signature-img signature-img-type'
      : 'signature-img';
  }

  async _loadGreeting() {
    try {
      const info = await getUserNameInfo();
      const firstName = info?.firstName ?? '';
      const lastName = info?.lastName ?? '';
      this.greetingName = `${firstName} ${lastName}`.trim() || 'Guest';
      this.greetingSignatureUrl = info?.signatureUrl ?? '';
      this.greetingSignatureMethod = info?.method ?? '';
    } catch (error) {
      console.error('Error loading greeting:', error);
    }
  }


      handleRefreshPage() {
        console.log('handle refresh called in dashboard');
        //if(this.isIndividualAccount){
           this._loadOrgDetails();
        //}
    }

      handleOpenModal() {
        this.isModalOpen = true;
        this.previewUrl = this.orglogo;
        this.errorMessage = '';
        this.selectedFile = null; 
    }

    handleCloseModal() {
        this.isModalOpen = false;
        this.previewUrl = '';
        this.selectedFile = null;
        this.errorMessage = '';
        this.isFileExpand = false; // Reset child component
    }

    triggerFileInput() {
        const input = this.template.querySelector('.hidden-file-input');
        if (input) {
            input.value = '';
            input.click();
        }
    }

    // --- REFERENCE LOGIC START ---
    handleFileSelect(event) {
        const selected = Array.from(event.target.files || []);
        this.acceptFiles(selected);
    }

    acceptFiles(files) {
        if (!files.length) return;

        const file = files[0];

        // 1 MB Size Validation
        if (file.size > MAX_FILE_SIZE) {
            this.errorMessage = 'File size cannot exceed 1 MB';
            this.showToast('File size cannot exceed 1 MB');
            return;
        }
        
        this.errorMessage = '';
        this.selectedFile = file;
        this.isLogoLoading = true;

        // Create local preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewUrl = e.target.result;
        };
        reader.readAsDataURL(file);

        // Trigger the child component to upload immediately
        const pass = () => {
            this.isFileExpand = true;
            setTimeout(() => {
                const svc = this.template.querySelector('c-document-office-service');
                if (!svc) {
                    this.isLogoLoading = false;
                    this.errorMessage = 'Upload service not found.';
                    return;
                }
                svc.incomingFiles = [this.selectedFile];
                svc.confirmUpload = true;
            }, 500); // Wait for component to render
        };

        // If child is already expanded, unmount then remount
        if (this.isFileExpand) {
            this.isFileExpand = false;
            setTimeout(pass, 100);
        } else {
            pass();
        }
}

  handleAwsUploadComplete(event) {
      console.log('Org Logo Upload Success', JSON.stringify(event.detail));
      
      const files = event.detail.files || [];
      if (!files.length) {
          this.isLogoLoading = false; 
          return;
      }

      const file = files[0];

      // Store the new data to be sent to Apex
      this.tempNewUrl = file.url;
      this.tempNewKey = file.key;
      this.tempNewSize = file.size != null ? String(file.size) : '';
      
      // NEW: Stringify the entire file object for the JSON field
      this.tempNewJson = JSON.stringify(file);

      // Show the newly uploaded image in the preview
      this.previewUrl = file.url;

      this.isLogoLoading = false;
  }
handleRemoveLogo() {
    this.previewUrl = '';         // Clear local preview
    this.selectedFile = null;     // Clear local file
    this.tempNewUrl = '';         // Set to empty so Apex clears the record
    this.tempNewKey = '';
    this.tempNewSize = '';
    this.tempNewFileName = '';
    this.isFileExpand = false;    // Reset child component
       this.tempNewJson = ''; // <-- Clear JSON
    
    // Optional: Show a message indicating the logo will be removed on update
    this.showToastLogo('Logo marked for removal. Click Update to save.', 'info');
}

   async handleUpdate() {
    // Ensure the AWS upload actually finished

    this.isLogoLoading = true;
    this.errorMessage = '';

    try {
        // 1. CALL APEX to save the new logo details
        await updateOrgLogo({ 
            orgId:  this.Orgid,
            logoUrl: this.tempNewUrl || '',     // Send empty string to clear
            logoKey: this.tempNewKey || '',
            logoSize: this.tempNewSize || '',
            logoFileName: this.tempNewFileName || '',
          logoJson: this.tempNewJson || '' // <-- NEW JSON PARAMETER
        });

        // 2. DELETE OLD AWS FILE (Only after DB save succeeds)
          /*    if (this.oldFileKey && this.oldFileKey !== this.tempNewKey) {
                  await this.deleteOldFileFromAWS(this.oldFileKey);
              }
      */
        // 3. SUCCESS CLEANUP
          this.orglogo = this.tempNewUrl || ''; // Will trigger the Home icon fallback in HTML
        this.oldFileKey = this.tempNewKey; // Update the old key reference
        this.isModalOpen = false;
        this.selectedFile = null;
        
        // Clear temp variables
        this.tempNewKey = null;
        this.tempNewUrl = null;
        this.previewUrl = '';
        
        //this.showToastLogo('Organisation logo updated successfully', 'success');
        const logoLabel = this.isOrganisationAccount ? 'Organisation logo' : 'Logo';       
        this.showToastLogo(`${logoLabel} updated successfully`, 'success');

    } catch (error) {
        console.error('Apex Save Error:', error);
        this.errorMessage = error.body ? error.body.message : 'Failed to update database.';
        this.showToastLogo(this.errorMessage, 'error');
    } finally {
        this.isLoading = false;
        this.isFileExpand = false; // Reset the child component
    }
}

    
    async deleteOldFileFromAWS(key) {
        if (!key) return;
        try {
            console.log('[AWS-DELETE] deleting key:', key);
            const response = await fetch('https://tesseractapps.com/delete-file', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });
            const data = await response.json();
            console.log('[AWS-DELETE] response:', data);
        } catch (error) {
            // Non-fatal: DB now points at the new URL; old object just lingers in S3
            console.error('[AWS-DELETE] failed:', error);
        }
    }

    handleFileDeleted() {
        this.isLogoLoading = false;
        this.isFileExpand = false;
        this.tempNewKey = null;
        this.tempNewUrl = null;
        this.previewUrl = '';
    }

    showToastLogo(message, variant = 'error') {
        this.dispatchEvent(
            new ShowToastEvent({
                title: variant === 'success' ? 'Success' : 'Error',
                message,
                variant
            })
        );
    }


  _extractLogoSrc(html) {
    if (!html) return "";
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.querySelector("img")?.getAttribute("src") || "";
  }

  // Experience Cloud default header is replaced by this shell: hide it, pin the footer.
  _hideSiteHeader() {
    const header = document.querySelector(
      "#CustomerPortalTemplate > div.cHeaderWrapper > div.cHeader.slds-container--fluid"
    );
    if (header) {
      Object.assign(header.style, { position: "fixed", zIndex: "980", top: "0", display: "none" });
    }
    const footer = document.querySelector("#CustomerPortalTemplate > div.cFooterPanel");
    if (footer) {
      Object.assign(footer.style, { position: "fixed", width: "89%", bottom: "1%", left: "11%" });
    }
  }

  // removeSiteforceBorder() {
  //   this.siteforceObserver = new MutationObserver(() => {
  //     const el = document.querySelector("#CustomerPortalTemplate");
  //     if (el && el.classList.contains("siteforceCptBody")) {
  //       el.style.border = "none";
  //       this.siteforceObserver.disconnect();
  //     }
  //   });
  //   this.siteforceObserver.observe(document.body, { childList: true, subtree: true });

  //   window.requestAnimationFrame(() => {
  //     const centerPanel = document.querySelector(".siteforceCptBody .cCenterPanel");
  //     if (centerPanel) centerPanel.style.margin = "0";
  //   });
  // }
  // The site wrapper adds an 8px margin + 1px border around our 100vh shell,
  // which causes a page scrollbar and a white gap on top. Lightning Web Security
  // blocks MutationObserver on <body>, so a global style is used instead.
  removeSiteforceBorder() {
    this._injectGlobalStyle(
      "global-site-shell-style",
      `
      .siteforceCptBody { border: 0 !important; }
      .siteforceCptBody .cCenterPanel { margin: 0 auto !important; max-width: none !important; }
      `
    );
  }  

  /* ------------------------------------------------------------------
   * Sidebar / layout
   * ---------------------------------------------------------------- */

  handleSidebarToggle() {
    this.isSidebarExpanded = !this.isSidebarExpanded;
    Promise.resolve().then(() => this.updateFooterPosition());
  }

  updateFooterPosition() {
    const footer = document.querySelector("#CustomerPortalTemplate > div.cFooterPanel");
    if (!footer) return;
    footer.style.transition = "all 0.1s ease";

    if (!this.isSidebarExpanded) {
      footer.style.width = "98%";
      footer.style.left = "2%";
      return;
    }
    const dpi = window.devicePixelRatio;
    if (dpi === 1.25) {
      footer.style.width = "87%";
      footer.style.left = "14%";
    } else if (dpi === 1.5) {
      footer.style.width = "84%";
      footer.style.left = "17%";
    } else {
      footer.style.width = "89%";
      footer.style.left = "11%";
    }
  }

  dpiChangeHandler = () => this.updateFooterPosition();

  handleMobileMenuToggle() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  handleMobileMenuClose() {
    this.isMobileMenuOpen = false;
  }

  closeUpgradeModal() {
    this.showUpgradeModal = false;
  }

  


 
  /* ------------------------------------------------------------------
   * Dropdowns (facility + notifications)
   * ---------------------------------------------------------------- */

  handleCloseDropdowns = () => {
    this.showNotifications = false;
    this.isOpen = false;
  };

  handleOutsideClick(event) {
    const path = event.composedPath ? event.composedPath() : [];

    if (this.isOpen) {
      const facilityDropdown = this.template.querySelector('[data-id="facility-dropdown"]');
      const clickedInside =
        facilityDropdown &&
        (path.includes(facilityDropdown) || facilityDropdown.contains(event.target));
      if (facilityDropdown && !clickedInside) this.isOpen = false;
    }

    if (this.showNotifications) {
      const notificationContainer = this.template.querySelector('[data-id="notification-container"]');
      if (notificationContainer && !path.includes(notificationContainer)) {
        this.showNotifications = false;
      }
    }
  }

  closeAllDropdowns() {
    this.isOpen = false;
    this.showNotifications = false;
  }

  @api closeDropdown() {
    this.isOpen = false;
  }

  @api openDropdown() {
    if (!this.isOpen) this._openFacilityDropdown();
  }

  @api refreshFacilityData() {
    return this.refreshFacilityDropdown();
  }

  @api getCurrentFacility() {
    return { value: this.facilityValue, label: this.facilityLabel };
  }

  handleToggleDropdown(event) {
    event.stopPropagation();
    if (this.isOpen) {
      this.closeAllDropdowns();
    } else {
      this._openFacilityDropdown();
    }
  }

  _openFacilityDropdown() {
    this.isOpen = true;
    this.showNotifications = false;
    this.facilitySearchKey = "";
    this.finalListFacilities = [...this.allFacilities];
  }

  stopPropagation(event) {
    event.stopPropagation();
  }

  stopPropagationHandler(event) {
    event.stopPropagation();
  }

  // Bound in the template on every notification <li>; navigation lives in handleNavigation.
  handleDropdownSelect() {}

  /* ------------------------------------------------------------------
   * Facility data
   * ---------------------------------------------------------------- */

  async refreshFacilityDropdown() {
    try {
      const userType = this.userType;
      const facilityData = await fetchFacilitiessForDashboard();
      const allOptions = facilityData.map((record) => ({
        label: record.Name,
        value: record.Id,
        participantPreferredName: "",
        facilityPreferredName: "",
        staffPreferredName: ""
      }));

      this.finalListFacilities = [];
       this.allFacilities = [...allOptions];

      this.finalListFacilities = [...this.allFacilities];
      this.validateCache();

      const selected = this.finalListFacilities.find((f) => f.value === this.facilityValue);
      if (selected) this.facilityLabel = selected.label;
    } catch (error) {
      console.error("Facility refresh error", error);
    }
  }

  // Make sure the stored facility is still valid; otherwise fall back to the first one.
  validateCache() {
    const list = this.finalListFacilities;

    if (list.length === 0) {
      this.facilityValue = null;
      this.facilityLabel = null;
      this.facilityPrefreedName = null;
      this.participantPrefreedName = null;
      [
        "defaultFacilityId",
        "defaultFacilityLabel",
        "defaultParticipantPreferredName",
        "defaultFacilityPreferredName",
        "defaultStaffPreferredName"
      ].forEach((key) => localStorage.removeItem(key));
      return;
    }

    const current = list.find((f) => f.value === this.facilityValue);
    this._applyFacility(current || list[0]);
    this._persistFacility();
  }

  _applyFacility(fac) {
    this.facilityValue = fac.value;
    this.facilityLabel = fac.label;
    this.facilityPrefreedName = fac.facilityPreferredName;
    this.participantPrefreedName = fac.participantPreferredName;
    this.staffPrefreedName = fac.staffPreferredName;
  }

  _persistFacility(fallback = {}) {
    localStorage.setItem("defaultFacilityId", this.facilityValue);
    localStorage.setItem("defaultFacilityLabel", this.facilityLabel);
    localStorage.setItem(
      "defaultParticipantPreferredName",
      this.participantPrefreedName || fallback.participant || ""
    );
    localStorage.setItem(
      "defaultFacilityPreferredName",
      this.facilityPrefreedName || fallback.facility || ""
    );
    localStorage.setItem(
      "defaultStaffPreferredName",
      this.staffPrefreedName || fallback.staff || ""
    );
  }

  handleFacilitySelect(event) {
    const d = event.currentTarget.dataset;
    this.facilityValue = d.facilityValue;
    this.facilityLabel = d.facilityLabel;
    this.facilityPrefreedName = d.facilityPreferredName;
    this.participantPrefreedName = d.participantPreferredName;
    this.staffPrefreedName = d.staffPreferredName;
    this.isOpen = false;
    this._persistFacility(NAME_DEFAULTS);

    // reset search
    this.facilitySearchKey = "";
    this.finalListFacilities = [...this.allFacilities];

    // leave any record detail view -> back to the module list
    if (this._routeSubView) {
      this._routeSubView = "";
      this._syncHash();
    }

    this.removeLocalNavigationItems();

    this.dispatchEvent(
      new CustomEvent("facilitychange", {
        detail: {
          facilityId: this.facilityValue,
          facilityLabel: this.facilityLabel,
          facility: { value: this.facilityValue, label: this.facilityLabel }
        }
      })
    );
    this.refreshCurrentModule();
  }

  handleFacilitySearch(event) {
    event.stopPropagation();
    this.isOpen = true;
    const raw = event.target.value;
    const search = raw ? raw.toLowerCase().trim() : "";
    this.facilitySearchKey = raw;

    if (!this.allFacilities || this.allFacilities.length === 0) {
      this.finalListFacilities = [];
      return;
    }
    if (!search) {
      this.finalListFacilities = [...this.allFacilities];
      return;
    }

    const filtered = this.allFacilities.filter(
      (f) => f.label && f.label.toLowerCase().includes(search)
    );
    this.finalListFacilities = filtered.length
      ? filtered
      : [{ label: "No Results Found", value: "no-results", disabled: true }];
  }

  handleRecordFacilityResolved(event) {
    const { facilities, skipFacilityChange, isApplyFilter } = event.detail || {};
    if (skipFacilityChange || !facilities || facilities.length === 0) return;

    // Record with several facilities: use the current one when filtering, otherwise the first.
    const target = isApplyFilter
      ? facilities.find((f) => f.id === this.facilityValue)
      : facilities[0];
    if (!target) return;

    let facilityId = target.id;
    if (!facilityId && target.name && this.allFacilities) {
      const wanted = String(target.name).trim().toLowerCase();
      const found = this.allFacilities.find(
        (f) => String(f.label).trim().toLowerCase() === wanted
      );
      if (found) facilityId = found.value;
    }
    if (facilityId) this.changeFacilityProgrammatically(facilityId);
  }

  changeFacilityProgrammatically(newFacilityId) {
    if (!this.allFacilities || this.allFacilities.length === 0) return;
    const found = this.allFacilities.find((f) => f.value === newFacilityId);
    if (!found || this.facilityValue === found.value) return;

    this._applyFacility(found);
    this._persistFacility(NAME_DEFAULTS);
    this.removeLocalNavigationItems();
    this.showToast("Facility Changed", `Facility has been changed to ${this.facilityLabel}`, "warning");
    this.refreshCurrentModule();
  }

  removeLocalNavigationItems() {
    LOCAL_NAVIGATION_KEYS.forEach((key) => localStorage.removeItem(key));
    this.riskIndexDetailsFromChild = {};
  }

  getCurrentFlagName() {
    if (this.dashboardActiveFlag === "Participants") {
      this.participantdetails = {};
      return this.currentUserType === "NDIS Participants" ? "participantLoginFlag" : "participantFlag";
    }
    return FLAG_BY_MODULE[this.dashboardActiveFlag] || null;
  }

  // Unmount + remount the active module so it reloads with the new facility.
  refreshCurrentModule() {
    window.dispatchEvent(new CustomEvent("tsignfacilitychange"));
    const flag = this.getCurrentFlagName();
    if (!flag) return;

    this[flag] = false;
    setTimeout(() => {
      // skip if the user navigated elsewhere in the meantime
      if (this.getCurrentFlagName() === flag) this[flag] = true;
    }, 0);
  }

  subscribeFacilityRefresh() {
    this.facilityRefreshSubscription = subscribe(
      this.messageContext,
      FACILITY_DATA_REFRESH_EVENT,
      async (message) => {
        if (message.facilityRefreshTrigger === "REFRESH_FACILITY_DATA") {
          await this.refreshFacilityDropdown();
        }
      }
    );
  }

  handleRefreshFacility() {
    this.refreshFacilityDropdown();
  }

  handleFacilityForIct(event) {
    this.hideFacilityForIct = event.detail.hideFacility;
    this.isFacilityDropdownDisabled = !!this.hideFacilityForIct;
  }

  /* ------------------------------------------------------------------
   * Breadcrumb / title
   * ---------------------------------------------------------------- */

  updateBreadcrumb(category, subcategory) {
    if (!category) {
      document.title = "TesseractApps";
    } else if (subcategory) {
      document.title = `${category} - ${subcategory} | TesseractApps`;
    } else if (category.toLowerCase() === "dashboard") {
      document.title = "Home | TesseractApps";
    } else {
      document.title = `${category} | TesseractApps`;
    }
  }

  /* ------------------------------------------------------------------
   * Message channels
   * ---------------------------------------------------------------- */

  subscribeToFooterMessage() {
    this.footerSubscription = subscribe(this.messageContext, FOOTER_MESSAGE_CHANNEL, (message) => {
      switch (message.action) {
        case "openContactPanel":
          this.openContactUsPanel();
          break;
        case "openReleaseNotes":
          this.openReleaseNotes();
          break;
        case "openPrivacy":
          this.openPrivacy();
          break;
        case "openTerms":
          this.openTerms();
          break;
        case "expandSidebar":
          if (this.isSidebarExpanded) this.handleSidebarToggle();
          break;
        default:
          break;
      }
    });
  }

  subscribeToDashboardMessage() {
    if (this.dashboardSubscription) return; // already subscribed
    this.dashboardSubscription = subscribe(this.messageContext, DASHBOARD_REDIRECT_CHANNEL, (message) =>
      this.handleRedirectMessage(message)
    );
  }

  subscribeToTsignMessage() {
    this.tsignSubscription = subscribe(this.messageContext, TSIGN_MESSAGE_CHANNEL, (message) => {
      try {
        const awsUrl = message?.tsignreUrl;
        const legacyRecordId = message?.recordId; // old payloads only send recordId
        const source = message?.source; // SERVICE | QUOTE | FORM | HR | ATTACHMENT

        if (message?.clientEmail) this.tsignEmail = message.clientEmail;

        // Which context field does this payload fill?
        let field;
        let id;
        switch (source) {
          case "QUOTE":
            field = "quoteId";
            id = message?.quoteId || null;
            break;
          case "FORM":
            field = "formId";
            id = legacyRecordId || null; // Dynamic_Form_Response__c Id
            break;
          case "HR":
            field = "hrId";
            id = message?.hrId || legacyRecordId || null;
            break;
          case "ATTACHMENT":
            field = "attachmentId";
            id = message?.attachmentId || null;
            break;
          case "SERVICE":
            field = "serviceId";
            id = message?.serviceId || legacyRecordId || null;
            break;
          default: // legacy payload: recordId = service agreement Id
            field = "serviceId";
            id = legacyRecordId || message?.serviceId || null;
        }

        if (!awsUrl || !id) {
          console.warn("Missing/invalid data in received TSign message:", message);
          return;
        }

        this.tsignreUrl = awsUrl;
        this.serviceId = null;
        this.quoteId = null;
        this.formId = null;
        this.hrId = null;
        this.attachmentId = null;
        this[field] = id;
        this.source = source || "SERVICE";

        this.handleTsignRedirect();
      } catch (e) {
        console.error("Error while processing TSign message:", e, message);
      }
    });
  }

  handleTsignRedirect() {
    this.resetFlags();
    // force a rerender before opening T sign
    Promise.resolve().then(() => {
      this.tSignflag = true;
      this.setActiveMenu("T sign");
      this.updateBreadcrumb("T sign");
    });
  }

  handleTemplateReset() {
    this.resetTsignContext();
  }

  resetTsignContext() {
    this.tsignEmail = "";
    this.source = null;
    this.serviceId = null;
    this.quoteId = null;
    this.formId = null;
    this.hrId = null;
    this.attachmentId = null;
  }

  /* ------------------------------------------------------------------
   * Footer modals
   * ---------------------------------------------------------------- */

  openTerms() { this.TandC = true; }
  closeTerms() { this.TandC = false; }
  openPrivacy() { this.privacyDis = true; }
  closePrivacy() { this.privacyDis = false; }
  openReleaseNotes() { this.releaseNotes = true; }
  closeReleaseNotes() { this.releaseNotes = false; }

  onClickRelease() {
    if (this.showReleaseUpdate) return;
    this.modalKey = Date.now(); // fresh instance each time
    this.showReleaseUpdate = true;
  }

  handleReleaseUpdateClose() {
    this.showReleaseUpdate = false;
  }

  openContactUsPanel() {
    this.resetFlags();
    this.contactUsTicketFlag = true;
    this.updateBreadcrumb("Contact Us");
    this.isFacilityDropdownDisabled = true;
    this.activeMenu = "";
    this.activeSubmenu = "";
    this.template
      .querySelectorAll(".menu-link.active, .subcat a.active")
      .forEach((link) => link.classList.remove("active"));
  }

  handleCloseTicket() {
    this.contactUsTicketFlag = false;
    this.tSignflag = true;
    this.setActiveMenu("dashboard");
    this.updateBreadcrumb("Dashboard");
    this.isFacilityDropdownDisabled = false;
  }

  handleCloseQuote() {
    this.ndisQuoteToolFlag = false;
    this.tSignflag = true;
    this.setActiveMenu("dashboard");
    this.updateBreadcrumb("Dashboard");
  }

  openTessaAI() {
    this.showTessaAI = true;
  }

  handleCloseTessaAI() {
    this.showTessaAI = false;
  }

  handlePrintStart() { this.isPrintMode = true; }
  handlePrintEnd() { this.isPrintMode = false; }

  /* ------------------------------------------------------------------
   * Hash router
   * URL model: #/<parent-slug>/<module-slug>/<record-uid>/<tab-slug>/<mode>
   * Name <-> slug translation happens ONLY at the hash boundary.
   * ---------------------------------------------------------------- */

  toSlug(name) {
    return String(name || "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  _nameToSlug(name) {
    return !name ? "" : SLUG_OVERRIDES[name] || this.toSlug(name);
  }

  // A segment with a known prefix (or a raw SF Id) is a record id, kept verbatim.
  _isUidSegment(s) {
    const str = String(s || "");
    return UID_PREFIX_REGEX.test(str) || SF_ID_REGEX.test(str);
  }

  _isBoundarySegment(s) {
    return this._isUidSegment(s) || BOUNDARY_SLUGS.has(String(s || "").toLowerCase());
  }

  _segToSlug(s) {
    return this._isUidSegment(s) ? s : this._nameToSlug(s);
  }

  _pathToSlug(p) {
    return String(p || "")
      .split("/")
      .filter(Boolean)
      .map((s) => this._segToSlug(s))
      .join("/");
  }

  // slug -> real data-field, built from the live sidebar
  _buildSlugToFieldMap() {
    const map = {};
    this.template.querySelectorAll("[data-field]").forEach((el) => {
      const field = el.dataset.field;
      if (field) map[this._nameToSlug(field)] = field;
    });
    return map;
  }

  getRouteFromHash() {
    const h = window.location.hash || "";
    const raw = h.startsWith("#/") ? h.slice(2) : h.startsWith("#") ? h.slice(1) : h;
    return raw
      .split("/")
      .filter(Boolean)
      .map((s) => {
        try {
          return decodeURIComponent(s);
        } catch (e) {
          return s;
        }
      })
      .join("/");
  }

  _encodePath(p) {
    return String(p || "")
      .split("/")
      .filter(Boolean)
      .map((s) => encodeURIComponent(s))
      .join("/");
  }

  _composeHash() {
    const path = [this._encodePath(this._routeModule), this._encodePath(this._routeSubView)]
      .filter(Boolean)
      .join("/");
    return path ? `#/${path}` : "";
  }

  // Write the hash without triggering our own restore (and only when it changes).
  _writeHash(newHash) {
    if ((window.location.hash || "") === newHash) return;
    this._internalHashWrite = true;
    window.location.hash = newHash;
  }

  _syncHash() {
    const newHash = this._composeHash();
    if ((window.location.hash || "") === newHash) return;
    if (!newHash) {
      // clear the hash without adding a history entry / page jump
      history.replaceState(null, "", window.location.pathname + window.location.search);
      return;
    }
    this._writeHash(newHash);
  }

  // Upgrade the URL in place (no new history entry).
  _replaceHashCanonical() {
    const newHash = this._composeHash();
    if ((window.location.hash || "") === newHash) return;
    try {
      history.replaceState(null, "", newHash || window.location.pathname + window.location.search);
    } catch (e) {
      this._writeHash(newHash);
    }
    // safety net if replaceState silently no-op'd
    if (newHash && (window.location.hash || "") !== newHash) this._writeHash(newHash);
  }

  _onHashChange() {
    if (this._internalHashWrite) {
      this._internalHashWrite = false; // echo from our own write
      return;
    }
    this.restoreFromUrl();
  }

  // Module click -> module path in slug form; reset the sub-view.
  updateUrlForModule(field, parent) {
    if (this._isRestoring) return;

    // top-level items may carry only data-content
    if (!field && parent) {
      field = parent;
      parent = null;
    }
    const sameLevel = !parent || String(parent).toLowerCase() === String(field || "").toLowerCase();
    const modulePath = sameLevel
      ? this._nameToSlug(field)
      : `${this._nameToSlug(parent)}/${this._nameToSlug(field)}`;

    // Refresh gotcha: the target module auto-opens BEFORE restore and would wipe the record
    // from the hash. Keep the captured deep link until the target module actually opens.
    if (!this._dlConsumed && this._dlSub) {
      const onPath = modulePath === this._dlModule || this._dlModule.startsWith(`${modulePath}/`);
      if (onPath) {
        this._routeModule = this._dlModule;
        this._routeSubView = this._dlSub;
        if (modulePath === this._dlModule) this._dlConsumed = true;
        this._syncHash();
        return;
      }
      this._dlConsumed = true;
    }

    this._routeModule = modulePath;
    this._routeSubView = "";
    this._syncHash();
  }

  // Record / tab / mode change. `replace` updates in place (no history entry).
  updateUrlForSubView(subView, replace) {
    this._routeSubView = this._pathToSlug(subView);
    if (replace) this._replaceHashCanonical();
    else this._syncHash();
  }

  handleSubrouteUpdate(event) {
    const d = event && event.detail;
    const subView = typeof d === "string" ? d : d && (d.subView || d.path || "");
    this.updateUrlForSubView(subView || "", !!(d && d.replace));
  }

  // Programmatic deep link (notifications): set router state + hash in one go.
  _setDeepRoute(moduleSlug, subRoute) {
    this._writeHash(`#/${moduleSlug}/${subRoute}`);
    this._routeModule = moduleSlug;
    this._routeSubView = subRoute;
    this._dlModule = moduleSlug;
    this._dlSub = subRoute;
    this._dlConsumed = false;
  }

  _captureInitialDeepLink() {
    const segs = this.getRouteFromHash()
      .split("/")
      .filter(Boolean)
      .map((s) => this._segToSlug(s));
    const d = segs.findIndex((s) => this._isBoundarySegment(s));
    if (d >= 0) {
      this._dlModule = segs.slice(0, d).join("/");
      this._dlSub = segs.slice(d).join("/");
    } else {
      this._dlModule = segs.join("/");
      this._dlSub = "";
    }
  }

  // Replay a sidebar click.
  //   parentField: data-field of the top-level parent (null for a top-level module)
  //   moduleField: data-field of the (sub)module if already known
  //   moduleSlug : slug of the (sub)module, used to find its subcat after the parent expands
  _replaySidebarClick(parentField, moduleField, moduleSlug) {
    const sameAsParent =
      parentField &&
      String(parentField).toLowerCase() === String(moduleField || moduleSlug).toLowerCase();

    if (parentField && !sameAsParent) {
      // Expand the parent directly (simulated clicks race with rendering), then click the submodule.
      const flagName = PARENT_VISIBILITY_FLAGS[parentField];
      if (flagName) this[flagName] = true;

      const parentLink = this.template.querySelector(menu(parentField));
      if (parentLink) {
        this.template.querySelectorAll(".menu-link").forEach((l) => l.classList.remove("active"));
        parentLink.classList.add("active");
        this.activeMenu = parentField;
      }
      this._clickSubmoduleWhenReady(moduleField, moduleSlug);
      return;
    }

    // top-level module: its menu-link is already in the DOM
    if (moduleField && this.template.querySelector(menu(moduleField))) {
      this.simulateClick(menu(moduleField));
    } else if (moduleSlug) {
      this._clickTopLevelBySlug(moduleSlug);
    }
  }

  // A submodule's subcat link exists only after its parent expands: poll for it.
  _clickSubmoduleWhenReady(moduleField, moduleSlug, tries = 0) {
    const links = this.template.querySelectorAll(".subcat a[data-field]");
    for (const link of links) {
      const df = link.dataset.field;
      const slug = this._nameToSlug(df);
      if (
        (moduleField && df === moduleField) ||
        slug === moduleSlug ||
        (moduleSlug === "staff" && ["facility-staff", "Facility Staff", "Staff"].some((v) => v === slug || v === df)) ||
        (moduleSlug === "participant" && ["facility-participant", "Facility Participant", "Participant"].some((v) => v === slug || v === df))
      ) {
        link.click(); // real click -> handleModuleClick
        return;
      }
    }
    if (tries < 25) {
      setTimeout(() => this._clickSubmoduleWhenReady(moduleField, moduleSlug, tries + 1), 80);
    } else {
      console.warn("Could not find submodule link in DOM:", moduleField || moduleSlug);
    }
  }

  _clickTopLevelBySlug(moduleSlug) {
    const links = this.template.querySelectorAll(".menu-link[data-field]");
    for (const link of links) {
      const df = link.dataset.field;
      const slug = this._nameToSlug(df);
      if (
        slug === moduleSlug ||
        df === moduleSlug ||
        ((moduleSlug === "signin" || moduleSlug === "sign-in") && (slug === "signin" || slug === "sign-in"))
      ) {
        link.click();
        return;
      }
    }
  }

  // Is the sidebar link for the module named in the hash rendered yet? Menu items are gated
  // behind flags set after Apex resolves, so the first restore must wait for the TOP-LEVEL link.
  // (A submodule link only exists after its parent is clicked, so never wait for it.)
  _hashTargetModuleReady() {
    const raw = this.getRouteFromHash();
    if (!raw) return true;
    const segs = raw.split("/").filter(Boolean).map((s) => this._segToSlug(s));
    const boundary = segs.findIndex((s) => this._isBoundarySegment(s));
    const modulePathSegs = boundary >= 0 ? segs.slice(0, boundary) : segs;
    const topSlug = modulePathSegs[0];
    if (!topSlug) return true;

    const links = this.template.querySelectorAll(".menu-link[data-field]");
    return Array.from(links).some((l) => this._nameToSlug(l.dataset.field) === topSlug);
  }

  // Resolve a module slug to its real data-field when the sidebar map has no entry.
  _resolveModuleField(moduleSlug, parentSlug) {
    switch (moduleSlug) {
      case "staff":
        if (parentSlug === "human-resources") return "Human Resources Staff";
        return parentSlug === "facility-admin" || this.isFacilityAdmin ? "Facility Staff" : "Staff";
      case "facility-staff": return "Facility Staff";
      case "facility": return "Facility";
      case "participants": return "Participants";
      case "participant": return "Participant";
      case "access-manager": return "Access Manager";
      case "roster-manager":
      case "roster":
      case "rosters": return "Roster Manager";
      case "awards":
      case "awards-and-recognition": return "Awards & Recognition";
      case "myawards":
      case "mp-awards-and-recognition": return "MP Awards & Recognition";
      case "training":
      case "learning": return "Training & Evaluation";
      case "mytraining": return "MP Training & Evaluation";
      case "leave-management":
      case "myleave-management":
      case "cashbout":
      case "termination-payout":
      case "leave-calendar":
      case "all-staff":
        return parentSlug === "myprofile" || parentSlug === "my-profile"
          ? "MP Leave Management"
          : "Leave Management";
      case "myreports":
      case "mpreports": return "MP Reports";
      case "myforms":
      case "manageform":
      case "manage-form": return "ManageForm";
      case "myperformance-management":
      case "mpperformance-management": return "MP Performance Management";
      case "myavailability":
      case "staffavailability": return "Staff Availability";
      case "incident-register": return "Incident Register";
      case "timesheet":
      case "timesheets": return "Timesheet";
      case "reimbursement":
      case "reimbursements": return "Reimbursement";
      case "signin":
      case "sign-in": return "Sign In";
      default: return null;
    }
  }

  // Replay the hash: click sidebar, open the record, canonicalize legacy URLs.
  restoreFromUrl() {
    const raw = this.getRouteFromHash();
    if (!raw) return;

    this._isRestoring = true;
    try {
      // normalize each segment (also upgrades legacy %20 / mixed-case names to slugs)
      const segs = raw.split("/").filter(Boolean).map((s) => this._segToSlug(s));
      const map = this._buildSlugToFieldMap();

      // The record-uid / "create" segment is the module <-> detail boundary. Parse STRUCTURALLY:
      // a submodule's subcat link isn't in the DOM until its parent is clicked.
      const boundary = segs.findIndex((s) => this._isBoundarySegment(s));
      let modulePathSegs = boundary >= 0 ? segs.slice(0, boundary) : segs.slice();
      let detail = boundary >= 0 ? segs.slice(boundary) : [];
      if (segs[0] === "documents") {
        modulePathSegs = ["documents"];
        detail = segs.slice(1);
      }
      if (!modulePathSegs.length) {
        this._isRestoring = false;
        return; // nothing recognizable to restore
      }

      const moduleSlug = modulePathSegs[modulePathSegs.length - 1]; // deepest (sub)module
      const parentSlug = modulePathSegs.length > 1 ? modulePathSegs[modulePathSegs.length - 2] : null;

      let parentField = parentSlug ? map[parentSlug] || null : null;
      if (!parentField) {
        if (parentSlug === "myprofile" || parentSlug === "my-profile") parentField = "My Profile";
        else if (parentSlug === "admin") parentField = this.isFacilityAdmin ? "Facility Admin" : "Admin";
        else if (parentSlug === "facility-admin") parentField = "Facility Admin";
      }
      const moduleField = map[moduleSlug] || this._resolveModuleField(moduleSlug, parentSlug);

      // Re-arm the deep-link guard so the replayed click keeps the record segment
      // (needed on Back/Forward after the initial snapshot is consumed).
      if (detail.length) {
        this._dlModule = modulePathSegs.join("/");
        this._dlSub = detail.join("/");
        this._dlConsumed = false;
      }

      this._replaySidebarClick(parentField, moduleField, moduleSlug);

      // record detail? drive the child's existing @api method
      const uid = detail[0] || "";
      const isCreate = CREATE_LIKE_SLUGS.has(uid);
      const adapter = moduleField ? RECORD_ADAPTERS[moduleField] : null;
      let restoreTimeout = 500;

      if (adapter && (uid || isCreate)) {
        const tab = detail.slice(1).join("/");
        const isEdit = detail.includes("edit");
        // wait for the module's child to render after the replayed click
        setTimeout(() => {
          try {
            const cmp = this.template.querySelector(adapter.selector);
            if (!cmp) return;
            if (isCreate && typeof adapter.create === "function") {
              adapter.create(cmp, detail[1] || "");
            } else if (!isCreate && typeof adapter.open === "function") {
              adapter.open(cmp, uid, tab, isEdit);
            }
          } finally {
            this._isRestoring = false;
            this._dlConsumed = true;
          }
        }, 400);
        restoreTimeout = null;
      }

      // adopt canonical slug state, then upgrade the URL in place
      this._routeModule = modulePathSegs.join("/");
      this._routeSubView = detail.join("/");
      this._replaceHashCanonical();

      if (restoreTimeout !== null) {
        setTimeout(() => {
          this._isRestoring = false;
          this._dlConsumed = true;
        }, restoreTimeout);
      }
    } catch (e) {
      this._isRestoring = false;
      throw e;
    }
  }

  /* ------------------------------------------------------------------
   * Staff / module access
   * ---------------------------------------------------------------- */

  fetchStaffDetails() {
    getStaffEmailAndModules({ userId: Id })
      .then((result) => {
        if (result.error) {
          console.error("Error fetching staff details:", result.error);
          return;
        }
        this.staffEmail = result.staffEmail || "No email found";
        this.modules =
          result.modules && typeof result.modules === "string" ? result.modules.split(";") : [];
        this.setModuleFlags();
        this.restoreActiveModule();
      })
      .catch((error) => console.error("Error in fetchStaffDetails:", error));
  }
  

  setModuleFlags() {
    this.tSignModule = this.modules.includes("T Sign");
    this.flodersModule = this.modules.includes("Folders");
    this.myOrgModule = this.modules.includes("My Organisation");
    this.myProfileModule = this.modules.includes("My Profile");
    this.templatesModules = this.modules.includes("Templates");
    this.contactsModule = this.modules.includes("Contact");
    this.reportsModule = this.modules.includes("Reports");
  }

  // Plain "/s/" (no hash) falls back to the last module cached in sessionStorage.
  restoreActiveModule() {
    // URL is the source of truth: when the hash has a route, restoreFromUrl() drives it.
    if (this.getRouteFromHash()) return;
    if (this.stripeModuleOpened) return;

    const mainModule = sessionStorage.getItem("activeModule");
    const subModule = sessionStorage.getItem("activeContent");

    setTimeout(() => {
      const mainElement = this.template.querySelector(menu(mainModule));
      if (mainElement) {
        mainElement.click();
        if (subModule) {
          setTimeout(() => {
            const subElement = this.template.querySelector(subMenu(subModule));
            if (subElement) subElement.click();
            else console.warn(`Could not find submenu: ${subModule}`);
          }, 300); // wait for the main menu to expand
        }
      } else {
        this.template.querySelector(menu("Dashboard"))?.click();
      }
    }, 300);
  }

  redirectToDashboard() {
    this.resetFlags();
    this.setActiveMenu("dashboard");
    this.updateBreadcrumb("Dashboard");
    this.isFacilityDropdownDisabled = false;
  }

  setActiveMenu(menuName) {
    this.template
      .querySelectorAll(".menu-link, .subcat a")
      .forEach((link) => link.classList.remove("active"));

    this.template.querySelector(`[data-content="${menuName}"]`)?.classList.add("active");
    this.template.querySelector(`.subcat a[data-content="${menuName}"]`)?.classList.add("active");
  }

  // Drop the highlight from any submenu item (so a parent click doesn't keep a stale sub-tab active).
  clearActiveSubmenus() {
    this.template.querySelectorAll(".subcat a.active").forEach((l) => l.classList.remove("active"));
    this.activeSubmenu = "";
  }

  /* ------------------------------------------------------------------
   * Flag resets
   * ---------------------------------------------------------------- */

  // All module + menu flags off (no staffid / hr changes).
  modulewisedisplaying() {
    [...MODULE_FLAGS, ...MENU_FLAGS].forEach((f) => {
      this[f] = false;
    });
  }

  resetFlags() {
    this.staffid = "";
    this.hrflag = false;
    this.modulewisedisplaying();
  }

  // Unmount then remount in the next tick so the child reloads.
  resetAndActivate(flagName) {
    this[flagName] = false;
    setTimeout(() => {
      this[flagName] = true;
    }, 0);
  }

  // set flag true; remount when `retrigger` or when the module's `resetKey` switch is on
  _activateFlag(flag, retrigger, resetKey) {
    if (retrigger || (resetKey && this[resetKey])) this.resetAndActivate(flag);
    else this[flag] = true;
  }

  /* ------------------------------------------------------------------
   * Sidebar clicks
   * ---------------------------------------------------------------- */

  handleMenuClick(event) {
    const links = this.template.querySelectorAll(".menu-link");
    links.forEach((l) => l.classList.remove("active"));
    this.clearActiveSubmenus(); // parent clicked -> drop sub-tab highlight

    let clicked = event?.target?.closest?.(".menu-link") || null;
    if (!clicked && event?.target?.dataset?.field) {
      clicked = Array.from(links).find(
        (l) => l.dataset.field?.toLowerCase() === event.target.dataset.field.toLowerCase()
      );
    }
    if (clicked) {
      clicked.classList.add("active");
      this.activeMenu = clicked.dataset.field || "";
    }
  }

  handleSubmenuClick(event) {
    const links = this.template.querySelectorAll(".subcat a");
    links.forEach((l) => l.classList.remove("active"));

    let clicked = event?.target?.closest?.("a");
    if (!clicked && event?.target?.dataset?.field) {
      clicked = Array.from(links).find(
        (l) => l.dataset.field?.toLowerCase() === event.target.dataset.field.toLowerCase()
      );
    }
    if (clicked) {
      clicked.classList.add("active");
      this.activeSubmenu = clicked.dataset.field || clicked.textContent.trim();
    } else {
      // LMS-triggered click: DOM link may not exist
      this.activeSubmenu = event?.target?.dataset?.field || "Unknown";
    }
  }

  // Clicking an expanded parent collapses it and shows the parent landing view.
  _returnToParent(moduleName) {
    const cfg = PARENT_RETURN[moduleName];
    if (!cfg || !this[cfg.menu]) return false;

    this[cfg.menu] = false;
    cfg.off.forEach((f) => {
      this[f] = false;
    });
    this._activateFlag(cfg.on, cfg.retrigger, cfg.reset);
    this.clearActiveSubmenus();
    this.updateBreadcrumb(cfg.crumb);
    return true;
  }

  _applyRoute(route, event) {
    if (route.menu) this[route.menu] = true;
    (route.off || []).forEach((f) => {
      this[f] = false;
    });
    if (route.flag) this._activateFlag(route.flag, route.retrigger, route.reset);
    if (route.collapseSidebar) this.isSidebarExpanded = false;

    if (route.sub) this.handleSubmenuClick(event);
    else this.handleMenuClick(event);

    if (route.crumb) {
      const names = {
        "@facility": this.facilityPrefreedName,
        "@participant": this.participantPrefreedName
      };
      this.updateBreadcrumb(...route.crumb.map((c) => (c in names ? names[c] : c)));
    }
  }

  handleModuleClick(event) {
    this.tsignreUrl = "";

    // staffid survives only when we arrived from a task / notification
    if (!this.isTaskNavigation) this.staffid = "";
    else this.isTaskNavigation = false;

    const moduleName = event.currentTarget.dataset.field;
    const selectedContent = event.currentTarget.dataset.content;

    if (this.stripeModuleOpened && moduleName) {
      const isSub = selectedContent && selectedContent !== moduleName;
      sessionStorage.setItem("activeModule", isSub ? selectedContent : moduleName);
      sessionStorage.setItem("activeContent", isSub ? moduleName : "");
      sessionStorage.removeItem("lastClickedModule");
      console.log("TSign dashboard - first module click after Stripe, reloading into " + moduleName);
      window.location.replace(window.location.pathname);   // no ?stripe, no #hash - restoreActiveModule opens it
      return;
    }
    // pick up a changed default signature when T sign is opened again
    if (moduleName === "T sign") this._loadGreeting();

    if (this.isStartPlanUser && (moduleName === "T sign" || moduleName === "Smart Reports")) {
      this.showUpgradeModal = true;
      return;
    }

    if (this.tSignflag && moduleName !== "T sign" && moduleName !== "Document") {
      this.resetTsignContext(); // leaving T sign
    }

    // leave-request task id survives only for the Leave Management module
    if (moduleName !== "Leave Management" && !this.openFromTask) this.taskLeaveId = null;

    this.isFacilityDropdownDisabled = NON_FACILITY_MODULES.has(moduleName);

    // ---- remember where we are (sessionStorage) ----
    const isSubmenu = selectedContent && selectedContent !== moduleName;
    sessionStorage.setItem("activeModule", isSubmenu ? selectedContent : moduleName);
    sessionStorage.setItem("activeContent", isSubmenu ? moduleName : "");

    const mainModule = isSubmenu ? selectedContent : moduleName;
    const subModule = isSubmenu ? moduleName : "";
    const navMap = JSON.parse(sessionStorage.getItem("moduleNavMap")) || {};
    const lastClickedModule = sessionStorage.getItem("lastClickedModule");

    if (subModule) {
      if (sessionStorage.getItem("lastClickedSubmodule") === subModule) {
        // same submodule clicked again explicitly -> clear its stored state
        if (!this.isAutoOpeningSubmodule) {
          this.clearSubmoduleStorage(subModule);
          localStorage.removeItem("lastClickedSubmodule");
        }
      } else {
        sessionStorage.setItem("lastClickedSubmodule", subModule);
      }
      navMap[mainModule] = subModule;
    } else if (lastClickedModule === mainModule) {
      // same main module clicked twice -> reset
      if (mainModule === "Roster Manager" && navMap[mainModule] === "Roster Manager") {
        localStorage.removeItem("selectedRosterView");
      }
      this.clearMainModuleStorage(mainModule);
      navMap[mainModule] = mainModule;
    } else {
      // different module: keep the submenu it had, auto-open it
      if (!navMap[mainModule]) navMap[mainModule] = mainModule;
      const savedSub = navMap[mainModule];
      if (savedSub && savedSub !== mainModule && !this._isRestoring) {
        this.navigateToSubModule(mainModule);
      }
    }
    sessionStorage.setItem("moduleNavMap", JSON.stringify(navMap));
    sessionStorage.setItem("lastClickedModule", mainModule);

    // ---- reflect in the URL ----
    this.updateUrlForModule(moduleName, selectedContent);
    this.dashboardActiveFlag = moduleName;

    // ---- expanded parent clicked again -> collapse + landing view ----
    if (this._returnToParent(moduleName)) return;

    // ---- open the clicked module ----
    this.modulewisedisplaying();
    const route = MODULE_ROUTES[moduleName];
    if (route) this._applyRoute(route, event);

    // ---- cleanup ----
    if (this.participantFlag === false) {
      this.riskIndexDetailsFromChild = {};
      this.participantdetails = {};
    }
    this.isStaffView = false;

    if (this.staffidflag === "Staff Document Expiry" && this.staffid !== "") {
      this.staffidflag = "TEMP";
    }
    if (
      this.Adminflag &&
      this.staffflag &&
      this.staffidflag !== "Staff Document Expiry" &&
      this.staffidflag !== "TEMP"
    ) {
      this.staffid = "";
    }
  }

  navigateToSubModule(mainModule) {
    const navMap = JSON.parse(sessionStorage.getItem("moduleNavMap")) || {};
    const storedSub = navMap[mainModule];
    if (!storedSub) return;

    this.isAutoOpeningSubmodule = true;
    setTimeout(() => {
      const subElement = this.template.querySelector(subMenu(storedSub));
      if (subElement) subElement.click();
      else console.warn(`Submodule '${storedSub}' not found under '${mainModule}'`);
      setTimeout(() => {
        this.isAutoOpeningSubmodule = false;
      }, 500);
    }, 300);
  }

  clearSubmoduleStorage(subModule) {
    switch (subModule) {
      case "Facility":
        localStorage.removeItem("facilityRecordId");
        localStorage.removeItem("activeFacilityTab");
        break;
      case "Staff":
        localStorage.removeItem("adminStaffRecordId");
        localStorage.removeItem("activeAdminStaffTab");
        break;
      case "Participant":
        localStorage.removeItem("adminClientRecordId");
        localStorage.removeItem("activeAdminClientTab");
        break;
      case "Timesheet":
        this.resetTimesheetSubModuleFlag = true;
        ["timesheetViewFlag", "timesheetStaffId", "timesheetStaffName", "timesheetIsChecked"].forEach(
          (key) => localStorage.removeItem(key)
        );
        break;
      case "Leave Management":
        this.resetHrLeaveSubModuleFlag = true;
        break;
      case "RejectedShift":
        this.resetRosterRejectedSubFlag = true;
        localStorage.removeItem("rosterRejectedShiftTab");
        break;
      default:
        break;
    }
  }

  clearMainModuleStorage(mainModule) {
    switch (mainModule) {
      case "Human Resources":
        localStorage.removeItem("hrStaffRecordId");
        this.resetHrModuleStaffFlag = true;
        break;
      case "Participants":
        localStorage.removeItem("clientRecordId");
        this.resetParticipantModuleFlag = true;
        break;
      case "Roster Manager":
        this.resetRosterModuleFlag = true;
        break;
      case "Incident Register":
        this.resetIncidentModuleFlag = true;
        break;
      default:
        break;
    }
  }

  handleOpenModuleFromDashboard(evt) {
    const { field, content } = evt.detail || {};
    this.handleModuleClick(this._fakeEvent(field, content));
  }

  handleClearStaffId() {
    this.staffid = "";
  }

  handleLeaveTaskConsumed() {
    this.taskLeaveId = null;
    this.openFromTask = false;
  }

  handleOpenForms() {
    this.resetFlags();
    this.formsflag = true;
    this.updateBreadcrumb("Forms");
    this.isFacilityDropdownDisabled = true;
    this.setActiveMenu("Participants");
  }

  handleBackFromForms() {
    this.resetFlags();
    this.participantFlag = true;
    this.updateBreadcrumb("Participants");
    this.setActiveMenu("Participants");
    this.isFacilityDropdownDisabled = false;
  }

  handleNaviagteToRiskManagement(event) {
    localStorage.removeItem("clientRecordId");
    localStorage.removeItem("activeClientTab");
    this.resetParticipantModuleFlag = false;
    localStorage.setItem("clientRecordId", event.detail.participantId);
    this.modulewisedisplaying();
    this.riskIndexDetailsFromChild = {};

    setTimeout(() => {
      this.riskIndexDetailsFromChild = event.detail;
      this.participantFlag = true;
      this.template.querySelector(menu("Participants"))?.dispatchEvent(new Event("click"));
    });
  }

  /* ------------------------------------------------------------------
   * Dashboard widgets / LMS redirects
   * ---------------------------------------------------------------- */

  _openFundsTracker(data = {}) {
    this.modulewisedisplaying();
    this.participantFlag = true;
    this.navigatedParticipantId = data.participantId || "";
    this.navigatedRecordId = data.recordId || "";
    this.navigatedAction = "fundsTracker";
    this.simulateClick(menu("Participants"));
  }

  handleDashboardevent(event) {
    this.modulewisedisplaying();
    const name = event.detail.message;

    if (name === "Funds Tracker") {
      this._openFundsTracker(event.detail.data);
      return;
    }

    const cfg = DASHBOARD_EVENTS[name];
    if (!cfg) {
      this.isStaffView = false;
      return;
    }
    if (cfg.flag) this[cfg.flag] = true;
    if (cfg.staffView) this.isStaffView = true;
    cfg.clicks.forEach((selector) => this.simulateClick(selector));
  }

  handleRedirectMessage(message) {
    let target = message?.target || message?.taskType;
    if (!target) return;

    if (message?.target === "Funds Tracker") {
      this._openFundsTracker(message.data);
      return;
    }
    if (message?.target === "StaffStatusDetail") {
      this.openStaffStatusModal(message.data);
      return;
    }

    // normalize casing: capitalize first letter of each word
    target = target
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const parent = SUBMODULE_PARENT[target] || "";

    // 1) open parent
    if (parent) this.handleModuleClick(this._fakeEvent(parent));

    // 2) open submodule once the menu state has updated
    setTimeout(() => {
      this.handleModuleClick(this._fakeEvent(target, parent));

      if (message?.childComponent === "RosterCreation" && message?.action === "navigateToRejectedShifts") {
        // wait for the roster component to render
        setTimeout(() => {
          const rosterCmp = this.template.querySelector("c-tesseract-apps-roster-creation");
          if (rosterCmp) rosterCmp.openRejectedShiftsFromNotification();
          else console.error("Roster component not found");
        }, 700);
      }
    }, 100);
  }

  handleBotAction(payload) {
    try {
      const { action, name, targetStatus } = payload || {};

      if (action === "change_staff_status") {
        this.navigateToHumanResources();
        // picked up in renderedCallback once the staff component exists
        this._pendingBotTask = {
          type: "change_staff_status",
          name: (name || "").trim(),
          targetStatus // true = activate, false = deactivate
        };
        this.showToast(
          "Bot Task",
          `Opening Human Resources and ${targetStatus ? "activating" : "deactivating"} ${name || "the user"}…`,
          "info"
        );
      }

      if (action === "reset_to_sidebar") {
        this.dashboardflag = false;
        this.hrflag = false;
        this.isHrMenuVisible = false;
        this.hrstaffflag = false;
        this.chatterFlag = true;
      }
    } catch (e) {
      console.error("handleBotAction error", e);
    }
  }

  navigateToHumanResources() {
    this.dashboardflag = false;
    this.hrflag = true;
    this.isHrMenuVisible = true;
    this.hrstaffflag = true;
  }

  
  handleTaskEdit(event) {
    this.modulewisedisplaying();
    const { taskType, whatId, taskId } = event.detail;

    switch (taskType) {
      case "Approval Request":
        this._goToHash("/roster-manager/reimbursement/approvals");
        break;
      case "Incident Register":
        this._goToHash(whatId ? `/incident-register/${whatId}` : "/incident-register");
        break;
      case "Enable Sign out for Shift":
        this.simulateClick(menu("Dashboard"));
     
        break;
      case "Enable Sign in for Shift":
        this.simulateClick(menu("Dashboard"));
   
        break;
      case "Bank Details Request":
      //  this._openBankDetailsRequest(taskId);
        break;
      case "Staff Document Expiry":
        this.isTaskNavigation = true;
        this.staffid = whatId;
        this._goToHash(whatId ? `/admin/staff/${whatId}` : "/admin/staff");
        break;
      case "Leave Request":
        this.taskLeaveId = whatId;
        this.openFromTask = true;
        this._goToHash(
          whatId ? `/human-resources/leave-management/${whatId}` : "/human-resources/leave-management"
        );
        break;
      case "Funds Tracker":
        this._goToHash(whatId ? `/participants/${whatId}/funds-tracker` : "/participants");
        break;
      default:
        break;
    }
  }



  /* ------------------------------------------------------------------
   * Staff status modal
   * ---------------------------------------------------------------- */

  openStaffStatusModal(data) {
    this.staffStatusLabel = data.statusLabel;
    this.staffStatusKey = data.statusKey;
    this.staffStatusLoading = true;
    this.isLoading = true;
    this.staffSearchKey = "";
    this.staffStatusList = [];
    this.allStaffStatusList = [];

    const isSignIn = SIGN_IN_STATUSES.includes(data.statusKey);
    const isLeave = LEAVE_STATUSES.includes(data.statusKey);

    let fetchPromise;
    if (isSignIn) {
      fetchPromise = getSignInStaffDetails({
        status: data.statusKey,
        facilityId: data.facilityId,
        filterStartDate: data.startDate,
        filterEndDate: data.endDate,
        dateRange: data.dateRange
      });
    } else if (isLeave) {
      fetchPromise = getLeaveStaffDetails({
        userId: Id,
        status: data.statusKey,
        facilityId: data.facilityId
      });
    } else {
      fetchPromise = getStaffDetailsByStatus({ status: data.statusKey, facilityId: data.facilityId });
    }

    fetchPromise
      .then((result) => {
        const list =
          isSignIn || isLeave
            ? result
            : result.map((staff) => ({
                ...staff,
                documents: (staff.documents || []).map((doc) => ({
                  ...doc,
                  expiryDate: doc.Expiry_Date__c ? doc.Expiry_Date__c.split("-").reverse().join("/") : ""
                }))
              }));
        this.staffStatusList = list;
        this.allStaffStatusList = [...list];
      })
      .catch((error) => console.error("Error:", error))
      .finally(() => {
        this.showStaffStatusModal = true;
        this.staffStatusLoading = false;
        this.isLoading = false;
      });
  }

  closeStaffStatusModal() {
    this.showStaffStatusModal = false;
    this.staffSearchKey = "";
    this.staffStatusList = [...this.allStaffStatusList];
  }

  handleStaffSearch(event) {
    this.staffSearchKey = event.target.value;
    const key = (this.staffSearchKey || "").trim().toLowerCase();

    if (!key) {
      this.staffStatusList = JSON.parse(JSON.stringify(this.allStaffStatusList));
      return;
    }

    const has = (value) => (value || "").toLowerCase().includes(key);

    if (this.isDocsExpiryStatus) {
      this.staffStatusList = this.allStaffStatusList
        .map((staff) => {
          // staff field matched -> keep all documents
          if (has(staff.name) || has(staff.email) || has(staff.roleNames) || has(staff.contactNumber)) {
            return { ...staff, documents: [...(staff.documents || [])] };
          }
          // otherwise keep only matching documents
          const documents = (staff.documents || []).filter(
            (doc) => has(doc.Document_Type__c) || has(doc.File_Name__c)
          );
          return documents.length ? { ...staff, documents } : null;
        })
        .filter(Boolean);
      return;
    }

    this.staffStatusList = this.allStaffStatusList.filter(
      (staff) =>
        has(staff.name) ||
        has(staff.email) ||
        has(staff.roleNames) ||
        has(staff.shiftType) ||
        has(staff.contactNumber) ||
        has(staff.leaveType)
    );
  }

  /* ------------------------------------------------------------------
   * Notifications
   * ---------------------------------------------------------------- */

  loadNotificationCount() {
    getUserNotificationscount()
      .then((result) => {
        this.notificationCount = result;
      })
      .catch((error) => console.error("Error fetching notification count:", error));
  }

  fetchNotifications(event) {
    event.stopPropagation();

    // opening: close every other dropdown first
    if (!this.showNotifications) window.dispatchEvent(new CustomEvent("closedropdowns"));

    this.showNotifications = !this.showNotifications;
    this.isOpen = false; // close facility dropdown

    if (this.showNotifications) this.getUserNotifications();
  }

  getUserNotifications() {
    this.isLoading = false;

    fetchUserNotifications()
      .then((result) => {
        this.allNotifications = result.map((notif, index) => {
          const createdDate = new Date(notif.CreatedDate);
          return {
            value: notif.Id,
            label: notif.Subject__c,
            description: notif.Description__c,
            recordId: notif.Record_Id__c || "",
            clientId: notif.Participant_Id__c || "",
            staffId: notif.Staff_Id__c || "",
            createdDate: createdDate.toLocaleString(),
            timestamp: timeAgo(createdDate),
            checknotifications: notif.Mark_as_read_notifications__c,
            index
          };
        });
        this.notificationSearchTerm = "";
        this.filterednotification = this.allNotifications;
        this.error = null;
      })
      .catch((error) => {
        console.error("Error fetching notifications:", error);
        this.error = "Error loading notifications";
        this.filterednotification = [];
        this.showNotifications = false;
      });
  }

  handleNotificationSearch(event) {
    // keep the raw typed value (spaces intact) for the input binding
    const raw = event.target.value || "";
    this.notificationSearchTerm = raw;
    const term = raw.toLowerCase().trim();

    if (!this.allNotifications) this.allNotifications = this.filterednotification || [];

    this.filterednotification = !term
      ? this.allNotifications
      : this.allNotifications.filter(
          (n) =>
            (n.label || "").toLowerCase().includes(term) ||
            (n.description || "").toLowerCase().includes(term)
        );
  }

  _markNotificationRead(notificationId) {
    markNotificationAsRead({ notificationIds: [notificationId] })
      .then(() => {
        this.showNotifications = false;
        setTimeout(() => {
          this.getUserNotifications();
          this.loadNotificationCount();
        }, 100);
      })
      .catch((error) => console.error("Error marking notification as read:", error));
  }

  handleMarkAllAsRead(event) {
    event.preventDefault();

    const notificationIds = this.filterednotification
      .filter((n) => n.checknotifications === false)
      .map((n) => n.value);
    if (notificationIds.length === 0) return;

    markNotificationAsRead({ notificationIds })
      .then(() => {
        this.filterednotification = this.filterednotification.map((n) =>
          notificationIds.includes(n.value) ? { ...n, checknotifications: true } : n
        );
        setTimeout(() => {
          this.getUserNotifications();
          this.loadNotificationCount();
        }, 100);
      })
      .catch((error) => console.error("Error marking notifications as read:", error));
  }

  handleNavigation(event) {
    const d = event.currentTarget.dataset;
    const notification = d.name;
    const notificationId = d.id;
    const recordId = d.recordId;
    const description = d.description;
    const clientId = d.clientId;
    const isRead = d.notificationread === "true";

    // informational only: mark read, don't navigate
    if (
      NO_NAVIGATION_NOTIFICATIONS.has(notification) ||
      (notification || "").includes("Fund Usage Alert")
    ) {
      if (!isRead) this._markNotificationRead(notificationId);
      return;
    }

    this.modulewisedisplaying();

    const route = NOTIFICATION_ROUTES[notification];
    if (route) {
      this[route.flag] = true;
      if (route.staffView) this.isStaffView = true;
      if (route.bell) this.bellNotification = true;
      if (route.participant) this.navigatedParticipantId = clientId || "";
      route.clicks.forEach((selector) => this.simulateClick(selector));
    } else if (notification === "New Document is uploaded." || notification === "Document is updated") {
      this._openStaffDocument(recordId);
    } else if (notification === "Late Sign out request" || notification === "Late Sign in request") {
      this.simulateClick(menu("Dashboard"));
     
    } else if (CORRECTIVE_ACTION_NOTIFICATIONS.has(notification)) {
    
    } else if (INCIDENT_NOTIFICATIONS.has(notification)) {
     
    } else {
      this.simulateClick(menu("T sign"));
      this.tSignflag = true;
    }

    if (!isRead) this._markNotificationRead(notificationId);
  }

  _openStaffDocument(staffRecordId) {
    this.isTaskNavigation = true;
    this.staffidflag = "Staff Document Expiry";
    this.isAdminMenuVisible = true;
    this.staffflag = true;
    this.simulateClick(menu("Facility Admin"));
    this.simulateClick(subMenu("Facility Staff"));

    const child = this.template.querySelector("c-staff-data-community");
    if (child) child.openCreateEditStaff(staffRecordId);
    this.staffid = staffRecordId;
  }

  _openIncidentChild(key, tab, isEdit) {
    const cmp = this.template.querySelector("c-form-incident-v2");
    if (cmp && typeof cmp.openByUID === "function") cmp.openByUID(key, tab, isEdit);
  }

  _showIncidentRegister() {
    this.modulewisedisplaying();
    this.incidentFlag = true;
    this.simulateClick(menu("Incident Register"));
  }

 


  /* ------------------------------------------------------------------
   * Logout
   * ---------------------------------------------------------------- */

  handleLogoutClick() {
    this.showLogoutDialog = true;
  }

  handleCancel() {
    this.showLogoutDialog = false;
  }

  handleConfirm() {
    // keep "remember me" + last facility across the storage wipe
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    const facilityId = localStorage.getItem("defaultFacilityId");

    localStorage.clear();
    sessionStorage.clear();

    if (facilityId) localStorage.setItem("defaultFacilityId", facilityId);
    if (rememberedEmail) localStorage.setItem("rememberedEmail", rememberedEmail);

    window.location.assign("/secur/logout.jsp");
  }

  openModuleAfterStripe() {
    const stripeStatus = new URLSearchParams(window.location.search).get('stripe');
    //if (this.stripeModuleOpened || (stripeStatus !== 'success' && stripeStatus !== 'cancel')) {
    if (this.stripeModuleOpened || !['success', 'cancel', 'updated'].includes(stripeStatus)) {
      return;
    }
    this.stripeModuleOpened = true;  
    this.stripeReturnPending = true; 
    // const stripeModule = this.isIndividualAccount ? 'My Profile' : 'My Organisation';
    // console.log('TSign dashboard - back from Stripe (' + stripeStatus + ') | opening ' + stripeModule);
    // setTimeout(() => {
    //   this.handleModuleClick(this._fakeEvent(stripeModule, stripeModule));
    // }, 800);
    console.log('TSign dashboard - back from Stripe (' + stripeStatus + ') | opening subscription');
    // org details (email / customer / org id) must be loaded before the subscription screen opens
    (this.planBannerPromise || this.loadPlanBanner()).then(() => {
      setTimeout(() => this.openSubscriptionPanel(), 800);
    });
  }
  // ---------------------------------------------------------------- Header days remaining + subscription screen

  // org = TSign_Organisation__c from orgDetails (null when not found)
  setPlanDetails(org) {
    this.showPlanBanner = !!org;
    this.subscriberEmail = org?.Email__c || "";
    this.stripeCustomerId = org?.Stripe_Customer_ID__c || "";
    this.subscriptionOrgId = org?.Id || "";

    //const active = org?.Active__c === true;
    const trial = org?.Trial_Period__c === true;
    const cancelled = org?.Is_Cancelled__c === true;
    //const days = this.daysUntil(org?.Plan_End_Date__c);
    const active = org?.hasActiveSubscription === true;
    const days = org?.daysRemaining != null ? Number(org.daysRemaining) : null;

    // this.planExpired = !!org && days !== null && days < 0;
    // paid plan cancelled: still valid up to and including the end date
    // trial cancelled: Active__c is false at once - ended now, popup on the same day
    const endDatePassed = days !== null && days < 0;
    const endedNow = cancelled && !active;
    this.planExpired = !!org && (endDatePassed || endedNow);
    
    // if (!org) {
    //   this.planDaysText = "";
    // } else if (!active || this.planExpired) {
    //   this.planDaysText = trial && active ? "Trial ended" : "Plan ended";
    // } else if (days === null) {
    //   this.planDaysText = "";
    // } else {
    //   this.planDaysText = `${days} ${days === 1 ? "Day" : "Days"} Remaining`;
    // }
    // this.planActionLabel = active && !this.planExpired ? "Upgrade Now" : "Renew Now";
        // header: Free Trial + days + Upgrade | Individual + Upgrade | Business only | ended -> Renew Now
       // header: Free Trial + days + Upgrade Now | Individual + Upgrade | Business only | ended -> Renew Now
       // header: Free Trial + days + Upgrade | Individual + Upgrade | Business only | ended -> Renew Now
    const isBusiness = org?.Account_Type__c === "Organisation";
    if (!org) {
      this.planBadgeLabel = "";
      this.planDaysText = "";
      this.planActionLabel = "";
    } else if (!active || this.planExpired) {
      this.planBadgeLabel = "";
      this.planDaysText = trial ? "Trial ended" : "Plan ended";
      this.planActionLabel = "Renew Now";
    } else if (trial) {
      this.planBadgeLabel = "Free Trial";
      this.planDaysText = days === null ? "" : `${days} ${days === 1 ? "Day" : "Days"} Remaining`;
      this.planActionLabel = "Upgrade";
    } else if (isBusiness) {
      this.planBadgeLabel = "Business";
      this.planDaysText = "";
      this.planActionLabel = "";            // highest plan - nothing to upgrade to
    } else {
      this.planBadgeLabel = "Individual";
      this.planDaysText = "";
      this.planActionLabel = "Upgrade";
    }
    // popup text - TODO: final text from BA team
    if (this.planExpired && cancelled) {
      this.planExpiredTitle = "Your subscription has been cancelled";
      this.planExpiredMessage = "Your subscription was cancelled and has now ended. Renew your plan or start a new subscription to continue using T Sign.";
      this.planExpiredButtonLabel = "Renew Subscription";
    } else if (this.planExpired && trial) {
      this.planExpiredTitle = "Your free trial has ended";
      this.planExpiredMessage = "Your free trial period is over. Choose a plan to keep using T Sign - your documents and settings are kept safe.";
      this.planExpiredButtonLabel = "Choose a Plan";
    } else if (this.planExpired) {
      this.planExpiredTitle = "Your subscription has ended";
      this.planExpiredMessage = "Your subscription has expired. Renew your plan or start a new subscription to continue using T Sign.";
      this.planExpiredButtonLabel = "Renew Subscription";
    }

    console.log("TSign dashboard plan - start: " + org?.Plan_Start_Date__c + " | end: " + org?.Plan_End_Date__c
      + " | days: " + days + " | active: " + active + " | cancelled: " + cancelled + " | trial: " + trial
      //+ " | expired: " + this.planExpired + " | " + this.planDaysText + " | " + this.planActionLabel
      + " | expired: " + this.planExpired + " | " + this.planBadgeLabel + " | " + this.planDaysText + " | " + this.planActionLabel
      + " | email: " + this.subscriberEmail + " | org: " + this.subscriptionOrgId);
  }


  // "2026-11-04" -> days from today (null when there is no date)
  // daysUntil(dateValue) {
  //   if (!dateValue) {
  //     return null;
  //   }
  //   const [year, month, day] = String(dateValue).substring(0, 10).split("-").map(Number);
  //   const end = new Date(year, month - 1, day);
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);
  //   return Math.round((end - today) / 86400000);
  // }

  handleUpgradeNow(event) {
    event?.preventDefault?.();
    console.log("TSign dashboard - " + this.planActionLabel + " clicked");
    this.openSubscriptionPanel();
  }

  openSubscriptionPanel() {
    this.stripeReturnPending = false;
    if (!this.subscriberEmail) {
      console.log("TSign dashboard - no organisation email, subscription screen not opened");
      return;
    }
    this.modulewisedisplaying();   // close whatever module is open
    this.tsignSubscriptionFlag = true;
    this.setActiveMenu("");        // no sidebar item highlighted
    this.updateBreadcrumb("Subscription");
  }

  // popup shows while the plan is ended, except when the subscription screen is open (or about to open after Stripe)
  get showPlanExpiredPopup() {
    return this.planExpired && !this.tsignSubscriptionFlag && !this.stripeReturnPending;
  }

  // the popup's only button - same as Upgrade Now / Renew Now in the header
  handlePlanExpiredRenew() {
    console.log("TSign dashboard - plan ended popup: " + this.planExpiredButtonLabel + " clicked");
    this.openSubscriptionPanel();
  }

  // Back on the subscription screen - return to the module that was open before (popup returns if still ended)
  // handleSubscriptionClose() {
  //   const back = sessionStorage.getItem("activeModule") || "T sign";
  //   console.log("TSign dashboard - subscription closed, back to " + back);
  //   this.tsignSubscriptionFlag = false;
  //   this.handleModuleClick(this._fakeEvent(back, back));
  // }
    // Back on the subscription screen - return to the module that was open before, if it is in the menu; else T sign
  handleSubscriptionClose() {
    this.tsignSubscriptionFlag = false;
    if (this.planExpired) {
      console.log("TSign dashboard - subscription closed, plan still ended - popup shown again");
      return;   // no module behind - the popup comes back
    }
    // account type changed (Individual <-> Business) - reload into the matching module (same as a manual refresh)
    if (this.accountTypeChanged) {
      const module = this.isOrganisationAccount ? "My Organisation" : "My Profile";
      sessionStorage.setItem("activeModule", module);
      sessionStorage.setItem("activeContent", "");
      sessionStorage.removeItem("lastClickedModule");
      console.log("TSign dashboard - subscription closed after account type change, reloading into " + module);
      window.history.replaceState(null, "", window.location.pathname + "#/" + this._nameToSlug(module));
      window.location.reload();
      return;
    }
    const saved = sessionStorage.getItem("activeModule");
    const inMenu = !!saved && !!this.template.querySelector(menu(saved));
    const back = inMenu ? saved : "T sign";
    console.log("TSign dashboard - subscription closed | saved: " + saved + " | in menu: " + inMenu + " | opening " + back);
    this.handleModuleClick(this._fakeEvent(back, back));
  }

  // payment saved / trial stopped / cancelled / continued / renewed - fresh org data from Apex
  handleSubscriptionUpdated() {
    console.log("TSign dashboard - subscription updated, reloading org details");
    this._loadOrgDetails();
    this.refreshModules();
  }
    // Subscription upgrade saved a new account type - swap the menu and open the matching module
  handleAccountTypeChange(event) {
    const accountType = event.detail?.accountType;
    const isOrganisation = accountType === "Organisation";
    const isIndividual = accountType === "Individual";
    console.log("TSign dashboard - account type after upgrade: " + accountType
      + " | was Organisation: " + this.isOrganisationAccount);
    if ((!isOrganisation && !isIndividual) || isOrganisation === this.isOrganisationAccount) {
      return;   // unknown value or no change - stay where we are
    }
      const module = isOrganisation ? "My Organisation" : "My Profile";
    // reload straight into the new module - menu is rebuilt from the saved account type (same as a manual refresh)
    sessionStorage.setItem("activeModule", module);
    sessionStorage.setItem("activeContent", "");
    sessionStorage.removeItem("lastClickedModule");
    console.log("TSign dashboard - account type changed to " + accountType + ", reloading into " + module);
    window.history.replaceState(null, "", window.location.pathname + "#/" + this._nameToSlug(module));
    window.location.reload();
  }
    // module list again after a subscription change (Business upgrade adds My Organisation) - menu only, no navigation
  refreshModules() {
    return getStaffEmailAndModules({ userId: Id })
      .then((result) => {
        if (result.error) {
          console.error("Error refreshing modules:", result.error);
          return;
        }
        this.modules =
          result.modules && typeof result.modules === "string" ? result.modules.split(";") : [];
        this.setModuleFlags();
        console.log("TSign dashboard - modules refreshed: " + JSON.stringify(this.modules));
      })
      .catch((error) => console.error("Error refreshing modules:", error));
  }
}