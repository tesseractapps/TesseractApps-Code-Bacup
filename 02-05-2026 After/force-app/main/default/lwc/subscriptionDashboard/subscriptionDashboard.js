import { LightningElement, wire, track, api } from 'lwc';
import getStats from '@salesforce/apex/DashboardController.getStats';
import upsertAgreement from '@salesforce/apex/BillingAgreementController.upsertAgreement';
import attachAgreementFiles from '@salesforce/apex/BillingAgreementController.attachAgreementFiles';
import getAgreements from '@salesforce/apex/BillingAgreementController.getAgreements';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import canAddAgreement from '@salesforce/apex/LimitCheckService.canAddAgreement';
import TESSERACT_DOMAIN from '@salesforce/label/c.Tesseract_Domain';
import GEO_ENV from '@salesforce/label/c.Geo_SystemEnv';
import deleteAgreement from '@salesforce/apex/BillingAgreementController.deleteAgreement';
import getAllInvoicesForOrganisation from '@salesforce/apex/BillingAgreementController.getAllInvoicesForOrganisation';
import getUploadConfig from '@salesforce/apex/AwsBatchController.getUploadConfig';
import qrImage from '@salesforce/resourceUrl/GoCardlessQR';
import getStorageUsage from '@salesforce/apex/StorageService.getStorageUsage';

isStartPlan = false;
export default class SubscriptionDashboard extends LightningElement {
     
    qrCodeUrl = qrImage;
    @api recordId;   // receive organisation Id from parent
    currentAgreementId;
    @track stats = [];
    @track plan = {};
    @track agreements = [];
    @track billingData = [];
    allowAddAgreement = false;

    // Add+ modal
    @track isModalOpen = false;
    @track agreementNameValue = '';
    @track uploadedFiles = [];
    @track showSpinner = false;

    @track billingPageSizeOptions = [5, 10, 25];
    @track billingPageSize = 5;
    @track billingPageNumber = 1;
    @track billingTotalRecords = 0;
    @track billingTotalPages = 0;
    @track billingData = [];
    @track billingFilteredData = [];
    @track billingDisplayData = [];
    @track billingPaginationVisible = false;
    @track previewUrl = '';
    @track isPreviewOpen = false;

    @track paymentDetails = {
    accountName: '',
    accountNumber: '',
    reference: '',
    date: null
    };
    
    storageUsedAWS = 0;
    storageLimitAWS = 1;


    closePreview() {
    this.isPreviewOpen = false;
    this.previewUrl = '';
    }
    // Global Upload modal
    //@track isUploadModalOpen = false;
    /*@track uploadForm = {
        invoiceNumber: '',
        description: '',
        amount: '',
        status: 'Paid'
    };
    @track isUploading = false;

    // Drag & drop / file handling
    @track isFileExpand = false;
    @track allowMultiple = true;
    @track recordIdForFileUpload = '';*/

    wiredResult;

    basePath;
    acceptedFormats;
    maxFileSize;
    allowMultiple;
    maxFileCount;
    isUnlimited;

    moduleName = 'SubscriptionDashboard';

    get organisationId() {
        return this.recordId;
    }

    getAwsFormattedDate() {
    const today = new Date();

    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();

    // year/month/day/dd-mm-yyyy
    return `${year}/${month}/${day}/${day}-${month}-${year}`;
}

    connectedCallback() {
        /* if (!this.recordId) {
            console.warn('No organisationId found');
            return;
        } */

        this.loadAgreementAccess();
        this.loadAgreements();
        this.initializeUploadConfig();
        this.loadBillingHistory();
        this.loadStorageFromAWS();
    }

    @wire(getStats)
    wiredStats(result) {
        this.wiredResult = result;
        const { data, error } = result;
        if (data) {
            console.log('Stats data received:', data);
            this.prepareStats(data);
            this.preparePlan(data);
            //this.loadAgreements();
        } else if (error) {
            console.error('Error loading stats:', error);
            this.stats = this.getFallbackStats();
            this.plan = this.getFallbackPlan();
            //this.agreements = [];
        }
    }

