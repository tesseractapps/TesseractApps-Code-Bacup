import { LightningElement, track, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getClientDetails from '@salesforce/apex/ClientFundTransferHandler.getClientDetails';
import getClients from '@salesforce/apex/ClientFundTransferHandler.getClients'; //pdf
import createClient from '@salesforce/apex/ClientFundTransferHandler.createClient';
import updateClient from '@salesforce/apex/ClientFundTransferHandler.updateClient';
import getNDISData from '@salesforce/apex/ClientFundTransferHandler.getNDISData';
import getDraftQuotes from '@salesforce/apex/NDISQuoteController.getDraftQuotes';
import createQuoteHeader from '@salesforce/apex/NDISQuoteController.createQuoteHeader';
import getQuoteByIdWithLines from '@salesforce/apex/NDISQuoteController.getQuoteByIdWithLines';
import { refreshApex } from '@salesforce/apex';
import getNewContacts from '@salesforce/apex/NDISQuoteController.getNewContacts';
import getNewContactById from '@salesforce/apex/NDISQuoteController.getNewContactById';
import getOrganisation from '@salesforce/apex/ClientFundTransferHandler.getOrganisation'; //pdf
import fetchfundTracker from '@salesforce/apex/ClientFundTransferHandler.fetchfundTracker'; //pdf 
import jsPDF from '@salesforce/resourceUrl/jspdf';
import getQuoteData from '@salesforce/apex/NDISQuoteController.getQuoteData';
import saveQuotePdfUrl from '@salesforce/apex/NDISQuoteController.saveQuotePdfUrl';
import saveQuoteHeader from '@salesforce/apex/NDISQuoteController.saveQuoteHeader';
import saveLineItems from '@salesforce/apex/NDISQuoteController.saveLineItems';
import getQuoteById from '@salesforce/apex/NDISQuoteController.getQuoteById'; //pdf
import createNewContact from '@salesforce/apex/NDISQuoteController.createNewContact'; //Contacts part
import deleteLineItem from '@salesforce/apex/NDISQuoteController.deleteLineItem';
import { loadScript } from 'lightning/platformResourceLoader';
import autoTable from '@salesforce/resourceUrl/autotable';
import RobotoFont from '@salesforce/resourceUrl/Roboto';
import CLIENT_OBJECT from '@salesforce/schema/Client__c';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import deleteQuoteLineItem from '@salesforce/apex/NDISQuoteController.deleteQuoteLineItem'
import getQuoteRecipientEmail from '@salesforce/apex/NDISQuoteController.getQuoteRecipientEmail'

import { publish, MessageContext } from "lightning/messageService";
import TSIGN_MESSAGE_CHANNEL from "@salesforce/messageChannel/TsignMessageChannel__c";
import getQuoteDocumentRecords from '@salesforce/apex/tSignDocsController.getQuoteDocumentRecords';
import TeSignLogo from '@salesforce/resourceUrl/Te_sign';
import updateComments from '@salesforce/apex/tSignDocsController.updateComments';
import Send_Icon from '@salesforce/resourceUrl/Send_Icon';
import getComments from '@salesforce/apex/tSignDocsController.getComments';
import pdfjsLib from '@salesforce/resourceUrl/pdfJS';
import pdfWorker from '@salesforce/resourceUrl/pdfWorker';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';
import getTemplates from '@salesforce/apex/tSignDocsController.getTemplates';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
    //PDF
 const COLORS = {
    primary: [0, 112, 210],
    dark: [45, 45, 45],
    lightGray: [245, 246, 247],
    border: [200, 200, 200],
    success: [46, 132, 74],
    warning: [255, 183, 93],
    danger: [194, 57, 52]
};

const AWS_BASE = 'https://tesseractapps.com'; // no trailing slash
const ENDPOINTS = {
    delete: `${AWS_BASE}/delete-file`
};

export default class NdisQuoteTool extends LightningElement {
    // ---------------------------
    // Search + List Vars (unchanged)
    // ---------------------------
    @track richtextLable='Terms and Conditions';
    @track pdfReady = false;
    @track clientList = [];
    @track searchTerm = "";
    @track isLoading = false;
    @track hasError = false;
    @track errorMessage = "";
    @track allClients = [];
    @track filteredClients = [];
    @track pageClients = [];
    @track quotePdfUrl;
    // Pagination state
    @track pageNumber = 1;
    @track pageSize = 10;
    @track totalPages = 1;
    @track totalRecords = 0;
    @track paginationVisible = false;
    
    @track isModalOpen = false;
    @track name = "";
    @track role = "Participant";
    @track state = "";
    @track email = "";
    @track role = "";
    @track phone = "";
    @track organization = "";
    typingTimer;

    //new tracks
    @track draftQuotes = [];
    @track isDraftLoading = false;
    @track isQuoteDraftScreen =false;

     /* =========================
       SUB TABS (New Quote)
    ========================== */
    @track isParticipantsTab = true;
    @track isNewContactsTab = false;

    // NDIS catalogue (from getNDISData)
    @track catalogue = {};
    @track serviceTypeOptions = [];

    // Quote / builder state
    selectedState = null;
    selectedClient = null;
        @track newContactList = [];
        @track isLoadingNewContacts = false;
    @wire(MessageContext) context;
    @api recordId;
    @api orgId;          // from Dashboard lwc
    @api staffId;       // from Dashboard lwc
    @api superiorFlag; // from Dashboard lwc
    
    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;
 
    get logoUrl() {
        return this.tLogoUrl;
    }
 
    get imageUrl() {
        return this.tImageUrl;
    }
 
    // Header fields
    quoteHeaderId = null; // Id of existing NDIS_Quote__c header (if any)
    quoteNumber = '';
    quoteState = '';
    validFor = '30 days';
    serviceStart = '';
    serviceEnd = '';
    preparedBy = '';
    additionalNotes = '';
    termsAndConditions='';
    quoteJson='';
    //Quotepdf_Json__c

    //------//
    @track isNewQuoteScreen = true;   // default screen
    @track isMenuContainer = true;   // default screen
    
    @track isListScreen=true;
   @track isBuilderScreen=false;
   @track quoteHistoryScreen;
   @track isPreviewModalOpen = false;
   @track isPreviewHistory=false;
   @track builderMode = 'NEW';
   @track facilityId;
    //pdf
    organisation;
    quoteHeader;
    participant;

    totalApprovedAmount = 0;
    totalSpentFunds = 0;
    totalAvailableFunds = 0;
    remainingAfterQuote = 0;

   
    currentUrl;


    stateOptions = [
        { label: 'New South Wales', value: 'NSW__c' },
        { label: 'Victoria', value: 'VIC__c' },
        { label: 'Queensland', value: 'QLD__c' },
        { label: 'Western Australia', value: 'WA__c' },
        { label: 'South Australia', value: 'SA__c' },
        { label: 'Tasmania', value: 'TAS__c' },
        { label: 'Australian Capital Territory', value: 'ACT__c' },
        { label: 'Northern Territory', value: 'NT__c' }
    ];
    roleList=[
    { label: 'Participant', value: 'Participant' },
    { label: 'Parent / Guardian', value: 'Parent / Guardian' },
    { label: 'Support Coordinator', value: 'Support Coordinator' },
    { label: 'Plan Manager', value: 'Plan Manager' },
    { label: 'Other', value: 'Other' }
    ];

    // map UI state code -> catalogue price key (full state label)
    stateKeyMap = {
        'NSW__c': 'New South Wales',
        'VIC__c': 'Victoria',
        'QLD__c': 'Queensland',
        'WA__c': 'Western Australia',
        'SA__c': 'South Australia',
        'TAS__c': 'Tasmania',
        'ACT__c': 'Australian Capital Territory',
        'NT__c': 'Northern Territory'
    };
        stateLabelToValueMap = {
        'New South Wales': 'NSW__c',
        'Victoria': 'VIC__c',
        'Queensland': 'QLD__c',
        'Western Australia': 'WA__c',
        'South Australia': 'SA__c',
        'Tasmania': 'TAS__c',
        'Australian Capital Territory': 'ACT__c',
        'Northern Territory': 'NT__c'
    };

    validForOptions = [
    { label: '7 days',  value: '7 days' },
    { label: '14 days', value: '14 days' },
    { label: '30 days', value: '30 days' },
    { label: '60 days', value: '60 days' },
    { label: '90 days', value: '90 days' }
];

    //PDF 
jsPDFInitialized = false;
    // constants same as Apex (keep in sync)
    WEEKS_PER_MONTH = 4.333;
    DAYS_PER_WEEK = 7;
    DAYS_PER_MONTH = 30.416;
    ONEOFF_PER_WEEK = 0.01931;
    ONEOFF_PER_MONTH = 0.08328;

    // Get object metadata (unchanged)
    @wire(getObjectInfo, { objectApiName: CLIENT_OBJECT })
    clientMetadata;

    // Wire to load catalogue
    @wire(getNDISData)
    wiredData({ data, error }) {
        if (data) {
            this.catalogue = data.catalogue || {};
            // Populate Service Type dropdown
            this.serviceTypeOptions = Object.keys(this.catalogue).map(type => ({
                label: type,
                value: type
            }));
        } else if (error) {
            console.error('Error loading NDIS data:', error);
        }
    }

    /* =========================
       TAB BUTTON VARIANTS
       (purely UI)
    ========================== */
    get participantsTabVariant() {
        return this.isParticipantsTab ? 'brand' : 'neutral';
    }

    get newContactsTabVariant() {
        return this.isNewContactsTab ? 'brand' : 'neutral';
    }

    
    get newQuoteClass() {
    return this.isNewQuoteScreen ? 'menu-item1' : 'menu-item';
}

get quoteDraftClass() {
    return this.isQuoteDraftScreen ? 'menu-item1' : 'menu-item';
}

get tSignClass() {
    return this.isTSignHistoryScreen ? 'menu-item1' : 'menu-item';
}


    //-----------------New Changes-------------------//
        resetScreens() {
    this.isListScreen = false;
    this.isNewQuoteScreen=false;
    this.isBuilderScreen = false;
    this.quoteHistoryScreen = false;
    this.isPreviewHistory = false;
    this.isQuoteDraftScreen = false;
    this.isTSignHistoryScreen = false;

    console.log('🔄 Screens reset');
}

 resetSubTabs() {
        this.isParticipantsTab = false;
        this.isNewContactsTab = false;
    }

/* =========================
       TOP TAB HANDLERS
    ========================== */
    handleNewQuoteClick() {
         this.lastScreen = 'NEW_QUOTE'; 
        this.resetScreens();
        this.resetSubTabs();
        this.lastScreen = 'NEW_QUOTE'; 
        this.isNewQuoteScreen = true;
        this.isParticipantsTab = true;
        this.isPreviewModalOpen=false;
        this.isBuilderScreen=false;
        this.resetPagination();
         this.loadClients();
    }




    // ============================
    // Client list / modal (unchanged)
    // ============================
    pageSizeOptions = [10, 20, 50, 100];

    // get bDisableFirst() { return this.pageNumber === 1; }
    // get bDisableLast() { return this.pageNumber === this.totalPages; }

  async  connectedCallback() {

        const storedFacilityId = localStorage.getItem('defaultFacilityId');
        const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');
        this.facilityId = storedFacilityId;
        console.log('storedFacilityId >>', storedFacilityId);
        console.log('storedFacilityLabel >>', storedFacilityLabel);

        this.loadClients();
         console.log('TeSignLogo URL:', this.logo);
        console.log('📌 Received Org ID:', this.orgId);
        this.fetchDocumentRecords();
        //this.startPolling();
//removed settimeout 
        this.loadPdfLibraries()
            .then(() => {
                console.log('PDF.js and worker script loaded successfully');
            })
            .catch((error) => {
                console.error('Error loading PDF libraries:', error);
                this.handleError('Failed to load PDF libraries.', error);
            });
    try {
        await loadScript(this, jsPDF);
        await loadScript(this, autoTable);
        await loadScript(this, RobotoFont);

        if (window.jspdf && window.callAddFont) {
            window.jspdf.jsPDF.API.events.push([
                'addFonts',
                window.callAddFont
            ]);
        }

        this.pdfReady = true;
        console.log('✅ PDF libs ready (connectedCallback)');
    } catch (e) {
        console.error('❌ PDF load failed', e);
        this.pdfReady = false;
    }
    


    }

  /* =====================================================
   PARTICIPANT → BUILDER WIRING
   (NO data loading, NO save logic)
===================================================== */

// handleParticipantSelect(event) {
//     const participantId = event.target.dataset.id;

//     console.log('👤 Participant selected:', participantId);

//     this.selectedEntityId = participantId;
//     this.selectedEntityType = 'PARTICIPANT';

//     // Switch screen
//     this.resetMainScreens();
//     this.isQuoteBuilderScreen = true;

//     this.logScreenState('Builder (Participant)');
// }


    //RESET AND SHOW HELPER
    openBuilder() {
         if (this.builderMode === 'NEW') {
       // this.resetBuilderState?.();
       this.resetScreens();
    }
   // this.resetScreens();          // hide all other screens
    this.isBuilderScreen = true;  // show builder

    console.log('🧭 Builder opened in mode:', this.builderMode);
    }

resetQuoteHeader() {
    
    this.quoteNumber = '';
    this.state = '';
    this.quoteState=''; 
    this.validFor = '30 days';
    this.serviceStart = '';
    this.serviceEnd = '';
    this.preparedBy = '';
    this.additionalNotes = '';
    this.termsAndConditions = '';
    this.quotePdfUrl = null;
    this.quoteJson = '';
}
generateQuoteNumber() {
    const now = new Date();

    const yyyy = now.getFullYear();
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    return `Q-${yyyy}-${dd}${hh}${ss}`;
}

@track clientflag=false;
@track resetflag=false;
    handleParticipantSelect(event) {
    const clientId = event.target.dataset.id;
        this.builderMode = 'NEW'; 
        this.lastScreen = 'NEW_QUOTE';  //Static value
    console.log('🆕 New Quote → Participant selected:', clientId);
    this.resetflag=true;

    this.selectedEntityId = clientId;
    this.selectedEntityType = 'PARTICIPANT';
    this.isMenuContainer = false;

    // IMPORTANT: selectedClient is used in Builder UI
    this.selectedClient = this.clientList.find(c => c.Id === clientId);
    this.clientflag=true;
    this.contactflag=false;

    // Reset builder-only state
     this.resetQuoteHeader();
    this.resetBuilderState?.();
    this.quoteNumber = this.generateQuoteNumber();
console.log('🆔 Generated Quote Number:', this.quoteNumber);
    // 🔑 Correct screen switch
    // this.resetScreens();
    // this.isBuilderScreen = true;
    this.openBuilder();
       
    console.log('✅ Builder opened EMPTY for new quote');
}


/* =====================================================
   NEW QUOTE → PARTICIPANT SELECT
   (EMPTY BUILDER ALWAYS)
===================================================== */

        // handleParticipantSelect(event) {
        //     const clientId = event.target.dataset.id;

        //     console.log('🆕 New Quote → Participant selected:', clientId);

        //     this.selectedEntityId = clientId;
        //     this.selectedEntityType = 'PARTICIPANT';

        //     // Reset ONLY builder state (not loading data)
        //     this.resetBuilderState?.();

        //     // Switch screen
        //     this.resetScreens();
        //     this.isBuilderScreen = true;

        //     // Clear quote header fields explicitly
        //     this.quoteHeaderId = null;
        //     this.quoteNumber = '';
        //     this.quoteState = '';
        //     this.validFor = '30 days';
        //     this.serviceStart = '';
        //     this.serviceEnd = '';
        //     this.preparedBy = '';
        //     this.additionalNotes = '';
        //     this.quotePdfUrl = null;
        //     this.quoteSupportItems = [];

        //     console.log('✅ Builder opened EMPTY for new quote');
        // }





// renderedCallback() {
//     if (this.jsPDFInitialized) {
//         return;
//     }

//     this.jsPDFInitialized = true;

//     Promise.all([
//         loadScript(this, jsPDF),
//         loadScript(this, autoTable),
//         loadScript(this, RobotoFont)
//     ])
//     .then(() => {
//         const jsPDFConstructor = window.jspdf?.jsPDF;
//         if (!jsPDFConstructor) {
//             throw new Error('jsPDF not loaded');
//         }

//         if (!jsPDFConstructor.API.autoTable) {
//             throw new Error('autoTable not attached to jsPDF');
//         }

//         // 🔑 CRITICAL PATCH (THIS FIXES YOUR ERROR)
//         if (!jsPDFConstructor.prototype.autoTable) {
//             jsPDFConstructor.prototype.autoTable =
//                 jsPDFConstructor.API.autoTable;
//         }

//         // Register custom fonts
//         if (window.callAddFont) {
//             jsPDFConstructor.API.events.push([
//                 'addFonts',
//                 window.callAddFont
//             ]);
//         }

//         this.pdfReady = true;
//         console.log('✅ jsPDF + autoTable + fonts fully ready');
//     })
//     .catch(e => {
//         console.error('❌ PDF lib load error', e);
//         this.pdfReady = false;
//     });
// }

// async renderedCallback() {
//     if (this.jsPDFInitialized) {
//         return;
//     }
//     this.jsPDFInitialized = true;

//     try {
//         // 1️⃣ Load jsPDF FIRST (must be first)
//         await loadScript(this, jsPDF);

//         // 2️⃣ THEN load autoTable (plugin attaches itself)
//         await loadScript(this, autoTable);

//         // 3️⃣ THEN load fonts
//         await loadScript(this, RobotoFont);

//         // 4️⃣ Register fonts (same as working LWC)
//         if (window.jspdf && window.callAddFont) {
//             window.jspdf.jsPDF.API.events.push([
//                 'addFonts',
//                 window.callAddFont
//             ]);
//         }

//         // 5️⃣ Final sanity check (optional, for confidence)
//         const { jsPDF: JsPDFCtor } = window.jspdf;
//         const testDoc = new JsPDFCtor();

//         console.log(
//             '✅ autoTable exists:',
//             typeof testDoc.autoTable === 'function'
//         );

//         this.pdfReady = true;
//         console.log('✅ jsPDF + autoTable + fonts ready');

//     } catch (e) {
//         console.error('❌ PDF lib load error', e);
//         this.pdfReady = false;
//     }
// }


   

//     loadClients(search = "") {
//     this.isLoading = true;
//     getClientDetails({ searchTerm: search })
//         .then(result => {
//             console.log('result', JSON.stringify(result));
//              console.log('result length..', result.length);
//             this.clientList = JSON.parse(JSON.stringify(result.map(r => {
//                 const first = r.First_Name__c || '';
//                 const last = r.Last_Name__c || '';
//                  const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || r.Name?.substring(0, 2).toUpperCase();
//                  const quoteIds = r.NDIS_Quotes__r?.[0]?.Id;
//                  console.log('quoteId',quoteIds);

//                 return {
//                     ...r,
//                     fullName: `${first} ${last}`.trim() || r.Name,
//                     initials: initials,
//                     qid: quoteIds
//                 };
//             })
//         ));

//             this.filteredClients = JSON.parse(JSON.stringify(this.clientList));
//             console.log('this.filteredClients',this.filteredClients);
//              this.pageNumber = 1;      // ✅ FIX
//             this.paginationHelper();
//         })  

//         .catch(err => {
//             console.error(err);
//         })
//         .finally(() => this.isLoading = false);
//  }

loadClients(search = "") {
    this.isLoading = true;
    console.log('facilityId IN loadClients:', this.facilityId);

    getClientDetails({
        searchTerm: search,
        facilityId: this.facilityId
    })
        .then(result => {
            console.log('result IN loadClients', JSON.stringify(result));

           const filteredByFacility = (result || []).filter(r =>
                r.Participant_Facilities__r &&
                r.Participant_Facilities__r.some(
                    pf => pf.Facility__c === this.facilityId
                )
            );

            this.clientList = filteredByFacility.map(r => {
                const displayName = r.Company__c
                    ? r.Company__c
                    : `${r.First_Name__c || ''} ${r.Last_Name__c || ''}`.trim();

                const initials = displayName
                    ? displayName.substring(0, 2).toUpperCase()
                    : 'NA';

                const quoteId = r.NDIS_Quotes__r?.[0]?.Id || null;

                return {
                    ...r,
                    displayName,
                    fullName: displayName,
                    initials,
                    ndisNumber: r.NDIS_Participant_ID__c || '',
                    qid: quoteId
                };
            });

            this.filteredClients = [...this.clientList];
              console.log('records IN PAGNATION ' +JSON.stringify(this.filteredClients));
            this.pageNumber = 1;
            this.paginateParticipants();

            console.log(
                'Final clientList:',
                this.clientList.map(c => ({
                    Id: c.Id,
                    Name: c.displayName
                }))
            );
        })
        .catch(error => {
            console.error('❌ Error in loadClients:', error);
            this.clientList = [];
            this.filteredClients = [];
        })
        .finally(() => {
            this.isLoading = false;
        });
}


    handleClientSelect(event) {
    const clientId = event.target.dataset.id;

    const client = this.clientList.find(c => c.Id === clientId);
    if (!client) return;

    // 🔑 THIS IS THE MISSING LINK
    this.selectedEntityType = 'PARTICIPANT';
    this.participant = client;

    console.log('✅ Participant set for PDF:', this.participant);
}

//         paginationHelper() {
//     const records = Array.isArray(this.filteredClients) ? this.filteredClients : [];

//     this.totalRecords = records.length;
//     this.totalPages = this.pageSize > 0
//         ? Math.ceil(this.totalRecords / this.pageSize)
//         : 1;

//     this.paginationVisible = this.totalPages > 1;

//     if (this.totalRecords === 0) {
//         this.pageClients = [];
//         return;
//     }

//     if (this.pageNumber < 1) this.pageNumber = 1;
//     if (this.pageNumber > this.totalPages) this.pageNumber = this.totalPages;

//     const startIndex = (this.pageNumber - 1) * this.pageSize;
//     const endIndex = startIndex + this.pageSize;

//     this.pageClients = records.slice(startIndex, endIndex);
// }

// paginationHelper() {
//     const records = Array.isArray(this.filteredClients)
//         ? this.filteredClients
//         : [];

//     this.totalRecords = records.length;
//     this.totalPages = Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
//     this.paginationVisible = this.totalPages > 1;

//     if (this.pageNumber < 1) this.pageNumber = 1;
//     if (this.pageNumber > this.totalPages) this.pageNumber = this.totalPages;

//     const startIndex = (this.pageNumber - 1) * this.pageSize;
//     const endIndex = startIndex + this.pageSize;

//     this.pageClients = records.slice(startIndex, endIndex);
// }


//         paginateParticipants() {
//     const records = Array.isArray(this.filteredClients)
//         ? this.filteredClients
//         : [];

//     this.totalRecords = records.length;
    
//     this.totalPages =
//         this.pageSize > 0
//             ? Math.ceil(this.totalRecords / this.pageSize)
//             : 1;

//     this.paginationVisible = this.totalRecords > 0;

//     if (this.pageNumber < 1) this.pageNumber = 1;
//     if (this.pageNumber > this.totalPages) this.pageNumber = this.totalPages;

//     const start = (this.pageNumber - 1) * this.pageSize;
//     const end = this.pageNumber * this.pageSize;

//     this.pageClients = records.slice(start, end);
// }

paginateParticipants() {
    const records = Array.isArray(this.filteredClients)
        ? this.filteredClients
        : [];
  console.log('records IN PAGNATION ' +JSON.stringify(records));
    this.totalRecords = records.length;
    this.paginationVisible = this.totalRecords > 0;

    this.totalPages =
        this.pageSize > 0
            ? Math.ceil(this.totalRecords / this.pageSize)
            : 1;

    // Clamp page number
    if (this.pageNumber <= 1) {
        this.pageNumber = 1;
    } else if (this.pageNumber >= this.totalPages) {
        this.pageNumber = this.totalPages;
    }

    // 🔑 BUILD NEW ARRAY + NEW OBJECTS (KEY FIX)
    let tempList = [];
    for (
        let i = (this.pageNumber - 1) * this.pageSize;
        i < this.pageNumber * this.pageSize;
        i++
    ) {
        if (i === this.totalRecords) break;

        tempList.push({ ...records[i] });
    }

    this.pageClients = tempList;
}
    @track pageNewContacts = [];
    @track totalNewContacts = 0;

    //NEW Contacts Pagenation
    @track totalRecordsContact;
    paginateNewContacts() {
    const records = Array.isArray(this.newContactList)
        ? this.newContactList
        : [];

    this.totalNewContacts = records.length;
   // this.totalRecords = this.totalNewContacts; // reuse footer badge
   this.totalRecordsContact = this.totalNewContacts; 
    this.paginationVisible = this.totalNewContacts > 0;

    this.totalPages =
        this.pageSize > 0
            ? Math.ceil(this.totalNewContacts / this.pageSize)
            : 1;

    // Clamp page number
    if (this.pageNumber <= 1) {
        this.pageNumber = 1;
    } else if (this.pageNumber >= this.totalPages) {
        this.pageNumber = this.totalPages;
    }

    // 🔑 Build fresh array + fresh objects
    let tempList = [];
    for (
        let i = (this.pageNumber - 1) * this.pageSize;
        i < this.pageNumber * this.pageSize;
        i++
    ) {
        if (i === this.totalNewContacts) break;
        tempList.push({ ...records[i] });
    }

    this.pageNewContacts = tempList;
}

//DRAFTS PAGENATION

    // paginateDraftQuotes() {
    //     const records = Array.isArray(this.draftQuotes)
    //         ? this.draftQuotes
    //         : [];

    //     this.totalDraftQuotes = records.length;
    //     this.totalRecords = this.totalDraftQuotes;
    //     this.paginationVisible = this.totalDraftQuotes > 0;

    //     this.totalPages =
    //         this.pageSize > 0
    //             ? Math.ceil(this.totalDraftQuotes / this.pageSize)
    //             : 1;

    //     // Clamp page number
    //     if (this.pageNumber <= 1) {
    //         this.pageNumber = 1;
    //     } else if (this.pageNumber >= this.totalPages) {
    //         this.pageNumber = this.totalPages;
    //     }

    //     // Build paged list (fresh objects)
    //     let tempList = [];
    //     for (
    //         let i = (this.pageNumber - 1) * this.pageSize;
    //         i < this.pageNumber * this.pageSize;
    //         i++
    //     ) {
    //         if (i >= this.totalDraftQuotes) break;
    //         tempList.push({ ...records[i] });
    //     }

    //     this.pageDraftQuotes = tempList;

    //     // 🔍 TEMP DEBUG (remove later)
    //     console.log(
    //         '📄 Draft pagination:',
    //         'total=', this.totalDraftQuotes,
    //         'page=', this.pageNumber,
    //         'shown=', this.pageDraftQuotes.length
    //     );
    // }
//drafts
    draftPageNumber = 1;
draftPageSize = 10;
draftTotalRecords = 0;
draftTotalPages = 0;
pageDraftQuotes = [];
// paginateDraftQuotes() {
//     const records = Array.isArray(this.draftQuotes) ? this.draftQuotes : [];

//     this.draftTotalRecords = records.length;
//     this.draftTotalPages = Math.max(
//         1,
//         Math.ceil(this.draftTotalRecords / this.draftPageSize)
//     );

//     if (this.draftPageNumber < 1) {
//         this.draftPageNumber = 1;
//     } else if (this.draftPageNumber > this.draftTotalPages) {
//         this.draftPageNumber = this.draftTotalPages;
//     }

//     const start = (this.draftPageNumber - 1) * this.draftPageSize;
//     const end = start + this.draftPageSize;

//     this.pageDraftQuotes = records.slice(start, end);
// }

paginateDraftQuotes() {
    const records = Array.isArray(this.draftQuotes)
        ? this.draftQuotes
        : [];

    // 🔑 Total counts (DRAFT-ONLY)
    this.draftTotalRecords = records.length;
    this.paginationVisible = this.draftTotalRecords > 0;

    this.draftTotalPages =
        this.draftPageSize > 0
            ? Math.ceil(this.draftTotalRecords / this.draftPageSize)
            : 1;

    // 🔑 Clamp page number
    if (this.draftPageNumber <= 1) {
        this.draftPageNumber = 1;
    } else if (this.draftPageNumber >= this.draftTotalPages) {
        this.draftPageNumber = this.draftTotalPages;
    }

    // 🔑 Build fresh array + fresh objects (IMPORTANT)
    let tempList = [];
    for (
        let i =
            (this.draftPageNumber - 1) * this.draftPageSize;
        i <
        this.draftPageNumber * this.draftPageSize;
        i++
    ) {
        if (i === this.draftTotalRecords) break;
        tempList.push({ ...records[i] });
    }

    this.pageDraftQuotes = tempList;
}


draftFirstPage() {
    this.draftPageNumber = 1;
    this.paginateDraftQuotes();
}

draftPreviousPage() {
    if (this.draftPageNumber > 1) {
        this.draftPageNumber--;
        this.paginateDraftQuotes();
    }
}

draftNextPage() {
    if (this.draftPageNumber < this.draftTotalPages) {
        this.draftPageNumber++;
        this.paginateDraftQuotes();
    }
}

draftLastPage() {
    this.draftPageNumber = this.draftTotalPages;
    this.paginateDraftQuotes();
}
handleDraftRecordsPerPage(event) {
    this.draftPageSize = Number(event.target.value);
    this.draftPageNumber = 1;
    this.paginateDraftQuotes();
}

    firstPage() {
    this.pageNumber = 1;
   if (this.isParticipantsTab) {
        this.paginateParticipants();
    } else if (this.isNewContactsTab) {
        this.paginateNewContacts();
    } 
    // else if (this.isQuoteDraftScreen) {
    //     this.paginateDraftQuotes();
    // }
}

previousPage() {
    if (!this.isFirstPage) {
        this.pageNumber--;

         if (this.isParticipantsTab) {
            this.paginateParticipants();
        } else if (this.isNewContactsTab) {
            this.paginateNewContacts();
        } 
       
        else {
        // legacy T-Sign
        const records = this.getCurrentDataArray();
        this.sortDocuments(records);
        this.paginateRecords(records);
    }
    }
}

nextPage() {
    if (!this.isLastPage) {
        this.pageNumber++;

         if (this.isParticipantsTab) {
            this.paginateParticipants();
        } else if (this.isNewContactsTab) {
            this.paginateNewContacts();
        } 
        // else if (this.isQuoteDraftScreen) {
        //     this.paginateDraftQuotes();
        // }
        else {
        // legacy T-Sign
        const records = this.getCurrentDataArray();
        this.sortDocuments(records);
        this.paginateRecords(records);
    }
    }
}

lastPage() {
    this.pageNumber = this.totalPages;

     if (this.isParticipantsTab) {
            this.paginateParticipants();
        } else if (this.isNewContactsTab) {
            this.paginateNewContacts();
        }
        // else if (this.isQuoteDraftScreen) {
        //     this.paginateDraftQuotes();
        // }
        else {
        // legacy T-Sign
        const records = this.getCurrentDataArray();
        this.sortDocuments(records);
        this.paginateRecords(records);
    }
}

// handleRecordsPerPage(event) {
//     this.pageSize = Number(event.target.value);
//     this.pageNumber = 1;   // 🔑 mandatory
//     this.paginateParticipants();
// }

        // handleRecordsPerPage(event) {
        //     this.pageSize = parseInt(event.target.value, 10);
        //     this.pageNumber = 1;
        //     this.paginationHelper();
        // }


    // firstPage() { this.pageNumber = 1; this.paginationHelper(); }
    // previousPage() { if (this.pageNumber > 1) { this.pageNumber--; this.paginationHelper(); } }
    // nextPage() { if (this.pageNumber < this.totalPages) { this.pageNumber++; this.paginationHelper(); } }
    // lastPage() { this.pageNumber = this.totalPages; this.paginationHelper(); }
    // handleRecordsPerPage(event) { this.pageSize = parseInt(event.target.value, 10); this.pageNumber = 1; this.paginationHelper(); }

    // Search handlers
    handleSearchChange(event) { this.searchTerm = event.target.value; }
    performSearch() { this.loadClients(this.searchTerm); }
    handleSearchKey(event) {
        this.searchTerm = event.target.value;
        // clearTimeout(this.typingTimer);
        // this.typingTimer = setTimeout(() => this.performSearch(), 300);
        this.loadClients(this.searchTerm);
    }

    // ---------------------------
    // Client modal handlers (unchanged)
    // ---------------------------
    handleNewContact() { 
        this.openModalForNew();
     }
    closeModal() { 
        this.resetNewContactForm();

        this.isModalOpen = false;
     }
   // @track isModalOpen = false;
    @track modalTitle = "New Contact";
    clientId = null;
    openModalForNew() {
        this.isModalOpen = true;
        this.modalTitle = "New Contact";
        this.clientId = null;
        this.name = this.email = this.phone = this.state = this.organization = '';
    }

    openModalForEdit(event) {
        this.isModalOpen = true;
        this.modalTitle = "Edit Contact";
        this.clientId = event.target.dataset.id;
        getClients({ clientId: this.clientId })
            .then(result => {
                this.name = result.Name;
                this.email = result.Email__c;
                this.phone = result.Contact_Number__c;
                this.quoteState = result.State__c;
                this.organization = result.Organization_Name__c;
            })
            .catch(error => console.error(error));
    }

    handleNameChange(event) { this.name = event.target.value; }
    handleEmailChange(event) { this.email = event.target.value; }
    handlePhoneChange(event) { this.phone = event.target.value; }
   handleStateChange(event) { this.state = event.detail.value; }
    handleOrgChange(event) { this.organization = event.target.value; }
    handleRoleChange(event) { this.role = event.detail.value; }

    validateRequiredContactFields() {

    let isValid = true;

    const fields = this.template.querySelectorAll(
        'lightning-input, lightning-combobox'
    );

    fields.forEach(field => {
        if (field.required) {
            field.reportValidity();
            if (!field.checkValidity()) {
                isValid = false;
            }
        }
    });

    return isValid;
}
extractErrorMessage(error) {

    if (!error) return 'Unknown error occurred';

    // LDS / imperative Apex shape
    if (error.body) {

        if (Array.isArray(error.body)) {
            return error.body.map(e => e.message).join(', ');
        }

        if (typeof error.body.message === 'string') {
            return error.body.message;
        }
    }

    if (error.message) {
        return error.message;
    }

    return 'Unexpected server error';
}

resetNewContactForm() {
    this.name = '';
    this.email = '';
    this.phone = '';
    this.state = null;
    this.role = null;

    // 🔥 also clear validation UI
    const fields = this.template.querySelectorAll(
        'lightning-input, lightning-combobox'
    );

    fields.forEach(field => {
        field.value = null;
        field.setCustomValidity('');
        field.reportValidity();
    });
}



    handleSave() {

        const inputsValid = this.validateRequiredContactFields();

    if (!inputsValid) {
        console.warn('⛔ Save blocked — required fields missing');
        return;
    }

        const STATE_CODE_TO_LABEL = {
                    NSW__c: 'New South Wales',
                    VIC__c: 'Victoria',
                    QLD__c: 'Queensland',
                    WA__c: 'Western Australia',
                    SA__c: 'South Australia',
                    TAS__c: 'Tasmania',
                    ACT__c: 'Australian Capital Territory',
                    NT__c: 'Northern Territory'
                };
                const stateCode = this.state || this.quoteState; // e.g. WA__c
    const stateLabel = STATE_CODE_TO_LABEL[stateCode]; // Western Australia

    console.log('Saving state →', stateCode, '→', stateLabel);
        //         const stateLabel =
        // STATE_CODE_TO_LABEL= this.state;    
                    
        const newContact = {
            Name: this.name,
            Email__c: this.email,
            Phone__c: this.phone,
           // State__c: this.state || this.quoteState,
            Role__c: this.role,
            State__c: stateLabel,
            Organization_Name__c: this.organization,
        // Facility__c: this.facili
        };
         console.log('newContact..',JSON.stringify(newContact));
        createNewContact({ newCon: newContact })
            .then(saved => {

                this.showToast(
            'Success',
            'New Contact created successfully.',
            'success'
        );
                this.closeModal();
                this.builderMode = 'NEW';   // Static
                // Set context for builder
                this.selectedEntityId = saved.Id;
                this.selectedEntityType = 'NEW_CONTACT';

                // Open EMPTY builder
            // this.resetMainScreens();
           // handleNewContactsTabClick();
            this.isNewContactsTab = true;
            this.isParticipantsTab = false;
       // this.isParticipantsTab = false;
            // this.isQuoteBuilderScreen = true;
            //  this.resetScreens();
            //  this.isBuilderScreen =true;
           // this.openBuilder();
           this.loadNewContacts();
           this.resetNewContactForm();



                console.log('🆕 New Contact → EMPTY Builder', saved.Id);
            })
            .catch(err => {

        console.error('❌ Failed to create New Contact', err);

        const message = this.extractErrorMessage(err);

        // ❌ ERROR TOAST
        this.showToast(
            'Error',
            message,
            'error'
        );
    });
}

/* =====================================================
   NEW QUOTE → EXISTING NEW CONTACT SELECT
   (EMPTY BUILDER ALWAYS)
===================================================== */
 selectedContact;
handleNewContactSelect(event) {
    const newContactId = event.target.dataset.id;

    console.log('🆕 Existing New Contact selected:', newContactId);
   

    // IMPORTANT: selectedClient is used in Builder UI
    this.selectedContact = this.newContactList.find(c => c.Id === newContactId);
    this.contactflag=true;
    this.clientflag=false;
    this.isMenuContainer = false;

    console.log('this.selectedContact',JSON.stringify(this.selectedContact));

    // const contact = this.newContactList.find(
    //     c => c.Id === contactId
    // );

    // if (!contact) return;

    // //  THIS IS THE MISSING PIECE
    // this.selectedClient = {
    //     fullName: contact.Name,
    //     Email__c: contact.Email__c,
    //     Contact_Number__c: contact.Phone__c,
    //     NDIS_Number__c: contact.NDIS_Number__c || ''
    // };



    // 🔑 HARD RESET of participant context
    this.selectedClient = null;          // ⛔ CRITICAL
    this.selectedQuoteId = null;
    this.quoteid = null;
    this.builderMode = 'NEW'; 
    this.selectedEntityId = newContactId;
    this.selectedEntityType = 'NEW_CONTACT';

    // Reset builder state if helper exists
    this.resetBuilderState?.();

    // Switch screen
   // this.resetMainScreens();

        
   // this.isQuoteBuilderScreen = true;
    //  this.resetScreens();
    //  this.isBuilderScreen =true;
    this.quoteNumber = this.generateQuoteNumber();
console.log('🆔 Generated Quote Number:', this.quoteNumber);
   this.openBuilder();


    console.log('✅ Builder opened EMPTY for New Contact');
   // this.logScreenState('Builder (New Contact)');
}


    // updateClientInList(updated) {
    //     this.clientList = this.clientList.map(c => c.Id === updated.Id ? updated : c);
    // }

    intervalOptions = [
    { label: "Daily", value: "Daily" },
    { label: "Weekly", value: "Weekly" },
    { label: "Fortnightly", value: "Fortnightly" },
    { label: "Monthly", value: "Monthly" },
    { label: "One-off", value: "One-off" }
];

durationPeriodOptions = [
    { label: "Weeks", value: "Weeks" },
    { label: "Months", value: "Months" }
];

    @track isQuoteLoading = false;
//     handleOpenBuilder(event) {
//              //   this.resetScreens();
//               //   this.isBuilderScreen=true;

//     //  BUILDER MODE GUARD 
//     // if (this.builderMode === 'NEW') {
//     //     console.log('🆕 Initializing EMPTY builder (skip edit load)');

//     //     this.resetBuilderState?.();

//     //     // Open builder UI ONLY
//     //     this.openBuilder();

//     //     return; // CRITICAL: stop edit-mode logic
//     // }


//    // 🔒 NEW CONTACT / NEW QUOTE GUARD
//     if (this.builderMode === 'NEW' && this.selectedEntityType === 'NEW_CONTACT') {
//         console.log('🆕 New Contact selected → open EMPTY builder');

//         this.resetBuilderState?.();
//         this.openBuilder();
//         return; // ⛔ STOP here — do NOT touch clientList
//     }


//               //  this.openBuilder();
//         this.isListScreen = false;
       
//         this.quoteHistoryScreen=false;
//         this.DAYS_PER_MONTH;

//         const clientId = event.target.dataset.id;
//         this.quoteid=event.target.dataset.quoteid;
//         console.log('this.quoteid',this.quoteid);
//         this.isQuoteLoading = true; // 🔴 START loading

//         this.selectedClient = this.clientList.find(c => c.Id === clientId);

//         if (!this.selectedClient && result.quote) {
//     this.selectedClient = {
//         fullName: result.quote.Contact_Name__c,
//         Email__c: result.quote.Contact_Email__c,
//         Contact_Number__c: result.quote.Contact_Phone__c,
//         NDIS_Number__c: result.quote.NDIS_Number__c
//     };
// }

    handleOpenBuilder(event) {

    /* =========================
       NEW MODE (both entities)
    ========================== */
     this.quoteid=event.target.dataset.quoteid;
        console.log('this.quoteid',this.quoteid);

    if (this.builderMode === 'NEW') {
        this.resetBuilderState?.();
        this.openBuilder();
        return;
    }

    /* =========================
       EDIT MODE (quote-centric)
    ========================== */
    const quoteId = event.target.dataset.quoteid;
    if (!quoteId) {
        console.error('❌ Missing quoteId for edit mode');
        return;
    }

    this.isQuoteLoading = true;
    this.openBuilder();

    getQuoteById({ quoteId })
        .then(result => {
            const quote = result.quote;
            const lineItems = result.lineItems || [];

            // 🔑 Unified selectedClient (UI only)
            this.selectedClient = {
                //fullName: quote.Contact_Name__c || quote.Participant_Name__c,
                fullName: quote.Company__c
                                        ? quote.Company__c
                                        : `${quote.First_Name__c || ''} ${quote.Last_Name__c || ''}`.trim(),
                Email__c: quote.Contact_Email__c || quote.Participant_Email__c,
                Contact_Number__c: quote.Contact_Phone__c || '',
                NDIS_Number__c: quote.Participant__r?.NDIS_Participant_ID__c || ''
            };

            // Populate header
            this.quoteHeaderId = quote.Id;
            this.quoteNumber = quote.Quote_Number__c || '';
            this.quoteState =
                this.stateLabelToValueMap[quote.State__c] || quote.State__c || '';
            this.validFor = quote.Valid_for_days__c || '30 days';
            this.serviceStart = quote.Service_Period_Start__c || '';
            this.serviceEnd = quote.Service_Period_End__c || '';
            this.preparedBy = quote.Prepared_By__c || '';
            this.quotePdfUrl = quote.QuotePdf_Url__c || null;
            this.quoteJson = quote.Quotepdf_Json__c || null;

            // Populate line items (your existing mapping stays)
            this.quoteSupportItems = this.mapLineItems(lineItems);
        })
        .catch(err => {
            console.error('❌ Error loading quote for edit', err);
        })
        .finally(() => {
            this.isQuoteLoading = false;
        });
}




//         // load quote data for participant (edit mode) — if exists populate header and line items
//         getQuoteData({ participantId: clientId })
//             .then(result => {
//                 const quote = result.quote;
//                 const lineItems = result.lineItems || [];

//                 if (quote) {
//                     // populate header
//                     this.quoteHeaderId = quote.Id;
//                     this.quoteNumber = quote.Quote_Number__c || '';
//                     // stored State__c holds picklist value label or code? we store as code like NSW__c earlier — keep as-is
//                     //this.quoteState = quote.State__c || '';                   
//                     this.quoteState =this.stateLabelToValueMap[quote.State__c] || quote.State__c || '';
//                     this.validFor = quote.Valid_for_days__c || '30 days';
//                     this.serviceStart = quote.Service_Period_Start__c || '';
//                     this.serviceEnd = quote.Service_Period_End__c || '';
//                     this.preparedBy = quote.Prepared_By__c || '';
//                     this.additionalNotes = quote.Additional_Notes__c || '';
//                      // ✅ CRITICAL FIX
//                     this.quotePdfUrl = quote.QuotePdf_Url__c || null;
//                 } else {
//                     // new quote for participant: clear header fields
//                     this.quoteHeaderId = null;
//                     this.quoteNumber = '';
//                     this.quoteState = '';
//                     this.validFor = '30 days';
//                     this.serviceStart = '';
//                     this.serviceEnd = '';
//                     this.preparedBy = '';
//                     this.additionalNotes = '';
//                 }

//                 // populate UI rows from line items
//                 this.quoteSupportItems = (lineItems || []).map(li => {
//                     // find itemData from catalogue (by support item name) if possible
//                     let itemData = null;
//                     let serviceType = null;
//                     // catalogue map structure: { ServiceTypeName -> { SupportItemName -> { name, code, prices } } }
//                     // search for matching support item name to find serviceType and itemData
//                     const supportName = li.Support_Item__c;
//                     for (const stype of Object.keys(this.catalogue || {})) {
//                         const itemsMap = this.catalogue[stype];
//                         if (itemsMap && itemsMap[supportName]) {
//                             serviceType = stype;
//                             itemData = itemsMap[supportName];
//                             break;
//                         }
//                     }

//                     // compute priceDisplay using quoteState mapping
//                     const stateLabel = this.stateKeyMap[this.quoteState];
//                     const price = itemData && itemData.prices && stateLabel ? (itemData.prices[stateLabel] || 0) : (li.Price__c || 0);

//                     const qty = li.Quantity__c || 1;
//                     const freq = li.Frequency__c || 1;
//                     const dur = li.Duration_Value__c || 1;

//                     // compute cost locally (same logic as Apex)
//                     const cost = this.computeRowCostLocal(price, qty, freq, dur, li.Occurrence_Interval__c, li.Duration_Period__c);

//                     return {
//                         id: li.Id,
//                         serviceType: serviceType,
//                         supportItem: supportName,
//                         supportItemOptions: serviceType ? Object.keys(this.catalogue[serviceType]).map(k => ({ label: this.catalogue[serviceType][k].name, value: k })) : [],
//                         itemData: itemData,
//                         price: price,
//                         priceDisplay: `$${(price || 0).toFixed(2)}`,
//                         qty: qty,
//                         freq: freq,
//                         dur: dur,
//                         interval: li.Occurrence_Interval__c || 'Weekly',
//                         durationPeriod: li.Duration_Period__c || 'Weeks',
//                         cost: cost,
//                         costDisplay: `$${(cost || 0).toFixed(2)}`
//                     };
//                 });

//                 // show builder screen
                
//             })
//             .catch(err => {
//                 console.error('Error fetching quote data:', err);
//                 // still open builder to allow creating new quote
//                 this.screenView = 'builder';

//             });
//     }

    // get isListScreen() { return this.screenView === 'list'; }
    // get isBuilderScreen() { return this.screenView === 'builder'; }
   @track existingPdfKey = null;
    handleOpenDraft(event) {
        this.isMenuContainer=false;
            const quoteId = event.currentTarget.dataset.id;
            this.lastScreen = 'DRAFTS';
                this.builderMode = 'DRAFT';
            console.log(' Opening Draft Quote:', quoteId);
            
            this.selectedQuoteId = quoteId;
             this.selectedQuoteId = quoteId;
             this.resetflag=false;
            // Switch screen
          // this.resetMainScreens();
          this.openBuilder();
         this.loadDraftByQuoteId(quoteId);
         // this.resetScreens();
           // this.isQuoteBuilderScreen = true;
         //  this.isBuilderScreen -true;

        //    this.logScreenState('Builder (Draft)');

        this.isQuoteDraftScreen=false;
        }       

//     loadDraftByQuoteId(quoteId) {
//     getQuoteByIdWithLines({ quoteId })
//         .then(q => {
//             if (!q) return;
//                 // 🔑 RESTORE ENTITY CONTEXT (REQUIRED FOR SAVE)
//             if (q.Participant__c) {
//                 this.selectedEntityId = q.Participant__c;
//                 this.selectedEntityType = 'PARTICIPANT';
//             } else if (q.New_Contact__c) {
//                 this.selectedEntityId = q.New_Contact__c;
//                 this.selectedEntityType = 'NEW_CONTACT';
//             }
//             // 🔑 HEADER
//             this.quoteHeaderId = q.Id;
//             this.quoteNumber = q.Quote_Number__c || '';
//             this.state=   q.State__c || '';              
//             this.validFor = q.Valid_for_days__c || '30 days';
//             this.serviceStart = q.Service_Period_Start__c || '';
//             this.serviceEnd = q.Service_Period_End__c || '';
//            // this.preparedBy = q.Prepared_By__c || '';
//             this.quotePdfUrl = q.QuotePdf_Url__c || null;
//             this.preparedBy = q.Prepared_By__c || '';
//             this.additionalNotes = q.Additional_Notes__c || '';
//             // 🔑 CLIENT CARD
//             this.selectedClient = {
//                 fullName: q.Participant__r?.Name || q.New_Contact__r?.Name,
//                 NDIS_Number__c: q.Participant__r?.NDIS_Participant_ID__c || ''
//             };

//             // 🔑 NOW load line items PROPERLY
//             return getQuoteData({
//                 participantId: q.Participant__c,
//                 newContactId: q.New_Contact__c
//             });
//         })
//         .then(result => {
//             const lineItems = result?.lineItems || [];

//             //  USEING  OLD MAPPER
//             this.quoteSupportItems = lineItems.map(li => {
//                 let serviceType = null;
//                 let itemData = null;

//                 for (const stype of Object.keys(this.catalogue || {})) {
//                     const itemsMap = this.catalogue[stype];
//                     if (itemsMap && itemsMap[li.Support_Item__c]) {
//                         serviceType = stype;
//                         itemData = itemsMap[li.Support_Item__c];
//                         break;
//                     }
//                 }

//                 const stateLabel = this.stateKeyMap[this.state];
//                 const price =
//                     itemData?.prices?.[stateLabel] ??
//                     li.Price__c ??
//                     0;

//                 const qty = li.Quantity__c || 1;
//                 const freq = li.Frequency__c || 1;
//                 const dur = li.Duration_Value__c || 1;
//                 const cost = li.Cost__c || price * qty * freq * dur;

//                 return {
//                     id: li.Id,
//                     serviceType,
//                     supportItem: li.Support_Item__c,
//                     supportItemOptions: serviceType
//                         ? Object.keys(this.catalogue[serviceType]).map(k => ({
//                               label: this.catalogue[serviceType][k].name,
//                               value: k
//                           }))
//                         : [],
//                     price,
//                     priceDisplay: `$${price.toFixed(2)}`,
//                     qty,
//                     freq,
//                     interval: li.Occurrence_Interval__c || 'Weekly',
//                     dur,
//                     durationPeriod: li.Duration_Period__c || 'Weeks',
//                     cost,
//                     costDisplay: `$${cost.toFixed(2)}`
//                 };
//             });
//         })
//         .catch(err => {
//             console.error('❌ Draft load failed', err);
//         });
// }



//V2

    loadDraftByQuoteId(quoteId) {
       
    getQuoteByIdWithLines({ quoteId })
        .then(result => {
            if (!result) return;

            const quote = result.quote;
            const lineItems = result.lineItems || [];

            if (!quote) return;

            /* =========================
               RESTORE ENTITY CONTEXT
            ========================= */
            if (quote.Participant__c) {
                this.selectedEntityId = quote.Participant__c;
                this.selectedEntityType = 'PARTICIPANT';
            } else if (quote.New_Contact__c) {
                this.selectedEntityId = quote.New_Contact__c;
                this.selectedEntityType = 'NEW_CONTACT';
            }

            /* =========================
               HEADER
            ========================= */
            this.quoteHeaderId = quote.Id;
            this.quoteNumber = quote.Quote_Number__c || '';
           // this.state = quote.State__c || '';
           this.state = this.stateLabelToValueMap[quote.State__c] || '';
           this.quoteState = this.state;
            this.validFor = quote.Valid_for_days__c || '';
            this.serviceStart = quote.Service_Period_Start__c || '';
            this.serviceEnd = quote.Service_Period_End__c || '';
            this.preparedBy = quote.Prepared_By__c || '';
            this.additionalNotes = quote.Additional_Notes__c || '';
            this.quotePdfUrl = quote.QuotePdf_Url__c || null;
            this.termsAndConditions = quote.Terms_and_Conditions__c || '';
            this.quoteJson = quote.Quotepdf_Json__c || '';

            /* =========================
            EXISTING PDF KEY (STEP 1)
            ========================= */
           // this.quotePdfUrl = quote.QuotePdf_Url__c || null;
            this.existingPdfKey = null;
            
            if (quote.Quotepdf_Json__c) {
                try {
                   const parsed = JSON.parse(quote.Quotepdf_Json__c);

                    // Quotepdf_Json__c is an ARRAY
                    const fileMeta = Array.isArray(parsed) ? parsed[0] : parsed;

                    this.existingPdfKey =
                        fileMeta?.key ||
                        fileMeta?.Key ||
                        fileMeta?.s3Key ||
                        null;

                    console.log(' Existing PDF key loaded:', this.existingPdfKey);
                } catch (e) {
                    console.warn('⚠️ Invalid Quotepdf_Json__c JSON', e);
                    this.existingPdfKey = null;
                }
            }
            /* =========================
               CLIENT CARD (UI ONLY)
            ========================= */
            this.selectedClient = {
                fullName:
                    quote.Participant__r?.Name ||
                    quote.New_Contact__r?.Name ||
                    '',
                NDIS_Number__c:
                    quote.Participant__r?.NDIS_Participant_ID__c || ''
            };

            /* =========================
               LINE ITEMS (SAFE)
            ========================= */
            this.quoteSupportItems = lineItems.map(li => {
                let serviceType = null;
                let itemData = null;

                for (const stype of Object.keys(this.catalogue || {})) {
                    const itemsMap = this.catalogue[stype];
                    if (itemsMap && itemsMap[li.Support_Item__c]) {
                        serviceType = stype;
                        itemData = itemsMap[li.Support_Item__c];
                        break;
                    }
                }

                const stateLabel = this.stateKeyMap[this.state];
                const price =
                    itemData?.prices?.[stateLabel] ??
                    li.Price__c ??
                    0;

                const qty = li.Quantity__c || 1;
                const freq = li.Frequency__c || 1;
                const dur = li.Duration_Value__c || 1;
                const cost = li.Cost__c || price * qty * freq * dur;

                return {
                    id: li.Id,
                    serviceType,
                    supportItem: li.Support_Item__c,
                    supportItemOptions: serviceType
                        ? Object.keys(this.catalogue[serviceType]).map(k => ({
                              label: this.catalogue[serviceType][k].name,
                              value: k
                          }))
                        : [],
                    price,
                    priceDisplay: `$${price.toFixed(2)}`,
                    qty,
                    freq,
                    interval: li.Occurrence_Interval__c || 'Weekly',
                    dur,
                    durationPeriod: li.Duration_Period__c || 'Weeks',
                    cost,
                    costDisplay: `$${cost.toFixed(2)}`
                };
            });
        })
        .catch(err => {
            console.error('❌ Draft load failed', err);
        });
    }

@track lastScreen = null;
    goBackToList() {
        // Reset builder state when going back to list (creates no stale data)
       // this.screenView this.screenView = 'list';
    this.resetBuilderState(); 
       
     this.resetScreens();
     this.isMenuContainer=true;
     this.isBuilderScreen=false;
    // this.lastScreen = 'DRAFTS';
       // this.isListScreen = true;
            if (this.lastScreen === 'DRAFTS') {
        this.isQuoteDraftScreen = true;   // ✅ back to drafts
         this.draftPageNumber = 1;
        this.loadDraftQuotes();

    } else {
        this.isNewQuoteScreen = true;     // default
    }
    console.log();

      // this.isNewQuoteScreen=true;
        this.quoteHistoryScreen=false;
    }

    // ---------------------------
    // Builder: rows state + helpers
    // ---------------------------
    @track quoteSupportItems = [];

    addSupportRow() {
    const newRow = {
        id: 'r' + Date.now(),
        catalogueId: null,
        catalogueMap: {}, //  catalogueId issue fix,
        serviceType: null,
        supportItem: null,
        supportItemOptions: [],
        itemData: null,
        price: 0,
        qty: 1,
        freq: 1,
        dur: 1,
        interval: 'Weekly',
        durationPeriod: 'Weeks',
        cost: 0,
        costDisplay: '$0.00',
        frequencyLabel: this.getFrequencyLabel(1, 'Weekly')
    };
    this.quoteSupportItems = [...this.quoteSupportItems, newRow];
}

    // When user changes the quote-level state dropdown
    // handleQuoteStateChange(event) {
    //     this.quoteState = event.detail.value;
    //     // update price for existing rows with selected item data
    //     this.quoteSupportItems = this.quoteSupportItems.map(row => {
    //         if (row.itemData) {
    //             const stateLabel = this.stateKeyMap[this.quoteState];
    //             const price = row.itemData.prices && stateLabel ? (row.itemData.prices[stateLabel] || 0) : 0;
    //             row.price = price;
    //             row.priceDisplay = `$${price.toFixed(2)}`;
    //             // recalc cost
    //             row.cost = this.computeRowCostLocal(row.price, row.qty, row.freq, row.dur, row.interval, row.durationPeriod);
    //             row.costDisplay = `$${row.cost.toFixed(2)}`;
    //         }
    //         return row;
    //     });
    // }
        handleQuoteStateChange(event) {
    this.state = event.detail.value;     // ✅ FIX
    this.quoteState = this.state;        // (optional, keeps old logic alive)

    // update price for existing rows
    this.quoteSupportItems = this.quoteSupportItems.map(row => {
        if (row.itemData) {
           // const stateLabel = this.stateKeyMap[this.quoteState];
           const stateLabel = this.stateKeyMap[this.quoteState];
            const price =
                row.itemData.prices && stateLabel
                    ? row.itemData.prices[stateLabel] || 0
                    : 0;

            row.price = price;
            row.priceDisplay = `$${price.toFixed(2)}`;
            row.cost = this.computeRowCostLocal(
                row.price,
                row.qty,
                row.freq,
                row.dur,
                row.interval,
                row.durationPeriod
            );
            row.costDisplay = `$${row.cost.toFixed(2)}`;
        }
        return row;
    });

    console.log('✅ State updated:', this.quoteState);
}


    //v2
    handleRowServiceTypeChange(event) {
    const rowId = event.target.dataset.id;
    const serviceType = event.detail.value;

    this.quoteSupportItems = this.quoteSupportItems.map(row => {
        if (row.id === rowId) {
            const itemsMap = this.catalogue[serviceType] || {};

            row.serviceType = serviceType;
            row.supportItem = null;
           // row.catalogueId = null;
            row.itemData = null;

            // 🔑 NEW: mapping object
            row.catalogueMap = {};

            row.supportItemOptions = Object.keys(itemsMap).map(key => {
                row.catalogueMap[key] = itemsMap[key].id; // 🔥 STORE ID HERE
                return {
                    label: itemsMap[key].name,
                    value: key
                };
            });

            row.price = 0;
            row.priceDisplay = '$0.00';
            row.cost = 0;
            row.costDisplay = '$0.00';
        }
        return row;
    });
   //  this.recalculateServiceEndFromLineItems();
}




    // SUPPORT ITEM change per row
   

//     handleRowSupportItemChange(event) {
//     const rowId = event.target.dataset.id;
//     const supportItemKey = event.detail.value;

//     this.quoteSupportItems = this.quoteSupportItems.map(row => {
//         if (row.id === rowId) {

//             const serviceMap = this.catalogue[row.serviceType] || {};
//             const itemData = serviceMap[supportItemKey];

//             row.supportItem = supportItemKey;
//             row.itemData = itemData || null;

//             // ✅ THIS IS THE FIX
//             row.catalogueId = itemData ? itemData.id : null;

//             const stateLabel = this.stateKeyMap[this.quoteState];
//             const price =
//                 itemData && itemData.prices && stateLabel
//                     ? itemData.prices[stateLabel] || 0
//                     : 0;

//             row.price = price;
//             row.priceDisplay = `$${price.toFixed(2)}`;

//             row.cost = this.computeRowCostLocal(
//                 row.price,
//                 row.qty,
//                 row.freq,
//                 row.dur,
//                 row.interval,
//                 row.durationPeriod
//             );
//             row.costDisplay = `$${row.cost.toFixed(2)}`;
//         }
//         return row;
//     });
// }

//v2
@track disablesave=false;
handleRowSupportItemChange(event) {
    const rowId = event.target.dataset.id;
    const value = event.detail.value;

     if (this.isSupportItemAlreadySelected(value, rowId)) {

        this.showToast(
            'Duplicate Item',
            'This Support Item is already selected in another row.',
            'error'
        );
        this.disablesave=true;
        // reset UI value
        this.quoteSupportItems = this.quoteSupportItems.map(row => {
            if (row.id === rowId) {
                row.supportItem = null;
            }
            return row;
        });

        return;
    }
   this.disablesave=false;
    this.quoteSupportItems = this.quoteSupportItems.map(row => {
        if (row.id === rowId) {
            row.supportItem = value;
                 console.log('this.state',this.state);
            // ✅ READ FROM catalogueMap (NOT combobox option)
            // row.catalogueId = row.catalogueMap?.[value];
                 console.log('Row Id:', rowId);
                    console.log('Selected Support Item:', value);
                    console.log('quoteState:', this.quoteState);

            console.log('✅ catalogueId resolved:', row.catalogueId);

            const itemData =
                this.catalogue[row.serviceType]?.[value];
            row.catalogueId = itemData?.id || null;
            console.log('Row catalogue Id',row.catalogueId);
            const stateLabel = this.stateKeyMap[this.quoteState];
            const price =
                itemData?.prices?.[stateLabel] || 0;
             console.log('stateLabel',stateLabel);
            row.price = price;
            row.priceDisplay = `$${price.toFixed(2)}`;

            row.cost = this.computeRowCostLocal(
                row.price,
                row.qty,
                row.freq,
                row.dur,
                row.interval,
                row.durationPeriod
            );
            row.costDisplay = `$${row.cost.toFixed(2)}`;
            console.log('row.cost',row.cost);
        }
        return row;
    });
  //   this.recalculateServiceEndFromLineItems();
}

isSupportItemAlreadySelected(value, currentRowId) {

    return this.quoteSupportItems.some(row =>
        row.id !== currentRowId &&
        row.supportItem === value
    );
}


 //Cards code
    get lineItemCount() {
        return this.quoteSupportItems?.length || 0;
    }

    get totalEstimate() {
        return this.quoteSupportItems.reduce(
            (sum, r) => sum + (r.cost || 0),
            0
        );
    }

/*     get totalHours() {
        return this.quoteSupportItems.reduce((sum, r) => {
            const qty = r.qty || 0;
            const freq = r.freq || 0;
            const dur = r.dur || 0;
            return sum + (qty * freq * dur);
        }, 0);
    } */
get totalHours() {
    const hours = this.quoteSupportItems.reduce((sum, r) => {
        const qty = Number(r.qty || 0);
        const freq = Number(r.freq || 0);
        const dur = Number(r.dur || 0);
        return sum + (qty * freq * dur);
    }, 0);

    return Number(hours.toFixed(2));
}

    get avgRatePerHour() {
        
        const hours = this.totalHours;
        return hours > 0 ? this.totalEstimate / hours : 0;
    }

    // @track showQuoteCoverage=true;
            //Paragraph Cuote coverage
    //     get quoteCoverage() {
    //     if (!this.serviceStart || !this.serviceEnd) {
    //         return null;
    //     }

    //     const start = new Date(this.serviceStart);
    //     const end = new Date(this.serviceEnd);

    //     if (end <= start) {
    //         return null;
    //     }

    //     const MS_PER_DAY = 1000 * 60 * 60 * 24;
    //     const diffDays = Math.ceil((end - start) / MS_PER_DAY);

    //     const weeks = Math.round(diffDays / 7);
    //     const months = Math.round((weeks / 4.333) * 10) / 10; // 1 decimal

    //     return {
    //         weeks,
    //         months
    //     };
    // }

    get quoteCoverage() {
    if (!this.serviceStart || !this.serviceEnd) {
        return null;
    }

    const start = new Date(this.serviceStart);
    const end = new Date(this.serviceEnd);

    if (end <= start) {
        return null;
    }

    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const diffDays = Math.ceil((end - start) / MS_PER_DAY);

    const weeks = Math.ceil(diffDays / 7);
    const months = Math.round((weeks / 4.333) * 10) / 10;

    return { weeks, months };
}

get hasQuoteCoverage() {
    return (
        this.quoteCoverage !== null &&
        this.quoteSupportItems?.length > 0
    );
}

    // Quantity / Frequency / Duration changes
    handleRowQtyChange(event) { this.updateRowNumberField(event, "qty"); }
    handleRowFreqChange(event) { this.updateRowNumberField(event, "freq"); }
    handleRowDurChange(event) { this.updateRowNumberField(event, "dur"); }

/*     updateRowNumberField(event, fieldName) {
        const rowId = event.target.dataset.id;
        const value = parseFloat(event.detail.value) || 0;

        this.quoteSupportItems = this.quoteSupportItems.map(row => {
            if (row.id == rowId) {
                row[fieldName] = value;
                row.cost = this.computeRowCostLocal(row.price, row.qty, row.freq, row.dur, row.interval, row.durationPeriod);
                row.costDisplay = `$${(row.cost || 0).toFixed(2)}`;
            }
            return row;
        });
    } */
updateRowNumberField(event, fieldName) {
    const rowId = event.target.dataset.id;

    let rawValue = event.target.value;

    if (rawValue.includes(".")) {
        const parts = rawValue.split(".");
        parts[1] = parts[1].slice(0, 2);
        rawValue = parts.join(".");
    }

    let value = parseFloat(rawValue);
    if (isNaN(value)) value = 0;

    event.target.value = rawValue;

    this.quoteSupportItems = this.quoteSupportItems.map(row => {
        if (row.id == rowId) {
            row[fieldName] = value;

            row.cost = this.computeRowCostLocal(
                row.price,
                row.qty,
                row.freq,
                row.dur,
                row.interval,
                row.durationPeriod
            );

            row.costDisplay = `$${(row.cost || 0).toFixed(2)}`;
            row.frequencyLabel = this.getFrequencyLabel(
                row.freq,
                row.interval
            );
        }
        return row;
    });
}



    // Local cost computation (mirror of Apex computeCost)
    computeRowCostLocal(price, qty = 1, freq = 1, dur = 1, interval = 'weekly', durationPeriod = 'weeks') {
        const p = Number(price || 0);
        const q = Number(qty || 1);
        const f = Number(freq || 1);
        const d = Number(dur || 1);

        const intervalLc = (interval || '').toString().toLowerCase();
        const periodLc = (durationPeriod || '').toString().toLowerCase();

        let sessions = 0;

        if (intervalLc === 'daily') {
            sessions = (periodLc === 'weeks') ? f * (d * this.DAYS_PER_WEEK) : f * (d * this.DAYS_PER_MONTH);
        } else if (intervalLc === 'weekly') {
            sessions = (periodLc === 'weeks') ? f * d : f * (d * this.WEEKS_PER_MONTH);
        } else if (intervalLc === 'fortnightly') {
            sessions = (periodLc === 'weeks') ? f * (d * 0.5) : f * (d * this.WEEKS_PER_MONTH * 0.5);
        } else if (intervalLc === 'monthly') {
            sessions = (periodLc === 'weeks') ? f * (d * (1 / this.WEEKS_PER_MONTH)) : f * d;
        } else if (intervalLc === 'one-off' || intervalLc === 'oneoff' || intervalLc === 'one off') {
            sessions = (periodLc === 'weeks') ? d * this.ONEOFF_PER_WEEK : d * this.ONEOFF_PER_MONTH;
        } else {
            sessions = f * d;
        }

        const cost = p * q * sessions;
        return Number(cost.toFixed(2));
    }

    get isQuoteItemsEmpty() {
        return this.quoteSupportItems.length === 0;
    }

    // Remove row — if persisted, call deleteLineItem
    handleRemoveRow(event) {
        const rowId = event.target.dataset.id;
        const row = this.quoteSupportItems.find(r => r.id == rowId);

        if (!row) return;

        if (row.id && row.id.toString().startsWith('r')) {
            // unsaved row (temporary id) — just remove locally
            this.quoteSupportItems = this.quoteSupportItems.filter(r => r.id != rowId);
            return;
        }

        // persisted row — call server to delete
        deleteLineItem({ lineItemId: rowId })
            .then(() => {
                this.quoteSupportItems = this.quoteSupportItems.filter(r => r.id != rowId);
                this.showToast('Success', 'Line item deleted', 'success');
            })
            .catch(err => {
                console.error('Delete error', err);
                this.showToast('Error', 'Could not delete line item', 'error');
            });
    }
        //v3

        // async handleSaveDraft() {
        //     let savedHeader;
        //     try {
        //         /* ---------------------------------
        //         0️⃣ STATE FIX (CRITICAL)
        //         Picklist expects LABEL, not QLD__c
        //         ----------------------------------*/
        //         const STATE_CODE_TO_LABEL = {
        //             NSW__c: 'New South Wales',
        //             VIC__c: 'Victoria',
        //             QLD__c: 'Queensland',
        //             WA__c: 'Western Australia',
        //             SA__c: 'South Australia',
        //             TAS__c: 'Tasmania',
        //             ACT__c: 'Australian Capital Territory',
        //             NT__c: 'Northern Territory'
        //         };

        //         const stateLabel =
        //             STATE_CODE_TO_LABEL[this.quoteState] || this.quoteState;

        //         /* ---------------------------------
        //         1️⃣ HEADER DTO
        //         ----------------------------------*/
        //         const isEdit = Boolean(this.quoteHeaderId);

        //    /*     const headerDto = {
        //             id: this.quoteHeaderId ? String(this.quoteHeaderId) : null,

        //             participantId: String(this.selectedClient.Id),

        //             quoteNumber: String(this.quoteNumber || ''),
        //             state: stateLabel,                // ✅ FIXED
        //             validFor: String(this.validFor || ''),

        //             serviceStart: this.serviceStart || null,
        //             serviceEnd: this.serviceEnd || null,

        //             preparedBy: String(this.preparedBy || ''),
        //             additionalNotes: String(this.additionalNotes || ''),
        //             status: 'Draft'
        //         }; */

        //         const headerDto = {
        //         id: this.quoteHeaderId ? String(this.quoteHeaderId) : null,

        //         // 🔥 ONLY send parent IDs on INSERT
        //         participantId:
        //             !isEdit && this.selectedEntityType === 'PARTICIPANT'
        //                 ? String(this.selectedEntityId)
        //                 : null,

        //         newContactId:
        //             !isEdit && this.selectedEntityType === 'NEW_CONTACT'
        //                 ? String(this.selectedEntityId)
        //                 : null,

        //         quoteNumber: String(this.quoteNumber || ''),
        //         state: String(this.state || ''),
        //         validFor: String(this.validFor || ''),

        //         serviceStart: this.serviceStart || null,   // Date is OK
        //         serviceEnd: this.serviceEnd || null,       // Date is OK

        //         preparedBy: String(this.preparedBy || ''),
        //         additionalNotes: String(this.additionalNotes || ''),
        //         status: 'Draft'
        //      };


        //         console.log('📌 HEADER DTO:', JSON.stringify(headerDto));

        //         /* ---------------------------------
        //         2️⃣ SAVE HEADER
        //         ----------------------------------*/
        //          savedHeader = await saveQuoteHeader({
        //             headerJson: JSON.stringify(headerDto)
        //         });

        //         this.quoteHeaderId = savedHeader.Id;
        //         console.log('✅ HEADER SAVED:', savedHeader.Id);

        //         const quote = savedHeader; 


        //         /* ---------------------------------
        //         3️⃣ LINE ITEMS DTO
        //         ----------------------------------*/
        //         const lineItemsDto = this.quoteSupportItems.map(row => {
        //             const isNew = !row.id || String(row.id).startsWith('r');
        //                 console.log('catalogueId row...', row.catalogueId);
        //             return {
        //                 id: isNew ? null : row.id,
        //                 quoteId: savedHeader.Id,

        //                 catalogueId: row.catalogueId,
        //                 supportItem: row.supportItem || null,
                           
        //                 price: String(row.price ?? 0),
        //                 quantity: String(row.qty ?? 1),
        //                 frequency: String(row.freq ?? 1),

        //                 interval: row.interval || 'Weekly',
        //                 durationValue: String(row.dur ?? 1),
        //                 durationPeriod: row.durationPeriod || 'Weeks',
                        
        //                 cost: String(row.cost ?? 0)
        //             };
        //         });

        //         console.log('📌 LINE ITEMS SENT:', JSON.stringify(lineItemsDto));

        //         /* ---------------------------------
        //         4️⃣ SAVE LINE ITEMS
        //         ----------------------------------*/
        //         const savedLines = await saveLineItems({
        //             itemsJson: JSON.stringify(lineItemsDto)
        //         });

        //         console.log('✅ LINE ITEMS SAVED:', savedLines);

        //         /* ---------------------------------
        //         5️⃣ KEEP ROWS IN UI
        //         ----------------------------------*/
        //         this.quoteSupportItems = this.quoteSupportItems.map((row, index) => {
        //             const saved = savedLines[index];
        //             return {
        //                 ...row,
        //                 id: saved.Id,
        //                 cost: saved.Cost__c,
        //                 costDisplay: `$${saved.Cost__c.toFixed(2)}`
        //             };
        //         });

        //         this.showToast('Success', 'Quote saved as Draft', 'success');

        //         } catch (err) {
        //             console.error('❌ ERROR Saving Draft:', err);
        //             console.error('Stack:', err?.body?.stackTrace);
        //             this.showToast('Error', 'Could not save quote', 'error');
        //         }

                        
        //         //---------------FETCH DATA REQUIRED FOR PDF (ADD HERE)-----------------//

        //         // Organisation (ABN, Address, Email…)
        //         this.organisation = await getOrganisation();

        //         // Quote (number, status, valid until, pdf url)
        //         this.quoteHeader = await getQuoteById({
        //             quoteId: savedHeader.Id
        //         });

        //         // Participant details
        //         // this.participant = await getClientDetails({
        //         //     clientId: this.selectedClient.Id
        //         // });

        //         // // Budget / Funds
        //         // const funds = await fetchfundTracker({
        //         //     clientId: this.selectedClient.Id
        //         // });
        //             if (this.selectedEntityType === 'PARTICIPANT') {
        //             this.participant = await getClientDetails({
        //                 clientId: this.selectedEntityId
        //             });

        //             const funds = await fetchfundTracker({
        //                 clientId: this.selectedEntityId
        //             });
        //         }

        //         // Calculate budget numbers (JS only)
        //         this.totalApprovedAmount = funds.reduce(
        //             (sum, f) => sum + (f.Amount_approved__c || 0),
        //             0
        //         );

        //         this.totalSpentFunds = funds.reduce(
        //             (sum, f) => sum + (f.Spent_Amt__c || 0),
        //             0
        //         );

        //     this.totalAvailableFunds =
        //         this.totalApprovedAmount - this.totalSpentFunds;

        //     this.remainingAfterQuote =
        //         this.totalAvailableFunds - this.totalEstimate;   

        //             //End- of PDF calculations 

        //         //         if (!this.pdfReady) {
        //         //     this.showToast(
        //         //         'Please wait',
        //         //         'PDF engine is still loading. Try again in a moment.',
        //         //         'info'
        //         //     );
        //         //     return;
        //         // }

        //             if (!this.pdfReady) {
        //                 this.showToast(
        //                     'Preparing PDF',
        //                     'Your quote is being prepared. Preview will open automatically.',
        //                     'info'
        //                 );
        //             }
        //             await this.generateAndUploadQuotePdf(savedHeader);

        //             const refreshedQuote = await getQuoteById({
        //                 quoteId: savedHeader.Id
        //             });

        //         // ✅ STORE URL FOR PREVIEW
        //         // this.quotePdfUrl = refreshedQuote.QuotePdf_Url__c;  IMPORTANT

        //             if (refreshedQuote?.QuotePdf_Url__c) {
        //                 this.quotePdfUrl = refreshedQuote.QuotePdf_Url__c;
        //             }
                    

        //         if (!this.quotePdfUrl) {
        //         this.showToast(
        //             'Info',
        //             'PDF is being generated. Please try preview in a few seconds.',
        //             'info'
        //         );
        //     }
        //     console.log('quotePdfUrl..', this.quotePdfUrl);


        // }

        //-----------------nEW sAVE----------------------//
        async waitForPdfReady(timeout = 3000) {
    const start = Date.now();

    while (!this.pdfReady) {
        if (Date.now() - start > timeout) {
            throw new Error('PDF engine did not initialize in time');
        }
        await new Promise(r => setTimeout(r, 100));
    }
}
 
      async handleSaveDraft() {
        console.log('📌 Save Draft clicked');

        const inputsValid = this.validateInputs();

    // 🚨 STOP if date logic invalid
    const datesValid = this.validateServiceDates(true);

    if (!inputsValid || !datesValid) {
        console.warn('⛔ Save Draft blocked due to validation failure');
        return;
    }

    if (
    !Array.isArray(this.quoteSupportItems) ||
    this.quoteSupportItems.length === 0
) {
    this.showToast(
        'Missing Support Items',
        'Please add at least one support item before saving the draft.',
        'error'
    );
    return;
}

    try {
        /* =====================================================
           FIX 1 — STATE NORMALISATION (UI ➜ APEX)
        ===================================================== */

        this.isQuoteLoading = true;

   const STATE_CODE_TO_LABEL = {
            NSW__c: 'New South Wales',
            VIC__c: 'Victoria',
            QLD__c: 'Queensland',
            WA__c: 'Western Australia',
            SA__c: 'South Australia',
            TAS__c: 'Tasmania',
            ACT__c: 'Australian Capital Territory',
            NT__c: 'Northern Territory'
        };
            // 🔑 HARD SOURCE OF TRUTH FOR STATE
    
  const stateLabel =
        STATE_CODE_TO_LABEL[this.state] || this.quoteState;   
// 3️⃣ Convert to picklist label
//onst stateLabel = STATE_CODE_TO_LABEL[resolvedStateCode] || [this.state] || this.quoteStatethis.quoteState;
        /* =====================================================
           FIX 2 — BUILD HEADER DTO (ENTITY-AWARE)
        ===================================================== */
        const headerDto = {
            id: this.quoteHeaderId || null,

            participantId:
                this.selectedEntityType === 'PARTICIPANT'
                    ? this.selectedEntityId
                    : null,

            newContactId:
                this.selectedEntityType === 'NEW_CONTACT'
                    ? this.selectedEntityId
                    : null,

            quoteNumber: this.quoteNumber,
            state: stateLabel,
            validFor: this.validFor,
            serviceStart: this.serviceStart,
            serviceEnd: this.serviceEnd,
            preparedBy: String(this.preparedBy || ''),
            additionalNotes: String(this.additionalNotes || ''),
            termsAndConditions: String(this.termsAndConditions || ''),
            // quoteJson: this.uploadedFiles
            //                         ? JSON.stringify(this.uploadedFiles)
            //                         : null,
            //  quotePdfUrl: this.downloadLinks
            //     ? JSON.stringify(this.downloadLinks)
            //     : null,  
         quoteJson:
            Array.isArray(this.uploadedFiles) && this.uploadedFiles.length > 0
                ? JSON.stringify(this.uploadedFiles)
                : null,

        quotePdfUrl:
            Array.isArray(this.downloadLinks) && this.downloadLinks.length > 0
                ? JSON.stringify(this.downloadLinks)
                : null,
                    
                    status: 'Draft'
                };
        console.log('HEADER DTO →', JSON.stringify({
                                                    state: this.state,
                                                    additionalNotes: this.additionalNotes,
                                                    termsAndConditions: this.termsAndConditions
                                                }));
        console.log('📌 HEADER DTO-->', JSON.stringify(headerDto));

        /* =====================================================
           FIX 3 — SAVE HEADER (SOURCE OF TRUTH)
        ===================================================== */
        // const savedHeader = await saveQuoteHeader({
        //     headerJson: JSON.stringify(headerDto)
        // });

        // if (!savedHeader?.Id) {
        //     throw new Error('Header save failed');
        // }
            let savedHeader;

            if (!this.quoteHeaderId) {
                // 🆕 CREATE
                const newId = await createQuoteHeader({
                    headerJson: JSON.stringify(headerDto)
                });

                if (!newId) {
                    throw new Error('Header create failed');
                }

                this.quoteHeaderId = newId;
                savedHeader = { Id: newId };

            } else {
                // ✏️ UPDATE
                savedHeader = await saveQuoteHeader({
                    headerJson: JSON.stringify({
                        ...headerDto,
                        id: this.quoteHeaderId
                    })
                });

                if (!savedHeader?.Id) {
                    throw new Error('Header update failed');
                }
            }                                    


        // 🔑 REQUIRED FOR PDF + UI
        this.quoteHeader = savedHeader;
        this.quoteHeaderId = savedHeader.Id;

        /* =====================================================
           FIX 4 — SAVE LINE ITEMS (KEEP catalogueId)
        ===================================================== */
        const itemsToSave = this.quoteSupportItems.map(row => ({
            id: row.id?.startsWith('r') ? null : row.id,
            quoteId: savedHeader.Id,
            catalogueId: row.catalogueId, // 🔥 REQUIRED
            supportItem: row.supportItem,
            price: row.price,
            quantity: row.qty,
            frequency: row.freq,
            interval: row.interval,
            durationValue: row.dur,
            durationPeriod: row.durationPeriod,
            cost: row.cost
        }));
        console.log('itemsToSave',JSON.stringify(itemsToSave));
        const savedLines = await saveLineItems({
            itemsJson: JSON.stringify(itemsToSave)
        });

        // 🔑 MAP BACK IDS (EDIT STABILITY)
        this.quoteSupportItems = this.quoteSupportItems.map((row, i) =>
            savedLines?.[i]?.Id ? { ...row, id: savedLines[i].Id } : row
        );
                console.log('this.quoteSupportItems..',JSON.stringify(this.quoteSupportItems));

        /* =====================================================
           FIX 5 — LOAD ENTITY FOR PDF (PARTICIPANT / CONTACT)
        ===================================================== */
       let pdfEntity = null;

        if (this.selectedEntityType === 'PARTICIPANT') {
            this.participant = await getClients({
                clientId: this.selectedEntityId
            });
            pdfEntity = this.participant;

            await fetchfundTracker({
                clientId: this.selectedEntityId
            });

        } else if (this.selectedEntityType === 'NEW_CONTACT') {
            this.newContact = await getNewContacts({
                contactId: this.selectedEntityId
            });
            pdfEntity = this.newContact;
        }
             this.organisation = await getOrganisation();

             //                 
        /* =====================================================
           PDF GENERATION + AWS UPLOAD
        ===================================================== */
    //return; // ⛔ STOP HERE
  
 await this.waitForPdfReady();

        await this.loadNewContactForPdf();

        await this.generateAndUploadQuotePdf(savedHeader);
        

    //    await uploadFile({
    //     base64: pdfBase64,
    //     filename: `Quote_${this.quoteNumber}.pdf`,
    //     recordId: savedHeader.Id,
    //     obj: 'quote'
    // });
    
        this.showToast('Success', 'Quote saved as Draft', 'success');
       
        this.isMenuContainer=true;
        this.handleQuoteDraftClick();

    } catch (err) {
        console.error('❌ ERROR Saving Draft:', err);
        this.showToast('Error', 'Could not save quote', 'error');
    }finally {
        // 🔥 TURN OFF SPINNER (ALWAYS)
        this.isQuoteLoading = false;
    }
     
}


        /* =====================================================
        LOAD QUOTE DRAFTS
        ===================================================== */

        loadDraftQuotes() {
            this.isDraftLoading = true;
            console.log('📄 Loading Quote Drafts...');

            getDraftQuotes()
                .then(result => {
                    const drafts = result || [];

                    // ✅ Normalize display name
                    this.draftQuotes = drafts.map(q => {
                        const participant = q.Participant__r || {};
                        const newContact = q.New_Contact__r || {};

                        let displayName = '';

                        // 1️⃣ First + Last name
                        if (participant.First_Name__c || participant.Last_Name__c) {
                            displayName = [
                                participant.First_Name__c,
                                participant.Last_Name__c
                            ].filter(Boolean).join(' ');
                        }
                        // 2️⃣ Company
                        else if (participant.Company__c) {
                            displayName = participant.Company__c;
                        }
                        // 3️⃣ New Contact
                        else if (newContact.Name) {
                            displayName = newContact.Name;
                        }
                        // 4️⃣ Fallback
                        else {
                            displayName = '—';
                        }

                        return {
                            ...q,
                            displayName
                        };
                    });

                    console.log('✅ Draft Quotes loaded:', JSON.stringify(this.draftQuotes));
                    this.pageNumber = 1;
                    this.paginateDraftQuotes();
                })
                .catch(error => {
                    console.error('❌ Failed to load draft quotes', error);
                })
                .finally(() => {
                    this.isDraftLoading = false;
                });
        }


        // Save Drafts Screen logic
          handleQuoteDraftClick() {
           // this.resetMainScreens();
           this.resetScreens();
            this.isQuoteDraftScreen = true;
            this.draftPageSize = 10;
            // 🔹 Load drafts when tab opens
            this.isPreviewModalOpen = false;
                this.loadDraftQuotes();
            

            
             this.pageNumber = 1;
          //  this.paginateDraftQuotes();

          //  this.logScreenState('Quote Draft');
        }

      @track  selectedStatus = 'All';


       handleTSignHistoryClick() {
    this.resetScreens();
    this.isTSignHistoryScreen = true;

    console.log('orgId: ', this.orgId);

    // ✅ Force dropdown + filter to "All"
    this.selectedStatus = 'All';
    this.pageNumber = 1;

    // Force UI to update before filtering
    Promise.resolve().then(() => {
        this.updateDisplayedRecords();
    });
}
DEFAULT_PAGE_SIZE = 10;


resetPagination() {
    this.pageNumber = 1;
    this.totalPages = 1;
    this.paginationVisible = false;
    this.pageSize = this.DEFAULT_PAGE_SIZE;
}



         /* =========================
       SUB TAB HANDLERS
    ========================== */
    handleParticipantsTabClick() {
         this.resetPagination();
        this.isParticipantsTab = true;
        this.isNewContactsTab = false;
        this.loadClients();
    }

    handleNewContactsTabClick() {
         this.resetPagination();
        this.isNewContactsTab = true;
        this.isParticipantsTab = false;
        console.log('📂 New Contacts tab opened');
    this.loadNewContacts();
    }
loadNewContacts(search = '') {
    this.isLoadingNewContacts = true;

    getNewContacts({ searchTerm: search })
        .then(result => {
            console.log('✅ New Contacts loaded:', result);

            this.newContactList = result.map(c => {
                const name = c.Name || '';
                const initials = name
                    .split(' ')
                    .map(w => w.charAt(0))
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                return {
                    ...c,
                    initials
                };
            });
              this.pageNumber = 1;
            this.paginateNewContacts();
        })
        .catch(error => {
            console.error('❌ Failed to load New Contacts', error);
        })
        .finally(() => {
            this.isLoadingNewContacts = false;
        });
}



        handleDeleteLineItem(event) {
    const rowId = event.currentTarget.dataset.id;

    const row = this.quoteSupportItems.find(r => r.id === rowId);
    if (!row) return;

    // 🟢 Case 1: Unsaved row (frontend only)
    if (rowId.startsWith('r')) {
        this.quoteSupportItems =
            this.quoteSupportItems.filter(r => r.id !== rowId);
        return;
    }

    // 🔴 Case 2: Saved row → delete from Apex
    deleteQuoteLineItem({ lineItemId: rowId })
        .then(() => {
            this.quoteSupportItems =
                this.quoteSupportItems.filter(r => r.id !== rowId);

            this.showToast(
                'Deleted',
                'Quote line item removed',
                'success'
            );
        })
        .catch(err => {
            console.error(err);
            this.showToast(
                'Error',
                'Unable to delete line item',
                'error'
            );
        });
       //  this.recalculateServiceEndFromLineItems();
}



// INTERVAL CHANGE
handleRowIntervalChange(event) {
    const rowId = event.target.dataset.id;
    const value = event.detail.value;

    this.quoteSupportItems = this.quoteSupportItems.map(row => {
        if (row.id == rowId) {
            row.interval = value;

            row.cost = this.computeRowCostLocal(
                row.price, row.qty, row.freq, row.dur, row.interval, row.durationPeriod
            );
            row.costDisplay = `$${row.cost.toFixed(2)}`;
            row.frequencyLabel = this.getFrequencyLabel(
                row.freq,
                row.interval
            );
        }
        return row;
    });
}


// DURATION PERIOD CHANGE
handleRowDurationPeriodChange(event) {
    const rowId = event.target.dataset.id;
    const value = event.detail.value;
    console.log('handleRowDurationPeriodChange');
    this.quoteSupportItems = this.quoteSupportItems.map(row => {
        if (row.id == rowId) {
            row.durationPeriod = value;

            row.cost = this.computeRowCostLocal(
                row.price, row.qty, row.freq, row.dur, row.interval, row.durationPeriod
            );
            row.costDisplay = `$${row.cost.toFixed(2)}`;
             console.log('row.costDisplay..',row.costDisplay);
                          console.log('row.durationPeriod..',row.durationPeriod);

        }
       
        return row;
    });
}



//     handleAdditionalNotes(event) {
//     this.additionalNotes = event.target.value;
// }
// handleQuoteNumber(event) {
//     this.quoteNumber = event.target.value;
// }

        handleAdditionalNotes(event) {
            this.additionalNotes = event.target.value;
        }
        handleTermsAndConditions(event) {
            this.termsAndConditions = event.target.value;
        }

        handleQuoteNumber(event) {
            this.quoteNumber = event.target.value;
        }

        handleValidForChange(event) {
            this.validFor = event.detail.value;
        }

        handleStartDate(event) {

            this.serviceStart = event.target.value;

            this.validateServiceDates(false);
        }


       handleEndDate(event) {

            this.serviceEnd = event.target.value;

            this.validateServiceDates(false);
        }


        handlePreparedBy(event) {
            this.preparedBy = event.target.value;
        }
formatDate(dateValue) {
    if (!dateValue) return '-';

    try {
        const d = new Date(dateValue);

        return d.toLocaleDateString('en-AU', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        return '-';
    }
}

validateInputs() {

    let isValid = true;

    // validate lightning-input / combobox with required attr
    const fields = this.template.querySelectorAll(
        'lightning-input, lightning-combobox'
    );

    fields.forEach(field => {
        if (field.required) {
            field.reportValidity();
            if (!field.checkValidity()) {
                isValid = false;
            }
        }
    });

    return isValid;
}
validateServiceDates(showToast = true) {

    if (!this.serviceStart || !this.serviceEnd) {
        return true; // required check handled elsewhere
    }

    const start = new Date(this.serviceStart);
    const end = new Date(this.serviceEnd);

    if (start >= end) {

        if (showToast) {
            this.showToast(
                'Validation Error',
                'Service Period Start must be before Service Period End.',
                'error'
            );
        }

        return false;
    }

    return true;
}

      

//         calculateEndDate(startDate, duration, unit) {
//     if (!startDate || !duration || !unit) return null;

//     const d = new Date(startDate);

//     if (unit === 'Weeks') {
//         d.setDate(d.getDate() + (Number(duration) * 7));
//     } else if (unit === 'Months') {
//         d.setMonth(d.getMonth() + Number(duration));
//     }

//     return d;
// }
//         recalculateServiceEndFromLineItems() {
//     if (!this.serviceStart || !this.quoteSupportItems?.length) {
//         this.serviceEnd = '';
//         return;
//     }

//     const start = new Date(this.serviceStart);
//     let maxEndDate = null;

//     this.quoteSupportItems.forEach(item => {
//         if (!item.duration || !item.durationUnit) return;

//         const end = this.calculateEndDate(
//             start,
//             item.duration,
//             item.durationUnit
//         );

//         if (end && (!maxEndDate || end > maxEndDate)) {
//             maxEndDate = end;
//         }
//     });

//     this.serviceEnd = maxEndDate
//         ? maxEndDate.toISOString().split('T')[0]
//         : '';
// }


handleDurationChange(event) {
    this.durationValue = Number(event.detail.value);

    this.serviceEndDate = this.calculateServiceEndDate(
        this.serviceStart,
        this.durationValue,
        this.durationUnit
    );
}

handleDurationUnitChange(event) {
    this.durationUnit = event.detail.value;

    this.serviceEndDate = this.calculateServiceEndDate(
        this.serviceStart,
        this.durationValue,
        this.durationUnit
    );
}


 getPdfClient() {
    if (this.selectedEntityType === 'PARTICIPANT') {
        const name = this.participant.Company__c
            ? this.participant.Company__c
            : `${this.participant.First_Name__c || ''} ${this.participant.Last_Name__c || ''}`.trim();
            
        return {
            name: name || '-',
            ndis: this.participant?.NDIS_Participant_ID__c || '-',
            email: this.participant?.Email__c || '-',
            phone: this.participant?.Contact_Number__c || '-',
            ndis: this.participant.NDIS_Participant_ID__c || '-',
          //  planManaged: this.participant.Plan_Management_Type__c || '-',
            planStart: this.serviceStart,
            planEnd: this.serviceEnd
        };
    }

        // NEW CONTACT
        if (this.selectedEntityType === 'NEW_CONTACT' && this.newContact) {
        return {
            name: this.newContact?.Name || '-',
            ndis: '-', // no NDIS for new contact
            email: this.newContact.Email__c || '-',
            phone: this.newContact.Phone__c || '-'
        };
    }
 }
   safeText(val) {
    return val === undefined || val === null || Number.isNaN(val)
        ? ''
        : String(val);
} 
async loadNewContactForPdf() {
    if (this.selectedEntityType !== 'NEW_CONTACT' || !this.selectedEntityId) {
        return;
    }

    try {
        const contact = await getNewContactById({
            contactId: this.selectedEntityId
        });
        this.newContact = contact;
        console.log('✅ New Contact loaded for PDF:', contact);
    } catch (e) {
        console.error('❌ Failed to load New Contact for PDF', e);
    }
}


 richTextToPdfText(html) {
    if (!html) return '';

    // Create a temp DOM element
    const temp = document.createElement('div');
    temp.innerHTML = html;

    let lines = [];

    // Handle bullet lists
    temp.querySelectorAll('li').forEach((li, index) => {
        const parent = li.parentElement.tagName;
        const prefix = parent === 'OL'
            ? `${index + 1}. `
            : '• ';
        lines.push(prefix + li.textContent.trim());
    });

    // Handle paragraphs / remaining text
    temp.querySelectorAll('p').forEach(p => {
        if (p.textContent.trim()) {
            lines.push(p.textContent.trim());
        }
    });

    // Fallback: plain text
    if (!lines.length) {
        return temp.textContent.trim();
    }

    return lines.join('\n');
}



   generateQuotePdfBase64() {

    if (!this.pdfReady) {
        console.warn('⏳ PDF not ready');
        return null;
    }
      const safeText = (v) =>
            v === undefined || v === null || Number.isNaN(v)
                ? ''
                : String(v);
   

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const quote = this.quoteHeader;
   // const client = this.participant;
    const client =this.getPdfClient();
    const org = this.organisation;
    const lines = this.quoteSupportItems || [];

        const PAGE_WIDTH = 210;
    const PAGE_HEIGHT = 297;
    const MARGIN = 14;  
    console.log('🧪 Generating PDF base64', {
    pdfReady: this.pdfReady,
    hasOrg: !!this.organisation,
    hasParticipant: !!this.participant || !!this.newContact,
    lineItems: this.quoteSupportItems?.length
});

    //helper for spacing
        const BOTTOM_MARGIN = 14;

const ensureSpace = (requiredHeight) => {
    if (y + requiredHeight > PAGE_HEIGHT - BOTTOM_MARGIN) {
        doc.addPage();
        y = MARGIN;
    }
};
  
/* =====================
       BRAND CONSTANTS
    ===================== */

    const BRAND_BLUE = [27, 58, 130];     // #1B3A82
    const LIGHT_BLUE = [245, 248, 252];   // card background
    const BORDER_GRAY = [225, 228, 234];  // subtle border
    const TEXT_GRAY = [55, 65, 81];
    const CARD_BG = [245, 248, 252];  
    
    const money = (v = 0) => `$${Number(v).toFixed(2)}`;

    let y = 14;

    /* =====================================================
       HEADER
    ===================================================== */
    doc.setFont('Roboto-Bold', 'bold');     // Add phone
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(
        safeText(org?.Name),
        MARGIN,
        y
    );

    doc.setFont('Roboto-VariableFont_wdth,wght', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_GRAY);
    y += 5;
        doc.text(
        safeText(`ABN: ${org?.ABN__c || ''}`),
        MARGIN,
        y
    );
    y += 4;
        doc.text(`NDIS Provider: ${org.NDIS_Provider__c}`, MARGIN, y);doc.text(
        safeText(`NDIS Provider: ${org?.NDIS_Provider__c || ''}`),
        MARGIN,
        y
    );
    y += 4;
    doc.text(
        safeText(org?.Address__c || ''),
        MARGIN,
        y
    );   
     y += 4;
    doc.text(safeText(`Email: ${org.Email__c} | Phone: ${org.Contact_No__c}`), MARGIN, y);

    /* STATUS BADGE */
   doc.setDrawColor(...BORDER_GRAY);
    doc.setFillColor(...LIGHT_BLUE);
    doc.roundedRect(165, 12, 30, 8, 5, 5, 'FD');

    doc.setFont('Roboto-Bold', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_BLUE);
    doc.text(safeText(quote.Status__c), 180, 18, { align: 'center' });
    /* DIVIDER */
    y += 6;
    doc.setDrawColor(...BORDER_GRAY);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 10;

    /* =====================================================
       SERVICE QUOTE META
    ===================================================== */
     doc.setFont('Roboto-Bold', 'bold');
    doc.setFontSize(12);
    doc.text(safeText('SERVICE QUOTE'), MARGIN, y);
    y += 8;
    const today = new Date();
    const quoteNumber =
    this.quoteNumber ||
    quote?.Quote_Number__c ||
    '';

    const issuedDate = today.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
    });
    doc.setFont('Roboto-VariableFont_wdth,wght', 'normal');
    doc.setFontSize(9);
    doc.text(safeText(`Quote No: ${quoteNumber || ''}`), MARGIN, y);
    // doc.text(safeText(
    //     `Date Issued: ${new Date(quote.CreatedDate).toLocaleDateString()}`),
    //     PAGE_WIDTH / 2,
    //     y,
    //     { align: 'center' }
    // );
    doc.text(
    safeText(`Date Issued: ${issuedDate}`),
    PAGE_WIDTH / 2,
    y,
        { align: 'center' }
    );

    doc.text(safeText(
        `Valid Until: ${quote.Valid_for_days__c || ''}`),
        PAGE_WIDTH - MARGIN,
        y,
        { align: 'right' }
    );
    y += 12;

    /* =====================================================
       PARTICIPANT INFORMATION
    ===================================================== */
    const leftX = MARGIN + 8;
const rightX = PAGE_WIDTH / 2 + 6;

    const LINE_GAP = 8;           // space after line
    const EXTRA_PADDING = 2; 
 const planPeriod =
    this.serviceStart && this.serviceEnd
        ? `${this.formatDate(this.serviceStart)} – ${this.formatDate(this.serviceEnd)}`
        : '-';
const CARD_HEIGHT = 52;
const LABEL_GAP = 5;
const VALUE_GAP = 5;

const leftColX = MARGIN + 8;
const rightColX = PAGE_WIDTH / 2 + 6;

const row1Y = y + 14;
const row2Y = row1Y + 10;
//const row3Y = row2Y + 10;
const row3Y = row2Y+ 10;

doc.setDrawColor(...BORDER_GRAY);
doc.setFillColor(...LIGHT_BLUE);
doc.roundedRect(
    MARGIN,
    y,
    PAGE_WIDTH - MARGIN * 2,
    CARD_HEIGHT,
    6,
    6,
    'FD'
);


doc.setFont('Roboto-Bold', 'bold');
doc.setFontSize(9);
doc.text(
    safeText(
        this.selectedEntityType === 'PARTICIPANT'
            ? 'Participant Information'
            : 'Contact Information'
    ),
    MARGIN + 6,
    y + 8
);


doc.setFont('Roboto-VariableFont_wdth,wght', 'normal');
doc.setFontSize(8);

doc.text('Name', leftColX, row1Y);
doc.text(safeText(client.name || '-'), leftColX, row1Y + 5);

// Email
doc.text('Email', leftColX, row2Y);
doc.text(safeText(client.email || '-'), leftColX, row2Y + 5);

doc.text('NDIS Number', rightColX, row1Y);
doc.text(safeText(client.ndis || '-'), rightColX, row1Y + 5);

// Phone
doc.text('Phone', rightColX, row2Y);
doc.text(safeText(client.phone || '-'), rightColX, row2Y + 5);

// ✅ Plan Period (UNDER Phone)
doc.text('Plan Period', rightColX, row3Y);
doc.text(safeText(planPeriod), rightColX, row3Y + 5);


y += CARD_HEIGHT + 8;

    //----------------------
    y += 8;
    doc.autoTable({
    startY: y,
    startX: MARGIN,

    head: [[
        'Item No. & Description',
        'Category',
        'Qty',
        'Unit Rate',
        'Total'
    ]],

    body: lines.map(li => ([
        `${li.supportItem}\nRecurring: ${li.interval} / ${li.durationPeriod}`,
        li.serviceType || '',
        `${li.qty} Hour`,
        money(li.price),
        money(li.cost)
    ])),

    // 🔑 KEY CHANGE
    theme: 'plain',

    styles: {
        font: 'Roboto-VariableFont_wdth,wght',
        fontSize: 9,
        cellPadding: 4,
        textColor: TEXT_GRAY,
        overflow: 'linebreak'
    },

    headStyles: {
        fillColor: [245, 246, 247],   // light header grey
        textColor: TEXT_GRAY,
        font: 'Roboto-Bold'
    },

    bodyStyles: {
        fillColor: [255, 255, 255]    // base white
    },

    alternateRowStyles: {
        fillColor: [250, 252, 255]    // VERY subtle blue-grey
    },

    columnStyles: {
        0: { cellWidth: 75 },
        1: { cellWidth: 35 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 27 }
    },

    // remove grid completely
    tableLineWidth: 0
});


    /* =====================================================
       TOTALS
    ===================================================== */
    ensureSpace(26);
    const subtotal = lines.reduce((s, l) => s + (l.cost || 0), 0);
    const gst = 0;
    const total = subtotal + gst;

    y = doc.lastAutoTable.finalY + 6;

    doc.autoTable({
        startY: y,
        body: [
            ['Subtotal (All Supports):', money(subtotal)],
            ['GST (10%):', money(gst)],
            ['TOTAL QUOTE VALUE', money(total)]
        ],
        theme: 'plain',
        columnStyles: {
            0: { halign: 'right' },
            1: { halign: 'right' }
        },
        didParseCell: data => {
            if (data.row.index === 2) {
                data.cell.styles.font = 'Roboto-Bold';
                data.cell.styles.fillColor = BRAND_BLUE;
                data.cell.styles.textColor = [255, 255, 255];
            }
        }
    });  


// doc.autoTable({
//     startY: y,
//      startX: MARGIN,

//     margin: { left: MARGIN },

//     theme: 'plain',

//     body: [
//         [
//             { content: 'Subtotal (All Supports):', colSpan: 4, styles: { halign: 'right' } },
//             { content: money(subtotal), styles: { halign: 'right' } }
//         ],
//         [
//             { content: 'GST (10%):', colSpan: 4, styles: { halign: 'right' } },
//             { content: money(gst), styles: { halign: 'right' } }
//         ],
//         [
//             {
//                 content: 'TOTAL QUOTE VALUE',
//                 colSpan: 4,
//                 styles: {
//                     halign: 'right',
//                     font: 'Roboto-Bold',
//                     fillColor: BRAND_BLUE,
//                     textColor: [255, 255, 255]
//                 }
//             },
//             {
//                 content: money(total),
//                 styles: {
//                     halign: 'right',
//                     font: 'Roboto-Bold',
//                     fillColor: BRAND_BLUE,
//                     textColor: [255, 255, 255]
//                 }
//             }
//         ]
//     ],

//     // 🔥 EXACT SAME WIDTHS AS ITEMS TABLE
//     columnStyles: {
//         0: { cellWidth: 75 },
//         1: { cellWidth: 35 },
//         2: { cellWidth: 20 },
//         3: { cellWidth: 25 },
//         4: { cellWidth: 27 }
//     },

//     tableLineWidth: 0
// });



  /*  doc.autoTable({
    startY: y,
    theme: 'plain',

    body: [
        [
            { content: 'Subtotal (All Supports):', colSpan: 4, styles: { halign: 'right' } },
            { content: money(subtotal), styles: { halign: 'right' } }
        ],
        [
            { content: 'GST (10%):', colSpan: 4, styles: { halign: 'right' } },
            { content: money(gst), styles: { halign: 'right' } }
        ],
        [
            {
                content: 'TOTAL QUOTE VALUE',
                colSpan: 4,
                styles: {
                    halign: 'right',
                    font: 'Roboto-Bold',
                    fillColor: BRAND_BLUE,
                    textColor: [255, 255, 255]
                }
            },
            {
                content: money(total),
                styles: {
                    halign: 'right',
                    font: 'Roboto-Bold',
                    fillColor: BRAND_BLUE,
                    textColor: [255, 255, 255]
                }
            }
        ]
    ],

    // 🔑 SAME column widths as ITEMS table
    columnStyles: {
        0: { cellWidth: 77 },
        1: { cellWidth: 35 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 }
    }
});  */



    /* =====================================================
       BUDGET IMPACT
    ===================================================== */
    y = doc.lastAutoTable.finalY + 10;

    ensureSpace(40); // header + table

    doc.setFont('Roboto-Bold', 'bold');
    doc.text(safeText('Budget Impact'), MARGIN, y);
    y += 5;

   doc.autoTable({
    startY: y,
    head: [[
        'Funding Category',
        'Available Budget',
        'Quote Amount',
        'Remaining After Quote',
        '% Used'
    ]],
    body: [[
        'Total Budget',
        money(this.totalAvailableFunds),
        money(total),
        money(this.totalAvailableFunds - total),
        this.totalAvailableFunds
            ? ((total / this.totalAvailableFunds) * 100).toFixed(1) + '%'
            : '0%'
    ]],
    theme: 'plain',              // ✅ IMPORTANT
    styles: {
        fontSize: 9,
        textColor: [0, 0, 0],
        cellPadding: 4
    },
    headStyles: {
        fillColor: BRAND_BLUE, // 🔵 same blue as UI header
        textColor: [255, 255, 255],
        font: 'Roboto-Bold'
    },
    bodyStyles: {
        fillColor: [255, 255, 255] // ✅ plain white row
    },
    alternateRowStyles: {
        fillColor: [245, 245, 245] // 🔘 very light grey (optional)
    }
});

    /* =====================================================
   TERMS & CONDITIONS (FIXED)
===================================================== */
   // y = doc.lastAutoTable.finalY + 8;
   y = doc.lastAutoTable?.finalY
    ? doc.lastAutoTable.finalY + 8
    : y + 8;
    ensureSpace(40); 

    doc.setFont('Roboto-Bold', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0); // BLACK
    doc.text(safeText('Terms and Conditions'), MARGIN, y);

    const stripHtml = (html) => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.innerText || temp.textContent || '';
    };

    y += 6;

    doc.setFont('Roboto-VariableFont_wdth,wght', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0); // BLACK

   // 1️⃣ Get user-entered terms (rich text OR plain)
        const rawTerms = this.termsAndConditions || '';

        // 2️⃣ Convert rich text HTML → readable text
      //  const termsText = stripHtml(rawTerms).trim();
                const termsText = this.richTextToPdfText(this.termsAndConditions);
                    doc.text(
                safeText(termsText),
                MARGIN,
                y,
                { maxWidth: PAGE_WIDTH - MARGIN * 2 }
            );

            // 🔑 ALWAYS move Y by rendered height
            y += doc.getTextDimensions(termsText, {
                maxWidth: PAGE_WIDTH - MARGIN * 2
            }).h + 8;

        // Optional fallback (if user left it empty)
        // const finalTermsText =
        //     termsText ||
        //     'Standard terms and conditions apply.';

        //     // Calculate height FIRST
        // const termsHeight =
        //     doc.getTextDimensions(finalTermsText, {
        //         maxWidth: PAGE_WIDTH - MARGIN * 2
        //     }).h + 6;

        // // Ensure it fits on the page
        // ensureSpace(termsHeight);

        // // Render Terms & Conditions
        // doc.text(
        //     safeText(finalTermsText),
        //     MARGIN,
        //     y,
        //     { maxWidth: PAGE_WIDTH - MARGIN * 2 }
        // );

        // // Move y AFTER rendering
        // y += termsHeight;   


    // doc.text(safeText(
    //     termsText),
    //     MARGIN,
    //     y,
    //     { maxWidth: PAGE_WIDTH - MARGIN * 2 }
    // );

    // // ✅ CRITICAL: move y AFTER text height
    // y += doc.getTextDimensions(termsText, {
    //     maxWidth: PAGE_WIDTH - MARGIN * 2
    // }).h + 6;



    /* =====================================================
       PRIVACY NOTICE not Changed
    ===================================================== */  
    ensureSpace(24);

        doc.setDrawColor(...BORDER_GRAY);
        doc.setFillColor(...LIGHT_BLUE);
        doc.roundedRect(
            MARGIN,
            y,
            PAGE_WIDTH - MARGIN * 2,
            16,
            4,
            4,
            'FD'
        );

        doc.setFont('Roboto-Bold', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(safeText('Privacy Notice'), MARGIN + 3, y + 6);

        doc.setFont('Roboto-VariableFont_wdth,wght', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...BRAND_BLUE); // 🔵 BLUE TEXT (EXPECTED UI)

        const privacyText =
            'Your personal information is handled in accordance with the Privacy Act 1988 and NDIS Practice Standards.';

        doc.text(safeText(
            privacyText),
            MARGIN + 3,
            y + 11,
            { maxWidth: PAGE_WIDTH - MARGIN * 2 - 6 }
        );

        // move y safely
        y += 22;


    /* =====================================================
       COMPLAINTS
    ===================================================== */
        
    // ensureSpace(24);

    //     doc.setFillColor(...CARD_BG);
    //     doc.setDrawColor(...BORDER_GRAY);
    //     doc.roundedRect(
    //         MARGIN,
    //         y,
    //         PAGE_WIDTH - MARGIN * 2,
    //         16,
    //         4,
    //         4,
    //         'FD'
    //     );

    //     doc.setFont('Roboto-Bold', 'bold');
    //     doc.setFontSize(9);
    //     doc.setTextColor(0, 0, 0);
    //     doc.text(safeText('Complaints'), MARGIN + 4, y + 6);

    //     doc.setFont('Roboto-VariableFont_wdth,wght', 'normal');
    //     doc.setFontSize(8);
    //     doc.setTextColor(0, 0, 0);

    //     const complaintsText =
    //         'If you have any concerns about our services, please contact us at complaints@tesseractcare.com.au or call 1300 123 456.';

    //     doc.text(safeText(
    //         complaintsText),
    //         MARGIN + 4,
    //         y + 11,
    //         { maxWidth: PAGE_WIDTH - MARGIN * 2 - 8 }
    //     );

    //     // move y forward so next section does NOT overlap
    //     y += 22;

    /* =====================================================
       QUOTE ACCEPTANCE
    ===================================================== */
   

        y += 20;
            ensureSpace(75);

    // Title
    doc.setFont('Roboto-Bold', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_GRAY);
    doc.text(safeText('Quote Acceptance'), MARGIN, y);

y += 6;

    // Subtitle
    doc.setFont('Roboto-VariableFont_wdth,wght', 'normal');
    doc.setFontSize(9);
    doc.text(safeText(
        'By signing below, you confirm that you have read and understood this quote, and wish to proceed with the supports outlined above.'),
        MARGIN,
        y,
        { maxWidth: PAGE_WIDTH - MARGIN * 2 }
    );      

    y += 10;

// Outer dashed container (single box)
const boxY = y;
const boxHeight = 68;

    doc.setDrawColor(...BORDER_GRAY);
    doc.setLineWidth(0.5);
    doc.setLineDash([4, 4], 0);
    doc.roundedRect(
        MARGIN,
        boxY,
        PAGE_WIDTH - MARGIN * 2,
        boxHeight,
        4,
        4
    );
doc.setLineDash([], 0);

// Column positions


// Start content inside box
const contentTop = boxY + 10;
let fieldY = boxY + 10;

// Section headers
doc.setFont('Roboto-Bold', 'bold');
doc.setFontSize(9);
doc.text(safeText('Participant or Authorized Representative'), leftX, contentTop);
doc.text(safeText('Date of Acceptance'), rightX, contentTop);
    fieldY += LABEL_GAP + EXTRA_PADDING;
// Line styling
doc.setFont('Roboto-VariableFont_wdth,wght', 'normal');
doc.setFontSize(8);
doc.setDrawColor(...BORDER_GRAY);
doc.setLineWidth(0.4);

// Signature
doc.line(leftX, contentTop + 10, leftX + 65, contentTop + 10);
doc.text(safeText('Signature'), leftX, contentTop + 15);

fieldY += LABEL_GAP + EXTRA_PADDING;

// Print Name (⬅️ spacing increased so it does NOT clash with border)
doc.line(leftX, contentTop + 22, leftX + 65, contentTop + 22);
doc.text(safeText('Print Name'), leftX, contentTop + 27);

fieldY += LINE_GAP + EXTRA_PADDING;

const PRINT_NAME_LINE_Y = contentTop + 22;
const FIELD_VERTICAL_GAP = 14; // consistent spacing
// const DATE_LINE_Y = PRINT_NAME_LINE_Y + FIELD_VERTICAL_GAP;

// doc.line(leftX, DATE_LINE_Y, leftX + 45, DATE_LINE_Y);
// doc.text(safeText('Date'), leftX, DATE_LINE_Y + 5);// Date (LEFT column – now INSIDE box)

const DATE_LINE_Y = contentTop + 36;

doc.line(leftX, DATE_LINE_Y, leftX + 65, DATE_LINE_Y); // placeholder line
doc.text(safeText('Date'), leftX, DATE_LINE_Y + 5);   // label under line

//doc.line(leftX, contentTop + 34, leftX + 65, contentTop + 34);
//doc.text(safeText('Date'), leftX, contentTop + 39);

fieldY += LABEL_GAP + EXTRA_PADDING;
//doc.line(leftX, fieldY, PAGE_WIDTH / 2 - 10, fieldY);

// Date of Acceptance (RIGHT column – centered vertically)
doc.line(rightX, contentTop + 10, rightX + 50, contentTop + 10);

// Move cursor below box
y = boxY + boxHeight + 10;
    /* =====================================================
       FOOTER
    ===================================================== */
    // doc.setFontSize(8);
    // doc.setTextColor(120);
    // doc.text(safeText(
    //     `${org.Name} | ABN ${org.ABN__c} | NDIS Provider ${org.NDIS_Provider__c}`),
    //     PAGE_WIDTH / 2,
    //     PAGE_HEIGHT - 10,
    //     { align: 'center' }
    // );
    // this.addPageNumbers(doc);

   // return btoa(doc.output());
   this.addFooters(doc, org);
   return doc.output('blob');
} 
//to dynamically add page numbers
  
    addFooters(doc, org) {
         const safeText = (v) =>
            v === undefined || v === null || Number.isNaN(v)
                ? ''
                : String(v);
        const pageCount = doc.getNumberOfPages();
        const PAGE_WIDTH = doc.internal.pageSize.getWidth();
        const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
        const FOOTER_Y = PAGE_HEIGHT - 10;

        doc.setFont('Roboto-VariableFont_wdth,wght', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(120);

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            // Footer text (company info)
            doc.text(
                safeText(`${org.Name} | ABN ${org.ABN__c} | NDIS Provider ${org.NDIS_Provider__c}`),
                PAGE_WIDTH / 2,
                FOOTER_Y - 4,
                { align: 'center' }
            );

            // Page number
            doc.text(
                `Page ${i} of ${pageCount}`,
                PAGE_WIDTH / 2,
                FOOTER_Y,
                { align: 'center' }
            );
        }
}



    // handleDownload() {
    // if (!this.quotePdfUrl) {
    //     this.showToast('Info', 'Save draft first', 'info');
    //     return;
    // }
    // window.open(this.quotePdfUrl, '_self');
    // }

    //     handleDownloadPdf() {
    //     if (!this.quotePdfUrl) {
    //         this.showToast('Info', 'Save draft first', 'info');
    //         return;
    //     }
    //     // 🔑 Create a hidden anchor tag
    //     const link = document.createElement('a');
    //     link.href = this.quotePdfUrl;
    //     link.download = `Quote_${this.quoteNumber}.pdf`; // 👈 file name in Downloads
    //     link.target = '_self';
    //     // Required for Firefox
    //     document.body.appendChild(link);
    //     link.click();
    //     document.body.removeChild(link);
    // }

       

//v3
//    async waitForQuotePdfUrl(quoteId, retries = 5, delay = 600) {
//     for (let i = 0; i < retries; i++) {
//         await new Promise(r => setTimeout(r, delay));

//         const q = await getQuoteById({ quoteId });

//         if (q?.QuotePdf_Url__c) {
//             return q.QuotePdf_Url__c;
//         }
//     }
//     return null;
// }



//------------------Latest Working-------------------------//
    // async generateAndUploadQuotePdf(quote) {
    //     console.log('🚀 ENTERED generateAndUploadQuotePdf');

    //     const base64 = this.generateQuotePdfBase64();

    //     if (!base64) {
    //         console.error('❌ PDF base64 generation failed');
    //         return;
    //     }
        
    //     console.log('📦 Uploading PDF...');

    //     await uploadFile({
    //         base64: JSON.stringify(base64), // 👈 force JSON
    //         filename: `${quote.Quote_Number__c || 'Quote'}.pdf`,
    //         recordId: quote.Id,
    //         obj: 'quote'
    //     });

    //     console.log('☁️ Upload completed');
    //          setTimeout(async () => {
    //         try {
    //             const q = await getQuoteById({ quoteId: quote.Id });
    //             console.log('⏳ Re-fetch after future:', q?.QuotePdf_Url__c);

    //             if (q?.QuotePdf_Url__c) {
    //                 this.quotePdfUrl = q.QuotePdf_Url__c;
    //                 console.log('✅ PDF URL now available:', this.quotePdfUrl);
    //             } else {
    //                 console.warn('⚠️ PDF uploaded but URL still not saved yet');
    //             }
    //         } catch (e) {
    //             console.error('❌ Error re-fetching quote', e);
    //         }
    //     }, 4000);
    //     // 🔑 Fetch updated Quote
    //     const q = await getQuoteById({ quoteId: quote.Id });

    //     if (q?.QuotePdf_Url__c) {
    //         this.quotePdfUrl = q.QuotePdf_Url__c;
    //         console.log('✅ PDF URL saved:', this.quotePdfUrl);
    //     }
    // }

// async generateAndUploadQuotePdf(quote) {
//         console.log('🚀 ENTERED generateAndUploadQuotePdf');

//         const base64 = this.generateQuotePdfBase64();

//         if (!base64) {
//             console.error('❌ PDF base64 generation failed');
//             return;
//         }
        
//         console.log('📦 Uploading PDF...');
//         // const now = new Date();

//         // // HHMM (24-hour)
//         // const hh = String(now.getHours()).padStart(2, '0');
//         // const mm = String(now.getMinutes()).padStart(2, '0');
//         // const timeStamp = `${hh}${mm}`;
//         // const fileName = `${quote.Quote_Number__c || 'Quote'}_${timeStamp}.pdf`;
        
//         await uploadFile({
//             base64: JSON.stringify(base64), // 👈 force JSON
//             filename: `${quote.Quote_Number__c || 'Quote'}.pdf`,
//             recordId: quote.Id,
//             obj: 'quote'
//         });

//         console.log('☁️ Upload completed');
//              setTimeout(async () => {
//             try {
//                 const q = await getQuoteById({ quoteId: quote.Id });
//                 console.log('⏳ Re-fetch after future:', q?.QuotePdf_Url__c);

//                 if (q?.QuotePdf_Url__c) {
//                     this.quotePdfUrl = q.QuotePdf_Url__c;
//                     console.log('✅ PDF URL now available:', this.quotePdfUrl);
//                 } else {
//                     console.warn('⚠️ PDF uploaded but URL still not saved yet');
//                 }
//             } catch (e) {
//                 console.error('❌ Error re-fetching quote', e);
//             }
//         }, 4000);
//         // 🔑 Fetch updated Quote
//        // const q = await getQuoteById({ quoteId: quote.Id });

//         // if (q?.QuotePdf_Url__c) {
//         //     this.quotePdfUrl = q.QuotePdf_Url__c;
//         //     console.log('✅ PDF URL saved:', this.quotePdfUrl);
//         // }
//     }

//pdf new
async generateAndUploadQuotePdf(quote) {
    console.log('🚀 Generating PDF as FILE');
   /*  this.isBuilderScreen=true; */
    const blob = this.generateQuotePdfBase64();
    if (!blob) {
        console.error('❌ PDF blob generation failed');
        return;
    }

    const fileName = `${quote.Quote_Number__c || 'Quote'}.pdf`;

    const pdfFile = new File(
        [blob],
        fileName,
        { type: 'application/pdf' }
    );

    console.log('📄 PDF File created:', pdfFile);

    // 🔑 Send to your existing handler
    this.processFiles([pdfFile]);

   /*  const q = await getQuoteById({ quoteId: quote.Id });
        if (q?.QuotePdf_Url__c) {
           // this.downloadLinks = q.QuotePdf_Url__c;
          //  this.uploadedFiles = q.Quotepdf_Json__c;
            console.log('✅ PDF URL saved:', this.quotePdfUrl);
            console.log('this.downloadLinks... ',this.downloadLinks);
            console.log('this.uploadedFiles...',this.uploadedFiles);
        } */


}

    handleUploadFinished(event) {
            this.uploadedFiles = event.detail.files;
        }

  async deleteFile(key) {
        if (!key) {
            console.error('[DELETE] key is required');
            return;
        }

        try {
            const resp = await fetch(ENDPOINTS.delete, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });

            const text = await resp.text();
            let json;
            try { json = JSON.parse(text); } catch { json = null; }

            if (!resp.ok) throw new Error(json?.error || `Delete failed ${resp.status}: ${text}`);

            console.log('[DELETE] success', json);

            // Optionally, dispatch an event if some other part of the app needs to know
          /*   this.dispatchEvent(new CustomEvent('filedeleted', {
                detail: { key },
                bubbles: true,
                composed: true
            }));

 */

           

            this.isDisabled=false;
            this.key='';
            this.isEdit=false;
           
            
        } catch (e) {
            console.error('[DELETE] error', e);
        }
    }
    @track isFileExpand=false;
  processFiles(files) {
    console.log('INSIDE ProcessFiles..');
    if (!files || !files.length) return;
    
    setTimeout(() => {
        this.isFileExpand = true;
        /* this.isBuilderScreen=true; */
        //CONS
        setTimeout(() => {
            const svc = this.template.querySelector('c-document-office-service');
            if (!svc) {
                console.warn('⚠️ No <c-document-office-service> component found.');
                return;
            }

            svc.incomingFiles = files;
            svc.modulePathFromParent = "ticket";
            svc.confirmUpload = true;
             this.isFileExpand = false;
        }, 1000); 
    }, 0);
  }
    @track uploadedFiles=[];
    async handleAwsUploadComplete(evt) {
         
        try {
            console.group('[AWS Upload Complete]');
            console.log('Raw event detail:', evt?.detail);

            //const { recordId, files = [], ctx } = evt.detail || {};
            const { recordId, files = [] } = evt.detail || {};
            console.log('recordId:', recordId);
            console.log('files count:', files.length, 'files:', files);
            //console.log('ctx (cellId):', ctx);

            if (!files.length) {
                console.warn('No uploaded files in payload; aborting.');
                console.groupEnd();
                return;
            }

            // Build arrays from the full payload
            const urls       = files.map(f => f?.url).filter(Boolean);
            const names      = files.map(f => f?.originalName).filter(Boolean);
            const types      = files.map(f => f?.type).filter(Boolean);
            const s3Keys     = files.map(f => f?.key).filter(Boolean);
            const modulePath = files[0]?.modulePath ?? undefined;
            const sizes      = files.map(f => f?.size).filter(Boolean);
            const totalBytes  = files.map(f => f?.totalBytes).filter(Boolean);
            const pdfUrl = urls[0]; //new
           const quoteJson= JSON.stringify(files);;
             const quoteId = this.quoteHeaderId; 

            console.log('All URLs:', urls);
            console.log('All names:', names);
            console.log('All types:', types);
            console.log('All s3 keys:', s3Keys);
            console.log('All sizes:', sizes);

            // If your field.value must be a string, use:
            // const valueForField = urls.join(',');
            const valueForField = urls; // ✅ save all URLs as an array
             if (!quoteId || !pdfUrl) {
            console.warn('⚠️ Missing quoteId or pdfUrl', { quoteId, pdfUrl });
            return;
        }
             await saveQuotePdfUrl({
            quoteId: quoteId,
            pdfUrl: pdfUrl,
            quoteJson: quoteJson
        });

        //Deleting logic for Key

        if (
            this.builderMode === 'DRAFT' &&
            this.existingPdfKey
        ) {
            console.log(
                '🗑 Deleting old PDF after successful upload:',
                this.existingPdfKey
            );

            this.deleteFile(this.existingPdfKey)
                .then(() => {
                    console.log('✅ Old PDF deleted');
                    this.existingPdfKey = null; // prevent double delete
                })
                .catch(err => {
                    console.warn('⚠️ Failed to delete old PDF', err);
                });
        }
               
            const metaPayload = {
                modulePath,
                recordId,
                uploadedAt: new Date().toISOString(),
                uploadedFiles: files,     // ✅ include ALL returned file objects
                rawEventDetail: evt.detail
            };           
            // Clear the input so the same file can be selected again
            this.quotePdfUrl=pdfUrl;
            this.uploadedFiles = files;
            this.fileName = names.join(', ');
            this.downloadLinks = urls;
            //this.fileSizeFromChild = sizes;           // this.showSpinner = false;
            this.fileSizeInBytes = totalBytes;
            console.log(' Files in last  : ',  files);
            console.log(' this.uploadedFiles  : ',  JSON.stringify(this.uploadedFiles));
            console.log(' this.downloadLinks : ',  JSON.stringify(this.downloadLinks));
           
            setTimeout(() => {
                this.loadDraftQuotes();
            }, 2500);
            this.isFileAttached=true;
            console.groupEnd();
        } catch (e) {
            console.error('[AWS Upload Complete] handler error:', e);
        }
    }

