import { LightningElement, track, wire, api } from "lwc";
import serviceSupportList from "@salesforce/apex/ServiceSupportPlanHandler.serviceSupportList";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import fetchFiles from "@salesforce/apex/ServiceSupportPlanHandler.fetchFiles";
import fetchSupId from "@salesforce/apex/ServiceSupportPlanHandler.fetchSupId";
import getSupportData from "@salesforce/apex/ServiceSupportPlanHandler.getSupportData";
import getInvoices from "@salesforce/apex/ServiceSupportPlanHandler.getInvoices";
//sowmya
import getClientFunds from "@salesforce/apex/ServiceSupportPlanHandler.getClientFunds";
import { loadScript } from "lightning/platformResourceLoader";
import jsPDF from "@salesforce/resourceUrl/jspdf";
//import 'jspdf-autotable';
//import jspdfautotable from '@salesforce/resourceUrl/jspdfautotable';
import autoTable from "@salesforce/resourceUrl/autotable";
import { refreshApex } from "@salesforce/apex";
import { NavigationMixin } from "lightning/navigation";
import uploadFile from "@salesforce/apex/AWSS3FileUploadController.uploadFile";
import getOrgName from "@salesforce/apex/TaskCreateHandler.getOrgName";
import getNDISServiceLineItem from "@salesforce/apex/ServiceSupportPlanHandler.getNDISServiceLineItem";
//maheswari
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import { getRecord } from "lightning/uiRecordApi";
import USER_ID from "@salesforce/user/Id";
import UserType from "@salesforce/schema/User.User_Type__c";
import My_Resource from "@salesforce/resourceUrl/myResource";
import robotoFont from "@salesforce/resourceUrl/Roboto";
import getCompanyAndAccountData from "@salesforce/apex/RosterInvoicesHandler.getCompanyAndAccountData";
import UpdateDataFromInvoice from "@salesforce/apex/AccountingModuleController.UpdateDataFromInvoice";
import organizationDetails from "@salesforce/apex/InvoiceHandler.organizationDetails";
import getAccountingInvoiceById from "@salesforce/apex/InvoiceHandler.getAccountingInvoiceById";
import getBulkServicesHandler from "@salesforce/apex/RosterInvoicesHandler.getBulkServicesHandler";
import { deleteRecord } from "lightning/uiRecordApi";
//import updateServiceStatus from '@salesforce/apex/ServiceSupportPlanHandler.updateServiceStatus';
import getCatalogueData from "@salesforce/apex/StaffAvailabilityController.getCatalogueData";
import getSelectedSupportItems from "@salesforce/apex/ClientFundTransferHandler.getSelectedSupportItems"; //
import getNDISCatalog from "@salesforce/apex/ClientFundTransferHandler.getNDISCatalog";
import getStaffList from "@salesforce/apex/AwardController.getStaffList";

const actions = [{ label: "Edit", name: "edit" }];


const ICON_DOWN = {
  icon: 'navigation',
  class: 'material-symbols material-symbols-filled rotate-icon rotate-down'
};

const ICON_LEFT = {
  icon: 'navigation',
  class: 'material-symbols material-symbols-filled rotate-icon rotate-left'
};

