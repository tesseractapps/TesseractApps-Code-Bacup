import { LightningElement, api, track ,wire} from 'lwc';
import fetchEntity               from '@salesforce/apex/RosterInvoicesHandler.fetchEntity';
import fetchActiveParticipants   from '@salesforce/apex/facilitySILController.fetchActiveParticipants';
import fetchServiceTypes         from '@salesforce/apex/facilitySILController.fetchServiceTypes';
import fetchParticipantNDISCatalogue from '@salesforce/apex/facilitySILController.fetchParticipantNDISCatalogue';
import fetchSILRecords           from '@salesforce/apex/facilitySILController.fetchSILRecords';
import saveSIL                   from '@salesforce/apex/facilitySILController.saveSIL';
import { ShowToastEvent }        from 'lightning/platformShowToastEvent';
import fetchSILRecordById from '@salesforce/apex/facilitySILController.fetchSILRecordById';
import ENABLE_SIL_FIELD from '@salesforce/schema/Facility__c.EnableSIL__c';
import { getRecord, updateRecord } from 'lightning/uiRecordApi';
import updateSILStatus from '@salesforce/apex/facilitySILController.updateSILStatus';
export default class FacilitySILSettings extends LightningElement {
@track isInvoiceEdited = false;
    @api facilityId;
    @api recordId;

    // ── Toggle / form visibility ──────────────────────────────────
    @track enableSIL  = false;
    @track showForm   = false;

    // ── Dropdown options ──────────────────────────────────────────
    @track entityOptions      = [];
    @track participantOptions = [];
    @track serviceTypeOptions = [];

    // ── Form-bound tracked values ─────────────────────────────────
    @track selectedEntity   = '';
    @track planType         = '';
    @track participant      = '';
    @track serviceTypeValue = '';
    @track stateValue       = '';
    @track amount           = '';
    @track startDate        = '';
    @track endDate          = '';
    @track frequency        = 'Weekly';
    @track invoiceDate      = '';
    @track invoiceAmount    = '';

    // ── Service items table ───────────────────────────────────────
    @track serviceTableData = [];
    @track isLoading        = false;
    @track invoiceDay = '';
    // ── Saved SIL records (fetched from DB) ───────────────────────
    @track savedSILRecords  = [];
    @track isLoadingSaved   = false;

    // ── Pending (staged) records ──────────────────────────────────
    @track stagedRecords    = [];
    @track isSaving         = false;

    @track isEditMode = false;
    @track editingRecordId = null;
    // ── Internal payload bag ──────────────────────────────────────
    @track servicePageNumber = 1;
    @track servicePageSize   = 5; // same default as SIL
    @track serviceTotalRecords = 0;
    @track serviceTotalPages = 0;
    @track remainingAmount = '';
    @track spentAmount = '';
    @track filteredServiceTableData = [];
    @track serviceSearchKey = '';
    
    
    @wire(getRecord, {
        recordId: '$facilityId',
        fields: [ENABLE_SIL_FIELD]
    })
    wiredFacility({ data, error }) {
        if (data) {
            this.enableSIL = data.fields.EnableSIL__c.value;

            // ✅ ADD THIS BLOCK
            if (this.enableSIL) {
                this.loadSavedSILRecords();
            }
        } else if (error) {
            console.error('Error loading SIL toggle', error);
        }
    }
    silRecord = {};

    // ── Static options ────────────────────────────────────────────
    get stateOptions() {
        return [
            { label: 'ACT', value: 'ACT' },
            { label: 'NSW', value: 'NSW' },
            { label: 'NT',  value: 'NT'  },
            { label: 'QLD', value: 'QLD' },
            { label: 'SA',  value: 'SA'  },
            { label: 'TAS', value: 'TAS' },
            { label: 'VIC', value: 'VIC' },
            { label: 'WA',  value: 'WA'  }
        ];
    }

    invoiceDayOptions = [
    { label: 'Monday', value: 'Monday' },
    { label: 'Tuesday', value: 'Tuesday' },
    { label: 'Wednesday', value: 'Wednesday' },
    { label: 'Thursday', value: 'Thursday' },
    { label: 'Friday', value: 'Friday' },
    { label: 'Saturday', value: 'Saturday' },
    { label: 'Sunday', value: 'Sunday' }
     ];
    //pagination options
    @track pageNumber = 1;
    @track pageSize   = 5;
    @track totalRecords = 0;
    @track totalPages = 0;
    pageSizeOptions = [5,10,25,50,75,100];