//  handleView(event) {
//     event.preventDefault();

//     if (!this.pdfReady) {
//         this.showToast(
//             'Please wait',
//             'PDF engine is still loading',
//             'info'
//         );
//         return;
//     }

//     try {
//         // Generate PDF locally (NO SAVE, NO UPLOAD)
//         const base64 = this.generateQuotePdfBase64();

//         const byteCharacters = atob(base64);
//         const byteNumbers = new Array(byteCharacters.length);

//         for (let i = 0; i < byteCharacters.length; i++) {
//             byteNumbers[i] = byteCharacters.charCodeAt(i);
//         }

//         const blob = new Blob(
//             [new Uint8Array(byteNumbers)],
//             { type: 'application/pdf' }
//         );

//         const previewUrl = URL.createObjectURL(blob);

//         // Open preview
//       //  window.open(previewUrl, '_blank');
//              this.currentUrl = previewUrl;
//         this.isPreviewModalOpen = true;

//         // Optional: hide other screens if needed
//         this.isBuilderScreen = false;
//         this.isListScreen = false;


//         console.log('👁️ Preview opened (local PDF)');

//     } catch (err) {
//         console.error('❌ Preview failed', err);
//         this.showToast(
//             'Error',
//             'Could not generate preview',
//             'error'
//         );
//     }
// }


