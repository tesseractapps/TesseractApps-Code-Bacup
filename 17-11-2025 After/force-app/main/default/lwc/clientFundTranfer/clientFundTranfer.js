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
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import fetchEntityList from '@salesforce/apex/XeroIntegrationController.fetchEntityList';
import getFundSplits from '@salesforce/apex/ClientFundTransferHandler.getFundSplits';
import saveFundSplits from '@salesforce/apex/ClientFundTransferHandler.saveFundSplits';

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
  @api ndisflag;//manendra
  chevronIcon = 'utility:chevrondown';
  @track serviceGroupName = [];
/*   @track isShiftDropdownOpen = false;//manendra
  @track shiftNameDisplayText = 'Select Shift';//manendra
  @track shiftNameSelectedClass = 'placeholder';//manendra */
  get bDisableFirst() {
    return this.pageNumber == 1;
  }
  get bDisableLast() {
    return this.pageNumber == this.totalPages;
  }
  //Nagendra code for Pagination End
  @track AddNewFund;
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
  @track xeroEntityNameFlag = false;
  @track isNewXeroEntityFlag = false;
  @track accountingService;
  // ---------------- PERIOD MANAGEMENT VARIABLES Vamshi----------------
   @api recordId;
  @track generatedPeriods = [];
  @track isPeriodManagementEnabled = false;
  @track approvedAmount = 0;
  @track totalAllocated = 0;
  @track selectedPeriodType;
  @track description;

  periodOptions = [
    { label: '2 Periods (Bi-annual)', value: '2' },
    { label: '3 Periods', value: '3' },
    { label: '4 Periods (Quarterly)', value: '4' },
    { label: '6 Periods (Bi-monthly)', value: '6' },
    { label: '12 Periods (Monthly)', value: '12' }
  ];

  statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Future', value: 'Future' },
  ];
  //End  Period Management Variables

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
//vamshi added 168 to 170 for displaying text related to child table 
// get colspanValue() {
//     return this.ndisflag ? 3 : 2;
// }

get colspanValue() {
    // this.ndisflag ? 3 : 2; before adding state
     return this.ndisflag ? 4 : 3;
}

  get animationclass() {
    return this.template ? "right-align" : "right-align-reverse";
  }
  constructor() {
    super();
    this.chartJSLoaded = false;
  }

  /* handleFund() {
    this.displayFundTracker = false;
    fetchfundTracker({ clientId: this.clientId })
      .then((result) => {
        console.log('result',JSON.stringify(result));
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
              state: item.State__c,
              plantype: item.Plan_Type__c
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
  } */
