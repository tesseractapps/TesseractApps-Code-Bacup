import { LightningElement,wire,api,track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import UserNameFld from '@salesforce/schema/User.Name';
import UserEmail from '@salesforce/schema/User.Email';
import UserFirstName from '@salesforce/schema/User.FirstName';
import UserLastName from '@salesforce/schema/User.LastName';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import userOrgName from '@salesforce/schema/User.Organization_Name__c';
import { deleteRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import LightningConfirm from 'lightning/confirm';
import { NavigationMixin } from 'lightning/navigation';

import redirectToWyzedSSO from '@salesforce/apex/WyzedIntegrationHandler.redirectToWyzedSSO';
import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';
import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";
import getCoursesRaw from '@salesforce/apex/WyzedAuthService.getCoursesRaw';
import loadWyzedAndStaffData from '@salesforce/apex/WyzedAuthService.loadWyzedAndStaffData';
import upsertTrainings from '@salesforce/apex/HRTraining.upsertTrainings';
import getTrainings from '@salesforce/apex/HRTraining.getTrainings';
import getFacilityCurrentUser from '@salesforce/apex/PortalUserController.getFacilityCurrentUser';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import getRoleOptionsByFacility from '@salesforce/apex/StaffController.getRoleOptionsByFacility';
import upsertFacilityCompliance from '@salesforce/apex/HRTraining.upsertFacilityCompliance';
import getFacilityComplianceByTraining from '@salesforce/apex/HRTraining.getFacilityComplianceByTraining';
import updateTrainingToggle from '@salesforce/apex/HRTraining.updateTrainingToggle';
import createLearnerMinimal from '@salesforce/apex/WyzedAuthService.createLearnerMinimal';
import updateWyzedId from '@salesforce/apex/WyzedAuthService.updateWyzedId';
import isStartPlan from '@salesforce/apex/LimitCheckService.isStartPlan';
import getStaffByFacilityAndRoles from '@salesforce/apex/WyzedCourseProgressBatch.getStaffByFacilityAndRoles';
import assignSingleCourseToMultipleUsers from '@salesforce/apex/WyzedCourseProgressBatch.assignSingleCourseToMultipleUsers';


const fields = [UsrRoleName,userOrgName];

export default class TesseractAppsWyzedTraining extends NavigationMixin(LightningElement) {
    recordsPerPage = 10;
    isPageSizeManuallySet = false;
    resizeObserver;
    totalPages = 1;

 @track activeTab='training';
 @api orgid;
 @api hrflag;
 @track currentUser;
    @track currentUserEmail;
    @track currentUserRole
    @track usererror;
    @track userOrgName;
    @track OrgName;
 
     @track showLoadingSpinner = false;
   
     @track isHome=true;

     @track individualstaffflag=false;
     activeSections = ['CreateTraining', 'StaffTrainingStatus'];
     @track TodayDate=null;
     @track AdminUserEmail;
     @track AdminUserFirstName;
     @track AdminUserlastName;
     @track noRecordsFlag=false;
     @track noRecordsFlag1=false;
     @track noRecordsFlag2=false;
     @track fieldErrorMap = {};
     @track successmessage;
     @track DeleteFlag;
     @track facilityPreferredName;
     @track participantPreferredName;
     @track staffPreferredName;
     
     @track learnerAllRecords = [];   // 🔥 full dataset (from Apex)
     @track learners = [];            // 🔥 paginated data (UI)
 
     @track learnerTotalRecords = 0;
     @track learnerPageSize = 10;
     @track learnerTotalPages;
     @track learnerPageNumber = 1;
 
 
 
     @track myAllCourseRecords = [];
 
     // 🔥 PAGINATED DATA (UI)
     @track myCompletedCourses = [];
 
     // 🔥 PAGINATION CONFIG
     
     @track myPageSize = 10;
     @track myPageNumber = 1;
     @track myTotalRecords = 0;
     @track myTotalPages = 0;
     @track noRecordsFlag = false;

    adminTrainingList = [];
    pageSize = 10;
    pageNumber = 1;
    
    mandatoryCount = 0;
    visibleCount = 0;
    renewalCount = 0;
    totalTrainings = 0;
    @track modalTitle='';
    @track showModal =false;
    @track facilityOptions=[];
    @track allPageSize = 10;
    @track allCurrentPage = 1;
    @track allTotalRecords = 0;
    @track allTotalPages = 0;
    @track paginatedStaffList = [];
    @track showRoleModal = false;
    @track selectedRole = 'ADMIN'; // default
    @track pendingUser = {}; // store clicked row data

    categoryOptions = [
        { label: 'Professional Development', value: 'Professional Development' },
        { label: 'Induction', value: 'Induction' },
        { label: 'Safety', value: 'Safety' },
        { label: 'Clinical Skills', value: 'Clinical Skills' },
        { label: 'Behaviour Support', value: 'Behaviour Support' },
        { label: 'Emergency Management', value: 'Emergency Management' },
        { label: 'Human Rights & Ethics', value: 'Human Rights & Ethics' },
        { label: 'Specialized Care', value: 'Specialized Care' },
        { label: 'Technology & Systems', value: 'Technology & Systems' },
        { label: 'Policy Awareness', value: 'Policy Awareness' },
        { label: 'Cultural Competency', value: 'Cultural Competency' }
    ];
        validForOptions = [
        { label: '6 months', value: '6 months' },
        { label: '12 months', value: '12 months' },
        { label: '24 months', value: '24 months' },
        { label: '36 months', value: '36 months' }
    ];

    @track editingDoc = {
        name: '',
        category: '',
        validFor: '',
        roles: [],
        mandatory: false,
        visibleToStaff: false,
        renewalRequired: false,
        notes: '',
        id:''
    };

    @track facilityPreferredName;
    @track selectedRoleValueLabels;
    @track roleoptionsforFacility;
    @track selctedMultipleFcailityValues;
    @track isEditMode = false;

    @track showConfirmModal = false;

    pendingToggle = {
        trainingId: null,
        field: null,
        value: null,
        element: null
    };
    
    @track matchedCount;
    @track onlyInWyzedCount;
    @track onlyInSystemCount;
    @track totalCount;
    @track allStaff = true;
    @track matchedStaff = false;
    @track systemStaff = false;
    @track wyzedStaff = false;
    staffList = [];
    wyzedUsers = [];

    // Final arrays
   // 🔹 Master + Segments
    allUsersCombined = [];
    syncedUsers = [];
    systemOnlyUsers = [];
    wyzedOnlyUsers = [];

    // 🔹 Active View (what table shows)
    filteredList = [];

    // 🔹 Counts
    totalCount = 0;
    matchedCount = 0;
    onlyInSystemCount = 0;
    onlyInWyzedCount = 0;

    // 🔹 Tile flags (UI highlight)
    allStaff = true;
    matchedStaff = false;
    systemStaff = false;
    wyzedStaff = false;
    createStaff = false;

    staffFirstName;
    staffLastName;
    staffEmail;
    staffWyzedId;
    showSpinner=false;
    @track isHome=false;
    @track showUpgradeModal=false;
    @track showAssignStaffModal = false;
    @track filteredStaffList = [];
    @track selectedStaffIds = [];
    @track selectedWyzedUserIds = [];

    selectedCourseId;
    selectedCourseOwnerUserId;


     tLogoUrl = `${Loading_Logo}/TLogo.png`;
     tImageUrl = `${Loading_Logo}/T.png`;
 
     get logoUrl() {
         return this.tLogoUrl;
     }
 
     get imageUrl() {
         return this.tImageUrl;
     }
    async  connectedCallback() {
            this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Facility";
            
             try {
            const isStart = await isStartPlan();

            // 🔴 BLOCK ENTIRE MODULE
            if (isStart ) {
                console.log('🚫 Start plan → block training  module');
                this.showUpgradeModal = true; 

                // ❗ STOP EVERYTHING
                this.isHome = false;
            

                return;
            }
        

            } catch (error) {
                console.error('Error checking plan:', error);
                return;
            } 

           this.isHome=true;

     }

    
 
     @wire(getRecord, { recordId: Id, fields: [UsrRoleName,userOrgName,UserEmail,UserFirstName,UserLastName]}) 
     currentUserInfo({error, data}) {
         if (data) {
             console.log('WIRE DATA '+JSON.stringify(data));
            this.currentUserRole =data.fields.User_Role__c.value;
            console.log(' hr  falgs '+ this.hrFlag);
            this.AdminUserEmail=data.fields.Email.value;
            this.AdminUserFirstName=data.fields.FirstName.value;
            this.AdminUserlastName=data.fields.LastName.value;
            this.OrgName=data.fields.Organization_Name__c.value;
            
             if( this.currentUserRole == 'Portal Account Partner Executive'  ||this.currentUserRole == 'Portal Account Partner Manager'|| this.currentUserRole == 'CEO' || this.currentUserRole == 'Admin' ){
                this.isStaffVisible=true;
                /* this.activeSections = ['CreateTraining']; */ 
                this.individualstaffflag=false;
                this.loadTrainings(1); 
              //  this.loadLearnerData();
                console.log(' admin  falgs '+ this.currentUserRole);
                console.log(' admin  falgs '+ this.isStaffVisible);
                console.log(' visible   falgs '+ this.individualstaffflag);

                   getCurrentLoggedUserInfo()
                          .then(userData => {
                              console.log('user data ==>' + JSON.stringify(userData));
          
                              let userType = userData.User_Type__c;
          
                              if (userType == 'NDIS Org Admin' || userType == 'ICT Admin') {
          
                                  return getFacilityData().then(response => {
                                      //console.log('Facility data fetched successfully:', response);
          
                                      this.facilityOptions = response.map(record => ({
                                          label: record.Name,
                                          value: record.Id,
                                      }));
        
                                  });
          
                              } else if (userType == 'Facility Admin' || userType == 'HR Admin' || userType == 'Roster Manager') {
          
                                  return getFacilityCurrentUser().then(result => {
                                      console.log('getFacilityCurrentUser facility ' + JSON.stringify(result));
          
                                      this.facilityOptions = result.map(record => ({
                                          label: record.Facility__r.Name,
                                          value: record.Facility__r.Id
                                      }));
                                  });
                              }
                          })
                          .catch(error => {
                              console.error('Error:', error);
                          });

                          
                           this.loadAllData();
                              
                     }  else{ 
                                    this.individualstaffflag=true;
                                
                    
                                }
            
         }
        
      else if (error) {
         this.error = error ;
     }
     
     } 

    loadAllData() {

    this.showSpinner = true;

    loadWyzedAndStaffData()

    .then(result => {

        this.staffList =
            result.staffList || [];

        this.wyzedUsers =
            (result.wyzedUsers || [])
            .filter(u => u && u.id);

        console.log(
            '✅ Staff:',
            JSON.stringify(this.staffList)
        );

        console.log(
            '✅ Wyzed:',
            JSON.stringify(this.wyzedUsers)
        );

        // 🔥 NO CHANGE NEEDED
        this.processUserComparison();

        this.showSpinner = false;
    })

    .catch(error => {

        this.showSpinner = false;

        console.error(
            '❌ Error:',
            JSON.stringify(error)
        );
    });
}
        

     processUserComparison() {

    const staffMap = new Map();
    const wyzedMap = new Map();

    this.syncedUsers = [];
    this.systemOnlyUsers = [];
    this.wyzedOnlyUsers = [];
    this.allUsersCombined = [];

    // Build maps
    this.staffList.forEach(staff => {
        if (staff.Wyzed_User_Id__c) {
            staffMap.set(String(staff.Wyzed_User_Id__c), staff);
        }
    });

    this.wyzedUsers.forEach(user => {
        wyzedMap.set(String(user.id), user);
    });

    // 🔹 SYSTEM USERS
    this.staffList.forEach(staff => {

        const wyzedId = String(staff.Wyzed_User_Id__c);

        if (wyzedId && wyzedMap.has(wyzedId)) {

            const record = {
                id: staff.Id,
                name: staff.NameToDisplay__c,
                email: staff.Email_Address__c,
                phone: staff.Contact_Number__c, 
                photoUrl: staff.Picture__c,
                firstname:staff.Name,
                lastname:staff.Last_Name__c,
                statusLabel: 'Synced',
                statusClass: 'slds-theme_success',
                showWyzedButton: false,
                showSystemButton: false,
                showAllSet: true,
                typeOfUser:staff.Wyzed_Learner__c ==true ?'Learner':'Admin',

            };

            this.syncedUsers.push(record);
            this.allUsersCombined.push(record);

        } else {

            const record = {
                id: staff.Id,
                name: staff.NameToDisplay__c,
                email: staff.Email_Address__c,
                phone: staff.Contact_Number__c, 
                firstname:staff.Name,
                lastname:staff.Last_Name__c,
                 photoUrl: staff.Picture__c,
                statusLabel: 'Not Synced',
                statusClass: 'slds-theme_warning',
                showWyzedButton: true,
                showSystemButton: false,
                showAllSet: false
            };

            this.systemOnlyUsers.push(record);
            this.allUsersCombined.push(record);
        }
    });

    // 🔹 WYZED ONLY
    this.wyzedUsers.forEach(user => {

        const id = String(user.id);

        if (!staffMap.has(id)) {

            const record = {
                id: user.id,
                name: user.firstname +' '+user.surname || 'Wyzed User',
                email: user.email,
                phone: user.phone_number,
                firstname:user.firstname,
                lastname:user.surname, 
                photoUrl: user.SmallPhotoUrl,
                statusLabel: 'External Only',
                statusClass: 'slds-theme_error',
                showWyzedButton: false,
                showSystemButton: true,
                showAllSet: false
            };

            this.wyzedOnlyUsers.push(record);
            this.allUsersCombined.push(record);
        }
    });

    // 🔥 COUNTS
    this.totalCount = this.allUsersCombined.length;
    this.matchedCount = this.syncedUsers.length;
    this.onlyInSystemCount = this.systemOnlyUsers.length;
    this.onlyInWyzedCount = this.wyzedOnlyUsers.length;

    // 🔥 DEFAULT VIEW

     this.setActiveTile('ALL');
     this.applyFilters();
    this.initializeAllPagination();
}


    
  get showTraining() {
    return this.activeTab === "training";
  }

  get learnersDynamicClass() {
    return this.matchedStaff === true?'table-container slds-m-around_small learners-table-matched':'table-container slds-m-around_small learners-table';
  }

  get showLearners() {
    return this.activeTab === "learners";
  }

  get trainingTabClass() {
    return this.activeTab === "training" ? "menu-item1" : "menu-item";
  }

  get learnersTabClass() {
    return this.activeTab === "learners" ? "menu-item1" : "menu-item";
  }

  loadTrainings(pageNum) {
    getTrainings({ orgId: this.orgid })
        .then(res => {
            this.adminTrainingList = res.trainings || [];

            // ✅ Metrics from Apex
            this.mandatoryCount = res.mandatoryCount;
            this.visibleCount = res.visibleCount;
            this.renewalCount = res.renewalCount;
            this.totalTrainings = res.totalCount;

            this.pageNumber = pageNum;
            this.setPageSizeByZoomAndScreen();
        })
        .catch(error => {
            console.error(error);
        });
}

  // Pagination controls
    nextPage() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber++;
        }
    }

    previousPage() {
        if (this.pageNumber > 1) {
            this.pageNumber--;
        }
    }

    firstPage() {
        this.pageNumber = 1;
    }

    lastPage() {
        this.pageNumber = this.totalPages;
    }
    get bDisableFirst() {
        return this.pageNumber <= 1;
    }

    get bDisableLast() {
        return this.pageNumber >= this.totalPages;
    }

    get pagedList() {
        const start = (this.pageNumber - 1) * this.pageSize;
        return this.adminTrainingList.slice(start, start + this.pageSize);
    }
    
  handleTabChange(event) {
    const selectedTab = event.currentTarget.dataset.tab;
    this.activeTab = selectedTab;

    console.log("🔄 Tab changed to:", selectedTab);

    if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
    }

   /*  if(this.activeTab === "training"){
      this.allEntities = true;
      this.matchedEntity = false;
      this.systemEntity = false;
      this.xeroEntity = false;

    } else if(this.activeTab === "learners"){
      
    } */
   /*  this.dispatchEvent(
      new CustomEvent("tabchange", {
        detail: { activeTab: selectedTab }
      })
    ); */
  }

  handleSyncWyzedTrainings(){
     this.loadCourses();
  }

    navigateToWyzedAdmin(){
          console.log('AdminUserEmail '+ this.AdminUserEmail);
           console.log('AdminUserFirstName '+this.AdminUserFirstName);
            console.log('AdminUserlastName '+ this.AdminUserlastName);
            console.log('user id '+Id);
            let isAdmin=true;
            if(this.individualstaffflag){
               isAdmin =false;
            }
            
            
           redirectToWyzedSSO({ uid: Id, firstname: this.AdminUserFirstName, surname:this.AdminUserlastName, email: this.AdminUserEmail,isAdmin:isAdmin })
          .then((redirectUrl) => {
              console.log('redirect url '+redirectUrl);
              // Redirect the user to the URL returned from the Apex method
            //  window.location.href = redirectUrl;
                  this[NavigationMixin.GenerateUrl]({
                      type: 'standard__webPage',
                      attributes: {
                          url: redirectUrl
                      }
                  }).then(generatedUrl => {
                      window.open(generatedUrl, '_blank');
                  });
            
  
          })
          .catch((error) => {
    console.error('FULL ERROR:', JSON.stringify(error));

    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Error',
            message: error?.body?.message || 'Unknown error',
            variant: 'error'
        })
    );
}); 
      }

        loadCourses() {
               this.showSpinner = true;
              getCoursesRaw()
                  .then(result => {
                      const data = JSON.parse(result);
                       this.showSpinner = false;
                      console.log('FULL wyzed RESPONSE', JSON.stringify(data));
      
                      let modules = data.courses || [];
      
                      // ✅ Map courses → module structure
                     modules = modules.map(course => {
                    const createdDate = course.created_at 
                        ? new Date(course.created_at)
                        : null;

                    const dueAt = course?.due_date?.due_at 
                        ? new Date(course.due_date.due_at)
                        : null;

                    const renewalAt = course?.renewal?.renewal_at 
                        ? new Date(course.renewal.renewal_at)
                        : null;

                    return {
                        wyzedCourseId: course.id,
                        Name: course.name,

                        // Existing fields
                        module_name: this.capitalizeFirstLetter(course.name ?? ''),
                        description: this.capitalizeFirstLetter(course?.details?.description ?? ''),

                        // ✅ Created Date (Salesforce format YYYY-MM-DD)
                        startDate: createdDate 
                            ? createdDate.toISOString().split('T')[0] 
                            : null,

                        // ✅ Due Date (Salesforce format)
                        endDate: dueAt 
                            ? dueAt.toISOString().split('T')[0] 
                            : null,

                        // ✅ Renewal Enabled (Boolean)
                        renewalEnabled: course?.renewal?.is_enabled ?? false,

                        // ✅ Renewal Date
                        renewalDate: renewalAt 
                            ? renewalAt.toISOString().split('T')[0] 
                            : null,

                        // Optional display formats (for UI only)
                        startFormatted: createdDate 
                            ? createdDate.toLocaleDateString('en-GB') 
                            : '',

                        endFormatted: '',
                        courseOwnerId:course.user_id
                    };
                });

                 //     console.log('Mapped Modules (from courses):', JSON.stringify(modules));

                      upsertTrainings({ modulesJson: JSON.stringify(modules),orgId:this.orgid })
                            .then(res => {
                                console.log('Upsert Success', res);
                            })
                            .catch(err => {
                                console.error('Upsert Error', err);
                            });
                                        })
                  .catch(error => {
                       this.showSpinner = false;
                      console.error('ERROR:', error);
                  });
          }

           capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    handleEdit(event) {
        console.log('--- EDIT CLICK START ---');

        // Stop bubbling
        event.stopPropagation();
        this.selectedRoleValueLabels=[];
        // Get record id
        const id = event.currentTarget.dataset.id;

        // Find record
        const doc = this.adminTrainingList.find(d => d.id === id);
        console.log('Matched Record:', JSON.stringify(doc));

        if (!doc) {
            console.warn('No matching record found for id:', id);
            return;
        }

        // Set modal data
        this.modalTitle = "Edit Training";
        this.editingDoc = { ...doc };

        getFacilityComplianceByTraining({ trainingId: this.editingDoc.id })
            .then(result => {
                
                console.log('Child compliance records:', JSON.stringify(result));
                const facilityIds = [...new Set(result.map(r => r.Facility__c))];
                this.existingChildData = result;
                this.isEditMode = true;

                this.selctedMultipleFcailityValues = facilityIds;
                if(this.selctedMultipleFcailityValues.length){
                   this.fetchRoleOptions();
                }

                // Step 2 + 3 handled below

            })
            .catch(error => {
                console.error('Error fetching child records:', error);
            });


      //  console.log('Editing Doc:', JSON.stringify(this.editingDoc));

        // Open modal
        this.showModal = true;

        console.log('Modal Opened:', this.showModal);
        console.log('--- EDIT CLICK END ---');
    }

    handleModalChange(event) {
        const field = event.target.dataset.field;
        
        let value;
        if (event.target.type === 'toggle') {
            value = event.detail.checked;
        } else if (event.target.type === 'checkbox') {
            value = event.target.checked;
        } else {
            value = event.target.value;
        }
        
        this.editingDoc = {
            ...this.editingDoc,
            [field]: value
        };
    }

     closeModal() {
        this.showModal = false;
        this.isEditMode=false;

        this.selectedRoleValueLabels = [];
        this.selctedMultipleFcailityValues = [];
        this.existingChildData = null;

    }

        
    handleFacilityChange(event) {

        // ✅ Ignore search typing events
        if (!Array.isArray(event.detail.value)) {
            console.log('Ignored search event:', event.detail);
            return;
        }

        const selectedFacilityIds = event.detail.value || [];

        console.log('Selected Facilities:', selectedFacilityIds);
         this.selectedRoleValueLabels = [];

        // ✅ Store selected facilities
        this.selctedMultipleFcailityValues = [...selectedFacilityIds];

        // ✅ Fetch roles based on facilities
        this.fetchRoleOptions();
    }

    fetchRoleOptions() {

    // ✅ Preserve previously selected roles
    const prevSelectedRoles = this.selectedRoleValueLabels || [];

    getRoleOptionsByFacility({ facilityIdList: this.selctedMultipleFcailityValues })
        .then(result => {

          //  console.log('Role options received:', JSON.stringify(result));

            // ✅ Rebuild options
            this.roleoptionsforFacility = result.map((role, index) => {
                return {
                    id: index.toString(),
                    label: role.Role_Name__c,
                    value: role.Role_Name__c,
                    facilityValue: role.Facility__c,
                    facilityName: role.Facility__r.Name,
                    displaylabel: role.Role_Name__c + '-' + role.Facility__r.Name,
                    combinedValue: role.Role_Name__c + '|' + role.Facility__c
                };
            });

           // console.log('roleoptionsforFacility (enhanced):', JSON.stringify(this.roleoptionsforFacility));

         if (this.isEditMode && this.existingChildData) {

            // ✅ EDIT FLOW
            const selectedValues = [];

            this.existingChildData.forEach(child => {
                const roles = (child.Roles__c || '').split(';');

                roles.forEach(roleName => {
                    const match = this.roleoptionsforFacility.find(
                        r =>
                            r.label === roleName.trim() &&
                            r.facilityValue === child.Facility__c
                    );

                    if (match) {
                        selectedValues.push(match.combinedValue);
                    }
                });
            });

            this.selectedRoleValueLabels = selectedValues;

        } else {

            // ✅ CREATE FLOW
            this.selectedRoleValueLabels = this.roleoptionsforFacility
                .filter(role => prevSelectedRoles.includes(role.combinedValue))
                .map(role => role.combinedValue);
        }

          //  console.log('Restored selected roles:', JSON.stringify(this.selectedRoleValueLabels));

        })
        .catch(error => {
            console.error('Error fetching role options:', error);
        });
}

