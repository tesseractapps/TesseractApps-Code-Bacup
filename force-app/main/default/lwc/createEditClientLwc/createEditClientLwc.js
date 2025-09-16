import { LightningElement, wire, api, track } from "lwc";
import { CurrentPageReference } from "lightning/navigation";
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getClientById from '@salesforce/apex/ClientDataController.getClientById';
import { refreshApex } from '@salesforce/apex';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import My_Resource from "@salesforce/resourceUrl/myResource";
import getEmployeeData from '@salesforce/apex/issueRegisterSearch.getEmployeeData';
import insertStaffRecords from '@salesforce/apex/ClientDataController.insertStaffRecords';
import getStaffData from '@salesforce/apex/ClientDataController.getStaffData';
import updateStaffAssignments from '@salesforce/apex/ClientDataController.updateStaffAssignments'; 
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import getStaffMembers from '@salesforce/apex/PreferredStaffController.getStaffMembers';
import getStaffRoleAssignment from '@salesforce/apex/PreferredStaffController.getStaffRoleAssignment';
import GOOGLE_API_KEY from '@salesforce/label/c.Google_Geocode_API_Key';
import getRoles from '@salesforce/apex/PreferredStaffController.getRoles';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo'; 

export default class CreateEditClientLwc extends NavigationMixin(LightningElement) {
  primary = My_Resource + '/myResource/images/Primary.svg';
  secondary = My_Resource + '/myResource/images/Secondary.svg';
  Search = My_Resource + '/myResource/images/Participants.svg';
  infoicon = My_Resource + '/myResource/images/Info_Icon.png';
  infoiconhover = My_Resource + '/myResource/images/Info_Icon_Hover.png';
  @api individualflag;
  @api companyflag;
  @api ndiscreateflag;
  @track detailsflag=true;
  @track addressflag=false;
  @track identificationflag;
  @track insuranceflag;
  @track participantflag;
  @track primaryflag;
  @track secondaryflag;
  @track detailseditflag=false;
  @track addresseditflag;
  @track identificationeditflag;
  @track insuranceeditflag;
  @track primaryeditflag;
  @track participanteditflag;
  @track editButtom = true;
  @track secondaryeditflag;
  @track clientData=[];
  wiredClientResult;
  @track imageerror;
  @track fileName;
  @track street1;
  @track city;
  @track country;
  @track province;
  @track postalcode;
  @track fullName;
  @track firstName='';
  @track lastName='';
  @track clientId;
  @track clientName;
  @track assignParticipant = false;
  @track staffOptions = [];    
  @track staffVal;  
  @track staffName=[];
  @track orgId;
  @track selectedRoles=[];
  @track OrgNisationRoles=[]; 
  @track facilityId = ''; 
  @track role = '';
  @track staffRecID;
  @api participantId;
  @track image;
  @track toggleValue;
  wiredStaffResult;
  @api faclist=[];
  @track editandBackButton = true;
  @track staffMembers = [];
  @track roles = [];
  @track fieldErrorMap = {};
  @track activeRoles = {};
  @track searchStaff = '';
  @track filteredStaffMembers = [];
  @track paginatedData = [];
  @track facilityPreferredName;
  @track participantPreferredName;
  @track showSpinner = false;
  originalStaffMembers = [];
  originalModifiedStaffMap = {};

  @track sectionFlags = {
    PartcipantDetails: true,
    Addressdetails: true,
    IdentificationDetails: true,
    InsuranceDetails: true,
    PrimaryContactDetails: true,
    SecondaryContactDetails: false, 
    Assignstaff: true,      
};

 @track sectionIcons = {
    PartcipantDetails: '\u2B9F', 
    Addressdetails: '\u2B9F',
    IdentificationDetails: '\u2B9F',
    InsuranceDetails: '\u2B9F',
    PrimaryContactDetails: '\u2B9F',
    SecondaryContactDetails: '\u2B9C', 
    Assignstaff: '\u2B9F',  
};

  @track sectionFlags1 = {
    PartcipantDetails1: true,
        Addressdetails1: true,
    IdentificationDetails1: true,
    InsuranceDetails1: true,
    PrimaryContactDetails1: true,
    SecondaryContactDetails1: false, 
    Assignstaff1: true, 
     
};
 @track sectionIcons1 = {
    PartcipantDetails1: '\u2B9F', 
     Addressdetails1: '\u2B9F',
    IdentificationDetails1: '\u2B9F',
    InsuranceDetails1: '\u2B9F',
    PrimaryContactDetails1: '\u2B9F',
    SecondaryContactDetails1: '\u2B9C', 
    Assignstaff1: '\u2B9F', 

};
@track facilityId;

    wiredStaffResult;
    wiredRolesResult;
    wiredAssignmentsResult;
    
    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;

    get logoUrl() {
        return this.tLogoUrl;
    }

    get imageUrl() {
        return this.tImageUrl;
    }

    async fetchRolesForStaff() {
        try {
            const result = await getStaffRoleAssignment({
                clientId: this.clientId
            });

            this.activeRoles = result;
            console.log('✅ Active roles (await):', JSON.stringify(this.activeRoles));
           

            // Transform to match LWC template expectations
            this.paginatedData = result.map((item) => {
                return {
                    userId: item.staffId,
                    nickName: item.staffName,
                    roles: item.roles ? item.roles.join(', ') : ''
                };
            });

            console.log('🔎 paginatedData after mapping:', JSON.stringify(this.paginatedData));
            console.log('this.participanteditflag >>', this.participanteditflag);
            if (this.participanteditflag != false) {
                await this.fetchStaffMembers(); // 🔁 Ensure this populates paginatedData
                this.showSpinner = false;
            }

        } catch (error) {
            console.error('❌ Error fetching staff roles:', error);
            this.showSpinner = false;
        }
    }

