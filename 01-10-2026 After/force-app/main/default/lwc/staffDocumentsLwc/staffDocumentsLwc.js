import { LightningElement, track, api } from 'lwc';
    import fetchStaffDocuments from '@salesforce/apex/StaffController.fetchStaffDocuments';
    import { deleteRecord } from 'lightning/uiRecordApi';
    import { ShowToastEvent } from 'lightning/platformShowToastEvent';
    import updateDocumentStatus from '@salesforce/apex/StaffController.updateDocumentStatus';
    import fetchSharedDocuments from '@salesforce/apex/StaffController.fetchSharedDocuments';
    import saveStaffDocShares from '@salesforce/apex/StaffController.saveStaffDocShares';
    import fetchstaffBydoc from '@salesforce/apex/StaffController.fetchstaffBydoc';
    import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";
    import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';
    import getFacilityIdentityDocuments from '@salesforce/apex/FacilityDocumentController.getFacilityIdentityDocuments';
    import getStaffDocumentHistory from '@salesforce/apex/StaffController.getStaffDocumentHistory';
    import logDocumentView from '@salesforce/apex/StaffController.logDocumentView';
    import getAllArchivedStaffDocuments from '@salesforce/apex/StaffController.getAllArchivedStaffDocuments';
    import archiveChildStaffDocument from '@salesforce/apex/StaffController.archiveChildStaffDocument';
    import restoreDocument from '@salesforce/apex/StaffController.restoreDocument';
    import getParticipantShareStaffUsers from '@salesforce/apex/StaffController.getParticipantShareStaffUsers';

     const AWS_BASE = 'https://tesseractapps.com'; // no trailing slash
    const ENDPOINTS = {
        delete: `${AWS_BASE}/delete-file`
    };

    const ROLE_ORDER = [
        'Roster Manager',
        'Roster Coordinator',
        'HR Admin',
        'Payroll Admin',
        'NDIS Staff',
        'ICT Staff'
    ];

    export default class StaffDocumentsLwc extends LightningElement {
    @track staffList = [];
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
    @track showPreTaxRecordEditForm=false;
    @track totalDocuments;
    @track approvedCount;
    @track pendingCount;
    @track rejectedCount;
    @track expiredCount;
    @track expiringSoonCount;
    @track isStaffView=true;
    @track isDocTypeView =false;
    @track isStatusView=false;
    @track showRejectModal =false;
    @track isShowSpinner=false;
    @track assignmentFlag=false;
    @track staffOptions=[];
    @track stafflag=true;
    @track dynamicDocumentTypes = [];
    @track documentPointsMap = {};
    @track documentMetaMap = {};
    @track isExpiryRequired = false;
    @track showFormHistoryModal = false;
    @track groupedFormHistory = [];
    @track hasFormHistory = false;
    @track selectedDocumentId;

    //Sai Eswar
    @track archiveModal = false;
    @track archiveSearchKey = '';
    @track archivedRecords = [];
    @track allArchivedRecords = [];

    @track preTaxRecId='';

    ndisRoles = [
        { label: 'NDIS Staff', value: 'NDIS Staff' },
        { label: 'Roster Manager', value: 'Roster Manager' },
        { label: 'Roster Coordinator', value: 'Roster Coordinator' },
        { label: 'HR Admin', value: 'HR Admin' },
        { label: 'Payroll Admin', value: 'Payroll Admin' }
    ];


    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;

     get logoUrl() {
        return this.tLogoUrl;
    }

    get imageUrl() {
        return this.tImageUrl;
    }

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

    get byStaffClass() {
        return this.isStaffView
        ? 'tab-btn active'
        : 'tab-btn';
    }

    get byDocTypeClass() {
        return this.isDocTypeView 
        ? 'tab-btn active'
        : 'tab-btn';
    }

    get byStatusClass() {
        return this.isStatusView 
        ? 'tab-btn active'
        : 'tab-btn';
    }

        get isApprovedTileActive() {
        return this.selectedTileStatus === 'Approved';
    }

    get isPendingTileActive() {
        return this.selectedTileStatus === 'Pending';
    }

    get isExpiringTileActive() {
        return this.selectedTileStatus === 'Expiring Soon';
    }

    get isExpiredTileActive() {
        return this.selectedTileStatus === 'Expired';
    }

    get isRejectedTileActive() {
        return this.selectedTileStatus === 'Rejected';
    }

    get isTotalTileActive() {
        return this.selectedTileStatus==='All';
    }


    statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' }
    ];



      hierarchicalOptions = [
    {
        id: '100-points-id',
        label: '100 Points of ID',
        value: '100-points-id',
        children: [
            {
                id: 'primary-id',
                label: 'Primary Identity Document',
                value: 'primary-id',
                children: [
                    { id: 'aus-passport', label: 'Australian passport (60pts)', value: 'Australian Passport', parent: 'primary-id' },
                    { id: 'foreign-passport', label: 'Foreign passport (60pts)', value: 'Foreign Passport', parent: 'primary-id' },
                    { id: 'drivers-license', label: 'Driver’s License/permit (40pts)', value: 'Drivers Licence', parent: 'primary-id' },
                    { id: 'medicare-card', label: 'Medicare card (25pts)', value: 'Medicare Card', parent: 'primary-id' }
                ]
            },
            {
                id: 'secondary-id',
                label: 'Secondary Identity Document',
                value: 'secondary-id',
                children: [
                    { id: 'birth-cert', label: 'Birth certificate (40pts)', value: 'Birth Certificate', parent: 'secondary-id' },
                    { id: 'identity-cert', label: 'Certificate of identity (40pts)', value: 'Certificate of Identity', parent: 'secondary-id' },
                    { id: 'photo-id', label: 'Photo ID (40pts)', value: 'Photo ID', parent: 'secondary-id' },
                    { id: 'proof-age', label: 'Proof of age card (40pts)', value: 'Proof of Age Card', parent: 'secondary-id' },
                    { id: 'rating-authority', label: 'Rating authority (25pts)', value: 'Rating Authority', parent: 'secondary-id' },
                    { id: 'citizenship-cert', label: 'Citizenship certificate (25pts)', value: 'Citizenship Certificate', parent: 'secondary-id' },
                    { id: 'name-change-cert', label: 'Change of name certificate (25pts)', value: 'Change of Name Certificate', parent: 'secondary-id' },
                    { id: 'bank-statement-1', label: 'Bank statement 1 (20pts)', value: 'Bank Statement 1', parent: 'secondary-id' },
                    { id: 'bank-statement-2', label: 'Bank statement 2 (20pts)', value: 'Bank Statement 2', parent: 'secondary-id' },
                    { id: 'centrelink-card', label: 'Centrelink card (20pts)', value: 'Centrelink Card', parent: 'secondary-id' },
                    { id: 'dva-card', label: 'DVA card (20pts)', value: 'DVA Card', parent: 'secondary-id' },
                    { id: 'lease-agreement', label: 'Lease agreement (20pts)', value: 'Lease Agreement', parent: 'secondary-id' },
                    { id: 'marriage-cert', label: 'Marriage certificate (20pts)', value: 'Marriage Certificate', parent: 'secondary-id' },
                    { id: 'utility-bill-1', label: 'Utility bill 1 (20pts)', value: 'Utility Bill 1', parent: 'secondary-id' },
                    { id: 'utility-bill-2', label: 'Utility bill 2 (20pts)', value: 'Utility Bill 2', parent: 'secondary-id' },
                    { id: 'foreign-birth-cert', label: 'Birth certificate (foreign) (15pts)', value: 'Foreign Birth Certificate', parent: 'secondary-id' },
                    { id: 'indigenous-ref', label: 'Indigenous reference (15pts)', value: 'Indigenous Reference', parent: 'secondary-id' }
                ]
            }
        ]
    },
    {
        id: 'other-docs',
        label: 'Other Documents',
        value: 'other-docs',
        children: [
            { id: 'wwcc', label: 'Working With Children Check (WWCC)', value: 'Working With Children Check (WWCC)', parent: 'other-docs' },
            { id: 'ndis-screening', label: 'NDIS Worker Screening', value: 'NDIS Worker Screening', parent: 'other-docs' },
            { id: 'ndis-orientation', label: 'NDIS Worker Orientation Certificate', value: 'NDIS Worker Orientation Certificate', parent: 'other-docs' },
            { id: 'code-of-conduct', label: 'Signed Code of Conduct', value: 'Signed Code of Conduct', parent: 'other-docs' },
            { id: 'infection-training', label: 'Infection Control Training', value: 'Infection Control Training', parent: 'other-docs' },
            { id: 'first-aid', label: 'First Aid Certificate', value: 'First Aid Certificate', parent: 'other-docs' },
            { id: 'Qualifications', label: 'Qualifications', value: 'Qualifications', parent: 'other-docs' },
            { id: 'police-check', label: 'Police Check', value: 'Police Check', parent: 'other-docs' },
            { id: 'visa-status', label: 'Visa Status', value: 'Visa Status', parent: 'other-docs' },
            { id: 'vulnerable-people', label: 'Working With Vulnerable People', value: 'Working With Vulnerable People', parent: 'other-docs' },
            { id: 'covid-immunisation', label: 'Covid Immunisation', value: 'Covid Immunisation', parent: 'other-docs' },
            { id: 'registration', label: 'Registration', value: 'Registration', parent: 'other-docs' },
            { id: 'certificate', label: 'Certificate', value: 'Certificate', parent: 'other-docs' },
            { id: 'other', label: 'Other', value: 'Other', parent: 'other-docs' }
        ]
    }
     ];

    // docTypeOptions = [
    //     { label: 'All Documents', value: '' },
    //     { label: "Australian Passport", value: "Australian Passport" },
    //     { label: "Foreign Passport", value: "Foreign Passport" },
    //     { label: "Drivers Licence", value: "Drivers Licence" },
    //     { label: "Medicare Card", value: "Medicare Card" },
    //     { label: "Birth Certificate", value: "Birth Certificate" },
    //     { label: "Certificate of Identity", value: "Certificate of Identity" },
    //     { label: "Photo ID", value: "Photo ID" },
    //     { label: "Proof of Age Card", value: "Proof of Age Card" },
    //     { label: "Rating Authority", value: "Rating Authority" },
    //     { label: "Citizenship Certificate", value: "Citizenship Certificate" },
    //     { label: "Change of Name Certificate", value: "Change of Name Certificate" },
    //     { label: "Bank Statement 1", value: "Bank Statement 1" },
    //     { label: "Bank Statement 2", value: "Bank Statement 2" },
    //     { label: "Centrelink Card", value: "Centrelink Card" },
    //     { label: "DVA Card", value: "DVA Card" },
    //     { label: "Lease Agreement", value: "Lease Agreement" },
    //     { label: "Marriage Certificate", value: "Marriage Certificate" },
    //     { label: "Utility Bill 1", value: "Utility Bill 1" },
    //     { label: "Utility Bill 2", value: "Utility Bill 2" },
    //     { label: "Foreign Birth Certificate", value: "Foreign Birth Certificate" },
    //     { label: "Indigenous Reference", value: "Indigenous Reference" },

    //     // Other Documents
    //     { label: "Working With Children Check (WWCC)", value: "Working With Children Check (WWCC)" },
    //     { label: "NDIS Worker Screening", value: "NDIS Worker Screening" },
    //     { label: "NDIS Worker Orientation Certificate", value: "NDIS Worker Orientation Certificate" },
    //     { label: "Signed Code of Conduct", value: "Signed Code of Conduct" },
    //     { label: "Infection Control Training", value: "Infection Control Training" },
    //     { label: "First Aid Certificate", value: "First Aid Certificate" },
    //     { label: "Qualifications", value: "Qualifications" },
    //     { label: "Police Check", value: "Police Check" },
    //     { label: "Visa Status", value: "Visa Status" },
    //     { label: "Working With Vulnerable People", value: "Working With Vulnerable People" },
    //     { label: "Covid Immunisation", value: "Covid Immunisation" },
    //     { label: "Registration", value: "Registration" },
    //     { label: "Certificate", value: "Certificate" },
    //     { label: "Other", value: "Other" }
    // ];



    connectedCallback() {
        this.loadStaffDocuments();
        this.dynamicDocumentTypes = this.hierarchicalOptions || [];
    }

   /*  loadStaffDocuments(){
    fetchStaffDocuments()
    .then(result => {
        this.staffList = result.map(staff => ({
            ...staff,
            expand: false,
            docCount: staff.Child_Staffs__r ? staff.Child_Staffs__r.length : 0,
            role: staff.StaffRoles__r?.length ? staff.StaffRoles__r[0].RoleName__c : '',
            statusClass: staff.Status__c === true ? 'status-dot active' : 'status-dot inactive',
             Child_Staffs__r: staff.Child_Staffs__r?.map(doc => ({
             ...doc,
             FormattedDate: this.formatDate(doc.Expiry_Date__c)
    }))
        }));
           
            this.records=this.staffList;
            // this.totalRecords = this.staffList.length;
            this.pageSize = this.pageSizeOptions[0];
            this.pageNumber = 1; 
            this.applyFilters();
    })
    .catch(error => console.error(error));
    } */

 /*    loadStaffDocuments() {
    fetchStaffDocuments()
        .then(result => {

             this.handlestaff();

            this.staffList = result.map(staff => {

                return {
                    ...staff,
                    expand: false,
                    docCount: staff.Child_Staffs__r ? staff.Child_Staffs__r.length : 0,
                    role: staff.StaffRoles__r?.length ? staff.StaffRoles__r[0].RoleName__c : '',
                    statusClass: staff.Status__c === true ? 'status-dot active' : 'status-dot inactive',

                    // CHILD DOCUMENTS
                    Child_Staffs__r: staff.Child_Staffs__r?.map(doc => {
                        let daysLeft = doc.Expiry_Date__c ? this.calculateDaysLeft(doc.Expiry_Date__c) : null;
                        let isExpired = daysLeft !== null && daysLeft < 0;

                        return {
                            ...doc,

                            // FORMATTED DATE
                            FormattedDate: this.formatDate(doc.Expiry_Date__c),
                            UploadedDate: this.formatDate(doc.Uploaded_Date__c),

                            // TAGS
                            isMandatory: doc.Mandatory__c === true,
                            isPending: doc.Status__c === 'Pending',
                            isApproved: doc.Status__c === 'Approved',
                            isRejected: doc.Status__c === 'Rejected',

                            // EXPIRY
                            expiringSoon: daysLeft !== null && daysLeft <= 30 && daysLeft > 0,
                            daysLeft: daysLeft,
                             isExpired: isExpired,

                            // ICON COLOR (LIKE IN IMAGE)
                            statusIconClass:
                                doc.Status__c === 'Approved'
                                    ? 'icon-status approved'
                                    : doc.Status__c === 'Pending'
                                        ? 'icon-status pending'
                                        : 'icon-status other'
                        };
                    })
                };
            });

            this.staffOptions = this.staffList.map(staff => ({
                label: staff.NameToDisplay__c,
                value: staff.Id
            }));
            console.log('staffoptions',JSON.stringify(this.staffOptions));
            this.handlestaff();

            this.records = this.staffList;
            this.pageSize = this.pageSizeOptions[0];
            this.pageNumber = 1;

            ///this.applyFilters(); 
   
            if(this.isStaffView){
            this.groupByStaff();
            }
             if(this.isDocTypeView){
            this.groupByDocType();
            }
             if(this.isStatusView){
            this.groupByStatus();
            }
            
        })
        .catch(error => {
            console.error('Error loading staff documents:', error);
        });
} */

