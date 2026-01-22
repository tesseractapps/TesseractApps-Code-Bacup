import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation'; 
import searchIssues from '@salesforce/apex/issueRegisterSearch.searchIssues';
import FORM_FACTOR from '@salesforce/client/formFactor';
import { refreshApex } from '@salesforce/apex';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getIssues from '@salesforce/apex/issueRegisterSearch.getIssues';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import Id from '@salesforce/user/Id';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import UserOrgName from '@salesforce/schema/User.Organization_Name__c';
import UserType from '@salesforce/schema/User.User_Type__c';
import { getRecord,getFieldValue  } from 'lightning/uiRecordApi';

const actions = [   
    { label: 'Edit', name: 'edit' }   
 ];

const columns = [ 
         
    { label: 'Case Number',fieldName: 'CaseNumber'}, //type: 'url',  typeAttributes: {label: { fieldName: 'Name__c' }, target: '_Blank'        
   // { label: 'Client Name', fieldName: 'Client_Name__c'  }, //type: 'url',typeAttributes: { label: { fieldName: 'ClientName' }, target: '_Blank'}
    { label: 'Status', fieldName: 'Status_1__c'},   
    { label: 'Priority', fieldName: 'Priority'},
    { label: 'Subject', fieldName: 'Subject'},
    { label: 'Description', fieldName: 'Description'},
    { label: 'Raised by', fieldName: 'User_Name__c'},
    { label: 'Created Date', fieldName: 'Date__c',type: 'date',
        typeAttributes: {
        month: "2-digit",day: "2-digit",year: "numeric"
    }},
    //{ label: 'Amazon URL', fieldName: 'Amazon_URL__c', type: 'url', target: '_Blank'},

    { type: 'action', label: 'Action',   initialWidth: 100, typeAttributes: {rowActions: actions,} }
     
    
];
export default class ContactUsLwc extends NavigationMixin(LightningElement) {    
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

    connectedCallback(){
        let listOfsearchString=[];
        searchIssues({listOfsearchString: JSON.stringify(listOfsearchString), typeofIssue:this.typeofIssue})
                    .then(response=>{
                        this.refreshTable = response;                       
                        this.handleResponseData(response);
                        refreshApex(this.refreshTable);
                        response.forEach(rec=>{
                            this.JSONData[rec.Id]={"typeOfIssue":rec.Type_of_Issue__c,"firstName":rec.First_Name__c,"lastName":rec.Last_Name__c,
                        "client":rec.Client__c,"facilityName":rec.Facility__c,"email":rec.Email__c,"phone":rec.Phone_Number__c,"role":rec.Role__c,"status":rec.Status_1__c,
                        "priorityValue":rec.Priority,"raisedByValue":rec.Allegation__c,"issueTypeValue":rec.Revelant_Issue_Type__c,"incidentDateTime":rec.Date_and_Time_Incident__c,"allegedDateTime":rec.Date_And_Time_Alleged__c,"description":rec.Description,
                        "reportedToPolice":rec.Reported_to_the_Police__c,"policeComments":rec.Police_Comments__c,"clientConcerns":rec.Regarding_the_Issue__c,"actionsTaken":rec.Description1__c,"additionalInfo":rec.Description2__c,"futureActions":rec.Description3__c,"fileName":rec.Amazon_URL__c}
                        });
                        if(response){
                            this.noRecordsFlag= false;
                        }else{
                            this.noRecordsFlag = true;
                        }
                      
        }).catch(err => {
           // console.log('Oh noooo!!');
           // console.log(err);
            //alert(err);
        }); 

        organizationDetails().then(response => {
           // console.log('calling response raja', JSON.stringify(response));
            this.orgId = response.listofPriceBook.Id;
            this.orgname = response.listofPriceBook.Name;             
          //  console.log('orgId>>>>', this.orgId);
            this.fetchIssues();
        });

    }