    get bDisableFirst() {
    return this.totalRecords === 0 || this.pageNumber <= 1;
    }

    get bDisableLast() {
        return this.totalRecords === 0 || this.pageNumber >= this.totalPages;
    }

    get formTitle() {
    return this.isEditMode ? 'Edit SIL Entry' : 'New SIL Entry';
    }
    planTypeOptions = [
        { label: 'Plan Managed', value: 'Plan Managed' },
        { label: 'Self Managed', value: 'Self Managed' },
        { label: 'NDIA Managed', value: 'NDIA Managed' }
    ];

    frequencyOptions = [
        { label: 'Weekly',      value: 'Weekly'      },
        { label: 'Fortnightly', value: 'Fortnightly' },
        { label: 'Monthly',     value: 'Monthly'     }
    ];

    // ── Lifecycle ─────────────────────────────────────────────────
    connectedCallback() {
        this.loadEntities();
        this.loadParticipants();
        this.loadServiceTypes();
    }

    // ── Computed getters ──────────────────────────────────────────
    get hasTableData() { 
        return this.filteredServiceTableData?.length > 0; 
    }
    get hasStagedRecords()  { return this.stagedRecords?.length > 0; }
    get hasSavedRecords()   { return this.savedSILRecords?.length > 0; }
    get stagedCount()       { return this.stagedRecords.length; }

    get saveAllLabel() {
    if (this.isEditMode) {
        return 'Update';
    }
    
    return this.isSaving
        ? 'Saving...'
        : `Save All (${this.stagedRecords.length})`;
}
get showSaveButton() {
    return this.hasStagedRecords || this.isEditMode;
}

   handleEnable(event) {
    this.enableSIL = event.target.checked;

    const fields = {};
    fields['Id'] = this.facilityId;
    fields[ENABLE_SIL_FIELD.fieldApiName] = this.enableSIL;

    updateRecord({ fields })
        .then(() => {
            console.log('SIL setting updated');
        })
        .catch(error => {
           console.error(JSON.stringify(error.body));
        });
}

    // ── Toggle Add SIL form panel ─────────────────────────────────
    handleToggleForm() {
        this.showForm = !this.showForm;
        if (!this.showForm) {
            this.resetForm();
        }
    }

    loadSavedSILRecords() {
    this.isLoadingSaved = true;
    const offset = (this.pageNumber - 1) * this.pageSize;
    fetchSILRecords({
        facilityId: this.facilityId,
        limitSize: this.pageSize,
        offsetVal: offset
    })
    .then(result => {
        const records = result.records || [];
        this.totalRecords = result.total || 0;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
      /*   this.savedSILRecords = records.map(rec => ({
            id:              rec.Id,
            participantName: rec.SIL_To_Participant__r?.Name__c || '',
            entityName:      rec.Entity_Name__c || '',
            serviceType:     rec.ServiceType__c || '',
            amount:          rec.Amount__c != null ? rec.Amount__c.toFixed(2) : '',
            startDate:       this.formatDate(rec.StartDate__c),
            endDate:         this.formatDate(rec.EndDate__c),
            invoiceDay:     rec.InvoiceDay__c || '',
            status: rec.Status__c,

        // ✅ UI CONTROL
        startClass: isActive
            ? 'action-link disabled'
            : 'action-link active-btn',

        stopClass: isActive
            ? 'action-link stop active-btn'
            : 'action-link stop disabled'
        })); */
this.savedSILRecords = records.map(rec => {

    const isActive = rec.Status__c === 'Active'; // ✅ DEFINE THIS

    return {
        id: rec.Id,
        participantName: rec.SIL_To_Participant__r?.Name__c || '',
        entityName: rec.Entity_Name__c || '',
        serviceType: rec.ServiceType__c || '',
        amount: rec.Amount__c != null ? rec.Amount__c.toFixed(2) : '',
        startDate: this.formatDate(rec.StartDate__c),
        endDate: this.formatDate(rec.EndDate__c),
        invoiceDay: rec.InvoiceDay__c || '',
        status: rec.Status__c,
        remainingAmount: rec.Remaining_Amount__c != null
            ? rec.Remaining_Amount__c.toFixed(2)
            : '0.00',
        spentAmount: rec.Spent_Amount__c != null
                ? rec.Spent_Amount__c.toFixed(2)
                : '0.00',

        startClass: isActive
            ? 'action-link disabled'
            : 'action-link active-btn',

        stopClass: isActive
            ? 'action-link stop active-btn'
            : 'action-link stop disabled'
    };
});
    })
    .catch(error => console.error('Error fetching SIL records', error))
    .finally(() => { this.isLoadingSaved = false; });
}
    // ── Entity dropdown ───────────────────────────────────────────
    @api
    refreshEntities() { this.loadEntities(); }

