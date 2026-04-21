import { LightningElement, wire, api, track } from "lwc";
import fetchBulkRoles from '@salesforce/apex/FacilityController.fetchBulkRoles';
import saveTemplate from '@salesforce/apex/PmsController.saveTemplate';
import getTemplatesByFacility from '@salesforce/apex/PmsController.getTemplatesByFacility';
import getTemplatesById from '@salesforce/apex/PmsController.getTemplatesById';
import getStaffsByOrg from '@salesforce/apex/PmsController.getStaffsByOrg';
import applyTemplateToStaff from '@salesforce/apex/PmsController.applyTemplateToStaff';
import getStaffsByTemplateId from '@salesforce/apex/PmsController.getStaffsByTemplateId';
import saveFullReviewCycle from '@salesforce/apex/PmsController.saveFullReviewCycle';
import getReviewCycles from '@salesforce/apex/PmsController.getReviewCycles';
import createRoleTemplateFromBase from '@salesforce/apex/PmsController.createRoleTemplateFromBase';
import getRoleTemplatesByFacility from '@salesforce/apex/PmsController.getRoleTemplatesByFacility';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';

export default class TesseractAppsHrPmsLwc extends LightningElement {

    @api orgid;
    @track isHome=true;
    @track isManageTemplates=false;
    @track isReviewCycle=false;
    @track isPerformanceReview=false;
    @track isCardGrid = true;
    //@track selectedRole='All';
    @track isDropdownOpen = false;
    @track isDropdownOpen1 = false;
    @track roleOptions = [];
    @track selectedRoles = [];
    @track selectedRolesInApply = [];
    @track isCreateTemplate=false;
  
    @track templateCount=1;
    @track currentStep = 'step1';
    @track rcCurrentStep = 'rcStep1';
    totalSteps = 5;
    @track roleTemplateOptions=[];
    //@track selectedRoleTemplate;
    @track roleTitle;
    @track selectedRoleName;
    @track showCancel=false;
    @track showNext=false;
    @track showPrevious=false;
    @track showSave=false;
    @track showSkip=false;
    @track showRcCancel=false;
    @track showRcNext=false;
    @track showRcPrevious=false;
    @track showRcSave=false;
  
    @track kpiName = '';
    @track selectedKpiCategory = '';
    @track kpiTarget=null;
    // @track kpiUnit = '';
    @track kpiUnit;
    @track kpiWeight = null;
    @track kpiDescription = '';
    @track okrObjective='';
    // @track okrName = '';
    // @track selectedOkrCategory = '';
    // @track okrTarget = '';
    // @track okrUnit = '';
    @track okrWeight = null;
    @track okrDescription = '';
    @track okrList = [];

    @track competencyName = '';
    @track selectedCompetencyCategory = '';
   // @track competencyTarget = '';
    //@track competencyUnit = '';
    @track competencyWeight = null;
    @track competencyDescription = '';

    @track selfReview = false;
    @track managerReview = false;
    @track goalsPermission = false;
    @track isTemplateViewDetail=false;
    @track selectedFacilityId;
    @track competencyList = [];
    @track selfReviewInView = false;
    @track managerReviewInView = false;
    @track goalsPermissionInView = false;

    @track kpiList = [];
    @track templateList = [];
    @track allTemplates=[];
    @track roleTemplateList = [];
    @track allRoleTemplates=[];
    selectedTemplateId;
    selectedTemplateDetail=[];

    kpiDetailList = [];
    okrDetailList = [];
    competencyDetailList = [];
    @track isOverview = true;
    @track isKpiView = false;
    @track isOkrView = false;
    @track isCompetencyView = false;
    @track isPermissionView = false;
    @track isApplyTemplate=false;

    @track permissionCount;
    @track staffList = [];
    @track staffCount;
    @track selectedStaffIds = [];
    @track effectiveDate;
    @track errorMessage;
    @track okrKeyUnit;
    @track okrKeyTarget;
    @track okrKeyTitle;
    @track expectedBehaviour;
    @track searchStaff = '';
    @track originalStaffResult = [];
    @track staffNameMap = {};
    @track isCreateReviewCycle=false;

    @track cycleName = '';
    @track selectedFacilityName = '';
    @track selectedCycleType = '';
    @track cycleStartDate = '';
    @track cycleEndDate = '';
    @track cycleLockDate = '';
    @track cycleDescription = '';

    @track selfStartDate = '';
    @track selfEndDate = '';
    @track selfLockDate = '';

    @track managerStartDate = '';
    @track managerEndDate = '';
    @track managerLockDate = '';

    @track hrStartDate = '';
    @track hrEndDate = '';
    @track hrLockDate = '';
    @track totalStaffCount = 0;
    @track selectedStaffCount = 0;
    @track selectedTemplateIds = [];
    @track cycleTemplatesOptions = []; 
    @track selectedCycleTemplate;  
    selectedTemplateStaffDetail=[];
    @track templateStaffList=[];
    @track templateRcRoleNames;
    @track isComingSoon = false;
    @track reviewCycleList = [];
    @track activeCyclesCount = 0;
    @track roleTemplatesCount = 0;
    @track reviewCycleStaffCount = 0;
   // @track isPermissionView=false;
    @track kpiCategoryOptions=[
        {label: 'Productivity', value: 'Productivity' },
        {label: 'Quality',value: 'Quality' },
        {label: 'Efficiency', value: 'Efficiency'},
        {label: 'Safety', value: 'Safety'},
        {label: 'Compliance', value: 'Compliance'}

    ];
    @track competencyCategoryOptions=[
        {label: 'Technical', value: 'Technical' },
        {label: 'Behavioral',value: 'Behavioral' },
        {label: 'Leadership', value: 'Leadership'}
    ];
    @track kpiUnitOptions=[
        {label: 'percentage', value: 'percentage' },
        {label: 'hours',value: 'hours' },
    ]
    
    @track cycleTypeOptions=[
        {label: 'Annual Review', value: 'Annual Review' },
        {label: 'Biannual Review',value: 'Biannual Review' },
        {label: 'Quarterly Review', value: 'Quarterly Review'}
    ];
    cards = [
            {
                id: '1',
                title: 'Review Cycle',
                description: 'Manage performance review cycles with multi template role-based assignment',
                subText: 'Monitor active review cycles and manage timelines',
              //  badgeText: 'Q1 2025 Performance Review',
                badgeClass: 'badge success',
                buttonLabel: 'View Cycle',
                materialIcon: 'grading',
                iconWrapperClass: 'icon-wrapper green'
            },
            {
                id: '2',
                title: 'Performance Reviews',
                description: 'Review and Finalize Assessments',
                subText: 'Review employee performance assessments and finalize reviews',
               // badgeText: '',
                badgeClass: '',
                buttonLabel: 'Review Assessment',
                materialIcon: 'earthquake',
                iconWrapperClass: 'icon-wrapper purple'
            },
            {
                id: '3',
                title: 'Coaching Management',
                description: 'Development Discussions and Notes',
                subText: 'Review coaching notes and track employee growth initiatives',
                //badgeText: '01 Pending',
                badgeClass: 'badge warning',
                buttonLabel: 'Manage Coaching',
                materialIcon: 'manage_accounts',
                iconWrapperClass: 'icon-wrapper orange'
            },
            {
                id: '4',
                title: 'Performance Improvement Plans',
                description: 'Track improvement initiatives',
                subText: 'Manage PIPs and track progress',
               // badgeText: '01 Active',
                badgeClass: 'badge info',
                buttonLabel: 'Manage PIPs',
                materialIcon: 'account_tree',
                iconWrapperClass: 'icon-wrapper blue'
            },
            {
                id: '5',
                title: 'Templates',
                description: 'Manage KPIs, OKRs, and review forms',
                subText: 'Design and configure role templates',
                //badgeText:`${this.templateCount} Templates`,
                badgeClass: 'badge brand',
                buttonLabel: 'Manage Templates',
                materialIcon: 'assignment_add',
                iconWrapperClass: 'icon-wrapper teal'
            }
        ];
    connectedCallback() {
        console.log('connectedCallback in TesseractAppsHrPmsLwc: ');
        // const storedFacilityId = localStorage.getItem("defaultFacilityId");
        this.selectedFacilityId = localStorage.getItem("defaultFacilityId");
        console.log('selectedFacilityId: ' + this.selectedFacilityId);
        this.selectedFacilityName = localStorage.getItem("defaultFacilityLabel");
        console.log('selectedFacilityName : ',this.selectedFacilityName);
         // document.addEventListener('click', this.handleOutsideClick);
             document.addEventListener('click', this.handleOutsideClick);
        
    }
    disconnectedCallback() {
        document.removeEventListener('click', this.handleOutsideClick);
         
    }

    // @track listenForOutsideClick = false;
    // handleOutsideClick = (event) => {
    //     if (this.listenForOutsideClick) {
    //         const dropdownElement = this.template.querySelector('[data-id="roleDropdown"]');
    //         if (dropdownElement && !dropdownElement.contains(event.target)) {
    //             console.log('🟥 Outside click: dropdown');
    //             this.isDropdownOpen = false;
    //             this.listenForOutsideClick = false;
    //         }
    //         const dropdownElement1 = this.template.querySelector('[data-id="roleDropdown1"]');
    //         if (dropdownElement1 && !dropdownElement1.contains(event.target)) {
    //             console.log('🟥 Outside click: dropdown');
    //             this.isDropdownOpen1 = false;
    //             this.listenForOutsideClick = false;
    //         }
            
