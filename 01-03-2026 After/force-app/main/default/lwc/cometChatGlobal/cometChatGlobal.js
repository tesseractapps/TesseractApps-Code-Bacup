import { LightningElement, wire, track } from 'lwc';
import getMyNotifications from '@salesforce/apex/GlobalCometChatService.getMyNotifications';
import getCredentials from '@salesforce/apex/GlobalCometChatService.getCredentials';
import clearNotificationsForSender from '@salesforce/apex/GlobalCometChatService.clearNotificationsForSender';
import getAllOrganisations from '@salesforce/apex/GlobalCometChatService.getAllOrganisations';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';


const COLUMNS = [
    { label: 'Organisation', fieldName: 'organisationName', type: 'text' },
    { label: 'Sender', fieldName: 'senderName', type: 'text' },
    { label: 'Last Message', fieldName: 'LastMessage__c', type: 'richText' },
    { label: 'Unread', fieldName: 'UnreadCount__c', type: 'number' },
    {
        type: 'button',
        typeAttributes: {
            label: 'Open Chat',
            name: 'open_chat',
            variant: 'brand'
        }
    }
];

export default class GlobalCometChat extends LightningElement {

    columns = COLUMNS;

@track organisationOptions = [];
orgRecords = []; // keep the full org list
selectedOrgId = '';


    // CometChat config for the currently selected org
    COMETCHAT = {};
    _listenerAttached = false;


    notifications = [];
noRecordsFlag = false;

// Pagination
pageSizeOptions = [1, 5, 10, 25, 50];
pageSize = 10;
pageNumber = 1;
totalRecords = 0;
totalPages = 1;

get bDisableFirst() {
    return this.pageNumber === 1 || this.totalPages === 0;
}

get bDisableLast() {
    return this.pageNumber === this.totalPages || this.totalPages === 0;
}

showToast(title, message, variant = 'info') {
    this.dispatchEvent(
        new ShowToastEvent({
            title,
            message,
            variant
        })
    );
}



@wire(getAllOrganisations)
wiredOrgs({ data, error }) {
    if (data) {
        this.orgRecords = data;

        this.organisationOptions = data.map(o => ({
            label: o.Name,
            value: o.Id
        }));
    } else if (error) {
        console.error('Error loading organisations', error);
    }
}




connectedCallback() {
    // your existing init logic (orgs, etc.)
   this.fetchNotifications();
   //console.log('orgs '+JSON.stringify(this.organisationOptions));
}
fetchNotifications() {
    console.log('Calling getMyNotifications with:', this.pageSize, this.pageNumber);

    getMyNotifications({
        pageSize: this.pageSize,
        pageNumber: this.pageNumber
    })
        .then(result => {
            const rows = result.records || [];
            this.totalRecords = result.totalRecords || 0;

            this.totalPages =
                this.totalRecords > 0
                    ? Math.ceil(this.totalRecords / this.pageSize)
                    : 0;

            this.notifications = rows.map(row => {
                const unread = row.unreadCount || 0;
                const hasUnread = unread > 0;

                return {
                    ...row,
                    organisationName: row.organisationName || '',
                    senderName: row.senderName || '',
                    senderUID: row.senderCometChatUid || null,

                    unread,
                    lastMessageTimeDisplay: row.lastMessageTimeFormatted || '',

                    // status UI helpers
                    hasUnread,
                    statusText: hasUnread ? 'UNREAD' : 'READ',
                    statusClass: hasUnread ? 'status-pill unread' : 'status-pill read',

                    // hide action when no unread
                    showAction: hasUnread
                };
            });

            this.noRecordsFlag = this.totalRecords === 0;
        })
        .catch(error => {
            console.error('Error loading notifications', error);
            this.notifications = [];
            this.totalRecords = 0;
            this.totalPages = 0;
            this.noRecordsFlag = true;
        });
}

get pageSizeOptionObjects() {
  return this.pageSizeOptions.map(x => ({ label: String(x), value: String(x) }));
}
get pageSizeString() {
  return String(this.pageSize);
}
handleRecordsPerPageCombobox(event) {
  this.pageSize = parseInt(event.detail.value, 10);
  this.pageNumber = 1;
  this.fetchNotifications();
}



firstPage() {
    if (this.pageNumber === 1) return;
    this.pageNumber = 1;
    this.fetchNotifications();
}

previousPage() {
    if (this.pageNumber > 1) {
        this.pageNumber -= 1;
        this.fetchNotifications();
    }
}

nextPage() {
    if (this.pageNumber < this.totalPages) {
        this.pageNumber += 1;
        this.fetchNotifications();
    }
}

lastPage() {
    if (this.pageNumber === this.totalPages) return;
    this.pageNumber = this.totalPages;
    this.fetchNotifications();
}