    getEntityLabel(entityId) {
        if (!entityId) return '';
        const match = this.entityOptions.find(opt => opt.value === entityId);
        return match ? match.label : entityId;
    }

/*     handleEntityChange(event) {
        const value = event.detail.value;
        if (value === 'add_new') {
            this.dispatchEvent(new CustomEvent('addentity', { bubbles: true, composed: true }));
            return;
        }
        this.selectedEntity           = value;
        this.silRecord.Entity_Name__c = value;
    } */
handleEntityChange(event) {
    const value = event.detail.value;

    this.selectedEntity = value;

    // ✅ Store ID (lookup)
    this.silRecord.Entity_Profile__c = value;

    // ✅ Store Name (text)
    this.silRecord.Entity_Name__c = this.getEntityLabel(value);
}
    loadEntities() {
        fetchEntity({ facilityId: this.facilityId })
            .then(result => {
                this.entityOptions = (result || []).map(rec => {
                    let label = '';
                    if (rec.First_Name__c || rec.Last_Name__c)
                        label = `${rec.First_Name__c || ''} ${rec.Last_Name__c || ''}`.trim();
                    if (!label && rec.Name__c) label = rec.Name__c;
                    if (!label) label = rec.Name;
                    return { label, value: rec.Id };
                });
               // this.entityOptions.unshift({ label: '+ Add New Entity', value: 'add_new' });
            })
            .catch(error => console.error('Error fetching entities', error));
    }

    // ── Participants ──────────────────────────────────────────────
    loadParticipants() {
        fetchActiveParticipants({ facilityId: this.facilityId })
            .then(result => { this.participantOptions = result || []; })
            .catch(error => console.error('Error fetching participants', error));
    }

    getParticipantLabel(participantId) {
        if (!participantId) return '';
        const match = this.participantOptions.find(opt => opt.value === participantId);
        return match ? match.label : participantId;
    }

    // ── Service Types ─────────────────────────────────────────────
    loadServiceTypes() {
        fetchServiceTypes()
            .then(result => {
                this.serviceTypeOptions = (result || []).map(type => ({ label: type, value: type }));
                console.log('Service Type Options for dropdown:', JSON.stringify(this.serviceTypeOptions));
            })
            .catch(error => console.error('Error loading service types', error));
    }

    // ── Service Type / State handlers ─────────────────────────────
    handleServiceTypeChange(event) {
        this.serviceTypeValue = event.detail.value;
        this.checkAndLoadTable();
    }

   /*  handleStateChange(event) {
        this.stateValue = event.detail.value;
        this.checkAndLoadTable();
    } */
handleStateChange(event) {
    this.stateValue = event.detail.value;

    if (this.isEditMode) {
        this.loadEditStateItems();   // ✅ NEW
    } else {
        this.checkAndLoadTable();
    }
}
    checkAndLoadTable() {
        if (this.serviceTypeValue && this.stateValue) {
            this.loadServiceItems();
        } else {
            this.serviceTableData = [];
        }
    }

    loadServiceItems() {
        this.isLoading        = true;
        this.serviceTableData = [];
        fetchParticipantNDISCatalogue({
            serviceType: this.serviceTypeValue,
            serviceDate: new Date().toISOString().split('T')[0]
        })
            .then(result => {
                this.serviceTableData = (result || []).map(item => ({
                    id:                item.Id,
                    serviceName:       item.Support_Item_Name__c,
                    supportItemNumber: item.Support_Item_Number__c,
                    stateRate:         item[`${this.stateValue}__c`] || 0,
                    isSelected:        false
                }));
                this.filteredServiceTableData = [...this.serviceTableData];
                this.serviceTotalRecords = this.serviceTableData.length;
                this.serviceTotalPages = Math.ceil(this.serviceTotalRecords / this.servicePageSize) || 1;
                this.servicePageNumber = 1;
            })
            .catch(error => console.error('Error fetching service items', error))
            .finally(() => { this.isLoading = false; });
    }

