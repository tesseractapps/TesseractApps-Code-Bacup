import { LightningElement ,track,wire,api} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import My_Resource from "@salesforce/resourceUrl/myResource";
import FORM_FACTOR from '@salesforce/client/formFactor';
import taskDetails from '@salesforce/apex/TaskHandler.taskDetails';
import Id from '@salesforce/user/Id';
import { getRecord,getFieldValue  } from 'lightning/uiRecordApi';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import UserOrgName from '@salesforce/schema/User.Organization_Name__c';
import UserType from '@salesforce/schema/User.User_Type__c';
import getClientById from '@salesforce/apex/ClientDataController.getClientByEmail';
import { refreshApex } from '@salesforce/apex';
import UserEmail from '@salesforce/schema/User.Email';

//import getOrgName from '@salesforce/apex/TaskCreateHandler.getOrgName';
import getOrgLogo from '@salesforce/apex/TaskCreateHandler.getOrgLogo';
const fields = [UsrRoleName,UserOrgName];
export default class HomePageCommunity extends NavigationMixin (LightningElement) {
    @track todayDate = new Date().toLocaleDateString('en-GB');;
    @track taskDetailsValues=[];
    @track currentUserRole; 
    @track error;
    @track isExec=false;
    @track isManager=false;
    @track isStaff=false; 
    @track isOtherAccount=false;   
    @track isOrgName;
    @track isPinnacle=false;
    @track isTwentyFourCare=false;
    @track isAceInfoSystems=false;
    @track isSSSquareSystems=false;
    @track isAgeGraceInnovations=false;
    @api recordId;
    
    mainPage = My_Resource+'/myResource/images/Homepagebackground.png';
    admin = My_Resource+'/myResource/images/admin.svg';
    audit = My_Resource+'/myResource/images/auditor.svg';
    facility = My_Resource+'/myResource/images/facility.svg';
    HR = My_Resource+'/myResource/images/HR.svg';
    Issue = My_Resource+'/myResource/images/IncidentRegister.png';
    Notification = My_Resource+'/myResource/images/attendence.svg';
    SingIn = My_Resource+'/myResource/images/Signin_Payroll.png';
    payroll = My_Resource+'/myResource/images/Payroll2.svg';
    Search = My_Resource+'/myResource/images/Participants.svg';
    valut = My_Resource+'/myResource/images/repository.svg';
    tasks = My_Resource+'/myResource/images/TASKS.svg'; 
    myprofile = My_Resource+'/myResource/images/MyProfile.png';
    timesheet = My_Resource+'/myResource/images/Timesheet.jpeg';
    @track colorValue;
    @track orgName;
    @track orgLogo;
    @track contactNo;
    @track 	isOrgAdmin=false;
    @track 	isOutletAdmin=false;
    @track 	isRostermanager=false;
    @track 	isHrAdmin=false;
    @track 	isPayRollAdmin=false;
    @track 	isTesseractAdmin=false;
    @track 	isICtStaff=false;   
    @track 	isNDISStaff=false;
    @track  isIctAdmin=false;
    @track  isDevAdmin=false;
    @track isNdisParticipants=true;
    @track isPayrollAccountant=false;
    @track isPayrollAccountantforOrg = false;
    @track clientId;
    @track clientData=[];
    wiredClientResult
    @track currentUserEmail;
    @track isNdisParticipantsTask=true;

