import { LightningElement, api, track, wire } from "lwc";
import listOfClientjounel from "@salesforce/apex/ParticipantDetailsHandler.listOfClientjounel";
import saveDesc from "@salesforce/apex/ParticipantDetailsHandler.saveDesc";
import communityPage from "@salesforce/apex/ParticipantDetailsHandler.communityPage";
import { refreshApex } from "@salesforce/apex";
import { getRecord } from "lightning/uiRecordApi";
import USER_ID from "@salesforce/user/Id";
import NAME_FIELD from "@salesforce/schema/User.Name";
import { NavigationMixin } from "lightning/navigation";
import My_Resource from "@salesforce/resourceUrl/myResource";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getClientById from "@salesforce/apex/ClientDataController.getClientById";
import UsrRoleName from "@salesforce/schema/User.User_Role__c";
import UserType from "@salesforce/schema/User.User_Type__c";
import getParticipantJournal from "@salesforce/apex/ClientDataController.getParticipantJournal";
import getParticipantdetails from "@salesforce/apex/ClientDataController.getParticipantdetails";
import saveStatusData from "@salesforce/apex/ClientDataController.saveStatusData";
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import getTabPreferredNames from "@salesforce/apex/ClientDataController.getTabPreferredNames";
import saveTabPreferredName from "@salesforce/apex/ClientDataController.saveTabPreferredName";
import saveJournalAttachments from '@salesforce/apex/ParticipantDetailsHandler.saveJournalAttachments';
import getCorrectionAttachments from '@salesforce/apex/ParticipantDetailsHandler.getCorrectionAttachments';
import getTasksByParticipant from '@salesforce/apex/TaskCreateHandler.getTasksByParticipant';

const URL_TO_TAB_MAP = {
    'details': 'details',
    // 'funds-tracker': 'fundtranfer',
    'funds-tracker': 'fundtranfer',
    'services': 'ServiceandSupportPlan',
    'participant-journal': 'ClientJournel',
    'attachments': 'attachment',
    'forms': 'ParticipantForms',
    'feedback': 'feedback',
    'schedule': 'schedule',
    'risk-profile': 'risk'
};

const TAB_TO_URL_MAP = {
    'details': 'details',
    // 'fundtranfer': 'funds-tracker',
    'fundtranfer': 'funds-tracker',
    'ServiceandSupportPlan': 'services',
    'ClientJournel': 'participant-journal',
    'attachment': 'attachments',
    'ParticipantForms': 'forms',
    'feedback': 'feedback',
    'schedule': 'schedule',
    'risk': 'risk-profile'
};

export default class DetailsLwc extends NavigationMixin(LightningElement) {
  @api facilityOptionsFromParent
  @api recordId;
  @api participantdetails;
  @api ndisflag;
  @api faclist;
  @api state;
  @api individualflag;
  @api companyflag;
  @api ndiscreateflag;
  @api participant;
  @api isFromManageInvoice;
  // @api riskindexdetailsfromparent = {};
  @api riskindexdetailsfromparent;
  @api navigatedFromNotifications;
  @api fundTrackerId;
  
  @track ClientJournel = false;
  @track addNew = false;
  @track createTask = false;
  @track attachmentSubroute = '';
  @track feedbackSubroute = '';
  @track scheduleSubroute = '';
  @track riskSubroute = '';
  @track journalSubroute = '';
  @track deleteConfirmationFlag = false;
  _pendingJournalUid;
  _pendingJournalAction;  
  @track detailsFlag = false;
  @track serviceSupportFlag = false;
  @track journelDescription = false;
  @track journelProgress = false;
  @track objectApiName = "Client__c";
  @track clientJournelList = [];
    //manendra added for sorting 
    @track sortField = '';
    @track sortDirection = 'asc';
    @track sortIcons = {
    Care_Notes__c: '',
    descriptionPreview: '',
    createdname: '',
    createdOnFormatted: '',
    shiftDetails: ''
    };
  get participantUid() {
      return this.clientData?.[0]?.Participant_UID__c || '';
  }

  @api selectTab(tabPath) {
      let baseSlug = tabPath || 'details';
      let shouldSyncAfterRedirect = false;
      if (this.isStaff && baseSlug === 'details') {
          baseSlug = 'participant-journal';
          shouldSyncAfterRedirect = true;
      }      
      let subMode = '';
      if (baseSlug.includes('/')) {
          const parts = baseSlug.split('/');
          baseSlug = parts[0];
          subMode = parts.slice(1).join('/');
      }
      
      const tabName = URL_TO_TAB_MAP[baseSlug] || baseSlug;
      console.log('[Routing] detailsLwc selectTab called with:', tabPath, '-> resolved baseSlug:', baseSlug, 'tabName:', tabName, 'subMode:', subMode);

      this.createTask = false;
      this.addNew = false;
      this.ClientJournel = (tabName === 'ClientJournel');
      this.detailsFlag = (tabName === 'details');
      this.serviceSupportFlag = (tabName === 'ServiceandSupportPlan');
      this.fundTranfer = (tabName === 'fundtranfer');
      this.Formsflag = (tabName === 'ParticipantForms');
      this.attachment = (tabName === 'attachment');
      this.feedback = (tabName === 'feedback');
      this.scheduleFlag = (tabName === 'schedule');
      this.riskFlag = (tabName === 'risk');

      // Set subroute properties for child LWCs
      this.attachmentSubroute = (tabName === 'attachment') ? subMode : '';
      this.feedbackSubroute = (tabName === 'feedback') ? subMode : '';
      this.scheduleSubroute = (tabName === 'schedule') ? subMode : '';
      this.riskSubroute = (tabName === 'risk') ? subMode : '';
      this.journalSubroute = (tabName === 'ClientJournel') ? subMode : '';      

      // Visibility/initialization logic
      if (this.ClientJournel) {
          this.handleclientjournal();
          this.iscreateNew = true;
          this.isVisible = true;

          // Restore internal journal modes/subroutes
          if (subMode === 'create-journal') {
              this.addNew = true;
              this.buttonlabel = 'Save';
              this.jounelId = '';
              this.description = '';
              this.jNoteType = '';
          } else if (subMode === 'create-task') {
              this.createTask = true;
          } else if (subMode) {
              const parts = subMode.split('/');
              const journalUid = parts[0];
              const action = parts[1] || 'view';
              if (journalUid.startsWith('jrn-')) {
                  this._pendingJournalUid = journalUid;
                  this._pendingJournalAction = action;
                  if (this.clientJournelList && this.clientJournelList.length > 0) {
                      this._restoreJournalAction(journalUid, action);
                      this._pendingJournalUid = null;
                      this._pendingJournalAction = null;
                  }
              }
          }

      } else if (this.detailsFlag || this.serviceSupportFlag || this.fundTranfer || this.Formsflag || this.attachment || this.feedback || this.scheduleFlag || this.riskFlag) {
          this.iscreateNew = false;
          this.isVisible = true;
      }
      
      this.ParticipantAvailabiltyFlag = false;
      this.editingTab = '';
      
      localStorage.setItem('activeClientTab', tabName);
      if (shouldSyncAfterRedirect) {
          this._syncRoute(true);
      }      

      // Handle sub-component modes (Edit Wizard or Funds Tracker modes)
      if (tabName === 'details' && subMode.startsWith('edit')) {
          const stepPart = subMode.split('/')[1] || 'step1';
          setTimeout(() => {
              const detailCmp = this.template.querySelector('c-client-detail');
              if (detailCmp) {
                  detailCmp.openEditWizard(stepPart);
              }
          }, 400);
      } else if (tabName === 'fundtranfer' && subMode) {
          setTimeout(() => {
              const fundCmp = this.template.querySelector('c-client-fund-tranfer');
              if (fundCmp) {
                  fundCmp.setMode(subMode);
              }
          }, 400);
      }      
  }

  _syncRoute(replace = false) {
      const uid = this.participantUid;
      if (!uid) return;

      let activeTab = localStorage.getItem('activeClientTab') || 'details';
      const tabUrlSlug = TAB_TO_URL_MAP[activeTab] || activeTab;
      
      let subView = `${uid}/${tabUrlSlug}`;
      
      // If we are on details tab and the child clientDetail component is in edit mode:
      if (activeTab === 'details') {
          const detailCmp = this.template.querySelector('c-client-detail');
          if (detailCmp && detailCmp.isEditing) {
              const stepNum = detailCmp.currentStepNumber || 1;
              subView = `${uid}/details/edit/step${stepNum}`;
          }
      } else if (activeTab === 'fundtranfer') {
          // Check if c-client-fund-tranfer is in add or edit mode:
          const fundCmp = this.template.querySelector('c-client-fund-tranfer');
          if (fundCmp) {
              if (fundCmp.createAddNew) {
                  // subView = `${uid}/funds-tracker/add`;
                  subView = `${uid}/funds-tracker/add`;
              } else if (fundCmp.isEdit) {
                  // subView = `${uid}/funds-tracker/edit`;
                  subView = `${uid}/funds-tracker/edit`;
              }
          }
      } else if (activeTab === 'ClientJournel') {
          if (this.addNew && !this.jounelId) {
              subView = `${uid}/participant-journal/create-journal`;
          } else if (this.createTask) {
              subView = `${uid}/participant-journal/create-task`;
          } else if (this.jounelId) {
              const record = this.clientJournelList.find(r => r.Id === this.jounelId);
              const journalUid = record ? record.Journal_UID__c : (this._pendingJournalUid || '');
              if (journalUid) {
                  const action = this.addNew ? 'edit' : (this.deleteConfirmationFlag ? 'delete' : 'view');
                  subView = `${uid}/participant-journal/${journalUid}/${action}`;                  
              }
          }
      }
      console.log('[Routing] detailsLwc dispatching subrouteupdate:', subView);
      this.dispatchEvent(new CustomEvent('subrouteupdate', {
          detail: {
              subView,
              uid,
              recordId: this.recordId,
              replace
          },
          bubbles: true,
          composed: true
      }));
  }  
  @track iscreateNew = false;
  @track editJournel = false;
  @track jounelId;
  @track jNoteType;
  @track NoteType;
  @track name;
  @track isVisible = true;
  @track fundTranfer = false;
  @track fundTrackerEdit = false;
  @track attachment = false;
  @track Formsflag = false;
  @track feedback = false;
  @track scheduleFlag = false;
  @track ParticipantAvailabiltyFlag = false;
  @track servicerecordId;
  @track clientId;
  @track photo;
  @track CareNotes;
  @track ProgressNotes;
  @track SpecialInstructions;
  @track FundsTracker; //manendra
  Search = My_Resource + "/myResource/images/Participants.svg";
  primary = My_Resource + "/myResource/images/Primary.svg";
  secondary = My_Resource + "/myResource/images/Secondary.svg";
  @track currentUserRole;
  @track error;
  @track isExec = false;
  @track notesflag = false;
  @track buttonlabel = "Save";
  @track isManager = false;
  @track isStaff = false;
  @track communityurl;
  @track clientData = [];
  @track participantlogin = false;
  @track userTypeValue;
  @track isFeedback = false;
  @track clientName;
  wiredClientResult;
  @track description = "";
  @track noRecordsFlag = false;
  isListening = false;
  showMuteIcon = false;
  showClearIcon = false;
  recognition;
  @track addressdata;
  admin = My_Resource + "/myResource/images/admin.svg";
  Search = My_Resource + "/myResource/images/Participants.svg";
  infoicon = My_Resource + "/myResource/images/Info_Icon.png";
  infoiconhover = My_Resource + "/myResource/images/Info_Icon_Hover.png";
  @track image;
  @track riskFlag = false;
  @track participantpopup = false;
  @track sectionFlags = {
    staffDetails: true,
    staffDetails1: true
  };