        handleRowSelect(event) {
        const id = event.target.dataset.id;
        const checked = event.target.checked;
        this.serviceTableData = this.serviceTableData.map(row => {
            if (row.id === id) {
                return { ...row, isSelected: checked };
            }
            return row;
        });
    }
    // ── General field handler ─────────────────────────────────────
    /* handleChange(event) {
        const field = event.target.dataset.field;
        const value = event.target.value;
        this.silRecord[field] = value;
        switch (field) {
            case 'Plan_Type__c':          this.planType      = value; break;
            case 'SIL_To_Participant__c': this.participant   = value; break;
           case 'Amount__c':
case 'Frequency__c':
    this.calculateInvoiceAmount();
    break;
           case 'StartDate__c':
    this.startDate = value;

    if (this.endDate && this.endDate < this.startDate) {
        this.showToast('Error', 'End Date cannot be before Start Date', 'error');
        this.endDate = '';
    }

    this.calculateInvoiceAmount();
    break;
          case 'EndDate__c':
    this.endDate = value;

    if (this.startDate && this.endDate < this.startDate) {
        this.showToast('Error', 'End Date cannot be before Start Date', 'error');
        this.endDate = '';
        return;
    }

    this.calculateInvoiceAmount();
    break;
            case 'Frequency__c':          this.frequency     = value; break;
            case 'InvoiceDay__c':         this.invoiceDay    = value; break;
            case 'InvoiceAmount__c':
    this.invoiceAmount = value;
    this.isInvoiceEdited = true;
    break;
            default: break;
        }
    } */

