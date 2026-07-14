import { LightningElement, track,api } from 'lwc';
import getDocumentRecords from '@salesforce/apex/tSignDocsController.getDocumentRecords';
import TeSignLogo from '@salesforce/resourceUrl/Te_sign';
import updateComments from '@salesforce/apex/tSignDocsController.updateComments';
import Send_Icon from '@salesforce/resourceUrl/Send_Icon';
import getComments from '@salesforce/apex/tSignDocsController.getComments';
import pdfjsLib from '@salesforce/resourceUrl/pdfJS';
import pdfWorker from '@salesforce/resourceUrl/pdfWorker';
import { loadScript } from 'lightning/platformResourceLoader';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';
import getTemplates from '@salesforce/apex/tSignDocsController.getTemplates';
import createTemplate from '@salesforce/apex/tSignDocsController.createTemplate';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import PARTICIPANT_TEMPLATE_OBJECT from '@salesforce/schema/Participant_Template__c';
import DOCUMENT_TYPE_FIELD from '@salesforce/schema/Participant_Template__c.Document_Type__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import updateTemplate from '@salesforce/apex/tSignDocsController.updateTemplate';
// import deleteTemplate from '@salesforce/apex/tSignDocsController.deleteTemplate';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';


import { wire } from 'lwc';


export default class TSignDocs extends LightningElement {
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
    @track selectedRecordId='';
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
    @track isPdfViewerVisible1 = false;
    @track pdfViewerUrl1 = '';
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

@wire(getTemplates)
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
        //this.startPolling();
setTimeout(() => {
        this.handleStatusChange({ target: { value: 'all' } });
    }, 1500);
        this.loadPdfLibraries()
            .then(() => {
                console.log('PDF.js and worker script loaded successfully');
            })
            .catch((error) => {
                console.error('Error loading PDF libraries:', error);
                this.handleError('Failed to load PDF libraries.', error);
            });
    }

    async loadPdfLibraries() {
        try {
            await loadScript(this, pdfjsLib);
            await loadScript(this, pdfWorker);
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

        } catch (error) {
            throw new Error('Error while loading libraries: ' + error.message);
        }
    }
    disconnectedCallback() {
        this.stopPolling(); // Stop polling when the component is unloaded
    }

    async fetchDocumentRecords() {
        try {
            console.log('📌 Fetching documents for Org ID:', this.orgid);
            
            if (!this.orgid) {
                console.warn('⚠️ Org ID is undefined, skipping fetch.');
                return;
            }
    
            const data = await getDocumentRecords({ orgId: this.orgid });
            console.log('📌 Received Data:', data);
            this.allDocuments = data.map(doc => ({
                ...doc,
                CreatedDate: new Date(doc.CreatedDate),
                FormattedCreatedDate: new Intl.DateTimeFormat('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }).format(new Date(doc.CreatedDate)),
                // Status: doc.Status || 'Draft',
                RawStatus: doc.Status || 'Draft', 
                disableViewIcon: doc.Status !== 'Completed',
                showViewIcon: doc.Status === 'Completed',
                AllRecipients: doc.AllRecipients?.split('\n').join('<br/>') || '—',
                Status: (doc.Current_Recipient ? doc.Current_Recipient.split('@')[0] : '') + ' - ' + (doc.Status || 'Pending'),

            }));
    
            this.draftDocuments = this.allDocuments.filter(doc => doc.RawStatus === 'Draft');
            this.inProgressDocuments = this.allDocuments.filter(doc => doc.RawStatus === 'Pending');
            this.processedDocuments = this.allDocuments.filter(doc => doc.RawStatus === 'Completed');
    
        } catch (error) {
            console.error('❌ Error fetching document records:', error);
        }
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



    
closePdfViewer() {
    this.showPdfViewer = false;
    this.pdfUrl = '';
}




@track isPdfViewerVisible = false;
pdfViewerDoc = null;
@track currentPage = 1;
@track totalPages2 = 0;
@track renderingInProgress = false;
@track pendingPageNumber = null;


isPdfLibLoaded = false;

// Handle row action for viewing the PDF
// async handleRowAction(event) {
//     this.isLoading = true;
//     const actionName = event.currentTarget.dataset.action;
//     const recordId = event.currentTarget.dataset.id;

//     const row = this.displayedDocuments.find(doc => doc.Id === recordId);

//     if (!row) {
//         console.error('Record not found:', recordId);
//         return;
//     }

//     if (actionName === 'view' && row.Status === 'Completed') {
//         const pdfUrl = row.SignatureURL;
//         this.loadPdfForViewer(pdfUrl);
//     }else if (actionName === 'comments') {
//                 this.selectedRecordId = row.Id;
//                 this.showChatterModal = true;
//                 this.startPolling();
//                 this.fetchComments();
//                 this.messages = row.Comments ? this.parseComments(row.Comments) : [];
//                 this.isLoading = false;
//             } else {
//                 console.error('Invalid action:', actionName);
//                 this.error = 'Invalid action selected.';
//             }
// }

async handleRowAction(event) {
    this.isLoading = true;

    const actionName = event.currentTarget.dataset.action;
    const recordId = event.currentTarget.dataset.id;

    console.log('🟢 Clicked action:', actionName);
    console.log('🆔 Record ID:', recordId);

    const row = this.displayedDocuments.find(doc => doc.Id === recordId);

    if (!row) {
        console.error('❌ Record not found:', recordId);
        this.isLoading = false;
        return;
    }

    console.log('📄 Document row:', JSON.stringify(row));
    console.log('📌 RawStatus:', row.RawStatus);
    console.log('🔗 SignatureURL:', row.SignatureURL);

    try {
        if (actionName === 'view' && row.RawStatus === 'Completed') {
            const pdfUrl = row.SignatureURL;
            if (pdfUrl) {
                console.log('👁️ Viewing PDF:', pdfUrl);
                this.loadPdfForViewer(pdfUrl); // You may replace with window.open(pdfUrl, '_blank') for testing
            } else {
                console.warn('⚠️ No SignatureURL available for viewing.');
            }

        } else if (actionName === 'download' && row.RawStatus === 'Completed') {
            const pdfUrl = row.SignatureURL;
            if (pdfUrl) {
                console.log('⬇️ Downloading PDF:', pdfUrl);
                const link = document.createElement('a');
                link.href = pdfUrl;
                link.download = `Document_${row.Id}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                console.error('❌ No SignatureURL available for download.');
            }

        } else if (actionName === 'comments') {
            console.log('💬 Opening comments modal for record:', row.Id);
            this.selectedRecordId = row.Id;
            this.showChatterModal = true;
            this.startPolling();
            this.fetchComments();
            this.messages = row.Comments ? this.parseComments(row.Comments) : [];

        } else {
            console.error('❗ Invalid action or unsupported status for:', actionName);
            this.error = 'Invalid action selected or status mismatch.';
        }
    } catch (err) {
        console.error('🚨 Error handling action:', err);
        this.error = 'An error occurred while processing your request.';
    }

    this.isLoading = false;
}


// Load PDF from URL and open the modal
loadPdfForViewer(pdfUrl) {
    const encodedUrl = encodeURI(pdfUrl);

    window.pdfjsLib.getDocument(encodedUrl).promise
        .then((pdf) => {
            this.pdfViewerDoc = pdf;
            this.totalPages2 = pdf.numPages;
            this.currentPage = 1;
            this.isPdfViewerVisible = true;
            this.renderPdfPage(this.currentPage);
        })
        .catch((error) => {
            console.error('Error loading PDF:', error);
            this.showToast('Error', 'Failed to load PDF for preview.', 'error');
        });
}


// Render current page on canvas
renderPdfPage(pageNumber) {
    if (!this.pdfViewerDoc) return;

    if (this.renderingInProgress) {
        // Queue this page if rendering is already in progress
        this.pendingPageNumber = pageNumber;
        return;
    }

    this.renderingInProgress = true;

    this.pdfViewerDoc.getPage(pageNumber).then((page) => {
        const canvas = this.template.querySelector('.pdf-canvas');
        if (!canvas) {
            console.warn('Canvas not found');
            this.renderingInProgress = false;
            return;
        }

        const context = canvas.getContext('2d');
        const scale = 4;
        const viewport = page.getViewport({ scale });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderTask = page.render({
            canvasContext: context,
            viewport: viewport
        });

        renderTask.promise.then(() => {
            this.renderingInProgress = false;

            if (this.pendingPageNumber !== null && this.pendingPageNumber !== pageNumber) {
                const next = this.pendingPageNumber;
                this.pendingPageNumber = null;
                this.currentPage = next;
                this.renderPdfPage(next);
            }
            this.isLoading = false;
        });
    }).catch((error) => {
        console.error('Error rendering PDF page:', error);
        this.renderingInProgress = false;
    });
}



showNextPage() {
    if (this.currentPage < this.totalPages2) {
        this.currentPage++;
        this.renderPdfPage(this.currentPage);
    }
}

showPreviousPage() {
    if (this.currentPage > 1) {
        this.currentPage--;
        this.renderPdfPage(this.currentPage);
    }
}


// Close the modal and clean up
closePdfViewer() {
    this.isPdfViewerVisible = false;
    this.pdfViewerDoc = null;
    this.currentPage = 1;
    this.totalPages2 = 0;
}

get isPreviousDisabled() {
    return this.currentPage === 1;
}

get isNextDisabled() {
    return this.currentPage === this.totalPages2;
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


closeTemplateModal(){
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
        this.isattachError=false;
        this.isFileAttached=true;
        
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
                this.isattachError=true;
            }
            //create an intance of File
            this.fileReaderObj = new FileReader();

            //this callback function in for fileReaderObj.readAsDataURL
            this.fileReaderObj.onloadend = (() => {        
                //get the uploaded file in base64 format
                let fileContents = this.fileReaderObj.result;
                fileContents = fileContents.substr(fileContents.indexOf(',')+1);
                
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
                    for (let offset = begin, i = 0 ; offset < end; ++i, ++offset) {
                        bytes[i] = byteCharacters[offset].charCodeAt(0);         
                    }
                    byteArrays[sliceIndex] = new Uint8Array(bytes);
                }
                
                //from arraybuffer create a File instance
                this.myFile =  new File(byteArrays, this.fileName, { type: this.fileType });
                
                //callback for final base64 String format
                let reader = new FileReader();
                reader.onloadend = (() => {
                    let base64data = reader.result;
                    this.base64FileData = base64data.substr(base64data.indexOf(',')+1);
                    this.isFileAttached = true;
        this.uploadedFiles = [{ name: this.fileName }];
                });
                reader.readAsDataURL(this.myFile);                                 
            });
            this.fileReaderObj.readAsDataURL(this.file);
        }
        this.showSpinner = false;
            // console.log('fileName>>',typeof(JSON.stringify(event.target.files) ));
            
        console.log('filename>> ',this.fileName);
    }  

    @track uploadedFiles = [];
@track showSpinner = false;

handleViewTemplate(event) {
    const templateId = event.currentTarget.dataset.id;
    const selectedTemplate = this.templateList.find(t => t.id === templateId);

    if (selectedTemplate && selectedTemplate.AWS_Document__c) {
        this.selectedTemplateName = selectedTemplate.name;
        this.selectedDocumentType = selectedTemplate.documentType;
        this.pdfViewerUrl1 = selectedTemplate.AWS_Document__c;
        this.isPdfViewerVisible1 = true;
    } else {
        this.dispatchEvent(new ShowToastEvent({
            title: 'Error',
            message: 'No PDF document available for this template.',
            variant: 'error'
        }));
    }
}


closePdfViewer1() {
    this.isPdfViewerVisible1 = false;
    this.pdfViewerUrl1 = '';
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


}