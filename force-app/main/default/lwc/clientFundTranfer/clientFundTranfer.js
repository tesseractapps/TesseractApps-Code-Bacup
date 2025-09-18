import { LightningElement, track, api } from "lwc";
import savFundTransfer from "@salesforce/apex/ClientFundTransferHandler.savFundTransfer";
import fundTrackerRecord from "@salesforce/apex/ClientFundTransferHandler.fundTrackerRecord";
import ChartJS from "@salesforce/resourceUrl/chratJs";
import { loadScript } from "lightning/platformResourceLoader";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import fetchfundTracker from "@salesforce/apex/ClientFundTransferHandler.fetchfundTracker";
import getNDISServiceLineItem from "@salesforce/apex/ServiceSupportPlanHandler.getNDISServiceLineItem";
import insertClientFundTrackerLinks from "@salesforce/apex/ServiceSupportPlanHandler.insertClientFundTrackerLinks";
import getSelectedSupportItems from "@salesforce/apex/ClientFundTransferHandler.getSelectedSupportItems";
import deletedSelectedId from "@salesforce/apex/ClientFundTransferHandler.deletedSelectedId";
import checkFundExists from "@salesforce/apex/ClientFundTransferHandler.checkFundExists";
import organizationDetails from "@salesforce/apex/InvoiceHandler.organizationDetails";
import getClientById from "@salesforce/apex/ClientDataController.getClientById";
import getShiftsTypeByFacility from "@salesforce/apex/RosterInvoicesHandler.getShiftsTypeByFacility";
import fetchEntity from "@salesforce/apex/RosterInvoicesHandler.fetchEntity";
import fetchEntityfromFundtracker from "@salesforce/apex/RosterInvoicesHandler.fetchEntityfromFundtracker";

const actions = [{ label: "Edit", name: "edit" }];

export default class ClientFundTranfer extends LightningElement {
  //Nagendra code for Pagination Start
  @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
  @track records = []; //All records available in the data table
  @track columns = []; //columns information available in the data table
  @track totalRecords = 0; //Total no.of records
  @track pageSize; //No.of records to be displayed per page
  @track totalPages; //Total no.of pages
  @track pageNumber = 1; //Page number
  @track recordsToDisplay = []; //Records to be displayed on the page
  @track noRecordsFlag = false;

  get bDisableFirst() {
    return this.pageNumber == 1;
  }
  get bDisableLast() {
    return this.pageNumber == this.totalPages;
  }
  //Nagendra code for Pagination End

  @track chartJSLoaded;
  @track chart;
  @track creaetFundFlag = false;
  @track displayFundTracker = false;
  @track newAddFundTracker;
  @track createAddNew = false;
  @track isOpenModal = false;
  @track objectApiName = "Client__c";

  @track amountApprovedValue;
  @track amountApprovedDateValue;
  @track amount;
  @track gst;
  @track serviceStatus;
  @track description;
  @track serviceDate;
  @track fundTrackList = [];
  @api clientId;
  @track fundRecord;
  @track serviceType;
  @track approvedDate;
  @track amountApproved;
  @track availableFunds;
  @track error;
  @track accList;
  @track recordId;
  @track rowOffset = 0;
  @track isEdit = false;
  @track isFileAttached = false;
  @track statu;
  @track paginationVisible = false;
  @track headeringName;
  @track buttonName = "";
  @track showSpinner = false;
  @track noRecordsFlag = false;
  @track successmessage;
  @track filteredServiceTypeOptions = [];
  @track facilityId;
  @track shiftNameOptions = [];
  @track shiftNameValue;
  @track EntityNameOptions = [];
  @track selectedCardType = 'Customer';
  @track companyname;
  @track companyId;
  @track fundtracker = true;
  @track entityNameFlag = false; 

  @track columns = [
    {
      label: "Service Type",
      fieldName: "Registration_Group__c",
      initialWidth: 160,
      wrapText: true
    },
    {
      label: "Approved Start Date",
      fieldName: "Approved_Date__c",
      type: "date",
      typeAttributes: { day: "2-digit", month: "2-digit", year: "numeric" },
      initialWidth: 150
    },
    {
      label: "Approved Fund",
      fieldName: "Amount_approved__c",
      type: "currency",
      initialWidth: 150,
      cellAttributes: { alignment: "left" }
    },
    {
      label: "Spent",
      fieldName: "Spent_Amt__c",
      type: "currency",
      initialWidth: 80,
      cellAttributes: { alignment: "left" }
    },
    {
      label: "Available Funds",
      fieldName: "Available_Funds__c",
      type: "currency",
      initialWidth: 150,
      cellAttributes: { alignment: "left" }
    },
    { label: "Status", fieldName: "Status__c", initialWidth: 80 },
    {
      label: "Action",
      type: "action",
      initialWidth: 150,
      typeAttributes: {
        rowActions: actions
      }
    }
  ];

  get animationclass() {
    return this.template ? "right-align" : "right-align-reverse";
  }
  constructor() {
    super();
    this.chartJSLoaded = false;
  }

  handleFund() {
    this.displayFundTracker = false;
    fetchfundTracker({ clientId: this.clientId })
      .then((result) => {
        if (result != null) {
          this.records = result.map((item) => {
            return {
              id: item.Id,
              registrationGroup: item.Registration_Group__c,
              status: item.Status__c,
              approvedDate: item.Approved_Date__c
                ? new Date(item.Approved_Date__c).toLocaleDateString("en-GB")
                : "",
              amountApproved: item.Amount_approved__c
                ? Number(item.Amount_approved__c)
                : 0,
              availableFunds: item.Available_Funds__c
                ? Number(item.Available_Funds__c)
                : 0,
              spentAmount: item.Spent_Amt__c ? Number(item.Spent_Amt__c) : 0,
              state: item.State__c
            };
          });

          this.totalRecords = result.length; // update total records count
          this.pageSize = this.pageSizeOptions[0]; //set pageSize with default value as first option
          this.pageNumber = 1;
          if (this.totalRecords > 0) {
            this.paginationVisible = true;
          }
          this.paginationHelper(); // call helper menthod to update pagination logic
          this.newAddFundTracker = true;
          this.displayFundTracker = true;
        } else {
          this.newAddFundTracker = false;
          this.displayFundTracker = false;
        }
      })
      .catch((error) => {
        this.accList = undefined;
        this.error = error;
      });
  }