    initializeUploadConfig() {
        console.log('🔹 Initializing upload config for module:', this.moduleName);

        getUploadConfig({ moduleName: this.moduleName })
            .then(config => {
                console.log('✅ Metadata fetched:', JSON.stringify(config));

                if (!config) {
                    throw new Error('Upload config missing');
                }

                // Assign config values
                this.acceptedFormats = config.formats;
                this.maxFileSize = config.maxSizeBytes;
                this.allowMultiple = config.allowMultiple;
                this.maxFileCount = config.maxFileCount;
                this.isUnlimited = config.isUnlimited;

                if (this.isUnlimited) {
                    console.log('♾️ Unlimited file size enabled');
                    this.maxFileSize = null;
                }

                // 🔥 Resolve base path (merged logic)
                const template = config.basePathTemplate;

                const context = {
                    organisationId: this.organisationId, // using your getter
                    date: this.getAwsFormattedDate(),       // using your method
                    module: this.moduleName.toLowerCase()
                };

                console.log('📌 Base Path Template:', template);
                console.log('📌 Context Values:', JSON.stringify(context));

                let resolvedPath = template.replace(/{(.*?)}/g, (match, key) => {
                    if (!context[key]) {
                        console.error(` Missing value for placeholder: ${key}`);
                        throw new Error(`Missing value for ${key}`);
                    }
                    return context[key];
                });

                // Normalize slashes
                resolvedPath = resolvedPath
                    .replace(/\/+/g, '/')
                    .replace(/\/$/, '');

                this.basePath = resolvedPath;

                console.log('🚀 Final basePath:', this.basePath);

            })
            .catch(error => {
                console.error('❌ Error loading upload config:', error);
            });
    }

    handleUploadSuccess(event) {
    const data = event.detail;

    console.log('📥 Upload result:', data);

    // ✅ Merge key + URL
    this.uploadedFiles = data.files.map((file, index) => {
        return {
            key: file.key,
            url: data.fileUrls[index]
        };
    });

    console.log('✅ Final uploadedFiles:', JSON.stringify(this.uploadedFiles));

    this.showToast('Success', `${data.succeeded} file(s) uploaded`, 'success');
}
    

    
    prepareStats(data) {
    // 🔥 Detect plan
    const planType = data.planType ? data.planType : 'Enterprise';
    this.isStartPlan = planType === 'Start';

    const staffUsed = data.staffUsed || 0;
    const staffTotal = data.staffTotal;
    const participantsUsed = data.participantsUsed || 0;
    const participantsTotal = data.participantsTotal;
    const facilityUsed = data.facilityUsed || 0;
    const facilityTotal = data.facilityTotal;
    const storageUsed = this.storageUsedAWS || 0;
    const storageLimit = this.storageLimitAWS || 1;
    let daysRemaining = data.daysRemaining || 0;
    let totalDays = data.totalDays || 1;

    // 🔥 Percent calculation (only for Start plan)
    const staffPercent = this.isStartPlan ? this.calcPercent(staffUsed, staffTotal) : 0;
    const participantPercent = this.isStartPlan ? this.calcPercent(participantsUsed, participantsTotal) : 0;
    const facilityPercent = this.isStartPlan ? this.calcPercent(facilityUsed, facilityTotal) : 0;

    const storagePercent = this.calcPercent(storageUsed, storageLimit);
    let daysPercent = this.calcPercent(daysRemaining, totalDays);
    let daysVariant = daysPercent < 10 ? 'error' : 'base';

    this.stats = [
        // 🔹 STAFF
        {
            label: this.isStartPlan ? 'Staff Usage' : 'Staff Count',
            value: this.isStartPlan
                ? `${staffUsed}/${staffTotal}`
                : `${staffUsed}`,
            percent: staffPercent,
            subText: this.isStartPlan ? `${staffPercent}% Used` : '',
            progressVariant: 'base'
        },

        // 🔹 PARTICIPANTS
        {
            label: this.isStartPlan ? 'Participant Usage' : 'Participant Count',
            value: this.isStartPlan
                ? `${participantsUsed}/${participantsTotal}`
                : `${participantsUsed}`,
            percent: participantPercent,
            subText: this.isStartPlan ? `${participantPercent}% Used` : '',
            progressVariant: 'base'
        },

        // 🔹 FACILITIES
        {
            label: this.isStartPlan ? 'Facility Usage' : 'Facility Count',
            value: this.isStartPlan
                ? `${facilityUsed}/${facilityTotal}`
                : `${facilityUsed}`,
            percent: facilityPercent,
            subText: this.isStartPlan ? `${facilityPercent}% Used` : '',
            progressVariant: 'base'
        },

        // 🔹 STORAGE (always visible)
        {
            label: 'Storage',
            value: `${storageUsed.toFixed(1)}GB/${storageLimit}GB`,
            percent: storagePercent,
            subText: `${Math.round(storagePercent)}% Used`,
            progressVariant: 'base'
        },

        // 🔹 DAYS (always visible)
        {
            label: 'Days Remaining',
            value: `${daysRemaining} Days`,
            percent: daysPercent,
            subText: `${daysPercent}% Remaining`,
            progressVariant: daysVariant
        }
    ];
}


