import { LightningElement, track, wire, api } from 'lwc';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';
import getShiftWithStaffData from '@salesforce/apex/ShiftReportsController.getShiftWithStaffData';
//import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
//import getFacilityCurrentUser from '@salesforce/apex/PortalUserController.getFacilityCurrentUser';
import fetchFacilitiess from "@salesforce/apex/ClientSearchController.fetchFacilitiess";
import createTemplate from '@salesforce/apex/ShiftReportsController.createTemplate';
import getTemplatesByFacility from '@salesforce/apex/ShiftReportsController.getTemplatesByFacility';
import deleteTemplate from '@salesforce/apex/ShiftReportsController.deleteTemplate';
import getAddShiftById from '@salesforce/apex/ShiftReportsController.getAddShiftById';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getCasesByStaff from '@salesforce/apex/ShiftReportsController.getCasesByStaff';
import getjournalsByStaff from '@salesforce/apex/ShiftReportsController.getjournalsByStaff';
import getformsByStaff from '@salesforce/apex/ShiftReportsController.getformsByStaff';
import getAllExportData from '@salesforce/apex/ShiftReportsController.getAllExportData';
import fetchBulkRoles from '@salesforce/apex/FacilityController.fetchBulkRoles';
export default class TesseractAppsShiftReports extends LightningElement {
    
    @track selectedStartDate;
    @track selectedEndDate;
    @track selectedRole = 'All';
    @track selectedEmploymentType = 'All';
    @track selectedLocation = 'All';
    @track roleOptions = [];
    @track orgId;
    @track orgName;
    @track userType;
    @track shiftData = [];
    @track error;
    wiredShiftDataResult;
    @track isViewFlag = false;
    @track isHome =true;
    @track shiftId;
    @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
    @track shiftDataTable = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number 
    @track paginationVisible=false;
    isPageSizeManuallySet = false;
    resizeObserver = null;
    _resizeTimeout = null;
    @track noRecordsFlag=false;
    @track facilityOptions = [];
    @track finalListFacilities = []; 
    @track facilityValue; 
    @track facilityLabel; 
//started export code
    @track hasUnsavedChanges = false;
    @track templateDropdownKey = 0;
    @track templates = [];
    @track selectedTemplateId = null;
    @track showNameModal = false;
    @track newTemplateName = '';
    @track showConfigureModal = false;
    @track lastSavedTemplateId;
    @track selectedParticipant ='All';
    @track selectedSignStatus = 'All';//manendra added for sign in sign out filter
    @track participantOptions = [];
   // @track participants=[];
    @track allShiftData=[];
    @track showFormatModal = false;
    @track exportType = ''; // 'ALL' or 'CONFIG'
    @track selectedFormat = 'CSV';
    @track sections = [
        { key: 'shiftInformation', label: 'Shift Details', checked: false },
        //{ key: 'incidentRegister', label: 'Incident Register', checked: false }, incident register commented
        { key: 'forms', label: 'Forms', checked: false },
        { key: 'participantJournal', label: 'Participant Journal', checked: false },
        { key: 'activityLogs', label: 'Shift Notes', checked: false },
        { key: 'servicesDelivered', label: 'Services Delivered', checked: false },
        { key: 'reimbursements', label: 'Reimbursements', checked: false },
        { key: 'shiftNotes', label: 'Shift Information', checked: false },
        { key: 'Checklist', label: 'Checklist', checked: false },
        { key: 'Signature', label: 'Signature', checked: false },
    ];
    get isDeleteDisabled() {
        return !this.selectedTemplateId || this.selectedTemplateId === 'NEW';
    }
    get isContinueDisabled() {
        // Always disabled for "NEW" template
        if (this.selectedTemplateId === 'NEW') {
            return true;
        }
        
        // For existing templates, check if any sections are selected
        const hasSelectedSections = this.sections.some(section => section.checked);
        
        // 🔥 NEW: Also disable if user has modified the template without saving
        const hasUnsavedChanges = this.hasUnsavedChanges;
        
        return !hasSelectedSections || hasUnsavedChanges;
    }
    get isUpdateDisabled() {
    if (this.isNewTemplate) {
        return true;
    }
    
    if (!this.selectedTemplateId || this.selectedTemplateId === 'NEW') {
        return true;
    }
    
    const hasSelectedSections = this.sections.some(section => section.checked);
    if (!hasSelectedSections) {
        return true;
    }
    
    if (!this.hasUnsavedChanges) {
        return true;
    }
    
    return false;
}
    get isNewTemplate() {
        return this.selectedTemplateId === 'NEW';
    }
     employmentTypeOptions = [
        { label: 'All', value: 'All' },
        { label: 'Casual', value: 'Casual' },
        { label: 'Full-time', value: 'Full-time' },
        { label: 'Part-time', value: 'Part-time' },
        { label: 'Contract', value: 'Contract' }

    ];
    locationOptions = [
        { label: 'All', value: 'All' },
        { label: 'Facility', value: 'Facility' },
        { label: 'Participant', value: 'Participant' },
        { label: 'Other', value: 'Other' }
    ];

    signStatusOptions = [
    { label: 'All', value: 'All' },
    { label: 'Sign In Enabled', value: 'Sign In Enabled' },
    { label: 'Sign Out Enabled', value: 'Sign Out Enabled' },
    { label: 'Late Sign In', value: 'Late Sign In' },
    { label: 'Early Sign Out', value: 'Early Sign Out' }
    ];//manendra added for sign in sign out filter
    get isNewTemplate() {
        // Check if selectedTemplateId is 'NEW' or if it doesn't exist in templates
        if (this.selectedTemplateId === 'NEW') {
            return true;
        }
    
        // Also check if the selected ID exists in templates
        const templateExists = this.templates.some(t => t.value === this.selectedTemplateId);
        return !templateExists;
    }
    get facilityIdList() {
        return this.finalListFacilities.map(f => f.value);
    }
    async connectedCallback() {
        console.log('connectedCallback in shiftreports: ');
        try {

            const week = this.getCurrentWeekRange();
            this.selectedStartDate = week.start;
            this.selectedEndDate = week.end;
            //console.log('Received Facility ID in Child:', this.facilityId);

            // 1. Initialize week dates
           // this.calculateWeekDates();

            // 2. Fetch logged-in user info
            const userData = await getCurrentLoggedUserInfo();
            console.log('User data =>', JSON.stringify(userData));
            this.userType = userData?.User_Type__c;
            const storedFacilityId = localStorage.getItem("defaultFacilityId");
            let facilityIds = [];
               
            // facilityIds.push(storedFacilityId);
            if (storedFacilityId) {
                facilityIds.push(storedFacilityId);
            }
            console.log("facilityIds  " + JSON.stringify(facilityIds));
          
            this.finalListFacilities = facilityIds.map(id => ({
                value: id
            }));

            console.log('Mapped facility options: ORG ADMIN', JSON.stringify(this.finalListFacilities));
            console.log('Mapped facility LENGTH: ORG ADMIN', this.finalListFacilities.length);

            if (this.finalListFacilities && this.finalListFacilities.length > 0) {
                await this.getParticipantOptions();
                await this.loadTemplates();
            }

            // 5. Get roles from organization details and build role options
            const response = await organizationDetails();
            this.orgId = response.listofPriceBook.Id;
            this.orgName = response.listofPriceBook.Name;  
            console.log('Org Id =>', this.orgId);
            console.log('Org Name =>', this.orgName);
            // let orgRoles = response.listofPriceBook.Roles__c;
            // const roles = orgRoles ? orgRoles.split(';').sort() : [];

            // this.roleOptions = [
            //     { label: 'All', value: 'All' },
            //     ...roles.map(role => ({
            //         label: role,
            //         value: role
            //     }))
            // ];
            if (facilityIds.length > 0) {
                const facRoles = await fetchBulkRoles({
                    facilityIDList: facilityIds
                });

                const mappedRoles = facRoles.map(rec => ({
                    label: rec.Role_Name__c,
                    value: rec.Role_Name__c
                }));

                this.roleOptions = [
                    { label: 'All', value: 'All' },
                    ...mappedRoles
                ];

                this.selectedRole = 'All';
            }


            //this.selectedRole = 'All'; // Default role selection
          
            if(this.totalRecords>0) {
                this.noRecordsFlag=false;
            }else{
                this.noRecordsFlag=true;
            }
        } catch (error) {
            console.error('Error in connectedCallback:', error);
        }
    }
    