@track sharedDocs=[];
// loadStaffDocuments() {
//     // Ensure sharedDocs has a default
//     this.sharedDocs = [];

//     // 1️⃣ Get logged-in user type first
//     getCurrentLoggedUserInfo()
//         .then(userData => {
//             let userType = userData.User_Type__c;
//             console.log('User Type:', userType);

//             // 2️⃣ If NDIS or ICT → fetch shared docs FIRST, otherwise return empty array
//             if (userType === 'NDIS Staff' || userType === 'Roster Coordinator' || userType === 'ICT Staff') {
//                  this.stafflag=false;
//                 return fetchSharedDocuments();   // returns Promise<List<Child_Staff__c>>
               
//             }
//             return []; // no shared docs
//         })
//         .then(sharedDocs => {
//             // store shared docs (may be empty array)
//             this.sharedDocs = Array.isArray(sharedDocs) ? sharedDocs : [];
//             console.log('this.sharedDocs',JSON.stringify( this.sharedDocs));

//             // 3️⃣ NOW fetch main staff documents
//             return fetchStaffDocuments();
//         })
//         .then(result => {
//             // 4️⃣ Build staffList (include shared docs) and format children
//             const shared = this.sharedDocs || [];

//             this.staffList = (result || []).map(staff => {
//                 // combine own docs + shared docs (shared docs may include docs unrelated to this staff;
//                 // if you need to restrict by staff, filter shared accordingly)
//                 const combinedDocs = [
//                     ...(staff.Child_Staffs__r || []),
//                     ...shared
//                 ];

//                 return {
//                     ...staff,
//                     expand: false,
//                     docCount: combinedDocs.length,
//                     role: staff.StaffRoles__r?.length ? staff.StaffRoles__r[0].RoleName__c : '',
//                     statusClass: staff.Status__c ? 'status-dot active' : 'status-dot inactive',

//                     Child_Staffs__r: combinedDocs.map(doc => {
//                         let daysLeft = doc.Expiry_Date__c ? this.calculateDaysLeft(doc.Expiry_Date__c) : null;
//                         let isExpired = daysLeft !== null && daysLeft < 0;

//                         return {
//                             ...doc,
//                             FormattedDate: this.formatDate(doc.Expiry_Date__c),
//                             UploadedDate: this.formatDate(doc.Uploaded_Date__c),
//                             isMandatory: doc.Mandatory__c === true,
//                             isPending: doc.Status__c === 'Pending',
//                             isApproved: doc.Status__c === 'Approved',
//                             isRejected: doc.Status__c === 'Rejected',
//                             expiringSoon: daysLeft !== null && daysLeft <= 30 && daysLeft > 0,
//                             daysLeft: daysLeft,
//                             isExpired: isExpired,
//                             statusIconClass:
//                                 doc.Status__c === 'Approved'
//                                     ? 'icon-status approved'
//                                     : doc.Status__c === 'Pending'
//                                         ? 'icon-status pending'
//                                         : 'icon-status other'
//                         };
//                     })
//                 };
//             });
            

//             // 5️⃣ Build staffOptions AFTER staffList is ready
//             this.staffOptions = this.staffList.map(staff => ({
//                 label: staff.NameToDisplay__c || staff.Name,
//                 value: staff.Id
//             }));
//             console.log('staffOptions ==>', JSON.stringify(this.staffOptions));

//             const docTypeSet = new Set();

//             this.staffList.forEach(staff => {
//                 (staff.Child_Staffs__r || []).forEach(doc => {
//                     if (doc.Document_Type__c) {
//                         docTypeSet.add(doc.Document_Type__c);
//                     }
//                 });
//             });

//             this.docTypeOptions = [
//                 { label: 'All Document Types', value: '' },
//                 ...Array.from(docTypeSet)
//                     .sort()
//                     .map(type => ({
//                         label: type,
//                         value: type
//                     }))
//             ];

//             console.log('docTypeOptions:', JSON.stringify(this.docTypeOptions)); 

//             // 6️⃣ Finalize UI state / pagination
//             this.records = this.staffList;
//             this.pageSize = 10;
//             this.pageNumber = 1;

//             this.selectedTileStatus==='All';

//             // 7️⃣ Group / view logic
//             if (this.isStaffView) this.groupByStaff();
//             if (this.isDocTypeView) this.groupByDocType();
//             if (this.isStatusView) this.groupByStatus();

//             if (this._pendingRoute) {
//                 const { uid, tab, isEdit } = this._pendingRoute;
//                 this._pendingRoute = null;
//                 this.openByUID(uid, tab, isEdit);
//             }            
//         })
//         .catch(error => {
//             console.error('Error loading staff documents:', error);
//         });
// }

