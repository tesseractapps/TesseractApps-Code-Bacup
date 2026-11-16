import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';



// Static resources
import docxEditorReact from '@salesforce/resourceUrl/docxEditorReact';

export default class WordEditorReact extends LightningElement {

    @api title = 'Untitled Document';
    @api contentVersionId;

    @track isLoading = false;
    @track loadingMessage = 'Initializing...';
    @track isDocumentLoaded = false;
    

    wiredFilesResult;
    pendingBase64Data = null;
    isEditorIframeReady = false;

    placeholders = [
    { label: 'Full Name', value: '{{FullName}}' },
    { label: 'First Name', value: '{{FirstName}}' },
    { label: 'Last Name', value: '{{LastName}}' },
    { label: 'Email', value: '{{Email}}' },
    { label: 'Department', value: '{{Department}}' },
    { label: 'Designation', value: '{{Designation}}' },
    { label: 'Employee ID', value: '{{EmployeeId}}' }
];

handleInsertPlaceholder(event) {

    const placeholder =
        event.target.dataset.value;

    const iframe =
        this.template.querySelector('iframe');

    if (iframe && iframe.contentWindow) {

        iframe.contentWindow.postMessage({
            type: 'INSERT_PLACEHOLDER',
            value: placeholder
        }, '*');

        console.log(
            'Sent placeholder:',
            placeholder
        );
    }
}

    // Computed properties
    get reactAppUrl() {
        return `${docxEditorReact}/index.html`;
    }

    get hasLinkedFiles() {
        return this.linkedFiles && this.linkedFiles.length > 0;
    }

    // Lifecycle
    connectedCallback() {
        window.addEventListener('message', this.handleWindowMessage);
    
    }

    disconnectedCallback() {
        window.removeEventListener('message', this.handleWindowMessage);
    }





    // Iframe loaded event
    handleIframeLoaded() {
        console.log('Iframe element loaded in LWC');
    }

    // Message receiver from Iframe
    handleWindowMessage = (event) => {
        const data = event.data;
        if (!data || !data.type) return;

        console.log('LWC received postMessage:', data.type);

        if (data.type === 'EDITOR_READY') {
            this.isEditorIframeReady = true;
            this.sendDocumentToIframe();
        } else if (data.type === 'SAVE_DOCUMENT') {
            this.downloadDocx(data.base64);
        }
    };

    // Send the loaded document to React inside the iframe
    sendDocumentToIframe() {
        const iframe = this.template.querySelector('iframe');
        if (iframe && iframe.contentWindow) {
            console.log('Sending LOAD_DOCUMENT to iframe, base64 size:', this.pendingBase64Data ? this.pendingBase64Data.length : 0);
            iframe.contentWindow.postMessage({
                type: 'LOAD_DOCUMENT',
                base64: this.pendingBase64Data // Will be null for a blank document
            }, '*');
            this.isLoading = false;
        } else {
            console.warn('Iframe window is not accessible to send document.');
        }
    }

downloadDocx(base64Data) {
    try {

        const byteCharacters = atob(base64Data);

        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);

        const blob = new Blob(
            [byteArray],
            {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');

        link.href = url;

        link.download = this.loadedFileName || 'Document.docx';

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        this.showToast(
            'success',
            'Document downloaded successfully.'
        );

    } catch(error) {

        console.error(error);

        this.showToast(
            'error',
            error.message
        );
    }
}

    // UI Action: Create blank document
    handleCreateBlank() {
        this.loadedVersionId = '';
        this.loadedFileName = 'Untitled Document.docx';
        this.pendingBase64Data = null; // Tells React to load blank
        this.isEditorIframeReady = false;
        this.isDocumentLoaded = true;
        this.isLoading = true;
        this.loadingMessage = 'Creating blank document...';
    }



    // UI Action: Load local file directly into memory
    handleLocalFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.isLoading = true;
        this.loadingMessage = `Reading ${file.name}...`;

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            
            // Set up state for editor
            this.loadedVersionId = ''; // It is a new upload, so no original version ID yet
            this.loadedFileName = file.name;
            this.pendingBase64Data = base64;
            this.isEditorIframeReady = false;
            this.isDocumentLoaded = true;
            this.isLoading = true;
            this.loadingMessage = 'Loading document into editor...';
        };
        reader.onerror = (error) => {
            console.error('File reading error:', error);
            this.showToast('error', 'Failed to read local file: ' + error.message);
            this.isLoading = false;
        };
        reader.readAsDataURL(file);
    }

    // UI Action: Rename file in header
    handleFileNameChange(event) {
        this.loadedFileName = event.target.value;
    }

    // UI Action: Go back to dashboard list
    handleCloseEditor() {
        this.isDocumentLoaded = false;
        this.loadedVersionId = '';
        this.loadedFileName = '';
        this.pendingBase64Data = null;
        this.isEditorIframeReady = false;
        
    }

    // Toast Utility
    showToast(variant, message) {
        const event = new ShowToastEvent({
            title: variant.charAt(0).toUpperCase() + variant.slice(1),
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }

    // Size formatting helper
    formatBytes(bytes, decimals = 2) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}