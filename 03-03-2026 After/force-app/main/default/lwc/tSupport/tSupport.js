import { LightningElement, track, wire,api } from 'lwc';
import createTicket from '@salesforce/apex/TicketManager.createTicket';
// import getOrganisations from '@salesforce/apex/TicketManager.getOrganisations';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import TICKET_OBJECT from '@salesforce/schema/Ticket__c';
import CATEGORY_FIELD from '@salesforce/schema/Ticket__c.Category__c';
import PLATFORM_FIELD from '@salesforce/schema/Ticket__c.Platform__c';
import MODULE_FIELD from '@salesforce/schema/Ticket__c.Module__c';
import PRIORITY_FIELD from '@salesforce/schema/Ticket__c.Priority__c';
import STATUS_FIELD from '@salesforce/schema/Ticket__c.Status__c';
import SUBMITTED_BY_FIELD from '@salesforce/schema/Ticket__c.Submitted_By__c'; 
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
// import getUserOrganisation from '@salesforce/apex/CreateCompanyController.getUserOrganisation';
import getTickets from '@salesforce/apex/TicketManager.getTickets';
import getOrgNameById from '@salesforce/apex/TicketManager.getOrgNameById';
import getTicketDetailsById from '@salesforce/apex/TicketManager.getTicketDetailsById';
import getTicketingMembers from '@salesforce/apex/TicketManager.getTicketingMembers';
import updateTicket from '@salesforce/apex/TicketManager.updateTicket';
import getUsersByIds from '@salesforce/apex/TicketManager.getUsersByIds';
import getStatusPicklistValues from '@salesforce/apex/TicketManager.getStatusPicklistValues';
import { getRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import appendConversationEntry from '@salesforce/apex/TicketManager.appendConversationEntry';
import updateResolution from '@salesforce/apex/TicketManager.updateResolution';
import appendHistoryEntry from '@salesforce/apex/TicketManager.appendHistoryEntry';
import appendHistoryEntries from '@salesforce/apex/TicketManager.appendHistoryEntries';
import deletePostAttachmentFromTicket from '@salesforce/apex/TicketManager.deletePostAttachmentFromTicket';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import sendTicketNotificationEmails from '@salesforce/apex/TicketManager.sendTicketNotificationEmails';
import sendAssignedTicketNotificationEmails from '@salesforce/apex/TicketManager.sendAssignedTicketNotificationEmails';
import sendResolvedTicketEmail from '@salesforce/apex/TicketManager.sendResolvedTicketEmail';
import getStaffById from '@salesforce/apex/StaffController.getStaffById';
import getManagerNameFromFacility from '@salesforce/apex/TicketManager.getManagerNameFromFacility';
import getContactNumberByEmail from '@salesforce/apex/TicketManager.getContactNumberByEmail';
import getStaffByEmail from '@salesforce/apex/TicketManager.getStaffByEmail';
import sendAssignedTicketNotificationEmailsWithEmail from '@salesforce/apex/TicketManager.sendAssignedTicketNotificationEmailsWithEmail';
import sendAssignmentEmailOnStatusOnly from '@salesforce/apex/TicketManager.sendAssignmentEmailOnStatusOnly';
import sendCommentOnlyEmailNotification from '@salesforce/apex/TicketManager.sendCommentOnlyEmailNotification';
import getUsersByOrganizationName from '@salesforce/apex/TicketManager.getUsersByOrganizationName';
import ChartJS from '@salesforce/resourceUrl/chratJs'; 
import insertTicketAttachments from '@salesforce/apex/TicketManager.insertTicketAttachments';
import { loadScript } from 'lightning/platformResourceLoader';
import { deleteRecord } from 'lightning/uiRecordApi';

const AWS_BASE = 'https://tesseractapps.com'; // no trailing slash
const ENDPOINTS = {
    delete: `${AWS_BASE}/delete-file`
};



export default class TicketManager extends LightningElement {
    @track ticket = {
        Organization_Name__c: '',
        Submitted_By__c: '',
        User_Name__c: '',
        Email_ID__c: '',
        Contact_Number__c: '',
        Manager_Name__c: '',
        Date_Of_Issue__c: '',
        Priority__c: '',
        Module__c: '',
        Category__c: '',
        Platform__c: '',
        Status__c: 'Open',
        Submitting_To__c: '',
        Organization__c: '',
        Subject__c: '',
        Assigned_To__c: '',
        Description__c: ''
    };
       
    @track tickets = [];
    @api orgid;
    @api staffId;

    @track submittingToOptions = [
        { label: 'Internal', value: 'Internal' },
        { label: 'External', value: 'External' }
    ];
    
    @track isSubmittingToInternal = true;
    @track isSubmittingToExternal = false;
    
        
    @track tickets = [];
    @track resolvedTickets = [];
    @track showCreateTicketForm = false;
    @track showTicketPopup = false;
    @track selectedTicket = {};
    @track showTicketInfo = true;
    @track showConversation = false;
    @track showResolution = false;
    @track showAttachment = false;
    @track showApproval = false;
    @track showHistory = false;
    @track uploadedFiles = [];
    @track showEditPopup = false;
    @track editTicket = {};
    @track selectedTicket = {};
    @track ticketingMembers = [];
    @track statusOptions = [];
    @track currentUserType = '';
    @track currentUserEmail = '';
    @track isAdmin = false;
    @track showUserDetails = false;
    @track newMessage = '';
    @track currentUserName = '';
    @track showMessageInput = false;
    @track resolutionInitials = '';
    @track resolutionInput = '';
    @track showResolutionInput = false;
    @track resolutionSubmittedBy = '';
    @track resolutionTimestamp = '';
    @track resolutionInitials = '';
    @track resolutionDate = '';
    @track resolutionTime = '';
    @track base64FileData;
@track fileName;
@track myContactNumber = '';
@track managerName = '';
@track myFacilityId = '';
@track isTesseractOrg = false;
@track uploadcontainer;













    // --- Pagination: Tickets ---
    @track pageNumberTickets = 1;
    @track pageSizeTickets = 10;
    @track totalRecordsTickets = 0;
    @track totalPagesTickets = 0;
    @track pageSizeOptions = [10, 20, 50];


    // --- Pagination: Resolved Tickets ---
    @track pageNumberResolved = 1;
    @track pageSizeResolved = 5;
    @track totalRecordsResolved = 0;
    @track totalPagesResolved = 0;    
   

    // @track organisations = [];
    // @track organisationEmail = '';
    categoryOptions = [];

    platformOptions = [];

    moduleOptions = [];

    priorityOptions = [];

    statusOptions = [];

    submittedByOptions = [];
    @wire(getObjectInfo, { objectApiName: TICKET_OBJECT })

    objectInfo;
 
    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: CATEGORY_FIELD })

    categoryValues({ data }) {

        if (data) this.categoryOptions = data.values;

    }
 
    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: MODULE_FIELD })

    moduleValues({ data }) {

        if (data) this.moduleOptions = data.values;

    }
 
    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: PRIORITY_FIELD })

    priorityValues({ data }) {

        if (data) this.priorityOptions = data.values;

    }
 

 
    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: SUBMITTED_BY_FIELD })

    submittedByValues({ data }) {

        if (data) this.submittedByOptions = data.values;
        console.log('submittedByOptions :'+JSON.stringify(this.submittedByOptions));

    }
    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: PLATFORM_FIELD })

    platformValues({ data }) {

        if (data) this.PlatformOptions = data.values;

    }

    wiredTicketsResult;


    @wire(getRecord, { recordId: USER_ID, fields: ['User.User_Type__c','User.Type_of_User__c', 'User.Email', 'User.Name', 'User.User_Role__c', 'User.IT_Support__c'] })
    wiredUser({ error, data }) {
        if (data) {
            this.currentUserType = data.fields.User_Type__c.value;
            this.currentUserEmail = data.fields.Email.value;
            this.currentUserName = data.fields.Name.value; 
            this.currentUserRole = data.fields.User_Role__c.value;
            this.currenTTypeofUser = data.fields.Type_of_User__c.value;
            this.resolutionInitials = this.getInitials(this.currentUserName);
            this.IsItSupport =data.fields.IT_Support__c.value;
             console.log('this.ITSupport====>'+this.IsItSupport);
            console.log('User Type:', this.currentUserType);
            console.log('Type of user:', this.currenTTypeofUser);
            console.log('User Email:', this.currentUserEmail);
            console.log('User Role:', this.currentUserRole);
            this.isTesseractOrg = (this.IsItSupport === 'Yes');
            console.log('✅ isTesseractOrg:', this.isTesseractOrg);
    
            const isCEOorExec = ['CEO', 'Portal Account Partner Executive'].includes(this.currentUserRole);
            const isSupportOrNDIS = ['Support', 'NDIS Org Admin'].includes(this.currentUserType);
            this.isAdmin = isCEOorExec && isSupportOrNDIS;
    
            // Call if ticketing members already loaded
            if (this.ticketingMembers?.length) {
                this.setFilterOptions();
            }
    
            // Refresh ticket data after we have the user type
            refreshApex(this.wiredTicketsResult);
        } else if (error) {
            console.error('Error fetching user info:', error);
        }
    }



@track orgName = null; // prevents early wire run


@wire(getTickets, { orgId: '$orgid', orgName: '$orgName' })
wiredTickets(result) {
    this.wiredTicketsResult = result;

    const { data, error } = result;

    console.log('🔌 @wire(getTickets) triggered...');
    console.log('📨 Supplied orgName:', this.orgName);

    if (!this.orgName) {
        console.warn('⚠️ Skipping wire execution because orgName is undefined.');
        return;
    }

    if (data) {
        console.log('✅ Tickets fetched:', data.length);
        console.table(data);  // Optional: see ticket rows in table format

        this.rawTickets = data;

        // 🔢 Log status counts
        const statusCounts = {};
        data.forEach(ticket => {
            const status = ticket.Status__c || 'Unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        console.log('📊 Ticket counts by status:');
        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`• ${status}: ${count}`);
        });

        this.applyTicketFilter();

        setTimeout(() => {
            this.renderStatusPieChart(data);
        }, 0);

    } else if (error) {
        console.error('❌ Error fetching tickets via wire:', error);
    }
}



renderedCallback() {
    if (this.chartInitialized) return;
    this.chartInitialized = true;

    loadScript(this, ChartJS)
        .then(() => {
            console.log('✅ Chart.js loaded.');

            if (this.rawTickets?.length) {
                this.renderStatusPieChart(this.rawTickets);
            }
        })
        .catch(error => {
            console.error('❌ Error loading Chart.js:', error);
        });
}






