import { LightningElement, track, wire, api } from "lwc";
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import getStaffByEmail from "@salesforce/apex/StaffController.getStaffByEmail";
import getStaffEmailAndModules from "@salesforce/apex/UserAccessController.getStaffEmailAndModules";
import Id from "@salesforce/user/Id";
import { getRecord } from "lightning/uiRecordApi";
import UserNameFld from "@salesforce/schema/User.Name";
import UserEmail from "@salesforce/schema/User.Email";
import UsrRoleName from "@salesforce/schema/User.User_Role__c";
import UserTypeOfUser from '@salesforce/schema/User.Type_of_User__c';
// import SideBarIcons from '@salesforce/resourceUrl/SideBar_Icons';
import UserTypeName from "@salesforce/schema/User.User_Type__c";
import ITSupport from "@salesforce/schema/User.IT_Support__c";
import TesseractLogo from "@salesforce/resourceUrl/TesseractLogo";
import CONFETTI from '@salesforce/resourceUrl/canvasConfetti';
import { loadScript } from 'lightning/platformResourceLoader';
import {
  subscribe,
  createMessageContext,
  MessageContext
} from "lightning/messageService";
// import {
//   subscribe as empSubscribe,
//   unsubscribe,
//   onError
// } from 'lightning/empApi';
import TSIGN_MESSAGE_CHANNEL from "@salesforce/messageChannel/TsignMessageChannel__c";
import Tlogo from "@salesforce/resourceUrl/Tlogo";
import Tdark from "@salesforce/resourceUrl/Tdark";
import FOOTER_MESSAGE_CHANNEL from "@salesforce/messageChannel/FooterMessageChannel__c";
import getClientById from "@salesforce/apex/ClientDataController.getClientByEmail";
import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";
import DASHBOARD_REDIRECT_CHANNEL from "@salesforce/messageChannel/DashboardRedirectMessageChannel__c";
import getCurrentLoggedUserInfo from "@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo";
import getFacilityCurrentUser from "@salesforce/apex/PortalUserController.getFacilityCurrentUser";
import getFacilityData from "@salesforce/apex/HrHomeHandler.fetchFacilitiessForDashboard";
import getstaffId from "@salesforce/apex/UserAccessController.getstaffId3";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import fetchUserNotifications from "@salesforce/apex/MyNotificationController.getUserNotifications";
import BOT_ACTION_CHANNEL from "@salesforce/messageChannel/BotActionMessageChannel__c";
import getAddShiftDataById from "@salesforce/apex/AddShiftController.getAddShiftDataById";
import updateShiftDetails from "@salesforce/apex/ShiftwithStaffController.updateShiftDetails";
import markNotificationAsRead from "@salesforce/apex/MyNotificationController.markNotificationAsRead";
import getUserNotificationscount from "@salesforce/apex/MyNotificationController.getUserNotificationscount";
import syncXeroEarningsRates from '@salesforce/apex/XeroIntegrationController.syncXeroEarningsRates';
//import CREATE_COMPANY_CHANNEL from '@salesforce/messageChannel/CreateCompanyMessageChannel__c';
import isStartPlan from '@salesforce/apex/LimitCheckService.isStartPlan';
import FACILITY_DATA_REFRESH_EVENT from '@salesforce/messageChannel/facilityDataRefreshEvent__c';

export default class TesseractAppsDashBoardLwc extends LightningElement {
  context = createMessageContext();
  @track tsignreUrl = "";
  @track serviceId = "";
  @track Adminflag = false;
  @track facilityflag = false;
  @track RosterManagementFlag = false;
  @track clientflag = false;
  @track staffflag = false;
  @track staffflag1 = false;
  @track rewardsFlag = false;
  @track hrflag = true;
  @track trainingFlag = false;
  @track leaveFlag = false;
  @track myTemplatesFlag = false;
  @track recruitmentFlag = false;
  @track addshiftFlag = false;
  @track shiftacceptFlag = false;
  @track attendenceFlag = false;
  @track rosterTimeSheet = false;
  @track submissionFlag = false;
  @track signButton = false;
  @track SignInFlag = false;
  @track participantFlag = false;
  @track payrollFlag = false;
  @track payrollexpenseFlag = false;
  @track payrollwagesFlag = false;
  @track payrollinvoiceFlag = false;
  @track payrollSettingsFlag = false;
  @track incidentFlag = false;
  @track repositoryFlag = false;
  @track smartReportsFlag = false;
  @track AccountingFlag = false;
  @track profileflag = false;
  @track awardFlag = false;
  @track profiletrainingFlag = false;
  @track profileleaveFlag = false;
  @track reportsFlag = false;
  @track MasterDBFlag = false;
  @track StaffAvailabilityFlag = {};
  @track participantdetails;
  isAdminMenuVisible = false;
  isHrMenuVisible = false;
  isRosterMenuVisible = false;
  isPayrollMenuVisible = false;
  isMyProfileMenuVisible = false;
  isUserManagementVisible = false;
  isAccountingMenuVisible = false;
  issupportcoordination = false;
  isTSignVisible = false;
  isPerformanceMenuVisible = false;
  isFormsVisible = false;
  supportCoordinatormoduleflag = false;
  @track masterFlag = false;
  @track ledgerEntryFlag = false;
  @track ledgerReportFlag = false;
  @track chartofAccountFlag = false;
  @track profitandlossFlag = false;
  @track balancesheetFlag = false;
  @track activityStatementFlag = false;
  @track dashboardflag = true;
  @track ticketflag = false;
  @track accessManagerflag = false;
  @track tSignflag = false;
  @track documentflag = false;
  @track performanceManagementflag = false;
  @track myProfilePerformanceFlag = false;
  @track libraryGoalflag = false;
  @track userAccessManagementflag = false;
  @track userStaffManagementflag = false;
  @track userResetPasswordflag = false;
  @track userStaffReportflag = false;
  @track Icttimesheetflag = false;
  @track formsflag = false;
  @track manageformsflag = false;
  @track hrstaffflag = false;
  @track isFacilityAdmin = false;
  @track isFacilityDropdownDisabled = false;
  @track isSupportCoordinator = false;
  @track supportCoordUserModule = false;

  @track Orgid;
  @track StaffId;
  @track superiors;
  @track currentUserEmail;
  @track currentUser;
  @track currentUserRole;
  @track currentUserType;
  @track clientData = [];
  @track orgname;
  @track orgfullname;
  @track orglogo;
  @track activeMenu = "";
  @track activeSubmenu = "";
  @track modules = [];

  @track adminModule = false;
  @track HrModule = false;
  @track RosterManagementModule = false;
  @track SignInModule = false;
  @track ParticipantsModule = false;
  @track PayrollModule = false;
  @track AccountingModule = false;
  @track XeroModule = false;
  @track MyobModule = false;
  @track QuickBooksModule = false;
  @track IncidentRegisterModule = false;
  @track RepositoryModule = false;
  @track SmartReports = false;
  @track MyProfileModule = false;
  @track PerformanceManagementModule = false;
  @track AccessManagerModule = false;
  @track TSignModule = false;
  @track TSupportModule = false;
  @track RosterManagementforStaffModule = false;
  @track ICTModule = false;
  @track FormsModule = false;
  @track DashboardModule = false;
  @track TlearnerModule = false;
  @track TlearnerFlag = false;
  @track CMSFlag = false;
  @track XeroFlag = false;
  @track MyobFlag = false;
  @track QuickBooksFlag = false;
  @track Tsmart = false;
  @track NdisFlag = false;
  @track ictstaff = false;
  @track blNDISUser = false;
  @track isLibraryGoal = false;
  @track accountingProfitAndLossFlag = false;
  @track accountingBalanceSheetFlag = false;
  @track accountingReportsFlag = false;
  @track ReconcilationReportsFlag = false;
  @track ndisPayrollFlag = false;
  @track ndisPayrollinvoiceFlag = false;
  @track ndisPayrollexpenseFlag = false;
  @track ndisPayrollwagesFlag = false;
  @track ndisBankFeedFlag = false;
  @track ndisPayrollSettingsFlag = false;
  @track riskIndexDetailsFromChild = {};
  @track myProfile = true;
  @track contactUsTicketFlag = false;
  @track selectedCompanyId;
  @track isTaskNavigation = false;
  @track participantLoginFlag = false;
  @track RejectedFlag = false;
  @track RejectedReportsFlag = false;
  @track ChatModule = true;
  @track state;
  @track Orgabn;
  @track typeofuser = false;
  @track staffId = null; // add this at the top
  @track facilityOptions = [];
  @track finalListFacilities = [];
  @track allFacilities = [];
  @track facilitySearchKey = '';
  @track facilityValue;
  @track facilityLabel;
  @track isOpen = false;
  @track selectedFacilityValue = "";
  @track selectedFacility = null;
  @track facilityPrefreedName;
  @track participantPrefreedName;
  @track staffPrefreedName;
  @track hideFacilityForIct = false;
  @track notifications = [];
  @track error;
  @track isLoading = false;
  @track filterednotification = [];
  @track showNotifications = false;
  @track displayName;
  @track notificationCount = 0;
  @track items = [];
  @track accountingServices;
  @track ManageInvoiceFlag = false;
  @track supportCoordinator = false;
  @track supportCoordinatorflag = false;
  @track supportParticipantflag = false;
  @track supportTaskflag = false;
  @track supportGoalsflag = false;
  @track supportProvidersflag = false;
  @track supportNotesflag = false;
  @track supportBillingflag = false;
  @track supportReportsflag = false;
  boundHandleOutsideClick;
  @track navigatedParticipantId;
  @track navigatedRecordId;      // ← manendra
  @track navigatedAction;   //manendra
  @track ndisQuoteToolFlag = false;

  @track showLogoutDialog = false;
  @track openFromTask = false;

  @track releaseNotes = false;

  @track isStartPlanUser = false;
  @track showUpgradeModal = false;

  facilityRefreshSubscription

  closeUpgradeModal() {
    this.showUpgradeModal = false;
  }
  get logoUrl12() {
    return TesseractLogo;
  }

  _restored = false;
  @track isLoading = false;

  @wire(MessageContext)
  messageContext;

  subscription;

  tLogoUrl = `${Loading_Logo}/TLogo.png`;
  tImageUrl = `${Loading_Logo}/T.png`;

  get logoUrl() {
    return this.tLogoUrl;
  }

  get imageUrl() {
    return this.tImageUrl;
  }
  channelName = "/data/My_Notification__cChangeEvent";
  cdcSubscription;
  // notificationChannel = '/event/Publish_Notification__e';
  // notificationSubscription;

  @track supportcoordinatorNDisflag = false;


  async connectedCallback() {

    try {
        this.isStartPlanUser = await isStartPlan();
        console.log('🔍 Plan check (Dashboard):', this.isStartPlanUser);
    } catch (e) {
        console.error('Plan check failed', e);
    }
    //console.log = function () {};
    // Get logged-in user info
    const userData = await getCurrentLoggedUserInfo();
    console.log("user data Enable_Logs__c ==>", JSON.stringify(userData));
    if (userData?.User_Type__c === 'Support Coordinator') {
        this.isSupportCoordinator = true;
        this.supportCoordinator = true;
    } else if (userData?.SC__c === true){
      this.supportcoordinatorNDisflag = true;
      this.supportCoordUserModule = true;
      this.supportCoordinator = true;
    }

    console.log('Is Support Coordinator:', this.isSupportCoordinator);
    if (!userData.Enable_Logs__c) {
        console.log = function () {};
        console.warn = function () {};
        console.error = function () {};
        console.info = function () {};
    }
    this.loadNotificationCount();
    
    // onError(error => {
    //   console.error('❌ Platform Event error:', JSON.stringify(error));
    // });
    // this.subscribeToNotificationEvents();

    // 🔄 Optional: Refresh every 30 seconds
    this.intervalId = setInterval(() => {
      this.loadNotificationCount();
    }, 30000);
    this.isLoading = true;
    const storedFacilityId = localStorage.getItem("defaultFacilityId");
    const storedFacilityLabel = localStorage.getItem("defaultFacilityLabel");

    console.log("storedFacilityId >>", storedFacilityId);
    console.log("storedFacilityLabel >>", storedFacilityLabel);

    this.subscriptionBot = subscribe(
      this.messageContext,
      BOT_ACTION_CHANNEL,
      (payload) => this.handleBotAction(payload)
    );

    if (storedFacilityId && storedFacilityLabel) {
      this.facilityValue = storedFacilityId;
      this.facilityLabel = storedFacilityLabel;
    }

    const userType = userData.User_Type__c;
    this.userType = userType; // Save if needed later

  //   const facilityData = await getFacilityData();
  //   console.log("Facility data fetched successfully:", facilityData);

  //   this.finalListFacilities = [];
  //   this.selectedFacilities = [];
  //   this.facilityOptions = facilityData.map((record) => ({
  //     label: record.Name,
  //     value: record.Id,
  //     participantPreferredName: record.Participant_Preferred_Name_Formla__c,
  //     facilityPreferredName: record.Facility_Preferred_Name_Formula__c,
  //     staffPreferredName: record.Staff_Preferred_Name_Formula__c
  //   }));

  //   if (userType === "NDIS Org Admin" || userType === "ICT Admin") {
  //     // this.finalListFacilities = this.facilityOptions;
  //     this.allFacilities = [...this.facilityOptions];
  //     this.finalListFacilities = [...this.allFacilities];
  //     this.validateCache();
  //     console.log(
  //       "Mapped facility options: FOR ORG ADMIN",
  //       JSON.stringify(this.finalListFacilities)
  //     );
  //   } else if (
  //     userType === "Facility Admin" ||
  //     userType === "HR Admin" ||
  //     userType === "Roster Manager"
  //   ) {
  //     try {
  //       const currentFacilities = await getFacilityCurrentUser();
  //       console.log(
  //         "getFacilityCurrentUser facility:",
  //         JSON.stringify(currentFacilities)
  //       );

  //       // this.finalListFacilities = currentFacilities.map((record) => ({
  //       this.allFacilities = currentFacilities.map((record) => ({
  //         label: record.Facility__r.Name,
  //         value: record.Facility__r.Id,
  //         participantPreferredName:
  //           record.Facility__r.Participant_Preferred_Name_Formla__c,
  //         facilityPreferredName:
  //           record.Facility__r.Facility_Preferred_Name_Formula__c,
  //         staffPreferredName: record.Facility__r.Staff_Preferred_Name_Formula__c
  //       }));
  //       console.log(
  //         "Mapped facility options: Facility Admin",
  //         JSON.stringify(this.finalListFacilities)
  //       );
  //       this.finalListFacilities = [...this.allFacilities];
  //       this.validateCache();
  //     } catch (error) {
  //       this.error = error;
  //       this.finalListFacilities = [];
  //       console.error("Error fetching facilities for Facility Admin:", error);
  //     }
  //   } else if (userType === "NDIS Staff" ||userType === "ICT Staff" ||userType === "NDIS Participants") {
  // try {
  //   const result = await getstaffId();
  //   console.log("Staff result with facilities >>", JSON.stringify(result));

  //   let facilities = [];

  //   // 1️⃣ Prefer Staff_Facilities__r (multiple facilities)
  //   if (
  //     result?.Staff_Facilities__r &&
  //     result.Staff_Facilities__r.length > 0
  //   ) {
  //     facilities = result.Staff_Facilities__r.map((sf) => ({
  //       label: sf.Facility__r?.Name,
  //       value: sf.Facility__c,
  //       participantPreferredName:
  //         sf.Facility__r?.Participant_Preferred_Name_Formla__c,
  //       facilityPreferredName:
  //         sf.Facility__r?.Facility_Preferred_Name_Formula__c,
  //       staffPreferredName: result.Display_Nickname__c
  //     }));
  //   }
  //   // 2️⃣ Fallback to single Facility__c on Staff__c
  //   else if (result?.Facility__c && result?.Facility__r?.Name) {
  //     facilities = [
  //       {
  //         label: result.Facility__r.Name,
  //         value: result.Facility__c,
  //         participantPreferredName:
  //           result.Facility__r.Participant_Preferred_Name_Formla__c,
  //         facilityPreferredName:
  //           result.Facility__r.Facility_Preferred_Name_Formula__c,
  //         staffPreferredName: result.Display_Nickname__c
  //       }
  //     ];
  //   }

  //   // this.finalListFacilities = facilities;
  //   this.allFacilities = [...facilities];
  //   this.finalListFacilities = [...this.allFacilities];    
  //   // Optional: set default facility
  //   if (facilities.length > 0) {
  //     localStorage.setItem("defaultFacilityId", facilities[0].value);
  //     localStorage.setItem("defaultFacilityLabel", facilities[0].label);
  //   }

  //   this.validateCache();

  //   console.log(
  //     "Mapped Staff facilities:",
  //     JSON.stringify(this.finalListFacilities)
  //   );
  // } catch (error) {
  //       this.error = error;
  //       this.finalListFacilities = [];
  //       console.error("Error fetching staff data for NDIS/ICT Staff:", error);
  //     }
  //   }

  //   console.log(
  //     "this.finalListFacilities >>",
  //     JSON.stringify(this.finalListFacilities)
  //   );


  await this.refreshFacilityDropdown();

    /* // Bind outside click handler and store reference
    this.boundHandleOutsideClick = this.handleOutsideClick.bind(this); */

    const isDarkMode =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    this.updateFavicon(isDarkMode ? Tdark : Tlogo);

    if (window.matchMedia) {
      const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");
      // Add listener for dynamic theme changes
      themeMedia.addEventListener("change", (e) => {
        const newIcon = e.matches ? Tdark : Tlogo;
        this.updateFavicon(newIcon);
      });
    }

    this.mediaQuery = window.matchMedia(
      `(resolution: ${window.devicePixelRatio * 96}dpi)`
    );
    if (this.mediaQuery?.addEventListener) {
      this.mediaQuery.addEventListener("change", this.dpiChangeHandler);
    }
    this.handleSidebarToggle();
    this.subscribeToFooterMessage();
    this.subscribeToTsignMessage();
    this.subscribeToDashboardMessage();
    this.subscribeFacilityRefresh();
   // this.subscribeToCreateComoanyMessage();

    //this.restoreStateFromUrl();       //after URL
    //window.addEventListener('popstate', this.handleBrowserNavigation.bind(this));      //Back and Forward in Browser   //after URL
    // window.addEventListener('popstate', this.preventBrowserNavigation.bind(this));

    //  // Optional: Push a "locked" state to create a trap
    //  history.pushState({ module: this.activeMenu }, '', window.location.pathname);
    // window.addEventListener('popstate', this.blockNavigation.bind(this));
    //console.log = function () {};

    orgDetails().then((response) => {
      console.log("response for Org Details==>" + JSON.stringify(response));
      this.Orgid = response.Id;
      this.orgfullname = response.Name;
      const logoHtml = response.Organization_Logo__c;
      this.orgname = response.Name
        ? response.Name.split(" ").slice(0, 2).join(" ")
        : "";
      this.usertype = response.Type_of_User__c;
      this.state = response.Address_Latest__StateCode__s;
      this.Orgabn = response.ABN__c;
      this.accountingServices = response.Accounting_Services__c;
      if(this.accountingServices == 'Xero'){
        this.handleSyncEarningRates();
      }

      console.log("this.accountingServices===>" + this.accountingServices);
      localStorage.setItem("orgAccountingServices", this.accountingServices);
      console.log("this.usertype===>" + this.usertype);
      console.log("this.logo===>" + this.orglogo);

      if (logoHtml) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = logoHtml;

        const img = tempDiv.querySelector("img");

        this.orglogo = img?.getAttribute("src") || "";
        console.log("Extracted org logo src:", this.orglogo);
      } else {
        this.orglogo = "";
      }

      if (this.usertype === "NDIS User") {
        this.typeofuser = true;
      } else if (this.usertype === "ICT User") {
        this.typeofuser = false;
      }

      if (this.usertype === "NDIS User") {
        if (this.currentUserRole == "Portal Account Partner User") {
          this.blNDISUser = true;
        }
        this.NdisFlag = true;
        console.log("user type" + this.usertype);
      }

      if (this.currentUserType == "NDIS Participants") {
        this.ChatModule = false;
      }

      if (this.currentUserType == "Accountant for Organisation") {
        this.NdisFlag = false;
      }

      // this.TSupportModule = response.Name === 'Tesseract Apps';
    });

    const headerElement = document.querySelector(
      "#CustomerPortalTemplate > div.cHeaderWrapper > div.cHeader.slds-container--fluid > div"
    );
    // Apply the background color if the element exists
    if (headerElement) {
      headerElement.style.backgroundColor = "#FFFFFF";
    }

    const logoAnchor = document.querySelector(
      "#CustomerPortalTemplate > div.cHeaderWrapper > div.cHeader.slds-container--fluid > div > div > div.cLogo > a"
    );

    if (logoAnchor) {
      // Remove any existing children (like the standard logo)
      while (logoAnchor.firstChild) {
        logoAnchor.removeChild(logoAnchor.firstChild);
      }

      // Create a new `<img>` element for the custom logo
      const newLogo = document.createElement("img");
      newLogo.src = TesseractLogo; // Set the source to the static resource
      newLogo.alt = "Tesseract Logo"; // Add alternative text
      newLogo.style.width = "auto"; // Adjust as needed
      newLogo.style.height = "100%"; // Adjust as needed

      // Append the new logo to the anchor
      logoAnchor.appendChild(newLogo);

      // Move the logo position to the right by 25%
      logoAnchor.style.position = "relative";
      logoAnchor.style.left = "12.5%";
      logoAnchor.style.width = "100%";
      logoAnchor.style.transform = "scale(1.4)";

      // Add Click Event to Redirect to Dashboard
      logoAnchor.style.cursor = "pointer"; // Indicate it's clickable
      logoAnchor.addEventListener("click", () => {
        this.redirectToDashboard();
      });

      console.log("Standard logo replaced successfully with the custom logo.");
    } else {
      console.warn(
        "Logo anchor element not found. Please verify the DOM path."
      );
    }

    
    //    const logoContainer = document.querySelector(
    //    "#CustomerPortalTemplate > div.cHeaderWrapper > div.cHeader.slds-container--fluid > div > div > div.cLogo"
    // );

    // if (logoContainer) {
    //    // Add position and left styles to the logo container
    //    logoContainer.style.position = "sticky";
    //    logoContainer.style.left = "17%";
    //    //logoContainer.style.transform = "scale(1.4)";

    //    console.log('Successfully applied position: sticky and left: 17% to the logo container.');
    // } else {
    //    console.warn('Logo container not found. Please verify the DOM selector path.');
    // }

    const logoContainer = document.querySelector(
      "#CustomerPortalTemplate > div.cHeaderWrapper > div.cHeader.slds-container--fluid > div > div > div.cLogo"
    );

    if (logoContainer && !document.querySelector(".logoWrapper")) {
      // Create wrapper
      const logoWrapper = document.createElement("div");
      logoWrapper.className = "logoWrapper";

      // Apply all position and layout styles here instead of .cLogo
      logoWrapper.style.display = "flex";
      logoWrapper.style.alignItems = "center";
      logoWrapper.style.gap = "35px";
      logoWrapper.style.position = "sticky";
      // logoWrapper.style.left = "17%";
      logoWrapper.style.top = "0";
      logoWrapper.style.zIndex = "980";
      logoWrapper.style.display = "none";

      // Insert wrapper before logoContainer, then move logo into it
      logoContainer.parentElement.insertBefore(logoWrapper, logoContainer);
      logoWrapper.appendChild(logoContainer);

      // Create breadcrumb nav
      const breadcrumbNav = document.createElement("div");
      breadcrumbNav.id = "breadcrumb-nav";
      breadcrumbNav.style.display = "flex";
      breadcrumbNav.style.alignItems = "center";
      breadcrumbNav.style.fontSize = "85%";
      breadcrumbNav.style.color = "#002A52";
      breadcrumbNav.style.gap = "6px";
      breadcrumbNav.style.marginTop = "2px";

      breadcrumbNav.innerHTML = `
     <span id="breadcrumb-bar" style="display:none; width:2px; height:18px; background-color:#002A52; margin-right:6px; margin-left:2px;"></span>
     <span id="breadcrumb-category" style="cursor:pointer; text-decoration: underline; font-weight: bold;"></span>
     <span id="breadcrumb-separator" style="display:none;">></span>
     <span id="breadcrumb-subcategory" style="cursor:pointer; text-decoration: underline; font-weight: bold; display:none;"></span>
   `;

      logoWrapper.appendChild(breadcrumbNav);

      console.log(
        "✅ Wrapped logo and breadcrumb inside .logoWrapper with fixed position."
      );
    } else {
      console.warn("⚠️ Logo container not found or wrapper already exists.");
    }

    // Move the profile menu to the right by 15%
    const profileMenuElement = document.querySelector(
      "#CustomerPortalTemplate > div.cHeaderWrapper > div.cHeader.slds-container--fluid > div > div > div.cProfileMenu"
    );
    if (profileMenuElement) {
      profileMenuElement.style.position = "fixed"; // Ensure it's positioned relative
      profileMenuElement.style.right = "2%"; // Move 15% to the right
      profileMenuElement.style.zIndex = "980";
      profileMenuElement.style.display = "none";
    }

    const headerContainerElement = document.querySelector(
      "#CustomerPortalTemplate > div.cHeaderWrapper > div.cHeader.slds-container--fluid"
    );
    if (headerContainerElement) {
      headerContainerElement.style.position = "fixed"; // Set position to fixed
      headerContainerElement.style.zIndex = "980";
      headerContainerElement.style.top = "0";
      headerContainerElement.style.display = "none";
      // headerContainerElement.style.display = "none"; // Temporary ---remove it
    }

    const notifications = document.querySelector(
      "#CustomerPortalTemplate > div.cHeaderWrapper > div.cHeader.slds-container--fluid > div > div > div.cNotifications"
    );
    if (notifications) {
      notifications.style.position = "fixed";
      notifications.style.right = "0.5%";
    }

    //PowerICon