    async fetchStaffMembers() {
        try {
            const result = await getStaffMembers({ facilityId: this.facilityId });
            console.log('Staff data >>', result);
            this.processStaffData(result);
        } catch (error) {
            throw error;
        }
    }

    processStaffData(staffData) {
        this.staffMembers = staffData.map((staff, index) => {
            const staffMember = {
                Id: staff.Id,
                Name: staff.Display_Nickname__c,
                Email: staff.Email,
                Role__c: staff.Role__c,
                roleAssignments: {},
                rowClass: index % 2 === 0 ? 'slds-hint-parent' : 'slds-hint-parent slds-theme_shade'
            };
            return staffMember;
        });
    }

    async fetchRoles() {
        try {
            const result = await getRoles();
            console.log('Roles data >>', result);
            this.roles = result;
            this.loadAssignments();
        } catch (error) {
            throw error;
        }
    }

     get showInsurance() {
        // Example logic: NDIS = show all, Individual = hide insurance?, Company = hide insurance?
        return this.ndiscreateflag || this.individualflag;
    }

    get showIdentification() {
        return this.ndiscreateflag || this.individualflag;
    }

    get showPreferredStaff() {
        return this.ndiscreateflag; // Only for NDIS
    }


    loadAssignments() {
        if (this.staffMembers.length > 0 && this.roles.length > 0) {
            // this.staffMembers = this.staffMembers.map(staff => {
            //     const updatedStaff = { ...staff };
            //     updatedStaff.roleAssignments = {};
            //     this.roles.forEach(role => {
            //         updatedStaff.roleAssignments[role] = false;
            //     });
            //     return updatedStaff;
            // });
            this.staffMembers = this.staffMembers.map(staff => {
            const matching = this.activeRoles.find(ar => ar.staffId === staff.Id);
            const roleAssignments = {};

            if (matching && Array.isArray(matching.roles)) {
                matching.roles.forEach(role => {
                    roleAssignments[role] = true;
                });
            }

            return {
                ...staff,
                roleAssignments // This now contains the original roles
            };
        });

        this.filteredStaffMembers = [...this.staffMembers];
        }
    }


    processAssignments(assignmentData) {
        // Process the assignment data and update staff role assignments
        const assignmentMap = {};
        
        assignmentData.forEach(assignment => {
            if (!assignmentMap[assignment.AssigneeId]) {
                assignmentMap[assignment.AssigneeId] = {};
            }
            assignmentMap[assignment.AssigneeId][assignment.PermissionSetId] = true;
        });

        // Update staff members with their role assignments
        this.staffMembers = this.staffMembers.map(staff => {
            const updatedStaff = { ...staff };
            const staffAssignments = assignmentMap[staff.Id] || {};
            
            // Update role assignments
            Object.keys(updatedStaff.roleAssignments).forEach(roleId => {
                updatedStaff.roleAssignments[roleId] = !!staffAssignments[roleId];
            });
            
            return updatedStaff;
        });

        this.isLoading = false;
    }

    // Create flattened data structure for template iteration
    get staffRoleData() {
        const flatData = [];
        
        this.staffMembers.forEach(staff => {
            this.roles.forEach(role => {
                flatData.push({
                    staffId: staff.Id,
                    staffName: staff.Name,
                    roleId: role.Id,
                    roleName: role.Name,
                    hasRole: staff.roleAssignments && staff.roleAssignments[role.Id],
                    rowClass: staff.rowClass
                });
            });
        });
        
        return flatData;
    }

    // Group the flat data by staff for template iteration
    // get groupedStaffRoleData() {
    //     const staffList = this.searchStaff
    //         ? this.filteredStaffMembers
    //         : this.staffMembers;

    //     if (!staffList || !this.roles || this.roles.length === 0 || !this.activeRoles) {
    //         console.log('Missing staffMembers, roles, or activeRoles.');
    //         return [];
    //     }

    //     const grouped = [];
    //     const activeRoleMap = {};

    //     if (Array.isArray(this.activeRoles)) {
    //         this.activeRoles.forEach(item => {
    //             activeRoleMap[item.staffId] = new Set(item.roles);
    //         });
    //     } else if (this.activeRoles.staffId && Array.isArray(this.activeRoles.roles)) {
    //         activeRoleMap[this.activeRoles.staffId] = new Set(this.activeRoles.roles);
    //     }

    //     staffList.forEach((staff, staffIndex) => {
    //         const activeRolesForStaff = activeRoleMap[staff.Id] || new Set();
    //         const roleList = staff.Role__c ? staff.Role__c.split(';').map(r => r.trim()) : [];
    //         const assignedRoles = new Set(roleList);

    //         const staffData = {
    //             Id: staff.Id,
    //             Name: staff.Name,
    //             Email: staff.Email,
    //             rowClass: staff.rowClass,
    //             roleData: []
    //         };

    //         this.roles.forEach((roleName) => {
    //             const hasRoleInStaff = assignedRoles.has(roleName);
    //             const hasRole = activeRolesForStaff.has(roleName);

    //             staffData.roleData.push({
    //                 roleId: roleName,
    //                 roleName,
    //                 hasRole,
    //                 hasRoleinstaff: hasRoleInStaff
    //             });
    //         });
    //         console.log('Final staffData:', JSON.stringify(staffData, null, 2));
    //         grouped.push(staffData);
    //     });