connectedCallback() {
    console.log('Received Org ID:', this.orgid);
    console.log('STAFF ID:', this.staffId);

    this.organizationOptions = [...new Set(this.tickets.map(t => t.Organization_Name__c))]
    .filter(Boolean)
    .map(org => ({ label: org, value: org }));

this.assignedToOptions = [...new Set(this.tickets.map(t => t.Assigned_To__r?.Name))]
    .filter(Boolean)
    .map(user => ({ label: user, value: user }));

    setTimeout(() => {
        console.log('IsItSupport ===>', this.IsItSupport);

        this.isTesseractOrg = (this.IsItSupport === 'Yes');

        if (this.isTesseractOrg) {
            this.ticket.Submitting_To__c = 'Internal';
            this.isSubmittingToExternal = false;
            console.log('🏢 IT Support = Yes – setting Submitting_To__c = Internal (forced)');
            console.log('isTesseractOrg:', this.isTesseractOrg);
        }
    }, 500);

    if (this.orgid) {
        getOrgNameById({ orgid: this.orgid })
            .then(name => {
                this.ticket.Organization_Name__c = name;
                this.orgName = name;
                // this.isTesseractOrg = name === 'Tesseract Apps';
                // console.log('✅ Organization Name fetched:', name);

                // // Set default Submitting_To__c if Tesseract Apps
                // if (this.isTesseractOrg) {
                //     this.ticket.Submitting_To__c = 'Internal';
                //     this.isSubmittingToExternal = false;
                //     console.log('🏢 Org is Tesseract Apps – setting Submitting_To__c = Internal (forced)');
                // }

            })
            .catch(error => {
                console.error('❌ Error fetching organization name:', error);
            });

        getTicketingMembers({ orgId: this.orgid })
            .then(userIdList => getUsersByIds({ userIds: userIdList }))
            .then(userRecords => {
                this.ticketingMembers = userRecords.map(user => ({
                    label: user.Name,
                    value: user.Id,
                    email: user.Email
                }));

                console.log('🔄 Matching current user email with ticketing members...');
                console.log('👤 Current User Email:', this.currentUserEmail);

                this.isTicketingMember = this.ticketingMembers.some(
                    member => member.email === this.currentUserEmail
                );

                console.log('🧾 Final isTicketingMember:', this.isTicketingMember);

                if (this.currentUserEmail) {
                    this.setFilterOptions();
                }
            })
            .catch(error => {
                console.error('❌ Error fetching ticketing members:', error);
            });

        getStatusPicklistValues()
            .then(result => {
                this.statusOptions = result.map(val => ({
                    label: val,
                    value: val
                }));
            })
            .catch(error => {
                console.error('❌ Error fetching status picklist values:', error);
            });
    }
}




@wire(getStaffById, { recordId: '$staffId' })
    wiredClient(result) {
      this.wiredClientResult = result;
    const { data, error } = result;
        if (data) {
            this.clientData = data;
            this.image = this.clientData[0].picture__c;
        this.myContactNumber = this.clientData[0].Contact_Number__c || '';
        this.myFacilityId = this.clientData[0].Facility__c || '';

        console.log('📞 Stored myContactNumber:', this.myContactNumber);
        } 
    }

    handleCheckboxChange(event) {
        const isChecked = event.target.checked;
    
        this.isSubmittingToExternal = isChecked;
        this.isSubmittingToInternal = !isChecked;
    
        this.ticket.Submitting_To__c = isChecked ? 'External' : 'Internal';
    }
    


    get paginatedTickets() {
        const start = (this.pageNumberTickets - 1) * this.pageSizeTickets;
        const end = start + this.pageSizeTickets;
    
        return this.tickets.slice(start, end).map(t => {
            const isTesseractOrg = (this.IsItSupport === 'Yes');
            // const isTesseractOrg = this.orgName === 'Tesseract Apps';
            const isExternalTicket = t.Submitting_To__c === 'External';
    
            return {
                ...t,
                formattedDateOfIssue: this.formatDate(t.Date_Of_Issue__c),
                showEdit: isTesseractOrg || !isExternalTicket,
                priorityStyle: this.computePriorityStyle(t.Priority__c)
            };
        });
    }
    
computePriorityStyle(priority) {
    switch ((priority || '').toLowerCase()) {
        case 'low':
            return 'background-color: #e0f7e9;'; // Light green
        case 'medium':
            return 'background-color: #fff3cd;'; // Light yellow
        case 'high':
            return 'background-color: #f8d7da;'; // Light red
        case 'critical':
            return 'background-color: #f5c6cb; color: #721c24; font-weight: bold;';
        default:
            return '';
    }
}


get paginatedResolvedTickets() {
    const start = (this.pageNumberResolved - 1) * this.pageSizeResolved;
    const end = start + this.pageSizeResolved;
    return this.resolvedTickets.slice(start, end);
}
               
    // @wire(getUserOrganisation)
    // wiredOrg({ data, error }) {
    //     console.log('data in wiredOrg:', JSON.stringify(data));

    //     if (data) {
    //         // Correct spread operator syntax and preserve existing properties
    //         this.ticket = {
    //             ...this.ticket, // Proper spread syntax (three dots)
    //             Organization_Name__c: data.Name
    //         };
    //     } else if (error) {
    //         console.error('Error fetching organization:', error);
    //         // Optional: Add error handling UI here
    //     }
    // }

    // get organisationOptions() {
    //     return this.organisations.map(org => ({
    //         label: org.Organization_Name__c,
    //         value: org.value
    //     }));
    // }
    
    

    // @wire(getOrganisations)
    // wiredOrganisations({ data, error }) {
    //     if (data) {
    //         this.organisations = data.map(org => ({
    //             Organization_Name__c: org.Name,
    //             value: org.Id,
    //             email: org.Email__c
    //         }));
    //     } else if (error) {
    //         console.error('Error fetching organisations', error);
    //     }
    // }
    // handleInputChange(event) {
    //     const field = event.target.dataset.field;
    //     const value = event.detail.value;
    //     this.ticket[field] = value;
 
    //     // Capture organisation email if Organisation is selected
    //     if (field === 'Organization_Name__c') {
    //         const selected = this.organisations.find(org => org.value === value);
    //         this.organisationEmail = selected ? selected.email : '';
    //     }
    // }

    handleClick(event) {
        this.clickedButtonLabel = event.target.label;
    }
    handleClick(event) {
        this.clickedButtonLabel = event.target.label;
    }
    
 
    handleInputChange(event) {
        const field = event.target.dataset.field;
        const value = event.target.value;

        if (field === 'Submitting_To__c') {
            this.ticket.Submitting_To__c = value;
        
            this.isSubmittingToInternal = value === 'Internal';
            this.isSubmittingToExternal = value === 'External';
        }
        
    
        if (field === 'Submitted_By__c') {
            this.ticket.Submitted_By__c = value;
    
            if (value === 'Self') {
                this.showUserDetails = false;
                this.showUserLookup = false;
    
                // Fill from current user data
                this.ticket.User_Name__c = this.currentUserName;
                this.ticket.Email_ID__c = this.currentUserEmail;
                this.ticket.Contact_Number__c = this.myContactNumber || '';
    
                // Get manager name from facility
                if (this.myFacilityId) {
                    getManagerNameFromFacility({ facilityId: this.myFacilityId })
                        .then(managerName => {
                            this.ticket.Manager_Name__c = managerName || '';
                            console.log('👤 Manager Name:', managerName);
                        })
                        .catch(error => {
                            console.error('❌ Error fetching manager name:', error);
                        });
                }
    
            } else if (value === 'On Behalf Of') {
                this.showUserDetails = true;
                this.showUserLookup = true;
    
                // Clear current fields
                this.ticket.User_Name__c = '';
                this.ticket.Email_ID__c = '';
                this.ticket.Contact_Number__c = '';
                this.ticket.Manager_Name__c = '';
    
                const orgName = this.ticket.Organization_Name__c?.trim();
                console.log('📛 Using Org Name from connectedCallback:', orgName);
    
                if (orgName) {
                    getUsersByOrganizationName({ orgName })
                        .then(userRecords => {
                            if (!userRecords || userRecords.length === 0) {
                                console.warn('⚠️ No users found for this org name:', orgName);
                                this.orgUsers = [];
                                return;
                            }
    
                            console.log('✅ Users fetched for On Behalf Of:', userRecords);
                            this.orgUsers = userRecords.map(user => ({
                                label: user.Name,
                                value: user.Id,
                                email: user.Email,
                                contact: user.Phone
                            }));
                        })
                        .catch(error => {
                            console.error('❌ Error fetching users from org:', error);
                        });
                } else {
                    console.warn('⚠️ Org name is empty — cannot fetch users.');
                    this.orgUsers = [];
                }
    
            } else {
                this.showUserDetails = true;
                this.showUserLookup = false;
    
                // Manual entry mode - reset fields
                this.ticket.User_Name__c = '';
                this.ticket.Email_ID__c = '';
                this.ticket.Contact_Number__c = '';
                this.ticket.Manager_Name__c = '';
            }
    
        } else if (field) {
            // Handle other field updates
            this.ticket = { ...this.ticket, [field]: value };
        }
    }
    
    @track selectedUserId = ''; // Track selected userId
    @track orgUsers = []; // ← This was missing!

    handleUserSelect(event) {
        this.selectedUserId = event.detail.value;
    
        const selectedUser = this.orgUsers.find(user => user.value === this.selectedUserId);
        if (!selectedUser) {
            console.warn('⚠️ Selected user not found in orgUsers');
            return;
        }
    
        console.log('✅ Selected User:', JSON.stringify(selectedUser));
        this.ticket.User_Name__c = selectedUser.label || '';
        this.ticket.Email_ID__c = selectedUser.email || '';
        this.ticket.Contact_Number__c = '';
        this.ticket.Manager_Name__c = '';
    
        // Step 1: Get Contact Number
        getContactNumberByEmail({ email: selectedUser.email })
            .then(contactNumber => {
                this.ticket.Contact_Number__c = contactNumber || '';
                console.log('📞 Contact number:', contactNumber);
            })
            .catch(error => {
                console.error('❌ Error getting contact number:', error);
            });
    
        // Step 2: Match Staff by Email → Get Facility → Get Manager
        getStaffByEmail({ email: selectedUser.email })
            .then(staff => {
                if (staff && staff.Facility__c) {
                    console.log('🏥 Matched Facility ID:', staff.Facility__c);
                    return getManagerNameFromFacility({ facilityId: staff.Facility__c });
                } else {
                    console.warn('⚠️ No matching Staff record or facility found');
                    return null;
                }
            })
            .then(managerName => {
                if (managerName) {
                    this.ticket.Manager_Name__c = managerName;
                    console.log('👤 Manager Name:', managerName);
                }
            })
            .catch(error => {
                console.error('❌ Error fetching manager name:', error);
            });
    }
    
    
    
    

    
    
    

    validateFields() {
        const requiredFields = [
            'Organization_Name__c',
            'Submitted_By__c',
            'User_Name__c',
            'Email_ID__c',
            'Contact_Number__c',
            'Manager_Name__c',
            'Date_Of_Issue__c',
            'Priority__c',
            'Module__c',
            'Category__c',
            'Platform__c',
            'Subject__c'
        ];

        for (let field of requiredFields) {
            if (!this.ticket[field]) {
                return false;
            }
        }
        return true;
    }

    validateFields() {
        const requiredFields = [
            { field: 'Organization_Name__c', label: 'Organization Name' },
            { field: 'Submitted_By__c', label: 'Submitted By' },
            { field: 'User_Name__c', label: 'User Name' },
            { field: 'Email_ID__c', label: 'Email ID' },
            { field: 'Contact_Number__c', label: 'Contact Number' },
            { field: 'Manager_Name__c', label: 'Manager Name' },
            { field: 'Date_Of_Issue__c', label: 'Date Of Issue' },
            { field: 'Priority__c', label: 'Priority' },
            { field: 'Module__c', label: 'Module' },
            { field: 'Category__c', label: 'Category' },
            { field: 'Platform__c', label: 'Platform' },
            { field: 'Subject__c', label: 'Subject' }
        ];
    
        // ⛔ Only validate Assigned_To__c if NOT Tesseract and Submitting_To__c is Internal
        if (!this.isTesseractOrg && this.ticket.Submitting_To__c === 'Internal') {
            requiredFields.push({ field: 'Assigned_To__c', label: 'Assigned To' });
        }
    
        const missing = [];
    
        requiredFields.forEach(({ field, label }) => {
            if (!this.ticket[field]) {
                missing.push(label);
            }
        });
    
        return missing;
    }
    
    
    submitTicket() {
        // 🟢 Force Internal for Tesseract Apps
        this.ticket.Submitting_To__c = this.isSubmittingToExternal && this.ticket.Organization_Name__c !== 'Tesseract Apps'
            ? 'External'
            : 'Internal';
    
        console.log('📌 [Forced] Submitting_To__c =', this.ticket.Submitting_To__c);
    
        const missingFields = this.validateFields();
        if (missingFields.length > 0) {
            console.warn('⚠️ Missing Required Fields:', missingFields.join(', '));
            this.dispatchEvent(new ShowToastEvent({
                title: 'Missing Required Fields',
                message: `Please fill in the following fields: ${missingFields.join(', ')}`,
                variant: 'error'
            }));
            return;
        }
    
        console.log('📌 Before validation - Submitting_To__c:', this.ticket.Submitting_To__c);
    
        // 🟡 Skip assignment validation for Tesseract Apps
        if (
            this.ticket.Submitting_To__c === 'Internal' &&
            !this.ticket.Assigned_To__c &&
            this.ticket.Organization_Name__c !== 'Tesseract Apps'
        ) {
            console.warn('⚠️ Assignment missing for internal ticket (non-Tesseract org)');
            this.dispatchEvent(new ShowToastEvent({
                title: 'Assignment Required',
                message: 'Please assign this internal ticket to a ticketing member.',
                variant: 'error'
            }));
            return;
        }
    
        const ticketInfo = this.generateTicketInfo();
        this.ticket.Ticket_Name__c = ticketInfo.name;
        this.ticket.Ticket_generated_number__c = ticketInfo.number;
        console.log('🆔 Generated Ticket Info:', ticketInfo);
    
        // Set Belong_To__c
        if (this.ticket.Submitted_By__c === 'Self') {
            this.ticket.Belong_To__c = USER_ID;
            console.log('👤 Submitted by Self – Belong_To__c:', USER_ID);
        } else if (this.ticket.Submitted_By__c === 'On Behalf Of') {
            this.ticket.Belong_To__c = this.selectedUserId || USER_ID;
            console.log('👤 Submitted On Behalf Of – Belong_To__c:', this.ticket.Belong_To__c);
        } else {
            this.ticket.Belong_To__c = USER_ID;
            console.log('👤 Default Belong_To__c:', USER_ID);
        }
    
        this.ticket.Organization__c = this.orgid;
        console.log('🏢 Organization__c set to:', this.orgid);
    
        // Prepare Assigned User details if applicable
        let newTicketId;
        let assignedUserLabel = '';
        let assignedUserEmail = '';
    
        if (this.ticket.Assigned_To__c) {
            const assignedUser = this.ticketingMembers.find(t => t.value === this.ticket.Assigned_To__c);
            console.log('👤 Raw Assigned User:', JSON.stringify(assignedUser));
            assignedUserLabel = assignedUser?.label || '';
            assignedUserEmail = assignedUser?.email || '';
            console.log('🏷️ Assigned User Label:', assignedUserLabel);
            console.log('📧 Assigned User Email:', assignedUserEmail);
        }
    
        // 🧹 Clean up assignment for Tesseract or empty value
        if (this.ticket.Organization_Name__c === 'Tesseract Apps' || !this.ticket.Assigned_To__c) {
            delete this.ticket.Assigned_To__c;
        }
    
        console.log('📨 Creating ticket with data:', JSON.stringify(this.ticket));
    
        createTicket({ ticket: this.ticket })
            .then(result => {
                newTicketId = result?.Id;
                console.log('✅ Ticket created with ID:', newTicketId);
    
                if (this.base64FileData && newTicketId) {
                    console.log('📎 File attached – uploading to AWS...');
                    return uploadFile({
                        base64: JSON.stringify(this.base64FileData),
                        filename: this.fileName,
                        recordId: newTicketId,
                        obj: 'Attachment'
                    }).then(() => {
                        console.log('✅ File uploaded successfully.');
                    }).catch(error => {
                        console.error('❌ File upload failed:', error);
                        return Promise.reject(error);
                    });
                } else {
                    console.log('⚠️ No file to upload or missing ticket ID.');
                    return Promise.resolve();
                }
            })
            .then(() => {
                const emailPromises = [];
    
                if (newTicketId) {
                    console.log('📧 Sending base ticket notification...');
                    emailPromises.push(sendTicketNotificationEmails({ ticketId: newTicketId }));
    
                    if (
                        this.ticket.Submitting_To__c === 'Internal' &&
                        assignedUserEmail &&
                        this.ticket.Organization_Name__c !== 'Tesseract Apps'
                    ) {
                        console.log('📧 Sending assignment email to:', assignedUserEmail);
                        emailPromises.push(
                            sendAssignedTicketNotificationEmailsWithEmail({
                                ticketId: newTicketId,
                                assigneeEmail: assignedUserEmail
                            })
                        );
                    } else if (this.ticket.Assigned_To__c && !assignedUserEmail) {
                        console.warn('⚠️ Assigned user has no email – skipping assignment email.');
                    }
                }
    
                return Promise.all(emailPromises);
            })
            .then(() => {
                if (
                    newTicketId &&
                    this.ticket.Submitting_To__c === 'Internal' &&
                    this.ticket.Assigned_To__c &&
                    assignedUserLabel &&
                    this.ticket.Organization_Name__c !== 'Tesseract Apps'
                ) {
                    console.log('📝 Logging assignment in history for:', assignedUserLabel);
                    return appendHistoryEntry({
                        ticketId: newTicketId,
                        actionType: 'Assignment Added',
                        content: `Ticket assigned to ${assignedUserLabel} on creation.`
                    });
                }
                return Promise.resolve();
            })
            .then(() => {
                console.log('✅ Ticket flow complete – showing success toast');
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Success',
                    message: 'Ticket submitted and notifications sent!',
                    variant: 'success'
                }));
                this.resetForm();
                return refreshApex(this.wiredTicketsResult);
            })
            .then(() => {
                console.log('🔄 Ticket list refreshed.');
                this.applyTicketFilter();
            })
            .catch(error => {
                console.error('❌ Error in ticket submission flow:', JSON.stringify(error));
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error',
                    message: error?.body?.message || 'An error occurred while saving the ticket.',
                    variant: 'error'
                }));
            });
    }
    
    
    
    
    
    
    
    
    

    resetForm() {
        const orgName = this.ticket.Organization_Name__c;
        this.showCreateTicketForm = false;
        this.showUserDetails = false;
        this.ticket = {
            Ticket_Name__c: '',
            Email_ID__c: '',
            Contact_Number__c: '',
            Date_Of_Issue__c: '',
            Manager_Name__c: '',
            Ticket_generated_number__c: '',
            Organization_Name__c: orgName,
            Assigned_To__c: '',
            User_Name__c: '',
            Files_URL__c: '',
            Category__c: '',
            Platform__c: '',
            Module__c: '',
            Priority__c: '',
            Status__c: 'Open',
            Submitted_By__c: '',
            Resolution__c: '',
            Description__c: '',
            Submitting_To__c: '',
            Subject__c: ''
        };
        this.uploadedFiles = [];
        this.base64FileData = undefined;
        this.fileName = undefined;
        this.isSubmittingToInternal = true;
    this.isSubmittingToExternal = false;
    }

    Cancelticket() {
        cancelTicket({ ticket: this.ticket })
            .then(() => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Cancelled',
                    message: 'Ticket cancelled successfully!',
                    variant: 'info'
                }));
            })
            .catch(error => {
                console.error('Error cancelling ticket:', error);
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error',
                    message: error.body?.message || 'An error occurred',
                    variant: 'error'
                }));
            });
    }

    generateTicketInfo() {
        const now = new Date();
    
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
    
        const dateStr = `${day}${month}${year}`; // 🛠️ ddmmyyyy format
    
        // Simulate a 4-digit random sequence
        const randomSequence = String(Math.floor(1000 + Math.random() * 9000));
    
        const ticketName = `TKT-${dateStr}-${randomSequence}`;
        const ticketNumber = parseInt(`${day}${month}${year}${randomSequence}`); // ticket number based on ddmmyyyy
    
        return {
            name: ticketName,
            number: ticketNumber
        };
    }
    

    // Tickets Pagination
