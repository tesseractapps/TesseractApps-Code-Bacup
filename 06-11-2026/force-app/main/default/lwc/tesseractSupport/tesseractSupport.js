import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation'; 
import searchIssues from '@salesforce/apex/issueRegisterSearch.searchIssues';
import FORM_FACTOR from '@salesforce/client/formFactor';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import Id from '@salesforce/user/Id';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import UserOrgName from '@salesforce/schema/User.Organization_Name__c';
import UserType from '@salesforce/schema/User.User_Type__c';
import { getRecord,getFieldValue  } from 'lightning/uiRecordApi';
import tesseractCRM from '@salesforce/schema/User.Tesseract_CRM__c';

export default class TesseractSupport extends NavigationMixin(LightningElement) {    
    @track searchID='';
    @track facilityName='';
    @track clientName='';
    @track submittedBy='';
    @track availableIssues;
    @track refreshTable=[];
    @track initialRecords=[];
    error;
    searchString;
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number    
    @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
    @track headeringName;
    @track isOpenModal = false;
    @track buttonName ='';
    @track recordId;
    @track contactFlag = false;
    @track orgId;
    @track orgname;
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
    @track typeofIssue = 'Pinnacle support staff'
    @track userId = Id;
    @track records = [];
    @track StatusValue;
    @track edate;
    @track sdate;

    connectedCallback(){
        let listOfsearchString=[];
        this.fetchIssues(listOfsearchString);

    }

    refreshIssues(){
        let listOfsearchString=[];  
        this.fetchIssues(listOfsearchString);
    }

    fetchIssues(listOfIssues){
        let listOfsearchString=listOfIssues;
        let tempconList=[];
        this.records=[];
        searchIssues({listOfsearchString: JSON.stringify(listOfsearchString), typeofIssue:this.typeofIssue})
                    .then(response=>{
                        response.forEach((rec) => {
                            let tempConRec = Object.assign({}, rec);
                            this.JSONData[rec.Id]={"typeOfIssue":rec.Type_of_Issue__c,"firstName":rec.First_Name__c,"lastName":rec.Last_Name__c,
                               "role":rec.Role__c,"status":rec.Status_1__c,
                                "priorityValue":rec.Priority,"description":rec.Description,"fileName":rec.Amazon_URL__c}
                              
                            tempConRec.Date = new Date(tempConRec.Date__c).toLocaleDateString('en-GB');
                            tempConRec.amazonUrl = tempConRec.Amazon_URL__c;
                            tempConRec.CaseNumber = tempConRec.CaseNumber;
                            tempConRec.orgName = tempConRec.Org_Name__c;
                            tempConRec.Description = tempConRec.Description;
                            tempConRec.Username = tempConRec.User_Name__c;
                            tempConRec.Status=tempConRec.Status_1__c;
                            tempConRec.Priority=tempConRec.Priority;
                            tempConRec.Id= tempConRec.Id;
                            tempConRec.AssignedStaff=tempConRec.Assign_Tesseract_Staff__c;
                            tempconList.push(tempConRec);
                        });

                       
                        if(response){
                            this.noRecordsFlag= false;
                        }else{
                            this.noRecordsFlag = true;
                        }
                        this.records = tempconList;  
                        this.totalRecords = this.records.length;
                        this.pageSize = this.pageSizeOptions[0]; // Set pageSize with default value as first option
                        this.pageNumber = 1;
                        this.paginationHelper();
    
        }).catch(err => {
           
        }); 

    }

