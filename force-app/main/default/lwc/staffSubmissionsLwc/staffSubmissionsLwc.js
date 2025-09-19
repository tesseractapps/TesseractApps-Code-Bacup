import { LightningElement, track, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import USER_ROLE_FIELD from '@salesforce/schema/User.User_Role__c';
import getAllReimbursements from '@salesforce/apex/SubmissionsController.getAllReimbursements';
import PendingReimbursements from '@salesforce/apex/SubmissionsController.PendingReimbursements';
import PendingShifts from '@salesforce/apex/SignInController.PendingShifts';
import createReimbursement from '@salesforce/apex/SignInController.craeteReimbursement';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';

export default class SubmissionJune extends LightningElement {
    @track activeTab = 'approvals';
    @track selectedDate = new Date().toISOString().split('T')[0];
    @track formattedDate = this.formatDisplayDate(new Date());
    @track reimbursementList = [];
    @track submissionList = [];
    @track isLoading = false;
    @track showSpinner = false;
    @track isAdmin = false;
    @track currentUserRole;
    @track rejectedSubmission=false;
    @track visibleSubmissionSection=false;
    @track datePickerString=new Date().toLocaleDateString('en-GB');
    @track PreviousSubmission = false;
    @track attachDisable = true;

    // Modal states
    @track showFileModal = false;
    @track showApprovalModal = false;
    @track currentFileUrl = '';
    @track selectedReimbursementId = '';
    
    // Form data
    @track selectedSubmissionType = '';
    @track vehicleType = '';
    @track amount = '';
    @track mileage = '';
    @track comments = '';
    @track fileName = '';
    @track fileUploadDisabled = true;
    @track submitDisabled = true;
    @track isModalOpen = false;
    @track isHomeApprovals = true;
    @track showApprovals1 = true;
    @track userTypevalueforcurrentlogin;
    @track facilityValuefromcatch;
    @track facilityLabelfromcatch;
    
    
    // File handling
    selectedFile;
    base64FileData;
    
    wiredReimbursementsResult;

    // Computed properties
    get showApprovals() {
        return this.activeTab === 'approvals';
    }
    
    get showSubmissions() {
        return this.activeTab === 'submissions';
    }
    
    get hasReimbursements() {
        return this.reimbursementList && this.reimbursementList.length > 0;
    }
    
    get showSubmissionTable() {
        return this.selectedSubmissionType !== '';
    }
    
    get approvalsTabClass() {
        return this.activeTab === 'approvals' ? 'menu-item1' : 'menu-item';
    }
    
    get submissionsTabClass() {
        return this.activeTab === 'submissions' ? 'menu-item1' : 'menu-item';
    }

    // Options
    submissionTypeOptions = [
        { label: 'Rejected Submissions', value: 'rejected' },
        { label: 'Previous Submissions', value: 'previous' }
    ];
    
    vehicleOptions = [
        { label: 'Fuel', value: 'Fuel' },
        { label: 'Electric', value: 'Electric' }
    ];

    @wire(getRecord, { recordId: Id, fields: [USER_ROLE_FIELD] })
    currentUserInfo({ error, data }) {
        if (data) {
            this.currentUserRole = data.fields.User_Role__c.value;
            this.isAdmin = this.checkAdminRole(this.currentUserRole);
        } else if (error) {
            console.error('Error fetching user info:', error);
        }
    }

    @wire(getAllReimbursements, { startDate: '$selectedDate' })
    wiredReimbursements(result) {
        this.wiredReimbursementsResult = result;
        const { data, error } = result;
        if (data) {
              getCurrentLoggedUserInfo()
                            .then((userInfo) => {
                                const storedFacilityId = localStorage.getItem('defaultFacilityId');
                                const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');

                                console.log('storedFacilityId >>', storedFacilityId);
                                console.log('storedFacilityLabel >>', storedFacilityLabel);

                                if (storedFacilityId && storedFacilityLabel) {
                                this.facilityValuefromcatch = storedFacilityId;
                                this.facilityLabelfromcatch = storedFacilityLabel;
                                }
                                this.userTypevalueforcurrentlogin = userInfo.User_Type__c;
                                console.log('this.userTypevalueforcurrentlogin >>', this.userTypevalueforcurrentlogin);
                                
                                this.reimbursementList = this.processReimbursementData(data);
                                console.log('this.reimbursementList >>', JSON.stringify(this.reimbursementList));
                                this.isLoading = false;
                                })
                            .catch((error) => {
                                console.error('Error fetching current user info:', error);
             });
          
        } else if (error) {
            console.error('Error fetching reimbursements:', error);
            this.isLoading = false;
        }
    }

    connectedCallback() {
        this.isLoading = true;
        this.selectedSubmissionType = 'rejected';
        this.loadInitialData();
        this.loadRejectedSubmissions();
    }

    checkAdminRole(role) {
        const adminRoles = [
            'Portal Account Partner Executive',
            'Portal Account Partner Manager',
            'CEO',
            'Admin'
        ];
        return adminRoles.includes(role);
    }

    get rejectedTabClass() {
        return this.rejectedSubmission
        ? 'slds-tabs_default__item slds-is-active'
        : 'slds-tabs_default__item';
    }

    get previousTabClass() {
        return this.rejectedSubmission
        ? 'slds-tabs_default__item'
        : 'slds-tabs_default__item slds-is-active';
    }

    get isRejectedActive() {
        return this.rejectedSubmission;
    }
    get isPreviousActive() {
        return !this.rejectedSubmission;
    }

    handleRejectedClick() {
        this.selectedSubmissionType = 'rejected';
        this.rejectedSubmission = true;
        this.PreviousSubmission = false;
        this.loadRejectedSubmissions();
        this.shiftselected = true;
        this.attachDisable = true;
        this.vehicleValue = '';
        this.others = '';
        this.amount = '';
        this.comments = '';
        this.selectedFilesToUpload = '';     
        this.file = '';
        this.fileName = '';
        this.fileType = '';
        this.fileSize = ''; 
    }

    handlePreviousClick() {
        this.selectedSubmissionType = 'previous';
        this.rejectedSubmission = false;
        this.PreviousSubmission = true;
        this.loadPreviousSubmissions();
        this.shiftselected = true;
        this.attachDisable = true;
        this.vehicleValue = '';
        this.others = '';
        this.amount = '';
        this.comments = '';
        this.selectedFilesToUpload = '';      
        this.file = '';
        this.fileName = '';
        this.fileType = '';
        this.fileSize = ''; 
    }
    

    processReimbursementData(data) {

        const dataToProcess = (this.userTypevalueforcurrentlogin =='Facility Admin' || this.userTypevalueforcurrentlogin =='HR Admin' || this.userTypevalueforcurrentlogin =='Roster Manager')
                    ? data.filter(user => user.ShiftwithStaff__r?.Add_Shift__r?.Facility__c === this.facilityValuefromcatch)
                    : data;
        return dataToProcess.map(record => ({
            ...record,
            staffName: record.ShiftwithStaff__r?.Staff__r?.NameToDisplay__c || '',
            shiftDate: this.formatDate(record.ShiftDate__c),
            mileage: record.Mileage_Others__c || '0',
            vehicleType: record.Type_of_Vehicle__c || '',
            vehicleTypeClass: this.getVehicleTypeClass(record.Type_of_Vehicle__c),
            costPerKm: record.Fuel_Electric_Price__c || '0',
            mileageAmount: record.Mileage_Amount__c || '0',
            amount: record.Amount__c || '0',
            totalAmount: record.Total_Amount__c || '0',
            status: record.Approval_Status__c || 'Pending',
            statusClass: this.getStatusClass(record.Approval_Status__c),
            approvedDate: this.formatDate1(record.Approved_Date__c),
            hasFile: !!record.Amazon_file_URL__c,
            fileUrl: record.Amazon_file_URL__c,
            profileImage: record.ShiftwithStaff__r?.Staff__r?.picture__c
        }));
    }

    formatDate1(inputDate) {
      if (!inputDate) return '';

      const parts = inputDate.split('/');
      if (parts.length !== 3) return '';

      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];

      return `${day}/${month}/${year}`;
    }

    getVehicleTypeClass(vehicleType) {
        const baseClass = 'vehicle-type';
        switch(vehicleType) {
            case 'Fuel':
                return `${baseClass} fuel`;
            case 'Electric':
                return `${baseClass} electric`;
            default:
                return baseClass;
        }
    }

    getStatusClass(status) {
        const baseClass = 'status-badge';
        switch(status) {
            case 'Pending':
                return `${baseClass} pending`;
            case 'Approved':
                return `${baseClass} approved`;
            case 'Rejected':
                return `${baseClass} rejected`;
            default:
                return baseClass;
        }
    }

    getProfileImage(staff) {
        // Return default avatar or staff photo URL
        return '/resource/DefaultAvatar'; // Replace with actual resource
    }

    formatDate(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-GB');
    }

    formatDisplayDate(date) {
        const options = { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        };
        return date.toLocaleDateString('en-GB', options);
    }

    loadInitialData() {
        // Initial data loading is handled by wire decorators
        this.isLoading = false;
    }

    // Event Handlers
    handleTabChange(event) {
        this.activeTab = event.target.dataset.tab;
        this.shiftselected = true;
        this.resetFormData();
    }

    handleDateChange(event) {
        this.selectedDate = event.target.value;
        this.formattedDate = this.formatDisplayDate(new Date(this.selectedDate));
        this.loadPreviousSubmissions();
        this.loadRejectedSubmissions();
        this.isLoading = true;
        this.shiftselected = true;
    }

    navigateToToday() {
        const today = new Date();
        this.selectedDate = today.toISOString().split('T')[0];
        this.formattedDate = this.formatDisplayDate(today);
        this.loadPreviousSubmissions();
        this.loadRejectedSubmissions();
        this.isLoading = true;
        this.resetFormData();
        this.shiftselected = true;
    }

    navigateToPrevious() {
        const currentDate = new Date(this.selectedDate);
        currentDate.setDate(currentDate.getDate() - 1);
        this.selectedDate = currentDate.toISOString().split('T')[0];
        this.formattedDate = this.formatDisplayDate(currentDate);
        this.isLoading = true;
        this.loadPreviousSubmissions();
        this.loadRejectedSubmissions();
        this.resetFormData();
        this.shiftselected = true;
    }

    navigateToNext() {
        const currentDate = new Date(this.selectedDate);
        currentDate.setDate(currentDate.getDate() + 1);
        this.selectedDate = currentDate.toISOString().split('T')[0];
        this.formattedDate = this.formatDisplayDate(currentDate);
        this.loadPreviousSubmissions();
        this.loadRejectedSubmissions();
        this.isLoading = true;
        this.resetFormData();
        this.shiftselected = true;
    }

    handleViewFile(event) {
        this.currentFileUrl = event.target.dataset.fileUrl;
        this.showFileModal = true;
    }

    handleView(event) {
        event.preventDefault(); 

        const url = event.currentTarget.dataset.fileUrl;
        console.log('url >>', url);

        this.currentUrl = url;
        this.isModalOpen = true;
        this.isHomeApprovals = false;
        this.showApprovals1 = false;

        const fileType = this.getFileType(this.currentUrl);
        console.log('file type: ' + fileType);

        if (fileType !== 'png' && fileType !== 'pdf' && fileType !== 'jpeg' && fileType !== 'jpg' && fileType !== 'csv' && fileType !== 'svg') {
            setTimeout(() => {
                this.closeModal();
            }, 1700);
        }  
    }

    getFileType(url) {
        const fileName = url.substring(url.lastIndexOf('/') + 1);
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    } 

    closeModal() {
        this.isModalOpen = false;
        this.isHomeApprovals=true;
        this.showApprovals1=true;
    }
    

    closeFileModal() {
        this.showFileModal = false;
        this.currentFileUrl = '';
    }

    handleApproveAction(event) {
        this.reimbursementId = event.target.dataset.recordId;
        this.showApprovalModal = true;
    }

    handleClose() {
        this.showApprovalModal = false;
        this.selectedReimbursementId = '';
    }

    handleSuccess() {
        this.showToast('Success', 'Record updated successfully', 'success');
        this.handleClose();
        return refreshApex(this.wiredReimbursementsResult);
    }

    handleApprovalSubmit() {
        this.showSpinner = true;
    }

    submitApproval() {
        const form = this.template.querySelector('lightning-record-edit-form');
        form.submit();
    }

    // Submission form handlers
    handleSubmissionTypeChange(event) {
        this.selectedSubmissionType = event.detail.value;
        this.loadSubmissionData();
    }

    handleVehicleTypeChange(event) {
        this.vehicleType = event.detail.value;
        this.validateForm();
    }

    handleAmountChange(event) {
        this.amount = event.detail.value;
        this.validateForm();
    }

    handleMileageChange(event) {
        this.mileage = event.detail.value;
        this.validateForm();
    }

    handleCommentsChange(event) {
        this.comments = event.detail.value;
        this.validateForm();
    }

    handleFileUpload(event) {
        const files = event.target.files;
        if (files.length > 0) {
            this.showSpinner = true;
            this.selectedFile = files[0];
            this.fileName = this.selectedFile.name;
            
            // Convert to base64
            const reader = new FileReader();
            reader.onload = () => {
                this.base64FileData = reader.result.split(',')[1];
                this.showSpinner = false;
                this.validateForm();
            };
            reader.readAsDataURL(this.selectedFile);
        }
    }

    validateForm() {
        this.submitDisabled = !(
            this.vehicleType && 
            this.amount && 
            this.mileage && 
            this.comments && 
            this.fileName
        );
    }

    handleSubmitForApproval() {
        if (!this.validateSubmission()) {
            return;
        }

        this.showSpinner = true;
        
        createReimbursement({
            signinId: this.selectedShiftId, // You'll need to track this
            Amount: parseFloat(this.amount),
            MileageAndOthers: this.mileage,
            typeofvehicle: this.vehicleType,
            comments: this.comments,
            isupdate: false,
            reimbId: null
        })
        .then(result => {
            this.uploadFileToRecord(result);
        })
        .catch(error => {
            this.showToast('Error', 'Failed to create reimbursement', 'error');
            this.showSpinner = false;
        });
    }

    uploadFileToRecord(recordId) {
        if (this.base64FileData) {
            uploadFile({
                base64: this.base64FileData,
                filename: this.fileName,
                recordId: recordId,
                obj: 'reimburse'
            })
            .then(() => {
                this.showToast('Success', 'Reimbursement submitted successfully', 'success');
                this.resetFormData();
                this.showSpinner = false;
                return refreshApex(this.wiredReimbursementsResult);
            })
            .catch(error => {
                this.showToast('Error', 'Failed to upload file', 'error');
                this.showSpinner = false;
            });
        } else {
            this.showToast('Success', 'Reimbursement submitted successfully', 'success');
            this.resetFormData();
            this.showSpinner = false;
        }
    }

    validateSubmission() {
        if (!this.vehicleType || !this.amount || !this.mileage || !this.comments) {
            this.showToast('Error', 'Please fill all required fields', 'error');
            return false;
        }
        return true;
    }

    loadSubmissionData() {
        // Load submission data based on type
        if (this.selectedSubmissionType === 'rejected') {
            this.loadRejectedSubmissions();
        } else if (this.selectedSubmissionType === 'previous') {
            this.loadPreviousSubmissions();
        }
    }

    @track submissionData = [];

    loadRejectedSubmissions() {
        console.log('this.selectedDate >>', this.selectedDate);
        PendingReimbursements({ startDate: this.selectedDate })
        .then(data => {
            console.log('data >>', JSON.stringify(data));
            this.submissionList = data;
            this.submissionList = this.submissionList.map(item => {
                const rawDate = item.ShiftwithStaff__r?.Date__c;

                let formattedDate = '';
                if (rawDate) {
                    const dateObj = new Date(rawDate);
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const year = dateObj.getFullYear();
                    formattedDate = `${day}/${month}/${year}`;
                }

                return {
                    ...item,
                    formattedDate: formattedDate
                };
            });
            console.log('data >>', JSON.stringify(this.submissionList));
        })
        .catch(error => {
            console.error('Error loading rejected submissions:', error);
        });
    }

    @track signinList1 = [];
    loadPreviousSubmissions() {
        PendingShifts({ startDate: this.selectedDate })
        .then(data => {
            this.signinList1 = data;
            this.signinList1 = this.signinList1.map(item => {
                const originalDate = item.Date__c;

                // Convert to dd/mm/yyyy
                const formattedDate = new Date(originalDate).toLocaleDateString('en-GB'); // "dd/mm/yyyy"

                return {
                    ...item,
                    formattedDate: formattedDate // add new formatted field or replace Date__c if needed
                };
            });
            console.log('this.signinList1 >>',  JSON.stringify(this.signinList1));
        })
        .catch(error => {
            console.error('Error loading previous submissions:', error);
        });
    }

    @track shiftselected = true;
    HandleSignInrowSelection(event){
      const Id = event.currentTarget.dataset.id;
      const logout = event.currentTarget.dataset.logout;
      console.log('shifts slected ' +logout);
                 
        this.reimbursementId='';
        this.selectedShift=Id;	
        this.isUpdate=false;	 	 
         if(logout != null && logout !=undefined  && logout !=''){
          this.attachDisable=false;
          this.shiftselected = true;
        }else{
          this.attachDisable=true;
          this.dispatchEvent(
            new ShowToastEvent({
              title: 'Error',
              message: 'Please provide logout time',
              variant: 'Error'
            })
          );
        }  
    }

    resetFormData() {
        this.vehicleType = '';
        this.amount = '';
        this.mileage = '';
        this.comments = '';
        this.fileName = '';
        this.selectedFile = null;
        this.base64FileData = null;
        this.fileUploadDisabled = true;
        this.submitDisabled = true;
        this.selectedSubmissionType = '';
    }

    @track rejectedSubmission = false;
    @track rejectedlist=[];
    handleSubmissions(event){
      this.visibleSubmissionSection=true;
      this.shiftselected = true;
      console.log('event value '+event.detail.value);
      if(event.detail.value=='RejectedSubmissions'){
          this.rejectedSubmission=true;
      }else{
        this.rejectedSubmission=false;
      }
      this.fileName = '';
      this.selectedFilesToUpload = '';
      this.others = '';
      this.amount = '';
      this.comments = '';
      this.vehicleValue = '';
      this.attachDisable=true;	
    }
    

    setStartDate(_startDate) {
        if (_startDate instanceof Date && !isNaN(_startDate)) {      
          this.datePickerString = _startDate.toISOString();
          //console.log('in strdate',_startDate.toISOString());
          this.startDate = moment(_startDate)
            .day(1)
            .toDate();
          this.startDateUTC =
            moment(this.startDate)
              .utc()
              .valueOf() -
            moment(this.startDate).utcOffset() * 60 * 1000 +
            "";
          this.formattedStartDate = _startDate.toLocaleDateString('en-IN');
        // console.log('strt date',this.startDate);
          this.getStaffShifts(this.datePickerString); 
          PendingShifts({startDate:this.datePickerString}).then(response=>{
          this.signinList = response;
          this.signinList = response.map(signin => ({
            ...signin,
            formattedStartDate: signin.Date__c ? new Date(signin.Date__c).toLocaleDateString('en-GB') : '',
            
        }));
          console.log('Data: in change  ', JSON.stringify(response));
          }); 
        } else {
          this.dispatchEvent(
            new ShowToastEvent({
              message: "Invalid Date",
              variant: "error"
            })
          );
        }
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }

    @api recordId;
    
    @track submissionData = [
        {
            id: '1',
            profileImage: '/resource/ProfileImages/helping_hands_au.jpg',
            staffName: 'Helping Hands AU',
            shiftDate: '09/06/2025',
            loginTime: '00:00 AM',
            logoutTime: '01:00 AM',
            mileageOthers: '10',
            amount: '100',
            comments: 'Test Comments',
            approverComments: ''
        },
        {
            id: '2',
            profileImage: '/resource/ProfileImages/riyaz_foundation.jpg',
            staffName: 'Riyaz Foundation',
            shiftDate: '09/06/2025',
            loginTime: '00:00 AM',
            logoutTime: '01:00 AM',
            mileageOthers: '1233',
            amount: '100',
            comments: 'Test Comments',
            approverComments: ''
        },
        {
            id: '3',
            profileImage: '/resource/ProfileImages/mothers_homes.jpg',
            staffName: 'Mothers Homes',
            shiftDate: '09/06/2025',
            loginTime: '00:00 AM',
            logoutTime: '01:00 AM',
            mileageOthers: '600',
            amount: '270',
            comments: 'Test Comments',
            approverComments: ''
        },
        {
            id: '4',
            profileImage: '/resource/ProfileImages/surya_charitable.jpg',
            staffName: 'Surya Charitable',
            shiftDate: '09/06/2025',
            loginTime: '00:00 AM',
            logoutTime: '01:00 AM',
            mileageOthers: '100',
            amount: '340',
            comments: 'Test Comments',
            approverComments: ''
        }
    ];

    @track vehicleType = 'Electric';
    @track mileage = '20';
    @track comments = '';
    @track amount = '';
    @track selectedSubmissionId = '';
    @track rejectedSubmission = true;

    vehicleTypeOptions = [
        { label: 'Electric', value: 'Electric' },
        { label: 'Petrol', value: 'Petrol' },
        { label: 'Diesel', value: 'Diesel' },
        { label: 'Hybrid', value: 'Hybrid' }
    ];

    acceptedFormats = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];


    @track selectedShift;
    handleRowSelection(event) {
        this.selectedShift = event.target.value;
        console.log('Selected submission:', this.selectedShift);
        this.shiftselected = true;
        this.attachDisable = false;
    }

    handleVehicleTypeChange(event) {
        this.vehicleType = event.detail.value;
    }

    handleMileageChange(event) {
        this.mileage = event.target.value;
    }

    handleCommentsChange(event) {
        this.comments = event.target.value;
    }

    handleAmountChange(event) {
        this.amount = event.target.value;
    }

    handleUploadFinished(event) {
        const uploadedFiles = event.detail.files;
        let uploadedFileNames = '';
        for(let i = 0; i < uploadedFiles.length; i++) {
            uploadedFileNames += uploadedFiles[i].name + ', ';
        }
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: uploadedFiles.length + ' Files uploaded Successfully: ' + uploadedFileNames,
                variant: 'success'
            })
        );
    }

    handleCancel() {
        // Reset form fields
        this.vehicleType = '';
        this.mileage = '';
        this.comments = '';
        this.amount = '';
        this.selectedSubmissionId = '';
        
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Cancelled',
                message: 'Form has been reset',
                variant: 'info'
            })
        );
    }

    handleSendForApproval() {
        if (!this.selectedSubmissionId) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please select a submission first',
                    variant: 'error'
                })
            );
            return;
        }

        if (!this.vehicleType || !this.mileage || !this.amount) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please fill in all required fields',
                    variant: 'error'
                })
            );
            return;
        }

        // Here you would typically call an Apex method to process the submission
        console.log('Sending for approval:', {
            submissionId: this.selectedSubmissionId,
            vehicleType: this.vehicleType,
            mileage: this.mileage,
            comments: this.comments,
            amount: this.amount
        });

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Submission sent for approval successfully',
                variant: 'success'
            })
        );

        // Reset form after successful submission
        this.handleCancel();
    }
    triggerFileInput() {
        this.template.querySelector('input[type="file"]').click();
    }
    onFileUpload(event) {
        this.isattachError=false;
       // console.log('in files upload',event.target.files.length);
        this.reiburseFileLength=event.target.files.length;
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
       // console.log('file prepared');
      }

      handleChange(event){
     
        if(event.target.name=="Amount"){
          this.amount=event.target.value;
        }
        if(event.target.name=="others"){
          this.others=event.target.value;
        }
        if(event.target.name=="comment"){
          this.comments=event.target.value;
        }
        if(event.target.name=="vehicle"){
          this.vehicleValue=event.target.value;
        }
      }

      @track others 
      onSubmitForApproval(){
                console.log('amount '+this.amount);
                console.log('others '+this.others);
                console.log('vehicleValue '+this.vehicleValue);
                console.log('comments '+this.comments);
                console.log('selectedShift '+this.selectedShift);
              if(this.others && this.comments && this.reiburseFileLength ){
                console.log('amount '+this.amount);
                console.log('others '+this.others);
                createReimbursement({signinId:this.selectedShift,Amount:parseFloat(this.amount),MileageAndOthers:this.others, typeofvehicle: this.vehicleValue, comments: this.comments,isupdate:this.isUpdate,reimbId:this.reimbursementId}).then(result => {
               // console.log('reimbursements id'+result);
                this.recordId=result;
               // console.log('rec id'+ this.recordId);
               // console.log('base64FileData'+JSON.stringify(this.base64FileData))
                this.dispatchEvent(
                  new ShowToastEvent({
                      title: 'Success!!',
                      message: 'Submitted for Approval',
                      variant: 'success',
                  }),
                  );
                this.showSpinner = true;
                if(this.fileName.length > 0){
                  console.log('file length'+this.fileName.length);
                  console.log('reimburse recordId'+this.recordId);
                  uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId:this.recordId,obj:'reimburse'}).then(result => {
                     // console.log('Upload result = ' +result);
                      this.fileName = this.fileName + ' - Uploaded Successfully';                
                      //const myTimeout = setTimeout( this.createInvoices(), 10000);          
                      this.dispatchEvent(
                          new ShowToastEvent({
                              title: 'Success!!',
                              message: this.file.name + ' - Uploaded Successfully!!!',
                              variant: 'success',
                          }),
                      );
                      setTimeout(() => {
                        this.signinList = [];
                        //this.setStartDate(new Date(this.datePickerString));
                        refreshApex(this.wiredReimbursementsResult);
                       this.showSpinner = false;
                    }, 2000); 
                    this.fileName = '';
                    this.selectedFilesToUpload = '';
                    this.others = '';
                    this.amount = '';
                    this.comments = '';
                    this.vehicleValue = '';
                    this.showSpinner = false;
                    })
                    .catch(error => {
                        // Error to show during upload
                       // window.console.log(error);
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Error in uploading File',
                                message: error.message,
                                variant: 'error',
                            }),
                        );
                        this.showSpinner = false;
                        this.isUpdate=false;
                        this.fileName = '';
                        this.selectedFilesToUpload = '';
                        this.others = '';
                        this.amount = '';
                        this.comments = '';
                        this.vehicleValue = '';
                        this.showSpinner = false;
                    });
                  }
                }).catch(error=>{
                  this.error = error;
                  this.fileName = '';
                  this.selectedFilesToUpload = '';
                  this.others = '';
                  this.amount = '';
                  this.comments = '';
                  this.vehicleValue = '';
                  this.showSpinner = false;
                  //console.log('Error >>>'+JSON.stringify(this.error));
                });
               // this.setStartDate(new Date());
                this.isUpdate=false;
               } else{
                  this.dispatchEvent(
                    new ShowToastEvent({
                      title: 'Error',
                      message: 'Please provide Mileage, Comments , others and file ',
                      variant: 'Error'
                    })
                  );
                }
                this.isHome=true;
                this.isModalOpen = false;
            }
    
}