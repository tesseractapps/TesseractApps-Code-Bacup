import { LightningElement, track, api } from 'lwc';
import getDocumentRecords from '@salesforce/apex/TSignDocumentController.getDocumentRecords';
import TeSignLogo from '@salesforce/resourceUrl/Te_sign';
import updateComments from '@salesforce/apex/TSignDocumentController.updateComments';
import Send_Icon from '@salesforce/resourceUrl/Send_Icon';
import getComments from '@salesforce/apex/TSignDocumentController.getComments';
import getDocPages from '@salesforce/apex/tSignDocApiController.getPages';
import getDocDownloadUrl from '@salesforce/apex/tSignDocApiController.getDownloadUrl';
import getDownloadUrlVariant from '@salesforce/apex/tSignDocApiController.getDownloadUrlVariant';
import { docApiTarget, fetchDocPages, fetchDownloadUrl, downloadFile, safeFileName, stripQuery, getVariantFileName } from 'c/tSignDocApiUtils';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';
import getTemplates from '@salesforce/apex/TSignDocumentController.getTemplates';
import createTemplate from '@salesforce/apex/TSignDocumentController.createTemplate';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import PARTICIPANT_TEMPLATE_OBJECT from '@salesforce/schema/TSign_Participant_Template__c';
import DOCUMENT_TYPE_FIELD from '@salesforce/schema/TSign_Participant_Template__c.Document_Type__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import updateTemplate from '@salesforce/apex/TSignDocumentController.updateTemplate';
// import deleteTemplate from '@salesforce/apex/TSignDocumentController.deleteTemplate';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';


import { wire } from 'lwc';


export default class tsignAppDocs extends LightningElement {
    @track draftDocuments = [];
    @track inProgressDocuments = [];
    @track processedDocuments = [];
    @track allDocuments = [];
    @track selectedStatus = '';
    @track sortOrder = 'desc';
    @track showPdfViewer = false;
    @track pdfUrl = '';
    @track error = '';
    @track isLoading = false;
    @track showChatterModal = false;
    @track messages = [];
    @track displayedDocuments = [];
    @track currentRecordId = null;
    @track selectedRecordId = '';
    @track newMessage = '';
    logo = TeSignLogo;
    isDraftVisible = false;
    isInProgressVisible = false;
    isProcessedVisible = false;
    isAllDocumentsVisible = false;
    userEmail = 'user@example.com';
    @track sendIcon = Send_Icon;
    @track replyToMessage = null;
    @track pageSize = 10; // Default records per page
    @track totalRecords = 0;
    @track totalPages = 0;
    @track pageNumber = 1;
    @track pageSizeOptions = [10, 20, 50];
    @api orgid;
    @track isTemplateModalOpen = false;
    @track isTemplateAddModalOpen = false;
    @track templateName = '';
    @track templateDocumentType = '';
    @track templateFile = null;
    @track templateList = [];
    @track documentTypeOptions = [];
    @track isEditingTemplate = false;
    @track editingTemplateId = null;
    @track selectedTemplateName = '';
    @track selectedDocumentType = '';




    // Pagination control states
    get bDisableFirst() { return this.pageNumber === 1; }
    get bDisableLast() { return this.pageNumber === this.totalPages || this.totalPages === 0; }
    get selectedTableTitle() {
        switch (this.selectedStatus) {
            case 'draft': return 'Draft Documents';
            case 'inProgress': return 'In Progress Documents';
            case 'processed': return 'Processed Documents';
            case 'all': return 'All Documents';
            default: return '';
        }
    }
    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;

    get logoUrl() {
        return this.tLogoUrl;
    }

    get imageUrl() {
        return this.tImageUrl;
    }


    // Columns for the datatable
    columns = [
        { label: 'File Name', fieldName: 'FileName', type: 'text' },
        {
            label: 'Created Date',
            fieldName: 'FormattedCreatedDate',
            type: 'date',
            typeAttributes: {
                year: "numeric",
                month: "short",
                day: "2-digit"
            }
        },
        { label: 'First Recipient', fieldName: 'FirstRecipient', type: 'text' },
        { label: 'Status', fieldName: 'Status', type: 'text' },

        {
            label: 'View',
            type: 'button-icon',
            typeAttributes: {
                iconName: 'utility:preview',
                name: 'view',
                title: 'View PDF',
                variant: 'border-filled',
                alternativeText: 'View PDF',
                disabled: { fieldName: 'disableViewIcon' }
            },
            cellAttributes: {
                alignment: 'center',

            }
        },
        {
            label: 'Comments',
            type: 'button',
            typeAttributes: {
                label: 'View Comments',
                name: 'comments',
                title: 'View Comments',
                variant: 'neutral'
            },
            cellAttributes: {
                alignment: 'center'
            }
        }
    ];

    @wire(getObjectInfo, { objectApiName: PARTICIPANT_TEMPLATE_OBJECT })
    objectInfo;

    // Get picklist values based on recordTypeId
    @wire(getPicklistValues, {
        recordTypeId: '$objectInfo.data.defaultRecordTypeId',
        fieldApiName: DOCUMENT_TYPE_FIELD
    })
    picklistValues({ data, error }) {
        if (data) {
            this.documentTypeOptions = data.values.map(val => ({
                label: val.label,
                value: val.value
            }));
        } else if (error) {
            console.error('❌ Error loading picklist values:', error);
        }
    }

    wiredTemplatesResult; // track the wire result

    @wire(getTemplates, { orgId: '$orgid' })
    wiredTemplates(result) {
        console.log('📡 @wire(getTemplates) called');
        this.wiredTemplatesResult = result;

        const { data, error } = result;

        if (data) {
            console.log('✅ Templates fetched successfully:', data);

            this.templateList = data.map(t => {
                const mapped = {
                    id: t.Id,
                    name: t.Document_Name__c,
                    documentType: t.Document_Type__c,
                    AWS_Document__c: t.AWS_Document__c
                };
                console.log('📝 Mapped Template Record:', mapped);
                return mapped;
            });

            console.log('📄 Final templateList:', this.templateList);

        } else if (error) {
            console.error('❌ Error fetching templates via wire:', error);
        }
    }