  @track sectionIcons = {
    staffDetails: "\u2B9F",
    staffDetails1: "\u2B9F"
  };
  @track isAvailable = false;
  @track isUnavailable = false;
  @track riskIndex = "";
  @track medications = "";
  @track allergies = "";
  @track notes = "";
  @track disableUnavailabledate = true;
  @track unavailableUntilDate;
  @track unavailableStartDate;
  @track status;
  @track clientFullName;
  @track medicationshtml;
  @track allergieshtml;
  @track noteshtml;
  @track isSaveDisabled = false;
  @track facilityPreferredName;
  @track participantPreferreddName;
  @track Journal;
  @track premiumClient = false;
  @track originalTabLabels = {};
  @track openCreateUserModal = false;
  isClosingPopup = false;
  @track allClientJournels=[];

  @track agedCareFlag = false;
  @track journalUploadedFiles = []; // manendra added for AWS 
  @track journalUploadResponse;// manendra added for AWS 
  isFileViewOpen = false;// manendra added for AWS 
  currentUrl = '';// manendra added for AWS 
  editAttachments = []; // manendra added for AWS 
  selectedAttachments = [];// manendra added for AWS 
  deletedAttachmentIds = [];// manendra added for AWS 
  @track showViewModal = false;// manendra added for viewmodalpopup  
  @track selectedJournal = {};// manendra added for viewmodalpopup 
  @track journalModalType = 'view';// manendra added for viewmodalpopup
  @track showFormatModal = false;// manendra added for Export modal
  @track selectedFormat = '';// manendra added for Export modal

  formatOptions = [
      { label: 'CSV', value: 'CSV' },
      { label: 'PDF', value: 'PDF' }
  ];
  // =====================
  // mANENDRA ADDED FR Pagination
  // =====================
  @track displayedClientJournels = [];
  @track pageNumber = 1;
  @track pageSize = 10;
  @track totalPages = 1;
  @track totalRecords = 0;
  @track bDisableFirst = true;
  @track bDisableLast = true;
  @track isPageSizeManuallySet = false;
  selectedType = 'All';

  pageSizeOptions = [
      { label: 'Auto', value: 'Auto', selected: true },
      { label: '10', value: '10' },
      { label: '25', value: '25' },
      { label: '50', value: '50' },
      { label: '75', value: '75' },
      { label: '100', value: '100' }
  ];

  typeOptions = [
      { label: 'All', value: 'All' },
      { label: 'Task', value: 'Task' },
      { label: 'Progress Notes', value: 'Progress Notes' },
      { label: 'Care Notes', value: 'Care Notes' },
      { label: 'Special Instructions', value: 'Special Instructions' }
  ];

  allowedFormats = [
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'indent',
    'align',
    'link',
    'clean'
];
 formatOptions = [
      { label: 'CSV', value: 'CSV' },
      { label: 'PDF', value: 'PDF' }
  ];
  /*   @api
    showFundtracker(ParticipantId) {
        this.clientId = ParticipantId;
        this.fundTranfer = true; // ✅ Open modal or section
        this.detailsFlag = true;
        this.serviceSupportFlag = false;
        this.Formsflag = false;
        this.attachment = false;
        this.feedback = false;
        this.scheduleFlag = false;
        this.riskFlag = false;
        this.ParticipantAvailabiltyFlag = false;
        console.log('CreateEditStaff: Form opened for Staff ID', ParticipantId);
    } */


@api
showFundtracker(ParticipantId) {
    this.clientId = ParticipantId;
    this.createTask = false;
    this.addNew = false;
    this.ClientJournel = false;
    this.detailsFlag = false;
    this.serviceSupportFlag = false;
    this.iscreateNew = false;
    this.fundTranfer = true;          // ← opens c-client-fund-tranfer
    this.fundTrackerEdit = false;
    this.Formsflag = false;
    this.attachment = false;
    this.isVisible = true;
    this.feedback = false;
    this.scheduleFlag = false;
    this.riskFlag = false;
    this.ParticipantAvailabiltyFlag = false;
    localStorage.setItem('activeClientTab', 'fundtranfer');
    console.log('[✅] Funds Tracker opened for:', ParticipantId);
}


  //@track services;
  @track tabLabels = {
      journal: 'Participant Journal',
      attachments: 'Attachments',
      forms: 'Forms',
      feedback: 'Feedback',
      services: 'Services',
      details: 'Details',
      funds: 'Funds Tracker',
      schedule: 'Schedule',
      risk: 'Risk Profile'
  };

  @track editingTab = null;
  @track showScopeModal = false;
  @track selectedScope = 'FACILITY'; // default
  @track pendingTabKey;
  @track pendingTabValue;
  @track isPremiumClient = false;
  @track canEditTabs = false;
  //@track isStaffOrClient = false;

  // get showFundsTracker() {
  //   return !this.isStaffOrClient && !this.isPremiumClient;
  // }
//manendra added for viewmodalpopup
  get isViewMode() {
    return this.journalModalType === 'view';
}

get isHistoryMode() {
    return this.journalModalType === 'history';
}

get viewModalTitle() {
    if (this.isHistoryMode) {
        return 'Participant Journal History';
    }

    return this.selectedJournal?.isTask
        ? 'Participant Task'
        : 'Participant Journal';
}
//manendra added for viewmodalpopup end
  get isStaffOrClient() {
    return (
      this.userTypeValue === "NDIS Participants" ||
      this.userTypeValue === "NDIS Staff"
    );
  }
  @wire(getRecord, {
    recordId: USER_ID,
    fields: [NAME_FIELD, UsrRoleName, UserType]
  })
  wireuser({ error, data }) {
    if (error) {
      this.error = error;
    } else if (data) {
      this.name = data.fields.Name.value;
      this.currentUserRole = data.fields.User_Role__c.value;
      this.userTypeValue = data.fields.User_Type__c.value;
      if (
        this.currentUserRole == "Portal Account Partner Executive" ||
        this.currentUserRole == "CEO" || this.currentUserRole == "Admin"
      )
      {
        this.isExec = true;
        this.isManager = false;
        this.isStaff = false;
        this.participantlogin = true;
        this.isFeedback = true;
      }
      if (this.currentUserRole == "Portal Account Partner Manager") {
        this.isExec = true;
        this.isManager = true;
        this.isStaff = false;
        this.participantlogin = true;
        this.isFeedback = true;
        this.serviceSupportFlag = false;
      }
      if (this.currentUserRole == "Portal Account Partner User") {
        this.isExec = false;
        this.isManager = false;
        this.isStaff = true;
        this.isFeedback = false;
        this.ClientJournel = true;
        this.detailsFlag = false;
        if (localStorage.getItem('activeClientTab') === 'details') {
          localStorage.setItem('activeClientTab', 'ClientJournel');
          this._syncRoute(true);
        }        
      }
      if (this.userTypeValue == "NDIS Participants") {
        this.participantlogin = false;
        this.isExec = false;
        this.serviceSupportFlag = false;
      }

      // if (this.userTypeValue == "NDIS Participants" ||  this.userTypeValue === "NDIS Staff" ) {
      //    this.isStaffOrClient = true;
      //    console.log(' this.isStaffOrClient : ', this.isStaffOrClient);
       
      // } else {
      //     this.isStaffOrClient = false;
      //     console.log(' this.isStaffOrClient in else : ', this.isStaffOrClient);
      // }
      // this.isStaffOrClient =
      // this.userTypeValue === "NDIS Participants" ||
      // this.userTypeValue === "NDIS Staff";

    console.log('FINAL isStaffOrClient:', this.isStaffOrClient);

    }
  }
  @track noimage;
  @wire(getClientById, { recordId: "$recordId" })
  wiredClient(result) {
    this.wiredClientResult = result;
    const { data, error } = result;

      if (data) {
        this.clientData = data;

        // ✅ Resolve Facility
       // this.facilityId = this.clientData[0]?.Facility__c;
        console.log("facilityId >>", this.facilityId);

        const typeofservice = this.clientData[0]?.Facility__r?.Type_of_Service__c;
        this.agedCareFlag = (typeofservice === 'Aged Care');
        // ✅ Set Aged Care Flag
        this.agedCareFlag = (typeofservice === "Aged Care");
        console.log("agedCareFlag :", this.agedCareFlag);

        // ✅ Example NDIS flag logic
        // Update this condition based on your actual field
        this.ndisflag = (typeofservice === "NDIS" || typeofservice === "Aged Care");
        console.log("ndisflag :", this.ndisflag);

      console.log("Client data 11 :", JSON.stringify(this.clientData));
      this.image = this.clientData[0].Picture__c;
      if (!this.image) {
        this.noimage = true;
      } else {
        this.noimage = false;
      }
      console.log("Client image :", this.image);
      this.city = this.clientData[0].Address__City__s;
      this.country = this.clientData[0].Address__CountryCode__s;
      this.province = this.clientData[0].Address__StateCode__s;
      this.postalcode = this.clientData[0].Address__PostalCode__s;
      this.street1 = this.clientData[0].Address__Street__s;
      this.addressdata = this.clientData[0].AddressData__c;
      //this.facilityId = this.clientData[0].Facility__c;
      /* this.clientId = this.clientData[0].Id;
            this.clientName = this.clientData[0].Name;
            console.log('User CleintId >>'+this.clientId);
            console.log('Participant Name >>'+this.clientName); */
      console.log("Client data:", JSON.stringify(this.clientData));
      
      // Sync URL hash with the current active tab
      setTimeout(() => {
          this._syncRoute(true);
      }, 0);      
    } else if (error) {
      this.handleError(error);
    }
  }

  loadTabPreferredNames() {
      if (!this.facilityId) {
          return;
      }

      getTabPreferredNames({ facilityId: this.facilityId })
          .then((result) => {
              console.log("Tab Preferred Names >>>>>", result);

              if (result) {
                  this.tabLabels = {
                      ...this.tabLabels,
                      journal: this.applyIfNotBlank(result.journal, this.tabLabels.journal),
                      attachments: this.applyIfNotBlank(result.attachments, this.tabLabels.attachments),
                      forms: this.applyIfNotBlank(result.forms, this.tabLabels.forms),
                      feedback: this.applyIfNotBlank(result.feedback, this.tabLabels.feedback),
                      details: this.applyIfNotBlank(result.details, this.tabLabels.details),
                      funds: this.applyIfNotBlank(result.funds, this.tabLabels.funds),
                      schedule: this.applyIfNotBlank(result.schedule, this.tabLabels.schedule),
                      risk: this.applyIfNotBlank(result.risk, this.tabLabels.risk),
                      services: this.applyIfNotBlank(result.services, this.tabLabels.services)
                  };
              }
          })
          .catch((error) => {
              console.error("Error loading tab preferred names", error);
          });
  }

  refreshParent(event) {
    console.log("event fired from child");
    setTimeout(() => {
      refreshApex(this.wiredClientResult);
    }, 1000);
  }

  handleCreateUser(event) {

      console.log('📥 Data received from child');

      const contactData = event.detail; // or event.detail.contactData based on structure

      console.log('Received contactData:', JSON.stringify(contactData));

      this.receivedContactData = contactData;

      // ✅ Toggle logic
      this.openCreateUserModal = !this.openCreateUserModal;

      console.log('openCreateUserModal value >>>', this.openCreateUserModal);
  }

  handleCloseModal() {
    this.openCreateUserModal = false; // ✅ close
  }

  handleMouseOver(event) {
    const img = event.target;
    img.style.transition =
      "opacity 0.3s ease-in-out, transform 0.3s ease-in-out"; // Add dissolve effect
    img.style.opacity = "0"; // Start fade-out for the current image

    setTimeout(() => {
      img.src = this.infoiconhover; // Change the image
      img.style.opacity = "1"; // Fade-in the new image
    }, 150); // Wait for the fade-out to complete
  }

  handleMouseOut(event) {
    const img = event.target;
    img.style.transition =
      "opacity 0.3s ease-in-out, transform 0.3s ease-in-out"; // Add dissolve effect
    img.style.opacity = "0"; // Start fade-out for the current image

    setTimeout(() => {
      img.src = this.infoicon; // Change back to the default image
      img.style.opacity = "1"; // Fade-in the default image
    }, 150); // Wait for the fade-out to complete
  }