loadStaffDocuments() {

    // Ensure sharedDocs has a default
    this.sharedDocs = [];

    // Keep user type available for the later .then()
    let userType = '';

    // 1️⃣ Get logged-in user type first
    getCurrentLoggedUserInfo()
        .then(userData => {

            userType = userData.User_Type__c;

            console.log('User Type:', userType);

            // 2️⃣ If NDIS / Roster Coordinator / ICT Staff
            //    fetch shared docs FIRST
            if (
                userType === 'NDIS Staff' ||
                userType === 'Roster Coordinator' ||
                userType === 'Roster Manager' ||
                userType === 'ICT Staff' ||
                userType === 'HR Admin' ||
                userType === 'Payroll Admin'
            ) {

                this.stafflag = false;

                return fetchSharedDocuments();
            }

            // For CEO / Organisation / other users
            // there are no shared documents
            return [];
        })

        .then(sharedDocs => {

            // Store shared docs (may be empty array)
            this.sharedDocs =
                Array.isArray(sharedDocs)
                    ? sharedDocs
                    : [];

            console.log(
                'this.sharedDocs',
                JSON.stringify(this.sharedDocs)
            );

            // 3️⃣ NOW fetch main staff documents
            return fetchStaffDocuments();
        })

        .then(result => {

            // 4️⃣ Build staffList (include shared docs) and format children
            const shared = this.sharedDocs || [];

            if (
                userType === 'NDIS Staff' ||
                userType === 'Roster Coordinator' ||
                userType === 'Roster Manager' ||
                userType === 'ICT Staff' ||
                userType === 'HR Admin' ||
                userType === 'Payroll Admin'
            ) {

                const staffMap = {};

                // =====================================================
                // EXISTING OWN STAFF DOCUMENTS
                // =====================================================
                (result || []).forEach(staff => {

                    const ownDocs =
                        staff.Child_Staffs__r || [];

                    staffMap[staff.Id] = {

                        ...staff,

                        expand: false,

                        docCount:
                            ownDocs.length,

                        role:
                            staff.StaffRoles__r?.length
                                ? staff.StaffRoles__r[0]
                                    .RoleName__c
                                : '',

                        statusClass:
                            staff.Status__c
                                ? 'status-dot active'
                                : 'status-dot inactive',

                        Child_Staffs__r:
                            ownDocs.map(doc => {

                                let daysLeft =
                                    doc.Expiry_Date__c
                                        ? this.calculateDaysLeft(
                                            doc.Expiry_Date__c
                                        )
                                        : null;

                                let isExpired =
                                    daysLeft !== null &&
                                    daysLeft < 0;

                                return {

                                    ...doc,

                                    FormattedDate:
                                        this.formatDate(
                                            doc.Expiry_Date__c
                                        ),

                                    UploadedDate:
                                        this.formatDate(
                                            doc.Uploaded_Date__c
                                        ),

                                    isMandatory:
                                        doc.Mandatory__c === true,

                                    isPending:
                                        doc.Status__c === 'Pending',

                                    isApproved:
                                        doc.Status__c === 'Approved',

                                    isRejected:
                                        doc.Status__c === 'Rejected',

                                    expiringSoon:
                                        daysLeft !== null &&
                                        daysLeft <= 30 &&
                                        daysLeft > 0,

                                    daysLeft:
                                        daysLeft,

                                    isExpired:
                                        isExpired,

                                    statusIconClass:
                                        isExpired
                                            ? 'icon-status expired'
                                            : doc.Status__c === 'Approved'
                                                ? 'icon-status approved'
                                                : doc.Status__c === 'Pending'
                                                    ? 'icon-status pending'
                                                    : doc.Status__c === 'Rejected'
                                                        ? 'icon-status rejected'
                                                        : 'icon-status other'
                                };
                            })
                    };
                });


                // =====================================================
                // EXISTING SHARED DOCUMENT LOGIC
                // =====================================================

                shared.forEach(doc => {

                    const ownerId =
                        doc.StaffId;

                    if (!ownerId) {

                        console.warn(
                            'Shared document has no StaffId:',
                            JSON.stringify(doc)
                        );

                        return;
                    }


                    // =================================================
                    // If the original owner is not already in
                    // fetchStaffDocuments(), create the staff entry.
                    // =================================================

                    if (!staffMap[ownerId]) {

                        staffMap[ownerId] = {

                            Id: ownerId,

                            Name:
                                doc.StaffName,

                            NameToDisplay__c:
                                doc.StaffNameToDisplay ||
                                doc.StaffName,

                            expand: false,

                            docCount: 0,

                            role:
                                doc.StaffRole || '',

                            statusClass:
                                doc.StaffStatus
                                    ? 'status-dot active'
                                    : 'status-dot inactive',

                            Child_Staffs__r: []
                        };
                    }


                    // =================================================
                    // Normalize wrapper fields
                    // =================================================

                    const expiryDate =
                        doc.ExpiryDate ||
                        doc.Expiry_Date__c ||
                        null;

                    const status =
                        doc.Status ||
                        doc.Status__c ||
                        '';

                    const documentType =
                        doc.DocumentType ||
                        doc.Document_Type__c ||
                        '';


                    const daysLeft =
                        expiryDate
                            ? this.calculateDaysLeft(
                                expiryDate
                            )
                            : null;

                    const isExpired =
                        daysLeft !== null &&
                        daysLeft < 0;

                    const isExpiringSoon =
                        daysLeft !== null &&
                        daysLeft <= 30 &&
                        daysLeft > 0;


                    // =================================================
                    // Build mapped shared document
                    // =================================================

                    const mappedDoc = {

                        ...doc,


                        // ---------------------------------------------
                        // NORMALIZE WRAPPER FIELDS
                        // ---------------------------------------------

                        Expiry_Date__c:
                            expiryDate,

                        Status__c:
                            status,

                        Document_Type__c:
                            documentType,


                        // ---------------------------------------------
                        // IMPORTANT:
                        // Keep old field names so existing HTML/JS
                        // continues to work.
                        // ---------------------------------------------

                        Staff__c:
                            doc.StaffId ||
                            doc.Staff__c,

                        key__c:
                            doc.Key ||
                            doc.key__c,

                        View_File__c:
                            doc.ViewFile ||
                            doc.View_File__c,


                        // ---------------------------------------------
                        // STAFF INFORMATION
                        // ---------------------------------------------

                        staffName:
                            doc.StaffNameToDisplay ||
                            doc.StaffName,

                        role:
                            doc.StaffRole || '',


                        // ---------------------------------------------
                        // FORMATTING
                        // ---------------------------------------------

                        FormattedDate:
                            this.formatDate(
                                expiryDate
                            ),

                        UploadedDate:
                            this.formatDate(
                                doc.Uploaded_Date__c
                            ),


                        // ---------------------------------------------
                        // FLAGS
                        // ---------------------------------------------

                        isMandatory:
                            doc.Mandatory__c === true,

                        isPending:
                            status.toLowerCase() === 'pending',

                        isApproved:
                            status.toLowerCase() === 'approved',

                        isRejected:
                            status.toLowerCase() === 'rejected',

                        expiringSoon:
                            isExpiringSoon,

                        daysLeft:
                            daysLeft,

                        isExpired:
                            isExpired,


                        // ---------------------------------------------
                        // STATUS ICON
                        // ---------------------------------------------

                        statusIconClass:
                            isExpired
                                ? 'icon-status expired'
                                : isExpiringSoon
                                    ? 'icon-status expiring'
                                    : status.toLowerCase() === 'approved'
                                        ? 'icon-status approved'
                                        : status.toLowerCase() === 'pending'
                                            ? 'icon-status pending'
                                            : status.toLowerCase() === 'rejected'
                                                ? 'icon-status rejected'
                                                : 'icon-status other'
                    };


                    // =================================================
                    // Add shared document ONLY to its original owner
                    // =================================================

                    staffMap[ownerId]
                        .Child_Staffs__r
                        .push(mappedDoc);


                    // =================================================
                    // Update document count
                    // =================================================

                    staffMap[ownerId].docCount =
                        staffMap[ownerId]
                            .Child_Staffs__r
                            .length;
                });


                // =====================================================
                // FINAL STAFF LIST
                // =====================================================

                this.staffList =
                    Object.values(staffMap);

                console.log(
                    'STAFF LIST WITH OWN + SHARED DOCUMENTS:',
                    JSON.stringify(this.staffList)
                );


            } else {

                this.staffList =
                    (result || []).map(staff => {

                        const combinedDocs = [
                            ...(staff.Child_Staffs__r || [])
                        ];

                        return {

                            ...staff,

                            expand: false,

                            docCount:
                                combinedDocs.length,

                            role:
                                staff.StaffRoles__r?.length
                                    ? staff.StaffRoles__r[0]
                                        .RoleName__c
                                    : '',

                            statusClass:
                                staff.Status__c
                                    ? 'status-dot active'
                                    : 'status-dot inactive',

                            Child_Staffs__r:
                                combinedDocs.map(doc => {

                                    let daysLeft =
                                        doc.Expiry_Date__c
                                            ? this.calculateDaysLeft(
                                                doc.Expiry_Date__c
                                            )
                                            : null;

                                    let isExpired =
                                        daysLeft !== null &&
                                        daysLeft < 0;

                                    return {

                                        ...doc,

                                        FormattedDate:
                                            this.formatDate(
                                                doc.Expiry_Date__c
                                            ),

                                        UploadedDate:
                                            this.formatDate(
                                                doc.Uploaded_Date__c
                                            ),

                                        isMandatory:
                                            doc.Mandatory__c === true,

                                        isPending:
                                            doc.Status__c === 'Pending',

                                        isApproved:
                                            doc.Status__c === 'Approved',

                                        isRejected:
                                            doc.Status__c === 'Rejected',

                                        expiringSoon:
                                            daysLeft !== null &&
                                            daysLeft <= 30 &&
                                            daysLeft > 0,

                                        daysLeft:
                                            daysLeft,

                                        isExpired:
                                            isExpired,

                                        statusIconClass:
                                            doc.Status__c === 'Approved'
                                                ? 'icon-status approved'
                                                : doc.Status__c === 'Pending'
                                                    ? 'icon-status pending'
                                                    : 'icon-status other'
                                    };
                                })
                        };
                    });
            }


            // =========================================================
            // 5️⃣ Build staffOptions AFTER staffList is ready
            // =========================================================

            this.staffOptions =
                this.staffList.map(staff => ({

                    label:
                        staff.NameToDisplay__c ||
                        staff.Name,

                    value:
                        staff.Id
                }));

            console.log(
                'staffOptions ==>',
                JSON.stringify(
                    this.staffOptions
                )
            );


            const docTypeSet =
                new Set();


            this.staffList.forEach(staff => {

                (staff.Child_Staffs__r || [])
                    .forEach(doc => {

                        if (doc.Document_Type__c) {

                            docTypeSet.add(
                                doc.Document_Type__c
                            );
                        }
                    });
            });


            this.docTypeOptions = [

                {
                    label:
                        'All Document Types',

                    value:
                        ''
                },

                ...Array.from(docTypeSet)
                    .sort()
                    .map(type => ({

                        label:
                            type,

                        value:
                            type
                    }))
            ];


            console.log(
                'docTypeOptions:',
                JSON.stringify(
                    this.docTypeOptions
                )
            );


            // =========================================================
            // 6️⃣ Finalize UI state / pagination
            // =========================================================

            this.records =
                this.staffList;

            this.pageSize =
                10;

            this.pageNumber =
                1;

            this.selectedTileStatus =
                'All';


            // =========================================================
            // 7️⃣ Group / view logic
            // =========================================================

            if (this.isStaffView) {

                this.groupByStaff();
            }

            if (this.isDocTypeView) {

                this.groupByDocType();
            }

            if (this.isStatusView) {

                this.groupByStatus();
            }


            if (this._pendingRoute) {

                const {
                    uid,
                    tab,
                    isEdit
                } = this._pendingRoute;

                this._pendingRoute = null;

                this.openByUID(
                    uid,
                    tab,
                    isEdit
                );
            }

        })

        .catch(error => {

            console.error(
                'Error loading staff documents:',
                error
            );

        });
}

handlestaff() {

    getCurrentLoggedUserInfo()
        .then(userData => {
            console.log('user data ==>', JSON.stringify(userData));
            const userType = userData.User_Type__c;

            // Call only for NDIS or ICT
            if (userType === 'NDIS Staff' || userType === 'ICT Staff' || userType === 'Roster Coordinator') {

                console.log('NDIS/ICT staff detected → Calling shared docs method');

                // ❗ NO PARAMETERS here
                fetchSharedDocuments()
                    .then(sharedDocs => {
                        console.log('Shared docs:', JSON.stringify(sharedDocs));

                        // Merge into staffList
                        this.staffList = this.staffList.map(staff => {
                            return {
                                ...staff,
                                Child_Staffs__r: [
                                    ...(staff.Child_Staffs__r || []),
                                    ...sharedDocs
                                ],
                               
                            };
                        });

                        console.log('staffList after merge:', JSON.stringify(this.staffList));
                    })
                    .catch(error => {
                        console.error('Error fetching shared docs:', error);
                    });
            }

            console.log('User Type:', userType);
        })
        .catch(err => {
            console.error('Error fetching facility data:', err);
        });
}

