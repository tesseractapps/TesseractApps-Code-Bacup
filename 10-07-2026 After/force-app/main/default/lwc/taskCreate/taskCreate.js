import { LightningElement, track, wire,api } from 'lwc';
import listOfUsers from '@salesforce/apex/TaskCreateHandler.listOfUsers';
import createTaskRecord from '@salesforce/apex/TaskCreateHandler.createTaskRecord';
import createTaskforstaff from '@salesforce/apex/TaskCreateHandler.createTask';
import getParticipantShifts from '@salesforce/apex/TaskCreateHandler.getParticipantShifts';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import getRoleOptionsByFacility from '@salesforce/apex/StaffController.getRoleOptionsByFacility';
import StaffsRolesWiseList from '@salesforce/apex/StaffController.StaffsRolesWiseList';
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import getTasksById from '@salesforce/apex/TaskCreateHandler.getTasksById';
import getStaffById from '@salesforce/apex/TaskCreateHandler.getStaffById';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';

const AWS_BASE = 'https://tesseractapps.com'; // no trailing slash
const ENDPOINTS = {
    delete: `${AWS_BASE}/delete-file`
};

export default class TaskCreate extends LightningElement {
    @track userOption = [];
    @track userList;
    @track userId;
    @api  participantName;
    @api  participantId;
    @api taskId;
    @track disableedit=false;
    @track uitasktime;
    @track savelabel='Create';

    

    @track statusValue = '';
    @track subjectValue='';
    @track priorityValue='';
    @track dueDateValue='';
    @track commentsValue='';
    @track allowMultiple=true;
    @track isLoading = false;

    get optionsStatus() {
        return [
            { label: 'Open', value: 'Open' },
            { label: 'New', value: 'New' },
            { label: 'In Progress', value: 'In Progress' },
            { label: 'Cancelled', value: 'Cancelled' },
            { label: 'Not Completed', value: 'Not Completed' },
            { label: 'Completed', value: 'Completed' }, 
        ];
    }

    get optionsSubject() {
        return [
            { label: 'Call', value: 'Call' },
            { label: 'Send Letter', value: 'Send Letter' },
            { label: 'Send Quote', value: 'Send Quote' },
            { label: 'Other', value: 'Other' },
        ];
    }

    get optionsPriority() {
        return [
             { label: 'Low', value: 'Low' },
             { label: 'Medium', value: 'Medium' },
             { label: 'High', value: 'High' },
           
        ];
    }

    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;
 
    get logoUrl() {
        return this.tLogoUrl;
    }
 
    get imageUrl() {
        return this.tImageUrl;
    }


    handleUser(event) {
        this.userId = event.detail.value;
    }
    /* handleChange(event) {
        if(event.target.name=='status'){
            this.statusValue = event.detail.value;
        }
        if(event.target.name=='subject'){
            this.subjectValue = event.detail.value;
            console.log('subject'+this.subjectValue);
        }
        if(event.target.name=='priority'){
            this.priorityValue = event.detail.value;
        }
        if(event.target.name=='dueDate'){
            this.dueDateValue = event.detail.value;
        }
        if(event.target.name=='comments'){
            this.commentsValue = event.detail.value;
        } 
        
    } */
    @api
     createTask(){
        console.log('calling method')
        if(!this.userId){
            const event = new ShowToastEvent({
                title: 'Error',
                message: 'Please select the user',
                variant: 'error'
            });
            this.dispatchEvent(event);
            return;
        }
        else{
        
    
        createTaskRecord({userId:this.userId,statusValue:this.statusValue,
                        subjectValue:this.subjectValue,priorityValue:this.priorityValue,
                        dueDateValue:this.dueDateValue,commentsValue:this.commentsValue}).then(response=>{
                            console.log('created Task');
                            
                    
                        })
                        this.dispatchEvent(
                            new ShowToastEvent({
                              title: 'Success',
                              message: 'Task created succesfully',
                              variant: 'success'
                            })
                          );
                          
                    }
    }

