import { LightningElement, track, wire,api  } from 'lwc';
import getForms from '@salesforce/apex/FormController.getForms';
import saveFormResponse from '@salesforce/apex/FormController.saveFormResponse';
import updateFormResponse from '@salesforce/apex/FormController.updateFormResponse';
import getFormResponses from '@salesforce/apex/FormController.getFormResponses';
import deleteFormResponse from '@salesforce/apex/FormController.deleteFormResponse';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import CURRENT_USER_ID from '@salesforce/user/Id';
import getUserAccessDetails from '@salesforce/apex/UserAccessController.getUserAccessDetailsforAccessManager1';
import getParticipants from '@salesforce/apex/FormController.getParticipants';
import getEmployeeData from '@salesforce/apex/issueRegisterSearch.getEmployeeData';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import getAvailableForms from '@salesforce/apex/FormController.getAvailableForms';
// import grantAccessToParticipant from '@salesforce/apex/FormController.grantAccessToParticipant';
import getAccessibleForms from '@salesforce/apex/FormController.getAccessibleForms';
import getFormsByClient from '@salesforce/apex/FormController.getFormsByClient';
import getFormResponsesByClient from '@salesforce/apex/FormController.getFormResponsesByClient';
import uploadFileToSalesforce from '@salesforce/apex/FormController.uploadFileToSalesforce';
import { getRecord } from 'lightning/uiRecordApi';
import USER_FIRSTNAME from '@salesforce/schema/User.FirstName';
import USER_LASTNAME from '@salesforce/schema/User.LastName';
import USER_EMAIL from '@salesforce/schema/User.Email';
import USER_ROLE from '@salesforce/schema/User.User_Role__c';
import USER_TYPE from '@salesforce/schema/User.User_Type__c';
import USER_ORG_NAME from '@salesforce/schema/User.Organization_Name__c';
import getFacilityByUserEmail from '@salesforce/apex/FormController.getFacilityByUserEmail';
import { loadScript } from 'lightning/platformResourceLoader';
import jsPDF from '@salesforce/resourceUrl/jspdf';
import autoTable from '@salesforce/resourceUrl/autotable';
let jsPDFLoaded = false;

import Form3D from '@salesforce/resourceUrl/Form3D';

import StaticForms from '@salesforce/resourceUrl/Static_Forms';

const FORM_IMAGE_1 = `${StaticForms}/form1.png`;
const FORM_IMAGE_2 = `${StaticForms}/form2.png`;

const formImages = [FORM_IMAGE_1, FORM_IMAGE_2];

export default class FormRender extends LightningElement {
    @track forms = [];
    @track allForms = [];
    @track selectedForm;
    @track tableRows = [];
    @track isFormSelected = false;
    @track selectedFormType = '';
    @track formResponses = [];
    @track selectedResponseId;
    @track isEditing = false;
    @track isViewMode = false;
    @track viewTableData = [];
    @api clientId = '';
    @api orgid = '';
    userId = CURRENT_USER_ID;
    form3D = Form3D;
    wiredFormResponses;
    @track participantAccess = false;
@track wiredParticipants;
@track participants = []; // Stores fetched records
@track recordsToDisplay = []; // Stores paginated records
@track totalRecords = 0;
@track pageNumber = 1;
@track pageSize = 5; // Default number of records per page
@track totalPages = 0;
@track isDesktop = true; // Simulated for desktop behavior
@track visible = true; // For visibility control
@track noRecordsFlag = false; // Flag to handle no records message
@track bDisableFirst = true; // Disable First & Previous initially
@track bDisableLast = true; // Disable Next & Last initially
@track selectedParticipantId = '';
    @track selectedParticipantName = '';
    @track isGrantAccessPopupOpen = false;
    @track availableForms = [];
    @track selectedForms = new Set();
    @track grantedForms = new Set();

    @track showPublishedForms = false;
    @track paginatedFormResponses = []; // Stores paginated submitted forms
@track totalFormRecords = 0;
@track formPageNumber = 1;
@track formPageSize = 5; // Default number of records per page
@track totalFormPages = 0;
@track disableFirstFormPage = true;
@track disableLastFormPage = true;
@track searchQuery = '';
@track filteredForms = [];
@track showFormsAccess = false;
@track facilityId;
userInfoLoaded = false;
participantsLoaded = false;
@track currentPageIndex = 0;
@track pagedRows = [];
@track isIncidentRegisterSelected = false;
@track isCustomisableFormSelected = true;




    @track dataTypes = [
        { id: '1', label: 'Text Field' },
        { id: '2', label: 'Number Field' },
        { id: '3', label: 'Date Field' },
        { id: '4', label: 'Time Field' },
        { id: '5', label: 'Checkbox Field' },
        { id: '6', label: 'Dropdown Field' },
        { id: '7', label: 'URL Field' }
    ];

    connectedCallback() {
        console.log('📌 Received Org ID in Chatter:', this.orgid);
        console.log('🔹 Received Client ID:', this.clientId);
    
        // ✅ Hide Participants Table if clientId is present
        if (this.clientId && this.clientId.trim() !== '') {
            this.participantAccess = false;
            console.log('🚫 Hiding Participants Table - Form is Specific to a Client');
        } else {
            this.participantAccess = true;
            console.log('✅ Showing Participants Table - No Specific Client ID');
            console.log('📧 Sending User Email to Apex:', USER_EMAIL);
            // 🔄 Fetch facility and trigger wire
            
        }
    }
    

    renderedCallback() {
        // ✅ Set tooltip titles for labels
        const labels = this.template.querySelectorAll('.label-text-drop');
        labels.forEach(label => {
            if (!label.title) {
                label.title = label.textContent;
            }
        });
    
        // ✅ Inject rich text content (only in view mode)
        if (this.isViewMode && this.viewTableData && Array.isArray(this.viewTableData)) {
            this.viewTableData.forEach(item => {
                if (item.isRichText && item.value) {
                    const container = this.template.querySelector(`div[data-id="${item.id}"]`);
                    if (container) {
                        container.innerHTML = item.value;
                    }
                }
            });
        }
    
        // ✅ Load accessible forms if clientId is available
        if (this.clientId && !this.selectedParticipantId) {
            console.log('🔹 Received Client ID:', this.clientId);
            this.selectedParticipantId = this.clientId;
    
            getAccessibleForms({ participantId: this.clientId })
                .then((formRecords) => {
                    if (!formRecords || formRecords.length === 0) {
                        this.forms = [];
                        this.filteredForms = [];
                        console.log('⚠️ No accessible forms for this participant.');
                    } else {
                        // 🛠 Build miniRows here immediately
                        this.forms = formRecords.map(form => {
                            let miniRows = [];
                            try {
                                if (form.Form_JSON__c) {
                                    const parsed = JSON.parse(form.Form_JSON__c);
                                    miniRows = parsed.map((row, rowIndex) => ({
                                        index: rowIndex,
                                        cells: row.cells.map((cell, colIndex) => ({
                                            label: cell.field?.label || ' ',
                                            index: colIndex
                                        }))
                                    }));
                                }
                            } catch (e) {
                                console.error('❌ Error parsing Form_JSON__c for mini view:', form.Name__c, e);
                            }
                            return {
                                ...form,
                                miniRows,
                                formImageUrl: this.getRandomFormImage()
                            };
                        });
    
                        this.filteredForms = this.forms;
                        console.log('✅ Forms loaded with mini views:', this.filteredForms.map(f => f.Name__c));
                    }
                })
                .catch(error => {
                    console.error('❌ Error fetching accessible forms by clientId:', error);
                });
        }
if (!this.jsPDFInitialized) {
    Promise.all([
        loadScript(this, jsPDF),
        loadScript(this, autoTable)
    ])
    .then(() => {
        const jsPDFConstructor = window.jspdf?.jsPDF || window.jsPDF;

        if (jsPDFConstructor && window.jspdf?.autoTable) {
            jsPDFConstructor.API.autoTable = window.jspdf.autoTable;
        } else if (jsPDFConstructor && window.autoTable) {
            jsPDFConstructor.API.autoTable = window.autoTable;
        }

        if (jsPDFConstructor?.API?.autoTable) {
            this.jsPDFInitialized = true;
            console.log('✅ jsPDF and autoTable loaded successfully.');
        } else {
            console.error('❌ Failed to attach autoTable plugin to jsPDF.');
        }
    })
    .catch(error => {
        console.error('❌ Error loading jsPDF or autoTable:', error);
    });
}


    }
    jsPDFInitialized = false;

    get isParticipantLocked() {
        return this.clientId !== null && this.clientId !== undefined && this.clientId !== '';
    }
    
    
    @wire(getRecord, { 
        recordId: '$userId', 
        fields: [USER_ROLE, USER_ORG_NAME, USER_TYPE, USER_FIRSTNAME, USER_LASTNAME, USER_EMAIL]
    }) 
    wiredUser({ error, data }) {
        if (data) {
            this.userRole = data.fields.User_Role__c.value;
            this.orgName = data.fields.Organization_Name__c.value;
            this.userType = data.fields.User_Type__c.value;
            this.firstName = data.fields.FirstName.value;
            this.lastName = data.fields.LastName.value;
            this.userEmail = data.fields.Email.value;

            // Logging user info
            console.log('✅ User ID: ', this.userId);
            console.log('✅ User Role: ', this.userRole);
            console.log('✅ Organization Name: ', this.orgName);
            console.log('✅ User Type: ', this.userType);
            console.log('✅ First Name: ', this.firstName);
            console.log('✅ Last Name: ', this.lastName);
            console.log('✅ Email: ', this.userEmail);
            this.showFormsAccess = this.userType === 'NDIS Org Admin' || this.userType === 'Roster Manager';
            // this.isStaffUser = this.userType === 'NDIS Staff';
            this.isStaffUser = this.userType === 'NDIS Org Admin';
            console.log('✅ showFormsAccess:', this.showFormsAccess);

            this.getFacilityValues();
            this.getStaffValues();

            // ✅ Now fetch the user's Facility ID
        getFacilityByUserEmail({ userEmail: this.userEmail })
        .then(facilityId => {
            console.log('🏥 Facility ID for user:', facilityId);
            this.facilityId = facilityId; // Make sure facilityId is reactive
        })
        .catch(error => {
            console.error('❌ Error fetching facility:', error);
        });
            this.filterParticipantOptions();
            
        } else if (error) {
            console.error('❌ Error fetching user info:', error);
        }
    }
    

    // @wire(getRecord, { recordId: '$userId', fields: [USER_NAME, USER_EMAIL, USER_ROLE] })
    // userDetails({ error, data }) {
    //     if (data) {
    //         this.userName = data.fields.Name.value;
    //         this.userEmail = data.fields.Email.value;
    //         this.userRole = data.fields.User_Role__c.value;

    //         console.log('🔹 Logged-in User:', this.userName);
    //         console.log('🔹 User Role:', this.userRole);

    //         // ✅ Restrict Access to Specific Roles
    //         const allowedRoles = ['Portal Account Partner Executive', 'Portal Account Partner Manager', 'CEO', 'Admin'];
    //         // this.participantAccess = allowedRoles.includes(this.userRole);

    //         console.log('🔹 Participant Access Granted:', this.participantAccess);
    //     } else if (error) {
    //         console.error('❌ Error fetching user details:', error);
    //     }
    // }

    // @wire(getParticipants)
    // wiredRecords({ data, error }) {
    //     if (data) {
    //         this.participants = data.map(participant => ({
    //             ...participant,
    //             grantedForms: participant.Form_Access__c ? participant.Form_Access__c.split(';') : []
    //         }));
    //         this.totalRecords = data.length;
    //         this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
    //         this.paginationHelper();
    //     } else if (error) {
    //         console.error('Error fetching participants:', error);
    //     }
    // }

    @wire(getParticipants, { facilityId: '$facilityId' })
    wiredRecords({ data, error }) {
        if (data) {
            this.participants = data.map(participant => {
                const staffMembers = participant.staffMembers || [];
    
                // ✅ Separate visible (first 5) and remaining staff
                const visibleStaffMembers = staffMembers.slice(0, 5);
                const extraStaff = staffMembers.slice(5);
                const extraStaffCount = extraStaff.length;
                const extraStaffNames = extraStaff.map(s => s.name).join(', ');
    
                // ✅ Debug logs
                visibleStaffMembers.forEach(staff => {
                    
                });
    
                if (extraStaffCount > 0) {
                    console.log(`➕ ${extraStaffCount} extra staff: ${extraStaffNames}`);
                }
    
                return {
                    ...participant,
                    visibleStaffMembers,
                    hasVisibleStaff: visibleStaffMembers.length > 0, // ✅ Add this
                    extraStaffCount,
                    extraStaffNames,
                    hasExtraStaff: extraStaffCount > 0,
                    grantedForms: participant.Accessible_Forms__c
                        ? participant.Accessible_Forms__c.split(';')
                        : []
                };
                
            });
    
            this.filteredParticipants = [...this.participants];
            this.totalRecords = this.filteredParticipants.length;
            this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
            this.paginationHelper();


             this.participantsLoaded = true;
            this.filterParticipantOptions();
        } else if (error) {
            console.error('❌ Error fetching participants:', error);
        }
    }
    


