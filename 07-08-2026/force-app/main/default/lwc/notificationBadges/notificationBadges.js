import { LightningElement, track, wire } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import cometdLib from '@salesforce/resourceUrl/CometD';
import USER_ID from '@salesforce/user/Id';
import getUserNotifications from '@salesforce/apex/NotificationServices.getUserNotifications';
import getSessionId from '@salesforce/apex/NotificationServices.getSessionId';
import getLoggedInStaffId from '@salesforce/apex/NotificationServices.getLoggedInStaffId';
import getParticipantFromFundTracker from '@salesforce/apex/NotificationServices.getParticipantFromFundTracker';
import {
    publish,
    createMessageContext
} from 'lightning/messageService';
import DASHBOARD_REDIRECT_CHANNEL from '@salesforce/messageChannel/DashboardRedirectMessageChannel__c';
export default class NotificationsBadge extends LightningElement {

    cometdInitialized = false;
    cometd;
    subscription;
    loggedInStaffId;
    channelName = '/event/Notification_Event__e';

    @track notifications = [];
    @track moduleSummary = [];
    @track unreadCount = 0;

    @track showDropdown = false;
    context = createMessageContext();

   connectedCallback() {
    document.addEventListener('click', this.handleOutsideClick);
        console.log(
        'Notifications Badge Loaded'
    );


        window.addEventListener(
    'closedropdowns',
    this.handleCloseDropdowns
);
    getLoggedInStaffId()

    .then(result => {

        console.log(
            'Logged In Staff Id',
            result
        );

        this.loggedInStaffId =
            result;

        this.initializeCometD();

    this.cometdInitialized = true;


    })

    .catch(error => {

        console.error(
            'Staff Id Error',
            error
        );

    });
}

    initializeCometD() {

        if (this.cometdInitialized) {
            return;
        }

        loadScript(this, cometdLib)

            .then(() => {

                console.log('CometD Library Loaded');

                this.cometdInitialized = true;

                this.initializeConnection();
            })

            .catch(error => {

                console.error(
                    'CometD Load Error',
                    error
                );
            });
    }

    initializeConnection() {

        getSessionId()

            .then(sessionId => {

                console.log('Session Id Received');

                this.cometd =
                    new window.org.cometd.CometD();

                this.cometd.configure({

                    url:
                        window.location.protocol +
                        '//' +
                        window.location.hostname +
                        '/cometd/58.0/',

                    requestHeaders: {

                        Authorization:
                            'OAuth ' + sessionId
                    },

                    appendMessageTypeToURL: false,
                    websocketEnabled: false,
                    logLevel: 'debug'
                });

                this.cometd.handshake((status) => {

                    console.log(
                        'Handshake Status',
                        JSON.stringify(status)
                    );

                    if (status.successful) {

                        console.log(
                            'CometD Handshake Successful'
                        );

                        this.subscribeToChannel();

                    } else {

                        console.error(
                            'Handshake Failed',
                            JSON.stringify(status)
                        );
                    }
                });
            })

            .catch(error => {

                console.error(
                    'Session Error',
                    error
                );
            });
    }

