import { LightningElement,wire, track, api } from 'lwc';
import getParticipantForm from '@salesforce/apex/ParticipantFormHandler.getParticipantForm';
import getSelectedColumName from '@salesforce/apex/ParticipantFormHandler.getSelectedColumName';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { loadScript } from "lightning/platformResourceLoader";
import jsPDF from '@salesforce/resourceUrl/jspdf';
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import UserNameFld from '@salesforce/schema/User.Name';
import UserEmail from '@salesforce/schema/User.Email';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import UserType from '@salesforce/schema/User.User_Type__c';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';

const actions = [   
    { label: 'Edit', name: 'edit' },
    { label: 'Generate PDF', name: 'generatepdf' },
    { label: 'View Document', name: 'view_details' }
];

export default class ParticipantForm extends LightningElement {
    
    @track isOpenModal=false;
    @track isModal=true;
    @track isBehavioural=false;
    @track isMedication=false;
    @track isPRNMedication=false;
    @track isFluidIntake=false;
    @track isSleepandSelfcare=false;
    @track isWeeklyBloodGlucose=false;
    @track isBowelMovement=false;
    @track isGeneralWeekly=false;
    @track isActivityChart=false;
    @track isShiftReport=false;
    @track selectedFormTypeName;
    @track selectedform;
    @api clientId;  
    @track accList = []; 
    @track selectedrowId;

