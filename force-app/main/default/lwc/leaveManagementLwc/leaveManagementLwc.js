import { LightningElement, wire, api, track } from 'lwc';
import getStaffById from '@salesforce/apex/StaffController.getStaffById';
import getLeaves from '@salesforce/apex/LeaveController.getLeaves';
import getLeavesByOrg from '@salesforce/apex/LeaveController.getLeavesByOrg';
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import UserNameFld from '@salesforce/schema/User.Name';
import UserEmail from '@salesforce/schema/User.Email';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import My_Resource from "@salesforce/resourceUrl/myResource";
import ChartJS from '@salesforce/resourceUrl/chratJs'; 
import { loadScript } from 'lightning/platformResourceLoader';


export default class LeaveManagementLwc extends LightningElement {
    
    primary = My_Resource + '/myResource/images/Primary.svg';
    secondary = My_Resource + '/myResource/images/Secondary.svg';
    
    @track clientData;
    @track wiredClientResult;
    @track currentUser;
    @track currentUserEmail;
    @track currentUserRole;
    @track StaffId;
    @track leaveflag=false;
    @track isHome=true;
    @track leaves=[];
    @track duration;
    @track fromDate;
    @track toDate;
    @track type;
    @track Annual;
    @track paid;
    @track unpaid;
    @track balance;
    @track other;
    @track Sick;
    @track Parental;
    @track isFileAttached=false
    @track selectedFilesToUpload = []; //store selected files
    @track showSpinner = false; //used for when to show spinner
    @track fileName;
    @track doc;
    @track fileSize;
    @track file; //holding file instance
    @track myFile;    
    @track fileType;//holding file type
    @track fileReaderObj;
    @track isHome=true;
    @track isModalOpen=false;
    @track isHome2=true;
    @api orgid;
    @track orgleaves;
    @track staffuser=false;
    @track orgadmin=false;
    @track isdisablefields=false;
    @track isstatus=false;
    @track startDate;
    @track endDate;
    @track dateErrorMessage='';
    @track saveButtonDisable=false;
    @track statusValue;
    @track currentMonth;  
    @track currentYear;   
    @track startDate; 
    chart;
    chartjsInitialized = false;                              
    wiredLeaveResult; 
    wiredLeaveorg;


    connectedCallback() {
        if(this.orgid){
        this.currentMonth=new Date().getMonth() + 1;
        this.currentYear=new Date().getFullYear();
        this.calculateDates(); 
        
        
        }else{
            return;
        }
    }
         
    @wire(getRecord, { recordId: Id, fields: [UserNameFld ,UserEmail,UsrRoleName]}) 
    userDetails({error, data}) {
        if (data) {
            this.currentUser = data.fields.Name.value; 
            this.currentUserEmail=data.fields.Email.value;
            this.currentUserRole =data.fields.User_Role__c.value;

            if( this.currentUserRole == 'Portal Account Partner Executive' || this.currentUserRole == 'CEO' || this.currentUserRole == 'Admin' ||this.currentUserRole == 'Portal Account Partner Manager' ){
                this.orgadmin=true;
                this.isHome2=true;
                this.isdisablefields=false;
                this.isstatus=true;
                console.log('orgid'+this.orgid);
             } 
             if(this.currentUserRole == 'Portal Account Partner User'){
                this.staffuser=true;
                this.isHome2=true;
                this.isdisablefields=true;
                this.isstatus=false;
             }
            
           
            console.log('current role ' +this.currentUserRole);
            console.log(' staffUser '+this.staffuser);
            console.log(' org admin  '+ this.orgadmin);
        } else if (error) {
            this.usererror = error ;
        }
    }
 
    /*  connectedCallback() {
        this.disableRightClick();
        this.disableShortcuts();
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
 */

 
    @wire(getStaffById, { recordId: '$StaffId'})
    wiredClient(result) {
        this.wiredClientResult = result;
        console.log('Result: ', result); // Debugging line

        const { data, error } = result;
        if (data) {
            console.log('Data: ', data); // Debugging line
            this.clientData = data;
            this.StaffId = this.clientData[0].Id;
            this.Annual=this.clientData[0].Annual_Leave__c;
            this.Sick=this.clientData[0].Sick_Leave__c;
            this.Parental=this.clientData[0].Parental_Leave__c;
            this.other=this.clientData[0].Bereavement_Leave__c;
        } else if (error) {
            console.error('Error: ', error); // Debugging line
            this.handleError(error);
        }
    }
    