    subscribeToChannel() {

        this.subscription =
            this.cometd.subscribe(

                this.channelName,

                (message) => {

                    console.log(
                        'Realtime Event Received',
                        JSON.stringify(message)
                    );

                    const payload =
                        message.data.payload;
                            console.log(
                            'Incident Payload',
                            JSON.stringify(payload)
                        );
                    if (
                        payload.Type__c !== 'READ' &&
                        payload.Staff_Id__c &&
                        payload.Staff_Id__c.substring(0, 15)
                        !== this.loggedInStaffId.substring(0, 15)
                    ) {
                        return;
                    }
                    
               if (payload.Type__c === 'READ') {

    // =====================================
    // INCIDENT REGISTER
    // user-specific read
    // =====================================

    if (
        payload.Module__c ===
        'Incident Register'
    ) {

        if (
            payload.Staff_Id__c &&
            payload.Staff_Id__c.substring(0, 15)
            !== this.loggedInStaffId.substring(0, 15)
        ) {

            return;
        }
    }

    // =====================================
    // REMOVE NOTIFICATION
    // =====================================

    this.notifications =
        this.notifications.filter(
            item =>
                item.Record_Id__c !==
                payload.Record_Id__c
        );

    this.unreadCount =
        this.notifications.filter(
            item => !item.Is_Read__c
        ).length;

    this.prepareModuleSummary();

    console.log(
        'Badge Reduced',
        this.unreadCount
    );

    return;
}

                // 🔥 EXISTING NEW NOTIFICATION FLOW
                const newNotification = {

                    Module__c: payload.Module__c,
                    Id: Date.now(),
                    Title__c: payload.Title__c,
                    Message__c: payload.Message__c,
                    Record_Id__c: payload.Record_Id__c,
                    Facility__r: {  Name: payload.Facility_Name__c},
                    Is_Read__c: false
                };

                this.notifications =
                    [newNotification, ...this.notifications];

                this.unreadCount++;

                this.prepareModuleSummary();

                console.log(
                    'Badge Updated',
                    this.unreadCount
                );
                    console.log( 'Badge Updated', this.unreadCount);
                }
            );

        console.log(
            'Subscribed To Platform Event'
        );
    }

    disconnectedCallback() {
 
        if (
            this.cometd &&
            this.subscription
        ) {

            this.cometd.unsubscribe(
                this.subscription
            );

            this.cometd.disconnect();
        }

    document.removeEventListener('click', this.handleOutsideClick);
            window.removeEventListener(
    'closedropdowns',
    this.handleCloseDropdowns
);
    }

    handleCloseDropdowns = () => {
    this.showDropdown = false;
}

    @wire(getUserNotifications)
    wiredNotifications({ error, data }) {

        if (data) {
            //this.notifications = data;
            this.notifications = data.map(item => {
                return {
                    ...item,
                    relativeTime: this.getRelativeTime(item.CreatedDate)
                };
            });
            this.unreadCount = data.filter(item => !item.Is_Read__c).length;
            this.prepareModuleSummary();
        } else if (error) {

            console.error(
                'Notification Error',
                error
            );
        }
    }

/*     toggleDropdown(event) {
  event.stopPropagation();
        this.showDropdown =
            !this.showDropdown;
    } */
toggleDropdown(event) {
    event.stopPropagation();

    const wasClosed = !this.showDropdown;

    // close other dropdowns first
    if (wasClosed) {
        window.dispatchEvent(
            new CustomEvent('closedropdowns')
        );
    }

    // then open current dropdown
    this.showDropdown = !this.showDropdown;
}

    getRelativeTime(dateValue) {

        const now = new Date();
        const date = new Date(dateValue);

        const diffSeconds = Math.floor((now - date) / 1000);

        // Less than 1 minute
        if (diffSeconds < 60) {
            return 'Just now';
        }

        // Less than 1 hour
        const mins = Math.floor(diffSeconds / 60);
        if (mins < 60) {
            return `${mins} ${mins === 1 ? 'min' : 'mins'} ago`;
        }

        // Less than 1 day
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) {
            return `${hrs} ${hrs === 1 ? 'hr' : 'hrs'} ago`;
        }

        // Days
        const days = Math.floor(hrs / 24);
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    prepareModuleSummary() {
        const moduleMap = {};

        this.notifications.forEach(item => {
            if (!item.Is_Read__c) {
                const moduleName = item.Module__c;
                if (!moduleMap[moduleName]) {
                    moduleMap[moduleName] = {
                        count: 0,
                        participantId: item.Client__c  || '',  // ← your field API name
                        recordId: item.Record_Id__c || ''
                    };
                }
                moduleMap[moduleName].count++;
            }
        });

        this.moduleSummary = Object.keys(moduleMap)
            .filter(key => moduleMap[key].count > 0)
            .map(key => ({
                moduleName: key,
                count: moduleMap[key].count,
                participantId: moduleMap[key].participantId,  // ← NOW STORED
                recordId: moduleMap[key].recordId
            }));
            console.log('Module Summary', JSON.stringify(this.moduleSummary));
    }