calculateDaysLeft(dateStr) {
    const today = new Date();
    const expiry = new Date(dateStr);

    const diff = expiry - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    let day = String(date.getDate()).padStart(2, '0');
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

calculateSummaryCounts() {
    // reset counts
    this.totalDocuments = 0;
    this.approvedCount = 0;
    this.pendingCount = 0;
    this.rejectedCount = 0;
    this.expiredCount = 0;
    this.expiringSoonCount = 0;

    const today = new Date();
    const thresholdDays = 30; // expiring soon = within 30 days

    this.filteredList.forEach(staff => {
        staff.Child_Staffs__r?.forEach(doc => {
            this.totalDocuments++;

            const status = doc.Status__c ? doc.Status__c.toLowerCase() : '';

            // STATUS COUNTS
            if (status === 'approved') this.approvedCount++;
            else if (status === 'pending') this.pendingCount++;
            else if (status === 'rejected') this.rejectedCount++;

            // EXPIRY COUNTS
            if (doc.Expiry_Date__c) {
                const expiryDate = new Date(doc.Expiry_Date__c);

                const diffDays = Math.round(
                    (expiryDate - today) / (1000 * 60 * 60 * 24)
                );

                // expired (< 0 days)
                if (diffDays < 0) {
                    this.expiredCount++;
                }
                // expiring soon (within 30 days)
                else if (diffDays <= thresholdDays) {
                    this.expiringSoonCount++;
                }
            }
        });
    });
}


   /*  toggleSection(event) {
    const id = event.currentTarget.dataset.id;

    this.staffList = this.staffList.map(staff =>
    staff.Id === id
        ? { ...staff, expand: !staff.expand }
        : staff
    );
    } */
   toggleSection(event) {
    const id = event.currentTarget.dataset.id;
    console.log('ID',id);
    if (!id) return;

    // Toggle in current page (staffList)
    this.staffList = this.staffList.map(item => {
        if (item.Id === id || item.key === id) {
            return { ...item, expand: !item.expand };
        }
        return item;
    });

    // Also toggle in the full filteredList (so pagination keeps state)
    this.filteredList = this.filteredList.map(item => {
        if (item.Id === id || item.key === id) {
            return { ...item, expand: !item.expand };
        }
        return item;
    });
}


    expandAll() {
     this.staffList = this.staffList.map(staff => ({
        ...staff,
        expand: true
    }));

    // expand in filtered list (UI uses this)
    this.filteredList = this.filteredList.map(staff => ({
        ...staff,
        expand: true
    }));

    // refresh pagination
    this.paginationHelper();
   } 

    collapseAll() {
       this.staffList = this.staffList.map(staff => ({
        ...staff,
        expand: false
    }));

    this.filteredList = this.filteredList.map(staff => ({
        ...staff,
        expand: false
    }));

    this.paginationHelper();
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
        this.staffList = [];
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
            this.calculateSummaryCounts();
            let record = { ...this.filteredList[i] }; // shallow copy
            this.staffList.push(record);
        }

        console.log('this.staffList:', JSON.stringify(this.staffList)); 
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

  /*   applyFilters() {
    let data = [...this.records];
    console.log('data:', JSON.stringify(data));

    // ACTIVE STAFF ONLY
    if (this.activeFilterOn) {
    data = data.filter(staff => staff.Status__c === true);
    }

    // INACTIVE STAFF ONLY
    if (this.inactiveFilterOn) {
    data = data.filter(staff => staff.Status__c === false);
    }


    // SEARCH FILTER
    if (this.searchKey && this.searchKey.length > 0) {
    data = data.filter(staff =>
    staff.NameToDisplay__c.toLowerCase().includes(this.searchKey)
    );
    }
    console.log('data:', JSON.stringify(data));

    // SET FILTERED RESULTS
    this.filteredList = data;
    this.calculateSummaryCounts();
    this.totalRecords = this.filteredList.length;

    this.pageNumber = 1;
    this.paginationHelper();
    } */

    handleTileClick(event) {
    this.selectedTileStatus = event.currentTarget.dataset.status;
    console.log('this.selectedTileStatus',this.selectedTileStatus);
    this.pageNumber = 1;
    this.applyFilters();
    }

    applyFilters() {

    let data = [];

    // STAFF VIEW
    if (this.isStaffView) {
        data = [...this.records];

        if (this.searchKey) {
            const key = this.searchKey.toLowerCase();

            data = data.filter(staff =>
                staff.NameToDisplay__c.toLowerCase().includes(key) ||
                staff.Child_Staffs__r?.some(doc =>
                    (doc.Document_Type__c || '').toLowerCase().includes(key)
                )
            );
        }
         if (this.selectedDocType) {
            const key = this.selectedDocType.toLowerCase();

            data = data.filter(staff =>
                staff.NameToDisplay__c.toLowerCase().includes(key) ||
                staff.Child_Staffs__r?.some(doc =>
                    (doc.Document_Type__c || '').toLowerCase().includes(key)
                )
            );
        }
         if (this.selectedStatus) {
            const key = this.selectedStatus.toLowerCase();

            data = data.filter(staff =>
                staff.NameToDisplay__c.toLowerCase().includes(key) ||
                staff.Child_Staffs__r?.some(doc =>
                    (doc.Status__c || '').toLowerCase().includes(key)
                )
            );
        }
    }

    // DOCUMENT TYPE VIEW
    else if (this.isDocTypeView) {
        data = [...this.groupedList];

        if (this.searchKey) {
            const key = this.searchKey.toLowerCase();

            data = data.filter(group =>
                group.documentTypeName.toLowerCase().includes(key) ||
                group.Child_Staffs__r.some(doc =>
                    doc.staffName.toLowerCase().includes(key) ||
                    (doc.Document_Type__c || '').toLowerCase().includes(key)
                )
            );
        }
         if (this.selectedDocType) {
            const key = this.selectedDocType.toLowerCase();

            data = data.filter(group =>
                group.documentTypeName.toLowerCase().includes(key) ||
                group.Child_Staffs__r.some(doc =>
                    doc.staffName.toLowerCase().includes(key) ||
                    (doc.Document_Type__c || '').toLowerCase().includes(key)
                )
            );
        }
         if (this.selectedStatus) {
            const key = this.selectedStatus.toLowerCase();

            data = data.filter(group =>
                group.documentTypeName.toLowerCase().includes(key) ||
                group.Child_Staffs__r.some(doc =>
                    doc.staffName.toLowerCase().includes(key) ||
                    (doc.Status__c || '').toLowerCase().includes(key)
                )
            );
        }
    }

    // STATUS VIEW
    else if (this.isStatusView) {
        data = [...this.groupedList];

        const key = this.searchKey ? this.searchKey.toLowerCase() : '';
        const key1 = this.selectedDocType ? this.selectedDocType.toLowerCase() : '';
         const key2 = this.selectedStatus ? this.selectedStatus.toLowerCase() : '';
        

        if (key) {
            data = data.filter(group =>
                group.statusHeader.toLowerCase().includes(key) ||
                group.Child_Staffs__r.some(doc =>
                    doc.staffName.toLowerCase().includes(key) ||
                    (doc.Document_Type__c || '').toLowerCase().includes(key)
                )
            );
        }
         if (key1) {
            data = data.filter(group =>
                group.statusHeader.toLowerCase().includes(key1) ||
                group.Child_Staffs__r.some(doc =>
                    doc.staffName.toLowerCase().includes(key1) ||
                    (doc.Document_Type__c || '').toLowerCase().includes(key1)
                )
            );
        }
        if (key2) {
            data = data.filter(group =>
                group.statusHeader.toLowerCase().includes(key1) ||
                group.Child_Staffs__r.some(doc =>
                    doc.staffName.toLowerCase().includes(key1) ||
                    (doc.Status__c || '').toLowerCase().includes(key1)
                )
            );
        }
    }

    // 🔹 TILE FILTER (ADDITIVE – does not disturb existing filters)
if (this.selectedTileStatus==='All') {

   
}else{
     if (this.isStaffView) {
        data = data
            .map(staff => {
                const docs = staff.Child_Staffs__r.filter(doc => {
                    if (this.selectedTileStatus === 'Expiring Soon') {
                       return doc.expiringSoon === true;
                    }
                    if (this.selectedTileStatus === 'Expired') {
                        return doc.isExpired === true;
                        
                    }
                    return doc.Status__c === this.selectedTileStatus;
                });

                return { ...staff, Child_Staffs__r: docs, docCount: docs.length };
            })
            .filter(staff => staff.Child_Staffs__r.length > 0);
    }

    else if (this.isDocTypeView) {
       data = data.map(group => {
        const docs = (group.Child_Staffs__r || []).filter(doc => {
            if (this.selectedTileStatus === 'Expiring Soon') {
                return doc.expiringSoon === true;
            }
            if (this.selectedTileStatus === 'Expired') {
                return doc.isExpired === true;
            }
            return doc.Status__c === this.selectedTileStatus;
        });

        return {
            ...group,
            Child_Staffs__r: docs,
            docCount: docs.length,
            expand: false   // 👈 reset safely
        };
    });
    }

  
   else if (this.isStatusView) {
        data = data
            .map(group => {
                const docs =(group.Child_Staffs__r || []).filter(doc => {
                    if (this.selectedTileStatus === 'Expiring Soon') {
                        return doc.expiringSoon === true;
                    }
                    if (this.selectedTileStatus === 'Expired') {
                       return doc.isExpired === true;
                    }
                    return doc.Status__c === this.selectedTileStatus;
                });

                return { ...group, Child_Staffs__r: docs, docCount: docs.length, expand: false };
            })
            .filter(group => group.Child_Staffs__r.length > 0);
    }
}


 

    // Update final list for pagination
    this.filteredList = data;
   
    this.totalRecords = data.length;
    this.pageNumber = 1;

    this.paginationHelper();
}
 

@track selectedStatus;
@track selectedDocType;
handleStatusChange(event) {
    this.selectedStatus = event.target.value;
    this.applyFilters();
}

handleDocTypeChange(event) {
    this.selectedDocType = event.target.value;
    this.applyFilters();
}



/* applyFilters() {

    let data = [];

    // ============================
    // 1) STAFF VIEW FILTERING
    // ============================
    if (this.isStaffView) {

        data = [...this.records];

        // SEARCH
        if (this.searchKey) {
            const key = this.searchKey.toLowerCase();

            data = data.filter(staff =>
                staff.NameToDisplay__c.toLowerCase().includes(key) ||
                staff.Child_Staffs__r?.some(doc =>
                    (doc.Document_Type__c || '').toLowerCase().includes(key)
                )
            );
        }

        // STATUS DROPDOWN
        if (this.selectedStatus !== 'All') {
            data = data.filter(staff =>
                staff.Child_Staffs__r?.some(doc =>
                    (doc.Status__c || '').toLowerCase() === this.selectedStatus.toLowerCase()
                )
            );
        }

        // DOCUMENT TYPE DROPDOWN
        if (this.selectedDocType !== 'All') {
            data = data.filter(staff =>
                staff.Child_Staffs__r?.some(doc =>
                    (doc.Document_Type__c || '').toLowerCase() === this.selectedDocType.toLowerCase()
                )
            );
        }
    }

    // ============================
    // 2) DOCUMENT TYPE VIEW
    // ============================
    else if (this.isDocTypeView) {

        data = [...this.groupedList];

        // SEARCH
        if (this.searchKey) {
            const key = this.searchKey.toLowerCase();

            data = data.filter(group =>
                group.documentTypeName.toLowerCase().includes(key) ||
                group.Child_Staffs__r.some(doc =>
                    doc.staffName.toLowerCase().includes(key) ||
                    (doc.Document_Type__c || '').toLowerCase().includes(key)
                )
            );
        }

        // STATUS FILTER
        if (this.selectedStatus !== 'All') {
            data = data.filter(group =>
                group.Child_Staffs__r.some(doc =>
                    (doc.Status__c || '').toLowerCase() === this.selectedStatus.toLowerCase()
                )
            );
        }

        // DOCUMENT TYPE FILTER
        if (this.selectedDocType !== 'All') {
            data = data.filter(group =>
                group.documentTypeName.toLowerCase() === this.selectedDocType.toLowerCase()
            );
        }
    }

    // ============================
    // 3) STATUS VIEW
    // ============================
    else if (this.isStatusView) {

        data = [...this.groupedList];

        // SEARCH
        if (this.searchKey) {
            const key = this.searchKey.toLowerCase();

            data = data.filter(group =>
                group.statusHeader.toLowerCase().includes(key) ||
                group.Child_Staffs__r.some(doc =>
                    doc.staffName.toLowerCase().includes(key) ||
                    (doc.Document_Type__c || '').toLowerCase().includes(key)
                )
            );
        }

        // STATUS DROPDOWN
        if (this.selectedStatus !== 'All') {
            data = data.filter(group =>
                group.statusHeader.toLowerCase() === this.selectedStatus.toLowerCase()
            );
        }

        // DOCUMENT TYPE FILTER
        if (this.selectedDocType !== 'All') {
            data = data.filter(group =>
                group.Child_Staffs__r.some(doc =>
                    (doc.Document_Type__c || '').toLowerCase() === this.selectedDocType.toLowerCase()
                )
            );
        }
    }

    // ============================
    // UPDATE PAGINATION & LIST
    // ============================
    this.filteredList = data;
    this.totalRecords = data.length;
    this.pageNumber = 1;
    this.paginationHelper();
} */


    handleback(){
    this.isModalOpen = false;
    this.isHome=true;
    this._syncRecordRoute();
    }
    handleView(event) {
        event.preventDefault(); 
        const documentId = event.currentTarget.dataset.id;
        const url = event.currentTarget.dataset.url;
        logDocumentView({ documentId })
        .catch(error => {
            console.error('History logging failed', error);
        });
        this.currentUrl = url;
        // console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
        this.isHome=false;
        this.archiveModal = false;

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
    const key = event.currentTarget.dataset.key;
    console.log('id: '+id);
    console.log('key: '+key);
    deleteRecord(id).then(() => {
    this.dispatchEvent(
    new ShowToastEvent({
    title: 'Success',
    message: 'Staff Document has been deleted',
    variant: 'success'
    })
    );
   
    this.deleteFile(key);
    this.loadStaffDocuments();  
    }).catch(error => {
    console.log('error=>'+JSON.stringify(error));
    });

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

   /*  this.isDisabled=false;
    this.key='';
    this.isEdit=false; */


    } catch (e) {
    console.error('[DELETE] error', e);
    }
    }

    @track DocId;
    @track points; 
    @track key;
    @track typeOfDocument;

    async  handleEdit(event){
        console.log('================ EDIT CLICK ================');
        console.log('Doc Id:', event.currentTarget.dataset.id);
        console.log('Document Type from dataset:', event.currentTarget.dataset.doc);
        console.log('Current typeOfDocument before assignment:', this.typeOfDocument);
        this.DocId = event.currentTarget.dataset.id; 
        this.key =  event.currentTarget.dataset.key;
        this.typeOfDocument =  event.currentTarget.dataset.doc;
        console.log('typeOfDocument after assignment:', this.typeOfDocument);
        // 🔑 find staff + facility
        const staffId = event.currentTarget.dataset.staffid;
        this.currentStaffId = staffId; 

        const staff = this.records.find(s => s.Id === staffId);
        const facilityId = staff?.Facility__c;
        console.log('facilityId---',facilityId);

        if (facilityId) {
           /*  this.loadDocumentTypesForFacility(facilityId); */
            await this.loadDocumentTypesForFacility(facilityId);
        } else {
            console.warn('No facility found for staff');
            this.dynamicDocumentTypes = [];
        } 
        console.log('document data', this.loadDocumentTypesForFacility);
        this.points = this.documentPointsMap[this.typeOfDocument] || 0;
    
        // Get expiry requirement
        const meta = this.documentMetaMap[this.typeOfDocument];
        this.isExpiryRequired = meta?.expiryRequired === true;

        console.log('Opening modal...');
        this.showPreTaxRecordEditForm=true;
        this.documentedit=true;
        console.log('Before _syncRecordRoute');
        console.log('showPreTaxRecordEditForm =', this.showPreTaxRecordEditForm);
        console.log('documentedit =', this.documentedit);
        this._syncRecordRoute();
    }

     closePreTaxRecordEditForm(event){
        this.showPreTaxRecordEditForm=false;
         this.documentedit=false;
        this._syncRecordRoute();
       /*  this.uploadedFiles1 =[];
         this.key='';
         this.employeeeditflag=true;
         this.preTaxRecId='';
         this.totalfiles=[];
         this.documentedit=false;
         console.log('TOTALFILES',JSON.stringify( this.totalfiles)); */
    }

    handleDocTypeChange1(event) {
        this.typeOfDocument = event.detail.value;
        this.points = this.documentPointsMap[this.typeOfDocument] || 0;
        const meta = this.documentMetaMap[this.typeOfDocument];
        this.isExpiryRequired = meta?.expiryRequired === true;
    }

     @track totalfiles=[];
     @track documentedit=false; 
     @track uploadedFiles1=[];

    triggerFileDialog() {
        const input = this.template.querySelector('.file-input');
        if (input) {
            input.click();
        }
    }

    handleFileUploadInputChange(event) {
        let files = Array.from(event.target.files || []);
    
        const invalidFile = files.find(f => !this.isAllowedFile(f));
        if (invalidFile) {
            this.showToast('Error', `File type not allowed: ${invalidFile.name}. Only PDF and image files (.pdf, .png, .jpg, .jpeg) are allowed.`, 'error');
            event.target.value = ''; // reset
            return;
        }
        const longNameFile = files.find(f => f.name.length > 50);
            if (longNameFile) {
                this.showToast(
                    'Error',
                    `Filename too long: "${longNameFile.name}". Maximum allowed is 50 characters.`,
                    'error'
                );
                event.target.value = '';
                return;
            }

        if (this.documentedit) {
            // Allow only one file in edit mode
            if (this.totalfiles.length >= 1) {
                this.showToast('Error', 'Only one file can be uploaded in edit mode.', 'error');
                event.target.value = ''; // reset input
                return;
            }
            if (files.length > 1) {
                this.showToast('Error', 'You can only upload one file in edit mode.', 'error');
                return;
            }
            // Take only the first file
            files = [files[0]];
        }
        this.totalfiles.push(...files);

        this.processFiles(files);

        // Reset file input so same file can be re-uploaded if needed
        event.target.value = '';
    }
    
    processFiles(files) {
    if (!files || !files.length) return;

    setTimeout(() => {
        this.isFileExpand = true;

        setTimeout(() => {
            const svc = this.template.querySelector('c-document-office-service');
            if (!svc) {
                console.warn('⚠️ No <c-document-office-service> component found.');
                return;
            }

            svc.incomingFiles = files;
        }, 1000);
    }, 0);
  }


   handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
    }

    ALLOWED_FILE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];

    isAllowedFile(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return this.ALLOWED_FILE_EXTENSIONS.includes(ext);
    }

    handleDrop(event) {
     event.preventDefault();
     event.stopPropagation();
    let files = Array.from(event.dataTransfer.files || []);
     const invalidFile = files.find(f => !this.isAllowedFile(f));
    if (invalidFile) {
        this.showToast('Error', `File type not allowed: ${invalidFile.name}. Only PDF and image files (.pdf, .png, .jpg, .jpeg) are allowed.`, 'error');
        event.target.value = ''; // reset
        return;
    }
    if (this.documentedit) {
        // 🚫 Allow only one file in edit mode
        if (this.totalfiles.length >= 1) {
            this.showToast('Error', 'Only one file can be uploaded in edit mode.', 'error');
            return;
        }

        if (files.length > 1) {
            this.showToast('Error', 'You can only upload one file in edit mode.', 'error');
            return;
        }

        files = [files[0]]; // take only the first file
    }

    // Push to tracking array
    this.totalfiles.push(...files);

    // Process files as usual
    this.processFiles(files);
    }


     showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant
        });
        this.dispatchEvent(event);
    }

     @track isFileExpand = false;

     handleAwsUploadComplete(evt) {
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

            console.log('All URLs:', urls);
            console.log('All names:', names);
            console.log('All types:', types);
            console.log('All s3 keys:', s3Keys);
            console.log('All sizes:', sizes);

            // If your field.value must be a string, use:
            // const valueForField = urls.join(',');
            const valueForField = urls; // ✅ save all URLs as an array

            const metaPayload = {
                modulePath,
                recordId,
                uploadedAt: new Date().toISOString(),
                uploadedFiles: files,     // ✅ include ALL returned file objects
                rawEventDetail: evt.detail
            };

           

            // Clear the input so the same file can be selected again
            if(this.documentedit){
                 this.uploadedFiles1=files;
                 this.isFileExpand = true;
            }/* else{
                 this.processSelectedFiles(files);
                 this.isFileExpand = false;
            } */
           
           // this.uploadedFiles = files;
           // this.fileName = names.join(', ');
           // this.downloadLinks = urls;
            //this.fileSizeFromChild = sizes;           // this.showSpinner = false;
            this.fileSizeInBytes = totalBytes;
            console.log(' Files in last  : ',  files);
            console.log(' this.uploadedFiles  : ',  JSON.stringify(this.uploadedFiles1));
           
            this.isFileAttached=true;
            console.groupEnd();
        } catch (e) {
            console.error('[AWS Upload Complete] handler error:', e);
        }
    }

    handlefilecancel(event){
    console.log('child called');
        console.log('Cancel event received:', event.detail.message);
    this.totalfiles=[];
    }

    handleFileDeleted(event) {
    console.group('handleFileDeleted called ');
    const { key, fileId ,files} = event.detail;
    console.log('File deleted in child. Key:', key, 'FileId:', fileId, 'files:',JSON.stringify(files) );

    // Example: remove it from parent's tracking
    this.uploadedFiles1 = this.uploadedFiles1.filter(f => f.fileId !== fileId);
    console.log(' this.uploadedFiles in handleFileDeleted: ',  JSON.stringify(this.uploadedFiles1));
    this.documentedit = false;
    // if (!this.uploadedFiles || this.uploadedFiles.length === 0) {
    //    this.isFileExpand = false;
    // }
    if (!files || files.length === 0) {
        this.isFileExpand = false;
        
    }
   } 

    /* handlePreTaxRecordFormSubmit(event) {
        event.preventDefault(); // stop the form from submitting
        console.log('record edit form');
        console.log('key:', this.key);

        const fields = event.detail.fields;

        // ⭐ ALWAYS APPROVE DOCUMENT UPON UPLOAD
        fields.Status__c = 'Approved';

        fields.Document_Type__c = this.typeOfDocument;

        if (this.uploadedFiles1 && this.uploadedFiles1.length > 0) {
            this.deleteFile(this.key);

            fields.View_File__c = this.uploadedFiles1[0].url;
            fields.Awsjson__c = JSON.stringify(this.uploadedFiles1[0]);
            fields.File_Name__c = this.uploadedFiles1[0].originalName;
            fields.key__c = this.uploadedFiles1[0].key;
        }

        console.log('After fields>>' + JSON.stringify(fields));

        this.template.querySelector(
            'lightning-record-edit-form[data-recid="PreTaxForm"]'
        ).submit(fields);
    } */
    
    handlePreTaxRecordFormSubmit(event) {
        event.preventDefault();

        console.log('📝 record edit form submit');
        console.log('📄 Selected Document Type:', this.typeOfDocument);

        const fields = event.detail.fields;

        // ----------------------------------------------------
        // 🔍 Determine expiry requirement dynamically
        // ----------------------------------------------------
        const docMeta = this.documentMetaMap?.[this.typeOfDocument];

        const isExpiryRequired =
            docMeta && docMeta.expiryRequired === true;

        console.log('⏰ Expiry required:', isExpiryRequired);
        console.log('📅 Expiry Date value:', fields.Expiry_Date__c);

        // ----------------------------------------------------
        // ❌ BLOCK SAVE if expiry is required but missing
        // ----------------------------------------------------
        if (isExpiryRequired && !fields.Expiry_Date__c) {
            console.warn('❌ Expiry Date is required but missing');

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Missing Expiry Date',
                    message: 'Expiry Date is required for this document.',
                    variant: 'error'
                })
            );
            return; // ⛔ STOP SUBMIT
        }

        // ----------------------------------------------------
        // ✅ Business logic
        // ----------------------------------------------------
        fields.Status__c = 'Approved';
        fields.Document_Type__c = this.typeOfDocument;

        // ----------------------------------------------------
        // 📎 File handling
        // ----------------------------------------------------
        if (this.uploadedFiles1?.length) {
            this.deleteFile(this.key);

            fields.View_File__c = this.uploadedFiles1[0].url;
            fields.Awsjson__c = JSON.stringify(this.uploadedFiles1[0]);
            fields.File_Name__c = this.uploadedFiles1[0].originalName;
            fields.key__c = this.uploadedFiles1[0].key;
        }

        console.log('🚀 Submitting fields:', JSON.stringify(fields, null, 2));

        this.template
            .querySelector('lightning-record-edit-form[data-recid="PreTaxForm"]')
            .submit(fields);
    }

      handlePreTaxSuccess(event){
        this.preTaxRecId=event.detail.id;
        
       
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success!!',
                message: 'Changes Saved Successfully !!',
                variant: 'success',
            }),
        );
        this.showPreTaxRecordEditForm=false;
        this.loadStaffDocuments();
        if (this.showFormHistoryModal &&
            this.selectedDocumentId === event.detail.id) {
            this.loadStaffDocumentHistory();
        }
        
            this.uploadedFiles1 =[];
            this.key='';
            this.documentedit=false;
                        
    }

      

    groupByStaff() {
    // set view flags
    this.viewMode = 'staff';
    this.isDocTypeView = false;
    this.isStatusView = false;
    this.isStaffView = true;
    this.filteredList=[];
    this.staffList=[];
    this.selectedDocType ='';
    this.selectedStatus ='';
    this.selectedTileStatus='All';
    // rebuild filteredList from original records (fresh copy) and clear expand on each staff
    this.filteredList = this.records;

    // counts and pagination
    this.totalRecords = this.filteredList.length;
    this.pageNumber = 1;
    this.paginationHelper();
}


    groupByDocType() {
        this.selectedTileStatus='All';
        this.viewMode = 'type';
        this.selectedDocType ='';
        this.selectedStatus ='';
        this.groupByDocumentType();
    }

    groupByStatus() {
        this.viewMode = 'status';
        this.selectedTileStatus='All';
         this.selectedDocType ='';
        this.selectedStatus ='';
        this.groupByDocumentStatus();
    }

     @track groupedList=[];

   /*  groupByDocumentType() {
    let groups = {};

    this.records.forEach(staff => {
        staff.Child_Staffs__r?.forEach(doc => {
            if (!groups[doc.Document_Type__c]) groups[doc.Document_Type__c] = [];
            
            groups[doc.Document_Type__c].push({
                ...doc,
                staffName: staff.NameToDisplay__c,
                role: staff.role
            });
        });
    });

    this.groupedList = Object.keys(groups).map(type => ({
        typeName: type,
        documents: groups[type]
    }));

    console.log('Grouped by Type:', JSON.stringify(this.groupedList));
} */

    groupByDocumentType() {
    //this.viewMode = 'doctype';
    this.isDocTypeView = true;
    this.isStatusView = false;
    this.isStaffView = false;
     this.filteredList=[];
     this.staffList=[];
    const groups = {}; // keyed by doc type
    const result = this.records;
    // Iterate original staff records and group their child docs by Document_Type__c
    console.log('Original Records:', JSON.stringify(result));
    result.forEach(staff => {
        staff.Child_Staffs__r?.forEach(doc => {
            const type = doc.DocumentType || doc.Document_Type__c || 'Unknown';
            const safeTypeKey = type.replace(/\s+/g, '_').toLowerCase();

            // ensure group exists and always has Child_Staffs__r array
            if (!groups[type]) {
                groups[type] = {
                    key: `doctype_${safeTypeKey}`,
                    documentTypeName: type,
                    Child_Staffs__r: [],
                    docCount: 0,
                    mandatoryCount: 0,
                    expand: false
                };
            }

            // compute doc-level UI flags (reuse your helper methods)
            const daysLeft = doc.Expiry_Date__c ? this.calculateDaysLeft(doc.Expiry_Date__c) : null;
            const isExpired = daysLeft !== null && daysLeft < 0;
            const mappedDoc = {
                ...doc,
                staffName: staff.NameToDisplay__c,
                role: staff.StaffRoles__r?.length ? staff.StaffRoles__r[0].RoleName__c : staff.role || '',
                FormattedDate: this.formatDate(doc.Expiry_Date__c),
                UploadedDate: this.formatDate(doc.Uploaded_Date__c),
                isMandatory: doc.Mandatory__c === true,
                facilityId: staff.Facility__c,
                isPending: doc.Status__c === 'Pending',
                isApproved: doc.Status__c === 'Approved',
                isRejected: doc.Status__c === 'Rejected',
                expiringSoon: daysLeft !== null && daysLeft <= 30 && daysLeft > 0,
                daysLeft,
                isExpired,
                statusIconClass: isExpired
                    ? 'icon-status expired'
                    : doc.Status__c === 'Approved'
                        ? 'icon-status approved'
                        : doc.Status__c === 'Pending'
                            ? 'icon-status pending'
                            : 'icon-status other'
            };

            // push and update counters
            groups[type].Child_Staffs__r.push(mappedDoc);
            groups[type].docCount = groups[type].Child_Staffs__r.length;
            if (mappedDoc.isMandatory) groups[type].mandatoryCount++;
        });
    });

    // convert to array in the same shape your staff template expects
    this.groupedList = Object.values(groups);

    // If you are using filteredList/staffList + paginationHelper like before:
    this.filteredList = [...this.groupedList];
    this.totalRecords = this.filteredList.length;
    this.pageNumber = 1;
    this.paginationHelper();

    console.log('Grouped by Type (groups):', JSON.stringify(this.groupedList));
}

