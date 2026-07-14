import { LightningElement, track, api } from 'lwc';
import upsertNote      from '@salesforce/apex/StaffNotesController.upsertNote';
import getNotes        from '@salesforce/apex/StaffNotesController.getNotes';
import attachNoteFiles from '@salesforce/apex/StaffNotesController.attachNoteFiles';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord }   from 'lightning/uiRecordApi';
import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";

const AWS_BASE  = 'https://tesseractapps.com';
const ENDPOINTS = { delete: `${AWS_BASE}/delete-file` };

export default class StaffNotes extends LightningElement {

    // ── public API ──────────────────────────────────────────────────────────
    @api facilityId;
    @api staffId;

    // ── note state ───────────────────────────────────────────────────────────
    @track notesList      = [];
    @track showNotesModal = false;
    @track title          = '';
    @track description    = '';
    @track isEditMode     = false;
    @track currentNoteId  = null;
    @track modalTitle     = 'Create Note';
    @track saveButtonLabel = 'Save';
    @track showSpinner    = false;

    // ── file-upload state  (mirrors Repository exactly) ──────────────────────
    @track uploadedFiles        = [];   // AWS file objects from child
    @track totalfiles           = [];   // raw File objects for size tracking
    @track isFileExpand         = false;
    @track allowMultiple        = true;
    @track documentedit         = false;
    @track isFileAttached       = false;
    @track recordIdForFileUpload = '';
             fileName           = '';
    @track isFileViewOpen = false;
    @track currentUrl     = '';


    
    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;

    get logoUrl() {
        return this.tLogoUrl;
    }

    get imageUrl() {
        return this.tImageUrl;
    }
    // ── computed ─────────────────────────────────────────────────────────────
    get hasNotes() {
        return this.notesList && this.notesList.length > 0;
    }

    // ── lifecycle ────────────────────────────────────────────────────────────
    connectedCallback() {
        this.loadNotes();
    }

    // ── data ─────────────────────────────────────────────────────────────────
    loadNotes() {
        this.showSpinner = true;
        getNotes({ staffId: this.staffId, facilityId: this.facilityId })
            .then(result => {
                this.notesList = (result || []).map(note => {
    return {
        ...note,
        Note_Attachments__r: note.Note_Attachments__r || []
    };
});
                this.showSpinner = false;
            })
            .catch(error => {
                console.error('getNotes error:', error);
                this.showSpinner = false;
            });
    }

    // ── modal open / close ───────────────────────────────────────────────────
    openCreateModal() {
        this.isEditMode          = false;
        this.modalTitle          = 'Create Note';
        this.saveButtonLabel     = 'Save';
        this.title               = '';
        this.description         = '';
        this.currentNoteId       = null;
        this.recordIdForFileUpload = '';
        this.allowMultiple       = true;
        this.documentedit        = false;
        this.isFileExpand        = false;
        this.uploadedFiles       = [];
        this.totalfiles          = [];
        this.isFileAttached      = false;
        this.fileName            = '';
        this.showNotesModal      = true;
    }

    handleEditNote(event) {
        const noteId = event.currentTarget.dataset.id;
        const note   = this.notesList.find(n => n.Id === noteId);
        this.title               = note.Title__c;
        this.description         = note.Description__c;
        this.currentNoteId       = noteId;
        this.isEditMode          = true;
        this.modalTitle          = 'Edit Note';
        this.saveButtonLabel     = 'Update';
        this.recordIdForFileUpload = noteId;   // so child shows existing attachments
        this.allowMultiple       = true;      // edit = one replacement file (same as Repository)
        this.documentedit        = true;
        this.isFileExpand        = true;       // show child immediately to display existing files
        this.uploadedFiles       = [];
        this.totalfiles          = [];
        this.isFileAttached      = false;
        this.fileName            = '';
        this.showNotesModal      = true;
    }

    handleCancel() {
        this.showNotesModal      = false;
        this.title               = '';
        this.description         = '';
        this.isEditMode          = false;
        this.currentNoteId       = null;
        this.recordIdForFileUpload = '';
        this.uploadedFiles       = [];
        this.totalfiles          = [];
        this.isFileExpand        = false;
        this.documentedit        = false;
        this.isFileAttached      = false;
        this.fileName            = '';
    }

    // ── save ─────────────────────────────────────────────────────────────────
    handleSave() {
        if (!this.title || !this.title.trim()) {
            this.showToast('Error', 'Title is required', 'error');
            return;
        }

        

        upsertNote({
            noteId      : this.currentNoteId,
            title       : this.title,
            description : this.description,
            staffId     : this.staffId,
            facilityId  : this.facilityId
        })
        .then(noteId => {
            this.recordIdForFileUpload = noteId;

            // Attach AWS files if any were uploaded — same pattern as Repository attachFiles
            if (this.uploadedFiles && this.uploadedFiles.length > 0) {
                return attachNoteFiles({
                    noteId       : noteId,
                    awsJson      : JSON.stringify(this.uploadedFiles),
                    attachmentId : ''   // always insert new attachments for notes
                });
            }
            return Promise.resolve();
        })
        .then(() => {
            this.showToast('Success', this.isEditMode ? 'Note updated' : 'Note created', 'success');
            
            this.handleCancel();
            this.loadNotes();
        })
        .catch(error => {
            console.error('handleSave error:', JSON.stringify(error));
            let msg = 'Unknown error';
            if (error.body) {
                msg = Array.isArray(error.body)
                    ? error.body.map(e => e.message).join(', ')
                    : (error.body.message || msg);
            }
            this.showToast('Error', msg, 'error');
            this.showSpinner = false;
        })
        .finally(() => {
            this.showSpinner = false;
        });
    }

