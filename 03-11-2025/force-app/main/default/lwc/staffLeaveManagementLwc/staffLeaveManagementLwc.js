import { LightningElement, api, track, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from '@salesforce/apex';
import getLeaves from '@salesforce/apex/LeaveController.getLeaves';
import getStaffById from '@salesforce/apex/StaffController.getStaffById';
import My_Resource from "@salesforce/resourceUrl/myResource";
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import getHolidayCount from '@salesforce/apex/LeaveController.getHolidayCount';
import getHolidayList from '@salesforce/apex/LeaveController.getHolidayList';

export default class StaffLeaveManagementLwc extends LightningElement {

    primary = My_Resource + '/myResource/images/Primary.svg';
    secondary = My_Resource + '/myResource/images/Secondary.svg';
    admin = My_Resource + '/myResource/images/admin.svg';
    infoicon = My_Resource + '/myResource/images/Info_Icon.png';
    infoiconhover = My_Resource + '/myResource/images/Info_Icon_Hover.png';

    @api staffId;
    @api orgId;
    @track noRecordsFlag=false;
    @track leaveflag=false;
    @track homeflag=true;
    @track leaves;
    @track duration;
    @track fromDate='';
    @track toDate='';
    @track type;
    @track Annual;
    @track paid;
    @track unpaid;
    @track balance;
    @track other;
    @track Sick;
    @track Parental;
    @track isdisablefields=false;
    @track dateErrorMessage;
    @track clientData;
    @track showSpinner;
    @track isModalOpen = false;
    @track currentUrl;
    @track typeofUser;
    @track ictUserType=true; 
    @track fieldErrorMap = {};
    //@track state ;
    @track holidayCount=0;
    wiredHolidaysResult;
    @track isHolidayModalOpen = false; 
    @track holidayList = [];
    @track holidays= [];
    wiredLeavesForStaff;
    @track dateSortOrder = 'asc';  
    @track dateSortIcon = 'utility:arrowup'; 
    @track staffState;
    @track selectedYear = '2024-2025';
    @track 
   //@track selectedYear;
   yearOptions =[
    { label:'2023-2024',value:'2023-2024'},
    { label:'2024-2025',value:'2024-2025'},
    { label:'2025-2026',value:'2025-2026'},
    { label:'2026-2027',value:'2026-2027'},
    { label:'2027-2028',value:'2027-2028'},
    { label:'2028-2029',value:'2028-2029'},
   ]

   connectedCallback() {
    window.addEventListener('click', this.handleOutsideClick.bind(this));
    window.addEventListener('keydown', this.handleKeyShortcut.bind(this));
}

disconnectedCallback() {
    window.removeEventListener('click', this.handleOutsideClick.bind(this));
    window.removeEventListener('keydown', this.handleKeyShortcut.bind(this));
}

 handleErrorCss(event) {
    const field = event.target.fieldName;
    const isValid = event.target.reportValidity();
    console.log('isValid',isValid);

    this.fieldErrorMap[field] = !isValid;
}

    getFieldClass(fieldName) {
        return this.fieldErrorMap[fieldName] ? 'floating-label1' : 'floating-label';
    }
    get FromClass() {
        return this.getFieldClass('From__c');
    }
     get ToClass() {
        return this.getFieldClass('To__c');
    }
   
    handleleave(event){
        this.leaveflag=true;
        this.homeflag=true;
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
        this.dateErrorMessage='';
        this.state=this.staffState;
    }
    handleCancel(event){
        this.leaveflag=false;
        this.homeflag=true;
        //this.state = '';
    }

    handleMouseOver(event) {
        const img = event.target;
        img.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out'; // Add dissolve effect
        img.style.opacity = '0'; // Start fade-out for the current image
    
        setTimeout(() => {
            img.src = this.infoiconhover; // Change the image
            img.style.opacity = '1'; // Fade-in the new image
        }, 150); // Wait for the fade-out to complete
    }
    
    handleMouseOut(event) {
        const img = event.target;
        img.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out'; // Add dissolve effect
        img.style.opacity = '0'; // Start fade-out for the current image
    
        setTimeout(() => {
            img.src = this.infoicon; // Change back to the default image
            img.style.opacity = '1'; // Fade-in the default image
        }, 150); // Wait for the fade-out to complete
    }

    @wire(getStaffById, { recordId: '$staffId' })
    wiredClient(result) {
        if (!this.staffId) {
            return; // Exit if no recordId is present
        } 
        this.wiredClientResult = result;
        console.log('staff details: ', result); // Debugging line

        const { data, error } = result;
        if (data) {
            console.log('Data: ', data); // Debugging line
            this.clientData = data;
            this.image = this.clientData[0].picture__c;
            this.StaffId = this.clientData[0].Id;
            this.Annual=this.clientData[0].Annual_Leave__c;
            this.Sick=this.clientData[0].Sick_Leave__c;
            this.Parental=this.clientData[0].Parental_Leave__c;
            this.other=this.clientData[0].Bereavement_Leave__c;
            this.typeOfUser = this.clientData[0].Type_of_User__c; 
            this.staffState =  this.clientData[0].State__c;

            if(this.typeOfUser=='ICT User'){         
                // this.isICtUserInViewForm=true;
                 this.ictUserType=true;
             }else{
                // this.isICtUserInViewForm=false;
                 this.ictUserType=false;
             }

        } else if (error) {
            console.error('Error: ', error); // Debugging line
            this.handleError(error);
        }
        //this.state=this.staffState;
        //console.log('state 1 >> '+this.staffState);
    }

    @wire(getLeaves, { recordId: '$staffId', OrgId: '$orgId' })
    wiredLeavesForStaff(result) {
        if (!this.staffId && !this.orgId) {
            return; // Exit if no recordId is present
        } 
        this.wiredLeaveResult = result;
        console.log('Result: ', result); // Debugging line

        const { data, error } = result;
        this.noRecordsFlag = !(data && data.length > 0);
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

    handleInput(event){
       // console.log('Handle Input Executing');
   const fieldName = event.target.fieldName;
    const field = event.target.fieldName;
    const isValid = event.target.reportValidity();
    console.log('isValid',isValid);
    console.log('field',field);


    this.fieldErrorMap[field] = !isValid;
        //this.state=this.staffState;
       // console.log('state 2 >> '+this.state);
        if (fieldName === 'From__c') {
            this.fromDate = event.target.value;
            console.log('From Date >> '+this.fromDate);
        
        } else if (fieldName === 'To__c') {
            this.toDate = event.target.value;
            console.log('To Date >> '+this.toDate);
            
        }else if (fieldName === 'Type_of_Leave__c') {
            this.type = event.target.value;
        }
        else if (fieldName === 'State__c') {
        this.state = event.target.value;
        }
        //console.log('state 3 >> '+this.state);

        if (this.fromDate && this.toDate && this.state) {
           
            if (new Date(this.toDate) < new Date(this.fromDate)) { 
                 this.dateErrorMessage = 'You cannot set to date that precedes the from date.';
                 this.saveButtonDisable=true;
            } else {
                this.dateErrorMessage = '';
                this.saveButtonDisable=false;
                this.fetchHolidays();
            }
        }
       
        if (this.fromDate && this.toDate && this.state) {
            //this.fetchHolidays();
            
            console.log('holiday count'+this.holidayCount);
            setTimeout(() => {
            if(this.holidayCount !=undefined && this.holidayCount !=null){
                const duration = this.calculateBusinessDays(new Date(this.fromDate), new Date(this.toDate));
                console.log('duration'+duration);
                this.duration = duration - this.holidayCount;

                if (this.type && this.duration && this.state) {
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
        }, 1000);
           
        }
        
        
    }
    fetchHolidays() {
        // Call the Apex method imperatively
        getHolidayCount({ startDate: this.fromDate, endDate: this.toDate, state: this.state })
            .then((data) => {
                console.log('Public Holidays:', data);

                // Assuming data is an array of holiday records
                this.publicHolidays = data.map(holiday => holiday.Date__c);
                this.holidayCount = this.publicHolidays.length; // Get the count of holidays
               
                this.weekendHolidays = data.filter(holiday => {
                    const holidayDate = new Date(holiday.Date__c);
                    const dayOfWeek = holidayDate.getDay();
                    return dayOfWeek === 0 || dayOfWeek === 6;
                });
                this.weekendHolidayCount = this.weekendHolidays.length; 
                console.log(`Holiday Count: ${this.holidayCount}`);
                console.log(`weekend Holiday Count: ${this.weekendHolidayCount}`);
                this.holidayCount=this.holidayCount-this.weekendHolidayCount;
                console.log(` NEW Holiday Count: ${this.holidayCount}`);

            })
            .catch((error) => {
                console.error('Error fetching holidays:', error);
                this.publicHolidays = [];
                this.holidayCount = 0; // No holidays available
            });
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

   /* @wire(getHolidayCount, { startDate: '$fromDate', endDate: '$toDate', state: '$state' })
    wiredHolidays(result) {
        this.wiredHolidaysResult = result; // Store the wire result for refresh
        const { data, error } = result;

        if (data) {
            console.log('Public Holidays:', data);
            this.publicHolidays = data.map(holiday => holiday.Date__c);
             this.holidayCount = this.publicHolidays.length;
            
            this.error = undefined;
        } else if (error) {
            console.error('Error fetching holidays:', error);
            this.error = error;
            this.publicHolidays = [];
        }
    }*/


    handleError(error) {
        // Implement your error handling logic here
        console.error('Error in wired method:', error);
    }
    handleSuccess(event){
        console.log('hi');

        this.leaveflag=false;
        this.homeflag=true; 
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Leave requested successfully.",
            variant: "success"
        });
        this.dispatchEvent(toastEvent); 
       // console.log('base64>> ',this.base64FileData);       
        /* refreshApex(this.wiredLeaveResult); */
        
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
                 
         
    }
        
            setTimeout(() => {
                refreshApex(this.wiredLeaveResult);
            }, 1200);
         this.fileName='';
         this.showSpinner = false;
    }
    handleSubmit(event){
        this.showSpinner = true;
        
         event.preventDefault();
        const fields = event.detail.fields;
        fields.Staff__c=this.staffId;
        this.template.querySelector('lightning-record-edit-form').submit(fields);
         setTimeout(() => {
            this.showSpinner=false;
        }, 2000); 
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
    

    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
    // console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
        this.leaveflag=false;
        this.homeflag=false;
        
    }

    closeviewfile(event) {
        this.isModalOpen = false;
        this.currentUrl = null;
        this.homeflag=true;
        this.leaveflag=false;
    }
     // Fetch holiday list and open modal
     getHolidayList() {
        getHolidayList({state: this.state, financialYear: this.selectedYear})
            .then(result => {
                this.holidays =result;
               // console.log('holidays  >> '+this.holidays);
               //console.log('state 3 >> '+this.state);
                this.sortHolidaysByDate();

                this.isHolidayModalOpen = true;
            })
            .catch(error => {
                console.error('Error fetching holiday list:', error);
            });
    }
    handleSortDate() {
        if (this.dateSortOrder === 'asc') {
            this.dateSortOrder = 'desc'; 
            this.dateSortIcon = 'utility:arrowdown';
        } else {
            this.dateSortOrder = 'asc'; 
            this.dateSortIcon = 'utility:arrowup';
        }
        this.sortHolidaysByDate(); 
    } 
    sortHolidaysByDate() { 
        // Sorting based on the selected order (ascending or descending)
            this.holidayList = [...this.holidays].sort((a, b) => {
            if (this.dateSortOrder === 'asc') {
                 return new Date(a.Date__c) - new Date(b.Date__c);
            } else {
                 return new Date(b.Date__c) - new Date(a.Date__c);
            }
         }).map(holiday => {
            // Formatting the date
            const formattedDate = this.formatDate(holiday.Date__c);

            return {
                ...holiday,
                formattedDate 
            };
           
        });
    }
    formatDate(date) {
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }
    handleHolidayClick() {
       // console.log('handleHolidayClick  is executing>> ');
       //console.log('state 3 >> '+this.state);
       
       refreshApex(this.wiredClientResult); 
       // this.isFinancialYear = true;
        this.getHolidayList(); // Fetch holiday list and open modal
    }
     // Close the modal
     handleCloseModal() {
        this.isHolidayModalOpen = false;
    }
    handleYearChange(event) {
        //this.selectedYear = '2024-25';
        this.selectedYear = event.target.value;
        this.getHolidayList(); 
    }


    //Slide-In-Out-Animation
    @track header = true; // Always true
    @track animationClass = ''; // Tracks the animation class
    
    toggleHeader(event) {
        event.stopPropagation(); // Prevent triggering the outside click listener when clicking the icon
        const gridElement = this.template.querySelector('.grid');
    
        if (gridElement.classList.contains('slide-in')) {
            // Slide out the header
            gridElement.classList.remove('slide-in');
            gridElement.classList.add('slide-out');
    
            // Hide the header after the animation completes
            setTimeout(() => {
                gridElement.style.visibility = 'hidden';
                console.log('Header is now hidden after sliding out.');
            }, 500); // Match the animation duration
        } else {
            // Slide in the header
            gridElement.style.visibility = 'visible'; // Ensure it is visible before sliding in
            gridElement.classList.remove('slide-out');
            gridElement.classList.add('slide-in');
    
            console.log('Header is now visible after sliding in.');
        }
    }
    

handleOutsideClick(event) {
const gridElement = this.template.querySelector('.grid');
if (
    gridElement &&
    !gridElement.contains(event.target) && // Ensure click is outside the grid
    !event.target.closest('img') // Ensure click is not on the icon
) {
    if (gridElement.classList.contains('slide-in')) {
        // Slide out the header
        gridElement.classList.remove('slide-in');
        gridElement.classList.add('slide-out');
    }
}
}

preventClose(event) {
event.stopPropagation(); // Prevent triggering the outside click listener when clicking inside the grid
}

triggerFileInput() {
    this.template.querySelector('input[type="file"]').click();
}

handleKeyShortcut(event) {
        if (event.shiftKey && event.code === 'KeyN') {
            event.preventDefault();
            this.handleleave();
            }
    }
}