handleRolesChange(event) {

    const selectedValues = event.detail?.values || [];

    // ✅ Extract role + facilityId
    const parsed = selectedValues.map(val => {
        const [roleName, facilityId] = val.split('|');
        return { roleName, facilityId };
    });

    console.log('Parsed:', JSON.stringify(parsed));

    this.selectedRoleValueLabels = [...selectedValues];
}
buildFacilityRolePayload() {

    const parsed = (this.selectedRoleValueLabels || []).map(val => {
        const [roleName, facilityId] = val.split('|');
        return { roleName, facilityId };
    });

    const grouped = {};

    parsed.forEach(item => {

        if (!grouped[item.facilityId]) {
            grouped[item.facilityId] = [];
        }

        grouped[item.facilityId].push(item.roleName);
    });

    return grouped;
}

prepareFinalPayload() {

    const grouped = this.buildFacilityRolePayload();

    const payload = Object.keys(grouped).map(facilityId => {
        return {
            facilityId: facilityId,
            roles: grouped[facilityId].join(';'),

            // ✅ Common fields from editingDoc
            name: this.editingDoc.name,
            category: this.editingDoc.category,
            validFor: this.editingDoc.validFor,
            mandatory: this.editingDoc.mandatory,
            visibleToStaff: this.editingDoc.visibleToStaff,
            renewalRequired: this.editingDoc.renewalRequired,
            notes: this.editingDoc.notes,
            trainingId: this.editingDoc.id
        };
    });

    console.log('Final Payload:', JSON.stringify(payload));

    return payload;
}