    @wire(getLeaves, { recordId: '$StaffId', OrgId: '$orgid' })
    wiredLeavesForStaff(result) {
        if(!this.StaffId && !this.orgid){
            return;
        }
        this.wiredLeaveResult = result;
        console.log('Result: ', result); // Debugging line

        const { data, error } = result;
        if (data) {
            console.log('Table data: ', data); // Debugging line
            this.leaves = data.map(leave => {
                return {
                    ...leave,
                    fromdate: leave.From__c ? new Date(leave.From__c).toLocaleDateString('en-GB') : '',
                    Todate: leave.To__c ? new Date(leave.To__c).toLocaleDateString('en-GB') : ''
                };
            });
            console.log('Table data......>: '+JSON.stringify(this.leaves));                     
        } else if (error) {
            console.error('Error: ', error); // Debugging line
            this.handleError(error);
        }
    } 

    @track statusCounts = { Approved: 0, Rejected: 0, Requested: 0 };

    @wire(getLeavesByOrg, { orgId: '$orgid', startDate: '$startDate', endDate: '$endDate' })
    wiredLeaves(result) {
        
        console.log('orgId:', this.orgid);          // Log the orgId
        console.log('startDate:', this.startDate);   // Log the startDate
        console.log('endDate:', this.endDate);       // Log the endDate

        this.wiredLeaveorg= result;
        console.log('Result: ',JSON.stringify(result)); // Debugging line

        const { data, error } = result;
        if (data) {
             // Debugging line
            this.orgleaves = data.map(leave => {
                return {
                    ...leave,
                    fromdate: leave.From__c ? new Date(leave.From__c).toLocaleDateString('en-GB') : '',
                    Todate: leave.To__c ? new Date(leave.To__c).toLocaleDateString('en-GB') : '',
                     isLinkEnabled: leave.Status__c !== 'Approved' && leave.Status__c !== 'Rejected'
                };
            });   
            this.statusCounts = { Approved: 0, Rejected: 0, Requested: 0 };

            // Count occurrences of each status
            this.orgleaves.forEach(leave => {
                const status = leave.Status__c;
                if (status === 'Approved') {
                    this.statusCounts.Approved++;
                } else if (status === 'Rejected') {
                    this.statusCounts.Rejected++;
                } else if (status === 'Requested') {
                    this.statusCounts.Requested++;
                }
            });
            this.renderChart();
        } else if (error) {
            console.error('Error: ', error); // Debugging line
            this.handleError(error);
        }
        
    } 
 
    renderChart() {
        // Ensure Chart.js is loaded before rendering
        if (!this.chartjsInitialized) {
            loadScript(this, ChartJS)
                .then(() => {
                    this.chartjsInitialized = true;
                    this.initializeChart();
                })
                .catch(error => {
                    console.error('Error loading ChartJS: ', error);
                });
        } else {
            this.initializeChart();
        }
    }

