import { LightningElement, track, api } from 'lwc';
import getPlaceholders from '@salesforce/apex/TemplateController.getPlaceholders';
import getUploadedFileUrl from '@salesforce/apex/TemplateController.getUploadedFileUrl';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import pdfjsLib from '@salesforce/resourceUrl/pdfJS';
import pdfWorker from '@salesforce/resourceUrl/pdfWorker';
import { loadScript } from 'lightning/platformResourceLoader';
import updateNameInPdfId from '@salesforce/apex/TemplateController.updateNameInPdfId';
import getAllRecipients from '@salesforce/apex/TemplateController.getAllRecipients';
import saveImageToSalesforce from '@salesforce/apex/TemplateController.saveImageToSalesforce';
import getFileNameFromRecord from '@salesforce/apex/TemplateController.getFileNameFromRecord';
import TeSignLogo from '@salesforce/resourceUrl/Te_sign';
import getCurrentUserEmail from '@salesforce/apex/TemplateController.getCurrentUserEmail';
import getUploadedSignUrl from '@salesforce/apex/TemplateController.getUploadedSignUrl';
import { loadStyle } from 'lightning/platformResourceLoader';
import adobeFonts from '@salesforce/resourceUrl/AdobeFonts';
// import generatePdfFromAWS from '@salesforce/apex/AWSPdfService.generatePdfFromAWS';
import saveFirstName from '@salesforce/apex/TemplateController.saveFirstName';
import saveMessage from '@salesforce/apex/TemplateController.saveMessage';
import fetchMessages from '@salesforce/apex/TemplateController.fetchMessages';
import Send_Icon from '@salesforce/resourceUrl/Send_Icon';
import getOfferTemplateDetails from '@salesforce/apex/TemplateController.getOfferTemplateDetails';
import getChildSignatureDetails from '@salesforce/apex/TemplateController.getChildSignatureDetails';
import deactivateLink from '@salesforce/apex/TemplateController.deactivateLink';
import storePdfRecord from '@salesforce/apex/AWSPdfService.storePdfRecord';
import Tlogo from '@salesforce/resourceUrl/Tlogo';
import Tdark from '@salesforce/resourceUrl/Tdark';



export default class OfferTemplateList extends LightningElement {
    @track records = [];
    @track recordId;
    @track childSignatureId;
    @track filteredRecords = [];
    @track nextRecipientEmail = [];
    @track searchKey = '';
    @track imageSrc = '';
    @track FNimageSrc ='';
    @track placeholders = [];
    placeholdersByPage = {};
    @track currentPage = 1;
    @track totalPages = 0;
    @track isLoading = false;
    @track isLoadingpop = false;
    @track selectedRecordId = '';
    @track isPreviewVisible = false;
    pdfDoc = null;
    pdfLoaded = false;
    logo = TeSignLogo;
    @track isPreviewMode = false;
    fileName = '';
    @track isLoading = false;
    isLibraryLoaded = false;
    @track currentPreviewPage = 1;
    @track totalPreviewPages = 0;
    @track isFirstPreviewPage = true;
    @track isLastPreviewPage = true;
    @track currentPreviewImageSrc = '';
    @api confirmationPopupPages = [];
    @track isSignatureModalVisible = false;
    @track isDrawingModalVisible = false;
    @track isPreviewModalVisible = false;
    @track showSuccessScreen = false;
    @track isAlreadySubmitted = false;
    @track isLinkExpired = false;
    @track showFailureScreen = false;
    @track isattachError = false;
    @track showSpinner = false;
    @track isDrawing = false;
    @track canvasContext;
    placeholderId;
    @track isSignatureModalVisible = false;
    @track isNameSignatureModalVisible = false;
    @track styledPreviews = [];
    @track selectedStyle = null;
    @track enteredName = '';
    @track sendIcon = Send_Icon;
    @track canvas;
    @track context;
    @track viewport;
    @track blinitialization = false;
    @track showConversationModal = false;
    @track messages = [];
    @track newMessage = '';
    
    
    
    disconnectedCallback() {
        this.stopPolling(); // Stop polling when the component is unloaded
    }
    updateFavicon(iconUrl) {
        const existing = document.querySelector("link[rel*='icon']");
        if (existing) {
            existing.parentNode.removeChild(existing);
        }
        const link = document.createElement('link');
        link.type = 'image/png';
        link.rel = 'icon';
        link.href = iconUrl;
     
        document.head.appendChild(link);
     }
    connectedCallback() {
        console.log('TeSignLogo URL:', this.logo);
        console.log('Initializing component and fetching data...');
        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.updateFavicon(isDarkMode ? Tdark : Tlogo);
    document.title = 'T sign | TesseractApps';
    // Listen for system theme changes and update favicon accordingly
    if (window.matchMedia) {
        const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
        // Add listener for dynamic theme changes
        themeMedia.addEventListener('change', (e) => {
            const newIcon = e.matches ? Tdark : Tlogo;
            this.updateFavicon(newIcon);
        });
    }
        
        //this.startPolling();
    
        const params = new URLSearchParams(window.location.search);
        const encodedData = params.get('data');
    
        if (!encodedData) {
            console.warn('Encoded data not found in the URL.');
            this.showToast('Error', 'The link is invalid. Please ensure you are using the correct email link.', 'error');
            return;
        }
    
        const decodedString = atob(encodedData);
        const decodedParams = new URLSearchParams(decodedString);
    
        this.recordId = decodedParams.get('recordId');
        this.currentUserEmail = decodedParams.get('email');
    
        if (!this.recordId || !this.currentUserEmail) {
            console.warn('Record ID or Email not found in the decoded parameters.');
            this.showToast('Error', 'Record ID or Email is missing. Unable to proceed.', 'error');
            return;
        }
    
        console.log(`Record ID retrieved: ${this.recordId}`);
        console.log(`Email retrieved from URL: ${this.currentUserEmail}`);

        
    
        // ✅ Fetch recipients first to determine the user's position
        getAllRecipients({ recordId: this.recordId })
            .then((allRecipients) => {
                if (!allRecipients) {
                    console.warn('No recipients found.');
                    return;
                }
    
                this.allRecipients = allRecipients.split('\n').filter(email => email.trim() !== '');
                console.log('Parsed all recipients:', this.allRecipients);
    
                this.currentRecipientIndex = this.allRecipients.indexOf(this.currentUserEmail);
                console.log('Current recipient index:', this.currentRecipientIndex);

                this.nextRecipientEmail = this.getNextRecipientEmail();
                console.log('Upcoming recipient email:', this.nextRecipientEmail);
    
                // ✅ Determine if this user is the first recipient or a later recipient
                if (this.currentRecipientIndex > 0) {
                    this.fetchRecipientSpecificData(); // Fetch from Child_Signatures__c
                } else {
                    this.fetchRecordData(); // Fetch from Offer_Template__c
                }
    
                return Promise.all([
                    loadScript(this, pdfjsLib).catch(error => console.error('Failed to load pdfjsLib:', error)),
                    loadScript(this, pdfWorker).catch(error => console.error('Failed to load pdfWorker:', error)),
                    loadStyle(this, adobeFonts).catch(error => console.error('Failed to load fonts:', error)),
                ]);
            })
            .then(() => {
                console.log('All libraries loaded successfully');
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
                this.pdfLoaded = true;
            })
            .catch((error) => {
                console.error('Error during initialization:', error);
                this.showToast('Error', 'Failed to initialize component.', 'error');
            });
    }
    
    getNextRecipientEmail() {
        if (!this.allRecipients || this.allRecipients.length === 0) {
            console.warn("No recipients found.");
            return null;
        }
    
        let recipientsArray = this.allRecipients;
        let currentIndex = recipientsArray.indexOf(this.currentUserEmail);
        console.log(`Current recipient index: ${currentIndex}`);
        console.log("All Recipients fetched:", recipientsArray);
    
        let nextRecipient = null;
        if (currentIndex !== -1 && currentIndex + 1 < recipientsArray.length) {
            nextRecipient = recipientsArray[currentIndex + 1];
            console.log(`Upcoming recipient email: ${nextRecipient}`);
        } else {
            console.log("No more recipients left.");
        }
    
        return nextRecipient;
    }
    
    