handleRecordsPerPageTickets(event) {
    this.pageSizeTickets = parseInt(event.target.value);
    this.totalPagesTickets = Math.ceil(this.totalRecordsTickets / this.pageSizeTickets);
    this.pageNumberTickets = 1;
}

nextPageTickets() {
    if (this.pageNumberTickets < this.totalPagesTickets) {
        this.pageNumberTickets++;
    }
}

previousPageTickets() {
    if (this.pageNumberTickets > 1) {
        this.pageNumberTickets--;
    }
}

firstPageTickets() {
    this.pageNumberTickets = 1;
}

lastPageTickets() {
    this.pageNumberTickets = this.totalPagesTickets;
}

// Resolved Tickets Pagination
handleRecordsPerPageResolved(event) {
    this.pageSizeResolved = parseInt(event.target.value);
    this.totalPagesResolved = Math.ceil(this.totalRecordsResolved / this.pageSizeResolved);
    this.pageNumberResolved = 1;
}

nextPageResolved() {
    if (this.pageNumberResolved < this.totalPagesResolved) {
        this.pageNumberResolved++;
    }
}

previousPageResolved() {
    if (this.pageNumberResolved > 1) {
        this.pageNumberResolved--;
    }
}

firstPageResolved() {
    this.pageNumberResolved = 1;
}

lastPageResolved() {
    this.pageNumberResolved = this.totalPagesResolved;
}
closeTicketPanel() {
    const closeEvent = new CustomEvent('closeticket', {
        bubbles: true,
        composed: true
    });
    this.dispatchEvent(closeEvent);
}
get bDisableFirst() {
    return this.pageNumberTickets <= 1;
}

get bDisableLast() {
    return this.pageNumberTickets >= this.totalPagesTickets;
}

get pageNumber() {
    return this.pageNumberTickets;
}

get totalPages() {
    return this.totalPagesTickets;
}

get totalRecords() {
    return this.totalRecordsTickets;
}

/* get uploadedFileDetails() {
    if (!this.selectedTicket?.Attachment__c) return null;

    const url = this.selectedTicket.Attachment__c;
    const filename = decodeURIComponent(url.split('/').pop());
    const extension = filename.split('.').pop().toLowerCase();

    // Determine icon based on file type
    let iconName = 'doctype:attachment';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
        iconName = 'doctype:image';
    } else if (['pdf'].includes(extension)) {
        iconName = 'doctype:pdf';
    } else if (['doc', 'docx'].includes(extension)) {
        iconName = 'doctype:word';
    } else if (['xls', 'xlsx'].includes(extension)) {
        iconName = 'doctype:excel';
    } else if (['txt'].includes(extension)) {
        iconName = 'doctype:txt';
    }

    return {
        url,
        filename,
        iconName
    };
} */

   get uploadedFileDetails() {
    if (!this.selectedTicket?.Multiple_Attachments__r) return [];

    return this.selectedTicket.Multiple_Attachments__r.filter(att => att.post_attachment__c === false).map(att => {
        let awsData = {};
        try {
            awsData = JSON.parse(att.Awsjson__c || '{}');
        } catch (e) {
            console.error('Invalid Awsjson__c:', e);
        }

        const url = awsData.url || '';
        const filename = att.File_Name__c || awsData.originalName || 'Unknown';
        const extension = filename.split('.').pop().toLowerCase();

        // pick icon
        let iconName = 'doctype:attachment';
        if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
            iconName = 'doctype:image';
        } else if (extension === 'pdf') {
            iconName = 'doctype:pdf';
        } else if (['doc', 'docx'].includes(extension)) {
            iconName = 'doctype:word';
        } else if (['xls', 'xlsx'].includes(extension)) {
            iconName = 'doctype:excel';
        } else if (extension === 'txt') {
            iconName = 'doctype:txt';
        }

        return {
            id: att.Id,
            url,
            filename,
            iconName,
            size: awsData.size || ''
        };
    });
}


