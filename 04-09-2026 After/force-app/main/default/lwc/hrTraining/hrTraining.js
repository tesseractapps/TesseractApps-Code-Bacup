import { LightningElement, track, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import fetchStaff from '@salesforce/apex/StaffController.fetchStaffs';
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
import getUserCoursesWithProgressJSON from '@salesforce/apex/WyzedCourseProgressBatch.getUserCoursesWithProgressJSON';



const fields = [UsrRoleName,userOrgName];

const ICON_DOWN = {
  icon: 'navigation',
  class: 'material-symbols material-symbols-filled rotate-icon rotate-down'
};

const ICON_LEFT = {
  icon: 'navigation',
  class: 'material-symbols material-symbols-filled rotate-icon rotate-left'
};

export default class HrTraining extends NavigationMixin(LightningElement) {

    _selectedRecordId = null;
    _selectedRecordUid = null;
    _suppressEmit = false;
    _lastSubRoute = '';
    _hasRestored = false;
    _childPopup = '';
    
    @api hrFlag;
    @track moduleName;
    @track startDate;
    @track endDate;
    @track description;
    @track imageURL;
    @track facEditFlag=false;
    @track assignmentFlag=false;
    @track recordId;
    @api selectedName;
    @track firstname='';
    @track lastname ='';
    @track Staffoptions=[{}];
    @track staffIdList=[];
    @track currentUser;
    @track currentUserEmail;
    @track currentUserRole
    @track usererror;
    @track userOrgName;
    @track saveButtonDisable=false;
    @track updateButtonDisable=false;
    @track Training;
    @track savelabel;
    @track assignid;
    @track staffEditFlag=false;
    @track error;
    @track isStaffVisible=false;
    @track selectedFilesToUpload;
    @track fileName = '';
   // @track UploadFile = 'Upload CSV File';
    @track showLoadingSpinner = false;
    @track filesUploaded = [];
    @track fileContents;
    @track fileReader;
    @track content;
    MAX_FILE_SIZE = 1500000;
    @track fileType;
    @track fileSize;
    @track showSpinner;
    @track fileReaderObj;
    @track myFile;
    @track dateErrorMessage;
    @track isHome=true;
    @track individualstaffassigments=[];
    @track modules=[];
    @track staffassigments=[];
    @track moduleid;
    @track filteredStaffOptions=[];
    @track statusOptions = [
        { label: 'Pending', value: 'Pending' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Completed', value: 'Completed' }
      ];
      @track statusValue = 'In Progress';    
    /* @track activeSections = []; */
    @track individualstaffflag=false;
    @track totalstaffflag=false;
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
    @track learnerPageSizeOptions = [10, 25, 50, 75, 100];
    @track learnerAllRecords = [];   // 🔥 full dataset (from Apex)
    @track learners = [];            // 🔥 paginated data (UI)

    @track learnerTotalRecords = 0;
    @track learnerPageSize = 10;
    @track learnerTotalPages;
    @track learnerPageNumber = 1;
    //manendra added for sorting table
    @track sortField = '';
    @track sortDirection = 'asc';
    @track sortIcons = {
        courseName: '',
        enrolledDate: '',
        completedDate: '',
        status: '',
        isPass: '',
        score: '',
        completionPercentage: '',
        totalActivities: '',
        completedCount: ''
    };


    @track myAllCourseRecords = [];

    // 🔥 PAGINATED DATA (UI)
    @track myCompletedCourses = [];

    // 🔥 PAGINATION CONFIG
    @track myPageSizeOptions = [10, 25, 50, 100];
    @track myPageSize = 10;
    @track myPageNumber = 1;
    @track myTotalRecords = 0;
    @track myTotalPages = 0;
   // @track noRecordsFlag = false;
    @track showUpgradeModal;



    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;

    get logoUrl() {
        return this.tLogoUrl;
    }

    get imageUrl() {
        return this.tImageUrl;
    }

    @wire(getRecord, { recordId: Id, fields: [UsrRoleName,userOrgName,UserEmail,UserFirstName,UserLastName]}) 
    currentUserInfo({error, data}) {
        if (data) {
          //  console.log('WIRE DATA '+JSON.stringify(data));
            this.currentUserRole =data.fields.User_Role__c.value;
            console.log(' hr  falgs '+ this.hrFlag);
           this.AdminUserEmail=data.fields.Email.value;
            this.AdminUserFirstName=data.fields.FirstName.value;
            this.AdminUserlastName=data.fields.LastName.value;
          //  console.log('user email '+userEmail);
         //   console.log('user email '+userFirstName);
        //    console.log('user email '+userLastName);
           
        if(this.hrFlag){
            if( this.currentUserRole == 'Portal Account Partner Executive'  ||this.currentUserRole == 'Portal Account Partner Manager'|| this.currentUserRole == 'CEO' || this.currentUserRole == 'Admin' ){
               this.isStaffVisible=true;
               /* this.activeSections = ['CreateTraining']; */ 
               this.individualstaffflag=false;
               this.totalstaffflag=true;
               // this.loadCourses();
                this.loadMyCourses();
               console.log(' admin  falgs '+ this.currentUserRole);
               console.log(' admin  falgs '+ this.isStaffVisible);
               console.log(' visible   falgs '+ this.individualstaffflag);
               console.log(' staff  falgs '+ this.totalstaffflag);
            } 
        }else{
                this.isStaffVisible=false;
                /* this.activeSections = ['StaffTrainingStatus']; */ 
                this.individualstaffflag=true;
                this.totalstaffflag=false;
                this.loadMyCourses();
               

            }
           
        }
       
     else if (error) {
        this.error = error ;
    }
    
    } 
 
    // -------------------------
    // DATE FORMAT (AM/PM)
    // -------------------------
   

    disconnectedCallback() {
        this.template.removeEventListener('childstatechange', this._boundChildStateChange);
        this.template.removeEventListener('subpopup', this._boundSubPopup);        
    window.removeEventListener('keydown', this.handleKeyShortcut.bind(this));
  }

    renderedCallback() {
        this._syncRecordRoute();
    }

    handleChildStateChange() { this._syncRecordRoute(); }
    handleSubPopup(e) { this._childPopup = e.detail.slug || ''; this._syncRecordRoute(); }

    get _recordUid() { return this._selectedRecordUid || ''; }

    _composeSubRoute() {
        return '';
    }

    _syncRouteTimeout;
    _syncRecordRoute() {
        if (this._suppressEmit) return;
        if (this._syncRouteTimeout) clearTimeout(this._syncRouteTimeout);
        this._syncRouteTimeout = setTimeout(() => { this._syncRecordRouteActual(); }, 0);
    }

    _syncRecordRouteActual() {
        if (this._suppressEmit) return;
        this.notifyModuleRoot();
    }

    notifySubRoute(subView, replace) {
        if (this._suppressEmit) return;
        this.dispatchEvent(new CustomEvent('subrouteupdate', {
            detail: { subView, recordId: this._selectedRecordId || null, replace: !!replace },
            bubbles: true, composed: true
        }));
    }

    notifyModuleRoot() {
        this._lastSubRoute = '';
        if (this._suppressEmit) return;
        this.dispatchEvent(new CustomEvent('subrouteupdate', {
            detail: { subView: '', recordId: null, replace: true },
            bubbles: true, composed: true
        }));
    }

    @api async openByUID(uid, tab, isEdit) {
        // no-op for my profile training
    }

    @api openCreate(step) {
        // no-op for my profile training
    }

    _restoreFromUrlHash() {
        if (this._hasRestored) return true;
        this._hasRestored = true;
        return true;
    }

    @api get isEdit() { return false; }
    @api get currentStep() { return ''; }
    @api currentTabSlug() { return ''; }
    @api selectTab(slug) {}
    @api startEdit() {}
    @api setStep(step) {}
    @api openPopup(slug) {}  

   loadMyCourses() {
    this.showSpinner = true;

    getUserCoursesWithProgressJSON()
        .then(result => {
            this.showSpinner = false;

            let data = JSON.parse(result);
            console.log('my course data ' + JSON.stringify(data));

            // 🔥 Map API → UI (based on your actual data structure)
            this.myAllCourseRecords = data.map(item => {
                 return {
                        id: item.course_id,
                        courseName: item.course_name,
                        enrolledDate: this.formatDate(item.enrolled_at),
                        completedDate: item.is_completed ? this.formatDate(item.completed_at) : null,
                        status: item.status =='In-Progress' ?'In Progress' :item.status,
                        isPass: item.grading_result?.is_pass === true,
                        score: item.grading_result?.score_percent || 0,
                        completionPercentage: item.completion_percentage,
                        totalActivities: item.total_activities,
                        completedCount: item.completed_count,
                        isStarted: item.is_started,
                        isCompleted: item.is_completed,
                    };
            });

            this.myTotalRecords = this.myAllCourseRecords.length;

            // 🔥 INIT PAGINATION
            this.myPageNumber = 1;
            this.myPaginationHelper();
            this._restoreFromUrlHash();

        })
        .catch(error => {
            this.showSpinner = false;
            console.error('Error loading courses:', error);
        });
}

    // Helper method to format dates
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
    }

    // ============================
    // PAGINATION HELPERS
    // ============================
    myPaginationHelper() {

        this.myCompletedCourses = [];

        if (this.myTotalRecords > 0) {
            this.noRecordsFlag = false;
        } else {
            this.noRecordsFlag = true;
        }
        // Manendra added for sorting
        let displayRecords = [...this.myAllCourseRecords];
        if (this.sortField) {
            displayRecords = this.sortData(
                displayRecords,
                this.sortField,
                this.sortDirection
            );
        }

        this.myTotalPages = Math.ceil(this.myTotalRecords / this.myPageSize);

        if (this.myPageNumber <= 1) {
            this.myPageNumber = 1;
        } else if (this.myPageNumber >= this.myTotalPages) {
            this.myPageNumber = this.myTotalPages;
        }

        let tempList = [];

        for (
            let i = (this.myPageNumber - 1) * this.myPageSize;
            i < this.myPageNumber * this.myPageSize;
            i++
        ) {
            if (i === this.myTotalRecords) break;

           // let tempRec = Object.assign({}, this.myAllCourseRecords[i]);
            // Use sorted displayRecords instead of myAllCourseRecords
            let tempRec = Object.assign({}, displayRecords[i]);// manendra added for table sort
            tempList.push(tempRec);
        }

        this.myCompletedCourses = tempList;
    }

    // ============================
    // PAGINATION ACTIONS
    // ============================
    handleMyPageSizeChange(event) {
        this.myPageSize = parseInt(event.target.value, 10);
        this.myPageNumber = 1;
        this.myPaginationHelper();
    }

    myNextPage() {
        this.myPageNumber++;
        this.myPaginationHelper();
    }

    myPreviousPage() {
        this.myPageNumber--;
        this.myPaginationHelper();
    }

    myFirstPage() {
        this.myPageNumber = 1;
        this.myPaginationHelper();
    }

    myLastPage() {
        this.myPageNumber = this.myTotalPages;
        this.myPaginationHelper();
    }

    get myDisableFirst() {
        return this.myPageNumber == 1;
    }

    get myDisableLast() {
        return this.myPageNumber == this.myTotalPages;
    }


    @track allStaffOptions = [];
   
   @wire(fetchStaff, { recordId: '$selectedName', firstname: '$firstname', lastname: '$lastname' })
recordsToDisplay(result) {
    if (result.data) {
        this.allStaffOptions = result.data.map(record => ({
            value: record.Id,
            label: record.Display_Nickname__c,
            facility: record.Facility__c // Required for filtering
        }));

      //  console.log('All Staff:', JSON.stringify(this.allStaffOptions));

        // Proceed to filter based on user role
        const storedFacilityId = localStorage.getItem('defaultFacilityId');
        const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');
        console.log('storedFacilityId: ' + storedFacilityId);
        console.log('storedFacilityLabel: ' + storedFacilityLabel);

        getCurrentLoggedUserInfo().then(userData => {
            let userType = userData.User_Type__c;
            console.log('User Data:', JSON.stringify(userData));

            if (userType === 'Facility Admin' || userType === 'HR Admin' || userType === 'Roster Manager' || userType === 'NDIS Org Admin' || userType === 'ICT Admin') {
                // Filter staff options based on facility
                this.Staffoptions = this.allStaffOptions.filter(staff =>
                    staff.facility === storedFacilityId
                );
            }

          //  console.log('Filtered Staffoptions:', JSON.stringify(this.Staffoptions));
        }).catch(error => {
            console.error('Error fetching user info:', error);
        });
    }
}
    capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
  
   

    @track sectionFlags = {
        StaffTrainingStatus: true,
        CreateTraining: true,
        
    };


    @track sectionIcons = {
    StaffTrainingStatus: { ...ICON_DOWN },
    CreateTraining: { ...ICON_DOWN },
    };
        

    navigateToWyzed(event){
        console.log('staff id '+event.currentTarget.dataset.id);
        console.log('staff first name  '+event.currentTarget.dataset.firstname);
        console.log('staff last name'+event.currentTarget.dataset.lastname);
        console.log('staff email '+event.currentTarget.dataset.email);

        if (!event.currentTarget.dataset.id || !event.currentTarget.dataset.firstname || !event.currentTarget.dataset.lastname || !event.currentTarget.dataset.email) {
            const evt = new ShowToastEvent({
                title: 'Error',
                message: 'Please provide first name ,last name and email ID',
                variant: 'error',
            });
            this.dispatchEvent(evt);
            return;
        }

        redirectToWyzedSSO({ uid: event.currentTarget.dataset.id, firstname: event.currentTarget.dataset.firstname, surname: event.currentTarget.dataset.lastname, email: event.currentTarget.dataset.email,isAdmin:false })
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
            console.error('Error occurred during redirect: ', error);
            // Handle any errors
        });
   
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
  


    // manendra added for sorting the data in table
        handleSort(event) {
            const field = event.currentTarget.dataset.field;
            if (!field) {
                return;
            }
            if (this.sortField === field) {
                this.sortDirection =
                    this.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortField = field;
                this.sortDirection = 'asc';
            }
            Object.keys(this.sortIcons).forEach(key => {
                this.sortIcons[key] = '';
            });
            this.sortIcons[field] =
                this.sortDirection === 'asc'
                    ? 'arrow_upward'
                    : 'arrow_downward';
            this.sortIcons = { ...this.sortIcons };
            this.pageNumber = 1;
            this.myPaginationHelper()
        }
        sortData(data) {

            if (!this.sortField) {
                return [...data];
            }
            const direction = this.sortDirection === 'asc' ? 1 : -1;
            return [...data].sort((a, b) => {
                const valueA = a[this.sortField];
                const valueB = b[this.sortField];
                const emptyA =
                    valueA === null ||
                    valueA === undefined ||
                    valueA === '' ||
                    valueA === 'N/A';
                const emptyB =
                    valueB === null ||
                    valueB === undefined ||
                    valueB === '' ||
                    valueB === 'N/A';
                if (emptyA && emptyB) return 0;
                if (emptyA) return 1;
                if (emptyB) return -1;
                return (
                    String(valueA).localeCompare(
                        String(valueB),
                        undefined,
                        {
                            numeric: true,
                            sensitivity: 'base'
                        }
                    ) * direction
                );
            });
        }
    //end
}