async saveTraining() {

    try {

        const requestData = this.prepareFinalPayload();

        const result = await upsertFacilityCompliance({
            requestJson: JSON.stringify(requestData)
        });

        console.log('Upsert successful:', result);
         this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Training saved successfully',
                variant: 'success'
            })
        );
        this.closeModal();
        this.loadTrainings(this.pageNumber); 
     } catch (error) {

        console.error('Error during upsert:', error);

        let message = error?.body?.message || error.message;

        // ❌ ERROR TOAST
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: message,
                variant: 'error'
            })
        );
         this.closeModal();
    }
}

toggleField(event) {

    const recordId = event.target.dataset.id;
    const field = event.target.dataset.field;
    const value = event.target.checked;

    const label = this.getFieldLabel(field);

    // ✅ Action text based on toggle
    const action = value ? 'check' : 'uncheck';

    this.confirmMessage = `Do you want to ${action} "${label}" for all facilities?`;

    this.pendingToggle = {
        trainingId: recordId,
        field: field,
        value: value,
        element: event.target
    };

    this.showConfirmModal = true;
}

handleCancelConfirm() {

    // revert toggle
    if (this.pendingToggle.element) {
        this.pendingToggle.element.checked = !this.pendingToggle.value;
    }

    this.showConfirmModal = false;
}