    fetchRecordData() {
        this.isLoading = true;
    
        // ✅ Fetch Offer_Template__c details (Expire__c and Link_Active__c)
        getOfferTemplateDetails({ recordId: this.recordId })
            .then((data) => {
                if (data) {
const expirationTimeUTC = new Date(data.Expire__c);  // stored in UTC
const nowUTC = new Date();                            // current UTC time

// Use `Intl.DateTimeFormat` to format both to AEST for display
const aestFormatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    dateStyle: 'medium',
    timeStyle: 'medium'
});

// ✅ Display purposes (formatted AEST string)
const expirationTimeAESTFormatted = aestFormatter.format(expirationTimeUTC);
const nowAESTFormatted = aestFormatter.format(nowUTC);

console.log('📅 Expire__c (AEST):', expirationTimeAESTFormatted);
console.log('📅 Now (AEST):', nowAESTFormatted);

// ✅ Compare expiration in UTC (ALWAYS do comparisons in UTC)
this.isLinkExpired = nowUTC > expirationTimeUTC;
console.log('🔐 Is link expired?', this.isLinkExpired);


                    this.isAlreadySubmitted = !data.Link_Active__c;
    
                    if (this.isLinkExpired) {
                        this.expirationText = '⚠️ This link has expired. Please contact support.';
                        this.isAlreadySubmitted = false;
                        this.isLoading = false;
                        return;
                    } else if (this.isAlreadySubmitted) {
                        this.expirationText = '✅ This document has already been submitted.';
                        
                        this.isLoading = false;
                        return;
                    }
                }
    
                // ✅ Proceed with fetching placeholders and PDF
                return Promise.all([
                    getPlaceholders({ recordId: this.recordId }),
                    getUploadedFileUrl({ recordId: this.recordId }),
                    getAllRecipients({ recordId: this.recordId })
                ]);
            })
            .then(([placeholders, pdfUrl, allRecipients]) => {
                if (!placeholders || !pdfUrl || !allRecipients) return;
    
                console.log('Placeholders fetched:', placeholders);
                console.log('PDF URL fetched:', pdfUrl);
                console.log('All Recipients fetched:', allRecipients);
    
                // ✅ Filter placeholders for the current user
                try {
                    this.placeholders = JSON.parse(placeholders)
                        .filter((placeholder) => placeholder.recipient === this.currentUserEmail)
                        .map((placeholder) => {
                            placeholder.style = placeholder.hasImage
                                ? `top: ${placeholder.y}px; left: ${placeholder.x}px; position: absolute;`
                                : `top: ${placeholder.y}px; left: ${placeholder.x}px; position: absolute; border: 2px dashed #0070d2; background-color: #f4f6f9;`;
                            return placeholder;
                        });
                } catch (parseError) {
                    console.error('Error parsing placeholders:', parseError);
                    this.showToast('Error', 'Failed to parse placeholders.', 'error');
                    return;
                }
                console.log('Encoded PDF URL:', pdfUrl);
                this.loadPdf(pdfUrl);
            })
            .catch((error) => {
                console.error('Error fetching record data:', error);
                
            })
            .finally(() => {
                
            });
    }
    
    

    

    fetchRecipientSpecificData() {
        this.isLoading = true;
    
        // ✅ Fetch Child_Signatures__c details (Expire__c and Link_Active__c) for the current user
        getChildSignatureDetails({ recordId: this.recordId, currentUserEmail: this.currentUserEmail })
            .then((childData) => {
                if (!childData) {
                    console.warn('⚠️ No matching child signature record found.');
                    this.showToast('Warning', 'No signature record found for this recipient.', 'warning');
                    this.isLoading = false;
                    return Promise.reject('No child signature record found');
                }
    
                console.log('🔹 Child_Signatures__c Data Retrieved:', JSON.stringify(childData));
                this.childSignatureId = childData.Id;
                console.log('✅ Stored Child Signature ID:', this.childSignatureId);
    
                const expirationTimeUTC = new Date(childData.Expire__c);  // stored in UTC
const nowUTC = new Date();                                // current UTC time

// Use `Intl.DateTimeFormat` to format both to AEST for display
const aestFormatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    dateStyle: 'medium',
    timeStyle: 'medium'
});

// ✅ Display purposes (formatted AEST strings)
const expirationTimeAESTFormatted = aestFormatter.format(expirationTimeUTC);
const nowAESTFormatted = aestFormatter.format(nowUTC);

console.log('📅 Expire__c (AEST):', expirationTimeAESTFormatted);
console.log('📅 Now (AEST):', nowAESTFormatted);

// ✅ Compare expiration in UTC (always do comparisons in UTC)
this.isLinkExpired = nowUTC > expirationTimeUTC;
this.isAlreadySubmitted = !childData.Link_Active__c;

console.log('🔐 Is link expired?', this.isLinkExpired);
console.log('📌 Is already submitted?', this.isAlreadySubmitted);

    
                if (this.isLinkExpired) {
                    this.expirationText = '⚠️ This link has expired. Please contact support.';
                    this.isAlreadySubmitted = false;
                    this.isLoading = false;
                    return Promise.reject('Link Expired');
                } else if (this.isAlreadySubmitted) {
                    this.expirationText = '✅ This document has already been submitted.';
                    
                    this.isLoading = false;
                    return Promise.reject('Already Submitted');
                }
    
                // ✅ Proceed with fetching placeholders and PDF URL from Child_Signatures__c
                return Promise.all([
                    getPlaceholders({ recordId: this.recordId }),
                    getUploadedSignUrl({ recordId: this.recordId })
                ]);
            })
            .then(([placeholders, childPdfData]) => {
                if (!placeholders || !childPdfData) {
                    console.warn('⚠️ Missing placeholder or PDF data.');
                    return;
                }
    
                console.log('📜 Placeholders Fetched:', placeholders);
                console.log('📄 Child PDF Data Fetched:', JSON.stringify(childPdfData));
    
                // ✅ Set the PDF URL from the Signature_URL__c field
                this.pdfUrl = childPdfData.Signature_URL__c;
                console.log('📄 PDF URL for Recipient:', this.pdfUrl);
    
                // ✅ Filter placeholders for the current user
                try {
                    this.placeholders = JSON.parse(placeholders)
                        .filter(placeholder => placeholder.recipient === this.currentUserEmail)
                        .map(placeholder => ({
                            ...placeholder,
                            style: placeholder.hasImage
                                ? `top: ${placeholder.y}px; left: ${placeholder.x}px; position: absolute;`
                                : `top: ${placeholder.y}px; left: ${placeholder.x}px; position: absolute; border: 2px dashed #0070d2; background-color: #f4f6f9;`
                        }));
    
                    console.log('✅ Filtered Placeholders:', this.placeholders);
                } catch (parseError) {
                    console.error('🚨 Error Parsing Placeholders:', parseError);
                    this.showToast('Error', 'Failed to parse placeholders.', 'error');
                    return;
                }
    
                // ✅ Load the PDF using the extracted `pdfUrl`
                this.loadPdf(childPdfData);
            })
            .catch((error) => {
                if (error !== 'Link Expired' && error !== 'Already Submitted' && error !== 'No child signature record found') {
                    console.error('🚨 Error Fetching Recipient-Specific Data:', error);
                    this.showToast('Error', 'Failed to fetch data for recipient.', 'error');
                }
            })
            .finally(() => {
                
            });
    }
    
    
    

    getLoggedInUserEmail() {
        return getCurrentUserEmail()
            .then((email) => {
                this.currentUserEmail = email;
                console.log('Actual Current User Email:', email);
                return email;
            })
            .catch((error) => {
                console.error('Error retrieving user email:', error);
                throw new Error('Failed to retrieve user email.');
            });
    }

    handleView(event) {
        const recordId = event.target.dataset.id || this.recordId; // Use recordId from URL if available
        console.log(`View button clicked for record ID: ${recordId}`);
        
        if (!recordId) {
            this.showToast('Error', 'No record selected. Unable to proceed.', 'error');
            return;
        }
    
        this.selectedRecordId = recordId;
        this.isLoading = true;
    
        Promise.all([
            getPlaceholders({ recordId }),
            getUploadedFileUrl({ recordId })
        ])
            .then(([placeholders, pdfUrl]) => {
                console.log('Placeholders fetched:', placeholders);
                console.log('PDF URL fetched:', pdfUrl);
    
                // Parse placeholders
                try {
                    this.placeholders = JSON.parse(placeholders).map((placeholder) => {
                        return {
                            ...placeholder,
                            style: `top: ${placeholder.y}px; left: ${placeholder.x}px; position: absolute;`,
                        };
                    });
                    console.log('Parsed placeholders:', this.placeholders);
                } catch (parseError) {
                    console.error('Error parsing placeholders:', parseError);
                    this.showToast('Error', 'Failed to parse placeholders.', 'error');
                    this.isLoading = false;
                    return;
                }
    
                // Load the PDF
                console.log('Encoded PDF URL:', pdfUrl);
                this.loadPdf(pdfUrl);
            })
            .catch((error) => {
                console.error('Error loading record:', error);
                this.showToast('Error', 'Failed to load record.', 'error');
                this.isLoading = false;
            });
    }
    
    loadPdf(pdfUrl) {
        console.log('Initializing PDF.js...');
        const encodedUrl = encodeURI(pdfUrl);
        console.log('Encoded PDF URL:', encodedUrl);

        fetch(encodedUrl)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to fetch PDF: ${response.statusText}`);
            }
            console.log('PDF URL is accessible:', encodedUrl);

            // Proceed with loading the PDF after validation
            const loadingTask = window.pdfjsLib.getDocument(encodedUrl);
            return loadingTask.promise;
        })
            .then((pdf) => {
                console.log('PDF successfully loaded:', pdf);
                this.pdfDoc = pdf;
                this.totalPages = pdf.numPages;
                console.log('Total pages in PDF:', this.totalPages);
                this.currentPage = 1;
                this.renderPageAsImage(this.currentPage);
            })
            .catch((error) => {
                console.error('Error loading PDF:', error);
                this.showToast('Error', 'Failed to load PDF.', 'error');
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    async renderPageAsImage(pageNumber) {
        try {
            console.log(`Rendering page ${pageNumber} as an image...`);
            const page = await this.pdfDoc.getPage(pageNumber);
    
            // Define a standard width (e.g., 1024px)
            const scale = 3;
    
            // Create the viewport with the calculated scale
            
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
    
            await page.render({ canvasContext: context, viewport }).promise;
            this.imageSrc = canvas.toDataURL('image/png');
    
            setTimeout(() => {
                const container = this.template.querySelector('.image-container img');
                if (container) {
                    console.log('Image container found. Updating placeholder styles...');
                    this.placeholders = this.placeholders.map((placeholder) => ({
                        ...placeholder,
                        style: this.getPlaceholderStyle(placeholder),
                        
                    }));
                } else {
                    console.warn('Image container not found during rendering. Placeholder positions skipped.');
                }
            }, 100); // Adjust the delay as needed
        } catch (error) {
            console.error(`Error rendering page ${pageNumber}:`, error);
            this.showToast('Error', `Failed to render page ${pageNumber}.`, 'error');
        }
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

    handlePlaceholderInputChange(event) {
        const placeholderId = event.target.dataset.id;
        const placeholder = this.placeholders.find(
            (item) => item.id === parseInt(placeholderId, 10)
        );
        if (placeholder) {
            placeholder.value = event.target.value; // Update the value in the placeholder
            console.log(`Updated placeholder ${placeholderId}: ${placeholder.value}`);
        }
    }

    handleSave() {
        const nameInput = this.template.querySelector('.placeholder-input');
        const nameValue = nameInput ? nameInput.value : '';
    
        if (!nameValue) {
            this.showToast('Error', 'Name input is empty.', 'error');
            return;
        }
    
        const recordId = this.selectedRecordId || this.recordId; // Fallback to recordId if selectedRecordId is not set
    
        if (!recordId) {
            console.error('No record selected. Cannot save name.');
            this.showToast('Error', 'No record selected. Please select a record first.', 'error');
            return;
        }
    
        console.log(`Saving name "${nameValue}" to pdfID__c for recordId: ${recordId}`);
    
        updateNameInPdfId({ name: nameValue, recordId })
            .then(() => {
                console.log('Name saved successfully in pdfID__c.');
                this.showToast('Success', 'Name saved successfully!', 'success');
            })
            .catch((error) => {
                console.error('Error saving name in pdfID__c:', error);
                this.showToast('Error', `Failed to save name: ${error.body.message || error.message}`, 'error');
            });
    }
    getPlaceholderStyle(placeholder) {
        // Fetch the image container where the PDF is rendered
        const container = this.template.querySelector('.image-container img');
        if (!container) {
            console.error('Image container not found. Skipping style calculation for placeholder:', placeholder);
            return 'top: 0; left: 0; position: absolute;';
        }
    
        // Fetch container dimensions
        const rect = container.getBoundingClientRect();
        console.log('Image Container Found');
        console.log(`Container Dimensions: Width=${rect.width}, Height=${rect.height}`);
    
        // Log the PDF placeholder coordinates
        console.log(`Placeholder PDF Page: ${placeholder.page}`);
        console.log(`PDF Placeholder Coordinates: X=${placeholder.x}, Y=${placeholder.y}`);
    
        // Calculate scaled coordinates based on the container size
        const scaledX = (placeholder.x / 1024) * rect.width; // Assume PDF width of 1024 for scaling
        const scaledY = (placeholder.y / 1448) * rect.height; // Assume PDF height of 1448 for scaling
    
        // Log the final calculated position for debugging
        console.log(`Scaled Coordinates for Rendering: X=${scaledX}px, Y=${scaledY}px`);
        //this.isLoading = false;
    
        // Return the style for the placeholder
        return `top: ${scaledY}px; left: ${scaledX}px; position: absolute;`;
    }
    
    // Open the modal for upload or draw options
    handleUploadSignature(event) {
        this.placeholderId = event.target.dataset.id;
        this.isSignatureModalVisible = true; // Open the modal
    }

    // Close the upload or draw options modal
    closeSignatureModal() {
        this.isSignatureModalVisible = false;
    }

    // Handle "Upload Signature" option
    handleUploadOption() {
        this.isSignatureModalVisible = false; // Close modal
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/png, image/jpeg';

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) {
                this.showToast('Error', 'No file selected.', 'error');
                return;
            }

            // Trigger existing image upload process
            this.onImageUpload({ target: { files: [file], dataset: { id: this.placeholderId } } });
        });

        fileInput.click();
    }

    // Handle "Draw Signature" option
    handleDrawOption() {
        this.isSignatureModalVisible = false; // Close options modal
        this.isDrawingModalVisible = true; // Open drawing modal
    }

    // Close the drawing modal
    closeDrawingModal() {
        this.isDrawingModalVisible = false;
    }

    // Start drawing on canvas
    startDrawing(event) {
        const canvas = this.template.querySelector('.signature-canvas');
        this.canvasContext = canvas.getContext('2d');
        this.isDrawing = true;
        this.canvasContext.beginPath();
        this.canvasContext.moveTo(event.offsetX, event.offsetY);
    }

    // Stop drawing
    stopDrawing() {
        this.isDrawing = false;
    }

    // Draw on the canvas
    draw(event) {
        if (!this.isDrawing) return;
        this.canvasContext.lineTo(event.offsetX, event.offsetY);
        this.canvasContext.stroke();
    }

    // Clear the canvas
    clearCanvas() {
        const canvas = this.template.querySelector('.signature-canvas');
        this.canvasContext = canvas.getContext('2d');
        this.canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Save the drawn signature
    saveDrawnSignature() {
        const canvas = this.template.querySelector('.signature-canvas');
        const base64Data = canvas.toDataURL('image/png').split(',')[1]; // Convert to Base64

        this.isDrawingModalVisible = false; // Close drawing modal

        // Update placeholder with the drawn signature
        const placeholder = this.placeholders.find((item) => item.id === parseInt(this.placeholderId, 10));
        if (placeholder) {
            placeholder.hasImage = true;
            placeholder.imageSrc = `data:image/png;base64,${base64Data}`;
            this.placeholders = [...this.placeholders];
            if (this.placeholdersByPage[this.currentPage]) {
                const cachedPlaceholder = this.placeholdersByPage[this.currentPage].find(
                    (item) => item.id === parseInt(this.placeholderId, 10)
                );
                if (cachedPlaceholder) {
                    cachedPlaceholder.hasImage = true;
                    cachedPlaceholder.imageSrc = `data:image/png;base64,${base64Data}`;
                }
            }
        }

        // Save the drawn signature to Salesforce
        this.saveImageBase64(base64Data);
    }

    // Existing image upload function
    onImageUpload(event) {
        this.isattachError = false;

        if (event.target.files.length > 0) {
            this.showSpinner = true;
            const file = event.target.files[0];
            const fileType = file.type;
            const fileSize = file.size;
            const placeholderId = event.target.dataset.id;

            const placeholder = this.placeholders.find((item) => item.id === parseInt(placeholderId, 10));
            if (!placeholder) {
                this.showToast('Error', 'Placeholder not found.', 'error');
                this.showSpinner = false;
                return;
            }

            const validImageTypes = ['image/png', 'image/jpeg'];
            if (!validImageTypes.includes(fileType)) {
                this.isattachError = true;
                this.showToast('Error', 'Invalid file type. Please upload a PNG or JPEG image.', 'error');
                this.showSpinner = false;
                return;
            }

            const MAX_FILE_SIZE = 1048576; // 1MB
            const MIN_FILE_SIZE = 10240; // 10KB
            if (fileSize > MAX_FILE_SIZE || fileSize < MIN_FILE_SIZE) {
                this.isattachError = true;
                this.showToast('Error', 'File size must be between 10KB and 1MB.', 'error');
                this.showSpinner = false;
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Data = reader.result.split(',')[1];

                placeholder.hasImage = true;
                placeholder.imageSrc = `data:image/png;base64,${base64Data}`;
                this.placeholders = [...this.placeholders];
                if (this.placeholdersByPage[this.currentPage]) {
                    const cachedPlaceholder = this.placeholdersByPage[this.currentPage].find(
                        (item) => item.id === parseInt(placeholderId, 10)
                    );
                    if (cachedPlaceholder) {
                        cachedPlaceholder.hasImage = true;
                        cachedPlaceholder.imageSrc = `data:image/png;base64,${base64Data}`;
                    }
                }

                this.saveImageBase64(base64Data);
            };
            reader.readAsDataURL(file);
        } else {
            this.showToast('Error', 'No file selected.', 'error');
            this.showSpinner = false;
        }
    }

    // Save Base64 data to Salesforce
    saveImageBase64(base64Data) {
        saveImageToSalesforce({ recordId: this.recordId, base64Content: base64Data })
            .then(() => {
                // this.showToast('Success', 'Signature saved successfully.', 'success');
            })
            .catch((error) => {
                console.error('Error saving signature:', error);
                // this.showToast('Error', 'Failed to save signature.', 'error');
            })
            .finally(() => {
                this.showSpinner = false;
            });
    }

    // Show toast notifications
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant,
            })
        );
    }


    

    // Map to store temporary images (Key: pageNumber, Value: Base64 image data)
temporaryImageCache = new Map(); // Temporary cache for preview images
isPreviewVisible = false;
isConfirmationPopupVisible = false;
confirmationPopupPages = []; // Array to store all pages for the confirmation popup


    async handleConfirm() {
        // if (this.temporaryImageCache.size === 0) {
        //     this.showToast('Error', 'No images available for confirmation.', 'error');
        //     return;
        // }

        if (this.temporaryImageCache.size === 0) {
            console.warn('No placeholders found, rendering pages from PDF directly.');
        }


        // Prepare data for displaying in the confirmation popup
        const allPages = [];
        for (let pageNumber = 1; pageNumber <= this.pdfDoc.numPages; pageNumber++) {
            if (this.temporaryImageCache.has(pageNumber)) {
                allPages.push({
                    id: pageNumber,
                    src: this.temporaryImageCache.get(pageNumber),
                    alt: `Page ${pageNumber}`
                });
            } else {
                // Render static pages for those without cached images
                const page = await this.pdfDoc.getPage(pageNumber);
                const viewport = page.getViewport({ scale: 3 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({ canvasContext: context, viewport }).promise;

                const staticImage = canvas.toDataURL('image/png');
                allPages.push({
                    id: pageNumber,
                    src: staticImage,
                    alt: `Page ${pageNumber}`
                });
            }
        }

        // Open the custom popup with all images
        
        this.isConfirmationPopupVisible = true;
        this.confirmationPopupPages = allPages;
    }

    closePreview() {
        this.isPreviewVisible = false;
    }

    closeConfirmationPopup() {
        this.isConfirmationPopupVisible = false;
    }


    
    async handlePreview() {
        if (!this.placeholders || this.placeholders.length === 0) {
            this.showToast('Error', 'No placeholders available for preview.', 'error');
            return;
        }
    
        try {
            
            this.isPreviewMode = true; // Enable preview mode
    
            for (const placeholder of this.placeholders) {
                const placeholderElement = this.template.querySelector(`[data-id="${placeholder.id}"]`);
    
                if (placeholderElement) {
                    const boundingRect = placeholderElement.getBoundingClientRect(); // Get position and size
    
                    // Array to hold all image sources for the placeholder
                    const imagesToProcess = [
                        { type: 'FNimageSrc', src: placeholder.FNimageSrc },
                        { type: 'LNimageSrc', src: placeholder.LNimageSrc },
                        { type: 'INimageSrc', src: placeholder.INimageSrc }, // Initials
                        { type: 'FullNameSrc', src: placeholder.FullNameSrc }, // Full Name
                        { type: 'EmailSrc', src: placeholder.EmailSrc }, // Email
                        { type: 'PhoneSrc', src: placeholder.PhoneSrc }, // Contact
                        { type: 'AddressSrc', src: placeholder.AddressSrc }, // Address
                        { type: 'DateSrc', src: placeholder.DateSrc }, // Date
                        { type: 'DateOfSigningSrc', src: placeholder.DateOfSigningSrc },
                        { type: 'imageSrc', src: placeholder.imageSrc }, // Signature
                    ];
    
                    // Process each image source sequentially
                    for (const image of imagesToProcess) {
                        if (image.src) {
                            const base64Data = image.src.split(',')[1]; // Extract Base64 content
                            const imageBlob = this.base64ToBlob(base64Data, 'image/png'); // Convert Base64 to Blob
    
                            // Embed the image with adjusted size
                            await this.embedImageWithAdjustedHeight(
                                imageBlob,
                                boundingRect,
                                placeholder.page
                            );
    
                            console.log(
                                `Embedded ${image.type} at page: ${placeholder.page}, X: ${boundingRect.x}, Y: ${boundingRect.y}`
                            );
                        }
                    }
    
                    // Save the updated base image in the cache
                    this.temporaryImageCache.set(placeholder.page, this.imageSrc);
                }
            }
    
            console.log('Preview images cached successfully.');
        } catch (error) {
            console.error('Error generating preview:', error);
            this.showToast('Error', 'Failed to generate preview.', 'error');
        } finally {
            
        }
    
        // Call handleConfirm after preview generation is completed
        await this.handleConfirm();
    }
    
    handlePreviewClick() {
        this.isPreviewModalVisible = true;
    }

    // Handle "Proceed" button in the modal
    proceedWithPreview() {

        if (!this.validatePlaceholders()) {
        this.isPreviewModalVisible = false;
        return;
    }
        this.isLoadingpop = true;
        this.isPreviewModalVisible = false; // Close the modal
        this.automatePreviewProcess(); // Execute the preview logic
    }

    // Handle "Cancel" button in the modal
    cancelPreview() {
        this.isPreviewModalVisible = false; // Close the modal
    }
    
validatePlaceholders() {
    let missingFields = [];

    // Check text-based placeholders that don’t have images
    const requiredPlaceholders = this.placeholders.filter(ph => !ph.hasImage);

    for (let ph of requiredPlaceholders) {
        const value = ph.value ? ph.value.trim() : '';
        if (!value) {
            missingFields.push(this.getPlaceholderLabel(ph));
        }
    }

    // Check signature placeholders
    const signaturePlaceholders = this.placeholders.filter(ph => ph.isSignature);
    for (let sig of signaturePlaceholders) {
        if (!sig.hasImage) {
            missingFields.push('Signature');
        }
    }

    // Show all missing fields together
    if (missingFields.length > 0) {
        const uniqueMissing = [...new Set(missingFields)];
        const fieldList = uniqueMissing.join(', ');
        const message = `The following required field${uniqueMissing.length > 1 ? 's are' : ' is'} incomplete: ${fieldList}. Please ensure all required information is provided before proceeding.`;
        this.showToast('Incomplete Information', message, 'error');
        return false;
    }

    return true;
}


getPlaceholderLabel(ph) {
    if (ph.isName) return 'First Name';
    if (ph.isLastName) return 'Last Name';
    if (ph.isInitials) return 'Initials';
    if (ph.isFullName) return 'Full Name';
    if (ph.isEmail) return 'Email';
    if (ph.isContactNumber) return 'Contact Number';
    if (ph.isAddress) return 'Address';
    if (ph.isDate) return 'Date';
    if (ph.isDateOfSigning) return 'Date of Signing';
    return 'Field';
}


    
    async embedImageWithAdjustedHeight(imageBlob, boundingRect, pageNumber) {
        try {
            const page = await this.pdfDoc.getPage(pageNumber); // Fetch the current page
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const viewport = page.getViewport({ scale: 6 }); // Scale for better quality
    
            // Set canvas dimensions
            canvas.height = viewport.height;
            canvas.width = viewport.width;
    
            // Render the PDF page or use the current base image as the background
            if (!this.imageSrc) {
                await page.render({ canvasContext: context, viewport }).promise;
            } else {
                const baseImage = new Image();
                baseImage.src = this.imageSrc;
    
                await new Promise((resolve) => {
                    baseImage.onload = () => {
                        context.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
                        resolve();
                    };
                });
            }
    
            // Get the actual canvas dimensions
            const canvasRect = this.template.querySelector('.image-container img').getBoundingClientRect(); // Canvas dimensions
            const scaleX = canvas.width / canvasRect.width;
            const scaleY = canvas.height / canvasRect.height;
    
            // Calculate scaled positions based on boundingRect
            const adjustedX = (boundingRect.x - canvasRect.x) * scaleX;
            const adjustedY = (boundingRect.y - canvasRect.y) * scaleY;
    
            // Adjust the width and height based on placeholder's original dimensions
            const adjustedWidth = boundingRect.width * scaleX;
            const adjustedHeight = boundingRect.height * scaleY;
    
            // Render the uploaded image onto the PDF canvas with exact dimensions
            const imageBitmap = await createImageBitmap(imageBlob);
            context.drawImage(
                imageBitmap,
                adjustedX,
                adjustedY,
                adjustedWidth,
                adjustedHeight
            );
    
            // Update the base image for subsequent operations
            this.imageSrc = canvas.toDataURL('image/png', 1.0);
    
            console.log(`Image embedded at x: ${adjustedX}, y: ${adjustedY}, width: ${adjustedWidth}, height: ${adjustedHeight}`);
        } catch (error) {
            console.error('Error embedding image into PDF:', error);
            this.showToast('Error', 'Failed to embed image into preview.', 'error');
        }
    }
    
    
    

    
    
    
    // Helper function to convert Base64 to Blob
    base64ToBlob(base64, contentType) {
        const byteCharacters = atob(base64);
        const byteNumbers = Array.from(byteCharacters).map((char) => char.charCodeAt(0));
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: contentType });
    }
    
    handleInitialsSelection(event) {
        const id = parseInt(event.target.dataset.id, 10);
        const placeholder = this.placeholders.find((item) => item.id === id);
        if (placeholder) {
            placeholder.value = event.target.value;
            console.log(`Initials selected: ${placeholder.value}`);
        }
    }
    
    // Close the preview modal
    closePreview() {
        this.isPreviewMode = false; // Disable preview mode
        this.isPreviewVisible = false; // Close the preview modal
        console.log('Preview modal closed.');
    }
    
    
    
    
    handleSaveSignature(placeholder) {
        if (!placeholder.value) {
            this.showToast('Error', 'No signature uploaded.', 'error');
            return;
        }
    
        saveSignatureToSalesforce({
            recordId: this.recordId,
            signatureData: placeholder.value // Base64 signature
        })
            .then(() => {
                console.log('Signature saved successfully in Salesforce.');
                this.showToast('Success', 'Signature saved successfully.', 'success');
            })
            .catch((error) => {
                console.error('Error saving signature:', error);
                this.showToast('Error', 'Failed to save signature.', 'error');
            });
    }
    
    

    get placeholdersForCurrentPage() {
        if (!this.placeholdersByPage[this.currentPage]) {
            this.placeholdersByPage[this.currentPage] = this.placeholders.filter(
                (placeholder) => placeholder.page === this.currentPage
            );
        }
        return this.placeholdersByPage[this.currentPage];
    }
    

    openPreview(imageSrc, recordId) {
        this.isPreviewVisible = true;
        this.imageSrc = imageSrc;
        this.recordId = recordId;
    }
    @track isSpinning = '';
    @track pdfUrl = '';



    async handleGeneratePDF() {
        try {
            if (!this.confirmationPopupPages || this.confirmationPopupPages.length === 0) {
                console.warn('⚠️ No images found to generate the PDF.');
                return;
            }
    
            // Extract Base64 data from images and calculate sizes
            const base64Images = this.confirmationPopupPages.map((imageElement, index) => {
                if (imageElement.src && imageElement.src.includes(',')) {
                    let base64Data = imageElement.src;
                    let imageSize = Math.ceil(base64Data.length * (3 / 4)); // Approximate size in bytes
                    console.log(`🖼️ Image ${index + 1}: ${imageSize} bytes (${(imageSize / 1024 / 1024).toFixed(2)} MB)`);
                    return { base64Data, imageSize };
                }
                console.warn(`⚠️ Invalid image source at index ${index}:`, imageElement.src);
                return null;
            }).filter(Boolean);
    
            if (base64Images.length === 0) {
                console.warn('⚠️ No valid Base64 images found.');
                return;
            }
    
            const clientId = 'client123';
            console.log('🔄 Grouping Images into Batches...');
    
            // Maximum batch size (5MB)
            const maxBatchSize = 5 * 1024 * 1024;
            let imageBatches = [];
            let currentBatch = [];
            let currentBatchSize = 0;
    
            // 🔹 Group images into batches ≤ 5MB
            for (let i = 0; i < base64Images.length; i++) {
                let { base64Data, imageSize } = base64Images[i];
    
                if (currentBatchSize + imageSize > maxBatchSize) {
                    console.log(`📦 Creating new batch. Current batch size: ${(currentBatchSize / 1024 / 1024).toFixed(2)} MB`);
                    imageBatches.push([...currentBatch]);
                    currentBatch = [];
                    currentBatchSize = 0;
                }
    
                currentBatch.push(base64Data);
                currentBatchSize += imageSize;
            }
    
            if (currentBatch.length > 0) {
                console.log(`📦 Final Batch Size: ${(currentBatchSize / 1024 / 1024).toFixed(2)} MB`);
                imageBatches.push([...currentBatch]);
            }
    
            console.log('📤 Total API Calls Required:', imageBatches.length);
    
            this.isConfirmationPopupVisible = false;
            this.showSuccessScreen = true;
            this.isSpinning = true;
    
            let uploadedImageCount = 0;
            let totalImageCount = base64Images.length;
    
            for (let i = 0; i < imageBatches.length; i++) {
                let batch = imageBatches[i];
    
                console.log(`📤 Sending Batch ${i + 1}/${imageBatches.length} (${batch.length} images) - Size: ${(batch.reduce((sum, img) => sum + img.length * (3 / 4), 0) / 1024 / 1024).toFixed(2)} MB`);
                
                try {
                    let response = await fetch('https://tesseractapps.com/upload-images', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            recordId: this.recordId,
                            images: batch,
                            totalImageCount: totalImageCount
                        })
                    });
    
                    let result = await response.json();
                    if (!response.ok) {
                        throw new Error(`❌ Error sending batch ${i + 1}: ${JSON.stringify(result)}`);
                    }
    
                    uploadedImageCount += batch.length;
                    console.log(`✅ Batch ${i + 1} Sent Successfully (${uploadedImageCount}/${totalImageCount} images uploaded).`);
    
                    // if (result.isCompleted) {
                    //     console.log('📤 All images uploaded! Now generating PDF...');
                    //     this.pdfUrl = await this.triggerPDFGeneration();

                    //     if (this.pdfUrl) {
                    //         await this.storePdfInSalesforce(this.pdfUrl, this.recordId);
                    //     }

                    //     this.deactivateCurrentLink();
                        
                    // }
    
                } catch (error) {
                    console.error(`❌ Error sending Batch ${i + 1}:`, error);
                    this.isSpinning = false;
                    this.showFailureScreen = true;
                    return;
                }
            }
    
            if (!this.pdfUrl) {
                console.warn('⏳ PDF generation in progress. Waiting for all images to be received.');
            }
    
            // this.isSpinning = false;
            // this.showSuccessScreen = true;

            console.log('✅ All batches uploaded! Triggering PDF generation...');
        this.pdfUrl = await this.triggerPDFGeneration();

        if (this.pdfUrl) {
            await this.storePdfInSalesforce(this.pdfUrl, this.recordId);
            await this.deactivateCurrentLink();
            this.showSuccessScreen = true;
        } else {
            this.showFailureScreen = true;
        }

        this.isSpinning = false; 
    
        } catch (error) {
            console.error('❌ Error generating PDF:', error);
            this.isSpinning = false;
            this.showSuccessScreen = false;
            this.showFailureScreen = true;
        }
    }
    
    async triggerPDFGeneration() {
        try {
            console.log('🔹 Triggering PDF generation...');
            let response = await fetch('https://tesseractapps.com/generate-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recordId: this.recordId })
            });
    
            let result = await response.json();
            if (!response.ok || !result.pdfUrl) {
                throw new Error('❌ PDF generation failed.');
            }
    
            console.log('✅ PDF Generated Successfully. PDF URL:', result.pdfUrl);
            return result.pdfUrl;
        } catch (error) {
            console.error('❌ Error triggering PDF generation:', error);
            return null;
        }
    }
    async storePdfInSalesforce(pdfUrl, parentRecordId) {
        if (!pdfUrl || !parentRecordId) {
            console.warn('⚠️ Missing parameters, skipping record storage.');
            return;
        }
    
        try {
            console.log('📌 Storing generated PDF record in Salesforce with recipient email:', this.nextRecipientEmail);
    
            await storePdfRecord({ pdfUrl: pdfUrl, parentRecordId: parentRecordId, recipientEmail: this.nextRecipientEmail });
    
            console.log('✅ Child record created successfully in Apex.');
            this.isSpinning = false;
            this.showSuccessScreen = true;
            this.showToast('Success', 'Signature saved successfully.', 'success');
        } catch (error) {
            console.error('❌ Error inserting Child_Signatures__c record:', error);
            this.showToast('Error', 'Failed to store signature in Salesforce.', 'error');
        }
    }
    
    



    //presign urls

//     async handleGeneratePDFdfssdf() {
//         try {
//             // Ensure there are images to process
//             if (!this.confirmationPopupPages || this.confirmationPopupPages.length === 0) {
//                 console.warn('⚠️ No images found to generate the PDF.');
//                 return;
//             }
    
//             // Extract Base64 data from images
//             const base64Images = this.confirmationPopupPages.map((imageElement, index) => {
//                 if (imageElement.src && imageElement.src.includes(',')) {
//                     const base64Data = imageElement.src;
//                     console.log(`🖼️ Image ${index + 1} Base64 Data:`, base64Data.substring(0, 50) + '...');
//                     return base64Data;
//                 }
//                 console.warn(`⚠️ Invalid image source at index ${index}:`, imageElement.src);
//                 return null;
//             }).filter(Boolean);
    
//             console.log('📸 Base64 Images Array:', JSON.stringify(base64Images));
    
//             if (base64Images.length === 0) {
//                 console.warn('⚠️ No valid Base64 images found.');
//                 return;
//             }
    
//             const clientId = 'client123'; // Example client ID
//             console.log('🔄 Requesting Pre-Signed URLs from AWS...');
    
//             // Step 1: Request Pre-Signed URLs for each image from AWS
//             const presignedUrls = await this.requestPresignedUrls(base64Images.length);
//             if (!presignedUrls || presignedUrls.length === 0) {
//                 console.error('❌ Failed to get pre-signed URLs.');
//                 return;
//             }
//             console.log('✅ Received Pre-Signed URLs stringify:', JSON.stringify(presignedUrls, null, 2));

//             console.log('✅ Received Pre-Signed URLs:', presignedUrls);
    
//             // Step 2: Upload Images to AWS S3
//             const uploadedImageUrls = await this.uploadImagesToS3(base64Images, presignedUrls);
//             if (!uploadedImageUrls || uploadedImageUrls.length === 0) {
//                 console.error('❌ Image upload failed.');
//                 return;
//             }
    
//             console.log('✅ Uploaded Image URLs:', uploadedImageUrls);
//             const imageUrls = JSON.parse(JSON.stringify(uploadedImageUrls));

// // Log properly formatted image URLs
// console.log('✅ Uploaded Image URLs:', JSON.stringify(imageUrls, null, 2));
    
//             // Step 3: Send the image URLs to Apex to generate the PDF
//             console.log('📤 Sending Image URLs to Apex for PDF generation...');
//             this.isConfirmationPopupVisible = false;
//             this.showSuccessScreen = true;
//             this.isSpinning = true;
    
//             this.pdfUrl = await generatePdfdf({ 
//                 imageUrls, 
//                 clientId, 
//                 parentRecordId: this.recordId, 
//                 recipientEmail: this.nextRecipientEmail 
//             });
//             this.pdfUrl = presignedUrls.find(url => url.pdfUrl)?.pdfUrl || null;
 
//             if (this.pdfUrl) {
//                 console.log('✅ PDF Generated Successfully. PDF URL:', this.pdfUrl);
//             } else {
//                 console.error('❌ PDF generation failed.');
//             }
//             console.log('✅ PDF Generated Successfully. PDF URL:', this.pdfUrl);
    
//             // Step 4: Update UI after successful PDF generation
//             this.isSpinning = false; 
//             this.showSuccessScreen = true; 
//             this.deactivateCurrentLink();
    
//         } catch (error) {
//             console.error('❌ Error generating PDF:', error);
//             this.error = error;
//             this.isSpinning = false;
//             this.showSuccessScreen = false;
//             this.showFailureScreen = true;
//         }
//     }
//     async requestPresignedUrls(imageCount) {
//         try {
//             const requests = Array(imageCount).fill().map(async (value, index) => {
//                 const isLastImage = index === imageCount - 1; // Check if it's the last image
//                 const response = await fetch('https://tesseractapps.com/generate-presigned-url', {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify({ 
//                         fileExtension: 'jpg', 
//                         completed: isLastImage // Set to true for the last image
//                     })
//                 });
     
//                 const result = await response.json();
//                 if (result.uploadUrl && result.fileKey) {
//                     return { uploadUrl: result.uploadUrl, fileKey: result.fileKey, pdfUrl: result.pdfUrl || null };
//                 } else {
//                     console.warn('⚠️ Failed to get a valid pre-signed URL:', result);
//                     return null;
//                 }
//             });
     
//             const urls = await Promise.all(requests);
//             return urls.filter(url => url !== null);
//         } catch (error) {
//             console.error('❌ Error requesting pre-signed URLs:', error);
//             return [];
//         }
//     }

    
//     async uploadImagesToS3(base64Images, presignedUrls) {
//         try {
//             const uploadRequests = base64Images.map(async (base64Data, index) => {
//                 const { uploadUrl, fileKey } = presignedUrls[index];
    
//                 // Convert Base64 to Blob
//                 const blob = this.base64ToBlobIMG(base64Data);
//                 if (!blob) return null;
    
//                 // Check if this is the last image
//                 const isLastImage = index === base64Images.length - 1;
    
//                 // Upload to AWS S3
//                 const response = await fetch(uploadUrl, {
//                     method: 'PUT',
//                     headers: {
//                         'Content-Type': 'image/jpg'
//                     },
//                     body: isLastImage 
//                         ? JSON.stringify({ completed: true }) // Send JSON for the last image
//                         : blob
//                 });
    
//                 if (response.ok) {
//                     console.log(`✅ Uploaded Image ${index + 1}: ${fileKey}`);
//                     return `https://docimgupld.s3.ap-southeast-2.amazonaws.com/${fileKey}`;
//                 } else {
//                     console.error(`❌ Failed to upload Image ${index + 1}:`, response.statusText);
//                     return null;
//                 }
//             });
    
//             const uploadedUrls = await Promise.all(uploadRequests);
//             return uploadedUrls.filter(url => url !== null);
//         } catch (error) {
//             console.error('❌ Error uploading images to AWS S3:', error);
//             return [];
//         }
//     }
    
    
//     base64ToBlobIMG(base64) {
//         try {
//             const byteCharacters = atob(base64.split(',')[1]);
//             const byteNumbers = new Array(byteCharacters.length).fill().map((_, i) => byteCharacters.charCodeAt(i));
//             const byteArray = new Uint8Array(byteNumbers);
//             return new Blob([byteArray], { type: 'image/jpeg' }); // Change based on image type
//         } catch (error) {
//             console.error('❌ Error converting Base64 to Blob:', error);
//             return null;
//         }
//     }


// async handleGeneratePDF() {
//     try {
//         // Ensure there are images to process
//         if (!this.confirmationPopupPages || this.confirmationPopupPages.length === 0) {
//             console.warn('⚠️ No images found to generate the PDF.');
//             return;
//         }

//         // Extract Base64 data from images
//         const base64Images = this.confirmationPopupPages.map((imageElement, index) => {
//             if (imageElement.src && imageElement.src.includes(',')) {
//                 return imageElement.src;
//             }
//             console.warn(`⚠️ Invalid image source at index ${index}:`, imageElement.src);
//             return null;
//         }).filter(Boolean);

//         console.log('📸 Base64 Images Array:', JSON.stringify(base64Images));

//         if (base64Images.length === 0) {
//             console.warn('⚠️ No valid Base64 images found.');
//             return;
//         }

//         const clientId = 'client123'; // Example client ID
//         console.log('🔄 Requesting Pre-Signed URLs from Apex...');

//         // Step 1: Call Apex to get presigned URLs for each image
//         const folderName = `uploads/${new Date().toISOString().replace(/[-:.TZ]/g, '')}/`;
//         let uploadedImageKeys = [];

//         for (let i = 0; i < base64Images.length; i++) {
//             const isLastImage = i === base64Images.length - 1;
//             const payload = {
//                 fileExtension: 'jpg',
//                 folder: folderName,
//                 completed: isLastImage // Last image triggers PDF generation
//             };

//             try {
//                 const presignedResponse = await fetch('https://tesseractapps.com/generate-presigned-url', {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify(payload)
//                 });

//                 const presignedResult = await presignedResponse.json();
//                 if (!presignedResponse.ok || !presignedResult.uploadUrl || !presignedResult.fileKey) {
//                     console.error(`❌ Failed to get pre-signed URL for Image ${i + 1}:`, presignedResult);
//                     return;
//                 }

//                 console.log(`✅ Pre-Signed URL for Image ${i + 1}:`, presignedResult.uploadUrl);

//                 // Step 2: Upload Base64 image using the pre-signed URL
//                 const uploadSuccess = await this.uploadBase64Image(presignedResult.uploadUrl, base64Images[i]);

//                 if (uploadSuccess) {
//                     uploadedImageKeys.push(presignedResult.fileKey);
//                 } else {
//                     console.error(`❌ Image ${i + 1} upload failed.`);
//                     return;
//                 }

//             } catch (error) {
//                 console.error(`❌ Error processing Image ${i + 1}:`, error);
//                 return;
//             }
//         }

//         console.log('✅ All Images Uploaded! Waiting for PDF generation...');

//         this.isConfirmationPopupVisible = false;
//         this.showSuccessScreen = true;
//         this.isSpinning = true;

//         // Step 3: Call Apex to generate PDF and fetch the URL
//         this.pdfUrl = await generatePdf({
//             base64Images: uploadedImageKeys,
//             clientId,
//             parentRecordId: this.recordId,
//             recipientEmail: this.nextRecipientEmail
//         });

//         console.log('✅ PDF Generated Successfully. PDF URL:', this.pdfUrl);
//         this.isSpinning = false;
//         this.showSuccessScreen = true;
//         this.deactivateCurrentLink();

//     } catch (error) {
//         console.error('❌ Error generating PDF:', error);
//         this.error = error;
//         this.isSpinning = false;
//         this.showSuccessScreen = false;
//         this.showFailureScreen = true;
//     }
// }

// async uploadBase64Image(presignedUrl, base64Image) {
//     try {
//         // Convert Base64 to Blob
//         const blob = this.base64ToBlobimg(base64Image);
//         if (!blob) {
//             console.error('❌ Failed to convert Base64 to Blob.');
//             return false;
//         }

//         console.log('📤 Uploading image to AWS:', presignedUrl);

//         const uploadResponse = await fetch(presignedUrl, {
//             method: 'PUT',
//             headers: { 
//                 'Content-Type': 'image/jpeg'  // ✅ Ensure this matches the pre-signed URL signature
//             },
//             body: blob
//         });

//         if (uploadResponse.ok) {
//             console.log('✅ Successfully uploaded image.');
//             return true;
//         } else {
//             console.error('❌ Failed to upload image:', uploadResponse.status, uploadResponse.statusText);
//             return false;
//         }
//     } catch (error) {
//         console.error('❌ Error uploading image:', error);
//         return false;
//     }
// }


// base64ToBlobimg(base64) {
//     try {
//         const byteCharacters = atob(base64.split(',')[1]);
//         const byteNumbers = new Array(byteCharacters.length).fill().map((_, i) => byteCharacters.charCodeAt(i));
//         const byteArray = new Uint8Array(byteNumbers);
//         return new Blob([byteArray], { type: 'image/jpeg' });
//     } catch (error) {
//         console.error('❌ Error converting Base64 to Blob:', error);
//         return null;
//     }
// }
    



    handleRetry() {
        this.showFailureScreen = false;
        this.isSpinning = false;
        this.isConfirmationPopupVisible = true;
    }
    
    async deactivateCurrentLink() {
        try {
            // Determine the correct recordId dynamically
            const idToUse = this.currentRecipientIndex > 0 ? this.childSignatureId : this.recordId;
    
            if (!idToUse) {
                console.error('❌ No valid record ID found for deactivating link.');
                this.showToast('Error', 'No valid record found to deactivate the link.', 'error');
                return;
            }
    
            console.log(`🔹 Deactivating link for recordId: ${idToUse}`);
    
            await deactivateLink({ recordId: idToUse });
    
            console.log(`✅ Successfully deactivated link for ${idToUse}`);
            
        } catch (error) {
            console.error('🚨 Error deactivating link:', error);
            this.showToast('Error', 'Failed to deactivate the link.', 'error');
        }
    }
    

    showSuccessToast(message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: message,
                variant: 'success',
            })
        );
    }

    showErrorToast(message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: message,
                variant: 'error',
            })
        );
    }
    
    
    retrieveFileName() {
        // Call Apex to retrieve the file name from File_Name__c
        return new Promise((resolve, reject) => {
            getFileNameFromRecord({ recordId: this.recordId })
                .then((fileName) => {
                    console.log('Retrieved file name:', fileName);
                    resolve(fileName);
                })
                .catch((error) => {
                    console.error('Error fetching file name:', error);
                    reject(error);
                });
        });
    }
    
    uploadFileToSalesforce(fileBlob, fileName) {
        uploadFileToSalesforce({
            fileBlob,
            fileName,
            recordId: this.recordId
        })
            .then(() => {
                console.log('Preview image uploaded successfully to Salesforce Files.');
                this.showToast('Success', 'Preview image uploaded successfully.', 'success');
            })
            .catch((error) => {
                console.error('Error uploading preview image:', error);
                this.showToast('Error', 'Image upload failed.', 'error');
            });
    }
    
    
    

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant,
            })
        );
    }

    

    /**
     * Opens the signature modal.
     */
    openSignatureModal() {
        this.isSignatureModalVisible = true;
    }

    /**
     * Closes the signature modal.
     */
    closeSignatureModal() {
        this.isSignatureModalVisible = false;
    }

    /**
     * Opens the name signature modal.
     */
    openNameSignatureModal() {
        console.log('Enter Name for Signature clicked'); // Debug
        this.isNameSignatureModalVisible = true;
        console.log('isNameSignatureModalVisible:', this.isNameSignatureModalVisible); // Debug
    }
    
    

    /**
     * Closes the name signature modal.
     */
    closeNameSignatureModal() {
        this.isNameSignatureModalVisible = false;
        this.enteredName = '';
        this.styledPreviews = [];
    }

    /**
     * Handles input change for the name field.
     * @param {Event} event - Input event.
     */
    handleNameInput(event) {
        this.enteredName = event.target.value;

        // Regenerate font previews whenever the name changes
        this.generateFontStyles();
    }

    /**
     * Generates font previews based on the entered name.
     */
    generateFontStyles() {
        if (!this.enteredName) {
            this.styledPreviews = [];
            return;
        }

        // Add more stylish and calligraphy fonts
        const fontStyles = [
            'adage-script-jf',
            'adobe-handwriting-ernie',
            'adobe-handwriting-frank',
            'adobe-handwriting-tiffany',
            'adore-you',
            'adore-you-slanted',
            'adorn-bouquet',
            'adorn-coronet',
            'adorn-garland',
            'adorn-pomander',
            'adventures-unlimited',
            'alana-smooth',
            'altesse-std-24pt',
            'altesse-std-64pt',
            'antiquarian-scribe',
            'avalon',
            'farnham-text',
            'filmotype-jade',
            'filmotype-kitten',
            'handsome-pro',
            'handsome-pro-classic',
            'handsome-pro-nib',
            'handsome-pro-rough',
            'limon-bold-marker',
            'limon-bold-marker-outline',
            'limon-regular',
            'limon-regular-marker',
            'limon-regular-marker-outline',
            'limon-script',
            'limon-script-regular-outline',
            'lindsey-signature',
            'logic-monoscript',
            'logic-monospace',
            'mina',
            'p22-allyson-pro',
            'p22-cezanne-pro',
            'p22-typewriter',
            'parfumerie-script',
            'professor',
            'recherche',
            'rizado-script',
            'salamat',
            'sanvito-pro',
            'sanvito-pro-caption',
            'sanvito-pro-display',
            'sanvito-pro-subhead',
            'shabby-chic',
            'timberline',
            'voluta-script-pro',
            'youngblood',         
        ];

        this.styledPreviews = fontStyles.map((font, index) => ({
            id: index,
            fontFamily: font,
            name: this.enteredName,
        }));

        // Render fonts on canvases after DOM updates
        this.renderFontPreviews();
    }

    // renderFontPreviews() {
    //     setTimeout(() => {
    //         this.styledPreviews.forEach((style) => {
    //             const canvas = this.template.querySelector(`canvas[data-id="${style.id}"]`);
    //             if (canvas) {
    //                 const context = canvas.getContext('2d');
    //                 context.clearRect(0, 0, canvas.width, canvas.height);
    //                 context.font = `50px '${style.fontFamily}', sans-serif`;
    //                 context.textAlign = 'center'; // Center text horizontally
    //                 context.textBaseline = 'middle'; // Center text vertically
    //                 context.fillStyle = '#000';
    //                 context.fillText(style.name, canvas.width / 2, canvas.height / 2); // Render name in canvas
    //             }
    //         });
    //     }, 0);
    // }


    renderFontPreviews() {
        setTimeout(() => {
            this.styledPreviews.forEach((style) => {
                const canvas = this.template.querySelector(`canvas[data-id="${style.id}"]`);
                if (canvas) {
                    const context = canvas.getContext('2d');
                    
                    // Set an initial font
                    let fontSize = 50;
                    context.font = `${fontSize}px '${style.fontFamily}', sans-serif`;
    
                    // Measure text width
                    const textWidth = context.measureText(style.name).width;
                    const padding = 40; // Some padding around text
    
                    // Dynamically resize canvas width if needed
                    const requiredWidth = textWidth + padding;
                    if (requiredWidth > canvas.width) {
                        canvas.width = requiredWidth;
                    }
    
                    // Clear and redraw
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    context.font = `${fontSize}px '${style.fontFamily}', sans-serif`;
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    context.fillStyle = '#000';
    
                    // Draw the text centered
                    context.fillText(style.name, canvas.width / 2, canvas.height / 2);
                }
            });
        }, 0);
    }
    
    
    

    /**
     * Handles style selection when a user clicks on a font preview.
     * @param {Event} event - Click event.
     */
    handleStyleSelection(event) {
        const styleId = event.currentTarget.dataset.id;
        this.selectedStyle = this.styledPreviews.find((style) => style.id === parseInt(styleId, 10));
    
        // Highlight the selected style visually
        this.template.querySelectorAll('.signature-font-style').forEach((el) => {
            el.classList.remove('selected');
        });
        event.currentTarget.classList.add('selected');
    
        // Render the selected font style on a canvas
        this.updatePlaceholderWithFontStyle();
    }
    
    // updatePlaceholderWithFontStyle() {
    //     if (!this.selectedStyle || !this.placeholderId) {
    //         this.showToast('Error', 'Please select a style and ensure a placeholder is selected.', 'error');
    //         return;
    //     }
    
    //     // Find the placeholder to update
    //     const placeholder = this.placeholders.find((item) => item.id === parseInt(this.placeholderId, 10));
    //     if (!placeholder) {
    //         this.showToast('Error', 'No placeholder found for this operation.', 'error');
    //         return;
    //     }
    
    //     // Generate the signature image from the selected font style
    //     const canvas = document.createElement('canvas');
    //     canvas.width = 200; // Adjust width
    //     canvas.height = 100; // Adjust height
    //     const context = canvas.getContext('2d');
    
    //     // Style the text using the selected font
    //     context.font = `30px ${this.selectedStyle.fontFamily}`;
    //     context.fillStyle = '#000';
    //     context.textAlign = 'center';
    //     context.textBaseline = 'middle';
    //     context.fillText(this.enteredName, canvas.width / 2, canvas.height / 2);
    
    //     // Convert the canvas to a Base64 image
    //     const base64Data = canvas.toDataURL('image/png');
    
    //     // Update the placeholder with the generated image
    //     placeholder.hasImage = true;
    //     placeholder.imageSrc = base64Data;
    //     // Update the cache for the current page
    //     if (this.placeholdersByPage[this.currentPage]) {
    //         const cachedPlaceholder = this.placeholdersByPage[this.currentPage].find(
    //             (item) => item.id === parseInt(this.placeholderId, 10)
    //         );
    //         if (cachedPlaceholder) {
    //             cachedPlaceholder.hasImage = true;
    //             cachedPlaceholder.imageSrc = base64Data;
    //         }
    //     }

    //     // Force re-render
    //     this.placeholders = [...this.placeholders];
    //     this.placeholdersByPage[this.currentPage] = [...this.placeholdersByPage[this.currentPage]];

            
    //     this.showToast('Success', 'Font style added to placeholder!', 'success');
    
    //     // Close the modal
    //     this.closeNameSignatureModal();
    //     this.closeSignatureModal();
    // }

    
    updatePlaceholderWithFontStyle() {
        if (!this.selectedStyle || !this.placeholderId) {
            this.showToast('Error', 'Please select a style and ensure a placeholder is selected.', 'error');
            return;
        }
    
        const placeholder = this.placeholders.find((item) => item.id === parseInt(this.placeholderId, 10));
        if (!placeholder) {
            this.showToast('Error', 'No placeholder found for this operation.', 'error');
            return;
        }
    
        // Measure text width first
        const tempCanvas = document.createElement('canvas');
        const tempContext = tempCanvas.getContext('2d');
        const fontSize = 50; // Your desired consistent font size
        tempContext.font = `${fontSize}px '${this.selectedStyle.fontFamily}', sans-serif`;
    
        const textWidth = tempContext.measureText(this.enteredName).width;
        const padding = 100; // breathing room
    
        // Create canvas dynamically
        const canvas = document.createElement('canvas');
        canvas.width = textWidth + padding;
        canvas.height = 100; // or 120 based on design
    
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.font = `${fontSize}px '${this.selectedStyle.fontFamily}', sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = '#000';
        context.fillText(this.enteredName, canvas.width / 2, canvas.height / 2);
    
        const base64Data = canvas.toDataURL('image/png');
    
        placeholder.hasImage = true;
        placeholder.imageSrc = base64Data;
    
        if (this.placeholdersByPage[this.currentPage]) {
            const cachedPlaceholder = this.placeholdersByPage[this.currentPage].find(
                (item) => item.id === parseInt(this.placeholderId, 10)
            );
            if (cachedPlaceholder) {
                cachedPlaceholder.hasImage = true;
                cachedPlaceholder.imageSrc = base64Data;
            }
        }
    
        this.placeholders = [...this.placeholders];
        this.placeholdersByPage[this.currentPage] = [...this.placeholdersByPage[this.currentPage]];
    
        this.showToast('Success', 'Font style added!', 'success');
    
        this.closeNameSignatureModal();
        this.closeSignatureModal();
    }
    

    /**
     * Shows a toast message.
     * @param {string} title - Title of the toast.
     * @param {string} message - Message of the toast.
     * @param {string} variant - Variant of the toast (e.g., 'success', 'error').
     */
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant,
        });
        this.dispatchEvent(event);
    }

    // Debounce timeout
debounceTimer = null;




handleFNameInputChange(event) { // First Name
    this.handleInputChange(event, 'FNimageSrc', 'First Name updated successfully!');
}

handleLNameInputChange(event) { // Last Name
    this.handleInputChange(event, 'LNimageSrc', 'Last Name updated successfully!');
}
handleInitialsInputChange(event) {
    const placeholderId = event.target.dataset.id; // Get the ID of the placeholder
    const newValue = event.target.value; // Get the selected value from the dropdown

    // Find the placeholder by ID
    const placeholder = this.placeholders.find(
        (item) => item.id === parseInt(placeholderId, 10)
    );

    if (!placeholder) {
        this.showToast('Error', 'Placeholder not found.', 'error');
        return;
    }

    // Update the placeholder value with the selected dropdown value
    placeholder.value = newValue;

    // Dynamically determine the appropriate source field for the canvas
    let srcField = '';
    if (placeholder.isName) srcField = 'FNimageSrc';
    else if (placeholder.isLastName) srcField = 'LNimageSrc';
    else if (placeholder.isInitials) srcField = 'INimageSrc';

    if (!srcField) {
        this.showToast('Error', 'Unsupported placeholder type for editing.', 'error');
        return;
    }

    // Programmatically simulate opening the modal and saving the value
    this.currentPlaceholderId = placeholder.id;
    this.currentSrcField = srcField;
    this.editableText = newValue;

    // Directly trigger save logic without showing the modal
    this.saveEditedText();
}


handleFullNameInputChange(event) { // Full Name
    this.handleInputChange(event, 'FullNameSrc', 'Full Name updated successfully!');
}

handleEmailInputChange(event) { // Email
    this.handleInputChange(event, 'EmailSrc', 'Email updated successfully!');
}

handlePhoneInputChange(event) { // Contact Number
    event.target.value = event.target.value.replace(/\D/g, '');
    this.handleInputChange(event, 'PhoneSrc', 'Contact Number updated successfully!');
}

handleAddressInputChange(event) { // Address
    this.handleInputChange(event, 'AddressSrc', 'Address updated successfully!');
}

handleDateInputChange(event) { // Date
    this.handleInputChange(event, 'DateSrc', 'Date updated successfully!');
}

handleDateOfSigningInputChange(event) { // Date of Signing
    this.handleInputChange(event, 'DateOfSigningSrc', 'Date of Signing updated successfully!');
}



handleInputChange(event, srcField, successMessage) {
    const placeholderId = event.target.dataset.id;
    const newValue = event.target.value?.trim(); // trim to ignore spaces
    this.adjustInputWidth(event.target);

    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout(() => {
        const placeholder = this.placeholders.find(
            (item) => item.id === parseInt(placeholderId, 10)
        );

        if (!placeholder) {
            console.warn(`Placeholder with ID ${placeholderId} not found.`);
            return;
        }

        if (!newValue) {
            console.log('No input provided — skipping update.');
            return;
        }

        placeholder.value = newValue;
        this.updatePlaceholderWithCanvas(placeholder, srcField, successMessage);
    }, 2000);
}


adjustInputWidth(inputElement) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Set the font to match the input element's style
    const computedStyle = window.getComputedStyle(inputElement);
    context.font = computedStyle.font;

    // Measure the width of the input's value
    const textWidth = context.measureText(inputElement.value).width;

    // Add some padding to the calculated width
    const padding = parseInt(computedStyle.paddingLeft, 10) + parseInt(computedStyle.paddingRight, 10);
    const border = parseInt(computedStyle.borderLeftWidth, 10) + parseInt(computedStyle.borderRightWidth, 10);
    const newWidth = textWidth + padding + border;

    // Apply the new width to the input field
    inputElement.style.width = `${newWidth}px`;
}


updatePlaceholderWithCanvas(placeholder, srcField, successMessage) {
    if (!placeholder) {
        this.showToast('Error', 'No placeholder found to update.', 'error');
        return;
    }

    // Create the canvas and generate the Base64 image
    const base64Data = this.createCanvasImage(placeholder.value || 'Name');

    placeholder.hasImage = true;
    placeholder[srcField] = base64Data;

    this.placeholders = [...this.placeholders];

    if (this.placeholdersByPage[this.currentPage]) {
        const cachedPlaceholder = this.placeholdersByPage[this.currentPage].find(
            (item) => item.id === parseInt(placeholder.id, 10)
        );
        if (cachedPlaceholder) {
            cachedPlaceholder.hasImage = true;
            cachedPlaceholder[srcField] = base64Data;
        }
    }

    console.log(`${successMessage}: ${placeholder.value}`);
    this.showToast('Success', successMessage, 'success');
}



createCanvasImage(text, fontSize = 15, fontFamily = 'Roboto') {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Detect and format dd-mm-yyyy correctly
const ddMmYyyyRegex = /^\d{2}-\d{2}-\d{4}$/;
if (ddMmYyyyRegex.test(text)) {
    const [day, month, year] = text.split('-');
    text = `${day}-${month}-${year}`; // Preserve original format
} else {
    // fallback: try parsing and formatting as MM-DD-YYYY only for known formats
    const isProbablyDate = /^\d{4}-\d{2}-\d{2}$/.test(text) || /^\d{2}\/\d{2}\/\d{4}$/.test(text);
    if (isProbablyDate && !isNaN(Date.parse(text))) {
        const dateObj = new Date(text);
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const day = dateObj.getDate().toString().padStart(2, '0');
        const year = dateObj.getFullYear();
        text = `${day}-${month}-${year}`; // Keep consistent as dd-mm-yyyy
    }
}

const lines = text.split('\n');
    // Set the font style
    context.font = `${fontSize}px ${fontFamily}`;

    // Measure text dimensions for dynamic canvas sizing
    const textWidths = lines.map(line => context.measureText(line).width);
    const textWidth = Math.max(...textWidths);
    const lineHeight = fontSize * 1.5;
    const textHeight = lineHeight * lines.length;
    const padding = 20;

    // Calculate canvas dimensions dynamically
    const canvasWidth = Math.max(textWidth , fontSize * 4); // Minimum width to prevent stretching
    const canvasHeight = textHeight;

    canvas.width = Math.ceil(canvasWidth);
    canvas.height = Math.ceil(canvasHeight);

    // Set font and scaling after resizing canvas
    context.font = `${fontSize}px ${fontFamily}`;
    context.fillStyle = '#000'; // Text color
    context.textAlign = 'center'; // Center text horizontally
    context.textBaseline = 'middle'; // Center text vertically

    // Draw the text
     lines.forEach((line, i) => {
        context.fillText(
            line,
            canvas.width / 2,
            (lineHeight * i) + lineHeight / 2
        );
    });

    // Return the Base64 representation of the canvas
    return canvas.toDataURL('image/png', 1.0);
}

// createCanvasImage(text, fontSize = 15, fontFamily = 'Roboto') {
//     const canvas = document.createElement('canvas');
//     const context = canvas.getContext('2d');

//     // Format date if applicable
//     const isProbablyDate = /^\d{4}-\d{2}-\d{2}$/.test(text) || /^\d{2}\/\d{2}\/\d{4}$/.test(text);
//     if (isProbablyDate && !isNaN(Date.parse(text))) {
//         const dateObj = new Date(text);
//         const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
//         const day = dateObj.getDate().toString().padStart(2, '0');
//         const year = dateObj.getFullYear();
//         text = `${month}-${day}-${year}`;
//     }

//     const lines = text.split('\n');
//     const lineHeight = fontSize * 1.6;
//     const padding = 20;

//     // Measure max line width using temporary context
//     const tempCanvas = document.createElement('canvas');
//     const tempCtx = tempCanvas.getContext('2d');
//     tempCtx.font = `${fontSize}px ${fontFamily}`;
//     const textWidths = lines.map(line => tempCtx.measureText(line).width);
//     const maxLineWidth = Math.max(...textWidths);
//     const displayWidth = Math.max(maxLineWidth, fontSize * 4) + padding * 2;
//     const displayHeight = lineHeight * lines.length + padding * 2;

//     const scaleFactor = 2;

//     // Set internal resolution
//     canvas.width = displayWidth * scaleFactor;
//     canvas.height = displayHeight * scaleFactor;

//     // Visually render at original size
//     canvas.style.width = `${displayWidth}px`;
//     canvas.style.height = `${displayHeight}px`;

//     // Scale the drawing context
//     context.scale(scaleFactor, scaleFactor);

//     // Font and drawing setup
//     context.font = `${fontSize}px ${fontFamily}`;
//     context.fillStyle = '#000';
//     context.textAlign = 'center';
//     context.textBaseline = 'middle';

//     // Draw each line centered
//     lines.forEach((line, index) => {
//         const x = displayWidth / 2;
//         const y = padding + index * lineHeight + lineHeight / 2;
//         context.fillText(line, x, y);
//     });

//     return canvas.toDataURL('image/png', 1.0);
// }



allowOnlyNumbers(event) {
    const key = event.key;
    if (!/^\d$/.test(key)) {
        event.preventDefault();
    }
}



@track isEditModalVisible = false;
@track editableText = '';
@track currentPlaceholderId = null;
@track currentSrcField = '';
@track currentEditingLabel = '';
@track currentEditingType = 'text';



handleEditPlaceholder(event) {
    const placeholderId = event.target.dataset.id;

    const placeholder = this.placeholders.find(
        (item) => item.id === parseInt(placeholderId, 10)
    );

    if (!placeholder) {
        this.showToast('Error', 'Placeholder not found for editing.', 'error');
        return;
    }

    let srcField = '';
    let label = '';
    if (placeholder.isName) {
        srcField = 'FNimageSrc';
        label = 'First Name';
    } else if (placeholder.isLastName) {
        srcField = 'LNimageSrc';
        label = 'Last Name';
    } else if (placeholder.isInitials) {
        srcField = 'INimageSrc';
        label = 'Initials';
    } else if (placeholder.isFullName) {
        srcField = 'FullNameSrc';
        label = 'Full Name';
    } else if (placeholder.isEmail) {
        srcField = 'EmailSrc';
        label = 'Email';
    } else if (placeholder.isContactNumber) {
        srcField = 'PhoneSrc';
        label = 'Contact Number';
    } else if (placeholder.isAddress) {
        srcField = 'AddressSrc';
        label = 'Address';
    } else if (placeholder.isDate) {
        srcField = 'DateSrc';
        label = 'Date';
    } else if (placeholder.isDateOfSigning) {
        srcField = 'DateOfSigningSrc';
        label = 'Date of Signing';
    }

    if (!srcField) {
        this.showToast('Error', 'Unsupported placeholder type for editing.', 'error');
        return;
    }

    this.currentPlaceholderId = placeholder.id;
    this.currentSrcField = srcField;
    this.editableText = placeholder.value;
    this.currentEditingLabel = label;
    this.currentEditingType = this.getInputType(placeholder); 
    this.isEditModalVisible = true;
}

getInputType(ph) {
    if (ph.isContactNumber) return 'tel';
    if (ph.isInitials) return 'dropdown';
    if (ph.isEmail) return 'email';
    if (ph.isDate || ph.isDateOfSigning) return 'date';
    if (ph.isAddress) return 'textarea';
    return 'text';
}
get isEditTextInput() {
      return this.currentEditingType !== 'textarea' && this.currentEditingType !== 'dropdown';
}

get isEditTextArea() {
    return this.currentEditingType === 'textarea';
}
get isEditDropdown() {
    return this.currentEditingType === 'dropdown';
}


preventNonNumericInput(event) {
    if (this.currentEditingType === 'tel' && !/^\d$/.test(event.key)) {
        event.preventDefault();
    }
}



handleModalInputChange(event) {
    let inputValue = event.target.value;

    // If editing a contact number, strip non-digits
    if (this.currentEditingType === 'tel') {
        inputValue = inputValue.replace(/\D/g, ''); // Remove non-numeric characters
    }

    this.editableText = inputValue;
}


saveEditedText() {
    const placeholder = this.placeholders.find(
        (item) => item.id === this.currentPlaceholderId
    );

    if (!placeholder) {
        this.showToast('Error', 'Placeholder not found.', 'error');
        return;
    }

    const trimmedValue = this.editableText?.trim();

    if (!trimmedValue) {
        this.showToast('Validation Error', `Please enter a value for ${this.currentEditingLabel}.`, 'warning');
        return;
    }

    // Update the placeholder value
    placeholder.value = trimmedValue;

    // Update the canvas dynamically with the correct image source
    this.updatePlaceholderWithCanvas(
        placeholder,
        this.currentSrcField,
        `${this.currentEditingLabel} updated successfully!`
    );

    // Close the modal
    this.isEditModalVisible = false;
}



closeEditModal() {
    this.isEditModalVisible = false; // Hide the modal
    this.editableText = ''; // Clear the editable text
    this.currentPlaceholderId = null; // Reset the current placeholder ID
    this.currentSrcField = ''; // Reset the current image source field
}




async automatePreviewProcess() {
    try {


        // Find unique pages with placeholders
        const pagesWithPlaceholders = [...new Set(this.placeholders.map((p) => p.page))];
        console.log('Pages with placeholders:', pagesWithPlaceholders);

        for (const pageNumber of pagesWithPlaceholders) {
            console.log(`Navigating to page ${pageNumber}...`);
            
            // Navigate to the page
            this.currentPage = pageNumber;

            // Ensure the page image is updated
            await this.renderPageAsImage(this.currentPage);

            // Wait for navigation to complete
            await new Promise((resolve) => setTimeout(resolve, 500)); // Add a small delay for rendering

            // Trigger preview for the current page
            console.log(`Triggering preview for page ${this.currentPage}...`);
            await this.handlePreview();

            console.log(`Preview triggered for page ${pageNumber}`);
        }

        // Once all pages are processed, show the confirmation popup
        console.log('All previews completed. Preparing confirmation popup...');
        
        await this.handleConfirm();
    } catch (error) {
        console.error('Error during automated preview process:', error);
        this.showToast('Error', 'Failed to automate preview process.', 'error');
    } finally {
        this.isLoadingpop = false;
    }
}



//Messaging
startPolling() {
    // Poll every 5 seconds (adjust the interval as needed)
    this.pollingInterval = setInterval(() => {
        this.loadMessages(); // Fetch latest messages
    }, 1500);//chnage it to 1500
}

stopPolling() {
    // Clear the interval when the component is disconnected
    if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
    }
}
openConversationModal() {
    this.showConversationModal = true;
    this.loadMessages();
    this.startPolling();
}

closeConversationModal() {
    this.showConversationModal = false;
    this.stopPolling();
}

handleMessageInput(event) {
    this.newMessage = event.target.value;
}

scrollToBottom() {
    // Use a timeout to ensure the DOM has been updated before scrolling
    setTimeout(() => {
        const container = this.template.querySelector('.messages-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }, 100); // Slight delay to allow for rendering
}


async loadMessages() {
    try {
        const timestamp = Date.now(); // Cache-busting parameter
        const rawMessages = await fetchMessages({ recordId: this.recordId, cacheBuster: timestamp });
        const parsedMessages = JSON.parse(rawMessages);

        const formatTimestamp = (timestamp) => {
            if (!timestamp) return 'Invalid Date';
            const date = new Date(timestamp);
            if (isNaN(date)) return 'Invalid Date';
            const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            const formattedDate = date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
            return { time, date: formattedDate };
        };

        const flattenMessages = (messages) => {
            return messages.reduce((acc, message) => {
                if (Array.isArray(message)) {
                    return acc.concat(flattenMessages(message)); // Recursively flatten
                } else {
                    acc.push(message);
                    return acc;
                }
            }, []);
        };

        const flattenedMessages = flattenMessages(parsedMessages);

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
                isDateDivider: false, // Regular message
                class: `message ${message.from === 'R1' ? 'sent' : 'received'}`,
            });
        });

        const previousMessageCount = this.messages ? this.messages.length : 0;
        this.messages = groupedMessages;

        if (this.messages.length > previousMessageCount) {
            this.scrollToBottom();
        }

        console.log('Loaded Messages:', this.messages);
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}
handleKeyDown(event) {
    if (event.key === 'Enter') {
        if (event.shiftKey) {
            // Allow newline
            return;
        } else {
            // Prevent default "Enter" behavior (line break)
            event.preventDefault();
            this.sendMessage();
        }
    }
}




async sendMessage() {
    if (!this.newMessage.trim()) {
        return; // Prevent empty messages
    }

    const newMessageObject = {
        from: 'R1', // Static value for 'from'
        text: this.newMessage.trim(),
        timestamp: new Date().toISOString(), // Current timestamp
    };

    console.log('Saving Message:', JSON.stringify(newMessageObject));

    try {
        await saveMessage({ recordId: this.recordId, message: JSON.stringify(newMessageObject) });

        this.messages = [
            ...this.messages,
            {
                ...newMessageObject,
                id: (this.messages.length + 1).toString(),
                class: 'message sent',
            },
        ];

        // Clear the input field
        this.newMessage = '';
        const inputField = this.template.querySelector('.message-input');
        if (inputField) {
            inputField.value = ''; // Clear the input field
        }

        console.log('Message added to conversation successfully');

        // Scroll to the bottom after sending a message
        this.scrollToBottom();
    } catch (error) {
        console.error('Error saving message:', error);
    }
}









    

    
}