  fetchParticipantJournal() {
    getParticipantJournal({ clientId: this.recordId })
      .then((result) => {
        console.log("Apex response:", result);

        if (result && result.client) {
          const client = result.client;
          this.medicationshtml = client.Medications__c
            ? client.Medications__c.replace(/\n/g, "<br/>")
            : "";
          this.allergieshtml = client.Allergies__c
            ? client.Allergies__c.replace(/\n/g, "<br/>")
            : "";
          this.noteshtml = client.Notes__c
            ? client.Notes__c.replace(/\n/g, "<br/>")
            : "";
          this.unavailableUntilDate = client.Unavailable_Date__c;
          this.unavailableStartDate = client.Unavailable_Start_Date__c;
          this.clientFullName = client.Name__c;
          this.medications = client.Medications__c;
          this.allergies = client.Allergies__c;
          this.notes = client.Notes__c;

          const availability = client.Current_Availability__c;
          if (availability === "Unavailable") {
            this.isUnavailable = true;
            this.isAvailable = false;
            this.status = "Unavailable";
            this.disableUnavailabledate = false;
          } else if (availability === "Available") {
            this.isUnavailable = false;
            this.isAvailable = true;
            this.status = "Available";
            this.disableUnavailabledate = true;
          }
        }

        if (result && result.riskRecord) {
          this.riskIndex = result.riskRecord.Risk_Index__c;
        } else {
          this.riskIndex = "";
        }
      })
      .catch((error) => {
        console.error("Error calling Apex:", error);
      });
  }

  /* fetchOrgDetails() {
    orgDetails()
      .then((response) => {
        console.log("Response for Org Details =>", response);
        this.Orgid = response.Id;
        this.orgfullname = response.Name;
        if(response.Premium_Client__c == true){
          this.premiumClient = true;
        }
        //this.facilityPreferredName = response.Facility_Preferred_Name_Formula__c;
        //this.participantPreferredName = response.Participant_Preferred_Name_Formula__c;
      })
      .catch((error) => {
        console.error("Error fetching org details:", error);
        this.error = error;
      });
  } */

  fetchOrgDetails() {
      orgDetails()
          .then((response) => {
              this.Orgid = response.Id;
              this.orgfullname = response.Name;
              //this.premiumClient = response.Premium_Client__c === true && this.userTypeValue == 'NDIS Org Admin';
              this.isPremiumClient = response.Premium_Client__c === true;
              console.log(' this.isPremiumClient : ', this.isPremiumClient);

              // Only Org Admin can edit
              this.canEditTabs = this.isPremiumClient
                  && this.userTypeValue === 'NDIS Org Admin';

          })
          .catch((error) => {
              this.error = error;
          });
  }

  connectedCallback() {
    console.log('facilityOptionsFromParent'+JSON.stringify(this.facilityOptionsFromParent))
    const storedFacilityId = localStorage.getItem("defaultFacilityId");
    this.facilityId=storedFacilityId;
    if (this.facilityId) {
        this.loadTabPreferredNames();
    }
    console.log("recordId ", this.recordId);
    //manendra
    this.FundsTracker = this.ndisflag
      ? 'Funds Tracker'
      : 'Pricing Catalogue';

    this.servicerecordId = this.recordId;
    this.clientId = this.recordId;
    console.log("this.participant in connectedCallback ", this.participant);
    console.log("ndisflag in connectedCallback:  ", this.ndisflag);
    console.log("companyflag in connectedCallback:  ", this.companyflag);
    console.log("ndiscreateflag in connectedCallback:  ", this.ndiscreateflag);
    console.log("ndiscreateflag in connectedCallback:  ", this.individualflag);
    console.log("navigatedFromNotifications in connectedCallback:  ", this.navigatedFromNotifications);
    console.log('isFromManageInvoice in connectedCallback ',this.isFromManageInvoice);
    // this.ClientJournel = true;
    //this.fetchOrgDetails();
    console.log("facilities" + JSON.stringify(this.faclist));
    //this.scheduleFlag= true;
    this.participantPreferredName =
      localStorage.getItem("defaultParticipantPreferredName") || "Participant";
    this.facilityPreferredName =
      localStorage.getItem("defaultFacilityPreferredName") || "Facility";
      if(this.isFromManageInvoice){
        this.createTask = false;
        this.addNew = false;
        this.ClientJournel = false;
        this.detailsFlag = false;
        this.serviceSupportFlag = false;
        this.iscreateNew = false;
        this.fundTranfer = true;
        this.Formsflag = false;
        this.attachment = false;
        this.iscreateNew = false;
        this.isVisible = true;
        this.feedback = false;
        this.scheduleFlag = false;
        this.riskFlag = false;
        return; 
      }
    this.fetchParticipantJournal();
    this.handleclientjournal();
    this.fetchOrgDetails();
    
    communityPage()
      .then((result) => {
        this.communityurl = result;
        console.log("url ==>" + result);
      })
      .catch((error) => {
        console.log("error ==>" + error);
      });
    // this.getStaffValues();
    document.addEventListener("click", this.handleOutsideClick.bind(this));
    document.body.style.overflowX = "hidden";

    console.log(
      "risk details from participant module " +
        JSON.stringify(this.riskindexdetailsfromparent)
    );
    if (
      (this.riskindexdetailsfromparent.naviagte != null ||
        this.riskindexdetailsfromparent.naviagte != undefined ||
        this.riskindexdetailsfromparent.naviagte != "") &&
      this.riskindexdetailsfromparent.naviagte == "riskmanagement"
    ) {
      this.recordId = this.riskindexdetailsfromparent.participantId;
      //console.log('ndisflag in connectedCallback inside riskindexdetailsfromparent:  ',this.ndisflag);
      this.createTask = false;
      this.addNew = false;
      this.ClientJournel = false;
      this.detailsFlag = false;
      this.serviceSupportFlag = false;
      this.iscreateNew = false;
      this.fundTranfer = false;
      this.Formsflag = false;
      this.attachment = false;
      this.iscreateNew = false;
      this.isVisible = true;
      this.feedback = false;
      this.scheduleFlag = false;
      if (this.ndisflag) {
        localStorage.setItem("activeClientTab", "risk");
        this.riskFlag = true;
      } else {
        this.detailsFlag = true;
        this.riskFlag = false;
        localStorage.removeItem("activeClientTab");
      }
    } 
    if (
      this.participantdetails &&
      Object.keys(this.participantdetails).length > 0
    ) {
      this.createTask = false;
      this.addNew = false;
      this.ClientJournel = false;
      this.detailsFlag = false;
      this.serviceSupportFlag = false;
      this.iscreateNew = false;
      this.fundTranfer = true;
      this.Formsflag = false;
      this.attachment = false;
      this.iscreateNew = false;
      this.isVisible = true;
      this.feedback = false;
      this.scheduleFlag = false;
      this.riskFlag = false;
    }
        if (
      this.participantdetails &&
      Object.keys(this.participantdetails).length > 0
    ) {
      this.createTask = false;
      this.addNew = false;
      this.ClientJournel = false;
      this.detailsFlag = false;
      this.serviceSupportFlag = false;
      this.iscreateNew = false;
      this.fundTrackerEdit = true;
      this.Formsflag = false;
      this.attachment = false;
      this.iscreateNew = false;
      this.isVisible = true;
      this.feedback = false;
      this.scheduleFlag = false;
      this.riskFlag = false;
    }
    if(this.navigatedFromNotifications){
       if(this.ndisflag){
         localStorage.setItem("activeClientTab", "ClientJournel");
         this.fetchParticipantJournal();
         this.iscreateNew = true;
         this.ClientJournel = true;
       } else {
        this.detailsFlag = true;
        this.ClientJournel = false;
        localStorage.removeItem("activeClientTab");
       }
    }
    const activeTab = localStorage.getItem("activeClientTab");
    this.createTask = false;
    this.addNew = false;
    this.ClientJournel = false;
    this.detailsFlag = false;
    this.serviceSupportFlag = false;
    this.iscreateNew = false;
    this.fundTranfer = false;
    this.fundTrackerEdit = false; 
    this.Formsflag = false;
    this.attachment = false;
    this.iscreateNew = false;
    this.isVisible = true;
    this.feedback = false;
    this.scheduleFlag = false;
    this.riskFlag = false;
    this.ParticipantAvailabiltyFlag = false;

    // Then activate the one from localStorage
    if (
      this.riskindexdetailsfromparent?.naviagte === "riskmanagement" &&
      this.ndisflag
    ) {
      // If riskmanagement & ndisflag true, always show risk tab
      this.riskFlag = true;
      this.detailsFlag = false;
      console.log("activeTab 1: ", activeTab);
    } else if (activeTab === "details") {
      this.detailsFlag = true;
      console.log("activeTab 2: ", activeTab);
    } else if (activeTab === "fundtranfer") {
      this.fundTranfer = true;
    } else if (activeTab === "ServiceandSupportPlan") {
      this.serviceSupportFlag = true;
    } else if (activeTab === "ParticipantForms") {
      this.Formsflag = true;
    } else if (activeTab === "ClientJournel") {
      this.fetchParticipantJournal();
      this.iscreateNew = true;
      this.ClientJournel = true;
    } else if (activeTab === "attachment") {
      this.attachment = true;
    } else if (activeTab === "feedback") {
      this.feedback = true;
    } else if (activeTab === "schedule") {
      this.scheduleFlag = true;
    } else if (activeTab === "risk") {
      this.riskFlag = true;
    } else {
      if(!this.isStaff){
          this.detailsFlag = true; // default
         console.log('activeTab 3: ', activeTab);
      }else{
       
      this.ClientJournel = true;
      }
      
    }

    // Initial calculation
this.setPageSizeByZoomAndScreen();

// Listen for browser resize/zoom
this.resizeHandler = () => {
    this.setPageSizeByZoomAndScreen();
};

window.addEventListener('resize', this.resizeHandler);
  }