    handleModuleClick(event) {

        const moduleName =  event.currentTarget.dataset.module;

        console.log( 'Clicked Module => ',  moduleName );
        if (moduleName === 'Leave') {
            this.dispatchEvent(
                new CustomEvent( 'navigateleavemanagement',
                    {
                        bubbles: true,
                        composed: true
                    }
                )
            );
        }
    }   

    // handleRedirectClick(event) {

    //     const moduleName =
    //         event.currentTarget.dataset.module;

    //     console.log(
    //         'Clicked Module => ',
    //         moduleName
    //     );

    //     let payload = {
    //         target: moduleName
    //     };

    //     // ✅ Rejected Shift Navigation
    //     if (moduleName === 'Rejected Shifts') {

    //         payload = {

    //             target: 'Roster Manager',

    //             childComponent: 'RosterCreation',

    //             action: 'navigateToRejectedShifts',

    //             participantId:
    //                 event.currentTarget.dataset.participantid,

    //             recordId:
    //                 event.currentTarget.dataset.recordid
    //         };
    //     }

    //     if (moduleName === 'Reimbursement') {
    //         payload = {
    //             target: 'Reimbursement',          // ← change this from 'Roster Manager'
    //             participantId: event.currentTarget.dataset.participantid,
    //             recordId: event.currentTarget.dataset.recordid
    //         };
    //     }

    // // ✅ Funds Tracker Navigation
    //     // if (moduleName === 'Funds Tracker') {
    //     //     const recordId = event.currentTarget.dataset.recordid;
            
    //     //     getParticipantFromFundTracker({ recordId: recordId })
    //     //         .then(participantId => {
    //     //             const payload = {
    //     //                 target: 'Funds Tracker',
    //     //                 participantId: participantId,   // ← now populated
    //     //                 recordId: recordId
    //     //             };
    //     //             publish(this.context, DASHBOARD_REDIRECT_CHANNEL, payload);
    //     //             console.log('Published Funds Tracker =>', JSON.stringify(payload));
    //     //         })
    //     //         .catch(error => {
    //     //             console.error('FundTracker lookup error', error);
    //     //         });
    //     //     return; // ← stop default publish below
    //     // }
    //     if (moduleName === 'Funds Tracker') {

    //         const recordId = event.currentTarget.dataset.recordid;

    //         getParticipantFromFundTracker({ recordId })
    //             .then(result => {

    //                 if (!result?.participantUid) {
    //                     console.error('Participant UID not found');
    //                     return;
    //                 }

    //                 const url =
    //                     '/s/#/participants/' +
    //                     result.participantUid +
    //                     '/funds-tracker';

    //                 console.log('Navigating to:', url);

    //                 window.location.href = url;
    //                 // OR
    //                 // window.open(url, '_self');
    //             })
    //             .catch(error => {
    //                 console.error('Funds Tracker navigation error:', error);
    //             });

    //         return;
    //     }
    //     if (moduleName === 'Reimbursement') {
    //         window.location.href = '/s/#/roster-manager/reimbursement';
    //         return;
    //     }
    //     if (moduleName === 'Leave Management') {

    //     window.location.href = '/s/#/human-resources/leave-management';

    //     // OR
    //     // window.open('/s/#/human-resources/leave-management', '_self');

    //     return;
    // }
    // if (moduleName === 'Rejected Shifts') {

    //     window.location.href = '/s/#/roster-manager/rejected-shifts';
    //     return;
    // }
    //     publish(
    //         this.context,
    //         DASHBOARD_REDIRECT_CHANNEL,
    //         payload
    //     );

    //     console.log(
    //         'Published => ',
    //         JSON.stringify(payload)
    //     );
    // }