    @wire(getShiftWithStaffData, {
        role: '$selectedRole',
        employmentType: '$selectedEmploymentType',
        startWeekDate: '$selectedStartDate',
        endWeekDate: '$selectedEndDate',
        location: '$selectedLocation',
        signStatus: '$selectedSignStatus',// manendra added for sign in sign out filter
        facilityIds: '$facilityIdList'
    })
    wiredShiftData(result) {
        console.log('facilityIdList in wire ', JSON.stringify(this.facilityIdList));
        console.log('facilityIdList LENGTH: ', this.facilityIdList.length);
        this.wiredShiftDataResult = result;
        const { data, error } = result;
        console.log('result =>', JSON.stringify(result));
       
        if (data) {
                console.log( 'RAW SHIFT RECORD (from wire):',JSON.stringify(data[0], null, 2) );

        // console.log(
        //     'Child relationship object:',
        //     data[0].Services_and_Support_Plans__r
        // );
            // const plans = Array.isArray(data.Services_and_Support_Plans__r)
            //     ? data.Services_and_Support_Plans__r
            //     : [];
            // console.log('plans in wire ', JSON.stringify(plans));    
            console.log('data length =>', data.length); 
            this.shiftData = data.map(shift => ({
                Id: shift.Id,
                rawDate: shift.Date__c,
                date: shift.Date__c 
                            ? new Date(shift.Date__c).toLocaleDateString('en-GB') 
                            : 'No Date',
                // date: this.formatDateForUI(shift.Date__c),
                shiftType: shift.Type_of_shift__c || '',
                // name: shift.Staff_Name__c,
                name: shift.Staff__r.Display_Nickname__c || '',
                role: shift.Add_Shift__r?.Role__c || shift.Role_formula__c || '',
                scheduledTime: shift.Shift_Start_End_Time__c || '',
                 staffLoginDetails: this.formatLoginLogoutTime(shift.Log_In_Date_Time__c,shift.Log_Out_Date_Time__c),
                // participants: (shift.Services_and_Support_Plans__r || []).map(p => p.Participant_Name__c).join(', '),
                participants: (shift.Services_and_Support_Plans__r || [])
                    .map(p => p.Participant_Name__c)
                    .filter(Boolean)
                    .join(', '),
           
                participantId: (shift.Services_and_Support_Plans__r || [])[0]?.Client__c || ''
             }));
            console.log('shiftData in wire ', JSON.stringify(this.shiftData));
            console.log('shiftData LENGTH in wire: ', this.shiftData.length);
            this.allShiftData = this.shiftData;
            this.totalRecords = this.shiftData.length;
            this.pageSize = this.pageSize || this.pageSizeOptions[0]; // Set pageSize with default value as first option
            this.pageNumber = 1;
            // if (this.totalRecords > 0) {
            //     this.paginationVisible = true;
            // } else{
            //     this.paginationVisible = false;
            // }
           // this.paginationHelper();
           this.filterByParticipant();
           
            //this.error = undefined;
        } else  {
            //this.error = error;
            this.shiftData = [];
           // console.error('Error in wired data:', error);
        }
    }
    async getParticipantOptions() {
        try {
            const selectedFacilityId = this.finalListFacilities?.[0]?.value;

            if (!selectedFacilityId) {
                this.participantOptions = [{ label: 'All', value: 'All' }];
                console.log('participantOptions 111', JSON.stringify(this.participantOptions) );
                return;
            }

            const response = await fetchFacilitiess({ cname: '', isTrue: false });

            const participants = response
                .filter((rec) => {
                    const hasActiveFacility =
                        rec.Participant_Facilities__r &&
                        rec.Participant_Facilities__r.some(
                            (pf) =>
                                pf.Active__c === true &&
                                pf.Facility__c === selectedFacilityId
                        );

                    return (
                        rec.Status__c === true &&
                        rec.Facility__r?.Status__c === true &&
                        hasActiveFacility
                    );
                })
                .map((rec) => ({
                    value: rec.Id,
                    label: rec.Display_Nickname__c
                  
                }));
                 this.participantOptions = [
                    { label: 'All', value: 'All' },
                    ...participants
                ];

                this.selectedParticipant = 'All';


            console.log('participantOptions', JSON.stringify(this.participantOptions) );
            console.log('participantOptions LENGTH: ', this.participantOptions.length);

        } catch (error) {
            console.error('Error loading participants', error);
            this.participantOptions = [{ label: 'All', value: 'All' }];
            console.log('participantOptions in catch error', JSON.stringify(this.participantOptions) );
        }
    }