    preparePlan(data) {
    this.plan = {
        planType: data.planType,
        setupFee: data.setupFee || 1500,
        billingType: data.billingType || 'Annual (prepaid)',
        startDate: this.formatDate(data.startDate),
        endDate: this.formatDate(data.endDate)
    };

    this.paymentDetails = {
        accountName: data.accountName || '',
        accountNumber: data.accountNumber || '',
        reference: data.reference || '',
        date: data.paymentDate || null
    };
}

    calcPercent(val, total) {
        if (!total || total === 0) return 0;
        let p = (val / total) * 100;
        return Math.round(Math.min(100, Math.max(0, p)));
    }

    formatDate(d) {
        return d ? new Date(d).toLocaleDateString('en-GB') : '';
    }

    getFallbackStats() {
        let daysPercent = 5;
        let daysVariant = daysPercent < 10 ? 'error' : 'base';
        return [
            { label: 'Staff Usage', value: '9/15', percent: 60, subText: '60% Used', progressVariant: 'base' },
            { label: 'Participants', value: '18/40', percent: 45, subText: '45% Used', progressVariant: 'base' },
            { label: 'Facilities', value: '0/5', percent: 0, subText: '0% Used', progressVariant: 'base' },
            { label: 'Storage', value: '0GB/10GB', percent: 0, subText: '0% Used', progressVariant: 'base' },
            { label: 'Days Remaining', value: '18 Days', percent: daysPercent, subText: `${daysPercent}% Remaining`, progressVariant: daysVariant }
        ];
    }

    getFallbackPlan() {
    return {
        planType: 'Enterprise',
        setupFee: null,
        billingType: null,
        startDate: null,
        endDate: null
    };
    }

    /* async loadAgreements() {
    try {
        const result = await getAgreements({
                organisationId: this.recordId
            });

        this.agreements = result.map(ag => {
            let fileUrl = '';

            if (ag.Billing_Agreement_Attachments__r?.length) {
                fileUrl = ag.Billing_Agreement_Attachments__r[0].AWS_URL__c;
            }

            return {
                id: ag.Id,
                name: ag.Name,
                fileUrl: fileUrl
            };
        });

    } catch (err) {
        console.error('Error loading agreements:', err);
        this.agreements = [];
    }
} */

async loadAgreements() {
    if (!this.recordId) return;

    try {
        const result = await getAgreements({ organisationId: this.recordId }) || [];

        this.agreements = result.map(ag => ({
            id: ag?.Id,
            name: ag?.Name || '',
            fileUrl: ag?.Billing_Agreement_Attachments__r?.[0]?.AWS_URL__c || ''
        }));

    } catch (err) {
        console.error('Error loading agreements:', err);
        this.agreements = [];
    }
}

