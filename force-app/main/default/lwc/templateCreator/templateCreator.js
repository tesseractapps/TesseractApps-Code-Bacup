import { LightningElement, track, api, wire } from 'lwc';
import pdfjsLib from '@salesforce/resourceUrl/pdfJS';
import pdfWorker from '@salesforce/resourceUrl/pdfWorker';
import { loadScript } from 'lightning/platformResourceLoader';
import createOfferTemplate from '@salesforce/apex/TemplateController.createOfferTemplate';
import uploadFileToAWS from '@salesforce/apex/TeSignAWSUploadController.uploadFile';
import getUploadedFileUrl from '@salesforce/apex/TemplateController.getUploadedFileUrl';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import savePlaceholders from '@salesforce/apex/TemplateController.savePlaceholders';
import getPlaceholders from '@salesforce/apex/TemplateController.getPlaceholders';
import sendRecordEmail from '@salesforce/apex/TemplateController.sendRecordEmail';
import saveEmailsToBackend from '@salesforce/apex/TemplateController.saveEmailsToBackend';
import updateCurrentRecipient from '@salesforce/apex/TemplateController.updateCurrentRecipient';
import startEmailSequence from '@salesforce/apex/TemplateController.startEmailSequence';
import advanceEmailSequence from '@salesforce/apex/TemplateController.advanceEmailSequence';
import updateRecordWithAWSUrl from '@salesforce/apex/TemplateController.updateRecordWithAWSUrl';
import TeSignLogo from '@salesforce/resourceUrl/Te_sign';
import mammothJs from '@salesforce/resourceUrl/mammothJs';
import jsPDF from '@salesforce/resourceUrl/jspdf';
import html2canvasLib from '@salesforce/resourceUrl/html2canvas';
import getTSignURL from '@salesforce/apex/TemplateController.getTSignURL';
import { subscribe, createMessageContext } from 'lightning/messageService';
import TSIGN_MESSAGE_CHANNEL from '@salesforce/messageChannel/TsignMessageChannel__c';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';

export default class TemplateCreator extends LightningElement {
    @track fileName = ''; 
    @track selectedFile = null; 
    @track isLoading = false; 
    @track  recordId=''
    @track awsUrl = ''; 
    @track isFileAttached=false
    @track selectedFilesToUpload = []; //store selected files
    @track showSpinner = false; 
    @track fileName;
    @track doc;
    @track fileSize;
    @track isattachError=false;
    @track recipientEmails = [{ key: 0, label: 'New Joinee Email (Required)', email: '', canRemove: false }];
    @track currentRecipient = '';
    @track currentRecipientStatus = '';
    @track showRecipientModal = false; 
    @track selectedRecipient = null; 
    @track newPlaceholder = null; d
    @track isLoadingCircle = false;
    @track showSuccessScreen = false;
    @track isConfirmationPopupVisible = false;
    @api orgid;
    context = createMessageContext(); // Create LMS context
    @track tsignreUrl = '';
    file; //holding file instance
    myFile;    
    fileType;//holding file type
    fileReaderObj;
    base64FileData;
    pdfDoc = null; // PDF document reference
    pdfLoaded = false; // Prevents reloading PDFs
    @api imageSrc = ''; // Base64 image source
    @track imageSrcs = []; // Stores Base64 images for multi-page display
    @api currentPage = 1; // Current page for pagination
    @api totalPages = 0; // Total number of pages in the PDF
    @track placeholders = []; // List of placeholders
    @track draggedType = null; // Type of placeholder being dragged
    @track currentDraggedPlaceholder = null; // Placeholder currently being dragged
    @track recipientEmails = [
        {
            key: 0,
            label: 'New Joinee Email*',
            email: '',
            canRemove: false // New joinee email cannot be removed
        }
    ];
    nextRecipientKey = 1;
    logo = TeSignLogo;
    

    getPlaceholderStyle(placeholder) {
        // Ensure values are numbers and return valid CSS
        return `top: ${placeholder.y || 0}px; left: ${placeholder.x || 0}px; position: absolute;`;
    }
    
    get placeholdersForCurrentPage() {
        return this.placeholders.filter(placeholder => placeholder.page === this.currentPage);
    }

    getRowKey(index) {
        return `row-${index}`;
    }
    
    getRecipientLabel(index) {
        return `Recipient ${index + 1}`;
    }
    
    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;

    get logoUrl() {
        return this.tLogoUrl;
    }

    get imageUrl() {
        return this.tImageUrl;
    }
    

    @api tsignReurl = '';
    @api serviceId = '';
    async connectedCallback() {
        console.log('TeSignLogo URL:', this.logo);
        console.log('📌 AWS URL received in Tsign via Parent Component:', this.tsignReurl);
        console.log('📌 Received Org ID:', this.orgid);
        console.log('📌 Received Service Agreement ID:', this.serviceId);
    
        this.subscribeToMessageChannel();
    
        try {
            await this.loadPdfLibraries();
            console.log('✅ PDF.js and worker script loaded successfully');
    
            // ✅ Add a small delay to ensure libraries are fully loaded into window
            await this.sleep(300); // Wait for 300 milliseconds
    
            getTSignURL()
                .then((data) => {
                    this.tsignUrl = data; // Store the URL from custom metadata
                })
                .catch((error) => {
                    console.error('Error fetching TSign URL from metadata:', error);
                });
    
            if (this.tsignReurl) {
                console.log('📌 Detected AWS URL in Tsign:', this.tsignReurl);
                this.redirectservice(this.tsignReurl);
            }
        } catch (error) {
            console.error('Error loading PDF libraries:', error);
            this.handleError('Failed to load PDF libraries.', error);
        }
    }
    
