import { LightningElement, track, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getRecord, deleteRecord } from 'lightning/uiRecordApi';
import { loadScript } from 'lightning/platformResourceLoader';
import USER_ID from '@salesforce/user/Id';
import ChartJS from '@salesforce/resourceUrl/chratJs';

import TICKET_OBJECT from '@salesforce/schema/TSign_Ticket__c';
import CATEGORY_FIELD from '@salesforce/schema/TSign_Ticket__c.Category__c';
import PLATFORM_FIELD from '@salesforce/schema/TSign_Ticket__c.Platform__c';
import MODULE_FIELD from '@salesforce/schema/TSign_Ticket__c.Module__c';
import PRIORITY_FIELD from '@salesforce/schema/TSign_Ticket__c.Priority__c';
import SUBMITTED_BY_FIELD from '@salesforce/schema/TSign_Ticket__c.Submitted_By__c';

import createTicket from '@salesforce/apex/TSignTicketManager.createTicket';
import getTickets from '@salesforce/apex/TSignTicketManager.getTickets';
import getOrgNameById from '@salesforce/apex/TSignTicketManager.getOrgNameById';
import getTicketDetailsById from '@salesforce/apex/TSignTicketManager.getTicketDetailsById';
import getSupportAgents from '@salesforce/apex/TSignTicketManager.getSupportAgents';
import updateTicket from '@salesforce/apex/TSignTicketManager.updateTicket';
import getStatusPicklistValues from '@salesforce/apex/TSignTicketManager.getStatusPicklistValues';
import appendConversationEntry from '@salesforce/apex/TSignTicketManager.appendConversationEntry';
import updateResolution from '@salesforce/apex/TSignTicketManager.updateResolution';
import appendHistoryEntry from '@salesforce/apex/TSignTicketManager.appendHistoryEntry';
import appendHistoryEntries from '@salesforce/apex/TSignTicketManager.appendHistoryEntries';
import sendTicketNotificationEmails from '@salesforce/apex/TSignTicketManager.sendTicketNotificationEmails';
import sendAssignedTicketNotificationEmails from '@salesforce/apex/TSignTicketManager.sendAssignedTicketNotificationEmails';
import sendResolvedTicketEmail from '@salesforce/apex/TSignTicketManager.sendResolvedTicketEmail';
import sendAssignmentEmailOnStatusOnly from '@salesforce/apex/TSignTicketManager.sendAssignmentEmailOnStatusOnly';
import sendCommentOnlyEmailNotification from '@salesforce/apex/TSignTicketManager.sendCommentOnlyEmailNotification';
import getUsersByOrganizationName from '@salesforce/apex/TSignTicketManager.getUsersByOrganizationName';
import insertTicketAttachments from '@salesforce/apex/TSignTicketManager.insertTicketAttachments';
import getStaffNamesByUserIds from '@salesforce/apex/TSignTicketManager.getStaffNamesByUserIds';
import deleteFiles from '@salesforce/apex/tSignAwsBatchController.deleteFiles';
import deactivateTicketAttachment from '@salesforce/apex/TSignTicketManager.deactivateTicketAttachment';


// ---------------------------------------------------------------
// helpers
// ---------------------------------------------------------------
function nameFromKey(key) {
    return (key || '').split('/').pop().replace(/^\d+_/, '');
}