    // JS Properties 
    @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
    @track records = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number    
    @track recordsToDisplay = []; //Records to be displayed on the page
    @track isEdit=false;
    @track selectedTrigger;
    @track clientName;
    @track clientAddress;
    @track clientContactNumber;    
    @track orgname;
    @track orgId;
    @track abn;
    @track address;
    @track statePostal;
    @track contactNo;
    @track rcti;
    @track bank;
    @track accountNo;
    @track accountName;
    @track bsb;
    @track orgLogo;
    @track desc;
    @track isModalOpen = false;
    @track currentUrl;
    @track base64string;
    @track fileName = '';
    @track showSpinner = false;
    
    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }

    @track columns = [       
        {label: 'Chart/Report', fieldName: 'Form_Type__c', initialWidth: 400, wrapText:true },
        {label: 'User', fieldName: 'Created_User__c', initialWidth: 350},
        {label: 'Date/Time', fieldName: 'CreatedDate__c', type: 'date',
        typeAttributes:{day: "2-digit",month: "2-digit",year: "numeric"}, initialWidth: 300},        
        {
            label: 'Action',
            type: 'action',
            typeAttributes: {
                rowActions: actions,
            }
        }
    ];

    renderedCallback() {
        Promise.all([
            loadScript(this, jsPDF).then(() => {
               // console.log("JS loaded jsPDF");
            }).catch(error => {
               // console.error("Error " + error);
            })
        ]);
    }

    connectedCallback() {
        this.isOpenModal=false;
        this.isEdit=false;
        this.fetchFormlist();
        refreshApex(this.accList);
        this.handleInvoiceData(); 
    }

    fetchFormlist(){
        getParticipantForm({ clientId: this.clientId }).then(result=>{
            this.showSpinner = true;
            if (result) {
                this.records = result.map(record => ({
                    ...record,
                    createdDate: this.formatDate(record.CreatedDate__c) // Add formatted date
                }));
                this.accList = this.records; // Ensure `accList` has the formatted date
                this.clientName = this.records[0]?.Client_Name__c;
                this.clientAddress = this.records[0]?.Client_Address__c;
                this.clientContactNumber = this.records[0]?.Client_Contact_Number__c;
                this.totalRecords = result.length;
                this.pageSize = this.pageSizeOptions[0];
                this.paginationHelper();
                this.showSpinner = false;
                console.log('Formatted Records:', JSON.stringify(this.accList)); // Debugging
            }
        })
        .catch((error) => {
            this.showSpinner = false;
            console.log('error while fetch contacts--> ' + JSON.stringify(error));
        });
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const year = date.getFullYear();
        return `${day}/${month}/${year}`; // Format as dd-mm-yyyy
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
    // JS function to handel pagination logic 
    paginationHelper() {
       // this.accList = [];
        this.accList = [];
        // calculate total pages
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        // set page number 
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
        // set records to display on current page 
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
                break;
            }
            //this.accList.push(this.records[i]);
            this.accList.push(this.records[i]);
        }
    }

    handleAddNewForms() {
        this.isOpenModal=true;
        this.isEdit=false;
        this.isModal=false;
    }

    handleSubmit(event){
        this.isOpenModal=false;        

        event.preventDefault();
        const fields=event.detail.fields;
        fields.Client__c=this.clientId;
        this.template.querySelector('lightning-record-edit-form').submit(fields);  
        this.isEdit=false;      
    }

    handleSuccess(event){
        this.isOpenModal=false;
        this.showSpinner = true;
        this.isBehavioural=false;
        this.isMedication=false;
        this.isPRNMedication=false;
        this.isFluidIntake=false;
        this.isSleepandSelfcare=false;
        this.isWeeklyBloodGlucose=false;
        this.isBowelMovement=false;
        this.isGeneralWeekly=false;
        this.isActivityChart=false;
        this.isShiftReport=false;
        this.isModal=true;
        this.isEdit=false;
        this.fetchFormlist();       
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success!!',
                message: 'Details Saved Successfully !!',
                variant: 'success',
            }),
        );
        this.showSpinner = false;
    }

    handleError(event){ 
        console.log(event.detail.detail);
    }

    hideModalBox(){
        this.isEdit=false;
        this.isOpenModal=false;
        this.isBehavioural=false;
        this.isMedication=false;
        this.isPRNMedication=false;
        this.isFluidIntake=false;
        this.isSleepandSelfcare=false;
        this.isWeeklyBloodGlucose=false;
        this.isBowelMovement=false;
        this.isGeneralWeekly=false;
        this.isActivityChart=false;
        this.isShiftReport=false;
        this.isModal=true;
    }

    FormType(event){        
        this.selectedFormTypeName = event.detail.value;       
        //alert(this.selectedFormTypeName);
        if (event.detail.value == 'Behavioural') {
            this.selectedFormTypeName = event.detail.value;
            this.isBehavioural=true;
            this.isMedication=false;
            this.isPRNMedication=false;
            this.isFluidIntake=false;
            this.isSleepandSelfcare=false;
            this.isWeeklyBloodGlucose=false;
            this.isBowelMovement=false;
            this.isGeneralWeekly=false;
            this.isActivityChart=false;
            this.isShiftReport=false;            
            //alert(JSON.stringify(this.selectedFormTypeName));            
        }

        if (event.detail.value == 'Medication') {
            this.selectedFormTypeName = event.detail.value;
            this.isBehavioural=false;
            this.isMedication=true;
            this.isPRNMedication=false;
            this.isFluidIntake=false;
            this.isSleepandSelfcare=false;
            this.isWeeklyBloodGlucose=false;
            this.isBowelMovement=false;
            this.isGeneralWeekly=false;
            this.isActivityChart=false;
            this.isShiftReport=false;
            //alert(JSON.stringify(this.selectedFormTypeName));
        }

        if (event.detail.value == 'PRN Medication') {
            this.selectedFormTypeName = event.detail.value;
            this.isBehavioural=false;
            this.isMedication=false;
            this.isPRNMedication=true;
            this.isFluidIntake=false;
            this.isSleepandSelfcare=false;
            this.isWeeklyBloodGlucose=false;
            this.isBowelMovement=false;
            this.isGeneralWeekly=false;
            this.isActivityChart=false;
            this.isShiftReport=false;
            //alert(JSON.stringify(this.selectedFormTypeName));            
        }

        if (event.detail.value == 'Fluid Intake') {
            this.selectedFormTypeName = event.detail.value;
            this.isBehavioural=false;
            this.isMedication=false;
            this.isPRNMedication=false;
            this.isFluidIntake=true;
            this.isSleepandSelfcare=false;
            this.isWeeklyBloodGlucose=false;
            this.isBowelMovement=false;
            this.isGeneralWeekly=false;
            this.isActivityChart=false;
            this.isShiftReport=false;
            //alert(JSON.stringify(this.selectedFormTypeName));            
        }

        if (event.detail.value == 'Sleep and Selfcare') {
            this.selectedFormTypeName = event.detail.value;
            this.isBehavioural=false;
            this.isMedication=false;
            this.isPRNMedication=false;
            this.isFluidIntake=false;
            this.isSleepandSelfcare=true;
            this.isWeeklyBloodGlucose=false;
            this.isBowelMovement=false;
            this.isGeneralWeekly=false;
            this.isActivityChart=false;
            this.isShiftReport=false;
            //alert(JSON.stringify(this.selectedFormTypeName));            
        }

        if (event.detail.value == 'Weekly Blood Glucose') {
            this.selectedFormTypeName = event.detail.value;
            this.isBehavioural=false;
            this.isMedication=false;
            this.isPRNMedication=false;
            this.isFluidIntake=false;
            this.isSleepandSelfcare=false;
            this.isWeeklyBloodGlucose=true;
            this.isBowelMovement=false;
            this.isGeneralWeekly=false;
            this.isActivityChart=false;
            this.isShiftReport=false;
            //alert(JSON.stringify(this.selectedFormTypeName));            
        }

        if (event.detail.value == 'Bowel Movement') {
            this.selectedFormTypeName = event.detail.value;
            this.isBehavioural=false;
            this.isMedication=false;
            this.isPRNMedication=false;
            this.isFluidIntake=false;
            this.isSleepandSelfcare=false;
            this.isWeeklyBloodGlucose=false;
            this.isBowelMovement=true;
            this.isGeneralWeekly=false;
            this.isActivityChart=false;
            this.isShiftReport=false;
            //alert(JSON.stringify(this.selectedFormTypeName));            
        }

        if (event.detail.value == 'General Weekly') {
            this.selectedFormTypeName = event.detail.value;
            this.isBehavioural=false;
            this.isMedication=false;
            this.isPRNMedication=false;
            this.isFluidIntake=false;
            this.isSleepandSelfcare=false;
            this.isWeeklyBloodGlucose=false;
            this.isBowelMovement=false;
            this.isGeneralWeekly=true;
            this.isActivityChart=false;
            this.isShiftReport=false;
            //alert(JSON.stringify(this.selectedFormTypeName));            
        }

        if (event.detail.value == 'Activity Chart') {
            this.selectedFormTypeName = event.detail.value;
            this.isBehavioural=false;
            this.isMedication=false;
            this.isPRNMedication=false;
            this.isFluidIntake=false;
            this.isSleepandSelfcare=false;
            this.isWeeklyBloodGlucose=false;
            this.isBowelMovement=false;
            this.isGeneralWeekly=false;
            this.isActivityChart=true;
            this.isShiftReport=false;
            //alert(JSON.stringify(this.selectedFormTypeName));            
        }

        if (event.detail.value == 'Shift Report') {
            this.selectedFormTypeName = event.detail.value;
            this.isBehavioural=false;
            this.isMedication=false;
            this.isPRNMedication=false;
            this.isFluidIntake=false;
            this.isSleepandSelfcare=false;
            this.isWeeklyBloodGlucose=false;
            this.isBowelMovement=false;
            this.isGeneralWeekly=false;
            this.isActivityChart=false;
            this.isShiftReport=true;
            //alert(JSON.stringify(this.selectedFormTypeName));            
        }
    }    

    fetchSelectedItem(){  
        //alert("Inside Function: "+ this.recordId);      
        getSelectedColumName({ recordId: this.recordId }).then(result=>{
            if (result != null) {
                this.selectedform = result[0].Form_Type__c;
                //alert("Inside Function: "+ this.selectedform);  
                if (this.selectedform == 'Behavioural') {
                    this.isBehavioural=true;
                    this.isMedication=false;
                    this.isPRNMedication=false;
                    this.isFluidIntake=false;
                    this.isSleepandSelfcare=false;
                    this.isWeeklyBloodGlucose=false;
                    this.isBowelMovement=false;
                    this.isGeneralWeekly=false;
                    this.isActivityChart=false;
                    this.isShiftReport=false;
                    //alert(JSON.stringify(this.selectedFormTypeName));            
                }
        
                if (this.selectedform == 'Medication') {            
                    this.isBehavioural=false;
                    this.isMedication=true;
                    this.isPRNMedication=false;
                    this.isFluidIntake=false;
                    this.isSleepandSelfcare=false;
                    this.isWeeklyBloodGlucose=false;
                    this.isBowelMovement=false;
                    this.isGeneralWeekly=false;
                    this.isActivityChart=false;
                    this.isShiftReport=false;
                    //alert(JSON.stringify(this.selectedFormTypeName));
                }
        
                if (this.selectedform == 'PRN Medication') {            
                    this.isBehavioural=false;
                    this.isMedication=false;
                    this.isPRNMedication=true;
                    this.isFluidIntake=false;
                    this.isSleepandSelfcare=false;
                    this.isWeeklyBloodGlucose=false;
                    this.isBowelMovement=false;
                    this.isGeneralWeekly=false;
                    this.isActivityChart=false;
                    this.isShiftReport=false;
                    //alert(JSON.stringify(this.selectedFormTypeName));            
                }
        
                if (this.selectedform == 'Fluid Intake') {            
                    this.isBehavioural=false;
                    this.isMedication=false;
                    this.isPRNMedication=false;
                    this.isFluidIntake=true;
                    this.isSleepandSelfcare=false;
                    this.isWeeklyBloodGlucose=false;
                    this.isBowelMovement=false;
                    this.isGeneralWeekly=false;
                    this.isActivityChart=false;
                    this.isShiftReport=false;
                    //alert(JSON.stringify(this.selectedFormTypeName));            
                }
        
                if (this.selectedform == 'Sleep and Selfcare') {            
                    this.isBehavioural=false;
                    this.isMedication=false;
                    this.isPRNMedication=false;
                    this.isFluidIntake=false;
                    this.isSleepandSelfcare=true;
                    this.isWeeklyBloodGlucose=false;
                    this.isBowelMovement=false;
                    this.isGeneralWeekly=false;
                    this.isActivityChart=false;
                    this.isShiftReport=false;
                    //alert(JSON.stringify(this.selectedFormTypeName));            
                }
        
                if (this.selectedform == 'Weekly Blood Glucose') {            
                    this.isBehavioural=false;
                    this.isMedication=false;
                    this.isPRNMedication=false;
                    this.isFluidIntake=false;
                    this.isSleepandSelfcare=false;
                    this.isWeeklyBloodGlucose=true;
                    this.isBowelMovement=false;
                    this.isGeneralWeekly=false;
                    this.isActivityChart=false;
                    this.isShiftReport=false;
                    //alert(JSON.stringify(this.selectedFormTypeName));            
                }
        
                if (this.selectedform == 'Bowel Movement') {            
                    this.isBehavioural=false;
                    this.isMedication=false;
                    this.isPRNMedication=false;
                    this.isFluidIntake=false;
                    this.isSleepandSelfcare=false;
                    this.isWeeklyBloodGlucose=false;
                    this.isBowelMovement=true;
                    this.isGeneralWeekly=false;
                    this.isActivityChart=false;
                    this.isShiftReport=false;
                    //alert(JSON.stringify(this.selectedFormTypeName));            
                }
        
                if (this.selectedform == 'General Weekly') {            
                    this.isBehavioural=false;
                    this.isMedication=false;
                    this.isPRNMedication=false;
                    this.isFluidIntake=false;
                    this.isSleepandSelfcare=false;
                    this.isWeeklyBloodGlucose=false;
                    this.isBowelMovement=false;
                    this.isGeneralWeekly=true;
                    this.isActivityChart=false;
                    this.isShiftReport=false;
                    //alert(JSON.stringify(this.selectedFormTypeName));            
                }
        
                if (this.selectedform == 'Activity Chart') {            
                    this.isBehavioural=false;
                    this.isMedication=false;
                    this.isPRNMedication=false;
                    this.isFluidIntake=false;
                    this.isSleepandSelfcare=false;
                    this.isWeeklyBloodGlucose=false;
                    this.isBowelMovement=false;
                    this.isGeneralWeekly=false;
                    this.isActivityChart=true;
                    this.isShiftReport=false;
                    //alert(JSON.stringify(this.selectedFormTypeName));            
                }
        
                if (this.selectedform == 'Shift Report') {            
                    this.isBehavioural=false;
                    this.isMedication=false;
                    this.isPRNMedication=false;
                    this.isFluidIntake=false;
                    this.isSleepandSelfcare=false;
                    this.isWeeklyBloodGlucose=false;
                    this.isBowelMovement=false;
                    this.isGeneralWeekly=false;
                    this.isActivityChart=false;
                    this.isShiftReport=true;
                }
            }
        })
        .catch((error) => {
            console.log('error while fetch contacts--> ' + JSON.stringify(error));
        });
    }

    handleInvoiceData() {
        organizationDetails().then(response => {
            // console.log('calling response raja', JSON.stringify(response));
            this.invoiceData = response.listofPriceBook;            
            this.orgId = response.listofPriceBook.Id;
            this.orgname = response.listofPriceBook.Name;
            this.abn = response.listofPriceBook.ABN__c;
            this.rcti = response.listofPriceBook.RCTI__c;
            this.address =response.listofPriceBook.Address_Latest__Street__s;
            this.statePostal = response.listofPriceBook.Address_Latest__City__s + ',' + response.listofPriceBook.Address_Latest__StateCode__s + ',' + response.listofPriceBook.Address_Latest__PostalCode__s;
            this.contactNo = response.listofPriceBook.Contact_No__c;
            this.bank = response.listofPriceBook.Bank__c;
            this.accountNo = response.listofPriceBook.Account_Number__c;
            this.accountName = response.listofPriceBook.Account_Name__c;
            this.bsb = response.listofPriceBook.BSB__c;
            this.desc = response.listofPriceBook.Description__c;
            this.orgLogo = response.bolbdata;           
            this.fetchFormlist();   
        });
    }

    handleRowActions(event) {   
        let targetElement = event.target;
    
        // Traverse up to find the <a> tag that has dataset attributes
        while (targetElement && !targetElement.dataset.action) {
            targetElement = targetElement.parentNode;
        }
    
        if (!targetElement) {
            console.error('Could not determine action target.');
            return;
        }
    
        const actionName = targetElement.dataset.action; // Get action
        const recordId = targetElement.dataset.id; // Get record Id
    
        console.log('Action Name :', actionName);
        console.log('Record Id :', recordId);
    
        this.recordId = recordId;
        this.fetchSelectedItem();
        this.isOpenModal = false; 
        this.isModal = false;   
    
        switch (actionName) {        
            case 'edit':
                this.isEdit = true;
                break;
            case 'generatepdf':
                let row = this.accList.filter(rec => rec.Id === recordId);
                this.generatePDF(row[0]); 
                break; 
            case 'view_details':
                this.isModalOpen = true;
                this.currentUrl = this.accList.find(rec => rec.Id === recordId)?.Amazon_URL__c || '';
                break;
        }
    }          
               
    closeaddPayrollinvoice(){
        this.isModalOpen = false;
        this.currentUrl = null;
        this.isModal = true;       
    }

    generatePDF(row){        
        console.log('gerenate pdf id :'+JSON.stringify(row)); 
        const { jsPDF } = window.jspdf;
        var doc = new jsPDF();
        var statePostalWithoutCommas = this.statePostal.replace(/,/g, " ");
       
        doc.setFont("Helvetica", "bold");        
        doc.setTextColor(0,102,255);
        doc.setFontSize(12);
        doc.text(this.orgname, 20, 20);  
        console.log('orgname '+this.orgname);     
    
        doc.setTextColor(0,0,0);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.text("ABN: "+this.abn, 20, 25);
        doc.setFont("Helvetica", "normal");
        console.log('abn '+this.abn);

        doc.setFontSize(10);
        doc.text(this.address, 20,35 );
        doc.text(statePostalWithoutCommas, 20, 40);
        doc.text("Contact: "+this.contactNo, 20, 45);
        console.log('contactNo '+this.contactNo);

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Participant Name:", 110, 24);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        // doc.text(this.clientName, 141, 24);
        doc.text(this.clientName || "N/A", 141, 24);
        console.log('clientName '+this.clientName);

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Contact No: ", 110, 29);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        //doc.text(this.clientContactNumber, 131, 29);
        doc.text(this.clientContactNumber || "N/A", 131, 29);    
        console.log('clientContactNumber '+this.clientContactNumber);

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Address: ", 110, 34);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.text(this.clientAddress, 126, 34); 
        console.log('Address '+this.clientAddress);
        
        doc.line(10, 50, 195, 50);
        if(row.Form_Type__c === 'Medication'){
            console.log('if start '+row.Breakfast_Medication__c);
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Form Type: ", 21, 56); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            doc.text(row.Form_Type__c, 43, 56);

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Breakfast Medication: ", 21, 61); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            // doc.text(row.Breakfast_Medication__c, 64, 61); 
            let breakfastMedication = row.Breakfast_Medication__c;
            if (breakfastMedication) {
                doc.text(breakfastMedication, 63, 61); // 
                console.log('breakfast medication >>> ' + breakfastMedication);
            } else {
                doc.text('No data', 63, 61); // Or whatever placeholder text you'd like
                console.log('breakfast medication >>> No data available');
            }
            console.log('breakfast medication>>>'+row.Breakfast_Medication__c);

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Lunch Medication: ", 21, 66); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            //doc.text(row.Lunch_Medications__c, 58, 66);
            let lunchMedication = row.Lunch_Medications__c;
            if (lunchMedication) {
                doc.text(lunchMedication, 57, 66);
                console.log('lunch medication >>> ' + lunchMedication);
            } else {
                doc.text('No data', 57, 66); // Or any placeholder text you'd like
                console.log('lunch medication >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Dinner Medication: ", 21, 71); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            //doc.text(row.Dinner_Medication__c, 58, 71);
            let dinnerMedication = row.Dinner_Medication__c;
            if (dinnerMedication) {
                doc.text(dinnerMedication, 57, 71);
                console.log('dinner medication >>> ' + dinnerMedication);
            } else {
                doc.text('No data', 57, 71); // Or any placeholder text you'd like
                console.log('dinner medication >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Bedtime: ", 21, 76); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
           // doc.text(row.Bedtime_Medication__c, 40, 76);
           let bedtimeMedication = row.Bedtime_Medication__c;
            if (bedtimeMedication) {
                doc.text(bedtimeMedication.toString(), 39, 76); // Ensure the value is converted to a string
                console.log('Bedtime Medication >>> ' + bedtimeMedication);
            } else {
                doc.text('No data', 39, 76); // Or any placeholder text you'd like
                console.log('Bedtime Medication >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Time Breakfast Medication: ", 21, 81); 

            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
           // doc.text(row.Time_Breakfast_Medication_Formula__c, 74, 81); 
            console.log('breakfast medication time >>' + row.Time_Breakfast_Medication_Formula__c);
            let timeBreakfastMedicationFormula = row.Time_Breakfast_Medication_Formula__c;
            if (timeBreakfastMedicationFormula) {
                doc.text(timeBreakfastMedicationFormula.toString(), 73, 81); // Ensure the value is converted to a string
                console.log('Time Breakfast Medication Formula >>> ' + timeBreakfastMedicationFormula);
            } else {
                doc.text('No data', 73, 81); // Or any placeholder text you'd like
                console.log('Time Breakfast Medication Formula >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Time Lunch Medication: ", 21, 86);
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let timeLunchMedicationFormula = row.Time_Lunch_Medication_Formula__c;

            if (timeLunchMedicationFormula) {
                doc.text(timeLunchMedicationFormula.toString(), 67, 86); // Ensure the value is converted to a string
                console.log('Time Lunch Medication Formula >>> ' + timeLunchMedicationFormula);
            } else {
                doc.text('No data', 67, 86); // Or any placeholder text you'd like
                console.log('Time Lunch Medication Formula >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Time Dinner Medication: ", 21, 91);
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let timeDinnerMedicationFormula = row.Time_Dinner_Medication_Formula__c;

            if (timeDinnerMedicationFormula) {
                doc.text(timeDinnerMedicationFormula.toString(), 67, 91); // Ensure the value is converted to a string
                console.log('Time Dinner Medication Formula >>> ' + timeDinnerMedicationFormula);
            } else {
                doc.text('No data', 67, 91); // Or any placeholder text you'd like
                console.log('Time Dinner Medication Formula >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Time Bedtime Medication: ", 21, 96);
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let timeBreakfastMedicationFormulas = row.Time_Breakfast_Medication_Formula__c;

            if (timeBreakfastMedicationFormulas) {
                doc.text(timeBreakfastMedicationFormulas.toString(), 70, 96); // Ensure the value is converted to a string
                console.log('Time Breakfast Medication Formula >>> ' + timeBreakfastMedicationFormulas);
            } else {
                doc.text('No data', 70, 96); // Or any placeholder text you'd like
                console.log('Time Breakfast Medication Formula >>> No data available');
            }
            doc.line(10, 102, 195, 102);
        }
        if (row.Form_Type__c === 'Behavioural') {
            console.log('if start ' + row.Triggers__c);
            
            let startY = 56; // Starting Y-coordinate
            
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Form Type: ", 21, startY); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            doc.text(row.Form_Type__c, 43, startY);
            
            // Adjust Y-coordinate for the next section
            startY += 5;
        
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Triggers: ", 21, startY); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
        
            // Handling long Triggers text
            let triggers = row.Triggers__c;
            if (triggers) {
                let wrappedTriggers = doc.splitTextToSize(triggers, 150); // Split text with max width of 150
                doc.text(wrappedTriggers, 39, startY);
                startY += (wrappedTriggers.length * 5); // Move down based on the number of lines
                console.log('Triggers >>> ' + triggers);
            } else {
                doc.text('No data', 39, startY);
                startY += 5; // Move down for next section
                console.log('Triggers >>> No data');
            }
        
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Outcome Consequences: ", 21, startY); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
        
            // Handling long Outcome Consequences text
            let outcomeConsequences = row.Outcome_Consequences__c;
            if (outcomeConsequences) {
                let wrappedOutcome = doc.splitTextToSize(outcomeConsequences, 120); // Split text with max width of 120
                doc.text(wrappedOutcome, 69, startY);
                startY += (wrappedOutcome.length * 5); // Move down based on the number of lines
                console.log('Outcome Consequences >>> ' + outcomeConsequences);
            } else {
                doc.text('No data', 69, startY);
                startY += 5; // Move down for next section
                console.log('Outcome Consequences >>> No data');
            }
        
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Behaviour Text: ", 21, startY); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
        
            // Handling long Behaviour Text
            let behaviourText = row.Behaviour_Text__c;
            if (behaviourText) {
                let wrappedBehaviourText = doc.splitTextToSize(behaviourText, 140); // Split text with max width of 140
                doc.text(wrappedBehaviourText, 51, startY);
                startY += (wrappedBehaviourText.length * 5); // Move down based on the number of lines
                console.log('Behaviour Text >>> ' + behaviourText);
            } else {
                doc.text('No data', 51, startY);
                startY += 5; // Move down for next section
                console.log('Behaviour Text >>> No data');
            }
        
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Was a skill used that helped Worked: ", 21, startY); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
        
            // Handling long skill used text
            let skillUsed = row.Was_a_skill_used_Worked__c;
            if (skillUsed) {
                let wrappedSkillUsed = doc.splitTextToSize(skillUsed, 100); // Split text with max width of 100
                doc.text(wrappedSkillUsed, 90, startY);
                startY += (wrappedSkillUsed.length * 5); // Move down based on the number of lines
                console.log('Skill Used >>> ' + skillUsed);
            } else {
                doc.text('No data', 90, startY);
                startY += 5; // Move down for next section
                console.log('Skill Used >>> No data');
            }
        
            doc.line(10, startY + 5, 195, startY + 5); // Line after all sections
        }
        if(row.Form_Type__c === 'PRN Medication'){
            console.log('if start '+row.PRN_Medication__c);
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Form Type: ", 21, 56); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            doc.text(row.Form_Type__c, 43, 56); 

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("PRN Medication: ", 21, 61); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            //doc.text(row.PRN_Medication__c, 54, 61);
            let prnMedication = row.PRN_Medication__c;
            if (prnMedication) {
                doc.text(prnMedication, 53, 61);
                console.log('PRN medication >>> ' + prnMedication);
            } else {
                doc.text('No data', 53, 61); // Or any placeholder text you'd like
                console.log('PRN medication >>> No data');
            }
            
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Time PRN Medication: ", 21, 66); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let timePRNMedicationFormula = row.Time_PRN_Medication_Formula__c;
            if (timePRNMedicationFormula) {
                doc.text(timePRNMedicationFormula.toString(), 62, 66); // Ensure the value is converted to a string
                console.log('Time PRN Medication Formula >>> ' + timePRNMedicationFormula);
            } else {
                doc.text('No data', 62, 66); // Or any placeholder text you'd like
                console.log('Time PRN Medication Formula >>> No data available');
            }                        
            doc.line(10, 72, 195, 72);
        }
        if (row.Form_Type__c === 'Fluid Intake') {
            console.log('if start ' + row.Description_Fluid_Intake__c);
            
            let startY = 56; // Starting Y-coordinate
        
            // Form Type
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Form Type: ", 21, startY); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            doc.text(row.Form_Type__c, 43, startY);
            
            startY += 5; // Increment Y-coordinate
        
            // Description
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Description: ", 21, startY); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            
            let descriptionFluidIntake = row.Description_Fluid_Intake__c;
            if (descriptionFluidIntake) {
                let wrappedDescription = doc.splitTextToSize(descriptionFluidIntake, 140); // Wrap text to fit within 140px width
                doc.text(wrappedDescription, 45, startY);
                startY += (wrappedDescription.length * 5); // Increment Y-coordinate based on number of lines
                console.log('Description Fluid Intake >>> ' + descriptionFluidIntake);
            } else {
                doc.text('No data', 45, startY);
                startY += 5;
                console.log('Description Fluid Intake >>> No data');
            }
        
            // Estimated Volume
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Estimated Volume (in ml): ", 21, startY); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            
            let estimatedVolume = row.Estimated_Volume_in_ml_Fluid_Intake__c;
            if (estimatedVolume !== null && estimatedVolume !== undefined && !isNaN(estimatedVolume)) {
                doc.text(estimatedVolume.toString(), 70, startY);
                console.log('Estimated Volume >>> ' + estimatedVolume);
            } else {
                doc.text('No data', 70, startY);
                console.log('Estimated Volume >>> No data');
            }
            startY += 5;
        
            // Time
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Time: ", 21, startY); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            
            if (row.Time_Fluid_Intake_Formula__c) {
                doc.text(row.Time_Fluid_Intake_Formula__c, 32, startY);
                console.log('Time Fluid Intake >>> ' + row.Time_Fluid_Intake_Formula__c);
            } else {
                doc.text('No time', 32, startY);
                console.log('Time Fluid Intake >>> No time');
            }            
            doc.line(10, startY + 6, 195, startY + 6); // Draw a line after all sections
        }
        if(row.Form_Type__c === 'Sleep and Selfcare'){
            console.log('if start '+row.PRN_Medication__c);
            
            let startY = 56; // Start position for the first line
        
            // Form Type
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Form Type: ", 21, startY); 
            doc.setFont("Helvetica", "normal");
            doc.text(row.Form_Type__c, 43, startY);
            startY += 5; // Move Y-position down for the next text
        
            // Self care
            doc.setFont("Helvetica", "bold");
            doc.text("Self care: ", 21, startY); 
            doc.setFont("Helvetica", "normal");
            let selfCare = row.Self_care_SS_Care__c || 'No data';
            let wrappedSelfCare = doc.splitTextToSize(selfCare, 150); // Wrap long text
            doc.text(wrappedSelfCare, 40, startY);
            startY += wrappedSelfCare.length * 5; // Adjust Y-position based on how many lines the text takes
        
            // Comments
            doc.setFont("Helvetica", "bold");
            doc.text("Comments: ", 21, startY); 
            doc.setFont("Helvetica", "normal");
            let commentsSSCare = row.Comments_SS_Care__c || 'No data';
            let wrappedCommentsSSCare = doc.splitTextToSize(commentsSSCare, 150);
            doc.text(wrappedCommentsSSCare, 44, startY);
            startY += wrappedCommentsSSCare.length * 5;
        
            // Medication given
            doc.setFont("Helvetica", "bold");
            doc.text("Medication given: ", 21, startY); 
            doc.setFont("Helvetica", "normal");
            let medicationGiven = row.Medication_given_SS_Care__c || 'No data';
            let wrappedMedicationGiven = doc.splitTextToSize(medicationGiven, 150);
            doc.text(wrappedMedicationGiven, 55, startY);
            startY += wrappedMedicationGiven.length * 5;
        
            // Type
            doc.setFont("Helvetica", "bold");
            doc.text("Type: ", 21, startY); 
            doc.setFont("Helvetica", "normal");
            let typeSSCare = row.Type_SS_Care__c || 'No data';
            let wrappedTypeSSCare = doc.splitTextToSize(typeSSCare, 150);
            doc.text(wrappedTypeSSCare, 33, startY);
            startY += wrappedTypeSSCare.length * 5;
        
            // Activity did with client
            doc.setFont("Helvetica", "bold");
            doc.text("Activity did with client: ", 21, startY); 
            doc.setFont("Helvetica", "normal");
            let activityWithClient = row.Actvitiy_did_with_client_SS_Care__c || 'No data';
            let wrappedActivityWithClient = doc.splitTextToSize(activityWithClient, 150);
            doc.text(wrappedActivityWithClient, 65, startY);
            startY += wrappedActivityWithClient.length * 5;
        
            // Time
            doc.setFont("Helvetica", "bold");
            doc.text("Time: ", 21, startY); 
            doc.setFont("Helvetica", "normal");
            let timeSSCareChartFormula = row.Time_SS_Care_Chart_Formula__c ? row.Time_SS_Care_Chart_Formula__c.toString() : 'No data';
            doc.text(timeSSCareChartFormula, 32, startY);
            startY += 6;  // Add 6 points space for time
        
            // Line separator
            doc.line(10, startY, 195, startY); 
        }            
        if(row.Form_Type__c === 'Weekly Blood Glucose'){
            console.log('if start '+row.PRN_Medication__c);
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Form Type: ", 21, 56); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            doc.text(row.Form_Type__c, 43, 56);

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Pre Morning/Breakfast: ", 21, 61); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            //doc.text(row.Morning_Breakfast_Weekly_Glucose__c, 55, 66);
            // Check if Morning_Breakfast_Weekly_Glucose__c is null, undefined, or empty
            let morningGlucose = row.Morning_Breakfast_Weekly_Glucose__c;

            if (morningGlucose) {
                doc.text(morningGlucose.toString(), 64, 61); // Ensure the value is converted to a string
                console.log('Morning Breakfast Weekly Glucose >>> ' + morningGlucose);
            } else {
                doc.text('No data', 64, 61); // Or any placeholder text you'd like
                console.log('Morning Breakfast Weekly Glucose >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Post Morning/Breakfast: ", 21, 66); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            //doc.text(row.Post_Morning_Breakfast_Glucose__c, 55, 66);
            // Check if Post_Morning_Breakfast_Glucose__c is null, undefined, or empty
            let postMorningGlucose = row.Post_Morning_Breakfast_Glucose__c;

            if (postMorningGlucose) {
                doc.text(postMorningGlucose.toString(), 66, 66); // Ensure the value is converted to a string
                console.log('Post Morning Breakfast Glucose >>> ' + postMorningGlucose);
            } else {
                doc.text('No data', 66, 66); // Or any placeholder text you'd like
                console.log('Post Morning Breakfast Glucose >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Pre Midday/Lunch: ", 21, 71); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            //doc.text(row.Pre_Midday_Lunch__c, 52, 71);
            // Check if Pre_Midday_Lunch__c is null, undefined, or empty
            let preMiddayLunch = row.Pre_Midday_Lunch__c;
            if (preMiddayLunch) {
                doc.text(preMiddayLunch.toString(), 58, 71); // Ensure the value is converted to a string
                console.log('Pre Midday Lunch >>> ' + preMiddayLunch);
            } else {
                doc.text('No data', 58, 71); // Or any placeholder text you'd like
                console.log('Pre Midday Lunch >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Post Midday/Lunch: ", 21, 76); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            //doc.text(row.Post_Midday_Lunch__c, 60, 76);
            let postMiddayLunch = row.Post_Midday_Lunch__c;
            if (postMiddayLunch) {
                doc.text(postMiddayLunch.toString(), 59, 76); // Ensure the value is converted to a string
                console.log('Post Midday Lunch >>> ' + postMiddayLunch);
            } else {
                doc.text('No data', 59, 76); // Or any placeholder text you'd like
                console.log('Post Midday Lunch >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Pre Evening/Dinner: ", 21, 81); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            //doc.text(row.Pre_Evening_Dinner__c, 60, 81);
            let preEveningDinner = row.Pre_Evening_Dinner__c;
            if (preEveningDinner) {
                doc.text(preEveningDinner.toString(), 59, 81); // Ensure the value is converted to a string
                console.log('Pre Evening Dinner >>> ' + preEveningDinner);
            } else {
                doc.text('No data', 59, 81); // Or any placeholder text you'd like
                console.log('Pre Evening Dinner >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Post Evening/Dinner: ", 21, 86); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            //doc.text(row.Post_Evening_Dinner__c, 62, 86);
            let postEveningDinner = row.Post_Evening_Dinner__c;
            if (postEveningDinner) {
                doc.text(postEveningDinner.toString(), 61, 86); // Ensure the value is converted to a string
                console.log('Post Evening Dinner >>> ' + postEveningDinner);
            } else {
                doc.text('No data', 61, 86); // Or any placeholder text you'd like
                console.log('Post Evening Dinner >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Pre Night/Pre-bed: ", 21, 91); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
           // doc.text(row.Pre_Night_Pre_bed__c, 58, 91);
           let preNightPreBed = row.Pre_Night_Pre_bed__c;
            if (preNightPreBed) {
                doc.text(preNightPreBed.toString(), 57, 91); // Ensure the value is converted to a string
                console.log('Pre Night Pre Bed >>> ' + preNightPreBed);
            } else {
                doc.text('No data', 57, 91); // Or any placeholder text you'd like
                console.log('Pre Night Pre Bed >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Post Night/Pre-bed: ", 21, 96); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            //doc.text(row.Post_Night_Pre_bed__c, 59, 96);
            let postNightPreBed = row.Post_Night_Pre_bed__c;
            if (postNightPreBed) {
                doc.text(postNightPreBed.toString(), 58, 96); // Ensure the value is converted to a string
                console.log('Post Night Pre Bed >>> ' + postNightPreBed);
            } else {
                doc.text('No data', 58, 96); // Or any placeholder text you'd like
                console.log('Post Night Pre Bed >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Time: ", 21, 101); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let timeWeeklyBGFormula = row.Time_Weekly_BG_Formula__c;

            if (timeWeeklyBGFormula) {
                doc.text(timeWeeklyBGFormula.toString(), 32, 101); // Ensure the value is converted to a string
                console.log('Time Weekly BG Formula >>> ' + timeWeeklyBGFormula);
            } else {
                doc.text('No data', 32, 101); // Or any placeholder text you'd like
                console.log('Time Weekly BG Formula >>> No data available');
            }
            doc.line(10, 107, 195, 107);
        }
        if(row.Form_Type__c === 'Bowel Movement'){
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Form Type: ", 21, 56); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            doc.text(row.Form_Type__c, 43, 56);

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Type: ", 21, 61); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            // Check if Type_Bowel_Movement__c is null, undefined, or empty
            let typeBowelMovement = row.Type_Bowel_Movement__c;
            if (typeBowelMovement) {
                doc.text(typeBowelMovement.toString(), 33, 61); // Ensure the value is converted to a string
                console.log('Type Bowel Movement >>> ' + typeBowelMovement);
            } else {
                doc.text('No data', 33, 61); // Or any placeholder text you'd like
                console.log('Type Bowel Movement >>> No data available');
            }
            
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Time: ", 21, 66); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let timeBowelMovementFormula = row.Time_Bowel_Movement_Formula__c;

            if (timeBowelMovementFormula) {
                doc.text(timeBowelMovementFormula.toString(), 32, 66); // Ensure the value is converted to a string
                console.log('Time Bowel Movement Formula >>> ' + timeBowelMovementFormula);
            } else {
                doc.text('No data', 32, 66); // Or any placeholder text you'd like
                console.log('Time Bowel Movement Formula >>> No data available');
            }
            
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Comments: ", 21, 71); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let commentsBowelMovement = row.Comments_Bowel_Movement__c;
            if (commentsBowelMovement) {
                let wrappedComments = doc.splitTextToSize(commentsBowelMovement, 150);
                doc.text(wrappedComments, 43, 71);
            } else {
                doc.text('No data', 43, 71); // Or any placeholder text you'd like
                console.log('Comments Bowel Movement >>> No data available');
            }

           doc.line(10, 83, 195, 83);
        }
        if(row.Form_Type__c === 'General Weekly'){
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Form Type: ", 21, 56); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            doc.text(row.Form_Type__c, 43, 56);

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Breakfast: ", 21, 61); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let breakfastGeneralWeekly = row.Breakfast_General_Weekly__c;
            if (breakfastGeneralWeekly) {
                doc.text(breakfastGeneralWeekly.toString(), 41, 61); // Ensure the value is converted to a string
                console.log('Breakfast General Weekly >>> ' + breakfastGeneralWeekly);
            } else {
                doc.text('No data', 41, 61); // Or any placeholder text you'd like
                console.log('Breakfast General Weekly >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Lunch: ", 21, 66); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let lunchGeneralWeekly = row.Lunch_General_Weekly__c;
            if (lunchGeneralWeekly) {
                doc.text(lunchGeneralWeekly.toString(), 35, 66); // Ensure the value is converted to a string
                console.log('Lunch General Weekly >>> ' + lunchGeneralWeekly);
            } else {
                doc.text('No data', 35, 66); // Or any placeholder text you'd like
                console.log('Lunch General Weekly >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Dinner: ", 21, 71); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let dinnerGeneralWeekly = row.Dinner_General_Weekly__c;
            if (dinnerGeneralWeekly) {
                doc.text(dinnerGeneralWeekly.toString(), 36, 71); // Ensure the value is converted to a string
                console.log('Dinner General Weekly >>> ' + dinnerGeneralWeekly);
            } else {
                doc.text('No data', 36, 71); // Or any placeholder text you'd like
                console.log('Dinner General Weekly >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Snacks: ", 21, 76); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
           // doc.text(row.Snacks_General_Weekly__c, 44, 56);
            let snacksGeneralWeekly = row.Snacks_General_Weekly__c;
            if (snacksGeneralWeekly) {
                doc.text(snacksGeneralWeekly.toString(), 37, 76); // Ensure the value is converted to a string
                console.log('Snacks General Weekly >>> ' + snacksGeneralWeekly);
            } else {
                doc.text('No data', 37, 76); // Or any placeholder text you'd like
                console.log('Snacks General Weekly >>> No data available');
            }    
            doc.line(10, 82, 195, 82);        
        }
        if(row.Form_Type__c === 'Activity Chart'){            
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Form Type: ", 21, 56); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            doc.text(row.Form_Type__c, 43, 56);

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("From Personal: ", 21, 61); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let fromPersonalFormula = row.From_Personal_Formula__c;

            if (fromPersonalFormula) {
                doc.text(fromPersonalFormula.toString(), 51, 61); // Ensure the value is converted to a string
                console.log('From Personal Formula >>> ' + fromPersonalFormula);
            } else {
                doc.text('No data', 51, 61); // Or any placeholder text you'd like
                console.log('From Personal Formula >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("To Personal: ", 21, 66); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let toPersonalFormula = row.To_Personal_Formula__c;

            if (toPersonalFormula) {
                doc.text(toPersonalFormula.toString(), 46, 66); // Ensure the value is converted to a string
                console.log('To Personal Formula >>> ' + toPersonalFormula);
            } else {
                doc.text('No data', 46, 66); // Or any placeholder text you'd like
                console.log('To Personal Formula >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("From Mood/behaviour: ", 21, 71); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let fromMoodBehaviourFormula = row.From_Mood_behaviour_Formula__c;
            if (fromMoodBehaviourFormula) {
                doc.text(fromMoodBehaviourFormula.toString(), 64, 71); // Ensure the value is converted to a string
                console.log('From Mood Behaviour Formula >>> ' + fromMoodBehaviourFormula);
            } else {
                doc.text('No data', 64, 71); // Or any placeholder text you'd like
                console.log('From Mood Behaviour Formula >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("To Mood/behaviour: ", 21, 76); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let toMoodBehaviourFormula = row.To_Mood_behaviour_Formula__c;
            if (toMoodBehaviourFormula) {
                doc.text(toMoodBehaviourFormula.toString(), 60, 76); // Ensure the value is converted to a string
                console.log('To Mood Behaviour Formula >>> ' + toMoodBehaviourFormula);
            } else {
                doc.text('No data', 60, 76); // Or any placeholder text you'd like
                console.log('To Mood Behaviour Formula >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("From Cleaning/Cooking/House: ", 21, 81); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let fromCleaningCookingHouseFormula = row.From_Cleaning_Cooking_House_Formula__c;
            if (fromCleaningCookingHouseFormula) {
                doc.text(fromCleaningCookingHouseFormula.toString(), 80, 81); // Ensure the value is converted to a string
                console.log('From Cleaning Cooking House Formula >>> ' + fromCleaningCookingHouseFormula);
            } else {
                doc.text('No data', 80, 81); // Or any placeholder text you'd like
                console.log('From Cleaning Cooking House Formula >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("To Cleaning/Cooking/House: ", 21, 86); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let toCleaningCookingHouseFormula = row.To_Cleaning_Cooking_House_Formula__c;
            if (toCleaningCookingHouseFormula) {
                doc.text(toCleaningCookingHouseFormula.toString(), 75, 86); // Ensure the value is converted to a string
                console.log('To Cleaning Cooking House Formula >>> ' + toCleaningCookingHouseFormula);
            } else {
                doc.text('No data', 75, 86); // Or any placeholder text you'd like
                console.log('To Cleaning Cooking House Formula >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("From Observations: ", 21, 91); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let fromObservationsFormula = row.From_Observations_Formula__c;
            if (fromObservationsFormula) {
                doc.text(fromObservationsFormula.toString(), 59, 91); // Ensure the value is converted to a string
                console.log('From Observations Formula >>> ' + fromObservationsFormula);
            } else {
                doc.text('No data', 59, 91); // Or any placeholder text you'd like
                console.log('From Observations Formula >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("To Observations: ", 21, 96); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let toObservationsFormula = row.To_Observations_Formula__c;
            if (toObservationsFormula) {
                doc.text(toObservationsFormula.toString(), 54, 96); // Ensure the value is converted to a string
                console.log('To Observations Formula >>> ' + toObservationsFormula);
            } else {
                doc.text('No data', 54, 96); // Or any placeholder text you'd like
                console.log('To Observations Formula >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("From Progress: ", 21, 101); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let fromProgressFormula = row.From_Progress_Formula__c;

            if (fromProgressFormula) {
                doc.text(fromProgressFormula.toString(), 51, 101); // Ensure the value is converted to a string
                console.log('From Progress Formula >>> ' + fromProgressFormula);
            } else {
                doc.text('No data', 51, 101); // Or any placeholder text you'd like
                console.log('From Progress Formula >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("To Progress: ", 21, 106); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let toProgressFormula = row.To_Progress_Formula__c;

            if (toProgressFormula) {
                doc.text(toProgressFormula.toString(), 45, 106); // Ensure the value is converted to a string
                console.log('To Progress Formula >>> ' + toProgressFormula);
            } else {
                doc.text('No data', 45, 106); // Or any placeholder text you'd like
                console.log('To Progress Formula >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Time: ", 21, 111); // Static label for Time

            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let timeActivityChartFormula = row.Time_Activity_Chart_Formula__c;

            if (timeActivityChartFormula) {
                doc.text(timeActivityChartFormula.toString(), 33, 111); // Ensure the value is converted to a string
                console.log('Time Activity Chart Formula >>> ' + timeActivityChartFormula);
            } else {
                doc.text('No data', 33, 111); // Or any placeholder text you'd like
                console.log('Time Activity Chart Formula >>> No data available');
            }
            doc.line(10, 117, 195, 117);
        }
        if(row.Form_Type__c === 'Shift Report'){
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Form Type: ", 21, 56); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            doc.text(row.Form_Type__c, 44, 56);

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Shift from Time: ", 21, 61); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);

            let shiftFromTime = row.Shift_from_Time_Formula__c;

            if (shiftFromTime !== null && shiftFromTime !== undefined && shiftFromTime !== '') {
                doc.text(shiftFromTime.toString(), 52, 61); // Ensure the value is converted to a string
                console.log('Shift time formula >>> ' + shiftFromTime);
            } else {
                doc.text('No data', 52, 61); // Or any placeholder text you'd like
                console.log('Breakfast Shift Report >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Shift to Time: ", 21, 66); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);

            let shifttoTime = row.Shift_to_Time_Formula__c	;

            if (shifttoTime !== null && shifttoTime !== undefined && shifttoTime !== '') {
                doc.text(shifttoTime.toString(), 47, 66); // Ensure the value is converted to a string
                console.log('Breakfast Shift Report >>> ' + shifttoTime);
            } else {
                doc.text('No data', 47, 66); // Or any placeholder text you'd like
                console.log('Breakfast Shift Report >>> No data available');
            } 

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Breakfast: ", 21, 71); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);

            let breakfastShiftReport = row.Breakfast_Shift_Report__c;

            if (breakfastShiftReport !== null && breakfastShiftReport !== undefined && breakfastShiftReport !== '') {
                doc.text(breakfastShiftReport.toString(), 42, 71); // Ensure the value is converted to a string
                console.log('Breakfast Shift Report >>> ' + breakfastShiftReport);
            } else {
                doc.text('No data', 42, 71); // Or any placeholder text you'd like
                console.log('Breakfast Shift Report >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("What did I Have: ", 21, 76); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let breakfastItem = row.What_Did_I_Have_Breakfast__c;

            if (breakfastItem !== null && breakfastItem !== undefined && breakfastItem !== '') {
                doc.text(breakfastItem.toString(), 53, 76); // Ensure the value is converted to a string
                console.log('What Did I Have Breakfast >>> ' + breakfastItem);
            } else {
                doc.text('No data', 53, 76); // Or any placeholder text you'd like
                console.log('What Did I Have Breakfast >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Details of the Food: ", 21, 81); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let foodDetailsBreakfast = row.Details_of_the_Food_Breakfast__c;

            if (foodDetailsBreakfast !== null && foodDetailsBreakfast !== undefined && foodDetailsBreakfast !== '') {
                doc.text(foodDetailsBreakfast.toString(), 59, 81); // Ensure the value is converted to a string
                console.log('Details of the Food Breakfast >>> ' + foodDetailsBreakfast);
            } else {
                doc.text('No data', 59, 81); // Or any placeholder text you'd like
                console.log('Details of the Food Breakfast >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Amount (Quantity): ", 21, 86); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let amountQuantityBreakfast = row.Amount_Quantity_Breakfast__c;
            if (amountQuantityBreakfast !== null && amountQuantityBreakfast !== undefined && amountQuantityBreakfast !== '') {
                doc.text(amountQuantityBreakfast.toString(), 58, 86); // Ensure the value is converted to a string
                console.log('Amount Quantity Breakfast >>> ' + amountQuantityBreakfast);
            } else {
                doc.text('No data', 58, 86); // Or any placeholder text you'd like
                console.log('Amount Quantity Breakfast >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Time: ", 21, 91); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let timeBreakfast = row.Time_Breakfast_Formula__c;
            if (timeBreakfast !== null && timeBreakfast !== undefined && timeBreakfast !== '') {
                doc.text(timeBreakfast.toString(), 33, 91); // Ensure the value is converted to a string
                console.log('Amount Quantity Breakfast >>> ' + timeBreakfast);
            } else {
                doc.text('No data', 33, 91); // Or any placeholder text you'd like
                console.log('Amount Quantity Breakfast >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Comments: ", 21, 96); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let commentsBreakfast = row.Comments_Breakfast__c;

            if (commentsBreakfast !== null && commentsBreakfast !== undefined && commentsBreakfast !== '') {
                doc.text(commentsBreakfast.toString(), 44, 96); // Ensure the value is converted to a string
                console.log('Comments Breakfast >>> ' + commentsBreakfast);
            } else {
                doc.text('No data', 44, 96); // Or any placeholder text you'd like
                console.log('Comments Breakfast >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Lunch: ", 21, 101); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let lunch = row.Lunch__c;

            if (lunch !== null && lunch !== undefined && lunch !== '') {
                doc.text(lunch.toString(), 36, 101); // Ensure the value is converted to a string
                console.log('Lunch >>> ' + lunch);
            } else {
                doc.text('No data', 36, 101); // Or any placeholder text you'd like
                console.log('Lunch >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("What did I Have: ", 21, 106); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let lunchItem = row.What_Did_I_Have_Lunch__c;

            if (lunchItem !== null && lunchItem !== undefined && lunchItem !== '') {
                doc.text(lunchItem.toString(), 53, 106); // Ensure the value is converted to a string
                console.log('What Did I Have for Lunch >>> ' + lunchItem);
            } else {
                doc.text('No data available', 53, 106); // Or any placeholder text you'd like
                console.log('What Did I Have for Lunch >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Details of the Food: ", 21, 111); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let foodDetailsLunch = row.Details_of_the_Food_Lunch__c;

            if (foodDetailsLunch !== null && foodDetailsLunch !== undefined && foodDetailsLunch !== '') {
                doc.text(foodDetailsLunch.toString(), 59, 111); // Ensure the value is converted to a string
                console.log('Details of the Food Lunch >>> ' + foodDetailsLunch);
            } else {
                doc.text('No data', 59, 111); // Or any placeholder text you'd like
                console.log('Details of the Food Lunch >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Amount (Quantity): ", 21, 116); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let amountQuantityLunch = row.Amount_Quantity_Lunch__c;

            if (amountQuantityLunch !== null && amountQuantityLunch !== undefined && amountQuantityLunch !== '') {
                doc.text(amountQuantityLunch.toString(), 57, 116); // Ensure the value is converted to a string
                console.log('Amount Quantity Lunch >>> ' + amountQuantityLunch);
            } else {
                doc.text('No data', 57, 116); // Or any placeholder text you'd like
                console.log('Amount Quantity Lunch >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Time: ", 21, 121); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let lunchTime = row.Time_Lunch_Formula__c	;

            if (lunchTime !== null && lunchTime !== undefined && lunchTime !== '') {
                doc.text(lunchTime.toString(), 33, 121); // Ensure the value is converted to a string
                console.log('Time lunch >>> ' + lunchTime);
            } else {
                doc.text('No data', 33, 121); // Or any placeholder text you'd like
                console.log('Lunch time');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Comments: ", 21, 126); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let commentsLunch = row.Comments_Lunch__c;

            if (commentsLunch !== null && commentsLunch !== undefined && commentsLunch !== '') {
                doc.text(commentsLunch.toString(), 44, 126); // Ensure the value is converted to a string
                console.log('Comments Lunch >>> ' + commentsLunch);
            } else {
                doc.text('No data', 44, 126); // Or any placeholder text you'd like
                console.log('Comments Lunch >>> No data available');
            }
            
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Dinner: ", 21, 131); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let dinner = row.Dinner_Shift_Report__c;

            if (dinner !== null && dinner !== undefined && dinner !== '') {
                doc.text(dinner.toString(), 36, 131); // Ensure the value is converted to a string
                console.log('Comments Lunch >>> ' + dinner);
            } else {
                doc.text('No data', 36, 131); // Or any placeholder text you'd like
                console.log('Comments Lunch >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("What did I Have: ", 21, 136); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let dinnerItem = row.What_Did_I_Have_Dinner__c;

            if (dinnerItem !== null && dinnerItem !== undefined && dinnerItem !== '') {
                doc.text(dinnerItem.toString(), 52, 136); // Ensure the value is converted to a string
                console.log('What Did I Have for Dinner >>> ' + dinnerItem);
            } else {
                doc.text('No data', 52, 136); // Or any placeholder text you'd like
                console.log('What Did I Have for Dinner >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Details of the Food: ", 21, 141); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let foodDetailsDinner = row.Details_of_the_Food_Dinner__c;

            if (foodDetailsDinner !== null && foodDetailsDinner !== undefined && foodDetailsDinner !== '') {
                doc.text(foodDetailsDinner.toString(), 59, 141); // Ensure the value is converted to a string
                console.log('Details of the Food Dinner >>> ' + foodDetailsDinner);
            } else {
                doc.text('No data', 59, 141); // Or any placeholder text you'd like
                console.log('Details of the Food Dinner >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Amount (Quantity): ", 21, 146); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let amountQuantityDinner = row.Amount_Quantity_Dinner__c;

            if (amountQuantityDinner !== null && amountQuantityDinner !== undefined && amountQuantityDinner !== '') {
                doc.text(amountQuantityDinner.toString(), 58, 146); // Ensure the value is converted to a string
                console.log('Amount Quantity Dinner >>> ' + amountQuantityDinner);
            } else {
                doc.text('No data', 58, 146); // Or any placeholder text you'd like
                console.log('Amount Quantity Dinner >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Time: ", 21, 151); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let dinnerTime = row.Time_Dinner_Formula__c;

            if (dinnerTime !== null && dinnerTime !== undefined && dinnerTime !== '') {
                doc.text(dinnerTime.toString(), 33, 151); // Ensure the value is converted to a string
                console.log('Amount Quantity Dinner >>> ' + dinnerTime);
            } else {
                doc.text('No data', 33, 151); // Or any placeholder text you'd like
                console.log('Amount Quantity Dinner >>> No data available');
            } 

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Comments: ", 21, 156); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let commentsDinner = row.Comments_Dinner__c;

            if (commentsDinner !== null && commentsDinner !== undefined && commentsDinner !== '') {
                doc.text(commentsDinner.toString(), 44, 156); // Ensure the value is converted to a string
                console.log('Comments Dinner >>> ' + commentsDinner);
            } else {
                doc.text('No data', 44, 156); // Or any placeholder text you'd like
                console.log('Comments Dinner >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Shift Duties: ", 21, 161); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let shiftDuties = row.Shift_Duties__c;

            if (shiftDuties !== null && shiftDuties !== undefined && shiftDuties !== '') {
                doc.text(shiftDuties.toString(), 46, 161); // Ensure the value is converted to a string
                console.log('Shift Duties >>> ' + shiftDuties);
            } else {
                doc.text('No data', 46, 161); // Or any placeholder text you'd like
                console.log('Shift Duties >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Notes: ", 21, 166); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let notes = row.Notes__c;

            if (notes !== null && notes !== undefined && notes !== '') {
                doc.text(notes.toString(), 34, 166); // Ensure the value is converted to a string
                console.log('Shift Duties >>> ' + notes);
            } else {
                doc.text('No data', 34, 166); // Or any placeholder text you'd like
                console.log('Shift Duties >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Staff Name: ", 21, 171); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let staffName = row.Staff__c;

            if (staffName !== null && staffName !== undefined && staffName !== '') {
                doc.text(staffName.toString(), 44, 171); // Ensure the value is converted to a string
                console.log('staffName >>> ' + staffName);
            } else {
                doc.text('No data', 44, 171); // Or any placeholder text you'd like
                console.log('staffName>>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Sad From: ", 21, 176); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let sadFrom = row.Sad_from_Formula__c;

            if (sadFrom !== null && sadFrom !== undefined && sadFrom !== '') {
                doc.text(sadFrom.toString(), 42, 176); // Ensure the value is converted to a string
                console.log('Sad From >>> ' + sadFrom);
            } else {
                doc.text('No data', 42, 176); // Or any placeholder text you'd like
                console.log('Sad From >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Sad To: ", 21, 181); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let sadTo = row.Sad_to_Formula__c;

            if (sadTo !== null && sadTo !== undefined && sadTo !== '') {
                doc.text(sadTo.toString(), 37, 181); // Ensure the value is converted to a string
                console.log('Sad To >>> ' + sadTo);
            } else {
                doc.text('No data', 37, 181); // Or any placeholder text you'd like
                console.log('Sad To >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Tired From: ", 21, 186); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let tiredFrom = row.Tired_from_Formula__c;

            if (tiredFrom !== null && tiredFrom !== undefined && tiredFrom !== '') {
                doc.text(tiredFrom.toString(), 44, 186); // Ensure the value is converted to a string
                console.log('Tired From >>> ' + tiredFrom);
            } else {
                doc.text('No data', 44, 186); // Or any placeholder text you'd like
                console.log('Tired Froms >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Tired To: ", 21, 191); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let tiredTo = row.Tired_to_Formula__c;

            if (tiredTo !== null && tiredTo !== undefined && tiredTo !== '') {
                doc.text(tiredTo.toString(), 39, 191); // Ensure the value is converted to a string
                console.log('Tired to  >>> ' + tiredTo);
            } else {
                doc.text('No data', 39, 191); // Or any placeholder text you'd like
                console.log('Tired to >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Anxiouis from: ", 21, 196); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let anxiouisFrom = row.Anxiouis_from_Formula__c;

            if (anxiouisFrom !== null && anxiouisFrom !== undefined && anxiouisFrom !== '') {
                doc.text(anxiouisFrom.toString(), 49, 196); // Ensure the value is converted to a string
                console.log('Anxiouis From >>> ' + anxiouisFrom);
            } else {
                doc.text('No data', 49, 196); // Or any placeholder text you'd like
                console.log('Anxiouis From >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Anxiouis To: ", 21, 201); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let anxiouisTo = row.Anxiouis_to_Formula__c;

            if (anxiouisTo !== null && anxiouisTo !== undefined && anxiouisTo !== '') {
                doc.text(anxiouisTo.toString(), 46, 201); // Ensure the value is converted to a string
                console.log('Anxiouis to  >>> ' + anxiouisTo);
            } else {
                doc.text('No data', 46, 201); // Or any placeholder text you'd like
                console.log('Anxiouis to >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Angry From: ", 21, 206); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let angryFrom = row.Angry_from_Formula__c;

            if (angryFrom !== null && angryFrom !== undefined && angryFrom !== '') {
                doc.text(anxiouisTo.toString(), 46, 206); // Ensure the value is converted to a string
                console.log('Angry from  >>> ' + angryFrom);
            } else {
                doc.text('No data', 46, 206); // Or any placeholder text you'd like
                console.log('Angry from >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Angry To: ", 21, 211); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let AngryTo = row.Angry_to_Formula__c;

            if (AngryTo !== null && AngryTo !== undefined && AngryTo !== '') {
                doc.text(AngryTo.toString(), 41, 211); // Ensure the value is converted to a string
                console.log('Angry to  >>> ' + AngryTo);
            } else {
                doc.text('No data', 41, 211); // Or any placeholder text you'd like
                console.log('Angry to >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Guilty From: ", 21, 216); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let GuiltyFRom = row.Guilty_from_Formula__c;

            if (GuiltyFRom !== null && GuiltyFRom !== undefined && GuiltyFRom !== '') {
                doc.text(GuiltyFRom.toString(), 46, 216); // Ensure the value is converted to a string
                console.log('Guilty From >>> ' + GuiltyFRom);
            } else {
                doc.text('No data', 46, 216); // Or any placeholder text you'd like
                console.log('Guilty From >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Guilty To: ", 21, 221); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let GuiltyTo = row.Guilty_to_Formula__c;

            if (GuiltyTo !== null && GuiltyTo !== undefined && GuiltyTo !== '') {
                doc.text(GuiltyTo.toString(), 40, 221); // Ensure the value is converted to a string
                console.log('Guilty to >>> ' + GuiltyTo);
            } else {
                doc.text('No data', 40, 221); // Or any placeholder text you'd like
                console.log('Guilty to >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Worthless From: ", 21, 226); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let WorthlessFrom = row.Worthless_from_Formula__c;

            if (WorthlessFrom !== null && WorthlessFrom !== undefined && WorthlessFrom !== '') {
                doc.text(WorthlessFrom.toString(), 53, 226); // Ensure the value is converted to a string
                console.log('Worthless From >>> ' + WorthlessFrom);
            } else {
                doc.text('No data', 53, 226); // Or any placeholder text you'd like
                console.log('Worthless From >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Worthless To: ", 21, 231); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let WorthlessTo = row.Worthless_to_Formula__c;

            if (WorthlessTo !== null && WorthlessTo !== undefined && WorthlessTo !== '') {
                doc.text(WorthlessTo.toString(), 48, 231); // Ensure the value is converted to a string
                console.log('Worthless to  >>> ' + WorthlessTo);
            } else {
                doc.text('No data', 48, 231); // Or any placeholder text you'd like
                console.log('Worthless to >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Happy From: ", 21, 236); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let happyFRom = row.Happy_from_Formula__c;

            if (happyFRom !== null && happyFRom !== undefined && happyFRom !== '') {
                doc.text(happyFRom.toString(), 47, 236); // Ensure the value is converted to a string
                console.log('happy FRom >>> ' + happyFRom);
            } else {
                doc.text('No data', 47, 236); // Or any placeholder text you'd like
                console.log('happy FRom >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Happy To: ", 21, 241); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let happyTo = row.Happy_to_Formula__c;

            if (happyTo !== null && happyTo !== undefined && happyTo !== '') {
                doc.text(happyTo.toString(), 42, 241); // Ensure the value is converted to a string
                console.log('happy To  >>> ' + happyTo);
            } else {
                doc.text('No data', 42, 241); // Or any placeholder text you'd like
                console.log('happyTo >>> No data available');
            }
            
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Hopeless From: ", 21, 246); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let hopelessFRom = row.Hopeless_from_Formula__c;

            if (hopelessFRom !== null && hopelessFRom !== undefined && hopelessFRom !== '') {
                doc.text(hopelessFRom.toString(), 51, 246); // Ensure the value is converted to a string
                console.log('hopeless From >>> ' + hopelessFRom);
            } else {
                doc.text('No data', 51, 246); // Or any placeholder text you'd like
                console.log('hopeless FRom >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Hopeless To: ", 21, 251); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let hopelessTo = row.Hopeless_to_Formula__c;

            if (hopelessTo !== null && hopelessTo !== undefined && hopelessTo !== '') {
                doc.text(hopelessTo.toString(), 47, 251); // Ensure the value is converted to a string
                console.log('hopeless To  >>> ' + hopelessTo);
            } else {
                doc.text('No data', 47, 251); // Or any placeholder text you'd like
                console.log('hopeless To >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Proud From: ", 21, 256); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let ProudFRom = row.Proud_from_Formula__c;

            if (ProudFRom !== null && ProudFRom !== undefined && ProudFRom !== '') {
                doc.text(ProudFRom.toString(), 46, 256); // Ensure the value is converted to a string
                console.log('Proud From >>> ' + ProudFRom);
            } else {
                doc.text('No data', 46, 256); // Or any placeholder text you'd like
                console.log('Proud FRom >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Proud To: ", 21, 261); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let ProudTo = row.Proud_to_Formula__c;

            if (ProudTo !== null && ProudTo !== undefined && ProudTo !== '') {
                doc.text(ProudTo.toString(), 41, 261); // Ensure the value is converted to a string
                console.log('Proud To  >>> ' + ProudTo);
            } else {
                doc.text('No data', 41, 261); // Or any placeholder text you'd like
                console.log('Proud To >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Confident From: ", 21, 266); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let ConfidentFRom = row.Confident_from_Formula__c;

            if (ConfidentFRom !== null && ConfidentFRom !== undefined && ConfidentFRom !== '') {
                doc.text(ConfidentFRom.toString(), 53, 266); // Ensure the value is converted to a string
                console.log('Confident From >>> ' + ConfidentFRom);
            } else {
                doc.text('No data', 53, 266); // Or any placeholder text you'd like
                console.log('Confident FRom >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Confident To: ", 21, 271); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let ConfidentTo = row.Confident_to_Formula__c;

            if (ConfidentTo !== null && ConfidentTo !== undefined && ConfidentTo !== '') {
                doc.text(ConfidentTo.toString(), 48, 271); // Ensure the value is converted to a string
                console.log('Confident To  >>> ' + ConfidentTo);
            } else {
                doc.text('No data', 48, 271); // Or any placeholder text you'd like
                console.log('Confident To >>> No data available');
            }

            doc.addPage("a4","portrait");

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Energy From: ", 21, 31); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let EnergyFRom = row.Energy_from_Formula__c;

            if (EnergyFRom !== null && EnergyFRom !== undefined && EnergyFRom !== '') {
                doc.text(EnergyFRom.toString(), 47, 31); // Ensure the value is converted to a string
                console.log('Energy From >>> ' + EnergyFRom);
            } else {
                doc.text('No data', 48, 31); // Or any placeholder text you'd like
                console.log('Energy FRom >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Energy To: ", 21, 36); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let EnergyTo = row.Energy_to_Formula__c;

            if (EnergyTo !== null && EnergyTo !== undefined && EnergyTo !== '') {
                doc.text(EnergyTo.toString(), 43, 36); // Ensure the value is converted to a string
                console.log('Energy To  >>> ' + EnergyTo);
            } else {
                doc.text('No data', 43, 36); // Or any placeholder text you'd like
                console.log('Energy To >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Productivity From: ", 21, 41); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let ProductivityFRom = row.Productivity_from_Formula__c;

            if (ProductivityFRom !== null && ProductivityFRom !== undefined && ProductivityFRom !== '') {
                doc.text(ProductivityFRom.toString(), 56, 41); // Ensure the value is converted to a string
                console.log('Productivity From >>> ' + ProductivityFRom);
            } else {
                doc.text('No data', 56, 41); // Or any placeholder text you'd like
                console.log('Productivity FRom >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Productivity To: ", 21, 46); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let ProductivityTo = row.Productivity_to_Formula__c;

            if (ProductivityTo !== null && ProductivityTo !== undefined && ProductivityTo !== '') {
                doc.text(ProductivityTo.toString(), 51, 46); // Ensure the value is converted to a string
                console.log('Productivity To  >>> ' + ProductivityTo);
            } else {
                doc.text('No data', 51, 46); // Or any placeholder text you'd like
                console.log('Productivity To >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Helpfulness From: ", 21, 51); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let HelpfulnessFRom = row.Helpfulness_from_Formula__c;

            if (HelpfulnessFRom !== null && HelpfulnessFRom !== undefined && HelpfulnessFRom !== '') {
                doc.text(HelpfulnessFRom.toString(), 56, 51); // Ensure the value is converted to a string
                console.log('Helpfulness From >>> ' + HelpfulnessFRom);
            } else {
                doc.text('No data', 56, 51); // Or any placeholder text you'd like
                console.log('Helpfulness FRom >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Helpfulness To: ", 21, 56); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let HelpfulnessTo = row.Helpfulness_to_Formula__c;

            if (HelpfulnessTo !== null && HelpfulnessTo !== undefined && HelpfulnessTo !== '') {
                doc.text(HelpfulnessTo.toString(), 52, 56); // Ensure the value is converted to a string
                console.log('Helpfulness To  >>> ' + HelpfulnessTo);
            } else {
                doc.text('No data', 52, 56); // Or any placeholder text you'd like
                console.log('Helpfulness To >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Reported (Staff/Participant): ", 21, 61); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let reportedStaff = row.Sighted_by_Staff_or_Reported_by_Particip__c;

            if (reportedStaff !== null && reportedStaff !== undefined && reportedStaff !== '') {
                doc.text(reportedStaff.toString(), 74, 61); // Ensure the value is converted to a string
                console.log('Reported (Staff/Participant)>>> ' + reportedStaff);
            } else {
                doc.text('No data', 74, 61); // Or any placeholder text you'd like
                console.log('Reported (Staff/Participant)>>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("If Sighted, Specify Type: ", 21, 66); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let sightedSpecify = row.If_Sighted_Specify_Type__c;

            if (sightedSpecify !== null && sightedSpecify !== undefined && sightedSpecify !== '') {
                doc.text(sightedSpecify.toString(), 67, 66); // Ensure the value is converted to a string
                console.log('If SIghted, SPecify Type >>> ' + sightedSpecify);
            } else {
                doc.text('No data', 67, 66); // Or any placeholder text you'd like
                console.log('If Sighted, Specify Type >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("BP Over Target, Notify RN/TL: ", 21, 71); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let bpHightertarget = row.BP_is_Higherthan_Target_Notify_RN_or_TL__c;

            if (bpHightertarget !== null && bpHightertarget !== undefined && bpHightertarget !== '') {
                doc.text(bpHightertarget.toString(), 77, 71); // Ensure the value is converted to a string
                console.log('BP Over Target, Notify RN/TL >>> ' + bpHightertarget);
            } else {
                doc.text('No data', 77, 71); // Or any placeholder text you'd like
                console.log('BP Over Target, Notify RN/TL >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("BP is Lower than Systolic 100: ", 21, 76); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let bpLowerthan = row.BP_is_Lower_than_Systolic_100__c;

            if (bpLowerthan !== null && bpLowerthan !== undefined && bpLowerthan !== '') {
                doc.text(bpLowerthan.toString(), 79, 76); // Ensure the value is converted to a string
                console.log('BP is Lower than systolic 100 >>> ' + bpLowerthan);
            } else {
                doc.text('No data', 79, 76); // Or any placeholder text you'd like
                console.log('BP is Lower than systolic 100 >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Any Bowel Movement: ", 21, 81); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let anyBowelMove = row.Any_Bowelm_Movement__c;

            if (anyBowelMove !== null && anyBowelMove !== undefined && anyBowelMove !== '') {
                doc.text(anyBowelMove.toString(), 64, 81); // Ensure the value is converted to a string
                console.log('Any Bowel Movement >>> ' + anyBowelMove);
            } else {
                doc.text('No data', 64, 81); // Or any placeholder text you'd like
                console.log('Any Bowel Movement >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Medical Appointment: ", 21, 86); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let medicalAppointment = row.Medical_Appointment__c;

            if (medicalAppointment !== null && medicalAppointment !== undefined && medicalAppointment !== '') {
                doc.text(medicalAppointment.toString(), 63, 86); // Ensure the value is converted to a string
                console.log('Medical Appointment >>> ' + medicalAppointment);
            } else {
                doc.text('No data', 63, 86); // Or any placeholder text you'd like
                console.log('Medical Appointment >>> No data available');
            }  

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Charts Updated (Seizure, Bowel): ", 21, 91); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let chartUpdated = row.Charts_Updated__c;

            if (chartUpdated !== null && chartUpdated !== undefined && chartUpdated !== '') {
                doc.text(chartUpdated.toString(), 84, 91); // Ensure the value is converted to a string
                console.log('Charts Updated (Seizure, Bowel) >>> ' + chartUpdated);
            } else {
                doc.text('No data', 84, 91); // Or any placeholder text you'd like
                console.log('Charts Updated (Seizure, Bowel) >>> No data available');
            }
            
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Finances Checked: ", 21, 96); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let financeChecked = row.Finances_Checked__c;

            if (financeChecked !== null && financeChecked !== undefined && financeChecked !== '') {
                doc.text(financeChecked.toString(), 57, 96); // Ensure the value is converted to a string
                console.log('Finances Checked? >>> ' + financeChecked);
            } else {
                doc.text('No data', 57, 96); // Or any placeholder text you'd like
                console.log('Finances Checked? >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Incident Report Completed: ", 21, 101); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let incidentReport = row.Incident_Report_Completed__c;

            if (incidentReport !== null && incidentReport !== undefined && incidentReport !== '') {
                doc.text(incidentReport.toString(), 73, 101); // Ensure the value is converted to a string
                console.log('Incident Report Completed >>> ' + incidentReport);
            } else {
                doc.text('No data', 73, 101); // Or any placeholder text you'd like
                console.log('Incident Report Completed >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Oral Care: ", 21, 106); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let oralCare = row.Oral_Care__c;

            if (oralCare !== null && oralCare !== undefined && oralCare !== '') {
                doc.text(oralCare.toString(), 41, 106); // Ensure the value is converted to a string
                console.log('Oral Care >>> ' + oralCare);
            } else {
                doc.text('No data', 41, 106); // Or any placeholder text you'd like
                console.log('Oral Care >>> No data available');
            }

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Shower Hygiene: ", 21, 111); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let showerHyg = row.Shower_Hygiene__c;  

            if (showerHyg !== null && showerHyg !== undefined && showerHyg !== '') {
                doc.text(showerHyg.toString(), 54, 111); // Ensure the value is converted to a string
                console.log('Shower Hygiene >>> ' + showerHyg);
            } else {
                doc.text('No data', 54, 111); // Or any placeholder text you'd like
                console.log('Shower Hygiene >>> No data available');
            } 

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Medication Taken and Signed Off: ", 21, 116); 
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            let medicationTaken = row.Medication_Taken_and_Signed_Off__c;

            if (medicationTaken !== null && medicationTaken !== undefined && medicationTaken !== '') {
                doc.text(medicationTaken.toString(), 85, 116); // Ensure the value is converted to a string
                console.log('Medication Taken and Signed Off >>> ' + medicationTaken);
            } else {
                doc.text('No data', 85, 116); // Or any placeholder text you'd like
                console.log('Medication Taken and Signed Off >>> No data available');
            } 

            doc.line(10, 326, 195, 326);
        }
           
        this.base64string = btoa(doc.output());
           let docName=row.Name+'.pdf';
           console.log('Docname >>'+docName);
           this.showSpinner = true;
        uploadFile({base64:JSON.stringify(this.base64string), filename:docName, recordId:row.Id,obj:'pform'})
        .then(result=>{
           console.log('Upload result = ' +result);
        })    
                
        const evt = new ShowToastEvent({
            title: 'Success',
            message: 'PDF Generated Sucessfully ',
            variant: 'success',
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
        this.isModal = true;
        setTimeout(() => {
            this.fetchFormlist();
        }, 3000); 
       // this.showSpinner = false;
    } 

    fetchRefreshParticipantForms(){
        this.showSpinner = true;
         this.records=[];
         setTimeout(() => {
             refreshApex(this.fetchFormlist);
             this.showSpinner = false;
         }, 2000); 
     }
}