    handleSectionChange(event) {
        const key = event.target.dataset.key;
        const checked = event.target.checked;

        this.sections = this.sections.map(sec =>
            sec.key === key ? { ...sec, checked } : sec
        );
        this.hasUnsavedChanges = true;
    }
    openSaveTemplate() {
    // Check if at least one section is selected BEFORE opening name modal
    const hasSelectedSections = this.sections.some(section => section.checked);
    if (!hasSelectedSections) {
        this.showToast(
            'Error', 
            'Please select at least one field', 
            'error'
        );
        return;
    }
    
    // Only open save modal if we're creating NEW template
    if (this.selectedTemplateId === 'NEW') {
        this.newTemplateName = '';
        this.showConfigureModal = false; // close configure
        this.showNameModal = true;       // open name modal
    } else {
        // If an existing template is selected, update it directly
        this.updateTemplate();
    }
    }
    closeSaveNameModal() {
        this.showNameModal = false;
        this.showConfigureModal = true; // Return to configure modal
    }
    closeConfigureModal() {
    this.showConfigureModal = false;
    this.hasUnsavedChanges = false;
    this.selectedTemplateId = 'NEW';
    this.clearAllSelections();
    }
    handleExportReportCSV() {
    console.log('🟢 Export Report CSV clicked');
    console.log('Selected Start Date:', this.selectedStartDate);
    console.log('Selected End Date:', this.selectedEndDate);
    console.log('Shift IDs:', this.shiftData.map(s => s.Id));
    console.log('Facility IDs:', this.facilityIdList);
    console.log(
        'Selected Sections:',
        this.sections.filter(s => s.checked).map(s => s.key)
    );
        // Check if at least one section is selected
        const hasSelectedSections = this.sections.some(section => section.checked);
        if (!hasSelectedSections) {
            this.showToast('Error', 'Please select at least one field to export', 'error');
            return;
        }
        
        // this.exportFilteredCSV();
        this.exportType = 'CONFIG';
        this.selectedFormat = 'CSV';
        this.showFormatModal = true;
        this.showConfigureModal = false;
    }
    async exportFilteredCSV() {
        try {
            const selectedSections = this.sections.filter(sec => sec.checked);
            if (selectedSections.length === 0) {
                this.showToast(
                    'Error',
                    'Please select at least one field to export',
                    'error'
                );
                return;
            }

            this.isLoading = true;

            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const parts = dateStr.split('-');
                return `${parts[0]}-${parts[1]}-${parts[2]}`;
            };

            const formattedSDate = formatDate(this.selectedStartDate);
            const formattedEDate = formatDate(this.selectedEndDate);

            const shiftIds = this.shiftData.map(shift => shift.Id);

            const allData = await getAllExportData({
                role: this.selectedRole,
                employmentType: this.selectedEmploymentType,
                startWeekDate: this.selectedStartDate,
                endWeekDate: this.selectedEndDate,
                location: this.selectedLocation,
                facilityIds: this.facilityIdList,
                shiftIds: shiftIds
            });

            if (allData.status === 'error') {
                throw new Error(allData.message);
            }

            const shiftDetails = allData.shiftDetails;
            shiftDetails.sort((a, b) => {
                const dateA = a.shift.Date__c ? new Date(a.shift.Date__c) : new Date(0);
                const dateB = b.shift.Date__c ? new Date(b.shift.Date__c) : new Date(0);
                return dateA - dateB;
            });
            let csvContent = '';

            csvContent += this.escapeCSV(this.orgName || '') + '\n';
            csvContent += 'Shift Report\n';
            csvContent += `Start Date: ${formattedSDate} and End Date: ${formattedEDate}\n\n`;

            const baseHeaders = [
                'Date',
                'Shift Type',
                'Staff Name',
                'Scheduled Time',
                'Staff Login Details',
                'Participants'
            ];

            const sectionHeaders = selectedSections.map(sec => {
                switch (sec.key) {
                    case 'shiftInformation': return 'Shift Details';
                  //  case 'incidentRegister': return 'Incident Register'; incident reister commented
                    case 'forms': return 'Forms';
                    case 'participantJournal': return 'Participant Journal';
                    case 'activityLogs': return 'Shift Notes';
                    case 'servicesDelivered': return 'Services Delivered';
                    case 'reimbursements': return 'Reimbursements';
                    case 'shiftNotes': return 'Shift Information';
                    case 'Checklist': return 'Checklist';
                    case 'Signature': return 'Signature';
                    default: return sec.label;
                }
            });

            const headers = [...baseHeaders, ...sectionHeaders];
            csvContent += headers.map(h => this.escapeCSV(h)).join(',') + '\n';

            for (let i = 0; i < shiftDetails.length; i++) {
                const shiftDetail = shiftDetails[i];
                const shift = shiftDetail.shift;
                const checklist = shiftDetail.checklist || [];
                const incidents = shiftDetail.incidents || [];
                const forms = shiftDetail.forms || [];
                const journals = shiftDetail.journals || [];
                console.log('📌 Shift Debug Snapshot');
                console.log('Shift Date__c:', shift.Date__c);
                console.log('Incidents count:', incidents.length);
                console.log('Journals count:', journals.length);
                console.log('Forms count:', forms.length);
                console.log(
                    'Checklist RAW from Apex:',
                    JSON.stringify(shiftDetail.checklist, null, 2)
                );
                const shiftFormatted = {
                    Id: shift.Id,
                    // date: shift.Date__c
                    //     ? new Date(shift.Date__c).toLocaleDateString('en-GB')
                    //     : 'No Date',
                    date: this.formatDateForCSV(shift.Date__c),
                    shiftType: shift.Type_of_shift__c || '',
                    name: shift.Staff__r?.Display_Nickname__c
                        || shift.Staff_Name__c
                        || '',
                    role: shift.Add_Shift__r?.Role__c
                        || shift.Role_formula__c
                        || '',
                    scheduledTime: shift.Shift_Start_End_Time__c || '',
                    staffLoginDetails: this.formatLoginLogoutTime(shift.Log_In_Date_Time__c,shift.Log_Out_Date_Time__c),
                    participants: (shift.Services_and_Support_Plans__r || [])
                        .map(p => p.Participant_Name__c)
                        .join(', ')
                };

                const details = {
                    servicesDelivered: (shift.Services_and_Support_Plans__r || []).map(s => ({
                        time: s.Start_Time_Formula__c || '',
                        service: s.Service_Type_Name__c || '',
                        hours: s.Qty__c || 0
                    })),
                    reimbursements: (shift.Reimbursements__r || []).map(r => ({
                        item: r.Type_of_Vehicle__c || '',
                        amount: r.Total_Amount__c || 0,
                        comments: r.Comments__c || '',
                        approvalStatus: r.Approval_Status__c || ''
                    })),
                    shiftNotes: shift.SignIn_Notes__c
                        ? shift.SignIn_Notes__c
                            .split(/\r?\n/)
                            .map(n => n.trim())
                            .filter(Boolean)
                        : [],
                    activityLogs: (shift.ShiftWithStaff_Activities__r || []).map(a => ({
                        time: this.formatTime(a.CreatedDate),
                        task: a.Notes__c || ''
                    })),
                    checklist: checklist.map(c => ({
                        Description__c: c.Description__c || '',
                        Completed__c: c.Completed__c || false,
                        Mandatory__c: c.Mandatory__c || false
                    })),
                    incidents: incidents,
                    forms: forms,
                    journals: journals.map(j => ({
                        notes: j.Care_Notes__c || '',
                        description: this.cleanHtml(j.Description__c || '')
                    })) || []
                };

                const baseData = [
                    // this.escapeCSV(shiftFormatted.date || ''),
                    shiftFormatted.date ? `="${shiftFormatted.date}"` : '',
                    this.escapeCSV(shiftFormatted.shiftType || ''),
                    this.escapeCSV(shiftFormatted.name || ''),
                    this.escapeCSV(shiftFormatted.scheduledTime || ''),
                    this.escapeCSV(shiftFormatted.staffLoginDetails || ''),
                    this.escapeCSV(shiftFormatted.participants || '')
                ];

                const sectionData = [];

                selectedSections.forEach(sec => {
                    switch (sec.key) {
                        case 'shiftInformation':
                            sectionData.push(
                                this.escapeCSV(
                                    this.buildShiftInformation(shiftFormatted)
                                )
                            );
                            break;
                       /*  case 'incidentRegister':
                            sectionData.push(
                                this.escapeCSV(
                                    this.buildIncidentRegister(details.incidents)
                                )
                            );
                            break; *///incident reister commented
                        case 'forms':
                            sectionData.push(
                                this.escapeCSV(
                                    this.buildForms(details.forms)
                                )
                            );
                            break;
                        case 'participantJournal':
                            sectionData.push(
                                this.escapeCSV(
                                    this.buildParticipantJournal(details.journals)
                                )
                            );
                            break;
                        case 'activityLogs':
                            sectionData.push(
                                this.escapeCSV(
                                    this.buildActivityLogs(details.activityLogs)
                                )
                            );
                            break;
                        case 'servicesDelivered':
                            sectionData.push(
                                this.escapeCSV(
                                    this.buildServicesDelivered(details.servicesDelivered)
                                )
                            );
                            break;
                        case 'reimbursements':
                            sectionData.push(
                                this.escapeCSV(
                                    this.buildReimbursements(details.reimbursements)
                                )
                            );
                            break;
                        case 'shiftNotes':
                            sectionData.push(
                                this.escapeCSV(
                                    this.buildNotes(details.shiftNotes)
                                )
                            );
                            break;
                        case 'Checklist':
                            sectionData.push(
                                this.escapeCSV(
                                    this.buildChecklist(details.checklist)
                                )
                            );
                            break;
                        case 'Signature':
                            const signatureStatus = shift.Client_Signature__c
                                ? 'Signed'
                                : 'Not Signed';
                            sectionData.push(
                                this.escapeCSV(signatureStatus)
                            );
                            break;
                        default:
                            sectionData.push('');
                    }
                });

                const rowData = [...baseData, ...sectionData];
                csvContent += rowData.join(',') + '\n';
            }

            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvContent], {
                type: 'text/csv;charset=utf-8;'
            });

            const url = URL.createObjectURL(blob);
            const downloadElement = document.createElement('a');
            downloadElement.href = url;
            downloadElement.download =
                `ShiftReport_${formattedSDate}_to_${formattedEDate}_Filtered.csv`;

            document.body.appendChild(downloadElement);
            downloadElement.click();

            setTimeout(() => {
                document.body.removeChild(downloadElement);
                URL.revokeObjectURL(url);
            }, 100);

        } catch (error) {
            console.error('Error in exportFilteredCSV', error);
            this.showToast(
                'Error',
                'Failed to export filtered data: ' + error.message,
                'error'
            );
        } finally {
            this.isLoading = false;
            this.isViewFlag = false;
        }
    }

    loadTemplates() {
        console.log('loadTemplates called');

        if (!this.facilityIdList || this.facilityIdList.length === 0) {
            console.log('No facilities available');
            this.templates = [{ label: 'New', value: 'NEW' }];
            this.selectedTemplateId = 'NEW';
            return Promise.resolve();
        }

        const facilityId = this.facilityIdList[0];

        const loadWithRetry = async (retryCount = 0) => {
            try {
                const result = await getTemplatesByFacility({ facilityId });
                console.log('Templates from Apex', JSON.stringify(result));

                this.templates = [
                    { label: 'New', value: 'NEW' },
                    ...result.map(t => ({
                        label: t.Name || 'Unnamed Template',
                        value: t.Id,
                        json: t.Template_JSON__c
                    }))
                ];

                console.log('Templates array', JSON.stringify(this.templates));
                this.selectedTemplateId = 'NEW';

                return result;
            } catch (error) {
                console.error('Error loading templates', error);

                if (retryCount < 2) {
                    console.log('Retrying template load', retryCount + 1, 'of 2');
                    return new Promise(resolve => {
                        setTimeout(() => {
                            resolve(loadWithRetry(retryCount + 1));
                        }, 500);
                    });
                } else {
                    this.templates = [{ label: 'New', value: 'NEW' }];
                    this.selectedTemplateId = 'NEW';
                    return [];
                }
            }
        };

        return loadWithRetry();
    }

    buildShiftInformation(shift) {
        console.log('Building shift info for:', shift.name, 'Role:', shift.role);
        
        const infoLines = [
            `Staff: ${shift.name || ''}`,
            `Role: ${shift.role || 'Not specified'}`,
            `Date: ${shift.date || ''}`,
            `Time: ${shift.scheduledTime || ''}`
        ];
        
        const result = infoLines.join('\n');
        console.log('Shift info result:', result);
        return result;
    }

    buildServicesDelivered(services = []) {
        if (!services.length) return '';
        
        return services
            .map(service => {
                const time = service.time || service.Start_Time_Formula__c || '';
                const serviceType = service.service || service.Service_Type_Name__c || '';
                const hours = service.hours || service.Qty__c || 0;
                const participant = service.Participant_Name__c || '';
                
                // Format with labels
                const lines = [
                    `Time: ${time}`,
                    `Service: ${serviceType}`,
                    `Hours: ${hours} hrs`
                ];
                
                if (participant) {
                    lines.push(`Participant: ${participant}`);
                }
                
                return lines.join('\n');
            })
            .join('\n\n'); // Add extra line break between services
    }

    buildChecklist(checklist = []) {
        if (!Array.isArray(checklist) || checklist.length === 0) return '';

        return checklist
            .filter(item => item && typeof item === 'object')
            .map(item => {
                const description = item.Description__c || '';
                const status = item.Completed__c ? 'Completed' : 'Not Completed';

                return `Description: ${description}\nStatus: ${status}`;
            })
            .join('\n\n'); // space between checklist items
    }

    buildReimbursements(reimbursements = []) {
        if (!reimbursements.length) return '';
        
        return reimbursements
            .map(r => {
                // Use the correct property names from your data structure
                const vehicleType = r.item || r.Type_of_Vehicle__c || '';
                const amount = r.amount || r.Total_Amount__c || 0;
                const comments = r.comments || r.Comments__c || '';
                const status = r.approvalStatus || r.Approval_Status__c || '';
                
                // Build formatted lines for each reimbursement
                const lines = [
                    `Type of Vehicle: ${vehicleType}`,
                    `Total Amount: ${amount}`,
                    `Comments: ${comments}`,
                    `Approval Status: ${status}`
                ];
                
                return lines.join('\n');
            })
            .join('\n\n'); // Add extra line break between different reimbursements
    }

    buildActivityLogs(activityLogs = []) {
        if (!activityLogs.length) return '';
        
        return activityLogs
            .map(activity => {
                const time = activity.time || '';
                const task = activity.task  || '';
                
                // Format with time and task
                return `Time: ${time}\nTask: ${task}`;
            })
            .join('\n\n'); // Add extra line break between activities
    }

    buildNotes(notes = []) {
        if (!notes.length) return '';
        return notes.join('\n');
    }
        
    // Build Incident Register from Cases
    buildIncidentRegister(incidents = []) {
        console.log('🚨 buildIncidentRegister → count:', incidents.length);    
            if (!incidents.length) return '';
            
            return incidents
                .map(incident => {
                    const caseNumber = incident.CaseNumber || '';
                    const subject = incident.Subject || '';
                    const status = incident.Status || incident.Status_1__c || '';
                    const priority = incident.Priority || '';
                    const description = incident.Description || '';
                    
                    // Format with labels and proper line breaks
                    const lines = [
                        `Case Number: ${caseNumber}`,
                        `Status: ${status}`,
                        `Priority: ${priority}`
                    ];
                    
                    if (description) {
                        lines.push(`Description: ${description}`);
                    }
                    
                    return lines.join('\n');
                })
                .join('\n\n'); // Add extra line break between incidents
    }
    // Build Forms from Dynamic Form Responses
    /* buildForms(forms = []) {
     console.log('📄 buildForms → count:', forms.length);    
        if (!forms.length) return '';
        
        return forms
            .map(form => {
                const formType = form.Name__c  || '';
                const participant = form.Participant_Name__c || '';
                const createdDate = form.CreatedDate 
                    ? new Date(form.CreatedDate).toLocaleDateString('en-GB') 
                    : '';
                
                // Format with labels
                const lines = [
                    `Form Type: ${formType}`,
                    `Participant: ${participant}`,  
                ];
                
                return lines.join('\n');
            })
            .join('\n\n'); // Add extra line break between forms
    } */
    