handleView(event) {
    event.preventDefault();

    this.currentUrl = event.currentTarget.dataset.url;
    this.quoteHeaderId = event.currentTarget.dataset.quoteid; // ✅ ADD THIS

    console.log('file url  ' + this.currentUrl);
    console.log('✅ quoteHeaderId from preview button:', this.quoteHeaderId);

    this.isPreviewModalOpen = true;

    this.isBuilderScreen = false;
    this.isListScreen = false;
    this.isQuoteDraftScreen = false;

    console.log('👁️ Preview opened in iframe (AWS URL)');
}





       // @track isShowHistoryOpen=false;
    handleHistory(event){
        this.isListScreen = false;
        this.isBuilderScreen=false;
        this.quoteHistoryScreen=true;
        this.isPreviewHistory = true; // 🔧 RESET
    }
    handleBackHistory(){
        this.isListScreen = false;
        this.isBuilderScreen= true;
        this.quoteHistoryScreen=false;
        this.isPreviewHistory = false; // 🔧 RESET
        
    }

// handleSendViaTsign() {
//   // 1) Validate AWS URL
//   const url = this.quotePdfUrl || this.currentUrl;
//   if (!url) {
//     this.showToast("Error", "Quote PDF URL not found.", "error");
//     return;
//   }

//   // 2) Determine Quote Id
//   const quoteId = this.recordId || this.quoteid; // use whichever you have
//   if (!quoteId) {
//     this.showToast("Error", "Quote Id not found.", "error");
//     return;
//   }
//   console.log("quoteId..", this.quoteId);
//   console.log("quote id..", this.quoteid);
//   // 3) Publish LMS to open TSIGN in Dashboard
//   const message = {
//     source: "QUOTE",
//     tsignreUrl: url,
//     quoteId: quoteId,
//     serviceId: null
//   };

