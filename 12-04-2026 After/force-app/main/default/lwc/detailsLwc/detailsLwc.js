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
  @track ClientJournel = false;
  @track addNew = false;
  @track createTask = false;
  @track detailsFlag = false;
  @track serviceSupportFlag = false;
  @track journelDescription = false;
  @track journelProgress = false;
  @track objectApiName = "Client__c";
  @track clientJournelList = [];
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
        this.currentUserRole == "CEO"
      );
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
      }
      if (this.userTypeValue == "NDIS Participants") {
        this.participantlogin = false;
        this.isExec = false;
        this.serviceSupportFlag = false;
      }
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
  }

  handleclientjournal(){
    listOfClientjounel({ recordId: this.recordId }).then((response) => {
      console.log('user image url2'+JSON.stringify(response));
      this.clientJournelList = [];
      this.noRecordsFlag = !(response && response.length > 0);
      response.forEach((record) => {
        let tempConRec = Object.assign({}, record);
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
            tempConRec.Staff__r.Name + " " + tempConRec.Staff__r.Last_Name__c;
        } else {
          tempConRec.createdname = tempConRec.CreatedBy.Name;
          tempConRec.picture = tempConRec.CreatedBy.SmallPhotoUrl;
        }

        console.log("user image url1 " + tempConRec.picture);
       tempConRec.corrections = [];
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

                return {
                    label: `Correction Entry ${index + 1}`,
                    reason: corr.Reason__c,
                    description: corr.Description__c,
                    notes: corr.Care_Notes__c,
                    createdBy: corr.CreatedBy?.Name,
                    modifiedOn: formattedDate // formatted date here
                };
            });
        }

        this.clientJournelList.push(tempConRec);
        console.log('FINAL RESPONSE',JSON.stringify( this.clientJournelList));
        this.allClientJournels = [...this.clientJournelList];

        refreshApex(this.clientJournelList);

        if (this.clientJournelList.length > 0) {
          this.iscreateNew = true;
        }
      });
    });
  }

  disconnectedCallback() {
    document.removeEventListener("click", this.handleOutsideClick.bind(this));
  }

  handleClick(event) {
    //this.commitEditingIfAny();
    if (this.editingTab) {
        this.tabLabels = { ...this.originalTabLabels };
        this.editingTab = null;
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
  }

  @track searchName;

  handleSearchInput(event) {
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
} 



  @track correctionflag=false;
  @track reason = "";

  handleReasonChange(event) {
    this.reason = event.target.value;
  }
  handleEdit(event) {
    event.stopPropagation();
    this.jounelId = event.currentTarget.dataset.id;
     this.Journal='Journal Correction';
    console.log('jounelId',this.jounelId);
    this.description = event.target.dataset.name;
    this.jNoteType = event.target.dataset.notestype;
    this.iscreateNew = false;
    this.correctionflag = true;
    this.reason='';
    this.addNew = true;
    this.isVisible = false;
    this.notesflag = true;
    this.buttonlabel = "Update";
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

    saveDesc({
      recordId: this.recordId,
      jounelId: this.jounelId,
      description: this.description,
      jNoteType: this.jNoteType,
      correctionReason:this.reason,
      shiftId:null
    }).then((result) => {
      if (result.includes("Created Successfully!")) {
        this.clientJournelList = [];
      /*   listOfClientjounel({ recordId: this.recordId }).then((response) => {
          this.noRecordsFlag = !(response && response.length > 0);
          response.forEach((record) => {
            let tempConRec = Object.assign({}, record);
            let today = new Date().toISOString().slice(0, 10);
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
                tempConRec.Staff__r.Name +
                " " +
                tempConRec.Staff__r.Last_Name__c;
            } else {
              tempConRec.createdname = tempConRec.CreatedBy.Name;
              tempConRec.picture = tempConRec.CreatedBy.SmallPhotoUrl;
            }
            tempConRec.corrections = [];
            if (tempConRec.Client_Journels__r && tempConRec.Client_Journels__r.length > 0) {
                tempConRec.corrections = tempConRec.Client_Journels__r.map((corr, index) => ({
                    label: `Correction Entry ${index + 1}`,
                    reason: corr.Reason__c,
                    description: corr.Description__c,
                     notes:corr.Care_Notes__c,
                    createdBy: corr.CreatedBy?.Name,
                    modifiedOn: corr.CreatedDate,
                }));
            }
            this.clientJournelList.push(tempConRec);
           
            refreshApex(this.clientJournelList);
          });
        }); */
       this.handleclientjournal();
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: "Journal created successfully.",
            variant: "success"
          })
        );
      }
      if (result.includes("Correction Created Successfully!")) {
        this.clientJournelList = [];
      /*   listOfClientjounel({ recordId: this.recordId }).then((response) => {
          response.forEach((record) => {
            let tempConRec = Object.assign({}, record);
            let today = new Date().toISOString().slice(0, 10);
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
                tempConRec.Staff__r.Name +
                " " +
                tempConRec.Staff__r.Last_Name__c;
            } else {
              tempConRec.createdname = tempConRec.CreatedBy.Name;
              tempConRec.picture = tempConRec.CreatedBy.SmallPhotoUrl;
            }
                 console.log("user image url1 " + tempConRec.picture);
                  tempConRec.corrections = [];
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

                return {
                    label: `Correction Entry ${index + 1}`,
                    reason: corr.Reason__c,
                    description: corr.Description__c,
                    notes: corr.Care_Notes__c,
                    createdBy: corr.CreatedBy?.Name,
                    modifiedOn: formattedDate // formatted date here
                };
            });
        }
            this.clientJournelList.push(tempConRec);
            refreshApex(this.clientJournelList);
          });
        }); */
       this.handleclientjournal();
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
  }

  createTaskParent() {
    this.template.querySelector("c-task-create ").createTask();
    this.createTask = false;
    this.ClientJournel = true;
    this.isVisible = true;
    this.iscreateNew = true;
  }

  closeTask() {
    this.createTask = false;
    this.ClientJournel = true;
    this.isVisible = true;
    this.iscreateNew = true;
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
      this.unavailableUntilDate = null;
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

  /* handleUnavailableUntilChange(event) {
        this.unavailableUntilDate = event.target.value;
        console.log('Unavailable Until Date:', this.unavailableUntilDate);
    } */

  handleUnavailableUntilChange(event) {
    console.log("🟢 [handleUnavailableUntilChange] START");

    // ✅ Skip validation if popup is closing
    if (this.isClosingPopup) {
        console.log("🚫 Popup is closing — skipping date validation and toast.");
        return;
    }

    // Capture and log raw value
    this.unavailableUntilDate = event.target.value;
    console.log("📅 Raw Unavailable Until Date (from input):", this.unavailableUntilDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = this.unavailableUntilDate ? new Date(this.unavailableUntilDate) : null;
    if (selectedDate) selectedDate.setHours(0, 0, 0, 0);

    this.isSaveDisabled = false;

    // Check if no date is selected
    if (!selectedDate || isNaN(selectedDate.getTime())) {
        console.log("❌ No valid date selected.");

        this.unavailableUntilDate = null;
        this.isSaveDisabled = true;
        // ❌ Don't show toast here — toast will only be shown during Save
        return;
    }

    // Check if selected date is in the past
    if (selectedDate < today) {
        console.log("⚠️ Invalid date: earlier than today.");
        this.unavailableUntilDate = null;
        this.isSaveDisabled = true;
        // ❌ Skip toast here too
        return;
    }

    console.log("✅ Valid date selected.");
  }



  handlesavebuttonforParticipantPopup() {
    console.log("handleSave executing >>");
    console.log(
      "isAvailable: " +
        this.isAvailable +
        " isUnavailable: " +
        this.isUnavailable +
        " Client Id: " +
        this.recordId +
        " medications: " +
        this.medications +
        " allergies: " +
        this.allergies +
        " notes: " +
        this.notes +
        "Date: " +
        this.unavailableUntilDate
    );
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    console.log(formattedDate); // e.g., "2025-05-14"

    if (this.isUnavailable == true && this.unavailableUntilDate == null) {
      const date = this.template.querySelector('[data-id="date"]');
      date.reportValidity(); // shows “Complete this field”

      /* this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please select Unavailable Until Date',
                    variant: 'error'
                })
            ); */
      return;
    }
    saveStatusData({
      isAvailable: this.isAvailable,
      isUnavailable: this.isUnavailable,
      clientId: this.recordId,
      medications: this.medications,
      allergies: this.allergies,
      notes: this.notes,
      unavailableDate: this.unavailableUntilDate
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
      });

    if (this.isUnavailable === true && this.unavailableUntilDate == null) {
      const date = this.template.querySelector('[data-id="date"]');
      date.reportValidity();

      this.dispatchEvent(
          new ShowToastEvent({
              title: 'Error',
              message: 'Please select Unavailable Until Date',
              variant: 'error'
          })
      );
      return;
  }
  }
  // handleParentEdit() {
  //   console.log("Parent: Edit icon clicked, trying to call child method");

  //   const child = this.template.querySelector("c-client-detail");
  //   if (child) {
  //     console.log("Parent: Found child component, invoking handleEditClient");
  //     child.handleEditClient();
  //   } else {
  //     console.error("Parent: Could not find <c-client-detail> in template");
  //   }
  // }
  handleHideFacilityEvent(event) {
    const forward = new CustomEvent("hidefacilityevent", {
      detail: event.detail,
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(forward);
  }

  handleEditTab(event) {
    const tab = event.currentTarget.dataset.tab;

    // 🔒 Take snapshot only once per edit
    this.originalTabLabels = {
        ...this.tabLabels
    };

    this.editingTab = tab;
    console.log("Editing tab:", this.editingTab);
  }

  handleTabNameChange(event) {
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
     const { fundTrackerId, cancelled } = event.detail;
    this.fundTranfer = false;
    // 2️⃣ Close Details page
    this.isVisible = false;
   // this.isPremiumClient=true;
    console.log(
        '⬅️ Details → Manage Invoice',
        { fundTrackerId, cancelled }
    );
    console.log('fundTrackerId in handleBackToManageInvoiceFund', fundTrackerId);
 
    // 3️⃣ Bubble event to parent
    this.dispatchEvent(
        new CustomEvent('backtomanageinvoice', {
            detail: {
                fundTrackerId,
                cancelled
            },
            bubbles: true,
            composed: true
        })
    );
}

}