    //     console.log(JSON.stringify(grouped, null, 2));
    //     return grouped;
    // }
    get groupedStaffRoleData() {
        const staffList = this.filteredStaffMembers || [];

        // console.log('staffList >>', JSON.stringify(staffList));
        // console.log('this.roles >>', JSON.stringify(this.roles));
        // console.log('this.roles.length >>', this.roles.length);
        // console.log('this.activeRoles >>', JSON.stringify(this.activeRoles));
        if (!staffList || !this.roles || this.roles.length === 0 || !this.activeRoles) {
            console.log('Missing staffMembers, roles, or activeRoles.');
            return [];
        }

        const grouped = [];
        const activeRoleMap = {};
        const debugLogs = [];

        // Build map: staffId → Set of active roles
        if (Array.isArray(this.activeRoles)) {
            this.activeRoles.forEach(item => {
                activeRoleMap[item.staffId] = new Set(item.roles);
            });
        } else if (this.activeRoles?.staffId && Array.isArray(this.activeRoles.roles)) {
            activeRoleMap[this.activeRoles.staffId] = new Set(this.activeRoles.roles);
        }

        staffList.forEach((originalStaff) => {
            const activeRolesForStaff = activeRoleMap[originalStaff.Id] || new Set();

            // Merge modified version (if any)
            const modified = this.modifiedStaffMap[originalStaff.Id];
            //console.log('modified >>', JSON.stringify(modified));
            //console.log('originalStaff >>', JSON.stringify(originalStaff));
           // console.log('activeRolesForStaff>>', JSON.stringify(activeRolesForStaff));
            const staff = modified ? {...originalStaff, ...modified } : originalStaff;

            const roleList = originalStaff.Role__c
                ? originalStaff.Role__c.split(';').map(r => r.trim())
                : [];
            const assignedRoles = new Set(roleList);

            // 🟡 Log debug info per staff
            debugLogs.push({
                staffId: staff.Id,
                name: staff.Name,
                activeRoles: Array.from(activeRolesForStaff),
                modifiedRoles: staff.roleAssignments ? Object.entries(staff.roleAssignments).filter(([_, v]) => v).map(([k]) => k) : [],
                roleAssignments: staff.roleAssignments || {}
            });

            const staffData = {
                Id: staff.Id,
                Name: staff.Name,
                Email: staff.Email,
                rowClass: staff.rowClass,
                roleData: []
            };

            this.roles.forEach((roleName) => {
                const hasRoleInStaff = assignedRoles.has(roleName);

                // ✅ Prioritize modified value if present
                let isChecked;
                if (staff.roleAssignments && staff.roleAssignments.hasOwnProperty(roleName)) {
                    isChecked = staff.roleAssignments[roleName];
                } else {
                    isChecked = activeRolesForStaff.has(roleName);
                }

                staffData.roleData.push({
                    roleId: roleName,
                    roleName,
                    hasRole: isChecked,
                    hasRoleinstaff: hasRoleInStaff
                });
            });

            grouped.push(staffData);
        });

        // ✅ Log full role comparison
    
       // console.log('✅ Final Grouped Data:', JSON.stringify(grouped, null, 2));
         console.log('📊 groupedStaffRoleData result length:', grouped.length);
         
        return grouped;
    }

    handleSearchStaffInput(event) {
        this.searchStaff = event.target.value.toLowerCase();

        if (!this.searchStaff) {
            this.filteredStaffMembers = [...this.staffMembers];
        } else {
            this.filteredStaffMembers = this.staffMembers.filter(staff =>
                staff.Name.toLowerCase().includes(this.searchStaff)
            );
        }
    }

    modifiedStaffMap = {};

    handleRoleToggle(event) {
        const staffId = event.target.dataset.staffId;
        const roleId = event.target.dataset.roleId;
        const isChecked = event.target.checked;

        let changedStaff = null;

        this.staffMembers = this.staffMembers.map(staff => {
            if (staff.Id === staffId) {
                const updatedStaff = { ...staff };
                updatedStaff.roleAssignments = { ...staff.roleAssignments };
                updatedStaff.roleAssignments[roleId] = isChecked;
                changedStaff = updatedStaff;
                return updatedStaff;
            }
            return staff;
        });

        // ✅ Store multiple modified staff entries
        if (changedStaff) {
            this.modifiedStaffMap[staffId] = changedStaff;
        }

        console.log('🗂️ Modified Staff Map:', JSON.stringify(this.modifiedStaffMap));
    }
/* 
    async updateRoleAssignment(staffId, roleId, isAssigned) {
        try {
            await updateStaffRoleAssignment({
                staffId: staffId,
                roleId: roleId,
                isAssigned: isAssigned
            });

            this.showToast(
                'Success',
                'Role assignment updated successfully',
                'success'
            );
        } catch (error) {
            // Revert the local change if the server update fails
            this.staffMembers = this.staffMembers.map(staff => {
                if (staff.Id === staffId) {
                    const revertedStaff = { ...staff };
                    revertedStaff.roleAssignments = { ...staff.roleAssignments };
                    revertedStaff.roleAssignments[roleId] = !isAssigned;
                    return revertedStaff;
                }
                return staff;
            });

            this.handleError('Error updating role assignment', error);
        }
    } */

handleSectionToggle1(event) {
  const sectionId = event.currentTarget.dataset.id;
  const sectionElement = this.template.querySelector(`[data-section="${sectionId}"]`);

  if (!this.sectionFlags1[sectionId]) {
      // First click: Set the section to true so it loads in the DOM
      this.sectionFlags1[sectionId] = true;
  } else {
      // From second click onwards: Just toggle the hidden-section class
      sectionElement.classList.toggle('hidden-section');
  }

  // Toggle the icon dynamically
  this.sectionIcons1[sectionId] = sectionElement.classList.contains('hidden-section') ? '\u2B9C' : '\u2B9F';
}
handleSectionToggle(event) {
  const sectionId = event.currentTarget.dataset.id;
  const sectionElement = this.template.querySelector(`[data-section="${sectionId}"]`);

  if (!this.sectionFlags[sectionId]) {
      // First click: Set the section to true so it loads in the DOM
      this.sectionFlags[sectionId] = true;
  } else {
      // From second click onwards: Just toggle the hidden-section class
      sectionElement.classList.toggle('hidden-section');
  }

  // Toggle the icon dynamically
  this.sectionIcons[sectionId] = sectionElement.classList.contains('hidden-section') ? '\u2B9C' : '\u2B9F';
}
handleMouseOver(event) {
  const img = event.target;
  img.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out'; // Add dissolve effect
  img.style.opacity = '0'; // Start fade-out for the current image

  setTimeout(() => {
      img.src = this.infoiconhover; // Change the image
      img.style.opacity = '1'; // Fade-in the new image
  }, 150); // Wait for the fade-out to complete
}

handleMouseOut(event) {
  const img = event.target;
  img.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out'; // Add dissolve effect
  img.style.opacity = '0'; // Start fade-out for the current image

  setTimeout(() => {
      img.src = this.infoicon; // Change back to the default image
      img.style.opacity = '1'; // Fade-in the default image
  }, 150); // Wait for the fade-out to complete
}