//   publish(this.context, TSIGN_MESSAGE_CHANNEL, message);

//   // Optional UX: close preview modal after sending
//   this.isPreviewModalOpen = false;

//   // Optional toast
//   this.showToast("Success", "Opening TSign…", "success");
// }


async handleSendViaTsign() {

  const url = this.quotePdfUrl || this.currentUrl;
  if (!url) {
    this.showToast("Error", "Quote PDF URL not found.", "error");
    return;
  }

  const quoteId = this.quoteHeaderId;

  if (!quoteId) {
    this.showToast("Error", "Quote Id not found.", "error");
    return;
  }

  try {

    // 🔥 FETCH EMAIL FROM APEX
    const email = await getQuoteRecipientEmail({ quoteId });

    console.log("📧 Email resolved from Quote:", email);

    if (!email) {
      this.showToast(
        "Error",
        "No Participant or New Contact email found for this Quote.",
        "error"
      );
      return;
    }

    // 🚀 Publish LMS
    const message = {
      source: "QUOTE",
      tsignreUrl: url,
      quoteId: quoteId,
      clientEmail: email,     // ✅ now populated
      serviceId: null
    };

    publish(this.context, TSIGN_MESSAGE_CHANNEL, message);

    this.isPreviewModalOpen = false;

    this.showToast("Success", "Opening TSign…", "success");

  } catch (err) {

    console.error("❌ Failed to resolve email for quote:", err);

    this.showToast(
      "Error",
      "Unable to fetch recipient email for TSign.",
      "error"
    );
  }
}


