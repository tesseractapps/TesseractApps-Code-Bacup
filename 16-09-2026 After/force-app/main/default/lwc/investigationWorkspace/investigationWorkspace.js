import { LightningElement, track, wire, api } from 'lwc';
import getInvestigationData from '@salesforce/apex/IncidentInvestigationController.getInvestigationData';
import saveInvestigationAssessment from '@salesforce/apex/IncidentInvestigationController.saveInvestigationAssessment';
import saveCorrectiveAction from '@salesforce/apex/IncidentInvestigationController.saveCorrectiveAction';
import saveNdisSubmission from '@salesforce/apex/IncidentInvestigationController.saveNdisSubmission';
import completeAction from '@salesforce/apex/IncidentInvestigationController.completeAction';
import getStaffRecords from '@salesforce/apex/IncidentRegisterControllerV2.getStaffRecords';
import getStaffsByOrg from '@salesforce/apex/IncidentRegisterControllerV2.getStaffsByOrg';
import syncIncidentMetadataFromInvestigation from '@salesforce/apex/IncidentRegisterControllerV2.syncIncidentMetadataFromInvestigation';

import getIncidentResponseForAssessment from '@salesforce/apex/IncidentInvestigationController.getIncidentResponseForAssessment';
import saveInvestigation from '@salesforce/apex/IncidentInvestigationController.saveInvestigation';
import getInvestigationForAssessment from '@salesforce/apex/IncidentInvestigationController.getInvestigationForAssessment';
import getLoggedInStaffDetails from '@salesforce/apex/IncidentInvestigationController.getLoggedInStaffDetails';
import saveIncidentEvidence from '@salesforce/apex/IncidentInvestigationController.saveIncidentEvidence';
import deleteIncidentEvidence from '@salesforce/apex/IncidentInvestigationController.deleteIncidentEvidence';
import deleteAwsFiles from '@salesforce/apex/AwsBatchController.deleteFiles';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class InvestigationWorkspace extends LightningElement {
    @api recordId;
    @api recordUid;
    @api responseId;

    @track severity = '';
    @track isNdisReportable = false;
    @track participant = '';
    @track incidentType = '';
    @track reportedOn = '';
    @track reportedBy = '';
    @track incidentLocation = '';
    @track attachmentsSummary = '';

    // Form variables
    // @track ndisReportableVal = 'Yes';
    @track ndisReportableVal = 'No';
    @track statusVal = '';
    @track assignedInvestigator = '';
    @track assessmentNotes = '';
    //@track findings = 'participant slipped while transferring from bed to wheel chair due to wet floor in the hall floor it was not cleaned properly by the previous shift staff and doors was opened towards the main road.';
    @track findings = '';
    @track finalNotes = '';
    @track acknowledged = false;

    // Relational details
    @track correctiveActions = [];
    @track ndisSubmissions = [];
    @track activities = [];
    @track staffOptions = [];

    // Modal Control Flags
    @track showResolvedModal = false;
    @track showActionModal = false;
    @track showRecordNdisModal = false;
    @track showViewNdisModal = false;

    // NDIS submission temp storage
    @track ndisStageType = '';
    @track ndisSubmittedBy = '';
    @track ndisSubDate = '';
    @track ndisSubTime = '';
    @track ndisSubRef = '';
    @track ndisSubNotes = '';
    @track activeSubmission = {};

    // Corrective Action temp storage
    @track newActionTitle = '';
    @track newActionDescription = '';
    @track newActionOwner = '';
    @track newActionDueDate = '';

    @track responseRecord;
    @track participantPhoto = null;
    @track participantInitials = '';
    @track participantAvatarStyle = '';
    @track reportedByInitials = '';
    @track reportedByAvatarStyle = '';
    @track assignedStaff = '';
    @track assignedStaffPhoto = null;
    @track assignedStaffInitials = '';
    @track assignedStaffAvatarStyle = '';
    @track priorityClass;
    @track lastUpdated = '';
    @track lastUpdatedBy = '';
    @track lastUpdatedByInitials = '';
    @track lastUpdatedByAvatarStyle = '';
    @track isViewAction = false;
    @track actionModalTitle = 'Add Corrective Action';
    @track showAwsBatchUpload = false;
   // @track showNdisAwsBatchUpload = false;
    @track uploadedFiles = [];
    @track evidenceTitle='Add Evidence';
    @track attachmentNameValue= '';
    @track rawIncidentCreatedDate;
    @track initialNotificationRecordedDate = null;
    @track fiveDayReportRecordedDate = null;
    @track evidenceAttachments = [];
    @track loggedInStaffId = '';
    @track loggedInStaffName = '';
    @track isModalOpen = false;
    @track currentUrl;
    @track pendingNdisAttachments = [];
    @track handleDeleteEvidenceFlag = false;
    pendingDeleteEvidenceId = null;
    pendingDeleteAwsKey = null;

    investigationId =  null;
    @api orgid = "";
    @track savedStatusVal = '';

    
    async connectedCallback() {
        console.log("📌 Received responseId  in Start Assesment:", this.responseId);
        console.log("📌 Received orgid  in Start Assesment:", this.orgid);
        //console.log("🔹 Received recordUid in Start Assesment:", this.recordUid);
        try {
            const staffDetails = await getLoggedInStaffDetails();

            this.loggedInStaffId = staffDetails?.staffId || '';
            this.loggedInStaffName = staffDetails?.staffName || '';
            console.log(' Logged in Staff Id:',this.loggedInStaffId );
            console.log(' Logged in Staff Name:',this.loggedInStaffName );
            await this.getStaffValues();
            await this.loadIncidentResponse();
            await this.loadInvestigation();

        } catch (error) {
            console.error(
                'Error initializing Investigation Workspace:',
                error
            );
        }
    }

    // @wire(getStaffRecords, { orgId: '$orgid' })
    // wiredStaff({ data, error }) {
    //     if (data) {
    //          console.log("data in getStaffRecords==>" + JSON.stringify(data));
    //         this.staffOptions = data.map(stf => ({
    //             label: stf.NameToDisplay__c || stf.Name,
    //             value: stf.Id
    //         }));
    //     }
    // }

    // @wire(getInvestigationData, { responseId: '$responseId' })
    // wiredData(result) {
    //     this.wiredDataResult = result;
    //     console.log("result in getInvestigationData==>" + JSON.stringify(result));
    //     if (result.data) {
    //         const data = result.data;
    //         this.correctiveActions = data.correctiveActions;
    //         this.ndisSubmissions = data.ndisSubmissions;
            
    //         if (data.investigation) {
    //             const inv = data.investigation;
    //             this.investigationId = inv.Id;
    //             this.severity = inv.Severity__c || this.severity;
    //             // this.ndisReportableVal = inv.NDIS_Reportable__c || 'No';
    //             // this.isNdisReportable = this.ndisReportableVal === 'Yes';
    //             // this.statusVal = inv.Status__c || 'In Progress';
    //             this.ndisReportableVal = inv.NDIS_Reportable__c || '';
    //             this.isNdisReportable = this.ndisReportableVal === '';
    //             this.statusVal = inv.Status__c || 'In Progress';
    //             this.assignedInvestigator = inv.Assigned_Investigator__c;
    //             this.assessmentNotes = inv.Assessment_Notes__c;
    //             this.findings = inv.Findings_Summary__c || this.findings;
    //             this.finalNotes = inv.Final_Notes__c;
    //         }
    //     } else if (result.error) {
    //         console.error('Error fetching workspace investigation: ', result.error);
    //     }
    // }

    get ndisOptions() {
        return [
            // { label: 'Yes Reportable', value: 'Yes' },
            // { label: 'No Reportable', value: 'No' }
            { label: 'Yes', value: 'Yes' },
            { label: 'No', value: 'No' }
        ];
    }

    get statusOptions() {
        return [
            { label: 'Open', value: 'Open' },
            { label: 'In Progress', value: 'In Progress' },
            { label: 'Resolved', value: 'Resolved' }
        ];
    }

    get priorityOptions() {
        return [
            { label: 'Low', value: 'Low' },
            { label: 'Medium', value: 'Medium' },
            { label: 'High', value: 'High' },
            { label: 'Critical', value: 'Critical' }
        ];
    }

    get booleanOptions() {
        return [
            { label: 'Yes', value: 'Yes' },
            { label: 'No', value: 'No' }
        ];
    }

    get isNdisPanelVisible() {
        return this.isNdisReportable;
    }
    get isNdisNotReportable() {
        return this.ndisReportableVal === 'No';
    }

    
    getAvatarColor(name) {
        const colors = [
            "#1976d2",
            "#388e3c",
            "#f57c00",
            "#7b1fa2",
            "#c2185b",
            "#455a64",
            "#0097a7",
            "#5d4037"
        ];

        let hash = 0;

        for (let i = 0; i < name.length; i++) {
            hash += name.charCodeAt(i);
        }

        return colors[hash % colors.length];
    }
    get isResolved() {
        return this.statusVal === 'Resolved';
    }

    // get isFinalSectionDisabled() {
    //     return !this.isResolved;
    // }
    get isFinalSectionDisabled() {
        if (this.isIncidentLocked) {         
            return true;                      
        }                                      
        return !this.isResolved;
    }

    get actionButtonLabel() {
        return this.isResolved
            ? 'Resolve Incident'
            : 'Save';
    }


    // handleNdisChange(event) {
    //     this.ndisReportableVal = event.target.value;
    //     this.isNdisReportable = this.ndisReportableVal === 'Yes';
    // }

    handleStatusChange(event) {
        const val = event.target.value;
        if (val === 'Resolved') {
            // Trigger resolved status warning popup modal
            this.showResolvedModal = true;
        } else {
            this.statusVal = val;
        }
    }
    get isIncidentLocked() {
        return this.savedStatusVal === 'Resolved';
    }

    // handleInvestigatorChange(event) {
    //     this.assignedInvestigator = event.target.value;
    // }

    // handleNotesChange(event) {
    //     this.assessmentNotes = event.target.value;
    // }

    // handlePriorityChange(event) {
    //     this.severity = event.target.value;
    // }

    // handleFindingsChange(event) {
    //     this.findings = event.target.value;
    // }

    // handleFinalNotesChange(event) {
    //     this.finalNotes = event.target.value;
    // }

    handleAcknowledgementChange(event) {
        this.acknowledged = event.target.checked;
    }

    handleCloseResolvedModal() {
        this.showResolvedModal = false;
        // Revert status change display value to previous status (e.g. In Progress)
        this.statusVal = 'In Progress';
    }

    handleConfirmResolvedStatus() {
        this.showResolvedModal = false;
        this.statusVal = 'Resolved';
    }

    handleBack() {
        this.dispatchEvent(new CustomEvent('back'));
        this.dispatchEvent(new CustomEvent('navigate', {
            detail: {
                targetView: 'dashboard',
                tab: 'incidents'
            }
        }));
    }

    // async handleSave() {
    //     if (!this.investigationId) return;
        
    //     const invRecord = {
    //         Id: this.investigationId,
    //         Severity__c: this.severity,
    //         Status__c: this.statusVal,
    //         Assigned_Investigator__c: this.assignedInvestigator,
    //         NDIS_Reportable__c: this.ndisReportableVal,
    //         Assessment_Notes__c: this.assessmentNotes,
    //         Findings_Summary__c: this.findings,
    //         Final_Notes__c: this.finalNotes
    //     };

    //     try {
    //         await saveInvestigationAssessment({ inv: invRecord });
    //         this.showToast('Success', 'Investigation saved successfully.', 'success');
    //         refreshApex(this.wiredDataResult);
    //     } catch(e) {
    //         this.showToast('Error', e.body ? e.body.message : e.message, 'error');
    //     }
    // }

    // async handleResolve() {
    //     if (!this.acknowledged) {
    //         this.showToast('Validation Error', 'You must acknowledge having reviewed the incident before resolving it.', 'warning');
    //         return;
    //     }
    //     this.statusVal = 'Resolved';
    //    // await this.handleSave();
    // }

    // handleResolveClick() {
    //     this.handleResolve();
    // }

    // Corrective Action Handling
    handleOpenActionModal() {
        
        this.isViewAction = false;
        this.actionModalTitle = 'Add Corrective Action';
        this.showActionModal = true;
        this.editingActionId = null;
    }

    handleCloseActionModal() {
        this.showActionModal = false;
        this.newActionTitle = '';
        this.newActionOwner = '';
        this.newActionDueDate = '';
        this.newActionDescription = '';
        this.isViewAction = false;
        this.actionModalTitle = 'Add Corrective Action';
        this.editingActionId = null;
        //this.editingActionTempId = null;
    }

    // handleActionTitleChange(event) { this.newActionTitle = event.target.value; }
    // handleActionOwnerChange(event) { this.newActionOwner = event.target.value; }
    // handleActionDueDateChange(event) { this.newActionDueDate = event.target.value; }

    // async handleSaveCorrectiveAction() {
    //     if (!this.newActionTitle || !this.newActionOwner || !this.newActionDueDate) {
    //         this.showToast('Validation Error', 'All fields are mandatory to save the Action.', 'warning');
    //         return;
    //     }
        
    //     const action = {
    //         Incident_Investigation__c: this.investigationId,
    //         Action_Title__c: this.newActionTitle,
    //         Assigned_Owner__c: this.newActionOwner,
    //         Due_Date__c: this.newActionDueDate
    //     };

    //     try {
    //         await saveCorrectiveAction({ action: action });
    //         this.showToast('Success', 'Corrective Action added successfully.', 'success');
    //         this.handleCloseActionModal();
    //        // refreshApex(this.wiredDataResult);
    //     } catch(e) {
    //         this.showToast('Error', e.body ? e.body.message : e.message, 'error');
    //     }
    // }

    // NDIS Submissions Handling
    handleOpenRecordNdisModal(event) {
        // if (!this.investigationId) {
        //     this.showToast('Save Required', 'Please save the investigation before recording an NDIS submission.', 'warning');
        //     return;
        // }
        this.ndisStageType = event.currentTarget.dataset.type;
        this.showRecordNdisModal = true;
        //this.showNdisAwsBatchUpload = true;
    }

    handleCloseRecordNdisModal() {
        this.showRecordNdisModal = false;
        this.ndisSubmittedBy = '';
        this.ndisSubDate = '';
        this.ndisSubTime = '';
        this.ndisSubRef = '';
        this.ndisSubNotes = '';
        this.pendingNdisAttachments = [];
        this.uploadedFiles = [];
        this.attachmentNameValue = '';
        //this.showNdisAwsBatchUpload = false;
    }

    handleNdisSubByChange(event) { this.ndisSubmittedBy = event.target.value; }
    handleNdisSubDateChange(event) { this.ndisSubDate = event.target.value; }
    handleNdisSubTimeChange(event) { this.ndisSubTime = event.target.value; }
    handleNdisSubRefChange(event) { this.ndisSubRef = event.target.value; }
    handleNdisSubNotesChange(event) { this.ndisSubNotes = event.target.value; }

    // async handleSaveNdisSubmission() {
    //     if (!this.ndisSubmittedBy || !this.ndisSubDate || !this.ndisSubRef || !this.ndisSubNotes) {
    //         this.showToast('Validation Error', 'All fields are mandatory to save the submission record.', 'warning');
    //         return;
    //     }

    //     const submission = {
    //         Incident_Investigation__c: this.investigationId,
    //         Submission_Type__c: this.ndisStageType,
    //         Submitted_By__c: this.ndisSubmittedBy,
    //         Submission_Date__c: this.ndisSubDate,
    //         Submission_Time__c: this.ndisSubTime ? this.ndisSubTime : '12:00:00.000Z',
    //         Reference_Number__c: this.ndisSubRef,
    //         Summary_Notes__c: this.ndisSubNotes
    //     };

    //     try {
    //         await saveNdisSubmission({ sub: submission });
    //         this.showToast('Success', `Recorded NDIS ${this.ndisStageType} submission.`, 'success');
    //         this.handleCloseRecordNdisModal();
    //         refreshApex(this.wiredDataResult);
    //     } catch(e) {
    //         this.showToast('Error', e.body ? e.body.message : e.message, 'error');
    //     }
    // }

    handleOpenViewNdisModal(event) {
        const type = event.currentTarget.dataset.type;
        this.ndisStageType = type;
        const sub = this.ndisSubmissions.find(s => s.Submission_Type__c === type);
        if (sub) {
            // this.activeSubmission = {
            //     ...sub,
            //     userName: sub.Submitted_By__r ? sub.Submitted_By__r.Name : '',
            //     dateTimeStr: `${sub.Submission_Date__c}`
            // };

            const submitterName =
                sub.Submitted_By__r?.NameToDisplay__c ||
                sub.Submitted_By__r?.Name ||
                this.staffOptions.find(opt => opt.value === sub.Submitted_By__c)?.label ||
                '—';

            this.activeSubmission = {
                ...sub,
                userName: submitterName,
                dateTimeStr: this.formatSubmissionDateTime(sub.Submission_Date__c, sub.Submission_Time__c)
            };
            this.showViewNdisModal = true;
        } else {
            this.showToast('Not Found', 'No submission record found for this stage.', 'warning');
        }
    }

    handleCloseViewNdisModal() {
        this.showViewNdisModal = false;
        this.activeSubmission = {};
    }
    handleEvidenceCloseModal() {
        this.showAwsBatchUpload = false;
        this.evidenceTitle='Add Evidence';
    }

    handleAddEvidence() {
        // Choose file mockup interaction
        //this.showToast('Mock Upload', 'Selecting S3 multipart upload file...', 'info');
        this.showAwsBatchUpload = true;
        this.evidenceTitle='Add Evidence';

    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        }));
    }

    async loadIncidentResponse() {
        console.log( 'loadIncidentResponse is called.' );
        if (!this.responseId) {
            console.error( '❌ responseId is missing.' );
            return;
        }

        try {
            const response =
                await getIncidentResponseForAssessment({
                    responseId: this.responseId
                });

            console.log(' Incident Response for Assessment:',JSON.stringify(response, null, 2));

            if (!response) {
                console.error( ' No Incident_Register_Response__c found.' );
                return;
            }
            this.responseRecord = response;
            this.activities = this.parseHistoryLog(response.History_Log__c);
            this.participant = response.Participant__r?.Name__c || '—';
            this.participantPhoto = response.Participant__r?.Picture__c || null;
            this.participantInitials = this.getInitials(this.participant);
            this.participantAvatarStyle =
                `background-color:${this.getAvatarColor(
                    this.participant
                )};`;
            this.incidentType = response.Name__c || response.Form_Type__c || '—';
            this.severity = response.Severity__c || '';
            this.priorityClass =this.getPriorityClass(this.severity);
            // this.ndisReportableVal = response.NDIS_Reportable__c || '';
            // this.isNdisReportable = this.ndisReportableVal === 'Yes';
            this.reportedOn =this.formatDate(response.CreatedDate);
            this.rawIncidentCreatedDate =  response.CreatedDate;
            this.reportedBy = response.CreatedBy?.Full_Name__c || response.CreatedBy?.Name || '—';
            this.reportedByInitials = this.getInitials(this.reportedBy);
            this.reportedByAvatarStyle =
                `background-color:${this.getAvatarColor(
                    this.reportedBy
                )};`;

            this.incidentLocation = response.Facility__r?.Name || '—';
            this.facilityVal =  response.Facility__c|| '';
            console.log( ' this.facilityVal in loadIncidentResponse : ', this.facilityVal );
            this.assignedStaff =response.Incident_Assigned_Staff__c || '';
            this.assignedStaffName =
                response.Incident_Assigned_Staff__r
                    ?.NameToDisplay__c ||
                response.Incident_Assigned_Staff__r
                    ?.Name ||
                '—';
            console.log( ' this.assignedStaff in loadIncidentResponse : ', this.assignedStaff );   
            this.assignedStaffPhoto =
                response.Incident_Assigned_Staff__r
                    ?.Picture__c || null;

            this.assignedStaffInitials = this.getInitials(this.assignedStaffName);
            this.assignedStaffAvatarStyle =
                `background-color:${this.getAvatarColor(
                    this.assignedStaffName
                )};`;
            //this.statusVal =response.Status__c || 'In Progress';
            //this.statusVal =response.Status__c || '';
            this.statusVal = this.normalizeStatusValue(response.Status__c);
            this.savedStatusVal = this.normalizeStatusValue(response.Status__c);
            console.log( ' this.statusVal in loadIncidentResponse : ', this.statusVal ); 
            console.log( ' this.severity in loadIncidentResponse : ', this.severity );  

        } catch (error) {
            console.error(' Error loading Incident Response:',error );
        }
    }

    getInitials(name) {
        if (!name || name === '—') {
            return '';
        }

        return name
            .split(' ')
            .filter(word => word)
            .map(word => word[0].toUpperCase())
            .slice(0, 2)
            .join('');
    }
            
    formatDate(isoDate) {
        if (!isoDate) return "N/A";

        const date = new Date(isoDate);

        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, "0");

        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;

        return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
    }
    getPriorityClass(severity) {

        let priorityClass = 'priority-pill ';
        if (severity === 'Critical' || severity === 'High') {
            priorityClass += 'priority-high';
        } else if (severity === 'Medium') {
            priorityClass += 'priority-medium';
        } else {
            priorityClass += 'priority-low';
        }

        return priorityClass;
    }
    //  getStaffValues() {
    //     console.log( 'getStaffValues is called.' );
    //     const storedFacilityId = localStorage.getItem("defaultFacilityId");
    //     console.log( 'storedFacilityId getStaffValues : ',storedFacilityId );
    //     const facilityId =this.facilityVal || storedFacilityId;
    //     console.log( 'facilityId getStaffValues : ',facilityId );
    //     if (!facilityId || !this.orgid) {
    //         this.staffOptions = [];
    //         return;
    //     }

    //     getStaffsByOrg({
    //         recordId: this.orgid,
    //         facilityId: facilityId
    //     })
    //     .then((response) => {

    //         this.staffOptions =
    //             (response || []).map((record) => ({
    //                 value: record.Id,
    //                 label:
    //                     record.NameToDisplay__c ||
    //                     record.Name
    //             }));

    //         console.log(
    //             "staffOptions:",
    //             JSON.stringify(this.staffOptions)
    //         );
    //     })
    //     .catch((error) => {
    //         console.error(
    //             "Error fetching staff:",
    //             error
    //         );

    //         this.staffOptions = [];
    //     });
    // }
    async getStaffValues() {
        console.log('getStaffValues is called.');

        const storedFacilityId = localStorage.getItem("defaultFacilityId");
        console.log('storedFacilityId getStaffValues:', storedFacilityId);

        const facilityId = this.facilityVal || storedFacilityId;
        console.log('facilityId getStaffValues:', facilityId);

        if (!facilityId || !this.orgid) {
            this.staffOptions = [];
            return;
        }

        try {
            const response = await getStaffsByOrg({
                recordId: this.orgid,
                facilityId: facilityId
            });

            this.staffOptions = (response || []).map((record) => ({
                value: record.Id,
                label: record.NameToDisplay__c || record.Name
            }));

            console.log(
                "staffOptions:",
                JSON.stringify(this.staffOptions)
            );

        } catch (error) {
            console.error("Error fetching staff:", error);
            this.staffOptions = [];
        }
    }

    handleChange(event) {
        const field = event.target.dataset.field;
        const value = event.target.value;

        switch (field) {
            case 'ndisReportable':
                this.ndisReportableVal = value;
                this.isNdisReportable = value === 'Yes';
                break;

            case 'assessmentNotes':
                this.assessmentNotes = value;
                break;

            case 'findings':
                this.findings = value;
                break;

            case 'finalNotes':
                this.finalNotes = value;
                break;

            case 'assignedStaff':
                this.assignedStaff = value;
                break;

            case 'severity':
                this.severity = value;
                break;

            default:
                break;
        }
    }

    handleCorrectiveActionChange(event) {
        const field = event.target.dataset.field;
        const value = event.target.value;

        switch (field) {
            case 'actionTitle':
                this.newActionTitle = value;
                break;

            case 'actionDescription':
                this.newActionDescription = value;
                 console.log('newActionDescription  in handleCorrectiveActionChange:', this.newActionDescription);
                break;

            case 'actionOwner':
                this.newActionOwner = value;
                break;

            case 'actionDueDate':
                this.newActionDueDate = value;
                break;

            default:
                break;
        }
    }

    // handleSaveCorrectiveAction() {
    //     if (!this.newActionTitle || !this.newActionOwner || !this.newActionDueDate) {
    //         this.showToast('Validation Error', 'All fields are mandatory to save the Action.', 'warning');
    //         return;
    //     }

    //     const selectedOwner = this.staffOptions.find(staff => staff.value === this.newActionOwner);
    //     if (this.editingActionId || this.editingActionTempId) {
    //         this.correctiveActions = this.correctiveActions.map(action => {
    //             const isEditing = (this.editingActionTempId && action.tempId === this.editingActionTempId) ||
    //                 (this.editingActionId && action.Id === this.editingActionId);

    //             if (!isEditing) {
    //                 return action;
    //             }

    //             return {
    //                 ...action,
    //                 Action_Title__c: this.newActionTitle,
    //                 Description__c: this.newActionDescription,
    //                 Assigned_Owner__c: this.newActionOwner,
    //                 Assigned_Owner_Name: selectedOwner ? selectedOwner.label : '',
    //                 Due_Date__c: this.newActionDueDate,
    //                 formattedDueDate: this.newActionDueDate
    //                     ? new Date(this.newActionDueDate).toLocaleDateString('en-GB')
    //                     : ''
    //             };
    //         });

    //         this.showToast('Success', 'Corrective Action updated successfully.', 'success');
    //     } else {
    //         const action = {
    //             tempId: Date.now().toString(),
    //             Action_Title__c: this.newActionTitle,
    //             Description__c: this.newActionDescription,
    //             Assigned_Owner__c: this.newActionOwner,
    //             Assigned_Owner_Name: selectedOwner ? selectedOwner.label : '',
    //             Due_Date__c: this.newActionDueDate,
    //             formattedDueDate: this.newActionDueDate
    //                     ? new Date( this.newActionDueDate).toLocaleDateString('en-GB')
    //                     : '',
    //             Status__c: 'Open'
    //         };

    //         this.correctiveActions = [...this.correctiveActions, action];
           
    //         this.showToast('Success', 'Corrective Action added successfully.', 'success');
    //     }
    //     console.log('Corrective Actions:', JSON.stringify(this.correctiveActions, null, 2));
    //     this.handleCloseActionModal();
    // }

    // async handleSave() {
    //     if (!this.responseId || !this.ndisReportableVal || !this.statusVal || !this.assignedStaff) {
    //         this.showToast('Validation Error', 'Please complete all required fields.', 'warning');
    //         return;
    //     }

    //     if (this.statusVal === 'Resolved' && (!this.finalNotes || !this.acknowledged)) {
    //         this.showToast('Validation Error', 'Final Notes and Acknowledgement are required to resolve the incident.', 'warning');
    //         return;
    //     }

    //     const investigation = {
    //         Incident_Response__c: this.responseId,
    //         NDIS_Reportable__c: this.ndisReportableVal || '',
    //         Assessment_Notes__c: this.assessmentNotes || '',
    //         Findings_Summary__c: this.findings || '',
    //         Final_Notes__c: this.statusVal === 'Resolved' ? (this.finalNotes || '') : '',
    //         Status__c: this.statusVal || '',
    //         Assigned_Investigator__c: this.assignedStaff || '',
    //         Severity__c: this.severity || ''
    //     };

    //     if (this.investigationId) {
    //         investigation.Id = this.investigationId;
    //     }

    //     const correctiveActions = this.correctiveActions.map(action => ({
    //         Id: action.Id || null,
    //         Action_Title__c: action.Action_Title__c || '',
    //         Description__c: action.Description__c || '',
    //         Assigned_Owner__c: action.Assigned_Owner__c || '',
    //         Due_Date__c: action.Due_Date__c || '',
    //         Status__c: action.Status__c || 'Open'
    //     }));

    //     const saveData = {
    //         investigation: investigation,
    //         correctiveActions: correctiveActions,
    //         attachments: this.evidenceAttachments,
    //         acknowledged: this.statusVal === 'Resolved' ? this.acknowledged : false,
    //         isResolved: this.statusVal === 'Resolved'
    //     };

    //     console.log('========== SAVE DATA ==========');
    //     console.log(JSON.stringify(saveData, null, 2));
    //     console.log('================================');

    //     try {
    //         const savedInvestigationId = await saveInvestigation({
    //             saveData: JSON.stringify(saveData)
    //         });

    //         if (!savedInvestigationId) {
    //             console.error('Investigation was not saved. No Id returned.');
    //             //this.showToast('Error', 'Investigation could not be saved.', 'error');
    //             return;
    //         }

    //         this.investigationId = savedInvestigationId;

    //         console.log('Investigation saved successfully.');
    //         console.log('Investigation Id:', this.investigationId);

    //         try {
    //             await syncIncidentMetadataFromInvestigation({
    //                 responseId: this.responseId,
    //                 statusValue: this.statusVal,
    //                 assignedStaffId: this.assignedStaff,
    //                 priorityValue: this.severity
    //             });

    //             this.showToast(
    //                 'Success',
    //                 // 'Investigation saved and incident metadata synchronized successfully.',
    //                  'Investigation saved successfully.',
    //                 'success'
    //             );
    //             await this.loadInvestigation();
    //         } catch (syncError) {
    //             console.error('Error synchronizing incident metadata:', syncError);
    //             console.error('Investigation saved, but parent incident synchronization failed: ' + (syncError?.body?.message || syncError?.message ));
    //             this.showToast(
    //                 'Warning',
    //                 //'Investigation saved, but parent incident synchronization failed: ' + (syncError?.body?.message || syncError?.message || 'Unknown error'),
    //                  'Unable to save investigation.',
    //                 'warning'
    //             );
    //         }
    //     } catch (error) {
    //         console.error('Error saving Investigation:', error);
    //         this.showToast(
    //             'Error',
    //             error?.body?.message || error?.message || 'Unable to save investigation.',
    //             'error'
    //         );
    //     }
    // }
    async handleSave() {
        if (!this.investigationId) {
            this.showToast('Error', 'Investigation record was not found for this incident.', 'error');
            return;
        }

        if (!this.ndisReportableVal || !this.statusVal || !this.assignedStaff || !this.severity) {
            this.showToast('Error', 'Please complete all required fields.', 'error');
            return;
        }

        const isResolved = this.statusVal === 'Resolved';

        if (isResolved && (!this.finalNotes || !this.acknowledged)) {
            this.showToast('Warning', 'Final Notes and Acknowledgement are required to resolve the incident.', 'warning');
            return;
        }
        const statusForDb = this.statusVal === 'In Progress' ? 'In-Progress' : this.statusVal;
        console.log('statusForDb : ',statusForDb);
        console.log('this.statusVal : ',this.statusVal);
        const investigationData = {
            Id: this.investigationId,
            NDIS_Reportable__c: this.ndisReportableVal || '',
            Assessment_Notes__c: this.assessmentNotes || '',
            Findings_Summary__c: this.findings || '',
            Final_Notes__c: isResolved ? (this.finalNotes || '') : '',
            Status__c: this.statusVal || '',
            Assigned_Investigator__c: this.assignedStaff || '',
            Severity__c: this.severity || '',
            acknowledged: isResolved ? this.acknowledged : false,
            isResolved: isResolved
        };

        console.log('========== SAVE INVESTIGATION DATA ==========');
        console.log(JSON.stringify(investigationData, null, 2));

        try {
            await saveInvestigation({ investigationData });

            try {
                await syncIncidentMetadataFromInvestigation({
                    responseId: this.responseId,
                    statusValue: statusForDb,
                    assignedStaffId: this.assignedStaff,
                    priorityValue: this.severity
                });

                this.showToast('Success', 'Investigation saved successfully.', 'success');
                //await this.loadInvestigation();
                await this.refreshWorkspace();
            } catch (syncError) {
                console.error('Error synchronizing incident metadata:', syncError);
                this.showToast('Warning', 'Unable to save investigation.', 'warning');
            }
        } catch (error) {
            console.error('Error saving Investigation:', error);
            this.showToast('Error', error?.body?.message || error?.message || 'Unable to save investigation.', 'error');
        }
    }
    async handleSaveCorrectiveAction() {
        if (!this.newActionTitle || !this.newActionOwner || !this.newActionDueDate) {
            this.showToast('Validation Error', 'All fields are mandatory to save the Action.', 'warning');
            return;
        }

        if (!this.investigationId) {
            this.showToast('Error', 'Investigation record was not found for this incident.', 'error');
            return;
        }
         console.log('newActionDescription in save :', this.newActionDescription);
        const actionData = {
            Id: this.editingActionId || null,
            Incident_Investigation__c: this.investigationId,
            Action_Title__c: this.newActionTitle,
            Description__c: this.newActionDescription,
            Assigned_Owner__c: this.newActionOwner,
            Due_Date__c: this.newActionDueDate
            //Status__c: 'Open'
        };
        if (!this.editingActionId) {
            actionData.Status__c = 'Open';
        }

        try {
            //await saveCorrectiveAction({ actionData });
            const savedAction = await saveCorrectiveAction({ actionData });

            this.showToast(
                'Success',
                this.editingActionId ? 'Corrective Action updated successfully.' : 'Corrective Action added successfully.',
                'success'
            );
            const selectedOwner = this.staffOptions.find(staff => staff.value === this.newActionOwner);
            const ownerName = selectedOwner ? selectedOwner.label : '';

            if (this.editingActionId) {
                // editing an existing row → replace it in place
                this.correctiveActions = this.correctiveActions.map(action =>
                    action.Id === this.editingActionId
                        ? {
                            ...action,
                            Action_Title__c: this.newActionTitle,
                            Description__c: this.newActionDescription,
                            Assigned_Owner__c: this.newActionOwner,
                            Assigned_Owner_Name: ownerName,
                            Due_Date__c: this.newActionDueDate,
                            formattedDueDate: this.newActionDueDate
                                ? new Date(this.newActionDueDate).toLocaleDateString('en-GB')
                                : ''
                        }
                        : action
                );
            } else {
                // new row → append it, using the Id Apex returned
                const newId = savedAction?.Id || savedAction; // handles either a returned record or a returned Id string
                this.correctiveActions = [
                    ...this.correctiveActions,
                    {
                        Id: newId,
                        Action_Title__c: this.newActionTitle,
                        Description__c: this.newActionDescription,
                        Assigned_Owner__c: this.newActionOwner,
                        Assigned_Owner_Name: ownerName,
                        Due_Date__c: this.newActionDueDate,
                        formattedDueDate: this.newActionDueDate
                            ? new Date(this.newActionDueDate).toLocaleDateString('en-GB')
                            : '',
                        Status__c: 'Open'
                    }
                ];
            }
            this.activities = [
                ...this.activities,
                this.buildLocalActivityEntry(
                    this.editingActionId ? 'Corrective Action Updated' : 'Corrective Action Created',
                    this.newActionTitle
                )
            ];
            this.handleCloseActionModal();
            //await this.loadInvestigation();
            //await this.refreshWorkspace();
        } catch (e) {
            this.showToast('Error', e.body ? e.body.message : e.message, 'error');
        }
    }

    async loadInvestigation() {
        if (!this.responseId) {
            console.error('responseId is missing.');
            return;
        }

        try {
            const data = await getInvestigationForAssessment({
                responseId: this.responseId
            });

            console.log('Investigation data:', JSON.stringify(data, null, 2));

            if (!data || !data.investigation) {
                console.log('No existing investigation found for this response.');
                this.investigationId = null;
                this.correctiveActions = [];
                this.ndisSubmissions = [];
                this.evidenceAttachments = [];
                this.initialNotificationRecordedDate = null;
                this.fiveDayReportRecordedDate = null;
                return;
            }

            const inv = data.investigation;

            this.investigationId = inv.Id;
            this.ndisReportableVal = inv.NDIS_Reportable__c || '';
            this.isNdisReportable = this.ndisReportableVal === 'Yes';
            this.assessmentNotes = inv.Assessment_Notes__c || '';
            this.findings = inv.Findings_Summary__c || '';
            this.finalNotes = inv.Final_Notes__c || '';
            // this.statusVal = inv.Status__c || '';
            // this.assignedStaff = inv.Assigned_Investigator__c || '';
            // this.severity = inv.Severity__c || '';

            this.correctiveActions = (data.correctiveActions || []).map(action => ({
                Id: action.Id,
                Action_Title__c: action.Action_Title__c || '',
                Assigned_Owner__c: action.Assigned_Owner__c || '',
                Assigned_Owner_Name: action.Assigned_Owner__r?.Name || '',
                Description__c: action.Description__c || '',
                Due_Date__c: action.Due_Date__c || '',
                formattedDueDate: action.Due_Date__c
                    ? new Date(action.Due_Date__c).toLocaleDateString('en-GB')
                    : '',
                Status__c: action.Status__c || 'Open'
            }));
            this.ndisSubmissions = data.ndisSubmissions || [];
            this.syncNdisStageDatesFromSubmissions();
            //this.evidenceAttachments = data.evidence || [];
            this.evidenceAttachments = (data.evidence || []).map((evidence, index) => ({
                Id: evidence.Id,
                rowKey: evidence.Id,
               // tempId: `saved_${evidence.Id || index}`,
                Attachment_Name__c: evidence.Attachment_Name__c || '',
                File_Name__c: evidence.File_Name__c || '',
                Type__c: evidence.Type__c || '',
                Evidence_Type__c: evidence.Evidence_Type__c || 'Incident Evidence',
                Uploaded_By__c: evidence.Uploaded_By__c || '',
                UploadedName:
                    evidence.Uploaded_By__r?.NameToDisplay__c ||
                    evidence.Uploaded_By__r?.Name ||
                    '',
                //Submitted_On__c: evidence.Submitted_On__c || '',
                AWS_File_Key__c: evidence.AWS_File_Key__c || '',
                AWS_File_URL__c: evidence.AWS_File_URL__c || '',
                CreatedDate: evidence.CreatedDate || '',
                Uploaded_On__c: evidence.CreatedDate
                    ? this.formatDateOnly(evidence.CreatedDate)
                    : ''
                //Size__c: evidence.Size__c || ''
            }));

            if (inv.LastModifiedDate) {
                this.lastUpdated = this.formatDate(inv.LastModifiedDate);
                this.lastUpdatedBy = inv.LastModifiedBy?.Full_Name__c || inv.LastModifiedBy?.Name || '—';
                this.lastUpdatedByInitials = this.getInitials(this.lastUpdatedBy);
                this.lastUpdatedByAvatarStyle = `background-color:${this.getAvatarColor(this.lastUpdatedBy)};`;
            }

            console.log('Investigation Id:', this.investigationId);
            console.log('Corrective Actions:', JSON.stringify(this.correctiveActions, null, 2));
            console.log('NDIS Submissions:', JSON.stringify(this.ndisSubmissions, null, 2));


        } catch (error) {
            console.error('Error loading investigation:', error);
        }
    }
    handleViewActionModal(event) {
        const actionId = event.currentTarget.dataset.id;
       // const tempId = event.currentTarget.dataset.tempId;

        // const action = this.correctiveActions.find(item =>
        //     (actionId && item.Id === actionId) ||
        //     (tempId && item.tempId === tempId)
        // );
        const action = this.correctiveActions.find(item => item.Id === actionId);

        if (!action) {
            return;
        }

        this.isViewAction = true;
        this.actionModalTitle = 'View Corrective Action';

        this.newActionTitle = action.Action_Title__c || '';
        this.newActionDescription = action.Description__c || '';
        console.log('newActionDescription  in handleViewActionModal:', this.newActionDescription);
        this.newActionOwner = action.Assigned_Owner__c || '';
        this.newActionDueDate = action.Due_Date__c || '';

        this.showActionModal = true;
    }
    @track editingActionId = null;
    //editingActionTempId = null;
    handleEditActionModal(event) {
        const actionId = event.currentTarget.dataset.id;
        //const tempId = event.currentTarget.dataset.tempId;

        const action = this.correctiveActions.find(item => item.Id === actionId);

        if (!action) {
            console.error('Corrective Action not found:', actionId );
            return;
        }
        if (action.Status__c === 'Completed' || this.isIncidentLocked) {
            this.showToast(
                'Warning',
                action.Status__c === 'Completed'
                    ? 'This Corrective Action is already completed and cannot be edited.'
                    : 'This Incident has been resolved and can no longer be edited.',
                'warning'
            );
            return;
        }

        this.editingActionId = action.Id || null;
       // this.editingActionTempId = action.tempId || null;
        this.newActionTitle = action.Action_Title__c || '';
        this.newActionOwner = action.Assigned_Owner__c || '';
        this.newActionDueDate = action.Due_Date__c || '';
        this.newActionDescription = action.Description__c || '';
        this.showActionModal = true;
        this.actionModalTitle = 'Edit Corrective Action';

        console.log('Editing Corrective Action:', JSON.stringify(action, null, 2));
    }
      
    handleUploadSuccess(event) {
        const data = event.detail;

        console.log('📥 Upload result:', data);

        // ✅ Merge key + URL
        // this.uploadedFiles = data.files.map((file, index) => {
        //     return {
        //         key: file.key,
        //         url: data.fileUrls[index]
        //     };
        // });
        // this.uploadedFiles = (data.files || []).map((file, index) => ({
        //     key: file.key,
        //     url: data.fileUrls?.[index] || '',
        //     name: file.name || file.fileName || file.filename || '',
        //     type: file.type || file.contentType || '',
        //     size: file.size || '',
        // }));
        this.uploadedFiles = (data.files || []).map((file, index) => {
            const fileNameFromKey =
                file.key?.split('/').pop() || '';

            const extension =
                fileNameFromKey.includes('.')
                    ? fileNameFromKey.split('.').pop().toLowerCase()
                    : '';

            const typeMap = {
                jpg: 'Image',
                jpeg: 'Image',
                png: 'Image',
                gif: 'Image',
                webp: 'Image',
                pdf: 'PDF',
                doc: 'Word',
                docx: 'Word',
                xls: 'Excel',
                xlsx: 'Excel',
                csv: 'CSV',
                txt: 'Text'
            };

            return {
                key: file.key,
                url: data.fileUrls?.[index] || '',
                name: fileNameFromKey,
                type: typeMap[extension] || extension.toUpperCase(),
                size: file.size || ''
            };
        });

        console.log('✅ Final uploadedFiles:', JSON.stringify(this.uploadedFiles));

        this.showToast('Success', `${data.succeeded} file(s) uploaded`, 'success');
        
    }
    handleAttachmentNameChange(event) {
        this.attachmentNameValue = event.target.value;
    }
    get initialNotificationDueDate() {
        if (!this.rawIncidentCreatedDate) return null;
        const created = new Date(this.rawIncidentCreatedDate);
        return new Date(created.getTime() + 24 * 60 * 60 * 1000); // +24 hours
    }

    get fiveDayReportDueDate() {
        if (!this.rawIncidentCreatedDate) return null;
        const created = new Date(this.rawIncidentCreatedDate);
        return new Date(created.getTime() + 5 * 24 * 60 * 60 * 1000); // +5 days
    }
    get isFiveDayStageActive() {
        if (this.initialNotificationRecordedDate) return true;
        const dueDate = this.initialNotificationDueDate;
        if (!dueDate) return false;
        return new Date() > dueDate;
    }

    get isInitialStageActive() {
        return !this.isFiveDayStageActive;
    }
    formatDateShort(date) {
        if (!date) return '';
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    }

    formatDateTimeShort(date) {
        if (!date) return '';
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12 || 12;
        return `${date.getDate()} ${monthNames[date.getMonth()]} ${hours}.${minutes}${ampm}`;
    }

    // formatDueOrOverdue(dueDate) {
    //     if (!dueDate) return '';
    //     const now = new Date();
    //     const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    //     if (diffDays < 0) {
    //         const abs = Math.abs(diffDays);
    //         return `Overdue by ${abs} ${abs === 1 ? 'day' : 'days'}`;
    //     }
    //     if (diffDays === 0) return 'Due today';
    //     return `Due in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
    // }
    formatDueOrOverdue(dueDate) {
        if (!dueDate) return '';
        const now = new Date();
        const diffMs = now.getTime() - dueDate.getTime();

        // Not yet due
        if (diffMs <= 0) {
            const diffDays = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
            if (diffDays === 0) return 'Due today';
            return `Due in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
        }

        // Overdue — use full elapsed days since due, not calendar-day rounding,
        // since initial notification's due date includes a time component (+24h), not just a date
        const overdueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (overdueDays === 0) return 'Overdue';
        return `Overdue by ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'}`;
    }

    // ---- Current Status banner ----

    // get ndisCurrentStatusLabel() {
    //     if (this.isInitialStageActive) {
    //         return `Initial Notification due by ${this.formatDateTimeShort(this.initialNotificationDueDate)}`;
    //     }
    //     if (!this.fiveDayReportRecordedDate) {
    //         return `5-Day Report ${this.formatDueOrOverdue(this.fiveDayReportDueDate).toLowerCase()}`;
    //     }
    //     return 'All NDIS reports submitted';
    // }
    // get ndisCurrentStatusLabel() {

    //     // Initial Notification has NOT been saved
    //     if (!this.initialNotificationRecorded) {
    //         return `Initial Notification due by ${
    //             this.formatDateTimeShort(this.initialNotificationDueDate)
    //         }`;
    //     }

    //     // Initial Notification exists,
    //     // but 5-Day Report has NOT been saved
    //     if (!this.fiveDayReportRecorded) {
    //         return `5-Day Report ${
    //             this.formatDueOrOverdue(this.fiveDayReportDueDate).toLowerCase()
    //         }`;
    //     }

    //     // Both records exist
    //    // return 'All NDIS reports submitted';
    //    return `5-Day Report Recorded on ${
    //         this.formatDateShort(this.fiveDayReportRecordedDate)
    //     }`;
    // }

    // ---- Initial Notification node ----

    // get initialNotificationRecorded() {
    //     return !!this.initialNotificationRecordedDate;
    // }
    get initialNotificationRecorded() {
        const submissions = this.ndisSubmissions || [];

        return submissions.some(
            s => (s.Submission_Type__c || '').trim() === 'Initial Notification'
        );
    }

    // get initialNotificationDesc() {
    //     if (this.initialNotificationRecorded) {
    //         return `Recorded on ${this.formatDateShort(this.initialNotificationRecordedDate)}`;
    //     }
    //     return `Due by ${this.formatDateTimeShort(this.initialNotificationDueDate)}`;
    // }
    // get initialNotificationDesc() {
    //     if (this.initialNotificationRecorded) {
    //         return `Recorded on ${
    //             this.formatDateShort(this.initialNotificationRecordedDate)
    //         }`;
    //     }

    //     return `Due by ${
    //         this.formatDateTimeShort(this.initialNotificationDueDate)
    //     }`;
    // }
    get initialNotificationDesc() {
        if (this.initialNotificationRecorded) {
            return `Recorded on ${this.formatDateShort(this.initialNotificationRecordedDate)}`;
        }

        if (this.isFiveDayStageActive) {
            // isFiveDayStageActive is already true once "now" has passed the +24h due date
            return this.formatDueOrOverdue(this.initialNotificationDueDate);
        }

        return `Due by ${this.formatDateTimeShort(this.initialNotificationDueDate)}`;
    }

    get initialNotificationDotClass() {
        if (this.initialNotificationRecorded) return 'node-dot dot-green';
       // if (this.isFiveDayStageActive) return 'node-dot dot-red'; // overdue, never recorded — add .dot-red to your CSS
        return 'node-dot dot-blue';
    }

    get initialNotificationLineClass() {
        return this.initialNotificationRecorded ? 'node-line line-green' : 'node-line line-grey';
    }

    get initialNotificationButtonLabel() {
        return this.initialNotificationRecorded ? 'View' : 'Record';
    }

    get initialNotificationButtonVariant() {
        return this.initialNotificationRecorded ? 'neutral' : 'brand';
    }

    get fiveDayReportButtonDisabled() {
       
        return !this.fiveDayReportRecorded && !this.initialNotificationRecorded;
    }

    // ---- 5-Day Report node ----

    // get fiveDayReportRecorded() {
    //     return !!this.fiveDayReportRecordedDate;
    // }
    get fiveDayReportRecorded() {
        const submissions = this.ndisSubmissions || [];

        return submissions.some(
            s => (s.Submission_Type__c || '').trim() === '5-Day Report'
        );
    }

    // get fiveDayReportDesc() {
    //     if (this.fiveDayReportRecorded) {
    //         return `Recorded on ${this.formatDateShort(this.fiveDayReportRecordedDate)}`;
    //     }
    //     if (!this.isFiveDayStageActive) {
    //         return `Due on ${this.formatDateShort(this.fiveDayReportDueDate)}`;
    //     }
    //     return this.formatDueOrOverdue(this.fiveDayReportDueDate);
    // }
    get fiveDayReportDesc() {
        if (this.fiveDayReportRecorded) {
            return `Recorded on ${
                this.formatDateShort(this.fiveDayReportRecordedDate)
            }`;
        }

        if (!this.isFiveDayStageActive) {
            return `Due on ${
                this.formatDateShort(this.fiveDayReportDueDate)
            }`;
        }

        return this.formatDueOrOverdue(this.fiveDayReportDueDate);
    }

    get fiveDayReportTitleClass() {
        return this.isFiveDayStageActive ? 'node-title node-title-blue' : 'node-title node-title-grey';
    }

    get fiveDayReportDotClass() {
        if (this.fiveDayReportRecorded) return 'node-dot dot-green';
        if (this.isFiveDayStageActive) return 'node-dot dot-blue';
        return 'node-dot dot-grey';
    }

    get fiveDayReportButtonLabel() {
        return this.fiveDayReportRecorded ? 'View' : 'Record';
    }

    get fiveDayReportButtonVariant() {
        if (this.fiveDayReportRecorded) return 'neutral';
        return this.isFiveDayStageActive ? 'brand' : 'neutral';
    }
    get ndisCurrentStageName() {
        // Initial Notification not recorded yet
        if (!this.initialNotificationRecorded) {
            return 'Initial Notification';
        }

        // Initial Notification recorded, 5-Day Report not recorded
        if (!this.fiveDayReportRecorded) {
            return '5-Day Report';
        }

        // Both recorded — current stage remains 5-Day Report
        return '5-Day Report';
    }
    // get ndisCurrentStatusText() {
    //     // Initial Notification pending
    //     if (!this.initialNotificationRecorded) {
    //         return `Due by ${this.formatDateTimeShort(this.initialNotificationDueDate)}`;
    //     }

    //     // 5-Day Report pending
    //     if (!this.fiveDayReportRecorded) {
    //         return this.formatDueOrOverdue(this.fiveDayReportDueDate);
    //     }

    //     // 5-Day Report recorded
    //     return `Recorded on ${this.formatDateTimeShort(this.fiveDayReportRecordedDate)}`;
    // }
    get ndisCurrentStatusText() {
        // Initial Notification pending
        if (!this.initialNotificationRecorded) {
            if (this.isFiveDayStageActive) {
                return this.formatDueOrOverdue(this.initialNotificationDueDate);
            }
            return `Due by ${this.formatDateTimeShort(this.initialNotificationDueDate)}`;
        }

        // 5-Day Report pending
        if (!this.fiveDayReportRecorded) {
            return this.formatDueOrOverdue(this.fiveDayReportDueDate);
        }

        // 5-Day Report recorded
        return `Recorded on ${this.formatDateTimeShort(this.fiveDayReportRecordedDate)}`;
    }

    get ndisCurrentStatusClass() {
        // Pending / due / overdue
        if (!this.initialNotificationRecorded || !this.fiveDayReportRecorded) {
            return 'ndis-status-due';
        }

        // Recorded
        return 'ndis-status-recorded';
    }
    get currentNdisEvidenceType() {
        if (this.ndisStageType === 'Initial Notification') {
            return 'NDIS Initial Notification';
        }
        if (this.ndisStageType === '5-Day Report') {
            return 'NDIS 5-Day Report';
        }
        return 'Incident Evidence';
    }
    // get currentNdisStageAttachments() {
    //     const type = this.currentNdisEvidenceType;
    //     return (this.evidenceAttachments || []).filter(
    //         a => a.Evidence_Type__c === type
    //     );
    // }
    get generalEvidenceAttachments() {
        return (this.evidenceAttachments || []).filter(
            a => a.Evidence_Type__c === 'Incident Evidence' || !a.Evidence_Type__c
        );
    }


    handleInitialNotificationClick(event) {
        if (this.initialNotificationRecorded) {
            this.handleOpenViewNdisModal(event);
        } else {
            this.handleOpenRecordNdisModal(event);
        }
    }

    handleFiveDayReportClick(event) {
        if (this.fiveDayReportRecorded) {
            this.handleOpenViewNdisModal(event);
        } else {
            this.handleOpenRecordNdisModal(event);
        }
    }

    async handleSaveNdisSubmission() {
        if (!this.investigationId) {
            this.showToast('Error', 'Please save the investigation before recording an NDIS submission.', 'error');
            return;
        }

        if (!this.ndisSubmittedBy || !this.ndisSubDate || !this.ndisSubTime || !this.ndisSubRef || !this.ndisSubNotes) {
            this.showToast('Error', 'All fields are mandatory to save the submission record.', 'warning');
            return;
        }
        //const stageAttachments = this.currentNdisStageAttachments || [];
        const stageAttachments = (this.pendingNdisAttachments || []).filter(
            a => a.Evidence_Type__c === this.currentNdisEvidenceType
        );

        console.log(
            '📎 NDIS stage attachments:',
            JSON.stringify(stageAttachments, null, 2)
        );

        const attachments = stageAttachments.map(file => ({
            Id: file.Id || null,
            Attachment_Name__c: file.Attachment_Name__c || '',
            File_Name__c: file.File_Name__c || '',
            Type__c: file.Type__c || '',
            Uploaded_By__c: file.Uploaded_By__c || '',
            AWS_File_Key__c: file.AWS_File_Key__c || '',
            AWS_File_URL__c: file.AWS_File_URL__c || '',
            Evidence_Type__c: file.Evidence_Type__c || this.currentNdisEvidenceType
        }));
          console.log(
            '📎 NDIS  attachments:',
            JSON.stringify(attachments, null, 2)
        );

        const submission = {
            investigationId: this.investigationId,
            submissionType: this.ndisStageType,
            submittedById: this.ndisSubmittedBy,
            submissionDate: this.ndisSubDate,
            submissionTime: this.ndisSubTime ? this.ndisSubTime : '12:00:00.000Z',
            referenceNumber: this.ndisSubRef,
            summaryNotes: this.ndisSubNotes,
           // ndisReportable: this.ndisReportable === true,
            ndisReportable: this.ndisReportableVal || '',
            attachments: attachments
        };

        try {
            //await saveNdisSubmission({ submission });
            const savedSubmission = await saveNdisSubmission({ submission });

            const recordedAt = this.buildDateTimeFromParts(this.ndisSubDate, this.ndisSubTime || '12:00:00.000Z');
            if (this.ndisStageType === 'Initial Notification') {
                this.initialNotificationRecordedDate = recordedAt;
            } else if (this.ndisStageType === '5-Day Report') {
                this.fiveDayReportRecordedDate = recordedAt;
            }
            const submitterLabel = this.staffOptions.find(opt => opt.value === this.ndisSubmittedBy)?.label || '';

            const newSubmissionEntry = {
                Id: savedSubmission?.Id || savedSubmission || `local_${Date.now()}`,
                Submission_Type__c: this.ndisStageType,
                Submitted_By__c: this.ndisSubmittedBy,
                Submitted_By__r: { Name: submitterLabel },
                Submission_Date__c: this.ndisSubDate,
                Submission_Time__c: this.ndisSubTime,
                Reference_Number__c: this.ndisSubRef,
                Summary_Notes__c: this.ndisSubNotes
            };

            this.ndisSubmissions = [
                ...this.ndisSubmissions.filter(s => (s.Submission_Type__c || '').trim() !== this.ndisStageType),
                newSubmissionEntry
            ];
            const uploadedOn = this.formatDateOnly(new Date());
            const savedStageAttachments = stageAttachments.map((a, idx) => ({
                ...a,
                Id: a.Id || `local_evidence_${Date.now()}_${idx}`,
                Uploaded_On__c: a.Uploaded_On__c || uploadedOn
            }));

            this.evidenceAttachments = [...this.evidenceAttachments, ...savedStageAttachments];
            this.pendingNdisAttachments = this.pendingNdisAttachments.filter(
                a => a.Evidence_Type__c !== this.currentNdisEvidenceType
            );

            this.showToast('Success', `Recorded NDIS ${this.ndisStageType} submission.`, 'success');
           this.activities = [
                ...this.activities,
                this.buildLocalActivityEntry(
                    `NDIS ${this.ndisStageType} Submitted`,
                    this.ndisSubRef
                )
            ];
            this.handleCloseRecordNdisModal();
            //await this.loadInvestigation();
           // await this.refreshWorkspace();
        } catch (e) {
            this.showToast('Error', e.body ? e.body.message : e.message, 'error');
        }
    }
    // formatSubmissionDateTime(dateStr, timeStr) {
    //     const dt = this.buildDateTimeFromParts(dateStr, timeStr);
    //     if (!dt) return '';
    //     return `${this.formatDateShort(dt)}, ${this.formatDateTimeShort(dt).split(' ').pop()}`;
    // }
    // buildDateTimeFromParts(dateStr, timeStr) {
    //     if (!dateStr) return null;
    //     const timePart = timeStr ? timeStr.replace('Z', '') : '00:00:00.000';
    //     return new Date(`${dateStr}T${timePart}`);
    // }
    // syncNdisStageDatesFromSubmissions() {
    //     const initial = this.ndisSubmissions.find(s => s.Submission_Type__c === 'Initial Notification');
    //     const fiveDay = this.ndisSubmissions.find(s => s.Submission_Type__c === '5-Day Report');

    //     this.initialNotificationRecordedDate = initial
    //         ? this.buildDateTimeFromParts(initial.Submission_Date__c, initial.Submission_Time__c)
    //         : null;

    //     this.fiveDayReportRecordedDate = fiveDay
    //         ? this.buildDateTimeFromParts(fiveDay.Submission_Date__c, fiveDay.Submission_Time__c)
    //         : null;
    // }
    formatSubmissionDateTime(dateStr, timeValue) {
        const dt = this.buildDateTimeFromParts(dateStr, timeValue);

        if (!dt) {
            return '';
        }

        return `${this.formatDateShort(dt)}, ${this.formatDateTimeShort(dt).split(' ').pop()}`;
    }


    buildDateTimeFromParts(dateStr, timeValue) {
        if (!dateStr) {
            return null;
        }

        let timePart = '00:00:00.000';

        /*
        * Salesforce Time can arrive in different forms.
        */
        if (typeof timeValue === 'string') {

            timePart = timeValue
                .replace('Z', '')
                .trim();

        } else if (timeValue instanceof Date) {

            timePart =
                `${String(timeValue.getHours()).padStart(2, '0')}:` +
                `${String(timeValue.getMinutes()).padStart(2, '0')}:` +
                `${String(timeValue.getSeconds()).padStart(2, '0')}.000`;

        } else if (timeValue && typeof timeValue === 'object') {

            /*
            * Handles an object containing hour/minute/second.
            */
            const hour =
                Number(timeValue.hour ?? timeValue.hours ?? 0);

            const minute =
                Number(timeValue.minute ?? timeValue.minutes ?? 0);

            const second =
                Number(timeValue.second ?? timeValue.seconds ?? 0);

            timePart =
                `${String(hour).padStart(2, '0')}:` +
                `${String(minute).padStart(2, '0')}:` +
                `${String(second).padStart(2, '0')}.000`;
        }

        const dateTime = new Date(`${dateStr}T${timePart}`);

        return isNaN(dateTime.getTime()) ? null : dateTime;
    }


    syncNdisStageDatesFromSubmissions() {

        const submissions = this.ndisSubmissions || [];

        const initial = submissions.find(
            s => (s.Submission_Type__c || '').trim() === 'Initial Notification'
        );

        const fiveDay = submissions.find(
            s => (s.Submission_Type__c || '').trim() === '5-Day Report'
        );

        /*
        * We already know the submission exists from the DB.
        * Use the submission date to establish the recorded state.
        */
        this.initialNotificationRecordedDate = initial
            ? this.buildDateTimeFromParts(
                initial.Submission_Date__c,
                initial.Submission_Time__c
            )
            : null;

        this.fiveDayReportRecordedDate = fiveDay
            ? this.buildDateTimeFromParts(
                fiveDay.Submission_Date__c,
                fiveDay.Submission_Time__c
            )
            : null;

        console.log(
            'Initial NDIS submission:',
            JSON.stringify(initial)
        );

        console.log(
            '5-Day NDIS submission:',
            JSON.stringify(fiveDay)
        );

        console.log(
            'Initial recorded date:',
            this.initialNotificationRecordedDate
        );

        console.log(
            '5-Day recorded date:',
            this.fiveDayReportRecordedDate
        );
    }
    handleLocalSaveNdisAttachment() {
        if (!this.attachmentNameValue?.trim()) {
            this.showToast(
                'Error',
                'Please enter an Attachment Name.',
                'warning'
            );
            return;
        }

        if (!this.uploadedFiles || !this.uploadedFiles.length) {
            this.showToast(
                'Error',
                'Please upload at least one file.',
                'warning'
            );
            return;
        }

        //const submittedOn = new Date().toLocaleDateString('en-GB');
        const uploadedOn = this.formatDateOnly(new Date());

        const newAttachments = this.uploadedFiles.map((file, index) => ({
            rowKey: `pending_${Date.now()}_${index}`,
            //Id: null,
            Id: file.Id || null,
            Attachment_Name__c: this.attachmentNameValue.trim(),
            File_Name__c: file.name || '',
            Type__c: file.type || '',
            Uploaded_By__c: this.loggedInStaffId || '',
            UploadedName:this.loggedInStaffName || '',
            //Submitted_On__c: submittedOn,
            AWS_File_Key__c: file.key || '',
            AWS_File_URL__c: file.url || '',
            Uploaded_On__c: uploadedOn,
             Evidence_Type__c: this.currentNdisEvidenceType,
            //Size__c: file.size || ''
        }));

        // this.evidenceAttachments = [
        this.pendingNdisAttachments = [
            ...this.pendingNdisAttachments,
            ...newAttachments
        ];

        console.log(
            '✅ Local evidence attachments:',
            JSON.stringify(this.pendingNdisAttachments, null, 2)
        );

        this.showToast(
            'Success',
            'Attachment added successfully.',
            'success'
        );

        this.attachmentNameValue = '';
        this.uploadedFiles = [];
        //this.handleEvidenceCloseModal();
        this.resetUploader('ndisUploader'); 
    }

    handleViewAttachment(event) {
        const url = event.currentTarget.dataset.url;

        // if (url) {
        //     window.open(url, '_blank');
        // }
         console.log('Attachment URL:', url);

        if (!url) {
            this.showToast(
                'Error',
                'Attachment URL is not available.',
                'error'
            );
            return;
        }

        this.currentUrl = url;
        this.isModalOpen = true;
    }
    formatDateOnly(dateValue) {
        if (!dateValue) {
            return '';
        }

        const date = new Date(dateValue);

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    }
    closepdf() {
        this.isModalOpen = false;
        this.currentUrl = '';
    }
    async handleSaveAttachment(evidenceType) {
        const resolvedType = typeof evidenceType === 'string' ? evidenceType : 'Incident Evidence';

        if (!this.attachmentNameValue?.trim()) {
            this.showToast('Error', 'Please enter an Attachment Name.', 'warning');
            return;
        }

        if (!this.uploadedFiles || !this.uploadedFiles.length) {
            this.showToast('Error', 'Please upload at least one file.', 'warning');
            return;
        }
        if (!this.investigationId) {
            this.showToast('Error', 'Investigation record was not found for this incident.', 'error');
            return;
        }

        // const uploadedOn = this.formatDateOnly(new Date());

        // const newAttachments = this.uploadedFiles.map((file, index) => ({
        //     tempId: `${Date.now()}_${index}`,
        //     Id: file.Id || null,
        //     Attachment_Name__c: this.attachmentNameValue.trim(),
        //     File_Name__c: file.name || '',
        //     Type__c: file.type || '',
        //     Evidence_Type__c: resolvedType,
        //     Uploaded_By__c: this.loggedInStaffId || '',
        //     UploadedName: this.loggedInStaffName || '',
        //     AWS_File_Key__c: file.key || '',
        //     AWS_File_URL__c: file.url || '',
        //     Uploaded_On__c: uploadedOn
        // }));

        // this.evidenceAttachments = [...this.evidenceAttachments, ...newAttachments];
        
            
        const attachments = this.uploadedFiles.map(file => ({
            Incident_Investigation__c: this.investigationId,
            Attachment_Name__c: this.attachmentNameValue.trim(),
            File_Name__c: file.name || '',
            Type__c: file.type || '',
            Evidence_Type__c: resolvedType,
            Uploaded_By__c: this.loggedInStaffId || '',
            AWS_File_Key__c: file.key || '',
            AWS_File_URL__c: file.url || ''
        }));
        try {
            //await saveIncidentEvidence({ attachments });
            const savedRecords = await saveIncidentEvidence({ attachments });
            this.showToast('Success', 'Attachment added successfully.', 'success');
            const uploadedOn = this.formatDateOnly(new Date());
            const newRows = (savedRecords || []).map((rec) => {
                const matchingInput = attachments.find(a => a.AWS_File_Key__c === rec.AWS_File_Key__c) || {};

                return {
                    Id: rec.Id,
                    rowKey: rec.Id,
                    Attachment_Name__c: rec.Attachment_Name__c || this.attachmentNameValue.trim(),
                    File_Name__c: rec.File_Name__c || matchingInput.File_Name__c || '',
                    Type__c: rec.Type__c || matchingInput.Type__c || '',
                    Evidence_Type__c: rec.Evidence_Type__c || resolvedType,
                    Uploaded_By__c: rec.Uploaded_By__c || this.loggedInStaffId || '',
                    UploadedName: this.loggedInStaffName || '',
                    AWS_File_Key__c: rec.AWS_File_Key__c || matchingInput.AWS_File_Key__c || '',
                    AWS_File_URL__c: rec.AWS_File_URL__c || matchingInput.AWS_File_URL__c || '',
                    CreatedDate: rec.CreatedDate || new Date().toISOString(),
                    Uploaded_On__c: this.formatDateOnly(new Date())
                };
            });
            this.evidenceAttachments = [...this.evidenceAttachments, ...newRows];
            this.activities = [
                ...this.activities,
                this.buildLocalActivityEntry(
                    'Attachments Added',
                    newRows.map(r => r.Attachment_Name__c).join(', ')
                )
            ];

            this.attachmentNameValue = '';
            this.uploadedFiles = [];
            this.resetUploader('evidenceUploader');
            this.handleEvidenceCloseModal();
            //await this.loadInvestigation();
            //await this.refreshWorkspace();

        } catch (e) {
            this.showToast('Error', e.body ? e.body.message : e.message, 'error');
        }
    }

    handleSaveEvidenceAttachment() {
        this.handleSaveAttachment('Incident Evidence');
    }

    handleSaveNdisAttachment() {
        //this.handleSaveAttachment(this.currentNdisEvidenceType);
        this.handleLocalSaveNdisAttachment(this.currentNdisEvidenceType);
    }
    get currentNdisStageAttachments() {
        const type = this.currentNdisEvidenceType;
        const saved = (this.evidenceAttachments || []).filter(a => a.Evidence_Type__c === type);
        const pending = (this.pendingNdisAttachments || []).filter(a => a.Evidence_Type__c === type);
        return [...saved, ...pending];
    }
   
   handleDeleteAttachment(event) {
        const id = event.currentTarget.dataset.id;
        const key = event.currentTarget.dataset.key;

        if (!id) {
            this.showToast('Error', 'Attachment could not be identified.', 'error');
            return;
        }

        this.pendingDeleteEvidenceId = id;
        this.pendingDeleteAwsKey = key || null;
        this.handleDeleteEvidenceFlag = true;
    }

    handleCancelDeleteAttachment() {
        this.handleDeleteEvidenceFlag = false;
        this.pendingDeleteEvidenceId = null;
        this.pendingDeleteAwsKey = null;
    }

    async handleConfirmDeleteAttachment() {
        const evidenceId = this.pendingDeleteEvidenceId;
        const awsKey = this.pendingDeleteAwsKey;

        if (!evidenceId) {
            this.handleDeleteEvidenceFlag = false;
            return;
        }

        try {
           
            if (awsKey) {
                await deleteAwsFiles({ keys: [awsKey] });
            }

            await deleteIncidentEvidence({  evidenceId: evidenceId, evidenceType: 'Incident Evidence' });

            this.showToast('Success', 'Attachment deleted successfully.', 'success');
            this.activities = [
                ...this.activities,
                this.buildLocalActivityEntry('Attachment Deleted', deletedName)
            ];
            this.handleDeleteEvidenceFlag = false;
            this.pendingDeleteEvidenceId = null;
            this.pendingDeleteAwsKey = null;

            //await this.loadInvestigation();
           // await this.refreshWorkspace();
        } catch (e) {
            this.showToast('Error', e.body ? e.body.message : e.message, 'error');
            // Modal stays open on failure so the person can retry or cancel.
        }
    }
    parseHistoryLog(historyLogJson) {
        if (!historyLogJson) {
            return [];
        }
        try {
            const parsed = JSON.parse(historyLogJson);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Error parsing History_Log__c:', e);
            return [];
        }
    }
    async refreshWorkspace() {
        await Promise.all([
            this.loadIncidentResponse(),
            this.loadInvestigation()
        ]);
    }
    resetUploader(dataId) {
        const uploader = this.template.querySelector(`[data-id="${dataId}"]`);
        if (uploader) {
            uploader.resetUploadList();
        }
    }
    normalizeStatusValue(rawStatus) {
        if (rawStatus === 'In-Progress') {
            return 'In Progress';
        }
        return rawStatus || '';
    }

    disconnectedCallback() {
        // Lifecycle cleanup
    }
    buildLocalActivityEntry(actionLabel, contentText) {
        const now = new Date();
        const timestamp = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
            + ' ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        return {
            timestamp,
            user: this.loggedInStaffName || '',
            action: actionLabel,
            content: contentText
        };
    }

}