//vamshi started
  handleFund() {
    this.displayFundTracker = false;
    fetchfundTracker({ clientId: this.clientId })
        .then((result) => {
            console.log('result', JSON.stringify(result));
 
            if (result != null) {
                this.records = JSON.parse(JSON.stringify(
                    result.map((item) => ({
                        id: item.Id,
                        registrationGroup: item.Registration_Group__c,
                        status: item.Status__c,
                        statusClass:
                            item.Status__c && item.Status__c.toLowerCase() === 'active'
                                ? 'status-badge active'
                                : 'status-badge inactive',
                        approvedDate: item.Approved_Date__c ? new Date(item.Approved_Date__c).toLocaleDateString("en-GB") : "",
                        amountApproved: item.Amount_approved__c ? Number(item.Amount_approved__c) : 0,
                        availableFunds: item.Available_Funds__c ? Number(item.Available_Funds__c) : 0,
                        spentAmount: item.Spent_Amt__c ? Number(item.Spent_Amt__c) : 0,
                        state: item.State__c,
                        plantype: item.Plan_Type__c,
                        isExpanded: false,
                        childItems: item.ClientFundTrackers__r ? item.ClientFundTrackers__r.map((child) => ({
                            Id: child.Id,
                           /*  Name: child.NDIS_Support_Catalogue__r?.Support_Item_Name__c, */
                           Name: child.Edited_Catelog_Name__c? child.Edited_Catelog_Name__c: child.NDIS_Support_Catalogue__r?.Support_Item_Name__c,
                           statechild: child.State__c ? child.State__c.replace(/__c$/, '') : '',
                            Support_Item_Number__c: child.NDIS_Support_Catalogue__r?.Support_Item_Number__c,
                            Amount__c: child.Amount__c ? Number(child.Amount__c) : 0,
                             shiftBadges: child.Shift_Type__c
                            ? child.Shift_Type__c.split(';').map(val => val.trim())
                            : [],
                            Shift_Type__c: child.Shift_Type__c
                          })) : [],
                          supportItemCount: item.ClientFundTrackers__r ? item.ClientFundTrackers__r.length + ' Items' : '0 Items'
                    }))
                ));
                        this.accList = this.records;
                        this.totalApprovedAmount = this.accList.reduce((sum, acc) => sum + (acc.amountApproved || 0), 0);
                        this.totalSpentFunds = this.accList.reduce((sum, acc) => sum + (acc.spentAmount || 0), 0);
                        this.totalAvailableFunds = this.accList.reduce((sum, acc) => sum + (acc.availableFunds || 0), 0);
                        //vamshi start for avg calculation
                         const { totalSupportItems, totalAmount } = this.accList.reduce(
                              (acc, curr) => {
                                const childCount = curr.childItems ? curr.childItems.length : 0;
                                const sumAmount = curr.childItems
                                  ? curr.childItems.reduce((sum, child) => sum + child.Amount__c, 0)
                                  : 0;
                                return {
                                  totalSupportItems: acc.totalSupportItems + childCount,
                                  totalAmount: acc.totalAmount + sumAmount,
                                };
                              },
                              { totalSupportItems: 0, totalAmount: 0 }
                            );

                            this.totalSupportItems = totalSupportItems;
                            this.averageSupportAmount =
                              totalSupportItems > 0 ? totalAmount / totalSupportItems : 0;

                            console.log('🧮 Total Support Items:', this.totalSupportItems);
                            console.log('🧮 Average Support Amount:', this.averageSupportAmount);
                
                                // 🔹 Calculate Total Support Items and Average Amount
                         /*        let totalAmount = 0;
                                let totalSupportItems = 0;
                
                                this.accList.forEach(acc => {
                                    if (acc.childItems) {
                                        acc.childItems.forEach(child => {
                                            totalAmount += child.Amount__c;
                                            totalSupportItems++;
                                        });
                                    }
                                }); */
                
                                // Calculate average support item amount
                                this.averageSupportAmount = totalSupportItems > 0 ? (totalAmount / totalSupportItems) : 0;
                
                                console.log('🧮 Average Support Item Amount:', this.averageSupportAmount);
                
                                this.totalRecords = result.length;
                                this.pageSize = this.pageSizeOptions[0];
                                this.pageNumber = 1;
                
                                if (this.totalRecords > 0) {
                                    this.paginationVisible = true;
                                }
                
                                this.paginationHelper();
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
                
                
                toggleExpand(event) {
                    const accId = event.currentTarget.dataset.id;
                    this.accList = this.accList.map(acc => {
                        if (acc.id === accId) {
                            acc.isExpanded = !acc.isExpanded;
                        }
                        return acc;
                    });
                }//vamshi added
                
  connectedCallback() {
    this.initializeShiftOptions();//manendra
     this.updateShiftOptionsForRows();
      this.handleFund();
      //manendra
      if(this.ndisflag){
        this.AddNewFund= 'Add New Fund';
      }else{
        this.AddNewFund= 'Add New Catalogue';
      }
  this.handleOutsideClickRef = this.handleOutsideClick.bind(this);
  window.addEventListener("mousedown", this.handleOutsideClickRef);//manendra */
      

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

          //this.loadEntityProfiles();
           orgDetails()
            .then(result => {
                if (result) {
                    this.accountingService = result.Accounting_Services__c;
                    console.log('Accounting Service in the Organization is :', this.accountingService);

                    if (this.accountingService === 'Tesseract System') {
                       this.loadEntityProfiles();
                    } else if (this.accountingService === 'Xero') {
                        this.loadXeroEntities();
                    } else {
                        console.warn('Unknown accounting service:', this.accountingService);
                    }
                } else {
                    console.error('No organization data returned.');
                }
            })
            .catch(error => {
                console.error('Error retrieving org details:', error);
            });

          // 🔹 Call fetchShiftData here
          /* this.fetchShiftData(this.facilityId)
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
            }); */


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
  disconnectedCallback() {
  window.removeEventListener("mousedown", this.handleOutsideClickRef);
}//manendra */
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
      //maendnra start
     initializeShiftOptions() {
  const shiftLabels = [
    'General',
    'Morning',
    'Afternoon',
    'Night',
    'Sleepover Shift',
  ];

  this.baseShiftOptions = shiftLabels.map((label, index) => ({
    id: index,
    label,
    value: label,
    checked: false,
    statusText: 'Inactive',
    buttonClass: this.getOptionButtonClass(false),
    badgeClass: this.getBadgeClass(false),
    isDisabled: false
  }));
}
// Update shift options for all rows
updateShiftOptionsForRows() {
    const selectedShifts = this.serviceGroupName
        .filter(r => r.selectedShiftId)
        .map(r => r.selectedShiftId);

    this.serviceGroupName = this.serviceGroupName.map(row => ({
        ...row,
        shiftOptions: row.shiftOptions.map(shift => ({
            ...shift,
            isDisabled:
                selectedShifts.includes(shift.value) &&
                row.selectedShiftId !== shift.value
        }))
    }));
}

// Toggle dropdown per row
 toggleShiftNameDropdown(event) {
    const rowId = event.currentTarget.dataset.rowId;
    this.serviceGroupName = this.serviceGroupName.map(row => ({
        ...row,
        isShiftNameOpen: row.Id === rowId ? !row.isShiftNameOpen : false
    }));
}


// Handle selecting a shift
handleSelectShiftName(event) {
  const rowId = event.currentTarget.dataset.rowId;
  const shiftId = parseInt(event.currentTarget.dataset.shiftId, 10);

  const updatedRows = this.serviceGroupName.map(row => {
    if (String(row.Id) === String(rowId)) {
      const selectedShift = row.shiftOptions.find(s => s.id === shiftId);
      if (!selectedShift) return row;

      const updatedShiftOptions = row.shiftOptions.map(s => ({
        ...s,
        checked: s.id === shiftId,
        statusText: s.id === shiftId ? 'Active' : 'Inactive',
        buttonClass: this.getOptionButtonClass(s.id === shiftId),
        badgeClass: this.getBadgeClass(s.id === shiftId)
      }));

      return {
        ...row,
        shiftNameDisplayText: selectedShift.label, // visible text
        shiftNameSelectedClass: 'selected',
        selectedShiftId: selectedShift.value,
        isShiftNameOpen: false,
        shiftOptions: updatedShiftOptions
      };
    }
    return row;
  });

  // ✅ This line forces re-render in LWC
  this.serviceGroupName = JSON.parse(JSON.stringify(updatedRows));
}



// Handle toggle switch (optional)
handleToggleShiftName(event) {
  const rowId = event.currentTarget.dataset.rowId;
  const shiftId = parseInt(event.currentTarget.dataset.shiftId, 10);
  const isChecked = event.target.checked;

  this.serviceGroupName = this.serviceGroupName.map(row => {
    if (String(row.Id) === String(rowId)) {
      // Update this row's shiftOptions
      const updatedShiftOptions = row.shiftOptions.map(s => {
        if (s.id === shiftId) {
          s.checked = isChecked;
          s.statusText = isChecked ? 'Active' : 'Inactive';
        }
        s.buttonClass = this.getOptionButtonClass(s.checked);
        s.badgeClass = this.getBadgeClass(s.checked);
        return s;
      });

      // ✅ Collect selected shifts
      const selectedShifts = updatedShiftOptions
        .filter(s => s.checked)
        .map(s => s.label);

      // ✅ Display only the FIRST selected shift
      const firstShift = selectedShifts.length > 0 ? selectedShifts[0] : 'Select Shift';

      return {
        ...row,
        shiftOptions: updatedShiftOptions,
        selectedShifts: selectedShifts,
        shiftNameDisplayText: firstShift, // 👈 only first name
        shiftNameSelectedClass: selectedShifts.length > 0 ? 'selected' : 'placeholder'
      };
    }
    return row;
  });

  // ✅ Force re-render
  this.serviceGroupName = JSON.parse(JSON.stringify(this.serviceGroupName));
  console.log('checkservicegroup',JSON.stringify(this.serviceGroupName));
}




// Button / badge classes
getOptionButtonClass(isChecked) {
    return isChecked ? 'option-button active' : 'option-button';
}

getBadgeClass(isChecked) {
    return isChecked ? 'status-badge1 status-badge-active1' : 'status-badge1 status-badge-inactive1';
}
ensureShiftFieldsOnRows() {
  this.serviceGroupName = JSON.parse(JSON.stringify(
    this.serviceGroupName.map(item => ({
      ...item,
      shiftNameDisplayText: item.shiftNameDisplayText ?? 'Select Shift',
      shiftNameSelectedClass: item.shiftNameSelectedClass ?? 'placeholder',
      selectedShiftId: item.selectedShiftId ?? null,
      selectedShifts: item.selectedShifts ?? [], // ✅ add this
      isShiftNameOpen: item.isShiftNameOpen ?? false,
      shiftOptions: item.shiftOptions
        ? item.shiftOptions.map(opt => ({ ...opt }))
        : this.baseShiftOptions.map(opt => ({ ...opt }))
    }))
  ));
}  

handleOutsideClick(event) {
  // Check if the click is inside any dropdown or toggle element
  const clickedInsideDropdown = event.composedPath().some(
    (el) => el.classList && el.classList.contains("dropdown-container1")
  );

  // ✅ If clicked inside dropdown, don't close anything
  if (clickedInsideDropdown) {
    return;
  }

  // ✅ Otherwise, close all open dropdowns
  let changed = false;
  this.serviceGroupName = this.serviceGroupName.map((row) => {
    if (row.isShiftNameOpen) {
      changed = true;
      return { ...row, isShiftNameOpen: false };
    }
    return row;
  });

  if (changed) {
    this.serviceGroupName = JSON.parse(JSON.stringify(this.serviceGroupName));
  }
}


//manendra end shift


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
      console.log('Org Id  in fetchInitialData : ',  this.orgId);
    });
  }
    loadXeroEntities() {
     // console.log('this.orgId  in loadXeroEntities >>> ', this.orgId);

      fetchEntityList()
        .then((result) => {
          console.log("✅ Xero Entities  :", JSON.stringify(result));

          // ✅ Check if result has data
          if (result && result.length > 0) {
             this.EntityNameOptions = (result || []).map((profile) => ({
                label: `${profile.First_Name__c || ""} ${profile.Last_Name__c || ""}`.trim() || '',
                value: profile.Id
              }));
           
          }

          // Optional: Add "Add New Entity" option
          if (!this.EntityNameOptions.some(option => option.value === 'Add New Entity')) {
            this.EntityNameOptions.push({ label: ' + Add New Entity', value: 'Add New Entity' });
          }

          console.log("🔹 EntityNameOptions (with Add option):", JSON.stringify(this.EntityNameOptions));
          if(this.xeroEntityNameFlag === true){
              this.isNewXeroEntityFlag = false;  // reset flag when child says cancel
              this.fundtracker = true;
              this.xeroEntityNameFlag = false;
          }
        })
        .catch((error) => {
          console.error("❌ Error fetching Entity Profiles:", error);
          this.error = error;
          this.EntityNameOptions = [{ label: ' + Add New Entity', value: 'Add New Entity' }]; // fallback
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
        { label: "Miscellaneous", value: "Miscellaneous" },
        { label: "Others", value: "Others" }
       /*  { label: "Miscellaneous - Morning", value: "Miscellaneous - Morning" },
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
        { label: "Others - Weekends", value: "Others - Weekends" }, */
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

    //Reset values ensures all Period Management fields go back to default.Vamshi
  this.resetPeriodManagementState(false);

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
    this.approvedAmount = parseFloat(event.currentTarget.dataset.amount || 0);
    console.log('💰 Approved Amount Loaded:', this.approvedAmount);



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
            //this.EntityNameValue = ndisResponse[0].Entity_Profile__c;
            
            if (this.accountingService === 'Tesseract System') {
                this.EntityNameValue = ndisResponse[0].Entity_Profile__c;
            } else if (this.accountingService === 'Xero') {
               this.EntityNameValue = ndisResponse[0].Xero_Entity__c;
            }

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


        // Load Period Management data (Fund Splits) vamshi added for calling split fund logic
        this.loadFundSplits(rowId);

      /* getNDISServiceLineItem({
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
 *///manendr commented for duplicate method
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
                   // 🟢 Restore Shift Names(manendra to fetch the selected shiftname)
                    if (match.Shift_Type__c) {
                      const selectedShifts = match.Shift_Type__c.split(";").map((s) => s.trim());
                      updatedItem.selectedShifts = selectedShifts;
                      updatedItem.shiftNameDisplayText =
                        selectedShifts.length > 0 ? selectedShifts[0] : "Select Shift";
                      updatedItem.shiftNameSelectedClass =
                        selectedShifts.length > 0 ? "selected" : "placeholder";

                      // Prepare shiftOptions if missing
                      updatedItem.shiftOptions = this.baseShiftOptions.map((opt) => ({
                        ...opt,
                        checked: selectedShifts.includes(opt.label),
                        statusText: selectedShifts.includes(opt.label)
                          ? "Active"
                          : "Inactive",
                        buttonClass: this.getOptionButtonClass(
                          selectedShifts.includes(opt.label)
                        ),
                        badgeClass: this.getBadgeClass(
                          selectedShifts.includes(opt.label)
                        )
                      }));
                    }//manendra end
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
              //added manendra for below 2 lines
              this.ensureShiftFieldsOnRows();
          this.updateShiftOptionsForRows();
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
//period management start Vamshi
// Load from Apex
// ---------------- LOAD EXISTING SPLITS  Vamshi Added 1185 1226-----------------
//  async loadFundSplits(fundTrackerId) {
//   getFundSplits({ fundTrackerId })
//     .then(result => {
//       console.log('📦 Loaded Fund Splits:', JSON.stringify(result));

//       if (!result || !result.length) {
//         this.resetPeriodManagementState(false);
//         console.log(' No fund splits found — toggle OFF');
//         this.generatedPeriods = [];
//         return;
//       }

//       this.generatedPeriods = result.map((r, index) => {
//         const startDate = new Date(r.Start_Date__c);
//         const year = startDate.getFullYear();
//         const monthName = startDate.toLocaleString('default', { month: 'short' });

//         // 🔹 Dynamic label rebuild
//         let label = r.Name || `Period ${index + 1}`;
//         if (this.selectedPeriodType == '2') label = `H${index + 1} - ${year}`;
//         else if (this.selectedPeriodType == '3') label = `Period ${index + 1} - ${year}`;
//         else if (this.selectedPeriodType == '4') label = `Q${index + 1} - ${year}`;
//         else if (this.selectedPeriodType == '6') label = `Period ${index + 1} - ${year}`;
//         else if (this.selectedPeriodType == '12') label = `${monthName} ${year}`;

//         return {
//           id: r.Id,
//           label,
//           startDate: r.Start_Date__c,
//           endDate: r.End_Date__c,
//           amount: r.Allocated__c,
//           carryForward: r.Carry_Forward__c,
//           status: r.Status__c
//         };
//       });

//    await new Promise(resolve => setTimeout(resolve, 0));
//       this.isPeriodManagementEnabled = this.generatedPeriods.length > 0;
     
//   this.isPeriodManagementEnabled = this.generatedPeriods.length > 0;
//   console.log('🟢 Period Management enabled after Apex load');

//       this.calculateTotal();
//     })
//     .catch(error => {
//       console.error('❌ Error fetching fund splits:', error);
//       this.showToast('Error', error.body?.message || error.message, 'error');
//     });
// }
//working 
// async loadFundSplits(fundTrackerId) {
//   try {
//     console.log('🔄 Loading Fund Splits for Tracker:', fundTrackerId);

//     const result = await getFundSplits({ fundTrackerId });
//     console.log('📦 Loaded Fund Splits:', JSON.stringify(result));

//     if (!result || !result.length) {
//       this.resetPeriodManagementState(false);
//       console.log('⚪ No fund splits found — toggle OFF');
//       this.generatedPeriods = [];
//       this.isPeriodManagementEnabled = false;
//       return;
//     }

//     this.generatedPeriods = result.map((r, index) => {
//       const startDate = new Date(r.Start_Date__c);
//       const year = startDate.getFullYear();
//       const monthName = startDate.toLocaleString('default', { month: 'short' });

//       let label = r.Name || `Period ${index + 1}`;
//       if (this.selectedPeriodType == '2') label = `H${index + 1} - ${year}`;
//       else if (this.selectedPeriodType == '3') label = `Period ${index + 1} - ${year}`;
//       else if (this.selectedPeriodType == '4') label = `Q${index + 1} - ${year}`;
//       else if (this.selectedPeriodType == '6') label = `Period ${index + 1} - ${year}`;
//       else if (this.selectedPeriodType == '12') label = `${monthName} ${year}`;

//       return {
//         id: r.Id,
//         label,
//         startDate: r.Start_Date__c,
//         endDate: r.End_Date__c,
//         amount: r.Allocated__c,
//         carryForward: r.Carry_Forward__c,
//         status: r.Status__c
//       };
//     });

//     // ✅ short render delay before enabling toggle
//     //await new Promise(resolve => setTimeout(resolve, 0));
//     await Promise.resolve();


//     this.isPeriodManagementEnabled = this.generatedPeriods.length > 0;
//     console.log('🟢 Period Management enabled after Apex load');

//     this.calculateTotal();

//   } catch (error) {
//     console.error('❌ Error fetching fund splits:', error);
//     this.showToast('Error', error.body?.message || error.message, 'error');
//   }
// } 
//working 2

async loadFundSplits(fundTrackerId, retry = true) {
  try {
    console.log('🔄 Loading Fund Splits for Tracker:', fundTrackerId);

    const result = await getFundSplits({ fundTrackerId });
    console.log(' Loaded Fund Splits:', JSON.stringify(result));

    if (!result || !result.length) {
      // If no results, wait a bit and retry once
      if (retry) {
        console.log(' No fund splits found — retrying in 1s...');
        await new Promise(resolve => setTimeout(resolve, 150)); //  Delay 2 seconds
        return this.loadFundSplits(fundTrackerId, false);
      }

      console.log(' Still no fund splits — disabling toggle');
      this.isPeriodManagementEnabled = false;
      this.generatedPeriods = [];
      return;
    }

    // ✅ Map Apex results
    this.generatedPeriods = result.map((r, index) => ({
      id: r.Id,
      label: r.Name,
      startDate: r.Start_Date__c,
      endDate: r.End_Date__c,
      amount: r.Allocated__c,
      carryForward: r.Carry_Forward__c,
      status: r.Status__c
    }));

    // ✅ Wait one render cycle
    await Promise.resolve();

    // ✅ Enable toggle now that records exist
    this.isPeriodManagementEnabled = true;
    console.log('🟢 Toggle ON after fund splits load');

    this.calculateTotal();
  } catch (error) {
    console.error('❌ Error loading fund splits:', error);
    this.showToast('Error', error.body?.message || error.message, 'error');
  }
}
//working 3




  // Toggle switch
  handlePeriodToggle(event) {
    this.isPeriodManagementEnabled = event.target.checked;

    if (!this.isPeriodManagementEnabled) {
    // User turned OFF the toggle
    this.generatedPeriods = [];
    this.selectedPeriodType = null;
    this.selectedLabel = null;
  }
  }

  // Dropdown change
  handlePeriodChange(event) {
    this.selectedPeriodType = event.detail.value;
  }

 
// handleGeneratePeriods() {
//   console.log('⚡ Generate clicked');

//   if (!this.selectedPeriodType) {
//     this.showToast('Warning', 'Please select a period type first.', 'warning');
//     return;
//   }

//   const num = parseInt(this.selectedPeriodType, 10);
//   const amountPerPeriod = this.approvedAmount / num;
//   const approved = new Date(this.approvedDate || new Date());

//   this.generatedPeriods = Array.from({ length: num }, (_, i) => {
//     const start = new Date(approved);
//     start.setMonth(approved.getMonth() + i * (12 / num));
//     const end = new Date(start);
//     end.setMonth(start.getMonth() + (12 / num) - 1);

//     return {
//       id: null,
//       uniqueKey: `period-${i}`, // ✅ ensures unique key for each period
//       label: `Period ${i + 1}`,
//       startDate: start.toISOString().slice(0, 10),
//       endDate: end.toISOString().slice(0, 10),
//       amount: amountPerPeriod.toFixed(2),
//       carryForward: 0.0,
//       status: i === 0 ? 'Active' : 'Future'
//     };
//   });

//   this.calculateTotal();
//   console.log('✅ Generated Periods:', JSON.stringify(this.generatedPeriods));
// }



  // Input change handler (keeps data in sync)
  // handleInputChange(event) {
  //   const index = event.target.dataset.index;
  //   const field = event.target.dataset.field;
  //   const value = event.target.value;

  //   this.generatedPeriods = this.generatedPeriods.map((p, i) =>
  //     i === parseInt(index, 10) ? { ...p, [field]: value } : p
  //   );

  //   console.log(`🟢 Updated Period ${parseInt(index, 10) + 1}: ${field} = ${value}`);

  //   if (field === 'amount') this.calculateTotal();
  // }
//   handleInputChange(event) {
//   const index = event.target.dataset.index;
//   const field = event.target.dataset.field;
//   const value = parseFloat(event.target.value);

//   this.generatedPeriods = this.generatedPeriods.map((p, i) => {
//     if (i === parseInt(index, 10)) {
//       const updated = { ...p, [field]: value };
      
//       // ⚠️ 70% Warning check — only for Allocated Amount edits
//       if (field === 'amount') {
//         const base = parseFloat(this.approvedAmount || 0);
//         const threshold = base * 0.7;
//         const totalAllocated = this.generatedPeriods.reduce(
//           (sum, x) => sum + parseFloat(x.amount || 0),
//           0
//         );

//         if (totalAllocated > threshold) {
//           this.showWarningModal(); // ✅ call alert modal
//         }
//       }

//       return updated;
//     }
//     return p;
//   });

//   //this.updateTotals();
//   this.calculateTotal();

// }
// showWarningToast() {
//   this.dispatchEvent(
//     new ShowToastEvent({
//       title: '⚠️ Warning',
//       message: 'You are exceeding the allocated amount for this period. You can continue, but please review your allocations.',
//       variant: 'warning',
//     })
//   );
// }

handleAmountChange(event) {
  // Get numeric value from field
  const rawValue = event.target.value;
  const amount = parseFloat(rawValue) || 0;
 
  // Save it in your tracked variable
  this.approvedAmount = amount;
 
  console.log('💰 Approved Amount Updated:', this.approvedAmount);
}

handleGeneratePeriods() {
  console.log(' Generate clicked');

  if (!this.selectedPeriodType) {
    this.showToast('Warning', 'Please select a period type first.', 'warning');
    return;
  }

  const num = parseInt(this.selectedPeriodType, 10);
  if (!this.approvedAmount || this.approvedAmount <= 0) {
    this.showToast('Warning', 'Approved amount must be greater than zero.', 'warning');
    return;
  }

  const amountPerPeriod = this.approvedAmount / num;
  const approved = new Date(this.approvedDate || new Date());

  this.generatedPeriods = Array.from({ length: num }, (_, i) => {
    const start = new Date(approved);
    start.setMonth(approved.getMonth() + i * (12 / num));

    const end = new Date(start);
    end.setMonth(start.getMonth() + (12 / num) - 1);

    // 🔹 Dynamic label logic
    let label = `Period ${i + 1}`;
    const year = start.getFullYear();
    const monthName = start.toLocaleString('default', { month: 'short' });

    switch (num) {
      case 2:
        label = `H${i + 1} - ${year}`;
        break;
      case 3:
        label = `Period ${i + 1} - ${year}`;
        break;
      case 4:
        label = `Q${i + 1} - ${year}`;
        break;
      case 6:
        label = `Period ${i + 1} - ${year}`;
        break;
      case 12:
        label = `${monthName} ${year}`;
        break;
      default:
        label = `Period ${i + 1} - ${year}`;
        break;
    }

    return {
      id: null,
      uniqueKey: `period-${i}`,
      label,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      amount: amountPerPeriod.toFixed(2),
      carryForward: 0.0,
      status: i === 0 ? 'Active' : 'Future'
    };
  });

  this.calculateTotal();
  console.log('✅ Generated Periods:', JSON.stringify(this.generatedPeriods));
}

handleInputChange(event) {
  const index = parseInt(event.target.dataset.index, 10);
  const field = event.target.dataset.field;
  let value = event.target.value;

  // ✅ Safely parse numbers
  if (field === 'amount' || field === 'carryForward') {
    //value = parseFloat(value) || 0;
    value = Math.round(parseFloat(value) || 0); 
  }

  // ✅ Update the correct period record
  this.generatedPeriods = this.generatedPeriods.map((p, i) => {
    if (i === index) {
      return { ...p, [field]: value };
    }
    return p;
  });

  // ✅ Recalculate totals
  this.calculateTotal();

  // ✅ Compare total allocated vs approved
  const totalAllocatedNum = parseFloat(this.totalAllocated) || 0;
  const approvedNum = parseFloat(this.approvedAmount) || 0;

  // ⚠️ Show warning if user exceeds approved total
  if (approvedNum > 0 && totalAllocatedNum > approvedNum) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: '⚠️ Warning',
        message:
          'You have exceeded the total approved amount. Please review your allocations. You can still continue.',
        variant: 'warning'
      })
    );
  }
}
//to remove decimal
get formattedTotalAllocated() {
  return this.totalAllocated
    ? this.totalAllocated.toString()
    : '0';
}



  // Save to backend
  async handleSaveFundSplits() {

    console.log('METHOD IS HANDLESACEFUNDS');
    try {
      if (!this.recordId || !this.generatedPeriods.length) {
        console.warn('⚠️ No record or periods to save');
        return;
      }

    const splitsToSave = this.generatedPeriods.map(p => ({
      Id: p.id || null,
      Funds_Tracker__c: this.recordId,
      Start_Date__c: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : null,
      End_Date__c: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : null,
      Allocated__c: parseFloat(p.amount) || 0,
      Carry_Forward__c: parseFloat(p.carryForward) || 0,
      Status__c: p.status,
      Name:p.label
    }));

      const result = await saveFundSplits({ fundTrackerId: this.recordId, splits: splitsToSave });
      console.log('✅ Fund splits saved:', JSON.stringify(result));

      this.generatedPeriods = result.map(r => ({
        id: r.Id,
        startDate: r.Start_Date__c,
        endDate: r.End_Date__c,
        amount: r.Allocated__c,
        carryForward: r.Carry_Forward__c,
        status: r.Status__c,
        label: r.Name
      }));

      this.showToast('Success', 'Fund splits saved successfully!', 'success');
      //vamshi added 
      //this.handleFund();
    } catch (error) {
      console.error('❌ Error saving splits:', error);
      this.showToast('Error', error.body ? error.body.message : error.message, 'error');
    }
  }

  // Trigger full save (Fund + Periods)
  async handleUpdateFund(event) {
    try {
      event.preventDefault();
      await this.handleSaveFundSplits();
      this.showToast('Success', 'Fund Tracker and Period Splits updated successfully!', 'success');
    } catch (error) {
      console.error('❌ Error updating Fund or Splits:', error);
      this.showToast('Error', error.body?.message || error.message, 'error');
    }
  }

  // Utilities
//   calculateTotal() {
//   const total = this.generatedPeriods.reduce(
//     (sum, p) => sum + parseFloat(p.amount || 0),
//     0
//   );
//   this.totalAllocated = total.toFixed(2);
//   console.log('💰 Total Allocated Updated:', this.totalAllocated);
// }
    
  calculateTotal() {
    const sum = this.generatedPeriods.reduce(
      (acc, p) => acc + (parseFloat(p.amount) || 0),
      0
    );
    this.totalAllocated = Math.round(sum);
  }


  formatPeriodLabel(dateStr) {
    const d = new Date(dateStr);
    return `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
  }

  showToast(title, message, variant) {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
  }

  // Toggle label display
  get toggleLabel() {
    return this.isPeriodManagementEnabled ? 'Enabled' : 'Disabled';
  }
// resets the form onchange and called it in handleRowActions()
// resetPeriodManagementState() {
//     this.isPeriodManagementEnabled = false;
//     this.selectedPeriodType = null;
//     this.selectedLabel = '';
//     this.generatedPeriods = [];
//     this.totalAllocated = 0;
//     this.description = '';
// }

resetPeriodManagementState(isHardReset = true) {
  if (isHardReset) {
    this.isPeriodManagementEnabled = false;
    this.selectedPeriodType = null;
    this.selectedLabel = '';
    this.generatedPeriods = [];
    this.totalAllocated = 0;
    this.description = '';
    console.log('🔄 Hard reset of Period Management state');
  } else {
    // Soft reset for edit mode
    this.generatedPeriods = [];
    this.totalAllocated = 0;
    this.description = '';
    console.log('🟡 Soft reset — retained toggle and period type');
  }
}


//1341 to 1376 inside  onclick={handleUpdateFund} giving us internal server error So I removed 
//period management end
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
   
    console.log('📋 Current options:', JSON.stringify(this.EntityNameOptions));

    // If user picks Add New Entity
    if (newValue === 'Add New Entity') {
      console.log("🚨 'Add New Entity' selected");

      if (this.accountingService === 'Tesseract System') {
          console.log('🔸 companyname   >>>', this.companyname);
          console.log('🔸 companyId   >>>', this.companyId);
          if (!this.companyId) {
            console.log('❌ Validation failed: companyId is empty');

            // clear combobox so next click is a new change
            this.EntityNameValue = null;
            this.EntityNameOptions = [...this.EntityNameOptions]; // force refresh
            console.log('🧹 Reset EntityNameValue ->', this.EntityNameValue);

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
          console.log('🏁 isNewEntityFlag:', this.isNewEntityFlag);
        } else if (this.accountingService === 'Xero') {
           
           this.xeroEntityNameFlag = true;
           this.EntityNameValue = null;
           this.EntityNameOptions = [...this.EntityNameOptions]; // force refresh
           console.log('🧹 Reset EntityNameValue ->', this.EntityNameValue);
           


        }
        // clear persisted storage so it doesn't re-select after reload
        localStorage.removeItem('defaultEntityNameValue');
        localStorage.removeItem('defaultEntityNameLabel');
        console.log('🗑️ localStorage cleared');

      // validation: must have companyId
      
      
      this.fundtracker = false;
      
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
                isSelected:  false,
                serviceSupportItem: item.Support_Item_Name__c
              };
              console.log("🔹 Mapped Item:", JSON.stringify(mappedItem));
              return mappedItem;
            });

            console.log("🟦 All newStateItems after mapping:", JSON.stringify(newStateItems));
           this.serviceGroupName = [...newStateItems];
           this.ensureShiftFieldsOnRows();
           this.updateShiftOptionsForRows();//manendra
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
                    item.serviceSupportItem = match.Edited_Catelog_Name__c ?match.Edited_Catelog_Name__c: item.Support_Item_Name__c;
                    item.amount=match.Amount__c ?match.Amount__c :item.amount
                    
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
                let selectedCount=  this.serviceGroupName.filter(item => item.isSelected);
                console.log("service  groups length ==> " + JSON.stringify( selectedCount.length));
                this.saveDisabled = selectedCount.length === 0;

                // pagination
                this.totalRecords1 = this.records1.length;
                this.pageSize1 = this.pageSizeOptions1[0];
                this.pageNumber1 = 1;
                this.paginationHelper1();
                this.ensureShiftFieldsOnRows();
                this.updateShiftOptionsForRows();//manendra
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

              let selectedCount=  this.serviceGroupName.filter(item => item.isSelected);
              console.log("service  groups length ==> " + JSON.stringify( selectedCount.length));
              this.saveDisabled = selectedCount.length === 0;

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
   let selectedCount=  this.serviceGroupName.filter(item => item.isSelected);
     console.log("service  groups length ==> " + JSON.stringify( selectedCount.length));
    this.saveDisabled = selectedCount.length === 0;
   
  }

  // Form submit - extend default behavior
  handleSubmit(event) {
    console.log("onsubmit event recordEditForm", event.detail.fields);

    event.preventDefault();
    const fields = event.detail.fields;

     if (this.ndisflag) {
        // When NDIS flag is true → must have a Plan Type
        if (!fields.Plan_Type__c) {
            this.showToast("Error", "Please select a Plan Type for NDIS records.", "error");
            return; // stop submission
        }
    } else {
        // When NOT NDIS → allow null
        fields.Plan_Type__c = null;
    }


    // Assign values
    fields.Client__c = this.clientId;
    fields.State__c = this.stateValue;
    fields.Registration_Group__c = this.serviceTypeName;
    //fields.Shift_Name__c = this.shiftNameValue;
   // fields.Entity_Profile__c = this.EntityNameValue;
    if (this.accountingService === 'Tesseract System') {
      fields.Entity_Profile__c = this.EntityNameValue;
    } else if (this.accountingService === 'Xero') {
        fields.Xero_Entity__c = this.EntityNameValue;
    }

    // ✅ Validation for required fields with custom messages
   

    console.log("State : " + fields.State__c);
    console.log("Handle Submit : " + fields.Client__c);
    console.log("After Fields : " + JSON.stringify(fields));

    // ✅ Safe submission
    this.template.querySelector("lightning-record-edit-form").submit(fields);
  }


  handleSuccess(event) {
    const fundTrackerId = event.detail.id;
    if(this.createAddNew){
    this.recordId = fundTrackerId;
    }
   
    console.log("🎯 Fund inserted: ", fundTrackerId);

    let deleteIDS = [];
    let selectedCatalogIds = [];
    let catalogToJunctionMap = {};
    let serviceMetaMap = {};

    if (this.createAddNew === true && this.isEdit === false) {
      // case: new fund
     /*  this.selectedServiceRows.forEach((row) => {
        selectedCatalogIds.push(row.Id);
        catalogToJunctionMap[row.Id] = null; // no junctionId yet
      }); */

       // records to insert/update
    this.serviceGroupName
          .filter(item => item.isSelected === true)
          .forEach(item => {
            selectedCatalogIds.push(item.Id);
            catalogToJunctionMap[item.Id] = null; 
            serviceMetaMap[item.Id] = {
              amount: item.amount != null ? item.amount : 0,
              serviceSupportItem: item.serviceSupportItem || '',
              shiftType: Array.isArray(item.selectedShifts)
            ? item.selectedShifts.join(';') // ✅ multi-picklist format
            : (item.shiftNameDisplayText || '')//manendra
            };
          });
          
    }
    console.log("selectedshiftname==> " + JSON.stringify(this.serviceGroupName));
    

    if (this.isEdit === true) {
      // records to delete
    deleteIDS = this.serviceGroupName
      .filter((item) => item.junctionId != null && item.isSelected === false)
      .map((item) => item.junctionId);

    // records to insert/update
    this.serviceGroupName
          .filter(item => item.isSelected === true)
          .forEach(item => {
            selectedCatalogIds.push(item.Id);
            catalogToJunctionMap[item.Id] = item.junctionId || null;
            serviceMetaMap[item.Id] = {
              amount: item.amount != null ? item.amount : 0,
              serviceSupportItem: item.serviceSupportItem || '',
              shiftType: Array.isArray(item.selectedShifts)
            ? item.selectedShifts.join(';') // ✅ multi-picklist format
            : (item.shiftNameDisplayText || '')//manendra
            };
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
     console.log(
      "🗺️ catalogToJunctionMap:",
      JSON.stringify(serviceMetaMap)
    );

    if (selectedCatalogIds.length > 0) {
          insertPromise = insertClientFundTrackerLinks({
          fundTrackerId: fundTrackerId,
          participantId: this.clientId,
          selectedCatalogIds: selectedCatalogIds,
          state: this.stateValue,
          catalogToJunctionMap: catalogToJunctionMap,
          serviceMetaMap: serviceMetaMap
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

      this.handleSaveFundSplits();

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
      this.ensureShiftFieldsOnRows();
this.updateShiftOptionsForRows();//manendra
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
              const field = event.target.dataset.field; 
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
            let selectedCount=  this.serviceGroupName.filter(item => item.isSelected);
            console.log("service  groups length ==> " + JSON.stringify( selectedCount.length));
            this.saveDisabled = selectedCount.length === 0;
      }


      handleCancel() {
        this.entityNameFlag = true;
        this.xeroEntityNameFlag =  false;
        this.EntityNameValue = '';
        this.loadEntityProfiles();
      }
    
    handleHideFacilityEvent(event) {
      const forward = new CustomEvent('hidefacilityevent', {
        detail: event.detail,
        bubbles: true,
        composed: true
      });
      this.dispatchEvent(forward);
    }
     handleBackToFundsTracker() {
        this.xeroEntityNameFlag = true;
       // this.entityNameFlag = false;
        this.isNewEntityFlag = false;
        this.EntityNameValue = '';
        this.loadXeroEntities();
      }

}