groupByDocumentStatus() {
    //this.viewMode = 'status';
    this.isStatusView = true;
    this.isDocTypeView = false;
    this.isStaffView = false;
this.filteredList=[];
this.staffList=[];
    const groups = {}; // keyed by status groups

    // Helper: return normalized status name
    const getStatusBucket = (doc, daysLeft, isExpired) => {
         if (isExpired) return 'Expired';
        if (daysLeft !== null && daysLeft <= 30 && daysLeft > 0) return 'Expiring Soon'; 
        if (doc.Status__c === 'Approved') return 'Approved';
        if (doc.Status__c === 'Pending') return 'Pending';
        if (doc.Status__c === 'Rejected') return 'Rejected';
         return 'Other'; 
    };

    // Build groups from staff records
    const result = this.records;
    result.forEach(staff => {
        staff.Child_Staffs__r?.forEach(doc => {

            const daysLeft = doc.Expiry_Date__c ? this.calculateDaysLeft(doc.Expiry_Date__c) : null;
            const isExpired = daysLeft !== null && daysLeft < 0;

            // Decide status bucket
            const bucketName = getStatusBucket(doc, daysLeft, isExpired);
            const safeStatusKey = bucketName.replace(/\s+/g, '_').toLowerCase();

            // ensure group exists and always has Child_Staffs__r array
            if (!groups[bucketName]) {
                groups[bucketName] = {
                    key: `status_${safeStatusKey}`,
                    statusHeader: bucketName,
                    Child_Staffs__r: [],
                    docCount: 0,
                    expand: false
                };
            }

            // Build mapped doc (same structure as documentType version)
            const mappedDoc = {
                ...doc,
                staffName: staff.NameToDisplay__c,
                role: staff.StaffRoles__r?.length ? staff.StaffRoles__r[0].RoleName__c : staff.role || '',
                FormattedDate: this.formatDate(doc.Expiry_Date__c),
                UploadedDate: this.formatDate(doc.Uploaded_Date__c),
                facilityId: staff.Facility__c,
                isMandatory: doc.Mandatory__c === true,
                isPending: doc.Status__c === 'Pending',
                isApproved: doc.Status__c === 'Approved',
                isRejected: doc.Status__c === 'Rejected',

                expiringSoon: daysLeft !== null && daysLeft <= 30 && daysLeft > 0,
                daysLeft,
                isExpired,

                statusIconClass:
                    isExpired
                        ? 'icon-status expired'
                        : doc.Status__c === 'Approved'
                            ? 'icon-status approved'
                            : doc.Status__c === 'Pending'
                                ? 'icon-status pending'
                                : doc.Status__c === 'Rejected'
                                    ? 'icon-status rejected'
                                    : 'icon-status other'
            };

            // Add to bucket
            groups[bucketName].Child_Staffs__r.push(mappedDoc);
            groups[bucketName].docCount = groups[bucketName].Child_Staffs__r.length;
        });
    });

    // Convert object → array
    this.groupedList = Object.values(groups);
    this.filteredList=[];
    // for pagination
    this.filteredList = [...this.groupedList];
    this.totalRecords = this.filteredList.length;
    this.pageNumber = 1;
    this.paginationHelper();

    console.log('Grouped by Status:', JSON.stringify(this.groupedList));
}


