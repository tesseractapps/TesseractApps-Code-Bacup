import { LightningElement, track, api } from 'lwc';
import getPlaceholders from '@salesforce/apex/TSignTemplateController.getPlaceholders';
import getUploadedFileUrl from '@salesforce/apex/TSignTemplateController.getUploadedFileUrl';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import pdfjsLib from '@salesforce/resourceUrl/pdfJS';
import pdfWorker from '@salesforce/resourceUrl/pdfWorker';
import { loadScript } from 'lightning/platformResourceLoader';
import updateNameInPdfId from '@salesforce/apex/TSignTemplateController.updateNameInPdfId';
import getAllRecipients from '@salesforce/apex/TSignTemplateController.getAllRecipients';
import saveImageToSalesforce from '@salesforce/apex/TSignTemplateController.saveImageToSalesforce';
import getFileNameFromRecord from '@salesforce/apex/TSignTemplateController.getFileNameFromRecord';
import TeSignLogo from '@salesforce/resourceUrl/Te_sign';
import getCurrentUserEmail from '@salesforce/apex/TSignTemplateController.getCurrentUserEmail';
import getUploadedSignUrl from '@salesforce/apex/TSignTemplateController.getUploadedSignUrl';
import { loadStyle } from 'lightning/platformResourceLoader';
import adobeFonts from '@salesforce/resourceUrl/AdobeFonts';
// import generatePdfFromAWS from '@salesforce/apex/AWSPdfService.generatePdfFromAWS';
import saveFirstName from '@salesforce/apex/TemplateController.saveFirstName';
import saveMessage from '@salesforce/apex/TSignTemplateController.saveMessage';
import fetchMessages from '@salesforce/apex/TSignTemplateController.fetchMessages';
import Send_Icon from '@salesforce/resourceUrl/Send_Icon';
import getOfferTemplateDetails from '@salesforce/apex/TSignTemplateController.getOfferTemplateDetails';
import getChildSignatureDetails from '@salesforce/apex/TSignTemplateController.getChildSignatureDetails';
import deactivateLink from '@salesforce/apex/TSignTemplateController.deactivateLink';
import getSignerLinkStatus from '@salesforce/apex/TSignTemplateController.getSignerLinkStatus';
import storePdfRecord from '@salesforce/apex/TSign_AWSPdfService.storePdfRecord';
import getCertificateValidationData from '@salesforce/apex/TSignTemplateController.getCertificateValidationData';
import getAllChildSignatures from '@salesforce/apex/TSignTemplateController.getAllChildSignatures';
import getCompletionCertificatePayload from '@salesforce/apex/TSignTemplateController.getCompletionCertificatePayload';
import Tlogo from '@salesforce/resourceUrl/Tlogo';
import Tdark from '@salesforce/resourceUrl/Tdark';
import resolveSignerLink from '@salesforce/apex/TSignTemplateController.resolveSignerLink';
import getDefaultSignatureForLink from '@salesforce/apex/TSignTemplateController.getDefaultSignatureForLink';
import getPagesForSigner from '@salesforce/apex/tSignDocApiController.getPagesForSigner';
import getPagesForRecord from '@salesforce/apex/tSignDocApiController.getPagesForRecord';
import getPdfDownloadForSigner from '@salesforce/apex/tSignDocApiController.getPdfDownloadForSigner';
import getPdfDownloadForRecord from '@salesforce/apex/tSignDocApiController.getPdfDownloadForRecord';
import getStampAssetUploadUrls from '@salesforce/apex/tSignDocApiController.getStampAssetUploadUrls';
import stampForSigner from '@salesforce/apex/tSignDocApiController.stampForSigner';

const TIMING_LOG = true;

export default class OfferTemplateList extends LightningElement {
  @track records = [];
  @track recordId;
  @track childSignatureId;
  @track filteredRecords = [];
  @track nextRecipientEmail = [];
  @track searchKey = '';
  @track imageSrc = '';
  @track FNimageSrc = '';
  @track placeholders = [];
  placeholdersByPage = {};
  @track currentPage = 1;
  @track totalPages = 0;
  @track isLoading = false;
  @track isLoadingpop = false;
  @track selectedRecordId = '';
  @track isPreviewVisible = false;

  useDocApi = true;
  @track useStampApi = true;
  @track debugLogs = false;
  _stampState = null;
  _usingServerPages = false;
  _pdfDocReady = null;
  _pdfDocReadySettled = false;
  _pdfDocFailed = false;
  _pdfDocError = '';
  _pdfDocLoadScheduled = false;
  _docContext = null;
  _imageRefreshAttempted = false;

  // Timing tracking
  _perfMarks = [];
  _perfEnded = false;
  _perfSafetyTimeout = null;
  _pageImagesLoaded = new Set();
  _pageImagesFailed = new Set();
  _thumbImagesLoaded = new Set();
  _thumbImagesFailed = new Set();
  _thumbsSettledMarked = false;
  _pagesSettledMarked = false;

  get isDocEngineReady() {
    if (this.useStampApi) return true;
    return !this._usingServerPages || (this.pdfDoc !== null && this.pdfDoc !== undefined);
  }

  get isDocEngineFailed() {
    if (this.useStampApi) return false;
    return this._usingServerPages && this._pdfDocFailed;
  }

  get isSubmitDisabled() {
    return !this.isDocEngineReady;
  }

  get docEngineHint() {
    if (this.isDocEngineFailed) return '';
    return this.isDocEngineReady ? '' : 'Preparing document…';
  }
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
  // Auto-redirect to the T-Sign website after a successful signing
  redirectUrl = 'https://tsignapp.com/';
  @track redirectCountdown = 0;
  _redirectTimer = null;
  @track isAlreadySubmitted = false;
  @track isLinkExpired = false;
  @track showFailureScreen = false;
  @track isattachError = false;
  @track showSpinner = false;
  @track isDrawing = false;
  @track canvasContext;
  placeholderId;
  @track currentEditingMaxChars = 0;
  @track isSignatureModalVisible = false;
  @track isNameSignatureModalVisible = false;
  // Apply-signature-to-all popup (shown once, after the first signature, when the recipient has 2+ signature fields)
  @track isApplySignaturePopupVisible = false;
  @track applySignatureChoice = 'all';      // 'all' | 'none'
  @track signatureApplyMode = null;         // null = not asked yet | 'all' | 'none'
  _applySignatureSourceId = null;
  _savedSignaturePromise = null;
  _savedSignatureApplied = false;
  _applySignatureImage = null;
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
  @track currentEditingPicklistOptions = [];
  @track currentEditingCheckboxChecked = false;
  @track isLinkInvalid = false;   // unknown / malformed / tampered link
  linkToken = null;               // ?t= token (null for legacy ?data= links)



  @track isSidebarOpen = false;
  @track thumbnails = [];
  _pagePt = null;
  _pageDimensionsCache = new Map();
  @track pagesData = [];
  _intersectionObserver = null;
  _pageVisibilityMap = new Map();

  // Field Guide State for Signer
  @track guideState = 'START';        // 'START' | 'TARGET' | 'FINISH'
  @track guideTargetId = null;        // Active target placeholder ID
  @track guidePageNumber = 1;         // Page currently hosting the tab (starts on page 1)
  @track guideTopPx = 16;             // Top in pixels (16px on START state, else layout centered)
  @track guideLeftPx = -104;          // Left in pixels (gutter or 0 in compact)
  @track isGuideCompact = false;      // True if gutter < (tabWidth + 16px)
  @track guideVersion = 0;            // Mutation counter forcing reactivity on in-place edits
  _guideDirty = false;                // Set when values or layout change to guard rAF
  _windowResizeHandler = null;        // Window resize listener

  disconnectedCallback() {
    this.stopPolling(); // Stop polling when the component is unloaded
    if (this._intersectionObserver) {
      this._intersectionObserver.disconnect();
      this._intersectionObserver = null;
    }
    if (this._windowResizeHandler) {
      window.removeEventListener('resize', this._windowResizeHandler);
    }
    if (this._redirectTimer) {
      clearInterval(this._redirectTimer);
      this._redirectTimer = null;
    }
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
  // connectedCallback() {
  //   console.log('TeSignLogo URL:', this.logo);
  //   console.log('Initializing component and fetching data...');
  //   this.sessionGuid = this.generateGUID();

  //   const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  //   this.updateFavicon(isDarkMode ? Tdark : Tlogo);
  //   document.title = 'T sign | TesseractApps';

  //   if (window.matchMedia) {
  //     const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
  //     themeMedia.addEventListener('change', (e) => {
  //       const newIcon = e.matches ? Tdark : Tlogo;
  //       this.updateFavicon(newIcon);
  //     });
  //   }

  //   this._windowResizeHandler = () => {
  //     this._guideDirty = true;
  //     this._positionGuide();
  //   };
  //   window.addEventListener('resize', this._windowResizeHandler);

  //   const params = new URLSearchParams(window.location.search);
  //   const linkToken = params.get('t');       // new tamper-proof link
  //   const encodedData = params.get('data');  // legacy link (remove after changeover)

  //   if (!linkToken && !encodedData) {
  //     console.warn('[LINK] No link token or data in the URL.');
  //     this.isLinkInvalid = true;
  //     return;
  //   }

  //   // 0) Resolve who the signer is:
  //   //    ?t=    -> server resolves token to recordId / email / childSignatureId
  //   //    ?data= -> legacy: decoded in the browser
  //   const identityPromise = linkToken
  //     ? this.resolveIdentityFromToken(linkToken)
  //     : Promise.resolve(this.resolveIdentityFromLegacyData(encodedData));

  //   identityPromise
  //     .then((isResolved) => {
  //       if (!isResolved) {
  //         return Promise.reject('Link Invalid');
  //       }

  //       // 1) Load libraries first: main pdfJS + fonts (do NOT load worker as a script)
  //       return Promise.all([
  //         loadScript(this, pdfjsLib).catch(error => console.error('Failed to load pdfjsLib:', error)),
  //         loadStyle(this, adobeFonts).catch(error => console.error('Failed to load fonts:', error)),
  //       ]);
  //     })
  //     .then(() => {
  //       // 2) Configure pdf.js worker
  //       if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
  //         window.pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
  //       }
  //       console.log('All libraries initialized successfully');
  //       this.pdfLoaded = true;

  //       // 3) Now it is safe to fetch recipients & data (these will call loadPdf)
  //       return getAllRecipients({ recordId: this.recordId });
  //     })
  //     .then((allRecipients) => {
  //       if (!allRecipients) {
  //         console.warn('No recipients found.');
  //         return;
  //       }

  //       this.allRecipients = allRecipients
  //         .split('\n')
  //         .map(email => email.trim())
  //         .filter(email => email !== '');
  //       console.log('Parsed all recipients:', this.allRecipients);

  //       // Case-insensitive (was exact indexOf)
  //       this.currentRecipientIndex = this.findRecipientIndex(this.currentUserEmail);
  //       console.log('Current recipient index:', this.currentRecipientIndex);

  //       this.nextRecipientEmail = this.getNextRecipientEmail();
  //       console.log('Upcoming recipient email:', this.nextRecipientEmail);

  //       // Server-side link status (server clock); client clock is only the fallback.
  //       // Token links: status already returned by resolveSignerLink.
  //       const linkStatusPromise = this.linkToken
  //         ? Promise.resolve(this.serverLinkStatus)
  //         : getSignerLinkStatus({ recordId: this.recordId, signerEmail: this.currentUserEmail })
  //           .catch((error) => {
  //             console.warn('[LINK] server link check failed, using client check:', error);
  //             return null;
  //           });

  //       return linkStatusPromise.then((linkStatus) => {
  //         this.serverLinkStatus = (linkStatus && linkStatus.found) ? linkStatus : null;
  //         console.log('[LINK] server link status:', JSON.stringify({
  //           found: !!this.serverLinkStatus,
  //           isExpired: this.serverLinkStatus ? this.serverLinkStatus.isExpired : null,
  //           isActive: this.serverLinkStatus ? this.serverLinkStatus.isActive : null
  //         }));

  //         // Select data source:
  //         // token links -> the record the token belongs to; legacy -> recipient position
  //         const isChildSigner = this.linkToken
  //           ? !!this.childSignatureId
  //           : this.currentRecipientIndex > 0;

  //         if (isChildSigner) {
  //           this.fetchRecipientSpecificData();
  //         } else {
  //           this.fetchRecordData();
  //         }
  //       });
  //     })
  //     .catch((error) => {
  //       if (error === 'Link Invalid') {
  //         return; // invalid-link screen already shown
  //       }
  //       console.error('Error during initialization:', error);
  //       this.showToast('Error', 'Failed to initialize component.', 'error');
  //     });
  // }
  connectedCallback() {
    this._perfStart();
    console.log('[INIT] connectedCallback started');
    console.log('[INIT] TeSignLogo URL:', this.logo);
    console.log('[INIT] Initial component state:', {
      sessionGuid: this.sessionGuid,
      recordId: this.recordId,
      currentUserEmail: this.currentUserEmail,
      linkToken: this.linkToken,
      childSignatureId: this.childSignatureId
    });

    this.sessionGuid = this.generateGUID();
    console.log('[INIT] Generated session GUID:', this.sessionGuid);

    const isDarkMode = window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    console.log('[THEME] Initial dark mode:', isDarkMode);
    console.log('[THEME] Updating favicon');

    this.updateFavicon(isDarkMode ? Tdark : Tlogo);
    document.title = 'T sign | TesseractApps';

    console.log('[INIT] Document title set:', document.title);

    if (window.matchMedia) {
      const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');

      themeMedia.addEventListener('change', (e) => {
        console.log('[THEME] Theme changed:', {
          isDarkMode: e.matches,
          favicon: e.matches ? 'Tdark' : 'Tlogo'
        });

        const newIcon = e.matches ? Tdark : Tlogo;
        this.updateFavicon(newIcon);
      });

      console.log('[THEME] Theme change listener registered');
    }

    this._windowResizeHandler = () => {
      console.log('[RESIZE] Window resized; marking guide dirty');
      this._guideDirty = true;
      this._positionGuide();
    };

    window.addEventListener('resize', this._windowResizeHandler);
    console.log('[INIT] Window resize listener registered');

    const params = new URLSearchParams(window.location.search);
    const linkToken = params.get('t');
    const encodedData = params.get('data');

    if (this.debugLogs) {
      console.log('[LINK] URL parameters detected:', {
        hasToken: !!linkToken,
        hasLegacyData: !!encodedData,
        tokenLength: linkToken ? linkToken.length : 0,
        legacyDataLength: encodedData ? encodedData.length : 0
      });
    }

    // Avoid logging the actual token or encoded data for security.

    if (!linkToken && !encodedData) {
      console.warn('[LINK] No link token or data found in URL');
      this.isLinkInvalid = true;
      console.log('[LINK] Invalid-link screen activated');
      return;
    }

    console.log('[LINK] Starting signer identity resolution');

    const identityPromise = linkToken
      ? this.resolveIdentityFromToken(linkToken)
      : Promise.resolve(this.resolveIdentityFromLegacyData(encodedData));

    identityPromise
      .then((isResolved) => {
        console.log('[IDENTITY] Identity resolution result:', isResolved);

        if (!isResolved) {
          console.warn('[IDENTITY] Identity resolution failed');
          return Promise.reject('Link Invalid');
        }

        this._perfMark('Identity resolved');

        if (this.linkToken) {
          this._savedSignaturePromise = getDefaultSignatureForLink({ token: this.linkToken })
            .catch(() => null);
        }

        console.log('[LIBRARY] Loading PDF.js library and Adobe fonts');

        return Promise.all([
          loadScript(this, pdfjsLib).then(() => {
            console.log('[LIBRARY] PDF.js loaded successfully');
          }).catch(error => {
            console.error('[LIBRARY] Failed to load PDF.js:', error);
          }),

          loadStyle(this, adobeFonts).then(() => {
            console.log('[LIBRARY] Adobe fonts loaded successfully');
          }).catch(error => {
            console.error('[LIBRARY] Failed to load Adobe fonts:', error);
          })
        ]);
      })
      .then(() => {
        console.log('[PDF] Configuring PDF.js worker');

        if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
          console.log('[PDF] Worker configured:', pdfWorker);
        } else {
          console.warn('[PDF] PDF.js or GlobalWorkerOptions is unavailable');
        }
        console.log('[PDF] Worker available:', typeof Worker, 'workerSrc set:', !!window.pdfjsLib?.GlobalWorkerOptions?.workerSrc);

        this.pdfLoaded = true;
        this._perfMark('Libraries loaded');
        console.log('[PDF] PDF library initialization complete');
        console.log('[RECIPIENTS] Fetching all recipients for record:', this.recordId);

        return getAllRecipients({ recordId: this.recordId });
      })
      .then((allRecipients) => {
        if (this.debugLogs) {
          console.log('[RECIPIENTS] Raw recipient response:', allRecipients);
        }

        if (!allRecipients) {
          console.warn('[RECIPIENTS] No recipients found');
          return;
        }

        this.allRecipients = allRecipients
          .split(/\r?\n/)
          .map(email => email.trim())
          .filter(email => email !== '');

        if (this.debugLogs) {
          console.log('[RECIPIENTS] Parsed recipients:', this.allRecipients);
        }
        console.log('[RECIPIENTS] Total recipients:', this.allRecipients.length);

        this.currentRecipientIndex =
          this.findRecipientIndex(this.currentUserEmail);

        console.log('[RECIPIENTS] Current recipient index:', this.currentRecipientIndex);
        console.log('[RECIPIENTS] Current user email:', this.currentUserEmail);

        this.nextRecipientEmail = this.getNextRecipientEmail();

        console.log('[RECIPIENTS] Next recipient email:', this.nextRecipientEmail);

        const linkStatusPromise = this.linkToken
          ? Promise.resolve(this.serverLinkStatus)
          : getSignerLinkStatus({
            recordId: this.recordId,
            signerEmail: this.currentUserEmail
          }).catch((error) => {
            console.warn(
              '[LINK] Server link status check failed; using fallback:',
              error
            );
            return null;
          });

        console.log('[LINK] Checking signer link status');

        return linkStatusPromise.then((linkStatus) => {
          this.serverLinkStatus =
            (linkStatus && linkStatus.found) ? linkStatus : null;

          console.log('[LINK] Link status resolved:', {
            found: !!this.serverLinkStatus,
            isExpired: this.serverLinkStatus
              ? this.serverLinkStatus.isExpired
              : null,
            isActive: this.serverLinkStatus
              ? this.serverLinkStatus.isActive
              : null
          });

          const isChildSigner = this.linkToken
            ? !!this.childSignatureId
            : this.currentRecipientIndex > 0;

          console.log('[SIGNER] Signer classification:', {
            isChildSigner,
            currentRecipientIndex: this.currentRecipientIndex,
            hasChildSignatureId: !!this.childSignatureId,
            dataSource: isChildSigner
              ? 'Recipient-specific data'
              : 'Record data'
          });

          if (isChildSigner) {
            console.log('[DATA] Calling fetchRecipientSpecificData()');
            this.fetchRecipientSpecificData();
          } else {
            console.log('[DATA] Calling fetchRecordData()');
            this.fetchRecordData();
          }

          console.log('[INIT] Initialization flow completed');
        });
      })
      .catch((error) => {
        if (error === 'Link Invalid') {
          console.warn('[LINK] Initialization stopped: invalid link');
          return;
        }

        console.error('[INIT] Error during initialization:', error);
        console.error('[INIT] Error details:', {
          message: error && error.message,
          stack: error && error.stack
        });

        this.showToast(
          'Error',
          'Failed to initialize component.',
          'error'
        );
      });
  }


  renderedCallback() {
    if (this._guideDirty) {
      this._positionGuide();
    }
  }

  // ?t= link: the server resolves the token. recordId / email / childSignatureId
  // come from Salesforce, never from the URL. Resolves true when usable.
  // resolveIdentityFromToken(token) {
  //   this.linkToken = token;

  //   return resolveSignerLink({ token }).then((link) => {
  //     if (!link || link.found !== true || !link.recordId || !link.email) {
  //       this.isLinkInvalid = true;
  //       return false;
  //     }
  //     this.recordId = link.recordId;
  //     this.currentUserEmail = link.email;
  //     this.childSignatureId = link.childSignatureId || null;
  //     this.serverLinkStatus = link; // found / isExpired / isActive
  //     if (link.fileName) {
  //       this.uiFileName = link.fileName;
  //     }
  //     return true;
  //   });
  // }

  // // Legacy ?data= link (base64 of recordId / email). Remove after the changeover.
  // resolveIdentityFromLegacyData(encodedData) {
  //   try {
  //     const decodedParams = new URLSearchParams(atob(encodedData));
  //     this.recordId = decodedParams.get('recordId');
  //     this.currentUserEmail = decodedParams.get('email');
  //   } catch (e) {
  //     this.isLinkInvalid = true;
  //     return false;
  //   }
  //   if (!this.recordId || !this.currentUserEmail) {
  //     this.isLinkInvalid = true;
  //     return false;
  //   }
  //   return true;
  // }
  resolveIdentityFromToken(token) {
    console.log('[IDENTITY][TOKEN] Starting token identity resolution');

    this.linkToken = token;

    if (this.debugLogs) {
      console.log('[IDENTITY][TOKEN] Token assigned to component', {
        hasToken: !!token,
        tokenLength: token ? token.length : 0
      });
    }

    return resolveSignerLink({ token })
      .then((link) => {
        console.log('[IDENTITY][TOKEN] Server response received:', {
          hasResponse: !!link,
          found: link ? link.found : null,
          hasRecordId: !!(link && link.recordId),
          hasEmail: !!(link && link.email),
          hasChildSignatureId: !!(link && link.childSignatureId),
          hasFileName: !!(link && link.fileName),
          isExpired: link ? link.isExpired : null,
          isActive: link ? link.isActive : null
        });

        if (
          !link ||
          link.found !== true ||
          !link.recordId ||
          !link.email
        ) {
          console.warn(
            '[IDENTITY][TOKEN] Invalid link: required identity fields are missing'
          );

          this.isLinkInvalid = true;

          console.log('[IDENTITY][TOKEN] isLinkInvalid set to true');

          return false;
        }

        this.recordId = link.recordId;
        this.currentUserEmail = link.email;
        this.childSignatureId = link.childSignatureId || null;
        this.serverLinkStatus = link;

        console.log('[IDENTITY][TOKEN] Identity assigned successfully:', {
          recordId: this.recordId,
          currentUserEmail: this.currentUserEmail,
          hasChildSignatureId: !!this.childSignatureId,
          serverLinkStatusFound: !!this.serverLinkStatus
        });

        if (link.fileName) {
          this.uiFileName = link.fileName;

          console.log(
            '[IDENTITY][TOKEN] UI file name assigned:',
            this.uiFileName
          );
        } else {
          console.log(
            '[IDENTITY][TOKEN] No file name returned by server'
          );
        }

        console.log(
          '[IDENTITY][TOKEN] Token identity resolution successful'
        );

        return true;
      })
      .catch((error) => {
        console.error(
          '[IDENTITY][TOKEN] resolveSignerLink failed:',
          error
        );

        console.error('[IDENTITY][TOKEN] Error details:', {
          message: error && error.message,
          stack: error && error.stack
        });

        throw error;
      });
  }


  // Legacy ?data= link (Base64 of recordId / email).
  // Remove after the changeover.
  resolveIdentityFromLegacyData(encodedData) {
    console.log('[IDENTITY][LEGACY] Starting legacy identity resolution');

    console.log('[IDENTITY][LEGACY] Encoded data status:', {
      hasEncodedData: !!encodedData,
      encodedDataLength: encodedData ? encodedData.length : 0
    });

    try {
      const decodedString = atob(encodedData);

      console.log(
        '[IDENTITY][LEGACY] Base64 decoding successful'
      );

      const decodedParams = new URLSearchParams(decodedString);

      this.recordId = decodedParams.get('recordId');
      this.currentUserEmail = decodedParams.get('email');

      console.log('[IDENTITY][LEGACY] Decoded identity status:', {
        hasRecordId: !!this.recordId,
        hasEmail: !!this.currentUserEmail
      });

    } catch (e) {
      console.error(
        '[IDENTITY][LEGACY] Failed to decode or parse legacy data:',
        e
      );

      this.isLinkInvalid = true;

      console.warn(
        '[IDENTITY][LEGACY] isLinkInvalid set to true'
      );

      return false;
    }

    if (!this.recordId || !this.currentUserEmail) {
      console.warn(
        '[IDENTITY][LEGACY] Invalid link: recordId or email is missing',
        {
          hasRecordId: !!this.recordId,
          hasEmail: !!this.currentUserEmail
        }
      );

      this.isLinkInvalid = true;

      console.log(
        '[IDENTITY][LEGACY] isLinkInvalid set to true'
      );

      return false;
    }

    console.log(
      '[IDENTITY][LEGACY] Identity resolved successfully:',
      {
        recordId: this.recordId,
        currentUserEmail: this.currentUserEmail
      }
    );

    return true;
  }


  // Case-insensitive position of an email in allRecipients (-1 when not found)
  findRecipientIndex(email) {
    if (!this.allRecipients || !email) {
      return -1;
    }
    const target = email.trim().toLowerCase();
    return this.allRecipients.findIndex(e => e.trim().toLowerCase() === target);
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

    if (this.debugLogs) {
      console.log('🔍 TSign Audit Data:', JSON.stringify(auditData, null, 2));
    }

    return JSON.stringify(auditData); // ✅ Ready for Apex
  }