handleTicketClick(event) {
    const ticketId = event.currentTarget.dataset.id;

    getTicketDetailsById({ ticketId })
        .then(result => {
            console.log('Ticket Data:', JSON.stringify(result));

            this.selectedTicket = {
                ...result,
                formattedDateOfIssue: this.formatDate(result.Date_Of_Issue__c)
            };
            
            
            this.showTicketPopup = true;

            this.showTicketInfo = true;
            this.showConversation = false;
            this.showResolution = false;
            this.showAttachment = false;
            this.showApproval = false;
            this.showHistory = false;

            // ✅ Reset resolution UI state
            this.resolutionInput = '';
            this.showResolutionInput = false;

            // ✅ Render conversations if any
            setTimeout(() => {
                this.renderConversationUI();
            }, 0);
        })
        .catch(error => {
            console.error('Error fetching ticket details:', error);
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: 'Failed to load ticket details.',
                variant: 'error'
            }));
        });
}





renderConversationUI() {
    console.log('✅ renderConversationUI CALLED');

console.log('📨 Raw Conversations:', this.selectedTicket.Conversations__c);
    const container = this.template.querySelector('.conversation-content');
    if (!container) return;

    container.innerHTML = '';

    const messages = JSON.parse(this.selectedTicket.Conversations__c || '[]');
    this.noConversations = messages.length === 0;

    messages.forEach(entry => {
        const initials = this.getInitials(entry.sender);
    
        // ✅ Format the timestamp to "22 Apr 2025" and "09:56 am"
        let datePart = '';
        let timePart = '';
    
        if (entry.timestamp) {
            try {
                const dateObj = new Date(entry.timestamp);
                const day = String(dateObj.getDate()).padStart(2, '0');
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const year = dateObj.getFullYear();
                datePart = `${day}/${month}/${year}`;

    
                timePart = dateObj.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }).toLowerCase(); // e.g. "09:56 am"
            } catch (e) {
                console.warn('Invalid conversation timestamp:', entry.timestamp);
                datePart = entry.timestamp;
                timePart = '';
            }
        }
    
        console.log('🧾 CONVERSATION DATE:', datePart);
        console.log('🕒 CONVERSATION TIME:', timePart);
    
        const div = document.createElement('div');
        div.className = 'message-block';
        div.innerHTML = `
            <div class="message-header">
                <div class="avatar-circle">${initials}</div>
                <div class="sender-details">
                    <div class="sender-row">
                        <strong class="sender-name">${entry.sender}</strong>
                        <div class="conversation-timestamp">
                            <div class="conversation-date">${datePart}</div>
                            <div class="conversation-time">${timePart}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="message-body">${entry.message}</div>
        `;
    
        container.appendChild(div);
    });
    
}



closeTicketPopup() {
    this.showTicketPopup = false;
    this.selectedTicket = {};
    this.showConversation = false;
    this.showResolution = false;
    this.showAttachment = false;
    this.showApproval = false;
    this.showHistory = false;
    this.resolutionInput = '';
    this.showResolutionInput = false;
    this.newMessage = '';
    this.showMessageInput = false;
    this.postAttachmentFileUrl = '';
    this.postAttachmentFileName = '';
    this.postAttachmentIcon = 'doctype:attachment';
    this.postAttachmentUploaded = false;
    this.showUploadPreview = false;
}


showTicketInfoTab() {
    this.resetTabs();
    this.showTicketInfo = true;
}
showConversationTab() {
    this.resetTabs();
    this.showConversation = true;
    this.pendingConversations = this.pendingConversations || [];

    console.log('🔁 Refreshing ticket before rendering Interactions tab...');

    getTicketDetailsById({ ticketId: this.selectedTicket.Id })
        .then(freshData => {
            console.log('📥 Refetched ticket:', JSON.stringify(freshData));

            let backendList = [];
            try {
                backendList = JSON.parse(freshData.Conversations__c || '[]');
                console.log('📤 Backend conversations:', backendList);
            } catch (e) {
                console.warn('❌ Failed to parse backend conversations:', e);
            }

            let localList = [];
            try {
                localList = JSON.parse(this.selectedTicket.Conversations__c || '[]');
                console.log('📥 Local conversations (before merge):', localList);
            } catch (e) {
                console.warn('❌ Failed to parse local conversations:', e);
            }

            const merged = [...backendList];

            // Merge local edits
            localList.forEach(local => {
                const exists = backendList.some(b =>
                    b.timestamp === local.timestamp && b.message === local.message
                );
                if (!exists) {
                    console.log('➕ Merging pending local message:', local);
                    merged.push(local);
                }
            });

            // Merge unsaved pending messages
            this.pendingConversations.forEach(pending => {
                const exists = merged.some(b =>
                    b.timestamp === pending.timestamp && b.message === pending.message
                );
                if (!exists) {
                    console.log('⚠️ Merging unsaved pending message:', pending);
                    merged.push(pending);
                }
            });

            // Clean up any confirmed messages
            this.pendingConversations = this.pendingConversations.filter(pending =>
                !merged.some(b =>
                    b.timestamp === pending.timestamp && b.message === pending.message
                )
            );

            this.selectedTicket = {
                ...freshData,
                formattedDateOfIssue: this.formatDate(freshData.Date_Of_Issue__c),
                Conversations__c: JSON.stringify(merged)
            };

            console.log('✅ Latest Conversations__c (merged):', this.selectedTicket.Conversations__c);

            setTimeout(() => {
                this.renderConversationUI();
            }, 0);
        })
        .catch(err => {
            console.error('❌ Error fetching fresh data for Interactions tab:', err);
        });
}



showResolutionTab() {
    this.resetTabs();
    this.showResolution = true;

    const resolutionData = this.selectedTicket?.Resolution__c;

    if (resolutionData) {
        try {
            const resData = JSON.parse(resolutionData);

            // Double parse if text is nested JSON string
            let text = resData?.text || '';
            if (typeof text === 'string' && text.trim().startsWith('{')) {
                try {
                    const nested = JSON.parse(text);
                    text = nested.text || text;
                } catch (err) {
                    // Use raw text if nested parsing fails
                }
            }

            this.resolutionInput = text;
            this.resolutionSubmittedBy = resData?.by || 'Unknown';
            this.resolutionInitials = this.getInitials(this.resolutionSubmittedBy);

            const fullTimestamp = resData?.timestamp || '';

            // ✅ Flexible handling of both comma and space-separated timestamps
            let datePart = '';
            let timePart = '';

            if (resData?.timestamp) {
                try {
                    const dateObj = new Date(resData.timestamp);
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const year = dateObj.getFullYear();
                    const hours = dateObj.getHours() % 12 || 12;
                    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                    const ampm = dateObj.getHours() >= 12 ? 'pm' : 'am';
            
                    datePart = `${day}/${month}/${year}`;
                    timePart = `${hours}:${minutes} ${ampm}`;
                } catch (e) {
                    console.warn('⚠️ Invalid timestamp format:', resData.timestamp);
                    datePart = resData.timestamp;
                    timePart = '';
                }
            }

            this.resolutionDate = datePart;
            this.resolutionTime = timePart;

            // ✅ Log parsed values
            console.log('📅 Resolution Date:', this.resolutionDate);
            console.log('⏰ Resolution Time:', this.resolutionTime);

        } catch (e) {
            console.warn('⚠️ Resolution fallback:', e);
            this.resolutionInput = resolutionData;
            this.resolutionSubmittedBy = this.currentUserName;
            this.resolutionInitials = this.getInitials(this.currentUserName);
            this.resolutionDate = '';
            this.resolutionTime = '';
        }
    } else {
        this.resolutionInput = '';
        this.resolutionSubmittedBy = '';
        this.resolutionInitials = '';
        this.resolutionDate = '';
        this.resolutionTime = '';
    }

    this.showResolutionInput = false;
}






@track showUploadPreview = false;

/* showAttachmentTab() {
    this.resetTabs();
    this.showAttachment = true;

    const fileUrl = this.selectedTicket?.Post_Attachment__c || '';

    if (fileUrl) {
        this.postAttachmentFileUrl = fileUrl;

        // 🔍 Extract filename
        const fileName = decodeURIComponent(fileUrl.split('/').pop());
        this.postAttachmentFileName = fileName;

        // 🧠 Determine icon based on extension
        const extension = fileName.split('.').pop().toLowerCase();
        this.postAttachmentIcon = this.getIconFromExtension(extension);

        // 🎯 Show preview mode only
        this.postAttachmentUploaded = false;
        this.showUploadPreview = false;
    } else {
        // 📭 No file uploaded
        this.postAttachmentFileUrl = '';
        this.postAttachmentFileName = '';
        this.postAttachmentIcon = 'doctype:attachment';
        this.postAttachmentUploaded = false;
        this.showUploadPreview = false;
    }
} */

    showAttachmentTab() {
    this.resetTabs();
    this.totalfiles=[];
    this.documentedit=false;
   
    this.showAttachment = true;
    this.postupload = true;
    this.uploadcontainer=false;

    // Filter for post attachments only
    const attachments = (this.selectedTicket?.Multiple_Attachments__r || [])
        .filter(att => att.post_attachment__c); // ✅ only post_attachment__c = true

    if (attachments.length > 0) {
        this.postAttachments = attachments.map(att => {
            // Parse AWS JSON safely
            let awsData = {};
            try {
                awsData = JSON.parse(att.Awsjson__c || '{}');
            } catch (e) {
                console.error('Invalid Awsjson__c:', e);
            }

            // Determine URL
            const url = awsData.url || '';
            const key = awsData.key || '';

            // Determine filename
            const filename = att.File_Name__c || awsData.originalName || 'Unknown';
            const extension = filename.split('.').pop().toLowerCase();

            // Determine icon
            const iconName = this.getIconFromExtension(extension);

            // Return object for display
            return {
                id: att.Id,
                url,
                filename,
                iconName,
                key
            };
        });

        // Show preview mode
        console.log(' this.postAttachments',JSON.stringify(this.postAttachments));
       
    } else {
        // No post attachments
        this.postAttachments = [];
        this.uploadcontainer=true;
        this.postAttachmentUploaded = false;
        this.showUploadPreview = false;
    }
}


getFileNameFromUrl(url) {
    return url ? decodeURIComponent(url.substring(url.lastIndexOf('/') + 1)) : '';
}


getIconFromExtension(ext) {
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
        return 'doctype:image';
    } else if (ext === 'pdf') {
        return 'doctype:pdf';
    } else if (['doc', 'docx'].includes(ext)) {
        return 'doctype:word';
    } else {
        return 'doctype:attachment';
    }
}




showHistoryTab() {
    this.resetTabs();
    this.showHistory = true;
}

resetTabs() {
    this.showTicketInfo = false;
    this.showConversation = false;
    this.showResolution = false;
    this.showAttachment = false;
    this.showApproval = false;
    this.showHistory = false;
}
get ticketTabClass() {
    return this.showTicketInfo ? 'overview-tab active' : 'overview-tab';
}

get conversationTabClass() {
    return this.showConversation ? 'overview-tab active' : 'overview-tab';
}

get resolutionTabClass() {
    return this.showResolution ? 'overview-tab active' : 'overview-tab';
}

get attachmentTabClass() {
    return this.showAttachment ? 'overview-tab active' : 'overview-tab';
}

get approvalTabClass() {
    return this.showApproval ? 'overview-tab active' : 'overview-tab';
}

get historyTabClass() {
    return this.showHistory ? 'overview-tab active' : 'overview-tab';
}