    // ==================== MODAL: Add + ====================
    /*handleAddClick() {
        this.isModalOpen = true;
        this.agreementNameValue = '';
        this.uploadedFiles = [];
        this.isFileExpand = false;
        this.recordIdForFileUpload = '';
    }*/

    /*handleCloseModal() {
        this.isModalOpen = false;
        this.isFileExpand = false;
        this.uploadedFiles = [];
    }*/

    /*handleAgreementNameChange(event) {
        this.agreementNameValue = event.target.value;
    }*/

   /* handleSaveAgreement() {
        const name = this.agreementNameValue.trim();
        if (!name) {
            this.showToast('Error', 'Agreement name is required', 'error');
            return;
        }
        if (!this.uploadedFiles.length) {
            this.showToast('Error', 'Please upload at least one file', 'error');
            return;
        }

        this.showSpinner = true;

        upsertAgreement({ agreementId: null, name: name, description: '' })
            .then(agreementId => {
                this.recordIdForFileUpload = agreementId;
                return attachAgreementFiles({
                    agreementId: agreementId,
                    awsJson: JSON.stringify(this.uploadedFiles),
                    attachmentId: ''
                });
            })
            .then(() => {
                this.showToast('Success', 'Service agreement saved', 'success');
                this.loadAgreements();
                this.handleCloseModal();
            })
            .catch(error => {
                console.error('Save error:', error);
                let msg = error.body?.message || 'Save failed';
                this.showToast('Error', msg, 'error');
            })
            .finally(() => {
                this.showSpinner = false;
            });
    }*/

    // ==================== MODAL: Global Upload ====================
   /* handleOpenUploadModal() {
        this.uploadForm = {
            invoiceNumber: '',
            description: '',
            amount: '',
            status: 'Paid'
        };
        this.uploadedFiles = [];
        this.isFileExpand = false;
        this.recordIdForFileUpload = '';
        this.isUploadModalOpen = true;
    }

    handleCloseUploadModal() {
        this.isUploadModalOpen = false;
        this.isFileExpand = false;
        this.uploadedFiles = [];
    }

    handleUploadFormChange(event) {
        const field = event.currentTarget.dataset.field;
        this.uploadForm[field] = event.target.value;
    }

    handleSaveUpload() {
        if (!this.uploadForm.invoiceNumber || !this.uploadForm.description || !this.uploadForm.amount) {
            this.showToast('Error', 'Please fill all invoice fields', 'error');
            return;
        }
        if (!this.uploadedFiles.length) {
            this.showToast('Error', 'Please upload at least one file', 'error');
            return;
        }

        this.isUploading = true;
        const agreementName = `${this.uploadForm.invoiceNumber} - ${this.uploadForm.description}`;

        upsertAgreement({ agreementId: null, name: agreementName, description: '' })
            .then(agreementId => {
                this.recordIdForFileUpload = agreementId;
                return attachAgreementFiles({
                    agreementId: agreementId,
                    awsJson: JSON.stringify(this.uploadedFiles),
                    attachmentId: ''
                });
            })
            .then(() => {
                const newBilling = {
                    id: String(this.billingData.length + 1),
                    invoice: this.uploadForm.invoiceNumber,
                    description: this.uploadForm.description,
                    amount: this.uploadForm.amount,
                    status: this.uploadForm.status,
                    date: new Date().toLocaleDateString('en-GB'),
                    statusClass: this.uploadForm.status === 'Paid' ? 'status-paid' : 'status-generated'
                };
                this.billingData = [...this.billingData, newBilling];
                this.showToast('Success', 'Uploaded and saved', 'success');
                this.loadAgreements();
                this.handleCloseUploadModal();
            })
            .catch(error => {
                console.error('Upload error:', error);
                let msg = error.body?.message || 'Upload failed';
                this.showToast('Error', msg, 'error');
            })
            .finally(() => {
                this.isUploading = false;
            });
    }*/

