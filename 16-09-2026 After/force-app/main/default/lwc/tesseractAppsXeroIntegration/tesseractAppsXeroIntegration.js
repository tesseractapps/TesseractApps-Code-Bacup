import { LightningElement, track, api } from "lwc";
import getXeroEmployees from '@salesforce/apex/XeroIntegrationController.getXeroEmployees';
import getXeroContacts from '@salesforce/apex/XeroIntegrationController.getXeroContacts';
import fetchStaff from '@salesforce/apex/XeroIntegrationController.fetchStaffList';
import fetchEntityList from '@salesforce/apex/XeroIntegrationController.fetchEntityList';
import createStaffInXero from '@salesforce/apex/XeroIntegrationController.createOrUpdateXeroEmployee';
import createEntityInXero from '@salesforce/apex/XeroIntegrationController.createOrUpdateXeroContacts';
import updateXeroEmployeeIds from '@salesforce/apex/XeroIntegrationController.updateXeroEmployeeIds';
import updateXeroEntityIds from '@salesforce/apex/XeroIntegrationController.updateXeroEntityIds';
import getFullXeroEmployee from '@salesforce/apex/XeroIntegrationController.getFullXeroEmployee';
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

  // ✅ Loading states (NEW)
  @track isPageLoading = false;
  @track loadingMessage = 'Loading...';

  // Search properties
  @track allStaffSearchTerm = '';
  @track matchedStaffSearchTerm = '';
  @track systemStaffSearchTerm = '';
  @track xeroStaffSearchTerm = '';

  @track allEntitiesSearchTerm = '';
  @track matchedEntitySearchTerm = '';
  @track systemEntitySearchTerm = '';
  @track xeroEntitySearchTerm = '';

  // Filtered lists for search
  @track filteredStaffList = [];
  @track filteredMatchedList = [];
  @track filteredSystemList = [];
  @track filteredXeroList = [];

  @track filteredEntityList = [];
  @track filteredMatchedEntityList = [];
  @track filteredSystemEntityList = [];
  @track filteredXeroEntityList = [];

  @track staffFirstName;
  @track staffLastName;
  @track staffEmail;
  @track staffXeroId;
  @track xeroJobTitle;
  @track xeroEmploymentType;
  @track xeroIncomeType;
  @track xeroEmploymentBasis;
  @track xeroTfn;
  @track xeroResidencyStatus;
  @track xeroTaxScaleType;
  @track xeroTaxOffset;
  @track xeroBankAccountName;
  @track xeroBankBsb;
  @track xeroBankAccountNumber;
  @track xeroSuperFundId;
  @track xeroSuperMemberNumber;
  @track xeroEarningsLines;
  // Add these new @track variables to your existing @track declarations
  @track xeroGender;
  @track xeroMobile;
  @track xeroPhone;
  @track xeroTitle;
  @track xeroMiddleNames;
  @track xeroStartDate;
  @track xeroClassification;
  @track xeroOrdinaryEarningsRateId;
  @track xeroPayrollCalendarId;
  @track xeroIsSTP2Qualified;
  @track xeroIsAuthorisedToApproveLeave;
  @track xeroIsAuthorisedToApproveTimesheets;
  @track xeroTaxFreeThresholdClaimed;
  @track xeroAustralianResidentForTaxPurposes;
  @track xeroHasHELPDebt;
  @track xeroHasSFSSDebt;
  @track xeroHasTradeSupportLoanDebt;
  @track xeroHasLoanOrStudentDebt;
  @track xeroEligibleToReceiveLeaveLoading;
  @track xeroIncludeLeaveLoadingInSGC;
  @track xeroIncludeLeaveLoadingInQualifyingEarnings;
  @track xeroTfnExemptionType;
  @track xeroBankStatementText;
  @track xeroBankRemainder;
  @track xeroBankAmount;
  @track xeroSuperMembershipId;
  @track xeroDeductionLines;
  @track xeroSuperLines;
  @track xeroReimbursementLines;
  @track xeroLeaveLines;
  @track xeroOpeningBalanceDate;
  @track xeroOpeningTax;
  @track xeroOpeningEarningsLines;
  @track xeroOpeningDeductionLines;
  @track xeroOpeningSuperLines;
  @track xeroOpeningReimbursementLines;
  @track xeroOpeningLeaveLines;
  @track xeroLeaveBalances;

  connectedCallback() {
    const storedFacilityId = localStorage.getItem('defaultFacilityId');
    console.log('storedFacilityId >>', storedFacilityId);
    console.log('org id in connectedCallback 1 >> ', this.orgid);
    if (storedFacilityId) {
      this.recordId = storedFacilityId;
      console.log('Facility Id >>', this.recordId);
      this.fetchEmployeesfromXero();
    }
  }

  fetchEmployeesfromXero() {
    // ✅ Show global loading overlay
    this.isPageLoading = true;
    this.loadingMessage = 'Fetching employees from Xero...';

    getXeroEmployees()
      .then((result) => {
        console.log('✅ Xero Employees:', result);
        this.employees = result;
        this.loadingMessage = 'Loading staff from system...';
        this.loadStaffDetailsfromSystem();
      })
      .catch((error) => {
        console.error('❌ Error fetching employees:', error);
        this.error = error;
        // ✅ Hide overlay on error
        this.isPageLoading = false;
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
      })
      .finally(() => {
        // ✅ Hide overlay when done
        this.isPageLoading = false;
      });
  }

  get showPayroll() {
    return this.activeTab === "payroll";
  }

  get showInvoices() {
    return this.activeTab === "invoices";
  }

  get showEarningRates() {
    return this.activeTab === "earningRates";
  }

  get payrollTabClass() {
    return this.activeTab === "payroll" ? "menu-item1" : "menu-item";
  }

  get invoicesTabClass() {
    return this.activeTab === "invoices" ? "menu-item1" : "menu-item";
  }

  get earningRatesTabClass() {
    return this.activeTab === "earningRates" ? "menu-item1" : "menu-item";
  }

  handleTabChange(event) {
    const selectedTab = event.currentTarget.dataset.tab;
    this.activeTab = selectedTab;

    console.log("🔄 Tab changed to:", selectedTab);

    if (this.activeTab === "invoices") {
      this.fetchContactsfromXero();
      this.allEntities = true;
      this.matchedEntity = false;
      this.systemEntity = false;
      this.xeroEntity = false;

    } else if (this.activeTab === "payroll") {
      this.fetchEmployeesfromXero();
    } else if (this.activeTab === "earningRates") {
      //this.fetchEmployeesfromXero();
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

    // 🧭 Format Xero Date
    const formatXeroDate = (xeroDateString) => {
      if (!xeroDateString || typeof xeroDateString !== 'string') return null;
      try {
        const match = xeroDateString.match(/\/Date\(([-\d]+)\+\d+\)\//);
        if (!match) {
          const date = new Date(xeroDateString);
          if (!isNaN(date.getTime())) {
            const day = String(date.getUTCDate()).padStart(2, '0');
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const year = date.getUTCFullYear();
            return `${day}/${month}/${year}`;
          }
          return null;
        }
        const timestamp = parseInt(match[1], 10);
        if (isNaN(timestamp)) return null;
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return null;
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}/${month}/${year}`;
      } catch (e) {
        console.error('⚠️ Error parsing DateOfBirth:', xeroDateString, e);
        return null;
      }
    };

    // 🧭 Format System Date
    const formatSystemDate = (systemDateString) => {
      if (!systemDateString) return null;
      try {
        const date = new Date(systemDateString);
        if (isNaN(date.getTime())) return null;
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

    // 🔹 Build system email map
    const systemEmailMap = new Map();
    systemStaff.forEach((s) => {
      const normalizedEmail = normalizeEmail(s.Email_Address__c);
      if (normalizedEmail) {
        systemEmailMap.set(normalizedEmail, s);
      } else {
        console.warn('⚠️ Skipped system staff with missing/invalid email:', s);
      }
    });

    // 🔸 1️⃣ Match Xero employees with System staff (ONLY BASIC FIELDS)
    xeroEmployees.forEach((emp) => {
      const normalizedEmail = normalizeEmail(emp.Email);
      const matchingStaff = normalizedEmail ? systemEmailMap.get(normalizedEmail) : null;
      const formattedDOB = formatXeroDate(emp.DateOfBirth);

      // 🔹 ONLY BASIC fields (no nested objects)
      const xeroData = {
        firstName: emp.FirstName || '',
        lastName: emp.LastName || '',
        email: emp.Email || '',
        xeroId: emp.EmployeeID || '',
        dateOfBirth: formattedDOB || '',
        // Only store basic fields to keep data light
      };

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
          dateOfBirth: formattedSystemDOB || formattedDOB,
          ...xeroData
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
          dateOfBirth: formattedDOB,
          ...xeroData
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
        dateOfBirth: formattedSystemDOB,
        firstName: s.Name || '',
        lastName: s.Last_Name__c || '',
      });
    });

    // 🔸 3️⃣ Combine + enrich for UI
    this.matchedList = matchedList.map((staff) => this.enrichStaffData(staff));
    this.onlyInXeroList = onlyInXeroList.map((staff) => this.enrichStaffData(staff));
    this.onlyInSystemList = onlyInSystemList.map((staff) => this.enrichStaffData(staff));
    this.staffList = [...this.matchedList, ...this.onlyInXeroList, ...this.onlyInSystemList];

    this.filteredStaffList = [...this.staffList];
    this.filteredMatchedList = [...this.matchedList];
    this.filteredSystemList = [...this.onlyInSystemList];
    this.filteredXeroList = [...this.onlyInXeroList];

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
      const xeroEmp = xeroEmployees.find(e => e.EmployeeID === staff.xeroId);
      return {
        systemStaffId: staff.systemStaffId,
        xeroEmployeeId: staff.xeroId,
        ordinaryEarningsRateId: xeroEmp?.OrdinaryEarningsRateID || null
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
    // All Staff Pagination - using filtered list
    this.allTotalRecords = this.filteredStaffList.length;
    this.allTotalPages = Math.ceil(this.allTotalRecords / this.allPageSize);
    this.updateAllPagination();

    // Matched Staff Pagination
    this.matchedTotalRecords = this.filteredMatchedList.length;
    this.matchedTotalPages = Math.ceil(this.matchedTotalRecords / this.matchedPageSize);
    this.updateMatchedPagination();

    // System Only Pagination
    this.systemTotalRecords = this.filteredSystemList.length;
    this.systemTotalPages = Math.ceil(this.systemTotalRecords / this.systemPageSize);
    this.updateSystemPagination();

    // Xero Only Pagination
    this.xeroTotalRecords = this.filteredXeroList.length;
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
    this.paginatedStaffList = this.filteredStaffList.slice(startIndex, endIndex);
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
    this.paginatedMatchedList = this.filteredMatchedList.slice(startIndex, endIndex);
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
    this.paginatedSystemList = this.filteredSystemList.slice(startIndex, endIndex);
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
    this.paginatedXeroList = this.filteredXeroList.slice(startIndex, endIndex);
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
    this.allStaffSearchTerm = '';
    this.filteredStaffList = [...this.staffList];
    this.allTotalRecords = this.filteredStaffList.length;
    this.allCurrentPage = 1;
    this.updateAllPagination();
  }

  handleMatchedStaff() {
    this.allStaff = false;
    this.matchedStaff = true;
    this.systemStaff = false;
    this.xeroStaff = false;
    this.matchedStaffSearchTerm = '';
    this.filteredMatchedList = [...this.matchedList];
    this.matchedTotalRecords = this.filteredMatchedList.length;
    this.matchedCurrentPage = 1;
    this.updateMatchedPagination();
  }

  handleSystemStaff() {
    this.allStaff = false;
    this.matchedStaff = false;
    this.systemStaff = true;
    this.xeroStaff = false;
    this.systemStaffSearchTerm = '';
    this.filteredSystemList = [...this.onlyInSystemList];
    this.systemTotalRecords = this.filteredSystemList.length;
    this.systemCurrentPage = 1;
    this.updateSystemPagination();
  }

  handleXeroStaff() {
    this.allStaff = false;
    this.matchedStaff = false;
    this.systemStaff = false;
    this.xeroStaff = true;
    this.xeroStaffSearchTerm = '';
    this.filteredXeroList = [...this.onlyInXeroList];
    this.xeroTotalRecords = this.filteredXeroList.length;
    this.xeroCurrentPage = 1;
    this.updateXeroPagination();
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

    // 🔹 Only basic data in staffData (full details will be fetched on demand)
    const staffData = {
      firstName: staff.firstName || '',
      lastName: staff.lastName || '',
      email: staff.email || '',
      xeroId: staff.xeroId || '',
      dateOfBirth: staff.dateOfBirth || '',
      // Only store basic fields
    };

    return {
      ...staff,
      initials,
      statusLabel,
      statusClass,
      rowClass,
      xeroIdDisplay: staff.xeroId || '—',
      showXeroButton: !staff.inXero,
      showSystemButton: !staff.inSystem,
      showAllSet: staff.inXero && staff.inSystem,
      staffData: JSON.stringify(staffData), // ✅ Only basic data as fallback
      // ✅ Spinner flags (default false)
      isCreatingInXero: false,
      isCreatingInSystem: false
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

    // ✅ Set loading flag on the specific row
    this.toggleRowLoading(staffId, 'isCreatingInXero', true);

    // Call Apex
    createStaffInXero({ staffId: staffId })
      .then((result) => {
        console.log('✅ Xero creation result:', result);
        this.showToast('Success', 'Staff has Created in the Xero', 'success');
        this.fetchEmployeesfromXero();
      })
      .catch((error) => {
        console.error('❌ Error creating staff in Xero:', error);
        console.error('❌ Full error:', JSON.stringify(error));

        // ✅ Reset loading flag
        this.toggleRowLoading(staffId, 'isCreatingInXero', false);

        let errorMessage = 'Failed to create staff in Xero.';

        if (error?.body?.message) {
          errorMessage = error.body.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        // If Apex returns the Xero response inside the message
        if (errorMessage.includes('Xero Create API Error:')) {
          errorMessage = errorMessage
            .split('Xero Create API Error:')
            .pop()
            .trim();
        }

        // Try to extract the ValidationErrors message
        try {
          const match = errorMessage.match(
            /"ValidationErrors":\s*\[\s*\{\s*"Message":\s*"([^"]+)"/
          );

          if (match && match[1]) {
            errorMessage = match[1];
          }
        } catch (parseError) {
          console.error('❌ Error parsing Xero error:', parseError);
        }

        if (
          !errorMessage ||
          errorMessage === 'Script-thrown exception'
        ) {
          errorMessage = 'Failed to create employee in Xero.';
        }

        console.log('❌ Final error message:', errorMessage);

        this.showToast(
          'Error',
          errorMessage,
          'error'
        );
      });
  }

  @track createStaff = false;

  handleCreateInSystem(event) {
    const staffId = event.currentTarget.dataset.id;
    const staffDataStr = event.currentTarget.dataset.staffdata;

    console.log('➕ Add to System for staff ID:', staffId);
    console.log('staffDataStr:', staffDataStr);

    // ✅ Set loading flag on the specific row
    this.toggleRowLoading(staffId, 'isCreatingInSystem', true);

    if (!staffDataStr || staffDataStr === 'undefined' || staffDataStr === 'null') {
      console.warn('No staff data found for ID:', staffId);
      // ✅ Reset loading flag
      this.toggleRowLoading(staffId, 'isCreatingInSystem', false);
      this.showToast(
        'Error',
        'No Xero data available for this staff member. Please refresh and try again.',
        'error'
      );
      return;
    }

    let xeroStaff;

    try {
      xeroStaff = JSON.parse(staffDataStr);
      console.log('✅ Parsed basic staff data:', xeroStaff);
    } catch (error) {
      console.error('Error parsing staff data:', error);
      // ✅ Reset loading flag
      this.toggleRowLoading(staffId, 'isCreatingInSystem', false);
      this.showToast(
        'Error',
        'Failed to parse staff data. Please try again.',
        'error'
      );
      return;
    }

    console.log(
      '🔄 Fetching full Xero employee data for ID:',
      xeroStaff.xeroId
    );

    this.showToast(
      'Loading',
      'Fetching employee data from Xero...',
      'info'
    );

    getFullXeroEmployee({
      employeeId: xeroStaff.xeroId
    })
      .then((fullEmployeeData) => {
        console.log(
          '✅ Full Xero employee data received:',
          fullEmployeeData
        );

        // Populate all Xero data on the parent
        this.populateStaffData(
          fullEmployeeData,
          xeroStaff
        );

        // Set flags
        if (this.xeroStaff) {
          this.createStaffForXeroOnly = true;
        } else if (this.allStaff) {
          this.createStaffForXeroAll = true;
        }

        // Show child component
        this.createStaff = true;

        // Wait for child component to render
        setTimeout(() => {
          const childComponent =
            this.template.querySelector(
              'c-staff-data-community'
            );

          console.log(
            '🔍 Child component found:',
            childComponent
          );

          if (
            childComponent &&
            typeof childComponent.handleCreateInSystem === 'function'
          ) {

            // ================================
            // ALL XERO DATA TO CHILD
            // ================================
            const dataToPass = {
              firstName: this.staffFirstName,
              lastName: this.staffLastName,
              email: this.staffEmail,
              xeroId: this.staffXeroId,
              dateOfBirth: this.xeroDateOfBirth,

              gender: this.xeroGender,
              mobile: this.xeroMobile,
              phone: this.xeroPhone,
              title: this.xeroTitle,
              middleNames: this.xeroMiddleNames,

              addressLine1: this.xeroAddressLine1,
              city: this.xeroCity,
              region: this.xeroRegion,
              postalCode: this.xeroPostalCode,
              country: this.xeroCountry,

              jobTitle: this.xeroJobTitle,
              employmentType: this.xeroEmploymentType,
              incomeType: this.xeroIncomeType,
              employmentBasis: this.xeroEmploymentBasis,
              startDate: this.xeroStartDate,
              classification: this.xeroClassification,

              ordinaryEarningsRateId:
                this.xeroOrdinaryEarningsRateId,

              payrollCalendarId:
                this.xeroPayrollCalendarId,

              isSTP2Qualified:
                this.xeroIsSTP2Qualified,

              isAuthorisedToApproveLeave:
                this.xeroIsAuthorisedToApproveLeave,

              isAuthorisedToApproveTimesheets:
                this.xeroIsAuthorisedToApproveTimesheets,

              tfn: this.xeroTfn,
              residencyStatus:
                this.xeroResidencyStatus,

              taxScaleType:
                this.xeroTaxScaleType,

              taxOffset:
                this.xeroTaxOffset,

              taxFreeThresholdClaimed:
                this.xeroTaxFreeThresholdClaimed,

              australianResidentForTaxPurposes:
                this.xeroAustralianResidentForTaxPurposes,

              hasHELPDebt:
                this.xeroHasHELPDebt,

              hasSFSSDebt:
                this.xeroHasSFSSDebt,

              hasTradeSupportLoanDebt:
                this.xeroHasTradeSupportLoanDebt,

              hasLoanOrStudentDebt:
                this.xeroHasLoanOrStudentDebt,

              eligibleToReceiveLeaveLoading:
                this.xeroEligibleToReceiveLeaveLoading,

              includeLeaveLoadingInSGC:
                this.xeroIncludeLeaveLoadingInSGC,

              includeLeaveLoadingInQualifyingEarnings:
                this.xeroIncludeLeaveLoadingInQualifyingEarnings,

              tfnExemptionType:
                this.xeroTfnExemptionType,

              // ================================
              // BANK
              // ================================
              bankAccountName:
                this.xeroBankAccountName,

              bankBsb:
                this.xeroBankBsb,

              bankAccountNumber:
                this.xeroBankAccountNumber,

              bankStatementText:
                this.xeroBankStatementText,

              bankRemainder:
                this.xeroBankRemainder,

              bankAmount:
                this.xeroBankAmount,

              // ================================
              // SUPER
              // ================================
              superFundId:
                this.xeroSuperFundId,

              superMemberNumber:
                this.xeroSuperMemberNumber,

              superMembershipId:
                this.xeroSuperMembershipId,

              // ================================
              // PAYROLL LINES
              // ================================
              earningsLines:
                this.xeroEarningsLines,

              deductionLines:
                this.xeroDeductionLines,

              superLines:
                this.xeroSuperLines,

              reimbursementLines:
                this.xeroReimbursementLines,

              leaveLines:
                this.xeroLeaveLines,

              // ================================
              // OPENING BALANCES
              // ================================
              openingBalanceDate:
                this.xeroOpeningBalanceDate,

              openingTax:
                this.xeroOpeningTax,

              openingEarningsLines:
                this.xeroOpeningEarningsLines,

              openingDeductionLines:
                this.xeroOpeningDeductionLines,

              openingSuperLines:
                this.xeroOpeningSuperLines,

              openingReimbursementLines:
                this.xeroOpeningReimbursementLines,

              openingLeaveLines:
                this.xeroOpeningLeaveLines,

              // ================================
              // LEAVE BALANCES
              // ================================
              leaveBalances:
                this.xeroLeaveBalances,

              // ================================
              // FLAGS
              // ================================
              createStaffForXeroOnly:
                this.createStaffForXeroOnly,

              createStaffForXeroAll:
                this.createStaffForXeroAll
            };

            console.log(
              '📤 Sending values to child handleCreateInSystem:',
              JSON.stringify(dataToPass)
            );

            // ✅ CALL CHILD handleCreateInSystem
            childComponent.handleCreateInSystem(
              dataToPass
            );

            console.log(
              '✅ Values successfully sent to child handleCreateInSystem'
            );

          } else {

            console.warn(
              '❌ Child component not found or handleCreateInSystem method not available'
            );

            console.log(
              'Child component:',
              childComponent
            );

            console.log(
              'handleCreateInSystem available:',
              childComponent
                ? typeof childComponent.handleCreateInSystem
                : 'N/A'
            );
          }

        }, 500);
      })
      .catch((error) => {

        console.error(
          '❌ Error fetching full Xero employee:',
          error
        );

        // ✅ Reset loading flag
        this.toggleRowLoading(staffId, 'isCreatingInSystem', false);

        this.showToast(
          'Error',
          'Failed to fetch complete employee data. Please try again.',
          'error'
        );
      });
  }

  // ✅ NEW METHOD: Populate all staff data from full Xero response
  populateStaffData(fullEmployee, basicStaff) {
    console.log('🔄 ========== POPULATE STAFF DATA START ==========');
    console.log('📦 Full Employee Data:', fullEmployee);
    console.log('📦 Basic Staff Data:', basicStaff);

    // Format date helper
    const formatXeroDate = (xeroDateString) => {
      if (!xeroDateString) return null;
      try {
        const match = xeroDateString.match(/\/Date\(([-\d]+)\+\d+\)\//);
        if (match) {
          const timestamp = parseInt(match[1], 10);
          const date = new Date(timestamp);
          if (!isNaN(date.getTime())) {
            const day = String(date.getUTCDate()).padStart(2, '0');
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const year = date.getUTCFullYear();
            return `${day}/${month}/${year}`;
          }
        }
        return null;
      } catch (e) {
        console.error('Error formatting date:', e);
        return null;
      }
    };

    // Get address from Xero - check both 'Addresses' and 'HomeAddress'
    let address = null;
    if (fullEmployee.Addresses && fullEmployee.Addresses.length > 0) {
      address = fullEmployee.Addresses.find(addr => addr.AddressType === 'STREET') || fullEmployee.Addresses[0];
    } else if (fullEmployee.HomeAddress) {
      address = fullEmployee.HomeAddress;
    }
    console.log('🏠 Address extracted:', address);

    // Get phone from Xero
    let phone = null;
    if (fullEmployee.Phones && fullEmployee.Phones.length > 0) {
      phone = fullEmployee.Phones.find(p => p.PhoneType === 'MOBILE' || p.PhoneType === 'DEFAULT') || fullEmployee.Phones[0];
    }
    console.log('📞 Phone extracted:', phone);

    // Get bank account from Xero
    const bankAccount = (fullEmployee.BankAccounts || [])[0];
    console.log('🏦 Bank Account extracted:', bankAccount);

    // Get Tax Declaration
    const taxDeclaration = fullEmployee.TaxDeclaration || {};
    console.log('💰 Tax Declaration extracted:', taxDeclaration);

    // Get Pay Template
    const payTemplate = fullEmployee.PayTemplate || {};
    console.log('📄 Pay Template extracted:', payTemplate);

    // Get Opening Balances
    const openingBalances = fullEmployee.OpeningBalances || {};
    console.log('📊 Opening Balances extracted:', openingBalances);

    const superMembership = (fullEmployee.SuperMemberships || [])[0];
    console.log('🏛️ Super Membership extracted:', superMembership);

    // =============================================
    // BASIC INFO
    // =============================================
    this.staffFirstName = basicStaff.firstName || fullEmployee.FirstName || '';
    this.staffLastName = basicStaff.lastName || fullEmployee.LastName || '';
    this.staffEmail = basicStaff.email || fullEmployee.Email || '';
    this.staffXeroId = basicStaff.xeroId || fullEmployee.EmployeeID || '';

    // =============================================
    // PERSONAL INFO
    // =============================================
    const formattedDateOfBirth = formatXeroDate(fullEmployee.DateOfBirth);
    this.xeroDateOfBirth = formattedDateOfBirth || basicStaff.dateOfBirth || '';
    this.xeroGender = fullEmployee.Gender || '';
    this.xeroMobile = fullEmployee.Mobile || '';
    this.xeroPhone = phone?.PhoneNumber || '';
    this.xeroTitle = fullEmployee.Title || '';
    this.xeroMiddleNames = fullEmployee.MiddleNames || '';

    // =============================================
    // ADDRESS
    // =============================================
    this.xeroAddressLine1 = address?.AddressLine1 || '';
    this.xeroCity = address?.City || '';
    this.xeroRegion = address?.Region || '';
    this.xeroPostalCode = address?.PostalCode || '';
    this.xeroCountry = address?.Country || '';

    // =============================================
    // EMPLOYMENT DETAILS
    // =============================================
    this.xeroJobTitle = fullEmployee.JobTitle || '';
    this.xeroEmploymentType = fullEmployee.EmploymentType || '';
    this.xeroIncomeType = fullEmployee.IncomeType || '';
    this.xeroEmploymentBasis = taxDeclaration.EmploymentBasis || '';
    const formattedStartDate = formatXeroDate(fullEmployee.StartDate);
    this.xeroStartDate = formattedStartDate || '';
    this.xeroClassification = fullEmployee.Classification || '';
    this.xeroOrdinaryEarningsRateId = fullEmployee.OrdinaryEarningsRateID || '';
    this.xeroPayrollCalendarId = fullEmployee.PayrollCalendarID || '';
    this.xeroIsSTP2Qualified = fullEmployee.IsSTP2Qualified || false;
    this.xeroIsAuthorisedToApproveLeave = fullEmployee.IsAuthorisedToApproveLeave || false;
    this.xeroIsAuthorisedToApproveTimesheets = fullEmployee.IsAuthorisedToApproveTimesheets || false;

    // =============================================
    // TAX DETAILS
    // =============================================
    this.xeroTfn = taxDeclaration.TaxFileNumber || '';
    this.xeroResidencyStatus = taxDeclaration.ResidencyStatus || '';
    this.xeroTaxScaleType = taxDeclaration.TaxScaleType || '';
    this.xeroTaxOffset = taxDeclaration.TaxOffset || '';
    this.xeroTaxFreeThresholdClaimed = taxDeclaration.TaxFreeThresholdClaimed || false;
    this.xeroAustralianResidentForTaxPurposes = taxDeclaration.AustralianResidentForTaxPurposes || false;
    this.xeroHasHELPDebt = taxDeclaration.HasHELPDebt || false;
    this.xeroHasSFSSDebt = taxDeclaration.HasSFSSDebt || false;
    this.xeroHasTradeSupportLoanDebt = taxDeclaration.HasTradeSupportLoanDebt || false;
    this.xeroHasLoanOrStudentDebt = taxDeclaration.HasLoanOrStudentDebt || false;
    this.xeroEligibleToReceiveLeaveLoading = taxDeclaration.EligibleToReceiveLeaveLoading || false;
    this.xeroIncludeLeaveLoadingInSGC = taxDeclaration.IncludeLeaveLoadingInSGC || false;
    this.xeroIncludeLeaveLoadingInQualifyingEarnings = taxDeclaration.IncludeLeaveLoadingInQualifyingEarnings || false;
    this.xeroTfnExemptionType = taxDeclaration.TFNExemptionType || '';

    // =============================================
    // BANK DETAILS
    // =============================================
    this.xeroBankAccountName = bankAccount?.AccountName || '';
    this.xeroBankBsb = bankAccount?.BSB || '';
    this.xeroBankAccountNumber = bankAccount?.AccountNumber || '';
    this.xeroBankStatementText = bankAccount?.StatementText || '';
    this.xeroBankRemainder = bankAccount?.Remainder || false;
    this.xeroBankAmount = bankAccount?.Amount || 0;

    // =============================================
    // SUPERANNUATION
    // =============================================
    this.xeroSuperFundId = superMembership?.SuperFundID || '';
    this.xeroSuperMemberNumber = superMembership?.EmployeeNumber || '';
    this.xeroSuperMembershipId = superMembership?.SuperMembershipID || '';

    // =============================================
    // EARNINGS LINES
    // =============================================
    const earningsLines = payTemplate.EarningsLines || [];
    const deductionLines = payTemplate.DeductionLines || [];
    const superLines = payTemplate.SuperLines || [];
    const reimbursementLines = payTemplate.ReimbursementLines || [];
    const leaveLines = payTemplate.LeaveLines || [];

    this.xeroEarningsLines = earningsLines.length > 0 ? JSON.stringify(earningsLines) : '';
    this.xeroDeductionLines = deductionLines.length > 0 ? JSON.stringify(deductionLines) : '';
    this.xeroSuperLines = superLines.length > 0 ? JSON.stringify(superLines) : '';
    this.xeroReimbursementLines = reimbursementLines.length > 0 ? JSON.stringify(reimbursementLines) : '';
    this.xeroLeaveLines = leaveLines.length > 0 ? JSON.stringify(leaveLines) : '';

    // =============================================
    // OPENING BALANCES
    // =============================================
    const formattedOpeningBalanceDate = formatXeroDate(openingBalances.OpeningBalanceDate);
    this.xeroOpeningBalanceDate = formattedOpeningBalanceDate || '';
    this.xeroOpeningTax = openingBalances.OpeningTax || '';
    this.xeroOpeningEarningsLines = openingBalances.EarningsLines ? JSON.stringify(openingBalances.EarningsLines) : '';
    this.xeroOpeningDeductionLines = openingBalances.DeductionLines ? JSON.stringify(openingBalances.DeductionLines) : '';
    this.xeroOpeningSuperLines = openingBalances.SuperLines ? JSON.stringify(openingBalances.SuperLines) : '';
    this.xeroOpeningReimbursementLines = openingBalances.ReimbursementLines ? JSON.stringify(openingBalances.ReimbursementLines) : '';
    this.xeroOpeningLeaveLines = openingBalances.LeaveLines ? JSON.stringify(openingBalances.LeaveLines) : '';

    // =============================================
    // LEAVE BALANCES
    // =============================================
    const leaveBalances = fullEmployee.LeaveBalances || [];
    this.xeroLeaveBalances = leaveBalances.length > 0 ? JSON.stringify(leaveBalances) : '';

    console.log('✅ All Xero data populated successfully:');
    console.log('  - First Name:', this.staffFirstName);
    console.log('  - Last Name:', this.staffLastName);
    console.log('  - Email:', this.staffEmail);
    console.log('  - Xero ID:', this.staffXeroId);
    console.log('  - Date of Birth:', this.xeroDateOfBirth);
    console.log('  - Address:', this.xeroAddressLine1, this.xeroCity, this.xeroRegion);
    console.log('  - Job Title:', this.xeroJobTitle);
    console.log('  - TFN:', this.xeroTfn);
    console.log('  - Super Fund ID:', this.xeroSuperFundId);
    console.log('  - Bank Account:', this.xeroBankAccountName);
  }

  // 🔹 Helper method to format Xero date in JavaScript (fallback)
  formatXeroDate(xeroDateString) {
    if (!xeroDateString) return null;
    try {
      const match = xeroDateString.match(/\/Date\(([-\d]+)\+\d+\)\//);
      if (match) {
        const timestamp = parseInt(match[1], 10);
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          const day = String(date.getUTCDate()).padStart(2, '0');
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const year = date.getUTCFullYear();
          return `${day}/${month}/${year}`;
        }
      }
      return null;
    } catch (e) {
      console.error('Error formatting date:', e);
      return null;
    }
  }

  // Computed properties for empty states
  get hasNoStaff() {
    return this.filteredStaffList.length === 0;
  }

  get hasNoMatchedStaff() {
    return this.filteredMatchedList.length === 0;
  }

  get hasNoSystemStaff() {
    return this.filteredSystemList.length === 0;
  }

  get hasNoXeroStaff() {
    return this.filteredXeroList.length === 0;
  }

  get hasNoEntity() {
    return this.filteredEntityList.length === 0;
  }

  get hasNoMatchedEntity() {
    return this.filteredMatchedEntityList.length === 0;
  }

  get hasNoSystemEntity() {
    return this.filteredSystemEntityList.length === 0;
  }

  get hasNoXeroEntity() {
    return this.filteredXeroEntityList.length === 0;
  }

  showToast(title, message, variant) {
    const event = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant,
      mode: 'dismissable'
    });
    this.dispatchEvent(event);
  }

  handleBackToXero() {

    if (this.createStaffForXeroOnly || this.createStaffForXeroAll) {
      console.log('❌ Staff creation cancelled – returning to table');
      this.createStaff = false;
      this.allStaff = false;
      this.matchedStaff = false;
      this.systemStaff = false;
      this.xeroStaff = false;
      if (this.createStaffForXeroOnly) {
        this.xeroStaff = true;
      } else if (this.createStaffForXeroAll) {
        this.allStaff = true;
      }
      this.fetchEmployeesfromXero();
    } else if (this.createEntityForXeroOnly || this.createEntityForXeroAll) {
      console.log('❌ entity creation cancelled – returning to table');

      console.log('❌ entity creation cancelled – returning to table1111');
      this.allEntities = false;
      this.matchedEntity = false;
      this.systemEntity = false;
      this.xeroEntity = false;
      this.createEntity = false;
      if (this.createEntityForXeroOnly) {
        this.xeroEntity = true;
      } else if (this.createEntityForXeroAll) {
        this.allEntities = true;
      }
      setTimeout(() => {
        this.fetchContactsfromXero();
      }, 2000);
    }

  }

  fetchContactsfromXero() {
    // ✅ Show global loading overlay
    this.isPageLoading = true;
    this.loadingMessage = 'Fetching contacts from Xero...';

    getXeroContacts()
      .then((result) => {
        console.log('✅ Xero Contacts:', result);
        this.contacts = result;
        this.loadingMessage = 'Loading entities from system...';
        this.loadEntityDetailsfromSystem();
      })
      .catch((error) => {
        console.error('❌ Error fetching Contacts:', error);
        this.error = error;
        // ✅ Hide overlay on error
        this.isPageLoading = false;
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
      })
      .finally(() => {
        // ✅ Hide overlay when done
        this.isPageLoading = false;
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

      const phoneObj = (entity.Phones || []).find(p => p.PhoneType === 'MOBILE' || p.PhoneType === 'DEFAULT') || entity.Phones?.[0];
      const formattedPhone = phoneObj
        ? `${phoneObj.PhoneCountryCode ? '+' + phoneObj.PhoneCountryCode + ' ' : ''}${phoneObj.PhoneNumber || ''}`.trim()
        : '';

      if (matchingEntity) {
        // Build name from system entity fields
        let systemName = '';
        if (matchingEntity.First_Name__c && matchingEntity.Last_Name__c) {
          systemName = `${matchingEntity.First_Name__c} ${matchingEntity.Last_Name__c}`;
        } else if (matchingEntity.First_Name__c) {
          systemName = matchingEntity.First_Name__c;
        } else if (matchingEntity.Last_Name__c) {
          systemName = matchingEntity.Last_Name__c;
        } else {
          systemName = entity.Name || '—';
        }

        matchedEntityList.push({
          id: entity.ContactID,
          systemEntityId: matchingEntity.Id,
          name: systemName,
          email: entity.EmailAddress,
          xeroId: entity.ContactID,
          inXero: true,
          inSystem: true,
        });
        systemEmailMap.delete(normalizedEmail);
      } else {
        // Build name from Xero's FirstName and LastName if available
        let xeroName = '';
        if (entity.FirstName && entity.LastName) {
          xeroName = `${entity.FirstName} ${entity.LastName}`;
        } else if (entity.FirstName) {
          xeroName = entity.FirstName;
        } else if (entity.LastName) {
          xeroName = entity.LastName;
        } else {
          xeroName = entity.Name || '—';
        }

        onlyInXeroEntityList.push({
          id: entity.ContactID,
          name: xeroName,
          email: entity.EmailAddress || '',
          xeroId: entity.ContactID,
          address: formattedAddress,
          phone: formattedPhone,
          abn: entity.TaxNumber || '',
          inXero: true,
          inSystem: false,
        });
      }
    });

    // 2️⃣ Remaining system Entity → only in system
    systemEmailMap.forEach((e) => {
      let fullName = '';
      if (e.First_Name__c && e.Last_Name__c) {
        fullName = `${e.First_Name__c} ${e.Last_Name__c}`;
      } else if (e.First_Name__c) {
        fullName = e.First_Name__c;
      } else if (e.Last_Name__c) {
        fullName = e.Last_Name__c;
      } else {
        fullName = '—';
      }

      onlyInSystemEntityList.push({
        id: e.Id,
        name: fullName,
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

    this.filteredEntityList = [...this.entityList];
    this.filteredMatchedEntityList = [...this.matchedEntityList];
    this.filteredSystemEntityList = [...this.onlyInSystemEntityList];
    this.filteredXeroEntityList = [...this.onlyInXeroEntityList];

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
      systemEntityId: entity.systemEntityId,
      xeroEntityId: entity.xeroId
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
      entityData: JSON.stringify(entity),
      // ✅ Spinner flags (default false)
      isCreatingInXero: false,
      isCreatingInSystem: false
    };
  }

  // Initialize pagination for all tables
  initializeAllEntityPagination() {
    // All Entity Pagination
    this.allEntitiesTotalRecords = this.filteredEntityList.length;
    this.allEntitiesTotalPages = Math.ceil(this.allEntitiesTotalRecords / this.allEntitiesPageSize);
    this.updateAllEntityPagination();

    // Matched Entity Pagination
    this.matchedEntityTotalRecords = this.filteredMatchedEntityList.length;
    this.matchedEntityTotalPages = Math.ceil(this.matchedEntityTotalRecords / this.matchedEntityPageSize);
    this.updateMatchedEntityPagination();

    // System Only Pagination
    this.systemEntityTotalRecords = this.filteredSystemEntityList.length;
    this.systemEntityTotalPages = Math.ceil(this.systemEntityTotalRecords / this.systemEntityPageSize);
    this.updateSystemEntityPagination();

    // Xero Only Pagination
    this.xeroEntityTotalRecords = this.filteredXeroEntityList.length;
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
    this.paginatedEntityList = this.filteredEntityList.slice(startIndex, endIndex);
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
    this.paginatedMatchedEntityList = this.filteredMatchedEntityList.slice(startIndex, endIndex);
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
    this.paginatedSystemEntityList = this.filteredSystemEntityList.slice(startIndex, endIndex);
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
    const startIndex = (this.xeroEntityCurrentPage - 1) * this.xeroEntityPageSize;
    const endIndex = startIndex + this.xeroEntityPageSize;
    this.paginatedXeroEntityList = this.filteredXeroEntityList.slice(startIndex, endIndex);
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
    this.allEntitiesSearchTerm = '';
    this.filteredEntityList = [...this.entityList];
    this.allEntitiesTotalRecords = this.filteredEntityList.length;
    this.allEntitiesCurrentPage = 1;
    this.updateAllEntityPagination();
  }

  handleMatchedEntities() {
    this.allEntities = false;
    this.matchedEntity = true;
    this.systemEntity = false;
    this.xeroEntity = false;
    this.matchedEntitySearchTerm = '';
    this.filteredMatchedEntityList = [...this.matchedEntityList];
    this.matchedEntityTotalRecords = this.filteredMatchedEntityList.length;
    this.matchedEntityCurrentPage = 1;
    this.updateMatchedEntityPagination();
  }

  handleSystemEntities() {
    this.allEntities = false;
    this.matchedEntity = false;
    this.systemEntity = true;
    this.xeroEntity = false;
    this.systemEntitySearchTerm = '';
    this.filteredSystemEntityList = [...this.onlyInSystemEntityList];
    this.systemEntityTotalRecords = this.filteredSystemEntityList.length;
    this.systemEntityCurrentPage = 1;
    this.updateSystemEntityPagination();
  }

  handleXeroEntities() {
    this.allEntities = false;
    this.matchedEntity = false;
    this.systemEntity = false;
    this.xeroEntity = true;
    this.xeroEntitySearchTerm = '';
    this.filteredXeroEntityList = [...this.onlyInXeroEntityList];
    this.xeroEntityTotalRecords = this.filteredXeroEntityList.length;
    this.xeroEntityCurrentPage = 1;
    this.updateXeroEntityPagination();
  }

  handleCreateInXeroForEntity(event) {
    console.log('handleCreateInXeroForEntity calling:');
    const entityId = event.currentTarget.dataset.id;
    console.log('➕ Add to Xero for entity ID:', entityId);

    // ✅ Set loading flag on the specific row
    this.toggleEntityRowLoading(entityId, 'isCreatingInXero', true);

    // Call Apex
    createEntityInXero({ entityId: entityId })
      .then((result) => {
        console.log('✅ Xero creation result:', result);
        this.showToast('Success', 'Entity has Created in the Xero', 'success');
        this.fetchContactsfromXero();
      })
      .catch((error) => {
        console.error('❌ Error creating Entity in Xero:', error);
        // ✅ Reset loading flag
        this.toggleEntityRowLoading(entityId, 'isCreatingInXero', false);
        this.showToast('Error', 'Failed to create entity in Xero.', 'error');
      });
  }

  @track createEntity = false;
  @track entitydata;
  handleCreateInSystemEntity(event) {
    const entityId = event.currentTarget.dataset.id;
    const entityStr = event.currentTarget.dataset.entitydata;

    console.log('➕ Add to System for entity ID:', entityId);

    // ✅ Set loading flag on the specific row
    this.toggleEntityRowLoading(entityId, 'isCreatingInSystem', true);

    this.createEntity = true;
    try {
      const parsedEntity = JSON.parse(entityStr);
      this.entityData = parsedEntity;

      console.log('Parsed entityData:', parsedEntity);
    } catch (e) {
      console.error('❌ Failed to parse entitydata:', e);
      this.entityData = null;
      // ✅ Reset loading flag
      this.toggleEntityRowLoading(entityId, 'isCreatingInSystem', false);
    }
    if (this.xeroEntity) {
      this.createEntityForXeroOnly = true;
    } else if (this.allEntities) {
      this.createEntityForXeroAll = true;
    }
  }

  // Search handler methods for Staff tables
  handleAllStaffSearch(event) {
    this.allStaffSearchTerm = event.target.value.toLowerCase().trim();
    this.filterStaffList('all');
    this.allCurrentPage = 1;
    this.updateAllPagination();
  }

  handleMatchedStaffSearch(event) {
    this.matchedStaffSearchTerm = event.target.value.toLowerCase().trim();
    this.filterStaffList('matched');
    this.matchedCurrentPage = 1;
    this.updateMatchedPagination();
  }

  handleSystemStaffSearch(event) {
    this.systemStaffSearchTerm = event.target.value.toLowerCase().trim();
    this.filterStaffList('system');
    this.systemCurrentPage = 1;
    this.updateSystemPagination();
  }

  handleXeroStaffSearch(event) {
    this.xeroStaffSearchTerm = event.target.value.toLowerCase().trim();
    this.filterStaffList('xero');
    this.xeroCurrentPage = 1;
    this.updateXeroPagination();
  }

  // Search handler methods for Entity tables
  handleAllEntitiesSearch(event) {
    this.allEntitiesSearchTerm = event.target.value.toLowerCase().trim();
    this.filterEntityList('all');
    this.allEntitiesCurrentPage = 1;
    this.updateAllEntityPagination();
  }

  handleMatchedEntitySearch(event) {
    this.matchedEntitySearchTerm = event.target.value.toLowerCase().trim();
    this.filterEntityList('matched');
    this.matchedEntityCurrentPage = 1;
    this.updateMatchedEntityPagination();
  }

  handleSystemEntitySearch(event) {
    this.systemEntitySearchTerm = event.target.value.toLowerCase().trim();
    this.filterEntityList('system');
    this.systemEntityCurrentPage = 1;
    this.updateSystemEntityPagination();
  }

  handleXeroEntitySearch(event) {
    this.xeroEntitySearchTerm = event.target.value.toLowerCase().trim();
    this.filterEntityList('xero');
    this.xeroEntityCurrentPage = 1;
    this.updateXeroEntityPagination();
  }

  // Filter Staff lists based on search term
  filterStaffList(type) {
    const searchTerm = type === 'all' ? this.allStaffSearchTerm :
      type === 'matched' ? this.matchedStaffSearchTerm :
        type === 'system' ? this.systemStaffSearchTerm :
          this.xeroStaffSearchTerm;

    if (!searchTerm) {
      // Reset to original lists
      if (type === 'all') {
        this.filteredStaffList = [...this.staffList];
        this.allTotalRecords = this.filteredStaffList.length;
      } else if (type === 'matched') {
        this.filteredMatchedList = [...this.matchedList];
        this.matchedTotalRecords = this.filteredMatchedList.length;
      } else if (type === 'system') {
        this.filteredSystemList = [...this.onlyInSystemList];
        this.systemTotalRecords = this.filteredSystemList.length;
      } else if (type === 'xero') {
        this.filteredXeroList = [...this.onlyInXeroList];
        this.xeroTotalRecords = this.filteredXeroList.length;
      }
      return;
    }

    const filterFn = (item) => {
      return (item.name && item.name.toLowerCase().includes(searchTerm)) ||
        (item.email && item.email.toLowerCase().includes(searchTerm)) ||
        (item.xeroId && item.xeroId.toLowerCase().includes(searchTerm));
    };

    if (type === 'all') {
      this.filteredStaffList = this.staffList.filter(filterFn);
      this.allTotalRecords = this.filteredStaffList.length;
    } else if (type === 'matched') {
      this.filteredMatchedList = this.matchedList.filter(filterFn);
      this.matchedTotalRecords = this.filteredMatchedList.length;
    } else if (type === 'system') {
      this.filteredSystemList = this.onlyInSystemList.filter(filterFn);
      this.systemTotalRecords = this.filteredSystemList.length;
    } else if (type === 'xero') {
      this.filteredXeroList = this.onlyInXeroList.filter(filterFn);
      this.xeroTotalRecords = this.filteredXeroList.length;
    }
  }

  // Filter Entity lists based on search term
  filterEntityList(type) {
    const searchTerm = type === 'all' ? this.allEntitiesSearchTerm :
      type === 'matched' ? this.matchedEntitySearchTerm :
        type === 'system' ? this.systemEntitySearchTerm :
          this.xeroEntitySearchTerm;

    if (!searchTerm) {
      // Reset to original lists
      if (type === 'all') {
        this.filteredEntityList = [...this.entityList];
        this.allEntitiesTotalRecords = this.filteredEntityList.length;
      } else if (type === 'matched') {
        this.filteredMatchedEntityList = [...this.matchedEntityList];
        this.matchedEntityTotalRecords = this.filteredMatchedEntityList.length;
      } else if (type === 'system') {
        this.filteredSystemEntityList = [...this.onlyInSystemEntityList];
        this.systemEntityTotalRecords = this.filteredSystemEntityList.length;
      } else if (type === 'xero') {
        this.filteredXeroEntityList = [...this.onlyInXeroEntityList];
        this.xeroEntityTotalRecords = this.filteredXeroEntityList.length;
      }
      return;
    }

    const filterFn = (item) => {
      return (item.name && item.name.toLowerCase().includes(searchTerm)) ||
        (item.email && item.email.toLowerCase().includes(searchTerm)) ||
        (item.xeroId && item.xeroId.toLowerCase().includes(searchTerm));
    };

    if (type === 'all') {
      this.filteredEntityList = this.entityList.filter(filterFn);
      this.allEntitiesTotalRecords = this.filteredEntityList.length;
    } else if (type === 'matched') {
      this.filteredMatchedEntityList = this.matchedEntityList.filter(filterFn);
      this.matchedEntityTotalRecords = this.filteredMatchedEntityList.length;
    } else if (type === 'system') {
      this.filteredSystemEntityList = this.onlyInSystemEntityList.filter(filterFn);
      this.systemEntityTotalRecords = this.filteredSystemEntityList.length;
    } else if (type === 'xero') {
      this.filteredXeroEntityList = this.onlyInXeroEntityList.filter(filterFn);
      this.xeroEntityTotalRecords = this.filteredXeroEntityList.length;
    }
  }

  // ============================================================
  // ✅ HELPER METHODS FOR ROW-LEVEL SPINNERS
  // ============================================================

  toggleRowLoading(staffId, flagName, value) {
    const updateList = (list) => list.map(s => {
      if (s.id === staffId) {
        return { ...s, [flagName]: value };
      }
      return s;
    });

    this.staffList = updateList(this.staffList);
    this.matchedList = updateList(this.matchedList);
    this.onlyInXeroList = updateList(this.onlyInXeroList);
    this.onlyInSystemList = updateList(this.onlyInSystemList);

    this.filteredStaffList = updateList(this.filteredStaffList);
    this.filteredMatchedList = updateList(this.filteredMatchedList);
    this.filteredXeroList = updateList(this.filteredXeroList);
    this.filteredSystemList = updateList(this.filteredSystemList);

    this.paginatedStaffList = updateList(this.paginatedStaffList);
    this.paginatedMatchedList = updateList(this.paginatedMatchedList);
    this.paginatedXeroList = updateList(this.paginatedXeroList);
    this.paginatedSystemList = updateList(this.paginatedSystemList);
  }

  toggleEntityRowLoading(entityId, flagName, value) {
    const updateList = (list) => list.map(e => {
      if (e.id === entityId) {
        return { ...e, [flagName]: value };
      }
      return e;
    });

    this.entityList = updateList(this.entityList);
    this.matchedEntityList = updateList(this.matchedEntityList);
    this.onlyInXeroEntityList = updateList(this.onlyInXeroEntityList);
    this.onlyInSystemEntityList = updateList(this.onlyInSystemEntityList);

    this.filteredEntityList = updateList(this.filteredEntityList);
    this.filteredMatchedEntityList = updateList(this.filteredMatchedEntityList);
    this.filteredXeroEntityList = updateList(this.filteredXeroEntityList);
    this.filteredSystemEntityList = updateList(this.filteredSystemEntityList);

    this.paginatedEntityList = updateList(this.paginatedEntityList);
    this.paginatedMatchedEntityList = updateList(this.paginatedMatchedEntityList);
    this.paginatedXeroEntityList = updateList(this.paginatedXeroEntityList);
    this.paginatedSystemEntityList = updateList(this.paginatedSystemEntityList);
  }

}