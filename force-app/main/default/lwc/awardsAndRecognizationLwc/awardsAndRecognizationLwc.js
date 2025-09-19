import { LightningElement, track, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import UserNameFld from '@salesforce/schema/User.Name';
import UserEmail from '@salesforce/schema/User.Email';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import getStaffByEmail from '@salesforce/apex/StaffController.getStaffByEmail';
import getAwards from '@salesforce/apex/AwardController.getAwards';
import getAwardsByOrg from '@salesforce/apex/AwardController.getAwardsByOrg';
import { refreshApex } from '@salesforce/apex';
import getfacilityById from '@salesforce/apex/FacilityController.getfacilityById';
import { loadScript } from "lightning/platformResourceLoader";
import jsPDF from '@salesforce/resourceUrl/jspdf';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import Awards from "@salesforce/resourceUrl/Awards";


export default class AwardsAndRecognizationLwc extends LightningElement {
    primary = Awards + '/images/outstandingsupport.jpg';
    CollaborationExcellenceAward = Awards + '/images/collabrationExecellence.jpg';
    communitychampion = Awards + '/images/communitychampion.jpg';
    participantAchievement = Awards + '/images/participantAchievement.jpg';
    innovation = Awards + '/images/innovation.jpg';
     
    @api orgid;
    @api hrFlag;
    @track Awardflag=false;
    @track homeflag=false;
    @track orgadmin=false;
    @track staffuser=false;
    @track currentUser;
    @track currentUserEmail;
    @track currentUserRole;
    @track StaffId;
    @track Awards;
    @track orgAwards;
    @track clientData;
    @track base64string;
    @track currentDate;
    @track fields;
    @track staff;
    @track manager;
    @track facid ='';
    @track facilityData;
    @track pageSizeOptions = [5, 10, 25, 50, 75, 100]; //Page size options
    @track records = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number  
    @track currentUrl;
    @track isModalOpen=false;
    wiredFacility;
    wiredorgAwards;
    wiredAwardResult;
    recordId;

    renderedCallback() {
        Promise.all([
            loadScript(this, jsPDF).then(() => {
               // console.log("JS loaded jsPDF");
            }).catch(error => {
               // console.error("Error " + error);
            })
        ]);
    }
 

    @wire(getRecord, { recordId: Id, fields: [UserNameFld ,UserEmail,UsrRoleName]}) 
    userDetails({error, data}) {
        if (data) {
            this.currentUser = data.fields.Name.value; 
            this.currentUserEmail=data.fields.Email.value;
            this.currentUserRole =data.fields.User_Role__c.value;
            console.log('hrflag'+this.hrFlag);
            if(this.hrFlag){
                if( this.currentUserRole == 'Portal Account Partner Executive' || this.currentUserRole == 'CEO' || this.currentUserRole == 'Admin' ||this.currentUserRole == 'Portal Account Partner Manager' ){
                    this.orgadmin=true;
                    this.Awardflag=false;
                    this.homeflag=true;
                 }

            } else{
                this.staffuser=true;
                this.Awardflag=false;
                this.homeflag=false;
                this.staff=true;
            
             }
            
             console.log('Org Id ' +this.orgid);
            console.log('current role ' +this.currentUserRole);
            console.log(' staffUser '+this.staffuser);
            console.log(' staffUser '+this.currentUserEmail);
            console.log(' org admin  '+ this.orgadmin);
        } else if (error) {
            this.usererror = error ;
        }
    }
    @wire(getStaffByEmail, { email: '$currentUserEmail' })
    wiredClient(result) {
        this.wiredClientResult = result;
        //console.log('Result: ', result); // Debugging line

        const { data, error } = result;
        if (data) {
           // console.log('Data: ', data); // Debugging line
            this.clientData = data;
            this.StaffId = this.clientData[0].Id;
            console.log('staffid: ',this.StaffId ); 
        } else if (error) {
            console.error('Error: ', error); // Debugging line
            this.handleError(error);
        }
    }
    @wire(getAwards, { recordId: '$StaffId', orgId: '$orgid' })
    wiredAwardsForStaff(result) {
        this.wiredAwardResult = result;
       // console.log('staff: ', result); // Debugging line

        const { data, error } = result;
       
        if (data) {
            console.log('staff data: ', data); // Debugging line
            this.Awards = data.map(Award => {
                return {
                    ...Award,
                    facilityName: `${Award.Facility__r?.Name ?? 'N/A'}`,
                   Todate: Award.Date__c ? new Date(Award.Date__c).toLocaleDateString('en-GB') : '',
                    fullName: `${Award.Staff__r?.Name ?? 'N/A'} ${Award.Staff__r?.Last_Name__c ?? ''}`
                };
            });
            /* console.log('staff data......>: '+JSON.stringify(this.Awards));  */                    
        } else if (error) {
            console.error('Error: ', error); // Debugging line
            this.handleError(error);
        }
    } 
     
 
     @wire(getAwardsByOrg, { orgId: '$orgid' })
    wiredAwards(result) {
        this.records=[];
        this.wiredorgAwards= result;
        //console.log('orgResult: ', result); // Debugging line
        const { data, error } = result;
        console.log('org Award data: '+JSON.stringify(data));
        if (data) {
             // Debugging line
            this.orgAwards = data.map(Award => {
                console.log('staff name  '+Award.Staff__r.Name +Award.Staff__r.Last_Name__c )
                return {
                    ...Award,
                    facilityName: `${Award.Facility__r?.Name ?? 'N/A'}`,
                    Todate: Award.Date__c ? new Date(Award.Date__c).toLocaleDateString('en-GB') : '',
                    fullName: `${Award.Staff__r?.Name ?? 'N/A'} ${Award.Staff__r?.Last_Name__c ?? ''}`
                };
            });   
            this.records =this.orgAwards;              
            this.totalRecords =this.orgAwards.length; // update total records count                 
            this.pageSize = this.pageSizeOptions[0]; //set pageSize with default value as first option
            this.pageNumber = 1;
            this.paginationHelper();
           // console.log('staff data......>: '+JSON.stringify(this.orgAwards));   
        } else if (error) {
            console.error('Error: ', error); // Debugging line
            this.handleError(error);
        }
    } 
 

   
    handleAward(event){
        this.Awardflag=true;
        this.homeflag=true;
        this.currentDate = this.formatCurrentDate();
        this.manager='';

    }
    formatCurrentDate() {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0'); // Ensure two digits
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = today.getFullYear();
        return `${year}-${month}-${day}`;
    }
    
    handleCancel(event){
        this.Awardflag=false;
        this.homeflag=true;
       this.paginationrefresh();

    }
    paginationrefresh(){
        refreshApex(this.wiredorgAwards).then(() => {
            // Reset the pagination after data refresh
            this.pageNumber = 1; // Reset to the first page
            this.pageSize = this.pageSizeOptions[0]; // Set the default page size
            this.paginationHelper(); // Refresh pagination
        }).catch(error => {
            console.error('Error refreshing data: ', error);
        });
        
    }
    
    handleSuccess(event){
        
        
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Details Saved Successfully",
            variant: "success"
        });
        this.dispatchEvent(toastEvent); 
        refreshApex(this.wiredorgAwards);
        this.Awardflag=false;
        this.homeflag=true;
        this.recordId = event.detail.id;
        console.log('new recordid'+this.recordId);
         const fields = event.detail.fields;
         console.log('fields from record edit form: ' + JSON.stringify(this.fields));
        this.generateAndUploadPdf(fields);


        
    }
    handleSubmit(event){
        console.log('hi');
        event.preventDefault();
          const fields = event.detail.fields;
          this.template.querySelector('lightning-record-edit-form').submit(fields);
      }
      
      handlefacility(event) {
        let facilityId = event.target.value;
        console.log('onchange fac id ', facilityId);
    
        // Check if facilityId is valid before calling Apex
        if (!facilityId ) {
            console.error('Invalid facility Id');
            this.manager='';
            return;
        }
    
        getfacilityById({ facId: facilityId })
            .then(result => {
                this.manager=result.Manager_Name__c;
                console.log('Manager: ' + JSON.stringify(result));
            })
            .catch(error => {
                this.error = error;
                this.manager = undefined;
                console.error('Error fetching facility data: ', error);
                this.showToast('Error', 'Error fetching facility data', 'error');
            });
    }
    
    generateAndUploadPdf(fields) {
       
        // Create a new jsPDF instance
        const { jsPDF } = window.jspdf;
       // var doc = new jsPDF();
       let doc = new jsPDF('landscape');

        console.log('jspdf start');
        /* const { Awards__c, Facility__c, Staff__c, Issued_by__c, Date__c } = fields; */
        const awardValue = fields.Awards__c.value;
        const facilityValue = fields.Facility_Name__c.value;
        const staffValue = fields.Staff_Name__c.value;
        const issuedByValue = fields.Issued_by__c.value;
        const name = fields.Name.value;
        const dateValue = new Date(fields.Date__c.value);
        const formattedDate = dateValue.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        console.log('Manager: ' + JSON.stringify(fields));
        const primary = Awards + '/images/outstandingsupport.jpg';
        const CollaborationExcellenceAward = Awards + '/images/collabrationExecellence.jpg';
        const communitychampion = Awards + '/images/communitychampion.jpg';
        const participantAchievement = Awards + '/images/participantAchievement.jpg';
        const innovation = Awards + '/images/innovation.jpg';
        // Add certificate title
        if(awardValue ==='Outstanding Support Worker Award'){
            
        const img = new Image();
        img.src = primary;

        img.onload = () => {
        
        doc.addImage(img, 'JPEG', 0, 0, 297, 210);
       
        doc.setFont("roboto", "italic"); 
        doc.setFontSize(24);
        // Center staff name
        const textWidth1 = doc.getTextWidth(staffValue);
        const xCenter1 = (doc.internal.pageSize.width - textWidth1) / 2; // Calculate x position to center the staff name
        doc.text(staffValue, xCenter1, 95); 
        doc.setFont("roboto", "");
        // Add dynamic values from the form to the certificate
        doc.setFontSize(18);
        const textWidth = doc.getTextWidth(facilityValue); // Get the width of the text
        const xCenter = (doc.internal.pageSize.width - textWidth) / 2; // Calculate x position to center the text
        doc.text(facilityValue, xCenter, 118);
        doc.setFontSize(12);
        doc.text(`${issuedByValue}`, 218, 160);
        doc.text(`${formattedDate}`, 52, 160);
        this.base64string = btoa(doc.output());
        console.log('base64'+JSON.stringify(this.base64string));
        const docName = name+'.pdf';
        console.log('DocName is >> '+ docName);
        this.uploadAwardPdf(doc, name);
        };
    }else if(awardValue ==='Collaboration Excellence Award'){
        const img = new Image();
        img.src = CollaborationExcellenceAward;
    
        img.onload = () => {
            
            doc.addImage(img, 'JPEG', 0, 0, 297, 210);
            doc.setFont("roboto", "italic");  
            doc.setFontSize(24);
            const textWidth1 = doc.getTextWidth(staffValue);
            const xCenter1 = (doc.internal.pageSize.width - textWidth1) / 2; // Calculate x position to center the staff name
            doc.text(staffValue, xCenter1, 104); 
            doc.setFont("roboto", "");
            // Add dynamic values from the form to the certificate
            doc.setFontSize(18);
            const textWidth = doc.getTextWidth(facilityValue); // Get the width of the text
            const xCenter = (doc.internal.pageSize.width - textWidth) / 2; // Calculate x position to center the text
            doc.text(facilityValue, xCenter, 130);
            doc.setFontSize(12);
            doc.text(`${issuedByValue}`, 192, 168);
            doc.text(`${formattedDate}`, 82, 168);
            this.base64string = btoa(doc.output());
            console.log('base64'+JSON.stringify(this.base64string));
            const docName = name+'.pdf';
            console.log('DocName is >> '+ docName);
            this.uploadAwardPdf(doc, name);
            };
       

    }else if(awardValue ==='Community Champion Award'){
        doc = new jsPDF('portrait'); 
        const img = new Image();
        img.src = communitychampion;
    
        img.onload = () => {
            
            doc.addImage(img, 'JPEG', 0, 0, 210, 297);
            doc.setFont("roboto", "italic");  
            doc.setFontSize(24);
            const textWidth1 = doc.getTextWidth(staffValue);
            const xCenter1 = (doc.internal.pageSize.width - textWidth1) / 2; // Calculate x position to center the staff name
            doc.text(staffValue, xCenter1, 150); 
            doc.setFont("roboto", "");
            // Add dynamic values from the form to the certificate
            doc.setFontSize(16);
            const textWidth = doc.getTextWidth(facilityValue); // Get the width of the text
            const xCenter = (doc.internal.pageSize.width - textWidth) / 2; // Calculate x position to center the text
            doc.text(facilityValue, xCenter, 175);
            doc.setFontSize(12);
            doc.text(`${issuedByValue}`, 145, 216);
            doc.text(`${formattedDate}`, 48, 216);
            this.base64string = btoa(doc.output());
            console.log('base64'+JSON.stringify(this.base64string));
            const docName = name+'.pdf';
            console.log('DocName is >> '+ docName);
            this.uploadAwardPdf(doc, name);
            };
       

    }else if(awardValue ==='Participant Achievement Award'){
        const img = new Image();
        img.src = participantAchievement;
    
        img.onload = () => {
            
            doc.addImage(img, 'JPEG', 0, 0, 297, 210);
            doc.setFont("roboto", "italic");  
            doc.setFontSize(24);
            const textWidth1 = doc.getTextWidth(staffValue);
            const xCenter1 = (doc.internal.pageSize.width - textWidth1) / 2; // Calculate x position to center the staff name
            doc.text(staffValue, xCenter1, 104); 
            doc.setFont("roboto", "");
            // Add dynamic values from the form to the certificate
            doc.setFontSize(16);
            const textWidth = doc.getTextWidth(facilityValue); // Get the width of the text
            const xCenter = (doc.internal.pageSize.width - textWidth) / 2; // Calculate x position to center the text
            doc.text(facilityValue, xCenter, 125);
            doc.setFontSize(12);
            doc.text(`${issuedByValue}`, 190, 168);
            doc.text(`${formattedDate}`, 82, 168);
            this.base64string = btoa(doc.output());
            console.log('base64'+JSON.stringify(this.base64string));
            const docName = name+'.pdf';
            console.log('DocName is >> '+ docName);
            this.uploadAwardPdf(doc, name);
            };
       

    }else if(awardValue ==='Innovation in Care Award'){
        const img = new Image();
        img.src = innovation;
    
        img.onload = () => {
            
            doc.addImage(img, 'JPEG', 0, 0, 297, 210);
            doc.setFont("roboto", "italic");  
            doc.setFontSize(24);
            const textWidth1 = doc.getTextWidth(staffValue);
            const xCenter1 = (doc.internal.pageSize.width - textWidth1) / 2; // Calculate x position to center the staff name
            doc.text(staffValue, xCenter1, 104); 
            doc.setFont("roboto", "");
            // Add dynamic values from the form to the certificate
            doc.setFontSize(16);
            const textWidth = doc.getTextWidth(facilityValue); // Get the width of the text
            const xCenter = (doc.internal.pageSize.width - textWidth) / 2; // Calculate x position to center the text
            doc.text(facilityValue, xCenter, 125);
            doc.setFontSize(12);
            doc.text(`${issuedByValue}`, 190, 168);
            doc.text(`${formattedDate}`, 82, 168);
            this.base64string = btoa(doc.output());
            console.log('base64'+JSON.stringify(this.base64string));
            const docName = name+'.pdf';
            console.log('DocName is >> '+ docName);
            this.uploadAwardPdf(doc, name);
            };
       

    } 
    }
    uploadAwardPdf(doc, name) {
        this.base64string = btoa(doc.output());
        console.log('base64' + JSON.stringify(this.base64string));
        const docName = name + '.pdf';
        console.log('DocName is >> ' + docName);
    
        uploadFile({ base64: JSON.stringify(this.base64string), filename: docName, recordId: this.recordId, obj: 'Award' })
            .then(result => {
                // Handle success
            })
            .catch(error => {
                console.error('Received error from server: ', error);
            });
        }
         communityflag=false;
        
    handleView(event) {
       
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        const awardname = event.currentTarget.dataset.awardname;
        console.log('awardname  '+awardname);
        this.currentUrl = url;
        console.log('file url  '+ this.currentUrl);  
        if(awardname === 'Community Champion Award'){
            this.communityflag=true;
        }
          
        this.isModalOpen = true;
        this.staffuser=false;
        this.orgadmin=false;
        this.homeflag=false;
    }
    get awardClass(){
        return this.communityflag ? 'iframewidth2' : 'iframewidth'; // you can use your custom class here.
      } 
    closepdf(event){
        if(this.staff){
        this.isModalOpen = false;
        this.staffuser=true;
        this.orgadmin=false;
        this.homeflag=false;
        this.communityflag=false;

        }else{
            this.isModalOpen = false;
            this.staffuser=false;
            this.orgadmin=true;
            this.homeflag=true;
            this.communityflag=false;
            this.paginationrefresh();
        }
    }
    fetchAwards(event){
        refreshApex(this.wiredorgAwards);
    }
    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
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
    paginationHelper() {
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
       // console.log("totalPages  : "+ JSON.stringify(this.totalPages));
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
        let tempconList=[];   
       // console.log('calling pagination Data1 >>'+JSON.stringify(tempconList));    
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
                break;
            }            
            let tempConRec = Object.assign({}, this.records[i]);           
            tempconList.push(tempConRec);    
        }
        //console.log('calling pagination Data >>'+JSON.stringify(tempconList));
        this.orgAwards = tempconList;
    }
  
}