    // ── field handlers ───────────────────────────────────────────────────────
    handleTitleChange(event)       { this.title       = event.target.value; }
    handleDescriptionChange(event) { this.description = event.target.value; }

    // ── drag / drop — identical to Repository ────────────────────────────────
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
    }

    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        let files = Array.from(event.dataTransfer.files || []);

        if (!this._validateFiles(files)) return;

       /*  if (this.documentedit) {
            if (this.totalfiles.length >= 1) {
                this.showToast('Error', 'Only one file can be uploaded in edit mode.', 'error');
                return;
            }
            if (files.length > 1) {
                this.showToast('Error', 'You can only upload one file in edit mode.', 'error');
                return;
            }
            files = [files[0]];
        } */

        this.totalfiles.push(...files);
        this.processFiles(files);
    }

    handleFileUploadInputChange(event) {
        let files = Array.from(event.target.files || []);

        if (!this._validateFiles(files)) {
            event.target.value = '';
            return;
        }

        /* if (this.documentedit) {
            if (this.totalfiles.length >= 1) {
                this.showToast('Error', 'Only one file can be uploaded in edit mode.', 'error');
                event.target.value = '';
                return;
            }
            if (files.length > 1) {
                this.showToast('Error', 'You can only upload one file in edit mode.', 'error');
                event.target.value = '';
                return;
            }
            files = [files[0]];
        } */

        this.totalfiles.push(...files);
        this.processFiles(files);
        event.target.value = '';
    }

    // shared validation — mirrors Repository exactly
    _validateFiles(files) {
        const longName = files.find(f => f.name.length > 180);
        if (longName) {
            this.showToast('Error', `Filename too long: "${longName.name}". Max 180 characters.`, 'error');
            return false;
        }
        const MAX = 50 * 1024 * 1024;
        const existing = this.totalfiles.reduce((s, f) => s + f.size, 0);
        const incoming = files.reduce((s, f) => s + f.size, 0);
        if (existing + incoming > MAX) {
            this.showToast('Error', 'Total file size cannot exceed 50 MB.', 'error');
            return false;
        }
        return true;
    }

    // identical to Repository processFiles
    processFiles(files) {
        if (!files || !files.length) return;

        setTimeout(() => {
            this.isFileExpand = true;

            setTimeout(() => {
                const svc = this.template.querySelector('c-document-office-service');
                if (!svc) {
                    console.warn('c-document-office-service not found.');
                    return;
                }
                svc.incomingFiles = files;
            }, 1000);
        }, 0);
    }

    triggerFileInput() {
        const input = this.template.querySelector('input[type="file"]');
        if (input) {
            input.value = '';
            input.click();
        }
    }

    // ── child component callbacks — identical to Repository ──────────────────
    handleAwsUploadComplete(evt) {
        try {
            const { files = [] } = evt.detail || {};
            if (!files.length) { console.warn('No files in AWS payload.'); return; }

            this.uploadedFiles  = files;
            this.fileName       = files.map(f => f?.originalName).filter(Boolean).join(', ');
            this.isFileAttached = true;
            console.log('AWS upload complete, files:', JSON.stringify(this.uploadedFiles));
        } catch (e) {
            console.error('handleAwsUploadComplete error:', e);
        }
    }

    handleFileDeleted(event) {
        const { key, fileId, files } = event.detail;
        console.log('File deleted. Key:', key, 'FileId:', fileId);

        this.uploadedFiles = this.uploadedFiles.filter(f => f.fileId !== fileId);
        this.totalfiles    = [];

        if (!files || files.length === 0) {
            this.isFileExpand = false;
            this.fileName     = '';
        }
    }

    handlefilecancel(event) {
        console.log('Cancel from child:', event.detail?.message);
        this.totalfiles = [];
    }

    // ── attachment view / delete ─────────────────────────────────────────────
   handleViewAttachment(event) {
    event.preventDefault();
    event.stopPropagation();  
    this.currentUrl     = event.currentTarget.dataset.url;
    this.isFileViewOpen = true;
    this.showNotesModal = false;   // close modal if open
    }

    closeFileView() {
        this.isFileViewOpen = false;
        this.currentUrl     = '';
    }

    handleDeleteNoteAttachment(event) {
        const attachmentId = event.currentTarget.dataset.id;
        const key          = event.currentTarget.dataset.key;

        // Step 1 — delete Salesforce record (same as Repository handleDeleteattachment)
        deleteRecord(attachmentId)
            .then(() => {
                this.showToast('Success', 'Attachment deleted successfully', 'success');
                // Step 2 — delete from AWS
                this._deleteFromAWS(key);
                // Step 3 — refresh list
                this.loadNotes();
            })
            .catch(error => {
                console.error('Delete attachment error:', error);
                this.showToast('Error', 'Failed to delete attachment', 'error');
            });
    }

    // identical to Repository deleteFile
    async _deleteFromAWS(key) {
        if (!key) return;
        try {
            const resp = await fetch(ENDPOINTS.delete, {
                method  : 'DELETE',
                headers : { 'Content-Type': 'application/json' },
                body    : JSON.stringify({ key })
            });
            const text = await resp.text();
            let json;
            try { json = JSON.parse(text); } catch { json = null; }
            if (!resp.ok) throw new Error(json?.error || `Delete failed ${resp.status}`);
            console.log('AWS delete success:', json);
        } catch (e) {
            console.error('AWS delete error:', e);
        }
    }

    // ── toast ────────────────────────────────────────────────────────────────
    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}