    connectedCallback() {
        console.log('participantName',this.participantName);
         console.log('participantId',this.participantId);
         console.log('taskId',this.taskId);
        this.loadFacilities();
        this.fetchOrgDetails();
        listOfUsers().then(response => {
            console.log('response >>',response);
            this.userList = response;
            console.log('this.userList >>',this.userList);
            this.userOption = response.map(record => ({ value: record.Id, label: record.Full_Name__c }))

        }).catch(err => {
            console.log(err);
        });

         if (this.taskId) {
            this.loadTask();
            this.disableedit=true;
            this.savelabel='Update';
        }

    }


    @track taskRecord = {};
    @track isCreateDisabled = true;
    @track isImmediate = false;
    @track isBeforeTask = false;
    @track facilityOptions=[];
    @track selctedMultipleFcailityValues;
    @track selectedRoleValueLabels;
    @track roleoptionsforFacility;
    @track Orgid;
    @track noRecordsFlag1=true;
    @track isAssignToStaff;
    @track isLinkToShift = false;

    handleChange(event) {
    this.taskRecord[event.target.name] = event.target.value;
    console.log('this.taskRecord',JSON.stringify(this.taskRecord));
     if (event.target.name === 'TaskDate') {
         this.fetchParticipantShifts();
    }

    //this.validateForm();
   
    } 

   /*  validateForm() {
    const subject = this.taskRecord.Subject;
    const status = this.taskRecord.status;
    const priority = this.taskRecord.priority;

    this.isCreateDisabled = !(
        subject &&
        status &&
        priority
    );
    } */

    handleReminderChange(event) {
    const selectedValue = event.target.value;

    this.isImmediate = selectedValue === 'Immediate';
    this.isBeforeTask = selectedValue === 'BeforeTask';
    if(this.isImmediate){
     this.notificationTiming = null;
     this.customHours = null;
    }
    

    }

    createTaskHandler() {
         console.log('Task Record =>', JSON.stringify(this.taskRecord));

         if (!this.taskRecord.Title || !this.taskRecord.Title.trim()) {
        this.showToast('Error', 'Please enter Task Title.', 'error');
        return;
    }

    if (!this.taskRecord.TaskDate) {
        this.showToast('Error', 'Please select Task Date.', 'error');
        return;
    }

   if (this.taskRecord.TaskTime == null || this.taskRecord.TaskTime === '') {
        this.showToast('Error', 'Please select Task Time.', 'error');
        return;
    }

    if (!this.isAssignToStaff && !this.isLinkToShift) {
    this.showToast( 'Error', 'Please select an Assignment Option.', 'error');
    return;
}

    if (this.isAssignToStaff && !this.selectedStaffId) {
        this.showToast('Error', 'Please select a Staff member.', 'error');
        return;
    }

    if (this.isLinkToShift && !this.selectedShiftId) {
        this.showToast('Error', 'Please select a Shift.', 'error');
        return;
    }

    this.taskRecord.notifyImmediately = this.isImmediate;
    this.taskRecord.notifyBeforeTask = this.isBeforeTask;
   // this.taskRecord.facilityIds = null;
   // this.taskRecord.roles = null;
    this.taskRecord.staffId = this.selectedStaffId || '';
    this.taskRecord.assigntostaff = this.isAssignToStaff;
    this.taskRecord.linktoshift = this.isLinkToShift;
    this.taskRecord.shiftId = this.selectedShiftId;
    this.taskRecord.participantId = this.participantId;
    this.taskRecord.notificationTiming =  this.notificationTiming ;
    this.taskRecord.customHours = this.customHours;
    this.taskRecord.files = this.uploadedFiles;

    if (this.taskId) {
      this.taskRecord.Id = this.taskId;
    }
    this.isLoading =true;
    
    console.log('Task Record =>', JSON.stringify(this.taskRecord));


     createTaskforstaff({
        taskRecord : this.taskRecord
    })
    .then(result => {
         this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Task created succesfully',
                variant: 'success'
            })
         );
         this.closeModal();
         this.isLoading =false;

    })
    .catch(error => {
        console.error(error);
         this.isLoading =false;
    }); 
}

  loadFacilities() {

    getFacilityData()
        .then(response => {

            console.log('Facility data fetched successfully:', response);
             

            this.facilityOptions = response.map(record => ({
                label: record.Name,
                value: record.Id
            }));

        })
        .catch(error => {

            console.error('Error fetching facilities:', error);

        });
}

   handleFacilityChange(event) {

        // ✅ Ignore search typing events
        if (!Array.isArray(event.detail.value)) {
            console.log('Ignored search event:', event.detail);
            return;
        }

        const selectedFacilityIds = event.detail.value || [];

        console.log('Selected Facilities:', selectedFacilityIds);

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
     if (!event.detail.values) {
        console.log('Ignored search event:', event.detail);
        return;
    }

    const selectedValues = event.detail?.values || [];

    // ✅ Extract role + facilityId
    const parsed = selectedValues.map(val => {
        const [roleName, facilityId] = val.split('|');
        return { roleName, facilityId };
    });

    console.log('Parsed:', JSON.stringify(parsed));

    this.selectedRoleValueLabels = [...selectedValues];
    console.log('this.selectedRoleValueLabels ',JSON.stringify(this.selectedRoleValueLabels ));
    this.fetchStaffs();
}