export default class ServiceSupportPlan extends NavigationMixin(
  LightningElement
) {
  //Nagendra code for Pagination Start
  @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
  @track records = []; //All records available in the data table
  @track columns = []; //columns information available in the data table
  @track totalRecords = 0; //Total no.of records
  @track pageSize; //No.of records to be displayed per page
  @track totalPages; //Total no.of pages
  @track pageNumber = 1; //Page number
  @track recordsToDisplay = []; //Records to be displayed on the page
  @track isEdit = false;
  @track invoiceFileName = "";
  @track invoiceId = "";
  @track invoiceDate;
  @track checkStatus = "";
  @track participantlogin = false;
  @track isHome = true;
  @track noRecordsFlag = false;
  @track noRecordsFlag1 = false;
  @track successmessage;

  activeSections = ["Services", "Service Agreement", "Invoices"];

  get bDisableFirst() {
    return this.pageNumber == 1;
  }
  get bDisableLast() {
    return this.pageNumber == this.totalPages;
  }
  //Nagendra code for Pagination End
  @track pageSizeOptions1 = [10, 25, 50, 75, 100];
  @track pageSize1;
  @track totalPages1;
  @track pageNumber1 = 1;
  @track records1 = [];
  get bDisableFirst1() {
    return this.pageNumber1 == 1;
  }
  get bDisableLast1() {
    return this.pageNumber1 == this.totalPages1;
  }

  @track serviceNameValue;
  @track serviceStatusValue;
  @track serviceStartDateValue;
  @track serviceEndDateValue;
  @track pageNumber;
  @track creaetServiceFlag = false;
  @track listofSericeFlag = true;
  @track imageUploadFlag = false;
  @track fileNameFlag = true;
  @track isOpenModal = false;
  @track funddata;
  @track openservice = false;
  @api servicerecordId;
  @api clientId;
  @track showfunds = false;
  @track selectedfund;
  @track invoiceTable = [];
  @track isInvoiceflag = false;
  @track invoiceflag = false;
  @track error;
  @track accList;
  @track recordId;
  @track lstAllFiles;
  @track error;
  @track imagelistFlag;
  @track newSupId;
  @track disableBool = true;
  @track invRecords = [];
  @track insertedInvoice = [];
  @track pdfInvoiceRecords = [];
  StaffName;
  ServiceIds;
  @track invoiceList = [];
  @track selectedServicesId;
  fileData;
  @track isStaffName = false;
  @track popUpData = [];
  @track popupvisible = false;
  @track orgName;
  @track services;
  @track orgNames;
  @track orgStreet;
  @track stateCode;
  @track postalCode;
  @track countryCode;
  @track orgCity;
  @track contactNo;

  @track serviceGroupName = [];
  @track selectedServiceIds;
  @track lstServiceSelectedRecords;
  @track selectedNdisIdValue;
  @track ndisName;
  @track ndisState;
  @track plantype;
  @track startTimePickval;
  @track endTimePickval;
  @track fundOption = [];
  @track stateValue = "";
  @track NdisServiceGroupNameinEdit = false;
  wireServiceList;
  @track showLoadingSpinner = false;
  @track sectionFlags = {
    Services: true,
    ServiceAgreement: true,
    Invoices: true
  };
  @track salesEntryList = [];
  @track salesEntry = {};
  @track amountarrey = {
    subTotal: 0,
    taxAmount: 0,
    totalAmount: 0
  };
  @track partcipantIdList = [];
  @track startDate;
  @track endDate;
  @track noDataErrorMessage;
  @track accountNo;
  @track bsb;
  @track bank;
  @track accountName;
  @track ServiceWarningMessage = false;
  @track participantServiceDeleteInfo = {};
  @track orgId;
  @track staffOptions = [];
  @track selectedStaff;

  // @track sectionIcons = {
  //   Services: "\u2B9F",
  //   ServiceAgreement: "\u2B9F",
  //   Invoices: "\u2B9F"
  // };

@track sectionIcons = {
  Services: { ...ICON_DOWN },
  ServiceAgreement: { ...ICON_DOWN },
  Invoices: { ...ICON_DOWN }
};


  handleSectionToggle(event) {
    const sectionId = event.currentTarget.dataset.id;
    const sectionElement = this.template.querySelector(
      `[data-section="${sectionId}"]`
    );

    if (!this.sectionFlags[sectionId]) {
      // First click: Set the section to true so it loads in the DOM
      this.sectionFlags[sectionId] = true;
    } else {
      // From second click onwards: Just toggle the hidden-section class
      sectionElement.classList.toggle("hidden-section");
    }

    // Toggle the icon dynamically
    // this.sectionIcons[sectionId] = sectionElement.classList.contains(
    //   "hidden-section"
    // )
    //   ? "\u2B9C"
    //   : "\u2B9F";
    this.sectionIcons[sectionId] =
        sectionElement.classList.contains('hidden-section')
            ? { ...ICON_LEFT }
            : { ...ICON_DOWN };
      
      
  
  
  
  }

  get stateOptions() {
    return [
      { label: "ACT", value: "ACT__c" },
      { label: "NSW", value: "NSW__c" },
      { label: "NT", value: "NT__c" },
      { label: "QLD", value: "QLD__c" },
      { label: "SA", value: "SA__c" },
      { label: "TAS", value: "TAS__c" },
      { label: "VIC", value: "VIC__c" },
      { label: "WA", value: "WA__c" }
    ];
  }
  get hasRecords() {
    return Array.isArray(this.accList) && this.accList.length > 0;
  }
  get hasRecords2() {
    return Array.isArray(this.bulkServices) && this.bulkServices.length > 0;
  }

  @track columns = [
    {
      label: "Resource Name",
      fieldName: "Resource_Name__c",
      initialWidth: 150
    },
    {
      label: "Service Type",
      fieldName: "Service_Type_Name__c",
      initialWidth: 150,
      wrapText: true
    },
    {
      label: "Line Item",
      fieldName: "Lineitem__c",
      initialWidth: 140
    },
    {
      label: "Available Funds",
      fieldName: "Available_Fund__c",
      initialWidth: 150,
      type: "currency",
      cellAttributes: { alignment: "left" }
    },
    {
      label: "Service Date",
      fieldName: "Date_of_Service__c",
      initialWidth: 130,
      type: "date",
      typeAttributes: {
        month: "2-digit",
        day: "2-digit",
        year: "numeric"
      }
    },
    {
      label: "Qty",
      fieldName: "Qty__c",
      initialWidth: 70
    },
    {
      label: "Unit Price",
      fieldName: "Unit_Price__c",
      initialWidth: 120,
      type: "currency",
      cellAttributes: { alignment: "left" }
    },
    {
      label: "GST",
      fieldName: "GST__c",
      initialWidth: 80
    },
    {
      label: "Amount",
      fieldName: "Amount__c",
      initialWidth: 100,
      type: "currency",
      cellAttributes: { alignment: "left" }
    },
    {
      label: "Status",
      fieldName: "Status__c",
      initialWidth: 130
    },
    {
      type: "action",
      label: "Action",
      initialWidth: 100,
      typeAttributes: {
        rowActions: actions
      }
    }
  ];

  @track fundcolumns = [
    {
      label: "Registration Group",
      fieldName: "Registration_Group__c"
    },
    {
      label: "Approved Amount",
      fieldName: "Amount_approved__c",
      type: "currency"
    },
    {
      label: "Amount Spent",
      fieldName: "Spent_Amt__c",
      type: "currency"
    },
    {
      label: "Available Funds",
      fieldName: "Available_Funds__c",
      type: "currency"
    }
  ];

  get acceptedFormats() {
    return [".pdf", ".png", ".jpg"];
  }

  renderedCallback() {
    if (this.jsPDFInitialized) {
      return; // Prevent reloading scripts multiple times
    }
    Promise.all([
      // loadScript(this, Dompurify),

      loadScript(this, jsPDF),
      loadScript(this, autoTable),
      //this line of code is for using custom font in jspdf because jspdf supports only few fonts like courier,times-roman and helvitica.
      //to use custom font we have downloaded the font from google which is .ttf converted ttf to js and upload in static resource.
      loadScript(this, robotoFont)
    ])
      .then(() => {
        this.jsPDFInitialized = true;
        console.log("✅ jsPDF, autoTable, and Roboto font loaded");
        console.log("📦 window.jspdf:", window.jspdf);
        console.log("📦 window.jspdf.autoTable:", window.jspdf?.autoTable);

        // ✅ Register the autoTable plugin
        /*  if (window.jspdf?.jsPDF && window.jspdf?.autoTable) {
                    window.jspdf.jsPDF.API.autoTable = window.jspdf.autoTable;
                    console.log('✅ autoTable registered with jsPDF');
                } else {
                    console.error('❌ autoTable plugin or jsPDF not properly loaded.');
                }
         */
        // ✅ Register the Roboto font manually
        if (window.jspdf && window.callAddFont) {
          window.jspdf.jsPDF.API.events.push(["addFonts", window.callAddFont]);
          console.log("✅ Roboto font registered via callAddFont");
        } else {
          console.warn("⚠️ callAddFont or jsPDF not available in window scope");
        }

        // Verify if font is registered
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        console.log("🧾 Available fonts:", doc.getFontList());
        // console.log("JS loaded jsPDF");
      })
      .catch((error) => {
        // console.error("Error " + error);
      });
  }
  @wire(serviceSupportList, {
    clientId: "$clientId",
    sDate: "$startDate",
    eDate: "$endDate"
  })
  wiredServiceList(result) {
    console.log(" wiredServiceList called>>");
    //console.log('result in serviceSupportList:', JSON.stringify(result));
    this.records = [];
    this.showLoadingSpinner = true;
    this.wireServiceList = result;
    console.log("SERVICE in serviceSupportList:", JSON.stringify(result));
    const { data, error } = result;
    if (data) {
      console.log("data in serviceSupportList:", JSON.stringify(data));
      //this.records = data;
      this.records = data.map((item) => ({
        ...item,
        ServiceDate: item.Date_of_Service__c
          ? new Date(item.Date_of_Service__c).toLocaleDateString("en-GB")
          : "",
        amount: `$${item.Amount__c || 0}`,
        availableFunds: `$${item.Available_Fund__c || 0}`,
        unitprice: `$${item.Unit_Price__c || 0}`,
        Service_Type__c: item.Service_Type__c,
        isChecked: false,
        uistatus:
          item.Status__c == "Not Yet Invoiced"
            ? "Pending Invoice"
            : item.Status__c,
        shiftStatus: item.ShiftwithStaff__r?.Status__c || ""
      }));

      this.totalRecords = data.length;
      this.pageSize = this.pageSizeOptions[0];
      this.pageNumber = 1;
      this.paginationHelper();
      this.showLoadingSpinner = false;
    } else if (error) {
      this.records = [];
      this.error = error;
      this.showLoadingSpinner = false;
    }
  }

  @wire(getBulkServicesHandler, {
    PartcipantIdList: "$partcipantIdList",
    sDate: "$startDate",
    eDate: "$endDate",
    orgid: "$orgId"
  })
  wiredBulkServices(result) {
    this.wiredBulkServicesResult = result;
    if (result.data) {
      //  this.bulkServices = result.data;
      this.showLoadingSpinner = true;
      this.bulkServices = result.data.map((invoice) => {
        let fileReference = "";
        //   console.log('invoice.Participant__r '+JSON.stringify(invoice.Participant__r))
        if (invoice.Participant__r) {
          //  console.log('invoice.Participant__r ==> '+JSON.stringify(invoice.Participant__r ))
          fileReference = invoice.Participant__r.First_Name__c
            ? invoice.Participant__r.First_Name__c
            : "" + " " + invoice.Participant__r.First_Name__c
              ? invoice.Participant__r.First_Name__c
              : "";
          //  console.log('fileReference  1 '+fileReference )
        }

        return {
          Id: invoice.Id,
          Name: invoice.Name,
          Status__c: invoice.Status__c,
          GST__c: invoice.GST__c,
          Total_Amount__c: parseFloat(invoice.Total_Amount__c).toFixed(2),
          fileReference: fileReference || "N/A", // Assign 'N/A' if no company name is found
          invoiceNumber: invoice.Invoice_Number__c,
          amazonUrl: invoice.Amazon_URL__c,
          invoiceDate: invoice.Invoice_Date__c
            ? new Date(invoice.Invoice_Date__c).toLocaleDateString("en-GB")
            : ""
        };
      });
      //  console.log('✅ Bulk services data:', JSON.stringify(this.bulkServices));

      this.isInvoiceflag = true;

      this.records1 = this.bulkServices;
      this.totalRecords1 = this.bulkServices.length;
      //     console.log('this.totalRecords1: '+this.totalRecords1);
      this.pageSize1 = this.pageSizeOptions1[0];
      this.pageNumber1 = 1;
      this.paginationHelper1();
      this.showLoadingSpinner = false;
    } else if (result.error) {
      this.showLoadingSpinner = false;
      console.error("❌ Error fetching bulk services:", result.error);
    }
  }

  readInvoiceDetails() {
    refreshApex(this.wiredBulkServicesResult);
    refreshApex(this.wireServiceListt);
  }
  fetchOrgId() {
    console.log("📡 Fetching organization details...");
    organizationDetails()
      .then((response) => {
        this.orgid = response?.listofPriceBook?.Id;
        console.log("✅ Org ID fetched:", this.orgid);
      })
      .catch((error) => {
        console.error("❌ Failed to fetch org ID:", error);
      });
  }

  connectedCallback() {
    /*  this.ServiceWarningMessage =true; */
    // console.log('record servicerecordId id',this.servicerecordId);
    this.fetchOrgId();
    console.log(
      "📡 @wire(getTemplates) called with orgId IN SUPPORT:",
      this.orgid
    );
    fetchFiles({ recordId: this.servicerecordId })
      .then((result) => {
        this.lstAllFiles = result;
        if (this.lstAllFiles.length > 0) {
          this.fileNameFlag = true;
          this.imagelistFlag = true;
        } else {
          this.fileNameFlag = true;
          this.imagelistFlag = false;
        }
        this.error = undefined;
      })
      .catch((error) => {
        this.lstAllFiles = undefined;
        this.error = error;
      });

    //funddetails
    this.partcipantIdList.push(this.clientId);
    var today = new Date(new Date().getFullYear(), new Date().getMonth(), 2);
    this.startDate = today.toISOString().slice(0, 10); // e.g., 2025-04-01
    var last = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
    this.endDate = last.toISOString().slice(0, 10); // e.g.,

    console.log("startdate" + this.startDate);
    console.log("enddate" + this.endDate);
    if (this.startDate != null && this.endDate != null) {
      refreshApex(this.wiredBulkServicesResult);
    }

    getClientFunds({ clientId: this.clientId })
      .then((result) => {
        this.funddata = result;
        this.error = undefined;
      })
      .catch((error) => {
        this.funddata = undefined;
        this.error = error;
      });
    const storedFacilityId = localStorage.getItem("defaultFacilityId");
    const storedFacilityLabel = localStorage.getItem("defaultFacilityLabel");
    console.log("storedFacilityId" + storedFacilityId);
    console.log("storedFacilityLabel" + storedFacilityLabel);

    //Read OrgName
    getOrgName().then((result) => {
      this.orgName = result;
    });
    //Read Organization name and address
    orgDetails().then((response) => {
      this.orgRecord = response;
      this.orgId = response.Id;
      this.Picklist_Value = response.Id;
      this.abn = response.ABN__c;
      this.orgNames = response.Name;
      this.orgStreet = response.Address_Latest__Street__s;
      this.orgCity = response.Address_Latest__City__s;
      this.stateCode = response.Address_Latest__StateCode__s;
      this.postalCode = response.Address_Latest__PostalCode__s;
      this.countryCode = response.Address_Latest__CountryCode__s;
      this.contactNo = response.Contact_No__c;

      this.bank = response.Bank__c;
      this.accountNo = response.Account_Number__c;
      this.accountName = response.Account_Name__c;
      this.bsb = response.BSB__c;
      // console.log('OrgName>>>'+this.orgNames);
      getStaffList({ orgId: this.orgId, facilityId: storedFacilityId })
        .then((data) => {
          console.log("✅ Staff data:", JSON.stringify(data));
          this.staffOptions = data.map((staff) => ({
            // label: `${staff.Name} ${staff.Last_Name__c || ''}`,
            label: `${staff.Display_Nickname__c}`,
            value: staff.Id
          }));
          console.log(
            "✅  this.staffOptions ",
            JSON.stringify(this.staffOptions)
          );
        })
        .catch((error) => {
          console.error("❌ Error loading staff:", error);
          //this.error = error;
          // this.showErrorToast(error.body?.message || 'Unknown error');
        });
    });
  }

  // fetchservicelist(){

  toast(title) {
    const toastEvent = new ShowToastEvent({
      title,
      variant: "success"
    });
    this.dispatchEvent(toastEvent);
  }

  handleDateChange(event) {
    const field = event.target.name;

    if (field === "start") {
      this.startDate = event.target.value;
    } else if (field === "end") {
      this.endDate = event.target.value;
    }

    console.log("startdate" + this.startDate);
    console.log("enddate" + this.endDate);
    setTimeout(() => {
      refreshApex(this.wireServiceList);
      refreshApex(this.wiredBulkServicesResult);
    }, 1000);
  }

  //Nagendra Pagination code start
  handleRecordsPerPage(event) {
    this.pageSize = event.target.value;
    this.paginationHelper();
    this.selectAllChecked = false;
  }

  previousPage() {
    this.pageNumber = this.pageNumber - 1;
    this.paginationHelper();
    this.selectAllChecked = false;
  }

  nextPage() {
    this.pageNumber = this.pageNumber + 1;
    this.paginationHelper();
    this.selectAllChecked = false;
  }

  firstPage() {
    this.pageNumber = 1;
    this.paginationHelper();
    this.selectAllChecked = false;
  }

  lastPage() {
    this.pageNumber = this.totalPages;
    this.paginationHelper();
    this.selectAllChecked = false;
  }

  // JS function to handel pagination logic
  paginationHelper() {
    this.accList = [];
    if (this.totalRecords > 0) {
      this.noRecordsFlag = false;
    } else {
      this.noRecordsFlag = true;
    }
    this.selectAllChecked = false;
    // calculate total pages
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
    // set page number
    if (this.pageNumber <= 1) {
      this.pageNumber = 1;
    } else if (this.pageNumber >= this.totalPages) {
      this.pageNumber = this.totalPages;
    }
    // console.log('this.records in paginationHelper:', JSON.stringify(this.records));
    console.log("pageNumber>>>" + this.pageNumber);
    console.log("pageSize>>>" + this.pageSize);
    console.log("totalRecords>>>" + this.totalRecords);
    // set records to display on current page
    for (
      let i = (this.pageNumber - 1) * this.pageSize;
      i < this.pageNumber * this.pageSize;
      i++
    ) {
      if (i === this.totalRecords) {
        break;
      }
      this.accList.push(this.records[i]);
    }
    //console.log(' this.accList in paginationHelper:', JSON.stringify( this.accList));
    //refreshApex(this.wireServiceList);
  }
  //Nagendra Pagination Code End
  //pagination for invoices
  handleRecordsPerPage1(event) {
    this.pageSize1 = event.target.value;
    this.paginationHelper1();
  }

  previousPage1() {
    this.pageNumber1 = this.pageNumber1 - 1;
    this.paginationHelper1();
  }

  nextPage1() {
    this.pageNumber1 = this.pageNumber1 + 1;
    this.paginationHelper1();
  }

  firstPage1() {
    this.pageNumber1 = 1;
    this.paginationHelper1();
  }

  lastPage1() {
    this.pageNumber1 = this.totalPages1;
    this.paginationHelper1();
  }

  // JS function to handel pagination logic
  paginationHelper1() {
    this.invoiceTable = [];
    if (this.totalRecords > 0) {
      this.noRecordsFlag1 = false;
    } else {
      this.noRecordsFlag1 = true;
    }
    // calculate total pages
    this.totalPages1 = Math.ceil(this.totalRecords1 / this.pageSize1);
    // set page number
    if (this.pageNumber1 <= 1) {
      this.pageNumber1 = 1;
    } else if (this.pageNumber1 >= this.totalPages1) {
      this.pageNumber1 = this.totalPages1;
    }
    // console.log('this.records in paginationHelper:', JSON.stringify(this.records));
    console.log("pageNumber>>>" + this.pageNumber);
    console.log("pageSize>>>" + this.pageSize);
    console.log("totalRecords>>>" + this.totalRecords);
    // set records to display on current page
    for (
      let i = (this.pageNumber1 - 1) * this.pageSize1;
      i < this.pageNumber1 * this.pageSize1;
      i++
    ) {
      if (i === this.totalRecords1) {
        break;
      }
      this.invoiceTable.push(this.records1[i]);
    }
    //console.log(' this.accList in paginationHelper:', JSON.stringify( this.accList));
    //refreshApex(this.wireServiceList);
  }

  handleClose() {
    this.creaetServiceFlag = false;
    this.listofSericeFlag = true;
    this.openservice = false;
  }

  handleAddNewService() {
    //console.log('calling method');
    this.isOpenModal = true;
    this.successmessage = "Service created successfully.";
    this.showfunds = true;
    this.openservice = false;
    this.listofSericeFlag = true;
    this.imageUploadFlag = false;
    this.fileNameFlag = true;
    this.creaetServiceFlag = false;
    this.errorMessage;
    this.saveDisabled = true;
  }
  handleSubmit(event) {
    this.isOpenModal = false;
    this.openservice = false;
    this.showfunds = false;

    event.preventDefault();
    const fields = event.detail.fields;
    fields.Service_Type__c = this.selectedNdisIdValue;
    fields.Funds_Tracker__c = this.selectedfund;
    fields.Client__c = this.clientId;
    fields.Service_Users__c = this.selectedStaff;
    // fields.State__c =this.cleanedStateCode;
    this.template.querySelector("lightning-record-edit-form").submit(fields);

    this.isEdit = false;
  }
  handleSuccess(event) {
    //this.fetchservicelist();
    refreshApex(this.wireServiceList);
    this.showfunds = false;
    this.dispatchEvent(
      new ShowToastEvent({
        title: "Success",
        message: this.successmessage,
        variant: "success"
      })
    );
    //this.openservice = false;
    // this.isEdit = false;
  }
  /*  handleError(event){    
       // alert(JSON.stringify(event.detail));
        //this.showToast(event.detail.detail); 
        console.log('Error Message : '+JSON.stringify(event.detail));
        let message = 'An unexpected error occurred';

        // Check if it's a field validation error
        if (error && error.body && error.body.output && error.body.output.fieldErrors) {
            const fieldErrors = error.body.output.fieldErrors;
            console.log('Error1 :'+fieldErrors);
            // If Amount__c has errors
            if (fieldErrors.Amount__c && fieldErrors.Amount__c.length > 0) {
                message = fieldErrors.Amount__c[0].message;
                console.log('If Error MEs  :'+message);
            }
        } else if (error && error.body && error.body.message) {
            // Fallback to general error message
            message = error.body.message;
            console.log('Else error :'+message);
        }
        this.showToast(message);
    } */

  handleError(event) {
    const error = event.detail;
    console.log("Error Message : " + JSON.stringify(error));

    let message = "An unexpected error occurred";

    // Check if it's a field validation error
    if (error && error.output && error.output.fieldErrors) {
      const fieldErrors = error.output.fieldErrors;
      console.log("Field Errors:", fieldErrors);

      // If Amount__c has errors
      if (fieldErrors.Amount__c && fieldErrors.Amount__c.length > 0) {
        message = fieldErrors.Amount__c[0].message;
        console.log("Custom Error Message:", message);
      }
    } else if (error && error.message) {
      // Fallback to general error message
      message = error.message;
    }
    this.showToast(message);
    this.openservice = false;
  }

  showToast(msg) {
    const event = new ShowToastEvent({
      title: "Error",
      message: msg,
      variant: "Error",
      mode: "dismissable"
    });
    this.dispatchEvent(event);
  }
  hideModalBox() {
    this.isOpenModal = false;
    this.showfunds = false;
    this.isEdit = false;
    this.stateValue = "";
    this.NdisServiceGroupNameinEdit = false;
    this.serviceGroupName = [];
  }

  handleAddNewSupportPlan() {
    this.imageUploadFlag = true;
    this.fileNameFlag = false;
    fetchSupId({ recordId: this.servicerecordId }).then((result) => {
      this.newSupId = result;
      // console.log('raja is the document ',this.newSupId);
    });
  }

  handleChange(event) {
    // console.log(event.detail.name);
    if (event.target.name == "serviceName") {
      this.serviceNameValue = event.detail.value;
      // console.log('serviceName  ', this.serviceNameValue);
    }
    if (event.target.name == "serviceStatus") {
      this.serviceStatusValue = event.target.value;
      // console.log('serviceStatus  ', this.serviceStatusValue);
    }
    if (event.target.name == "serviceStartDate") {
      this.serviceStartDateValue = event.detail.value;
      // console.log('serviceStartDate  ', this.serviceStartDateValue);
    }
    if (event.target.name == "serviceEndDate") {
      this.serviceEndDateValue = event.detail.value;
      // console.log('serviceEndDate  ', this.serviceEndDateValue);
    }
  }
  handleInvoicFlag() {
    this.isInvoiceflag = true;
    this.invoiceflag = false;
  }

  @api reload() {
    this.invoiceflag = true;
    this.isInvoiceflag = false;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  fetchReplist() {
    refreshApex(this.wireServiceList);
  }
  @track description = [];
  @track totalAmount = 0;
  @track staffId;
  @track gstvalue;
  @track Qty;
  @track UnitPrice;
  @track facilityId;
  async getSelectedRec() {
    this.showLoadingSpinner = true;
    this.lstSelectedRecords = [];
    this.invRecords = [];
    this.pdfInvoiceRecords = [];
    this.description = [];
    this.isStaffName = false;
    this.disableBool = false;
    const selectedRecords = Array.from(this.selectedRecordMap.keys());
    console.log("selectedRecords: " + JSON.stringify(selectedRecords));

    if (selectedRecords.length > 0) {
      try {
        const participantServices = await getSupportData({
          SPIdList: selectedRecords
        });
        console.log(
          "result in serviceSupportList:",
          JSON.stringify(participantServices)
        );
        const companyDetails = await getCompanyAndAccountData({
          participantIdList: JSON.stringify([this.clientId])
        });
        console.log(
          "✅ Result for participantId",
          JSON.stringify(companyDetails)
        );

        const companyResponse = companyDetails.ClientCompany || {};
        const accountResponse = companyDetails.AccountList || {};

        const noDataNames = Object.values(companyResponse)
          .filter(
            (value) => typeof value === "string" && value.startsWith("NoData ")
          )
          .map((value) => value.replace("NoData ", "").trim());

        if (noDataNames.length > 0) {
          this.disableBool = true;
          this.noDataErrorMessage = noDataNames.join(", ");
          //  console.warn("🚫 Participants with no data:", noDataNames);
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Invoice Generation Failed",
              message: `Company details are missing for the following participants: ${this.noDataErrorMessage}`,
              variant: "error",
              mode: "dismissable"
            })
          );
          this.showLoadingSpinner = false;
          return;
        }

        this.salesEntryList = [];
        this.salesEntry = this.emptyAccoutDetails();

        const company = companyResponse[this.clientId];
        const accountValue = accountResponse[this.clientId] || {};

        this.salesEntry = {
          company: company || null,
          entryType: "Sales",
          entityName: null,
          InvoiceDate: new Date().toISOString().split("T")[0],
          PostDate: null,
          IncludeGST: "Yes",
          Status: "Draft",
          comments: "",
          participantID: this.clientId,
          ServicesList: "",
          taxInclusive: true
        };

        participantServices.forEach((service, index) => {
          //console.log(' Service Id '+service.Id)
          this.addRow(service, accountValue);
        });
        this.salesEntry.ServicesList = participantServices
          .map((service) => service.Id)
          .join(",");

        this.recalculateTotals();
        console.log("Sending to Apex for Update:");
        console.log("Sales Entry:", JSON.stringify(this.salesEntry));
        console.log("Sales Entry List:", JSON.stringify(this.salesEntryList));
        console.log("amountarrey : " + JSON.stringify(this.amountarrey));

        // ✅ Now after building sales entry, call update
        const updateResult = await UpdateDataFromInvoice({
          salesEntryJson: JSON.stringify(this.salesEntry),
          salesEntryListJson: JSON.stringify(this.salesEntryList),
          amountEntryJson: JSON.stringify(this.amountarrey),
          isRFQ: false,
          isParticipantInvoice: true
        });
        console.log(
          "✅ Updated for participantId",
          JSON.stringify(updateResult)
        );
        const tempInvoiceId = updateResult.Id;
        console.log("Temporary Invoice ID:", tempInvoiceId);
        await getAccountingInvoiceById({ invoiceId: tempInvoiceId })
          .then((response) => {
            this.invRecords = response;
            console.log(
              "Invoice data for PDF:",
              JSON.stringify(this.invRecords)
            );
            this.generateBase64Data();
          })
          .catch((error) => {
            console.error("❌ Error fetching invoice by ID:", error);
            this.showLoadingSpinner = false;
          });
      } catch (error) {
        console.error("Error getting support data:", error);
        this.showLoadingSpinner = false;
      }
    }
  }

  emptyAccoutDetails() {
    const row = {
      company: "",
      entryType: "Sales",
      entityName: null,
      InvoiceDate: "",
      PostDate: "",
      // InvoiceNo: '',
      IncludeGST: "",
      Status: "",
      comments: ""
    };
    return row;
  }

  recalculateTotals() {
    let totalSubTotal = 0;
    let totalTaxAmount = 0;
    let totalAmount = 0;

    this.salesEntryList.forEach((entry) => {
      totalSubTotal += parseFloat(entry.subTotal) || 0;
      totalTaxAmount += parseFloat(entry.taxAmount) || 0;
      totalAmount += parseFloat(entry.totalAmount) || 0;
    });

    this.amountarrey = {
      subTotal: parseFloat(totalSubTotal.toFixed(2)),
      taxAmount: parseFloat(totalTaxAmount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2))
    };

    // Optional: set them separately too
  }

  createRow(service, accountValue) {
    let gstRate = 0;
    if (service.GST__c === "Yes") {
      gstRate = 10;
    }
    // console.log('unitPrice ==> '+accountValue?.Name);
    // console.log('unitPrice ==> '+accountValue ?.Account_Number__c);
    // console.log('unitPrice ==> '+service.Unit_Price__c);
    //  console.log('quantity ==> '+service.Qty__c);
    const quantity = service.Qty__c;
    const unitPrice = service.Unit_Price__c;
    const subtotal = quantity * unitPrice;
    console.log("quantity " + quantity);
    console.log("unitPrice " + unitPrice);
    console.log("subtotal " + subtotal);

    //  console.log('gstRate '+gstRate);

    const taxMultiplier = 1 + gstRate / 100;
    //  console.log('taxMultiplier '+taxMultiplier);
    const taxAmount = parseFloat(
      (subtotal - subtotal / taxMultiplier).toFixed(2)
    );
    //   console.log('taxAmount '+taxAmount);
    const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));
    //    console.log('totalAmount '+totalAmount);

    const newRow = {
      Id: Date.now(),
      sno: this.salesEntryList.length + 1,
      Description__c: service.Description__c,
      accountList:
        accountValue?.Name ||
        "" + " - " + accountValue?.Account_Number__c ||
        "",
      Quantity__c: quantity,
      UnitPrice__c: unitPrice,
      Amount__c: unitPrice,
      tax: gstRate + "%",
      taxvalue: gstRate + "%",
      accountItemId: accountValue?.Id || "",
      subTotal: parseFloat(subtotal.toFixed(2)), // ✅ Subtotal (without tax)
      taxAmount: taxAmount, // ✅ Tax extracted
      totalAmount: totalAmount,
      lineItems: service.Lineitem__c // ✅ Subtotal + Tax
    };
    // console.log('row ==> '+JSON.stringify(newRow));
    return newRow;
  }

  addRow(service, accountValue) {
    const newRow = this.createRow(service, accountValue);
    this.salesEntryList = [...this.salesEntryList, newRow];
    //   console.log('this.salesEntryList===>'+JSON.stringify(this.salesEntryList));
    this.reindexSalesEntryList(); // ensure S.No is always in order
  }
  reindexSalesEntryList() {
    this.salesEntryList = this.salesEntryList.map((row, index) => ({
      ...row,
      sno: index + 1
    }));
  }

  @track cleanedStateCode;
  getNDISServiceData() {
    console.log("Service Date ::" + this.selectedShiftDate);
    /*  getNDISServiceLineItem({ ServiceItemNames: this.ndisName,ServiceDate: this.selectedShiftDate}).then(result => {
            console.log('Services data with dates >>>'+JSON.stringify(result));
            this.serviceGroupName = result;
            if(this.services == ''){
                this.serviceGroupName = [];
            }
 
         }).catch(error=>{
             this.error = error;
         }) */
    this.serviceGroupName = [];

    getCatalogueData({
      serviceType: this.selectedfund,
      clientId: this.clientId
    })
      .then((result) => {
        console.log("Full Result:", result);
        console.log("Catalogue Data:", result.catalogueData);
        console.log("States Combined:", result.statesCombined);
        //this.serviceGroupName = true;
        //  this.NdisServiceGroupNameinEdit=true;
        const rawStateCode = result.statesCombined;

        console.log(
          "this.serviceGroupName >>" + JSON.stringify(this.serviceGroupName)
        );
        this.cleanedStateCode = rawStateCode.replace("__c", "");

        console.log("Cleaned State Code:", this.cleanedStateCode);

        this.serviceGroupName = [];
        // Check type before using map
        if (Array.isArray(result.catalogueData)) {
          this.serviceGroupName = result.catalogueData.map((item) => {
            return {
              ...item,
              amount: item[rawStateCode] || 0,
              isSelected: false
            };
          });
          this.openservice = true;
          this.showfunds = false;
          console.log(
            "✅ Mapped serviceEditGroupName:",
            JSON.stringify(this.serviceGroupName)
          );
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  openServicePage() {
    var selectedRecords = this.template
      .querySelector('[class="fundTable"]')
      .getSelectedRows();
    console.log("selectedRecords >>>" + JSON.stringify(selectedRecords));
    if (selectedRecords.length > 0 && selectedRecords.length < 2) {
      console.log("selectedRecords are ", selectedRecords);

      let ids = "";
      selectedRecords.forEach((currentItem) => {
        ids = ids + "," + currentItem.Id;
      });
      this.selectedIds = ids.replace(/^,/, "");
      this.lstSelectedRecords = selectedRecords;
      console.log("lstSelectedRecords>>>", this.lstSelectedRecords);
      this.selectedfund = this.lstSelectedRecords[0].Id;
      //changes made by maheswari line 830,846
      this.plantype = this.lstSelectedRecords[0].Plan_Type__c;
      //Start Auto searching while opening the Service Window
      this.ndisName = this.lstSelectedRecords[0].Registration_Group__c;
      console.log("NDIS Name >>" + this.ndisName);
      console.log("SELECTED fUND >>" + this.selectedfund);
      this.serviceGroupName = [];
      // this.getNDISServiceData();
      this.openservice = true;
      this.showfunds = false;
      this.selectedStaff = "";
    } else {
      // console.log('Choose one fund');
      this.showToast("Choose one Fund to proceed");
      this.openservice = false;
    }
  }

  handleRowActions(event) {
    const actionName = event.currentTarget.dataset.name;
    const rowId = event.currentTarget.dataset.id;
    const clientId = event.currentTarget.dataset.client;
    const serviceName = event.currentTarget.dataset.service;
    const selectedNDISId = event.currentTarget.dataset.servicetype;
    const fundId = event.currentTarget.dataset.fund;
    const shiftDate = event.currentTarget.dataset.date;
    this.stateValue = event.currentTarget.dataset.state;
    console.log("this.stateValue " + this.stateValue);

    this.recordId = rowId;
    this.clientId = clientId;
    this.selectedfund = fundId;
    this.selectedShiftDate = shiftDate;

    console.log("Editing row ID:", rowId);
    console.log("NDIS Catalog ID:", selectedNDISId);
    this.serviceGroupName = [];

    switch (actionName) {
      case "edit":
        this.isEdit = true;
        this.successmessage = "Service updated successfully.";
        this.errorMessage = "";
        this.saveDisabled = false;
        this.NdisServiceGroupNameinEdit = true;
        getClientFunds({ clientId: clientId }).then((response) => {
          if (response && response.length > 0) {
            this.TotalFunds = response;

            this.fundOption = response.map((rec) => {
              return { label: rec.Registration_Group__c, value: rec.Id };
            });
          } else {
            throw new Error("No client funds found.");
          }
        });

        if (this.stateValue) {
          const apexState = this.stateValue + "__c"; // Used in Apex
          const stateField = apexState; // Used for dynamic field lookup

          getSelectedSupportItems({
            fundTrackerId: this.selectedfund,
            clientId: this.clientId,
            state: apexState // This is correct
          })
            .then((selectedItems) => {
              console.log(
                "Selected Support Items from Apex:",
                JSON.stringify(selectedItems)
              );
              const selectedIds = selectedItems.map(
                (item) => item.NDIS_Support_Catalogue__c
              );
              console.log("selectedIds:", selectedIds);

              return getNDISCatalog({ ndisId: selectedIds }); // fetch catalog records
            })
            .then((catalogData) => {
              this.serviceGroupName = catalogData.map((item) => {
                const amount = item[stateField]; // correctly use dynamic field
                return {
                  ...item,
                  amount: amount !== undefined ? amount : 0.0,
                  isSelected: item.Id === selectedNDISId
                };
              });

              this.NdisServiceGroupNameinEdit = true;
              console.log(
                "Updated Service Group Name List:",
                JSON.stringify(this.serviceGroupName)
              );
            })
            .catch((error) => {
              console.error(
                "Error fetching selected support items or catalog items:",
                error
              );
              this.serviceGroupName = [];
            });
        }

        // Fetch client fund options
        /*  getClientFunds({ clientId: clientId })
                    .then(response => {
                        if (response && response.length > 0) {
                            this.TotalFunds = response;
                            this.serviceType = true;

                            this.fundOption = response.map(rec => {
                                return { label: rec.Registration_Group__c, value: rec.Id };
                            });

                            // Fetch NDIS Catalog data for the fund
                            return getCatalogueData({
                                serviceType: this.selectedfund,
                                clientId: this.clientId
                            });
                        } else {
                            throw new Error('No client funds found.');
                        }
                    })
                    .then(result => {
                        const catalogueData = result.catalogueData || [];
                        const stateField = result.statesCombined; // e.g., "QLD__c"

                        // Store state value so it's reflected in UI
                        this.stateValue = stateField.replace('__c', ''); // Ex: "QLD"

                        // Update service group list with amount and selected row
                        this.serviceGroupName = catalogueData.map(rec => {
                            return {
                                ...rec,
                                amount: rec[stateField] || 0.00,
                                isSelected: rec.Id === selectedNDISId
                            };
                        });

                        console.log('Updated service group list:', JSON.stringify(this.serviceGroupName));
                    })
                    .catch(error => {
                        console.error('Error in edit flow:', error);
                        this.errorMessage = 'Unable to load data. Please try again.';
                        this.serviceGroupName = [];
                    }); */

        break;
    }
  }

  /* handleRowActions(event) {
        const actionName = event.currentTarget.dataset.name;
        const row = event.currentTarget.dataset.id;
        const client = event.currentTarget.dataset.client;
        const service = event.currentTarget.dataset.service;
        let ndisCatlogvalue=event.currentTarget.dataset.servicetype;
        console.log('NDIS ID : '+ ndisCatlogvalue);
        let fundId =event.currentTarget.dataset.fund;
        console.log('selected row ====>'+JSON.stringify(row))
        this.recordId = row;
        this.selectedfund = event.currentTarget.dataset.fund;
        this.selectedShiftDate = event.currentTarget.dataset.date;
        switch (actionName) {        
            case 'edit':          
                this.isEdit=true;
                this.errorMessage;
                this.saveDisabled = false;
                this.NdisServiceGroupNameinEdit=true;
               // this.stateValue='';
                getClientFunds({clientId : client}).then(response=>{
                  //console.log('funds '+JSON.stringify(response));
                  if(response){
                    this.TotalFunds=response;
                    this.serviceType=true;
                    this.fundOption=response.map(rec=>{
                      return { "label": rec.Registration_Group__c,"value": rec.Id};
                    });
                   // console.log('funds option'+JSON.stringify(fundOption));
                   //console.log('service type names '+row.Service_Type_Name__c);
                        getCatalogueData({ serviceType:  this.selectedfund, clientId: this.clientId }).then(result => {
                        const catalogueData = result.catalogueData;
                        const stateField = result.statesCombined; // e.g., "NSW__c"
            
                        // this.ServiceStateEditValue = stateField;
            
                        this.serviceGroupName = catalogueData.map(rec => {
                        const isSelected = rec.Id === ndisCatlogvalue;
                        return {
                            ...rec,
                            amount: rec[stateField] || 0,
                            isSelected: isSelected
                        };
                    });
            
                        console.log('Service Group with Amounts:', JSON.stringify(this.serviceGroupName));
                    }).catch(error => {
                        console.error('Error fetching catalogue data:', error);
                    });
                  }
                }).catch(error=>{
                })
                break;            
        }
    }  */

  handleSelected(event) {
    this.checkStatus = "";
    event.detail.selectedRows.forEach((selectedRow) => {
      this.checkStatus = this.checkStatus + "," + selectedRow.Status__c;
    });

    if (
      event.detail.selectedRows.length > 0 &&
      !this.checkStatus.includes("Invoice Generated")
    ) {
      this.disableBool = false;
    } else {
      this.disableBool = true;
    }
  }
  @track selectedRecordMap = new Map();
  @track selectAllChecked = false;
  handleSelectAll(event) {
    this.selectAllChecked = event.target.checked;

    this.selectedRecordMap = new Map(); // Reset map

    this.template
      .querySelectorAll("lightning-input[data-id]")
      .forEach((input) => {
        input.checked = this.selectAllChecked;
        const recordId = input.dataset.id;
        const status = input.dataset.status;

        if (this.selectAllChecked) {
          this.selectedRecordMap.set(recordId, status);
          console.log("this.selectedRecordMap" + this.selectedRecordMap);
        }
      });

    this.checkStatus = Array.from(this.selectedRecordMap.values()).join(",");

    if (
      this.selectedRecordMap.size > 0 &&
      !this.checkStatus.includes("Invoice Generated")
    ) {
      this.disableBool = false;
    } else {
      this.disableBool = true;
    }
    this.accList = this.accList.map((acc) => {
      return {
        ...acc,
        isChecked: event.currentTarget.checked
      };
    });
    console.log(
      "All selectedRecordMap --> ",
      Array.from(this.selectedRecordMap.entries())
    );
  }
  handleCheckboxChange(event) {
    const recordId = event.currentTarget.dataset.id;
    const status = event.currentTarget.dataset.status;
    console.log("event.currentTarget.checked" + event.currentTarget.checked);
    console.log("recordId" + recordId);
    console.log("status" + status);
    //console.log('this.selectedRecordMap'+this.selectedRecordMap);
    //  this.selectedRecordMap = new Map();
    if (event.currentTarget.checked) {
      console.log(" in if ");
      this.selectedRecordMap.set(recordId, status);
      console.log(
        "this.selectedRecordMap" + JSON.stringify(this.selectedRecordMap)
      );
    } else {
      console.log(" in else ");
      this.selectedRecordMap.delete(recordId);
    }
    console.log(
      "this.selectedRecordMap ==> 1" + JSON.stringify(this.selectedRecordMap)
    );
    this.checkStatus = Array.from(this.selectedRecordMap.values()).join(",");
    console.log("this.checkStatus ==> 1" + this.checkStatus);

    if (
      this.selectedRecordMap.size > 0 &&
      !this.checkStatus.includes("Invoice Generated")
    ) {
      this.disableBool = false;
    } else {
      this.disableBool = true;
    }

    this.accList = this.accList.map((acc) => {
      if (recordId === acc.Id) {
        return {
          ...acc,
          isChecked: event.currentTarget.checked
        };
      }
      return acc;
    });
    console.log(
      "selectedRecordMap --> ",
      Array.from(this.selectedRecordMap.entries())
    );
  }

  generateBase64Data() {
    console.log("jspdfentered");
    const { jsPDF } = window.jspdf;
    var doc = new jsPDF();
    const invoice = this.invRecords[0];
    console.log("INVOICE RECORDS" + JSON.stringify(invoice));

    //var statePostalWithoutCommas = this.invRecords[0].Company__r.Address__c.replace(/,/g, " ");

    // doc.addImage(this.orgLogo, 'PNG', 20, 5, 10, 10, );

    doc.setFont("Roboto-Bold", "bold");
    //doc.setFontSize(20);
    //doc.text("DRAFT INVOICE", 20,25 );
    doc.setTextColor(0, 102, 255);
    doc.setFontSize(12);
    // doc.text(invoice.Company__r.Company_Name__c.toUpperCase(), 10, 25);
    doc.text(this.orgName.toUpperCase(), 10, 25);
    //console.log('orgname '+this.orgname);
    console.log("616");

    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto-Bold", "bold");
    doc.setFontSize(12);
    doc.text("ABN: " + invoice.Company__r.ABN__c, 10, 30);
    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

    doc.setFontSize(10);
    doc.text(invoice.Company__r.Address_Latest__Street__s + ",", 10, 35);
    doc.text(
      `${invoice.Company__r.Address_Latest__City__s} ${invoice.Company__r.Address_Latest__StateCode__s} ${invoice.Company__r.Address_Latest__PostalCode__s},`,
      10,
      40
    );
    doc.text("Contact: " + invoice.Company__r.Phone_Number__c, 10, 45);

    // top  left side box start
    doc.setFont("Roboto-Bold", "bold");
    doc.setFontSize(12);
    // doc.text("Invoice Number", 150, 24);
    doc.text("TAX  INVOICE", 158, 25);
    doc.setFont("Roboto-Bold", "bold");
    doc.setFontSize(12);
    doc.text(invoice.Name, 158, 30);

    const oldDate = invoice.Invoice_Date__c;
    const arr = oldDate.split("-");
    const newDate = arr[2] + "/" + arr[1] + "/" + arr[0];
    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.setFontSize(10);
    doc.text("Date Issued: " + newDate, 158, 35);
    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.setFontSize(10);

    let fileReference = "";
    console.log("fileReference  1 " + fileReference);
    console.log("invoice.Participant__r ==> " + invoice.Participant__r);
    if (invoice.Participant__r) {
      //  console.log('invoice.Participant__r ==> '+JSON.stringify(invoice.Participant__r ))
      fileReference =
        invoice.Participant__r.First_Name__c +
        " " +
        invoice.Participant__r.Last_Name__c;
      console.log("fileReference  1 " + fileReference);
    }

    doc.text("TAX INVOICE To: " + fileReference, 10, 72);

    function addFooter(doc) {
      let pageHeight = doc.internal.pageSize.height; // Get page height
      let footerY = pageHeight; // Footer position

      // Draw footer line
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      doc.line(0, footerY - 12, 210, footerY - 12);

      // Footer text
      doc.setFontSize(10);
      const logo = My_Resource + "/myResource/images/FooterLogo.jpg";
      const img = new Image();
      img.src = logo;

      doc.addImage(img, "JPEG", 30, footerY - 11, 30, 10);
      doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text("Powered by", 10, footerY - 5);

      // Centered Footer Text
      doc.setFontSize(10);
      doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text("Office Use Only", 90, footerY - 5);

      // Page Number
      doc.setFontSize(10);
      doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
      doc.text(`${doc.internal.getNumberOfPages()}`, 200, footerY - 5);
    }

    let yPosition = 82;
    var result = [];
    var subTotal = 0;

    let tabledata = this.invRecords[0].Accounting_Journal_Entry__r;
    console.log("INVOICE" + JSON.stringify(tabledata));
    tabledata.forEach((record) => {
      subTotal += record.Total_Amount__c;

      result.push([
        record.Line_Items__c,
        record.Description__c,
        record.Quantity__c.toFixed(2),
        record.Unit_Price__c.toLocaleString("en-US", {
          style: "currency",
          currency: "USD"
        }),
        record.Tax__c + "%", // Tax column
        record.Total_Amount__c.toLocaleString("en-US", {
          style: "currency",
          currency: "USD"
        })
      ]);
    });

    // Adding subtotal, GST, and total rows
    result.push([
      {
        content: "*Taxes are Exclusive",
        styles: { textColor: [128, 128, 128] }
      },
      "",
      "",
      "",
      "Sub Total:",
      "$" + subTotal.toFixed(2)
    ]);
    result.push([
      "",
      "",
      "",
      "",
      "Total GST:",
      "$" + invoice.GST__c.toFixed(2)
    ]);
    result.push([
      "",
      "",
      "",
      "",
      "Total:",
      "$" + invoice.Total_Amount__c.toFixed(2)
    ]);
    console.log("RESULT ==>" + JSON.stringify(result));
    // Generating table using autoTable
    doc.autoTable({
      startY: yPosition, // Starting Y position
      head: [["Line_Items__c", "Description", "Qty", "Rate", "Tax", "Amount"]],
      body: result,
      theme: "plain",
      /* styles: { halign: "left" }, */
      margin: { left: 10 },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        font: "Roboto-Bold",
        fontStyle: "bold"
      },
      bodyStyles: {
        font: "Helvetica",
        font: "Roboto-VariableFont_wdth,wght",
        fontStyle: "normal"
      },
      /* bodyStyles: { lineWidth: 0.5, lineColor: [0, 0, 0] }, */
      columnStyles: {
        /*  0: { cellWidth: 25, halign: "left" }, */
        1: { cellWidth: 50, halign: "left" }, // Description left-aligned
        2: { cellWidth: 25, halign: "left" }, // Qty left-aligned
        3: { cellWidth: 25, halign: "left" }, // Rate left-aligned
        4: { cellWidth: 25, halign: "right" }, // Tax right-aligned
        5: { cellWidth: 35, halign: "right" },
        6: { cellWidth: 35, halign: "right" } // Amount right-aligned
      },
      didParseCell: function (data) {
        var columnText = data.row.raw[3]; // Get column text
        if (data.row.index === 0) {
          if (data.column.index === 4 || data.column.index === 5) {
            data.cell.styles.halign = "right";
          } else {
            data.cell.styles.halign = "left";
          }
        }
        // Make Sub Total, Total GST, and Total bold
        if (["Total:"].includes(columnText)) {
          data.cell.styles.font = "Roboto-Bold";
          data.cell.styles.fontStyle = "bold";
        }
      },
      didDrawCell: function (data) {
        var doc = data.doc;
        var cell = data.cell;
        var rowIndex = data.row.index;
        var totalRowsCount = result.length; // Total rows including subtotal, GST, and total

        // Get the text of the fourth column (index 3) to check row type
        var columnText = data.row.raw[4];

        // Apply border only to normal rows & total row
        if (!["Sub Total:", "Total GST:"].includes(columnText)) {
          doc.setDrawColor(0, 0, 0); // Black border
          doc.setLineWidth(0.2);

          // Top border (for first row or total row)
          if (rowIndex === 0) {
            doc.line(cell.x, cell.y, cell.x + cell.width, cell.y);
          }

          // Bottom border (for normal rows and total row)
          if (rowIndex < totalRowsCount - 1) {
            doc.line(
              cell.x,
              cell.y + cell.height,
              cell.x + cell.width,
              cell.y + cell.height
            );
          }
        }
        if (columnText === "Total:") {
          doc.setDrawColor(0, 0, 0); // Black border
          doc.setLineWidth(0.2);

          if (data.column.index === 4 || data.column.index === 5) {
            // Top border
            doc.line(cell.x, cell.y, cell.x + cell.width, cell.y);

            // Bottom border
            doc.line(
              cell.x,
              cell.y + cell.height,
              cell.x + cell.width,
              cell.y + cell.height
            );
          }
        }
      },
      didDrawPage: function (data) {
        // Always add the footer on each page
        addFooter(data.doc);
      }
    });

    let finalYPosition = doc.lastAutoTable.finalY;
    // addFooter(doc);

    let availableSpace = doc.internal.pageSize.height - finalYPosition;
    console.log("available Space " + availableSpace);

    if (availableSpace > 100) {
      // Adding payment details at the bottom
      yPosition = finalYPosition + 35;
      doc.setDrawColor(0, 0, 0); // Black color
      doc.setLineWidth(0.5);
      doc.setLineDash([1, 1]); // Dotted line pattern (2px dash, 2px gap)
      doc.line(10, yPosition, 200, yPosition); // (startX, startY, endX, endY)
      doc.setLineDash();

      doc.setFontSize(10);
      doc.setFont("Roboto-Bold", "bold");
      doc.text("Payable to:", 10, yPosition + 6);

      doc.setFont("Roboto-Bold", "bold");
      doc.text("Bank", 10, yPosition + 12);
      doc.text(":", 40, yPosition + 12);
      doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
      doc.text(this.bank || " ", 42, yPosition + 12);

      doc.setFont("Roboto-Bold", "bold");
      doc.text("Account Name", 10, yPosition + 16);
      doc.text(":", 40, yPosition + 16);
      doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
      doc.text(this.accountName || " ", 42, yPosition + 16);

      doc.setFont("Roboto-Bold", "bold");
      doc.text("BSB", 10, yPosition + 20);
      doc.text(":", 40, yPosition + 20);
      doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
      doc.text(this.bsb || " ", 42, yPosition + 20);

      doc.setFont("Roboto-Bold", "bold");
      doc.text("Account Number", 10, yPosition + 24);
      doc.text(":", 40, yPosition + 24);
      doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
      doc.text(this.accountNo || " ", 42, yPosition + 24);

      doc.setFontSize(10);
      doc.setFont("Roboto-Bold", "bold");
      doc.text("Terms & Conditions:", 10, yPosition + 44);
      doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
      doc.setTextColor(169, 169, 169);
      doc.text("All terms and conditions apply.", 10, yPosition + 48);
      doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
      addFooter(doc);
    } else {
      doc.addPage();

      yPosition = 25;
      doc.setDrawColor(0, 0, 0); // Black color
      doc.setLineWidth(0.5);
      doc.setLineDash([1, 1]); // Dotted line pattern (2px dash, 2px gap)
      doc.line(10, yPosition, 200, yPosition); // (startX, startY, endX, endY)
      doc.setLineDash();

      doc.setFontSize(10);
      doc.setFont("Roboto-Bold", "bold");
      doc.text("Payable to:", 10, yPosition + 6);

      doc.setFont("Roboto-Bold", "bold");
      doc.text("Bank:", 10, yPosition + 12);
      doc.text(":", 40, yPosition + 12);
      doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
      doc.text(this.bank || " ", 42, yPosition + 12);

      doc.setFont("Roboto-Bold", "bold");
      doc.text("Account Name:", 10, yPosition + 16);
      doc.text(":", 40, yPosition + 16);
      doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
      doc.text(this.accountName || " ", 42, yPosition + 16);

      doc.setFont("Roboto-Bold", "bold");
      doc.text("BSB:", 10, yPosition + 20);
      doc.text(":", 40, yPosition + 20);
      doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
      doc.text(this.bsb || " ", 42, yPosition + 20);

      doc.setFont("Roboto-Bold", "bold");
      doc.text("Account Number:", 10, yPosition + 24);
      doc.text(":", 40, yPosition + 24);
      doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
      doc.text(this.accountNo || " ", 42, yPosition + 24);

      doc.setFontSize(10);
      doc.setFont("Roboto-Bold", "bold");
      doc.text("Terms & Conditions:", 10, yPosition + 44);
      doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
      doc.setTextColor(169, 169, 169);
      doc.text("All terms and conditions apply.", 10, yPosition + 48);
      doc.setFont("Roboto-VariableFont_wdth,wght", "normal");

      addFooter(doc);
    }

    this.base64string = btoa(doc.output());

    console.log("Generated PDF Base64: " + this.base64string);
    console.log("Generated PDF Name: " + this.invRecords[0].Name);
    console.log("Generated recordId: " + this.invRecords[0].Id);

    uploadFile({
      base64: JSON.stringify(this.base64string),
      filename: this.invRecords[0].Name + ".pdf",
      recordId: this.invRecords[0].Id,
      obj: "AccountingInvoice"
    }).then((result) => {
      setTimeout(() => {
        // Show success toast message
        const evt = new ShowToastEvent({
          title: "Success",
          message: "Invoice Generated successfully",
          variant: "success",
          mode: "dismissable"
        });
        this.dispatchEvent(evt);

        console.log("PDF generated and uploaded successfully");

        this.isInvoiceflag = true;
        this.showLoadingSpinner = false;
        //   this.selectedRecordMap =  [];
        this.invRecords = [];
        this.selectedRecordMap = new Map(); //// TEMPARARAY CODE
        this.accList = this.accList.map((acc) => {
          return {
            ...acc,
            isChecked: false
          };
        });
        //  this.disableBool = true;

        refreshApex(this.wireServiceList);
        refreshApex(this.wiredBulkServicesResult);
      }, 3000);
    });

    // doc.save('Invoice.pdf');
    //  console.log('isSalesFlag  in pdf: ', this.isSalesFlag);
    //  console.log('isRFQEnabled in pdf : ', this.isRFQEnabled);
    //  console.log('isInvoiceflag in pdf : ', this.isInvoiceflag);
    //console.log('invoiceflag in pdf : ', this.invoiceflag);
    //return this.base64string;
  }

  handleDownload(event) {
    // console.log("PDF records>>>> ", this.invRecords);
  }

  *serviceChange(event) {
    this.services = event.target.value;
    console.log("Services >>>" + this.services);
    /*  getNDISServiceLineItem({ ServiceItemNames: this.services,ServiceDate: this.selectedShiftDate}).then(result => {
            console.log('result >>>'+JSON.stringify(result));
            this.serviceGroupName = result;
            if(this.services == ''){
                this.serviceGroupName = [];
            }

        }).catch(error=>{
            this.error = error;
        }) */
  }

  handleRowSelection(event) {
    var selectedServiceRows = event.detail.selectedRows;
    console.log(
      "before selectedServiceRows>>" + JSON.stringify(selectedServiceRows)
    );
    this.selectedNdisIdValue = selectedServiceRows[0].Id;
    this.ndisName = selectedServiceRows[0].Name;
    console.log("after selected >>" + this.selectedNdisIdValue);
    console.log("after selected >>" + this.ndisName);
    if (this.qty <= 0 && this.selectedNdisIdValue != null) {
      this.errorMessage = "End time always should be greater than Start time";
      this.saveDisabled = true;
      this.errorMessageFlag = true;
    } else {
      this.errorMessage = "";
      this.saveDisabled = false;
      this.errorMessageFlag = false;
    }
    /*  if(){
            this.saveDisabled = true;
        } */
  }

  @track serviceHeader = [
    "Resource Name",
    "Service Type",
    "Line Item",
    "Available Funds",
    "Service Date",
    "Qty",
    "Unit Price",
    "GST",
    "Amount",
    "Status"
  ];
  handleDownloadServices() {
    let doc = "<table>";

    // Add styles for the table
    doc += "<style>";
    doc += "table, th, td {";
    doc += "    border: 5px solid black;";
    doc += "    border-collapse: collapse;";
    doc += "}";
    doc += "</style>";

    doc += "<tr>";
    doc +=
      '<td colspan="10"><h3 style="font-size: 24; font-family: Calibri; text-align:center;">' +
      this.orgNames +
      "</td>";
    doc += "</tr>";
    doc += "<tr>";
    doc +=
      '<td colspan="10" style="font-size: 20; font-family: Calibri; text-align:center;">Address: ' +
      this.orgStreet +
      ", " +
      this.orgCity +
      ", " +
      this.stateCode +
      ", " +
      this.postalCode +
      "</td>";
    doc += "</tr>";
    doc += "<tr>";
    doc +=
      '<td colspan="10" style="text-align:left;font-size: 20; font-family: Calibri; text-align:center;">Contact No: ' +
      this.contactNo +
      "</td>";
    doc += "</tr>";
    doc += "<tr>";
    doc +=
      '<td colspan="10" style="text-align:left; font-size: 20; font-family: Calibri; text-align:center;">ABN: ' +
      this.abn +
      "</td>";
    doc += "</tr>";

    doc += '<tr><td colspan="10"></td></tr>';
    doc += '<tr><td colspan="10"></td></tr>';

    doc += "<tr >";
    doc +=
      '<th bgcolor="1a4876" colspan="10" style="font-size: 10; font-family: Calibri;">' +
      "<h2>" +
      '<font color="white" style="font-size: 17; font-family: Calibri;">' +
      "Services Data" +
      "</font>" +
      "</h2>" +
      "</th>";
    doc += "</tr>";

    doc += "<tr>";
    this.serviceHeader.forEach((header) => {
      doc +=
        '<th bgcolor="c6c6c6" style="font-size: 17; font-family: Calibri;">' +
        header +
        "</th>";
    });
    doc += "</tr>";

    this.accList.forEach((fieldsData) => {
      doc += "<tr>";
      doc +=
        '<td style="font-size: 17px; font-family: Calibri;">' +
        fieldsData.Resource_Name__c +
        "</td>";
      doc +=
        '<td style="font-size: 17px; font-family: Calibri;">' +
        fieldsData.Service_Type_Name__c +
        "</td>";
      doc +=
        '<td style="font-size: 17px; font-family: Calibri;">' +
        fieldsData.Lineitem__c +
        "</td>";
      doc +=
        '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' +
        "$" +
        fieldsData.Available_Fund__c +
        "</td>";
      doc +=
        '<td style="font-size: 17px; font-family: Calibri; text-align:left;">' +
        fieldsData.Date_of_Service__c +
        "</td>";
      doc +=
        '<td style="font-size: 17px; font-family: Calibri;">' +
        fieldsData.Qty__c +
        "</td>";
      doc +=
        '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' +
        "$" +
        fieldsData.Unit_Price__c +
        "</td>";
      doc +=
        '<td style="font-size: 17px; font-family: Calibri;">' +
        fieldsData.GST__c +
        "</td>";
      doc +=
        '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' +
        "$" +
        fieldsData.Amount__c +
        "</td>";
      doc +=
        '<td style="font-size: 17px; font-family: Calibri;">' +
        fieldsData.Status__c +
        "</td>";
      doc += "</tr>";
    });

    // Add a blank row for spacing
    doc += '<tr><td colspan="10"></td></tr>';

    // End of Table 1
    doc += "</table>";

    var element = "data:text/csv;charset=utf-8," + encodeURIComponent(doc);
    let downloadElement = document.createElement("a");
    downloadElement.href = element;
    downloadElement.target = "_self";
    // use .csv or .xls as extension on below line if you want to export data
    downloadElement.download = "Services.xls";
    document.body.appendChild(downloadElement);
    downloadElement.click();
  }

  @track selectedShiftDate;
  @track spickval;
  @track epickval;
  @track qty;
  timeChange(event) {
    if (event.target.name == "startTime") {
      this.startTimePickval = event.target.value;
      // console.log('start time picklist'+ this.startTimePickval);
    }
    if (event.target.name == "endTime") {
      this.endTimePickval = event.target.value;
      // console.log('start time picklist'+ this.endTimePickval);
    }
    if (event.target.name == "date") {
      this.selectedShiftDate = event.target.value;
      console.log("sselectedShiftDate" + this.selectedShiftDate);
    }
    console.log("Onchange service date ::" + this.selectedShiftDate);
    //  this.getNDISServiceData();
    // let starttimevalue=  this.convertTo24Hour(this.startTimePickval);
    //  this.spickval=starttimevalue+':00Z';
    //  console.log(' satrt time value in 24 hours format ==>'+ this.spickval);

    //  let endTimeValue=  this.convertTo24Hour(this.endTimePickval);
    //  this.epickval=endTimeValue+':00Z';
    // console.log('end value in 24 hours format ==>'+ this.epickval);
    //if(this.epickval >)

    // console.log('date value in time change==>'+this.selectedShiftDate);
    let Dateparts = this.selectedShiftDate.split("-");
    let startParts = this.startTimePickval.split(":");
    // console.log('start time parts==>'+startParts);
    let startDate = new Date();

    startDate.setDate(parseInt(Dateparts[2], 10));
    startDate.setHours(parseInt(startParts[0], 10));
    startDate.setMinutes(parseInt(startParts[1], 10));
    // console.log("start date"+startDate);

    let endParts = this.endTimePickval.split(":");
    // console.log('end time parts==>'+endParts);

    let endDate = new Date();
    endDate.setDate(parseInt(Dateparts[2], 10));
    endDate.setHours(parseInt(endParts[0], 10));
    endDate.setMinutes(parseInt(endParts[1], 10));
    // console.log("end date"+endDate);

    let durationInMilliseconds = endDate - startDate;
    // console.log("duration in millisec"+durationInMilliseconds);

    // Convert milliseconds to hours and minutes
    let durationInMinutes = durationInMilliseconds / (1000 * 60);
    // console.log("duration in minutes"+durationInMinutes);
    let hours = (durationInMinutes / 60).toFixed(1);
    // console.log("duration in hours"+hours);
    this.qty = hours;
  }

  @track errorMessage;
  @track saveDisabled = false;
  @track errorMessageFlag = false;
  convertTo24Hour(time12h) {
    const [time, modifier] = time12h.split(" ");
    let [hours, minutes] = time.split(":");

    if (hours === "12") {
      hours = "00";
    }

    if (modifier === "pm") {
      hours = parseInt(hours, 10) + 12;
    }
    if (hours < 10 && hours != 0) {
      hours = "0" + hours;
    }

    return `${hours}:${minutes}`;
  }

  @track isModalOpen = false;
  @track currentUrl;

  handleView(event) {
    const url = event.currentTarget.dataset.url;
    event.preventDefault();
    setTimeout(() => {
      refreshApex(this.wireServiceList);
      refreshApex(this.wiredBulkServicesResult);
      this.currentUrl = url;
      // console.log('file url  '+ this.currentUrl);
      this.isModalOpen = true;
      this.isHome = false;
    }, 1000);
  }

  closeModal() {
    this.isModalOpen = false;
    this.currentUrl = null;
    this.isHome = true;
  }

  getFileName(url) {
    return url.substring(url.lastIndexOf("/") + 1);
  }

  @track userTypeValue;
  wireuser;
  @track error;
  @wire(getRecord, {
    recordId: USER_ID,
    fields: [UserType]
  })
  wireuser({ error, data }) {
    if (error) {
      this.error = error;
    } else if (data) {
      this.userTypeValue = data.fields.User_Type__c.value;
      if (this.userTypeValue == "NDIS Participants") {
        this.participantlogin = false;
      } else {
        this.participantlogin = true;
      }
    }
  }

  handleServiceChange(event) {
    // console.log('event target'+JSON.stringify(event.target.options));
    //console.log('event details'+JSON.stringify(event.detail));
    console.log("shift created date " + this.selectedShiftDate);
    this.services = event.target.options.find(
      (opt) => opt.value === event.detail.value
    ).label;
    console.log("shift created date " + this.services);
    this.selectedfund = event.detail.value;
    if (this.services) {
      getNDISServiceLineItem({
        ServiceItemNames: this.services,
        ServiceDate: this.selectedShiftDate
      }).then((response) => {
        if (response) {
          this.NdisServiceGroupNameinEdit = false;
          this.stateValue = "";
          this.serviceGroupName = response;
          // console.log('service type '+JSON.stringify(this.serviceGroupName));
        }
      });
    }
  }

  //maheswari added this function
  get isServiceGroupVisible() {
    return (
      this.stateValue &&
      this.serviceGroupName &&
      this.serviceGroupName.length > 0
    );
  }

  stateChange(event) {
    const selectedState = event.target.value; // Eg: 'NT'
    this.stateValue = selectedState;
    console.log("Selected state value: " + this.stateValue);
    console.log("Selected FundId: " + this.selectedfund);
    console.log("ClientId: " + this.clientId);

    if (this.stateValue) {
      const apexState = this.stateValue + "__c"; // Used in Apex
      const stateField = apexState; // Used for dynamic field lookup

      getSelectedSupportItems({
        fundTrackerId: this.selectedfund,
        clientId: this.clientId,
        state: apexState // This is correct
      })
        .then((selectedItems) => {
          console.log(
            "Selected Support Items from Apex:",
            JSON.stringify(selectedItems)
          );
          const selectedIds = selectedItems.map(
            (item) => item.NDIS_Support_Catalogue__c
          );
          console.log("selectedIds:", selectedIds);

          return getNDISCatalog({ ndisId: selectedIds }); // fetch catalog records
        })
        .then((catalogData) => {
          this.serviceGroupName = catalogData.map((item) => {
            const amount = item[stateField]; // correctly use dynamic field
            return {
              ...item,
              amount: amount !== undefined ? amount : 0.0
              //isSelected: item.Id === selectedNDISId
            };
          });

          this.NdisServiceGroupNameinEdit = true;
          console.log(
            "Updated Service Group Name List:",
            JSON.stringify(this.serviceGroupName)
          );
        })
        .catch((error) => {
          console.error(
            "Error fetching selected support items or catalog items:",
            error
          );
          this.serviceGroupName = [];
        });
    }
  }

  HandlestateChange(event) {
    this.stateValue = event.target.value;
    console.log("state value " + this.stateValue);
    if (this.stateValue) {
      this.serviceGroupName = this.serviceGroupName.map((item) => {
        const amount = item[this.stateValue]; // Dynamically fetch the state's amount field
        // console.log('amount '+amount);
        if (amount !== undefined) {
          return { ...item, amount }; // Include the state's amount in the filtered row
        }
        return { ...item, amount: 0.0 }; // Add an empty amount for rows without the state's field
      });
      this.NdisServiceGroupNameinEdit = true;
      console.log(
        " Service list based on state change " +
          JSON.stringify(this.serviceGroupName)
      );
    }
  }

  handleCheckboxSelection(event) {
    const selectedId = event.target.getAttribute("data-id"); // Get the selected row's ID
    const selectedRow = this.serviceGroupName.find(
      (row) => row.Id === selectedId
    );
    console.log("Selected row " + JSON.stringify(selectedRow));
    this.selectedNdisIdValue = selectedRow.Id;
    // Update the isSelected property for all rows
    this.serviceGroupName = this.serviceGroupName.map((row) => ({
      ...row,
      isSelected: row.Id === selectedId // Set true for the selected row, false for others
    }));
    this.saveDisabled = false;

    console.log("Selected Row ID:", selectedId);
  }
  handleDeleteConfirmation(event) {
    this.ServiceWarningMessage = true;
    this.participantServiceDeleteInfo = {};
    this.participantServiceDeleteInfo.partcipantName =
      event.currentTarget.dataset.participantname;
    this.participantServiceDeleteInfo.serviceId =
      event.currentTarget.dataset.id;
    console.log(
      "this.participantServiceDeleteInfo " +
        JSON.stringify(this.participantServiceDeleteInfo)
    );
  }
  closeWarningMessage() {
    this.ServiceWarningMessage = false;
  }
  handleDeleteService(event) {
    this.isShowSpinner = true;
    // let serviceId=event.currentTarget.dataset.id;
    deleteRecord(this.participantServiceDeleteInfo.serviceId).then(() => {
      const evt = new ShowToastEvent({
        title: "Success",
        message: "Service has been deleted successfully",
        variant: "success",
        mode: "dismissable"
      });
      this.dispatchEvent(evt);
      refreshApex(this.wiredBulkServicesResult);
      this.ServiceWarningMessage = false;
    });
  }

  handleDeleteClick(event) {
    const recordId = event.currentTarget.dataset.id;
    const status = event.currentTarget.dataset.shiftStatus;
    const uistatus = event.currentTarget.dataset.uistatus;
    console.log("recordId >>", recordId);
    console.log("status >>", status);
    console.log("uistatus >>", uistatus);

    if (uistatus === "Invoice Generated") {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Action Not Allowed",
          message:
            "You cannot delete this service because an invoice has already been generated.",
          variant: "error"
        })
      );
      return;
    } else if (status === "InProgress") {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Action Not Allowed",
          message: "You cannot delete this service while it is in progress.",
          variant: "error"
        })
      );
      return;
    } else if (status === "Completed") {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Action Not Allowed",
          message:
            "You cannot delete this service as it has already been completed.",
          variant: "error"
        })
      );
      return;
    }

    this.showLoadingSpinner = true;
    deleteRecord(recordId)
      .then(() => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: "Service deleted successfully.",
            variant: "success"
          })
        );
        // Optionally: fire event or refresh data
        refreshApex(this.wireServiceList);
        this.showLoadingSpinner = false;
      })
      .catch((error) => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error deleting record",
            message: error.body.message,
            variant: "error"
          })
        );
      });
  }
  handleStaffChange(event) {
    this.selectedStaff = event.detail.value;
    console.log("selectedStaff in onchange " + event.detail.value);
  }
}