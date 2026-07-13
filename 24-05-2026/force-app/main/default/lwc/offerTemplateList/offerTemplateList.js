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


    @track isSidebarOpen = false;
    @track thumbnails = [];
    
    
    
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
  this.sessionGuid = this.generateGUID();

  const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  this.updateFavicon(isDarkMode ? Tdark : Tlogo);
  document.title = 'T sign | TesseractApps';

  if (window.matchMedia) {
    const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
    themeMedia.addEventListener('change', (e) => {
      const newIcon = e.matches ? Tdark : Tlogo;
      this.updateFavicon(newIcon);
    });
  }

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

  // 1) Load libraries first: main pdfJS + fonts (do NOT load worker as a script)
  Promise.all([
    loadScript(this, pdfjsLib).catch(error => console.error('Failed to load pdfjsLib:', error)),
    loadStyle(this, adobeFonts).catch(error => console.error('Failed to load fonts:', error)),
  ])
    .then(() => {
      // 2) Configure pdf.js worker
      if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
      }
      console.log('All libraries initialized successfully');
      this.pdfLoaded = true;

      // 3) Now it is safe to fetch recipients & data (these will call loadPdf)
      return getAllRecipients({ recordId: this.recordId });
    })
    .then((allRecipients) => {
      if (!allRecipients) {
        console.warn('No recipients found.');
        return;
      }

      this.allRecipients = allRecipients
        .split('\n')
        .filter(email => email.trim() !== '');
      console.log('Parsed all recipients:', this.allRecipients);

      this.currentRecipientIndex = this.allRecipients.indexOf(this.currentUserEmail);
      console.log('Current recipient index:', this.currentRecipientIndex);

      this.nextRecipientEmail = this.getNextRecipientEmail();
      console.log('Upcoming recipient email:', this.nextRecipientEmail);

      // Select data source (same behavior as before)
      if (this.currentRecipientIndex > 0) {
        this.fetchRecipientSpecificData();
      } else {
        this.fetchRecordData();
      }
    })
    .catch((error) => {
      console.error('Error during initialization:', error);
      this.showToast('Error', 'Failed to initialize component.', 'error');
    });
}

generateGUID() {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async logAuditDataWithIP() {
    let ip = 'Unavailable';
    let location = 'Unavailable';

    // 🔹 Get IP
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        ip = data.ip;
    } catch (e) {
        console.warn('IP fetch failed', e);
    }

    // 🔹 Get Geolocation (wrapped in Promise for async/await consistency)
    if (navigator.geolocation) {
        try {
            location = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        resolve({
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude
                        });
                    },
                    (err) => {
                        console.warn('Geolocation denied or failed:', err.message);
                        resolve('Unavailable');
                    },
                    { timeout: 5000 }
                );
            });
        } catch (e) {
            location = 'Unavailable';
        }
    }

    return this.buildAuditPayload(ip, location);
}

