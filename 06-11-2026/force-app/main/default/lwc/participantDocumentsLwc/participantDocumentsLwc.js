import { LightningElement, track, api } from 'lwc';
import fetchParticipantDocs from '@salesforce/apex/StaffController.fetchParticipantDocs';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import saveParticipantDocShares from '@salesforce/apex/ClientAttachmentHandler.saveParticipantDocShares';
import fetchStaffByDoc from '@salesforce/apex/ClientAttachmentHandler.fetchStaffByDoc';
//import fetchStaffOptions from '@salesforce/apex/StaffController.fetchStaffDocuments';
import archiveAttachment from '@salesforce/apex/ClientAttachmentHandler.archiveAttachment';
import restoreAttachment from '@salesforce/apex/ClientAttachmentHandler.restoreAttachment';
import getAllArchivedParticipantAttachments from '@salesforce/apex/ClientAttachmentHandler.getAllArchivedParticipantAttachments';
import getParticipantShareStaffUsers from '@salesforce/apex/StaffController.getParticipantShareStaffUsers';

// fixed display order
const ROLE_ORDER = [
    'Roster Manager',
    'Roster Coordinator',
    'HR Admin',
    'Payroll Admin',
    'NDIS Staff'
];

export default class ParticipantDocumentsLwc extends LightningElement {
   
    @track participantList = [];
    @track totalRecords = 0; //Total no.of records
    @track pageSize = 10; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number   
    @track records = []; 

    get pageSizeOptions() {
        return [
            { label: '10', value: '10' },
            { label: '25', value: '25' },
            { label: '50', value: '50' },
            { label: '75', value: '75' },
            { label: '100', value: '100' }
        ];
    } 
    @track activeFilterOn = true;
    @track inactiveFilterOn = false;
    @track searchKey = '';
    @track filteredList = [];
    @track isModalOpen=false;
    @track isHome = true;
    @track noRecordsFlag=false;
    @track currentUrl;
    @api adminflag;

    @track selectedDocType = '';
    @track selectedStatus = '';

    @track docTypeOptions = [];
    // @track statusOptions = [
    //     { label: "All", value: "" },
    //     { label: "Approved", value: "approved" },
    //     { label: "Rejected", value: "rejected" },
    //     { label: "Pending", value: "pending" }
    // ];
    @track isParticipantView = true;
    @track isDocTypeView = false;
    @track groupedDocTypeList = []; // Holds grouped output

    @track assignmentFlag = false;
    @track currentDocumentId;
    @track selectedStaffIds = [];
    @track staffOptions = [];

    //Sai Eswar
    @track archiveSearchKey = '';
    @track allArchivedRecords = [];
    @track archiveModal = false;
    @track archivedRecords = [];
    
@track allStaffList = [];
@track roleOptions = [];
@track selectedRoles = [];
@track staffSearchKey = '';

@track staffPageNumber = 1;
@track staffPageSize = 10;

    get bDisableFirst() {
      return this.pageNumber == 1;
    }
    get bDisableLast() {
      return this.pageNumber == this.totalPages;
    }
    get activeButtonClass() {
      return this.activeFilterOn ? 'active-button' : '';
    }

    get inactiveButtonClass() {
      return this.inactiveFilterOn ? 'active-button' : '';
    }
    
    connectedCallback() {
         this.loadParticipantDocuments();
        //  this.loadStaffOptions();
    }

    // loadStaffOptions() {
    // fetchStaffOptions()
    //     .then(result => {
    //         console.log('Result:', result);

    //         this.staffOptions = result.map(staff => ({
    //             label: staff.NameToDisplay__c || staff.Name,
    //             value: staff.Id
    //         }));

    //     })
    //     .catch(error => {
    //         console.error('Error:', error);
    //     });
    // }

    // loadParticipantDocuments() {
    //     fetchParticipantDocs()
    //     .then(result => {

    //     this.participantList = result.map(participant => ({
    //     ...participant,

    //     // default collapsed
    //     expand: false,

    //     // count of documents in Attachments__r
    //     docCount: participant.Attachments__r ? participant.Attachments__r.length : 0,
    //     statusClass: participant.Status__c === true ? 'status-dot active' : 'status-dot inactive',
    //     // map all attachments
    //     Attachments__r: participant.Attachments__r?.map(doc => ({
    //     ...doc,
    //     FormattedDate: this.formatDate(doc.Date__c)
    //     }))
    //     }));

    //     console.log('Formatted Participants:', JSON.stringify(this.participantList));

    //     this.records = this.participantList;
    //     this.pageSize = this.pageSizeOptions[0];
    //     this.pageNumber = 1;
    //     this.applyFilters();
    //     })
    //     .catch(error => {
    //     console.error('Error fetching participant docs:', error);
    //     });
    // }

