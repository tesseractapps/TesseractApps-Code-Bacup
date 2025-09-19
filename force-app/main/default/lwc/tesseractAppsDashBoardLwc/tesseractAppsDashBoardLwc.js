import { LightningElement,track,wire,api } from 'lwc';
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import getStaffByEmail from '@salesforce/apex/StaffController.getStaffByEmail';
import getStaffEmailAndModules from '@salesforce/apex/UserAccessController.getStaffEmailAndModules';
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import UserNameFld from '@salesforce/schema/User.Name';
import UserEmail from '@salesforce/schema/User.Email';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
// import SideBarIcons from '@salesforce/resourceUrl/SideBar_Icons';
import UserTypeName from '@salesforce/schema/User.User_Type__c';
import ITSupport from '@salesforce/schema/User.IT_Support__c';
import TesseractLogo from '@salesforce/resourceUrl/TesseractLogo';
import { subscribe, createMessageContext,MessageContext } from 'lightning/messageService';
import TSIGN_MESSAGE_CHANNEL from '@salesforce/messageChannel/TsignMessageChannel__c';
import Tlogo from '@salesforce/resourceUrl/Tlogo';
import Tdark from '@salesforce/resourceUrl/Tdark';
import FOOTER_MESSAGE_CHANNEL from '@salesforce/messageChannel/FooterMessageChannel__c';
import getClientById from '@salesforce/apex/ClientDataController.getClientByEmail';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';
import DASHBOARD_REDIRECT_CHANNEL from '@salesforce/messageChannel/DashboardRedirectMessageChannel__c';