async handleConfirmUpdate() {

    const { trainingId, field, value } = this.pendingToggle;

    try {

        await updateTrainingToggle({
            trainingId: trainingId,
            fieldName: field,
            fieldValue: value
        });

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Updated successfully',
                variant: 'success'
            })
        );

    } catch (error) {

        let message = error?.body?.message || error.message;

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: message,
                variant: 'error'
            })
        );

        // revert on error
        if (this.pendingToggle.element) {
            this.pendingToggle.element.checked = !this.pendingToggle.value;
        }
    }

    this.showConfirmModal = false;
}
getFieldLabel(field) {
    const map = {
        mandatory: 'Mandatory',
        visibleToStaff: 'Visible to Staff',
        renewalRequired: 'Renewal Required'
    };
    return map[field] || 'this setting';
}

 handleAllStaff() {
    this.allStaff = true;
    this.matchedStaff = false;
    this.systemStaff = false;
    this.wyzedStaff = false;

    this.setActiveTile('ALL');
    this.applyFilters();
    this.initializeAllPagination();
  }

  handleMatchedStaff() {
    this.allStaff = false;
    this.matchedStaff = true;
    this.systemStaff = false;
    this.wyzedStaff = false;
    this.setActiveTile('SYNC');
    this.applyFilters();
    this.initializeAllPagination();
  }

  handleSystemStaff() {
    this.allStaff = false;
    this.matchedStaff = false;
    this.systemStaff = true;
    this.wyzedStaff = false;

    this.setActiveTile('SYSTEM');
    this.applyFilters();
    this.initializeAllPagination();
  }

  handleWyzedStaff() {
    this.allStaff = false;
    this.matchedStaff = false;
    this.systemStaff = false;
    this.wyzedStaff = true;

    this.setActiveTile('WYZED');
    this.applyFilters();
    this.initializeAllPagination();
  }

