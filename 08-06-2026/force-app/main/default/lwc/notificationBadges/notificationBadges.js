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

   // this.cometdInitialized = true;


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

                  /*  if (
                        payload.Staff_Id__c &&
                        payload.Staff_Id__c.substring(0, 15)
                        !== this.loggedInStaffId.substring(0, 15)
                    ) {
                        return;
                    } */
                   if (
    payload.Type__c !== 'READ' &&
    payload.Staff_Id__c &&
    payload.Staff_Id__c.substring(0, 15)
    !== this.loggedInStaffId.substring(0, 15)
) {
    return;
}

                    /* const newNotification = {
                    Module__c: payload.Module__c,
                        Id: Date.now(),
                        Title__c: payload.Title__c,
                        Message__c: payload.Message__c,
                        Is_Read__c: false
                    };

                    this.notifications = [newNotification, ...this.notifications];
                    this.unreadCount++;
                    this.prepareModuleSummary(); */
/*                     if (payload.Type__c === 'READ') {
                    this.notifications =  this.notifications.filter(  item => item.Record_Id__c !== payload.Record_Id__c);
                    this.unreadCount =
                        this.notifications.filter(
                            item => !item.Is_Read__c
                        ).length;
                    this.prepareModuleSummary();
                    console.log( 'Badge Reduced', this.unreadCount);

                    return;
                } */
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
            this.notifications = data;
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

/*     prepareModuleSummary() {

    const moduleMap = {};

    this.notifications.forEach(item => {

        const moduleName =
            item.Module__c;

        if (!moduleMap[moduleName]) {

            moduleMap[moduleName] = 0;
        }

        if (!item.Is_Read__c) {

            moduleMap[moduleName]++;
        }
    });

    this.moduleSummary =

        Object.keys(moduleMap).map(
            key => {

                return {

                    moduleName: key,

                    count: moduleMap[key]
                };
            }
        );

    console.log(
        'Module Summary',
        JSON.stringify(
            this.moduleSummary
        )
    );
} */
// prepareModuleSummary() {

//     const moduleMap = {};

//     this.notifications.forEach(item => {

//         // ✅ ONLY unread notifications
//         if (!item.Is_Read__c) {

//             const moduleName = item.Module__c;

//             if (!moduleMap[moduleName]) {

//                 moduleMap[moduleName] = 0;
//             }

//             moduleMap[moduleName]++;
//         }
//     });

//     // ✅ ONLY modules with count > 0
//     this.moduleSummary = Object.keys(moduleMap)
//         .filter(key => moduleMap[key] > 0)
//         .map(key => {

//             return {

//                 moduleName: key,

//                 count: moduleMap[key]
//             };
//         });

//     console.log(
//         'Module Summary',
//         JSON.stringify(this.moduleSummary)
//     );
// }


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

//     publish(
//         this.context,
//         DASHBOARD_REDIRECT_CHANNEL,
//         {
//             target: moduleName
//         }
//     );

//     console.log(
//         'Published => ',
//         moduleName
//     );
    
// }

handleRedirectClick(event) {

    const moduleName =
        event.currentTarget.dataset.module;

    console.log(
        'Clicked Module => ',
        moduleName
    );

    let payload = {
        target: moduleName
    };

    // ✅ Rejected Shift Navigation
    if (moduleName === 'Rejected Shifts') {

        payload = {

            target: 'Roster Manager',

            childComponent: 'RosterCreation',

            action: 'navigateToRejectedShifts',

            participantId:
                event.currentTarget.dataset.participantid,

            recordId:
                event.currentTarget.dataset.recordid
        };
    }

    if (moduleName === 'Reimbursement') {
        payload = {
            target: 'Reimbursement',          // ← change this from 'Roster Manager'
            participantId: event.currentTarget.dataset.participantid,
            recordId: event.currentTarget.dataset.recordid
        };
    }

// ✅ Funds Tracker Navigation
if (moduleName === 'Funds Tracker') {
    const recordId = event.currentTarget.dataset.recordid;
    
    getParticipantFromFundTracker({ recordId: recordId })
        .then(participantId => {
            const payload = {
                target: 'Funds Tracker',
                participantId: participantId,   // ← now populated
                recordId: recordId
            };
            publish(this.context, DASHBOARD_REDIRECT_CHANNEL, payload);
            console.log('Published Funds Tracker =>', JSON.stringify(payload));
        })
        .catch(error => {
            console.error('FundTracker lookup error', error);
        });
    return; // ← stop default publish below
}
    

    publish(
        this.context,
        DASHBOARD_REDIRECT_CHANNEL,
        payload
    );

    console.log(
        'Published => ',
        JSON.stringify(payload)
    );
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