    connectedCallback() {
        console.log('TeSignLogo URL:', this.logo);
        console.log('📌 Received Org ID:', this.orgid);
        this.fetchDocumentRecords();
        // Reload when the facility is changed in the dashboard dropdown
        this._onFacilityChange = async () => {
            await this.fetchDocumentRecords();
            this.handleStatusChange({ target: { value: this.selectedStatus || 'all' } });
        };
        window.addEventListener('tsignfacilitychange', this._onFacilityChange);
        //this.startPolling();
        setTimeout(() => {
            this.handleStatusChange({ target: { value: 'all' } });
        }, 1500);
    }

    disconnectedCallback() {
        this.stopPolling(); // Stop polling when the component is unloaded
        window.removeEventListener('tsignfacilitychange', this._onFacilityChange);
        this._disconnectViewerObserver();
        this._removeKeyHandler();
        this.template.host?.classList?.remove('doc-viewer-open');
    }


    //manendra commented this method  and add the below updated method to handle facility 
    // async fetchDocumentRecords() {
    //     try {
    //         console.log('📌 Fetching documents for Org ID:', this.orgid);

    //         if (!this.orgid) {
    //             console.warn('⚠️ Org ID is undefined, skipping fetch.');
    //             return;
    //         }

    //         const data = await getDocumentRecords({ orgId: this.orgid });
    //         console.log('📌 Received Data:', data);
    //         this.allDocuments = data.map(doc => {
    //             // Saved name (All_Recipient_Names__c), else the part before '@'
    //             const statusStr = (doc.CurrentRecipientName || (doc.Current_Recipient ? doc.Current_Recipient.split('@')[0] : '')) + ' - ' + (doc.Status || 'Pending');
    //             let statusPillClass = 'status-pill ';
    //             if ((doc.Status || '').toLowerCase() === 'completed') {
    //                 statusPillClass += 'status-pill-completed';
    //             } else if ((doc.Status || '').toLowerCase() === 'draft') {
    //                 statusPillClass += 'status-pill-draft';
    //             } else {
    //                 statusPillClass += 'status-pill-pending';
    //             }
    //             return {
    //                 ...doc,
    //                 CreatedDate: new Date(doc.CreatedDate),
    //                 FormattedCreatedDate: new Intl.DateTimeFormat('en-GB', {
    //                     day: '2-digit',
    //                     month: '2-digit',
    //                     year: 'numeric'
    //                 }).format(new Date(doc.CreatedDate)),
    //                 RawStatus: doc.Status || 'Draft', 
    //                 disableViewIcon: doc.Status !== 'Completed',
    //                 showViewIcon: doc.Status === 'Completed',
    //                 AllRecipients: (doc.AllRecipientNames || doc.AllRecipients)?.split('\n').join('<br/>') || '—',
    //                 Status: statusStr,
    //                 statusPillClass: statusPillClass
    //             };
    //         });

    //         this.draftDocuments = this.allDocuments.filter(doc => doc.RawStatus === 'Draft');
    //         this.inProgressDocuments = this.allDocuments.filter(doc => doc.RawStatus === 'Pending');
    //         this.processedDocuments = this.allDocuments.filter(doc => doc.RawStatus === 'Completed');

    //     } catch (error) {
    //         console.error('❌ Error fetching document records:', error);
    //     }
    // }    

