import { LightningElement, track, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getRecord, deleteRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';

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
import getStaffNamesByUserIds from '@salesforce/apex/TSignTicketManager.getStaffNamesByUserIds';
import appendConversationEntry from '@salesforce/apex/TSignTicketManager.appendConversationEntry';
import updateResolution from '@salesforce/apex/TSignTicketManager.updateResolution';
import appendHistoryEntry from '@salesforce/apex/TSignTicketManager.appendHistoryEntry';
import appendHistoryEntries from '@salesforce/apex/TSignTicketManager.appendHistoryEntries';
import insertTicketAttachments from '@salesforce/apex/TSignTicketManager.insertTicketAttachments';
import sendTicketNotificationEmails from '@salesforce/apex/TSignTicketManager.sendTicketNotificationEmails';
import sendAssignedTicketNotificationEmails from '@salesforce/apex/TSignTicketManager.sendAssignedTicketNotificationEmails';
import sendAssignmentEmailOnStatusOnly from '@salesforce/apex/TSignTicketManager.sendAssignmentEmailOnStatusOnly';
import sendCommentOnlyEmailNotification from '@salesforce/apex/TSignTicketManager.sendCommentOnlyEmailNotification';
import sendResolvedTicketEmail from '@salesforce/apex/TSignTicketManager.sendResolvedTicketEmail';
import getContactNumberByEmail from '@salesforce/apex/TSignTicketManager.getContactNumberByEmail';
import getUsersByOrganizationName from '@salesforce/apex/TSignTicketManager.getUsersByOrganizationName';
import deleteFiles from '@salesforce/apex/tSignAwsBatchController.deleteFiles';
import getOrganisationAccountType from '@salesforce/apex/tSignAttachmentHandler.getOrganisationAccountType';
import deactivateTicketAttachment from '@salesforce/apex/TSignTicketManager.deactivateTicketAttachment';

// TSign_Ticket__c field limits
const MAX_ORG_NAME_LENGTH = 50;       // Organisation_Name__c Text(50)
const MAX_DESCRIPTION_LENGTH = 1000;  // Description__c Long Text Area(1000)

const INDIVIDUAL = 'Individual';
const UNASSIGNED_LABEL = 'T sign Support';

// ---------------------------------------------------------------
// helpers
// ---------------------------------------------------------------
const pad = n => String(n).padStart(2, '0');

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getInitials(name) {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Salesforce Ids can be 15 or 18 chars; the first 15 are what identify the record.
function sameId(a, b) {
    if (!a || !b) return false;
    return String(a).slice(0, 15) === String(b).slice(0, 15);
}

// -> { date: 'dd/mm/yyyy', time: 'hh:mm am' }
function splitDateTime(value) {
    if (!value) return { date: '', time: '' };
    const d = new Date(value);
    if (isNaN(d.getTime())) return { date: String(value), time: '' };
    const h = d.getHours();
    return {
        date: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
        time: `${pad(h % 12 || 12)}:${pad(d.getMinutes())} ${h >= 12 ? 'pm' : 'am'}`
    };
}

// Resolution__c is JSON {text, by, timestamp}. Older records can be double-nested.
function parseResolution(raw) {
    if (!raw) return null;
    try {
        const obj = JSON.parse(raw);
        let text = obj?.text ?? '';
        if (typeof text === 'string' && text.trim().startsWith('{')) {
            try {
                text = JSON.parse(text).text || text;
            } catch (e) {
                // keep outer text
            }
        }
        return { text, by: obj?.by || '', timestamp: obj?.timestamp || '' };
    } catch (e) {
        return { text: raw, by: '', timestamp: '' };
    }
}

function iconForExtension(ext) {
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'doctype:image';
    if (ext === 'pdf') return 'doctype:pdf';
    if (['doc', 'docx'].includes(ext)) return 'doctype:word';
    if (['xls', 'xlsx'].includes(ext)) return 'doctype:excel';
    if (ext === 'txt') return 'doctype:txt';
    return 'doctype:attachment';
}

function parseAws(json) {
    try {
        return JSON.parse(json || '{}');
    } catch (e) {
        console.error('Invalid Awsjson__c:', e);
        return {};
    }
}

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

function emptyTicket(orgName = '') {
    return {
        Organisation_Name__c: orgName,
        Submitted_By__c: '',
        User_Name__c: '',
        Email_ID__c: '',
        Contact_Number__c: '',
        Date_Of_Issue__c: '',
        Priority__c: '',
        Module__c: '',
        Category__c: '',
        Platform__c: '',
        Status__c: 'Open',
        Organization__c: '',
        Subject__c: '',
        Description__c: ''
    };
}

export default class TSignTicketManager extends LightningElement {

    @api orgid;
    @api staffId;

    // ---------- ticket form ----------
    @track ticket = emptyTicket();
    @track selectedUserId = '';
    @track orgUsers = [];
    @track showUserDetails = false;
    @track showCreateTicketForm = false;   // true = "Create New Ticket" modal is open
    @track isSubmitting = false;

    // ---------- list ----------
    @track tickets = [];
    @track rawTickets = [];
    @track showNoTicketsMessage = false;
    @track selectedFilter = 'Submitted';
    @track selectedPriority = '';
    @track isHome = true;
    @track showUpgradeModal = false;

    // ---------- current user ----------
    @track currentUserType = '';
    @track currentUserEmail = '';
    @track currentUserName = '';
    @track currentUserRole = '';
    @track currentTypeOfUser = '';
    @track currentUserOrgId = '';   // User.TSign_Org_Id__c
    @track currentUserOrgName = ''; // resolved from TSign_Organisation__c.Name
    @track IsItSupport = '';
    @track isTesseractOrg = false; // true when the viewer is Tesseract IT support
    @track myContactNumber = '';
    @track orgName;

    // ---------- picklists ----------
    categoryOptions = [];
    platformOptions = [];
    priorityOptions = [];
    submittedByOptions = [];
    @track moduleValuesRaw = [];
    @track statusOptions = [];
    @track ticketingMembers = [];

    // ---------- pagination ----------
    @track pageNumberTickets = 1;
    @track pageSizeTickets = 10;
    @track totalRecordsTickets = 0;
    @track totalPagesTickets = 0;
    @track pageSizeOptions = [10, 20, 50];

    // ---------- edit popup ----------
    @track showEditPopup = false;
    @track editTicket = {};

    // ---------- detail popup ----------
    @track showTicketPopup = false;
    @track selectedTicket = {};
    @track descriptionfromTicket = '';
    @track showTicketInfo = true;
    @track showConversation = false;
    @track showResolution = false;
    @track showAttachment = false;
    @track showApproval = false;
    @track showHistory = false;

    // conversation
    @track newMessage = '';
    @track showMessageInput = false;
    @track noConversations = false;

    // resolution
    @track resolutionInput = '';
    @track showResolutionInput = false;
    @track resolutionSubmittedBy = '';
    @track resolutionInitials = '';
    @track resolutionDate = '';
    @track resolutionTime = '';
    previousResolutionText = null;

    // attachments
    @track postAttachments = [];
    @track uploadcontainer = false;
    @track uploadedFiles1 = [];   // files uploaded to S3 and not yet saved to Salesforce
    postupload = false;           // true while the Attachment tab is the upload target
    attachmentid = '';
    key = '';
    isEditingPostAttachment = false;
    isSavingPostAttachment = false;
    isDeletingPostAttachment = false;  // guards against double click on delete icon
    savedPostKeys = new Set();    // keys already saved, protects against repeated upload events

    ticketReqId = 0;
    @track searchKey = '';
    @track accountType = '';

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
        if (data) this.moduleValuesRaw = data.values;
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
        if (data) this.platformOptions = data.values;
    }

    @wire(getRecord, {
        recordId: USER_ID,
        fields: [
            'User.User_Type__c', 'User.Type_of_User__c', 'User.Email', 'User.Name',
            'User.User_Role__c', 'User.IT_Support__c', 'User.TSign_Org_Id__c'
        ]
    })
    wiredUser({ error, data }) {
        if (data) {
            const f = data.fields;
            this.currentUserType = f.User_Type__c.value;
            this.currentTypeOfUser = f.Type_of_User__c.value;
            this.currentUserEmail = f.Email.value;
            this.currentUserName = f.Name.value;
            this.currentUserRole = f.User_Role__c.value;
            this.IsItSupport = f.IT_Support__c.value;
            this.currentUserOrgId = f.TSign_Org_Id__c.value;
            this.isTesseractOrg = this.IsItSupport === 'Yes';

            this.loadCurrentUserOrgName(this.currentUserOrgId);

            if (this.isTesseractOrg && !this.ticketingMembers.length) {
                this.loadSupportAgents();
            }
            this.resolutionInitials = getInitials(this.currentUserName);

            // user info can arrive after the tickets
            this.applyTicketFilter();
        } else if (error) {
            console.error('Error fetching user info:', error);
        }
    }

    async loadTickets() {
        if (!this.orgid) return;
        const reqId = ++this.ticketReqId;
        try {
            const data = await getTickets({ orgId: this.orgid, orgName: this.orgName });

            const userIds = [...new Set(data.map(t => t.Assigned_To__c).filter(Boolean))];
            let staffNames = {};
            if (userIds.length) {
                try {
                    staffNames = await getStaffNamesByUserIds({ userIds });
                } catch (e) {
                    console.error('[TKT] staff names error =', JSON.stringify(e));
                }
            }

            // a newer request started while this one was waiting: drop this result
            if (reqId !== this.ticketReqId) return;

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

    connectedCallback() {
        if (!this.orgid) return;

        getOrganisationAccountType({ orgId: this.orgid })
            .then(type => { this.accountType = type || ''; })
            .catch(e => console.error('Error fetching account type:', e));

        getOrgNameById({ orgid: this.orgid })
            .then(name => {
                this.ticket.Organisation_Name__c = name;
                this.orgName = name;
                this.loadTickets();
            })
            .catch(e => console.error('Error fetching organization name:', e));

        getStatusPicklistValues()
            .then(values => {
                this.statusOptions = values.map(v => ({ label: v, value: v }));
            })
            .catch(e => console.error('Error fetching status picklist values:', e));
    }

    // The user's org name is not stored on User. Resolve it from
    // User.TSign_Org_Id__c -> TSign_Organisation__c.Name
    loadCurrentUserOrgName(orgId) {
        if (!orgId) {
            this.currentUserOrgName = '';
            return;
        }
        // same org as the page: reuse the name already fetched in connectedCallback
        if (sameId(orgId, this.orgid) && this.orgName) {
            this.currentUserOrgName = this.orgName;
            return;
        }
        getOrgNameById({ orgid: orgId })
            .then(name => { this.currentUserOrgName = name || ''; })
            .catch(e => console.error('Error fetching current user org name:', e));
    }

    // assignee list for the edit popup (Tesseract support only)
    loadSupportAgents() {
        getSupportAgents()
            .then(users => {
                this.ticketingMembers = users.map(u => ({
                    label: u.staffName,
                    value: u.userId,
                    email: u.email
                }));
            })
            .catch(e => console.error('Error fetching support agents:', e));
    }

    closeUpgradeModal() {
        this.showUpgradeModal = false;
    }

    // =====================================================
    // GETTERS
    // =====================================================

    get isAdmin() {
        return ['CEO', 'Portal Account Partner Executive', 'TSign Portal Account Partner Executive'].includes(this.currentUserRole) &&
               ['Support', 'T Sign Org Admin'].includes(this.currentUserType);
    }

    // Only Tesseract support edits tickets (all tickets are external).
    get canEditTickets() {
        return this.isTesseractOrg;
    }

    get filterOptions() {
        if (this.isTesseractOrg) {
            return [
                { label: 'All Tickets', value: 'All' },
                { label: 'My Tickets', value: 'Assigned' },
                { label: 'My Requests', value: 'Submitted' },
                { label: 'Resolved', value: 'Resolved' }
            ];
        }
        if (this.isAdmin) {
            return [
                { label: 'All Tickets', value: 'All' },
                { label: 'My Requests', value: 'Submitted' },
                { label: 'Resolved', value: 'Resolved' }
            ];
        }
        return [
            { label: 'My Requests', value: 'Submitted' },
            { label: 'Resolved', value: 'Resolved' }
        ];
    }

    get ticketTableClass() {
        return this.isTesseractOrg
            ? 'table-container ticketTable full'
            : 'table-container ticketTable no-action';
    }

    get paginatedTickets() {
        const start = (this.pageNumberTickets - 1) * this.pageSizeTickets;
        const end = start + this.pageSizeTickets;

        return this.tickets.slice(start, end).map(t => ({
            ...t,
            formattedDateOfIssue: this.formatDate(t.Date_Of_Issue__c),
            showEdit: this.isTesseractOrg,
            priorityClass: this.getPriorityClass(t.Priority__c),
            statusClass: this.getStatusClass(t.Status__c),
            assignedDisplay: this.getAssignedDisplay(t)
        }));
    }

    get bDisableFirst() { return this.pageNumberTickets <= 1; }
    get bDisableLast() { return this.pageNumberTickets >= this.totalPagesTickets; }
    get pageNumber() { return this.pageNumberTickets; }
    get totalPages() { return this.totalPagesTickets; }
    get totalRecords() { return this.totalRecordsTickets; }

    get ticketTabClass() { return this.showTicketInfo ? 'overview-tab active' : 'overview-tab'; }
    get conversationTabClass() { return this.showConversation ? 'overview-tab active' : 'overview-tab'; }
    get resolutionTabClass() { return this.showResolution ? 'overview-tab active' : 'overview-tab'; }
    get attachmentTabClass() { return this.showAttachment ? 'overview-tab active' : 'overview-tab'; }
    get approvalTabClass() { return this.showApproval ? 'overview-tab active' : 'overview-tab'; }
    get historyTabClass() { return this.showHistory ? 'overview-tab active' : 'overview-tab'; }

    get showAddResolutionButton() {
        return !this.resolutionInput && !this.showResolutionInput;
    }

    // true when the upload box was opened over existing post attachments (edit), so Cancel makes sense
    get hasPostAttachments() {
        return this.postAttachments.length > 0;
    }

    // non-post attachments shown in Ticket Info
    get uploadedFileDetails() {
        const rows = this.selectedTicket?.TSign_Ticket_Attachments__r || [];
        return rows
            .filter(att => !att.post_attachment__c)
            .map(att => {
                const aws = parseAws(att.Awsjson__c);
                const filename = att.File_Name__c || aws.originalName || 'Unknown';
                const ext = filename.split('.').pop().toLowerCase();
                return {
                    id: att.Id,
                    url: aws.url || '',
                    filename,
                    iconName: iconForExtension(ext),
                    size: aws.size || ''
                };
            });
    }

    get groupedHistory() {
        let logs = [];
        try {
            logs = JSON.parse(this.selectedTicket?.History_log__c || '[]');
        } catch (e) {
            logs = [];
        }

        const grouped = new Map();
        logs.forEach((entry, i) => {
            const dt = new Date(entry.timestamp);
            const valid = !isNaN(dt.getTime());
            const dateLabel = valid
                ? dt.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
                : String(entry.timestamp || '');
            const timeLabel = valid
                ? dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true })
                : '';

            if (!grouped.has(dateLabel)) grouped.set(dateLabel, []);
            grouped.get(dateLabel).push({
                id: `${entry.timestamp}-${i}`,
                user: entry.user,
                actionType: entry.actionType,
                content: entry.content,
                initials: getInitials(entry.user),
                time: timeLabel
            });
        });
        return [...grouped.entries()].map(([date, entries]) => ({ date, entries }));
    }

    // =====================================================
    // LIST: FILTER / PAGINATION / DISPLAY
    // =====================================================

    handleFilterChange(event) {
        this.selectedFilter = event.detail.value;
        this.applyTicketFilter();
    }

    handlePriorityFilterChange(event) {
        this.selectedPriority = event.detail.value;
        this.applyTicketFilter();
    }

    applyTicketFilter() {
        let list;
        switch (this.selectedFilter) {
            case 'All':
                list = this.rawTickets.filter(t => t.Status__c !== 'Resolved');
                break;
            case 'Assigned':
                list = this.rawTickets.filter(t =>
                    t.Status__c !== 'Resolved' && t.Assigned_To__r?.Email === this.currentUserEmail);
                break;
            case 'Submitted':
                list = this.rawTickets.filter(t =>
                    t.Status__c !== 'Resolved' && t.Belong_To__r?.Email === this.currentUserEmail);
                break;
            case 'Resolved':
                list = this.rawTickets.filter(t =>
                    t.Status__c === 'Resolved' &&
                    (this.isTesseractOrg || this.isAdmin || t.Belong_To__r?.Email === this.currentUserEmail));
                break;
            default:
                list = [];
        }

        if (this.selectedPriority) {
            list = list.filter(t => t.Priority__c === this.selectedPriority);
        }

        if (this.searchKey) {
            const key = this.searchKey;
            list = list.filter(t => {
                const searchable = [
                    t.Ticket_Name__c,
                    t.Subject__c,
                    t.User_Name__c,
                    t.Priority__c,
                    t.Status__c,
                    // same value the Assigned to column shows
                    this.getAssignedDisplay(t),
                    // "Raised By" column, only visible to Tesseract support
                    this.isTesseractOrg ? t.Organization__r?.Name : null
                ];
                return searchable.some(v => v && String(v).toLowerCase().includes(key));
            });
        }

        this.tickets = list.map(t => {
            const fullName = t.Organization__r?.Name || '';
            return {
                ...t,
                organizationName: fullName ? (fullName.length > 15 ? fullName.slice(0, 15) + '...' : fullName) : '—',
                fullOrganizationName: fullName || '—'
            };
        });

        this.totalRecordsTickets = this.tickets.length;
        this.totalPagesTickets = Math.ceil(this.totalRecordsTickets / this.pageSizeTickets);
        this.pageNumberTickets = 1;
        this.showNoTicketsMessage = this.tickets.length === 0;
    }

    handleRecordsPerPageTickets(event) {
        this.pageSizeTickets = parseInt(event.target.value, 10);
        this.totalPagesTickets = Math.ceil(this.totalRecordsTickets / this.pageSizeTickets);
        this.pageNumberTickets = 1;
    }
    nextPageTickets() { if (this.pageNumberTickets < this.totalPagesTickets) this.pageNumberTickets++; }
    previousPageTickets() { if (this.pageNumberTickets > 1) this.pageNumberTickets--; }
    firstPageTickets() { this.pageNumberTickets = 1; }
    lastPageTickets() { this.pageNumberTickets = this.totalPagesTickets; }

    closeTicketPanel() {
        this.dispatchEvent(new CustomEvent('closeticket', { bubbles: true, composed: true }));
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateString);
        if (m) return `${m[3]}/${m[2]}/${m[1]}`; // avoid timezone shifts for plain dates
        const d = new Date(dateString);
        return isNaN(d.getTime()) ? '' : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    }

    getPriorityClass(priority) {
        switch (priority) {
            case 'Critical':
            case 'High': return 'status-pill priority-high';
            case 'Medium': return 'status-pill priority-medium';
            case 'Low': return 'status-pill priority-low';
            default: return 'status-pill status-secondary';
        }
    }

    getStatusClass(status) {
        switch (status) {
            case 'In Progress': return 'status-pill status-inprogress';
            case 'Open': return 'status-pill status-open';
            case 'Resolved':
            case 'Closed': return 'status-pill status-closed';
            case 'Rejected': return 'status-pill status-danger';
            default: return 'status-pill status-secondary';
        }
    }

    // =====================================================
    // CREATE TICKET (centered modal)
    // =====================================================

    async handleNewTicketClick() {
        const now = new Date();

        this.ticket = {
            ...this.ticket,
            Date_Of_Issue__c: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
        };

        this.uploadedFiles1 = [];
        this.postupload = false;
        this.isEditingPostAttachment = false;
        this.showCreateTicketForm = true;

        if (this.isIndividualAccount) {
            await this.applySelfSubmitter();
        }
    }

    async handleInputChange(event) {
        const field = event.target.dataset.field;
        const value = event.target.value;
        if (!field) return;

        if (field !== 'Submitted_By__c') {
            this.ticket = { ...this.ticket, [field]: value };
            return;
        }

        this.selectedUserId = '';

        if (value === 'Self') {
            await this.applySelfSubmitter();
            return;
        }

        // On Behalf Of
        this.showUserDetails = true;
        this.ticket = {
            ...this.ticket,
            Submitted_By__c: value,
            User_Name__c: '',
            Email_ID__c: '',
            Contact_Number__c: ''
        };

        if (value === 'On Behalf Of') {
            this.orgUsers = [];
            if (!this.orgid) {
                console.warn('[OBO] orgid EMPTY → no users loaded');
                return;
            }

            getUsersByOrganizationName({ orgId: this.orgid })
                .then(users => {
                    this.orgUsers = (users || [])
                        .filter(u => !sameId(u.userId, USER_ID))
                        .map(u => ({
                            label: u.name,
                            value: u.userId,
                            email: u.email || '',
                            phone: u.phone || ''
                        }));
                })
                .catch(e => console.error('Error fetching users from org:', JSON.stringify(e)));
        }
    }

    async handleUserSelect(event) {
        const userId = event.detail.value;
        this.selectedUserId = userId;

        const selected = this.orgUsers.find(u => u.value === userId);
        if (!selected) return;

        this.ticket = {
            ...this.ticket,
            User_Name__c: selected.label,
            Email_ID__c: selected.email || '',
            Contact_Number__c: selected.phone || ''
        };

        // fallback: phone empty → look up by email
        if (!selected.phone && selected.email) {
            const phone = await this.fetchContactNumber(selected.email);
            if (this.selectedUserId === userId) {   // user may have switched meanwhile
                this.ticket = { ...this.ticket, Contact_Number__c: phone || '' };
            }
        }
    }

    // validateFields() {
    //     const required = [
    //         ['Organisation_Name__c', 'Organization Name'],
    //         ['Submitted_By__c', 'Submitted By'],
    //         ['User_Name__c', 'User Name'],
    //         ['Email_ID__c', 'Email ID'],
    //         ['Contact_Number__c', 'Contact Number'],
    //         ['Date_Of_Issue__c', 'Date Of Issue'],
    //         ['Priority__c', 'Priority'],
    //         ['Module__c', 'Module'],
    //         ['Category__c', 'Category'],
    //         ['Platform__c', 'Platform'],
    //         ['Subject__c', 'Subject'],
    //         ['Description__c', 'Description']
    //     ];
    //     return required.filter(([field]) => !this.ticket[field]).map(([, label]) => label);
    // }

    // for the current account type, so Individual/Self users are never asked about hidden fields.
    validateFields() {
        const checks = [
            { field: 'Submitted_By__c',  label: 'Submitted By',   applies: !this.shouldHideSubmittedBy },
            { field: 'User_Name__c',     label: 'User Name',      applies: this.showUserDetails },
            { field: 'Email_ID__c',      label: 'Email ID',       applies: this.showUserDetails },
            { field: 'Contact_Number__c',label: 'Contact Number', applies: true },
            { field: 'Date_Of_Issue__c', label: 'Date Of Issue',  applies: true },
            { field: 'Priority__c',      label: 'Priority',       applies: true },
            { field: 'Module__c',        label: 'Module',         applies: true },
            { field: 'Category__c',      label: 'Category',       applies: true },
            { field: 'Platform__c',      label: 'Platform',       applies: true },
            { field: 'Subject__c',       label: 'Subject',        applies: true },
            { field: 'Description__c',   label: 'Description',    applies: true }
        ];

        const firstMissing = checks.find(c => c.applies && !(this.ticket[c.field] || '').toString().trim());
        return firstMissing || null;   // { field, label } or null
    }

    focusField(field) {
        const el = this.template.querySelector(`[data-field="${field}"]`);
        if (el && typeof el.focus === 'function') {
            el.focus();
        }
    }

    generateTicketInfo() {
        const now = new Date();
        const dateStr = `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}`; // ddmmyyyy
        const seq = String(Math.floor(1000 + Math.random() * 9000));
        return {
            name: `TKT-${dateStr}-${seq}`,
            number: parseInt(`${dateStr}${seq}`, 10)
        };
    }

    async submitTicket() {
        if (this.isSubmitting) return;

        const missing = this.validateFields();
        if (missing) {
            this.showToast('Required Field Missing', `Please fill in ${missing.label}.`, 'error');
            this.focusField(missing.field);
            return;
        }

        // const missing = this.validateFields();
        // if (missing.length) {
        //     this.showToast('Missing Required Fields', `Please fill in the following fields: ${missing.join(', ')}`, 'error');
        //     return;
        // }

        if ((this.ticket.Description__c || '').length > MAX_DESCRIPTION_LENGTH) {
            this.showToast('Description too long', `Description can be at most ${MAX_DESCRIPTION_LENGTH} characters.`, 'error');
            return;
        }

        const info = this.generateTicketInfo();
        const belongTo = (this.ticket.Submitted_By__c === 'On Behalf Of' && this.selectedUserId)
            ? this.selectedUserId
            : USER_ID;

        const payload = {
            ...this.ticket,
            // TSign_Ticket__c.Organisation_Name__c is Text(50)
            Organisation_Name__c: (this.ticket.Organisation_Name__c || '').slice(0, MAX_ORG_NAME_LENGTH),
            Ticket_Name__c: info.name,
            Ticket_generated_number__c: info.number,
            Organization__c: this.orgid,
            Belong_To__c: belongTo
        };

        this.isSubmitting = true;
        try {
            const created = await createTicket({ ticket: payload });
            const ticketId = created?.Id;

            if (ticketId) {
                if (this.uploadedFiles1.length) {
                    await insertTicketAttachments({
                        ticketId,
                        Awsjson: JSON.stringify(toAwsPayload(this.uploadedFiles1)),
                        postattachment: false,
                        attachmentid: null
                    });
                }

                // email / history failures must not hide the fact that the ticket exists
                try {
                    await Promise.all([
                        sendTicketNotificationEmails({ ticketId }),
                        appendHistoryEntry({
                            ticketId,
                            actionType: 'Ticket Created',
                            content: `Ticket ${info.name} created.`
                        })
                    ]);
                } catch (e) {
                    console.error('Ticket created but email/history failed:', e);
                }
            }

            this.showToast('Success', 'Ticket submitted and notifications sent!', 'success');
            this.resetForm();
            await this.loadTickets();
        } catch (error) {
            console.error('Error in ticket submission flow:', JSON.stringify(error));
            this.showToast('Error', error?.body?.message || 'An error occurred while saving the ticket.', 'error');
        } finally {
            this.isSubmitting = false;
        }
    }

    resetForm() {
        this.showCreateTicketForm = false;
        this.showUserDetails = false;
        this.selectedUserId = '';
        this.ticket = emptyTicket(this.ticket.Organisation_Name__c);
        this.uploadedFiles1 = [];
    }

    // Cancel on the create modal: files already in S3 would be orphaned, so remove them
    handleCancelCreate() {
        this.uploadedFiles1.forEach(f => this.deleteFile(f.key));
        this.resetForm();
    }

    // =====================================================
    // EDIT POPUP (Tesseract support)
    // =====================================================

    openEditPopup(event) {
        const ticket = this.tickets.find(t => t.Id === event.currentTarget.dataset.id);
        if (!ticket) return;
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
        this.editTicket = { ...this.editTicket, [event.target.name]: event.detail.value };
    }

    async saveTicketEdits() {
        const ticketId = this.editTicket.Id;
        const old = this.selectedTicket;
        const newAssignee = this.editTicket.Assigned_To__c || null;
        const newStatus = this.editTicket.Status__c;
        const comment = this.editTicket.commentText?.trim();

        const assignmentChanged = (old.Assigned_To__c || null) !== newAssignee;
        const statusChanged = old.Status__c !== newStatus;
        const commentAdded = !!comment;
        const resolvedNow = statusChanged && newStatus === 'Resolved';
        const assigneeExists = !!newAssignee;

        const nameOf = id => this.ticketingMembers.find(m => m.value === id)?.label || 'Unassigned';
        const changes = [];
        if (assignmentChanged) {
            changes.push({
                actionType: 'Assignment Changed',
                content: `Assigned changed from ${nameOf(old.Assigned_To__c)} to ${nameOf(newAssignee)}`
            });
        }
        if (statusChanged) {
            changes.push({
                actionType: 'Status Updated',
                content: `Status changed from ${old.Status__c} to ${newStatus}`
            });
        }
        if (commentAdded) {
            changes.push({ actionType: 'Comment Added', content: comment });
        }

        try {
            await updateTicket({
                updatedTicket: { Id: ticketId, Assigned_To__c: newAssignee, Status__c: newStatus }
            });
            this.closeEditPopup();

            if (changes.length) {
                await appendHistoryEntries({ ticketId, changes });
            }

            // one notification to the assignee, by priority: assignment > status > comment
            try {
                if (assigneeExists) {
                    if (assignmentChanged) {
                        await sendAssignedTicketNotificationEmails({ ticketId });
                    } else if (statusChanged) {
                        await sendAssignmentEmailOnStatusOnly({ ticketId });
                    } else if (commentAdded) {
                        await sendCommentOnlyEmailNotification({ ticketId, commentText: comment });
                    }
                }
                if (resolvedNow) {
                    await sendResolvedTicketEmail({ ticketId });
                }
            } catch (e) {
                console.error('Ticket updated but notification failed:', e);
            }

            await this.loadTickets();
            this.showToast('Success', 'Ticket updated successfully!', 'success');
        } catch (error) {
            const msg = error?.body?.message || error?.message || JSON.stringify(error);
            console.error('Error updating ticket:', msg);
            this.showToast('Error', msg, 'error');
        }
    }

    // =====================================================
    // TICKET DETAIL POPUP
    // =====================================================

    decorateTicket(result) {
        return {
            ...result,
            formattedDateOfIssue: this.formatDate(result.Date_Of_Issue__c),
            moduleDisplay: result.Module__c === 'Repository' ? 'Documents' : result.Module__c
        };
    }

    async reloadSelectedTicket() {
        const result = await getTicketDetailsById({ ticketId: this.selectedTicket.Id });
        this.selectedTicket = this.decorateTicket(result);
        return this.selectedTicket;
    }

    async handleTicketClick(event) {
        const ticketId = event.currentTarget.dataset.id;
        try {
            const result = await getTicketDetailsById({ ticketId });
            this.selectedTicket = this.decorateTicket(result);
            this.descriptionfromTicket = result.Description__c;

            this.resetTabs();
            this.showTicketInfo = true;
            this.resolutionInput = '';
            this.showResolutionInput = false;
            this.showTicketPopup = true;
        } catch (error) {
            console.error('Error fetching ticket details:', error);
            this.showToast('Error', 'Failed to load ticket details.', 'error');
        }
    }

    closeTicketPopup() {
        this.showTicketPopup = false;
        this.selectedTicket = {};
        this.resetTabs();
        this.resolutionInput = '';
        this.showResolutionInput = false;
        this.newMessage = '';
        this.showMessageInput = false;
        this.postupload = false;
        this.isEditingPostAttachment = false;
        this.uploadedFiles1 = [];
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

    showTicketInfoTab() {
        this.resetTabs();
        this.showTicketInfo = true;
    }

    // ---------- Interactions ----------

    async showConversationTab() {
        this.resetTabs();
        this.showConversation = true;
        try {
            await this.reloadSelectedTicket();
        } catch (err) {
            console.error('Error fetching fresh data for Interactions tab:', err);
        }
        this.renderConversationUI();
    }

    renderConversationUI() {
        let messages = [];
        try {
            messages = JSON.parse(this.selectedTicket.Conversations__c || '[]');
        } catch (e) {
            console.warn('Failed to parse conversations:', e);
        }
        this.noConversations = messages.length === 0;

        // wait for LWC to render the container (lwc:dom="manual")
        setTimeout(() => {
            const container = this.template.querySelector('.conversation-content');
            if (!container) return;
            container.innerHTML = '';

            messages.forEach(entry => {
                const { date, time } = splitDateTime(entry.timestamp);
                const div = document.createElement('div');
                div.className = 'message-block';
                div.innerHTML = `
                    <div class="message-header">
                        <div class="avatar-circle">${escapeHtml(getInitials(entry.sender))}</div>
                        <div class="sender-details">
                            <div class="sender-row">
                                <strong class="sender-name">${escapeHtml(entry.sender)}</strong>
                                <div class="conversation-timestamp">
                                    <div class="conversation-date">${escapeHtml(date)}</div>
                                    <div class="conversation-time">${escapeHtml(time)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="message-body">${escapeHtml(entry.message)}</div>`;
                container.appendChild(div);
            });
        }, 0);
    }

    toggleMessageInput() {
        this.showMessageInput = true;
    }

    handleNewMessageInput(event) {
        this.newMessage = event.target.value;
    }

    async sendMessageToConversation() {
        const message = this.newMessage?.trim();
        if (!message) return;

        try {
            await appendConversationEntry({
                ticketId: this.selectedTicket.Id,
                sender: this.currentUserName || 'User',
                timestamp: new Date().toISOString(),
                message
            });

            this.newMessage = '';
            this.showMessageInput = false;

            await this.appendToHistory('Conversation', message);
            await this.reloadSelectedTicket();
            this.renderConversationUI();
        } catch (error) {
            console.error('Error in message send flow:', error);
            this.showToast('Error', 'Failed to send message.', 'error');
        }
    }

    // ---------- Resolution ----------

    showResolutionTab() {
        this.resetTabs();
        this.showResolution = true;
        this.showResolutionInput = false;
        this.applyResolutionFromTicket();
    }

    applyResolutionFromTicket() {
        const res = parseResolution(this.selectedTicket?.Resolution__c);
        if (!res) {
            this.resolutionInput = '';
            this.resolutionSubmittedBy = '';
            this.resolutionInitials = '';
            this.resolutionDate = '';
            this.resolutionTime = '';
            return;
        }
        const by = res.by || this.currentUserName;
        const { date, time } = splitDateTime(res.timestamp);
        this.resolutionInput = res.text;
        this.resolutionSubmittedBy = by;
        this.resolutionInitials = getInitials(by);
        this.resolutionDate = date;
        this.resolutionTime = time;
    }

    showResolutionInputField() {
        this.showResolutionInput = true;
    }

    handleResolutionChange(event) {
        this.resolutionInput = event.detail.value;
    }

    async saveResolution() {
        const text = this.resolutionInput?.trim();
        if (!text) return;

        const actionType = this.previousResolutionText ? 'Resolution Edited' : 'Resolution Added';

        try {
            await updateResolution({ ticketId: this.selectedTicket.Id, resolutionText: text });
            await this.reloadSelectedTicket();
            this.applyResolutionFromTicket();
            this.showResolutionInput = false;
            this.previousResolutionText = null;

            this.showToast('Success', 'Resolution saved successfully', 'success');
            this.appendToHistory(actionType, text);
        } catch (error) {
            console.error('Error updating resolution:', error);
            this.showToast('Error', 'Failed to save resolution', 'error');
        }
    }

    editResolution() {
        const res = parseResolution(this.selectedTicket?.Resolution__c);
        const text = res?.text || '';
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
        this.previousResolutionText = null;
    }

    async deleteResolution() {
        const previousText = this.resolutionInput;
        try {
            await updateResolution({ ticketId: this.selectedTicket.Id, resolutionText: '' });
            this.selectedTicket = { ...this.selectedTicket, Resolution__c: null };
            this.resolutionInput = '';
            this.showResolutionInput = false;

            this.showToast('Deleted', 'Resolution removed successfully', 'info');
            if (previousText) this.appendToHistory('Resolution Deleted', previousText);
        } catch (error) {
            console.error('Error deleting resolution:', error);
            this.showToast('Error', 'Failed to delete resolution', 'error');
        }
    }

    showResolutionActions(event) {
        const icons = event.currentTarget.querySelector('.resolution-actions');
        if (icons) icons.style.display = 'inline-flex';
    }

    hideResolutionActions(event) {
        const icons = event.currentTarget.querySelector('.resolution-actions');
        if (icons) icons.style.display = 'none';
    }

    // ---------- History (JSON in History_log__c) ----------

    async showHistoryTab() {
        this.resetTabs();
        this.showHistory = true;
        try {
            await this.reloadSelectedTicket(); // pick up latest History_log__c
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    async appendToHistory(actionType, content) {
        try {
            await appendHistoryEntry({ ticketId: this.selectedTicket.Id, actionType, content });
            if (this.showHistory) await this.reloadSelectedTicket();
        } catch (error) {
            console.error('Error appending history:', error?.body?.message || JSON.stringify(error));
        }
    }

    // ---------- Post attachments (TSign_Ticket_Attachment__c, post_attachment__c = true) ----------

    async showAttachmentTab() {
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
            const aws = parseAws(att.Awsjson__c);
            const filename = att.File_Name__c || aws.originalName || 'Unknown';
            const ext = filename.split('.').pop().toLowerCase();
            return {
                id: att.Id,
                url: aws.url || '',
                key: aws.key || att.key__c || '',
                filename,
                iconName: iconForExtension(ext)
            };
        });

        if (!this.postAttachments.length) {
            this.uploadcontainer = true;
        }
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
            await this.showAttachmentTab();

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

    // Delete icon click: deletes straight away, no confirm popup.
    async deletePostAttachment(event) {
        if (this.isDeletingPostAttachment) return;

        const { id, filename } = event.currentTarget.dataset;
        if (!id) return;

        this.isDeletingPostAttachment = true;
        try {
            await deactivateTicketAttachment({ attachmentId: id });   // soft delete, S3 file stays
            await this.reloadSelectedTicket();                        // returns only Active__c = true
            await this.showAttachmentTab();
            this.showToast('Success', 'Attachment deleted successfully', 'success');
            this.appendToHistory('Post Attachment Deleted', filename);
        } catch (error) {
            console.error('Delete Error:', error);
            this.showToast('Error', 'Failed to delete post attachment.', 'error');
        } finally {
            this.isDeletingPostAttachment = false;
        }
    }
    // =====================================================
    // FILE UPLOAD (c-t-signaws-batch-lwc, shared by create modal and post attachments)
    // Formats, max size (50 MB) and the S3 base path come from the AWS config "TSign_Ticket".
    // =====================================================

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

        // Create modal: child re-uploads its whole list with new keys on every add.
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

    // child sends 2 shapes: array of remaining files (handleDelete), or { deletedKeys } (deleteFilesFromAwsJson)
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

    async deleteFile(key) {
        if (!key) return;
        try {
            // Apex deleteFiles returns debug info instead of throwing on HTTP errors
            const result = await deleteFiles({ keys: [key] });
            if (result?.debugError) {
                console.error('[DELETE] failed:', result.debugError, result.debugResponse);
            }
        } catch (e) {
            console.error('[DELETE] error', e);
        }
    }

    // =====================================================
    // MISC
    // =====================================================

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    async fetchContactNumber(email) {
        if (!email) return '';
        try {
            const res = await getContactNumberByEmail({ email });
            return res || '';
        } catch (e) {
            console.error('[PHONE] apex error =', JSON.stringify(e));
            return '';
        }
    }

    handleSearchChange(event) {
        this.searchKey = (event.target.value || '').trim().toLowerCase();
        this.applyTicketFilter();
    }

    get isIndividualAccount() {
        return this.accountType === INDIVIDUAL;
    }

    // Individual: Submitted by fixed to Self
    get isSubmittedByLocked() {
        return this.isIndividualAccount;
    }

    get shouldHideMyOrganisation() {
        return this.accountType === 'Individual' ||
            this.currentUserType === 'T Sign Manager';
    }

    get moduleOptions() {
        if (this.shouldHideMyOrganisation) {
            return this.moduleValuesRaw.filter(
                option => option.value !== 'My Organisation'
            );
        }

        return this.moduleValuesRaw;
    }

    async applySelfSubmitter() {
        this.selectedUserId = '';
        this.showUserDetails = false;

        this.ticket = {
            ...this.ticket,
            Submitted_By__c: 'Self',
            User_Name__c: this.currentUserName,
            Email_ID__c: this.currentUserEmail,
            Contact_Number__c: this.myContactNumber || ''
        };

        // Fetch contact number if it is not already available
        if (!this.myContactNumber && this.currentUserEmail) {
            const phone = await this.fetchContactNumber(this.currentUserEmail);

            this.myContactNumber = phone || '';

            this.ticket = {
                ...this.ticket,
                Submitted_By__c: 'Self',
                Contact_Number__c: this.myContactNumber
            };
        }
    }

    get shouldHideSubmittedBy() {
        return this.isIndividualAccount;
    }

    getAssignedDisplay(t) {
        if (!t.Assigned_To__c) return UNASSIGNED_LABEL;
        const sameOrg = sameId(t.Assigned_To__r?.TSign_Org_Id__c, this.currentUserOrgId);
        return (this.isTesseractOrg || sameOrg)
            ? (t.staffName || t.Assigned_To__r?.Name || '-')
            : 'T sign Support';
    }
}