triggerFileInput() {
    this.template.querySelector('input[type="file"]').click();
}
@track uploadContext = '';
/* onFileUpload(event) {       
    this.isattachError=false;
    if (event.target.files.length > 0) {
        this.selectedFilesToUpload = event.target.files;      
        this.file = this.selectedFilesToUpload[0];
        this.fileName = this.selectedFilesToUpload[0].name.split(" ").join("");
        this.fileType = this.selectedFilesToUpload[0].type;
        this.fileSize = this.selectedFilesToUpload[0].size;     
    
        if (!this.fileType.startsWith('image/')) {
        this.isattachError = true;
        this.imageerror='Only image files are allowed';
        return;
        }
        
        if (this.file.size > this.MAX_FILE_SIZE || this.file.size < this.MIN_FILE_SIZE) {  
            this.isattachError=true;
        }
        //create an intance of File
        this.fileReaderObj = new FileReader();

        //this callback function in for fileReaderObj.readAsDataURL
        this.fileReaderObj.onloadend = (() => {        
            //get the uploaded file in base64 format
            let fileContents = this.fileReaderObj.result;
            fileContents = fileContents.substr(fileContents.indexOf(',')+1);
            
            //read the file chunkwise
            let sliceSize = 1024;           
            let byteCharacters = atob(fileContents);
            let bytesLength = byteCharacters.length;
            let slicesCount = Math.ceil(bytesLength / sliceSize);                
            let byteArrays = new Array(slicesCount);
            for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
                let begin = sliceIndex * sliceSize;
                let end = Math.min(begin + sliceSize, bytesLength);                    
                let bytes = new Array(end - begin);
                for (let offset = begin, i = 0 ; offset < end; ++i, ++offset) {
                    bytes[i] = byteCharacters[offset].charCodeAt(0);         
                }
                byteArrays[sliceIndex] = new Uint8Array(bytes);
            }
            
            //from arraybuffer create a File instance
            this.myFile =  new File(byteArrays, this.fileName, { type: this.fileType });
            
            //callback for final base64 String format
            let reader = new FileReader();
            reader.onloadend = (() => {
                let base64data = reader.result;
                this.base64FileData = base64data.substr(base64data.indexOf(',')+1);
                this.uploadedFiles = [
                    ...this.uploadedFiles,
                    { name: this.fileName }
                
                ];
                // Directly upload to AWS if selectedTicket is available (for Attachment Tab uploads)
if (this.selectedTicket?.Id && this.uploadContext === 'Post Attachment') {
    uploadFile({
        base64: JSON.stringify(this.base64FileData),
        filename: this.fileName,
        recordId: this.selectedTicket.Id,
        obj: 'Post Attachment'
    }).then(() => {
        console.log('✅ Attachment uploaded to AWS and linked to Post_Attachment__c');
        this.showUploadPreview = true;
        this.postAttachmentUploaded = true;
        this.postAttachmentFileName = this.fileName;

        const ext = this.fileName.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
            this.postAttachmentIcon = 'doctype:image';
        } else if (ext === 'pdf') {
            this.postAttachmentIcon = 'doctype:pdf';
        } else if (['doc', 'docx'].includes(ext)) {
            this.postAttachmentIcon = 'doctype:word';
        } else {
            this.postAttachmentIcon = 'doctype:attachment';
        }

        // this.postAttachmentFileUrl = this.selectedTicket.Post_Attachment__c; // You can update this if needed
        setTimeout(() => {
        getTicketDetailsById({ ticketId: this.selectedTicket.Id })
        .then(result => {
            this.selectedTicket = {
                ...result,
                formattedDateOfIssue: this.formatDate(result.Date_Of_Issue__c)
            };
    
            this.postAttachmentFileUrl = result.Post_Attachment__c;
            console.log('📎 Refreshed Post_Attachment__c URL:', this.postAttachmentFileUrl);
    
            this.postAttachmentFileName = this.fileName;
    
            // Set icon again
            const ext = this.fileName.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
                this.postAttachmentIcon = 'doctype:image';
            } else if (ext === 'pdf') {
                this.postAttachmentIcon = 'doctype:pdf';
            } else if (['doc', 'docx'].includes(ext)) {
                this.postAttachmentIcon = 'doctype:word';
            } else {
                this.postAttachmentIcon = 'doctype:attachment';
            }
    
            this.showUploadPreview = true;
            this.postAttachmentUploaded = true;
        })
        .catch(error => {
            console.error('❌ Error refreshing ticket after upload:', error);
        });
    }, 500);
        
        this.dispatchEvent(new ShowToastEvent({
            title: 'Success',
            message: this.isEditingPostAttachment
                ? 'Post attachment edited successfully!'
                : 'Post attachment uploaded successfully!',
            variant: 'success'
        }));
        
        const historyAction = this.isEditingPostAttachment
            ? 'Post Attachment Edited'
            : 'Post Attachment Uploaded';
        
        this.appendToHistory(historyAction, this.fileName);
        this.isEditingPostAttachment = false; // reset after use
        

    }).catch(error => {
        console.error('❌ Post attachment upload failed:', error);
        this.dispatchEvent(new ShowToastEvent({
            title: 'Upload Error',
            message: 'Failed to upload attachment to AWS.',
            variant: 'error'
        }));
    });
}

            });
            reader.readAsDataURL(this.myFile);                                 
        });
        this.fileReaderObj.readAsDataURL(this.file);
    }
    this.showSpinner = false;   
} */

    onFileUpload(event) {       
        console.log('✅ Uploading start');
        this.isattachError=false;
        if(this.attachmentid){
            console.log('uploadfiles1',JSON.stringify(this.uploadedFiles1));
           
             this.deleteFile(this.key);
        }
       if (this.selectedTicket?.Id ) {
      insertTicketAttachments({
                            ticketId: this.selectedTicket.Id,
                            Awsjson: JSON.stringify(this.uploadedFiles1),
                            postattachment:'true',
                            attachmentid:this.attachmentid
                        }).then(() => {
            console.log('✅ Attachment uploaded to AWS and linked to Post_Attachment__c');
            this.showUploadPreview = true;
            this.postAttachmentUploaded = true;
           // this.postAttachmentFileName = this.fileName;
    
           /*  const ext = this.fileName.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
                this.postAttachmentIcon = 'doctype:image';
            } else if (ext === 'pdf') {
                this.postAttachmentIcon = 'doctype:pdf';
            } else if (['doc', 'docx'].includes(ext)) {
                this.postAttachmentIcon = 'doctype:word';
            } else {
                this.postAttachmentIcon = 'doctype:attachment';
            } */
    
            // this.postAttachmentFileUrl = this.selectedTicket.Post_Attachment__c;
    
            setTimeout(() => {
            getTicketDetailsById({ ticketId: this.selectedTicket.Id })
        .then(result => {
            this.selectedTicket = {
                ...result,
                formattedDateOfIssue: this.formatDate(result.Date_Of_Issue__c)
            };
            console.log('result',JSON.stringify(result));
            this.uploadcontainer=false;
            this.attachmentid='';
            this.allowMultiple=true;
            this.showAttachmentTab(); 
            this.key='';
    
          /*   this.postAttachmentFileUrl = result.Post_Attachment__c;
            console.log('📎 Refreshed Post_Attachment__c URL:', this.postAttachmentFileUrl);
    
            this.postAttachmentFileName = this.fileName; */
    
            // Set icon again
           /*  const ext = this.fileName.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
                this.postAttachmentIcon = 'doctype:image';
            } else if (ext === 'pdf') {
                this.postAttachmentIcon = 'doctype:pdf';
            } else if (['doc', 'docx'].includes(ext)) {
                this.postAttachmentIcon = 'doctype:word';
            } else {
                this.postAttachmentIcon = 'doctype:attachment';
            }
    
            this.showUploadPreview = true;
            this.postAttachmentUploaded = true; */
        })
        .catch(error => {
            console.error('❌ Error refreshing ticket after upload:', error);
        });
    
    }, 500);
    
    
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: this.isEditingPostAttachment
                    ? 'Post attachment edited successfully!'
                    : 'Post attachment uploaded successfully!',
                variant: 'success'
            }));
            
            const historyAction = this.isEditingPostAttachment
                ? 'Post Attachment Edited'
                : 'Post Attachment Uploaded';
            
           // this.appendToHistory(historyAction, this.fileName);
            this.isEditingPostAttachment = false; // reset after use
            
    
        }).catch(error => {
            console.error('❌ Post attachment upload failed:', error);
            this.dispatchEvent(new ShowToastEvent({
                title: 'Upload Error',
                message: 'Failed to upload attachment to AWS.',
                variant: 'error'
            }));
        });
    }
        this.showSpinner = false;   
    }

    openEditPopup(event) {
    const ticketId = event.target.dataset.id;
    const ticket = this.tickets.find(t => t.Id === ticketId);
    this.selectedTicket = { ...ticket };
    this.editTicket = { ...ticket };
    this.showEditPopup = true;
}
closeEditPopup() {
    this.showEditPopup = false;
    this.editTicket = {};
    this.selectedTicket = {};
}
handleEditInputChange(event) {
    const field = event.target.name;
    const value = event.detail.value;

    this.editTicket = {
        ...this.editTicket,
        [field]: value
    };
}

// saveTicketEdits() {
//     console.log('🛠️ saveTicketEdits() triggered');
//     const changes = [];
//     const ticketId = this.editTicket.Id;
//     const assigneeExists = !!this.editTicket.Assigned_To__c;
//     let assignmentChanged = false;
//     let resolvedStatusChanged = false;

//     // Detect assignment change
//     if (this.selectedTicket.Assigned_To__c !== this.editTicket.Assigned_To__c) {
//         assignmentChanged = true;
//         const oldAssignee = this.ticketingMembers.find(opt => opt.value === this.selectedTicket.Assigned_To__c)?.label || 'Unassigned';
//         const newAssignee = this.ticketingMembers.find(opt => opt.value === this.editTicket.Assigned_To__c)?.label || 'Unassigned';
//         changes.push({
//             actionType: 'Assignment Changed',
//             content: `Assigned changed from ${oldAssignee} to ${newAssignee}`
//         });
//         console.log(`🔄 Assignment change detected: ${oldAssignee} → ${newAssignee}`);
//     }

//     // Detect status change
//     if (this.selectedTicket.Status__c !== this.editTicket.Status__c) {
//         changes.push({
//             actionType: 'Status Updated',
//             content: `Status changed from ${this.selectedTicket.Status__c} to ${this.editTicket.Status__c}`
//         });
//         console.log(`🔄 Status changed: ${this.selectedTicket.Status__c} → ${this.editTicket.Status__c}`);

//         // Track if status changed to Resolved
//         if (this.editTicket.Status__c === 'Resolved') {
//             resolvedStatusChanged = true;
//         }
//     }

//     const comment = this.editTicket.commentText?.trim();
// if (comment) {
//     changes.push({
//         actionType: 'Comment Added',
//         content: comment
//     });
//     console.log('📝 Comment to log in history:', comment);
// }


//     const updatedFields = {
//         Id: ticketId,
//         Assigned_To__c: this.editTicket.Assigned_To__c,
//         Status__c: this.editTicket.Status__c
//     };

//     console.log('📤 Updating ticket:', updatedFields);

//     // Step 1: Update ticket
//     updateTicket({ updatedTicket: updatedFields })
//         .then(() => {
//             const index = this.tickets.findIndex(t => t.Id === ticketId);
//             if (index !== -1) {
//                 this.tickets[index] = { ...this.editTicket };
//             }

//             this.closeEditPopup();

//             // Step 2: Append change history
//             return Promise.all(
//                 changes.map(change =>
//                     appendHistoryEntry({
//                         ticketId,
//                         actionType: change.actionType,
//                         content: change.content
//                     })
//                 )
//             );
//         })
//         .then(() => {
//             // Step 3a: Send assignment email if changed
//             if (assignmentChanged) {
//                 console.log('📧 Assignment changed - preparing to send email');
//                 return new Promise((resolve) => {
//                     setTimeout(() => {
//                         sendAssignedTicketNotificationEmails({ ticketId })
//                             .then(() => {
//                                 console.log('✅ Assignment email sent successfully');
//                                 resolve();
//                             })
//                             .catch(error => {
//                                 console.error('❌ Error sending assignment email:', error);
//                                 resolve(); // Continue flow
//                             });
//                     }, 300);
//                 });
//             }else if (!assignmentChanged && assigneeExists) {
//                 // Only status changed but assignee still present — send email anyway
//                 console.log('📧 Status changed only – sending assignment email (assignee exists)');
//                 return new Promise((resolve) => {
//                     setTimeout(() => {
//                         sendAssignmentEmailOnStatusOnly({ ticketId })
//                             .then(() => {
//                                 console.log('✅ Assignment email sent (status-only trigger)');
//                                 resolve();
//                             })
//                             .catch(error => {
//                                 console.error('❌ Assignment (status-only) email failed:', error);
//                                 resolve();
//                             });
//                     }, 300);
//                 });
//             }