    filterParticipantOptions() {
        if (!this.userInfoLoaded || !this.participantsLoaded) return;
    
        const fullName = `${this.firstName} ${this.lastName}`;
    
        if (this.userType === 'NDIS Staff') {
            // ✅ Show only related participants for staff
            this.participantOptions = this.participants
                .filter(p =>
                    p.visibleStaffMembers &&
                    p.visibleStaffMembers.some(staff => staff.name === fullName)
                )
                .map(p => ({
                    label: p.Name,
                    value: p.Id
                }));
    
            console.log(`✅ [Staff] Filtered participants for ${fullName}:`, this.participantOptions);
        } else {
            // ✅ Org Admins, Roster Managers see all participants
            this.participantOptions = this.participants.map(p => ({
                label: p.Name,
                value: p.Id
            }));
    
            console.log(`✅ [Admin] Showing all participants:`, this.participantOptions);
        }
    
        console.log('🔍 Final participantOptions:', JSON.stringify(this.participantOptions, null, 2));
    }
    
    

    handleParticipantDropdownClick() {
        if (!this.participants || !this.userType || !this.userEmail) {
            console.warn('⚠️ Missing participants or user info');
            return;
        }
    
        if (this.userType === 'NDIS Staff') {
            this.participantOptions = this.participants
                .filter(p =>
                    p.visibleStaffMembers &&
                    p.visibleStaffMembers.some(staff => staff.email === this.userEmail)
                )
                .map(p => ({
                    label: p.Name,
                    value: p.Id
                }));
    
            console.log('✅ [Staff] Filtered participantOptions on dropdown open:', JSON.stringify(this.participantOptions));
        } else {
            this.participantOptions = this.participants.map(p => ({
                label: p.Name,
                value: p.Id
            }));
    
            console.log('✅ [Admin] Loaded all participants on dropdown open:', JSON.stringify(this.participantOptions));
        }
    }
    
    

    @wire(getUserAccessDetails, { userId: '$userId' })
    wiredUserAccessDetails({ error, data }) {
        if (data) {
            this.userData = this.processUserData(data);
            this.totalRecords = this.userData.length;
            console.log('✅ User Access Data Fetched:', JSON.stringify(userData));
        } else if (error) {
            this.showToast('Error', 'Failed to fetch user data.', 'error');
        }
    }
    // togglePublishedForms() {
    //     this.showPublishedForms = !this.showPublishedForms;
    
    //     // ✅ Clear selected participant and forms if staff is closing the modal
    //     if (!this.showPublishedForms && this.isStaffUser) {
    //         this.selectedParticipantId = '';
    //         this.forms = [];
    //         this.filteredForms = [];
    //     }
    // }

    togglePublishedForms() {
    this.showPublishedForms = !this.showPublishedForms;

    // if (this.showPublishedForms) {
    //     // 🔄 Always fetch all forms on open
    //     getForms()
    //         .then((formRecords) => {
    //             this.forms = formRecords.map(form => {
    //                 let miniRows = [];
    //                 try {
    //                     if (form.Form_JSON__c) {
    //                         const parsed = JSON.parse(form.Form_JSON__c);
    //                         miniRows = parsed.slice(0, 4).map((row, rowIndex) => ({
    //                             index: rowIndex,
    //                             cells: row.cells
    //                                 .filter(cell => cell.field?.label)
    //                                 .map((cell, colIndex) => ({
    //                                     label: cell.field.label,
    //                                     index: colIndex
    //                                 }))
    //                         }));
    //                     }
    //                 } catch (e) {
    //                     console.error('❌ Error parsing Form_JSON__c for:', form.Name__c, e);
    //                 }

    //                 return {
    //                     ...form,
    //                     miniRows
    //                 };
    //             });

    //             this.filteredForms = this.forms;
    //             console.log('✅ Loaded all forms on toggle:', this.forms.length);
    //         })
    //         .catch((error) => {
    //             console.error('❌ Failed to load forms:', error);
    //         });
    // } else {
    //     // 🔁 Reset on close
    //     this.forms = [];
    //     this.filteredForms = [];
    // }
}

    

    @track isStaffUser = false;
    @track participantOptions = [];
    @track selectedParticipantId = '';
    @track staffParticipantForms = [];

    handleParticipantChange(event) {
        this.selectedParticipantId = event.detail.value;
        const selectedOption = this.participantOptions.find(p => p.value === this.selectedParticipantId);
        this.selectedParticipantName = selectedOption ? selectedOption.label : '';
    
        console.log('🔸 Participant Selected:', this.selectedParticipantId);
        console.log('👤 Participant Name:', this.selectedParticipantName);
    
        getAccessibleForms({ participantId: this.selectedParticipantId })
            .then((formRecords) => {
                console.log('📋 Accessible Forms from Apex:', formRecords);
    
                if (!formRecords || formRecords.length === 0) {
                    console.log('⚠️ No accessible forms for this participant.');
                    this.forms = [];
                    this.filteredForms = [];
                    return;
                }
    
                // 🛠 Build miniRows correctly
                this.forms = formRecords.map(form => {
                    let miniRows = [];
                    try {
                        if (form.Form_JSON__c) {
                            const parsed = JSON.parse(form.Form_JSON__c);
                            miniRows = parsed.slice(0, 4).map((row, rowIndex) => ({
                                index: rowIndex,
                                cells: row.cells
                                    .filter(cell => cell.field && cell.field.label) // Only fields with label
                                    .map((cell, colIndex) => ({
                                        label: cell.field.label,
                                        index: colIndex
                                    }))
                            }));
                        }
                    } catch (e) {
                        console.error('❌ Error parsing Form_JSON__c for mini view:', form.Name__c, e);
                    }
                    return {
                        ...form,
                        miniRows
                    };
                });
    
                this.filteredForms = this.forms;
                console.log('✅ Forms now visible to participant (with mini view):', this.filteredForms.map(f => f.Name__c));
            })
            .catch(error => {
                console.error('❌ Error fetching accessible forms:', error);
            });
    }
    
    
    
    


    processUserData(data) {
        
        return data
            .filter(user => user.staffId) // Remove users without staffId
            .map(user => ({
                ...user,
                staffId: user.staffId || 'N/A',
                userId: user.userId,
                firstName: user.firstName,
                lastName: user.lastName,
                userEmail: user.userEmail,
                userRole: user.userRole,
                userType: user.userType,
                userStatus: user.userStatus,
                staffName: user.staffName || 'N/A',
                staffGender: user.staffGender || 'N/A',
                staffFacility: user.staffFacility || 'N/A',
                staffEmail: user.staffEmail || 'N/A',
                staffUserRole1: user.staffUserRole1 || 'N/A',
                staffUserType: user.staffUserType && user.staffUserType.trim() ? user.staffUserType : 'N/A', 
                staffStatus: user.staffStatus || 'In-Progress', // Default to 'In-Progress' if null/undefined
            }));
    }

    roleOptions = [
        { label: 'Org Admin', value: 'Portal account partner Executive' },
        { label: 'Roster Admin', value: 'Portal account partner Manager' },
        { label: 'Staff', value: 'Portal account partner User' }
    ];

    // @wire(getForms)
    // wiredForms({ data, error }) {
    //     if (data) {
    //         this.forms = data;
    //     } else {
    //         console.error('Error fetching forms:', error);
    //     }
    // }
    // @wire(getFormsByClient, { clientId: '$clientId' })
    // wiredClientForms({ data, error }) {
    //     if (data && this.clientId) {
    //         this.forms = data;
    //         this.allForms = data;
    //         this.filteredForms = data
    //         console.log('✅ Client-Specific Forms Fetched:', this.forms);
    //     } else if (error) {
    //         console.error('❌ Error fetching client-specific forms:', error);
    //     }
    // }

    // @wire(getForms)
    // wiredAllForms({ data, error }) {
    //     if (data && !this.clientId) {
    //         this.forms = data;
    //         this.allForms = data;
    //         this.filteredForms = data
    //         console.log('✅ All Forms Fetched:', this.forms);
    //     } else if (error) {
    //         console.error('❌ Error fetching all forms:', error);
    //     }
    // }

//     @wire(getForms)
// wiredAllForms({ data, error }) {
//     if (data && !this.clientId) {
//         this.allForms = data; // ✅ Store all forms for filtering later
//         // Do NOT assign this.forms here

//         console.log('✅ All Forms Cached for Filtering');
//         console.log('🔁 Fetched forms:', data);
//         console.log('🧪 Sample Form_JSON__c:', data[0]?.Form_JSON__c);
//         console.log('🆔 Sample Form ID:', data[0]?.Id);
//         console.log('📛 Sample Form Name:', data[0]?.Name__c);
//     } else if (error) {
//         console.error('❌ Error fetching all forms:', error);
//     }
// }

@wire(getForms)
wiredAllForms({ data, error }) {
    if (data && !this.clientId) {
        this.allForms = data.map(form => {
            let miniRows = [];
            try {
                if (form.Form_JSON__c) {
                    const parsed = JSON.parse(form.Form_JSON__c);
                    miniRows = parsed.slice(0, 4).map((row, rowIndex) => ({
                        index: rowIndex,
                        cells: row.cells
                            .filter(cell => cell.field && cell.field.label) // Only fields with label
                            .map((cell, colIndex) => ({
                                label: cell.field.label,
                                index: colIndex
                            }))
                    }));
                }
            } catch (e) {
                console.error('❌ Error parsing Form_JSON__c for mini view:', form.Name__c, e);
            }

            return {
                ...form,
                miniRows,
                formImageUrl: this.getRandomFormImage(),
            };
        });

        this.filteredForms = this.allForms; // ✅ Assign filteredForms
        console.log('✅ All Forms Cached with Mini View Ready:', JSON.stringify(this.allForms));
    } else if (error) {
        console.error('❌ Error fetching all forms:', error);
    }
}





@wire(getFormsByClient, { clientId: '$clientId' })
wiredClientForms({ data, error }) {
    if (data && this.clientId) {
        this.allForms = data;
        // Do NOT assign this.forms here
        console.log('✅ Client-Specific Forms Cached');
    } else if (error) {
        console.error('❌ Error fetching client-specific forms:', error);
    }
}


    handleSearchChange(event) {
        this.searchQuery = event.target.value.toLowerCase();
    
        // ✅ Filter forms based on Name__c
        this.filteredForms = this.forms.filter(form => 
            form.Name__c.toLowerCase().includes(this.searchQuery)
        );
    }

    // ✅ Fetch responses based on Client ID
    @wire(getFormResponsesByClient, { clientId: '$clientId' })
    wiredResponsesByClient(result) {
        if (this.clientId) { // ✅ Trigger only when Client ID is present
            this.wiredFormResponses = result;
            if (result.data) {
                console.log('✅ Retrieved Form Responses for Client:', result.data);
                this.processFormResponses(result.data);
            } else if (result.error) {
                console.error('❌ Error fetching responses for client:', result.error);
            }
        }
    }

    // ✅ Fetch all responses when Client ID is NOT present
    @wire(getFormResponses)
    wiredAllResponses(result) {
        if (!this.clientId) { // ✅ Trigger only when Client ID is NOT present
            this.wiredFormResponses = result;
            if (result.data) {
                
                this.processFormResponses(result.data);
            } else if (result.error) {
                console.error('❌ Error fetching all responses:', result.error);
            }
        }
    }

    // ✅ Process responses and format date
    processFormResponses(data) {
        this.formResponses = data.map(response => ({
            ...response,
            FormattedDate: this.formatDate(response.CreatedDate),
            formImageUrl: this.getRandomFormImage(),
        }));
    
        this.filteredFormResponses = [...this.formResponses]; // ✅ Init filter
        this.totalFormRecords = this.filteredFormResponses.length;
        this.totalFormPages = Math.ceil(this.totalFormRecords / this.formPageSize);
        this.updatePaginatedFormResponses();
    }
    

    // ✅ Format date as "dd-MM-yyyy"
    formatDate(isoDate) {
        if (!isoDate) return 'N/A';
        const date = new Date(isoDate);
        return date.toLocaleDateString('en-GB'); // ✅ Formats as "dd/MM/yyyy"
    }
    updatePaginatedFormResponses() {
        if (this.totalFormRecords === 0) {
            this.paginatedFormResponses = [];
            return;
        }
    
        let startIndex = (this.formPageNumber - 1) * this.formPageSize;
        let endIndex = this.formPageNumber * this.formPageSize;
    
        this.paginatedFormResponses = this.filteredFormResponses.slice(startIndex, endIndex);
    
        this.disableFirstFormPage = this.formPageNumber === 1;
        this.disableLastFormPage = this.formPageNumber === this.totalFormPages;
    }
    