initializeAllPagination() {
    this.allPageSize = this.recordsPerPage;
    this.allTotalRecords = this.filteredList.length;
    this.allTotalPages = Math.ceil(this.allTotalRecords / this.allPageSize);
    this.allCurrentPage = 1;
    this.updateAllPagination();
}

updateAllPagination() {
    const start = (this.allCurrentPage - 1) * this.allPageSize;
    const end = start + this.allPageSize;

    this.paginatedStaffList = this.filteredList.slice(start, end);
}

setActiveTile(type) {
    this.allStaff = false;
    this.matchedStaff = false;
    this.systemStaff = false;
    this.wyzedStaff = false;

    if (type === 'ALL') this.allStaff = true;
    if (type === 'SYNC') this.matchedStaff = true;
    if (type === 'SYSTEM') this.systemStaff = true;
    if (type === 'WYZED') this.wyzedStaff = true;
}




  handleAllFirstPage() { this.allCurrentPage = 1; this.updateAllPagination(); }
  handleAllPrevPage() { if (this.allCurrentPage > 1) { this.allCurrentPage -= 1; this.updateAllPagination(); } }
  handleAllNextPage() { if (this.allCurrentPage < this.allTotalPages) { this.allCurrentPage += 1; this.updateAllPagination(); } }
  handleAllLastPage() { this.allCurrentPage = this.allTotalPages; this.updateAllPagination(); }
  get allDisableFirstPrev() { return this.allCurrentPage === 1; }
  get allDisableNextLast() { return this.allCurrentPage === this.allTotalPages; }

    get hasNoStaff() {
        return this.filteredList.length === 0;
    }

    searchTimeout;
    @track searchKey;

    handleSearch(event) {
        clearTimeout(this.searchTimeout);

        const value = event.target.value;

        this.searchTimeout = setTimeout(() => {
            this.searchKey = value.toLowerCase();
            this.applyFilters();
        }, 300);
    }

        applyFilters() {

        let baseList = [];

        // 🔹 Determine active dataset
        if (this.allStaff) {
            baseList = this.allUsersCombined;
        } else if (this.matchedStaff) {
            baseList = this.syncedUsers;
        } else if (this.systemStaff) {
            baseList = this.systemOnlyUsers;
        } else if (this.wyzedStaff) {
            baseList = this.wyzedOnlyUsers;
        }

        // 🔹 Apply Search
        if (this.searchKey) {
            this.filteredList = baseList.filter(item =>
                (item.name && item.name.toLowerCase().includes(this.searchKey)) ||
                (item.email && item.email.toLowerCase().includes(this.searchKey)) ||
                (item.phone && item.phone.toLowerCase().includes(this.searchKey))
            );
        } else {
            this.filteredList = [...baseList];
        }

        // 🔹 Reset pagination
        this.allCurrentPage = 1;
        this.initializeAllPagination();
        this.setPageSizeByZoomAndScreen();
    }

    handleCreateInSystem(event) {

    this.staffWyzedId = event.currentTarget.dataset.id;
    this.staffEmail = event.currentTarget.dataset.email;
    this.staffFirstName = event.currentTarget.dataset.firstname;
    this.staffLastName = event.currentTarget.dataset.lastname;

    console.log('Wyzed User Selected:', this.staffWyzedId);
    console.log('Wyzed User staffEmail:', this.staffEmail);
    console.log('Wyzed User staffFirstName:', this.staffFirstName);
    console.log('Wyzed User staffLastName:', this.staffLastName);

    this.createStaff = true;
}