//             console.log('📭 No assignment or status-only email needed');

//             return Promise.resolve(); // No assignment change
//         })
//         .then(() => {
//             // Step 3b: Send resolved email if status changed to Resolved
//             if (resolvedStatusChanged) {
//                 return new Promise((resolve) => {
//                     setTimeout(() => {
//                         sendResolvedTicketEmail({ ticketId })
//                             .then(resolve)
//                             .catch(error => {
//                                 console.error('❌ Error sending resolved email:', error);
//                                 resolve(); // Continue flow
//                             });
//                     }, 300);
//                 });
//             }

//             return Promise.resolve(); // No resolved status change
//         })
//         .then(() => {
//             // ✅ Refresh backend data first
//             return refreshApex(this.wiredTicketsResult);
//         })
//         .then(() => {
//             // ✅ Then reapply filters to show fresh UI
//             this.applyTicketFilter();
//         this.editTicket.commentText = '';

//             this.dispatchEvent(new ShowToastEvent({
//                 title: 'Success',
//                 message: 'Ticket updated successfully!',
//                 variant: 'success'
//             }));
//         })
        
//         .catch(error => {
//             const msg = error.body?.message || JSON.stringify(error);
//             console.error('❌ Error updating ticket:', msg);

//             this.dispatchEvent(new ShowToastEvent({
//                 title: 'Error',
//                 message: msg,
//                 variant: 'error'
//             }));
//         });
// }


saveTicketEdits() {
    console.log('🛠️ saveTicketEdits() triggered');
    const changes = [];
    const ticketId = this.editTicket.Id;
    const assigneeExists = !!this.editTicket.Assigned_To__c;
    const comment = this.editTicket.commentText?.trim();
    let assignmentChanged = false;
    let statusChanged = false;
    let resolvedStatusChanged = false;

    // Check assignment change
    if (this.selectedTicket.Assigned_To__c !== this.editTicket.Assigned_To__c) {
        assignmentChanged = true;
        const oldAssignee = this.ticketingMembers.find(opt => opt.value === this.selectedTicket.Assigned_To__c)?.label || 'Unassigned';
        const newAssignee = this.ticketingMembers.find(opt => opt.value === this.editTicket.Assigned_To__c)?.label || 'Unassigned';
        changes.push({
            actionType: 'Assignment Changed',
            content: `Assigned changed from ${oldAssignee} to ${newAssignee}`
        });
    }

    // Check status change
    if (this.selectedTicket.Status__c !== this.editTicket.Status__c) {
        statusChanged = true;
        changes.push({
            actionType: 'Status Updated',
            content: `Status changed from ${this.selectedTicket.Status__c} to ${this.editTicket.Status__c}`
        });
        if (this.editTicket.Status__c === 'Resolved') {
            resolvedStatusChanged = true;
        }
    }

    // Check comment added
    const commentAdded = !!comment;
    if (commentAdded) {
        changes.push({
            actionType: 'Comment Added',
            content: comment
        });
    }

    const updatedFields = {
        Id: ticketId,
        Assigned_To__c: this.editTicket.Assigned_To__c,
        Status__c: this.editTicket.Status__c
    };

    console.log('📤 Updating ticket:', updatedFields);

    updateTicket({ updatedTicket: updatedFields })
        .then(() => {
            const index = this.tickets.findIndex(t => t.Id === ticketId);
            if (index !== -1) {
                this.tickets[index] = { ...this.editTicket };
            }

            this.closeEditPopup();

            // History logging
            if (changes.length > 0) {
                console.log('📝 Logging changes to history:', changes);
                return appendHistoryEntries({
    ticketId,
    changes
});

            }
            return Promise.resolve();
        })
        .then(() => {
    // ✅ CASE: All three changed
    if (assignmentChanged && statusChanged && commentAdded) {
        console.log('📧 All 3 changes detected — sending ONLY assignment email (priority)');
        return sendAssignedTicketNotificationEmails({ ticketId });
    }

    // ✅ CASE: Assignment changed only or with one more
    if (assignmentChanged) {
        console.log('📧 Assignment changed — sending assignment email');
        return sendAssignedTicketNotificationEmails({ ticketId });
    }

    // ✅ CASE: Status changed only (no assignment change)
    if (statusChanged && assigneeExists) {
        console.log('📧 Status-only change — sending status notification');
        return sendAssignmentEmailOnStatusOnly({ ticketId });
    }

    // ✅ CASE: Comment added only (no assignment/status change)
    if (commentAdded && assigneeExists) {
        console.log('📧 Comment-only change — sending comment notification');
        console.log('📝 Comment content:', comment);
        return sendCommentOnlyEmailNotification({
    ticketId,
    commentText: comment
});

    }

    console.log('📭 No changes requiring email notification');
    return Promise.resolve();
})

        .then(() => {
            // If status was marked resolved
            if (resolvedStatusChanged) {
                return sendResolvedTicketEmail({ ticketId });
            }
            return Promise.resolve();
        })
        .then(() => {
            return refreshApex(this.wiredTicketsResult);
        })
        .then(() => {
            this.applyTicketFilter();
            this.editTicket.commentText = ''; // reset comment
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: 'Ticket updated successfully!',
                variant: 'success'
            }));
        })
        .catch(error => {
            const msg = error?.body?.message || error?.message || JSON.stringify(error);
            console.error('❌ Error updating ticket:', msg);
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: msg,
                variant: 'error'
            }));
        });
}








handleNewMessageInput(event) {
    this.newMessage = event.target.value;
}
// sendMessageToConversation() {
//     if (!this.newMessage.trim()) return;

//     const now = new Date();
//     const timestamp = now.toLocaleString(undefined, {
//         year: 'numeric',
//         month: 'short',
//         day: '2-digit',
//         hour: '2-digit',
//         minute: '2-digit',
//         hour12: true
//     });

//     const sender = this.currentUserName || 'User';
//     const message = this.newMessage;

//     appendConversationEntry({
//         ticketId: this.selectedTicket.Id,
//         sender,
//         timestamp,
//         message
//     }).then(() => {
//         let localList = [];
//         if (this.selectedTicket.Conversations__c) {
//             localList = JSON.parse(this.selectedTicket.Conversations__c);
//         }
//         localList.push({ sender, timestamp, message });

//         this.selectedTicket = {
//             ...this.selectedTicket,
//             Conversations__c: JSON.stringify(localList)
//         };
//         this.appendToHistory('Conversation', message);
//         this.newMessage = '';
//         this.showMessageInput = false; // ✅ Hide input after sending
//         this.renderConversationUI();
//     }).catch(error => {
//         console.error('Error appending message:', error);
//     });
// }
@track pendingConversations = [];
sendMessageToConversation() {
    if (!this.newMessage.trim()) return;

    this.pendingConversations = this.pendingConversations || [];

    const now = new Date();
    const timestamp = now.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    const sender = this.currentUserName || 'User';
    const message = this.newMessage;

    console.log('📝 Sending message:', message);
    console.log('🕒 Timestamp:', timestamp);
    console.log('👤 Sender:', sender);

    const newEntry = { sender, timestamp, message };

    appendConversationEntry({
        ticketId: this.selectedTicket.Id,
        sender,
        timestamp,
        message
    }).then(() => {
        console.log('✅ Message appended on backend');

        this.pendingConversations.push(newEntry);
        console.log('📌 Added to pendingConversations:', this.pendingConversations);

        // Update local immediately
        let localList = [];
        try {
            localList = JSON.parse(this.selectedTicket.Conversations__c || '[]');
            console.log('📥 Local list before append:', localList);
        } catch (e) {
            console.warn('⚠️ Failed to parse local Conversations__c before append:', e);
        }

        localList.push(newEntry);
        this.selectedTicket.Conversations__c = JSON.stringify(localList);
        console.log('📌 Updated local Conversations__c:', this.selectedTicket.Conversations__c);

        this.appendToHistory('Conversation', message);
        this.newMessage = '';
        this.showMessageInput = false;

        console.log('🔁 Fetching updated ticket data from backend...');
        return getTicketDetailsById({ ticketId: this.selectedTicket.Id });
    }).then(freshData => {
        console.log('📥 Fetched ticket from backend:', JSON.stringify(freshData));

        let backendList = [];
        try {
            backendList = JSON.parse(freshData.Conversations__c || '[]');
            console.log('📤 Backend conversations after fetch:', backendList);
        } catch (e) {
            console.warn('❌ Failed to parse backend conversations:', e);
        }

        const merged = [...backendList];

        this.pendingConversations.forEach(pending => {
            const exists = backendList.some(b =>
                b.timestamp === pending.timestamp && b.message === pending.message
            );
            if (!exists) {
                console.log('➕ Merging unsaved pending message:', pending);
                merged.push(pending);
            }
        });

        this.pendingConversations = this.pendingConversations.filter(pending =>
            !backendList.some(b =>
                b.timestamp === pending.timestamp && b.message === pending.message
            )
        );

        this.selectedTicket = {
            ...freshData,
            formattedDateOfIssue: this.formatDate(freshData.Date_Of_Issue__c),
            Conversations__c: JSON.stringify(merged)
        };

        console.log('✅ Final merged Conversations__c:', this.selectedTicket.Conversations__c);

        setTimeout(() => {
            this.renderConversationUI();
        }, 0);
    }).catch(error => {
        console.error('❌ Error in message send flow:', error);
    });
}






// renderConversationUI() {
//     const container = this.template.querySelector('.conversation-content');
//     if (!container) return;

//     container.innerHTML = '';

//     const messages = JSON.parse(this.selectedTicket.Conversations__c || '[]');

//     messages.forEach(entry => {
//         const initials = this.getInitials(entry.sender);

//         const div = document.createElement('div');
//         div.className = 'message-block';
//         div.innerHTML = `
//         <div class="message-header">
//             <div class="avatar-circle">${initials}</div>
//             <div class="sender-details">
//                 <div class="sender-row">
//                     <strong class="sender-name">${entry.sender}</strong>
//                     <span class="timestamp">${entry.timestamp}</span>
//                 </div>
//             </div>
//         </div>
//         <div class="message-body">${entry.message}</div>
//     `;
    
//         container.appendChild(div);
//     });
// }
getInitials(name) {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}


toggleMessageInput() {
    this.showMessageInput = true;

    // ✅ Mark conversation as started
    if (this.noConversations) {
        this.noConversations = false;
    }
}