  handleclientjournal(){
    listOfClientjounel({ recordId: this.recordId }).then((response) => {
      console.log('user image url2'+JSON.stringify(response));
      
      this.clientJournelList = [];
      //this.noRecordsFlag = !(response && response.length > 0);
      let correctionIds = []; // manendra added for AWS upload      
      let correctionAttachmentMap = {};
      response.forEach((record) => {
        console.log(
    'Journal Record',
    JSON.stringify(record)
);
        let tempConRec = Object.assign({}, record);
        if (tempConRec.ShiftwithStaff__r) {

    const shiftDate = new Date(
        tempConRec.ShiftwithStaff__r.Shift_Start_DateTime__c
    );

    const date = shiftDate.toLocaleDateString('en-AU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    tempConRec.shiftDetails =
        `${date} (${tempConRec.ShiftwithStaff__r.Shift_Start_End_Time__c})`;

} else {

    tempConRec.shiftDetails = '';

}
        // manendra added for Create plain text preview from Rich Text Description
      let div = document.createElement('div');
      div.innerHTML = tempConRec.Description__c || '';

      tempConRec.descriptionPreview =
          (div.textContent || div.innerText || '').trim();//end manendra added for Create plain text preview from Rich Text Description
        if (
    tempConRec.Client_Journels__r &&
    tempConRec.Client_Journels__r.length > 0
) {
    tempConRec.Client_Journels__r.forEach(corr => {
        correctionIds.push(corr.Id);
    });
}
        tempConRec.attachments =  tempConRec.Journal_Attachments__r || []; // manendra added for AWS upload
        console.log(
            'AttachmentsCHECK',
            JSON.stringify(tempConRec.attachments)
        );
        let today = new Date().toISOString().slice(0, 10);

        let formattedParentDate = '';
        if (tempConRec.CreatedDate) {
            const dateObj = new Date(tempConRec.CreatedDate);
            const options = {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Australia/Sydney'
            };
            formattedParentDate = dateObj.toLocaleString('en-AU', options).replace(',', '');
        }
        tempConRec.createdOnFormatted = formattedParentDate;

        let canEdit = false;
        if (tempConRec.CreatedDate) {
            const createdDate = new Date(tempConRec.CreatedDate);
            const now = new Date();
            const hoursDifference = (now - createdDate) / (1000 * 60 * 60); // hours difference

            if (hoursDifference <= 48) {
                canEdit = true; // within 48 hours
            }
        }
        tempConRec.journaledit = canEdit;

        if (
          tempConRec.CreatedBy.Name === this.name &&
          today === tempConRec.CreatedDate__c
        ) {
          tempConRec.journelDescription = true;
          this.journelDescription = true;
        } else {
          tempConRec.journelDescription = false;
        }

        if (tempConRec.Staff__r) {
          tempConRec.picture = tempConRec.Staff__r.picture__c;
          tempConRec.createdname =
            tempConRec.Staff__r.Display_Nickname__c;
        } else {
          tempConRec.createdname = tempConRec.CreatedBy.Name;
          tempConRec.picture = tempConRec.CreatedBy.SmallPhotoUrl;
        }

        console.log("user image url1 " + tempConRec.picture);
/*        tempConRec.corrections = [];
  if (tempConRec.Client_Journels__r && tempConRec.Client_Journels__r.length > 0) {
            tempConRec.corrections = tempConRec.Client_Journels__r.map((corr, index) => {
                // ✅ Format date into dd/MM/yyyy hh:mm a
                let formattedDate = '';
                if (corr.CreatedDate) {
                    const dateObj = new Date(corr.CreatedDate);
                    const options = {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                    };
                    formattedDate = dateObj.toLocaleString('en-AU', options).replace(',', '');
                }

                const staffName = corr.Staff__r?.Display_Nickname__c? `${corr.Staff__r.Display_Nickname__c}`: corr.CreatedBy?.Name;

console.log(
    'CORRECTION RECORD',
    JSON.stringify(corr)
);
                return {
                   // label: `Updated Entry ${index + 1}`,
                   label:`Updated Entry ${tempConRec.Client_Journels__r.length - index}`,
                    reason: corr.Reason__c,
                    description: corr.Description__c,
                    notes: corr.Care_Notes__c,
                    createdBy: staffName,
                    modifiedOn: formattedDate ,// formatted date here
                    attachments: corr.Journal_Attachments__r || [] // manendra added for AWS upload
                };
            });
        } */

        this.clientJournelList.push(tempConRec);
        console.log('FINAL RESPONSE',JSON.stringify( this.clientJournelList));
        //this.allClientJournels = [...this.clientJournelList];

        refreshApex(this.clientJournelList);

        if (this.clientJournelList.length > 0 && this.ClientJournel) {
          this.iscreateNew = true;
        }
      });
      getCorrectionAttachments({
    correctionIds: correctionIds
})
.then(result => {

    correctionAttachmentMap = result || {};
    this.clientJournelList.forEach(parentJournal => {

    if (
        parentJournal.Client_Journels__r &&
        parentJournal.Client_Journels__r.length > 0
    ) {

        parentJournal.corrections =
            parentJournal.Client_Journels__r.map((corr, index) => {

                let formattedDate = '';

                if (corr.CreatedDate) {
                    const dateObj = new Date(corr.CreatedDate);

                    formattedDate =
                        dateObj.toLocaleString(
                            'en-AU',
                            {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                                timeZone: 'Australia/Sydney'
                            }
                        ).replace(',', '');
                }

                const staffName =
                    corr.Staff__r?.Display_Nickname__c
                        ? corr.Staff__r.Display_Nickname__c
                        : corr.CreatedBy?.Name;
console.log(
    'Correction UI Attachments',
    corr.Id,
    JSON.stringify(correctionAttachmentMap[corr.Id])
);
                return {
                    label: `Updated Entry ${parentJournal.Client_Journels__r.length - index}`,
                    reason: corr.Reason__c,
                    description: corr.Description__c,
                    notes: corr.Care_Notes__c,
                    createdBy: staffName,
                    modifiedOn: formattedDate,
                    attachments:
                        correctionAttachmentMap[corr.Id] || []
                };
            });
    }
});

/* this.clientJournelList = [...this.clientJournelList];
this.allClientJournels = [...this.clientJournelList];
    console.log(
        'Correction Attachments Map',
        JSON.stringify(correctionAttachmentMap)
    ); */

    this.clientJournelList = [...this.clientJournelList];

// ******************** NEW CODE START ********************

getTasksByParticipant({ participantId: this.recordId })
.then(taskResult => {

    taskResult.forEach(wrapper => {

        const task = wrapper.taskRecord;

        console.log('getTasksByParticipant', JSON.stringify(wrapper));

        let formattedTaskDate = '';

        if (task.CreatedDate) {

            const dateObj = new Date(task.CreatedDate);

            formattedTaskDate = dateObj.toLocaleString('en-AU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).replace(',', '');
        }

        this.clientJournelList.push({

            Id: task.Id,

            Description__c: task.Description,
            descriptionPreview: task.Description,
            Care_Notes__c: 'Task',

            CreatedDate: task.CreatedDate,
            createdOnFormatted: formattedTaskDate,

            createdname: task.CreatedBy.Name,
            picture: '',

            corrections: [],

            // ✅ Attachments from wrapper
           // attachments: wrapper.attachments || [],
           attachments: (wrapper.attachments || []).map(att => {
            const aws = JSON.parse(att.AwsJson);
            return {
                Id: att.Id,
                File_Name__c: aws.originalName,
                File_URL__c: att.AwsUrl
            };
        }),

            journaledit: true,
            journelDescription: false,

            Status: task.Status,
            Priority: task.Priority,
            Task_Date__c: task.Task_Date__c,
            Task_Time__c: task.Task_Time__c,

            isTask: true
        });

    });

    // ---------------- Pagination ----------------

    this.clientJournelList.sort(
        (a, b) => new Date(b.CreatedDate) - new Date(a.CreatedDate)
    );

    this.clientJournelList = [...this.clientJournelList];
    this.allClientJournels = [...this.clientJournelList];
    this.noRecordsFlag = this.allClientJournels.length === 0;

    this.pageNumber = 1;
    this.updatePagination();


    if (this._pendingJournalUid) {
        this._restoreJournalAction(this._pendingJournalUid, this._pendingJournalAction);
        this._pendingJournalUid = null;
        this._pendingJournalAction = null;
    }


})
.catch(error => {
    console.error('Error loading tasks', error);
});

// ******************** NEW CODE END ********************

console.log(
    'Correction Attachments Map',
    JSON.stringify(correctionAttachmentMap)
);

});
      console.log(
    'Correction Ids',
    JSON.stringify(correctionIds)
);

    });
  }

  disconnectedCallback() {
    document.removeEventListener("click", this.handleOutsideClick.bind(this));

     if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler);
    }
  }
// manendra added for AWS upload
  handleJournalUpload(event) {

    console.log(
        'Journal Upload Success',
        JSON.stringify(event.detail)
    );

    this.journalUploadResponse = event.detail;

    this.journalUploadedFiles =
        event.detail.files || [];

    console.log(
        'Uploaded Files',
        JSON.stringify(this.journalUploadedFiles)
    );
  }

  handleViewJournalAttachment(event) {

      event.preventDefault();
      event.stopPropagation();

      this.currentUrl =
          event.currentTarget.dataset.url;

      this.isFileViewOpen = true;
      this.showViewModal = false;
  }
  handleDeleteExistingAttachment(event) {

      const attachmentId = event.currentTarget.dataset.id;

     if (!this.deletedAttachmentIds.includes(attachmentId)) {
    this.deletedAttachmentIds = [
        ...this.deletedAttachmentIds,
        attachmentId
    ];
}

      this.selectedAttachments =
          this.selectedAttachments.filter(
              file => file.Id !== attachmentId
          );

      console.log(
          'Deleted Attachment Ids',
          JSON.stringify(this.deletedAttachmentIds)
      );

      console.log(
          'Remaining Attachments',
          JSON.stringify(this.selectedAttachments)
      );
  }
  
  closeFileView() {
      this.isFileViewOpen = false;
      this.currentUrl = '';
  }

  handleView(event) {

      const journalId = event.currentTarget.dataset.id;

      this.selectedJournal = this.clientJournelList.find(
          item => item.Id === journalId
      );

      console.log(
          'Selected Journal',
          JSON.stringify(this.selectedJournal)
      );
      this.jounelId = journalId;
      this.journalModalType = 'view';
      this.showViewModal = true;
      this._syncRoute();
  }
handleHistory(event) {

    const journalId = event.currentTarget.dataset.id;

    this.selectedJournal = this.clientJournelList.find(
        item => item.Id === journalId
    );
    this.jounelId = journalId;
    this.journalModalType = 'history';

    this.showViewModal = true;
    this._syncRoute();
}
closeViewModal() {
    this.showViewModal = false;
    this.jounelId = null;
    this.selectedJournal = null;
    this._syncRoute();    
}
// manendra end for AWS upload