    @track viewfileName='';
   
    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }

    get StatusOptions() {
        return [
            { label: 'New', value: 'New' },
            { label: 'Open', value: 'Open' },
            { label: 'In-progress', value: 'In-progress' },
            { label: 'Further info required', value: 'Further info required' },
            { label: 'Resolved', value: 'Resolved' },
        ];
    }

    get PriorityOptions() {
        return [
            { label: 'P1', value: 'P1' },
            { label: 'P2', value: 'P2' },
            { label: 'P3', value: 'P3' },
            { label: 'P4', value: 'P4' },
            { label: 'High', value: 'High' },
            { label: 'Medium', value: 'Medium' },
            { label: 'Low', value: 'Low' },
        ];
    }



    handleback() {           
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                pageName: 'home'
            }
        }); 
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
        // calculate total pages
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        // set page number 
       // console.log('total pages '+this.totalPages );
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
        // set records to display on current page 
        let tempconList=[];
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
               // console.log('break');
                break;
            }  
            let tempConRec = Object.assign({}, this.records[i]);
           
            tempconList.push(tempConRec);           
        }
        this.availableIssues= tempconList;  
       
        console.log('response in new pagination 2'+JSON.stringify(this.availableIssues));            
      
        
    }

    handleClear(){
        let listOfsearchString=[];
        this.searchID='';
        this.StatusValue='';
        this.PriorityValue='';
        this.sdate='';
        this.edate='';
        this.fetchIssues(listOfsearchString);   
    }    

    handleSearch(event){
       // console.log(event.target.label);
        var inp=this.template.querySelectorAll("lightning-input");
        let listOfsearchString=[];
        
        inp.forEach((element) => {
            if (element.name == "searchID") {
                this.searchID = element.value;
                listOfsearchString[0] = element.value || '';
            }
        });
        listOfsearchString[1]='';
        listOfsearchString[2]=''; 
       var comboBoxInpt = this.template.querySelectorAll("lightning-combobox");
    
        comboBoxInpt.forEach((element) => {
            if (element.name == "status") {
                this.StatusValue = element.value;
                listOfsearchString[3] = element.value || '';
            } else if (element.name == "Priority") {
                this.PriorityValue = element.value;
                listOfsearchString[4] = element.value || '';
            }
        });

        inp.forEach((element) => {
            if (element.name == "sdate") {
                this.sdate = element.value;
                listOfsearchString[5] = element.value || '';
            } else if (element.name == "edate") {
                this.edate = element.value;
                listOfsearchString[6] = element.value || '';
            }
        });
            console.log('input strings  '+ listOfsearchString);
            this.fetchIssues(listOfsearchString);
     
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

    hideModalBox(){
        this.isOpenModal=false;
    }

   
    
    
    @track email;
    @track isCRM=false;
    handleRowActions(event) {
        const actionName =  event.currentTarget.dataset.actionname;

        let typeIssue;
        this.recordId = event.currentTarget.dataset.id;
        switch (actionName) {        
                case 'View':
                    /* this.buttonName = 'View';
                    this.headeringName = 'View '+event.currentTarget.dataset.casenum;
                    this.isOpenModal=true;
                    this.viewfileName = this.JSONData[this.recordId]["fileName"]; */
                    this[NavigationMixin.Navigate]({
                        type: "standard__recordPage",
                        attributes: {
                          recordId: this.recordId,
                          objectApiName: "Case", // objectApiName is optional
                          actionName: "view",
                        },
                      });
                
             break;               
        }
    } 

   
    @track isModalOpen = false;
    @track currentUrl;
    @track isHome=true;

    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
        //console.log('file url  '+ this.currentUrl);  
        //this.isModalOpen = true;
        this.isHome=false;

        if(this.currentUrl){
            this.isModalOpen = true;  
        }else{
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Warning!!',
                    message: 'There is no attachments!!',
                    variant: 'warning',
                }),
            ); 
            this.isModalOpen = false; 
            this.isHome=true; 
        }
        const fileType = this.getFileType(this.currentUrl);
        
        //console.log('file type: ' + fileType);
        // Check if the file type is not PNG or PDF
         if (fileType !== 'png' && fileType !== 'pdf' && fileType !== 'jpeg' && fileType !== 'csv' && fileType !== 'svg') {
            setTimeout(() => {
                this.closeModal();
            }, 1700);            
        }          
    }

    closeModal() {
        this.isModalOpen = false;
        this.currentUrl = null;
    }

    closelinvoice(){
        this.isModalOpen = false;
        this.currentUrl = null;
        this.isOpenModal=false;
        this.isHome=true;
    }

    getFileType(url) {
        const fileName = url.substring(url.lastIndexOf('/') + 1);
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }  
}