@track staffData=[];
@track staffPagedData=[];
@track selectedStaffId = '';
@track searchKey = '';

handleSearch(event) {
    this.searchKey = event.target.value;
    console.log('this.searchKey',this.searchKey);
    this.fetchStaffs();
}

fetchStaffs() {

      if (!this.selectedRoleValueLabels || !Array.isArray(this.selectedRoleValueLabels)) {
        console.log('No roles selected');
        return;
    }

    // Extract only role names
    const roles = this.selectedRoleValueLabels.map(item => {
        return item.split('|')[0];
    });

    console.log('Org Id => ', this.Orgid);
    console.log('Facilities => ', JSON.stringify(this.selctedMultipleFcailityValues));
    console.log('Roles => ', JSON.stringify(roles));

    StaffsRolesWiseList({
        orgId: this.Orgid,
        facIdlist: this.selctedMultipleFcailityValues,
        roles: roles,
        name: this.searchKey
    })
    .then(result => {

    console.log('Staff List => ', JSON.stringify(result));

    this.staffData = result.map((staff, index) => {

        return {
            ...staff,

            serialNumber: index + 1,
            isSelected: staff.Id === this.selectedStaffId,

            roleNames: staff.StaffRoles__r
                ? [...new Set(
                    staff.StaffRoles__r.map(role => role.RoleName__c)
                )].join(', ')
                : '',

            email: staff.Email_Address__c  || '',
             facilityName: staff.Staff_Facilities__r
                ? staff.Staff_Facilities__r
                    .map(f => f.Facility__r.Name)
                    .join(', ')
                : ''
        };
    });

    this.staffPagedData = [...this.staffData];

    this.staffTotalRecords = this.staffData.length;
    this.noRecordsFlag1 = this.staffData.length === 0;

    console.log('Mapped Staff Data', JSON.stringify(this.staffData));

})
.catch(error => {
    console.error('Error => ', JSON.stringify(error));
});
}

 fetchOrgDetails() {
      orgDetails()
          .then((response) => {
              this.Orgid = response.Id;
          })
          .catch((error) => {
              this.error = error;
          });
  }

 

handleStaffSelection(event) {
    this.selectedStaffId = event.target.value;

    this.staffPagedData = this.staffPagedData.map(staff => {
        return {
            ...staff,
            isSelected: staff.Id === this.selectedStaffId
        };
    });

    console.log('Selected Staff Id:', this.selectedStaffId);
}

@track selectedShiftId;