    loadParticipantDocuments() {
        fetchParticipantDocs()
        .then(result => {
           
            console.log('participant docs',JSON.stringify(result));
          
            // Build Participant List with formatted docs
            this.participantList = result.map(participant => ({
                ...participant,
                expand: false, // default collapsed
                docCount: participant.Attachments__r ? participant.Attachments__r.length : 0,
                statusClass: participant.Status__c === true ? 'status-dot active' : 'status-dot inactive',

                // Format each attachment
              /*   Attachments__r: (participant.Attachments__r || []).map(doc => ({
                    ...doc,
                    FormattedDate: this.formatDate(doc.Date__c)
                })) */
              
                Attachments__r: (participant.Attachments__r || []).map(doc => {
                    const daysLeft = doc.Expiry_Date__c? this.calculateDaysLeft(doc.Expiry_Date__c): null;

                        return {
                            ...doc,

                            FormattedDate: this.formatDate(doc.Date__c),
                            FormattedExpiryDate: this.formatDate(doc.Expiry_Date__c),
                            daysLeft: daysLeft,

                            isExpired: daysLeft !== null && daysLeft < 0,

                            expiringSoon:
                                daysLeft !== null &&
                                daysLeft >= 0 &&
                                daysLeft <= 30
                        };
                    })
            }));

            console.log('Formatted Participants:', JSON.stringify(this.participantList));

            // Store full dataset
            this.records = this.participantList;

            // Build Document Type dropdown options
            const typeSet = new Set();
            this.records.forEach(p => {
                (p.Attachments__r || []).forEach(doc => {
                    if (doc.Type__c) typeSet.add(doc.Type__c);
                });
            });

            this.docTypeOptions = [
                { label: "All", value: "" },
                ...Array.from(typeSet).map(t => ({
                    label: t,
                    value: t.toLowerCase()
                }))
            ];

            // Setup pagination defaults
            this.pageSize = 10;
            this.pageNumber = 1;

            // Apply all filters (active, inactive, search, doc type, status)
            this.applyFilters();
            if (this._pendingRoute) {
                const { uid, tab, isEdit } = this._pendingRoute;
                this._pendingRoute = null;
                this.openByUID(uid, tab, isEdit);
            }            
        })
        .catch(error => {
            console.error('Error fetching participant docs:', error);
        });
    }

applyFilters() {

    /* =======================================
       VIEW 1: BY DOCUMENT TYPE (GROUPED VIEW)
    ======================================== */
    if (this.isDocTypeView) {

        // Build grouped structure first
        this.groupByDocType();

        let grouped = [...this.groupedDocTypeList];

        /* SEARCH filter (applies on document type name) */
        if (this.searchKey) {
            const key = this.searchKey.toLowerCase();
            grouped = grouped.filter(g =>
                g.documentTypeName.toLowerCase().includes(key)
            );
        }

        /* STATUS FILTER */
        if (this.selectedStatus) {
            const key = this.selectedStatus.toLowerCase();
            grouped = grouped
                .map(g => ({
                    ...g,
                    documents: g.documents.filter(doc =>
                        (doc.Status__c || '').toLowerCase() === key
                    )
                }))
                .filter(g => g.documents.length > 0); // Keep only groups that have docs
        }

        // Update filtered list
        this.filteredList = grouped;
        this.totalRecords = grouped.length;

        return; // STOP HERE — pagination not applied in grouped view
    }


    /* =======================================
       VIEW 2: BY PARTICIPANT (DEFAULT VIEW)
    ======================================== */

    let data = [...this.records];

    /* ACTIVE FILTER */
    if (this.activeFilterOn) {
        data = data.filter(p => p.Status__c === true);
    }

    /* INACTIVE FILTER */
    if (this.inactiveFilterOn) {
        data = data.filter(p => p.Status__c === false);
    }

    /* SEARCH (name, doc name, doc type) */
    if (this.searchKey) {
        const key = this.searchKey.toLowerCase();
        data = data.filter(p =>
            (p.Display_Nickname__c || '').toLowerCase().includes(key) ||
            (p.Attachments__r || []).some(doc =>
                (doc.Name || '').toLowerCase().includes(key) ||
                (doc.Type__c || '').toLowerCase().includes(key)
            )
        );
    }

    /* DOCUMENT TYPE FILTER */
    if (this.selectedDocType) {
        const key = this.selectedDocType.toLowerCase();
        data = data.filter(p =>
            (p.Attachments__r || []).some(doc =>
                (doc.Type__c || '').toLowerCase() === key
            )
        );
    }

    /* STATUS FILTER */
    if (this.selectedStatus) {
        const key = this.selectedStatus.toLowerCase();
        data = data.filter(p =>
            (p.Attachments__r || []).some(doc =>
                (doc.Status__c || '').toLowerCase() === key
            )
        );
    }




    /* FINALIZE PARTICIPANT VIEW */
    this.filteredList = data;
    this.totalRecords = data.length;
    this.pageNumber = 1;

if (this.isParticipantView) {
    this.paginationHelper();
}
}

calculateDaysLeft(dateStr) {
    if (!dateStr) {
        return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(dateStr);
    expiry.setHours(0, 0, 0, 0);

    const diff = expiry.getTime() - today.getTime();

    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}



    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        let day = String(date.getDate()).padStart(2, '0');
        let month = String(date.getMonth() + 1).padStart(2, '0');
        let year = date.getFullYear();
        return `${day}-${month}-${year}`;
    } 