        handleChange(event) {
    const field = event.target.dataset.field;
    const value = event.target.value;

    this.silRecord[field] = value;

    switch (field) {
        case 'Amount__c':
    this.amount = value;

    const spent = this.spentAmount ? parseFloat(this.spentAmount) : 0;

    this.remainingAmount = value - spent;
    this.calculateInvoiceAmount();
    break;

        case 'StartDate__c':
            this.startDate = value;

            if (this.endDate && this.endDate < this.startDate) {
                this.showToast('Error', 'End Date cannot be before Start Date', 'error');
                this.endDate = '';
                return;
            }

            this.calculateInvoiceAmount();
            break;

        case 'EndDate__c':
            this.endDate = value;

            if (this.startDate && this.endDate < this.startDate) {
                this.showToast('Error', 'End Date cannot be before Start Date', 'error');
                this.endDate = '';
                return;
            }

            this.calculateInvoiceAmount();
            break;

        case 'Frequency__c':
            this.frequency = value;
            this.calculateInvoiceAmount();
            break;
 case 'InvoiceDay__c':         this.invoiceDay    = value; break;
case 'InvoiceAmount__c':
    this.invoiceAmount = value;

    if (value === '' || value === null) {
        // user cleared → allow auto again
        this.isInvoiceEdited = false;
    } else {
        // user typed something → lock manual mode
        this.isInvoiceEdited = true;
    }
    break;

        case 'Plan_Type__c':
            this.planType = value;
            break;

        case 'SIL_To_Participant__c':
            this.participant = value;
            break;

        default:
            break;
    }
}
    // ── Add entry to pending list (no DB call) ────────────────────
    handleAdd() {
        //const selected = this.serviceTableData.find(r => r.isSelected);
        const selectedItems = this.serviceTableData.filter(r => r.isSelected);  
       
        if (!this.silRecord.Entity_Name__c) {
            this.showToast('Error', 'Entity is required', 'error'); return;
        }    
        if(!this.planType) {
            this.showToast('Error', 'Plan Type is required', 'error'); return;
        }
        if (!this.silRecord.SIL_To_Participant__c) {
            this.showToast('Error', 'Participant is required', 'error'); return;
        }
        if (!this.silRecord.Amount__c) {
            this.showToast('Error', 'Amount is required', 'error'); return;
        }
         if (!this.silRecord.StartDate__c || !this.silRecord.EndDate__c) {
            this.showToast('Error', 'Start Date and End Date are required', 'error'); return;
        }
         if (!this.invoiceDay) {
            this.showToast('Error', 'Invoice Day is required', 'error'); return;
        }
        if(!this.invoiceAmount) {
            this.showToast('Error', 'Invoice Amount is required', 'error'); return;
        }
        if (!this.serviceTypeValue) {
            this.showToast('Error', 'Service Type is required', 'error'); return;
        }
        if (!this.stateValue) {
            this.showToast('Error', 'State is required', 'error'); return;
        }
       if (!selectedItems.length) {
            this.showToast('Error', 'Please select at least one support item', 'error'); return;
        }
       

        const card = {
            uid:              Date.now() + Math.random(),
            participantLabel: this.getParticipantLabel(this.silRecord.SIL_To_Participant__c),
            entityLabel:      this.getEntityLabel(this.selectedEntity),
            // Payload fields
            name:             this.serviceTypeValue,
            amount:           this.silRecord.Amount__c,
            startDate:        this.silRecord.StartDate__c,
            endDate:          this.silRecord.EndDate__c,
            frequency:        this.silRecord.Frequency__c || this.frequency,
            invoiceDay:       this.silRecord.InvoiceDay__c,
            invoiceAmount: this.invoiceAmount,           
            planType:         this.silRecord.Plan_Type__c,
            serviceType:      this.serviceTypeValue,
            state:            this.stateValue,
            entityId: this.silRecord.Entity_Profile__c,  
            entityName: this.silRecord.Entity_Name__c, 
            //entityName:       this.getEntityLabel(this.selectedEntity),
            facilityId:       this.facilityId,
            participantId:    this.silRecord.SIL_To_Participant__c,
            /* selectedItem: {
                catalogueId:       selected.id,
                serviceName:       selected.serviceName,
                supportItemNumber: selected.supportItemNumber,
                supportItemName:   selected.serviceName
            } */
           selectedItems: selectedItems.map(item => ({
            catalogueId: item.id,
            serviceName: item.serviceName,
            supportItemNumber: item.supportItemNumber,
            supportItemName: item.serviceName
        }))
        };

        this.stagedRecords = [...this.stagedRecords, card];
        this.showToast('Added', `${card.participantLabel} added to pending list`, 'success');
        this.resetForm();

        const btn = this.template.querySelector('[data-id="addBtn"]');
    if (btn) {
        btn.blur();
    }
    }

    // ── Delete a pending record card ──────────────────────────────
    handleDeleteCard(event) {
        const uid = parseFloat(event.currentTarget.dataset.uid);
        this.stagedRecords = this.stagedRecords.filter(c => c.uid !== uid);
    }

    // ── Save all pending records to Salesforce ────────────────────
    handleSaveAll() {
           if (this.isEditMode) {
        this.handleUpdate();
        return;
    }
        if (!this.stagedRecords.length) return;
        this.isSaving = true;

        const promises = this.stagedRecords.map(card => {
            const { uid, participantLabel, entityLabel, ...payload } = card;
            return saveSIL({ requestJson: JSON.stringify(payload) });
        });

        Promise.all(promises)
            .then(() => {
                this.showToast(
                    'Success',
                    `${this.stagedRecords.length} SIL record(s) saved successfully`,
                    'success'
                );
                this.stagedRecords = [];
                this.showForm = false;          // switch back to saved table view
                this.resetForm();
                // Reload the saved table to reflect new inserts
                this.loadSavedSILRecords();
            })
            .catch(error => {
                console.error('Error saving SIL records', error);
                this.showToast(
                    'Error',
                    error?.body?.message || 'One or more records failed to save',
                    'error'
                );
            })
            .finally(() => { this.isSaving = false; });
    }