    //     }
    // };

    // handleOutsideClick = (event) => {

    //     // Close first dropdown
    //     if (this.isDropdownOpen) {
    //         const clickedInsideComponent = this.template.contains(event.target);

    //         if (!clickedInsideComponent) {
    //             this.isDropdownOpen = false;
    //         }
    //     }

    //     // Close second dropdown
    //     if (this.isDropdownOpen1) {
    //         const clickedInsideComponent = this.template.contains(event.target);

    //         if (!clickedInsideComponent) {
    //             this.isDropdownOpen1 = false;
    //         }
    //     }
    // };
    handleOutsideClick = (event) => {
        const path = event.composedPath();

        // Close first dropdown
        if (this.isDropdownOpen) {
            const dropdownEl = this.template.querySelector('[data-id="roleDropdown"]');
            const buttonEl = this.template.querySelector('.multi-select');
            
            const clickedInside = path.includes(dropdownEl) || path.includes(buttonEl);
            if (!clickedInside) {
                this.isDropdownOpen = false;
            }
        }

        // Close second dropdown
        if (this.isDropdownOpen1) {
            const dropdownEl1 = this.template.querySelector('[data-id="roleDropdown1"]'); // your second dropdown data-id
            const buttonEl1 = this.template.querySelector('.your-second-button-class');
            
            const clickedInside = path.includes(dropdownEl1) || path.includes(buttonEl1);
            if (!clickedInside) {
                this.isDropdownOpen1 = false;
            }
        }
    };
    handleClick(event) {
        const cardId = event.target.dataset.id;
        console.log('Clicked:', cardId);
        switch (cardId) {
                case '1':
                    this.handleReviewCycle();
                    break;

                case '2':
                    this.handlePerformanceReviews();
                    break;

                case '3':
                    this.handleCoaching();
                    break;

                case '4':
                    this.handlePIPs();
                    break;

                case '5':
                    this.handleManageTemplates();
                    break;

                default:
                    console.log('Unknown action');
            }        
    }
    get isStep1() {
        return this.currentStep === 'step1';
    }

    get isStep2() {
        return this.currentStep === 'step2';
    }

    get isStep3() {
        return this.currentStep === 'step3';
    }

    get isStep4() {
        return this.currentStep === 'step4';
    }
    
    get isStep5() {
        return this.currentStep === 'step5';
    }
    get isRcStep1() {
        return this.rcCurrentStep === 'rcStep1';
    }

    get isRcStep2() {
        return this.rcCurrentStep === 'rcStep2';
    }

    get isRcStep3() {
        return this.rcCurrentStep === 'rcStep3';
    }

    // get isRcStep4() {
    //     return this.rcCurrentStep === 'rcStep4';
    // }
    get totalKpiWeightInCreate() {
        return this.kpiList.reduce(
            (acc, item) => acc + parseFloat(item.weight || 0),
            0
        );
    }

    get totalOkrWeightInCreate() {
        return this.okrList.reduce(
            (acc, item) => acc + parseFloat(item.weight || 0),
            0
        );
    }

    get totalCompetencyWeightInCreate() {
        return this.competencyList.reduce(
            (acc, item) => acc + parseFloat(item.weight || 0),
            0
        );
    }

    get totalOverallWeight() {
        return this.totalKpiWeightInCreate +
            this.totalOkrWeightInCreate +
            this.totalCompetencyWeightInCreate;
    }
    handleManageTemplates(){
        this.isHome=false;
        this.isManageTemplates=true;
        this.isReviewCycle=false; 
        this.isPerformanceReview=false;     
        let facilityIds = [];
       
        if ( this.selectedFacilityId) {
            facilityIds.push( this.selectedFacilityId);
            this.loadTemplates();
    
        }
        console.log("facilityIds  " + JSON.stringify(facilityIds));
        if (facilityIds.length > 0) {
   
            fetchBulkRoles({ facilityIDList: facilityIds })
                .then(facRoles => {

                    console.log("facRoles  " + JSON.stringify(facRoles));
                    console.log('Returned roles length:', facRoles.length);
                    // Safety check in case Apex returns null
                    const mappedRoles = (facRoles || []).map(rec => ({
                        label: rec.Role_Name__c,
                        value: rec.Id,
                        //checked:false
                    }));

                    // this.roleOptions = [
                    //     { label: 'All', value: 'All' },
                    //     ...mappedRoles
                    // ];
                    this.roleOptions = [
                        { label: 'All', value: 'All', checked: false },
                        ...mappedRoles.map(role => ({
                            ...role,
                            checked: false
                        }))
                    ];
                    this.roleTemplateOptions=[...mappedRoles];
                    this.selectedRoles = [];
                    //this.selectedRole = 'All';
                })
                .catch(error => {
                    console.error('Error fetching roles:', error);
                });
        }

    }
    toggleDropdown(event) {
        event.stopPropagation(); 
        this.isDropdownOpen = !this.isDropdownOpen;
       
    }
    toggleDropdown1(event) {
        event.stopPropagation(); 
        this.isDropdownOpen1 = !this.isDropdownOpen1;
       
    }

    // handleRoleSelection(event) {
    //     const value = event.target.value;
    //     const checked = event.target.checked;
    //     if (value === 'All') {

    //         if (checked) {
    //             // Select ALL roles
    //             this.selectedRoles = this.roleOptions.map(role => role.value);
    //         } else {
    //             // Deselect all
    //             this.selectedRoles = [];
    //         }

    //     } else {
    //         if (checked) {
    //             // this.selectedRoles = [...this.selectedRoles, value];
    //             if (!this.selectedRoles.includes(value)) {
    //                 this.selectedRoles = [...this.selectedRoles, value];
    //             }
    //         } else {
    //             this.selectedRoles = this.selectedRoles.filter(role => role !== value);
    //         }
    //     }
    //     console.log("this.selectedRoles  " + JSON.stringify(this.selectedRoles));
    //     // Update checked state in roleOptions
    //     this.roleOptions = this.roleOptions.map(role => ({
    //         ...role,
    //         checked: this.selectedRoles.includes(role.value)
    //     }));
    //     console.log('selectedRolesLabel :', this.selectedRolesLabel);
    // }
    get selectedOptionClass() {
      //  return this.selectedRoles.length > 0 ? 'selected-text slds-truncate' : 'placeholder-text slds-truncate';
       let baseClass = 'select-btn slds-truncate';

        if (this.selectedRoles && this.selectedRoles.length > 0) {
            return baseClass + ' selected-text';
        }

        return baseClass + ' placeholder-text';
    }
    get selectedOptionClassInApply() {
        let baseClass = 'select-btn slds-truncate';

        if (this.selectedRolesInApply && this.selectedRolesInApply.length > 0) {
            return baseClass + ' selected-text';
        }

        return baseClass + ' placeholder-text';
    }
    handleRoleSelection(event) {
        // event.stopPropagation(); 
        const value = event.target.value;
        const checked = event.target.checked;
        console.log('handleRoleSelection:', value, checked);
        // If "All" is selected
        if (value === 'All') {

            if (checked) {
                //this.selectedRoles = this.roleOptions.map(role => role.value);
               this.selectedRoles = this.roleOptions
                .filter(role => role.value !== 'All')
                .map(role => role.value);
            } else {
                this.selectedRoles = [];
            }

        } else {
            // const selectedOption = this.roleOptions.find(role => role.value === value);
            if (checked) {
                if (!this.selectedRoles.includes(value)) {
                    this.selectedRoles = [...this.selectedRoles, value];
                }
            } else {
                //this.selectedRoles = this.selectedRoles.filter(role => role !== value);
                this.selectedRoles = this.selectedRoles.filter(
                    roleId => roleId !== value
                );
            }

            // If every role except "All" is selected → auto-check "All"
            const allRoleIds  = this.roleOptions
                .filter(role => role.value !== 'All')
                .map(role => role.value);

            const allSelected = allRoleIds.every(id =>
                this.selectedRoles.includes(id)
            );
            // if (allSelected) {
            //     this.selectedRoles = ['All', ...allRoleIds];
            // } else {
            //     this.selectedRoles = this.selectedRoles.filter(role => role !== 'All');
            // }
            if (allSelected) {
                this.selectedRoles = [...allRoleIds];
            }
        }

        console.log("Updated selectedRoles:", JSON.stringify(this.selectedRoles));

        //  Update checkbox states
        // this.roleOptions = this.roleOptions.map(role => ({
        //     ...role,
        //     checked: this.selectedRoles.includes(role.value)
        // }));
        this.roleOptions = this.roleOptions.map(role => ({
            ...role,
            checked:
                role.value === 'All'
                    ? this.selectedRoles.length ===
                    this.roleOptions.length - 1
                    : this.selectedRoles.includes(role.value)
        }));

        
        // console.log('Filtered Templates:', this.filteredTemplateList.length);
        // if (!this.selectedRoles.length) {
        //     // Nothing selected → show all
        //     this.templateList = [...this.allTemplates];
        //     return;
        // }

        // // Convert selected role values to labels
        // const selectedRoleLabels = this.roleOptions
        //     .filter(role =>
        //         role.value !== 'All' &&
        //         this.selectedRoles.includes(role.value)
        //     )
        //     .map(role => role.label);

        // // Filter templates
        // this.templateList = this.allTemplates.filter(template => {

        //     if (!template.appliedRoles) return false;

        //     const templateRoles = template.appliedRoles
        //         .split(',')
        //         .map(r => r.trim());

        //     // Match ANY selected role
        //     return selectedRoleLabels.some(role =>
        //         templateRoles.includes(role)
        //     );
        // });
    }
    handleRoleSelection1(event) {

        const value = event.target.value;
        const checked = event.target.checked;
        console.log('handleRoleSelection1:', value, checked);
        // If "All" is selected
        if (value === 'All') {

            if (checked) {
               this.selectedRolesInApply = this.roleOptions
                .filter(role => role.value !== 'All')
                .map(role => role.value);
            } else {
                this.selectedRolesInApply = [];
            }

        } else {
           
            if (checked) {
                if (!this.selectedRolesInApply.includes(value)) {
                    this.selectedRolesInApply = [...this.selectedRolesInApply, value];
                }
            } else {
                
                this.selectedRolesInApply = this.selectedRolesInApply.filter(
                    roleId => roleId !== value
                );
            }

            const allRoleIds  = this.roleOptions
                .filter(role => role.value !== 'All')
                .map(role => role.value);

            const allSelected = allRoleIds.every(id =>
                this.selectedRolesInApply.includes(id)
            );
            
            if (allSelected) {
                this.selectedRolesInApply = [...allRoleIds];
            }
        }

        console.log("Updated selectedRolesInApply:", JSON.stringify(this.selectedRolesInApply));

        this.roleOptions = this.roleOptions.map(role => ({
            ...role,
            checked:
                role.value === 'All'
                    ? this.selectedRolesInApply.length ===
                    this.roleOptions.length - 1
                    : this.selectedRolesInApply.includes(role.value)
        }));
        this.searchStaff = ''; 
        this.loadstaffList();
    }


    
    // get selectedRolesLabel() {
    //     let label;