    toggleSection(event) {
        const id = event.currentTarget.dataset.id;
        if (!id) return;

        this.participantList = this.participantList.map(participant =>
            participant.Id === id
                ? { ...participant, expand: !participant.expand }
                : participant
        );

        this.filteredList = this.filteredList.map(participant =>
            participant.Id === id
                ? { ...participant, expand: !participant.expand }
                : participant
        );
    }

     handleActiveToggle() {
        this.activeFilterOn = !this.activeFilterOn;
        if (this.activeFilterOn) this.inactiveFilterOn = false;
        this.applyFilters();
    }

    handleInactiveToggle() {
        this.inactiveFilterOn = !this.inactiveFilterOn;
        if (this.inactiveFilterOn) this.activeFilterOn = false;
        this.applyFilters();
    }

    handleSearchInput(event) {
        this.searchKey = event.target.value.toLowerCase();
        this.applyFilters();

    }

    handleRecordsPerPage(event) {         
        this.pageSize = parseInt(event.target.value, 10);
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

    paginationHelper() {
        this.participantList = [];
        if (this.totalRecords > 0) {
            this.noRecordsFlag = false;
        } else {
            this.noRecordsFlag = true;
        } 
        
        const size = this.pageSize;
        
        // calculate total pages
        this.totalPages = Math.ceil(this.totalRecords / size);
        // set page number 
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
        // set records to display on current page
        for (let i = (this.pageNumber - 1) * size; i < this.pageNumber * size; i++) {
            if (i === this.totalRecords) {
                break;
            }
            let record = { ...this.filteredList[i] }; // shallow copy
            this.participantList.push(record);
        }

        console.log('this.participantList:', JSON.stringify(this.participantList)); 
    }

    handleback() {
        this.isModalOpen = false;
        this.currentUrl = null;
        this.isHome = true;
        this._syncRecordRoute();
    }

    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
        console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
        this.isHome=false;
        this.archiveModal=false;
        const fileType = this.getFileType(this.currentUrl);
        console.log('file type: ' + fileType);

        if (
            fileType !== 'png' &&
            fileType !== 'pdf' &&
            fileType !== 'jpeg' &&
            fileType !== 'csv' &&
            fileType !== 'svg' &&
            fileType !== 'jpg' &&
            fileType !== 'gif' &&
            fileType !== 'bmp' &&
            fileType !== 'tiff'
        ) {
            setTimeout(() => {
                this.handleback();
            }, 1700);
        }
        this._syncRecordRoute();
    }

    getFileType(url) {
        console.log('file url getFileType '+ url);
        const fileName = url.substring(url.lastIndexOf('/') + 1);
        console.log('file name getFileType '+ fileName);
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    } 

    handleDelete(event){
        const id = event.currentTarget.dataset.id;
        console.log('id: '+id);
        deleteRecord(id).then(() => {
        this.dispatchEvent(
        new ShowToastEvent({
        title: 'Success',
        message: 'Participant Document has been deleted',
        variant: 'success'
        })
        );
    
        
        this.loadParticipantDocuments();  
        }).catch(error => {
        console.log('error=>'+JSON.stringify(error));
        });

    }
    @track recordId;
    @track isEdit;
    @track clientId;
    handleEdit(event)    {        
        this.isEdit=true;
       // this.successmessage='Attachment updated successfully.';
        this.isFileAttached=false;
        this.recordId = event.currentTarget.dataset.id;
       // console.log('Edit', this.recordId);  
        this._syncRecordRoute();
    }