exportToCSV() {

    if (!this.filteredList || this.filteredList.length === 0) {
        alert('No data available to export.');
        return;
    }

    let rows = [];
    let headers = [
        "Staff Name",
        "Role",
        "Document Type",
        "Expiry Date",
        "Status",
        
    ];

    // STAFF VIEW CSV
    if (this.isStaffView) {
        this.filteredList.forEach(staff => {
            staff.Child_Staffs__r?.forEach(doc => {
                rows.push({
                    staffName: staff.NameToDisplay__c,
                    type: doc.Document_Type__c || "",
                    status: doc.Status__c || "",
                    expiry: doc.FormattedDate || "",
                    uploaded: doc.UploadedDate || "",
                    role: staff.role || ""
                });
            });
        });
    }

    // DOCUMENT TYPE VIEW CSV
    else if (this.isDocTypeView) {
        this.filteredList.forEach(group => {
            group.Child_Staffs__r?.forEach(doc => {
                rows.push({
                    staffName: doc.staffName || "",
                    type: group.documentTypeName || "",
                    status: doc.Status__c || "",
                    expiry: doc.FormattedDate || "",
                    uploaded: doc.UploadedDate || "",
                    role: doc.role || ""
                });
            });
        });
    }

    // STATUS VIEW CSV
    else if (this.isStatusView) {
        this.filteredList.forEach(group => {
            group.Child_Staffs__r?.forEach(doc => {
                rows.push({
                    staffName: doc.staffName || "",
                    type: doc.Document_Type__c || "",
                    status: group.statusHeader || "",
                    expiry: doc.FormattedDate || "",
                    uploaded: doc.UploadedDate || "",
                    role: doc.role || ""
                });
            });
        });
    }

    // Convert JSON → CSV
    let csvContent = "";
    csvContent += headers.join(",") + "\n";

    rows.forEach(r => {
        csvContent += `"${r.staffName}","${r.role}","${r.type}","${r.expiry}","${r.status}"\n`;

    });

    // DOWNLOAD FILE
    let blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    let link = document.createElement("a");
    let url = URL.createObjectURL(blob);

    link.href = url;
    link.download = "Document_Report.csv";
    link.click();
    URL.revokeObjectURL(url);
}


 @track comments = '';
@track currentDocumentId = '';

handleApprove(event) {
        const docId = event.currentTarget.dataset.id;
        this.updateDocumentStatus(docId, 'Approved','');
        console.log('docId: '+docId);
         this.isShowSpinner = true;
    }

    handleReject(event) {
        this.currentDocumentId = event.currentTarget.dataset.id;
        this.showRejectModal = true;   // OPEN MODAL
        this._syncRecordRoute();
    }

  
    handleCommentsChange(event) {
        this.comments = event.target.value;
    }

    handleRejectedClose() {
        this.showRejectModal = false;
        this.comments = '';
        this.currentDocumentId = '';
        this._syncRecordRoute();
    }

    handleRejectSubmit() {
        if (!this.comments || this.comments.trim() === '') {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please enter comments before submitting.',
                    variant: 'error'
                })
            );
            return;
            
        }

        // Update the document with rejected status + comments
        this.updateDocumentStatus(this.currentDocumentId, 'Rejected', this.comments);
        this.isShowSpinner = true;
        // Close modal and reset
        this.showRejectModal = false;
        this.comments = '';
        this._syncRecordRoute();
    }

     updateDocumentStatus(docId, newStatus, comments) {
            updateDocumentStatus({
                documentId: docId,
                status: newStatus,
                comments: comments   // ⭐ pass comments only when rejecting
            })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: `Document marked as ${newStatus}`,
                        variant: 'success'
                    })
                );
    
                //return refreshApex(this.wiredClientResult);
                this.loadStaffDocuments();
                 this.isShowSpinner = false;
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
        }

    @track currentStaffId;
    @track filteredStaffOptions = [];
    // handleShare(event){
    //     this.closeModalsAndPanels();
    //     this.currentDocumentId = event.currentTarget.dataset.id;
    //     this.currentStaffId = event.currentTarget.dataset.staffid;
    //     console.log('StaffId: '+this.currentStaffId);
    //     console.log('currentDocumentId: '+this.currentDocumentId);
    //     console.log('assignment flag', this.assignmentFlag);
    //     this.selectedStaffIds='';
    //     this.filterStaffBydoc(this.currentDocumentId);
    //     this.assignmentFlag = true;
    //     this._syncRecordRoute();
    // }