    // ✅ Pagination Controls
    previousFormPage() {
        if (this.formPageNumber > 1) {
            this.formPageNumber--;
            this.updatePaginatedFormResponses();
        }
    }
    
    nextFormPage() {
        if (this.formPageNumber < this.totalFormPages) {
            this.formPageNumber++;
            this.updatePaginatedFormResponses();
        }
    }
    
    firstFormPage() {
        this.formPageNumber = 1;
        this.updatePaginatedFormResponses();
    }
    
    lastFormPage() {
        this.formPageNumber = this.totalFormPages;
        this.updatePaginatedFormResponses();
    }


    
    
    getFacilityValues() {
        console.log('📥 Calling getFacilityData Apex method...');
    
        getFacilityData()
            .then(response => {
                // ✅ Map the facility list
                this.facilityOptions = response.map(record => ({
                    value: record.Id,
                    label: record.Name
                }));
    
                const facilityLength = this.facilityOptions.length;
                // console.log('✅ getFacilityData SUCCESS');
                // console.log('🏢 Total Facilities Retrieved:', facilityLength);
                // console.log('🏢 Facility Options:', JSON.stringify(this.facilityOptions, null, 2));
                const facilityLabels = this.facilityOptions.map(f => f.label);
                console.log('🏷️ All Facility Labels:', facilityLabels.join(', '));
    
                // ✅ Try to match the user's facility name to the options
                if (this.userFacility) {
                    const matchedOption = this.facilityOptions.find(opt => opt.label === this.userFacility);
                    if (matchedOption) {
                        this.facilityVal = matchedOption.value;
                        this.faclitylabel = matchedOption.label;
                        this.faclitylabel1 = matchedOption.label;
    
                        console.log('✅ User Facility Matched:', matchedOption);
                    } else {
                        console.warn('⚠️ User Facility NOT found in facilityOptions:', this.userFacility);
                        // Fallback to the first facility
                        this.facilityVal = this.facilityOptions[0]?.value || '';
                        this.faclitylabel = this.facilityOptions[0]?.label || '';
                        this.faclitylabel1 = this.facilityOptions[0]?.label || '';
                    }
                } else {
                    console.warn('⚠️ userFacility is not defined yet');
                    // Default to the first facility if no userFacility found
                    this.facilityVal = this.facilityOptions[0]?.value || '';
                    this.faclitylabel = this.facilityOptions[0]?.label || '';
                    this.faclitylabel1 = this.facilityOptions[0]?.label || '';
                }
    
                // Flag to indicate facility was loaded
                this.facilityValFalg = !!this.facilityVal;
                console.log('📍 Selected Facility Value:', this.facilityVal);
                console.log('🏷️ Selected Facility Label:', this.faclitylabel);
                this.fetchParticipants(); 
            })
            .catch(error => {
                console.error('❌ Error in getFacilityData:', error);
            });
    }
    

    getStaffValues() {
        console.log('📥 Calling getEmployeeData Apex method...');
    
        getEmployeeData()
            .then(response => {
                // Map the response into different label/value formats
                this.staffOptions = response.map(record => ({ value: record.Id, label: record.NameToDisplay__c }));
                this.staffOptions1 = response.map(record => ({ value: record.Id, label: record.Last_Name__c }));
                this.staffOptions2 = response.map(record => ({ value: record.Id, label: record.NameToDisplay__c }));
    
                const staffLength = this.staffOptions.length;
                this.staffVal = this.staffOptions[0]?.label || '';
                this.staffVal1 = this.staffOptions1[0]?.label || '';
                this.stafflabel = this.staffOptions2[0]?.label || '';

            })
            .catch(err => {
                console.error('❌ Error fetching staff data from getEmployeeData:', err);
            });
    
        // Get logged-in user's name as well
        getUserDetails()
            .then(user => {
                this.firstName = user.FirstName;
                this.lastName = user.LastName;
                console.log('🙋 Logged-in User:', this.firstName + ' ' + this.lastName);
            })
            .catch(err => {
                console.error('❌ Error fetching user details:', err);
            });
    }

     fetchParticipants() {
        console.log('📌 Attempting to fetch participants...');
        console.log('🏢 userFacility:', this.facilityVal);
    
        if (!this.facilityVal) {
            console.warn('⚠️ facilityVal not yet available. Skipping fetch.');
            return;
        }
    
        getParticipants({ facilityId: this.facilityVal })
            .then(data => {
                console.log('✅ Apex call succeeded. Raw data received:');
                console.log('👥 All Participants Raw Data:', JSON.stringify(data, null, 2));
    
                this.participants = data.map((participant, index) => {
                    console.log(`📍 Processing participant #${index + 1}: ${participant.Name}`);
                    const grantedForms = participant.Accessible_Forms__c
                        ? participant.Accessible_Forms__c.split(';')
                        : [];
    
                    console.log('🔗 Accessible_Forms__c:', participant.Accessible_Forms__c);
                    console.log('✅ Parsed granted forms:', grantedForms);
    
                    return {
                        ...participant,
                        grantedForms
                    };
                });
    
                console.log(`🎯 Total participants loaded: ${this.participants.length}`);
            })
            .catch(error => {
                console.error('❌ Error fetching participants from Apex:', error);
                if (error.body && error.body.message) {
                    console.error('📛 Apex error message:', error.body.message);
                }
            });
    }
    


    @track selectedFormTitle = '';

    handleFormClick(event) {
        const formId = event.currentTarget.dataset.id;
        this.selectedForm = this.forms.find(form => form.Id === formId);
        if (this.selectedForm) {
            this.selectedFormType = this.selectedForm.Form_Type__c || 'Unknown Form Type';
            this.selectedFormTitle = this.selectedForm.Name__c || 'Untitled Form';
            console.log('🔹 Clicked Form ID:', formId);
            console.log('🔹 Clicked Form Name:', this.selectedForm.Name__c);
            console.log('🔹 Clicked Form Type:', this.selectedFormType);

            const rawJson = this.selectedForm.Form_JSON__c;
            const parsedJson = JSON.parse(rawJson);
            this.loadFormData(parsedJson);

            // this.loadFormData(JSON.parse(this.selectedForm.Form_JSON__c));
        // const filteredRows = JSON.parse(this.selectedForm.Form_JSON__c).map(row => ({
            const filteredRows = parsedJson.map((row, rowIndex) => ({
            ...row,
            cells: row.cells.map((cell, colIndex) => {
            
                let options = [];
                let selectedOptionsArray = [];
                let selectedValues = "";
                let isTextArea = false;
                let isAlphaNumeric = false;
                let isOnlyAlphabets = false;
                let isCurrency = false;
                let isContactNumber = false;
                let isDefaultNumber = false;
                let isTimeField = false;
                let isDateField = false;
                let isCheckboxField = false;                
                let maxLength = null;
                let decimalPlaces = 0;
                let charCount = 0;
                let placeholderText = "";
                isCheckboxField = cell.field?.dataType === 'Checkbox Field';
               let floatingLabelStyle = this.getBorderStyle(cell.field?.dataType);
                let isRichText = false;
                let isRadioButton = false;
                    let selectedRadioOption = '';
                    let subInputValue = '';
                

    
                // ✅ Handle Dropdown Fields (Single & Multi-Select)
                    // if (cell.field?.dataType === 'Dropdown Field') {
                    //     placeholderText = `Select ${cell.field.label}`;
                    //     if (cell.field.selectedDropdownOption === 'singleSelect' && cell.field.singleSelectValues) {
                    //         options = cell.field.singleSelectValues.split('\n').map(option => ({
                    //             label: option.trim(),
                    //             isSelected: cell.field.value === option.trim()
                    //         })).filter(option => option.label);
                    //     } else if (cell.field.selectedDropdownOption === 'multiSelect' && cell.field.multiSelectValues) {
                    //         options = cell.field.multiSelectValues.split('\n').map(option => ({
                    //             label: option.trim(),
                    //             isSelected: false
                    //         })).filter(option => option.label);

                    //         selectedOptionsArray = cell.field.value ? cell.field.value.split(', ') : [];
                    //         selectedValues = selectedOptionsArray.join(", ");

                    //         // ✅ Mark selected options
                    //         options.forEach(option => {
                    //             if (selectedOptionsArray.includes(option.label)) {
                    //                 option.isSelected = true;
                    //             }
                    //         });
                    //     }
                    // }

                    const dropdownLabel = cell.field?.label?.trim().toLowerCase();
                    if (cell.field?.dataType === 'Dropdown Field') {
                        placeholderText = `Select ${cell.field.label}`;
    
                        if (dropdownLabel === 'facility' && this.facilityOptions.length > 0) {
                            options = this.facilityOptions.map(opt => ({
                                label: opt.label,
                                value: opt.value,
                                isSelected: cell.field.value === opt.value
                            }));
                        } else if (dropdownLabel.includes('participant') && this.participants.length > 0) {
                            options = this.participants.map(p => ({
                                label: p.Name,
                                value: p.Id,
                                isSelected: cell.field.value === p.Id
                            }));
                        } else if (dropdownLabel === 'assigned to' && this.staffOptions.length > 0) {
                            options = this.staffOptions.map(emp => ({
                                label: emp.label,
                                value: emp.value,
                                isSelected: cell.field.value === emp.value
                            }));
                        } else if (cell.field.selectedDropdownOption === 'predefinedList') {
                            const type = cell.field.predefinedListType?.toLowerCase();
                    
                            if (type === 'staff' && this.staffOptions.length > 0) {
                                options = this.staffOptions.map(opt => ({
                                    label: opt.label,
                                    value: opt.value,
                                    isSelected: cell.field.value === opt.value
                                }));
                            } else if (type === 'participant' && this.participants.length > 0) {
                                options = this.participants.map(p => ({
                                    label: p.Name,
                                    value: p.Id,
                                    isSelected: cell.field.value === p.Id
                                }));
                            } else if (type === 'facility' && this.facilityOptions.length > 0) {
                                options = this.facilityOptions.map(opt => ({
                                    label: opt.label,
                                    value: opt.value,
                                    isSelected: cell.field.value === opt.value
                                }));
                            }
                        } else if (cell.field.selectedDropdownOption === 'singleSelect' && cell.field.singleSelectValues) {
                            options = cell.field.singleSelectValues.split('\n').map(option => ({
                                label: option.trim(),
                                value: option.trim(),
                                isSelected: cell.field.value === option.trim()
                            })).filter(option => option.label);
                        } else if (cell.field.selectedDropdownOption === 'multiSelect' && cell.field.multiSelectValues) {
                            options = cell.field.multiSelectValues.split('\n').map(option => ({
                                label: option.trim(),
                                value: option.trim(),
                                isSelected: false
                            })).filter(option => option.label);
    
                            selectedOptionsArray = cell.field.value ? cell.field.value.split(', ') : [];
                            selectedValues = selectedOptionsArray.join(', ');
                            options.forEach(option => {
                                if (selectedOptionsArray.includes(option.label)) {
                                    option.isSelected = true;
                                }
                            });
                        }
                    }

    
                // ✅ Handle Text Fields
                if (cell.field?.dataType === 'Text Field') {
                    if (cell.field.selectedTextFieldOption === 'textArea') {
                        isTextArea = true;
                        maxLength = 255;
                        charCount = cell.field.value ? cell.field.value.length : 0;
                        placeholderText = `Enter ${cell.field.label} (Up to 255 chars)`;
                    } else if (cell.field.selectedTextFieldOption === 'alphaNumeric') {
                        isAlphaNumeric = true;
                        maxLength = cell.field.alphaNumericLength ? parseInt(cell.field.alphaNumericLength, 10) : 56;
                        placeholderText = `Enter ${cell.field.label} (Max ${maxLength} chars)`;
                    } else if (cell.field.selectedTextFieldOption === 'onlyAlphabets') {
                        isOnlyAlphabets = true;
                        maxLength = cell.field.onlyAlphabetsLength ? parseInt(cell.field.onlyAlphabetsLength, 10) : 55;
                        placeholderText = `Enter ${cell.field.label} (Alphabets only, Max ${maxLength} chars)`;
                    } else if (cell.field.selectedTextFieldOption === 'richText') {
                        isRichText = true;
                    } else {
                        placeholderText = `Enter ${cell.field.label}`;
                    }
                }
    
                // ✅ Handle Number Fields
                if (cell.field?.dataType === 'Number Field') {
                    switch (cell.field.selectedNumberFieldOption) {
                        case 'contactNumber':
                            isContactNumber = true;
                            maxLength = cell.field.contactNumberDigits ? parseInt(cell.field.contactNumberDigits, 10) : 10;
                            placeholderText = `Enter ${cell.field.label} (Max ${maxLength} digits)`;
                            break;
                        case 'currency':
                            isCurrency = true;
                            decimalPlaces = cell.field.decimalValue ? parseInt(cell.field.decimalValue, 10) : 2;
                            placeholderText = `Enter ${cell.field.label} (Up to ${decimalPlaces} decimals)`;
                            break;
                        case 'defaultNumber':
                        default:
                            isDefaultNumber = true;
                            placeholderText = `Enter ${cell.field.label} (Numbers Only)`;
                            break;
                    }
                }
    
            // ✅ Handle Time Field (No Conversion)
            if (cell.field?.dataType === 'Time Field') {
                isTimeField = true;
                placeholderText = `Select Time`;
            }

            // ✅ Handle Date Field (No Conversion)
            if (cell.field?.dataType === 'Date Field') {
                isDateField = true;
                placeholderText = `Select Date`;
            }
            // ✅ Handle Checkbox Field (Slider Toggle)
            if (cell.field?.dataType === 'Checkbox Field') {
                isCheckboxField = true;
            }
            if (cell.field?.dataType === 'Upload File') {
                placeholderText = 'Upload File';
                console.log('📂 Upload File field detected:', cell.field.label, 'at cell ID:', cell.id);
            }


             if (cell.field?.dataType === 'Radio Button') {
                        isRadioButton = true;
                    
                        selectedRadioOption = cell.field.value || '';
                        subInputValue = cell.subInputValue || '';
                    
                        console.log('🔘 Processing Radio Button Cell:', cell.id);
                        console.log('📌 Selected Radio Option:', selectedRadioOption);
                        console.log('📌 Sub Input Value:', subInputValue);
                    
                        cell.radioOptionsProcessed = (cell.field.radioOptions || []).map(option => {
                            const isSelected = selectedRadioOption === option.optionLabel;
                        
                            let processedSubOptions = [];
                        
                            if (option.usePredefinedOptions) {
                                const predefined = option.selectedPredefined?.toLowerCase();
                                if (predefined === 'staff') {
                                    processedSubOptions = this.staffOptions.map(opt => ({
                                        label: opt.label,
                                        isSelected: subInputValue === opt.label
                                    }));
                                } else if (predefined === 'participant') {
                                    processedSubOptions = this.participants.map(p => ({
                                        label: p.Name,
                                        isSelected: subInputValue === p.Name
                                    }));
                                } else if (predefined === 'facility') {
                                    processedSubOptions = this.facilityOptions.map(opt => ({
                                        label: opt.label,
                                        isSelected: subInputValue === opt.label
                                    }));
                                }
                            } else {
                                processedSubOptions = (option.values || []).map(val => ({
                                    label: val,
                                    isSelected: subInputValue === val
                                }));
                            }
                        
                            return {
                                ...option,
                                isSelected,
                                processedSubOptions,
                                isDropdown: option.subType === 'dropdown',
                                isTextInput: option.subType === 'text',
                                isRadioList: option.subType === 'radio',
                                hasSubInput: option.hasSubInput || false,
                                subQuestion: option.subQuestion || ''
                            };
                        });
                        
                    
                        cell.subRadioName = cell.id + '-subradio';
                    
                        console.log('✅ Final radioOptionsProcessed:', JSON.stringify(cell.radioOptionsProcessed, null, 2));
                    }
            
            const isPageBreakCell = cell.field?.dataType === 'Blank' &&
                        cell.field?.label?.toLowerCase().trim() === 'page break';
                const dataId = `row-${rowIndex}-col-${colIndex}`;

    
                return {
                    ...cell,
                    dataId: dataId,
                    isVisible: !(cell.field?.dataType === 'Blank' &&
                        cell.field?.label?.toLowerCase().trim() === 'page break') &&
                      cell.style !== 'display: none;',           
                    isTextField: cell.field?.dataType === 'Text Field' && !isTextArea && !isAlphaNumeric && !isOnlyAlphabets && !isRichText,
                    isAlphaNumeric: isAlphaNumeric,
                    isOnlyAlphabets: isOnlyAlphabets,
                    isTextArea: isTextArea,
                    isNumberField: cell.field?.dataType === 'Number Field',
                    isCurrency: isCurrency,
                    isContactNumber: isContactNumber,
                    isDefaultNumber: isDefaultNumber,
                    isTimeField: isTimeField,
                    isDateField: isDateField,
                    isCheckboxField: isCheckboxField,
                    floatingLabelStyle: floatingLabelStyle,
                    isDropdownField: cell.field?.dataType === 'Dropdown Field',
                    isMultiSelect: cell.field?.selectedDropdownOption === 'multiSelect',
                    hasComment: cell.field?.comments && cell.field.comments.trim() !== '',
                    placeholderText: placeholderText,
                    maxLength: maxLength,
                    decimalPlaces: decimalPlaces,
                    isDropdownOpen: false,
                    selectedOptionsArray: selectedOptionsArray,
                    selectedValues: selectedValues,
                    charCount: charCount,
                    isUploadField: cell.field?.dataType === 'Upload File',
                    isRichText: isRichText,
                    isRadioButton,
                        selectedRadioOption,
                        subInputValue,
    
                    field: {
                        ...cell.field,
                        value: cell.field?.value || '',
                        options: options
                    },
    
                    hasContent: !!(cell.field?.label ||
                        cell.isTextField ||
                        cell.isAlphaNumeric ||
                        cell.isOnlyAlphabets ||
                        cell.isNumberField ||
                        cell.isCurrency ||
                        cell.isContactNumber ||
                        cell.isDefaultNumber ||
                        cell.isTimeField  ||
                        cell.isDateField ||
                        cell.isCheckboxField ||
                        cell.isDropdownField ||
                        cell.isUploadField ||
                        cell.isRadioButton ||
                        cell.isTextArea)
                };
            })
        }));

        this.tableRows = filteredRows;



        this.stepPagedRows = [];
let currentStepPage = [];

filteredRows.forEach(row => {
    const isPageBreak = row.cells.some(cell =>
        cell.field?.dataType === 'Blank' &&
        cell.field?.label?.toLowerCase().trim() === 'page break'
    );

    if (isPageBreak) {
        currentStepPage.push({
            ...row,
            isPageBreak: true
        });

        if (currentStepPage.length > 0) {
            this.stepPagedRows.push([...currentStepPage]);
            currentStepPage = [];
        }
    } else {
        currentStepPage.push(row);
    }
});

if (currentStepPage.length > 0) {
    this.stepPagedRows.push(currentStepPage);
}

this.stepCurrentPageIndex = 0;
this.updateStepVisibleRows();
 // Render only first step's rows



        this.isFormSelected = true;
        console.log('✅ isFormSelected set to true. UI should render form.');
    }}