handleShiftSelection(event) {
    this.selectedShiftId = event.target.dataset.shiftid;
    this.selectedStaffId = event.target.dataset.staffid;

    console.log('Shift Id:', this.selectedShiftId);
    console.log('Staff Id:', this.selectedStaffId);

    // Optional: Update selected row
   /*  this.shiftPagedData = this.shiftPagedData.map(shift => {
        return {
            ...shift,
            isSelected: shift.Id === this.selectedShiftId
        };
    }); */
}

handleAssignmentType(event) {
    const value = event.target.value;

    this.isAssignToStaff = value === 'staff';
    this.isLinkToShift = value === 'shift';

    if (this.isAssignToStaff) {
        this.fetchStaffs();
    } else {
        this.selectedStaffId = '';
        this.staffPagedData = [];
        this.noRecordsFlag1 = true;
        this.selectedRoleValueLabels=[];
        this.selctedMultipleFcailityValues=[];
        this.fetchParticipantShifts();
    }
}

@track shiftPagedData = [];
@track noShiftRecords = true;

fetchParticipantShifts() {
    console.log('this.participantId',this.participantId);
     console.log('this.taskRecord.TaskDate',this.taskRecord.TaskDate);

    getParticipantShifts({
        participantId: this.participantId,
        shiftDate: this.taskRecord.TaskDate
    })
    .then(result => {
        this.shiftPagedData = result.map((shift, index) => {
            const startTime = this.convertMillisecondsToTime(shift.Start_Time__c);
            const endTime = this.convertMillisecondsToTime(shift.End_Time__c);
             let formattedDate = '';
                if (shift.Date__c) {
                    const [year, month, day] = shift.Date__c.split('-');
                    formattedDate = `${day}-${month}-${year}`;
                }

            return {
                ...shift,
                serialNumber: index + 1,
                startTime,
                endTime,
                formattedDate,
                timeRange: `${startTime} - ${endTime}`,
                 isSelected: shift.Id === this.selectedShiftId
            };
        });

        this.noShiftRecords = this.shiftPagedData.length === 0;
        console.log('shiftPagedData', JSON.stringify(this.shiftPagedData));
    })
    .catch(error => {
        console.error('Error:', JSON.stringify(error));
    });
}

convertMillisecondsToTime(milliseconds) {

    let totalSeconds = milliseconds / 1000;

    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);

    let ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

@track notificationTiming;
@track customHours;

get notificationTimingOptions() {
    return [
        { label: '3 Hours Before', value: '3Hours' },
        { label: '1 Day Before', value: '1Day' },
        { label: '3 Days Before', value: '3Days' },
       /*  { label: 'Custom Time', value: 'Custom' } */
    ];
}

get showCustomTime() {
    return this.notificationTiming === 'Custom'; 
}

handleNotificationTiming(event) {
    this.notificationTiming = event.detail.value;

    switch (this.notificationTiming) {
        case '3Hours':
            this.customHours = 3;
            break;

        case '1Day':
            this.customHours = 24;
            break;

        case '3Days':
            this.customHours = 72;
            break;

        case 'Custom':
            this.customHours = null; // Let user enter manually
            break;

        default:
            this.customHours = null;
    }

    console.log('Hours:', this.customHours);
    console.log('this.notificationTiming',this.notificationTiming);
}

