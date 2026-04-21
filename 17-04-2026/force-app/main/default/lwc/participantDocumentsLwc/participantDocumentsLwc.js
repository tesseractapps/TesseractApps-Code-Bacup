import { LightningElement, track, api } from 'lwc';
import fetchParticipantDocs from '@salesforce/apex/StaffController.fetchParticipantDocs';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import saveParticipantDocShares from '@salesforce/apex/ClientAttachmentHandler.saveParticipantDocShares';
import fetchStaffByDoc from '@salesforce/apex/ClientAttachmentHandler.fetchStaffByDoc';

export default class ParticipantDocumentsLwc extends LightningElement {
   
    @track participantList = [];
    @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number   
    @track records = []; 
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
        this.pageSize = this.pageSizeOptions[0];
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
        this.participantList = this.participantList.map(participant =>
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
    paginationHelper() {
        this.participantList = [];
        if(this.totalRecords>0) {
        this.noRecordsFlag=false;
        }else{
        this.noRecordsFlag=true;
        } 
        // calculate total pages
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        // set page number 
        if (this.pageNumber <= 1) {
        this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
        this.pageNumber = this.totalPages;
        }
        // set records to display on current page
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
        if (i === this.totalRecords) {
            break;
        }
        let record = { ...this.filteredList[i] }; // shallow copy

        this.participantList.push(record);
        }

        console.log('this.participantList:', JSON.stringify(this.participantList)); 

    }

     handleView(event) {
    event.preventDefault(); 
    const url = event.currentTarget.dataset.url;
    this.currentUrl = url;
     console.log('file url  '+ this.currentUrl);  
    this.isModalOpen = true;
    this.isHome=false;
    }

    handleback() {
        this.isModalOpen = false;
        this.currentUrl = null;
        this.isHome = true;
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

            this.staffOptions = (result || []).map(staff => ({
                label: staff.Display_Nickname__c,
                value: staff.Id
            }));

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

}