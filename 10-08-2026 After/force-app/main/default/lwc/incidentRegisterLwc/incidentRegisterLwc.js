import { LightningElement,track, wire,api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation'; 
import searchIssues from '@salesforce/apex/issueRegisterSearch.searchIssues';
import FORM_FACTOR from '@salesforce/client/formFactor';
import { refreshApex } from '@salesforce/apex';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getIssues from '@salesforce/apex/issueRegisterSearch.getIssues';
import {registerRefreshHandler, unregisterRefreshHandler} from 'lightning/refresh';
import saveCaseRecord from '@salesforce/apex/issueRegisterSearch.saveCaseRecord';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import fetchClient from '@salesforce/apex/ClientDataController.fetchFacilitiessforissueregister';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import updateCaseRecord from '@salesforce/apex/issueRegisterSearch.updateCaseRecord';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import UserOrgName from '@salesforce/schema/User.Organization_Name__c';
import UserType from '@salesforce/schema/User.User_Type__c';
import FirstName from '@salesforce/schema/User.FirstName'; 
import LastName from '@salesforce/schema/User.LastName';//LastName
import UserEmail from '@salesforce/schema/User.Email';
import { getRecord,getFieldValue  } from 'lightning/uiRecordApi';
import Id from '@salesforce/user/Id';
import getStaffByEmail from '@salesforce/apex/StaffController.getStaffByEmail';
import getEmployeeData from '@salesforce/apex/issueRegisterSearch.getEmployeeData';
import getUserDetails from '@salesforce/apex/issueRegisterSearch.getUserDetails';
import getIssuesbyId from '@salesforce/apex/issueRegisterSearch.getIssuesbyId';
import My_Resource from "@salesforce/resourceUrl/myResource";
import { loadScript } from "lightning/platformResourceLoader";
import jsPDF from '@salesforce/resourceUrl/jspdf';
import getImageAsBase64 from '@salesforce/apex/issueRegisterSearch.getImageAsBase64';
import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';
import getFacilityCurrentUser from '@salesforce/apex/PortalUserController.getFacilityCurrentUser';
import getCaseHistoryLog from '@salesforce/apex/issueRegisterSearch.getCaseHistoryLog';
import getIncidents from '@salesforce/apex/issueRegisterSearch.getIncidents';


const actions = [   
    { label: 'Edit', name: 'edit' }    
 ];

const columns = [ 
         
    { label: 'Incident Number',fieldName: 'CaseNumber'}, //,type: 'url', typeAttributes: {label: { fieldName: 'CaseNumber' }, target: '_Blank'}
    //{ label: 'Type', fieldName: 'Description'},       
    { label: 'Participant Name', fieldName: 'Client_Name__c'  }, //type: 'url',typeAttributes: { label: { fieldName: 'ClientName' }, target: '_Blank'}
    { label: 'Facility Name', fieldName: 'Facility_Name__c'  },
    { label: 'Priority', fieldName: 'Priority'},
    { label: 'Created on', fieldName: 'CreatedDate',type: 'date',
         typeAttributes:
        {
            month: "2-digit",day: "2-digit",year: "numeric"
        }},
    //{ label: 'Finalised on', fieldName: 'ClosedDate'},   
    { label: 'Status', fieldName: 'Status_1__c'},  
    { type: 'action', label: 'Action',   initialWidth: 80, typeAttributes: {rowActions: actions,} } 
];

export default class IncidentRegisterLwc extends LightningElement {
    @track currentUserRole; 
    @track isStaff=false; 
    @track isOrgName
    @track searchID='';
    @track facilityName='';
    @track clientName='';
    @track submittedBy='';
    @track availableIssues;
    @track refreshTable=[];
    @track initialRecords;
    error;
    columns = columns;
    searchString;
    totalRecords=0;
    @track pageSize;
    pageNumber = 1;
    @track headeringName;
    @track isOpenModal = false;
    @track buttonName ='';
    @track recordId;

    @track selectedFilesToUpload;
    @track fileName = '';
   // @track UploadFile = 'Upload CSV File';
    @track showLoadingSpinner = false;
    @track filesUploaded = [];
    @track fileContents;
    @track fileReader;
    @track content;
    MAX_FILE_SIZE = 1500000;
    @track fileType;
    @track fileSize;
    @track showSpinner;
    @track fileReaderObj;
    @track myFile;     
    @track refreshHandlerID;
    @track JSONData={};
    @track noRecordsFlag=false;
    @track selectedDate;
    @track todayCssVariable;
    @track typeOfIssue = 'Own Org';
    @track issueparent=true;
    @track currentStep = 'step1';    
    @track orgId;
    @track orgname;
    @track clientOption = [];
    @track clientLength;
    @track clientVal;
    @track clientLabel;
    @track clientLabel1;
    @track firstName;
    @track lastName;
    @track role;
    @track email;
    @track phone;
    @track facilityName;
    @track priority1;
    @track client;
    isFormSaved=false;
    @track facilityOptions=[];
    @track facilityVal;
    @track faclitylabel;
    @track faclitylabel1;
    @track  priorityValue = 'High';
    @track raisedByValue = '';
    @track issueTypeValue = 'Unreasonable use of force';
    @track status = 'Open';
    @track incidentDateTime;
    @track allegedDateTime;
    description = '';
    isFormSaved2=false;
    @track reportedToPolice = 'No';
    @track clientConcerns = 'No';
    @track showPoliceComments = false;
    @track policeComments;
    @track actionsTaken;
    @track additionalInfo;
    @track futureActions;
    isFormSaved3=false;
    @track isEdit=false;
    @track formatincidentDateTime;
    @track viewfileName='';
    @track incidentDate='';
    @track incidentTime='';
    @track UIincidentDateTime='';
    @track allegedDate;
    @track allegedTime;
    @track viewflag=true;
    @track showOtherDescription=false;
    @track others;
    @track options = [];
    @track reporterName ='';
    @track partcipantValue;
    @track subContractor;
    @track facilityName1;
    @track client1;
    @track userEmail='';
    @track staffName;
    @track userFName;
    @track userLName;
    @track activeSections = ['ReporterDetails', 'IncidentDetails', 'ActionTaken'];

    @track OrgNisationRoles=[];
    @track organisationId;
    @track chosenRole=[]; 
    @track rolesArray=[];
    @track userContactNum;
    @track blobData;
    @track ClientFacilityJson={};
    isListening = false; 
    showMuteIcon = false; 
    showClearIcon = false; 
    recognition;

    Issue = My_Resource+'/myResource/images/IncidentRegister.png';
    pdficon = My_Resource+'/myResource/images/pdficon.png';

    @track status;
    @track selectedResponseId;
    @track historyLog = [];
    @track designation;
    @track name;
    @track canvasInitialized;

    @track startTimeSelectedHour1;
    @track startTimeSelectedMinute1;
    @track startTimeAMPM1;
   
    renderedCallback() {
        Promise.all([
            loadScript(this, jsPDF).then(() => {
               // console.log("JS loaded jsPDF");
            }).catch(error => {
               // console.error("Error " + error);
            })
        ]);
        if (this.canvasInitialized) return;
        this.canvas = this.template.querySelector('canvas.signature-canvas');
    if (this.canvas) {
        this.context = this.canvas.getContext('2d');
        this.resizeCanvas();

        this.context.strokeStyle = '#000';
        this.context.lineWidth = 2;

        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseleave', this.stopDrawing.bind(this));

        this.canvas.addEventListener('touchstart', this.startDrawing.bind(this));
        this.canvas.addEventListener('touchmove', this.draw.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
        this.canvasInitialized = true;
    }
    }



    @track sectionFlags = {
        ReporterDetails: true,
        IncidentDetails: true,
        ActionTaken: true,
    };
    
    // Icons for the toggle buttons
    @track sectionIcons = {
        ReporterDetails: '\u2B9F', 
        IncidentDetails: '\u2B9F',
        ActionTaken: '\u2B9F',
        
    };
    handleSectionToggle(event) {
        const sectionId = event.currentTarget.dataset.id;
        const sectionElement = this.template.querySelector(`[data-section="${sectionId}"]`);
    
        if (!this.sectionFlags[sectionId]) {
            // First click: Set the section to true so it loads in the DOM
            this.sectionFlags[sectionId] = true;
        } else {
            // From second click onwards: Just toggle the hidden-section class
            sectionElement.classList.toggle('hidden-section');
        }
    
        // Toggle the icon dynamically
        this.sectionIcons[sectionId] = sectionElement.classList.contains('hidden-section') ? '\u2B9C' : '\u2B9F';
    }

    @track userTypevalueforcurrentlogin;
    @track facilityValuefromcatch;
    @track facilityLabelfromcatch;

    @track userTypevalueforcurrentlogin;
    @track loggedInUserId;
    @track loggedInFacilityId;
    @track pageSizeOptions = [10, 25, 50, 75, 100];
    @track staffid;
    
    connectedCallback(){

        const storedFacilityId = localStorage.getItem('defaultFacilityId');
        const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');

        console.log('storedFacilityId >>', storedFacilityId);
        console.log('storedFacilityLabel >>', storedFacilityLabel);
        window.addEventListener('keydown', this.handleKeyShortcut.bind(this));

        if (storedFacilityId && storedFacilityLabel) {
            this.facilityValuefromcatch = storedFacilityId;
            this.facilityLabelfromcatch = storedFacilityLabel;
        }

        this.disableRightClick();
        this.disableShortcuts(); 
       
        this.totalRecords=0;
        this.rec = true;
        

        organizationDetails().then(response => {

           //console.log('calling response', JSON.stringify(response));
            let orgId = response.listofPriceBook.Id;
            this.blobData =response.bolbdata;
            
          //  this.orgId = response.listofPriceBook.Id;
            this.organisationId = orgId; 
            let orgRoles= response.listofPriceBook.Roles__c;
            //console.log('listofPriceBook:', response.listofPriceBook);
          /*   this.OrgNisationRoles = orgRoles.split(";").sort().map(rec => {
                return {
                value: rec,
                label: rec
                };
            }); */
            //this.chosenRole.push( this.OrgNisationRoles[0].value);
           // this.activeSection=this.chosenRole
           // console.log('org roles '+ JSON.stringify(this.OrgNisationRoles));

            this.orgId = response.listofPriceBook.Id;
            this.orgname = response.listofPriceBook.Name; 
            if(this.orgId != null){
                fetchClient({recordId: this.orgId, firstname: null, lastname: null, facilityid: this.facilityValuefromcatch}).then(response=>{
                    console.log('Client Data>>'+JSON.stringify(response));
                    this.clientOption=[];

                    this.clientOption = response.map(record => ({ 
                        value: record.Id,
                         label: record.Display_Nickname__c ,
                         facility: record.Facility__c
                        }));
                  
                    let clientLength=Object.keys(this.clientOption).length;
                   // console.log('client length'+clientLength);
                   // console.log('client first value'+this.clientOption[0].value);
                    this.clientVal=this.clientOption[0].value;
                    this.client=this.clientOption[0].value;
                    console.log('Client'+JSON.stringify(this.client));
                   // console.log('client first value'+this.clientOption[0].label);
                    this.clientLabel=this.clientOption[0].label;
                    this.clientLabel1 = this.clientOption[0].label;
                });
            }
           // console.log('orgId>>>>', this.orgId);
           // this.fetchIssues();
        });

        // fetch user details first
        getCurrentLoggedUserInfo().then(data => {
            this.userTypevalueforcurrentlogin = data.User_Type__c;
            this.loggedInUserId = data.Id;
            this.loggedInFacilityName = data.Facility_Name__c;

            
        })
        .then(data => {
            //this.handleResponseData(data);
            this.getissues();
        })
        .catch(error => {
            this.error = error;
            console.error('Error fetching incidents:', error);
        });

        this.newIssueDetails();
        this.getFacilityValues();
        this.getStaffValues();
       
    }

    disconnectedCallback() {
    window.removeEventListener('keydown', this.handleKeyShortcut.bind(this));
   }

    disableRightClick() {
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
    }

    disableShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Prevent F12 (Inspect), Ctrl+Shift+I (Inspect), Ctrl+Shift+C (Element picker), and Ctrl+Shift+J (Console)
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                (e.ctrlKey && e.shiftKey && e.key === 'K')
            ) {
                e.preventDefault();
            }
        });
    }


    @wire(getRecord, { recordId: Id, fields: [UsrRoleName,UserOrgName,UserType,UserEmail,FirstName,LastName]}) 
    currentUserInfo({error, data}) {
       // console.log('userid',Id);
       // console.log('data',JSON.stringify(data));
       // console.log('error',JSON.stringify(error)); 
        if (data) {
            this.currentUserRole =data.fields.User_Role__c.value;
            this.isOrgName = data.fields.Organization_Name__c.value;
            this.userEmail = data.fields.Email.value;
            this.FName = data.fields.FirstName.value;
            this.LName = data.fields.LastName.value;
            console.log('User First Name >> '+ this.FName);
            console.log('User Last Name >> '+ this.LName);
            // console.log('User First Name >> '+ this.userFName);
            // console.log('User Last Name >> '+ this.userLName);
            
            this.fetchUserRoles();
           // console.log('current logged in user==>'+this.currentUser) ; 
            console.log('User EMail ==>'+this.userEmail) ; 
            if(this.currentUserRole =='Portal Account Partner Executive' || this.currentUserRole =='CEO' || this.currentUserRole =='Admin' ||this.currentUserRole =='Portal Account Partner Manager'){
                this.isStaff = true;
            } else if(this.currentUserRole =='Portal Account Partner User'){
                this.isStaff = false;
            }
        } else if (error) {
            this.usererror = error ;
        }
    }

    @track options=[];

    get designationOptions() {
    return [
        { label: 'Org Admin', value: 'Org Admin' },
        { label: 'Facility Admin', value: 'Facility Admin' },
        { label: 'Roster Manager', value: 'Roster Manager' },
        { label: 'Staff', value: 'Staff' },
        { label: 'HR', value: 'HR' }
    ];
   }
    