loadStaffByDoc(docId) {

    console.log('========== 🟡 loadStaffByDoc START ==========');

    console.log('📄 docId:', docId);

    console.log(
        '📋 selectedStaffIds BEFORE:',
        JSON.stringify(this.selectedStaffIds)
    );

    console.log(
        '📋 documentUsers BEFORE:',
        JSON.stringify(this.documentUsers)
    );

    console.log(
        '📋 filteredDocumentUsers BEFORE:',
        JSON.stringify(this.filteredDocumentUsers)
    );

    console.log('➡️ Calling fetchstaffBydoc()');

    fetchstaffBydoc({ docId: docId })
        .then(result => {

            console.log(
                '✅ fetchstaffBydoc RESULT:',
                JSON.stringify(result)
            );

            console.log(
                '📊 fetchstaffBydoc RESULT length:',
                result ? result.length : 'UNDEFINED'
            );

            this.selectedStaffIds = (result || []).map(
                s => s.Staff__c
            );

            console.log(
                '📋 selectedStaffIds AFTER:',
                JSON.stringify(this.selectedStaffIds)
            );

            console.log('➡️ Calling applyStaffFilter()');

            this.applyStaffFilter();

            console.log(
                '========== 🟡 loadStaffByDoc END =========='
            );
        })
        .catch(error => {

            console.error(
                '❌ Error fetching staff:',
                error
            );

            console.error(
                '❌ Error JSON:',
                JSON.stringify(error)
            );
        });
}

    filterStaffBydoc(docId) {
   fetchstaffBydoc({ docId: docId })
    .then(alreadyAssignedRecords => {
        console.log('Already Assigned Staff Records:', JSON.stringify(alreadyAssignedRecords));

        // Extract Staff__c IDs from Apex
        const alreadyAssignedIds = alreadyAssignedRecords.map(rec => rec.Staff__c);

        const currentStaffId = this.currentStaffId;  

        console.log('Current Staff to Exclude:', currentStaffId);

          this.filteredStaffOptions = this.staffOptions.filter(opt =>
            opt.value !== this.currentStaffId
        ); 

        this.selectedStaffIds = alreadyAssignedIds;
         console.log('Preselected Staff:', JSON.stringify(this.selectedStaffIds));
        console.log('Available Options:', JSON.stringify(this.filteredStaffOptions));
        this.currentStaffId = '';

        console.log('Remaining Staff Options:', JSON.stringify(this.filteredStaffOptions));
    })
    .catch(error => {
        console.error('Error fetching staffIds:', error);
    });

}


    handleShareClose() {
        this.assignmentFlag = false;
        this.currentDocumentId = '';
        this._syncRecordRoute();
    }
    @track selectedStaffIds=[];

    handleduallist(event) {
    this.selectedStaffIds = event.detail.value;
    console.log(JSON.stringify(this.selectedStaffIds));
   }

    handleassignmentinsert() {

        saveStaffDocShares({
            docId: this.currentDocumentId,
            staffIds: this.selectedStaffIds
        })
        .then(() => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Document access has been granted successfully.',
                    variant: 'success',
                    mode: 'dismissable'
                })
            );
            this.assignmentFlag = false;   // close popup
        this._syncRecordRoute();
        })
        .catch(error => {
            console.error(error);
        });
    }

   /*  loadDocumentTypesForFacility(facilityId) {

        console.log('🚀 loadDocumentTypesForFacility CALLED');
        console.log('🏥 FacilityId:', facilityId);
        console.log('👤 StaffId:', this.currentStaffId);

        if (!facilityId) {
            console.warn('❌ facilityId is missing');
            this.dynamicDocumentTypes = [];
            return;
        }

        if (!this.currentStaffId) {
            console.warn('❌ staffId is missing');
            this.dynamicDocumentTypes = [];
            return;
        }

        getFacilityIdentityDocuments({
            facilityId: facilityId,
            staffId: this.currentStaffId
        })
            .then(result => {
                console.log('📦 Apex returned:', result);
                console.log('📦 Result type:', typeof result);
                console.log('📦 Result length:', result?.length);

                if (!Array.isArray(result) || result.length === 0) {
                    console.warn('⚠️ Apex returned EMPTY document list');
                    this.dynamicDocumentTypes =
                        this.buildHierarchicalFromFacility([]);
                    return;
                }

                this.documentPointsMap = {};
                this.documentMetaMap = {};

                this.dynamicDocumentTypes =
                    this.buildHierarchicalFromFacility(result);

                console.log(
                    '🌳 Final hierarchy:',
                    JSON.stringify(this.dynamicDocumentTypes, null, 2)
                );
            })
            .catch(error => {
                console.error('🔥 Apex call failed:', error);
                this.dynamicDocumentTypes =
                    this.buildHierarchicalFromFacility([]);
            });
    } */

    loadDocumentTypesForFacility(facilityId) {
        console.log('🚀 loadDocumentTypesForFacility CALLED');
        console.log('🏥 FacilityId:', facilityId);
        console.log('👤 StaffId:', this.currentStaffId);

        if (!facilityId) {
            console.warn('❌ facilityId is missing');
            this.dynamicDocumentTypes = [];
            return Promise.resolve([]);  // ✅ Return resolved Promise
        }

        if (!this.currentStaffId) {
            console.warn('❌ staffId is missing');
            this.dynamicDocumentTypes = [];
            return Promise.resolve([]);  // ✅ Return resolved Promise
        }

        // ✅ Return the full Promise chain
        return getFacilityIdentityDocuments({
            facilityId: facilityId,
            staffId: this.currentStaffId,
            currentDocumentId: this.DocId
        })
        .then(result => {
            console.log('📦 Apex returned:', result);
            console.log('📦 Result type:', typeof result);
            console.log('📦 Result length:', result?.length);

            if (!Array.isArray(result) || result.length === 0) {
                console.warn('⚠️ Apex returned EMPTY document list');
                this.dynamicDocumentTypes = this.buildHierarchicalFromFacility([]);
                return [];
            }

            this.documentPointsMap = {};
            this.documentMetaMap = {};

            this.dynamicDocumentTypes = this.buildHierarchicalFromFacility(result);

            console.log('🌳 Final hierarchy:', JSON.stringify(this.dynamicDocumentTypes, null, 2));
            return result;  // ✅ Return for potential chaining
        })
        .catch(error => {
            console.error('🔥 Apex call failed:', error);
            this.dynamicDocumentTypes = this.buildHierarchicalFromFacility([]);
            return Promise.reject(error);  // ✅ Proper rejection
        });
    }

    buildHierarchicalFromFacility(result) {
        const withMandatoryMark = (doc, baseLabel) =>
        doc.mandatory === true ? `${baseLabel} *` : baseLabel;
        if (!Array.isArray(result)) return [];

        // ---------------------------------------
        // SPLIT BY COMPLIANCE CATEGORY
        // ---------------------------------------
        const identityDocs = result.filter(d => d.complianceCategory === 'Identity');
        const documentDocs = result.filter(d => d.complianceCategory === 'Documents');
        const trainingDocs = result.filter(d => d.complianceCategory === 'Trainings');

        // ---------------------------------------
        // GROUP IDENTITY (PRIMARY / SECONDARY / OTHER)
        // ---------------------------------------
        const groupedIdentity = {
            Primary: [],
            Secondary: [],
            Other: []
        };

        identityDocs.forEach(doc => {
            const category =
                doc.category && (doc.category === 'Primary' || doc.category === 'Secondary')
                    ? doc.category
                    : 'Other';

            groupedIdentity[category].push(doc);

            // Build lookup maps
            this.documentPointsMap[doc.name] = Number(doc.points) || 0;
            this.documentMetaMap[doc.name] = doc;
        });

        // ---------------------------------------
        // ROOT NODES
        // ---------------------------------------
        const hierarchy = [
            {
                id: '100-points-id',
                label: '100 Points of ID',
                value: '100-points-id',
                children: []
            },
            {
                id: 'facility-documents',
                label: 'Documents',
                value: 'facility-documents',
                children: []
            },
            {
                id: 'training-docs',
                label: 'Training Documents',
                value: 'training-docs',
                children: []
            }
        ];

        // ---------------------------------------
        // IDENTITY SECTIONS
        // ---------------------------------------
        const identitySections = [];

        // ---------- PRIMARY ----------
        identitySections.push({
            id: 'primary-identity',
            label: 'Primary Identity Documents',
            value: 'primary-identity',
            children: groupedIdentity.Primary.length
                ? groupedIdentity.Primary.map(doc => ({
                    id: `id-${doc.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                    label: withMandatoryMark(doc, doc.name) + (doc.points ? ` (${doc.points} points)` : ''),
                    value: doc.name,
                    points: doc.points || 0,
                    children: []
                }))
                : [{
                    id: 'no-primary',
                    label: 'No Documents Available',
                    value: 'no-primary',
                    disabled: true,
                    children: []
                }]
        });

        // ---------- SECONDARY ----------
        identitySections.push({
            id: 'secondary-identity',
            label: 'Secondary Identity Documents',
            value: 'secondary-identity',
            children: groupedIdentity.Secondary.length
                ? groupedIdentity.Secondary.map(doc => ({
                    id: `id-${doc.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                    label: withMandatoryMark(doc, doc.name) + (doc.points ? ` (${doc.points} points)` : ''),
                    value: doc.name,
                    points: doc.points || 0,
                    children: []
                }))
                : [{
                    id: 'no-secondary',
                    label: 'No Documents Available',
                    value: 'no-secondary',
                    disabled: true,
                    children: []
                }]
        });

        // ---------- 🔥 OTHER (FIXED & ADDED) ----------
        identitySections.push({
            id: 'other-identity',
            label: 'Other Identity Documents',
            value: 'other-identity',
            children: groupedIdentity.Other.length
                ? groupedIdentity.Other.map(doc => ({
                    id: `id-${doc.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                    label: withMandatoryMark(doc, doc.name) + (doc.points ? ` (${doc.points} points)` : ''),
                    value: doc.name,
                    points: doc.points || 0,
                    children: []
                }))
                : [{
                    id: 'no-other',
                    label: 'No Documents Available',
                    value: 'no-other',
                    disabled: true,
                    children: []
                }]
        });

        hierarchy[0].children = identitySections;

        // ---------------------------------------
        // DOCUMENTS SECTION
        // ---------------------------------------
        hierarchy[1].children = documentDocs.length
            ? documentDocs.map(doc => {
                this.documentPointsMap[doc.name] = Number(doc.points) || 0;
                this.documentMetaMap[doc.name] = doc;

                return {
                    id: `doc-${doc.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                    label: withMandatoryMark(doc, doc.name) + (doc.points ? ` (${doc.points} points)` : ''),
                    value: doc.name,
                    children: []
                };
            })
            : [{
                id: 'no-docs',
                label: 'No Documents Available',
                value: 'no-docs',
                disabled: true,
                children: []
            }];

        // ---------------------------------------
        // TRAINING SECTION
        // ---------------------------------------
        hierarchy[2].children = trainingDocs.length
            ? trainingDocs.map(doc => {
                this.documentPointsMap[doc.name] = Number(doc.points) || 0;
                this.documentMetaMap[doc.name] = doc;

                return {
                    id: `training-${doc.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                    label: withMandatoryMark(doc, doc.name) + (doc.points ? ` (${doc.points} points)` : ''),
                    value: doc.name,
                    children: []
                };
            })
            : [{
                id: 'no-trainings',
                label: 'No Training Documents Available',
                value: 'no-trainings',
                disabled: true,
                children: []
            }];

        return hierarchy;
    }

    normalizeTree(nodes) {
        if (!Array.isArray(nodes)) {
            return []; // Prevent crashes
        }

        return nodes.map(node => {
            const safeChildren = Array.isArray(node.children)
                ? this.normalizeTree(node.children)
                : [];

            return {
                ...node,
                children: safeChildren
            };
        });
    }

    handleOpenHistory(event) {
        this.selectedDocumentId = event.currentTarget.dataset.id;
        this.loadStaffDocumentHistory();
        this.showFormHistoryModal = true;
        this._syncRecordRoute();
    }

    /* SAME helper used in Repository */
    groupHistoryByDate(history) {
        if (!Array.isArray(history)) {
            return [];
        }

        const map = {};

        history.forEach(item => {
            if (!item || !item.activityDate) {
                return;
            }

            const dateObj = new Date(item.activityDate);

            const date = dateObj.toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }).toUpperCase();

            const time = dateObj.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            if (!map[date]) {
                map[date] = [];
            }

            map[date].push({
                timestamp: item.activityDate,
                time,
                user: item.userName,
                action: item.title,
                changes: item.description,
                initials: this.getInitials(item.userName)
            });
        });

        return Object.keys(map).map(date => ({
            date,
            entries: map[date]
        }));
    }

    loadStaffDocumentHistory() {
        if (!this.selectedDocumentId) return;

        getStaffDocumentHistory({ documentId: this.selectedDocumentId })
            .then(result => {
                const history = result || [];

                this.groupedFormHistory =
                    this.groupHistoryByDate(history);

                this.hasFormHistory =
                    this.groupedFormHistory.length > 0;
            })
            .catch(error => {
                console.error('Error refreshing document history:', error);
                this.groupedFormHistory = [];
                this.hasFormHistory = false;
            });
    }

    closeFormHistory() {
        this.showFormHistoryModal = false;
        this.groupedFormHistory = [];
        this.hasFormHistory = false;
        this.selectedDocumentId = null;
        this._syncRecordRoute();
    }

    getInitials(name) {
        if (!name) return '';
        const parts = name.split(' ');
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }
        return (
            parts[0].charAt(0) +
            parts[parts.length - 1].charAt(0)
        ).toUpperCase();
    }

openArchiveModal() {
    this.archiveSearchKey = '';
    this.loadArchivedFiles();
    this.archiveModal = true;
        this._syncRecordRoute();
}

loadArchivedFiles() {

    console.log('📥 Loading Archived Staff Documents...');

    getAllArchivedStaffDocuments()

    .then(result => {

        console.log(
            '✅ Archived Documents Result:',
            JSON.stringify(result)
        );

        const records = result.map(rec => {

            const formattedArchivedDate =
                rec.Archived_Date__c
                    ? new Date(rec.Archived_Date__c)
                        .toLocaleDateString(
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

                Child_Staff_UID__c: rec.Child_Staff_UID__c,                

                Type: rec.Document_Type__c,

                StaffName:
                    rec.Staff__r
                        ? rec.Staff__r.NameToDisplay__c
                        : '',

                ArchivedBy:
                    rec.Archived_By__r
                        ? rec.Archived_By__r.Full_Name__c
                        : '',

                ArchivedDate:
                    formattedArchivedDate,

                FileUrl:
                    rec.View_File__c,

                Key:
                    rec.Key__c
            };
        });

        console.log(
            '✅ Mapped Archived Records:',
            JSON.stringify(records)
        );

        this.allArchivedRecords = records;

        this.archivedRecords = records;
    })

    .catch(error => {

        console.error(
            '❌ Error Loading Archived Documents:',
            JSON.stringify(error)
        );
    });
}

handleArchive(event) {

    const documentId =
        event.currentTarget.dataset.id;

    console.log(
        'Document Id:',
        documentId
    );

    archiveChildStaffDocument({
        documentId: documentId
    })

    .then(() => {

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Document archived successfully',
                variant: 'success'
            })
        );

        this.loadStaffDocuments();
    })

    .catch(error => {

        console.error(
            'Archive Error:',
            JSON.stringify(error)
        );
    });
}

handleRestore(event) {

    const documentId =
        event.currentTarget.dataset.id;

    restoreDocument({
        documentId: documentId
    })

    .then(() => {

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Document restored successfully',
                variant: 'success'
            })
        );

        this.loadArchivedFiles();

        this.loadStaffDocuments();
    })

    .catch(error => {

        console.error(
            'Restore Error:',
            JSON.stringify(error)
        );
    });
}

handleArchiveSearch(event) {

    this.archiveSearchKey =
        event.target.value;

    const searchTerm =
        this.archiveSearchKey
            ? this.archiveSearchKey
                .toLowerCase()
                .trim()
            : '';

    if (!searchTerm) {

        this.archivedRecords = [
            ...this.allArchivedRecords
        ];

        return;
    }

    this.archivedRecords =
        this.allArchivedRecords.filter(doc => {

            const staffName =
                doc.StaffName
                    ? doc.StaffName.toLowerCase()
                    : '';

            const type =
                doc.Type
                    ? doc.Type.toLowerCase()
                    : '';

            return (
                staffName.includes(searchTerm) ||
                type.includes(searchTerm)
            );
        });
}

closeArchiveModal() {
    this.archiveModal = false;
        this._syncRecordRoute();
}

handleArchiveDownload(event) {

    const documentId =
        event.currentTarget.dataset.id;

    const fileUrl =
        event.currentTarget.dataset.url;

    const fileKey =
        event.currentTarget.dataset.key;

    console.log('Document Id:', documentId);
    console.log('File Key:', fileKey);
    console.log('⬇️ Download URL:', fileUrl);

    fetch(fileUrl)
        .then(response => {

            if (!response.ok) {
                throw new Error(
                    `HTTP Error: ${response.status}`
                );
            }

            return response.blob();
        })
        .then(blob => {

            const downloadUrl =
                window.URL.createObjectURL(blob);

            const link =
                document.createElement('a');

            link.href = downloadUrl;

            const fileName = fileUrl
                .split('/')
                .pop()
                .split('?')[0];

            link.download = fileName;

            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);

            window.URL.revokeObjectURL(
                downloadUrl
            );

            console.log(
                '✅ Download started:',
                fileName
            );
        })
        .catch(error => {

            console.error(
                '❌ Download failed:',
                error
            );
        });
}
    _pendingRoute = null;
    _suppressEmit = false;
    _lastSubRoute = '';
    
    _syncRouteTimeout;
    _syncRecordRoute() {

        console.log('================ _syncRecordRoute START ================');
        console.log('showPreTaxRecordEditForm', this.showPreTaxRecordEditForm);
        console.log('documentedit', this.documentedit);
        console.log('DocId', this.DocId);
        console.log('currentStaffId', this.currentStaffId);
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
        console.log('================ _syncRecordRoute END ================');
    }

    _composeSubRoute() {
        if (this.archiveModal) {
            return 'staff/archived-document';
        }
        if (this.showPreTaxRecordEditForm && this.DocId) {
            let doc = this.findDocById(this.DocId);
            return doc && doc.Child_Staff_UID__c ? `staff/${doc.Child_Staff_UID__c}/edit` : 'staff';
        }
        if (this.assignmentFlag && this.currentDocumentId) {
            let doc = this.findDocById(this.currentDocumentId);
            return doc && doc.Child_Staff_UID__c ? `staff/${doc.Child_Staff_UID__c}/share` : 'staff';
        }
        if (this.showFormHistoryModal && this.selectedDocumentId) {
            let doc = this.findDocById(this.selectedDocumentId);
            return doc && doc.Child_Staff_UID__c ? `staff/${doc.Child_Staff_UID__c}/history` : 'staff';
        }
        if (this.isModalOpen && this.currentUrl) {
            let doc = this.findDocByUrl(this.currentUrl);
            return doc && doc.Child_Staff_UID__c ? `staff/${doc.Child_Staff_UID__c}/preview` : 'staff';
        }
        if (this.showRejectModal && this.selectedDocumentId) {
            let doc = this.findDocById(this.selectedDocumentId);
            return doc && doc.Child_Staff_UID__c ? `staff/${doc.Child_Staff_UID__c}/reject` : 'staff';
        }
        return 'staff';
    }

    findDocById(id) {
        if (this.staffList) {
            for (let staff of this.staffList) {
                if (staff.Child_Staffs__r) {
                    let doc = staff.Child_Staffs__r.find(d => d.Id === id);
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
        if (this.staffList) {
            for (let staff of this.staffList) {
                if (staff.Child_Staffs__r) {
                    let doc = staff.Child_Staffs__r.find(d => d.View_File__c === url);
                    if (doc) return doc;
                }
            }
        }
        if (this.allArchivedRecords) {
            let doc = this.allArchivedRecords.find(d => d.FileUrl === url || d.View_File__c === url);
            if (doc) return doc;
        }        
        return null;
    }

    @api async openByUID(uid, tab, isEdit) {

        console.log('================ openByUID START ================');
        console.log('uid =', uid);

        console.log('showPreTaxRecordEditForm BEFORE =', this.showPreTaxRecordEditForm);
        console.log('documentedit BEFORE =', this.documentedit);
        this._suppressEmit = true;
        try {
            console.log('staffDocumentsLwc openByUID:', uid, tab, isEdit);
            this.closeModalsAndPanels();
            
            if (uid === 'archived-document') {
                this.archiveModal = true;
            } else if (uid && uid.startsWith('stfdoc-')) {
                let foundDoc = null;
                let parentStaff = null;
                if (this.staffList) {
                    for (let staff of this.staffList) {
                        if (staff.Child_Staffs__r) {
                            foundDoc = staff.Child_Staffs__r.find(d => d.Child_Staff_UID__c === uid || d.Id === uid);
                            if (foundDoc) {
                                parentStaff = staff;
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
                        foundDoc = this.allArchivedRecords.find(d => d.Child_Staff_UID__c === uid || d.Id === uid);
                        if (foundDoc && !foundDoc.View_File__c) {
                            foundDoc.View_File__c = foundDoc.FileUrl;
                        }
                    }
                }
                                
                if (foundDoc) {
                    this.DocId = foundDoc.Id;
                    this.selectedDocumentId = foundDoc.Id;
                    this.currentDocumentId = foundDoc.Id;
                    
                    if (tab === 'edit' || isEdit) {
                        this.key = foundDoc.key__c;
                        this.typeOfDocument = foundDoc.Document_Type__c;
                        this.currentStaffId = parentStaff.Id;
                        const facilityId = parentStaff.Facility__c;
                        if (facilityId) {
                            await this.loadDocumentTypesForFacility(facilityId);
                        }
                        this.points = this.documentPointsMap[this.typeOfDocument] || 0;
                        const meta = this.documentMetaMap[this.typeOfDocument];
                        this.isExpiryRequired = meta?.expiryRequired === true;
                        
                        this.showPreTaxRecordEditForm = true;
                        this.documentedit = true;
                    } else if (tab === 'share') {
                        this.currentStaffId = parentStaff.Id;
                        this.selectedStaffIds = '';
                        this.filterStaffBydoc(this.currentDocumentId);
                        this.assignmentFlag = true;
                    } else if (tab === 'history') {
                        this.loadStaffDocumentHistory();
                        this.showFormHistoryModal = true;
                    } else if (tab === 'reject') {
                        this.showRejectModal = true;
                    } else if (tab === 'preview' || !tab) {
                        logDocumentView({ documentId: foundDoc.Id }).catch(e => console.error(e));
                        this.currentUrl = foundDoc.View_File__c;
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
        this.showPreTaxRecordEditForm = false;
        this.assignmentFlag = false;
        this.showFormHistoryModal = false;
        this.isModalOpen = false;
        this.isHome = true;
        this.showRejectModal = false;
        this.currentUrl = null;
        this.DocId = null;
        this.selectedDocumentId = null;
        this.currentDocumentId = null;
        this.key = null;
    }

// ---------------------------------------------------------------------
// 3) NEW PROPERTIES inside class
//    (keep existing `@track selectedStaffIds = [];` -- do not redeclare)
// ---------------------------------------------------------------------
@track allStaffList = [];                // all shareable staff (org-wide)
@track roleOptions = [];                 // roles present in data, fixed order
@track selectedRoles = [];               // roles in "Selected" box
@track highlightedAvailableRoles = [];
@track highlightedSelectedRoles = [];
@track staffSearchKey = '';
@track staffPageNumber = 1;
@track staffPageSize = 10;
initialSharedIds = [];                   // ids that had access when panel opened
 
// ---------------------------------------------------------------------
// 4) GETTERS
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
 
// full list after role + search filter (all pages)
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
 
// current page only (table rows)
get filteredStaffUsers() {
    const start = (this.staffCurrentPage - 1) * this.staffPageSize;
    return this.filteredStaffFull
        .slice(start, start + this.staffPageSize)
        .map(s => ({ ...s, isSelected: this.selectedStaffIds.includes(s.Id) }));
}
 
get allVisibleStaffSelected() {        // header checkbox = current page only
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
 
get saveButtonDisable() {              // disabled until selection changed
    const a = new Set(this.initialSharedIds);
    const b = new Set(this.selectedStaffIds);
    return a.size === b.size && [...a].every(id => b.has(id));
}
 
// ---------------------------------------------------------------------
// 5) REPLACE handleShare()  + add loader
// ---------------------------------------------------------------------
handleShare(event) {
    this.closeModalsAndPanels();
 
    this.currentDocumentId = event.currentTarget.dataset.id;
    this.currentStaffId    = event.currentTarget.dataset.staffid;   // doc owner
 
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
        fetchstaffBydoc({ docId })
    ])
    .then(([users, alreadyShared]) => {
 
        // users without Staff record can't be shared; owner excluded
        this.allStaffList = (users || [])
            .filter(u => u.staffId && u.staffId !== this.currentStaffId)
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
 
        // preselect already-shared staff + auto-move their roles to "Selected"
        this.selectedStaffIds = (alreadyShared || []).map(s => s.Staff__c);
        this.initialSharedIds = [...this.selectedStaffIds];
 
        const sharedRoles = this.allStaffList
            .filter(s => this.selectedStaffIds.includes(s.Id))
            .map(s => s.role);
        this.selectedRoles = [...new Set(sharedRoles)];
    })
    .catch(error => {
        console.error('Grant access load error', JSON.stringify(error));
        this.showToast('Error', error?.body?.message || 'Unable to load staff', 'error');
    });
}
 
// ---------------------------------------------------------------------
// 6) STAFF TYPE TRANSFER HANDLERS
// ---------------------------------------------------------------------
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
 
    // staff of removed roles vanish from table -> drop from selection
    const removedIds = this.allStaffList
        .filter(s => removed.includes(s.role))
        .map(s => s.Id);
 
    this.selectedRoles = this.selectedRoles.filter(r => !removed.includes(r));
    this.selectedStaffIds = this.selectedStaffIds.filter(id => !removedIds.includes(id));
    this.highlightedSelectedRoles = [];
    this.staffPageNumber = 1;
}
 
// ---------------------------------------------------------------------
// 7) SEARCH / CHECKBOX / PAGINATION HANDLERS
// ---------------------------------------------------------------------
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
 
handleSelectAllStaff(event) {          // current page only
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
 
// ---------------------------------------------------------------------
// 8) handleassignmentinsert()  -> only .then/.catch tweak
// ---------------------------------------------------------------------
handleassignmentinsert() {
    saveStaffDocShares({
        docId: this.currentDocumentId,
        staffIds: this.selectedStaffIds
    })
    .then(() => {
        this.dispatchEvent(new ShowToastEvent({
            title: 'Success',
            message: 'Document access has been granted successfully.',
            variant: 'success',
            mode: 'dismissable'
        }));
        this.assignmentFlag = false;
        this.resetShareState();
        this._syncRecordRoute();
    })
    .catch(error => {
        console.error(error);
        this.showToast('Error', error?.body?.message || 'Unable to save access', 'error');
    });
}

}