  handleClick(event) {
    //this.commitEditingIfAny();
    // if (this.editingTab) {
    //     this.tabLabels = { ...this.originalTabLabels };
    //     this.editingTab = null;
    // }

    if (this.editingTab) {
        console.log('Blocked click during edit mode');
        return;
    }
    
    if (event.target.dataset.name == "ClientJournel") {
      console.log(event.target.dataset.name);
      this.fetchParticipantJournal();
      this.ClientJournel = true;
      this.iscreateNew = true;
      this.addNew = false;
      this.createTask = false;
      this.detailsFlag = false;
      this.serviceSupportFlag = false;
      this.fundTranfer = false;
      this.Formsflag = false;
      this.attachment = false;
      this.isVisible = true;
      this.feedback = false;
      this.scheduleFlag = false;
      this.riskFlag = false;
      this.ParticipantAvailabiltyFlag = false;
      // localStorage.setItem('ClientJournelFlag', this.ClientJournel);
      localStorage.setItem("activeClientTab", "ClientJournel");
       this.editingTab='';
     
    }
    if (event.target.name == "addNew") {
      this.iscreateNew = true;
      this.correctionflag =false;
      this.Journal='Create Journal'
      this.reason='';
       this.selectedAttachments = [];
    this.journalUploadedFiles = [];
    this.deletedAttachmentIds = [];
      this.addNew = true;
      this.detailsFlag = false;
      this.serviceSupportFlag = false;
      this.isVisible = false;
      this.Formsflag = false;
      this.fundTranfer = false;
      this.attachment = false;
      this.notesflag = false;
      this.jounelId = "";
      this.jNoteType = "";
      this.buttonlabel = "Save";
      this.feedback = false;
      this.scheduleFlag = false;
      this.showMuteIcon = false;
      this.showClearIcon = false;
      this.riskFlag = false;
      this.ParticipantAvailabiltyFlag = false;
    
    }
    if (event.target.name == "createTask") {
      this.createTask = true;
      
      this.addNew = false;
      this.detailsFlag = false;
      this.serviceSupportFlag = false;
      this.iscreateNew = true;
      this.isVisible = false;
      this.Formsflag = false;
      this.fundTranfer = false;
      this.attachment = false;
      this.feedback = false;
      this.scheduleFlag = false;
      this.riskFlag = false;
      this.ParticipantAvailabiltyFlag = false;
       this.jounelId='';
    }
    if (event.target.dataset.name == "details") {
      this.createTask = false;
      this.addNew = false;
      this.ClientJournel = false;
      this.detailsFlag = true;
      this.serviceSupportFlag = false;
      this.iscreateNew = false;
      this.fundTranfer = false;
      this.Formsflag = false;
      this.attachment = false;
      this.isVisible = true;
      this.feedback = false;
      this.scheduleFlag = false;
      this.riskFlag = false;
      this.ParticipantAvailabiltyFlag = false;

      // localStorage.setItem('clientDetailsFlag', this.detailsFlag);
      localStorage.setItem("activeClientTab", "details");
       this.editingTab='';
    }
    if (event.target.dataset.name == "ServiceandSupportPlan") {
      this.createTask = false;
      this.addNew = false;
      this.ClientJournel = false;
      this.detailsFlag = false;
      this.serviceSupportFlag = true;
      this.iscreateNew = false;
      this.fundTranfer = false;
      this.Formsflag = false;
      this.attachment = false;
      this.iscreateNew = false;
      this.isVisible = true;
      this.feedback = false;
      this.scheduleFlag = false;
      this.riskFlag = false;
      this.ParticipantAvailabiltyFlag = false;
      // localStorage.setItem('clientServiceSupportFlag', this.serviceSupportFlag);
      localStorage.setItem("activeClientTab", "ServiceandSupportPlan");
       this.editingTab='';
    }

    if (event.target.dataset.name == "fundtranfer") {
      this.createTask = false;
      this.addNew = false;
      this.ClientJournel = false;
      this.detailsFlag = false;
      this.serviceSupportFlag = false;
      this.iscreateNew = false;
      this.fundTranfer = true;
      this.Formsflag = false;
      this.attachment = false;
      this.iscreateNew = false;
      this.isVisible = true;
      this.feedback = false;
      this.scheduleFlag = false;
      this.riskFlag = false;
      this.ParticipantAvailabiltyFlag = false;
      // localStorage.setItem('clientfundTranferFlag', this.fundTranfer);
      localStorage.setItem("activeClientTab", "fundtranfer");
        this.editingTab='';
    }

        if (event.target.dataset.name == "fundTrackerEdit") {
      this.createTask = false;
      this.addNew = false;
      this.ClientJournel = false;
      this.detailsFlag = false;
      this.serviceSupportFlag = false;
      this.iscreateNew = false;
      this.fundTrackerEdit = true;
      this.Formsflag = false;
      this.attachment = false;
      this.iscreateNew = false;
      this.isVisible = true;
      this.feedback = false;
      this.scheduleFlag = false;
      this.riskFlag = false;
      this.ParticipantAvailabiltyFlag = false;
      // localStorage.setItem('clientfundTranferFlag', this.fundTranfer);
      localStorage.setItem("activeClientTab", "fundTrackerEdit");
    }
    if (event.target.dataset.name == "ParticipantForms") {
      this.createTask = false;
      this.addNew = false;
      this.ClientJournel = false;
      this.detailsFlag = false;
      this.serviceSupportFlag = false;
      this.iscreateNew = false;
      this.fundTranfer = false;
      this.Formsflag = true;
      this.attachment = false;
      this.iscreateNew = false;
      this.isVisible = true;
      this.feedback = false;
      this.scheduleFlag = false;
      this.riskFlag = false;
      this.ParticipantAvailabiltyFlag = false;
      //  localStorage.setItem('clientFormsflag', this.Formsflag);
      localStorage.setItem("activeClientTab", "ParticipantForms");
       this.editingTab='';
    }
    if (event.target.dataset.name == "attachment") {
      this.createTask = false;
      this.addNew = false;
      this.ClientJournel = false;
      this.detailsFlag = false;
      this.serviceSupportFlag = false;
      this.iscreateNew = false;
      this.fundTranfer = false;
      this.Formsflag = false;
      this.attachment = true;
      this.iscreateNew = false;
      this.isVisible = true;
      this.feedback = false;
      this.scheduleFlag = false;
      this.riskFlag = false;
      this.ParticipantAvailabiltyFlag = false;
      //localStorage.setItem('clientAttachmentFlag', this.attachment);
      localStorage.setItem("activeClientTab", "attachment");
       this.editingTab='';
    }
    if (event.target.dataset.name == "feedback") {
      this.createTask = false;
      this.addNew = false;
      this.ClientJournel = false;
      this.detailsFlag = false;
      this.serviceSupportFlag = false;
      this.iscreateNew = false;
      this.fundTranfer = false;
      this.Formsflag = false;
      this.attachment = false;
      this.iscreateNew = false;
      this.isVisible = true;
      this.feedback = true;
      this.scheduleFlag = false;
      this.riskFlag = false;
      this.ParticipantAvailabiltyFlag = false;
      //localStorage.setItem('clientFeedbackFlag', this.feedback);
      localStorage.setItem("activeClientTab", "feedback");
       this.editingTab='';
    }
    if (event.target.dataset.name == "schedule") {
      this.createTask = false;
      this.addNew = false;
      this.ClientJournel = false;
      this.detailsFlag = false;
      this.serviceSupportFlag = false;
      this.iscreateNew = false;
      this.fundTranfer = false;
      this.Formsflag = false;
      this.attachment = false;
      this.iscreateNew = false;
      this.isVisible = true;
      this.feedback = false;
      this.scheduleFlag = true;
      this.riskFlag = false;
      this.ParticipantAvailabiltyFlag = false;
      //  localStorage.setItem('clientScheduleFlag', this.scheduleFlag);
      localStorage.setItem("activeClientTab", "schedule");
       this.editingTab='';
    }
    if (event.target.dataset.name == "risk") {
      this.createTask = false;
      this.addNew = false;
      this.ClientJournel = false;
      this.detailsFlag = false;
      this.serviceSupportFlag = false;
      this.iscreateNew = false;
      this.fundTranfer = false;
      this.Formsflag = false;
      this.attachment = false;
      this.iscreateNew = false;
      this.isVisible = true;
      this.feedback = false;
      this.scheduleFlag = false;
      this.riskFlag = true;
      this.ParticipantAvailabiltyFlag = false;
      //  localStorage.setItem('clientRiskFlag', this.riskFlag);
      localStorage.setItem("activeClientTab", "risk");
        this.editingTab='';
    }
    if (event.target.dataset.name == "ParticipantAvailabilty") {
      this.createTask = false;
      this.addNew = false;
      this.ClientJournel = false;
      this.detailsFlag = false;
      this.serviceSupportFlag = false;
      this.iscreateNew = false;
      this.fundTranfer = false;
      this.Formsflag = false;
      this.attachment = false;
      this.iscreateNew = false;
      this.isVisible = false;
      this.feedback = false;
      this.scheduleFlag = false;
      this.riskFlag = false;
      this.ParticipantAvailabiltyFlag = true;
      this.editingTab='';
    }
    this._syncRoute(false);
  }

  @track searchName;

/*   handleSearchInput(event) {
    const searchKey = event.target.value ? event.target.value.toLowerCase() : '';
    this.searchName = searchKey;

    if (!searchKey) {
        this.clientJournelList = [...this.allClientJournels];
        return;
    }

    this.clientJournelList = this.allClientJournels.filter(record => {

        // remove HTML tags from description
        let description = record.Description__c
            ? record.Description__c.replace(/<[^>]*>/g, '').toLowerCase()
            : '';

        let createdBy = record.CreatedBy && record.CreatedBy.Name
            ? record.CreatedBy.Name.toLowerCase()
            : '';

        let notes = '';

        let careNotes = record.Care_Notes__c
            ? record.Care_Notes__c.toLowerCase()
            : '';

        let createdDate = record.createdOnFormatted
            ? record.createdOnFormatted.toLowerCase()
            : '';

        return (
            description.includes(searchKey) ||
            createdBy.includes(searchKey) ||
            careNotes.includes(searchKey) ||
            createdDate.includes(searchKey)
        );
    });
}  */
  handleSearchInput(event) {

      this.searchName = event.target.value
          ? event.target.value.toLowerCase().trim()
          : '';

      this.applyFilters();

  }
  handleTypeFilter(event) {

      this.selectedType = event.detail.value;

      this.applyFilters();

  }
  applyFilters() {

      let filteredRecords = [...this.clientJournelList];

      // Type Filter
      if (this.selectedType && this.selectedType !== 'All') {

          filteredRecords = filteredRecords.filter(record =>
              record.Care_Notes__c === this.selectedType
          );

      }

      // Search Filter
      if (this.searchName) {

          const searchKey = this.searchName.toLowerCase().trim();

          filteredRecords = filteredRecords.filter(record => {

              let description = (
                  record.Description__c ||
                  record.descriptionPreview ||
                  ''
              ).replace(/<[^>]*>/g, '').toLowerCase();

              let createdBy = (
                  record.createdname || ''
              ).toLowerCase();

              let careNotes = (
                  record.Care_Notes__c || ''
              ).toLowerCase();

              let createdDate = (
                  record.createdOnFormatted || ''
              ).toLowerCase();

              return (
                  description.includes(searchKey) ||
                  createdBy.includes(searchKey) ||
                  careNotes.includes(searchKey) ||
                  createdDate.includes(searchKey)
              );

          });

      }
      this.noRecordsFlag = filteredRecords.length === 0;
      this.allClientJournels = filteredRecords;

      this.pageNumber = 1;

      this.updatePagination();

  }

  @track correctionflag=false;
  @track reason = "";

  handleReasonChange(event) {
    this.reason = event.target.value;
  }
  handleEdit(event) {
    event.stopPropagation();
    console.log(
    'journalUploadedFiles On Edit',
    JSON.stringify(this.journalUploadedFiles)
);
    this.jounelId = event.currentTarget.dataset.id;
     this.Journal='Journal Correction';
    console.log('jounelId',this.jounelId);
    // this.description = event.target.dataset.name;
    // this.jNoteType = event.target.dataset.notestype;
        // manendra added fr AWS upload
    this.description = event.currentTarget.dataset.name;
    this.jNoteType = event.currentTarget.dataset.notestype;
    if (this.jNoteType === 'Task') {
      this.createTask = true;
      this.addNew = false;
      this.ClientJournel = true;
      this.isVisible = false;
      this._syncRoute();
      
      return;
  }
    const selectedJournal = this.clientJournelList.find(
        item => item.Id === this.jounelId
    );
    this.editAttachments = selectedJournal?.attachments
        ? JSON.parse(JSON.stringify(selectedJournal.attachments))
        : [];
    console.log('Edit Attachments',JSON.stringify(this.editAttachments));
        this.selectedAttachments =
        JSON.parse(
            JSON.stringify(
                selectedJournal.attachments || []
            )
        );

    console.log(
        'Selected Attachments',
        JSON.stringify(this.selectedAttachments)
    );

    console.log(
    'existingFilesJson',
    JSON.stringify(this.selectedAttachments)
);
    //  END
    this.iscreateNew = false;
    this.correctionflag = true;
    this.reason='';
    this.addNew = true;
    this.isVisible = false;
    this.notesflag = true;
    this.buttonlabel = "Update";
      this._syncRoute();
    
  }

  // onchangeJournel(event){
  //     this.description=event.target.value;
  // }

  value = "inProgress";

  get options() {
    return [
      { label: "Care Notes", value: "Care Notes" },
      { label: "Progress Notes", value: "Progress Notes" },
      { label: "Special Instructions", value: "Special Instructions" }
    ];
  }

  handleChange(event) {
    this.jNoteType = event.detail.value;
    //alert(this.journelNoteType);
  }

  closeAddJournel() {
    this.iscreateNew = true;
    this.addNew = false;
    this.description = "";
    this.notesType = "";
    this.isVisible = true;
    this.assignClient = false;
    this.ClientJournel = true;
    this.showMuteIcon = false;
    this.jounelId = null;
    this._syncRoute();    
  }