buildForms(forms = []) {
    if (!forms.length) return '';

    return forms.join('\n\n');
}

buildParticipantJournal(journals = []) {
     console.log('🧾 buildParticipantJournal → count:', journals.length);    
        if (!journals.length) return '';
        
        return journals
            .map(journal => {
                const notes = journal.notes || journal.Care_Notes__c || '';
                const description = journal.description || '';
                const createdDate = journal.CreatedDate 
                    ? new Date(journal.CreatedDate).toLocaleDateString('en-GB') 
                    : '';
                const createdTime = journal.CreatedDate 
                    ? new Date(journal.CreatedDate).toLocaleTimeString('en-GB', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                    }) 
                    : '';
                
                // Format with labels and proper structure
                const lines = [
                    `Notes: ${notes}`
                ];
                
                if (description) {
                    lines.push(`Description: ${description}`);
                }
                
                return lines.join('\n');
            })
            .join('\n\n'); // Add extra line break between journal entries
    }
    escapeCSV(value) {
            if (value === null || value === undefined || value === '') {
                return '';
            }
            
            const stringValue = String(value);
            
            // Check if value contains commas, quotes, or line breaks
            if (stringValue.includes(',') || 
                stringValue.includes('"') || 
                stringValue.includes('\n') || 
                stringValue.includes('\r')) {
                
                // Escape double quotes and wrap in quotes
                return '"' + stringValue.replace(/"/g, '""') + '"';
            }
            
            return stringValue;
    }
    async fetchShiftDetailsForExport(shiftId) {
            try {
                // Get basic shift data (EXISTING LOGIC)
                const shiftResult = await getAddShiftById({ shiftId });
                const shift = shiftResult.shiftwithstaffdata;
                const checklistRaw = JSON.parse(shiftResult.checklistdata || '[]');
                
                // Extract key information for NEW functionality
                const shiftDate = shift.Date__c;
                const staffId = shift.Staff__c;
                let clientId = null;
                
                if (shift.Services_and_Support_Plans__r && shift.Services_and_Support_Plans__r.length > 0) {
                    clientId = shift.Services_and_Support_Plans__r[0].Client__c;
                }
                
                // Prepare promises for parallel execution (NEW LOGIC)
                const promises = [];
                
                // Only add promises if we have required data
                if (staffId && shiftDate) {
                    promises.push(
                        getCasesByStaff({ staffId: staffId, StartDate: shiftDate })
                            .catch(err => { console.error('Error fetching cases:', err); return []; })
                    );
                } else {
                    promises.push(Promise.resolve([]));
                }
                
                if (staffId && clientId && shiftDate) {
                    promises.push(
                        getjournalsByStaff({ staffId: staffId, StartDate: shiftDate, ClientId: clientId })
                            .catch(err => { console.error('Error fetching journals:', err); return []; })
                    );
                    promises.push(
                        getformsByStaff({ staffId: staffId, StartDate: shiftDate, ClientId: clientId })
                            .catch(err => { console.error('Error fetching forms:', err); return []; })
                    );
                } else {
                    promises.push(Promise.resolve([]), Promise.resolve([]));
                }
                
                // Execute all promises in parallel
                const [incidents, journals, forms] = await Promise.all(promises);
                
                // Format time from CreatedDate (EXISTING LOGIC)
                const formatTime = (dateString) => {
                    if (!dateString) return '';
                    const date = new Date(dateString);
                    return date.toLocaleTimeString('en-GB', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: false 
                    });
                };
                
                // Clean HTML from descriptions
                const cleanHtml = (htmlString) => {
                    if (!htmlString) return '';
                    return htmlString.replace(/<[^>]*>/g, '').trim();
                };
                
                // Return COMBINED data - BOTH existing and new
                return {
                    // EXISTING DATA (from your original code)
                    servicesDelivered: (shift.Services_and_Support_Plans__r || []).map(s => ({
                        time: s.Start_Time_Formula__c || '',
                        service: s.Service_Type_Name__c || '',
                        hours: s.Qty__c || 0
                    })),
                    
                    reimbursements: (shift.Reimbursements__r || []).map(r => ({
                        item: r.Type_of_Vehicle__c || '',
                        amount: r.Total_Amount__c || 0,
                        comments: r.Comments__c || '',
                        approvalStatus: r.Approval_Status__c || ''
                    })),
                    
                    shiftNotes: shift.Add_Shift__r?.Shift_Notes__c
                        ? shift.Add_Shift__r.Shift_Notes__c
                            .split(/\r?\n/)
                            .map(n => n.trim())
                            .filter(Boolean)
                        : [],
                    
                    activityLogs: (shift.ShiftWithStaff_Activities__r || []).map(a => ({
                        time: formatTime(a.CreatedDate),
                        task: a.Notes__c || ''
                    })),
                    
                    checklist: checklistRaw.map(c => ({
                    Description__c: c.Description__c || '',
                    Completed__c: c.Completed__c || false,
                    Mandatory__c: c.Mandatory__c || false
                })),
                    
                    // NEW DATA
                    incidents: incidents || [],
                    forms: forms || [],
                    journals: journals.map(j => ({
                        notes: j.Care_Notes__c || '',
                        description: cleanHtml(j.Description__c || '')
                    })) || []
                };
                
            } catch (error) {
                console.error('❌ Error fetching shift details:', shiftId, error);
                return {
                    // Return ALL empty arrays, not just the new ones
                    servicesDelivered: [],
                    reimbursements: [],
                    shiftNotes: [],
                    activityLogs: [],
                    checklist: [],
                    incidents: [],
                    forms: [],
                    journals: []
                };
            }
    }
    async handleExportDetailedSelect(event) {
    console.log('🚀 handleExportDetailedSelect called');
    console.log('Dropdown value:', event.detail?.value);
    console.log('Start Date:', this.selectedStartDate);
    console.log('End Date:', this.selectedEndDate);
    console.log('Shift IDs:', this.shiftData.map(s => s.Id));
            const selectedValue = event.detail?.value;
            
           if (selectedValue === 'exportAll') {
    this.exportType = 'ALL';
    this.selectedFormat = 'CSV';
    this.showFormatModal = true;
}  else if (selectedValue === 'configure') {
            console.log('Configure option selected');

            // Ensure templates are loaded
            await this.loadTemplates();
            
            // Set to "NEW" by default
            this.selectedTemplateId = 'NEW';
            
            // Clear all selections
            this.clearAllSelections();
            
            // Reset unsaved changes
            this.hasUnsavedChanges = false;
            
            // Show the modal
            this.showConfigureModal = true;
            
            console.log('Configure modal opened with NEW template selected');
            }
    }
    // Add these helper methods
    formatTime(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
    }

    cleanHtml(htmlString) {
            if (!htmlString) return '';
            return htmlString.replace(/<[^>]*>/g, '').trim();
    }
    handleTemplateNameChange(event) {
    this.newTemplateName = event.target.value;
    }
    closeNameModal() {
            this.showNameModal = false;
    }
     