    //     if (!this.selectedRoles || this.selectedRoles.length === 0) {
    //         label = 'Select Roles';
    //     } else if (this.selectedRoles.length === 1) {
    //         label = this.selectedRoles[0];
    //     } else {
    //         label = this.selectedRoles.join(', ');
    //     }

    //     console.log('Getter selectedRolesLabel:', label); // ✅ Proper log
    //     return label;
    // }
    get selectedRolesLabel() {

        // const rolesWithoutAll = this.selectedRoles.filter(r => r !== 'All');

        // if (rolesWithoutAll.length === 0) {
        //     return 'Select Roles';
        // } 
        // console.log('Getter selectedRolesLabel:', rolesWithoutAll.join(', '));
        // return rolesWithoutAll.join(', ');
        if (!this.selectedRoles || this.selectedRoles.length === 0) {
            return '';
        }

        // Convert selected Ids to labels
        const labels = this.selectedRoles.map(id => {
            const role = this.roleOptions.find(r => r.value === id);
            return role ? role.label : '';
        });

        console.log('selectedRolesLabel:', labels.join(', '));

        return labels.join(', ');
    }
     get selectedRolesLabelInApply() {

        if (!this.selectedRolesInApply || this.selectedRolesInApply.length === 0) {
            return '';
        }

        // Convert selected Ids to labels
        const labels = this.selectedRolesInApply.map(id => {
            const role = this.roleOptions.find(r => r.value === id);
            return role ? role.label : '';
        });

        console.log('selectedRolesLabelInApply:', labels.join(', '));

        return labels.join(', ');
    }
    handleCreateTemplate(){
        this.isHome=false;
        this.isCreateTemplate=true;
       // this.listenForOutsideClick = true;
        this.showCancel=true;
        this.showNext=true;
        this.showPrevious=false;
        this.showSave=false;
        this.currentStep = 'step1';
       // this.selectedRoleTemplate='';
        this.roleTitle='';
        this.templateDescription='';
        this.clearCompetencyFields();
        this.clearKpiFields();
        this.clearCompetencyFields();
        this.kpiList=[];
        this.okrList=[];
        this.competencyList=[];
        this.selfReview=false;
        this.managerReview=false;
        this.goalsPermission=false;

    }
    cancelCreateTemplate(){
        this.isHome=false;
        this.isCreateTemplate=false;
        this.isManageTemplates=true;
       // this.listenForOutsideClick = true;
    }
    handleNext() {

        switch (this.currentStep) {

            case 'step1':
               // console.log(' this.selectedRoleTemplate ' + this.selectedRoleTemplate);
                console.log(' this.templateDescription ' + this.templateDescription);
               // if (!this.selectedRoleTemplate  || !this.templateDescription) {
                if (!this.roleTitle  || !this.templateDescription) {
                    this.showToast('Error', 'Please fill all required fields in Basic Info.', 'error');
                    return;
                }
                this.currentStep = 'step2';
                this.showPrevious=true;
                this.showNext=true;
                this.showCancel=false;
                this.showSave=false;
                this.showSkip=true;
                break;

            case 'step2':
                console.log('this.totalKpiWeightInCreate',this.totalKpiWeightInCreate);
                // console.log('this.kpiList.weight',this.kpiList.weight);
                // console.log('kpilist : ',JSON.stringify(this.kpiList));

                if (this.isRequiredKpiFieldsEmpty() && this.kpiList.length === 0  ) {
                    this.showToast('Error', 'Please fill all required KPI fields.', 'error');
                    return;
                }

                if (this.totalKpiWeightInCreate === 0) {
                    this.showToast('Error', 'Please add at least one KPI.', 'error');
                    return;
                }

                if (this.totalKpiWeightInCreate > 100) {
                    this.showToast('Error', 'KPI total weight cannot exceed 100%.', 'error');
                    return;
                }

                if (this.totalKpiWeightInCreate === 100) {
                    // Skip OKR & Competency
                    this.currentStep = 'step5';
                    this.showNext = false;
                    this.showSkip = false;
                    this.showSave = true;
                    this.showCancel = true;
                    break;
                }
                this.currentStep = 'step3';
                this.showPrevious=true;
                this.showNext=true;
                this.showCancel=false;
                this.showSave=false;
                this.showSkip=true;
                break;

            case 'step3':
                if (this.isRequiredOkrFieldsEmpty() && this.okrList.length === 0) {
                    this.showToast('Error', 'Please fill all required OKR fields.', 'error');
                    return;
                }
                const totalKpiOkr =
                    this.totalKpiWeightInCreate +
                    this.totalOkrWeightInCreate;

                if (totalKpiOkr > 100) {
                    this.showToast(
                        'Error',
                        'Combined KPI + OKR weight cannot exceed 100%.',
                        'error'
                    );
                    return;
                }

                //  If KPI + OKR = 100 → skip competency
                if (totalKpiOkr === 100) {
                    this.currentStep = 'step5';
                    this.showPrevious = true;
                    this.showNext = false;
                    this.showCancel = true;
                    this.showSave = true;
                    this.showSkip = false;
                    break;
                }

                // If still less than 100 → go to competency
                this.currentStep = 'step4';
                this.showPrevious = true;
                this.showNext = true;
                this.showCancel = false;
                this.showSave = false;
                this.showSkip = true;
                break;

            case 'step4':
                if (this.isRequiredCompetencyFieldsEmpty() && this.competencyList.length === 0) {
                    this.showToast('Error', 'Please fill all required Competency fields.', 'error');
                    return;
                }
                if (this.totalOverallWeight > 100) {
                    this.showToast(
                        'Error',
                        'Total weight cannot exceed 100%.',
                        'error'
                    );
                    return;
                }

                if (this.totalOverallWeight !== 100) {
                    this.showToast(
                        'Error',
                        'Total KPI + OKR + Competency weight must equal exactly 100%.',
                        'error'
                    );
                    return;
                }

                this.currentStep = 'step5';
                this.showPrevious=true;
                this.showCancel=true;
                this.showSave=true;
                this.showNext=false;
                this.showSkip=false;
                break;

            default:
                break;
        }
    }
    handlePrevious() {

        switch (this.currentStep) {

           

            case 'step2':
                this.currentStep = 'step1';
                this.showPrevious=false;
                this.showNext=true;
                this.showCancel=true;
                this.showSave=false;
                this.showSkip=false;
                break;
            case 'step3':
                this.currentStep = 'step2';
                this.showPrevious=true;
                this.showNext=true;
                this.showCancel=false;
                this.showSave=false;
                this.showSkip=true;
                break;
            case 'step4':
                this.currentStep = 'step3';
                this.showPrevious=true;
                this.showNext=true;
                this.showCancel=false;
                this.showSave=false;
                this.showSkip=true;
                break;
             case 'step5':
                this.currentStep = 'step4';
                this.showPrevious=true;
                this.showNext=true;
                this.showCancel=false;
                this.showSave=false;
                this.showSkip=true;
                break;

            default:
                break;
        }
    }
   