    initializeChart() {
        const canvas = this.template.querySelector('canvas.chart');
        const ctx = canvas.getContext('2d');
        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Approved', 'Rejected', 'Requested'],
                datasets: [{
                    label: 'Leave Status',
                    data: [
                        this.statusCounts.Approved,
                        this.statusCounts.Rejected,
                        this.statusCounts.Requested
                    ],
                    backgroundColor: ['rgb(144, 245, 144)', 'rgb(238, 101, 101)', 'rgb(255, 255, 0)']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            
                    legend: {
                        display: true,
                        position: "right"
                    }
                
            }
        });
    }

       

    handleleave(event){
        this.leaveflag=true;
        this.isHome2=false;
        this.isModalOpen=false;
         this.duration='';
         this.fromDate='';
         this.toDate='';
         this.type='';
         this.paid='';
         this.unpaid='';
         this.balance='';
         this.leaverecordId='';
         this.isdisablefields=false;
        this.isstatus=false;
        this.fileName='';
    }

    handleCancel(event){
        this.leaveflag=false;
        this.isHome=true;
        this.isHome2=true;
         this.chartjsInitialized = false; 
        this.renderChart();
       /*  this.navigateToToday();  */
       
       
   
    }
    handleInput(event){
        const fieldName = event.target.fieldName;

        if (fieldName === 'From__c') {
            this.fromDate = event.target.value;
        
        } else if (fieldName === 'To__c') {
            this.toDate = event.target.value;
            
        }else if (fieldName === 'Type_of_Leave__c') {
            this.type = event.target.value;
        }
        if (this.fromDate && this.toDate) {
            if (new Date(this.toDate) < new Date(this.fromDate)) { 
                 this.dateErrorMessage = 'You cannot set to date that precedes the from date.';
                 this.saveButtonDisable=true;
            } else {
                this.dateErrorMessage = '';
                this.saveButtonDisable=false;
            }
        }
        
        if (this.fromDate && this.toDate) {
            const duration = this.calculateBusinessDays(new Date(this.fromDate), new Date(this.toDate));
            this.duration = duration;
        }
        if (this.type && this.duration) {
            let leaveBalance;
            if (this.type === 'Annual Leave') {
                leaveBalance = this.Annual;
            } else if (this.type === 'Sick Leave') {
                leaveBalance = this.Sick;
            } else if (this.type === 'Parental Leave') {
                leaveBalance = this.Parental;
            } else if (this.type === 'Other Leave') {
                leaveBalance = this.other;
            } else {
                console.error(`Leave type '${this.type}' is not recognized.`);
                return;
            }
            let remainingBalance = leaveBalance - this.duration;
            this.balance = remainingBalance;
            if (remainingBalance >= 0) {
                this.paid = this.duration;
                this.unpaid = 0;
            } else {
                this.paid = leaveBalance;
                this.unpaid = Math.abs(remainingBalance);
                this.balance=0;
            }
            console.log(`Updated balance: ${this.balance}`);
        }
        
    }
    calculateBusinessDays(startDate, endDate) {
        let count = 0;
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            // Check if current date is a weekend
            if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
                count++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return count;
    }

    handleError(error) {
        // Implement your error handling logic here
        console.error('Error in wired method:', error);
    }
    handleSuccess(event){
        console.log('hi');

        
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Details Saved Successfully",
            variant: "success"
        });
        this.dispatchEvent(toastEvent); 
       // console.log('base64>> ',this.base64FileData);       
        this.showSpinner = true;
        refreshApex(this.wiredLeaveResult);
        refreshApex(this.wiredLeaveorg);
        this.leaveflag=false;
        this.isHome=true;  
        this.isHome2=true;
        let LeaveRecID=event.detail.id;
        //Uploading files to AWS S3 bucket
        if(this.base64FileData!=undefined)
        {
    console.log('file name'+JSON.stringify(this.base64FileData));
        uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId:LeaveRecID, obj:'leave'}).then(result => {
           this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success!!',
                    message: this.file.name + ' - Uploaded Successfully!!!',
                    variant: 'success',
                }),
            );
           
        })
                 
        this.showSpinner = false; 
    }
        
            setTimeout(() => {
                refreshApex(this.wiredLeaveResult);
                refreshApex(this.wiredLeaveorg);
            }, 1200);
         this.fileName='';
        
    }
    handleSubmit(event){
    
         event.preventDefault();
           const fields = event.detail.fields;
             /* if(this.isdisablefields==false){
                fields.Staff__c=this.StaffId;
                this.template.querySelector('lightning-record-edit-form').submit(fields);
             }else{
                console.log('hi');
                if (this.statusValue === 'Rejected' || this.statusValue === 'Approved') {
                    console.log('hi2');
                    fields.Approved_by__c=this.currentUser;
                    this.template.querySelector('lightning-record-edit-form').submit(fields);
                }else{ 
                    console.log('hi3');
                    this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error!!',
                        message:'You can either Approve or Reject',
                        variant: 'Error',
                    }),
                );
                   return;
                }
            
             } */
                if (this.statusValue === 'Rejected' || this.statusValue === 'Approved') {
                    console.log('hi2');
                    fields.Approved_by__c=this.currentUser;
                    this.template.querySelector('lightning-record-edit-form').submit(fields);
                }else{ 
                    console.log('hi3');
                    this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error!!',
                        message:'You can either Approve or Reject',
                        variant: 'Error',
                    }),
                );
                   return;
                }

       }
       onFileUpload(event) {       
        this.isattachError=false;
        if (event.target.files.length > 0) {
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
       /*  console.log('fileName>>',this.fileName);
        console.log('file prepared');
       */
       
    }
    handleStatus(event){
        this.statusValue = event.target.value;
        console.log('status ------>'+this.statusValue);
    }
    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
       // console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
        this.isHome=false;
        this.leaveflag=true;
    }
    closeviewfile(event){
        this.isModalOpen = false;
        this.isHome=true;
        this.isHome2=true;
        this.currentUrl ='';
        this.leaveflag=false;
    }
    @track Docurl;
    handleorgedit(event){
        this.leaveflag=true;
        this.leaverecordId=event.currentTarget.dataset.id;
        this.StaffId=event.currentTarget.dataset.staffid;
        this.Docurl=event.currentTarget.dataset.url;
        this.isdisablefields=true;
        this.isstatus=true;
        this.isHome2=false;
        
    }    
    
    
    previousMonth() {
        if (this.currentMonth > 1) {
            this.currentMonth -= 1;
        } else {
            this.currentMonth = 12; // Wrap to December
            this.currentYear -= 1;  // Move to the previous year
        }
        this.calculateDates(); // Recalculate dates when month changes
        this.fetchLeaveData();
    }

    nextMonth() {
        if (this.currentMonth < 12) {
            this.currentMonth += 1;
        } else {
            this.currentMonth = 1; // Wrap to January
            this.currentYear += 1;  // Move to the next year
        }
        this.calculateDates(); // Recalculate dates when month changes
        this.fetchLeaveData();
    }

    previousYear() {
        this.currentYear -= 1;
        this.calculateDates(); // Recalculate dates when year changes
        this.fetchLeaveData();
    }

    nextYear() {
        this.currentYear += 1;
        this.calculateDates(); // Recalculate dates when year changes
        this.fetchLeaveData();
    }

    // Calculate Start and End Dates
    calculateDates() {
        console.log('Current Year:', this.currentYear);
        console.log('Current Month:', this.currentMonth);
        
        if (this.currentMonth && this.currentYear) {
            // Calculate start of the month
            const startOfMonth = new Date(this.currentYear, this.currentMonth - 1, 1);
            this.startDate = this.formatDate(startOfMonth); // Sets DD-MM-YYYY
            
            // Calculate end of the month (last day of the current month)
            const endOfMonth = new Date(this.currentYear, this.currentMonth, 0); // Last day of current month
            this.endDate = this.formatDate(endOfMonth); // Sets DD-MM-YYYY
            
            console.log('Start date:', this.startDate);
            console.log('End date:', this.endDate);
        } else {
            console.error('Start date cannot be calculated. Month or Year is invalid.');
            this.startDate = undefined;
            this.endDate = undefined;
        }
       /*  if(this.startDate!=undefined && this.endDate!=undefined){
            refreshApex(wiredLeaveorg);
        } */
    }

    // Helper method to format date to DD-MM-YYYY
    formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0'); // Ensure two digits
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensure two digits
        const year = date.getFullYear();
        return `${year}-${month}-${day}`;
    }

    // Method to Fetch Data
    fetchLeaveData() {
        refreshApex(this.wiredLeaveorg);
    }

    // Month and Year Display
    get currentMonthName() {
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        return `${monthNames[this.currentMonth - 1]} ${this.currentYear}`;
    }
    navigateToToday(event){
        this.currentMonth=new Date().getMonth() + 1;
        this.currentYear=new Date().getFullYear();
        this.calculateDates(); 
    }
}