handleResolutionChange(event) {
    this.resolutionInput = event.detail.value;
}
showResolutionInputField() {
    this.showResolutionInput = true;
}
saveResolution() {
    if (!this.resolutionInput.trim()) return;

    this.resolutionAdded = true;
    this.showResolutionInput = false;


    const now = new Date();
    const formattedTimestamp = now.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    const resolutionPayload = JSON.stringify({
        text: this.resolutionInput,
        by: this.currentUserName,
        timestamp: formattedTimestamp
    });

    updateResolution({
        ticketId: this.selectedTicket.Id,
        resolutionText: resolutionPayload
    })
    .then(() => {
        // ✅ Update local ticket
        this.selectedTicket = {
            ...this.selectedTicket,
            Resolution__c: resolutionPayload
        };

        // ✅ Parse and update UI fields
        const resData = JSON.parse(resolutionPayload);
        const text = resData.text;
        this.resolutionInput = text;
        this.previousResolutionText = text;
        this.resolutionSubmittedBy = resData.by;
        this.resolutionInitials = this.getInitials(resData.by);

        // ✅ Split timestamp into date/time
        const [datePart, timePart] = formattedTimestamp.includes(',')
            ? formattedTimestamp.split(',').map(str => str.trim())
            : (() => {
                const idx = formattedTimestamp.indexOf(' ');
                return [
                    formattedTimestamp.slice(0, idx).trim(),
                    formattedTimestamp.slice(idx + 1).trim()
                ];
            })();

        this.resolutionDate = datePart;
        this.resolutionTime = timePart;
        this.selectedTicket.Resolution__c = resolutionPayload;
        this.showResolutionInput = false;

        // ✅ Show success toast
        this.dispatchEvent(new ShowToastEvent({
            title: 'Success',
            message: 'Resolution saved successfully',
            variant: 'success'
        }));

        // ✅ Determine action type
        let actionType = 'Resolution Added';
        if (this.previousResolutionText && this.previousResolutionText !== text) {
            actionType = 'Resolution Edited';
        }

        // ✅ Log to history
        this.appendToHistory(actionType, text);

        // ✅ Clear edit tracking
        this.previousResolutionText = null;
        return getTicketDetailsById({ ticketId: this.selectedTicket.Id });
    })
    .then((updatedTicket) => {
        this.selectedTicket = updatedTicket;
    })
    .catch(error => {
        console.error('Error updating resolution:', error);
        this.dispatchEvent(new ShowToastEvent({
            title: 'Error',
            message: 'Failed to save resolution',
            variant: 'error'
        }));
    });
}





showResolutionActions(event) {
    const actionIcons = event.currentTarget.querySelector('.resolution-actions');
    if (actionIcons) actionIcons.style.display = 'inline-flex';
}

hideResolutionActions(event) {
    const actionIcons = event.currentTarget.querySelector('.resolution-actions');
    if (actionIcons) actionIcons.style.display = 'none';
}

editResolution() {
    let text = '';

    try {
        // ✅ Parse latest resolution from ticket object
        const parsed = JSON.parse(this.selectedTicket.Resolution__c || '{}');
        text = parsed.text || '';

        // 🔁 Double parse if needed (for legacy nested JSON)
        if (typeof text === 'string' && text.trim().startsWith('{')) {
            try {
                const nested = JSON.parse(text);
                text = nested.text || text;
            } catch (e) {
                console.warn('Nested JSON parse failed. Using outer text.');
            }
        }
    } catch (e) {
        console.warn('Resolution parse failed. Falling back to raw text.');
        text = this.selectedTicket.Resolution__c || '';
    }

    this.previousResolutionText = text;

    // ✅ Show the input
    this.showResolutionInput = true;

    // ✅ Delay value assignment to ensure LWC re-renders input
    setTimeout(() => {
        this.resolutionInput = text;

        // ✅ Optional: Auto focus the textarea
        const textarea = this.template.querySelector('.resolution-textarea');
        if (textarea) {
            textarea.focus();
        }
    }, 100); // 100ms is usually enough, less delay than 200ms
}

cancelResolutionEdit() {
    this.showResolutionInput = false;
    this.resolutionInput = this.previousResolutionText || '';
}





@track previousResolutionText = null;

deleteResolution() {
    const previousText = this.resolutionInput;
    this.resolutionAdded = false;

    updateResolution({
        ticketId: this.selectedTicket.Id,
        resolutionText: ''
    }).then(() => {
        const updatedTicket = { ...this.selectedTicket };
        updatedTicket.Resolution__c = '';
        this.selectedTicket = updatedTicket;

        this.resolutionInput = '';
        this.showResolutionInput = false;

        this.dispatchEvent(new ShowToastEvent({
            title: 'Deleted',
            message: 'Resolution removed successfully',
            variant: 'info'
        }));

        // ✅ Log deletion
        if (previousText) {
            this.appendToHistory('Resolution Deleted', previousText);
        }
    }).catch(error => {
        console.error('Error deleting resolution:', error);
        this.dispatchEvent(new ShowToastEvent({
            title: 'Error',
            message: 'Failed to delete resolution',
            variant: 'error'
        }));
    });
}



appendToHistory(actionType, content) {
    console.log('🔁 Logging to history:', actionType, content);
    console.log('🎯 Ticket ID:', this.selectedTicket?.Id);

    appendHistoryEntry({
        ticketId: this.selectedTicket.Id,
        actionType,
        content
    }).then(() => {
        return getTicketDetailsById({ ticketId: this.selectedTicket.Id });
    }).then(result => {
        this.selectedTicket = result;
        this.renderHistoryUI();
    }).catch(error => {
        const message = error.body?.message || JSON.stringify(error);
        console.error('❌ Error appending history:', message);
    });
}

get parsedHistory() {
    try {
        const logs = JSON.parse(this.selectedTicket.History_Log__c || '[]');
        return logs.map(entry => ({
            ...entry,
            initials: this.getInitials(entry.user)
        }));
    } catch (e) {
        return [];
    }
}
get groupedHistory() {
    try {
        const logs = JSON.parse(this.selectedTicket.History_Log__c || '[]');

        const grouped = {};

        logs.forEach(entry => {
            const datetime = new Date(entry.timestamp);
            const dateLabel = datetime.toLocaleDateString(undefined, {
                day: '2-digit', month: 'short'
            });

            const timeLabel = datetime.toLocaleTimeString(undefined, {
                hour: '2-digit', minute: '2-digit',
                hour12: true
            });

            const formattedEntry = {
                ...entry,
                initials: this.getInitials(entry.user),
                date: dateLabel,
                time: timeLabel
            };

            if (!grouped[dateLabel]) {
                grouped[dateLabel] = [];
            }
            grouped[dateLabel].push(formattedEntry);
        });

        return Object.entries(grouped).map(([date, entries]) => ({
            date,
            entries
        }));

    } catch (e) {
        return [];
    }
}

@track postAttachmentFileUrl = '';
@track postAttachmentFileName = '';
@track postAttachmentIcon = '';
@track showAttachmentDeleteModal = false;
@track isEditingPostAttachment = false;


triggerPostAttachmentUpload() {
    this.uploadContext = 'Post Attachment';
    const inputEl = this.template.querySelector('.post-upload-input');
    if (inputEl) {
        inputEl.click();
    }
}


/* handleEditPostAttachment() {
    this.postAttachmentFileUrl = '';
    this.postAttachmentFileName = '';
    this.postAttachmentIcon = 'doctype:attachment';
    this.isEditingPostAttachment = true;
} */

@track attachmentid;
@track key;
@track allowMultiple=true;
@track documentedit=false;
@track totalfiles;
handleEditPostAttachment(event) {
    this.attachmentid=event.currentTarget.dataset.id;
     this.key = event.currentTarget.dataset.key; 
    console.log('attachmentid',this.attachmentid);
     console.log('KEY',this.key);
    this.documentedit=true;
    this.totalfiles=[];
    this.postAttachmentFileUrl = '';
    this.postAttachmentFileName = '';
    this.postAttachmentIcon = 'doctype:attachment';
    this.uploadcontainer=true;
    this.isEditingPostAttachment = true;
    this.allowMultiple=false;

}

   triggerFileDialog() {
        const input = this.template.querySelector('.file-input');
        if (input) {
            input.click();
        }
    }

  @track isFileExpand = false;
  @track uploadedFiles1 = [];
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

          
            this.uploadedFiles1=files;
            this.isFileExpand = true;
            if(this.postupload){
                this.onFileUpload();
            }
           
          
            this.fileSizeInBytes = totalBytes;
            console.log(' Files in last  : ',  files);
            console.log(' this.uploadedFiles  : ',  JSON.stringify(this.uploadedFiles));
           
            this.isFileAttached=true;
            console.groupEnd();
        } catch (e) {
            console.error('[AWS Upload Complete] handler error:', e);
        }
    }
   
    handleFileUploadInputChange(event) {
        let files = Array.from(event.target.files || []);
        const invalidFile = files.find(f => !this.isAllowedFile(f));
        if (invalidFile) {
            console.log('checking file type');
            this.showToast('Error', `File type not allowed: ${invalidFile.name}. Only PDF and image files (.pdf, .png, .jpg, .jpeg) are allowed.`, 'error');
            event.target.value = ''; // reset
            return;
        }
        const longNameFile = files.find(f => f.name.length > 30);
        if (longNameFile) {
            this.showToast(
                'Error',
                `Filename too long: "${longNameFile.name}". Maximum allowed is 30 characters.`,
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

   ALLOWED_FILE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg','doc','docx'];

    isAllowedFile(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return this.ALLOWED_FILE_EXTENSIONS.includes(ext);
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant,
        });
        this.dispatchEvent(event);
    }

   handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
    }

    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        let files = Array.from(event.dataTransfer.files || []);
       
        const invalidFile = files.find(f => !this.isAllowedFile(f));
        if (invalidFile) {
            console.log('checking file type');
            this.showToast('Error', `File type not allowed: ${invalidFile.name}. Only PDF,Doc and image files (.pdf, .png, .jpg, .jpeg) are allowed.`, 'error');
            event.target.value = ''; // reset
            return;
        }
        const longNameFile = files.find(f => f.name.length > 30);
        if (longNameFile) {
            this.showToast(
                'Error',
                `Filename too long: "${longNameFile.name}". Maximum allowed is 30 characters.`,
                'error'
            );
            event.target.value = '';
            return;
        }
         console.log('files size',files.length);
          console.log('this.documentedit',this.documentedit);

         if (this.documentedit) {
        // 🚫 Allow only one file in edit mode
        if (this.totalfiles.length >= 1) {
            this.showToast('Error', 'Only one file can be uploaded in edit mode.', 'error');
            return;
        } 
       console.log('files size',files.length);

        if (files.length > 1) {
            this.showToast('Error', 'You can only upload one file in edit mode.', 'error');
            return;
        }

        files = [files[0]]; // take only the first file
    }
        
       this.totalfiles.push(...files); 
       this.processFiles(files);
        event.target.value = '';
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
            this.isDisabled=false;
            this.key='';
            this.isEdit=false;
        } catch (e) {
            console.error('[DELETE] error', e);
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
        this.totalfiles=[];
        // Example: remove it from parent's tracking
        this.uploadedFiles1 = this.uploadedFiles1.filter(f => f.fileId !== fileId);
        console.log(' this.uploadedFiles in handleFileDeleted: ',  JSON.stringify(this.uploadedFiles1));
        // if (!this.uploadedFiles || this.uploadedFiles.length === 0) {
        //    this.isFileExpand = false;
        // }
        if (!files || files.length === 0) {
           this.isFileExpand = false;
           
        }
    }



confirmDeletePostAttachment() {
    this.showAttachmentDeleteModal = true;
}

cancelDeletePostAttachment() {
    this.showAttachmentDeleteModal = false;
}

deletePostAttachment() {
    this.showAttachmentDeleteModal = false;
    this.showSpinner = true;

    uploadFile({
        base64: '',
        filename: '',
        recordId: this.selectedTicket.Id,
        obj: 'Post Attachment'
    })
    .then(() => {
        this.postAttachmentFileUrl = '';
        this.postAttachmentFileName = '';
        this.dispatchEvent(new ShowToastEvent({
            title: 'Deleted',
            message: 'Post attachment removed successfully.',
            variant: 'success'
        }));
    })
    .catch(error => {
        console.error('Error deleting post attachment:', error);
        this.dispatchEvent(new ShowToastEvent({
            title: 'Error',
            message: 'Failed to remove post attachment.',
            variant: 'error'
        }));
    })
    .finally(() => {
        this.showSpinner = false;
    });
}


@track showConfirmDeleteModal = false;

editPostAttachment() {
    this.postAttachmentFileUrl = '';
    this.postAttachmentUploaded = false;
}