    handleSubmit(event){
          
        /*   event.preventDefault();
            if (this.isEdit == true){
                this.UpdateDetails = true;            
            }
            else{
                this.UpdateDetails = false;                  
            }
    
            if(!(this.isFileAttached) && !(this.isEdit)){     
                this.dispatchEvent(  
                    new ShowToastEvent({
                    title: 'Error',
                    variant: 'error',  
                    message: 'Upload file is mandatory.',  
                    }),  
                );
                return;
            }else{
                event.preventDefault();
                const fields=event.detail.fields;
                fields.Added_By__c=this.clientId;
                this.template.querySelector('lightning-record-edit-form').submit(fields);
                console.log('Attachment data : '+JSON.stringify(fields));          
            }        
            this.isOpenModal=false;      
            this.isEdit=false; */
            const fields=event.detail.fields;
            fields.Added_By__c=this.clientId;
            this.template.querySelector('lightning-record-edit-form').submit(fields);
            console.log('Attachment data : '+JSON.stringify(fields));
        }    
    
        handleSuccess(event){
          
            this.recordId = event.detail.id;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success!!',
                    message: 'participant document has been updated successfully',
                    variant: 'success',
                }),
            ); 
          /*   if(this.UpdateDetails == false){
                UpdateFileSize({clientId : this.recordId, filesize: this.fileSize})
                .then(fileresult =>{
                   // console.log('Updated file size = ' +fileresult);
                })
                .catch(error => {
                   // window.console.log(error);
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Error in uploading File',
                                message: error.message,
                                variant: 'error',
                            }),
                        );
                })
               // console.log('in is edit false'); 
                this.showSpinner = true;
                //Uploading files to AWS S3 bucket
                uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId:this.recordId,obj:'attach'})
                .then(result => {
                   // console.log('Upload result = ' +result);
                    this.fileName = this.fileName + ' - Uploaded Successfully';                
                    this.showSpinner = false;                
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success!!',
                            message: this.file.name + ' - Uploaded Successfully!!!',
                            variant: 'success',
                        }),
                    );
                })
                .catch(error => {
                    // Error to show during upload
                   // window.console.log(error);
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error in uploading File',
                            message: error.message,
                            variant: 'error',
                        }),
                    );
                    this.showSpinner = false;
                });            
            } */
           
            this.isEdit=false;        
            this._syncRecordRoute();
            
            this.loadParticipantDocuments();
        }

        handleDocTypeChange(event) {
            this.selectedDocType = event.detail.value;
            this.applyFilters();
        }

        handleStatusChange(event) {
            this.selectedStatus = event.detail.value;
            this.applyFilters();
        }
expandAll() {
    if (this.isParticipantView) {
        this.participantList = this.participantList.map(p => ({ ...p, expand: true }));
    } else {
        this.filteredList = this.filteredList.map(g => ({ ...g, expand: true }));
    }
}

collapseAll() {
    if (this.isParticipantView) {
        this.participantList = this.participantList.map(p => ({ ...p, expand: false }));
    } else {
        this.filteredList = this.filteredList.map(g => ({ ...g, expand: false }));
    }
}


groupByParticipant() {
    this.isParticipantView = true;
    this.isDocTypeView = false;
    this.applyFilters();
}

groupByDocType() {
    this.isParticipantView = false;
    this.isDocTypeView = true;

    const map = {};

    this.records.forEach(part => {
        (part.Attachments__r || []).forEach(doc => {
            const type = doc.Type__c || "Unknown";

            if (!map[type]) {
                map[type] = {
                    key: type,
                    documentTypeName: type,
                    expand: false,
                    documents: []
                };
            }

            map[type].documents.push({
                ...doc,
                participantName: part.Display_Nickname__c,
                participantId: part.Id
            });
        });
    });

    this.groupedDocTypeList = Object.values(map);

    // Force update UI
    this.filteredList = this.groupedDocTypeList;
    this.totalRecords = this.groupedDocTypeList.length;
}

get byParticipantClass() {
    return this.isParticipantView ? 'active' : '';
}

get byDocTypeClass() {
    return this.isDocTypeView ? 'active' : '';
}

toggleDocTypeSection(event) {
    const key = event.currentTarget.dataset.id;
    this.filteredList = this.filteredList.map(group =>
        group.key === key
            ? { ...group, expand: !group.expand }
            : group
    );
}

hideModalBox(){
    this.isEdit=false;
    this._syncRecordRoute();
}

// handleShare(event) {
//     console.log('🔥 handleShare clicked');
//     this.currentDocumentId = event.currentTarget.dataset.id;
//     console.log('DocId:', this.currentDocumentId);
//     this.assignmentFlag = true;
//     console.log('assignmentFlag:', this.assignmentFlag);
//     this.loadStaffByDoc(this.currentDocumentId);
//     this._syncRecordRoute();
// }

//  loadStaffByDoc(docId) {
//     fetchStaffByDoc({ docId: docId })
//         .then(result => {

//             console.log('🟢 Staff fetched:', JSON.stringify(result));

