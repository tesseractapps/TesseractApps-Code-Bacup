import { LightningElement, track, api } from "lwc";
import savFundTransfer from "@salesforce/apex/ClientFundTransferHandler.savFundTransfer";
import fundTrackerRecord from "@salesforce/apex/ClientFundTransferHandler.fundTrackerRecord";
import ChartJS from "@salesforce/resourceUrl/chratJs";
import { loadScript } from "lightning/platformResourceLoader";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import recalculateFundPeriods from "@salesforce/apex/ClientFundTransferHandler.recalculateFundPeriods";
import fetchfundTracker from "@salesforce/apex/ClientFundTransferHandler.fetchfundTracker";
import previewSpentForPeriods from "@salesforce/apex/ClientFundTransferHandler.previewSpentForPeriods";
import getNDISServiceLineItem from "@salesforce/apex/ServiceSupportPlanHandler.getNDISServiceLineItem1";
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
import replaceFundSplits from '@salesforce/apex/ClientFundTransferHandler.replaceFundSplits';
import fetchCompanyByFacility from "@salesforce/apex/RosterInvoicesHandler.fetchCompanyByFacility";
import getServiceCataloguesByClient from "@salesforce/apex/CatalogueController.getServiceCataloguesByClient";
import removeServiceGroup from '@salesforce/apex/CatalogueController.removeServiceGroup';
import checkThresholds from '@salesforce/apex/ClientFundTransferHandler.checkThresholds';
import generateThresholdNotifications from '@salesforce/apex/ClientFundTransferHandler.generateThresholdNotifications';
//fetchCompanyByFacility
const actions = [{ label: "Edit", name: "edit" }];

export default class ClientFundTranfer extends LightningElement {
  //Nagendra code for Pagination Start
  alertShownMap = new Map(); // To track which records have shown the alert
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
  lastGeneratedPeriodType = null;
  @track creaetFundFlag = false;
  @track displayFundTracker = false;
  @track newAddFundTracker;
  @track createAddNew = false;
  @track isOpenModal = false;
  @track objectApiName = "Client__c";
  originalPeriodType; //fund split logic
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
  @track spentAmount;
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
  @track showServiceTypeDropdown = false;
  @api isFromManageInvoice;
  @track hasFutureServices = false;
  @track todayDate;
  _debounceTimer;

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
    { label: 'Completed', value: 'Completed' },
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
//manendra start for threshold pop up
get showFundLevelThreshold() {
    return !this.isPeriodManagementEnabled || !this.generatedPeriods?.length;
}

getLastDayOfMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0);
}


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