deletePostAttachment() {
    this.showConfirmDeleteModal = true;
}

closeDeleteModal() {
    this.showConfirmDeleteModal = false;
}

/* confirmDeletePostAttachment() {
    this.showConfirmDeleteModal = false;
    this.showSpinner = true;

    const filename = this.postAttachmentFileName; // ✅ define it before using

    deletePostAttachmentFromTicket({ ticketId: this.selectedTicket.Id })
        .then(() => {
            this.postAttachmentFileUrl = '';
            this.postAttachmentFileName = '';
            this.postAttachmentUploaded = false;

            this.dispatchEvent(new ShowToastEvent({
                title: 'Deleted',
                message: 'Post attachment deleted successfully.',
                variant: 'info'
            }));

            this.appendToHistory('Post Attachment Deleted', filename); // ✅ safe now
        })
        .catch(error => {
            console.error('❌ Delete Error:', error);
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: 'Failed to delete post attachment.',
                variant: 'error'
            }));
        })
        .finally(() => {
            this.showSpinner = false;
        });
} */

confirmDeletePostAttachment(event) {
    this.showConfirmDeleteModal = false;
    this.showSpinner = true;
    
  const attachmentid = event.currentTarget.dataset.id;
  const filename = event.currentTarget.dataset.filename;
  const key = event.currentTarget.dataset.key; 
  console.log('filename:', filename);
  deleteRecord(attachmentid)
                    .then(() => {
                       
                        // Show success toast
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Success',
                                message: 'Child record deleted successfully',
                                variant: 'success'
                            })
                        );
                         this.appendToHistory('Post Attachment Deleted', filename);
                        this.deleteFile(key);
        
                       return getTicketDetailsById({ ticketId: this.selectedTicket.Id });
                        
                        
                    })
                     .then(result => {
                        // ✅ Update selectedTicket & refresh attachments list
                        this.selectedTicket = result;
                        this.showAttachmentTab(); 
                    })
                    .catch(error => {
                        console.error('❌ Delete Error:', error);
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Error',
                                message: 'Failed to delete post attachment.',
                                variant: 'error'
                            })
                        );
                    })
                    .finally(() => {
                        this.showSpinner = false;
                    });
               
}

@track selectedFilter = 'Submitted'; // Default
@track filterOptions = [];
@track rawTickets = []; // Store all fetched tickets
@track isTicketingMember = false;
@track noConversations = false;




setFilterOptions() {
    if (this.isTesseractOrg) {
        // Always show full filter set for Tesseract Apps org
        this.filterOptions = [
            { label: 'All Tickets', value: 'All' },
            { label: 'My Tickets', value: 'Assigned' },
            { label: 'My Requests', value: 'Submitted' },
            { label: 'Resolved', value: 'Resolved' }
        ];
    } else if (this.isAdmin) {
        this.filterOptions = [
            { label: 'All Tickets', value: 'All' },
            { label: 'My Requests', value: 'Submitted' },
            { label: 'Resolved', value: 'Resolved' }
        ];
    } else if (this.isTicketingMember) {
        this.filterOptions = [
            { label: 'My Tickets', value: 'Assigned' },
            { label: 'My Requests', value: 'Submitted' },
            { label: 'Resolved', value: 'Resolved' }
        ];
    } else {
        this.filterOptions = [
            { label: 'My Requests', value: 'Submitted' },
            { label: 'Resolved', value: 'Resolved' }
        ];
    }
}
handleFilterChange(event) {
    this.selectedFilter = event.detail.value;
    this.applyTicketFilter();
}

applyTicketFilter() {
    if (!this.rawTickets) return;

    let filteredTickets = [];

    switch (this.selectedFilter) {
        case 'All':
            filteredTickets = this.rawTickets.filter(t => t.Status__c !== 'Resolved');
            break;

        case 'Assigned':
            filteredTickets = this.rawTickets.filter(t =>
                t.Status__c !== 'Resolved' &&
                t.Assigned_To__r?.Email === this.currentUserEmail
            );
            break;

        case 'Submitted':
            filteredTickets = this.rawTickets.filter(t =>
                t.Status__c !== 'Resolved' &&
                t.Belong_To__r?.Email === this.currentUserEmail
            );
            break;

        case 'Resolved':
            filteredTickets = this.rawTickets.filter(t =>
                t.Status__c === 'Resolved' &&
                (this.isAdmin || this.isTicketingMember || t.Belong_To__r?.Email === this.currentUserEmail)
            );
            break;

        default:
            filteredTickets = [];
    }

    // ✅ Apply Priority Filter (if selected)
    if (this.selectedPriority) {
        filteredTickets = filteredTickets.filter(t => t.Priority__c === this.selectedPriority);
    }

    // ✅ Assign filtered data and recalculate pagination
    this.tickets = filteredTickets.map(t => ({
        ...t,
        organizationName: t.Organization__r?.Name
    ? (t.Organization__r.Name.length > 15
        ? t.Organization__r.Name.slice(0, 15) + '...'
        : t.Organization__r.Name)
    : '—',
fullOrganizationName: t.Organization__r?.Name || '—', // for tooltip

    }));
    
    this.totalRecordsTickets = this.tickets.length;
    this.totalPagesTickets = Math.ceil(this.totalRecordsTickets / this.pageSizeTickets);
    this.pageNumberTickets = 1;

    this.showNoTicketsMessage = this.tickets.length === 0;
}



get canEditTickets() {
    return this.isAdmin || this.isTicketingMember || this.isTesseractOrg;
}

get computedColSpan() {
    // Base columns: Ticket Number, Subject, Username, Date of Issue, Priority, Assigned To, Status
    let baseColumns = 7;
    if (this.isAdmin || this.isTicketingMember) {
        baseColumns += 1; // Add "Action" column
    }
    return baseColumns;
}

@track selectedPriority = ''; // For dropdown filter
handlePriorityFilterChange(event) {
    this.selectedPriority = event.detail.value;
    this.applyTicketFilter();
}

formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}




@track selectedChartFilter = 'all';
@track showOrgDropdown = false;
@track showUserDropdown = false;
@track showDatePicker = false;
@track selectedDate = '';
@track selectedOrg = '';
@track selectedUser = '';
@track chartInstance;
@track chartFilterOptions = [
    { label: 'All (Status)', value: 'all' },
    { label: 'Status', value: 'status' },
    { label: 'Priority', value: 'priority' },
    { label: 'Date of Issue', value: 'date' },
    { label: 'Assigned To', value: 'assigned' },
    { label: 'Raised By', value: 'raised' }
];

chartInstance;

handleChartFilterChange(event) {
    this.selectedChartFilter = event.detail.value;
    this.selectedDate = '';
    this.selectedOrg = '';
    this.selectedUser = '';
    this.showOrgDropdown = this.selectedChartFilter === 'raised';
    this.showUserDropdown = this.selectedChartFilter === 'assigned';
    this.showDatePicker = this.selectedChartFilter === 'date';
    this.renderChart();
}
handleOrgChange(event) {
    this.selectedOrg = event.detail.value;
    this.renderChart();
}

handleUserChange(event) {
    this.selectedUser = event.detail.value;
    this.renderChart();
}

handleDateChange(event) {
    this.selectedDate = event.detail.value;
    this.renderChart();
}


renderStatusPieChart(data) {
    // const ctx = this.template.querySelector('canvas.status-bar-chart')?.getContext('2d');
    // if (!ctx || !window.Chart) return;

    // if (this.statusChartInstance) {
    //     this.statusChartInstance.destroy();
    // }

    // const statusCounts = {};
    // data.forEach(ticket => {
    //     const status = ticket.Status__c || 'Unknown';
    //     statusCounts[status] = (statusCounts[status] || 0) + 1;
    // });

    // const labels = Object.keys(statusCounts);
    // const counts = Object.values(statusCounts);

    // console.log('📊 Ticket counts by status (Pie Chart):');
    // labels.forEach((label, i) => {
    //     console.log(`${label}: ${counts[i]}`);
    // });

    // this.statusChartInstance = new window.Chart(ctx, {
    //     type: 'pie', // 🔄 CHANGED FROM 'bar' TO 'pie'
    //     data: {
    //         labels,
    //         datasets: [{
    //             label: 'Tickets by Status',
    //             data: counts,
    //             backgroundColor: ['#36a2eb', '#ff6384', '#ffce56', '#4bc0c0', '#9966ff']
    //         }]
    //     },
    //     options: {
    //         responsive: true,
    //         maintainAspectRatio: true,
    //         aspectRatio: 1,
    //         plugins: {
    //             legend: {
    //                 display: true,
    //                 position: 'bottom'
    //             },
    //             title: {
    //                 display: true,
    //                 text: 'Ticket Distribution by Status'
    //             }
    //         }
    //     }
    // });

    const ctx = this.template.querySelector('canvas.status-bar-chart')?.getContext('2d');
    if (!ctx || !window.Chart) return;

    if (this.statusChartInstance) {
        this.statusChartInstance.destroy();
    }

    

    const statusCounts = {};
    data.forEach(ticket => {
        const status = ticket.Status__c || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const labels = Object.keys(statusCounts);
    const counts = Object.values(statusCounts);

    console.log('📊 Ticket counts by status (Polar Chart):');
    labels.forEach((label, i) => {
        console.log(`• ${label}: ${counts[i]}`);
    });

    this.statusChartInstance = new window.Chart(ctx, {
        type: 'polarArea',
        data: {
            labels,
            datasets: [{
                label: 'Tickets by Status',
                data: counts,
                backgroundColor: [
                    '#36a2eb',
                    '#ff6384',
                    '#ffce56',
                    '#4bc0c0',
                    '#9966ff',
                    '#c9cbcf'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1,
            plugins: {
                legend: {
                    display: true,
                    position: 'right'
                },
                title: {
                    display: true,
                    text: 'Ticket Distribution by Status (Polar Area)'
                }
            }
        }
    });
}



renderChart(data = []) {
    const ctx = this.template.querySelector('canvas.chart')?.getContext('2d');
    if (!ctx) return;

    if (this.chartInstance) {
        this.chartInstance.destroy();
    }

    let filtered = [...data];

    if (this.selectedChartFilter === 'raised' && this.selectedOrg) {
        filtered = filtered.filter(t => t.Organization_Name__c === this.selectedOrg);
    } else if (this.selectedChartFilter === 'assigned' && this.selectedUser) {
        filtered = filtered.filter(t => t.Assigned_To__r?.Name === this.selectedUser);
    } else if (this.selectedChartFilter === 'date' && this.selectedDate) {
        filtered = filtered.filter(t => t.Date_Of_Issue__c === this.selectedDate);
    }

    let groupField = 'Status__c'; // default grouping
    if (this.selectedChartFilter === 'priority') groupField = 'Priority__c';
    if (this.selectedChartFilter === 'status') groupField = 'Status__c';

    const chartData = {};
    filtered.forEach(ticket => {
        const key = ticket[groupField] || 'Unknown';
        chartData[key] = (chartData[key] || 0) + 1;
    });

    const labels = Object.keys(chartData);
    const dataPoints = Object.values(chartData);

    this.chartInstance = new window.Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Number of Tickets by ${groupField.replace('__c', '').replace(/_/g, ' ')}`,
                data: dataPoints,
                backgroundColor: ['#36a2eb', '#ff6384', '#ffce56', '#4bc0c0', '#9966ff']
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y', // ← This makes it a horizontal bar chart
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Ticket Breakdown by Status'
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
}

showDashboardPanel() {
    const panel = this.template.querySelector('#dashboardPanel');
    if (panel) {
        panel.classList.add('show');
        this.renderStatusPieChart(this.rawTickets); // or any chart you want
    }
}

hideDashboardPanel() {
    const panel = this.template.querySelector('#dashboardPanel');
    if (panel) {
        panel.classList.remove('show');
    }
}



}