handleTemplateChange(event) {
    console.log('DROPDOWN CHANGED value:', event.detail.value);
    this.selectedTemplateId = event.detail.value;
    this.hasUnsavedChanges = false;
    
    if (this.selectedTemplateId === 'NEW') {
        this.clearAllSelections();
        return;
    }
    
    const tpl = this.templates.find(t => t.value === this.selectedTemplateId);
    if (tpl && tpl.json) {
        try {
            const parsed = JSON.parse(tpl.json);
            this.applyTemplate(parsed);
            this.hasUnsavedChanges = false;
        } catch (e) {
            console.error('Error parsing template JSON:', e);
            this.clearAllSelections();
            this.hasUnsavedChanges = false;
        }
    } else {
        this.clearAllSelections();
        this.hasUnsavedChanges = false;
    }
}
   
   applyTemplate(templateJson) {
    if (!templateJson || typeof templateJson !== 'object') {
        console.error('Invalid template JSON:', templateJson);
        return;
    }
    
    const newSections = this.sections.map(sec => ({
        ...sec,
        checked: templateJson[sec.key] === true
    }));
    
    this.sections = newSections;
    this.hasUnsavedChanges = false;
}
    buildTemplateJson() {
        const json = {};
        this.sections.forEach(sec => {
            json[sec.key] = sec.checked;
        });
        return json;
    }
    clearAllSelections() {
        this.sections = this.sections.map(sec => ({
            ...sec,
            checked: false
        }));
    }
    async saveTemplate() {
        try {
            console.log('saveTemplate called');

            if (!this.newTemplateName) {
                this.showToast('Error', 'Template name is required', 'error');
                return;
            }

            const hasSelectedSections = this.sections.some(
                section => section.checked
            );
            if (!hasSelectedSections) {
                this.showToast(
                    'Error',
                    'Please select at least one field ',
                    'error'
                );
                return;
            }

            const facilityId = this.facilityIdList[0];
            const templateJson = JSON.stringify(this.buildTemplateJson());

            const saved = await createTemplate({
                templateName: this.newTemplateName,
                facilityId: facilityId,
                templateJson: templateJson,
                templateId: null
            });

            console.log('Save success returned from Apex', JSON.stringify(saved));

            this.showNameModal = false;
            this.showConfigureModal = true;
            this.newTemplateName = '';
            this.hasUnsavedChanges = false;

            const newTemplate = {
                label: saved.Name || this.newTemplateName,
                value: saved.Id,
                json: saved.Template_JSON__c
            };

            const templateExistsIndex = this.templates.findIndex(
                t => t.value === saved.Id
            );

            if (templateExistsIndex > 0) {
                this.templates[templateExistsIndex] = newTemplate;
            } else {
                this.templates = [
                    this.templates[0],
                    newTemplate,
                    ...this.templates.slice(1)
                ];
            }

            this.selectedTemplateId = saved.Id;

            this.templateDropdownKey++;

            if (saved.Template_JSON__c) {
                try {
                    const parsed = JSON.parse(saved.Template_JSON__c);
                    this.applyTemplate(parsed);
                } catch (e) {
                    console.error('Error parsing template JSON', e);
                }
            }

            this.showToast('Success', 'Template saved successfully', 'success');

        } catch (error) {
    console.error('Error saving template', error);
    this.showToast(
        'Error',
        error?.body?.message || 'Failed to save template',
        'error'
    );
}
    }
    async updateTemplate() {
        try {
            console.log('updateTemplate called for template', this.selectedTemplateId);

            if (this.selectedTemplateId === 'NEW') {
                console.error('Cannot update New template');
                return;
            }

            const hasSelectedSections = this.sections.some(
                section => section.checked
            );
            if (!hasSelectedSections) {
                this.showToast(
                    'Error',
                    'Please select at least one field ',
                    'error'
                );
                return;
            }

            const facilityId = this.facilityIdList[0];
            const templateJson = JSON.stringify(this.buildTemplateJson());

            const templateIndex = this.templates.findIndex(
                t => t.value === this.selectedTemplateId
            );
            if (templateIndex === -1) {
                console.error('Template not found in local cache');
                return;
            }

            const templateName = this.templates[templateIndex].label;

            console.log('Updating template with data', {
                templateName: templateName,
                facilityId: facilityId,
                templateJson: templateJson,
                templateId: this.selectedTemplateId
            });

            const updated = await createTemplate({
                templateName: templateName,
                facilityId: facilityId,
                templateJson: templateJson,
                templateId: this.selectedTemplateId
            });
              this.hasUnsavedChanges = false;
            console.log('Update success returned from Apex', JSON.stringify(updated));

            this.templates[templateIndex] = {
                ...this.templates[templateIndex],
                json: updated.Template_JSON__c || templateJson
            };

            this.hasUnsavedChanges = false;

            this.templateDropdownKey++;

            this.showToast(
                'Success',
                'Template updated successfully',
                'success'
            );

        } catch (error) {
            console.error('Error updating template', error);
            this.showToast('Error', 'Failed to update template', 'error');
        }
    }

    async loadAndRefreshTemplates(selectTemplateId = 'NEW') {
        try {
            console.log('loadAndRefreshTemplates called will select', selectTemplateId);

            if (!this.facilityIdList || this.facilityIdList.length === 0) {
                console.log('No facilities available');

                this.templates = [{ label: 'New', value: 'NEW' }];
                this.selectedTemplateId = selectTemplateId;
                return;
            }

            const facilityId = this.facilityIdList[0];

            const currentTemplates = [...this.templates];

            try {
                const result = await getTemplatesByFacility({ facilityId });
                console.log('Templates from server', JSON.stringify(result));

                const serverTemplateMap = {};
                result.forEach(t => {
                    serverTemplateMap[t.Id] = {
                        label: t.Name || 'Unnamed Template',
                        value: t.Id,
                        json: t.Template_JSON__c
                    };
                });

                const mergedTemplates = [{ label: 'New', value: 'NEW' }];

                Object.values(serverTemplateMap).forEach(template => {
                    mergedTemplates.push(template);
                });

                currentTemplates.forEach(template => {
                    if (template.value !== 'NEW' && !serverTemplateMap[template.value]) {
                        mergedTemplates.push(template);
                    }
                });

                const uniqueTemplates = [];
                const seen = new Set();

                mergedTemplates.forEach(template => {
                    if (!seen.has(template.value)) {
                        seen.add(template.value);
                        uniqueTemplates.push(template);
                    }
                });

                this.templates = uniqueTemplates;

            } catch (serverError) {
                console.warn('Failed to fetch templates from server using local cache', serverError);
            }

            console.log('Updated templates array', JSON.stringify(this.templates));

            this.selectedTemplateId = selectTemplateId;

            this.templateDropdownKey++;

            if (selectTemplateId !== 'NEW') {
                const selectedTemplate = this.templates.find(
                    t => t.value === selectTemplateId
                );
                if (selectedTemplate && selectedTemplate.json) {
                    try {
                        const parsed = JSON.parse(selectedTemplate.json);
                        this.applyTemplate(parsed);
                    } catch (e) {
                        console.error('Error parsing template JSON', e);
                        this.clearAllSelections();
                    }
                }
            } else {
                this.clearAllSelections();
            }

        } catch (error) {
            console.error('Error in loadAndRefreshTemplates', error);
            this.selectedTemplateId = selectTemplateId;
            this.clearAllSelections();
        }
    }

    showToast(title, message, variant) {
            const event = new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            });
            this.dispatchEvent(event);
    }
    loadTemplatesAndSelect(templateId) {
            const facilityId = this.facilityIdList[0];
            getTemplatesByFacility({ facilityId })
                .then(result => {
                    this.templates = [
                        { label: 'New', value: 'NEW' },
                        ...result.map(t => ({
                            label: t.Name,
                            value: t.Id,
                            json: t.Template_JSON__c
                        }))
                    ];

                    // 🔥 FORCE RE-RENDER
                    this.templateDropdownKey++;

                    // 🔥 SET AFTER RENDER RESET
                    Promise.resolve().then(() => {
                        this.selectedTemplateId = templateId;
                    });
                })
                .catch(error => {
                    console.error('Error loading templates', error);
                });
    }
    async handleDeleteTemplate() {
        try {
            if (!this.selectedTemplateId || this.selectedTemplateId === 'NEW') {
                return;
            }

            const templateIdToDelete = this.selectedTemplateId;

            this.templates = this.templates.filter(
                t => t.value !== templateIdToDelete
            );

            this.templateDropdownKey++;

            this.selectedTemplateId = 'NEW';
            this.clearAllSelections();

            await deleteTemplate({ templateId: templateIdToDelete });

            this.showToast('Success', 'Template deleted successfully', 'success');

            setTimeout(async () => {
                try {
                    await this.syncTemplatesWithServer();
                } catch (syncError) {
                    console.warn('Background template sync failed', syncError);
                }
            }, 0);

        } catch (error) {
            console.error('Error deleting template', error);
            this.showToast('Error', 'Failed to delete template', 'error');
        }
    }

    async syncTemplatesWithServer() {
        if (!this.facilityIdList || this.facilityIdList.length === 0) return;

        const facilityId = this.facilityIdList[0];

        try {
            const result = await getTemplatesByFacility({ facilityId });

            const serverTemplates = [
                { label: 'New', value: 'NEW' },
                ...result.map(t => ({
                    label: t.Name || 'Unnamed Template',
                    value: t.Id,
                    json: t.Template_JSON__c
                }))
            ];

            this.templates = serverTemplates;

            this.templateDropdownKey++;

        } catch (error) {
            console.warn('Sync templates with server failed', error);
        }
    }


    checkIfMatchesTemplate() {
    if (this.selectedTemplateId === 'NEW') {
        const allUnchecked = this.sections.every(section => !section.checked);
        return allUnchecked;
    }
    
    const tpl = this.templates.find(t => t.value === this.selectedTemplateId);
    if (!tpl || !tpl.json) return false;
    
    try {
        const templateJson = JSON.parse(tpl.json);
        
        // Check if all sections match the template
        return this.sections.every(section => {
            return section.checked === (templateJson[section.key] === true);
        });
    } catch (e) {
        console.error('Error comparing with template:', e);
        return false;
    }
   }
   
    //end
   
     getCurrentWeekRange() {
        const today = new Date();
        const dayOfWeek = today.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6

        // Calculate difference from Monday (if Sunday, treat as 7)
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diffToMonday);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        return {
            start: this.formatDate(monday),  // Monday
            end: this.formatDate(sunday)     // Sunday
        };
    }

    formatDate(dateObj) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
   
    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }
    handleRecordsPerPage(event) {
        this.pageSize = event.target.value;
        this.isPageSizeManuallySet = true;
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
        this.shiftDataTable = [];
        if (this.totalRecords > 0) {
            this.paginationVisible = true;
        } else{
            this.paginationVisible = false;
        }
        if(this.totalRecords>0) {
            this.noRecordsFlag=false;
        }else{
            this.noRecordsFlag=true;
        }
        // calculate total pages
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        // set page number 
       // console.log('total pages '+this.totalPages );
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
        // set records to display on current page 
        let tempconList=[];
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
               // console.log('break');
                break;
            }  
            let tempConRec = Object.assign({}, this.shiftData[i]);
           
            tempconList.push(tempConRec);           
        }
        this.shiftDataTable = tempconList;  
        //console.log('tempconrec>>'+JSON.stringify(this.invoiceTable));       
    }
     

    handleChange(event) {
        const fieldName = event.target.name;
        const fieldValue = event.target.value;
         console.log(`Updated Field - ${fieldName}:`, fieldValue);
        switch (fieldName) {
            case 'startDate':
                this.selectedStartDate = fieldValue;
                console.log('Start Date changed to:', this.selectedStartDate);
                break;
            case 'endDate':
                this.selectedEndDate = fieldValue;
                console.log('End Date changed to:', this.selectedEndDate);
                break;
            case 'role':
                this.selectedRole = fieldValue;
                console.log('Role changed to:',  this.selectedRole);
                break;
            case 'employmentType':
                this.selectedEmploymentType = fieldValue;
                console.log('Employment Type  changed to:',  this.selectedEmploymentType);
                //this.fetchShiftData();
                break;
            case 'location':
                this.selectedLocation = fieldValue;
                console.log('Location changed to:',  this.selectedLocation);
                break;
            case 'participant': // ✅ NEW
                this.selectedParticipant = fieldValue;
                console.log('Participant changed to:', this.selectedParticipant);
                this.filterByParticipant();
                break;
          case 'signStatus':
                this.selectedSignStatus = fieldValue;
                console.log('Sign Status changed to:', this.selectedSignStatus);
                break; //manendra added for sign in sign out filter
            default:
                console.log('Unknown field:', fieldName);
                break;
        }

        // Optional: Add filtering or fetch logic here
    }
    filterByParticipant() {
        if (!this.selectedParticipant || this.selectedParticipant === 'All' ) {  
            this.shiftData = [...this.allShiftData];
            console.log('shiftData in if ', JSON.stringify(this.shiftData));
            console.log('shiftData LENGTH in if: ', this.shiftData.length);
        } else {
            this.shiftData = this.allShiftData.filter(
                shift => shift.participantId === this.selectedParticipant
            );
            console.log('shiftData in else ', JSON.stringify(this.shiftData));
            console.log('shiftData LENGTH in else: ', this.shiftData.length);
        }

        this.totalRecords = this.shiftData.length;
        this.pageNumber = 1;
        this.paginationHelper();
    }
    handleExport() {
       
        console.log('Exporting Shift Reports Table to CSV');
        var formattedSDate = formatDate(this.selectedStartDate);
        console.log('formattedSDate: ',  formattedSDate);
        var formattedEDate = formatDate(this.selectedEndDate);  
        console.log('formattedEDate: ',  formattedEDate);
        function formatDate(dateStr) {
            // var parts = dateStr.split('-');
            // return parts[2] + '-' + parts[1] + '-' + parts[0];

            return dateStr;
        } 

        let csvContent = '';

        // Optional: Add organization header if needed
        csvContent += `"${this.orgName || ''}"\n`;
        console.log('csvContent 1: ',  csvContent);
        // csvContent += `"Address: ${this.orgStreet || ''}, ${this.orgCity || ''}, ${this.stateCode || ''}, ${this.postalCode || ''}, ${this.countryCode || ''}"\n`;
        // csvContent += `"Contact No: ${this.contactNo || ''}"\n`;
        // csvContent += `"ABN: ${this.abn || ''}"\n\n\n`;

        csvContent += '"Shift Report"\n';
        console.log('csvContent 2: ',  csvContent);
        csvContent += `"Start Date: ${formattedSDate || ''} and End Date: ${formattedEDate || ''}"\n\n`;
        console.log('csvContent 3: ',  csvContent);
        // CSV Header matching the table
        csvContent += '"Date","Shift Type","Staff Name","Scheduled Time","Participants"\n';
        console.log('csvContent 4: ',  csvContent);
        //Loop through shifts and build rows
        // this.staffData.forEach(shift => {
        //     csvContent += `"${shift.Start_Date__c || ''}",` +
        //                 `"${shift.Shift_Type__c || ''}",` +
        //                 `"${shift.Staff_Name__c || ''}",` +
        //                 `"${shift.Add_Shift__r.Shift_Start_End_Time__c || ''}",` ;
        //                 // `"${(shift.Services_and_Support_Plans__r || []).map(p => p.Participant_Name__c).join(', ') || ''}",` ;
                       
        // });
        function escapeCSV(value) {
            if (typeof value !== 'string') return value || '';
            // Double quotes inside values must be escaped by doubling them
            return `"${value.replace(/"/g, '""')}"`;
        }
        this.shiftData.forEach((shift, index) => {
            const rawShift = JSON.parse(JSON.stringify(shift));
            console.log(`Raw shift index ${index}:`, rawShift);

            // const startDate = rawShift.date || '';
            const startDate = this.formatDateForCSV(rawShift.rawDate);
            const shiftType = rawShift.shiftType || '';
            const staffName = rawShift.name || '';
            const shiftTime = rawShift.scheduledTime || '';
            const participant = rawShift.participants || '';
            console.log('Start Date:', startDate);
            console.log('shiftType  :', shiftType);
            console.log('staffName  :', staffName);
            console.log('shiftTime  :', shiftTime);
            console.log('participant:', participant);
            
            //csvContent += `"${startDate}","${shiftType}","${staffName}","${shiftTime}", "${participant}"\n`;
            csvContent += [
                    // (startDate),
                    `="${startDate}"`,
                    (shiftType),
                    (staffName),
                    (shiftTime),
                    escapeCSV(participant)
                ].join(',') + '\n';
        });

        console.log('csvContent 5: ',  csvContent);
        // Download logic
        const element = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
        const downloadElement = document.createElement('a');
        downloadElement.href = element;
        downloadElement.target = '_self';
        downloadElement.download = 'ShiftReport.csv';
        document.body.appendChild(downloadElement);
        downloadElement.click();
         this.isViewFlag = false;
    }
    handleView(event){
         const shiftId = event.currentTarget.dataset.id;
         // const amazonUrl = event.target.dataset.url;

        console.log('Clicked shift ID:', shiftId);
        this.shiftId = shiftId;
        this.isViewFlag = true;
         console.log('isViewFlag  in handleView: ', this.isViewFlag);
        this.isHome = false;
        console.log('isHome  in handleView: ', this.isHome);
    }
    handleBackNavigate() {
         this.isViewFlag = false; 
         this.isHome = true;
    }
    // handleDownload(event) {
    //     const shiftId = event.currentTarget.dataset.id; 
    //     if (!shiftId) {
    //         console.error('Shift ID not found in dataset');
    //         return;
    //     }

    //     console.log('Clicked shift ID in handleDownload:', shiftId);
    //     const vfPageName = 'ShiftReportsDownloadPdf'; // your Visualforce page name
    //     const baseUrl = window.location.origin; // e.g., https://mydomain.lightning.force.com
 
    //     // Optional: pass parameters if your VF page/controller uses them
    //     const url = `${baseUrl}/apex/${vfPageName}?shiftId=${shiftId}`;
 
    //     // Open the Visualforce PDF page in a new tab
    //     window.open(url, '_blank');
    // }
    handleDownload(event) {
        const shiftId = event.currentTarget.dataset.id;
        if (!shiftId) {
            console.error('Shift ID not found in dataset');
            return;
        }

        console.log('Clicked shift ID in handleDownload:', shiftId);

        // Construct VF domain URL properly
        const vfPageName = 'ShiftReportsDownloadPdf';
        const baseUrl = window.location.origin.replace('.lightning.force.com', '.visual.force.com');
        const url = `${baseUrl}/apex/${vfPageName}?shiftId=${shiftId}`;

        window.open(url, '_blank');
    }
     handleBack() {
        this.selectedStartDate = '';
        this.selectedEndDate = '';
        this.selectedRole = '';
        this.selectedEmploymentType = '';
        this.selectedLocation = '';
        this.isHome = false;

        this.dispatchEvent(new CustomEvent("shiftreportback"));
    }
  

    get formatOptions() {
    return [
        { label: 'CSV', value: 'CSV' },
        { label: 'PDF', value: 'PDF' }
    ];
}