    setTimeout(() => {
      let profileAttempts = 0;
      const maxProfileAttempts = 10;

      const profileInterval = setInterval(() => {
        profileAttempts++;

        // Find the profile button (which toggles the menu)
        const profileButton = document.querySelector(
          "#\\33 \\:40\\;a > div > div > a"
        );

        // Find the cProfileMenu container
        const profileMenuContainer = document.querySelector(
          "#CustomerPortalTemplate > div.cHeaderWrapper > div.cHeader.slds-container--fluid > div > div > div.cProfileMenu"
        );

        // Find and remove the down arrow button
        const arrowElement = document.querySelector(
          "#\\33 \\:40\\;a > div > div > a > span.triggerDownArrow.down-arrow"
        );
        if (arrowElement) {
          arrowElement.remove();
          console.log("Down arrow button removed.");
        }

        // Stop checking if profile button isn't found
        if (profileAttempts > maxProfileAttempts) {
          clearInterval(profileInterval);
          console.warn("Profile button not found after multiple attempts.");
          return;
        }

        // Click the profile button when it appears
        if (profileButton) {
          clearInterval(profileInterval);
          profileButton.click();
          console.log("Profile button clicked automatically.");

          let attempts = 0;
          const maxAttempts = 10;

          const interval = setInterval(() => {
            attempts++;

            // Find the menu list
            const menuList = document.querySelector(
              "#CustomerPortalTemplate > div.cHeaderWrapper > div.cHeader.slds-container--fluid > div > div > div.cProfileMenu > div > div > div > div.menuList.popupTargetContainer.uiPopupTarget.uiMenuList.uiMenuList--default"
            );

            // Find the logout button inside the menu list
            const logoutElement = document.querySelector(
              "#CustomerPortalTemplate > div.cHeaderWrapper > div.cHeader.slds-container--fluid > div > div > div.cProfileMenu > div > div > div > div.menuList.popupTargetContainer.uiPopupTarget.uiMenuList.uiMenuList--default > div > ul > li.logOut.uiMenuItem > a"
            );

            if (attempts > maxAttempts) {
              clearInterval(interval);
              console.warn("Logout button not found after multiple attempts.");
              return;
            }

            // If all elements are found, proceed
            if (logoutElement) {
              clearInterval(interval);

              if (menuList) {
                menuList.style.display = "none"; // Hide menu instantly
                console.log("Menu hidden instantly after extracting logout.");
                //   this.isLoading = false;
              }

              // Create a container for the power icon
              const powerIconContainer = document.createElement("div");
              powerIconContainer.style.position = "relative";
              powerIconContainer.style.display = "inline-block";
              powerIconContainer.style.zIndex = "99999";

              // Create the Power Icon
              const powerIcon = document.createElement("div");
              powerIcon.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" 
        xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2V10" stroke="black" stroke-width="2" stroke-linecap="round"/> 
        <path d="M6.343 6.343a8 8 0 1 0 11.314 0" 
            stroke="black" stroke-width="2" stroke-linecap="round"/> 
    </svg>
`;
              powerIcon.style.cursor = "pointer";
              powerIcon.style.borderRadius = "50%";
              powerIcon.style.transition = "all 0.3s ease-in-out";
              powerIcon.style.zIndex = "9999";

              // Create the Tooltip
              const tooltip = document.createElement("div");
              tooltip.innerHTML = `Logout<br><span style="text-decoration: underline; color: rgba(255, 255, 255, 0.6); font-size: 11px;">Click Here</span>`;
              tooltip.style.position = "absolute";
              tooltip.style.backgroundColor = "rgba(51, 51, 51, 0.85)";
              tooltip.style.backdropFilter = "blur(3px)"; // ✅ Blur effect
              tooltip.style.color = "white";
              tooltip.style.padding = "6px 10px";
              tooltip.style.borderRadius = "8px";
              tooltip.style.fontSize = "12px";
              tooltip.style.whiteSpace = "nowrap";
              tooltip.style.bottom = "-52px";
              tooltip.style.left = "50%";
              tooltip.style.transform = "translateX(-50%)";
              tooltip.style.opacity = "0";
              tooltip.style.visibility = "hidden";
              tooltip.style.transition = "opacity 0.3s ease-in-out";
              tooltip.style.cursor = "pointer";
              tooltip.style.zIndex = "9999";

              // Tooltip pointer
              const tooltipPointer = document.createElement("div");
              tooltipPointer.style.position = "absolute";
              tooltipPointer.style.top = "-6px";
              tooltipPointer.style.left = "50%";
              tooltipPointer.style.transform = "translateX(-50%)";
              tooltipPointer.style.width = "0";
              tooltipPointer.style.height = "0";
              tooltipPointer.style.borderLeft = "6px solid transparent";
              tooltipPointer.style.borderRight = "6px solid transparent";
              tooltipPointer.style.borderBottom = "6px solid #333";
              tooltip.appendChild(tooltipPointer);

              // Hide tooltip if clicked outside
              document.addEventListener("click", (e) => {
                if (!powerIconContainer.contains(e.target)) {
                  tooltip.style.visibility = "hidden";
                  tooltip.style.opacity = "0";
                  powerIcon.innerHTML = powerIcon.innerHTML.replace(
                    /stroke="red"/g,
                    'stroke="black"'
                  );
                }
              });

              // Handle tooltip click
              tooltip.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();

                if (confirm("Are you sure you want to log out?")) {
                  logoutElement.click();
                  console.log("Logout via tooltip triggered.");
                }
              });

              function showLogoutConfirmation() {
                const confirmLogout = confirm(
                  "Are you sure you want to log out?"
                );
                if (confirmLogout) {
                  logoutElement.click();
                  console.log(
                    "Power icon clicked - Logout confirmed and triggered."
                  );
                } else {
                  console.log("Logout canceled.");
                }
              }

              // Attach Logout Click Event to Power Icon
              powerIcon.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                showLogoutConfirmation();
              });

              // Attach Logout Click Event to Tooltip (Now clickable)
              tooltip.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                showLogoutConfirmation();
              });

              // Append elements in order
              powerIconContainer.appendChild(powerIcon);
              powerIconContainer.appendChild(tooltip);
              profileButton.parentElement.appendChild(powerIconContainer);
            }
          }, 100);
        }
      }, 100);
    }, 2000);

    // Hide the specified navigation bar element
    const navBarElement = document.querySelector(
      "#CustomerPortalTemplate > div.cHeaderWrapper > div.cHeader.slds-container--fluid > div > div > div.slds-container--fluid.slds-grid.slds-grid--vertical-align-center.cptNavBar"
    );
    if (navBarElement) {
      navBarElement.style.display = "none"; // Hide the element
    }

    // Style the footer panel
    const footerElement = document.querySelector(
      "#CustomerPortalTemplate > div.cFooterPanel"
    );
    if (footerElement) {
      footerElement.style.position = "fixed"; // Fix position at the bottom
      footerElement.style.width = "89%"; // Set width to 84%
      footerElement.style.bottom = "1%"; // Align to bottom
      footerElement.style.left = "11%"; // Align from left by 16%
    }

    const triangleStyle = document.createElement("style");
    triangleStyle.innerHTML = `
  #menu-triangle {
    position: fixed;
    width: 12px;
    height: 12px;
    background-color: #ba430c;
    clip-path: polygon(0 50%, 100% 0, 100% 100%);
    z-index: 99999;
    display: none;
    pointer-events: none;
  }
`;
    document.head.appendChild(triangleStyle);

    setTimeout(() => {
      const observer = new MutationObserver(() => {
        const notificationLinks =
          document.querySelectorAll(".notification-link");

        notificationLinks.forEach((link) => {
          if (!link.classList.contains("disabled-notification-link")) {
            link.classList.add("disabled-notification-link");
            link.removeAttribute("href");
            link.style.pointerEvents = "none";
            link.style.cursor = "default";
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }, 1000);

    setTimeout(() => {
      this.fetchStaffDetails();
    }, 2000);
    this.updateBreadcrumb("Dashboard");
this.supportCoordinator = this.isSupportCoordinator;
console.log('[Support Coordinator] isSupportCoordinator =', this.isSupportCoordinator);
console.log('[Support Coordinator] supportCoordUserModule =', this.supportCoordUserModule);
console.log('[Support Coordinator] supportCoordinator =', this.supportCoordinator);
if (!this.supportCoordinator) {
    this.setActiveMenu("dashboard");
} else {
    console.log('[Support Coordinator] Auto opening');
    this.supportCoordinatorflag = true;
    this.supportCoordinatormoduleflag = true;
    this.StaffAvailabilityFlag = false;
    setTimeout(() => {
        this.handleModuleClick({
            currentTarget: {
                dataset: {
                    field: 'Support Coordinator',
                    content: 'Support Coordinator'
                }
            },
            target: {
                closest() {
                    return {
                        dataset: {
                            field: 'Support Coordinator'
                        },
                        classList: {
                            add() {},
                            remove() {}
                        }
                    };
                }
            }
        });
    }, 500);
}



    if (!document.getElementById('global-no-data-style')) {
        const style = document.createElement('style');
        style.id = 'global-no-data-style';

        style.innerText = `
            .no-data {
                grid-column: 1 / -1 !important;
                text-align: center !important;
                justify-content: center !important;
                align-items: center !important;
                display: flex !important;
                width: 100% !important;
                padding: 20px !important;
                color: var(--ta-color-text-light) !important;
                font-size: 22px !important;
                margin: 0 !important;
            }
        `;

        document.head.appendChild(style);
    }
    
    // this.isLoading = false;
    setTimeout(() => {
      this.isLoading = false;
      console.log("isLoading =", this.isLoading);
    }, 3000);
    this.removeSiteforceBorder();
    /* document.addEventListener("click", this.handleOutsideClick); */
    this.boundHandleOutsideClick = this.handleOutsideClick.bind(this);
    document.addEventListener("click", this.boundHandleOutsideClick);
    this.boundShortcutHandler = this.handleKeyboardShortcuts.bind(this);
    window.addEventListener("keydown", this.boundShortcutHandler);
    const rawDate = new Date();
    this.shiftDate = this.formatDateToDDMMYYYY(rawDate);


    /* Sai Eswar Added for Shortcut Keys */

    // 🧭 Add keyboard shortcuts for modules
    window.addEventListener("keydown", (event) => {
      // Ignore typing inside inputs or textareas
      const tag = event.target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
    });
      // add near end of connectedCallback
      this.handleCloseDropdowns = () => {
          this.showNotifications = false;
          this.isOpen = false;
      };
      window.addEventListener('closedropdowns', this.handleCloseDropdowns);    

  }

  handleSyncEarningRates() {
    syncXeroEarningsRates()
        .then(result => {
            console.log('✅ syncXeroEarningsRates Success:', result);
        })
        .catch(error => {
            console.error('❌ Error:', error);
        })
        .finally(() => {
        });
  }


  handleKeyboardShortcuts(event) {
        // Ignore when typing in inputs or textareas
      const tag = event.target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      console.log('this.supportCoordinator ====> ', this.supportCoordinator);
      if(this.supportCoordinator === false){
          switch (true) {
              case event.altKey && event.key.toLowerCase() === "b":
                  this.triggerShortcut("dashboard", "Dashboard");
                  if (typeof this.handleDashboardevent === "function") {
                      this.handleDashboardevent({ detail: { message: "Dashboard" } });
                  }
                  break;
              case event.altKey && event.key.toLowerCase() === "a":
                  this.triggerShortcut("Admin", "Admin");
                  break;
              case event.altKey && event.key.toLowerCase() === "m":
                  this.triggerShortcut("Access Manager", "Access Manager");
                  break;
              case event.altKey && event.key.toLowerCase() === "h":
                  this.triggerShortcut("Human Resources", "Human Resources");
                  break;
              case event.altKey && event.key.toLowerCase() === "r":
                  this.triggerShortcut("Roster Manager", "Roster Manager");
                  break;
              case event.altKey && event.key.toLowerCase() === "p":
                  this.triggerShortcut("Participants", "Participants");
                  break;
              case event.altKey && event.key.toLowerCase() === "t":
                  this.triggerShortcut("ICT Timesheet", "ICT Timesheet");
                  break;
              case event.altKey && event.key.toLowerCase() === "i":
                  this.triggerShortcut("Incident Register", "Incident Register");
                  break;
              case event.altKey && event.key.toLowerCase() === "n":
                  this.triggerShortcut("T sign", "T sign");
                  break;
              case event.altKey && event.key.toLowerCase() === "o":
                  this.triggerShortcut("My Profile", "My Profile");
                  break;
              case event.altKey && event.key.toLowerCase() === "s":
                  this.triggerShortcut("Sign In", "Sign In");
                  break;
              case event.altKey && event.key.toLowerCase() === "y":
                  this.triggerShortcut("Repository", "Repository");
                  break;
              case event.altKey && event.key.toLowerCase() === "l":
                  this.triggerShortcut("T Learner", "T Learner");
                  break;
              case event.altKey && event.key.toLowerCase() === "x":
                  this.triggerShortcut("Xero", "Xero");
                  break;
              case event.altKey && event.key.toLowerCase() === "g":
                  this.triggerShortcut("Accounting", "Accounting");
                  break;

              case event.altKey && event.key.toLowerCase() === "b":
                  this.triggerShortcut("MYOB", "MYOB");
                  break;
          }
      } else{
        switch (true) {
          case event.altKey && event.key.toLowerCase() === "s":
            this.triggerShortcut("supportCoordinator", "supportCoordinator");
            break;
          case event.altKey && event.key.toLowerCase() === "p":
            this.triggerShortcut("supportParticipants", "supportParticipants");
            break;
          case event.altKey && event.key.toLowerCase() === "t":
            this.triggerShortcut("supportTasks", "supportTasks");
            break;
          case event.altKey && event.key.toLowerCase() === "g":
            this.triggerShortcut("supportGoals", "supportGoals");
            break;
          case event.altKey && event.key.toLowerCase() === "o":
            this.triggerShortcut("supportProviders", "supportProviders");
            break;
          case event.altKey && event.key.toLowerCase() === "n":
            this.triggerShortcut("supportNotes", "supportNotes");
            break;
          case event.altKey && event.key.toLowerCase() === "b":
            this.triggerShortcut("supportBilling", "supportBilling");
            break;
          case event.altKey && event.key.toLowerCase() === "r":
            this.triggerShortcut("supportReports", "supportReports");
            break;
        }
      }
  }

// 🪄 Trigger both menu and module logic
  // triggerShortcut(field, content) {
  //   // Stop if modules not yet loaded
  //   if (!this.modules || this.modules.length === 0) {
  //       console.warn("⚠️ Modules not loaded or empty — skipping shortcut.");
  //       return;
  //   }

  //   // Check if user has access (match field OR content)
  //   const hasAccess = this.modules.some(
  //       (m) => m.trim().toLowerCase() === field.toLowerCase() || 
  //              m.trim().toLowerCase() === content.toLowerCase()
  //   );

  //   if (!hasAccess) {
  //       console.log(`🚫 Shortcut blocked — user has no access to: ${field}`);
  //       return;
  //   }

  //   const fakeEvent = {
  //       currentTarget: { dataset: { field, content } },
  //       target: { dataset: { field, content } },
  //   };

  //   console.log(`⚡ Shortcut triggered for: ${field}`);

  //   // Trigger click handlers
  //   if (typeof this.handleMenuClick === "function") {
  //       this.handleMenuClick(fakeEvent);
  //   }

  //   if (typeof this.handleModuleClick === "function") {
  //       this.handleModuleClick(fakeEvent);
  //   }

  //   if (typeof this.handleSubmenuClick === "function") {
  //       this.handleSubmenuClick(fakeEvent);
  //   }
  // }

  triggerShortcut(field, content) {
      const commonModules = ["dashboard", "chatter", "t learner"]; // Always allowed

      if (!this.modules || this.modules.length === 0) {
          console.warn("⚠️ Modules not loaded or empty — skipping shortcut.");
          return;
      }

      const lowerField = field.toLowerCase();

      const hasAccess =
          commonModules.includes(lowerField) ||
          this.modules.some(
              (m) =>
                  m.trim().toLowerCase() === lowerField ||
                  m.trim().toLowerCase() === content.toLowerCase()
          );

      if (!hasAccess) {
          console.log(`🚫 Shortcut blocked — user has no access to: ${field}`);
          return;
      }

      console.log(`⚡ Shortcut triggered for: ${field}`);

      const fakeEvent = {
          currentTarget: { dataset: { field, content } },
          target: { dataset: { field, content } },
          preventDefault: () => {},
          stopPropagation: () => {}
      };

      if (typeof this.handleMenuClick === "function") {
          this.handleMenuClick(fakeEvent);
      }

      setTimeout(() => {
          if (typeof this.handleSubmenuClick === "function") {
              this.handleSubmenuClick(fakeEvent);
          }
      }, 50);

      if (typeof this.handleModuleClick === "function") {
          this.handleModuleClick(fakeEvent);
      }
  }


  // subscribeToNotificationEvents() {
  //   console.log('subscribeToNotificationEvents');
  //   const messageCallback = (response) => {
  //     console.log('📬 Platform Event received:', response);
  //     this.handlePlatformEvent(response);
  //   };

  //   empSubscribe(this.notificationChannel, -1, messageCallback)
  //     .then(response => {
  //       // console.log('✅ Subscribed to:', response.channel);
  //               console.log('✅ Subscribed to:');
  //       this.notificationSubscription = response;
  //     });
  // }

  // // Handle the platform event payload
  // handlePlatformEvent(response) {
  //      console.log('📬 handlePlatformEvent is calling:', response);
  //    console.log('handlePlatformEvent');
  //   this.loadNotificationCount();
  // }
  removeSiteforceBorder() {
    const observer = new MutationObserver(() => {
      const el = document.querySelector("#CustomerPortalTemplate");

      if (el && el.classList.contains("siteforceCptBody")) {
        el.style.border = "none";
        console.log(
          "[Style] Removed border from #CustomerPortalTemplate.siteforceCptBody"
        );
        observer.disconnect(); // Stop observing
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log(
      "[Observer] Watching for #CustomerPortalTemplate to remove border..."
    );

    window.requestAnimationFrame(() => {
      const centerPanel = document.querySelector(
        ".siteforceCptBody .cCenterPanel"
      );
      if (centerPanel) {
        centerPanel.style.margin = "0"; // ✅ Remove margin
        console.log("[cCenterPanel] Margin removed.");
      } else {
        console.warn("[cCenterPanel] Not found in DOM.");
      }
    });
  }
  /* disconnectedCallback() {
    if (this.boundHandleOutsideClick) {
      document.removeEventListener("click", this.boundHandleOutsideClick);
    }
    if (this.mediaQuery?.removeEventListener) {
      this.mediaQuery.removeEventListener("change", this.dpiChangeHandler);
    }
    document.removeEventListener("click", this.handleOutsideClick);
    if (this.cdcSubscription) {
      unsubscribe(this.cdcSubscription, () => {
        console.log("🔌 Unsubscribed from CDC");
      });
    }
  } */

  disconnectedCallback() {

    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = undefined;
    }
        
    if (this.boundHandleOutsideClick) {
      document.removeEventListener("click", this.boundHandleOutsideClick);
    }
    window.removeEventListener("keydown", this.boundShortcutHandler);
    // if (this.notificationSubscription) {
    //   unsubscribe(this.notificationSubscription, (response) => {
    //     console.log('👋 Unsubscribed from channel:', response.channel);
    //   });
    // }
    window.removeEventListener('closedropdowns', this.handleCloseDropdowns);    
  }
  // handleOutsideClick = () => {
  //   if (this.showNotifications) {
  //     this.showNotifications = false;
  //   }
  // };

  loadNotificationCount() {
    getUserNotificationscount()
      .then((result) => {
        this.notificationCount = result;
        console.log("Notification Count:", result);
      })
      .catch((error) => {
        console.error("Error fetching notifications:", error);
      });
  }

  // handleFacilitySelect(event) {
  //   const facilityValue = event.currentTarget.dataset.facilityValue;
  //   const facilityLabel = event.currentTarget.dataset.facilityLabel;

  //   this.facilityValue = event.currentTarget.dataset.facilityValue;
  //   this.facilityLabel = event.currentTarget.dataset.facilityLabel;
  //   this.facilityPrefreedName =
  //     event.currentTarget.dataset.facilityPreferredName;
  //   this.participantPrefreedName =
  //     event.currentTarget.dataset.participantPreferredName;
  //   this.staffPrefreedName = event.currentTarget.dataset.staffPreferredName;
  //   this.isOpen = false;

  //   // Remove outside click listener when dropdown closes
  //   document.removeEventListener("click", this.boundHandleOutsideClick);

  //   console.log("Selected Facility ID >>", this.facilityValue);
  //   console.log("Selected Facility Label >>", this.facilityLabel);

  //   localStorage.setItem("defaultFacilityId", this.facilityValue);
  //   localStorage.setItem("defaultFacilityLabel", this.facilityLabel);
  //   localStorage.setItem(
  //     "defaultParticipantPreferredName",
  //     this.participantPrefreedName || "Participant"
  //   );
  //   localStorage.setItem(
  //     "defaultFacilityPreferredName",
  //     this.facilityPrefreedName || "Facility"
  //   );
  //   localStorage.setItem(
  //     "defaultStaffPreferredName",
  //     this.staffPrefreedName || "Staff"
  //   );

  //   console.log(
  //     "this.participantPrefreedName >>",
  //     this.participantPrefreedName
  //   );
  //   console.log("this.facilityPrefreedName >>", this.facilityPrefreedName);
  //   console.log("this.staffPrefreedName >>", this.staffPrefreedName);

  //   this.removeLocalNavigationItems();
  //   // Dispatch custom event to parent component
  //   const facilityChangeEvent = new CustomEvent("facilitychange", {
  //     detail: {
  //       facilityId: this.facilityValue,
  //       facilityLabel: this.facilityLabel,
  //       facility: {
  //         value: this.facilityValue,
  //         label: this.facilityLabel
  //       }
  //     }
  //   });
  //   this.dispatchEvent(facilityChangeEvent);
  //   this.refreshCurrentModule();
  // }

  handleFacilitySelect(event) {
    const facilityValue = event.currentTarget.dataset.facilityValue;
    const facilityLabel = event.currentTarget.dataset.facilityLabel;

    this.facilityValue = facilityValue;
    this.facilityLabel = facilityLabel;

    this.facilityPrefreedName =
      event.currentTarget.dataset.facilityPreferredName;
    this.participantPrefreedName =
      event.currentTarget.dataset.participantPreferredName;
    this.staffPrefreedName =
      event.currentTarget.dataset.staffPreferredName;

    this.isOpen = false;

    // Remove outside click listener when dropdown closes
    document.removeEventListener("click", this.boundHandleOutsideClick);

    console.log("Selected Facility ID >>", this.facilityValue);
    console.log("Selected Facility Label >>", this.facilityLabel);

    localStorage.setItem("defaultFacilityId", this.facilityValue);
    localStorage.setItem("defaultFacilityLabel", this.facilityLabel);
    localStorage.setItem(
      "defaultParticipantPreferredName",
      this.participantPrefreedName || "Participant"
    );
    localStorage.setItem(
      "defaultFacilityPreferredName",
      this.facilityPrefreedName || "Facility"
    );
    localStorage.setItem(
      "defaultStaffPreferredName",
      this.staffPrefreedName || "Staff"
    );

    console.log(
      "this.participantPrefreedName >>",
      this.participantPrefreedName
    );
    console.log("this.facilityPrefreedName >>", this.facilityPrefreedName);
    console.log("this.staffPrefreedName >>", this.staffPrefreedName);

    /* -----------------------------
      ✅ CLEAR SEARCH INPUT
    ----------------------------- */

    this.facilitySearchKey = '';
    this.finalListFacilities = [...this.allFacilities];

    /* ----------------------------- */

    this.removeLocalNavigationItems();

    // Dispatch custom event to parent component
    const facilityChangeEvent = new CustomEvent("facilitychange", {
      detail: {
        facilityId: this.facilityValue,
        facilityLabel: this.facilityLabel,
        facility: {
          value: this.facilityValue,
          label: this.facilityLabel
        }
      }
    });

    this.dispatchEvent(facilityChangeEvent);

    this.refreshCurrentModule();
  }

  removeLocalNavigationItems() {
    localStorage.removeItem("clientRecordId");
    localStorage.removeItem("activeClientTab");
    localStorage.removeItem("activeAdminClientTab");
    localStorage.removeItem("adminClientRecordId");
    localStorage.removeItem("adminStaffRecordId");
    localStorage.removeItem("activeAdminStaffTab");
    localStorage.removeItem("hrStaffRecordId");
    localStorage.removeItem("timesheetViewFlag");
    localStorage.removeItem("timesheetStaffId");
    localStorage.removeItem("timesheetStaffName");
    localStorage.removeItem("timesheetIsChecked");
    this.riskIndexDetailsFromChild = {};
  }
  refreshCurrentModule() {
    const currentFlag = this.getCurrentFlagName();

    if (!currentFlag) {
      console.warn(
        "[Facility Refresh] ⚠️ No active module flag found. Skipping refresh."
      );
      return;
    }

    console.log(
      `[Facility Refresh] 🔄 Refreshing current module: ${currentFlag}`
    );

    // Temporarily hide the module
    this[currentFlag] = false;
    console.log(
      `[Facility Refresh] ⛔ ${currentFlag} set to false (unmounting component)...`
    );

    // Show it again after 0 ms to force re-render
    setTimeout(() => {
      this[currentFlag] = true;
      console.log(
        `[Facility Refresh] ✅ ${currentFlag} set to true (re-mounting component)...`
      );
    }, 0);
  }
  @track dashboardActiveFlag = "";

  getCurrentFlagName() {
    console.log("this.dashboardActiveFlag", this.dashboardActiveFlag);
    switch (this.dashboardActiveFlag) {
      case "Dashboard":
        return "dashboardflag";
      case "Admin":
        return "Adminflag";

      case "Participant":
      case "Facility Participant":
        return "clientflag";
      case "Staff":
      case "Facility Staff":
      case "Staff ICT":
        return "staffflag";
      case "Human Resources":
        return "hrstaffflag";
      case "Leave Management":
      case "MP Leave Management":
        return "leaveFlag";
      case "Awards & Recognition":
      case "MP Awards & Recognition":
        return "rewardsFlag";
      case "Recruitment":
        return "recruitmentFlag";
      case "Training & Evaluation":
      case "MP Training & Evaluation":
        return "trainingFlag";
      case "Roster Manager":
        return "addshiftFlag";
      case "ManageInvoices":
        return "ManageInvoiceFlag";
      case "RejectedShift":
        return "RejectedFlag";
      case "RejectedReports":
        return "RejectedReportsFlag";
      case "Timesheet":
        return "rosterTimeSheet";
      case "Reimbursement":
        return "submissionFlag";
      case "My Roster":
      case "Roster Manager Staff":
        return "shiftacceptFlag";
      case "Incident Register":
        return "incidentFlag";
      case "Access Manager":
        return "accessManagerflag";
      case "User Management":
        return "userAccessManagementflag";
      case "Staff Management":
        return "userStaffManagementflag";
      case "Reset Password":
        return "userResetPasswordflag";
      case "User Report":
        return "userStaffReportflag";
      case "ICT Timesheet":
        return "Icttimesheetflag";
      case "Forms":
        return "formsflag";
      case "ManageForm":
        return "manageformsflag";
      case "My Profile":
        return "profileflag";
      case "MP Awards & Recognition":
        return "awardFlag";
      case "MP Reports":
        return "reportsFlag";
      case "MP Performance Management":
        return "myProfilePerformanceFlag";
      case "Staff Availability":
        return "StaffAvailabilityFlag";
      case "Performance Management":
        return "performanceManagementflag";
      case "Manage Library Goal":
        return "libraryGoalflag";
      case "Participants":
        this.participantdetails = {};
        return this.currentUserType === "NDIS Participants"
          ? "participantLoginFlag"
          : "participantFlag";
      case "Payroll":
        return "payrollFlag";
      case "Expenses":
        return "payrollexpenseFlag";
      case "Invoices":
        return "payrollinvoiceFlag";
      case "Wages":
        return "payrollwagesFlag";
      case "Payroll Settings":
        return "payrollSettingsFlag";
      case "NDIS Payroll":
        return "ndisPayrollFlag";
      case "NDIS Sales and Purchases":
        return "ndisPayrollinvoiceFlag";
      case "NDIS Payroll Settings":
        return "ndisPayrollSettingsFlag";
      case "Bank Feed":
        return "ndisBankFeedFlag";
      case "Accounting":
        return "masterFlag";
      case "General Ledger":
        return "MasterDBFlag";
      case "Chart of Accounts":
        return "AccountingFlag";
      case "Reports":
        return "accountingReportsFlag";
      case "Sign In":
        return "SignInFlag";
      case "Repository":
        return "repositoryFlag";
      case "Smart Reports":
        return "smartReportsFlag";
      case "ndisquotetool":
        return "ndisQuoteToolFlag";

      default:
        console.warn(
          `[Facility Refresh] ❌ No flag mapped for: ${this.dashboardActiveFlag}`
        );
        return null;
    }
  }

  /* handleOutsideClick(event) {
      const dropdown1 = this.template.querySelector('[data-id="dropdown-container1"]');
      const dropdown2 = this.template.querySelector('[data-id="dropdown-container"]');

      // If clicked inside any dropdown → do nothing
      if (
          (dropdown1 && dropdown1.contains(event.target)) ||
          (dropdown2 && dropdown2.contains(event.target))
      ) {
          return;
      }

      // Otherwise close all
      this.closeAllDropdowns();
  } */

  // handleOutsideClick(event) {
  //   console.log("📌 [handleOutsideClick] Fired. Target:", event.target);

  //   // Close notifications if open and click is outside
  //   if (this.showNotifications) {
  //     this.showNotifications = false;
  //     console.log("🔒 Notifications closed by outside click");
  //   }

  //   // Close facility dropdown if open and click is outside
  //   if (this.isOpen) {
  //     this.isOpen = false;
  //     console.log("🏥 Facility dropdown closed by outside click");
  //   }
  // }

  handleOutsideClick(event) {
    console.log("📌 [handleOutsideClick] Fired. Target:", event.target);

    const path = event.composedPath ? event.composedPath() : [];

    /* ---------------------------
      🏥 Facility Dropdown
    ----------------------------*/
    const facilityDropdown = this.template.querySelector(
      '[data-id="facility-dropdown"]'
    );

    if (this.isOpen && facilityDropdown) {
      const clickedInsideFacility = path.includes(facilityDropdown);

      if (!clickedInsideFacility) {
        this.isOpen = false;
        console.log("🏥 Facility dropdown closed by outside click");
      }
    }

    /* ---------------------------
      🔔 Notifications Dropdown
    ----------------------------*/
    const notificationContainer = this.template.querySelector(
      '[data-id="notification-container"]'
    );

    if (this.showNotifications && notificationContainer) {
      const clickedInsideNotification = path.includes(notificationContainer);

      if (!clickedInsideNotification) {
        this.showNotifications = false;
        console.log("🔒 Notifications closed by outside click");
      }
    }
  }


  handleNotificationClick(event) {
    event.stopPropagation();
    
    this.showNotifications = !this.showNotifications;

    if (this.showNotifications) {
      setTimeout(() => {
        document.addEventListener("click", this.boundHandleOutsideClick);
      }, 0);
    } else {
      document.removeEventListener("click", this.boundHandleOutsideClick);
    }
  }
  // handleOutsideClick(event) {
  //   console.log("📌 [handleOutsideClick] Fired. Target:", event.target);

  //   const path = event.composedPath();

  //   /* ---------------------------
  //     🏥 Facility Dropdown
  //   ----------------------------*/
  //   if (this.isOpen) {
  //     const dropdown = this.template.querySelector(
  //       '[data-id="facility-dropdown"]'
  //     );

  //     if (dropdown && !path.includes(dropdown)) {
  //       this.isOpen = false;
  //       console.log("🏥 Facility dropdown closed by outside click");
  //     }
  //   }

  //   /* ---------------------------
  //     🔔 Notifications
  //   ----------------------------*/
  //   if (this.showNotifications) {
  //     const notificationContainer = this.template.querySelector(
  //       '[data-id="notification-container"]'
  //     );

  //     if (notificationContainer && !path.includes(notificationContainer)) {
  //       this.showNotifications = false;
  //       console.log("🔒 Notifications closed by outside click");
  //     }
  //   }
  // }

  closeAllDropdowns() {
    this.isOpen = false;
    this.showNotifications = false;
    document.removeEventListener("click", this.boundOutsideClickHandler);
  }

  @api closeDropdown() {
    if (this.isOpen) {
      this.isOpen = false;
      document.removeEventListener("click", this.boundHandleOutsideClick);
    }
  }

  @api openDropdown() {
    if (!this.isOpen) {
      this.handleToggleDropdown();
    }
  }

  @api refreshFacilityData() {
    this.loadFacilityData();
  }

  @api getCurrentFacility() {
    return {
      value: this.facilityValue,
      label: this.facilityLabel
    };
  }

  get dropdownClass() {
    return `slds-dropdown slds-dropdown_small custom-scroll  ${
      this.isOpen ? "slds-show" : "slds-hide"
    }`;
  }

  get chevronClass() {
    return `material-icons chevron-icon ${this.isOpen ? "rotated" : ""}`;
  }
  showToast(title, message, variant, mode = "dismissable") {
    const event = new ShowToastEvent({
      title,
      message,
      variant,
      mode
    });
    this.dispatchEvent(event);
  }

  handleToggleDropdown(event) {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
    this.showNotifications = false; // close notifications

    if (this.isOpen) {

      // ✅ Clear search input when dropdown opens
      this.facilitySearchKey = '';

      // ✅ Restore full facility list
      this.finalListFacilities = [...this.allFacilities];

      setTimeout(() => {
        document.addEventListener("click", this.boundOutsideClickHandler);
      }, 0);

    } else {
      this.closeAllDropdowns();
    }
  }

  /* validateCache() {
    console.log(
      "this.finalListFacilities in validateCache >>",
      this.finalListFacilities
    );
    if (this.finalListFacilities.length === 0) {
      console.log("IF CONDITIONS");
      // No facilities found – clear everything
      this.facilityValue = null;
      this.facilityLabel = null;
      this.finalListFacilities = [];

      console.log(
        "No facilities found. Cleared facilityValue and facilityLabel."
      );

      localStorage.removeItem("defaultFacilityId");
      localStorage.removeItem("defaultFacilityLabel");
    } else if (
      this.finalListFacilities.length > 0 &&
      this.facilityValue === null
    ) {
      console.log("ELSE IF 1 CONDITIONS");
      // Facilities are present – store the first one
      this.facilityValue = this.finalListFacilities[0].value;
      this.facilityLabel = this.finalListFacilities[0].label;

      console.log("Default facilityValue set to:", this.facilityValue);
      console.log("Default facilityLabel set to:", this.facilityLabel);

      localStorage.setItem("defaultFacilityId", this.facilityValue);
      localStorage.setItem("defaultFacilityLabel", this.facilityLabel);
    } else if (
      !this.finalListFacilities.find((fac) => fac.value === this.facilityValue)
    ) {
      console.log("ELSE IF 2 CONDITIONS");
      // facilityValue is not in the available list – fallback to first one
      this.facilityValue = this.finalListFacilities[0].value;
      this.facilityLabel = this.finalListFacilities[0].label;

      console.log(
        "facilityValue not in finalListFacilities. Set to first item:",
        this.facilityValue
      );

      localStorage.setItem("defaultFacilityId", this.facilityValue);
      localStorage.setItem("defaultFacilityLabel", this.facilityLabel);
    } else if (this.facilityValue === null) {
      console.log("ELSE IF 3 CONDITIONS");
      // Facilities are present – store the first one
      this.facilityValue = this.finalListFacilities[0].value;
      this.facilityLabel = this.finalListFacilities[0].label;

      console.log("Default facilityValue set to:", this.facilityValue);
      console.log("Default facilityLabel set to:", this.facilityLabel);

      localStorage.setItem("defaultFacilityId", this.facilityValue);
      localStorage.setItem("defaultFacilityLabel", this.facilityLabel);
    }
  }*/

  validateCache() {
    console.log("🔹 validateCache called");
    console.log(
      "Current finalListFacilities (JSON):",
      JSON.stringify(this.finalListFacilities, null, 2)
    );
    console.log("Current facilityValue:", this.facilityValue);
    console.log("Current facilityLabel:", this.facilityLabel);

    // Ensure preferred names are populated if facilityValue exists
    if (this.finalListFacilities.length > 0 && this.facilityValue) {
      const selectedFacility = this.finalListFacilities.find(
        (fac) => fac.value === this.facilityValue
      );
      if (selectedFacility) {
        this.facilityPrefreedName = selectedFacility.facilityPreferredName;
        this.participantPrefreedName =
          selectedFacility.participantPreferredName;
        this.staffPrefreedName = selectedFacility.staffPreferredName;
        console.log(
          "Updated Preferred Names from existing facilityValue:",
          this.facilityPrefreedName,
          this.participantPrefreedName,
          this.staffPrefreedName
        );
      }
    }

    if (this.finalListFacilities.length === 0) {
      console.log("IF CONDITIONS");
      // No facilities found – clear everything
      this.facilityValue = null;
      this.facilityLabel = null;
      this.facilityPrefreedName = null;
      this.participantPrefreedName = null;
      this.finalListFacilities = [];

      console.log(
        "No facilities found. Cleared facilityValue and facilityLabel."
      );

      localStorage.removeItem("defaultFacilityId");
      localStorage.removeItem("defaultFacilityLabel");
      localStorage.removeItem("defaultParticipantPreferredName");
      localStorage.removeItem("defaultFacilityPreferredName");
      localStorage.removeItem("defaultStaffPreferredName");
    } else if (
      this.finalListFacilities.length > 0 &&
      this.facilityValue === null
    ) {
      console.log("ELSE IF 1 CONDITIONS");
      const firstFacility = this.finalListFacilities[0];
      console.log("First facility object:", firstFacility);

      this.facilityValue = firstFacility.value;
      this.facilityLabel = firstFacility.label;
      this.facilityPrefreedName = firstFacility.facilityPreferredName;
      this.participantPrefreedName = firstFacility.participantPreferredName;
      this.staffPrefreedName = firstFacility.staffPreferredName;

      console.log("Default facilityValue set to:", this.facilityValue);
      console.log("Default facilityLabel set to:", this.facilityLabel);
      console.log("facilityPrefreedName set to:", this.facilityPrefreedName);
      console.log(
        "participantPrefreedName set to:",
        this.participantPrefreedName
      );

      localStorage.setItem("defaultFacilityId", this.facilityValue);
      localStorage.setItem("defaultFacilityLabel", this.facilityLabel);
      localStorage.setItem(
        "defaultParticipantPreferredName",
        firstFacility.participantPreferredName || ""
      );
      localStorage.setItem(
        "defaultFacilityPreferredName",
        firstFacility.facilityPreferredName || ""
      );
      localStorage.setItem(
        "defaultStaffPreferredName",
        firstFacility.staffPreferredName || ""
      );
    } else if (
      !this.finalListFacilities.find((fac) => fac.value === this.facilityValue)
    ) {
      console.log("ELSE IF 2 CONDITIONS");
      const firstFacility = this.finalListFacilities[0];
      console.log("First facility object:", firstFacility);

      this.facilityValue = firstFacility.value;
      this.facilityLabel = firstFacility.label;
      this.facilityPrefreedName = firstFacility.facilityPreferredName;
      this.participantPrefreedName = firstFacility.participantPreferredName;
      this.staffPrefreedName = firstFacility.staffPreferredName;

      console.log(
        "facilityValue not in finalListFacilities. Set to first item:",
        this.facilityValue
      );
      console.log("facilityPrefreedName set to:", this.facilityPrefreedName);
      console.log(
        "participantPrefreedName set to:",
        this.participantPrefreedName
      );

      localStorage.setItem("defaultFacilityId", this.facilityValue);
      localStorage.setItem("defaultFacilityLabel", this.facilityLabel);
      localStorage.setItem(
        "defaultParticipantPreferredName",
        firstFacility.participantPreferredName || ""
      );
      localStorage.setItem(
        "defaultFacilityPreferredName",
        firstFacility.facilityPreferredName || ""
      );
      localStorage.setItem(
        "defaultStaffPreferredName",
        firstFacility.staffPreferredName || ""
      );
    } else if (this.facilityValue === null) {
      console.log("ELSE IF 3 CONDITIONS");
      const firstFacility = this.finalListFacilities[0];
      console.log("First facility object:", firstFacility);

      this.facilityValue = firstFacility.value;
      this.facilityLabel = firstFacility.label;
      this.facilityPrefreedName = firstFacility.facilityPreferredName;
      this.participantPrefreedName = firstFacility.participantPreferredName;
      this.staffPrefreedName = firstFacility.staffPreferredName;

      console.log("Default facilityValue set to:", this.facilityValue);
      console.log("Default facilityLabel set to:", this.facilityLabel);
      console.log("facilityPrefreedName set to:", this.facilityPrefreedName);
      console.log(
        "participantPrefreedName set to:",
        this.participantPrefreedName
      );
      console.log("staffPrefreedName set to:", this.staffPrefreedName);
      console.log("staffPrefreedName set to:", this.staffPrefreedName);

      localStorage.setItem("defaultFacilityId", this.facilityValue);
      localStorage.setItem("defaultFacilityLabel", this.facilityLabel);
      localStorage.setItem(
        "defaultParticipantPreferredName",
        firstFacility.participantPreferredName || ""
      );
      localStorage.setItem(
        "defaultFacilityPreferredName",
        firstFacility.facilityPreferredName || ""
      );
      localStorage.setItem(
        "defaultStaffPreferredName",
        firstFacility.staffPreferredName || ""
      );
    } else if (this.finalListFacilities.length > 0 && this.facilityValue) {
      const selectedFacility = this.finalListFacilities.find(
        (fac) => fac.value === this.facilityValue
      );
      if (selectedFacility) {
        this.facilityPrefreedName = selectedFacility.facilityPreferredName;
        this.participantPrefreedName =
          selectedFacility.participantPreferredName;
        this.staffPrefreedName = selectedFacility.staffPreferredName;
        console.log(
          "Updated Preferred Names from existing facilityValue:",
          this.facilityPrefreedName,
          this.participantPrefreedName,
          this.staffPreferredName
        );

        // 🔹 Save into localStorage as well
        localStorage.setItem("defaultFacilityId", this.facilityValue);
        localStorage.setItem("defaultFacilityLabel", this.facilityLabel);
        localStorage.setItem(
          "defaultParticipantPreferredName",
          selectedFacility.participantPreferredName || ""
        );
        localStorage.setItem(
          "defaultFacilityPreferredName",
          selectedFacility.facilityPreferredName || ""
        );
        localStorage.setItem(
          "defaultStaffPreferredName",
          selectedFacility.staffPreferredName || ""
        );
      }
    }
    console.log("🔹 validateCache finished");
  }

  updateBreadcrumb(category, subcategory) {
    const barEl = document.getElementById("breadcrumb-bar");
    const catEl = document.getElementById("breadcrumb-category");
    const subcatEl = document.getElementById("breadcrumb-subcategory");
    const sepEl = document.getElementById("breadcrumb-separator");

    if (!category) {
      if (barEl) barEl.style.display = "none";
      if (catEl) catEl.style.display = "none";
      if (subcatEl) subcatEl.style.display = "none";
      if (sepEl) sepEl.style.display = "none";
      document.title = "TesseractApps";
      return;
    }

    if (barEl) {
      barEl.style.display = "inline-block";
    }

    if (catEl) {
      catEl.innerText = category;
      catEl.style.display = "inline";
      catEl.onclick = () => this.handleBreadcrumbClick(category);
    }

    if (subcatEl && subcategory) {
      subcatEl.innerText = subcategory;
      subcatEl.style.display = "inline";
      sepEl.style.display = "inline";
      subcatEl.onclick = () => this.handleBreadcrumbClick(subcategory);
    } else {
      subcatEl.style.display = "none";
      sepEl.style.display = "none";
    }

    if (category && subcategory) {
      document.title = `${category} - ${subcategory} | TesseractApps`;
    } else if (category && category.toLowerCase() === "dashboard") {
      document.title = `Home | TesseractApps`;
    } else {
      document.title = `${category} | TesseractApps`;
    }
  }

  handleBreadcrumbClick(label) {
    const menuItem = this.template.querySelector(
      `.menu-link[data-field="${label}"], .subcat a[data-field="${label}"]`
    );
    if (menuItem) {
      const event = new Event("click");
      menuItem.dispatchEvent(event);
    }
  }

  subscribeToFooterMessage() {
    console.log("📥 Subscribing to FOOTER_MESSAGE_CHANNEL");
    subscribe(this.context, FOOTER_MESSAGE_CHANNEL, (message) => {
      console.log("📨 Received message from footerLwc:", message);

      if (message.action === "openContactPanel") {
        console.log("➡️ Triggering openContactUsPanel()");
        this.openContactUsPanel();
      } else if (message.action === "openReleaseNotes") {
        console.log("➡️ Triggering openReleaseNotes()");
        this.openReleaseNotes();
      } else if (message.action === "openPrivacy") {
        console.log("➡️ Triggering openPrivacy()");
        this.openPrivacy();
      } else if (message.action === "openTerms") {
        console.log("➡️ Triggering openTerms()");
        this.openTerms();
      } else if (message.action === "expandSidebar") {
        console.log("➡️ Triggering handleSidebarToggle() for Expand View");
        if (this.isSidebarExpanded) {
          console.log("➡️ Sidebar is expanded — collapsing it now.");
          this.handleSidebarToggle();
        } else {
          console.log("ℹ️ Sidebar is already collapsed — ignoring message.");
        }
      }
    });
  }

  @track TandC = false;
  openTerms() {
    this.TandC = true;
  }

  closeTerms() {
    this.TandC = false;
  }

  @track privacyDis = false;
  openPrivacy() {
    this.privacyDis = true;
  }

  closePrivacy() {
    this.privacyDis = false;
  }

  openReleaseNotes() {
    this.releaseNotes = true;
  }

  closeReleaseNotes() {
    this.releaseNotes = false;
  }
  openContactUsPanel() {
    this.resetFlagsTicket();
    this.contactUsTicketFlag = true;
    this.updateBreadcrumb("Contact Us");
    this.isFacilityDropdownDisabled = true;

    // Clear internal tracked values
    this.activeMenu = "";
    this.activeSubmenu = "";

    // ✅ Remove ALL active menu highlights manually
    const allMenuLinks = this.template.querySelectorAll(".menu-link.active");
    allMenuLinks.forEach((link) => link.classList.remove("active"));

    const allSubmenuLinks = this.template.querySelectorAll(".subcat a.active");
    allSubmenuLinks.forEach((link) => link.classList.remove("active"));
  }



// subscribeToTsignMessage() {
//   subscribe(this.context, TSIGN_MESSAGE_CHANNEL, (message) => {
//     try {
//       // --- 1) Always read AWS URL (old or new key) ---
//       const awsUrl = message?.tsignreUrl;

//       // --- 2) Backward compatibility (old payload uses recordId) ---
//       const legacyRecordId = message?.recordId;

//       // --- 3) New payload fields ---
//       const source = message?.source;       // "SERVICE" | "QUOTE" | "FORM"
//       const serviceId = message?.serviceId || message?.recordId || null;
//       const quoteId = message?.quoteId;     // explicit quote id

//       const clientEmail = message?.clientEmail;
 
//       if (clientEmail) {

//         this.tsignEmail = clientEmail;

//         console.log("📧 Client Email stored in Dashboard:", this.tsignEmail);

//       }
//       // --- 4) Determine which ID to use ---
//       // Priority:
//       //  - If new payload has source, trust it
//       //  - Else fall back to old payload behavior
//       let resolvedServiceId = null;
//       let resolvedQuoteId = null;
//       let resolvedFormId = null;

//       if (source === "SERVICE") {
//         resolvedServiceId = serviceId || legacyRecordId || null;

//       } else if (source === "QUOTE") {
//         resolvedQuoteId = quoteId || null;

//       } else if (source === "FORM") {
//         // Forms: treat recordId as Dynamic_Form_Response__c Id
//         // (No change to legacy behavior because this block only runs when source is explicitly FORM)
//         resolvedFormId = legacyRecordId || null;

//       } else {
//         // Legacy mode: treat recordId as Service Agreement Id
//         resolvedServiceId = legacyRecordId || serviceId || null;
//       }

//       // --- 5) Validate minimal required data ---
//       // For SERVICE: need awsUrl + serviceId
//       // For QUOTE: need awsUrl + quoteId
//       // For FORM: need awsUrl + formId(recordId)
//       const hasServiceFlow = awsUrl && resolvedServiceId;
//       const hasQuoteFlow = awsUrl && resolvedQuoteId;
//       const hasFormFlow = awsUrl && resolvedFormId;

//       if (!hasServiceFlow && !hasQuoteFlow && !hasFormFlow) {
//         console.warn("⚠️ Missing/invalid data in received TSign message:", message);
//         return;
//       }

//       // --- 6) Store values safely ---
//       this.tsignreUrl = awsUrl;

//       // Keep your existing serviceId prop intact
//       this.serviceId = hasServiceFlow ? resolvedServiceId : null;
//       this.quoteId = hasQuoteFlow ? resolvedQuoteId : null; // already planned
//       this.formId = hasFormFlow ? resolvedFormId : null;    // NEW

//       // Preserve your existing defaulting logic, now extended for FORM
//       this.source =
//         source ||
//         (hasQuoteFlow ? "QUOTE" : (hasFormFlow ? "FORM" : "SERVICE"));

//       console.log("📌 Source stored in Dashboard:", this.source);

//       // Logging (do not assume recordId exists anymore)
//       console.log("📌 AWS URL received in Dashboard:", this.tsignreUrl);

//       if (this.serviceId) {
//         console.log("📌 Service Agreement ID received in Dashboard:", this.serviceId);
//       }
//       if (this.quoteId) {
//         console.log("📌 Quote ID received in Dashboard:", this.quoteId);
//       }
//       if (this.formId) {
//         console.log("📌 Form Response ID received in Dashboard:", this.formId);
//       }

//       // --- 7) Redirect ---
//       this.handleTsignRedirect();

//     } catch (e) {
//       console.error("❌ Error while processing TSign LMS message:", e, message);
//     }
//   });
// }

subscribeToTsignMessage() {
  subscribe(this.context, TSIGN_MESSAGE_CHANNEL, (message) => {
    try {
      // --- 1) Always read AWS URL (old or new key) ---
      const awsUrl = message?.tsignreUrl;

      // --- 2) Backward compatibility (old payload uses recordId) ---
      const legacyRecordId = message?.recordId;

      // --- 3) New payload fields ---
      const source = message?.source; // "SERVICE" | "QUOTE" | "FORM" | "HR"
      const serviceId = message?.serviceId || message?.recordId || null;
      const quoteId = message?.quoteId;
      const hrId = message?.hrId;

      const clientEmail = message?.clientEmail;

      if (clientEmail) {
        this.tsignEmail = clientEmail;
        console.log("📧 Client Email stored in Dashboard:", this.tsignEmail);
      }

      // --- 4) Determine which ID to use ---
      // Priority:
      //  - If new payload has source, trust it
      //  - Else fall back to old payload behavior

      let resolvedServiceId = null,
          resolvedQuoteId = null,
          resolvedFormId = null,
          resolvedHrId = null;

      if (source === "SERVICE") resolvedServiceId = serviceId || legacyRecordId || null;
      else if (source === "QUOTE") resolvedQuoteId = quoteId || null;
      else if (source === "FORM") resolvedFormId = legacyRecordId || null; // Dynamic_Form_Response__c Id
      else if (source === "HR") resolvedHrId = hrId || legacyRecordId || null;
      else resolvedServiceId = legacyRecordId || serviceId || null; // Legacy mode

      // --- 5) Validate minimal required data ---
      // SERVICE → awsUrl + serviceId
      // QUOTE → awsUrl + quoteId
      // FORM → awsUrl + formId
      // HR → awsUrl + hrId

      const hasServiceFlow = awsUrl && resolvedServiceId,
            hasQuoteFlow = awsUrl && resolvedQuoteId,
            hasFormFlow = awsUrl && resolvedFormId,
            hasHrFlow = awsUrl && resolvedHrId;

      if (!hasServiceFlow && !hasQuoteFlow && !hasFormFlow && !hasHrFlow) {
        console.warn("⚠️ Missing/invalid data in received TSign message:", message);
        return;
      }

      // --- 6) Store values safely ---
      this.tsignreUrl = awsUrl;

      this.serviceId = hasServiceFlow ? resolvedServiceId : null;
      this.quoteId = hasQuoteFlow ? resolvedQuoteId : null;
      this.formId = hasFormFlow ? resolvedFormId : null;
      this.hrId = hasHrFlow ? resolvedHrId : null;

      // Preserve existing defaulting logic
      this.source = source || (hasQuoteFlow ? "QUOTE" : hasFormFlow ? "FORM" : hasHrFlow ? "HR" : "SERVICE");

      console.log("📌 Source stored in Dashboard:", this.source);
      console.log("📌 AWS URL received in Dashboard:", this.tsignreUrl);

      if (this.serviceId) console.log("📌 Service Agreement ID received in Dashboard:", this.serviceId);
      if (this.quoteId) console.log("📌 Quote ID received in Dashboard:", this.quoteId);
      if (this.formId) console.log("📌 Form Response ID received in Dashboard:", this.formId);
      if (this.hrId) console.log("📌 HR ID received in Dashboard:", this.hrId);

      // --- 7) Redirect ---
      this.handleTsignRedirect();

    } catch (e) {
      console.error("❌ Error while processing TSign LMS message:", e, message);
    }
  });
}

@track quoteId = null;
@track formId = null;
@track hrId = null;

handleTsignRedirect() {
  console.log("📌 AWS URL stored in Dashboard:", this.tsignreUrl);
  console.log("📌 service id stored in Dashboard:", this.serviceId);
  console.log("📌 quote id stored in Dashboard:", this.quoteId);
  console.log("📌 form id stored in Dashboard:", this.formId);
  console.log("📌 hr id stored in Dashboard:", this.hrId);

  // Reset all other module flags
  this.resetFlags();

  // Force rerender before opening TSign
  Promise.resolve().then(() => {

    // Set T Sign specific flags
    this.tSignflag = true;

    // Highlight the T Sign menu
    this.setActiveMenu("T sign");
    this.updateBreadcrumb("T sign");

  });
}

handleTemplateReset() {
  this.resetTsignContext();
}


resetTsignContext() {
  console.log("🔄 [Dashboard] Resetting TSign context");

  // ✅ Clear client email
  this.clientEmail = "";
  this.tsignEmail = ""; 

  // ✅ Clear LMS / context values
  this.awsUrl = "";
  this.source = null;
  this.serviceId = null;
  this.quoteId = null;
  this.formId = null;
  this.hrId = null;

  // ✅ Optional: guard flag so LMS won’t publish again
  this._tsignActive = false;

  console.log("✅ [Dashboard] TSign context cleared");
}


  // subscribeToCreateComoanyMessage() {
  //   subscribe(this.context, CREATE_COMPANY_CHANNEL, (message) => {
  //     try {
      
  //       const source = message?.source;       // "FACILITY" | "Manage Invoice" 
  //       const facilityId = message?.facilityId 
  //       const orgIdTrack  = message?.orgidtrack;   

  //       if (!orgIdTrack || !facilityId) {
  //         console.warn(
  //           "⚠️ Missing orgIdTrack or facilityId in Create Company message:",
  //           message
  //         );
  //         return;
  //       }
  //       this.source = source || "UNKNOWN";
  //       this.accountingOrgId = orgIdTrack;
  //       this.accountingFacilityId = facilityId;

  //       console.log("📌 Create Company Source:", this.source);
  //       console.log("📌 Org ID Track:", this.accountingOrgId);
  //       console.log("📌 Facility ID:", this.accountingFacilityId);

  //       // Redirect
  //       this.handleCreateCompanyRedirect();

  //     } catch (error) {
  //       console.error(
  //         "❌ Error handling Create Company message:",
  //         error,
  //         message
  //       );
  //     }
  //   });
  // }
  // handleCreateCompanyRedirect() {
  
  //   console.log("📌 accountingOrgId stored in Dashboard:", this.accountingOrgId);
  //   console.log("📌 accountingFacilityId id stored in Dashboard:", this.accountingFacilityId);
   
  //   // Reset all other module flags
  //   this.resetFlags();
  //   this.triggerAccountingNdisPayrollSettings();
   
  // }
  @wire(getRecord, {
    recordId: Id,
    fields: [UserNameFld, UserEmail, UsrRoleName, UserTypeName, ITSupport, UserTypeOfUser]
  })
  userDetails({ error, data }) {
    if (data) {
      this.currentUser = data.fields.Name.value;
      this.currentUserEmail = data.fields.Email.value;
      this.currentUserRole = data.fields.User_Role__c.value;
      this.currentUserType = data.fields.User_Type__c.value;
      this.IsItSupport = data.fields.IT_Support__c.value;
      this.typeofuser = data.fields.Type_of_User__c.value;
      console.log("this.currentUserRole====>" + this.currentUserRole);
      console.log("this.currentUserType====>" + this.currentUserType);
      console.log("this.ITSupport====>" + this.IsItSupport);
       console.log("this.typeofuser====>" + this.typeofuser);

      if(this.currentUserType === "Support Coordinator"){
        this.dashboardflag = false;
        this.supportCoordinatorflag = true;
        this.supportCoordinator = true;
      }
      if (
        this.currentUserType === "HR Admin" ||
        this.currentUserType === "NDIS Org Admin" ||
        // this.currentUserType === "Roster Manager" ||
        this.currentUserType === "Facility Admin"
      ) {
        this.isLibraryGoal = true;
      } else {
        this.isLibraryGoal = false;
      }
      if (this.currentUserType === "Facility Admin") {
        this.isFacilityAdmin = true;
      }

      if (
        this.currentUserRole == "Portal Account Partner Executive" ||
        this.currentUserRole == "Portal Account Partner Manager" ||
        this.currentUserRole == "CEO" ||
        this.currentUserRole == "Admin"
      ) {
        this.superiors = true;
      }
      if (
        (this.currentUserRole === "Portal Account Partner Executive" ||
          this.currentUserRole === "CEO") &&
        this.IsItSupport === "Yes"
      ) {
        this.TSupportModule = true;
      } else {
        this.superiors = false;
      }

       if (
      this.typeofuser === "NDIS" &&
      (
        this.currentUserRole === "Portal Account Partner Executive" ||
        this.currentUserRole === "Portal Account Partner Manager" ||
        this.currentUserRole === "CEO"||
        this.currentUserRole == "Admin"
      )
    ) {
      this.cmsDisplay = true;
    } else {
      this.cmsDisplay = false;
    }

     if (
      this.currentUserType === "Support" ||
      this.currentUserType === "Accountant for Organisation"
    ) {
      this.isAdminChat = true;
    } else {
      this.isAdminChat = false;
    }

    console.log("isAdminChat => " + this.isAdminChat);
    console.log("cmsDisplay => " + this.cmsDisplay);
      console.log("current role " + this.currentUserRole);
      console.log(" staffUser " + this.staffuser);
      console.log(" org admin  " + this.orgadmin);
      console.log(" superiorflag  " + this.superiors);
    } else if (error) {
      this.usererror = error;
    }
  }
  // @wire(getStaffByEmail, { email: '$currentUserEmail' })
  // wiredClient(result) {
  //      this.wiredClientResult = result;
  //      console.log('Result: ', result); // Debugging line

  //      const { data, error } = result;
  //      if (data) {
  //          console.log('parent Data: ', data); // Debugging line
  //          this.clientData = data;
  //          this.StaffId = this.clientData[0].Id;

  //      } else if (error) {
  //          console.error('Error: ', error); // Debugging line
  //          this.handleError(error);
  //      }
  // }
  @track isAdminChat = false;
  @track cmsDisplay = false;
   @track ndisFlag;
   @track ndisCreateFlag = false;
   @track nonndisFlag = false;
   @track individualFlag = false;
   @track CompanyFlag = false;
   @track participantName;

  

  wiredParticipantResult;
  @wire(getClientById, { email: "$currentUserEmail" })
  wiredParticipant(result) {
    this.wiredParticipantResult = result;
    const { data, error } = result;
    if (data) {
      this.clientData = data;
      this.clientId = this.clientData[0].Id;
      console.log('this.clientData',JSON.stringify(this.clientData));
      console.log("Client Id >>" + this.clientId);
      console.log("Client data:", JSON.stringify(this.clientData));
      let typeofservice = this.clientData[0].Facility__r.Type_of_Service__c;
      this.participantName=this.clientData[0].Name__c;
      let ParticipantType = this.clientData?.[0]?.ParticipantType__c ?? null;

      console.log('typeofservice',typeofservice)

      this.ndisFlag = (typeofservice === 'NDIS');
            if (!this.ndisFlag) {
              console.log(' typeofservice inside !this.ndisFlag ', typeofservice);
              console.log(' this.participantPreferredName inside !this.ndisFlag ', this.participantPreferredName);
              console.log(' ParticipantType inside !this.ndisFlag ', ParticipantType);
              
            this.individualFlag = (ParticipantType === 'Individual');
            console.log('Participant type 1985',ParticipantType);
            this.CompanyFlag = (ParticipantType === 'Company');
            console.log('line 1986', this.CompanyFlag);
             this.ndisCreateFlag=false;
              console.log( 'this.individualFlag,this.CompanyFlag,this.ndisCreateFlag 1981 IF COND'+this.individualFlag+ this.CompanyFlag + this.ndisCreateFlag);
             /*  if(this.currentUserType === "NDIS Participants"){
                this.participantdetails.service = 'NDIS';
                 this.participantdetails.type = 'ParticipantType';
              } *///manendra
              
        } else {
            // If NDIS is true, all others false
            this.individualFlag = false;
            this.CompanyFlag = false;
            this.ndisCreateFlag=true;
             console.log( 'this.individualFlag,this.companyFlag,this.ndisCreateFlag'+this.individualFlag+ this.companyFlag + this.ndisCreateFlag)
          
        }


    } else if (error) {
      this.handleError(error);
    }
  }

  @track staffid = "";
  @track staffidflag;
  @track isStaffView = false;

  /*  handleTaskEdit(event) {
   // this.modulewisedisplaying();

    const taskType = event.detail.taskType;
    const whatId = event.detail.whatId;
    console.log('taskType',taskType);
   if (taskType === 'Leave Request') {
        const newTaskType = 'Leave Management';
        console.log('taskType',taskType);
        console.log('newTaskType',newTaskType);
        this.handleRedirectMessage({ taskType: newTaskType });
    }
    
   
  } */

  @track shiftEnableGeolocation = false;
  @track shiftEnableSignin = false;
  @track shiftwithstaffId;
  @track signInRequesttemplate = false;
  @track staffIdforweekly;
  @track signin;
  @track signout;
  @track shiftEnableSignout;
  @track staffName;
  @track Shifttype;
  @track StaffRole;
  @track shifttimmings;
  @track shiftDate;
  @track signOutComments;
  @track isAtLoc;
  @track distFromLoc;

  handleTaskEdit(event) {
    this.modulewisedisplaying();

    const taskType = event.detail.taskType;
    const whatId = event.detail.whatId;
    const participantType = event.detail.participantType;
    const serviceType = event.detail.serviceType;
    console.log("whatId---", whatId);
    console.log("taskType---", taskType);

    switch (taskType) {
      case "Approval Request":
        this.submissionFlag = true;
        //this.isRosterMenuVisible = true;

        this.simulateClick('.menu-link[data-field="Roster Manager"]');
        this.simulateClick('.subcat a[data-field="Reimbursement"]');

        /*  setTimeout(() => {
          const rosterModuleEvent = new Event("click");
          const rosterMenuItem = this.template.querySelector(
            `.menu-link[data-field="Roster Manager"]`
          );
          if (rosterMenuItem) {
            rosterMenuItem.dispatchEvent(rosterModuleEvent);
          }
        });

        setTimeout(() => {
          const reimbursementSubMenuEvent = new Event("click");
          const reimbursementMenuItem = this.template.querySelector(
            `.subcat a[data-field="Reimbursement"]`
          );
          if (reimbursementMenuItem) {
            reimbursementMenuItem.dispatchEvent(reimbursementSubMenuEvent);
          }
        }); */

        break;

      case "Incident Register":
        this.incidentFlag = true;
        this.simulateClick('.menu-link[data-field="Incident Register"]');

        /* setTimeout(() => {
          const incidentModuleEvent = new Event("click");
          const incidentMenuItem = this.template.querySelector(
            `.menu-link[data-field="Incident Register"]`
          );
          if (incidentMenuItem) {
            incidentMenuItem.dispatchEvent(incidentModuleEvent);
          }
        }); */

        break;
      case "Enable Sign out for Shift":
        this.simulateClick('.menu-link[data-field="Dashboard"]');
        getAddShiftDataById({ shiftId: whatId }).then((result) => {
          // console.log('result',JSON.stringify(result));
          this.signInRequesttemplate = true;
          this.signin = false;
          this.signout = true;
          this.shiftEnableGeolocation =
            result.shiftwithstaffdata.Staff__r.Enable_Geolocation__c;
          this.shiftEnableSignin = result.shiftwithstaffdata.Enable_Sign_In__c;
          this.staffIdforweekly = result.shiftwithstaffdata.Staff__c;
          this.shiftwithstaffId = result.shiftwithstaffdata.Id;
          this.staffName = result.shiftwithstaffdata.Full_Name__c;
          this.Shifttype = result.shiftwithstaffdata.Add_Shift__r.Shift_Type__c;
          this.signOutComments =
            result.shiftwithstaffdata.Request_sign_out_comments__c;
          this.StaffRole = result.shiftwithstaffdata.Add_Shift__r.Role__c;
          this.shifttimmings =
            result.shiftwithstaffdata.Add_Shift__r.Shift_Start_End_Time__c;
          this.shiftDate = new Date(
            result.shiftwithstaffdata.Add_Shift__r.Start_Date__c
          ).toLocaleDateString("en-GB");
          console.log("staff geo location " + this.shiftEnableGeolocation);
          console.log("shift enbale Loctaion " + this.shiftEnableSignin);
        });

        break;
      case "Enable Sign in for Shift":
        this.simulateClick('.menu-link[data-field="Dashboard"]');
        getAddShiftDataById({ shiftId: whatId }).then((result) => {
          // console.log('result',JSON.stringify(result));
          this.signInRequesttemplate = true;
          this.signin = true;
          this.signout = false;
          this.shiftEnableGeolocation =
            result.shiftwithstaffdata.Staff__r.Enable_Geolocation__c;
          this.shiftEnableSignin = result.shiftwithstaffdata.Enable_Sign_In__c;
          this.staffIdforweekly = result.shiftwithstaffdata.Staff__c;
          this.shiftwithstaffId = result.shiftwithstaffdata.Id;
          this.staffName = result.shiftwithstaffdata.Full_Name__c;
          this.Shifttype = result.shiftwithstaffdata.Add_Shift__r.Shift_Type__c;
          this.signOutComments =
            result.shiftwithstaffdata.Request_sign_out_comments__c;
          this.StaffRole = result.shiftwithstaffdata.Add_Shift__r.Role__c;
          this.shifttimmings =
            result.shiftwithstaffdata.Add_Shift__r.Shift_Start_End_Time__c;
          this.shiftDate = new Date(
            result.shiftwithstaffdata.Add_Shift__r.Start_Date__c
          ).toLocaleDateString("en-GB");
          this.isAtLoc =
            result.shiftwithstaffdata.Add_Shift__r.Is_at_location__c;
          this.distFromLoc =
            result.shiftwithstaffdata.Add_Shift__r.Distance_from_location__c;
          console.log("staff geo location " + this.shiftEnableGeolocation);
          console.log("shift enbale Loctaion " + this.shiftEnableSignin);
          console.log("is At Location" + this.isAtLoc);
          console.log("distance from Location" + this.distFromLoc);
        });

        break;

      case "Staff Document Expiry":
        this.isTaskNavigation = true;
        this.staffidflag = "Staff Document Expiry";
        this.isAdminMenuVisible = true;
        console.log("whatid" + whatId);
        this.staffflag = true;
        /*  setTimeout(() => {
          const adminMenuItem = this.template.querySelector(
            `.menu-link[data-field="Admin"]`
          );
          if (adminMenuItem) {
            adminMenuItem.click(); // ✅ use real click
          }
        });

        setTimeout(() => {
          const staffSubmenu = this.template.querySelector(
            `.subcat a[data-field="Staff"]`
          );
          if (staffSubmenu) {
            staffSubmenu.click(); // ✅ use real click
          }
        }); */
        this.simulateClick('.menu-link[data-field="Facility Admin"]');
        this.simulateClick('.subcat a[data-field="Facility Staff"]');
        const staffEvent = new CustomEvent("staffidchange", {
          detail: { StaffIdFromTask: whatId }, // whatId is your actual value
          bubbles: true,
          composed: true
        });
        const child = this.template.querySelector("c-staff-data-community");
        if (child) {
          child.openCreateEditStaff(whatId); // ✅ @api method in child
        }
        this.staffid = whatId;

        break;
      case "Leave Request":
        this.leaveFlag = true;
        this.taskLeaveId = whatId;
        this.openFromTask = true;

        this.simulateClick('.menu-link[data-field="Human Resources"]');
        this.simulateClick('.subcat a[data-field="Leave Management"]');

        break;
      case "Funds Tracker":
        this.participantFlag = true;
        /*   this.simulateClick('.menu-link[data-field="Participants"]');
         const child2 = this.template.querySelector('c-participant-module-lwc');
        if (child2) {
            child2.opendetailslwc(whatId); // ✅ @api method in child
        } */
        this.participantdetails = {
          id: whatId,
          type: participantType,
          service: serviceType
        };

        setTimeout(() => {
          const participantModuleEvent = new Event("click");
          const participantMenuItem = this.template.querySelector(
            `.menu-link[data-field="Participants"]`
          );
          if (participantMenuItem) {
            participantMenuItem.dispatchEvent(participantModuleEvent);
          }
        });
        ``;

        break;

      default:
        this.dashboardflag = true;
    }
  }

  handleDashboardevent(event) {
    this.modulewisedisplaying();

    const name = event.detail.message;
    console.log("dashboard name" + name);

    switch (name) {
      case "Award":
        this.rewardsFlag = true;

        this.simulateClick('.menu-link[data-field="Human Resources"]');
        this.simulateClick('.subcat a[data-field="Awards & Recognition"]');

        break;

      case "Trainings":
        // Example of another case with different selectors
        this.trainingFlag = true;

        this.simulateClick('.menu-link[data-field="Human Resources"]');
        this.simulateClick('.subcat a[data-field="Training & Evaluation"]');

        break;
      case "Jobs":
        this.recruitmentFlag = true;

        this.simulateClick('.menu-link[data-field="Human Resources"]');
        this.simulateClick('.subcat a[data-field="Recruitment"]');

        break;
      case "Human Resources":
        this.staffflag = true;
        this.simulateClick('.menu-link[data-field="Human Resources"]');
        break;
      case "Sign in":
        this.SignInFlag = true;
        this.simulateClick('.menu-link[data-field="Sign In"]');
        break;
      case "Roster Manager":
        this.addshiftFlag = true;
        this.isStaffView = true;
        this.simulateClick('.menu-link[data-field="Roster Manager"]');
        break;
      case "Invoice":
        this.payrollinvoiceFlag = true;
        this.simulateClick('.menu-link[data-field="Payroll"]');
        this.simulateClick('.subcat a[data-field="Invoices"]');
        break;
      case "Incident Register":
        this.incidentFlag = true;
        this.simulateClick('.menu-link[data-field="Incident Register"]');
        break;
      case "Performance Management":
        this.performanceManagementflag = true;
        this.simulateClick('.menu-link[data-field="Human Resources"]');
        this.simulateClick('.subcat a[data-field="Performance Management"]');
        break;
      case "Participant Details":
        this.participantFlag = true;
        this.simulateClick('.menu-link[data-field="Participants"]');
        break;
      case "Leave Management":
        this.leaveFlag = true;
        this.simulateClick('.menu-link[data-field="Human Resources"]');
        this.simulateClick('.subcat a[data-field="Leave Management"]');
        break;
      case "Staff Details":
        this.staffflag = true;
        this.simulateClick('.menu-link[data-field="Admin"]');
        this.simulateClick('.subcat a[data-field="Staff"]');
        break;
      case "Funds Tracker":
        this.participantFlag = true;
        this.navigatedParticipantId = message.data.participantId;  // ← pass participant
        this.navigatedRecordId = message.data.recordId; 
        this.navigatedAction = 'fundsTracker';   // ← ADD            // ← pass record        
        this.simulateClick('.menu-link[data-field="Participants"]');
        break;
      case "Rejected Shifts":
        this.RejectedFlag = true;
        this.simulateClick('.menu-link[data-field="Roster Manager"]');
        this.simulateClick('.subcat a[data-field="RejectedShift"]');
        break;
      case "Manage Invoices":
        this.ManageInvoiceFlag = true;
        this.simulateClick('.menu-link[data-field="Roster Manager"]');
        this.simulateClick('.subcat a[data-field="ManageInvoices"]');
        break;
      case "ICT Timesheet":
        this.Icttimesheetflag = true;
        this.simulateClick('.menu-link[data-field="ICT Timesheet"]');

        break;
      case "My details":
        this.shiftacceptFlag = true;
        this.simulateClick('.menu-link[data-field="Roster Manager Staff"]');

        break;
      case "Staff Performance Management":
        this.myProfilePerformanceFlag = true;
        this.simulateClick('.menu-link[data-field="My Profile"]');
        this.simulateClick('.subcat a[data-field="MP Performance Management"]');
        break;
      case "Hr Performance Management":
        this.performanceManagementflag = true;
        this.simulateClick('.menu-link[data-field="Human Resources"]');
        this.simulateClick('.subcat a[data-field="Performance Management"]');
        break;
      case "staff Leave Management":
        // this.leaveFlag = true;
        this.simulateClick('.menu-link[data-field="My Profile"]');
        this.simulateClick('.subcat a[data-field="MP Leave Management"]');
        break;

      default:
        this.dashboardflag = true;

        if (this.addshiftFlag == true) {
          console.log("dash board nav in if  " + this.addshiftFlag);
          this.isStaffView = true;
        } else {
          console.log("dash board nav in else  " + this.addshiftFlag);
          this.isStaffView = false;
        }
    }
  }
  simulateClick(selector) {
    setTimeout(() => {
      const element = this.template.querySelector(selector);
      if (element) {
        const event = new Event("click");
        element.dispatchEvent(event);
      }
    });
  }

  fetchStaffDetails() {
    console.log("this.accountingServices fetchStaffDetails ===>" + this.accountingServices);
    getStaffEmailAndModules({ userId: Id })
      .then((result) => {
        if (result.error) {
          console.error("Error fetching staff details:", result.error);
          return;
        }
          console.log('result in satff module==>'+JSON.stringify(result));

        console.log('result.modules==>'+JSON.stringify(result.modules));


        this.staffEmail = result.staffEmail || "No email found";

        if (result.modules && typeof result.modules === "string") {
          this.modules = result.modules.split(";");
        } else {
          this.modules = [];
        }

        console.log("Current Modules:", this.modules);
        this.setModuleFlags();
        this.restoreActiveModule();
      })
      .catch((error) => {
        console.error("Error in fetchStaffDetails:", error);
      });
  }

  setModuleFlags() {
    this.DashboardModule = this.modules.includes("Dashboard");
    this.adminModule = this.modules.includes("Admin");
    this.HrModule = this.modules.includes("Human Resources");
    this.RosterManagementModule = this.modules.includes("Roster Manager");
    this.SignInModule = this.modules.includes("Sign In");
    this.ParticipantsModule = this.modules.includes("Participants");
    this.PayrollModule = this.modules.includes("Payroll");
    this.smartReportsFlag = this.modules.includes("Reports");
    /* this.supportCoordUserModule = this.modules.includes("Support Coordinator"); */
   this.supportCoordUserModule = this.isSupportCoordinator || this.supportcoordinatorNDisflag;
    if(this.supportcoordinatorNDisflag === true){
       this.supportCoordinator = this.supportcoordinatorNDisflag;
    }

    //this.AccountingModule = this.modules.includes("Accounting");
    //const accountingServices = localStorage.getItem("orgAccountingServices");
    console.log('this.accountingServices setModuleFlags >>>>>>>', this.accountingServices);

    const moduleName = this.modules.includes("Accounting");

    switch (this.accountingServices) {
      case 'Xero':
        this.XeroModule = moduleName;
        break;
      case 'MYOB':
        this.MyobModule = moduleName;
        break;
      case 'Quick Books':
        this.QuickBooksModule = moduleName;
        break;
      default:
        this.AccountingModule = moduleName;
        break;
    }

    this.IncidentRegisterModule = this.modules.includes("Incident Register");
    this.RepositoryModule = this.modules.includes("Repository");
    this.SmartReports = this.modules.includes("Reports");
    //this.SmartReports = true;
    
    this.MyProfileModule = this.modules.includes("My Profile");
    this.PerformanceManagementModule1 = this.modules.includes(
      "Performance Management"
    );
    this.AccessManagerModule = this.modules.includes("Access Manager");
    this.TSignModule = this.modules.includes("T sign");
    // this.TSupportModule = this.modules.includes('T Support');
    this.ICTModule = this.modules.includes("ICT Timesheets");
    this.FormsModule = this.modules.includes("Forms");
  }

  restoreActiveModule() {
    const mainModule = sessionStorage.getItem("activeModule"); // e.g., "Admin"
    const subModule = sessionStorage.getItem("activeContent"); // e.g., "Participant"

    console.log("[🌀 restoreActiveModule] mainModule:", mainModule);
    console.log("[🌀 restoreActiveModule] subModule:", subModule);

    setTimeout(() => {
      const mainSelector = `.menu-link[data-field="${mainModule}"]`;
      const mainElement = this.template.querySelector(mainSelector);
      console.log(`[🔍] Main selector: ${mainSelector}`);
      console.log("[🔍] Found main:", mainElement);

      if (mainElement) {
        mainElement.click();
        console.log(`✅ Clicked main menu: ${mainModule}`);

        // Wait for submenu DOM to be available
        if (subModule) {
          setTimeout(() => {
            const subSelector = `.subcat a[data-field="${subModule}"]`;
            const subElement = this.template.querySelector(subSelector);
            console.log(`[🔍] Sub selector: ${subSelector}`);
            console.log("[🔍] Found sub:", subElement);

            if (subElement) {
              subElement.click();
              console.log(`✅ Clicked sub menu: ${subModule}`);
            } else {
              console.warn(`⚠️ Could not find submenu: ${subModule}`);
            }
          }, 300); // wait after main menu opens
        }
      } else {
        console.warn(`[⚠️] Could not find main menu: ${mainModule}`);
        const fallback = this.template.querySelector(
          '.menu-link[data-field="Dashboard"]'
        );
        if (fallback) {
          fallback.click();
          console.log("[✅] Dashboard fallback triggered.");
        }
      }
    }, 300);
  }

  // Function to Redirect to Dashboard
  redirectToDashboard() {
    this.resetFlags();
    this.dashboardflag = true;
    this.setActiveMenu("dashboard");
    this.updateBreadcrumb("Dashboard");
    this.isFacilityDropdownDisabled = false;
  }
  setActiveMenu(menuName) {
    // Remove active class from all main menu links
    const allMenuLinks = this.template.querySelectorAll(".menu-link");
    allMenuLinks.forEach((link) => link.classList.remove("active"));

    // Remove active class from all submenu items
    const allSubmenuLinks = this.template.querySelectorAll(".subcat a");
    allSubmenuLinks.forEach((link) => link.classList.remove("active"));

    // Set active class for main menu item
    const activeMenu = this.template.querySelector(
      `[data-content="${menuName}"]`
    );
    if (activeMenu) {
      activeMenu.classList.add("active");
    }

    // Set active class for submenu items if applicable
    const activeSubmenu = this.template.querySelector(
      `.subcat a[data-content="${menuName}"]`
    );
    if (activeSubmenu) {
      activeSubmenu.classList.add("active");
    }
  }

  // Function to Reset All Flags
  resetFlags() {
    this.staffid = "";
    this.Adminflag = false;
    this.facilityflag = false;
    this.clientflag = false;
    this.participantLoginFlag = false;
    this.staffflag = false;
    this.rewardsFlag = false;
    this.hrflag = false;
    this.trainingFlag = false;
    this.leaveFlag = false;
    this.myTemplatesFlag = false;
    this.recruitmentFlag = false;
    this.addshiftFlag = false;
    this.shiftacceptFlag = false;
    this.attendenceFlag = false;
    this.rosterTimeSheet = false;
    this.submissionFlag = false;
    this.SignInFlag = false;
    this.participantFlag = false;
    this.payrollFlag = false;
    this.payrollexpenseFlag = false;
    this.payrollinvoiceFlag = false;
    this.payrollwagesFlag = false;
    this.payrollSettingsFlag = false;
    this.incidentFlag = false;
    this.repositoryFlag = false;
    this.smartReportsFlag = false;
    this.AccountingFlag = false;
    this.MasterDBFlag = false;
    this.StaffAvailabilityFlag = false;
    this.profileflag = false;
    this.awardFlag = false;
    this.profiletrainingFlag = false;
    this.profileleaveFlag = false;
    this.reportsFlag = false;
    this.masterFlag = false;
    this.ledgerEntryFlag = false;
    this.ledgerReportFlag = false;
    this.chartofAccountFlag = false;
    this.profitandlossFlag = false;
    this.balancesheetFlag = false;
    this.activityStatementFlag = false;
    this.accessManagerflag = false;
    this.tSignflag = false;
    this.tSupportflag = false;
    this.supportCoordinatorflag = false;
    this.supportParticipantflag = false;
    this.supportTaskflag = false;
    this.supportGoalsflag = false;
    this.supportProvidersflag = false;
    this.supportNotesflag = false;
    this.supportBillingflag = false;
    this.supportReportsflag = false;
    this.documentflag = false;
    this.performanceManagementflag = false;
    this.myProfilePerformanceFlag = false;
    this.libraryGoalflag = false;
    this.userAccessManagementflag = false;
    this.userResetPasswordflag = false;
    this.userStaffManagementflag = false;
    this.userStaffReportflag = false;
    this.Icttimesheetflag = false;
    this.formsflag = false;
    this.ticketflag = false;
    this.manageformsflag = false;
    this.isAdminMenuVisible = false;
    this.isHrMenuVisible = false;
    this.isRosterMenuVisible = false;
    this.isPayrollMenuVisible = false;
    this.isMyProfileMenuVisible = false;
    this.isUserManagementVisible = false;
    this.isAccountingMenuVisible = false;
    this.supportCoordinatormoduleflag = false;
    this.issupportcoordination = false;
    this.isTSignVisible = false;
    this.isPerformanceMenuVisible = false;
    this.isFormsVisible = false;
    this.accountingProfitAndLossFlag = false;
    this.accountingBalanceSheetFlag = false;
    this.accountingReportsFlag = false;
    this.ReconcilationReportsFlag = false;
    this.ndisPayrollFlag = false;
    this.ndisPayrollinvoiceFlag = false;
    this.ndisPayrollexpenseFlag = false;
    this.ndisPayrollwagesFlag = false;
    this.ndisBankFeedFlag = false;
    this.ndisPayrollSettingsFlag = false;
    this.TlearnerFlag = false;
    this.CMSFlag = false;
    this.Tsmart = false;
    this.XeroFlag = false;
    this.MyobFlag = false;
    this.QuickBooksFlag = false;
    this.ndisQuoteToolFlag = false;
  }

  resetFlagsTicket() {
    this.dashboardflag = false;
    this.Adminflag = false;
    this.facilityflag = false;
    this.clientflag = false;
    this.participantLoginFlag = false;
    this.staffflag = false;
    this.rewardsFlag = false;
    this.hrflag = false;
    this.trainingFlag = false;
    this.leaveFlag = false;
    this.myTemplatesFlag = false;
    this.recruitmentFlag = false;
    this.addshiftFlag = false;
    this.shiftacceptFlag = false;
    this.attendenceFlag = false;
    this.rosterTimeSheet = false;
    this.submissionFlag = false;
    this.SignInFlag = false;
    this.participantFlag = false;
    this.payrollFlag = false;
    this.payrollexpenseFlag = false;
    this.payrollinvoiceFlag = false;
    this.payrollwagesFlag = false;
    this.payrollSettingsFlag = false;
    this.incidentFlag = false;
    this.repositoryFlag = false;
    this.smartReportsFlag = false;
    this.AccountingFlag = false;
    this.MasterDBFlag = false;
    this.StaffAvailabilityFlag = false;
    this.profileflag = false;
    this.awardFlag = false;
    this.profiletrainingFlag = false;
    this.profileleaveFlag = false;
    this.reportsFlag = false;
    this.masterFlag = false;
    this.ledgerEntryFlag = false;
    this.ledgerReportFlag = false;
    this.chartofAccountFlag = false;
    this.profitandlossFlag = false;
    this.balancesheetFlag = false;
    this.activityStatementFlag = false;
    this.accessManagerflag = false;
    this.tSignflag = false;
    this.tSupportflag = false;
    this.supportCoordinatorflag = false;
    this.supportParticipantflag = false;
    this.supportTaskflag = false;
    this.supportGoalsflag = false;
    this.supportProvidersflag = false;
    this.supportNotesflag = false;
    this.supportBillingflag = false;
    this.supportReportsflag = false;
    this.documentflag = false;
    this.performanceManagementflag = false;
    this.myProfilePerformanceFlag = false;
    this.libraryGoalflag = false;
    this.userAccessManagementflag = false;
    this.userResetPasswordflag = false;
    this.userStaffManagementflag = false;
    this.userStaffReportflag = false;
    this.Icttimesheetflag = false;
    this.formsflag = false;
    this.ticketflag = false;
    this.manageformsflag = false;
    this.isAdminMenuVisible = false;
    this.isHrMenuVisible = false;
    this.isRosterMenuVisible = false;
    this.isPayrollMenuVisible = false;
    this.isMyProfileMenuVisible = false;
    this.isUserManagementVisible = false;
    this.isAccountingMenuVisible = false;
    this.supportCoordinatormoduleflag = false;
    this.issupportcoordination = false;
    this.isTSignVisible = false;
    this.isPerformanceMenuVisible = false;
    this.isFormsVisible = false;
    this.accountingProfitAndLossFlag = false;
    this.accountingBalanceSheetFlag = false;
    this.accountingReportsFlag = false;
    this.ReconcilationReportsFlag = false;
    this.ndisPayrollFlag = false;
    this.ndisPayrollinvoiceFlag = false;
    this.ndisPayrollexpenseFlag = false;
    this.ndisPayrollwagesFlag = false;
    this.ndisBankFeedFlag = false;
    this.ndisPayrollSettingsFlag = false;
    this.chatterFlag = false;
    this.TlearnerFlag = false;
    this.CMSFlag = false;
    this.XeroFlag = false;
    this.MyobFlag = false;
    this.QuickBooksFlag = false;
    this.hrstaffflag = false;
    this.Tsmart = false;
    this.ndisQuoteToolFlag = false;
    this.ManageInvoiceFlag = false;
  }
  handleCloseTicket() {
    this.contactUsTicketFlag = false;
    this.dashboardflag = true;
    this.setActiveMenu("dashboard");
    this.updateBreadcrumb("Dashboard");
    this.isFacilityDropdownDisabled = false;
  }

  handleCloseQuote(){
    this.ndisQuoteToolFlag = false;
    this.dashboardflag = true;
    this.setActiveMenu("dashboard");
    this.updateBreadcrumb("Dashboard");
  }

  @wire(getstaffId)
  wiredStaffId({ error, data }) {
    console.log("⚡ wiredStaffId invoked");

    if (data) {
      this.staffId = data;
      this.displayName = data.Display_Nickname__c;
      this.error = undefined;
      
      console.log(
        "✅ Staff ID received from Apex:",
        JSON.stringify(this.staffId)
      );
    } else if (error) {
      this.error = error;
      this.staffId = undefined;

      console.error("❌ Error fetching Staff ID:", JSON.stringify(this.error));
    } else {
      console.log("ℹ️ No data and no error yet (wire service pending)...");
    }
  }

  @wire(getStaffByEmail, { email: "$currentUserEmail" })
  wiredClient(result) {
    this.wiredClientResult = result;
    console.log("Result: ", result); // Debugging line

    const { data, error } = result;
    if (data) {
      console.log("parent Data: ", data); // Debugging line
      this.clientData = data;
      this.StaffId = this.clientData[0].Id;
    } else if (error) {
      console.error("Error: ", error); // Debugging line
      this.handleError(error);
    }
  }

  handleMenuClick(event) {
    const allMenuLinks = this.template.querySelectorAll(".menu-link");
    allMenuLinks.forEach((link) => link.classList.remove("active"));

    let clickedLink = event?.target?.closest?.(".menu-link") || null;

    // 🧠 Support fake event triggered from JS (like in triggerMenuByName)
    if (!clickedLink && event?.target?.dataset?.field) {
      clickedLink = Array.from(allMenuLinks).find(
        (link) =>
          link.dataset.field?.toLowerCase() ===
          event.target.dataset.field.toLowerCase()
      );
    }

    if (clickedLink) {
      clickedLink.classList.add("active");
      this.activeMenu = clickedLink.dataset.field || "";
      console.log(
        `✅ handleMenuClick → Activated Main Menu: "${this.activeMenu}"`
      );
    } else {
      console.warn("⚠️ handleMenuClick → No valid main menu clicked.");
    }
  }

  // handleSubmenuClick(event) {
  //    const submenuLinks = this.template.querySelectorAll('.subcat a');
  //    submenuLinks.forEach(link => link.classList.remove('active'));

  //    let clickedSubmenuLink = event?.target?.closest('a');

  //    if (!clickedSubmenuLink && event?.target?.dataset?.field) {
  //        clickedSubmenuLink = Array.from(submenuLinks).find(
  //            link => link.dataset.field?.toLowerCase() === event.target.dataset.field.toLowerCase()
  //        );
  //    }

  //    if (clickedSubmenuLink) {
  //        clickedSubmenuLink.classList.add('active');
  //        this.activeSubmenu = clickedSubmenuLink.dataset.field || clickedSubmenuLink.textContent.trim();
  //        console.log(`✅ handleSubmenuClick → Activated Submenu: "${this.activeSubmenu}"`);
  //    } else {
  //        console.warn('⚠️ handleSubmenuClick → No valid submenu clicked.');
  //    }
  // }

  handleSubmenuClick(event) {
    let submenuLinks = [];
    try {
      submenuLinks = this.template.querySelectorAll(".subcat a");
      submenuLinks.forEach((link) => link.classList.remove("active"));
    } catch (e) {
      console.warn("⚠️ Could not query .subcat a:", e);
    }

    let clickedSubmenuLink = event?.target?.closest?.("a");

    if (!clickedSubmenuLink && event?.target?.dataset?.field) {
      clickedSubmenuLink = Array.from(submenuLinks).find(
        (link) =>
          link.dataset.field?.toLowerCase() ===
          event.target.dataset.field.toLowerCase()
      );
    }

    if (clickedSubmenuLink) {
      clickedSubmenuLink.classList.add("active");
      this.activeSubmenu =
        clickedSubmenuLink.dataset.field ||
        clickedSubmenuLink.textContent.trim();
      console.log(
        `✅ handleSubmenuClick → Activated Submenu: "${this.activeSubmenu}"`
      );
    } else {
      // 🚨 LMS fallback — DOM element doesn’t exist
      this.activeSubmenu = event?.target?.dataset?.field || "Unknown";
      console.warn(
        `⚠️ handleSubmenuClick → DOM not found, fallback activated: "${this.activeSubmenu}"`
      );
    }

    // Optional: update title
    // document.title = `${this.activeMenu} - ${this.activeSubmenu} | TesseractApps`;
  }

  findActiveMainMenuName() {
    const activeMainMenu = this.template.querySelector(".menu-link.active");
    return activeMainMenu?.dataset?.field || "Dashboard";
  }

  modulewisedisplaying() {
    this.isAdminMenuVisible = false;
    this.isHrMenuVisible = false;
    this.isRosterMenuVisible = false;
    this.isPayrollMenuVisible = false;
    this.isMyProfileMenuVisible = false;
    this.isAccountingMenuVisible = false;
    this.supportCoordinatormoduleflag = false;
    this.issupportcoordination = false;
    this.Adminflag = false;
    this.clientflag = false;
    this.participantLoginFlag = false;
    this.staffflag = false;
    this.facilityflag = false;
    this.rewardsFlag = false;
    this.trainingFlag = false;
    this.leaveFlag = false;
    this.myTemplatesFlag = false;
    this.recruitmentFlag = false;
    this.addshiftFlag = false;
    this.shiftacceptFlag = false;
    this.attendenceFlag = false;
    this.rosterTimeSheet = false;
    this.submissionFlag = false;
    this.SignInFlag = false;
    this.participantFlag = false;
    this.payrollFlag = false;
    this.payrollexpenseFlag = false;
    this.payrollinvoiceFlag = false;
    this.payrollwagesFlag = false;
    this.payrollSettingsFlag = false;
    this.incidentFlag = false;
    this.repositoryFlag = false;
    this.smartReportsFlag = false;
    this.AccountingFlag = false;
    this.MasterDBFlag = false;
    this.StaffAvailabilityFlag = false;
    this.profileflag = false;
    this.awardFlag = false;
    this.profiletrainingFlag = false;
    this.profileleaveFlag = false;
    this.reportsFlag = false;
    this.staffflag1 = false;
    this.masterFlag = false;
    this.ledgerEntryFlag = false;
    this.ledgerReportFlag = false;
    this.chartofAccountFlag = false;
    this.profitandlossFlag = false;
    this.balancesheetFlag = false;
    this.activityStatementFlag = false;
    this.accessManagerflag = false;
    this.isUserManagementVisible = false;
    this.tSignflag = false;
    this.tSupportflag = false;
    this.supportCoordinatorflag = false;
    this.supportParticipantflag = false;
    this.supportTaskflag = false;
    this.supportGoalsflag = false;
    this.supportProvidersflag = false;
    this.supportNotesflag = false;
    this.supportBillingflag = false;
    this.supportReportsflag = false;
    this.documentflag = false;
    this.performanceManagementflag = false;
    this.myProfilePerformanceFlag = false;
    this.libraryGoalflag = false;
    this.dashboardflag = false;
    this.isTSignVisible = false;
    this.userAccessManagementflag = false;
    this.userResetPasswordflag = false;
    this.userStaffManagementflag = false;
    this.isHrMenuVisible = false;
    this.isRosterMenuVisible = false;
    this.isPayrollMenuVisible = false;
    this.isMyProfileMenuVisible = false;
    this.isAccountingMenuVisible = false;
    this.supportCoordinatormoduleflag = false;
    this.issupportcoordination = false;
    this.isPerformanceMenuVisible = false;
    this.isUserManagementVisible = false;
    this.isTSignVisible = false;
    this.isFormsVisible = false;
    this.userStaffReportflag = false;
    this.Icttimesheetflag = false;
    this.formsflag = false;
    this.manageformsflag = false;
    this.chatterFlag = false;
    this.accountingProfitAndLossFlag = false;
    this.accountingBalanceSheetFlag = false;
    this.accountingReportsFlag = false;
    this.ReconcilationReportsFlag = false;
    this.ndisPayrollFlag = false;
    this.ndisPayrollinvoiceFlag = false;
    this.ndisPayrollexpenseFlag = false;
    this.ndisPayrollwagesFlag = false;
    this.ndisBankFeedFlag = false;
    this.ndisPayrollSettingsFlag = false;
    this.ticketflag = false;
    this.contactUsTicketFlag = false;
    this.RejectedFlag = false;
    this.ManageInvoiceFlag = false;
    this.RejectedReportsFlag = false;
    this.TlearnerFlag = false;
    this.CMSFlag = false;
    this.XeroFlag = false;
    this.MyobFlag = false;
    this.QuickBooksFlag = false;
    this.Tsmart = false;
    this.hrstaffflag = false;
    this.ndisQuoteToolFlag = false;
  }

  handleClearStaffId() {
    console.log("✅ Staff ID used by child. Clearing now.");
    this.staffid = "";
  }
  // editstaffflag = false;
  // hrStaffAdminFlag = true;
  // cardFlag = false;
  // listFlag = true;
  @track resetHrModuleStaffFlag = false;
  @track resetParticipantModuleFlag = false;
  @track resetRosterModuleFlag = false;
  @track resetTimesheetSubModuleFlag = false;
  @track resetHrLeaveSubModuleFlag = false;
  @track resetRosterRejectedSubFlag = false;
  @track resetIncidentModuleFlag = false;

//To Reset the exisitng modules on click
resetAndActivate(flagName) {
    this[flagName] = false;
    setTimeout(() => {
        this[flagName] = true;
    }, 0);
}


  handleModuleClick(event) {
    this.tsignreUrl = "";

    if (!this.isTaskNavigation) {
      console.log("🔁 Clearing staffid – manual navigation");
      this.staffid = "";
    } else {
      console.log("✅ Preserving staffid – came from task");
      this.isTaskNavigation = false;
    }


    const moduleName = event.currentTarget.dataset.field;

    console.log('moduleName   >>>>>>>>>', moduleName);

    if (this.isStartPlanUser && (moduleName === 'T sign' || moduleName === 'Smart Reports' )) {
        console.log('🚫 Start plan → blocking Accounting');

        this.showUpgradeModal = true;

        return;
    }

    const leavingTsign =
    this.tSignflag &&
    moduleName !== "T sign" &&
    moduleName !== "Document";

  if (leavingTsign) {
    console.log("🚪 Leaving TSign → resetting dashboard TSign context");
    this.resetTsignContext();
  }

  if (moduleName !== "Leave Management") {
  if (!this.openFromTask) {
    console.log("🔁 Clearing leave task id – manual navigation");
    this.taskLeaveId = null;
  } else {
    console.log("✅ Preserving leave task id – came from task");
    // DO NOT reset here yet — let child consume it
  }
}

    const nonFacilityModules = [
      "T sign",
      "My Profile",
      "T Support",
      "Admin",
      "Facility",
      "Facility Admin",
      // "Incident Register",
       "Repository", 
      // "Smart Reports",
      "MP Awards & Recognition",
      "MP Training & Evaluation",
      "MP Leave Management",
      "MP Reports",
      "MP Performance Management",
      "Staff Availability",
      "Manage Library Goal",
      "Document",
      "T Learner",
      "Chatter",
      "NDIS Payroll",
      "NDIS Sales and Purchases",
      "Bank Feed",
      "NDIS Payroll Settings",
      "Accounting",
      "General Ledger",
      "Chart of Accounts",
      "Sign In",
      "My Templates",
      "Support Coordinator",
      "Support Participants",
      "Support Providers",
      "Support Notes",
      "Support Tasks",
      "Support Goals",
      "Support Billing",
      "Support Reports",
      "Forms"
    ];
    this.isFacilityDropdownDisabled = nonFacilityModules.includes(moduleName);
    console.log(
      `[Facility Dropdown] ${this.isFacilityDropdownDisabled ? "❌ Disabled" : "✅ Enabled"} for ${moduleName}`
    );

    const selectedField = event.currentTarget.dataset.field;
    const selectedContent = event.currentTarget.dataset.content;
    console.log(
      `📌 handleModuleClick → content: ${selectedContent}, field: ${selectedField}`
    );

    // ✅ Determine if this is a submenu click
    if (selectedContent && selectedContent !== selectedField) {
      // Submenu (e.g., Participant under Admin)
      sessionStorage.setItem("activeModule", selectedContent); // "Admin"
      sessionStorage.setItem("activeContent", selectedField); // "Participant"
      console.log(
        `[📝] Saved submenu: ${selectedField} under ${selectedContent}`
      );
    } else {
      // Main menu (e.g., Dashboard)
      sessionStorage.setItem("activeModule", selectedField);
      sessionStorage.setItem("activeContent", "");
      console.log(`[📝] Saved main menu: ${selectedField}`);
    }
    const mainModule =
      selectedContent && selectedContent !== selectedField
        ? selectedContent
        : selectedField;
    const subModule =
      selectedContent && selectedContent !== selectedField ? selectedField : "";

    // ✅ Retrieve existing nav map
    let navMap = JSON.parse(sessionStorage.getItem("moduleNavMap")) || {};
    const lastClickedModule = sessionStorage.getItem("lastClickedModule");

    // ✅ Update only the specific main module with its submodule (or empty if none)
    if (subModule !== "") {
      const lastClickedSubmodule = sessionStorage.getItem(
        "lastClickedSubmodule"
      );
      console.log("lastClickedSubmodule INSIDE : ", lastClickedSubmodule);
      // navMap[mainModule] = subModule;
      if (lastClickedSubmodule === subModule) {
        // Submenu clicked again — trigger reset/clear logic here
        // console.log(`🔄 Submenu  inside lastClickedSubmodule if '${subModule}' clicked again — clear/reset local storage or component state here.`);

        // // Example placeholder: clear localStorage or reset component state
        //  this.clearSubmoduleStorage(subModule);
        //  localStorage.removeItem('lastClickedSubmodule');
        if (!this.isAutoOpeningSubmodule) {
          console.log(
            `🔄 Submenu '${subModule}' clicked again explicitly — clearing local storage.`
          );

          this.clearSubmoduleStorage(subModule);
          localStorage.removeItem("lastClickedSubmodule");
        } else {
          console.log(
            `ℹ️ Submenu '${subModule}' auto-opened, skipping clear local storage.`
          );
        }
      } else {
        console.log(`➡️ New submenu '${subModule}' clicked`);
        sessionStorage.setItem("lastClickedSubmodule", subModule);
      }

      // Update navMap and last clicked submenu for submenu clicks
      navMap[mainModule] = subModule;
    } else {
      console.log(`lastClickedModule value is: '${lastClickedModule}'`);
      console.log(`Double-click detected on module: '${mainModule}'`);

      if (lastClickedModule === mainModule) {
        // console.log('if (lastClickedModule === mainModule) called ');
        // // Same module clicked twice → reset submenu
        //  this.clearMainModuleStorage(mainModule);
        //  console.log(`🔄 Main module '${mainModule}' clicked twice → resetting submenu AND Submodule is before  '${subModule}' `);
        // navMap[mainModule] = mainModule;
        // console.log(`🔄 Main module '${mainModule}' clicked twice → resetting submenu AND Submodule is '${subModule}' `);
        const previousSub = navMap[mainModule];
        console.log(
          `🕵️‍♂️ Previously stored submodule for '${mainModule}':`,
          previousSub
        );

        if (
          mainModule === "Roster Manager" &&
          previousSub === "Roster Manager"
        ) {
          localStorage.removeItem("selectedRosterView");
          console.log(
            "🧹 Double-clicked 'Roster Manager' with no submodule → Cleared selectedRosterView"
          );
        } else {
          console.log(
            "⏸️ Not clearing selectedRosterView — last submodule was:",
            previousSub
          );
        }

        this.clearMainModuleStorage(mainModule);
        navMap[mainModule] = mainModule;
      } else {
        // Different module clicked → keep existing submenu if present
        if (!navMap[mainModule]) {
          navMap[mainModule] = mainModule;
          console.log(
            `🆕 First time clicking '${mainModule}', initializing submenu to main module`
          );
        } else {
          console.log(
            `🛑 Different module clicked, preserving submenu '${navMap[mainModule]}' for '${mainModule}'`
          );
        }
        const savedSub = navMap[mainModule];
        if (savedSub && savedSub !== mainModule) {
          console.log(
            `📌 Auto-opening submodule '${savedSub}' for '${mainModule}'`
          );
          this.navigateToSubModule(mainModule);
        }
      }
    }
    sessionStorage.setItem("moduleNavMap", JSON.stringify(navMap));
    sessionStorage.setItem("lastClickedModule", mainModule);
    console.log("📦 Stored moduleNavMap:", JSON.stringify(navMap));

    console.log(
      `[📝] Saved → Module: ${mainModule}, Submodule: ${subModule || "None"}`
    );

    // ✅ Auto-trigger last selected submodule for this main module (if exists)
    // if (!subModule) {
    //   this.navigateToSubModule(mainModule);

    // }

    this.dashboardActiveFlag = selectedField;

    console.log('=== Admin Menu Check START ===');
    console.log('Module Name:', moduleName);
    console.log('isAdminMenuVisible:', this.isAdminMenuVisible);
    console.log('isSupportCoordinator:', this.isSupportCoordinator);

    if (moduleName === "Admin" && this.isAdminMenuVisible) {
        console.log('Entered Admin condition block');

        if (this.isSupportCoordinator == true) {
            console.log('User is NOT Support Coordinator → Hiding Admin Menu');
            this.isAdminMenuVisible = false;
        } else {
            console.log('User IS Support Coordinator → Keeping Admin Menu Visible');
        }

        console.log('Setting flags...');
        
        this.facilityflag = false;
        console.log('facilityflag:', this.facilityflag);

        this.clientflag = false;
        console.log('clientflag:', this.clientflag);

        this.participantLoginFlag = false;
        console.log('participantLoginFlag:', this.participantLoginFlag);

        this.staffflag = false;
        console.log('staffflag:', this.staffflag);

        this.Adminflag = true;
        console.log('Adminflag:', this.Adminflag);

        console.log('Updating breadcrumb to Admin');
        this.updateBreadcrumb("Admin");

        console.log('=== Admin Menu Check END (Returning) ===');
        return;
    }

    console.log('Admin condition NOT matched');
    console.log('=== Admin Menu Check END ===');
    if (moduleName === "Facility Admin" && this.isAdminMenuVisible) {
      this.isAdminMenuVisible = false;
      this.facilityflag = true;
      this.clientflag = false;
      this.participantLoginFlag = false;
      this.staffflag = false;
      this.updateBreadcrumb("Admin");
      return;
    }
    if (moduleName === "Human Resources" && this.isHrMenuVisible) {
      this.isHrMenuVisible = false;
      this.rewardsFlag = false;
      this.recruitmentFlag = false;
      this.trainingFlag = false;
      this.leaveFlag = false;
      this.myTemplatesFlag = false;

      //this.hrstaffflag = true;
      if (this.resetHrModuleStaffFlag) {
        this.hrstaffflag = false;
        setTimeout(() => {
          this.hrstaffflag = true;
          console.log(
            "🔁 hrstaffflag set back to true — re-rendering child with reset state"
          );
        }, 0);
      } else {
        this.hrstaffflag = true;
      }
      //this.staffflag = true;
      this.performanceManagementflag = false;
      this.libraryGoalflag = false;
      this.updateBreadcrumb("Human Resources");
      return;
    }
    if (moduleName === "Roster Manager" && this.isRosterMenuVisible) {
      this.isRosterMenuVisible = false;
      this.shiftacceptFlag = false;
      this.attendenceFlag = false;
      this.rosterTimeSheet = false;
      this.submissionFlag = false;
      this.RejectedFlag = false;
      this.ManageInvoiceFlag = false;
      this.RejectedReportsFlag = false;
      // this.addshiftFlag = true;
      if (this.resetRosterModuleFlag) {
        this.addshiftFlag = false;
        setTimeout(() => {
          this.addshiftFlag = true;
          console.log(
            "🔁 hrstaffflag set back to true — re-rendering child with reset state"
          );
        }, 0);
      } else {
        this.addshiftFlag = true;
      }
      this.updateBreadcrumb("Roster Manager");
      return;
    }
    if (moduleName === "Payroll" && this.isPayrollMenuVisible) {
      this.isPayrollMenuVisible = false;
      this.payrollexpenseFlag = false;
      this.payrollinvoiceFlag = false;
      this.payrollwagesFlag = false;
      this.payrollSettingsFlag = false;
      this.payrollFlag = true;
      this.updateBreadcrumb("Payroll");
      return;
    }

    /* CONSOLE.LOG('moduleName 3186 >>>>>', moduleName); */
    console.log('moduleName 3186 >>>>>', moduleName);
    console.log('this.isAccountingMenuVisible 3186 >>>>>', this.isAccountingMenuVisible);
    if (moduleName === "Accounting" && this.isAccountingMenuVisible) {
      console.log('moduleName 3189 >>>>>', moduleName);
      this.isAccountingMenuVisible = false;

      //this.ledgerEntryFlag = false;
      //this.ledgerReportFlag = false;
      //this.chartofAccountFlag = false;
      this.profitandlossFlag = false;
      //this.balancesheetFlag = false;
      //this.activityStatementFlag = false;
      this.masterFlag = true;
      this.MasterDBFlag = false;
      this.AccountingFlag = false;
      this.accountingProfitAndLossFlag = false;
      this.accountingBalanceSheetFlag = false;
      this.accountingReportsFlag = false;
      this.ReconcilationReportsFlag = false;
      this.ndisPayrollFlag = false;
      this.ndisPayrollinvoiceFlag = false;
      this.ndisPayrollexpenseFlag = false;
      this.ndisPayrollwagesFlag = false;
      this.ndisBankFeedFlag = false;
      this.ndisPayrollSettingsFlag = false;
      this.updateBreadcrumb("Accounting");
      return;
    }
    if (moduleName === "My Profile" && this.isMyProfileMenuVisible) {
      this.isMyProfileMenuVisible = false;
      this.awardFlag = false;
      this.profiletrainingFlag = false;
      this.profileleaveFlag = false;
      this.reportsFlag = false;
      this.profileflag = true;
      this.myProfilePerformanceFlag = false;
      this.StaffAvailabilityFlag = false;
      this.manageformsflag = false;
      this.updateBreadcrumb("My Profile");
      return;
    }

     if (moduleName === "Support Coordinator" && this.supportCoordinatormoduleflag) {
      this.supportCoordinatormoduleflag = false;
      this.supportParticipantflag = false;
        this.supportTaskflag = false;
        this.supportGoalsflag = false;
        this.supportProvidersflag = false;
        this.supportNotesflag = false;
        this.supportBillingflag = false;
        this.supportReportsflag = false;
  
      this.supportCoordinatorflag = true;
   
      this.updateBreadcrumb("Support Coordinator");
      return;
    }
    
    // if (moduleName === 'Performance Management' && this.isPerformanceMenuVisible) {
    //    this.isPerformanceMenuVisible = false;
    //    this.libraryGoalflag = false;
    //    this.performanceManagementflag = true;
    //    return;
    // }
    if (moduleName === "Access Manager" && this.isUserManagementVisible) {
      this.isUserManagementVisible = false;
      this.userAccessManagementflag = false;
      this.userStaffManagementflag = false;
      this.userResetPasswordflag = false;
      this.userStaffReportflag = false;
      //this.accessManagerflag = true;
      this.accessManagerflag = false;
      setTimeout(() => {
        this.accessManagerflag = true; // now re-triggers anything listening to flag
        console.log("🔁 accessManagerflag set back to true");
      }, 0);
      this.updateBreadcrumb("Access Manager");

      return;
    }
    if (moduleName === "T sign" && this.isTSignVisible) {
      this.isTSignVisible = false;
      this.documentflag = false;
      this.tSignflag = true;
      this.updateBreadcrumb("T sign");
      return;
    }
    if (moduleName === "Forms" && this.isFormsVisible) {
      this.isFormsVisible = false;
      this.manageformsflag = false;
      this.formsflag = true;
      this.updateBreadcrumb("Forms");
      return;
    }

    this.modulewisedisplaying();
    switch (moduleName) {
      case "Dashboard":
        this.dashboardflag = true;
        this.handleMenuClick(event);
        this.updateBreadcrumb("Dashboard");
        break;
      case "TicketManager":
        this.ticketflag = true;
        this.handleMenuClick(event);
        break;
      case "Admin":
        this.isAdminMenuVisible = !this.isAdminMenuVisible;
        this.Adminflag = false;
        setTimeout(() => {
          this.Adminflag = true; // now re-triggers anything listening to flag
          console.log("🔁 Adminflag set back to true");
        }, 0);
        this.handleMenuClick(event);
        this.updateBreadcrumb("Admin");
        break;
      case "Facility":
        this.isAdminMenuVisible = true;
        this.facilityflag = false;
        setTimeout(() => {
          this.facilityflag = true; // now re-triggers anything listening to flag
          console.log("🔁 facilityflag set back to true");
        }, 0);
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Admin", this.facilityPrefreedName);
        break;
      case "Participant":
        this.isAdminMenuVisible = true;
        this.clientflag = false;
        setTimeout(() => {
          this.clientflag = true; // now re-triggers anything listening to flag
          console.log("🔁 CLIENTFlag set back to true");
        }, 0);
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Admin", this.participantPrefreedName);
        break;
      case "Staff":
        this.isAdminMenuVisible = true;

        this.staffflag = false; // force reset
        setTimeout(() => {
          this.staffflag = true; // now re-triggers anything listening to flag
          console.log("🔁 staffflag set back to true");
        }, 0);

        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Admin", "Staff");
        break;
      case "Facility Admin":
        this.isAdminMenuVisible = !this.isAdminMenuVisible;
        this.facilityflag = true;
        this.handleMenuClick(event);
        this.updateBreadcrumb("Admin");
        break;
      case "Facility Participant":
        this.isAdminMenuVisible = true;
        this.clientflag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Admin", "Participant");
        break;
      case "Facility Staff":
        this.isAdminMenuVisible = true;
        this.staffflag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Admin", "Staff");
        break;

      case "Admin ICT":
        break;
      case "Facility ICT":
        break;
      case "Staff ICT":
        break;
      case "Human Resources":
        this.isHrMenuVisible = !this.isHrMenuVisible;
        //this.hrstaffflag = true;
        if (this.resetHrModuleStaffFlag) {
          this.hrstaffflag = false;
          setTimeout(() => {
            this.hrstaffflag = true;
            console.log(
              "🔁 hrstaffflag set back to true — re-rendering child with reset state"
            );
          }, 0);
        } else {
          this.hrstaffflag = true;
        }
        // this.staffflag= true;
        this.handleMenuClick(event);
        this.updateBreadcrumb("Human Resources");
        break;
      case "Awards & Recognition":
        this.isHrMenuVisible = true;
        this.rewardsFlag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Human Resources", "Awards");
        break;
      case "Recruitment":
        this.isHrMenuVisible = true;
        this.recruitmentFlag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Human Resources", "Recruitment");
        break;
      case "Training & Evaluation":
        this.isHrMenuVisible = true;
        this.trainingFlag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Human Resources", "Training");
        break;
      // case "My Templates":
      //   this.isHrMenuVisible = true;
      //   this.myTemplatesFlag = true;
      //   this.handleSubmenuClick(event);
      //   this.updateBreadcrumb("Human Resources", "My Templates");
      //   break;
      case "My Templates":
        this.isHrMenuVisible = true;
        this.resetAndActivate('myTemplatesFlag');
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Human Resources", "My Templates");
      break;

      case "Staff Availability":
        this.isMyProfileMenuVisible = true;
        this.StaffAvailabilityFlag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("My Profile", "My Availability");
        break;
      case "Leave Management":
        console.log("[✅ CASE] Leave Management logic triggered");
        this.isHrMenuVisible = true;
        //this.leaveFlag = true;
        if (this.resetHrLeaveSubModuleFlag) {
          this.leaveFlag = false;
          setTimeout(() => {
            this.leaveFlag = true;
            console.log(
              "🔁 hrstaffflag set back to true — re-rendering child with reset state"
            );
          }, 0);
        } else {
          this.leaveFlag = true;
        }
        console.log("[➡️ CALL] About to call handleSubmenuClick");
        this.handleSubmenuClick(event);
        console.log("[✅ CALL] handleSubmenuClick finished");

        console.log("[➡️ CALL] About to call updateBreadcrumb");
        this.updateBreadcrumb("Human Resources", "Leave Management");
        console.log("[✅ CALL] updateBreadcrumb finished");
        break;

      case "Roster Manager":
        this.isRosterMenuVisible = !this.isRosterMenuVisible;
        this.addshiftFlag = true;
        this.handleMenuClick(event);
        this.updateBreadcrumb("Roster Manager");
        break;
      case "My Roster":
        this.isRosterMenuVisible = true;
        this.shiftacceptFlag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Roster Manager", "My Roster");
        break;
      case "RejectedShift":
        this.isRosterMenuVisible = true;
        //this.RejectedFlag = true;
        if (this.resetRosterRejectedSubFlag) {
          this.RejectedFlag = false;
          setTimeout(() => {
            this.RejectedFlag = true;
            console.log(
              "🔁 hrstaffflag set back to true — re-rendering child with reset state"
            );
          }, 0);
        } else {
          this.RejectedFlag = true;
        }
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Roster Manager", "Rejected Shift");
        break;
      case "ManageInvoices":
        this.isRosterMenuVisible = true;
        this.ManageInvoiceFlag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Roster Manager", "Manage Invoices");
        break;
      case "RejectedReports":
        this.isRosterMenuVisible = true;
        this.RejectedReportsFlag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Roster Manager", "Rejected Reports");
        break;
      /*case 'Timesheet':
         this.isRosterMenuVisible = true;
         this.attendenceFlag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Roster Manager', 'Timesheet');
         break;*/

      case "Timesheet":
        this.isRosterMenuVisible = true;
        //this.rosterTimeSheet = true;
        if (this.resetTimesheetSubModuleFlag) {
          this.rosterTimeSheet = false;
          setTimeout(() => {
            this.rosterTimeSheet = true;
            console.log(
              "🔁 hrstaffflag set back to true — re-rendering child with reset state"
            );
          }, 0);
        } else {
          this.rosterTimeSheet = true;
        }
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Roster Manager", "Timesheet");
        break;
      case "Reimbursement":
        this.isRosterMenuVisible = true;
        this.resetAndActivate('submissionFlag');
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Roster Manager", "Reimbursement");
        break;
      case "Roster Manager Staff":
        this.isRosterMenuVisible = !this.isRosterMenuVisible;
        this.shiftacceptFlag = true;
        this.handleMenuClick(event);
        this.updateBreadcrumb("Roster Manager");
        break;
      case "My Roster Staff":
        break;
      case "Timesheet Staff":
        break;
      case "Reimbursement Staff":
        break;
      case "Sign In":
        this.SignInFlag = true;
        this.handleMenuClick(event);
        this.updateBreadcrumb("Sign In");
        break;
      case "Participants":
        // this.riskIndexDetailsFromChild={};
        console.log("User Type :" + this.currentUserType);
         console.log("resetParticipantModuleFlag :" + this.resetParticipantModuleFlag);
        
          /* if (this.currentUserType === "NDIS Participants") {

      this.participantLoginFlag = true;
    } else {
      if (this.resetParticipantModuleFlag) {
        console.log(
          "🔄 Resetting participantFlag due to resetParticipantModuleFlag"
        );
        this.participantFlag = false;

        setTimeout(() => {
          this.participantFlag = true;
          console.log(
            "🔁 participantFlag set back to true — re-rendering child with reset state"
          );
        }, 0);
      } else {
        this.participantFlag = true;
      }
    } */

      if (this.resetParticipantModuleFlag) {
        console.log(
          "🔄 Resetting participantFlag due to resetParticipantModuleFlag"
        );
        this.participantFlag = false;

        setTimeout(() => {
          this.participantFlag = true;
          console.log(
            "🔁 participantFlag set back to true — re-rendering child with reset state"
          );
        }, 0);
      } else {
        this.participantFlag = true;
      }

      
        // if( this.riskIndexDetailsFromChild){
        //    console.log(" this.riskIndexDetailsFromChild inside if in handle module click :" +  JSON.stringify(this.riskIndexDetailsFromChild));
         
        //   setTimeout(() => {
        //     this.participantFlag = true;
        //     console.log(" this.riskIndexDetailsFromChild inside if in handle module click  ELSE:" +  JSON.stringify(this.riskIndexDetailsFromChild));
           
        //   }, 0);
        // }
        this.handleMenuClick(event);
        this.updateBreadcrumb(this.participantPrefreedName);
        break;
      case "Payroll":
        this.isPayrollMenuVisible = !this.isPayrollMenuVisible;
        this.payrollFlag = true;
        this.handleMenuClick(event);
        this.updateBreadcrumb("Payroll");
        break;
      case "Expenses":
        this.isPayrollMenuVisible = true;
        this.payrollexpenseFlag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Payroll", "Expenses");
        break;
      case "Invoices":
        this.isPayrollMenuVisible = true;
        this.payrollinvoiceFlag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Payroll", "Invoices");
        break;
      case "Wages":
        this.isPayrollMenuVisible = true;
        this.payrollwagesFlag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Payroll", "Wages");
        break;
      case "Payroll Settings":
        this.isPayrollMenuVisible = true;
        this.payrollSettingsFlag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Payroll", "Settings");
        break;
      case "Incident Register":
        //this.incidentFlag = true;
        if (this.resetIncidentModuleFlag) {
          this.incidentFlag = false;
          setTimeout(() => {
            this.incidentFlag = true;
          }, 0);
        } else {
          this.incidentFlag = true;
        }
        this.handleMenuClick(event);
        this.updateBreadcrumb("Incident Register");
        break;
      case "Repository":
        this.repositoryFlag = true;
        this.handleMenuClick(event);
        this.updateBreadcrumb("Documents");
        break;
      case "ICT Timesheet":
        this.Icttimesheetflag = true;
        this.handleMenuClick(event);
        this.updateBreadcrumb("ICT Timesheet");
        break;
      case "NDIS Payroll":
        // this.isPayrollMenuVisible = !this.isPayrollMenuVisible;
        this.isAccountingMenuVisible = true;
        this.ndisPayrollFlag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Accounting", "Payroll");
        break;
      //  case 'NDIS Invoices':
      //     this.isAccountingMenuVisible = true;
      //     this.ndisPayrollinvoiceFlag = true;
      //     this.handleSubmenuClick(event);
      //     break;
      //  case 'NDIS Expenses':
      //     this.isAccountingMenuVisible = true;
      //     this.ndisPayrollexpenseFlag = true;
      //     this.handleSubmenuClick(event);
      //     break;
      case "NDIS Sales and Purchases":
        this.isAccountingMenuVisible = true;
        this.ndisPayrollinvoiceFlag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Accounting", "Sales and Purchases");
        break;
      //  case 'NDIS Wages':
      //     this.isAccountingMenuVisible = true;
      //     this.ndisPayrollwagesFlag = true;
      //     this.handleSubmenuClick(event);
      //     break;
      case "Bank Feed":
        this.isAccountingMenuVisible = true;
        this.ndisBankFeedFlag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Accounting", "Bank Feed");
        break;

      case "NDIS Payroll Settings":
        this.isAccountingMenuVisible = true;
        this.ndisPayrollSettingsFlag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Accounting", "Settings");
        break;
      case "Support Coordinator":
        console.log('this.supportCoordinatormoduleflag >>>>>', this.supportCoordinatormoduleflag);
        this.supportCoordinatormoduleflag = !this.supportCoordinatormoduleflag;
        console.log('this.supportCoordinatormoduleflag >>>>>', this.supportCoordinatormoduleflag);
        this.supportCoordinatorflag = true;
        this.StaffAvailabilityFlag = false;
        this.handleMenuClick(event);
        this.updateBreadcrumb("Support Coordinator");
      break;
     
      case "Support Participants":
        this.supportCoordinatormoduleflag = true;
        this.supportParticipantflag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Support Coordinator", "Participants");
      break;
      case "Support Tasks":
        this.supportCoordinatormoduleflag = true;
        this.supportTaskflag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Support Coordinator", "Tasks");
      break;
      case "Support Goals":
        this.supportCoordinatormoduleflag = true;
        this.supportGoalsflag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Support Coordinator", "Goals");
      break;
      case "Support Providers":
        this.supportCoordinatormoduleflag = true;
        this.supportProvidersflag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Support Coordinator", "Providers");
      break;
      case "Support Notes":
        this.supportCoordinatormoduleflag = true;
        this.supportNotesflag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Support Coordinator", "Case Notes");
      break;
      case "Support Billing":
        this.supportCoordinatormoduleflag = true;
        this.supportBillingflag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Support Coordinator", "Billing");
      break;
      case "Support Reports":
        this.supportCoordinatormoduleflag = true;
        this.supportReportsflag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Support Coordinator", "Reports");
      break;
      
      case "Accounting":
        this.isAccountingMenuVisible = !this.isAccountingMenuVisible;
        this.masterFlag = true;
        this.handleMenuClick(event);
        this.updateBreadcrumb("Accounting");
        break;
      case "General Ledger":
        //this.isAccountingMenuVisible = !this.isAccountingMenuVisible;
        this.isAccountingMenuVisible = true;
        this.MasterDBFlag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Accounting", "General Ledger");
        break;
      case "Chart of Accounts":
        this.isAccountingMenuVisible = true;
        this.AccountingFlag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Accounting", "Chart of Accounts");
        break;
      // case 'Profit and Loss':
      //    this.isAccountingMenuVisible = true;
      //    this.accountingProfitAndLossFlag = true;
      //    this.handleSubmenuClick(event);
      //    break;
      // case 'Balance Sheet':
      //    this.isAccountingMenuVisible = true;
      //    this.accountingBalanceSheetFlag = true;
      //    this.handleSubmenuClick(event);
      //    break;
      case "Reports":
        this.isAccountingMenuVisible = true;
        this.accountingReportsFlag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Accounting", "Reports");
        break;
      // case 'Reconcilation Reports':
      //    this.isAccountingMenuVisible = true;
      //    this.ReconcilationReportsFlag = true;
      //    this.handleSubmenuClick(event);
      //    break;
      // case 'Ledger Entry':
      //    this.isAccountingMenuVisible = true;
      //    this.ledgerEntryFlag = true;
      //    this.handleSubmenuClick(event);
      //    break;
      // case 'Ledger Reports':
      //    this.isAccountingMenuVisible = true;
      //    this.ledgerReportFlag = true;
      //    this.handleSubmenuClick(event);
      //    break;
      // case 'Chart of Account':
      //    this.isAccountingMenuVisible = true;
      //    this.chartofAccountFlag = true;
      //    this.handleSubmenuClick(event);
      //    break;
      //  case 'Profit and Loss':
      //       this.isAccountingMenuVisible = true;
      //       this.profitandlossFlag = true;
      //       this.handleSubmenuClick(event);
      //       break;
      // case 'Balance Sheets':
      //    this.isAccountingMenuVisible = true;
      //    this.balancesheetFlag = true;
      //    this.handleSubmenuClick(event);
      //    break;
      // case 'Activity Statements':
      //    this.isAccountingMenuVisible = true;
      //    this.activityStatementFlag = true;
      //    this.handleSubmenuClick(event);
      //    break;
      case "My Profile":
        this.isMyProfileMenuVisible = !this.isMyProfileMenuVisible;
        this.profileflag = true;
        this.handleMenuClick(event);
        this.updateBreadcrumb("My Profile");
        break;
      case "MP Awards & Recognition":
        this.isMyProfileMenuVisible = true;
        this.awardFlag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("My Profile", "Awards");
        break;
      case "MP Training & Evaluation":
        this.isMyProfileMenuVisible = true;
        this.profiletrainingFlag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("My Profile", "Training");
        break;
      case "MP Leave Management":
        this.isMyProfileMenuVisible = true;
        this.profileleaveFlag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("My Profile", "Leave Management");
        break;
      case "ManageForm":
        this.isMyProfileMenuVisible = true;
        this.manageformsflag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("My Profile", "My Forms");
        break;
      case "MP Reports":
        this.isMyProfileMenuVisible = true;
        this.reportsFlag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("My Profile", "Reports");
        break;
      case "MP Performance Management":
        this.isMyProfileMenuVisible = true;
        this.myProfilePerformanceFlag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("My Profile", "Performance Management");
        // this.updateBreadcrumb("My Profile", "My PMS");
        break;
      case "Performance Management":
      console.log("usertype in library goal : " + this.currentUserType);
      this.isHrMenuVisible = true;
      this.resetAndActivate('performanceManagementflag');
      this.handleSubmenuClick(event);
      this.updateBreadcrumb("Human Resources", "Performance Management");
      // this.updateBreadcrumb("Human Resources", "PMS");

      break;
      // case "Manage Library Goal":
      //   this.isHrMenuVisible = true;
      //   this.libraryGoalflag = true;
      //   this.handleSubmenuClick(event);
      //   this.updateBreadcrumb("Human Resources", "Library Goal");
      //   break;
      case "Access Manager":
        this.isUserManagementVisible = !this.isUserManagementVisible;
        this.accessManagerflag = true;
        this.accessManagerflag = false;
        setTimeout(() => {
          this.accessManagerflag = true; // now re-triggers anything listening to flag
          console.log("🔁 accessManagerflag set back to true");
        }, 0);
        this.handleMenuClick(event);
        this.updateBreadcrumb("Access Manager");
        break;
      case "Staff Management":
        this.isUserManagementVisible = true;
        this.userStaffManagementflag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Access Manager", "Staff Management");
        break;
      case "User Management":
        this.isUserManagementVisible = true;
        this.userAccessManagementflag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Access Manager", "User Management");
        break;
      case "Reset Password":
        this.isUserManagementVisible = true;
        this.userResetPasswordflag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Access Manager", "Reset Password");
        break;
      case "User Report":
        this.isUserManagementVisible = true;
        this.userStaffReportflag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("Access Manager", "User Report");
        break;
      case "T sign":
        this.isTSignVisible = !this.isTSignVisible;
        this.tSignflag = true;
        this.handleMenuClick(event);
        this.updateBreadcrumb("T sign");
        break;
      case "T Support":
        this.tSupportflag = true;
        this.handleMenuClick(event);
        this.updateBreadcrumb("T support");
        break;
      case "Document":
        this.isTSignVisible = true;
        this.documentflag = true;
        this.handleSubmenuClick(event);
        this.updateBreadcrumb("T sign", "Document");
        break;
      case "Forms":
        this.isFormsVisible = !this.isFormsVisible;
        this.resetAndActivate('formsflag');
        this.handleMenuClick(event);
        this.updateBreadcrumb("Forms");
        break;
      
      case "T Learner":
        this.TlearnerFlag = !this.TlearnerFlag;
        this.handleMenuClick(event);
        this.updateBreadcrumb("T Learner");
        break;
      case "Chatter":
        this.chatterFlag = true;
        this.handleMenuClick(event);
        this.updateBreadcrumb("ChaT");
        break;
      case "Smart Reports":
        this.resetAndActivate('smartReportsFlag');
        this.handleMenuClick(event);
        this.updateBreadcrumb("Reports");
        break;
      case "CMS":
        this.CMSFlag = true;
        this.handleMenuClick(event);
        this.updateBreadcrumb("CMS");
        this.isSidebarExpanded = false;
        break;
      case "Xero":
        //this.XeroFlag = true;
        this.resetAndActivate('XeroFlag');
        this.handleMenuClick(event);
        this.updateBreadcrumb("Xero");
        break;
      case "MYOB":
        //this.MyobFlag = true;
        this.resetAndActivate('MyobFlag');
        this.handleMenuClick(event);
        this.updateBreadcrumb("MYOB");
        break;
      case "QUICKBOOKS":
        this.QuickBooksFlag = true;
        this.handleMenuClick(event);
        this.updateBreadcrumb("Quick Books");
        break;
      case "ndisquotetool":
        this.ndisQuoteToolFlag = true;
        this.handleMenuClick(event);    
        this.updateBreadcrumb("NDIS Quote Tool");
        break;

      default:
        break;
      
    }

    //    const isSubmenu = event.target.closest('.subcat a');
    // const moduleSegment = this.activeMenu || moduleName; // main module                 //after URL

    // if (!isSubmenu) {
    //     // Only update history and URL for main menu clicks
    //     const path = `/s/${moduleSegment.replace(/\s+/g, '-')}`;
    //     window.history.pushState({ module: moduleSegment }, '', path);
    //     document.title = `${moduleSegment} | TesseractApps`;
    // } else {
    //     // For submenu clicks, just update the page title
    //     const subSegment = event.target.dataset.field;
    //     document.title = `${moduleSegment} - ${subSegment} | TesseractApps`;
    // }
    if (this.participantFlag == false) {
      this.riskIndexDetailsFromChild = {};
      this.participantdetails = {};
    }
    this.isStaffView = false;

    if (this.staffidflag == "Staff Document Expiry" && this.staffid != "") {
      this.staffidflag = "TEMP";
      console.log(" else staff id onclick" + this.staffid);
    }

    if (
      this.Adminflag == true &&
      this.staffflag == true &&
      this.staffidflag != "Staff Document Expiry" &&
      this.staffidflag != "TEMP"
    ) {
      this.staffid = "";
    }
  }
  @track isAutoOpeningSubmodule = false;
  navigateToSubModule(mainModule) {
    console.log("navigateToSubModule  CALLING ");
    const navMap = JSON.parse(sessionStorage.getItem("moduleNavMap")) || {};
    const storedSub = navMap[mainModule];
    console.log("navigateToSubModule  IN storedSub :  ", storedSub);
    if (storedSub) {
      this.isAutoOpeningSubmodule = true;
      setTimeout(() => {
        const subSelector = `.subcat a[data-field="${storedSub}"]`;
        const subElement = this.template.querySelector(subSelector);

        if (subElement) {
          subElement.click();
          console.log(
            `🔁 Auto-clicked submodule '${storedSub}' under '${mainModule}'`
          );
        } else {
          console.warn(
            `⚠️ Submodule '${storedSub}' not found under '${mainModule}'`
          );
        }
        setTimeout(() => {
          this.isAutoOpeningSubmodule = false;
        }, 500);
      }, 300);
    } else {
      console.log(
        `⚡ No submodule stored for '${mainModule}', staying on main module.`
      );
    }
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
        localStorage.removeItem("timesheetViewFlag");
        localStorage.removeItem("timesheetStaffId");
        localStorage.removeItem("timesheetStaffName");
        localStorage.removeItem("timesheetIsChecked");
        // this.rosterTimeSheet  = false;
        //   setTimeout(() => {
        //     this.rosterTimeSheet  = true;
        //     console.log("🔁 hrstaffflag set back to true — re-rendering child with reset state");
        //   }, 1000);
        break;
      case "Leave Management":
        this.resetHrLeaveSubModuleFlag = true;
        break;
      case "RejectedShift":
        this.resetRosterRejectedSubFlag = true;
        localStorage.removeItem("rosterRejectedShiftTab");
        break;

      // Add other cases as needed
    }
  }
  clearMainModuleStorage(mainModule) {
    if (mainModule === "Human Resources") {
      localStorage.removeItem("hrStaffRecordId");
      console.log("🧹 Cleared localStorage for Human Resources");
      this.resetHrModuleStaffFlag = true;
    } else if (mainModule === "Participants") {
      localStorage.removeItem("clientRecordId");
      console.log("🧹 Cleared localStorage for Participants");
      this.resetParticipantModuleFlag = true;
    } else if (mainModule === "Roster Manager") {
      // localStorage.removeItem('selectedRosterView');
      //localStorage.removeItem('clientRecordId');
      console.log("🧹 Cleared localStorage for Roster Manager");
      this.resetRosterModuleFlag = true;
    } else if (mainModule === "Incident Register") {
      this.resetIncidentModuleFlag = true;
    }
  }
  updateFavicon(iconUrl) {
    const existing = document.querySelector("link[rel*='icon']");
    if (existing) {
      existing.parentNode.removeChild(existing);
    }
    const link = document.createElement("link");
    link.type = "image/png";
    link.rel = "icon";
    link.href = iconUrl;

    document.head.appendChild(link);
  }
  handleNaviagteToRiskManagement(event) {
    console.log(" navigated from roster ");
    console.log("event details" + JSON.stringify(event.detail));
    localStorage.removeItem("clientRecordId");
    localStorage.removeItem("activeClientTab");
    this.resetParticipantModuleFlag = false;
    localStorage.setItem("clientRecordId", event.detail.participantId);
    this.modulewisedisplaying();
    // this.ParticipantsModule = true;
    this.riskIndexDetailsFromChild = {};

    setTimeout(() => {
       this.riskIndexDetailsFromChild = event.detail;
       this.participantFlag = true;
      const participantModuleEvent = new Event("click");
      const participantMenuItem = this.template.querySelector(
        `.menu-link[data-field="Participants"]`
      );
      if (participantMenuItem) {
        participantMenuItem.dispatchEvent(participantModuleEvent);
      }
    });
     console.log(" this.riskIndexDetailsFromChild handleNaviagteToRiskManagement7 :" +  JSON.stringify(this.riskIndexDetailsFromChild));
    // this.participantFlag = false;

    // setTimeout(() => {
    //   this.riskIndexDetailsFromChild = event.detail;
    //   // console.log('riskIndexDetailsFromChild ', JSON.stringify( this.riskIndexDetailsFromChild));
    //   this.participantFlag = true;
    // }, 0);
  }
  // handleCompanyNavigationFromChild(event) {
  //    const { companyId,companyName, naviagte } = event.detail;
  //    console.log('Received company ID from child:', companyId);
  //    console.log('Received company name from child:', companyName);
  //    console.log('Navigation type:', naviagte);
  //    this.selectedCompanyId = companyId;
  //    this.selectedCompanyName = companyName;

  //    console.log('this.selectedCompanyId in dashboard :', this.selectedCompanyId);
  //    console.log('this.selectedCompanyName in dashboard :', this.selectedCompanyName);
  // }

  handleOpenForms() {
    this.resetFlags();
    this.formsflag = true;
    this.updateBreadcrumb("Forms");
    this.isFacilityDropdownDisabled = true;
    this.setActiveMenu("Participants");
  }
  handleBackFromForms(event) {
    this.resetFlags();
    this.participantFlag = true;
    this.updateBreadcrumb("Participants");
    this.setActiveMenu("Participants");
    this.isFacilityDropdownDisabled = false;
  }

  // subscribeToDashboardMessage() {
  //   if (this.subscription) {
  //     return; // Already subscribed
  //   }

  //   this.subscription = subscribe(
  //     this.messageContext,
  //     DASHBOARD_REDIRECT_CHANNEL,
  //     (message) => this.handleRedirectMessage(message)
  //   );

    
  // }

subscribeToDashboardMessage() {

    // ✅ Prevent duplicate subscriptions
    if (this.subscription) {

        console.log(
            '[LMS] Already Subscribed'
        );

        return;
    }

    console.log(
        '[LMS] Subscribing To Dashboard Channel'
    );

    this.subscription = subscribe(

        this.messageContext,

        DASHBOARD_REDIRECT_CHANNEL,

        (message) => {

            console.log(
                '[LMS MESSAGE RECEIVED]',
                JSON.stringify(message)
            );

            this.handleRedirectMessage(message);
        }
    );

    console.log(
        '[LMS] Subscription Successful'
    );
}  

  submoduleToParentMap = {
    "Leave Management": "Human Resources",
    "Awards & Recognition": "Human Resources",
    "Performance Management": "Human Resources",
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
    "Reimbursement": "Roster Manager" 

    // Add others as needed
  };

  //     handleRedirectMessage(message) {
  //     let target = message?.target;

  //     if (!target) return;

  //     // Normalize casing: capitalize first letter of each word
  //     target = target
  //         .toLowerCase()
  //         .split(' ')
  //         .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  //         .join(' ');

  //     console.log('[🔁 LMS] Normalized message received:', target);

  //     const fakeEvent = {
  //         target: { dataset: { field: target } },
  //         currentTarget: { dataset: { field: target, content: '' } }
  //     };

  //     this.handleModuleClick(fakeEvent);
  // }

  // handleRedirectMessage(message) {
  //   let target = message?.target || message?.taskType;
  //   if (!target) return;

  //   // Normalize casing
  //   target = target
  //     .toLowerCase()
  //     .split(" ")
  //     .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  //     .join(" ");

  //   const parent = this.submoduleToParentMap?.[target] || "";

  //   console.log("[🔁 LMS] Redirecting to:", { target, parent });

  //   // 🔁 1. Open parent first (e.g. Human Resources)
  //   if (parent) {
  //     const parentEvent = {
  //       target: { dataset: { field: parent } },
  //       currentTarget: { dataset: { field: parent, content: "" } }
  //     };
  //     this.handleModuleClick(parentEvent);
  //   }

  //   // 🔁 2. Then click submenu *after a short delay*
  //   setTimeout(() => {
  //     const submenuEvent = {
  //       target: { dataset: { field: target } },
  //       currentTarget: { dataset: { field: target, content: parent } }
  //     };
  //     this.handleModuleClick(submenuEvent);
  //   }, 100); // Wait just enough for menu state to update
  // }

handleRedirectMessage(message) {

    console.log(
        '[🔁 LMS MESSAGE]',
        JSON.stringify(message)
    );

    let target =
        message?.target ||
        message?.taskType;

    if (!target) {
        return;
    }
if (message?.target === 'Funds Tracker') {
        this.modulewisedisplaying();
        this.participantFlag = true;
        this.navigatedParticipantId = message.data?.participantId || '';
        this.navigatedRecordId = message.data?.recordId || '';
        this.navigatedAction = 'fundsTracker';
        this.simulateClick('.menu-link[data-field="Participants"]');
        console.log('[✅ Funds Tracker] Navigating to participant:', this.navigatedRecordId);
        return; // ← STOP generic flow
    }//manendra added for funds tracker navigation from participant details page in order to open the funds tracker tab directly instead of opening the participant details page only
    // 🔹 Normalize casing
    target = target
        .toLowerCase()
        .split(" ")
        .map(word =>
            word.charAt(0).toUpperCase() +
            word.slice(1)
        )
        .join(" ");

    const parent =
        this.submoduleToParentMap?.[target] || "";

    console.log(
        "[🔁 LMS] Redirecting to:",
        { target, parent }
    );

    // 🔹 STEP 1 → Open Parent Module
    if (parent) {

        const parentEvent = {

            target: {
                dataset: {
                    field: parent
                }
            },

            currentTarget: {
                dataset: {
                    field: parent,
                    content: ""
                }
            }
        };

        this.handleModuleClick(parentEvent);
    }

    // 🔹 STEP 2 → Open Submodule
    setTimeout(() => {

        const submenuEvent = {

            target: {
                dataset: {
                    field: target
                }
            },

            currentTarget: {
                dataset: {
                    field: target,
                    content: parent
                }
            }
        };

        this.handleModuleClick(submenuEvent);

        console.log(
            '[✅ Submodule Opened]',
            target
        );

        // ✅ Rejected Shifts Navigation
        if (
            message?.childComponent === 'RosterCreation' &&
            message?.action === 'navigateToRejectedShifts'
        ) {

            console.log(
                '[🚀 Opening Rejected Shifts]'
            );

            // ⏳ Wait until roster component renders
            setTimeout(() => {

                const rosterCmp =
                    this.template.querySelector(
                        'c-tesseract-apps-roster-creation'
                    );

                console.log(
                    'Roster Component => ',
                    rosterCmp
                );

                if (rosterCmp) {

                    // ✅ CALL CHILD METHOD
                    rosterCmp.openRejectedShiftsFromNotification();

                    console.log(
                        '[✅ Rejected Shift Method Invoked]'
                    );

                } else {

                    console.error(
                        '[❌ Roster Component Not Found]'
                    );
                }

            }, 700);
        }

    }, 100);
}


  @track isSidebarExpanded = false; // expanded by default

  get sidebarClass() {
    return this.isSidebarExpanded
      ? "sidebar sidebar-expanded"
      : "sidebar sidebar-collapsed";
  }

  get mainContentClass() {
    return this.isSidebarExpanded
      ? "main-content"
      : "main-content main-content-expanded";
  }

  get toggleIconName() {
    return this.isSidebarExpanded ? "arrow_back_ios_new" : "lists";
  }
  get sidebarToggleClass() {
    return `sidebar-toggle ${this.isSidebarExpanded ? "sidebar-toggle-expanded" : "sidebar-toggle-collapsed"}`;
  }

  handleSidebarToggle() {
    // Toggle the sidebar flag
    this.isSidebarExpanded = !this.isSidebarExpanded;

    Promise.resolve().then(() => {
      // --- Logo Wrapper ---
      const logoWrapper = document.querySelector(".logoWrapper");

      if (!logoWrapper) {
        console.warn("[LogoWrapper] Not found in DOM");
      } else {
        logoWrapper.style.transition =
          "left 0.3s ease, justify-content 0.3s ease";
        console.log("[LogoWrapper] Found. Updating styles...");

        if (this.isSidebarExpanded) {
          logoWrapper.style.justifyContent = "center";
          logoWrapper.style.left = "1%";
          console.log("[LogoWrapper] Sidebar collapsed → centered");
        } else {
          logoWrapper.style.justifyContent = "flex-start";
          logoWrapper.style.left = "1%";
          console.log(
            "[LogoWrapper] Sidebar expanded → aligned left (flex-start)"
          );
        }
      }

      // --- Header Container Margin ---
      // const headerDiv = document.querySelector(
      //   "#CustomerPortalTemplate > div.cHeaderWrapper > div.cHeader.slds-container--fluid > div > div"
      // );

      // if (!headerDiv) {
      //   console.warn("[HeaderDiv] Not found in DOM");
      // } else {
      //   headerDiv.classList.add("dynamic-header"); // Add transition class
      //   console.log("[HeaderDiv] Found. Updating margin...");

      //   let marginLeft = "12%"; // Default

      //   const dpi = window.devicePixelRatio;
      //   if (dpi === 1.25) {
      //     marginLeft = "16%";
      //   } else if (dpi === 1.5) {
      //     marginLeft = "18%";
      //   }

      //   if (this.isSidebarExpanded) {
      //     headerDiv.style.margin = `0 0 0 ${marginLeft}`;
      //     console.log(
      //       `[HeaderDiv] Sidebar collapsed → margin set to 0 0 0 ${marginLeft}`
      //     );
      //   } else {
      //     headerDiv.style.margin = "0 0 0 3%";
      //     console.log("[HeaderDiv] Sidebar expanded → margin set to 0 0 0 3%");
      //   }
      // }
      this.updateHeaderMarginBasedOnSidebarAndDPI();

      // const footerElement = document.querySelector(
      //   "#CustomerPortalTemplate > div.cFooterPanel"
      // );

      // if (!footerElement) {
      //   console.warn("[Footer] Not found in DOM");
      // } else {
      //   footerElement.style.transition = "all 0.1s ease";

      //   if (this.isSidebarExpanded) {
      //     footerElement.style.width = "89%";
      //     footerElement.style.left = "11%";
      //     console.log("[Footer] Sidebar collapsed → width 85%, left 15%");
      //   } else {
      //     footerElement.style.width = "98%";
      //     footerElement.style.left = "2%";
      //     console.log("[Footer] Sidebar expanded → width 98%, left 2%");
      //   }
      // }
    });
  }

  updateHeaderMarginBasedOnSidebarAndDPI() {
    const headerDiv = document.querySelector(
      "#CustomerPortalTemplate > div.cHeaderWrapper > div.cHeader.slds-container--fluid > div > div"
    );
    const footerElement = document.querySelector(
      "#CustomerPortalTemplate > div.cFooterPanel"
    );

    // --- Handle Header Margin ---
    if (!headerDiv) {
      console.warn("[HeaderDiv] Not found in DOM");
    } else {
      let marginLeft = "13%"; // default for 100% zoom

      const dpi = window.devicePixelRatio;
      if (dpi === 1.25) {
        marginLeft = "16%";
      } else if (dpi === 1.5) {
        marginLeft = "19%";
      }

      headerDiv.classList.add("dynamic-header");

      if (this.isSidebarExpanded) {
        headerDiv.style.margin = `0 0 0 ${marginLeft}`;
        console.log(
          `[HeaderDiv] Sidebar collapsed → margin set to 0 0 0 ${marginLeft}`
        );
      } else {
        headerDiv.style.margin = "0 0 0 3%";
        console.log("[HeaderDiv] Sidebar expanded → margin set to 0 0 0 3%");
      }
    }

    // --- Handle Footer Width/Left Based on DPI ---
    if (!footerElement) {
      console.warn("[Footer] Not found in DOM");
    } else {
      footerElement.style.transition = "all 0.1s ease";

      const dpi = window.devicePixelRatio;

      if (this.isSidebarExpanded) {
        // Collapsed sidebar (left side visible)
        if (dpi === 1.25) {
          footerElement.style.width = "87%";
          footerElement.style.left = "14%";
          console.log("[Footer] 125% DPI → width 87%, left 14%");
        } else if (dpi === 1.5) {
          footerElement.style.width = "84%";
          footerElement.style.left = "17%";
          console.log("[Footer] 150% DPI → width 84%, left 17%");
        } else {
          footerElement.style.width = "89%";
          footerElement.style.left = "11%";
          console.log("[Footer] default DPI → width 89%, left 11%");
        }
      } else {
        // Expanded sidebar (fully collapsed)
        footerElement.style.width = "98%";
        footerElement.style.left = "2%";
        console.log("[Footer] Sidebar expanded → width 98%, left 2%");
      }
    }
  }

  dpiChangeHandler = () => {
    console.log("🔁 DPI or zoom level changed.");
    this.updateHeaderMarginBasedOnSidebarAndDPI();
  };

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

  @wire(MessageContext) messageContext;
  subscriptionBot;
  _pendingBotTask = null;

  handleBotAction(payload) {
    try {
      const { action, module, name, targetStatus } = payload || {};

      // ✅ Handle change staff status (activate or deactivate)
      if (action === "change_staff_status") {
        // 1) Navigate to Human Resources
        this.navigateToHumanResources();

        // 2) Store task for when staff component is ready
        this._pendingBotTask = {
          type: "change_staff_status",
          name: (name || "").trim(),
          targetStatus: targetStatus // true = activate, false = deactivate
        };

        // 3) Toast feedback
        const actionWord = targetStatus ? "Activating" : "Deactivating";
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Bot Task",
            message: `Opening Human Resources and ${actionWord.toLowerCase()} ${name || "the user"}…`,
            variant: "info"
          })
        );
      }

      // ✅ Handle reset-to-sidebar action
      if (action === "reset_to_sidebar") {
        this.dashboardflag = false;
        this.hrflag = false;
        this.isHrMenuVisible = false;
        this.hrstaffflag = false;
        this.chatterFlag = true; // adjust to your actual sidebar flag
        console.log("[Bot→Dashboard] Reset to sidebar");
      }
    } catch (e) {
      console.error("handleBotAction error", e);
    }
  }

  // Set the right flags to show the HR staff view (adjust if your app uses different flags)
  navigateToHumanResources() {
    // Example based on your flags
    this.dashboardflag = false;
    this.hrflag = true;
    this.isHrMenuVisible = true;

    // Ensure the specific HR staff screen is visible in your layout.
    // If your app uses a dedicated flag, set it here:
    this.hrstaffflag = true;

    // If you have a single entry point for module clicks (handleModuleClick),
    // you could call that instead with the right dataset.
  }

libLoaded = false;
confettiInstance;
globalCanvas;  // note: not local to the component
reducedMotion = false;

renderedCallback() {

  // Inject global styles to force completed steps to always show the name instead of checkmark icon
  if (!this.styleElement) {
    this.styleElement = document.createElement('style');
    this.styleElement.innerText = `
        .slds-path__item.slds-is-complete .slds-path__stage {
            display: none !important;
        }
        .slds-path__item.slds-is-complete .slds-path__title {
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
            transform: none !important;
            color: #fff !important;
            width: auto !important;
            height: auto !important;
        }
        .slds-path__item.slds-is-complete:hover .slds-path__stage {
            display: none !important;
        }
        .slds-path__item.slds-is-complete:hover .slds-path__title {
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
            transform: none !important;
            color: #fff !important;
            width: auto !important;
            height: auto !important;
        }
    `;
    document.head.appendChild(this.styleElement);
  }


  // ===== existing bot task block =====
  if (this._pendingBotTask?.type === 'change_staff_status') {
    const cmp = this.template.querySelector('c-tesseract-apps-create-employee');
    if (cmp && typeof cmp.changeStatusByName === 'function') {
      const { name, targetStatus } = this._pendingBotTask;
      this._pendingBotTask = null;
      cmp.changeStatusByName(name, targetStatus);
    }
  }

  // ===== confetti loader with logging =====
  if (this.libLoaded) {
    console.info('[Confetti] Library already loaded.');
    return;
  }

  const startTs = performance.now();

  loadScript(this, CONFETTI)
    .then(() => {
      this.libLoaded = true;
      this.reducedMotion =
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Create a full-screen canvas once
      if (!window.__globalConfettiCanvas) {
        const canvas = document.createElement('canvas');
        Object.assign(canvas.style, {
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: '2147483647' // ensures it's always on top
        });
        document.body.appendChild(canvas);
        window.__globalConfettiCanvas = canvas;
      }

      this.globalCanvas = window.__globalConfettiCanvas;

      // eslint-disable-next-line no-undef
      this.confettiInstance = confetti.create(this.globalCanvas, {
        resize: true,
        useWorker: true
      });

      const dur = (performance.now() - startTs).toFixed(1);
      console.info(`[Confetti] Library loaded successfully in ${dur} ms.`);
    })
    .catch((e) => {
      console.warn('[Confetti] Failed to load library.', e);
    });
}

getOrigin() {
  const icon = this.template.querySelector('[data-id="releaseIcon"]');
  const rect = icon?.getBoundingClientRect();
  if (!rect) return { x: 0.5, y: 0.5 };
  return {
    x: (rect.left + rect.width / 2) / window.innerWidth,
    y: (rect.top + rect.height / 2) / window.innerHeight
  };
}


  onHoverRelease() {
    if (!this.confettiInstance || this.reducedMotion) return;
    this.confettiInstance({
      particleCount: 60,
      spread: 60,
      startVelocity: 24,
      origin: this.getOrigin()
    });
  }

showReleaseUpdate = false;
modalKey = 0;                 // forces remount when needed
_openingReleaseUpdate = false;

onClickRelease() {
  const open = () => {
    if (this._openingReleaseUpdate || this.showReleaseUpdate) return;
    this._openingReleaseUpdate = true;
    // force a fresh instance each time (optional but nice)
    this.modalKey = Date.now();
    this.showReleaseUpdate = true;
  };

  if (!this.confettiInstance || this.reducedMotion) {
    open();
    return;
  }

  const origin = this.getOrigin();

  // Confetti: primary burst
  this.confettiInstance({
    particleCount: 90,
    spread: 70,
    startVelocity: 45,
    gravity: 1.0,
    ticks: 160,
    origin
  });

  // Confetti: secondary pop
  setTimeout(() => {
    this.confettiInstance({
      particleCount: 60,
      spread: 55,
      startVelocity: 28,
      gravity: 1.15,
      scalar: 0.9,
      origin
    });
  }, 160);

  // Open shortly after burst starts
  setTimeout(open, 250);
}

handleReleaseUpdateClose() {
  // Child told us it closed → unrender it
  this.showReleaseUpdate = false;
  this._openingReleaseUpdate = false;
}



  @track selectedFacilities = [];
  @track selectedService = null;
  @track isDropdownOpen = false;

  serviceOptions = [
    {
      label: "NDIS",
      value: "NDIS",
      icon: "diversity_3",
      className: "option-card"
    },
    {
      label: "Nursing",
      value: "Nursing",
      icon: "medical_services",
      className: "option-card"
    },
    {
      label: "Aged Care",
      value: "Aged Care",
      icon: "elderly",
      className: "option-card"
    },
    {
      label: "Health Care",
      value: "Health Care",
      icon: "favorite",
      className: "option-card"
    }
  ];

  get dropdownLabel() {
    let text = "";
    if (this.selectedService) {
      text += this.selectedService;
    }
    if (this.selectedFacilities.length > 0) {
      text +=
        (this.selectedService ? " | " : "") +
        this.selectedFacilities.join(", ");
    }
    return text || "Select Service & Facilities";
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  handleOptionClick(event) {
    const type = event.currentTarget.dataset.type;
    const value = event.currentTarget.dataset.value;

    if (type === "service") {
      this.selectedService = value;
      this.serviceOptions = this.serviceOptions.map((opt) => ({
        ...opt,
        className: opt.value === value ? "option-card selected" : "option-card"
      }));
    } else if (type === "facility") {
      if (this.selectedFacilities.includes(value)) {
        this.selectedFacilities = this.selectedFacilities.filter(
          (f) => f !== value
        );
      } else {
        this.selectedFacilities = [...this.selectedFacilities, value];
      }
      this.updateFacilityOptionClasses();
    }
  }

  updateFacilityOptionClasses() {
    this.facilityOptions = this.facilityOptions.map((opt) => ({
      ...opt,
      icon: "apartment",
      className: this.selectedFacilities.includes(opt.value)
        ? "option-card selected"
        : "option-card"
    }));
  }

  // handleOutsideClick = (event) => {
  //   if (
  //     !this.template.querySelector(".dropdown-container").contains(event.target)
  //   ) {
  //     this.isDropdownOpen = false;
  //   }
  // };

  //  fetchNotifications(event) {
  //   event.stopPropagation(); // Prevents immediate outside click from closing it
  //   console.log("Toggling Notifications...");

  //   if (this.showNotifications) {
  //     this.showNotifications = false;
  //     return;
  //   }
  //   this.isLoading = false;
  //   console.log("Fetching Notifications...");

  //   function timeAgo(date) {
  //   const now = new Date();
  //   const seconds = Math.floor((now - date) / 1000);

  //   const intervals = [
  //       { label: 'year', seconds: 31536000 },
  //       { label: 'mon', seconds: 2592000 },
  //       { label: 'week', seconds: 604800 },
  //       { label: 'day', seconds: 86400 },
  //       { label: 'hr', seconds: 3600 },
  //       { label: 'min', seconds: 60 },
  //       { label: 'sec', seconds: 1 }
  //   ];

  //   for (let i = 0; i < intervals.length; i++) {
  //       const interval = intervals[i];
  //       const count = Math.floor(seconds / interval.seconds);
  //       if (count >= 1) {
  //           return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
  //       }
  //   }

  //   return 'just now';
  // }

  //   getUserNotifications()
  //     .then((result) => {
  //       console.log("Notifications fetched successfully:", result);

  //       // Map notifications to the format needed by your dropdown
  //       this.filterednotification = result.map((notif, index) => ({
  //         value: notif.Id,
  //         label: notif.Subject__c,
  //         description: notif.Description__c,
  //         createdDate: new Date(notif.CreatedDate).toLocaleString(), // Optional formatting
  //         timestamp: timeAgo(new Date(notif.CreatedDate)),
  //         checknotifications: notif.Mark_as_read_notifications__c,
  //         index: index
  //       }));

  //       this.showNotifications = true;
  //       console.log(
  //         " filtering notification:",
  //         JSON.stringify(this.filterednotification)
  //       );
  //       console.log(" notifications:", JSON.stringify(this.showNotifications));
  //       this.isLoading = false;
  //     })
  //     .catch((error) => {
  //       console.error("Error fetching notifications:", error);
  //       this.error = "Error loading notifications";
  //       this.filterednotification = [];
  //       this.showNotifications = false;
  //     });
  // }

  /*  fetchNotifications(event) {
    event.stopPropagation();
    console.log("Toggling Notifications...");

    if (this.showNotifications) {
      this.showNotifications = false;
      return;
    }

    this.showNotifications = true;
    this.getUserNotifications();
  } */

  fetchNotifications(event) {
    event.stopPropagation();
    const wasClosed = !this.showNotifications;

    // Close all other dropdowns first
    if (wasClosed) {
        window.dispatchEvent(
            new CustomEvent('closedropdowns')
        );
    }
    
    this.showNotifications = !this.showNotifications;
    this.isOpen = false; // close facility dropdown

    if (this.showNotifications) {
      this.getUserNotifications?.();
      setTimeout(() => {
        document.addEventListener("click", this.boundOutsideClickHandler);
      }, 0);
    } else {
      this.closeAllDropdowns();
    }
  }

  constructor() {
    super();
    this.boundOutsideClickHandler = this.handleOutsideClick.bind(this);
  }

  getUserNotifications() {
    this.isLoading = false;

    fetchUserNotifications()
      .then((result) => {
        console.log("Notifications fetched successfully:", result);

        const now = new Date();

        const timeAgo = (date) => {
          const seconds = Math.floor((now - date) / 1000);
          const intervals = [
            { label: "year", seconds: 31536000 },
            { label: "mon", seconds: 2592000 },
            { label: "week", seconds: 604800 },
            { label: "day", seconds: 86400 },
            { label: "hr", seconds: 3600 },
            { label: "min", seconds: 60 },
            { label: "sec", seconds: 1 }
          ];

          for (let i = 0; i < intervals.length; i++) {
            const interval = intervals[i];
            const count = Math.floor(seconds / interval.seconds);
            if (count >= 1) {
              return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`;
            }
          }

          return "just now";
        };

        this.filterednotification = result.map((notif, index) => {
          const createdDate = new Date(notif.CreatedDate);
          return {
            value: notif.Id,
            label: notif.Subject__c,
            description: notif.Description__c,
            clientId:notif.Participant_Id__c ||'',
            createdDate: createdDate.toLocaleString(),
            timestamp: timeAgo(createdDate),
            checknotifications: notif.Mark_as_read_notifications__c,
            index: index
          };
        });

        this.isLoading = false;
        this.error = null;
      })
      .catch((error) => {
        console.error("Error fetching notifications:", error);
        this.error = "Error loading notifications";
        this.filterednotification = [];
        this.showNotifications = false;
        this.isLoading = false;
      });
  }

  handleNavigation(event) {
    const notification = event.currentTarget.dataset.name;
    const notificationId = event.currentTarget.dataset.id;
    const isRead = event.currentTarget.dataset.notificationread === "true";
    const clientId = event.currentTarget.dataset.clientId;

    const noNavigationNotifications = [
        "Document is updated",
        "New document is uploaded",
        "Service Requested",
        "New Service Created",
        "Staff assigned",
        "Service Requested",
        "Service Updated",
      
    ];

   if (
    noNavigationNotifications.includes(notification) ||
    notification.includes("Fund Usage Alert")
) {

        // Still mark as read if unread
        if (!isRead) {
            markNotificationAsRead({ notificationIds: [notificationId] })
                .then(() => {
                    this.showNotifications = false;
                    setTimeout(() => {
                        this.getUserNotifications();
                        this.loadNotificationCount();
                    }, 100);
                })
                .catch((error) => console.error("Error marking read:", error));
        }
        
        return;
    }

    console.log("Notification clicked:", notification);
    console.log("notificationId clicked:", notificationId);
    console.log("notificationId clicked for client :", clientId);
    console.log("Read clicked:", isRead);
    this.modulewisedisplaying();
    switch (notification) {
      case "Shift Starting Soon":
      case "Shift Ending Soon":
        this.SignInFlag = true;
        this.simulateClick('.menu-link[data-field="Sign In"]');
        break;
      case "Reimbursement Approval Request":
        this.addshiftFlag = true;
        this.isStaffView = true;
        this.simulateClick('.menu-link[data-field="Roster Manager"]');
        this.simulateClick('.subcat a[data-field="Reimbursement"]');
        break;
      case "Leave Request":
        this.leaveFlag = true;
        this.simulateClick('.menu-link[data-field="Human Resources"]');
        this.simulateClick('.subcat a[data-field="Leave Management"]');
        break;
     case "You have been awarded":
        this.awardFlag = true;
        this.simulateClick('.menu-link[data-field="My Profile"]');
        this.simulateClick('.subcat a[data-field="MP Awards & Recognition"]');
        
        break;
    case "Congratulations on receiving a award.":
        this.awardFlag = true;
        this.simulateClick('.menu-link[data-field="My Profile"]');
        this.simulateClick('.subcat a[data-field="MP Awards & Recognition"]');
        
        break;
      case "Approval Status":
        this.submissionFlag = true;
        this.simulateClick('.menu-link[data-field="Roster Manager Staff"]');
        this.simulateClick('.menu-link[data-field="Roster Manager"]');
        this.simulateClick('.subcat a[data-field="Reimbursement"]');
        break;
      case "My details":
        this.shiftacceptFlag = true;
        this.simulateClick('.menu-link[data-field="Roster Manager Staff"]');
        break;
      case "Document Expiry in 1 Month":
      case "Document Expiry in 7 Days":
      case "Document Expiry in 6 Days":
      case "Document Expiry in 5 Days":
      case "Document Expiry in 4 Days":
      case "Document Expiry in 3 Days":
      case "Document Expiry in 2 Days":
      case "Document Expiry in 1 Day":
      case "Your document has been approved":
      case "Your document has been rejected":
        this.profileflag = true;
        console.log("profile flag", this.profileflag);
        this.simulateClick('.menu-link[data-field="My Profile"]');
        break;
      case "Shift Allocation Notification":
        this.shiftacceptFlag = true;
        this.simulateClick('.menu-link[data-field="Roster Manager Staff"]');
        this.simulateClick('.menu-link[data-field="Roster Manager"]');
        this.simulateClick('.subcat a[data-field="My Roster"]');
        break;
      case "Shift Assignment Notification-EOI":
        this.shiftacceptFlag = true;
        this.simulateClick('.menu-link[data-field="Roster Manager Staff"]');
        this.simulateClick('.menu-link[data-field="Roster Manager"]');
        this.simulateClick('.subcat a[data-field="My Roster"]');
        break;
      case "Recurring Shift Notification - Daily":
      case "Recurring Shift Notification - Weekly":
      case "Recurring Shift Notification - Fortnightly":
      case "Recurring Shift Notification - Monthly":
        this.shiftacceptFlag = true;
        this.simulateClick('.menu-link[data-field="Roster Manager Staff"]');
        this.simulateClick('.menu-link[data-field="Roster Manager"]');
        this.simulateClick('.subcat a[data-field="My Roster"]');
        break;
      case "Shift Assignment - Notification":
        this.shiftacceptFlag = true;
        this.simulateClick('.menu-link[data-field="Roster Manager Staff"]');
        this.simulateClick('.menu-link[data-field="Roster Manager"]');
        this.simulateClick('.subcat a[data-field="My Roster"]');
        break;
      case "Shift Notification":
        this.shiftacceptFlag = true;
        this.simulateClick('.menu-link[data-field="Roster Manager Staff"]');
        this.simulateClick('.menu-link[data-field="Roster Manager"]');
        this.simulateClick('.subcat a[data-field="My Roster"]');
        break;
      case "Correction Created in Client Journal":
        this.participantFlag = true;
        this.navigatedParticipantId = clientId || '';
        console.log("notificationId clicked for  this.navigatedParticipantId :",  this.navigatedParticipantId);
        this.simulateClick('.menu-link[data-field="Participants"]');
        break;  
      case "Late Sign out request":
        this.simulateClick('.menu-link[data-field="Dashboard"]');
        getAddShiftDataById({ shiftId: whatId }).then((result) => {
          this.signInRequesttemplate = true;
          this.signin = false;
          this.signout = true;
          this.shiftEnableGeolocation =
            result.shiftwithstaffdata.Staff__r.Enable_Geolocation__c;
          this.shiftEnableSignin = result.shiftwithstaffdata.Enable_Sign_In__c;
          this.staffIdforweekly = result.shiftwithstaffdata.Staff__c;
          this.shiftwithstaffId = result.shiftwithstaffdata.Id;
          this.staffName = result.shiftwithstaffdata.Full_Name__c;
          this.Shifttype = result.shiftwithstaffdata.Add_Shift__r.Shift_Type__c;
          this.signOutComments =
            result.shiftwithstaffdata.Request_sign_out_comments__c;
          this.StaffRole = result.shiftwithstaffdata.Add_Shift__r.Role__c;
          this.shifttimmings =
            result.shiftwithstaffdata.Add_Shift__r.Shift_Start_End_Time__c;
          this.shiftDate = new Date(
            result.shiftwithstaffdata.Add_Shift__r.Start_Date__c
          ).toLocaleDateString("en-GB");
          console.log("staff geo location " + this.shiftEnableGeolocation);
          console.log("shift enbale Loctaion " + this.shiftEnableSignin);
        });
      case "Late Sign in request":
        this.simulateClick('.menu-link[data-field="Dashboard"]');
        getAddShiftDataById({ shiftId: whatId }).then((result) => {
          this.signInRequesttemplate = true;
          this.signin = true;
          this.signout = false;
          this.shiftEnableGeolocation =
            result.shiftwithstaffdata.Staff__r.Enable_Geolocation__c;
          this.shiftEnableSignin = result.shiftwithstaffdata.Enable_Sign_In__c;
          this.staffIdforweekly = result.shiftwithstaffdata.Staff__c;
          this.shiftwithstaffId = result.shiftwithstaffdata.Id;
          this.staffName = result.shiftwithstaffdata.Full_Name__c;
          this.Shifttype = result.shiftwithstaffdata.Add_Shift__r.Shift_Type__c;
          this.signOutComments =
            result.shiftwithstaffdata.Request_sign_out_comments__c;
          this.StaffRole = result.shiftwithstaffdata.Add_Shift__r.Role__c;
          this.shifttimmings =
            result.shiftwithstaffdata.Add_Shift__r.Shift_Start_End_Time__c;
          this.shiftDate = new Date(
            result.shiftwithstaffdata.Add_Shift__r.Start_Date__c
          ).toLocaleDateString("en-GB");
          console.log("staff geo location " + this.shiftEnableGeolocation);
          console.log("shift enbale Loctaion " + this.shiftEnableSignin);
        });
        break;

      default:
       this.simulateClick('.menu-link[data-field="Dashboard"]');
        this.dashboardflag = true;
    }

    if (!isRead) {
      markNotificationAsRead({ notificationIds: [notificationId] })
        .then(() => {
          console.log("✅ Notification marked as read:", notificationId);

          this.showNotifications = false;
          setTimeout(() => {
            this.getUserNotifications();
            this.loadNotificationCount();
          }, 100);
        })
        .catch((error) => {
          console.error("❌ Error marking notification as read:", error);
        });
    }
  }

  handleMarkAllAsRead(event) {
    event.preventDefault();
    console.log("✅ Mark all as read clicked");

    // Collect only unread notifications
    const unreadNotifications = this.filterednotification.filter(
      (notif) => notif.checknotifications === false
    );

    console.log(
      "📌 Unread notifications:",
      JSON.stringify(unreadNotifications)
    );

    // Extract Ids into a list
    const notificationIds = unreadNotifications.map((notif) => notif.value);

    if (notificationIds.length === 0) {
      console.log("ℹ️ No unread notifications to mark.");
      return;
    }

    // ✅ Call Apex once with all Ids
    markNotificationAsRead({ notificationIds })
      .then(() => {
        console.log("✅ Notifications marked as read:", notificationIds);
        // Update UI state (set all unread ones to true)
        this.filterednotification = this.filterednotification.map((n) => {
          if (notificationIds.includes(n.value)) {
            return { ...n, checknotifications: true };
          }
          return n;
        });
        this.getUserNotifications();
        setTimeout(() => {
          this.getUserNotifications();
          this.loadNotificationCount();
        }, 100);
      })
      .catch((error) => {
        console.error("❌ Error marking notifications as read:", error);
      });
  }

  // handleLogoutClick() {
  //   if (confirm("Are you sure you want to log out?")) {
  //     window.location.assign("/secur/logout.jsp");
  //   }

  // }

  handleLogoutClick() {
    this.showLogoutDialog = true;
  }

  handleCancel() {
    this.showLogoutDialog = false;
  }

  // handleConfirm() {
  //   // Clear everything in localStorage
  //   localStorage.clear();
  //   sessionStorage.clear();
  //   // Then logout
  //   window.location.assign("/secur/logout.jsp");
  // }
  handleConfirm() {
    console.log('🚪 Starting logout process');
    
    // ✅ Step 1: Save the rememberedEmail
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    console.log('📧 Current rememberedEmail:', rememberedEmail);

    //const accountingServices = localStorage.getItem("orgAccountingServices");
    //console.log('accountingServices >>>>>>>', accountingServices);
    
    // ✅ Step 2: Clear everything
    localStorage.clear();
    sessionStorage.clear();
    console.log('🗑️ Cleared all storage');
    
    // ✅ Step 3: Restore the rememberedEmail
    if (rememberedEmail) {
        localStorage.setItem('rememberedEmail', rememberedEmail);
        console.log('✅ Restored rememberedEmail:', rememberedEmail);

        //localStorage.setItem('orgAccountingServices', accountingServices);
        //console.log('✅ Restored orgAccountingServices:', accountingServices);
        
        // Verify restoration
        const restored = localStorage.getItem('rememberedEmail');
        if (restored === rememberedEmail) {
            console.log('✅ VERIFICATION SUCCESS - rememberedEmail preserved');
        } else {
            console.error('❌ VERIFICATION FAILED - rememberedEmail not preserved');
        }
    } else {
        console.log('ℹ️ No rememberedEmail to preserve (user never checked Remember Me)');
    }
    
    // ✅ Step 4: Logout
    console.log('🔄 Redirecting to logout...');
    window.location.assign("/secur/logout.jsp");
}


  handleFacilityForIct(event) {
    const msg = event.detail.message;
    this.hideFacilityForIct = event.detail.hideFacility;
    console.log("📩 Message from Ict timesheet:", msg);
    console.log(
      "📍 Grandparent received  from ICT Timesheet hideFacility:",
      this.hideFacilityForIct
    );
    if (this.hideFacilityForIct) {
      this.isFacilityDropdownDisabled = true;
    } else {
      this.isFacilityDropdownDisabled = false;
    }
  }
  stopPropagation(event) {
    event.stopPropagation();
  }

  handleCloseActionTooltip(event) {
    this.signInRequesttemplate = false;
    this.shiftEnableGeolocation = "";
    this.shiftEnableSignin = "";
    this.SelectedComments = "";
    this.SelectedComments1 = "";
    this.shiftwithstaffId = "";
    this.staffIdforweekly = "";
  }

  handleConfirmReset() {
    this.signInRequesttemplate = false;

    console.log("🟢 Sending Data:");
    console.log("shiftEnableGeolocation:", this.shiftEnableGeolocation);
    console.log("shiftEnableSignin:", this.shiftEnableSignin);
    console.log("shiftEnableSignout:", this.shiftEnableSignout);
    console.log("SelectedComments:", this.SelectedComments);
    console.log("staffIdforweekly:", this.staffIdforweekly);
    console.log("shiftwithstaffId:", this.shiftwithstaffId);

    // Call Apex method
    updateShiftDetails({
      enableGeolocation: this.shiftEnableGeolocation,
      enableSignin: this.shiftEnableSignin,
      enableSignout: this.shiftEnableSignout,
      selectedComments: this.SelectedComments,
      selectedComments1: this.SelectedComments1,
      staffId: this.staffIdforweekly,
      shiftwithstaffId: this.shiftwithstaffId
    })
      .then(() => {
        this.confirMationMessage(
          "Success",
          "Shift details updated successfully.",
          "success"
        );
        console.log("✅ Shift updated successfully");
      })
      .catch((error) => {
        console.error("❌ Error updating shift:", JSON.stringify(error));
        this.confirMationMessage(
          "Error",
          "Error updating shift details",
          "error"
        );
      });
    this.shiftEnableGeolocation = false;
    this.shiftEnableSignin = false;
    this.SelectedComments = "";
    this.SelectedComments1 = "";
    this.staffIdforweekly = "";
    this.shiftwithstaffId = "";
    this.shiftEnableSignout = false;
  }
  onchangeGeoLocation(event) {
    console.log("onchangeGeoLocation" + event.target.checked);
    this.shiftEnableGeolocation = event.target.checked;
    console.log("this.shiftEnableGeolocation" + this.shiftEnableGeolocation);
  }
  onchangeEnableSignin(event) {
    console.log("onchangeGeoLocation" + event.target.checked);
    this.shiftEnableSignin = event.target.checked;
    console.log("this.shiftEnableSignin" + this.shiftEnableSignin);
  }
  onchangeEnableSignout(event) {
    console.log("onchangeGeoLocation" + event.target.checked);
    this.shiftEnableSignout = event.target.checked;
    console.log("this.shiftEnableSignin" + this.shiftEnableSignin);
  }
  onchangeComments(event) {
    console.log("onchangeComments" + event.target.value);
    this.SelectedComments = event.target.value;
    console.log("this.SelectedComments" + this.SelectedComments);
  }
  onchangeComments1(event) {
    console.log("onchangeComments" + event.target.value);
    this.SelectedComments1 = event.target.value;
    console.log("this.SelectedComments1" + this.SelectedComments1);
  }

  confirMationMessage(title, message, variant) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: title,
        message: message,
        variant: variant
      })
    );
  }
  get unreadCount() {
    // ✅ Use backend count if available, otherwise fallback to items filter
    return (
      this.notificationCount || (this.items || []).filter((i) => !i.read).length
    );
  }

  formatDateToDDMMYYYY(dateInput) {
    if (!dateInput) return "";

    const date = new Date(dateInput);
    if (isNaN(date)) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // months are 0-based
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }




  handleOpenModuleFromDashboard(evt) {
    const { field, content } = evt.detail || {};

    // Build a minimal "event-like" object with the structure your handleModuleClick expects:
    // it reads event.currentTarget.dataset.field / dataset.content :contentReference[oaicite:2]{index=2}
    const fakeEvent = {
        currentTarget: {
            dataset: {
                field,
                content
            }
        }
    };

    this.handleModuleClick(fakeEvent);
}

