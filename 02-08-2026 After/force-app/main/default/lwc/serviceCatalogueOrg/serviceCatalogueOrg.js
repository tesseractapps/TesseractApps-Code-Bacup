import {LightningElement,track,wire,api} from 'lwc';
import getServiceLineItem from '@salesforce/apex/CatalogueController.getServiceLineItem';
import getNewServiceTypeLineItem from '@salesforce/apex/CatalogueController.getNewServiceTypeLineItem';
import getfacilityselectedCatalogue from '@salesforce/apex/CatalogueController.getfacilityselectedCatalogue';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';

import SERVICE_CATALOGUE_OBJECT from '@salesforce/schema/Service_Catalogue__c';
import FINANCIAL_YEAR_FIELD from '@salesforce/schema/Service_Catalogue__c.Financial_Year__c';
import saveServiceCatalogues from '@salesforce/apex/CatalogueController.saveServiceCatalogues';
import getServiceCatalogues from '@salesforce/apex/CatalogueController.getServiceCatalogues';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import getCurrentLoggedUserInfo from "@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo";
import getFacilityData from "@salesforce/apex/HrHomeHandler.fetchFacilitiess";
import saveServiceCatalogueFacilities from "@salesforce/apex/CatalogueController.saveServiceCatalogueFacilities";
import getFacilityCurrentUser from "@salesforce/apex/PortalUserController.getFacilityCurrentUser";
import saveCatalogue from "@salesforce/apex/CatalogueController.saveCatalogue";
import handleUncheckOrgWise from '@salesforce/apex/CatalogueController.handleUncheckOrgWise';
import processBulkUncheckOrgWise from '@salesforce/apex/CatalogueController.processBulkUncheckOrgWise';
import handleFacilityUncheck from '@salesforce/apex/CatalogueController.handleFacilityUncheck';
import processBulkFacilityUncheck from '@salesforce/apex/CatalogueController.processBulkFacilityUncheck';

export default class ServiceCatalogueOrg extends LightningElement {

    @track allServiceCatalogue = [];    
    @track NdisServiceGroupName = false;
    //serviceGroupName = [];
    @track allCatalogs=[];
    @track filteredCatalogs=[];
    @track CreateorEditCatalogueName = 'Create Service Catalogue';
    @track createEditAddNewServiceType = 'Add New Service Type';
    selectedCatalogueIdSet = new Set();
    selectedCatalogueMap = new Map(); // key = catalogueId, value = serviceCatalogueId
    @track isSelectAllChecked = false;
    @track serviceDate;
    @track totalCatalogues ='';
    @track activeServices = '';
    catalogueRecordsPerPage = 10;
    cataloguePageNumber = 1;
    catalogueRecords = [];
    @track serviceCatalogueHomePage=true;
    @track noRecordsFlag = false;
    @track ndisflag;
    @api orgid;
    @track serviceTypeOptions = [];
    @track accList = [];
    @track filteredServiceTypes = [];
    @track showServiceTypeDropdown = false;
    @track selectedServiceTypeLabel = '';
    @track selectedServiceTypeLabelValue = '';
    
    @track facilityIdEditIcon;
    @track selectedServiceType=[];
    @track facility;
    @track totalRecords = 0;
    @track records = [];
    @track pageSizeOptions = [10, 25, 50, 75, 100];
    @track pageSize=10; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number
    @track paginationVisible = false;
    @track addNewServiceTypeFlag=false;
    @track yearOptions = [];
    @track selectedYear;
    @track selectedIndustry ='NDIS';
    //@track stateValue;
    @track serviceTypeName = "";
    @track filteredServiceTypeOptions = [];

    @track newServiceTypeResponse = {};
    @track newServiceTypeCatalogues = [];
    //@track NdisServiceGroupName = false;
    //@track serviceGroupName = [];
    @track serviceGroupName = [];

    @track pagedServiceGroupName = [];

    @track pageNumber1 = 1;
    @track pageSize1 = 10;
    @track totalPages1 = 0;
    @track totalRecords1 = 0;
    pageSizeOptions1 = [10,25,50,100];
    @track paginationVisible1 = false;
    @track isSelectAllServiceGroup = false;
    @track selectedServiceGroupIds = [];  
    @track multiFacilityDroDownList=[];  
    @track finalListFacilities = [];
    @track facilityOptions = [];
    @track selectedFacilities = [];
    @track userFacilities = [];
    @track facilityIds =[];
    @track orginalSelectedFacilities=[];
    @track selctedMultipleFcailityValues=[];
    @track facilitySave=false;
    @track isCloneCatalogue = false;
    @track lineItemNumberFlag = true;
    @track isEditServiceType = false;
    @track isEditFromAddServiceType = false;
    @track searchKey = '';
    @track filteredRecords = [];
    @track serviceTypeAlreadyExists = false;
    @track parentSelectedFacilities = [];
    @track hasFutureServices = false;
    @track hasFutureServices1 = false;
    @track popupMsg = '';
    @track popupMsg1 = '';
    @track hasFutureServices2 = false;
    @track hasFutureServices3 = false;
    @track popupMsg2 = '';
    @track popupMsg3 = '';
    originalSelectedIdsForType = [];
    tableKey = 0;

