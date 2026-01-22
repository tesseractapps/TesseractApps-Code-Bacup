import { LightningElement,api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getMyobAuthLink from '@salesforce/apex/MyobIntegrationController.getMyobAuthLink';
import exchangeMyobCodeForToken from '@salesforce/apex/MyobIntegrationController.exchangeMyobCodeForToken';
import fetchStaff from '@salesforce/apex/XeroIntegrationController.fetchStaffList';
import getMyobCompanyFiles  from '@salesforce/apex/MyobIntegrationController.getMyobCompanyFiles';
import getCompanyFileDetails  from '@salesforce/apex/MyobIntegrationController.getCompanyFileDetails';
import getMyobEmployees from '@salesforce/apex/MyobIntegrationController.getMyobEmployees';
import getMyobCustomers from '@salesforce/apex/MyobIntegrationController.getMyobCustomers';
import fetchEntityList from '@salesforce/apex/XeroIntegrationController.fetchEntityList';
import getMyobSuppliers from '@salesforce/apex/MyobIntegrationController.getMyobSuppliers';
import createMyobEmployee from '@salesforce/apex/MyobIntegrationController.createMyobEmployee';
import updateXeroEmployeeIds from '@salesforce/apex/XeroIntegrationController.updateXeroEmployeeIds';
import createEntityInMYOB from '@salesforce/apex/MyobIntegrationController.createEntityInMYOB';
import updateXeroEntityIds from '@salesforce/apex/XeroIntegrationController.updateXeroEntityIds';


export default class TesseractAppsMyobIntegration extends LightningElement {
    @api orgid;
    @track accessToken;
    @track loading = false;
    @track createEntity = false;
    @track entitydata;
    
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

    @track createStaff = false;
    @track businessId;
    @track myobContacts = [];
    @track matchedEntityCount = 0;
    @track onlyInMyobEntityCount = 0;
    @track onlyInSystemEntityCount = 0;
    @track totalEntityCount = 0;
    @track currentUrl;

    connectedCallback() {
        console.log('orgid >>>>', this.orgid);
        console.log('🟦 [Step 1] connectedCallback() called — Component initialized.');

        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        this.businessId = urlParams.get('businessId');

        if (!this.businessId) {
            console.log('❌ businessId is NULL at initial load');
        } else {
            console.log('✅ businessId:', this.businessId);
        }

        console.log('🔹 businessId:', this.businessId);
        console.log('🔹 [Step 1.1] URL params parsed:', urlParams.toString());
        console.log('🔹 [Step 1.2] Code from URL:', code);
        console.log('🔹 [Step 1.3] window.location.origin:', window.location.origin);
        console.log('🔹 [Step 1.4] window.location.href:', window.location.href);

        if (code) {
            // ✅ This tab is the MYOB redirect tab (new tab)
            console.log('✅ [Step 2] MYOB authorization code detected — proceeding with token exchange.');
            this.exchangeCodeAndCloseTab(code);
        } else {
            // ✅ This is the parent tab
            console.log('🟦 [Step 2] No code param found — assuming this is the parent window.');
            this.setupMessageListener();
        }
    }

    setupMessageListener() {
        console.log('🟦 [Step 3] Setting up message listener for token from new tab...');

        window.addEventListener('message', (event) => {
            console.log('🟡 [Step 3.1] Message event received:', event);

            if (event.origin !== window.location.origin) {
                console.warn('⚠️ [Step 3.2] Ignoring message from untrusted origin:', event.origin);
                return;
            }

            if (event.data && event.data.type === 'MYOB_SUCCESS') {
                console.log('✅ [Step 3.3] Valid MYOB_SUCCESS message received.');
                console.log('🔹 [Step 3.4] Access token received from new tab:', event.data.token);

                this.accessToken = event.data.token;
                console.log('✅ [Step 3.5] Token saved successfully.');
            } else {
                console.log('ℹ️ [Step 3.6] Non-MYOB message ignored.');
            }
        });

        // ✅ Call loadAuthLink only after listener setup
        console.log('🚀 [Step 3.7] Listener ready — calling loadAuthLink() to open MYOB in new tab...');
        this.loadAuthLink();
    }

    async loadAuthLink() {
        console.log('🌀 [Step 4] Fetching MYOB authorization link from Apex...');

        try {
            this.loading = true;
            this.currentUrl = window.location.href;
            console.log('currentUrl >>>>', this.currentUrl);
            const result = await getMyobAuthLink({ redirectUrl: this.currentUrl });
            console.log('✅ [Step 4.1] Apex returned MYOB auth link:', result);

            if (result) {
                console.log('🟩 [Step 4.2] Opening MYOB auth page in new tab...');
                // 🔹 Opens MYOB in NEW TAB (not popup)
                const newTab = window.location.href = result;
                if (newTab) {
                    console.log('✅ [Step 4.3] New tab opened successfully:', newTab.location);
                } else {
                    console.warn('⚠️ [Step 4.3] Popup blocker may have prevented new tab.');
                }
            } else {
                console.error('❌ [Step 4.4] No auth link returned from Apex.');
            }
        } catch (error) {
            console.error('❌ [Step 4.5] Error while fetching MYOB auth link:', error);
        } finally {
            this.loading = false;
            console.log('✅ [Step 4.6] loadAuthLink() completed.');
        }
    }

        @track companyFileUri;


    async fetchEmployeesfromMyob() {
        console.log("🟦 Fetching MYOB Employees...");

        try {
            this.loading = true;

            const employeesJson = await getMyobEmployees({
                accessToken: this.token,
                refreshToken: this.refreshToken,
                companyFileGuid: this.companyFileUri   // FIXED
            });

            console.log("📥 Raw MYOB Employees JSON:", employeesJson);

            let parsed;
            try {
                parsed = JSON.parse(employeesJson);
            } catch (e) {
                console.error("❌ JSON Parse Error:", e);
                return;
            }

            console.log("🔍 Parsed Employees Response:", parsed);

            // 1️⃣ Update refreshed tokens
            this.token = parsed.access_token;
            this.refreshToken = parsed.refresh_token;

            // 2️⃣ Save refreshed tokens to sessionStorage
            sessionStorage.setItem("myobAccessToken", this.token);
            sessionStorage.setItem("myobRefreshToken", this.refreshToken);

            console.log("💾 Tokens saved to sessionStorage (Employee fetch)");

            // 3️⃣ Extract employees safely
            const empObj = parsed.employees || {};
            this.employees = Array.isArray(empObj.Items) ? empObj.Items : [];

            if (!Array.isArray(empObj.Items)) {
                console.warn("⚠️ No Items found inside employees:", empObj);
            }

            console.log("👥 Final Employees:", JSON.stringify(this.employees, null, 2));

            // 4️⃣ Load Salesforce staff after MYOB employee fetch
            this.loadStaffDetailsfromSystem();

        } catch (error) {
            console.error("❌ Error fetching MYOB Employees:", error);
        } finally {
            this.loading = false;
        }
    }

    async exchangeCodeAndCloseTab(code) {
        try {
            this.loading = true;
            console.log('✅ Access code:', code);

            // Load any saved tokens
            const savedAccess  = sessionStorage.getItem("myobAccessToken");
            const savedRefresh = sessionStorage.getItem("myobRefreshToken");
            const savedUri     = sessionStorage.getItem("companyFileUri");
            const savedGuid    = sessionStorage.getItem("myobcompanyFileGuid");

            console.log('savedAccess >>>>>>', savedAccess);
            console.log('savedRefresh >>>>>>', savedRefresh);
            console.log('companyFileUri >>>>>>', savedUri);
            console.log('companyFileGuid >>>>>>', savedGuid);

            this.token          = savedAccess;
            this.refreshToken   = savedRefresh;
            this.companyFileUri = savedUri;
            this.companyFileGuid = savedGuid;

            // STEP 1: No saved tokens → Exchange code
            if (!savedAccess || !savedRefresh || savedAccess === "undefined" || savedRefresh === "undefined") {
                console.log("🔵 No saved tokens — calling Apex token exchange");

                // Generate redirect URL
                const baseUrl = window.location.origin + '/s/';
                const tokenResponse = await exchangeMyobCodeForToken({
                    code: code,
                    redirectUrl: baseUrl
                });

                const tokenData = JSON.parse(tokenResponse);

                this.token = tokenData.access_token;
                this.refreshToken = tokenData.refresh_token;

                console.log('🔐 Access Token:', this.token);
                console.log('🔐 Refresh Token:', this.refreshToken);

                // STEP 2: Get refreshed tokens + company file details
                const companyFilesJson = await getMyobCompanyFiles({
                    accessToken: this.token,
                    refreshToken: this.refreshToken,
                    businessId: this.businessId
                });

                const resp = JSON.parse(companyFilesJson);

                // Update refreshed tokens
                this.token = resp.access_token;
                this.refreshToken = resp.refresh_token;

                console.log('🆕 NEW Access Token:', this.token);
                console.log('🆕 NEW Refresh Token:', this.refreshToken);

                const companyFiles = resp.companyFiles;

                // Validate company file structure
                if (!companyFiles || !companyFiles.CompanyFile) {
                    console.error('❌ No CompanyFile returned from MYOB');
                    return;
                }

                // Correct extraction based on MYOB response
                this.companyFileGuid = companyFiles.CompanyFile.Id;
                this.companyFileUri  = companyFiles.CompanyFile.Uri;

                console.log('🏢 Company File GUID:', this.companyFileGuid);
                console.log('🔗 Company File URI:', this.companyFileUri);

                // Save tokens + company file details
                sessionStorage.setItem('myobAccessToken', this.token);
                sessionStorage.setItem('myobRefreshToken', this.refreshToken);
                sessionStorage.setItem('companyFileUri', this.companyFileUri);
                sessionStorage.setItem('myobcompanyFileGuid', this.companyFileGuid);

            } else {
                console.log("🟢 Saved tokens found — skipping code exchange");
            }

            console.log('Final Access Token:', this.token);
            console.log('Final Refresh Token:', this.refreshToken);
            console.log('Final Company File GUID:', this.companyFileGuid);
            console.log('Final Company File URI:', this.companyFileUri);

            // STEP 3: Fetch Company File Details (needs GUID)
            const companyDetails = await getCompanyFileDetails({
                accessToken: this.token,
                companyFileGuid: this.companyFileGuid
            });

            console.log('🏢 Company File Details:', companyDetails);

            // STEP 4: Fetch employees (GUID is required)
            const employeesJson = await getMyobEmployees({
                accessToken: this.token,
                refreshToken: this.refreshToken,
                companyFileGuid: this.companyFileUri   // ❗ FIXED: use GUID, not URI
            });

            // Parse wrapper JSON
            const employeeResp = JSON.parse(employeesJson);

            // Update refreshed tokens
            this.token = employeeResp.access_token;
            this.refreshToken = employeeResp.refresh_token;

            sessionStorage.setItem("myobAccessToken", this.token);
            sessionStorage.setItem("myobRefreshToken", this.refreshToken);

            console.log('🆕 Updated Access Token:', this.token);
            console.log('🆕 Updated Refresh Token:', this.refreshToken);

            // Extract employee list
            this.employees = employeeResp.employees?.Items || [];

            console.log('👥 Employees:', this.employees);


            this.loadStaffDetailsfromSystem();

        } catch (error) {
            console.error('❌ Error during MYOB integration flow:', error);
        } finally {
            this.loading = false;
        }
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
            this.fetchCustomersFromMyob();
            this.allEntities = true;
            this.matchedEntity = false;
            this.systemEntity = false;
            this.xeroEntity = false;

        } else if(this.activeTab === "payroll"){
            this.fetchEmployeesfromMyob();
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

        // 🔹 Normalize email
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

        // 🔹 Extract Email from Address[0]
        const getEmailFromAddressZero = (emp) => {
            if (emp?.Addresses?.length > 0) {
                return emp.Addresses[0].Email || null;
            }
            return null;
        };

        // 🔹 Format Xero DOB: /Date(1737936000000+0000)/
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

        // 🔹 Format System DOB
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

        // 🔹 Build email map for System Staff
        const systemEmailMap = new Map();
        systemStaff.forEach((s) => {
            const normalizedEmail = normalizeEmail(s.Email_Address__c);
            if (normalizedEmail) {
                systemEmailMap.set(normalizedEmail, s);
            } else {
                console.warn('⚠️ Skipped system staff with missing email:', s);
            }
        });

        // 🔸 1️⃣ Match Xero employees with System staff
        xeroEmployees.forEach((emp) => {
            const emailFromAddress0 = getEmailFromAddressZero(emp);
            const normalizedEmail = normalizeEmail(emailFromAddress0);

            const matchingStaff = normalizedEmail ? systemEmailMap.get(normalizedEmail) : null;
            const formattedDOB = formatXeroDate(emp.DateOfBirth);

            if (matchingStaff) {
                const formattedSystemDOB = formatSystemDate(matchingStaff.Date_Of_Birth__c);

                matchedList.push({
                    id: emp.UID,
                    systemStaffId: matchingStaff.Id,
                    name: `${emp.FirstName || ''} ${emp.LastName || ''}`.trim(),
                    email: emailFromAddress0,        // ✅ Updated
                    xeroId: emp.UID,
                    inXero: true,
                    inSystem: true,
                    facility: matchingStaff.Facility__c,
                    xeroDOB: formattedDOB,
                    systemDOB: formattedSystemDOB,
                    dateOfBirth: formattedSystemDOB || formattedDOB,
                });

                systemEmailMap.delete(normalizedEmail);
            } else {
                onlyInXeroList.push({
                    id: emp.UID,
                    name: `${emp.FirstName || ''} ${emp.LastName || ''}`.trim(),
                    firstName: emp.FirstName || '',
                    lastName: emp.LastName || '',
                    email: emailFromAddress0,         // ✅ Updated
                    xeroId: emp.UID,
                    inXero: true,
                    inSystem: false,
                    facility: null,
                    xeroDOB: formattedDOB,
                    dateOfBirth: formattedDOB,
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
            });
        });

        // 🔸 3️⃣ Final Combined List
        this.matchedList = matchedList.map((staff) => this.enrichStaffData(staff));
        this.onlyInXeroList = onlyInXeroList.map((staff) => this.enrichStaffData(staff));
        this.onlyInSystemList = onlyInSystemList.map((staff) => this.enrichStaffData(staff));

        this.staffList = [
            ...this.matchedList,
            ...this.onlyInXeroList,
            ...this.onlyInSystemList,
        ];

        // 🧭 Pagination
        this.initializeAllPagination();

        // 📊 Counters
        this.matchedCount = this.matchedList.length;
        this.onlyInXeroCount = this.onlyInXeroList.length;
        this.onlyInSystemCount = this.onlyInSystemList.length;
        this.totalCount = this.staffList.length;


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
    const statusLabel = staff.inXero && staff.inSystem ? 'Synced' : staff.inXero ? 'MYOB Only' : 'System Only';
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

        console.log('➕ Add to MYOB for Staff ID:', staffId);
        console.log('🔑 Access Token:', this.token);
        console.log('🔑 Refresh Token:', this.token);
        console.log('🏢 Company File URI:', this.companyFileUri);

        createMyobEmployee({
            accessToken: this.token,  
            refreshToken: this.refreshToken,
            companyFileUri: this.companyFileUri,
            staffId: staffId
        })
        .then((result) => {

            console.log('📥 Raw MYOB employee create response:', result);

            let parsed;
            try {
                parsed = JSON.parse(result);
            } catch (e) {
                console.error("❌ JSON parse error:", e);
                this.showToast('Error', 'Invalid response from MYOB', 'error');
                return;
            }

            console.log("🔍 Parsed response:", parsed);

            // 1️⃣ Update refreshed tokens
            this.token = parsed.access_token;
            this.refreshToken = parsed.refresh_token;

            // 2️⃣ Save updated tokens to sessionStorage
            sessionStorage.setItem("myobAccessToken", this.token);
            sessionStorage.setItem("myobRefreshToken", this.refreshToken);

            console.log("💾 Tokens saved after employee creation");
            // 4️⃣ Notify user
            this.showToast('Success', 'Staff has been created in MYOB', 'success');

            // 5️⃣ Refresh MYOB employee list using *new* tokens
            this.fetchEmployeesfromMyob();
        })
        .catch((error) => {
            console.error('❌ Error creating employee in MYOB:', error);
            this.showToast('Error', error.body?.message || error.message, 'error');
        });
    }    
      
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
        return this.onlyInMyobEntityList.length === 0;
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
            this.fetchEmployeesfromMyob();
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
            this.fetchCustomersFromMyob();
            }, 2000); // 2-second delay
        
        }
        
    }
    
    fetchCustomersFromMyob() {
        console.log('this.token >>>>', this.token);
        console.log('this.companyFileGuid >>>>', this.companyFileGuid);

        getMyobCustomers({
            accessToken: this.token,
            refreshToken: this.refreshToken,
            companyFileGuid: this.companyFileGuid
        })
        .then(result => {

            console.log("🔵 RAW Customer Response:", result);

            let parsed;
            try {
                parsed = JSON.parse(result);
            } catch (e) {
                console.error("❌ JSON Parsing Error:", e);
                return;
            }

            console.log("🔍 Parsed Customer Response:", parsed);

            // 1️⃣ Save new tokens in component
            this.token = parsed.access_token;
            this.refreshToken = parsed.refresh_token;

            // 2️⃣ Save new tokens in sessionStorage
            sessionStorage.setItem("myobAccessToken", this.token);
            sessionStorage.setItem("myobRefreshToken", this.refreshToken);

            console.log("💾 Saved to sessionStorage:");
            console.log("   myobAccessToken:", sessionStorage.getItem("myobAccessToken"));
            console.log("   myobRefreshToken:", sessionStorage.getItem("myobRefreshToken"));

            // 3️⃣ Extract customers safely
            const customerObj = parsed.customers || {};
            const items = Array.isArray(customerObj.Items) ? customerObj.Items : [];

            if (!Array.isArray(customerObj.Items)) {
                console.warn("⚠️ No Items found inside customers:", customerObj);
            }

            // 4️⃣ Merge customer contacts
            this.myobContacts = [...this.myobContacts, ...items];

            console.log(
                'All Contacts (Customers + Suppliers):\n',
                JSON.stringify(this.myobContacts, null, 2)
            );

            // 5️⃣ Continue to suppliers
            this.fetchSuppliersFromMyob();
        })
        .catch(error => console.error("❌ Error fetching customers:", error));
    }

    fetchSuppliersFromMyob() {
        getMyobSuppliers({
            accessToken: this.token,
            refreshToken: this.refreshToken,
            companyFileGuid: this.companyFileGuid
        })
        .then(result => {

            console.log("🔵 RAW Supplier Response:", result);

            let parsed;
            try {
                parsed = JSON.parse(result);
            } catch (e) {
                console.error("❌ JSON Parsing Error:", e);
                return;
            }

            console.log("🔍 Parsed Supplier Response:", parsed);

            // 1️⃣ Update refreshed tokens
            this.token = parsed.access_token;
            this.refreshToken = parsed.refresh_token;

            // 2️⃣ Store refreshed tokens in sessionStorage
            sessionStorage.setItem("myobAccessToken", this.token);
            sessionStorage.setItem("myobRefreshToken", this.refreshToken);

            console.log("💾 Tokens saved to sessionStorage (Supplier fetch)");

            // 3️⃣ Extract suppliers safely
            const supplierObj = parsed.suppliers || {};
            const items = Array.isArray(supplierObj.Items) ? supplierObj.Items : [];

            if (!Array.isArray(supplierObj.Items)) {
                console.warn("⚠️ No Items found inside suppliers:", supplierObj);
            }

            // 4️⃣ Merge supplier contacts
            this.myobContacts = [
                ...this.myobContacts,
                ...items
            ];

            console.log(
                'All Contacts (Customers + Suppliers):\n',
                JSON.stringify(this.myobContacts, null, 2)
            );

            // 5️⃣ Continue to next step
            this.loadEntityDetailsfromSystem();
        })
        .catch(error => console.error("❌ Error fetching suppliers:", error));
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

    
    // =====================================
    // 🟦 ADD THIS METHOD (works like Staff)
    // =====================================
    enrichEntityData(entity) {

        const initials = this.getInitials
            ? this.getInitials(entity.name)
            : "";

        const statusLabel =
            entity.inMyob && entity.inSystem
                ? 'Synced'
                : entity.inMyob
                ? 'MYOB Only'
                : 'System Only';

        const statusClass =
            entity.inMyob && entity.inSystem
                ? 'status-synced'
                : entity.inMyob
                ? 'status-xero'
                : 'status-system';

        const rowClass =
            entity.inMyob && entity.inSystem
                ? 'synced-row'
                : entity.inMyob
                ? 'xero-only-row'
                : 'system-only-row';

        return {
            ...entity,

            initials,
            statusLabel,
            statusClass,
            rowClass,

            // ⭐ CREATE IN MYOB (exists only in System)
            showMyobButton:
                entity.inSystem === true && entity.inMyob === false,

            // ⭐ CREATE IN SYSTEM (exists only in MYOB)
            showSystemButton:
                entity.inMyob === true && entity.inSystem === false,

            // ⭐ BOTH PRESENT → HIDE BUTTONS
            showAllSet:
                entity.inMyob === true && entity.inSystem === true,

            // ⭐ LEGACY — if your HTML still uses showXeroButton
            showXeroButton:
                entity.inSystem === true && entity.inMyob === false,

            // Pass entity
            entityData: JSON.stringify(entity)
        };
    }


    // =====================================
    // 🟩 MAIN METHOD — WITH ENRICHED BUTTON STATES
    // =====================================
    loadMockDataForEntity() {
        const myobContacts = this.myobContacts || [];
        const systemEntity = this.entityListSystem || [];

        const matchedEntityList = [];
        const onlyInMyobEntityList = [];
        const onlyInSystemEntityList = [];

        // Normalize email
        const normalizeEmail = (email) => {
            return email
                ? email.toString().toLowerCase().trim().replace(/\u00A0/g, '').replace(/\s+/g, '')
                : null;
        };

        // Extract email from MYOB
        const getMyobEmail = (entity) => {
            if (!entity.Addresses) return null;
            const addr = entity.Addresses.find(a => a.Email) || entity.Addresses[0];
            return addr?.Email || null;
        };

        // Extract Address
        const getMyobAddress = (entity) => {
            if (!entity.Addresses) return null;
            const addr = entity.Addresses.find(a => a.Street || a.City) || entity.Addresses[0];
            return addr ? {
                street: addr.Street || '',
                city: addr.City || '',
                region: addr.State || '',
                postalCode: addr.PostCode || '',
                country: addr.Country || ''
            } : null;
        };

        // Extract Phone
        const getMyobPhone = (entity) => {
            if (!entity.Addresses) return '';
            const addr = entity.Addresses.find(a => a.Phone1 || a.Phone2) || entity.Addresses[0];
            return addr?.Phone1 || addr?.Phone2 || '';
        };

        const getMyobABN = (entity) => {
            return entity?.SellingDetails?.ABN || null;
        };

        // System Email Map
        const systemEmailMap = new Map();
        systemEntity.forEach((e) => {
            const normalizedEmail = normalizeEmail(e.Email__c);
            if (normalizedEmail) systemEmailMap.set(normalizedEmail, e);
        });

        // 1️⃣ MATCH MYOB → SYSTEM
        myobContacts.forEach(entity => {
            const email = getMyobEmail(entity);
            const normEmail = normalizeEmail(email);
            const match = normEmail ? systemEmailMap.get(normEmail) : null;

            const id = entity.UID;

            if (match) {
                matchedEntityList.push({
                    id,
                    systemEntityId: match.Id,
                    name: entity.CompanyName || entity.Name || '',
                    email,
                    myobId: id,
                    inMyob: true,
                    inSystem: true,
                    abn: getMyobABN(entity),
                    xeroId: id
                });
                systemEmailMap.delete(normEmail);
            } else {
                onlyInMyobEntityList.push({
                    id,
                    name: entity.CompanyName || entity.Name || '',
                    email,
                    address: getMyobAddress(entity),
                    phone: getMyobPhone(entity),
                    myobId: id,
                    inMyob: true,
                    inSystem: false,
                    abn: getMyobABN(entity),
                    xeroId: id
                });
            }
        });

        // 2️⃣ ONLY IN SYSTEM
        systemEmailMap.forEach(e => {
            onlyInSystemEntityList.push({
                id: e.Id,
                name:
                    e.First_Name__c && e.Last_Name__c
                        ? `${e.First_Name__c} ${e.Last_Name__c}`
                        : e.First_Name__c || e.Last_Name__c || '—',
                email: e.Email__c || '',
                myobId: null,
                inMyob: false,
                inSystem: true,
                abn: e.ABN__c || null
            });
        });


        // 3️⃣ APPLY enrichEntityData() → ADD BUTTON LOGIC
        this.matchedEntityList = matchedEntityList.map(e => this.enrichEntityData(e));
        this.onlyInMyobEntityList = onlyInMyobEntityList.map(e => this.enrichEntityData(e));
        this.onlyInSystemEntityList = onlyInSystemEntityList.map(e => this.enrichEntityData(e));

        // FINAL ENTITY LIST
        this.entityList = [
            ...this.matchedEntityList,
            ...this.onlyInMyobEntityList,
            ...this.onlyInSystemEntityList
        ];

        // COUNTS
        this.matchedEntityCount = this.matchedEntityList.length;
        this.onlyInMyobEntityCount = this.onlyInMyobEntityList.length;
        this.onlyInSystemEntityCount = this.onlyInSystemEntityList.length;
        this.totalEntityCount = this.entityList.length;

        // DEFAULT FILTER = ALL
        this.allEntities = true;
        this.matchedEntity = false;
        this.systemEntity = false;
        this.xeroEntity = false;

        // PAGINATION
        this.paginatedEntityList = this.entityList.slice(0, this.allEntitiesPageSize);
        this.paginatedMatchedEntityList = this.matchedEntityList.slice(0, this.matchedEntityPageSize);
        this.paginatedSystemEntityList = this.onlyInSystemEntityList.slice(0, this.systemEntityPageSize);
        this.paginatedXeroEntityList = this.onlyInMyobEntityList.slice(0, this.xeroEntityPageSize);
        this.initializeAllEntityPagination();


        this.entityRecordsToUpdateInSystem = this.matchedEntityList.map((entity) => ({
            systemEntityId:   entity.systemEntityId,
            xeroEntityId:  entity.xeroId
        }));
    
        console.log('📤 Final  entity Payload:', JSON.stringify(this.entityRecordsToUpdateInSystem, null, 2));
    
        updateXeroEntityIds({ entityMappings: this.entityRecordsToUpdateInSystem })
        .then(() => {
            console.log('✅ MYOB IDs updated successfully!');
        })
        .catch((error) => {
            console.error('❌ Error updating Xero IDs:', error);
        });

        console.log("🔥 ENTITY LIST BUILT SUCCESSFULLY");
    }

    // Initialize pagination for all tables
    initializeAllEntityPagination() {
        // All Entities Pagination
        this.allEntitiesTotalRecords = this.entityList.length;
        this.allEntitiesTotalPages = Math.ceil(this.allEntitiesTotalRecords / this.allEntitiesPageSize);
        this.updateAllEntitiesPagination();

        // Matched Entities Pagination
        this.matchedEntityTotalRecords = this.matchedEntityList.length;
        this.matchedEntityTotalPages = Math.ceil(this.matchedEntityTotalRecords / this.matchedEntityPageSize);
        this.updateMatchedEntityPagination();

        // System Only Pagination
        this.systemEntityTotalRecords = this.onlyInSystemEntityList.length;
        this.systemEntityTotalPages = Math.ceil(this.systemEntityTotalRecords / this.systemEntityPageSize);
        this.updateSystemEntityPagination();

        // MYOB Only Pagination
        this.xeroEntityTotalRecords = this.onlyInMyobEntityList.length;
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

    updateAllEntitiesPagination() {
        if (this.allEntitiesTotalRecords === 0) {
            this.paginatedEntityList = [];
            return;
        }
        
        const startIndex = (this.allEntitiesCurrentPage - 1) * this.allEntitiesPageSize;
        const endIndex = startIndex + this.allEntitiesPageSize;
        this.paginatedEntityList = this.entityList.slice(startIndex, endIndex);
    }

    updateMatchedEntityPagination() {
        if (this.matchedEntityTotalRecords === 0) {
            this.paginatedMatchedEntityList = [];
            return;
        }

        const start = (this.matchedEntityCurrentPage - 1) * this.matchedEntityPageSize;
        const end = start + this.matchedEntityPageSize;
        this.paginatedMatchedEntityList = this.matchedEntityList.slice(start, end);
    }

    updateSystemEntityPagination() {
        if (this.systemEntityTotalRecords === 0) {
            this.paginatedSystemEntityList = [];
            return;
        }

        const start = (this.systemEntityCurrentPage - 1) * this.systemEntityPageSize;
        const end = start + this.systemEntityPageSize;
        this.paginatedSystemEntityList = this.onlyInSystemEntityList.slice(start, end);
    }

    updateXeroEntityPagination() {
        if (this.xeroEntityTotalRecords === 0) {
            this.paginatedXeroEntityList = [];
            return;
        }

        const start = (this.xeroEntityCurrentPage - 1) * this.xeroEntityPageSize;
        const end = start + this.xeroEntityPageSize;
        this.paginatedXeroEntityList = this.onlyInMyobEntityList.slice(start, end);
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
        console.log('hasNoEntity:', this.hasNoEntity);
        console.log('paginatedEntityList:', this.paginatedEntityList);
    }

    handleMatchedEntities() {
        this.allEntities = false;
        this.matchedEntity = true;
        this.systemEntity = false;
        this.xeroEntity = false;
        console.log('hasNoMatchedEntity:', this.hasNoMatchedEntity);
        console.log('paginatedEntityList:', this.paginatedMatchedEntityList);
    }

    handleSystemEntities() {
        this.allEntities = false;
        this.matchedEntity = false;
        this.systemEntity = true;
        this.xeroEntity = false;
        console.log('hasNoSystemEntity:', this.hasNoSystemEntity);
        console.log('paginatedSystemEntityList:', this.paginatedSystemEntityList);
    }

    handleXeroEntities() {
        this.allEntities = false;
        this.matchedEntity = false;
        this.systemEntity = false;
        this.xeroEntity = true;
        console.log('hasNoXeroEntity:', this.hasNoXeroEntity);
        console.log('paginatedXeroEntityList:', this.paginatedXeroEntityList);
    }
    
    handleCreateInXeroForEntity(event) {
        // 1️⃣ Read the entity Id from the button
        const entityId = event.currentTarget.dataset.id;
        console.log("🆔 Selected Entity ID:", entityId);

        // 2️⃣ Retrieve MYOB keys from sessionStorage
        const companyFileUri = sessionStorage.getItem('companyFileUri');
        const accessToken = sessionStorage.getItem('myobAccessToken');

        console.log("📦 Retrieved from sessionStorage:");
        console.log("   🔗 companyFileUri:", companyFileUri);

        if (!companyFileUri || !this.token) {
            console.error("❌ Missing MYOB credentials in sessionStorage.");
            this.showToast("Error", "MYOB connection details missing. Please reconnect.", "error");
            return;
        }

        // 3️⃣ Call Apex
        console.log("🚀 Calling Apex → createEntityInMYOB()");
        createEntityInMYOB({
            entityId: entityId,
            companyFileUri: companyFileUri,
            refreshToken: this.refreshToken,
            accessToken: this.token
        })
        .then((result) => {
            console.log("📥 RAW Response from Apex:", result);

            // ---------------------------
            // 0️⃣ Parse JSON safely
            // ---------------------------
            let parsed;
            try {
                parsed = JSON.parse(result);
            } catch (error) {
                console.error("❌ JSON Parse Error:", error);
                this.showToast("Error", "Invalid response from MYOB", "error");
                return;
            }

            console.log("🔍 Parsed Response:", parsed);

            const customerResponse = parsed.customer;

            // ---------------------------
            // 1️⃣ DETECT MYOB VALIDATION ERROR
            // ---------------------------
            if (typeof customerResponse === "string" && customerResponse.includes("ValidationError")) {
                console.warn("⚠️ MYOB Validation Error:", customerResponse);

                // Extract error table data: <td>ValidationError</td><td>Card_InvalidABN</td>
                let validationMessage = "Validation Error in MYOB";

                // This REGEX extracts columns inside the first <tr>
                const match = customerResponse.match(
                    /<tr><td>(.*?)<\/td><td>(.*?)<\/td><td>(.*?)<\/td>/
                );

                if (match && match[2]) {
                    validationMessage = match[2];    // Example: Card_InvalidABN
                }

                // Show toast to user
                this.showToast(
                    "Error",
                    "MYOB Validation Error: " + validationMessage,
                    "error"
                );

                return; // ❗ STOP normal flow — do NOT continue to success section
            }

            // ---------------------------
            // 2️⃣ UPDATE TOKENS
            // ---------------------------
            this.token = parsed.access_token;
            this.refreshToken = parsed.refresh_token;

            // ---------------------------
            // 3️⃣ SAVE TOKENS TO SESSION STORAGE
            // ---------------------------
            sessionStorage.setItem("myobAccessToken", this.token);
            sessionStorage.setItem("myobRefreshToken", this.refreshToken);

            console.log("💾 Tokens saved to sessionStorage:");
            console.log("   Access:", this.token);
            console.log("   Refresh:", this.refreshToken);

            // ---------------------------
            // 4️⃣ SUCCESS TOAST
            // ---------------------------
            this.showToast("Success", "Entity has been created in MYOB", "success");

            // ---------------------------
            // 5️⃣ REFRESH CUSTOMER LIST
            // ---------------------------
            console.log("🔄 Refreshing MYOB customer list…");
            this.fetchCustomersFromMyob();
        })
        .catch((error) => {
            console.error("❌ Apex Error in createEntityInMYOB:", error);

            const message =
                error?.body?.message ||
                error?.message ||
                "Unknown error occurred while creating MYOB Entity";

            this.showToast("Error", message, "error");
        });
    }

      
    handleCreateInSystemEntity(event) {
        console.log("========== 🟦 handleCreateInSystemEntity() CALLED 🟦 ==========");

        // Extract dataset values
        const entityId = event.currentTarget.dataset.id;
        const entityStr = event.currentTarget.dataset.entitydata;

        console.log("👉 Clicked Entity ID:", entityId);
        console.log("📨 Raw entitydata string:", entityStr);

        // Enable create modal
        this.createEntity = true;
        console.log("🟢 createEntity modal opened");

        // Try parsing entity JSON
        try {
            const parsedEntity = JSON.parse(entityStr);
            this.entityData = parsedEntity;

            console.log("✅ Parsed entityData successfully:", parsedEntity);
            console.log("🧩 entityData fields:", JSON.stringify(parsedEntity, null, 2));
        } catch (e) {
            console.error("❌ ERROR: Failed to parse entitydata JSON:", e);
            this.entityData = null;
        }

        // Determine which button modal should display
        console.log("🔍 Current Filters → xeroEntity:", this.xeroEntity, ", allEntities:", this.allEntities);

        if (this.xeroEntity) {
            this.createEntityForXeroOnly = true;
            console.log("🟩 createEntityForXeroOnly = TRUE (Xero Only filter active)");
        } 
        else if (this.allEntities) {
            this.createEntityForXeroAll = true;
            console.log("🟩 createEntityForXeroAll = TRUE (All filter active)");
        }

        console.log("========== 🟦 handleCreateInSystemEntity() END 🟦 ==========");
    }

}