  connectedCallback() {
      this.handleFund();

      fundTrackerRecord({ clientId: this.clientId }).then((response) => {
        if (response === null) {
          // do nothing
        } else {
          this.fundRecord = response.Id;
          this.displayFundTracker = true;
        }
      });

      this.fetchInitialData();

      getClientById({ recordId: this.clientId })
        .then((result) => {
          console.log(" client result " + JSON.stringify(result));
          this.otherThanNdis =
            result[0].Facility__r.Type_of_Service__c != "NDIS";
          console.log("188 line this.otherThanNdis :" + this.otherThanNdis);

          this.facilityId = result[0].Facility__c;
          console.log("this.facilityId >>> ", this.facilityId);
          this.loadEntityProfiles();

          // 🔹 Call fetchShiftData here
          this.fetchShiftData(this.facilityId)
            .then((shifts) => {
              console.log("✅ Shifts fetched:", JSON.stringify(shifts));

              // 🔹 Transform into { label, value } format
              this.shiftNameOptions = shifts.map((shift) => ({
                label: shift.Name,
                value: shift.Id
              }));

              console.log("📌 shiftNameOptions:", JSON.stringify(this.shiftNameOptions));
            })
            .catch((error) => {
              console.error("❌ Error loading shifts:", error);
              this.shiftNameOptions = [];
            });


          if (this.otherThanNdis) {
            this.filteredServiceTypeOptions = this.serviceTypeOption.filter(
              (option) => option.value.trim().includes("Others")
            );
          }else {
            this.filteredServiceTypeOptions = this.serviceTypeOption.filter(
              (option) => !option.value.trim().includes("Others")
            );
          }

          if (this.filteredServiceTypeOptions.length > 0) {
            this.serviceTypeName = this.filteredServiceTypeOptions[0].value;
          } else {
            this.serviceTypeName = null;
          }

          console.log(
            "filteredServiceTypeOptions: " +
              JSON.stringify(this.filteredServiceTypeOptions)
          );
        })
        .catch((error) => {
          console.error("❌ Error in getClientById:", error);
        });
    }
    
    fetchShiftData(facilityId) {
      try {
        const result = getShiftsTypeByFacility({ facilityId });
        return result;
      } catch (error) {
        console.error("❌ Error fetching shifts:", error);
        this.shiftNameOptions = [];
        throw error; // rethrow to let calling function handle it
      }
    }

  /* loadEntityProfiles() {
    console.log('this.facilityId >>> loadEntityProfiles', this.facilityId);

    fetchEntity({ facilityId: this.facilityId })
      .then((result) => {
        console.log("✅ Entity Profiles:", JSON.stringify(result));

        this.companyname = result.Company__r.Company_Name__c;
        this.companyId = result.Company__c;

        console.log('this.companyname  in Fund>>>>>>', this.companyname);
        console.log('this.companyId  in Fund>>>>>>', this.companyId);


        // Map result into combobox options
        this.EntityNameOptions = (result || []).map((profile) => ({
          label: `${profile.First_Name__c || ""} ${profile.Last_Name__c || ""}`.trim() || profile.Name__c,
          value: profile.Id
        }));

        // ✅ Ensure "Add New Entity" option exists
        // if (!this.EntityNameOptions.some(option => option.value === 'Add New Entity')) {
        //   this.EntityNameOptions.push({ label: ' + Add New Entity', value: 'Add New Entity' });
        // }

        console.log("🔹 EntityNameOptions (with Add option):", JSON.stringify(this.EntityNameOptions));
      })
      .catch((error) => {
        console.error("❌ Error fetching Entity Profiles:", error);
        this.error = error;
        this.EntityNameOptions = [{ label: ' + Add New Entity', value: 'Add New Entity' }]; // fallback
      });
  } */
  
  loadEntityProfiles() {
      console.log('this.facilityId >>> loadEntityProfiles', this.facilityId);

      fetchEntity({ facilityId: this.facilityId })
        .then((result) => {
          console.log("✅ Entity Profiles:", JSON.stringify(result));

          // ✅ Check if result has data
          if (result && result.length > 0) {
            // Take company details from the first record
            this.companyname = result[0].Company__r?.Company_Name__c || '';
            this.companyId = result[0].Company__c || '';

            console.log('this.companyname in Fund >>>>>>', this.companyname);
            console.log('this.companyId in Fund >>>>>>', this.companyId);
          } else {
            this.companyname = '';
            this.companyId = '';
          }

          // ✅ Map result into combobox options
          this.EntityNameOptions = (result || []).map((profile) => ({
            label: `${profile.First_Name__c || ""} ${profile.Last_Name__c || ""}`.trim() || profile.Name__c,
            value: profile.Id
          }));

          // Optional: Add "Add New Entity" option
          if (!this.EntityNameOptions.some(option => option.value === 'Add New Entity')) {
            this.EntityNameOptions.push({ label: ' + Add New Entity', value: 'Add New Entity' });
          }

          console.log("🔹 EntityNameOptions (with Add option):", JSON.stringify(this.EntityNameOptions));
          if(this.entityNameFlag === true){
              this.isNewEntityFlag = false;  // reset flag when child says cancel
              this.fundtracker = true;
              this.entityNameFlag = false;
          }
        })
        .catch((error) => {
          console.error("❌ Error fetching Entity Profiles:", error);
          this.error = error;
          this.EntityNameOptions = [{ label: ' + Add New Entity', value: 'Add New Entity' }]; // fallback
        });
    }



  @track orgId;
  @track otherThanNdis = true;


  fetchInitialData() {
    organizationDetails().then((response) => {
      console.log("response of fetchInitialData: " + JSON.stringify(response));
      this.orgId = response.listofPriceBook.Id;
    });
  }

