import { LightningElement, track, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import CURRENT_USER_ID from "@salesforce/user/Id";
import getstaffId from "@salesforce/apex/UserAccessController.getstaffId";
import getstaffId1 from "@salesforce/apex/UserAccessController.getstaffId2";
import getLayout from "@salesforce/apex/DashboardLayoutController.getLayout";
import saveLayout from "@salesforce/apex/DashboardLayoutController.saveLayout";
import getAllFacilities from "@salesforce/apex/DashboardLayoutController.getAllFacilities";
import UserNameFld from "@salesforce/schema/User.Name";
import UserEmail from "@salesforce/schema/User.Email";
import UsrRoleName from "@salesforce/schema/User.User_Role__c";
import UserType from "@salesforce/schema/User.User_Type__c";
import getCurrentLoggedUserInfo from "@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo";
import getFacilityCurrentUser from "@salesforce/apex/PortalUserController.getFacilityCurrentUser";
import getFacilityData from "@salesforce/apex/HrHomeHandler.fetchFacilitiess";
import { getRecord } from "lightning/uiRecordApi";
import { loadScript } from "lightning/platformResourceLoader";
import interactjs from "@salesforce/resourceUrl/interact";
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";

export default class DashboardDraggable extends LightningElement {
  @api userId = CURRENT_USER_ID;
  @track isEditMode = false;
  @track widgets = [];
  @track isLoading = true;
  @track showModal = false;
  @track selectedWidgetType = "";
  @track showCollisionWarning = false;
  @track hasVisibleWidgets = true;

  _facilityId;

  @api
  get facilityId() {
    return this._facilityId;
  }

  set facilityId(value) {
    this._facilityId = value;
    this.facilityValue = value;
    console.log("Received Facility ID in Child via setter:", value);
    if (typeof this.refreshAllWidgets === "function") {
      this.refreshAllWidgets();
    }
    // Perform any dependent logic here
    //this.loadFacilityData();
  }

  boundHandleOutsideClick;

  userType;
  UsrTypeUser;
  interactLoaded = false;
  widgetCounter = 0;
  chartRefreshTimeout;
  interactionInitialized = false;
  originalWidgetStates = [];
  collisionWarningTimeout;
  scrollContainer;
  autoScrollInterval;
  isDragging = false;

  // Grid settings for collision detection
  gridSize = 20;
  minWidgetWidth = 250;
  minWidgetHeight = 200;
  widgetPadding = 10;

  // Auto-scroll settings
  scrollSpeed = 10;
  scrollZone = 50; // pixels from edge to trigger scroll

  @track availableWidgetTypes = [];
  @track facilityPreferredName;
  @track participantPreferredName;
  @track staffPreferredName;

  // availableWidgetTypes = [
  //     { label: 'Staff Status Chart', value: 'shift' },
  //     { label: 'Sign In Status Chart', value: 'signin' },
  //     { label: 'Invoice Status Chart', value: 'invoice' },
  //     { label: 'Task Management', value: 'task' },
  //     { label: 'Leave Management Chart', value: 'leave' },
  //     { label: 'Participant Management', value: 'participant' },
  //     { label: 'Incident Register Chart', value: 'incident' },
  //     { label: 'Performance Management Chart', value: 'performance' },
  //     { label: 'Human Resources Dashboard', value: 'hr' },
  //     { label: 'Participants Fund Chart', value: 'fund' }
  // ];

  widgetAccessByRole = {
    "NDIS Org Admin": [
      "shift",
      "signin",
      "task",
      "leave",
      "participant",
      "incident",
      "performance",
      "hr",
      "fund",
      "staff-status",
      "rejectedShifts"
    ],
    "Facility Admin": [
      "shift",
      "signin",
      "task",
      "leave",
      "participant",
      "incident",
      "performance",
      "hr",
      "fund",
      "staff-status"
    ],
    "Roster Manager": [
      "shift",
      "signin",
      "task",
      "leave",
      "participant",
      "incident",
      "performance",
      "hr",
      "fund"
    ],
    "NDIS Staff": [
      "signin",
      "task",
      "leave",
      "staffDashboard",
      "participantSchedule",
      "incident",
      "performance"
    ],
    "Payroll Admin": ["payroll"],
    "HR Admin": ["leave", "incident", "hr", "performance"],
    "ICT Admin": ["staff-status", "task", "hr", "leave", "icttimesheet"],
    "ICT Staff": ["leave", "icttimesheet"],
    "NDIS Participants": ["participantSchedule"],
    "Payroll Accountant for Multiple": ["invoice"],
    "Accountant for Organisation": ["invoice"]
  };
  // allWidgetTypes = {
  //     shift: 'Staff Status Chart',
  //     signin: 'Sign In Status Chart',
  //     invoice: 'Invoice Status Chart',
  //     task: 'Task Management',
  //     leave: 'Leave Management Chart',
  //     participant: 'Participant Management',
  //     incident: 'Incident Register Chart',
  //     performance: 'Performance Management Chart',
  //     hr: 'Human Resources Dashboard',
  //     fund: 'Participants Fund Chart',
  //     'staff-status': 'Staff Status Chart (Alt)'
  // };

  allWidgetTypes = {
    fund: "Funds Tracker",
    hr: "Human Resources",
    incident: "Incident Register",
    invoice: "Invoice",
    leave: "Leave Management",
    participant: "Participant Details",
    performance: "Performance Management",
    shift: "Roster Manager",
    signin: "Sign in",
    "staff-status": "Staff Details",
    task: "Tasks",
    payroll: "Payroll",
    icttimesheet: "ICT Timesheet",
    staffDashboard: "My Details",
    participantSchedule: "Participant Schedule",
    rejectedShifts: "Rejected Shifts"
  };

  async connectedCallback() {
    try {
      // Get stored facility from localStorage
      console.log("Received Facility ID in Child:", this.facilityId);

      // Initialize dashboard and fetch user-specific widgets
      this.initDashboard();
      this.fetchUserAccessDetails();

      // Get logged-in user info
      const userData = await getCurrentLoggedUserInfo();
      console.log("user data ==>", JSON.stringify(userData));

      const userType = userData.User_Type__c;
      this.userType = userType; // Save if needed later

      const facilityData = await getFacilityData();
      console.log("Facility data fetched successfully:", facilityData);
      this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "";
      this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "";
      this.staffPreferredName = localStorage.getItem("defaultStaffPreferredName") || "";
      this.finalListFacilities = [];
      this.selectedFacilities = [];
      this.facilityOptions = facilityData.map((record) => ({
        label: record.Name,
        value: record.Id
      }));

      if (userType === "NDIS Org Admin" || userType === "ICT Admin") {
        this.finalListFacilities = this.facilityOptions;
        console.log(
          "Mapped facility options: FOR ORG ADMIN",
          JSON.stringify(this.finalListFacilities)
        );
      } else if (
        userType === "Facility Admin" ||
        userType === "HR Admin" ||
        userType === "Roster Manager"
      ) {
        try {
          const currentFacilities = await getFacilityCurrentUser();
          console.log(
            "getFacilityCurrentUser facility:",
            JSON.stringify(currentFacilities)
          );

          this.finalListFacilities = currentFacilities.map((record) => ({
            label: record.Facility__r.Name,
            value: record.Facility__r.Id
          }));
          console.log(
            "Mapped facility options: Facility Admin",
            JSON.stringify(this.finalListFacilities)
          );
          this.validateCache();
        } catch (error) {
          this.error = error;
          this.finalListFacilities = [];
          console.error("Error fetching facilities for Facility Admin:", error);
        }
      } else if (userType === "NDIS Staff" || userType === "ICT Staff") {
        try {
          const result = await getstaffId({ userId: this.userId });
          console.log("NDIS/ICT Staff facility result >>", result);

          if (result && result.Facility__c && result.Facility__r?.Name) {
            this.facilityValue = result.Facility__c;
            this.facilityLabel = result.Facility__r.Name;
            this.finalListFacilities = [
              {
                label: this.facilityLabel,
                value: this.facilityValue
              }
            ];

            localStorage.setItem("defaultFacilityId", this.facilityValue);
            localStorage.setItem("defaultFacilityLabel", this.facilityLabel);

            console.log(
              "NDIS/ICT Staff facility from Apex:",
              JSON.stringify(this.finalListFacilities)
            );
          }
        } catch (error) {
          this.error = error;
          this.finalListFacilities = [];
          console.error("Error fetching staff data for NDIS/ICT Staff:", error);
        }
      }

      console.log(
        "this.finalListFacilities >>",
        JSON.stringify(this.finalListFacilities)
      );
    } catch (err) {
      console.error("Unexpected error during connectedCallback:", err);
    }

    // Bind outside click handler and store reference
    this.boundHandleOutsideClick = this.handleOutsideClick.bind(this);
    this.fetchOrgDetails();
  }

  fetchOrgDetails() {
    orgDetails()
      .then((response) => {
        console.log("Response for Org Details =>", response);
        this.Orgid = response.Id;
        this.orgfullname = response.Name;
        //this.facilityPreferredName = response.Facility_Preferred_Name_Formula__c;
        //this.participantPreferredName = response.Participant_Preferred_Name_Formula__c;
      })
      .catch((error) => {
        console.error("Error fetching org details:", error);
        this.error = error;
      });
  }

  disconnectedCallback() {
    this.cleanup();

    if (this.boundHandleOutsideClick) {
      document.removeEventListener("click", this.boundHandleOutsideClick);
    }
  }

  cleanup() {
    if (window.interact) {
      window.interact(".widget").unset();
    }
    if (this.chartRefreshTimeout) {
      clearTimeout(this.chartRefreshTimeout);
    }
    if (this.collisionWarningTimeout) {
      clearTimeout(this.collisionWarningTimeout);
    }
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
    }
  }
  @track staffId = null; // add this at the top
  @track facilityOptions = [];
  @track finalListFacilities = [];
  @track facilityValue;
  @track facilityLabel;

  /*@wire(getRecord, { recordId: CURRENT_USER_ID, fields: [UserNameFld ,UserEmail,UsrRoleName,UserType]})
userDetails({error, data}) {
    if (data) {
        this.currentUser = data.fields.Name.value;
        this.currentUserEmail=data.fields.Email.value;
        this.currentUserRole =data.fields.User_Role__c.value;
        this.userType=data.fields.User_Type__c.value;
        console.log('role==>'+this.currentUserRole);
        console.log('current logged in user==>'+this.currentUser) ;
        console.log('current logged in email==>'+ this.currentUserEmail) ;
        console.log('current logged in userType==>'+ this.userType) ;
        console.log('current logged in Type_of_User__c==>'+ this.userTypeofUser) ;
        console.log('Fetching facility data from Apex...');
        getFacilityData().then(response => {
            console.log('Facility data fetched successfully:', response);
            this.finalListFacilities=[];
            this.selectedFacilities=[];
            this.facilityOptions = response.map(record => ({
                label: record.Name,
                value: record.Id
            }));
            if( this.userType === 'NDIS Org Admin' || this.userType === 'ICT Admin'){
                this.finalListFacilities=this.facilityOptions  ;
                    console.log('Mapped facility options: FOR ORG ADMIN', JSON.stringify(this.finalListFacilities));
                    
            }else if(this.userType =='Facility Admin' || this.userType =='HR Admin' || this.userType =='Roster Manager'){
            
                            getFacilityCurrentUser().then(result => {
                                console.log('getFacilityCurrentUser facility   '+JSON.stringify(result));
                                        this.finalListFacilities =  result.map(record => ({
                                                                label: record.Facility__r.Name,
                                                                value: record.Facility__r.Id
                                                        }));
                                    console.log('Mapped facility options: Facility Admin', JSON.stringify(this.finalListFacilities));
                                    this.validateCache();
                                }).catch(error => {
                                    this.error = error;
                                    this.finalListFacilities = [];
                                    console.error('Error fetching facilities:', error);
                            });
                                    
            } else if (this.userType === 'NDIS Staff' || this.userType === 'ICT Staff') {
                console.log('this.userType in else if >>', this.userType);
                
                getstaffId({ userId: this.userId })
                    .then(result => {
                        console.log('result >>', result);
                            // Use facility from result
                            this.facilityValue = result.Facility__c;
                            this.facilityLabel = result.Facility__r.Name;
                            this.finalListFacilities = [{
                                label: result.Facility__r.Name,
                                value: result.Facility__c
                            }];
                            console.log('NDIS/ICT Staff facility from Apex:', JSON.stringify(this.finalListFacilities));
                        // Save to localStorage cache
                        if (this.facilityValue && this.facilityLabel) {
                            localStorage.setItem('defaultFacilityId', this.facilityValue);
                            localStorage.setItem('defaultFacilityLabel', this.facilityLabel);
                        }

                    })
                    .catch(error => {
                        this.error = error;
                        console.error('Error fetching staff data for NDIS/ICT Staff:', error);
                        this.finalListFacilities = [];
                    });
            }

            console.log('this.finalListFacilities >>', JSON.stringify(this.finalListFacilities));
        })
        .catch(err => {
            console.error('Error fetching facility data:', err);
        });

        } else if (error) {  
                this.usererror = error ;
    }
    
}*/

  validateCache() {
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
  }

  handleFacilitySelect(event) {
    const facilityValue = event.currentTarget.dataset.facilityValue;
    const facilityLabel = event.currentTarget.dataset.facilityLabel;

    this.facilityValue = facilityValue;
    this.facilityLabel = facilityLabel;
    this.isOpen = false;

    // Remove outside click listener when dropdown closes
    document.removeEventListener("click", this.boundHandleOutsideClick);

    console.log("Selected Facility ID >>", this.facilityValue);
    console.log("Selected Facility Label >>", this.facilityLabel);

    localStorage.setItem("defaultFacilityId", this.facilityValue);
    localStorage.setItem("defaultFacilityLabel", this.facilityLabel);

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

    // Call refresh method if it exists
    if (typeof this.refreshAllWidgets === "function") {
      this.refreshAllWidgets();
    }
  }

  handleOutsideClick(event) {
    // Get the dropdown container element
    const dropdownContainer = this.template.querySelector(
      '[data-id="dropdown-container"]'
    );

    // Check if the click target is outside the dropdown container
    if (dropdownContainer && !dropdownContainer.contains(event.target)) {
      this.isOpen = false;
      // Remove the event listener when closing
      document.removeEventListener("click", this.boundHandleOutsideClick);
    }
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
    //this.loadFacilityData();
  }

  @api getCurrentFacility() {
    return {
      value: this.facilityValue,
      label: this.facilityLabel
    };
  }

  refreshAllWidgets() {
    console.log(
      "Selected Facility ID refreshAllWidgets1>>",
      this.facilityValue
    );
    const widgets = this.template.querySelectorAll("c-dynamic-widget");
    console.log(
      "Selected Facility ID refreshAllWidgets2>>",
      this.facilityValue
    );
    widgets.forEach((widget) => {
      if (typeof widget.refresh === "function") {
        console.log(
          "Selected Facility ID refreshAllWidgets3>>",
          this.facilityValue
        );
        widget.refresh(this.facilityValue);
      }
    });
  }

  get dropdownClass() {
    return `slds-dropdown slds-dropdown_small custom-scroll  ${
      this.isOpen ? "slds-show" : "slds-hide"
    }`;
  }

  get chevronClass() {
    return `chevron-icon ${this.isOpen ? "rotated" : ""}`;
  }

  handleToggleDropdown() {
    this.isOpen = !this.isOpen;

    // Add or remove outside click listener based on dropdown state
    if (this.isOpen) {
      // Add listener when dropdown opens
      setTimeout(() => {
        document.addEventListener("click", this.boundHandleOutsideClick);
      }, 0);
    } else {
      // Remove listener when dropdown closes
      document.removeEventListener("click", this.boundHandleOutsideClick);
    }
  }

  @track isOpen = false;
  @track selectedFacilityValue = "";
  @track selectedFacility = null;

  handleMouseLeave() {
    this.isOpen = false;
  }

  get panelClass() {
    return `dashboard-panel ${this.isOpen ? "panel-open" : "panel-closed"}`;
  }

  fetchUserAccessDetails() {
    getstaffId1({ userId: this.userId })
      .then((data) => {
        console.log("Raw data from Apex:", JSON.stringify(data));

        const staffRecord = data?.staff;
        const userType = staffRecord?.User_Type__c;
        const typeofUser = data?.typeOfUser;
        this.staffId = staffRecord?.Id;

        console.log("Staff Record:", userType);
        console.log("Type of User:", typeofUser);

        let allowedWidgets = [];
        if (userType === "Facility Admin" && typeofUser === "ICT") {
          allowedWidgets = [
            "staff-status",
            "task",
            "hr",
            "leave",
            "icttimesheet"
          ];
        } else {
          allowedWidgets = this.widgetAccessByRole[userType] || [];
        }

        // Update participant label dynamically
        const updatedWidgetTypes = {
          ...this.allWidgetTypes,
          participant: this.participantPreferredName
            ? `${this.participantPreferredName} Details`
            : this.allWidgetTypes.participant,
            "staff-status": this.staffPreferredName
            ? `${this.staffPreferredName} Details`
            : this.allWidgetTypes["staff-status"]
        };

        const existingTypes = new Set(this.widgets.map((w) => w.type));
        this.availableWidgetTypes = allowedWidgets
          .filter(
            (type) => !existingTypes.has(type) && updatedWidgetTypes[type]
          )
          .map((key) => ({
            label: updatedWidgetTypes[key],
            value: key
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        console.log("this.availableWidgetTypes >>", this.availableWidgetTypes);
      })
      .catch((error) => {
        console.error("Error fetching user access details:", error);
        this.availableWidgetTypes = [];
      });
  }

  async initDashboard() {
    try {
      this.isLoading = true;

      const userData = await getstaffId({ userId: this.userId });
      this.userType = userData?.User_Type__c || "Default";

      if (!this.interactLoaded) {
        await loadScript(this, interactjs);
        this.interactLoaded = true;
      }

      await this.loadWidgets();
    } catch (error) {
      console.error("Dashboard initialization error:", error);
      this.showToast(
        "Error",
        "Failed to initialize dashboard: " + error.message,
        "error"
      );
    } finally {
      this.isLoading = false;
    }
  }

  get roleKey() {
    return this.userType || "Default";
  }

  get isAddDisabled() {
    return !this.selectedWidgetType;
  }

  get widgetClasses() {
    return `widget ${this.isEditMode ? "edit-mode" : ""}`;
  }

  async loadWidgets() {
    try {
      const layoutJson = await getLayout({ staffId: this.staffId });

      if (
        !layoutJson ||
        layoutJson.trim() === "" ||
        layoutJson.trim() === "[]"
      ) {
        this.widgets = [];
        this.noLayoutAvailable = true; // 🔔 Show message
        // this.showToast('Info', 'No layout is saved.', 'info');
      } else {
        this.widgets = JSON.parse(layoutJson).map((widget, index) => ({
          ...widget,
          visible: widget.visible !== false,
          zIndex: widget.zIndex || index + 1,
          id: widget.id || `${widget.type}-${Date.now()}-${index}`,
          title: widget.title || this.getWidgetTitle(widget.type),
          originalStyle: widget.style
        }));
        this.noLayoutAvailable = false; // ✅ Hide message
      }

      this.originalWidgetStates = JSON.parse(JSON.stringify(this.widgets));
      this.fetchUserAccessDetails();
    } catch (error) {
      console.error("Error loading widgets:", error);
      this.widgets = [];
      this.noLayoutAvailable = true;
      this.originalWidgetStates = [];
    }
  }

  @track noLayoutAvailable = false;

  getDefaultWidgets() {
    return [
      {
        id: "shift-default",
        type: "shift",
        title: "Staff Status Chart",
        style: "position:absolute;top:20px;left:20px;width:400px;height:320px;",
        visible: true,
        zIndex: 1
      },
      {
        id: "signin-default",
        type: "signin",
        title: "Sign In Status Chart",
        style:
          "position:absolute;top:20px;left:440px;width:400px;height:320px;",
        visible: true,
        zIndex: 2
      },
      {
        id: "invoice-default",
        type: "invoice",
        title: "Invoice Status Chart",
        style:
          "position:absolute;top:360px;left:20px;width:400px;height:320px;",
        visible: true,
        zIndex: 3
      },
      {
        id: "task-default",
        type: "task",
        title: "Task Management",
        style:
          "position:absolute;top:360px;left:440px;width:400px;height:320px;",
        visible: true,
        zIndex: 4
      }
    ];
  }

  renderedCallback() {
    // Prevent re-initialization after save/exit
    if (
      !this.isLoading &&
      this.isEditMode &&
      this.interactLoaded &&
      !this.interactionInitialized
    ) {
      setTimeout(() => {
        this.initializeWidgetInteractions();
      }, 500);
    }

    if (!this.isLoading) {
      setTimeout(() => this.refreshAllCharts(), 300);
    }

    if (!this.scrollContainer) {
      this.scrollContainer = this.template.querySelector(".dashboard-grid");
    }
  }

  initializeWidgetInteractions() {
    if (!window.interact || !this.isEditMode) {
      console.warn("Interact.js not available or not in edit mode");
      return;
    }

    try {
      window.interact(".widget").unset();
    } catch (e) {
      console.warn("Error clearing interactions:", e);
    }

    const widgetElements = this.template.querySelectorAll(".widget");
    console.log(
      "Found widget elements for interaction:",
      widgetElements.length
    );

    if (widgetElements.length === 0) {
      console.warn("No widget elements found for interaction setup");
      return;
    }

    widgetElements.forEach((widgetEl, index) => {
      const widgetId = widgetEl.dataset.id;
      console.log(`Setting up interactions for widget ${index + 1}:`, widgetId);

      window
        .interact(widgetEl)
        .draggable({
          allowFrom: ".widget",
          ignoreFrom: ".widget-close-btn, .resize-handle",
          modifiers: [
            window.interact.modifiers.snap({
              targets: [
                window.interact.snappers.grid({
                  x: this.gridSize,
                  y: this.gridSize
                })
              ],
              range: Infinity,
              relativePoints: [{ x: 0, y: 0 }]
            })
          ],
          listeners: this.getDragListeners()
        })
        .resizable({
          edges: {
            left: ".resize-handle-w, .resize-handle-nw, .resize-handle-sw",
            right: ".resize-handle-e, .resize-handle-ne, .resize-handle-se",
            bottom: ".resize-handle-s, .resize-handle-sw, .resize-handle-se",
            top: ".resize-handle-n, .resize-handle-nw, .resize-handle-ne"
          },
          listeners: this.getResizeListeners(),
          modifiers: [
            window.interact.modifiers.restrictSize({
              min: { width: this.minWidgetWidth, height: this.minWidgetHeight },
              max: { width: 1200, height: 800 }
            }),
            window.interact.modifiers.snap({
              targets: [
                window.interact.snappers.grid({
                  x: this.gridSize,
                  y: this.gridSize
                })
              ],
              range: Infinity,
              relativePoints: [{ x: 0, y: 0 }]
            })
          ]
        });

      console.log(`Interactions set up successfully for widget: ${widgetId}`);
    });

    this.interactionInitialized = true;
    console.log("All widget interactions initialized successfully");
  }

  getDragListeners() {
    return {
      start: (event) => {
        console.log("Drag start for:", event.target.dataset.id);
        this.isDragging = true;
        event.target.classList.add("dragging");

        const originalZ = event.target.style.zIndex || "1";
        event.target.setAttribute("data-original-z", originalZ);
        event.target.style.zIndex = "1000";

        // Start auto-scroll monitoring
        this.startAutoScroll(event);
      },
      move: (event) => {
        const target = event.target;
        const x = (parseFloat(target.getAttribute("data-x")) || 0) + event.dx;
        const y = (parseFloat(target.getAttribute("data-y")) || 0) + event.dy;

        // Update position
        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute("data-x", x);
        target.setAttribute("data-y", y);

        // Check for collision with other widgets
        const hasCollision = this.checkCollisionDuringMove(target, x, y);

        if (hasCollision) {
          target.classList.add("collision-detected");
          this.showCollisionWarningToast();
        } else {
          target.classList.remove("collision-detected");
        }

        // Update auto-scroll based on mouse position
        this.updateAutoScroll(event);
      },
      end: (event) => {
        console.log("Drag end for:", event.target.dataset.id);
        this.isDragging = false;
        const target = event.target;
        target.classList.remove("dragging", "collision-detected");

        // Stop auto-scroll
        this.stopAutoScroll();

        const x = parseFloat(target.getAttribute("data-x")) || 0;
        const y = parseFloat(target.getAttribute("data-y")) || 0;

        // Calculate final position
        const rect = target.getBoundingClientRect();
        const grid = this.template.querySelector(".dashboard-grid");
        const gridRect = grid.getBoundingClientRect();

        let finalX = Math.max(0, rect.left - gridRect.left + grid.scrollLeft);
        let finalY = Math.max(0, rect.top - gridRect.top + grid.scrollTop);

        // Check for collision at final position
        const hasCollision = this.checkFinalPositionCollision(
          target.getAttribute("data-id"),
          finalX,
          finalY,
          target.offsetWidth,
          target.offsetHeight
        );

        if (hasCollision) {
          // Revert to original position if collision detected
          const originalStyle = this.parseStyle(
            target.getAttribute("data-original-style") || target.style.cssText
          );
          finalX = parseFloat(originalStyle.left) || 20;
          finalY = parseFloat(originalStyle.top) || 20;
          this.showToast(
            "Warning",
            "Cannot place widget here - overlaps with another widget",
            "warning"
          );
        } else {
          // Adjust position to prevent going outside bounds
          const maxX = Math.max(0, grid.scrollWidth - target.offsetWidth);
          const maxY = Math.max(0, grid.scrollHeight - target.offsetHeight);
          finalX = Math.min(finalX, maxX);
          finalY = Math.min(finalY, maxY);
        }

        target.style.transform = "";
        target.style.left = `${finalX}px`;
        target.style.top = `${finalY}px`;
        target.style.zIndex = target.getAttribute("data-original-z") || "1";

        // Clean up attributes
        target.removeAttribute("data-x");
        target.removeAttribute("data-y");
        target.removeAttribute("data-original-z");

        this.updateWidgetPosition(
          target.getAttribute("data-id"),
          finalX,
          finalY
        );
        this.refreshAllCharts();
      }
    };
  }

  getResizeListeners() {
    return {
      start: (event) => {
        console.log(
          "Resize start for:",
          event.target.dataset.id,
          "from edges:",
          event.edges
        );
        event.target.classList.add("resizing");
        document.body.style.userSelect = "none";
        document.body.style.webkitUserSelect = "none";
      },
      move: (event) => {
        const target = event.target;
        let x = parseFloat(target.getAttribute("data-x")) || 0;
        let y = parseFloat(target.getAttribute("data-y")) || 0;

        // Check for collision during resize
        const hasCollision = this.checkCollisionDuringResize(
          target,
          event.rect
        );

        if (!hasCollision) {
          target.style.width = `${event.rect.width}px`;
          target.style.height = `${event.rect.height}px`;

          x += event.deltaRect.left;
          y += event.deltaRect.top;

          target.style.transform = `translate(${x}px, ${y}px)`;
          target.setAttribute("data-x", x);
          target.setAttribute("data-y", y);
          target.classList.remove("collision-detected");
        } else {
          target.classList.add("collision-detected");
          this.showCollisionWarningToast();
        }
      },
      end: (event) => {
        console.log("Resize end for:", event.target.dataset.id);
        const target = event.target;
        target.classList.remove("resizing", "collision-detected");

        document.body.style.userSelect = "";
        document.body.style.webkitUserSelect = "";

        const x = parseFloat(target.getAttribute("data-x")) || 0;
        const y = parseFloat(target.getAttribute("data-y")) || 0;

        const rect = target.getBoundingClientRect();
        const grid = this.template.querySelector(".dashboard-grid");
        const gridRect = grid.getBoundingClientRect();

        let finalX = Math.max(0, rect.left - gridRect.left + grid.scrollLeft);
        let finalY = Math.max(0, rect.top - gridRect.top + grid.scrollTop);

        target.style.transform = "";
        target.style.left = `${finalX}px`;
        target.style.top = `${finalY}px`;
        target.removeAttribute("data-x");
        target.removeAttribute("data-y");

        this.updateWidgetStyle(
          target.getAttribute("data-id"),
          finalX,
          finalY,
          target.style.width,
          target.style.height
        );

        setTimeout(() => this.refreshAllCharts(), 100);
      }
    };
  }

  // Auto-scroll functionality
  startAutoScroll(event) {
    this.stopAutoScroll(); // Clear any existing interval

    this.autoScrollInterval = setInterval(() => {
      if (!this.isDragging) {
        this.stopAutoScroll();
        return;
      }

      const grid = this.scrollContainer;
      if (!grid) return;

      const rect = grid.getBoundingClientRect();
      const mouseX =
        event.clientX ||
        (event.touches && event.touches[0] ? event.touches[0].clientX : 0);
      const mouseY =
        event.clientY ||
        (event.touches && event.touches[0] ? event.touches[0].clientY : 0);

      let scrollX = 0;
      let scrollY = 0;

      // Check horizontal scrolling
      if (mouseX < rect.left + this.scrollZone) {
        scrollX = -this.scrollSpeed;
      } else if (mouseX > rect.right - this.scrollZone) {
        scrollX = this.scrollSpeed;
      }

      // Check vertical scrolling
      if (mouseY < rect.top + this.scrollZone) {
        scrollY = -this.scrollSpeed;
      } else if (mouseY > rect.bottom - this.scrollZone) {
        scrollY = this.scrollSpeed;
      }

      // Apply scrolling
      if (scrollX !== 0 || scrollY !== 0) {
        grid.scrollLeft = Math.max(
          0,
          Math.min(
            grid.scrollLeft + scrollX,
            grid.scrollWidth - grid.clientWidth
          )
        );
        grid.scrollTop = Math.max(
          0,
          Math.min(
            grid.scrollTop + scrollY,
            grid.scrollHeight - grid.clientHeight
          )
        );
      }
    }, 16); // ~60fps
  }

  updateAutoScroll(event) {
    // This method can be used to update scroll direction based on current mouse position
    // The actual scrolling is handled in the interval
  }

  stopAutoScroll() {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
  }

  // Enhanced collision detection methods
  checkCollisionDuringMove(movingElement, x, y) {
    const grid = this.template.querySelector(".dashboard-grid");
    if (!grid) return false;

    const movingRect = this.getElementBounds(movingElement, x, y);
    const movingId = movingElement.getAttribute("data-id");

    const otherWidgets = this.template.querySelectorAll(
      '.widget:not([data-id="' + movingId + '"])'
    );

    for (let widget of otherWidgets) {
      const widgetRect = this.getElementCurrentBounds(widget);
      if (this.detectOverlap(movingRect, widgetRect)) {
        return true;
      }
    }
    return false;
  }

  checkFinalPositionCollision(widgetId, x, y, width, height) {
    const testRect = {
      left: x,
      top: y,
      right: x + width,
      bottom: y + height,
      width: width,
      height: height
    };

    const otherWidgets = this.template.querySelectorAll(
      '.widget:not([data-id="' + widgetId + '"])'
    );

    for (let widget of otherWidgets) {
      const widgetRect = this.getElementCurrentBounds(widget);
      if (this.detectOverlap(testRect, widgetRect)) {
        return true;
      }
    }
    return false;
  }

  checkCollisionDuringResize(resizingElement, newRect) {
    const resizingId = resizingElement.getAttribute("data-id");
    const grid = this.template.querySelector(".dashboard-grid");
    const gridRect = grid.getBoundingClientRect();

    const elementRect = resizingElement.getBoundingClientRect();
    const adjustedRect = {
      left: elementRect.left - gridRect.left + grid.scrollLeft,
      top: elementRect.top - gridRect.top + grid.scrollTop,
      right: elementRect.left - gridRect.left + grid.scrollLeft + newRect.width,
      bottom: elementRect.top - gridRect.top + grid.scrollTop + newRect.height,
      width: newRect.width,
      height: newRect.height
    };

    const otherWidgets = this.template.querySelectorAll(
      '.widget:not([data-id="' + resizingId + '"])'
    );

    for (let widget of otherWidgets) {
      const widgetRect = this.getElementCurrentBounds(widget);
      if (this.detectOverlap(adjustedRect, widgetRect)) {
        return true;
      }
    }
    return false;
  }

  getElementBounds(element, translateX = 0, translateY = 0) {
    const rect = element.getBoundingClientRect();
    const grid = this.template.querySelector(".dashboard-grid");
    const gridRect = grid.getBoundingClientRect();

    return {
      left: rect.left - gridRect.left + grid.scrollLeft + translateX,
      top: rect.top - gridRect.top + grid.scrollTop + translateY,
      right:
        rect.left -
        gridRect.left +
        grid.scrollLeft +
        translateX +
        element.offsetWidth,
      bottom:
        rect.top -
        gridRect.top +
        grid.scrollTop +
        translateY +
        element.offsetHeight,
      width: element.offsetWidth,
      height: element.offsetHeight
    };
  }

  getElementCurrentBounds(element) {
    const rect = element.getBoundingClientRect();
    const grid = this.template.querySelector(".dashboard-grid");
    const gridRect = grid.getBoundingClientRect();

    return {
      left: rect.left - gridRect.left + grid.scrollLeft,
      top: rect.top - gridRect.top + grid.scrollTop,
      right: rect.right - gridRect.left + grid.scrollLeft,
      bottom: rect.bottom - gridRect.top + grid.scrollTop,
      width: element.offsetWidth,
      height: element.offsetHeight
    };
  }

  detectOverlap(rect1, rect2) {
    const padding = this.widgetPadding;

    return !(
      rect1.right + padding <= rect2.left ||
      rect1.left >= rect2.right + padding ||
      rect1.bottom + padding <= rect2.top ||
      rect1.top >= rect2.bottom + padding
    );
  }

  showCollisionWarningToast() {
    if (this.collisionWarningTimeout) {
      clearTimeout(this.collisionWarningTimeout);
    }

    this.showCollisionWarning = true;

    this.collisionWarningTimeout = setTimeout(() => {
      this.showCollisionWarning = false;
    }, 3000);
  }

  refreshAllCharts() {
    if (this.chartRefreshTimeout) {
      clearTimeout(this.chartRefreshTimeout);
    }

    this.chartRefreshTimeout = setTimeout(() => {
      try {
        const dynamicWidgets =
          this.template.querySelectorAll("c-dynamic-widget");
        dynamicWidgets.forEach((widget) => {
          if (widget && typeof widget.refreshChart === "function") {
            widget.refreshChart();
          }
        });

        this.dispatchEvent(
          new CustomEvent("chartrefresh", {
            detail: { timestamp: Date.now() }
          })
        );

        console.log("Charts refreshed:", dynamicWidgets.length);
      } catch (error) {
        console.error("Error refreshing charts:", error);
      }
    }, 250);
  }

  updateWidgetPosition(widgetId, x, y) {
    const widgetIndex = this.widgets.findIndex((w) => w.id === widgetId);
    if (widgetIndex !== -1) {
      const widget = this.widgets[widgetIndex];
      const currentStyle = this.parseStyle(widget.style);
      currentStyle.left = `${x}px`;
      currentStyle.top = `${y}px`;
      this.widgets[widgetIndex].style = this.styleToString(currentStyle);
      console.log("Updated widget position:", widgetId, x, y);
    }
  }

  updateWidgetStyle(widgetId, x, y, width, height) {
    const widgetIndex = this.widgets.findIndex((w) => w.id === widgetId);
    if (widgetIndex !== -1) {
      const widget = this.widgets[widgetIndex];
      const currentStyle = this.parseStyle(widget.style);
      currentStyle.left = `${x}px`;
      currentStyle.top = `${y}px`;
      currentStyle.width = width;
      currentStyle.height = height;
      this.widgets[widgetIndex].style = this.styleToString(currentStyle);
      console.log("Updated widget style:", widgetId, x, y, width, height);
    }
  }

  parseStyle(styleString) {
    const styles = {};
    if (styleString) {
      styleString.split(";").forEach((style) => {
        const [key, value] = style.split(":");
        if (key && value) {
          styles[key.trim()] = value.trim();
        }
      });
    }
    return styles;
  }

  styleToString(styleObj) {
    return (
      Object.entries(styleObj)
        .filter(([key, value]) => key && value)
        .map(([key, value]) => `${key}:${value}`)
        .join(";") + ";"
    );
  }

  getWidgetTitle(type) {
    const widget = this.availableWidgetTypes.find((w) => w.value === type);
    return widget ? widget.label : type.charAt(0).toUpperCase() + type.slice(1);
  }

  // toggleEditMode() {
  //     this.isEditMode = !this.isEditMode;
  //     this.interactionInitialized = false;

  //     if (!this.isEditMode && window.interact) {
  //         try {
  //             window.interact('.widget').unset();
  //             console.log('Interactions cleared on exit edit mode');
  //         } catch (e) {
  //             console.warn('Error clearing interactions on exit:', e);
  //         }
  //     }

  //     if (this.isEditMode) {
  //         this.originalWidgetStates = JSON.parse(JSON.stringify(this.widgets));
  //     }
  // }

  toggleEditMode() {
    const exitingEditMode = this.isEditMode;

    this.isEditMode = !this.isEditMode;
    this.interactionInitialized = false;

    if (!this.isEditMode && window.interact) {
      try {
        window.interact(".widget").unset();
        console.log("Interactions cleared on exit edit mode");
      } catch (e) {
        console.warn("Error clearing interactions on exit:", e);
      }
    }

    if (this.isEditMode) {
      // User entered edit mode — snapshot current widget state
      this.originalWidgetStates = JSON.parse(JSON.stringify(this.widgets));
    } else if (exitingEditMode) {
      // User exited edit mode WITHOUT saving — restore old layout
      this.widgets = JSON.parse(JSON.stringify(this.originalWidgetStates));
      this.showToast("Info", "Changes discarded.", "info");

      // ✅ Refresh widget types for the restored layout
      this.fetchUserAccessDetails();
    }
  }

  async handleSaveAndExit() {
    try {
      this.isLoading = true;

      await saveLayout({
        staffId: this.staffId,
        layoutJson: JSON.stringify(this.widgets)
      });

      this.originalWidgetStates = JSON.parse(JSON.stringify(this.widgets));
      this.isEditMode = false;
      this.interactionInitialized = false;

      // Force re-render of widget DOM
      this.widgets = [...this.widgets];

      // Remove edit-mode class and clear interactions per widget
      const widgetEls = this.template.querySelectorAll(".widget");
      widgetEls.forEach((el) => {
        el.classList.remove("edit-mode");
        try {
          window.interact(el).unset(); // explicit per-widget unset
        } catch (e) {
          console.warn("Failed to unset interact for widget:", el, e);
        }
      });

      this.showToast(
        "Success",
        "Dashboard layout saved successfully!",
        "success"
      );
    } catch (error) {
      console.error("Save error:", error);
      this.showToast(
        "Error",
        "Failed to save dashboard layout: " + error.message,
        "error"
      );
    } finally {
      this.isLoading = false;
    }
  }

  handleCancel() {
    if (
      confirm(
        "Are you sure you want to cancel? All unsaved changes will be lost."
      )
    ) {
      this.widgets = JSON.parse(JSON.stringify(this.originalWidgetStates));

      this.isEditMode = false;
      this.interactionInitialized = false;

      if (window.interact) {
        try {
          window.interact(".widget").unset();
        } catch (e) {
          console.warn("Error clearing interactions on cancel:", e);
        }
      }

      this.showToast(
        "Info",
        "Changes cancelled. Dashboard restored to last saved state.",
        "info"
      );
    }
  }

  // async handleReset() {
  //     if (confirm('Are you sure you want to reset the dashboard to default layout? This action cannot be undone.')) {
  //         try {
  //             this.widgets = this.getDefaultWidgets();
  //             this.originalWidgetStates = JSON.parse(JSON.stringify(this.widgets));
  //             this.showToast('Success', 'Dashboard reset to default layout', 'success');
  //         } catch (error) {
  //             console.error('Reset error:', error);
  //             this.showToast('Error', 'Failed to reset dashboard', 'error');
  //         }
  //     }
  // }

  @track showResetModal = false;
  handleReset() {
    this.showResetModal = true;
  }
  cancelReset() {
    this.showResetModal = false;
    this.fetchUserAccessDetails();
  }

  async confirmReset() {
    try {
      this.widgets = [];
      this.originalWidgetStates = [];

      // Unset interactions
      if (window.interact) {
        const widgetEls = this.template.querySelectorAll(".widget");
        widgetEls.forEach((el) => window.interact(el).unset());
      }

      // ✅ Save the empty layout
      await saveLayout({
        staffId: this.staffId,
        layoutJson: JSON.stringify(this.widgets) // which is now []
      });

      // Refresh available widget types
      this.fetchUserAccessDetails();

      // Set flags
      this.noLayoutAvailable = true;
      this.isEditMode = false;

      this.showToast(
        "Success",
        "All widgets removed and layout reset successfully.",
        "success"
      );
    } catch (error) {
      console.error("Reset error:", error);
      this.showToast(
        "Error",
        "Failed to reset dashboard: " + error.message,
        "error"
      );
    } finally {
      this.showResetModal = false;
      this.isLoading = false;
    }
  }

  // handleDeleteWidget(event) {
  //     const widgetId = event.target.dataset.id || event.currentTarget.dataset.id;
  //     if (widgetId && confirm('Are you sure you want to remove this widget?')) {
  //         try {
  //             this.widgets = this.widgets.filter(widget => widget.id !== widgetId);
  //             this.showToast('Success', 'Widget removed successfully', 'success');
  //         } catch (error) {
  //             console.error('Delete widget error:', error);
  //             this.showToast('Error', 'Failed to remove widget', 'error');
  //         }
  //     }
  // }
  @track showDeleteConfirmModal = false;
  widgetToDeleteId = null;

  handleDeleteWidget(event) {
    const widgetId = event.target.dataset.id || event.currentTarget.dataset.id;
    if (widgetId) {
      this.widgetToDeleteId = widgetId;
      this.showDeleteConfirmModal = true;
    }
  }

  cancelDeleteWidget() {
    this.showDeleteConfirmModal = false;
    this.widgetToDeleteId = null;
  }

  confirmDeleteWidget() {
    try {
      // Remove the widget
      this.widgets = this.widgets.filter(
        (widget) => widget.id !== this.widgetToDeleteId
      );
      this.widgetToDeleteId = null;
      this.showDeleteConfirmModal = false;

      // ✅ Refresh available widget types (to allow re-adding deleted one)
      this.fetchUserAccessDetails();

      this.showToast("Success", "Widget removed successfully", "success");
    } catch (error) {
      console.error("Delete widget error:", error);
      this.showToast("Error", "Failed to remove widget", "error");
    }
  }

  showAddWidgetModal() {
    if (this.availableWidgetTypes.length === 0) {
      this.showToast("Info", "All widget types are already added.", "info");
      return;
    }

    this.showModal = true;
    this.selectedWidgetType = "";
  }

  closeModal() {
    this.showModal = false;
    this.selectedWidgetType = "";
  }

  handleWidgetTypeChange(event) {
    this.selectedWidgetType = event.detail.value;
  }

  async addWidget() {
    if (!this.selectedWidgetType) {
      this.showToast("Error", "Please select a widget type", "error");
      return;
    }

    try {
      const newWidgetId = `${this.selectedWidgetType}-${Date.now()}`;

      // Temporarily add it offscreen with dummy style
      const newWidget = {
        id: newWidgetId,
        type: this.selectedWidgetType,
        title: this.getWidgetTitle(this.selectedWidgetType),
        style: `position:absolute;top:-1000px;left:-1000px;width:400px;height:300px;`,
        visible: true,
        zIndex: Math.max(...this.widgets.map((w) => w.zIndex || 1)) + 1,
        originalStyle: ``
      };

      this.widgets.push(newWidget);
      this.noLayoutAvailable = false;
      this.closeModal();

      // Wait for DOM to render the new widget
      setTimeout(() => {
        const position = this.findAvailablePosition(400, 300);

        const index = this.widgets.findIndex((w) => w.id === newWidgetId);
        if (index !== -1) {
          const updatedStyle = `position:absolute;top:${position.y}px;left:${position.x}px;width:400px;height:300px;`;
          this.widgets[index].style = updatedStyle;
          this.widgets[index].originalStyle = updatedStyle;
          this.widgets = [...this.widgets]; // trigger re-render
        }

        setTimeout(() => {
          const newEl = this.template.querySelector(
            `[data-id="${newWidgetId}"]`
          );
          if (newEl) {
            newEl.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 200);

        // Reinitialize draggable
        if (this.isEditMode && this.interactLoaded) {
          this.initializeWidgetInteractions();
        }

        this.showToast("Success", "Widget added successfully!", "success");
        this.fetchUserAccessDetails();
      }, 100);
    } catch (error) {
      console.error("Add widget error:", error);
      this.showToast(
        "Error",
        "Failed to add widget: " + error.message,
        "error"
      );
    }
  }

  findAvailablePosition(width, height) {
    const grid = this.template.querySelector(".dashboard-grid");
    const gridWidth = grid ? grid.scrollWidth : 1000;
    let gridHeight = grid ? grid.scrollHeight : 800;

    const maxRows = 20; // Limit rows to avoid infinite loop
    const widgetSpacing = this.gridSize;

    for (let row = 0; row < maxRows; row++) {
      const y = 20 + row * (height + widgetSpacing);
      for (let x = 20; x <= gridWidth - width; x += this.gridSize) {
        const testRect = {
          left: x,
          top: y,
          right: x + width,
          bottom: y + height,
          width: width,
          height: height
        };

        let hasCollision = false;
        const existingWidgets = this.template.querySelectorAll(".widget");

        for (let widget of existingWidgets) {
          const widgetRect = this.getElementCurrentBounds(widget);
          if (this.detectOverlap(testRect, widgetRect)) {
            hasCollision = true;
            break;
          }
        }

        if (!hasCollision) {
          // Dynamically extend grid height if necessary
          if (grid && y + height > grid.scrollHeight) {
            grid.style.minHeight = `${y + height + 50}px`;
          }
          return { x, y };
        }
      }
    }

    // Fallback if no position found
    return { x: 20, y: gridHeight + 50 };
  }

  // findAvailablePosition(width, height) {
  //     const grid = this.template.querySelector('.dashboard-grid');
  //     const gridWidth = grid ? grid.scrollWidth : 1000;
  //     const gridHeight = grid ? grid.scrollHeight : 800;

  //     for (let y = 20; y < gridHeight - height; y += this.gridSize) {
  //         for (let x = 20; x < gridWidth - width; x += this.gridSize) {
  //             const testRect = {
  //                 left: x,
  //                 top: y,
  //                 right: x + width,
  //                 bottom: y + height,
  //                 width: width,
  //                 height: height
  //             };

  //             let hasCollision = false;
  //             const existingWidgets = this.template.querySelectorAll('.widget');

  //             for (let widget of existingWidgets) {
  //                 const widgetRect = this.getElementCurrentBounds(widget);
  //                 if (this.detectOverlap(testRect, widgetRect)) {
  //                     hasCollision = true;
  //                     break;
  //                 }
  //             }

  //             if (!hasCollision) {
  //                 return { x, y };
  //             }
  //         }
  //     }

  //     return { x: 20, y: 20 };
  // }

  showToast(title, message, variant) {
    const event = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant,
      mode: "dismissable"
    });
    this.dispatchEvent(event);
  }

  handleChildEvent(event) {
    console.log("Child event received:", event.detail);
  }

  handleTaskEdit(event) {
    console.log("Task edit event received:", event.detail);
  }

  handleGrandChildEvent(event) {
    console.log("Grand child event received dashboardDraggable:", event.detail);
  }

  get fabIcon() {
    return this.isEditMode ? "close" : "edit";
  }

  get fabTitle() {
    return this.isEditMode ? "Cancel Edit" : "Edit Dashboard";
  }

  get fabActionsStyle() {
    return this.isEditMode
      ? "opacity: 1; transform: translateY(0);"
      : "opacity: 0; transform: translateY(30px); pointer-events: none;";
  }
  get fabMainClass() {
    return this.isEditMode ? "fab-main fab-cancel" : "fab-main";
  }
}