  getNextRecipientEmail() {
    if (!this.allRecipients || this.allRecipients.length === 0) {
      console.warn("No recipients found.");
      return null;
    }

    let recipientsArray = this.allRecipients;

    // Case-insensitive, trimmed match (was exact indexOf)
    let currentIndex = this.findRecipientIndex(this.currentUserEmail);
    console.log(`Current recipient index: ${currentIndex}`);
    console.log("All Recipients fetched:", recipientsArray);

    let nextRecipient = null;
    if (currentIndex !== -1 && currentIndex + 1 < recipientsArray.length) {
      nextRecipient = recipientsArray[currentIndex + 1].trim();
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

          // ✅ Server clock decides when available; client clock only as fallback
          this.isLinkExpired = this.serverLinkStatus
            ? this.serverLinkStatus.isExpired === true
            : nowUTC > expirationTimeUTC;
          console.log('🔐 Is link expired?', this.isLinkExpired);


          this.isAlreadySubmitted = this.serverLinkStatus
            ? this.serverLinkStatus.isActive !== true
            : !data.Link_Active__c;

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
        this._perfMark('Placeholders + URL fetched');

        if (this.debugLogs) {
          console.log('Placeholders fetched:', placeholders);
          console.log('PDF URL fetched:', pdfUrl);
          console.log('All Recipients fetched:', allRecipients);
          console.log('Original PDF reference:', pdfUrl);
        }
        this.originalPdfReference = pdfUrl;
        // ✅ Filter placeholders for the current user
        try {
          this.placeholders = JSON.parse(placeholders)
            .filter((placeholder) => !placeholder.isConfig && placeholder.recipient === this.currentUserEmail)
            // OLD CODE: .map((placeholder) => this.normalizePlaceholderForStyles(placeholder));
            .map((placeholder) => this.normalizePlaceholderForStyles(this._prefillDateOfSigning(placeholder)));

        } catch (parseError) {
          console.error('Error parsing placeholders:', parseError);
          this.showToast('Error', 'Failed to parse placeholders.', 'error');
          return;
        }
        console.log('Encoded PDF URL:', pdfUrl);
        this.loadDocument(pdfUrl, { useChildPdf: false });
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

        if (this.debugLogs) {
          console.log('🔹 Child_Signatures__c Data Retrieved:', JSON.stringify(childData));
        }

        // Token links: childSignatureId already came from the server (resolveSignerLink),
        // so keep it. Legacy ?data= links: take it from this lookup as before.
        if (!this.linkToken) {
          this.childSignatureId = childData.Id;
        }
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

        // ✅ Server clock decides when available; client clock only as fallback
        // (token links always have serverLinkStatus from resolveSignerLink)
        this.isLinkExpired = this.serverLinkStatus
          ? this.serverLinkStatus.isExpired === true
          : nowUTC > expirationTimeUTC;
        this.isAlreadySubmitted = this.serverLinkStatus
          ? this.serverLinkStatus.isActive !== true
          : !childData.Link_Active__c;

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
          this.isLoading = false;
          return;
        }
        this._perfMark('Placeholders + URL fetched');

        if (this.debugLogs) {
          console.log('📜 Placeholders Fetched:', placeholders);
          console.log('📄 Child PDF Data Fetched:', JSON.stringify(childPdfData));
          console.log('📄 PDF URL for Recipient:', childPdfData);
          console.log('Original PDF reference:', childPdfData);
        }

        // ✅ Set the PDF URL from the Signature_URL__c field
        this.pdfUrl = childPdfData;
        this.originalPdfReference = this.pdfUrl;

        // Case-insensitive, trimmed match so "John@x.com" and "john@x.com" are the same signer
        const signerEmail = (this.currentUserEmail || '').trim().toLowerCase();

        try {
          this.placeholders = JSON.parse(placeholders)
            .filter(placeholder =>
              !placeholder.isConfig &&
              (placeholder.recipient || '').trim().toLowerCase() === signerEmail
            )
            // OLD CODE: .map(placeholder => this.normalizePlaceholderForStyles(placeholder));
            .map(placeholder => this.normalizePlaceholderForStyles(this._prefillDateOfSigning(placeholder)));

          if (this.debugLogs) {
            console.log('✅ Filtered Placeholders:', this.placeholders);
          }
        } catch (parseError) {
          console.error('🚨 Error Parsing Placeholders:', parseError);
          this.showToast('Error', 'Failed to parse placeholders.', 'error');
          this.isLoading = false;
          return;
        }

        // ✅ Load the PDF using the extracted `pdfUrl`
        this.loadDocument(childPdfData, { useChildPdf: true });
      })
      .catch((error) => {
        this.isLoading = false;
        if (error !== 'Link Expired' && error !== 'Already Submitted' && error !== 'No child signature record found') {
          console.error('🚨 Error Fetching Recipient-Specific Data:', error);
          this.showToast('Error', 'Failed to fetch data for recipient.', 'error');
        }
      });
  }

  // Date of signing = today's date on the signer's device, set every time the link is opened.
  // Stored as YYYY-MM-DD (same as the date picker gives); shown as DD-MM-YYYY.
  // Built from local date parts, not toISOString(), which is UTC and can be a day off.
  _prefillDateOfSigning(placeholder) {
    if (placeholder && placeholder.isDateOfSigning) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      placeholder.value = `${y}-${m}-${d}`;
    }
    return placeholder;
  }

  getFormattedDisplayValue(value, isDateType, dataType) {
    if (!value) {
      if (dataType === 'Boolean') return '☐';
      return '';
    }
    if (dataType === 'Boolean') {
      return value === 'true' ? '☑' : '☐';
    }
    if (dataType === 'Currency') {
      const val = parseFloat(value);
      if (!isNaN(val)) {
        return '$' + val.toFixed(2);
      }
    }
    if (isDateType) {
      const ddMmYyyyRegex = /^\d{2}-\d{2}-\d{4}$/;
      if (ddMmYyyyRegex.test(value)) {
        return value;
      }
      const isProbablyDate = /^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{2}\/\d{2}\/\d{4}$/.test(value);
      if (isProbablyDate && !isNaN(Date.parse(value))) {
        const d = new Date(value);
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const y = d.getFullYear();
        return `${day}-${m}-${y}`;
      }
    }
    return value;
  }

  getPlaceholderMaxChars(placeholder) {
    // Use stored width (in editor pixels, default to 150 if not specified)
    let w = placeholder.w;
    if (w == null && placeholder.wPt != null && this._pagePt) {
      // If only wPt is available, reconstruct editor pixel width using standard 1024px canvas
      w = (placeholder.wPt / this._pagePt.w) * 1024;
    }
    if (w == null) {
      w = 150; // default width fallback
    }

    // Subtract space reserved for the edit icon (approx 20px in normalized 1024px space)
    const usableWidth = Math.max(10, w - 20);

    // Get font size (explicitly configured, or fallback to 18px)
    let fontSize = 18;
    if (placeholder.textStyle && placeholder.textStyle.fontSize) {
      fontSize = parseInt(placeholder.textStyle.fontSize, 10) || 18;
    }

    // Calculate average character width (based on 0.42 ratio for Arial/sans-serif)
    const avgCharWidth = fontSize * 0.42;

    // Max characters is usable width / average character width
    return Math.max(1, Math.floor(usableWidth / avgCharWidth));
  }

  normalizePlaceholderForStyles(raw) {
    const placeholder = { ...raw };
    placeholder.maxChars = this.getPlaceholderMaxChars(placeholder);
    placeholder.showCustomStatic = placeholder.hasImage && placeholder.dataType !== 'Boolean';

    if (placeholder.type === 'Signature' || placeholder.isSignature) {
      placeholder.isSignature = true;
      if (placeholder.w == null && placeholder.wPt == null) {
        placeholder.w = 240;
      }
      if (placeholder.h == null && placeholder.hPt == null) {
        placeholder.h = 64;
      }
    }

    if (placeholder.type === 'NameInitials' || placeholder.isNameInitials) {
      placeholder.isNameInitials = true;
      if (placeholder.initialsSource === 'undefined' || placeholder.initialsSource == null) {
        placeholder.initialsSource = '';
      }
      if (placeholder.value === 'undefined') {
        placeholder.value = '';
      }
    }

    if (placeholder.isCustom) {
      placeholder.isCustomText = placeholder.dataType === 'Text';
      placeholder.isCustomLongText = placeholder.dataType === 'Long Text';
      placeholder.isCustomNumber = placeholder.dataType === 'Number';
      placeholder.isCustomCurrency = placeholder.dataType === 'Currency';
      placeholder.isCustomDate = placeholder.dataType === 'Date';
      placeholder.isCustomEmail = placeholder.dataType === 'Email';
      placeholder.isCustomPhone = placeholder.dataType === 'Phone';
      placeholder.isCustomBoolean = placeholder.dataType === 'Boolean';
      placeholder.isCustomPicklist = placeholder.dataType === 'Picklist';

      placeholder.checkedValue = placeholder.value === 'true';
      const opts = placeholder.picklistOptions || placeholder.options || [];
      placeholder.picklistOptions = opts.map(opt => ({
        value: opt,
        label: opt,
        selected: opt === placeholder.value
      }));
    }

    // Existing container style (keep your dashed border for non-image)
    placeholder.style = placeholder.hasImage
      ? `top:${placeholder.y}px; left:${placeholder.x}px; position:absolute;`
      : `top:${placeholder.y}px; left:${placeholder.x}px; position:absolute; border:2px dashed #0070d2; background-color:#f4f6f9;`;

    // Default text style (matches what you used in templateCreator)
    const defaultTextStyle = {
      fontFamily: 'Arial, Calibri, sans-serif',
      fontSize: '18',      // px as string
      bold: false,
      italic: false,
      underline: false,
      color: '#000000'
    };

    const ts = { ...defaultTextStyle, ...(placeholder.textStyle || {}) };
    if (placeholder.isInitials) {
      ts.align = 'right';
    }
    if (placeholder.isNameInitials) {
      ts.align = ts.align || 'center';
      if (!placeholder.textStyle?.fontSize) {
        ts.fontSize = '14';
      }
    }

    placeholder.textStyle = ts;

    const fontWeight = placeholder.customInlineStyle ? (ts.bold ? '700' : '400') : '500';
    const fontStyle = ts.italic ? 'italic' : 'normal';
    const textDecor = ts.underline ? 'underline' : 'none';
    const color = ts.color || '#000000';

    // This string will be bound directly to <input style={placeholder.inputStyle}>
    placeholder.inputStyle =
      `font-family:${ts.fontFamily};` +
      `font-size:${ts.fontSize}px;` +
      `font-weight:${fontWeight};` +
      `font-style:${fontStyle};` +
      `text-decoration:${textDecor};` +
      `text-align:${ts.align || 'left'};` +
      `color:${color};`;

    const isAddress = !placeholder.isSignature && !!placeholder.isAddress;
    let justify = 'flex-start';
    if (ts.align === 'center') {
      justify = 'center';
    } else if (ts.align === 'right') {
      justify = 'flex-end';
    }

    placeholder.textStyleCss =
      placeholder.inputStyle +
      `width:100%;` +
      `height:100%;` +
      `box-sizing:border-box;` +
      `white-space:${isAddress ? 'pre-wrap' : 'nowrap'};` +
      `word-break:${isAddress ? 'break-word' : 'normal'};` +
      `overflow:hidden;` +
      `display:flex;` +
      `align-items:center;` +
      `justify-content:${justify};`;

    const isDateType = placeholder.isDate || placeholder.isDateOfSigning;
    placeholder.displayValue = this.getFormattedDisplayValue(placeholder.value, isDateType, placeholder.dataType);

    // (Optional) for canvas convenience
    placeholder.fontFamily = ts.fontFamily;
    placeholder.fontColor = color;
    placeholder.fontWeight = fontWeight;
    placeholder.fontStyle = fontStyle;
    placeholder.underline = !!ts.underline;

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
    this._perfStart();
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
        this._perfMark('Placeholders + URL fetched');
        if (this.debugLogs) {
          console.log('Placeholders fetched:', placeholders);
          console.log('PDF URL fetched:', pdfUrl);
        }

        // Parse placeholders
        try {
          this.placeholders = JSON.parse(placeholders)
            .filter(placeholder => !placeholder.isConfig)
            .map((placeholder) => {
              if (placeholder.type === 'NameInitials' || placeholder.isNameInitials) {
                placeholder.isNameInitials = true;
                if (placeholder.initialsSource === 'undefined' || placeholder.initialsSource == null) {
                  placeholder.initialsSource = '';
                }
                if (placeholder.value === 'undefined') {
                  placeholder.value = '';
                }
              }
              return {
                ...placeholder,
                style: `top: ${placeholder.y}px; left: ${placeholder.x}px; position: absolute;`,
              };
            });
          if (this.debugLogs) {
            console.log('Parsed placeholders:', this.placeholders);
          }
        } catch (parseError) {
          console.error('Error parsing placeholders:', parseError);
          this.showToast('Error', 'Failed to parse placeholders.', 'error');
          this.isLoading = false;
          return;
        }

        // Load the PDF
        console.log('Encoded PDF URL:', pdfUrl);
        this.loadDocument(pdfUrl, { isViewMode: true });
      })
      .catch((error) => {
        console.error('Error loading record:', error);
        this.showToast('Error', 'Failed to load record.', 'error');
        this.isLoading = false;
      });
  }

  async loadDocument(pdfUrl, { useChildPdf = false, isViewMode = false } = {}) {
    this._docContext = { useChildPdf, isViewMode };
    this._pdfDocLoadScheduled = false;
    if (!this.useDocApi) {
      this._perfMark('useDocApi is false; using pdf.js');
      this.loadPdf(pdfUrl);
      return;
    }

    this._perfMark('loadDocument start');
    this.isLoading = true;

    try {
      let res;
      const tCallStart = performance.now();
      const targetRecordId = isViewMode ? (this.selectedRecordId || this.recordId) : this.recordId;
      const initialMethod = isViewMode ? 'getPagesForRecord' : 'getPagesForSigner';
      const initialContext = isViewMode ? 'getPagesForRecord (initial)' : 'getPagesForSigner (initial)';
      console.log(`[APEX-CALL] ${initialMethod} recordId=${targetRecordId}, hasToken=${Boolean(this.linkToken)}, useChildPdf=${Boolean(useChildPdf)}, isViewMode=${Boolean(isViewMode)}`);

      try {
        if (isViewMode) {
          res = await getPagesForRecord({ recordId: this.selectedRecordId || this.recordId });
        } else if (this.linkToken) {
          res = await getPagesForSigner({
            recordId: this.recordId,
            linkToken: this.linkToken,
            useChildPdf
          });
        } else {
          throw new Error('No link token available for signer getPages call');
        }
      } catch (initialErr) {
        this._logApexError(initialContext, initialErr);
        throw initialErr;
      }

      if (!res || res.statusCode !== 200 || res.error || !res.body) {
        const redactStr = (val) => String(val || '').replace(/(https?:\\?\/\\?\/[^\s\?"']+)\?[^\s"']*/g, '$1 (signed, redacted)');
        const bodySnippet = redactStr((res?.body || '').slice(0, 500));
        console.error(`[APEX-RESULT] ${initialMethod} statusCode=${res?.statusCode}, endpoint=${res?.endpoint || '(none)'}, error=${res?.error || '(none)'}, body=${bodySnippet}`);
        throw new Error(`getPages returned error: status=${res?.statusCode}, error=${res?.error}`);
      }

      let parsed = JSON.parse(res.body);
      let firstResult = parsed?.results?.[0];

      // Retry up to 5 times if status is 'processing' (2 seconds apart)
      let attempts = 0;
      while (firstResult?.status === 'processing' && attempts < 5) {
        attempts++;
        console.log(`[DOC-API] Document processing on server; polling attempt ${attempts}/5 in 2s...`);
        await new Promise((r) => setTimeout(r, 2000));

        const retryMethod = isViewMode ? 'getPagesForRecord' : 'getPagesForSigner';
        const retryContext = isViewMode ? `getPagesForRecord (retry ${attempts})` : `getPagesForSigner (retry ${attempts})`;
        console.log(`[APEX-CALL] ${retryMethod} recordId=${targetRecordId}, hasToken=${Boolean(this.linkToken)}, useChildPdf=${Boolean(useChildPdf)}, isViewMode=${Boolean(isViewMode)}`);

        try {
          res = isViewMode
            ? await getPagesForRecord({ recordId: this.selectedRecordId || this.recordId })
            : await getPagesForSigner({
              recordId: this.recordId,
              linkToken: this.linkToken,
              useChildPdf
            });
        } catch (retryErr) {
          this._logApexError(retryContext, retryErr);
          throw retryErr;
        }

        if (!res || res.statusCode !== 200 || res.error) {
          const redactStr = (val) => String(val || '').replace(/(https?:\\?\/\\?\/[^\s\?"']+)\?[^\s"']*/g, '$1 (signed, redacted)');
          const bodySnippet = redactStr((res?.body || '').slice(0, 500));
          console.error(`[APEX-RESULT] ${retryMethod} statusCode=${res?.statusCode}, endpoint=${res?.endpoint || '(none)'}, error=${res?.error || '(none)'}, body=${bodySnippet}`);
        }

        if (res && res.statusCode === 200 && res.body) {
          parsed = JSON.parse(res.body);
          firstResult = parsed?.results?.[0];
        }
      }

      if (!firstResult || !Array.isArray(firstResult.pages) || firstResult.pages.length === 0) {
        throw new Error('No pages returned from pages API');
      }

      this._perfMark(`Apex getPages (/tsign/pages, cached=${!!firstResult.cached})`);
      this._usingServerPages = true;

      // 1. Display server pages immediately
      this.showServerPages(firstResult.pages);
      this._perfMark('Pages data built (loadServerPages)');

      if (this.useStampApi) {
        // Under useStampApi, don't start loadPdfDocumentOnly right away.
        // It will be started lazily in the background after page 1 & thumbnails settle,
        // or on-demand by updatePlaceholderWithCanvas if unstyled text probe is needed.
        try {
          await this._prefillSavedSignature();
          this._perfMark('Saved signature prefilled');
        } catch (e) {
          // ignore
        }
      } else {
        // 2. Background PDF engine load (no page rendering)
        this._pdfDocReadySettled = false;
        this._pdfDocReady = this.loadPdfDocumentOnly(pdfUrl).finally(() => {
          this._pdfDocReadySettled = true;
          this._checkImagesSettled();
        });

        // 3. Wait for PDF engine to finish loading before prefilling signature
        try {
          await this._pdfDocReady;
          await this._prefillSavedSignature();
          this._perfMark('Saved signature prefilled');
        } catch (docErr) {
          this._perfMark(`PDF engine failed: ${this._pdfDocError || docErr?.message || 'unknown'}`);
        }
      }

    } catch (err) {
      this._logApexError('loadDocument', err);
      console.warn('[DOC-API] Server pages loading failed; falling back to pdf.js:', err);
      this._usingServerPages = false;
      this._perfMark('pdf.js fallback used');
      this.loadPdf(pdfUrl);
    } finally {
      this.isLoading = false;
      this._uiLoadFileName();
    }
  }

  showServerPages(pages) {
    const containerEl = this.template.querySelector('.pdf-viewer-container');
    let targetCssW = 1024;
    if (containerEl && containerEl.clientWidth > 100) {
      targetCssW = Math.min(1024, containerEl.clientWidth - 48);
    }

    this._pageDimensionsCache = new Map();
    this.totalPages = pages.length;
    this.currentPage = 1;

    this.pagesData = pages.map((p) => {
      const pageNum = Number(p.page);
      const widthPt = Number(p.widthPt) || 612;
      const heightPt = Number(p.heightPt) || 792;
      this._pageDimensionsCache.set(pageNum, { w: widthPt, h: heightPt });
      const cssW = Math.round(targetCssW);
      const cssH = Math.round(targetCssW * (heightPt / widthPt));
      return {
        pageNumber: pageNum,
        imageSrc: p.imageUrl,
        pageLabel: `Page ${pageNum} of ${pages.length}`,
        width: cssW,
        height: cssH,
        containerStyle: `width: ${cssW}px; height: ${cssH}px; min-height: ${cssH}px;`
      };
    });

    this._pagePt = this._pageDimensionsCache.get(1);
    this.imageSrc = this.pagesData[0]?.imageSrc;

    this.thumbnails = pages.map((p) => {
      const pageNum = Number(p.page);
      const isActive = pageNum === 1;
      return {
        page: pageNum,
        src: p.thumbUrl || p.imageUrl,
        isActive,
        className: isActive ? 'thumbnail-item active' : 'thumbnail-item'
      };
    });

    window.requestAnimationFrame(() => {
      this.setupIntersectionObserver();
      this._updateAllPlaceholderStyles();
    });
    this._refreshGuide();
  }

  _logApexError(context, err) {
    try {
      const body = err?.body;
      const redact = (val) => {
        if (!val) return '(none)';
        const str = typeof val === 'string' ? val : JSON.stringify(val);
        return str.replace(/(https?:\\?\/\\?\/[^\s\?"']+)\?[^\s"']*/g, '$1 (signed, redacted)');
      };
      const rawBodyStr = JSON.stringify(body || {});
      const lines = [
        `[APEX-ERROR] ${context}`,
        `  status        : ${err?.status} ${err?.statusText || ''}`,
        `  message       : ${redact(body?.message || err?.message)}`,
        `  exceptionType : ${body?.exceptionType || '(none)'}`,
        `  stackTrace    : ${redact(body?.stackTrace)}`,
        `  isUserDefined : ${body?.isUserDefinedException}`,
        `  pageErrors    : ${redact(body?.pageErrors || [])}`,
        `  fieldErrors   : ${redact(body?.fieldErrors || {})}`,
        `  rawBody       : ${redact(rawBodyStr.slice(0, 2000))}`
      ];
      console.error(lines.join('\n'));
    } catch (e) {
      console.error(`[APEX-ERROR] ${context} (could not format error)`, String(err));
    }
  }

  async _getSignedPdfUrl() {
    const { useChildPdf = false, isViewMode = false } = this._docContext || {};
    const method = isViewMode ? 'getPdfDownloadForRecord' : 'getPdfDownloadForSigner';
    const targetRecordId = isViewMode ? (this.selectedRecordId || this.recordId) : this.recordId;
    console.log(`[APEX-CALL] ${method} recordId=${targetRecordId}, hasToken=${Boolean(this.linkToken)}, useChildPdf=${Boolean(useChildPdf)}, isViewMode=${Boolean(isViewMode)}`);

    let res;
    try {
      res = isViewMode
        ? await getPdfDownloadForRecord({ recordId: this.selectedRecordId || this.recordId })
        : await getPdfDownloadForSigner({ recordId: this.recordId, linkToken: this.linkToken, useChildPdf });
    } catch (err) {
      this._logApexError(method, err);
      throw err;
    }

    if (!res || res.statusCode !== 200 || res.error || !res.body) {
      const redactStr = (val) => String(val || '').replace(/(https?:\\?\/\\?\/[^\s\?"']+)\?[^\s"']*/g, '$1 (signed, redacted)');
      const bodySnippet = redactStr((res?.body || '').slice(0, 500));
      console.error(`[APEX-RESULT] ${method} statusCode=${res?.statusCode}, endpoint=${res?.endpoint || '(none)'}, error=${res?.error || '(none)'}, body=${bodySnippet}`);
      throw new Error(res?.error || 'download link failed');
    }
    const r = JSON.parse(res.body)?.results?.[0] || {};
    const url = r.cdnDownloadUrl || r.downloadUrl;
    if (!url) {
      throw new Error(r.error || 'no download link returned');
    }
    return url;
  }

  _redactUrl(url) {
    if (!url) return url;
    return url.replace(/(\?[^#]*)/, '?redacted');
  }

  handleRetryDocEngine() {
    this._pdfDocFailed = false;
    this._pdfDocError = '';
    this._pdfDocReadySettled = false;
    const pdfUrl = this.originalPdfReference || this.pdfUrl;
    this._pdfDocReady = this.loadPdfDocumentOnly(pdfUrl)
      .then(async () => {
        await this._prefillSavedSignature();
      })
      .catch((err) => {
        const { isViewMode = false } = this._docContext || {};
        const context = isViewMode ? 'getPdfDownloadForRecord (handleRetryDocEngine)' : 'getPdfDownloadForSigner (handleRetryDocEngine)';
        this._logApexError(context, err);
        console.warn('[DOC-API] Retry doc engine failed:', err);
      })
      .finally(() => {
        this._pdfDocReadySettled = true;
        this._checkImagesSettled();
      });
  }

  _ensurePdfDoc() {
    if (!this._pdfDocReady) {
      this._pdfDocReadySettled = false;
      const pdfUrl = this.originalPdfReference || this.pdfUrl;
      this._pdfDocReady = this.loadPdfDocumentOnly(pdfUrl).finally(() => {
        this._pdfDocReadySettled = true;
        this._checkImagesSettled();
      });
    }
    return this._pdfDocReady;
  }

  async loadPdfDocumentOnly(pdfUrl) {
    const t0 = performance.now();
    this._pdfDocFailed = false;
    this._pdfDocError = '';
    try {
      const signedUrl = await this._getSignedPdfUrl();
      console.log('[DOC-API] Fetching signed PDF from:', this._redactUrl(signedUrl));

      const res = await fetch(signedUrl, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const buffer = await res.arrayBuffer();
      const bytes = buffer.byteLength;
      const loadingTask = window.pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        isEvalSupported: false
      });

      const pdf = await loadingTask.promise;
      this.pdfDoc = pdf;

      if (this.totalPages > 0 && pdf.numPages !== this.totalPages) {
        console.warn(`[DOC-API] Warning: server pages count (${this.totalPages}) does not match pdfDoc.numPages (${pdf.numPages})`);
      }

      const elapsed = Math.round(performance.now() - t0);
      this._perfMark(`PDF engine ready (${this._fmtBytes(bytes)}, ${elapsed} ms)`);
      if (this.useStampApi && this._perfEnded) {
        console.log(`[TIMING] PDF engine ready (${this._fmtBytes(bytes)}, ${elapsed} ms)`);
      }
      return pdf;
    } catch (err) {
      const { isViewMode = false } = this._docContext || {};
      const context = isViewMode ? 'getPdfDownloadForRecord (loadPdfDocumentOnly)' : 'getPdfDownloadForSigner (loadPdfDocumentOnly)';
      this._logApexError(context, err);
      this.pdfDoc = null;
      this._pdfDocFailed = true;
      this._pdfDocError = err?.message || String(err);
      if (this.useStampApi && this._perfEnded) {
        console.warn(`[TIMING] PDF engine failed: ${this._pdfDocError}`);
      }
      console.warn('[DOC-API] Failed to load background PDF document:', err);
      throw err;
    }
  }

  handlePageImageLoad(event) {
    const pageNum = Number(event.target?.dataset?.page || event.target?.dataset?.pageNumber);
    if (pageNum) {
      if (pageNum === 1 && !this._pageImagesLoaded.has(1)) {
        this._perfMark('Page 1 image loaded');
      }
      this._pageImagesLoaded.add(pageNum);
      this._checkImagesSettled();
    }
  }

  handleThumbnailImageLoad(event) {
    const pageNum = Number(event.target?.dataset?.page);
    if (pageNum) {
      this._thumbImagesLoaded.add(pageNum);
      this._checkImagesSettled();
    }
  }

  handleThumbnailImageError(event) {
    const pageNum = Number(event.target?.dataset?.page);
    if (pageNum) {
      this._thumbImagesFailed.add(pageNum);
      this._checkImagesSettled();
    }
  }

  async handlePageImageError(event) {
    const pageNum = Number(event.target?.dataset?.page || event.target?.dataset?.pageNumber);
    if (pageNum) {
      this._pageImagesFailed.add(pageNum);
      this._checkImagesSettled();
    }
    console.warn(`[DOC-API] Image load error for page ${pageNum || 'unknown'}`);

    if (!this._imageRefreshAttempted && this._usingServerPages) {
      this._imageRefreshAttempted = true;
      console.log('[DOC-API] Attempting token refresh via Apex getPages...');
      const { useChildPdf = false, isViewMode = false } = this._docContext || {};
      const targetRecordId = isViewMode ? (this.selectedRecordId || this.recordId) : this.recordId;
      const method = isViewMode ? 'getPagesForRecord' : 'getPagesForSigner';
      console.log(`[APEX-CALL] ${method} recordId=${targetRecordId}, hasToken=${Boolean(this.linkToken)}, useChildPdf=${Boolean(useChildPdf)}, isViewMode=${Boolean(isViewMode)}`);

      try {
        const res = isViewMode
          ? await getPagesForRecord({ recordId: this.selectedRecordId || this.recordId })
          : await getPagesForSigner({
            recordId: this.recordId,
            linkToken: this.linkToken,
            useChildPdf
          });

        if (!res || res.statusCode !== 200 || res.error) {
          const redactStr = (val) => String(val || '').replace(/(https?:\\?\/\\?\/[^\s\?"']+)\?[^\s"']*/g, '$1 (signed, redacted)');
          const bodySnippet = redactStr((res?.body || '').slice(0, 500));
          console.error(`[APEX-RESULT] ${method} statusCode=${res?.statusCode}, endpoint=${res?.endpoint || '(none)'}, error=${res?.error || '(none)'}, body=${bodySnippet}`);
        }

        if (res && res.statusCode === 200 && res.body) {
          const parsed = JSON.parse(res.body);
          const firstResult = parsed?.results?.[0];
          if (firstResult && Array.isArray(firstResult.pages) && firstResult.pages.length > 0) {
            console.log('[DOC-API] Successfully refreshed image URLs in place');
            const freshMap = new Map();
            firstResult.pages.forEach((p) => freshMap.set(Number(p.page), p));

            this.pagesData = this.pagesData.map((p) => {
              const fresh = freshMap.get(p.pageNumber);
              return fresh ? { ...p, imageSrc: fresh.imageUrl } : p;
            });
            if (this.pagesData.length > 0) {
              this.imageSrc = this.pagesData[0].imageSrc;
            }

            this.thumbnails = this.thumbnails.map((t) => {
              const fresh = freshMap.get(t.page);
              return fresh ? { ...t, src: fresh.thumbUrl || fresh.imageUrl } : t;
            });
            return;
          }
        }
      } catch (err) {
        this._logApexError('getPages refresh (image error)', err);
        console.warn('[DOC-API] Refresh attempt failed:', err);
      }
    }

    // Second failure or refresh failed: fallback to client-side pdf.js
    if (this._usingServerPages) {
      console.warn('[DOC-API] Falling back to client-side pdf.js rendering after image load failure');
      this._usingServerPages = false;
      this.loadPdf(this.originalPdfReference || this.pdfUrl);
    }
  }

  _perfStart() {
    this._perfMarks = [{ label: 'Start', t: performance.now() }];
    this._perfEnded = false;
    this._pageImagesLoaded.clear();
    this._pageImagesFailed.clear();
    this._thumbImagesLoaded.clear();
    this._thumbImagesFailed.clear();
    this._thumbsSettledMarked = false;
    this._pagesSettledMarked = false;
    this._pdfDocReadySettled = false;

    if (this._perfSafetyTimeout) {
      clearTimeout(this._perfSafetyTimeout);
    }
    this._perfSafetyTimeout = setTimeout(() => {
      if (!this._perfEnded) {
        this._checkImagesSettled(true);
      }
    }, 20000);
  }

  _perfMark(label) {
    if (!TIMING_LOG) return;
    if (!this._perfMarks || this._perfMarks.length === 0) {
      this._perfMarks = [{ label: 'Start', t: performance.now() }];
    }
    this._perfMarks.push({ label, t: performance.now() });
  }

  _checkImagesSettled(force = false) {
    if (this._perfEnded || !this._usingServerPages || this.totalPages <= 0) {
      if (this._perfEnded && this._usingServerPages && this.totalPages > 0) {
        const total = this.totalPages;
        const pagesCount = this._pageImagesLoaded.size + this._pageImagesFailed.size;
        if (pagesCount >= total && !this._pagesSettledMarked) {
          this._pagesSettledMarked = true;
          const doneMark = this._perfMarks.find((m) => m.label === 'Done');
          const elapsed = doneMark ? Math.round(performance.now() - doneMark.t) : 0;
          console.log(`[TIMING] All page images loaded later (+${elapsed} ms after Done)`);
        }
      }
      return;
    }

    const total = this.totalPages;
    const pagesOk = this._pageImagesLoaded.size;
    const pagesFail = this._pageImagesFailed.size;
    const thumbsOk = this._thumbImagesLoaded.size;
    const thumbsFail = this._thumbImagesFailed.size;

    const allThumbsSettled = (thumbsOk + thumbsFail >= total);
    const page1Settled = this._pageImagesLoaded.has(1) || this._pageImagesFailed.has(1);

    if (allThumbsSettled && !this._thumbsSettledMarked) {
      this._thumbsSettledMarked = true;
      this._perfMark(`All thumbnails loaded (${total}: ok=${thumbsOk}, failed=${thumbsFail})`);
    }

    if (this.useStampApi && page1Settled && allThumbsSettled && !this._pdfDocLoadScheduled) {
      this._pdfDocLoadScheduled = true;
      const scheduleFn = (typeof window !== 'undefined' && window.requestIdleCallback)
        ? window.requestIdleCallback
        : (cb) => setTimeout(cb, 1500);
      scheduleFn(() => {
        this._ensurePdfDoc()?.catch(() => { });
      });
    }

    const isReadyToEnd = this.useStampApi
      ? (page1Settled && allThumbsSettled)
      : (page1Settled && allThumbsSettled && this._pdfDocReadySettled);

    if (force) {
      if (!this._thumbsSettledMarked) {
        this._thumbsSettledMarked = true;
        this._perfMark(`Thumbnails loaded (${thumbsOk}/${total}, deferred=${Math.max(0, total - thumbsOk - thumbsFail)})`);
      }
      const deferredPages = Math.max(0, total - (pagesOk + pagesFail));
      this._perfMark(`Visible pages loaded (${pagesOk}/${total}, deferred=${deferredPages})`);
      this._perfEnd('Done');
    } else if (isReadyToEnd) {
      const deferredPages = Math.max(0, total - (pagesOk + pagesFail));
      this._perfMark(`Visible pages loaded (${pagesOk}/${total}, deferred=${deferredPages})`);
      this._perfEnd('Done');
    }
  }

  _perfEnd(doneLabel = 'Done') {
    if (this._perfEnded) return;
    this._perfEnded = true;
    if (this._perfSafetyTimeout) {
      clearTimeout(this._perfSafetyTimeout);
      this._perfSafetyTimeout = null;
    }
    this._perfMark(doneLabel);

    if (!TIMING_LOG || !this._perfMarks || this._perfMarks.length === 0) return;

    const t0 = this._perfMarks[0].t;
    let prev = t0;
    const lines = ['[TIMING] SIGNER → DISPLAY'];
    for (let i = 1; i < this._perfMarks.length; i++) {
      const m = this._perfMarks[i];
      const stepMs = Math.round(m.t - prev);
      const totalMs = Math.round(m.t - t0);
      prev = m.t;
      const label = m.label.padEnd(48, ' ');
      const stepStr = `+ ${stepMs}`.padStart(8, ' ') + ' ms';
      const totStr = `(total ${totalMs} ms)`.padStart(18, ' ');
      lines.push(`${label} ${stepStr}   ${totStr}`);
    }
    console.log(lines.join('\n'));
  }

  _fmtBytes(bytes) {
    if (bytes == null || isNaN(bytes)) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  async loadPdf(pdfUrl) {
    console.log('Initializing PDF.js...');
    this._usingServerPages = false;
    this.isLoading = true;

    let targetUrl = pdfUrl;
    let hasSignedUrl = false;
    if (targetUrl && targetUrl.includes('tsignapp.s3')) {
      try {
        targetUrl = await this._getSignedPdfUrl();
        hasSignedUrl = true;
      } catch (err) {
        const { isViewMode = false } = this._docContext || {};
        const context = isViewMode ? 'getPdfDownloadForRecord (loadPdf fallback)' : 'getPdfDownloadForSigner (loadPdf fallback)';
        this._logApexError(context, err);
        console.warn('[DOC-API] Failed to get signed URL for loadPdf fallback:', err);
      }
    }

    if (!hasSignedUrl) {
      console.warn('[DOC-API] Falling back to pdf.js with PLAIN url (no signed link available)');
    }

    let url;
    try { url = encodeURI(decodeURI(targetUrl)); } catch (e) { url = targetUrl; }
    console.log('Encoded PDF URL:', this._redactUrl(url));

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
        return this.renderAllPages();
      })
      .then(async () => {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await this._prefillSavedSignature();
      })
      .catch((error) => {
        console.error('Error loading PDF:', error);
        this.showToast('Error', 'Failed to load PDF.', 'error');
      })
      .finally(() => {
        this.isLoading = false;
        this._uiLoadFileName(); // NEW UI: file name for the header (display only)
        this._perfEnd('Done (pdf.js)');
      });
  }


  // put this near your component fields
  DEBUG = true;
  _log(...args) { if (this.DEBUG) console.log('[LWC-PDF]', ...args); }
  _warn(...args) { if (this.DEBUG) console.warn('[LWC-PDF]', ...args); }
  _time(label) { if (this.DEBUG) console.time(label); }
  _timeEnd(label) { if (this.DEBUG) console.timeEnd(label); }


  async renderAllPages() {
    if (!this.pdfDoc || this.totalPages <= 0) return;

    const t0 = performance.now();
    this._log('renderAllPages:start', { totalPages: this.totalPages });
    this.isLoading = true;

    try {
      const containerEl = this.template.querySelector('.pdf-viewer-container');
      let targetCssW = 1024;
      if (containerEl && containerEl.clientWidth > 100) {
        targetCssW = Math.min(1024, containerEl.clientWidth - 48);
      }

      if (!this._pageDimensionsCache) {
        this._pageDimensionsCache = new Map();
      }

      const pages = [];
      const deviceDpr = window.devicePixelRatio || 1;
      const dpr = Math.min(deviceDpr, 1.25);

      for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
        const page = await this.pdfDoc.getPage(pageNum);
        const vp1 = page.getViewport({ scale: 1 });
        const pageDim = { w: vp1.width, h: vp1.height };
        this._pageDimensionsCache.set(pageNum, pageDim);
        if (pageNum === 1) {
          this._pagePt = pageDim;
        }

        const scale = targetCssW / vp1.width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: false });

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.round(viewport.width)}px`;
        canvas.style.height = `${Math.round(viewport.height)}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        await page.render({ canvasContext: ctx, viewport }).promise;

        const dataUrl = await new Promise(resolve => {
          canvas.toBlob(blob => {
            if (!blob) {
              resolve(canvas.toDataURL('image/png'));
              return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          }, 'image/jpeg', 0.92);
        });

        const cssW = Math.round(viewport.width);
        const cssH = Math.round(viewport.height);

        pages.push({
          pageNumber: pageNum,
          imageSrc: dataUrl,
          pageLabel: `Page ${pageNum} of ${this.totalPages}`,
          width: cssW,
          height: cssH,
          containerStyle: `width: ${cssW}px; height: ${cssH}px; min-height: ${cssH}px;`
        });
      }

      this.pagesData = pages;
      if (pages.length > 0) {
        this.imageSrc = pages[0].imageSrc;
      }

      window.requestAnimationFrame(() => {
        this.setupIntersectionObserver();
        this._updateAllPlaceholderStyles();
        const t1 = performance.now();
        this._log('renderAllPages:end', { ms: Math.round(t1 - t0) });
      });
      this._refreshGuide();
    } catch (error) {
      console.error('Error rendering all pages:', error);
      this.showToast('Error', 'Failed to render PDF pages.', 'error');
    } finally {
      this.isLoading = false;
    }
  }


  setupIntersectionObserver() {
    if (this._intersectionObserver) {
      this._intersectionObserver.disconnect();
      this._intersectionObserver = null;
    }

    const rootEl = this.template.querySelector('.pdf-viewer-container') || null;

    const options = {
      root: rootEl,
      rootMargin: '0px',
      threshold: [0.1, 0.25, 0.5, 0.75, 0.9]
    };

    this._pageVisibilityMap = new Map();

    this._intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const pageNum = parseInt(entry.target.dataset.pageNumber, 10);
        if (pageNum) {
          this._pageVisibilityMap.set(pageNum, entry.intersectionRatio);
        }
      });

      let bestPage = this.currentPage;
      let maxRatio = -1;

      this._pageVisibilityMap.forEach((ratio, pageNum) => {
        if (ratio > maxRatio && ratio > 0.15) {
          maxRatio = ratio;
          bestPage = pageNum;
        }
      });

      if (bestPage && bestPage !== this.currentPage) {
        this.currentPage = bestPage;
        this.syncThumbnailUI();
      }
    }, options);

    const pageContainers = this.template.querySelectorAll('.image-container[data-page-number]');
    pageContainers.forEach(container => {
      this._intersectionObserver.observe(container);
    });
  }

  async renderPageAsImage(pageNumber) {
    const t0 = performance.now();
    this._log('renderPageAsImage:start', { pageNumber });

    const existing = this.pagesData?.find(p => p.pageNumber === pageNumber);
    if (existing) {
      this.imageSrc = existing.imageSrc;
      this._pagePt = this.getPageDimensions(pageNumber);
      return existing.imageSrc;
    }

    try {
      this._time('getPage');
      const page = await this.pdfDoc.getPage(pageNumber);
      this._timeEnd('getPage');

      const vp1 = page.getViewport({ scale: 1 });
      this._pagePt = { w: vp1.width, h: vp1.height };
      if (!this._pageDimensionsCache) {
        this._pageDimensionsCache = new Map();
      }
      this._pageDimensionsCache.set(pageNumber, this._pagePt);
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

      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.round(viewport.width)}px`;
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
      this._previewPx = { w: canvas.width, h: canvas.height };

      // async encode (JPEG)
      this._time('encode:toBlob+FileReader');
      const dataUrl = await new Promise(resolve => {
        canvas.toBlob(blob => {
          if (!blob) {
            this._warn('toBlob produced null blob; falling back to PNG dataURL');
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
      return dataUrl;
    } catch (error) {
      console.error(`Error rendering page ${pageNumber}:`, error);
      this.showToast('Error', `Failed to render page ${pageNumber}.`, 'error');
    }
  }

  _normalizePlaceholderPts(ph) {
    if (!ph || this._pagePt == null) return ph;

    const pageW = this._pagePt.w, pageH = this._pagePt.h;

    const FALLBACK_W = 1024;
    const FALLBACK_H = 1448;
    const rx = pageW / FALLBACK_W;
    const ry = pageH / FALLBACK_H;

    let updated = { ...ph };

    // Calculate wPt / hPt from w / h if missing
    if (updated.wPt == null && updated.w != null) {
      updated.wPt = updated.w * rx;
    }
    if (updated.hPt == null && updated.h != null) {
      updated.hPt = updated.h * ry;
    }

    // Handle out of bounds pseudo coords for xPt / yPt
    if (updated.xPt != null && updated.yPt != null) {
      const looksOutOfBounds =
        updated.xPt > pageW * 1.001 || updated.yPt > pageH * 1.001 || updated.xPt < 0 || updated.yPt < 0;
      if (looksOutOfBounds) {
        updated.xPt = updated.xPt * rx;
        updated.yPt = updated.yPt * ry;
      }
    }

    if (updated.isNameInitials || updated.type === 'NameInitials') {
      updated.isNameInitials = true;
      if (updated.initialsSource === 'undefined' || updated.initialsSource == null) {
        updated.initialsSource = '';
      }
      if (updated.value === 'undefined') {
        updated.value = '';
      }
    }

    return updated;
  }

  _updateAllPlaceholderStyles() {
    const t0 = performance.now();
    let recomputed = 0;

    // Build a map of page rects for each page present in DOM
    const pageRects = new Map();
    if (this.pagesData && this.pagesData.length > 0) {
      this.pagesData.forEach(p => {
        const container = this.template.querySelector(`.image-container[data-page-number="${p.pageNumber}"]`);
        const img = container ? (container.querySelector('img.pdf-image') || container.querySelector('img')) : null;
        if (img) {
          const r = img.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            pageRects.set(p.pageNumber, r);
          } else if (p.width > 0 && p.height > 0) {
            pageRects.set(p.pageNumber, { width: p.width, height: p.height, left: 0, top: 0 });
          }
        } else if (p.width > 0 && p.height > 0) {
          pageRects.set(p.pageNumber, { width: p.width, height: p.height, left: 0, top: 0 });
        }
      });
    }

    // If no pagesData yet, fallback to single image container if any
    if (pageRects.size === 0) {
      const singleImg = this.template.querySelector('.image-container img');
      if (singleImg) {
        const r = singleImg.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          pageRects.set(this.currentPage || 1, r);
        }
      }
    }

    if (pageRects.size === 0) {
      this._log('_updateAllPlaceholderStyles:skip - no page rects found');
      return;
    }

    // Normalize flat list
    const next = (this.placeholders || []).map(ph => {
      let normalized = this._normalizePlaceholderPts(ph);
      if (normalized && !normalized.isSignature) {
        normalized.maxChars = this.getPlaceholderMaxChars(normalized);
      }
      normalized.showCustomStatic = normalized.hasImage && normalized.dataType !== 'Boolean';
      const phPage = Number(normalized.page) || 1;
      const rect = pageRects.get(phPage) || pageRects.get(1);
      if (rect) {
        recomputed++;
        const style = this.getPlaceholderStyle(normalized, rect);
        return { ...normalized, style };
      }
      return normalized;
    });
    this.placeholders = next;

    // Normalize paged map
    const updatedByPage = { ...(this.placeholdersByPage || {}) };
    const allPages = new Set([
      ...Object.keys(updatedByPage).map(Number),
      ...Array.from(pageRects.keys()),
      ...(this.placeholders || []).map(p => Number(p.page))
    ]);

    allPages.forEach(pageNum => {
      if (!pageNum) return;
      const rect = pageRects.get(pageNum) || pageRects.get(1);
      const existingList = updatedByPage[pageNum] || (this.placeholders || []).filter(p => Number(p.page) === pageNum);
      const pageList = existingList.map(ph => {
        let normalized = this._normalizePlaceholderPts(ph);
        if (normalized && !normalized.isSignature) {
          normalized.maxChars = this.getPlaceholderMaxChars(normalized);
        }
        normalized.showCustomStatic = normalized.hasImage && normalized.dataType !== 'Boolean';
        if (rect) {
          return { ...normalized, style: this.getPlaceholderStyle(normalized, rect) };
        }
        return normalized;
      });
      updatedByPage[pageNum] = pageList;
    });
    this.placeholdersByPage = updatedByPage;

    const t1 = performance.now();
    this._log('_updateAllPlaceholderStyles:end', {
      recomputed,
      totalPagesConfigured: allPages.size,
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
      const target = this.template.querySelector(`.image-container[data-page-number="${next}"]`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        this.currentPage = next;
        this.syncThumbnailUI();
      }
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
      const target = this.template.querySelector(`.image-container[data-page-number="${next}"]`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        this.currentPage = next;
        this.syncThumbnailUI();
      }
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
      this._refreshGuide();
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
    const phPage = placeholder.page || this.currentPage || 1;
    const imgRect = rectOpt ||
      this.template.querySelector(`.image-container[data-page-number="${phPage}"] img`)?.getBoundingClientRect() ||
      this.template.querySelector('.image-container img')?.getBoundingClientRect();
    const pagePt = this.getPageDimensions(phPage);
    if (!imgRect || !pagePt) {
      return 'position:absolute; top:0; left:0;'; // safe fallback
    }

    // Scale from page points → current CSS pixels
    const scaleX = imgRect.width / pagePt.w;
    const scaleY = imgRect.height / pagePt.h;

    // Positions: if you already store x/y in page points, use them; else derive once
    // (Fallback for your old 1024×1448 coords)
    const xPt = (placeholder.xPt != null)
      ? placeholder.xPt
      : (placeholder.x != null ? (placeholder.x / 1024) * pagePt.w : 0);
    const yPt = (placeholder.yPt != null)
      ? placeholder.yPt
      : (placeholder.y != null ? (placeholder.y / 1448) * pagePt.h : 0);

    const leftCss = Math.round(xPt * scaleX);
    const topCss = Math.round(yPt * scaleY);

    const isSig = placeholder.isSignature || placeholder.type === 'Signature';
    const hasRenderedImage = !!(placeholder.hasImage || placeholder.canvasData || placeholder.base64Data);

    let style = `position:absolute; left:${leftCss}px; top:${topCss}px;`;

    if (isSig) {
      style += ' border:none; background:transparent; min-width:unset; min-height:unset; width:auto; height:auto;';
      return style;
    }

    // One-line text fields: width of the typed text once typing starts; before that, width of the label
    const autoGrowField = this._isAutoGrowField(placeholder);
    const isAutoGrow = autoGrowField && (placeholder.autoWPt != null || !hasRenderedImage);
    const wCss = (autoGrowField && placeholder.autoWPt != null) ? Math.round(placeholder.autoWPt * scaleX)
      : (autoGrowField && !hasRenderedImage) ? this._getLabelFitWidthCss(placeholder)
        : (hasRenderedImage && placeholder.wPt != null) ? Math.round(placeholder.wPt * scaleX)
          : (hasRenderedImage && placeholder.cssW != null) ? Math.round(placeholder.cssW) : undefined;
    const hCss = (hasRenderedImage && placeholder.hPt != null) ? Math.round(placeholder.hPt * scaleY)
      : (hasRenderedImage && placeholder.cssH != null) ? Math.round(placeholder.cssH) : undefined;

    if (wCss != null) {
      style += ` width:${wCss}px;`;
    }
    if (isAutoGrow) {
      style += ' min-width:0; max-width:none;';
    }

    const isMultiline =
      placeholder.isAddress ||
      placeholder.isCustomAddress ||
      placeholder.isTextArea ||
      placeholder.isCustomTextArea;

    if (!isMultiline && hCss != null) {
      style += ` height:${hCss}px;`;
    } else if (isMultiline) {
      style += ` height:auto; min-height:${hCss || 37}px;`;
    }

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

  get signatureImageContainerClass() {
    return 'signature-image-container signature-review';
  }

  get isApplyChoiceAll() {
    return this.applySignatureChoice === 'all';
  }

  get isApplyChoiceNone() {
    return this.applySignatureChoice === 'none';
  }

  // Called after a signature is saved (Draw / Type / Upload). Asks only once, and only
  // when the recipient has 2+ signature fields with at least one other still empty.
  _promptApplySignatureToAll(sourceId, image) {
    if (this.signatureApplyMode) return;
    const sigFields = (this.placeholders || []).filter(p => p.isSignature);
    if (sigFields.length < 2) return;
    if (!sigFields.some(p => p.id !== sourceId && !p.hasImage)) return;

    this._applySignatureSourceId = sourceId;
    this._applySignatureImage = image;
    this.applySignatureChoice = 'all';
    this.isApplySignaturePopupVisible = true;
  }

  handleApplySignatureChoice(event) {
    this.applySignatureChoice = event.target.value;
  }

  // Cancel behaves like "No, keep signing individually"
  handleApplySignatureCancel() {
    this.signatureApplyMode = 'none';
    this.isApplySignaturePopupVisible = false;
    this._refreshGuide();
  }

  async handleApplySignatureConfirm() {
    const choice = this.applySignatureChoice;
    this.signatureApplyMode = choice;
    this.isApplySignaturePopupVisible = false;
    if (choice === 'none') {
      this._refreshGuide();
      return;
    }
    await this._applySignatureToEmptyFields(this._applySignatureImage, this._applySignatureSourceId);
  }

  // Fill every empty signature field of the current recipient with the same signed image
  async _applySignatureToEmptyFields(image, sourceId, options = {}) {
    if (!image) return;
    this._stampState = null;
    const targetIds = new Set(
      (this.placeholders || [])
        .filter(p => p.isSignature && p.id !== sourceId && !p.hasImage)
        .map(p => p.id)
    );
    if (targetIds.size === 0) return;

    const sigFields = {
      hasImage: true,
      isSignature: true,
      isPlaceholder: false,
      imageSrc: image,
      signatureDataUrl: image,
      SignatureSrc: image
    };

    this.placeholders = this.placeholders.map(p => (targetIds.has(p.id) ? { ...p, ...sigFields } : p));
    const byPage = { ...this.placeholdersByPage };
    Object.keys(byPage).forEach(pg => {
      byPage[pg] = (byPage[pg] || []).map(p => (targetIds.has(p.id) ? { ...p, ...sigFields } : p));
    });
    this.placeholdersByPage = byPage;

    // Same embed pipeline as a manual signature; sequential so each update sees the previous one
    for (const id of targetIds) {
      const ph = this.placeholders.find(p => p.id === id);
      if (ph) await this.updatePlaceholderWithCanvas(ph, 'SignatureSrc', null);
    }

    if (!options?.silent) {
      this.showToast('Success', `Signature applied to ${targetIds.size} more signature field(s).`, 'success');
    }
    this._refreshGuide();
  }

  // Prefill the recipient's saved default signature if available
  async _prefillSavedSignature() {
    if (this._savedSignatureApplied || !this._savedSignaturePromise) {
      return;
    }
    if (this.isLinkInvalid || this.isLinkExpired || this.isAlreadySubmitted || this.showSuccessScreen) {
      console.log('[SAVED-SIG] skipped', 'link state invalid or submitted');
      return;
    }
    const emptySigFields = (this.placeholders || []).filter(p => p.isSignature && !p.hasImage);
    if (!emptySigFields.length) {
      console.log('[SAVED-SIG] skipped', 'no empty signature fields');
      return;
    }

    try {
      const res = await this._savedSignaturePromise;
      if (!res || !res.found || !res.imageUrl) {
        console.log('[SAVED-SIG] skipped', 'no default signature found');
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      // OLD CODE: extra query param breaks the signed URL signature
      // const cacheBustUrl = res.imageUrl + (res.imageUrl.includes('?') ? '&' : '?') + 'cb=' + Date.now();
      // NEW CODE: signed URL is already unique per request, use it as-is
      const cacheBustUrl = res.imageUrl;

      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          img.onload = null;
          img.onerror = null;
          reject(new Error('timeout'));
        }, 10000);

        img.onload = () => {
          clearTimeout(timer);
          resolve();
        };
        img.onerror = (err) => {
          clearTimeout(timer);
          reject(err);
        };
        img.src = cacheBustUrl;
      });

      if (!img.naturalWidth || !img.naturalHeight) {
        console.log('[SAVED-SIG] skipped', 'blank image dimensions');
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      let rawDataUrl;
      try {
        rawDataUrl = canvas.toDataURL('image/png');
      } catch (e) {
        console.log('[SAVED-SIG] skipped', 'SecurityError or canvas tainted');
        return;
      }

      if (!rawDataUrl || rawDataUrl === 'data:,' || rawDataUrl.length < 50) {
        console.log('[SAVED-SIG] skipped', 'blank image data');
        return;
      }

      const firstEmptyPh = (this.placeholders || []).find(p => p.isSignature && !p.hasImage);
      if (!firstEmptyPh) {
        console.log('[SAVED-SIG] skipped', 'no empty signature field found');
        return;
      }

      // NEW CODE: under useStampApi the PDF engine loads lazily; without it getPageDimensions()
      // falls back to 1024x1448 instead of real page points (~595x842), so the field geometry
      // is saved ~1.7x too big. Wait for the real page size before measuring.
      try {
        await this._ensurePdfDoc();
      } catch (e) {
        // keep fallback size if pdf.js fails
      }

      const boxPt = this._getSignatureBoxPt(firstEmptyPh);
      const stamp = await this.generateSignedImage(
        rawDataUrl,
        this.sessionGuid,
        boxPt
      );
      if (!stamp) {
        console.log('[SAVED-SIG] skipped', 'failed to generate signed image');
        return;
      }

      const rawBase64 = rawDataUrl.includes(',') ? rawDataUrl.split(',')[1] : rawDataUrl;
      if (typeof this.saveImageBase64 === 'function') {
        this.saveImageBase64(rawBase64);
      }

      const targetCount = (this.placeholders || []).filter(p => p.isSignature && !p.hasImage).length;
      await this._applySignatureToEmptyFields(stamp, null, { silent: true });

      this.signatureApplyMode = 'all';
      this._savedSignatureApplied = true;

      this.showToast(
        'Info',
        'Your saved signature has been added to your signature fields. You can change it on any field before submitting.',
        'info'
      );
      this._refreshGuide();
      console.log('[SAVED-SIG] applied', targetCount);
    } catch (err) {
      console.log('[SAVED-SIG] skipped', 'error during prefill execution');
    }
  }

  // Review mode: remove the signature from one field so it shows "Upload Signature" again
  handleDeleteSignature(event) {
    event.stopPropagation();
    this._stampState = null;
    const phId = parseInt(event.currentTarget.dataset.id, 10);
    const ph = (this.placeholders || []).find(p => p.id === phId);
    if (!ph) return;

    const cleared = {
      hasImage: false,
      imageSrc: null,
      signatureDataUrl: null,
      SignatureSrc: null,
      overlaySrc: null,
      sigW: null,
      sigH: null
    };

    this.placeholders = this.placeholders.map(p => (p.id === phId ? { ...p, ...cleared } : p));
    const phPage = Number(ph.page) || this.currentPage || 1;
    const pageArr = this.placeholdersByPage[phPage] || [];
    this.placeholdersByPage = {
      ...this.placeholdersByPage,
      [phPage]: pageArr.map(p => (p.id === phId ? { ...p, ...cleared } : p))
    };

    this.markPageDirty(phPage);
    this._refreshGuide();
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
    if (!this.debugLogs) return;
    try {
      if (typeof dataUrl !== 'string') {
        console.log(label, '(not a string)', dataUrl);
        return;
      }
      const m = /^data:(?<mime>[^;]+);base64,(?<b64>.*)$/.exec(dataUrl) || {};
      const mime = m.groups?.mime || 'unknown';
      const b64 = m.groups?.b64 || '';
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
      canvas.style.width = '600px';
      canvas.style.height = '180px';
      rect = canvas.getBoundingClientRect();
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000';

    this.canvasContext = ctx;
    if (this.debugLogs) {
      console.log('[SIG] init', {
        cssW: rect.width, cssH: rect.height, dpr,
        bufW: canvas.width, bufH: canvas.height
      });
    }
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
    if (this.debugLogs) {
      console.log('[SIG] start', { x, y });
    }
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
    if ((this._strokeCount % 20) === 0 && this.debugLogs) {
      console.log('[SIG] draw', { x, y, strokes: this._strokeCount });
    }
    if (evt.cancelable) evt.preventDefault();
  }

  stopDrawing(evt) {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    if (this.canvasContext) this.canvasContext.closePath();
    if (this.debugLogs) {
      console.log('[SIG] stop');
    }
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


  async saveDrawnSignature() {
    const canvas = this.template.querySelector('.signature-canvas');
    if (!canvas) { console.warn('[SIG] save: no canvas'); return; }

    if (this.debugLogs) {
      console.log('[SIG] save rect', canvas.getBoundingClientRect(), 'buffer', { w: canvas.width, h: canvas.height });
    }
    if (this._isCanvasBlank?.(canvas)) console.warn('[SIG] save: canvas appears blank');

    const originalDataUrl = canvas.toDataURL('image/png');
    const base64 = originalDataUrl.split(',')[1];
    this._logDataUrl?.('[SIG] dataUrl (to be saved)', originalDataUrl);

    this.isDrawingModalVisible = false;

    const phId = parseInt(this.placeholderId, 10);
    const placeholder = this.placeholders.find(p => p.id === phId);
    if (!placeholder) { console.warn('[SIG] save: placeholder not found', phId); return; }

    // 🔥 NEW: Generate composite image (TSigned + GUID)
    const boxPt = this._getSignatureBoxPt(placeholder);
    const finalImage = await this.generateSignedImage(
      originalDataUrl,
      this.sessionGuid,
      boxPt
    );

    // --- canonical + legacy fields ---
    placeholder.isSignature = true;
    placeholder.signatureDataUrl = finalImage;   // ✅ now composite image
    placeholder.SignatureSrc = finalImage;
    placeholder.imageSrc = finalImage;
    placeholder.hasImage = true;

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

    const phPage = Number(placeholder.page) || this.currentPage || 1;
    const pageArr = this.placeholdersByPage[phPage] || [];
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

    this.placeholdersByPage = { ...this.placeholdersByPage, [phPage]: updated };

    // ✅ Keep your existing pipeline intact
    this.updatePlaceholderWithCanvas(placeholder, 'SignatureSrc', 'Signature updated!');

    // ✅ Save ORIGINAL base64 (important for storage consistency)
    this.saveImageBase64(base64);
    this._refreshGuide();
    this._promptApplySignatureToAll(phId, finalImage);
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

        const existingPh = (this.placeholders || []).find((p) => p.id === placeholderId);
        const boxPt = this._getSignatureBoxPt(existingPh || existingPlaceholder);

        // 🔥 NEW: Generate composite image (TSigned + GUID)
        const finalImage = await this.generateSignedImage(
          originalImage,
          this.sessionGuid,
          boxPt
        );

        const page = Number(existingPh?.page) || this.currentPage || 1;

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
        this._refreshGuide();
        this._promptApplySignatureToAll(placeholderId, finalImage);

      } catch (e) {
        console.error("❌ onImageUpload failed:", e);
        this.isattachError = true;
        this.showToast("Error", "Signature upload failed.", "error");
      } finally {
        this.showSpinner = false;

        try {
          if (input && "value" in input) input.value = null;
        } catch (_) { }
      }
    };

    reader.onerror = () => {
      this.isattachError = true;
      this.showToast("Error", "Failed to read the selected file.", "error");
      this.showSpinner = false;

      try {
        if (input && "value" in input) input.value = null;
      } catch (_) { }
    };

    reader.readAsDataURL(file);
  }

  _trimToInk(dataUrl) {
    return new Promise((resolve) => {
      if (!dataUrl || typeof dataUrl !== 'string') {
        resolve(dataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const origW = img.naturalWidth || img.width;
          const origH = img.naturalHeight || img.height;
          if (!origW || !origH) {
            resolve(dataUrl);
            return;
          }

          const totalPixels = origW * origH;
          let scanW = origW;
          let scanH = origH;
          let downscale = 1;

          const MAX_SCAN_PIXELS = 4000000;
          if (totalPixels > MAX_SCAN_PIXELS) {
            downscale = Math.sqrt(totalPixels / MAX_SCAN_PIXELS);
            scanW = Math.max(1, Math.floor(origW / downscale));
            scanH = Math.max(1, Math.floor(origH / downscale));
          }

          const scanCanvas = document.createElement('canvas');
          scanCanvas.width = scanW;
          scanCanvas.height = scanH;
          const scanCtx = scanCanvas.getContext('2d');
          scanCtx.drawImage(img, 0, 0, scanW, scanH);

          const imgData = scanCtx.getImageData(0, 0, scanW, scanH).data;

          // Background reference: median RGBA of the 4 corner pixels plus 4 edge midpoints
          const getPixel = (px, py) => {
            const cx = Math.max(0, Math.min(scanW - 1, px));
            const cy = Math.max(0, Math.min(scanH - 1, py));
            const idx = (cy * scanW + cx) * 4;
            return [imgData[idx], imgData[idx + 1], imgData[idx + 2], imgData[idx + 3]];
          };

          const midX = Math.floor(scanW / 2);
          const midY = Math.floor(scanH / 2);
          const samples = [
            getPixel(0, 0),
            getPixel(scanW - 1, 0),
            getPixel(0, scanH - 1),
            getPixel(scanW - 1, scanH - 1),
            getPixel(midX, 0),
            getPixel(midX, scanH - 1),
            getPixel(0, midY),
            getPixel(scanW - 1, midY)
          ];

          const getMedian = (arr) => {
            const sorted = [...arr].sort((a, b) => a - b);
            const m = Math.floor(sorted.length / 2);
            return sorted.length % 2 !== 0 ? sorted[m] : Math.round((sorted[m - 1] + sorted[m]) / 2);
          };

          const bgR = getMedian(samples.map((s) => s[0]));
          const bgG = getMedian(samples.map((s) => s[1]));
          const bgB = getMedian(samples.map((s) => s[2]));
          const bgA = getMedian(samples.map((s) => s[3]));

          const isBgTransparent = bgA < 16;

          let minX = scanW;
          let minY = scanH;
          let maxX = -1;
          let maxY = -1;

          for (let y = 0; y < scanH; y++) {
            const rowOffset = y * scanW * 4;
            for (let x = 0; x < scanW; x++) {
              const i = rowOffset + x * 4;
              const a = imgData[i + 3];
              if (a > 16) {
                const r = imgData[i];
                const g = imgData[i + 1];
                const b = imgData[i + 2];
                const isNearWhite = r > 235 && g > 235 && b > 235;
                if (!isNearWhite) {
                  const distSq = (r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2;
                  if (isBgTransparent || distSq > 1600) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                  }
                }
              }
            }
          }

          // No ink found
          if (maxX < minX || maxY < minY) {
            resolve(dataUrl);
            return;
          }

          // Map bounding box back to original coordinates if downscaled
          const boxX1 = downscale > 1 ? Math.floor(minX * (origW / scanW)) : minX;
          const boxY1 = downscale > 1 ? Math.floor(minY * (origH / scanH)) : minY;
          const boxX2 = downscale > 1 ? Math.ceil((maxX + 1) * (origW / scanW)) : maxX + 1;
          const boxY2 = downscale > 1 ? Math.ceil((maxY + 1) * (origH / scanH)) : maxY + 1;

          const inkW = boxX2 - boxX1;
          const inkH = boxY2 - boxY1;
          const pad = Math.max(2, Math.round(0.03 * Math.max(inkW, inkH)));

          const cropX = Math.max(0, boxX1 - pad);
          const cropY = Math.max(0, boxY1 - pad);
          const cropX2 = Math.min(origW, boxX2 + pad);
          const cropY2 = Math.min(origH, boxY2 + pad);
          const cropW = cropX2 - cropX;
          const cropH = cropY2 - cropY;

          if (cropW <= 0 || cropH <= 0) {
            resolve(dataUrl);
            return;
          }

          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = cropW;
          cropCanvas.height = cropH;
          const cropCtx = cropCanvas.getContext('2d');
          cropCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

          resolve(cropCanvas.toDataURL('image/png'));
        } catch (err) {
          console.warn('[SIG] _trimToInk error:', err);
          resolve(dataUrl);
        }
      };

      img.onerror = () => {
        resolve(dataUrl);
      };

      img.src = dataUrl;
    });
  }

  _getSignatureBoxPt(placeholder) {
    if (placeholder) {
      // 1. placeholder.wPt / placeholder.hPt (finite, > 0)
      const wPt = Number(placeholder.wPt);
      const hPt = Number(placeholder.hPt);
      if (Number.isFinite(wPt) && Number.isFinite(hPt) && wPt > 0 && hPt > 0) {
        return { wPt, hPt };
      }

      // Resolve page dimensions and u = getPageDimensions(placeholder.page).w / 1024
      const pageNum = Number(placeholder.page) || this.currentPage || 1;
      const pageDim = this.getPageDimensions(pageNum) || { w: 1024, h: 1448 };
      const u = (pageDim.w || 1024) / 1024;

      // 2. placeholder.w / placeholder.h * u, where u = getPageDimensions(placeholder.page).w / 1024 (same u for both axes)
      const w = Number(placeholder.w);
      const h = Number(placeholder.h);
      if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
        return { wPt: w * u, hPt: h * u };
      }

      // 3. the rendered field element's rect converted to points using that page's <img> rect and getPageDimensions(page)
      try {
        const phId = placeholder.id != null ? String(placeholder.id) : null;
        if (phId && this.template) {
          const el = this.template.querySelector(`[data-placeholder-id="${phId}"]`) ||
            this.template.querySelector(`div[data-id="${phId}"]`);
          const container = el?.closest('.placeholder-container') || el;
          const pageEl = this.template.querySelector(`.image-container[data-page-number="${pageNum}"]`) ||
            this.template.querySelector('.image-container');
          const imgEl = pageEl ? (pageEl.querySelector('img.pdf-image') || pageEl.querySelector('img')) : null;

          if (container && imgEl) {
            const boxRect = container.getBoundingClientRect();
            const imgRect = imgEl.getBoundingClientRect();
            if (boxRect.width > 0 && boxRect.height > 0 && imgRect.width > 0 && imgRect.height > 0) {
              const scaleX = imgRect.width / pageDim.w;
              const scaleY = imgRect.height / pageDim.h;
              const elWPt = boxRect.width / scaleX;
              const elHPt = boxRect.height / scaleY;
              if (Number.isFinite(elWPt) && Number.isFinite(elHPt) && elWPt > 0 && elHPt > 0) {
                return { wPt: elWPt, hPt: elHPt };
              }
            }
          }
        }
      } catch (_) { }

      // 4. 240 * u by 44 * u
      return { wPt: 240 * u, hPt: 44 * u };
    }

    const pageNum = this.currentPage || 1;
    const pageDim = this.getPageDimensions?.(pageNum) || { w: 1024, h: 1448 };
    const u = (pageDim.w || 1024) / 1024;
    return { wPt: 240 * u, hPt: 44 * u };
  }

  async generateSignedImage(signatureDataUrl, guid, boxPt) {
    signatureDataUrl = await this._trimToInk(signatureDataUrl);

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const img = new Image();
      img.src = signatureDataUrl;

      img.onload = () => {
        // 1. Stamp aspect and real printed height:
        const safeBoxPt = (boxPt && boxPt.wPt > 0 && boxPt.hPt > 0) ? boxPt : { wPt: 240, hPt: 44 };
        const wPt = safeBoxPt.wPt;
        const hPt = safeBoxPt.hPt;
        const rawAspect = wPt / hPt;
        const aspect = Math.min(Math.max(rawAspect, 1.8), 8);
        const stampHPt = rawAspect < aspect ? wPt / aspect : hPt;

        // 2. Canvas resolution follows the printed size:
        const H = Math.min(Math.max(Math.ceil(stampHPt * 3 * 2), 300), 1200);
        const W = Math.round(H * aspect);
        const pxPerPt = H / stampHPt;

        canvas.width = W;
        canvas.height = H;

        // 3. Proportional text sizes with readable floors:
        const labelPx = Math.max(0.105 * H, 5.5 * pxPerPt);
        const guidPx = Math.max(0.085 * H, 4.5 * pxPerPt);

        const stroke = Math.max(1.5, 0.018 * H);
        const bracketX = 0.05 * H;
        const radius = 0.07 * H;
        const arm = 0.18 * H;

        const labelX = bracketX + arm + 0.4 * labelPx;
        const guidX = labelX;
        const available = W - guidX - 0.04 * H;

        // GUID fitting: shrink first, then middle-ellipsis
        const displayGuid = (guid && typeof guid === 'string') ? guid : '';
        let outGuid = displayGuid;
        let currentGuidPx = guidPx;
        const hardFloorGuidPx = 3.8 * pxPerPt;

        ctx.font = `500 ${currentGuidPx}px monospace`;
        if (outGuid && ctx.measureText(outGuid).width > available) {
          if (currentGuidPx > hardFloorGuidPx) {
            const textW = ctx.measureText(outGuid).width;
            currentGuidPx = Math.max(hardFloorGuidPx, currentGuidPx * (available / textW));
            ctx.font = `500 ${currentGuidPx}px monospace`;
          }
          if (ctx.measureText(outGuid).width > available) {
            let N = 8;
            let M = 4;
            while (N > 4 || M > 4) {
              const candidate = `${outGuid.slice(0, N)}…${outGuid.slice(-M)}`;
              if (ctx.measureText(candidate).width <= available) {
                outGuid = candidate;
                break;
              }
              if (N > 4) {
                N--;
              } else if (M > 4) {
                M--;
              }
            }
            if ((N <= 4 && M <= 4) && ctx.measureText(outGuid).width > available) {
              outGuid = `${outGuid.slice(0, 4)}…${outGuid.slice(-4)}`;
            }
          }
        }

        // Measure text bounds with drawing fonts (with fallbacks if undefined or 0)
        const labelText = 'TSigned by:';
        ctx.font = `700 ${labelPx}px Arial, sans-serif`;
        const L = ctx.measureText(labelText);
        const labelAsc = (L && L.actualBoundingBoxAscent > 0) ? L.actualBoundingBoxAscent : 0.75 * labelPx;
        const labelDesc = (L && L.actualBoundingBoxDescent > 0) ? L.actualBoundingBoxDescent : 0.22 * labelPx;
        const labelTextH = (L && (L.actualBoundingBoxAscent > 0 || L.actualBoundingBoxDescent > 0))
          ? (labelAsc + labelDesc)
          : 0.97 * labelPx;

        ctx.font = `500 ${currentGuidPx}px monospace`;
        const G = ctx.measureText(outGuid || 'M');
        const guidAsc = (G && G.actualBoundingBoxAscent > 0) ? G.actualBoundingBoxAscent : 0.72 * currentGuidPx;
        const guidDesc = (G && G.actualBoundingBoxDescent > 0) ? G.actualBoundingBoxDescent : 0.05 * currentGuidPx;
        const guidTextH = (G && (G.actualBoundingBoxAscent > 0 || G.actualBoundingBoxDescent > 0))
          ? (guidAsc + guidDesc)
          : 0.77 * currentGuidPx;

        // Spacing (in px, derived from points so it is page-size independent):
        const pad = Math.max(stroke, 0.5 * pxPerPt); // stamp edge -> text
        const gap = Math.max(1, 0.6 * pxPerPt);      // text -> ink

        // Vertical positions:
        const topLineY = pad + labelTextH / 2;
        const bottomLineY = H - pad - guidTextH / 2;

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);

        // DocuSign-Style Left-Side Bracket
        ctx.strokeStyle = '#1e5bb8';
        ctx.lineWidth = stroke;
        ctx.beginPath();
        ctx.moveTo(bracketX + arm, topLineY);
        ctx.lineTo(bracketX + radius, topLineY);
        ctx.arcTo(bracketX, topLineY, bracketX, topLineY + radius, radius);
        ctx.lineTo(bracketX, bottomLineY - radius);
        ctx.arcTo(bracketX, bottomLineY, bracketX + radius, bottomLineY, radius);
        ctx.lineTo(bracketX + arm, bottomLineY);
        ctx.stroke();

        // Text rendering (centered vertically on bracket lines via alphabetic baseline):
        ctx.textBaseline = 'alphabetic';

        // Top line label
        ctx.fillStyle = '#1a1a1a';
        ctx.font = `700 ${labelPx}px Arial, sans-serif`;
        ctx.fillText(labelText, labelX, topLineY + (labelAsc - labelDesc) / 2);

        // Bottom line GUID
        ctx.fillStyle = '#333333';
        ctx.font = `500 ${currentGuidPx}px monospace`;
        ctx.fillText(outGuid, guidX, bottomLineY + (guidAsc - guidDesc) / 2);

        // Ink area:
        const y0 = topLineY + labelTextH / 2 + gap;
        const y1 = bottomLineY - guidTextH / 2 - gap;
        const x0 = bracketX + 0.10 * H;
        const x1 = W - 0.04 * H;

        const trimmedW = img.naturalWidth || img.width || 1;
        const trimmedH = img.naturalHeight || img.height || 1;

        // Contain-fit ink into [x0, x1] x [y0, y1] with ONE uniform scale, left-aligned at x0, centered vertically
        const inkBoxW = Math.max(1, x1 - x0);
        const inkBoxH = Math.max(0, y1 - y0);
        const s = (y1 > y0 && x1 > x0) ? Math.min(inkBoxW / trimmedW, inkBoxH / trimmedH) : 0;
        const drawW = trimmedW * s;
        const drawH = trimmedH * s;
        const drawX = x0;
        const drawY = y0 + ((y1 - y0) - drawH) / 2;

        if (drawW > 0 && drawH > 0) {
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
        }

        if (this.debugLogs) {
          console.log('[SIG] fit', {
            wPt: safeBoxPt.wPt,
            hPt: safeBoxPt.hPt,
            stampHPt,
            labelPt: labelPx / pxPerPt,
            guidPt: guidPx / pxPerPt,
            inkAreaHPt: (y1 - y0) / pxPerPt,
            inkDrawHPt: drawH / pxPerPt,
            guidShown: outGuid
          });
        }

        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => {
        resolve(signatureDataUrl);
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
    if (this.useStampApi) {
      const allPages = [];
      const numPages = (this.pagesData && this.pagesData.length > 0) ? this.pagesData.length : (this.pdfDoc?.numPages || 1);
      for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
        const pageData = this.pagesData?.find(p => Number(p.pageNumber) === pageNumber);
        const pageSrc = pageData?.imageSrc || this.imageSrc;
        const pt = this.getPageDimensions(pageNumber) || { w: 1024, h: 1448 };
        const pageContainer = this.template.querySelector(`.image-container[data-page-number="${pageNumber}"]`) ||
          this.template.querySelector('.image-container');
        const imgEl = pageContainer
          ? (pageContainer.querySelector('img.pdf-image') || pageContainer.querySelector('img'))
          : this.template.querySelector('.image-container img');
        const imgRect = imgEl ? imgEl.getBoundingClientRect() : null;
        const scaleX = (imgRect && imgRect.width > 0) ? (pt.w / imgRect.width) : (pt.w / 1024);

        const pagePlaceholders = (this.placeholders || []).filter(p => (Number(p.page) || 1) === pageNumber);
        const overlays = [];

        for (const ph of pagePlaceholders) {
          const phEl = this.template.querySelector(`.placeholder-container[data-id="${ph.id}"]`) ||
            this.template.querySelector(`[data-id="${ph.id}"]`);
          const phRect = phEl ? phEl.getBoundingClientRect() : null;

          let domW = (phRect && imgRect && imgRect.width > 0)
            ? phRect.width * scaleX
            : ((Number(ph.width) || Number(ph.w) || 150) / 1024) * pt.w;
          let domH = (phRect && imgRect && imgRect.width > 0)
            ? phRect.height * scaleX
            : ((Number(ph.height) || Number(ph.h) || 40) / 1448) * pt.h;

          let x = (ph.xPt != null && Number.isFinite(ph.xPt)) ? ph.xPt : ((Number(ph.x) || 0) / 1024) * pt.w;
          let y = (ph.yPt != null && Number.isFinite(ph.yPt)) ? ph.yPt : ((Number(ph.y) || 0) / 1448) * pt.h;
          let w = (ph.wPt != null && Number.isFinite(ph.wPt)) ? ph.wPt : ((ph.autoWPt != null && Number.isFinite(ph.autoWPt)) ? ph.autoWPt : domW);
          let h = (ph.hPt != null && Number.isFinite(ph.hPt)) ? ph.hPt : domH;

          x = Math.max(0, Math.min(pt.w, x));
          y = Math.max(0, Math.min(pt.h, y));
          w = Math.max(0, Math.min(pt.w - x, w));
          h = Math.max(0, Math.min(pt.h - y, h));

          let src = null;
          if (ph.isSignature) {
            src = ph.imageSrc || ph.SignatureSrc || ph.signatureDataUrl || null;
          } else {
            let srcField = 'overlaySrc';
            if (ph.isName) srcField = 'FNimageSrc';
            else if (ph.isLastName) srcField = 'LNimageSrc';
            else if (ph.isInitials) srcField = 'INimageSrc';
            else if (ph.isNameInitials) srcField = 'NIimageSrc';
            else if (ph.isFullName) srcField = 'FullNameSrc';
            else if (ph.isEmail) srcField = 'EmailSrc';
            else if (ph.isContactNumber) srcField = 'PhoneSrc';
            else if (ph.isAddress) srcField = 'AddressSrc';
            else if (ph.isABN) srcField = 'AbnSrc';
            src = ph[srcField] || ph.overlaySrc || null;
          }

          if (src) {
            overlays.push({
              key: ph.id || `overlay_${pageNumber}_${overlays.length}`,
              src,
              style: `position:absolute; left:${(x / pt.w * 100).toFixed(3)}%; top:${(y / pt.h * 100).toFixed(3)}%; width:${(w / pt.w * 100).toFixed(3)}%; height:${(h / pt.h * 100).toFixed(3)}%; object-fit:contain;`
            });
          }
        }

        allPages.push({
          id: pageNumber,
          src: pageSrc,
          alt: `Page ${pageNumber}`,
          overlays: overlays.length > 0 ? overlays : null
        });
      }
      this.isConfirmationPopupVisible = true;
      this.confirmationPopupPages = allPages;
      return;
    }

    if (this.temporaryImageCache && this.temporaryImageCache.size === 0) {
      console.warn('No placeholders found, rendering pages from PDF directly.');
    }

    // Prepare data for displaying in the confirmation popup
    const allPages = [];
    const numPages = (this.pdfDoc && this.pdfDoc.numPages) ? this.pdfDoc.numPages : (this.pagesData ? this.pagesData.length : 1);
    for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
      const cachedSrc = this.temporaryImageCache?.get(pageNumber)
        || this.temporaryImageCache?.get(String(pageNumber))
        || this._previewCanvasByPage?.get(pageNumber)?.canvas?.toDataURL('image/png', 1.0)
        || this._previewCanvasByPage?.get(String(pageNumber))?.canvas?.toDataURL('image/png', 1.0);

      if (cachedSrc) {
        allPages.push({
          id: pageNumber,
          src: cachedSrc,
          alt: `Page ${pageNumber}`
        });
      } else {
        // Check if pre-rendered background image exists in pagesData
        const pageData = this.pagesData?.find(p => Number(p.pageNumber) === pageNumber);
        if (pageData && pageData.imageSrc) {
          allPages.push({
            id: pageNumber,
            src: pageData.imageSrc,
            alt: `Page ${pageNumber}`
          });
        } else if (this.pdfDoc) {
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

  async handlePreview(targetPageNumber = null) {
    if (!this.placeholders || this.placeholders.length === 0) {
      this.showToast('Error', 'No placeholders available for preview.', 'error');
      return;
    }

    try {
      this.isPreviewMode = true; // Enable preview mode

      const targetPage = targetPageNumber != null ? Number(targetPageNumber) : null;
      const placeholdersToProcess = targetPage != null
        ? (this.placeholders || []).filter((p) => Number(p.page) === targetPage)
        : (this.placeholders || []);

      console.log(`[PREVIEW] handlePreview running for targetPage: ${targetPage || 'ALL'}, placeholders count: ${placeholdersToProcess.length}`);

      for (const placeholder of placeholdersToProcess) {
        const phPage = Number(placeholder.page) || targetPage || 1;
        const pageContainer =
          this.template.querySelector(`.image-container[data-page-number="${phPage}"]`) ||
          this.template.querySelector('.image-container');

        const placeholderElement = pageContainer
          ? (pageContainer.querySelector(`.placeholder-container[data-id="${placeholder.id}"]`) ||
            pageContainer.querySelector(`[data-id="${placeholder.id}"]`))
          : this.template.querySelector(`[data-id="${placeholder.id}"]`);

        let boundingRect = placeholderElement ? placeholderElement.getBoundingClientRect() : null;

        // Robust fallback if element bounding rect cannot be read directly
        if (!boundingRect && pageContainer) {
          const imgEl = pageContainer.querySelector('img.pdf-image') || pageContainer.querySelector('img');
          const imgRect = imgEl ? imgEl.getBoundingClientRect() : null;
          if (imgRect) {
            const phX = parseFloat(placeholder.x || placeholder.left || 0);
            const phY = parseFloat(placeholder.y || placeholder.top || 0);
            const phW = parseFloat(placeholder.width || placeholder.w || 120);
            const phH = parseFloat(placeholder.height || placeholder.h || 30);
            boundingRect = {
              x: imgRect.left + phX,
              y: imgRect.top + phY,
              left: imgRect.left + phX,
              top: imgRect.top + phY,
              width: phW,
              height: phH
            };
          }
        }

        if (boundingRect) {
          const imagesToProcess = [
            { type: 'FNimageSrc', src: placeholder.FNimageSrc },
            { type: 'LNimageSrc', src: placeholder.LNimageSrc },
            { type: 'INimageSrc', src: placeholder.INimageSrc },
            { type: 'NIimageSrc', src: placeholder.NIimageSrc },
            { type: 'FullNameSrc', src: placeholder.FullNameSrc },
            { type: 'EmailSrc', src: placeholder.EmailSrc },
            { type: 'PhoneSrc', src: placeholder.PhoneSrc },
            { type: 'AddressSrc', src: placeholder.AddressSrc },
            { type: 'DateSrc', src: placeholder.DateSrc },
            { type: 'DateOfSigningSrc', src: placeholder.DateOfSigningSrc },
            { type: 'AbnSrc', src: placeholder.AbnSrc },
            { type: 'imageSrc', src: placeholder.imageSrc || placeholder.SignatureSrc || placeholder.signatureDataUrl }, // Signature / image
            { type: 'overlaySrc', src: placeholder.overlaySrc } // Custom Placeholders / Fields
          ];

          const processedSrcs = new Set();
          for (const image of imagesToProcess) {
            if (image.src && !processedSrcs.has(image.src)) {
              processedSrcs.add(image.src);
              const base64Data = image.src.includes(',') ? image.src.split(',')[1] : image.src;
              const imageBlob = this.base64ToBlob(base64Data, 'image/png');

              // 🔹 pass placeholder into embedImageWithAdjustedHeight
              await this.embedImageWithAdjustedHeight(
                imageBlob,
                boundingRect,
                phPage,
                placeholder
              );

              console.log(
                `Embedded ${image.type} at page: ${phPage}, ` +
                `X: ${boundingRect.x}, Y: ${boundingRect.y}`
              );
            }
          }

          // Update temporaryImageCache with the composite canvas containing all embedded content for this page
          const entry = this._previewCanvasByPage?.get(phPage);
          if (entry && entry.canvas) {
            const compositeDataUrl = entry.canvas.toDataURL('image/png', 1.0);
            if (!this.temporaryImageCache) {
              this.temporaryImageCache = new Map();
            }
            this.temporaryImageCache.set(phPage, compositeDataUrl);
          }
        }
      }

      // If targetPage was passed, make sure targetPage cache is synchronized
      if (targetPage != null) {
        const entry = this._previewCanvasByPage?.get(targetPage);
        if (entry && entry.canvas) {
          const compositeDataUrl = entry.canvas.toDataURL('image/png', 1.0);
          if (!this.temporaryImageCache) {
            this.temporaryImageCache = new Map();
          }
          this.temporaryImageCache.set(targetPage, compositeDataUrl);
        }
      } else if (this._previewCanvasByPage) {
        // If running for all pages, ensure every canvas in _previewCanvasByPage is in temporaryImageCache
        for (const [pNum, entry] of this._previewCanvasByPage.entries()) {
          if (entry && entry.canvas) {
            const compositeDataUrl = entry.canvas.toDataURL('image/png', 1.0);
            if (!this.temporaryImageCache) {
              this.temporaryImageCache = new Map();
            }
            this.temporaryImageCache.set(Number(pNum), compositeDataUrl);
          }
        }
      }

      console.log('Preview images cached successfully with embedded canvas content.');
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
    let invalidFields = [];

    for (let ph of this.placeholders) {
      const isCustom = ph.isCustom;
      // ---- OLD CODE (commented out): standard fields were always required ----
      // const required = isCustom ? ph.required : true;
      // ---- NEW CODE: standard fields respect the creator's Required toggle (missing flag = required) ----
      const required = isCustom ? ph.required : ph.required !== false;
      // ---- END NEW CODE ----
      const value = ph.value ? String(ph.value).trim() : '';

      if (ph.isSignature) {
        // ---- OLD CODE (commented out) ----
        // const isSigRequired = isCustom ? ph.required : true;
        // ---- NEW CODE ----
        const isSigRequired = isCustom ? ph.required : ph.required !== false;
        // ---- END NEW CODE ----
        if (isSigRequired && !ph.hasImage) {
          missingFields.push(ph.label || 'Signature');
        }
        continue;
      }

      if (required && !value) {
        const dataType = isCustom ? ph.dataType : null;
        if (dataType === 'Boolean' || ph.dataType === 'Boolean') {
          continue;
        }
        missingFields.push(ph.label || this.getPlaceholderLabel(ph));
        continue;
      }

      if (value) {
        const dataType = isCustom ? ph.dataType : null;
        if (dataType === 'Email' || ph.isEmail) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            invalidFields.push(`${ph.label || 'Email'} (Invalid Email)`);
          }
        } else if (dataType === 'Phone' || ph.isContactNumber) {
          const phoneRegex = /^\+?[0-9\s-]{7,15}$/;
          if (!phoneRegex.test(value)) {
            invalidFields.push(`${ph.label || 'Contact Number'} (Invalid Phone)`);
          }
        } else if (dataType === 'Number') {
          if (isNaN(value)) {
            invalidFields.push(`${ph.label} (Must be a number)`);
          }
        } else if (dataType === 'Currency') {
          if (isNaN(parseFloat(value))) {
            invalidFields.push(`${ph.label} (Must be a valid currency)`);
          }
        } else if (dataType === 'Date' || ph.isDate || ph.isDateOfSigning) {
          if (isNaN(Date.parse(value))) {
            invalidFields.push(`${ph.label || 'Date'} (Invalid Date)`);
          }
        } else if (dataType === 'Picklist') {
          const options = ph.options || [];
          if (options.length > 0 && !options.includes(value)) {
            invalidFields.push(`${ph.label} (Value must be one of the options)`);
          }
        } else if (ph.isNameInitials) {
          if (!/^\p{Lu}{1,3}$/u.test(value)) {
            invalidFields.push('Initials (letters only, max 3)');
          }
        }
      }
    }

    if (missingFields.length > 0 || invalidFields.length > 0) {
      let message = '';
      if (missingFields.length > 0) {
        const uniqueMissing = [...new Set(missingFields)];
        message += `The following required field${uniqueMissing.length > 1 ? 's are' : ' is'} incomplete: ${uniqueMissing.join(', ')}. `;
      }
      if (invalidFields.length > 0) {
        const uniqueInvalid = [...new Set(invalidFields)];
        message += `The following field${uniqueInvalid.length > 1 ? 's have' : ' has'} invalid values: ${uniqueInvalid.join(', ')}. `;
      }
      this.showToast('Validation Error', message, 'error');
      return false;
    }

    return true;
  }



  getPlaceholderLabel(ph) {
    if (ph.isName) return 'First Name';
    if (ph.isLastName) return 'Last Name';
    if (ph.isInitials) return 'Title';
    if (ph.isNameInitials) return 'Initials';
    if (ph.isFullName) return 'Full Name';
    if (ph.isEmail) return 'Email';
    if (ph.isContactNumber) return 'Contact Number';
    if (ph.isAddress) return 'Address';
    if (ph.isDate) return 'Date';
    if (ph.isABN) return 'ABN';
    if (ph.isDateOfSigning) return 'Date of Signing';
    return 'Field';
  }

  getPageDimensions(pageNumber) {
    if (this._pageDimensionsCache && this._pageDimensionsCache.has(pageNumber)) {
      return this._pageDimensionsCache.get(pageNumber);
    }
    return this._pagePt || { w: 1024, h: 1448 };
  }




  async embedImageWithAdjustedHeight(imageBlob, boundingRect, pageNumber, placeholder) {
    try {
      const targetPageNum = Number(pageNumber || placeholder?.page) || 1;
      const pageContainer = this.template.querySelector(`.image-container[data-page-number="${targetPageNum}"]`) ||
        this.template.querySelector('.image-container');
      const imgEl = pageContainer ? (pageContainer.querySelector('img.pdf-image') || pageContainer.querySelector('img')) : this.template.querySelector('.image-container img');

      // helper to choose smoothing
      const setSmoothing = (ctx, overlay, w, h) => {
        if (overlay.width === w && overlay.height === h) {
          ctx.imageSmoothingEnabled = false;
        } else {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
        }
      };

      // Prefer page-point placement if caller provided it, and it's NOT a signature:
      let pagePt = this.getPageDimensions(targetPageNum);
      const ph = (placeholder && !placeholder.isSignature) ? placeholder : null;
      const hasPt = !!(ph && pagePt && ph.xPt != null && ph.yPt != null);
      const isSignature = false; // Restores original CSS mapping behavior for signatures

      // 🔹 Per-page canvas cache
      if (!this._previewCanvasByPage) {
        this._previewCanvasByPage = new Map();
      }

      let entry = this._previewCanvasByPage.get(targetPageNum);
      let canvas;
      let ctx;
      let baseW;
      let baseH;

      if (entry) {
        ({ canvas, ctx, baseW, baseH } = entry);
      } else {
        const pageDataObj = this.pagesData?.find(p => Number(p.pageNumber) === targetPageNum);
        const targetImgSrc = pageDataObj?.imageSrc || this.imageSrc;

        if (targetImgSrc) {
          try {
            // Stay in the preview's intrinsic pixel space if image can be used without tainting
            const baseImage = await new Promise((resolve, reject) => {
              const i = new Image();
              if (String(targetImgSrc).startsWith('http')) {
                i.crossOrigin = 'anonymous';
              }
              i.onload = () => resolve(i);
              i.onerror = () => reject(new Error('Image failed to load with CORS'));
              i.src = targetImgSrc;
            });

            baseW = baseImage.naturalWidth || baseImage.width;
            baseH = baseImage.naturalHeight || baseImage.height;

            canvas = document.createElement('canvas');
            ctx = canvas.getContext('2d');
            canvas.width = baseW;
            canvas.height = baseH;

            ctx.drawImage(baseImage, 0, 0, baseW, baseH);

            // Test if canvas is exportable (will throw SecurityError if tainted)
            canvas.toDataURL('image/png', 0.1);

            entry = { canvas, ctx, baseW, baseH, fromImgSrc: true };
            this._previewCanvasByPage.set(targetPageNum, entry);
          } catch (imgErr) {
            console.warn('[PREVIEW] Remote image failed or tainted canvas, falling back to pdfDoc:', imgErr);
            entry = null;
          }
        }

        if (!entry) {
          // Fallback: render the page from pdfDoc to the container width (100% untainted)
          if (this._pdfDocReady) {
            await this._pdfDocReady;
          }
          if (this.pdfDoc) {
            const page = await this.pdfDoc.getPage(targetPageNum);
            const container = pageContainer || this.template.querySelector('.image-container');
            const vp1 = page.getViewport({ scale: 1 });
            const localPagePt = { w: vp1.width, h: vp1.height };
            if (!this._pageDimensionsCache) {
              this._pageDimensionsCache = new Map();
            }
            this._pageDimensionsCache.set(targetPageNum, localPagePt);
            pagePt = localPagePt;

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
            this._previewCanvasByPage.set(targetPageNum, entry);
          }
        }
      }

      const fromImgSrc = entry.fromImgSrc;
      const container = pageContainer || this.template.querySelector('.image-container');
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
        const ratio = baseW / refRect.width;

        const cxCss = boundingRect.x + boundingRect.width / 2;
        const cyCss = boundingRect.y + boundingRect.height / 2;

        const cxPx = (cxCss - refRect.x) * ratio;
        const cyPx = (cyCss - refRect.y) * ratio;

        destX = Math.round(cxPx - destW / 2);
        destY = Math.round(cyPx - destH / 2);
      } else if (hasPt && pagePt) {
        // Page-point based placement (existing logic)
        destX = Math.round((ph.xPt / pagePt.w) * baseW);
        destY = Math.round((ph.yPt / pagePt.h) * baseH);

        if (ph.wPt != null && ph.hPt != null) {
          destW = Math.max(1, Math.round((ph.wPt / pagePt.w) * baseW));
          destH = Math.max(1, Math.round((ph.hPt / pagePt.h) * baseH));
        } else {
          const refRect = fromImgSrc && imgRect ? imgRect : cssRect;
          const ratio = baseW / refRect.width;
          destW = Math.round(boundingRect.width * ratio);
          destH = Math.round(boundingRect.height * ratio);
        }
      } else {
        // TODO: Fix Y coordinate mapping when scrolled (e.g. Y -8267) in legacy embedImageWithAdjustedHeight (old path only).
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

      const isSignatureField = placeholder && placeholder.isSignature;
      if (isSignatureField) {
        const fit = this._fitRect(destW, destH, overlay.width, overlay.height);
        destX = destX + fit.x;
        destY = destY + fit.y;
        destW = fit.w;
        destH = fit.h;
      }

      // Clamp to canvas bounds
      destW = Math.max(1, Math.min(destW, baseW));
      destH = Math.max(1, Math.min(destH, baseH));
      destX = Math.max(0, Math.min(destX, baseW - destW));
      destY = Math.max(0, Math.min(destY, baseH - destH));

      console.log('[TRACE_PIPELINE] embedImageWithAdjustedHeight:', {
        placeholderId: placeholder?.id,
        placeholderType: placeholder?.type || (placeholder?.isSignature ? 'Signature' : 'Text'),
        pageNumber: targetPageNum,
        orientation: pagePt ? (pagePt.w > pagePt.h ? 'Landscape' : 'Portrait') : 'Unknown',
        destX,
        destY,
        destW,
        destH,
        canvasWidth: baseW,
        canvasHeight: baseH,
        overlayWidth: overlay.width,
        overlayHeight: overlay.height
      });

      setSmoothing(ctx, overlay, destW, destH);
      ctx.drawImage(overlay, destX, destY, destW, destH);

      // keep existing behaviour & immediately sync to temporaryImageCache
      const compositeDataUrl = canvas.toDataURL('image/png', 1.0);
      this.imageSrc = compositeDataUrl;
      if (!this.temporaryImageCache) {
        this.temporaryImageCache = new Map();
      }
      this.temporaryImageCache.set(targetPageNum, compositeDataUrl);
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
      console.log(`Title selected: ${placeholder.value}`);
      this._refreshGuide();
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



  get hasPages() {
    return Array.isArray(this.pagesData) && this.pagesData.length > 0;
  }

  get renderedPages() {
    if (!this.hasPages) return [];
    return this.pagesData.map(page => ({
      ...page,
      isGuidePage: this.isGuideVisible && this.guidePageNumber === page.pageNumber,
      placeholders: this.placeholdersByPage[page.pageNumber] ||
        (this.placeholders ? this.placeholders.filter(p => Number(p.page) === Number(page.pageNumber)) : [])
    }));
  }

  get containerStyle() {
    if (this._pagePt && this._pagePt.w > 0 && this._pagePt.h > 0) {
      const height = Math.round(1024 * (this._pagePt.h / this._pagePt.w));
      return `width: 1024px; height: ${height}px; min-height: ${height}px;`;
    }
    return 'width: 1024px; height: 1448px; min-height: 1448px;';
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
      console.log('[STAMP-FLOW] 🏁 handleGeneratePDF invoked', {
        recordId: this.recordId,
        linkToken: this.linkToken,
        useStampApi: this.useStampApi,
        isReviewOnly: this._isReviewOnly(),
        placeholdersCount: this.placeholders ? this.placeholders.length : 0
      });

      // --- UI: match previous behavior ---
      this.showFailureScreen = false;   // hide failure
      this.showSuccessScreen = true;    // show success container
      this.isSpinning = true;           // show spinner

      this.isLoading = true;

      // Server-side link check (server clock) before calling the PDF APIs
      const isLinkUsable = await this.isLinkUsableOnServer();
      if (!isLinkUsable) {
        return;
      }

      // Review-only path: the current signer has no fields with values or signatures
      if (this._isReviewOnly()) {
        console.log('[STAMP-FLOW] _isReviewOnly = true (no signed or filled fields). Routing to review-only submit.');
        await this._handleReviewOnlySubmit();
        return;
      }

      // Server stamp API path (/tstamp/stamp)
      if (this.useStampApi) {
        console.log('[STAMP-FLOW] useStampApi = true. Routing to _submitViaStamp().');
        await this._submitViaStamp();
        return;
      }

      // 0) Force pre-generate of canvas overlays for all filled/checkbox placeholders
      // (both default and custom) that have values but don't have overlaySrc yet,
      // or have pending debounce timers.
      if (this.placeholders && this.placeholders.length > 0) {
        for (const ph of this.placeholders) {
          const key = String(ph.id);
          const hasPendingTimer = this.debounceTimers && this.debounceTimers[key];
          const hasValue = ph.value !== undefined && ph.value !== null && ph.value !== '';
          const isCheckbox = ph.dataType === 'Boolean' || ph.isCustomBoolean;

          if (!ph.isSignature && (hasValue || isCheckbox) && (!ph.overlaySrc || hasPendingTimer)) {
            if (hasPendingTimer) {
              clearTimeout(this.debounceTimers[key]);
              delete this.debounceTimers[key];
            }

            let srcField = 'overlaySrc';
            if (ph.isName) srcField = 'FNimageSrc';
            else if (ph.isLastName) srcField = 'LNimageSrc';
            else if (ph.isInitials) srcField = 'INimageSrc';
            else if (ph.isNameInitials) srcField = 'NIimageSrc';
            else if (ph.isFullName) srcField = 'FullNameSrc';
            else if (ph.isEmail) srcField = 'EmailSrc';
            else if (ph.isContactNumber) srcField = 'PhoneSrc';
            else if (ph.isAddress) srcField = 'AddressSrc';
            else if (ph.isABN) srcField = 'AbnSrc';

            console.log('[GEN] Pre-rendering canvas for placeholder:', ph.id, 'type:', ph.type, 'srcField:', srcField);
            try {
              await this.updatePlaceholderWithCanvas(ph, srcField, null);
            } catch (e) {
              console.error('[GEN] Failed to pre-generate canvas for placeholder:', ph.id, e);
            }
          }
        }
      }

      // Mark all pages containing current recipient's placeholders as dirty so they are rendered
      if (this.placeholders && this.placeholders.length > 0) {
        this.placeholders.forEach(ph => {
          const pageNum = Number(ph.page);
          if (pageNum) {
            this.markPageDirty(pageNum);
          }
        });
      }

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
        let isStored;
        try {
          isStored = await this.storePdfInSalesforce(finalUrl, this.recordId);
        } catch (err) {
          console.warn('[GEN] storePdfInSalesforce warning (no-diff path)', err);
          // storePdfInSalesforce already handles its own toast; keep success UI
        }

        // Save rejected (expired / already submitted / error): do not deactivate or show success
        if (isStored === false) {
          return;
        }

        // Token links: storePdfRecord already deactivated the link (same transaction).
        // Legacy ?data= links only: deactivate from the browser as before.
        if (!this.linkToken) {
          try {
            await this.deactivateCurrentLink();
          } catch (err) {
            console.warn('[GEN] deactivateCurrentLink warning (no-diff path)', err);
          }
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
        this.startSuccessRedirect();
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

      // 3) Validation and Preparation for Document Completion Certificate
      let appendCertificate = false;
      let certificateData = {};

      try {
        console.log('[GEN] Validating document completion for certificate...');
        const valData = await getCertificateValidationData({ recordId: this.recordId });
        if (valData) {
          console.log('[GEN] Certificate validation data retrieved:', valData);
          const status = valData.status;
          const currentRecipient = valData.currentRecipient;
          const allRecipientsStr = valData.allRecipients || '';
          const allRecipients = allRecipientsStr.split(/\r?\n/).map(email => email.trim().toLowerCase()).filter(email => email !== '');

          const isLastRecipient = allRecipients.length > 0 && allRecipients[allRecipients.length - 1] === (currentRecipient || '').trim().toLowerCase();

          console.log('[GEN] Certificate conditions check:', { status, currentRecipient, isLastRecipient });

          if (isLastRecipient || status === 'Completed') {
            appendCertificate = true;
            console.log('[GEN] Certificate criteria met. Fetching dynamic certificate data from Apex...');
            const currentAuditStr = await this.logAuditDataWithIP();
            const certPayloadStr = await getCompletionCertificatePayload({
              recordId: this.recordId,
              currentRecipientEmail: currentRecipient,
              currentRecipientAudit: currentAuditStr,
              totalPages: this.pagesData?.length || this.pdfDoc?.numPages || 1,
              envelopeStatus: status
            });
            const payload = JSON.parse(certPayloadStr);
            if (payload.error) {
              console.error('[GEN] Apex build error:', payload.error);
              console.error('[GEN] Apex stack trace:', payload.stackTrace);
            } else {
              certificateData = payload;
              console.log('[GEN] Completion Certificate payload retrieved successfully:', certificateData);
            }
          }
        }
      } catch (error) {
        console.error('[GEN] Error checking/building certificate data:', error);
      }

      // Retrieve original upload file name from parent Offer_Template__c
      let fileName = this.uiFileName;
      if (!fileName && this.recordId) {
        try {
          fileName = await this.retrieveFileName();
        } catch (e) {
          console.warn('[GEN] Could not retrieve original file name:', e);
        }
      }

      // 4) finalize (merge)
      const genPayload = {
        recordId: this.recordId,
        appendCertificate: appendCertificate,
        certificateData: certificateData,
        fileName: fileName || undefined
      };
      console.log('[GEN] POST /generate-pdf-from-changes', {
        recordId: this.recordId,
        appendCertificate: appendCertificate,
        hasFileName: Boolean(fileName)
      });
      const genResp = await fetch('https://tesseractapps.com/generate-pdf-from-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(genPayload)
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
      let isStored;
      try {
        isStored = await this.storePdfInSalesforce(finalUrl, this.recordId);
      } catch (err) {
        // storePdfInSalesforce already toasts; don't flip success screen
        console.warn('[GEN] storePdfInSalesforce warning', err);
      }

      // Save rejected (expired / already submitted / error): do not deactivate or show success
      if (isStored === false) {
        return;
      }

      // Token links: storePdfRecord already deactivated the link (same transaction).
      // Legacy ?data= links only: deactivate from the browser as before.
      if (!this.linkToken) {
        try {
          await this.deactivateCurrentLink();
        } catch (err) {
          console.warn('[GEN] deactivateCurrentLink warning', err);
        }
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
      this.startSuccessRedirect();

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

  // ==========================================
  // SERVER STAMP API SUBMISSION FLOW (/tstamp/stamp)
  // ==========================================

  _isReviewOnly() {
    if (!this.placeholders || this.placeholders.length === 0) return true;
    return !this.placeholders.some(ph => {
      if (ph.isSignature) {
        return Boolean(ph.imageSrc || ph.SignatureSrc || ph.signatureDataUrl);
      }
      if (ph.dataType === 'Boolean' || ph.isCustomBoolean) {
        return ph.value === true || ph.value === 'true' || ph.checked === true;
      }
      return ph.value !== undefined && ph.value !== null && String(ph.value).trim() !== '';
    });
  }

  async _handleReviewOnlySubmit() {
    console.log('[GEN] no fields with values or signatures; treating as review-only submit');

    if (!this.recordId) {
      this._toast('Missing recordId', 'error');
      this.isSpinning = false;
      this.showFailureScreen = true;
      this.showSuccessScreen = false;
      return;
    }

    const finalUrl = this.pdfUrl || this.originalPdfReference;
    if (!finalUrl) {
      console.warn('[GEN] no diffs but no PDF URL available to finalize');
      this._toast('No changes, but PDF URL is missing – cannot finalize.', 'error');
      this.isSpinning = false;
      this.showFailureScreen = true;
      this.showSuccessScreen = false;
      return;
    }

    let isStored;
    try {
      isStored = await this.storePdfInSalesforce(finalUrl, this.recordId);
    } catch (err) {
      console.warn('[GEN] storePdfInSalesforce warning (no-diff path)', err);
    }

    if (isStored === false) {
      return;
    }

    if (!this.linkToken) {
      try {
        await this.deactivateCurrentLink();
      } catch (err) {
        console.warn('[GEN] deactivateCurrentLink warning (no-diff path)', err);
      }
    }

    this._toast('Reviewed and submitted successfully.', 'success');

    if (this.changedPages && typeof this.changedPages.clear === 'function') {
      this.changedPages.clear();
    }

    this.isSpinning = false;
    this.showSuccessScreen = true;
    this.showFailureScreen = false;
    this.startSuccessRedirect();
  }

  _generateUuid() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async _parallelUpload(items, fn, limit = 4) {
    const results = [];
    const executing = new Set();
    for (const item of items) {
      const p = Promise.resolve().then(() => fn(item));
      results.push(p);
      executing.add(p);
      const clean = () => executing.delete(p);
      p.then(clean, clean);
      if (executing.size >= limit) {
        await Promise.race(executing);
      }
    }
    return Promise.all(results);
  }

  async _buildStampFields() {
    const fields = [];
    const assets = [];
    const idToLabelMap = new Map();

    const placeholders = Array.isArray(this.placeholders) ? this.placeholders : [];

    for (const ph of placeholders) {
      const page = Number(ph.page) || 1;
      const pt = this.getPageDimensions(page) || { w: 1024, h: 1448 };

      const pageContainer = this.template.querySelector(`.image-container[data-page-number="${page}"]`) ||
        this.template.querySelector('.image-container');
      const imgEl = pageContainer
        ? (pageContainer.querySelector('img.pdf-image') || pageContainer.querySelector('img'))
        : this.template.querySelector('.image-container img');
      const imgRect = imgEl ? imgEl.getBoundingClientRect() : null;

      const phEl = this.template.querySelector(`.placeholder-container[data-id="${ph.id}"]`) ||
        this.template.querySelector(`[data-id="${ph.id}"]`);
      const phRect = phEl ? phEl.getBoundingClientRect() : null;

      const scaleX = (imgRect && imgRect.width > 0) ? (pt.w / imgRect.width) : (pt.w / 1024);

      // domW / domH in PDF points
      let domW = (phRect && imgRect && imgRect.width > 0)
        ? phRect.width * scaleX
        : ((Number(ph.width) || Number(ph.w) || 150) / 1024) * pt.w;
      let domH = (phRect && imgRect && imgRect.width > 0)
        ? phRect.height * scaleX
        : ((Number(ph.height) || Number(ph.h) || 40) / 1448) * pt.h;

      // Position in PDF points
      let x = (ph.xPt != null && Number.isFinite(ph.xPt))
        ? ph.xPt
        : ((Number(ph.x) || 0) / 1024) * pt.w;
      let y = (ph.yPt != null && Number.isFinite(ph.yPt))
        ? ph.yPt
        : ((Number(ph.y) || 0) / 1448) * pt.h;

      let w = (ph.wPt != null && Number.isFinite(ph.wPt))
        ? ph.wPt
        : ((ph.autoWPt != null && Number.isFinite(ph.autoWPt)) ? ph.autoWPt : domW);
      let h = (ph.hPt != null && Number.isFinite(ph.hPt))
        ? ph.hPt
        : domH;

      // Clamp box inside [0, pt.w] x [0, pt.h]
      x = Math.max(0, Math.min(pt.w, x));
      y = Math.max(0, Math.min(pt.h, y));
      w = Math.max(0, Math.min(pt.w - x, w));
      h = Math.max(0, Math.min(pt.h - y, h));

      x = Number(x.toFixed(2));
      y = Number(y.toFixed(2));
      w = Number(w.toFixed(2));
      h = Number(h.toFixed(2));

      // Sanitize ID ([A-Za-z0-9_-], max 80)
      const rawId = String(ph.id || '');
      const sanitizedId = rawId.replace(/[^A-Za-z0-9_-]/g, '_').substring(0, 80) || `field_${page}_${fields.length}`;
      idToLabelMap.set(sanitizedId, ph.label || ph.type || ph.id || sanitizedId);

      // 1. Signature
      if (ph.isSignature) {
        const sigDataUrl = ph.imageSrc || ph.SignatureSrc || ph.signatureDataUrl || null;
        if (sigDataUrl) {
          const fieldObj = {
            id: sanitizedId,
            type: 'signature',
            page,
            x, y, w, h,
            imageKey: null
          };
          fields.push(fieldObj);
          assets.push({
            fieldId: sanitizedId,
            dataUrl: sigDataUrl,
            field: fieldObj
          });
        }
        continue;
      }

      // 2. Checkbox (Boolean)
      if (ph.dataType === 'Boolean' || ph.isCustomBoolean) {
        const checked = ph.value === true || ph.value === 'true' || ph.checked === true;
        fields.push({
          id: sanitizedId,
          type: 'checkbox',
          page,
          x, y, w, h,
          value: checked
        });
        continue;
      }

      // 3. Custom font or bold/italic/underline style -> render as image
      const isBold = ph.fontWeight === 'bold' || ph.fontWeight === '700' || ph.textStyle?.bold === true;
      const isItalic = ph.fontStyle === 'italic' || ph.textStyle?.italic === true;
      const isUnderline = ph.underline === true || ph.textStyle?.underline === true;
      const plainSansFonts = ['arial', 'helvetica', 'sans-serif', 'salesforce sans'];
      const fontFamilyStr = String(ph.fontFamily || ph.textStyle?.fontFamily || '').toLowerCase().trim();
      const isPlainSans = !fontFamilyStr || plainSansFonts.some(f => fontFamilyStr.includes(f));
      const isCustomFontOrStyle = !isPlainSans || isBold || isItalic || isUnderline;

      if (isCustomFontOrStyle) {
        let srcField = 'overlaySrc';
        if (ph.isName) srcField = 'FNimageSrc';
        else if (ph.isLastName) srcField = 'LNimageSrc';
        else if (ph.isInitials) srcField = 'INimageSrc';
        else if (ph.isNameInitials) srcField = 'NIimageSrc';
        else if (ph.isFullName) srcField = 'FullNameSrc';
        else if (ph.isEmail) srcField = 'EmailSrc';
        else if (ph.isContactNumber) srcField = 'PhoneSrc';
        else if (ph.isAddress) srcField = 'AddressSrc';
        else if (ph.isABN) srcField = 'AbnSrc';

        let assetDataUrl = ph[srcField] || ph.overlaySrc;
        if (!assetDataUrl) {
          try {
            await this.updatePlaceholderWithCanvas(ph, srcField, null);
            assetDataUrl = ph[srcField] || ph.overlaySrc;
          } catch (e) {
            console.warn('[STAMP] Failed to render canvas for custom font placeholder:', ph.id, e);
          }
        }

        if (assetDataUrl) {
          const fieldObj = {
            id: sanitizedId,
            type: 'image',
            fit: 'contain',
            page,
            x, y, w, h,
            imageKey: null
          };
          fields.push(fieldObj);
          assets.push({
            fieldId: sanitizedId,
            dataUrl: assetDataUrl,
            field: fieldObj
          });
        }
        continue;
      }

      // 4. Text-based fields
      let type = 'text';
      let multiline = false;

      if (ph.isName || ph.isLastName || ph.isFullName) {
        type = 'name';
      } else if (ph.isEmail) {
        type = 'email';
      } else if (ph.isContactNumber) {
        type = 'phone';
      } else if (ph.isABN) {
        type = 'abn';
      } else if (ph.isAddress || ph.isCustomAddress || ph.isTextArea || ph.isCustomTextArea) {
        type = 'address';
        multiline = true;
      } else if (ph.isDate || ph.isDateOfSigning) {
        type = 'date';
      } else if (ph.isNameInitials) {
        type = 'text';
      }

      let textVal;
      if (ph.isNameInitials) {
        textVal = ph.displayValue || ph.initialsSource || ph.value;
      } else {
        textVal = (ph.displayValue !== undefined && ph.displayValue !== null && ph.displayValue !== '')
          ? ph.displayValue
          : ph.value;
      }

      if (textVal === undefined || textVal === null || String(textVal).trim() === '') {
        // Skip optional fields with an empty value
        continue;
      }
      textVal = String(textVal);

      // Text style
      // Unit found in updatePlaceholderWithCanvas: ph.fontSize and ph.textStyle.fontSize are in CSS px at the displayed width (default 15/18px). Converted to PDF points: sizePt = fontSize * (pt.w / imgRect.width).
      const round2 = (num) => Number(Number(num).toFixed(2));
      let sizePt;
      if (ph.renderFontCssPx != null && ph.renderCssPerPt != null && ph.renderCssPerPt > 0) {
        sizePt = round2(ph.renderFontCssPx / ph.renderCssPerPt);
      } else if (Number.isFinite(ph.fontPt) && ph.fontPt > 0) {
        sizePt = round2(ph.fontPt);
      } else {
        const fontPx = Number(ph.textStyle?.fontSize) || Number(ph.fontSize) || 15;
        sizePt = round2(fontPx * scaleX);
      }

      const color = ph.fontColor || ph.textStyle?.color || '#000000';
      const align = ph.textStyle?.align || ph.align || 'left';

      const fieldObj = {
        id: sanitizedId,
        type,
        page,
        x, y, w, h,
        value: textVal,
        size: sizePt,
        color,
        align
      };
      if (multiline || (ph.renderLines != null && ph.renderLines > 1)) {
        fieldObj.multiline = true;
      }
      fields.push(fieldObj);
    }

    return { fields, assets, idToLabelMap };
  }

  async _buildCertificatePayload(audit = null) {
    let appendCertificate = false;
    let certificateData = {};

    try {
      if (this.debugLogs) {
        console.log('[STAMP] Validating document completion for certificate...');
      }
      const valData = await getCertificateValidationData({ recordId: this.recordId });
      if (valData) {
        const status = valData.status;
        const currentRecipient = valData.currentRecipient;
        const allRecipientsStr = valData.allRecipients || '';
        const allRecipients = allRecipientsStr
          .split(/\r?\n/)
          .map(email => email.trim().toLowerCase())
          .filter(email => email !== '');

        const isLastRecipient = allRecipients.length > 0 &&
          allRecipients[allRecipients.length - 1] === (currentRecipient || '').trim().toLowerCase();

        if (isLastRecipient || status === 'Completed') {
          appendCertificate = true;
          const currentAuditStr = audit || await this.logAuditDataWithIP();
          const certPayloadStr = await getCompletionCertificatePayload({
            recordId: this.recordId,
            currentRecipientEmail: currentRecipient,
            currentRecipientAudit: currentAuditStr,
            totalPages: this.pagesData?.length || this.pdfDoc?.numPages || 1,
            envelopeStatus: status
          });
          const payload = JSON.parse(certPayloadStr);
          if (payload.error) {
            console.error('[STAMP] Apex certificate build error:', payload.error);
          } else {
            certificateData = payload;
          }
        }
      }
    } catch (error) {
      console.error('[STAMP] Error checking/building certificate data:', error);
    }

    return { append: appendCertificate, data: certificateData };
  }

  async _buildCertificatePayloadOnce() {
    if (!this._stampState.certificateJson) {
      const certPayload = await this._buildCertificatePayload(this._stampState.audit);
      this._stampState.certificateJson = JSON.stringify(certPayload);
      this._stampState.certAppend = Boolean(certPayload?.append);
    }
    return this._stampState.certificateJson;
  }

  async _uploadStampAssets() {
    if (this._stampState.assetsUploaded) {
      return;
    }
    const assets = this._stampState.assets || [];
    if (assets.length === 0) {
      this._stampState.assetsUploaded = true;
      return;
    }

    const { requestId, fields } = this._stampState;
    const fieldIds = assets.map(a => a.fieldId);
    if (this.debugLogs) {
      console.log('[STAMP-FLOW] Requesting Presigned Upload URLs for assets:', fieldIds);
    }

    const res = await getStampAssetUploadUrls({
      recordId: this.recordId,
      linkToken: this.linkToken,
      useChildPdf: this._docContext?.useChildPdf,
      requestId,
      fieldIds
    });

    if (!res || res.statusCode !== 200 || !res.body) {
      throw new Error(`getStampAssetUploadUrls failed: ${res?.error || res?.statusCode}`);
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(res.body);
    } catch (err) {
      parsedBody = null;
    }
    const results = parsedBody?.results || [];

    await this._parallelUpload(assets, async (asset) => {
      const match = results.find(r => r.key && r.key.endsWith('/' + asset.fieldId + '.png'));
      if (!match || !match.uploadUrl) {
        throw new Error(`Upload URL missing for asset ${asset.fieldId}`);
      }
      const rawBase64 = asset.dataUrl.includes(',') ? asset.dataUrl.split(',')[1] : asset.dataUrl;
      const blob = this.base64ToBlob(rawBase64, 'image/png');
      const headers = match.uploadHeaders || { 'Content-Type': 'image/png' };
      if (this.debugLogs) {
        console.log(`[STAMP-FLOW] Uploading asset "${asset.fieldId}" (${blob.size} bytes) to ${match.uploadUrl.split('?')[0]}`);
      }
      const putRes = await fetch(match.uploadUrl, {
        method: 'PUT',
        headers,
        body: blob
      });
      if (!putRes.ok) {
        throw new Error(`Upload PUT failed HTTP ${putRes.status}`);
      }
      asset.field.imageKey = match.key;
    }, 4);

    this._stampState.assetsUploaded = true;
    // Refresh fieldsJson with the populated imageKeys
    this._stampState.fieldsJson = JSON.stringify(fields);
  }

  async _submitViaStamp() {
    const t0 = performance.now();

    // 1) Request identity (needed for safe retries)
    if (!this._stampState) {
      this._stampState = {
        requestId: this._generateUuid(),
        fields: null,
        fieldsJson: null,
        certificateJson: null,
        certAppend: false,
        assetsUploaded: false,
        assets: null,
        idToLabelMap: null,
        audit: null
      };
    }
    const { requestId } = this._stampState;

    // Fix 5: Audit collected once, cached in _stampState for retry and salesforce storage
    this._stampState.audit ??= await this.logAuditDataWithIP();

    // 2) Fields: build once per requestId
    if (!this._stampState.fields) {
      const { fields, assets, idToLabelMap } = await this._buildStampFields();
      this._stampState.fields = fields;
      this._stampState.assets = assets;
      this._stampState.idToLabelMap = idToLabelMap;
      this._stampState.fieldsJson = JSON.stringify(fields);
    }
    const { fields, assets, idToLabelMap } = this._stampState;

    const countsByType = {};
    for (const f of fields) {
      countsByType[f.type] = (countsByType[f.type] || 0) + 1;
    }
    const typeSummary = Object.entries(countsByType).map(([t, c]) => `${t}:${c}`).join(', ');

    // Phase 1 summary log
    console.log(`[STAMP] Starting stamp requestId=${requestId} fields=${fields.length} (${typeSummary}) assets=${assets.length}`);

    if (this.debugLogs) {
      console.log('[STAMP-FLOW] Fields:', fields);
    }

    // 3 & 4) Fix 6: Run asset upload and certificate building in parallel
    const tParallelStart = performance.now();
    try {
      await Promise.all([
        this._uploadStampAssets(),
        this._buildCertificatePayloadOnce()
      ]);
    } catch (parallelErr) {
      console.error('[STAMP] Asset upload or certificate build failed:', parallelErr?.message || parallelErr);
      this._toast('Could not upload signature', 'error');
      this.isSpinning = false;
      this.showSuccessScreen = false;
      this.showFailureScreen = true;
      return;
    }

    const certAppend = Boolean(this._stampState.certAppend ?? JSON.parse(this._stampState.certificateJson || '{}')?.append);
    console.log(`[STAMP] Parallel prep complete (assets=${assets.length}, certAppend=${certAppend}) in ${Math.round(performance.now() - tParallelStart)}ms`);

    // Retrieve file name
    let fileName = this.uiFileName;
    if (!fileName && this.recordId) {
      try {
        fileName = await this.retrieveFileName();
      } catch (e) {
        if (this.debugLogs) {
          console.warn('[STAMP-FLOW] Could not retrieve original file name:', e);
        }
      }
    }

    // 5) Stamp + poll
    let stampRes = null;
    let data = null;
    const maxAttempts = 11; // 1 initial + up to 10 retries

    if (this.debugLogs) {
      console.log('[STAMP-FLOW] Calling stampForSigner requestId:', requestId, 'fileName:', fileName);
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const tStampStart = performance.now();
      try {
        stampRes = await stampForSigner({
          recordId: this.recordId,
          linkToken: this.linkToken,
          useChildPdf: this._docContext?.useChildPdf,
          requestId,
          fieldsJson: this._stampState.fieldsJson,
          certificateJson: this._stampState.certificateJson,
          fileName: fileName || undefined
        });
      } catch (callErr) {
        console.error('[STAMP] stampForSigner Callout Exception:', callErr);
        this._toast(callErr?.body?.message || callErr?.message || 'Submission failed', 'error');
        this.isSpinning = false;
        this.showSuccessScreen = false;
        this.showFailureScreen = true;
        return;
      }

      if (stampRes.error && !stampRes.body) {
        console.error('[STAMP] stampForSigner returned error with no body:', stampRes.error);
        this._toast(stampRes.error, 'error');
        this.isSpinning = false;
        this.showSuccessScreen = false;
        this.showFailureScreen = true;
        return;
      }

      try {
        data = JSON.parse(stampRes.body);
      } catch (_) {
        data = null;
      }

      console.log(`[STAMP] Server response status=${data?.status || stampRes.statusCode} attempt=${attempt} duration=${Math.round(performance.now() - tStampStart)}ms timingsMs=${JSON.stringify(data?.timingsMs || {})}`);

      if (stampRes.statusCode === 200 && data?.status === 'processing') {
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 3000));
          continue;
        } else {
          console.error('[STAMP] Stamp processing timed out after max retries.');
          this._toast('Stamp processing timed out after 30 seconds', 'error');
          this.isSpinning = false;
          this.showSuccessScreen = false;
          this.showFailureScreen = true;
          return;
        }
      }

      break;
    }

    // 400 validation error
    if (stampRes.statusCode === 400) {
      console.error('[STAMP] Stamp 400 Validation Error Details:', data?.fields || data);
      const errFields = data?.fields || [];
      const fieldMsgs = errFields.map(f => {
        const label = idToLabelMap.get(f.id) || f.id || `field #${f.index}`;
        return `${label}: ${f.error || 'invalid'}`;
      });
      const toastMsg = fieldMsgs.length ? `Please check: ${fieldMsgs.join(', ')}` : (data?.error || 'Validation error');
      this._toast(toastMsg, 'error');
      this.isSpinning = false;
      this.showSuccessScreen = false;
      this.showFailureScreen = false; // stay on the form
      return;
    }

    // 409 conflict
    if (stampRes.statusCode === 409) {
      if (this.debugLogs) {
        console.warn('[STAMP] Stamp 409 Conflict:', data?.error, data);
      }
      if (data?.error === 'source_changed') {
        this._toast('This document was updated by another signer. Please reload.', 'error');
        this.isSpinning = false;
        this.showSuccessScreen = false;
        this.showFailureScreen = true;
        return;
      }
      if (data?.error === 'requestId_reused') {
        this._stampState = null;
        this._toast('Submission conflict. Please try submitting again.', 'warning');
        this.isSpinning = false;
        this.showSuccessScreen = false;
        this.showFailureScreen = false;
        return;
      }
    }

    // Other non-200 or status != ok
    if (stampRes.statusCode !== 200 || !data || data.status !== 'ok') {
      console.error('[STAMP] Stamp Failed with HTTP status:', stampRes.statusCode, data);
      this._toast(data?.error || stampRes.error || 'Submission failed', 'error');
      this.isSpinning = false;
      this.showSuccessScreen = false;
      this.showFailureScreen = true;
      return;
    }

    // 6) Success (status ok)
    const finalUrl = data.fullUrl || data.downloadUrl;
    if (!finalUrl) {
      this._toast('PDF stamped, but no URL returned from server.', 'warning');
      this.isSpinning = false;
      this.showSuccessScreen = false;
      this.showFailureScreen = true;
      return;
    }

    const rawSource = this.pdfUrl || this.originalPdfReference || '';
    const sourceKey = rawSource.split('?')[0].replace(/^https?:\/\/[^\/]+\/?/, '');
    const cleanFinalUrl = finalUrl.split('?')[0];
    const pageCount = data?.pageCount ?? null;
    console.log(`[STAMP] Success requestId=${requestId} sourceKey=${sourceKey} pageCount=${pageCount} totalDuration=${Math.round(performance.now() - t0)}ms replayed=${Boolean(data?.replayed)} url=${cleanFinalUrl}`);

    const savedAudit = this._stampState.audit;
    this.pdfUrl = finalUrl;
    this._stampState = null;

    let isStored;
    try {
      isStored = await this.storePdfInSalesforce(finalUrl, this.recordId, savedAudit);
    } catch (err) {
      console.warn('[STAMP] storePdfInSalesforce warning:', err);
    }

    if (isStored === false) {
      console.warn('[STAMP] storePdfInSalesforce returned false; halting redirect');
      return;
    }

    if (!this.linkToken) {
      try {
        await this.deactivateCurrentLink();
      } catch (err) {
        console.warn('[STAMP] deactivateCurrentLink warning:', err);
      }
    }

    if (this.changedPages && typeof this.changedPages.clear === 'function') {
      this.changedPages.clear();
    }

    this.isSpinning = false;
    this.showSuccessScreen = true;
    this.showFailureScreen = false;
    this.startSuccessRedirect();
  }






  // Shows "Redirecting to tsignapp.com in Ns…" on the success popup, then leaves the page.
  // Called only after the signing is fully saved (both success paths in handleGeneratePDF).
  startSuccessRedirect(seconds = 5) {
    if (this._redirectTimer) {
      clearInterval(this._redirectTimer);
    }
    this.redirectCountdown = seconds;
    this._redirectTimer = setInterval(() => {
      this.redirectCountdown -= 1;
      if (this.redirectCountdown <= 0) {
        this.redirectNow();
      }
    }, 1000);
  }

  // "Go now" link + end of countdown. replace() so Back doesn't return to the signing page.
  redirectNow(event) {
    if (event) {
      event.preventDefault();
    }
    if (this._redirectTimer) {
      clearInterval(this._redirectTimer);
      this._redirectTimer = null;
    }
    window.location.replace(this.redirectUrl);
  }

  get showRedirectNotice() {
    return this.redirectCountdown > 0;
  }

  async storePdfInSalesforce(pdfUrl, parentRecordId, audit = null) {
    if (!pdfUrl || !parentRecordId) {
      console.warn('⚠️ Missing parameters, skipping record storage.');
      // Report as a failed save so handleGeneratePDF never shows success
      // (for token links this save is also what deactivates the link)
      this.showToast('Error', 'Could not save the signed document.', 'error');
      this.isSpinning = false;
      this.showSuccessScreen = false;
      this.showFailureScreen = true;
      return false;
    }

    try {
      if (this.debugLogs) {
        console.log('📌 Collecting audit data before saving...');
      }

      // 🔥 Get audit data (GUID + device + IP + location)
      const fingerprint = audit || await this.logAuditDataWithIP();

      await storePdfRecord({
        pdfUrl: pdfUrl,
        parentRecordId: parentRecordId,
        recipientEmail: this.nextRecipientEmail, // ignored by Apex for token links (computed on server)
        fingerprint: fingerprint,
        linkToken: this.linkToken                // null for legacy ?data= links
      });

      console.log('✅ Child record created successfully in Apex.');
      this.isSpinning = false;
      this.showSuccessScreen = true;
      return true;
    } catch (error) {
      console.error('❌ Error inserting record:', error);

      // Error codes from AWSPdfService.storePdfRecord (server-side link check)
      const message = (error && error.body && error.body.message) || '';
      if (message.includes('TSIGN_LINK_EXPIRED')) {
        this.showLinkBlocked(true);
      } else if (message.includes('TSIGN_LINK_INACTIVE')) {
        this.showLinkBlocked(false);
      } else if (message.includes('TSIGN_LINK_INVALID')) {
        this.showLinkInvalid();
      } else {
        this.showToast('Error', 'Failed to store in Salesforce.', 'error');
        this.isSpinning = false;
        this.showSuccessScreen = false;
        this.showFailureScreen = true;
      }
      return false;
    }
  }

  // Server-side link check (server clock) before submit.
  // Returns false and shows the expired / submitted / invalid message when the link can't be used.
  // If the check itself fails (network etc.), returns true: storePdfRecord re-checks on the server.
  async isLinkUsableOnServer() {
    try {
      // Token links: re-resolve the token. Legacy ?data= links: check by recordId + email.
      const linkStatus = this.linkToken
        ? await resolveSignerLink({ token: this.linkToken })
        : await getSignerLinkStatus({ recordId: this.recordId, signerEmail: this.currentUserEmail });

      console.log('[LINK] submit link status:', JSON.stringify({
        found: linkStatus ? linkStatus.found : null,
        isExpired: linkStatus ? linkStatus.isExpired : null,
        isActive: linkStatus ? linkStatus.isActive : null
      }));

      // Token no longer resolves (e.g. replaced by a newer email): treat as invalid
      if (this.linkToken && (!linkStatus || linkStatus.found !== true)) {
        this.showLinkInvalid();
        return false;
      }

      if (linkStatus && linkStatus.found) {
        if (linkStatus.isExpired === true) {
          this.showLinkBlocked(true);
          return false;
        }
        if (linkStatus.isActive !== true) {
          this.showLinkBlocked(false);
          return false;
        }
      }
    } catch (error) {
      console.warn('[LINK] submit link check failed, storePdfRecord will re-check:', error);
    }
    return true;
  }

  // Shows the existing "expired" / "already submitted" message and hides the document
  showLinkBlocked(isExpired) {
    this.isSpinning = false;
    this.showSuccessScreen = false;
    this.showFailureScreen = false;
    this.isConfirmationPopupVisible = false;
    this.imageSrc = '';
    this.isLinkInvalid = false;
    this.isLinkExpired = isExpired;
    this.isAlreadySubmitted = !isExpired;
    this.expirationText = isExpired
      ? '⚠️ This link has expired. Please contact support.'
      : '✅ This document has already been submitted.';
  }

  // Shows the "link isn't valid" screen and hides the document
  // (unknown / tampered token, or token replaced by a newer email)
  showLinkInvalid() {
    this.isSpinning = false;
    this.showSuccessScreen = false;
    this.showFailureScreen = false;
    this.isConfirmationPopupVisible = false;
    this.imageSrc = '';
    this.isLinkExpired = false;
    this.isAlreadySubmitted = false;
    this.isLinkInvalid = true;
  }


  // NEW state to track diff pages
  changedPages = new Map(); // pageNumber -> { dirty: true, base64?: string }
  originalPdfReference;     // e.g., ContentVersion key or S3 key/URL you already have
  recordId;                 // ensure you set this once you decode your URL payload

  // Call this anywhere a user changes something on page N
  markPageDirty(pageNumber) {
    this._stampState = null;
    const existing = this.changedPages.get(pageNumber) || {};
    this.changedPages.set(pageNumber, { ...existing, dirty: true });
  }

  async _renderPageToBase64(pageNumber) {
    const pdf = this.pdfDoc || this.pdf || this.pdfDocument;
    if (!pdf) throw new Error('PDF not loaded');

    const page = await pdf.getPage(pageNumber);
    const vp1 = page.getViewport({ scale: 1 });
    const pagePtW = vp1.width;
    const pagePtH = vp1.height;

    const MAX_SIDE = 8192, MAX_AREA = 16000000;   // safe for iOS Safari
    const scale = Math.min(3,
      MAX_SIDE / Math.max(pagePtW, pagePtH),
      Math.sqrt(MAX_AREA / (pagePtW * pagePtH)));
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: false });

    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise;

    const pagePlaceholders = (this.placeholders || [])
      .filter(p => Number(p.page) === Number(pageNumber));

    // constants that reflect your preview container
    const FALLBACK_W = 1024;   // .image-container width
    const FALLBACK_H = 1448;   // .image-container height

    for (const p of pagePlaceholders) {
      const dataUrl = this._getPlaceholderDataUrl
        ? (p.overlaySrc || this._getPlaceholderDataUrl(p))
        : (p.overlaySrc || p.signatureDataUrl || p.SignatureSrc || p.signatureSrc ||
          p.imageSrc || p.FullNameSrc || p.NIimageSrc || p.INimageSrc || p.AbnSrc || null);
      if (!dataUrl || !/^data:image\/(png|jpeg);base64,/.test(dataUrl)) continue;

      const xPt = Number.isFinite(p.xPt) ? Number(p.xPt) : 0;
      const yPt = Number.isFinite(p.yPt) ? Number(p.yPt) : 0;

      let wPt, hPt;

      if (p.isSignature) {
        const u = pagePtW / 1024;
        wPt = (Number.isFinite(p.wPt) && p.wPt > 0) ? Number(p.wPt)
          : (Number.isFinite(p.w) && p.w > 0) ? p.w * u : 240 * u;
        hPt = (Number.isFinite(p.hPt) && p.hPt > 0) ? Number(p.hPt)
          : (Number.isFinite(p.h) && p.h > 0) ? p.h * u : 44 * u;
      } else {
        // original behaviour for non-signature placeholders
        wPt = Math.max(1, Number.isFinite(p.wPt) ? Number(p.wPt) : 120);
        hPt = Math.max(1, Number.isFinite(p.hPt) ? Number(p.hPt) : 30);
      }

      const boxX = Math.round(xPt * (canvas.width / pagePtW));
      const boxY = Math.round(yPt * (canvas.height / pagePtH));
      const boxW = Math.max(1, Math.round(wPt * (canvas.width / pagePtW)));
      const boxH = Math.max(1, Math.round(hPt * (canvas.height / pagePtH)));

      console.log('[TRACE_PIPELINE] _renderPageToBase64:', {
        placeholderId: p.id,
        placeholderType: p.type || (p.isSignature ? 'Signature' : 'Text'),
        pageNumber: pageNumber,
        orientation: vp1.width > vp1.height ? 'Landscape' : 'Portrait',
        pageViewportWidth: vp1.width,
        pageViewportHeight: vp1.height,
        boxX,
        boxY,
        boxW,
        boxH
      });

      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {

          const isAddressField = p.isAddress;
          if (p.isSignature) {
            // keep aspect ratio *inside* the placeholder's placed box bounds
            const fit = this._fitRect(
              boxW,
              boxH,
              img.naturalWidth || img.width,
              img.naturalHeight || img.height
            );
            const drawX = boxX;
            const drawY = boxY + Math.round((boxH - fit.h) / 2);
            ctx.drawImage(img, drawX, drawY, fit.w, fit.h);
          } else if (isAddressField) {
            // For address fields, calculate height dynamically to keep aspect ratio of wrapped text image
            const fitH = Math.max(1, Math.round(boxW * (img.height / img.width)));
            ctx.drawImage(img, boxX, boxY, boxW, fitH);
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
      'imageSrc', 'FullNameSrc', 'AbnSrc', 'InitialsSrc', 'INimageSrc', 'NIimageSrc', 'DateSrc', 'NameSrc', 'canvasSrc'
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
  _toast(message, variant = 'success') {
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
      boxWidthPx: Math.max(widthPx, 320),
      boxHeightPx: Math.max(heightPx, 80),
      padding: 8
    });

    // 🔥 STEP 2: Wrap into DocuSign-style image (NEW)
    const boxPt = this._getSignatureBoxPt(placeholder);
    const finalImage = await this.generateSignedImage(
      rawSignature,
      this.sessionGuid,
      boxPt
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
    const phPage = Number(placeholder.page) || this.currentPage || 1;
    const pageArr = this.placeholdersByPage[phPage] || [];
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

    if (this.placeholdersByPage[phPage]) {
      this.placeholdersByPage[phPage] = [
        ...this.placeholdersByPage[phPage]
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
    this._refreshGuide();
    this._promptApplySignatureToAll(Number(this.placeholderId), finalImage);
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
    return { widthPx: 340, heightPx: 130 };
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
    try { await document.fonts.load(`${fontWeight} ${guess}px ${fontFamily}`); } catch (e) { }

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
    this._refreshGuide();
  }


  handleFullNameInputChange(event) { // Full Name
    this.handleInputChange(event, 'FullNameSrc', 'Full Name updated successfully!');
  }

  handleNameInitialsKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.target.blur();
    }
  }

  handleNameInitialsInputChange(event) {
    const raw = event.target.value ?? '';
    const placeholderId = event.target.dataset.id;
    const ph = this.placeholders?.find(p => String(p.id) === String(placeholderId));
    if (!ph) return;

    const trimmedRaw = raw.trim();
    const key = String(ph.id);

    // If input was completely cleared
    if (!trimmedRaw) {
      if (this.debounceTimers && this.debounceTimers[key]) {
        clearTimeout(this.debounceTimers[key]);
        delete this.debounceTimers[key];
      }
      ph.initialsSource = '';
      ph.value = '';
      ph.hasImage = false;
      ph.NIimageSrc = null;
      ph.overlaySrc = null;
      ph.displayValue = '';

      this.placeholders = this.placeholders.map(p =>
        p.id === ph.id ? { ...p, value: '', initialsSource: '', hasImage: false, NIimageSrc: null, overlaySrc: null, displayValue: '' } : p
      );
      const pageNumber = ph.page || this.currentPage || 1;
      const currentPageArr = this.placeholdersByPage[pageNumber];
      if (currentPageArr) {
        this.placeholdersByPage = {
          ...this.placeholdersByPage,
          [pageNumber]: currentPageArr.map(p =>
            p.id === ph.id ? { ...p, value: '', initialsSource: '', hasImage: false, NIimageSrc: null, overlaySrc: null, displayValue: '' } : p
          )
        };
      }
      this.markPageDirty(pageNumber);
      this._refreshGuide();
      return;
    }

    // Keep raw typed characters in initialsSource
    ph.initialsSource = raw;

    const initials = this._deriveInitials(raw);
    if (!initials) {
      // In-progress typing (e.g. spaces/special chars) - do not set timer yet
      return;
    }

    // Trigger canvas generation after debounce (matching other placeholders like Full Name)
    this.handleInputChange(
      { target: { dataset: { id: String(ph.id) }, value: initials, type: 'text' } },
      'NIimageSrc',
      'Initials updated successfully!',
      2000
    );
  }

  handleNameInitialsChange(event) {
    const raw = event.target.value ?? '';
    const placeholderId = event.target.dataset.id;
    const ph = this.placeholders?.find(p => String(p.id) === String(placeholderId));
    if (!ph) return;

    // If canvas was already rendered by debounce timer, avoid duplicate work
    if (ph.hasImage) return;

    const trimmedRaw = raw.trim();
    const key = String(ph.id);

    if (!trimmedRaw) {
      if (this.debounceTimers && this.debounceTimers[key]) {
        clearTimeout(this.debounceTimers[key]);
        delete this.debounceTimers[key];
      }
      ph.initialsSource = '';
      ph.value = '';
      ph.hasImage = false;
      ph.NIimageSrc = null;
      ph.overlaySrc = null;
      ph.displayValue = '';

      this.placeholders = this.placeholders.map(p =>
        p.id === ph.id ? { ...p, value: '', initialsSource: '', hasImage: false, NIimageSrc: null, overlaySrc: null, displayValue: '' } : p
      );
      const pageNumber = ph.page || this.currentPage || 1;
      const currentPageArr = this.placeholdersByPage[pageNumber];
      if (currentPageArr) {
        this.placeholdersByPage = {
          ...this.placeholdersByPage,
          [pageNumber]: currentPageArr.map(p =>
            p.id === ph.id ? { ...p, value: '', initialsSource: '', hasImage: false, NIimageSrc: null, overlaySrc: null, displayValue: '' } : p
          )
        };
      }
      this.markPageDirty(pageNumber);
      this._refreshGuide();
      return;
    }

    const initials = this._deriveInitials(raw);
    if (!initials) {
      this.showToast('Error', 'Enter your initials or full name using letters only.', 'error');
      return;
    }

    ph.initialsSource = trimmedRaw;
    // On blur/change, clear any pending debounce timer and render immediately
    if (this.debounceTimers && this.debounceTimers[key]) {
      clearTimeout(this.debounceTimers[key]);
      delete this.debounceTimers[key];
    }
    this.handleInputChange(
      { target: { dataset: { id: String(ph.id) }, value: initials, type: 'text' } },
      'NIimageSrc',
      'Initials updated successfully!',
      0
    );
    this._refreshGuide();
  }

  /**
   * Pure function to derive initials from raw text according to derivation specification:
   * 1. Normalise: trim, collapse internal whitespace, cap at 60 characters.
   * 2. Split on spaces, hyphens, and en/em dashes.
   * 3. Drop leading honorifics (Mr, Mrs, Ms, Miss, Mx, Dr, Prof) if at least 1 other word remains.
   * 4. Take first Unicode letter per word; skip words without letters.
   * 5. Decide between full name and typed initials:
   *    - 2+ words -> full name: one initial per word.
   *    - 1 word containing dots -> strip non-letters and use all letters.
   *    - 1 word of 1-2 letters -> typed initials.
   *    - 1 word of 3-4 letters: if ALL UPPERCASE -> typed initials; if mixed/lower -> name (first letter).
   *    - 1 word of 5+ letters -> single name (first letter).
   * 6. Cap at 3 letters (if > 3 words remain: first, second, and last word).
   * 7. Uppercase with toLocaleUpperCase().
   * 8. Return '' if no letters found.
   *
   * | Case / Input               | Derivation Rule Applied                                 | Result |
   * |----------------------------|---------------------------------------------------------|--------|
   * | "Surya Vamsi"              | 2 words -> first letter each                            | SV     |
   * | "surya vamsi"              | 2 words -> first letter each, uppercase                 | SV     |
   * | "SV"                       | 1 word, 2 letters -> typed initials                     | SV     |
   * | "sv"                       | 1 word, 2 letters -> typed initials, uppercase          | SV     |
   * | "S.V."                     | 1 word with dots -> strip dots/non-letters              | SV     |
   * | "s.v"                      | 1 word with dots -> strip dots, uppercase               | SV     |
   * | "S V"                      | 2 words -> first letter each                            | SV     |
   * | "Dr Surya Vamsi"           | Leading honorific dropped -> "Surya Vamsi"              | SV     |
   * | "Mary-Jane Smith"          | Hyphenated split -> Mary, Jane, Smith (3 words)         | MJS    |
   * | "Surya Vamsi Kumar Reddy"  | 4 words -> first, second, last word                     | SVR    |
   * | "SVK"                      | 1 word, 3 letters, ALL CAPS -> typed initials           | SVK    |
   * | "Ram"                      | 1 word, 3 letters, mixed case -> name -> first letter   | R      |
   * | "Surya"                    | 1 word, 5+ letters -> name -> first letter              | S      |
   * | "123" / "!!"               | No letters found                                        | ''     |
   */
  _deriveInitials(raw) {
    if (!raw || typeof raw !== 'string') return '';
    let s = raw.trim().replace(/\s+/g, ' ');
    if (s.length > 60) s = s.slice(0, 60);
    if (!s) return '';

    let words = s.split(/[\s\-\u2013\u2014]+/).filter(w => w.length > 0);
    if (words.length === 0) return '';

    const HONORIFIC_REGEX = /^(?:mr|mrs|ms|miss|mx|dr|prof)\.?$/i;
    if (words.length > 1 && HONORIFIC_REGEX.test(words[0])) {
      words.shift();
    }
    if (words.length === 0) return '';

    let result = '';
    if (words.length === 1) {
      const word = words[0];
      if (word.includes('.')) {
        const letters = (word.match(/\p{L}/gu) || []).join('');
        result = letters.slice(0, 3);
      } else {
        const letters = (word.match(/\p{L}/gu) || []).join('');
        if (letters.length === 0) {
          return '';
        } else if (letters.length <= 2) {
          result = letters;
        } else if (letters.length <= 4) {
          const isAllUpper = letters === letters.toLocaleUpperCase() && letters !== letters.toLocaleLowerCase();
          if (isAllUpper) {
            result = letters.slice(0, 3);
          } else {
            result = letters.charAt(0);
          }
        } else {
          result = letters.charAt(0);
        }
      }
    } else {
      let wordInitials = [];
      for (const w of words) {
        const m = w.match(/\p{L}/u);
        if (m) {
          wordInitials.push(m[0]);
        }
      }
      if (wordInitials.length === 0) return '';
      if (wordInitials.length === 1) {
        result = wordInitials[0];
      } else if (wordInitials.length <= 3) {
        result = wordInitials.join('');
      } else {
        result = wordInitials[0] + wordInitials[1] + wordInitials[wordInitials.length - 1];
      }
    }

    result = result.toLocaleUpperCase();
    return /^\p{L}+$/u.test(result) ? result : '';
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

  handleAbnInputChange(event) {
    event.target.value = event.target.value.replace(/\D/g, '').slice(0, 11);

    this.handleInputChange(event, 'AbnSrc', 'ABN updated successfully!');
  }

  handleDateInputChange(event) {
    this.handleInputChange(event, 'DateSrc', 'Date updated successfully!');
  }

  handleDateOfSigningInputChange(event) {
    this.handleInputChange(event, 'DateOfSigningSrc', 'Date of Signing updated successfully!');
  }

  handleCustomFieldInputChange(event) {
    const placeholderId = event.target.dataset.id;
    const placeholder = this.placeholders.find(p => String(p.id) === String(placeholderId));
    if (!placeholder) return;

    let newValue = event.target.type === 'checkbox' ? (event.target.checked ? 'true' : 'false') : (event.target.value ?? '');

    if (placeholder.dataType === 'Boolean') {
      placeholder.checkedValue = event.target.checked;
      placeholder.value = newValue;
      this.placeholders = this.placeholders.map(p =>
        String(p.id) === String(placeholderId) ? { ...p, value: newValue, checkedValue: event.target.checked } : p
      );
      // Sync checkpoints page list as well
      const pageNumber = placeholder.page || this.currentPage || 1;
      const currentPageArr = this.placeholdersByPage[pageNumber];
      if (currentPageArr) {
        this.placeholdersByPage = {
          ...this.placeholdersByPage,
          [pageNumber]: currentPageArr.map(p =>
            String(p.id) === String(placeholderId) ? { ...p, value: newValue, checkedValue: event.target.checked } : p
          )
        };
      }
    } else if (!this._isAutoGrowField(placeholder)) {
      // auto-grow custom fields set their value in handleInputChange (so the page-edge check can undo it)
      placeholder.value = newValue;
      if (placeholder.dataType === 'Picklist') {
        placeholder.picklistOptions = (placeholder.options || []).map(opt => ({
          value: opt,
          label: opt,
          selected: opt === newValue
        }));
      }
    }

    this.handleInputChange(event, 'overlaySrc', `${placeholder.label || 'Field'} updated successfully!`);
    this._refreshGuide();
  }

  handleModalCheckboxChange(event) {
    this.currentEditingCheckboxChecked = event.target.checked;
    this.editableText = event.target.checked ? 'true' : 'false';
  }


  // at class level
  debounceTimers = {}; // { [placeholderId]: timeoutId }

  handleInputChange(event, srcField, successMessage, debounceDelay = 2000) {
    const placeholderId = event.target.dataset.id;
    const key = String(placeholderId);
    let newValue = event.target.type === 'checkbox' ? (event.target.checked ? 'true' : 'false') : (event.target.value ?? '');

    // 🔹 1) Find placeholder and UPDATE VALUE IMMEDIATELY
    const ph = this.placeholders?.find(p => String(p.id) === key);
    if (ph) {
      if (ph.isCustom) {
        ph.checkedValue = ph.dataType === 'Boolean' ? newValue === 'true' : false;
      }
      if (this._isAutoGrowField(ph)) {
        // Standard fields: no width limit, the box grows with the text (up to the page edge)
        if (!this._applyAutoGrowWidth(ph, newValue)) {
          newValue = ph.value ?? '';
          event.target.value = newValue;
          this.showToast('Warning', 'Text has reached the edge of the page for this field.', 'warning');
        }
      } else if (!ph.isSignature && !ph.isAddress && !ph.isNameInitials && ph.dataType !== 'Boolean') {
        const check = this.checkTextFitsPlaceholder(ph, newValue);
        if (!check.fits) {
          const oldCheck = this.checkTextFitsPlaceholder(ph, ph.value ?? '');
          const oldOverflows = !oldCheck.fits;

          const shouldBlock =
            !oldOverflows ||
            (newValue.length > (ph.value ?? '').length) ||
            (check.textWidth > oldCheck.textWidth);

          if (shouldBlock) {
            newValue = ph.value ?? '';
            event.target.value = newValue;
            this.showToast(
              'Warning',
              'Maximum text width reached for this field.',
              'warning'
            );
          }
        }
      } else if (!ph.isNameInitials && event?.target && typeof event.target.getBoundingClientRect === 'function') {
        this.adjustInputWidth(event.target);
      }

      ph.value = newValue;  // <-- important: keep UI + model in sync now

      if (
        ph.isAddress ||
        ph.isCustomAddress ||
        ph.isTextArea ||
        ph.isCustomTextArea
      ) {
        this.adjustPlaceholderHeight(ph.id);
      }

      // keep arrays in sync so rerenders use the new value
      // (auto-grow fields also carry their new width and style)
      const growFields = this._isAutoGrowField(ph)
        ? { autoWPt: ph.autoWPt, autoMinWPt: ph.autoMinWPt, wPt: ph.wPt, cssW: ph.cssW, style: this.getPlaceholderStyle(ph) }
        : {};
      this.placeholders = this.placeholders.map(p =>
        p.id === ph.id ? { ...p, value: newValue, initialsSource: ph.initialsSource ?? p.initialsSource, checkedValue: ph.checkedValue, ...growFields } : p
      );

      const pageNumber = ph.page || this.currentPage || 1;
      const currentPageArr = this.placeholdersByPage[pageNumber];
      if (currentPageArr) {
        this.placeholdersByPage = {
          ...this.placeholdersByPage,
          [pageNumber]: currentPageArr.map(p =>
            p.id === ph.id ? { ...p, value: newValue, initialsSource: ph.initialsSource ?? p.initialsSource, checkedValue: ph.checkedValue, ...growFields } : p
          )
        };
      }

      this.markPageDirty(pageNumber);
      console.log('[DIFF] input change -> marked dirty page', pageNumber, 'phId', key);
      this._refreshGuide();
    }

    // 🔹 2) Debounce ONLY the heavy canvas generation for this placeholder
    if (!this.debounceTimers) {
      this.debounceTimers = {};
    }
    clearTimeout(this.debounceTimers[key]);

    if (debounceDelay === 0) {
      (async () => {
        try {
          const placeholder = this.placeholders.find(
            item => item.id === parseInt(key, 10)
          );
          if (!placeholder) {
            console.warn(`Placeholder with ID ${key} not found.`);
            return;
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
        } catch (e) {
          console.error('Error in immediate canvas update:', e);
        }
      })();
    } else {
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
      }, debounceDelay);
    }
  }


  adjustPlaceholderHeight(placeholderId) {
    requestAnimationFrame(() => {
      const container = this.template.querySelector(
        `[data-id="${placeholderId}"]`
      );

      if (!container) return;

      // Reset first so height can shrink as well
      container.style.height = 'auto';

      // Add a little padding
      container.style.height = `${container.scrollHeight + 8}px`;
    });
  }

  checkTextFitsPlaceholder(placeholder, text) {
    if (!placeholder) return { fits: true, textWidth: 0, availableWidth: 0 };

    const container = this.template.querySelector(`[data-id="${placeholder.id}"]`) ||
      this.template.querySelector(`[data-placeholder-id="${placeholder.id}"]`);
    const placeholderWidth = container ? container.getBoundingClientRect().width : (placeholder.cssW || 150);

    // Display mode padding-left is 8px and padding-right is 20px (total 28px).
    // This reserves space for the edit icon so that text never overflows or overlaps the icon.
    const availablePlaceholderWidth = Math.max(0, placeholderWidth - 28);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    const defaultTextStyle = {
      fontFamily: 'Arial, Calibri, sans-serif',
      fontSize: '18',
      bold: false,
      italic: false,
      underline: false,
      color: '#000000'
    };
    const ts = { ...defaultTextStyle, ...(placeholder.textStyle || {}) };
    const fontStyle = ts.italic ? 'italic' : 'normal';
    const fontWeight = placeholder.fontWeight || (ts.bold ? '700' : (placeholder.customInlineStyle ? '400' : '500'));
    const fontSize = `${ts.fontSize}px`;
    const fontFamily = ts.fontFamily;

    context.font = `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`;
    const textWidth = context.measureText(text).width;

    return {
      fits: textWidth <= availablePlaceholderWidth,
      textWidth,
      availableWidth: availablePlaceholderWidth
    };
  }

  // One-line text fields (standard and custom) have no fixed width: the box fits its label, then grows with the typed text.
  _isAutoGrowField(ph) {
    if (!ph || ph.isSignature) return false;
    if (ph.isCustom) {
      return ['Text', 'Number', 'Currency', 'Email', 'Phone'].includes(ph.dataType);
    }
    return !!(ph.isName || ph.isLastName || ph.isFullName || ph.isEmail || ph.isContactNumber || ph.isABN);
  }

  // Label shown inside an empty auto-grow field (must match the placeholder text in the HTML)
  _getAutoGrowLabel(ph) {
    if (ph.isCustom) return ph.label || '';
    if (ph.isName) return 'First Name';
    if (ph.isLastName) return 'Last Name';
    if (ph.isFullName) return 'Full Name';
    if (ph.isEmail) return 'Email';
    if (ph.isContactNumber) return 'Contact Number';
    if (ph.isABN) return 'ABN';
    return '';
  }

  // CSS width of an empty auto-grow field: just wide enough for its label (min 80px)
  _getLabelFitWidthCss(ph) {
    const { textWidth } = this.checkTextFitsPlaceholder(ph, this._getAutoGrowLabel(ph));
    return Math.max(80, Math.ceil(textWidth) + 36);
  }

  // Returns the CSS width the box needs for this text, or null if it would go past the page's right edge.
  _getAutoGrowWidthCss(ph, text) {
    const pageNum = Number(ph.page) || this.currentPage || 1;
    const container = this.template.querySelector(`div[data-id="${ph.id}"][data-type]`);
    const pageEl = this.template.querySelector(`.image-container[data-page-number="${pageNum}"]`) ||
      this.template.querySelector('.image-container');
    const imgEl = pageEl ? (pageEl.querySelector('img.pdf-image') || pageEl.querySelector('img')) : null;
    const pagePt = this.getPageDimensions(pageNum);
    if (!container || !imgEl || !pagePt) return undefined; // cannot measure: leave the box as it is

    const imgRect = imgEl.getBoundingClientRect();
    const boxRect = container.getBoundingClientRect();
    const scaleX = imgRect.width / pagePt.w;
    if (!(scaleX > 0)) return undefined;

    // Smallest width = the box's size before the signer started typing
    if (ph.autoMinWPt == null) {
      ph.autoMinWPt = boxRect.width / scaleX;
    }
    const minCss = ph.autoMinWPt * scaleX;

    // text + 8px left padding + 20px edit-icon space + borders/slack
    const { textWidth } = this.checkTextFitsPlaceholder(ph, text || '');
    const neededCss = Math.ceil(textWidth) + 36;
    const maxCss = imgRect.right - boxRect.left;
    if (neededCss > maxCss) return null;

    return Math.min(Math.max(minCss, neededCss), maxCss);
  }

  // Resizes a standard field's box to fit the text. Returns false if the text would go past the page edge.
  _applyAutoGrowWidth(ph, text) {
    const cssW = this._getAutoGrowWidthCss(ph, text);
    if (cssW === null) return false;
    if (cssW === undefined) return true;

    const pageNum = Number(ph.page) || this.currentPage || 1;
    const pageEl = this.template.querySelector(`.image-container[data-page-number="${pageNum}"]`) ||
      this.template.querySelector('.image-container');
    const imgEl = pageEl.querySelector('img.pdf-image') || pageEl.querySelector('img');
    const scaleX = imgEl.getBoundingClientRect().width / this.getPageDimensions(pageNum).w;

    // Saved in page points so the screen box, the overlay image and the PDF all use the same width
    ph.autoWPt = cssW / scaleX;
    ph.wPt = ph.autoWPt;
    ph.cssW = cssW;

    const container = this.template.querySelector(`div[data-id="${ph.id}"][data-type]`);
    if (container) {
      container.style.width = `${cssW}px`;
      container.style.minWidth = '0';
      container.style.maxWidth = 'none';
    }
    return true;
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
  @track debugFontLogs = false;

  async updatePlaceholderWithCanvas(placeholder, srcField, successMessage) {
    if (this.useStampApi) {
      const hasStyle = !!placeholder?.textStyle;
      const needsProbe = !hasStyle && placeholder?.fontPt == null && !placeholder?.isSignature;
      if (needsProbe) {
        try {
          await this._ensurePdfDoc();
        } catch (e) {
          // If pdf.js fails, keep current seed-size fallback
        }
      }
    } else {
      if (this._pdfDocReady) await this._pdfDocReady;
    }
    // DEBUG toggle (non-invasive)
    const DEBUG_FONT = (this && typeof this.debugFontLogs !== 'undefined') ? !!this.debugFontLogs : false;

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
        el?.closest('.placeholder-container') ||                // outer container wrapper
        el?.closest('.placeholder-box') ||                      // your dashed box container
        el                                                     // fallback (input) if nothing else
      );
    };

    try {
      const phPage = Number(placeholder.page) || this.currentPage || 1;
      const pageDataObj = this.pagesData?.find(p => p.pageNumber === phPage);
      const targetImgSrc = pageDataObj?.imageSrc || this.imageSrc;

      if (this.pdfDoc && phPage && el && targetImgSrc) {
        const page = await this.pdfDoc.getPage(phPage);
        const vp1 = page.getViewport({ scale: 1 });
        this._pagePt = { w: vp1.width, h: vp1.height };
        if (!this._pageDimensionsCache) {
          this._pageDimensionsCache = new Map();
        }
        this._pageDimensionsCache.set(phPage, this._pagePt);
        if (DEBUG_FONT) {
          console.log('[FONT] viewport (pt):', { w: vp1.width, h: vp1.height }, 'page:', phPage);
        }

        const pageContainer = this.template.querySelector(`.image-container[data-page-number="${phPage}"]`) || this.template.querySelector('.image-container');
        const imgEl = pageContainer ? (pageContainer.querySelector('img.pdf-image') || pageContainer.querySelector('img')) : this.template.querySelector('.image-container img');
        if (imgEl) {
          let natW = imgEl.naturalWidth || imgEl.width || 1024;
          let natH = imgEl.naturalHeight || imgEl.height || 1448;
          try {
            const baseImg = await new Promise((resolve) => {
              const i = new Image();
              i.onload = () => resolve(i);
              i.onerror = () => resolve(null);
              i.src = targetImgSrc;
            });
            if (baseImg) {
              natW = baseImg.naturalWidth || baseImg.width || natW;
              natH = baseImg.naturalHeight || baseImg.height || natH;
            }
          } catch (e) {
            // Keep default dimensions
          }

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
            const cssW = Math.round(placeholder.wPt * (imgRect.width / this._pagePt.w));
            const cssH = Math.round(placeholder.hPt * (imgRect.height / this._pagePt.h));
            measureEl.style.width = `${cssW}px`;
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
    const phPageGeom = Number(placeholder.page) || this.currentPage || 1;
    const pagePt = this.getPageDimensions(phPageGeom);
    if (el && pagePt) {
      const pageContainer = this.template.querySelector(`.image-container[data-page-number="${phPageGeom}"]`) || this.template.querySelector('.image-container');
      const imgEl = pageContainer ? (pageContainer.querySelector('img.pdf-image') || pageContainer.querySelector('img')) : this.template.querySelector('.image-container img');
      if (imgEl) {
        const alreadyHasPts =
          Number.isFinite(placeholder.wPt) && placeholder.wPt > 0 &&
          Number.isFinite(placeholder.hPt) && placeholder.hPt > 0 &&
          Number.isFinite(placeholder.xPt) && Number.isFinite(placeholder.yPt);

        if (!alreadyHasPts) {
          const imgRect = imgEl.getBoundingClientRect();
          const measureEl = resolveMeasureEl(el, placeholder.id);
          const cssRect = measureEl.getBoundingClientRect();

          const scaleX = pagePt.w / imgRect.width;
          const scaleY = pagePt.h / imgRect.height;

          wPt = cssRect.width * scaleX;
          hPt = cssRect.height * scaleY;
          xPt = (cssRect.left - imgRect.left) * scaleX;
          yPt = (cssRect.top - imgRect.top) * scaleY;

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
    } else if (el && (this.pagesData?.find(p => p.pageNumber === (Number(placeholder.page) || this.currentPage || 1))?.imageSrc || this.imageSrc)) {
      // 🔹 TEXT / NON-SIGNATURE PATH
      const phPageText = Number(placeholder.page) || this.currentPage || 1;
      const pageDataObj = this.pagesData?.find(p => p.pageNumber === phPageText);
      const targetImgSrc = pageDataObj?.imageSrc || this.imageSrc;
      const pageContainer = this.template.querySelector(`.image-container[data-page-number="${phPageText}"]`) || this.template.querySelector('.image-container');
      const imgEl = pageContainer ? (pageContainer.querySelector('img.pdf-image') || pageContainer.querySelector('img')) : this.template.querySelector('.image-container img');
      let natW = imgEl?.naturalWidth || imgEl?.width || 1024;
      let natH = imgEl?.naturalHeight || imgEl?.height || 1448;
      try {
        const probe = await new Promise((res) => {
          const i = new Image();
          i.onload = () => res(i);
          i.onerror = () => res(null);
          i.src = targetImgSrc;
        });
        if (probe) {
          natW = probe.naturalWidth || probe.width || natW;
          natH = probe.naturalHeight || probe.height || natH;
        }
      } catch (e) {
        // Keep imgEl dimensions
      }

      const pagePt = this.getPageDimensions(phPageText);

      // pixels-per-point in the NATURAL (source) image space
      const pxPerPtX_nat = natW / pagePt.w;
      const pxPerPtY_nat = natH / pagePt.h;

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
        destW = Math.max(1, Math.round(cssRect.width * ratio));
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
          : (desiredFontPx * (pagePt.h / natH)); // converts back to pt if needed
        destFontPx = Math.max(1, Math.round(fontPtStable * pxPerPtY_nat));
        if (DEBUG_FONT) {
          console.log('[FONT] fallback font from nearest text -> destFontPx:', destFontPx);
        }
      }

      placeholder._pixelW = destW;
      placeholder._pixelH = destH;

      console.log('[TRACE_PIPELINE] updatePlaceholderWithCanvas:', {
        placeholderId: placeholder.id,
        placeholderType: placeholder.type || (placeholder.isSignature ? 'Signature' : 'Text'),
        pageNumber: placeholder.page || this.currentPage,
        orientation: pagePt ? (pagePt.w > pagePt.h ? 'Landscape' : 'Portrait') : 'Unknown',
        wPt: placeholder.wPt,
        hPt: placeholder.hPt,
        _pagePt: pagePt,
        natW,
        natH,
        imgRect2_width: imgRect2.width,
        ratioCssToNat,
        destFontPx,
        destW,
        destH,
        devicePixelRatio: window.devicePixelRatio
      });

      // ---- build style-aware options for canvas ----
      const ts = placeholder.textStyle || null;

      const canvasOptions = {
        targetWidth: destW,
        targetHeight: destH,
        fontFamily: 'Arial, Calibri, sans-serif',          // fallback
        fontPx: destFontPx,
        fontWeight: '500',
        paddingX: 0,
        paddingY: 0,
        align: (ts && ts.align) ? ts.align : 'left',
        vAlign: 'middle',
        pixelSpace: false
      };

      if (ts) {
        canvasOptions.fontFamily = ts.fontFamily || 'Arial, Calibri, sans-serif';
        // color + style options ONLY when author provided them
        canvasOptions.color = ts.color || '#000000';
        canvasOptions.fontWeight = placeholder.fontWeight || (ts.bold ? '700' : '400');
        canvasOptions.fontStyle = ts.italic ? 'italic' : 'normal';
        canvasOptions.underline = !!ts.underline;
      }
      // when !ts → Arial, Calibri, sans-serif, black, normal text; nearest-text size used above

      let valueToDraw = placeholder.value || '';
      if (placeholder.dataType === 'Boolean') {
        valueToDraw = (placeholder.value === 'true') ? '☑' : '☐';
      }
      base64Data = this.createCanvasImage(valueToDraw, canvasOptions);
    } else {
      if (DEBUG_FONT) {
        console.log('[FONT] using legacy numeric path with desiredFontPx:', desiredFontPx);
      }
      // legacy: plain Arial, fallback size
      let valueToDraw = placeholder.value || 'Name';
      if (placeholder.dataType === 'Boolean') {
        valueToDraw = (placeholder.value === 'true') ? '☑' : '☐';
      }
      base64Data = this.createCanvasImage(valueToDraw, desiredFontPx, 'Arial, Calibri, sans-serif');
    }

    if (this._lastCanvasRender) {
      placeholder.renderFontCssPx = this._lastCanvasRender.fontPx;
      const phPageGeom = Number(placeholder.page) || this.currentPage || 1;
      const pPt = pagePt || this.getPageDimensions(phPageGeom);
      const pageContainer = this.template.querySelector(`.image-container[data-page-number="${phPageGeom}"]`) || this.template.querySelector('.image-container');
      const currentImgEl = pageContainer ? (pageContainer.querySelector('img.pdf-image') || pageContainer.querySelector('img')) : this.template.querySelector('.image-container img');
      const rectW = currentImgEl ? currentImgEl.getBoundingClientRect().width : 1024;
      placeholder.renderCssPerPt = (pPt && pPt.w > 0) ? (rectW / pPt.w) : 1;
      placeholder.renderLines = this._lastCanvasRender.lines;
    }

    // ---------- D) Update state ----------
    placeholder.hasImage = true;
    placeholder.showCustomStatic = placeholder.hasImage && placeholder.dataType !== 'Boolean';
    placeholder[srcField] = base64Data;
    placeholder.overlaySrc = base64Data;

    const defaultTextStyle = {
      fontFamily: 'Arial, Calibri, sans-serif',
      fontSize: '18',      // px as string
      bold: false,
      italic: false,
      underline: false,
      color: '#000000'
    };
    const ts = { ...defaultTextStyle, ...(placeholder.textStyle || {}) };
    if (placeholder.isInitials) {
      ts.align = 'right';
    }
    if (placeholder.isNameInitials) {
      ts.align = ts.align || 'center';
      if (!placeholder.textStyle?.fontSize) {
        ts.fontSize = '14';
      }
    }
    const fontWeight = placeholder.customInlineStyle ? (ts.bold ? '700' : '400') : '500';
    const fontStyle = ts.italic ? 'italic' : 'normal';
    const textDecor = ts.underline ? 'underline' : 'none';
    const color = ts.color || '#000000';

    placeholder.fontWeight = fontWeight;

    placeholder.inputStyle =
      `font-family:${ts.fontFamily};` +
      `font-size:${ts.fontSize}px;` +
      `font-weight:${fontWeight};` +
      `font-style:${fontStyle};` +
      `text-decoration:${textDecor};` +
      `text-align:${ts.align || 'left'};` +
      `color:${color};`;

    const isAddress = !placeholder.isSignature && !!placeholder.isAddress;
    let justify = 'flex-start';
    if (ts.align === 'center') {
      justify = 'center';
    } else if (ts.align === 'right') {
      justify = 'flex-end';
    }

    placeholder.textStyleCss =
      placeholder.inputStyle +
      `width:100%;` +
      `height:100%;` +
      `box-sizing:border-box;` +
      `white-space:${isAddress ? 'pre-wrap' : 'nowrap'};` +
      `word-break:${isAddress ? 'break-word' : 'normal'};` +
      `overflow:hidden;` +
      `display:flex;` +
      `align-items:center;` +
      `justify-content:${justify};`;

    const isDateType = placeholder.isDate || placeholder.isDateOfSigning;
    placeholder.displayValue = this.getFormattedDisplayValue(placeholder.value, isDateType, placeholder.dataType);

    if (placeholder.isSignature && srcField === 'SignatureSrc') {
      placeholder.imageSrc = base64Data;
    }

    this.placeholders = this.placeholders.map(p => (p.id === placeholder.id ? { ...placeholder } : p));
    const phPage = Number(placeholder.page) || this.currentPage || 1;
    const current = this.placeholdersByPage[phPage] || [];
    const idNum = Number(placeholder.id);
    const idx = current.findIndex(i => i.id === idNum);
    const updatedPage = idx > -1 ? [...current.slice(0, idx), { ...placeholder }, ...current.slice(idx + 1)] : [...current, { ...placeholder }];
    this.placeholdersByPage = { ...this.placeholdersByPage, [phPage]: updatedPage };

    const pageNumber = phPage;
    this.markPageDirty(pageNumber);
    if (DEBUG_FONT) {
      console.log('[FONT] marked page dirty (post-update):', pageNumber, 'phId:', placeholder.id);
    }

    // NEW: immediately recompute placeholder styles so size is correct
    try {
      this._updateAllPlaceholderStyles();
    } catch (e) {
      console.warn('Failed to refresh placeholder styles after canvas update', e);
    }

    if (placeholder.isSignature && successMessage) {
      this.showToast('Success', successMessage, 'success');
    }
    this._refreshGuide();
  }











  createCanvasImage(text, fontSizeOrOptions = 15, fontFamilyMaybe = 'Arial, Calibri, sans-serif') {
    // DEBUG toggle (non-invasive)
    const DEBUG_FONT = (this && typeof this.debugFontLogs !== 'undefined') ? !!this.debugFontLogs : false;

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
    const EXPORT_SCALE = 4;
    // ---- Back-compat (old signature) ----
    if (typeof fontSizeOrOptions === 'number') {
      const fontSize = fontSizeOrOptions || 15;
      const fontFamily = fontFamilyMaybe || 'Arial, Calibri, sans-serif';

      if (DEBUG_FONT) {
        console.log('[FONT][createCanvasImage:num] startSize:', fontSize, 'fontFamily:', fontFamily, 'lines:', lines.length);
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      console.log('Canvas Created');
      console.log('dpr =', dpr);

      ctx.font = `${fontSize}px ${fontFamily}`;
      const widths = lines.map(l => ctx.measureText(l).width);
      const textWidth = Math.max(...widths, fontSize * 4);

      // Use real ascent/descents for single-line height
      const m0 = ctx.measureText(lines[0] || '');
      const asc = m0.actualBoundingBoxAscent ?? fontSize * 0.8;
      const desc = m0.actualBoundingBoxDescent ?? fontSize * 0.2;
      const textHeight = (asc + desc) * Math.max(1, lines.length) + (fontSize * 0.1) * (lines.length - 1);

      canvas.width = Math.ceil(textWidth * dpr);
      canvas.height = Math.ceil(textHeight * dpr);
      canvas.style.width = `${Math.ceil(textWidth)}px`;
      canvas.style.height = `${Math.ceil(textHeight)}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#000';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.font = `${fontSize}px ${fontFamily}`;

      // vertically center using ascent/descents
      const lineGap = fontSize * 0.1;
      let y = (canvas.height / dpr - (asc + desc) * lines.length - lineGap * (lines.length - 1)) / 2 + asc;

      for (const line of lines) {
        ctx.fillText(line, 0, y);
        y += (asc + desc) + lineGap;
      }

      this._lastCanvasRender = { fontPx: fontSize, lines: lines.length };

      if (DEBUG_FONT) {
        console.log('[FONT][createCanvasImage:num] final canvas (css) w×h:', canvas.style.width, canvas.style.height, 'dpr:', dpr);
        console.log('====================');
        console.log('FINAL CANVAS');
        console.log('canvas.width =', canvas.width);
        console.log('canvas.height =', canvas.height);
        console.log('style.width =', canvas.style.width);
        console.log('style.height =', canvas.style.height);
        console.log('====================');
      }
      return canvas.toDataURL('image/png', 1.0);
    }

    // ---- Options path ----
    const {
      targetWidth, targetHeight,
      fontFamily = 'Arial, Calibri, sans-serif',
      fontPx,
      paddingX = 0, paddingY = 0,
      align = 'left',
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
      canvas.width = wCss;
      canvas.height = hCss;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      // canvas.width  = Math.ceil(wCss * dpr);
      // canvas.height = Math.ceil(hCss * dpr);
      // ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      canvas.width = Math.ceil(wCss * dpr * EXPORT_SCALE);
      canvas.height = Math.ceil(hCss * dpr * EXPORT_SCALE);

      ctx.setTransform(
        dpr * EXPORT_SCALE,
        0,
        0,
        dpr * EXPORT_SCALE,
        0,
        0
      );
    }
    canvas.style.width = `${wCss}px`;
    canvas.style.height = `${hCss}px`;

    const availW = Math.max(0, wCss - 2 * paddingX);
    const availH = Math.max(0, hCss - 2 * paddingY);

    // choose size and shrink to fit (width/height)
    let size = fontPx || Math.floor(availH * 0.8);
    const shrinkOnly = !!fontPx;

    console.log('[EMBED_LOG] createCanvasImage start:', {
      text,
      targetWidth,
      targetHeight,
      fontPx,
      wCss,
      hCss,
      availW,
      availH,
      size,
      dpr,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height
    });

    const measureWidth = (s) => {
      // note: here we don't yet apply italic/weight; we only care about width scale
      ctx.font = `${s}px ${fontFamily}`;
      return Math.max(...lines.map(l => ctx.measureText(l).width));
    };

    // shrink only if height exceeds availH (do not shrink for width to prevent text scaling down)
    let w = measureWidth(size);
    if (DEBUG_FONT) {
      console.log('[FONT][createCanvasImage:opt] startSize:', size, 'shrinkOnly:', shrinkOnly, 'availW×H:', availW, availH, 'measuredW:', w);
    }
    let shrinkIters = 0;
    while (size > availH && size > 5) {
      size = Math.floor(size * 0.95);
      shrinkIters++;
    }
    if (DEBUG_FONT) {
      console.log('[FONT][createCanvasImage:opt] height shrink iterations:', shrinkIters, 'size after shrink:', size);
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
    const cssStyle = fontStyle || 'normal';
    // CSS font shorthand: "italic 700 16px Arial"
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
      (align === 'left') ? paddingX :
        (align === 'right') ? (wCss - paddingX) :
          (wCss / 2);

    let y = yStart;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const m = metricsPerLine[i] || ctx.measureText(line);
      const textWidth = Math.min(availW, m.width || availW);

      // draw text
      ctx.fillText(line, x, y);

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

    this._lastCanvasRender = { fontPx: size, lines: lines.length };

    if (DEBUG_FONT) {
      console.log('[FONT][createCanvasImage:opt] finalFontPx:', size, 'lines:', lines.length);
      console.log('[FONT][createCanvasImage:opt] final canvas (css) w×h:', wCss, hCss, 'pixelSpace:', pixelSpace, 'dpr:', dpr);
      console.log('====================');
      console.log('FINAL CANVAS');
      console.log('canvas.width =', canvas.width);
      console.log('canvas.height =', canvas.height);
      console.log('style.width =', canvas.style.width);
      console.log('style.height =', canvas.style.height);
      console.log('====================');
    }
    return canvas.toDataURL('image/png', 1.0);
  }







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
    const placeholderId = event.currentTarget.dataset.id || event.target.dataset.id;

    const placeholder = this.placeholders.find(
      (item) => item.id === parseInt(placeholderId, 10)
    );

    if (!placeholder) {
      this.showToast('Error', 'Placeholder not found for editing.', 'error');
      return;
    }

    let srcField = '';
    let label = '';
    if (placeholder.isCustom) {
      srcField = 'overlaySrc';
      label = placeholder.label;
      if (placeholder.dataType === 'Picklist') {
        this.currentEditingPicklistOptions = placeholder.options ||
          (placeholder.picklistOptions || []).map(opt => typeof opt === 'object' ? opt.value : opt);
      } else if (placeholder.dataType === 'Boolean') {
        this.currentEditingCheckboxChecked = placeholder.value === 'true';
      }
    } else if (placeholder.isName) {
      srcField = 'FNimageSrc';
      label = 'First Name';
    } else if (placeholder.isLastName) {
      srcField = 'LNimageSrc';
      label = 'Last Name';
    } else if (placeholder.isInitials) {
      srcField = 'INimageSrc';
      label = 'Title';
    } else if (placeholder.isNameInitials) {
      srcField = 'NIimageSrc';
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
    this.editableText = placeholder.isNameInitials
      ? (placeholder.initialsSource || placeholder.value)
      : placeholder.value;
    this.currentEditingLabel = label;
    this.currentEditingType = this.getInputType(placeholder);
    this.currentEditingMaxChars = placeholder.maxChars || this.getPlaceholderMaxChars(placeholder);
    this.isEditModalVisible = true;
  }

  getInputType(ph) {
    if (ph.isCustom) {
      if (ph.dataType === 'Phone') return 'tel';
      if (ph.dataType === 'Email') return 'email';
      if (ph.dataType === 'Date') return 'date';
      if (ph.dataType === 'Long Text') return 'textarea';
      if (ph.dataType === 'Picklist') return 'customPicklist';
      if (ph.dataType === 'Boolean') return 'customCheckbox';
      if (ph.dataType === 'Number' || ph.dataType === 'Currency') return 'number';
      return 'text';
    }
    if (ph.isContactNumber) return 'tel';
    if (ph.isABN) return 'tel';
    if (ph.isInitials) return 'dropdown';
    if (ph.isEmail) return 'email';
    if (ph.isDate || ph.isDateOfSigning) return 'date';
    if (ph.isAddress) return 'textarea';
    return 'text';
  }

  get isEditCustomPicklist() {
    return this.currentEditingType === 'customPicklist';
  }

  get isEditCustomCheckbox() {
    return this.currentEditingType === 'customCheckbox';
  }

  get isEditTextInput() {
    return this.currentEditingType !== 'textarea' &&
      this.currentEditingType !== 'dropdown' &&
      this.currentEditingType !== 'customPicklist' &&
      this.currentEditingType !== 'customCheckbox';
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

    const placeholder = this.placeholders.find(
      (item) => item.id === this.currentPlaceholderId
    );

    if (placeholder && this._isAutoGrowField(placeholder)) {
      // Standard fields: no width limit, only stop at the page edge
      if (this._getAutoGrowWidthCss(placeholder, inputValue) === null) {
        inputValue = this.editableText ?? '';
        event.target.value = inputValue;
        this.showToast('Warning', 'Text has reached the edge of the page for this field.', 'warning');
      }
    } else if (placeholder && !placeholder.isSignature && !placeholder.isAddress && !placeholder.isNameInitials) {
      const check = this.checkTextFitsPlaceholder(placeholder, inputValue);
      if (!check.fits) {
        const oldCheck = this.checkTextFitsPlaceholder(
          placeholder,
          this.editableText ?? ''
        );
        const oldOverflows = !oldCheck.fits;

        const shouldBlock =
          !oldOverflows ||
          (inputValue.length > (this.editableText ?? '').length) ||
          (check.textWidth > oldCheck.textWidth);

        if (shouldBlock) {
          inputValue = this.editableText ?? '';
          event.target.value = inputValue;
          this.showToast(
            'Warning',
            'Maximum text width reached for this field.',
            'warning'
          );
        }
      }
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

    const trimmedValue = this.editableText?.trim() || '';

    // Required check
    // ---- OLD CODE (commented out): standard fields were always required ----
    // const required = placeholder.isCustom ? placeholder.required : true;
    // ---- NEW CODE: standard fields respect the creator's Required toggle ----
    const required = placeholder.isCustom ? placeholder.required : placeholder.required !== false;
    // ---- END NEW CODE ----
    if (!trimmedValue && required) {
      this.showToast('Validation Error', `Please enter a value for ${this.currentEditingLabel}.`, 'warning');
      return;
    }

    // Datatype format validation
    if (trimmedValue) {
      if (placeholder.isCustom) {
        const dataType = placeholder.dataType;
        if (dataType === 'Email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(trimmedValue)) {
            this.showToast('Validation Error', 'Please enter a valid email address.', 'warning');
            return;
          }
        } else if (dataType === 'Phone') {
          const phoneRegex = /^\+?[0-9\s-]{7,15}$/;
          if (!phoneRegex.test(trimmedValue)) {
            this.showToast('Validation Error', 'Please enter a valid phone number.', 'warning');
            return;
          }
        } else if (dataType === 'Number' && isNaN(trimmedValue)) {
          this.showToast('Validation Error', 'Please enter a valid number.', 'warning');
          return;
        } else if (dataType === 'Currency' && isNaN(parseFloat(trimmedValue))) {
          this.showToast('Validation Error', 'Please enter a valid currency value.', 'warning');
          return;
        } else if (dataType === 'Date' && isNaN(Date.parse(trimmedValue))) {
          this.showToast('Validation Error', 'Please enter a valid date.', 'warning');
          return;
        }
      }
    }

    let valueToSave = trimmedValue;
    if (placeholder.isNameInitials) {
      const derived = this._deriveInitials(this.editableText);
      if (!derived) {
        this.showToast('Error', 'Enter your initials or full name using letters only.', 'error');
        return;
      }
      placeholder.initialsSource = trimmedValue;
      valueToSave = derived;
    }

    // Update the placeholder value
    placeholder.value = valueToSave;
    if (placeholder.dataType === 'Boolean') {
      placeholder.checkedValue = trimmedValue === 'true';
    } else if (placeholder.dataType === 'Picklist') {
      const rawOptions = placeholder.options ||
        (placeholder.picklistOptions || []).map(opt => typeof opt === 'object' ? opt.value : opt);
      placeholder.picklistOptions = rawOptions.map(opt => ({
        value: opt,
        label: opt,
        selected: opt === trimmedValue
      }));
    }

    // For multiline placeholders, grow the height
    const isMultiline =
      placeholder.isAddress ||
      placeholder.isCustomAddress ||
      placeholder.isTextArea ||
      placeholder.isCustomTextArea;

    if (isMultiline) {
      requestAnimationFrame(() => {
        const container = this.template.querySelector(
          `[data-id="${placeholder.id}"]`
        );

        if (container) {
          container.style.height = 'auto';
          container.style.height = `${container.scrollHeight + 8}px`;

          // Keep placeholder model in sync
          placeholder.h = container.offsetHeight;
        }
      });
    }

    // Standard fields: resize the box to the edited text before the image is redrawn
    if (this._isAutoGrowField(placeholder)) {
      this._applyAutoGrowWidth(placeholder, valueToSave);
      placeholder.style = this.getPlaceholderStyle(placeholder);
    }

    // Update the canvas dynamically with the correct image source
    this.updatePlaceholderWithCanvas(
      placeholder,
      this.currentSrcField,
      `${this.currentEditingLabel} updated successfully!`
    );

    // Close the modal
    this.isEditModalVisible = false;
    this._refreshGuide();
  }



  closeEditModal() {
    this.isEditModalVisible = false; // Hide the modal
    this.editableText = ''; // Clear the editable text
    this.currentPlaceholderId = null; // Reset the current placeholder ID
    this.currentSrcField = ''; // Reset the current image source field
  }




  async automatePreviewProcess() {
    try {
      if (!this.useStampApi && this._pdfDocReady) {
        await this._pdfDocReady;
      }
      if (this.temporaryImageCache) {
        this.temporaryImageCache.clear();
      }
      if (this._previewCanvasByPage) {
        this._previewCanvasByPage.clear();
      }

      // Force pre-generate of canvas overlays for all filled/checkbox placeholders
      // (both default and custom) that have values but don't have overlay/image src yet,
      // or have pending timers.
      if (this.placeholders && this.placeholders.length > 0) {
        for (const ph of this.placeholders) {
          const key = String(ph.id);
          const hasPendingTimer = this.debounceTimers && this.debounceTimers[key];
          const hasValue = ph.value !== undefined && ph.value !== null && ph.value !== '';
          const isCheckbox = ph.dataType === 'Boolean' || ph.isCustomBoolean;

          // For custom fields, they use overlaySrc as canonical.
          // For default fields, they use specific image fields.
          let srcField = 'overlaySrc';
          if (ph.isName) srcField = 'FNimageSrc';
          else if (ph.isLastName) srcField = 'LNimageSrc';
          else if (ph.isInitials) srcField = 'INimageSrc';
          else if (ph.isNameInitials) srcField = 'NIimageSrc';
          else if (ph.isFullName) srcField = 'FullNameSrc';
          else if (ph.isEmail) srcField = 'EmailSrc';
          else if (ph.isContactNumber) srcField = 'PhoneSrc';
          else if (ph.isAddress) srcField = 'AddressSrc';
          else if (ph.isABN) srcField = 'AbnSrc';

          const missingImage = !ph.overlaySrc && !ph[srcField];

          if (!ph.isSignature && (hasValue || isCheckbox) && (missingImage || hasPendingTimer)) {
            if (hasPendingTimer) {
              clearTimeout(this.debounceTimers[key]);
              delete this.debounceTimers[key];
            }

            console.log('[PREVIEW] Pre-generating canvas for placeholder:', ph.id, 'type:', ph.type, 'srcField:', srcField);
            try {
              const origPage = this.currentPage;
              this.currentPage = Number(ph.page) || 1;
              await this.updatePlaceholderWithCanvas(ph, srcField, null);
              this.currentPage = origPage;
            } catch (e) {
              console.error('[PREVIEW] Failed to pre-generate canvas for placeholder:', ph.id, e);
            }
          }
        }
      }

      // Find unique pages with placeholders (normalized as numbers)
      const pagesWithPlaceholders = [...new Set(this.placeholders.map((p) => Number(p.page) || 1))];
      console.log('Pages with placeholders:', pagesWithPlaceholders);

      const origPage = this.currentPage;

      if (!this.useStampApi) {
        for (const pageNumber of pagesWithPlaceholders) {
          console.log(`Processing preview for page ${pageNumber}...`);

          const pageData = this.pagesData?.find(p => Number(p.pageNumber) === pageNumber);
          if (pageData) {
            this.imageSrc = pageData.imageSrc;
          } else {
            await this.renderPageAsImage(pageNumber);
          }

          // Small delay to allow any pending DOM update
          await new Promise((resolve) => setTimeout(resolve, 30));

          // Trigger preview for the current page
          console.log(`Triggering preview for page ${pageNumber}...`);
          await this.handlePreview(pageNumber);

          console.log(`Preview triggered for page ${pageNumber}`);
        }
      }

      // Restore active page without disturbing scroll position
      this.currentPage = origPage;
      if (this.pagesData && this.pagesData.length > 0) {
        this.imageSrc = this.pagesData[0].imageSrc;
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
    if (!page) return;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this._log('nav:thumbnail', { from: this.currentPage, to: page });

    const targetContainer = this.template.querySelector(`.image-container[data-page-number="${page}"]`);
    if (targetContainer) {
      targetContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // IntersectionObserver will authoritatively update this.currentPage and call syncThumbnailUI()
    }
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
    // .sidebar-overlay is the element that scrolls (overflow-y: auto)
    const container = this.template.querySelector('.sidebar-overlay');

    if (!active || !container) return;

    const rect = active.getBoundingClientRect();
    const parentRect = container.getBoundingClientRect();

    const isVisible =
      rect.top >= parentRect.top &&
      rect.bottom <= parentRect.bottom;

    if (!isVisible) {
      // Scroll only the thumbnail panel, keep the active thumbnail centred
      const targetTop = container.scrollTop + (rect.top - parentRect.top)
        - (container.clientHeight / 2) + (rect.height / 2);
      container.scrollTo({ top: Math.max(0, Math.round(targetTop)), behavior: 'smooth' });
    }
  }

  /* ====================================================================
     FIELD GUIDE GETTERS & METHODS (DocuSign-Style Tab Navigation)
     ==================================================================== */

  /**
   * All placeholders for current signer in C2 order.
   */
  get guideTargets() {
    // eslint-disable-next-line no-unused-expressions
    this.guideVersion;
    return this._sortPlaceholders(this.placeholders || []);
  }

  get isGuideVisible() {
    return (
      this.hasPages &&
      this.guideTargets.length > 0 &&
      !this.isLoading &&
      !this.isLoadingpop &&
      !this.isLinkExpired &&
      !this.isAlreadySubmitted &&
      !this.showSuccessScreen &&
      !this.showFailureScreen &&
      !this.isSignatureModalVisible &&
      !this.isDrawingModalVisible &&
      !this.isNameSignatureModalVisible &&
      !this.isApplySignaturePopupVisible &&
      !this.isEditModalVisible &&
      !this.isPreviewModalVisible &&
      !this.isConfirmationPopupVisible &&
      !this.showConversationModal &&
      this.guidePageNumber != null
    );
  }

  get currentGuideTarget() {
    const targets = this.guideTargets;
    if (!targets || targets.length === 0) return null;
    if (this.guideTargetId != null) {
      const matched = targets.find((t) => t.id === this.guideTargetId);
      if (matched) return matched;
    }
    return targets[0];
  }

  get guideCurrentIndex() {
    const targets = this.guideTargets;
    if (!targets || targets.length === 0 || this.guideTargetId == null) return -1;
    return targets.findIndex((t) => t.id === this.guideTargetId);
  }

  /**
   * Dynamic action label based on guideState, placeholder type, and completeness.
   */
  get guideLabel() {
    if (this.guideState === 'START') {
      return 'START';
    }
    // ---- OLD CODE (commented out): FINISH label opened the preview ----
    // if (this.guideState === 'FINISH') {
    //   return 'FINISH';
    // }
    // ---- NEW CODE: no fields left -> show a disabled NEXT; signer uses Review & submit ----
    if (this.guideState === 'FINISH') {
      return 'NEXT';
    }
    // ---- END NEW CODE ----

    const target = this.currentGuideTarget;
    if (!target) return 'NEXT';

    const isComplete = this._isPlaceholderComplete(target);
    if (isComplete) {
      return 'NEXT';
    }

    // ---- NEW CODE: optional empty field -> NEXT (click moves on without error) ----
    if (!this._uiIsRequired(target)) {
      return 'NEXT';
    }
    // ---- END NEW CODE ----

    // Pending target dynamic labels
    if (target.isSignature) {
      return 'SIGN HERE';
    }
    if (target.isNameInitials) {
      return 'INITIAL HERE';
    }
    if (target.isInitials) {
      return 'SELECT';
    }
    if (target.isDate || target.isDateOfSigning || (target.isCustom && target.dataType === 'Date')) {
      return 'ADD DATE';
    }
    if (target.isCustom && (target.dataType === 'Picklist' || target.dataType === 'Boolean')) {
      return 'SELECT';
    }
    return 'FILL IN';
  }

  get guideCounterText() {
    return '';
  }

  get guideAriaLabel() {
    if (this.guideState === 'START') {
      return `Start guided signing, ${this.guideTargets.length} total fields`;
    }
    if (this.guideState === 'FINISH') {
      // ---- OLD CODE (commented out) ----
      // return 'All fields complete. Finish and proceed to document confirmation';
      // ---- NEW CODE ----
      return 'All fields complete. Click Review & submit to continue';
      // ---- END NEW CODE ----
    }
    const target = this.currentGuideTarget;
    const label = this.guideLabel;
    const idx = this.guideCurrentIndex + 1;
    return `${label}: ${this._uiFieldLabel(target)}, field ${idx} of ${this.guideTargets.length}`;
  }

  get guideTitle() {
    return this.guideAriaLabel;
  }

  get showPrevButton() {
    return this.guideState !== 'START' && this.guideCurrentIndex > 0;
  }

  get guideTabClass() {
    return `fg-tab-btn ${this.isGuideCompact ? 'compact' : ''}`;
  }

  /**
   * Inline style for signer tab (Fixed Salesforce Blue #0176D3).
   */
  get guideTabStyle() {
    const FG_COLOR = '#0176D3';
    const FG_COLOR_HOVER = '#014486';
    const FG_TEXT = '#FFFFFF';
    const FG_RING = 'rgba(1, 118, 211, 0.4)';

    return [
      `--fg-top:${this.guideTopPx}px;`,
      `--fg-left:${this.guideLeftPx}px;`,
      `--fg-color:${FG_COLOR};`,
      `--fg-color-hover:${FG_COLOR_HOVER};`,
      `--fg-text:${FG_TEXT};`,
      `--fg-ring:${FG_RING};`
    ].join('');
  }

  /**
   * Pure sorting function adhering to C2 requirements.
   * @param {Array<Object>} placeholders
   * @returns {Array<Object>} sorted array copy
   */
  _sortPlaceholders(placeholders) {
    if (!Array.isArray(placeholders) || placeholders.length === 0) {
      return [];
    }
    return [...placeholders].sort((a, b) => {
      const pageA = Number(a.page) || 1;
      const pageB = Number(b.page) || 1;
      if (pageA !== pageB) {
        return pageA - pageB;
      }

      const yA = a.yPt != null ? Number(a.yPt) : (a.y != null ? Number(a.y) : 0);
      const yB = b.yPt != null ? Number(b.yPt) : (b.y != null ? Number(b.y) : 0);

      // Two fields within 8pt of vertical distance are considered on the same row
      if (Math.abs(yA - yB) < 8) {
        const xA = a.xPt != null ? Number(a.xPt) : (a.x != null ? Number(a.x) : 0);
        const xB = b.xPt != null ? Number(b.xPt) : (b.x != null ? Number(b.x) : 0);
        return xA - xB;
      }
      return yA - yB;
    });
  }

  /**
   * Determines placeholder completion matching validatePlaceholders() exactly.
   * @param {Object} ph
   * @returns {boolean}
   */
  _isPlaceholderComplete(ph) {
    if (!ph) return false;
    if (ph.isSignature) {
      return !!ph.hasImage;
    }
    const dataType = ph.isCustom ? ph.dataType : null;
    if (dataType === 'Boolean' || ph.dataType === 'Boolean') {
      return true;
    }
    const val = ph.value != null ? String(ph.value).trim() : '';
    return val.length > 0;
  }

  /**
   * Checks whether placeholder is required and incomplete.
   * @param {Object} ph
   * @returns {boolean}
   */
  _isPlaceholderPending(ph) {
    if (!ph) return false;
    // ---- OLD CODE (commented out): standard fields were always required ----
    // const required = ph.isCustom ? (ph.required !== false) : true;
    // ---- NEW CODE ----
    const required = this._uiIsRequired(ph);
    // ---- END NEW CODE ----
    if (!required) return false;
    return !this._isPlaceholderComplete(ph);
  }

  /**
   * Smoothly scrolls element into view and applies a 2-cycle transient glow pulse.
   * Pulse colors inherit directly from host-level CSS variables (--fg-color, --fg-ring).
   * @param {HTMLElement} el
   */
  _pulseAndScrollElement(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

    el.classList.remove('fg-pulse');
    // Trigger layout reflow to restart animation reliably
    void el.offsetWidth;
    el.classList.add('fg-pulse');

    const onAnimationEnd = () => {
      el.classList.remove('fg-pulse');
      el.removeEventListener('animationend', onAnimationEnd);
    };
    el.addEventListener('animationend', onAnimationEnd, { once: true });
  }

  /**
   * Notifies guide of field edits, increments guideVersion, and updates state (Revision 3).
   */
  _refreshGuide() {
    this.guideVersion += 1;
    this._guideDirty = true;

    const targets = this.guideTargets;
    if (!targets || targets.length === 0) {
      this.guidePageNumber = null;
      return;
    }

    const pendingList = targets.filter((p) => this._isPlaceholderPending(p));
    // ---- OLD CODE (commented out): FINISH as soon as no required field is pending ----
    // if (pendingList.length === 0) {
    // ---- NEW CODE: also keep going while unvisited empty optional fields remain ahead ----
    const optionalAhead = targets
      .slice(this.guideCurrentIndex + 1)
      .some((p) => !this._isPlaceholderComplete(p));
    if (pendingList.length === 0 && !optionalAhead) {
      // ---- END NEW CODE ----
      // All fields complete -> transition to FINISH state on the last target
      this.guideState = 'FINISH';
      const lastTarget = targets[targets.length - 1];
      this.guideTargetId = lastTarget.id;
    } else {
      // If pending fields exist and state was FINISH (e.g. user cleared a field), restore TARGET (Revision 3)
      if (this.guideState === 'FINISH') {
        this.guideState = 'TARGET';
      }
    }
    this._positionGuide();
  }

  /**
   * Calculates page-relative tab position with height clamping (Revision 9).
   */
  _positionGuide() {
    if (!this.isGuideVisible && this.guideTargets.length === 0) {
      if (this.guidePageNumber !== null) this.guidePageNumber = null;
      return;
    }

    window.requestAnimationFrame(() => {
      const tabHeight = 36;
      const tabWidth = 96;
      const container = this.template.querySelector('.pdf-viewer-container');

      if (this.guideState === 'START') {
        this.guidePageNumber = 1;
        const targetPageEl = this.template.querySelector('.image-container[data-page-number="1"]');
        if (!targetPageEl) {
          this._guideDirty = true;
          return;
        }
        let isCompact = false;
        if (container && targetPageEl) {
          const cRect = container.getBoundingClientRect();
          const pRect = targetPageEl.getBoundingClientRect();
          if ((pRect.left - cRect.left) < (tabWidth + 16)) {
            isCompact = true;
          }
        }
        this.guideTopPx = 16;
        this.guideLeftPx = isCompact ? 0 : -(tabWidth + 8);
        this.isGuideCompact = isCompact;
        this._guideDirty = false;
        return;
      }

      const target = this.currentGuideTarget;
      if (!target) return;

      const targetEl = this.template.querySelector(`.placeholder-container[data-id="${target.id}"]`);
      if (!targetEl) {
        this._guideDirty = true;
        return;
      }

      const offsetTop = targetEl.offsetTop;
      const offsetHeight = targetEl.offsetHeight;
      let computedTop = offsetTop + offsetHeight / 2 - tabHeight / 2;

      const pageEl = targetEl.closest('.image-container');
      const pageHeightPx = pageEl ? pageEl.offsetHeight : 1448;
      // Page-height clamping (Revision 9)
      computedTop = Math.max(0, Math.min(computedTop, pageHeightPx - tabHeight));

      let isCompact = false;
      if (container && pageEl) {
        const cRect = container.getBoundingClientRect();
        const pRect = pageEl.getBoundingClientRect();
        if ((pRect.left - cRect.left) < (tabWidth + 16)) {
          isCompact = true;
        }
      }

      const computedLeft = isCompact ? 0 : -(tabWidth + 8);

      const newTop = Math.round(computedTop);
      const newLeft = Math.round(computedLeft);
      const newPage = target.page;

      if (
        this.guideTopPx !== newTop ||
        this.guideLeftPx !== newLeft ||
        this.guidePageNumber !== newPage ||
        this.isGuideCompact !== isCompact
      ) {
        this.guideTopPx = newTop;
        this.guideLeftPx = newLeft;
        this.guidePageNumber = newPage;
        this.isGuideCompact = isCompact;
      }
      this._guideDirty = false;
    });
  }

  /**
   * Triggers native input focus or modal entry point without adding custom editing logic (Revision 7).
   * Runs ONLY when tab is already next to a PENDING target and user clicks it.
   */
  _activateTargetEntry(target) {
    if (!target) return;
    const targetEl = this.template.querySelector(`.placeholder-container[data-id="${target.id}"]`);
    if (!targetEl) return;

    if (target.isSignature) {
      const signBtn = targetEl.querySelector(`.placeholder-sign[data-id="${target.id}"]`) || targetEl;
      signBtn.click();
      return;
    }

    const inputEl = targetEl.querySelector('input, textarea, select');
    if (inputEl) {
      inputEl.focus({ preventScroll: true });
    } else {
      // Rendered in static canvas/image mode
      const editBtn = targetEl.querySelector(`.edit-icon[data-id="${target.id}"]`);
      if (editBtn) {
        editBtn.click();
      }
    }
  }

  /**
   * Handles main tab clicks in signer view (Revision 2).
   * START and NEXT branches ONLY scroll + pulse the new target.
   */
  handleGuideClick(event) {
    event.stopPropagation();
    const targets = this.guideTargets;
    if (!targets || targets.length === 0) return;

    // 1. START State -> ONLY scroll + pulse the first pending target
    if (this.guideState === 'START') {
      // ---- OLD CODE (commented out): first REQUIRED empty field only ----
      // const firstPending = targets.find((p) => this._isPlaceholderPending(p));
      // ---- NEW CODE: first empty field (required or optional) ----
      const firstPending = targets.find((p) => !this._isPlaceholderComplete(p));
      // ---- END NEW CODE ----
      if (firstPending) {
        this.guideState = 'TARGET';
        this.guideTargetId = firstPending.id;
        this.guidePageNumber = firstPending.page;
        this._positionGuide();
        const targetEl = this.template.querySelector(`.placeholder-container[data-id="${firstPending.id}"]`);
        this._pulseAndScrollElement(targetEl);
        // NOTE: _activateTargetEntry is NOT called here per Revision 2
      } else {
        this.guideState = 'FINISH';
        const last = targets[targets.length - 1];
        this.guideTargetId = last.id;
        this.guidePageNumber = last.page;
        this._positionGuide();
      }
      return;
    }

    // ---- OLD CODE (commented out): FINISH click opened the preview modal ----
    // // 2. FINISH State -> Scroll to Proceed button, pulse it, and open confirmation modal
    // if (this.guideState === 'FINISH') {
    //   const btn = this.template.querySelector('.preview-confirmation-preview-button');
    //   if (btn) {
    //     this._pulseAndScrollElement(btn);
    //   }
    //   this.handlePreviewClick();
    //   return;
    // }
    // ---- NEW CODE: no fields left -> Next is disabled; signer clicks Review & submit ----
    if (this.guideState === 'FINISH') {
      return;
    }
    // ---- END NEW CODE ----

    // 3. TARGET State
    const current = this.currentGuideTarget;
    const isComplete = this._isPlaceholderComplete(current);

    // ---- OLD CODE (commented out): any empty target just re-opened, no error ----
    // if (!isComplete) {
    // ---- NEW CODE: REQUIRED empty -> error + highlight + open; OPTIONAL empty -> move on ----
    if (!isComplete && this._uiIsRequired(current)) {
      this.showToast('Required field', `Please fill ${this._uiFieldLabel(current)}.`, 'error');
      // ---- END NEW CODE ----
      // User clicked while already next to a PENDING target -> scroll, pulse, and activate entry
      const targetEl = this.template.querySelector(`.placeholder-container[data-id="${current.id}"]`);
      this._pulseAndScrollElement(targetEl);
      this._activateTargetEntry(current);
    } else {
      // Current target is complete -> NEXT branch: ONLY scroll + pulse the next pending target
      const currentIdx = this.guideCurrentIndex;
      // ---- OLD CODE (commented out): next REQUIRED empty field only ----
      // let nextPending = targets.slice(currentIdx + 1).find((p) => this._isPlaceholderPending(p));
      // ---- NEW CODE: next empty field ahead (required or optional); wrap-around below stays required-only ----
      let nextPending = targets.slice(currentIdx + 1).find((p) => !this._isPlaceholderComplete(p));
      // ---- END NEW CODE ----
      if (!nextPending) {
        // Wrap around from beginning
        nextPending = targets.slice(0, currentIdx).find((p) => this._isPlaceholderPending(p));
      }

      if (nextPending) {
        this.guideTargetId = nextPending.id;
        this.guidePageNumber = nextPending.page;
        this._positionGuide();
        const targetEl = this.template.querySelector(`.placeholder-container[data-id="${nextPending.id}"]`);
        this._pulseAndScrollElement(targetEl);
        // NOTE: _activateTargetEntry is NOT called here per Revision 2
      } else {
        // No pending fields left -> move to FINISH
        this.guideState = 'FINISH';
        const last = targets[targets.length - 1];
        this.guideTargetId = last.id;
        this.guidePageNumber = last.page;
        this._positionGuide();
      }
    }
  }

  /**
   * Handles clicks on signer PREVIOUS button.
   */
  handleGuidePrev(event) {
    event.stopPropagation();
    const targets = this.guideTargets;
    const currentIdx = this.guideCurrentIndex;
    if (!targets || currentIdx <= 0) return;

    const prevTarget = targets[currentIdx - 1];
    this.guideTargetId = prevTarget.id;
    this.guidePageNumber = prevTarget.page;
    this.guideState = 'TARGET';

    this._positionGuide();
    const targetEl = this.template.querySelector(`.placeholder-container[data-id="${prevTarget.id}"]`);
    this._pulseAndScrollElement(targetEl);
  }

  handleGuideWrapperClick(event) {
    event.stopPropagation();
  }

  // ==========================================================================
  // UI REDESIGN (2026-10-21): read-only getters for the new layout.
  // Everything below only reads existing state; no existing method is changed.
  // ==========================================================================

  _uiFieldLabel(ph) {
    if (!ph) return 'Field';
    if (ph.isCustom) return ph.label || 'Field';
    if (ph.isName) return 'First name';
    if (ph.isLastName) return 'Last name';
    if (ph.isInitials) return 'Title';
    if (ph.isNameInitials) return 'Initials';
    if (ph.isFullName) return 'Full name';
    if (ph.isEmail) return 'Email';
    if (ph.isContactNumber) return 'Contact number';
    if (ph.isAddress) return 'Address';
    if (ph.isABN) return 'ABN';
    if (ph.isDateOfSigning) return 'Date of signing';
    if (ph.isDate) return 'Date';
    if (ph.isSignature) return 'Signature';
    return ph.label || ph.type || 'Field';
  }

  // Same rule as _isPlaceholderPending()
  _uiIsRequired(ph) {
    // ---- OLD CODE (commented out): standard fields were always required ----
    // return ph.isCustom ? ph.required !== false : true;
    // ---- NEW CODE: every field respects the creator's Required toggle (missing flag = required) ----
    return !!ph && ph.required !== false;
    // ---- END NEW CODE ----
  }

  // 'current' | 'done' | 'required' | 'optional'
  _uiFieldStatus(ph) {
    if (this.guideState === 'TARGET' && ph.id === this.guideTargetId) return 'current';
    if (this._isPlaceholderComplete(ph)) return 'done';
    if (this._uiIsRequired(ph)) return 'required';
    return 'optional';
  }

  get uiRenderedPages() {
    return this.renderedPages.map((page) => ({
      ...page,
      placeholders: (page.placeholders || []).map((ph) => ({
        ...ph,
        uiLabel: this._uiFieldLabel(ph),
        uiContainerClass: `placeholder-container ui-field ui-field--${this._uiFieldStatus(ph)}`,
        // ---- NEW CODE: red * on required fields until they are filled ----
        // Skip: Date of signing (auto-filled, read-only) and checkboxes (never block)
        uiShowRequiredStar: this._uiIsRequired(ph) && !ph.hasImage &&
          !ph.isDateOfSigning && ph.dataType !== 'Boolean',
        uiRequiredStarClass: ph.isCustomLongText
          ? 'signer-required-star signer-required-star--top'
          : 'signer-required-star'
        // ---- END NEW CODE ----
      }))
    }));
  }

  // ---- NEW CODE: Next is disabled once there are no fields left to visit ----
  get isGuideNextDisabled() {
    return this.guideState === 'FINISH';
  }

  // ---- NEW CODE: Review & submit stays disabled until every required field is filled ----
  get isReviewSubmitDisabled() {
    return this.uiRequiredLeft > 0;
  }
  // ---- END NEW CODE ----

  get uiRequiredTotal() {
    return this.guideTargets.filter((ph) => this._uiIsRequired(ph)).length;
  }

  get uiRequiredDone() {
    return this.guideTargets.filter((ph) => this._uiIsRequired(ph) && this._isPlaceholderComplete(ph)).length;
  }

  get uiRequiredLeft() {
    return this.uiRequiredTotal - this.uiRequiredDone;
  }

  get uiProgressPercent() {
    const total = this.uiRequiredTotal;
    return total > 0 ? Math.round((this.uiRequiredDone / total) * 100) : 100;
  }

  get uiProgressBarStyle() {
    return `width: ${this.uiProgressPercent}%;`;
  }

  get uiProgressText() {
    const total = this.uiRequiredTotal;
    return total > 0 ? `${this.uiRequiredDone} of ${total} required fields` : 'No required fields';
  }

  get uiRequiredLeftText() {
    const left = this.uiRequiredLeft;
    if (left <= 0) return 'All required fields done';
    return `${left} required field${left === 1 ? '' : 's'} left`;
  }

  get uiGuideCounterText() {
    const total = this.guideTargets.length;
    const idx = this.guideCurrentIndex;
    if (this.guideState !== 'TARGET' || idx < 0 || total === 0) return '';
    return `${idx + 1} of ${total}`;
  }

  get uiHasGuideCounter() {
    return this.uiGuideCounterText !== '';
  }

  get uiMobileFieldText() {
    const counter = this.uiGuideCounterText;
    if (!counter) return this.uiRequiredLeftText;
    return `${this._uiFieldLabel(this.currentGuideTarget)} · field ${counter}`;
  }

  get uiThumbnails() {
    const targets = this.guideTargets;
    return (this.thumbnails || []).map((t) => {
      const onPage = targets.filter((ph) => Number(ph.page) === Number(t.page));
      const left = onPage.filter((ph) => this._isPlaceholderPending(ph)).length;
      let uiLeftText = 'No fields';
      let uiPillClass = 'ui-pill ui-pill--muted';
      if (left > 0) {
        uiLeftText = `${left} left`;
        uiPillClass = 'ui-pill ui-pill--required';
      } else if (onPage.length > 0) {
        uiLeftText = 'Done';
        uiPillClass = 'ui-pill ui-pill--done';
      }
      return { ...t, uiLeftText, uiPillClass };
    });
  }

  get uiFieldGroups() {
    const statusText = { current: 'Current', done: 'Done', required: 'Required', optional: 'Optional' };
    const groups = [];
    const byPage = new Map();
    this.guideTargets.forEach((ph) => {
      const page = Number(ph.page) || 1;
      if (!byPage.has(page)) {
        const group = { key: `ui-page-${page}`, pageLabel: `PAGE ${page}`, fields: [] };
        byPage.set(page, group);
        groups.push(group);
      }
      const status = this._uiFieldStatus(ph);
      byPage.get(page).fields.push({
        id: ph.id,
        key: `ui-field-${ph.id}`,
        label: this._uiFieldLabel(ph),
        statusText: statusText[status],
        rowClass: `ui-field-row ui-field-row--${status}`,
        pillClass: `ui-pill ui-pill--${status}`
      });
    });
    return groups;
  }

  // Same count as _promptApplySignatureToAll() uses to decide to show the popup
  get uiOtherSignatureText() {
    const left = (this.placeholders || []).filter(
      (p) => p.isSignature && p.id !== this._applySignatureSourceId && !p.hasImage
    ).length;
    if (left <= 0) return 'You have more signature fields in this document.';
    return `You have ${left} more signature field${left === 1 ? '' : 's'} in this document.`;
  }

  get uiApplyAllClass() {
    return this.isApplyChoiceAll ? 'apply-sig-option ui-option ui-option--selected' : 'apply-sig-option ui-option';
  }

  get uiApplyNoneClass() {
    return this.isApplyChoiceNone ? 'apply-sig-option ui-option ui-option--selected' : 'apply-sig-option ui-option';
  }

  get uiIsFirstPage() {
    return Number(this.currentPage) <= 1;
  }

  get uiIsLastPage() {
    return Number(this.currentPage) >= Number(this.totalPages);
  }

  get uiPrevFieldDisabled() {
    return !this.showPrevButton;
  }

  get uiReviewDetails() {
    return this.guideTargets
      .filter((ph) => !ph.isSignature)
      .map((ph) => {
        let value;
        if (ph.dataType === 'Boolean') {
          value = ph.checkedValue || ph.value === true || ph.value === 'true' ? 'Yes' : 'No';
        } else {
          const shown = ph.displayValue != null && ph.displayValue !== '' ? ph.displayValue : ph.value;
          value = shown != null ? String(shown).trim() : '';
        }
        const isEmpty = value === '';
        let emptyText = 'Not filled';
        if (isEmpty && !this._uiIsRequired(ph)) emptyText = 'Not filled (optional)';
        return {
          key: `ui-review-${ph.id}`,
          label: this._uiFieldLabel(ph),
          value: isEmpty ? emptyText : value,
          valueClass: isEmpty ? 'ui-kv-value ui-kv-value--empty' : 'ui-kv-value'
        };
      });
  }

  get uiReviewSignatureText() {
    const sigs = this.guideTargets.filter((ph) => ph.isSignature);
    const signed = sigs.filter((ph) => ph.hasImage).length;
    if (sigs.length === 0) return 'None in this document';
    return `${signed} of ${sigs.length} signed`;
  }
  // Review screen shows the Signatures section only when the document has signature fields
  get uiHasSignatureFields() {
    return this.guideTargets.some((ph) => ph.isSignature);
  }

  // Header title: the uploaded file's name (Offer_Template__c.File_Name__c)
  uiFileName = '';

  get uiDocumentTitle() {
    return this.uiFileName || 'Your document';
  }

  // Loads the name once, using the existing retrieveFileName(). Display only:
  // if it fails, the header keeps "Your document" and nothing else is affected.
  _uiLoadFileName() {
    if (this._uiFileNameRequested || !this.recordId) return;
    this._uiFileNameRequested = true;
    this.retrieveFileName()
      .then((name) => {
        this.uiFileName = name ? String(name).trim() : '';
      })
      .catch(() => {
        this.uiFileName = '';
      });
  }

  // Fields panel row click: scroll to the field and pulse it. Changes no state.
  handleUiFieldJump(event) {
    const id = event.currentTarget.dataset.uiFieldId;
    if (!id) return;
    const targetEl = this.template.querySelector(`.placeholder-container[data-id="${id}"]`);
    this._pulseAndScrollElement(targetEl);
  }

}