buildAuditPayload(ip, location) {
    const nav = window.navigator;

    const auditData = {
        sessionGuid: this.sessionGuid, // ✅ NEW
        timestamp: new Date().toISOString(),
        ipAddress: ip,
        location: location,
        userAgent: nav.userAgent,
        platform: nav.platform,
        language: nav.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cookiesEnabled: nav.cookieEnabled,
        onlineStatus: nav.onLine
    };

    console.log('🔍 TSign Audit Data:', JSON.stringify(auditData, null, 2));

    return JSON.stringify(auditData); // ✅ Ready for Apex
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
                this.originalPdfReference = pdfUrl;
     console.log('Original PDF reference:', this.originalPdfReference);
                // ✅ Filter placeholders for the current user
                try {
                    this.placeholders = JSON.parse(placeholders)
  .filter((placeholder) => placeholder.recipient === this.currentUserEmail)
  .map((placeholder) => this.normalizePlaceholderForStyles(placeholder));

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
                this.pdfUrl = childPdfData;
                // this.pdfUrl = childPdfData.Signature_URL__c;
                console.log('📄 PDF URL for Recipient:', this.pdfUrl);
                this.originalPdfReference = this.pdfUrl;
                console.log('Original PDF reference:', this.originalPdfReference);
    
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
                // this.loadPdf(this.pdfUrl); 
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
    
    normalizePlaceholderForStyles(raw) {
  const placeholder = { ...raw };

  // Existing container style (keep your dashed border for non-image)
  placeholder.style = placeholder.hasImage
    ? `top:${placeholder.y}px; left:${placeholder.x}px; position:absolute;`
    : `top:${placeholder.y}px; left:${placeholder.x}px; position:absolute; border:2px dashed #0070d2; background-color:#f4f6f9;`;

  // Default text style (matches what you used in templateCreator)
  const defaultTextStyle = {
    fontFamily: 'Roboto, Arial, sans-serif',
    fontSize: '14',      // px as string
    bold: false,
    italic: false,
    underline: false,
    color: '#000000'
  };

  const ts = { ...defaultTextStyle, ...(placeholder.textStyle || {}) };

  placeholder.textStyle = ts;

  const fontWeight = ts.bold ? '700' : '400';
  const fontStyle  = ts.italic ? 'italic' : 'normal';
  const textDecor  = ts.underline ? 'underline' : 'none';
  const color      = ts.color || '#000000';

  // This string will be bound directly to <input style={placeholder.inputStyle}>
  placeholder.inputStyle =
    `font-family:${ts.fontFamily};` +
    `font-size:${ts.fontSize}px;` +
    `font-weight:${fontWeight};` +
    `font-style:${fontStyle};` +
    `text-decoration:${textDecor};` +
    `color:${color};`;

  // (Optional) for canvas convenience
  placeholder.fontFamily = ts.fontFamily;
  placeholder.fontColor  = color;
  placeholder.fontWeight = fontWeight;
  placeholder.fontStyle  = fontStyle;
  placeholder.underline  = !!ts.underline;

  return placeholder;
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
  this.isLoading = true;

  const url = encodeURI(pdfUrl);
  console.log('Encoded PDF URL:', url);

  // Let pdf.js manage the request (enables streaming & range)
  const loadingTask = window.pdfjsLib.getDocument({
    url,
    disableStream: false,     // allow progressive streaming
    disableAutoFetch: false   // allow range-based incremental fetch
  });

  // (Optional) progress hook; safe to keep or remove
  if (typeof loadingTask.onProgress === 'function') {
    loadingTask.onProgress = ({ loaded, total }) => {
      if (total) {
        this.loadingPct = Math.round((loaded / total) * 100);
        // console.log('PDF loading progress:', this.loadingPct, '%');
      }
    };
  }

  loadingTask.promise
    .then((pdf) => {
      console.log('PDF successfully loaded:', pdf);
      this.pdfDoc = pdf;
      this.totalPages = pdf.numPages;
      console.log('Total pages in PDF:', this.totalPages);
      this.currentPage = 1;

       this.generateThumbnailsAsync();
      return this.renderPageAsImage(this.currentPage);
    })
    .catch((error) => {
      console.error('Error loading PDF:', error);
      this.showToast('Error', 'Failed to load PDF.', 'error');
    })
    .finally(() => {
      this.isLoading = false;
    });
}


    // put this near your component fields
DEBUG = true;
_log(...args) { if (this.DEBUG) console.log('[LWC-PDF]', ...args); }
_warn(...args) { if (this.DEBUG) console.warn('[LWC-PDF]', ...args); }
_time(label) { if (this.DEBUG) console.time(label); }
_timeEnd(label) { if (this.DEBUG) console.timeEnd(label); }


async renderPageAsImage(pageNumber) {
  const t0 = performance.now();
  this._log('renderPageAsImage:start', { pageNumber });

  try {
    this._time('getPage');
    const page = await this.pdfDoc.getPage(pageNumber);
    this._timeEnd('getPage');

    const vp1 = page.getViewport({ scale: 1 });
    this._pagePt = { w: vp1.width, h: vp1.height };
    this._log('pagePt (PDF points)', this._pagePt);

    const containerEl = this.template.querySelector('.pdf-viewer-container');
    const targetCssW = containerEl ? Math.max(1, containerEl.clientWidth) : 1024;
    const scale = targetCssW / vp1.width;

    const viewport = page.getViewport({ scale });

    // Cap DPR
    const deviceDpr = window.devicePixelRatio || 1;
    const dpr = Math.min(deviceDpr, 1.25);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: false });

    canvas.width  = Math.floor(viewport.width  * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width  = `${Math.round(viewport.width)}px`;
    canvas.style.height = `${Math.round(viewport.height)}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this._log('preview sizing', {
      containerCssW: targetCssW,
      scale,
      viewportCss: { w: viewport.width, h: viewport.height },
      dpr: { capped: dpr, device: deviceDpr },
      canvasPx: { w: canvas.width, h: canvas.height },
      megapixels: ((canvas.width * canvas.height) / 1e6).toFixed(2),
    });

    this._time('pdfjs:render');
    await page.render({ canvasContext: ctx, viewport }).promise;
    this._timeEnd('pdfjs:render');

    this._previewCss = { w: viewport.width, h: viewport.height };
    this._previewPx  = { w: canvas.width,  h: canvas.height  };

    // async encode (JPEG)
    this._time('encode:toBlob+FileReader');
    const dataUrl = await new Promise(resolve => {
      canvas.toBlob(blob => {
        if (!blob) {
          this._warn('toBlob produced null blob; falling back to PNG dataURL');
          // fallback (sync; heavy) only if needed
          const du = canvas.toDataURL('image/png');
          resolve(du);
          return;
        }
        this._log('jpeg blob size (bytes)', blob.size);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.92);
    });
    this._timeEnd('encode:toBlob+FileReader');

    this.imageSrc = dataUrl;

    // Yield to next frame before styles to avoid blocking
    requestAnimationFrame(() => {
      this._time('_updateAllPlaceholderStyles');
      this._updateAllPlaceholderStyles();
      this._timeEnd('_updateAllPlaceholderStyles');

      const t1 = performance.now();
      this._log('renderPageAsImage:end', {
        pageNumber,
        totalMs: Math.round(t1 - t0),
      });
    });
  } catch (error) {
    console.error(`Error rendering page ${pageNumber}:`, error);
    this.showToast('Error', `Failed to render page ${pageNumber}.`, 'error');
  }
}

_normalizePlaceholderPts(ph) {
  // Only normalize if we have page points and placeholder has xPt/yPt
  if (!ph || this._pagePt == null || ph.xPt == null || ph.yPt == null) return ph;

  const pageW = this._pagePt.w, pageH = this._pagePt.h;

  // Heuristic: values larger than the page are very likely stored in 1024×1448 "pseudo points"
  const FALLBACK_W = 1024;
  const FALLBACK_H = 1448;

  const looksOutOfBounds =
    ph.xPt > pageW * 1.001 || ph.yPt > pageH * 1.001 || ph.xPt < 0 || ph.yPt < 0;

  if (!looksOutOfBounds) return ph;

  const rx = pageW / FALLBACK_W;
  const ry = pageH / FALLBACK_H;

  return {
    ...ph,
    xPt: ph.xPt * rx,
    yPt: ph.yPt * ry,
    // If you start saving wPt/hPt in creator, normalize them too:
    ...(ph.wPt != null ? { wPt: ph.wPt * rx } : {}),
    ...(ph.hPt != null ? { hPt: ph.hPt * ry } : {}),
  };
}

_updateAllPlaceholderStyles() {
  const img = this.template.querySelector('.image-container img');
  if (!img || !this._pagePt) {
    this._log('_updateAllPlaceholderStyles:skip', { hasImg: !!img, hasPagePt: !!this._pagePt });
    return;
  }

  const rect = img.getBoundingClientRect();
  const cur = this.currentPage;

  const t0 = performance.now();
  let recomputed = 0;

  // Normalize flat list
  const next = this.placeholders.map(ph => {
    const normalized = this._normalizePlaceholderPts(ph);
    if (normalized.page === cur) {
      recomputed++;
      const style = this.getPlaceholderStyle(normalized, rect);
      return { ...normalized, style };
    }
    return normalized;
  });
  this.placeholders = next;

  // Normalize paged map
  const list = (this.placeholdersByPage?.[cur] ?? []).map(ph => {
    const normalized = this._normalizePlaceholderPts(ph);
    return { ...normalized, style: this.getPlaceholderStyle(normalized, rect) };
  });
  this.placeholdersByPage = { ...this.placeholdersByPage, [cur]: list };

  const t1 = performance.now();
  this._log('_updateAllPlaceholderStyles:end', {
    cur,
    recomputed,
    ms: Math.round(t1 - t0)
  });
}




        

showPreviousPage() {
  if (this.debounceTimer) {
    this._log('nav:clearPendingDebounce', { page: this.currentPage });
    clearTimeout(this.debounceTimer);
    this.debounceTimer = null;
  }
  if (this.currentPage > 1) {
    const next = this.currentPage - 1;
    this._log('nav:prev', { from: this.currentPage, to: next });
    this.currentPage = next;
    this.renderPageAsImage(this.currentPage);
     this.syncThumbnailUI();
  } else {
    this._log('nav:prev:blocked (already at first page)');
  }
}

showNextPage() {
  if (this.debounceTimer) {
    this._log('nav:clearPendingDebounce', { page: this.currentPage });
    clearTimeout(this.debounceTimer);
    this.debounceTimer = null;
  }
  if (this.currentPage < this.totalPages) {
    const next = this.currentPage + 1;
    this._log('nav:next', { from: this.currentPage, to: next });
    this.currentPage = next;
    this.renderPageAsImage(this.currentPage);
     this.syncThumbnailUI();
  } else {
    this._log('nav:next:blocked (already at last page)');
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
    getPlaceholderStyle(placeholder, rectOpt) {
  const imgRect = rectOpt || this.template.querySelector('.image-container img')?.getBoundingClientRect();
  if (!imgRect || !this._pagePt) {
    return 'position:absolute; top:0; left:0;'; // safe fallback
  }

  // Scale from page points → current CSS pixels
  const scaleX = imgRect.width  / this._pagePt.w;
  const scaleY = imgRect.height / this._pagePt.h;

  // Positions: if you already store x/y in page points, use them; else derive once
  // (Fallback for your old 1024×1448 coords)
  const xPt = (placeholder.xPt != null)
    ? placeholder.xPt
    : (placeholder.x != null ? (placeholder.x / 1024) * this._pagePt.w : 0);
  const yPt = (placeholder.yPt != null)
    ? placeholder.yPt
    : (placeholder.y != null ? (placeholder.y / 1448) * this._pagePt.h : 0);

  const leftCss = xPt * scaleX;
  const topCss  = yPt * scaleY;

  // Sizes: prefer page-point sizes if we have them; else fall back to last known CSS
  const wCss = (placeholder.wPt != null) ? placeholder.wPt * scaleX
             : (placeholder.cssW != null) ? placeholder.cssW : undefined;
  const hCss = (placeholder.hPt != null) ? placeholder.hPt * scaleY
             : (placeholder.cssH != null) ? placeholder.cssH : undefined;

  let style = `position:absolute; left:${leftCss}px; top:${topCss}px;`;
  if (wCss != null) style += ` width:${wCss}px;`;
  if (hCss != null) style += ` height:${hCss}px;`;
  return style;
}

    
    handleUploadSignature(event) {
  this.placeholderId = event.currentTarget.dataset.id;
  this.isSignatureModalVisible = true;
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


// Helper: fit image inside box (contain), keeping aspect ratio
_fitRect(targetW, targetH, imgW, imgH) {
  if (!imgW || !imgH || !targetW || !targetH) return { x: 0, y: 0, w: targetW, h: targetH };
  const rImg = imgW / imgH;
  const rBox = targetW / targetH;
  let w, h;
  if (rImg > rBox) {
    w = targetW;
    h = Math.round(w / rImg);
  } else {
    h = targetH;
    w = Math.round(h * rImg);
  }
  return { x: Math.round((targetW - w) / 2), y: Math.round((targetH - h) / 2), w, h };
}





    // Pretty/safe dataURL logger
_logDataUrl(label, dataUrl, max = 160) {
  try {
    if (typeof dataUrl !== 'string') {
      console.log(label, '(not a string)', dataUrl);
      return;
    }
    const m = /^data:(?<mime>[^;]+);base64,(?<b64>.*)$/.exec(dataUrl) || {};
    const mime = m.groups?.mime || 'unknown';
    const b64  = m.groups?.b64 || '';
    const head = b64.slice(0, max);
    const tail = b64.slice(-Math.min(32, b64.length));
    console.log(`${label} -> mime=${mime} len=${b64.length} head="${head}" ... tail="${tail}"`);
  } catch (e) {
    console.log(`${label} -> <log failed>`, e);
  }
}

// Quick pixel check to detect a blank (fully transparent) canvas
_isCanvasBlank(canvas) {
  try {
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    if (!width || !height) return true;
    const data = ctx.getImageData(0, 0, width, height).data;
    for (let i = 3; i < data.length; i += 4) { // alpha channel only
      if (data[i] !== 0) return false;
    }
    return true;
  } catch (e) {
    console.warn('[SIG] blank-check failed', e);
    return false; // don’t block on errors
  }
}


_initSignatureCanvasDPR(canvas) {
  if (!canvas) { console.warn('[SIG] no canvas in init'); return; }

  // ensure non-zero CSS size
  let rect = canvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) {
    canvas.style.width  = '600px';
    canvas.style.height = '180px';
    rect = canvas.getBoundingClientRect();
  }

  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.max(1, Math.round(rect.width  * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineWidth   = 2;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.strokeStyle = '#000';

  this.canvasContext = ctx;
  console.log('[SIG] init', {
    cssW: rect.width, cssH: rect.height, dpr,
    bufW: canvas.width, bufH: canvas.height
  });
}


// 2) Pointer → canvas coords in CSS px
_getCanvasPoint(evt, canvas) {
  const r = canvas.getBoundingClientRect();
  return { x: evt.clientX - r.left, y: evt.clientY - r.top };
}

// 3) Open modal → wait for layout → init DPR
handleDrawOption() {
  this.isSignatureModalVisible = false;
  this.isDrawingModalVisible = true;

  // double RAF = after layout/paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const canvas = this.template.querySelector('.signature-canvas');
      if (canvas) this._initSignatureCanvasDPR(canvas);
    });
  });
}

closeDrawingModal() {
  this.isDrawingModalVisible = false;
  this.isDrawing = false;
}

startDrawing(evt) {
  const canvas = this.template.querySelector('.signature-canvas');
  if (!canvas) { console.warn('[SIG] start: no canvas'); return; }
  if (!this.canvasContext) this._initSignatureCanvasDPR(canvas);
  const { x, y } = this._getCanvasPoint(evt, canvas);
  this.isDrawing = true;
  this.canvasContext.beginPath();
  this.canvasContext.moveTo(x, y);
  console.log('[SIG] start', { x, y });
  if (evt.cancelable) evt.preventDefault();
}

draw(evt) {
  if (!this.isDrawing || !this.canvasContext) return;
  const canvas = this.template.querySelector('.signature-canvas');
  const { x, y } = this._getCanvasPoint(evt, canvas);
  this.canvasContext.lineTo(x, y);
  this.canvasContext.stroke();
  if (!this._strokeCount) this._strokeCount = 0;
  this._strokeCount++;
  if ((this._strokeCount % 20) === 0) {
    console.log('[SIG] draw', { x, y, strokes: this._strokeCount });
  }
  if (evt.cancelable) evt.preventDefault();
}

stopDrawing(evt) {
  if (!this.isDrawing) return;
  this.isDrawing = false;
  if (this.canvasContext) this.canvasContext.closePath();
  console.log('[SIG] stop');
}


clearCanvas() {
  const canvas = this.template.querySelector('.signature-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // clear physical buffer
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // re-init DPR & pen
  this._initSignatureCanvasDPR(canvas);
}

// saveDrawnSignature() {
//   const canvas = this.template.querySelector('.signature-canvas');
//   if (!canvas) { console.warn('[SIG] save: no canvas'); return; }

//   // sanity logs
//   console.log('[SIG] save rect', canvas.getBoundingClientRect(), 'buffer', { w: canvas.width, h: canvas.height });
//   if (this._isCanvasBlank?.(canvas)) console.warn('[SIG] save: canvas appears blank');

//   const dataUrl = canvas.toDataURL('image/png');   // full data URL (preview/export)
//   const base64  = dataUrl.split(',')[1];           // bare b64 for Apex
//   this._logDataUrl?.('[SIG] dataUrl (to be saved)', dataUrl);

//   this.isDrawingModalVisible = false;

//   const phId = parseInt(this.placeholderId, 10);
//   const placeholder = this.placeholders.find(p => p.id === phId);
//   if (!placeholder) { console.warn('[SIG] save: placeholder not found', phId); return; }

//   // --- canonical + legacy fields (template reads imageSrc) ---
//   placeholder.isSignature       = true;
//   placeholder.signatureDataUrl  = dataUrl;   // canonical PNG kept for export
//   placeholder.SignatureSrc      = dataUrl;   // field used by overlay pipeline
//   placeholder.imageSrc          = dataUrl;   // <-- IMPORTANT for your template
//   placeholder.hasImage          = true;

//   // reactive updates
//   this.placeholders = this.placeholders.map(p =>
//     p.id === phId ? {
//       ...p,
//       isSignature: true,
//       hasImage: true,
//       signatureDataUrl: dataUrl,
//       SignatureSrc: dataUrl,
//       imageSrc: dataUrl
//     } : p
//   );

//   const pageArr = this.placeholdersByPage[this.currentPage] || [];
//   const idx = pageArr.findIndex(p => p.id === phId);
//   const updated = (idx > -1)
//     ? [
//         ...pageArr.slice(0, idx),
//         {
//           ...pageArr[idx],
//           isSignature: true,
//           hasImage: true,
//           signatureDataUrl: dataUrl,
//           SignatureSrc: dataUrl,
//           imageSrc: dataUrl
//         },
//         ...pageArr.slice(idx + 1)
//       ]
//     : [...pageArr, { ...placeholder }];
//   this.placeholdersByPage = { ...this.placeholdersByPage, [this.currentPage]: updated };

//   // kick normal pipeline (sets xPt/yPt/wPt/hPt, overlaySrc, marks dirty, shows toast)
//   this.updatePlaceholderWithCanvas(placeholder, 'SignatureSrc', 'Signature updated!');

//   // persist to SF (bare base64 is fine)
//   this.saveImageBase64(base64);
// }

async saveDrawnSignature() {
  const canvas = this.template.querySelector('.signature-canvas');
  if (!canvas) { console.warn('[SIG] save: no canvas'); return; }

  console.log('[SIG] save rect', canvas.getBoundingClientRect(), 'buffer', { w: canvas.width, h: canvas.height });
  if (this._isCanvasBlank?.(canvas)) console.warn('[SIG] save: canvas appears blank');

  const originalDataUrl = canvas.toDataURL('image/png');
  const base64  = originalDataUrl.split(',')[1];
  this._logDataUrl?.('[SIG] dataUrl (to be saved)', originalDataUrl);

  this.isDrawingModalVisible = false;

  const phId = parseInt(this.placeholderId, 10);
  const placeholder = this.placeholders.find(p => p.id === phId);
  if (!placeholder) { console.warn('[SIG] save: placeholder not found', phId); return; }

  // 🔥 NEW: Generate composite image (TSigned + GUID)
  const finalImage = await this.generateSignedImage(
    originalDataUrl,
    this.sessionGuid
  );

  // --- canonical + legacy fields ---
  placeholder.isSignature       = true;
  placeholder.signatureDataUrl  = finalImage;   // ✅ now composite image
  placeholder.SignatureSrc      = finalImage;
  placeholder.imageSrc          = finalImage;
  placeholder.hasImage          = true;

  // reactive updates
  this.placeholders = this.placeholders.map(p =>
    p.id === phId ? {
      ...p,
      isSignature: true,
      hasImage: true,
      signatureDataUrl: finalImage,
      SignatureSrc: finalImage,
      imageSrc: finalImage
    } : p
  );

  const pageArr = this.placeholdersByPage[this.currentPage] || [];
  const idx = pageArr.findIndex(p => p.id === phId);

  const updated = (idx > -1)
    ? [
        ...pageArr.slice(0, idx),
        {
          ...pageArr[idx],
          isSignature: true,
          hasImage: true,
          signatureDataUrl: finalImage,
          SignatureSrc: finalImage,
          imageSrc: finalImage
        },
        ...pageArr.slice(idx + 1)
      ]
    : [...pageArr, { ...placeholder }];

  this.placeholdersByPage = { ...this.placeholdersByPage, [this.currentPage]: updated };

  // ✅ Keep your existing pipeline intact
  this.updatePlaceholderWithCanvas(placeholder, 'SignatureSrc', 'Signature updated!');

  // ✅ Save ORIGINAL base64 (important for storage consistency)
  this.saveImageBase64(base64);
}

onImageUpload(event) {
  this.isattachError = false;

  const input = event.target;
  const files = input?.files;

  if (!files || files.length === 0) {
    this.showToast("Error", "No file selected.", "error");
    this.showSpinner = false;
    return;
  }

  this.showSpinner = true;

  const file = files[0];
  const fileType = file.type;
  const fileSize = file.size;

  const placeholderIdRaw = input.dataset.id;
  const placeholderId = parseInt(placeholderIdRaw, 10);

  if (!Number.isFinite(placeholderId)) {
    this.showToast("Error", "Invalid placeholder id.", "error");
    this.showSpinner = false;
    return;
  }

  const existingPlaceholder = (this.placeholders || []).find((item) => item.id === placeholderId);
  if (!existingPlaceholder) {
    this.showToast("Error", "Placeholder not found.", "error");
    this.showSpinner = false;
    return;
  }

  const validImageTypes = ["image/png", "image/jpeg"];
  if (!validImageTypes.includes(fileType)) {
    this.isattachError = true;
    this.showToast("Error", "Invalid file type. Please upload a PNG or JPEG image.", "error");
    this.showSpinner = false;
    return;
  }

  const MAX_FILE_SIZE = 1048576;
  const MIN_FILE_SIZE = 10240;
  if (fileSize > MAX_FILE_SIZE || fileSize < MIN_FILE_SIZE) {
    this.isattachError = true;
    this.showToast("Error", "File size must be between 10KB and 1MB.", "error");
    this.showSpinner = false;
    return;
  }

  const reader = new FileReader();

  reader.onloadend = async () => {
    try {
      const result = reader.result;
      if (!result || typeof result !== "string") {
        this.isattachError = true;
        this.showToast("Error", "Unable to read the selected file.", "error");
        this.showSpinner = false;
        return;
      }

      const parts = result.split(",");
      const base64Data = parts?.[1];

      if (!base64Data) {
        this.isattachError = true;
        this.showToast("Error", "Invalid file data.", "error");
        this.showSpinner = false;
        return;
      }

      const originalImage = `data:${fileType};base64,${base64Data}`;

      // 🔥 NEW: Generate composite image (TSigned + GUID)
      const finalImage = await this.generateSignedImage(
        originalImage,
        this.sessionGuid
      );

      const page = this.currentPage;

      const updatedFields = {
        hasImage: true,
        imageSrc: finalImage, // ✅ replaced with composite image

        isSignature: true,
        signatureDataUrl: finalImage,
        SignatureSrc: finalImage,

        isPlaceholder: false
      };

      // ✅ 1) Update main placeholders
      this.placeholders = (this.placeholders || []).map((p) =>
        p.id === placeholderId ? { ...p, ...updatedFields } : p
      );

      // ✅ 2) Update page placeholders
      const pageArr =
        this.placeholdersByPage && this.placeholdersByPage[page]
          ? this.placeholdersByPage[page]
          : null;

      if (pageArr) {
        const updatedPageArr = pageArr.map((p) =>
          p.id === placeholderId ? { ...p, ...updatedFields } : p
        );

        this.placeholdersByPage = {
          ...this.placeholdersByPage,
          [page]: updatedPageArr
        };
      }

      // ✅ 3) Trigger PDF embedding pipeline
      const placeholderAfter =
        (this.placeholdersByPage?.[page] || []).find((p) => p.id === placeholderId) ||
        (this.placeholders || []).find((p) => p.id === placeholderId);

      if (placeholderAfter && typeof this.updatePlaceholderWithCanvas === "function") {
        this.updatePlaceholderWithCanvas(
          placeholderAfter,
          "SignatureSrc",
          "Signature updated!"
        );
      } else if (!placeholderAfter) {
        console.warn("⚠️ Updated placeholder not found after upload;");
      }

      // ✅ Keep your existing save behavior (raw base64)
      this.saveImageBase64(base64Data);

    } catch (e) {
      console.error("❌ onImageUpload failed:", e);
      this.isattachError = true;
      this.showToast("Error", "Signature upload failed.", "error");
    } finally {
      this.showSpinner = false;

      try {
        if (input && "value" in input) input.value = null;
      } catch (_) {}
    }
  };

  reader.onerror = () => {
    this.isattachError = true;
    this.showToast("Error", "Failed to read the selected file.", "error");
    this.showSpinner = false;

    try {
      if (input && "value" in input) input.value = null;
    } catch (_) {}
  };

  reader.readAsDataURL(file);
}

generateSignedImage(signatureDataUrl, guid) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.src = signatureDataUrl;

        img.onload = () => {

            const scaleFactor = 2;

            const maxWidth = 200;
            const scale = Math.min(maxWidth / img.width, 1);

            const imgWidth = img.width * scale;
            const imgHeight = img.height * scale;

            // 🔥 Layout tuning
            const paddingX = 26;
            const paddingY = 18;
            const gapLabelToImg = 10;
            const gapImgToGuid = 10;

            // 🔥 Typography (DocuSign-like)
            const labelFontSize = 18;
            const guidFontSize = 15;

            const totalWidth = imgWidth + paddingX * 2 + 40;
            const totalHeight =
                paddingY +
                labelFontSize +
                gapLabelToImg +
                imgHeight +
                gapImgToGuid +
                guidFontSize +
                paddingY;

            canvas.width = totalWidth * scaleFactor;
            canvas.height = totalHeight * scaleFactor;
            ctx.scale(scaleFactor, scaleFactor);

            // Background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, totalWidth, totalHeight);

            // 🔥 PERFECT DOCUSIGN CURVE (using arcTo)
            const x = 22;
            const top = paddingY;
            const bottom = totalHeight - paddingY;
            const r = 14; // radius controls curve smoothness

            ctx.strokeStyle = '#2a6edb';
            ctx.lineWidth = 2.5;

            ctx.beginPath();

            // Start top-right of curve
            ctx.moveTo(x + r, top);

            // Top rounded corner
            ctx.arcTo(x, top, x, top + r, r);

            // Vertical line
            ctx.lineTo(x, bottom - r);

            // Bottom rounded corner
            ctx.arcTo(x, bottom, x + r, bottom, r);

            ctx.stroke();

            // 🔥 Content start (aligned visually with curve opening)
            const contentX = x + r + 10;

            // 🔥 LABEL (clean, not too bold)
            ctx.fillStyle = '#222';
            ctx.font = `600 ${labelFontSize}px Arial`;
            ctx.fillText('TSigned by:', contentX, top + 1);

            // Signature
            const imgY = top + labelFontSize + gapLabelToImg;

            ctx.drawImage(
                img,
                contentX,
                imgY,
                imgWidth,
                imgHeight
            );

            // 🔥 GUID (subtle, not heavy)
            const shortGuid = guid.substring(0, 18) + '...';

            ctx.fillStyle = '#666';
            ctx.font = `${guidFontSize}px monospace`;

            const guidY = bottom - 2;

            ctx.fillText(
                shortGuid,
                contentX,
                guidY
            );

            resolve(canvas.toDataURL('image/png'));
        };
    });
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
                const viewport = page.getViewport({ scale: 1.5 });
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
            const placeholderElement = this.template.querySelector(
                `[data-id="${placeholder.id}"]`
            );

            if (placeholderElement) {
                const boundingRect = placeholderElement.getBoundingClientRect(); // Get position and size

                const imagesToProcess = [
                    { type: 'FNimageSrc', src: placeholder.FNimageSrc },
                    { type: 'LNimageSrc', src: placeholder.LNimageSrc },
                    { type: 'INimageSrc', src: placeholder.INimageSrc },
                    { type: 'FullNameSrc', src: placeholder.FullNameSrc },
                    { type: 'EmailSrc', src: placeholder.EmailSrc },
                    { type: 'PhoneSrc', src: placeholder.PhoneSrc },
                    { type: 'AddressSrc', src: placeholder.AddressSrc },
                    { type: 'DateSrc', src: placeholder.DateSrc },
                    { type: 'DateOfSigningSrc', src: placeholder.DateOfSigningSrc },
                    { type: 'AbnSrc', src: placeholder.AbnSrc },
                    { type: 'imageSrc', src: placeholder.imageSrc }, // Signature / image
                ];

                for (const image of imagesToProcess) {
                    if (image.src) {
                        const base64Data = image.src.split(',')[1];
                        const imageBlob = this.base64ToBlob(base64Data, 'image/png');

                        // 🔹 pass placeholder into embedImageWithAdjustedHeight
                        await this.embedImageWithAdjustedHeight(
                            imageBlob,
                            boundingRect,
                            placeholder.page,
                            placeholder
                        );

                        console.log(
                            `Embedded ${image.type} at page: ${placeholder.page}, ` +
                            `X: ${boundingRect.x}, Y: ${boundingRect.y}`
                        );
                    }
                }

                this.temporaryImageCache.set(placeholder.page, this.imageSrc);
            }
        }

        console.log('Preview images cached successfully.');
    } catch (error) {
        console.error('Error generating preview:', error);
        this.showToast('Error', 'Failed to generate preview.', 'error');
    }
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

    // Check text-based placeholders that don’t have images (exclude signatures)
    const requiredPlaceholders = this.placeholders.filter(
        ph => !ph.hasImage && !ph.isSignature
    );

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
    if (ph.isABN) return 'ABN';
    if (ph.isDateOfSigning) return 'Date of Signing';
    return 'Field';
}




async embedImageWithAdjustedHeight(imageBlob, boundingRect, pageNumber) {
  try {
    const imgEl = this.template.querySelector('.image-container img');

    // helper to choose smoothing
    const setSmoothing = (ctx, overlay, w, h) => {
      if (overlay.width === w && overlay.height === h) {
        ctx.imageSmoothingEnabled = false;
      } else {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }
    };

    // Prefer page-point placement if caller provided it:
    const ph = this._embeddingPlaceholder || null;
    const hasPt = !!(ph && this._pagePt && ph.xPt != null && ph.yPt != null);
    const isSignature = !!(ph && ph.isSignature);

    // 🔹 Per-page canvas cache
    if (!this._previewCanvasByPage) {
      this._previewCanvasByPage = new Map();
    }

    let entry = this._previewCanvasByPage.get(pageNumber);
    let canvas;
    let ctx;
    let baseW;
    let baseH;

    if (entry) {
      ({ canvas, ctx, baseW, baseH } = entry);
    } else {
      if (imgEl && this.imageSrc) {
        // Stay in the preview's intrinsic pixel space
        const baseImage = await new Promise((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = reject;
          i.src = this.imageSrc;
        });

        baseW = baseImage.naturalWidth || baseImage.width;
        baseH = baseImage.naturalHeight || baseImage.height;

        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d');
        canvas.width = baseW;
        canvas.height = baseH;

        ctx.drawImage(baseImage, 0, 0, baseW, baseH);

        entry = { canvas, ctx, baseW, baseH, fromImgSrc: true };
        this._previewCanvasByPage.set(pageNumber, entry);
      } else {
        // Fallback: render the page to the container width and do the same mapping
        const page = await this.pdfDoc.getPage(pageNumber);
        const container = this.template.querySelector('.image-container');
        const vp1 = page.getViewport({ scale: 1 });
        this._pagePt = { w: vp1.width, h: vp1.height };

        const targetCssW = container ? container.clientWidth : vp1.width;
        const viewport = page.getViewport({ scale: targetCssW / vp1.width });

        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);

        await page.render({ canvasContext: ctx, viewport }).promise;

        baseW = canvas.width;
        baseH = canvas.height;

        entry = { canvas, ctx, baseW, baseH, fromImgSrc: false };
        this._previewCanvasByPage.set(pageNumber, entry);
      }
    }

    const fromImgSrc = entry.fromImgSrc;
    const container = this.template.querySelector('.image-container');
    const imgRect = imgEl ? imgEl.getBoundingClientRect() : null;
    const cssRect = container
      ? container.getBoundingClientRect()
      : imgRect || { x: 0, y: 0, width: baseW, height: baseH };

    // Create overlay bitmap once
    const overlay = await createImageBitmap(imageBlob);

    let destX;
    let destY;
    let destW;
    let destH;

    if (isSignature) {
      // 🔸 SIGNATURE: DO NOT RESIZE. Use overlay's own pixels.
      destW = overlay.width;
      destH = overlay.height;

      // Map placeholder center in CSS → base canvas pixels
      const refRect = fromImgSrc && imgRect ? imgRect : cssRect;
      const ratio   = baseW / refRect.width;

      const cxCss = boundingRect.x + boundingRect.width / 2;
      const cyCss = boundingRect.y + boundingRect.height / 2;

      const cxPx = (cxCss - refRect.x) * ratio;
      const cyPx = (cyCss - refRect.y) * ratio;

      destX = Math.round(cxPx - destW / 2);
      destY = Math.round(cyPx - destH / 2);
    } else if (hasPt && this._pagePt) {
      // Page-point based placement (existing logic)
      destX = Math.round((ph.xPt / this._pagePt.w) * baseW);
      destY = Math.round((ph.yPt / this._pagePt.h) * baseH);

      if (ph.wPt != null && ph.hPt != null) {
        destW = Math.max(1, Math.round((ph.wPt / this._pagePt.w) * baseW));
        destH = Math.max(1, Math.round((ph.hPt / this._pagePt.h) * baseH));
      } else {
        const refRect = fromImgSrc && imgRect ? imgRect : cssRect;
        const ratio   = baseW / refRect.width;
        destW = Math.round(boundingRect.width * ratio);
        destH = Math.round(boundingRect.height * ratio);
      }
    } else {
      // ORIGINAL CSS → pixel mapping (existing logic)
      if (fromImgSrc && imgRect) {
        const ratio = baseW / imgRect.width;
        destX = Math.round((boundingRect.x - imgRect.x) * ratio);
        destY = Math.round((boundingRect.y - imgRect.y) * ratio);
        destW = Math.round(boundingRect.width * ratio);
        destH = Math.round(boundingRect.height * ratio);
      } else {
        const ratio = baseW / cssRect.width;
        destX = Math.round((boundingRect.x - cssRect.x) * ratio);
        destY = Math.round((boundingRect.y - cssRect.y) * ratio);
        destW = Math.round(boundingRect.width * ratio);
        destH = Math.round(boundingRect.height * ratio);
      }
    }

    // Clamp to canvas bounds
    destW = Math.max(1, Math.min(destW, baseW));
    destH = Math.max(1, Math.min(destH, baseH));
    destX = Math.max(0, Math.min(destX, baseW - destW));
    destY = Math.max(0, Math.min(destY, baseH - destH));

    setSmoothing(ctx, overlay, destW, destH);
    ctx.drawImage(overlay, destX, destY, destW, destH);

    // keep existing behaviour
    this.imageSrc = canvas.toDataURL('image/png', 1.0);
  } catch (error) {
    // eslint-disable-next-line no-console
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
    // --- UI: match previous behavior ---
    this.showFailureScreen = false;   // hide failure
    this.showSuccessScreen = true;    // show success container
    this.isSpinning = true;           // show spinner

    this.isLoading = true;

    // 1) gather diffs
    const { images, pageNumbers } = await this._collectChangedPagesBase64();
    console.log('[GEN] diffs ->', { count: images.length, pageNumbers });

    // 🔹 REVIEW-ONLY PATH: no changed pages
    if (!images.length) {
      console.log('[GEN] no changed pages; treating as review-only submit');

      if (!this.recordId) {
        this._toast('Missing recordId', 'error');
        this.isSpinning = false;
        this.showFailureScreen = true;
        this.showSuccessScreen = false;
        return;
      }

      // Use the currently displayed PDF (or fall back to original reference)
      const finalUrl = this.pdfUrl || this.originalPdfReference;

      if (!finalUrl) {
        console.warn('[GEN] no diffs but no PDF URL available to finalize');
        this._toast('No changes, but PDF URL is missing – cannot finalize.', 'error');
        this.isSpinning = false;
        this.showFailureScreen = true;
        this.showSuccessScreen = false;
        return;
      }

      // Persist latest PDF (even if unchanged) + deactivate link
      try {
        await this.storePdfInSalesforce(finalUrl, this.recordId);
      } catch (err) {
        console.warn('[GEN] storePdfInSalesforce warning (no-diff path)', err);
        // storePdfInSalesforce already handles its own toast; keep success UI
      }

      try {
        if (typeof this.deactivateCurrentLink === 'function') {
          await this.deactivateCurrentLink();
        }
      } catch (err) {
        console.warn('[GEN] deactivateCurrentLink warning (no-diff path)', err);
      }

      // Consider review-only as a successful submission
      this._toast('Reviewed and submitted successfully.', 'success');

      if (this.changedPages && typeof this.changedPages.clear === 'function') {
        this.changedPages.clear();
      }

      // --- UI: success finished ---
      this.isSpinning = false;
      this.showSuccessScreen = true;
      this.showFailureScreen = false;
      return; // important: skip external diff APIs
    }

    // 🔹 NORMAL DIFF-BASED PATH (existing behavior)
    if (!this.recordId) {
      this._toast('Missing recordId', 'error');
      this.isSpinning = false;
      this.showFailureScreen = true;
      this.showSuccessScreen = false;
      return;
    }
    if (!this.originalPdfReference) {
      this._toast('Missing original PDF reference', 'error');
      this.isSpinning = false;
      this.showFailureScreen = true;
      this.showSuccessScreen = false;
      return;
    }

    // 2) upload changed pages
    const uploadBody = {
      recordId: this.recordId,
      images,                      // base64 array
      changedPages: pageNumbers,   // 1-based
      originalPdfReference: this.originalPdfReference
    };
    console.log('[GEN] POST /upload-changed-pages', uploadBody);

    const uploadResp = await fetch('https://tesseractapps.com/upload-changed-pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uploadBody)
    });

    const uploadText = await uploadResp.text();
    let uploadJson;
    try { uploadJson = JSON.parse(uploadText); } catch (_) { uploadJson = null; }

    if (!uploadResp.ok) {
      console.error('[GEN] upload failed', uploadResp.status, uploadText);
      const errMsg = uploadJson?.error || uploadText || `HTTP ${uploadResp.status}`;
      throw new Error(`Upload failed: ${errMsg}`);
    }

    console.log('[GEN] upload ok', uploadJson || uploadText);
    // this._toast(`Uploaded ${uploadJson?.totalChangedPages ?? images.length} changed page(s).`, 'success');

    // 3) finalize (merge)
    console.log('[GEN] POST /generate-pdf-from-changes', { recordId: this.recordId });
    const genResp = await fetch('https://tesseractapps.com/generate-pdf-from-changes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId: this.recordId })
    });

    const genText = await genResp.text();
    let genJson;
    try { genJson = JSON.parse(genText); } catch (_) { genJson = null; }

    if (!genResp.ok) {
      console.error('[GEN] finalize failed', genResp.status, genText);
      const errMsg = genJson?.error || genText || `HTTP ${genResp.status}`;
      throw new Error(`Generate failed: ${errMsg}`);
    }

    console.log('[GEN] finalize ok', genJson || genText);
    const finalUrl = genJson?.pdfUrl;
    const wasDiff = !!genJson?.isDiffBased;

    if (!finalUrl) {
      console.warn('[GEN] finalize returned no pdfUrl', genJson || genText);
      this._toast('PDF updated, but no URL returned from server.', 'warning');

      // UI -> failure state because we have nothing to show/download
      this.isSpinning = false;
      this.showFailureScreen = true;
      this.showSuccessScreen = false;
      return;
    }

    console.log('[GEN] final PDF URL:', finalUrl, 'diffBased:', wasDiff);

    // Refresh in-viewer
    this.pdfUrl = finalUrl;
    // this.loadPdf(finalUrl);

    // --- persist + deactivate, like previous flow ---
    try {
      await this.storePdfInSalesforce(finalUrl, this.recordId);
    } catch (err) {
      // storePdfInSalesforce already toasts; don't flip success screen
      console.warn('[GEN] storePdfInSalesforce warning', err);
    }

    try {
      if (typeof this.deactivateCurrentLink === 'function') {
        await this.deactivateCurrentLink();
      }
    } catch (err) {
      console.warn('[GEN] deactivateCurrentLink warning', err);
    }

    // this._toast('PDF updated successfully!', 'success');

    // Clear diffs after success
    if (this.changedPages && typeof this.changedPages.clear === 'function') {
      this.changedPages.clear();
    }

    // --- UI: success finished ---
    this.isSpinning = false;          // stop spinner
    this.showSuccessScreen = true;    // keep success screen (shows check + download)
    this.showFailureScreen = false;

  } catch (e) {
    console.error('[GEN] error', e);
    this._toast(e?.message || 'PDF generation failed', 'error');

    // --- UI: failure finished ---
    this.isSpinning = false;
    this.showSuccessScreen = false;
    this.showFailureScreen = true;

  } finally {
    this.isLoading = false;
  }
}


// async handleGeneratePDF() {
//   try {
//     // --- UI: match previous behavior ---
//     this.showFailureScreen = false;   // hide failure
//     this.showSuccessScreen = true;    // show success container
//     this.isSpinning = true;           // show spinner

//     this.isLoading = true;

//     // 1) gather diffs
//     const { images, pageNumbers } = await this._collectChangedPagesBase64();
//     console.log('[GEN] diffs ->', { count: images.length, pageNumbers });

//     if (!images.length) {
//       this._toast('No changes to save.', 'info');
//       // stop spinner but keep success container visible (like previous)
//       this.isSpinning = false;
//       return;
//     }
//     if (!this.recordId) {
//       this._toast('Missing recordId', 'error');
//       this.isSpinning = false;
//       this.showFailureScreen = true;
//       this.showSuccessScreen = false;
//       return;
//     }
//     if (!this.originalPdfReference) {
//       this._toast('Missing original PDF reference', 'error');
//       this.isSpinning = false;
//       this.showFailureScreen = true;
//       this.showSuccessScreen = false;
//       return;
//     }

//     // 2) upload changed pages
//     const uploadBody = {
//       recordId: this.recordId,
//       images,                      // base64 array
//       changedPages: pageNumbers,   // 1-based
//       originalPdfReference: this.originalPdfReference
//     };
//     console.log('[GEN] POST /upload-changed-pages', uploadBody);

//     const uploadResp = await fetch('https://tesseractapps.com/upload-changed-pages', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(uploadBody)
//     });

//     const uploadText = await uploadResp.text();
//     let uploadJson;
//     try { uploadJson = JSON.parse(uploadText); } catch (_) { uploadJson = null; }

//     if (!uploadResp.ok) {
//       console.error('[GEN] upload failed', uploadResp.status, uploadText);
//       const errMsg = uploadJson?.error || uploadText || `HTTP ${uploadResp.status}`;
//       throw new Error(`Upload failed: ${errMsg}`);
//     }

//     console.log('[GEN] upload ok', uploadJson || uploadText);
//     // this._toast(`Uploaded ${uploadJson?.totalChangedPages ?? images.length} changed page(s).`, 'success');

//     // 3) finalize (merge)
//     console.log('[GEN] POST /generate-pdf-from-changes', { recordId: this.recordId });
//     const genResp = await fetch('https://tesseractapps.com/generate-pdf-from-changes', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ recordId: this.recordId })
//     });

//     const genText = await genResp.text();
//     let genJson;
//     try { genJson = JSON.parse(genText); } catch (_) { genJson = null; }

//     if (!genResp.ok) {
//       console.error('[GEN] finalize failed', genResp.status, genText);
//       const errMsg = genJson?.error || genText || `HTTP ${genResp.status}`;
//       throw new Error(`Generate failed: ${errMsg}`);
//     }

//     console.log('[GEN] finalize ok', genJson || genText);
//     const finalUrl = genJson?.pdfUrl;
//     const wasDiff = !!genJson?.isDiffBased;

//     if (!finalUrl) {
//       console.warn('[GEN] finalize returned no pdfUrl', genJson || genText);
//       this._toast('PDF updated, but no URL returned from server.', 'warning');

//       // UI -> failure state because we have nothing to show/download
//       this.isSpinning = false;
//       this.showFailureScreen = true;
//       this.showSuccessScreen = false;
//       return;
//     }

//     console.log('[GEN] final PDF URL:', finalUrl, 'diffBased:', wasDiff);

//     // Refresh in-viewer
//     this.pdfUrl = finalUrl;
//     // this.loadPdf(finalUrl);

//     // --- NEW: persist + deactivate, like previous flow ---
//     try {
//       await this.storePdfInSalesforce(finalUrl, this.recordId);
//     } catch (err) {
//       // storePdfInSalesforce already toasts; don't flip success screen
//       console.warn('[GEN] storePdfInSalesforce warning', err);
//     }

//     try {
//       if (typeof this.deactivateCurrentLink === 'function') {
//         await this.deactivateCurrentLink();
//       }
//     } catch (err) {
//       console.warn('[GEN] deactivateCurrentLink warning', err);
//     }

//     this._toast('PDF updated successfully!', 'success');

//     // Clear diffs after success
//     this.changedPages.clear();

//     // --- UI: success finished ---
//     this.isSpinning = false;          // stop spinner
//     this.showSuccessScreen = true;    // keep success screen (shows check + download)
//     this.showFailureScreen = false;

//   } catch (e) {
//     console.error('[GEN] error', e);
//     this._toast(e?.message || 'PDF generation failed', 'error');

//     // --- UI: failure finished ---
//     this.isSpinning = false;
//     this.showSuccessScreen = false;
//     this.showFailureScreen = true;

//   } finally {
//     this.isLoading = false;
//   }
// }






    
    // async triggerPDFGeneration() {
    //     try {
    //         console.log('🔹 Triggering PDF generation...');
    //         let response = await fetch('https://tesseractapps.com/generate-pdf', {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ recordId: this.recordId })
    //         });
    
    //         let result = await response.json();
    //         if (!response.ok || !result.pdfUrl) {
    //             throw new Error('❌ PDF generation failed.');
    //         }
    
    //         console.log('✅ PDF Generated Successfully. PDF URL:', result.pdfUrl);
    //         return result.pdfUrl;
    //     } catch (error) {
    //         console.error('❌ Error triggering PDF generation:', error);
    //         return null;
    //     }
    // }
    async storePdfInSalesforce(pdfUrl, parentRecordId) {
        if (!pdfUrl || !parentRecordId) {
            console.warn('⚠️ Missing parameters, skipping record storage.');
            return;
        }
    
        try {
          console.log('📌 Collecting audit data before saving...');

        // 🔥 Get audit data (GUID + device + IP + location)
        const fingerprint = await this.logAuditDataWithIP();
            console.log('📌 Storing generated PDF record in Salesforce with recipient email:', this.nextRecipientEmail);
    
            await storePdfRecord({ pdfUrl: pdfUrl, parentRecordId: parentRecordId, recipientEmail: this.nextRecipientEmail, fingerprint: fingerprint });
    
            console.log('✅ Child record created successfully in Apex.');
            this.isSpinning = false;
            this.showSuccessScreen = true;
            // this.showToast('Success', 'Signature saved successfully.', 'success');
        } catch (error) {
            console.error('❌ Error inserting record:', error);
            this.showToast('Error', 'Failed to store in Salesforce.', 'error');
        }
    }
    
    
// NEW state to track diff pages
changedPages = new Map(); // pageNumber -> { dirty: true, base64?: string }
originalPdfReference;     // e.g., ContentVersion key or S3 key/URL you already have
recordId;                 // ensure you set this once you decode your URL payload

// Call this anywhere a user changes something on page N
markPageDirty(pageNumber) {
  const existing = this.changedPages.get(pageNumber) || {};
  this.changedPages.set(pageNumber, { ...existing, dirty: true });
}

async _renderPageToBase64(pageNumber) {
  const pdf = this.pdfDoc || this.pdf || this.pdfDocument;
  if (!pdf) throw new Error('PDF not loaded');

  const page = await pdf.getPage(pageNumber);
  const baseScale = (this._computeScaleForContainer?.(pageNumber)) || 2.0;
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
  const viewport = page.getViewport({ scale: baseScale });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: false });

  const cssW = Math.floor(viewport.width);
  const cssH = Math.floor(viewport.height);

  canvas.width  = Math.max(1, Math.floor(cssW * dpr));
  canvas.height = Math.max(1, Math.floor(cssH * dpr));

  await page.render({
    canvasContext: ctx,
    transform: [dpr, 0, 0, dpr, 0, 0],
    viewport
  }).promise;

  const pagePlaceholders = (this.placeholders || [])
    .filter(p => Number(p.page) === Number(pageNumber));

  const pagePtW = page.view[2];
  const pagePtH = page.view[3];

  // constants that reflect your preview container
  const FALLBACK_W = 1024;   // .image-container width
  const FALLBACK_H = 1448;   // .image-container height

  // target "visual" signature size in preview
  const SIG_CSS_W = 150;
  const SIG_CSS_H = 75;

  for (const p of pagePlaceholders) {
    const dataUrl = this._getPlaceholderDataUrl
      ? (p.overlaySrc || this._getPlaceholderDataUrl(p))
      : (p.overlaySrc || p.signatureDataUrl || p.SignatureSrc || p.signatureSrc ||
         p.imageSrc || p.FullNameSrc || p.AbnSrc || null);
    if (!dataUrl || !/^data:image\/(png|jpeg);base64,/.test(dataUrl)) continue;

    const xPt = Number.isFinite(p.xPt) ? Number(p.xPt) : 0;
    const yPt = Number.isFinite(p.yPt) ? Number(p.yPt) : 0;

    let wPt, hPt;

    if (p.isSignature) {
      // <<< force signature box to be "150×75 on a 1024×1448 page"
      wPt = pagePtW * (SIG_CSS_W / FALLBACK_W);
      hPt = pagePtH * (SIG_CSS_H / FALLBACK_H);
    } else {
      // original behaviour for non-signature placeholders
      wPt = Math.max(1, Number.isFinite(p.wPt) ? Number(p.wPt) : 120);
      hPt = Math.max(1, Number.isFinite(p.hPt) ? Number(p.hPt) : 30);
    }

    const boxX = Math.round(xPt * (canvas.width  / pagePtW));
    const boxY = Math.round(yPt * (canvas.height / pagePtH));
    const boxW = Math.max(1, Math.round(wPt * (canvas.width  / pagePtW)));
    const boxH = Math.max(1, Math.round(hPt * (canvas.height / pagePtH)));

    await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {

        if (p.isSignature) {
          // keep aspect ratio *inside* our forced box
          const fit = this._fitRect(
            boxW,
            boxH,
            p.sigW || img.width,
            p.sigH || img.height
          );
          const drawX = boxX + Math.round((boxW - fit.w) / 2);
          const drawY = boxY + Math.round((boxH - fit.h) / 2);
          ctx.drawImage(img, drawX, drawY, fit.w, fit.h);
        } else {
          // non-signature placeholders: full box
          ctx.drawImage(img, boxX, boxY, boxW, boxH);
        }

        resolve();
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  return canvas.toDataURL('image/jpeg', 1.0);
}





_getPlaceholderDataUrl(p) {
  const preferred = [
    'overlaySrc',          // ✅ canonical
    'signatureDataUrl',    // ✅ drawn signature
    'SignatureSrc', 'signatureSrc',
    'imageSrc', 'FullNameSrc', 'AbnSrc', 'InitialsSrc', 'DateSrc', 'NameSrc', 'canvasSrc'
  ];
  for (const k of preferred) {
    const v = p?.[k];
    if (typeof v === 'string' && /^data:image\/(png|jpeg);base64,/.test(v)) return v;
  }
  for (const [k, v] of Object.entries(p || {})) {
    if (typeof v === 'string' && /^data:image\/(png|jpeg);base64,/.test(v)) return v;
  }
  return null;
}



async _collectChangedPagesBase64() {
  const entries = Array.from(this.changedPages.entries());
  console.log('[DIFF] entries:', entries);

  const dirty = entries.filter(([, v]) => v?.dirty);
  console.log('[DIFF] dirty pages:', dirty.map(([p]) => p));

  if (!dirty.length) return { images: [], pageNumbers: [] };

  const images = [];
  const pageNumbers = [];

  for (const [pageNumber, meta] of dirty) {
    const base64 = await this._renderPageToBase64(pageNumber);
    images.push(base64);
    pageNumbers.push(pageNumber);
    // keep meta/base64 if you want to cache
    this.changedPages.set(pageNumber, { ...meta, base64, dirty: false });
    console.log('[DIFF] composed page', pageNumber, 'len', base64?.length);
  }
  return { images, pageNumbers };
}


// Utility: toast
_toast(message, variant='success') {
  this.dispatchEvent(
    new ShowToastEvent({ title: 'PDF', message, variant })
  );
}


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
  const styleId = Number(event.currentTarget.dataset.id);
  this.selectedStyle = this.styledPreviews.find(s => s.id === styleId);

  // UI highlight
  this.template.querySelectorAll('.signature-font-style').forEach(el => el.classList.remove('selected'));
  event.currentTarget.classList.add('selected');

  // Render the selected font into the currently selected placeholder
  this.updatePlaceholderWithFontStyle(); // no change to call site
}

// async updatePlaceholderWithFontStyle() {
//   if (!this.selectedStyle || !this.placeholderId) {
//     this.showToast('Error', 'Please select a style and ensure a placeholder is selected.', 'error');
//     return;
//   }

//   const placeholder = this.placeholders.find(
//     (item) => item.id === Number(this.placeholderId)
//   );
//   if (!placeholder) {
//     this.showToast('Error', 'No placeholder found for this operation.', 'error');
//     return;
//   }

//   // --- figure out the placeholder size in CSS pixels ---
//   const { widthPx, heightPx } = this.getPlaceholderPixelSize(placeholder);

//   // --- draw the text so it FITS the box, at device-pixel resolution ---
//   const fontFamily = this.selectedStyle.fontFamily || 'serif';
//   const dataUrl = await this.renderSignatureToDataURL({
//     text: this.enteredName || '',
//     fontFamily,
//     boxWidthPx: widthPx,
//     boxHeightPx: heightPx,
//     padding: 8
//   });

//   // --- update placeholder state ---
//   Object.assign(placeholder, {
//     hasImage: true,
//     imageSrc: dataUrl,
//     isSignature: true,
//     signatureDataUrl: dataUrl
//   });

//   // keep cache in sync if you use placeholdersByPage
//   const pageArr = this.placeholdersByPage[this.currentPage] || [];
//   const cached = pageArr.find(p => p.id === Number(this.placeholderId));
//   if (cached) Object.assign(cached, {
//     hasImage: true,
//     imageSrc: dataUrl,
//     isSignature: true,
//     signatureDataUrl: dataUrl
//   });

//   // trigger rerender + mark dirty
//   this.placeholders = [...this.placeholders];
//   if (this.placeholdersByPage[this.currentPage]) {
//     this.placeholdersByPage[this.currentPage] = [...this.placeholdersByPage[this.currentPage]];
//   }
//   this.markPageDirty(Number(placeholder.page) || this.currentPage || 1);

//   this.showToast('Success', 'Font style added!', 'success');
//   this.closeNameSignatureModal();
//   this.closeSignatureModal();
// }

async updatePlaceholderWithFontStyle() {
  if (!this.selectedStyle || !this.placeholderId) {
    this.showToast('Error', 'Please select a style and ensure a placeholder is selected.', 'error');
    return;
  }

  const placeholder = this.placeholders.find(
    (item) => item.id === Number(this.placeholderId)
  );
  if (!placeholder) {
    this.showToast('Error', 'No placeholder found for this operation.', 'error');
    return;
  }

  // --- get placeholder size ---
  const { widthPx, heightPx } = this.getPlaceholderPixelSize(placeholder);

  const fontFamily = this.selectedStyle.fontFamily || 'serif';

  // 🔥 STEP 1: Generate plain text signature (existing logic)
  const rawSignature = await this.renderSignatureToDataURL({
    text: this.enteredName || '',
    fontFamily,
    boxWidthPx: widthPx,
    boxHeightPx: heightPx,
    padding: 8
  });

  // 🔥 STEP 2: Wrap into DocuSign-style image (NEW)
  const finalImage = await this.generateSignedImage(
    rawSignature,
    this.sessionGuid
  );

  // --- update placeholder ---
  Object.assign(placeholder, {
    hasImage: true,
    imageSrc: finalImage,
    isSignature: true,
    signatureDataUrl: finalImage,
    SignatureSrc: finalImage
  });

  // --- sync cache ---
  const pageArr = this.placeholdersByPage[this.currentPage] || [];
  const cached = pageArr.find(p => p.id === Number(this.placeholderId));

  if (cached) Object.assign(cached, {
    hasImage: true,
    imageSrc: finalImage,
    isSignature: true,
    signatureDataUrl: finalImage,
    SignatureSrc: finalImage
  });

  // --- reactivity ---
  this.placeholders = [...this.placeholders];

  if (this.placeholdersByPage[this.currentPage]) {
    this.placeholdersByPage[this.currentPage] = [
      ...this.placeholdersByPage[this.currentPage]
    ];
  }

  // --- mark dirty for PDF embedding ---
  this.updatePlaceholderWithCanvas(
    placeholder,
    'SignatureSrc',
    'Signature updated!'
  );

  this.markPageDirty(Number(placeholder.page) || this.currentPage || 1);

  this.showToast('Success', 'Font style added!', 'success');
  this.closeNameSignatureModal();
  this.closeSignatureModal();
}

/** Measure the actual on-screen box (CSS px). */
getPlaceholderPixelSize(placeholder) {
  // If you already store width/height in px on the placeholder, use those.
  if (placeholder.widthPx && placeholder.heightPx) {
    return { widthPx: placeholder.widthPx, heightPx: placeholder.heightPx };
  }
  // Otherwise, query the element that renders this placeholder.
  // Adjust the selector to match your markup (e.g., data attributes you use).
  const el = this.template.querySelector(`[data-placeholder-id="${placeholder.id}"]`);
  if (el) {
    const rect = el.getBoundingClientRect();
    return { widthPx: Math.max(1, Math.floor(rect.width)), heightPx: Math.max(1, Math.floor(rect.height)) };
  }
  // Fallback to a sane default to avoid crashes
  return { widthPx: 150, heightPx: 75 };
}

/** Render the typed signature so it fits inside the given box. */
async renderSignatureToDataURL({ text, fontFamily, boxWidthPx, boxHeightPx, padding = 8, fontWeight = 400 }) {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.floor(boxWidthPx * dpr));
  const h = Math.max(1, Math.floor(boxHeightPx * dpr));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  // Ensure font is loaded before measuring (important for web fonts)
  const guess = Math.floor(h * 0.7);
  try { await document.fonts.load(`${fontWeight} ${guess}px ${fontFamily}`); } catch (e) {}

  const targetW = w - padding * 2 * dpr;
  const targetH = h - padding * 2 * dpr;

  // Binary search for largest font that fits width & height
  let lo = 6 * dpr, hi = guess, best = Math.min(guess, targetH);
  const fits = (sz) => {
    ctx.font = `${fontWeight} ${sz}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    const textW = metrics.width;
    const textH = sz * 1.1; // approx ascent+descent
    return textW <= targetW && textH <= targetH;
  };
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (fits(mid)) { best = mid; lo = mid + 1; } else { hi = mid - 1; }
  }

  // Draw centered, crisp (no background)
  ctx.clearRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000';
  ctx.font = `${fontWeight} ${best}px ${fontFamily}`;
  ctx.fillText(text, w / 2, h / 2);

  return c.toDataURL('image/png');
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
handleAbnInputChange(event) {
  event.target.value = event.target.value.replace(/\D/g, '').slice(0, 11);

  this.handleInputChange(event, 'AbnSrc', 'ABN updated successfully!');
}

// at class level
debounceTimers = {}; // { [placeholderId]: timeoutId }

handleInputChange(event, srcField, successMessage) {
  const placeholderId = event.target.dataset.id;
  const key = String(placeholderId);
  const newValue = event.target.value ?? '';  // keep raw value; trim later if you want

  this.adjustInputWidth(event.target);

  // 🔹 1) Find placeholder and UPDATE VALUE IMMEDIATELY
  const ph = this.placeholders?.find(p => String(p.id) === key);
  if (ph) {
    ph.value = newValue;  // <-- important: keep UI + model in sync now

    // keep arrays in sync so rerenders use the new value
    this.placeholders = this.placeholders.map(p =>
      p.id === ph.id ? { ...p, value: newValue } : p
    );

    const pageNumber = ph.page || this.currentPage || 1;
    const currentPageArr = this.placeholdersByPage[pageNumber];
    if (currentPageArr) {
      this.placeholdersByPage = {
        ...this.placeholdersByPage,
        [pageNumber]: currentPageArr.map(p =>
          p.id === ph.id ? { ...p, value: newValue } : p
        )
      };
    }

    this.markPageDirty(pageNumber);
    console.log('[DIFF] input change -> marked dirty page', pageNumber, 'phId', key);
  }

  // 🔹 2) Debounce ONLY the heavy canvas generation for this placeholder
  if (!this.debounceTimers) {
    this.debounceTimers = {};
  }
  clearTimeout(this.debounceTimers[key]);

  this.debounceTimers[key] = setTimeout(async () => {
    try {
      const placeholder = this.placeholders.find(
        item => item.id === parseInt(key, 10)
      );
      if (!placeholder) {
        console.warn(`Placeholder with ID ${key} not found.`);
        return;
      }

      // use the value already stored on the placeholder
      const finalValue = placeholder.value ?? '';
      if (finalValue === '' && finalValue !== newValue) {
        // optional: extra guard
        console.log('Skipping canvas update; empty value.');
      }

      await this.updatePlaceholderWithCanvas(
        placeholder,
        srcField,
        successMessage
      );

      const pageNumber = placeholder.page || this.currentPage || 1;
      this.markPageDirty(pageNumber);
      console.log(
        '[DIFF] post-update -> marked dirty page',
        pageNumber,
        'phId',
        placeholder.id
      );
    } finally {
      delete this.debounceTimers[key];
    }
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
@track debugFontLogs= true;

async updatePlaceholderWithCanvas(placeholder, srcField, successMessage) {
  // DEBUG toggle (non-invasive)
  const DEBUG_FONT = (this && typeof this.debugFontLogs !== 'undefined') ? !!this.debugFontLogs : true;

  if (!placeholder) {
    this.showToast('Error', 'No placeholder found to update.', 'error');
    return;
  }

  const el =
    this.template.querySelector(`[data-placeholder-id="${placeholder.id}"]`) ||
    this.template.querySelector(`[data-id="${placeholder.id}"]`);

  let desiredFontPx = placeholder.fontSize || 15;
  if (DEBUG_FONT) {
    console.log('[FONT] seed desiredFontPx:', desiredFontPx, 'placeholder.id:', placeholder && placeholder.id);
  }

  // --- helper: find stable wrapper for measurement ---
  const resolveMeasureEl = (el, id) => {
    return (
      this.template.querySelector(`[data-ph-box="${id}"]`) || // optional explicit wrapper
      el?.closest('.placeholder-box') ||                      // your dashed box container
      el                                                     // fallback (input) if nothing else
    );
  };

  try {
    if (this.pdfDoc && this.currentPage && el && this.imageSrc) {
      const page = await this.pdfDoc.getPage(this.currentPage);
      const vp1 = page.getViewport({ scale: 1 });
      this._pagePt = { w: vp1.width, h: vp1.height };
      if (DEBUG_FONT) {
        console.log('[FONT] viewport (pt):', { w: vp1.width, h: vp1.height }, 'currentPage:', this.currentPage);
      }

      const imgEl = this.template.querySelector('.image-container img');
      if (imgEl) {
        const baseImg = await new Promise((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = reject;
          i.src = this.imageSrc;
        });
        const natW = baseImg.naturalWidth || baseImg.width;
        const natH = baseImg.naturalHeight || baseImg.height;

        // 🕐 wait for layout to settle before measuring
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        const measureEl = resolveMeasureEl(el, placeholder.id);
        const imgRect = imgEl.getBoundingClientRect();

        // ✅ If we already have page-points, force the wrapper to the steady-state CSS size
        if (
          Number.isFinite(placeholder.wPt) &&
          Number.isFinite(placeholder.hPt) &&
          this._pagePt &&
          this._pagePt.w > 0 &&
          this._pagePt.h > 0
        ) {
          const cssW = Math.round(placeholder.wPt * (imgRect.width  / this._pagePt.w));
          const cssH = Math.round(placeholder.hPt * (imgRect.height / this._pagePt.h));
          measureEl.style.width  = `${cssW}px`;
          measureEl.style.height = `${cssH}px`;
          if (DEBUG_FONT) console.log('[FONT] forced measureEl to steady-state css box:', { cssW, cssH });
        }

        const rect = measureEl.getBoundingClientRect();

        const pxPerPtX = natW / vp1.width;
        const pxPerPtY = natH / vp1.height;

        const cxCss = rect.x + rect.width / 2;
        const cyCss = rect.y + rect.height / 2;

        const xPtProbe = (cxCss - imgRect.x) / pxPerPtX;
        const yPtProbe = vp1.height - ((cyCss - imgRect.y) / pxPerPtY);

        if (DEBUG_FONT) {
          console.log('[FONT] base image nat(px):', { natW, natH });
          console.log('[FONT] measureEl rect:', rect);
          console.log('[FONT] probe point in PDF (pt):', { xPtProbe, yPtProbe });
        }

        const tc = await page.getTextContent();
        let best = null,
            bestDist = Infinity;
        for (const it of tc.items) {
          const [, , , , e, f] = it.transform;
          const dx = e - xPtProbe, dy = f - yPtProbe;
          const dist = dx * dx + dy * dy;
          if (dist < bestDist) { best = it; bestDist = dist; }
        }

        if (DEBUG_FONT) {
          console.log('[FONT] nearest text item:', best ? { transform: best.transform, bestDist } : 'none');
        }
        if (best) {
          // 🔎 exact text + font logs (non-invasive)
          if (DEBUG_FONT) {
            try {
              const exact = (best.str ?? '').replace(/\s+/g, ' ');
              console.log('[FONT] nearest text .str :', JSON.stringify(exact));
              if (best.fontName) console.log('[FONT] nearest fontName  :', best.fontName);
            } catch (e) {
              console.warn('[FONT] nearest text logging failed:', e);
            }
          }

          const [a, b, c, d] = best.transform;
          const fontPt = (Math.hypot(a, b) + Math.hypot(c, d)) / 2;
          placeholder.fontPt ??= fontPt; // ✅ persist once for stability across renders
          const pxPerPt = (natH / vp1.height);
          const derivedPx = Math.max(1, Math.round(fontPt * pxPerPt));
          if (DEBUG_FONT) {
            console.log('[FONT] font from transform -> fontPt:', fontPt, 'pxPerPt:', pxPerPt, 'derivedPx:', derivedPx);
          }
          // 🔁 this is our fallback size when there is NO custom style
          desiredFontPx = derivedPx;
        } else if (DEBUG_FONT) {
          console.log('[FONT] no nearby text; keep seed desiredFontPx:', desiredFontPx);
        }
      }
    }
  } catch (err) {
    if (DEBUG_FONT) console.warn('[FONT] probe error; keeping seed desiredFontPx:', desiredFontPx, err);
  }

  // ---------- B) Save geometry in PAGE POINTS ----------
  let xPt, yPt, wPt, hPt;
  if (el && this._pagePt) {
    const imgEl = this.template.querySelector('.image-container img');
    if (imgEl) {
      const alreadyHasPts =
        Number.isFinite(placeholder.wPt) && placeholder.wPt > 0 &&
        Number.isFinite(placeholder.hPt) && placeholder.hPt > 0 &&
        Number.isFinite(placeholder.xPt) && Number.isFinite(placeholder.yPt);

      if (!alreadyHasPts) {
        const imgRect = imgEl.getBoundingClientRect();
        const measureEl = resolveMeasureEl(el, placeholder.id);
        const cssRect = measureEl.getBoundingClientRect();

        const scaleX = this._pagePt.w / imgRect.width;
        const scaleY = this._pagePt.h / imgRect.height;

        wPt = cssRect.width * scaleX;
        hPt = cssRect.height * scaleY;
        xPt = (cssRect.left - imgRect.left) * scaleX;
        yPt = (cssRect.top  - imgRect.top)  * scaleY;

        if (DEBUG_FONT) {
          console.log('[FONT] geometry page-pts pre-signature:', { xPt, yPt, wPt, hPt, scaleX, scaleY });
        }

        // save page-points
        placeholder.wPt = wPt;
        placeholder.hPt = hPt;
        placeholder.xPt = xPt;
        placeholder.yPt = yPt;
        // NEW: also remember CSS size for stable preview
        placeholder.cssW = cssRect.width;
        placeholder.cssH = cssRect.height;

        const _pageNumB = Number(placeholder.page) || this.currentPage || 1;
        this.markPageDirty(_pageNumB);
        if (DEBUG_FONT) {
          console.log('[FONT] geometry (first-save):', { xPt, yPt, wPt, hPt });
          console.log('[FONT] marked page dirty (geometry save):', _pageNumB, 'phId:', placeholder.id);
        }
      } else if (DEBUG_FONT) {
        console.log('[FONT] geometry: using stored page-pts', { xPt: placeholder.xPt, yPt: placeholder.yPt, wPt: placeholder.wPt, hPt: placeholder.hPt });
      }
    }
  }

  // ---------- C) Build overlay ----------
  let base64Data;

  // 🔹 SIGNATURE PATH: reuse existing image, no font recompute
  if (placeholder.isSignature) {
    // Prefer explicit signatureDataUrl, then imageSrc, then overlaySrc, then current imageSrc
    base64Data =
      (typeof placeholder.signatureDataUrl === 'string' && placeholder.signatureDataUrl) ||
      placeholder.imageSrc ||
      placeholder.overlaySrc ||
      null;

    if (!base64Data && el && this.imageSrc) {
      base64Data = this.imageSrc;
    }

    if (DEBUG_FONT) {
      console.log('[FONT] signature path: using existing image, no text canvas. hasData:', !!base64Data);
    }

    // (optional) capture native size for aspect-ratio corrections
    if (base64Data) {
      try {
        const dim = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () =>
            resolve({
              w: img.naturalWidth || img.width,
              h: img.naturalHeight || img.height
            });
          img.onerror = reject;
          img.src = base64Data;
        });
        placeholder.sigW = dim.w;
        placeholder.sigH = dim.h;
        if (DEBUG_FONT) {
          console.log('[FONT] signature native size captured:', {
            sigW: dim.w,
            sigH: dim.h
          });
        }
      } catch (err) {
        if (DEBUG_FONT)
          console.warn('[FONT] signature dimension capture failed:', err);
      }
    }
  } else if (el && this.imageSrc) {
    // 🔹 TEXT / NON-SIGNATURE PATH (unchanged)
    const imgEl = this.template.querySelector('.image-container img');
    const probe = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = this.imageSrc;
    });
    const natW = probe.naturalWidth  || probe.width;
    const natH = probe.naturalHeight || probe.height;

    // pixels-per-point in the NATURAL (source) image space
    const pxPerPtX_nat = natW / this._pagePt.w;
    const pxPerPtY_nat = natH / this._pagePt.h;

    // Use stored page-points when available; otherwise fall back to current CSS (first draw)
    let destW, destH;
    if (
      Number.isFinite(placeholder.wPt) && Number.isFinite(placeholder.hPt) &&
      placeholder.wPt > 0 && placeholder.hPt > 0
    ) {
      // ✅ steady-state: page-pts × (nat px per pt)
      destW = Math.max(1, Math.round(placeholder.wPt * pxPerPtX_nat));
      destH = Math.max(1, Math.round(placeholder.hPt * pxPerPtY_nat));
    } else {
      const measureEl = resolveMeasureEl(el, placeholder.id);
      const cssRect = measureEl.getBoundingClientRect();
      const imgRect2 = imgEl.getBoundingClientRect();
      const ratio = natW / imgRect2.width; // CSS→natural
      destW = Math.max(1, Math.round(cssRect.width  * ratio));
      destH = Math.max(1, Math.round(cssRect.height * ratio));
    }

    // ✅ Font px: either from custom style OR fallback from nearest text
    const imgRect2 = imgEl.getBoundingClientRect();
    const ratioCssToNat = natW / imgRect2.width;

    const hasStyle = !!placeholder.textStyle;
    let destFontPx;

    if (hasStyle && placeholder.textStyle) {
      // Use author-side fontSize, scaled from CSS px to natural px
      const ts = placeholder.textStyle;
      const styleFontCss = Number(ts.fontSize) || desiredFontPx || 15;
      destFontPx = Math.max(1, Math.round(styleFontCss * ratioCssToNat));
      if (DEBUG_FONT) {
        console.log('[FONT] using style font size from textStyle:', {
          fontSizeCss: styleFontCss,
          ratioCssToNat,
          destFontPx
        });
      }
    } else {
      // 🔁 fallback: nearest PDF text -> fontPt -> natural px, as before
      const fontPtStable = Number.isFinite(placeholder.fontPt)
        ? placeholder.fontPt
        : (desiredFontPx * (this._pagePt.h / natH)); // converts back to pt if needed
      destFontPx = Math.max(1, Math.round(fontPtStable * pxPerPtY_nat));
      if (DEBUG_FONT) {
        console.log('[FONT] fallback font from nearest text -> destFontPx:', destFontPx);
      }
    }

    placeholder._pixelW = destW;
    placeholder._pixelH = destH;

    if (DEBUG_FONT) {
      console.log('[FONT] canvas target (nat px):', { destW, destH, destFontPx });
    }

    // ---- build style-aware options for canvas ----
    const ts = placeholder.textStyle || null;

    const canvasOptions = {
      targetWidth: destW,
      targetHeight: destH,
      fontFamily: 'Roboto',          // fallback
      fontPx: destFontPx,
      paddingX: 0,
      paddingY: 0,
      align: 'center',
      vAlign: 'middle',
      pixelSpace: true
    };

    if (ts) {
      canvasOptions.fontFamily = ts.fontFamily || 'Roboto';
      // color + style options ONLY when author provided them
      canvasOptions.color      = ts.color || '#000000';
      canvasOptions.fontWeight = ts.bold ? '700' : '400';
      canvasOptions.fontStyle  = ts.italic ? 'italic' : 'normal';
      canvasOptions.underline  = !!ts.underline;
    }
    // when !ts → Roboto, black, normal text; nearest-text size used above

    base64Data = this.createCanvasImage(placeholder.value || '', canvasOptions);
  } else {
    if (DEBUG_FONT) {
      console.log('[FONT] using legacy numeric path with desiredFontPx:', desiredFontPx);
    }
    // legacy: plain Roboto, fallback size
    base64Data = this.createCanvasImage(placeholder.value || 'Name', desiredFontPx, 'Roboto');
  }

  // ---------- D) Update state ----------
  placeholder.hasImage = true;
  placeholder[srcField] = base64Data;
  placeholder.overlaySrc = base64Data;

  if (placeholder.isSignature && srcField === 'SignatureSrc') {
    placeholder.imageSrc = base64Data;
  }

  this.placeholders = this.placeholders.map(p => (p.id === placeholder.id ? { ...placeholder } : p));
  const current = this.placeholdersByPage[this.currentPage] || [];
  const idNum = Number(placeholder.id);
  const idx = current.findIndex(i => i.id === idNum);
  const updatedPage = idx > -1 ? [...current.slice(0, idx), { ...placeholder }, ...current.slice(idx + 1)] : [...current, { ...placeholder }];
  this.placeholdersByPage = { ...this.placeholdersByPage, [this.currentPage]: updatedPage };

  const pageNumber = Number(placeholder.page) || this.currentPage || 1;
  this.markPageDirty(pageNumber);
  if (DEBUG_FONT) {
    console.log('[FONT] marked page dirty (post-update):', pageNumber, 'phId:', placeholder.id);
  }

  // NEW: immediately recompute placeholder styles so size is correct
  try {
    const img = this.template.querySelector('.image-container img');
    if (img && this._pagePt) {
      this._updateAllPlaceholderStyles();
    }
  } catch (e) {
    console.warn('Failed to refresh placeholder styles after canvas update', e);
  }

  this.showToast('Success', successMessage, 'success');
}