handleBackToXero() {
    this.createStaff = false;

    this.loadAllData();
}

handleCreateInWyzed(event) {

    this.pendingUser = {
        id: event.currentTarget.dataset.id,
        firstName: event.currentTarget.dataset.firstname,
        lastName: event.currentTarget.dataset.lastname,
        email: event.currentTarget.dataset.email
    };

    // 👉 Open modal instead of calling Apex
    this.showRoleModal = true;
}

showToast(title, message, variant) {
    this.dispatchEvent(
        new ShowToastEvent({
            title,
            message,
            variant
        })
    );
}

get isAdminSelected() {
    return this.selectedRole === 'ADMIN';
}

get isLearnerSelected() {
    return this.selectedRole === 'LEARNER';
}

handleRoleChange(event) {

    // event.stopPropagation();
    this.selectedRole = event.target.value;
}

stopPropagation(event) {
    event.stopPropagation();
}

async confirmCreateWyzed() {

    const { firstName, lastName, email, id } = this.pendingUser;
    console.log('🔹 Pending User Raw:', this.pendingUser);
    console.log('🔹 firstName:', firstName);
    console.log('🔹 lastName:', lastName);
    console.log('🔹 email:', email);
    console.log('🔹 id:', id);

    const isLearner = this.selectedRole === 'LEARNER';
    const isAdmin = this.selectedRole === 'ADMIN';
    this.showRoleModal =false;
    console.log('isLearner '+isLearner);

    try {
        this.showSpinner = true;

        // 🔹 1. Call Apex
        const result = await createLearnerMinimal({
            firstname: firstName,
            surname: lastName,
            email: email,
            isLearner: isLearner,
            isAdmin: isAdmin
        });

        console.log('Wyzed Response:', result);

        // 🔹 2. Parse response
        let response;
        try {
            response = JSON.parse(result);
        } catch (e) {
            response = null;
        }

        // 🔹 3. Extract Wyzed ID
        const wyzedId = response?.id || response?.user_id;

        // 🔹 4. Update Salesforce
        if (wyzedId) {
            await this.updateStaffWyzedId(id, wyzedId,isLearner);
        }

       await Promise.resolve();
        this.showRoleModal = false;
        // 🔹 Refresh data
        await this.loadAllData();

        // 🔹 7. Success toast
        this.showToast('Success', 'User created in Wyzed', 'success');

    } catch (error) {

        console.error('Error:', error);
       this.showSpinner = false;
        this.showToast(
            'Error',
            error?.body?.message || 'Failed',
            'error'
        );

    } finally {
        this.showSpinner = false;
    }
}

