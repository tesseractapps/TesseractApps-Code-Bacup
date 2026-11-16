import { LightningElement ,track} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import My_Resource from "@salesforce/resourceUrl/myResource";
import FORM_FACTOR from '@salesforce/client/formFactor';
import taskDetails from '@salesforce/apex/TaskHandler.taskDetails';
export default class HomePage extends NavigationMixin (LightningElement) {
    @track todayDate = new Date().toLocaleDateString('en-GB');;
    @track taskDetailsValues=[];
    
    admin = My_Resource+'/myResource/images/admin.svg';
    audit = My_Resource+'/myResource/images/auditor.svg';
    facility = My_Resource+'/myResource/images/facility.svg';
    HR = My_Resource+'/myResource/images/HR.svg';
    Issue = My_Resource+'/myResource/images/issues.svg';
    Notification = My_Resource+'/myResource/images/attendence.svg';
    payroll = My_Resource+'/myResource/images/payroll.svg';
    Search = My_Resource+'/myResource/images/Participants.svg';
    valut = My_Resource+'/myResource/images/repository.svg';
    tasks = My_Resource+'/myResource/images/TASKS.svg';
    @track colorValue;

    connectedCallback(){
       
        taskDetails().then(response=>{
            //new Date().toLocaleDateString()
            response.forEach((record) => {
                let tempConRec = Object.assign({}, record);
                tempConRec.dueDate = new Date(tempConRec.ActivityDate).toLocaleDateString('en-GB');
                console.log('tempConRec',JSON.stringify(tempConRec));
            this.taskDetailsValues.push(tempConRec);         
            })
            
        }).catch(err => {           
            console.log(err);
    });
    }

    taskEdit(event){
        let taskId=event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
                    attributes: {
                        recordId: taskId,
                        objectApiName: 'Task',
                        actionName: 'edit'
                    },
        });
    }
    navigateToAdministrationPage(){
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                apiName: 'Administration'
            },
        });
    }

    navigateToIssueRegisterPage(){
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                apiName: 'Issues_Register'
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
            type: 'standard__navItemPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                apiName: 'Human_Resources'
            },
        });
    }

    navigateToClientSearchPage(){
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                apiName: 'ClientSearch'
            },
        });
    }

    navigateToPayRoll(){
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                apiName: 'PayRoll_New'
            },
        });
    }

    navigateToRepository(){      
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                apiName: 'Repository'
            },
        });
    }

    /*navigateToRoasterManagement(){
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                apiName: 'Roster_Management'
            },
        });
    }*/

    navigateToRoasterManagement(){
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                apiName: 'Attendence'
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

    
  
}