handleCustomHours(event) {
    this.customHours = Number(event.target.value);
    console.log('Custom Hours:', this.customHours);
}

 triggerFileInput() {
        
        console.log('triggerFileInput called ');
        const inputEl = this.template.querySelector('input[type="file"]');
        if (inputEl) {
            inputEl.value = '';
            inputEl.click();
            console.log('triggerFileInput called111 ');
        } else {
            console.warn("⚠️ File input not found.");
        }
    }


    @track documentedit=false;
    @track totalfiles=[];
    @track isFileExpand;
    @track uploadedFiles = [];
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
    }
    
    handleDrop(event) {
     event.preventDefault();
     event.stopPropagation();
    let files = Array.from(event.dataTransfer.files || []);
   

      const longNameFile = files.find(f => f.name.length > 50);
    if (longNameFile) {
        this.showToast(
            'Error',
            `Filename too long: "${longNameFile.name}". Maximum allowed is 50 characters.`,
            'error'
        );
        event.target.value = '';
        return;
    }

    const MAX_TOTAL_SIZE = 50 * 1024 * 1024;
    const existingSize = this.totalfiles.reduce((sum, file) => sum + file.size, 0);
    const newFilesSize = files.reduce((sum, file) => sum + file.size, 0);
    if (existingSize + newFilesSize > MAX_TOTAL_SIZE) {
        this.showToast(
            'Error',
            'Total file size cannot exceed 50MB.',
            'error'
        );
        event.target.value = '';
        return;
    }

    if (this.documentedit) {
        // 🚫 Allow only one file in edit mode
        if (this.totalfiles.length >= 1) {
            this.showToast('Error', 'Only one file can be uploaded in edit mode.', 'error');
            return;
        }

        if (files.length > 1) {
            this.showToast('Error', 'You can only upload one file in edit mode.', 'error');
            return;
        }

        files = [files[0]]; // take only the first file
    }

    // Push to tracking array
    this.totalfiles.push(...files);

    // Process files as usual
    this.processFiles(files);
    }
   
    handleFileUploadInputChange(event) {
        console.log('handleFileUploadInputChange called ');
       
        let files = Array.from(event.target.files || []);
        
       // const invalidFile = files.find(f => !this.isAllowedFile(f));
       /* if (invalidFile) {
            this.showToast('Error', `File type not allowed: ${invalidFile.name}. Only PDF and image files (.pdf, .png, .jpg, .jpeg) are allowed.`, 'error');
            event.target.value = ''; // reset
            return;
        } */
        const longNameFile = files.find(f => f.name.length > 50);
        if (longNameFile) {
            this.showToast(
                'Error',
                `Filename too long: "${longNameFile.name}". Maximum allowed is 50 characters.`,
                'error'
            );
            event.target.value = '';
            return;
        }

    const MAX_TOTAL_SIZE = 50 * 1024 * 1024;
    const existingSize = this.totalfiles.reduce((sum, file) => sum + file.size, 0);
    const newFilesSize = files.reduce((sum, file) => sum + file.size, 0);
    if (existingSize + newFilesSize > MAX_TOTAL_SIZE) {
        this.showToast(
            'Error',
            'Total file size cannot exceed 50MB.',
            'error'
        );
        event.target.value = '';
        return;
    }

       if (this.documentedit) {
        // Allow only one file in edit mode
         if (this.totalfiles.length >= 1) {
            this.showToast('Error', 'Only one file can be uploaded in edit mode.', 'error');
            event.target.value = ''; // reset input
            return;
        }
        if (files.length > 1) {
            this.showToast('Error', 'You can only upload one file in edit mode.', 'error');
            return;
        }
        // Take only the first file
        files = [files[0]];
    }
     this.totalfiles.push(...files);

    this.processFiles(files);

    // Reset file input so same file can be re-uploaded if needed
    event.target.value = '';
        
    }

      processFiles(files) {
    if (!files || !files.length) return;

    setTimeout(() => {
        this.isFileExpand = true;

        setTimeout(() => {
            const svc = this.template.querySelector('c-document-office-service');
            if (!svc) {
                console.warn('⚠️ No <c-document-office-service> component found.');
                return;
            }

            svc.incomingFiles = files;
        }, 1000);
    }, 0);
  }

    handleAwsUploadComplete(evt) {
        try {
            console.group('[AWS Upload Complete]');
            console.log('Raw event detail:', evt?.detail);

            //const { recordId, files = [], ctx } = evt.detail || {};
            const { recordId, files = [] } = evt.detail || {};
            console.log('recordId:', recordId);
            console.log('files count:', files.length, 'files:', files);
            //console.log('ctx (cellId):', ctx);

            if (!files.length) {
                console.warn('No uploaded files in payload; aborting.');
                console.groupEnd();
                return;
            }

            // Build arrays from the full payload
            const urls       = files.map(f => f?.url).filter(Boolean);
            const names      = files.map(f => f?.originalName).filter(Boolean);
            const types      = files.map(f => f?.type).filter(Boolean);
            const s3Keys     = files.map(f => f?.key).filter(Boolean);
            const modulePath = files[0]?.modulePath ?? undefined;
            const sizes      = files.map(f => f?.size).filter(Boolean);
            const totalBytes  = files.map(f => f?.totalBytes).filter(Boolean);

            console.log('All URLs:', urls);
            console.log('All names:', names);
            console.log('All types:', types);
            console.log('All s3 keys:', s3Keys);
            console.log('All sizes:', sizes);

            // If your field.value must be a string, use:
            // const valueForField = urls.join(',');
            const valueForField = urls; // ✅ save all URLs as an array

            const metaPayload = {
                modulePath,
                recordId,
                uploadedAt: new Date().toISOString(),
                uploadedFiles: files,     // ✅ include ALL returned file objects
                rawEventDetail: evt.detail
            };

           
            // Clear the input so the same file can be selected again
            this.uploadedFiles = files;
            this.fileName = names.join(', ');
            this.downloadLinks = urls;
            //this.fileSizeFromChild = sizes;           // this.showSpinner = false;
            this.fileSizeInBytes = totalBytes;
            console.log(' Files in last  : ',  files);
            console.log(' this.uploadedFiles  : ',  JSON.stringify(this.uploadedFiles));
            console.log(' this.downloadLinks : ',  JSON.stringify(this.downloadLinks));
            this.isFileAttached=true;
            console.groupEnd();
        } catch (e) {
            console.error('[AWS Upload Complete] handler error:', e);
        }
    }

     ALLOWED_FILE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];

    isAllowedFile(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return this.ALLOWED_FILE_EXTENSIONS.includes(ext);
    }

      async deleteFile(key) {
        if (!key) {
            console.error('[DELETE] key is required');
            return;
        }

        try {
            const resp = await fetch(ENDPOINTS.delete, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });

            const text = await resp.text();
            let json;
            try { json = JSON.parse(text); } catch { json = null; }

            if (!resp.ok) throw new Error(json?.error || `Delete failed ${resp.status}: ${text}`);

            console.log('[DELETE] success', json);
            this.isDisabled=false;
            this.key='';
            this.isEdit=false;
           
            
        } catch (e) {
            console.error('[DELETE] error', e);
        }
    }

    closeModal(){
            this.dispatchEvent(
                new CustomEvent('taskcreated')
            );

    }

   @track startTimeSelectedHour = null;
  @track startTimeSelectedMinute = null;
  @track startTimeAMPM = null;
  @track disableTimeButton=false;