handleLeaveTaskConsumed() {
  console.log("🧹 Leave task context consumed");
  this.taskLeaveId = null;
  this.openFromTask = false;
}

handleFacilitySearch(event) {
    const searchValue = event.target.value
        ? event.target.value.toLowerCase().trim()
        : '';

    this.facilitySearchKey = event.target.value;

    if (!this.allFacilities || this.allFacilities.length === 0) {
        this.finalListFacilities = [];
        return;
    }

    if (!searchValue) {
        this.finalListFacilities = [...this.allFacilities];
        return;
    }

    const filteredFacilities = this.allFacilities.filter(facility =>
        facility.label &&
        facility.label.toLowerCase().includes(searchValue)
    );

    // ✅ Show "No Results Found"
    if (filteredFacilities.length === 0) {
        this.finalListFacilities = [
            {
                label: 'No Results Found',
                value: 'no-results',
                disabled: true
            }
        ];
    } else {
        this.finalListFacilities = filteredFacilities;
    }
}

subscribeFacilityRefresh() {
    this.facilityRefreshSubscription = subscribe(this.messageContext, FACILITY_DATA_REFRESH_EVENT, async (message) => {
        if (message.facilityRefreshTrigger === 'REFRESH_FACILITY_DATA') {
            console.log('📩 Refreshing facilities');
            await this.refreshFacilityDropdown();
        }
    });
}