    // 💤 Helper function to create a delay
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    

    // redirectservice() {

    //     console.log('📌 Redirecting with TSign URL:', this.tsignReurl);

    //     if (this.tsignReurl) {

    //         // Extract filename from the URL

    //         const urlParts = this.tsignReurl.split('/');

    //         this.fileName = urlParts[urlParts.length - 1]; // Get last part of URL

    //         console.log('📌 Extracted Filename:', this.fileName);

    //         this.isFileUploaded = true; // Ensure the template section loads

    //         this.handleSaveAndUpload(); // Invoke file processing

    //     }

    // }




    redirectservice() {
    console.log('📌 Redirecting with TSign URL:', this.tsignReurl);

    if (this.tsignReurl) {
        const urlParts = this.tsignReurl.split('/');
        this.fileName = urlParts[urlParts.length - 1]; // Extract filename
        console.log('📌 Extracted Filename:', this.fileName);

        const fileExtension = this.fileName.split('.').pop().toLowerCase();

        if (fileExtension === 'docx') {
            console.log('📌 Detected DOCX file. Converting to PDF...');
            this.fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            this.fetchDocxAndConvert(this.tsignReurl); // Fetch + Convert to PDF
        } else if (fileExtension === 'pdf') {
            console.log('📌 Detected PDF file. Saving directly...');
            this.fileType = 'application/pdf';
            this.awsUrl = this.tsignReurl;
            this.isFileUploaded = true;
            this.handleSaveAndUpload(); // ✅ Directly save
        } else {
            this.showToast('Error', 'Unsupported file format received.', 'error');
        }
    }
}

fetchDocxAndConvert(url) {
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            this.file = new File([blob], this.fileName, {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });
            this.convertWordToPdf(); // ✅ Send for conversion
        })
        .catch(error => {
            console.error('❌ Failed to fetch DOCX file:', error);
            this.showToast('Error', 'Unable to fetch and convert Word file.', 'error');
        });
}


    subscribeToMessageChannel() {
        console.log("✅ Subscribing to LMS in Tsign LWC...");
    
        subscribe(this.context, TSIGN_MESSAGE_CHANNEL, (message) => {
            if (message.tsignreUrl && message.recordId) {
                console.log('📌 AWS URL received in Tsign:', message.tsignreUrl);
                console.log('📌 Service Agreement ID received in Tsign:', message.recordId);
    
                // ✅ Update values ONLY IF LMS sends data
                this.tsignReurl = message.tsignreUrl || this.tsignReurl;
                this.serviceId = message.recordId || this.serviceId;
    
                console.log('✅ Updated Service Agreement ID in Tsign:', this.serviceId);
            } else {
                console.warn('⚠️ Missing data in LMS message:', message);
            }
        });
    }
    

    
    
    
    async loadPdfLibraries() {
        try {
            await loadScript(this, pdfjsLib);
            await loadScript(this, pdfWorker);
            
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
    
            // Load Mammoth.js dynamically
            if (!mammothJs) {
                throw new Error('Mammoth.js is not available.');
            }
            await loadScript(this, mammothJs);
            console.log('Mammoth.js loaded successfully.');
            console.log('Mammoth.js:', mammothJs);
            await loadScript(this, jsPDF);
            await loadScript(this, html2canvasLib);
        console.log('jsPDF and html2canvas libraries loaded successfully.');

        } catch (error) {
            throw new Error('Error while loading libraries: ' + error.message);
        }
    }
    

    renderedCallback() {
        if (this.awsUrl && !this.pdfLoaded) {
            this.loadPdf(this.awsUrl);
            this.pdfLoaded = true;
    
            // Retrieve saved placeholders after loading the PDF
            //this.retrievePlaceholders();
        }
    }
    
    handleFileUploadSuccess() {
        this.isFileAttached = true;
        // other logic to handle successful file upload
    }
    
    
    handleFileNameChange(event) {
        this.fileName = event.target.value;
    }


    //ONLY PDF FILES

    // onFileUpload(event) {
    //     this.isattachError = false;
    //     const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    
    //     if (event.target.files.length > 0) {
    //         this.showSpinner = true;
    //         this.selectedFilesToUpload = event.target.files;
    //         this.file = this.selectedFilesToUpload[0];
    //         this.fileName = this.file.name.replace(/\s+/g, ""); // Remove spaces
    //         this.fileType = this.file.type;
    //         this.fileSize = this.file.size;
    
    //         // Allow only PDF files
    //         if (this.fileType !== 'application/pdf') {
    //             this.showToast('Error', 'Only PDF files are allowed.', 'error');
    //             this.showSpinner = false;
    //             this.isLoading = false;
    //             return;
    //         }
    
    //         // Check file size constraint (Max: 5MB)
    //         if (this.fileSize > MAX_FILE_SIZE) {
    //             this.showToast('Error', 'File size must be 5MB or smaller.', 'error');
    //             this.showSpinner = false;
    //             this.isLoading = false;
    //             return;
    //         }
    
    //         // Process the PDF file
    //         this.processPdfFile();
    //     }
    
    //     this.showSpinner = false;
    //     console.log('fileName>>', JSON.stringify(this.base64FileData));
    // }
    
    