    @wire(getClientById, { email:'$currentUserEmail' })
    wiredClient(result) {
      this.wiredClientResult = result;
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
  
    @wire(getRecord, { recordId: Id, fields: [UsrRoleName,UserOrgName,UserType,UserEmail]}) 
    currentUserInfo({error, data}) {
      //  console.log('userid',Id);
       // console.log('data',JSON.stringify(data));
      //  console.log('error',JSON.stringify(error));        

        if (data) {
         //   this.currentUserRole =data.fields.UserRole.value.fields.Name.value;
            this.currentUserRole =data.fields.User_Role__c.value;
            //alert("Org UserRole: " + this.currentUserRole);
            this.isOrgName = data.fields.Organization_Name__c.value;
            //alert("Org isOrgName: " + this.isOrgName); 
            let usertype =data.fields.User_Type__c.value;
            this.currentUserEmail=data.fields.Email.value;
            console.log('User EMail >> '+ this.currentUserEmail);
           // console.log(' type of user '+usertype);
            if(usertype=='NDIS Org Admin' || usertype=='Tesseract Admin' ){
                this.isOrgAdmin=true;
                this.isNdisParticipants = false;
                this.isNdisParticipantsTask = false;
            }if(usertype=='ICT Admin'){
                this.isIctAdmin=true;
                this.isNdisParticipants = false;
                this.isNdisParticipantsTask = false;
            }
            if(usertype=='Outlet Admin'){
                this.isOutletAdmin=true;
                this.isNdisParticipants = false;
                this.isNdisParticipantsTask = false;
            }if(usertype=='Roster Manager'){
                this.isRostermanager=true;
                this.isNdisParticipants = false;
                this.isNdisParticipantsTask = false;
            }if(usertype=='HR Admin'){
                this.isHrAdmin=true;
                this.isNdisParticipants = false;
                this.isNdisParticipantsTask = false;
            }if(usertype=='Payroll Admin'){
                this.isPayRollAdmin=true;
                this.isNdisParticipants = false;
                this.isNdisParticipantsTask = false;
            }if(usertype=='Tesseract Admin'){
                this.isTesseractAdmin=true;
                this.isNdisParticipants = false;
                this.isNdisParticipantsTask = false;
            }if(usertype=='ICT Staff'){
                this.isICtStaff=true;
                this.isNdisParticipants = false;
                this.isNdisParticipantsTask = false;
            }if(usertype=='NDIS Staff'){
                this.isNDISStaff=true;
                this.isNdisParticipants = false;
                this.isNdisParticipantsTask = false;
            }
            if(usertype=='Dev Admin'){
                this.isDevAdmin=true;
                this.isNdisParticipants = false;
                this.isNdisParticipantsTask = false;
            }
            if(usertype=='NDIS Participants'){
                this.isNdisParticipants=true;
                setTimeout(() => {
                    refreshApex(this.wiredClientResult);                
                }, 4000);
                this.isNdisParticipantsTask = true;
            }
            if(usertype=='Payroll Accountant for Multiple'){
                this.isPayrollAccountant=true;
                this.isPayrollAccountantforOrg=false;
                this.isNdisParticipantsTask = true;
                this.isNdisParticipants = false;
            }
            if(usertype=='Accountant for Organisation'){
                this.isPayrollAccountantforOrg=true;
                this.isPayrollAccountant=false;
                this.isNdisParticipantsTask = true;
                this.isNdisParticipants = false;
            }
           console.log('role>>', this.currentUserRole);
        } else if (error) {
            this.error = error ;
        }
    }

    /*@wire(getRecord, { recordId: Id, orgfields: [UserOrgName]}) 
    currentUserInfo({error, data}) {
        console.log('userid',Id);
        console.log('data',JSON.stringify(data));
        console.log('error',JSON.stringify(error));        

        if (data) {
            this.isOrgName = data.orgfields.User_Organization_Name__c.value;
            //alert("Org Name: " + this.isOrgName);
            console.log("Org Name: " + this.isOrgName);
        }

    }*/

    connectedCallback(){        
   //     this.currentUserRole = this.role();
       // console.log('role>>', this.currentUserRole);
        taskDetails().then(response=>{
            //new Date().toLocaleDateString()
            response.forEach((record) => {
                let tempConRec = Object.assign({}, record);
                tempConRec.dueDate = new Date(tempConRec.ActivityDate).toLocaleDateString('en-GB');
              
                this.taskDetailsValues.push(tempConRec);         
            })
           // console.log('Task',JSON.stringify(this.taskDetailsValues));
            
        }).catch(err => {           
            console.log(err);
        });        
        getOrgLogo().then(result=>{
            //changes made by maheswari 17-04-2024
            //this.orgLogo = result;
            this.contactNo = result.Contact_No__c;
            this.orgName = result.Name.toUpperCase();
           // console.log('Result is>>>'+JSON.stringify(result));
           // console.log('Contact No>>>'+this.contactNo);
        })
       /*  getOrgName().then(result=>{
            this.orgName = result.toUpperCase();            
            console.log('Orgname>>'+this.orgName.toUpperCase());
        }) */
             this.disableRightClick();
            this.disableShortcuts(); 
    }

    taskEdit(event) {
        const taskType = event.currentTarget.dataset.type;
    
        if (taskType === 'Approval Request') {
            this[NavigationMixin.Navigate]({
                type: 'comm__namedPage',
                attributes: {
                    pageName: 'rostermanagement',
                },
                state: {
                    c__propertyValue: "Submissions",
                },
            });
        } 
        else if (taskType === 'Incident Register') {
            this[NavigationMixin.Navigate]({
                type: 'comm__namedPage',
                attributes: {
                    pageName: 'issueregister',
                },
                // Optionally add state if needed
            });
        } 
        else if (taskType === 'Leave Request') {
            this[NavigationMixin.Navigate]({
                type: 'comm__namedPage',
                attributes: {
                    pageName: 'humanresources',
                },
                state: {
                    c__propertyValue: "leaves",
                },
            });
        } 
        else {
            let taskId = event.currentTarget.dataset.id;
            /* this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: taskId,
                    objectApiName: 'Task',
                    actionName: 'edit',
                },
            }); */
        }
    }
    
    navigateToAdministrationPage(){
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                pageName: 'administration'                
            },
        });
    }

    navigateToIssueRegisterPage(){
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                pageName: 'incidentregister'
            },
        });
    }

    navigateToAuditPage(){
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                apiName: 'Inspection_New'
            },
        });
    }

    navigateToFacilityPage(){
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                apiName: 'Facility'
            },
        });
    }
    

    navigateToHRPage(){        
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                pageName: 'humanresources'
            },
        });        
    }
    navigateToMyProfilePage(){        
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                pageName: 'myprofile'
            },
        });        
    }

    navigateToPayRoll(){
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                pageName: 'payroll'                
            },
        });
    }    

    /*navigateToRepository(){      
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                pageName: 'Repository'
            },            
        });
    }*/

    navigateToRoasterManagement(){
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                pageName: 'rostermanagement'                
            },
        });
    }

    navigatetoSignin(){
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                pageName: 'signin'
            },
        }); 
    }

    navigateToICTTimeSheet(){
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                pageName: 'icttimesheet'
            },
        });
    }

    navigateToClientSearchPage(){
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                pageName: 'participant'
            },
        }); 
    }

    navigateToClientPage(){
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                pageName: 'participantlogin'
            },
        }); 
    }

    navigateToRepository(){
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                pageName: 'repository'
            },
        }); 
    }

    get isDesktop() {
        //alert(FORM_FACTOR);
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        return FORM_FACTOR === 'Small';
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
  
    @track updatedOrgLabel = ''; // Store the organization label passed from the child

    handleOrgUpdate(event) {
        const { orgName, orgLabel } = event.detail;
        this.orgName = orgName;
        this.updatedOrgLabel = orgLabel;
        console.log('Organization Name: ' + this.orgName);
        console.log('Organization Label: ' + this.updatedOrgLabel);
    }
    
  
}