loadTask() {

    getTasksById({ taskId: this.taskId })
        .then(result => {

            console.log('RESULT',JSON.stringify(result));

            if (!result || result.length === 0) {
                return;
            }

            const task = result[0];


            console.log('Task Record => ', JSON.stringify(task));

            // ----------------------------
            // Populate Task Title / Date / Time
            // ----------------------------
            this.taskRecord = {
                Title: task.Task_Tittle__c,
                TaskDate: task.Task_Date__c,
                TaskTime: task.Task_Time__c
            };

          const time = task.Task_Time__c;

           if (time !== null && time !== undefined) {

            const totalMinutes = Math.floor(time / (1000 * 60));

            let hour24 = Math.floor(totalMinutes / 60);
            let minute = totalMinutes % 60;

            const period = hour24 < 12 ? 'AM' : 'PM';

            this.startTimeAMPM = period;

            let hour12 = hour24 % 12;
            hour12 = hour12 === 0 ? 12 : hour12;

            this.startTimeSelectedHour = hour12;
            this.startTimeSelectedMinute = String(minute).padStart(2, '0');

            this.uitasktime =
                `${hour12}:${String(minute).padStart(2, '0')} ${this.startTimeAMPM}`;

            console.log('Hour:', this.startTimeSelectedHour);
            console.log('Minute:', this.startTimeSelectedMinute);
            console.log('AM/PM:', this.startTimeAMPM);
            console.log('Display:', this.uitasktime);
        }

            // ----------------------------
            // Populate Combobox / Textarea
            // ----------------------------
            this.statusValue = task.Status;
            this.priorityValue = task.Priority;
            this.commentsValue = task.Description;

            // ----------------------------
            // Reminder
            // ----------------------------
            this.isImmediate = task.Notify_Immediately__c;
            this.isBeforeTask = task.Notify_before_task_time__c;

            // ----------------------------
            // Assignment
            // ----------------------------
            this.isAssignToStaff = task.AssignToStaff__c;
            this.isLinkToShift = task.Link_to_Shift__c;

            this.selectedStaffId = task.Staff__c;
            this.selectedShiftId = task.ShiftwithStaff__c;

            // ----------------------------
            // Facilities
            // ----------------------------
            this.selctedMultipleFcailityValues =
                task.Facilities__c
                    ? task.Facilities__c.split(';')
                    : [];

            // ----------------------------
            // Roles
            // ----------------------------
            this.selectedRoleValueLabels =
                task.Roles__c
                    ? task.Roles__c.split(';')
                    : [];

            // ----------------------------
            // Notification Timing
            // ----------------------------
            if (task.Notify_before_task_time__c) {
                 this.notificationTiming = task.Notify_Before__c;

               /*  if (task.Notification_Hours__c == 3) {
                    this.notificationTiming = '3Hours';
                }
                else if (task.Notification_Hours__c == 24) {
                    this.notificationTiming = '1Day';
                }
                else if (task.Notification_Hours__c == 72) {
                    this.notificationTiming = '3Days';
                }
                else {
                    this.notificationTiming = 'Custom';
                    this.customHours = task.Notification_Hours__c;
                } */
            }

            // ----------------------------
            // Load staff if Assign to Staff
            // ----------------------------
            if (this.isAssignToStaff) {
               /*  this.fetchRoleOptions();

                setTimeout(() => {
                    this.fetchStaffs();
                }, 500); */
                 this.fetchSelectedStaff();
            }

            // ----------------------------
            // Load shifts if Link to Shift
            // ----------------------------
            if (this.isLinkToShift) {
                this.fetchParticipantShifts();
            }

            // Force refresh
            this.taskRecord = { ...this.taskRecord };

            console.log('Task Loaded Successfully');

        })
        .catch(error => {
            console.error('loadTask Error', JSON.stringify(error));
        });
}

