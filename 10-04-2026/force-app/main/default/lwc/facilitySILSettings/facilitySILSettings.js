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
    get hasTableData()      { return this.serviceTableData?.length > 0; }
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
        this.savedSILRecords = records.map(rec => ({
            id:              rec.Id,
            participantName: rec.SIL_To_Participant__r?.Name__c || '',
            entityName:      rec.Entity_Name__c || '',
            serviceType:     rec.ServiceType__c || '',
            amount:          rec.Amount__c != null ? rec.Amount__c.toFixed(2) : '',
            startDate:       this.formatDate(rec.StartDate__c),
            endDate:         this.formatDate(rec.EndDate__c),
            invoiceDay:     rec.InvoiceDay__c || ''
        }));

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

    handleEntityChange(event) {
        const value = event.detail.value;
        if (value === 'add_new') {
            this.dispatchEvent(new CustomEvent('addentity', { bubbles: true, composed: true }));
            return;
        }
        this.selectedEntity           = value;
        this.silRecord.Entity_Name__c = value;
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
invoiceAmount: this.invoiceAmount,            planType:         this.silRecord.Plan_Type__c,
            serviceType:      this.serviceTypeValue,
            state:            this.stateValue,
            entityName:       this.getEntityLabel(this.selectedEntity),
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
    }

    handleBack() {
    this.showForm = false;
    this.resetForm();

    // Reset edit mode
    this.isEditMode = false;
    this.editingRecordId = null;
    }
    handleEdit(event) {
    const silId = event.currentTarget.dataset.id;

    this.isEditMode = true;
    this.editingRecordId = silId;
    this.showForm = true;

    this.loadEditRecord(silId);
    }
    /* loadEditRecord(silId) {
        fetchSILRecordById({ 
    silId: silId,
    state: sil.State__c    // first load → no filtering
})
            .then(result => {
                const sil  = result.sil;
                const items = result.items || [];
                const selectedIds = items.map(i => i.SILItem_To_NDIS_Support_Catalogue__c);
                // ── FIX 1: entity stored as label → find matching Id ──
                const entityMatch = this.entityOptions.find(opt => opt.label === sil.Entity_Name__c);
                this.selectedEntity = entityMatch ? entityMatch.value : '';

                this.planType         = sil.Plan_Type__c;
                this.participant      = sil.SIL_To_Participant__c;
                this.serviceTypeValue = sil.ServiceType__c;
                this.stateValue       = sil.State__c;
                this.amount           = sil.Amount__c;
                this.startDate        = sil.StartDate__c;
                this.endDate          = sil.EndDate__c;
                this.frequency        = sil.Frequency__c;
                this.invoiceDay       = sil.InvoiceDay__c;
                this.invoiceAmount    = sil.InvoiceAmount__c;

                this.silRecord = {
                    SIL_To_Participant__c : sil.SIL_To_Participant__c,
                    Plan_Type__c          : sil.Plan_Type__c,
                    Amount__c             : sil.Amount__c,
                    StartDate__c          : sil.StartDate__c,
                    EndDate__c            : sil.EndDate__c,
                    Frequency__c          : sil.Frequency__c,
                    InvoiceDay__c         : sil.InvoiceDay__c,
                    InvoiceAmount__c      : sil.InvoiceAmount__c
                };

                // ── FIX 2: wait for loadServiceItems to finish, THEN pre-select ──
                this.isLoading        = true;
                this.serviceTableData = [];
                fetchParticipantNDISCatalogue({
                    serviceType : this.serviceTypeValue,
                    serviceDate : new Date().toISOString().split('T')[0]
                })
                    .then(rows => {
                        this.serviceTableData = (rows || []).map(r => ({
                            id                : r.Id,
                            serviceName       : r.Support_Item_Name__c,
                            supportItemNumber : r.Support_Item_Number__c,
                            stateRate         : r[`${this.stateValue}__c`] || 0,
                            // pre-select the saved catalogue row immediately
                            isSelected        : selectedIds.includes(r.Id)
                        }));
                            this.serviceTotalRecords = this.serviceTableData.length;
    this.serviceTotalPages   = Math.ceil(this.serviceTotalRecords / this.servicePageSize) || 1;
    this.servicePageNumber   = 1;
                    })
                    .catch(err => console.error('Error fetching service items', err))
                    .finally(() => { this.isLoading = false; });
            })
            .catch(error => {
                console.error('Error loading edit record', error);
                this.showToast('Error', 'Failed to load record', 'error');
            });
    } */

      loadEditRecord(silId) {
    fetchSILRecordById({ silId })
        .then(result => {
            const sil = result.sil;

            // ── Set basic fields ──
            const entityMatch = this.entityOptions.find(opt => opt.label === sil.Entity_Name__c);
            this.selectedEntity = entityMatch ? entityMatch.value : '';

            this.planType         = sil.Plan_Type__c;
            this.participant      = sil.SIL_To_Participant__c;
            this.serviceTypeValue = sil.ServiceType__c;
            this.stateValue       = sil.State__c;
            this.amount           = sil.Amount__c;
            this.startDate        = sil.StartDate__c;
            this.endDate          = sil.EndDate__c;
            this.frequency        = sil.Frequency__c;
            this.invoiceDay       = sil.InvoiceDay__c;
            this.invoiceAmount    = sil.InvoiceAmount__c;

            this.silRecord = {
                SIL_To_Participant__c : sil.SIL_To_Participant__c,
                Plan_Type__c          : sil.Plan_Type__c,
                Amount__c             : sil.Amount__c,
                StartDate__c          : sil.StartDate__c,
                EndDate__c            : sil.EndDate__c,
                Frequency__c          : sil.Frequency__c,
                InvoiceDay__c         : sil.InvoiceDay__c,
                InvoiceAmount__c      : sil.InvoiceAmount__c
            };

            // ✅ IMPORTANT: load items AFTER state is set
            this.loadEditStateItems();
        })
        .catch(error => {
            console.error('Error loading edit record', error);
            this.showToast('Error', 'Failed to load record', 'error');
        });
}      
    loadEditStateItems() {
    this.isLoading = true;

    fetchSILRecordById({
        silId: this.editingRecordId,
        state: this.stateValue
    })
    .then(result => {
        const selectedIds = (result.items || []).map(
            i => i.SILItem_To_NDIS_Support_Catalogue__c
        );

        return fetchParticipantNDISCatalogue({
            serviceType: this.serviceTypeValue,
            serviceDate: new Date().toISOString().split('T')[0]
        })
        .then(rows => {
            this.serviceTableData = (rows || []).map(r => ({
                id: r.Id,
                serviceName: r.Support_Item_Name__c,
                supportItemNumber: r.Support_Item_Number__c,
                stateRate: r[`${this.stateValue}__c`] || 0,
                isSelected: selectedIds.includes(r.Id)
            }));

            // ✅ IMPORTANT (pagination fix)
            this.serviceTotalRecords = this.serviceTableData.length;
            this.serviceTotalPages = Math.ceil(this.serviceTotalRecords / this.servicePageSize) || 1;
            this.servicePageNumber = 1;
        });
    })
    .catch(err => {
        console.error('Error loading state items', err);
    })
    .finally(() => {
        this.isLoading = false;
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
        return this.serviceTableData.slice(start, end);
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
}