//             const selectedIds = (result || []).map(staff => staff.Staff__c);
//             this.selectedStaffIds = selectedIds;

//         })
//         .catch(error => {
//             console.error('❌ Error fetching staff:', error);
//         });
// } 

// handleassignmentinsert() {

//     console.log('🔵 Saving Share');
//     console.log('DocId:', this.currentDocumentId);
//     console.log('StaffIds:', JSON.stringify(this.selectedStaffIds));

//     saveParticipantDocShares({
//         docId: this.currentDocumentId,
//         staffIds: this.selectedStaffIds
//     })
//     .then(() => {

//         this.dispatchEvent(
//             new ShowToastEvent({
//                 title: 'Success',
//                 message: 'Document shared successfully.',
//                 variant: 'success'
//             })
//         );

//         console.log('🟢 Share Success');

//         this.assignmentFlag = false;
//         this.selectedStaffIds = [];
//         this._syncRecordRoute();

//         // optional refresh
//         this.loadParticipantDocuments();
//     })
//     .catch(error => {
//         console.error('❌ Error saving share:', error);
//     });
// }

// handleShareClose() {
//     this.assignmentFlag = false;
//     this.selectedStaffIds = [];
//     this._syncRecordRoute();
// }

handleArchive(event) {
    const attachmentId = event.currentTarget.dataset.id;
    archiveAttachment({
        attachmentId: attachmentId
    })
    .then(() => {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'File archived successfully',
                variant: 'success'
            })
        );
        this.loadParticipantDocuments();
    })
    .catch(error => {
        console.error(error);
        this.showToast('Archive failed');
    });
}

openArchiveModal() {
    this.archiveSearchKey = '';
    this.loadArchivedFiles();
    this.archiveModal = true;
    this._syncRecordRoute();
}

loadArchivedFiles() {

    getAllArchivedParticipantAttachments()

    .then(result => {

        console.log(
            'Archived Docs =>',
            JSON.stringify(result)
        );

        this.archivedRecords = result.map(rec => {

            const archivedDate =
                rec.Archived_Date__c
                    ? new Date(
                        rec.Archived_Date__c
                    ).toLocaleDateString(
                        'en-GB',
                        {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        }
                    )
                    : '';

            return {
                Id: rec.Id,
                Name: rec.Name,
                Participant_Doc_UID__c: rec.Participant_Doc_UID__c,
                Type: rec.Type__c,
                ArchivedDate: archivedDate,
                FileUrl: rec.Amazon_file_URL__c,
                Key: rec.Key__c,
                ParticipantName:
                    rec.Added_By__r
                        ? rec.Added_By__r.Display_Nickname__c
                        : ''
            };
        });

        this.allArchivedRecords = [
            ...this.archivedRecords
        ];
    })

    .catch(error => {

        console.error(
            'Archive Load Error',
            JSON.stringify(error)
        );
    });
}

handleRestore(event) {

    const attachmentId = event.currentTarget.dataset.id;
    restoreAttachment({
        attachmentId: attachmentId
    })

    .then(() => {
        // ✅ CLEAR SHARED STAFF UI STATE
        this.selectedStaffIds = [];
        // ✅ RESET CURRENT DOC
        this.currentDocumentId = null;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Document restored successfully',
                variant: 'success'
            })
        );
        this.loadArchivedFiles();
        this.loadParticipantDocuments();
    })

    .catch(error => {
        console.error(error);
        this.showToast('Restore failed');
    });
}

closeArchiveModal() {
    this.archiveModal = false;
    this._syncRecordRoute();
}

handleArchiveSearch(event) {
    this.archiveSearchKey = event.target.value;
    console.log('🔍 Search Input:', this.archiveSearchKey);
    const searchTerm = this.archiveSearchKey
        ? this.archiveSearchKey.toLowerCase().trim()
        : '';
    console.log('🔍 Search Term (formatted):', searchTerm);
    console.log('📂 Total Archived Records:', this.allArchivedRecords?.length);
    console.log('📂 All Records:', JSON.stringify(this.allArchivedRecords));

    if (!searchTerm) {
        console.log('⚠️ Search term is empty. Restoring all records.');
        this.archivedRecords = [...this.allArchivedRecords];
        console.log(
            '✅ Displaying Records:',
            this.archivedRecords.length
        );
        return;
    }
    this.archivedRecords = this.allArchivedRecords.filter(file => {
        const fileName = file.Name ? file.Name.toLowerCase() : '';
        const fileType = file.Type ? file.Type.toLowerCase() : '';
        const participantName = file.Type ? file.ParticipantName.toLowerCase() : '';
        const isMatch =
            fileName.includes(searchTerm) ||
            fileType.includes(searchTerm) || 
            participantName.includes(searchTerm);

        console.log(
            `📄 File: ${file.Name} | Type: ${file.Type} | Search: ${searchTerm} | Match: ${isMatch}`
        );

        return isMatch;
    });
    console.log(
        '✅ Filtered Records Count:',
        this.archivedRecords.length
    );
    console.log(
        '✅ Filtered Records:',
        JSON.stringify(this.archivedRecords)
    );
}