    // ==================== Drag & drop handlers ====================
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
    }

    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        let files = Array.from(event.dataTransfer.files);
        this.processFiles(files);
    }

    triggerFileInput(event) {
        const dropZone = event.currentTarget.closest('.drag-drop');
        const fileInput = dropZone.querySelector('.hidden-file-input');
        if (fileInput) {
            fileInput.click();
        }
    }

    handleFileUploadInputChange(event) {
        let files = Array.from(event.target.files);
        this.processFiles(files);
        event.target.value = '';
    }

   async processFiles(files) {
    if (!files.length) return;

    const MAX = 50 * 1024 * 1024;
    let existingSize = 0;
    let incomingSize = files.reduce((s, f) => s + f.size, 0);

    if (existingSize + incomingSize > MAX) {
        this.showToast('Error', 'Total file size cannot exceed 50 MB.', 'error');
        return;
    }

    let results = [];

    for (let file of files) {

    // 🔥 ADD THIS VALIDATION
    if (file.name.length > 40) {
        this.showToast('Error', 'File name too long (max 40 chars)', 'error');
        return;
    }

    results.push({
    file: file,
    originalName: file.name,
    size: file.size,
    progress: 0,
    status: 'pending'
});
}

    this.uploadedFiles = results;
}
    async uploadFileToAPI(file) {

    const apiUrl = `${TESSERACT_DOMAIN}/batch/storage`;

    const formData = new FormData();
   
    console.log('ORG ID SENT:', this.Picklist_Value);
    formData.append('file', file); 
    formData.append('env', GEO_ENV);
    formData.append('organisationIds', this.recordId + '/'); 
    for (let pair of formData.entries()) {
        console.log('FORMDATA →', pair[0], pair[1]);
    }

    const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData
    });

    const text = await response.text(); // 👈 important for debugging

    console.log('RAW RESPONSE:', text);

    if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
    }

    const result = JSON.parse(text);

    const url = result.fileUrl || result.url;

    if (!url) {
        throw new Error('Invalid API response');
    }

    return {
        url,
        originalName: file.name,
        size: file.size,
        key: result.key || ''
    };
}

convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

    
    // Child component events
    handleAwsUploadComplete(event) {
        this.uploadedFiles = event.detail.files || [];
    }

    handleFileDeleted(event) {
        this.uploadedFiles = this.uploadedFiles.filter(f => f.fileId !== event.detail.fileId);
    }

    handleFileCancel() {
        //this.uploadedFiles = [];
        this.isFileExpand = false;
    }

    // ==================== Agreement Actions ====================
    handleDownloadAgreement(event) {
    const url = event.currentTarget.dataset.url;
    this.openPreview(url);
}

    handleViewAgreement(event) {
    const url = event.currentTarget.dataset.url;
    this.openPreview(url);
}


openPreview(url) {
    if (!url) {
        this.showToast('Info', 'No file available', 'info');
        return;
    }

    this.previewUrl = url + '#toolbar=1&navpanes=0&zoom=page-width';
    this.isPreviewOpen = true;
}

    handleEditAgreement(event) {
    const id = event.currentTarget.dataset.id;

    const agreement = this.agreements.find(a => a.id === id);

    this.currentAgreementId = id;
    this.agreementNameValue = agreement.name;

    this.isModalOpen = true;
}