  @track serviceTypeOption = [
        { label: "Assistance Animals", value: "Assistance Animals" },
        { label: "Assistance in Coordinating or Managing Life Stages, Transitions and Supports", value: "Assistance in Coordinating or Managing Life Stages, Transitions and Supports" },
        { label: "Assistance to Access and Maintain Employment or higher education", value: "Assistance to Access and Maintain Employment or higher education" },
        { label: "Assistance with Daily Life Tasks in a Group or Shared Living Arrangement", value: "Assistance with Daily Life Tasks in a Group or Shared Living Arrangement" },
        { label: "Assistance with Travel/Transport Arrangements", value: "Assistance with Travel/Transport Arrangements" },
        { label: "Assistive Equipment for Recreation", value: "Assistive Equipment for Recreation" },
        { label: "Assistive Products for Household Tasks", value: "Assistive Products for Household Tasks" },
        { label: "Assistive Products for Personal Care and Safety", value: "Assistive Products for Personal Care and Safety" },
        { label: "Communication and Information Equipment", value: "Communication and Information Equipment" },
        { label: "Community Nursing Care", value: "Community Nursing Care" },
        { label: "Customised Prosthetics (includes Orthotics)", value: "Customised Prosthetics (includes Orthotics)" },
        { label: "Daily Personal Activities", value: "Daily Personal Activities" },
        { label: "Development of Daily Living and Life Skills", value: "Development of Daily Living and Life Skills" },
        { label: "Early Intervention Supports for Early Childhood", value: "Early Intervention Supports for Early Childhood" },
        { label: "Exercise Physiology & Personal Well-being Activities", value: "Exercise Physiology & Personal Well-being Activities" },
        { label: "Group and Centre Based Activities", value: "Group and Centre Based Activities" },
        { label: "Hearing Equipment", value: "Hearing Equipment" },
        { label: "Hearing Services", value: "Hearing Services" },
        { label: "High Intensity Daily Personal Activities", value: "High Intensity Daily Personal Activities" },
        { label: "Home Modification Design and Construction", value: "Home Modification Design and Construction" },
        { label: "Household Tasks", value: "Household Tasks" },
        { label: "Innovative Community Participation", value: "Innovative Community Participation" },
        { label: "Interpreting and Translation", value: "Interpreting and Translation" },
        { label: "Management of Funding for Supports", value: "Management of Funding for Supports" },
        { label: "Participation in Community, Social and Civic Activities", value: "Participation in Community, Social and Civic Activities" },
        { label: "Personal Mobility Equipment", value: "Personal Mobility Equipment" },
        { label: "Specialised Disability Accommodation", value: "Specialised Disability Accommodation" },
        { label: "Specialised Driver Training", value: "Specialised Driver Training" },
        { label: "Specialised Hearing Services ", value: "Specialised Hearing Services " },
        { label: "Specialised Supported Employment", value: "SSpecialised Supported Employment" },
        { label: "Specialist Positive Behaviour Support", value: "Specialist Positive Behaviour Support" },
        { label: "Support Coordination", value: "Support Coordination" },
        { label: "Therapeutic Supports", value: "Therapeutic Supports" },
        { label: "Vehicle Modifications", value: "Vehicle Modifications" },
        { label: "Vision Equipment", value: "Vision Equipment" },
        { label: "Miscellaneous - Morning", value: "Miscellaneous - Morning" },
        { label: "Miscellaneous - Afternoon", value: "Miscellaneous - Afternoon" },
        { label: "Miscellaneous - Evening", value: "Miscellaneous - Evening" },
        { label: "Miscellaneous - Night", value: "Miscellaneous - Night" },
        { label: "Miscellaneous - Sleep Over", value: "Miscellaneous - Sleep Over" },
        { label: "Miscellaneous - Public Holiday", value: "Miscellaneous - Public Holiday" },
        { label: "Miscellaneous - Saturday", value: "Miscellaneous - Morning" },
        { label: "Miscellaneous - Sunday", value: "Miscellaneous - Sunday" },
        { label: "Miscellaneous - Weekends", value: "Miscellaneous - Weekends" },
        { label: "Others - Morning", value: "Others - Morning" },
        { label: "Others - Afternoon", value: "Others - Afternoon" },
        { label: "Others - Evening", value: "Others - Evening" },
        { label: "Others - Night", value: "Others - Night" },
        { label: "Others - Sleep Over", value: "Others - Sleep Over" },
        { label: "Others - Public Holiday", value: "Others - Public Holiday" },
        { label: "Others - Saturday", value: "Others - Saturday" },
        { label: "Others - Sunday", value: "Others - Sunday" },
        { label: "Others - Weekends", value: "Others - Weekends" },
    ];

  handleFundSpent() {
    console.log("calling method");
    this.createAddNew = true;
    this.successmessage = "Fund created successfully.";
    this.creaetFundFlag = false;
    this.displayFundTracker = true;
    this.recordId = "";
    this.serviceGroupName = [];
    this.stateValue = "";
    this.headeringName = "Add New Fund";
    this.buttonName = "Save";
    this.NdisServiceGroupName = false;
    this.serviceTypeName = "";
    this.saveDisabled = true;
    this.EntityNameValue = "";
    this.shiftNameValue = "";
     console.log('this.EntityNameOptions.length '+this.EntityNameOptions.length) ;
     if(this.EntityNameOptions.length==0){
       this.dispatchEvent(
            new ShowToastEvent({
              title: "Warning",
              message: "No entity options available. Please set up an entity for this participant's facility.",
              variant: "warning"
            })
          );
           return;
     }
  }

