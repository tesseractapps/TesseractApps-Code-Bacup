import { LightningElement, api, track, wire } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import fetchFacilitiess from "@salesforce/apex/ClientSearchController.fetchFacilitiess";
import statusClient from "@salesforce/apex/ClientDataController.statusClient";
import uploadFile from "@salesforce/apex/AWSS3FileUploadController.uploadFile"; // Manimala added this
import getStaffData from "@salesforce/apex/ClientDataController.getStaffData";
import organizationDetails from "@salesforce/apex/InvoiceHandler.organizationDetails";
import insertStaffRecords from "@salesforce/apex/ClientDataController.insertStaffRecords";
import { refreshApex } from "@salesforce/apex";
import getClientById from "@salesforce/apex/ClientDataController.getClientById";
import updateStaffAssignments from "@salesforce/apex/ClientDataController.updateStaffAssignments";
import getCurrentLoggedUserInfo from "@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo";
import getFacilityCurrentUser from "@salesforce/apex/PortalUserController.getFacilityCurrentUser";
import getFacilityData from "@salesforce/apex/HrHomeHandler.fetchFacilitiess";
import getStaffRoleAssignment from "@salesforce/apex/PreferredStaffController.getStaffRoleAssignment";
import getStaffMembers from "@salesforce/apex/PreferredStaffController.getStaffMembers";
import getRoles from "@salesforce/apex/PreferredStaffController.getRoles";

export default class ClientDetail extends NavigationMixin(LightningElement) {
  @api clientId = "";
  @api individualflag;
  @api companyflag;
  @api ndiscreateflag;
  @track objectApiName = "Client__c";
  activeSections = [
    "ClientDetails",
    "IdentificationDetails",
    "InsuranceDetails",
    "Address",
    "PrimaryContact",
    "SecondaryContact",
    "StaffDetails"
  ];
  @track ParticpantRecordForm = false;
  @track errorMessage = "";
  @track saveButtonDisable = false;
  @track street;
  @track city;
  @track country;
  @track province;
  @track postalcode;
  @api recordId;
  @track participantJson = {};
  @track status;
  @api selectedName;
  @track fullName;
  @track lastName;
  @track firstName;
  @track fileReaderObj; // Manimala added these 27 to 36
  @track base64FileData;
  @track fileName;
  @track file;
  @track myFile;
  @track fileType;
  @track fileSize;
  @track selectedFilesToUpload = [];
  @track isattachError = false;
  @track showSpinner = false;
  @track OrgNisationRoles = [];
  @track facilityId = "";
  @track role = "";
  @track staffName;
  @track staffOptions = [];
  @track selectedRoles = [];
  @track staffRecID;
  wiredStaffResult;
  wiredClientResult;
  @track isDisabled = true;
  @track error;
  @track staffVal;
  //  @track clientData=[];
  @track street1;
  @track clientName;
  @api faclist1 = [];
  @track facilityOptions = [];
  // @track userFacilities=[];
  @track finalListFacilities = [];
  @track facilityCheckboxOptions = [];
  @track staffDetailsTemplate = false;
  @track fieldErrorMap = {};
  @track serializedPayload;
  @track facilityPreferredName;
  @track participantPreferredName;

  //@track orgId;

  @track sectionFlags = {
    PartcipantDetails: true,
    Addressdetails: false,
    IdentificationDetails: false,
    InsuranceDetails: false,
    PrimaryContactDetails: false,
    SecondaryContactDetails: false,
    Assignstaff: false,

    PartcipantDetails1: true,
    Addressdetails1: false,
    IdentificationDetails1: false,
    InsuranceDetails1: false,
    PrimaryContactDetails1: false,
    SecondaryContactDetails1: false,
    Assignstaff1: false
  };

  @track sectionIcons = {
    PartcipantDetails: "\u2B9F",

    Addressdetails: "\u2B9C",
    IdentificationDetails: "\u2B9C",
    InsuranceDetails: "\u2B9C",
    PrimaryContactDetails: "\u2B9C",
    SecondaryContactDetails: "\u2B9C",
    Assignstaff: "\u2B9C",

    PartcipantDetails1: "\u2B9F",
    Addressdetails1: "\u2B9C",
    IdentificationDetails1: "\u2B9C",
    InsuranceDetails1: "\u2B9C",
    PrimaryContactDetails1: "\u2B9C",
    SecondaryContactDetails1: "\u2B9C",
    Assignstaff1: "\u2B9C"
  };