  @wire(CurrentPageReference)
  currentPageRef;

  @api propertyValue;
  get propertyValue() {
    return this.currentPageRef.state.c__propertyValue;
  }

  @api orgnisationId;
  get orgnisationId() {
    return this.currentPageRef.state.c__orgID;
  }

  backtoparticipant(event){
   /*  if (!this.orgnisationId) {
      console.error('Organisation ID is not defined.');
      return;
    }
    this[NavigationMixin.Navigate]({
        // Pass in pageReference
        type: 'comm__namedPage',
        //type: 'standard__component',
        attributes: {
          pageName: 'administration',
         // componentName: "c__clientDataWithPagination",
        },
        state: {
          c__propertyValue: "Clients",
          c__orgID:this.orgnisationId
        },
      });
      //refreshApex(this.wiredStaffResult); */
      const customEvent = new CustomEvent('myevent', {
        detail: { message: 'Hello from Child!' }
    });
    this.dispatchEvent(customEvent);
  }

  @track header = true; // Always true
  @track animationClass = ''; // Tracks the animation class
  
  toggleHeader(event) {
      event.stopPropagation(); // Prevent triggering the outside click listener when clicking the icon
      const gridElement = this.template.querySelector('.grid');
  
      if (gridElement.classList.contains('slide-in')) {
          // Slide out the header
          gridElement.classList.remove('slide-in');
          gridElement.classList.add('slide-out');
  
          // Hide the header after the animation completes
          setTimeout(() => {
              gridElement.style.visibility = 'hidden';
              console.log('Header is now hidden after sliding out.');
          }, 500); // Match the animation duration
      } else {
          // Slide in the header
          gridElement.style.visibility = 'visible'; // Ensure it is visible before sliding in
          gridElement.classList.remove('slide-out');
          gridElement.classList.add('slide-in');
  
          console.log('Header is now visible after sliding in.');
      }
  }
  handleOutsideClick(event) {
    const gridElement = this.template.querySelector('.grid');
    if (
        gridElement &&
        !gridElement.contains(event.target) && // Ensure click is outside the grid
        !event.target.closest('img') // Ensure click is not on the icon
    ) {
        if (gridElement.classList.contains('slide-in')) {
            // Slide out the header
            gridElement.classList.remove('slide-in');
            gridElement.classList.add('slide-out');
        }
    }
}

preventClose(event) {
    event.stopPropagation(); // Prevent triggering the outside click listener when clicking inside the grid
}
connectedCallback() {
  console.log('recordId ', this.propertyValue);
  //Manimala added 95-104
  organizationDetails().then(response => {    
    let orgRoles= response.listofPriceBook.Roles__c;
    //console.log('listofPriceBook:', response.listofPriceBook);
    this.facilityPreferredName = response.listofPriceBook.Facility_Preferred_Name_Formula__c;
    this.participantPreferredName = response.listofPriceBook.Participant_Preferred_Name_Formula__c;
    this.OrgNisationRoles = orgRoles.split(";").sort().map(rec => {
      return {
      value: rec,
      label: rec
      };
    });
  }) 
  this.clientId=this.participantId;
  //this.getStaffValues();    
  // This will trigger a refresh of the wired data.
  console.log('role 1 >>'+this.role);
  refreshApex(this.wiredStaffResult);
  document.addEventListener('click', this.handleOutsideClick.bind(this));
  document.body.style.overflowX = 'hidden';

}

handleErrorCss(event) {
    const field = event.target.fieldName;
    const isValid = event.target.reportValidity();
    console.log('isValid',isValid);

    this.fieldErrorMap[field] = !isValid;
}