  //Nagendra Pagination code start
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
    this.accList = [];
    if (this.totalRecords > 0) {
      this.noRecordsFlag = false;
    } else {
      this.noRecordsFlag = true;
    }
    if (this.totalRecords > 0) {
      this.noRecordsFlag = false;
    } else {
      this.noRecordsFlag = true;
    }
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
    if (this.pageNumber <= 1) {
      this.pageNumber = 1;
    } else if (this.pageNumber >= this.totalPages) {
      this.pageNumber = this.totalPages;
    }
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
    console.log("accList" + JSON.stringify(this.accList));
  }
  //Nagendra Pagination Code End

  handleClose() {
    this.createAddNew = false;
  }

  renderedCallback() {
    loadScript(this, ChartJS)
      .then(() => {
        this.chartJSLoaded = true;
        this.template.querySelector("c-pie-chart-lwc ").buildChart();
      })
      .catch((error) => {});
  }

  handleError(event) {
    this.showToast(event.detail.detail);
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
    this.createAddNew = false;
    this.isEdit = false;
    this.displayFundTracker = true;
  }

  toast(title) {
    const toastEvent = new ShowToastEvent({
      title,
      variant: "success"
    });
    this.dispatchEvent(toastEvent);
  }

  @track supportCatalogList = []; // List of all NDIS Support Catalog items
  @track preSelectedSupportItemIds = [];

  handleRowActions(event) {
    const actionName = event.currentTarget.dataset.name;
    const rowId = event.currentTarget.dataset.accid;
    console.log("row: " + rowId);
    this.recordId = rowId;
    this.stateValue = event.currentTarget.dataset.state;
    console.log("State values in edit :" + this.stateValue);
    this.serviceTypeName = event.currentTarget.dataset.fundname;
    console.log("on edit service type :" + this.serviceTypeName);
    this.approvedDate = event.currentTarget.dataset.approveddate;
    console.log("Raw approved date:", this.approvedDate);

    // Format the approved date from dd/mm/yyyy to yyyy-mm-dd
    if (this.approvedDate) {
      const parts = this.approvedDate.split("/");
      if (parts.length === 3) {
        const day = parts[0].padStart(2, "0");
        const month = parts[1].padStart(2, "0");
        const year = parts[2];
        this.approvedDate = `${year}-${month}-${day}`;
        console.log("Formatted approved date (yyyy-mm-dd):", this.approvedDate);
      } else {
        console.error("Unexpected approvedDate format:", this.approvedDate);
      }
    }

    if (actionName === "edit") {
      this.headeringName = "Update Funds Tracker";
      this.successmessage = "Fund updated successfully.";
      this.isEdit = true;
      this.createAddNew = false; // make sure add mode is OFF
      this.displayFundTracker = false;
      this.Miscellaneous =false;
      this.saveDisabled=false;
      this.buttonName = "Update";
      this.serviceGroupName = [];
       if(this.EntityNameOptions.length==0){
       this.dispatchEvent(
            new ShowToastEvent({
              title: "Warning",
              message: "No entity options available. Please set up an entity for this participant's facility.",
              variant: "warning"
            })
          );
          return;
     }

      fetchEntityfromFundtracker({
          fundTrackerId: rowId
      })
        .then((ndisResponse) => {
          console.log("✅ NDIS Service Line Items Response:", JSON.stringify(ndisResponse));

          if (ndisResponse && ndisResponse.length > 0) {
            // Store values from first record
            this.shiftNameValue = ndisResponse[0].Shift_Name__c;
            this.EntityNameValue = ndisResponse[0].Entity_Profile__c;

            console.log("🟩 Stored shiftNameValue:", this.shiftNameValue);
            console.log("🟦 Stored EntityNameValue:", this.EntityNameValue);
          } else {
            console.warn("⚠️ No NDIS Service Line Items returned.");
            this.shiftNameValue = null;
            this.EntityNameValue = null;
          }
        })
        .catch((error) => {
          console.error("❌ Error fetching Entity from Fundtracker:", error);
        });


      getNDISServiceLineItem({
        ServiceItemNames: this.serviceTypeName,
        ServiceDate: this.approvedDate,
        fundTrackerId: rowId   // ✅ send rowId to Apex
      })
        .then((ndisResponse) => {
          let fetchedItems = ndisResponse.map((item) => {
            const amount = item[this.stateValue];
            return {
              ...item,
              amount: amount !== undefined ? amount : 0.0,
              checkbox: false // default unchecked
            };
          });
        })

      // Step 1: Fetch NDIS Service Line Items
      getNDISServiceLineItem({
        ServiceItemNames: this.serviceTypeName,
        ServiceDate: this.approvedDate
      })
        .then((ndisResponse) => {
          let fetchedItems = ndisResponse.map((item) => {
            const amount = item[this.stateValue];
            return {
              ...item,
              amount: amount !== undefined ? amount : 0.0,
              checkbox: false ,// default unchecked,
              serviceSupportItem:item.Support_Item_Name__c
            };
          });

          // Step 2: Fetch selected support items
          return getSelectedSupportItems({
            fundTrackerId: rowId,
            clientId: this.clientId,
            state: this.stateValue
          })
            .then((selectedItems) => {
              console.log(
                "Selected Items from EDIT: " + JSON.stringify(selectedItems)
              );
              console.log('service type name==> '+this.serviceTypeName )
              // Step 3: Mark matched items as selected
              fetchedItems = fetchedItems.map((item) => {
                const match = selectedItems.find(
                  (sel) => sel.NDIS_Support_Catalogue__c === item.Id
                );
                if (match) {
                  let updatedItem = {
                    ...item,
                    junctionId: match.Id,
                    isSelected: true
                  };

                  if ((this.otherThanNdis === true)|| (this.serviceTypeName.includes("Miscellaneous") && this.otherThanNdis === false)) {
                    // Use Amount from junction record
                    updatedItem.amount = match.Amount__c ?match.Amount__c :item[this.stateValue];
                    console.log("if logs 452 :" + updatedItem.amount);
                      this.Miscellaneous =true;
                    updatedItem.serviceSupportItem =match.Edited_Catelog_Name__c ?match.Edited_Catelog_Name__c :item.Support_Item_Name__c
                  } else{
                    const amount = item[this.stateValue];
                    updatedItem.amount = amount !== undefined ? amount : 0.0;
                    console.log("else logs 457 :" + updatedItem.amount);
                  }

                  return updatedItem;
                }
                return item;
              });
              console.log("Get Amount value :" + JSON.stringify(fetchedItems));
              this.records1 = fetchedItems;
              this.totalRecords1 = this.records1.length;
              this.pageSize1 = this.pageSizeOptions1[0];
              this.pageNumber1 = 1;
              this.paginationHelper1();
              this.NdisServiceGroupName = true;
              console.log(
                "Updated serviceGroupName with checkbox and Id:",
                JSON.stringify(this.serviceGroupName)
              );
            })
            .catch((error) => {
              console.error("Error fetching selected support items: ", error);
              this.serviceGroupName = fetchedItems;
            });
        })
        .catch((error) => {
          console.error("Error fetching NDIS Catalog data", error);
          this.serviceGroupName = [];
        });
    }
  } 

  // Method to determine if a checkbox should be pre-checked
  isChecked(itemId) {
    return this.selectedServiceRows.includes(itemId);
  }

  @track serviceTypeName = "";
  @track NdisServiceGroupName = false;
  @track serviceGroupName = [];
  @track isDisbaleServiceButton = false;
  @track stateValue = "";
  @track errorMessage;

  @track errorMessageFlag = false;
  @track ServiceStateEditValue = "";
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

  handleShiftNameChange(event) {
      this.shiftNameValue = event.detail.value; // stores the selected Id
      console.log("✅ Selected Shift Id:", this.shiftNameValue);

      // If you also want the selected label
      const selectedOption = this.shiftNameOptions.find(
          (option) => option.value === this.shiftNameValue
      );
      if (selectedOption) {
          console.log("📌 Selected Shift Label:", selectedOption.label);
          this.selectedShiftLabel = selectedOption.label; // store separately if needed
      }
  }

// Keep this property in your JS
lastValidEntityValue;