    @track isOrgAdmin= false;
    @track isStaff = false;
    @track viewfileName='';
    @track isStatusFlag = false;
    @track isNew =false;
    @track isEdit = false;
    @track isRaised = false;
    @wire(getRecord, { recordId: Id, fields: [UsrRoleName,UserOrgName,UserType]}) 
    currentUserInfo({error, data}) {
       // console.log('userid',Id);
       // console.log('data',JSON.stringify(data));
       // console.log('error',JSON.stringify(error)); 
        if (data) {
            this.currentUserRole =data.fields.User_Role__c.value;
            this.isOrgName = data.fields.Organization_Name__c.value;
           // console.log('current logged in user==>'+this.currentUser) ; 
           // console.log('current logged in user orgname==>'+this.userOrgName) ; 
            if(this.currentUserRole =='Portal Account Partner Executive' || this.currentUserRole =='CEO' || this.currentUserRole =='Admin'){
                this.isOrgAdmin = true;
                this.isStaff = false;
                this.isStatusFlag=true;
                this.isRaised=false;
            } else if(this.currentUserRole =='Portal Account Partner User'){
                this.isOrgAdmin = false;
                this.isStaff = true;
                this.isStatusFlag = false;
                this.isEdit = false;
                this.isNew = true;
                this.isRaised = true;
            }
        } else if (error) {
            this.usererror = error ;
        }
    }

    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }

    handleback() {           
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                pageName: 'home'
            }
        }); 
    }
    
    handleResponseData(responseValue){
        if ( responseValue) {
            let tempConList = []; 
            
            responseValue.forEach((record) => {
                let tempConRec = Object.assign({}, record);  
                let conName='';
                tempConRec.incidentId = '/' + tempConRec.Id;
                tempConRec.ClientName = tempConRec.Client_Name__c;
                tempConRec.clientURL = '/' + tempConRec.Client__c;
                tempConRec.FacilityName = tempConRec.Facility_Name__c;
                tempConRec.facilityURL = '/' + tempConRec.Facility__c;
               // tempConRec.caseNumber = tempConRec.CaseNumber;
                tempConList.push(tempConRec);
                
            });
            //this.availableIssues = tempConList;
           // console.log('tempConList>>>>',JSON.stringify(tempConList));          
            this.initialRecords = tempConList;
           // console.log('initialRecords>>>>',JSON.stringify(this.initialRecords));
            this.totalRecords=responseValue.length;
            this.pageSize=5;
            if (this.totalRecords > 5) {
                this.visible = true;
            }
            this.error = undefined;
            this.paginationHelper();
        }
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
            this.availableIssues.push(this.initialRecords[i]);
        }
        refreshApex(this.refreshTable); 
        
    }

    handleClear(){
        let listOfsearchString=[];
        this.searchID='';
        this.facilityName='';
        this.clientName='';
        this.submittedBy='';
        
        searchIssues({listOfsearchString: JSON.stringify(listOfsearchString), typeofIssue:this.typeofIssue})
                    .then(response=>{
                        this.refreshTable = response;
                        this.handleResponseData(response);
                        refreshApex(this.refreshTable);
                      
        });
        
    }
    handleSearch(event){
       // console.log(event.target.label);
        var inp=this.template.querySelectorAll("lightning-input");
        let listOfsearchString=[];
        
        inp.forEach(function(element){
            listOfsearchString.push(element.value)
            if(element.name=="searchID")
                this.searchID=element.value;

            /* else if(element.name=="facilityName")
                this.facilityName=element.value; */

            else if(element.name=="clientName")
                this.clientName=element.value;

           /*  else if(element.name=="submittedBy")
                this.submittedBy=element.value; */
        },this);
       // console.log('Search String>>>'+listOfsearchString);
        searchIssues({listOfsearchString: JSON.stringify(listOfsearchString), typeofIssue:this.typeofIssue})
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
       // console.log('fileName>>',typeof(JSON.stringify(event.target.files) ));
       // console.log('FileName>>>>'+this.fileName);
    }
    
    handleCreateIssue(event){ 
        /* let currentDate= event.currentTarget.dataset.id;
        this.selectedDate =currentDate; */
        this.selectedDate=this.DateFunction();
        //console.log('currentDate>>>>',this.DateFunction());    
        this.headeringName = 'New Issue';
        this.isOpenModal=true;
        this.recordId = '';
        this.fileName = '';
        this.buttonName = 'Save';
        this.email = 'enquiries@tesseractapps.com';
        this.status = 'Open';
        this.viewfileName='';
        this.isNew = true;
        this.isEdit = false;
        this.isRaised = true;
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
    
    @track email;
    handleSubmit(event){ 
        event.preventDefault();
       // console.log('file chk>>',this.isFileAttached);
        const fields=event.detail.fields;        
        
        fields.Type_of_Issue__c = 'Pinnacle support staff';  
        fields.Organization__c = this.orgId; 
        fields.Status_1__c = this.status;
       // console.log('orgaId>>'+fields.Organization__c);  
       // console.log('After fields>>'+JSON.stringify(fields));
        this.template.querySelector('lightning-record-edit-form').submit(fields);      
        //this.isEdit=false;
    } 

    handleSuccess(event){
        this.recordId=event.detail.id;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success!!',
                message: 'Details Saved Successfully !!',
                variant: 'success',
            }),
        ); 
       // console.log('base64>> ',this.base64FileData);       
        this.showSpinner = true;
        //Uploading files to AWS S3 bucket
        if(this.fileName.length > 0){
            uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId: this.recordId,obj:'case'})
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
                //window.console.log(error);
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
        this.isOpenModal = false;           
        this.showSpinner = false;
        setTimeout(() => {
            this.fetchIssues();
        }, 2000);       
    }

    handleContact(event){
        this.contactFlag = true;
    }

    handleRowActions(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        let typeIssue;
        this.recordId = row.Id;
        switch (actionName) {        
            case 'edit': 
                this.buttonName = 'Update';
                this.headeringName = 'Update '+row.CaseNumber;
                this.isOpenModal=true;
                this.fileName = '';
                this.isNew = false;
                this.isEdit =true;
                this.isRaised = false;
                typeIssue = this.JSONData[this.recordId]["typeOfIssue"];
                this.viewfileName = this.JSONData[this.recordId]["fileName"];
                this.status = this.JSONData[this.recordId]["status"];
               // console.log('Status is>>>'+this.status)
               // console.log('TypeofIssue>>>'+typeIssue);
               
                break;            
        }
    } 

    handleChangeStatus(event) {
        this.status = event.detail.value;
       // console.log('Status is>>'+this.status);
    }

    fetchIssues(){
        this.searchID='';
        getIssues({ typeofIssue:'Pinnacle support staff', orgId:this.orgId}).then(InvoiceDetails=>{  
            this.initialRecords = InvoiceDetails;
            this.totalRecords=InvoiceDetails.length;
            this.paginationHelper();
           // console.log('invoice details >>'+JSON.stringify(this.initialRecords));
        })        
        refreshApex(this.initialRecords);
    }

    @track isModalOpen = false;
    @track currentUrl;

    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
       // console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
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

    getFileType(url) {
        const fileName = url.substring(url.lastIndexOf('/') + 1);
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }  
}