import { LightningElement, api, track, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import momentJS from "@salesforce/resourceUrl/momentJS";
import { loadScript } from "lightning/platformResourceLoader";
import getStaffAllocation from "@salesforce/apex/RoasterManagementHandler.getStaffAllocation";
import updateAllocationRecoreds from "@salesforce/apex/AllocationsCopy.updateAllocationRecoreds";
//import geFacilitytAlocations from '@salesforce/apex/AllocationsCopy.geFacilitytAlocations';
//import createAllocation from '@salesforce/apex/RoasterManagementHandler.createAllocation';
import getAlocationData from "@salesforce/apex/RoasterManagementHandler.getAlocationData";
//import getStaffAlocationData from '@salesforce/apex/RoasterManagementHandler.getStaffAlocationData';
import getFacilityData from "@salesforce/apex/HrHomeHandler.fetchFacilitiess";
import { refreshApex } from "@salesforce/apex";
import { NavigationMixin } from "lightning/navigation";
import My_Resource from "@salesforce/resourceUrl/myResource";
import { deleteRecord } from "lightning/uiRecordApi";
import FORM_FACTOR from "@salesforce/client/formFactor";
import createTimeSheet from "@salesforce/apex/RoasterManagementHandler.createTimeSheet";
import clonePreviousDayAllocation from "@salesforce/apex/RoasterManagementHandler.clonePreviousDayAllocation";
import updateTimeSheets from "@salesforce/apex/RoasterManagementHandler.updateTimeSheets";
import getIctList from "@salesforce/apex/RoasterManagementHandler.getIctList";
import LightningConfirm from "lightning/confirm";
import Id from "@salesforce/user/Id";
import { getRecord } from "lightning/uiRecordApi";
import UserNameFld from "@salesforce/schema/User.Name";
import UserEmail from "@salesforce/schema/User.Email";
import UsrRoleName from "@salesforce/schema/User.User_Role__c";
import organizationDetails from "@salesforce/apex/InvoiceHandler.organizationDetails";
import insertInvoice from "@salesforce/apex/InvoiceHandler.insertInvoice";
import listofInvoices from "@salesforce/apex/InvoiceHandler.listofInvoices";
import jsPDF from "@salesforce/resourceUrl/jspdf";
import holidayList from "@salesforce/apex/LeaveController.holidayListbyOrg";
import robotoFont from "@salesforce/resourceUrl/Roboto";
//import html2canvas from '@salesforce/resourceUrl/html2canvas';
//import Dompurify from '@salesforce/resourceUrl/Dompurify';
import autoTable from "@salesforce/resourceUrl/autotable";
import uploadFile from "@salesforce/apex/AWSS3FileUploadController.uploadFile";
import listofInvoicesParent from "@salesforce/apex/InvoiceHandler.listofInvoicesParent";
import getLedgerItems from "@salesforce/apex/AccountingModuleController.getLedgerItems";
import getCurrentLoggedUserInfo from "@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo";
import getFacilityCurrentUser from "@salesforce/apex/PortalUserController.getFacilityCurrentUser";
import getstaffId from "@salesforce/apex/UserAccessController.getstaffId1";

const actions = [
  { label: "View Invoice", name: "view_details" },
  { label: "Delete", name: "delete" }
];
export default class IctTimeSheet extends NavigationMixin(LightningElement) {
  attendence = My_Resource + "/myResource/images/TimeSheet.PNG";
  logo = My_Resource + "/myResource/images/Tesseract.jpg";
  @api recordId = "";
  @api objectApiName;
  @track isShowModal = false;
  @track isResourceView;
  @track isProjectView;
  @track isRecordTypeView;
  // design attributes
  @api defaultView;
  @track visible = false;
  @track sDate;
  @track staffData;
  @track allocationList = [];
  @track visibleData;
  @track finalStaffData = [];
  @track allocationId;
  @track allocationId1;
  @track showbreak2Edit = false;
  @track showbreak3Edit = false;
  // navigation
  @track startDateUTC; // sending to backend using time
  @track endDateUTC; // sending to backend using time
  @track formattedStartDate; // Title (Date Range)
  @track formattedEndDate; // Title (Date Range)
  @track dates = []; // Dates (Header)
  dateShift = 7; // determines how many days we shift by
  @track holidayList;
  @track holidayDateList = [];
  @track whours;
  @track starttime;
  @track endTime;
  @track spkValue;
  @track epkValue;
  @track breakTime;
  @track allocationIds = [];
  @track faclitylabel;
  @track ictComments;
  @track showCommentPopUp;
  @track showICtinvoice;
  @track isHome = true;
  @track cloneflag = false;
  invoiceIdToDelete;
  @track invoiceDeleteFlag = false;
  @track showAddIcon = true;
  @track editflag1 = false;
  @track breakstartTimevalue = null;
  @track breakendTimevalue = null;
  @track breakstartTime2value = null;
  @track breakendTime2value = null;
  @track breakstartTime3value = null;
  @track breakendTime3value = null;
  @track breakTimeEdit = null;
  @track whoursEdit = null;
  @track startTimeValue = null;
  @track Endtimevalue = null;
  @track EndTime = null;
  @track starttime = null;
  @track showAddIcon1 = true;
  @track workingHours = 0;
  @track isediticon = false;
  @track uistarttime;
  @track uiendTime;
  @track uibreakStartTime;
  @track uibreakEndTime;
  @track uibreakStartTime2;
  @track uibreakEndTime2;
  @track uibreakStartTime3;
  @track uibreakEndTime3;
  // options
  @track datePickerString; // Date Navigation
  @track view = {
    // View Select
    options: [
      {
        label: "View by Day",
        value: "1/7"
      }
      /*{
        label: "View by Week",
        value: "7/7"
      }*/
    ],
    slotSize: 1,
    slots: 1
  };

  // gantt_chart_resource
  @track startDate;
  @track endDate;
  @track projectId;
  @track resources = [];
  @track records;
  @track facilityOptions = [];
  @track facilityVal;
  @track editflag = false;
  @track ApprovalStatus;
  @track isSubmitButton = true;
  @track totalHours = 0;
  @track satffDataJasonformat = {};
  @track getStartTime = "";
  @track startTimeJSOn;
  @track EndTimeJSOn;
  @track dateJson;
  @track breakJson;
  //@track ictStatus;
  @track openComments = false;
  @track hoursInUIPage;
  @track invoiceData;
  @track orgId;
  @track orgname;
  @track abn;
  @track rcti;
  @track address;
  @track statePostal;
  @track contactNo;
  @track bank;
  @track accountNo;
  @track accountName;
  @track bsb;
  @track desc;
  @track orgLogo;
  @track options = [
    { label: "Yes", value: "Yes" },
    { label: "No", value: "No" }
  ];
  @track taxinvoice;
  @track dateIssued;
  @track selectedGSTValue = "Yes";

  get isDesktop() {
    return FORM_FACTOR === "Large";
  }

  get isMobile() {
    return FORM_FACTOR === "Small";
  }
  @track currentUser;
  @track currentUserEmail;
  @track currentUserRole;
  @track usererror;
  @track breakReadonly;
  @track accountRecList = [];
  @track attachApproval;
  @track invoiceTable;
  @track editICTInvoice;
  @track facilityValFalg = false;
  @track recordsFalg = true;
  @track showSpinner = false;
  @track AllocationHeading;
  @track submitlabel;
  @track state;
  @track disableTimeButton;
  wiredCompanyList;
  @api orgid;
  wiredEntityProfilesResult;
  @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
  @track paginationRecords = []; //All records available in the data table
  @track columns = []; //columns information available in the data table
  @track totalRecords = 0; //Total no.of records
  @track pageSize; //No.of records to be displayed per page
  @track totalPages; //Total no.of pages
  @track pageNumber = 1; //Page number
  @track recordsToDisplay = []; //Records to be displayed on the page
  @track noRecordsFlag = false;
  @track columns = [
    { label: "Invoice No", fieldName: "Name", initialWidth: 80 },
    {
      label: "Start Date",
      fieldName: "Start_Date__c",
      initialWidth: 150,
      type: "date",
      typeAttributes: { month: "2-digit", day: "2-digit", year: "numeric" }
    },
    {
      label: "End Date",
      fieldName: "End_Date__c",
      initialWidth: 150,
      type: "date",
      typeAttributes: { month: "2-digit", day: "2-digit", year: "numeric" }
    },
    {
      label: "Issue Date",
      fieldName: "Date_Issued__c",
      initialWidth: 150,
      type: "date",
      typeAttributes: { month: "2-digit", day: "2-digit", year: "numeric" }
    },
    /*  { label: 'View Invoice', fieldName: 'Amazon_URL__c',  initialWidth: 150 , type: 'url'}, */
    {
      type: "action",
      label: "Action",
      initialWidth: 300,
      typeAttributes: { rowActions: actions }
    }
  ];
  @track salesEntry = {
    company: "",
    entryType: "Sales",
    entityName: "",
    InvoiceDate: "",
    PostDate: "",
    InvoiceNo: "",
    IncludeGST: "",
    Status: "",
    comments: ""
  };
  @track entryType = "Sales";
  @track selectedRowId;
  @track ictInvoiceFlag = false;
  @track searchName = "";
  @track filteredStaffData = [];
  @wire(getRecord, {
    recordId: Id,
    fields: [UserNameFld, UserEmail, UsrRoleName]
  })
  userDetails({ error, data }) {
    if (data) {
      this.currentUser = data.fields.Name.value;
      this.currentUserEmail = data.fields.Email.value;
      this.currentUserRole = data.fields.User_Role__c.value;
      // console.log('role==>'+this.currentUserRole);
      // console.log('current logged in user==>'+this.currentUser) ;
      // console.log('current logged in email==>'+ this.currentUserEmail) ;
      if (
        this.currentUserRole == "Portal Account Partner Executive" ||
        this.currentUserRole == "Portal Account Partner Manager" ||
        this.currentUserRole == "CEO" ||
        this.currentUserRole == "Admin"
      ) {
        this.editICTInvoice = true;
      } else {
        this.editICTInvoice = false;
      }
    } else if (error) {
      this.usererror = error;
    }
  }
  /* jsPDFInitialized= false; */
  renderedCallback() {
    /*  if (this.jsPDFInitialized) {
        return; // Prevent reloading scripts multiple times
    }  */
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
        console.log("✅ jsPDF and ROBOTO font loaded");

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

  connectedCallback() {
    // this.addNewInvoiceRow();
    this.disableRightClick();
    this.disableShortcuts();
    organizationDetails().then((response) => {
      // console.log('calling response raja', JSON.stringify(response));
      this.invoiceData = response.listofPriceBook;
      // console.log('calling data blob', response.listofPriceBook.Id);
      // console.log('calling data blob', response.bolbdata);
      this.orgId = response.listofPriceBook.Id;
      this.orgname = response.listofPriceBook.Name;
      this.abn = response.listofPriceBook.ABN__c;
      this.rcti = response.listofPriceBook.RCTI__c;
      this.address = response.listofPriceBook.Address_Latest__Street__s;
      this.statePostal =
        response.listofPriceBook.Address_Latest__City__s +
        "," +
        response.listofPriceBook.Address_Latest__StateCode__s +
        "," +
        response.listofPriceBook.Address_Latest__PostalCode__s;
      this.contactNo = response.listofPriceBook.Contact_No__c;
      this.bank = response.listofPriceBook.Bank__c;
      this.accountNo = response.listofPriceBook.Account_Number__c;
      this.accountName = response.listofPriceBook.Account_Name__c;
      this.bsb = response.listofPriceBook.BSB__c;
      this.desc = response.listofPriceBook.Description__c;
      this.state = response.listofPriceBook.Address_Latest__StateCode__s;
      this.orgLogo = response.bolbdata;
      //console.log('invoiceData data ', JSON.stringify(this.invoiceData));
      // console.log('orgId>>>>', this.orgId);
      console.log("state>>>>", this.state);
      this.defaultView = "View by Day";
      Promise.all([
        //loadScript(this, Dompurify),
        loadScript(this, jsPDF),
        loadScript(this, momentJS),
        loadScript(this, autoTable)
      ]).then(() => {
        switch (this.defaultView) {
          case "View by Week":
            this.setView("7/7");
            break;
          default:
            this.setView("1/7");
        }
        this.setStartDate(new Date());
      });
    });

    getFacilityData()
      .then((response) => {
        getCurrentLoggedUserInfo().then((userData) => {
          const storedFacilityId = localStorage.getItem("defaultFacilityId");
          const storedFacilityLabel = localStorage.getItem(
            "defaultFacilityLabel"
          );
          console.log("storedFacilityId local storage " + storedFacilityId);
          console.log(
            "storedFacilityLabel local storage " + storedFacilityLabel
          );
          console.log("user data ==>" + JSON.stringify(userData));
          let userType = userData.User_Type__c;
          console.log("userType >>", userType);
          if (
            userType == "ICT Admin" ||
            userType == "NDIS Org Admin" ||
            userType == "NDIS Staff" ||
            userType == "ICT Staff"
          ) {
            this.facilityOptions = response.map((record) => ({
              value: record.Id,
              label: record.Name
            }));
            console.log(
              " this.facilityOptions in ICT Admin IN IF " + this.facilityOptions
            );
            // console.log('facilities'+JSON.stringify(this.facilityOptions));
            let facilityLength = Object.keys(this.facilityOptions).length;
            // console.log('facility length'+facilityLength);
            // console.log('facility first value'+this.facilityOptions[0].value);
            this.facilityVal = storedFacilityId;
            // console.log('facility first value'+this.facilityOptions[0].label);
            this.faclitylabel = storedFacilityLabel;
            this.handleVisbility();
          } else if (
            userType == "Facility Admin" ||
            userType == "Roster Manager"
          ) {
            getFacilityCurrentUser().then((result) => {
              this.facilityOptions = result.map((record) => ({
                label: record.Facility__r.Name,
                value: record.Facility__r.Id
              }));
              console.log(
                " this.facilityOptions in facility idmin" + this.facilityOptions
              );
              let facilityLength = Object.keys(this.facilityOptions).length;
              // console.log('facility length'+facilityLength);
              // console.log('facility first value'+this.facilityOptions[0].value);
              this.facilityVal = storedFacilityId;
              // console.log('facility first value'+this.facilityOptions[0].label);
              this.faclitylabel = storedFacilityLabel;
              this.handleVisbility();
            });
          }
        });
      })
      .catch((err) => {
        // console.log(err);
      });
    if (this.facilityVal) {
      this.facilityValFalg = false;
    }
  }

  disableRightClick() {
    document.addEventListener("contextmenu", function (e) {
      e.preventDefault();
    });
  }

  disableShortcuts() {
    document.addEventListener("keydown", function (e) {
      // Prevent F12 (Inspect), Ctrl+Shift+I (Inspect), Ctrl+Shift+C (Element picker), and Ctrl+Shift+J (Console)
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.shiftKey && e.key === "C") ||
        (e.ctrlKey && e.shiftKey && e.key === "J") ||
        (e.ctrlKey && e.shiftKey && e.key === "K")
      ) {
        e.preventDefault();
      }
    });
  }

  /*** Navigation ***/
  setStartDate(_startDate) {
    if (_startDate instanceof Date && !isNaN(_startDate)) {
      this.datePickerString = _startDate.toISOString();
     // this.startDate = moment(_startDate).day(1).toDate();
     this.startDate = moment(_startDate).startOf("isoWeek").toDate();//manendra
      this.startDateUTC =
        moment(this.startDate).utc().valueOf() -
        moment(this.startDate).utcOffset() * 60 * 1000 +
        "";
      this.formattedStartDate = this.startDate.toLocaleDateString();

      this.setDateHeaders();
    } else {
      this.dispatchEvent(
        new ShowToastEvent({
          message: "Invalid Date",
          variant: "error"
        })
      );
    }
  }

  setDateHeaders() {
    this.endDate = moment(this.startDate)
      .add(this.view.slots * this.view.slotSize - 1, "days")
      .toDate();
    this.endDateUTC =
      moment(this.endDate).utc().valueOf() -
      moment(this.endDate).utcOffset() * 60 * 1000 +
      "";
    this.formattedEndDate = this.endDate.toLocaleDateString();

    const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    today = today.getTime();

    let dates = {};

    for (
      let date = moment(this.startDate);
      date <= moment(this.endDate);
      date.add(this.view.slotSize, "days")
    ) {
      let index = date.format("YYYYMM");
      if (!dates[index]) {
        dates[index] = {
          dayName: "",
          name: date.format("MMMM"),
          days: []
        };
      }

      let day = {
        class:
          "slds-col slds-p-vertical_x-small slds-m-top_x-small lwc-timeline_day",
        label: date.format("MM/DD/YYYY"),
        label1: date.format("DD"),
        start: date.toDate()
      };
      if (this.view.slotSize > 1) {
        let end = moment(date).add(this.view.slotSize - 1, "days");
        day.end = end.toDate();
      } else {
        day.end = date.toDate();
        day.dayName = date.format("ddd");
        if (date.day() === 0) {
          day.class = day.class + " lwc-is-week-end";
        }
      }

      if (today >= day.start && today <= day.end) {
        day.class += " lwc-is-today";
      }

      dates[index].days.push(day);
      dates[index].style =
        "width: calc(" +
        dates[index].days.length +
        "/" +
        this.view.slots +
        "*100%)";
    }

    // reorder index
    this.dates = Object.values(dates);
    // console.log('dates==>'+JSON.stringify(this.dates));
    // console.log('month length'+this.dates.length);

    // console.log('start date'+this.datePickerString);
    let dateLoad = new Date(this.datePickerString);
    // Extract the year, month, and day
    let year = dateLoad.getFullYear();
    let month = (dateLoad.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-indexed, so add 1
    let day = dateLoad.getDate().toString().padStart(2, "0");

    // Format to yyyy-mm-dd
    let formattedDate = `${year}-${month}-${day}`;
    /* getAlocationData({datePicker :formattedDate,facName: this.faclitylabel}).then(response => { 
      this.allocationList = response;
    });  */
    console.log("for holiday list parameter--->" + formattedDate + this.state);
    if (formattedDate && this.state) {
      holidayList({ datePicker: formattedDate, state: this.state })
        .then((response) => {
          this.holidayList = response;
          console.log("Holiday list:", JSON.stringify(this.holidayList));
          this.updateHolidayDates();
        })
        .catch((error) => {
          console.error("Error fetching holiday list:", error);
        });
    }

    console.log("Updated dates:", JSON.stringify(this.dates));
  }

  updateHolidayDates() {
    const todayDate = new Date().toISOString().split("T")[0];
    this.dates.forEach((month) => {
      month.days.forEach((day) => {
        if (day.start instanceof Date) {
          const formattedDate = day.start.toISOString().split("T")[0]; // Convert Date to YYYY-MM-DD

          // Check if current day is a holiday
          const holiday = this.holidayList.find(
            (h) => h.Date__c === formattedDate
          );

          if (formattedDate === todayDate && holiday) {
            // If today is also a holiday, keep holiday name but prioritize today's color
            day.holidayName = holiday.Holiday_Name__c;
            day.bgColor = "bgColor3"; // Current date color takes priority
          } else if (holiday) {
            // If it's just a holiday, apply holiday color
            day.holidayName = holiday.Holiday_Name__c;
            day.bgColor = "bgColor1";
          } else if (formattedDate === todayDate) {
            // If it's just today, apply current date color
            day.bgColor = "bgColor3";
          } else {
            // Normal day
            day.holidayName = "";
            day.bgColor = "bgColor2";
          }
        } else {
          console.warn("Invalid day.start value:", day.start);
        }
      });
    });

    console.log("Updated dates with holidays:", JSON.stringify(this.dates));
  }

  @track todayCssVariable;
  navigateToToday() {
    var toDayNewDate = new Date();
    var presentday = toDayNewDate.getDate();
    if (presentday < 10) {
      presentday = "0" + presentday;
    }
    var presentMonth = toDayNewDate.getMonth() + 1;
    if (presentMonth < 10) {
      presentMonth = "0" + presentMonth;
    }
    this.todayCssVariable =
      presentday + "/" + presentMonth + "/" + toDayNewDate.getFullYear();
    //console.log('the toDay date '+this.todayCssVariable );
    this.setStartDate(new Date());
    this.handleVisbility();
    /*  console.log('dates in today '+JSON.stringify(this.dates)); */
  }

  navigateToPrevious() {
    let _startDate = new Date(this.datePickerString);
    _startDate.setDate(_startDate.getDate() - this.dateShift);
    this.setStartDate(_startDate);
    this.handleVisbility();
  }

  navigateToNext() {
    let _startDate = new Date(this.datePickerString);
    _startDate.setDate(_startDate.getDate() + this.dateShift);
    this.setStartDate(_startDate);
    this.handleVisbility();
  }

  navigateToDay(event) {
    this.setStartDate(new Date(event.target.value));
    this.handleVisbility();
  }

  setView(value) {
    let values = value.split("/");
    this.view.value = value;
    this.view.slotSize = parseInt(value[0], 10);
    this.view.slots = parseInt(values[1], 10);
  }

  handleViewChange(event) {
    this.setView(event.target.value);
    this.setDateHeaders();
    this.handleVisbility();
  }
  /*** /Navigation ***/

  handleButton(event) {
    let vis = event.target.dataset.name;
  }

  handleSave(event) {
    console.log('handleSave calling');
    this.disableTimeButton = false;
    this.uistarttime = null;
    this.uiendTime = null;
    this.uibreakStartTime = null;
    this.uibreakEndTime = null;
    this.uibreakStartTime2 = null;
    this.uibreakEndTime2 = null;
    this.uibreakStartTime3 = null;
    this.uibreakEndTime3 = null;
    let vis = event.target.dataset.name;
    let facId = event.currentTarget.dataset.id;
    let statusOfIct = "";
    this.showbreak2 = false;
    this.showbreak3 = false;
    if (event.currentTarget.dataset.status) {
      statusOfIct = event.currentTarget.dataset.status;
      // console.log('status Of Ict ==>'+(statusOfIct));
    }
    // console.log('status Of Ict ==>'+(statusOfIct));
    // console.log('fac ic ==>'+facId);
    this.starttime = "";
    this.endTime = "";
    this.breakTime = 0;
    this.whours = 0;
    this.staffData = facId;
    this.sDate = vis;
    this.errorMessage = "";
    this.errorMessageFlag = false;
    this.disableSaveButton = false;
    // console.log("this.sDate final", this.sDate);
    if (
      statusOfIct == "" ||
      statusOfIct == "Rejected" ||
      statusOfIct === "undefined" ||
      statusOfIct === "Draft"
    ) {
      // this.isShowModal = true;
      this.allocationId = ""; // these two changes done by praveen for record edit form
      this.editflag = true;
      this.AllocationHeading = "Enter Timesheet Details";
      this.submitlabel = "Save";
      this.errorMessageFlag = false;
      this.disableSaveButton = false;
      this.breakStartTimePickval = 0;
      this.breakEndTimePickval = 0;
      this.breakStartTime = "";
      this.breakEndTime = "";
      this.breakStartTime2 = "";
      this.breakEndTime2 = "";
      this.breakStartTime3 = "";
      this.breakEndTime3 = "";
      this.breakEndTime3isnull = 0;
      this.startDateTimeForValidation;
      this.endDateTimeForValidation;
      this.breaksdisable = false;
      this.showAddIcon = true;
    } else {
      //this.isShowModal = false;
      this.editflag = false;
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message:
            'Timesheets with the status "Submitted" or "Approved" cannot be edited.',
          variant: "Error"
        })
      );
    }
  }

  @track cloneflag = false;
  handleCloneCheckbox(event) {
    let clonePrevious = event.target.checked;

    if (clonePrevious && this.sDate && this.staffData) {
      this.disableTimeButton = true;
      this.breaksdisable = true;
      this.breakReadonly = true;
      this.clonePreviousDayData();
    } else {
      // ✅ Unchecked: Reset the flags
      this.disableTimeButton = false;
      this.breaksdisable = false;
      this.breakReadonly = false;
    }
  }
  @track breaksdisable = false;
  clonePreviousDayData() {
    let selectedDateObj = new Date(this.sDate);
    let previousDateStr = this.getPreviousWorkday(selectedDateObj);

    console.log("Cloning from previous workday:", previousDateStr);

    /*  let previousDayData = this.finalStaffList.find(staff => {
        return Object.values(staff).includes(previousDateStr);
    }); */
    if (previousDateStr) {
      clonePreviousDayAllocation({
        selectedDate: previousDateStr,
        staffId: this.staffData
      })
        .then((result) => {
          if (result) {
            this.starttime = this.convertMillisecondsToTime(
              result.Start_Date_Time__c
            );
            console.log("START TIME--->" + this.starttime);
            this.endTime = this.convertMillisecondsToTime(
              result.End_Date_Time__c
            );
            this.breakStartTime = this.convertMillisecondsToTime(
              result.Break_Start_Time__c
            );
            this.breakEndTime = this.convertMillisecondsToTime(
              result.Break_End_Time__c
            );
            this.breakStartTime2 = this.convertMillisecondsToTime(
              result.Break_Start_Time2__c
            );
            this.breakEndTime2 = this.convertMillisecondsToTime(
              result.Break_End_Time2__c
            );
            this.breakStartTime3 = this.convertMillisecondsToTime(
              result.Break_Start_Time3__c
            );
            this.breakEndTime3 = this.convertMillisecondsToTime(
              result.Break_End_Time3__c
            );

            this.uistarttime = this.formatTime(result.Start_Date_Time__c);
            if (this.uistarttime) {
              // Split the time and period (e.g., "09:00 AM")
              let [time, period] = this.uistarttime.split(" ");

              // Split hours and minutes
              let [startHour, startMinute] = time.split(":");

              // Store in variables
              this.startTimeSelectedHour = startHour; // e.g., "09"
              this.startTimeSelectedMinute = startMinute; // e.g., "00"
              this.startTimeAMPM = period === "AM" ? "AM" : "PM"; // true if AM, false if PM
            }

            this.uiendTime = this.formatTime(result.End_Date_Time__c);
            if (this.uiendTime) {
              // Split the time and period (e.g., "05:30 PM")
              let [time, period] = this.uiendTime.split(" ");

              // Split hours and minutes
              let [endHour, endMinute] = time.split(":");

              // Store in variables
              this.endTimeSelectedHour = endHour; // e.g., "05"
              this.endTimeSelectedMinute = endMinute; // e.g., "30"
              this.endTimeAMPM = period === "AM" ? "AM" : "PM"; // true if AM, false if PM
            }

            if (this.breakStartTime && this.breakEndTime) {
              this.uibreakStartTime = this.formatTime(
                result.Break_Start_Time__c
              );
              if (this.uibreakStartTime) {
                let [time, period] = this.uibreakStartTime.split(" ");
                let [breakStartHour, breakStartMinute] = time.split(":");

                this.breakStartHour = breakStartHour;
                this.breakStartMinute = breakStartMinute;
                this.breakStartAMPM = period === "AM" ? "AM" : "PM";
              }
              this.uibreakEndTime = this.formatTime(result.Break_End_Time__c);
              if (this.uibreakEndTime) {
                let [time, period] = this.uibreakEndTime.split(" ");
                let [breakEndHour, breakEndMinute] = time.split(":");

                this.breakEndHour = breakEndHour;
                this.breakEndMinute = breakEndMinute;
                this.breakEndAMPM = period === "AM" ? "AM" : "PM";
              }
            } else {
              this.uibreakStartTime = null;
              this.uibreakEndTime = null;
            }

            this.breakTime = result.Break__c;
            this.whours = result.Working_Hours__c;
            if (this.breakStartTime2 && this.breakEndTime2) {
              this.showbreak2 = true;
              this.uibreakStartTime2 = this.formatTime(
                result.Break_Start_Time2__c
              );
              if (this.uibreakStartTime2) {
                let [time, period] = this.uibreakStartTime2.split(" ");
                let [breakStartHour2, breakStartMinute2] = time.split(":");

                this.breakStartHour2 = breakStartHour2;
                this.breakStartMinute2 = breakStartMinute2;
                this.breakStartAMPM2 = period === "AM" ? "AM" : "PM";
              }
              this.uibreakEndTime2 = this.formatTime(result.Break_End_Time2__c);
              if (this.uibreakEndTime2) {
                let [time, period] = this.uibreakEndTime2.split(" ");
                let [breakEndHour2, breakEndMinute2] = time.split(":");

                this.breakEndHour2 = breakEndHour2;
                this.breakEndMinute2 = breakEndMinute2;
                this.breakEndAMPM2 = period === "AM" ? "AM" : "PM";
              }
            }
            if (this.breakStartTime3 && this.breakEndTime3) {
              this.showbreak3 = true;
              this.uibreakStartTime3 = this.formatTime(
                result.Break_Start_Time3__c
              );
              if (this.uibreakStartTime3) {
                let [time, period] = this.uibreakStartTime3.split(" ");
                let [breakStartHour3, breakStartMinute3] = time.split(":");

                this.breakStartHour3 = breakStartHour3;
                this.breakStartMinute3 = breakStartMinute3;
                this.breakStartAMPM3 = period === "AM" ? "AM" : "PM";
              }

              this.uibreakEndTime3 = this.formatTime(result.Break_End_Time3__c);
              if (this.uibreakEndTime3) {
                let [time, period] = this.uibreakEndTime3.split(" ");
                let [breakEndHour3, breakEndMinute3] = time.split(":");

                this.breakEndHour3 = breakEndHour3;
                this.breakEndMinute3 = breakEndMinute3;
                this.breakEndAMPM3 = period === "AM" ? "AM" : "PM";
              }
            }
            console.log("Allocation Retrieved:", JSON.stringify(result));
          } else {
            console.log("No allocation found for the selected date and staff.");
            this.dispatchEvent(
              new ShowToastEvent({
                title: "Error",
                message:
                  "No timesheet from the previous day is available to clone.",
                variant: "Error"
              })
            );
            this.breaksdisable = false;
            this.breakReadonly = false;
          }
        })
        .catch((error) => {
          console.error("Error retrieving allocation:", error);
        });
    }
  }
  formatTime(dateTimeStr) {
    console.log("dateTimeStr >> " + dateTimeStr);

    const totalSeconds = Math.floor(dateTimeStr / 1000);
    const hours24 = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    // Convert to 12-hour format
    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

    const hh = hours12.toString().padStart(2, "0");
    const mm = minutes.toString().padStart(2, "0");

    return `${hh}:${mm} ${period}`;
  }

  // ✅ Function to get the last working day (ignoring weekends)
  getPreviousWorkday(dateObj) {
    let day = dateObj.getDay(); // 0 = Sunday, 6 = Saturday

    if (day === 0 || day === 6) {
      // If Sunday or saturday → return null
      //this.breaksdisable = true;
      this.breaksdisable = false;
      this.breakReadonly = true;
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message: "Cloning is not allowed on Saturdays and Sundays.",
          variant: "error"
        })
      );
      return null;
    } else if (day === 6) {
      // If Saturday → Move to Friday
      dateObj.setDate(dateObj.getDate() - 1);
    } else if (day === 1) {
      dateObj.setDate(dateObj.getDate() - 3);
    } else {
      // Normal case → Move to the previous day
      dateObj.setDate(dateObj.getDate() - 1);
    }

    return dateObj.toISOString().split("T")[0];
  }
  convertMillisecondsToTime(milliseconds) {
    if (milliseconds === null || milliseconds === undefined) return "";

    let date = new Date(milliseconds);
    let hours = date.getUTCHours();
    let minutes = date.getUTCMinutes();

    // Convert hours and minutes to HH:mm format
    let formattedHours = hours.toString().padStart(2, "0");
    let formattedMinutes = minutes.toString().padStart(2, "0");

    return `${formattedHours}:${formattedMinutes}`;
  }
  @track hideFacility = false;
  childevent(event) {
    this.isHome = true;
    this.ictInvoiceFlag = false;
    console.log("hello from child");
    const msg = event.detail.message;
    const hideFacilityValue = event.detail.hideFacility;

    console.log("📩 Message from ict invoice Back:", msg); // "Hello from Child!"
    console.log("📌 Boolean from ict invoice Back:", hideFacilityValue); // false
    this.handleFacilityHide(hideFacilityValue, msg);
  }
  hideFacilityForInvoice(event) {
    console.log("📌 hideFacility  IN PARENT BEFORE:", this.hideFacility);
    const msg = event.detail.message;
    const hideFacilityValue = event.detail.hideFacility;

    console.log("📩 Message from ict invoice:", msg); // "Hello from Child!"
    console.log("📌 Boolean from ict invoice:", hideFacilityValue); // false
    this.handleFacilityHide(hideFacilityValue, msg);
  }
  handleFacilityHide(hideFacilityValue, msg) {
    this.hideFacility = hideFacilityValue;
    console.log("📌 hideFacility :", this.hideFacility);

    const forwardEvent = new CustomEvent("facilitydropdownevent", {
      detail: {
        message: "Hello from ICT Timesheet",
        hideFacility: this.hideFacility
      }
    });

    this.dispatchEvent(forwardEvent);
    console.log("📤 facilitydropdownevent dispatched from parent");
  }

  handlechange(event) {
    if (event.target.name == "startTime") {
      this.starttime = event.target.value;
      console.log("starttime==>" + this.starttime);
    }

    if (event.target.name == "Endtime") {
      this.endTime = event.target.value;
      // console.log('ednd time change');
      console.log("Endtime==>" + this.endTime);
    }

    this.calculateDuration();
    this.breakStartEndDurationCal();
  }
  @track HoursForCalCulation = 0;
  @track errorMessage;
  @track errorMessageFlag = false;
  @track disableSaveButton = false;
  @track startDateTimeForValidation;
  @track endDateTimeForValidation;
  calculateDuration() {
    let startDateChange = new Date();
    let endDateChange = new Date();

    if (this.sDate == undefined) {
      this.sDate = this.dateJson;
    }
    // console.log("start date===>"+this.sDate);
    console.log("start before enter" + this.starttime);
    let Dateparts = this.sDate.split("-");
    let startParts = this.starttime.split(":");

    startDateChange.setDate(parseInt(Dateparts[2], 10));
    startDateChange.setHours(parseInt(startParts[0], 10));
    startDateChange.setMinutes(parseInt(startParts[1], 10));
    this.startDateTimeForValidation = startDateChange;
    console.log("start date" + this.startDateTimeForValidation);

    console.log("end time before enter" + this.endTime);
    let endParts = this.endTime.split(":");
    endDateChange.setDate(parseInt(Dateparts[2], 10));
    endDateChange.setHours(parseInt(endParts[0], 10));
    endDateChange.setMinutes(parseInt(endParts[1], 10));
    this.endDateTimeForValidation = endDateChange;
    console.log("end date" + this.endDateTimeForValidation);
    // console.log('onchange start time'+ (this.spkValue )+' onchange endtime'+this.epkValue);

    let durationInMilliseconds = endDateChange - startDateChange;

    // Convert milliseconds to hours and minutes
    if (this.breakTime == undefined) {
      this.breakTime = this.breakJson;
      // console.log('breaks==>'+this.breakTime)
    }
    let durationInMinutes = durationInMilliseconds / (1000 * 60);
    // console.log("duration in minutes??"+durationInMinutes);
    let hours = (durationInMinutes / 60).toFixed(2);

    this.HoursForCalCulation = hours;
    // console.log("duration in hours"+hours);
    this.breakValueCalculation();
  }

  breakValueCalculation() {
    if (
      !this.breakStartTime &&
      !this.breakEndTime &&
      !this.breakStartTime2 &&
      !this.breakEndTime2 &&
      !this.breakStartTime3 &&
      !this.breakEndTime3
    ) {
      if (this.HoursForCalCulation >= 5) {
        this.breakTime = 30;
        this.breakReadonly = false;
      } else {
        this.breakTime = 0;
        this.breakReadonly = true;
      }
      if (this.breakTime == undefined) {
        this.breakTime = 0;
      }
      let breaks = (this.breakTime / 60).toFixed(2);
      this.whours = this.HoursForCalCulation - breaks;
      // new line added by praveen
      // console.log('durationwith  break '+ this.whours+' break'+  this.breakTime)
      this.breakTime = this.breakTime.toString();
      this.timeErrorValidation();
    } else {
      let totalbreak = (this.breakTime / 60).toFixed(2);
      this.whours = this.HoursForCalCulation - totalbreak;
      //this.whours= this.HoursForCalCulation -this.breakTime;
      this.timeErrorValidation();
    }
  }
  handlecBreakhange(event) {
    if (
      event.target.name === "breaktime" ||
      event.target.name === "breakTimeEdit"
    ) {
      let inputVal = event.target.value.trim(); // Trim spaces

      // Regex: Allows 1-3 digits before decimal, optional decimal with up to 2 digits
      let regex = /^(?:\d{1,3})(?:\.\d{0,2})?$/;

      if (regex.test(inputVal) || inputVal === "") {
        this.breakTime = inputVal; // Allow valid input
        this.errorMessage = ""; // Clear error if valid
        this.errorMessageFlag = false;
        this.disableSaveButton = false; // Enable save button
      } else {
        this.errorMessage =
          "Invalid break. Please enter a number up to 3 digits with a maximum of 2 decimal places.";
        this.errorMessageFlag = true;
        this.disableSaveButton = true; // Disable save button
        return; // Stop execution if invalid
      }

      // Recalculate working hours only if input is valid
      if (this.breakTime !== "") {
        let breaks = (parseFloat(this.breakTime) / 60).toFixed(2);
        this.whours = this.HoursForCalCulation - breaks;
      }
      this.breakTime = this.breakTime.toString();
      this.timeErrorValidation();
    }
  }

  @track breakStartTime;
  @track breakEndTime;
  @track breakStartTime2;
  @track breakEndTime2;
  @track breakStartTime3;
  @track breakEndTime3;

  handleBreakStartEndechange(event) {
    let fieldName = event.target.fieldName;
    let fieldValue = event.target.value;

    console.log("fieldName==> fieldValue" + " " + fieldName + " " + fieldValue);

    // Store break times dynamically
    if (fieldName === "Break_Start_Time__c") {
      this.breakStartTime = fieldValue;
    } else if (fieldName === "Break_End_Time__c") {
      this.breakEndTime = fieldValue;
    } else if (fieldName === "Break_Start_Time2__c") {
      this.breakStartTime2 = fieldValue;
    } else if (fieldName === "Break_End_Time2__c") {
      this.breakEndTime2 = fieldValue;
    } else if (fieldName === "Break_Start_Time3__c") {
      this.breakStartTime3 = fieldValue;
    } else if (fieldName === "Break_End_Time3__c") {
      this.breakEndTime3 = fieldValue;
    }

    if (this.breakStartTime && !this.breakEndTime) {
      this.errorMessage =
        "Break end time is required when break start time is entered.";
      this.errorMessageFlag = true;
      this.disableSaveButton = true;
    } else if (!this.breakStartTime && this.breakEndTime) {
      this.errorMessage =
        "Break start time is required when break end time is entered.";
      this.errorMessageFlag = true;
      this.disableSaveButton = true;
    } else if (!this.breakStartTime2 && this.breakEndTime2) {
      this.errorMessage =
        "Break start time 2 is required when break end time 2 is entered.";
      this.errorMessageFlag = true;
      this.disableSaveButton = true;
    } else if (!this.breakEndTime2 && this.breakStartTime2) {
      this.errorMessage =
        "Break end time 2 is required when break start time 2 is entered.";
      this.errorMessageFlag = true;
      this.disableSaveButton = true;
    } else if (!this.breakEndTime3 && this.breakStartTime3) {
      this.errorMessage =
        "Break end time 3 is required when break start time 3 is entered.";
      this.errorMessageFlag = true;
      this.disableSaveButton = true;
    } else if (!this.breakStartTime3 && this.breakEndTime3) {
      this.errorMessage =
        "Break start time 3 is required when break end time 3 is entered.";
      this.errorMessageFlag = true;
      this.disableSaveButton = true;
    } else {
      // Function to parse time as Date object
      const parseTime = (time) =>
        time ? new Date(`${this.sDate}T${time}`) : null;

      // Convert shift start and end time
      let shiftStart = parseTime(this.starttime);
      let shiftEnd = parseTime(this.endTime);

      let breakTimes = [];

      // Collect and validate break times
      const breaks = [
        { start: this.breakStartTime, end: this.breakEndTime },
        { start: this.breakStartTime2, end: this.breakEndTime2 },
        { start: this.breakStartTime3, end: this.breakEndTime3 }
      ];

      console.log("breaks===>" + JSON.stringify(breaks));

      for (let i = 0; i < breaks.length; i++) {
        let breakStart = parseTime(breaks[i].start);
        let breakEnd = parseTime(breaks[i].end);

        if (breakStart && breakEnd) {
          // Check if break end time is greater than break start time
          if (breakEnd <= breakStart) {
            this.errorMessageFlag = true;
            this.errorMessage =
              "Break end time must be later than break start time.";
            this.disableSaveButton = true;
            console.error(
              "Error: Break End Time must be greater than Break Start Time."
            );
            return;
          }

          // Check if break is within shift time
          if (breakStart < shiftStart || breakEnd > shiftEnd) {
            this.errorMessageFlag = true;
            this.errorMessage =
              "Break time must fall within the start and end times.";
            this.disableSaveButton = true;
            console.error(
              "Error: Break time must be within start and end time."
            );
            return;
          }

          // Check for overlapping breaks
          for (let j = 0; j < breakTimes.length; j++) {
            let prevBreak = breakTimes[j];
            if (
              (breakStart >= prevBreak.start && breakStart < prevBreak.end) || // Overlapping start
              (breakEnd > prevBreak.start && breakEnd <= prevBreak.end) || // Overlapping end
              (breakStart <= prevBreak.start && breakEnd >= prevBreak.end) // Fully contains previous break
            ) {
              this.errorMessageFlag = true;
              this.errorMessage = "Break times must not overlap.";
              this.disableSaveButton = true;
              console.error("Error: Break times should not overlap.");
              return;
            }
          }

          // Add validated break to the list
          breakTimes.push({ start: breakStart, end: breakEnd });
        }
      }

      // Calculate total break minutes
      this.breakTime = breakTimes.reduce((total, breakSlot) => {
        return total + (breakSlot.end - breakSlot.start) / (1000 * 60);
      }, 0);
      let totalbreak = (this.breakTime / 60).toFixed(2);
      this.whours = this.HoursForCalCulation - totalbreak;
      this.breakTime = this.breakTime.toString();
      // Clear error if all validations pass
      this.errorMessageFlag = false;
      this.errorMessage = "";
      this.disableSaveButton = false;
      // Debugging log
      console.log("Total Break Minutes:", this.breakTime);
    }
  }
  @track showbreak2 = false;
  @track showbreak3 = false;

  handleAddDescription() {
    if (!this.showbreak2) {
      this.showbreak2 = true;
    } else if (!this.showbreak3) {
      this.showbreak3 = true;
      this.showAddIcon = false;
    }
  }
  handleDeleteDescription(event) {
    const index = event.target.dataset.index;
    console.log("index===>" + event.target.dataset.index);

    if (index === "2") {
      this.showbreak2 = false;
      this.breakStartTime2 = null;
      this.EndTime2 = 0;
      this.breakEndTime2 = null;
    } else if (index === "3") {
      this.showbreak3 = false;
      this.breakStartTime3 = null;
      this.breakEndTime3 = null;
      this.showAddIcon = true;
    }
    this.handleBreakStartEndechange({ target: { fieldName: "", value: "" } });
  }

  breakStartEndDurationCal() {
    console.log("breakStartEndDurationCal");
    let startDateChange = new Date();
    let endDateChange = new Date();

    console.log(
      " break satrt time value in 24 hours format ==>" +
        this.breakStartTimePickval
    );
    if (this.sDate == undefined) {
      this.sDate = this.dateJson;
    }
    let Dateparts = this.sDate.split("-");
    if (
      this.breakStartTimePickval != null &&
      this.breakStartTimePickval != "undefined"
    ) {
      if (!this.breakStartTimePickval) {
          console.warn('⚠️ breakStartTimePickval is empty');
          return;
      }

      let startParts = this.breakStartTimePickval.split(':');

      startDateChange.setDate(parseInt(Dateparts[2], 10));
      startDateChange.setHours(parseInt(startParts[0], 10));
      startDateChange.setMinutes(parseInt(startParts[1], 10));
    }

    if (
      this.breakEndTimePickval != null &&
      this.breakEndTimePickval != "undefined"
    ) {
      let endParts = this.breakEndTimePickval.split(":");
      endDateChange.setDate(parseInt(Dateparts[2], 10));
      endDateChange.setHours(parseInt(endParts[0], 10));
      endDateChange.setMinutes(parseInt(endParts[1], 10));
    }
 
    if (startDateChange <= this.startDateTimeForValidation) {
      this.errorMessage =
        "Break start time must be later than the shift start time.";
      this.errorMessageFlag = true;
      this.disableSaveButton = true;
    } else if (endDateChange >= this.endDateTimeForValidation) {
      this.errorMessage =
        "Break end time must be earlier than the shift end time.";
      this.errorMessageFlag = true;
      this.disableSaveButton = true;
    } else if (startDateChange > endDateChange) {
      console.log("startDateChange===>" + startDateChange);
      console.log("endDateChange===>" + endDateChange);
      this.errorMessage = "Break end time must be later than break start time.";
      this.errorMessageFlag = true;
      this.disableSaveButton = true;
    } else if (startDateChange >= this.endDateTimeForValidation) {
      this.errorMessage =
        "Break start time must be earlier than the shift end time.";
      this.errorMessageFlag = true;
      this.disableSaveButton = true;
    } else if (endDateChange <= this.startDateTimeForValidation) {
      this.errorMessage =
        "Break end time must be later than the shift start time.";
      this.errorMessageFlag = true;
      this.disableSaveButton = true;
    } else {
      this.errorMessage = "";
      this.errorMessageFlag = false;
      this.disableSaveButton = false;
    }
 

    console.log("endDateChange==>" + endDateChange);
    console.log("startDateChange==>" + startDateChange);
    let durationInMilliseconds = endDateChange - startDateChange;
    console.log("durationInMilliseconds==>" + durationInMilliseconds);

    // console.log("duration in millisec"+durationInMilliseconds);

    let durationInMinutes = durationInMilliseconds / (1000 * 60);
    console.log("durationInMinutes==>" + durationInMinutes);

    let hours = (durationInMinutes / 60).toFixed(2);
    console.log("hours==>" + hours);
    let breakInhours = hours;
    console.log("breakInhours==>" + breakInhours);

    /*  console.log("duration in hours ??"+breakInhours);
         console.log('duration in hours break change '+this.HoursForCalCulation); */
    this.whours = this.HoursForCalCulation - breakInhours;
    console.log("whours==>" + whours);
    this.breakTime = durationInMinutes;
    console.log("breakTime==>" + breakTime);
    this.breakTime = this.breakTime.toString();
    console.log("breakTime==>" + breakTime);
  }

  timeErrorValidation() {
    if (this.whours <= 0) {
      this.errorMessage = "End time must be later than start time.";
      this.errorMessageFlag = true;
      this.disableSaveButton = true;
    } else {
      this.errorMessage = "";
      this.errorMessageFlag = false;
      this.disableSaveButton = false;
    }
  }
 
  isTimePickerSelection = false;
  isManualSaveClick = false;
  handleManualSaveClick() {
    this.isManualSaveClick = true;
    this.cleardata();
  }

  handleSubmit(event) {
    event.preventDefault(); // Always prevent default first

    const activeTag = document.activeElement?.tagName;

    if (!this.isManualSaveClick) {
      console.log("⛔ Submission prevented: likely from time picker.");
      return;
    }

    this.isManualSaveClick = false; // Reset the flag right away
    // ✅ Proceed with normal logic
    console.log("this.starttime: " + this.starttime);
    console.log("this.EndTime: " + this.endTime);

    let starttime = this.formatBreakTime(this.starttime);
    let endtime = this.formatBreakTime(this.endTime);

    event.preventDefault(); // prevent native submission

    if (starttime && endtime) {
      if (this.whours === undefined) {
        this.whours = "8";
      }

      const fields = event.detail.fields;
      fields.End_Date__c = this.sDate;
      fields.Start_Date_Time__c = starttime;
      fields.End_Date_Time__c = endtime;
      fields.Status__c = "Draft";

      fields.Break_Start_Time__c = this.formatBreakTime(this.breakStartTime);
      fields.Break_End_Time__c = this.formatBreakTime(this.breakEndTime);
      fields.Break_Start_Time2__c = this.formatBreakTime(this.breakStartTime2);
      fields.Break_End_Time2__c = this.formatBreakTime(this.breakEndTime2);
      fields.Break_Start_Time3__c = this.formatBreakTime(this.breakStartTime3);
      fields.Break_End_Time3__c = this.formatBreakTime(this.breakEndTime3);
      fields.Break__c = this.breakTime;
      fields.Working_Hours__c = this.whours;

      console.log("After fields>>" + JSON.stringify(fields));

      this.template.querySelector("lightning-record-edit-form").submit(fields);

      this.editflag = false;
      this.showAddIcon = true;
    } else {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Timesheet Rejected",
          message: "Please select Start Time and End Time.",
          variant: "error"
        })
      );
    }
  }

  formatBreakTime(timeValue) {
    if (!timeValue) {
      return null; // Return empty string if null or undefined
    }
    let validFormat = /^\d{2}:\d{2}:\d{2}\.000$/;
    if (validFormat.test(timeValue)) {
      return timeValue; // Return as is if format is correct
    }
    let parts = timeValue.split(":");
    let hours = parts.length > 0 ? parts[0].padStart(2, "0") : "00";
    let minutes = parts.length > 1 ? parts[1].padStart(2, "0") : "00";
    let seconds = parts.length > 2 ? parts[2].padStart(2, "0") : "00";

    return `${hours}:${minutes}:${seconds}.000`; // Ensures only one .000
  }

  hideModalBox() {
    // this.isShowModal = false;
    this.editflag = false;
  }

  handleFacilityChange(event) {
    this.faclitylabel = this.facilityOptions.find(
      (rec) => rec.value == event.detail.value
    ).label;
    let selectedValue = event.detail.value;
    this.facilityVal = selectedValue;
    this.handleVisbility();
  }
  hanldeOpenComment(event) {
    let comments = event.currentTarget.dataset.comments;
    // console.log('comments ===>'+comments);
    this.ictComments = comments;
    this.showCommentPopUp = true;
  }
  handlecloseComments() {
    this.showCommentPopUp = false;
  }

  handleVisbility() {
    // console.log('handle visibility');
    //console.log('check dates start>',JSON.stringify(this.dates[0].days[0].start));
    // console.log('check dates end>',JSON.stringify(this.dates[0].days[6].start));
    this.showSpinner = true;
    let staffList = [];
    let dateList = [];
    var dayValue = "";
    var finalStaffDate = "";
    var staffFinalDate = "";
    var daysValues = [];

    getStaffAllocation({ facId: this.facilityVal }).then((response) => {
      this.records = response;
      if (this.records.length > 0) {
        this.recordsFalg = true;
      } else {
        this.recordsFalg = false;
      }
      console.log("records" + JSON.stringify(this.records));
      staffList = response;
      this.finalStaffData = [];
      this.records.forEach((record) => {
        this.dates.forEach((record1) => {
          var style = record1.style;
          // console.log("style>>>>", style);
          var daysList = record1.days;
          for (var i = 0; i < daysList.length; i++) {
            daysValues.push(moment(daysList[i].label).format("YYYY-MM-DD"));
          }
        });
        for (var j = 0; j < daysValues.length; j++) {
          var dayName = "Day" + j;

          dayValue =
            dayValue +
            '"' +
            dayName +
            '"' +
            ":" +
            '"' +
            daysValues[j] +
            '"' +
            ",";
        }
        var description = "";
        if (
          record.Description__c != null ||
          record.Description__c != undefined
        ) {
          if (
            record.Description__c.search("\n") ||
            record.Description__c.search("\n\r") ||
            record.Description__c.search("\r") ||
            record.Description__c.search("\r\n") ||
            record.Description__c.search("\\")
          ) {
            description = record.Description__c.replaceAll("\n", "\\n")
              .replaceAll("\r", "\\r")
              .replaceAll("\r\n", "\\r\\n");
          } else {
            description = record.Description__c;
          }
        } else {
          description = record.Description__c;
        }

        console.log("698 description >> " + description);
        finalStaffDate =
          '"Id"' +
          ":" +
          '"' +
          record.Id +
          '"' +
          "," +
          '"Name"' +
          ":" +
          '"' +
          record.Name +
          '"' +
          "," +
          '"Last_Name__c"' +
          ":" +
          '"' +
          record.Last_Name__c +
          '"' +
          "," +
          '"email"' +
          ":" +
          '"' +
          record.Email_Address__c +
          '"' +
          "," +
          '"hoursRate"' +
          ":" +
          '"' +
          record.Invoice_Rate__c +
          '"' +
          "," +
          '"role"' +
          ":" +
          '"' +
          record.Role__c +
          '"' +
          "," +
          '"invoiceTo"' +
          ":" +
          '"' +
          record.Invoice_To__c +
          '"' +
          "," +
          '"description"' +
          ":" +
          '"' +
          description +
          '"' +
          "," +
          '"bgcolour1"' +
          ":" +
          '""' +
          "," +
          '"bgcolour2"' +
          ":" +
          '""' +
          "," +
          '"bgcolour3"' +
          ":" +
          '""' +
          "," +
          '"bgcolour4"' +
          ":" +
          '""' +
          "," +
          '"bgcolour5"' +
          ":" +
          '""' +
          "," +
          '"bgcolour6"' +
          ":" +
          '"bgcolor"' +
          "," +
          '"bgcolour7"' +
          ":" +
          '"bgcolor"' +
          "," +
          '"sType1"' +
          ":" +
          '""' +
          "," +
          '"sType2"' +
          ":" +
          '""' +
          "," +
          '"sType3"' +
          ":" +
          '""' +
          "," +
          '"sType4"' +
          ":" +
          '""' +
          "," +
          '"sType5"' +
          ":" +
          '""' +
          "," +
          '"sType6"' +
          ":" +
          '""' +
          "," +
          '"sType7"' +
          ":" +
          '""' +
          "," +
          '"alocId1"' +
          ":" +
          '""' +
          "," +
          '"alocId2"' +
          ":" +
          '""' +
          "," +
          '"alocId3"' +
          ":" +
          '""' +
          "," +
          '"alocId4"' +
          ":" +
          '""' +
          "," +
          '"alocId5"' +
          ":" +
          '""' +
          "," +
          '"alocId6"' +
          ":" +
          '""' +
          "," +
          '"alocId7"' +
          ":" +
          '""' +
          "," +
          '"holiday1"' +
          ":" +
          '""' +
          "," +
          '"holiday2"' +
          ":" +
          '""' +
          "," +
          '"holiday3"' +
          ":" +
          '""' +
          "," +
          '"holiday4"' +
          ":" +
          '""' +
          "," +
          '"holiday5"' +
          ":" +
          '""' +
          "," +
          '"style"' +
          ":" +
          '"style"';
        staffFinalDate = "{" + dayValue + finalStaffDate + "}";
        const jsonRec = JSON.parse(staffFinalDate);
        this.finalStaffData.push(jsonRec);

        // console.log('staff Data '+JSON.stringify(this.finalStaffData));
      });

      let date = new Date(this.datePickerString);

      // Extract the year, month, and day
      let year = date.getFullYear();
      let month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-indexed, so add 1
      let day = date.getDate().toString().padStart(2, "0");

      // Format to yyyy-mm-dd
      let formattedDate = `${year}-${month}-${day}`;
      console.log("formateed date " + formattedDate);

      let datesList = [];
      (this.holidayList || []).forEach((record) => {
        datesList.push({
          label: record.Date__c,
          value: record.Holiday_Name__c
        });
      });

      this.holidayDateList = datesList;
      console.log(
        "this.holidayDateList===>" + JSON.stringify(this.holidayDateList)
      );

      for (var i = 0; i < this.finalStaffData.length; i++) {
        for (var j = 0; j < datesList.length; j++) {
          if (this.finalStaffData[i].Day0 == datesList[j].label) {
            this.finalStaffData[i]["bgcolour1"] = "publicHoliday";
            this.finalStaffData[i]["holiday1"] = datesList[j].value;
          }
          if (this.finalStaffData[i].Day1 == datesList[j].label) {
            this.finalStaffData[i]["bgcolour2"] = "publicHoliday";
            this.finalStaffData[i]["holiday2"] = datesList[j].value;
          }
          if (this.finalStaffData[i].Day2 == datesList[j].label) {
            this.finalStaffData[i]["bgcolour3"] = "publicHoliday";
            this.finalStaffData[i]["holiday3"] = datesList[j].value;
          }
          if (this.finalStaffData[i].Day3 == datesList[j].label) {
            this.finalStaffData[i]["bgcolour4"] = "publicHoliday";
            this.finalStaffData[i]["holiday4"] = datesList[j].value;
          }
          if (this.finalStaffData[i].Day4 == datesList[j].label) {
            this.finalStaffData[i]["bgcolour5"] = "publicHoliday";
            this.finalStaffData[i]["holiday5"] = datesList[j].value;
          }
        }
      }
      console.log("facility name before loop +" + this.faclitylabel);
      getAlocationData({
        datePicker: formattedDate,
        facName: this.faclitylabel
      })
        .then((records) => {
          this.allocationList = records;
          console.log(
            "Allocation before loop==>" + JSON.stringify(this.allocationList)
          );
          // console.log('second for loop with in allocation method '+ this.allocationList.length)

          for (var i = 0; i < this.finalStaffData.length; i++) {
            var hours = 0;
            let ictStatus = "";
            let comments = "";
            let staffAllocaJson = [];
            for (var j = 0; j < this.allocationList.length; j++) {
              if (
                this.finalStaffData[i].Id == this.allocationList[j].Staff__c &&
                this.finalStaffData[i].Day0 ==
                  this.allocationList[j].Start_Date__c
              ) {
                this.finalStaffData[i]["bgcolour1"] = "slds-theme_warning";
                this.finalStaffData[i]["startTime1"] = this.fixTimeRangeFormat(
                  this.allocationList[j].Shift_time_AMPM__c
                );
                this.finalStaffData[i]["hours1"] =
                  this.allocationList[j].Working_Hours__c;
                hours = hours + this.allocationList[j].Working_Hours__c;
                staffAllocaJson.push(this.allocationList[j].Id);
                if (
                  this.allocationList[j].Status_Formula__c &&
                  this.allocationList[j].Status_Formula__c != null
                ) {
                  ictStatus = this.allocationList[j].Status_Formula__c;
                }
                if (
                  this.allocationList[j].Comments__c &&
                  this.allocationList[j].Comments__c != null
                ) {
                  comments = this.allocationList[j].Comments__c;
                }
                this.finalStaffData[i]["alocId1"] = this.allocationList[j].Id;
                this.satffDataJasonformat[this.allocationList[j].Id] = {
                  stringStarttime: this.allocationList[j].Start_Time_Formula__c,
                  StringEndTime: this.allocationList[j].End_Time_Formula__c,
                  breakTime: this.allocationList[j].Break__c,
                  startDate: this.allocationList[j].Start_Date__c,
                  status: this.allocationList[j].Status__c,
                  workingHours: this.allocationList[j].Working_Hours__c,
                  breakStartTime:
                    this.allocationList[j].Break_Start_Time_Formula__c,
                  breakEndTime:
                    this.allocationList[j].Break_End_Time_Formula__c,
                  breakStartTime2:
                    this.allocationList[j].Break_Start_Time2_Formula__c,
                  breakEndTime2:
                    this.allocationList[j].Break_End_Time2_Formula__c,
                  breakStartTime3:
                    this.allocationList[j].Break_Start_Time3_Formula__c,
                  breakEndTime3:
                    this.allocationList[j].Break_End_Time3_Formula__c
                };
              }
              if (
                this.finalStaffData[i].Id == this.allocationList[j].Staff__c &&
                this.finalStaffData[i].Day1 ==
                  this.allocationList[j].Start_Date__c
              ) {
                this.finalStaffData[i]["bgcolour2"] = "slds-theme_warning";
                this.finalStaffData[i]["startTime2"] = this.fixTimeRangeFormat(
                  this.allocationList[j].Shift_time_AMPM__c
                );
                this.finalStaffData[i]["hours2"] =
                  this.allocationList[j].Working_Hours__c;
                staffAllocaJson.push(this.allocationList[j].Id);
                if (
                  this.allocationList[j].Status_Formula__c &&
                  this.allocationList[j].Status_Formula__c != null
                ) {
                  ictStatus = this.allocationList[j].Status_Formula__c;
                }
                if (
                  this.allocationList[j].Comments__c &&
                  this.allocationList[j].Comments__c != null
                ) {
                  comments = this.allocationList[j].Comments__c;
                }
                hours = hours + this.allocationList[j].Working_Hours__c;

                this.satffDataJasonformat[this.allocationList[j].Id] = {
                  stringStarttime: this.allocationList[j].Start_Time_Formula__c,
                  StringEndTime: this.allocationList[j].End_Time_Formula__c,
                  breakTime: this.allocationList[j].Break__c,
                  startDate: this.allocationList[j].Start_Date__c,
                  status: this.allocationList[j].Status__c,
                  workingHours: this.allocationList[j].Working_Hours__c,
                  breakStartTime:
                    this.allocationList[j].Break_Start_Time_Formula__c,
                  breakEndTime:
                    this.allocationList[j].Break_End_Time_Formula__c,
                  breakStartTime2:
                    this.allocationList[j].Break_Start_Time2_Formula__c,
                  breakEndTime2:
                    this.allocationList[j].Break_End_Time2_Formula__c,
                  breakStartTime3:
                    this.allocationList[j].Break_Start_Time3_Formula__c,
                  breakEndTime3:
                    this.allocationList[j].Break_End_Time3_Formula__c
                };
                this.finalStaffData[i]["alocId2"] = this.allocationList[j].Id;
              }
              if (
                this.finalStaffData[i].Id == this.allocationList[j].Staff__c &&
                this.finalStaffData[i].Day2 ==
                  this.allocationList[j].Start_Date__c
              ) {
                this.finalStaffData[i]["bgcolour3"] = "slds-theme_warning";
                this.finalStaffData[i]["startTime3"] = this.fixTimeRangeFormat(
                  this.allocationList[j].Shift_time_AMPM__c
                );
                this.finalStaffData[i]["hours3"] =
                  this.allocationList[j].Working_Hours__c;
                if (
                  this.allocationList[j].Status_Formula__c &&
                  this.allocationList[j].Status_Formula__c != null
                ) {
                  ictStatus = this.allocationList[j].Status_Formula__c;
                }
                if (
                  this.allocationList[j].Comments__c &&
                  this.allocationList[j].Comments__c != null
                ) {
                  comments = this.allocationList[j].Comments__c;
                }
                this.satffDataJasonformat[this.allocationList[j].Id] = {
                  stringStarttime: this.allocationList[j].Start_Time_Formula__c,
                  StringEndTime: this.allocationList[j].End_Time_Formula__c,
                  breakTime: this.allocationList[j].Break__c,
                  startDate: this.allocationList[j].Start_Date__c,
                  status: this.allocationList[j].Status__c,
                  workingHours: this.allocationList[j].Working_Hours__c,
                  breakStartTime:
                    this.allocationList[j].Break_Start_Time_Formula__c,
                  breakEndTime:
                    this.allocationList[j].Break_End_Time_Formula__c,
                  breakStartTime2:
                    this.allocationList[j].Break_Start_Time2_Formula__c,
                  breakEndTime2:
                    this.allocationList[j].Break_End_Time2_Formula__c,
                  breakStartTime3:
                    this.allocationList[j].Break_Start_Time3_Formula__c,
                  breakEndTime3:
                    this.allocationList[j].Break_End_Time3_Formula__c
                };
                hours = hours + this.allocationList[j].Working_Hours__c;
                this.finalStaffData[i]["alocId3"] = this.allocationList[j].Id;
                staffAllocaJson.push(this.allocationList[j].Id);
              }
              if (
                this.finalStaffData[i].Id == this.allocationList[j].Staff__c &&
                this.finalStaffData[i].Day3 ==
                  this.allocationList[j].Start_Date__c
              ) {
                this.finalStaffData[i]["bgcolour4"] = "slds-theme_warning";
                this.finalStaffData[i]["startTime4"] = this.fixTimeRangeFormat(
                  this.allocationList[j].Shift_time_AMPM__c
                );
                this.finalStaffData[i]["hours4"] =
                  this.allocationList[j].Working_Hours__c;
                if (
                  this.allocationList[j].Status_Formula__c &&
                  this.allocationList[j].Status_Formula__c != null
                ) {
                  ictStatus = this.allocationList[j].Status_Formula__c;
                }
                if (
                  this.allocationList[j].Comments__c &&
                  this.allocationList[j].Comments__c != null
                ) {
                  comments = this.allocationList[j].Comments__c;
                }
                this.satffDataJasonformat[this.allocationList[j].Id] = {
                  stringStarttime: this.allocationList[j].Start_Time_Formula__c,
                  StringEndTime: this.allocationList[j].End_Time_Formula__c,
                  breakTime: this.allocationList[j].Break__c,
                  startDate: this.allocationList[j].Start_Date__c,
                  status: this.allocationList[j].Status__c,
                  workingHours: this.allocationList[j].Working_Hours__c,
                  breakStartTime:
                    this.allocationList[j].Break_Start_Time_Formula__c,
                  breakEndTime:
                    this.allocationList[j].Break_End_Time_Formula__c,
                  breakStartTime2:
                    this.allocationList[j].Break_Start_Time2_Formula__c,
                  breakEndTime2:
                    this.allocationList[j].Break_End_Time2_Formula__c,
                  breakStartTime3:
                    this.allocationList[j].Break_Start_Time3_Formula__c,
                  breakEndTime3:
                    this.allocationList[j].Break_End_Time3_Formula__c
                };
                hours = hours + this.allocationList[j].Working_Hours__c;
                staffAllocaJson.push(this.allocationList[j].Id);
                this.finalStaffData[i]["alocId4"] = this.allocationList[j].Id;
              }
              if (
                this.finalStaffData[i].Id == this.allocationList[j].Staff__c &&
                this.finalStaffData[i].Day4 ==
                  this.allocationList[j].Start_Date__c
              ) {
                this.finalStaffData[i]["bgcolour5"] = "slds-theme_warning";
                this.finalStaffData[i]["startTime5"] = this.fixTimeRangeFormat(
                  this.allocationList[j].Shift_time_AMPM__c
                );
                this.finalStaffData[i]["hours5"] =
                  this.allocationList[j].Working_Hours__c;
                if (
                  this.allocationList[j].Status_Formula__c &&
                  this.allocationList[j].Status_Formula__c != null
                ) {
                  ictStatus = this.allocationList[j].Status_Formula__c;
                }
                if (
                  this.allocationList[j].Comments__c &&
                  this.allocationList[j].Comments__c != null
                ) {
                  comments = this.allocationList[j].Comments__c;
                }
                this.satffDataJasonformat[this.allocationList[j].Id] = {
                  stringStarttime: this.allocationList[j].Start_Time_Formula__c,
                  StringEndTime: this.allocationList[j].End_Time_Formula__c,
                  breakTime: this.allocationList[j].Break__c,
                  startDate: this.allocationList[j].Start_Date__c,
                  status: this.allocationList[j].Status__c,
                  workingHours: this.allocationList[j].Working_Hours__c,
                  breakStartTime:
                    this.allocationList[j].Break_Start_Time_Formula__c,
                  breakEndTime:
                    this.allocationList[j].Break_End_Time_Formula__c,
                  breakStartTime2:
                    this.allocationList[j].Break_Start_Time2_Formula__c,
                  breakEndTime2:
                    this.allocationList[j].Break_End_Time2_Formula__c,
                  breakStartTime3:
                    this.allocationList[j].Break_Start_Time3_Formula__c,
                  breakEndTime3:
                    this.allocationList[j].Break_End_Time3_Formula__c
                };
                hours = hours + this.allocationList[j].Working_Hours__c;
                staffAllocaJson.push(this.allocationList[j].Id);
                this.finalStaffData[i]["alocId5"] = this.allocationList[j].Id;
              }
              if (
                this.finalStaffData[i].Id == this.allocationList[j].Staff__c &&
                this.finalStaffData[i].Day5 ==
                  this.allocationList[j].Start_Date__c
              ) {
                this.finalStaffData[i]["bgcolour6"] = "slds-theme_warning";
                this.finalStaffData[i]["startTime6"] = this.fixTimeRangeFormat(
                  this.allocationList[j].Shift_time_AMPM__c
                );
                this.finalStaffData[i]["hours6"] =
                  this.allocationList[j].Working_Hours__c;
                if (
                  this.allocationList[j].Status_Formula__c &&
                  this.allocationList[j].Status_Formula__c != null
                ) {
                  ictStatus = this.allocationList[j].Status_Formula__c;
                }
                if (
                  this.allocationList[j].Comments__c &&
                  this.allocationList[j].Comments__c != null
                ) {
                  comments = this.allocationList[j].Comments__c;
                }
                this.satffDataJasonformat[this.allocationList[j].Id] = {
                  stringStarttime: this.allocationList[j].Start_Time_Formula__c,
                  StringEndTime: this.allocationList[j].End_Time_Formula__c,
                  breakTime: this.allocationList[j].Break__c,
                  startDate: this.allocationList[j].Start_Date__c,
                  status: this.allocationList[j].Status__c,
                  workingHours: this.allocationList[j].Working_Hours__c,
                  breakStartTime:
                    this.allocationList[j].Break_Start_Time_Formula__c,
                  breakEndTime:
                    this.allocationList[j].Break_End_Time_Formula__c,
                  breakStartTime2:
                    this.allocationList[j].Break_Start_Time2_Formula__c,
                  breakEndTime2:
                    this.allocationList[j].Break_End_Time2_Formula__c,
                  breakStartTime3:
                    this.allocationList[j].Break_Start_Time3_Formula__c,
                  breakEndTime3:
                    this.allocationList[j].Break_End_Time3_Formula__c
                };
                hours = hours + this.allocationList[j].Working_Hours__c;
                staffAllocaJson.push(this.allocationList[j].Id);
                this.finalStaffData[i]["alocId6"] = this.allocationList[j].Id;
              }
              if (
                this.finalStaffData[i].Id == this.allocationList[j].Staff__c &&
                this.finalStaffData[i].Day6 ==
                  this.allocationList[j].Start_Date__c
              ) {
                this.finalStaffData[i]["bgcolour7"] = "slds-theme_warning";
                this.finalStaffData[i]["startTime7"] = this.fixTimeRangeFormat(
                  this.allocationList[j].Shift_time_AMPM__c
                );
                this.finalStaffData[i]["hours7"] =
                  this.allocationList[j].Working_Hours__c;
                if (
                  this.allocationList[j].Status_Formula__c &&
                  this.allocationList[j].Status_Formula__c != null
                ) {
                  ictStatus = this.allocationList[j].Status_Formula__c;
                }
                if (
                  this.allocationList[j].Comments__c &&
                  this.allocationList[j].Comments__c != null
                ) {
                  comments = this.allocationList[j].Comments__c;
                }
                this.satffDataJasonformat[this.allocationList[j].Id] = {
                  stringStarttime: this.allocationList[j].Start_Time_Formula__c,
                  StringEndTime: this.allocationList[j].End_Time_Formula__c,
                  breakTime: this.allocationList[j].Break__c,
                  startDate: this.allocationList[j].Start_Date__c,
                  status: this.allocationList[j].Status__c,
                  workingHours: this.allocationList[j].Working_Hours__c,
                  breakStartTime:
                    this.allocationList[j].Break_Start_Time_Formula__c,
                  breakEndTime:
                    this.allocationList[j].Break_End_Time_Formula__c,
                  breakStartTime2:
                    this.allocationList[j].Break_Start_Time2_Formula__c,
                  breakEndTime2:
                    this.allocationList[j].Break_End_Time2_Formula__c,
                  breakStartTime3:
                    this.allocationList[j].Break_Start_Time3_Formula__c,
                  breakEndTime3:
                    this.allocationList[j].Break_End_Time3_Formula__c
                };
                hours = hours + this.allocationList[j].Working_Hours__c;
                staffAllocaJson.push(this.allocationList[j].Id);
                this.finalStaffData[i]["alocId7"] = this.allocationList[j].Id;
              }
              this.finalStaffData[i]["totalHOurs"] = parseFloat(
                hours.toFixed(2)
              );
              this.hoursInUIPage = this.finalStaffData[i]["totalHOurs"];
              this.finalStaffData[i]["StaffAllocJson"] = staffAllocaJson;

              if (ictStatus == null) {
                this.finalStaffData[i]["ictStatus"] = "";
              } else {
                this.finalStaffData[i]["ictStatus"] = ictStatus;
              }
              if (comments == null) {
                this.finalStaffData[i]["comments"] = "";
              } else {
                this.finalStaffData[i]["comments"] = comments;
              }

              if (ictStatus == "Rejected") {
                this.finalStaffData[i]["openComments"] = true;
              } else {
                this.finalStaffData[i]["openComments"] = false;
              }
              if (
                this.finalStaffData[i]["ictStatus"] == "Rejected" ||
                this.finalStaffData[i]["ictStatus"] == "" ||
                this.finalStaffData[i]["ictStatus"] == "Draft"
              ) {
                this.finalStaffData[i]["isSubmitButton"] = false;
              } else {
                this.finalStaffData[i]["isSubmitButton"] = true;
              }

              if (this.finalStaffData[i]["ictStatus"] == "Approved") {
                this.finalStaffData[i]["isediticon"] = true;
              } else {
                this.finalStaffData[i]["isediticon"] = false;
              }
            }
          }
          console.log(
            "staff AFTER loop==>" + JSON.stringify(this.finalStaffData)
          );
          console.log(
            "staffdata jason format" + JSON.stringify(this.satffDataJasonformat)
          );
/*           this.paginationRecords = this.finalStaffData;
          this.totalRecords = this.finalStaffData.length;
          this.pageSize = this.pageSizeOptions[0];
          this.pageNumber = 1;
          this.paginationHelper(); *///manendra commented on 20-06-2024 for pagination issue after allocation
          this.paginationRecords = [...this.finalStaffData];
if (this.searchName && this.searchName.trim() !== "") {
  this.filteredRecords = this.paginationRecords.filter(
    (staff) =>
      (staff.Name &&
        staff.Name.toLowerCase().includes(this.searchName)) ||
      (staff.Last_Name__c &&
        staff.Last_Name__c.toLowerCase().includes(this.searchName))
  );
} else {
  this.filteredRecords = [...this.paginationRecords];
}

this.totalRecords = this.filteredRecords.length;
this.pageSize = this.pageSizeOptions[0];
this.pageNumber = 1;

this.paginationHelper();
        })
        .catch((error) => {
          // console.log('error '+error);
        });
    });
    this.showSpinner = false;
    refreshApex(this.finalStaffData);
  }

  fixTimeRangeFormat(timeRangeStr) {
      console.log("🔄 [fixTimeRangeFormat] START");
      console.log("📥 Input:", timeRangeStr);

      if (!timeRangeStr) {
          console.warn("⚠️ No timeRangeStr provided, returning empty string");
          return "";
      }

      const [start, end] = timeRangeStr.split("-").map((s) => s.trim());
      console.log("⏱️ Parsed start:", start, "| end:", end);

      const fixTime = (timeStr) => {
          console.log("➡️ [fixTime] Input:", timeStr);

          const [timePart, ampmRaw] = timeStr.split(" ");
          console.log("⏳ timePart:", timePart, "| ampmRaw:", ampmRaw);

          if (!timePart || !ampmRaw) {
              console.warn("⚠️ Invalid time string, returning as-is:", timeStr);
              return timeStr;
          }

          const ampm = ampmRaw.toUpperCase();
          let [hour, minute] = timePart.split(":");

          console.log("⌛ Before fix — hour:", hour, "| minute:", minute, "| ampm:", ampm);

          if (hour === "0" || hour === "00") {
              console.log("🔧 Converting 0/00 hour to 12");
              hour = "12";
          }

          const fixed = `${hour}:${minute} ${ampm}`;
          console.log("✅ Fixed time:", fixed);
          return fixed;
      };

      const fixedStart = fixTime(start);
      const fixedEnd = fixTime(end);
      const result = `${fixedStart} - ${fixedEnd}`;

      console.log("🎯 Final formatted result:", result);
      console.log("🏁 [fixTimeRangeFormat] END");

      return result;
  }
 

  @track totalHoursJson;
  handleEdit(event) {
    this.showbreak2 = false;
    this.showbreak3 = false;
    let alocId = event.currentTarget.dataset.id;

    this.allocationId = alocId;
    this.staffData = event.currentTarget.dataset.staff;
    // console.log('staff id '+this.staffData);
    console.log("alocId===>" + alocId);
    console.log(
      "StaffJsonForamt in edit  " +
        JSON.stringify(this.satffDataJasonformat[alocId])
    );
    this.startTimeJSOn = this.satffDataJasonformat[alocId]["stringStarttime"];

    this.EndTimeJSOn = this.satffDataJasonformat[alocId]["StringEndTime"];
    if (this.satffDataJasonformat[alocId]["breakStartTime"]) {
      this.breakStartTimePickval =
        this.convertTo24Hour(
          this.satffDataJasonformat[alocId]["breakStartTime"]
        ) + ".000Z";
    }
    if (this.satffDataJasonformat[alocId]["breakEndTime"]) {
      this.breakEndTimePickval =
        this.convertTo24Hour(
          this.satffDataJasonformat[alocId]["breakEndTime"]
        ) + ".000Z";
    }
    if (
      this.satffDataJasonformat[alocId]["breakStartTime2"] &&
      this.satffDataJasonformat[alocId]["breakEndTime2"]
    ) {
      this.showbreak2 = true;
    }
    if (
      this.satffDataJasonformat[alocId]["breakStartTime3"] &&
      this.satffDataJasonformat[alocId]["breakEndTime3"]
    ) {
      this.showbreak3 = true;
    }

    console.log("  in edit ");
    console.log(" break start time  in edit " + this.breakStartTimePickval);
    console.log(" break end time in edit " + this.breakEndTimePickval);

    this.dateJson = this.satffDataJasonformat[alocId]["startDate"];
    this.breakJson = this.satffDataJasonformat[alocId]["breakTime"];
    this.totalHoursJson = this.satffDataJasonformat[alocId]["workingHours"];
    this.HoursForCalCulation = this.totalHoursJson;
    console.log("duration in hours edit  " + this.HoursForCalCulation);
    this.starttime = this.convertTo24Hour(this.startTimeJSOn) + ".000";
    this.endTime = this.convertTo24Hour(this.EndTimeJSOn) + ".000";

    this.breakTime = this.breakJson;
    this.sDate = this.dateJson;
    this.whours = this.totalHoursJson;

    let allocationStatus = this.satffDataJasonformat[alocId]["status"];
    if (this.satffDataJasonformat[alocId]["workingHours"] >= 5) {
      this.breakReadonly = false;
    } else {
      this.breakReadonly = true;
    }

    if (allocationStatus == "Draft" || allocationStatus == "Rejected") {
      let buttonName = event.target.name;
      if (buttonName == "delete") {
        deleteRecord(alocId).then(() => {
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Success",
              message: "Allocation is deleted successfully.",
              variant: "success"
            })
          );
          this.handleVisbility();
        });
      } else {
        this.editflag = true;
        this.AllocationHeading = "Edit Timesheet Details";
        this.submitlabel = "Update";
        this.errorMessageFlag = false;
        this.disableSaveButton = false;
        this.showAddIcon = true;
      }
    } else {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message:
            'Timesheets with the status "Submitted" or "Approved" cannot be edited.',
          variant: "Error"
        })
      );
    }
  }

  convertTo24Hour(time12h) {
    const [time, modifier] = time12h.split(" ");
    let [hours, minutes] = time.split(":");

    if (hours === "12" || hours === "0") {
      hours = "00";
    }

    if (modifier === "PM") {
      hours = parseInt(hours, 10) + 12;
    }
    if (hours < 10 && hours != 0) {
      hours = "0" + hours;
    }

    return `${hours}:${minutes}`;
  }

  handleeditClose() {
    this.editflag = false;
    this.cleardata();
  }

  handleeditAllocation() {
    const toastEvent = new ShowToastEvent({
      title: "Success",
      message: "Changes saved successfully.",
      variant: "success"
    });
    this.dispatchEvent(toastEvent);
    this.handleVisbility();
    this.editflag = false;
    this.showAddIcon1 = true;
    this.handleeditClose1();
    this.deleterow = "";
    this.breakStartTime = "";
     this.breakEndTime= "";
      this.breakStartTime2= "";
     this.breakEndTime2= "";
      this.breakStartTime3= "";
      this.breakEndTime3= "";
  }
  handleclonealert(event) {
    this.cloneflag = true;
  }
  handlecloneclose(event) {
    this.cloneflag = false;
  }

  handleClone(event) {
    let staffAllocation = [];
    if (this.facilityVal === undefined) {
      const event = new ShowToastEvent({
        title: "",
        message: "Please select a facility.",
        variant: "warning",
        mode: "dismissable"
      });
      this.dispatchEvent(event);
    }

    if (this.facilityVal != undefined) {
      updateAllocationRecoreds({
        facilityId: this.facilityVal,
        startDate: this.startDate
      }).then((response) => {
        const event = new ShowToastEvent({
          title: "",
          message: "Allocations clone for this facility.",
          variant: "success",
          mode: "dismissable"
        });
        this.dispatchEvent(event);
        this.handleVisbility();
      });
    }
    this.cloneflag = false;
  }

  navigatetoHome() {
    this[NavigationMixin.Navigate]({
      type: "comm__namedPage",
      attributes: {
        //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
        pageName: "home"
      }
    });
  }
  @track submissionFlag = false;
  @track confirmationData = {};

  handleSubmission(event) {
    // console.log('month length'+this.dates.length);
    // console.log('check dates start>',JSON.stringify(this.dates[0].days[0].start));
    // console.log('check dates end>',JSON.stringify(this.dates[1].days[3].start));
    let dateStarts = this.dates[0].days[0].start;
    let dateEnds;
    if (this.dates.length == 2) {
      // console.log('second month length==>'+(this.dates[1].days).length);
      let lastElement = this.dates[1].days.length - 1;
      dateEnds = this.dates[1].days[lastElement].start;
    } else {
      dateEnds = this.dates[0].days[6].start;
    }
    // console.log('weekStartdate'+dateStarts);
    // console.log('weekenddate'+dateEnds);

    // console.log(JSON.stringify(this.finalStaffData));
    let stfid = event.currentTarget.dataset.staffid;
    let allocId = [];

    const allocarray = event.currentTarget.dataset.allocid.split(",");
    for (var s = 0; s < allocarray.length; s++) {
      allocId.push(allocarray[s]);
    }
    // console.log(allocId);
    // console.log('allocid from staff>',JSON.stringify(this.finalStaffData[0]['StaffAllocJson']));
    let totalhours = event.currentTarget.dataset.totalhours;
    if (totalhours == 0) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Submission Rejected",
          message: "Please create a timesheet.",
          variant: "Error"
        })
      );
    } else {
      this.submissionFlag = true;
      this.confirmationData = {
        totalhours,
        dateStarts,
        dateEnds,
        allocId,
        stfid
      };
    }
  }

  handletimesheetsubmit(event) {
    const { dateStarts, dateEnds, allocId, totalhours, stfid } =
      this.confirmationData;

    createTimeSheet({
      WeekStartDate: dateStarts,
      WeekendDate: dateEnds,
      allocationIds: allocId,
      duration: totalhours,
      staffId: stfid
    }).then((response) => {
      // console.log('ict status after submission ');
      const event = new ShowToastEvent({
        title: "",
        message: "Timesheet submitted successfully.",
        variant: "success",
        mode: "dismissable"
      });
      this.handleVisbility();
      this.dispatchEvent(event);
    });
    refreshApex(this.finalStaffData);
    this.submissionFlag = false;
  }
  handlesubmissionclose(event) {
    this.submissionFlag = false;
  }
  handleStatusChange(event) {
    let dateStarts = this.dates[0].days[0].start;
    let stfid = event.currentTarget.dataset.staffid;
    let dateEnds;
    if (this.dates.length == 2) {
      // console.log('second month length==>'+(this.dates[1].days).length);
      let lastElement = this.dates[1].days.length - 1;
      dateEnds = this.dates[1].days[lastElement].start;
    } else {
      dateEnds = this.dates[0].days[6].start;
    }
    console.log("start date" + dateStarts);
    console.log("end date" + dateEnds);
    console.log("staffid" + stfid);
    updateTimeSheets({
      WeekStartDate: dateStarts,
      WeekendDate: dateEnds,
      staffId: stfid
    })
      .then(() => {
        this.showToast(
          "Success",
          "Timesheets updated successfully.",
          "success"
        );
      })
      .catch((error) => {
        console.error("Error updating timesheets:", error);
        this.showToast(
          "Error",
          error.body ? error.body.message : error.message,
          "error"
        );
      });
  }

  showToast(title, message, variant) {
    const event = new ShowToastEvent({
      title,
      message,
      variant
    });
    this.dispatchEvent(event);
    this.handleVisbility();
  }

  @track invoiceRate;
  @track invoiceStartDate;
  @track invoiceEndDate;
  @track invParentId;
  @track invoiceFileName;
  @track invRecords;
  @track ictStaffID;
  @track ictInvoiceList;
  @track staffFullname;
  @track staffRole;
  @track ictApprovedHours = 0;
  @track tempConRec = {};
  @track descrValue;
  @track quantityValue;
  @track unitPrice = 0;
  @track invoiceTo;
  @track description;
  @track isModalOpen = false;
  @track currentUrl;
  @track invoiceNo;
  @track ledgerItems = [];

  generateICTInvoice(event) {
    this.invoiceRate = event.currentTarget.dataset.invrate;
    this.unitPrice = event.currentTarget.dataset.invrate;
    this.invoiceTo = event.currentTarget.dataset.invoiceto;
    this.description = event.currentTarget.dataset.description;
    console.log("this.description : " + this.description);
    this.descrValue = this.description;
    //this.ictInvoiceList=[];
    this.invoiceEndDate = "";
    this.invoiceStartDate = "";
    this.ictApprovedHours = 0;
    this.quantityValue = 0;
    this.invoiceTable = [];
    this.dateIssued = "";
    if (
      parseFloat(this.invoiceRate) > 0 &&
      this.invoiceTo != "undefined" &&
      this.descrValue != "undefined"
    ) {
      // this.showICtinvoice= true;
      this.ictInvoiceFlag = true;
      this.ictStaffID = event.currentTarget.dataset.staffid;
      let fname = event.currentTarget.dataset.firstname;
      let lname = event.currentTarget.dataset.lastname;
      this.staffFullname = fname + " " + lname;
      this.staffRole = event.currentTarget.dataset.role;
      let accountRecList = [];
      this.accountRecList = accountRecList;
      if (
        this.unitPrice == undefined ||
        this.unitPrice == null ||
        this.unitPrice == ""
      ) {
        this.unitPrice = 0.0;
      }
      this.isHome = false;
    } else {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message: "Provide staff, invoice details, and add a description.",
          variant: "Error"
        })
      );
    }
  }
  changeHandler(event) {
    if (event.target.name == "StartDate") {
      this.invoiceStartDate = event.target.value;
    }
    if (event.target.name == "EndDate") {
      this.invoiceEndDate = event.target.value;
    }
    if (event.target.name == "dateIssued") {
      this.dateIssued = event.target.value;
    }
    if (event.target.name == "selectOption") {
      // console.log('Selected value '+event.target.value);
      this.selectedGSTValue = event.target.value;
    }
    if (event.target.name == "attachApproval") {
      this.attachApproval = event.target.value;
      // console.log('Selected value '+ event.target.value);
    }
    if (
      this.invoiceStartDate != undefined &&
      this.invoiceEndDate != undefined
    ) {
      // console.log('start date '+this.invoiceStartDate);
      // console.log('end date '+  this.invoiceEndDate );
      // console.log('staff id '+  this.ictStaffID );

      getIctList({
        staffId: this.ictStaffID,
        StartDate: this.invoiceStartDate,
        endDate: this.invoiceEndDate
      })
        .then((result) => {
          // console.log('ict  time records list'+JSON.stringify(result));
          this.ictInvoiceList = result;
          let approveHours = 0;
          result.forEach((ictrec) => {
            let ChildAllocationList = ictrec.Allocations__r;
            ChildAllocationList.forEach((allocrec) => {
              if (allocrec.Working_Hours__c) {
                approveHours += allocrec.Working_Hours__c;
              }
            });
          });

          /*   result.forEach(ictRec=>{
          approveHours +=ictRec.Total_Duration__c;
        }) */
          // console.log('Approved hours'+approveHours);
          this.ictApprovedHours = approveHours;
          this.quantityValue = approveHours;
        })
        .catch((error) => {
          // console.log('error '+JSON.stringify(error));
        });
      this.fetchInvoices();
    }
  }
  fetchInvoices() {
    // console.log('staff id'+this.ictStaffID);
    listofInvoicesParent({
      sDate: this.invoiceStartDate,
      eDate: this.invoiceEndDate,
      staffID: this.ictStaffID
    })
      .then((response) => {
        console.log("invoice record list" + JSON.stringify(response));
        this.invoiceTable = response.map((assign) => ({
          ...assign,
          Startdate: assign.Start_Date__c
            ? new Date(assign.Start_Date__c).toLocaleDateString("en-GB")
            : "",
          Enddate: assign.End_Date__c
            ? new Date(assign.End_Date__c).toLocaleDateString("en-GB")
            : "",
          Issueddate: assign.Date_Issued__c
            ? new Date(assign.Date_Issued__c).toLocaleDateString("en-GB")
            : ""
        }));
      })
      .catch((error) => {
        // console.log('error in invoices '+JSON.stringify(error));
      });
  }

  //   handleInputChange(event) {

  //     if(event.target.name =='Description'){
  //       this.descrValue = event.target.value;
  //     }
  //     if(event.target.name =='Quantity'){
  //       this.quantityValue = event.target.value;
  //     }
  //     if(event.target.name =='UnitPrice'){
  //       this.unitPrice = event.target.value;
  //     }
  // }

  handleInputChange(event) {
    const rowId = event.target.dataset.id;
    const field = event.target.dataset.field;
    const value = event.target.value;

    this.invoiceRowList = this.invoiceRowList.map((row) => {
      if (row.Id === rowId) {
        return { ...row, [field]: value };
      }
      return row;
    });
  }

  handleRowAction(event) {
    const actionName = event.target.name;
    const row = event.currentTarget.dataset.id;
    const url = event.currentTarget.dataset.url;
    console.log("row id" + row.Id);
    switch (actionName) {
      case "delete":
        this.invoiceDeleteFlag = true;
        this.invoiceIdToDelete = row;
        console.log("row id" + this.invoiceIdToDelete);
        break;
      case "view_details":
        event.preventDefault();
        this.invoiceDeleteFlag = false;
        //const url = row.Amazon_URL__c;
        this.currentUrl = url;
        this.isHome = false;
        this.showICtinvoice = true;
        // console.log('file url  '+ this.currentUrl);
        this.isModalOpen = true;
        break;
    }
  }
  handledelete(event) {
    deleteRecord(this.invoiceIdToDelete)
      .then(() => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: "Invoice deleted successfully.",
            variant: "success"
          })
        );
        this.fetchInvoices();
        refreshApex(this.invoiceTable);
      })
      .catch((error) => {
        // console.log('error=>'+JSON.stringify(error));
      });
    this.invoiceDeleteFlag = false;
  }
  handledeleteclose(event) {
    this.invoiceDeleteFlag = false;
  }

  closeModal() {
    this.isModalOpen = false;
    this.currentUrl = null;
    this.isHome = true;
  }
  closeviewfile(event) {
    this.showICtinvoice = true;
    this.isModalOpen = false;
    this.currentUrl = null;
    this.isHome = true;
  }

  generatePDF() {
    // console.log('document1 ', this.orgname);  +

    const { jsPDF } = window.jspdf;
    var doc = new jsPDF();
    var statePostalWithoutCommas = this.statePostal.replace(/,/g, " ");

    // added for image and organization details
    //doc.addImage(this.orgLogo, "PNG", 120, 25, 70, 18);

    //doc.setDrawColor(0);  // Black border
    //doc.setFillColor(255); // White fill
    //doc.roundedRect(20, 230, 90, 50, 3, 3, 'FD'); // Box end---maheswari

    doc.setFont("Roboto-Bold", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 102, 255);
    doc.text(this.orgname.toUpperCase(), 10, 25);

    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto-Bold", "bold");
    //doc.setFont("Arial", "");
    doc.setFontSize(12);
    doc.text("ABN: " + this.abn, 10, 30);

    //doc.setDrawColor(229,229,229);
    //doc.setFillColor(229, 229, 229);
    //doc.rect(125, 27, 75, 30,"FD");

    doc.setFont("Roboto-Bold", "bold");
    doc.setFontSize(12);
    doc.text("TAX  INVOICE", 134, 25); // 120, 42
    //doc.text("Payable to : ", 25, 237);  /* Adjust hieht of the text --Maheswari */

    doc.setFont("Roboto-Bold", "bold");
    doc.setFontSize(12);
    doc.text(this.invRecords[0].Invoice_Parent__r.Name, 134, 30); //120, 53

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.setFontSize(10);
    doc.text(this.address + ",", 10, 35);
    doc.text(statePostalWithoutCommas + ",", 10, 40);
    doc.text("Contact: " + this.contactNo, 10, 45);

    const oldDate = this.invRecords[0].Invoice_Parent__r.Date_Issued__c;
    const arr = oldDate.split("-");
    const newDate = arr[2] + "/" + arr[1] + "/" + arr[0];

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.setFontSize(10);
    doc.text("Date Issued: " + newDate, 134, 35); //120,58

    const oldsDate = this.invRecords[0].Invoice_Parent__r.Start_Date__c;
    const sarr = oldsDate.split("-");
    const newsDate = sarr[2] + "/" + sarr[1] + "/" + sarr[0];

    const oldeDate = this.invRecords[0].Invoice_Parent__r.End_Date__c;
    const earr = oldeDate.split("-");
    const neweDate = earr[2] + "/" + earr[1] + "/" + earr[0];

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.setFontSize(10);
    doc.text("For the Period: " + newsDate + " to " + neweDate, 134, 40); //120, 63

    doc.setFontSize(10);
    doc.text(
      "TAX INVOICE To: " +
        this.invRecords[0].Invoice_Parent__r.Staff__r.Invoice_To__c,
      10,
      72
    );
    //doc.text(this.invRecords[0].Invoice_Parent__r.Staff__r.Invoice_To__c, 20, 89);

    doc.setDrawColor(0);
    doc.setFillColor(255, 255, 255);
    /*  doc.roundedRect(20, 220, 70, 28, 0, 0, 'FD');  */

    //doc.setDrawColor(0);  // Black border
    //doc.setFillColor(255); // White fill
    //doc.roundedRect(20, 220, 70, 30, 3, 3, 'FD'); // Box end---maheswari  20, 220, 90, 50, 3, 3, 'FD'
    doc.setDrawColor(0, 0, 0); // Black color
    doc.setLineWidth(0.5);
    doc.setLineDash([1, 1]); // Dotted line pattern (2px dash, 2px gap)
    doc.line(10, 222, 200, 222); // (startX, startY, endX, endY)
    doc.setLineDash();
    doc.setFontSize(10);
    doc.setFont("Roboto-Bold", "bold");
    doc.text("Payable to", 10, 226); // Text before the variable

    doc.setFont("Roboto-Bold", "bold");
    doc.text("Bank", 10, 232);
    doc.text(":", 40, 232); // Text before the variable
    doc.setFont("Roboto-VariableFont_wdth,wght", "normal"); // Set font to bold for the variable
    if (this.bank) {
      doc.text(this.bank, 42, 232);
    } else {
      doc.text(" ", 42, 232);
    }
    doc.setFont("Roboto-Bold", "bold");
    doc.text("Account Name", 10, 236);
    doc.text(":", 40, 236);
    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    if (this.accountName) {
      doc.text(this.accountName, 42, 236);
    } else {
      doc.text(" ", 42, 236);
    }
    doc.setFont("Roboto-Bold", "bold");
    doc.text("BSB", 10, 240);
    doc.text(":", 40, 240);
    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    if (this.bsb) {
      doc.text(this.bsb, 42, 240);
    } else {
      doc.text(" ", 42, 240);
    }
    doc.setFont("Roboto-Bold", "bold");
    doc.text("Account Number", 10, 244);
    doc.text(":", 40, 244);
    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    if (this.accountNo) {
      doc.text(" " + this.accountNo, 41, 244);
    } else {
      doc.text(" ", 41, 244);
    }
    doc.setFontSize(10);
    doc.setFont("Roboto-Bold", "bold");
    doc.text("Terms & Conditions:", 10, 260);
    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.setTextColor(169, 169, 169);
    doc.text("All terms and conditions apply.", 10, 264);

    doc.setFont("Roboto-VariableFont_wdth,wght", "normal");
    doc.setFontSize(11);
    // console.log('invRecords of ', JSON.stringify(this.invRecords));
    doc.setTextColor(0, 0, 0);
    //footer text
    /* doc.setFont("Times New Roman", "");
       doc.setFontSize(11);
       doc.text("Office Use Only", 90, 290); */

    console.log("invRecords of ", JSON.stringify(this.invRecords));
    // var generateData = function(amount) {
    var result = [];
    var subTotal = 0;

    this.invRecords.forEach((record) => {
      subTotal += record.Amount__c;

      result.push([
        record.Description__c,
        record.Quantity__c.toFixed(2),
        record.Unit_Price__c.toLocaleString("en-US", {
          style: "currency",
          currency: "USD"
        }),
        "10%", // Tax column
        record.Amount__c.toLocaleString("en-US", {
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
      "Sub Total:",
      "$" + this.invRecords[0].Invoice_Parent__r.Total_Amount__c.toFixed(2)
    ]);
    result.push([
      "",
      "",
      "",
      "Total GST:",
      "$" + this.invRecords[0].Invoice_Parent__r.Total_GST__c.toFixed(2)
    ]);
    result.push([
      "",
      "",
      "",
      "Total:",
      "$" + this.invRecords[0].Invoice_Parent__r.Total__c.toFixed(2)
    ]);

    // Generating table using autoTable
    doc.autoTable({
      startY: 88, // Starting Y position
      head: [["Description", "Qty", "Rate", "Tax", "Amount"]],
      body: result,
      theme: "plain",
      /* styles: { halign: "left" }, */
      margin: { left: 10, right: 10 },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        font: "Roboto-Bold",
        fontStyle: "bold"
      },
      bodyStyles: {
        font: "Roboto-VariableFont_wdth,wght",
        fontStyle: "normal"
      },
      /* bodyStyles: { lineWidth: 0.5, lineColor: [0, 0, 0] }, */
      columnStyles: {
        0: { cellWidth: 80, halign: "left" }, // Description left-aligned
        1: { cellWidth: 25, halign: "left" }, // Qty left-aligned
        2: { cellWidth: 25, halign: "left" }, // Rate left-aligned
        3: { cellWidth: 25, halign: "right" }, // Tax right-aligned
        4: { cellWidth: 35, halign: "right" } // Amount right-aligned
      },
      didParseCell: function (data) {
        var columnText = data.row.raw[3]; // Get column text
        if (data.row.index === 0) {
          if (data.column.index === 3 || data.column.index === 4) {
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
        var columnText = data.row.raw[3];

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

          if (data.column.index === 4 || data.column.index === 3) {
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
      }
    });

    addFooter(doc);
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

      doc.addImage(img, "JPEG", 30, footerY - 11, 30, 10); // A
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

    // console.log('if this.message.allProducts type reddy table');
    //adding new page => praveen
    doc.addPage("a4", "portrait");
    let startY = 15;
    let margin = 10; // Set the left margin
    let maxWidth = doc.internal.pageSize.width - 2 * margin; // Calculate the maximum width

    this.ictInvoiceList.forEach((rec) => {
      let startAndEndDate =
        new Date(rec.Week_Start_Date__c).toLocaleDateString("en-GB") +
        " to " +
        new Date(rec.Week_end_Date__c).toLocaleDateString("en-GB");

      var ictTable = [];
      var data = {};
      let allocationMapData = new Map();
      let ictAllocations = [];
      let approveHours = 0;
      ictAllocations = rec.Allocations__r;

      // console.log('allocation for each week '+JSON.stringify(ictAllocations));
      if (ictAllocations && ictAllocations.length > 0) {
        ictAllocations.forEach((allorec) => {
          allocationMapData.set(allorec.Day_name__c, allorec);
          if (allorec.Working_Hours__c)
            approveHours += allorec.Working_Hours__c;
        });
        console.log("allocation  map " + JSON.stringify(allocationMapData));
        // console.log('map get '+ JSON.stringify(allocationMapData.get('Monday')));
      }

      let dayList = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ];
      let dayWithDates = new Map();
      dayList.forEach((day, index) => {
        if (rec.Week_Start_Date__c) {
          let newDate = new Date(rec.Week_Start_Date__c);
          newDate.setDate(newDate.getDate() + index);
          dayWithDates.set(day, newDate);
        }
      });
      // console.log('daysWithdates =>'+JSON.stringify(dayWithDates));
      // console.log('map get date'+ JSON.stringify(dayWithDates.get('Thursday')));
      dayList.forEach((day) => {
        let data = [];
        if (allocationMapData.has(day)) {
          data.push(
            day +
              "\n" +
              new Date(
                allocationMapData.get(day).Start_Date__c
              ).toLocaleDateString("en-GB")
          );
          data.push(allocationMapData.get(day).Start_Time_Formula__c);
          data.push(allocationMapData.get(day).End_Time_Formula__c);
          if (
            allocationMapData.get(day).Break_Start_Time_Formula__c &&
            allocationMapData.get(day).Break_End_Time_Formula__c
          ) {
            data.push(
              allocationMapData.get(day).Break_Start_Time_Formula__c +
                "-" +
                allocationMapData.get(day).Break_End_Time_Formula__c
            );
          } else {
            data.push("-");
          }
          if (
            allocationMapData.get(day).Break_Start_Time2_Formula__c &&
            allocationMapData.get(day).Break_End_Time2_Formula__c
          ) {
            data.push(
              allocationMapData.get(day).Break_Start_Time2_Formula__c +
                "-" +
                allocationMapData.get(day).Break_End_Time2_Formula__c
            );
          } else {
            data.push("-");
          }
          if (
            allocationMapData.get(day).Break_Start_Time3_Formula__c &&
            allocationMapData.get(day).Break_End_Time3_Formula__c
          ) {
            data.push(
              allocationMapData.get(day).Break_Start_Time3_Formula__c +
                "-" +
                allocationMapData.get(day).Break_End_Time3_Formula__c
            );
          } else {
            data.push("-");
          }
          data.push(allocationMapData.get(day).Break__c);
          data.push(allocationMapData.get(day).Working_Hours__c);
        } else {
          data.push(
            day + "\n" + dayWithDates.get(day).toLocaleDateString("en-GB")
          );
          data.push("-");
          data.push("-");
          data.push("-");
          data.push("-");
          data.push("-");
          data.push("-");
          data.push("-");
        }
        ictTable.push(data);
      });

      ictTable.push(["Total Hours", "", "", "", "", "", "", approveHours]);
      // ictTable.push(["Total Hours", "", "", "", rec.Total_Duration__c]);
      // console.log('table data'+JSON.stringify(ictTable));
      let availableSpace = doc.internal.pageSize.height - (startY + 10); // Calculate available space on the page
      let tableHeight = ictTable.length * 15; // Assuming each row has a height of 15
      if (availableSpace > tableHeight + 30) {
        // Check if there's enough space to fit both the table and additional text
        doc.setFont("Roboto-Bold", "bold");
        doc.setFontSize(10);
        // doc.text("Email Subject:TimeSheet Approval For "+this.staffFullname+' '+rec.Name+' from ' + startAndEndDate, 15, startY);
        const subjectText =
          "Email Subject: Timesheet Approval for " +
          this.staffFullname +
          " " +
          rec.Name +
          " from " +
          startAndEndDate;
        const subjectLines = doc.splitTextToSize(subjectText, maxWidth); // Split text into multiple lines

        doc.text(subjectLines, margin, startY); // Use the split text
        startY += subjectLines.length * 5 + 5; // Adjust startY based on the number of lines
        doc.text("Timesheet(s)", margin, startY);

        doc.autoTable({
          startY: startY + 2,
          columnStyles: {
            0: { cellWidth: 24 }, // "Days" column
            1: { cellWidth: 20 }, // "StartTime" column
            2: { cellWidth: 20 }, // "EndTime" column
            3: { cellWidth: 32 }, // "Break 1" column
            4: { cellWidth: 32 }, // "Break 2" column
            5: { cellWidth: 32 }, // "Break 3" column
            6: { cellWidth: 15 }, // "Break" column
            7: { cellWidth: 15 } // "Hours" column
          },
          margin: { left: 10, right: 10 },
          theme: "grid",
          headStyles: {
            fillColor: [169, 169, 169],
            textColor: [255, 255, 255],
            font: "Roboto-Bold",
            fontStyle: "bold",
            halign: "center"
          },
          bodyStyles: {
            font: "Roboto-VariableFont_wdth,wght",
            fontStyle: "normal"
          },
          head: [
            [
              "Days",
              "Start Time",
              "End Time",
              "Break 1",
              "Break 2",
              "Break 3",
              "Break (mins)",
              "Hours"
            ]
          ],
          //  body:ictTable
          body: ictTable.map((row) =>
            row.map((cell) => ({ content: cell, styles: { halign: "center" } }))
          )
        });
        doc.setFontSize(10);
        // console.log('last modified date and time '+ this.formatDateTime(rec.LastModifiedDate));
        doc.text(
          "Approved Date and Time: " +
            this.formatDateTime(rec.LastModifiedDate),
          10,
          doc.autoTable.previous.finalY + 10
        );
        const approvedByText = "Approved By: " + rec.Approver_Name__c;
        const approvedByWidth = doc.getTextWidth(approvedByText);

        // Calculate the position dynamically to align to the right margin
        const pageWidth = doc.internal.pageSize.width; // Get the page width
        const rightMargin = 10; // Set the margin from the right side
        const approvedByX = pageWidth - approvedByWidth - rightMargin; // Position the text to the right

        // Draw the "Approved By" text
        doc.text(
          approvedByText,
          approvedByX,
          doc.autoTable.previous.finalY + 10
        );

        //doc.text("Approved by: "+rec.Approver_Name__c,135, doc.autoTable.previous.finalY + 10);
        startY = doc.autoTable.previous.finalY + 20;
        addFooter(doc);
      } else {
        doc.addPage();
        doc.setFont("Roboto-Bold", "bold");
        doc.setFontSize(10);
        startY = 15;
        //doc.text("Email Subject:TimeSheet Approval For "+this.staffFullname+' '+rec.Name+' from ' + startAndEndDate, 15, startY);
        const subjectText =
          "Email Subject: Timesheet Approval for " +
          this.staffFullname +
          " " +
          rec.Name +
          " from " +
          startAndEndDate;
        const subjectLines = doc.splitTextToSize(subjectText, maxWidth); // Split text into multiple lines
        doc.text(subjectLines, margin, startY); // Use the split text
        startY += subjectLines.length * 5 + 5; // Adjust startY based on the number of lines
        doc.text("Timesheet(s)", margin, startY);
        doc.autoTable({
          startY: startY + 2,
          columnStyles: {
            0: { cellWidth: 24 }, // "Days" column
            1: { cellWidth: 20 }, // "StartTime" column
            2: { cellWidth: 20 }, // "EndTime" column
            3: { cellWidth: 32 }, // "Break 1" column
            4: { cellWidth: 32 }, // "Break 2" column
            5: { cellWidth: 32 }, // "Break 3" column
            6: { cellWidth: 15 }, // "Break" column
            7: { cellWidth: 15 } // "Hours" column
          },
          margin: { left: 10, right: 10 },
          theme: "grid",
          headStyles: {
            fillColor: [169, 169, 169],
            textColor: [255, 255, 255],
            font: "Roboto-Bold",
            fontStyle: "bold",
            halign: "center"
          },
          bodyStyles: {
            font: "Roboto-VariableFont_wdth,wght",
            fontStyle: "normal"
          },
          head: [
            [
              "Days",
              "Start Time",
              "End Time",
              "Break 1",
              "Break 2",
              "Break 3",
              "Break (mins)",
              "Hours"
            ]
          ],
          bodyStyles: {
            font: "Roboto-VariableFont_wdth,wght",
            fontStyle: "normal"
          },
          //  body:ictTable
          body: ictTable.map((row) =>
            row.map((cell) => ({ content: cell, styles: { halign: "center" } }))
          )
        });
        doc.setFontSize(10);
        doc.text(
          "Approved Date and Time: " +
            this.formatDateTime(rec.LastModifiedDate),
          10,
          doc.autoTable.previous.finalY + 10
        );
        const approvedByText = "Approved By: " + rec.Approver_Name__c;
        const approvedByWidth = doc.getTextWidth(approvedByText);

        // Calculate the position dynamically to align to the right margin
        const pageWidth = doc.internal.pageSize.width; // Get the page width
        const rightMargin = 10; // Set the margin from the right side
        const approvedByX = pageWidth - approvedByWidth - rightMargin; // Position the text to the right

        // Draw the "Approved By" text
        doc.text(
          approvedByText,
          approvedByX,
          doc.autoTable.previous.finalY + 10
        );

        /* doc.text("Approved By: "+rec.Approver_Name__c, 135, doc.autoTable.previous.finalY + 10); */
        startY = doc.autoTable.previous.finalY + 20;
        addFooter(doc);
      }
    });

    this.base64string = btoa(doc.output());
    // console.log('if this.message.allProducts type reddy table');
    this.showSpinner = true;
    var docName = this.invRecords[0].Invoice_Parent__r.Name + ".pdf";
    // console.log('docName>',docName);
    uploadFile({
      base64: JSON.stringify(this.base64string),
      filename: docName,
      recordId: this.invParentId,
      obj: "invoiceParent"
    }).then((result) => {
      // console.log('data', result);
      // console.log('Upload result = ' +result);
      // this.fileName = this.fileName + ' - Uploaded Successfully';
    });
    const evt = new ShowToastEvent({
      title: "Success",
      message: "Invoice generated sucessfully. " + docName,
      variant: "success",
      mode: "dismissable"
    });
    // this.handlecloseInvoice();
    this.dispatchEvent(evt);
    setTimeout(() => {
      this.fetchInvoices();
      this.showSpinner = false;
    }, 3000);
    this.accountRecList = [];
  }

  formatDateTime(datetimeString) {
    const date = new Date(datetimeString);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    const timeOptions = {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      timeZone: "Australia/Sydney"
    };
    const timeFormatter = new Intl.DateTimeFormat("en-US", timeOptions);
    const formattedTime = timeFormatter.format(date);
    const formattedDate = `${day}/${month}/${year}`;
    return `${formattedDate} ${formattedTime}`;
  }

  @api allocationId1;
  @track staffData;
  @track sDate;
  @track starttime;
  @track EndTime;
  @track breakstartTimevalue;
  @track breakendTimevalue;
  @track breakstartTime2value;
  @track breakendTime2value;
  @track breakstartTime3value;
  @track breakendTime3value;
  @track breakTime;
  @track whours;
  @track errorMessage = "";
  @track errorMessageFlag = false;
  @track disableSaveButton = false;
  @track showAddIcon1 = true;
  @track showbreak2Edit = false;
  @track showbreak3Edit = false;
  @track breakReadonly = true;
  @track deleterow = "";
  @track starttimeSelectedHour;
  @track starttimeSelectedMinute;
  @track starttimeAMPM;
  @track EndtimeSelectedHour;
  @track EndtimeSelectedMinute;
  @track EndtimeAMPM;
  @track Uistarttime;
  @track UiEndTime;
  @track UibreakstartTimevalue;
  @track UibreakendTimevalue;
  @track breakstartTimeSelectedHour;
  @track breakstartTimeSelectedMinute;
  @track breakstartTimeAMPM;
  @track UibreakendTimevalue;
  @track breakendTimeSelectedHour;
  @track breakendTimeSelectedMinute;
  @track breakendTimeAMPM;
  @track UibreakstartTime2value;
  @track breakstartTime2SelectedHour;
  @track breakstartTime2SelectedMinute;
  @track breakstartTime2AMPM;
  @track UibreakendTime2value;
  @track breakendTime2SelectedHour;
  @track breakendTime2SelectedMinute;
  @track breakendTime2AMPM;
  @track UibreakstartTime3value;
  @track breakstartTime3SelectedHour;
  @track breakstartTime3SelectedMinute;
  @track breakstartTime3AMPM;
  @track UibreakendTime3value;
  @track breakendTime3SelectedHour;
  @track breakendTime3SelectedMinute;
  @track breakendTime3AMPM;

  handleEdit1(event) {
    this.UibreakstartTimevalue = "";
    this.UibreakendTimevalue = "";
    this.UibreakstartTime2value = "";
    this.UibreakendTime2value = "";
    this.UibreakstartTime3value = "";
    this.UibreakendTime3value = "";

    this.breakStartTime = "";
    this.breakEndTime = "";
    this.breakStartTime2 = "";
    this.breakEndTime2 = "";
    this.breakStartTime3 = "";
    this.breakEndTime3 = "";

    this.isManualSaveClick1 = false;
    console.log("delete==>" + event.target.name);
    console.log();
    this.editflag1 = false;
    this.editflag = false;
    let alocId = event.currentTarget.dataset.id;
    console.log("alocId==>" + alocId);
    this.allocationId1 = event.currentTarget.dataset.id;

    console.log(
      "StaffJsonForamt in edit  " +
        JSON.stringify(this.satffDataJasonformat[alocId])
    );

    this.startTimeJSOn = this.satffDataJasonformat[alocId]["stringStarttime"];
    this.EndTimeJSOn = this.satffDataJasonformat[alocId]["StringEndTime"];
    this.starttime =
      this.convertTo24Hour(
        this.satffDataJasonformat[alocId]["stringStarttime"]
      ) + ":00.000Z";
    console.log("this.starttime" + this.starttime);
    this.Uistarttime = this.fixMidnightFormat(
      this.satffDataJasonformat[alocId]["stringStarttime"]
    );
    const startTimeData = this.handleTimeSplitForField(this.Uistarttime);
    this.starttimeSelectedHour = startTimeData.hour;
    this.starttimeSelectedMinute = startTimeData.minute;
    this.starttimeAMPM = startTimeData.ampm;
    this.EndTime =
      this.convertTo24Hour(this.satffDataJasonformat[alocId]["StringEndTime"]) +
      ":00.000Z";
    this.UiEndTime = this.fixMidnightFormat(
      this.satffDataJasonformat[alocId]["StringEndTime"]
    );
    console.log(
      "this.Endtime -------" +
        this.satffDataJasonformat[alocId]["StringEndTime"]
    );
    console.log("this.EndTime in handleEdit1" + this.EndTime);
    const EndTimeData = this.handleTimeSplitForField(this.UiEndTime);
    this.EndtimeSelectedHour = EndTimeData.hour;
    this.EndtimeSelectedMinute = EndTimeData.minute;
    this.EndtimeAMPM = EndTimeData.ampm;

    console.log(
      "this.starttime -------" +
        this.satffDataJasonformat[alocId]["stringStarttime"]
    );
    if (this.satffDataJasonformat[alocId]["breakStartTime"]) {
      console.log(
        "breakStartTime:",
        this.satffDataJasonformat[alocId]?.breakStartTime
      );
      this.breakStartTimePickval =
        this.convertTo24Hour(
          this.satffDataJasonformat[alocId]["breakStartTime"]
        ) + ".000Z";
      this.breakstartTimevalue =
        this.convertTo24Hour(
          this.satffDataJasonformat[alocId]["breakStartTime"]
        ) + ":00.000Z";
      this.UibreakstartTimevalue = this.fixMidnightFormat(
        this.satffDataJasonformat[alocId]["breakStartTime"]
      );
      const breakstartTimeData = this.handleTimeSplitForField(
        this.UibreakstartTimevalue
      );
      this.breakstartTimeSelectedHour = breakstartTimeData.hour;
      this.breakstartTimeSelectedMinute = breakstartTimeData.minute;
      this.breakstartTimeAMPM = breakstartTimeData.ampm;
    }else {
    this.breakStartTimePickval = '';
    this.breakstartTimevalue = '';
    this.UibreakstartTimevalue = '';
    this.breakstartTimeSelectedHour = null;
    this.breakstartTimeSelectedMinute = null;
    this.breakstartTimeAMPM = null;
   }
    console.log(
        "  this.UibreakstartTimevalue :",
          this.UibreakstartTimevalue
      );
    if (this.satffDataJasonformat[alocId]["breakEndTime"]) {
      this.breakEndTimePickval =
        this.convertTo24Hour(
          this.satffDataJasonformat[alocId]["breakEndTime"]
        ) + ".000Z";
      this.breakendTimevalue =
        this.convertTo24Hour(
          this.satffDataJasonformat[alocId]["breakEndTime"]
        ) + ":00.000Z";
      this.UibreakendTimevalue = this.fixMidnightFormat(
        this.satffDataJasonformat[alocId]["breakEndTime"]
      );
      const breakendTimeData = this.handleTimeSplitForField(
        this.UibreakendTimevalue
      );
      this.breakendTimeSelectedHour = breakendTimeData.hour;
      this.breakendTimeSelectedMinute = breakendTimeData.minute;
      this.breakendTimeAMPM = breakendTimeData.ampm;
    }else {
    this.breakEndTimePickval = '';
    this.breakendTimevalue = '';
    this.UibreakendTimevalue = '';
    this.breakendTimeSelectedHour = null;
    this.breakendTimeSelectedMinute = null;
    this.breakendTimeAMPM = null;
 }
    console.log("this.starttime" + this.starttime);
    console.log("this.EndTime" + this.EndTime);

    console.log("this.breakEndTimePickval" + this.breakEndTimePickval);
    console.log("this.breakendTimevalue" + this.breakendTimevalue);

    console.log("this.breakstartTimevalue" + this.breakstartTimevalue);
    console.log("this.breakStartTimePickval" + this.breakStartTimePickval);

    if (
      this.satffDataJasonformat[alocId]["breakStartTime2"] &&
      this.satffDataJasonformat[alocId]["breakEndTime2"]
    ) {
      console.log("First If");
      this.showbreak2Edit = true;
      this.breakstartTime2value =
        this.convertTo24Hour(
          this.satffDataJasonformat[alocId]["breakStartTime2"]
        ) + ":00.000Z";
      this.UibreakstartTime2value = this.fixMidnightFormat(
        this.satffDataJasonformat[alocId]["breakStartTime2"]
      );
      const breakstartTime2Data = this.handleTimeSplitForField(
        this.UibreakstartTime2value
      );
      this.breakstartTime2SelectedHour = breakstartTime2Data.hour;
      this.breakstartTime2SelectedMinute = breakstartTime2Data.minute;
      this.breakstartTime2AMPM = breakstartTime2Data.ampm;

      this.breakendTime2value =
        this.convertTo24Hour(
          this.satffDataJasonformat[alocId]["breakEndTime2"]
        ) + ":00.000Z";
      this.UibreakendTime2value = this.fixMidnightFormat(
        this.satffDataJasonformat[alocId]["breakEndTime2"]
      );
      const breakendTime2Data = this.handleTimeSplitForField(
        this.UibreakendTime2value
      );
      this.breakendTime2SelectedHour = breakendTime2Data.hour;
      this.breakendTime2SelectedMinute = breakendTime2Data.minute;
      this.breakendTime2AMPM = breakendTime2Data.ampm;
    } else {
        this.showbreak2Edit = false;
        this.breakstartTime2value = '';
        this.breakendTime2value = '';
        this.UibreakstartTime2value = '';
        this.UibreakendTime2value = '';
        this.breakstartTime2SelectedHour = null;
        this.breakstartTime2SelectedMinute = null;
        this.breakstartTime2AMPM = null;
        this.breakendTime2SelectedHour = null;
        this.breakendTime2SelectedMinute = null;
        this.breakendTime2AMPM = null;
    }
    if (
      this.satffDataJasonformat[alocId]["breakStartTime3"] &&
      this.satffDataJasonformat[alocId]["breakEndTime3"]
    ) {
      console.log("second If");
      this.showbreak3Edit = true;

      this.breakstartTime3value =
        this.convertTo24Hour(
          this.satffDataJasonformat[alocId]["breakStartTime3"]
        ) + ":00.000Z";
      this.UibreakstartTime3value = this.fixMidnightFormat(
        this.satffDataJasonformat[alocId]["breakStartTime3"]
      );
      const breakstartTime3Data = this.handleTimeSplitForField(
        this.UibreakstartTime3value
      );
      this.breakstartTime3SelectedHour = breakstartTime3Data.hour;
      this.breakstartTime3SelectedMinute = breakstartTime3Data.minute;
      this.breakstartTime3AMPM = breakstartTime3Data.ampm;
      this.breakendTime3value =
        this.convertTo24Hour(
          this.satffDataJasonformat[alocId]["breakEndTime3"]
        ) + ":00.000Z";
      this.UibreakendTime3value = this.fixMidnightFormat(
        this.satffDataJasonformat[alocId]["breakEndTime3"]
      );
      const breakendTime3Data = this.handleTimeSplitForField(
        this.UibreakendTime3value
      );
      this.breakendTime3SelectedHour = breakendTime3Data.hour;
      this.breakendTime3SelectedMinute = breakendTime3Data.minute;
      this.breakendTime3AMPM = breakendTime3Data.ampm;
    } else {
      this.showbreak3Edit = false;
    this.breakstartTime3value = '';
    this.breakendTime3value = '';
    this.UibreakstartTime3value = '';
    this.UibreakendTime3value = '';
    this.breakstartTime3SelectedHour = null;
    this.breakstartTime3SelectedMinute = null;
    this.breakstartTime3AMPM = null;
    this.breakendTime3SelectedHour = null;
    this.breakendTime3SelectedMinute = null;
    this.breakendTime3AMPM = null;
      
    }

    console.log("If out");
    this.breakTime = this.satffDataJasonformat[alocId]["breakTime"];
    console.log("If out");
    this.whours = this.satffDataJasonformat[alocId]["workingHours"];
    console.log("If out");
    this.breakJson = this.satffDataJasonformat[alocId]["breakTime"];
    console.log("If out");
    this.breakTime = this.satffDataJasonformat[alocId]["breakTime"];
    console.log("If out");
    this.sDate = this.satffDataJasonformat[alocId]["startDate"];
    console.log("If out");
    this.allocationStatus = this.satffDataJasonformat[alocId]["status"];

    console.log("this.sDate===>" + this.sDate);
    console.log("this.whours===>" + this.whours);
    //this.calculateWorkingHours();
    console.log("alocId==>" + alocId);
    console.log("allocationStatus===>" + this.allocationStatus);
    if (
      this.allocationStatus == "Draft" ||
      this.allocationStatus == "Rejected"
    ) {
      console.log("allocationStatus===>" + this.allocationStatus);
      let buttonName = event.target.name;
      if (buttonName == "delete") {
        deleteRecord(alocId).then(() => {
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Success",
              message: "Allocation is deleted successfully.",
              variant: "success"
            })
          );
          this.handleVisbility();
        });
      } else {
        console.log("allocationStatus===>" + this.allocationStatus);
        this.editflag1 = true;
        console.log("allocationStatus===>" + this.allocationStatus);
        //this.AllocationHeading='Edit Timesheet Details';
        //this.submitlabel='Update';
        this.errorMessageFlag = false;
        this.disableSaveButton = false;
        this.showAddIcon = true;
      }
    } else {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message:
            'Timesheets with the status "Submitted" or "Approved" cannot be edited.',
          variant: "Error"
        })
      );
    }
      console.log(
        "  this.UibreakstartTimevalue  in last:",
          this.UibreakstartTimevalue
      );
  }
  fixMidnightFormat(timeStr) {
    if (!timeStr) return "";

    const trimmed = timeStr.trim();
    const [timePart, ampmRaw] = trimmed.split(" ");
    if (!timePart || !ampmRaw) return trimmed;

    const ampm = ampmRaw.toUpperCase(); // handle lowercase "am"
    let [hour, minute] = timePart.split(":");

    // Fix 00:xx AM → 12:xx AM
    if (hour === "0" && ampm === "AM") {
      hour = "12";
    }

    return `${hour}:${minute} ${ampm}`;
  }

  handleTimeSplitForField(timeField) {
    // Get the time string from the field
    const timeStr = timeField;

    // Define the variables
    let hour = "";
    let minute = "";
    let ampm = "";

    // Check if the time string is in the expected format
    if (
      timeStr.includes(":") &&
      (timeStr.includes("AM") || timeStr.includes("PM"))
    ) {
      const [timePart, ampmPart] = timeStr.split(" ");
      const [hr, min] = timePart.split(":");
      hour = hr;
      minute = min;
      ampm = ampmPart === "AM" ? "AM" : "PM";
    }

    return { hour, minute, ampm };
  }

  handlechange1(event) {
    const fieldName = event.target.name;

    if (fieldName === "startTime") {
      this.starttime = event.target.value + "Z";
      console.log("this.starttime==>" + this.starttime);
    } else if (fieldName === "Endtime") {
      this.EndTime = event.target.value + "Z";
      console.log("this.EndTime==>" + this.EndTime);
    }

    const start = new Date(`1970-01-01T${this.starttime}`);
    const end = new Date(`1970-01-01T${this.EndTime}`);

    if (end <= start) {
      this.errorMessage = "End time must be later than start time.";
      this.errorMessageFlag = true;
      this.disableSaveButton = true;
    }

    // Call additional functions
    this.calculateWorkingHours();
    console.log("validateBreakTimes");
    //this.breakStartEndDurationCal();
    this.validateBreakTimes();
  }

  handleBreakStartEndechange1(event) {
    const fieldName = event.target.name;
    const fieldValue = event.target.value; // ✅ Define fieldValue

    console.log("event==>" + fieldValue);
    console.log("fieldName==>" + fieldName);

    if (fieldName === "breakstartTime") {
      this.breakstartTimevalue = fieldValue + "Z";
    } else if (fieldName === "breakendTime") {
      this.breakendTimevalue = fieldValue + "Z";
    } else if (fieldName === "breakstartTime2") {
      this.breakstartTime2value = fieldValue + "Z";
    } else if (fieldName === "breakendTime2") {
      this.breakendTime2value = fieldValue + "Z";
    } else if (fieldName === "breakstartTime3") {
      this.breakstartTime3value = fieldValue + "Z";
    } else if (fieldName === "breakendTime3") {
      this.breakendTime3value = fieldValue + "Z";
    } else if (fieldName === "startTime") {
      this.starttime = fieldValue + "Z";
    } else if (fieldName === "Endtime") {
      this.EndTime = fieldValue + "Z";
    }

    if (this.breakstartTimevalue && !this.breakendTimevalue) {
      this.errorMessage =
        "Break end time is required when break start time is entered.";
      this.errorMessageFlag = true;
      this.disableSaveButton = true;
    } else if (!this.breakstartTimevalue && this.breakendTimevalue) {
      this.errorMessage =
        "Break start time is required when break end time is entered";
      this.errorMessageFlag = true;
      this.disableSaveButton = true;
    } else if (!this.breakendTime3value && this.breakstartTime3value) {
      this.errorMessage =
        "Break end time 3 is required when break start time 3 is entered.";
      this.errorMessageFlag = true;
      this.disableSaveButton = true;
    } else if (!this.breakstartTime3value && this.breakendTime3value) {
      this.errorMessage =
        "Break start time 3 is required when break end time 3 is entered.";
      this.errorMessageFlag = true;
      this.disableSaveButton = true;
    } else if (!this.breakendTime2value && this.breakstartTime2value) {
      this.errorMessage =
        "Break end time 2 is required when break start time 2 is entered.";
      this.errorMessageFlag = true;
      this.disableSaveButton = true;
    } else if (!this.breakstartTime2value && this.breakendTime2value) {
      this.errorMessage =
        "Break start time 2 is required when break end time 2 is entered.";
      this.errorMessageFlag = true;
      this.disableSaveButton = true;
    } else {
      console.log("Raw Values:", {
        breakstartTimevalue: this.breakstartTimevalue,
        breakendTimevalue: this.breakendTimevalue,
        breakstartTime2value: this.breakstartTime2value,
        breakendTime2value: this.breakendTime2value,
        breakstartTime3value: this.breakstartTime3value,
        breakendTime3value: this.breakendTime3value,
        starttime: this.starttime,
        EndTime: this.EndTime
      });

      // ✅ Store valid break times
      let breaks = [
        { start: this.breakstartTimevalue, end: this.breakendTimevalue },
        { start: this.breakstartTime2value, end: this.breakendTime2value },
        { start: this.breakstartTime3value, end: this.breakendTime3value }
      ];

      console.log("Before Filtering:", JSON.stringify(breaks));

      // ✅ Remove breaks where start or end time is missing
      breaks = breaks.filter((b) => b.start && b.end);

      console.log("After Filtering:", JSON.stringify(breaks));
      console.log("Breaks Array Length:", breaks.length);

      let breakTimes = [];

      const parseTime1 = (time) => {
        if (!this.sDate || !time) return null; // Handle null cases

        let dateTimeString = `${this.sDate}T${time}`;
        let parsedDate = new Date(dateTimeString);

        if (isNaN(parsedDate.getTime())) {
          console.error("Invalid Date:", dateTimeString);
          return null;
        }

        return parsedDate.getTime(); // Return timestamp in milliseconds
      };

      for (let i = 0; i < breaks.length; i++) {
        console.log(`Processing Break ${i + 1}:`, breaks[i]);

        let breakStart = parseTime1(breaks[i].start);
        let breakEnd = parseTime1(breaks[i].end);

        console.log(`Break ${i + 1} Start:`, breakStart);
        console.log(`Break ${i + 1} End:`, breakEnd);

        if (breakStart && breakEnd) {
          breakTimes.push({ start: breakStart, end: breakEnd });
        }
      }

      console.log("Final Break Times:", JSON.stringify(breakTimes));

      // ✅ Calculate total break time in minutes
      this.breakTime = breakTimes.reduce((total, breakSlot) => {
        return total + (breakSlot.end - breakSlot.start) / (1000 * 60);
      }, 0);

      console.log("Total Break Minutes:", this.breakTime);

      // ✅ Convert to hours (rounded to 2 decimal places)
      let totalBreakHours = (parseFloat(this.breakTime) / 60).toFixed(2);
      console.log("Total Break Hours:", totalBreakHours);

      // Convert time strings to Date objects
      let startTime = new Date(`1970-01-01T${this.starttime}`).getTime();
      let endTime = new Date(`1970-01-01T${this.EndTime}`).getTime();
      console.log("startTime===>" + startTime);
      console.log("endTime===>" + endTime);

      // Calculate the difference in hours
      this.totalWorkingHours = (endTime - startTime) / (1000 * 60 * 60);
      console.log("this.totalWorkingHours===>" + this.totalWorkingHours);

      // Ensure it's rounded and formatted correctly
      //this.totalWorkingHours = Math.abs(this.totalWorkingHours).toFixed(0);

      console.log("Total Working Hours:", this.totalWorkingHours);

      // ✅ Calculate working hours
      if (this.deleterow == "delete") {
        console.log("this.workingHours==>" + this.totalWorkingHours);
        this.whours = (
          this.totalWorkingHours -
          parseFloat(this.breakTime) / 60
        ).toFixed(2);
        console.log("this.whours===>" + this.totalWorkingHours);
      } else {
        console.log("this.workingHours==>" + this.totalWorkingHours);
        console.log("this.breakTime1==>" + this.breakTime);
        this.whours = (
          this.totalWorkingHours -
          parseFloat(this.breakTime) / 60
        ).toFixed(2);
        console.log("this.whours===>" + this.totalWorkingHours);
      }

      if (this.whours <= 0) {
        this.errorMessage = "End time must be later than start time.";
        this.errorMessageFlag = true;
        this.disableSaveButton = true;
      } else {
        this.errorMessage = "";
        this.errorMessageFlag = false;
        this.disableSaveButton = false;
      }

      // ✅ Ensure breakTime is a string for further processing
      this.breakTime = this.breakTime.toString();
      console.log("this.breakTime===>" + this.breakTime);

      // ✅ Clear error if all validations pass
      this.errorMessageFlag = false;
      this.errorMessage = "";
      this.disableSaveButton = false;
      if (
        !this.breakstartTimevalue &&
        !this.breakendTimevalue &&
        !this.breakendTime3value &&
        !this.breakstartTime3value &&
        !this.breakendTime2value &&
        !this.breakstartTime2value
      ) {
        if (this.totalWorkingHours >= 5) {
          this.breakTime = 30;
          this.breakReadonly = false;
        } else {
          this.breakTime = 0;
          this.breakReadonly = true;
        }
        if (this.breakTime == undefined) {
          this.breakTime = 0;
        }
        let breaks = (this.breakTime / 60).toFixed(2);
        this.whours = this.totalWorkingHours - breaks;
        // new line added by praveen
        // console.log('durationwith  break '+ this.whours+' break'+  this.breakTime)
        this.breakTime = this.breakTime.toString();
        this.timeErrorValidation();
      }

      // ✅ Run additional calculations
      //this.validateBreakTimes();
      this.timeErrorValidation();
      //this.calculateWorkingHours();

      console.log("Calling validateBreakTimes()...");
      this.validateBreakTimes();
    }
  }

  validateBreakTimes() {
    console.log("Validating break times...");

    // Convert string times to Date objects
    const shiftStart = new Date(`1970-01-01T${this.starttime}`);
    const shiftEnd = new Date(`1970-01-01T${this.EndTime}`);

    console.log("Shift Start:", shiftStart);
    console.log("Shift End:", shiftEnd);

    const breakTimes = [
      { start: this.breakstartTimevalue, end: this.breakendTimevalue },
      { start: this.breakstartTime2value, end: this.breakendTime2value },
      { start: this.breakstartTime3value, end: this.breakendTime3value }
    ].filter((b) => b.start && b.end); // Remove undefined values

    console.log("Break Times:", breakTimes);

    for (let i = 0; i < breakTimes.length; i++) {
      let breakStart = new Date(`1970-01-01T${breakTimes[i].start}`);
      let breakEnd = new Date(`1970-01-01T${breakTimes[i].end}`);

      console.log(`Break ${i + 1} Start:`, breakStart);
      console.log(`Break ${i + 1} End:`, breakEnd);

      if (breakEnd <= breakStart) {
        console.error(
          "Error: Break End Time must be greater than Break Start Time."
        );
        this.errorMessageFlag = true;
        this.errorMessage =
          "Break end time must be later than break start time.";
        this.disableSaveButton = true;
        return;
      }

      if (breakStart < shiftStart || breakEnd > shiftEnd) {
        console.error(
          "Error: Break time must be within shift start and end time."
        );
        this.errorMessageFlag = true;
        this.errorMessage =
          "Break time must fall within the shift start and end times.";
        this.disableSaveButton = true;
        return;
      }

      for (let j = 0; j < i; j++) {
        // Compare with previous breaks only
        let prevBreakStart = new Date(`1970-01-01T${breakTimes[j].start}`);
        let prevBreakEnd = new Date(`1970-01-01T${breakTimes[j].end}`);

        if (
          (breakStart >= prevBreakStart && breakStart < prevBreakEnd) || // Overlapping start
          (breakEnd > prevBreakStart && breakEnd <= prevBreakEnd) || // Overlapping end
          (breakStart <= prevBreakStart && breakEnd >= prevBreakEnd) // Fully contains previous break
        ) {
          console.log("Error: Break times should not overlap.");

          this.errorMessage = "Break time must not overlap.";
          console.log(
            "Error: Break times should not overlap." + this.errorMessage
          );
          this.errorMessageFlag = true;
          console.log(
            "Error: Break times should not overlap." + this.errorMessageFlag
          );
          this.disableSaveButton = true;
          return;
        }
      }
    }

    console.log("Validation passed. Clearing errors.");
    this.errorMessageFlag = false;
    this.errorMessage = "";
    this.disableSaveButton = false;
  }
  calculateWorkingHours() {
    let startTimeStr = this.starttime; // Example: "09:00:00.000"
    let EndTimeStr = this.EndTime; // Example: "18:00:00.000"

    console.log("startTimeStr ===>", startTimeStr);
    console.log("EndTimeStr ===>", EndTimeStr);

    // Validate input values
    if (!startTimeStr || !EndTimeStr) {
      console.error("Error: Missing time values.");
      return;
    }

    // Convert to Date objects
    let startTime = new Date(`1970-01-01T${startTimeStr}`);
    console.log("startTime===>" + startTime);
    let EndTime = new Date(`1970-01-01T${EndTimeStr}`);
    console.log("EndTime===>" + EndTime);

    console.log("Parsed startTime:", startTime);
    console.log("Parsed EndTime:", EndTime);

    if (isNaN(startTime.getTime()) || isNaN(EndTime.getTime())) {
      console.error("Error: Invalid Date format.");
      return;
    }

    // Calculate working hours
    //this.breakTime = '';
    if (this.breakstartTimevalue && this.breakendTimevalue) {
      const start = new Date(`1970-01-01T${this.breakstartTimevalue}`);
      const end = new Date(`1970-01-01T${this.breakendTimevalue}`);

      const diffMs = end - start;
      const diffMinutes = diffMs / (1000 * 60);
      this.breakTime = diffMinutes;
    }

    if (this.breakstartTime2value && this.breakendTime2value) {
      const start2 = new Date(`1970-01-01T${this.breakstartTime2value}`);
      const end2 = new Date(`1970-01-01T${this.breakendTime2value}`);

      const diffMs = end2 - start2;
      const diffMinutes = diffMs / (1000 * 60);
      this.breakTime += diffMinutes;
    }

    if (this.breakstartTime3value && this.breakendTime3value) {
      const start3 = new Date(`1970-01-01T${this.breakstartTime3value}`);
      const end3 = new Date(`1970-01-01T${this.breakendTime3value}`);

      const diffMs = end3 - start3;
      const diffMinutes = diffMs / (1000 * 60);
      this.breakTime += diffMinutes;
    } else {
      console.log("One or more break times are missing.");
    }

    console.log("this.breakTime===>" + this.breakTime);
    let diffMs = EndTime - startTime;
    this.totalWorkingHours = diffMs / (1000 * 60 * 60); // Convert to hours
    console.log("Updated Working Hours:", this.totalWorkingHours);

    this.whours = (
      this.totalWorkingHours -
      parseFloat(this.breakTime) / 60
    ).toFixed(2);
    console.log("Updated Working Hours:", this.whours);
  }

  handleAddDescription1() {
    if (!this.showbreak2Edit) {
      this.showbreak2Edit = true;
    } else if (!this.showbreak3Edit) {
      this.showbreak3Edit = true;
      this.showAddIcon1 = false;
    }
  }

  handleDeleteDescription1(event) {
    const index = event.currentTarget.dataset.index;
    if (index == 2) {
      this.showbreak2Edit = false;
      this.breakstartTime2value = null;
      this.breakendTime2value = null;
      this.UibreakstartTime2value = null;
      this.UibreakendTime2value = null;
      this.breakstartTime2SelectedHour = null; // Added
      this.breakstartTime2SelectedMinute = null; // Added
      this.breakstartTime2AMPM = null; // Added
      this.breakendTime2SelectedHour = null; // Added
      this.breakendTime2SelectedMinute = null; // Added
      this.breakendTime2AMPM = null; // Added
      this.showAddIcon1 = true;
    } else if (index == 3) {
      this.showbreak3Edit = false;
      this.breakstartTime3value = null;
      this.breakendTime3value = null;
      this.UibreakstartTime3value = null;
      this.UibreakendTime3value = null;
      this.breakstartTime3SelectedHour = null; // Added
      this.breakstartTime3SelectedMinute = null; // Added
      this.breakstartTime3AMPM = null; // Added
      this.breakendTime3SelectedHour = null; // Added
      this.breakendTime3SelectedMinute = null; // Added
      this.breakendTime3AMPM = null; // Added
      this.showAddIcon1 = true;
    }
    this.deleterow = "delete";
    console.log("this.breakstartTime3value===>" + this.breakstartTime3value);
    console.log("this.breakendTime3value===>" + this.breakendTime3value);
    console.log("this.deleterow===>" + this.deleterow);
    this.handleBreakStartEndechange1({ target: { fieldName: "", value: "" } });
  }

  handleeditClose1() {
    this.editflag1 = false;
    this.showAddIcon1 = true;
    this.deleterow = "";
    this.showbreak2 = false;
    this.showbreak3 = false;
    this.sDate = null;
    this.starttime = null;
    this.EndTime = null;
    this.breakstartTimevalue = null;
    this.breakendTimevalue = null;
    this.breakstartTime2value = null;
    this.breakendTime2value = null;
    this.breakstartTime3value = null;
    this.breakendTime3value = null;
    this.breakTime = null;
    this.whours = null;
    this.errorMessage = "";
    this.errorMessageFlag = false;
    this.disableSaveButton = false;
    this.showbreak2 = false;
    this.showbreak3 = false;
    this.breakReadonly = false;

    // Clear Start Time
    this.uistarttime = null;
    this.startTimeSelectedHour = null;
    this.startTimeSelectedMinute = null;
    this.startTimeAMPM = null;

    // Clear End Time
    this.uiendTime = null;
    this.endTimeSelectedHour = null;
    this.endTimeSelectedMinute = null;
    this.endTimeAMPM = null;

    // Clear Break Start Time
    this.uibreakStartTime = null;
    this.breakStartHour = null;
    this.breakStartMinute = null;
    this.breakStartAMPM = null;

    // Clear Break End Time
    this.uibreakEndTime = null;
    this.breakEndHour = null;
    this.breakEndMinute = null;
    this.breakEndAMPM = null;

    // Clear Break Start Time
    this.uibreakStartTime2 = null;
    this.breakStartHour2 = null;
    this.breakStartMinute2 = null;
    this.breakStartAMPM2 = null;

    // Clear Break End Time
    this.uibreakEndTime2 = null;
    this.breakEndHour2 = null;
    this.breakEndMinute2 = null;
    this.breakEndAMPM2 = null;

    // Clear Break Start Time
    this.uibreakStartTime3 = null;
    this.breakStartHour3 = null;
    this.breakStartMinute3 = null;
    this.breakStartAMPM3 = null;

    // Clear Break End Time
    this.uibreakEndTime3 = null;
    this.breakEndHour3 = null;
    this.breakEndMinute3 = null;
    this.breakEndAMPM3 = null;

    // Optional: clear displayedTime if you are using it
    this._displayedTime = null;
    this.searchKey = null;
  }
  isManualSaveClick1 = false;
  handleManualSaveClick1() {
    this.isManualSaveClick1 = true;
  }

  handleSubmit1(event) {
    event.preventDefault();
    if (!this.isManualSaveClick1) {
      console.log("⛔ Submission prevented: likely from time picker.");
      return;
    }

    this.isManualSaveClick = false;

    if (this.errorMessageFlag) {
      return;
    }

    if (!this.starttime || !this.EndTime) {
    console.error("Start time or End time is missing.");
    this.showToast("Error", "Start Time and End Time are required.", "error");
    return;
  }


    console.log("this.breakstartTimevalue==>" + this.breakstartTimevalue);

    const fields = event.detail.fields;
    fields.End_Date__c = this.sDate;
    fields.Status__c = "Draft";
    fields.Start_Date_Time__c = this.starttime;
    console.log("fields.Start_Date_Time__c===>" + fields.Start_Date_Time__c);
    console.log("this.EndTime===>" + this.EndTime);
    fields.End_Date_Time__c = this.EndTime;
    console.log("fields.End_Date_Time__c===>" + fields.End_Date_Time__c);
    fields.Break_Start_Time__c = this.breakstartTimevalue;
    console.log("fields.Break_Start_Time__c===>" + fields.Break_Start_Time__c);
    fields.Break_End_Time__c = this.breakendTimevalue;
    console.log("fields.Break_End_Time__c===>" + fields.Break_End_Time__c);
    this.breakTime = this.breakTime.toString();
    console.log("this.breakTime===>" + this.breakTime);
    fields.Break__c = this.breakTime;
    console.log("fields.Break__c===>" + fields.Break__c);
    fields.Break_End_Time3__c = this.breakendTime3value;
    fields.Break_Start_Time3__c = this.breakstartTime3value;
    fields.Break_End_Time2__c = this.breakendTime2value;
    fields.Break_Start_Time2__c = this.breakstartTime2value;
    fields.Working_Hours__c = this.whours;
    console.log("After fields123>>" + JSON.stringify(fields));
    try {
      this.template
        .querySelector('lightning-record-edit-form[data-recid="ICTEditForm"]')
        .submit(fields);
      this.editflag1 = false;
      this.handleeditClose1();
    } catch (error) {
      console.error("Error while submitting the form:", error);
    }
  }

  @track invoiceRowList = [];
  handleAddShiftTimeData(event) {
    event.preventDefault();
    this.isTimePickerSelection = true;

    const childData = event.detail;
    
    const timeType = event.currentTarget.dataset.timetype;
    const displayTime = childData?.displaytime || "";
    const twentyFourHourFormat = childData?.twentyFourHourFormat || "";

    console.log("childData in parent " + JSON.stringify(childData));
    console.log("data type in parent " + timeType);

    // Helper function to trigger your existing break validation logic
    const triggerBreakChange = (fieldName, value) => {
      this.handleBreakStartEndechange({
        target: {
          fieldName: fieldName,
          value: value
        }
      });
    };
    const triggerBreakChange1 = (fieldName, value) => {
      this.handleBreakStartEndechange1({
        target: {
          name: fieldName,
          value: value
        }
      });
    };

    if (timeType === "IctStartTime") {
      this.starttime = twentyFourHourFormat;

      // Trigger handlechange manually
      this.handlechange({
        target: { name: "startTime", value: this.starttime }
      });
    } else if (timeType === "IctEndTime") {
      this.endTime = twentyFourHourFormat;

      // Trigger handlechange manually
      this.handlechange({
        target: { name: "Endtime", value: this.endTime }
      });
    } else if (timeType === "BreakStartTime") {
      this.breakStartTime = twentyFourHourFormat;
      triggerBreakChange("Break_Start_Time__c", this.breakStartTime);
    } else if (timeType === "BreakEndTime") {
      this.breakEndTime = twentyFourHourFormat;
      triggerBreakChange("Break_End_Time__c", this.breakEndTime);
    } else if (timeType === "BreakStartTime2") {
      this.breakStartTime2 = twentyFourHourFormat;
      triggerBreakChange("Break_Start_Time2__c", this.breakStartTime2);
    } else if (timeType === "BreakEndTime2") {
      this.breakEndTime2 = twentyFourHourFormat;
      triggerBreakChange("Break_End_Time2__c", this.breakEndTime2);
    } else if (timeType === "BreakStartTime3") {
      this.breakStartTime3 = twentyFourHourFormat;
      triggerBreakChange("Break_Start_Time3__c", this.breakStartTime3);
    } else if (timeType === "BreakEndTime3") {
      this.breakEndTime3 = twentyFourHourFormat;
      triggerBreakChange("Break_End_Time3__c", this.breakEndTime3);
    } else if (timeType === "eStartTime") {
      this.starttime = twentyFourHourFormat;
      this.handlechange1({
        target: { name: "starttime", value: this.starttime }
      });
    } else if (timeType === "eEndTime") {
      this.EndTime = twentyFourHourFormat;
      this.handlechange1({
        target: { name: "EndTime", value: this.EndTime }
      });
    } else if (timeType === "ebreakstartTimevalue") {
      this.breakstartTimevalue = twentyFourHourFormat;
      triggerBreakChange1("Break_Start_Time__c", this.breakstartTimevalue);
    } else if (timeType === "ebreakendTimevalue") {
      this.breakendTimevalue = twentyFourHourFormat;
      triggerBreakChange1("Break_End_Time__c", this.breakendTimevalue);
    } else if (timeType === "ebreakstartTime2value") {
      this.breakstartTime2value = twentyFourHourFormat;
      triggerBreakChange1("Break_Start_Time2__c", this.breakstartTime2value);
    } else if (timeType === "ebreakendTime2value") {
      this.breakendTime2value = twentyFourHourFormat;
      triggerBreakChange1("Break_End_Time2__c", this.breakendTime2value);
    } else if (timeType === "ebreakstartTime3value") {
      this.breakstartTime3value = twentyFourHourFormat;
      triggerBreakChange1("Break_Start_Time3__c", this.breakstartTime3value);
    } else if (timeType === "ebreakendTime3value") {
      this.breakendTime3value = twentyFourHourFormat;
      triggerBreakChange1("Break_End_Time3__c", this.breakendTime3value);
    }

    console.log("editflag" + this.editflag);

    // Reset time picker selection flag
    setTimeout(() => {
      this.isTimePickerSelection = false;
    }, 200);
  }
  get bDisableFirst() {
    return this.pageNumber == 1;
  }
  get bDisableLast() {
    return this.pageNumber == this.totalPages;
  }
  //Pagination code start
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
    this.finalStaffData = [];
    let sourceRecords = this.filteredRecords || this.paginationRecords;

    if (this.totalRecords > 0) {
      this.noRecordsFlag = false;
    } else {
      this.noRecordsFlag = true;
    }
    // calculate total pages
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
    // set page number
    if (this.pageNumber <= 1) {
      this.pageNumber = 1;
    } else if (this.pageNumber >= this.totalPages) {
      this.pageNumber = this.totalPages;
    }
    // set records to display on current page
    for (
      let i = (this.pageNumber - 1) * this.pageSize;
      i < this.pageNumber * this.pageSize;
      i++
    ) {
      if (i === this.totalRecords) {
        break;
      }
      let record = Object.assign({}, sourceRecords[i]);
      this.finalStaffData.push(record);
    }

    console.log(
      "this.finalStaffData in paginationHelper:",
      JSON.stringify(this.finalStaffData)
    );
  }
  handleSearchName(event) {
    this.searchName = event.target.value.toLowerCase();

    if (!this.searchName) {
      // Reset to full list if search is cleared
      this.filteredRecords = [...this.paginationRecords];
    } else {
      this.filteredRecords = this.paginationRecords.filter(
        (staff) =>
          (staff.Name && staff.Name.toLowerCase().includes(this.searchName)) ||
          (staff.Last_Name__c &&
            staff.Last_Name__c.toLowerCase().includes(this.searchName))
      );
    }

    // Update totalRecords and reset pagination
    this.totalRecords = this.filteredRecords.length;
    this.pageNumber = 1;

    // Refresh the paginated view
    this.paginationHelper();
  }
  cleardata() {
    this.uistarttime = null;
    this.startTimeSelectedHour = null;
    this.startTimeSelectedMinute = null;
    this.startTimeAMPM = null;

    // Clear End Time
    this.uiendTime = null;
    this.endTimeSelectedHour = null;
    this.endTimeSelectedMinute = null;
    this.endTimeAMPM = null;

    // Clear Break Start Time
    this.uibreakStartTime = null;
    this.breakStartHour = null;
    this.breakStartMinute = null;
    this.breakStartAMPM = null;

    // Clear Break End Time
    this.uibreakEndTime = null;
    this.breakEndHour = null;
    this.breakEndMinute = null;
    this.breakEndAMPM = null;

    // Clear Break Start Time
    this.uibreakStartTime2 = null;
    this.breakStartHour2 = null;
    this.breakStartMinute2 = null;
    this.breakStartAMPM2 = null;

    // Clear Break End Time
    this.uibreakEndTime2 = null;
    this.breakEndHour2 = null;
    this.breakEndMinute2 = null;
    this.breakEndAMPM2 = null;

    // Clear Break Start Time
    this.uibreakStartTime3 = null;
    this.breakStartHour3 = null;
    this.breakStartMinute3 = null;
    this.breakStartAMPM3 = null;

    // Clear Break End Time
    this.uibreakEndTime3 = null;
    this.breakEndHour3 = null;
    this.breakEndMinute3 = null;
    this.breakEndAMPM3 = null;

    // Optional: clear displayedTime if you are using it
    this._displayedTime = null;
    this.searchKey = null;
  }
}