    getFieldClass(fieldName) {
        return this.fieldErrorMap[fieldName] ? 'floating-label1' : 'floating-label';
    }
    get emailClass() {
        return this.getFieldClass('Email__c');
    }
     get DateOfBirthClass() {
        return this.getFieldClass('Date_Of_Birth__c');
    }
    get ContactNumberClass() {
        return this.getFieldClass('Contact_Number__c');
    }


@track noimage;
@wire(getClientById, { recordId: '$participantId' })
  wiredClient(result) {
    this.wiredClientResult = result;
    const { data, error } = result;
    if (data) {
        this.clientData = data;
        console.log('CLIENT DATA'+JSON.stringify(this.clientData));
        this.image = this.clientData[0].Picture__c;
        if(!this.image){
          this.noimage = true;
        }else{
           this.noimage = false;
        }
        console.log('image'+this.image);
        this.city = this.clientData[0].Address__City__s;
        this.country = this.clientData[0].Address__CountryCode__s;
        this.province = this.clientData[0].Address__StateCode__s;
        this.postalcode = this.clientData[0].Address__PostalCode__s;
        this.street1=this.clientData[0].Address__Street__s;
        this.lastName=this.clientData[0].Last_Name__c;
        this.firstName=this.clientData[0].First_Name__c;
        this.clientId = this.clientData[0].Id;
        this.clientName = this.clientData[0].Name;
        this.orgId = this.clientData[0].Organization_Name__c;
        this.facilityId = this.clientData[0].Facility__c;
        //this.role = this.clientData[0].Participant_Staff_Associations__r[0].Role__c;
        this.toggleValue = this.clientData[0].Status__c;
        console.log('Organisation Name >>'+ this.orgId);
        console.log('CleintId >>'+this.clientId);
        console.log('Client Name >>'+this.clientName);
        console.log('Client data:', JSON.stringify(this.clientData));

        if (this.clientData[0].Participant_Staff_Associations__r && this.clientData[0].Participant_Staff_Associations__r.length > 0) {
          this.role = this.clientData[0].Participant_Staff_Associations__r[0].Role__c;  // Set the first role
          console.log('Role from client data >>' + this.role);
      } else {
          this.role = '';  // No role selected
      }
      refreshApex(this.wiredClientResult);
    } else if (error) {
        this.handleError(error);
    }
  }

  @wire(getStaffData, { clientId: '$clientId', facilityId: '$facilityId', role: '$role' })
    wiredStaffData(result) {
       this.selectedRoles=[];
        this.wiredStaffResult = result; // Store the result for later use in refreshApex
           console.log('result in wire method '+JSON.stringify(result));
        const { error, data } = result;
        if (data) {
            // Process the data
            this.staffOptions = data.map(record => ({
                value: record.Id,
                label: record.Name
            }));

            console.log('Staff options: ' + JSON.stringify(this.staffOptions));

            // Assign the first staff's label to staffVal if available
            if (this.staffOptions.length > 0) {
                this.staffVal = this.staffOptions[0].label;
            }

            // Default to pre-assigned staff if no roles selected
            if (!this.selectedRoles || this.selectedRoles.length === 0) {
                this.selectedRoles = data
                    .filter(record => record.isAssigned ==true)  // Assuming 'isAssigned' indicates if the staff is already assigned
                    .map(record => record.Id);
            }
            console.log('Selected staff: ' + JSON.stringify(this.selectedRoles));
        } else if (error) {
            console.error('Error fetching staff values: ', error);
        }
    }


 
  //Manimala added 110-121
  handleFacilityChange(event) {    
    //  console.log('facility onchange '+(event.target)) ;                 
      this.facilityId = event.target.value; // Capture Facility ID
      //this.getStaffValues(); // Fetch staff based on the new facility
      refreshApex(this.wiredStaffResult);
      console.log('Selected facility >> ' + this.facilityId);
  }
  handleChangeRole(event) {
    //console.log('onchange '+JSON.stringify(event.detail));
    this.role = event.detail.value; // Handle combobox value change
    console.log('Selected Role >> ' + this.role);
    //this.getStaffValues();
    refreshApex(this.wiredStaffResult);
  
}
@track toggleflag = false;
handleStatus(event) {
  this.previousToggleValue = this.toggleValue;
  console.log('previousToggleValue'+this.previousToggleValue);
  this.toggleflag = true;
        
  this.toggleValue = event.target.checked; 
  
  console.log('Toggle status:', this.toggleValue);

}