export default class TesseractAppsDashBoardLwc extends LightningElement {
context = createMessageContext();
@track tsignreUrl = '';
@track serviceId = '';
@track Adminflag = false;
@track facilityflag = false;
@track RosterManagementFlag =false;
@track clientflag = false;
@track staffflag = false;
@track staffflag1 = false;
@track rewardsFlag = false;
@track hrflag = true;
@track trainingFlag = false;
@track leaveFlag = false;
@track recruitmentFlag = false;
@track addshiftFlag = false;
@track shiftacceptFlag = false;
@track attendenceFlag = false;
@track rosterTimeSheet = false;
@track submissionFlag =false;
@track signButton=false;
@track SignInFlag = false;
@track participantFlag = false;
@track payrollFlag = false;
@track payrollexpenseFlag = false;
@track payrollwagesFlag = false;
@track payrollinvoiceFlag = false;
@track payrollSettingsFlag = false;
@track incidentFlag = false;
@track repositoryFlag = false;
@track AccountingFlag = false;
@track profileflag = false;
@track awardFlag = false;
@track profiletrainingFlag = false;
@track profileleaveFlag = false;
@track reportsFlag = false;
@track MasterDBFlag = false;
@track StaffAvailabilityFlag = false;
isAdminMenuVisible = false;
isHrMenuVisible = false;
isRosterMenuVisible = false;
isPayrollMenuVisible = false;
isMyProfileMenuVisible = false;
isUserManagementVisible = false;
isAccountingMenuVisible = false;
isTSignVisible = false;
isPerformanceMenuVisible = false;
isFormsVisible = false;
@track masterFlag = false;
@track ledgerEntryFlag = false;
@track ledgerReportFlag = false
@track chartofAccountFlag = false;
@track profitandlossFlag = false;
@track balancesheetFlag = false;
@track activityStatementFlag = false;
@track dashboardflag = true;
@track ticketflag = false;
@track accessManagerflag = false
@track tSignflag = false;
@track documentflag = false;
@track performanceManagementflag = false;
@track myProfilePerformanceFlag = false;
@track libraryGoalflag = false;
@track userAccessManagementflag=false;
@track userStaffManagementflag = false;
@track userResetPasswordflag=false;
@track userStaffReportflag = false;
@track Icttimesheetflag = false;
@track formsflag =false;
@track manageformsflag = false;
@track hrstaffflag = false;

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
@track activeMenu = '';
@track activeSubmenu = '';
@track modules = [];


@track adminModule = false;
@track HrModule = false;
@track RosterManagementModule = false;
@track SignInModule = false;
@track ParticipantsModule = false;
@track PayrollModule = false;
@track AccountingModule = false;
@track IncidentRegisterModule = false;
@track RepositoryModule = false;
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
@track NdisFlag = false;
@track ictstaff = false;
@track blNDISUser = false;
@track isLibraryGoal=false;
@track accountingProfitAndLossFlag = false;
@track accountingBalanceSheetFlag = false;
@track accountingReportsFlag = false;
@track ReconcilationReportsFlag = false;
@track ndisPayrollFlag = false;
@track ndisPayrollinvoiceFlag = false;
@track ndisPayrollexpenseFlag = false;
@track ndisPayrollwagesFlag = false;
@track ndisBankFeedFlag= false;
@track ndisPayrollSettingsFlag = false;
@track riskIndexDetailsFromChild={}
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

@track releaseNotes = false;


// dashboardIconUrl = `${SideBarIcons}/Dashboard_Icon.svg`;
// adminUrl = `${SideBarIcons}/Admin_Icon.svg`;
// hrUrl = `${SideBarIcons}/HR_Icon.svg`;
// rosterUrl = `${SideBarIcons}/Roster_Icon.svg`;
// signinUrl = `${SideBarIcons}/Signin_Icon.svg`;
// participantsUrl = `${SideBarIcons}/Participants.svg`;
// payrollUrl = `${SideBarIcons}/Payroll_icon.svg`;
// accountUrl = `${SideBarIcons}/Accounts_Icon.svg`;
// irUrl = `${SideBarIcons}/IR_Icon.svg`;
// repositoryUrl = `${SideBarIcons}/Repository_Icon.svg`;
// profileUrl = `${SideBarIcons}/Profile_Icon.svg`;
// performanceUrl = `${SideBarIcons}/Performance_Icon.svg`;
// accessUrl = `${SideBarIcons}/AccessManager_Icon.svg`;
// tsignUrl = `${SideBarIcons}/Tsign_Icon.svg`;
// recruitmentUrl = `${SideBarIcons}/Recruitment.svg`;
// awardsUrl = `${SideBarIcons}/Awards.svg`;
// trainingUrl = `${SideBarIcons}/Training.svg`;
// leavesUrl = `${SideBarIcons}/Leaves.svg`;
// myrosterUrl = `${SideBarIcons}/Myroster.svg`;
// timesheetUrl = `${SideBarIcons}/Timesheet.svg`;
// reimbursementUrl = `${SideBarIcons}/Reimbursement.svg`;
// invoiceUrl = `${SideBarIcons}/Invoice.svg`;
// expensesUrl = `${SideBarIcons}/Expenses.svg`;
// payrollssUrl = `${SideBarIcons}/Payrollss.svg`;
// reportUrl = `${SideBarIcons}/report.svg`;
// userUrl = `${SideBarIcons}/User.svg`;
// staffUrl = `${SideBarIcons}/Staff_Management.svg`
// resetpasswordUrl = `${SideBarIcons}/Reset.svg`;
// staffReportUrl = `${SideBarIcons}/StaffR.svg`;
// documentUrl = `${SideBarIcons}/Document.svg`;
// adminStaffUrl = `${SideBarIcons}/AdminStaff.svg`;
// adminParticipantUrl = `${SideBarIcons}/AdminParticipant.svg`;
// adminFacilityUrl = `${SideBarIcons}/AdminFacility.svg`;
// mngLibUrl = `${SideBarIcons}/ManageLibrary.svg`;
// wagessUrl = `${SideBarIcons}/Wages_icon.svg`; 
// chatIconUrl = `${SideBarIcons}/ChatIcon.svg`;
// balanceShhetUrl = `${SideBarIcons}/Balance_Sheets.svg`;
// chartofAccountsUrl = `${SideBarIcons}/Chart_of_Accounts.svg`;
// generalLedgerUrl = `${SideBarIcons}/General_Ledger.svg`;
// profitLossUrl = `${SideBarIcons}/Profit_and_Loss.svg`;
// reconcilationUrl = `${SideBarIcons}/Reconcilation_Reports.svg`;
// reportsUrl = `${SideBarIcons}/Reports.svg`;
// StaffAvailabilityUrl = `${SideBarIcons}/Staff_Availability.svg`;
// SupportUrl = `${SideBarIcons}/Support.svg`;
// TLearningUrl = `${SideBarIcons}/TLearning.svg`;
// RejectedShiftUrl = `${SideBarIcons}/Rejected_Shift.svg`;
_restored = false;  
@track isLoading = false; 
// constructor() {        //after URL
//    super();
//    this.setPageTitleFromUrl();
// }

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
connectedCallback() { 
   //console.log = function () {};
   console.log('isLoading.='+this.isLoading);
   this.isLoading = true; 
   console.log('isLoading.='+this.isLoading);

   //this.setPageTitleFromUrl();  //after URL
   const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.updateFavicon(isDarkMode ? Tdark : Tlogo);
    //document.title = 'TesseractApps';      //after URL
    // Listen for system theme changes and update favicon accordingly
    if (window.matchMedia) {
        const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
        // Add listener for dynamic theme changes
        themeMedia.addEventListener('change', (e) => {
            const newIcon = e.matches ? Tdark : Tlogo;
            this.updateFavicon(newIcon);
        });
    }
    this.subscribeToFooterMessage();
   this.subscribeToTsignMessage();
   this.subscribeToDashboardMessage();
   //this.restoreStateFromUrl();       //after URL
   //window.addEventListener('popstate', this.handleBrowserNavigation.bind(this));      //Back and Forward in Browser   //after URL
   // window.addEventListener('popstate', this.preventBrowserNavigation.bind(this));

   //  // Optional: Push a "locked" state to create a trap
   //  history.pushState({ module: this.activeMenu }, '', window.location.pathname);
   // window.addEventListener('popstate', this.blockNavigation.bind(this));
    //console.log = function () {};
  
  
   orgDetails().then(response => {
      console.log('response==>'+JSON.stringify(response));
      this.Orgid = response.Id;
      this.orgfullname = response.Name;
      this.orgname= response.Name ? response.Name.split(' ').slice(0, 2).join(' ') : '';
      this.usertype = response.Type_of_User__c;
      this.state = response.Address_Latest__StateCode__s;
      this.Orgabn = response.ABN__c;
      
      
      console.log('this.usertype===>'+this.usertype);

      if(this.usertype === 'NDIS User'){
            this.typeofuser = true;
      } else if (this.usertype === 'ICT User'){
             this.typeofuser = false;
      }

      if(this.usertype === 'NDIS User'){
         if (this.currentUserRole == 'Portal Account Partner User'){
            this.blNDISUser = true;
         } 
         this.NdisFlag = true;
         console.log('user type'+this.usertype);            
      }

      if(this.currentUserType == 'NDIS Participants'){
         this.ChatModule = false;
      }
      
      if(this.currentUserType == 'Accountant for Organisation'){ 
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
      const newLogo = document.createElement('img');
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
      logoAnchor.addEventListener('click', () => {
         this.redirectToDashboard();
      });
   
      console.log('Standard logo replaced successfully with the custom logo.');
   } else {
      console.warn('Logo anchor element not found. Please verify the DOM path.');
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
   logoWrapper.style.left = "17%";
   logoWrapper.style.top = "0";
   logoWrapper.style.zIndex = "980";
 
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
 
   console.log("✅ Wrapped logo and breadcrumb inside .logoWrapper with fixed position.");
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
   }

   const headerContainerElement = document.querySelector(
   "#CustomerPortalTemplate > div.cHeaderWrapper > div.cHeader.slds-container--fluid"
   );
   if (headerContainerElement) {
         headerContainerElement.style.position = "fixed"; // Set position to fixed
         headerContainerElement.style.zIndex = "980"; 
         headerContainerElement.style.top = "0";
   }


   const notifications = document.querySelector(
      "#CustomerPortalTemplate > div.cHeaderWrapper > div.cHeader.slds-container--fluid > div > div > div.cNotifications"
      );
      if (notifications) {
         notifications.style.position = "fixed";
         notifications.style.right = "0.5%";
      }

   //PowerICon

   setTimeout(()=>{
      let profileAttempts = 0;
      const maxProfileAttempts = 10;
      
      const profileInterval = setInterval(() => {
          profileAttempts++;
      
          // Find the profile button (which toggles the menu)
          const profileButton = document.querySelector(
              "#\\33 \\:41\\;a > div > div > a"
          );

           // Find the cProfileMenu container
            const profileMenuContainer = document.querySelector("#CustomerPortalTemplate > div.cHeaderWrapper > div.cHeader.slds-container--fluid > div > div > div.cProfileMenu");

      
          // Find and remove the down arrow button
          const arrowElement = document.querySelector(
              "#\\33 \\:41\\;a > div > div > a > span.triggerDownArrow.down-arrow"
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

// Show Tooltip on Click
// powerIcon.addEventListener("click", (event) => {
//     event.preventDefault();
//     event.stopPropagation();

//     // Toggle visibility
//     const isVisible = tooltip.style.visibility === "visible";
//     tooltip.style.visibility = isVisible ? "hidden" : "visible";
//     tooltip.style.opacity = isVisible ? "0" : "1";

//     // Toggle icon color
//     powerIcon.innerHTML = powerIcon.innerHTML.replace(
//         /stroke="(black|red)"/g,
//         isVisible ? 'stroke="black"' : 'stroke="red"'
//     );
// });

// Hide tooltip if clicked outside
document.addEventListener("click", (e) => {
    if (!powerIconContainer.contains(e.target)) {
        tooltip.style.visibility = "hidden";
        tooltip.style.opacity = "0";
        powerIcon.innerHTML = powerIcon.innerHTML.replace(/stroke="red"/g, 'stroke="black"');
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
                        const confirmLogout = confirm("Are you sure you want to log out?");
                        if (confirmLogout) {
                            logoutElement.click();
                            console.log("Power icon clicked - Logout confirmed and triggered.");
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
      footerElement.style.width = "85%";      // Set width to 84%
      footerElement.style.bottom = "1%";      // Align to bottom
      footerElement.style.left = "15%";       // Align from left by 16%
   }

//    const headerInnerDiv = document.querySelector(
//       "#CustomerPortalTemplate > div.cHeaderWrapper > div.cHeader.slds-container--fluid > div > div"
//   );
  
  
//   if (headerInnerDiv && !document.getElementById("breadcrumb-nav")) {
//       const breadcrumbNav = document.createElement("div");

//       breadcrumbNav.id = "breadcrumb-nav";
      
  
//       breadcrumbNav.style.display = "flex";
//       breadcrumbNav.style.alignItems = "center";
//       breadcrumbNav.style.marginLeft = "16.1%";
//       breadcrumbNav.style.fontSize = "85%";
//       breadcrumbNav.style.color = "#002A52";
//       breadcrumbNav.style.gap = "6px";
//       breadcrumbNav.style.marginTop = "2px";
  
//       // Placeholder content
//       breadcrumbNav.innerHTML = `
//           <span id="breadcrumb-bar" style="display:inline-block; width:2px; height:18px; background-color:#002A52; margin-right:6px; margin-left:2px;"></span>
//           <span id="breadcrumb-category" style="cursor:pointer; text-decoration: underline; font-weight: bold;"></span>
//           <span id="breadcrumb-separator" style="display:none;">-</span>
//           <span id="breadcrumb-subcategory" style="cursor:pointer; text-decoration: underline; font-weight: bold; display:none;"></span>
//       `;
  
//       const logoDiv = headerInnerDiv.querySelector(".cLogo");
//       if (logoDiv && logoDiv.nextSibling) {
//           headerInnerDiv.insertBefore(breadcrumbNav, logoDiv.nextSibling);
//       } else {
//           headerInnerDiv.appendChild(breadcrumbNav);
//       }
//   }

const triangleStyle = document.createElement('style');
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
        const notificationLinks = document.querySelectorAll('.notification-link');

        notificationLinks.forEach(link => {
            if (!link.classList.contains('disabled-notification-link')) {
                link.classList.add('disabled-notification-link');
                link.removeAttribute('href');
                link.style.pointerEvents = 'none';
                link.style.cursor = 'default';
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}, 1000);




   
   
   
   this.fetchStaffDetails();
   this.updateBreadcrumb('Dashboard');
   this.setActiveMenu('dashboard');
   // this.isLoading = false;
   setTimeout(() => {
        this.isLoading = false;
        console.log('isLoading =', this.isLoading);
    }, 3000);


     
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
      document.title = 'TesseractApps';
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
    } else if (category && category.toLowerCase() === 'dashboard') {
        document.title = `Home | TesseractApps`;
    } else {
        document.title = `${category} | TesseractApps`;
    }
}

handleBreadcrumbClick(label) {
   const menuItem = this.template.querySelector(`.menu-link[data-field="${label}"], .subcat a[data-field="${label}"]`);
   if (menuItem) {
       const event = new Event('click');
       menuItem.dispatchEvent(event);
   }
}

subscribeToFooterMessage() {
    console.log('📥 Subscribing to FOOTER_MESSAGE_CHANNEL');
    subscribe(this.context, FOOTER_MESSAGE_CHANNEL, (message) => {
        console.log('📨 Received message from footerLwc:', message);

        if (message.action === 'openContactPanel') {
            console.log('➡️ Triggering openContactUsPanel()');
            this.openContactUsPanel();
        } else if (message.action === 'openReleaseNotes') {
            console.log('➡️ Triggering openReleaseNotes()');
            this.openReleaseNotes();
        }else if (message.action === 'openPrivacy') {
            console.log('➡️ Triggering openPrivacy()');
            this.openPrivacy();
        }else if (message.action === 'openTerms') {
            console.log('➡️ Triggering openTerms()');
            this.openTerms();
        }
    });
}

@track TandC = false;
openTerms(){
   this.TandC = true;
}

closeTerms(){
   this.TandC = false;
}

@track privacyDis = false;
openPrivacy(){
   this.privacyDis = true;
}

closePrivacy(){
   this.privacyDis = false;
}


openReleaseNotes(){
   this.releaseNotes = true;
}

closeReleaseNotes(){
   this.releaseNotes = false;
}
openContactUsPanel() {
   this.resetFlagsTicket();
   this.contactUsTicketFlag = true;
   this.updateBreadcrumb('Contact Us');


   // Clear internal tracked values
   this.activeMenu = '';
   this.activeSubmenu = '';

   // ✅ Remove ALL active menu highlights manually
   const allMenuLinks = this.template.querySelectorAll('.menu-link.active');
   allMenuLinks.forEach(link => link.classList.remove('active'));

   const allSubmenuLinks = this.template.querySelectorAll('.subcat a.active');
   allSubmenuLinks.forEach(link => link.classList.remove('active'));
}


// setPageTitleFromUrl() {
//    const path = window.location.pathname.replace(/\/s\//i, '').toLowerCase();             //after URL
//    let title = 'TesseractApps';
//    let delay = 250;

//    if (!path || path === '') {
//        title = 'Dashboard | TesseractApps';
//    } else if (path.includes('ict-timesheet')) {
//        title = 'ICT Timesheet | TesseractApps';
//    } else if (path.includes('t-sign')) {
//        title = 'T Sign | TesseractApps';
//    } else if (path.includes('incident-register')) {
//        title = 'Incident Register | TesseractApps';
//    } else if (path.includes('participants')) {
//        title = 'Participants | TesseractApps';
//    } else if (path.includes('repository')) {
//        title = 'Repository | TesseractApps';
//    } else if (path.includes('forms')) {
//        title = 'Forms | TesseractApps';
//    } else if (path.includes('accounting')) {
//        title = 'Accounting | TesseractApps';
//    } else if (path.includes('payroll')) {
//        title = 'Payroll | TesseractApps';
//    } else if (path.includes('my-profile')) {
//        title = 'My Profile | TesseractApps';
//    } else if (path.includes('admin')) {
//        title = 'Admin | TesseractApps';
//    } else if (path.includes('access-manager')) {
//        title = 'Access Manager | TesseractApps';
//    } else if (path.includes('human-resources')) {
//        title = 'Human Resources | TesseractApps';
//    } else if (path.includes('roster-management')) {
//        title = 'Roster Management | TesseractApps';
//        delay = 500; // more delay for roster
//    } else if (path.includes('sign-in')) {
//        title = 'Sign In | TesseractApps';
//    } else if (path.includes('chat') || path.includes('chatter')) {
//        title = 'Chat | TesseractApps';
//    }

//    this.overrideTitleWithRetry(title, delay);
// }

// overrideTitleWithRetry(newTitle, delay = 250) {
//    let attempts = 0;
//    const maxAttempts = 5;

//    const trySetTitle = () => {
//       if (document.title !== newTitle) {
//          document.title = newTitle;
//          console.log(`🔁 Attempt ${attempts + 1}: Title set to "${newTitle}"`);
//       }

//       if (document.title !== newTitle && ++attempts < maxAttempts) {
//          setTimeout(trySetTitle, 300); // retry every 300ms
//       } else if (document.title === newTitle) {
//          console.log(`✅ Title successfully set: "${newTitle}"`);
//       } else {
//          console.warn(`❌ Failed to set title after ${maxAttempts} attempts.`);
//       }
//    };

//    setTimeout(trySetTitle, delay);
// }


subscribeToTsignMessage() {
   subscribe(this.context, TSIGN_MESSAGE_CHANNEL, (message) => {
       if (message.tsignreUrl && message.recordId) {
           console.log('📌 AWS URL received in Dashboard:', message.tsignreUrl);
           console.log('📌 Service Agreement ID received in Dashboard:', message.recordId);

           // ✅ Store received values
           this.tsignreUrl = message.tsignreUrl;
           this.serviceId = message.recordId; // ✅ Capture the Service Agreement Record ID

           // ✅ Call redirection function if both values are present
           this.handleTsignRedirect();
       } else {
           console.warn('⚠️ Missing data in received TSign message:', message);
       }
   });
}


handleTsignRedirect() {
   console.log('📌 AWS URL stored in Dashboard:', this.tsignreUrl);
   console.log('📌 service id stored in Dashboard:', this.serviceId);

   // Reset all other module flags
   this.resetFlags();

   // Set T Sign specific flags
   this.tSignflag = true;

   // Highlight the T Sign menu
   this.setActiveMenu('T sign');
   this.updateBreadcrumb('T sign');


   // Update document title
   // document.title = 'T Sign | TesseractApps';

   // // Update URL (without reloading the page)            //after URL
   // window.history.pushState(
   //     { module: 'T Sign' },
   //     'T Sign',
   //     '/s/T-Sign'
   // );
}


@wire(getRecord, { recordId: Id, fields: [UserNameFld ,UserEmail,UsrRoleName,UserTypeName,ITSupport]}) 
userDetails({error, data}) {
     if (data) {
         this.currentUser = data.fields.Name.value; 
         this.currentUserEmail=data.fields.Email.value;
         this.currentUserRole =data.fields.User_Role__c.value;
         this.currentUserType =data.fields.User_Type__c.value;
         this.IsItSupport =data.fields.IT_Support__c.value;
         console.log('this.currentUserRole====>'+this.currentUserRole);
         console.log('this.currentUserType====>'+this.currentUserType);
         console.log('this.ITSupport====>'+this.IsItSupport);
         if(this.currentUserType==='HR Admin' || this.currentUserType==='NDIS Org Admin' || this.currentUserType==='Roster Manager'){
            this.isLibraryGoal=true;
         } else{
            this.isLibraryGoal=false;
         }
         
         if( this.currentUserRole == 'Portal Account Partner Executive'  ||this.currentUserRole == 'Portal Account Partner Manager'|| this.currentUserRole == 'CEO' || this.currentUserRole == 'Admin' ){
            this.superiors=true;
          }
          if ((this.currentUserRole === 'Portal Account Partner Executive' || this.currentUserRole === 'CEO') && this.IsItSupport === 'Yes') {
    this.TSupportModule = true;
}

        
         else{
             this.superiors=false;             
          }
         console.log('current role ' +this.currentUserRole);
         console.log(' staffUser '+this.staffuser);
         console.log(' org admin  '+ this.orgadmin);
         console.log(' superiorflag  '+ this.superiors);
     } else if (error) {
         this.usererror = error ;
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

wiredParticipantResult
@wire(getClientById, { email:'$currentUserEmail' })
    wiredParticipant(result) {
      this.wiredParticipantResult = result;
        const { data, error } = result;
        if (data) {
            this.clientData = data;
            this.clientId = this.clientData[0].Id;
            console.log('Client Id >>' + this.clientId);
            console.log('Client data:', JSON.stringify(this.clientData));
        } else if (error) {
            this.handleError(error);
        }
    }

@track staffid='';
@track staffidflag ;
@track isStaffView=false

handleTaskEdit(event) {

   this.modulewisedisplaying();

   const taskType = event.detail.taskType;
   const whatId = event.detail.whatId;

   switch (taskType) {
       case 'Approval Request':
           this.submissionFlag = true;
           this.isRosterMenuVisible = true;

           setTimeout(() => {
               const rosterModuleEvent = new Event('click');
               const rosterMenuItem = this.template.querySelector(`.menu-link[data-field="Roster Manager"]`);
               if (rosterMenuItem) {
                   rosterMenuItem.dispatchEvent(rosterModuleEvent);
               }
           });

           setTimeout(() => {
               const reimbursementSubMenuEvent = new Event('click');
               const reimbursementMenuItem = this.template.querySelector(`.subcat a[data-field="Reimbursement"]`);
               if (reimbursementMenuItem) {
                   reimbursementMenuItem.dispatchEvent(reimbursementSubMenuEvent);
               }
           });

           break;

       case 'Incident Register':
           this.incidentFlag = true;
          

           setTimeout(() => {
               const incidentModuleEvent = new Event('click');
               const incidentMenuItem = this.template.querySelector(`.menu-link[data-field="Incident Register"]`);
               if (incidentMenuItem) {
                   incidentMenuItem.dispatchEvent(incidentModuleEvent);
               }
           });

           break;

       case 'Staff Document Expiry':
            this.isTaskNavigation = true;
           this.staffidflag = 'Staff Document Expiry';
           this.isAdminMenuVisible = true;
           console.log('whatid'+whatId);
           setTimeout(() => {
            const adminMenuItem = this.template.querySelector(`.menu-link[data-field="Admin"]`);
            if (adminMenuItem) {
                adminMenuItem.click(); // ✅ use real click
            }
        });
        
        setTimeout(() => {
            const staffSubmenu = this.template.querySelector(`.subcat a[data-field="Staff"]`);
            if (staffSubmenu) {
                staffSubmenu.click(); // ✅ use real click
            }
        });
        
        /*   const staffEvent = new CustomEvent('staffidchange', {
          detail: { StaffIdFromTask: whatId }, // whatId is your actual value
          bubbles: true,
         composed: true
          });
         const child = this.template.querySelector('c-staff-data-community');
         if (child) {
            child.dispatchEvent(staffEvent);
         } */
        this.staffid=whatId;

           break;
           case 'Leave Request':
           this.isHrMenuVisible = true;
           this.leaveFlag = true;

           setTimeout(() => {
               const hrModuleEvent = new Event('click');
               const hrMenuItem = this.template.querySelector(`.menu-link[data-field="Human Resources"]`);
               if (hrMenuItem) {
                   hrMenuItem.dispatchEvent(hrModuleEvent);

               }
           });

           setTimeout(() => {
               const leaveSubMenuEvent = new Event('click');
               const leaveMenuItem = this.template.querySelector(`.subcat a[data-field="Leave Management"]`);
               if (leaveMenuItem) {
                   leaveMenuItem.dispatchEvent(leaveSubMenuEvent);
               }
           });

           break;

       default:
           this.dashboardflag = true;
   }
}

handleDashboardevent(event){
   this.modulewisedisplaying();

   const name = event.detail.message;
   console.log('dashboard name'+name);

   switch (name) {
      case 'Award':
          this.rewardsFlag = true;
          

          this.simulateClick('.menu-link[data-field="Human Resources"]');
          this.simulateClick('.subcat a[data-field="Awards & Recognition"]');

          break;

      case 'Trainings':
          // Example of another case with different selectors
          this.trainingFlag = true;

          this.simulateClick('.menu-link[data-field="Human Resources"]');
          this.simulateClick('.subcat a[data-field="Training & Evaluation"]');

          break;
      case 'Jobs':
          
          this.recruitmentFlag = true; 

          this.simulateClick('.menu-link[data-field="Human Resources"]');
          this.simulateClick('.subcat a[data-field="Recruitment"]');

          break;
      case 'Human Resources':          
            this.staffflag = true;  
            this.simulateClick('.menu-link[data-field="Human Resources"]');
      break;
      case 'Sign in':        
            this.SignInFlag = true;  
            this.simulateClick('.menu-link[data-field="Sign In"]');
      break;
      case 'Roster Manager':      
            this.addshiftFlag = true; 
             this.isStaffView=true;   
            this.simulateClick('.menu-link[data-field="Roster Manager"]');
      break;
      case 'Invoice':      
            this.payrollinvoiceFlag = true;   
            this.simulateClick('.menu-link[data-field="Payroll"]'); 
            this.simulateClick('.subcat a[data-field="Invoices"]');
      break;
      case 'Incident Register':      
            this.incidentFlag = true;   
            this.simulateClick('.menu-link[data-field="Incident Register"]'); 
      break;
      case 'Performance Management':      
            this.performanceManagementflag = true;   
            this.simulateClick('.menu-link[data-field="Human Resources"]');
            this.simulateClick('.subcat a[data-field="Performance Management"]');
      break;
      case 'Participant Details':      
            this.participantFlag = true;   
            this.simulateClick('.menu-link[data-field="Participants"]');
      break;
      case 'Leave Management':      
            this.leaveFlag = true;   
            this.simulateClick('.menu-link[data-field="Human Resources"]');
            this.simulateClick('.subcat a[data-field="Leave Management"]');
      break;
      case 'Staff Details':      
            this.staffflag = true;   
            this.simulateClick('.menu-link[data-field="Admin"]');
            this.simulateClick('.subcat a[data-field="Staff"]');
      break;


      default:
          this.dashboardflag = true;

      if(this.addshiftFlag == true ){
         console.log('dash board nav in if  '+this.addshiftFlag);
          this.isStaffView=true;   
      }else{
            console.log('dash board nav in else  '+this.addshiftFlag);
           this.isStaffView=false;   
      }
          
  }



}
simulateClick(selector) {
   setTimeout(() => {
       const element = this.template.querySelector(selector);
       if (element) {
           const event = new Event('click');
           element.dispatchEvent(event);
       }
   });
}






fetchStaffDetails() {
   getStaffEmailAndModules({ userId: Id })
       .then(result => {

           if (result.error) {
               console.error('Error fetching staff details:', result.error);
               return;
           }

           this.staffEmail = result.staffEmail || 'No email found';

           if (result.modules && typeof result.modules === 'string') {
               this.modules = result.modules.split(';');
           } else {
               this.modules = [];
           }

           console.log('Current Modules:', this.modules);
           this.setModuleFlags();
           this.restoreActiveModule();
           
       })
       .catch(error => {
           console.error('Error in fetchStaffDetails:', error);
       });
}


setModuleFlags() {
   this.DashboardModule = this.modules.includes('Dashboard');
   this.adminModule = this.modules.includes('Admin');
   this.HrModule = this.modules.includes('Human Resources');
   this.RosterManagementModule = this.modules.includes('Roster Manager');
   this.SignInModule = this.modules.includes('Sign In');
   this.ParticipantsModule = this.modules.includes('Participants');
   this.PayrollModule = this.modules.includes('Payroll');
   this.AccountingModule = this.modules.includes('Accounting');
   this.IncidentRegisterModule = this.modules.includes('Incident Register');
   this.RepositoryModule = this.modules.includes('Repository');
   this.MyProfileModule = this.modules.includes('My Profile');
   this.PerformanceManagementModule1 = this.modules.includes('Performance Management');
   this.AccessManagerModule = this.modules.includes('Access Manager');
   this.TSignModule = this.modules.includes('T sign');
   // this.TSupportModule = this.modules.includes('T Support');
   this.ICTModule = this.modules.includes('ICT Timesheets');
   this.FormsModule = this.modules.includes('Forms');
}

restoreActiveModule() {
   const mainModule = sessionStorage.getItem('activeModule');     // e.g., "Admin"
   const subModule = sessionStorage.getItem('activeContent');     // e.g., "Participant"

   console.log('[🌀 restoreActiveModule] mainModule:', mainModule);
   console.log('[🌀 restoreActiveModule] subModule:', subModule);

   setTimeout(() => {
       const mainSelector = `.menu-link[data-field="${mainModule}"]`;
       const mainElement = this.template.querySelector(mainSelector);
       console.log(`[🔍] Main selector: ${mainSelector}`);
       console.log('[🔍] Found main:', mainElement);

       if (mainElement) {
           mainElement.click();
           console.log(`✅ Clicked main menu: ${mainModule}`);

           // Wait for submenu DOM to be available
           if (subModule) {
               setTimeout(() => {
                   const subSelector = `.subcat a[data-field="${subModule}"]`;
                   const subElement = this.template.querySelector(subSelector);
                   console.log(`[🔍] Sub selector: ${subSelector}`);
                   console.log('[🔍] Found sub:', subElement);

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
           const fallback = this.template.querySelector('.menu-link[data-field="Dashboard"]');
           if (fallback) {
               fallback.click();
               console.log('[✅] Dashboard fallback triggered.');
           }
       }
   }, 300);
}





// Function to Redirect to Dashboard
  redirectToDashboard() {
this.resetFlags();
this.dashboardflag = true;
this.setActiveMenu('dashboard');
this.updateBreadcrumb('Dashboard');
 } 
 setActiveMenu(menuName) {
// Remove active class from all main menu links
const allMenuLinks = this.template.querySelectorAll('.menu-link');
allMenuLinks.forEach(link => link.classList.remove('active'));

// Remove active class from all submenu items
const allSubmenuLinks = this.template.querySelectorAll('.subcat a');
allSubmenuLinks.forEach(link => link.classList.remove('active'));

// Set active class for main menu item
const activeMenu = this.template.querySelector(`[data-content="${menuName}"]`);
if (activeMenu) {
      activeMenu.classList.add('active');
}

// Set active class for submenu items if applicable
const activeSubmenu = this.template.querySelector(`.subcat a[data-content="${menuName}"]`);
if (activeSubmenu) {
      activeSubmenu.classList.add('active');
}
 }

// Function to Reset All Flags
resetFlags() {
   this.staffid = '';
   this.Adminflag = false;
   this.facilityflag = false;
   this.clientflag = false;
   this.participantLoginFlag = false;
   this.staffflag = false;
   this.rewardsFlag = false;
   this.hrflag = false;
   this.trainingFlag = false;
   this.leaveFlag = false;
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
   this.hrstaffflag = false;
}
handleCloseTicket() {
   this.contactUsTicketFlag = false;
   this.dashboardflag = true;
   this.setActiveMenu('dashboard');
   this.updateBreadcrumb('Dashboard');

}


/*@wire(getRecord, { recordId: Id, fields: [UserNameFld,UserEmail,UsrRoleName,UserTypeName]}) 
userDetails({error, data}) {
      if (data) {
         this.currentUser = data.fields.Name.value; 
         this.currentUserEmail=data.fields.Email.value;
         this.currentUserRole =data.fields.User_Role__c.value;
         console.log('data.fields.User_Type__c.value====>'+data.fields.User_Type__c.value);
         this.currentUserType =data.fields.User_Type__c.value;
         console.log('this.currentUserType====>'+this.currentUserType);
         if( this.currentUserRole == 'Portal Account Partner Executive'  ||this.currentUserRole == 'Portal Account Partner Manager'|| this.currentUserRole == 'CEO' || this.currentUserRole == 'Admin' ){
            this.superiors=true;
         
            
         }else{
            this.superiors=false;
         }

         // Set flags based on currentUserType
         if (this.currentUserType == 'NDIS Org Admin' || this.currentUserType == 'Tesseract Admin') {
            this.DashboardModule = true;
               this.adminModule = true;
               this.HrModule = true;
               this.RosterManagementModule = true;
               this.SignInModule = true;
               this.ParticipantsModule = true;
               this.PayrollModule = true;
               this.AccountingModule = true;
               this.IncidentRegisterModule = true;
               this.RepositoryModule = true;
               this.MyProfileModule = true;
               this.PerformanceManagementModule1 = true;
               this.AccessManagerModule = true;
               this.TSignModule = true;
               this.FormsModule = true;

         }
         if (this.currentUserType == 'ICT Admin') {
               this.isIctAdmin = true;
               this.PayrollModule = true;
               this.HrModule = true;
               this.TSignModule = true;
            // this.PerformanceManagementModule1 = true;
               this.MyProfileModule = true;
               this.RepositoryModule = true;
               this.AccessManagerModule = true;
               this.ICTModule = true;
               this.DashboardModule = true;
               this.IncidentRegisterModule = true;
               this.adminModule1 = true;
         }
         /*if (this.currentUserType == 'Outlet Admin') {
               this.isOutletAdmin = true;
         }
         if (this.currentUserType == 'Accountant Admin') {
            this.AccountingModule = true;
            this.IncidentRegisterModule = true;
            this.RepositoryModule = true;
            this.MyProfileModule = true;
         }
         if (this.currentUserType == 'Roster Manager' || this.currentUserType == 'Account (Project Manager)' || this.currentUserType == 'Outlet Admin') {
               this.RosterManagementModule = true;
               this.DashboardModule = true;
               this.SignInModule = true;
               this.ParticipantsModule = true;
               this.AccessManagerModule = true;
               this.IncidentRegisterModule = true;
               this.RepositoryModule = true;
               this.TSignModule = true;
               this.MyProfileModule = true;
               this.PerformanceManagementModule1 = true;
               this.FormsModule = true;
         }
         if (this.currentUserType == 'HR Admin') {
               this.isHrAdmin = true;
               this.PerformanceManagementModule = true;
               this.TSignModule = true;
               this.IncidentRegisterModule = true;
               this.RepositoryModule = true;
               this.AccessManagerModule = true;
               this.MyProfileModule = true;
               this.MyProfileModule = true;
               this.DashboardModule = true;
         }
         if (this.currentUserType == 'Payroll Admin') {
               this.isPayRollAdmin = true;
               this.PerformanceManagementModule1 = true;
               this.IncidentRegisterModule = true;
               this.RepositoryModule = true;
               this.DashboardModule = true;


         }
         if (this.currentUserType == 'ICT Staff') {
               this.MyProfileModule = true;
               this.RepositoryModule = true;
               //this.PerformanceManagementModule1 = true;
               this.IncidentRegisterModule = true;
               this.ICTModule = true;
         }
         if (this.currentUserType == 'NDIS Staff') {
            this.RosterManagementModule = true;
               this.ParticipantsModule = true;
               this.SignInModule = true;
               this.IncidentRegisterModule = true;
               this.RepositoryModule = true;
               this.PerformanceManagementModule1 = true;
               this.MyProfileModule = true;
               this.DashboardModule = true;
         }
         if (this.currentUserType == 'NDIS Participants') {
               this.isNdisParticipants = true;
               this.IncidentRegisterModule = true;

               // Refresh data after a short delay (4 seconds)
               setTimeout(() => {
                  refreshApex(this.wiredClientResult);
               }, 4000);
         }
         if (this.currentUserType == 'Payroll Accountant for Multiple') {
               this.isPayrollAccountant = true;
         }
         if (this.currentUserType == 'Accountant for Organisation') {
               this.isPayrollAccountantforOrg = true;
         }


         if( this.currentUserRole == 'Portal Account Partner Executive'  ||this.currentUserRole == 'Portal Account Partner Manager'|| this.currentUserRole == 'CEO' || this.currentUserRole == 'Admin' ){
               this.superiors=true;
         
         }else{
               this.superiors=false;
         }

         console.log('current role ' +this.currentUserRole);
         console.log(' staffUser '+this.staffuser);
         console.log(' org admin  '+ this.orgadmin);
         console.log(' superiorflag  '+ this.superiors);
      } else if (error) {
         this.usererror = error ;
      }
}*/


@wire(getStaffByEmail, { email: '$currentUserEmail' })
wiredClient(result) {
      this.wiredClientResult = result;
      console.log('Result: ', result); // Debugging line

      const { data, error } = result;
      if (data) {
         console.log('parent Data: ', data); // Debugging line
         this.clientData = data;
         this.StaffId = this.clientData[0].Id;
         
      } else if (error) {
         console.error('Error: ', error); // Debugging line
         this.handleError(error);
      }
}

handleMenuClick(event) {
   const allMenuLinks = this.template.querySelectorAll('.menu-link');
   allMenuLinks.forEach(link => link.classList.remove('active'));

   let clickedLink = event?.target?.closest?.('.menu-link') || null;

   // 🧠 Support fake event triggered from JS (like in triggerMenuByName)
   if (!clickedLink && event?.target?.dataset?.field) {
       clickedLink = Array.from(allMenuLinks).find(
           link => link.dataset.field?.toLowerCase() === event.target.dataset.field.toLowerCase()
       );
   }

   if (clickedLink) {
       clickedLink.classList.add('active');
       this.activeMenu = clickedLink.dataset.field || '';
       console.log(`✅ handleMenuClick → Activated Main Menu: "${this.activeMenu}"`);
       
   } else {
       console.warn('⚠️ handleMenuClick → No valid main menu clicked.');
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
        submenuLinks = this.template.querySelectorAll('.subcat a');
        submenuLinks.forEach(link => link.classList.remove('active'));
    } catch (e) {
        console.warn('⚠️ Could not query .subcat a:', e);
    }

    let clickedSubmenuLink = event?.target?.closest?.('a');

    if (!clickedSubmenuLink && event?.target?.dataset?.field) {
        clickedSubmenuLink = Array.from(submenuLinks).find(
            link => link.dataset.field?.toLowerCase() === event.target.dataset.field.toLowerCase()
        );
    }

    if (clickedSubmenuLink) {
        clickedSubmenuLink.classList.add('active');
        this.activeSubmenu = clickedSubmenuLink.dataset.field || clickedSubmenuLink.textContent.trim();
        console.log(`✅ handleSubmenuClick → Activated Submenu: "${this.activeSubmenu}"`);
    } else {
        // 🚨 LMS fallback — DOM element doesn’t exist
        this.activeSubmenu = event?.target?.dataset?.field || 'Unknown';
        console.warn(`⚠️ handleSubmenuClick → DOM not found, fallback activated: "${this.activeSubmenu}"`);
    }

    // Optional: update title
    // document.title = `${this.activeMenu} - ${this.activeSubmenu} | TesseractApps`;
}


findActiveMainMenuName() {
   const activeMainMenu = this.template.querySelector('.menu-link.active');
   return activeMainMenu?.dataset?.field || 'Dashboard';
}


modulewisedisplaying()
{        
   this.isAdminMenuVisible = false;
   this.isHrMenuVisible = false;
   this.isRosterMenuVisible = false;
   this.isPayrollMenuVisible = false;
   this.isMyProfileMenuVisible = false;
   this.isAccountingMenuVisible = false;
   this.Adminflag = false;
   this.clientflag = false;
   this.participantLoginFlag = false;
   this.staffflag = false;
   this.facilityflag = false;
   this.rewardsFlag = false;
   this.trainingFlag = false;
   this.leaveFlag =false;
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
   this.documentflag = false;
   this.performanceManagementflag = false;
   this.myProfilePerformanceFlag = false;
   this.libraryGoalflag = false;
   this.dashboardflag = false;
   this.isTSignVisible = false;
   this.userAccessManagementflag = false;
   this.userResetPasswordflag=false;
   this.userStaffManagementflag = false;
   this.isHrMenuVisible = false;
   this.isRosterMenuVisible = false;
   this.isPayrollMenuVisible = false;
   this.isMyProfileMenuVisible = false;
   this.isAccountingMenuVisible = false;
   this.isPerformanceMenuVisible = false;
   this.isUserManagementVisible = false;
   this.isTSignVisible = false;
   this.isFormsVisible = false;
   this.userStaffReportflag = false;
   this.Icttimesheetflag = false;
   this.formsflag =false;
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
   this.RejectedFlag =false;
   this.RejectedReportsFlag =false;
   this.TlearnerFlag = false;
   this.hrstaffflag = false;
}

handleClearStaffId() {
   console.log('✅ Staff ID used by child. Clearing now.');
   this.staffid = '';
}


handleModuleClick(event)
{
   this.tsignreUrl = '';
   
//    if (!this.isTaskNavigation) {
//       console.log('🔁 Clearing staffid – manual navigation');
//       this.staffid = '';
//   } else {
//       console.log('✅ Preserving staffid – came from task');
//       this.isTaskNavigation = false;
//   }

   const moduleName = event.target.dataset.field;     
   
   const selectedField = event.currentTarget.dataset.field;
const selectedContent = event.currentTarget.dataset.content;

// ✅ Determine if this is a submenu click
if (selectedContent && selectedContent !== selectedField) {
    // Submenu (e.g., Participant under Admin)
    sessionStorage.setItem('activeModule', selectedContent); // "Admin"
    sessionStorage.setItem('activeContent', selectedField);  // "Participant"
    console.log(`[📝] Saved submenu: ${selectedField} under ${selectedContent}`);
} else {
    // Main menu (e.g., Dashboard)
    sessionStorage.setItem('activeModule', selectedField);
    sessionStorage.setItem('activeContent', '');
    console.log(`[📝] Saved main menu: ${selectedField}`);
}

   
   

  console.log('moduleName >>',moduleName);

   if (moduleName === 'Admin' && this.isAdminMenuVisible) {
      this.isAdminMenuVisible = false; 
      this.facilityflag = false; 
      this.clientflag = false; 
      this.participantLoginFlag = false;
      this.staffflag = false; 
      this.Adminflag = true;
      this.updateBreadcrumb('Admin');
      return; 
   }
   if (moduleName === 'Human Resources' && this.isHrMenuVisible) {
      this.isHrMenuVisible = false; 
      this.rewardsFlag = false; 
      this.recruitmentFlag = false; 
      this.trainingFlag = false; 
      this.leaveFlag = false;
      this.hrstaffflag = true;
      //this.staffflag = true;
      this.performanceManagementflag = false;
      this.libraryGoalflag = false;
      this.updateBreadcrumb('Human Resources');
      return; 
   }
   if (moduleName === 'Roster Manager' && this.isRosterMenuVisible) {
      this.isRosterMenuVisible = false; 
      this.shiftacceptFlag = false; 
      this.attendenceFlag = false; 
      this.rosterTimeSheet = false;
      this.submissionFlag = false;
      this.RejectedFlag = false;
      this.RejectedReportsFlag = false;
      this.addshiftFlag = true;
      this.updateBreadcrumb('Roster Manager');
      return; 
   }
   if (moduleName === 'Payroll' && this.isPayrollMenuVisible) {
      this.isPayrollMenuVisible = false; 
      this.payrollexpenseFlag = false; 
      this.payrollinvoiceFlag = false; 
      this.payrollwagesFlag = false;
      this.payrollSettingsFlag = false;
      this.payrollFlag = true;
      this.updateBreadcrumb('Payroll');
      return; 
   }
   if (moduleName === 'Accounting' && this.isAccountingMenuVisible) {
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
      this.updateBreadcrumb('Accounting');
      return; 
   }
   if (moduleName === 'My Profile' && this.isMyProfileMenuVisible) {
      this.isMyProfileMenuVisible = false; 
      this.awardFlag = false; 
      this.profiletrainingFlag = false;
      this.profileleaveFlag = false;
      this.reportsFlag = false;
      this.profileflag = true;
      this.myProfilePerformanceFlag = false;
      this.StaffAvailabilityFlag = false;
      this.updateBreadcrumb('My Profile');
      return; 
   }
   // if (moduleName === 'Performance Management' && this.isPerformanceMenuVisible) {
   //    this.isPerformanceMenuVisible = false; 
   //    this.libraryGoalflag = false;
   //    this.performanceManagementflag = true;
   //    return; 
   // }
   if (moduleName === 'Access Manager' && this.isUserManagementVisible) {
      this.isUserManagementVisible = false; 
      this.userAccessManagementflag = false;
      this.userStaffManagementflag = false;
      this.userResetPasswordflag = false;
      this.userStaffReportflag = false;
      this.accessManagerflag = true;
      this.updateBreadcrumb('Access Manager');
      return; 
   }
   if (moduleName === 'T sign' && this.isTSignVisible) {
      this.isTSignVisible = false; 
      this.documentflag = false;
      this.tSignflag = true;
      this.updateBreadcrumb('T sign');
      return; 
   }
   if (moduleName === 'Forms' && this.isFormsVisible) {
      this.isFormsVisible = false; 
      this.manageformsflag = false;
      this.formsflag = true;
      this.updateBreadcrumb('Forms');
      return; 
   }


   this.modulewisedisplaying();             
   switch (moduleName) {
      case 'Dashboard':
         this.dashboardflag = true;
         this.handleMenuClick(event);
         this.updateBreadcrumb('Dashboard'); 
         break;
      case 'TicketManager':
         this.ticketflag = true;
         this.handleMenuClick(event);
         break;
      case 'Admin':            
         this.isAdminMenuVisible = !this.isAdminMenuVisible;
         this.Adminflag = true;
         this.handleMenuClick(event);
         this.updateBreadcrumb('Admin');                         
         break;
      case 'Facility':   
         this.isAdminMenuVisible  = true        
         this.facilityflag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Admin', 'Facility');
         break;
      case 'Participant':   
         this.isAdminMenuVisible = true;         
         this.clientflag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Admin', 'Participant');
         break;
      case 'Staff':
         this.isAdminMenuVisible = true
         this.staffflag = true; 
         console.log('1578 '+this.staffflag )     
       //  this.staffidflag =false;  
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Admin', 'Staff');    
         break;
      case 'Admin ICT':

         break;
      case 'Facility ICT':
         
         break;
      case 'Staff ICT':
         
         break;
      case 'Human Resources':            
         this.isHrMenuVisible = !this.isHrMenuVisible;
         this.hrstaffflag = true; 
        // this.staffflag= true; 
         this.handleMenuClick(event);
         this.updateBreadcrumb('Human Resources');           
         break;
      case 'Awards & Recognition':
         this.isHrMenuVisible = true;
         this.rewardsFlag = true;   
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Human Resources', 'Awards & Recognition');         
         break;
      case 'Recruitment':
         this.isHrMenuVisible = true;
         this.recruitmentFlag = true;  
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Human Resources', 'Recruitment');           
         break;
      case 'Training & Evaluation':
         this.isHrMenuVisible = true;
         this.trainingFlag = true;     
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Human Resources', 'Training & Evaluation');        
         break;
      case 'Staff Availability':
         this.isMyProfileMenuVisible = true;
         this.StaffAvailabilityFlag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('My Profile', 'My Availability');        
         break;
      case 'Leave Management':
    console.log('[✅ CASE] Leave Management logic triggered');
    this.isHrMenuVisible = true;
    this.leaveFlag = true;

    console.log('[➡️ CALL] About to call handleSubmenuClick');
    this.handleSubmenuClick(event);
    console.log('[✅ CALL] handleSubmenuClick finished');

    console.log('[➡️ CALL] About to call updateBreadcrumb');
    this.updateBreadcrumb('Human Resources', 'Leave Management');
    console.log('[✅ CALL] updateBreadcrumb finished');
    break;

      case 'Roster Manager':
         this.isRosterMenuVisible = !this.isRosterMenuVisible;
         this.addshiftFlag = true;
         this.handleMenuClick(event);
         this.updateBreadcrumb('Roster Manager');              
         break;
      case 'My Roster':
         this.isRosterMenuVisible = true;
         this.shiftacceptFlag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Roster Manager', 'My Roster');
         break;
      case 'RejectedShift':
         this.isRosterMenuVisible = true;
         this.RejectedFlag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Roster Manager', 'Rejected Shift');
         break;
      case 'RejectedReports':
         this.isRosterMenuVisible = true;
         this.RejectedReportsFlag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Roster Manager', 'Rejected Reports');
         break;
      /*case 'Timesheet':
         this.isRosterMenuVisible = true;
         this.attendenceFlag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Roster Manager', 'Timesheet');
         break;*/
      
      case 'Timesheet':
         this.isRosterMenuVisible = true;
         this.rosterTimeSheet = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Roster Manager', 'Timesheet');
         break;
      case 'Reimbursement':
         this.isRosterMenuVisible = true;
         this.submissionFlag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Roster Manager', 'Reimbursement');
         break;
      case 'Roster Manager Staff':
         this.isRosterMenuVisible = !this.isRosterMenuVisible;
         this.shiftacceptFlag = true;         
         this.handleMenuClick(event);
         this.updateBreadcrumb('Roster Manager');            
         break;
      case 'My Roster Staff': 
         
         break;
      case 'Timesheet Staff': 
         
         break;
      case 'Reimbursement Staff': 
         
         break;
      case 'Sign In': 
         this.SignInFlag = true;
         this.handleMenuClick(event);
         this.updateBreadcrumb('Sign In');
         break;
      case 'Participants': 
        // this.riskIndexDetailsFromChild={};   
         console.log('User Type :'+ this.currentUserType);
         if(this.currentUserType == 'NDIS Participants'){            
            this.participantLoginFlag = true;
         } else{
            this.participantFlag = true;
         }
         this.handleMenuClick(event);
         this.updateBreadcrumb('Participants');
         break;
      case 'Payroll': 
         this.isPayrollMenuVisible = !this.isPayrollMenuVisible;
         this.payrollFlag = true;
         this.handleMenuClick(event);
         this.updateBreadcrumb('Payroll');
         break;         
      case 'Expenses': 
         this.isPayrollMenuVisible = true;
         this.payrollexpenseFlag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Payroll', 'Expenses');
         break;
      case 'Invoices': 
         this.isPayrollMenuVisible = true;
         this.payrollinvoiceFlag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Payroll', 'Invoices');
         break;
      case 'Wages': 
         this.isPayrollMenuVisible = true;
         this.payrollwagesFlag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Payroll', 'Wages');
         break;
      case 'Payroll Settings':
         this.isPayrollMenuVisible = true; 
         this.payrollSettingsFlag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Payroll', 'Settings');
         break;
      case 'Incident Register': 
         this.incidentFlag = true;
         this.handleMenuClick(event);
         this.updateBreadcrumb('Incident Register');
         break;
      case 'Repository': 
         this.repositoryFlag = true;
         this.handleMenuClick(event);
         this.updateBreadcrumb('Repository');
         break;
      case 'ICT Timesheet': 
         this.Icttimesheetflag =true;
         this.handleMenuClick(event);
         this.updateBreadcrumb('ICT Timesheet');
         break;
      case 'NDIS Payroll': 
         // this.isPayrollMenuVisible = !this.isPayrollMenuVisible;
          this.isAccountingMenuVisible = true;
          this.ndisPayrollFlag = true;
          this.handleSubmenuClick(event);
          this.updateBreadcrumb('Accounting', 'Payroll');
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
      case 'NDIS Sales and Purchases': 
            this.isAccountingMenuVisible = true;
            this.ndisPayrollinvoiceFlag = true;
            this.handleSubmenuClick(event);
            this.updateBreadcrumb('Accounting', 'Sales and Purchases');
            break;
      //  case 'NDIS Wages': 
      //     this.isAccountingMenuVisible = true;
      //     this.ndisPayrollwagesFlag = true;
      //     this.handleSubmenuClick(event);
      //     break;
      case 'Bank Feed': 
            this.isAccountingMenuVisible = true;
            this.ndisBankFeedFlag = true;
            this.handleSubmenuClick(event);
            this.updateBreadcrumb('Accounting', 'Bank Feed');
            break;
         
       case 'NDIS Payroll Settings':
          this.isAccountingMenuVisible = true; 
          this.ndisPayrollSettingsFlag = true;
          this.handleSubmenuClick(event);
          this.updateBreadcrumb('Accounting', 'Settings');
          break;
      case 'Accounting': 
         this.isAccountingMenuVisible = !this.isAccountingMenuVisible;
         this.masterFlag = true;
         this.handleMenuClick(event);
         this.updateBreadcrumb('Accounting');
         break;
      case 'General Ledger': 
         //this.isAccountingMenuVisible = !this.isAccountingMenuVisible;
         this.isAccountingMenuVisible = true;
         this.MasterDBFlag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Accounting', 'General Ledger');
         break;
      case 'Chart of Accounts': 
         this.isAccountingMenuVisible = true;
         this.AccountingFlag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Accounting', 'Chart of Accounts');
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
      case 'Reports': 
         this.isAccountingMenuVisible = true;
         this.accountingReportsFlag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Accounting', 'Reports');
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
      case 'My Profile': 
         this.isMyProfileMenuVisible = !this.isMyProfileMenuVisible;
         this.profileflag = true;
         this.handleMenuClick(event);
         this.updateBreadcrumb('My Profile');
         break;
      case 'MP Awards & Recognition':
         this.isMyProfileMenuVisible = true; 
         this.awardFlag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('My Profile', 'Awards & Recognition');
         break;
      case 'MP Training & Evaluation':
         this.isMyProfileMenuVisible = true; 
         this.profiletrainingFlag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('My Profile', 'Training & Evaluation');
         break;
      case 'MP Leave Management':
         this.isMyProfileMenuVisible = true; 
         this.profileleaveFlag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('My Profile', 'Leave Management');
         break;
      case 'MP Reports':
         this.isMyProfileMenuVisible = true; 
         this.reportsFlag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('My Profile', 'Reports');
         break;
      case 'MP Performance Management':
         this.isMyProfileMenuVisible = true; 
         this.myProfilePerformanceFlag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('My Profile', 'Performance Management');
         break;
      case 'Performance Management': 
         console.log('usertype in library goal : '+this.currentUserType);
         //this.isPerformanceMenuVisible = !this.isPerformanceMenuVisible;
         this.isHrMenuVisible = true; 
         this.performanceManagementflag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Human Resources', 'Performance Management');
         break;
      case 'Manage Library Goal':
         this.isHrMenuVisible = true; 
         this.libraryGoalflag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Human Resources', 'Library Goal');
         break;
      case 'Access Manager': 
         this.isUserManagementVisible = ! this.isUserManagementVisible;
         this.accessManagerflag = true;
         this.handleMenuClick(event);
         this.updateBreadcrumb('Access Manager');
         break;
      case 'Staff Management':
         this.isUserManagementVisible = true; 
         this.userStaffManagementflag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Access Manager', 'Staff Management');
         break;
      case 'User Management':
         this.isUserManagementVisible = true; 
         this.userAccessManagementflag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Access Manager', 'User Management');
         break;
      case 'Reset Password':
         this.isUserManagementVisible = true; 
         this.userResetPasswordflag=true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Access Manager', 'Reset Password');
         break;
      case 'User Report':
         this.isUserManagementVisible = true; 
         this.userStaffReportflag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Access Manager', 'User Report');
         break;
      case 'T sign': 
         this.isTSignVisible = ! this.isTSignVisible;
         this.tSignflag = true;
         this.handleMenuClick(event);
         this.updateBreadcrumb('T sign');
         break;
      case 'T Support': 
         this.tSupportflag = true;
         this.handleMenuClick(event);
         this.updateBreadcrumb('T support');
         break;
      case 'Document':
         this.isTSignVisible = true; 
         this.documentflag = true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('T sign','Document');
         break
      case 'Forms': 
         this.isFormsVisible = ! this.isFormsVisible;
         this.formsflag =true;
         this.handleMenuClick(event);
         this.updateBreadcrumb('Forms');
         break;
      case 'ManageForm':
         this.isFormsVisible =true;
         this.manageformsflag=true;
         this.handleSubmenuClick(event);
         this.updateBreadcrumb('Forms', 'Manage Forms');
         break;
      case 'T Learner':
         this.TlearnerFlag = ! this.TlearnerFlag;
         this.handleMenuClick(event);
         this.updateBreadcrumb('T Learner');
         break;
      case 'Chatter':
         this.chatterFlag = true;
         this.handleMenuClick(event);
         this.updateBreadcrumb('ChaT');
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
if(this.participantFlag==false){
      this.riskIndexDetailsFromChild={}
   }
    this.isStaffView=false;   
  
   if(this.staffidflag == 'Staff Document Expiry' &&  this.staffid !='')  {
   this.staffidflag='TEMP';
   console.log(' else staff id onclick'+this.staffid);
   
   }

   
    if( this.Adminflag == true &&  this.staffflag == true && this.staffidflag != 'Staff Document Expiry' && this.staffidflag != 'TEMP' ){
       this.staffid='';
   }


  
  
 

}

// restoreStateFromUrl() {                //after URL
//    const pathname = window.location.pathname.replace('/s/', '');
//    if (!pathname) {
//        this.dashboardflag = true;
//        this.setActiveMenu('Dashboard');
//        document.title = 'TesseractApps'; // Ensure fallback title is correct
//        return;
//    }

//    const segments = pathname.split('/').map(p => p.replace(/-/g, ' '));
//    const moduleName = segments[0];
//    const submenuName = segments.length > 1 ? segments[1] : null;

//    console.log(`🌐 Restoring from URL → Module: "${moduleName}", Submenu: "${submenuName || 'None'}"`);

//    this.triggerMenuByName(moduleName, submenuName);

//    // Delay logic
//    const isRoster = moduleName?.toLowerCase().includes('roster management');
//    const delay = isRoster ? 800 : 300;

//    // First attempt after delay
//    setTimeout(() => {
//        this.applyActiveClassFromNames(moduleName, submenuName);
//        this.retryActiveClassApply(moduleName, submenuName);
//    }, delay);

//    // Set page title
//    if (submenuName) {
//        document.title = `${moduleName} - ${submenuName} | TesseractApps`;
//    } else {
//        document.title = `${moduleName} | TesseractApps`;
//    }
// }
// retryActiveClassApply(moduleName, submenuName = null) {
//    const normalizedModule = moduleName?.trim().toLowerCase();
//    const normalizedSubmenu = submenuName?.trim().toLowerCase();
//    let attempts = 0;
//    const maxAttempts = 5;

//    const retryInterval = setInterval(() => {
//        attempts++;

//        const menuLink = Array.from(this.template.querySelectorAll('.menu-link')).find(
//            link => link.dataset.field?.trim().toLowerCase() === normalizedModule
//        );
//        const submenuLink = submenuName
//            ? Array.from(this.template.querySelectorAll('.subcat a')).find(
//                link => link.dataset.field?.trim().toLowerCase() === normalizedSubmenu
//            )
//            : null;

//        if (menuLink && (!submenuName || submenuLink)) {
//            if (menuLink) menuLink.classList.add('active');
//            if (submenuLink) submenuLink.classList.add('active');
//            console.log(`✅ Retry success after ${attempts} attempt(s)`);
//            clearInterval(retryInterval);
//        } else if (attempts >= maxAttempts) {
//            console.warn(`❌ Retry failed after ${maxAttempts} attempts for "${moduleName}" > "${submenuName}"`);
//            clearInterval(retryInterval);
//        }
//    }, 400); // Retry every 400ms
// }



// renderedCallback() {                //after URL
//    if (this._hasRendered) return;
//    this._hasRendered = true;

//    // ✅ Initialize the observer only once
//    this.initializeMenuObserver();
// }


// initializeMenuObserver() {             //after URL
//    const container = this.template.querySelector('.sidebar'); // ✅ This matches your actual DOM class

//    if (!container) {
//        console.warn('⚠️ Sidebar container not found for MutationObserver.');
//        return;
//    }

//    const observer = new MutationObserver(() => {
//        this.applyActiveClassFromNames(this.activeMenu, this.activeSubmenu);
//    });

//    observer.observe(container, {
//        childList: true,
//        subtree: true,
//    });

//    console.log('👁️ MutationObserver initialized for sidebar re-renders.');
// }







// handleBrowserNavigation(event) {        //after URL
//    const state = event.state;

//    if (state && state.module) {
//        const moduleName = state.module;
//        const submenuName = state.submenu || null;

//        console.log(`🔙 Browser Nav → Module: "${moduleName}", Submenu: "${submenuName || 'None'}"`);

//        // Trigger module/submenu
//        this.triggerMenuByName(moduleName, submenuName);
//        this.applyActiveClassFromNames(moduleName, submenuName);
//        console.log('📜 Current History State:', JSON.stringify(history.state));

       
//    } else {
//        console.log('🔙 Browser Nav → No state found. Defaulting to Dashboard.');
//        this.resetFlags();
//        this.dashboardflag = true;
//        this.applyActiveClassFromNames('Dashboard');
//    }
//    // Delay page title only for Roster Management (to wait for submenu/component render)
// let title = 'Dashboard | TesseractApps';

// if (moduleName && submenuName) {
//     title = `${moduleName} - ${submenuName} | TesseractApps`;
// } else if (moduleName) {
//     title = `${moduleName} | TesseractApps`;
// }

// // ⏱️ Apply longer delay only for "Roster Management"
// const isRoster = moduleName?.toLowerCase().includes('roster-management');    
// const delay = isRoster ? 800 : 250;

// setTimeout(() => {
//     document.title = title;
// }, delay);

  
// }


// preventBrowserNavigation(event) {
//    console.warn('🔒 Prevented browser navigation (back/forward).');

//    // Don't allow user to navigate using browser controls
//    setTimeout(() => {
//        // Restore current state (prevent unwanted URL)
//        const moduleSegment = (this.activeMenu || 'Dashboard').replace(/\s+/g, '-');
//        const submenuSegment = this.activeSubmenu ? this.activeSubmenu.replace(/\s+/g, '-') : null;

//        let newPath = `/s/${moduleSegment}`;
//        if (submenuSegment) {
//            newPath += `/${submenuSegment}`;
//        }

//        // 🚫 Push same state back (block navigation effect)
//        history.pushState({ module: this.activeMenu, submenu: this.activeSubmenu }, '', newPath);

//        // 🛑 Don't change tab title
//        // document.title is not updated here — it stays as-is intentionally

//        // Reapply highlight in case UI was affected
//        this.applyActiveClassFromNames(this.activeMenu, this.activeSubmenu);

//        console.log('🔄 URL forcibly restored to prevent browser navigation.');
//    }, 0);
// }



// blockNavigation(event) {
//    console.warn('🔒 Prevented browser navigation (back/forward).');

//    // Force browser to jump back to current state immediately
//    setTimeout(() => {
//        const currentState = history.state || {};
//        const currentPath = window.location.pathname;

//        // Re-push the current state to revert the browser’s URL change
//        history.pushState(currentState, '', currentPath);

//        // Re-highlight UI in case something was affected
//        this.applyActiveClassFromNames(this.activeMenu, this.activeSubmenu);
//    }, 0);
// }



// triggerMenuByName(moduleName, submenuName = null) {               //after URL
//    // 🔄 Fake event for module click
//    const fakeModuleEvent = { target: { dataset: { field: moduleName } } };

//    // ✅ Use timeout to ensure DOM readiness
//    setTimeout(() => {
//        this.handleModuleClick(fakeModuleEvent);

//        // Submenu logic stays the same
//        if (submenuName) {
//     const submenuLink = this.template.querySelector(`.subcat a[data-field="${submenuName}"]`);
//     if (submenuLink) {
//         submenuLink.click(); // If using click bindings
//         // OR
//         this.handleSubmenuClick({ target: submenuLink }); // Simulate LWC-style event
//     }
// }

//    }, 100); // Delay for main menu
// }





// applyActiveClassFromNames(moduleName, submenuName = null) {             //after URL
//    const normalizedModule = moduleName?.trim().toLowerCase();
//    const normalizedSubmenu = submenuName?.trim().toLowerCase();

//    // Deactivate all main menu links
//    const allMenuLinks = this.template.querySelectorAll('.menu-link');
//    allMenuLinks.forEach(link => link.classList.remove('active'));

//    // Activate correct main menu
//    const matchedMainMenu = Array.from(allMenuLinks).find(link =>
//        link.dataset.field?.trim().toLowerCase() === normalizedModule
//    );
//    if (matchedMainMenu) {
//        matchedMainMenu.classList.add('active');
//    } else {
//        console.warn(`⚠️ Main menu "${moduleName}" not found.`);
//    }

//    if (!normalizedSubmenu) return; // Existing

// // ✅ Add logic below to highlight submenu
// const allSubmenuLinks = this.template.querySelectorAll('.subcat a');
// allSubmenuLinks.forEach(link => link.classList.remove('active'));

// const matchedSubmenu = Array.from(allSubmenuLinks).find(link =>
//     link.dataset.field?.trim().toLowerCase() === normalizedSubmenu
// );
// if (matchedSubmenu) {
//     matchedSubmenu.classList.add('active');
// } else {
//     console.warn(`⚠️ Submenu "${submenuName}" not found.`);
// }


//    // Retry mechanism in case submenu isn't yet rendered
//    let attempts = 0;
//    const maxAttempts = 10;

//    const retryInterval = setInterval(() => {
//        const submenuLinks = this.template.querySelectorAll('.subcat a');
//        const matchedSubmenu = Array.from(submenuLinks).find(link =>
//            link.dataset.field?.trim().toLowerCase() === normalizedSubmenu
//        );

//        if (matchedSubmenu) {
//            submenuLinks.forEach(link => link.classList.remove('active'));
//            matchedSubmenu.classList.add('active');
//            console.log(`✅ Submenu "${submenuName}" activated after ${attempts + 1} attempt(s).`);
//            clearInterval(retryInterval);
//        } else if (++attempts >= maxAttempts) {
//            console.warn(`❌ Failed to activate submenu "${submenuName}" after ${maxAttempts} attempts.`);
//            clearInterval(retryInterval);
//        }
//    }, 150);
// }




updateFavicon(iconUrl) {
   const existing = document.querySelector("link[rel*='icon']");
   if (existing) {
       existing.parentNode.removeChild(existing);
   }
   const link = document.createElement('link');
   link.type = 'image/png';
   link.rel = 'icon';
   link.href = iconUrl;

   document.head.appendChild(link);
}
handleNaviagteToRiskManagement(event){
   console.log(' navigated from roster ');
   console.log('event details'+JSON.stringify(event.detail));
   this.modulewisedisplaying();
   this.ParticipantsModule = true;
   this.riskIndexDetailsFromChild={}
   this.riskIndexDetailsFromChild=event.detail;

   setTimeout(() => {
       const participantModuleEvent = new Event('click');
       const participantMenuItem = this.template.querySelector(`.menu-link[data-field="Participants"]`);
       if (participantMenuItem) {
            participantMenuItem.dispatchEvent(participantModuleEvent);
       }
   });

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
    this.updateBreadcrumb('Forms');
    this.setActiveMenu('Participants');
}
handleBackFromForms(event) {
    this.resetFlags();
    this.participantFlag = true;
    this.updateBreadcrumb('Participants');
    this.setActiveMenu('Participants');
}

subscribeToDashboardMessage() {
        if (this.subscription) {
            return; // Already subscribed
        }

        this.subscription = subscribe(
            this.messageContext,
            DASHBOARD_REDIRECT_CHANNEL,
            (message) => this.handleRedirectMessage(message)
        );
    }

    submoduleToParentMap = {
    'Leave Management': 'Human Resources',
    'Awards & Recognition': 'Human Resources',
    'Performance Management' : 'Human Resources',
    'Staff': 'Admin',
    'Facility': 'Admin',
    'Participant': 'Admin',
    'Invoices': 'Payroll',
    'Expenses': 'Payroll',
    'Recruitment': 'Human Resources',
    'Training & Evaluation': 'Human Resources',
    'User Management': 'Access Manager',
    'Reset Password': 'Access Manager',
    'Staff Management': 'Access Manager',
    'Staff Availability': 'My Profile',
    'MP Reports': 'My Profile',

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

handleRedirectMessage(message) {
    let target = message?.target;
    if (!target) return;

    // Normalize casing
    target = target
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    const parent = this.submoduleToParentMap?.[target] || '';

    console.log('[🔁 LMS] Redirecting to:', { target, parent });

    // 🔁 1. Open parent first (e.g. Human Resources)
    if (parent) {
        const parentEvent = {
            target: { dataset: { field: parent } },
            currentTarget: { dataset: { field: parent, content: '' } }
        };
        this.handleModuleClick(parentEvent);
    }

    // 🔁 2. Then click submenu *after a short delay*
    setTimeout(() => {
        const submenuEvent = {
            target: { dataset: { field: target } },
            currentTarget: { dataset: { field: target, content: parent } }
        };
        this.handleModuleClick(submenuEvent);
    }, 100); // Wait just enough for menu state to update
}



}