handleArchiveDownload(event) {
    event.preventDefault();

    const fileUrl = event.currentTarget.dataset.url;

    console.log('⬇️ Download URL:', fileUrl);

    fetch(fileUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
            return response.blob();
        })
        .then(blob => {

            const downloadUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = downloadUrl;

            // Extract filename from URL
            const fileName = fileUrl
                .split('/')
                .pop()
                .split('?')[0];

            link.download = fileName;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(downloadUrl);

            console.log('✅ Download started:', fileName);
        })
        .catch(error => {
            console.error('❌ Download failed:', error);
        });
}
    _pendingRoute = null;
    _suppressEmit = false;
    _lastSubRoute = '';
    
    _syncRouteTimeout;
    _syncRecordRoute() {
        if (this._suppressEmit) return;
        if (this._syncRouteTimeout) {
            clearTimeout(this._syncRouteTimeout);
        }
        this._syncRouteTimeout = setTimeout(() => {
            if (this._suppressEmit) return;
            const route = this._composeSubRoute();
            if (!route || route === this._lastSubRoute) return;
            this._lastSubRoute = route;
            this.dispatchEvent(new CustomEvent('subrouteupdate', {
                detail: { subView: route, replace: false },
                bubbles: true,
                composed: true
            }));
        }, 50);
    }

    _composeSubRoute() {
        if (this.archiveModal) {
            return 'participant/archived-document';
        }
        if (this.isEdit && this.recordId) {
            let doc = this.findDocById(this.recordId);
            return doc && doc.Participant_Doc_UID__c ? `participant/${doc.Participant_Doc_UID__c}/edit` : 'participant';
        }        
        if (this.assignmentFlag && this.currentDocumentId) {
            let doc = this.findDocById(this.currentDocumentId);
            return doc && doc.Participant_Doc_UID__c ? `participant/${doc.Participant_Doc_UID__c}/share` : 'participant';
        }
        if (this.isModalOpen && this.currentUrl) {
            let doc = this.findDocByUrl(this.currentUrl);
            return doc && doc.Participant_Doc_UID__c ? `participant/${doc.Participant_Doc_UID__c}/preview` : 'participant';
        }
        return 'participant';
    }

    findDocById(id) {
        if (this.participantList) {
            for (let part of this.participantList) {
                if (part.Attachments__r) {
                    let doc = part.Attachments__r.find(d => d.Id === id);
                    if (doc) return doc;
                }
            }
        }
        if (this.allArchivedRecords) {
            let doc = this.allArchivedRecords.find(d => d.Id === id);
            if (doc) return doc;
        }        
        return null;
    }

    findDocByUrl(url) {
        if (this.participantList) {
            for (let part of this.participantList) {
                if (part.Attachments__r) {
                    let doc = part.Attachments__r.find(d => d.Awsurl__c === url);
                    if (doc) return doc;
                }
            }
        }
        if (this.allArchivedRecords) {
            let doc = this.allArchivedRecords.find(d => d.FileUrl === url || d.Awsurl__c === url);
            if (doc) return doc;
        }        
        return null;
    }

    @api async openByUID(uid, tab, isEdit) {
        this._suppressEmit = true;
        try {
            console.log('participantDocumentsLwc openByUID:', uid, tab, isEdit);
            this.closeModalsAndPanels();
            
            if (uid === 'archived-document') {
                this.archiveModal = true;
            } else if (uid && uid.startsWith('partdoc-')) {
                let foundDoc = null;
                let parentParticipant = null;
                if (this.participantList) {
                    for (let part of this.participantList) {
                        if (part.Attachments__r) {
                            foundDoc = part.Attachments__r.find(d => d.Participant_Doc_UID__c === uid || d.Id === uid);
                            if (foundDoc) {
                                parentParticipant = part;
                                break;
                            }
                        }
                    }
                }

                
                if (!foundDoc) {
                    if (!this.allArchivedRecords || this.allArchivedRecords.length === 0) {
                        try {
                            await this.loadArchivedFiles();
                        } catch (e) {
                            console.error(e);
                        }
                    }
                    if (this.allArchivedRecords) {
                        foundDoc = this.allArchivedRecords.find(d => d.Participant_Doc_UID__c === uid || d.Id === uid);
                        if (foundDoc && !foundDoc.Awsurl__c) {
                            foundDoc.Awsurl__c = foundDoc.FileUrl;
                        }
                    }
                }                
                if (foundDoc) {
                    this.currentDocumentId = foundDoc.Id;
                    
                    if (tab === 'edit' || isEdit) {
                        this.recordId = foundDoc.Id;
                        this.isEdit = true;
                    } else if (tab === 'share') {
                        this.selectedStaffIds = [];
                        // this.loadStaffByDoc(this.currentDocumentId);
                        this.loadShareData(this.currentDocumentId);
                        this.assignmentFlag = true;
                    } else if (tab === 'preview' || !tab) {
                        this.currentUrl = foundDoc.Awsurl__c;
                        this.isModalOpen = true;
                        this.isHome = false;
                        this.archiveModal = false;
                    }
                } else {
                    this._pendingRoute = { uid, tab, isEdit };
                }
            }
            this._lastSubRoute = this._composeSubRoute();
        } finally {
            this._suppressEmit = false;
        }
    }

    closeModalsAndPanels() {
        this.archiveModal = false;
        this.assignmentFlag = false;
        this.isModalOpen = false;
        this.isHome = true;
    }

