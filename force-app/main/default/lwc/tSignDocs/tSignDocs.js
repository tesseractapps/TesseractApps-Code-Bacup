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
    @track pageSize = 5; // Default records per page
    @track totalRecords = 0;
    @track totalPages = 0;
    @track pageNumber = 1;
    @track pageSizeOptions = [5, 10, 20, 50];
    @api orgid;

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

    connectedCallback() {
        console.log('TeSignLogo URL:', this.logo);
        console.log('📌 Received Org ID:', this.orgid);
        this.fetchDocumentRecords();
        //this.startPolling();

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
                FormattedCreatedDate: new Intl.DateTimeFormat('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit'
                }).format(new Date(doc.CreatedDate)),
                Status: doc.Status || 'Unknown',
                disableViewIcon: doc.Status !== 'Completed',
                showViewIcon: doc.Status === 'Completed'
            }));
    
            this.draftDocuments = this.allDocuments.filter(doc => !doc.Status);
            this.inProgressDocuments = this.allDocuments.filter(doc => doc.Status === 'Pending');
            this.processedDocuments = this.allDocuments.filter(doc => doc.Status === 'Completed');
    
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
        this.selectedStatus = event.target.value;
        this.pageNumber = 1;
        this.updateDisplayedRecords();
    }

    updateDisplayedRecords() {
        let filteredData = [];
        if (this.selectedStatus === 'draft') {
            filteredData = [...this.draftDocuments];
        } else if (this.selectedStatus === 'inProgress') {
            filteredData = [...this.inProgressDocuments];
        } else if (this.selectedStatus === 'processed') {
            filteredData = [...this.processedDocuments];
        } else if (this.selectedStatus === 'all') {
            filteredData = [...this.allDocuments];
        }
    
        this.totalRecords = filteredData.length;
        
        // Ensure the correct sorting order before paginating
        this.sortDocuments(filteredData);
        this.paginateRecords(filteredData);
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
        case 'draft': return this.draftDocuments;
        case 'inProgress': return this.inProgressDocuments;
        case 'processed': return this.processedDocuments;
        default: return this.allDocuments;
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

    if (this.selectedStatus === 'draft') {
        // Remove both "Status" and "View" for Draft documents
        columnsToUse = columnsToUse.filter(col => col.label !== 'View' && col.label !== 'Status');
    } else if (this.selectedStatus === 'inProgress') {
        // Remove only "View" for In Progress documents
        columnsToUse = columnsToUse.filter(col => col.label !== 'View');
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
async handleRowAction(event) {
    this.isLoading = true;
    const actionName = event.currentTarget.dataset.action;
    const recordId = event.currentTarget.dataset.id;

    const row = this.displayedDocuments.find(doc => doc.Id === recordId);

    if (!row) {
        console.error('Record not found:', recordId);
        return;
    }

    if (actionName === 'view' && row.Status === 'Completed') {
        const pdfUrl = row.SignatureURL;
        this.loadPdfForViewer(pdfUrl);
    }else if (actionName === 'comments') {
                this.selectedRecordId = row.Id;
                this.showChatterModal = true;
                this.startPolling();
                this.fetchComments();
                this.messages = row.Comments ? this.parseComments(row.Comments) : [];
                this.isLoading = false;
            } else {
                console.error('Invalid action:', actionName);
                this.error = 'Invalid action selected.';
            }
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
}