function toAwsPayload(files) {
    return (files || []).map(f => ({
        url: f.url,
        key: f.key,
        originalName: f.originalName || f.name || nameFromKey(f.key),
        size: f.size !== undefined && f.size !== null ? String(f.size) : ''
    }));
}

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
        Organization__c: '',
        Subject__c: '',
        Assigned_To__c: '',
        Description__c: ''
    };

    // parent may pass these; org id is now taken from User.TSign_Org_Id__c first
    @api orgid;
    @api staffId;

    @track resolvedOrgId; // from User.TSign_Org_Id__c
    @track orgName;

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
    @track ticketingMembers = [];
    @track statusOptions = [];
    @track currentUserType = '';
    @track currentUserEmail = '';
    @track showUserDetails = false;
    @track newMessage = '';
    @track currentUserName = '';
    @track showMessageInput = false;
    @track resolutionInitials = '';
    @track resolutionInput = '';
    @track showResolutionInput = false;
    @track resolutionSubmittedBy = '';
    @track resolutionTimestamp = '';
    @track resolutionDate = '';
    @track resolutionTime = '';
    @track isTesseractOrg = false;
    @track uploadcontainer;
    @track showNoTicketsMessage = false;
    @track resolutionAdded = false;
    @track postAttachments = [];

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

    @track searchKey = '';

    categoryOptions = [];
    platformOptions = [];
    PlatformOptions = [];
    moduleOptions = [];
    priorityOptions = [];
    submittedByOptions = [];

    chartInitialized = false;
    statusChartInstance;
    wiredTicketsResult;

    // =====================================================
    // WIRES
    // =====================================================

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
    }

    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: PLATFORM_FIELD })
    platformValues({ data }) {
        if (data) {
            this.platformOptions = data.values;
            this.PlatformOptions = data.values;
        }
    }

    @wire(getRecord, {
        recordId: USER_ID,
        fields: [
            'User.User_Type__c',
            'User.Type_of_User__c',
            'User.Email',
            'User.Name',
            'User.User_Role__c',
            'User.IT_Support__c',
            'User.TSign_Org_Id__c'
        ]
    })
    wiredUser({ error, data }) {
        if (data) {
            this.currentUserType = data.fields.User_Type__c.value;
            this.currentUserEmail = data.fields.Email.value;
            this.currentUserName = data.fields.Name.value;
            this.currentUserRole = data.fields.User_Role__c.value;
            this.currenTTypeofUser = data.fields.Type_of_User__c.value;
            this.resolutionInitials = this.getInitials(this.currentUserName);
            this.IsItSupport = data.fields.IT_Support__c.value;
            this.isTesseractOrg = (this.IsItSupport === 'Yes');

            // Org id from User.TSign_Org_Id__c (fallback: parent @api orgid)
            const userOrgId = data.fields.TSign_Org_Id__c?.value || this.orgid;
            if (userOrgId && userOrgId !== this.resolvedOrgId) {
                this.resolvedOrgId = userOrgId;
                this.loadOrgData(userOrgId);
            } else if (!userOrgId) {
                console.warn('⚠️ No TSign_Org_Id__c on user and no orgid from parent.');
            }

            if (this.ticketingMembers?.length) {
                this.setFilterOptions();
            }

            if (this.loadTickets()) {
                this.loadTickets();
            }
        } else if (error) {
            console.error('Error fetching user info:', error);
        }
    }

    ticketReqId = 0;

    async loadTickets() {
        const orgId = this.resolvedOrgId || this.orgid;
        console.log('[TKT] loadTickets | orgId=', orgId, '| orgName=', this.orgName,
            '| isTesseractOrg=', this.isTesseractOrg, '| email=', this.currentUserEmail);
        if (!orgId) {
            console.warn('[TKT] skipped: no orgId');
            return;
        }
        const reqId = ++this.ticketReqId;
        try {
            const data = await getTickets({ orgId, orgName: this.orgName });
            console.log('[TKT] apex returned', data.length, data.map(t => t.Ticket_Name__c));

            const userIds = [...new Set(data.map(t => t.Assigned_To__c).filter(Boolean))];
            let staffNames = {};
            if (userIds.length) {
                try {
                    staffNames = await getStaffNamesByUserIds({ userIds });
                } catch (e) {
                    console.error('[TKT] staff names error =', JSON.stringify(e));
                }
            }

            if (reqId !== this.ticketReqId) {
                console.log('[TKT] dropped stale response', reqId);
                return;
            }

            this.rawTickets = data.map(t => ({
                ...t,
                staffName: staffNames[t.Assigned_To__c] || t.Assigned_To__r?.Name || '-'
            }));
            this.applyTicketFilter();
        } catch (error) {
            console.error('[TKT] load error =', JSON.stringify(error));
        }
    }

    // =====================================================
    // LIFECYCLE
    // =====================================================

    renderedCallback() {
        if (this.chartInitialized) return;
        this.chartInitialized = true;

        loadScript(this, ChartJS)
            .then(() => {
                if (this.rawTickets?.length) {
                    this.renderStatusPieChart(this.rawTickets);
                }
            })
            .catch(error => {
                console.error('❌ Error loading Chart.js:', error);
            });
    }

    connectedCallback() {
        // Fallback only: if the User wire is slow, use parent's orgid.
        // wiredUser overrides it with User.TSign_Org_Id__c when it arrives.
        if (this.orgid && !this.resolvedOrgId) {
            this.resolvedOrgId = this.orgid;
            this.loadOrgData(this.orgid);
        }
    }

    loadOrgData(orgId) {
        getOrgNameById({ orgid: orgId })
            .then(name => {
                this.ticket.Organization_Name__c = name;
                this.orgName = name;
                this.loadTickets();
            })
            .catch(error => {
                console.error('❌ Error fetching organization name:', error);
            });

        // Assignable agents = active IT support users
        getSupportAgents()
            .then(agents => {
                this.ticketingMembers = (agents || []).map(a => ({
                    label: a.staffName,
                    value: a.userId,
                    email: a.email
                }));

                if (this.currentUserEmail) {
                    this.setFilterOptions();
                }
            })
            .catch(error => {
                console.error('❌ Error fetching support agents:', error);
            });

        getStatusPicklistValues()
            .then(result => {
                this.statusOptions = result.map(val => ({ label: val, value: val }));
            })
            .catch(error => {
                console.error('❌ Error fetching status picklist values:', error);
            });
    }

    // =====================================================
    // TABLE GETTERS
    // =====================================================

    get paginatedTickets() {
        const start = (this.pageNumberTickets - 1) * this.pageSizeTickets;
        const end = start + this.pageSizeTickets;

        return this.tickets.slice(start, end).map(t => ({
            ...t,
            formattedDateOfIssue: this.formatDate(t.Date_Of_Issue__c),
            showEdit: true,
            priorityStyle: this.computePriorityStyle(t.Priority__c)
        }));
    }

    computePriorityStyle(priority) {
        switch ((priority || '').toLowerCase()) {
            case 'low':
                return 'background-color: #e0f7e9;';
            case 'medium':
                return 'background-color: #fff3cd;';
            case 'high':
                return 'background-color: #f8d7da;';
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

    handleClick(event) {
        this.clickedButtonLabel = event.target.label;
    }

    // =====================================================
    // CREATE FORM
    // =====================================================

    @track selectedUserId = '';
    @track orgUsers = [];

    handleInputChange(event) {
        const field = event.target.dataset.field;
        const value = event.target.value;

        if (field === 'Submitted_By__c') {
            this.ticket.Submitted_By__c = value;

            if (value === 'Self') {
                this.showUserDetails = false;
                this.showUserLookup = false;

                this.ticket.User_Name__c = this.currentUserName;
                this.ticket.Email_ID__c = this.currentUserEmail;
                this.ticket.Contact_Number__c = '';
                this.ticket.Manager_Name__c = '';

            } else if (value === 'On Behalf Of') {
                this.showUserDetails = true;
                this.showUserLookup = true;

                this.ticket.User_Name__c = '';
                this.ticket.Email_ID__c = '';
                this.ticket.Contact_Number__c = '';
                this.ticket.Manager_Name__c = '';

                if (this.resolvedOrgId) {
                    getUsersByOrganizationName({ orgId: this.resolvedOrgId })
                        .then(userRecords => {
                            this.orgUsers = (userRecords || []).map(u => ({
                                label: u.name,
                                value: u.userId,
                                email: u.email,
                                contact: u.phone
                            }));
                        })
                        .catch(error => {
                            console.error('❌ Error fetching users from org:', error);
                            this.orgUsers = [];
                        });
                } else {
                    console.warn('⚠️ Org id is empty — cannot fetch users.');
                    this.orgUsers = [];
                }

            } else {
                this.showUserDetails = true;
                this.showUserLookup = false;

                this.ticket.User_Name__c = '';
                this.ticket.Email_ID__c = '';
                this.ticket.Contact_Number__c = '';
                this.ticket.Manager_Name__c = '';
            }

        } else if (field) {
            this.ticket = { ...this.ticket, [field]: value };
        }
    }

    handleUserSelect(event) {
        this.selectedUserId = event.detail.value;

        const selectedUser = this.orgUsers.find(user => user.value === this.selectedUserId);
        if (!selectedUser) {
            console.warn('⚠️ Selected user not found in orgUsers');
            return;
        }

        this.ticket.User_Name__c = selectedUser.label || '';
        this.ticket.Email_ID__c = selectedUser.email || '';
        this.ticket.Contact_Number__c = selectedUser.contact || '';
        this.ticket.Manager_Name__c = '';
    }

    validateFields() {
        const requiredFields = [
            { field: 'Organization_Name__c', label: 'Organization Name' },
            { field: 'Submitted_By__c', label: 'Submitted By' },
            { field: 'User_Name__c', label: 'User Name' },
            { field: 'Email_ID__c', label: 'Email ID' },
            { field: 'Contact_Number__c', label: 'Contact Number' },
            { field: 'Date_Of_Issue__c', label: 'Date Of Issue' },
            { field: 'Priority__c', label: 'Priority' },
            { field: 'Module__c', label: 'Module' },
            { field: 'Category__c', label: 'Category' },
            { field: 'Platform__c', label: 'Platform' },
            { field: 'Subject__c', label: 'Subject' }
        ];

        const missing = [];
        requiredFields.forEach(({ field, label }) => {
            if (!this.ticket[field]) {
                missing.push(label);
            }
        });
        return missing;
    }

    submitTicket() {
        const missingFields = this.validateFields();
        if (missingFields.length > 0) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Missing Required Fields',
                message: `Please fill in the following fields: ${missingFields.join(', ')}`,
                variant: 'error'
            }));
            return;
        }

        const ticketInfo = this.generateTicketInfo();
        this.ticket.Ticket_Name__c = ticketInfo.name;
        this.ticket.Ticket_generated_number__c = ticketInfo.number;

        // Belong_To__c
        if (this.ticket.Submitted_By__c === 'On Behalf Of') {
            this.ticket.Belong_To__c = this.selectedUserId || USER_ID;
        } else {
            this.ticket.Belong_To__c = USER_ID;
        }

        // Org id from User.TSign_Org_Id__c
        this.ticket.Organization__c = this.resolvedOrgId;

        let newTicketId;
        let assignedUserLabel = '';
        let assignedUserEmail = '';

        if (this.ticket.Assigned_To__c) {
            const assignedUser = this.ticketingMembers.find(t => t.value === this.ticket.Assigned_To__c);
            assignedUserLabel = assignedUser?.label || '';
            assignedUserEmail = assignedUser?.email || '';
        }

        if (this.ticket.Organization_Name__c === 'Tesseract Apps' || !this.ticket.Assigned_To__c) {
            delete this.ticket.Assigned_To__c;
        }

        createTicket({ ticket: this.ticket })
            .then(async result => {
                newTicketId = result?.Id;

                // files already in S3 (uploaded through c-t-signaws-batch-lwc): save them on the ticket
                if (newTicketId && this.uploadedFiles1.length) {
                    await insertTicketAttachments({
                        ticketId: newTicketId,
                        Awsjson: JSON.stringify(toAwsPayload(this.uploadedFiles1)),
                        postattachment: false,
                        attachmentid: null
                    });
                }
            })
            .then(() => {
                const emailPromises = [];

                if (newTicketId) {
                    emailPromises.push(sendTicketNotificationEmails({ ticketId: newTicketId }));

                    if (
                        assignedUserEmail &&
                        this.ticket.Organization_Name__c !== 'Tesseract Apps'
                    ) {
                        emailPromises.push(
                            sendAssignedTicketNotificationEmails({ ticketId: newTicketId })
                        );
                    }
                }
                return Promise.all(emailPromises);
            })
            .then(() => {
                if (
                    newTicketId &&
                    this.ticket.Assigned_To__c &&
                    assignedUserLabel &&
                    this.ticket.Organization_Name__c !== 'Tesseract Apps'
                ) {
                    return appendHistoryEntry({
                        ticketId: newTicketId,
                        actionType: 'Assignment Added',
                        content: `Ticket assigned to ${assignedUserLabel} on creation.`
                    });
                }
                return Promise.resolve();
            })
            .then(() => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Success',
                    message: 'Ticket submitted and notifications sent!',
                    variant: 'success'
                }));
                this.resetForm();
                this.loadTickets();
            })
            .then(() => {
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
            Subject__c: ''
        };
        this.uploadedFiles = [];
        this.uploadedFiles1 = [];
    }

    // Cancel on a create form: files already in S3 would be orphaned, so remove them
    Cancelticket() {
        this.uploadedFiles1.forEach(f => this.deleteFile(f.key));
        this.resetForm();
        this.dispatchEvent(new ShowToastEvent({
            title: 'Cancelled',
            message: 'Ticket cancelled.',
            variant: 'info'
        }));
    }

    generateTicketInfo() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateStr = `${day}${month}${year}`; // ddmmyyyy

        const randomSequence = String(Math.floor(1000 + Math.random() * 9000));

        return {
            name: `TKT-${dateStr}-${randomSequence}`,
            number: parseInt(`${day}${month}${year}${randomSequence}`, 10)
        };
    }

    // =====================================================
    // PAGINATION
    // =====================================================

    handleRecordsPerPageTickets(event) {
        this.pageSizeTickets = parseInt(event.target.value, 10);
        this.totalPagesTickets = Math.ceil(this.totalRecordsTickets / this.pageSizeTickets);
        this.pageNumberTickets = 1;
    }

    nextPageTickets() {
        if (this.pageNumberTickets < this.totalPagesTickets) this.pageNumberTickets++;
    }

    previousPageTickets() {
        if (this.pageNumberTickets > 1) this.pageNumberTickets--;
    }

    firstPageTickets() {
        this.pageNumberTickets = 1;
    }

    lastPageTickets() {
        this.pageNumberTickets = this.totalPagesTickets;
    }

    handleRecordsPerPageResolved(event) {
        this.pageSizeResolved = parseInt(event.target.value, 10);
        this.totalPagesResolved = Math.ceil(this.totalRecordsResolved / this.pageSizeResolved);
        this.pageNumberResolved = 1;
    }

    nextPageResolved() {
        if (this.pageNumberResolved < this.totalPagesResolved) this.pageNumberResolved++;
    }

    previousPageResolved() {
        if (this.pageNumberResolved > 1) this.pageNumberResolved--;
    }

    firstPageResolved() {
        this.pageNumberResolved = 1;
    }

    lastPageResolved() {
        this.pageNumberResolved = this.totalPagesResolved;
    }

    closeTicketPanel() {
        this.dispatchEvent(new CustomEvent('closeticket', { bubbles: true, composed: true }));
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

    // =====================================================
    // TICKET POPUP
    // =====================================================

    get uploadedFileDetails() {
        if (!this.selectedTicket?.TSign_Ticket_Attachments__r) return [];

        return this.selectedTicket.TSign_Ticket_Attachments__r
            .filter(att => !att.post_attachment__c)
            .map(att => {
                let awsData = {};
                try {
                    awsData = JSON.parse(att.Awsjson__c || '{}');
                } catch (e) {
                    console.error('Invalid Awsjson__c:', e);
                }

                const url = awsData.url || '';
                const filename = att.File_Name__c || awsData.originalName || 'Unknown';
                const extension = filename.split('.').pop().toLowerCase();

                let iconName = this.getIconFromExtension(extension);
                if (['xls', 'xlsx'].includes(extension)) iconName = 'doctype:excel';
                if (extension === 'txt') iconName = 'doctype:txt';

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
                this.postupload = false;

                this.resolutionInput = '';
                this.showResolutionInput = false;

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
        const container = this.template.querySelector('.conversation-content');
        if (!container) return;

        container.innerHTML = '';

        const messages = JSON.parse(this.selectedTicket.Conversations__c || '[]');
        this.noConversations = messages.length === 0;

        messages.forEach(entry => {
            const initials = this.getInitials(entry.sender);

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
                    }).toLowerCase();
                } catch (e) {
                    datePart = entry.timestamp;
                    timePart = '';
                }
            }

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
        this.postupload = false;
        this.isEditingPostAttachment = false;
        this.uploadedFiles1 = [];
    }

    showTicketInfoTab() {
        this.resetTabs();
        this.showTicketInfo = true;
    }

    showConversationTab() {
        this.resetTabs();
        this.showConversation = true;
        this.pendingConversations = this.pendingConversations || [];

        getTicketDetailsById({ ticketId: this.selectedTicket.Id })
            .then(freshData => {
                let backendList = [];
                try {
                    backendList = JSON.parse(freshData.Conversations__c || '[]');
                } catch (e) {
                    console.warn('❌ Failed to parse backend conversations:', e);
                }

                let localList = [];
                try {
                    localList = JSON.parse(this.selectedTicket.Conversations__c || '[]');
                } catch (e) {
                    console.warn('❌ Failed to parse local conversations:', e);
                }

                const merged = [...backendList];

                localList.forEach(local => {
                    const exists = backendList.some(b =>
                        b.timestamp === local.timestamp && b.message === local.message
                    );
                    if (!exists) merged.push(local);
                });

                this.pendingConversations.forEach(pending => {
                    const exists = merged.some(b =>
                        b.timestamp === pending.timestamp && b.message === pending.message
                    );
                    if (!exists) merged.push(pending);
                });

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

                let text = resData?.text || '';
                if (typeof text === 'string' && text.trim().startsWith('{')) {
                    try {
                        const nested = JSON.parse(text);
                        text = nested.text || text;
                    } catch (err) {
                        // use raw text
                    }
                }

                this.resolutionInput = text;
                this.resolutionSubmittedBy = resData?.by || 'Unknown';
                this.resolutionInitials = this.getInitials(this.resolutionSubmittedBy);

                let datePart = '';
                let timePart = '';

                if (resData?.timestamp) {
                    try {
                        const dateObj = new Date(resData.timestamp);
                        if (isNaN(dateObj.getTime())) throw new Error('bad date');
                        const day = String(dateObj.getDate()).padStart(2, '0');
                        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const year = dateObj.getFullYear();
                        const hours = dateObj.getHours() % 12 || 12;
                        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                        const ampm = dateObj.getHours() >= 12 ? 'pm' : 'am';

                        datePart = `${day}/${month}/${year}`;
                        timePart = `${hours}:${minutes} ${ampm}`;
                    } catch (e) {
                        datePart = resData.timestamp;
                        timePart = '';
                    }
                }

                this.resolutionDate = datePart;
                this.resolutionTime = timePart;

            } catch (e) {
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

    // ---------- Post attachments tab ----------

    showAttachmentTab() {
        this.resetTabs();
        this.showAttachment = true;
        this.postupload = true;
        this.uploadedFiles1 = [];
        this.uploadcontainer = false;
        this.isEditingPostAttachment = false;
        this.isSavingPostAttachment = false;
        this.savedPostKeys = new Set();
        this.attachmentid = '';
        this.key = '';

        const attachments = (this.selectedTicket?.TSign_Ticket_Attachments__r || [])
            .filter(att => att.post_attachment__c);

        this.postAttachments = attachments.map(att => {
            let awsData = {};
            try {
                awsData = JSON.parse(att.Awsjson__c || '{}');
            } catch (e) {
                console.error('Invalid Awsjson__c:', e);
            }

            const filename = att.File_Name__c || awsData.originalName || 'Unknown';
            const extension = filename.split('.').pop().toLowerCase();

            return {
                id: att.Id,
                url: awsData.url || '',
                key: awsData.key || att.key__c || '',
                filename,
                iconName: this.getIconFromExtension(extension)
            };
        });

        // nothing saved yet: show the upload box straight away
        if (!this.postAttachments.length) {
            this.uploadcontainer = true;
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
        }
        return 'doctype:attachment';
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
        this.postupload = false;
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

    // =====================================================
    // EDIT POPUP
    // =====================================================

    openEditPopup(event) {
        const ticketId = event.currentTarget?.dataset?.id || event.target.dataset.id;
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

    saveTicketEdits() {
        const changes = [];
        const ticketId = this.editTicket.Id;
        const assigneeExists = !!this.editTicket.Assigned_To__c;
        const comment = this.editTicket.commentText?.trim();
        let assignmentChanged = false;
        let statusChanged = false;
        let resolvedStatusChanged = false;

        if (this.selectedTicket.Assigned_To__c !== this.editTicket.Assigned_To__c) {
            assignmentChanged = true;
            const oldAssignee = this.ticketingMembers.find(opt => opt.value === this.selectedTicket.Assigned_To__c)?.label || 'Unassigned';
            const newAssignee = this.ticketingMembers.find(opt => opt.value === this.editTicket.Assigned_To__c)?.label || 'Unassigned';
            changes.push({
                actionType: 'Assignment Changed',
                content: `Assigned changed from ${oldAssignee} to ${newAssignee}`
            });
        }

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

        const commentAdded = !!comment;
        if (commentAdded) {
            changes.push({
                actionType: 'Comment Added',
                content: comment
            });
        }

        const updatedFields = {
            Id: ticketId,
            Assigned_To__c: this.editTicket.Assigned_To__c || null,
            Status__c: this.editTicket.Status__c
        };

        updateTicket({ updatedTicket: updatedFields })
            .then(() => {
                const index = this.tickets.findIndex(t => t.Id === ticketId);
                if (index !== -1) {
                    this.tickets[index] = { ...this.editTicket };
                }

                this.closeEditPopup();

                if (changes.length > 0) {
                    return appendHistoryEntries({ ticketId, changes });
                }
                return Promise.resolve();
            })
            .then(() => {
                // assignment email has priority
                if (assignmentChanged) {
                    return sendAssignedTicketNotificationEmails({ ticketId });
                }
                if (statusChanged && assigneeExists) {
                    return sendAssignmentEmailOnStatusOnly({ ticketId });
                }
                if (commentAdded && assigneeExists) {
                    return sendCommentOnlyEmailNotification({ ticketId, commentText: comment });
                }
                return Promise.resolve();
            })
            .then(() => {
                if (resolvedStatusChanged) {
                    return sendResolvedTicketEmail({ ticketId });
                }
                return Promise.resolve();
            })
            .then(() => refreshApex(this.loadTickets()))
            .then(() => {
                this.applyTicketFilter();
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

    // =====================================================
    // CONVERSATION
    // =====================================================

    handleNewMessageInput(event) {
        this.newMessage = event.target.value;
    }

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
        const newEntry = { sender, timestamp, message };

        appendConversationEntry({
            ticketId: this.selectedTicket.Id,
            sender,
            timestamp,
            message
        }).then(() => {
            this.pendingConversations.push(newEntry);

            let localList = [];
            try {
                localList = JSON.parse(this.selectedTicket.Conversations__c || '[]');
            } catch (e) {
                console.warn('⚠️ Failed to parse local Conversations__c before append:', e);
            }

            localList.push(newEntry);
            this.selectedTicket.Conversations__c = JSON.stringify(localList);

            this.appendToHistory('Conversation', message);
            this.newMessage = '';
            this.showMessageInput = false;

            return getTicketDetailsById({ ticketId: this.selectedTicket.Id });
        }).then(freshData => {
            let backendList = [];
            try {
                backendList = JSON.parse(freshData.Conversations__c || '[]');
            } catch (e) {
                console.warn('❌ Failed to parse backend conversations:', e);
            }

            const merged = [...backendList];

            this.pendingConversations.forEach(pending => {
                const exists = backendList.some(b =>
                    b.timestamp === pending.timestamp && b.message === pending.message
                );
                if (!exists) merged.push(pending);
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

            setTimeout(() => {
                this.renderConversationUI();
            }, 0);
        }).catch(error => {
            console.error('❌ Error in message send flow:', error);
        });
    }

    getInitials(name) {
        if (!name) return '';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    toggleMessageInput() {
        this.showMessageInput = true;
        if (this.noConversations) {
            this.noConversations = false;
        }
    }

    // =====================================================
    // RESOLUTION
    // =====================================================

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

        const plainText = this.resolutionInput;

        // Apex adds author + timestamp, so send PLAIN text
        updateResolution({
            ticketId: this.selectedTicket.Id,
            resolutionText: plainText
        })
            .then(() => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Success',
                    message: 'Resolution saved successfully',
                    variant: 'success'
                }));

                const actionType = (this.previousResolutionText && this.previousResolutionText !== plainText)
                    ? 'Resolution Edited'
                    : 'Resolution Added';

                this.appendToHistory(actionType, plainText);
                this.previousResolutionText = null;

                return getTicketDetailsById({ ticketId: this.selectedTicket.Id });
            })
            .then(updatedTicket => {
                this.selectedTicket = {
                    ...updatedTicket,
                    formattedDateOfIssue: this.formatDate(updatedTicket.Date_Of_Issue__c)
                };
                this.showResolutionTab();
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
            const parsed = JSON.parse(this.selectedTicket.Resolution__c || '{}');
            text = parsed.text || '';

            if (typeof text === 'string' && text.trim().startsWith('{')) {
                try {
                    const nested = JSON.parse(text);
                    text = nested.text || text;
                } catch (e) {
                    // keep outer text
                }
            }
        } catch (e) {
            text = this.selectedTicket.Resolution__c || '';
        }

        this.previousResolutionText = text;
        this.showResolutionInput = true;

        setTimeout(() => {
            this.resolutionInput = text;
            const textarea = this.template.querySelector('.resolution-textarea');
            if (textarea) textarea.focus();
        }, 100);
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
            this.selectedTicket = { ...this.selectedTicket, Resolution__c: '' };
            this.resolutionInput = '';
            this.showResolutionInput = false;

            this.dispatchEvent(new ShowToastEvent({
                title: 'Deleted',
                message: 'Resolution removed successfully',
                variant: 'info'
            }));

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

    // =====================================================
    // HISTORY
    // =====================================================

    appendToHistory(actionType, content) {
        appendHistoryEntry({
            ticketId: this.selectedTicket.Id,
            actionType,
            content
        }).then(() => {
            return getTicketDetailsById({ ticketId: this.selectedTicket.Id });
        }).then(result => {
            this.selectedTicket = {
                ...result,
                formattedDateOfIssue: this.formatDate(result.Date_Of_Issue__c)
            };
        }).catch(error => {
            const message = error.body?.message || JSON.stringify(error);
            console.error('❌ Error appending history:', message);
        });
    }

    get parsedHistory() {
        try {
            const logs = JSON.parse(this.selectedTicket.History_Log__c || this.selectedTicket.History_log__c || '[]');
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
            const logs = JSON.parse(this.selectedTicket.History_Log__c || this.selectedTicket.History_log__c || '[]');
            const grouped = {};

            logs.forEach(entry => {
                const datetime = new Date(entry.timestamp);
                const dateLabel = datetime.toLocaleDateString(undefined, {
                    day: '2-digit', month: 'short'
                });
                const timeLabel = datetime.toLocaleTimeString(undefined, {
                    hour: '2-digit', minute: '2-digit', hour12: true
                });

                const formattedEntry = {
                    ...entry,
                    initials: this.getInitials(entry.user),
                    date: dateLabel,
                    time: timeLabel
                };

                if (!grouped[dateLabel]) grouped[dateLabel] = [];
                grouped[dateLabel].push(formattedEntry);
            });

            return Object.entries(grouped).map(([date, entries]) => ({ date, entries }));
        } catch (e) {
            return [];
        }
    }

    // =====================================================
    // POST ATTACHMENTS (TSign_Ticket_Attachment__c, post_attachment__c = true)
    // Upload + delete UI is c-t-signaws-batch-lwc (AWS config: TSign_Ticket).
    // Saves automatically after upload.
    // =====================================================

    @track isEditingPostAttachment = false;
    @track attachmentid;
    @track key;
    @track uploadedFiles1 = [];   // files uploaded to S3 and not yet saved to Salesforce
    postupload = false;           // true while the Attachment tab is the upload target
    isSavingPostAttachment = false;
    savedPostKeys = new Set();    // keys already saved, protects against repeated upload events

    // true when the upload box was opened over existing post attachments (edit), so Cancel makes sense
    get hasPostAttachments() {
        return this.postAttachments.length > 0;
    }

    async reloadSelectedTicket() {
        const result = await getTicketDetailsById({ ticketId: this.selectedTicket.Id });
        this.selectedTicket = {
            ...result,
            formattedDateOfIssue: this.formatDate(result.Date_Of_Issue__c)
        };
    }

    handleEditPostAttachment(event) {
        this.attachmentid = event.currentTarget.dataset.id;
        this.key = event.currentTarget.dataset.key;
        this.uploadedFiles1 = [];
        this.savedPostKeys = new Set();
        this.uploadcontainer = true;
        this.isEditingPostAttachment = true;
    }

    // Cancel while replacing a post attachment: drop anything already uploaded and go back to the list
    cancelPostAttachmentEdit() {
        this.uploadedFiles1.forEach(f => this.deleteFile(f.key));
        this.uploadedFiles1 = [];
        this.attachmentid = '';
        this.key = '';
        this.isEditingPostAttachment = false;
        this.uploadcontainer = false;
    }

    handleAttachmentUpload(event) {
        const incoming = (event.detail?.files || []).filter(
            f => f && f.url && f.key && (!f.status || f.status === 'ok')
        );
        if (!incoming.length) return;

        if (this.postupload) {
            // Attachment tab: ignore files already saved
            const fresh = incoming.filter(f => !this.savedPostKeys.has(f.key));
            if (!fresh.length) return;

            if (this.isEditingPostAttachment) {
                const [first, ...extras] = fresh;
                extras.forEach(f => this.deleteFile(f.key));
                this.uploadedFiles1 = [first];
            } else {
                this.uploadedFiles1 = fresh;
            }
            this.savePostAttachments();
            return;
        }

        // Create form: child re-sends its whole list with new keys on every add.
        // Merge by file name, delete the superseded S3 copy.
        const byName = new Map(this.uploadedFiles1.map(f => [nameFromKey(f.key), f]));
        incoming.forEach(f => {
            const n = nameFromKey(f.key);
            const old = byName.get(n);
            if (old && old.key !== f.key) this.deleteFile(old.key);
            byName.set(n, f);
        });
        this.uploadedFiles1 = [...byName.values()];
    }

    // child sends 2 shapes: array of remaining files, or { deletedKeys }
    handleAttachmentDelete(event) {
        const detail = event.detail;
        let remainingKeys = null;
        let deletedKeys = null;

        if (Array.isArray(detail)) {
            remainingKeys = new Set(detail.map(f => f.key));
        } else if (detail?.deletedKeys) {
            deletedKeys = new Set(detail.deletedKeys);
        }

        this.uploadedFiles1 = this.uploadedFiles1.filter(f =>
            remainingKeys ? remainingKeys.has(f.key) : !(deletedKeys && deletedKeys.has(f.key))
        );
    }

    async savePostAttachments() {
        if (this.isSavingPostAttachment) return;
        if (!this.selectedTicket?.Id || !this.uploadedFiles1.length) return;

        this.isSavingPostAttachment = true;

        const files = [...this.uploadedFiles1];
        const replacedKey = this.attachmentid ? this.key : '';
        const wasEditing = this.isEditingPostAttachment;
        const names = toAwsPayload(files).map(f => f.originalName).filter(Boolean).join(', ');

        try {
            await insertTicketAttachments({
                ticketId: this.selectedTicket.Id,
                Awsjson: JSON.stringify(toAwsPayload(files)),
                postattachment: true,
                attachmentid: this.attachmentid || null
            });

            files.forEach(f => this.savedPostKeys.add(f.key));

            if (replacedKey) this.deleteFile(replacedKey); // remove the replaced file from S3

            this.uploadedFiles1 = [];
            this.attachmentid = '';
            this.key = '';
            this.isEditingPostAttachment = false;

            await this.reloadSelectedTicket();
            this.showAttachmentTab();

            this.showToast(
                'Success',
                wasEditing ? 'Post attachment edited successfully!' : 'Post attachment uploaded successfully!',
                'success'
            );
            this.appendToHistory(wasEditing ? 'Post Attachment Edited' : 'Post Attachment Uploaded', names);
        } catch (error) {
            console.error('Post attachment upload failed:', error);
            this.showToast('Upload Error', error?.body?.message || 'Failed to save the attachment.', 'error');
        } finally {
            this.isSavingPostAttachment = false;
        }
    }

    // Delete icon clicked: soft delete (Active__c = false), record and S3 file stay
    async handleDeletePostAttachment(event) {
        const { id, filename } = event.currentTarget.dataset;
        if (!id) return;

        try {
            await deactivateTicketAttachment({ attachmentId: id });
            await this.reloadSelectedTicket();   // Apex returns only Active__c = true
            this.showAttachmentTab();
            this.showToast('Success', 'Attachment deleted successfully', 'success');
            this.appendToHistory('Post Attachment Deleted', filename);
        } catch (error) {
            console.error('Delete Error:', error);
            this.showToast('Error', 'Failed to delete post attachment.', 'error');
        }
    }

    // Removes a file from S3 through Apex. Apex returns debug info instead of throwing on HTTP errors.
    async deleteFile(key) {
        if (!key) return;
        try {
            const result = await deleteFiles({ keys: [key] });
            if (result?.debugError) {
                console.error('[DELETE] failed:', result.debugError, result.debugResponse);
            }
        } catch (e) {
            console.error('[DELETE] error', e);
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    // =====================================================
    // FILTERS
    // =====================================================

    @track selectedFilter = 'Submitted';
    @track filterOptions = [];
    @track rawTickets = [];
    @track noConversations = false;
    @track selectedPriority = '';

    setFilterOptions() {
        if (this.isTesseractOrg) {
            this.filterOptions = [
                { label: 'All Tickets', value: 'All' },
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
        console.log('[FLT] dropdown changed to =', event.detail.value,
            '| options =', JSON.stringify(this.filterOptions),
            '| isTesseractOrg =', this.isTesseractOrg);
        this.selectedFilter = event.detail.value;
        this.applyTicketFilter();
    }

    handlePriorityFilterChange(event) {
        this.selectedPriority = event.detail.value;
        this.applyTicketFilter();
    }

    applyTicketFilter() {
        if (!this.rawTickets) return;

        console.log('[FLT] ===== applyTicketFilter =====');
        console.log('[FLT] selectedFilter =', this.selectedFilter,
            '| priority =', this.selectedPriority || '(none)',
            '| search =', this.searchKey || '(none)',
            '| rawTickets =', this.rawTickets.length,
            '| currentUserEmail =', this.currentUserEmail);

        this.rawTickets.forEach(t => {
            console.log('[FLT] raw |', t.Ticket_Name__c,
                '| status =', t.Status__c,
                '| priority =', t.Priority__c,
                '| belongToEmail =', t.Belong_To__r?.Email,
                '| assignedToEmail =', t.Assigned_To__r?.Email,
                '| org =', t.Organization__r?.Name);
        });

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
                    (this.isTesseractOrg ||
                     t.Belong_To__r?.Email === this.currentUserEmail)
                );
                break;

            default:
                console.warn('[FLT] unknown filter value =', this.selectedFilter);
                filteredTickets = [];
        }
        console.log('[FLT] after status/user filter =', filteredTickets.length,
            filteredTickets.map(t => t.Ticket_Name__c));

        if (this.selectedPriority) {
            filteredTickets = filteredTickets.filter(t => t.Priority__c === this.selectedPriority);
            console.log('[FLT] after priority filter =', filteredTickets.length,
                filteredTickets.map(t => t.Ticket_Name__c));
        }

        if (this.searchKey) {
            const key = this.searchKey;
            filteredTickets = filteredTickets.filter(t => {
                const searchable = [
                    t.Ticket_Name__c,
                    t.Subject__c,
                    t.User_Name__c,
                    t.Priority__c,
                    t.Status__c,
                    t.Assigned_To__r?.Name,
                    this.isTesseractOrg ? t.Organization__r?.Name : null
                ];
                return searchable.some(v => v && String(v).toLowerCase().includes(key));
            });
            console.log('[FLT] after search filter =', filteredTickets.length,
                filteredTickets.map(t => t.Ticket_Name__c));
        }

        this.tickets = filteredTickets.map(t => ({
            ...t,
            organizationName: t.Organization__r?.Name
                ? (t.Organization__r.Name.length > 15
                    ? t.Organization__r.Name.slice(0, 15) + '...'
                    : t.Organization__r.Name)
                : '—',
            fullOrganizationName: t.Organization__r?.Name || '—'
        }));

        this.totalRecordsTickets = this.tickets.length;
        this.totalPagesTickets = Math.ceil(this.totalRecordsTickets / this.pageSizeTickets);
        this.pageNumberTickets = 1;
        this.showNoTicketsMessage = this.tickets.length === 0;

        console.log('[FLT] FINAL shown =', this.tickets.length,
            '| pages =', this.totalPagesTickets,
            '| pageSize =', this.pageSizeTickets,
            '| names =', this.tickets.map(t => t.Ticket_Name__c));
    }

    get canEditTickets() {
        return this.isTesseractOrg;
    }

    get computedColSpan() {
        // Ticket Number, Subject, Username, Date, Priority, Assigned To, Status = 7
        let cols = 7;
        if (this.isTesseractOrg) cols += 1; // Raised By
        if (this.canEditTickets) cols += 1; // Action
        return cols;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // =====================================================
    // CHARTS
    // =====================================================

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

    handleChartFilterChange(event) {
        this.selectedChartFilter = event.detail.value;
        this.selectedDate = '';
        this.selectedOrg = '';
        this.selectedUser = '';
        this.showOrgDropdown = this.selectedChartFilter === 'raised';
        this.showUserDropdown = this.selectedChartFilter === 'assigned';
        this.showDatePicker = this.selectedChartFilter === 'date';
        this.renderChart(this.rawTickets);
    }

    handleOrgChange(event) {
        this.selectedOrg = event.detail.value;
        this.renderChart(this.rawTickets);
    }

    handleUserChange(event) {
        this.selectedUser = event.detail.value;
        this.renderChart(this.rawTickets);
    }

    handleDateChange(event) {
        this.selectedDate = event.detail.value;
        this.renderChart(this.rawTickets);
    }

    renderStatusPieChart(data) {
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
                    legend: { display: true, position: 'right' },
                    title: { display: true, text: 'Ticket Distribution by Status (Polar Area)' }
                }
            }
        });
    }

    renderChart(data = []) {
        const ctx = this.template.querySelector('canvas.chart')?.getContext('2d');
        if (!ctx || !window.Chart) return;

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

        let groupField = 'Status__c';
        if (this.selectedChartFilter === 'priority') groupField = 'Priority__c';
        if (this.selectedChartFilter === 'status') groupField = 'Status__c';

        const chartData = {};
        filtered.forEach(ticket => {
            const key = ticket[groupField] || 'Unknown';
            chartData[key] = (chartData[key] || 0) + 1;
        });

        this.chartInstance = new window.Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(chartData),
                datasets: [{
                    label: `Number of Tickets by ${groupField.replace('__c', '').replace(/_/g, ' ')}`,
                    data: Object.values(chartData),
                    backgroundColor: ['#36a2eb', '#ff6384', '#ffce56', '#4bc0c0', '#9966ff']
                }]
            },
            options: {
                responsive: true,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Ticket Breakdown by Status' }
                },
                scales: { x: { beginAtZero: true } }
            }
        });
    }

    showDashboardPanel() {
        const panel = this.template.querySelector('#dashboardPanel');
        if (panel) {
            panel.classList.add('show');
            this.renderStatusPieChart(this.rawTickets);
        }
    }

    hideDashboardPanel() {
        const panel = this.template.querySelector('#dashboardPanel');
        if (panel) panel.classList.remove('show');
    }

    handleSearchChange(event) {
        this.searchKey = (event.target.value || '').trim().toLowerCase();
        this.applyTicketFilter();
    }
}