handleFormatChange(event) {
    this.selectedFormat = event.detail.value;
}

closeFormatModal() {
    this.showFormatModal = false;
}

handleDownloadConfirm() {
    console.log('Download confirmed:', this.exportType, this.selectedFormat);

    this.showFormatModal = false;

    // EXPORT ALL
    if (this.exportType === 'ALL') {

        if (this.selectedFormat === 'CSV') {

            // ✅ Select ALL sections automatically
            this.sections = this.sections.map(sec => ({
                ...sec,
                checked: true
            }));

            this.exportFilteredCSV();  // ✅ correct method

        } else {
            this.handleExportAllPDF();
        }
    }

    // CONFIG EXPORT
    if (this.exportType === 'CONFIG') {

        if (this.selectedFormat === 'CSV') {
            this.exportFilteredCSV();   // already correct
        } else {
            this.handleExportReportPDF();
        }
    }
}

handleExportAllPDF() {
    console.log('Export All PDF triggered');

    const shiftIds = this.shiftData.map(s => s.Id).join(',');
    const orgName = this.orgName || '';
    const startDate = this.selectedStartDate || '';
    const endDate = this.selectedEndDate || '';
    const allSections = {};
    this.sections.forEach(sec => {
        allSections[sec.key] = true;
    });

    const baseUrl = window.location.origin.replace(
        '.lightning.force.com',
        '.visual.force.com'
    );

    const url = `${baseUrl}/apex/ShiftReportsBulkPdf` +
        `?shiftIds=${shiftIds}` +
        `&sections=${encodeURIComponent(JSON.stringify(allSections))}` +
        `&orgName=${encodeURIComponent(orgName)}` +
        `&startDate=${encodeURIComponent(startDate)}` +
        `&endDate=${encodeURIComponent(endDate)}`;

    console.log('PDF URL:', url);

    window.open(url, '_blank');
}
handleExportReportPDF() {
    console.log('Export Config PDF triggered');

    const shiftIds = this.shiftData.map(s => s.Id).join(',');
    const orgName = this.orgName || '';
    const startDate = this.selectedStartDate || '';
    const endDate = this.selectedEndDate || '';
    const selectedSections = {};
    this.sections.forEach(sec => {
        selectedSections[sec.key] = sec.checked;
    });

    const baseUrl = window.location.origin.replace(
        '.lightning.force.com',
        '.visual.force.com'
    );

    const url = `${baseUrl}/apex/ShiftReportsBulkPdf` +
        `?shiftIds=${shiftIds}` +
        `&sections=${encodeURIComponent(JSON.stringify(selectedSections))}` +
        `&orgName=${encodeURIComponent(orgName)}` +
        `&startDate=${encodeURIComponent(startDate)}` +
        `&endDate=${encodeURIComponent(endDate)}`;

    console.log('PDF URL:', url);

    window.open(url, '_blank');
}