// On change
handleEntityNameChange(event) {
    console.log('⚡ [onchange fired] ------------------------');

    const newValue = event.detail.value;
    console.log('➡️ event.detail.value:', newValue);

    // set the tracked value
    this.EntityNameValue = newValue;
    console.log('📌 this.EntityNameValue set to:', this.EntityNameValue);

    const selectedOption = this.EntityNameOptions.find(opt => opt.value === newValue);
    const selectedLabel = selectedOption ? selectedOption.label : null;

    console.log('🔹 Selected Entity Value:', newValue);
    console.log('🔹 Selected Entity Label:', selectedLabel);
    console.log('🔸 selectedCardType   >>>', this.selectedCardType);
    console.log('🔸 companyname   >>>', this.companyname);
    console.log('🔸 companyId   >>>', this.companyId);
    console.log('📋 Current options:', JSON.stringify(this.EntityNameOptions));

    // If user picks Add New Entity
    if (newValue === 'Add New Entity') {
      console.log("🚨 'Add New Entity' selected");

      // validation: must have companyId
      if (!this.companyId) {
        console.log('❌ Validation failed: companyId is empty');

        // clear combobox so next click is a new change
        this.EntityNameValue = null;
        this.EntityNameOptions = [...this.EntityNameOptions]; // force refresh
        console.log('🧹 Reset EntityNameValue ->', this.EntityNameValue);

        // clear persisted storage so it doesn't re-select after reload
        localStorage.removeItem('defaultEntityNameValue');
        localStorage.removeItem('defaultEntityNameLabel');
        console.log('🗑️ localStorage cleared');

        // show error toast
        this.dispatchEvent(
          new ShowToastEvent({
            title: 'Error',
            message: 'Please create a company before adding a new entity.',
            variant: 'error'
          })
        );
        console.log('✅ Error toast dispatched');

        // ensure UI truly resets after LWC microtask — helps in some edge cases
        setTimeout(() => {
          this.EntityNameValue = null;
          this.EntityNameOptions = [...this.EntityNameOptions];
          console.log('🔄 Forced reset after timeout ->', this.EntityNameValue);
        }, 0);

        console.log('⚡ [onchange END - error case]');
        return;
      }

      // Passed validation: proceed with add-new flow
      console.log('✅ companyId exists, proceeding with Add New Entity flow');
      this.isNewEntityFlag = true;
      this.fundtracker = false;
      console.log('🏁 isNewEntityFlag:', this.isNewEntityFlag);
      console.log('🏁 fundtracker:', this.fundtracker);
      console.log('⚡ [onchange END - Add New Entity success]');
    } else {
      // Normal selection - persist and update last valid
      console.log('✅ Normal entity selected, saving to localStorage');
      this.lastValidEntityValue = newValue;
      localStorage.setItem('defaultEntityNameValue', newValue);
      if (selectedLabel) {
        localStorage.setItem('defaultEntityNameLabel', selectedLabel);
      }
      console.log('💾 Saved values:', {
        defaultEntityNameValue: newValue,
        defaultEntityNameLabel: selectedLabel
      });
      console.log('⚡ [onchange END - normal selection]');
    }
  }



  handleServiceChange(event) {
    const name = event.target.name;
    const value = event.target.value;
    if (name === "serviceType") {
      this.serviceTypeName = value;
      console.log("443 line " + this.serviceTypeName);
    } else if (name === "approvedDate") {
      this.approvedDate = value;
    }
    console.log("Approved Date : " + this.approvedDate);

    this.serviceGroupName = [];
    this.NdisServiceGroupName = false;
    this.stateValue = "";

    if (this.serviceTypeName && this.clientId) {
      checkFundExists({
        clientId: this.clientId,
        serviceType: this.serviceTypeName,
        shiftName:this.shiftNameValue
      }).then((exists) => {
        if (exists) {
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Warning",
              message: "Fund already exists for this Participant.",
              variant: "warning"
            })
          );
          this.serviceGroupName = []; // clear items
          return;
        } else {
          // Optional: Call fetch logic if no duplicate fund found
          getNDISServiceLineItem({
            ServiceItemNames: this.serviceTypeName,
            ServiceDate: this.approvedDate
          })
            .then((response) => {
              this.serviceGroupName = response.map((item) => ({
                ...item
              }));
            })
            .catch((error) => {
              console.error("Error fetching NDIS Catalog:", error);
              this.serviceGroupName = [];
            });
        }
      });
    }

    if (this.serviceTypeName && this.approvedDate) {
      // this.isDisbaleServiceButton = true;
      const approvedDateObj = new Date(this.approvedDate);

      // const approvedDateObj = new Date(this.approvedDate);
      const formattedApprovedDate = approvedDateObj.toISOString().split("T")[0];

      console.log("Approved Date:", formattedApprovedDate);

      // Define financial year ranges
      const fy2023Start = new Date("2023-07-01");
      const fy2024End = new Date("2099-06-30");

      console.log("Approved Date Object:", approvedDateObj);
      console.log("FY Start:", fy2023Start, "FY End:", fy2024End);

      // Check if the approved date falls within 2023-24 or 2024-25 FY
      if (approvedDateObj < fy2023Start || approvedDateObj > fy2024End) {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Invalid Date",
            message:
              "Please select an Approved Date after July 1st 2023 financial year.",
            variant: "error"
          })
        );
        return;
      }

      getNDISServiceLineItem({
        ServiceItemNames: this.serviceTypeName,
        ServiceDate: this.approvedDate
      })
        .then((response) => {
          console.log("Response Data :" + JSON.stringify(response));
          this.serviceGroupName = response.map((item) => ({
            ...item /* ,
                        isSelected: false */ // optional checkbox management
          }));
          console.log(
            "Fetched NDIS Catalog items:",
            JSON.stringify(this.serviceGroupName)
          );
        })
        .catch((error) => {
          console.error("Error fetching NDIS Catalog data", error);
          this.serviceGroupName = [];
        });
    } else {
      this.NdisServiceGroupName = false;
      this.serviceGroupName = [];
    }
  }
  @track selectedSupportItemsGlobal = []; // holds selected items across states
  @track Miscellaneous = false;
 
  /* handleServiceStateChange(event) {
    this.stateValue = event.target.value;
    this.NdisServiceGroupName = false;
     this.Miscellaneous = false;
    console.log("🟦 Selected State Value:", this.stateValue);

    // 🔹 Reset serviceGroupName string on every state change
    this.serviceGroupName = [];

    if (this.stateValue) {
      const selectedLabel = this.stateOptions.find(
        (opt) => opt.value === this.stateValue
      )?.label;
      this.selectedStateForBackend = selectedLabel;
      console.log("🟩 Selected State Label for Backend:", this.selectedStateForBackend);
      console.log("🟧 Service Type Name:", this.serviceTypeName);
      console.log("🟨 Approved Date:", this.approvedDate);

      getNDISServiceLineItem({
        ServiceItemNames: this.serviceTypeName,
        ServiceDate: this.approvedDate
      })
        .then((ndisResponse) => {
          console.log("✅ NDIS Service Line Response:", JSON.stringify(ndisResponse));

          let newStateItems = ndisResponse.map((item) => {
            const amount = item[this.stateValue];
            const mappedItem = {
              ...item,
              amount: amount !== undefined ? amount : 0.0,
              isSelected: this.otherThanNdis ? true : false,
              serviceSupportItem: item.Support_Item_Name__c
            };
            console.log("🔹 Mapped Item:", JSON.stringify(mappedItem));
            return mappedItem;
          });

          console.log("🟦 All newStateItems after mapping:", JSON.stringify(newStateItems));

          if (this.otherThanNdis === true) {
            console.log("⚡ Other Than NDIS = true");
            this.saveDisabled = false;
            this.Miscellaneous = false;
            this.selectedServiceRows = [];

            newStateItems.forEach((item) => {
              if (item.isSelected) {
                const alreadyAdded = this.selectedServiceRows.some(
                  (row) => row.Id === item.Id
                );
                if (!alreadyAdded) {
                  console.log("➕ Adding Selected Row:", item.Id);
                  this.selectedServiceRows.push(item);
                }
              }
            });
            console.log("🟩 Selected Service Rows:", JSON.stringify(this.selectedServiceRows));
          } else if ( this.serviceTypeName.includes("Miscellaneous") && this.otherThanNdis === false) {
            this.Miscellaneous = true;
            this.saveDisabled = true;
          }

          if (this.isEdit) {
            console.log("✏️ Edit Mode Enabled");

            return getSelectedSupportItems({
              fundTrackerId: this.recordId,
              clientId: this.clientId,
              state: this.stateValue
            }).then((previouslySelected) => {
              console.log("📥 Previously Selected Items:", JSON.stringify(previouslySelected));

              newStateItems = newStateItems.map((item) => {
                const match = previouslySelected.find(
                  (sel) => sel.NDIS_Support_Catalogue__c === item.Id
                );
                if (match) {
                  console.log("✔️ Match Found for Item:", item.Id);
                  item.isSelected = true;
                  item.junctionId = match.Id;
                  item.serviceSupportItem= item.Support_Item_Name__c;
                }
                return item;
              });

              const previouslySelectedIds = this.selectedSupportItemsGlobal.map((i) => i.Id);
              console.log("🟦 Previously Selected Global IDs:", JSON.stringify(previouslySelectedIds));

              const newSelections = newStateItems.filter(
                (i) => i.isSelected && !previouslySelectedIds.includes(i.Id)
              );
              console.log("🟩 New Selections to Add:", JSON.stringify(newSelections));

              this.selectedSupportItemsGlobal = [
                ...this.selectedSupportItemsGlobal,
                ...newSelections
              ];
              console.log("🌍 Updated selectedSupportItemsGlobal:", JSON.stringify(this.selectedSupportItemsGlobal));

              const allItemsMap = new Map();
              [...this.selectedSupportItemsGlobal, ...newStateItems].forEach((item) => {
                allItemsMap.set(item.Id, item);
              });

              this.records1 = Array.from(allItemsMap.values());
              console.log("📊 Final Records1 in Edit Mode:", JSON.stringify(this.records1));

              this.totalRecords1 = this.records1.length;
              this.pageSize1 = this.pageSizeOptions1[0];
              this.pageNumber1 = 1;
              this.paginationHelper1();
            });
          } else {
            console.log("🆕 Create Mode");

            const newSelections = newStateItems.filter((i) => i.isSelected);
            console.log("🟨 New Selections (Create):", JSON.stringify(newSelections));

            const previouslySelectedIds = this.selectedSupportItemsGlobal.map((i) => i.Id);
            console.log("🟧 Previously Selected IDs (Global):", JSON.stringify(previouslySelectedIds));

            const mergedSelections = [...this.selectedSupportItemsGlobal];
            newSelections.forEach((item) => {
              if (!previouslySelectedIds.includes(item.Id)) {
                console.log("➕ Adding to mergedSelections:", item.Id);
                mergedSelections.push(item);
              }
            });

            this.selectedSupportItemsGlobal = mergedSelections;
            console.log("🌍 Updated selectedSupportItemsGlobal (Create):", JSON.stringify(this.selectedSupportItemsGlobal));

            const allItemsMap = new Map();
            [...this.selectedSupportItemsGlobal, ...newStateItems].forEach((item) => {
              allItemsMap.set(item.Id, item);
            });

            this.records1 = Array.from(allItemsMap.values());
            console.log("📊 Final Records1 in Create Mode:", JSON.stringify(this.records1));

            this.totalRecords1 = this.records1.length;
            this.pageSize1 = this.pageSizeOptions1[0];
            this.pageNumber1 = 1;
            this.paginationHelper1();
          }
        })
        .catch((error) => {
          console.error("❌ Error fetching records after state change:", error);
          this.records1 = [];
        });
    }
  } */


  handleServiceStateChange(event) {
      this.stateValue = event.target.value;
      this.NdisServiceGroupName = false;
      this.Miscellaneous = false;
      console.log("🟦 Selected State Value:", this.stateValue);

      // IMPORTANT: Clear previous state so results DO NOT merge across onchange calls
      this.serviceGroupName = [];              // visible group items for the selected state
      this.selectedServiceRows = [];           // rows used for the "otherThanNdis" flow
      this.selectedSupportItemsGlobal = [];    // global selected items (reset every onchange)
      this.records1 = [];                      // final records shown in the table
      this.totalRecords1 = 0;
      this.pageNumber1 = 1;
      // (optionally) reset pagination size if needed:
      // this.pageSize1 = this.pageSizeOptions1[0];

      if (this.stateValue) {
        const selectedLabel = this.stateOptions.find(
          (opt) => opt.value === this.stateValue
        )?.label;
        this.selectedStateForBackend = selectedLabel;
        console.log("🟩 Selected State Label for Backend:", this.selectedStateForBackend);
        console.log("🟧 Service Type Name:", this.serviceTypeName);
        console.log("🟨 Approved Date:", this.approvedDate);

        getNDISServiceLineItem({
          ServiceItemNames: this.serviceTypeName,
          ServiceDate: this.approvedDate
        })
          .then((ndisResponse) => {
            console.log("✅ NDIS Service Line Response:", JSON.stringify(ndisResponse));

            // Map response into UI items
            let newStateItems = ndisResponse.map((item) => {
              const amount = item[this.stateValue];
              const mappedItem = {
                ...item,
                amount: amount !== undefined ? amount : 0.0,
                isSelected: this.otherThanNdis ? true : false,
                serviceSupportItem: item.Support_Item_Name__c
              };
              console.log("🔹 Mapped Item:", JSON.stringify(mappedItem));
              return mappedItem;
            });

            console.log("🟦 All newStateItems after mapping:", JSON.stringify(newStateItems));

            // Set serviceGroupName to only the latest items (no merging)
            this.serviceGroupName = [...newStateItems];
            console.log("✅ Updated serviceGroupName:", JSON.stringify(this.serviceGroupName));

            // Handle otherThanNdis flow (only use newStateItems)
            if (this.otherThanNdis === true) {
              console.log("⚡ Other Than NDIS = true");
              this.saveDisabled = false;
              this.Miscellaneous = false;
              // Only selected rows from the current response
              this.selectedServiceRows = newStateItems.filter((i) => i.isSelected);
              console.log("🟩 Selected Service Rows:", JSON.stringify(this.selectedServiceRows));
            } else if (this.serviceTypeName && this.serviceTypeName.includes("Miscellaneous") && this.otherThanNdis === false) {
              this.Miscellaneous = true;
              this.saveDisabled = true;
            }

            // EDIT MODE: get previously selected items for THIS fund/client/state
            if (this.isEdit) {
              console.log("✏️ Edit Mode Enabled (will fetch previously selected for this record/state)");
              return getSelectedSupportItems({
                fundTrackerId: this.recordId,
                clientId: this.clientId,
                state: this.stateValue
              }).then((previouslySelected) => {
                console.log("📥 Previously Selected Items (junctions):", JSON.stringify(previouslySelected));

                // Mark matching items in newStateItems as selected and attach junction id
                newStateItems = newStateItems.map((item) => {
                  const match = previouslySelected.find(
                    (sel) => sel.NDIS_Support_Catalogue__c === item.Id
                  );
                  if (match) {
                    console.log("✔️ Match Found for Item (marking selected):", item.Id);
                    item.isSelected = true;
                    item.junctionId = match.Id;
                    item.serviceSupportItem = item.Support_Item_Name__c;
                  }
                  return item;
                });

                // For edit, selectedSupportItemsGlobal should be the items selected for THIS state:
                this.selectedSupportItemsGlobal = newStateItems.filter((i) => i.isSelected);
                console.log("🌍 selectedSupportItemsGlobal (Edit) set to:", JSON.stringify(this.selectedSupportItemsGlobal));

                // Build records1 = union of current available items + selected items (dedup by Id)
                const allItemsMap = new Map();
                [...this.selectedSupportItemsGlobal, ...newStateItems].forEach((item) => {
                  allItemsMap.set(item.Id, item);
                });
                this.records1 = Array.from(allItemsMap.values());
                console.log("📊 Final Records1 in Edit Mode:", JSON.stringify(this.records1));

                // pagination
                this.totalRecords1 = this.records1.length;
                this.pageSize1 = this.pageSizeOptions1[0];
                this.pageNumber1 = 1;
                this.paginationHelper1();
              });
            } else {
              // CREATE MODE: do NOT merge with previous onchange - only use current selections
              console.log("🆕 Create Mode - DO NOT MERGE with previous onchange values");

              const newSelections = newStateItems.filter((i) => i.isSelected);
              console.log("🟨 New Selections (Create):", JSON.stringify(newSelections));

              // Replace global selections with only the new ones (no merging)
              this.selectedSupportItemsGlobal = [...newSelections];
              console.log("🌍 selectedSupportItemsGlobal (Create) set to:", JSON.stringify(this.selectedSupportItemsGlobal));

              // Build records1 from available items + selected ones (dedup)
              const allItemsMap = new Map();
              [...this.selectedSupportItemsGlobal, ...newStateItems].forEach((item) => {
                allItemsMap.set(item.Id, item);
              });
              this.records1 = Array.from(allItemsMap.values());
              console.log("📊 Final Records1 in Create Mode:", JSON.stringify(this.records1));

              // pagination
              this.totalRecords1 = this.records1.length;
              this.pageSize1 = this.pageSizeOptions1[0];
              this.pageNumber1 = 1;
              this.paginationHelper1();
            }
          })
          .catch((error) => {
            console.error("❌ Error fetching records after state change:", error);
            // keep cleared state (no merge)
            this.records1 = [];
            this.serviceGroupName = [];
            this.selectedSupportItemsGlobal = [];
            this.selectedServiceRows = [];
            this.totalRecords1 = 0;
          });
      }
    }


  @track selectedServiceRows = []; // To hold selected rows
  @track saveDisabled = true;

  handleCheckboxSelection(event) {
    const rowId = event.target.dataset.id;
    const rowName = event.target.dataset.name;
    const isChecked = event.target.checked;

    // Find the full row data from the original list
    const selectedRow = this.serviceGroupName.find((item) => item.Id === rowId);

    if (isChecked) {
      // Only add if not already present
      if (!this.selectedServiceRows.some((row) => row.Id === rowId)) {
        this.selectedServiceRows.push(selectedRow);
      }
    } else {
      // Remove from selected rows
      this.selectedServiceRows = this.selectedServiceRows.filter(
        (row) => row.Id !== rowId
      );
    }

    this.serviceGroupName = this.serviceGroupName.map((item) => {
      if (item.Id === rowId) {
        return {
          ...item,
          isSelected: isChecked
        };
      }
      return item; // Return item as-is if not matched
    });
     console.log("service  groups length ==> " + JSON.stringify( this.selectedServiceRows.length));
    this.saveDisabled = this.selectedServiceRows.length === 0;
   
  }

  // Form submit - extend default behavior
  handleSubmit(event) {
    console.log("onsubmit event recordEditForm", event.detail.fields);

    event.preventDefault();
    const fields = event.detail.fields;

    // Assign values
    fields.Client__c = this.clientId;
    fields.State__c = this.stateValue;
    fields.Registration_Group__c = this.serviceTypeName;
    fields.Shift_Name__c = this.shiftNameValue;
    fields.Entity_Profile__c = this.EntityNameValue;

    // ✅ Validation for required fields with custom messages
    if (!fields.Shift_Name__c && !fields.Entity_Profile__c) {
      this.showToast("Please select both Shift Name and Entity Name before submitting.");
      return;
    } else if (!fields.Shift_Name__c) {
      this.showToast("Please select a Shift Name before submitting.");
      return;
    } else if (!fields.Entity_Profile__c) {
      this.showToast("Please select an Entity Name before submitting.");
      return;
    }

    console.log("State : " + fields.State__c);
    console.log("Handle Submit : " + fields.Client__c);
    console.log("After Fields : " + JSON.stringify(fields));

    // ✅ Safe submission
    this.template.querySelector("lightning-record-edit-form").submit(fields);
  }


  handleSuccess(event) {
    const fundTrackerId = event.detail.id;
    console.log("🎯 Fund inserted: ", fundTrackerId);

    let deleteIDS = [];
    let selectedCatalogIds = [];
    let catalogToJunctionMap = {};

    if (this.createAddNew === true && this.isEdit === false) {
      // case: new fund
      this.selectedServiceRows.forEach((row) => {
        selectedCatalogIds.push(row.Id);
        catalogToJunctionMap[row.Id] = null; // no junctionId yet
      });
    }

    if (this.isEdit === true) {
      // records to delete
      deleteIDS = this.serviceGroupName
        .filter((item) => item.junctionId != null && item.isSelected === false)
        .map((item) => item.junctionId);

      // records to insert/update
      this.serviceGroupName
        .filter((item) => item.isSelected === true)
        .forEach((item) => {
          selectedCatalogIds.push(item.Id);
          catalogToJunctionMap[item.Id] = item.junctionId || null;
        });
    }

    console.log("🗑️ delete ids:", JSON.stringify(deleteIDS));
    console.log("✅ selected ids:", JSON.stringify(selectedCatalogIds));
    console.log(
      "🗺️ catalogToJunctionMap:",
      JSON.stringify(catalogToJunctionMap)
    );

    let deletePromise = Promise.resolve();
    let insertPromise = Promise.resolve();

    if (deleteIDS.length > 0) {
      deletePromise = deletedSelectedId({ selectedDeletedId: deleteIDS })
        .then((result) => {
          console.log(
            "✅ Deleted ClientFundTrackerJN__c records:",
            JSON.stringify(result)
          );
        })
        .catch((error) => {
          console.error(
            "❌ Error deleting ClientFundTrackerJN__c records:",
            JSON.stringify(error)
          );
        });
    }
    console.log(' service support item name '+JSON.stringify(this.serviceGroupName));

    if (selectedCatalogIds.length > 0) {
      insertPromise = insertClientFundTrackerLinks({
        fundTrackerId: fundTrackerId,
        participantId: this.clientId,
        selectedCatalogIds: selectedCatalogIds,
        state: this.stateValue,
        amount: this.serviceGroupName[0].amount,
        catalogToJunctionMap: catalogToJunctionMap,
        serviceSupportItem:this.serviceGroupName[0].serviceSupportItem
      })
        .then(() => {
          console.log(
            "✅ ClientFundTrackerJN__c records upserted successfully"
          );
        })
        .catch((error) => {
          console.error(
            "❌ Error upserting ClientFundTrackerJN__c records:",
            error
          );
        });
    }

    Promise.all([deletePromise, insertPromise]).then(() => {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Success",
          message: this.successmessage,
          variant: "success"
        })
      );

      this.serviceGroupName = [];
      this.selectedServiceRows = [];
      this.createAddNew = false;
      this.isEdit = false;
      this.displayFundTracker = true;
      this.shiftNameValue = "";
      this.EntityNameValue = "";
      this.handleFund(); // refresh
    });
  }

 
    @track pageSizeOptions1 = [10, 25, 50, 75, 100]; //Page size options
    @track records1 = []; //All records available in the data table
    @track columns1 = []; //columns information available in the data table
    @track totalRecords1 = 0; //Total no.of records
    @track pageSize1; //No.of records to be displayed per page
    @track totalPages1; //Total no.of pages
    @track pageNumber1 = 1; //Page number
    @track recordsToDisplay1 = []; //Records to be displayed on the page

    get bDisableFirst1() {
        return this.pageNumber1 == 1;
    }
    get bDisableLast1() {
        return this.pageNumber1 == this.totalPages1;
    }
    handleRecordsPerPage(event) {
        this.pageSize1 = event.target.value;
        this.pageNumber1 = 1;
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
        this.serviceGroupName = [];
        this.NdisServiceGroupName = true;
        this.totalPages1 = Math.ceil(this.totalRecords1 / this.pageSize1);
        if (this.pageNumber1 <= 1) {
        this.pageNumber1 = 1;
        } else if (this.pageNumber1 >= this.totalPages1) {
        this.pageNumber1 = this.totalPages1;
        }
        for (
        let i = (this.pageNumber1 - 1) * this.pageSize1;
        i < this.pageNumber1 * this.pageSize1;
        i++
        ) {
        if (i === this.totalRecords1) {
            break;
        }
        this.serviceGroupName.push(this.records1[i]);
        }
        console.log("serviceGroupName " + JSON.stringify(this.serviceGroupName));
    }

      handleToggleEdit(event) {
        const rowId = event.currentTarget.dataset.id;
        const field = event.currentTarget.dataset.field; // "Name" or "Amount"
        const isSave = event.currentTarget.title === "Save";

        const flagName = field === "Name" ? "isEditingName" : "isEditingAmount";

        this.serviceGroupName = this.serviceGroupName.map((item) => {
            if (item.Id === rowId) {
                return { ...item, [flagName]: !isSave }; 
                // if Save → false, if Edit → true
            }
            return item;
        });

        console.log(`✅ Updated ${field}:`, JSON.stringify(this.serviceGroupName));
    }

          handleFieldChange(event) {
              const rowId = event.target.dataset.id;
              const field = event.target.dataset.field; // "serviceSupportItem" or "amount"
              const value = event.target.value;

              this.serviceGroupName = this.serviceGroupName.map((item) => {
                  if (item.Id === rowId) {
                      return { ...item, [field]: value };
                  }
                  return item;
              });

              console.log(`✏️ Updated ${field}:`, JSON.stringify(this.serviceGroupName));
        }


          handleSave(event) {
          const rowId = event.currentTarget.dataset.id;
          const field = event.currentTarget.dataset.field; // "Name" or "Amount"

          // Map field → flag name
          const flagName = field === "Name" ? "isEditingName" : "isEditingAmount";

          this.serviceGroupName = this.serviceGroupName.map((item) => {
              if (item.Id === rowId) {
                  return { ...item, [flagName]: false }; // turn off edit mode for that column
              }
              return item;
          });

          console.log(`✅ Updated ${field}:`, JSON.stringify(this.serviceGroupName));
      }


      handleCancel() {
        this.entityNameFlag = true;
        this.EntityNameValue = '';
        this.loadEntityProfiles();
      }

}