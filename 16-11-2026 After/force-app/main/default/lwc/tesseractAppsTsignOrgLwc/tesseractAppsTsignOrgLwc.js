import { LightningElement, track } from 'lwc';
import getTeamSizeDetails from '@salesforce/apex/TsignUserManagementController.getTeamSizeDetails';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const ACTIVE_TAB_STORAGE_KEY = 'tsignActiveTab';
const DEFAULT_TAB = 'organisation';

export default class TesseractAppsTsignOrgLwc extends LightningElement {
    @track activeTab = DEFAULT_TAB; // single source of truth
    @track isCreateUser = false;
    @track activeUserCount = 0;
    @track teamSizeLimit = 0;

    async connectedCallback() {
        console.log('Tsign organisation called');

        // 1. Restore activeTab from localStorage (if present)
        this.restoreActiveTab();

        // ... your other load methods
        this.fetchTeamSizeData();
    }

    /**
     * Reads activeTab from localStorage and validates it.
     * Falls back to the default tab if nothing valid is stored.
     */
    restoreActiveTab() {
        try {
            const storedTab = window.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
            if (storedTab) {
                const validTabs = ['organisation', 'facility', 'userManagement'];
                if (validTabs.includes(storedTab)) {
                    this.activeTab = storedTab;
                }
            }
            // else -> keep the default activeTab as-is
        } catch (error) {
            console.error('Error reading activeTab from localStorage:', error);
        }
    }

    /**
     * Persists the current activeTab to localStorage.
     */
    persistActiveTab(tab) {
        try {
            if (tab) {
                window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
            } else {
                // When tab is null (e.g. Create User view), remove the key
                window.localStorage.removeItem(ACTIVE_TAB_STORAGE_KEY);
            }
        } catch (error) {
            console.error('Error writing activeTab to localStorage:', error);
        }
    }

    async fetchTeamSizeData() {
        try {
            const result = await getTeamSizeDetails();
            this.activeUserCount = result.activeCount || 0;
            this.teamSizeLimit = result.teamSizeLimit || 0;
        } catch (error) {
            console.error('Error fetching team size:', error);
        }
    }

    get isOrgDetails() {
        return this.activeTab === 'organisation';
    }

    get isfacility() {
        return this.activeTab === 'facility';
    }

    get isUserManagement() {
        return this.activeTab === 'userManagement';
    }

    get detailsClass() {
        return this.activeTab === 'organisation' ? 'menu-item1' : 'menu-item';
    }

    get facilityClass() {
        return this.activeTab === 'facility' ? 'menu-item1' : 'menu-item';
    }

    get UserManagementClass() {
        return this.activeTab === 'userManagement' ? 'menu-item1' : 'menu-item';
    }

    handleOrganisationDetails() {
        this.isCreateUser = false;
        this.setActiveTab('organisation');
    }

    handleFacility() {
        this.isCreateUser = false;
        this.setActiveTab('facility');
    }

    handleUserManagement() {
        this.isCreateUser = false;
        this.setActiveTab('userManagement');
    }

    /**
     * Single place to update activeTab + persist it.
     * Pass null to clear the stored tab (used by Create User flow).
     */
    setActiveTab(tab) {
        this.activeTab = tab;
        this.persistActiveTab(tab);
    }

    handleBulkCreateUser() { /* TODO */ }

    handleCreateUser() {
        if (this.teamSizeLimit > 0 && this.activeUserCount >= this.teamSizeLimit) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Limit Exceeded',
                message: `You have reached your team size limit of ${this.teamSizeLimit} active users. Please upgrade your subscription to add more.`,
                variant: 'error'
            }));
            return; // Stop the save
        }

        this.isCreateUser = true;
        this.setActiveTab(null); // clears localStorage so refresh doesn't reopen create view
    }

    handleCreateUserBack() {
        this.isCreateUser = false;
        this.setActiveTab('userManagement'); // return to the User Management tab
    }

    handleRefreshDashboard() {
        this.dispatchEvent(new CustomEvent('refreshfacilitydropdown', {
            bubbles: true,
            composed: true
        }));
    }

    handleRefreshOrgData() {
        console.log(' refresh data called in level 1');
        this.dispatchEvent(new CustomEvent('refreshpage', {
            bubbles: true,
            composed: true
        }));
    }

    handleEditOrganisation() {
        const orgCmp = this.template.querySelector('c-t-sign-organisation-lwc');
        if (orgCmp) {
            orgCmp.handleEdit();
        }
    }

    handleCreateFacility() {
        const orgCmp = this.template.querySelector('c-t-sign-facility-lwc');
        if (orgCmp) {
            orgCmp.handleNewFacility();
        }
    }
}