    handleUpdate() {
    //const selected = this.serviceTableData.find(r => r.isSelected);
    const selectedItems = this.serviceTableData.filter(r => r.isSelected);
    if (!selectedItems.length) {
        this.showToast('Error', 'Please select at least one support item', 'error'); return;
    }

    const payload = {
        silId         : this.editingRecordId,   // ← this triggers update path
        amount        : this.silRecord.Amount__c,
        startDate     : this.silRecord.StartDate__c,
        endDate       : this.silRecord.EndDate__c,
        frequency     : this.silRecord.Frequency__c,
        invoiceDay    : this.silRecord.InvoiceDay__c,
        invoiceAmount : this.invoiceAmount,
        planType      : this.silRecord.Plan_Type__c,
        serviceType   : this.serviceTypeValue,
        state         : this.stateValue,
        entityName    : this.getEntityLabel(this.selectedEntity),
        facilityId    : this.facilityId,
        participantId : this.silRecord.SIL_To_Participant__c,
        selectedItems: selectedItems.map(item => ({
        catalogueId       : item.id,
        serviceName       : item.serviceName,
        supportItemNumber : item.supportItemNumber,
        supportItemName   : item.serviceName
    }))
    };

    saveSIL({ requestJson: JSON.stringify(payload) })
        .then(() => {
            this.showToast('Success', 'SIL record updated successfully', 'success');
            this.isEditMode      = false;
            this.editingRecordId = null;
            this.showForm        = false;
            this.resetForm();
            this.loadSavedSILRecords();
        })
        .catch(err => {
            this.showToast('Error', err?.body?.message || 'Update failed', 'error');
        });
    }
    // ── Clear form ────────────────────────────────────────────────
    handleClear() { this.resetForm(); }

    resetForm() {
        this.silRecord        = {};
        this.selectedEntity   = '';
        this.planType         = '';
        this.participant      = '';
        this.serviceTypeValue = '';
        this.stateValue       = '';
        this.amount           = '';
        this.startDate        = '';
        this.endDate          = '';
        this.frequency        = 'Weekly';
        this.invoiceDay       = '';
        this.invoiceAmount    = '';
        this.serviceTableData = [];
        this.isInvoiceEdited = false;
        this.remainingAmount = '';
        this.spentAmount = '';
        this.serviceSearchKey = '';
        this.filteredServiceTableData = [];
    }

    handleBack() {
    this.showForm = false;
    this.resetForm();

    // Reset edit mode
    this.isEditMode = false;
    this.editingRecordId = null;
    }
    handleEdit(event) {
        console.log('handleEdit called');
        console.log('Event received:', event);

        const silId = event.currentTarget.dataset.id;
        console.log('Selected Record Id (silId):', silId);

        this.isEditMode = true;
        console.log('isEditMode set to:', this.isEditMode);

        this.editingRecordId = silId;
        console.log('editingRecordId set to:', this.editingRecordId);

        this.showForm = true;
        console.log('showForm set to:', this.showForm);

        console.log('Calling loadEditRecord with Id:', silId);
        this.loadEditRecord(silId);

        console.log('handleEdit execution completed');
    }
  
    loadEditRecord(silId) {
        console.log('loadEditRecord called');
        console.log('Received silId:', silId);

        fetchSILRecordById({ silId })
            .then(result => {
                console.log('fetchSILRecordById response:', result);

                const sil = result.sil;
                console.log('SIL record:', sil);

                // ── Set basic fields ──
                console.log('Entity options before matching:', this.entityOptions);
                console.log('Matching Entity Name:', sil.Entity_Name__c);

                const entityMatch = this.entityOptions.find(
                    opt => opt.label === sil.Entity_Name__c
                );

                console.log('Matched entity:', entityMatch);

                this.selectedEntity = entityMatch ? entityMatch.value : '';
                console.log('selectedEntity set to:', this.selectedEntity);

                this.planType = sil.Plan_Type__c;
                console.log('planType:', this.planType);

                this.participant = sil.SIL_To_Participant__c;
                console.log('participant:', this.participant);

                this.serviceTypeValue = sil.ServiceType__c;
                console.log('serviceTypeValue:', this.serviceTypeValue);

                this.stateValue = sil.State__c;
                console.log('stateValue:', this.stateValue);

                this.amount = sil.Amount__c;
                console.log('amount:', this.amount);

                this.startDate = sil.StartDate__c;
                console.log('startDate:', this.startDate);

                this.endDate = sil.EndDate__c;
                console.log('endDate:', this.endDate);

                this.frequency = sil.Frequency__c;
                console.log('frequency:', this.frequency);

                this.invoiceDay = sil.InvoiceDay__c;
                console.log('invoiceDay:', this.invoiceDay);

                this.invoiceAmount = sil.InvoiceAmount__c;
                console.log('invoiceAmount:', this.invoiceAmount);

                this.spentAmount = sil.Spent_Amount__c || 0;
                console.log('spentAmount:', this.spentAmount);

                this.remainingAmount = sil.Amount__c - this.spentAmount;
                console.log('remainingAmount:', this.remainingAmount);

                this.silRecord = {
                    SIL_To_Participant__c: sil.SIL_To_Participant__c,
                    Plan_Type__c: sil.Plan_Type__c,
                    Amount__c: sil.Amount__c,
                    StartDate__c: sil.StartDate__c,
                    EndDate__c: sil.EndDate__c,
                    Frequency__c: sil.Frequency__c,
                    InvoiceDay__c: sil.InvoiceDay__c,
                    InvoiceAmount__c: sil.InvoiceAmount__c
                };

                console.log('silRecord object created:', this.silRecord);

                console.log('Calling loadEditStateItems...');
                this.loadEditStateItems();

                console.log('loadEditRecord completed successfully');
            })
            .catch(error => {
                console.error('Error loading edit record:', error);
                console.error('Error details:', JSON.stringify(error));

                this.showToast('Error', 'Failed to load record', 'error');
            });
    }