  handleSave(event) {
    if (!this.jNoteType) {
      const Note = this.template.querySelector('[data-id="Note"]');
      Note.reportValidity();
      /*  const event = new ShowToastEvent({
                title: 'Error',
                message: 'Please select an option for the picklist field',
                variant: 'error'
            });
            this.dispatchEvent(event); */
      return; // Stop further execution
    }
    if (!this.description) {
     /*  const desc = this.template.querySelector('[data-id="desc"]');
      desc.reportValidity(); */
       const event = new ShowToastEvent({
                title: 'Error',
                message: 'Please enter description',
                variant: 'error'
            });
            this.dispatchEvent(event);
      return;
    }
    if(this.correctionflag){
      if (!this.reason) {
        const reason = this.template.querySelector('[data-id="reason"]');
        reason.reportValidity();
        return;
      }
    }
    console.log("this.jNoteType " + this.jNoteType);
    console.log("this.description " + this.description);
    console.log(
        'Selected Attachments Before Save',
        JSON.stringify(this.selectedAttachments)
    );

    console.log(
        'Deleted Attachment Ids Before Save',
        JSON.stringify(this.deletedAttachmentIds)
    );

    console.log(
        'New Uploaded Files Before Save',
        JSON.stringify(this.journalUploadedFiles)
    );
    saveDesc({
      recordId: this.recordId,
      jounelId: this.jounelId,
      description: this.description,
      jNoteType: this.jNoteType,
      correctionReason:this.reason,
      shiftId:null
    }).then((result) => {
     /* //if (result.includes("Created Successfully!")) {
       
    console.log('Created Journal Id', result.journalId);
        this.clientJournelList = [];
 
       this.handleclientjournal();
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: "Journal created successfully.",
            variant: "success"
          })
        );
      } */
     // manendra added for AWS upload
    if (result.message === "Created Successfully!") {

    console.log('Created Journal Id', result.journalId);

    // Save attachments if uploaded
if (this.journalUploadedFiles &&
    this.journalUploadedFiles.length > 0) {

    console.log(
        'Saving Attachments',
        JSON.stringify(this.journalUploadedFiles)
    );

    saveJournalAttachments({
        journalId: result.journalId,
        uploadedFilesJson: JSON.stringify(this.journalUploadedFiles)
    })
    .then(() => {

        console.log('Attachments Saved Successfully');
 this.journalUploadedFiles = [];
        this.clientJournelList = [];
        this.handleclientjournal();   // <-- MOVE HERE

    })
    .catch(error => {
        console.error(
            'Attachment Save Error',
            JSON.stringify(error)
        );
    });

} else {

    this.clientJournelList = [];
    this.handleclientjournal();
}
 

    this.dispatchEvent(
        new ShowToastEvent({
            title: "Success",
            message: "Journal created successfully.",
            variant: "success"
        })
    );
}
     // if (result.includes("Correction Created Successfully!")) {
/*    if (result.message.includes("Correction Created Successfully!")) {// manendra added for AWS upload
    console.log('Correction Journal Id', result.journalId);
        this.clientJournelList = [];
 
       this.handleclientjournal();
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: "Reason created successfully.",
            variant: "success"
          })
        );
      } */
if (result.message === "Correction Created Successfully!") {

    console.log('Correction Journal Id', result.journalId);

    let filesToSave = [];

    // Existing attachments remaining after delete
    if (this.selectedAttachments?.length) {

        this.selectedAttachments.forEach(file => {

            filesToSave.push({
                url: file.File_URL__c,
                key: file.AWS_Key__c
            });

        });
    }

    // Newly uploaded attachments
    if (this.journalUploadedFiles?.length) {

        filesToSave.push(
            ...this.journalUploadedFiles
        );
    }

    console.log(
        'Files To Save For Correction',
        JSON.stringify(filesToSave)
    );

    if (filesToSave.length > 0) {
console.log(
    'SELECTED ATTACHMENTS',
    JSON.stringify(this.selectedAttachments)
);

console.log(
    'UPLOADED ATTACHMENTS',
    JSON.stringify(this.journalUploadedFiles)
);
        saveJournalAttachments({
            journalId: result.journalId,
            uploadedFilesJson: JSON.stringify(filesToSave)
        })
        .then(() => {

            console.log(
                'Correction Attachments Saved'
            );
this.journalUploadedFiles = [];
            this.handleclientjournal();
        });
    } else {

        this.handleclientjournal();
    }

    this.clientJournelList = [];

    this.dispatchEvent(
        new ShowToastEvent({
            title: "Success",
            message: "Reason created successfully.",
            variant: "success"
        })
    );
}
      // if (result.includes("existing value selected")) {
      //   this.dispatchEvent(
      //     new ShowToastEvent({
      //       title: "Error",
      //       message:
      //         "Record cannot be updated because you have selected duplcated notes type",
      //       variant: "error"
      //     })
      //   );
      // } else if (result === "duplicate") {
      //   this.dispatchEvent(
      //     new ShowToastEvent({
      //       title: "Error",
      //       message: "Duplicate Notes Type found, the record cannot be saved!",
      //       variant: "error"
      //     })
      //   );
      // }
    });

    this.iscreateNew = true;
    this.addNew = false;
    this.isVisible = true;
    this.description = "";
    this.jounelId = null;
    this._syncRoute();    
  }

  createTaskParent() {
    this.template.querySelector("c-task-create ").createTask();
    this.createTask = false;
    this.ClientJournel = true;
    this.isVisible = true;
    this.iscreateNew = true;
    this.jounelId = null;
    this._syncRoute();    
  }

  closeTask() {
    this.createTask = false;
    this.ClientJournel = true;
    this.isVisible = true;
    this.iscreateNew = true;
    this.jounelId = null;
    this._syncRoute();    
  }

  get journelClass() {
    return this.ClientJournel ? "participantClass2" : "participantClass"; // you can use your custom class here.
  }
  get detailsClass() {
    return this.detailsFlag ? "participantClass2" : "participantClass"; // you can use your custom class here.
  }

  get fundClass() {
    return this.fundTranfer ? "participantClass2" : "participantClass"; // you can use your custom class here.
  }
  get serviceClass() {
    return this.serviceSupportFlag ? "participantClass2" : "participantClass"; // you can use your custom class here.
  }
  get fundsClass() {
    return this.Formsflag ? "participantClass2" : "participantClass"; // you can use your custom class here.
  }
  get attachClass() {
    return this.attachment ? "participantClass2" : "participantClass"; // you can use your custom class here.
  }
  get servClass() {
    return this.feedback ? "participantClass2" : "participantClass"; // you can use your custom class here.
  }
  get scheduleClass() {
    return this.scheduleFlag ? "participantClass2" : "participantClass"; // you can use your custom class here.
  }
  get riskClass() {
    return this.riskFlag ? "participantClass2" : "participantClass"; // you can use your custom class here.
  }
  get ParticipantAvailabiltyClass() {
    return this.ParticipantAvailabiltyFlag
      ? "participantClass2"
      : "participantClass"; // you can use your custom class here.
  }

  navigateToParticipant() {
    localStorage.removeItem("activeClientTab");
    console.log("LocalStorage cleared in CHILD.");

    const customEvent = new CustomEvent("clientevent", {
      detail: { message: "Hello from Child!" }
    });
    this.dispatchEvent(customEvent);
  }

  /* @track assignClient = false;
    handleAssignClient(){
        this.assignClient = true;
        this.participantlayout = false;
        this.ClientJournel = false;
    }
    handleBack(){
        this.assignClient = false;
        this.participantlayout = false;
        this.ClientJournel = true;
    }

    @track staffOptions = [];    
    @track staffVal;
   
    getStaffValues(){
        getEmployeeData().then(response => {
            this.staffOptions = response.map(record => ({ value: record.Id, label: record.Name })); 
            console.log('staff options '+JSON.stringify(this.staffOptions));
           // console.log('staff options1 >>'+JSON.stringify(this.staffOptions1));

            let staffLength=Object.keys(this.staffOptions).length;           
            this.staffVal = this.staffOptions[0].label;
            this.staffVal1 = this.staffOptions1[0].label
            //this.stafflabel=this.staffOptions2[0].label;
            console.log('staff Options label '+ this.staffOptions[0].label);
        }).catch(err => {
       
        });
    }

    @track stafflabel;
    @track staffName=[];
    handleStaffChange(event) {
       // this.stafflabel = this.staffOptions.find(rec=>rec.value==event.detail.value).label;
       // console.log('Staff label----->'+this.stafflabel);
        this.staffName = event.target.value;
        console.log('Staff Name >> '+ this.staffName);
    } */

  get iconName() {
    if (this.isListening) {
      return "utility:unmuted";
    } else {
      return "utility:muted";
    }
  }

  // Alternative text for accessibility
  get altText() {
    if (this.isListening) {
      return "Unmute";
    } else {
      return "Mute";
    }
  }
  // Toggle between mute/unmute
  toggleListening() {
    try {
      this.isListening = !this.isListening;
      if (this.isListening) {
        this.startListening();
      } else {
        this.stopListening();
      }
    } catch (error) {
      console.error("Error in toggleListening:", error.message);
    }
  }
  // Show icons when text area gains focus
  handleFocus() {
    console.log("handleFocus executing >>");
    try {
      this.showMuteIcon = true;
      this.isListening = false; // Ensure the state is not in listening mode
      if (this.recognition) {
        this.recognition.stop(); // Stop any ongoing recognition process
        this.recognition = null; // Clear recognition instance
      }
    } catch (error) {
      console.error("Error in handleFocus:", error.message);
    }
  }
  // Start speech recognition
  startListening() {
    try {
      console.log("Listening started...");
      if (
        "SpeechRecognition" in window ||
        "webkitSpeechRecognition" in window
      ) {
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
          this.description += Array.from(event.results)
            .map((result) => result[0].transcript)
            .join("");
          this.showClearIcon = true; // Show clear icon after transcription
        };

        recognition.onerror = (event) => {
          console.error("Error during speech recognition:", event.error);
        };

        recognition.onend = () => {
          console.log("Recognition ended");
          this.isListening = false;
        };

        recognition.start();
        this.recognition = recognition;
      } else {
        console.error("SpeechRecognition API not supported by this browser.");
        alert("SpeechRecognition API is not supported in this browser.");
      }
    } catch (error) {
      console.error("Error in startListening:", error.message);
    }
  }

  // Stop speech recognition
  stopListening() {
    try {
      console.log("Listening stopped...");
      if (this.recognition) {
        this.recognition.stop();
        this.recognition = null;
      }
    } catch (error) {
      console.error("Error in stopListening:", error.message);
    }
  }

  // Clear text and hide clear icon
  clearText() {
    try {
      this.description = "";
      this.showClearIcon = false;
      if (this.isListening) {
        //this.startListening();
        this.stopListening();
        this.description = "";
      }
    } catch (error) {
      console.error("Error in clearText:", error.message);
    }
  }

  // Handle text change to show clear icon
  onchangeJournel(event) {
    try {
      this.description = event.target.value;
      this.showClearIcon = this.description.length > 0;
    } catch (error) {
      console.error("Error in handleTextChange:", error.message);
    }
  }

  //Slide-In-Out-Animation
  @track header = true; // Always true
  @track animationClass = ""; // Tracks the animation class

  toggleHeader(event) {
    event.stopPropagation(); // Prevent triggering the outside click listener when clicking the icon
    const gridElement = this.template.querySelector(".grid");

    if (gridElement.classList.contains("slide-in")) {
      // Slide out the header
      gridElement.classList.remove("slide-in");
      gridElement.classList.add("slide-out");

      // Hide the header after the animation completes
      setTimeout(() => {
        gridElement.style.visibility = "hidden";
        console.log("Header is now hidden after sliding out.");
      }, 500); // Match the animation duration
    } else {
      // Slide in the header
      gridElement.style.visibility = "visible"; // Ensure it is visible before sliding in
      gridElement.classList.remove("slide-out");
      gridElement.classList.add("slide-in");

      console.log("Header is now visible after sliding in.");
    }
  }

  handleOutsideClick(event) {
    const gridElement = this.template.querySelector(".grid");
    if (
      gridElement &&
      !gridElement.contains(event.target) && // Ensure click is outside the grid
      !event.target.closest("img") // Ensure click is not on the icon
    ) {
      if (gridElement.classList.contains("slide-in")) {
        // Slide out the header
        gridElement.classList.remove("slide-in");
        gridElement.classList.add("slide-out");
      }
    }
  }

  preventClose(event) {
    event.stopPropagation(); // Prevent triggering the outside click listener when clicking inside the grid
  }

  participantJournalmodelPop(event) {
    this.participantpopup = true;
  }

  handleCloseparticipantpopup(event) {
    console.log("🚫 Cancel clicked — setting isClosingPopup = true");
    this.isClosingPopup = true;

    this.fetchParticipantJournal();
    this.participantpopup = false;

    // Reset flag after popup fully closes (optional short delay)
    setTimeout(() => {
        this.isClosingPopup = false;
        console.log("🔄 isClosingPopup reset to false");
    }, 300);
  }


  handleAvailableChange(event) {
    this.isAvailable = event.target.checked;
    this.disableUnavailabledate = true;
    if (this.isAvailable) {
      this.isUnavailable = false;
     // this.unavailableUntilDate = null;
      this.isSaveDisabled = false; // ✅ Enable the Update button
  }

  console.log("Available checked:", this.isAvailable);
  console.log("Unavailable unchecked:", this.isUnavailable);
  console.log("Save button enabled:", !this.isSaveDisabled);
  }

  handleUnavailableChange(event) {
    this.isUnavailable = event.target.checked;
    this.disableUnavailabledate = !this.isUnavailable;
    
    if (this.isUnavailable) {
      this.isAvailable = false;
      
    } else {
      this.unavailableStartDate = null;
      this.unavailableUntilDate = null;
      this.isSaveDisabled = false; // ✅ Re-enable save button when switching states
    }

    console.log("Unavailable checked:", this.isUnavailable);
    console.log("Available unchecked:", this.isAvailable);
  }

  handleField1Change(event) {
    this.riskIndex = event.target.value;
    console.log("Risk Index:", this.riskIndex);
  }

  handleAddShiftChange(event) {
    const fieldName = event.target.name;

    switch (fieldName) {
      case "medications":
        this.medications = event.target.value;
        console.log("Medications:", this.medications);
        break;
      case "allergies":
        this.allergies = event.target.value;
        console.log("Allergies:", this.allergies);
        break;
      case "notes":
        this.notes = event.target.value;
        console.log("Notes:", this.notes);
        break;
      default:
        break;
    }
  }

