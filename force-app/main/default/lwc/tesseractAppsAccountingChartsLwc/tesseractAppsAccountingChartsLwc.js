import { LightningElement ,track,api,wire} from 'lwc';
import CURRENT_USER_ID from '@salesforce/user/Id';
//import getstaffId from '@salesforce/apex/UserAccessController.getstaffId1';
import getCompany from '@salesforce/apex/CreateCompanyController.getCompany';
import { refreshApex } from '@salesforce/apex';

//import userId from '@salesforce/user/Id';
// import getShiftData from '@salesforce/apex/ShiftwithStaffController.getShiftData';

export default class TesseractAppsAccountingChartsLwc extends LightningElement {
    @track companyOptions = [];
    @track selectedCompany;
    userId = CURRENT_USER_ID;
    @api orgid;
    //@api selectedcompany;
    @track isTemplateVisible = false;
    @track isNdisOrgVisible = false;
    @track isNdisStaff = false;
    @track isNdisPayrollAdmin = false;
    @track isNdisHrAdmin = false;
    @track isIctAdmin = false;
    @track isIctStaff = false;
    @track IsNdisParticipant = false;
    @track Ispayroll = false;
    @track isSalesPurchases = false;
    @track isPayroll=true;
    @track isSales = false;
    @track isPurchases = false;
    @track isBalanceSheet = false;
    @track isProfitAndLoss = false;
    @track selectedCompanyName;
    wiredCompanyResult;
    //staffName;
    userType;
    connectedCallback(){
        console.log('orgid  in TesseractAppsAccountingChartsLwc :', this.orgid);
        const storedCompanyId = localStorage.getItem('selectedCompanyId');
        const storedCompanyName = localStorage.getItem('selectedCompanyName');
        if (storedCompanyId && storedCompanyName) {
            this.selectedCompany  = storedCompanyId;
            this.companyname = storedCompanyName;
            console.log('Company from localStorage connectedCallback TesseractAppsAccountingChartsLwc:', this.selectedcompany, this.companyname);
        } else {
            console.warn('No company info found in localStorage connectedCallback TesseractAppsAccountingChartsLwc');
        }
        console.log('selectedCompany  in TesseractAppsAccountingChartsLwc :', this.selectedCompany);
       //if(this.orgid){
           // refreshApex(this.wiredCompanyResult); 
       // }
       if (this.wiredCompanyResult) {
            refreshApex(this.wiredCompanyResult);
        }
       
        this.companyOptions = [...this.companyOptions];

        //console.log('selectedCompany :', this.selectedCompany); 
        
         
    }
    @wire(getCompany, { orgid:'$orgid'})
    wiredCompanies(result) {
          this.wiredCompanyResult = result;
         console.log('result===>'+JSON.stringify(result));
         const { data, error } = result;
        if (data) {
            console.log('data===>'+JSON.stringify(data));
            this.companyOptions = data.map(company => ({
                label: company.Company_Name__c,
                value: company.Id
            }));
           
            if (!this.selectedCompany && this.companyOptions.length > 0) {
                this.selectedCompany = this.companyOptions[0].value;
            }
            const selectedOption = this.companyOptions.find(
                option => option.value === this.selectedCompany
            );
            this.selectedCompanyName = selectedOption ? selectedOption.label : '';
            localStorage.setItem('selectedCompanyId', this.selectedCompany);
            localStorage.setItem('selectedCompanyName', this.selectedCompanyName);

            console.log('Stored in localStorage:', this.selectedCompany, this.selectedCompanyName);    
           // this.handleCompanyNavigation();
            console.log('this.companyOptions===>'+this.companyOptions);
            console.log('this.selectedCompany===>'+this.selectedCompany);
            console.log('this.selectedCompanyName===>'+this.selectedCompanyName);

            this.isSales = true;
            this.isPurchases = true;
            this.isSalesPurchases = true;
            this.isBalanceSheet = true;
            this.isProfitAndLoss = true;
        } else if (error) {
            console.error('Error fetching companies:', error);
        }
    }
     fetchReplist (){
        refreshApex(this.wiredCompanyResult);
        
    }
    // handleTaskEdit(event) {
    
    //     this.dispatchEvent(new CustomEvent('taskedit', {
    //         detail: event.detail,
    //         bubbles: true,
    //         composed: true
    //     }));
    // }

    handlechildevent(event) {
        console.log('Event from child: ' + JSON.stringify(event.detail));
        console.log('Event from grandchild:', event.detail.message);

    // Bubble to Parent
    const bubbleEvent = new CustomEvent('childevent', {
        detail: event.detail,
        bubbles: true,
        composed: true
    });
    this.dispatchEvent(bubbleEvent);
    
    }
    handleChangeCompany(event){
        this.selectedCompany=event.target.value;
        this.selectedCompanyName=event.target.name;
        console.log('Select Company===>'+event.target.value);
        console.log('Select Company===>'+this.selectedCompany);
        //console.log('Select Company name ===>'+this.selectedCompanyName);
        // Find the selected company name from options
        const selectedOption = this.companyOptions.find(
            option => option.value === this.selectedCompany
        );
        this.selectedCompanyName = selectedOption ? selectedOption.label : '';
        console.log('Selected Company Name:', this.selectedCompanyName);
        localStorage.setItem('selectedCompanyId', this.selectedCompany);
        localStorage.setItem('selectedCompanyName', this.selectedCompanyName);

            console.log('Stored in localStorage:', this.selectedCompany, this.selectedCompanyName);
        //this.handleCompanyNavigation();
      // const companyId = event.currentTarget.dataset.selectedCompany;
        
    }
    // handleCompanyNavigation(){
    //     console.log('handleCompanyNavigation');
    //     console.log('companyId  in navigation'+ this.selectedCompany);
    //       const editEvent = new CustomEvent('companynavigation', {
    //           detail: { companyId: this.selectedCompany,
    //                     companyName: this.selectedCompanyName,
    //                     naviagte:'companynavigation' },
    //           bubbles: true,
    //           composed: true
    //       });
      
    //       this.dispatchEvent(editEvent);
    //    }
//     @wire(getstaffId, { userId: '$userId' })
// wiredUserAccessDetails({ error, data }) {
//     console.log('Wire method executed'); // Ensure the wire is called

//     if (data) {
//         console.log('Staff Data:', JSON.stringify(data)); // Log full response
//         this.staffName = data.Name;  
//         this.userType = data.User_Type__c;

//         if (
//             this.userType == 'NDIS Org Admin' || this.userType == 'Roster Manager'
//         ){
//             this.isNdisOrgVisible = true;
//         }

//         if (
//             this.userType == 'NDIS Staff'
//         ){
//             this.isNdisStaff = true;
//         }

//         if (
//             this.userType == 'Payroll Admin'
//         ){
//             this.isNdisPayrollAdmin = true;
//         }

//         if (
//             this.userType == 'HR Admin'
//         ){
//             this.isNdisHrAdmin = true;
//         }

//         if (
//             this.userType == 'ICT Admin'
//         ){
//             this.isIctAdmin = true;
//         }

//         if (
//             this.userType == 'ICT Staff'
//         ){
//             this.isIctStaff = true;
//         }

//         if (
//             this.userType == 'NDIS Participants'
//         ){
//             this.IsNdisParticipant = true;
//         }

//         if (
//             this.userType == 'Payroll Accountant for Multiple' || this.userType == 'Accountant for Organisation'
//         ){
//             this.Ispayroll = true;
//         }
//     }
// }
}