    loadEditStateItems() {
        console.log('loadEditStateItems called');
        console.log('editingRecordId:', this.editingRecordId);
        console.log('stateValue:', this.stateValue);
        console.log('serviceTypeValue:', this.serviceTypeValue);

        this.isLoading = true;
        console.log('isLoading set to:', this.isLoading);

        fetchSILRecordById({
            silId: this.editingRecordId,
            state: this.stateValue
        })
        .then(result => {
            console.log('fetchSILRecordById response:', result);

            const selectedIds = (result.items || []).map(
                i => i.SILItem_To_NDIS_Support_Catalogue__c
            );

            console.log('Selected item IDs:', selectedIds);

            const serviceDate = new Date().toISOString().split('T')[0];
            console.log('Service date for catalogue fetch:', serviceDate);

            console.log('Calling fetchParticipantNDISCatalogue with:', {
                serviceType: this.serviceTypeValue,
                serviceDate: serviceDate
            });

            return fetchParticipantNDISCatalogue({
                serviceType: this.serviceTypeValue,
                serviceDate: serviceDate
            })
            .then(rows => {
                console.log('fetchParticipantNDISCatalogue response:', rows);
                console.log('Total catalogue rows:', rows ? rows.length : 0);

                this.serviceTableData = (rows || []).map(r => {
                    const mappedRow = {
                        id: r.Id,
                        serviceName: r.Support_Item_Name__c,
                        supportItemNumber: r.Support_Item_Number__c,
                        stateRate: r[`${this.stateValue}__c`] || 0,
                        isSelected: selectedIds.includes(r.Id)
                    };

                    console.log('Mapped row:', mappedRow);
                    return mappedRow;
                });

                console.log('Final serviceTableData:', this.serviceTableData);

                // Pagination
                this.serviceTotalRecords = this.serviceTableData.length;
                console.log('serviceTotalRecords:', this.serviceTotalRecords);

                this.filteredServiceTableData = [...this.serviceTableData];
                console.log('filteredServiceTableData:', this.filteredServiceTableData);

                this.serviceTotalPages =
                    Math.ceil(this.serviceTotalRecords / this.servicePageSize) || 1;
                console.log('serviceTotalPages:', this.serviceTotalPages);

                this.servicePageNumber = 1;
                console.log('servicePageNumber reset to:', this.servicePageNumber);
            });
        })
        .catch(err => {
            console.error('Error loading state items:', err);
            console.error('Error details:', JSON.stringify(err));
        })
        .finally(() => {
            this.isLoading = false;
            console.log('isLoading set to:', this.isLoading);
            console.log('loadEditStateItems execution completed');
        });
    }

    handleRecordsPerPage(event) {
    this.pageSize = parseInt(event.target.value, 10);
    this.pageNumber = 1;
    this.loadSavedSILRecords();
    this.servicePageSize = this.pageSize;
    this.servicePageNumber = 1;
    this.serviceTotalPages = this.serviceTotalRecords
        ? Math.ceil(this.serviceTotalRecords / this.servicePageSize)
        : 1;
    }