get isPreviewAvailable() {
    return this.isQuoteLoading || !this.quotePdfUrl;
}
closePreviewModal() {
    this.resetScreens();
    this.isPreviewModalOpen = false;
    this.currentUrl = null;
    this.isQuoteDraftScreen = true;
    this.isMenuContainer=true;
}

    // get isPreviewDisabled() {
    //     return !this.quotePdfUrl;
    // }


   
    // Reset builder (clear unsaved values only when creating new)
    handleReset() {
        if(this.builderMode === 'NEW')
             this.resetBuilderState();   
    }

    resetBuilderState() {

    // only reset builder UI — do not touch the participant list
    this.quoteHeaderId = null;
    this.quoteNumber = '';

    // 🔥 CLEAR BOTH
    this.state = '';
    this.quoteState = '';

    this.validFor = '30 days';
    this.serviceStart = '';
    this.serviceEnd = '';
    this.preparedBy = '';
    this.additionalNotes = '';
    this.termsAndConditions = '';
    this.quoteSupportItems = [];
}


    // Utility
    showToast(title, message, variant = 'info') {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

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
    @track pageSize = 10; // Default records per page
    @track totalRecords = 0;
    @track totalPages = 0;
    @track pageNumber = 1;
    @track pageSizeOptions = [10, 20, 50, 100];
    @api orgid;
     @track showSpinner;
      @track showLoadingSpinner=false;

//  get bDisableFirst() { return this.pageNumber === 1; }
//     get bDisableLast() { return this.pageNumber === this.totalPages || this.totalPages === 0; }

        get isFirstPage() {
            return this.pageNumber === 1;
        }

        get isLastPage() {
            return this.pageNumber === this.totalPages;
        }


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


// wiredTemplatesResult; // track the wire result

// @wire(getTemplates)
// wiredTemplates(result) {
//     console.log('📡 @wire(getTemplates) called');
//     this.wiredTemplatesResult = result;

//     const { data, error } = result;

//     if (data) {
//         console.log('✅ Templates fetched successfully:', data);

//         this.templateList = data.map(t => {
//             const mapped = {
//                 id: t.Id,
//                 name: t.Document_Name__c,
//                 documentType: t.Document_Type__c,
//                 AWS_Document__c: t.AWS_Document__c
//             };
//             console.log('📝 Mapped Template Record:', mapped);
//             return mapped;
//         });

//         console.log('📄 Final templateList:', this.templateList);

//     } else if (error) {
//         console.error('❌ Error fetching templates via wire:', error);
//     }
// }



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
            console.log('📌 Fetching documents for Org ID:', this.orgId);
            
            if (!this.orgId) {
                console.warn('⚠️ Org ID is undefined, skipping fetch.');
                return;
            }
    
            const data = await getQuoteDocumentRecords({ orgId: this.orgId });
            console.log('📌 Received Data:', data);
            this.allDocuments = data.map(doc => ({
                ...doc,
                CreatedDate: new Date(doc.CreatedDate),
                FormattedCreatedDate: new Intl.DateTimeFormat('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }).format(new Date(doc.CreatedDate)),
                // Status: doc.Status || 'Draft',
                RawStatus: doc.Status || 'Draft', 
                disableViewIcon: doc.Status !== 'Completed',
                showViewIcon: doc.Status === 'Completed',
                AllRecipients: doc.AllRecipients?.split('\n').join('<br/>') || '—',
                Status: (doc.Current_Recipient ? doc.Current_Recipient.split('@')[0] : '') + ' - ' + (doc.Status || 'Pending'),

            }));
    
            this.draftDocuments = this.allDocuments.filter(doc => doc.RawStatus === 'Draft');
            this.inProgressDocuments = this.allDocuments.filter(doc => doc.RawStatus === 'Pending');
            this.processedDocuments = this.allDocuments.filter(doc => doc.RawStatus === 'Completed');
    
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
    const selected = event.target.value;
    console.log(`📌 Status changed to: ${selected}`);
    this.selectedStatus = selected;
    this.pageNumber = 1;
    this.updateDisplayedRecords();
}

updateDisplayedRecords() {
    console.log(`🔄 Updating records for status: ${this.selectedStatus}`);
    let filteredData = [];

    if (this.selectedStatus === 'Draft') {
        filteredData = this.allDocuments.filter(doc => doc.RawStatus === 'Draft');
        console.log(`📄 Found ${filteredData.length} draft documents`);
    } else if (this.selectedStatus === 'Pending') {
        filteredData = this.allDocuments.filter(doc => doc.RawStatus === 'Pending');
        console.log(`📄 Found ${filteredData.length} in-progress (Pending) documents`);
    } else if (this.selectedStatus === 'Completed') {
        filteredData = this.allDocuments.filter(doc => doc.RawStatus === 'Completed');
        console.log(`📄 Found ${filteredData.length} completed documents`);
    } else {
        filteredData = [...this.allDocuments];
        console.log(`📄 Showing all documents: ${filteredData.length}`);
    }

    this.totalRecords = filteredData.length;
    console.log(`📊 Total Records: ${this.totalRecords}`);

    this.sortDocuments(filteredData);
    console.log('✅ Documents sorted');

    this.paginateRecords(filteredData);
    console.log('✅ Pagination applied');
}

    
   // Pagination Logic
//    handleRecordsPerPage(event) {
//    // this.pageSize = parseInt(event.target.value, 10);
//   //  this.pageNumber = 1;

//     this.pageSize = Number(event.target.value);
//     this.pageNumber = 1;   //  mandatory

//    if (this.isParticipantsTab) {
//         this.paginateParticipants();

//     } else if (this.isNewContactsTab) {
//         this.paginateNewContacts();

//     } else if (this.isQuoteDraftScreen) {
        
//         this.paginateDraftQuotes();
//     }
//     else{
//     let records = this.getCurrentDataArray();
//     this.sortDocuments(records);
//     this.paginateRecords(records);
//     }
           
// }

handleRecordsPerPage(event) {
    const size = Number(event.target.value);

    if (this.isParticipantsTab) {
        this.pageSize = size;
        this.pageNumber = 1;
        this.paginateParticipants();
    }
    else if (this.isNewContactsTab) {
        this.pageSize = size;
        this.pageNumber = 1;
        this.paginateNewContacts();
    }
    else {
        // 🔒 T-Sign legacy (unchanged)
        this.pageSize = size;
        this.pageNumber = 1;

        const records = this.getCurrentDataArray();
        this.sortDocuments(records);
        this.paginateRecords(records);
    }
}



paginateRecords(records) {
    // Ensure the records are sorted before paginating
    this.sortDocuments(records);

    this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
    let startIdx = (this.pageNumber - 1) * this.pageSize;
    let endIdx = startIdx + this.pageSize;

    this.displayedDocuments = records.slice(startIdx, endIdx);
    setTimeout(() => {
        this.displayedDocuments.forEach(doc => {
            const cell = this.template.querySelector(`td[data-id="${doc.Id}"]`);
            if (cell) {
                cell.innerHTML = doc.AllRecipients;
            }
        });
    }, 0);
}


//deleted pagenation duplicates Vamshi


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


async handleRowAction(event) {
    this.isLoading = true;

    const actionName = event.currentTarget.dataset.action;
    const recordId = event.currentTarget.dataset.id;

    console.log('🟢 Clicked action:', actionName);
    console.log('🆔 Record ID:', recordId);

    const row = this.displayedDocuments.find(doc => doc.Id === recordId);

    if (!row) {
        console.error('❌ Record not found:', recordId);
        this.isLoading = false;
        return;
    }

    console.log('📄 Document row:', JSON.stringify(row));
    console.log('📌 RawStatus:', row.RawStatus);
    console.log('🔗 SignatureURL:', row.SignatureURL);

    try {
        if (actionName === 'view' && row.RawStatus === 'Completed') {
            const pdfUrl = row.SignatureURL;
            if (pdfUrl) {
                console.log('👁️ Viewing PDF:', pdfUrl);

                // Let LWC paint spinner before heavy async work begins
                await Promise.resolve();

                // Wait until PDF is loaded + first page rendered
                await this.loadPdfForViewer(pdfUrl);

                // IMPORTANT: don't set isLoading=false here; renderPdfPage will do it
                return;
            } else {
                console.warn('⚠️ No SignatureURL available for viewing.');
            }

        } else if (actionName === 'download' && row.RawStatus === 'Completed') {
            const pdfUrl = row.SignatureURL;
            if (pdfUrl) {
                console.log('⬇️ Downloading PDF:', pdfUrl);
                const link = document.createElement('a');
                link.href = pdfUrl;
                link.download = `Document_${row.Id}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                console.error('❌ No SignatureURL available for download.');
            }

        } else if (actionName === 'comments') {
            console.log('💬 Opening comments modal for record:', row.Id);
            this.selectedRecordId = row.Id;
            this.showChatterModal = true;
            this.startPolling();
            this.fetchComments();
            this.messages = row.Comments ? this.parseComments(row.Comments) : [];

        } else {
            console.error('❗ Invalid action or unsupported status for:', actionName);
            this.error = 'Invalid action selected or status mismatch.';
        }
    } catch (err) {
        console.error('🚨 Error handling action:', err);
        this.error = 'An error occurred while processing your request.';
    } finally {
        // For all actions except "view", we can safely stop loading here.
        // For "view", we returned above and renderPdfPage handles it.
        this.isLoading = false;
    }
}


// Load PDF from URL and open the modal
async loadPdfForViewer(pdfUrl) {
    try {
        const encodedUrl = encodeURI(pdfUrl);

        // If pdfjsLib may not be loaded, you can ensure it here
        // await this.ensurePdfJsLoaded();

        const pdf = await window.pdfjsLib.getDocument(encodedUrl).promise;

        this.pdfViewerDoc = pdf;
        this.totalPages2 = pdf.numPages;
        this.currentPage = 1;
        this.isPdfViewerVisible = true;

        // Wait a microtask so modal/canvas can render in DOM before querySelector
        await Promise.resolve();

        // Wait until first page render completes (this will turn off isLoading)
        await this.renderPdfPage(this.currentPage);

        return pdf;
    } catch (error) {
        console.error('Error loading PDF:', error);
        this.showToast('Error', 'Failed to load PDF for preview.', 'error');
        this.isLoading = false;
        throw error;
    }
}


// Render current page on canvas
async renderPdfPage(pageNumber) {
    if (!this.pdfViewerDoc) return;

    if (this.renderingInProgress) {
        // Queue this page if rendering is already in progress
        this.pendingPageNumber = pageNumber;
        return;
    }

    this.renderingInProgress = true;

    try {
        const page = await this.pdfViewerDoc.getPage(pageNumber);

        const canvas = this.template.querySelector('.pdf-canvas');
        if (!canvas) {
            console.warn('Canvas not found');
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

        await renderTask.promise;

        // ✅ Finished rendering current page
        this.renderingInProgress = false;

        // Handle queued render requests
        if (this.pendingPageNumber !== null && this.pendingPageNumber !== pageNumber) {
            const next = this.pendingPageNumber;
            this.pendingPageNumber = null;
            this.currentPage = next;
            await this.renderPdfPage(next);
        }

    } catch (error) {
        console.error('Error rendering PDF page:', error);
        throw error;
    } finally {
        this.renderingInProgress = false;
        // ✅ Stop loading only after render attempt completes (success or fail)
        this.isLoading = false;
    }
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
//DRAFT PAGENATION GETTERS
get isDraftFirstPage() {
    return this.draftPageNumber === 1;
}

get isDraftLastPage() {
    return this.draftPageNumber === this.draftTotalPages;
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

@track sendIcon = Send_Icon;
 logo = TeSignLogo;


/* 🔹 Dynamic active classes */
get participantsTabClass() {
    return this.isParticipantsTab
        ? 'tab-btn active'
        : 'tab-btn';
}

get newContactsTabClass() {
    return this.isNewContactsTab
        ? 'tab-btn active'
        : 'tab-btn';
}


closeQuote() {
    const closeEvent = new CustomEvent('closequote', {
        bubbles: true,
        composed: true
    });
    this.dispatchEvent(closeEvent);
}

    getFrequencyLabel(freq, interval) {
        if (!freq || !interval) {
            return '';
        }

        const timesText = Number(freq) === 1 ? 'time' : 'times';
        return `${freq} ${timesText} ${interval.toLowerCase()}`;
    }
}