updateStaffWyzedId(recordId, wyzedId,isLearner) {
    return updateWyzedId({   // 🔥 RETURN is critical
        staffId: recordId,
        wyzedId: wyzedId,
        wyzedLearner:isLearner
    });
}

handleCloseModal() {
    this.showRoleModal = false;
}

closeUpgradeModal() {
    this.showUpgradeModal = false;
}
/* handleAssignCourse(event){
    console.log('current course iD'+event.currentTarget.dataset.id);

} */

handleAssignCourse(event) {

    const trainingId = event.currentTarget.dataset.id;

   

    // 🔥 Get clicked training
    const training = this.adminTrainingList.find(
        d => d.id === trainingId
    );
   console.log('training =>', JSON.stringify(training));

    if (!training) {
        console.warn('No training found');
        return;
    }
       this.selectedCourseId = training.wyzedCourseId;

    this.selectedCourseOwnerUserId =training.courseOwnerId;

    this.editingDoc = { ...training };
       console.log(' this.editingDoc =>', JSON.stringify( this.editingDoc));

    // 🔥 Fetch compliance child records
    getFacilityComplianceByTraining({
        trainingId: trainingId
    })
    .then(result => {

        console.log(
            'Compliance Records =>',
            JSON.stringify(result)
        );

        // 🔥 Facility Ids
        const facilityIds = [
            ...new Set(result.map(r => r.Facility__c))
        ];

        console.log(
            'Facility Ids =>',
            JSON.stringify(facilityIds)
        );

        this.selctedMultipleFcailityValues = facilityIds;

        // 🔥 Store child data
        this.existingChildData = result;

        // 🔥 Fetch role options
        return getRoleOptionsByFacility({
            facilityIdList: facilityIds
        });

    })
    .then(roleResult => {

        console.log(
            'Role Options =>',
            JSON.stringify(roleResult)
        );

        // 🔥 Build role options
        this.roleoptionsforFacility = roleResult.map((role, index) => {
            return {
                id: index.toString(),
                label: role.Role_Name__c,
                value: role.Role_Name__c,
                facilityValue: role.Facility__c,
                facilityName: role.Facility__r.Name,
                displaylabel:
                    role.Role_Name__c +
                    '-' +
                    role.Facility__r.Name,
                combinedValue:
                    role.Role_Name__c +
                    '|' +
                    role.Facility__c
            };
        });

        // 🔥 Build selected roles
        const selectedValues = [];

        this.existingChildData.forEach(child => {

            const roles = (child.Roles__c || '').split(';');

            roles.forEach(roleName => {

                const match =
                    this.roleoptionsforFacility.find(
                        r =>
                            r.label === roleName.trim() &&
                            r.facilityValue === child.Facility__c
                    );

                if (match) {
                    selectedValues.push(match.combinedValue);
                }
            });
        });

        this.selectedRoleValueLabels = selectedValues;

      getStaffByFacilityAndRoles({ selectedRoleFacilityValues: this.selectedRoleValueLabels
            })
            .then(result => {

                console.log(
                    'Matched Staff =>',
                    JSON.stringify(result)
                );

                // 🔥 Add checkbox state
                this.filteredStaffList = result.map(staff => {
                    return {
                        ...staff,
                        isChecked: true
                    };
                });

                // 🔥 Default selected
                this.selectedStaffIds =
                    this.filteredStaffList.map(s => s.Id);

                // 🔥 Wyzed ids
                this.selectedWyzedUserIds =
                    this.filteredStaffList
                        .filter(s => s.Wyzed_User_Id__c)
                        .map(s => s.Wyzed_User_Id__c);



                this.selectedCourseOwnerUserId =
                    this.editingDoc.courseOwnerId;

                console.log(
                    'selectedWyzedUserIds =>',
                    JSON.stringify(this.selectedWyzedUserIds)
                );

                // 🔥 OPEN MODAL
                this.showAssignStaffModal = true;

            })
            .catch(error => {

                console.error(
                    'Staff Fetch Error =>',
                    JSON.stringify(error)
                );
            });
                    console.log(
            'Selected Roles =>',
            JSON.stringify(this.selectedRoleValueLabels)
        );

        this.filteredStaffList = result.map(staff => {
                return {
                    ...staff,
                    isChecked: true
                };
            });

            // 🔥 default select all
            this.selectedStaffIds =
                this.filteredStaffList.map(s => s.Id);

            // 🔥 wyzed ids
            this.selectedWyzedUserIds =
                this.filteredStaffList
                    .filter(s => s.Wyzed_User_Id__c)
                    .map(s => s.Wyzed_User_Id__c);

            // 🔥 store course info
         

            // 🔥 open popup
            this.showAssignStaffModal = true;

        // 🔥 NOW YOU HAVE BOTH
        // this.selctedMultipleFcailityValues
        // this.selectedRoleValueLabels

        // 👉 continue assign logic here

    })
    .catch(error => {
        console.error(
            'Assign Course Error =>',
            JSON.stringify(error)
        );
    });
}

get disableAssignButton() {
    return !this.filteredStaffList.some(staff => staff.isChecked);
}