// For UI (dd/mm/yyyy)
formatDateForUI(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB');
}

// For CSV (yyyy-mm-dd)
formatDateForCSV(dateStr) {
    if (!dateStr) return '';

    const d = new Date(dateStr);

    // ✅ Prevent NaN issue
    if (isNaN(d.getTime())) {
        console.warn('Invalid date:', dateStr);
        return '';
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
formatLoginLogoutTime(loginTime, logoutTime) {

    if (!loginTime || !logoutTime) {
        return '';
    }

    const formatTime = (milliseconds) => {

        let totalSeconds = Math.floor(milliseconds / 1000);

        let hours = Math.floor(totalSeconds / 3600);
        let minutes = Math.floor((totalSeconds % 3600) / 60);

        const ampm = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12;

        if (hours === 0) {
            hours = 12;
        }

        const formattedMinutes =
            minutes < 10
                ? '0' + minutes
                : minutes;

        return `${hours}:${formattedMinutes} ${ampm}`;
    };

    return `${formatTime(loginTime)} - ${formatTime(logoutTime)}`;
}

    renderedCallback() {
        this.setupResizeObserver();
    }

    disconnectedCallback() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        if (this._resizeTimeout) {
            clearTimeout(this._resizeTimeout);
        }
    }

    setupResizeObserver() {
        if (this.isPageSizeManuallySet) {
            return;
        }

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        } else {
            this.resizeObserver = new ResizeObserver((entries) => {
                if (this._resizeTimeout) {
                    clearTimeout(this._resizeTimeout);
                }
                this._resizeTimeout = setTimeout(() => {
                    this.calculateDynamicPageSizes(entries);
                }, 100);
            });
        }

        const containers = this.template.querySelectorAll('.table-container');
        containers.forEach(container => {
            this.resizeObserver.observe(container);
        });
    }

    calculateDynamicPageSizes(entries) {
        if (this.isPageSizeManuallySet) {
            return;
        }
        let sizeChanged = false;
        for (let entry of entries) {
            const container = entry.target;
            const height = entry.contentRect.height;
            if (height <= 0) continue;

            const headerEl = container.querySelector('thead, .header-wrapper');
            let headerHeight = 45;
            if (headerEl) {
                headerHeight = headerEl.getBoundingClientRect().height || headerEl.offsetHeight || 45;
            }

            const availableHeight = height - headerHeight - 10;
            let rows = Math.floor(availableHeight / 48);
            if (rows < 2) {
                rows = 2;
            }

            if (this.pageSize !== rows) {
                this.pageSize = rows;
                sizeChanged = true;
            }
        }

        if (sizeChanged) {
            this.paginationHelper();
        }
    }
}