handleUnAvailDateChange(event) {
    const field = event.target.dataset.field;
    const value = event.target.value;

    console.log("FIELD:", field, "VALUE:", value);

    if (field === 'start') {
        this.unavailableStartDate = value;
    } else if (field === 'end') {
        this.unavailableUntilDate = value;
    }

    console.log("AFTER ASSIGN → Start:", this.unavailableStartDate,
                "End:", this.unavailableUntilDate);
}
stopClickPropagation(event) {
    event.stopPropagation();
}



validateDateRange() {
    const start = this.unavailableStartDate ? new Date(this.unavailableStartDate) : null;
    const end = this.unavailableUntilDate ? new Date(this.unavailableUntilDate) : null;

    if (start && end) {
        start.setHours(0,0,0,0);
        end.setHours(0,0,0,0);

        if (start > end) {
            this.isSaveDisabled = true;
            return;
        }
    }

    this.isSaveDisabled = false;
}


  handlesavebuttonforParticipantPopup() {
    console.log("handleSave executing >>");

    console.log(
        "isAvailable:", this.isAvailable,
        "isUnavailable:", this.isUnavailable,
        "Client Id:", this.recordId,
        "medications:", this.medications,
        "allergies:", this.allergies,
        "notes:", this.notes,
        "Start Date:", this.unavailableStartDate,
        "End Date:", this.unavailableUntilDate
    );

    // 🟢 VALIDATION BLOCK (ALWAYS BEFORE APEX CALL)
    if (this.isUnavailable === true) {

        const startInput = this.template.querySelector('[data-id="startDate"]');
        const endInput = this.template.querySelector('[data-id="date"]');

        // Start Date required
        if (!this.unavailableStartDate) {
            startInput.reportValidity();
            return;
        }

        // End Date required
        if (!this.unavailableUntilDate) {
            endInput.reportValidity();
            return;
        }

        const start = new Date(this.unavailableStartDate);
        const end = new Date(this.unavailableUntilDate);

        start.setHours(0,0,0,0);
        end.setHours(0,0,0,0);

        // Start should not be after End
        if (start > end) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Start Date must be before or equal to End Date',
                    variant: 'error'
                })
            );
            return;
        }

        // Optional: Start should not be in past
        const today = new Date();
        today.setHours(0,0,0,0);

        if (start < today) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Start Date cannot be in the past',
                    variant: 'error'
                })
            );
            return;
        }
    }

    // 🟢 APEX CALL (UPDATED PARAMS)
    saveStatusData({
        isAvailable: this.isAvailable,
        isUnavailable: this.isUnavailable,
        clientId: this.recordId,
        medications: this.medications,
        allergies: this.allergies,
        notes: this.notes,
        unavailableStartDate: this.unavailableStartDate,
        unavailableEndDate: this.unavailableUntilDate
    })
    .then(() => {
        console.log("Data saved successfully");

        this.dispatchEvent(
            new ShowToastEvent({
                title: "Success",
                message: "Snapshot updated successfully.",
                variant: "success"
            })
        );

        this.fetchParticipantJournal();
        this.participantpopup = false;
    })
    .catch((error) => {
        console.error("Error saving data: ", error);

        this.dispatchEvent(
            new ShowToastEvent({
                title: "Error",
                message: "Failed to save data",
                variant: "error"
            })
        );
    });
}
  handleHideFacilityEvent(event) {
    const forward = new CustomEvent("hidefacilityevent", {
      detail: event.detail,
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(forward);
  }

  handleEditTab(event) {
    event.stopPropagation(); 
    const tab = event.currentTarget.dataset.tab;

    // 🔒 Take snapshot only once per edit
    this.originalTabLabels = {
        ...this.tabLabels
    };

    this.editingTab = tab;
    console.log("Editing tab:", this.editingTab);
  }

  handleTabNameChange(event) {
      event.stopPropagation(); 
      const tab = event.target.dataset.tab;
      const value = event.target.value;

      if (value && value.length > 30) {
          event.target.value = value.substring(0, 30);

          this.dispatchEvent(
              new ShowToastEvent({
                  title: 'Invalid Tab Name',
                  message: 'Tab name cannot exceed 30 characters.',
                  variant: 'error'
              })
          );
      }

      this.tabLabels = {
          ...this.tabLabels,
          [tab]: event.target.value
      };
  }

  handleSaveTabName(event) {
      event.stopPropagation();

      if (!this.editingTab || !this.facilityId) {
          this.editingTab = null;
          return;
      }

      const value = this.tabLabels[this.editingTab];

      // ❌ Block empty value in UI
      if (!value || value.trim().length === 0) {
          this.dispatchEvent(
              new ShowToastEvent({
                  title: 'Invalid Tab Name',
                  message: 'Tab name cannot be empty.',
                  variant: 'error'
              })
          );
          return; // ⛔ DO NOT call Apex
      }

      // ❌ Block > 30 chars (extra safety)
      if (value.length > 30) {
          this.dispatchEvent(
              new ShowToastEvent({
                  title: 'Invalid Tab Name',
                  message: 'Tab name cannot exceed 30 characters.',
                  variant: 'error'
              })
          );
          return;
      }

      saveTabPreferredName({
          facilityId: this.facilityId,
          tabKey: this.editingTab,
          preferredName: value
      })
      .then(() => {
          this.loadTabPreferredNames();
      })
      .catch(error => {
          this.dispatchEvent(
              new ShowToastEvent({
                  title: 'Error',
                  message: error?.body?.message || 'Failed to save tab name.',
                  variant: 'error'
              })
          );
      });

      this.editingTab = null;
  }


  get isEditingJournal() {
    return this.editingTab === 'journal';
  }

  get isEditingAttachments() {
    return this.editingTab === 'attachments';
  }

  get isEditingForms() {
    return this.editingTab === 'forms';
  }

  resetTabsToDefault() {
      const defaults = {
          journal: 'Participant Journal',
          attachments: 'Attachments',
          forms: 'Forms',
          feedback: 'Feedback',
          details: 'Details',
          funds: 'Funds',
          schedule: 'Schedule',
          risk: 'Risk Profile',
          services: 'Services'
      };

      // 1️⃣ Reset UI immediately
      this.tabLabels = { ...defaults };

      // 2️⃣ Clear DB values so defaults apply
      if (this.facilityId) {
          Object.keys(defaults).forEach(tabKey => {
              saveTabPreferredName({
                  facilityId: this.facilityId,
                  tabKey,
                  preferredName: null
              }).catch(err => {
                  console.error(`Failed to reset ${tabKey}`, err);
              });
          });
      }
  }

  get isJournalActive() {
    return this.ClientJournel === true;
  }

  get isAttachmentsActive() {
    return this.attachment === true;
  }

  get isFormsActive() {
    return this.Formsflag === true;
  }

  get isEditingFeedback() {
      return this.editingTab === 'feedback';
  }

  get isFeedbackActive() {
      return this.feedback === true;
  }

  get isEditingServices() {
      return this.editingTab === 'services';
  }

  get isServicesActive() {
      return this.serviceSupportFlag === true;
  }

  get isEditingDetails() {
      return this.editingTab === 'details';
  }

  get isDetailsActive() {
      return this.detailsFlag === true;
  }

  get isEditingFunds() {
      return this.editingTab === 'funds';
  }

  get isFundsActive() {
      return this.fundTranfer === true;
  }

  get isEditingSchedule() {
      return this.editingTab === 'schedule';
  }

  get isScheduleActive() {
      return this.scheduleFlag === true;
  }

  get isEditingRisk() {
      return this.editingTab === 'risk';
  }

  get isRiskActive() {
      return this.riskFlag === true;
  }

  applyIfNotBlank(value, fallback) {
      return value !== null && value !== undefined && value !== ''
          ? value
          : fallback;
  }

  openScopeModal(event) {
      event.stopPropagation();

      if (!this.editingTab || !this.facilityId) {
          return;
      }

      const value = this.tabLabels[this.editingTab];

      // ❌ Empty validation
      if (!value || value.trim().length === 0) {
          this.dispatchEvent(
              new ShowToastEvent({
                  title: 'Invalid Tab Name',
                  message: 'Tab name cannot be empty.',
                  variant: 'error'
              })
          );
          return;
      }

      // ❌ Length validation
      if (value.length > 30) {
          this.dispatchEvent(
              new ShowToastEvent({
                  title: 'Invalid Tab Name',
                  message: 'Tab name cannot exceed 30 characters.',
                  variant: 'error'
              })
          );
          return;
      }

      // ✅ Store pending values
      this.pendingTabKey = this.editingTab;
      this.pendingTabValue = value;
      this.selectedScope = 'FACILITY'; // default
      this.showScopeModal = true;
  }

  get scopeOptions() {
      return [
          { label: 'This Facility only', value: 'FACILITY' },
          { label: 'Entire Organisation', value: 'ORG' }
      ];
  }

  handleScopeChange(event) {
      this.selectedScope = event.detail.value;
  }

  confirmScopeSave() {
      saveTabPreferredName({
          facilityId: this.facilityId,
          tabKey: this.pendingTabKey,
          preferredName: this.pendingTabValue,
          scope: this.selectedScope
      })
      .then(() => {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message:
                    this.selectedScope === 'ORG'
                        ? 'Tab name updated for the entire organisation.'
                        : 'Tab name updated for this facility.',
                variant: 'success'
            })
        );
          this.loadTabPreferredNames();

          // ✅ Commit snapshot
          this.originalTabLabels = {};

          this.showScopeModal = false;
          this.editingTab = null;
      })
      .catch(error => {
          this.dispatchEvent(
              new ShowToastEvent({
                  title: 'Error',
                  message: error?.body?.message || 'Failed to save tab name.',
                  variant: 'error'
              })
          );
      });
  }

  closeScopeModal() {
      this.showScopeModal = false;
  }
  handleBackToManageInvoiceFund(event) {
     const { fundTrackerId, cancelled,isEditFromManageInvoice } = event.detail;
    this.fundTranfer = false;
    // 2️⃣ Close Details page
    this.isVisible = false;
   // this.isPremiumClient=true;
    console.log(
        '⬅️ Details → Manage Invoice',
        { fundTrackerId, cancelled, isEditFromManageInvoice }
    );
    console.log('fundTrackerId in handleBackToManageInvoiceFund', fundTrackerId);
 
    // 3️⃣ Bubble event to parent
    this.dispatchEvent(
        new CustomEvent('backtomanageinvoice', {
            detail: {
                fundTrackerId,
                cancelled,
                isEditFromManageInvoice
            },
            bubbles: true,
            composed: true
        })
    );
}