handleStaffSelection(event) {

    const staffId = event.target.dataset.id;
    const checked = event.target.checked;

    this.filteredStaffList =
        this.filteredStaffList.map(staff => {

            if (staff.Id === staffId) {
                return {
                    ...staff,
                    isChecked: checked
                };
            }

            return staff;
        });

    // 🔥 selected staff ids
    this.selectedStaffIds =
        this.filteredStaffList
            .filter(s => s.isChecked)
            .map(s => s.Id);

    // 🔥 selected wyzed ids
    this.selectedWyzedUserIds =
        this.filteredStaffList
            .filter(
                s =>
                    s.isChecked &&
                    s.Wyzed_User_Id__c
            )
            .map(s => s.Wyzed_User_Id__c);

    console.log(
        'Selected Wyzed Ids =>',
        JSON.stringify(this.selectedWyzedUserIds)
    );
}

handleFinalAssign() {
     this.showSpinner = true;
     this.showAssignStaffModal=false;
    assignSingleCourseToMultipleUsers({
        courseId: this.selectedCourseId,
        courseOwnerUserId: this.selectedCourseOwnerUserId,
        learnerUserIds: this.selectedWyzedUserIds
    })
    .then(() => {

        console.log('Course Assigned');

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Course assigned successfully.',
                variant: 'success'
            })
        );

        this.showAssignStaffModal = false;
         this.showSpinner = false;
    })
    .catch(error => {

        console.error(
            'Assignment Error Full =>',
            JSON.stringify(error)
        );
        this.showSpinner = false;

                let errorMessage = 'Unknown error occurred';

                if (error?.body?.message) {

            errorMessage = error.body.message;

            // 🔥 remove unwanted prefix
            if (
                errorMessage.includes(
                    'Course assignment failed:'
                )
            ) {

                errorMessage =
                    errorMessage.replace(
                        'Course assignment failed:',
                        ''
                    ).trim();
            }

            // 🔥 extract detail message
            const match =
                errorMessage.match(/"detail":"([^"]+)"/);

            if (match && match[1]) {
                errorMessage = match[1];
            }
        }

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Assignment Failed',
                message: errorMessage,
                variant: 'error'
            })
        );
    });
}

closeAssignModal(){
    this.showAssignStaffModal=false;
}



    disconnectedCallback() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    }

    renderedCallback() {
        if (!this.resizeObserver) {
            const container = this.template.querySelector('.table-container');
            if (container) {
                this.resizeObserver = new ResizeObserver(() => {
                    this.handleResize();
                });
                this.resizeObserver.observe(container);
            }
        }
    }

    handleResize() {
        if (this.isPageSizeManuallySet) {
            return;
        }
        this.setPageSizeByZoomAndScreen();
    }

    handleRecordsPerPage(event) {
        const selectedValue = event.target.value;
        if (selectedValue === 'Auto') {
            this.isPageSizeManuallySet = false;
            this.setPageSizeByZoomAndScreen();
        } else {
            this.isPageSizeManuallySet = true;
            this.recordsPerPage = parseInt(selectedValue, 10);
            this.pageNumber = 1;
            this.paginateData();
        }
    }

    setPageSizeByZoomAndScreen() {
        if (this.isPageSizeManuallySet) {
            return;
        }
        // Small timeout to allow the browser layout engine to paint and settle
        setTimeout(() => {
            const container = this.template.querySelector('.table-container');
            if (container) {
                const containerHeight = container.getBoundingClientRect().height || container.offsetHeight || 400;
                
                // Measure the actual rendered table header height
                const header = this.template.querySelector('.fixed-table thead');
                const headerHeight = header ? (header.getBoundingClientRect().height || header.offsetHeight) : 40;
                
                const availableHeight = containerHeight - headerHeight;
                
                // Measure the actual height of a table row from the DOM (fall back to 40px if empty)
                let rowHeight = 40;
                const firstRow = this.template.querySelector('.fixed-table tbody tr');
                if (firstRow) {
                    rowHeight = firstRow.getBoundingClientRect().height || firstRow.offsetHeight || 40;
                }
                
                let rows = Math.floor(availableHeight / rowHeight);
                if (rows < 1) {
                    rows = 1;
                }
                
                const oldSize = this.recordsPerPage;
                this.recordsPerPage = rows;
                
                // Note: Update 'this.totalRecords' or your matching data array below (e.g. 'this.userData.length')
                this.totalPages = Math.ceil(this.totalRecords / this.recordsPerPage);
                
                if (this.recordsPerPage !== oldSize) {
                    if (this.activeTab === 'training') {
                        this.pageNumber = 1;
                    } else if (this.activeTab === 'learners') {
                        this.allCurrentPage = 1;
                    }
                }
                this.paginateData();
            }
        }, 50);
    }

    get pageSizeOptions() {
        return [
            { label: 'Auto', value: 'Auto', selected: !this.isPageSizeManuallySet },
            { label: '10', value: 10, selected: this.isPageSizeManuallySet && this.recordsPerPage === 10 },
            { label: '20', value: 20, selected: this.isPageSizeManuallySet && this.recordsPerPage === 20 },
            { label: '50', value: 50, selected: this.isPageSizeManuallySet && this.recordsPerPage === 50 }
        ];
    }

    get totalRecords() {
        if (this.activeTab === 'training') {
            return (this.adminTrainingList || []).length;
        } else if (this.activeTab === 'learners') {
            return (this.filteredList || []).length;
        }
        return 0;
    }

    paginateData() {
        if (this.activeTab === 'training') {
            this.pageSize = this.recordsPerPage;
            this.totalPages = Math.ceil((this.adminTrainingList || []).length / this.recordsPerPage);
        } else if (this.activeTab === 'learners') {
            this.allPageSize = this.recordsPerPage;
            this.allCurrentPage = this.pageNumber;
            this.allTotalPages = Math.ceil((this.filteredList || []).length / this.recordsPerPage);
            this.updateAllPagination();
        }
    }
}