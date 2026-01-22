import { LightningElement, track,api } from "lwc";
import getXeroEmployees from '@salesforce/apex/XeroIntegrationController.getXeroEmployees';
import getXeroContacts from '@salesforce/apex/XeroIntegrationController.getXeroContacts';
import fetchStaff from '@salesforce/apex/XeroIntegrationController.fetchStaffList';
import fetchEntityList from '@salesforce/apex/XeroIntegrationController.fetchEntityList';
import createStaffInXero from '@salesforce/apex/XeroIntegrationController.createOrUpdateXeroEmployee';
import createEntityInXero from '@salesforce/apex/XeroIntegrationController.createOrUpdateXeroContacts';
import updateXeroEmployeeIds from '@salesforce/apex/XeroIntegrationController.updateXeroEmployeeIds';
import updateXeroEntityIds from '@salesforce/apex/XeroIntegrationController.updateXeroEntityIds';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class TesseractAppsManageInvoices extends LightningElement {
  @api orgid;
  @track activeTab = "payroll";
  @track staffList = [];
  @track employees = [];
  @track recordId = '';
  @track staffListSystem = [];
  @track matchedList = [];
  @track onlyInXeroList = [];
  @track onlyInSystemList = [];
  @track recordsToUpdateInSystem = [];
  @track entityRecordsToUpdateInSystem = [];
  @track matchedCount;
  @track onlyInXeroCount;
  @track onlyInSystemCount;
  @track totalCount;
  @track allStaff = true;
  @track matchedStaff = false;
  @track systemStaff = false;
  @track xeroStaff = false;

  // Pagination variables for each table
  @track allPageSize = 10;
  @track allCurrentPage = 1;
  @track allTotalRecords = 0;
  @track allTotalPages = 0;
  @track paginatedStaffList = [];

  @track matchedPageSize = 10;
  @track matchedCurrentPage = 1;
  @track matchedTotalRecords = 0;
  @track matchedTotalPages = 0;
  @track paginatedMatchedList = [];

  @track systemPageSize = 10;
  @track systemCurrentPage = 1;
  @track systemTotalRecords = 0;
  @track systemTotalPages = 0;
  @track paginatedSystemList = [];

  @track xeroPageSize = 10;
  @track xeroCurrentPage = 1;
  @track xeroTotalRecords = 0;
  @track xeroTotalPages = 0;
  @track paginatedXeroList = [];
  @track createStaffForXeroOnly= false;
  @track createStaffForXeroAll= false;

  @track allEntities = false;
  @track matchedEntity= false;
  @track systemEntity = false;
  @track xeroEntity= false;

  @track totaltEntityCount;
  @track matchedEntityCount;
  @track onlyInSystemEntityCount;
  @track onlyInXeroEntityCount;

  @track allEntitiesPageSize = 10;
  @track allEntitiesCurrentPage = 1;
  @track allEntitiesTotalRecords = 0;
  @track allEntitiesTotalPages = 0;
  @track paginatedEntityList = [];

  @track matchedEntityPageSize = 10;
  @track matchedEntityCurrentPage = 1;
  @track matchedEntityTotalRecords = 0;
  @track matchedEntityTotalPages = 0;
  @track paginatedMatchedEntityList = [];

  @track systemEntityPageSize = 10;
  @track systemEntityCurrentPage = 1;
  @track systemEntityTotalRecords = 0;
  @track systemEntityTotalPages = 0;
  @track paginatedSystemEntityList = [];

  @track xeroEntityPageSize = 10;
  @track xeroEntityCurrentPage = 1;
  @track xeroEntityTotalRecords = 0;
  @track xeroEntityTotalPages = 0;
  @track paginatedXeroEntityList = [];

  @track entityList = [];
  // @track employees = [];
  // @track recordId = '';
  @track matchedEntityList = [];
  @track onlyInXeroEntityList = [];
  @track onlyInSystemEntityList = [];
  @track contacts = [];
  @track entityListSystem = [];
  @track createEntityForXeroOnly= false;
  @track createEntityForXeroAll= false;

  @track pageSizeOptions = [10, 25, 50, 75, 100];

  connectedCallback() {
    const storedFacilityId = localStorage.getItem('defaultFacilityId');
    console.log('storedFacilityId >>', storedFacilityId);
    console.log('org id in connectedCallback 1 >> ',this.orgid );
    if (storedFacilityId) {
      this.recordId = storedFacilityId;
      console.log('Facility Id >>', this.recordId);
      this.fetchEmployeesfromXero();
    }
  }

  fetchEmployeesfromXero() {
    getXeroEmployees()
      .then((result) => {
        console.log('✅ Xero Employees:', result);
        this.employees = result;
        this.loadStaffDetailsfromSystem();
      })
      .catch((error) => {
        console.error('❌ Error fetching employees:', error);
        this.error = error;
      });
  }

  loadStaffDetailsfromSystem() {
    fetchStaff()
        .then((result) => {
        console.log('✅ Staff Record:', result);
        this.staffListSystem = result;
        this.loadMockData();
        })
        .catch((error) => {
        console.error('❌ Error fetching staff:', error);
        this.error = error;
        });
    }

  get showPayroll() {
    return this.activeTab === "payroll";
  }

  get showInvoices() {
    return this.activeTab === "invoices";
  }

  get payrollTabClass() {
    return this.activeTab === "payroll" ? "menu-item1" : "menu-item";
  }

  get invoicesTabClass() {
    return this.activeTab === "invoices" ? "menu-item1" : "menu-item";
  }

  handleTabChange(event) {
    const selectedTab = event.currentTarget.dataset.tab;
    this.activeTab = selectedTab;

    console.log("🔄 Tab changed to:", selectedTab);

    if(this.activeTab === "invoices"){
      this.fetchContactsfromXero();
      this.allEntities = true;
      this.matchedEntity = false;
      this.systemEntity = false;
      this.xeroEntity = false;

    } else if(this.activeTab === "payroll"){
      this.fetchEmployeesfromXero();
    }
    this.dispatchEvent(
      new CustomEvent("tabchange", {
        detail: { activeTab: selectedTab }
      })
    );
  }

  loadMockData() {
    const xeroEmployees = this.employees || [];
    const systemStaff = this.staffListSystem || [];

    const matchedList = [];
    const onlyInXeroList = [];
    const onlyInSystemList = [];

    const normalizeEmail = (email) => {
      return email
        ? email
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\u00A0/g, '')
            .replace(/\s+/g, '')
        : null;
    };

    // 🧭 Format Xero Date: /Date(1737936000000+0000)/
    const formatXeroDate = (xeroDateString) => {
      if (!xeroDateString || !xeroDateString.startsWith('/Date(')) return null;
      try {
        const timestamp = parseInt(xeroDateString.match(/\/Date\((\d+)\+\d+\)\//)[1]);
        const date = new Date(timestamp);
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}/${month}/${year}`;
      } catch (e) {
        console.error('⚠️ Error parsing DateOfBirth:', xeroDateString, e);
        return null;
      }
    };

    // 🧭 Format System Date: "2025-01-27"
    const formatSystemDate = (systemDateString) => {
      if (!systemDateString) return null;
      try {
        const date = new Date(systemDateString);
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}/${month}/${year}`;
      } catch (e) {
        console.error('⚠️ Error parsing System DateOfBirth:', systemDateString, e);
        return null;
      }
    };

    console.log('📥 Total Xero Employees:', xeroEmployees.length);
    console.log('📥 Total System Staff:', systemStaff.length);

    // 🔹 Build system email map for quick lookup
    const systemEmailMap = new Map();
    systemStaff.forEach((s) => {
      const normalizedEmail = normalizeEmail(s.Email_Address__c);
      if (normalizedEmail) {
        systemEmailMap.set(normalizedEmail, s);
      } else {
        console.warn('⚠️ Skipped system staff with missing/invalid email:', s);
      }
    });

    // 🔸 1️⃣ Match Xero employees with System staff
    xeroEmployees.forEach((emp) => {
      const normalizedEmail = normalizeEmail(emp.Email);
      const matchingStaff = normalizedEmail ? systemEmailMap.get(normalizedEmail) : null;
      const formattedDOB = formatXeroDate(emp.DateOfBirth);

      if (matchingStaff) {
        const formattedSystemDOB = formatSystemDate(matchingStaff.Date_Of_Birth__c);
        matchedList.push({
          id: emp.EmployeeID,
          systemStaffId: matchingStaff.Id,
          name: `${emp.FirstName || ''} ${emp.LastName || ''}`.trim(),
          email: emp.Email,
          xeroId: emp.EmployeeID,
          inXero: true,
          inSystem: true,
          facility: matchingStaff.Facility__c,
          xeroDOB: formattedDOB,
          systemDOB: formattedSystemDOB,
          dateOfBirth: formattedSystemDOB || formattedDOB, // ✅ prefer system DOB if available
        });
        systemEmailMap.delete(normalizedEmail);
      } else {
        onlyInXeroList.push({
          id: emp.EmployeeID,
          name: `${emp.FirstName || ''} ${emp.LastName || ''}`.trim(),
          firstName: emp.FirstName || '',
          lastName: emp.LastName || '',
          email: emp.Email || '',
          xeroId: emp.EmployeeID,
          inXero: true,
          inSystem: false,
          facility: null,
          xeroDOB: formattedDOB,
          dateOfBirth: formattedDOB, // ✅ only Xero DOB
        });
      }
    });

    // 🔹 2️⃣ Remaining System Staff → Only in System
    systemEmailMap.forEach((s) => {
      const formattedSystemDOB = formatSystemDate(s.Date_Of_Birth__c);
      onlyInSystemList.push({
        id: s.Id,
        name: s.NameToDisplay__c || s.Name || '—',
        email: s.Email_Address__c || '',
        xeroId: null,
        inXero: false,
        inSystem: true,
        facility: s.Facility__c,
        systemDOB: formattedSystemDOB,
        dateOfBirth: formattedSystemDOB, // ✅ only system DOB
      });
    });

    // 🔸 3️⃣ Combine + enrich for UI
    this.matchedList = matchedList.map((staff) => this.enrichStaffData(staff));
    this.onlyInXeroList = onlyInXeroList.map((staff) => this.enrichStaffData(staff));
    this.onlyInSystemList = onlyInSystemList.map((staff) => this.enrichStaffData(staff));
    this.staffList = [...this.matchedList, ...this.onlyInXeroList, ...this.onlyInSystemList];

    // 🧭 Initialize pagination
    this.initializeAllPagination();

    // 📊 Count Summary
    this.matchedCount = this.matchedList.length;
    this.onlyInXeroCount = this.onlyInXeroList.length;
    this.onlyInSystemCount = this.onlyInSystemList.length;
    this.totalCount = this.staffList.length;

    console.log('✅ Matched Count:', this.matchedCount);
    console.log('☁️ Only in Xero Count:', this.onlyInXeroCount);
    console.log('🧩 Only in System Count:', this.onlyInSystemCount);
    console.log('📋 Total Combined Staff List:', this.totalCount);

    this.recordsToUpdateInSystem = this.matchedList.map((staff) => {
      // Find the original Xero employee to extract additional fields
      const xeroEmp = xeroEmployees.find(e => e.EmployeeID === staff.xeroId);

      return {
        systemStaffId: staff.systemStaffId,
        xeroEmployeeId: staff.xeroId,
        ordinaryEarningsRateId: xeroEmp?.OrdinaryEarningsRateID || null // ✅ new field
      };
    });


    console.log('📤 Final Payload:', JSON.stringify(this.recordsToUpdateInSystem, null, 2));

    updateXeroEmployeeIds({ staffMappings: this.recordsToUpdateInSystem })
    .then(() => {
      console.log('✅ Xero IDs updated successfully!');
    })
    .catch((error) => {
      console.error('❌ Error updating Xero IDs:', error);
    });
  }


  // Initialize pagination for all tables
  initializeAllPagination() {
    // All Staff Pagination
    this.allTotalRecords = this.staffList.length;
    this.allTotalPages = Math.ceil(this.allTotalRecords / this.allPageSize);
    this.updateAllPagination();

    // Matched Staff Pagination
    this.matchedTotalRecords = this.matchedList.length;
    this.matchedTotalPages = Math.ceil(this.matchedTotalRecords / this.matchedPageSize);
    this.updateMatchedPagination();

    // System Only Pagination
    this.systemTotalRecords = this.onlyInSystemList.length;
    this.systemTotalPages = Math.ceil(this.systemTotalRecords / this.systemPageSize);
    this.updateSystemPagination();
    console.log('this.onlyInXeroList : ',JSON.stringify(this.onlyInXeroList));
    // Xero Only Pagination
    this.xeroTotalRecords = this.onlyInXeroList.length;
    this.xeroTotalPages = Math.ceil(this.xeroTotalRecords / this.xeroPageSize);
    this.updateXeroPagination();
  }

  // All Staff Pagination Methods
  updateAllPagination() {
    if (this.allTotalRecords === 0) {
      this.paginatedStaffList = [];
      return;
    }
    const startIndex = (this.allCurrentPage - 1) * this.allPageSize;
    const endIndex = startIndex + this.allPageSize;
    this.paginatedStaffList = this.staffList.slice(startIndex, endIndex);
  }

  handleAllPageSizeChange(event) {
    this.allPageSize = parseInt(event.target.value, 10);
    this.allTotalPages = Math.ceil(this.allTotalRecords / this.allPageSize);
    this.allCurrentPage = 1;
    this.updateAllPagination();
  }


  handleAllFirstPage() { this.allCurrentPage = 1; this.updateAllPagination(); }
  handleAllPrevPage() { if (this.allCurrentPage > 1) { this.allCurrentPage -= 1; this.updateAllPagination(); } }
  handleAllNextPage() { if (this.allCurrentPage < this.allTotalPages) { this.allCurrentPage += 1; this.updateAllPagination(); } }
  handleAllLastPage() { this.allCurrentPage = this.allTotalPages; this.updateAllPagination(); }
  get allDisableFirstPrev() { return this.allCurrentPage === 1; }
  get allDisableNextLast() { return this.allCurrentPage === this.allTotalPages; }

  // Matched Staff Pagination Methods
  updateMatchedPagination() {
    if (this.matchedTotalRecords === 0) {
      this.paginatedMatchedList = [];
      return;
    }
    const startIndex = (this.matchedCurrentPage - 1) * this.matchedPageSize;
    const endIndex = startIndex + this.matchedPageSize;
    this.paginatedMatchedList = this.matchedList.slice(startIndex, endIndex);
  }

  handleMatchedPageSizeChange(event) {
    this.matchedPageSize = parseInt(event.target.value, 10);
    this.matchedTotalPages = Math.ceil(this.matchedTotalRecords / this.matchedPageSize);
    this.matchedCurrentPage = 1;
    this.updateMatchedPagination();
  }

  handleMatchedFirstPage() { this.matchedCurrentPage = 1; this.updateMatchedPagination(); }
  handleMatchedPrevPage() { if (this.matchedCurrentPage > 1) { this.matchedCurrentPage -= 1; this.updateMatchedPagination(); } }
  handleMatchedNextPage() { if (this.matchedCurrentPage < this.matchedTotalPages) { this.matchedCurrentPage += 1; this.updateMatchedPagination(); } }
  handleMatchedLastPage() { this.matchedCurrentPage = this.matchedTotalPages; this.updateMatchedPagination(); }
  get matchedDisableFirstPrev() { return this.matchedCurrentPage === 1; }
  get matchedDisableNextLast() { return this.matchedCurrentPage === this.matchedTotalPages; }

  // System Only Pagination Methods
  updateSystemPagination() {
    if (this.systemTotalRecords === 0) {
      this.paginatedSystemList = [];
      return;
    }
    const startIndex = (this.systemCurrentPage - 1) * this.systemPageSize;
    const endIndex = startIndex + this.systemPageSize;
    this.paginatedSystemList = this.onlyInSystemList.slice(startIndex, endIndex);
  }

  handleSystemPageSizeChange(event) {
    this.systemPageSize = parseInt(event.target.value, 10);
    this.systemTotalPages = Math.ceil(this.systemTotalRecords / this.systemPageSize);
    this.systemCurrentPage = 1;
    this.updateSystemPagination();
  }

  handleSystemFirstPage() { this.systemCurrentPage = 1; this.updateSystemPagination(); }
  handleSystemPrevPage() { if (this.systemCurrentPage > 1) { this.systemCurrentPage -= 1; this.updateSystemPagination(); } }
  handleSystemNextPage() { if (this.systemCurrentPage < this.systemTotalPages) { this.systemCurrentPage += 1; this.updateSystemPagination(); } }
  handleSystemLastPage() { this.systemCurrentPage = this.systemTotalPages; this.updateSystemPagination(); }
  get systemDisableFirstPrev() { return this.systemCurrentPage === 1; }
  get systemDisableNextLast() { return this.systemCurrentPage === this.systemTotalPages; }

  // Xero Only Pagination Methods
  updateXeroPagination() {
    if (this.xeroTotalRecords === 0) {
      this.paginatedXeroList = [];
      return;
    }
    const startIndex = (this.xeroCurrentPage - 1) * this.xeroPageSize;
    const endIndex = startIndex + this.xeroPageSize;
    this.paginatedXeroList = this.onlyInXeroList.slice(startIndex, endIndex);
  }

  handleXeroPageSizeChange(event) {
    this.xeroPageSize = parseInt(event.target.value, 10);
    this.xeroTotalPages = Math.ceil(this.xeroTotalRecords / this.xeroPageSize);
    this.xeroCurrentPage = 1;
    this.updateXeroPagination();
  }

  handleXeroFirstPage() { this.xeroCurrentPage = 1; this.updateXeroPagination(); }
  handleXeroPrevPage() { if (this.xeroCurrentPage > 1) { this.xeroCurrentPage -= 1; this.updateXeroPagination(); } }
  handleXeroNextPage() { if (this.xeroCurrentPage < this.xeroTotalPages) { this.xeroCurrentPage += 1; this.updateXeroPagination(); } }
  handleXeroLastPage() { this.xeroCurrentPage = this.xeroTotalPages; this.updateXeroPagination(); }
  get xeroDisableFirstPrev() { return this.xeroCurrentPage === 1; }
  get xeroDisableNextLast() { return this.xeroCurrentPage === this.xeroTotalPages; }

  // Tab switching methods
  handleAllStaff() {
    this.allStaff = true;
    this.matchedStaff = false;
    this.systemStaff = false;
    this.xeroStaff = false;
  }

  handleMatchedStaff() {
    this.allStaff = false;
    this.matchedStaff = true;
    this.systemStaff = false;
    this.xeroStaff = false;
  }

  handleSystemStaff() {
    this.allStaff = false;
    this.matchedStaff = false;
    this.systemStaff = true;
    this.xeroStaff = false;
  }

  handleXeroStaff() {
    this.allStaff = false;
    this.matchedStaff = false;
    this.systemStaff = false;
    this.xeroStaff = true;
  }

    getStatusClass(status) {
        switch (status) {
            case 'both': return 'status-synced';
            case 'xero-only': return 'status-xero';
            case 'system-only': return 'status-system';
            default: return '';
        }
    }

  enrichStaffData(staff) {
    const initials = this.getInitials(staff.name);
    const statusLabel = staff.inXero && staff.inSystem ? 'Synced' : staff.inXero ? 'Xero Only' : 'System Only';
    const statusClass = staff.inXero && staff.inSystem ? 'status-synced' : staff.inXero ? 'status-xero' : 'status-system';
    const rowClass = staff.inXero && staff.inSystem ? 'synced-row' : staff.inXero ? 'xero-only-row' : 'system-only-row';

    return {
      ...staff,
      initials,
      statusLabel,
      statusClass,
      rowClass,
      xeroIdDisplay: staff.xeroId || '—',
      showXeroButton: !staff.inXero,
      showSystemButton: !staff.inSystem,
      showAllSet: staff.inXero && staff.inSystem
    };
  }

  getInitials(name) {
    if (!name) return '—';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  handleCreateInXero(event) {
        const staffId = event.currentTarget.dataset.id;
        console.log('➕ Add to Xero for staff ID:', staffId);

        // Call Apex
        createStaffInXero({ staffId: staffId }) // pass parameters as object
            .then((result) => {
                console.log('✅ Xero creation result:', result);
                this.showToast('Success', 'Staff has Created in the Xero', 'success');
                this.fetchEmployeesfromXero();
            })
            .catch((error) => {
                console.error('❌ Error creating staff in Xero:', error);
                // Optionally, show error toast
            });
    }

  @track createStaff = false;
  handleCreateInSystem(event) {
    const staffId = event.currentTarget.dataset.id;
    this.staffFirstName = event.currentTarget.dataset.firstname;
    this.staffLastName = event.currentTarget.dataset.lastname;
    this.staffEmail = event.currentTarget.dataset.email;
    this.staffXeroId = event.currentTarget.dataset.xeroId;
    console.log('➕ Add to System for staff ID:', staffId);
    console.log('First Name:', this.staffFirstName);
    console.log('Last Name:',  this.staffLastName);
    console.log('Email:', this.staffEmail);
    console.log('xeroId:',  this.staffXeroId);

    this.createStaff = true;
    if(this.xeroStaff){
       this.createStaffForXeroOnly = true; 
    } else if(this.allStaff){
      this.createStaffForXeroAll = true; 
    }
  }

  // Computed properties for empty states
  get hasNoStaff() {
    return this.staffList.length === 0;
  }

  get hasNoMatchedStaff() {
    return this.matchedList.length === 0;
  }

  get hasNoSystemStaff() {
    return this.onlyInSystemList.length === 0;
  }

  get hasNoXeroStaff() {
    return this.onlyInXeroList.length === 0;
  }

  get hasNoEntity() {
    return this.entityList.length === 0;
  }

  get hasNoMatchedEntity() {
    return this.matchedEntityList.length === 0;
  }

  get hasNoSystemEntity() {
    return this.onlyInSystemEntityList.length === 0;
  }

  get hasNoXeroEntity() {
    return this.onlyInXeroEntityList.length === 0;
  }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: 'dismissable' // can also be 'sticky' or 'pester'
        });
        this.dispatchEvent(event);
    }
    handleBackToXero() {
       
        if(this.createStaffForXeroOnly || this.createStaffForXeroAll){
          console.log('❌ Staff creation cancelled – returning to table');
          this.createStaff = false; // hides the child and shows the table again
          this.allStaff = false;
          this.matchedStaff = false;
          this.systemStaff = false;
          this.xeroStaff = false;
          if(this.createStaffForXeroOnly){
            this.xeroStaff = true; 
          } else if(this.createStaffForXeroAll){
            this.allStaff = true; 
          }
          //this.initializeAllPagination();
          this.fetchEmployeesfromXero();
        }  else if(this.createEntityForXeroOnly || this.createEntityForXeroAll){
          console.log('❌ entity creation cancelled – returning to table');
          
          console.log('❌ entity creation cancelled – returning to table1111');
          this.allEntities = false;
          this.matchedEntity = false;
          this.systemEntity = false;
          this.xeroEntity = false;
          this.createEntity = false;
          if(this.createEntityForXeroOnly){
            this.xeroEntity = true; 
          } else if(this.createEntityForXeroAll){
            this.allEntities = true; 
          }
          //this.initializeAllPagination();
          setTimeout(() => {
          this.fetchContactsfromXero();
          }, 2000); // 2-second delay
        
        }
        
    }

  fetchContactsfromXero() {
    getXeroContacts()
      .then((result) => {
        console.log('✅ Xero Contacts:', result);
        this.contacts = result;
        this.loadEntityDetailsfromSystem();
      })
      .catch((error) => {
        console.error('❌ Error fetching Contacts:', error);
        this.error = error;
      });
  }

  loadEntityDetailsfromSystem() {
    fetchEntityList()
        .then((result) => {
        console.log('✅ entity  Record:', result);
        this.entityListSystem = result;
        this.loadMockDataForEntity();
        })
        .catch((error) => {
        console.error('❌ Error fetching Contacts:', error);
        this.error = error;
        });
    }
    
  loadMockDataForEntity() {
    const xeroContacts = this.contacts || [];
    const systemEntity = this.entityListSystem || [];

    const matchedEntityList = [];
    const onlyInXeroEntityList = [];
    const onlyInSystemEntityList = [];

    const normalizeEmail = (email) => {
      return email
        ? email
          .toString()
          .toLowerCase()
          .trim()
          .replace(/\u00A0/g, '')
          .replace(/\s+/g, '')
        : null;
    };

    console.log('📥 Total Xero Contacts:', xeroContacts.length);
    console.log('📥 Total System Entity:', systemEntity.length);

    // Build system email map for fast lookup
    const systemEmailMap = new Map();
    systemEntity.forEach((e) => {
      const normalizedEmail = normalizeEmail(e.Email__c);
      if (normalizedEmail) {
        systemEmailMap.set(normalizedEmail, e);
      } else {
        console.warn('⚠️ Skipped system Entity with missing/invalid email:', e);
      }
    });

    // 1️⃣ Match Xero Contacts with System Entity by normalized email
    xeroContacts.forEach((entity) => {
      const normalizedEmail = normalizeEmail(entity.EmailAddress);
      const matchingEntity = normalizedEmail ? systemEmailMap.get(normalizedEmail) : null;
      // const addressObj1 = (entity.Addresses || []).find(addr => addr.AddressType === 'STREET') || entity.Addresses?.[0];
      // const formattedAddress1 = addressObj1
      //   ? `${addressObj1.AddressLine1 || ''}, ${addressObj1.City || ''}, ${addressObj1.Region || ''} ${addressObj1.PostalCode || ''}, ${addressObj1.Country || ''}`.replace(/,\s*,/g, ',').trim()
      //   : '';

      const addressObj = (entity.Addresses || []).find(addr => addr.AddressType === 'STREET' || addr.AddressType === 'POBOX') || entity.Addresses?.[0];         
      const formattedAddress = addressObj
        ? {
            street: addressObj.AddressLine1 || '',
            city: addressObj.City || '',
            region: addressObj.Region || '',
            postalCode: addressObj.PostalCode || '',
            country: addressObj.Country || ''
          }
        : null;

      // 📞 Get formatted phone number (prefer DEFAULT or MOBILE)
      // const phoneObj = (entity.Phones || []).find(p => p.PhoneType === 'DDI' || p.PhoneType === 'MOBILE' ||p.PhoneType === 'DEFAULT'||p.PhoneType === 'FAX') || entity.Phones?.[0];
      const phoneObj = (entity.Phones || []).find(p =>  p.PhoneType === 'MOBILE' || p.PhoneType === 'DEFAULT') || entity.Phones?.[0];
      const formattedPhone = phoneObj
        ? `${phoneObj.PhoneCountryCode ? '+' + phoneObj.PhoneCountryCode + ' ' : ''}${phoneObj.PhoneNumber || ''}`.trim()
        : '';

      if (matchingEntity) {
        matchedEntityList.push({
          id: entity.ContactID,
          //name: `${entity.FirstName || ''} ${entity.LastName || ''}`.trim(),
          systemEntityId: matchingEntity.Id,
          name: entity.Name || '',
          email: entity.EmailAddress,
          xeroId: entity.ContactID,
          inXero: true,
          inSystem: true,
          //facility: matchingEntity.Facility__c,
        });
        systemEmailMap.delete(normalizedEmail);
      } else {
        onlyInXeroEntityList.push({
          id: entity.ContactID,
          //name: `${entity.FirstName || ''} ${entity.LastName || ''}`.trim(),
          name: entity.Name || '',
         // firstName: entity.FirstName || '',
         // lastName: entity.LastName || '',
          email: entity.EmailAddress || '',
          xeroId: entity.ContactID,
          address: formattedAddress,
          //address1: formattedAddress1,
          phone: formattedPhone,
          abn:entity.TaxNumber|| '',
          inXero: true,
          inSystem: false,
        });
      }
    });

    // 2️⃣ Remaining system Entity → only in system
    systemEmailMap.forEach((e) => {
      onlyInSystemEntityList.push({
        id: e.Id,
        //name: s.NameToDisplay__c || s.Name || '—',
        name: ((e.First_Name__c && e.Last_Name__c )? `${e.First_Name__c} ${e.Last_Name__c}` : null)  || '—',
        email: e.Email__c || '',
        xeroId: null,
        inXero: false,
        inSystem: true,
        
      });
    });
    console.log('onlyInSystemEntityList : ', JSON.stringify(onlyInSystemEntityList));
    console.log('onlyInXeroEntityList : ', JSON.stringify(onlyInXeroEntityList));
    console.log('matchedEntityList : ', JSON.stringify(matchedEntityList));
    // 3️⃣ Combine for UI and enrich data
    this.matchedEntityList = matchedEntityList.map((entity) => this.enrichEntityData(entity));
    this.onlyInXeroEntityList = onlyInXeroEntityList.map((entity) => this.enrichEntityData(entity));
    this.onlyInSystemEntityList = onlyInSystemEntityList.map((entity) => this.enrichEntityData(entity));
    this.entityList = [...this.matchedEntityList, ...this.onlyInXeroEntityList, ...this.onlyInSystemEntityList];

    // Initialize pagination for all tables
    this.initializeAllEntityPagination();

    // 🧮 Counts
    this.matchedEntityCount = this.matchedEntityList.length;
    this.onlyInXeroEntityCount = this.onlyInXeroEntityList.length;
    this.onlyInSystemEntityCount = this.onlyInSystemEntityList.length;
    this.totaltEntityCount = this.entityList.length;

    console.log('✅ Matched Count:', this.matchedEntityCount);
    console.log('☁️ Only in Xero Count:', this.onlyInXeroEntityCount);
    console.log('🧩 Only in System Count:', this.onlyInSystemEntityCount);
    console.log('📋 Total Combined Entity List:', this.totaltEntityCount);

     this.entityRecordsToUpdateInSystem = this.matchedEntityList.map((entity) => ({
      systemEntityId:   entity.systemEntityId,
      xeroEntityId:  entity.xeroId
    }));

    console.log('📤 Final  entity Payload:', JSON.stringify(this.entityRecordsToUpdateInSystem, null, 2));

    updateXeroEntityIds({ entityMappings: this.entityRecordsToUpdateInSystem })
    .then(() => {
      console.log('✅ Xero IDs updated successfully!');
    })
    .catch((error) => {
      console.error('❌ Error updating Xero IDs:', error);
    });
  }
  enrichEntityData(entity) {
    const initials = this.getInitials(entity.name);
    const statusLabel = entity.inXero && entity.inSystem ? 'Synced' : entity.inXero ? 'Xero Only' : 'System Only';
    const statusClass = entity.inXero && entity.inSystem ? 'status-synced' : entity.inXero ? 'status-xero' : 'status-system';
    const rowClass = entity.inXero && entity.inSystem ? 'synced-row' : entity.inXero ? 'xero-only-row' : 'system-only-row';

    return {
      ...entity,
      initials,
      statusLabel,
      statusClass,
      rowClass,
      xeroIdDisplay: entity.xeroId || '—',
      showXeroButton: !entity.inXero,
      showSystemButton: !entity.inSystem,
      showAllSet: entity.inXero && entity.inSystem,
      entityData: JSON.stringify(entity)
    };
  }
  // Initialize pagination for all tables
  initializeAllEntityPagination() {
    // All Entity Pagination
    this.allEntitiesTotalRecords = this.entityList.length;
    this.allEntitiesTotalPages = Math.ceil(this.allEntitiesTotalRecords / this.allEntitiesPageSize);
    this.updateAllEntityPagination();

    // Matched Entity Pagination
    this.matchedEntityTotalRecords = this.matchedEntityList.length;
    this.matchedEntityTotalPages = Math.ceil(this.matchedEntityTotalRecords / this.matchedEntityPageSize);
    this.updateMatchedEntityPagination();

    // System Only Pagination
    this.systemEntityTotalRecords = this.onlyInSystemEntityList.length;
    this.systemEntityTotalPages = Math.ceil(this.systemEntityTotalRecords / this.systemEntityPageSize);
    this.updateSystemEntityPagination();
    console.log('this.onlyInXeroEntityList : ',JSON.stringify(this.onlyInXeroEntityList));
    // Xero Only Pagination
    this.xeroEntityTotalRecords = this.onlyInXeroEntityList.length;
    this.xeroEntityTotalPages = Math.ceil(this.xeroEntityTotalRecords / this.xeroEntityPageSize);
    this.updateXeroEntityPagination();
  }

  // All Entity Pagination Methods
  updateAllEntityPagination() {
    if (this.allEntitiesTotalRecords === 0) {
      this.paginatedEntityList = [];
      return;
    }
    const startIndex = (this.allEntitiesCurrentPage - 1) * this.allEntitiesPageSize;
    const endIndex = startIndex + this.allEntitiesPageSize;
    this.paginatedEntityList = this.entityList.slice(startIndex, endIndex);
  }

  handleAllEntitiesPageSizeChange(event) {
    console.log(' this.allEntitiesPageSize in handleAllEntitiesPageSizeChange before: ', this.allEntitiesPageSize);
    this.allEntitiesPageSize = parseInt(event.target.value, 10);
    this.allEntitiesTotalPages = Math.ceil(this.allEntitiesTotalRecords / this.allEntitiesPageSize);
    this.allEntitiesCurrentPage = 1;
    console.log(' this.allEntitiesPageSize in handleAllEntitiesPageSizeChange: ', this.allEntitiesPageSize);
    this.updateAllEntityPagination();
  }

  handleAllEntitiesFirstPage() { this.allEntitiesCurrentPage = 1; this.updateAllEntityPagination(); }
  handleAllEntitiesPrevPage() { if (this.allEntitiesCurrentPage > 1) { this.allEntitiesCurrentPage -= 1; this.updateAllEntityPagination(); } }
  handleAllEntitiesNextPage() { if (this.allEntitiesCurrentPage < this.allEntitiesTotalPages) { this.allEntitiesCurrentPage += 1; this.updateAllEntityPagination(); } }
  handleAllEntitiesLastPage() { this.allEntitiesCurrentPage = this.allEntitiesTotalPages; this.updateAllEntityPagination(); }
  get allEntitiesDisableFirstPrev() { return this.allEntitiesCurrentPage === 1; }
  get allEntitiesDisableNextLast() { return this.allEntitiesCurrentPage === this.allEntitiesTotalPages; }

  // Matched Entity Pagination Methods
  updateMatchedEntityPagination() {
    if (this.matchedEntityTotalRecords === 0) {
      this.paginatedMatchedEntityList = [];
      return;
    }
    const startIndex = (this.matchedEntityCurrentPage - 1) * this.matchedEntityPageSize;
    const endIndex = startIndex + this.matchedEntityPageSize;
    this.paginatedMatchedEntityList = this.matchedEntityList.slice(startIndex, endIndex);
  }

  handleMatchedEntityPageSizeChange(event) {
    this.matchedEntityPageSize = parseInt(event.target.value, 10);
    this.matchedEntityTotalPages = Math.ceil(this.matchedEntityTotalRecords / this.matchedEntityPageSize);
    this.matchedEntityCurrentPage = 1;
    this.updateMatchedEntityPagination();
  }

  handleMatchedEntityFirstPage() { this.matchedEntityCurrentPage = 1; this.updateMatchedEntityPagination(); }
  handleMatchedEntityPrevPage() { if (this.matchedEntityCurrentPage > 1) { this.matchedEntityCurrentPage -= 1; this.updateMatchedEntityPagination(); } }
  handleMatchedEntityNextPage() { if (this.matchedEntityCurrentPage < this.matchedEntityTotalPages) { this.matchedEntityCurrentPage += 1; this.updateMatchedEntityPagination(); } }
  handleMatchedEntityLastPage() { this.matchedEntityCurrentPage = this.matchedEntityTotalPages; this.updateMatchedEntityPagination(); }
  get matchedEntityDisableFirstPrev() { return this.matchedEntityCurrentPage === 1; }
  get matchedEntityDisableNextLast() { return this.matchedEntityCurrentPage === this.matchedEntityTotalPages; }

  // System Only Pagination Methods
  updateSystemEntityPagination() {
    if (this.systemEntityTotalRecords === 0) {
      this.paginatedSystemEntityList = [];
      return;
    }
    const startIndex = (this.systemEntityCurrentPage - 1) * this.systemEntityPageSize;
    const endIndex = startIndex + this.systemEntityPageSize;
    this.paginatedSystemEntityList = this.onlyInSystemEntityList.slice(startIndex, endIndex);
  }

  handleSystemEntityPageSizeChange(event) {
    this.systemEntityPageSize = parseInt(event.target.value, 10);
    this.systemEntityTotalPages = Math.ceil(this.systemEntityTotalRecords / this.systemEntityPageSize);
    this.systemEntityCurrentPage = 1;
    this.updateSystemEntityPagination();
  }

  handleSystemEntityFirstPage() { this.systemEntityCurrentPage = 1; this.updateSystemEntityPagination(); }
  handleSystemEntityPrevPage() { if (this.systemEntityCurrentPage > 1) { this.systemEntityCurrentPage -= 1; this.updateSystemEntityPagination(); } }
  handleSystemEntityNextPage() { if (this.systemEntityCurrentPage < this.systemEntityTotalPages) { this.systemEntityCurrentPage += 1; this.updateSystemEntityPagination(); } }
  handleSystemEntityLastPage() { this.systemEntityCurrentPage = this.systemEntityTotalPages; this.updateSystemEntityPagination(); }
  get systemEntityDisableFirstPrev() { return this.systemEntityCurrentPage === 1; }
  get systemEntityDisableNextLast() { return this.systemEntityCurrentPage === this.systemEntityTotalPages; }

  // Xero Only Pagination Methods
  updateXeroEntityPagination() {
    if (this.xeroEntityTotalRecords === 0) {
      this.paginatedXeroEntityList = [];
      return;
    }
    const startIndex = (this.xeroEntityCurrentPage - 1) * this.xeroPageSize;
    const endIndex = startIndex + this.xeroEntityPageSize;
    this.paginatedXeroEntityList = this.onlyInXeroEntityList.slice(startIndex, endIndex);
  }

  handleXeroEntityPageSizeChange(event) {
    this.xeroEntityPageSize = parseInt(event.target.value, 10);
    this.xeroEntityTotalPages = Math.ceil(this.xeroEntityTotalRecords / this.xeroEntityPageSize);
    this.xeroEntityCurrentPage = 1;
    this.updateXeroEntityPagination();
  }

  handleXeroEntityFirstPage() { this.xeroEntityCurrentPage = 1; this.updateXeroEntityPagination(); }
  handleXeroEntityPrevPage() { if (this.xeroEntityCurrentPage > 1) { this.xeroEntityCurrentPage -= 1; this.updateXeroEntityPagination(); } }
  handleXeroEntityNextPage() { if (this.xeroEntityCurrentPage < this.xeroEntityTotalPages) { this.xeroEntityCurrentPage += 1; this.updateXeroEntityPagination(); } }
  handleXeroEntityLastPage() { this.xeroEntityCurrentPage = this.xeroEntityTotalPages; this.updateXeroEntityPagination(); }
  get xeroEntityDisableFirstPrev() { return this.xeroEntityCurrentPage === 1; }
  get xeroEntityDisableNextLast() { return this.xeroEntityCurrentPage === this.xeroEntityTotalPages; }

  // Tab switching methods
  handleAllEntities() {
    this.allEntities = true;
    this.matchedEntity = false;
    this.systemEntity = false;
    this.xeroEntity = false;
  }

  handleMatchedEntities() {
    this.allEntities = false;
    this.matchedEntity = true;
    this.systemEntity = false;
    this.xeroEntity = false;
  }

  handleSystemEntities() {
    this.allEntities = false;
    this.matchedEntity = false;
    this.systemEntity = true;
    this.xeroEntity = false;
  }

  handleXeroEntities() {
    this.allEntities = false;
    this.matchedEntity = false;
    this.systemEntity = false;
    this.xeroEntity = true;
  }

  handleCreateInXeroForEntity(event) {
    console.log('handleCreateInXeroForEntity calling:');
    const entityId = event.currentTarget.dataset.id;
    console.log('➕ Add to Xero for entity ID:', entityId);

    // Call Apex
    createEntityInXero({ entityId: entityId }) // pass parameters as object
        .then((result) => {
            console.log('✅ Xero creation result:', result);
            this.showToast('Success', 'Entity has Created in the Xero', 'success');
            this.fetchContactsfromXero();
        })
        .catch((error) => {
            console.error('❌ Error creating Entity in Xero:', error);
            // Optionally, show error toast
        });
  } 
  @track createEntity = false;
  @track entitydata;
  handleCreateInSystemEntity(event) {
    const entityId = event.currentTarget.dataset.id;
    const entityStr = event.currentTarget.dataset.entitydata;
  //   const entityName = event.currentTarget.dataset.name;
  //   const entityEmail = event.currentTarget.dataset.email;
  //  const entityXeroId = event.currentTarget.dataset.xeroId;
    console.log('➕ Add to System for entity ID:', entityId);
    
    this.createEntity = true;
    try {
      const parsedEntity = JSON.parse(entityStr);
      this.entityData = parsedEntity;

      console.log('Parsed entityData:', parsedEntity);
    } catch (e) {
      console.error('❌ Failed to parse entitydata:', e);
      this.entityData = null;
    }
    if(this.xeroEntity){
       this.createEntityForXeroOnly = true; 
    } else if(this.allEntities){
      this.createEntityForXeroAll = true; 
    }
     //this.fetchContactsfromXero();
  }

}