    handleChange(event) {

        const fieldName = event.target.name;
        const value = event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value;

        switch (fieldName) {

            case 'templateDescription':
                this.templateDescription = value;
                break;

            // case 'selectedRoleTemplate':
            //    // this.selectedRoleTemplate = value;
            //     const selectedOption = this.roleTemplateOptions.find(
            //         option => option.value === value
            //     );

            //     if (selectedOption) {
            //         this.selectedRoleName = selectedOption.label;
            //         this.selectedRoleTemplate = selectedOption.value;
            //     }

            //     console.log('Selected Role Id:', this.selectedRoleTemplate);
            //     console.log('Selected Role Label:', this.selectedRoleName);
            //     break;
            case 'roleTitle':
                this.roleTitle = value;
                
                console.log('roleTitle:', this.roleTitle);
                break;

            case 'kpiName':
                this.kpiName = value;
                break;

            case 'selectedKpiCategory':
                this.selectedKpiCategory = value;
                break;

            case 'kpiTarget':
                this.kpiTarget = value;
                break;

            case 'kpiUnit':
                this.kpiUnit = value;
                console.log('Selected kpiUnit:', this.kpiUnit);
                break;

            case 'kpiWeight':
                this.kpiWeight = value;
                break;

            case 'kpiDescription':
                this.kpiDescription = value;
                break;

            
            case 'okrObjective':
                this.okrObjective = value;
                break;
            // case 'okrName':
            //     this.okrName = value;
            //     break;

            case 'okrKeyTitle':
                this.okrKeyTitle = value;
                break;

            case 'okrKeyTarget':
                this.okrKeyTarget = value;
                break;

            case 'okrKeyUnit':
                this.okrKeyUnit = value;
                break;

            case 'okrWeight':
                this.okrWeight = value;
                break;

            case 'okrDescription':
                this.okrDescription = value;
                break;


            case 'competencyName':
                this.competencyName = value;
                break;

            case 'selectedCompetencyCategory':
                this.selectedCompetencyCategory = value;
                break;

            case 'expectedBehaviour':
                this.expectedBehaviour = value;
                break;

            // case 'competencyUnit':
            //     this.competencyUnit = value;
            //     break;

            case 'competencyWeight':
                this.competencyWeight = value;
                break;

            case 'competencyDescription':
                this.competencyDescription = value;
                break;
            case 'effectiveDate':
                this.effectiveDate = value;
                break;
            default:
                console.warn('Unhandled field:', fieldName);
                break;
        }
    }
    handlePermissionChange(event) {
        const fieldName = event.target.name;
        const value = event.target.checked;
        
        switch (fieldName) {
             case 'selfReview':
                this.selfReview = value;
                console.log('selfReview:', this.selfReview);
                break;
            
            case 'managerReview':
                this.managerReview = value;
                console.log('managerReview:', this.managerReview);
                break;
            
            case 'goalsPermission':
                this.goalsPermission = value;
                console.log('goalsPermission:', this.goalsPermission);
                break;

            default:
                console.warn('Unhandled field:', fieldName);
                break;
        }


    }

    isRequiredKpiFieldsEmpty() {
        return !this.kpiName ||
            !this.selectedKpiCategory ||
            !this.kpiTarget ||
            //!this.kpiUnit ||
            !this.kpiWeight ||
            !this.kpiDescription;
    }
    isRequiredOkrFieldsEmpty() {
        return !this.okrObjective ||
         // !this.okrName ||
        //     !this.selectedOkrCategory ||
        //     !this.okrTarget ||
        //     !this.okrUnit ||
            !this.okrWeight ||
            !this.okrDescription;
    }
    isRequiredCompetencyFieldsEmpty() {
        return !this.competencyName ||
            !this.selectedCompetencyCategory ||
           // !this.competencyTarget ||
            !this.expectedBehaviour ||
            !this.competencyWeight ||
            !this.competencyDescription;
    }
    handleAddKpi() {

        if (this.isRequiredKpiFieldsEmpty()) {
            this.showToast('Error', 'Please fill all required KPI fields.', 'error');
            return;
        }

        let newWeight = parseFloat(this.kpiWeight || 0);
        let totalWeight = this.kpiList.reduce(
            (acc, kpi) => acc + parseFloat(kpi.weight || 0),
            0
        );

        if (totalWeight + newWeight > 100) {
            this.showToast('Error', 'Total KPI weightage cannot exceed 100%.', 'error');
            return;
        }

        const kpiData = {
            kpiName: this.kpiName,
            category: this.selectedKpiCategory,
            target: this.kpiTarget,
            unit: this.kpiUnit ||'',
            weight: this.kpiWeight,
            description: this.kpiDescription,
            key: Date.now()
        };

        this.kpiList = [...this.kpiList, kpiData];

        this.clearKpiFields();
    }
    handleAddOkr() {

        if (this.isRequiredOkrFieldsEmpty()) {
            this.showToast('Error', 'Please fill all required OKR fields.', 'error');
            return;
        }

        // let newWeight = parseFloat(this.okrWeight || 0);

        // let totalWeight = this.okrList.reduce(
        //     (acc, okr) => acc + parseFloat(okr.weight || 0),
        //     0
        // );

        // if (totalWeight + newWeight > 100) {
        //     this.showToast('Error', 'Total OKR weightage cannot exceed 100%.', 'error');
        //     return;
        // }
        let newWeight = parseFloat(this.okrWeight || 0);

        //  Combined validation (KPI + OKR + NEW OKR)
        const totalKpiOkrWeight =
            this.totalKpiWeightInCreate +
            this.totalOkrWeightInCreate +
            newWeight;

        if (totalKpiOkrWeight > 100) {
            this.showToast(
                'Error',
                'Combined KPI + OKR weight cannot exceed 100%.',
                'error'
            );
            return;
        }

        const okrData = {
            okrObjective: this.okrObjective,
            // okrName: this.okrName,
            keyTitle: this.okrKeyTitle,
            keyTarget: this.okrKeyTarget,
            keyUnit: this.okrKeyUnit,
            weight: this.okrWeight,
            description: this.okrDescription,
            key: Date.now()
        };

        this.okrList = [...this.okrList, okrData];

        this.clearOkrFields();
    }
    handleAddCompetency() {

        if (this.isRequiredCompetencyFieldsEmpty()) {
            this.showToast('Error', 'Please fill all required Competency fields.', 'error');
            return;
        }

        // let newWeight = parseFloat(this.competencyWeight || 0);

        // let totalWeight = this.competencyList.reduce(
        //     (acc, comp) => acc + parseFloat(comp.weight || 0),
        //     0
        // );

        // if (totalWeight + newWeight > 100) {
        //     this.showToast('Error', 'Total Competency weightage cannot exceed 100%.', 'error');
        //     return;
        // }
        let newWeight = parseFloat(this.competencyWeight || 0);

        //  Combined validation (KPI + OKR + Competency)
        const overallWeight =
            this.totalKpiWeightInCreate +
            this.totalOkrWeightInCreate +
            this.totalCompetencyWeightInCreate +
            newWeight;

        if (overallWeight > 100) {
            this.showToast(
                'Error',
                'Total KPR,OKR and Comptencies weight cannot exceed 100%.',
                'error'
            );
            return;
        }

        const competencyData = {
            competencyName: this.competencyName,
            category: this.selectedCompetencyCategory,
            // target: this.competencyTarget,
            behaviour: this.expectedBehaviour,
            weight: this.competencyWeight,
            description: this.competencyDescription,
            key: Date.now()
        };

        this.competencyList = [...this.competencyList, competencyData];

        this.clearCompetencyFields();
    }


    clearKpiFields() {
        this.kpiName = '';
        this.selectedKpiCategory = '';
        this.kpiTarget=null;
        this.kpiUnit = '';
        this.kpiWeight = null;
        this.kpiDescription = '';
    }
    clearOkrFields() {
        this.okrObjective = '';
        // this.okrName = '';
        this.okrKeyTitle = '';
        this.okrKeyTarget = null;
        this.okrKeyUnit = '';
        this.okrWeight = null;
        this.okrDescription = '';
    }
    clearCompetencyFields() {
        this.competencyName = '';
        this.selectedCompetencyCategory = '';
        // this.competencyTarget = '';
        this.expectedBehaviour = '';
        this.competencyWeight = null;
        this.competencyDescription = '';
    }
    handleDeleteKpi(event) {
        const key = event.currentTarget.dataset.key;
        this.kpiList = this.kpiList.filter(kpi => kpi.key != key);
    }
    handleDeleteOkr(event) {
        const key = event.currentTarget.dataset.key;
        this.okrList = this.okrList.filter(okr => okr.key != key);
    }
    handleDeleteCompetency(event) {
        const key = event.currentTarget.dataset.key;
        this.competencyList = this.competencyList.filter(comp => comp.key != key);
    }