//ACCEPTS PDF AND WORD
onFileUpload(event) {
    this.isattachError = false;

    if (event.target.files.length > 0) {
        this.showSpinner = true;
        this.selectedFilesToUpload = event.target.files;
        this.file = this.selectedFilesToUpload[0];
        this.fileName = this.file.name.replace(/\s+/g, ""); // Remove spaces
        this.fileType = this.file.type;
        this.fileSize = this.file.size;

        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

        // ✅ Validate file size (less than 5MB)
        if (this.fileSize > MAX_FILE_SIZE) {
            this.showToast('Error', 'File size must be 5MB or smaller.', 'error');
            this.showSpinner = false;
            this.isLoading = false;
            return;
        }

        // ✅ Check if the file is a PDF or Word document
        if (this.fileType === 'application/pdf') {
            console.log('📌 Processing PDF file:', this.fileName);
            this.processPdfFile(); // ✅ Process PDF
        } else if (this.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            console.log('📌 Processing Word file:', this.fileName);
            this.convertWordToPdf(); // ✅ Convert Word to PDF
        } else {
            this.showToast('Error', 'Only PDF and Word files are allowed.', 'error');
            this.showSpinner = false;
            this.isLoading = false;
            return;
        }
    }

    this.showSpinner = false;
    console.log('📌 File Uploaded:', this.fileName);
}

    
    processPdfFile() {
        this.fileReaderObj = new FileReader();
    
        this.fileReaderObj.onloadend = (() => {
            let fileContents = this.fileReaderObj.result;
            fileContents = fileContents.substr(fileContents.indexOf(',') + 1);
    
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
    
            this.myFile = new File(byteArrays, this.fileName, { type: this.fileType });
    
            let reader = new FileReader();
            reader.onloadend = (() => {
                let base64data = reader.result;
                this.base64FileData = base64data.substr(base64data.indexOf(',') + 1);
                this.handleSaveAndUpload();
            });
            reader.readAsDataURL(this.myFile);
        });
    
        this.fileReaderObj.readAsDataURL(this.file);
    }
    
    async convertWordToPdf() {
        this.isLoading = true;
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64WordFile = reader.result.split(',')[1]; // Extract base64 data
    
                if (!base64WordFile) {
                    console.error('Error: Base64 conversion failed');
                    this.showToast('Error', 'Failed to convert Word document to Base64.', 'error');
                    return;
                }
    
                console.log('📌 Sending Base64 Word file to API');
                this.showSpinner = true;
    
                // API Call Directly from JS
                fetch('https://tesseractapps.com/word-to-pdf', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        recordId: this.orgid, // Use Org ID as record identifier
                        base64WordFile: base64WordFile,
                        fileName: this.fileName
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data && data.pdfUrl) {
                        console.log('📌 Received PDF URL:', data.pdfUrl);
    
                        // Extract the PDF filename from the URL
                        const pdfFilename = data.pdfUrl.split('/').pop(); // Get the last part of the URL
    
                        console.log('📌 Extracted PDF Filename:', pdfFilename);
                        
                        // Call function to create Offer_Template__c record with PDF URL & filename
                        this.handleSaveAndUploadForConvertedWord(data.pdfUrl, pdfFilename);
                    } else {
                        console.error('❌ API Response Error:', data);
                        this.showToast('Error', 'Failed to get PDF URL from conversion API.', 'error');
                    }
                })
                .catch(error => {
                    console.error('❌ Error converting Word to PDF:', error);
                    this.showToast('Error', 'Word-to-PDF conversion failed.', 'error');
                })
                .finally(() => {
                    this.showSpinner = false;
                });
            };
    
            reader.readAsDataURL(this.file);
        } catch (error) {
            console.error('Unexpected error in convertWordToPdf:', error);
            this.showToast('Error', 'An unexpected error occurred while processing the Word document.', 'error');
        }
    }
    
    handleSaveAndUploadForConvertedWord(pdfUrl, pdfFilename) {
        if (!pdfFilename || !pdfUrl) {
            this.showToast('Error', 'PDF filename or URL is missing.', 'error');
            console.error('❌ Missing Data:', { pdfFilename: pdfFilename, pdfUrl: pdfUrl });
            return;
        }
    
        this.isLoading = true;
        // const picklistValue = "Default"; // Differentiate Word-to-PDF conversions
        const picklistValue = this.tsignReurl ? "Service" : "Default";
    
        console.log('📌 Creating Offer_Template__c with PDF Filename:', pdfFilename);
    
        // ✅ Create Offer_Template__c record with extracted PDF filename
        createOfferTemplate({ 
            fileName: pdfFilename,  // Use extracted filename
            picklistValue: picklistValue, 
            orgId: this.orgid,
            serviceId: '' // No service ID required for this case
        })
        .then((recordId) => {
            this.recordId = recordId;
            console.log('📌 Record created for converted Word file. ID:', recordId);
    
            // ✅ Update the record with the PDF URL (awsUrl)
            updateRecordWithAWSUrl({
                recordId: this.recordId,
                awsUrl: pdfUrl,
                serviceId: '' 
            })
            .then(() => {
                console.log('✅ Record updated with converted PDF URL:', pdfUrl);
                this.isFileUploaded = true;
                this.retrieveFileUrl();
                this.isLoading = false;
            })
            .catch(error => {
                console.error('❌ Error updating record with converted PDF URL:', error);
                this.showToast('Error', 'Failed to update record with PDF URL.', 'error');
                this.isLoading = false;
            });
        })
        .catch((error) => {
            console.error('❌ Error creating Offer_Template__c record:', error);
            this.showToast('Error', 'Failed to create record.', 'error');
            this.isLoading = false;
        });
    }
    
    
    
    
    
    handleSaveAndUpload() {
        if (!this.fileName) {
            this.showToast('Error', 'Please provide a file name and select a file.', 'error');
            return;
        }
    
        this.isLoading = true;
        const picklistValue = this.tsignReurl ? "Service" : "Default";
    
        // ✅ Step 1: Create Offer_Template__c record with orgId and optional ServiceId
        createOfferTemplate({ 
            fileName: this.fileName, 
            picklistValue: picklistValue, 
            orgId: this.orgid,
            serviceId: this.tsignReurl ? this.serviceId || '' : '' // ✅ Store ServiceId only if TsignReurl exists
        })
        .then((recordId) => {
            this.recordId = recordId;
            console.log('📌 Record created with ID:', recordId, ' | Picklist Value:', picklistValue, ' | Org ID:', this.orgid, ' | Service ID:', this.serviceId);
    
            // ✅ Step 2: If AWS URL exists, update the record with the URL and Service ID
            if (this.tsignReurl) {
                console.log('📌 AWS URL already exists, updating record with AWS URL & Service ID.');
    
                updateRecordWithAWSUrl({
                    recordId: this.recordId,
                    awsUrl: this.tsignReurl,
                    serviceId: this.serviceId || '' // ✅ Update ServiceId only if available
                })
                .then(() => {
                    console.log('✅ Record updated with AWS URL & Service ID:', this.tsignReurl, this.serviceId);
                    this.showToast('Success', 'Document linked successfully.', 'success');
                    this.retrieveFileUrl();
                    this.isLoading = false;
                })
                .catch(error => {
                    console.error('❌ Error updating record with AWS URL & Service ID:', error);
                    this.showToast('Error', 'Failed to update record.', 'error');
                    this.isLoading = false;
                });
    
            } else {
                // 🛑 If no AWS URL, proceed with standard upload to AWS
                console.log('📌 No AWS URL found, proceeding with file upload.');
    
                uploadFileToAWS({
                    base64: JSON.stringify(this.base64FileData),
                    filename: this.fileName,
                    recordId: this.recordId,
                    obj: 'offerLetter'
                })
                .then(() => {
                    console.log('✅ File uploaded successfully to AWS.');
                    setTimeout(() => {
                        this.retrieveFileUrl();
                    }, 3500); // Delay of 3.5 seconds
                })
                .catch(error => {
                    console.error('❌ Error uploading file to AWS:', error);
                    this.showToast('Error', 'File upload failed.', 'error');
                });
            }
        })
        .catch((error) => {
            console.error('❌ Error creating Offer_Template__c record:', error);
            this.showToast('Error', 'Failed to create record.', 'error');
            this.isLoading = false;
        });
    }
    
    
    
    

    retrieveFileUrl() {
        getUploadedFileUrl({ recordId: this.recordId })
            .then((url) => {
                if (url) {
                    this.awsUrl = url;
                    console.log('File URL retrieved:', url);
                    this.showToast('Success', 'File uploaded successfully.', 'success');
                    this.loadPdf(url); // Load the PDF from AWS and render it
                } else {
                    console.error('No URL found for the uploaded file.');
                    this.showToast('Warning', 'File uploaded but URL could not be retrieved.', 'warning');
                }
                this.showSpinner = false;
                this.isLoading = false;
                this.isFileUploaded = true;
            })
            .catch((error) => {
                console.error('Error retrieving file URL:', error);
                this.showToast('Error', 'Error retrieving file URL.', 'error');
                this.isLoading = false;
            });
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }


    
    

    async loadPdf(url) {
        try {
            const loadingTask = window.pdfjsLib.getDocument(url);
            this.pdfDoc = await loadingTask.promise;
            this.totalPages = this.pdfDoc.numPages;
            this.currentPage = 1;
            this.renderPageAsImage(this.currentPage); // Render the first page
        } catch (error) {
            this.handleError('Failed to load PDF.', error);
        }
    }

    async renderPageAsImage(pageNumber) {
        try {
            const page = await this.pdfDoc.getPage(pageNumber);
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const viewport = page.getViewport({ scale: 3.0 });
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport }).promise;
            this.imageSrc = canvas.toDataURL('image/png'); // Convert canvas to image
        } catch (error) {
            this.handleError(`Failed to render page ${pageNumber}.`, error);
        }
    }

    get isPaginationVisible() {
        return this.totalPages > 1;
    }

    get isFirstPage() {
        return this.currentPage === 1;
    }

    get isLastPage() {
        return this.currentPage === this.totalPages;
    }

    showPreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderPageAsImage(this.currentPage);
        }
    }

    showNextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.renderPageAsImage(this.currentPage);
        }
    }

    handleError(message, error) {
        console.error(message, error);
        this.errorMessage = `${message} ${error ? ': ' + error.message : ''}`;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: this.errorMessage,
                variant: 'error',
            })
        );
    }
    
    displayImage(imageDataUrl) {
        this.imageSrc = imageDataUrl; // Store the image URL in a tracked property for rendering
    }
    
    
    

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }

    handleDragStart(event) {
        const id = event.target.dataset.id;
    
        // Check if at least one email is entered
        const hasEmail = this.recipientEmails.some(
            (recipient) => recipient.email && recipient.email.trim() !== ''
        );
    
        // If no email is entered, prevent dragging and alert the user
        if (!hasEmail) {
            event.preventDefault(); // Prevent the drag action
            this.showToast('Error', 'Please enter at least one recipient email before dragging placeholders.', 'error');
            return;
        }
    
        // If Shift key is pressed and the placeholder already exists, enable rearranging
        if (event.shiftKey && id) {
            this.currentDraggedPlaceholder = this.placeholders.find(
                (placeholder) => placeholder.id === parseInt(id, 10)
            );
        } else {
            // Otherwise, it's a new placeholder creation
            this.draggedType = event.target.dataset.type;
            const rect = event.target.getBoundingClientRect();
            event.dataTransfer.setData(
                'text/plain',
                JSON.stringify({
                    type: this.draggedType,
                    offsetX: event.clientX - rect.left,
                    offsetY: event.clientY - rect.top,
                })
            );
            this.currentDraggedPlaceholder = null;
        }
    }
    

    allowDrop(event) {
        event.preventDefault();
    }

    handleDrop(event) {
        event.preventDefault();
    
        // Fetch the container dimensions
        const container = this.template.querySelector('.image-container img');
        if (!container) {
            console.error('Image container not found.');
            return;
        }
        const rect = container.getBoundingClientRect();
    
        // Get the drag data
        const dragData = JSON.parse(event.dataTransfer.getData('text/plain'));
        const { type, offsetX, offsetY } = dragData;
    
        // Calculate the drop position relative to the container
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
    
        // Adjust for the offset within the dragged element
        const adjustedX = mouseX - offsetX;
        const adjustedY = mouseY - offsetY;
    
        console.log(`Image Container Dimensions: Width=${rect.width}, Height=${rect.height}`);
        console.log(`Adjusted Coordinates: X=${adjustedX}px, Y=${adjustedY}px`);
    
        // Create the new placeholder
        if (type) {
            const newPlaceholder = {
                id: Date.now(),
                type: type,
                x: adjustedX, // Direct X coordinate relative to the image
                y: adjustedY, // Direct Y coordinate relative to the image
                value: '',
                page: this.currentPage,
                style: `top: ${adjustedY}px; left: ${adjustedX}px; position: absolute;`,
                isName: type === 'Name',
                isLastName: type === 'LastName',
                isEmail: type === 'Email',
                isContactNumber: type === 'ContactNumber',
                isAddress: type === 'Address',
                isDate: type === 'Date',
                isDateOfSigning: type === 'DateOfSigning',
                isInitials: type === 'Initials',
                isFullName: type === 'FullName',
                isSignature: type === 'Signature',
                recipient: '',
            };
    
            console.log('New Placeholder:', newPlaceholder);
            this.newPlaceholder = newPlaceholder;
    
            // Trigger modal for recipient selection or further customization
            this.showRecipientModal = true;
        }
    }
    
    
    handleInitialsSelection(event) {
        const id = parseInt(event.target.dataset.id, 10);
        const placeholder = this.placeholders.find((item) => item.id === id);
        if (placeholder) {
            placeholder.value = event.target.value;
            console.log(`Initials selected: ${placeholder.value}`);
        }
    }
    
    confirmRecipientSelection() {
        if (this.selectedRecipient && this.newPlaceholder) {
            // Assign the selected recipient to the new placeholder
            this.newPlaceholder.recipient = this.selectedRecipient;
    
            // Add the placeholder to the placeholders array
            this.placeholders = [...this.placeholders, this.newPlaceholder];
    
            // Reset temporary state
            this.newPlaceholder = null;
            this.selectedRecipient = null;
            this.showRecipientModal = false;
    
            // Log success for debugging
            console.log('Recipient confirmed:', this.placeholders);
        } else {
            // Show error if no recipient is selected
            this.showToast('Error', 'Please select a recipient.', 'error');
        }
    }
    
    
    cancelRecipientSelection() {
        this.newPlaceholder = null;
        this.selectedRecipient = null;
        this.showRecipientModal = false;
    }
    
    get recipientRadioOptions() {
        return this.recipientEmails.map((recipient) => ({
            label: recipient.email,
            value: recipient.email,
        }));
    }
    
    getFormattedEmail(email) {
        return email ? email.split('@')[0] : 'No Recipient';
    }
    
    get placeholdersForCurrentPage() {
        return this.placeholders.map((placeholder) => ({
            ...placeholder,
            formattedRecipient: this.getFormattedEmail(placeholder.recipient), // Ensure recipient is passed
        })).filter((placeholder) => placeholder.page === this.currentPage); // Filter by current page
    }
    
    

    handleRecipientSelection(event) {
        this.selectedRecipient = event.detail.value; // Capture the selected recipient email
        console.log('Selected recipient:', this.selectedRecipient);
    }
    
    
    
    
    
    handleMouseDown(event) {
        // Enable dragging only when Shift key is held
        if (event.shiftKey) {
            const id = event.target.dataset.id;
            if (id) {
                this.currentDraggedPlaceholder = this.placeholders.find(
                    (placeholder) => placeholder.id === parseInt(id, 10)
                );
            }
        }
    }
    
    handleMouseUp(event) {
        // Reset dragging state
        this.currentDraggedPlaceholder = null;
    }
    
    handleRearrangeStart(event) {
        const id = event.target.dataset.id;
        if (id) {
            this.currentDraggedPlaceholder = this.placeholders.find(
                (placeholder) => placeholder.id === parseInt(id, 10)
            );
    
            // Add mousemove and mouseup listeners to handle drag
            document.addEventListener('mousemove', this.handleRearrangeMove);
            document.addEventListener('mouseup', this.handleRearrangeEnd);
        }
    }
    
    handleRearrangeMove = (event) => {
        if (this.currentDraggedPlaceholder) {
            const rect = this.template.querySelector('.image-container').getBoundingClientRect();
            const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width - 50)); // Stay within width
            const y = Math.max(0, Math.min(event.clientY - rect.top, rect.height - 50)); // Stay within height
    
            this.currentDraggedPlaceholder.x = x;
            this.currentDraggedPlaceholder.y = y;
            this.currentDraggedPlaceholder.style = `top: ${y}px; left: ${x}px; position: absolute;`;
        }
    };
    
    handleRearrangeEnd = () => {
        if (this.currentDraggedPlaceholder) {
            this.currentDraggedPlaceholder = null; // Clear the current dragged placeholder
        }
    
        // Remove event listeners to stop dragging
        document.removeEventListener('mousemove', this.handleRearrangeMove);
        document.removeEventListener('mouseup', this.handleRearrangeEnd);
    };
    
    
    
    deletePlaceholder(event) {
        const id = parseInt(event.target.dataset.id, 10);
        this.placeholders = this.placeholders.filter((item) => item.id !== id);
    }
    
    handlePlaceholderInputChange(event) {
        const id = parseInt(event.target.dataset.id, 10);
        const placeholder = this.placeholders.find((item) => item.id === id);
        if (placeholder) {
            placeholder.value = event.target.value;
        }
    }
    
    handleUploadSignature(event) {
        const id = parseInt(event.target.dataset.id, 10);
        const placeholder = this.placeholders.find((item) => item.id === id);
        if (placeholder) {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/png, image/jpeg';
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                placeholder.value = file.name;
                alert('Signature uploaded: ' + file.name);
            });
            fileInput.click();
        }
    }
    

    renderPlaceholder(placeholder) {
        const container = document.createElement('div');
        container.classList.add('placeholder-container');
        container.style.position = 'absolute';
        container.style.left = `${placeholder.x}px`;
        container.style.top = `${placeholder.y}px`;

        if (placeholder.type === 'Name') {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Enter Name';
            container.appendChild(input);
        } else if (placeholder.type === 'Signature') {
            const uploadButton = document.createElement('button');
            uploadButton.textContent = 'Upload Signature';
            container.appendChild(uploadButton);
        }

        this.template.querySelector('.pdf-viewer-container').appendChild(container);
    }

    showConfirmationPopup() {
        // Check if at least one valid email is entered
        const hasEmail = this.recipientEmails.some(
            (recipient) => recipient.email && recipient.email.trim() !== ''
        );
    
        if (!hasEmail) {
            // If no email is entered, show a toast or an alert
            this.showToast('Error', 'Please enter at least one recipient email.', 'error');
            return;
        }
    
        // Proceed to show the confirmation popup
        this.isConfirmationPopupVisible = true;
    }
    

    // Close the confirmation popup
    closeConfirmationPopup() {
        this.isConfirmationPopupVisible = false;
    }

    // Handle the "Send" button in the confirmation popup
    handleSendConfirmation() {
        console.log('Document sent for signature.');

        // Proceed with sending the document
        this.handleSavePlaceholders();

        // Close the confirmation popup
        this.isConfirmationPopupVisible = false;
        this.isLoadingCircle = true;
    }

    handleSavePlaceholders() {
        const adjustedPlaceholders = this.placeholders.map((placeholder) => ({
            ...placeholder,
            x: placeholder.x +130, // Subtract 50px
            y: placeholder.y +180, // Subtract 50px
            style: `top: ${parseFloat(placeholder.style.split(';')[0].split(':')[1]) - 50}px; 
                    left: ${parseFloat(placeholder.style.split(';')[1].split(':')[1]) - 50}px; 
                    position: absolute;`,
        }));
        const placeholderData = JSON.stringify(this.placeholders);
        const emails = this.recipientEmails.map(recipient => recipient.email).join('\n');
    
        savePlaceholders({
            recordId: this.recordId,
            placeholderJSON: placeholderData
        })
        .then(() => {
            // Once placeholders are saved, save emails
            saveEmailsToBackend({
                recordId: this.recordId,
                emails: emails,
                newJoineeEmail: this.recipientEmails[0].email
            })
            .then(() => {
                console.log('Placeholders and emails saved successfully!');
                setTimeout(() => {
                    this.handleFinish();
                }, 1000);
            })
            
            .catch(error => {
                console.error('Error saving emails:', error);
                this.showToast('Error', 'Failed to save emails.', 'error');
            });
        })
        .catch(error => {
            console.error('Error saving placeholders:', error);
            this.showToast('Error', 'Failed to save placeholders.', 'error');
        });
    }
    

    retrievePlaceholders() {
        getPlaceholders({ recordId: this.recordId })
            .then((data) => {
                if (data) {
                    this.placeholders = JSON.parse(data).map((placeholder) => {
                        return {
                            ...placeholder,
                            style: `top: ${placeholder.y}px; left: ${placeholder.x}px; position: absolute;`
                        };
                    });
                }
            })
            .catch((error) => {
                console.error('Error retrieving placeholders:', error);
                this.showToast('Error', 'Failed to retrieve placeholders.', 'error');
            });
    }

    addRecipient() {
        console.log('Add Recipient button clicked.');
        this.recipientEmails = [
            ...this.recipientEmails,
            {
                key: this.nextRecipientKey,
                label: `Recipient ${this.recipientEmails.length + 1} Email`, // Dynamically set the label
                email: '',
                canRemove: true // Allow this recipient to be removed
            }
        ];
        this.nextRecipientKey += 1; // Increment the key for the next recipient
        console.log('Updated recipientEmails:', JSON.stringify(this.recipientEmails));
    }
    
    removeRecipient(event) {
        const index = parseInt(event.target.dataset.index, 10);
        console.log(`Remove Recipient button clicked for index: ${index}`);
        
        const removedRecipient = this.recipientEmails.find((r) => r.key === index);
        if (removedRecipient) {
            console.log('Removing recipient:', JSON.stringify(removedRecipient));
        } else {
            console.error('Recipient not found for removal.');
        }
    
        // Remove the recipient
        this.recipientEmails = this.recipientEmails.filter((r) => r.key !== index);
    
        // Reassign labels and keys to ensure consistent numbering
        this.recipientEmails = this.recipientEmails.map((recipient, i) => ({
            ...recipient,
            label: i === 0 ? 'New Joinee Email*' : `Recipient ${i + 1} Email`, // Special label for the first recipient
            key: i, // Update the key to match the new sequence
            canRemove: i !== 0 // Only allow removal for recipients other than the first
        }));
    
        console.log('Updated recipientEmails after removal:', JSON.stringify(this.recipientEmails));
    }
    
    
    handleEmailChange(event) {
        const index = parseInt(event.target.dataset.index, 10);
        const newEmail = event.target.value;
        console.log(`Email input changed for index: ${index}, new email: ${newEmail}`);
        const isDuplicate = this.recipientEmails.some((recipient, i) => recipient.email === newEmail && i !== index);
        if (isDuplicate) {
            this.showToast('Error', 'Duplicate email is not allowed.', 'error');
            return;
        }
        let updated = false;
        this.recipientEmails = this.recipientEmails.map(recipient => {
            if (recipient.key === index) {
                recipient.email = newEmail;
                updated = true;
            }
            return recipient;
        });
    
        if (updated) {
            console.log('Updated recipientEmails:', JSON.stringify(this.recipientEmails));
            // Set currentRecipient to the first email as default or upon specific conditions
            this.currentRecipient = this.recipientEmails[0].email;
            console.log('Current Email set to:', this.currentRecipient);
        }
    }
    
    
    handleFinish() {
        console.log('Record ID:', this.recordId);
        console.log('Current Email:', this.currentRecipient);
    
        if (this.recordId && this.currentRecipient) {
            startEmailSequence({ recordId: this.recordId })
                .then((result) => {
                    console.log('Email Sequence Started:', result);
                    this.updateCurrentRecipient(this.currentRecipient);
                })
                .catch((error) => {
                    console.error('Failed to initiate email sequence:', error.body?.message || error.message);
                });
        } else {
            console.error('Record ID and Current Email are required.');
        }
        this.isLoadingCircle = false;
    
        this.showSuccessScreen = true; // Show the success screen
    }
    

    handleCloseScreen() {
        this.showSuccessScreen = false;
    this.fileName = '';
    this.selectedFile = null;
    this.isFileAttached = false;
    this.isFileUploaded = false; // Reset uploaded file state
    this.awsUrl = ''; // Clear uploaded document URL
    this.base64FileData = ''; // Clear base64 data
    this.pdfDoc = null; // Clear the PDF document reference
    this.pdfLoaded = false; // Reset PDF loaded state
    this.placeholders = []; // Clear placeholders
    this.imageSrcs = []; // Reset multi-page images
    this.imageSrc = ''; // Reset single page image
    this.recipientEmails = [
        {
            key: 0,
            label: 'New Joinee Email*',
            email: '',
            canRemove: false,
        },
    ]; // Reset recipients
    this.nextRecipientKey = 1; // Reset recipient key counter
    this.showSpinner = false; // Reset spinner
    this.currentPage = 1; // Reset to the first page
    this.totalPages = 0; // Reset total pages

    // Log reset action for debugging
    console.log('Component has been reset to its initial state.');
    }
    
    
    updateCurrentRecipient(currentEmail) {
        if (this.recordId && currentEmail) {
            updateCurrentRecipient({
                recordId: this.recordId,
                currentRecipientEmail: currentEmail
            })
            .then(() => {
                console.log('Current recipient updated successfully.');
            })
            .catch((error) => {
                console.error('Error updating current recipient:', error);
                this.showToast(
                    'Error',
                    `Failed to update current recipient: ${error.body?.message || error.message}`,
                    'error'
                );
            });
        } else {
            this.showToast('Error', 'Record ID and Current Email are required for updating.', 'error');
        }
    }
    

    advanceSequence() {
        advanceEmailSequence({ recordId: this.recordId })
            .then(() => {
                this.showToast('Success', 'Advanced to the next recipient.', 'success');
                this.updateCurrentRecipient();
            })
            .catch(error => {
                this.showToast('Error', `Failed to advance email sequence: ${error.body.message}`, 'error');
            });
    }

    validateEmails() {
        if (this.recipientEmails.length === 0 || this.recipientEmails.includes('')) {
            this.showToast('Error', 'Please fill in all email fields before finishing.', 'error');
            return false;
        }
        return true;
    }

    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }
    
    
    
    
    
    
    
    updateCurrentRecipient(currentEmail, status) {
        updateCurrentRecipient({
            recordId: this.recordId,
            currentRecipientEmail: currentEmail,
            status: status,
        })
            .then(() => {
                console.log('Current recipient updated successfully.');
            })
            .catch((error) => {
                console.error('Error updating current recipient:', error);
                this.showToast(
                    'Error',
                    `Failed to update current recipient: ${error.body?.message || error.message}`,
                    'error'
                );
            });
    }
    
    
    
    
    notifyFirstRecipient() {
        const firstRecipient = this.recipientEmails[0];
        const url = `${this.tsignUrl}/s/?recordId=${this.recordId}`;
    
        sendRecordEmail({ recordId: this.recordId, email: firstRecipient.email, url })
            .then(() => {
                this.showToast(
                    'Success',
                    `Email sent successfully to ${firstRecipient.email}. Waiting for completion.`,
                    'success'
                );
                // Mark the first recipient as processed
                this.updateCurrentRecipient(firstRecipient.email, 'Pending');
            })
            .catch((error) => {
                console.error('Error sending email to the first recipient:', error);
                this.showToast(
                    'Error',
                    `Failed to send email: ${error.body?.message || error.message}`,
                    'error'
                );
            });
    }
    
    
    updateCurrentRecipient(currentEmail) {
        updateCurrentRecipient({ recordId: this.recordId, currentRecipientEmail: currentEmail })
            .then(() => {
                console.log('Current recipient updated successfully.');
            })
            .catch((error) => {
                console.error('Error updating current recipient:', error);
                this.showToast(
                    'Error',
                    `Failed to update current recipient: ${error.body?.message || error.message}`,
                    'error'
                );
            });
    }
    
    
    saveEmailsToBackend(emails) {
        return saveEmailsToBackend({ recordId: this.recordId, emails });
    }

    handleRecipientFinish() {
        const nextRecipientIndex = this.recipientEmails.findIndex(
            (email) => email === this.currentRecipient
        ) + 1;
    
        if (nextRecipientIndex < this.recipientEmails.length) {
            const nextRecipient = this.recipientEmails[nextRecipientIndex];
            const url = `${this.tsignUrl}/s/?recordId=${this.recordId}`;
            

    
            sendRecordEmail({ recordId: this.recordId, email: nextRecipient.email, url })
                .then(() => {
                    this.showToast('Success', `Email sent to ${nextRecipient.email}!`, 'success');
                    updateCurrentRecipient({
                        recordId: this.recordId,
                        currentRecipient: nextRecipient.email,
                    });
                })
                .catch((error) => {
                    console.error('Error sending email:', error);
                    this.showToast('Error', 'Failed to send email.', 'error');
                });
        } else {
            // If all recipients have completed, notify everyone
            notifyAllRecipients({ recordId: this.recordId });
        }
    }

    
}