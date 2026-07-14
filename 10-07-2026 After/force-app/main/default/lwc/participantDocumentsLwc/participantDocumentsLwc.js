import { LightningElement, track, api } from 'lwc';
import fetchParticipantDocs from '@salesforce/apex/StaffController.fetchParticipantDocs';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import saveParticipantDocShares from '@salesforce/apex/ClientAttachmentHandler.saveParticipantDocShares';
import fetchStaffByDoc from '@salesforce/apex/ClientAttachmentHandler.fetchStaffByDoc';
import fetchStaffOptions from '@salesforce/apex/StaffController.fetchStaffDocuments';
import archiveAttachment from '@salesforce/apex/ClientAttachmentHandler.archiveAttachment';
import restoreAttachment from '@salesforce/apex/ClientAttachmentHandler.restoreAttachment';
import getAllArchivedParticipantAttachments from '@salesforce/apex/ClientAttachmentHandler.getAllArchivedParticipantAttachments';

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
         this.loadStaffOptions();
    }

    loadStaffOptions() {
    fetchStaffOptions()
        .then(result => {
            console.log('Result:', result);

            this.staffOptions = result.map(staff => ({
                label: staff.NameToDisplay__c || staff.Name,
                value: staff.Id
            }));

        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

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

            // Build Participant List with formatted docs
            this.participantList = result.map(participant => ({
                ...participant,
                expand: false, // default collapsed
                docCount: participant.Attachments__r ? participant.Attachments__r.length : 0,
                statusClass: participant.Status__c === true ? 'status-dot active' : 'status-dot inactive',

                // Format each attachment
                Attachments__r: (participant.Attachments__r || []).map(doc => ({
                    ...doc,
                    FormattedDate: this.formatDate(doc.Date__c)
                }))
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
        })
        .catch(error => {
            console.error('Error fetching participant docs:', error);
        });
    }


    // applyFilters() {
    //     let data = [...this.records];
    //     console.log('data:', JSON.stringify(data));

    //     // ACTIVE STAFF ONLY
    //      if (this.activeFilterOn) {
    //     data = data.filter(participant => participant.Status__c === true);
    //     }

    //     // INACTIVE STAFF ONLY
    //     if (this.inactiveFilterOn) {
    //     data = data.filter(participant => participant.Status__c === false);
    //     }


    //     // SEARCH FILTER
    //     if (this.searchKey && this.searchKey.length > 0) {
    //     data = data.filter(participant =>
    //     (participant.Display_Nickname__c || '').toLowerCase().includes(this.searchKey)
    //     );
    //     }
    //     console.log('data...:', JSON.stringify(data));

    //     // SET FILTERED RESULTS
    //     this.filteredList = data;
    //     this.totalRecords = this.filteredList.length;

    //     this.pageNumber = 1;
    //     this.paginationHelper();
    // }

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
}

handleShare(event) {
    console.log('🔥 handleShare clicked');
    this.currentDocumentId = event.currentTarget.dataset.id;
    console.log('DocId:', this.currentDocumentId);
    this.assignmentFlag = true;
    console.log('assignmentFlag:', this.assignmentFlag);
    this.loadStaffByDoc(this.currentDocumentId);
}

 loadStaffByDoc(docId) {
    fetchStaffByDoc({ docId: docId })
        .then(result => {

            console.log('🟢 Staff fetched:', JSON.stringify(result));

           /*  this.staffOptions = (result || []).map(staff => ({
                label: staff.Display_Nickname__c,
                value: staff.Id
            })); */

             const selectedIds = (result || []).map(staff => staff.Staff__c);

            // 🔹 Set selected (RIGHT side)
            this.selectedStaffIds = selectedIds;

        })
        .catch(error => {
            console.error('❌ Error fetching staff:', error);
        });
} 

handleStaffChange(event) {
    this.selectedStaffIds = event.detail.value;

    console.log('🟡 Selected Staff:', JSON.stringify(this.selectedStaffIds));
}

handleassignmentinsert() {

    console.log('🔵 Saving Share');
    console.log('DocId:', this.currentDocumentId);
    console.log('StaffIds:', JSON.stringify(this.selectedStaffIds));

    if (!this.selectedStaffIds || this.selectedStaffIds.length === 0) {
        alert('Please select at least one staff');
        return;
    }

    saveParticipantDocShares({
        docId: this.currentDocumentId,
        staffIds: this.selectedStaffIds
    })
    .then(() => {

        console.log('🟢 Share Success');

        this.assignmentFlag = false;
        this.selectedStaffIds = [];

        // optional refresh
        this.loadParticipantDocuments();
    })
    .catch(error => {
        console.error('❌ Error saving share:', error);
    });
}

handleShareClose() {
    this.assignmentFlag = false;
    this.selectedStaffIds = [];
}

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
        const isMatch =
            fileName.includes(searchTerm) ||
            fileType.includes(searchTerm);

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

}