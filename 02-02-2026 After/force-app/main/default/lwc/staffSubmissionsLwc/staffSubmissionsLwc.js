import { LightningElement, track, wire, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from "@salesforce/apex";
import Id from "@salesforce/user/Id";
import { getRecord } from "lightning/uiRecordApi";
import USER_ROLE_FIELD from "@salesforce/schema/User.User_Role__c";
import getAllReimbursements from "@salesforce/apex/SubmissionsController.getAllReimbursements";
import PendingReimbursements from "@salesforce/apex/SubmissionsController.PendingReimbursements";
import PendingShifts from "@salesforce/apex/SubmissionsController.PendingShifts1";
import createReimbursement from "@salesforce/apex/SignInController.craeteReimbursement";
import uploadFile from "@salesforce/apex/AWSS3FileUploadController.uploadFile";
import getCurrentLoggedUserInfo from "@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo";
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
//import createNotification from '@salesforce/apex/MyNotificationController.createNotification';

export default class SubmissionJune extends LightningElement {
  @track activeTab = "approvals";
  @track selectedDate = new Date().toISOString().split("T")[0];
  @track formattedDate = this.formatDisplayDate(new Date());
  @track reimbursementList = [];
  @track submissionList = [];
  @track isLoading = false;
  @track showSpinner = false;
  @track isAdmin = false;
  @track currentUserRole;
  @track rejectedSubmission = false;
  @track visibleSubmissionSection = false;
  @track datePickerString = new Date().toLocaleDateString("en-GB");
  @track PreviousSubmission = false;
  @track attachDisable = true;

  // Modal states
  @track showFileModal = false;
  @track showApprovalModal = false;
  @track currentFileUrl = "";
  @track selectedReimbursementId = "";

  // Form data
  @track selectedSubmissionType = "";
  @track vehicleType = "";
  @track amount = "";
  @track mileage = "";
  @track comments = "";
  @track fileName = "";
  @track fileUploadDisabled = true;
  @track submitDisabled = true;
  @track isModalOpen = false;
  @track isHomeApprovals = true;
  @track showApprovals1 = true;
  @track userTypevalueforcurrentlogin;
  @track facilityValuefromcatch;
  @track facilityLabelfromcatch;
  @track facilityPrefreedName;
  @track showModal = false;
  @track selectedRoute = "invoice";
  @track selectedReimbursementNumber;
  @track statusValue = 'All'; // default selected value
  @track sdate;
  @track edate;
  @track hasReimbursements = false;
  @track reimbursementmileageAmountforApprove;
  @track reimbursementAmountforApprove;
  @track rejectedSubmission1 = true;
  @track PreviousSubmission1 = true;
  @track recordIdforUpdate;
  @track showrejectedModal = false;
  @track statusValueforUpdate;
  @track pageSizeOptions = [10, 25, 50, 75, 100];
  @track totalRecords = 0;
  @track displayList = [];         // paginated dataset
  @track pageNumber = 1;
  @track pageSize = 10; 
  @track totalPages = 0;
  @track paginatedList = [];
  @track pageNumberSub = 1;
  @track pageSizeSub = 5; // default records per page
  @track totalRecordsSub = 0;
  @track totalPagesSub = 0;
  @track submissionList = [];       // full data
  @track paginatedSubList = []; 
  @track pageSizeOptionssub = [5, 10, 20, 50, 100];
  @track pagedSigninList = [];
  @track pageSizeOptionssub1 = [5, 10, 20, 50, 100];
  @track pageSizeSub1 = 5;
  @track pageNumberSub1 = 1;
  @track totalPagesSub1 = 1;
  @track totalRecordsSub1 = 0;
  @track signinList1 = [];
  @track facilityPreferredName;
  @track participantPreferredName;
  @track staffPreferredName;



  mileageBillOptions = [
    { label: 'Participant', value: 'Participant' },
    { label: 'Organization', value: 'Organisation' }
  ];
  serviceAmountOptions = [
    { label: 'Participant', value: 'Participant' },
    { label: 'Organisation', value: 'Organisation' }
  ];

  // File handling
  selectedFile;
  base64FileData;

  wiredReimbursementsResult;

  // Computed properties
  get showApprovals() {
    return this.activeTab === "approvals";
  }

  get showSubmissions() {
    return this.activeTab === "submissions";
  }

  get showSubmissionTable() {
    return this.selectedSubmissionType !== "";
  }

  get approvalsTabClass() {
    return this.activeTab === "approvals" ? "menu-item1" : "menu-item";
  }

  get submissionsTabClass() {
    return this.activeTab === "submissions" ? "menu-item1" : "menu-item";
  }

  // Options
  submissionTypeOptions = [
    { label: "Rejected Submissions", value: "rejected" },
    { label: "Previous Submissions", value: "previous" }
  ];

  vehicleOptions = [
    { label: "Fuel", value: "Fuel" },
    { label: "Electric", value: "Electric" }
  ];

  @wire(getRecord, { recordId: Id, fields: [USER_ROLE_FIELD] })
  currentUserInfo({ error, data }) {
    if (data) {
      this.currentUserRole = data.fields.User_Role__c.value;
      this.isAdmin = this.checkAdminRole(this.currentUserRole);
    } else if (error) {
      console.error("Error fetching user info:", error);
    }
  }

  @wire(getAllReimbursements, { startDate: '$sdate', endDate: '$edate', status: '$statusValue' })
  wiredReimbursements(result) {
      this.wiredReimbursementsResult = result;
      const { data, error } = result;

      if (data) {
           console.log(`🔄 DATA IN wiredReimbursements : `, JSON.stringify(data));

          getCurrentLoggedUserInfo()
              .then((userInfo) => {
                  const storedFacilityId = localStorage.getItem("defaultFacilityId");
                  const storedFacilityLabel = localStorage.getItem("defaultFacilityLabel");

                  console.log("storedFacilityId >>", storedFacilityId);
                  console.log("storedFacilityLabel >>", storedFacilityLabel);

                  if (storedFacilityId && storedFacilityLabel) {
                      this.facilityValuefromcatch = storedFacilityId;
                      this.facilityLabelfromcatch = storedFacilityLabel;
                  }

                  this.userTypevalueforcurrentlogin = userInfo.User_Type__c;
                  console.log("this.userTypevalueforcurrentlogin >>", this.userTypevalueforcurrentlogin);

                  this.reimbursementList = this.processReimbursementData(data);
                  console.log("this.reimbursementList >>", JSON.stringify(this.reimbursementList));
                  console.log(' Length >>>>', this.reimbursementList.length);
                  console.log(' Length >>>>', this.reimbursementList.length > 0);
                  this.totalRecords = this.reimbursementList.length;
                  this.pageNumber = 1;        
                  this.paginationHelper();
                  this.hasReimbursements = this.reimbursementList.length > 0;
                  this.totalRecords = this.reimbursementList.length;
                  console.log('this.totalRecords >>', this.totalRecords);
                  this.isLoading = false;
              })
              .catch((error) => {
                  console.error("Error fetching current user info:", error);
                  this.hasReimbursements = false;
              });
      } else if (error) {
          console.error("Error fetching reimbursements:", error);
          this.isLoading = false;
      }
  }

  connectedCallback() {

    const today = new Date();
    console.log('📅 Today:', this.formatDateLocal(today));

    // Start of the month
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    console.log('✅ Start of Month:', this.formatDateLocal(start));

    // End of the month
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    console.log('✅ End of Month:', this.formatDateLocal(end));

    // Assign formatted dates
    this.sdate = this.formatDateLocal(start);
    this.edate = this.formatDateLocal(end);

    console.log(`🎯 Final Assigned -> Start Date: ${this.sdate}, End Date: ${this.edate}`);
   
    setTimeout(() => {
        refreshApex(this.wiredReimbursementsResult);
      }, 0);

    // Initial load
    this.isLoading = true;
    this.selectedSubmissionType = "rejected";
    this.loadInitialData();
    this.loadRejectedSubmissions();
    this.loadPreviousSubmissions();
    this.fetchOrgDetails();
    this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "Participant";
    this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Facility";
    this.staffPreferredName = localStorage.getItem("defaultStaffPreferredName") || "Staff";
    const savedTab = localStorage.getItem('activeReimbursementTab');
    this.activeTab = savedTab || 'approvals';

  }

  formatDateLocal(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  }

  handleDates(event) {
    const { name, value } = event.target;

    if (name === 'sdate') {
        this.sdate = value;
        console.log('📅 Start Date changed →', this.sdate);
    } else if (name === 'edate') {
        this.edate = value;
        console.log('📅 End Date changed →', this.edate);
    }

    this.loadPreviousSubmissions();
    this.loadRejectedSubmissions();

    console.log(`🔎 Current Date Range → Start: ${this.sdate}, End: ${this.edate}`);
  }

  // filter on combobox change
  handleStatusChange(event) {
      this.statusValue = event.detail.value;
      console.log('📌 Status changed →', this.statusValue);

     
      if(this.activeTab === "submissions"){
        console.log('activeTab : ', this.activeTab);
        this.loadRejectedSubmissions();
      } else {
         if (this.statusValue === 'All') {
             console.log('this.allReimbursements in status onchange  if All : ',this.allReimbursements);
            this.reimbursementList = this.allReimbursements;
        } else {
            this.reimbursementList = this.allReimbursements.filter(
                rec => rec.Approval_Status__c === this.statusValue
            );
        }

        // 👇 Keep the "no data" template in sync
        this.hasReimbursements = this.reimbursementList.length > 0;

        console.log('✅ Filtered reimbursements:', JSON.stringify(this.reimbursementList));
      }
      
  }

  checkAdminRole(role) {
    const adminRoles = [
      "Portal Account Partner Executive",
      "Portal Account Partner Manager",
      "CEO",
      "Admin"
    ];
    return adminRoles.includes(role);
  }

  get rejectedTabClass() {
    return this.rejectedSubmission
      ? "slds-tabs_default__item slds-is-active"
      : "slds-tabs_default__item";
  }

  get previousTabClass() {
    return this.rejectedSubmission
      ? "slds-tabs_default__item"
      : "slds-tabs_default__item slds-is-active";
  }

  get isRejectedActive() {
    return this.rejectedSubmission;
  }
  get isPreviousActive() {
    return !this.rejectedSubmission;
  }

  handleRejectedClick() {
    this.selectedSubmissionType = "rejected";
    this.rejectedSubmission = true;
    this.PreviousSubmission = false;
    this.loadRejectedSubmissions();
    this.loadPreviousSubmissions();
    this.shiftselected = false;
    this.attachDisable = true;
    this.vehicleValue = "";
    this.others = "";
    this.amount = "";
    this.comments = "";
    this.selectedFilesToUpload = "";
    this.file = "";
    this.fileName = "";
    this.fileType = "";
    this.fileSize = "";
  }

  handlePreviousClick() {
    this.selectedSubmissionType = "previous";
    this.rejectedSubmission = false;
    this.PreviousSubmission = true;
    this.loadPreviousSubmissions();
    this.shiftselected = false;
    this.attachDisable = true;
    this.vehicleValue = "";
    this.others = "";
    this.amount = "";
    this.comments = "";
    this.selectedFilesToUpload = "";
    this.file = "";
    this.fileName = "";
    this.fileType = "";
    this.fileSize = "";
  }

 processReimbursementData(data) {
    console.log("processReimbursementData is calling  >>");
    const dataToProcess =
    //  this.userTypevalueforcurrentlogin == "NDIS Org Admin" ||
      this.userTypevalueforcurrentlogin == "Facility Admin" ||
      this.userTypevalueforcurrentlogin == "HR Admin" ||
      this.userTypevalueforcurrentlogin == "Roster Manager"
        ? data.filter(
            (user) =>
              user.ShiftwithStaff__r?.Add_Shift__r?.Facility__c ===
              this.facilityValuefromcatch
          )
        : data;

    return dataToProcess.map((record) => {
      const status = record.Approval_Status__c || "Pending";

      return {
        ...record,
        staffName: record.ShiftwithStaff__r?.Staff__r?.NameToDisplay__c || "",
        shiftDate: this.formatDate(record.ShiftDate__c),
        mileage: record.Mileage_Others__c || "0",
        vehicleType: record.Type_of_Vehicle__c || "",
        vehicleTypeClass: this.getVehicleTypeClass(record.Type_of_Vehicle__c),
        costPerKm: record.Fuel_Electric_Price__c || "0",
        mileageAmount: record.Mileage_Amount__c || "0",
        amount: record.Amount__c || "0",
        totalAmount: record.Total_Amount__c || "0",
        status: status,
        statusClass: this.getStatusClass(status),
        approvedDate: this.formatDate1(record.Approved_Date__c),
        hasFile: !!record.Amazon_file_URL__c,
        fileUrl: record.Amazon_file_URL__c,
        profileImage: record.ShiftwithStaff__r?.Staff__r?.picture__c,

        // ✅ New Flags
        isPending: status === "Pending",
        isApproved: status === "Approved",
        isRejected: status === "Rejected"
      };
    });
  }


  formatDate1(inputDate) {
    if (!inputDate) return "";

    const parts = inputDate.split("/");
    if (parts.length !== 3) return "";

    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[2];

    return `${day}/${month}/${year}`;
  }

  getVehicleTypeClass(vehicleType) {
    const baseClass = "vehicle-type";
    switch (vehicleType) {
      case "Fuel":
        return `${baseClass} fuel`;
      case "Electric":
        return `${baseClass} electric`;
      default:
        return baseClass;
    }
  }

  fetchOrgDetails() {
    orgDetails()
      .then((response) => {
        console.log("Response for Org Details =>", response);
        this.Orgid = response.Id;
        this.orgfullname = response.Name;
        // this.facilityPreferredName =
        //   response.Facility_Preferred_Name_Formula__c;
        // this.participantPreferredName =
        //   response.Participant_Preferred_Name_Formula__c;
        // console.log(
        //   "this.facilityPreferredName =>",
        //   this.facilityPreferredName
        // );
      })
      .catch((error) => {
        console.error("Error fetching org details:", error);
        this.error = error;
      });
  }

  getStatusClass(status) {
    const baseClass = "status-badge";
    switch (status) {
      case "Pending":
        return `${baseClass} pending`;
      case "Approved":
        return `${baseClass} approved`;
      case "Rejected":
        return `${baseClass} rejected`;
      default:
        return baseClass;
    }
  }

  getProfileImage(staff) {
    // Return default avatar or staff photo URL
    return "/resource/DefaultAvatar"; // Replace with actual resource
  }

  formatDate(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB");
  }

  formatDisplayDate(date) {
    const options = {
      day: "numeric",
      month: "short",
      year: "numeric"
    };
    return date.toLocaleDateString("en-GB", options);
  }

  loadInitialData() {
    // Initial data loading is handled by wire decorators
    this.isLoading = false;
  }

  get statusOptions() {
        return [
            { label: 'All', value: 'All' },
            { label: 'Pending', value: 'Pending' },
            { label: 'Rejected', value: 'Rejected' },
            { label: 'Approved', value: 'Approved' }
        ];
    }

  // Event Handlers
  handleTabChange(event) {
    this.activeTab = event.target.dataset.tab;
    this.shiftselected = false;
    this.resetFormData();
     localStorage.setItem('activeReimbursementTab', this.activeTab);
  }

  handleDateChange(event) {
    this.selectedDate = event.target.value;
    this.formattedDate = this.formatDisplayDate(new Date(this.selectedDate));
    this.loadPreviousSubmissions();
    this.loadRejectedSubmissions();
    this.isLoading = true;
    this.shiftselected = false;
  }

  navigateToToday() {
    const today = new Date();
    this.selectedDate = today.toISOString().split("T")[0];
    this.formattedDate = this.formatDisplayDate(today);
    this.loadPreviousSubmissions();
    this.loadRejectedSubmissions();
    this.isLoading = true;
    this.resetFormData();
    this.shiftselected = false;
  }

  navigateToPrevious() {
    const currentDate = new Date(this.selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    this.selectedDate = currentDate.toISOString().split("T")[0];
    this.formattedDate = this.formatDisplayDate(currentDate);
    this.isLoading = true;
    this.loadPreviousSubmissions();
    this.loadRejectedSubmissions();
    this.resetFormData();
    this.shiftselected = false;
  }

  navigateToNext() {
    const currentDate = new Date(this.selectedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    this.selectedDate = currentDate.toISOString().split("T")[0];
    this.formattedDate = this.formatDisplayDate(currentDate);
    this.loadPreviousSubmissions();
    this.loadRejectedSubmissions();
    this.isLoading = true;
    this.resetFormData();
    this.shiftselected = false;
  }

  handleViewFile(event) {
    this.currentFileUrl = event.target.dataset.fileUrl;
    this.showFileModal = true;
  }

  handleView(event) {
    event.preventDefault();

    const url = event.currentTarget.dataset.fileUrl;
    console.log("url >>", url);

    this.currentUrl = url;
    this.isModalOpen = true;
    this.isHomeApprovals = false;
    this.showApprovals1 = false;

    const fileType = this.getFileType(this.currentUrl);
    console.log("file type: " + fileType);

    if (
      fileType !== "png" &&
      fileType !== "pdf" &&
      fileType !== "jpeg" &&
      fileType !== "jpg" &&
      fileType !== "csv" &&
      fileType !== "svg"
    ) {
      setTimeout(() => {
        this.closeModal();
      }, 1700);
    }
  }

  getFileType(url) {
    const fileName = url.substring(url.lastIndexOf("/") + 1);
    return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
  }

  closeModal() {
    this.isModalOpen = false;
    this.isHomeApprovals = true;
    this.showApprovals1 = true;
  }

  closeFileModal() {
    this.showFileModal = false;
    this.currentFileUrl = "";
  }

  handleApproveAction(event) {
    this.reimbursementId = event.target.dataset.recordId;
    const recordName  = event.currentTarget.dataset.name;
    this.reimbursementNameforApprove =  recordName;
    this.showApprovalModal = true;
  }

  handleClose() {
    this.showApprovalModal = false;
    this.selectedReimbursementId = "";
  }

  handleSubmit(event) {
      event.preventDefault(); // stop default
      const fields = event.detail.fields;
      // override values manually
      if(this.statusValueforUpdate === 'Approved'){
        fields.Approval_Status__c ='Approved';
      } else if(this.statusValueforUpdate === 'Rejected'){
        fields.Approval_Status__c ='Rejected';
      }
      

      this.template.querySelector('lightning-record-edit-form').submit(fields);
  }


  getFieldClass(fieldName) {
    return this.fieldErrorMap[fieldName]
      ? "floating-label2"
      : "floating-label-signin";
  }
  get LogInDateTimeClass() {
    return this.getFieldClass("Approver_Comments__c");
  }

  handleSuccess() {
    if (this.statusValueforUpdate === 'Approved') {
        this.showToast("Success", "Approval updated successfully", "success");
    } else if (this.statusValueforUpdate === 'Rejected') {
        this.showToast("Success", "Rejected updated successfully", "success");
    }
    this.handleClose();
    this.loadRejectedSubmissions();
    this.loadPreviousSubmissions();
    return refreshApex(this.wiredReimbursementsResult);
  }

  handleApprovalSubmit() {
    this.showSpinner = true;
  }

  submitApproval() {
    const form = this.template.querySelector("lightning-record-edit-form");
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
        this.base64FileData = reader.result.split(",")[1];
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
      .then((result) => {
        this.uploadFileToRecord(result);
      })
      .catch((error) => {
        this.showToast("Error", "Failed to create reimbursement", "error");
        this.showSpinner = false;
      });
  }

  uploadFileToRecord(recordId) {
    if (this.base64FileData) {
      uploadFile({
        base64: this.base64FileData,
        filename: this.fileName,
        recordId: recordId,
        obj: "reimburse"
      })
        .then(() => {
          this.showToast(
            "Success",
            "Reimbursement submitted successfully",
            "success"
          );
          this.resetFormData();
          this.showSpinner = false;
          return refreshApex(this.wiredReimbursementsResult);
        })
        .catch((error) => {
          this.showToast("Error", "Failed to upload file", "error");
          this.showSpinner = false;
        });
    } else {
      this.showToast(
        "Success",
        "Reimbursement submitted successfully",
        "success"
      );
      this.resetFormData();
      this.showSpinner = false;
    }
  }

  validateSubmission() {
    if (!this.vehicleType || !this.amount || !this.mileage || !this.comments) {
      this.showToast("Error", "Please fill all required fields", "error");
      return false;
    }
    return true;
  }

  loadSubmissionData() {
    // Load submission data based on type
    this.loadRejectedSubmissions();
    this.loadPreviousSubmissions();
  }

  @track submissionData = [];

  loadRejectedSubmissions() {
  console.log("📌 Calling PendingReimbursements with:", {
    sdate: this.sdate,
    edate: this.edate
  });

  PendingReimbursements({
    sdate: this.sdate,
    edate: this.edate,
    status: this.statusValue
  })
    .then((data) => {
      console.log("✅ Raw data received in PendingReimbursements :", JSON.stringify(data));

      this.submissionList = data.map((item, index) => {
        console.log(`🔄 Processing record #${index + 1}:`, JSON.stringify(item));

        const rawDate = item.ShiftwithStaff__r?.Date__c;
        let formattedDate = "";

        if (rawDate) {
          const dateObj = new Date(rawDate);
          const day = String(dateObj.getDate()).padStart(2, "0");
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const year = dateObj.getFullYear();
          formattedDate = `${day}/${month}/${year}`;
        }

        const statusStyle = this.getStatusClass(item.Approval_Status__c);
        const vehicleStyle = this.getVehicleTypeClass(item.Type_of_Vehicle__c);

        console.log(`📅 Formatted Date: ${formattedDate}`);
        console.log(`🎨 Status Style for ${item.Approval_Status__c}: ${statusStyle}`);
        console.log(`🚗 Vehicle Style for ${item.Type_of_Vehicle__c}: ${vehicleStyle}`);

        return {
          ...item,
          formattedDate,
          statusStyle,
          vehicleStyle
        };
      });
      this.totalRecordsSub = this.submissionList.length;
      this.pageNumberSub = 1;
      this.paginationHelperSub();

      console.log("📊 Final submissionList:", JSON.stringify(this.submissionList));
    })
    .catch((error) => {
      console.error("❌ Error loading rejected submissions:", error);
    });
}


  @track signinList1 = [];
  loadPreviousSubmissions() {
    PendingShifts({
      sdate: this.sdate,
      edate: this.edate
    })
      .then((data) => {
        console.log("data  in PendingShifts >> ", JSON.stringify(data));
        this.signinList1 = data.map((item) => {
          const originalDate = item.Date__c;

          // Convert to dd/mm/yyyy
          const formattedDate = new Date(originalDate).toLocaleDateString("en-GB");

          return {
            ...item,
            formattedDate: formattedDate
          };
        });
        console.log("this.signinList1 >>", JSON.stringify(this.signinList1));
        this.totalRecordsSub1 = this.signinList1.length;
        this.totalPagesSub1 = Math.ceil(this.totalRecordsSub1 / this.pageSizeSub1);
        this.updatePagedData();
      })
      .catch((error) => {
        console.error("Error loading previous submissions:", error);
      });
  }


  @track shiftselected = false;
  handleSignInRowSelection(event) {
    const recordId = event.currentTarget.dataset.id;
    let logoutTime = event.currentTarget.dataset.logout;

    this.recordIdforUpdate = recordId;
    console.log('✅ Apply clicked for:', recordId, '| Logout:', logoutTime);

    // Normalize values
    if (logoutTime === "null" || logoutTime === "undefined" || logoutTime === "") {
      logoutTime = null;
    }

    if (logoutTime) {
      this.attachDisable = false;
      this.shiftselected = true;
      console.log('➡️ Proceeding with reimbursement for:', recordId);
    } else {
      this.attachDisable = true;
      this.dispatchEvent(
        new ShowToastEvent({
          title: 'Error',
          message: 'Shift must be completed with logout time to proceed.',
          variant: 'error'
        })
      );
    }
  }


  handleCloseForm() {
    this.shiftselected = false;
    this.showrejectedModal = false;
  }

  resetFormData() {
    this.vehicleType = "";
    this.amount = "";
    this.mileage = "";
    this.comments = "";
    this.fileName = "";
    this.selectedFile = null;
    this.base64FileData = null;
    this.fileUploadDisabled = true;
    this.submitDisabled = true;
    this.selectedSubmissionType = "";
    this.vehicleValue = "";
    this.others = "";
  }

  @track rejectedSubmission = false;
  @track rejectedlist = [];
  handleSubmissions(event) {
    this.visibleSubmissionSection = true;
    this.shiftselected = false;
    console.log("event value " + event.detail.value);
    if (event.detail.value == "RejectedSubmissions") {
      this.rejectedSubmission = true;
    } else {
      this.rejectedSubmission = false;
    }
    this.fileName = "";
    this.selectedFilesToUpload = "";
    this.others = "";
    this.amount = "";
    this.comments = "";
    this.vehicleValue = "";
    this.attachDisable = true;
  }

  setStartDate(_startDate) {
    if (_startDate instanceof Date && !isNaN(_startDate)) {
      this.datePickerString = _startDate.toISOString();
      //console.log('in strdate',_startDate.toISOString());
      this.startDate = moment(_startDate).day(1).toDate();
      this.startDateUTC =
        moment(this.startDate).utc().valueOf() -
        moment(this.startDate).utcOffset() * 60 * 1000 +
        "";
      this.formattedStartDate = _startDate.toLocaleDateString("en-IN");
      // console.log('strt date',this.startDate);
      this.getStaffShifts(this.datePickerString);
      PendingShifts({ startDate: this.datePickerString }).then((response) => {
        this.signinList = response;
        this.signinList = response.map((signin) => ({
          ...signin,
          formattedStartDate: signin.Date__c
            ? new Date(signin.Date__c).toLocaleDateString("en-GB")
            : ""
        }));
        console.log("Data: in change  ", JSON.stringify(response));
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
      id: "1",
      profileImage: "/resource/ProfileImages/helping_hands_au.jpg",
      staffName: "Helping Hands AU",
      shiftDate: "09/06/2025",
      loginTime: "00:00 AM",
      logoutTime: "01:00 AM",
      mileageOthers: "10",
      amount: "100",
      comments: "Test Comments",
      approverComments: ""
    },
    {
      id: "2",
      profileImage: "/resource/ProfileImages/riyaz_foundation.jpg",
      staffName: "Riyaz Foundation",
      shiftDate: "09/06/2025",
      loginTime: "00:00 AM",
      logoutTime: "01:00 AM",
      mileageOthers: "1233",
      amount: "100",
      comments: "Test Comments",
      approverComments: ""
    },
    {
      id: "3",
      profileImage: "/resource/ProfileImages/mothers_homes.jpg",
      staffName: "Mothers Homes",
      shiftDate: "09/06/2025",
      loginTime: "00:00 AM",
      logoutTime: "01:00 AM",
      mileageOthers: "600",
      amount: "270",
      comments: "Test Comments",
      approverComments: ""
    },
    {
      id: "4",
      profileImage: "/resource/ProfileImages/surya_charitable.jpg",
      staffName: "Surya Charitable",
      shiftDate: "09/06/2025",
      loginTime: "00:00 AM",
      logoutTime: "01:00 AM",
      mileageOthers: "100",
      amount: "340",
      comments: "Test Comments",
      approverComments: ""
    }
  ];

  @track vehicleType = "Electric";
  @track mileage = "20";
  @track comments = "";
  @track amount = "";
  @track selectedSubmissionId = "";
  @track rejectedSubmission = true;

  vehicleTypeOptions = [
    { label: "Electric", value: "Electric" },
    { label: "Petrol", value: "Petrol" },
    { label: "Diesel", value: "Diesel" },
    { label: "Hybrid", value: "Hybrid" }
  ];

  acceptedFormats = [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"];

  @track selectedShift;
  handleRowSelection(event) {
    this.selectedShift = event.target.value;
    console.log("Selected submission:", this.selectedShift);
    this.shiftselected = false;
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
    let uploadedFileNames = "";
    for (let i = 0; i < uploadedFiles.length; i++) {
      uploadedFileNames += uploadedFiles[i].name + ", ";
    }
    this.dispatchEvent(
      new ShowToastEvent({
        title: "Success",
        message:
          uploadedFiles.length +
          " Files uploaded Successfully: " +
          uploadedFileNames,
        variant: "success"
      })
    );
  }

  handleCancel() {
    // Reset form fields
    this.vehicleType = "";
    this.mileage = "";
    this.comments = "";
    this.amount = "";
    this.selectedSubmissionId = "";

    this.dispatchEvent(
      new ShowToastEvent({
        title: "Cancelled",
        message: "Form has been reset",
        variant: "info"
      })
    );
  }

  handleSendForApproval() {
    if (!this.selectedSubmissionId) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message: "Please select a submission first",
          variant: "error"
        })
      );
      return;
    }

    if (!this.vehicleType || !this.mileage || !this.amount) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message: "Please fill in all required fields",
          variant: "error"
        })
      );
      return;
    }

    // Here you would typically call an Apex method to process the submission
    console.log("Sending for approval:", {
      submissionId: this.selectedSubmissionId,
      vehicleType: this.vehicleType,
      mileage: this.mileage,
      comments: this.comments,
      amount: this.amount
    });

    this.dispatchEvent(
      new ShowToastEvent({
        title: "Success",
        message: "Submission sent for approval successfully",
        variant: "success"
      })
    );

    // Reset form after successful submission
    this.handleCancel();
  }
  triggerFileInput() {
    this.template.querySelector('input[type="file"]').click();
  }
  onFileUpload(event) {
    this.isattachError = false;
    // console.log('in files upload',event.target.files.length);
    this.reiburseFileLength = event.target.files.length;
    if (event.target.files.length > 0) {
      this.showSpinner = true;
      this.selectedFilesToUpload = event.target.files;
      this.file = this.selectedFilesToUpload[0];
      this.fileName = this.selectedFilesToUpload[0].name.split(" ").join("");
      this.fileType = this.selectedFilesToUpload[0].type;
      this.fileSize = this.selectedFilesToUpload[0].size;

      if (
        this.file.size > this.MAX_FILE_SIZE ||
        this.file.size < this.MIN_FILE_SIZE
      ) {
        this.isattachError = true;
      }
      //create an intance of File
      this.fileReaderObj = new FileReader();

      //this callback function in for fileReaderObj.readAsDataURL
      this.fileReaderObj.onloadend = () => {
        //get the uploaded file in base64 format
        let fileContents = this.fileReaderObj.result;
        fileContents = fileContents.substr(fileContents.indexOf(",") + 1);

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
          for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
            bytes[i] = byteCharacters[offset].charCodeAt(0);
          }
          byteArrays[sliceIndex] = new Uint8Array(bytes);
        }

        //from arraybuffer create a File instance
        this.myFile = new File(byteArrays, this.fileName, {
          type: this.fileType
        });

        //callback for final base64 String format
        let reader = new FileReader();
        reader.onloadend = () => {
          let base64data = reader.result;
          this.base64FileData = base64data.substr(base64data.indexOf(",") + 1);
        };
        reader.readAsDataURL(this.myFile);
      };
      this.fileReaderObj.readAsDataURL(this.file);
    }
    this.showSpinner = false;
    // console.log('fileName>>',typeof(JSON.stringify(event.target.files) ));
    // console.log('file prepared');
  }

  // handleChange(event) {
  //   if (event.target.name == "Amount") {
  //     this.amount = event.target.value;
  //   }
  //   if (event.target.name == "others") {
  //     this.others = event.target.value;
  //   }
  //   if (event.target.name == "comment") {
  //     this.comments = event.target.value;
  //   }
  //   if (event.target.name == "vehicle") {
  //     this.vehicleValue = event.target.value;
  //   }
  // }
  handleChange(event) {
    const inputCmp = event.target; // lightning-input component

    if (inputCmp.name === "Amount") {
        const value = parseFloat(inputCmp.value);

        // Clear any previous validation
        inputCmp.setCustomValidity('');

        // Validate the input
        if (isNaN(value)) {
            inputCmp.setCustomValidity('Please enter a valid number.');
        } else if (value > 999999.99) {
            inputCmp.setCustomValidity('Amount cannot exceed 999999.99');
       // } else if (value <= 0) {
        //    inputCmp.setCustomValidity('Amount must be greater than 0');
        }

        // Show the error inline
        inputCmp.reportValidity();

        // Save only if valid
        this.amount = inputCmp.checkValidity() ? value : null;
    }

    if (inputCmp.name === "others") {

       // this.others = inputCmp.value;
       const value = parseFloat(inputCmp.value);

        // Clear any previous validation
        inputCmp.setCustomValidity('');

        // Validate the input
          // Validate the input
        if (isNaN(value)) {
            inputCmp.setCustomValidity('Please enter a valid number.');
        } else if  (value > 300.00) {
            inputCmp.setCustomValidity('Milage in Kms cannot exceed 300.00');
       // } else if (value <= 0) {
        //    inputCmp.setCustomValidity('Amount must be greater than 0');
        }

        // Show the error inline
        inputCmp.reportValidity();

        // Save only if valid
        this.others = inputCmp.checkValidity() ? value : null;
    }

    if (inputCmp.name === "comment") {
        this.comments = inputCmp.value;
    }

    if (inputCmp.name === "vehicle") {
        this.vehicleValue = inputCmp.value;
    }
}

  

  @track others;
  onSubmitForApproval() {
    if (!this.vehicleValue) {
        this.showError('Please select Type of Vehicle');
        return;
    }

    if (!this.others) {
        this.showError('Please enter Mileage');
        return;
    }

    if (!this.amount) {
        this.showError('Please enter Amount');
        return;
    }

    if (!this.comments) {
        this.showError('Please enter Comments');
        return;
    }

    if (!this.fileName || this.fileName.length === 0) {
        this.showError('Please upload a file');
        return;
    }

    // Proceed with reimbursement creation
    console.log('All required fields are filled. Proceeding...');
    this.createReimbursementRecord();
  }

    showError(message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: message,
                variant: 'error'
            })
        );
    }

    createReimbursementRecord() {

        createReimbursement({
            signinId: this.recordIdforUpdate,
            Amount: parseFloat(this.amount),
            MileageAndOthers: this.others,
            typeofvehicle: this.vehicleValue,
            comments: this.comments,
            isupdate: this.isUpdate,
            reimbId: this.reimbursementId
        })
        .then(result => {
            
           if (/^[a-zA-Z0-9]{15,18}$/.test(result)) {
            const recordId = result;
            this.recordId = recordId;
               this.dispatchEvent(
                  new ShowToastEvent({
                      title: "Success",
                      message: "Reimbursement sent for approval successfully.",
                      variant: "success"
                  })
              );

              // Upload file if present
              if (this.fileName && this.fileName.length > 0) {
                  uploadFile({
                      base64: JSON.stringify(this.base64FileData),
                      filename: this.fileName,
                      recordId: this.recordId,
                      obj: "reimburse"
                  })
                  .then(() => {
                      this.dispatchEvent(
                          new ShowToastEvent({
                              title: "Success",
                              message: this.fileName + " - uploaded successfully",
                              variant: "success"
                          })
                      );

                      // Clear fields
                      this.resetFormData();
                      refreshApex(this.wiredReimbursementsResult);
                      this.loadRejectedSubmissions();
                      this.statusValue = 'Pending';
                      /* setTimeout(() => {
                          console.log('📌 Refetching with status →', this.statusValue);
                          this.loadRejectedSubmissions();
                      },500); */
                      this.shiftselected = false;
                  })
                  .catch(error => {
                      this.showError("Error in uploading file: " + error.message);
                      this.resetFormData();
                  });
                
              } else {
                  this.resetFormData();
                  this.statusValue = 'Pending';
                  refreshApex(this.wiredReimbursementsResult);
                  this.loadRejectedSubmissions();
              }
              setTimeout(() => {
                this.statusValue = 'All';
                console.log('📌 Status in  createReimbursementRecord →', this.statusValue);
                  
              }, 2000);
            } else {
               this.showError("Error creating reimbursement: " + result);
                return;
            }
           
        })
        .catch(error => {
            this.showError("Error creating reimbursement: " + error.body?.message || error.message);
            this.resetFormData();
        });

    }


  get routeOptions() {
    return [
      { label: "Participant Invoice", value: "invoice" },
      { label: "Organization Accounts", value: "org" }
    ];
  }

  handleApprove(event) {
    this.showrejectedModal = false;
    this.statusValueforUpdate = 'Approved';
    const recordId = event.currentTarget.dataset.id;
    const recordName1  = event.currentTarget.dataset.name;
    const mileageAmount   = event.currentTarget.dataset.mileageamount;
    const amount   = event.currentTarget.dataset.amount;
    console.log("👍 Approve clicked for reimbursement:", recordId);
    console.log("👍 Approve clicked for reimbursement Record Name:", recordName1);
    this.selectedReimbursementNumber = recordName1;
    console.log("👍 Approve clicked for reimbursement:", this.selectedReimbursementNumber);
    this.reimbursementId = event.target.dataset.recordId;
    const recordName  = event.currentTarget.dataset.name;
    this.reimbursementNameforApprove =  recordName;
    // Format Reimbursement Amount
    this.reimbursementAmountforApprove = new Intl.NumberFormat('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    }).format(amount);
    // Format Mileage Amount
    this.reimbursementmileageAmountforApprove = new Intl.NumberFormat('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    }).format(mileageAmount);
    this.showModal = true;
    this.showApprovalModal = true;
  }

  handleReject(event) {
    this.showrejectedModal = true;
    this.statusValueforUpdate = 'Rejected';
    const recordId = event.currentTarget.dataset.id;
    const recordName1  = event.currentTarget.dataset.name;
    const mileageAmount   = event.currentTarget.dataset.mileageamount;
    const amount   = event.currentTarget.dataset.amount;
    console.log("👍 Approve clicked for reimbursement:", recordId);
    console.log("👍 Approve clicked for reimbursement Record Name:", recordName1);
    this.selectedReimbursementNumber = recordName1;
    console.log("👍 Approve clicked for reimbursement:", this.selectedReimbursementNumber);
    this.reimbursementId = event.target.dataset.recordId;
    const recordName  = event.currentTarget.dataset.name;
    this.reimbursementNameforApprove =  recordName;
    this.reimbursementAmountforApprove = new Intl.NumberFormat('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    }).format(amount);
    // Format Mileage Amount
    this.reimbursementmileageAmountforApprove = new Intl.NumberFormat('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    }).format(mileageAmount);
    this.showModal = true;
    this.showApprovalModal = true;
    this.showrejectedModal = true;
  }

  handleSuccessRejected(event) {
      console.log('Record updated successfully ✅', event.detail.id);
      this.handleCloseRejected();
      return refreshApex(this.wiredReimbursementsResult);
  }


  handleRouteChange(event) {
    this.selectedRoute = event.detail.value;
  }


  paginationHelper() {
    // calculate total pages
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize);

    // keep pageNumber inside valid range
    if (this.pageNumber <= 1) {
        this.pageNumber = 1;
    } else if (this.pageNumber >= this.totalPages) {
        this.pageNumber = this.totalPages;
    }

    // slice records for current page
    let startIndex = (this.pageNumber - 1) * this.pageSize;
    let endIndex = this.pageNumber * this.pageSize;
    this.paginatedList = this.reimbursementList.slice(startIndex, endIndex);

    // disable/enable buttons
    this.bDisableFirst = (this.pageNumber === 1);
    this.bDisableLast = (this.pageNumber === this.totalPages);
     console.log('paginatedList in paginationHelper >>> '+this.paginatedList);
}


  firstPage() {
    this.pageNumber = 1;
    this.paginationHelper();
}

previousPage() {
    if (this.pageNumber > 1) {
        this.pageNumber = this.pageNumber - 1;
        this.paginationHelper();
    }
}

nextPage() {
    if (this.pageNumber < this.totalPages) {
        this.pageNumber = this.pageNumber + 1;
        this.paginationHelper();
    }
}

lastPage() {
    this.pageNumber = this.totalPages;
    this.paginationHelper();
}


// Records per page change
handleRecordsPerPageSub(event) {
    this.pageSizeSub = parseInt(event.target.value, 10);
    this.pageNumberSub = 1;   // reset to first page
    this.paginationHelperSub();
}

// Navigation
firstPageSub() {
    this.pageNumberSub = 1;
    this.paginationHelperSub();
}

previousPageSub() {
    if (this.pageNumberSub > 1) {
        this.pageNumberSub -= 1;
        this.paginationHelperSub();
    }
}

nextPageSub() {
    if (this.pageNumberSub < this.totalPagesSub) {
        this.pageNumberSub += 1;
        this.paginationHelperSub();
    }
}

lastPageSub() {
    this.pageNumberSub = this.totalPagesSub;
    this.paginationHelperSub();
}

// Core Pagination Helper
paginationHelperSub() {
    this.totalRecordsSub = this.submissionList.length;
    this.totalPagesSub = Math.ceil(this.totalRecordsSub / this.pageSizeSub);

    if (this.pageNumberSub <= 1) {
        this.pageNumberSub = 1;
    } else if (this.pageNumberSub >= this.totalPagesSub) {
        this.pageNumberSub = this.totalPagesSub;
    }

    let start = (this.pageNumberSub - 1) * this.pageSizeSub;
    let end = this.pageNumberSub * this.pageSizeSub;
    this.paginatedSubList = this.submissionList.slice(start, end);

    // Enable/disable buttons
    this.bDisableFirstSub = (this.pageNumberSub === 1);
    this.bDisableLastSub = (this.pageNumberSub === this.totalPagesSub);
}

// Update paged data for current page
    updatePagedData() {
        const start = (this.pageNumberSub1 - 1) * this.pageSizeSub1;
        const end = start + parseInt(this.pageSizeSub1, 10);
        this.pagedSigninList = this.signinList1.slice(start, end);
    }

    // Handle page size dropdown change
    handlePageSizeChange(event) {
        this.pageSizeSub1 = parseInt(event.target.value, 10);
        this.pageNumberSub1 = 1;
        this.totalPagesSub1 = Math.ceil(this.totalRecordsSub1 / this.pageSizeSub1);
        this.updatePagedData();
    }

    // Pagination button handlers
    goToFirst() {
        this.pageNumberSub1 = 1;
        this.updatePagedData();
    }

    goToPrevious() {
        if (this.pageNumberSub1 > 1) {
            this.pageNumberSub1--;
            this.updatePagedData();
        }
    }

    goToNext() {
        if (this.pageNumberSub1 < this.totalPagesSub1) {
            this.pageNumberSub1++;
            this.updatePagedData();
        }
    }

    goToLast() {
        this.pageNumberSub1 = this.totalPagesSub1;
        this.updatePagedData();
    }

    get bDisableFirstSub1() {
        return this.pageNumberSub1 === 1;
    }

    get bDisableLastSub1() {
        return this.pageNumberSub1 === this.totalPagesSub1;
    }

}