handleParentEdit(event) {

    const childCmp = this.template.querySelector('c-client-detail');

    if(childCmp){
        childCmp.handleEditClient(event);
    }
}

handleTaskCreated(){
  this.createTask=false;
  this.ClientJournel=true;
  this.isVisible=true;
  this.jounelId='';
  this.handleclientjournal();
  this._syncRoute();
}

// MANENDRA ADDED FOR PAGINATION
updatePagination() {
    console.log('pageSize =', this.pageSize);
    this.totalRecords = this.allClientJournels.length;
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
    if (this.totalPages === 0) {
        this.totalPages = 1;
    }
    if (this.pageNumber < 1) {
        this.pageNumber = 1;
    }
    if (this.pageNumber > this.totalPages) {
        this.pageNumber = this.totalPages;
    }
    const start = (this.pageNumber - 1) * this.pageSize;
    const end = start + this.pageSize;
   // this.displayedClientJournels = this.allClientJournels.slice(start, end); // manendra modified below for table sorting
   let displayRecords = [...this.allClientJournels];
    if (this.sortField) {
        displayRecords = this.sortData(displayRecords);
    }
    this.displayedClientJournels = displayRecords.slice(start, end);
        console.log(
        'Displayed Records =',
        this.displayedClientJournels.length
    );
    this.bDisableFirst = this.pageNumber === 1;
    this.bDisableLast = this.pageNumber === this.totalPages;

  }
  handleRecordsPerPage(event) {
    console.log('Selected :', event.target.value);
    const selectedValue = event.target.value;
    if (selectedValue === 'Auto') {
        console.log('AUTO Selected');
        this.isPageSizeManuallySet = false;
        this.setPageSizeByZoomAndScreen();
    } else {
        console.log('Manual Selected');
        this.isPageSizeManuallySet = true;
        this.pageSize = parseInt(selectedValue,10);
        this.pageNumber = 1;
        this.updatePagination();

    }

}
calculateAndSizeTable(containerSelector, tableSelector, setSizeCallback) {
    this.calculateAndSetPageSize(containerSelector, tableSelector, setSizeCallback);
}

calculateAndSetPageSize(containerSelector, tableSelector, setSizeCallback) {

    const container = this.template.querySelector('.participantJournalContainer');

    if (container) {

        const containerHeight =
            container.getBoundingClientRect().height ||
            container.offsetHeight ||
            400;

        const header =
            container.querySelector(tableSelector + ' thead');

        const headerHeight =
            header
                ? (header.getBoundingClientRect().height || header.offsetHeight)
                : 40;

        const availableHeight = containerHeight - headerHeight;

        let rowHeight = 40;

        const firstRow =
            container.querySelector(tableSelector + ' tbody tr');

        if (firstRow) {
            rowHeight =
                firstRow.getBoundingClientRect().height ||
                firstRow.offsetHeight ||
                40;
        }

        let rows = Math.floor(availableHeight / rowHeight);

        if (rows < 1) {
            rows = 1;
        }

        setSizeCallback(rows);
    }
}
  previousPage() {
      if (this.pageNumber > 1) {
          this.pageNumber--;
          this.updatePagination();
      }
  }

  nextPage() {
      if (this.pageNumber < this.totalPages) {
          this.pageNumber++;
          this.updatePagination();
      }
  }

  firstPage() {
      this.pageNumber = 1;
      this.updatePagination();
  }

  lastPage() {
      this.pageNumber = this.totalPages;
      this.updatePagination();
  }
  setPageSizeByZoomAndScreen() {
      console.log('=== AUTO PAGE SIZE ===');
      console.log('Manual?', this.isPageSizeManuallySet);
      setTimeout(() => {
          if (!this.isPageSizeManuallySet) {
              this.calculateAndSetPageSize(
                  '.participantJournalContainer',
                  '.staff-table',
                  (rows) => {
                      console.log('Calculated Rows :', rows);
                      console.log('Current Page Size :', this.pageSize);
                      if (this.pageSize !== rows) {
                          console.log('Updating page size');
                          this.pageSize = rows;
                          this.pageNumber = 1;
                          this.updatePagination();

                      }

                  }
              );

          }

      },50);

  }

  handleExport() {
    this.selectedFormat = '';
    this.showFormatModal = true;
    }

    handleFormatChange(event) {
        this.selectedFormat = event.detail.value;
    }

    closeFormatModal() {
        this.showFormatModal = false;
        this.selectedFormat = '';
    }

    handleDownloadConfirm() {
        if (!this.selectedFormat) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please select an export format.',
                    variant: 'error'
                })
            );
            return;
        }
        this.showFormatModal = false;
        if (this.selectedFormat === 'CSV') {
            this.exportCSV();
        } else {

    const baseUrl = window.location.origin.replace(
        '.lightning.force.com',
        '.visual.force.com'
    );

    const url =
    `${baseUrl}/apex/ParticipantJournalPdf`
    + `?participantId=${this.recordId}`
    + `&type=${encodeURIComponent(this.selectedType)}`;

    console.log('PDF URL:', url);

    window.open(url, '_blank');
}

    }
    exportCSV() {

        let csvContent = '';

        // Report Title
        csvContent += 'Participant Activity Report\n\n';

        // Metadata
        csvContent += `Organisation,${this.orgfullname}\n`;
        csvContent += `Participant,${this.clientFullName}\n`;
        csvContent += `Filter,${this.selectedType || 'All'}\n`;
        csvContent += `Generated By,${this.name}\n`;

        const today = new Date().toLocaleDateString('en-GB');
        csvContent += `Generated On,${today}\n`;

        csvContent += `Total Records,${this.allClientJournels.length}\n\n`;

        // Table Header
        csvContent += 'Type,Description,Created By,Created On,Shift Details,History\n';

        this.allClientJournels.forEach(record => {

            let history = '';

            // Build History
            if (record.corrections && record.corrections.length > 0) {

                record.corrections.forEach(correction => {

                /*     history += `${correction.label} | `;
                    history += `Reason: ${correction.reason || ''} | `;
                    history += `Description: ${(correction.description || '').replace(/<[^>]*>/g, '')} | `;
                    history += `Updated By: ${correction.createdBy || ''} | `;
                    history += `Updated On: ${correction.modifiedOn || ''}`;
                    history += ' || '; */
                    history += [
                          correction.label,
                          `Reason: ${correction.reason || ''}`,
                          `Description: ${(correction.description || '').replace(/<[^>]*>/g, '')}`,
                          `Updated By: ${correction.createdBy || ''}`,
                          `Updated On: ${correction.modifiedOn || ''}`
                      ].join('\r\n');

                      history += '\r\n\r\n';

                });

            }

/*             const row = [

                `"${record.Care_Notes__c || ''}"`,

                `"${(record.descriptionPreview || '').replace(/"/g, '""')}"`,

                `"${record.createdname || ''}"`,

                `"'${this.formatExportDate(record.CreatedDate)}"`,

                `"${record.shiftDetails || ''}"`,

                `"${history.trim().replace(/"/g, '""')}"`

            ]; */
            
        const row = [

            this.escapeCSV(record.Care_Notes__c || ''),
            this.escapeCSV(record.descriptionPreview || ''),
            this.escapeCSV(record.createdname || ''),
           this.escapeCSV("'" + this.formatExportDate(record.CreatedDate)),
            this.escapeCSV(record.shiftDetails || ''),
            this.escapeCSV(history)

        ];
            csvContent += row.join(',') + '\n';

        });

      /*   // Download CSV
        const element = document.createElement('a');
        element.setAttribute(
            'href',
            'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent)
        );
        element.setAttribute(
            'download',
            'Participant_Activity_Report.csv'
        );
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element); */
        const BOM = '\uFEFF';

const blob = new Blob([BOM + csvContent], {
    type: 'text/csv;charset=utf-8;'
});

const url = URL.createObjectURL(blob);

const downloadElement = document.createElement('a');
downloadElement.href = url;
downloadElement.download = 'Participant_Activity_Report.csv';

document.body.appendChild(downloadElement);
downloadElement.click();

setTimeout(() => {
    document.body.removeChild(downloadElement);
    URL.revokeObjectURL(url);
}, 100);
    }
/*     formatExportDate(dateValue) {

    if (!dateValue) {
        return '';
    }

    const date = new Date(dateValue);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');

    const ampm = hours >= 12 ? 'pm' : 'am';

    hours = hours % 12;
    hours = hours || 12;

    return `${day}/${month}/${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    } */
    formatExportDate(dateValue) {

    if (!dateValue) {
        return '';
    }

    return new Intl.DateTimeFormat('en-AU', {
        timeZone: 'Australia/Sydney',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(new Date(dateValue)).replace(',', '');
}

    escapeCSV(value) {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    const stringValue = String(value);

    if (
        stringValue.includes(',') ||
        stringValue.includes('"') ||
        stringValue.includes('\n') ||
        stringValue.includes('\r')
    ) {
        return '"' + stringValue.replace(/"/g, '""') + '"';
    }

    return stringValue;
}


  _restoreJournalAction(journalUid, action) {
      console.log('[Routing] _restoreJournalAction called:', journalUid, action);
      const record = this.clientJournelList.find(r => r.Journal_UID__c === journalUid);
      if (record) {
          this.selectedJournal = record;
          this.jounelId = record.Id;
          this.description = record.Description__c || '';
          this.jNoteType = record.Care_Notes__c || '';
          
          if (action === 'view') {
              this.journalModalType = 'view';
              this.showViewModal = true;
              this.iscreateNew = false;
              this.addNew = false;
              this.createTask = false;
          } else if (action === 'edit') {
              this.addNew = true;
              this.buttonlabel = 'Save';
              this.createTask = false;
              this.showViewModal = false;
          }
      } else {
          console.warn('[Routing] No journal record found matching UID:', journalUid);
      }
  }

  handleChildSubroute(event) {
      event.stopPropagation(); // stop child event from reaching the dashboard directly
      const d = event.detail;
      const childSubView = typeof d === "string" ? d : d && (d.subView || d.path || "");
      const replace = !!(d && d.replace);

      const uid = this.participantUid;
      if (!uid) return;

      let activeTab = localStorage.getItem('activeClientTab') || 'details';
      const tabUrlSlug = TAB_TO_URL_MAP[activeTab] || activeTab;

      let subView = `${uid}/${tabUrlSlug}`;
      if (childSubView) {
          subView += `/${childSubView}`;
      }

      console.log('[Routing] detailsLwc intercepting child subrouteupdate:', childSubView, '-> dispatching:', subView);
      this.dispatchEvent(new CustomEvent('subrouteupdate', {
          detail: {
              subView,
              uid,
              recordId: this.recordId,
              replace
          },
          bubbles: true,
          composed: true
      }));
  }
// manendra added for sorting the data in table
    handleSort(event) {
        const field = event.currentTarget.dataset.field;
        if (!field) {
            return;
        }
        if (this.sortField === field) {
            this.sortDirection =
                this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        Object.keys(this.sortIcons).forEach(key => {
            this.sortIcons[key] = '';
        });
        this.sortIcons[field] =
            this.sortDirection === 'asc'
                ? 'arrow_upward'
                : 'arrow_downward';
        this.sortIcons = { ...this.sortIcons };
        this.pageNumber = 1;
        this.updatePagination();
    }
    sortData(data) {

        if (!this.sortField) {
            return [...data];
        }
        const direction = this.sortDirection === 'asc' ? 1 : -1;
        return [...data].sort((a, b) => {
            const valueA = a[this.sortField];
            const valueB = b[this.sortField];
            const emptyA =
                valueA === null ||
                valueA === undefined ||
                valueA === '' ||
                valueA === 'N/A';
            const emptyB =
                valueB === null ||
                valueB === undefined ||
                valueB === '' ||
                valueB === 'N/A';
            if (emptyA && emptyB) return 0;
            if (emptyA) return 1;
            if (emptyB) return -1;
            return (
                String(valueA).localeCompare(
                    String(valueB),
                    undefined,
                    {
                        numeric: true,
                        sensitivity: 'base'
                    }
                ) * direction
            );
        });
    }
//end
}