  async fetchRolesForStaff() {
    try {
      const result = await getStaffRoleAssignment({
        clientId: this.clientId
      });

      this.activeRoles = result;
      console.log("✅ Active roles (await):", JSON.stringify(this.activeRoles));

      // Transform to match LWC template expectations
      this.paginatedData = result.map((item) => {
        return {
          userId: item.staffId,
          nickName: item.staffName,
          roles: item.roles ? item.roles.join(", ") : ""
        };
      });

      console.log(
        "🔎 paginatedData after mapping:",
        JSON.stringify(this.paginatedData)
      );

      await this.fetchStaffMembers(); // 🔁 Ensure this populates paginatedData
    } catch (error) {
      console.error("❌ Error fetching staff roles:", error);
    }
  }

  async fetchStaffMembers() {
    console.log("this.facilityId >>", this.facilityId);
    try {
      const result = await getStaffMembers({ facilityId: this.facilityId });
      console.log("Staff data >>", result);
      this.processStaffData(result);
      this.fetchRoles();
    } catch (error) {
      throw error;
    }
  }

  processStaffData(staffData) {
    this.staffMembers = staffData.map((staff, index) => ({
      Id: staff.Id,
      Name: staff.Display_Nickname__c || staff.Name || "Unnamed",
      Email: staff.Email,
      Role__c: staff.Role__c,
      roleAssignments: {},
      rowClass:
        index % 2 === 0
          ? "slds-hint-parent"
          : "slds-hint-parent slds-theme_shade"
    }));

    this.filteredStaffMembers = [...this.staffMembers]; // ✅ Important
  }

  async fetchRoles() {
    try {
      const result = await getRoles();
      console.log("Roles data >>", result);
      this.roles = result;
      this.loadAssignments();
    } catch (error) {
      throw error;
    }
  }