    paginationHelper() {
        if (this.totalRecords === 0) {
            this.noRecordsFlag = true;
            return;
        }

        this.noRecordsFlag = false;
        this.recordsToDisplay = [];

        // Calculate total pages
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);

        // Adjust page number
        if (this.pageNumber < 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber > this.totalPages) {
            this.pageNumber = this.totalPages;
        }

        // Set records to display
        let startIndex = (this.pageNumber - 1) * this.pageSize;
        let endIndex = this.pageNumber * this.pageSize;
        this.recordsToDisplay = this.filteredParticipants.slice(startIndex, endIndex);

        // Update button states
        this.bDisableFirst = this.pageNumber === 1;
        this.bDisableLast = this.pageNumber === this.totalPages;
    }

      getBorderStyle(dataType) {
        return ['Checkbox Field', 'Radio Button'].includes(dataType)
            ? 'border: 1px solid transparent;'
            : 'border: 1px solid black;';
    }

    previousPage() {
        if (this.pageNumber > 1) {
            this.pageNumber--;
            this.paginationHelper();
        }
    }

    nextPage() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber++;
            this.paginationHelper();
        }
    }

    firstPage() {
        this.pageNumber = 1;
        this.paginationHelper();
    }

    lastPage() {
        this.pageNumber = this.totalPages;
        this.paginationHelper();
    }

    get showSubmitButton() {
    return this.totalStepPages === 1 || this.stepCurrentPageIndex === this.totalStepPages - 1;
}

    @track selectedParticipantStaffNames = '';
    @track grantSearchQuery = '';
    @track filteredAvailableForms = [];
    handleGrantFormSearch(event) {
        this.grantSearchQuery = event.target.value.toLowerCase();
        this.filteredAvailableForms = this.availableForms.filter(form =>
            form.Name__c.toLowerCase().includes(this.grantSearchQuery)
        );
    }
    

    handleGrantAccessClick(event) { 
        this.isLoading = true;
        this.selectedParticipantId = event.target.dataset.id;
    
        const participant = this.participants.find(p => p.Id === this.selectedParticipantId);
        this.selectedParticipantName = participant ? participant.Name : 'Unknown';
        this.selectedParticipantStaffNames = participant?.visibleStaffMembers?.map(staff => staff.name).join(', ') || 'No Staff Assigned';
    
        console.log('🔹 Opening Grant Access for Participant:', this.selectedParticipantName);
    
        getAvailableForms()
            .then(data => {
                return getAccessibleForms({ participantId: this.selectedParticipantId })
                    .then(grantedForms => {
                        // ✅ Extract only the IDs from the returned form records
                        this.selectedForms = new Set(grantedForms.map(f => f.Id));
    
                        // ✅ Mark checkboxes as selected based on IDs
                        this.availableForms = data.map(form => ({
                            ...form,
                            isSelected: this.selectedForms.has(form.Id)
                        }));
    
                        // ✅ Sync filtered list for search
                        this.filteredAvailableForms = [...this.availableForms];
    
                        // ✅ Show the modal
                        this.isGrantAccessPopupOpen = true;
                        this.isLoading = false;
                    });
            })
            .catch(error => {
                console.error('❌ Error fetching available or granted forms:', error);
                this.isLoading = false;
            });
    }
    
    

    // ✅ Getter method to check if a form is selected
    isFormSelected(formId) {
        return this.selectedForms.has(formId);
    }

    // ✅ Handle Checkbox Selection
    handleFormSelection(event) {
        const formId = event.target.value;
        const isChecked = event.target.checked;
    
        // ✅ Update selectedForms set
        if (isChecked) {
            this.selectedForms.add(formId);
        } else {
            this.selectedForms.delete(formId);
        }
    
        // ✅ Update both lists with the new selection state
        this.availableForms = this.availableForms.map(form => ({
            ...form,
            isSelected: this.selectedForms.has(form.Id)
        }));
    
        this.filteredAvailableForms = this.filteredAvailableForms.map(form => ({
            ...form,
            isSelected: this.selectedForms.has(form.Id)
        }));
    
        console.log('🔹 Updated Selected Forms:', Array.from(this.selectedForms));
    }
    
    
    // ✅ Update Multi-Picklist on Grant Access
    grantAccess() {
        console.log('🔹 Initiating Grant Access...');
    
        if (this.selectedForms.size === 0) {
            this.showToast('Error', 'Please select at least one form to grant access.', 'error');
            return;
        }
    
        console.log('🔹 Selected Form IDs:', Array.from(this.selectedForms));
        console.log('🔹 Participant ID:', this.selectedParticipantId);
    
        grantAccessToParticipant({ 
            participantId: this.selectedParticipantId, 
            selectedFormIds: Array.from(this.selectedForms) 
        })
        .then(() => {
            console.log('✅ Grant Access Success!');
            this.showToast('Success', 'Access granted successfully!', 'success');
            this.closeGrantAccessPopup();
    
            // ✅ Re-fetch the accessible forms for selected participant
            return getAccessibleForms({ participantId: this.selectedParticipantId });
        })
        .then(formRecords => {
            if (!formRecords || formRecords.length === 0) {
                this.forms = [];
                this.filteredForms = [];
                console.log('🔹 No forms returned after grant.');
            } else {
                this.forms = formRecords;
                this.filteredForms = formRecords;
                console.log('🔹 Refreshed forms:', this.filteredForms.map(f => f.Name__c));
            }
        })
        
        .catch(error => {
            console.error('❌ Error granting access:', JSON.stringify(error));
    
            if (error && error.body && error.body.message) {
                console.error('📌 Apex Debug Log:', error.body.message);
            }
    
            this.showToast('Error', 'Failed to grant access.', 'error');
        });
    }
    
    
    
    getRandomFormImage() {
    const index = Math.floor(Math.random() * formImages.length);
    return formImages[index];
}
 
    
    

    closeGrantAccessPopup() {
        this.isGrantAccessPopupOpen = false;
        this.selectedForms.clear();
    }