    handleSave() {
        console.log('Saving...');
        const templateData = {
            //role: this.selectedRoleTemplate,
            roleTitle: this.roleTitle,
            //roleName:this.selectedRoleName,
            facilityId: this.selectedFacilityId,
            description: this.templateDescription,
            selfReview: this.selfReview,
            managerReview: this.managerReview,
            goalsPermission: this.goalsPermission
        };

        saveTemplate({
            templateData: templateData,
            kpiList: this.kpiList,
            okrList: this.okrList,
            competencyList: this.competencyList
        })
        .then(templateId => {
            console.log('Created Template Id:', templateId);
            this.loadTemplates();
             this.isCreateTemplate = false;
        })
        .catch(error => {
            console.error(error);
        });
        
       
    }
    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,  // success, error, info, warning
            mode: 'dismissable' // You can also use 'pester' or 'sticky'
        });
        this.dispatchEvent(evt);
    }
    handleSkip() {
        // const inputs = this.template.querySelectorAll(
        //     'lightning-input, lightning-combobox, lightning-textarea'
        // );

        // inputs.forEach(input => {
        //     input.required = false;
        // });
        console.log('this.currentStep befre skip', this.currentStep);
        if (this.currentStep === 'step2') {
            this.currentStep = 'step3';
            this.kpiList=[];
            this.clearKpiFields();
            this.showPrevious=true;
            this.showNext=true;
            this.showCancel=false;
            this.showSave=false;
            this.showSkip=true;
        }
        else if (this.currentStep === 'step3') {
            this.currentStep = 'step4';
            this.okrList=[];
            this.clearOkrFields();
            this.showPrevious=true;
            this.showNext=true;
            this.showCancel=false;
            this.showSave=false;
            this.showSkip=true;
        }
        else if (this.currentStep === 'step4') {
            this.currentStep = 'step5';
            this.competencyList=[];
            this.clearCompetencyFields();
            this.showPrevious=true;
            this.showNext=true;
            this.showCancel=true;
            this.showSave=false;
            this.showSkip=false;
        }

        console.log('this.currentStep after skip ', this.currentStep);
        

    }
    get totalTemplates() {
        return this.templateList ? this.templateList.length : 0;
    }
    get totalRoles() {
        return this.selectedRoles ? this.selectedRoles.length : 0;
    }

    loadTemplates() {
        if (!this.selectedFacilityId) {
           // this.showToast('Error', 'Please select a facility.', 'error');
            return;
        }
        getTemplatesByFacility({ facilityId: this.selectedFacilityId })
            .then(result => {

                console.log('Templates:', result);
               //  this.templateList = result;
            //    this.templateList = result.map(item => ({
            //         ...item,
            //         kpiCount: item.PMS_KPIs__r ? item.PMS_KPIs__r.length : 0,
            //         okrCount: item.PMS_OKRs__r ? item.PMS_OKRs__r.length : 0,
            //         competencyCount: item.PMS_Competencies__r ? item.PMS_Competencies__r.length : 0
            //     }));
                this.allTemplates = result.map(item => {

                    const permissionCount =
                        (item.Self_Review__c ? 1 : 0) +
                        (item.Manager_Review__c ? 1 : 0) +
                        (item.Goals_Permission__c ? 1 : 0);

                    return {
                        ...item,
                        roleTitle: item.Role_Title__c  || '',
                        //appliedRoles:item.Role__c ||'',
                        description: item.Template_Description__c || '',
                        kpiCount: item.PMS_Base_KPIs__r ? item.PMS_Base_KPIs__r.length : 0,
                        okrCount: item.PMSBase_OKRS__r? item.PMSBase_OKRS__r.length : 0,
                        competencyCount: item.PMS_BaseCompetencys__r ? item.PMS_BaseCompetencys__r.length : 0,
                        permissionCount: permissionCount,
                        //staffCount: item.Staffs__r ? item.Staffs__r.length : 0,
                    };
                });
                 this.templateList = [...this.allTemplates];
                // console.log('this.templateList ', JSON.stringify(this.templateList));
                 console.log('this.allTemplates ', JSON.stringify(this.allTemplates));
            })
            .catch(error => {
                console.error('Error loading templates:', error);
            });
    }
    handleViewDetails(event) {

        const templateId = event.currentTarget.dataset.id;

        console.log('Selected Template Id:', templateId);

        // Store selected Id
        this.selectedTemplateId = templateId;

        this.loadTemplateById();
        //  this.selectedTemplateDetail = this.templateList.find(
        //     item => item.Id === templateId
        // );

        // if (this.selectedTemplateDetail) {

        //     this.kpiDetailList = this.selectedTemplateDetail.PMS_KPIs__r || [];
        //     this.okrDetailList = this.selectedTemplateDetail.PMS_OKRs__r || [];
        //     this.competencyDetailList = this.selectedTemplateDetail.PMS_Competencies__r || [];

        //     this.isTemplateViewDetail = true;
        //     console.log('selectedTemplateDetail ', JSON.stringify(this.selectedTemplateDetail));
        //     console.log('Role__c ', this.selectedTemplateDetail.Role__c);
        //     console.log('Template_Description__c ', this.selectedTemplateDetail.Template_Description__c);
        //     console.log('kpi count  ', this.kpiCount);
        // }
    }
    get kpiCount() {
        return this.kpiDetailList?.length || 0;
    }

    get okrCount() {
        return this.okrDetailList?.length || 0;
    }

    get competencyCount() {
        return this.competencyDetailList?.length || 0;
    }
    get totalKpiWeight() {
        return (this.kpiDetailList || []).reduce(
            (sum, item) => sum + (item.KPI_Weight__c || 0),
            0
        );
    }
    get totalOkrWeight() {
        return (this.okrDetailList || []).reduce(
            (sum, item) => sum + (item.OKR_Weight__c || 0),
            0
        );
    }
    get totalCompetencyWeight() {
        return (this.competencyDetailList || []).reduce(
            (sum, item) => sum + (item.Competency_Weight__c || 0),
            0
        );
    }
    loadTemplateById() {
        if (!this.selectedTemplateId) {
           // this.showToast('Error', 'Please select a facility.', 'error');
            return;
        }
        getTemplatesById({ templateId: this.selectedTemplateId })
            .then(result => {

                console.log('TemplatesDetails:', result);
                this.selectedTemplateDetail = result[0];

                // Extract child records safely
                this.kpiDetailList = this.selectedTemplateDetail?.PMS_Base_KPIs__r || [];
                this.okrDetailList = this.selectedTemplateDetail?.PMSBase_OKRS__r || [];
                this.competencyDetailList = this.selectedTemplateDetail?.PMS_BaseCompetencys__r || [];

                this.isTemplateViewDetail = true;
                this.resetTabs();
                this.isOverview = true;

                console.log('selectedTemplateDetail ', JSON.stringify(this.selectedTemplateDetail));
                console.log('Role_Title__c ', this.selectedTemplateDetail.Role_Title__c);
                console.log('Template_Description__c ', this.selectedTemplateDetail.Template_Description__c);

                this.selfReviewInView = this.selectedTemplateDetail.Self_Review__c || false;
                this.managerReviewInView = this.selectedTemplateDetail.Manager_Review__c || false;
                this.goalsPermissionInView = this.selectedTemplateDetail.Goals_Permission__c || false;
                
                // ✅ Permission Count (boolean fields)
                this.permissionCount =
                    (this.selectedTemplateDetail.Self_Review__c ? 1 : 0) +
                    (this.selectedTemplateDetail.Manager_Review__c ? 1 : 0) +
                    (this.selectedTemplateDetail.Goals_Permission__c ? 1 : 0);

                console.log('KPI Count:', this.kpiCount);
                console.log('OKR Count:', this.okrCount);
                console.log('Competency Count:', this.competencyCount);
                console.log('Permission Count:', this.permissionCount);
            })
            .catch(error => {

                console.error('Error loading template:', error);

            })
            
    }
    handleTemplateViewClose(){
        this.isTemplateViewDetail = false;
    }
    get overviewTabClass() {
        return this.isOverview ? 'active' : '';
    }

    get kpiViewTabClass() {
        return this.isKpiView ? 'active' : '';
    }

    get okrViewTabClass() {
        return this.isOkrView ? 'active' : '';
    }

    get comptencyViewTabClass() {
        return this.isCompetencyView ? 'active' : '';
    }

    get permissionViewTabClass() {
        return this.isPermissionView ? 'active' : '';
    }
    resetTabs() {
        this.isOverview = false;
        this.isKpiView = false;
        this.isOkrView = false;
        this.isCompetencyView = false;
        this.isPermissionView = false;
    }
    handleOverviewClick() {
        this.resetTabs();
        this.isOverview = true;
    }

    handleKpiViewClick() {
        this.resetTabs();
        this.isKpiView = true;
    }

    handleOkrViewClick() {
        this.resetTabs();
        this.isOkrView = true;
    }

    handleComptencyViewClick() {
        this.resetTabs();
        this.isCompetencyView = true;
    }

    handlePermissionViewClick() {
        this.resetTabs();
        this.isPermissionView = true;
        
    }
    handleApplyTemplate(event){
        const templateId = event.currentTarget.dataset.id;
        console.log('Selected Template Id IN handleApplyTemplate:', templateId);
        this.selectedTemplateId = templateId;
        this.isApplyTemplate = true;
      
         const allRoleIds = this.roleOptions
            .filter(role => role.value !== 'All')
            .map(role => role.value);

        this.selectedRolesInApply = [...allRoleIds];

        // Update checkbox UI
        this.roleOptions = this.roleOptions.map(role => ({
            ...role,
            checked: true   
        }));

        this.loadstaffList();

        this.isTemplateViewDetail = false;
       // this.selectedRolesInApply = [];
        this.selectedStaffIds = [];
        this.errorMessage = '';
        this.searchStaff = '';
        this.effectiveDate = null;
        // if (this.staffList && this.staffList.length > 0) {

        //     this.staffList = this.staffList.map(staff => ({
        //         ...staff,
        //         selected: false,
        //         showAssignedTemplate: false
        //     }));

        //     this.staffList = [...this.staffList];
        // }
        this.isDropdownOpen1=false;
        this.resetTabs();
        console.log('selectedRolesLabelInApply 111:', this.selectedRolesLabelInApply);
      
    }
  
    loadstaffList(){
        const roleNames = (this.selectedRolesInApply || []).map(id => {
        const role = this.roleOptions.find(r => r.value === id);
        return role ? role.label : null;
        }).filter(name => name);

        console.log('OrgId:', this.orgid);
        console.log('FacilityId:', this.selectedFacilityId);
        console.log('Role Names:', JSON.stringify(roleNames));

        getStaffsByOrg({
            orgId: this.orgid,
            facilityId: this.selectedFacilityId,
            roleNames: roleNames
        })
        .then(result => {

            console.log('Staff List:', JSON.stringify(result));
            this.originalStaffResult = result;
              this.staffNameMap = {};


            // Now build UI list
            // this.staffList = result.map(p => {
            //     const profileUrl = p.picture__c ? p.picture__c : '';
            //      console.log( 'Profile URL mapping:', p.Id, profileUrl  );

            //     const alreadyAssigned = !!p.PMS_Role_Template__c;
            //     let managerName = '';

            //     if (p.Manager__c && staffNameMap[p.Manager__c]) {
            //         managerName = staffNameMap[p.Manager__c];
            //     }

            //     return {
            //         id: p.Id,
            //         name: p.NameToDisplay__c || p.Name || '',
            //         email: p.Email_Address__c,
            //         role: p.Role__c,
            //         managerName: managerName || '',
            //         profileUrl: profileUrl,
            //         alreadyAssigned: alreadyAssigned,
            //         assignedTemplateName: p.PMS_Role_Template__r 
            //             ? p.PMS_Role_Template__r.Role_Title__c 
            //             : '',
            //         showAssignedTemplate: false,
            //         selected: false
            //     };
            // });
            result.forEach(staff => {
                this.staffNameMap[staff.Id] =
                    staff.Display_Nickname__c || staff.Name;
            });
           // this.staffList = this.originalStaffResult.map(p => this.mapStaff(p));
            this.staffList = this.originalStaffResult
                .sort((a, b) => {
                    const aAssigned = !!a.PMS_Role_Template__c;
                    const bAssigned = !!b.PMS_Role_Template__c;

                    // true first, false later
                    return bAssigned - aAssigned;
                })
                .map(p => this.mapStaff(p));

            // Optional: count
            this.staffCount = result.length;
            
            const alreadyAssignedCount = this.staffList.filter(
                staff => staff.alreadyAssigned
            ).length;

            if (alreadyAssignedCount > 0) {
                this.errorMessage =
                    `${alreadyAssignedCount} staff already have template assigned.`;
            } else {
                this.errorMessage = '';
            }

            console.log('Already assigned count:', alreadyAssignedCount);
            console.log('staffList:', JSON.stringify(this.staffList));
            console.log('staffCount:', this.staffCount);
            this.totalStaffCount = this.staffList.length;
        })
        .catch(error => {

            console.error('Error loading staff:', error);

        });
    }
    mapStaff(p) {

        const profileUrl = p.picture__c ? p.picture__c : '';
        const alreadyAssigned = !!p.PMS_Role_Template__c;

        let managerName = '';

        if (p.Manager__c && this.staffNameMap[p.Manager__c]) {
            managerName = this.staffNameMap[p.Manager__c];
        }
        let primaryRole = '';

        if (p.StaffRoles__r && p.StaffRoles__r.length > 0) {
            primaryRole = p.StaffRoles__r[0].RoleName__c;
        }

        return {
            id: p.Id,
            name: p.Display_Nickname__c || p.Name || '',
            email: p.Email_Address__c || '',
            role: primaryRole || '',
            managerName: managerName,
            profileUrl: profileUrl,
            alreadyAssigned: alreadyAssigned,
            assignedTemplateName: p.PMS_Role_Template__r
                ? p.PMS_Role_Template__r.Role_Title__c
                : '',
            showAssignedTemplate: alreadyAssigned,
            selected: alreadyAssigned
        };
    }
    // get isAllSelected() {
    //     return this.staffList.length > 0 &&
    //         this.staffList.every(staff => staff.selected);
    // }
    get isAllSelected() {

        const selectableStaff = this.staffList.filter(
            staff => !staff.alreadyAssigned
        );

        return selectableStaff.length > 0 &&
            selectableStaff.every(staff => staff.selected);
    }
    // handleSelectAll(event) {

    //     const checked = event.target.checked;

    //     this.staffList = this.staffList.map(staff => {
    //         return {
    //             ...staff,
    //             selected: checked
    //         };
    //     });

    //     console.log('Select All Changed:', checked);
    //     this.selectedStaffIds = this.staffList
    //         .filter(staff => staff.selected)
    //         .map(staff => staff.id);

    //     console.log('Selected Staff IDs:', this.selectedStaffIds);
    //     this.listenForOutsideClick = false;
    // }
    // handleSelectAll(event) {

    //     const checked = event.target.checked;
    //     let alreadyAssignedCount = 0;
    //     this.staffList = this.staffList.map(staff => {

    //         if (checked && staff.alreadyAssigned) {
    //             alreadyAssignedCount++;

    //             return {
    //                 ...staff,
    //                 selected: checked,
    //                 showAssignedTemplate: true
    //             };
    //         }

    //         return {
    //             ...staff,
    //             selected: checked,
    //             showAssignedTemplate: false
    //         };
    //     });

    //    // this.errorMessage = localError;
    //     if (alreadyAssignedCount > 0) {
    //         this.errorMessage =
    //             `${alreadyAssignedCount} staff already have template assigned.`;
    //     } else {
    //         this.errorMessage = '';
    //     }

    //     this.selectedStaffIds = this.staffList
    //         .filter(staff => staff.selected)
    //         .map(staff => staff.id);
    //     console.log('Already assigned count:', alreadyAssignedCount);
    //     console.log('Selected Staff IDs:', this.selectedStaffIds);
    // }
    handleSelectAll(event) {

        const checked = event.target.checked;

        this.staffList = this.staffList.map(staff => {

            // Case 1: Already Assigned → ALWAYS selected & shown
            if (staff.alreadyAssigned) {
                return {
                    ...staff,
                    selected: true,               // always true
                    showAssignedTemplate: true    // always true
                };
            }

            // Case 2: Not assigned
            return {
                ...staff,
                selected: checked,               // depends on select-all
                showAssignedTemplate: false
            };
        });

        // Count assigned staff separately
        const alreadyAssignedCount = this.staffList.filter(
            staff => staff.alreadyAssigned
        ).length;

        this.errorMessage =
            alreadyAssignedCount > 0
                ? `${alreadyAssignedCount} staff already have template assigned.`
                : '';

        // Selected IDs
        this.selectedStaffIds = this.staffList
            .filter(staff => staff.selected && !staff.alreadyAssigned)
            .map(staff => staff.id);

        console.log('Already assigned count:', alreadyAssignedCount);
        console.log('Selected Staff IDs:', this.selectedStaffIds);
    }
    // handleStaffSelection(event) {

    //     const staffId = event.target.dataset.id;
    //     const checked = event.target.checked;

    //     this.staffList = this.staffList.map(staff => {
    //         if (staff.id === staffId) {
    //             if (staff.alreadyAssigned && checked) {

    //                 this.errorMessage = 
    //                     `Note: ${staff.name} already has a template assigned.`;

    //             } else {
    //                 this.errorMessage = '';
    //             }
    //             return { ...staff, selected: checked };
    //         }
    //         return staff;
    //     });
    //      this.selectedStaffIds = this.staffList
    //         .filter(staff => staff.selected)
    //         .map(staff => staff.id);

    //     console.log('Selected Staff IDs:', this.selectedStaffIds);
    //     this.listenForOutsideClick = false;

    // }
   
    handleStaffSelection(event) {

        const staffId = event.target.dataset.id;
        const checked = event.target.checked;
        this.staffList = this.staffList.map(staff => {
            if (staff.id === staffId) {
                //  If already assigned and trying to select
                if (checked && staff.alreadyAssigned) {
                    return {
                        ...staff,
                        selected: false,          
                        showAssignedTemplate: true 
                    };
                }
                return {
                    ...staff,
                    selected: checked,
                    showAssignedTemplate: false
                };
            }
            return staff;
        });
        this.staffList = [...this.staffList];
        const assignedCount = this.staffList.filter(
            staff => staff.showAssignedTemplate
        ).length;

        if (assignedCount === 1) {

            const assignedStaff = this.staffList.find(
                staff => staff.showAssignedTemplate
            );

            this.errorMessage =
                `${assignedStaff.name} already has template: ${assignedStaff.assignedTemplateName}`;

        } else if (assignedCount > 1) {

            this.errorMessage =
                `${assignedCount} staff already have templates assigned.`;

        } else {

            this.errorMessage = '';
        }

        // Update valid selected staff
        this.selectedStaffIds = this.staffList
            .filter(staff => staff.selected && !staff.alreadyAssigned)
            .map(staff => staff.id);
    }

   
    handleApplyTemplateClose(){
         this.isApplyTemplate = false;
    }
    // handleApplyTemplateToStaff(event){
    //     const templateId = event.currentTarget.dataset.id;
    //     console.log('Selected Template Id:', templateId);
    //     //this.selectedTemplateId = templateId;
    //     this.savePMSRoleTemplate(templateId);
    //     console.log('selectedRolesLabelInApply :', this.selectedRolesLabelInApply);
    //     if (!this.staffList || this.staffList.length === 0) {
           
    //         this.showToast('Error', 'No staff available to apply template.', 'error');
    //         return;
    //     }
    //     if (!this.selectedStaffIds || this.selectedStaffIds.length === 0) {
           
    //          this.showToast('Error', 'Please select at least one staff member.', 'error');
    //         return;
    //     }

    //     console.log('Template ID:', this.selectedTemplateId);
    //     console.log('Staff IDs:', this.selectedStaffIds);
       
      
         
    //     applyTemplateToStaff({
    //         templateId: this.selectedTemplateId,
    //         staffIds: this.selectedStaffIds,
    //         effectiveDate: this.effectiveDate,
    //         roles: this.selectedRolesLabelInApply
    //     })
    //     .then(() => {

    //         console.log('Template applied successfully');

    //         this.isApplyTemplate = false;

    //     })
    //     .catch(error => {
    //         console.error('Error applying template:', error);
    //     });

    // }
    async handleApplyTemplateToStaff(event) {

        try {

            const baseTemplateId = event.currentTarget.dataset.id;
            console.log('Base Template Id:', baseTemplateId);

            if (!this.selectedStaffIds || this.selectedStaffIds.length === 0) {
                this.showToast('Error', 'Please select at least one staff member.', 'error');
                return;
            }

            const newTemplateId = await createRoleTemplateFromBase({
                baseTemplateId: baseTemplateId
            });

            console.log('New Role Template Id:', newTemplateId);

            await applyTemplateToStaff({
                templateId: newTemplateId,
                staffIds: this.selectedStaffIds,
                effectiveDate: this.effectiveDate,
                roles: this.selectedRolesLabelInApply
            });

            console.log('Template applied successfully');
            this.showToast('Success', 'Template applied successfully', 'success');

            this.isApplyTemplate = false;

        } catch (error) {
            console.error('Error:', error);
            this.showToast('Error', 'Something went wrong', 'error');
        }
    }

    // savePMSRoleTemplate(templateId) {
    //     console.log('Saving from Base Template...');

    //     createRoleTemplateFromBase({
    //         baseTemplateId: templateId
    //     })
    //     .then(newTemplateId => {
    //         console.log('New Role Template Created:', newTemplateId);
    //         this.selectedTemplateId = newTemplateId;
    //         this.showToast('Success', 'Template Created Successfully', 'success');
    //     })
    //     .catch(error => {
    //         console.error(error);
    //     });
    // }
    handleSearchStaff(event) {

        const searchKey = (event.target.value || '').toLowerCase().trim();
        this.searchStaff = searchKey;

        console.log('🔎 Searching:', searchKey);

        let dataToUse = [];

        if (!searchKey) {
            dataToUse = this.originalStaffResult;
        } else {
            dataToUse = this.originalStaffResult.filter(staff => {

                const name = (staff.Display_Nickname__c || staff.Name || '').toLowerCase();
                const email = (staff.Email_Address__c || '').toLowerCase();
                const role = (staff.Role__c || '').toLowerCase();

                return (
                    name.includes(searchKey) ||
                    email.includes(searchKey) ||
                    role.includes(searchKey)
                );
            });

            console.log('Filtered count:', dataToUse.length);
        }

        //  Map once using reusable method
        this.staffList = dataToUse.map(p => this.mapStaff(p));
        this.staffCount = this.staffList.length;

        console.log('Updated staffList:', JSON.stringify(this.staffList));
    }
   
   
    handleCreateReviewCycle(){
        this.isHome=false;
        //this.isCreateTemplate=false;    
        this.isCreateReviewCycle=true;  
        this.showRcCancel=true;
        this.showRcNext=true;
        this.showRcPrevious=false;
        this.showRcSave=false;
        this.rcCurrentStep = 'rcStep1';
    }
    handleRcChange(event) {

    // const { name, value } = event.target;
        const fieldName = event.target.name;
        const value =event.target.value;

         if (event.target.type === 'date') {

            const inputField = event.target;

            // Let Salesforce validate first
            if (!inputField.checkValidity()) {

                // If error is because of min/max range
                if (inputField.validity.rangeUnderflow || 
                    inputField.validity.rangeOverflow) {

                    // Show default Salesforce message
                    inputField.reportValidity();

                    // Clear value immediately
                    inputField.value = null;
                    this[fieldName] = null;

                    return;
                }
            }
        }
    
        switch (fieldName) {

            case 'cycleName':
                this.cycleName = value;
                break;

            case 'selectedCycleType':
                this.selectedCycleType = value;
                break;

            case 'cycleStartDate':
                this.cycleStartDate = value;
                break;

            case 'cycleEndDate':
                this.cycleEndDate = value;
                break;

            case 'cycleLockDate':
                this.cycleLockDate = value;
                break;

            case 'cycleDescription':
                this.cycleDescription = value;
                break;

            // ===== SELF REVIEW =====
            case 'selfStartDate':
                this.selfStartDate = value;
                break;

            case 'selfEndDate':
                this.selfEndDate = value;
                break;

            case 'selfLockDate':
                this.selfLockDate = value;
                break;

            // ===== MANAGER REVIEW =====
            case 'managerStartDate':
                this.managerStartDate = value;
                break;

            case 'managerEndDate':
                this.managerEndDate = value;
                break;

            case 'managerLockDate':
                this.managerLockDate = value;
                break;

            // ===== HR REVIEW =====
            case 'hrStartDate':
                this.hrStartDate = value;
                break;

            case 'hrEndDate':
                this.hrEndDate = value;
                break;

            case 'hrLockDate':
                this.hrLockDate = value;
                break;
            
            case 'selectedCycleTemplate':
                this.selectedCycleTemplate = value;
                console.log('selectedCycleTemplate:', this.selectedCycleTemplate);
               
                this.loadTemplateStaffById();
                break;

            default:
                break;
        }
    }
    get selfStartMin() {
        return this.cycleStartDate;
    }

    get selfStartMax() {
        return this.cycleEndDate;
    }

    // Self End must be >= Self Start and within Cycle
    get selfEndMin() {
        return this.selfStartDate || this.cycleStartDate;
    }

    get selfEndMax() {
        return this.cycleEndDate;
    }

    // Manager Start must be AFTER Self End
    get managerStartMin() {
        return this.selfEndDate || this.cycleStartDate;
    }

    get managerStartMax() {
        return this.cycleEndDate;
    }

    // Manager End must be >= Manager Start
    get managerEndMin() {
        return this.managerStartDate || this.managerStartMin;
    }

    get managerEndMax() {
        return this.cycleEndDate;
    }

    // HR Start must be AFTER Manager End
    get hrStartMin() {
        return this.managerEndDate || this.cycleStartDate;
    }

    get hrStartMax() {
        return this.cycleEndDate;
    }

    // HR End must be >= HR Start
    get hrEndMin() {
        return this.hrStartDate || this.hrStartMin;
    }

    get hrEndMax() {
        return this.cycleEndDate;
    }
    cancelCreateReviewCycle(){
        this.isHome=false;
        this.isCreateReviewCycle=false;
        this.isManageTemplates=false;
        this.isReviewCycle=true; 
        this.clearCreateReviewCycleFields();
    }
    handleRcNext() {

        switch (this.rcCurrentStep) {

            case 'rcStep1':
              
                if (this.isRequiredRcFieldsEmpty()) {
                    this.showToast('Error', 'Please fill all required Cycle  Details fields.', 'error');
                    return;
                }
                this.rcCurrentStep = 'rcStep2';
                this.showRcPrevious=true;
                this.showRcNext=true;
                this.showRcCancel=false;
                this.showRcSave=false;
                console.log(' this.selectedFacilityId  in rc next', this.selectedFacilityId);
                if ( this.selectedFacilityId) {
                    //facilityIds.push( this.selectedFacilityId);
                    this.loadstaffList();
                    this.loadRoleTemplates();
            
                }
                console.log('this.roleTemplateList  in rc next', JSON.stringify(this.roleTemplateList));
               
                break;

            case 'rcStep2':
                 if(this.selectedTemplateIds.length === 0){
                    this.showToast('Error', 'Please select atleast one template.', 'error');
                    return;
                }
                this.rcCurrentStep = 'rcStep3';
                this.showRcPrevious=true;
                this.showRcNext=false;
                this.showRcCancel=true;
                this.showRcSave=true;
               
                break;

            // case 'rcStep3':
            //     // if (this.isRequiredOkrFieldsEmpty() && this.okrList.length === 0) {
            //     //     this.showToast('Error', 'Please fill all required OKR fields.', 'error');
            //     //     return;
            //     // }
                
            //     this.rcCurrentStep = 'rcStep4';
            //     this.showRcPrevious = true;
            //     this.showRcNext = false;
            //     this.showRcCancel = false;
            //     this.showRcSave = true;
               
            //     break;

            default:
                break;
        }
    }
    handleRcPrevious() {

        switch (this.rcCurrentStep) {

            case 'rcStep2':
                this.rcCurrentStep = 'rcStep1';
                this.showRcPrevious=false;
                this.showRcNext=true;
                this.showRcCancel=true;
                this.showRcSave=false;
                
                break;
            case 'rcStep3':
                this.rcCurrentStep = 'rcStep2';
                this.showRcPrevious=true;
                this.showRcNext=true;
                this.showRcCancel=false;
                this.showRcSave=false;
               
                break;
            // case 'rcStep4':
            //     this.rcCurrentStep = 'rcStep3';
            //     this.showRcPrevious=true;
            //     this.showRcNext=true;
            //     this.showRcCancel=false;
            //     this.showRcSave=false;
            
            //     break;
            default:
                break;
        }
    }
    isRequiredRcFieldsEmpty() {
        return !this.cycleName ||
            !this.selectedCycleType ||
            !this.cycleStartDate ||
            !this.cycleEndDate ||
            !this.cycleLockDate ||
            !this.selfStartDate ||
            !this.selfEndDate ||
            !this.selfLockDate ||
            !this.managerStartDate ||
            !this.managerEndDate ||
            !this.managerLockDate ||
            !this.hrStartDate ||
            !this.hrEndDate ||
            !this.hrLockDate;
    }
    handleRcTemplateCheckSelection(event) {

        const templateId = event.target.dataset.id;
        const checked = event.target.checked;

        this.roleTemplateList = this.roleTemplateList.map(template => {

            if (template.Id === templateId) {
                return { ...template, selected: checked };
            }

            return template;
        });

        // Update selected template IDs
        this.selectedTemplateIds = this.roleTemplateList
            .filter(t => t.selected)
            .map(t => t.Id);

         this.cycleTemplatesOptions = this.roleTemplateList
            .filter(template => this.selectedTemplateIds.includes(template.Id))
            .map(template => ({
                label: template.Role_Title__c, 
                value: template.Id,
                roleValue: template.Role__c
        }));
        this.templateRcRoleNames = this.cycleTemplatesOptions
            .map(option => option.roleValue)
            .join(', ');

        console.log('this.cycleTemplatesOptions', JSON.stringify(this.cycleTemplatesOptions));
        this.calculateSelectedStaffCount();
    }

    calculateSelectedStaffCount() {

        this.selectedStaffCount = this.roleTemplateList
            .filter(t => t.selected)
            .reduce((sum, t) => sum + t.staffCount, 0);
    }
    loadTemplateStaffById() {
        if (!this.selectedCycleTemplate) {
           // this.showToast('Error', 'Please select a facility.', 'error');
            return;
        }
        getStaffsByTemplateId({ templateId: this.selectedCycleTemplate })
            .then(result => {

                console.log('TemplateStaffDetails:', result);
                //this.selectedTemplateStaffDetail = result[0];
                this.templateStaffList = result.map(staff => ({
                    id: staff.id,
                    name: staff.name,
                    role: staff.role || '',
                    managerName: staff.managerName || '',
                    managerRole: staff.managerRole || ''
                }));

            console.log('Formatted Template Staff:', JSON.stringify(this.templateStaffList));
               
            })
            .catch(error => {

                console.error('Error loading template:', error);

            })
            
    }
    handleBackManageTemplates(){
        this.isHome = true;
        this.isManageTemplates = false;
        this.isApplyTemplate = false;
        this.isReviewCycle = false;
        this.isPerformanceReview = false;
        this.isComingSoon = false;   
    }
    handleBackReviewCycle(){
        this.isHome = true;
        this.isManageTemplates = false;
        this.isReviewCycle = false;
        this.isPerformanceReview = false;
        this.isComingSoon = false;   
    }
    handleCoaching(){
        this.isHome=false;
        this.isManageTemplates=false;    
        this.isReviewCycle=false; 
        this.isPerformanceReview=false;  
        this.isComingSoon = true;         
    
    }
    handleBack(){
        this.isHome=true;
        this.isManageTemplates=false;    
        this.isReviewCycle=false; 
        this.isPerformanceReview=false;  
        this.isComingSoon = false;   
    }
    handlePIPs(){
        this.isHome=false;
        this.isManageTemplates=false;    
        this.isReviewCycle=false; 
        this.isPerformanceReview=false;  
        this.isComingSoon = true;     
    }
    handlePerformanceReviews(){
        this.isHome=false;
        this.isReviewCycle=false; 
        this.isManageTemplates=false; 
        // this.isPerformanceReview=true;   
        this.isComingSoon = true;   
    }
    handleReviewCycle(){
        this.isHome=false;
        this.isManageTemplates=false;    
        this.isReviewCycle=true; 
        this.isPerformanceReview=false;  
        // this.isReviewCycle=false; 
        // this.isComingSoon = true;  
        this.loadReviewCycles();
        if ( this.selectedFacilityId) {
             this.loadReviewCycles();
        }
                
    }
    handleRcSave() {
        if (this.isRequiredRcFieldsEmpty()) {
            this.showToast('Error', 'Please fill all required fields.', 'error');
            return;
        }
        console.log('this.selectedFacilityId in save rc ', this.selectedFacilityId);
        console.log('this.selectedFacilityName in save rc', this.selectedFacilityName);
        console.log('this.selectedStaffCount in save rc', this.selectedStaffCount);
        console.log('this.selectedTemplateIds in save rc', this.selectedTemplateIds);

        const finalPayload = {
            
            cycleName: this.cycleName,
            cycleType: this.selectedCycleType,
            facilityId: this.selectedFacilityId,
            facilityName:this.selectedFacilityName,
            cycleStartDate: this.cycleStartDate,
            cycleEndDate: this.cycleEndDate,
            cycleLockDate: this.cycleLockDate,
            cycleDescription: this.cycleDescription,

            selfStartDate: this.selfStartDate,
            selfEndDate: this.selfEndDate,
            selfLockDate: this.selfLockDate,

            managerStartDate: this.managerStartDate,
            managerEndDate: this.managerEndDate,
            managerLockDate: this.managerLockDate,

            hrStartDate: this.hrStartDate,
            hrEndDate: this.hrEndDate,
            hrLockDate: this.hrLockDate,
            staffCount:this.selectedStaffCount,

            selectedTemplateIds: this.selectedTemplateIds,
          
        };

        console.log('Final Save Payload:', JSON.stringify(finalPayload));

        saveFullReviewCycle({ data: finalPayload })
            .then(() => {
                console.log('Saved Successfully');
                this.loadReviewCycles();
                this.isCreateReviewCycle = false;
                this.isReviewCycle=true; 
                this.showToast('Success', 'Review Cycle Created Successfully.', 'success');
                
            })
            .catch(error => {
                console.error(error);
            });
    }
    loadReviewCycles() {
        getReviewCycles({ facilityId: this.selectedFacilityId })
            .then(result => {

                this.reviewCycleList = result.map(rc => {
                    return {
                        Id: rc.Id,
                        reviewCycleName: rc.Name,
                        reviewCycleDescription: rc.Description__c,
                        startDate: rc.Cycle_Start_Date__c,
                        endDate: rc.Cycle_End_Date__c,
                        lockDate: rc.Cycle_Lock_Date__c,
                        staffCount:rc.Staff_Count__c
                        // appliedRoles: rc.PMS_Role_Templates__r
                        //     ? rc.PMS_Role_Templates__r.length + ' Roles'
                        //     : '0 Roles'
                    };
                });

                // Counts
                this.activeCyclesCount = result.length;

                this.roleTemplatesCount = result.reduce((total, rc) => {
                    return total + (rc.PMS_Role_Templates__r
                        ? rc.PMS_Role_Templates__r.length
                        : 0);
                }, 0);

                // this.reviewCycleStaffCount = result.length;
                this.reviewCycleStaffCount = result.reduce((total, rc) => {
                    return total + (rc.Staff_Count__c ? rc.Staff_Count__c : 0);
                }, 0);


            })
            .catch(error => {
                console.error('Error fetching cycles:', error);
            });
    }
    loadRoleTemplates() {
        if (!this.selectedFacilityId) {
           // this.showToast('Error', 'Please select a facility.', 'error');
            return;
        }
        getRoleTemplatesByFacility({ facilityId: this.selectedFacilityId })
            .then(result => {

                console.log('Templates:', result);
               //  this.templateList = result;
            //    this.templateList = result.map(item => ({
            //         ...item,
            //         kpiCount: item.PMS_KPIs__r ? item.PMS_KPIs__r.length : 0,
            //         okrCount: item.PMS_OKRs__r ? item.PMS_OKRs__r.length : 0,
            //         competencyCount: item.PMS_Competencies__r ? item.PMS_Competencies__r.length : 0
            //     }));
                this.allRoleTemplates = result.map(item => {

                    const permissionCount =
                        (item.Self_Review__c ? 1 : 0) +
                        (item.Manager_Review__c ? 1 : 0) +
                        (item.Goals_Permission__c ? 1 : 0);

                    return {
                        ...item,
                        roleTitle: item.Role_Title__c  || '',
                        appliedRoles:item.Role__c ||'',
                        description: item.Template_Description__c || '',
                        kpiCount: item.PMS_KPIs__r ? item.PMS_KPIs__r.length : 0,
                        okrCount: item.PMS_OKRs__r? item.PMS_OKRs__r.length : 0,
                        competencyCount: item.PMS_Competencies__r ? item.PMS_Competencies__r.length : 0,
                        permissionCount: permissionCount,
                        staffCount: item.Staffs__r ? item.Staffs__r.length : 0,
                    };
                });
                 this.roleTemplateList = [...this.allRoleTemplates];
                // console.log('this.templateList ', JSON.stringify(this.templateList));
                 console.log('this.allRoleTemplates ', JSON.stringify(this.allRoleTemplates));
            })
            .catch(error => {
                console.error('Error loading templates:', error);
            });
    }
    clearCreateReviewCycleFields(){
        this.cycleName = null;
        this.selectedCycleType = null;
        this.cycleStartDate = null;
        this.cycleEndDate = null;
        this.cycleLockDate = null;
        this.cycleDescription = null;

        this.selfStartDate = null;
        this.selfEndDate = null;
        this.selfLockDate = null;

        this.managerStartDate = null;
        this.managerEndDate = null;
        this.managerLockDate = null;

        this.hrStartDate = null;
        this.hrEndDate = null;
        this.hrLockDate = null;

        this.selectedTemplateIds=[]; 
        this.selectedCycleTemplate=null;
      }

    

}