  loadAssignments() {
    console.log("this.staffMembers >> ", this.staffMembers);
    console.log("this.roles >> ", this.roles);
    if (this.staffMembers.length > 0 && this.roles.length > 0) {
      // this.staffMembers = this.staffMembers.map(staff => {
      //     const updatedStaff = { ...staff };
      //     updatedStaff.roleAssignments = {};
      //     this.roles.forEach(role => {
      //         updatedStaff.roleAssignments[role] = false;
      //     });
      //     return updatedStaff;
      // });
      this.staffMembers = this.staffMembers.map((staff) => {
        const matching = this.activeRoles.find((ar) => ar.staffId === staff.Id);
        const roleAssignments = {};

        if (matching && Array.isArray(matching.roles)) {
          matching.roles.forEach((role) => {
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

    assignmentData.forEach((assignment) => {
      if (!assignmentMap[assignment.AssigneeId]) {
        assignmentMap[assignment.AssigneeId] = {};
      }
      assignmentMap[assignment.AssigneeId][assignment.PermissionSetId] = true;
    });

    // Update staff members with their role assignments
    this.staffMembers = this.staffMembers.map((staff) => {
      const updatedStaff = { ...staff };
      const staffAssignments = assignmentMap[staff.Id] || {};

      // Update role assignments
      Object.keys(updatedStaff.roleAssignments).forEach((roleId) => {
        updatedStaff.roleAssignments[roleId] = !!staffAssignments[roleId];
      });

      return updatedStaff;
    });

    this.isLoading = false;
  }

  // Create flattened data structure for template iteration
  get staffRoleData() {
    const flatData = [];

    this.staffMembers.forEach((staff) => {
      this.roles.forEach((role) => {
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
  //     const staffList = this.filteredStaffMembers || [];

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
  //     } else if (this.activeRoles?.staffId && Array.isArray(this.activeRoles.roles)) {
  //         activeRoleMap[this.activeRoles.staffId] = new Set(this.activeRoles.roles);
  //     }

  //     staffList.forEach((staff, staffIndex) => {
  //         const activeRolesForStaff = activeRoleMap[staff.Id] || new Set();
  //        // console.log('✅ Final activeRolesForStaff:', activeRolesForStaff);
  //         const roleList = staff.Role__c ? staff.Role__c.split(';').map(r => r.trim()) : [];
  //         const assignedRoles = new Set(roleList);
  //        // console.log('✅ Final assignedRoles:', assignedRoles);

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

  //         grouped.push(staffData);

  //     });
  //     console.log('✅ Final Grouped Data:', JSON.stringify(grouped));
  //     return grouped;
  // }
  get groupedStaffRoleData() {
    const staffList = this.filteredStaffMembers || [];

    if (
      !staffList ||
      !this.roles ||
      this.roles.length === 0 ||
      !this.activeRoles
    ) {
      console.log("Missing staffMembers, roles, or activeRoles.");
      return [];
    }

    const grouped = [];
    const activeRoleMap = {};
    const debugLogs = [];

    // Build map: staffId → Set of active roles
    if (Array.isArray(this.activeRoles)) {
      this.activeRoles.forEach((item) => {
        activeRoleMap[item.staffId] = new Set(item.roles);
      });
    } else if (
      this.activeRoles?.staffId &&
      Array.isArray(this.activeRoles.roles)
    ) {
      activeRoleMap[this.activeRoles.staffId] = new Set(this.activeRoles.roles);
    }

    staffList.forEach((originalStaff) => {
      const activeRolesForStaff = activeRoleMap[originalStaff.Id] || new Set();

      // Merge modified version (if any)
      const modified = this.modifiedStaffMap[originalStaff.Id];
      //console.log('modified >>', JSON.stringify(modified));
      //console.log('originalStaff >>', JSON.stringify(originalStaff));
      // console.log('activeRolesForStaff>>', JSON.stringify(activeRolesForStaff));
      const staff = modified
        ? { ...originalStaff, ...modified }
        : originalStaff;

      const roleList = originalStaff.Role__c
        ? originalStaff.Role__c.split(";").map((r) => r.trim())
        : [];
      const assignedRoles = new Set(roleList);

      // 🟡 Log debug info per staff
      debugLogs.push({
        staffId: staff.Id,
        name: staff.Name,
        activeRoles: Array.from(activeRolesForStaff),
        modifiedRoles: staff.roleAssignments
          ? Object.entries(staff.roleAssignments)
              .filter(([_, v]) => v)
              .map(([k]) => k)
          : [],
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
        if (
          staff.roleAssignments &&
          staff.roleAssignments.hasOwnProperty(roleName)
        ) {
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
    //  console.log('🟢 Role State Summary:', JSON.stringify(debugLogs, null, 2));
    // console.log('✅ Final Grouped Data:', JSON.stringify(grouped, null, 2));

    return grouped;
  }

  @track searchStaff = "";
  @track filteredStaffMembers = [];
  @track staffMembers = [];
  @track roles = [];

  handleSearchStaffInput(event) {
    this.searchStaff = (event.target.value || "").toLowerCase().trim();
    let before = this.filteredStaffMembers.length;
    if (!this.searchStaff) {
      this.filteredStaffMembers = [...this.staffMembers];
    } else {
      this.filteredStaffMembers = this.staffMembers.filter((staff) =>
        (staff.Name || "").toLowerCase().includes(this.searchStaff)
      );
    }
    console.log(
      "Search:",
      this.searchStaff,
      "Before:",
      before,
      "After:",
      this.filteredStaffMembers.length
    );
    // This should trigger the UI update thanks to the getter.
  }

  handleUpdateStaff() {
    console.log("Client Id >> ", this.clientId);
    console.log(
      "Modified Staff Map >> ",
      JSON.stringify(this.modifiedStaffMap)
    );

    const modifiedStaffList = Object.values(this.modifiedStaffMap);

    // Prepare payload (only modified records)
    const assignmentPayload = modifiedStaffList.map((staff) => ({
      Id: staff.Id,
      Name: staff.Name,
      roleAssignments: staff.roleAssignments,
      rowClass: staff.rowClass
    }));

    this.serializedPayload = JSON.stringify(assignmentPayload);
    console.log("assignmentPayload >> ", this.serializedPayload);
    this.staffDetailsTemplate = false;
    this.searchStaff = "";
  }

  handleeditClose1() {
    this.staffDetailsTemplate = false;
    this.searchStaff = "";
    this.modifiedStaffMap = {};

    // ❗ Reset to original data (if needed)
    this.filteredStaffMembers = [...this.staffMembers];
  }

  modifiedStaffMap = {};

  // handleRoleToggle(event) {
  //     const staffId = event.target.dataset.staffId;
  //     const roleId = event.target.dataset.roleId;
  //     const isChecked = event.target.checked;

  //     let changedStaff = null;

  //     this.staffMembers = this.staffMembers.map(staff => {
  //         if (staff.Id === staffId) {
  //             const updatedStaff = { ...staff };
  //             updatedStaff.roleAssignments = { ...staff.roleAssignments };
  //             updatedStaff.roleAssignments[roleId] = isChecked;
  //             changedStaff = updatedStaff;
  //             return updatedStaff;
  //         }
  //         return staff;
  //     });

  //     // ✅ Store multiple modified staff entries
  //     if (changedStaff) {
  //         this.modifiedStaffMap[staffId] = changedStaff;
  //     }

  //     console.log('🗂️ Modified Staff Map:', JSON.stringify(this.modifiedStaffMap));
  // }
  handleRoleToggle(event) {
    const staffId = event.target.dataset.staffId;
    const roleId = event.target.dataset.roleId;
    const isChecked = event.target.checked;

    // 🔁 Get the latest version: from modified map if exists, otherwise from original list
    const originalStaff =
      this.modifiedStaffMap[staffId] ||
      this.staffMembers.find((s) => s.Id === staffId);

    if (!originalStaff) return;

    // 🛠 Clone the staff and their roleAssignments
    const updatedStaff = { ...originalStaff };
    updatedStaff.roleAssignments = { ...(originalStaff.roleAssignments || {}) };
    updatedStaff.roleAssignments[roleId] = isChecked;

    // ✅ Save back into modified map
    this.modifiedStaffMap = {
      ...this.modifiedStaffMap,
      [staffId]: updatedStaff
    };

    console.log(
      "🗂️ Modified Staff Map:",
      JSON.stringify(this.modifiedStaffMap)
    );
  }

  handleSectionToggle(event) {
    // const sectionId = event.currentTarget.dataset.id; // Get section ID from data-id attribute
    // // Toggle the flag and update the icon dynamically
    // this.sectionFlags[sectionId] = !this.sectionFlags[sectionId];
    // this.sectionIcons[sectionId] = this.sectionFlags[sectionId] ? '\u2B9F' : '\u2B9C';
    const sectionId = event.currentTarget.dataset.id;
    const sectionElement = this.template.querySelector(
      `[data-section="${sectionId}"]`
    );

    if (!this.sectionFlags[sectionId]) {
      // First click: Set the section to true so it loads in the DOM
      this.sectionFlags[sectionId] = true;
    } else {
      // From second click onwards: Just toggle the hidden-section class
      sectionElement.classList.toggle("hidden-section");
    }

    // Toggle the icon dynamically
    this.sectionIcons[sectionId] = sectionElement.classList.contains(
      "hidden-section"
    )
      ? "\u2B9C"
      : "\u2B9F";
  }

  @wire(getStaffData, {
    clientId: "$clientId",
    facilityId: "$facilityId",
    role: "$role"
  })
  wiredStaffData(result) {
    this.selectedRoles = [];
    this.wiredStaffResult = result; // Store the result for later use in refreshApex
    console.log("result in wire method " + JSON.stringify(result));
    const { error, data } = result;
    if (data) {
      // Process the data
      this.staffOptions = data.map((record) => ({
        value: record.Id,
        label: record.Name
        //label:  `${record.Name} ${record.Last_Name__c}`
      }));

      console.log("Staff options: " + JSON.stringify(this.staffOptions));

      // Assign the first staff's label to staffVal if available
      if (this.staffOptions.length > 0) {
        this.staffVal = this.staffOptions[0].label;
      }

      // Default to pre-assigned staff if no roles selected
      if (!this.selectedRoles || this.selectedRoles.length === 0) {
        this.selectedRoles = data
          .filter((record) => record.isAssigned) // Assuming 'isAssigned' indicates if the staff is already assigned
          .map((record) => record.Id);
      }
      console.log("Selected staff: " + JSON.stringify(this.selectedRoles));
    } else if (error) {
      console.error("Error fetching staff values: ", error);
    }
  }
  connectedCallback() {
    console.log("SelectedName>>" + this.selectedName);
    this.wiredStaffResult = [];
    this.wiredClientResult = [];
    // Fetch organization roles
    this.participantPreferredName =
      localStorage.getItem("defaultParticipantPreferredName") || "Participant";
    this.facilityPreferredName =
      localStorage.getItem("defaultFacilityPreferredName") || "Facility";
    organizationDetails().then((response) => {
      let orgRoles = response.listofPriceBook.Roles__c;
      //this.facilityPreferredName = response.listofPriceBook.Facility_Preferred_Name_Formula__c;
      //this.participantPreferredName = response.listofPriceBook.Participant_Preferred_Name_Formula__c
      //console.log('listofPriceBook:', response.listofPriceBook);
      this.OrgNisationRoles = orgRoles
        .split(";")
        .sort()
        .map((rec) => {
          return {
            value: rec,
            label: rec
          };
        });
    });

    // Fetch facilities and update participant details
    this.handlefacility();
    // Log client details if clientId is not null
    if (this.clientId != null) {
      console.log("client Id 11>> " + this.clientId);
      //this.getStaffValues()
      refreshApex(this.wiredClientResult);
    }
    this.fetchRolesForStaff();
  }

  handleErrorCss(event) {
    const field = event.target.fieldName;
    const isValid = event.target.reportValidity();
    console.log("isValid", isValid);

    this.fieldErrorMap[field] = !isValid;
  }

  getFieldClass(fieldName) {
    return this.fieldErrorMap[fieldName] ? "floating-label1" : "floating-label";
  }
  get emailClass() {
    return this.getFieldClass("Email__c");
  }
  get DateOfBirthClass() {
    return this.getFieldClass("Date_Of_Birth__c");
  }

  handleError(event) {
    event.preventDefault(); // Prevent default UI (red errors under fields)
    this.removeRadius = true;
    this.fieldErrorMap = {};
    let message = "An unknown error occurred.";
    const detail = event.detail;
    const errorMessages = [];

    // 1. Record-level errors (e.g. from Apex)
    const recordErrors = detail?.output?.errors;
    if (recordErrors && recordErrors.length > 0) {
      recordErrors.forEach((err) => {
        if (err.message) {
          errorMessages.push(err.message);
        }
      });
    }

    // 2. Field-level errors (e.g. validation errors on fields)
    const fieldErrors = detail?.output?.fieldErrors;
    if (fieldErrors) {
      Object.keys(fieldErrors).forEach((fieldName) => {
        fieldErrors[fieldName].forEach((error) => {
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
    message = errorMessages.join("\n");

    // 4. Show all errors as a toast
    /* this.dispatchEvent(
        new ShowToastEvent({
            title: 'Update Failed',
            message: message,
            variant: 'error',
           
        })
    ); */
  }

  // Refresh the Apex wire result manually
  // refreshStaffData() {
  // Directly refresh the wire result by calling refreshApex
  //refreshApex(this.wiredStaffData);
  // }
  handlefacility() {
    fetchFacilitiess().then((response) => {
      // console.log('fetch method response>>> '+JSON.stringify(response));
      this.refreshTable = response;

      if (Array.isArray(response)) {
        response.forEach((item) => {
          this.participantJson[item.Id] = {
            street: item.Address__Street__s,
            city: item.Address__City__s,
            stateCode: item.Address__StateCode__s,
            countryCode: item.Address__CountryCode__s,
            postalCode: item.Address__PostalCode__s,
            lastName: item.Last_Name__c,
            firstName: item.First_Name__c,
            facilityId: item.Facility__c
            /*"role": item.Participant_Staff_Associations__r && item.Participant_Staff_Associations__r.length > 0
                            ? item.Participant_Staff_Associations__r[0].Role__c
                            : ''*/
          };
        });

        const storedFacilityId = localStorage.getItem("defaultFacilityId");
        const storedFacilityLabel = localStorage.getItem(
          "defaultFacilityLabel"
        );
        getCurrentLoggedUserInfo().then((userData) => {
          let userTpe = userData.User_Type__c;
          console.log("user data ==>" + JSON.stringify(userData));
          getFacilityData().then((facresponse) => {
            console.log("Facility data fetched successfully:", facresponse);
            this.finalListFacilities = [];
            this.selectedFacilities = [];
            this.facilityOptions = facresponse.map((record) => ({
              label: record.Name,
              value: record.Id
            }));
            if (userTpe == "NDIS Org Admin" || userTpe == "ICT Admin") {
              this.finalListFacilities = this.facilityOptions;
              /*  this.facilityCheckboxOptions = this.facilityOptions
                        this.facilityCheckboxOptions = this.facilityCheckboxOptions.map(option => {
                                    return {
                                    ...option,
                                    checked: option.value === storedFacilityId
                                    };
                        }); */

              // 2. Set as selected bubble
              /*  this.selectedFacilities = [{
                                label: storedFacilityLabel,
                                value: storedFacilityId
                        }]; */
              /*  console.log('Fetch Participant>>>'+ JSON.stringify(result));
                             //finalData =result.data;
                            this.records =finalData ;
                            
                            this.orginalData=finalData;
                            console.log('Fetch Participant finalData>>>'+ JSON.stringify(finalData));
                            this.totalRecords = finalData.length; // update total records count                 
                            this.pageSize = 12;
                            if(this.totalRecords>6){
                            this.visible=true;
                            }
                            this.applyFilters(); 
                           // this.paginationHelper(); // call helper menthod to update pagination logic           
                            this.ParticpantRecordForm=false;
                            this.showSpinner = false; */
            } else if (
              userTpe == "Facility Admin" ||
              userTpe == "HR Admin" ||
              userTpe == "Roster Manager"
            ) {
              getFacilityCurrentUser().then((result) => {
                console.log(
                  "getFacilityCurrentUser facility   " + JSON.stringify(result)
                );
                this.facilityCheckboxOptions = result.map((record) => ({
                  label: record.Facility__r.Name,
                  value: record.Facility__r.Id
                }));
                this.finalListFacilities = this.facilityCheckboxOptions;
                /* 
                                                                                                let facilityIds = this.facilityCheckboxOptions.map(f => f.value);
                            
                                  console.log('facilityIds  '+JSON.stringify(facilityIds))
                                const filteredData = finalData.filter(rec =>
                                    facilityIds.includes(rec.Facility__c)
                                );
                                this.facilityCheckboxOptions =  this.facilityCheckboxOptions
                                        this.facilityCheckboxOptions = this.facilityCheckboxOptions.map(option => {
                                        return {
                                        ...option,
                                        checked: option.value === storedFacilityId
                                        };
                                });
 */
                // 2. Set as selected bubble
                /* this.selectedFacilities = [{
                                        label: storedFacilityLabel,
                                        value: storedFacilityId
                                }];

                                this.records =filteredData ;
                                  this.orginalData=filteredData;
                                console.log('Fetch Participant filteredData>>>'+ JSON.stringify(filteredData));
                                 console.log('Fetch Participant filteredData length >>>'+filteredData.length);
                                this.totalRecords = filteredData.length; // update total records count                 
                                this.pageSize = 12;
                                if(this.totalRecords>6){
                                this.visible=true;
                                }
                                this.applyFilters(); 
                               // this.paginationHelper(); // call helper menthod to update pagination logic           
                                this.ParticpantRecordForm=false;
                                this.showSpinner = false; */
              });
            }
          });
        });
        //console.log('Response>>' + JSON.stringify(this.participantJson));
      }
      this.ParticpantRecordForm = false;
    });
  }

  handleFacilityChange(event) {
    //  console.log('facility onchange '+(event.target)) ;
    this.facilityId = event.target.value; // Capture Facility ID
    //this.getStaffValues(); // Fetch staff based on the new facility
    refreshApex(this.wiredStaffResult);
    console.log("Selected facility >> " + this.facilityId);
  }
  handleChangeRole(event) {
    console.log("onchange " + JSON.stringify(event.detail));
    this.role = event.detail.value; // Handle combobox value change
    console.log("Selected Role >> " + this.role);
    // this.getStaffValues();
    refreshApex(this.wiredStaffResult);
  }

  async handleOpenstaffModal(event) {
    console.log("this.staffDetailsTemplate >>", this.staffDetailsTemplate);
    await Promise.all([
      //this.fetchRoles(),
      this.fetchRolesForStaff()
    ]);
    this.staffDetailsTemplate = true;
    console.log("this.staffDetailsTemplate >>", this.staffDetailsTemplate);
  }
  @wire(getClientById, { recordId: "$clientId" })
  wiredClient(result) {
    this.wiredClientResult = result;
    const { data, error } = result;
    if (data) {
      console.log("Client data:", JSON.stringify(data));
      this.facilityId = data[0].Facility__c;
      if (
        data[0].Participant_Staff_Associations__r &&
        data[0].Participant_Staff_Associations__r.length > 0
      ) {
        this.role = data[0].Participant_Staff_Associations__r[0].Role__c; // Set the first role
        console.log("Role from client data >>" + this.role);
        if (this.role != null) {
          refreshApex(this.wiredStaffResult);
        }
      } else {
        this.role = ""; // No role selected
      }
    } else if (error) {
      this.handleError(error);
    }
  }

  handleBackToParticipant(event) {
    this.staffDetailsTemplate = false;
  }

  handleEditClient(event) {
    this.fieldErrorMap = {};
    this.ParticpantRecordForm = true;
    this.recordId = this.clientId;
    let facId = event.currentTarget.dataset.id;
    console.log("FacId>>" + this.clientId);
    //this.recordId = facId;
    console.log("Participant Data ", JSON.stringify(this.participantJson));
    this.street = this.participantJson[this.recordId]["street"];
    this.city = this.participantJson[this.recordId]["city"];
    this.country = this.participantJson[this.recordId]["countryCode"];
    this.province = this.participantJson[this.recordId]["stateCode"];
    this.postalcode = this.participantJson[this.recordId]["postalCode"];
    this.lastName = this.participantJson[this.recordId]["lastName"];
    this.firstName = this.participantJson[this.recordId]["firstName"];
    this.facilityId = this.participantJson[this.recordId]["facilityId"];
    this.fileName = "";
    this.errorMessage = "";
    this.saveButtonDisable = false;
    refreshApex(this.wiredStaffResult);
    console.log("Child handleEditClient invoked by parent");
    // Example: maybe open a modal or set an edit mode
  }

  addressInputChange(event) {
    const address = event.detail;
    if (
      !address.street ||
      !address.city ||
      !address.postalCode ||
      !address.province
    ) {
      this.errorMessage = "Please provide complete address information.";
      this.saveButtonDisable = true;
    } else {
      this.errorMessage = "";
      this.saveButtonDisable = false;
      console.log("event detail" + JSON.stringify(event.detail));
      this.street = event.detail.street;
      this.city = event.detail.city;
      this.postalcode = event.detail.postalCode;
      this.province = event.detail.province;
      this.country = event.detail.country;
    }
  }

  handleSuccess(event) {
    const toastEvent = new ShowToastEvent({
      title: "Success",
      message: "Details updated successfully.",
      variant: "success"
    });
    this.dispatchEvent(toastEvent);
    this.ParticpantRecordForm = false;
    refreshApex(this.wiredClientResult);

    //this.fetchParticipant();

    //Manimala added this  110 to 124
    let staffRecID = event.detail.id;
    if (staffRecID != null) {
      if (this.fileName.length > 0) {
        uploadFile({
          base64: JSON.stringify(this.base64FileData),
          filename: this.fileName,
          recordId: staffRecID,
          obj: "client"
        }).then((result) => {
          //  console.log('Upload result = ' +result);
          //this.fileName = this.fileName + ' - Uploaded Successfully';
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Success!!",
              message: this.file.name + " - Uploaded Successfully!!!",
              variant: "success"
            })
          );
        });
      }
      setTimeout(() => {
        console.log("child fired");
        this.handlefacility();
        refreshApex(this.wiredClientResult);
        this.dispatchEvent(new CustomEvent("participantupdated"));
      }, 1000);

      /* updateStaffAssignments({ clientId: this.clientId, staffIds: this.selectedRoles ,roleId:this.role}).then(() => {
                console.log('Successfully updated staff assignments in the backend.');
                this.participanteditflag=false;
                this.staffDetailsTemplate = false;  
                
                this.participantflag = true; 
                //this.getStaffValues();
              
                 refreshApex(this.wiredClientResult);
                 console.log('role 5 >>'+this.role);
                 setTimeout(() => {
                    refreshApex(this.wiredStaffResult);
                  }, 1000);
                
              })
              .catch(err => {
                  console.error('Error updating staff assignments in the backend: ', err);
                  // Optionally show an error message to the user
              }); */

      // 🔁 Call Apex
      updateStaffAssignments({
        clientId: this.clientId,
        assignmentsJSON: this.serializedPayload
      })
        .then(() => {
          console.log("✅ Successfully updated staff assignments.");
          this.participanteditflag = false;
          this.editButtom = true;
          this.editandBackButton = true;
          this.participantflag = true;
          this.fetchRolesForStaff();
          // ✅ Clear modified staff map
          this.modifiedStaffMap = {};
        })
        .catch((error) => {
          console.error("❌ Error updating staff assignments:", error);
        });
    }
    /*  fetchFacilitiess().then(response=>{
            if (Array.isArray(response)) {
                response.forEach(item => {
                    this.participantJson[item.Id] = {
                        "street": item.Address__Street__s,
                        "city": item.Address__City__s,
                        "stateCode": item.Address__StateCode__s,
                        "countryCode": item.Address__CountryCode__s,
                        "postalCode": item.Address__PostalCode__s,
                        "lastName":item.Last_Name__c,
                        "firstName":item.First_Name__c,
                        "facilityId": item.Facility__c,
                    };
                });
               // console.log('Response>>'+JSON.stringify(this.participantJson));
            }
        });  */
  }
  //Manimala added this  144 to 199
  onFileUpload(event) {
    this.isattachError = false;
    if (event.target.files.length > 0) {
      this.selectedFilesToUpload = event.target.files;
      this.file = this.selectedFilesToUpload[0];
      this.fileName = this.selectedFilesToUpload[0].name.split(" ").join("");
      this.fileType = this.selectedFilesToUpload[0].type;
      this.fileSize = this.selectedFilesToUpload[0].size;

      if (
        this.file.size > this.MAX_FILE_SIZE ||
        this.file.size < this.MIN_FILE_SIZE
      ) {
        this.isattachError = true;
      }
      //create an intance of File
      this.fileReaderObj = new FileReader();

      //this callback function in for fileReaderObj.readAsDataURL
      this.fileReaderObj.onloadend = () => {
        //get the uploaded file in base64 format
        let fileContents = this.fileReaderObj.result;
        fileContents = fileContents.substr(fileContents.indexOf(",") + 1);

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
          for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
            bytes[i] = byteCharacters[offset].charCodeAt(0);
          }
          byteArrays[sliceIndex] = new Uint8Array(bytes);
        }

        //from arraybuffer create a File instance
        this.myFile = new File(byteArrays, this.fileName, {
          type: this.fileType
        });

        //callback for final base64 String format
        let reader = new FileReader();
        reader.onloadend = () => {
          let base64data = reader.result;
          this.base64FileData = base64data.substr(base64data.indexOf(",") + 1);
        };
        reader.readAsDataURL(this.myFile);
      };
      this.fileReaderObj.readAsDataURL(this.file);
    }
    this.showSpinner = false;
    /*  console.log('fileName>>',this.fileName);
        console.log('file prepared');
       */
  }

  handleSubmit(event) {
    console.log("in submit");
    event.preventDefault(); // stop the form from submitting
    const facilityInput = this.template.querySelector('[data-id="facility"]');
    if (!this.facilityId) {
      facilityInput.reportValidity(); // shows “Complete this field”
      return;
    }
    const fields = event.detail.fields;
    // alert(JSON.stringify(fields));
    fields.Address__Street__s = this.street;
    fields.Address__City__s = this.city;
    fields.Address__StateCode__s = this.province;
    fields.Address__CountryCode__s = "AU";
    fields.Address__PostalCode__s = this.postalcode;
    fields.Facility__c = this.facilityId;
    // console.log('After fields>>'+JSON.stringify(fields));
    this.template.querySelector("lightning-record-edit-form").submit(fields);
  }

  handleeditClose() {
    this.ParticpantRecordForm = false;
    this.staffDetailsTemplate = false;
  }

  handlefacStatus(event) {
    let facId = event.currentTarget.dataset.id;
    let facstatus = event.target.dataset.name;
    let finalStatus;
    let message;
    if (facstatus == "true") {
      finalStatus = "false";
      message = "Client is Inactive";
    } else if (facstatus == "false") {
      finalStatus = "true";
      message = "Client is Active";
    }
    statusClient({ IdValue: facId, status: finalStatus }).then((response) => {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "",
          message: message,
          variant: "success"
        })
      );
      //refreshApex(this.refreshTable);
    });
  }

  handleNameChange(event) {
    if (event.target.name == "fname") {
      this.firstName = "";
      this.firstName = event.target.value;
    }
    if (event.target.name == "lname") {
      this.lastName = "";
      this.lastName = event.target.value;
    }
    if (
      this.firstName != undefined ||
      this.firstName != NULL ||
      this.lastName != undefined ||
      this.lastName != NULL
    ) {
      this.fullName = this.firstName + " " + this.lastName;
    }
  }
  handleStaffChange(event) {
    // this.staffName = event.target.value;
    // console.log('Staff Name >> '+ this.staffName);
    this.selectedRoles = event.detail.value;
    console.log(
      "Updated selected roles: " + JSON.stringify(this.selectedRoles)
    );
  }

  triggerFileInput() {
    this.template.querySelector('input[type="file"]').click();
  }

  get showParticipantFormClass() {
    return this.staffDetailsTemplate ? "slds-hide" : "";
  }

  get showPreferredStaffClass() {
    return this.staffDetailsTemplate ? "" : "slds-hide";
  }

  showToast(variant, message) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: variant === "success" ? "Success" : "Error",
        message: message,
        variant: variant,
        mode: "dismissable"
      })
    );
  }
}