    handleRedirectClick(event) {
        const moduleName = event.currentTarget.dataset.module;
        const recordId = event.currentTarget.dataset.recordid;
        const participantId = event.currentTarget.dataset.participantid;
        const facilityId = event.currentTarget.dataset.facilityid;
        const facilityName = event.currentTarget.dataset.facilityname;

        console.log('Clicked Module => ', moduleName, 'Record ID =>', recordId, 'Facility ID =>', facilityId);

        // 1. Switch facility programmatically if different
        // if (facilityId) {
        if (facilityId || facilityName) {
        
            const currentFacilityId = localStorage.getItem("defaultFacilityId");
            // if (currentFacilityId !== facilityId) {
            const currentFacilityLabel = localStorage.getItem("defaultFacilityLabel");
            if ((facilityId && currentFacilityId !== facilityId) || (facilityName && currentFacilityLabel !== facilityName)) {            
                this.dispatchEvent(new CustomEvent('recordfacilityresolved', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        facilities: [{ id: facilityId, name: facilityName || '' }]
                    }
                }));
            }
        }

        // 2. Perform redirection using URL hash routing
        if (moduleName === 'Funds Tracker') {
            getParticipantFromFundTracker({ recordId })
                .then(result => {
                    if (!result?.participantUid) {
                        console.error('Participant UID not found');
                        return;
                    }
                    const url = '/s/#/participants/' + result.participantUid + '/funds-tracker';
                    console.log('Navigating to:', url);
                    window.location.href = url;
                })
                .catch(error => {
                    console.error('Funds Tracker navigation error:', error);
                });
            return;
        }

/*         if (moduleName === 'Leave Management' || moduleName === 'Leave') {
            const url = recordId 
                ? `/s/#/human-resources/leave-management/${recordId}` 
                : '/s/#/human-resources/leave-management';
            console.log('Navigating to:', url);
            window.location.href = url;
            return;
        } */

            if (moduleName === 'Leave Management' || moduleName === 'Leave') {
    const url = '/s/#/human-resources/leave-management';
    console.log('Navigating to:', url);
    window.location.href = url;
    return;
}

/*         if (moduleName === 'Rejected Shifts') {
            // const url = '/s/#/roster-manager/rejected-shifts';
            const messageText = event.currentTarget.dataset.message || '';
            const dateMatch = /Date:\s*([\d-]{10})/i.exec(messageText);
            const targetDate = dateMatch ? dateMatch[1] : '';
            const url = targetDate 
                ? `/s/#/roster-manager/rejected-shifts/calendar/${targetDate}` 
                : '/s/#/roster-manager/rejected-shifts/calendar';            
            console.log('Navigating to:', url);
            window.location.href = url;
            return;
        } */
if (moduleName === 'Rejected Shifts') {

    const messageText = event.currentTarget.dataset.message || '';

    const dateMatch = /Date:\s*(\d{2})\/(\d{2})\/(\d{4})/i.exec(messageText);

    let targetDate = '';

    if (dateMatch) {
        const [, day, month, year] = dateMatch;
        targetDate = `${year}-${month}-${day}`;
    }

    const url = targetDate
        ? `/s/#/roster-manager/rejected-shifts/calendar/${targetDate}`
        : '/s/#/roster-manager/rejected-shifts/calendar';

    console.log('Navigating to:', url);
    window.location.href = url;
    return;
}

        if (moduleName === 'Reimbursement') {
            const url = '/s/#/roster-manager/reimbursement/approvals';
            console.log('Navigating to:', url);
            window.location.href = url;
            return;
        }

/*         if (moduleName === 'Incident Register') {
            const url = recordId 
                ? `/s/#/incident-register/${recordId}` 
                : '/s/#/incident-register';
            console.log('Navigating to:', url);
            window.location.href = url;
            return;
        } */
               if (moduleName === 'Incident Register') {
            const url =/*  recordId 
                ? `/s/#/incident-register/${recordId}` 
                : */ '/s/#/incident-register';
            console.log('Navigating to:', url);
            window.location.href = url;
            return;
        }

        // Fallback LMS redirection
        let payload = {
            target: moduleName,
            recordId: recordId,
            participantId: participantId
        };
        publish(this.context, DASHBOARD_REDIRECT_CHANNEL, payload);
        console.log('Published => ', JSON.stringify(payload));
    }    

    handleOutsideClick = (event) => {

        const dropdown =
            this.template.querySelector(
                '.notification-container'
            );

        if (
            dropdown &&
            !dropdown.contains(event.target)
        ) {

            this.showDropdown = false;
        }
    }
}