async handleSaveAgreement() {
    try {
        this.showSpinner = true;

        const agreementId = await upsertAgreement({
            agreementId: this.currentAgreementId || null,
            name: this.agreementNameValue,
            organisationId: this.recordId
        });

        // 🔥 Only attach if files exist
        if (this.uploadedFiles.length) {
            await attachAgreementFiles({
                agreementId: agreementId,
                awsJson: JSON.stringify(this.uploadedFiles)
            });
        }

        // ✅ SUCCESS ONLY AFTER EVERYTHING WORKS
        this.showToast('Success', 'Agreement saved successfully', 'success');

        this.resetModal();
        await this.loadAgreements();

    } catch (error) {
        console.error('SAVE ERROR:', JSON.stringify(error));

        this.showToast(
            'Error',
            error.body?.message || error.message || 'Error saving agreement',
            'error'
        );

    } finally {
        this.showSpinner = false;
    }
}

handleDeleteAgreement(event) {
    const id = event.currentTarget.dataset.id;

    if (confirm('Are you sure you want to delete this agreement?')) {
        this.deleteAgreementRecord(id);
    }
}


async deleteAgreementRecord(id) {
    try {
        await deleteAgreement({ agreementId: id });

        this.showToast('Success', 'Agreement deleted', 'success');
        await this.loadAgreements();

    } catch (error) {
        console.error('DELETE ERROR FULL:', JSON.stringify(error));

        this.showToast(
            'Error',
            error.body?.message || error.message || 'Delete failed',
            'error'
        );
    }
}


   handleViewInvoice(event) {
    const url = event.currentTarget.dataset.url;
    this.openPreview(url);
}

    handleExportAll() {
        let csvContent = "Invoice Number,Description,Amount,Status,Date\n";
        this.billingData.forEach(item => {
            csvContent += `${item.invoice},${item.description},${item.amount},${item.status},${item.date}\n`;
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'billing_history.csv';
        link.click();
        URL.revokeObjectURL(link.href);
        this.showToast('Export', 'Exported all billing history as CSV', 'success');
    }

    // ==================== Horizontal scroll for Service Agreements ====================
    scrollAgreementsLeft() {
        const container = this.template.querySelector('.agreements-scroll-container');
        if (container) {
            container.scrollBy({ left: -250, behavior: 'smooth' });
        }
    }

    scrollAgreementsRight() {
        const container = this.template.querySelector('.agreements-scroll-container');
        if (container) {
            container.scrollBy({ left: 250, behavior: 'smooth' });
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    refreshData() {
        if (this.wiredResult) {
            refreshApex(this.wiredResult);
        }
    }

   handleAddClick() {
    this.isModalOpen = true;
    this.agreementNameValue = '';
}

handleCloseModal() {
    this.resetModal();
}

handleAgreementNameChange(event) {
    this.agreementNameValue = event.target.value;
}


resetModal() {
    this.isModalOpen = false;
    this.agreementNameValue = '';
    this.uploadedFiles = [];
    this.currentAgreementId = null;
}

    //ADD AGREEMENT RESTRICTION



async loadAgreementAccess() {
    if (!this.recordId) return;

    try {
        const result = await canAddAgreement({ organisationId: this.recordId });
        this.allowAddAgreement = !!result;
    } catch (error) {
        console.error('Error fetching agreement access:', error);
        this.allowAddAgreement = false;
    }
}



async loadBillingHistory() {
    console.log('📥 loadBillingHistory: START');

    try {
        const result = await getAllInvoicesForOrganisation() || [];
        console.log('📦 Raw API result:', JSON.parse(JSON.stringify(result)));

        this.billingData = result.map((item, index) => {
            console.log(`🔄 Processing record #${index + 1}`, item);

            const entries = item?.Accounting_Journal_Entry__r || [];
            console.log('   ↳ Journal Entries:', entries);

            const descList = entries
                .map(j => j?.Description__c)
                .filter(Boolean);

            console.log('   ↳ Description List:', descList);

            const mappedItem = {
                id: item?.Id,
                invoice: item?.Name || '',
                description: descList[0] || '',
                allDescriptions: descList.join(', '),
                amount: item?.Total_Amount__c || 0,
                status: item?.Status__c || '',
                date: item?.Invoice_Date__c
                    ? new Date(item.Invoice_Date__c).toLocaleDateString('en-GB')
                    : '',
                fileUrl: item?.Amazon_URL__c || '',
                statusClass:
                    item?.Status__c === 'Paid'
                        ? 'status-paid'
                        : item?.Status__c === 'Generated'
                        ? 'status-generated'
                        : 'status-error'
            };

            console.log('   ✅ Mapped Item:', mappedItem);
            return mappedItem;
        });

        console.log('📊 Final billingData:', this.billingData);

        // Assign data
        this.billingFilteredData = [...this.billingData];
        this.billingDisplayData = [...this.billingFilteredData];

        console.log('📄 billingFilteredData:', this.billingFilteredData);
        console.log('📄 billingDisplayData (before pagination):', this.billingDisplayData);

        // Pagination reset
        this.billingPageNumber = 1;
        console.log('🔢 Reset billingPageNumber to:', this.billingPageNumber);

        this.billingPaginationHelper();

        console.log('📄 billingDisplayData (after pagination):', this.billingDisplayData);
        console.log('📚 Total Records:', this.billingTotalRecords);
        console.log('📑 Total Pages:', this.billingTotalPages);

        console.log('✅ loadBillingHistory: SUCCESS');

    } catch (error) {
        console.error('❌ Error loading billing history:', error);

        this.billingData = [];
        this.billingDisplayData = [];
    }

    console.log('📤 loadBillingHistory: END');
}



billingPaginationHelper() {
    const data = this.billingFilteredData || [];

    this.billingTotalRecords = data.length;
    this.billingTotalPages = Math.ceil(this.billingTotalRecords / this.billingPageSize);

    const start = (this.billingPageNumber - 1) * this.billingPageSize;
    const end = this.billingPageNumber * this.billingPageSize;

    this.billingDisplayData = data.slice(start, end);

    this.billingPaginationVisible = this.billingTotalRecords > this.billingPageSize;
}



nextBillingPage() {
    if (this.billingPageNumber < this.billingTotalPages) {
        this.billingPageNumber++;
        this.billingPaginationHelper();
    }
}

previousBillingPage() {
    if (this.billingPageNumber > 1) {
        this.billingPageNumber--;
        this.billingPaginationHelper();
    }
}

firstBillingPage() {
    this.billingPageNumber = 1;
    this.billingPaginationHelper();
}

lastBillingPage() {
    this.billingPageNumber = this.billingTotalPages;
    this.billingPaginationHelper();
}

handleBillingPageSize(event) {
    this.billingPageSize = parseInt(event.target.value, 10);
    this.billingPageNumber = 1;
    this.billingPaginationHelper();
}

  //==================== Storage Logic =====================
async loadStorageFromAWS() {
    try {
        const data = await getStorageUsage({
                        organisationId: this.recordId
                    });

        console.log('🔥 AWS STORAGE:', JSON.stringify(data));

        this.storageUsedAWS = data.used / (1024 * 1024 * 1024); // GB
        this.storageLimitAWS = data.limit / (1024 * 1024 * 1024); // GB
        if (this.wiredResult?.data) {
            this.prepareStats(this.wiredResult.data);
        }

    } catch (error) {
        console.error('❌ Storage API error:', error);
    }
}


    // ==================== Getters ====================
    get planTypeDisplay() {
        return this.plan.planType || '-';
    }

    get setupFeeDisplay() {
    return Number(this.plan.setupFee || 0).toFixed(2);
    }

    get billingTypeDisplay() {
        return this.plan.billingType || '-';
    }

    get startDateDisplay() {
        return this.plan.startDate || '-';
    }

    get contractPeriod() {
        if (!this.plan.startDate || !this.plan.endDate) return '-';
        return `${this.plan.startDate} - ${this.plan.endDate}`;
    }

    get paymentDateDisplay() {
    return this.paymentDetails.date
        ? new Date(this.paymentDetails.date).toLocaleDateString('en-GB')
        : '-';
        }
}