  handleSubmit(event){
    //  console.log('in submit');
    event.preventDefault();// stop the form from submitting
     if (!this.facilityId) {
            console.error('Staff Facility is required.');
            // Optionally show a toast or error message on UI
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please select a Facility before submitting.',
                    variant: 'error',
                })
            );
            return; // exit the method early
        }
    const fields = event.detail.fields;
    // alert(JSON.stringify(fields));
    fields.Address__Street__s = this.street1;
    fields.Address__City__s =  this.city;
    fields.Address__StateCode__s = this.province;
    fields.Address__CountryCode__s = 'AU';
    fields.Address__PostalCode__s = this.postalcode;
    // fields.Pre_Tax_Calculator__c = this.preTaxForSubmit;
      fields.Facility__c=this.facilityId;
    fields.Name = this.fullName;
    fields.Status__c = this.toggleValue;
    console.log('Participant Name >'+fields.Name);
    console.log('After fields>>'+JSON.stringify(fields));
    const fullAddress = `${this.street}, ${this.city} ${this.postalcode}, AU`;
        const apiKey = GOOGLE_API_KEY;
        console.log('Fetching geocode for:', fullAddress);
        
        const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;
    
        console.log('Fetching geocode for:', fullAddress);
    
        fetch(endpoint)
            .then(response => response.json())
            .then(data => {
                console.log('Geocode API response:', data);
    
                if (data.status === 'OK' && data.results.length > 0) {
                    const location = data.results[0].geometry.location;
                    fields.Location__Latitude__s = location.lat;
                    fields.Location__Longitude__s = location.lng;
    
                    console.log('Parsed coordinates:', location.lat, location.lng);
                } else {
                    console.warn('No geocode results found or status not OK');
                }
    
                // 🚀 Submit the form AFTER geocode response
                this.template.querySelector('lightning-record-edit-form').submit(fields);
            })
            .catch(error => {
                console.error('Error calling Geocode API:', error);
                // Submit form even if geocode failed
                this.template.querySelector('lightning-record-edit-form').submit(fields);
            });
      
  }

  handleSuccess(event) { 
    const toastEvent = new ShowToastEvent({
        title: "Success",
        message: "Changes Saved Successfully",
        variant: "success"
    });
    //this.fetchParticipant();
    this.dispatchEvent(toastEvent);
    this.toggleflag = false;
    this.handleflag();
    refreshApex(this.wiredClientResult);
    let staffRecID=event.detail.id;
    console.log('filelength'+this.fileName.length);
    if(this.fileName.length > 0){
      
    uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId:staffRecID, obj:'client'}).then(result => {
       this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success!!',
                message: this.file.name + ' - Uploaded Successfully!!!',
                variant: 'success',
            }),
        );
       
    })
  }
    setTimeout(() => {
      refreshApex(this.wiredClientResult);
    }, 2000);
    console.log('role>>'+this.role);

    insertStaffRecords({ clientId: staffRecID, roleId: this.role,selectedStaff: this.staffName}).then(() => {
      this.participanteditflag=false;  
      /* this.dispatchEvent(
         new ShowToastEvent({
            title: 'Success',
            message: 'Records inserted successfully',
            variant: 'success'
        })
      );   */
      //this.participantflag = true; 
      //this.getStaffValues();
      console.log('role 2 >>'+this.role);
      refreshApex(this.wiredStaffResult);
      this.selectedRoles = this.staffName;  
    })
    .catch(error => {
   // Handle error
      console.error('Error inserting record:', error);
    }); 
    
  }
  addressInputChange(event) {
    const address = event.detail;
    console.log('address'+JSON.stringify(address));
    if (!address.street || !address.city || !address.postalCode || !address.province) {
    this.errorMessage = 'Please provide complete address information.';
    this.saveButtonDisable = true;
    }
    else{
      this.errorMessage = '';
      this.saveButtonDisable = false;
      //  console.log('event detail'+JSON.stringify(event.detail)); 
      this.street1=event.detail.street;
      
      this.city=event.detail.city;
      this.postalcode=event.detail.postalCode;
      this.province=event.detail.province;
      this.country=event.detail.country;
    }
  }
  @track previousToggleValue;
  handleflag(){
      if (this.detailseditflag) {
        this.detailseditflag = false; 
        this.detailsflag = true;      
      } else if (this.addresseditflag) {
          this.addresseditflag = false; 
          this.addressflag = true; 
      } else if (this.identificationeditflag) {
          this.identificationeditflag = false; 
          this.identificationflag = true; 
      } else if (this.insuranceeditflag) {
          this.insuranceeditflag = false; 
          this.insuranceflag = true; 
      } else if (this.primaryeditflag) {
          this.primaryeditflag = false; 
          this.primaryflag = true; 
      } else if (this.secondaryeditflag) {
          this.secondaryeditflag = false; 
          this.secondaryflag = true; 
      } else if (this.participanteditflag) {
        this.participanteditflag = false;
        this.editButtom = true; 
        this.participantflag = true;
        this.editandBackButton = true; 
    }
      
  }