createCanvasImage(text, fontSizeOrOptions = 15, fontFamilyMaybe = 'Roboto') {
  // DEBUG toggle (non-invasive)
  const DEBUG_FONT = (this && typeof this.debugFontLogs !== 'undefined') ? !!this.debugFontLogs : true;

  // --- date normalization (unchanged) ---
  const ddMmYyyyRegex = /^\d{2}-\d{2}-\d{4}$/;
  if (ddMmYyyyRegex.test(text)) {
    const [day, month, year] = String(text).split('-');
    text = `${day}-${month}-${year}`;
  } else {
    const isProbablyDate = /^\d{4}-\d{2}-\d{2}$/.test(text) || /^\d{2}\/\d{2}\/\d{4}$/.test(text);
    if (isProbablyDate && !isNaN(Date.parse(text))) {
      const d = new Date(text);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const y = d.getFullYear();
      text = `${day}-${m}-${y}`;
    }
  }

  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
  const lines = String(text ?? '').split('\n');

  // ---- Back-compat (old signature) ----
  if (typeof fontSizeOrOptions === 'number') {
    const fontSize = fontSizeOrOptions || 15;
    const fontFamily = fontFamilyMaybe || 'Roboto';

    if (DEBUG_FONT) {
      console.log('[FONT][createCanvasImage:num] startSize:', fontSize, 'fontFamily:', fontFamily, 'lines:', lines.length);
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    ctx.font = `${fontSize}px ${fontFamily}`;
    const widths = lines.map(l => ctx.measureText(l).width);
    const textWidth = Math.max(...widths, fontSize * 4);

    // Use real ascent/descents for single-line height
    const m0 = ctx.measureText(lines[0] || '');
    const asc = m0.actualBoundingBoxAscent ?? fontSize * 0.8;
    const desc = m0.actualBoundingBoxDescent ?? fontSize * 0.2;
    const textHeight = (asc + desc) * Math.max(1, lines.length) + (fontSize * 0.1) * (lines.length - 1);

    canvas.width  = Math.ceil(textWidth * dpr);
    canvas.height = Math.ceil(textHeight * dpr);
    canvas.style.width  = `${Math.ceil(textWidth)}px`;
    canvas.style.height = `${Math.ceil(textHeight)}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `${fontSize}px ${fontFamily}`;

    // vertically center using ascent/descents
    const lineGap = fontSize * 0.1;
    let y = (canvas.height / dpr - (asc + desc) * lines.length - lineGap * (lines.length - 1)) / 2 + asc;

    for (const line of lines) {
      ctx.fillText(line, canvas.width / (2 * dpr), y);
      y += (asc + desc) + lineGap;
    }

    if (DEBUG_FONT) {
      console.log('[FONT][createCanvasImage:num] final canvas (css) w×h:', canvas.style.width, canvas.style.height, 'dpr:', dpr);
    }
    return canvas.toDataURL('image/png', 1.0);
  }

  // ---- Options path ----
  const {
    targetWidth, targetHeight,
    fontFamily = 'Roboto',
    fontPx,
    paddingX = 0, paddingY = 0,
    align = 'center',
    vAlign = 'middle',      // new: 'top' | 'middle' | 'bottom' | 'baseline'
    pixelSpace = false,
    // NEW style options (optional)
    color = '#000000',
    fontWeight = '400',
    fontStyle = 'normal',
    underline = false
  } = fontSizeOrOptions || {};

  if (!targetWidth || !targetHeight) {
    if (DEBUG_FONT) {
      console.log('[FONT][createCanvasImage:opt] missing targetW/H; fallback numeric with fontPx:', fontPx);
    }
    return this.createCanvasImage(text, fontPx || 15, fontFamily);
  }

  const wCss = Math.max(1, Math.round(targetWidth));
  const hCss = Math.max(1, Math.round(targetHeight));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (pixelSpace) {
    canvas.width  = wCss;
    canvas.height = hCss;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  } else {
    canvas.width  = Math.ceil(wCss * dpr);
    canvas.height = Math.ceil(hCss * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  canvas.style.width  = `${wCss}px`;
  canvas.style.height = `${hCss}px`;

  const availW = Math.max(0, wCss - 2 * paddingX);
  const availH = Math.max(0, hCss - 2 * paddingY);

  // choose size and shrink to fit (width/height)
  let size = fontPx || Math.floor(availH * 0.8);
  const shrinkOnly = !!fontPx;

  const measureWidth = (s) => {
    // note: here we don't yet apply italic/weight; we only care about width scale
    ctx.font = `${s}px ${fontFamily}`;
    return Math.max(...lines.map(l => ctx.measureText(l).width));
  };

  // shrink until width <= availW and height <= availH
  let w = measureWidth(size);
  if (DEBUG_FONT) {
    console.log('[FONT][createCanvasImage:opt] startSize:', size, 'shrinkOnly:', shrinkOnly, 'availW×H:', availW, availH, 'measuredW:', w);
  }
  let shrinkIters = 0;
  while ((w > availW || size > availH) && size > 5) {
    size = Math.floor(size * 0.95);
    w = measureWidth(size);
    shrinkIters++;
  }
  if (DEBUG_FONT) {
    console.log('[FONT][createCanvasImage:opt] shrink iterations:', shrinkIters, 'size after shrink:', size, 'w:', w);
  }
  if (!shrinkOnly) {
    let grew = 0;
    while (size + 1 <= availH && measureWidth(size + 1) <= availW) { size += 1; grew++; }
    if (DEBUG_FONT) console.log('[FONT][createCanvasImage:opt] gentle grow by:', grew, 'final size:', size);
  }

  // apply color + font style/weight here
  ctx.fillStyle = color;
  ctx.textAlign = (align === 'left') ? 'left' : (align === 'right') ? 'right' : 'center';
  ctx.textBaseline = 'alphabetic';

  const cssWeight = fontWeight || '400';
  const cssStyle  = fontStyle || 'normal';
  // CSS font shorthand: "italic 700 16px Roboto"
  const fontStylePrefix = (cssStyle === 'italic') ? 'italic ' : '';
  ctx.font = `${fontStylePrefix}${cssWeight} ${size}px ${fontFamily}`;

  // Use actual ascent/descents for vertical placement
  const metricsPerLine = lines.map(l => ctx.measureText(l));
  const asc = Math.max(...metricsPerLine.map(m => m.actualBoundingBoxAscent ?? size * 0.8));
  const desc = Math.max(...metricsPerLine.map(m => m.actualBoundingBoxDescent ?? size * 0.2));
  const lineGap = Math.round(size * 0.1);  // small extra leading
  const lineBox = asc + desc;
  const totalTextH = lineBox * lines.length + lineGap * (lines.length - 1);

  // compute starting y (alphabetic baseline)
  let yStart;
  switch (vAlign) {
    case 'top':
      yStart = paddingY + asc;
      break;
    case 'bottom':
      yStart = paddingY + availH - totalTextH + asc;
      break;
    case 'baseline':
      yStart = paddingY + availH; // draw baseline at bottom edge
      break;
    case 'middle':
    default:
      yStart = paddingY + (availH - totalTextH) / 2 + asc;
      break;
  }

  const x =
    (align === 'left')  ? paddingX :
    (align === 'right') ? (wCss - paddingX) :
                          (wCss / 2);

  let y = yStart;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = metricsPerLine[i] || ctx.measureText(line);
    const textWidth = Math.min(availW, m.width || availW);

    // draw text
    ctx.fillText(line, x, y, availW);

    // optional underline (only if requested)
    if (underline && textWidth > 0) {
      let ux1, ux2;
      if (align === 'left') {
        ux1 = x;
        ux2 = x + textWidth;
      } else if (align === 'right') {
        ux1 = x - textWidth;
        ux2 = x;
      } else {
        ux1 = x - textWidth / 2;
        ux2 = x + textWidth / 2;
      }

      const descent = m.actualBoundingBoxDescent ?? size * 0.1;
      const underlineY = y + descent * 0.6;

      ctx.beginPath();
      ctx.moveTo(ux1, underlineY);
      ctx.lineTo(ux2, underlineY);
      ctx.lineWidth = Math.max(1, size * 0.08);
      ctx.strokeStyle = color;
      ctx.stroke();
    }

    y += lineBox + lineGap;
  }

  if (DEBUG_FONT) {
    console.log('[FONT][createCanvasImage:opt] finalFontPx:', size, 'lines:', lines.length);
    console.log('[FONT][createCanvasImage:opt] final canvas (css) w×h:', wCss, hCss, 'pixelSpace:', pixelSpace, 'dpr:', dpr);
  }
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
    } else if (placeholder.isABN) {
        srcField = 'AbnSrc';
        label = 'ABN';
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
    if (ph.isABN) return 'tel';
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
            await new Promise((resolve) => setTimeout(resolve, 50)); // Add a small delay for rendering

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



toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
}




async generateThumbnailsAsync() {
    if (!this.pdfDoc) return;

    this.thumbnails = [];

    for (let i = 1; i <= this.pdfDoc.numPages; i++) {

        const page = await this.pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.4 });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // ✅ Improve clarity (retina support)
        const dpr = window.devicePixelRatio || 1;

        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;

        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        await page.render({ canvasContext: ctx, viewport }).promise;

        const isActive = i === this.currentPage;

        this.thumbnails = [
            ...this.thumbnails,
            {
                page: i,
                src: canvas.toDataURL('image/jpeg', 0.7),
                isActive,
                className: isActive
                    ? 'thumbnail-item active'
                    : 'thumbnail-item'
            }
        ];

        // ✅ Yield control every few pages
        if (i % 3 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
}  

get hamburgerIcon() {
    return this.isSidebarOpen ? 'close' : 'menu';
}

get sidebarClass() {
    return this.isSidebarOpen
        ? 'sidebar-overlay custom-scroll open'
        : 'sidebar-overlay';
}

get hamburgerStyle() {
    return this.isSidebarOpen
        ? 'left: 260px;'  // align with sidebar edge
        : 'left: 0px;';
}

get hamburgerClass() {
    return this.isSidebarOpen
        ? 'hamburger-container open'
        : 'hamburger-container';
}

handleThumbnailClick(event) {
    const page = Number(event.currentTarget.dataset.page);

    if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
    }

    this._log('nav:thumbnail', { from: this.currentPage, to: page });

    this.currentPage = page;
    this.renderPageAsImage(page);

    // ✅ ONLY THIS
    this.syncThumbnailUI();
}

updateActiveThumbnail() {
    this.thumbnails = this.thumbnails.map(t => {
        if (t.page === this.currentPage && !t.isActive) {
            return { ...t, isActive: true, className: 'thumbnail-item active' };
        }
        if (t.isActive && t.page !== this.currentPage) {
            return { ...t, isActive: false, className: 'thumbnail-item' };
        }
        return t;
    });
}

syncThumbnailUI() {
    // 1. Update state
    this.updateActiveThumbnail();

    // 2. Wait for DOM to update before scrolling
    if (this.isSidebarOpen) {
        setTimeout(() => {
    this.scrollToActiveThumbnail();
}, 0);
    }
}

scrollToActiveThumbnail() {
    const active = this.template.querySelector('.thumbnail-item.active');
    const container = this.template.querySelector('.thumbnail-sidebar');

    if (!active || !container) return;

    const rect = active.getBoundingClientRect();
    const parentRect = container.getBoundingClientRect();

    const isVisible =
        rect.bottom > parentRect.top &&
        rect.top < parentRect.bottom;

    if (!isVisible) {
        active.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}
    
}