/*     fetchUserRoles() {
        getStaffByEmail({ email: this.userEmail }).then(response => {
           console.log('Response is >> ' + JSON.stringify(response)); 
            // Assuming you're working with the first element in the array
           this.staffid =response[0].Id;
           console.log('stafid',this.staffid);
            if (response && response.length > 0 && response[0].Role__c) {
                const userData = response[0];  // Get the first element from the response array                
                console.log('Role__c is >> ' + userData.Role__c);
                // Split role string by semicolon and set the combobox value
                this.rolesArray = userData.Role__c.split(';').map(r => r.trim());
                 this.options = this.rolesArray.map(role => ({
                    label: role,
                    value: role
                }));
                console.log('=== Combobox options ===');
                console.log(JSON.stringify(this.options));
               // this.role = response.Role__c ? response.Role__c.split(';') : [];
                this.role = this.options.length > 0 ? this.options[0].value : null; // Assuming you want to select the first role as default
                console.log('=== UI Combobox value (this.role) ===');
                console.log(this.role);
                 console.log('ROLE ARRAY',JSON.stringify(this.rolesArray));
               // this.options = this.rolesArray.map(role => ({ label: role, value: role }));
               this.userContactNum=userData.Contact_Number__c?userData.Contact_Number__c:'';
               console.log('user Contact num '+this.userContactNum);
                //console.log('Roles are >> ' + JSON.stringify(this.role));
            } else {
                console.warn('Role__c is missing or undefined in the response.');
            }
        })
        .catch(error => {
            console.error('Error fetching roles: ' + error);
        });
    } */