@track highlightedAvailableRoles = [];
@track highlightedSelectedRoles = [];
initialSharedIds = [];

// ---------------------------------------------------------------------
// 3) ADD getters
// ---------------------------------------------------------------------
get availableRoleOptions() {
    return this.roleOptions
        .filter(r => !this.selectedRoles.includes(r.value))
        .map(r => ({
            ...r,
            cssClass: this.highlightedAvailableRoles.includes(r.value)
                ? 'role-item selected' : 'role-item'
        }));
}

get selectedRoleOptions() {
    return this.roleOptions
        .filter(r => this.selectedRoles.includes(r.value))
        .map(r => ({
            ...r,
            cssClass: this.highlightedSelectedRoles.includes(r.value)
                ? 'role-item selected' : 'role-item'
        }));
}

get disableMoveRight() { return this.highlightedAvailableRoles.length === 0; }
get disableMoveLeft()  { return this.highlightedSelectedRoles.length === 0; }
get hasSelectedRoles() { return this.selectedRoles.length > 0; }

get filteredStaffFull() {
    const key = (this.staffSearchKey || '').toLowerCase().trim();
    return this.allStaffList
        .filter(s => this.selectedRoles.includes(s.role))
        .filter(s =>
            !key ||
            (s.name  || '').toLowerCase().includes(key) ||
            (s.role  || '').toLowerCase().includes(key) ||
            (s.email || '').toLowerCase().includes(key)
        );
}

get staffTotalRecords() { return this.filteredStaffFull.length; }

get staffTotalPages() {
    return Math.max(1, Math.ceil(this.staffTotalRecords / this.staffPageSize));
}

get staffCurrentPage() {
    return Math.min(this.staffPageNumber, this.staffTotalPages);
}

get filteredStaffUsers() {                       // current page rows
    const start = (this.staffCurrentPage - 1) * this.staffPageSize;
    return this.filteredStaffFull
        .slice(start, start + this.staffPageSize)
        .map(s => ({ ...s, isSelected: this.selectedStaffIds.includes(s.Id) }));
}

get allVisibleStaffSelected() {                  // header checkbox = current page only
    const rows = this.filteredStaffUsers;
    return rows.length > 0 && rows.every(s => s.isSelected);
}

get bDisableStaffFirst() { return this.staffCurrentPage === 1; }
get bDisableStaffLast()  { return this.staffCurrentPage === this.staffTotalPages; }

get staffPageSizeOptions() {
    return [10, 25, 50, 75, 100].map(n => ({
        label: String(n),
        value: String(n),
        selected: n === this.staffPageSize
    }));
}

get saveButtonDisable() {
    const a = new Set(this.initialSharedIds);
    const b = new Set(this.selectedStaffIds);
    return a.size === b.size && [...a].every(id => b.has(id));
}

// ---------------------------------------------------------------------
// 4) ADD / REPLACE methods
// ---------------------------------------------------------------------
handleShare(event) {
    this.currentDocumentId = event.currentTarget.dataset.id;
    this.resetShareState();
    this.loadShareData(this.currentDocumentId);
    this.assignmentFlag = true;
    this._syncRecordRoute();
}

resetShareState() {
    this.allStaffList = [];
    this.roleOptions = [];
    this.selectedRoles = [];
    this.highlightedAvailableRoles = [];
    this.highlightedSelectedRoles = [];
    this.selectedStaffIds = [];
    this.initialSharedIds = [];
    this.staffSearchKey = '';
    this.staffPageNumber = 1;
}