//  handleView(event) {
//         this.isViewMode = true;
//         this.selectedResponseId = event.currentTarget.dataset.id;
//         const response = this.formResponses.find(resp => resp.Id === this.selectedResponseId);
        
//         if (response) {
//             const formJson = JSON.parse(response.Response_JSON__c);
//             console.log('🔹 DATA>>>>>', JSON.stringify(formJson));
//             this.prepareViewTable(formJson);
    
//             // ✅ Set Form Title and Type for header display
//             this.selectedFormType = response.Form_Type__c || 'Unknown Form Type';
//             this.selectedFormTitle = response.Name__c || 'Untitled Form';

//             this.selectedParticipantName = response.Participant_Name__c;
//         this.selectedSubmissionDate = response.FormattedDate;

//         console.log('🔹 selectedParticipantName ID:', this.selectedParticipantName);
//         console.log('🔹 selectedSubmissionDate ID:', this.selectedSubmissionDate);
        
    
//             // ✅ Ensure selected values are marked properly in dropdown options
//             this.tableRows = formJson.map(row => ({
//                 ...row,
//                 cells: row.cells.map(cell => {
//                     if (cell.isDropdownField && cell.isMultiSelect) {
//                         let selectedOptionsArray = cell.field.value ? cell.field.value.split(", ") : [];
//                         cell.field.options.forEach(option => {
//                             option.isSelected = selectedOptionsArray.includes(option.label);
//                         });
//                         cell.selectedValues = cell.field.value;
//                     }
//                     return cell;
//                 })
//             }));
//         }
//     }


handleView(event) {
    // 🔄 Reset previous view state to avoid showing stale data
    console.log('📍 handleView triggered');
    this.viewTableData = [];
    this.tableRows = [];
    this.selectedFormTitle = '';
    this.selectedFormType = '';
    this.selectedParticipantName = '';
    this.selectedSubmissionDate = '';

    // ✅ Activate view mode
    this.isViewMode = true;

    // ✅ Get the ID of the form response clicked
    this.selectedResponseId = event.currentTarget.dataset.id;
    console.log('🆔 Selected Response ID:', this.selectedResponseId);

    // ✅ Find the full response object
    const response = this.formResponses.find(resp => resp.Id === this.selectedResponseId);

    if (response) {
        console.log('📄 Matched Response:', response);

        try {
            const formJson = JSON.parse(response.Response_JSON__c);
            console.log('📄 Parsed Form JSON:', JSON.stringify(formJson));

            // ✅ Prepare the view table rows from JSON
            this.prepareViewTable(formJson);
            console.log('✅ Called prepareViewTable() successfully');

            // ✅ Set header details
            this.selectedFormType = response.Form_Type__c || 'Unknown Form Type';
            this.selectedFormTitle = response.Name__c || 'Untitled Form';
            this.selectedParticipantName = response.Participant_Name__c;
            this.selectedSubmissionDate = response.FormattedDate;

            console.log('📋 Form Title:', this.selectedFormTitle);
            console.log('📂 Form Type:', this.selectedFormType);
            console.log('👤 Participant Name:', this.selectedParticipantName);
            console.log('📅 Submission Date:', this.selectedSubmissionDate);

            // ✅ Prepare dropdown selections if any
            this.tableRows = formJson.map((row, rowIndex) => ({
                ...row,
                cells: row.cells.map((cell, colIndex) => {
                    if (cell.isDropdownField && cell.isMultiSelect) {
                        let selectedOptionsArray = cell.field.value ? cell.field.value.split(", ") : [];
                        cell.field.options.forEach(option => {
                            option.isSelected = selectedOptionsArray.includes(option.label);
                        });
                        cell.selectedValues = cell.field.value;
                        console.log(`🔽 Updated multiselect for cell [${rowIndex}][${colIndex}]`, selectedOptionsArray);
                    }
                    return cell;
                })
            }));
        } catch (e) {
            console.error('❌ Error parsing Response_JSON__c or preparing view:', e);
        }
    } else {
        console.warn('⚠️ No matching response found for ID:', this.selectedResponseId);
    }
}



    @track selectedParticipantName;