fetchUserRoles() {
    getStaffByEmail({ email: this.userEmail })
        .then(response => {
            const userData = response[0];
            this.staffid = userData.Id;

            // NEW: Use StaffRoles__r instead of Role__c
            if (userData.StaffRoles__r && userData.StaffRoles__r.length > 0) {
                // Filter only active roles
                const activeRoles = userData.StaffRoles__r
                    .filter(r => r.Active__c)
                    .map(r => r.RoleName__c);

                console.log('Active Roles >>> ', JSON.stringify(activeRoles));

                // Populate combobox
                this.options = activeRoles.map(r => ({
                    label: r,
                    value: r
                }));

                console.log('=== Combobox options ===');
                console.log(JSON.stringify(this.options));

                // Set default (first active role)
                this.role = this.options.length > 0 ? this.options[0].value : null;

                console.log('Selected Role >>> ', this.role);
            } else {
                console.warn('No active StaffRoles__r found.');
            }

            this.userContactNum = userData.Contact_Number__c || '';
        })
        .catch(error => {
            console.error('Error fetching roles: ' + error);
        });
}


    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }

    @track value;
    get optionsStatus() {
        return [
            { label: 'Open', value: 'Open' },
            { label: 'In-Progress', value: 'In-Progress' },
            { label: 'Resolved', value: 'Resolved' }
        ];
    }

    handleChangeStatus(event) {
        this.status = event.detail.value;
        console.log(this.status)
    }

    @track valuePriority;
    get optionsPriority(){
        return[
            { label: 'High', value: 'High' },
            { label: 'Medium', value: 'Medium' },
            { label: 'Low', value: 'Low' }
        ];
    }

    @track assignTo;
    handleResponseData(responseValue) {
        if (responseValue) {
            let filteredRecords = [];

            if (this.userTypevalueforcurrentlogin === 'NDIS Org Admin' || this.userTypevalueforcurrentlogin === 'Facility Admin' || this.userTypevalueforcurrentlogin === 'Roster Manager' || this.userTypevalueforcurrentlogin === 'HR Admin' ) {
                // Show ALL records
                  filteredRecords = responseValue.filter(
                    rec => rec.Facility__c === this.facilityValuefromcatch
                );
            } /* else if (this.userTypevalueforcurrentlogin === 'Facility Admin') {
                // Show only facility records
                filteredRecords = responseValue.filter(
                    rec => rec.Facility__c === this.facilityValuefromcatch
                );
            } */ else if (this.userTypevalueforcurrentlogin === 'NDIS Staff') {
                // Show only records created by current logged-in user
                filteredRecords = responseValue.filter(
                    rec => rec.CreatedById === this.loggedInUserId
                );
            }

            // ✅ Map only filtered records
            this.initialRecords = filteredRecords.map(record => {
                let createdDate = new Date(record.CreatedDate);
                let day = String(createdDate.getDate()).padStart(2, '0');
                let month = String(createdDate.getMonth() + 1).padStart(2, '0');
                let year = createdDate.getFullYear();
                let formattedDate = `${day}/${month}/${year}`;
                let isResolved = record.Status_1__c === 'Resolved';

                return {
                    ...record,
                    date: formattedDate,
                    incidentId: `/${record.Id}`,
                    ClientName: record.Client_Name__c,
                    clientURL: `/${record.Client__c}`,
                    FacilityName: record.Facility_Name__c,
                    facilityURL: `/${record.Facility__c}`,
                    caseNumber: record.CaseNumber,
                    status: record.Status_1__c,
                    reporterName: (record.First_Name__c || '') + ' ' + (record.Last_Name__c || ''),
                    assignTo: record.Assign_to_1__r ? record.Assign_to_1__r.NameToDisplay__c : '',
                    priority: record.Priority,
                    isResolved: isResolved
                };
            });

            this.totalRecords = this.initialRecords.length;
            this.rec = this.totalRecords > 0;
            this.pageSize = 10;
            this.visible = this.totalRecords > 5;
            this.error = undefined;

            this.paginationHelper();
        }
    }

   /*  handleResponseData(responseValue) {
        if (responseValue) {
            let filteredRecords = [];

            if (this.userTypevalueforcurrentlogin === 'NDIS Org Admin') {
                // ✅ Show ALL records
                filteredRecords = responseValue;
            } else if (this.userTypevalueforcurrentlogin === 'Facility Admin') {
                // ✅ Show only facility records
                filteredRecords = responseValue.filter(
                    rec => rec.Facility__c === this.loggedInFacilityName
                );
            } else if (
                this.userTypevalueforcurrentlogin === 'Roster Manager' ||
                this.userTypevalueforcurrentlogin === 'NDIS Staff'
            ) {
                // ✅ Show only assigned to current user
                filteredRecords = responseValue.filter(
                    rec => rec.CreatedById === this.loggedInUserId
                );
            }
            this.initialRecords = responseValue.map(record => {
                // Convert CreatedDate to dd-mm-yyyy format
                let createdDate = new Date(record.CreatedDate);
                let day = String(createdDate.getDate()).padStart(2, '0');
                let month = String(createdDate.getMonth() + 1).padStart(2, '0'); // Months are 0-based
                let year = createdDate.getFullYear();
                let formattedDate = `${day}-${month}-${year}`; // Format: dd-mm-yyyy
                let isResolved = record.Status_1__c === 'Resolved';
                // Return the transformed record
                return {
                    ...record,
                    date: formattedDate,
                    incidentId: `/${record.Id}`,
                    ClientName: record.Client_Name__c,
                    clientURL: `/${record.Client__c}`,
                    FacilityName: record.Facility_Name__c,
                    facilityURL: `/${record.Facility__c}`,
                    caseNumber: `/${record.CaseNumber}`,
                    status: `/${record.Status_1__c}`,
                    reporterName: record.First_Name__c + ' ' +record.Last_Name__c,
                    assignTo: record.Assign_to_1__r.NameToDisplay__c,
                    priority: record.Priority, //reporterName
                    isResolved:isResolved
                };
            });
    
            this.totalRecords = responseValue.length;
            if(this.totalRecords.length>0){
                this.rec = true;
            }
            this.pageSize = 5;
    
            if (this.totalRecords > 5) {
                this.visible = true;
            }
    
            this.error = undefined;
            this.paginationHelper();
        }
    } */
    @track rec= false;
    /*getissues(){
        let listOfsearchString=[];
        searchIssues({listOfsearchString: JSON.stringify(listOfsearchString), typeofIssue:this.typeOfIssue})
            .then(response=>{
                this.refreshTable = response;                       
                this.handleResponseData(response);
                refreshApex(this.refreshTable);
                 console.log('JSON1 Data>>'+JSON.stringify(response));
                response.forEach(rec=>{
                    let isResolved = rec.Status_1__c === 'Resolved';
                    this.JSONData[rec.Id]={"typeOfIssue":rec.Type_of_Issue__c,"firstName":rec.First_Name__c,"others":rec.Allegation_description__c,"lastName":rec.Last_Name__c,"caseNumber":rec.CaseNumber,
                "client":rec.Client__c,"facilityName":rec.Facility__c,"email":rec.Email__c,"phone":rec.Phone_Number__c,"role":rec.Role__c,"status":rec.Status_1__c,
                "priorityValue":rec.Priority,"raisedByValue":rec.Allegation__c,"issueTypeValue":rec.Revelant_Issue_Type__c,"incidentDateTime":rec.Date_and_Time_Incident__c,"allegedDate":rec.Alleged_Date__c,"allegedTime":rec.Alleged_Time__c,"description":rec.Description,"incidentdate":rec.Date_of_Incident__c,"incidenttime":rec.Incident_Time__c,
                "reportedToPolice":rec.Reported_to_the_Police__c,"policeComments":rec.Police_Comments__c,"clientConcerns":rec.Regarding_the_Issue__c,"actionsTaken":rec.Description1__c,"additionalInfo":rec.Description2__c,"futureActions":rec.Description3__c,"fileName":rec.Amazon_URL__c,
                "partcipantValue":rec.Participant_Representative__c,"subContractor":rec.Sub_Contractor__c,"client1":rec.Participant_Name__c,"facilityName1":rec.Facility_Name_1__c,"staffName":rec.Assign_to__c,"staffName1":rec.Assign_to_1__c,"mostReleventOthers":rec.Most_Relevant_Others__c,"isResolved": isResolved }
                });
                 console.log('JSON Data>>'+JSON.stringify(this.JSONData));
                if(response){
                    this.noRecordsFlag= false;
                }else{
                    this.noRecordsFlag = true;
                }  
        }).catch(err => {
           // console.log('Oh noooo!!');
        }); 
      
    }*/

    @track currentLoggedId;
    getissues() {
        let listOfsearchString = [];

        getCurrentLoggedUserInfo().then((userInfo) => {
            this.userTypevalueforcurrentlogin = userInfo.User_Type__c;
            console.log('this.userTypevalueforcurrentlogin >>', this.userTypevalueforcurrentlogin);
            console.log('User info data :'+JSON.stringify(userInfo));
            this.currentLoggedId = userInfo.Id;
            console.log('CurrentLoggedId :'+this.currentLoggedId);
            return searchIssues({
                listOfsearchString: JSON.stringify(listOfsearchString),
                typeofIssue: this.typeOfIssue
            });
        }).then(response => {
            console.log('Raw response:', response);
            console.log('Current User Type:', this.userTypevalueforcurrentlogin);

            let filteredResponse = [];

            // ✅ Filter based on user type
            if (this.userTypevalueforcurrentlogin === 'NDIS Org Admin') {
                filteredResponse = response.filter(
                    rec => rec.Facility__c === this.facilityValuefromcatch // or use staffFacilityId
                );
            } else if (this.userTypevalueforcurrentlogin === 'Facility Admin'|| this.userTypevalueforcurrentlogin === 'Roster Manager' || this.userTypevalueforcurrentlogin === 'HR Admin') { //|| this.userTypevalueforcurrentlogin === 'Roster Manager' || this.userTypevalueforcurrentlogin === 'NDIS Staff'
                console.log('this.facility for catch :'+JSON.stringify(this.facilityValuefromcatch));
                filteredResponse = response.filter(
                    rec => rec.Facility__c === this.facilityValuefromcatch // or use staffFacilityId
                );
            } else if(this.userTypevalueforcurrentlogin === 'NDIS Staff') {
                filteredResponse = response.filter(
                    rec => rec.CreatedById === this.loggedInUserId 
                    
                );
            }
                else{
                console.warn('User type not recognized for access:', this.userTypevalueforcurrentlogin);
                filteredResponse = [];
            }

            // ✅ Assign filtered data
            this.refreshTable = filteredResponse;
            console.log('refreshtable : '+JSON.stringify(this.refreshTable));
            this.handleResponseData(filteredResponse);
            refreshApex(this.refreshTable);

            // ✅ Map to JSONData
            this.JSONData = {}; // clear previous
            filteredResponse.forEach(rec => {
                const isResolved = rec.Status_1__c === 'Resolved';
                this.JSONData[rec.Id] = {
                    typeOfIssue: rec.Type_of_Issue__c,
                    firstName: rec.First_Name__c,
                    others: rec.Allegation_description__c,
                    lastName: rec.Last_Name__c,
                    caseNumber: rec.CaseNumber,
                    client: rec.Client__c,
                    facilityName: rec.Facility__c,
                    email: rec.Email__c,
                    phone: rec.Phone_Number__c,
                 //   role: this.role,
                    role:  rec.StaffRole__c ?  rec.StaffRole__c : rec.Role__c,
                    status: rec.Status_1__c,
                    priorityValue: rec.Priority,
                    raisedByValue: rec.Allegation__c,
                    issueTypeValue: rec.Revelant_Issue_Type__c,
                    incidentDateTime: rec.Date_and_Time_Incident__c,
                    allegedDate: rec.Alleged_Date__c,
                    allegedTime: rec.Alleged_Time__c,
                    description: rec.Description,
                    incidentdate: rec.Date_of_Incident__c,
                    incidenttime: rec.Incident_Time__c,
                    reportedToPolice: rec.Reported_to_the_Police__c,
                    policeComments: rec.Police_Comments__c,
                    clientConcerns: rec.Regarding_the_Issue__c,
                    actionsTaken: rec.Description1__c,
                    additionalInfo: rec.Description2__c,
                    futureActions: rec.Description3__c,
                    fileName: rec.Amazon_URL__c,
                    partcipantValue: rec.Participant_Representative__c,
                    subContractor: rec.Sub_Contractor__c,
                    client1: rec.Participant_Name__c,
                    facilityName1: rec.Facility_Name_1__c,
                    staffName: rec.Assign_to__c,
                    staffName1: rec.Assign_to_1__c,
                    mostReleventOthers: rec.Most_Relevant_Others__c,
                    signature:rec.Signature__c,
                    designation:rec.Designation__c,
                    reviewername:rec.Reviewer_Name__c,
                    isResolved: isResolved
                };
            });

            // ✅ Handle empty result
            //this.noRecordsFlag = filteredResponse.length === 0;

            console.log('Final JSONData >>', JSON.stringify(this.JSONData));
        })
        .catch(error => {
            console.error('Error in getissues():', error);
        });
    }



    // Helper function to format date to dd-mm-yyyy
    formatDateToDDMMYYYY(createdDate) {
        const date = new Date(createdDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }
    handleRecordsPerPage(event) {
        this.pageSize = event.target.value;
        this.paginationHelper();
    }
    previousPage() {
        this.pageNumber = this.pageNumber - 1;
        this.paginationHelper();
    }
    nextPage() {
        this.pageNumber = this.pageNumber + 1;
        this.paginationHelper();
    }
    firstPage() {
        this.pageNumber = 1;
        this.paginationHelper();
    }
    lastPage() {
        this.pageNumber = this.totalPages;
        this.paginationHelper();
    }
    get isDesktop() {
        //alert(FORM_FACTOR);
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        return FORM_FACTOR === 'Small';
    }
    paginationHelper() {
        this.availableIssues = [];
        if(this.totalRecords>0) {
            this.noRecordsFlag=false;
        }else{
            this.noRecordsFlag=true;
        } 
       // console.log('Pagination data >> '+ JSON.stringify(this.initialRecords));
        // calculate total pages
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        // set page number 
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
        // set records to display on current page 
        let tempconList=[];
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
                break;                
            }     
            let tempConRec = Object.assign({}, this.initialRecords[i]);
           
            tempconList.push(tempConRec);        
           // this.availableIssues.push(this.initialRecords[i]);           
        }  
        this.availableIssues = tempconList;     
        console.log('Pagination data1 >> '+ JSON.stringify(this.availableIssues));
    }

    handleClear(){
        let listOfsearchString=[];
        this.searchID='';
        this.facilityName='';
        this.clientName='';
        this.submittedBy='';
        this.value = '';
        this.valuePriority='';
        searchIssues({listOfsearchString: JSON.stringify(listOfsearchString), typeofIssue:this.typeOfIssue})
                    .then(response=>{
                       // console.log('285 Status>>>'+JSON.stringify(response));
                        this.refreshTable = response;
                        this.handleResponseData(response);
                        refreshApex(this.refreshTable);                      
        });        
    }

    handleSearch(event){
       // console.log(event.target.label);
        var inp=this.template.querySelectorAll("lightning-input");
        var combobox = this.template.querySelector("lightning-combobox[name='status']");
        let listOfsearchString=[];
        
        inp.forEach(function(element){
            listOfsearchString.push(element.value)
            if(element.name=="searchID"){
                this.searchID=element.value;
                console.log('CaseNumber :'+this.searchID);
            }
             else if(element.name=="facilityName"){
                this.facilityName=element.value; 
            }
            else if(element.name=="clientName"){
                this.clientName=element.value;
            }
             else if(element.name=='status'){
                this.value = element.value;
            } 
            else if(this.value != null){
                listOfsearchString.push(this.value);
            } 
            else if(this.valuePriority != priority){
                listOfsearchString.push(this.valuePriority);
            }
            
        },this);
        
       // console.log('Search String>>>'+listOfsearchString);
        searchIssues({listOfsearchString: JSON.stringify(listOfsearchString), typeofIssue:this.typeOfIssue})
                    .then(response=>{
                        this.refreshTable = response;
                        this.handleResponseData(response)
        });
    } 

    navigatetoHome() {
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                pageName: 'home'
            },
        });
    } 
    triggerFileInput() {
        this.template.querySelector('input[type="file"]').click();
    }  

    onFileUpload(event) {        
        //this.isEdit=false;        
       // console.log('in files upload',event.target.files.length);
        if (event.target.files.length > 0) {
            this.showSpinner = true;
            this.selectedFilesToUpload = event.target.files;      
            this.file = this.selectedFilesToUpload[0];
            this.fileName = this.selectedFilesToUpload[0].name.split(" ").join("");
            this.fileType = this.selectedFilesToUpload[0].type;
            this.fileSize = this.selectedFilesToUpload[0].size;     
            
            if (this.file.size > this.MAX_FILE_SIZE || this.file.size < this.MIN_FILE_SIZE) {  
                this.isattachError=true;
            }
            //create an intance of File
            this.fileReaderObj = new FileReader();

            //this callback function in for fileReaderObj.readAsDataURL
            this.fileReaderObj.onloadend = (() => {        
                //get the uploaded file in base64 format
                let fileContents = this.fileReaderObj.result;
                fileContents = fileContents.substr(fileContents.indexOf(',')+1);
                
                //read the file chunkwise
                let sliceSize = 1024;           
                let byteCharacters = atob(fileContents);
                let bytesLength = byteCharacters.length;
                let slicesCount = Math.ceil(bytesLength / sliceSize);                
                let byteArrays = new Array(slicesCount);
                for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
                    let begin = sliceIndex * sliceSize;
                    let end = Math.min(begin + sliceSize, bytesLength);                    
                    let bytes = new Array(end - begin);
                    for (let offset = begin, i = 0 ; offset < end; ++i, ++offset) {
                        bytes[i] = byteCharacters[offset].charCodeAt(0);         
                    }
                    byteArrays[sliceIndex] = new Uint8Array(bytes);
                }
                
                //from arraybuffer create a File instance
                this.myFile =  new File(byteArrays, this.fileName, { type: this.fileType });
                
                //callback for final base64 String format
                let reader = new FileReader();
                reader.onloadend = (() => {
                    let base64data = reader.result;
                    this.base64FileData = base64data.substr(base64data.indexOf(',')+1);
                });
                reader.readAsDataURL(this.myFile);                                 
            });
            this.fileReaderObj.readAsDataURL(this.file);
        }
        this.showSpinner = false;
         this.isattachError=false;
       // console.log('fileName>>',typeof(JSON.stringify(event.target.files) ));
      
    }
    
    handleCreateIssue(event){         
        this.selectedDate=this.DateFunction();
        //console.log('currentDate>>>>',this.DateFunction());    
        this.headeringName = 'New Issue';
        this.isOpenModal=true;
        this.recordId = '';
        this.fileName = '';
        this.buttonName = 'Save';
        this.issueparent=false;
        this.currentStep ='step1';
        this.viewflag=true;
        this.viewfileName='';
        this.fileName = '';        
        localStorage.removeItem('issueFormData');
        localStorage.removeItem('issueFormData1');
        localStorage.removeItem('issueFormData3');
       // this.firstName = this.staffVal;
       // this.lastName = this.staffVal1;
        this.userFName = this.FName;
        this.userLName = this.LName;
        this.firstName = this.firstName || this.staffVal;
        this.lastName = this.lastName || this.staffVal1;
        /* this.role = this.rolesArray[0];  *///Role issue fix
        this.role = this.options?.[0]?.value || null;//Role issue fix

        this.client=this.clientOption[0].value;
        console.log('Client'+JSON.stringify(this.client));
        this.facilityName=this.clientOption[0].facility;
        this.status = 'Open';
        this.priority1 = '';
        this.email = this.userEmail;
        this.phone = this.userContactNum;
        this.priorityValue = 'Low';
        if(this.priorityValue === 'High'){
            this.showPolice=rue;
        } else {
            this.showPolice=false;
            this.showPoliceComments=false;
        }
        this.raisedByValue = '';
        this.issueTypeValue = 'Unreasonable use of force';
        this.incidentDateTime = '';
        this.allegedDateTime = '';
        this.description = '';
        this.reportedToPolice = '';
        this.clientConcerns = '';
        this.showPoliceComments = false;
        this.policeComments='';
        this.actionsTaken ='';
        this.additionalInfo='';
        this.futureActions='';
        this.incidentDate='';
        this.incidentTime='';
        this.allegedTime='';
        this.allegedDate='';
        this.isFormSaved=false;
        this.isFormSaved2=false;
        this.isFormSaved3=false;
        this.showOtherDescription=false;
        this.showParticipantRepresentative = false;
        this.showSubContractor = false;
        this.others='';
        this.subContractor = '';
        this.partcipantValue = '';
        this.facilityName1 = '';
        this.client1 = '';
        this.showEmployee = false;
        this.stafflabel1 = '';
        this.staffName1 = '';
        this.showMuteIcon = false;
        this.showClearIcon = false;
    }

    hideModalBox(){
        this.isOpenModal=false;
    }

    DateFunction(){
        var toDayNewDate =new Date();
        var presentday=toDayNewDate.getDate();
        if(presentday<10){
            presentday='0'+presentday;
        }
        var presentMonth=(toDayNewDate.getMonth()+1);
        if(presentMonth<10){
        presentMonth='0'+presentMonth;
        } 
        this.todayCssVariable =toDayNewDate.getFullYear()+"-"+(presentMonth)+"-"+(presentday) ; 
       // console.log('the toDay date '+this.todayCssVariable );
        return this.todayCssVariable;
    } 

    uploadFile() {        
        if (this.filesUploaded[0].size > this.MAX_FILE_SIZE) {        
           // console.log('File Size is too large');        
            return;        
        }        
        this.showLoadingSpinner = true;        
        this.fileReader = new FileReader();        
        this.fileReader.onloadend = () => {        
            this.fileContents = this.fileReader.result;                
            this.saveFile();        
        }        
        this.fileReader.readAsText(this.filesUploaded[0]);        
    }
    
    handleedit(event) {
        this.role = "";
        this.recordId = event.currentTarget.dataset.id;
        console.log('Record Id >> ' + this.recordId);
        this.isOpenModal=true;
        this.issueparent = false;         
        let typeIssue;       
        this.viewflag=false;
        this.showOtherDescription=false;
        this.showParticipantRepresentative = false;
        this.showSubContractor = false;
        this.showEmployee = false;
        typeIssue = this.JSONData[this.recordId]["typeOfIssue"];
        this.firstName = this.JSONData[this.recordId]["firstName"];
        this.userFName=this.firstName;
        console.log('firstname >> '+this.firstName);
        this.lastName = this.JSONData[this.recordId]["lastName"];
        this.userLName=this.lastName;
        console.log('lastname>> '+this.lastName);
        this.client = this.JSONData[this.recordId]["client"];
        //this.stafflabel1=this.JSONData[this.recordId]["client"];
        this.facilityName = this.JSONData[this.recordId]["facilityName"];
        this.email = this.JSONData[this.recordId]["email"];
        this.phone = this.JSONData[this.recordId]["phone"]; 
        if(this.currentUserRole =='Portal Account Partner Executive' || this.currentUserRole =='CEO' || this.currentUserRole =='Admin' ||this.currentUserRole =='Portal Account Partner Manager'){
            //this.isStaff = true;
        } 
        this.role = this.JSONData[this.recordId]["role"]; 
        console.log('Role >> '+this.role);
        this.status = this.JSONData[this.recordId]["status"];
        this.priorityValue = this.JSONData[this.recordId]["priorityValue"];
        if(this.priorityValue === 'High')
            {
                this.showPolice=true;
        this.reportedToPolice = this.JSONData[this.recordId]["reportedToPolice"];
        if(this.reportedToPolice === 'Yes')
        {
            this.showPoliceComments=true;
            this.policeComments = this.JSONData[this.recordId]["policeComments"];
        }
        
            }
        this.raisedByValue = this.JSONData[this.recordId]["raisedByValue"];
        console.log('raised by value',this.raisedByValue);
        if(this.raisedByValue === 'Participants Representative')
        {
            this.showParticipantRepresentative=true;
        }else if(this.raisedByValue === 'Sub - Contractor')
            {
            this.showSubContractor=true;
        }else if(this.raisedByValue === 'Participant')
             {
                this.showClientDropdown=true;
        }else if(this.raisedByValue === 'Employee')
                {
                this.showEmployee=true;
        }else if(this.raisedByValue === 'Facility')
                    {
                    this.showFacilityDropdown=true;
        }else if(this.raisedByValue === 'Other')
                        {
                        this.showOtherDescription=true;
                        }
        this.issueTypeValue = this.JSONData[this.recordId]["issueTypeValue"];
        console.log('issue type',this.issueTypeValue);
        if(this.issueTypeValue === 'Other')
            {
                this.mostRelevantOthers=true;
            }

        this.incidentDateTime = this.JSONData[this.recordId]["incidentDateTime"];                
        console.log("🕓 incidentDateTime:", this.incidentDateTime);

        this.allegedDateTime = this.JSONData[this.recordId]["allegedDateTime"];
        console.log("🕓 allegedDateTime:", this.allegedDateTime);

        this.description = this.JSONData[this.recordId]["description"];
        console.log("📝 description:", this.description);

        this.clientConcerns = this.JSONData[this.recordId]["clientConcerns"];
        console.log("⚠️ clientConcerns:", this.clientConcerns);

        this.actionsTaken = this.JSONData[this.recordId]["actionsTaken"];
        console.log("✅ actionsTaken:", this.actionsTaken);

        this.additionalInfo = this.JSONData[this.recordId]["additionalInfo"];
        console.log("📎 additionalInfo:", this.additionalInfo);

        this.futureActions = this.JSONData[this.recordId]["futureActions"];
        console.log("🔮 futureActions:", this.futureActions);

        this.viewfileName = this.JSONData[this.recordId]["fileName"];
        console.log("📂 viewfileName:", this.viewfileName);

        this.incidentDate = this.JSONData[this.recordId]["incidentdate"];                
        console.log("📅 incidentDate:", this.incidentDate);

        this.incidentTime = this.JSONData[this.recordId]["incidenttime"];
        console.log("⏰ incidentTime (raw):", this.incidentTime);

        const incidentTimeData = this.convertTo12HourFormat(this.incidentTime);
        console.log("⏱ incidentTimeData (converted):", incidentTimeData);

        this.AddShiftStartTimeAMPM1 = incidentTimeData.displayTime;
        this.startTimeSelectedHour = incidentTimeData.hour;
        this.startTimeSelectedMinute = incidentTimeData.minute;
        this.startTimeAMPM = incidentTimeData.ampm;
        console.log("🕒 Start Time Details:", {
            displayTime: this.AddShiftStartTimeAMPM1,
            hour: this.startTimeSelectedHour,
            minute: this.startTimeSelectedMinute,
            ampm: this.startTimeAMPM
        });

        this.allegedDate = this.JSONData[this.recordId]["allegedDate"];
        console.log("📅 allegedDate:", this.allegedDate);

        this.allegedTime = this.JSONData[this.recordId]["allegedTime"];
        console.log("⏰ allegedTime (raw):", this.allegedTime);

        const allegedTimeData = this.convertTo12HourFormat(this.allegedTime);
        console.log("⏱ allegedTimeData (converted):", allegedTimeData);

        this.AddShiftEndTimeAMPM1 = allegedTimeData.displayTime;
        this.endTimeSelectedHour = allegedTimeData.hour;
        this.endTimeSelectedMinute = allegedTimeData.minute;
        this.endTimeAMPM = allegedTimeData.ampm;
        console.log("🕓 End Time Details:", {
            displayTime: this.AddShiftEndTimeAMPM1,
            hour: this.endTimeSelectedHour,
            minute: this.endTimeSelectedMinute,
            ampm: this.endTimeAMPM
        });

        this.others = this.JSONData[this.recordId]["others"];
        console.log("🧩 others:", this.others);

        this.UIincidentDateTime = this.formatdate(this.incidentDate) + ',' + this.AddShiftStartTimeAMPM1;   
        console.log("🧭 UIincidentDateTime:", this.UIincidentDateTime);

        this.allegedDateTime = this.formatdate(this.allegedDate) + ',' + this.AddShiftEndTimeAMPM1;     
        console.log("🧭 allegedDateTime (UI):", this.allegedDateTime);

        this.subContractor = this.JSONData[this.recordId]["subContractor"];
        console.log("🏗 subContractor:", this.subContractor);

        this.partcipantValue = this.JSONData[this.recordId]["partcipantValue"];
        console.log("👥 partcipantValue:", this.partcipantValue);

        this.client1 = this.JSONData[this.recordId]["client1"];
        console.log("👤 client1:", this.client1);

        this.facilityName1 = this.JSONData[this.recordId]["facilityName1"];
        console.log("🏥 facilityName1:", this.facilityName1);

        this.staffName =  this.JSONData[this.recordId]["staffName"];
        this.staffName1 =  this.JSONData[this.recordId]["staffName1"];
        if(this.staffName1)
        {
            this.stafflabel1 = this.staffOptions2.find(rec=>rec.value==this.staffName1).label;
        }
        this.mostRelevantOtherValue=this.JSONData[this.recordId]["mostReleventOthers"];
        this.signatureImage=this.JSONData[this.recordId]["signature"];
        this.name = this.JSONData[this.recordId]["reviewername"];
        this.designation = this.JSONData[this.recordId]["designation"];
        console.log('participantValue '+this.raisedByValue);
        this.fileName = ''; 
    }
    
    convertTo12HourFormat(rawTime) {
        if (!rawTime) {
            return { displayTime: "", hour: "", minute: "", ampm: "" };
        }

        // Ensure time string includes 'Z' for UTC if missing
        const normalizedTime = rawTime.endsWith('Z') ? rawTime : `${rawTime}Z`;

        // Parse as UTC time
        const date = new Date(`1970-01-01T${normalizedTime}`);

        let hours = date.getUTCHours();
        let minutes = date.getUTCMinutes();

        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 → 12
        const minutesStr = minutes.toString().padStart(2, "0");

        const displayTime = `${hours}:${minutesStr} ${ampm}`;
        return { displayTime, hour: hours, minute: minutesStr, ampm };
    }


  /*   fetchIssues(){        
        getIssues({typeofIssue:'Own Org', orgId: this.orgId}).then(InvoiceDetails=>{  
            this.initialRecords = InvoiceDetails;
            this.totalRecords=InvoiceDetails.length;
            this.paginationHelper();
           // console.log('invoice details >>'+JSON.stringify(this.initialRecords));
        })        
        refreshApex(this.initialRecords);
    } */  
    get isStep1() {
        return this.currentStep === 'step1';
    }

    get isStep2() {
        return this.currentStep === 'step2';
    }

    get isStep3() {
        return this.currentStep === 'step3';
    }

    get isStep4() {
        return this.currentStep === 'step4';
    }
    handleStepClick(event) {
        const selectedStep = event.target.value;
       // console.log('naviagation--->'+selectedStep);
        this.currentStep = selectedStep;
    }
    extractFileNameFromUrl(url) {
        // Split the URL by '/' and get the last segment
        const segments = url.split('/');
        this.fileName = segments.pop();
        return this.fileName;
    }
    
    handleSave1() {
        const formData1 = {
            firstName: this.firstName,
            lastName: this.lastName,
            role: this.role,
            email: this.email,
            phone: this.phone,
            facilityName: this.facilityName,
            client: this.client,
            status: this.status
        };
       // console.log('Data saved temporarily:', JSON.stringify(formData1));
        if (!this.firstName || !this.lastName || !this.client || !this.facilityName || !this.email || !this.phone || !this.staffName1 ) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error!!',
                    message: 'Complete required fields.',
                    variant: 'error',
                }),
            );
            this.isFormSaved = false;
        } else {
            localStorage.setItem('issueFormData', JSON.stringify(formData1));
            /* this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success!!',
                    message: 'Your Details Saved!!',
                    variant: 'success',
                }),
            ); */
            this.isFormSaved = true;
        }
    }          

    handleFirstNameChange(event){        
        this.firstName=event.detail.value;
    }

    handleLastNameChange(event){
        this.lastName=event.detail.value;
    }

    handlePhoneChange(event){        
        this.phone=event.detail.value;        
    }

    handleEmailChange(event){
        this.email=event.detail.value;        
    }

    handleFacilityChange(event){       
        this.faclitylabel =  this.facilityOptions.find(rec=>rec.value==event.detail.value).label;
       // console.log('facility label----->'+this.faclitylabel);
        this.facilityName = event.detail.value;
    }
    handleClientChange1(event){
        this.clientLabel1 =  this.clientOption.find(rec=>rec.value==event.detail.value).label;
        //console.log('client label----->'+this.clientLabel1);
        this.client1 = event.detail.value;
    }
    handleFacilityChange1(event){
        this.faclitylabel1 = this.facilityOptions.find(rec=>rec.value==event.detail.value).label;
        console.log('facility label----->'+this.faclitylabel1);
        this.facilityName1 = event.detail.value;
    }    
    handleStaffChange(event){
        this.stafflabel = this.staffOptions2.find(rec=>rec.value==event.detail.value).label;
        console.log('Staff label----->'+this.stafflabel);
        this.staffName = event.detail.value;
        console.log('Staff Name >> '+ this.staffName);
    }
    @track stafflabel1;
    @track staffName1;
    handleStaffChange1(event){
        this.stafflabel1 = this.staffOptions2.find(rec=>rec.value==event.detail.value).label;
        console.log('Staff label1----->'+this.stafflabel1);
        this.staffName1 = event.detail.value;
        console.log('Staff Name1 >> '+ this.staffName1);
    }

    handleClientChange(event){
        this.clientLabel =  this.clientOption.find(rec=>rec.value==event.detail.value).label;
        this.client = event.detail.value;
       
       /*  this.facilityName=this.clientOption.find(rec=>rec.value==event.detail.value).facility;
        console.log('client chnage >> '+  this.facilityName); */
    }

    handleNext1() {
        this.handleSave1();
        console.log('stafff chnage >> '+ this.staffName1);
        if (!this.userFName || !this.userLName || !this.client || !this.facilityName || !this.email || !this.phone  || !this.staffName1) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error!!',
                    message: 'Complete required fields.',
                    variant: 'error',
                }),
            );
            this.isFormSaved = false;
        }
        
        if (this.isFormSaved) {
            this.currentStep ='step2';
            this.canvasInitialized=false;
        }/* else {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error!!',
                    message: 'Please save the form before proceeding to the next step.',
                    variant: 'error',
                }),
            );
        } */
    }

    handleCancel1() {
        this.closeModel();
    } 
        
   /*  getFacilityValues(){
        getCurrentLoggedUserInfo().then(userData=>{;
                        let userTpe=userData.User_Type__c;
                        getFacilityData().then(response => {
                            console.log('Facility data fetched successfully:',JSON.stringify(response));
                            this.finalListFacilities=[];
                            this.selectedFacilities=[];
                            this.facilityOptions = response.map(record => ({
                                label: record.Name,
                                value: record.Id
                        }));   
                            console.log('user data ==>'+JSON.stringify(userData));
                                if( userTpe =='NDIS Org Admin' || userTpe == 'ICT Admin'){
                                    this.facilityOptions =this.facilityOptions  ;
                                    console.log('Fetch Participant>>>'+ JSON.stringify(this.orgAwards));
                                    finalData =this.orgAwards;
                                    let facilityIds = [];
                                        // finalData =response;
                                            console.log('Fetch Participant filteredData>>>'+ JSON.stringify(this.orgAwards));
                                        facilityIds.push(storedFacilityId); 
                                        console.log('facilityIds  '+JSON.stringify(facilityIds))
                                    const filteredData = this.orgAwards.filter(rec =>
                                        facilityIds.includes(rec.facilityid)
                                    );
                                this.records =filteredData ;
                                this.orginalData=filteredData;
                                console.log('Fetch Participant finalData>>>'+ JSON.stringify(filteredData));
                                this.totalRecords = filteredData.length; // update total records count                 
                                    this.pageSize = this.pageSizeOptions[0]; //set pageSize with default value as first option
                                    this.pageNumber = 1;
                                // this.applyFilters(); 
                                this.paginationHelper(); // call helper menthod to update pagination logic           
                                
                                }else if(userTpe =='Facility Admin' || userTpe =='HR Admin' || userTpe =='Roster Manager'){
                                    getFacilityCurrentUser().then(result => {
                                        console.log('getFacilityCurrentUser facility   '+JSON.stringify(result));
                                        this.facilityOptions  =  result.map(record => ({
                                                label: record.Facility__r.Name,
                                                value: record.Facility__r.Id
                                        })); 
                                        let facilityIds = [];
                                        // finalData =response;
                                            console.log('Fetch Participant filteredData>>>'+ JSON.stringify(this.orgAwards));
                                        facilityIds.push(storedFacilityId); 
                                        console.log('facilityIds  '+JSON.stringify(facilityIds))
                                    const filteredData = this.orgAwards.filter(rec =>
                                        facilityIds.includes(rec.facilityid)
                                    );
        
                                    this.records =filteredData ;
                                        this.orginalData=filteredData;
                                    console.log('Fetch Participant filteredData>>>'+ JSON.stringify(filteredData));
                                        console.log('Fetch Participant filteredData length >>>'+filteredData.length);
                                    this.totalRecords = filteredData.length; // update total records count                 
                                    this.pageSize = this.pageSizeOptions[0]; //set pageSize with default value as first option
                                    this.pageNumber = 1;
                                    //this.applyFilters(); 
                                    this.paginationHelper(); // call helper menthod to update pagination logic           
                                    // this.ParticpantRecordForm=false;
                                    this.showSpinner = false;
                                    }).catch(error => {
                                        this.error = error;
                                        console.error('Error fetching facilities:', error);
                            
                                    });
                                }
                        })
                        })
                    .catch(err => {
                        console.error('Error fetching facility data:', err);
                    });
        
    } */

    getFacilityValues() {
    // 1️⃣ Get cached facility Id
    const storedFacilityId = localStorage.getItem('defaultFacilityId');
    console.log('Cached Facility Id:', storedFacilityId);

    // 2️⃣ Fetch facility data from server
    getFacilityData()
    .then(response => {
        console.log('Facility data fetched successfully:', JSON.stringify(response));

        // 3️⃣ Map all facilities to label/value
        this.facilityOptions = response.map(record => ({
            label: record.Name,
            value: record.Id
        }));

        // 4️⃣ Filter to only include the cached facility
        if (storedFacilityId) {
            this.facilityOptions = this.facilityOptions.filter(
                facility => facility.value === storedFacilityId
            );
        }

        console.log('Filtered facilityOptions based on cache:', JSON.stringify(this.facilityOptions));
    })
    .catch(err => {
        console.error('Error fetching facility data:', err);
    });
}

    @track staffOptions = [];
    @track staffOptions1 = [];
    @track staffOptions2;
    @track staffVal;
    @track stafflabel;
    @track staffVal1;
    getStaffValues(){
        getEmployeeData({facilityid: this.facilityValuefromcatch}).then(response => {
            this.staffOptions = response.map(record => ({ value: record.Id, label: record.Name })); 
            this.staffOptions1 = response.map(record => ({ value: record.Id, label: record.Last_Name__c }));
            this.staffOptions2 = response.map(record => ({ value: record.Id, label: record.Display_Nickname__c }));
            console.log('staff options '+JSON.stringify(this.staffOptions));
           // console.log('staff options1 >>'+JSON.stringify(this.staffOptions1));

            let staffLength=Object.keys(this.staffOptions).length;           
            this.staffVal = this.staffOptions[0].label
            this.staffVal1 = this.staffOptions1[0].label
            this.stafflabel=this.staffOptions2[0].label;
           // console.log('staff Options label1 '+ this.staffOptions2[0].label);
        }).catch(err => {
       
        });        
        // Get the current user's first name and last name
        getUserDetails().then(user => {
            this.firstName = user.FirstName;
            this.lastName = user.LastName;
            console.log('Logged-in user: ' + this.firstName + ' ' + this.lastName);
        }).catch(err => {
            console.error('Error fetching user data', err);    
        })
    }

    //value = 'ain';
     get options() {
        return [
            { label: 'Admin', value: 'Admin' },
            { label: 'AIN', value: 'AIN' },
            { label: 'Catering/Kitchen hand', value: 'Catering/Kitchen hand' },
            { label: 'Chef', value: 'Chef' },
            { label: 'Cleaning', value: 'Cleaning' },
            { label: 'EEN', value: 'EEN' },
            { label: 'Human Resources', value: 'Human Resources' },
            { label: 'IT Consultant	', value: 'IT Consultant' },
            { label: 'Laundry', value: 'Laundry' },
            { label: 'Registered Nurse', value: 'Registered Nurse' },
            { label: 'Roster Manager', value: 'Roster Manager' },
            { label: 'Support worker', value: 'Support worker' },
            { label: 'RN', value: 'RN' },
        ];
    } 
    priorityOptions = [
        { label: 'High', value: 'High' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Low', value: 'Low' }
    ];

    raisedByOptions = [
        { label: 'Participant', value: 'Participant' },
        { label: 'Participants Representative', value: 'Participants Representative' },
        { label: 'Employee', value: 'Employee' },
        { label: 'Sub - Contractor', value: 'Sub - Contractor' },
        { label: 'Facility', value: 'Facility' },
        { label: 'Other (Please provide details)', value: 'Other' }
    ];

    issueTypeOptions = [
        { label: 'Unreasonable use of force', value: 'Unreasonable use of force' },
        { label: 'Unlawful sexual contact or inappropriate sexual contact', value: 'Unlawful sexual contact or inappropriate sexual contact' },
        { label: 'Unexplained absence from care', value: 'Unexplained absence from care' },
        { label: 'Unexpected death', value: 'Unexpected death' },
        { label: 'Stealing or financial coercion by a staff member', value: 'Stealing or financial coercion by a staff member' },
        { label: 'Psychological or emotional abuse', value: 'Psychological or emotional abuse' },
        { label: 'Neglect', value: 'Neglect' },
        { label: 'Inappropriate use of restrictive practices', value: 'Inappropriate use of restrictive practices' },
        { label: 'Other (Please provide details)', value: 'Other' }
    ];

    handleChangeRole(event) {
        this.role = event.detail.value; // Handle combobox value change
        console.log('Selected Role >> ' + this.role);
    }

    newIssueDetails() {
        const savedData = localStorage.getItem('issueFormData');
        const savedData1 = localStorage.getItem('issueFormData1');
        const savedData2 = localStorage.getItem('issueFormData3');
        if (savedData) {
            const formData = JSON.parse(savedData);
            this.priorityValue = formData.priorityValue;
            this.raisedByValue = formData.raisedByValue;
            this.issueTypeValue = formData.issueTypeValue;
            this.incidentDateTime = formData.incidentDateTime;
            this.allegedDateTime = formData.allegedDateTime;
            this.description = formData.description;
            this.partcipantValue = formData.partcipantValue;
            this.subContractor = formData.subContractor;
            this.facilityName1 = formData.facilityName1;
            this.client1 = formData.client1;
            this.staffName = formData.staffName;
            this.mostRelevantOtherValue=formData.mostRelevantOthers;
        }
        if (savedData1) {
            const formData1 = JSON.parse(savedData1);
            this.firstName=formData1.firstName;
            this.lastName=formData1.lastName,
            this.role=formData1.role;
            this.email=formData1.email;
            this.phone=formData1.phone;
            this.facilityName=formData1.facilityName;
            this.client=formData1.client;
            this.status = formData1.status;
            this.staffName1 = formData1.staffName1;
        }
        if(savedData2){
            const formData2 = JSON.parse(savedData2);
            this.reportedToPolice =  formData2.reportedToPolice,
            this.clientConcerns = formData2.clientConcerns,
            this.showPoliceComments = formData2.showPoliceComments,
            this.policeComments = formData2.policeComments,
            this.actionsTaken = formData2.actionsTaken,
            this.additionalInfo = formData2.additionalInfo,
            this.futureActions = formData2.futureActions,
            this.fileName = formData2.fileName;
        }
    }

    /*  handlePriorityChange(event) {
        this.priorityValue = event.detail.value;
    }  */

    @track showOtherDescription = false; // Control for the "Other" input
    @track showClientDropdown = false; 
    @track showFacilityDropdown = false; 
    @track showParticipantRepresentative = false;
    @track showSubContractor = false;
    @track showEmployee = false;
    @track mostRelevantOthers=false;
    @track mostRelevantOtherValue;
    
    handleRaisedByChange(event) {
        this.raisedByValue = event.detail.value;  
        this.showOtherDescription = this.raisedByValue === 'Other';
        this.showClientDropdown = this.raisedByValue === 'Participant';
        this.showFacilityDropdown = this.raisedByValue === 'Facility';
        this.showParticipantRepresentative = this.raisedByValue === 'Participants Representative';
        this.showSubContractor = this.raisedByValue === 'Sub - Contractor';
        this.showEmployee = this.raisedByValue === 'Employee';
    }
    handleInputother(event){
        this.others=event.detail.value;
    }
    handleInputParticipantRepresent(event){
        this.partcipantValue = event.detail.value;
    }
    handleInputSubContractor(event){
        this.subContractor = event.detail.value;
    }
    
    handleIssueTypeChange(event) {
        this.issueTypeValue = event.detail.value;
        this.mostRelevantOthers=this.issueTypeValue === 'Other';
        //console.log('mostReleventothers '+this.mostRelevantOthers);
    }
    handleInputMostRelevantOther(event){
        this.mostRelevantOtherValue=event.detail.value;
    }

    handleIncidentDateTimeChange(event) {
       /*  this.incidentDateTime = event.target.value;
        console.log('time-------------->'+this.incidentDateTime);
        */ 
        const field = event.target.label;

        if (field === 'Date') {
            this.incidentDate = event.target.value;
           // console.log(this.incidentDate);
        } else if (field === 'Time') {
            const childData = event.detail;
            this.AddShiftStartTimeAMPM1 = childData.displaytime;
            console.log(this.incidentTime);
        }
        this.UIincidentDateTime=this.formatdate(this.incidentDate)+ ',' +this.AddShiftStartTimeAMPM1;
       //this.combineDateTime();
    }

    @track startTimeSelectedMinute;
    @track startTimeSelectedHour;
    @track startTimeAMPM;
    @track AddShiftStartTimeAMPM1;
    @track AddShiftStartTimeAMPM2;

    @track AddShiftEndTimeAMPM2;
    handleIncidentDateTimeChange1(event) {
        const childData = event.detail;
        const displayTime = childData.displaytime; // e.g. "12:00 AM" or ""

        console.log("🎯 handleIncidentDateTimeChange1 triggered");
        console.log("🕒 Raw displayTime received from child:", displayTime);

        // 🧹 If displayTime is empty/null/undefined → reset all related vars
        if (!displayTime || displayTime.trim() === "") {
            console.warn("⚠️ Empty displayTime received — resetting all variables");

            this.AddShiftStartTimeAMPM1 = "";
            this.incidentTime = "";
            this.startTimeSelectedHour = "";
            this.startTimeSelectedMinute = "";
            this.startTimeAMPM = "";

            console.log("🧹 Cleared values:");
            console.log({
                AddShiftStartTimeAMPM1: this.AddShiftStartTimeAMPM1,
                incidentTime: this.incidentTime,
                startTimeSelectedHour: this.startTimeSelectedHour,
                startTimeSelectedMinute: this.startTimeSelectedMinute,
                startTimeAMPM: this.startTimeAMPM
            });
            return; // ✅ Stop here
        }

        // Store the original display time (12hr format)
        this.AddShiftStartTimeAMPM1 = displayTime;

        // Convert to 24-hour format
        const time24 = this.convertTo24HourFormat(displayTime);
        this.incidentTime = time24;

        console.log("⏱️ Converted 24-hour format:", this.incidentTime);

        // Split 12hr time into parts
        const starttimeDetailsSleepover = this.splitTimeParts(this.AddShiftStartTimeAMPM1);
        this.startTimeSelectedMinute = starttimeDetailsSleepover.minute;
        this.startTimeSelectedHour = starttimeDetailsSleepover.hour;
        this.startTimeAMPM = starttimeDetailsSleepover.period;

        console.log("🧩 Split time parts:");
        console.log("   Hour:", this.startTimeSelectedHour);
        console.log("   Minute:", this.startTimeSelectedMinute);
        console.log("   Period (AM/PM):", this.startTimeAMPM);

        console.log("✅ Final stored values:");
        console.log({
            AddShiftStartTimeAMPM1: this.AddShiftStartTimeAMPM1,
            incidentTime: this.incidentTime,
            startTimeSelectedHour: this.startTimeSelectedHour,
            startTimeSelectedMinute: this.startTimeSelectedMinute,
            startTimeAMPM: this.startTimeAMPM
        });

        this.UIincidentDateTime=this.formatdate(this.incidentDate)+ ',' + this.AddShiftStartTimeAMPM1;
    }


    @track AddShiftEndTimeAMPM1;
    @track AddShiftEndTimeAMPM2;
    @track endTimeSelectedHour;
    @track endTimeSelectedMinute;
    @track endTimeAMPM;

    handleIncidentDateTimeChange2(event) {
        const childData = event.detail;
        const displayTime = childData.displaytime; // e.g. "12:00 AM" or ""

        console.log("🎯 handleIncidentDateTimeChange2 triggered");
        console.log("🕒 Raw displayTime received from child:", displayTime);

        // 🧹 If displayTime is empty/null/undefined → reset all related vars
        if (!displayTime || displayTime.trim() === "") {
            console.warn("⚠️ Empty displayTime received — resetting all END TIME variables");

            this.AddShiftEndTimeAMPM1 = "";
            this.allegedTime = "";
            this.endTimeSelectedHour = "";
            this.endTimeSelectedMinute = "";
            this.endTimeAMPM = "";

            console.log("🧹 Cleared END TIME values:");
            console.log({
                AddShiftEndTimeAMPM1: this.AddShiftEndTimeAMPM1,
                allegedTime: this.allegedTime,
                endTimeSelectedHour: this.endTimeSelectedHour,
                endTimeSelectedMinute: this.endTimeSelectedMinute,
                endTimeAMPM: this.endTimeAMPM
            });
            return; // ✅ Stop further execution
        }

        // Store the original display time (12hr format)
        this.AddShiftEndTimeAMPM1 = displayTime;

        // Convert to 24-hour format
        const time24 = this.convertTo24HourFormat(displayTime);
        this.allegedTime = time24;

        console.log("⏱️ Converted to 24-hour format:", this.allegedTime);

        // Split 12hr time into parts
        const endTimeDetails = this.splitTimeParts(this.AddShiftEndTimeAMPM1);
        this.endTimeSelectedMinute = endTimeDetails.minute;
        this.endTimeSelectedHour = endTimeDetails.hour;
        this.endTimeAMPM = endTimeDetails.period;

        console.log("🧩 Split time parts:");
        console.log("   Hour:", this.endTimeSelectedHour);
        console.log("   Minute:", this.endTimeSelectedMinute);
        console.log("   Period (AM/PM):", this.endTimeAMPM);

        console.log("✅ Final stored values for END TIME:");
        console.log({
            AddShiftEndTimeAMPM1: this.AddShiftEndTimeAMPM1,
            allegedTime: this.allegedTime,
            endTimeSelectedHour: this.endTimeSelectedHour,
            endTimeSelectedMinute: this.endTimeSelectedMinute,
            endTimeAMPM: this.endTimeAMPM
        });

        this.allegedDateTime=this.formatdate(this.allegedDate) + ',' +this.AddShiftEndTimeAMPM1;
    }
   


    splitTimeParts(timeString) {
        if (!timeString) {
        console.error("Time string is empty or undefined.");
        return { hour: null, minute: null, period: null };
        }

        const [timePart, period] = timeString.trim().split(" "); // "6:00", "AM"
        const [hour, minute] = timePart.split(":"); // "6", "00"

        return {
        hour: hour,
        minute: minute,
        period: period
        };
    }

    convertTo24HourFormat(time12h) {
        if (!time12h) return "";

        // Expecting format like "hh:mm AM" or "hh:mm PM"
        const [time, modifier] = time12h.split(" ");
        let [hours, minutes] = time.split(":");

        hours = parseInt(hours, 10);

        if (modifier.toLowerCase() === "pm" && hours !== 12) {
            hours += 12;
        }
        if (modifier.toLowerCase() === "am" && hours === 12) {
            hours = 0;
        }

        // Format to 2 digits
        const hoursStr = hours.toString().padStart(2, "0");
        const minutesStr = minutes.padStart(2, "0");

        // Return full 24-hour format with seconds + Z
        return `${hoursStr}:${minutesStr}:00Z`;
    }



    


    handleAllegedDateTimeChange(event) {
        const field = event.target.label;
        if (field === 'Date') {
            this.allegedDate = event.target.value;
           // console.log(this.allegedDate);
        } else if (field === 'Time') {
            this.allegedTime = event.target.value;
           // console.log(this.allegedTime);
        }
        this.allegedDateTime=this.formatdate(this.allegedDate)+ ','+ this.AddShiftEndTimeAMPM1;
    }
    
    formatdate(idate){
        const dateformat = new Date(idate).toLocaleDateString('en-GB');
        return dateformat;
    }

    formattime(time){
        const [hour, minute] = time.split(':');
        let hours = parseInt(hour, 10);
        const minutes = parseInt(minute, 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const strMinutes = minutes < 10 ? '0' + minutes : minutes;
        const timeformat= `, ${hours}:${strMinutes} ${ampm}`;
        return timeformat;
    }
   
    handleDescriptionChange(event) {
       try {
        this.description = event.target.value;
        this.showClearIcon = this.description.length > 0;
    } catch (error) {
        console.error('Error in handleTextChange:', error.message);
    }
    }

    handlePrevious2() {
        this.currentStep ='step1';
    }
    handleSave2() {
        const formData2 = {
            priorityValue: this.priorityValue,
            raisedByValue: this.raisedByValue,
            issueTypeValue: this.issueTypeValue,
            incidentDateTime: this.incidentDateTime,
            allegedDateTime: this.allegedDateTime,
            description: this.description,
            subContractor: this.subContractor,
            partcipantValue: this.partcipantValue,
            facilityName1: this.facilityName1,
            client1: this.client1,
            mostRelevantOthers:this.mostRelevantOtherValue
        };
       // console.log('Data saved temporarily:', JSON.stringify(formData2));

        if (!this.priorityValue || !this.raisedByValue || !this.issueTypeValue || !this.incidentDate || !this.incidentTime || !this.allegedDate || !this.allegedTime || !this.description) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error!!',
                    message: 'Complete required fields.',
                    variant: 'error',
                }),
            );
            this.isFormSaved2 = false;
        } else {
            localStorage.setItem('issueFormData2', JSON.stringify(formData2));
            /* this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success!!',
                    message: 'Issue Details Saved!!',
                    variant: 'success',
                }),
            ); */
            this.isFormSaved2 = true;
        }
    }

    handleCancel2() {
        this.closeModel();
        this.showMuteIcon = false;
        this.showClearIcon = false;
       // console.log('Data saved temporarily:', JSON.stringify(formData1));
    }

    handleNext2() {  
        this.handleSave2();
        if (!this.priorityValue || !this.raisedByValue || !this.issueTypeValue || !this.incidentDate || !this.incidentTime || !this.allegedDate || !this.allegedTime || !this.description ) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error!!',
                    message: 'Complete required fields.',
                    variant: 'error',
                }),
            );
            this.isFormSaved2 = false;
        }     
        if (this.isFormSaved2) {
            this.currentStep ='step3';
             this.canvasInitialized=false;
        } /* else {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error!!',
                    message: 'Please save the form before proceeding to the next step.',
                    variant: 'error',
                }),
            );
        } */
    }

    yesNoOptions = [
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' }
    ];
    handleSave3() {
        const formData3 = {
            reportedToPolice: this.reportedToPolice,
            clientConcerns: this.clientConcerns,
            policeComments: this.policeComments,
            actionsTaken: this.actionsTaken,
            additionalInfo: this.additionalInfo,
            futureActions: this.futureActions,
            fileName: this.fileName            
        };
       // console.log('Data saved temporarily:', JSON.stringify(formData3));
        if (!this.clientConcerns || !this.actionsTaken || !this.additionalInfo || !this.futureActions) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error!!',
                    message: 'Complete required fields.',
                    variant: 'error',
                }),
            );
            this.isFormSaved3 = false;
           // console.log('Handle Save3>>'+isFormSaved3);
        } else {
            localStorage.setItem('issueFormData3', JSON.stringify(formData3));
            /* this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success!!',
                    message: 'Action Details Saved!!',
                    variant: 'success',
                }),
            ); */
            this.isFormSaved3 = true;
        }
    }

   
  /*   handleRadioChange(event) {
        const field = event.target.dataset.id;
        this[field] = event.target.value;

        if (field === 'reportedToPolice') {
            this.showPoliceComments = this.reportedToPolice === 'Yes';
        }else{
            this.showPoliceComments=false;
        }
       
    } */
        handleRadioChange(event){
            if(event.target.name=='reportedToPolice'){
                this.reportedToPolice=event.target.value;
                this.showPoliceComments = this.reportedToPolice === 'Yes';
            }
            if(event.target.name=='clientConcerns'){
                this.clientConcerns=event.target.value;
            }
        }

     @track showPolice = false;
    handlePriorityChange(event) {
        this.priorityValue = event.detail.value;
        if(this.priorityValue == 'High'){
            this.showPolice = true;
        } else {
            this.showPolice = false;
        }
    } 

    handleUpdate3() {
        // Handle update logic here
       // console.log('Update clicked');
    }

    handleCancel3() {
        this.closeModel();
    }

    handleCancel4() {
        this.closeModel();
    }

    closeModel(){
        localStorage.removeItem('issueFormData');
        localStorage.removeItem('issueFormData1');
        localStorage.removeItem('issueFormData3');
        this.isOpenModal = false;
        this.issueparent = true;
        this.firstName = '';
        this.lastName = '';
       // this.role = '';
        this.facilityName = '';
        this.client = '';
        this.status = '';
        this.priority1 = '';
        this.email = '';
        this.phone = '';
        this.priorityValue = '';
        this.raisedByValue = '';
        this.issueTypeValue = '';
        this.incidentDateTime = '';
        this.allegedDateTime = '';
        this.description = '';
        this.reportedToPolice = '';
        this.clientConcerns = '';
        this.showPoliceComments = false;
        this.policeComments='';
        this.actionsTaken ='';
        this.additionalInfo='';
        this.futureActions='';
        this.currentStep = 'step1';
        this.isFormSaved=false;
        this.isFormSaved2=false;
        this.isFormSaved3=false;
        this.partcipantValue='';
        this.subContractor='';
        this.facilityName1 = '';
        this.client1 = '';
        this.stafflabel1 = '';
        this.staffName1 = '';
        this.staffName = '';
        this.stafflabel = '';
        this.mostRelevantOtherValue='';
        this.name='';
        this.designation='';
        this.signatureImage='';
        this.startTimeSelectedHour='';
        this.startTimeSelectedMinute='';
        this.AddShiftStartTimeAMPM2='';
        this.startTimeAMPM='';
        this.endTimeSelectedHour='';
        this.endTimeSelectedMinute='';
        this.AddShiftEndTimeAMPM1='';
        this.endTimeAMPM='';
    }

    handlePrevious3() {
        this.currentStep ='step2';
    }

    handleNext3() { 
        this.handleSave3();  
        if (!this.clientConcerns || !this.actionsTaken || !this.additionalInfo || !this.futureActions || !this.name || !this.designation ) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error!!',
                    message: 'Complete required fields.',
                    variant: 'error',
                }),
            );
            this.isFormSaved3 = false;
           // console.log('Handle Save3>>'+isFormSaved3);
        }     
        if (this.isFormSaved3) {
             if (this.canvas && !this.isCanvasBlank(this.canvas)) {
                /* this.signatureImage = this.canvas.toDataURL(); */
                const dataURL = this.canvas.toDataURL();
                 const imgHTML = `<img src="${dataURL}" alt="Signature" style="max-width:100%; height:auto;" />`;
                 this.signatureImage = imgHTML;
            }
            this.currentStep ='step4';
             this.canvasInitialized=false;
        } /* else {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error!!',
                    message: 'Please save the form before proceeding to the next step.',
                    variant: 'error',
                }),
            );
        } */
    }   
    
    isCanvasBlank(canvas) {
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    return canvas.toDataURL() === blank.toDataURL();
}
     
    handlePrevious4() {
        this.currentStep ='step3';
    }
        
    handleFinalise(event) { 
        try{ 

            let missingFields = [];

        if (!this.userFName) missingFields.push('First Name');
        if (!this.userLName) missingFields.push('Last Name');
        if (!this.client) missingFields.push('Client');
        if (!this.facilityName) missingFields.push('Facility');
        if (!this.email) missingFields.push('Email');
        if (!this.phone) missingFields.push('Phone');
        if (!this.staffName1) missingFields.push('Assigned Staff');
        if (!this.role) missingFields.push('Role');
        if (!this.status) missingFields.push('Status');
        if (!this.priorityValue) missingFields.push('priorityValue');

        if (missingFields.length > 0) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Missing Required Fields',
                    message: `Please complete the following: ${missingFields.join(', ')}`,
                    variant: 'error',
                })
            );
            return;
        }

           const signerDetails = {
                name: this.name,
                designation: this.designation,
                signature: this.signatureImage,
                mostReleventOthers:this.mostRelevantOtherValue 
            };
            console.log('signerDetails',JSON.stringify(signerDetails));
             console.log('stafid',this.staffid);
            if(!this.recordId){     
            saveCaseRecord({ organisationName: this.orgId, firstName: this.FName, others:this.others, lastName: this.LName, clientId: this.client, facilityId: this.facilityName, role:this.role, email:this.email, phone: this.phone, status: this.status,
                priorityValue: this.priorityValue, raisedByValue: this.raisedByValue, issueTypeValue: this.issueTypeValue, allegedDate: this.allegedDate, allegedTime: this.allegedTime, incidentDate: this.incidentDate, incidentTime: this.incidentTime, description: this.description,
                reportToPolice: this.reportedToPolice, regardingtheIssue: this.clientConcerns, policeComments: this.policeComments, actionsTaken: this.actionsTaken, additionalInfo: this.additionalInfo, futureActions: this.futureActions,
                participantValue: this.partcipantValue, subContractorValue: this.subContractor,selectedParticipant: this.client1,selectedFacility: this.facilityName1,selectedStaff: this.staffName,selectedEmployee:this.staffName1,staffid:this.staffid, jsonsignature: JSON.stringify(signerDetails)}).then((response) => {                   
                    if(this.fileName.length > 0){
                       // console.log('FileName>>>>'+JSON.stringify(this.base64FileData));
                        uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId: response.Id,obj:'case'})
                        .then(result => {
                           // console.log('Upload result = ' +result);
                            this.fileName = this.fileName + ' - Uploaded Successfully';            
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: 'Success!!',
                                    message: this.file.name + ' - Uploaded Successfully!!!',
                                    variant: 'success',
                                }),
                            );
                        }).catch(error => {
                           // window.console.log(error);
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: 'Error in uploading File',
                                    message: error.message,
                                    variant: 'error',
                                }),
                            );
                            this.showSpinner = false;
                        });
                    }   
                    
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Details inserted successfully',
                            variant: 'success'
                        })
                    );
                    this.closeModel();
                    this.currentStep ='step1';
                    setTimeout(() => {
                       // this.fetchIssues();
                        this.getissues();
                    }, 1000);  
                    
                });
            }
            else{
                console.log('most relevent others '+this.status);
                /* if (this.status === 'Resolved') {
                    console.log('status',this.status);
                    this.generatePdf(this.recordId); // Pass the record Id for the PDF generation
                }
                */
                updateCaseRecord({ recordId: this.recordId,organisationName: this.orgId, firstName: this.FName, others:this.others, lastName: this.LName, clientId: this.client, facilityId: this.facilityName, role:this.role, email:this.email, phone: this.phone, status: this.status,
                    priorityValue: this.priorityValue, raisedByValue: this.raisedByValue, issueTypeValue: this.issueTypeValue, allegedDate: this.allegedDate, allegedTime: this.allegedTime, incidentDate: this.incidentDate, incidentTime: this.incidentTime, description: this.description,
                    reportToPolice: this.reportedToPolice, regardingtheIssue: this.clientConcerns, policeComments: this.policeComments, actionsTaken: this.actionsTaken, additionalInfo: this.additionalInfo, futureActions: this.futureActions, selectedStaffLabel: this.stafflabel1,
                    participantValue: this.partcipantValue, subContractorValue: this.subContractor,selectedParticipant: this.client1,selectedFacility: this.facilityName1,selectedStaff: this.staffName,selectedEmployee:this.staffName1 , jsonsignature: JSON.stringify(signerDetails)}).then((response) => {                         
                        if(this.fileName.length > 0){
                            uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId: response.Id,obj:'case'})
                            .then(result => {
                               // console.log('Upload result = ' +result);
                                this.fileName = this.fileName + ' - Uploaded Successfully';            
                                this.dispatchEvent(
                                    new ShowToastEvent({
                                        title: 'Success!!',
                                        message: this.file.name + ' - Uploaded Successfully!!!',
                                        variant: 'success',
                                    }),
                                );
                            }).catch(error => {
                               // window.console.log(error);
                                this.dispatchEvent(
                                    new ShowToastEvent({
                                        title: 'Error in uploading File',
                                        message: error.message,
                                        variant: 'error',
                                    }),
                                );
                                this.showSpinner = false;
                            });
                        }   
                        
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Success',
                                message: 'Details Updated successfully',
                                variant: 'success'
                            })
                        );
                       
                        this.closeModel();
                        this.currentStep ='step1';
                        setTimeout(() => {
                           // this.fetchIssues();
                            this.getissues();
                        }, 1000);  

                      
                        
                    });
            }      
                                
        }catch(error) { 
               // console.error('Error creating case:', error); 
        } 

        this.closeModel();     
    }


    
    
    handleInputChange(event){
        this.policeComments=event.target.value;
    }    
    
    handleInputChange1(event){
        this.actionsTaken=event.target.value;
    }

    handleInputChange2(event){
        this.additionalInfo = event.target.value;
    }

    handleInputChange3(event){
        this.futureActions = event.target.value;
    }
    
    handleInputChange4(event) {
        const field = event.target.dataset.id;
        const value = event.detail.value;

        if (field === 'name') {
            this.name = value;
        } else if (field === 'designation') {
            this.designation = value;
        }

        
    }

    handleEdit1(event){
        this.currentStep ='step1';
    }
    handleEdit2(event){
        this.currentStep ='step2';
       // console.log('Step2>>>'+this.currentStep);
    }
    handleEdit3(event){
        this.currentStep ='step3';
    }

    @track isModalOpen = false;
    @track currentUrl;

    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
       // console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
        /* const fileType = this.getFileType(this.currentUrl); */
        
        //console.log('file type: ' + fileType);
        // Check if the file type is not PNG or PDF
        /*  if (fileType !== 'png' && fileType !== 'pdf' && fileType !== 'jpeg' && fileType !== 'csv' && fileType !== 'svg') {
            setTimeout(() => {
                this.closeModal();
            }, 1700);            
        } */  
    }

    closeModal() {
        this.isModalOpen = false;
        this.currentUrl = null;
    }

    getFileType(url) {
        const fileName = url.substring(url.lastIndexOf('/') + 1);
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }
     @track caseid;
    @track casestatus;
    caseData;
    handlepdf(event){
        this.caseid=event.currentTarget.dataset.id;
        this.casestatus=event.currentTarget.dataset.status;
        console.log('case id',this.caseid);
        console.log('casestatus',this.casestatus);
        if(this.casestatus === 'Resolved' )
        {
            console.log('generate pdf');
            getIssuesbyId({ caseid: this.caseid })
            .then(data => {
                this.caseData = data;
                console.log('Case Data:', JSON.stringify(this.caseData));
                
                    this.generatePdf(this.caseData); // Pass the correct object directly
            
            })
            .catch(error => {
                console.error('Error retrieving case data:', error);
            });
        }else{
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Issue Not Resolved',
                    message: 'You cannot generate a PDF.',
                    variant: 'error',
                }),
            );
        }
        
        

    } 

   async generatePdf(caseRecord) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.addImage(this.blobData, "PNG", 18, 10, 70, 18);
    
        // Utility function to strip HTML tags from the text
        const stripHtml = (html) => {
            const div = document.createElement('div');
            div.innerHTML = html;
            return div.textContent || div.innerText || '';
        };

        // const parseHtmlContent = (html) => {
        //     const div = document.createElement('div');
        //     div.innerHTML = html;
        //     const text = div.textContent || div.innerText || '';
        
        //     const images = [];
        //     const imgTags = div.querySelectorAll('img');
        //     imgTags.forEach(img => {
        //         let src = img.getAttribute('src');
        //         if (src) {
        //             if (src.startsWith('/servlet')) {
        //                 // Append directly, avoid relying on window.location.origin inside async/canvas context
        //                 src = 'https://tesseractapps--prashanth.sandbox.my.site.com' + src;
        //             } else if (src.startsWith('data:image')) {
        //                 // base64 embedded image, use as-is
        //             } else if (!src.startsWith('http')) {
        //                 // relative path fallback (optional)
        //                 src = window.location.origin + '/' + src;
        //             }
        //             images.push(src);
        //         }
        //     });
        //     console.log('Images found in HTML:', images);

        //     return { text, images };
        // };
        
        const parseHtmlContent = (html) => {
            const div = document.createElement('div');
            div.innerHTML = html;
            const text = div.textContent || div.innerText || '';
        
            const images = [];
            const imgTags = div.querySelectorAll('img');
            imgTags.forEach(img => {
                let src = img.getAttribute('src');
                if (src) {
                    images.push(src);
                }
            });
        
            return { text, images };
        };
        
    
        // Utility function to format the date and time
        const formatDateTime = (date, time) => {
            if (!date) return 'N/A';
            const dateObj = new Date(date);
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = dateObj.getFullYear();
            const formattedDate = `${day}/${month}/${year}`;
    
            if (time) {
                const [hours, minutes] = time.split(':');
                const timeObj = new Date(dateObj.setHours(hours, minutes));
                const formattedTime = timeObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                return `${formattedDate}, ${formattedTime}`;
            }
            return formattedDate;
        };
        const loadImageAsBase64 = (url) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous'; // Required for cross-origin requests
                img.src = url;
    
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png')); // Convert to base64
                };
    
                img.onerror = () => reject(new Error('Failed to load image'));
            });
        };
        // Configure font and heading
        doc.setFont('Roboto');
        doc.setFontSize(14);
        doc.setFont('Roboto', 'bold');
        doc.text(`Incident Report - ${caseRecord.CaseNumber || 'N/A'}`, 140, 20);
    
        let currentY = 40;
        const maxWidth = 170;
    
        // Function to add a new page if content goes beyond the page limit
        const addNewPageIfNeeded = (contentHeight) => {
            if (currentY > 267) {
                doc.addPage("a4", "portrait");
                currentY = 20;
            }
        };
    
        // const addLabelAndText = (label, text) => {
        //     doc.setFontSize(12);
        //     doc.setFont('Roboto', 'bold');
    
        //     // Split label text if it exceeds max width
        //     const labelLines = doc.splitTextToSize(label, maxWidth);
        //     labelLines.forEach((line, index) => {
        //         doc.text(line, 20, currentY + (index * 6)); // Draw each line of the label
        //     });
        //     currentY += labelLines.length * 6;
    
        //     // Move to the next line and add the text content after the label
        //     doc.setFont('Roboto', 'normal');
        //     const textLines = doc.splitTextToSize(text.trim(), maxWidth);
        //     const lineHeight = 6; // Adjust line height if needed
        //     const contentHeight = textLines.length * lineHeight;
    
        //     addNewPageIfNeeded(contentHeight); // Add new page if needed
    
        //     textLines.forEach((line, index) => {
        //         doc.text(line, 20, currentY + (index * lineHeight));
        //     });
        //     currentY += contentHeight + 4; // Adjust spacing after each entry
        // };

        const extractRefIdFromUrl = (url) => {
            console.log('🔍 Extracting refId from URL:', url);
            const match = url.match(/refid=([a-zA-Z0-9]+)/);
            if (match) {
                console.log('✅ Extracted refId:', match[1]);
            } else {
                console.warn('⚠️ No refId found in URL:', url);
            }
            return match ? match[1] : null;
        };
        
        const addImageFromSalesforce = async (url) => {
            const refId = extractRefIdFromUrl(url);
            if (!refId) {
                console.warn('❌ Invalid or missing refid in image URL, skipping:', url);
                return;
            }
        
            try {
                console.log('📡 Fetching base64 from Apex for refId:', refId);
                const base64 = await getImageAsBase64({ refId });
                if (base64) {
                    console.log('✅ Base64 image data received. Rendering to PDF...');
                    doc.addImage(`data:image/png;base64,${base64}`, 'PNG', 25, currentY, 60, 40);
                    currentY += 50;
                } else {
                    console.warn('⚠️ No base64 data returned from Apex for refId:', refId);
                }
            } catch (error) {
                console.error('❌ Failed to fetch/render image from Salesforce:', error);
            }
        };
        
        const addLabelAndText = async (label, htmlContent) => {
            doc.setFontSize(12);
            doc.setFont('Roboto', 'bold');
        
            const labelLines = doc.splitTextToSize(label, maxWidth);
            labelLines.forEach((line, index) => {
                doc.text(line, 20, currentY + (index * 6));
            });
            currentY += labelLines.length * 6;
        
            doc.setFont('Roboto', 'normal');
            const { text, images } = parseHtmlContent(htmlContent || 'N/A');
        
            console.log('📝 Rendering label:', label);
            console.log('🖼️ Found images in HTML:', images);
        
            const textLines = doc.splitTextToSize(text.trim(), maxWidth);
            const lineHeight = 6;
            const contentHeight = textLines.length * lineHeight;
            addNewPageIfNeeded(contentHeight);
            textLines.forEach((line, index) => {
                doc.text(line, 20, currentY + (index * lineHeight));
            });
            currentY += contentHeight + 2;
        
            for (const imgUrl of images) {
                try {
                    if (imgUrl.includes('/servlet/rtaImage?refid=')) {
                        console.log('🖼️ Processing Salesforce-hosted image:', imgUrl);
                        await addImageFromSalesforce(imgUrl);
                    } else {
                        console.log('🌐 Processing external/public image:', imgUrl);
                        const imgData = await loadImageAsBase64(imgUrl);
                        addNewPageIfNeeded(60);
                        doc.addImage(imgData, 'PNG', 25, currentY, 60, 40);
                        currentY += 50;
                    }
                } catch (err) {
                    console.warn('❌ Failed to load/render embedded image:', imgUrl, err);
                }
            }
        
            currentY += 4;
        };

        const addSectionHeading = (label) => {
            doc.setFontSize(14);
            doc.setFont('Roboto', 'bold');

            const labelLines = doc.splitTextToSize(label, maxWidth);
            labelLines.forEach((line, index) => {
                doc.text(line, 20, currentY + (index * 6));
            });
            currentY += labelLines.length * 6 + 4; // add some spacing after
        };

        
    
    
        // Reporter Details Section
        //addLabelAndText('Reporter Details', '');
        addSectionHeading('Reporter Details');
        addLabelAndText('First Name:', caseRecord.First_Name__c || 'N/A');
        addLabelAndText('Last Name:', caseRecord.Last_Name__c || 'N/A');
        addLabelAndText('Participant:', caseRecord.Client_Name__c || 'N/A');
        addLabelAndText('Email:', caseRecord.Email__c || 'N/A');
        addLabelAndText('Phone:', caseRecord.Phone_Number__c || 'N/A');
        addLabelAndText('Role:', caseRecord.Role__c || 'N/A');
        addLabelAndText('Facility Name:', caseRecord.Facility_Name__c || 'N/A');
        addLabelAndText('Status:', caseRecord.Status_1__c || 'N/A');
        addLabelAndText('Assign to:', caseRecord.Assign_to_1__r?.NameToDisplay__c || 'N/A');
    
        // Separator line
        doc.line(20, currentY, 190, currentY);
        currentY += 10;
    
        // Incident Details Section
        addSectionHeading('Incident Details');
       // addLabelAndText('Incident Details', '');
        addLabelAndText('Priority of the incident:', caseRecord.Priority || 'N/A');
        const incidentDateTime = formatDateTime(caseRecord.Date_of_Incident__c, caseRecord.Incident_Time__c);
        const allegedDateTime = formatDateTime(caseRecord.Alleged_Date__c, caseRecord.Alleged_Time__c);
        
        addLabelAndText('Date and Time of the incident:', incidentDateTime || 'N/A');
        addLabelAndText('Date and Time of the incident occurred:', allegedDateTime || 'N/A');
        
        addLabelAndText('Select the most relevant incident type:', caseRecord.Revelant_Issue_Type__c || 'N/A');
            if(caseRecord.Revelant_Issue_Type__c === 'Other'){
                
                addLabelAndText('', stripHtml(caseRecord.Most_Relevant_Others__c) || 'N/A');
            }
       
        addLabelAndText('People involved in this incident:', caseRecord.Allegation__c || 'N/A');
        if (caseRecord.Allegation__c === 'Participants Representative') {
            addLabelAndText('', stripHtml(caseRecord.Participant_Representative__c) || 'N/A');
        } else if (caseRecord.Allegation__c === 'Sub - Contractor') {
            addLabelAndText('', stripHtml(caseRecord.Sub_Contractor__c) || 'N/A');
        } else if (caseRecord.Allegation__c === 'Participant') {
            addLabelAndText('', stripHtml(caseRecord.Client_Name__c) || 'N/A');
        } else if (caseRecord.Allegation__c === 'Employee') {
           let employee= this.staffOptions2.find(rec=>rec.value==caseRecord.Assign_to__c).label;
            addLabelAndText('', stripHtml(employee) || 'N/A');
        } else if (caseRecord.Allegation__c === 'Facility') {
            let facilityname= this.facilityOptions.find(rec=>rec.value==caseRecord.Facility_Name_1__c).label;

            addLabelAndText('', stripHtml(facilityname) || 'N/A');
        } else if (caseRecord.Allegation__c === 'Other') {
            addLabelAndText('', stripHtml(caseRecord.Allegation_description__c) || 'N/A');
        }
       
        addLabelAndText('Please provide a detailed description of the incident:', stripHtml(caseRecord.Description) || 'N/A');
   
        
        doc.line(20, currentY, 190, currentY);
        currentY += 10;
        // Action Taken Section
        addSectionHeading('Action Taken');
       // addLabelAndText('Action Taken', '');
        if(caseRecord.Priority === 'High'){
            addLabelAndText('Has the incident been reported to the police?', caseRecord.Reported_to_the_Police__c || 'N/A');
       if(caseRecord.Reported_to_the_Police__c === 'Yes'){
        
        addLabelAndText('Police Comments', stripHtml(caseRecord.Police_Comments__c) || 'N/A');
       }

        }
        addLabelAndText('Has the affected Participant’s representative expressed any ongoing concerns regarding the incident?', caseRecord.Regarding_the_Issue__c || 'N/A');
        addLabelAndText('What specific actions have been taken to ensure the health, safety and wellbeing of the Participant’s involved?',caseRecord.Description1__c || 'N/A');
        addLabelAndText('Is there any other information or details you wish to include in relation to this incident?', stripHtml(caseRecord.Description2__c) || 'N/A');
        addLabelAndText('What specific actions have been taken to manage or minimise the risk of recurrence of this or a similar incident in future?', stripHtml(caseRecord.Description3__c) || 'N/A');
        
        
                    // Signature Section (Right-aligned)
           

            const { images: signatureImages } = parseHtmlContent(caseRecord.Signature__c || '');

            const signatureX = 140; // Adjust X to align right (130–150 based on page width)
            const signatureWidth = 50;
            const signatureHeight = 15;

            let hasSignatureImage = false;

            if (signatureImages.length > 0) {
                for (const imgUrl of signatureImages) {
                    try {
                        if (imgUrl.includes('/servlet/rtaImage?refid=')) {
                            const refId = extractRefIdFromUrl(imgUrl);
                            if (refId) {
                                const base64 = await getImageAsBase64({ refId });
                                if (base64) {
                                    doc.addImage(`data:image/png;base64,${base64}`, 'PNG', signatureX, currentY, signatureWidth, signatureHeight);
                                    hasSignatureImage = true;
                                    break;
                                }
                            }
                        } else {
                            const imgData = await loadImageAsBase64(imgUrl);
                            doc.addImage(imgData, 'PNG', signatureX, currentY, signatureWidth, signatureHeight);
                            hasSignatureImage = true;
                            break;
                        }
                    } catch (err) {
                        console.error('❌ Failed to load signature image:', imgUrl, err);
                    }
                }
            }

            if (hasSignatureImage) {
                currentY += signatureHeight + 8;

                const name = caseRecord.Reviewer_Name__c || 'N/A';
                const role = caseRecord.Designation__c || 'N/A';

                // Center the name below the signature image
                doc.setFontSize(12);
                doc.setFont('Roboto', 'bold');
                const nameWidth = doc.getTextWidth(name);
                const nameX = signatureX + (signatureWidth - nameWidth) / 2;
                doc.text(name, nameX, currentY);

                // Straight underline under the name (full width of signature area)
                currentY += 2;
                doc.setLineWidth(0.5);
                doc.line(signatureX, currentY, signatureX + signatureWidth, currentY);

                // Role below the line
                currentY += 8;
                doc.setFont('Roboto', 'normal');
                const roleWidth = doc.getTextWidth(role);
                const roleX = signatureX + (signatureWidth - roleWidth) / 2;
                doc.text(role, roleX, currentY);

                currentY += 10;
            } else {
                // Fallback if no image
                doc.setFontSize(12);
                doc.setFont('Roboto', 'normal');
                doc.text('Signature: N/A', signatureX, currentY);
                currentY += 10;
            }

                
    

        const addImageToPdf = async (url) => {
            try {
                const base64Image = await loadImageAsBase64(url);
                doc.addImage(base64Image, 'PNG', 15, 40, 180, 120); // Adjust position and size as needed
            } catch (error) {
                console.error('Error loading image:', error);
            }
        };
        addImageToPdf(caseRecord.Amazon_URL__c);
        console.log('url',caseRecord.Amazon_URL__c);
        // Save the PDF
        doc.save(`Case_${caseRecord.CaseNumber}_Details.pdf`);
    }

    
    get iconName() {
        if (this.isListening) {
             return 'utility:unmuted';
        } else {
             return 'utility:muted';
        }
     }
         
      // Alternative text for accessibility
     get altText() {
         if (this.isListening) {
              return 'Unmute';
         } else {
             return 'Mute';
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
             console.error('Error in toggleListening:', error.message);
         }
     }
     // Show icons when text area gains focus
     handleFocus() {
         console.log('handleFocus executing >>');
         try {
             this.showMuteIcon = true;
             if (this.recognition) {
                this.recognition.stop(); // Stop any ongoing recognition process
                this.recognition = null; // Clear recognition instance
             }
         } catch (error) {
             console.error('Error in handleFocus:', error.message);
         }
     }
     // Start speech recognition
     startListening() {
         try {
             console.log('Listening started...');
             if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
                 const SpeechRecognition =
                     window.SpeechRecognition || window.webkitSpeechRecognition;
                 const recognition = new SpeechRecognition();
                 recognition.lang = 'en-US';
                 recognition.continuous = true;
                 recognition.interimResults = false;
 
                 recognition.onresult = (event) => {
                     this.description += Array.from(event.results)
                         .map((result) => result[0].transcript)
                         .join('');
                     this.showClearIcon = true; // Show clear icon after transcription
                 };
 
                 recognition.onerror = (event) => {
                     console.error('Error during speech recognition:', event.error);
                 };
 
                 recognition.onend = () => {
                     console.log('Recognition ended');
                     this.isListening = false;
                 };
 
                 recognition.start();
                 this.recognition = recognition;
             } else {
                 console.error('SpeechRecognition API not supported by this browser.');
                 alert('SpeechRecognition API is not supported in this browser.');
             }
         } catch (error) {
             console.error('Error in startListening:', error.message);
         }
     }
 
     // Stop speech recognition
     stopListening() {
         try {
             console.log('Listening stopped...');
             if (this.recognition) {
                 this.recognition.stop();
                 this.recognition = null;
             }
         } catch (error) {
             console.error('Error in stopListening:', error.message);
         }
     }
 
     // Clear text and hide clear icon
     clearText() {
         try {
             this.description = '';
             this.showClearIcon = false;
             if (this.isListening) {
                //this.startListening();
                this.stopListening();
                this.description = '';
               } 
         } catch (error) {
             console.error('Error in clearText:', error.message);
         }
        
     }

     handleCsvExport(event) {
        const caseId = event.currentTarget.dataset.id;
        const caseStatus = event.currentTarget.dataset.status;
    
       
    
        getIssuesbyId({ caseid: caseId })
            .then(caseRecord => {
                const stripHtml = (html) => {
                    const div = document.createElement('div');
                    div.innerHTML = html;
                    return div.textContent || div.innerText || '';
                };
    
                const formatDateTime = (date, time) => {
                    if (!date) return 'N/A';
                    const dateObj = new Date(date);
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const year = dateObj.getFullYear();
                    const formattedDate = `${day}/${month}/${year}`;
                    if (time) return `${formattedDate}, ${time}`;
                    return formattedDate;
                };
    
                const rows = [];
    
                // === Reporter Details ===
                rows.push(['Section', 'Reporter Details']);
                rows.push(['First Name:', caseRecord.First_Name__c || 'N/A']);
                rows.push(['Last Name:', caseRecord.Last_Name__c || 'N/A']);
                rows.push(['Participant:', caseRecord.Client_Name__c || 'N/A']);
                rows.push(['Email:', caseRecord.Email__c || 'N/A']);
                rows.push(['Phone:', caseRecord.Phone_Number__c || 'N/A']);
                rows.push(['Role:', caseRecord.Role__c || 'N/A']);
                //rows.push(['Role:', caseRecord.StaffRole__c ? rec.StaffRole__c : rec.Role__c || 'N/A']);
                rows.push(['Facility Name:', caseRecord.Facility_Name__c || 'N/A']);
                rows.push(['Status:', caseRecord.Status_1__c || 'N/A']);
                rows.push(['Assign to:', caseRecord.Assign_to_1__r?.NameToDisplay__c || 'N/A']);
    
                // === Incident Details ===
                rows.push(['Section', 'Incident Details']);
                rows.push(['Priority of the incident:', caseRecord.Priority || 'N/A']);
                rows.push(['Date and Time of the incident:', formatDateTime(caseRecord.Date_of_Incident__c, caseRecord.Incident_Time__c)]);
                rows.push(['Date and Time of the incident occurred:', formatDateTime(caseRecord.Alleged_Date__c, caseRecord.Alleged_Time__c)]);
                rows.push(['Select the most relevant incident type:', caseRecord.Revelant_Issue_Type__c || 'N/A']);
                if (caseRecord.Revelant_Issue_Type__c === 'Other') {
                    rows.push(['', stripHtml(caseRecord.Most_Relevant_Others__c || 'N/A')]);
                }
    
                rows.push(['People involved in this incident:', caseRecord.Allegation__c || 'N/A']);
                if (caseRecord.Allegation__c === 'Participants Representative') {
                    rows.push(['', stripHtml(caseRecord.Participant_Representative__c || 'N/A')]);
                } else if (caseRecord.Allegation__c === 'Sub - Contractor') {
                    rows.push(['', stripHtml(caseRecord.Sub_Contractor__c || 'N/A')]);
                } else if (caseRecord.Allegation__c === 'Participant') {
                    rows.push(['', stripHtml(caseRecord.Client_Name__c || 'N/A')]);
                } else if (caseRecord.Allegation__c === 'Employee') {
                    const staffName = this.staffOptions2.find(rec => rec.value === caseRecord.Assign_to__c)?.label || 'N/A';
                    rows.push(['', stripHtml(staffName)]);
                } else if (caseRecord.Allegation__c === 'Facility') {
                    const facilityName = this.facilityOptions.find(rec => rec.value === caseRecord.Facility_Name_1__c)?.label || 'N/A';
                    rows.push(['', stripHtml(facilityName)]);
                } else if (caseRecord.Allegation__c === 'Other') {
                    rows.push(['', stripHtml(caseRecord.Allegation_description__c || 'N/A')]);
                }
    
                rows.push(['Please provide a detailed description of the incident:', stripHtml(caseRecord.Description || 'N/A')]);
    
                // === Action Taken ===
                rows.push(['Section', 'Action Taken']);
                if (caseRecord.Priority === 'High') {
                    rows.push(['Has the incident been reported to the police?', caseRecord.Reported_to_the_Police__c || 'N/A']);
                    if (caseRecord.Reported_to_the_Police__c === 'Yes') {
                        rows.push(['Police Comments', stripHtml(caseRecord.Police_Comments__c || 'N/A')]);
                    }
                }
    
                rows.push([
                    'Has the affected Participants representative expressed any ongoing concerns regarding the incident?',
                    caseRecord.Regarding_the_Issue__c || 'N/A'
                ]);
                rows.push([
                    'What specific actions have been taken to ensure the health, safety and wellbeing of the Participant’s involved?',
                    stripHtml(caseRecord.Description1__c || 'N/A')
                ]);
                rows.push([
                    'Is there any other information or details you wish to include in relation to this incident?',
                    stripHtml(caseRecord.Description2__c || 'N/A')
                ]);
                rows.push([
                    'What specific actions have been taken to manage or minimise the risk of recurrence of this or a similar incident in future?',
                    stripHtml(caseRecord.Description3__c || 'N/A')
                ]);
    
                // Optional image link
                if (caseRecord.Amazon_URL__c) {
                    rows.push(['Attachment Image URL', caseRecord.Amazon_URL__c]);
                }
    
                // === Generate CSV string ===
                const csvContent = rows.map(r =>
                    r.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')
                ).join('\n');
    
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', `Case_${caseRecord.CaseNumber}_Details.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .catch(error => {
                console.error('Error generating CSV:', error);
            });
    }
    

    logFormEditHistory() {
        getPreviousFormData({ responseId: this.selectedResponseId })
            .then(prevRecord => {
                const prevJsonRaw = prevRecord.Response_JSON__c || '[]';
                const prevJson = JSON.parse(prevJsonRaw);
                const currentJson = JSON.parse(JSON.stringify(this.tableRows));  // Assuming tableRows holds the current form data

                const historyLog = prevRecord.History_Log__c ? JSON.parse(prevRecord.History_Log__c) : [];

                const prevMap = this.extractFieldMap(prevJson);
                const currMap = this.extractFieldMap(currentJson);

                const prevAssigned = prevMap.get('assigned to') || '';
                const newAssigned = currMap.get('assigned to') || '';
                const prevStatus = prevMap.get('status') || '';
                const newStatus = currMap.get('status') || '';

                const changes = [];
                if (prevAssigned !== newAssigned) {
                    changes.push(`Assigned To: '${prevAssigned || 'None'}' → '${newAssigned || 'None'}'`);
                }

                if (prevStatus !== newStatus) {
                    changes.push(`Status: '${prevStatus || 'None'}' → '${newStatus || 'None'}'`);
                }

                if (changes.length === 0) return;

                const logEntry = {
                    timestamp: this.formatTimestamp(new Date()),
                    user: `${this.firstName} ${this.lastName}`,
                    action: 'Edited Form',
                    content: changes.join('; ')
                };

                historyLog.push(logEntry);

                return updateCaseRecord({
                    responseId: this.selectedResponseId,
                    historyLog: JSON.stringify(historyLog)
                });
            })
            .then(result => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Success',
                    message: 'Form history logged successfully',
                    variant: 'success'
                }));
            })
            .catch(error => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error',
                    message: 'Error logging form history',
                    variant: 'error'
                }));
                console.error(error);
            });
    }

    get hasFormHistory() {
    return this.groupedFormHistory && this.groupedFormHistory.length > 0;
}


    extractFieldMap(rows) {
        const map = new Map();
        rows.forEach(row => {
            row.cells.forEach(cell => {
                const label = cell.field?.label?.trim().toLowerCase();
                const value = cell.field?.value;
                if (label) {
                    map.set(label, value ?? '');
                }
            });
        });
        return map;
    }

    formatTimestamp(date) {
        const options = { month: 'short', day: '2-digit', year: 'numeric' };
        const datePart = date.toLocaleDateString('en-US', options).replace(',', '');
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
        const timePart = date.toLocaleTimeString('en-US', timeOptions).toLowerCase();
        return `${datePart.toUpperCase()} ${timePart}`;
    }
    
    @track showFormHistoryModal = false;
    @track groupedFormHistory = [];
    
    handleShowHistory(event) {
        const incidentId = event.currentTarget.dataset.id;
    
        getCaseHistoryLog({ caseId: incidentId })
            .then(rawHistory => {
                const history = JSON.parse(rawHistory || '[]');
                const grouped = this.groupHistoryByDate(history);
                this.groupedFormHistory = grouped;
                this.showFormHistoryModal = true;
            })
            .catch(error => {
                console.error('Error fetching history log:', error);
                this.groupedFormHistory = [];
                this.showFormHistoryModal = true;
            });
    }
    
    
    closeFormHistory() {
        this.showFormHistoryModal = false;
    }
    
    groupHistoryByDate(logEntries) {
        const grouped = {};
    
        logEntries.forEach(entry => {
            const [datePart, timePart] = entry.timestamp.split(' ');
            const initials = this.getInitials(entry.user);
    
            if (!grouped[datePart]) {
                grouped[datePart] = [];
            }
    
            grouped[datePart].push({
                ...entry,
                date: datePart,
                time: timePart,
                initials
            });
        });
    
        return Object.keys(grouped).map(date => ({
            date,
            entries: grouped[date]
        }));
    }
    
    getInitials(name) {
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('');
    }

    @track incidents = [];
    @track error;
    @api currentUserRole;   // you pass this role from parent or set it somewhere
    @api loggedInUserId;

   @wire(getIncidents, { 
        userRole: '$currentUserRole', 
        currentUserId: '$loggedInUserId' 
    })
    wiredIncidents({ error, data }) {
        if (data) {
            this.incidents = data;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.incidents = [];
            console.error('Error fetching incidents:', error);
        }
    }

    // Export CSV
    exportCSV() {
        if (!this.incidents || this.incidents.length === 0) {
            return;
        }
        console.log('Incidents:', JSON.stringify(this.incidents));

        const filteredIncidents = this.incidents.filter(
        rec => rec.Facility_Name__c === this.facilityLabelfromcatch);

        if (filteredIncidents.length === 0) {
            
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Warning',
                    message: 'No incidents found for the selected facility.',
                    variant: 'warning',
                }),
            );
            return;
        }

        const header = [
            'Incident Number',
            'Participant Name',
            'Facility Name',
            'Reporter Name',
            'Priority',
            'Assigned To',
            'Created On',
            'Status'
        ];

        const rows = filteredIncidents.map(inc => [
            `"${inc.CaseNumber}"`,
            `"${inc.Client_Name__c || ''}"`,
            `"${inc.Facility_Name__c || ''}"`,
            `"${(inc.First_Name__c || '') + ' ' + (inc.Last_Name__c || '')}"`,
            `"${inc.Assign_to_1__r ? inc.Assign_to_1__r.NameToDisplay__c : ''}"`,
            `"${inc.Priority || ''}"`,
            `"${new Date(inc.CreatedDate).toLocaleDateString()}"`,
            `"${inc.Status_1__c || ''}"`
        ]);

        let csvContent = header.join(",") + "\n";
        csvContent += rows.map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "incidents.csv";
        link.click();
    }

    canvas;
    context;
    isDrawing = false;
    @track signatureImage;
 
    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    getMousePosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        if (event.touches) {
            return {
                x: event.touches[0].clientX - rect.left,
                y: event.touches[0].clientY - rect.top
            };
        } else {
            return {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
        }
    }

    startDrawing(event) {
        this.isDrawing = true;
        const pos = this.getMousePosition(event);
        this.context.beginPath();
        this.context.moveTo(pos.x, pos.y);
        event.preventDefault();
    }

    draw(event) {
        if (!this.isDrawing) return;
        const pos = this.getMousePosition(event);
        this.context.lineTo(pos.x, pos.y);
        this.context.stroke();
        event.preventDefault();
        
    }

    stopDrawing() {
        this.isDrawing = false;
        this.context.closePath();

        
    }

    handleClearSignature() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    handleKeyShortcut(event) {
        if (event.ctrlKey && event.shiftKey && event.code === 'KeyC') {
            event.preventDefault();
            this.handleCreateIssue();
            }
    }
}