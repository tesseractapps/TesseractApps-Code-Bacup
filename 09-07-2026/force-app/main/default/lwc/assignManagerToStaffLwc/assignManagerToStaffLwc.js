import { LightningElement, api, track } from 'lwc';
import getStaffsByOrg from '@salesforce/apex/StaffController.getStaffsByOrg';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import updateLeaveApprover from '@salesforce/apex/StaffController.updateLeaveApprover';

export default class AssignManagerToStaffLwc extends LightningElement {
    @api orgId;
    @track FacilityId;
    @track staff=[];
    @track allStaff = [];
    @track searchKey = '';

    

        get staffOptions() {
            console.log('this.staff',this.staff.length);
    return (this.staff || [])
        .filter(s => {
            const t = s.usertype;
            return t === 'NDIS Org Admin' ||
                   t === 'Roster Manager' ||
                   t === 'ICT Admin' ||
                   t === 'Facility Admin'
                   
        })
        .map(s => ({
            label: s.name,
            value: s.id
        }));
}




     connectedCallback() {
         this.FacilityId = localStorage.getItem('defaultFacilityId');

         this.loadStaff();
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

backToHome(event){
         
        const customEvent = new CustomEvent('childevent', {
            detail: { message: 'Hello from Child!' }
        });
        this.dispatchEvent(customEvent);
    
      }

  
       

    loadStaff() {
    this.isLoading = true;

    getStaffsByOrg({ recordId: this.orgId, FacilityId: this.FacilityId })
        .then(result => {
            console.log('Raw Apex Result:', JSON.stringify(result));
            console.log('Total Records:', result.length);

            const staffNameMap = {};
            (result || []).forEach(rec => {
                staffNameMap[rec.Id] = rec.Display_Nickname__c;
            });

            this.staff = (result || []).map((rec, index) => {
               
                const displayName = rec.Display_Nickname__c; 

                // INITIALS
                const initials = displayName
                    .split(' ')
                    .map(word => word.charAt(0))
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                // ROLES (pick first active role)
                let roleName = '';
                if (rec.StaffRoles__r && rec.StaffRoles__r.length > 0) {
                    const activeRole = rec.StaffRoles__r.find(r => r.Active__c);
                    roleName = activeRole ? activeRole.RoleName__c : '';
                }

                const managerId = rec.Manager__c || '';
                const managerName = managerId ? staffNameMap[managerId] : '—';

                return {
                    id: rec.Id,

                    initials: initials,
                    Status:rec.Status__c ? 'Active' : 'Inactive',
                    Contact:rec.Contact_Number__c,
                     activeRolesDisplay: rec.StaffRoles__r && rec.StaffRoles__r.length > 0
                            ? rec.StaffRoles__r.map(r => r.RoleName__c).join(', ')
                            : '',

                    name: displayName,

                    email: rec.Email_Address__c || '—',

                    department: rec.Facility__r?.Name || '—',

                    departmentClass: 'staff-badge staff-badge_engineering', // static / optional

                    avatarClass: `staff-avatar avatar-color-${(index % 6) + 1} slds-m-right_small`,

                    position: rec.SelectedRole__c || '—',

                    type: rec.Type_of_Employe__c || '—',

                    reportsTo: managerName,
                    usertype:rec.User_Type__c || '',

                    reportsNote: '',

                    role: roleName,
                    hasProfilePic: !!rec.picture__c,
                    profilePicUrl: rec.picture__c,
                    isEditing: false,
                    selectedStaffId: rec.Manager__c || '',
                };
            });

            this.allStaff = [...this.staff];
            this.applyStaffSearch();

            console.log('Mapped UI Staff:', JSON.stringify(this.staff));
        })
        .catch(err => {
            this.error = err;
            console.error('Error loading staff:', err);
        })
        .finally(() => {
            this.isLoading = false;
        });
}

  @track assignflag=false;
  @track currentStaffId;
  @track ManagerStaffId;

handleEditClick(event) {
    this.assignflag=true;
     this.currentStaffId = event.currentTarget.dataset.id;
    this.ManagerStaffId = event.currentTarget.dataset.manageid;
     console.log(' this.currentStaffId', this.currentStaffId);
   /*  const rowId = event.currentTarget.dataset.id;

    this.staff = this.staff.map(row => ({
        ...row,
        isEditing: row.id === rowId
    })); */
}

handleAssignClose(){
  this.assignflag=false;
}

handleStaffChange(event) {
   /*  const rowId = event.currentTarget.dataset.id;
    const value = event.detail.value;

    this.staff = this.staff.map(row =>
        row.id === rowId
            ? { ...row, selectedStaffId: value }
            : row
    ); */
     this.ManagerStaffId = event.detail.value;
    console.log(' this.ManagerStaffId', this.ManagerStaffId);
}

handleSave(event) {
    const rowId = event.currentTarget.dataset.id;
    const row = this.staff.find(r => r.id === rowId);

    if (!this.ManagerStaffId) {
        this.showToast('Error', 'Please select Reporting Manager', 'error');
        return;
    }

     updateLeaveApprover({
            staffId:  this.currentStaffId,
            approverId:  this.ManagerStaffId
        })
    .then(() => {
        this.showToast('Success', 'Leave approver updated successfully', 'success');

      /*   this.staff = this.staff.map(r =>
            r.id === rowId
                ? {
                    ...r,
                    reportsTo: this.staff.find(s => s.id === row.selectedStaffId)?.name,
                    isEditing: false
                }
                : r
        ); */
         this.assignflag=false;
        this.loadStaff();
    })
    .catch(error => {
        console.error(error);
        this.showToast('Error', 'Failed to update approver', 'error');
    });
}

/* handleSearch(event) {
    const searchKey = event.target.value.toLowerCase();
    console.log('Search Key:', searchKey);


    if (!searchKey) {
        this.staff = [...this.allStaff];
        return;
    }

    this.staff = this.allStaff.filter(row => {
        const name = row.name?.toLowerCase() || '';
        const email = row.email?.toLowerCase() || '';

        return (
            name.includes(searchKey) ||
            email.includes(searchKey)
        );
    });
}  */

    handleSearch(event) {
    this.searchKey = (event.target.value || '').toLowerCase().trim();
    console.log('Search Key:', this.searchKey);
    this.applyStaffSearch();
}


applyStaffSearch() {
    if (!this.searchKey) {
        this.staff = [...this.allStaff];
        return;
    }

    this.staff = this.allStaff.filter(s =>
        (s.name && s.name.toLowerCase().includes(this.searchKey)) ||
        (s.email && s.email.toLowerCase().includes(this.searchKey))
    );
}







    
    
}