showToast(title, message, variant) {
    this.dispatchEvent(
        new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        })
    );
}

handleTaskTime(event) {

    console.log('Time Picker Response', JSON.stringify(event.detail));

     const childData = event.detail;
    const displayTime = childData?.displaytime || "";
    const twentyFourHourFormat = childData?.twentyFourHourFormat || "";
    this.taskRecord.TaskTime = twentyFourHourFormat;
}


fetchSelectedStaff() {

    if (!this.selectedStaffId) {
        return;
    }

    getStaffById({ recordId: this.selectedStaffId })
        .then(result => {

            console.log('getStaffById',JSON.stringify(result));

            this.staffData = result.map((staff, index) => ({
                ...staff,
                serialNumber: index + 1,
                isSelected: true,
                roleNames: staff.StaffRoles__r
                    ? [...new Set(staff.StaffRoles__r.map(role => role.RoleName__c))].join(', ')
                    : '',
                email: staff.Email_Address__c || '',
                facilityName: staff.Staff_Facilities__r
                ? staff.Staff_Facilities__r
                    .map(f => f.Facility__r.Name)
                    .join(', ')
                : ''
            }));

            this.staffPagedData = [...this.staffData];
            this.staffTotalRecords = this.staffData.length;
            this.noRecordsFlag1 = this.staffData.length === 0;

            console.log('Selected Staff', JSON.stringify(this.staffPagedData));

        })
        .catch(error => {
            console.error(error);
        });
}


        
  



}