    handleOrgChange(event) {
        this.selectedOrgId = event.detail.value;
        this.initCometChatForSelectedOrg();
    }

async initCometChatForSelectedOrg() {
    if (!this.selectedOrgId) {
        return;
    }

    // Find the selected org from orgRecords
    const org = this.orgRecords.find(o => o.Id === this.selectedOrgId);

    if (!org) {
        this.showToast('Error', 'Organisation not found.', 'error');
        return;
    }

    // Validate CometChat credentials before calling Apex
    if (
        !org.CometChat_App_ID__c ||
        !org.CometChat_Region__c ||
        !org.CometChat_AuthKey__c ||
        !org.CometChat_REST_API_Key__c
    ) {
        // 👉 No creds: show INFO toast and stop
        this.showToast(
            'Chat Not Configured',
            `Organisation "${org.Name}" does not have Chat credentials configured.`,
            'info'
        );
        return;
    }

    try {
        // Get credentials for logged-in global user
        const creds = await getCredentials({ organisationId: this.selectedOrgId });

        this.COMETCHAT = {
            appID: creds.appId,
            appRegion: creds.region,
            authKey: creds.authKey,
            userUID: creds.userUID,
            userName: creds.userName || 'Global User',
            isDocked: true,
            width: '1100px',
            height: '500px',
            dockedAlignment: 'left'
        };

        await this.initializeCometChat();

        // 👉 Successful init with creds: show SUCCESS toast
        this.showToast(
            'Chat Ready',
            `Chat has been initialized for "${org.Name}".`,
            'success'
        );
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[GlobalCometChat] Error initializing org:', e);
        this.showToast(
            'Initialization Failed',
            'Failed to initialize Chat for this organisation.',
            'error'
        );
    }
}


isOpeningChat = false;
activeCometAppId = null;
_initPromise = null;


async handleOpenChat(event) {
    if (this.isOpeningChat) return;
    this.isOpeningChat = true;

    const senderUid = event.currentTarget?.dataset?.senderuid || null;
    const senderId = event.currentTarget?.dataset?.senderid || null;
    const organisationId = event.currentTarget?.dataset?.orgid || null;

    if (!senderUid || !senderId || !organisationId) {
        console.warn('[GlobalCometChat] Missing data on click', { senderUid, senderId, organisationId });
        this.isOpeningChat = false;
        return;
    }

    try {
        // Switch org
        const orgChanged = organisationId !== this.selectedOrgId;
        this.selectedOrgId = organisationId;

        // Force init if org changed OR chat not initialized
        if (orgChanged || !this.COMETCHAT || !this.COMETCHAT.appID) {
            await this.initCometChatForSelectedOrg();
        } else {
            // Even if org didn't change, ensure we are still on correct CometChat app
            if (this.activeCometAppId && this.COMETCHAT.appID !== this.activeCometAppId) {
                await this.initCometChatForSelectedOrg();
            }
        }

        // Optimistic UI update
        this.notifications = (this.notifications || []).map(n =>
            n.senderUserId === senderId ? { ...n, unread: 0, showAction: false, statusText: 'READ', statusClass: 'status-pill read' } : n
        );

        await clearNotificationsForSender({ senderUserId: senderId, organisationId });
        await this.fetchNotifications();
    } catch (e) {
        console.error('[GlobalCometChat] Error opening chat:', e);
        try { await this.fetchNotifications(); } catch (ignored) {}
    } finally {
        this.isOpeningChat = false;
    }
}




initializeCometChat() {
    // If init already running, reuse it (prevents two org inits racing)
    if (this._initPromise) return this._initPromise;

    this._initPromise = new Promise((resolve, reject) => {
        try {
            const { appID, appRegion, authKey, userUID } = this.COMETCHAT;
            if (!appID || !appRegion || !authKey || !userUID) {
                throw new Error('Missing required CometChat credentials (appID, appRegion, authKey, userUID).');
            }

            const credentials = { appID, appRegion, authKey };
            const options = {
                targetElementID: 'cometChatMount',
                isDocked: this.COMETCHAT.isDocked,
                width: this.COMETCHAT.width,
                height: this.COMETCHAT.height,
                dockedAlignment: this.COMETCHAT.dockedAlignment
            };

            // Destroy only if switching to a different appID (org)
            try {
                if (window.CometChatApp && CometChatApp.destroy) {
                    if (this.activeCometAppId && this.activeCometAppId !== appID) {
                        CometChatApp.destroy();
                        this._listenerAttached = false;
                    }
                }
            } catch (e) {
                console.warn('[GlobalCometChat] Destroy warning:', e);
            }

            CometChatApp.init(credentials)
                .then(() => {
                    this.activeCometAppId = appID; // <-- KEY: remember current org/app
                    console.log('[GlobalCometChat] Initialized app:', appID);

                    if (window.CometChat && CometChat.removeConnectionListener && this._listenerAttached) {
                        CometChat.removeConnectionListener('global-lwc-conn');
                        this._listenerAttached = false;
                    }

                    if (window.CometChat && CometChat.addConnectionListener) {
                        CometChat.addConnectionListener('global-lwc-conn', {
                            onConnected: () => console.log('ConnectionListener => On Connected'),
                            onDisconnected: () => console.log('ConnectionListener => On Disconnected')
                        });
                        this._listenerAttached = true;
                    }

                    return CometChatApp.login({ uid: userUID });
                })
                .then(user => {
                    console.log('[GlobalCometChat] Logged in as:', user?.uid);
                    return CometChatApp.launch(options);
                })
                .then(() => {
                    console.log('[GlobalCometChat] Chat launched for app:', appID);
                    resolve();
                })
                .catch(err => {
                    reject(err);
                })
                .finally(() => {
                    this._initPromise = null; // allow future init
                });

        } catch (e) {
            this._initPromise = null;
            reject(e);
        }
    });

    return this._initPromise;
}


    /* ---------------------------
       6. Cleanup when component is destroyed
       --------------------------- */
    disconnectedCallback() {
        try {
            if (window.CometChat && CometChat.removeConnectionListener && this._listenerAttached) {
                CometChat.removeConnectionListener('global-lwc-conn');
                this._listenerAttached = false;
            }
            if (window.CometChatApp && CometChatApp.destroy) {
                CometChatApp.destroy();
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('[GlobalCometChat] Cleanup warning:', e);
        }
    }
}