    recordTypeId;
    @track rateFields = [
        { label: 'ACT Rate', field: 'ACT' },
        { label: 'NSW Rate', field: 'NSW' },
        { label: 'NT Rate', field: 'NT' },
        { label: 'QLD Rate', field: 'QLD' },
        { label: 'SA Rate', field: 'SA' },
        { label: 'TAS Rate', field: 'TAS' },
        { label: 'VIC Rate', field: 'VIC' },
        { label: 'WA Rate', field: 'WA' }
    ];
    @track typeOfIndustryOptions = [
        { label: 'NDIS', value: 'NDIS' },
        { label: 'Nursing', value: 'Nursing' },
        { label: 'Child Care', value: 'Child Care' },
        { label: 'Transport', value: 'Transport' },
        { label: 'Aged Care', value: 'Aged Care' }
    ];
    get supportItemNameTitle() {
        return this.formData?.supportItemName ?? '';
    }
    get serviceTypeTitle() {
        return this.formData?.serviceType ?? '';
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
    get isCatalogueFieldsDisabled() {
        return this.isCloneCatalogue || this.isEditFromAddServiceType;
    }

    connectedCallback() {
        console.log('connectedCallback called');
        console.log('orgid:', this.orgid);
        this.serviceDate = new Date().toISOString().split('T')[0];
        this.pageSize = 10;
        //this.loadCatalogueData();
        //this.loadSelectedCatalogues();
        this.loadServiceCatalogues();
        getCurrentLoggedUserInfo().then(userData => {
      
              let userType = userData.User_Type__c;
              const userEmail = userData.Email;
              console.log('👤 userType:', userType);
              console.log('📧 userEmail:', userEmail);
              console.log('lineItemNumberFlag ==>'+ this.lineItemNumberFlag) ;
              this.lineItemNumberFlag = !(userType === 'NDIS Org Admin' || userType === 'Roster Manager');
              console.log('current logged in userType==>'+ this.lineItemNumberFlag) ;

              getFacilityData().then(facresponse => {
                this.finalListFacilities = [];
                //this.selectedFacilities = [];
    
              this.facilityOptions = facresponse.map(record => ({
                    label: record.Name,
                    value: record.Id,
                    Type_of_Service__c:record.Type_of_Service__c
                }));
                    // ✅ ORG ADMIN / ICT ADMIN
                if (userType === 'NDIS Org Admin' || userType === 'ICT Admin') {

                    this.finalListFacilities=this.facilityOptions;
                    this.multiFacilityDroDownList= this.finalListFacilities;
                    this.orginalSelectedFacilities =  this.multiFacilityDroDownList;
                    // this.selectedFacilities = [{
                    //         label: storedFacilityLabel,
                    //         value: storedFacilityId
                    //     }];
                    //     this.facilityIds = [storedFacilityId];
        
                    //     console.log('✅ selectedFacilities SET:', JSON.stringify(this.facilityIds));
        
                        this.refreshServiceCatalogue();

                }  else if (userType === 'Facility Admin' || userType === 'HR Admin' || userType === 'Roster Manager') {
                
                    getFacilityCurrentUser().then(result => {
                        this.finalListFacilities = result.map(record => ({
                            label: record.Facility__r.Name,
                            value: record.Facility__r.Id,
                            Type_of_Service__c:record.Facility__r.Type_of_Service__c
                        }));

                        this.multiFacilityDroDownList= this.finalListFacilities;
                        // this.orginalSelectedFacilities =  this.multiFacilityDroDownList;
                        //     this.selectedFacilities = [{
                        //     label: storedFacilityLabel,
                        //     value: storedFacilityId
                        // }];
                        // this.facilityIds = [storedFacilityId];
        
                        // console.log('✅ selectedFacilities SET:', JSON.stringify(this.facilityIds));
        
                        this.refreshServiceCatalogue();

                
                    });
                }

            });
        });


        console.log('serviceDate:', this.serviceDate);
    }
    @wire(getObjectInfo, { objectApiName: SERVICE_CATALOGUE_OBJECT })
    objectInfo({ data, error }) {
        if (data) {
            this.recordTypeId = data.defaultRecordTypeId;
        } else if (error) {
            console.error('Object Info Error:', error);
        }
    }

    @wire(getPicklistValues, {
        recordTypeId: '$recordTypeId',
        fieldApiName: FINANCIAL_YEAR_FIELD
    })
    wiredFinancialYear({ data, error }) {
        if (data) {
           // this.yearOptions = data.values;
            const today = new Date();

            const currentStartYear =
                today.getMonth() >= 6
                    ? today.getFullYear()
                    : today.getFullYear() - 1;

            this.yearOptions = data.values.filter(option => {

                // Example: 2026-27 -> 2026
                const startYear = parseInt(option.value.substring(0, 4), 10);

                return startYear <= currentStartYear;

            });
            if (!this.isEditServiceType && !this.selectedYear) {
                this.setCurrentFinancialYear();
            }

            console.log('Current Financial Year Start:', currentStartYear);
            console.log('Financial Year Options:', JSON.stringify(this.yearOptions));
        } else if (error) {
            console.error('Picklist Error:', error);
        }
    }
        
    // get facilityDropdownOptions() {

    //     if (!Array.isArray(this.multiFacilityDroDownList)) {
    //         return [];
    //     }

    //     return this.multiFacilityDroDownList.map(item => ({
    //         label: item.label,
    //         value: item.value,
    //         Type_of_Service__c :item.Type_of_Service__c
    //     }));

    // }
        
    // handleFacilitySelection(event) {

    //     console.log('Facility Event:', JSON.stringify(event.detail));
    //     const recordId = event.currentTarget.dataset.id;
    //     console.log('recordId in handleFacilitySelection : ',recordId);
    //     const value = event.detail?.value;
    //     if (!Array.isArray(value)) {
    //         console.log('Ignored search typing event');
    //         return;
    //     }

    //     this.records = this.records.map(record => {
           
    //        // console.log('Matched Record:', record.id);
    //         if (record.id === recordId) {
    //             console.log('Matched Record:', record.id);
    //             console.log('Registration Group:', record.registrationGroup);
    //             console.log('Selected Value:', value);
    //            const facilityNames = value
    //                 .map(id => {
    //                     const option = record.facilityOptions.find(opt => opt.value === id);
    //                     return option ? option.label : null;
    //                 })
    //                 .filter(Boolean)
    //                 .sort((a, b) => a.localeCompare(b))
    //                 .join(', ');
    //             console.log('facilityNames:', facilityNames);
    //             return {
    //                 ...record,
    //                 isModified: true,
    //                 selectedFacilities: [...value],
    //                 facilityNames: facilityNames,
    //                 childItems: record.childItems.map(child => ({
    //                     ...child,
    //                     selectedFacilities: [...value],
    //                      facilityNames: facilityNames
    //                 }))
    //             };
    //         }
    //         return record;
    //     });
    //     this.facilitySave=true;
    //     const updatedRecord = this.records.find(r => r.id === recordId);

    //     console.log('Selected IDs:', JSON.stringify(updatedRecord.selectedFacilities));
    //     console.log('Tooltip:', updatedRecord.facilityNames);
    //     this.paginationHelper();
    //     console.log('Updated Records:', JSON.stringify(this.records));
    // }
    handleFacilitySelection(event) {
        console.log('Facility Event:', JSON.stringify(event.detail));
        const recordId = event.currentTarget.dataset.id;
        const value = event.detail?.value;
        if (!Array.isArray(value)) {
            return;
        }

        const parentRecord = this.records.find(r => r.id === recordId);
        if (!parentRecord) {
            return;
        }

        const oldFacilities = [...(parentRecord.selectedFacilities || [])];
        const newFacilities = [...value];

        const removedFacilities = oldFacilities.filter(
            id => !newFacilities.includes(id)
        );
        const originalFacilities =
            parentRecord.originalSelectedFacilities || [];

        const removedExistingFacilities = removedFacilities.filter(id =>
            originalFacilities.includes(id)
        );
       
        console.log('Old Facilities:', JSON.stringify(oldFacilities));
        console.log('New Facilities:', JSON.stringify(newFacilities));
        console.log('Removed Facilities:', JSON.stringify(removedFacilities));
        console.log('Removed Existing Facilities:', JSON.stringify(removedExistingFacilities));

        const serviceCatalogueIds = parentRecord.childItems.map(child => child.Id);
        console.log( 'Service Catalogue Ids:', JSON.stringify(serviceCatalogueIds));

        if (removedExistingFacilities.length === 0) {
            this.updateFacilitySelection(recordId, newFacilities);
            return;
        }

        // SINGLE FACILITY REMOVED
        if (removedExistingFacilities.length === 1) {
            handleFacilityUncheck({
                facilityId: removedExistingFacilities[0],
                serviceCatalogueIds: serviceCatalogueIds
            })

            .then(result => {
                console.log('Facility Validation:', JSON.stringify(result));

                if (result?.hasFutureShifts) {
                    // this.showToast(
                    //     'Error',
                    //     'Future shifts exist. Facility cannot be removed.',
                    //     'error'
                    // );
                    this.hasFutureServices2 = true;
                    this.popupMsg2 = 'This Facility cannot be deselected because one or more future shifts are scheduled for the selected service items. To proceed, please delete the future shifts first.';
                    
                    // revert
                    this.updateFacilitySelection(recordId,oldFacilities);
                    this.records = this.records.map(record => {
                        if (record.id === recordId) {
                            return {
                                ...record,
                                isModified: false
                            };
                        }
                        return record;
                    });

                    this.facilitySave = this.records.some(r => r.isModified);
                    return;
                }
                if (result?.hasFunds) {

                    this.hasFutureServices2 = true;
                    this.popupMsg2 =
                        'This Facility cannot be deselected because one or more selected support items are associated with funds. Please remove the associated funds first.';

                    this.updateFacilitySelection(recordId, oldFacilities);

                    this.records = this.records.map(record => {
                        if (record.id === recordId) {
                            return {
                                ...record,
                                isModified: false
                            };
                        }
                        return record;
                    });

                    this.facilitySave = this.records.some(r => r.isModified);
                    return;
                }


                this.updateFacilitySelection(
                    recordId,
                    newFacilities
                );

            })

            .catch(error => {
                console.error(error);
            });
            return;
        }

        // // MULTIPLE / UNSELECT ALL
        processBulkFacilityUncheck({
            facilityIds: removedExistingFacilities,
            serviceCatalogueIds: serviceCatalogueIds
        })
        .then(result => {

            console.log('Bulk Facility Validation:', JSON.stringify(result));

            const hasAnyFuture = Object.values(result).some(
                value => value.hasFutureShifts
            );

            const hasAnyFunds = Object.values(result).some(
                value => value.hasFunds
            );

            if (hasAnyFuture) {
                // this.showToast(
                //     'Error',
                //     'One or more facilities have future shifts.',
                //     'error'
                // );
                this.hasFutureServices3 = true;
                this.popupMsg3 = 'One or more selected Facilities cannot be deselected because future shifts are scheduled. To proceed, please delete the future shifts first.';

               this.updateFacilitySelection(
                    recordId,
                    [...originalFacilities]
                );
                this.records = this.records.map(record => {
                    if (record.id === recordId) {
                        return {
                            ...record,
                            isModified: false
                        };
                    }
                    return record;
                });

                this.facilitySave = this.records.some(r => r.isModified);
                return;
            }
            if (hasAnyFunds) {

                this.hasFutureServices3 = true;
                this.popupMsg3 =
                    'One or more selected Facilities cannot be deselected because one or more selected support items are associated with funds. Please remove the associated funds first.';

                this.updateFacilitySelection(
                    recordId,
                    [...originalFacilities]
                );

                this.records = this.records.map(record => {
                    if (record.id === recordId) {
                        return {
                            ...record,
                            isModified: false
                        };
                    }
                    return record;
                });

                this.facilitySave = this.records.some(r => r.isModified);
                return;
            }


            this.updateFacilitySelection(
                recordId,
                newFacilities
            );
        })
        .catch(error => {
            console.error(error);
        });

    }
    updateFacilitySelection(recordId, value) {
        this.records = this.records.map(record => {
            if (record.id === recordId) {
                const facilityNames = value
                    .map(id => {
                        const option =
                            record.facilityOptions.find(
                                opt => opt.value === id
                            );
                        return option ? option.label : null;

                    })
                    .filter(Boolean)
                    .sort((a, b) => a.localeCompare(b))
                    .join(', ');

                return {
                    ...record,
                    isModified: true,
                    selectedFacilities: [...value],
                    facilityNames,
                    childItems: record.childItems.map(child => ({
                        ...child,
                        selectedFacilities: [...value],
                        facilityNames
                    }))
                };
            }
            return record;
        });
        this.facilitySave = true;
        this.paginationHelper();
    }

    handleSaveFacilities() {
        const payload = [];
        console.log('Records before save:', JSON.stringify(this.records));
        // const hasSelection = this.records.some(parent =>
        //     parent.childItems.some(child =>
        //         child.selectedFacilities &&
        //         child.selectedFacilities.length > 0
        //     )
        // );
        const modifiedRows = this.records.filter(r => r.isModified);

        if (modifiedRows.length === 0) {
            this.showToast('Error', 'No changes to save.', 'error');
            return;
        }

        const hasSelection = modifiedRows.some(parent =>
            parent.childItems.some(child =>
                child.selectedFacilities?.length > 0
            )
        );
        console.log('hasSelection :', hasSelection);
        if (!hasSelection) {

            this.showToast(
                'Error',
                'Please select at least one Facility.',
                'error'
            );
            this.refreshServiceCatalogue();
            return;
        }
       // this.records.forEach(parent => {
        this.records
            .filter(parent => parent.isModified)
            .forEach(parent => {
            parent.childItems.forEach(child => {
                //if ( child.selectedFacilities && child.selectedFacilities.length > 0 ) {
                    console.log( 'Child:', child.Id,'Selected:', JSON.stringify(child.selectedFacilities));
                    payload.push({
                        serviceCatalogueId: child.Id,
                        facilityIds: child.selectedFacilities || []
                    });
                //}
            });
        });

        console.log('Facility Save Payload:', JSON.stringify(payload));
        // if (payload.length === 0) {
        //     this.showToast(
        //         'Error',
        //         'Please select at least one Facility.',
        //         'error'
        //     );
        //     return;
        // }

        saveServiceCatalogueFacilities({facilityJson: JSON.stringify(payload)})
        .then(() => {
            this.showToast(
                'Success',
                'Facilities saved successfully.',
                'success'
            );
            this.facilitySave = false;
            this.refreshServiceCatalogue();
        })
        .catch(error => {
            console.error( 'Facility Save Error:',JSON.stringify(error));
            this.showToast(
                'Error',
                error?.body?.message || 'Unable to save facilities.',
                'error'
            );
        });
    }

    handleAddNewServiceType() {
       // this.CreateorEditCatalogueName = 'Create Service Catalogue';
        console.log('Add New Service Type button clicked');
        // this.supportItemNumber = this.generateSupportItemNumber();
        // this.formData = {
        //     ...this.formData,
        //     supportItemNumber: this.supportItemNumber
        // };
        this.createEditAddNewServiceType = 'Add New Service Type';
        this.isEditServiceType = false;
        this.addNewServiceTypeFlag = true;
        this.serviceCatalogueHomePage=false;
        this.selectedServiceGroupIds = [];
        this.setCurrentFinancialYear();
        this.loadNewServiceTypeCatalogues();
        this.isCloneCatalogue=false;
       // console.log('Generated Support Item Number:', this.supportItemNumber);
    }
    setCurrentFinancialYear() {

        const today = new Date();

        const currentStartYear =
            today.getMonth() >= 6
                ? today.getFullYear()
                : today.getFullYear() - 1;

        const currentFY = this.yearOptions.find(option => {
            const startYear = parseInt(option.value.substring(0, 4), 10);
            return startYear === currentStartYear;
        });

        this.selectedYear = currentFY ? currentFY.value : '';
    }
    cancelAddServiceTypeFlag() {
        console.log('cancelNewServiceTypeFlag button clicked');
        this.addNewServiceTypeFlag = false;
        this.serviceCatalogueHomePage=true;
        this.NdisServiceGroupName = false;
       // console.log('Generated Support Item Number:', this.supportItemNumber);
        this.selectedYear = null;
        this.selectedIndustry ='NDIS';
        this.serviceTypeName = null;
       // this.stateValue = null;
        this.ndisflag = false;
        this.serviceTypeOptions = [];
        this.filteredServiceTypeOptions = [];
        this.serviceGroupName = [];
        this.pagedServiceGroupName = [];
        this.selectedServiceGroupIds = [];
        this.isSelectAllServiceGroup = false;
        this.totalRecords1 = 0;
        this.totalPages1 = 1;
        this.pageNumber1 = 1;
        this.paginationVisible1 = false;
        this.isCloneCatalogue = false;

    }
    
    handleCreateCatalogue() {
        this.CreateorEditCatalogueName = 'Create Service Catalogue';
        console.log('Create New Catalogue button clicked');
        this.supportItemNumber = this.generateSupportItemNumber();
        this.formData = {
            ...this.formData,
            supportItemNumber: this.supportItemNumber
        };
        this.isCreateCatalogueModalOpen = true;
        this.serviceCatalogueHomePage=false;
        this.addNewServiceTypeFlag = false;
        this.isCloneCatalogue=false;
        //this.loadNewServiceTypeCatalogues();
        console.log('Generated Support Item Number:', this.supportItemNumber);
    }
    generateSupportItemNumber() {
        const section = '01';
        const category = '001';

        const now = new Date();

        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');

        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');

        return `${section}_${category}_${yyyy}${mm}${dd}_${hh}${min}${ss}`;
    }

    handleCancelCreateCatalogue() {
        console.log('Cancel New Catalogue button clicked');this.recordId
        console.log('this.formData >>>>>>', JSON.stringify(this.formData));
        console.log('this.recordId >>>>>>', this.recordId);
        this.resetCreateCatalogueForm();

    }
    
    resetCreateCatalogueForm() {
        console.log('this.isCloneCatalogue in resetCreateCatalogueForm >>>>>>',this.isCloneCatalogue);
        this.formData = {
            Id:'',
            industryType:'',
            serviceType: '',
            supportItemName: '',
            supportItemNumber: '',
            ACT: '0',
            NSW: '0',
            NT: '0',
            QLD: '0',
            SA: '0',
            TAS: '0',
            VIC: '0',
            WA: '0'
        };

        // Close modal
        this.isCreateCatalogueModalOpen = false;
        //this.addNewServiceTypeFlag = false;
        //this.serviceCatalogueHomePage=true;
        if(this.isEditFromAddServiceType){
            this.addNewServiceTypeFlag = true;
            this.serviceCatalogueHomePage = false;
            this.isEditFromAddServiceType = false;

        } else {
            this.addNewServiceTypeFlag = false;
            this.serviceCatalogueHomePage = true;
          
        }
        this.isCloneCatalogue=false;
        console.log('Create Catalogue form reset');
    }
      validateCreateCatalogueForm() {

        console.log('👉 formData:', JSON.stringify(this.formData));
        console.log('👉 allServiceCatalogue raw:', this.allServiceCatalogue);

        if (!this.formData.industryType || !this.formData.industryType.trim()) {
            console.log('❌ Validation failed: Type of Industry is missing');
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Type of Industry is required',
                    variant: 'error'
                })
            );
            return false;
        }
        // ✅ Service Type validation
        if (!this.formData.serviceType || !this.formData.serviceType.trim()) {
            console.log('❌ Validation failed: Service Type missing');
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Service Type is required',
                    variant: 'error'
                })
            );
            return false;
        }


        // ✅ Support Item Name validation
        if (!this.formData.supportItemName || !this.formData.supportItemName.trim()) {
            console.log('❌ Validation failed: Support Item Name missing');

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Support Item Name is required',
                    variant: 'error'
                })
            );
            return false;
        }

        // ✅ Support Item Number validation
        if (!this.formData.supportItemNumber || !this.formData.supportItemNumber.trim()) {
            console.log('❌ Validation failed: Support Item Number missing');

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Support Item Number is required',
                    variant: 'error'
                })
            );
            return false;
        }

        // ✅ Ensure list is array
        const list = Array.isArray(this.allServiceCatalogue?.catalogues)
                ? this.allServiceCatalogue.catalogues
                : [];

            const currentSupportItemNumber =
                this.formData.supportItemNumber?.trim().toLowerCase();

            const currentId = this.formData.Id;

            let duplicateRecord = null;

            list.some(item => {

                const existingNumber =
                    item.Support_Item_Number__c?.trim().toLowerCase();

                if (
                    existingNumber === currentSupportItemNumber &&
                    item.Id !== currentId
                ) {
                    duplicateRecord = item; // store duplicate record
                    return true;
                }

                return false;
            });

            if (duplicateRecord) {
               
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message:  `Duplicate Support Item Number already exists for "${duplicateRecord.Name}"`,
                        variant: 'error'
                    })
                );
                return false;
            }

        return true;
    }

    handleSaveCreateCatalogue() {

       // console.log('this.recordId >>>>>', this.recordId);
        console.log('this.formData >>>>'+ JSON.stringify(this.formData));
        console.log('Raw data for Catalogue Data:', JSON.stringify(this.allServiceCatalogue));

        // 🔴 SHOW TOAST & STOP if invalid
        if (!this.validateCreateCatalogueForm()) {
            return;
        }
        const rateFields = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

        const formDataToSave = {
            ...this.formData
        };

        rateFields.forEach(field => {
            if (!formDataToSave[field] || formDataToSave[field].toString().trim() === '') {
                formDataToSave[field] = '0';
            }
        });
          console.log('this.isCloneCatalogue IN handleSaveCreateCatalogue >>>>>>', this.isCloneCatalogue);
        // saveCatalogue({
        //     formDataJson: JSON.stringify(this.formData)
        // })
        saveCatalogue({
            formDataJson: JSON.stringify({
                //...this.formData,
                ...formDataToSave,
                isClone: this.isCloneCatalogue
            })
        })
        .then(() => {
            this.selectedServiceTypeLabel = this.selectedServiceTypeLabelValue;
           // this.loadCatalogueData();
            //this.loadSelectedCatalogues();

            const isEdit =
                this.CreateorEditCatalogueName === 'Edit Service Catalogue';

            this.showToast(
                'Success',
                isEdit
                    ? 'Catalogue updated successfully'
                    : 'Catalogue created successfully',
                'success'
            );
            // if(this.isEditFromAddServiceType){
            //    this.loadNewServiceTypeCatalogues();
            // }

            //  setTimeout(() => {
            //    this.resetCreateCatalogueForm();
            // }, 1000);
            if (this.isCloneCatalogue) {
                 console.log('this.isCloneCatalogue is True >>>>>>');
               // setTimeout(() => {
                    this.resetCreateCatalogueForm();
                //}, 1000);

               // this.loadServiceCatalogues();
                this.cancelAddServiceTypeFlag();
                this.refreshServiceCatalogue();

            } else {
                console.log('this.isCloneCatalogue is false >>>>>>');
                this.loadNewServiceTypeCatalogues();
                setTimeout(() => {
                    this.resetCreateCatalogueForm();
                }, 1000);

            }
           // this.resetCreateCatalogueForm();
        })
        .catch(error => {
            this.showToast(
                'Error',
                error?.body?.message || 'Something went wrong while saving',
                'error'
            );
        });
    }
    handleChangeserviceCatalogue(event) {
        const field = event.target.dataset.field;
        let value = event.target.value;
        
        // Support Item Number → allow only numbers
        if (field === 'supportItemNumber') {
            value = value.replace(/[^0-9_]/g, '');
        }

        // Default numeric rate fields
        if (event.target.type === 'number' && value === '') {
            value = '0.00';
        }

        this.formData = {
            ...this.formData,
            [field]: value
        };
        if (field === 'industryType') {
            console.log('Industry Type Changed:', this.formData.industryType);
            this.loadNewServiceTypeCatalogues();
        }

        // Update input value visually
        event.target.value = value;
        console.log('Field:', field);
        console.log('Value:', value);
        console.log('Updated formData:', JSON.stringify(this.formData));
    }

    // resetCataloguePagination(records = []) {
    //     this.cataloguePageNumber = 1;

    //     this.catalogueTotalRecords = records.length;

    //     this.catalogueTotalPages = Math.max(
    //         1,
    //         Math.ceil(this.catalogueTotalRecords / this.cataloguePageSize)
    //     );

    //     this.cataloguePaginationVisible =
    //         this.catalogueTotalRecords > this.cataloguePageSize;
    // }
    
    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }
    handleRecordsPerPage(event) {
        this.pageSize = Number(event.target.value);
        this.pageNumber = 1;

        console.log('Page Size:', this.pageSize);
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
    // paginationHelper() {
    //     const data =
    //         this.filteredRecords.length || this.searchKey
    //             ? this.filteredRecords
    //             : this.records;

    //     this.totalRecords = data.length;

    //     data.sort((a, b) => {

    //         const special = ['Miscellaneous', 'Others'];

    //         const aIsSpecial = special.some(s => a.registrationGroup.startsWith(s));
    //         const bIsSpecial = special.some(s => b.registrationGroup.startsWith(s));

    //         if (aIsSpecial && bIsSpecial) return 0;
    //         if (aIsSpecial) return 1;
    //         if (bIsSpecial) return -1;

    //         return a.registrationGroup.localeCompare(b.registrationGroup);
    //     });

    //     this.accList = [];
    //     if (this.totalRecords > 0) {
    //         this.noRecordsFlag = false;
    //     } else {
    //         this.noRecordsFlag = true;
    //     }
    //     this.paginationVisible = this.totalRecords > 0;
    //     //this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
    //     this.totalPages = Math.max(1,Math.ceil(this.totalRecords / this.pageSize));

    //     if (this.pageNumber <= 1) {
    //         this.pageNumber = 1;
    //     } else if (this.pageNumber > this.totalPages) {
    //         this.pageNumber = this.totalPages;
    //     }

      
    //     for (
    //         let i = (this.pageNumber - 1) * this.pageSize;
    //         i < this.pageNumber * this.pageSize;
    //         i++
    //     ) {
    //         if (i === this.totalRecords) {
    //             break;
    //         }
    //         this.accList.push(data[i]);
    //     }
    //     console.log("accList" + JSON.stringify(this.accList));
    //     console.log('this.accList.length :', JSON.stringify(this.accList.length));
    // }
    paginationHelper() {

        const data = this.searchKey
            ? this.filteredRecords
            : this.records;

        this.totalRecords = data.length;

        data.sort((a, b) => {

            const special = ['Miscellaneous', 'Others'];

            const aIsSpecial = special.some(s => a.registrationGroup.startsWith(s));
            const bIsSpecial = special.some(s => b.registrationGroup.startsWith(s));

            if (aIsSpecial && bIsSpecial) return 0;
            if (aIsSpecial) return 1;
            if (bIsSpecial) return -1;

            return a.registrationGroup.localeCompare(b.registrationGroup);
        });

        this.accList = [];

        this.noRecordsFlag = this.totalRecords === 0;
        this.paginationVisible = this.totalRecords > 0;

        this.totalPages = Math.max(
            1,
            Math.ceil(this.totalRecords / this.pageSize)
        );

        if (this.pageNumber < 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber > this.totalPages) {
            this.pageNumber = this.totalPages;
        }

        const start = (this.pageNumber - 1) * this.pageSize;
        const end = Math.min(start + this.pageSize, this.totalRecords);

        for (let i = start; i < end; i++) {
            this.accList.push(data[i]);
        }
    }
    
    
    get computedRateFields() {
        console.log('--- computedRateFields called ---');
        console.log('rateFields:', JSON.stringify(this.rateFields));
        console.log('formData:', JSON.stringify(this.formData));

        const result = this.rateFields.map(rate => {
            const value = this.formData[rate.field] ?? 0;

            console.log(
                `Mapping rate → field: ${rate.field}, value: ${value}`
            );

            return {
                ...rate,
                value: value
            };
        });

        console.log(
            'computedRateFields result:',
            JSON.stringify(result)
        );

        return result;
    }
    handleAddNewServiceTypeChange(event) {
        const field = event.target.name;
        const value = event.detail.value;

        console.log('Field:', field);
        console.log('Value:', value);

        switch (field) {
            case 'financialYear':
                this.selectedYear = value;
                console.log('Selected Year:', this.selectedYear);
                this.serviceGroupName = [];
                this.pagedServiceGroupName = [];
                this.NdisServiceGroupName = false;
                this.totalRecords1 = 0;
                if (this.selectedYear) {
                    this.loadNewServiceTypeCatalogues();
                }  else {
                    this.serviceTypeAlreadyExists = false;
                }
                // if (this.serviceTypeName) {
                //     this.validateServiceTypeExists();
                // }
                break;

            case 'typeOfIndustry':
                this.selectedIndustry = value;
                console.log('Selected Industry:', this.selectedIndustry);
                this.serviceGroupName = [];
                this.pagedServiceGroupName = [];
                this.NdisServiceGroupName = false;
                this.totalRecords1 = 0;
                if (this.selectedYear) {
                    this.loadNewServiceTypeCatalogues();
                }  else {
                    this.serviceTypeAlreadyExists = false;
                }
                this.ndisflag = value === 'NDIS';
                // if( this.selectedIndustry ==='NDIS'){
                //     this.ndisflag = true;
                // }
                // else{
                //     this.ndisflag = false;
                // }
                // if (this.serviceTypeName) {
                //     this.validateServiceTypeExists();
                // }
              
                break;

            // case 'state':
            //     this.stateValue = value;
            //     console.log('Selected State:', this.stateValue);
            //     if (this.serviceTypeName && this.selectedYear) {
            //         this.loadSupportItemsForSelectedServiceType();
            //     }
            //     break;

            default:
                break;
        }
      //  this.loadNewServiceTypeCatalogues();
        // if ((this.selectedYear && this.serviceTypeName) && (this.selectedIndustry || this.stateValue)) {
        //     this.loadSupportItemsForSelectedServiceType();
        // }
        console.log('NdisServiceGroupName in onchange  :', this.NdisServiceGroupName);
    }
    
    loadNewServiceTypeCatalogues() {

        console.log('========== loadNewServiceTypeCatalogues START ==========');
        let financialYear;

        if (this.isCreateCatalogueModalOpen) {

            const today = new Date();

            const startYear =
                today.getMonth() >= 6
                    ? today.getFullYear()
                    : today.getFullYear() - 1;

            financialYear = `${startYear}-${String(startYear + 1).slice(-2)}`;

        } 
        else if (this.addNewServiceTypeFlag) {
             financialYear = this.selectedYear;
               if (!financialYear) {
                    console.log('Financial Year not selected');
                    return;
                }
        }

        console.log('Financial Year:', financialYear);
       
        getNewServiceTypeLineItem({
            financialYear: financialYear || '',
            industry: this.selectedIndustry || ''
        })
        .then(data => {

            console.log('Raw Response:', JSON.stringify(data));
            //console.log('Raw Response length : ',data.length);

            this.newServiceTypeResponse = data;
            this.newServiceTypeCatalogues = data?.catalogues || [];
            console.log('this.selectedServiceGroupIds.length : ', this.selectedServiceGroupIds.length);
            // Edit mode already populated selectedServiceGroupIds
           // if (this.selectedServiceGroupIds.length === 0) {
                this.selectedServiceGroupIds =data.selectedCatalogueIds || [];
                console.log(  'Already Selected Ids:',JSON.stringify(this.selectedServiceGroupIds) );
           // }
            // Industry Flag
            //this.ndisflag = this.selectedIndustry === 'NDIS';
            const industry = this.isCreateCatalogueModalOpen
                ? this.formData.industryType
                : this.selectedIndustry;

            this.ndisflag = industry === 'NDIS';

            console.log('Selected Industry:', industry);
            console.log('NDIS Flag:', this.ndisflag);

            // -----------------------------
            // Build Service Type Options
            // -----------------------------
            const uniqueNames = new Set();

            this.newServiceTypeCatalogues.forEach(rec => {
                if (rec.Name) {
                    uniqueNames.add(rec.Name);
                }
            });

            let options = [...uniqueNames].map(name => ({
                label: name,
                value: name
            }));

            // -----------------------------
            // Industry Rules
            // -----------------------------

            if (industry  === 'NDIS') {

                options = options.filter(({ value }) =>
                    !value.startsWith('Others') &&
                    !value.startsWith('Miscellaneous -')
                );
            }

            if (
                ['Nursing', 'Child Care', 'Transport']
                    .includes(industry )
            ) {

                options = options.filter(({ value }) =>
                    !value.startsWith('Miscellaneous') &&
                    !value.startsWith('Others -')
                );
            }

            // -----------------------------
            // Sort
            // -----------------------------
            options.sort((a, b) => {

                const special = ['Miscellaneous', 'Others'];

                const aIsSpecial = special.includes(a.value);
                const bIsSpecial = special.includes(b.value);

                if (aIsSpecial && bIsSpecial) return 0;
                if (aIsSpecial) return 1;
                if (bIsSpecial) return -1;

                return a.value.localeCompare(b.value);

            });

            this.serviceTypeOptions = options;
            this.filteredServiceTypeOptions = [...options];

            console.log(
                'Service Type Options:',
                JSON.stringify(this.serviceTypeOptions)
            );
            console.log('Service Type Options length : ',this.serviceTypeOptions.length);

            // if (this.serviceTypeName) {
            //     this.loadSupportItemsForSelectedServiceType();
            // }
            const serviceTypeExists = options.some(
                opt => opt.value === this.serviceTypeName
            );

            if (!serviceTypeExists) {
                this.serviceTypeName = '';

                this.serviceGroupName = [];
                this.pagedServiceGroupName = [];
                this.NdisServiceGroupName = false;
                this.totalRecords1 = 0;
                // this.selectedServiceGroupIds = [];
                this.isSelectAllServiceGroup = false;
                this.serviceTypeAlreadyExists = false;
            } else {
               // this.loadSupportItemsForSelectedServiceType();
                this.validateServiceTypeExists();

            }
            console.log('========== loadNewServiceTypeCatalogues END ==========');

        })
        .catch(error => {

            console.error('Error:', error);

            this.serviceTypeOptions = [];
            this.filteredServiceTypeOptions = [];
            this.serviceGroupName = [];
            this.NdisServiceGroupName = false;
        });
    }
    loadSupportItemsForSelectedServiceType() {

        console.log('========== loadSupportItemsForSelectedServiceType ==========');
        //this.serviceGroupName = [];
        console.log('Selected Service Type:', this.serviceTypeName);
        //console.log('Selected State:', this.stateValue);

        if (!this.serviceTypeName ) {

            this.serviceGroupName = [];
            this.NdisServiceGroupName = false;
            console.log('NdisServiceGroupName INSIDE if :', this.NdisServiceGroupName);

            return;
        }

        const filtered = this.newServiceTypeCatalogues.filter(
            item => item.Name === this.serviceTypeName
        );

        console.log(
            'Filtered Support Items:',
            JSON.stringify(filtered)
        );

        // this.serviceGroupName = filtered.map(item => {

        //     return {
        //         ...item,
        //         amount: item[this.stateValue] || 0,
        //         isSelected: false,
        //         serviceSupportItem: item.Support_Item_Name__c
        //     };

        // });
        this.serviceGroupName = filtered.map(item => {
            const formatCurrency = value =>
                new Intl.NumberFormat('en-AU', {
                    style: 'currency',
                    currency: 'AUD'
                }).format(value || 0);

                const isSelected = this.selectedServiceGroupIds.includes(item.Id);
                console.log( 'Item:', item.Id,'Selected:',isSelected );

            return {

                ...item,

                isSelected: isSelected,

                serviceSupportItem: item.Support_Item_Name__c,

                // HTML fields
                Support_Item_Name__c: item.Support_Item_Name__c,
                Support_Item_Number__c: item.Support_Item_Number__c,

                ACTState: formatCurrency(item.ACT__c),
                NSWState: formatCurrency(item.NSW__c),
                NTState: formatCurrency(item.NT__c),
                QLDState: formatCurrency(item.QLD__c),
                SAState: formatCurrency(item.SA__c),
                TASState: formatCurrency(item.TAS__c),
                VICState: formatCurrency(item.VIC__c),
                WAState: formatCurrency(item.WA__c),

                // Don't show facility icon
                isOrgRecord: item.Organization__c ? true : false

            };

        });
        //this.isSelectAllServiceGroup = false;
        //this.selectedServiceGroupIds = [];  
        this.isSelectAllServiceGroup =
            this.serviceGroupName.length > 0 &&
            this.serviceGroupName.every(row => row.isSelected);
        this.totalRecords1 = this.serviceGroupName.length;
        this.pageNumber1 = 1;
        this.paginationHelper1();
        this.NdisServiceGroupName =this.totalRecords1 > 0;
        this.originalSelectedIdsForType = this.serviceGroupName
            .filter(row => row.isSelected)
            .map(row => row.Id);
        console.log(
            'Table Records:',
            JSON.stringify(this.serviceGroupName)
        );
        console.log('NdisServiceGroupName :', this.NdisServiceGroupName);
    }
    handleServiceTypeChange(event) {
        this.serviceTypeName = event.detail.value;
        //this.loadSupportItemsForSelectedServiceType();
        // setTimeout(() => {
        //     this.serviceTypeAlreadyExists =this.serviceGroupName.some(row => row.isSelected);

        //     if (this.serviceTypeAlreadyExists) {
        //         this.showToast(
        //             'Warning',
        //             'This Service Type already exists for the selected Financial Year and Industry.',
        //             'warning'
        //         );
        //     }
        // }, 0);
        this.validateServiceTypeExists();
    }
    validateServiceTypeExists() {

        if (!this.serviceTypeName) {
            this.serviceTypeAlreadyExists = false;
            return;
        }
        console.log('this.isEditFromAddServiceType : ',this.isEditFromAddServiceType);
        this.loadSupportItemsForSelectedServiceType();
        if (this.isEditServiceType || this.isEditFromAddServiceType) {
            this.serviceTypeAlreadyExists = false;
            return;
        }
        this.serviceTypeAlreadyExists =
            this.serviceGroupName.some(row => row.isSelected);

        if (this.serviceTypeAlreadyExists) {
            this.showToast(
                'Warning',
                'This Service Type already exists for the selected Financial Year and Industry.',
                'warning'
            );
        }
    }
    checkEditDuplicateSelection() {

        const currentIds = [...this.selectedServiceGroupIds].sort();
        const originalIds = [...(this.originalSelectedIdsForType || [])].sort();

        const isSameAsOriginal =
            currentIds.length === originalIds.length &&
            currentIds.every((id, idx) => id === originalIds[idx]);

        this.serviceTypeAlreadyExists = isSameAsOriginal;

        if (this.serviceTypeAlreadyExists) {
            this.showToast(
                'Warning',
                'This Service Type already exists for the selected Financial Year and Industry.',
                'warning'
            );
        }
    }
    get bDisableFirst1() {
        return this.pageNumber1 == 1;
    }
    get bDisableLast1() {
        return this.pageNumber1 == this.totalPages1;
    }
    handleRecordsPerPage1(event) {
        this.pageSize1 = Number(event.target.value);
        this.paginationHelper1();
        console.log('totalRecords1  in handleRecordsPerPage1', this.totalRecords1);
        console.log('pageSize1 in handleRecordsPerPage1', this.pageSize1);
        console.log('paginationVisible1 in handleRecordsPerPage1', this.paginationVisible1);
        console.log('pageNumber1 in handleRecordsPerPage1', this.pageNumber1);
        console.log('totalPages1 in handleRecordsPerPage1', this.totalPages1);
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

  
    paginationHelper1() {

        // Sort Support Item Name alphabetically
        this.serviceGroupName.sort((a, b) => {

            return (a.serviceSupportItem || '').localeCompare(
                b.serviceSupportItem || ''
            );

        });

        this.pagedServiceGroupName = [];

        if (this.totalRecords1 > 0) {
            this.NdisServiceGroupName = true;
        } else {
            this.NdisServiceGroupName = false;
        }
        //this.paginationVisible1 = this.totalRecords1 > this.pageSize1;
        this.paginationVisible1 =this.totalRecords1 >0;
        console.log('totalRecords1 :', this.totalRecords1);
        console.log('pageSize1 :', this.pageSize1);
        console.log('paginationVisible1 :', this.paginationVisible1);

        //this.totalPages1 = Math.ceil(this.totalRecords1 / this.pageSize1);
        this.totalPages1 = Math.max( 1,Math.ceil(this.totalRecords1 / this.pageSize1));

        if (this.pageNumber1 <= 1) {
            this.pageNumber1 = 1;
        } else if (this.pageNumber1 > this.totalPages1) {
            this.pageNumber1 = this.totalPages1;
        }
        
        for (
            let i = (this.pageNumber1 - 1) * this.pageSize1;
            i < this.pageNumber1 * this.pageSize1;
            i++
        ) {
            if (i >= this.totalRecords1) {
                break;
            }
            //this.pagedServiceGroupName.push(this.serviceGroupName[i]);
            this.pagedServiceGroupName.push({
                ...this.serviceGroupName[i]
            });
        }
        this.isSelectAllServiceGroup =this.serviceGroupName.length > 0 &&
                                      this.serviceGroupName.every(row => row.isSelected);
        console.log(  'Paged Service Group Name:', JSON.stringify(this.pagedServiceGroupName) );
        console.log(  this.pageNumber1, '/', this.totalPages1 );
        console.log(  'Total Records:',  this.totalRecords1 );
    }
    // paginationHelper1() {

    //     this.serviceGroupName.sort((a, b) => {
    //         return (a.serviceSupportItem || '').localeCompare(
    //             b.serviceSupportItem || ''
    //         );
    //     });

    //     if (this.totalRecords1 > 0) {
    //         this.NdisServiceGroupName = true;
    //     } else {
    //         this.NdisServiceGroupName = false;
    //     }

    //     this.paginationVisible1 = this.totalRecords1 > 0;

    //     this.totalPages1 = Math.max(
    //         1,
    //         Math.ceil(this.totalRecords1 / this.pageSize1)
    //     );

    //     if (this.pageNumber1 <= 1) {
    //         this.pageNumber1 = 1;
    //     } else if (this.pageNumber1 > this.totalPages1) {
    //         this.pageNumber1 = this.totalPages1;
    //     }

    //     const start = (this.pageNumber1 - 1) * this.pageSize1;
    //     const end = Math.min(
    //         start + this.pageSize1,
    //         this.totalRecords1
    //     );
    //     this.pagedServiceGroupName = this.serviceGroupName
    //         .slice(start, end)
    //         .map(row => ({
    //             ...row
    //         }));

    //     this.isSelectAllServiceGroup =this.serviceGroupName.length > 0 && this.serviceGroupName.every(row => row.isSelected);
    //     console.log('Paged:', JSON.stringify(this.pagedServiceGroupName) );
    // }
    // async handleCheckboxSelection(event) {

    //     const recordId = event.target.dataset.id;
    //     const checked = event.target.checked;

    //     console.log('Row Id :', recordId);
    //     console.log('Checked :', checked);
    //     if (!checked) {

    //         try {
    //             const result = await handleUncheckOrgWise({
    //                 ndisCatalogueId: recordId
    //             });
    //             console.log( 'Future shift result:', JSON.stringify(result) );
    //             // BLOCK UNCHECK
    //            if (result && result.length > 0) {
    //                 this.serviceGroupName = this.serviceGroupName.map(row => {
    //                     if (row.Id === recordId) {
    //                         return {
    //                             ...row,
    //                             isSelected: true
    //                         };
    //                     }
    //                     return row;
    //                 });
    //                 this.selectedServiceGroupIds = this.serviceGroupName
    //                     .filter(row => row.isSelected)
    //                     .map(row => row.Id);

    //                 this.isSelectAllServiceGroup =
    //                     this.serviceGroupName.length > 0 &&
    //                     this.serviceGroupName.every(row => row.isSelected);

    //                 this.hasFutureServices = true;
    //                 this.popupMsg = 'This support item cannot be deselected because future shifts are scheduled for one or more linked facilities. To proceed, please delete the future shifts first.';
    //                 this.paginationHelper1();
    //                 return;
    //             }

    //         } catch (error) {
    //             console.error(
    //                 'Error checking future shifts:',
    //                 error
    //             );
    //             // Fail-safe: keep selected
    //             this.serviceGroupName = this.serviceGroupName.map(row => {
    //                 if (row.Id === recordId) {
    //                     return {
    //                         ...row,
    //                         isSelected: true
    //                     };
    //                 }
    //                 return row;
    //             });
    //             this.selectedServiceGroupIds = this.serviceGroupName
    //                 .filter(row => row.isSelected)
    //                 .map(row => row.Id);

    //             this.isSelectAllServiceGroup =
    //                 this.serviceGroupName.length > 0 &&
    //                 this.serviceGroupName.every(row => row.isSelected);
    //             this.paginationHelper1();
    //             return;
    //         }
    //     }

    //     this.serviceGroupName = this.serviceGroupName.map(row => {

    //         if (row.Id === recordId) {

    //             return {
    //                 ...row,
    //                 isSelected: checked
    //             };

    //         }

    //         return row;

    //     });

    //     this.selectedServiceGroupIds = this.serviceGroupName
    //         .filter(row => row.isSelected)
    //         .map(row => row.Id);

    //     this.isSelectAllServiceGroup =
    //         this.serviceGroupName.length > 0 &&
    //         this.serviceGroupName.every(row => row.isSelected);

    //     this.paginationHelper1();

    //     console.log(
    //         'Selected Ids',
    //         JSON.stringify(this.selectedServiceGroupIds)
    //     );
    // }
    async handleCheckboxSelection(event) {

        const recordId = event.target.dataset.id;
        const checked = event.target.checked;
        console.log('Record Id:', recordId);
        console.log('Checked:', checked);

        if (checked) {
            this.updateSupportItemSelection(recordId, true);
            return;
        }
        if (!this.originalSelectedIdsForType.includes(recordId)) {
            console.log('Newly selected item. No validation required.');
            this.updateSupportItemSelection(recordId, false);
            return;
        }
        try {
            const result = await handleUncheckOrgWise({
                ndisCatalogueId: recordId
            });

            // if (result && result.length > 0) {
            //     this.updateSupportItemSelection(recordId, true);
            //     this.hasFutureServices = true;
            //     this.popupMsg = 'This support item cannot be deselected because future shifts are scheduled for one or more linked facilities. To proceed, please delete the future shifts first.';
            //     return;
            // }
             console.log('Validation Result:', JSON.stringify(result));

            if (result?.hasFutureShifts) {

                this.updateSupportItemSelection(recordId, true);
                this.hasFutureServices = true;
                this.popupMsg =
                    'This support item cannot be deselected because future shifts are scheduled for one or more linked facilities. To proceed, please delete the future shifts first.';
                return;
            }

            if (result?.hasFunds) {

                this.updateSupportItemSelection(recordId, true);
                this.hasFutureServices = true;
                this.popupMsg =
                    'This support item cannot be deselected because it is associated with one or more funds. Please remove the associated funds first.';
                return;
            }
            this.updateSupportItemSelection(recordId, false);
        }
        catch(error) {
            console.error(error);
            this.updateSupportItemSelection(recordId, true);
        }
    }
    handleCloseWarningModal() {
        this.hasFutureServices = false;
    }
    
    handleCloseWarningModal1(){
        this.hasFutureServices1 = false;
    }
    handleCloseWarningModal2() {
        console.log('handleCloseWarningModal2');
        this.hasFutureServices2 = false;
        console.log('hasFutureServices2:', this.hasFutureServices2);
    }
    
    handleCloseWarningModal3(){
        console.log('handleCloseWarningModal3');
        this.hasFutureServices3 = false;
    }
    // async handleSelectAllServiceGroups(event) {

    //     const checked = event.target.checked;
    //     console.log('Select All :', checked);
    //     if (checked) {
    //         this.isSelectAllServiceGroup = true;
    //         this.serviceGroupName = this.serviceGroupName.map(row => ({
    //             ...row,
    //             isSelected: true
    //         }));
    //         this.selectedServiceGroupIds =this.serviceGroupName.map(row => row.Id);
    //         this.paginationHelper1();
    //         return;
    //     }
    //     try {
    //         const allIds = this.serviceGroupName.map(row => row.Id);
    //         console.log('📦 All Ids:', allIds);
    //           console.log('📦 All Ids count :', allIds.length);
    //         const result = await processBulkUncheckOrgWise({
    //             ndisCatalogueIds: allIds
    //         });

    //         console.log('Bulk Result:', JSON.stringify(result));

    //         const hasAnyFuture =
    //             Object.values(result).some(val => val === true);

    //         if (hasAnyFuture) {

    //             this.hasFutureServices1 = true;

    //             this.popupMsg1 =
    //                 'Some support items cannot be deselected because future shifts are scheduled for one or more linked facilities. Please delete the future shifts first.';
    //         }

    //         // Keep checked if future shifts exist
    //         this.serviceGroupName = this.serviceGroupName.map(row => ({

    //             ...row,

    //             isSelected: result[row.Id]

    //         }));
    //         this.selectedServiceGroupIds = this.serviceGroupName
    //             .filter(row => row.isSelected)
    //             .map(row => row.Id);
    //         this.isSelectAllServiceGroup =
    //             this.serviceGroupName.length > 0 &&
    //             this.serviceGroupName.every(row => row.isSelected);
    //         this.paginationHelper1();
    //     } catch (error) {
    //         console.error(error);
    //     }

    //     console.log( 'Selected Ids',  JSON.stringify(this.selectedServiceGroupIds));
    // }
    async handleSelectAllServiceGroups(event) {
        const checked = event.target.checked;
        if (checked) {
            this.serviceGroupName = this.serviceGroupName.map(row => ({
                ...row,
                isSelected: true
            }));
            this.selectedServiceGroupIds =this.serviceGroupName.map(row => row.Id);
            this.isSelectAllServiceGroup = true;
            this.paginationHelper1();
            return;
        }

        try {
            // const allIds = this.serviceGroupName.map(row => row.Id);
            // const result = await processBulkUncheckOrgWise({
            //     ndisCatalogueIds: allIds
            // });
            const existingIds = this.originalSelectedIdsForType;

            if (existingIds.length === 0) {
                // Nothing persisted yet, just unselect all
                this.serviceGroupName = this.serviceGroupName.map(row => ({
                    ...row,
                    isSelected: false
                }));

                this.selectedServiceGroupIds = [];
                this.isSelectAllServiceGroup = false;
                this.paginationHelper1();
                return;
            }

            const result = await processBulkUncheckOrgWise({
                ndisCatalogueIds: existingIds
            });

            const hasAnyFuture = Object.values(result).some(
                value => value.hasFutureShifts
            );

            const hasAnyFunds = Object.values(result).some(
                value => value.hasFunds
            );

            if (hasAnyFuture) {
                this.hasFutureServices1 = true;
                this.popupMsg1 =  'Some support items cannot be deselected because future shifts are scheduled for one or more linked facilities. Please delete the future shifts first.';
                this.restoreOriginalSelections();
                return;
            }
            if (hasAnyFunds) {

                this.hasFutureServices1 = true;
                this.popupMsg1 =
                    'Some support items cannot be deselected because they are associated with one or more funds. Please remove the associated funds first.';

                this.restoreOriginalSelections();
                return;
            }
            this.serviceGroupName = this.serviceGroupName.map(row => ({
                ...row,
                isSelected: false
            }));

            this.selectedServiceGroupIds = [];
            this.isSelectAllServiceGroup = false;
            this.paginationHelper1();
        } catch (error) {
            console.error(error);
            this.restoreOriginalSelections();
        }
    }

    updateSupportItemSelection(recordId, isSelected) {
        this.serviceGroupName = this.serviceGroupName.map(row => {
            if (row.Id === recordId) {
                return {
                    ...row,
                    isSelected
                };
            }
            return row;
        });
        this.selectedServiceGroupIds = this.serviceGroupName
            .filter(row => row.isSelected)
            .map(row => row.Id);

        this.isSelectAllServiceGroup =
            this.serviceGroupName.length > 0 &&
            this.serviceGroupName.every(row => row.isSelected);

        this.paginationHelper1();
    }
    restoreOriginalSelections() {
        this.serviceGroupName = this.serviceGroupName.map(row => ({
            ...row,
            isSelected: this.originalSelectedIdsForType.includes(row.Id)
        }));

        this.selectedServiceGroupIds = [...this.originalSelectedIdsForType];
        this.isSelectAllServiceGroup =this.serviceGroupName.length > 0 && this.serviceGroupName.every(row => row.isSelected);
        this.paginationHelper1();
    }
    handleSaveAddServiceType() {
        if (!this.selectedYear) {
            console.log('❌ Validation failed:Financial Yearis missing');
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Financial Year is required',
                    variant: 'error'
                })
            );
            return;
        }
        if (!this.selectedIndustry) {
            console.log('❌ Validation failed: Type of Industry missing');
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Type of Industry is required',
                    variant: 'error'
                })
            );
            return;
        }

        if (!this.serviceTypeName) {
            console.log('❌ Validation failed: Service Type missing');

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Service Type is required',
                    variant: 'error'
                })
            );
            return;
        }
        if (this.serviceTypeAlreadyExists) {
            this.showToast(
                'Error',
                'This Service Type already exists for the selected Financial Year and Industry.',
                'error'
            );
            return;
        }
        let facilityIds = [];

        if (this.isEditServiceType) {
            // Existing Service Type
            facilityIds = this.parentSelectedFacilities || [];
        } else {
            // Create
            facilityIds = [];
        }
        const items = this.serviceGroupName.map(row => ({

            catalogueId: row.Id,
            supportItemName: row.serviceSupportItem || '',
            amount: row.amount,
            isSelected: row.isSelected,
            facilityIds: facilityIds

        }));
        console.log( 'items in save ', JSON.stringify(items) );
        console.log('Items length', items.length);

        if (!items.some(row => row.isSelected)) {

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please select at least one Support Item.',
                    variant: 'error'
                })
            );

            return;

        }

        const payload = {

            financialYear: this.selectedYear || '',
            industry: this.selectedIndustry || '',
            serviceType: this.serviceTypeName || '',
            //state: this.stateValue || '',
            items: items
        };

        console.log(
            'Save Payload ==> ',
            JSON.stringify(payload)
        );

        saveServiceCatalogues({
            serviceJson: JSON.stringify(payload)
        })
        .then(result => {
            console.log('Save result ==> ', JSON.stringify(result) );
            const inserted = result.inserted || 0;
            const updated = result.updated || 0;
            const skipped = result.skipped || 0;
            //  if (result.inserted > 0) {
            if (inserted > 0 || updated > 0) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Service Catalogue saved successfully.',
                        variant: 'success'
                    })
                );
           } else if (inserted === 0 && updated === 0 && skipped > 0) {

                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Warning',
                        message: 'Selected Service Catalogue(s) already exist.',
                        variant: 'warning'
                    })
                );
            } 
           
            this.cancelAddServiceTypeFlag();
            this.refreshServiceCatalogue();
        })
        .catch(error => {

            console.error(
                'Save Error',
                JSON.stringify(error)
            );

            this.showToast(
                'Error',
                'Unable to save Service Catalogue(s).',    // error?.body?.message ||
                'error'
            );

        });
    }
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }
    loadServiceCatalogues() {

        getServiceCatalogues()
        .then(data => {

            console.log('Saved Service Catalogues:', JSON.stringify(data));
           // console.log('Saved Service Catalogues Length :', data.length);
            const catalogues = data.catalogues || [];
            const groupedMap = new Map();

            catalogues.forEach(rec => {

                const serviceType = rec.NDIS_Support_Catalogue__r?.Name || 'Others';
                const groupKey = `${serviceType}_${rec.Type_of_Industry__c}`;

                if (!groupedMap.has(groupKey)) {

                    groupedMap.set(groupKey, {
                        id: groupKey,
                        registrationGroup: serviceType,
                        financialYear: rec.Financial_Year__c || '',
                        supportItemCount: 0,
                        facilityNames: '',
                        selectedFacilities: [],
                        facilityOptions: [],
                        // approvedDate: rec.Financial_Year__c,
                        // availableFunds: 0,
                        // amountApproved: 0,
                        // spentAmount: 0,
                        industry:rec.Type_of_Industry__c || '',
                        isNDIS: rec.Type_of_Industry__c === 'NDIS',
                        organizationId: rec.Organization__c,
                        organizationName: rec.Organization__r?.Name,
                        state: '',
                        hasUnreadBadge: false,
                        isExpanded: false,
                        childItems: []
                    });

                }

                const parent = groupedMap.get(groupKey);

                // States
                const states = [];

                if (rec.NDIS_Support_Catalogue__r.ACT__c) states.push('ACT');
                if (rec.NDIS_Support_Catalogue__r.NSW__c) states.push('NSW');
                if (rec.NDIS_Support_Catalogue__r.NT__c) states.push('NT');
                if (rec.NDIS_Support_Catalogue__r.QLD__c) states.push('QLD');
                if (rec.NDIS_Support_Catalogue__r.SA__c) states.push('SA');
                if (rec.NDIS_Support_Catalogue__r.TAS__c) states.push('TAS');
                if (rec.NDIS_Support_Catalogue__r.VIC__c) states.push('VIC');
                if (rec.NDIS_Support_Catalogue__r.WA__c) states.push('WA');

                //parent.supportItemCount++;

                const selectedFacilities = [];
                const facilityNames = [];
                if (rec.Service_Catalogue_Facilities__r) {
                    rec.Service_Catalogue_Facilities__r.forEach(facility => {
                        
                        if (facility.Facility__c) {
                            selectedFacilities.push(facility.Facility__c);
                        }
                        if (facility.Facility__r && facility.Facility__r.Name) {
                            facilityNames.push(facility.Facility__r.Name);
                        }
                    });
                }

                parent.childItems.push({
                    Id: rec.Id,
                    organizationId: rec.Organization__c,
                    organizationName: rec.Organization__r?.Name,
                    CatalogueId: rec.NDIS_Support_Catalogue__c,
                    Name: rec.NDIS_Support_Catalogue__r?.Support_Item_Name__c,
                    Support_Item_Number__c: rec.NDIS_Support_Catalogue__r?.Support_Item_Number__c,
                   // statechild: states.join(', '),
                    // shiftBadges: [],
                    // Amount__c: 0
                    ACTAmount: rec.NDIS_Support_Catalogue__r?.ACT__c || 0,
                    NSWAmount: rec.NDIS_Support_Catalogue__r?.NSW__c || 0,
                    NTAmount: rec.NDIS_Support_Catalogue__r?.NT__c || 0,
                    QLDAmount: rec.NDIS_Support_Catalogue__r?.QLD__c || 0,
                    SAAmount: rec.NDIS_Support_Catalogue__r?.SA__c || 0,
                    TASAmount: rec.NDIS_Support_Catalogue__r?.TAS__c || 0,
                    VICAmount: rec.NDIS_Support_Catalogue__r?.VIC__c || 0,
                    WAAmount: rec.NDIS_Support_Catalogue__r?.WA__c || 0,
                    selectedFacilities: selectedFacilities,
                    facilityNames:facilityNames.join(', '),
                    industry: rec.Type_of_Industry__c,
                    facilityOptions: this.multiFacilityDroDownList
                        .filter(facility =>
                            // facility.Type_of_Service__c === rec.Type_of_Industry__c
                            (facility.Type_of_Service__c || '').trim().toLowerCase() ===
                            (rec.Type_of_Industry__c || '').trim().toLowerCase()
                        )
                        .map(facility => ({
                            label: facility.label,
                            value: facility.value
                        })),

                    isOrgRecord: rec.NDIS_Support_Catalogue__r?.Organization__c ? true : false
                        
                });

            });

            // Parent states

            groupedMap.forEach(parent => {
               // const facilitySet = new Set();
                // const selectedFacilitySet = new Set();
                // parent.childItems.forEach(child => {
                //     if (child.facilityNames) {
                //         child.facilityNames
                //             .split(',')
                //             .forEach(name => {
                //                 if (name.trim()) {
                //                     facilitySet.add(name.trim());
                //                 }
                //             });
                //     }
                //     if (child.selectedFacilities && child.selectedFacilities.length > 0) {
                //         child.selectedFacilities.forEach(id => {
                //             if (id) {
                //                 selectedFacilitySet.add(id);
                //             }
                //         });
                //     }
                // });
                // parent.selectedFacilities = [...selectedFacilitySet];
                // parent.facilityNames = [...facilitySet].join(', ');

                parent.facilityOptions = this.multiFacilityDroDownList
                    .filter(facility =>
                        (facility.Type_of_Service__c || '').trim().toLowerCase() ===
                        (parent.industry || '').trim().toLowerCase()
                    )
                    .map(facility => ({
                        label: facility.label,
                        value: facility.value
                    }));

                const selectedFacilities = [];
                parent.childItems.forEach(child => {
                    (child.selectedFacilities || []).forEach(id => {
                        if (id && !selectedFacilities.includes(id)) {
                            selectedFacilities.push(id);
                        }
                    });
                });

                parent.selectedFacilities = selectedFacilities;
                parent.originalSelectedFacilities = [...selectedFacilities];
                // Build facility names in the SAME order as selectedFacilities
               parent.facilityNames = selectedFacilities
                    .map(id => {
                        const option = parent.facilityOptions.find(opt => opt.value === id);
                        return option ? option.label : null;
                    })
                    .filter(Boolean)
                    .sort((a, b) => a.localeCompare(b))
                    .join(', ');

                parent.supportItemCount = parent.childItems.length;
            });

            this.records = [...groupedMap.values()];
            console.log('Records:', JSON.stringify(this.records));
            //this.filteredRecords = [...this.records];
            this.filteredRecords = [];
            this.searchKey = '';

            this.totalRecords = this.records.length;
            //this.totalRecords = this.filteredRecords.length;
            //this.totalRecords = this.records.length;
            console.log('this.totalRecords : ',this.totalRecords);
            this.pageNumber = 1;

            this.paginationHelper();

        })
        .catch(error => {
            console.error('loadServiceCatalogues Error:', error);
        });

    }

   
    // toggleExpand(event) {
    //     const groupName = event.currentTarget.dataset.id;

    //     if (this.searchKey) {
    //         this.filteredRecords = this.filteredRecords.map(record => {
    //             if (record.registrationGroup === groupName) {
    //                 return {
    //                     ...record,
    //                     isExpanded: !record.isExpanded
    //                 };
    //             }
    //             return record;
    //         });
    //     } else {
    //         this.records = this.records.map(record => {
    //             if (record.registrationGroup === groupName) {
    //                 return {
    //                     ...record,
    //                     isExpanded: !record.isExpanded
    //                 };
    //             }
    //             return record;
    //         });
    //     }
    //     this.paginationHelper();
    // }
    toggleExpand(event) {
        const groupName = event.currentTarget.dataset.id;

        const updateRecord = record => {
            if (record.id === groupName) {
                return {
                    ...record,
                    isExpanded: !record.isExpanded
                };
            }
            return record;
        };

        this.records = this.records.map(updateRecord);

        if (this.filteredRecords.length) {
            this.filteredRecords = this.filteredRecords.map(updateRecord);
        }

        this.paginationHelper();
    }
    handleRowActions(event) {

        const actionName = event.currentTarget.dataset.name;
        const groupName = event.currentTarget.dataset.accid;
        console.log('Action:', actionName);
        console.log('Group:', groupName);

        switch (actionName) {
            case 'edit':
                this.handleEditServiceType(groupName);
                break;

            // case 'delete':
            //     this.handleDeleteServiceType(groupName);
            //     break;
            default:
                console.log('No Action');

        }

    }

    handleEditServiceType(groupName) {
        console.log('Edit Service Type:', groupName);
        // const parent = this.records.find(
        //     row => row.registrationGroup === groupName
        // );
        const parent = this.records.find(
            row => row.id === groupName
        );

        if (!parent) {
            console.log('Parent record not found');
            return;
        }

        console.log('Parent:', JSON.stringify(parent));
        this.isEditServiceType = true;
        this.parentSelectedFacilities = [...parent.selectedFacilities];
      
        console.log('Parent Financial Year:', parent.financialYear);
        console.log('Parent Industry:', parent.industry);
        console.log('Parent Registration Group:', parent.registrationGroup);
        this.selectedYear = parent.financialYear;
        this.selectedIndustry = parent.industry;
        this.serviceTypeName = parent.registrationGroup;
        console.log('Selected Year:', this.selectedYear);
        console.log('Selected Industry:', this.selectedIndustry);
        console.log('Selected Service Type:', this.serviceTypeName);

        // only these rows should be checked
        this.selectedServiceGroupIds =  parent.childItems.map(child => child.CatalogueId);

        console.log('Selected Catalogue Ids:',JSON.stringify(this.selectedServiceGroupIds) );
        this.createEditAddNewServiceType = 'Edit Service Type';
        this.addNewServiceTypeFlag = true;
        this.serviceCatalogueHomePage = false;

        this.loadNewServiceTypeCatalogues();

    }


    refreshServiceCatalogue() {

        this.pageNumber = 1;

        this.loadServiceCatalogues();

    }

    clearServiceCatalogue() {

        this.records = [];
        this.accList = [];
        this.totalRecords = 0;
        this.totalPages = 0;
        this.pageNumber = 1;
        this.noRecordsFlag = true;
        this.paginationVisible = false;
    }

    formatCurrency(value) {
        return '$' + (value || 0);

    }
    handleCloneNDISSupportCat(event) {

        const serviceCatalogueId = event.currentTarget.dataset.id;
        console.log('Clone clicked');
        console.log('Service Catalogue Id:', serviceCatalogueId);
        console.log('Records:', JSON.stringify(this.records));

        let selectedParent;
        let selectedRow;

        this.records.some(parent => {

            const child = parent.childItems.find(
                item => item.Id === serviceCatalogueId
            );

            if (child) {
                selectedParent = parent;
                selectedRow = child;
                return true;
            }

            return false;
        });
        console.log('Selected Row:', JSON.stringify(selectedRow));
        console.log('Selected Parent:', JSON.stringify(selectedParent));

        if (!selectedRow) {
            return;
        }
        console.log('industryType:', selectedParent.industry);
        console.log('serviceType:', selectedParent.registrationGroup);

        console.log('supportItemName:', selectedRow.Name);
        console.log('supportItemNumber:', selectedRow.Support_Item_Number__c);

        console.log('ACT:', selectedRow.ACTAmount);
        console.log('NSW:', selectedRow.NSWAmount);
        console.log('NT:', selectedRow.NTAmount);
        console.log('QLD:', selectedRow.QLDAmount);
        console.log('SA:', selectedRow.SAAmount);
        console.log('TAS:', selectedRow.TASAmount);
        console.log('VIC:', selectedRow.VICAmount);
        console.log('WA:', selectedRow.WAAmount);
        this.CreateorEditCatalogueName = 'Clone Service Catalogue';

        this.isCreateCatalogueModalOpen = true;
        this.serviceCatalogueHomePage = false;
        this.addNewServiceTypeFlag = false;
        this.isCloneCatalogue = true;
        this.formData = {
            Id: '',                      // <-- IMPORTANT (new record)

            industryType: selectedParent.industry,
            serviceType: selectedParent.registrationGroup,

            supportItemName: selectedRow.Name,

            // overwrite generated value with table value
            supportItemNumber:selectedRow.Support_Item_Number__c,

            ACT: selectedRow.ACTAmount,
            NSW: selectedRow.NSWAmount,
            NT: selectedRow.NTAmount,
            QLD: selectedRow.QLDAmount,
            SA: selectedRow.SAAmount,
            TAS: selectedRow.TASAmount,
            VIC: selectedRow.VICAmount,
            WA: selectedRow.WAAmount,
            facilityIds: selectedParent.selectedFacilities
        };

        this.loadNewServiceTypeCatalogues();
    }
    handleEditNDISSupportCat(event) {

        const serviceCatalogueId = event.currentTarget.dataset.id;

        console.log('========== Edit Catalogue ==========');
        console.log('Service Catalogue Id:', serviceCatalogueId);

        const selectedRow = this.serviceGroupName.find(
            row => row.Id === serviceCatalogueId
        );

        console.log('Selected Row:', JSON.stringify(selectedRow));

        if (!selectedRow) {
            console.log('No row found');
            return;
        }

        this.CreateorEditCatalogueName = 'Edit Service Catalogue';

        this.isCloneCatalogue = false;
        this.isEditFromAddServiceType = true;
        this.isCreateCatalogueModalOpen = true;
        this.serviceCatalogueHomePage = false;
        this.addNewServiceTypeFlag = false;

        this.formData = {

            // Existing record Id so Save performs UPDATE
            Id: selectedRow.Id,

            industryType: this.selectedIndustry,
            serviceType: this.serviceTypeName,
            supportItemName: selectedRow.Name,
            supportItemNumber: selectedRow.Support_Item_Number__c,

            supportItemName: selectedRow.Support_Item_Name__c,
            supportItemNumber: selectedRow.Support_Item_Number__c,
            ACT: selectedRow.ACT__c,
            NSW: selectedRow.NSW__c,
            NT: selectedRow.NT__c,
            QLD: selectedRow.QLD__c,
            SA: selectedRow.SA__c,
            TAS: selectedRow.TAS__c,
            VIC: selectedRow.VIC__c,
            WA: selectedRow.WA__c
        };

        console.log('Form Data:', JSON.stringify(this.formData));

        // Load Service Type dropdown values
        this.loadNewServiceTypeCatalogues();
    }
   
    handleSearch(event) {
        this.searchKey = (event.target.value || '').trim().toLowerCase();
        // No search -> show all records
        if (!this.searchKey) {

            this.records = this.records.map(parent => ({
                ...parent,
                isExpanded: false
            }));
            this.filteredRecords = [];
            this.pageNumber = 1;
            this.paginationHelper();
            return;
        }
        const filteredRecords = [];
        this.records.forEach(parent => {
            const serviceTypeMatch =
                (parent.registrationGroup || '')
                    .toLowerCase()
                    .includes(this.searchKey);

            const filteredChildren = parent.childItems.filter(child => {
                const supportItem = (child.Name || '').toLowerCase();
                const supportItemNumber = (child.Support_Item_Number__c || '').toLowerCase();
                return (
                    supportItem.includes(this.searchKey) ||
                    supportItemNumber.includes(this.searchKey)
                );
            });

            if (serviceTypeMatch || filteredChildren.length > 0) {
                filteredRecords.push({
                    ...parent,
                    isExpanded: filteredChildren.length > 0,
                    childItems:
                        filteredChildren.length > 0
                            ? filteredChildren
                            : parent.childItems
                });
            }
        });
        this.filteredRecords = filteredRecords;
        this.noRecordsFlag = filteredRecords.length === 0;
        this.pageNumber = 1;
        this.paginationHelper();
    }
            
            
}