async refreshFacilityDropdown() {
    try {
        console.log('🔄 Refreshing facility data');
        const userType = this.userType;
        const facilityData = await getFacilityData();
        console.log('Facility data refreshed:', facilityData);
        this.finalListFacilities = [];
        this.selectedFacilities = [];
        this.facilityOptions = facilityData.map(record => ({
            label: record.Name,
            value: record.Id,
            participantPreferredName: record.Participant_Preferred_Name_Formla__c,
            facilityPreferredName: record.Facility_Preferred_Name_Formula__c,
            staffPreferredName: record.Staff_Preferred_Name_Formula__c
        }));
        if (userType === 'NDIS Org Admin' || userType === 'ICT Admin' || userType === 'Support Coordinator' ) {
            this.allFacilities = [...this.facilityOptions];
            this.finalListFacilities = [...this.allFacilities];
            this.validateCache();
        } else if (userType === 'Facility Admin' || userType === 'HR Admin' || userType === 'Roster Manager') {
            const currentFacilities = await getFacilityCurrentUser();
            this.allFacilities = currentFacilities.map(record => ({
                label: record.Facility__r.Name,
                value: record.Facility__r.Id,
                participantPreferredName: record.Facility__r.Participant_Preferred_Name_Formla__c,
                facilityPreferredName: record.Facility__r.Facility_Preferred_Name_Formula__c,
                staffPreferredName: record.Facility__r.Staff_Preferred_Name_Formula__c
            }));
            this.finalListFacilities = [...this.allFacilities];
            this.validateCache();
        } else if (userType === 'NDIS Staff' || userType === 'ICT Staff' || userType === 'NDIS Participants') {
            const result = await getstaffId();
            let facilities = [];
            if (result ?. Staff_Facilities__r ?. length) {
                facilities = result.Staff_Facilities__r.map(sf => ({
                    label: sf.Facility__r ?. Name,
                    value: sf.Facility__c,
                    participantPreferredName: sf.Facility__r ?. Participant_Preferred_Name_Formla__c,
                    facilityPreferredName: sf.Facility__r ?. Facility_Preferred_Name_Formula__c,
                    staffPreferredName: result.Display_Nickname__c
                }));
            }
            this.allFacilities = [... facilities];
            this.finalListFacilities = [...this.allFacilities];
            this.validateCache();
        }
        console.log('✅ Facilities refreshed');
    } catch (error) {
        console.error('Facility refresh error', error);
    }
}

}