/* @wire(getClientById, { recordId: this.propertyValue})
    wiredClient({ error, data }) {
        if (data) {
            this.clientData = data; 
          console.log('client data'+this.clientData);
        } else if (error) {
            this.handleError(error); // Call the custom error handling method
        }
    } */

  

  handleError(event) {
    event.preventDefault(); // Prevent default UI (red errors under fields)
    this.removeRadius = true;
    this.fieldErrorMap = {};
    let message = 'An unknown error occurred.';
    const detail = event.detail;
    const errorMessages = [];
    
    // 1. Record-level errors (e.g. from Apex)
    const recordErrors = detail?.output?.errors;
    if (recordErrors && recordErrors.length > 0) {
        recordErrors.forEach(err => {
            if (err.message) {
                errorMessages.push(err.message);
            }
        });
    }

    // 2. Field-level errors (e.g. validation errors on fields)
    const fieldErrors = detail?.output?.fieldErrors;
    if (fieldErrors) {
        Object.keys(fieldErrors).forEach(fieldName => {
            fieldErrors[fieldName].forEach(error => {
                errorMessages.push(`${fieldName}: ${error.message}`);
            });
            this.fieldErrorMap[fieldName] = true;
        });
    }

    // 3. Top-level message fallback
    if (errorMessages.length === 0 && detail?.message) {
        errorMessages.push(detail.message);
    }

    // Final combined message
    message = errorMessages.join('\n');

    // Show toast
    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Update Failed',
            message: message,
            variant: 'error',
            
        })
    );
}
  handleeditClose(event){
    this.searchStaff = '';
    if(this.toggleflag)
    {
     this.toggleValue = this.previousToggleValue;
     console.log('toggleflag'+this.toggleflag);
     console.log('Toggle status INSIDE IF:', this.toggleValue);
    }
     console.log('Toggle status OUTSIDE IF:', this.toggleValue);
    this.toggleflag = false;
    this.handleflag();
    
     if (this.participanteditflag) {
        // ✅ Revert all edited data
        this.staffMembers = this.originalStaffMembers.map(staff => ({
            ...staff,
            roleAssignments: { ...staff.roleAssignments }
        }));

        this.filteredStaffMembers = [...this.staffMembers];

        this.modifiedStaffMap = {}; // ✅ Clear unsaved changes

        // ✅ Reset edit UI
        this.participanteditflag = false;
        this.editandBackButton = true;
        this.editButtom = true;

        console.log('🔄 Participant edit cancelled – data reverted.');
    }
   // this.selectedRoles = [...this.originalSelectedRoles];
    this.staffOptions =  [...this.originalStaffOptions];
    this.selectedRoles =[];
    // this.modifiedStaffMap = {};
    

    // ❗ Reset to original data (if needed)
    //this.filteredStaffMembers = [...this.staffMembers];
  }
  
  triggerFileInput() {
    this.template.querySelector('input[type="file"]').click();
  }
  handledetails(event){
    this.detailsflag=true;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = false;
    this.participanteditflag=false;
    this.editButtom = true;
    this.editandBackButton = true;
  }
  handleaddress(event){
    this.detailsflag=false;
    this.addressflag=true;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = false;
    this.participanteditflag=false;
    this.editButtom = true;
    this.editandBackButton = true;
  }
  handleidentification(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=true;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = false;
    this.participanteditflag=false;
    this.editButtom = true;
    this.editandBackButton = true;
  }
  handleinsurance(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=true;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = false;
    this.participanteditflag=false;
    this.editButtom = true;
    this.editandBackButton = true;
  }
  handleprimary(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=true;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = false;
    this.participanteditflag=false;
    this.editButtom = true;
    this.editandBackButton = true;
  }
   
  handleParticipant(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = true;
    this.participanteditflag=false;
    this.editButtom = true;
    this.editandBackButton = true;
    //this.getStaffValues();
    console.log('role 3 >>'+this.role);
    //refreshApex(this.wiredStaffResult);
    this.fetchRolesForStaff();
  }
  handlesecondary(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=true;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = false;
    this.participanteditflag=false;
    this.editButtom = true;
    this.editandBackButton = true;
  }
  
  async handleeditdetails() {
    if (this.detailsflag) {
        this.detailseditflag = true;
    } else if (this.addressflag) {
        this.addresseditflag = true;
    } else if (this.identificationflag) {
        this.identificationeditflag = true;
    } else if (this.insuranceflag) {
        this.insuranceeditflag = true;
    } else if (this.primaryflag) {
        this.primaryeditflag = true;
    } else if (this.secondaryflag) {
        this.secondaryeditflag = true;
    } else if (this.participantflag) {
        this.showSpinner = true;
        this.participanteditflag = true;
        this.participantflag = false;
        this.editandBackButton = false;
        this.editButtom = false;

        this.modifiedStaffMap = {};
        this.searchStaff = '';
        // this.originalStaffMembers = JSON.parse(JSON.stringify(this.staffMembers));
        // this.originalModifiedStaffMap = JSON.parse(JSON.stringify(this.modifiedStaffMap));
       this.originalStaffMembers = this.staffMembers.map(staff => ({
            ...staff,
            roleAssignments: { ...staff.roleAssignments }
        }));

        this.originalModifiedStaffMap = Object.fromEntries(
            Object.entries(this.modifiedStaffMap).map(([key, staff]) => [
                key,
                { ...staff, roleAssignments: { ...staff.roleAssignments } }
            ])
        );

       
        //this.originalSelectedRoles = [...this.selectedRoles];
        //this.originalstaffoptions = [...this.staffoptions];

        /* try {
            await this.fetchRolesForStaff();
            await this.fetchStaffMembers();
            await this.fetchRoles();
        } catch (error) {
            console.error('Error in fetching data during edit:', error);
            this.handleError('Error loading staff or roles', error);
        } */

            // await Promise.all([
            //     this.fetchRoles(),
            //     this.fetchRolesForStaff()
            // ]);
            try {
                // 🔁 Force data load in sequence
                await this.fetchRoles();
                await this.fetchRolesForStaff();   // will call fetchStaffMembers() internally

                // ✅ Make sure filtered list is set
                this.filteredStaffMembers = [...this.staffMembers];

                console.log('✅ Data loading completed.');
            } catch (err) {
                console.error('❌ Error loading roles/staff:', err);
            }
    }

    this.fileName = '';
 }

 handleFormLoad(event) {
    const record = event.detail.records;
    const recordId = Object.keys(record)[0];
    this.facilityId = record[recordId].fields.Facility__c.value;
    console.log('✅ Facility ID:', this.facilityId);
}

 /*  handleeditdetails(event){
    this.detailsflag=true;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=true;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.imageerror='';
    this.participantflag = false;
    this.participanteditflag=false;
    this.fileName='';
    console.log('FILENAME'+this.fileName);
  }
  handleeditaddress(event){
    this.detailsflag=false;
    this.addressflag=true;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=true;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.street=this.clientData.Address__Street__s;
    this.participantflag = false;
    this.participanteditflag=false;
    this.fileName='';
    console.log('FILENAME'+this.fileName);
  }
  handleeditidentification(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=true;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=true;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = false;
    this.participanteditflag=false;
    this.fileName='';
    console.log('FILENAME'+this.fileName);
  }
  handleeditinsurance(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=true;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=true;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = false;
    this.participanteditflag=false;
    this.fileName='';
    console.log('FILENAME'+this.fileName);
  }
  handleeditparticipant(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = true;
    this.participanteditflag=true;
    this.fileName='';
    console.log('FILENAME'+this.fileName);
    //this.getStaffValues(); 
    console.log('role 4 >>'+this.role);
   refreshApex(this.wiredStaffResult);
 
  }
  handleeditprimary(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=true;
    this.secondaryeditflag=false;
    this.participantflag = true;
    this.participanteditflag=false;
    this.fileName='';
    console.log('FILENAME'+this.fileName);
  }
  handleeditsecondary(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=true;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=true;
    this.participantflag = false;
    this.participanteditflag=false;
    this.fileName='';
  } */
  get detailsClass(){
    return (this.detailsflag || this.detailseditflag) ? 'menu-item1' : 'menu-item';
  }
  get addressClass(){
    return (this.addressflag || this.addresseditflag) ? 'menu-item1' : 'menu-item';
  }
  get identificationClass(){
    return (this.identificationflag || this.identificationeditflag) ? 'menu-item1' : 'menu-item'; 
  }
  get insuranceClass(){
    return (this.insuranceflag || this.insuranceeditflag) ? 'menu-item1' : 'menu-item';
  }
  get primaryClass(){
    return (this.primaryflag || this.primaryeditflag) ? 'menu-item1' : 'menu-item';
  }
  get participantClass(){
    return (this.participantflag || this.participanteditflag) ? 'menu-item1' : 'menu-item';
  }

  onFileUpload(event) {       
    this.isattachError=false;
    if (event.target.files.length > 0) {
        this.selectedFilesToUpload = event.target.files;      
        this.file = this.selectedFilesToUpload[0];
        this.fileName = this.selectedFilesToUpload[0].name.split(" ").join("");
        this.fileType = this.selectedFilesToUpload[0].type;
        this.fileSize = this.selectedFilesToUpload[0].size;     
       
        if (!this.fileType.startsWith('image/')) {
          this.isattachError = true;
          this.imageerror='Only image files are allowed';
          return;
      }
        
        if (this.file.size > this.MAX_FILE_SIZE || this.file.size < this.MIN_FILE_SIZE) {  
            this.isattachError=true;
        }
        //create an intance of File
        this.fileReaderObj = new FileReader();

        //this callback function in for fileReaderObj.readAsDataURL
        this.fileReaderObj.onloadend = (() => {        
            //get the uploaded file in base64 format
            let fileContents = this.fileReaderObj.result;
            fileContents = fileContents.substr(fileContents.indexOf(',')+1);
            
            //read the file chunkwise
            let sliceSize = 1024;           
            let byteCharacters = atob(fileContents);
            let bytesLength = byteCharacters.length;
            let slicesCount = Math.ceil(bytesLength / sliceSize);                
            let byteArrays = new Array(slicesCount);
            for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
                let begin = sliceIndex * sliceSize;
                let end = Math.min(begin + sliceSize, bytesLength);                    
                let bytes = new Array(end - begin);
                for (let offset = begin, i = 0 ; offset < end; ++i, ++offset) {
                    bytes[i] = byteCharacters[offset].charCodeAt(0);         
                }
                byteArrays[sliceIndex] = new Uint8Array(bytes);
            }
            
            //from arraybuffer create a File instance
            this.myFile =  new File(byteArrays, this.fileName, { type: this.fileType });
            
            //callback for final base64 String format
            let reader = new FileReader();
            reader.onloadend = (() => {
                let base64data = reader.result;
                this.base64FileData = base64data.substr(base64data.indexOf(',')+1);
            });
            reader.readAsDataURL(this.myFile);                                 
        });
        this.fileReaderObj.readAsDataURL(this.file);
    }
    //this.showSpinner = false;
   /*  console.log('fileName>>',this.fileName);
    console.log('file prepared');
   */
   
  }
  handleNameChange(event){
    if(event.target.name == 'fname') {
        this.firstName = '';
        let inputValue = event.target.value;
        inputValue = inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
        this.firstName =inputValue;
    }
    if(event.target.name == 'lname') {
        this.lastName = '';
        let inputValue = event.target.value;
        inputValue = inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
        this.lastName =inputValue;

    }
    if((this.firstName != undefined || this.firstName != NULL) || (this.lastName != undefined || this.lastName != NULL)){
        this.fullName = this.firstName +' '+ this.lastName;
    }
  }
  @track originalstaffoptions = [];
  @track originalselectedroles = [];

  handleStaffChange(event) {
   /*  this.originalstaffoptions = this.staffOptions;
    this.originalselectedroles = this.selectedRoles;
    console.log('this.origiinalselectedroles'+JSON.stringify(this.originalselectedroles));
    console.log('this.originalstaffoptions'+JSON.stringify(this.originalstaffoptions)); */
    this.selectedRoles = event.detail.value;
    console.log('Updated selected roles: ' + JSON.stringify(this.selectedRoles));
    //this.handleUpdateStaff();
  }

  // Update the backend with selected roles
  handleUpdateStaff() {
        console.log('Client Id >> ', this.clientId);
        console.log('Modified Staff Map >> ', JSON.stringify(this.modifiedStaffMap));

        const modifiedStaffList = Object.values(this.modifiedStaffMap);

        // Prepare payload (only modified records)
        const assignmentPayload = modifiedStaffList.map(staff => ({
            Id: staff.Id,
            Name: staff.Name,
            roleAssignments: staff.roleAssignments,
            rowClass: staff.rowClass
        }));

        const serializedPayload = JSON.stringify(assignmentPayload);
        console.log('assignmentPayload >> ', serializedPayload);

        // 🔁 Call Apex
        updateStaffAssignments({
            clientId: this.clientId,
            assignmentsJSON: serializedPayload
        })
        .then(() => {
            console.log('✅ Successfully updated staff assignments.');
            this.showToast('success', 'Staff Successfully Updated');
            this.participanteditflag = false;
            this.editButtom = true;
            this.editandBackButton = true;
            this.participantflag = true;
            this.fetchRolesForStaff();
            // ✅ Clear modified staff map
            this.modifiedStaffMap = {};
            this.searchStaff = '';
        })
        .catch(error => {
            console.error('❌ Error updating staff assignments:', error);
        });
    }

    showToast(variant, message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: variant === 'success' ? 'Success' : 'Error',
                message: message,
                variant: variant,
                mode: 'dismissable'
            })
        );
    }



}