    firstPage() {
        this.pageNumber = 1;
        this.loadSavedSILRecords();
    }

    previousPage() {
        if (this.pageNumber > 1) {
            this.pageNumber--;
            this.loadSavedSILRecords();
        }
    }

    nextPage() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber++;
            this.loadSavedSILRecords();
        }
    }

    lastPage() {
        this.pageNumber = this.totalPages;
        this.loadSavedSILRecords();
    }

    get isServiceFirstDisabled() {
    return this.serviceTotalRecords === 0 || this.serviceTotalPages <= 1 || this.servicePageNumber <= 1;
    }

    get isServiceLastDisabled() {
        return this.serviceTotalRecords === 0 || this.serviceTotalPages <= 1 || this.servicePageNumber >= this.serviceTotalPages;
    }
    get isServicePaginationDisabled() {
        return this.serviceTotalRecords === 0;
    }
    get pagedServiceData() {
        const start = (this.servicePageNumber - 1) * this.servicePageSize;
        const end = start + this.servicePageSize;
        return this.filteredServiceTableData.slice(start, end);
    }
    nextServicePage() {
        if (this.servicePageNumber < this.serviceTotalPages) {
            this.servicePageNumber++;
        }
    }

    previousServicePage() {
        if (this.servicePageNumber > 1) {
            this.servicePageNumber--;
        }
    }

    firstServicePage() {
        this.servicePageNumber = 1;
    }

    lastServicePage() {
        this.servicePageNumber = this.serviceTotalPages;
    }

    // ── Toast helper ──────────────────────────────────────────────
    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

calculateInvoiceAmount() {

    if (this.isInvoiceEdited) return;

    const amount = this.silRecord.Amount__c;

    if (!amount || !this.startDate || !this.endDate || !this.frequency) return;

    const start = new Date(this.startDate);
    const end   = new Date(this.endDate);

    const diffTime = end - start;
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (totalDays <= 0) return;

    const dailyRate = amount / totalDays;

    let multiplier = 1;

    if (this.frequency === 'Weekly') {
        multiplier = 7;
    } else if (this.frequency === 'Fortnightly') {
        multiplier = 14;
    } else if (this.frequency === 'Monthly') {
        multiplier = 30;
    }

    this.invoiceAmount = (dailyRate * multiplier).toFixed(2);
}
formatDate(dateStr) {
    if (!dateStr) return '';

    const date = new Date(dateStr);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

handleStart(event) {
    const id = event.currentTarget.dataset.id;
    const row = this.savedSILRecords.find(r => r.id === id);

    if (row.status === 'Active') return; // ❌ prevent click

    this.updateStatus(id, 'Active');
}

handleStop(event) {
    const id = event.currentTarget.dataset.id;
    const row = this.savedSILRecords.find(r => r.id === id);

    if (row.status === 'Inactive') return; // ❌ prevent click

    this.updateStatus(id, 'Inactive');
}
updateStatus(silId, status) {
    updateSILStatus({ silId, status })
        .then(() => {
            this.showToast('Success', `SIL marked as ${status}`, 'success');
            this.loadSavedSILRecords(); // 🔥 refresh table
        })
        .catch(error => {
            console.error(error);
            this.showToast('Error', 'Failed to update status', 'error');
        });
}

handleServiceSearch(event) {
    this.serviceSearchKey = event.target.value.toLowerCase().trim();

    if (!this.serviceSearchKey) {
        this.filteredServiceTableData = [...this.serviceTableData];
    } else {
        this.filteredServiceTableData = this.serviceTableData.filter(row => {
            const serviceName = row.serviceName
                ? row.serviceName.toLowerCase()
                : '';

            const supportNumber = row.supportItemNumber
                ? row.supportItemNumber.toLowerCase()
                : '';

            return (
                serviceName.includes(this.serviceSearchKey) ||
                supportNumber.includes(this.serviceSearchKey)
            );
        });
    }

    this.servicePageNumber = 1;
    this.serviceTotalRecords = this.filteredServiceTableData.length;
    this.serviceTotalPages =
        Math.ceil(this.serviceTotalRecords / this.servicePageSize) || 1;
}
}