loadShareData(docId) {
    Promise.all([
        getParticipantShareStaffUsers(),
        fetchStaffByDoc({ docId })
    ])
    .then(([users, alreadyShared]) => {

        // no Staff record -> cannot be shared -> skip
        this.allStaffList = (users || [])
            .filter(u => u.staffId)
            .map(u => ({
                Id: u.staffId,
                userId: u.userId,
                name: u.userName,
                role: u.userType,
                email: u.email || ''
            }));

        // roles: fixed order, only those present
        const present = new Set(this.allStaffList.map(s => s.role));
        const roles = ROLE_ORDER.filter(r => present.has(r));
        present.forEach(r => { if (!ROLE_ORDER.includes(r)) roles.push(r); });
        this.roleOptions = roles.map(r => ({ label: r, value: r }));

        // preselect already-shared staff + move their roles to "Selected"
        this.selectedStaffIds = (alreadyShared || []).map(s => s.Staff__c);
        this.initialSharedIds = [...this.selectedStaffIds];

        this.selectedRoles = [...new Set(
            this.allStaffList
                .filter(s => this.selectedStaffIds.includes(s.Id))
                .map(s => s.role)
        )];
    })
    .catch(error => {
        console.error('Grant access load error', JSON.stringify(error));
        this.showToast('Error', error?.body?.message || 'Unable to load staff', 'error');
    });
}

// ----- staff type transfer -----
handleRoleSelect(event) {
    const role = event.currentTarget.dataset.role;
    this.highlightedAvailableRoles = this.highlightedAvailableRoles.includes(role)
        ? this.highlightedAvailableRoles.filter(r => r !== role)
        : [...this.highlightedAvailableRoles, role];
}

handleSelectedRoleSelect(event) {
    const role = event.currentTarget.dataset.role;
    this.highlightedSelectedRoles = this.highlightedSelectedRoles.includes(role)
        ? this.highlightedSelectedRoles.filter(r => r !== role)
        : [...this.highlightedSelectedRoles, role];
}

moveRoleRight() {
    this.selectedRoles = [...this.selectedRoles, ...this.highlightedAvailableRoles];
    this.highlightedAvailableRoles = [];
    this.staffPageNumber = 1;
}

moveRoleLeft() {
    const removed = this.highlightedSelectedRoles;
    const removedIds = this.allStaffList
        .filter(s => removed.includes(s.role))
        .map(s => s.Id);

    this.selectedRoles = this.selectedRoles.filter(r => !removed.includes(r));
    this.selectedStaffIds = this.selectedStaffIds.filter(id => !removedIds.includes(id));
    this.highlightedSelectedRoles = [];
    this.staffPageNumber = 1;
}

// ----- search / checkbox / pagination -----
handleStaffSearch(event) {
    this.staffSearchKey = event.target.value;
    this.staffPageNumber = 1;
}

handleStaffCheckbox(event) {
    const id = event.target.dataset.id;
    this.selectedStaffIds = event.target.checked
        ? [...new Set([...this.selectedStaffIds, id])]
        : this.selectedStaffIds.filter(s => s !== id);
}

handleSelectAllStaff(event) {
    const pageIds = this.filteredStaffUsers.map(s => s.Id);
    this.selectedStaffIds = event.target.checked
        ? [...new Set([...this.selectedStaffIds, ...pageIds])]
        : this.selectedStaffIds.filter(id => !pageIds.includes(id));
}

handleStaffPageSize(event) {
    this.staffPageSize = parseInt(event.target.value, 10);
    this.staffPageNumber = 1;
}
staffFirstPage()    { this.staffPageNumber = 1; }
staffPreviousPage() { this.staffPageNumber = this.staffCurrentPage - 1; }
staffNextPage()     { this.staffPageNumber = this.staffCurrentPage + 1; }
staffLastPage()     { this.staffPageNumber = this.staffTotalPages; }

// ----- save / close -----
handleassignmentinsert() {
    saveParticipantDocShares({
        docId: this.currentDocumentId,
        staffIds: this.selectedStaffIds
    })
    .then(() => {
        this.dispatchEvent(new ShowToastEvent({
            title: 'Success',
            message: 'Document shared successfully.',
            variant: 'success'
        }));
        this.assignmentFlag = false;
        this.resetShareState();
        this._syncRecordRoute();
        this.loadParticipantDocuments();
    })
    .catch(error => {
        console.error('❌ Error saving share:', error);
        this.showToast('Error', error?.body?.message || 'Unable to save access', 'error');
    });
}

handleShareClose() {
    this.assignmentFlag = false;
    this.resetShareState();
    this._syncRecordRoute();
}

showToast(title, message, variant = 'error') {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
}

}