@track selectedSubmissionDate;

    

    closeView() {
        this.isViewMode = false;
        this.isFormSelected = false;
    }
    // loadFormData(formJson, isViewMode) {
    //     const processedRows = formJson.map(row => ({
    //         ...row,
    //         cells: row.cells.map(cell => ({
    //             ...cell,
    //             isVisible: cell.style !== 'display: none;',
    //             field: { ...cell.field, value: cell.field?.value || '' },
    //             hasContent: !!(cell.field?.label || cell.field?.value),
    //             readonlyValue: this.computeReadonlyValue(cell, isViewMode)
    //         }))
    //     }));
    
       
    // }



   loadFormData(formJson, isViewMode) {
    const processedRows = formJson.map((row, rowIndex) => ({
        ...row,
        cells: row.cells.map((cell, colIndex) => {
            const newCell = {
                ...cell,
                isVisible: cell.style !== 'display: none;',
                field: { ...cell.field },
                hasContent: !!(cell.field?.label || cell.field?.value),
                id: cell.id || `cell-${rowIndex}-${colIndex}`
            };

            const field = newCell.field;
            const fieldValue = field?.value || '';

            // ✅ Normalize checkbox field
            if (newCell.isCheckboxField) {
                field.value = !!fieldValue;
            }

            // ✅ Normalize single-select dropdown
            if (newCell.isDropdownField && !newCell.isMultiSelect && Array.isArray(field.options)) {
                field.options = field.options.map(opt => ({
                    ...opt,
                    isSelected: opt.label === fieldValue
                }));
                newCell.selectedValues = fieldValue;
            }

            // ✅ Normalize multi-select dropdown
            if (newCell.isDropdownField && newCell.isMultiSelect && Array.isArray(field.options)) {
                const selectedLabels = fieldValue.split(',').map(label => label.trim());
                field.options = field.options.map(opt => ({
                    ...opt,
                    isSelected: selectedLabels.includes(opt.label)
                }));
                newCell.selectedValues = selectedLabels.join(', ');
            }

            // ✅ Handle radio button: extract selected + optional subinput
            if (newCell.isRadioButton || field?.dataType === 'Radio Button') {
                const parts = fieldValue.split(' - ');
                newCell.selectedRadioOption = parts[0] || '';
                newCell.subInputValue = parts[1] || '';
            }

            // ✅ Compute readonly value for view mode
            newCell.readonlyValue = this.computeReadonlyValue(newCell, isViewMode);

            return newCell;
        })
    }));

    // ✅ Assign processed rows to tableRows
    this.tableRows = processedRows;

    // ✅ Rebuild paginated rows (stepPagedRows)
    this.stepPagedRows = [];
    let currentPage = [];

    processedRows.forEach(row => {
        const isPageBreak = row.cells.some(cell =>
            cell.field?.dataType === 'Blank' &&
            cell.field?.label?.toLowerCase().trim() === 'page break'
        );

        if (isPageBreak) {
            if (currentPage.length > 0) {
                this.stepPagedRows.push([...currentPage]);
            }
            currentPage = [row]; // page break row starts a new page
        } else {
            currentPage.push(row);
        }
    });

    if (currentPage.length > 0) {
        this.stepPagedRows.push(currentPage);
    }

    // ✅ Reset to first step and update visible rows
    this.stepCurrentPageIndex = 0;
    this.updateStepVisibleRows();
}

    updateStepVisibleRows() {
        // Only show fields for current step
        this.tableRows = this.stepPagedRows[this.stepCurrentPageIndex].map(row => ({
            ...row,
            cells: row.cells.map(cell => ({
                ...cell,
                isVisible: !(cell.field?.dataType === 'Blank' &&
                             cell.field?.label?.toLowerCase().trim() === 'page break') &&
                            cell.style !== 'display: none;',
                hasContent: !!(cell.field?.label || cell.field?.value)
            }))
        }));
    }
    
    
    
    
    get isFirstStepPage() {
        return this.stepCurrentPageIndex === 0;
    }
    
    get isLastStepPage() {
        return this.stepCurrentPageIndex === this.stepPagedRows.length - 1;
    }
    
    get stepCurrentPageDisplay() {
        return this.stepCurrentPageIndex + 1;
    }
    
    get totalStepPages() {
        return this.stepPagedRows.length;
    }
    
    get stepCurrentPageRows() {
        return this.stepPagedRows[this.stepCurrentPageIndex] || [];
    }
    
    
    goToNextStepPage() {
        if (!this.isLastStepPage) {
            this.stepCurrentPageIndex++;
            this.updateStepVisibleRows();
        }
    }
    
    goToPreviousStepPage() {
        if (!this.isFirstStepPage) {
            this.stepCurrentPageIndex--;
            this.updateStepVisibleRows();
        }
    }
    
    
    get showStepProgressIndicator() {
        return this.stepPagedRows && this.stepPagedRows.length > 1;
    }
    
    get stepProgressFillStyle() {
        const total = this.stepPagedRows?.length || 1;
        const completed = this.stepCurrentPageIndex;
        const percentage = total > 1 ? (completed / (total - 1)) * 100 : 0;
        return `width: ${percentage}%;`;
    }
    
    get stepVisualProgressSteps() {
        return this.stepPagedRows.map((_, index) => {
            const isCompleted = index < this.stepCurrentPageIndex;
            const isActive = index === this.stepCurrentPageIndex;
    
            return {
                index,
                stepIndexPlusOne: index + 1,
                label: index === this.stepPagedRows.length - 1 ? 'Complete' : `Step ${index + 1}`,
                isCompleted,
                isActive,
                circleClass: isCompleted ? 'circle completed' : isActive ? 'circle active' : 'circle upcoming',
                labelClass: isCompleted ? 'step-label completed' : isActive ? 'step-label active' : 'step-label upcoming'
            };
        });
    }
    
    handleStepClick(event) {
        const stepIndex = parseInt(event.currentTarget.dataset.index, 10) - 1;
        if (stepIndex >= 0 && stepIndex < this.stepPagedRows.length) {
            this.stepCurrentPageIndex = stepIndex;
            this.updateStepVisibleRows();
        }
    }
    
    

 computeReadonlyValue(cell, isViewMode) {
        if (!isViewMode || !cell.field) return '-';
    
        if (
            cell.isTextField || cell.isTextArea || cell.isAlphaNumeric ||
            cell.isOnlyAlphabets || cell.isNumberField ||
            cell.isTimeField || cell.isDateField
        ) {
            return cell.field.value || '-';
        }
    
        if (cell.isCheckboxField) {
            return cell.field.value ? 'utility:check' : 'utility:close';
        }
    
        if (cell.isDropdownField) {
            return cell.selectedValues || cell.field.value || '-';
        }
    
        if (cell.isRadioButton) {
            const selectedOption = cell.selectedRadioOption || cell.field?.value || '';
            const subValue = cell.subInputValue || cell.field?.subInputValue || '';
    
            if (!subValue && Array.isArray(cell.radioOptionsProcessed)) {
                const matched = cell.radioOptionsProcessed.find(opt => opt.isSelected);
                if (matched?.processedSubOptions?.length > 0) {
                    const selectedSub = matched.processedSubOptions.find(sub => sub.isSelected);
                    if (selectedSub) {
                        return `${selectedOption} - ${selectedSub.label}`;
                    }
                }
            }
    
            return subValue ? `${selectedOption} - ${subValue}` : selectedOption || '-';
        }
    
        return cell.field.value || '-';
    }
    
    // prepareViewTable(formJson) {
    //     let tableData = [];
    //     let pageCounter = 1;
    //     let currentPage = 1;
    
    //     // Insert first page heading
    //     tableData.push({
    //         isPageBreak: true,
    //         pageNumber: currentPage,
    //         arrow: '▼',
    //         isVisible: true,
    //         key: `page-${currentPage}`
    //     });
    
    //     formJson.forEach(row => {
    //         const isPageBreak = row.cells.some(cell =>
    //             cell.field?.dataType === 'Blank' &&
    //             cell.field?.label?.toLowerCase().trim() === 'page break'
    //         );
    
    //         if (isPageBreak) {
    //             currentPage++;
    //             tableData.push({
    //                 isPageBreak: true,
    //                 pageNumber: currentPage,
    //                 arrow: '▶',
    //                 isVisible: false,
    //                 key: `page-${currentPage}`
    //             });
    //             return; // skip rendering actual page break cell
    //         }
    
    //         row.cells.forEach(cell => {
    //             // ❌ Skip empty cells
    //             if (
    //                 cell?.field &&
    //                 cell.field.label &&
    //                 cell.field.label.trim() !== ''
    //             ) {
    //                 const isUploadFile = cell.field.dataType === 'Upload File';
    //                 const isRichText = cell.field.dataType === 'Text Field' && cell.field.selectedTextFieldOption === 'richText';
    //                 const isCheckbox = dataType === 'Checkbox Field';
    //                 const previewUrl = cell.field.value;
    //                 const downloadUrl = cell.field.downloadLink;
    //                 const isImage = previewUrl && (
    //                     /\.(jpg|jpeg|png|gif)$/i.test(previewUrl) ||
    //                     previewUrl.includes('rendition=ORIGINAL_JPG')
    //                 );
    
    //                 tableData.push({
    //                     id: cell.id,
    //                     label: cell.field.label,
    //                     value: this.getFormattedValue(cell),
    //                     isCheckbox: cell.isCheckboxField,
    //                     isUploadFile,
    //                     uploadUrl: previewUrl,
    //                     isImageFile: isImage,
    //                     isRegularField: !isUploadFile && !cell.isCheckboxField && !isRichText,
    //                     downloadUrl,
    //                     finalDownloadUrl: downloadUrl || previewUrl,
    //                     isRichText,
    //                     belongsToPage: currentPage,
    //                     isVisible: currentPage === 1,
    //                     isRadioButton: cell.field.dataType === 'Radio Button',
    //                     isRegularField: !isUploadFile && !cell.isCheckboxField && !isRichText && !cell.isRadioButton
    //                 });
    //             }
    //         });
    //     });
    
    //     this.viewTableData = tableData;
    // }
    
    prepareViewTable(formJson) {
    console.log('📋 prepareViewTable() called');
    let tableData = [];
    let pageCounter = 1;
    let currentPage = 1;

    // Insert first page heading
    tableData.push({
        isPageBreak: true,
        pageNumber: currentPage,
        arrow: '▼',
        isVisible: true,
        key: `page-${currentPage}`
    });

    formJson.forEach((row, rowIndex) => {
        const isPageBreak = row.cells.some(cell =>
            cell.field?.dataType === 'Blank' &&
            cell.field?.label?.toLowerCase().trim() === 'page break'
        );

        if (isPageBreak) {
            currentPage++;
            tableData.push({
                isPageBreak: true,
                pageNumber: currentPage,
                arrow: '▶',
                isVisible: false,
                key: `page-${currentPage}`
            });
            return; // skip rendering actual page break cell
        }

        row.cells.forEach((cell, colIndex) => {
            // ❌ Skip empty cells
            if (
                cell?.field &&
                cell.field.label &&
                cell.field.label.trim() !== ''
            ) {
                const dataType = cell.field.dataType;
                const isUploadFile = dataType === 'Upload File';
                const isRichText = dataType === 'Text Field' && cell.field.selectedTextFieldOption === 'richText';
                const isRadioButton = dataType === 'Radio Button';
                const isCheckbox = dataType === 'Checkbox Field';
                const isChecked = isCheckbox && (cell.field.value === true || cell.field.value === 'true');

                const previewUrl = cell.field.value;
                const downloadUrl = cell.field.downloadLink;
                const isImage = typeof previewUrl === 'string' && (
                    /\.(jpg|jpeg|png|gif)$/i.test(previewUrl) ||
                    previewUrl.includes('rendition=ORIGINAL_JPG')
                );


                // 🔍 Debug logs
                console.log(`🧩 Row ${rowIndex}, Cell ${colIndex}`);
                console.log(`   Label: ${cell.field.label}`);
                console.log(`   Data Type: ${dataType}`);
                console.log(`   Value:`, cell.field.value);
                console.log(`   isCheckbox:`, isCheckbox);
                const checkboxDisplayValue = cell.field.value === true || cell.field.value === 'true';

if (isCheckbox) {
    console.log('📦 checkboxDisplayValue:', checkboxDisplayValue);
}

                tableData.push({
                    id: cell.id,
                    label: cell.field.label,
                    value: this.getFormattedValue(cell),
isCheckbox: cell.isCheckboxField || cell.field?.dataType === 'Checkbox Field',
                    isUploadFile,
                    uploadUrl: previewUrl,
                    isImageFile: isImage,
                    downloadUrl,
                    finalDownloadUrl: downloadUrl || previewUrl,
                    isRichText,
                    belongsToPage: currentPage,
                    isVisible: currentPage === 1,
                    isRadioButton,
                    isRegularField: !isUploadFile && !isCheckbox && !isRichText && !isRadioButton
                });
            }
        });
    });

    console.log('✅ Final viewTableData:', JSON.stringify(tableData, null, 2));
    this.viewTableData = tableData;
}

   getFormattedValue(cell) {
    const dataType = cell.field?.dataType;

    // ✅ Checkbox Field (simplified: return "true" or "false" as string)
    if (cell.isCheckboxField || cell.field?.dataType === 'Checkbox Field') {
        return cell.field.value === true || cell.field.value === 'true'
            ? 'action:approval'
            : 'action:close';
    }

    // ✅ Multi-select dropdown
    if (cell.isDropdownField && cell.isMultiSelect) {
        if (Array.isArray(cell.selectedValues)) {
            return cell.selectedValues.join(', ');
        } else if (typeof cell.selectedValues === 'string') {
            return cell.selectedValues;
        } else {
            return '—';
        }
    }

    // ✅ Single-select dropdown
    if (cell.isDropdownField) {
        return cell.field.value ? cell.field.value : '—';
    }

    // ✅ Upload File
    if (dataType === 'Upload File') {
        return cell.field.value || 'No File';
    }

    // ✅ Date Field
    if (dataType === 'Date Field') {
        return this.formatDateDD(cell.field.value);
    }

    // ✅ Rich Text
    if (dataType === 'Text Field' && cell.field?.selectedTextFieldOption === 'richText') {
        return cell.field.value || '<span>No Rich Text</span>';
    }

    // ✅ Radio Button
    if (cell.isRadioButton || dataType === 'Radio Button') {
        const selectedOption = cell.selectedRadioOption || cell.field?.value || '';
        const subValue = cell.subInputValue || '';

        if (!subValue && Array.isArray(cell.radioOptionsProcessed)) {
            const matched = cell.radioOptionsProcessed.find(opt => opt.isSelected);
            if (matched?.processedSubOptions?.length > 0) {
                const selectedSub = matched.processedSubOptions.find(sub => sub.isSelected);
                if (selectedSub) {
                    return `${selectedOption} - ${selectedSub.label}`;
                }
            }
        }

        return subValue ? `${selectedOption} - ${subValue}` : selectedOption || '—';
    }

    // ✅ Fallback
    return cell.field.value != null ? String(cell.field.value) : '—';
} 
    
    
    
    togglePageSection(event) {
        const pageNumber = parseInt(event.currentTarget.dataset.page, 10);
    
        this.viewTableData = this.viewTableData.map(item => {
            if (item.isPageBreak && item.pageNumber === pageNumber) {
                const isVisible = !item.isVisible;
                return {
                    ...item,
                    arrow: isVisible ? '▼' : '▶',
                    isVisible
                };
            }
    
            if (!item.isPageBreak && item.belongsToPage === pageNumber) {
                const pageBreakRow = this.viewTableData.find(p => p.isPageBreak && p.pageNumber === pageNumber);
                return {
                    ...item,
                    isVisible: pageBreakRow ? !pageBreakRow.isVisible : item.isVisible
                };
            }
    
            return item;
        });
    }
    
    
    
    
    removeSelectedOption(event) {
        const cellId = event.target.dataset.id;
        const optionValue = event.target.dataset.value;
    
        this.tableRows = this.tableRows.map(row => ({
            ...row,
            cells: row.cells.map(cell => {
                if (cell.id === cellId) {
                    let updatedOptions = cell.field.options.map(option => ({
                        ...option,
                        isSelected: option.label === optionValue ? false : option.isSelected
                    }));
    
                    let selectedValues = updatedOptions
                        .filter(option => option.isSelected)
                        .map(option => option.label)
                        .join(", ");
    
                    return {
                        ...cell,
                        selectedValues: selectedValues,
                        field: { ...cell.field, options: updatedOptions, value: selectedValues }
                    };
                }
                return cell;
            })
        }));
    }

    isCheckboxChecked(value) {
    return value === true || value === 'true';
}

 


    formatDateDD(isoDate) {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`; // "dd-mm-yyyy"
}

    triggerFileInput(event) {
        const cellId = event.target.dataset.id;
        const inputEl = this.template.querySelector(`input[data-cell-id="${cellId}"]`);
        if (inputEl) {
            inputEl.click();
        } else {
            console.warn('⚠️ File input not found for cell:', cellId);
        }
    }
    
    
    handleEdit(event) {
        this.isEditing = true;
        this.selectedResponseId = event.currentTarget.dataset.id;
    
        const response = this.formResponses.find(resp => resp.Id === this.selectedResponseId);
        if (response) {
            const parsedResponseJson = JSON.parse(response.Response_JSON__c || '[]');

        // ✅ Log field labels before loadFormData
        const preLabels = parsedResponseJson
            .flatMap(row => row.cells)
            .filter(cell =>
                cell.field?.label &&
                cell.field?.dataType !== 'Blank'
            )
            .map(cell => cell.field.label);

        console.log('📋 Field Labels BEFORE loadFormData():', preLabels);

        // ✅ Log full response data
        console.log('📥 Parsed Response Data for Edit:', parsedResponseJson);
            this.loadFormData(JSON.parse(response.Response_JSON__c), false);
            this.isFormSelected = true;
    
            // this.updateStepVisibleRows();
    
            // ✅ Log all visible field labels on the current page
            const visibleLabels = this.tableRows
                .flatMap(row => row.cells)
                .filter(cell =>
                    cell.isVisible &&
                    cell.field?.label &&
                    cell.field?.dataType !== 'Blank'
                )
                .map(cell => cell.field.label);
    
            console.log('🧾 Visible Field Labels on Edit:', visibleLabels);
        } else {
            console.error("Error: Response not found.");
        }
    }
    
    


    handleDelete(event) {
        const responseId = event.currentTarget.dataset.id;
        
        if (!responseId) {
            console.error('Error: Response ID is undefined');
            return;
        }
    
        deleteFormResponse({ responseId })
            .then(() => {
                this.showToast('Success', 'Form response deleted successfully!', 'success');
                return refreshApex(this.wiredFormResponses); // Refresh responses after deletion
            })
            .catch(error => {
                console.error('Error deleting response:', error);
                this.showToast('Error', 'Error deleting response', 'error');
            });
    }
    
    
    
    
    
    isOptionSelected(cell, option) {
        return cell.selectedOptionsArray.includes(option);
    }
    
    

    @track isCommentVisible = false;
    @track selectedComment = '';

handleCommentClick(event) {
    this.selectedComment = event.target.dataset.comment;
    this.isCommentVisible = true;
}

closeCommentSidebar() {
    this.isCommentVisible = false;
}

// handleInputChange(event) {
//     const { id } = event.target.dataset;
//     const rowIdx = id.split('-')[1];
//     const colIdx = id.split('-')[2];
//     const row = this.tableRows[rowIdx];
//     const cell = row?.cells[colIdx];

//     if (cell && cell.field) {
//         let newValue;

//         // ✅ Handle checkbox
//         if (event.target.type === 'checkbox') {
//             newValue = event.target.checked;
//             cell.field.value = newValue;
//         } 
//         // ✅ Single-select dropdown
//         else if (cell.isDropdownField && !cell.isMultiSelect) {
//             newValue = event.target.value;
//             cell.field.value = newValue;
//             cell.selectedValues = newValue;

//             if (Array.isArray(cell.field.options)) {
//                 cell.field.options = cell.field.options.map(opt => ({
//                     ...opt,
//                     isSelected: opt.label === newValue
//                 }));
//             }

//             console.log(`✅ Single-Select Updated: ${cell.field.value}`);
//         } 
//         // ✅ Multi-select dropdown
//         else if (cell.isDropdownField && cell.isMultiSelect) {
//             newValue = Array.from(
//                 event.target.selectedOptions,
//                 option => option.value
//             ).join(", ");
//             cell.field.value = newValue;
//             console.log(`✅ Multi-Select Updated: ${cell.field.value}`);
//         } 
//         // ✅ Other input types
//         else {
//             newValue = event.target.value;
//             cell.field.value = newValue;
//         }

//         // ✅ Remove error highlight if valid
//         if (
//             cell.field.isRequired &&
//             newValue !== undefined &&
//             newValue !== null &&
//             newValue.toString().trim() !== ''
//         ) {
//             event.target.classList.remove('highlight-error');
//         }
//     }

//     // ✅ Sync updated data back
//     if (
//         Array.isArray(this.stepPagedRows) &&
//         this.stepPagedRows.length > this.stepCurrentPageIndex
//     ) {
//         this.stepPagedRows[this.stepCurrentPageIndex] = JSON.parse(JSON.stringify(this.tableRows));
//     }
// }


handleInputChange(event) {
    const cellId = event.target.dataset.id;
    const inputType = event.target.type;
    let newValue = inputType === 'checkbox' ? event.target.checked : event.target.value;

    // 🔄 Update the actual data source: stepPagedRows (across all pages)
    for (let page of this.stepPagedRows) {
        for (let row of page) {
            for (let cell of row.cells) {
                if (cell.id === cellId && cell.field) {

                    // ✅ Checkbox
                    if (inputType === 'checkbox') {
                        cell.field.value = newValue;
                    }

                    // ✅ Single-select dropdown
                    else if (cell.isDropdownField && !cell.isMultiSelect) {
                        cell.field.value = newValue;
                        cell.selectedValues = newValue;

                        if (Array.isArray(cell.field.options)) {
                            cell.field.options = cell.field.options.map(opt => ({
                                ...opt,
                                isSelected: opt.label === newValue
                            }));
                        }
                        console.log(`✅ Single-Select Updated: ${cell.field.value}`);
                    }

                    // ✅ Multi-select dropdown (assumes native <select multiple>)
                    else if (cell.isDropdownField && cell.isMultiSelect) {
                        newValue = Array.from(
                            event.target.selectedOptions,
                            option => option.value
                        ).join(', ');
                        cell.field.value = newValue;
                        console.log(`✅ Multi-Select Updated: ${cell.field.value}`);
                    }

                    // ✅ Default: Text, date, time, number, etc.
                    else {
                        cell.field.value = newValue;
                    }

                    // ✅ Remove error highlight if valid
                    if (
                        cell.field.isRequired &&
                        newValue !== undefined &&
                        newValue !== null &&
                        newValue.toString().trim() !== ''
                    ) {
                        event.target.classList.remove('highlight-error');
                    }

                    return; // ✅ Exit after updating matching cell
                }
            }
        }
    }
}




    handleTextAreaInput(event) {
        const cellId = event.target.dataset.id;
        const textValue = event.target.value;
    
        this.tableRows = this.tableRows.map(row => ({
            ...row,
            cells: row.cells.map(cell => {
                if (cell.id === cellId) {
                    return {
                        ...cell,
                        field: {
                            ...cell.field,
                            value: textValue
                        },
                        charCount: textValue.length
                    };
                }
                return cell;
            })
        }));
    }

    restrictAlphaNumeric(event) {
        const char = event.key;
        const regex = /^[A-Za-z0-9]$/; // ✅ Only allows letters and numbers
        if (!regex.test(char)) {
            event.preventDefault();
        }
    }
    
    validateAlphaNumeric(event) {
        event.target.value = event.target.value.replace(/[^A-Za-z0-9]/g, ''); // ✅ Removes special characters dynamically
    }
    
    restrictOnlyAlphabets(event) {
        const char = event.key;
        const regex = /^[A-Za-z]$/; // ✅ Only allows letters
        if (!regex.test(char)) {
            event.preventDefault();
        }
    }
    
    validateOnlyAlphabets(event) {
        event.target.value = event.target.value.replace(/[^A-Za-z]/g, ''); // ✅ Removes numbers & special characters dynamically
    }
    

    restrictNumbersOnly(event) {
        const char = event.key;
        
        // ✅ Allow numbers, spaces, and plus (+) for country codes
        const regex = /^[0-9+\s]$/; 
        
        if (!regex.test(char)) {
            event.preventDefault();
        }
    }
    
    validateNumbersOnly(event) {
        // ✅ Keep only numbers, spaces, and plus sign (+)
        event.target.value = event.target.value.replace(/[^0-9+\s]/g, '');
    }
    
    
    restrictCurrencyInput(event) {
        const char = event.key;
        const value = event.target.value;
        const decimalPlaces = parseInt(event.target.dataset.decimals, 10) || 2; // ✅ Dynamically retrieve allowed decimals
    
        // ✅ Allow only numbers and a single decimal point
        if (!/[0-9.]/.test(char) || (char === '.' && value.includes('.'))) {
            event.preventDefault();
            return;
        }
    
        // ✅ Prevent more decimals than allowed
        if (value.includes('.') && char !== 'Backspace') {
            const [integerPart, decimalPart] = value.split('.');
            if (decimalPart.length >= decimalPlaces) {
                event.preventDefault();
            }
        }
    }
    
    validateCurrencyInput(event) {
        let value = event.target.value;
    
        // ✅ Remove invalid characters (keep numbers & a single dot)
        value = value.replace(/[^0-9.]/g, '');
    
        // ✅ Ensure only one decimal point exists
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
    
        // ✅ Restrict decimal places dynamically
        const decimalPlaces = parseInt(event.target.dataset.decimals, 10) || 2;
        if (parts[1] && parts[1].length > decimalPlaces) {
            value = parts[0] + '.' + parts[1].substring(0, decimalPlaces);
        }
    
        event.target.value = value;
    }
    
    
    

    handleSubmit() {
        console.log('📤 handleSubmit triggered');
        // ✅ Flatten all rows
        let allRows = this.stepPagedRows.flat();
    
        // ✅ Pre-process dropdown values before saving
       allRows = allRows.map(row => ({
    ...row,
    cells: row.cells.map(cell => {
        const field = cell.field;

        // 🟨 ✅ 1. Preserve Page Breaks without modifying anything
        if (
            field &&
            field.dataType === 'Blank' &&
            field.label?.toLowerCase().trim() === 'page break'
        ) {
            return cell;
        }

        let newField;

        // 🟢 2. Handle Checkbox Field
        if (cell.isCheckboxField) {
            newField = {
                ...cell.field,
                value: !!cell.field?.value // force true/false
            };

            return {
                ...cell,
                field: newField
            };
        }

        // 📎 3. Handle Upload Field
        if (cell.isUploadField && cell.field?.downloadLink) {
            newField = {
                ...cell.field,
                downloadLink: cell.field.downloadLink
            };

            return {
                ...cell,
                field: newField
            };
        }

        // 🔽 4. Handle Multi-select Dropdown
        if (cell.isDropdownField && cell.isMultiSelect) {
            const selectedOptions = cell.field.options
                .filter(option => option.isSelected)
                .map(option => option.label)
                .join(', ');

            newField = {
                ...cell.field,
                value: selectedOptions
            };

            return {
                ...cell,
                selectedValues: selectedOptions,
                field: newField
            };
        }

        // 🔽 5. Handle Single-select Dropdown
        if (cell.isDropdownField && !cell.isMultiSelect) {
            const selectedValue = cell.selectedValues || cell.field?.value || '';

            newField = {
                ...cell.field,
                value: selectedValue
            };

            return {
                ...cell,
                selectedValues: selectedValue,
                field: newField
            };
        }

        // 🔘 6. Handle Radio Button with optional subinput
        if (cell.isRadioButton || field?.dataType === 'Radio Button') {
            const selectedRadio = cell.selectedRadioOption || field?.value || '';
            const subInput = cell.subInputValue || '';

            newField = {
                ...field,
                value: subInput ? `${selectedRadio} - ${subInput}` : selectedRadio
            };

            return {
                ...cell,
                selectedRadioOption: selectedRadio,
                subInputValue: subInput,
                field: newField
            };
        }

        // 🔚 7. Default fallback: return cell with preserved field
        return {
            ...cell,
            field: field
        };
    })
}));

        console.log('🔍 Validating required fields...');

        let missingFields = [];
    allRows.forEach(row => {
        row.cells.forEach(cell => {
            const field = cell.field;
            const inputEl = this.template.querySelector(`[data-id="${cell.id}"]`);
            if (inputEl) inputEl.classList.remove('highlight-error');

            if (
                field &&
                field.isRequired === true &&
                (field.value === undefined || field.value === null || field.value.toString().trim() === '')
            ) {
                missingFields.push(field.label);
                if (inputEl) inputEl.classList.add('highlight-error');
            }
        });
    });

    if (missingFields.length > 0) {
        this.showToast(
            'Missing Required Fields',
            `Please fill the following required fields: ${missingFields.join(', ')}`,
            'error'
        );
        return; // ⛔ Stop submission
    }
    
        // ✅ Convert to JSON for backend
        const responseJson = JSON.stringify(allRows);
        console.log('✅ RESPONSE!'+ responseJson);
    
        if (this.isEditing) {
            updateFormResponse({ responseId: this.selectedResponseId, responseJson })
                .then(() => {
                    this.showToast('Success', 'Form Updated Successfully!', 'success');
                    this.isFormSelected = false;
                    this.isEditing = false;
                    return refreshApex(this.wiredFormResponses);
                })
                .catch(error => {
                    this.showToast('Error', 'Error updating form', 'error');
                    console.error(error);
                });
        } else {
            console.log('Initiating Form Submission...');
            console.log('Form Details:', {
                formId: this.selectedForm?.Id,
                formName: this.selectedForm?.Name__c,
                formType: this.selectedForm?.Form_Type__c,
                responseJson: responseJson,
                orgId: this.orgid,
                clientId: this.clientId,
            });
    
            saveFormResponse({ 
                formId: this.selectedForm.Id, 
                responseJson: responseJson, 
                orgId: this.orgid,
                clientId: this.clientId,
                formName: this.selectedForm.Name__c,
                formType: this.selectedForm.Form_Type__c,
            })
            .then(() => {
                console.log('✅ Form Submitted Successfully!');
                this.showToast('Success', 'Form Submitted Successfully!', 'success');
                this.isFormSelected = false;
                this.isEditing = false;
                return refreshApex(this.wiredFormResponses);
            })
            .then(() => {
                console.log('✅ Apex Data Refreshed Successfully!');
            })
            .catch(error => {
                console.error('❌ Error submitting form:', error);
                this.showToast('Error', 'Error submitting form', 'error');
            });
        }
    }
    
    
    
    

    toggleDropdown(event) {
        const cellId = event.target.dataset.id;
        this.tableRows = this.tableRows.map(row => ({
            ...row,
            cells: row.cells.map(cell => ({
                ...cell,
                isDropdownOpen: cell.id === cellId ? !cell.isDropdownOpen : false
            }))
        }));
    
        if (this.isDropdownOpen) {
            // ✅ Attach event listener to close when clicking outside
            document.addEventListener("click", this.closeDropdowns);
        }
    }
    
    
    
    
    // ✅ Handles multi-select dropdown checkbox changes
    handleMultiSelectChange(event) {
        const optionValue = event.target.value;
        const cellId = event.target.dataset.id;
    
        this.tableRows = this.tableRows.map(row => ({
            ...row,
            cells: row.cells.map(cell => {
                if (cell.id === cellId) {
                    let updatedOptions = cell.field.options.map(option => {
                        if (option.label === optionValue) {
                            return { ...option, isSelected: event.target.checked }; // ✅ Toggle isSelected
                        }
                        return option;
                    });
    
                    // ✅ Update `selectedValues` and `value` in field
                    let selectedOptions = updatedOptions.filter(option => option.isSelected).map(option => option.label);
                    let selectedValues = selectedOptions.join(", ");
    
                    return {
                        ...cell,
                        selectedValues: selectedValues, // ✅ Update input field
                        field: { 
                            ...cell.field, 
                            options: updatedOptions,
                            value: selectedValues // ✅ Store selected multi-select values
                        }
                    };
                }
                return cell;
            })
        }));
    }
    
    
    

    saveMultiSelect(event) {
        const cellId = event.target.dataset.id;
    
        this.tableRows = this.tableRows.map(row => ({
            ...row,
            cells: row.cells.map(cell => {
                if (cell.id === cellId) {
                    let selectedOptions = cell.field.options.filter(option => option.isSelected);
                    let selectedValues = selectedOptions.map(option => option.label).join(", ");
    
                    return {
                        ...cell,
                        selectedValues: selectedValues, // ✅ Update input field
                        field: { 
                            ...cell.field, 
                            value: selectedValues // ✅ Store multi-select values correctly
                        },
                        isDropdownOpen: false // ✅ Close dropdown after saving
                    };
                }
                return cell;
            })
        }));
    
        document.removeEventListener("click", this.closeDropdowns); // ✅ Remove event listener
    }
    
    

    closeDropdowns = (event) => {
        // ✅ Prevent closing if clicking inside the dropdown
        if (this.template.querySelector(".multi-dropdown-options")?.contains(event.target)) {
            return;
        }
    
        this.tableRows = this.tableRows.map(row => ({
            ...row,
            cells: row.cells.map(cell => ({ ...cell, isDropdownOpen: false }))
        }));
    
        document.removeEventListener("click", this.closeDropdowns); // ✅ Remove event listener
    };
    
    stopPropagation(event) {
        event.stopPropagation();
    }
    handleinputCancel() {
        this.isFormSelected = false;
        this.isEditing = false;
        this.tableRows = []; // Clear the form data
        console.log("🚫 Form selection canceled");
    }
    

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
    handleFileUpload(event) {
        const cellId = event.target.dataset.id;
        const file = event.target.files[0];
    
        if (!file) {
            console.warn('⚠️ No file selected.');
            return;
        }
    
        console.log('📁 Uploading file:', file.name);
        console.log('📄 File type:', file.type);
    
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
    
            console.log('📦 Base64 file size (approx):', `${(base64.length * 3 / 4 / 1024).toFixed(2)} KB`);
    
            // Apex call to upload file
            uploadFileToSalesforce({ 
                base64Data: base64, 
                fileName: file.name, 
                contentType: file.type 
            })
            .then(fileResponse => {
                const { previewUrl, downloadUrl } = fileResponse;
    
                console.log('✅ File uploaded to Salesforce');
                console.log('🔗 Preview URL:', previewUrl);
                console.log('⬇️ Download URL:', downloadUrl);
    
                // ✅ Update tableRows
                this.tableRows = this.tableRows.map(row => ({
                    ...row,
                    cells: row.cells.map(cell => {
                        if (cell.id === cellId) {
                            console.log(`📝 Updating cell with ID: ${cellId}`);
                            return {
                                ...cell,
                                field: {
                                    ...cell.field,
                                    value: previewUrl,
                                    downloadLink: downloadUrl
                                }
                            };
                        }
                        return cell;
                    })
                }));
    
                // ✅ Update stepPagedRows as well (needed for submission)
                this.stepPagedRows = this.stepPagedRows.map(page =>
                    page.map(row => ({
                        ...row,
                        cells: row.cells.map(cell => {
                            if (cell.id === cellId) {
                                return {
                                    ...cell,
                                    field: {
                                        ...cell.field,
                                        value: previewUrl,
                                        downloadLink: downloadUrl
                                    }
                                };
                            }
                            return cell;
                        })
                    }))
                );
            })
            .catch(error => {
                console.error('❌ File upload failed:', error);
                this.showToast('Error', 'File upload failed', 'error');
            });
        };
    
        reader.readAsDataURL(file);
    }
    
    

    @track searchSubmittedQuery = '';
@track filteredFormResponses = []; // Filtered results
@track searchFormsAccessQuery = '';
@track filteredParticipants = []; // Used for displaying filtered + paginated records


handleSubmittedFormSearch(event) {
    this.searchSubmittedQuery = event.target.value.toLowerCase();

    this.filteredFormResponses = this.formResponses.filter(response =>
        (response.Name__c || '').toLowerCase().includes(this.searchSubmittedQuery) ||
        (response.Form_Type__c || '').toLowerCase().includes(this.searchSubmittedQuery) ||
        (response.Participant_Name__c || '').toLowerCase().includes(this.searchSubmittedQuery) ||
        (response.FormattedDate || '').toLowerCase().includes(this.searchSubmittedQuery)
        // Add status if available
    );

    this.totalFormRecords = this.filteredFormResponses.length;
    this.totalFormPages = Math.ceil(this.totalFormRecords / this.formPageSize);
    this.formPageNumber = 1; // reset to first page
    this.updatePaginatedFormResponses();
}

handleFormsAccessSearch(event) {
    this.searchFormsAccessQuery = event.target.value.toLowerCase();

    this.filteredParticipants = this.participants.filter(participant =>
        (participant.Name || '').toLowerCase().includes(this.searchFormsAccessQuery) ||
        (participant.visibleStaffMembers?.some(staff =>
            (staff.name || '').toLowerCase().includes(this.searchFormsAccessQuery))
        ) ||
        (participant.Status__c || '').toLowerCase().includes(this.searchFormsAccessQuery)
    );

    this.pageNumber = 1;
    this.totalRecords = this.filteredParticipants.length;
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
    this.paginationHelper();
}
// get customizableformsClass(){
//     return (this.orgflag || this.orgeditflag) ? 'menu-item1' : 'menu-item'; 

// }
// get incidentClass(){
//     return (this.orgflag || this.orgeditflag) ? 'menu-item1' : 'menu-item'; 

// }

// get customizableformsClass() {
//     return this.isCustomisableFormSelected ? 'menu-item1' : 'menu-item';
// }

// get incidentClass() {
//     return this.isIncidentRegisterSelected ? 'menu-item1' : 'menu-item';
// }


// handleIncidentRegister() {
//     this.isIncidentRegisterSelected = true;
//     this.isCustomisableFormSelected = false;
// }

// handleCustomisableForms() {
//     this.isCustomisableFormSelected = true;
//     this.isIncidentRegisterSelected = false;
// }

async downloadPdf() {
    const jsPDFConstructor = window.jspdf?.jsPDF || window.jsPDF;
    if (!jsPDFConstructor || !jsPDFConstructor.API?.autoTable) {
        console.error('❌ jsPDF or autoTable not available.');
        return;
    }

    this.viewTableData = this.viewTableData.map(item => {
        if (item.isPageBreak) {
            return { ...item, isVisible: true, arrow: '▼' };
        } else {
            return { ...item, isVisible: true };
        }
    });

    const doc = new jsPDFConstructor();

    if (this.orgLogoUrl) {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = this.orgLogoUrl;

        img.onload = async () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const base64Image = canvas.toDataURL('image/png');

                doc.addImage(base64Image, 'PNG', 165, 10, 30, 15);
                await this.drawPdfContent(doc);
            } catch (e) {
                console.warn('⚠️ Logo error:', e);
                await this.drawPdfContent(doc);
            }
        };

        img.onerror = async () => {
            await this.drawPdfContent(doc);
        };
    } else {
        await this.drawPdfContent(doc);
    }
}
async drawPdfContent(doc) {
    const headers = [['Field Name', 'Value']];
    const rows = [];
    const imageRows = [];

    this.viewTableData.forEach(item => {
        if (!item.isPageBreak && item.isVisible) {
            const label = item.label;
            let value = '';

            if (item.isCheckbox) {
                value = item.value === 'action:approval' ? 'Yes' : 'No';
            } else if (item.isRichText) {
                const div = document.createElement('div');
                div.innerHTML = item.value;
                value = div.textContent || div.innerText || '';
            } else if (item.isUploadFile && item.isImageFile && item.uploadUrl) {
                imageRows.push({ label, url: item.uploadUrl });
                value = 'Image attached below';
            } else {
                value = item.value || '';
            }

            rows.push([label, value]);
        }
    });

    const formName = this.selectedFormTitle || 'N/A';
    const formType = this.selectedFormType|| 'N/A';
    const participant = this.selectedParticipantName || 'N/A';
    const submissionDate = this.selectedSubmissionDate || 'N/A';


    doc.setFillColor(230, 230, 250);
    doc.rect(12, 12, 186, 40, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('Form Summary', 14, 20);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(33, 33, 33);
    doc.text(`Form Name: ${formName}`, 14, 28);
    doc.text(`Form Type: ${formType}`, 100, 28);
    doc.text(`Participant: ${participant}`, 14, 36);
    doc.text(`Submission Date: ${submissionDate}`, 100, 36);

    doc.autoTable({
        head: headers,
        body: rows,
        startY: 58,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' }
    });

    let y = doc.previousAutoTable.finalY + 10;
    const pageHeight = doc.internal.pageSize.height;

    for (const img of imageRows) {
        try {
            const imageDataUrl = await this.getBase64ImageFromURL(img.url);
            if (y + 40 > pageHeight) {
                doc.addPage();
                y = 10;
            }
            doc.setFontSize(12);
            doc.text(img.label, 14, y);
            y += 5;
            doc.addImage(imageDataUrl, 'JPEG', 14, y, 50, 30);
            y += 40;
        } catch (error) {
            console.error('❌ Image render error:', error);
        }
    }

    const fileName = (formName || 'Form').replace(/[\\/:*?"<>|]/g, '_') + '.pdf';
    doc.save(fileName);
}
async getBase64ImageFromURL(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}


isRadioChecked(selectedValue, optionValue) {
        return selectedValue === optionValue;
    }
    
    isRadioSelected(selectedOption, currentOption) {
        return selectedOption === currentOption;
    }
    
    isSelected(optionValue, selectedValue) {
        return optionValue === selectedValue;
    }
    
    isDropdownSubType(type) {
        return type === 'dropdown';
    }
    
    isTextSubType(type) {
        return type === 'text';
    }
    
    isRadioSubType(type) {
        return type === 'radio';
    }
    
    getSubRadioGroupName(cellId) {
        return `${cellId}-subradio`;
    }
    

    
    handleRadioChange(event) {
        const cellId = event.target.dataset.id;
        const selectedValue = event.target.value;
        const subType = event.target.dataset.subtype;
    
        console.log('🔘 Radio Clicked:', selectedValue, '| Subtype:', subType);
    
        this.tableRows = this.tableRows.map(row => {
            return {
                ...row,
                cells: row.cells.map(cell => {
                    if (cell.id === cellId) {
                        console.log('📌 Updating Radio Cell:', cellId);
    
                        // Update selected value
                        cell.field.value = selectedValue;
                        cell.selectedRadioOption = selectedValue;
                        cell.subInputValue = ''; // Clear sub input
    
                        // ✅ Rebuild radioOptionsProcessed
                        cell.radioOptionsProcessed = (cell.field.radioOptions || []).map(option => {
                            const isSelected = selectedValue === option.optionLabel;
                            let processedSubOptions = [];

if (option.usePredefinedOptions) {
    const type = option.selectedPredefined?.toLowerCase();

    if (type === 'staff' && this.staffOptions.length > 0) {
        processedSubOptions = this.staffOptions.map(opt => ({
            label: opt.label,
            isSelected: false
        }));
    } else if (type === 'participant' && this.participants.length > 0) {
        processedSubOptions = this.participants.map(p => ({
            label: p.Name,
            isSelected: false
        }));
    } else if (type === 'facility' && this.facilityOptions.length > 0) {
        processedSubOptions = this.facilityOptions.map(opt => ({
            label: opt.label,
            isSelected: false
        }));
    }
} else {
    processedSubOptions = (option.values || []).map(val => ({
        label: val,
        isSelected: false
    }));
}

    
                            return {
                                ...option,
                                isSelected,
                                processedSubOptions,
                                isDropdown: option.subType === 'dropdown',
                                isTextInput: option.subType === 'text',
                                isRadioList: option.subType === 'radio',
                                hasSubInput: option.hasSubInput || false,
                                subQuestion: option.subQuestion || ''
                            };
                        });
    
                        console.log('✅ Updated Radio Option Selection:', selectedValue);
                    }
                    return cell;
                })
            };
        });
    }
    
  handleRadioSubInputChange(event) {
    const cellId = event.target.dataset.id;
    const subValue = event.target.value;

    console.log('📥 Sub-Input Change in Cell:', cellId, '| Value:', subValue);

    this.tableRows = this.tableRows.map(row => ({
        ...row,
        cells: row.cells.map(cell => {
            if (cell.id === cellId) {
                // 1️⃣ Store subInputValue
                cell.subInputValue = subValue;

                // 2️⃣ Compose final value with main radio
                const selectedRadio = cell.selectedRadioOption || '';
                if (selectedRadio) {
                    cell.field.value = subValue
                        ? `${selectedRadio} - ${subValue}`
                        : selectedRadio;
                }

                // 3️⃣ Rebuild processed options with correct selection
                cell.radioOptionsProcessed = (cell.radioOptionsProcessed || []).map(option => {
                    const isSelected = option.optionLabel === selectedRadio;

                    if (!isSelected) return option;

                    let processedSubOptions = [];

                    if (option.usePredefinedOptions) {
                        const type = (option.selectedPredefined || '').toLowerCase();

                        if (type === 'staff' && Array.isArray(this.staffOptions)) {
                            processedSubOptions = this.staffOptions.map(opt => ({
                                label: opt.label,
                                isSelected: subValue === opt.label
                            }));
                        } else if (type === 'participant' && Array.isArray(this.participants)) {
                            processedSubOptions = this.participants.map(p => ({
                                label: p.Name,
                                isSelected: subValue === p.Name
                            }));
                        } else if (type === 'facility' && Array.isArray(this.facilityOptions)) {
                            processedSubOptions = this.facilityOptions.map(opt => ({
                                label: opt.label,
                                isSelected: subValue === opt.label
                            }));
                        }
                    } else {
                        processedSubOptions = (option.values || []).map(val => ({
                            label: val,
                            isSelected: subValue === val
                        }));
                    }

                    return {
                        ...option,
                        isSelected: true,
                        processedSubOptions
                    };
                });
            }
            return cell;
        })
    }));
}

  get isFormListEmpty() {
    return !this.paginatedFormResponses || this.paginatedFormResponses.length === 0;
}
  


}