//vamshi started
  handleFund() {
    this.alertShownMap = new Map();
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
                        usageThreshold: item.Usage_Threshold__c ? Number(item.Usage_Threshold__c) : 80,   //manendra    
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
                        //manendra added for threshold pop up
                        this.accList.forEach(acc => {
                                                    this.checkThreshold(
                                                        acc.spentAmount,
                                                        acc.amountApproved,
                                                        acc.usageThreshold,
                                                        acc.registrationGroup,
                                                        false,
                                                        acc.id // unique key
                                                    );
                                                });//manendra added for threshold pop up
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
  @track dashboardFacilityId; 
           
  connectedCallback() {

    const storedFacilityId = localStorage.getItem('defaultFacilityId');
    const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');
    console.log('storedFacilityId >>', storedFacilityId);
    console.log('storedFacilityLabel >>', storedFacilityLabel);
    this.dashboardFacilityId = storedFacilityId;
    console.log('this.dashboardFacilityId >>', this.dashboardFacilityId);
    console.log('isFromManageInvoice in connectedCallback ',this.isFromManageInvoice);
    this.documentClickHandler = this.handleOutsideClick.bind(this);
    this.handleOutsideClickRef = this.handleOutsideClick.bind(this);
    window.addEventListener('mousedown', this.handleOutsideClickRef);
    this._outsideClickHandler = (event) => {
        if (!this.template.contains(event.target)) {
           // this.closeAllDropdowns();
        }
    };
    document.addEventListener('click', this._outsideClickHandler);
    this.initializeShiftOptions();//manendra
     this.updateShiftOptionsForRows();
      this.handleFund();
      //manendra threshold
      this.loadThresholdLogs();
      this.triggerThresholdCheck();
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
          this.loadServiceCatalogues();

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
                    } else if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
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
//manendra start for threshold pop up
async loadThresholdLogs() {
    try {
        const result = await checkThresholds({ clientId: this.clientId });

        console.log('🚨 Threshold Logs:', result);

    } catch (e) {
        console.error('Threshold Error:', e);
    }
}
triggerThresholdCheck() {
    generateThresholdNotifications({ clientId: this.clientId })
        .then(() => {
            console.log('Threshold notification processed');
        })
        .catch(error => {
            console.error('Threshold error:', error);
        });
}
//end manendra
    loadServiceCatalogues() {
        getServiceCataloguesByClient({ clientId: this.clientId })
            .then(result => {

                console.log('result >>>>>', JSON.stringify(result, null, 2));

                const rows = [];
                const supportNameSet = new Set();

                // --------- Flatten the response ----------
                Object.keys(result).forEach(facilityId => {
                    const catalogues = result[facilityId] || [];

                    catalogues.forEach(sc => {
                        const supportName =
                            sc.NDIS_Support_Catalogue__r?.Name || null;

                        rows.push({
                            facilityId: facilityId,
                            serviceCatalogueId: sc.Id,
                            serviceCatalogueName: sc.Name,
                            supportCatalogueName: supportName
                        });

                        if (supportName) {
                            supportNameSet.add(supportName);
                        }
                    });
                });

                // store flattened rows
                this.facilityCatalogues = rows;

                // --------- Build base options ----------
                let options = Array
                    .from(supportNameSet)
                    .sort((a, b) => a.localeCompare(b))
                    .map(name => ({
                        label: name,
                        value: name
                    }));

                // --------- Apply grouping rules ----------

                const isMiscChild = label =>
                    label.trim().toLowerCase().startsWith('miscellaneous -');

                const isOtherChild = label =>
                    label.trim().toLowerCase().startsWith('others -');

                const hasMiscGroup = options.some(o => {
                    const l = o.label.trim().toLowerCase();
                    return l === 'miscellaneous' || isMiscChild(l);
                });

                const hasOtherGroup = options.some(o => {
                    const l = o.label.trim().toLowerCase();
                    return l === 'others' || isOtherChild(l);
                });

                if (this.otherThanNdis === false) {

                    // NDIS
                    options = options.filter(o => {
                        const label = o.label.trim();

                        return (
                            !isMiscChild(label) &&
                            !isOtherChild(label) &&
                            label !== 'Miscellaneous' &&
                            label !== 'Others'
                        );
                    });

                    if (hasMiscGroup) {
                        options.push({
                            label: 'Miscellaneous',
                            value: 'Miscellaneous'
                        });
                    }

                } else {

                    // NON-NDIS
                    options = options.filter(o => {
                        const label = o.label.trim();

                        return (
                            !isMiscChild(label) &&
                            !isOtherChild(label) &&
                            label !== 'Miscellaneous' &&
                            label !== 'Others'
                        );
                    });

                    if (hasOtherGroup) {
                        options.push({
                            label: 'Others',
                            value: 'Others'
                        });
                    }
                }


                // --------- Assign to combobox ----------
                this.serviceTypeOption = options;

                console.log(
                    'serviceTypeOption >>>>',
                    JSON.stringify(this.serviceTypeOption, null, 2)
                );

            })
            .catch(error => {
                console.error('Error loading service catalogues', error);
            });
    }


  disconnectedCallback() {
    window.removeEventListener('mousedown', this.handleOutsideClickRef);
    window.removeEventListener("mousedown", this.handleOutsideClickRef);
    document.removeEventListener('click', this._outsideClickHandler);
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


handleShiftClick(event) {
    event.stopPropagation(); // 🔑 prevents immediate close

    const rowId = event.currentTarget.dataset.rowId;

    this.rows = this.rows.map(row => {
        if (row.Id === rowId) {
            return {
                ...row,
                isShiftNameOpen: !row.isShiftNameOpen
            };
        }
        return {
            ...row,
            isShiftNameOpen: false // close other rows
        };
    });
}


stopClick(event) {
    event.stopPropagation();
}


// Handle toggle switch (optional)
handleToggleShiftName(event) {
    const rowId = event.currentTarget.dataset.rowId;
    const shiftId = event.currentTarget.dataset.shiftId; // 🔑 KEEP AS STRING
    const isChecked = event.target.checked;

    this.serviceGroupName = this.serviceGroupName.map(row => {
        if (String(row.Id) === String(rowId)) {

            const updatedShiftOptions = row.shiftOptions.map(s => {
                if (String(s.id) === String(shiftId)) { // 🔑 FIX
                    return {
                        ...s,
                        checked: isChecked,
                        statusText: isChecked ? 'Active' : 'Inactive',
                        buttonClass: this.getOptionButtonClass(isChecked),
                        badgeClass: this.getBadgeClass(isChecked)
                    };
                }

                return {
                    ...s,
                    buttonClass: this.getOptionButtonClass(s.checked),
                    badgeClass: this.getBadgeClass(s.checked)
                };
            });

            const selectedShifts = updatedShiftOptions
                .filter(s => s.checked)
                .map(s => s.label);

            return {
                ...row,
                shiftOptions: updatedShiftOptions,
                selectedShifts,
                shiftNameDisplayText:
                    selectedShifts.length ? selectedShifts[0] : 'Select Shift',
                shiftNameSelectedClass:
                    selectedShifts.length ? 'selected' : 'placeholder'
            };
        }
        return row;
    });

    // 🔁 Force reactivity
    this.serviceGroupName = [...this.serviceGroupName];

    console.log(
        'checkservicegroup',
        JSON.stringify(this.serviceGroupName)
    );
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
    (el) => el.classList && el.classList.contains("dropdown-container2")
  );

  // ✅ If clicked inside dropdown, don't close anything
  if (clickedInsideDropdown) {
    return;
  }

  /* ---------------- SERVICE TYPE DROPDOWN ---------------- */
  if (this.showServiceTypeDropdown) {
    this.showServiceTypeDropdown = false;
    this.filteredServiceTypeOptions = [...this.serviceTypeOption];
  }

  /* ---------------- SHIFT NAME DROPDOWNS ---------------- */
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

handleServiceTypeContainerClick(event) {
  event.stopPropagation(); // ⛔ Prevent document click handler
}

//manendra end shift

       loadEntityProfiles() {
    console.log('this.facilityId >>> loadEntityProfiles', this.facilityId);

    fetchEntity({ facilityId: this.facilityId })
        .then((result) => {
            console.log("✅ Entity Profiles:", JSON.stringify(result));

            // 1️⃣ CASE: Entities exist → use first entity's company
            if (result && result.length > 0) {
                this.companyname = result[0].Company__r?.Company_Name__c || '';
                this.companyId = result[0].Company__c || '';

                console.log('this.companyname >>>', this.companyname);
                console.log('this.companyId >>>', this.companyId);
            } 
            
            // 2️⃣ CASE: No entities → fetch company directly
            else {
                console.log('No entities → checking company directly from facility');

                // Clear existing values
                this.companyname = '';
                this.companyId = '';

                // Combined logic: fetch company if entity list is empty
                fetchCompanyByFacility({ facilityId: this.facilityId })
                    .then((company) => {
                        if (company) {
                            this.companyId = company.Id;
                            this.companyname = company.Company_Name__c;

                            console.log(
                                'Fallback company found →',
                                this.companyId,
                                this.companyname
                            );
                        } else {
                            console.log(' No company found for this facility');
                        }
                    })
                    .catch((error) => {
                        console.error('Error in fallback company fetch:', error);
                    });
            }

            // 3️⃣ Prepare dropdown entity list (unchanged)
            this.EntityNameOptions = (result || []).map((profile) => ({
                label: `${profile.First_Name__c || ""} ${profile.Last_Name__c || ""}`.trim() 
                        || profile.Name__c,
                value: profile.Id
            }));

            // Add "Add New Entity" option (unchanged)
            if (!this.EntityNameOptions.some(opt => opt.value === 'Add New Entity')) {
                this.EntityNameOptions.push({ label: ' + Add New Entity', value: 'Add New Entity' });
            }

            console.log("🔹 EntityNameOptions:", JSON.stringify(this.EntityNameOptions));

            // Existing flags logic (unchanged)
            if (this.entityNameFlag === true) {
                this.isNewEntityFlag = false;
                this.fundtracker = true;
                this.entityNameFlag = false;
            }
            if (this.isFromManageInvoice) {
                console.log('Calling handleFundSpent after entity load');
                this.handleFundSpent();
            }
        })
        .catch((error) => {
            console.error("❌ Error fetching Entity Profiles:", error);
            this.error = error;
            this.EntityNameOptions = [
                { label: ' + Add New Entity', value: 'Add New Entity' }
            ];
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
  @track serviceTypeOption = [ ];
  handleFundSpent() {
    console.log("calling method");
    
    //Reset values ensures all Period Management fields go back to default.Vamshi
    this.resetPeriodManagementState(true);
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
    this.selectedPeriodType = null;
    console.log('this.EntityNameOption '+this.EntityNameOptions) ;
     console.log('this.EntityNameOptions.length '+this.EntityNameOptions.length) ;
     if(this.EntityNameOptions.length===0){
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
    if (this.isFromManageInvoice) {
          this.dispatchEvent(
              new CustomEvent('backtomanageinvoicefund', {
                  detail: {
                      fundTrackerId: null,
                      cancelled: true  
                  },
                  bubbles: true,
                  composed: true
              })
          );
      }
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
    const approvedAmount = parseFloat(event.currentTarget.dataset.amount || 0);
    this.approvedAmount = this.formatCurrency(approvedAmount);
    console.log(' Approved Amount Loaded:', this.approvedAmount);
    const availablefunds = parseFloat(event.currentTarget.dataset.availablefunds || 0);
    this.availablefunds = this.formatCurrency(availablefunds);
    console.log('availablefund Loaded:', this.availablefunds);
    const spentAmount = parseFloat(event.currentTarget.dataset.spentamount || 0);
    this.spentAmount = this.formatCurrency(spentAmount);
    console.log(' spentAmount Loaded:', this.spentAmount);

    const today = new Date();

    this.todayDate = today.toLocaleDateString('en-AU'); 


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
      console.log("this.accountingService : ", this.accountingService);
      if (this.accountingService === 'Tesseract System') {
          this.loadEntityProfiles();
      } else if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
          this.loadXeroEntities();
      } else {
          console.warn('Unknown accounting service:', this.accountingService);
      }
      console.log("this.EntityNameOptions.length : ", this.EntityNameOptions.length);
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
            } else if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
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
      // Step 1: Fetch NDIS Service Line Items
      getNDISServiceLineItem({
        ServiceItemNames: this.serviceTypeName,
        ServiceDate: this.approvedDate,
        clientId: this.clientId
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
  formatCurrency(value) {
      return new Intl.NumberFormat('en-AU', {
          style: 'currency',
          currency: 'AUD',
          minimumFractionDigits: 2
      }).format(value || 0);
  }

//period management start Vamshi
// Load from Apex
// ---------------- LOAD EXISTING SPLITS  Vamshi Added 1185 1226-----------------
//working 2

  normalizePeriods(periods) {
      return periods.map(p => ({
          ...p,
          isCompleted: p.status === 'Completed',
          threshold: (p.threshold !== null && p.threshold !== undefined && p.threshold !== '')
            ? Number(p.threshold)
            : 80, // default threshold if not set manendra added threshold field
          //baseAmount: p.amount 
           //baseAmount: parseFloat(p.allocatedAmount) || 0,
        baseAmount: parseFloat(p.baseAmount) || parseFloat(p.allocatedAmount) || 0,
        allocatedAmount: parseFloat(p.allocatedAmount) || 0,
        spentAmount: parseFloat(p.spentAmount) || 0,
        carryForward: parseFloat(p.carryForward) || 0
      }));
  }

 async loadFundSplits(fundTrackerId, retry = true) {

    try {

        this.alertShownMap = new Map();

        console.log(
            '🔄 Loading Fund Splits for Tracker:',
            fundTrackerId
        );

        // =================================================
        // KEEP YOUR EXISTING FLOW
        // =================================================

        const result = await getFundSplits({

            fundTrackerId:
                fundTrackerId,

            clientId:
                this.clientId
        });

        console.log(
            'Loaded Fund Splits:',
            JSON.stringify(result)
        );

        // =================================================
        // NO DATA
        // =================================================

        if (!result || !result.length) {

            if (retry) {

                console.log(
                    'No fund splits found — retrying in 1s...'
                );

                await new Promise(resolve =>
                    setTimeout(resolve, 150)
                );

                return this.loadFundSplits(
                    fundTrackerId,
                    false
                );
            }

            console.log(
                'Still no fund splits — disabling toggle'
            );

            this.isPeriodManagementEnabled =
                false;

            this.generatedPeriods = [];

            this.selectedPeriodType =
                null;

            this.originalPeriodType =
                null;

            return;
        }

        // =================================================
        // IMPORTANT
        // DB = PURE BASE VALUES
        // UI = BASE + PREVIOUS CARRY
        // =================================================

        let previousCarry = 0;

        this.generatedPeriods =
            this.normalizePeriods(

                result.map((r, i) => {

                    // =====================================
                    // PURE DB VALUE
                    // =====================================

                    const baseAllocation =

                        Number(
                            r.Allocated__c || 0
                        );

                    // =====================================
                    // UI VISIBLE
                    // =====================================

                    const visibleAllocated =

                        baseAllocation
                        +
                        previousCarry;

                    // =====================================
                    // SPENT
                    // =====================================

                    const spent =

                        Number(
                            r.Spent_Amount__c || 0
                        );

                    // =====================================
                    // CARRY
                    // =====================================

                    let calculatedCarry = 0;

                    if (
                        r.Status__c ===
                        'Completed'
                    ) {

                        calculatedCarry =

                            visibleAllocated
                            -
                            spent;

                        previousCarry =
                            calculatedCarry;

                    } else {

                        previousCarry = 0;
                    }

                    // =====================================
                    // DEBUG
                    // =====================================

                    console.log(

                        'Period =>',

                        r.Name,

                        '| base =>',
                        baseAllocation,

                        '| visible =>',
                        visibleAllocated,

                        '| spent =>',
                        spent,

                        '| carry =>',
                        calculatedCarry
                    );

                    return {

                        id:
                            r.Id,

                        label:
                            r.Name,

                        startDate:
                            r.Start_Date__c,

                        endDate:
                            r.End_Date__c,

                        // ================================
                        // UI DISPLAY VALUE
                        // ================================

                        amount:
                            this.formatNumber(
                                visibleAllocated
                            ),

                        allocatedAmount:
                            visibleAllocated,

                        // ================================
                        // PURE DB VALUE
                        // ================================

                        baseAmount:
                            baseAllocation,

                        originalAmount:
                            baseAllocation,

                        // ================================
                        // CARRY
                        // ================================

                        carryForward:
                            calculatedCarry,

                        carryFormatted:
                            this.formatNumber(
                                calculatedCarry
                            ),

                        carryClass:

                            calculatedCarry < 0

                                ? 'floating-label-PM red-border'

                                : 'floating-label-PM',

                        // ================================
                        // SPENT
                        // ================================

                        spentAmount:
                            spent,

                        spentFormatted:
                            this.formatNumber(
                                spent
                            ),

                        // ================================
                        // STATUS
                        // ================================

                        status:
                            r.Status__c,

                        isCompleted:

                            r.Status__c ===
                            'Completed',

                        threshold:

                            r.Usage_Threshold__c

                                ? Number(
                                    r.Usage_Threshold__c
                                )

                                : 80
                    };
                })
            );

        // =================================================
        // NEGATIVE CARRY CHECK
        // =================================================

        const hasNegativeCarry =
            this.generatedPeriods.some(
                p => p.carryForward < 0
            );

        if (hasNegativeCarry) {

            this.showToast(

                'Warning',

                'Carry Forward is negative. Please adjust allocated amounts.',

                'warning'
            );
        }

        // =================================================
        // PREVIEW PAYLOAD
        // =================================================

        const previewPayload =
            this.generatedPeriods.map(p => ({

                label:
                    p.label,

                startDate:
                    p.startDate,

                endDate:
                    p.endDate
            }));

        try {

            console.log(
                '✅ Live spent hydrated on edit-open'
            );

        } catch (previewErr) {

            console.error(

                '❌ previewSpentForPeriods failed on load — falling back to DB values',

                previewErr
            );
        }

        // =================================================
        // VALIDATIONS
        // =================================================

        this.evaluateOverspendAndToggleSave();

        // =================================================
        // THRESHOLD ALERTS
        // =================================================

        this.generatedPeriods.forEach(period => {

            this.checkThreshold(

                period.spentAmount,

                period.allocatedAmount,

                period.threshold,

                this.serviceTypeName ||
                'Service',

                true,

                period.id
            );
        });

        // =================================================
        // PERIOD TYPE
        // =================================================

        this.originalPeriodType =
            String(result.length);

        this.selectedPeriodType =
            this.originalPeriodType;

        await Promise.resolve();

        this.isPeriodManagementEnabled =
            true;

        console.log(
            '🟢 Toggle ON after fund splits load'
        );

        this.calculateTotal();

    } catch (error) {

        console.error(
            '❌ Error loading fund splits:',
            error
        );

        this.showToast(

            'Error',

            error.body?.message ||
            error.message,

            'error'
        );
    }
}
handlePeriodTypeChange(event) {
  const newValue = event.detail.value;

  // If periods already exist and user didn't click Generate
  if (
    this.generatedPeriods.length > 0 &&
    this.originalPeriodType &&
    newValue !== this.originalPeriodType
  ) {
    this.showToast(
      'Warning',
      'Please click Generate to apply the new period type.',
      'warning'
    );

    // 🔄 Revert dropdown back to saved value
    this.selectedPeriodType = this.originalPeriodType;
  }

  // Allow change (new record / no periods yet)
  this.selectedPeriodType = newValue;
}



  // Toggle switch
  handlePeriodToggle(event) {
    this.isPeriodManagementEnabled = event.target.checked;

    if (!this.isPeriodManagementEnabled) {
      // User turned OFF the toggle
      this.generatedPeriods = [];
      this.selectedPeriodType = null;
      this.selectedLabel = null;
      //  console.log('recordId in handlePeriodToggle:', this.recordId);
      //  console.log('approvedAmount in handlePeriodToggle:', this.approvedAmount);
      

      // //Check recordId and set available funds
      // if (!this.recordId) {
      //     this.availablefunds = this.approvedAmount;
      // }
    }
    const today = new Date();

    this.todayDate = today.toLocaleDateString('en-AU'); 

  }

  // Dropdown change
  // handlePeriodChange(event) {
  //   this.selectedPeriodType = event.detail.value;
    
  // }
  handlePeriodChange(event) {
    const newPeriodType = event.detail.value;
    console.log(' New Period Type:', newPeriodType);
    console.log(' Previous selectedPeriodType:', this.selectedPeriodType);
   // console.log(' originalPeriodType:', this.originalPeriodType);
    console.log(' generatedPeriods length:', this.generatedPeriods?.length);

    // ⚠️ Warn if user changes format in edit mode
    if (
      this.selectedPeriodType &&                 // edit mode
      this.generatedPeriods.length > 0 &&        // existing splits
     // this.originalPeriodType !== String(newPeriodType)
      this.selectedPeriodType !== String(newPeriodType)
    ) {
       console.log(' inside if');
      this.generatedPeriods = [];
      this.showToast(
        'Warning',
        'Changing the period format will remove all existing period data and regenerate new periods when you click Generate.',
        'warning'
      );
    }

    // ✅ finally update selection
    this.selectedPeriodType = newPeriodType;
  }

  autoRecalculatePeriods() {
    console.log('autoRecalculatePeriods called');
    if (!this.selectedPeriodType) return;
    if (!this.approvedAmount || parseFloat(String(this.approvedAmount).replace(/[^0-9.-]+/g, '')) <= 0) return;
    if (!this.approvedDate) return;

    const num          = parseInt(this.selectedPeriodType, 10);
    const cleanAmount  = parseFloat(String(this.approvedAmount).replace(/[^0-9.-]+/g, '')) || 0;
    const amountPerPeriod = cleanAmount / num;
    const approved     = new Date(this.approvedDate);
    const monthsPerPeriod = 12 / num;
    const today        = new Date();
    today.setHours(0, 0, 0, 0);

    const periods = [];

    for (let i = 0; i < num; i++) {
        let start;
        if (i === 0) {
            start = new Date(approved);
        } else {
            const prevEnd = new Date(periods[i - 1].endDate);
            start = new Date(prevEnd);
            start.setDate(start.getDate() + 1);
        }

        const end = new Date(start);
        end.setMonth(end.getMonth() + monthsPerPeriod);
        end.setDate(end.getDate() - 1);

        let label = `Period ${i + 1}`;
        const year      = start.getFullYear();
        const monthName = start.toLocaleString('default', { month: 'short' });

        switch (num) {
            case 2:  label = `H${i + 1} - ${year}`; break;
            case 3:  label = `Period ${i + 1} - ${year}`; break;
            case 4:  label = `Q${i + 1} - ${year}`; break;
            case 6:  label = `Period ${i + 1} - ${year}`; break;
            case 12: label = `${monthName} ${year}`; break;
            default: label = `Period ${i + 1} - ${year}`; break;
        }

        const existing = this.generatedPeriods[i];

        const endDate   = new Date(end);
        const startDate = new Date(start);
        endDate.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);

        let status = 'Future';
        if (endDate < today) {
            status = 'Completed';
        } else if (startDate <= today && endDate >= today) {
            status = 'Active';
        }

        // ✅ preserve existing baseAmount if available
        // baseAmount = pure base without carry (what gets saved to DB)
        // If no existing period, use amountPerPeriod as base
        // const preservedBase = existing
        //     ? (parseFloat(existing.baseAmount) || amountPerPeriod)
        //     : amountPerPeriod;
         

    //     periods.push({
    //         id:             existing ? existing.id : null,
    //         uniqueKey:      `period-${i}`,
    //         label,
    //         startDate:      start.toISOString().slice(0, 10),
    //         endDate:        end.toISOString().slice(0, 10),
    //         // ✅ preserve existing base — do NOT reset to amountPerPeriod
    //         baseAmount:     Number(preservedBase.toFixed(2)),
    //         amount:         this.formatNumber(preservedBase),
    //         originalAmount: Number(amountPerPeriod.toFixed(2)),
    //         carryForward:   0,
    //         carryFormatted: this.formatNumber(0),
    //         threshold:      existing ? existing.threshold : 80,
    //         status,
    //         spentAmount:    existing ? existing.spentAmount : 0,
    //         spentFormatted: this.formatNumber(existing ? existing.spentAmount : 0),
    //         allocatedAmount: Number(preservedBase.toFixed(2)),
    //         carryClass:     'floating-label-PM'
    //     });
    // }
     periods.push({
            id:             existing ? existing.id : null,
            uniqueKey:      `period-${i}`,
            label,
            startDate:      start.toISOString().slice(0, 10),
            endDate:        end.toISOString().slice(0, 10),
            baseAmount:     Number(amountPerPeriod.toFixed(2)),
            amount:         this.formatNumber(amountPerPeriod),
            
            originalAmount: Number(amountPerPeriod.toFixed(2)),
            carryForward:   0,
            carryFormatted: this.formatNumber(0),
            threshold:      existing ? existing.threshold : 80,
            status,
            spentAmount:    existing ? existing.spentAmount : 0,
            spentFormatted: this.formatNumber(existing ? existing.spentAmount : 0),
            allocatedAmount: Number(amountPerPeriod.toFixed(2)),
            carryClass:     'floating-label-PM'
        });
    }

    const previewPayload = periods.map(p => ({
        label:     p.label,
        startDate: p.startDate,
        endDate:   p.endDate
    }));

    previewSpentForPeriods({
        clientId:       this.clientId,
        fundTrackerId:  this.recordId,
        periods:        previewPayload
    })
    .then(result => {
        let cumulativeCarry = 0;

        this.generatedPeriods = periods.map((p, index) => {
            const spent          = result[p.label] ?? p.spentAmount ?? 0;
            // ✅ use baseAmount (preserved), not p.amount
            const baseAllocated  = parseFloat(p.baseAmount) || 0;
            const allocatedWithCarry = baseAllocated + cumulativeCarry;
            let carryForward = 0;

            if (p.status === 'Completed') {
                // carryForward    = Math.max(0, allocatedWithCarry - spent);
                carryForward    = allocatedWithCarry - spent;
                cumulativeCarry = carryForward;
            } else {
                carryForward    = 0;
                cumulativeCarry = 0;
            }

            return {
                ...p,
                amount:          this.formatNumber(allocatedWithCarry),
                allocatedAmount: Number(allocatedWithCarry.toFixed(2)),
                // ✅ baseAmount stays as preserved base — not carry-inclusive
                baseAmount:      Number(baseAllocated.toFixed(2)),
                spentAmount:     Number(spent) || 0,
                spentFormatted:  this.formatNumber(Number(spent) || 0),
                carryForward:    Number(carryForward.toFixed(2)),
                carryFormatted:  this.formatNumber(carryForward),
                //carryClass:      'floating-label-PM'
                carryClass:      carryForward < 0
                  ? 'floating-label-PM red-border'
                  : 'floating-label-PM'
            };
        });
         const hasNegativeCarry = this.generatedPeriods.some(p => p.carryForward < 0);

        if (hasNegativeCarry) {
            this.showToast(
                'Warning',
                'Carry Forward is negative. Please adjust allocated amounts.',
                'warning'
            );
        }

        setTimeout(() => {
            this.evaluateOverspendAndToggleSave();
        }, 500);
    })
    .catch(err => {
        console.error('Auto-recalculate preview failed', err);
    });
}

  handleAmountChange(event) {
    // Get numeric value from field
   // const rawValue = event.target.value;
   const rawValue = event.detail.value;
    const amount = parseFloat(rawValue) || 0;
    if (amount < 0) {

      this.showToast(
          'Error',
          'Approved Amount cannot be negative',
          'error'
      );
       const inputField = this.template.querySelector(
          '[data-id="amountField"]'
      );

      if (inputField) {
          inputField.value = null;
      }
      this.approvedAmount = this.formatCurrency(0);
      this.availablefunds = this.formatCurrency(0);

      return;
    }
  
    // Save it in your tracked variable
    this.approvedAmount = this.formatCurrency(amount);
  
    console.log(' Approved Amount Updated:', this.approvedAmount);

    const spentRaw = parseFloat(String(this.spentAmount).replace(/[^0-9.-]+/g, '')) || 0;
    const approvedRaw = parseFloat(String(this.approvedAmount).replace(/[^0-9.-]+/g, '')) || 0;
    this.availablefunds = this.formatCurrency(approvedRaw - spentRaw);

    console.log(' Approved Amount Updated:', this.approvedAmount);
    console.log(' Available Funds Updated:', this.availablefunds);
     console.log('recordId in generate:', this.recordId);

    //Check recordId and set available funds
    if (!this.recordId) {
        const spent =0;
        this.spentAmount = this.formatCurrency(spent);
        this.availablefunds = this.approvedAmount;

    }
     console.log('generatedPeriods:', this.generatedPeriods);
    console.log('selectedPeriodType:', this.selectedPeriodType);

     if (this.generatedPeriods && this.generatedPeriods.length > 0 && this.selectedPeriodType) {
       
        setTimeout(() => {
           this.autoRecalculatePeriods();
        }, 1000);
    }

  }

  handleGeneratePeriods() {
      console.log('Generate clicked');

      if (!this.selectedPeriodType) {
        this.showToast('Warning', 'Please select a period type first.', 'warning');
        return;
      }
  // this.lastGeneratedPeriodType = this.selectedPeriodType;

      const num = parseInt(this.selectedPeriodType, 10);
      //  NEW LOGIC — PERIOD FORMAT CHANGE WARNING
      if (
        this.originalPeriodType &&                 // edit mode
        this.generatedPeriods.length > 0 &&        // existing splits present
        this.originalPeriodType !== String(num)    // format changed
      ) {
        // this.showToast(
        //   'Warning',
        //   'Changing the period format will remove all of your existing period data and regenerate new periods.',
        //   'warning'
        // );

        //  Clear existing splits before regenerate
        this.generatedPeriods = [];
      }

      if (!this.approvedAmount || this.approvedAmount <= 0) {
        this.showToast('Warning', 'Approved amount must be greater than zero.', 'warning');
        return;
      }
      // if (!this.availablefunds || this.availablefunds <= 0) {
      //   this.showToast('Warning', 'Available funds must be greater than zero.', 'warning');
      //   return;
      // }
      const cleanAmount = parseFloat(
        String(this.approvedAmount).replace(/[^0-9.-]+/g, "")
      ) || 0;
      const amountPerPeriod = cleanAmount / num;
      console.log('amountPerPeriod : ',amountPerPeriod);
      //const amountPerPeriod = this.availablefunds / num;
      const approved = new Date(this.approvedDate || new Date());
      console.log('approved : ',approved);
      const monthsPerPeriod = 12 / num;

      const periods = [];

      for (let i = 0; i < num; i++) {
        let start;

        if (i === 0) {
          //  First period starts from approved date
          start = new Date(approved);
        } else {
          //  Next period starts the day after previous period ends
          const prevEnd = new Date(periods[i - 1].endDate);
          start = new Date(prevEnd);
          start.setDate(start.getDate() + 1);
        }

        //  End date = start + monthsPerPeriod - 1 day
        const end = new Date(start);
        end.setMonth(end.getMonth() + monthsPerPeriod);
        end.setDate(end.getDate() - 1);

        // Label logic (your original logic preserved)
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

        periods.push({
          id: null,
          uniqueKey: `period-${i}`,
          label,
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10),
          //amount: amountPerPeriod.toFixed(2),  //toFixed(2) for adding decimal places also eg: 20.25
          originalAmount: Number(amountPerPeriod.toFixed(2)), 
           baseAmount: Number(amountPerPeriod.toFixed(2)),
         // carryForward: 0,
          threshold: 80, // default threshold
          status: 'Future',


          amount: this.formatNumber(amountPerPeriod),
          allocatedAmount: Number(amountPerPeriod.toFixed(2)),

          carryForward: 0,
          carryFormatted: this.formatNumber(0),

          spentAmount: 0,
          spentFormatted: this.formatNumber(0),
          
        });
      }
  //isLocked: false
  //status: i === 0 ? 'Active' : 'Future',
      this.generatedPeriods = periods;
      const today = new Date();
      today.setHours(0, 0, 0, 0);  
      
      this.generatedPeriods = this.generatedPeriods.map(p => {
        const start = new Date(p.startDate);
        const end = new Date(p.endDate);
        start.setHours(0, 0, 0, 0); 
        end.setHours(0, 0, 0, 0);

        let status = 'Future';

        if (end < today) {
          status = 'Completed';
        } else if (start <= today && end >= today) {
          status = 'Active';
        }

        return {
          ...p,
          status
        };
      });

      const previewPayload = this.generatedPeriods.map(p => ({
        label: p.label,
        startDate: p.startDate,
        endDate: p.endDate
      }));
      console.log(' previewPayload  : ', JSON.stringify(previewPayload));
      console.log(' Generated Periods before previewSpentForPeriods : ', JSON.stringify(this.generatedPeriods));
      console.log('this.recordId : ', this.recordId);
              //=====================FOR GENERATE BUTTON CLICK======================//

      previewSpentForPeriods({ clientId: this.clientId,fundTrackerId: this.recordId, periods: previewPayload })
        .then(result => {
          
          console.log(' result in previewSpentForPeriods : ', JSON.stringify(result));
          console.log(' Generated Periods before : ', JSON.stringify(this.generatedPeriods));
          let cumulativeCarry = 0;
          
          this.generatedPeriods = this.generatedPeriods.map((p, index) => {
          const spent = result[p.label] ?? p.spentAmount ?? 0;
          console.log('spent : ', spent);

          // Base allocated + carry forward from previous period
         // const baseAllocated = parseFloat(p.amount) || 0;
          const baseAllocated = this.parseNumber(p.amount) || 0;
          const allocatedWithCarry = baseAllocated + cumulativeCarry;
          console.log(`Period ${index + 1} | baseAllocated: ${baseAllocated} | carry added: ${cumulativeCarry} | allocatedWithCarry: ${allocatedWithCarry}`);

          let carryForward = 0;

          if (p.status === 'Completed') {
              // Carry = what was allocated (including previous carry) minus spent
              // carryForward = Math.max(0, allocatedWithCarry - spent);
              carryForward    = allocatedWithCarry - spent;
              cumulativeCarry = carryForward; // Pass carry to next period
          } else if (p.status === 'Active') {
              // Active period gets carry added, but doesn't pass carry forward
              carryForward =0;
              cumulativeCarry = 0; // Stop cascading after active period
          } else {
              // Future: just receives carry but doesn't generate carry
               carryForward    = 0;
                cumulativeCarry = 0;
          }

          return {
              ...p,
              // amount: allocatedWithCarry.toFixed(2),        // Update displayed allocated
              // spentAmount: spent,
              // carryForward

            amount: this.formatNumber(allocatedWithCarry),
            allocatedAmount: Number(allocatedWithCarry.toFixed(2)),
            baseAmount:      Number(baseAllocated.toFixed(2)),
            // ✅ spent
            spentAmount: Number(spent) || 0,
            spentFormatted: this.formatNumber(Number(spent) || 0),

            // ✅ carry
            carryForward: Number(carryForward.toFixed(2)),
            carryFormatted: this.formatNumber(carryForward),

            // (optional but good consistency)
            carryClass:      carryForward < 0
                ? 'floating-label-PM red-border'
                : 'floating-label-PM'
          };
      });
       const hasNegativeCarry = this.generatedPeriods.some(p => p.carryForward < 0);
        if (hasNegativeCarry) {
            this.showToast(
                'Warning',
                'Carry Forward is negative. Please adjust allocated amounts.',
                'warning'
            );
        }

          //Disable save conditionally
          this.evaluateOverspendAndToggleSave();
          console.log(' Generated Periods after : ', JSON.stringify(this.generatedPeriods));
            

        }).catch(err => {
            console.error(' Preview spent failed', err);
        });
      }
      //For Disabling Save/ Update button when ever Spent Exceedes > than Allocated amount
  evaluateOverspendAndToggleSave() {


       // const approved = parseFloat(this.approvedAmount) || 0;
       const approved = parseFloat(
            String(this.approvedAmount).replace(/[^0-9.-]+/g, "")
        ) || 0;

    // const totalSpent = (this.generatedPeriods || []).reduce(
    //   (sum, p) => sum + (parseFloat(p.spentAmount) || 0),
    //   0
    // );
    const totalSpent = (this.generatedPeriods || []).reduce(
      (sum, p) =>
        sum +
        (parseFloat(String(p.spentAmount).replace(/[^0-9.-]+/g, "")) || 0),
      0
    );

    if (totalSpent > approved) {
      this.saveDisabled = true;

      this.showToast(
        'Error',
        'Total spent exceeds approved amount. Please adjust services or funding.',
        'error'
      );
    } else {
      this.saveDisabled = false;
    }
    }
handleInputChange(event) {
    const index = parseInt(event.target.dataset.index, 10);
    const field = event.target.dataset.field;
    let value = event.target.value;

    if (field === 'status' && this.generatedPeriods[index]?.isCompleted) {
        return;
    }

    if (field === 'carryForward' || field === 'threshold') {
        value = parseFloat(value) || 0;
    }

    if (field === 'endDate') {
        this.handleEndDateCascade(index, value);
    }

    //  CHANGED: ONLY STORE VALUE (NO REBALANCE HERE)
    if (field === 'amount') {
        let periods = [...this.generatedPeriods];
        value = value.replace(/,/g, '');
        periods[index] = {
            ...periods[index],
            amount: value // raw typing value
        };

        this.generatedPeriods = [...periods];
        this.calculateTotal();
        return;
    }

    this.generatedPeriods = this.generatedPeriods.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
    );

    this.calculateTotal();
}

  formatNumber(value) {
      const num = parseFloat(value) || 0;

      return new Intl.NumberFormat('en-AU', {
          style: 'currency',
          currency: 'AUD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
      }).format(num);
  }

parseNumber(value) {
    if (!value) return 0;

    //return parseFloat(value.replace(/,/g, '')) || 0;
    return parseFloat(
        String(value)
            .replace(/\$/g, '')
            .replace(/,/g, '')
    ) || 0;
}
handleAmountBlur(event) {

    const index =
        parseInt(
            event.target.dataset.index,
            10
        );

    const newValue =
        Number(
            (
                this.parseNumber(
                    event.target.value
                ) || 0
            ).toFixed(2)
        );

    let periods =
        [...this.generatedPeriods];

    const period =
        periods[index];

    const approvedTotal =
        Number(
            (
                parseFloat(
                    String(this.approvedAmount)
                        .replace(/[^0-9.-]+/g, '')
                ) || 0
            ).toFixed(2)
        );

    const totalSpent =
        Number(

            periods.reduce(

                (sum, p) =>

                    sum +
                    (
                        parseFloat(
                            p.spentAmount
                        ) || 0
                    ),

                0

            ).toFixed(2)
        );

    const availableFunds =
        Number(
            (
                approvedTotal -
                totalSpent
            ).toFixed(2)
        );

    const periodSpent =
        Number(
            (
                parseFloat(
                    period.spentAmount
                ) || 0
            ).toFixed(2)
        );

    if (newValue < periodSpent) {

        this.dispatchEvent(
            new ShowToastEvent({

                title:
                    'Invalid Amount',

                message:
                    `Cannot be less than spent ($${periodSpent.toFixed(2)}).`,

                variant:
                    'error'
            })
        );

        event.target.value =
            this.formatNumber(
                period.allocatedAmount
            );

        return;
    }

    const spentBeforeIndex =
        Number(

            periods.reduce(

                (sum, p, i) =>

                    i < index

                        ? sum +
                          (
                            parseFloat(
                                p.spentAmount
                            ) || 0
                          )

                        : sum,

                0

            ).toFixed(2)
        );

    const maxAllowedForPeriod =
        Number(
            (
                approvedTotal -
                spentBeforeIndex
            ).toFixed(2)
        );

    if (newValue > maxAllowedForPeriod) {

        this.dispatchEvent(
            new ShowToastEvent({

                title:
                    'Error',

                message:
                    'Exceeds Maximum Allowed.',

                variant:
                    'error'
            })
        );

        event.target.value =
            this.formatNumber(
                period.allocatedAmount
            );

        return;
    }

    const oldValue =
        Number(
            (
                parseFloat(
                    period.allocatedAmount
                ) || 0
            ).toFixed(2)
        );

    if (oldValue === newValue) {
        return;
    }

    const delta =
        Number(
            (
                newValue -
                oldValue
            ).toFixed(2)
        );

    const recalculatedBase =
        Number(
            (
                (
                    parseFloat(
                        period.baseAmount
                    ) || 0
                )
                +
                delta
            ).toFixed(2)
        );

    periods[index] = {

        ...periods[index],

        allocatedAmount:
            newValue,

        baseAmount:
            recalculatedBase,

        amount:
            this.formatNumber(
                newValue
            )
    };

    const success =
        this.rebalanceAllocationsFromIndex(

            index,
            periods,
            oldValue,
            newValue
        );

    if (!success) {

        event.target.value =
            this.formatNumber(
                period.allocatedAmount
            );

        return;
    }

    this.generatedPeriods =
        [...periods];

    event.target.value =
        this.formatNumber(
            newValue
        );

    this.calculateTotal();
}

   handleEndDateCascade(changedIndex, newEndDate) {
      // 🔴 Validation: duplicate end dates
      const duplicate = this.generatedPeriods.some(
        (p, i) => i !== changedIndex && p.endDate === newEndDate
      );

      if (duplicate) {
        this.showToast(
          'Error',
          'This end date already matches another period. Please select a different date.',
          'error'
        );
        return;
      }

      // ✅ Update current period end date
      this.generatedPeriods[changedIndex] = {
        ...this.generatedPeriods[changedIndex],
        endDate: newEndDate
      };

      const monthsPerPeriod = 12 / this.generatedPeriods.length;

      // ✅ Cascade forward
      for (let i = changedIndex + 1; i < this.generatedPeriods.length; i++) {
        const prevEnd = new Date(this.generatedPeriods[i - 1].endDate);

        // Start = previous end + 1 day
        const start = new Date(prevEnd);
        start.setDate(start.getDate() + 1);

        // End = start + period length - 1 day
        const end = new Date(start);
        end.setMonth(end.getMonth() + monthsPerPeriod);
        end.setDate(end.getDate() - 1);

        this.generatedPeriods[i] = {
          ...this.generatedPeriods[i],
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10)
        };
      }

      // 🔑 Force reactivity
      this.generatedPeriods = [...this.generatedPeriods];
    }
    rebalanceAllocationsFromIndex(
        changedIndex,
        periods,
        oldValue,
        newValue
    ) {

        const approvedTotal =
            Number(
                (
                    parseFloat(
                        String(this.approvedAmount)
                            .replace(/[^0-9.-]+/g, '')
                    ) || 0
                ).toFixed(2)
            );

        const totalSpent =
            Number(

                periods.reduce(

                    (sum, p) =>

                        sum +
                        (
                            parseFloat(
                                p.spentAmount
                            ) || 0
                        ),

                    0

                ).toFixed(2)
            );

        const availableFunds =
            Number(
                (
                    approvedTotal -
                    totalSpent
                ).toFixed(2)
            );

        const diff =
            Number(
                (
                    oldValue -
                    newValue
                ).toFixed(2)
            );

        console.log(
            'REBALANCE DIFF => ',
            diff
        );

        if (
            changedIndex + 1 <
            periods.length
        ) {

            const nextIdx =
                changedIndex + 1;

            const nextBase =
                Number(
                    (
                        parseFloat(
                            periods[nextIdx]
                                .baseAmount
                        ) || 0
                    ).toFixed(2)
                );

            const newNextBase =
                Number(
                    (
                        nextBase +
                        diff
                    ).toFixed(2)
                );

            if (newNextBase < 0) {

                this.dispatchEvent(
                    new ShowToastEvent({

                        title:
                            'Error',

                        message:
                            'Insufficient funds in next period.',

                        variant:
                            'error'
                    })
                );

                return false;
            }

            periods[nextIdx] = {

                ...periods[nextIdx],

                // IMPORTANT
                // ONLY BASE

                baseAmount:
                    newNextBase
            };
        }
        let runningCarry = 0;

        console.log('=== CASCADE ===');

        for (
            let i = 0;
            i < periods.length;
            i++
        ) {

            const p =
                periods[i];

            const spent =
                Number(
                    (
                        parseFloat(
                            p.spentAmount
                        ) || 0
                    ).toFixed(2)
                );

            const base =
                Number(
                    (
                        parseFloat(
                            p.baseAmount
                        ) || 0
                    ).toFixed(2)
                );

            const visibleAllocated =
                Number(
                    (
                        base +
                        runningCarry
                    ).toFixed(2)
                );

            let carry = 0;

            console.log(

                `P${i+1} | base:${base} | carryIn:${runningCarry} | total:${visibleAllocated} | spent:${spent} | status:${p.status}`
            );

            if (
                p.status ===
                'Completed'
            ) {

                carry =
                    Number(
                        (
                            visibleAllocated -
                            spent
                        ).toFixed(2)
                    );

                if (carry < 0) {

                    this.dispatchEvent(
                        new ShowToastEvent({

                            title:
                                'Invalid Amount',

                            message:
                                'Allocated amount cannot be less than spent.',

                            variant:
                                'error'
                        })
                    );
                    return false;
                }

                runningCarry = carry;
                console.log( `P${i+1} COMPLETED → total:${visibleAllocated} | carry:${carry}` );

            } else {
                carry = 0;
                runningCarry = 0;

                console.log( `P${i+1} ACTIVE/FUTURE → total:${visibleAllocated}`);
            }

            periods[i] = {
                ...p,
                amount:this.formatNumber(visibleAllocated),
                allocatedAmount:visibleAllocated,
                baseAmount:base,
                carryForward:carry,
                carryFormatted: this.formatNumber(carry),
                spentFormatted: this.formatNumber(spent),
                  carryClass:  carry < 0
                    ? 'floating-label-PM red-border'
                    : 'floating-label-PM'
            };
        }

        const totalBase =
            Number(
                periods.reduce(
                    (sum, p) =>
                        sum +
                        (
                            parseFloat(
                                p.baseAmount
                            ) || 0
                        ),
                    0
                ).toFixed(2)
            );

        const activeFutureAllocated =
            Number(
                periods.reduce(
                    (sum, p) =>
                        p.status !== 'Completed'
                            ? sum +
                            (
                                parseFloat(
                                    p.allocatedAmount
                                ) || 0
                            )
                            : sum,
                    0
                ).toFixed(2)
            );

        const activeFutureSpent =
            Number(
                periods.reduce(
                    (sum, p) =>
                        p.status !== 'Completed'
                            ? sum +
                            (
                                parseFloat(
                                    p.spentAmount
                                ) || 0
                            )

                            : sum,
                    0
                ).toFixed(2)
            );

        const activeFutureNet =
            Number(
                (
                    activeFutureAllocated -
                    activeFutureSpent
                ).toFixed(2)
            );

        console.log(

            `=== VERIFY | totalBase:${totalBase} | approvedTotal:${approvedTotal} | activeFutureAllocated:${activeFutureAllocated} | activeFutureSpent:${activeFutureSpent} | activeFutureNet:${activeFutureNet} | availableFunds:${availableFunds}`
        );

        console.log( `totalBase=approved: ${ Math.abs( totalBase -approvedTotal) < 0.02 ? '✅'  : '❌'}`);

        console.log( `activeFutureNet=available: ${ Math.abs(activeFutureNet -availableFunds) < 0.02 ? '✅'  : '❌' }`);

        return true;
    }
 
  get formattedAvailablefunds() {
    return this.availablefunds
      ? this.availablefunds.toString()
      : '0';
  }

// async handleSaveFundSplits() {
//     console.log('METHOD IS handleSaveFundSplits');
//     try {
//         if (!this.recordId || !this.generatedPeriods.length) {
//             console.warn('⚠️ No record or periods to save');
//             return;
//         }

//         // ✅ always log what we are about to send
//         console.log('=== SAVE PAYLOAD DEBUG ===', JSON.stringify(
//             this.generatedPeriods.map(p => ({
//                 label: p.label,
//                 baseAmount: p.baseAmount,
//                 allocatedAmount: p.allocatedAmount
//             }))
//         ));

//         const splitsToSave = this.generatedPeriods.map(p => ({
//             Id: p.id ? p.id : null,
//             Funds_Tracker__c: this.recordId,
//             Usage_Threshold__c: p.threshold,
//             Start_Date__c: p.startDate
//                 ? new Date(p.startDate).toISOString().split('T')[0]
//                 : null,
//             End_Date__c: p.endDate
//                 ? new Date(p.endDate).toISOString().split('T')[0]
//                 : null,
//             // ✅ baseAmount = pure base without carry — correct for DB
//             Allocated__c: parseFloat(p.baseAmount) || 0,
//             Spent_Amount__c: parseFloat(p.spentAmount) || 0,
//             Status__c: p.status,
//             Name: p.label
//         }));

//         const hasAnyNewSplit = this.generatedPeriods.some(p => !p.id);
//         const invalidPeriod  = this.generatedPeriods.find(p => !p.startDate || !p.endDate);

//         if (invalidPeriod) {
//             this.showToast('Error', 'All periods must have both Start Date and End Date before saving.', 'error');
//             return;
//         }

//         console.log('splitsToSave', JSON.stringify(splitsToSave));

//         const isPeriodTypeChanged =
//             this.originalPeriodType &&
//             this.selectedPeriodType !== this.originalPeriodType;

//         let result;

//         if (isPeriodTypeChanged || hasAnyNewSplit) {
//             console.log('🔁 replaceFundSplits');
//             result = await replaceFundSplits({
//                 fundTrackerId: this.recordId,
//                 newSplits: splitsToSave
//             });
//         } else {
//             console.log('✏️ saveFundSplits');
//             result = await saveFundSplits({
//                 fundTrackerId: this.recordId,
//                 splits: splitsToSave
//             });
//         }

//         console.log('✅ Fund splits saved:', JSON.stringify(result));

//         // ✅ rehydrate: Allocated__c from result = base stored in DB
//         // allocatedAmount for UI = base + prevCarry (carry-inclusive)
//         this.generatedPeriods = result.map((r, i) => {
//             //const base      = r.Allocated__c || 0;
//             const prevCarry = i > 0 ? (result[i - 1].Carry_Forward__c || 0) : 0;
//            // const allocatedForUI = base + prevCarry;
//              const allocatedForUI = r.Allocated__c || 0;
//              const base = i === 0
//                 ? allocatedForUI
//                 : allocatedForUI - (result[i - 1].Carry_Forward__c || 0);

//             return {
//                 id: r.Id,
//                 label: r.Name,
//                 startDate: r.Start_Date__c,
//                 endDate: r.End_Date__c,
//                 amount: this.formatNumber(allocatedForUI),
//                 allocatedAmount: allocatedForUI,  // ✅ carry-inclusive for UI
//                 baseAmount: base,                  // ✅ pure base for next save
//                 carryForward: r.Carry_Forward__c || 0,
//                 spentAmount: r.Spent_Amount__c ?? 0,
//                 spentFormatted: this.formatNumber(r.Spent_Amount__c || 0),
//                 carryFormatted: this.formatNumber(r.Carry_Forward__c || 0),
//                 status: r.Status__c,
//                 isCompleted: r.Status__c === 'Completed',
//                 threshold: r.Usage_Threshold__c ? Number(r.Usage_Threshold__c) : 80,
//                 carryClass: (r.Carry_Forward__c || 0) < 0
//                     ? 'floating-label-PM red-border'
//                     : 'floating-label-PM'
//             };
//         });

//         this.showToast('Success', 'Fund splits saved successfully!', 'success');

//     } catch (error) {
//         console.error('❌ Error saving splits:', error);
//         this.showToast('Error', error.body ? error.body.message : error.message, 'error');
//     }
// }

  async handleSaveFundSplits() {

    console.log('METHOD IS handleSaveFundSplits');

    try {

        if (
            !this.recordId ||
            !this.generatedPeriods.length
        ) {

            console.warn(
                'No record or periods to save'
            );

            return;
        }

        // =================================================
        // SAVE ONLY BASE VALUES
        // =================================================

        const splitsToSave =
            this.generatedPeriods.map(p => ({

                Id:
                    p.id || null,

                Funds_Tracker__c:
                    this.recordId,

                Usage_Threshold__c:
                    p.threshold,

                Start_Date__c:
                    p.startDate
                        ? new Date(p.startDate)
                            .toISOString()
                            .split('T')[0]
                        : null,

                End_Date__c:
                    p.endDate
                        ? new Date(p.endDate)
                            .toISOString()
                            .split('T')[0]
                        : null,

                // =========================================
                // IMPORTANT
                // SAVE PURE BASE ONLY
                // =========================================

                Allocated__c:
                    parseFloat(
                        p.baseAmount
                    ) || 0,

                Spent_Amount__c:
                    parseFloat(
                        p.spentAmount
                    ) || 0,

                Carry_Forward__c:
                    parseFloat(
                        p.carryForward
                    ) || 0,

                Status__c:
                    p.status,

                Name:
                    p.label
            }));

        console.log(
            'splitsToSave',
            JSON.stringify(splitsToSave)
        );

        const hasAnyNewSplit =
            this.generatedPeriods.some(
                p => !p.id
            );

        const isPeriodTypeChanged =
            this.originalPeriodType &&
            this.selectedPeriodType !==
            this.originalPeriodType;

        let result;

        if (
            isPeriodTypeChanged ||
            hasAnyNewSplit
        ) {

            console.log(
                'replaceFundSplits'
            );

            result =
                await replaceFundSplits({

                    fundTrackerId:
                        this.recordId,

                    newSplits:
                        splitsToSave
                });

        } else {

            console.log(
                'saveFundSplits'
            );

            result =
                await saveFundSplits({

                    fundTrackerId:
                        this.recordId,

                    splits:
                        splitsToSave
                });
        }

        console.log(
            'Fund splits saved:',
            JSON.stringify(result)
        );

        // =================================================
        // RELOAD FRESH
        // =================================================

        await this.loadFundSplits();

        this.showToast(

            'Success',

            'Fund splits saved successfully!',

            'success'
        );

    } catch (error) {

        console.error(
            'Error saving splits:',
            error
        );

        this.showToast(

            'Error',

            error.body
                ? error.body.message
                : error.message,

            'error'
        );
    }
}

   async recalculateAfterSave() {
    try {
        console.log('➡️ Saving fund splits');

        const oldCarryMap = {};
        this.generatedPeriods.forEach(p => {
            oldCarryMap[p.id] = Number(p.carryForward || 0);
        });

        await this.handleSaveFundSplits();

        // const recalculatedSplits = await recalculateFundPeriods({
        //     fundTrackerId: this.recordId,
        //     clientId: this.clientId
        // });

        //console.log('✅ recalculated:', JSON.stringify(recalculatedSplits));

        // ✅ same rehydration pattern as everywhere else
        // this.generatedPeriods = this.normalizePeriods(
        //     recalculatedSplits.map((r, i) => {
        //         const base           = r.Allocated__c || 0;
        //         const prevCarry      = i > 0 ? (recalculatedSplits[i - 1].Carry_Forward__c || 0) : 0;
        //         const allocatedForUI = base + prevCarry;

        //         return {
        //             id:              r.Id,
        //             label:           r.Name,
        //             startDate:       r.Start_Date__c,
        //             endDate:         r.End_Date__c,
        //             amount:          this.formatNumber(allocatedForUI),
        //             allocatedAmount: allocatedForUI,
        //             baseAmount:      base,
        //             carryForward:    r.Carry_Forward__c || 0,
        //             spentAmount:     r.Spent_Amount__c ?? 0,
        //             spentFormatted:  this.formatNumber(r.Spent_Amount__c || 0),
        //             carryFormatted:  this.formatNumber(r.Carry_Forward__c || 0),
        //             status:          r.Status__c,
        //             isCompleted:     r.Status__c === 'Completed',
        //             threshold:       r.Usage_Threshold__c ? Number(r.Usage_Threshold__c) : 80,
        //             carryClass:      (r.Carry_Forward__c || 0) < 0
        //                 ? 'floating-label-PM red-border'
        //                 : 'floating-label-PM'
        //         };
        //     })
        // );

        this.evaluateOverspendAndToggleSave();

        const completedWithCarry = this.generatedPeriods.find(
            p => p.status === 'Completed' && Number(p.carryForward || 0) > 0
        );
        const activePeriod = this.generatedPeriods.find(p => p.status === 'Active');

        if (completedWithCarry && activePeriod) {
            const oldCarry = oldCarryMap[completedWithCarry.id] ?? 0;
            const newCarry = Number(completedWithCarry.carryForward || 0);
            if (newCarry > oldCarry) {
                this.showToast(
                    'Information',
                    'The previous period has ended. Any unused funds of previous period have been made available in the current period.',
                    'info'
                );
            }
        }

    } catch (error) {
        console.error('❌ Recalculation error:', error);
        this.showToast('Error', error.body?.message || error.message, 'error');
    }
}
    
  calculateTotal() {
    const sum = this.generatedPeriods.reduce(
     // (acc, p) => acc + (parseFloat(p.amount) || 0),
     (acc, p) => acc + (parseFloat(p.allocatedAmount) || 0),
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

resetPeriodManagementState(isHardReset = true) {
  if (isHardReset) {
    this.isPeriodManagementEnabled = false;
    this.selectedPeriodType = null;
    this.originalPeriodType = null; 
    this.selectedLabel = '';
    this.generatedPeriods = [];
    this.totalAllocated = 0;
    this.description = '';
    this.amount = 0;         
    this.approvedAmount = 0;
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
        } else if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
           
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

  documentClickHandler;

  validateServiceType() {
      console.log('🔍 validateServiceType fired');

      const entered = (this.serviceTypeName || '').trim();
      console.log('➡️ Entered value :', entered);

      if (!entered) {
          console.log('⚠️ No value entered. Closing dropdown.');
          this.showServiceTypeDropdown = false;
          return;
      }

      const isValid = this.serviceTypeOption.some(
          opt => opt.label.toLowerCase() === entered.toLowerCase()
      );

      console.log('✅ Is valid service type ?', isValid);

      if (!isValid) {
          console.warn('❌ Invalid service type. Clearing value & state.');

          this.serviceTypeName = '';
          this.stateValue = null;
          this.NdisServiceGroupName = false;
      }

      
      this.showServiceTypeDropdown = false;

      console.log('📦 Final state after validation =>', {
          serviceTypeName: this.serviceTypeName,
          stateValue: this.stateValue,
          showServiceTypeDropdown: this.showServiceTypeDropdown
      });
  }


  handleServiceTypeSearch(event) {
      const value = event.target.value;
      const searchKey = value.toLowerCase();

      console.log('⌨️ handleServiceTypeSearch fired');
      console.log('➡️ Raw input value :', value);

      this.serviceTypeName = value;
      this.showServiceTypeDropdown = true;

      // ✅ When user clicks the clear (X) icon
      if (!value) {
          console.warn('🧹 Input cleared. Resetting options & state.');

          this.filteredServiceTypeOptions = [...this.serviceTypeOption];
          this.stateValue = null;
          this.NdisServiceGroupName = false;

          console.log('📦 After clear =>', {
              filteredCount: this.filteredServiceTypeOptions.length,
              stateValue: this.stateValue
          });

          return;
      }

      this.filteredServiceTypeOptions = this.serviceTypeOption.filter(opt =>
          opt.label.toLowerCase().includes(searchKey)
      );

      console.log(
          '🔎 Filtered options count :',
          this.filteredServiceTypeOptions.length
      );
  }


  handleServiceTypeSelect(event) {
      event.stopPropagation(); // ⛔ prevent document close

      const selectedLabel = event.currentTarget.dataset.label;

      console.log('🖱️ handleServiceTypeSelect fired');
      console.log('➡️ Selected label :', selectedLabel);

      this.serviceTypeName = selectedLabel;
      this.showServiceTypeDropdown = false;

      // Reset for next open
      this.filteredServiceTypeOptions = [...this.serviceTypeOption];

      console.log('📦 After selection =>', {
          serviceTypeName: this.serviceTypeName,
          showServiceTypeDropdown: this.showServiceTypeDropdown
      });

      // this.handleServiceChange({
      //     target: { name: 'serviceType', value: this.serviceTypeName }
      // });
      this.handleServiceChange({
          target: { dataset: { name: 'serviceType' }, name: 'serviceType', value: this.serviceTypeName }
      });
  }


  openServiceTypeDropdown() {
      console.log('🟢 openServiceTypeDropdown fired');

      this.filteredServiceTypeOptions = [...this.serviceTypeOption]; // ✅ RESET
      this.showServiceTypeDropdown = true;

      console.log('📦 Dropdown opened with options count :',
          this.filteredServiceTypeOptions.length
      );
  }


  handleServiceTypeInputMouseDown(event) {
      console.log('🖱️ handleServiceTypeInputMouseDown - stop propagation');
      event.stopPropagation(); // ⛔ stops document outside click
  }

  get formatApprovedDate() {
      return this.approvedDate
          ? new Date(this.approvedDate).toLocaleDateString('en-AU')
          : '';
  }
  handleServiceChange(event) {
    // const name = event.target.name;
    // const value = event.target.value;
    if (!event || !event.target) return;
     const name = event.target.dataset.name || event.target.name;
    const value = event.target.value;

    console.log('handleServiceChange fired | name:', name, '| value:', value);
    if (name === "serviceType") {
      this.serviceTypeName = value;
      console.log("443 line " + this.serviceTypeName);
        if (this.serviceTypeName && this.clientId) {
          checkFundExists({
            clientId: this.clientId,
            serviceType: this.serviceTypeName,
          }).then((exists) => {
            if (exists) {
              this.dispatchEvent(
                new ShowToastEvent({
                  title: "Warning",
                  message: "Service Type already exists for this Participant.",
                  variant: "warning"
                })
              );
              this.serviceGroupName = []; // clear items
              return;
            } else {
              // Optional: Call fetch logic if no duplicate fund found
              getNDISServiceLineItem({
                ServiceItemNames: this.serviceTypeName,
                ServiceDate: this.approvedDate,
                clientId: this.clientId
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

    } else if (name === "approvedDate") {
      console.log('approvedDate else block');
      this.approvedDate = value;
      console.log(' this.approvedDate in  else block ',  this.approvedDate);
      if (this.generatedPeriods && this.generatedPeriods.length > 0 && this.selectedPeriodType) {
         console.log('existing periods are there for this fund ');
            //this.autoRecalculatePeriods();
             setTimeout(() => {
              this.autoRecalculatePeriods();
            }, 400);
        }
       
    }
    console.log("Approved Date : " + this.approvedDate);

    this.serviceGroupName = [];
    this.NdisServiceGroupName = false;
    this.stateValue = "";

    // if (this.serviceTypeName && this.clientId) {
    //   checkFundExists({
    //     clientId: this.clientId,
    //     serviceType: this.serviceTypeName,
    //   }).then((exists) => {
    //     if (exists) {
    //       this.dispatchEvent(
    //         new ShowToastEvent({
    //           title: "Warning",
    //           message: "Fund already exists for this Participant.",
    //           variant: "warning"
    //         })
    //       );
    //       this.serviceGroupName = []; // clear items
    //       return;
    //     } else {
    //       // Optional: Call fetch logic if no duplicate fund found
    //       getNDISServiceLineItem({
    //         ServiceItemNames: this.serviceTypeName,
    //         ServiceDate: this.approvedDate,
    //         clientId: this.clientId
    //       })
    //         .then((response) => {
    //           this.serviceGroupName = response.map((item) => ({
    //             ...item
    //           }));
    //         })
    //         .catch((error) => {
    //           console.error("Error fetching NDIS Catalog:", error);
    //           this.serviceGroupName = [];
    //         });
    //     }
    //   });
    // }

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
        ServiceDate: this.approvedDate,
        clientId: this.clientId
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

  handleStatusChange(event) {
    const value = event.target.value;

    console.log('Status changed:', value);

    // Reset button first
    this.saveDisabled = false;

    // Only validate when user selects Active
    if (value === 'Active') {

        if (!this.clientId || !this.serviceTypeName) {
            return;
        }

        checkFundExists({
            clientId: this.clientId,
            serviceType: this.serviceTypeName
        })
        .then((exists) => {
            if (exists) {

                // ❌ Disable Save button
                this.saveDisabled = true;

                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Active fund already exists for this Participant.',
                        variant: 'error'
                    })
                );
            } else {
                // ✅ Enable Save
                this.saveDisabled = false;
            }
        })
        .catch((error) => {
            console.error('Error checking fund:', error);
        });
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
        console.log("🟨 clientId:", this.clientId);

        getNDISServiceLineItem({
          ServiceItemNames: this.serviceTypeName,
          ServiceDate: this.approvedDate,
          clientId: this.clientId
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
                console.log('totalRecords1: ' + this.totalRecords1 + ' pageNumber1: ' + this.pageNumber1 + ' pageSize1:')
                if (this.totalRecords1 > 0) {
                    this.paginationVisible = true;
                }
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
              console.log('totalRecords1: ' + this.totalRecords1 + ' pageNumber1: ' + this.pageNumber1 + ' pageSize1:')
              if (this.totalRecords1 > 0) {
                  this.paginationVisible = true;
              }
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
  @track showAddRow = false;
  newSupportItemName = '';
  newSupportItemNumber = '';
  newShift = '';
  newAmount = '';

  isCustomShiftOpen = false;
  customShiftDisplayText = 'Select Shift';
  customShiftSelectedClass = 'placeholder-text';
  customShiftOptions = [];

  handleAddSupportItem() {
      this.showAddRow = true;

      // Reset add-row state every time
      this.newSupportItemName = '';
      this.newSupportItemNumber = '';
      this.newAmount = '';

      this.isCustomShiftOpen = false;
      this.customShiftDisplayText = 'Select Shift';
      this.customShiftSelectedClass = 'placeholder-text';

      this.customShiftOptions = this.shiftOptions
          ? JSON.parse(JSON.stringify(this.shiftOptions))
          : [];
  }

  handleSaveNewSupportItem() {
      const newRow = {
          Id: `temp-${Date.now()}`,

          serviceSupportItem: this.newSupportItemName,
          Support_Item_Number__c: this.newSupportItemNumber,
          amount: Number(this.newAmount) || 0,
          isSelected: false,

          isEditingName: false,
          isEditingAmount: false,

          shiftNameDisplayText: this.customShiftDisplayText,
          shiftNameSelectedClass: this.customShiftSelectedClass,
          isShiftNameOpen: false,

          shiftOptions: JSON.parse(JSON.stringify(this.customShiftOptions))
      };

      this.serviceGroupName = [...this.serviceGroupName, newRow];

      // Close Add Row
      this.showAddRow = false;

      // Cleanup
      this.newSupportItemName = '';
      this.newSupportItemNumber = '';
      this.newAmount = '';
      this.customShiftOptions = [];
  }


  handleNewFieldChange(event) {
      const field = event.target.dataset.field;
      const value = event.target.value;

      if (field === 'name') {
          this.newSupportItemName = value;
      } else if (field === 'number') {
          this.newSupportItemNumber = value;
      } else if (field === 'amount') {
          this.newAmount = value;
      }
  }

  toggleCustomShiftDropdown() {
      this.isCustomShiftOpen = !this.isCustomShiftOpen;
  }

  handleToggleCustomShift(event) {
      const shiftId = Number(event.target.dataset.shiftId);
      const checked = event.target.checked;

      this.customShiftOptions = this.customShiftOptions.map(shift => {
          if (shift.id === shiftId) {
              return { ...shift, checked };
          }
          return shift;
      });

      // Update display text
      const selected = this.customShiftOptions.filter(s => s.checked);
      if (selected.length > 0) {
          this.customShiftDisplayText = selected.map(s => s.label).join(', ');
          this.customShiftSelectedClass = 'selected-text';
      } else {
          this.customShiftDisplayText = 'Select Shift';
          this.customShiftSelectedClass = 'placeholder-text';
      }
  }

  handleCheckboxSelection = async (event) => {
      console.log("🟡 handleCheckboxSelection triggered");

      const rowId = event.target.dataset.id;
      const rowName = event.target.dataset.name;
      const isChecked = event.target.checked;

      console.log("🔹 Row ID:", rowId);
      console.log("🔹 Row Name:", rowName);
      console.log("🔹 Checked:", isChecked);
      console.log("🔹 Client Id:", this.clientId);

      const selectedRow = this.serviceGroupName.find((item) => item.Id === rowId);

      if (isChecked) {

          console.log("✅ Checkbox CHECKED");

          const alreadySelected = this.selectedServiceRows.some(
              (row) => row.Id === rowId
          );

          if (!alreadySelected) {
              this.selectedServiceRows.push(selectedRow);
              console.log("➕ Row added to selectedServiceRows");
          }

      } else {

          console.log("❌ Checkbox UNCHECKED");

          // Remove locally first
          this.selectedServiceRows = this.selectedServiceRows.filter(
              (row) => row.Id !== rowId
          );

          try {
              console.log("🚀 Calling Apex removeServiceGroup");

              const result = await removeServiceGroup({
                  clientId: this.clientId,
                  serviceGroupId: rowId
              });

              console.log("✅ Apex call SUCCESS:", result);

              // ⭐ IF FUTURE RECORDS EXIST → BLOCK UNCHECK
              if (result && result.length > 0) {

                  console.log("⛔ Future services exist — reverting checkbox");

                  this.hasFutureServices = true; // your flag

                  // Re-add to selected rows
                  this.selectedServiceRows.push(selectedRow);

                  // Force checkbox back to checked
                  this.serviceGroupName = this.serviceGroupName.map((item) => {
                      if (item.Id === rowId) {
                          return {
                              ...item,
                              isSelected: true
                          };
                      }
                      return item;
                  });

                  return; // stop further processing
              }

          } catch (error) {
              console.error("❌ Apex call FAILED:", error);
          }
      }

      // ✅ Normal update if no blocking
      this.serviceGroupName = this.serviceGroupName.map((item) => {
          if (item.Id === rowId) {
              return {
                  ...item,
                  isSelected: isChecked
              };
          }
          return item;
      });

      const selectedCount = this.serviceGroupName.filter(item => item.isSelected);
      this.saveDisabled = selectedCount.length === 0;

      console.log("💾 Save Disabled:", this.saveDisabled);
      console.log("🟢 handleCheckboxSelection completed");
  };


  handleCloseWarningModal() {
      console.log("🔔 Warning modal closed");

      this.hasFutureServices = false;
  }

  // Form submit - extend default behavior
  handleSubmit(event) {
    console.log("onsubmit event recordEditForm", event.detail.fields);

    event.preventDefault();
    const fields = event.detail.fields;
    if (!this.stateValue) {
        this.showToast(
            "Error",
            "Please select State before saving.",
            "error"
        );
        return; 
    }
    const hasNegativeCarry = this.generatedPeriods?.some(p => p.carryForward < 0);
    
    if (hasNegativeCarry) {
        this.showToast(
            "Error",
            "Carry Forward is negative. Please adjust allocated amounts before saving.",
            "error"
        );
        return; 
    }

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
    } else if (this.accountingService === 'Xero' || this.accountingService === 'MYOB') {
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

    // this.handleSaveFundSplits();
    // for period management calculation
   this.recalculateAfterSave();

      if (this.isFromManageInvoice) {
          this.dispatchEvent(
              new CustomEvent('backtomanageinvoicefund', {
                  detail: {
                      fundTrackerId: fundTrackerId
                  },
                  bubbles: true,
                  composed: true
              })
          );
      }
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
        for (let i = (this.pageNumber1 - 1) * this.pageSize1; i < this.pageNumber1 * this.pageSize1; i++) {
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
//manendra added for threshold pop up

checkThreshold(spent, allocated, threshold, serviceType, isPeriodMode, uniqueKey) {
    if (!allocated || allocated === 0) return;

    const usage = (spent / allocated) * 100;
    const roundedUsage = Math.round(usage);

    if (roundedUsage >= threshold && !this.alertShownMap.get(uniqueKey)) {
          this.alertShownMap[uniqueKey] = true;
       //this.showThresholdPopup(roundedUsage, serviceType, isPeriodMode);
    }
}
showThresholdPopup(percent, serviceType, isPeriodMode) {
    let message;

    if (isPeriodMode) {
        message = `You have used ${percent}% of the allocated funds for ${serviceType} in this period.`;
    } else {
        message = `You have used ${percent}% of the total allocated funds for ${serviceType}.`;
    }

    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Budget Alert',
            message: message,
            variant: 'warning'
        })
    );
}
}