    async fetchDocumentRecords() {
        try {
            console.log('📌 Fetching documents for Org ID:', this.orgid);

            if (!this.orgid) {
                console.warn('⚠️ Org ID is undefined, skipping fetch.');
                return;
            }

            // Facility selected in the dashboard dropdown
            const facilityId = localStorage.getItem("defaultFacilityId");
            console.log('📌 Fetching documents for Facility ID:', facilityId);

            const data = await getDocumentRecords({ orgId: this.orgid, facilityId: facilityId });
            console.log('📌 Received Data:', data);
            this.allDocuments = data.map(doc => {
                // Saved name (All_Recipient_Names__c), else the part before '@'
                const statusStr = (doc.CurrentRecipientName || (doc.Current_Recipient ? doc.Current_Recipient.split('@')[0] : '')) + ' - ' + (doc.Status || 'Pending');
                let statusPillClass = 'status-pill ';
                if ((doc.Status || '').toLowerCase() === 'completed') {
                    statusPillClass += 'status-pill-completed';
                } else if ((doc.Status || '').toLowerCase() === 'draft') {
                    statusPillClass += 'status-pill-draft';
                } else {
                    statusPillClass += 'status-pill-pending';
                }
                return {
                    ...doc,
                    CreatedDate: new Date(doc.CreatedDate),
                    FormattedCreatedDate: new Intl.DateTimeFormat('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    }).format(new Date(doc.CreatedDate)),
                    RawStatus: doc.Status || 'Draft',
                    disableViewIcon: doc.Status !== 'Completed',
                    showViewIcon: doc.Status === 'Completed',
                    AllRecipients: (doc.AllRecipientNames || doc.AllRecipients)?.split('\n').join('<br/>') || '—',
                    RecipientsTooltip: this.buildRecipientsTooltip(doc.AllRecipientNames, doc.AllRecipients),
                    Status: statusStr,
                    statusPillClass: statusPillClass
                };
            });

            this.draftDocuments = this.allDocuments.filter(doc => doc.RawStatus === 'Draft');
            this.inProgressDocuments = this.allDocuments.filter(doc => doc.RawStatus === 'Pending');
            this.processedDocuments = this.allDocuments.filter(doc => doc.RawStatus === 'Completed');

        } catch (error) {
            console.error('❌ Error fetching document records:', error);
        }
    }


    // Tooltip "Name - email" per recipient (names and emails are line-aligned from Apex)
    buildRecipientsTooltip(names, emails) {
        if (!emails) return '';
        const nameList = (names || '').replace(/\r/g, '').split('\n');
        const parts = [];
        emails.replace(/\r/g, '').split('\n').forEach((rawEmail, i) => {
            const email = (rawEmail || '').trim();
            if (!email) return;
            const name = (nameList[i] || '').trim();
            parts.push(name && name.toLowerCase() !== email.toLowerCase() ? `${name} - ${email}` : email);
        });
        return parts.join(', ');
    }

    get isDraftView() {
        return this.selectedStatus === 'draft';
    }

    get isInProgressView() {
        return this.selectedStatus === 'inProgress';
    }



    // Sorting handler
    handleSortOrderChange(event) {
        this.sortOrder = event.target.value;
        this.pageNumber = 1;
        this.updateDisplayedRecords();
    }

    sortDocuments(documents) {
        const isDescending = this.sortOrder === 'desc';
        documents.sort((a, b) => {
            let valA = new Date(a.CreatedDate);
            let valB = new Date(b.CreatedDate);
            return isDescending ? valB - valA : valA - valB;
        });
    }

    // Updated Getters: Now Pass `this.sortOrder`
    get sortedDraftDocuments() {
        return [...this.draftDocuments].sort((a, b) => this.sortComparator(a, b));
    }

    get sortedInProgressDocuments() {
        return [...this.inProgressDocuments].sort((a, b) => this.sortComparator(a, b));
    }

    get sortedProcessedDocuments() {
        return [...this.processedDocuments].sort((a, b) => this.sortComparator(a, b));
    }

    get sortedAllDocuments() {
        return [...this.allDocuments].sort((a, b) => this.sortComparator(a, b));
    }

    // Sorting comparator function
    sortComparator(a, b) {
        if (!this.sortOrder) {
            console.warn('sortOrder is undefined, defaulting to "desc"');
            this.sortOrder = 'desc';
        }

        let valA = new Date(a.CreatedDate);
        let valB = new Date(b.CreatedDate);

        return this.sortOrder === 'desc' ? valB - valA : valA - valB;
    }

    // Handle status change (to show the right table)
    handleStatusChange(event) {
        const selected = event.target.value;
        console.log(`📌 Status changed to: ${selected}`);
        this.selectedStatus = selected;
        this.pageNumber = 1;
        this.updateDisplayedRecords();
    }

    updateDisplayedRecords() {
        console.log(`🔄 Updating records for status: ${this.selectedStatus}`);
        let filteredData = [];

        if (this.selectedStatus === 'Draft') {
            filteredData = this.allDocuments.filter(doc => doc.RawStatus === 'Draft');
            console.log(`📄 Found ${filteredData.length} draft documents`);
        } else if (this.selectedStatus === 'Pending') {
            filteredData = this.allDocuments.filter(doc => doc.RawStatus === 'Pending');
            console.log(`📄 Found ${filteredData.length} in-progress (Pending) documents`);
        } else if (this.selectedStatus === 'Completed') {
            filteredData = this.allDocuments.filter(doc => doc.RawStatus === 'Completed');
            console.log(`📄 Found ${filteredData.length} completed documents`);
        } else {
            filteredData = [...this.allDocuments];
            console.log(`📄 Showing all documents: ${filteredData.length}`);
        }

        this.totalRecords = filteredData.length;
        console.log(`📊 Total Records: ${this.totalRecords}`);

        this.sortDocuments(filteredData);
        console.log('✅ Documents sorted');

        this.paginateRecords(filteredData);
        console.log('✅ Pagination applied');
    }


    // Pagination Logic
    handleRecordsPerPage(event) {
        this.pageSize = parseInt(event.target.value, 10);
        this.pageNumber = 1;

        let records = this.getCurrentDataArray();
        this.sortDocuments(records);
        this.paginateRecords(records);
    }


    paginateRecords(records) {
        // Ensure the records are sorted before paginating
        this.sortDocuments(records);

        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        let startIdx = (this.pageNumber - 1) * this.pageSize;
        let endIdx = startIdx + this.pageSize;

        this.displayedDocuments = records.slice(startIdx, endIdx);
        setTimeout(() => {
            this.displayedDocuments.forEach(doc => {
                const cell = this.template.querySelector(`td[data-id="${doc.Id}"]`);
                if (cell) {
                    cell.innerHTML = doc.AllRecipients;
                }
            });
        }, 0);
    }


    firstPage() {
        this.pageNumber = 1;
        let records = this.getCurrentDataArray();
        this.sortDocuments(records);
        this.paginateRecords(records);
    }

    previousPage() {
        if (this.pageNumber > 1) {
            this.pageNumber--;
            let records = this.getCurrentDataArray();
            this.sortDocuments(records);
            this.paginateRecords(records);
        }
    }

    nextPage() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber++;
            let records = this.getCurrentDataArray();
            this.sortDocuments(records);
            this.paginateRecords(records);
        }
    }

    lastPage() {
        this.pageNumber = this.totalPages;
        let records = this.getCurrentDataArray();
        this.sortDocuments(records);
        this.paginateRecords(records);
    }


    getCurrentDataArray() {
        switch (this.selectedStatus) {

            case 'Draft':
                return this.allDocuments.filter(
                    doc => doc.RawStatus === 'Draft'
                );

            case 'Pending':
                return this.allDocuments.filter(
                    doc => doc.RawStatus === 'Pending'
                );

            case 'Completed':
                return this.allDocuments.filter(
                    doc => doc.RawStatus === 'Completed'
                );

            default:
                return [...this.allDocuments];
        }
    }

    setDisplayedRecords(records) {
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        let startIdx = (this.pageNumber - 1) * this.pageSize;
        let endIdx = startIdx + this.pageSize;
        this.displayedDocuments = records.slice(startIdx, endIdx);
    }


    get filteredColumns() {
        let columnsToUse = [...this.columns];

        if (this.selectedStatus === 'Draft') {

            columnsToUse =
                columnsToUse.filter(
                    col =>
                        col.label !== 'View'
                        &&
                        col.label !== 'Status'
                );

        } else if (
            this.selectedStatus === 'Pending'
        ) {

            columnsToUse =
                columnsToUse.filter(
                    col =>
                        col.label !== 'View'
                );
        }

        return columnsToUse;
    }


    get filteredAllDocuments() {
        return this.allDocuments.map((doc) => {
            // Add a flag to determine if the "View" icon should be shown
            return {
                ...doc,
                showViewIcon: doc.Status === 'Completed', // Only show "View" for Completed documents
            };
        });
    }



    handleCommentView(event) {
        const recordId = event.currentTarget.dataset.id;
        console.log(`View comments for record ID: ${recordId}`);
    }


    // Updated handleRowAction function
    // handleRowAction(event) {
    //     const actionName = event.detail.action.name;
    //     const row = event.detail.row;

    //     if (actionName === 'view' && row.Status === 'Completed') {

    //         const pdfViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
    //             row.SignatureURL
    //         )}&embedded=true`;

    //         window.open(pdfViewerUrl, '_blank');
    //     } else if (actionName === 'comments') {
    //         this.selectedRecordId = row.Id;
    //         this.showChatterModal = true;
    //         this.fetchComments();
    //         this.messages = row.Comments ? this.parseComments(row.Comments) : [];
    //     } else {
    //         console.error('Invalid action:', actionName);
    //         this.error = 'Invalid action selected.';
    //     }
    // }

    // handleRowAction(event) {
    //     // Retrieve action type and record ID from the clicked element
    //     const actionName = event.currentTarget.dataset.action;
    //     const recordId = event.currentTarget.dataset.id;

    //     // Find the selected row using the recordId
    //     const row = this.displayedDocuments.find(doc => doc.Id === recordId);

    //     if (!row) {
    //         console.error('Record not found:', recordId);
    //         return;
    //     }

    //     if (actionName === 'view' && row.Status === 'Completed') {
    //         const pdfViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
    //             row.SignatureURL
    //         )}&embedded=true`;

    //         window.open(pdfViewerUrl, '_blank');
    //     } else if (actionName === 'comments') {
    //         this.selectedRecordId = row.Id;
    //         this.showChatterModal = true;
    //         this.fetchComments();
    //         this.messages = row.Comments ? this.parseComments(row.Comments) : [];
    //     } else {
    //         console.error('Invalid action:', actionName);
    //         this.error = 'Invalid action selected.';
    //     }
    // }




    // Viewer state
    @track isViewerOpen = false;
    @track viewerMode = ''; // 'document' | 'template'
    @track viewerTitle = '';
    @track viewerSubtitle = '';
    @track viewerPages = [];
    @track viewerCurrentPage = 1;
    _viewerTarget = null;
    _viewerRefreshed = false;
    _viewerObserver = null;
    _pageVisibilityMap = new Map();
    _boundKeyHandler = null;

    get mainContainerClass() {
        return this.isViewerOpen ? 'main-container doc-viewer-open' : 'main-container';
    }

    get viewerTotalPages() {
        return this.viewerPages?.length || 0;
    }

    // Download modal state
    @track isDownloadModalOpen = false;
    @track downloadModalSingleOption = false;
    @track isDownloadLoading = false;
    @track downloadingVariant = '';
    _downloadTarget = null;

    get isDownloadingDocument() {
        return this.isDownloadLoading && this.downloadingVariant === 'document';
    }

    get isDownloadingCertificate() {
        return this.isDownloadLoading && this.downloadingVariant === 'certificate';
    }

    get isDownloadingCombined() {
        return this.isDownloadLoading && this.downloadingVariant === 'combined';
    }

    get downloadTargetFileName() {
        return this._downloadTarget?.name || 'document';
    }

    showToast(title, message, variant = 'info') {
        this.dispatchEvent(new ShowToastEvent({
            title,
            message,
            variant
        }));
    }

    async handleRowAction(event) {
        this.isLoading = true;
        const startMs = Date.now();
        const actionName = event.currentTarget.dataset.action;
        const recordId = event.currentTarget.dataset.id;

        try {
            const row = this.displayedDocuments.find(doc => doc.Id === recordId);
            if (!row) {
                console.error('Record not found:', recordId);
                return;
            }

            if (actionName === 'view' && row.RawStatus === 'Completed') {
                const target = docApiTarget(row.SignatureURL);
                if (!target) {
                    this.showToast('Warning', 'Document not available', 'warning');
                    return;
                }
                try {
                    const pages = await fetchDocPages(getDocPages, target);
                    this.viewerMode = 'document';
                    this.viewerTitle = row.FileName || '';
                    this.viewerSubtitle = '';
                    this.viewerPages = pages.map((p, i) => ({ ...p, loading: i < 2 ? 'eager' : 'lazy' }));
                    this.viewerCurrentPage = 1;
                    this._viewerTarget = target;
                    this._viewerRefreshed = false;
                    this.isViewerOpen = true;
                    this.template.host?.classList?.add('doc-viewer-open');
                    this._attachKeyHandler();
                    requestAnimationFrame(() => {
                        const scrollContainer = this.template.querySelector('.doc-viewer-scroll');
                        if (scrollContainer) {
                            scrollContainer.scrollTop = 0;
                        }
                        this._observeViewerPages();
                    });
                    console.log(`[DOC-API] action=view, id=${recordId}, target=${stripQuery(target)}, pages=${pages.length}, duration=${Date.now() - startMs}ms`);
                } catch (err) {
                    console.error('View document error:', err);
                    const serverMsg = String(err?.serverError || err?.message || '').toLowerCase();
                    if (serverMsg.includes('not a pdf')) {
                        this.showToast('Error', "This document can't be previewed.", 'error');
                    } else {
                        this.showToast('Error', 'Failed to load the document preview.', 'error');
                    }
                }
            } else if (actionName === 'download' && row.RawStatus === 'Completed') {
                const target = docApiTarget(row.SignatureURL);
                if (!target) {
                    this.showToast('Warning', 'Document not available', 'warning');
                    return;
                }
                this._downloadTarget = {
                    url: target,
                    name: row.FileName || 'Document.pdf',
                    id: recordId
                };
                this.downloadModalSingleOption = false;
                this.isDownloadModalOpen = true;
            } else if (actionName === 'comments') {
                this.selectedRecordId = row.Id;
                this.showChatterModal = true;
                this.startPolling();
                this.fetchComments();
                this.messages = row.Comments ? this.parseComments(row.Comments) : [];
            } else {
                console.error('Invalid action selected or status mismatch:', actionName);
                this.error = 'Invalid action selected or status mismatch.';
            }
        } catch (err) {
            console.error('Error handling row action:', err);
            this.error = 'An error occurred while processing your request.';
        } finally {
            this.isLoading = false;
        }
    }

    closeViewer() {
        this._disconnectViewerObserver();
        this._removeKeyHandler();
        this.isViewerOpen = false;
        this.template.host?.classList?.remove('doc-viewer-open');
        this.viewerMode = '';
        this.viewerTitle = '';
        this.viewerSubtitle = '';
        this.viewerPages = [];
        this.viewerCurrentPage = 1;
        this._viewerTarget = null;
        this._viewerRefreshed = false;
        this._pageVisibilityMap.clear();
    }

    closePdfViewer() {
        this.closeViewer();
    }

    closeDownloadModal() {
        this.isDownloadModalOpen = false;
        this.downloadModalSingleOption = false;
        this._downloadTarget = null;
        this.isDownloadLoading = false;
        this.downloadingVariant = '';
    }

    async handleDownloadVariant(event) {
        const variant = event?.currentTarget?.dataset?.variant || 'document';
        const target = this._downloadTarget?.url;
        if (!target) {
            this.showToast('Warning', 'Document not available', 'warning');
            this.closeDownloadModal();
            return;
        }

        this.isDownloadLoading = true;
        this.downloadingVariant = variant;
        const tStart = performance.now();
        const docName = this._downloadTarget?.name || 'Document.pdf';
        const fileName = getVariantFileName(docName, variant);

        try {
            const res = await getDownloadUrlVariant({
                keyOrUrl: target,
                variant,
                fileName
            });
            const data = typeof res?.body === 'string' ? JSON.parse(res.body) : res?.body;
            const item = data?.results?.[0] || data;

            if (item?.status === 'error' && item?.error === 'certificate_not_available') {
                if (item?.certificateEmbedded) {
                    this.showToast('Info', 'This document was signed before certificates were stored separately. The certificate is already included in the document.', 'info');
                    this.downloadModalSingleOption = true;
                } else {
                    this.showToast('Warning', 'Certificate not available for this document.', 'warning');
                }
                return;
            }

            if (item?.status === 'error' || (!item?.downloadUrl && !data?.downloadUrl)) {
                throw new Error(item?.error || data?.error || 'Download failed');
            }

            const downloadUrl = item?.downloadUrl || data?.downloadUrl;
            const finalName = item?.fileName || fileName;
            await downloadFile(downloadUrl, finalName);
            const safeTarget = stripQuery(target);
            console.log(`[DOC-API] action=download-variant, variant=${variant}, key=${safeTarget}, duration=${Math.round(performance.now() - tStart)}ms`);
            this.closeDownloadModal();
        } catch (err) {
            console.error('Download variant error:', err);
            this.showToast('Error', err?.message || 'Failed to download the document.', 'error');
        } finally {
            this.isDownloadLoading = false;
            this.downloadingVariant = '';
        }
    }

    _observeViewerPages() {
        this._disconnectViewerObserver();
        this._pageVisibilityMap.clear();
        const scrollContainer = this.template.querySelector('.doc-viewer-scroll');
        const pages = this.template.querySelectorAll('.doc-viewer-page');
        if (!pages.length || typeof IntersectionObserver === 'undefined') {
            return;
        }
        this._viewerObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const pageNum = Number(entry.target.dataset.pageNumber);
                    if (pageNum) {
                        if (entry.isIntersecting) {
                            this._pageVisibilityMap.set(pageNum, entry.intersectionRect.height);
                        } else {
                            this._pageVisibilityMap.delete(pageNum);
                        }
                    }
                });

                let bestPage = null;
                let maxHeight = -1;
                for (const [pNum, height] of this._pageVisibilityMap.entries()) {
                    if (height > maxHeight) {
                        maxHeight = height;
                        bestPage = pNum;
                    }
                }
                if (bestPage && maxHeight > 0) {
                    this.viewerCurrentPage = bestPage;
                }
            },
            {
                root: scrollContainer || null,
                threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
            }
        );
        pages.forEach((p) => this._viewerObserver.observe(p));
    }

    _disconnectViewerObserver() {
        if (this._viewerObserver) {
            this._viewerObserver.disconnect();
            this._viewerObserver = null;
        }
        this._pageVisibilityMap.clear();
    }

    _attachKeyHandler() {
        this._removeKeyHandler();
        this._boundKeyHandler = (e) => {
            if (e.key === 'Escape' || e.key === 'Esc') {
                this.closeViewer();
            }
        };
        window.addEventListener('keydown', this._boundKeyHandler);
    }

    _removeKeyHandler() {
        if (this._boundKeyHandler) {
            window.removeEventListener('keydown', this._boundKeyHandler);
            this._boundKeyHandler = null;
        }
    }

    async handleViewerImageError(event) {
        if (!this._viewerRefreshed && this._viewerTarget) {
            this._viewerRefreshed = true;
            try {
                const refreshedPages = await fetchDocPages(getDocPages, this._viewerTarget, { maxAttempts: 2, delayMs: 1500 });
                const pageMap = new Map(refreshedPages.map(p => [p.pageNumber, p.src]));
                this.viewerPages = this.viewerPages.map(p => ({
                    ...p,
                    src: pageMap.get(p.pageNumber) || p.src
                }));
            } catch (err) {
                console.error('Failed to refresh viewer pages:', err);
                this.showToast('Error', 'Failed to load page image.', 'error');
            }
        }
    }



    //Messaging



    fetchComments() {
        getComments({ recordId: this.selectedRecordId })
            .then((rawComments) => {
                console.log("Raw Comments:", rawComments);
                if (rawComments) {
                    try {
                        // Parse the JSON string into a JavaScript object
                        const parsedComments = JSON.parse(rawComments);

                        // Function to format the timestamp
                        const formatTimestamp = (timestamp) => {
                            const date = new Date(timestamp);
                            const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const formattedDate = date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
                            return `${time}, ${formattedDate}`;
                        };

                        // Flatten the nested structure and map to the desired structure
                        const flattenComments = (commentsArray) => {
                            return commentsArray.flatMap((comment, index) => {
                                if (Array.isArray(comment)) {
                                    // Handle nested comments
                                    return comment.map((nestedComment, nestedIndex) => ({
                                        id: `${index}-${nestedIndex}`,
                                        from: nestedComment.from,
                                        text: nestedComment.text,
                                        timestamp: formatTimestamp(nestedComment.timestamp),
                                        class: nestedComment.from === 'HR' ? 'message sent' : 'message received',
                                    }));
                                } else {
                                    // Handle regular comments
                                    return {
                                        id: index.toString(),
                                        from: comment.from,
                                        text: comment.text,
                                        timestamp: formatTimestamp(comment.timestamp),
                                        class: comment.from === 'HR' ? 'message sent' : 'message received',
                                    };
                                }
                            });
                        };

                        this.messages = flattenComments(parsedComments);

                        console.log("Parsed and Flattened Comments:", this.messages);
                    } catch (error) {
                        console.error("Error parsing comments JSON:", error);
                        this.error = "Failed to parse comments.";
                    }
                } else {
                    this.messages = [];
                }
            })
            .catch((error) => {
                console.error("Error fetching comments:", error);
                this.error = "Failed to load comments.";
            });
    }









    async loadMessages(recordId) {
        try {
            const timestamp = Date.now(); // Cache-busting parameter
            const comments = await getComments({ recordId, cacheBuster: timestamp });

            if (comments) {
                const parsedComments = JSON.parse(comments);

                const formatTimestamp = (timestamp) => {
                    const date = new Date(timestamp);
                    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const formattedDate = date.toLocaleDateString('en-GB'); // DD/MM/YYYY
                    return { time, date: formattedDate };
                };

                const flattenMessages = (messages) => {
                    return messages.reduce((acc, message) => {
                        if (Array.isArray(message)) {
                            return acc.concat(flattenMessages(message));
                        } else {
                            acc.push(message);
                            return acc;
                        }
                    }, []);
                };

                const flattenedMessages = flattenMessages(parsedComments);

                const uniqueMessages = Array.from(new Set(flattenedMessages.map((msg) => JSON.stringify(msg))))
                    .map((msg) => JSON.parse(msg));

                const groupedMessages = [];
                let lastDate = null;

                uniqueMessages.forEach((message) => {
                    const { time, date } = formatTimestamp(message.timestamp);
                    if (date !== lastDate) {
                        groupedMessages.push({ isDateDivider: true, date });
                        lastDate = date;
                    }
                    groupedMessages.push({
                        id: groupedMessages.length.toString(),
                        from: message.from,
                        text: message.text,
                        timestamp: time,
                        isDateDivider: false,
                        class: `message ${message.from === 'HR' ? 'sent' : 'received'}`,
                    });
                });

                const previousMessageCount = this.messages ? this.messages.length : 0;
                this.messages = groupedMessages;

                // Scroll to the bottom if new messages are added
                if (this.messages.length > previousMessageCount) {
                    this.scrollToBottom();
                }
            } else {
                this.messages = [];
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    // Send a reply
    sendReply() {
        if (!this.newMessage || !this.selectedRecordId) {
            this.error = 'Comment or record ID is missing.';
            console.error('Missing new comment or record ID:', {
                newMessage: this.newMessage,
                selectedRecordId: this.selectedRecordId,
            });
            return;
        }

        const newCommentObject = {
            timestamp: new Date().toISOString(), // Current timestamp
            text: this.newMessage.trim(),
            from: 'HR', // Static value for 'from'
        };

        console.log('New Comment Object:', newCommentObject);

        updateComments({
            recordId: this.selectedRecordId,
            newComment: JSON.stringify(newCommentObject),
        })
            .then(() => {
                this.messages = [
                    ...this.messages,
                    {
                        ...newCommentObject,
                        id: (this.messages.length + 1).toString(), // Unique ID for new message
                        class: 'message sent', // Align HR messages to the right
                    },
                ];

                // Clear the input field
                this.newMessage = '';
                const inputField = this.template.querySelector('.message-input');
                if (inputField) {
                    inputField.value = '';
                }

                // Scroll to the bottom after sending a message
                this.scrollToBottom();

                console.log('Comment added and messages updated:', this.messages);
            })
            .catch((error) => {
                console.error('Error updating comments:', error);
                this.error = 'Failed to update comments.';
            });
    }

    // Scroll to the bottom of the conversation
    scrollToBottom() {
        setTimeout(() => {
            const container = this.template.querySelector('.messages-container');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }, 100); // Slight delay for DOM update
    }

    // Start polling for new messages
    startPolling() {
        this.pollingInterval = setInterval(() => {
            this.loadMessages(this.selectedRecordId);
        }, 1500); // Poll every 1.5 seconds
    }

    // Stop polling for new messages
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
    }

    // Update the new message as the user types
    handleMessageInput(event) {
        this.newMessage = event.target.value;
    }

    // Handle keydown events for Enter and Shift+Enter
    handleKeyDown(event) {
        if (event.key === 'Enter') {
            if (event.shiftKey) {
                // Allow newline in the input field
                return;
            } else {
                // Prevent default behavior (line break) for Enter key
                event.preventDefault();

                // Check if it's a reply to a specific message or a normal reply
                if (this.replyToMessage) {
                    this.sendReplyToMsg(); // Send a reply to a specific message
                } else {
                    this.sendReply(); // Send a normal reply
                }
            }
        }
    }


    handleDoubleClick(event) {
        const messageId = event.currentTarget.dataset.id; // Get the message ID from the data-id attribute
        const message = this.messages.find(msg => msg.id === messageId); // Find the corresponding message
        if (message) {
            this.replyToMessage = message; // Set the reply-to message
            console.log('Replying to message:', message.text);
        }
    }


    cancelReply() {
        this.replyToMessage = null; // Cancel the reply action
    }

    sendReplyToMsg() {
        if (!this.newMessage || !this.selectedRecordId) {
            this.error = 'Comment or record ID is missing.';
            console.error('Missing new comment or record ID:', {
                newMessage: this.newMessage,
                selectedRecordId: this.selectedRecordId,
            });
            return;
        }

        const newCommentObject = {
            timestamp: new Date().toISOString(), // Current timestamp
            text: this.newMessage.trim(),
            from: 'HR', // Static value for 'from'
            repliedTo: this.replyToMessage
                ? {
                    id: this.replyToMessage.id, // ID of the message being replied to
                    from: this.replyToMessage.from, // Sender of the original message
                    text: this.replyToMessage.text, // Original message text
                }
                : null, // Null if not replying
        };

        console.log('New Comment Object:', newCommentObject);

        updateComments({
            recordId: this.selectedRecordId,
            newComment: JSON.stringify(newCommentObject),
        })
            .then(() => {
                this.messages = [
                    ...this.messages,
                    {
                        ...newCommentObject,
                        id: (this.messages.length + 1).toString(), // Unique ID for new message
                        class: 'message sent', // Align HR messages to the right
                    },
                ];

                // Clear the input field
                this.newMessage = '';
                const inputField = this.template.querySelector('.message-input');
                if (inputField) {
                    inputField.value = '';
                }

                // Clear the reply-to state after sending the reply
                this.replyToMessage = null;

                // Scroll to the bottom after sending a message
                this.scrollToBottom();

                console.log('Comment added and messages updated:', this.messages);
            })
            .catch((error) => {
                console.error('Error updating comments:', error);
                this.error = 'Failed to update comments.';
            });
    }


    scrollToMessage(event) {
        const messageId = event.currentTarget.dataset.id;
        const targetMessage = this.template.querySelector(`[data-id="${messageId}"]`);
        if (targetMessage) {
            targetMessage.scrollIntoView({ behavior: "smooth" });
        }
    }





    closeChatterModal() {
        this.showChatterModal = false;
        this.currentRecordId = null;
        this.stopPolling();
    }


    openTemplateModal() {
        this.isTemplateModalOpen = true;
        this.loadTemplates();
    }


    openAddTemplateModal() {
        this.isTemplateAddModalOpen = true;
    }

    closeAddTemplateModal() {
        this.isTemplateAddModalOpen = false;
        this.templateName = '';
        this.templateDocumentType = '';
        this.templateFile = null;
        this.isEditingTemplate = false;
        this.editingTemplateId = null;

        // Clear file upload state
        this.base64FileData = null;
        this.fileName = '';
        this.fileType = '';
        this.fileSize = null;
        this.selectedFilesToUpload = null;
        this.myFile = null;
        this.fileReaderObj = null;
        this.isFileAttached = false;
        this.isattachError = false;
        this.uploadedFiles = [];
        this.showSpinner = false;

        // Optional: reset file input element if needed
        const fileInput = this.template.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.value = null;
        }
    }


    closeTemplateModal() {
        this.isTemplateModalOpen = false;
    }

    handleTemplateNameChange(event) {
        this.templateName = event.target.value;
    }

    handleDocumentTypeChange(event) {
        this.templateDocumentType = event.target.value;
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        this.templateFile = file;
        console.log('📄 Selected file:', file.name);
    }
    get disableAddTemplate() {
        return !this.isEditingTemplate && this.templateList.length >= 5;
    }

    submitTemplate() {
        console.log('📨 Submitting template...');

        if (!this.isEditingTemplate && this.templateList.length >= 5) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Limit Reached',
                message: 'You can only add up to 5 templates.',
                variant: 'error'
            }));
            return;
        }

        // Validation
        if (!this.templateName || !this.templateDocumentType) {
            console.warn('⚠️ Missing required fields: Template Name or Document Type');
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Validation Error',
                    message: 'Both Template Name and Document Type are required.',
                    variant: 'warning'
                })
            );
            return;
        }

        const isEdit = this.isEditingTemplate;
        const templateId = this.editingTemplateId;

        console.log(`🛠️ Operation: ${isEdit ? 'Edit existing template' : 'Create new template'}`);
        console.log('📝 Template Name:', this.templateName);
        console.log('📄 Document Type:', this.templateDocumentType);

        const operation = isEdit
            ? updateTemplate({ templateId, name: this.templateName, type: this.templateDocumentType })
            : createTemplate({ name: this.templateName, type: this.templateDocumentType });

        let newTemplateId;

        operation
            .then(result => {
                newTemplateId = isEdit ? templateId : result;

                console.log(`✅ Template ${isEdit ? 'updated' : 'created'} successfully. ID:`, newTemplateId);

                if (this.base64FileData && newTemplateId) {
                    console.log('📎 Preparing to upload file:', this.fileName);
                    return uploadFile({
                        base64: JSON.stringify(this.base64FileData),
                        filename: this.fileName,
                        recordId: newTemplateId,
                        obj: 'ParticipantTemplate'
                    }).then(() => {
                        console.log('✅ File uploaded successfully for template:', newTemplateId);
                    }).catch(error => {
                        console.error('❌ File upload failed:', error);
                        this.dispatchEvent(new ShowToastEvent({
                            title: 'File Upload Failed',
                            message: 'The template was saved, but file upload failed.',
                            variant: 'warning'
                        }));
                        return Promise.reject(error);
                    });
                } else {
                    console.log('ℹ️ No file to upload or missing template ID');
                    return Promise.resolve();
                }
            })
            .then(() => {
                this.dispatchEvent(new ShowToastEvent({
                    title: isEdit ? 'Updated' : 'Success',
                    message: isEdit ? 'Template updated successfully!' : 'Template created successfully!',
                    variant: 'success'
                }));
                console.log('🎉 Template process complete. Closing modal and refreshing list.');
                this.closeAddTemplateModal();
                return refreshApex(this.wiredTemplatesResult);
            })
            .then(() => {
                console.log('🔄 Template list refreshed.');
            })
            .catch(error => {
                console.error('❌ Error during template submission flow:', error);
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error',
                    message: error?.body?.message || 'Failed to submit template.',
                    variant: 'error'
                }));
            });
    }





    handleEditTemplate(event) {
        const templateId = event.currentTarget.dataset.id;
        const template = this.templateList.find(t => t.id === templateId);

        if (template) {
            this.editingTemplateId = template.id;
            this.templateName = template.name;
            this.templateDocumentType = template.documentType;
            this.isTemplateAddModalOpen = true;
            this.isEditingTemplate = true;
        }
    }
    handleDeleteTemplate(event) {
        const templateId = event.currentTarget.dataset.id;

        // deleteTemplate({ templateId })
        //     .then(() => {
        //         this.dispatchEvent(new ShowToastEvent({
        //             title: 'Deleted',
        //             message: 'Template deleted successfully.',
        //             variant: 'success'
        //         }));
        //         refreshApex(this.wiredTemplatesResult); // Refresh the table
        //     })
        //     .catch(error => {
        //         console.error('❌ Delete error:', error);
        //         this.dispatchEvent(new ShowToastEvent({
        //             title: 'Error',
        //             message: 'Failed to delete template.',
        //             variant: 'error'
        //         }));
        //     });
    }



    triggerFileInput() {
        this.template.querySelector('input[type="file"]').click();
    }

    onFileUpload(event) {
        this.isattachError = false;
        this.isFileAttached = true;

        //this.recordId=event.detail.id;
        // console.log('in files upload',event.target.files.length);
        if (event.target.files.length > 0) {
            this.showSpinner = true;
            this.selectedFilesToUpload = event.target.files;
            this.file = this.selectedFilesToUpload[0];
            this.fileName = this.selectedFilesToUpload[0].name.split(" ").join("");
            this.fileType = this.selectedFilesToUpload[0].type;
            this.fileSize = this.selectedFilesToUpload[0].size;

            if (this.file.size > this.MAX_FILE_SIZE || this.file.size < this.MIN_FILE_SIZE) {
                this.isattachError = true;
            }
            //create an intance of File
            this.fileReaderObj = new FileReader();

            //this callback function in for fileReaderObj.readAsDataURL
            this.fileReaderObj.onloadend = (() => {
                //get the uploaded file in base64 format
                let fileContents = this.fileReaderObj.result;
                fileContents = fileContents.substr(fileContents.indexOf(',') + 1);

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
                this.myFile = new File(byteArrays, this.fileName, { type: this.fileType });

                //callback for final base64 String format
                let reader = new FileReader();
                reader.onloadend = (() => {
                    let base64data = reader.result;
                    this.base64FileData = base64data.substr(base64data.indexOf(',') + 1);
                    this.isFileAttached = true;
                    this.uploadedFiles = [{ name: this.fileName }];
                });
                reader.readAsDataURL(this.myFile);
            });
            this.fileReaderObj.readAsDataURL(this.file);
        }
        this.showSpinner = false;
        // console.log('fileName>>',typeof(JSON.stringify(event.target.files) ));

        console.log('filename>> ', this.fileName);
    }

    @track uploadedFiles = [];
    @track showSpinner = false;

    async handleViewTemplate(event) {
        const startMs = Date.now();
        const templateId = event.currentTarget.dataset.id;
        const selectedTemplate = this.templateList.find(t => t.id === templateId);

        if (!selectedTemplate || !selectedTemplate.AWS_Document__c) {
            this.showToast('Error', 'No PDF document available for this template.', 'error');
            return;
        }

        const templateName = selectedTemplate.name || '';
        const docType = selectedTemplate.documentType || '';
        this.selectedTemplateName = templateName;
        this.selectedDocumentType = docType;

        const target = docApiTarget(selectedTemplate.AWS_Document__c);
        if (!target) {
            this.showToast('Error', 'No PDF document available for this template.', 'error');
            return;
        }

        this.isLoading = true;
        try {
            const pages = await fetchDocPages(getDocPages, target);
            this.viewerMode = 'template';
            this.viewerTitle = templateName;
            this.viewerSubtitle = docType ? `Document Type: ${docType}` : '';
            this.viewerPages = pages.map((p, i) => ({ ...p, loading: i < 2 ? 'eager' : 'lazy' }));
            this.viewerCurrentPage = 1;
            this._viewerTarget = target;
            this._viewerRefreshed = false;
            this.isViewerOpen = true;
            this.template.host?.classList?.add('doc-viewer-open');
            this._attachKeyHandler();
            requestAnimationFrame(() => {
                const scrollContainer = this.template.querySelector('.doc-viewer-scroll');
                if (scrollContainer) {
                    scrollContainer.scrollTop = 0;
                }
                this._observeViewerPages();
            });
            console.log(`[DOC-API] action=view-template, id=${templateId}, target=${stripQuery(target)}, pages=${pages.length}, duration=${Date.now() - startMs}ms`);
        } catch (err) {
            console.error('Template view error:', err);
            const serverMsg = String(err?.serverError || err?.message || '').toLowerCase();
            if (serverMsg.includes('not a pdf')) {
                this.showToast('Error', "This template can't be previewed.", 'error');
            } else {
                this.showToast('Error', 'Failed to load template preview.', 'error');
            }
        } finally {
            this.isLoading = false;
        }
    }

    refreshTemplates() {
        console.log('🔄 Refreshing templates...');
        if (this.wiredTemplatesResult) {
            this.showSpinner = true;
            refreshApex(this.wiredTemplatesResult)
                .then(() => {
                    console.log('✅ Templates refreshed successfully');
                })
                .catch(error => {
                    console.error('❌ Error refreshing templates:', error);
                    this.dispatchEvent(new ShowToastEvent({
                        title: 'Error',
                        message: 'Failed to refresh template list.',
                        variant: 'error'
                    }));
                })
                .finally(() => {
                    this.showSpinner = false;
                });
        } else {
            console.warn('⚠️ No wired result to refresh.');
        }
    }

    handleBack() {
        console.log('⬅️ Back button clicked from T-Sign Docs');

        this.dispatchEvent(
            new CustomEvent('backtohome')
        );
    }

}