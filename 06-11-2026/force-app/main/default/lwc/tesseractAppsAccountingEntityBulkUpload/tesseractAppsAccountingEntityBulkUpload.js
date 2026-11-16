import {LightningElement,track,wire,api} from 'lwc';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
//import { publish, createMessageContext } from 'lightning/messageService';
//import CREATE_COMPANY_CHANNEL from '@salesforce/messageChannel/CreateCompanyMessageChannel__c';
import myResourceTemplate from '@salesforce/resourceUrl/Bulk_Entity_Template'; 
import myResource from '@salesforce/resourceUrl/EntityBulkUpload_Instructions'; 
import getLedgerItems from '@salesforce/apex/AccountingModuleController.getLedgerItems';
import getOrgEmailForBulk from '@salesforce/apex/FacilityController.getOrgEmailForBulk';
//import createEntityProfiles from '@salesforce/apex/AccountingModuleController.createEntityProfiles';
import createEntityOnBulk from '@salesforce/apex/FacilityController.createEntityOnBulk';


export default class TesseractAppsAccountingEntityBulkUpload extends LightningElement {
   
    //context = createMessageContext();
    @api iscompanyexist; 
    @api orgid; 
    @api facilityId;
    @api selectedCompId;
    @api isEntityExist;
    @api isFromManageInvoice;
    @track uploadBtnContainer = false;
    @track createCompanyFlag = false;
    @track isFromFacility=false;
    @track isHome=true;
    @track tableData = [];
    @track isAllSelected = false;
    @track isProcessed = false;
    @track uploadedFiles = [];
    @track uploadedFileName = '';
    @track uploadfilenameflag = false;
    @track paginatedData = [];
    @track totalRecords = 0;
    @track totalPages = 0;
    @track pageNumber = 1;
    @track recordsPerPage = 10;
    @track bDisableFirst = true;
    @track bDisableLast = false;
    @track pageSizeOptions = [10, 20, 50];
    @track isErrorPopupVisible = false;
    @track errorMessage = '';
    @track enableddisabled = true;
   // @track selectedRecordIds = new Set();
    //Edit popup
    @track isEditModalOpen = false; //edit
    @track editRecord = {};
    @track editRecordId = null;
    @track customerLedgerItems = []; 
    @track isDropdownOpen1 = false;
    @track toggleDropdownAccount1;
    @track toggleDropdownAccount;  
    customerSearchTerm = '';
    customerShowTable = false;
    customerFilteredLedgerItems = [];
    customerSelectedAccountId = '';
    @track customerFlag = false;
   // @track isNewEntityFlag=false;
    //@track selectedCardType='Customer';
    @track entityTypeOptions = [ 
        { label: 'Company', value: 'Company' },
        { label: 'Individual', value: 'Individual'}
    ];
    
    @track taxCodes = [
        {id:1, code: 'GST', description: 'Goods & Service Tax',rate: '10%', label: 'GST,  Goods & Service Tax, 10%' },
        {id:2, code: 'FRE', description: 'GST Free',rate: '0%', label: 'FRE, GST Free, 0%' },
        {id:3, code: 'CAP', description: 'Capital Acquisitions',rate: '10%', label: 'CAP, Capital Acquisitions, 10%' },
        {id:2, code: 'N-T', description: 'Not Reportable', rate: '0%',label:'N-T,  Not Reportable, 0%' },
        {id:3, code: 'LCT', description: 'Luxury Car Tax', rate: '33%',label:'LCT,  Luxury Car Tax, 33%'},
        {id:4, code: 'WET', description: 'Wine Equalisation Tax', rate: '29%',label:'WET, Wine Equalisation Tax, 29%' } 
    ];
    //Edit popup end

    hasInitialized = false;     
    // 🔹 Button disable logic (purely reactive)
    get disableCreateCompany() {
        return this.iscompanyexist === true;
    }

    get disableCreateEntity() {
        if (this.isFromManageInvoice) {
            // From Manage Invoice:
            // enable only when company exists AND entity missing
            return !this.iscompanyexist || this.isEntityExist === true;
        }
        // Normal flow: enabled whenever company exists
        return this.iscompanyexist !== true;
    }

    get disableInstructions() {
        // From Manage Invoice → always disabled
        if (this.isFromManageInvoice) {
            return true;
        }
        // Normal flow → enabled when company exists
        return this.iscompanyexist !== true;
    }
    get disableDownloadTemplate() {
        if (this.isFromManageInvoice) {
            return true;
        }
        return this.iscompanyexist !== true;
    }

    // 🔹 This runs AFTER @api value is available
    renderedCallback() {
        if (this.hasInitialized) {
            return;
        }

        // wait until parent passes the value
        if (this.iscompanyexist === undefined) {
            return;
        }

        this.hasInitialized = true;
        this.handleCompanyExistChange();
    }
    connectedCallback(){
        console.log('this.orgid ',this.orgid );
        console.log('this.facilityId ',this.facilityId );
        console.log('this.selectedCompId ',this.selectedCompId );
        console.log('this.isEntityExist in connected callback : ',this.isEntityExist);
        console.log('isFromManageInvoice:', this.isFromManageInvoice);
        if(this.selectedCompId != null && this.selectedCompId != ''){
             this.fetchLedgerItems();
        }
        window.addEventListener('click', this.handleOutsideClick);
    }
    
    disconnectedCallback() {
         window.removeEventListener('click', this.handleOutsideClick);
    }
    @track listenForOutsideClick = false;
    handleOutsideClick = (event) => {
        if (this.listenForOutsideClick) {
            const dropdownElement = this.template.querySelector('[data-id="taxTableSelling"]');
            if (dropdownElement && !dropdownElement.contains(event.target)) {
                console.log('🟥 Outside click: closingtaxTableDropdown');
                this.isDropdownOpen1 = false;
                this.listenForOutsideClick = false;
            }
            
            const dropdownElement3 = this.template.querySelector('[data-id="accountListTableCustomer"]');
            if (dropdownElement3 && !dropdownElement3.contains(event.target)) {
                console.log('🟥 Outside click: closingtaxTableDropdown');
                this.customerShowTable = false;
                this.listenForOutsideClick = false;
            }
            
        }
    };
   
    handleCompanyExistChange() {
        console.log('Child received iscompanyexist:', this.iscompanyexist);
        console.log('isFromManageInvoice:', this.isFromManageInvoice);

        this.uploadBtnContainer = false;

        if (!this.iscompanyexist) {
            if (!this.isFromManageInvoice || this.isFromManageInvoice===undefined) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Company details are missing for this facility. Click Create Company to proceed.',
                        variant: 'error'
                    })
                );
            } else {
                console.log('⏭ Skipping company error toast (handled in Manage Invoice)');
            }
            return; // ⛔ STOP — never allow upload
        }

        // ✅ Company exists
        if (!this.isFromManageInvoice) {
            this.uploadBtnContainer = true;
        }
    }

    handleCreateCompany(){
        //this.createCompanyFlag = true;
     
        this.isHome=false;
        this.dispatchEvent(
            new CustomEvent('createcompany', {
                bubbles: true,
                composed: true
            })
        );
    }
    handleCreateEntity(){
        this.isHome=false; 
        //this.isNewEntityFlag = true;
        this.dispatchEvent(
            new CustomEvent('createentity', {
                bubbles: true,
                composed: true
            })
        );
    }
  
    handleDownloadTemplate(event){
       // const fileUrl = '/resource/Facility_Details_Template';  // Update the file URL if necessary
        // window.open(fileUrl, '_blank');
         window.open(myResourceTemplate, '_blank');
    }
    
    handleInstructions(event){
        // console.log('type of user: ',this.typeOfUser);
        //const fileUrl = '/resource/Facility_Instructions_Bulk';  // Update the file URL if necessary
        window.open(myResource, '_blank');
    }
      
    handleUploadFinished(event) {
        console.log('thandleUploadFinished ');

        const fileList = event.target.files;
        if (!fileList || fileList.length === 0) {
            this.uploadfilenameflag = false;
            this.showToast('Error', 'No file selected', 'error');
            return;
        }

        const file = fileList[0];
        this.uploadedFileName = file.name;
        this.uploadfilenameflag = true;

        if (!file.name.endsWith('.csv')) {
            this.showToast('Error', 'Please upload a CSV file.', 'error');
            this.enableddisabled = true;
            return;
        }
        this.enableddisabled = true;
        this.readFileContent(file);
        this.uploadBtnContainer= false;
        localStorage.removeItem('activeFacilityTab');
    }

    readFileContent(file) {
        console.log('readFileContent ');
        const reader = new FileReader();
        reader.onload = () => {
            const fileContent = reader.result;
            //console.log('File Content:', JSON.stringify(fileContent));
            
            // Parse CSV data
            const parsedData = this.parseCSV(fileContent);
            //console.log('Parsed Data:', parsedData.length);

                // 2️⃣ Remove duplicate emails (CSV-level)
            const uniqueData = this.removeDuplicateEmailRows(parsedData);

            // Update data table
            // this.tableData = parsedData; commented
            const validatedData = this.validateCsvRows(uniqueData);
            this.tableData = validatedData;
            // 3️⃣ Normalize Name fields (Company vs Individual)
                //const normalizedData = this.normalizeNameFields(uniqueData);
           // this.tableData = normalizedData; 

            this.paginateData();
        };
        reader.onerror = () => {
            console.error('Error reading file:', reader.error);
        };

        reader.readAsText(file); // Read the file as text (for CSV files)
        
    }
    validateCsvRows(data) {
        console.log('🔍 validateCsvRows (UPLOAD TIME)');

        let hasAnyError = false;
        const toastMessages = [];

        const validatedData = data.map((row, index) => {
            const errors = [];
            const type = (row.Type || '').toLowerCase();
            const normalizedType = (row.Type || '').trim().toLowerCase();

            //let updatedRow = { ...row };
            let updatedRow = {
                ...row,
                Type: normalizedType // 🔥 force lowercase everywhere
            };

            /* ================= COMMON REQUIRED ================= */
            if (!updatedRow.Email) errors.push('Email');
            if (!updatedRow.ContactNumber) errors.push('Contact Number');
            if (!updatedRow.AddressStreet) errors.push('Street');
            if (!updatedRow.AddressCity) errors.push('City');
            if (!updatedRow.AddressState) errors.push('State');
            if (!updatedRow.AddressPostCode) errors.push('Post Code');
            if (!updatedRow.AddressCountry) errors.push('Country');

            /* ================= TYPE-SPECIFIC ================= */
            if (type === 'company') {
                if (!updatedRow.Name) errors.push('Company Name');
                if (!updatedRow.ABN) errors.push('ABN');

                // 🔥 Normalize
                updatedRow.FirstName = '';
                updatedRow.LastName = '';
            }

            if (type === 'individual') {
                if (!updatedRow.FirstName) errors.push('First Name');
                if (!updatedRow.LastName) errors.push('Last Name');

                // 🔥 Normalize
                updatedRow.Name = '';
            }

            if (errors.length > 0) {
                hasAnyError = true;

                const displayName =
                    updatedRow.Name ||
                    `${updatedRow.FirstName || ''} ${updatedRow.LastName || ''}`.trim() ||
                    `Row ${index + 2}`;

                toastMessages.push(
                    `Missing fields for ${displayName}: ${errors.join(', ')}`
                );
            }

            return {
                ...updatedRow,
                // 🔥 UPLOAD-TIME FLAGS ONLY
                hasUploadError: errors.length > 0,
                uploadErrorMessage: errors.join(', ')
            };
        });

        // 🔔 Toasts (deduplicated)
        [...new Set(toastMessages)].forEach(msg =>
            this.showToast('Error', msg, 'error')
        );

        // 🔥 Disable submit until fixed
        this.enableddisabled = hasAnyError;

        return validatedData;
    }


    //already existing method
    removeDuplicateEmailRows(data) {
       console.log('removeDuplicateEmails');

        const emailMap = new Map();
        const duplicateEmails = [];
        let validRecords = [];

        data.forEach(row => {
            const email = (row.Email || '').trim().toLowerCase();
            console.log(`\n🔍 Checking row  Email: ${email}`);

            if (emailMap.has(email)) {
                 console.log(`❌ Duplicate found → Skipping: ${email}`);
                duplicateEmails.push(email);   
            } else {
                 console.log(`✅ Unique → Keeping: ${email}`);
                emailMap.set(email, true);
                validRecords.push(row);      // ✅ Keep only first
            }
        });
        console.log('Total duplicates found:', duplicateEmails.length);
        console.log('Duplicate emails list:', JSON.stringify(duplicateEmails));
        console.log('Total valid records returned:', validRecords.length);

        if (duplicateEmails.length  > 0) {
           
            this.showToast('Error',  `${duplicateEmails.length} duplicate EmailID record(s) removed. `, 'error');
            
        }

         return validRecords; 
    }
     paginateData() {
         console.log('paginateData ');
        console.log('this.tableData:', this.tableData);
        
        if (!this.tableData || this.tableData.length === 0) {
            console.log('No data to paginate');
            this.paginatedData = [];
            this.totalRecords = 0;
            this.totalPages = 0;

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'No Data',
                    message: 'No data available to display.',
                    variant: 'error',
                    mode: 'dismissable'
                })
            );

            return;
        }
    
        this.totalRecords = this.tableData.length; // Total records without filtering
        const startIndex = (this.pageNumber - 1) * this.recordsPerPage;
        const endIndex = startIndex + this.recordsPerPage;
        
        //this.paginatedData = this.tableData.slice(startIndex, endIndex);
        //  this.paginatedData = this.tableData.slice(startIndex, endIndex).map(user => ({
        //     ...user,
        //     isSelected: this.selectedRecordIds.has(user.id)
        // }));
        this.paginatedData = this.tableData.slice(startIndex, endIndex);
        this.totalPages = Math.ceil(this.totalRecords / this.recordsPerPage);
      //  this.enableddisabled = true;

       // this.enableddisabled = this.selectedRecordIds.size === 0;
    //    this.enableddisabled =
    //         this.tableData.some(r => r.hasUploadError) || this.selectedRecordIds.size === 0;
        this.enableddisabled =
            !this.tableData.some(r => r.isSelected) ||
            this.tableData.some(r => r.hasUploadError);

        this.isAllSelected =
            this.paginatedData.length > 0 &&
            this.paginatedData.every(u => u.isSelected);

       // this.updatePaginationButtons();
    
        //console.log('Paginated Data:', JSON.stringify(this.paginatedData));
        //console.log('Paginated Data:', JSON.stringify(this.paginatedData.length));

    }

    parseCSV(data) {
        console.log('parseCSV ');

        // ✅ 1. Split and clean rows
        const rows = data
            .trim()
            .split(/\r?\n/)
            .map(row => row.trim());

        // ✅ 2. Check for empty or only-header CSV
        if (rows.length < 2 || !rows[1] || rows[1].split(',').every(cell => cell.trim() === '')) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Invalid File',
                    message: 'CSV must contain at least one header row and one data row.',
                    variant: 'error',
                    mode: 'dismissable'
                })
            );
            return [];
        }

        // ✅ 3. Extract and sanitize headers
      //  const headerRow = rows[0].split(',').map(header => header.trim());
        const headerRow = rows[0]
            .split(',')
            .map(header => header.trim())
            .filter(header => header !== ''); 

        console.log('Header Row:', headerRow);
        const seenHeaders = new Set();

        // ✅ 4. Check for duplicate headers
        for (let header of headerRow) {
            const cleanedHeader = header.replace(/ /g, '');
            if (seenHeaders.has(cleanedHeader)) {
                this.uploadBtnContainer = true;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Duplicate Column',
                        message: `Duplicate column found: ${cleanedHeader}`,
                        variant: 'error',
                        mode: 'sticky'
                    })
                );
                return [];
            }
            seenHeaders.add(cleanedHeader);
        }

    //     const requiredHeaders = [
    //       'Type','Name', 'FirstName', 'LastName', 'ContactNumber',  'Email','ToEmail',
    //    'CcEmail','ABN','AddressStreet','AddressState','AdressPostCode','AdressCountry'
    //     ];
        const requiredHeaders = [
            'Type','Name','FirstName','LastName','ContactNumber','Email',
            'ToEmail','CcEmail','ABN','AddressStreet','AddressCity',
            'AddressState','AddressPostCode','AddressCountry'
        ];
        console.log('Header Row:', headerRow);

        for (let required of requiredHeaders) {
            const exists = headerRow.some(h => h.replace(/ /g, '') === required);
            if (!exists) {
                this.uploadBtnContainer = true;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Missing Column',
                        message: `Missing required column: ${required}`,
                        variant: 'error',
                        mode: 'sticky'
                    })
                );
                return [];
            }
        }

        // ✅ 6. Parse data rows
        const dataRows = rows.slice(1);
        const parsedData = [];
        const baseTimestamp = Date.now();

        dataRows.forEach((row, index) => {
            if (!row) return;

            const rowValues = row.split(',').map(val => val.trim());
            const isMeaningful = rowValues.some(val => val && val.replace(/[`"']/g, '').trim() !== '');
            if (!isMeaningful) return;

            const rowObject = { id: baseTimestamp + index };

            headerRow.forEach((header, i) => {
                const trimmedHeader = header.replace(/ /g, '');
                rowObject[trimmedHeader] = rowValues[i] ? rowValues[i].trim() : '';
            });

            parsedData.push(rowObject);
        });

        console.log('Parsed Data:', JSON.stringify(parsedData));
        return parsedData;
    }
     showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    }
    
    //@track selectedRecordIds = new Set();
    // handleRowSelection(event) {
    //     const userId = Number(event.currentTarget.dataset.id);
    //     const isChecked = event.target.checked;
    
    //     if (!userId) {
    //         console.error('User ID is undefined');
    //         return;
    //     }
    //     // if (isChecked) {
    //     //     this.selectedRecordIds.add(userId);
    //     // } else {
    //     //     this.selectedRecordIds.delete(userId);
    //     // }
    
    //     //  this.tableData = this.tableData.map(user => ({
    //     //     ...user,
    //     //     isSelected: this.selectedRecordIds.has(user.id)
    //     // }));
    //     this.tableData = this.tableData.map(row =>
    //         row.id === userId
    //             ? { ...row, isSelected: isChecked }
    //             : row
    //     );
    
    //     // Ensure paginatedData reflects the change
    //     this.paginateData();
    
    //     // Check if all rows on the current page are selected
    //    // this.isAllSelected = this.paginatedData.every(user => user.isSelected);
    
    //     // Reverse logic: disable when at least one row is selected
    //     //this.enableddisabled = !this.tableData.some(user => user.isSelected);
    //      this.enableddisabled = this.selectedRecordIds.size === 0;
    //     this.isAllSelected =
    //             this.paginatedData.length > 0 &&
    //             this.paginatedData.every(user => user.isSelected);
    
    //     console.log('this.isAllSelected ===> ' + this.isAllSelected);
    //     console.log('this.enableddisabled ===> ' + this.enableddisabled);
    // }
    handleRowSelection(event) {
        const userId = Number(event.currentTarget.dataset.id);
        const isChecked = event.target.checked;

        this.tableData = this.tableData.map(row =>
            row.id === userId
                ? { ...row, isSelected: isChecked }
                : row
        );

        this.paginateData();
    }
    // handleSelectAll(event) {
    //     const isChecked = event.target.checked;
    
    //     // Update selection in full tableData
    //     // this.tableData = this.tableData.map(user => ({
    //     //     ...user,
    //     //     isSelected: isChecked
    //     // }));
    //     this.paginatedData.forEach(user => {
    //         if (isChecked) {
    //             this.selectedRecordIds.add(user.id);
    //         } else {
    //             this.selectedRecordIds.delete(user.id);
    //         }
    //     });

    //     // Update main tableData flags
    //     this.tableData = this.tableData.map(user => ({
    //         ...user,
    //         isSelected: this.selectedRecordIds.has(user.id)
    //     }));
    //     // Refresh paginatedData
    //     this.paginateData();
    
    //     // Reverse logic: disable when at least one row is selected
    //    // this.enableddisabled = !isChecked;
    //    this.enableddisabled = this.selectedRecordIds.size === 0;
    
    //     console.log('isChecked ===>', isChecked);
    //     console.log('this.enableddisabled ===>', this.enableddisabled);
    // }
    
    handleSelectAll(event) {
        const isChecked = event.target.checked;
        const pageIds = new Set(this.paginatedData.map(r => r.id));

        this.tableData = this.tableData.map(row =>
            pageIds.has(row.id)
                ? { ...row, isSelected: isChecked }
                : row
        );

        this.paginateData();
    }

    // Update the number of records per page
    handleRecordsPerPage(event) {
        this.recordsPerPage = parseInt(event.target.value, 10);
        this.pageNumber = 1;
        this.paginateData();
    }

    // Update pagination button states
    updatePaginationButtons() {
        this.bDisableFirst = this.pageNumber === 1;
        this.bDisableLast = this.pageNumber === this.totalPages;
    }

    // Navigate to the first page
    firstPage() {
        this.pageNumber = 1;
        this.paginateData();
        //this.loadPaginatedData();
    }

    // Navigate to the previous page
    previousPage() {
        if (this.pageNumber > 1) {
            this.pageNumber--;
            this.paginateData();
           // this.loadPaginatedData();
        }
    }

    // Navigate to the next page
    nextPage() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber++;
            this.paginateData();
            //this.loadPaginatedData();
        }
    }

    // Navigate to the last page
    lastPage() {
        this.pageNumber = this.totalPages;
        this.paginateData();
        //this.loadPaginatedData();
    }
    @track editRecordId ;

    //----------------Edit Popup    ------------------//

    // handleEdit(event) {
    //     event.preventDefault();

    //     const recordId = Number(event.currentTarget.dataset.id);

    //     console.log('Clicked Record Id:', recordId);
    //     console.log('Table Data:', JSON.stringify(this.tableData));

    //     if (!recordId) {
    //         this.showToast('Error', 'Invalid record ID', 'error');
    //         return;
    //     }

    //     const record = this.tableData.find(row => row.id === recordId);
    
    //     if (!record) {
    //         this.showToast('Error', 'Unable to load record', 'error');
    //         return;
    //     }
    //     this.editRecord = {
    //         ...record,
    //         Type: (record.Type || '').trim().toLowerCase()
    //     };

    //     // Clone so edits don’t auto-update table
    //     // this.editRecord = { ...record,

    //     //      // 🔹 Address fields (NEW – REQUIRED)
    //     // // AddressStreet: record.AddressStreet || '',
    //     // // AddressCity: record.AddressCity || '',
    //     // // AddressState: record.AddressState || '',
    //     // // AddressPostCode: record.AddressPostCode || '',
    //     // // AddressCountry: record.AddressCountry || 'Australia'


    //     //  };
    //     this.editRecordId = recordId;

    //         // ✅ hydrate UI state from row
    //     this.selectedOption1 = record.TaxCodeLabel || '';
    //     this.tax = record.TaxRate || '';
        
    //     this.customerSearchTerm = record.AccountDisplay || '';
    //     this.customerSelectedAccountId = record.AccountId || '';

    //      // ✅ hydrate modal UI from row
    //         this.customerSelectedAccountId = record.AccountId || '';

    //         // this.includeOrgEmail =
    //         // this.orgEmail &&
    //         // this.editRecord.CcEmail?.toLowerCase()
    //         // .includes(this.orgEmail.toLowerCase());
    //        // ✅ restore actual saved value
    //          this.includeOrgEmail = !!this.editRecord.IncludeOrgEmail;

    //     this.isEditModalOpen = true;
    //     this.customerFlag= true;
    // }
    // handleEditChange(event) {
    //     const field = event.target.dataset.field;
    //     const value = event.target.value;

    //     //const type = (this.editRecord.Type || '').toLowerCase();

    //     let updatedRecord = {
    //         ...this.editRecord,
    //         [field]: value
    //     };

    //     /* 🔥 FORCE RULES WHILE TYPING */
    //     if (type === 'company') {
    //         updatedRecord.FirstName = '';
    //         updatedRecord.LastName = '';
    //     }

    //     if (type === 'individual') {
    //         updatedRecord.Name = '';
    //     }

    //     this.editRecord = updatedRecord;
    // }
 
    // handleSaveEdit() {
    //     if (!this.editRecordId) {
    //         this.showToast('Error', 'Nothing to save', 'error');
    //         return;
    //     }
    //      const type = (this.editRecord.Type || '').toLowerCase();

    //     if (type === 'company') {
    //         this.editRecord = {
    //             ...this.editRecord,
    //             FirstName: '',
    //             LastName: ''
    //         };
    //     }

    //     if (type === 'individual') {
    //         this.editRecord = {
    //             ...this.editRecord,
    //             Name: ''
    //         };
    //     }
    //     const [validatedRow] = this.validateCsvRows([this.editRecord]);
    //     this.enableddisabled =
    //         !this.tableData.some(r => r.isSelected) ||
    //         this.tableData.some(r => r.hasUploadError);

    //     this.tableData = this.tableData.map(row =>
    //         row.id === this.editRecordId
    //             ? { ...validatedRow ,
    //                  isSelected: row.isSelected
    //              }   // replace edited row
    //             : row
    //     );

    //     console.log('Updated tableData:', JSON.stringify(this.tableData));
    //     console.log('Updated paginateData:', JSON.stringify(this.paginateData));
    //     this.paginateData();   // refresh table
    //     this.closeEditModal();

    //     this.showToast('Success', 'Record updated successfully', 'success');
    // }
//    handleEdit(event) {
//     const recordId = Number(event.currentTarget.dataset.id);
//     const record = this.tableData.find(r => r.id === recordId);

//     if (!record) {
//         this.showToast('Error', 'Unable to load record', 'error');
//         return;
//     }

//     // 🔥 NORMALIZE TYPE FOR COMBOBOX
//     const uiType =
//         (record.Type || '').toLowerCase() === 'company'
//             ? 'Company'
//             : (record.Type || '').toLowerCase() === 'individual'
//             ? 'Individual'
//             : '';

//     let cleanedRecord = {
//         ...record,
//         Type: uiType
//     };

//     // 🔥 CLEAR FIELDS BASED ON TYPE
//     if (uiType === 'Company') {
//         cleanedRecord.FirstName = '';
//         cleanedRecord.LastName = '';
//     }

//     if (uiType === 'Individual') {
//         cleanedRecord.Name = '';
//     }

//     this.editRecord = cleanedRecord;
//     this.editRecordId = recordId;
//     this.isEditModalOpen = true;
// }
    handleEdit(event) {
        const recordId = Number(event.currentTarget.dataset.id);
        const record = this.tableData.find(r => r.id === recordId);

        if (!record) {
            this.showToast('Error', 'Unable to load record', 'error');
            return;
        }

        const uiType =
            record.Type?.toLowerCase() === 'company'
                ? 'Company'
                : record.Type?.toLowerCase() === 'individual'
                ? 'Individual'
                : '';

        let cleaned = {
            ...record,
            Type: uiType
        };

        if (uiType === 'Company') {
            cleaned.FirstName = '';
            cleaned.LastName = '';
        }
        if (uiType === 'Individual') {
            cleaned.Name = '';
        }

        // ✅ DATA STATE
        this.editRecord = cleaned;
        this.editRecordId = recordId;

        // ✅ UI STATE (CRITICAL)
        this.selectedOption1 = record.TaxCodeLabel || '';
        this.tax = record.TaxRate || '';
        this.customerSearchTerm = record.AccountDisplay || '';
        this.customerSelectedAccountId = record.AccountId || '';
        this.includeOrgEmail = !!record.IncludeOrgEmail;
        this.customerFlag= true;

        // 🔥 DO NOT TOUCH THESE
        this.isDropdownOpen1 = false;
        this.customerShowTable = false;
        this.listenForOutsideClick = false;

        this.isEditModalOpen = true;
    }


// handleEditChange(event) {
//     if (!this.editRecord) return;

//     const field = event.target.dataset.field;
//     const value = event.target.value;

//     let updated = {
//         ...this.editRecord,
//         [field]: value
//     };

//     const type = (updated.Type || '').toLowerCase();

//     // 🔥 FORCE CLEAR LIVE
//     if (type === 'company') {
//         updated.FirstName = '';
//         updated.LastName = '';
//     }

//     if (type === 'individual') {
//         updated.Name = '';
//     }

//     this.editRecord = updated;
// }
handleEditChange(event) {
    if (!this.editRecord) return;

    const field = event.target.dataset.field;
    const value = event.target.value;

    let updated = {
        ...this.editRecord,
        [field]: value
    };

    const type = (updated.Type || '').toLowerCase();

    if (type === 'company') {
        updated.FirstName = '';
        updated.LastName = '';
    }
    if (type === 'individual') {
        updated.Name = '';
    }

    // 🔥 IMPORTANT: only update editRecord
    this.editRecord = updated;
}

// handleSaveEdit() {
//     if (!this.editRecordId) {
//         this.showToast('Error', 'Nothing to save', 'error');
//         return;
//     }

//     let updated = { ...this.editRecord };
//     const type = (updated.Type || '').toLowerCase();

//     if (type === 'company') {
//         updated.FirstName = '';
//         updated.LastName = '';
//     }

//     if (type === 'individual') {
//         updated.Name = '';
//     }

//     // 🔥 STORE BACK UI VALUE (Company / Individual)
//     this.tableData = this.tableData.map(row =>
//         row.id === this.editRecordId
//             ? { ...updated, isSelected: row.isSelected }
//             : row
//     );

//     this.closeEditModal();
//     this.paginateData();
//     this.showToast('Success', 'Record updated successfully', 'success');
// }
    handleSaveEdit() {
        if (!this.editRecordId) return;

        let updated = { ...this.editRecord };
        const type = (updated.Type || '').toLowerCase();

        if (type === 'company') {
            updated.FirstName = '';
            updated.LastName = '';
        }
        if (type === 'individual') {
            updated.Name = '';
        }

        // this.tableData = this.tableData.map(row =>
        //     row.id === this.editRecordId
        //         ? { ...updated, isSelected: row.isSelected }
        //         : row
        // );
        const [validatedRow] = this.validateCsvRows([updated]);

        // 🔥 UPDATE TABLE DATA
        this.tableData = this.tableData.map(row =>
            row.id === this.editRecordId
                ? { ...validatedRow, isSelected: row.isSelected }
                : row
        );
        this.enableddisabled =
            !this.tableData.some(r => r.isSelected) ||
            this.tableData.some(r => r.hasUploadError);

        this.closeEditModal();
        this.paginateData();
        this.showToast('Success', 'Record updated successfully', 'success');
    }
    closeEditModal() {
        this.isEditModalOpen = false;
        this.editRecord = {};
        this.editRecordId = null;
    }
    fetchLedgerItems() {
        console.log('Calling Apex Methodin bulk: getLedgerItems...');
        console.log('companyId in fetchLedgerItems in bulk: ' + this.selectedCompId);

        // Call the Apex method and pass companyId as parameter
        getLedgerItems({ companyId: this.selectedCompId })
            .then(result => {
                console.log('Ledger Items Fetched from Apex in bulk:', JSON.stringify(result));

                // Process the data and map it to a proper format
                this.customerLedgerItems = result.map(item => ({
                    id: item.Id,
                    accNo: item.Account_Number__c,
                    itemName: item.Name,
                    category: item.Category__r.Name,
                }));

                console.log('Processed Ledger Items in bulk:', JSON.stringify(this.customerLedgerItems));
                    this.customerFilteredLedgerItems = this.customerLedgerItems;
            })
            .catch(error => {
                console.error('Error fetching ledger items:', JSON.stringify(error));
                this.errorMessage = 'Error fetching ledger items: ' + error.body.message; // Capture error message
            });
    }
    toggleDropdown1(event) {
        console.log('toggleDropdown1 called');
        //this.customerFlag= true;
        event.stopPropagation();
            this.isDropdownOpen1 = !this.isDropdownOpen1;
            const inputEl = event.target;
            const rect = inputEl.getBoundingClientRect();

        this.toggleDropdownAccount1 = `
            position: fixed;
            top: ${rect.bottom + 4}px;
            left: ${rect.left - 275}px;
            width: 23%;
            max-height: 300px;
            z-index: 10000;
            background: white;
            border: 1px solid #ccc;
            border-radius: 6px;
            overflow-y: auto;
            overflow-x: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        if (this.isDropdownOpen1) {
            setTimeout(() => (this.listenForOutsideClick = true), 0);
        } else {
            this.listenForOutsideClick = false;
        }
    }
    handleCustomerALClick(event) {
      
        event.stopPropagation();
         const inputEl = event.target;
        const rect = inputEl.getBoundingClientRect();
      
        this.toggleDropdownAccount = `
            position: fixed;            
            top: ${rect.bottom + 4}px;
            left: ${rect.left - 275}px;
            width: 23%;
            max-height: 300px;
            z-index: 1000;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4%;
            overflow-y: auto;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        this.customerShowTable = !this.customerShowTable;
        //this.fetchLedgerItems();
        if (this.customerShowTable) {
            setTimeout(() => {
                console.log('✅ Outside click detection enabled');
                this.listenForOutsideClick = true;
            }, 0);
        } else {
            console.log('❌ Popover closed manually');
            this.listenForOutsideClick = false;
        }
    }
      handleSelection1(event) {
       
        const selectedRow = event.currentTarget;

        // Retrieve the label (data-value) and rate (data-value1) from the clicked row
        const selectedLabel = selectedRow.getAttribute('data-value');
        const selectedRate = selectedRow.getAttribute('data-value1');

        // Set the selected values
        this.selectedOption1 = selectedLabel;  // Store the label (e.g., 'GST, Goods & Service Tax, 10%')
        this.tax = selectedRate;               // Store the rate (e.g., '10%')

        // Log both values to ensure they are being captured correctly
        console.log('Selected Option (Label):', this.selectedOption1);
        console.log('Selected Rate:', this.tax);

         // ✅ ROW state
            this.editRecord = {
                ...this.editRecord,
                TaxCodeLabel: selectedLabel,
                TaxRate: selectedRate
            };


        this.isDropdownOpen1 = !this.isDropdownOpen1;
         this.listenForOutsideClick = false;
        
    }

    handleCustomerSelection(event) {
        const itemName = event.currentTarget.dataset.value;
        const selectedId = event.currentTarget.dataset.id;
        const accNo = event.currentTarget.dataset.accno;

        this.customerSearchTerm = `${accNo} - ${itemName}`;

        // ✅ ROW state
            this.editRecord = {
                ...this.editRecord,
                AccountId: selectedId,
                AccountDisplay: this.customerSearchTerm
            };

        this.customerSelectedAccountId = selectedId;
        this.customerShowTable = false;

        console.log('Customer selected:', this.customerSearchTerm, selectedId);
        this.listenForOutsideClick = false;
    }
    
    handleCustomerSearch(event) {
        this.customerSearchTerm = event.target.value;

        // Update editRecord instead of global UI
                this.editRecord = {
                    ...this.editRecord,
                    AccountDisplay: customerSearchTerm
                };
        const searchLower = this.customerSearchTerm.toLowerCase();

        this.customerFilteredLedgerItems = this.customerLedgerItems.filter(item => {
            const accNo = item.accNo?.toLowerCase() || '';
            const itemName = item.itemName?.toLowerCase() || '';
            const combined = `${accNo} - ${itemName}`;

            return (
                accNo.includes(searchLower) ||
                itemName.includes(searchLower) ||
                combined.includes(searchLower)
            );
        });

        if (!this.customerSearchTerm) {
            this.customerFilteredLedgerItems = [...this.customerLedgerItems];
        }
        this.customerShowTable = true;
    }

@track includeOrgEmail = false;
@track orgEmail = '';
 
handleIncludeOrgEmail(event) {
       
       const checked = event.target.checked;
    this.includeOrgEmail = event.target.checked;
    this.editRecord = {
        ...this.editRecord,
        IncludeOrgEmail: checked
    };

    if (this.includeOrgEmail) {
        this.appendOrgEmailToCc();
    } else {
        this.removeOrgEmailFromCc();
    }
}

appendOrgEmailToCc() {
    // already fetched once
    if (this.orgEmail) {
        this.updateCcWithOrgEmail();
        return;
    }

    getOrgEmailForBulk({ companyId: this.selectedCompId })
        .then(email => {
            if (!email) return;
            this.orgEmail = email.trim();
            this.updateCcWithOrgEmail();
        })
        .catch(err => console.error('Org Email fetch error', err));
}
    updateCcWithOrgEmail() {
    let existing = this.editRecord.CcEmail || '';

    let emails = existing
        ? existing.split(',').map(e => e.trim())
        : [];

    if (!emails.some(e => e.toLowerCase() === this.orgEmail.toLowerCase())) {
        emails.push(this.orgEmail);
    }

    this.editRecord = {
        ...this.editRecord,
        CcEmail: emails.join(', ')
    };
}

removeOrgEmailFromCc() {
    if (!this.orgEmail) return;

    let existing = this.editRecord.CcEmail || '';

    let emails = existing
        .split(',')
        .map(e => e.trim())
        .filter(e => e.toLowerCase() !== this.orgEmail.toLowerCase());

    this.editRecord = {
        ...this.editRecord,
        CcEmail: emails.join(', ')
    };
}

    handleFinalSubmit() {
      //  const selectedRows = this.tableData.filter(r => r.isSelected && r.ProcessedStatus !== 'Success ✅');
       // console.log('this.selectedCompanyId : ',this.selectedCompId );

       //To not mix Name, firstname and last name while submission
        this.tableData = this.normalizeNameFields(this.tableData, false);
        
        const anySelected = this.tableData.some(r => r.isSelected);

            if (!anySelected) {
                this.showToast('Error', 'Please select at least one record.', 'error');
                return;
            }
      
        // if (selectedRows.length === 0) {
        //     this.showToast('Error', 'Please select at least one record.', 'error');
        //     return;
        // }

          const selectedRows = this.tableData.filter(
        r => r.isSelected && r.ProcessedStatus !== 'Success ✅'
            );

            if (selectedRows.length === 0) {
                this.showToast(
                    'Info',
                    'All selected records are already processed.',
                    'info'
                );
                return;
            }

        let hasError = false;


        // 🔹 REQUIRED CSV FIELDS
        // const csvRequired = [
        //     { key: 'Type', label: 'Type' },
        //     { key: 'Name', label: 'Name' },
        //     { key: 'FirstName', label: 'First Name' },
        //     { key: 'LastName', label: 'Last Name' },
        //     { key: 'ContactNumber', label: 'Contact Number' },
        //     { key: 'Email', label: 'Email' },
        //     { key: 'ABN', label: 'ABN' },
        //     { key: 'AddressStreet', label: 'Street' },
        //     { key: 'AddressCity', label: 'City' },
        //     { key: 'AddressState', label: 'State' },
        //     { key: 'AddressPostCode', label: 'Post Code' },
        //     { key: 'AddressCountry', label: 'Country' }
        // ];

        // // 🔥 REQUIRED FROM EDIT MODAL
        // const editRequired = [
        //     { key: 'TaxCode', label: 'Tax Code' },
        //     { key: 'AccountId', label: 'Account List' }
        // ];
         const commonRequired = [
            { key: 'Type', label: 'Type' },
           // { key: 'Name', label: 'Name' },
            //{ key: 'FirstName', label: 'First Name' },
            //{ key: 'LastName', label: 'Last Name' },
            { key: 'ContactNumber', label: 'Contact Number' },
            { key: 'Email', label: 'Email' },
           // { key: 'ABN', label: 'ABN' },
            { key: 'AddressStreet', label: 'Street' },
            { key: 'AddressCity', label: 'City' },
            { key: 'AddressState', label: 'State' },
            { key: 'AddressPostCode', label: 'Post Code' },
            { key: 'AddressCountry', label: 'Country' },
        
            { key: 'TaxCodeLabel', label: 'Tax Code' },
            { key: 'AccountId', label: 'Account List' }
        ];

        this.tableData = this.tableData.map(row => {
            if (!row.isSelected) return row;

            const missing = [];
            const type = (row.Type || '').toLowerCase();

            // csvRequired.forEach(f => {
            //     if (!row[f.key]) missing.push(f.label);
            // });

            // editRequired.forEach(f => {
            //     if (!row[f.key]) missing.push(f.label);
            // });
            if (type === 'company') {
                if (!row.Name) missing.push('Company Name');
                if (!row.ABN)  missing.push('ABN');
                // First / Last name optional
            }

            if (type === 'individual') {
                if (!row.FirstName) missing.push('First Name');
                if (!row.LastName)  missing.push('Last Name');
                // Name + ABN optional
            }

            /* ================= COMMON REQUIRED ================= */
            commonRequired.forEach(f => {
                if (!row[f.key]) missing.push(f.label);
            });

            if (missing.length > 0) {
                hasError = true;
                const displayName = row.Name
                    ? row.Name
                    : `${row.FirstName || ''} ${row.LastName || ''}`.trim();

                this.showToast(
                    'Error',
                   `Missing fields for ${displayName}: ${missing.join(', ')}`,
                    'error'
                );

                return {
                    ...row,
                    ProcessedStatus: 'Error ❌: Missing Required Fields'
                };
            }

            return row;
        });

        if (hasError) {
            this.forceTableUpdate();
            return;
        }

        
               
        // normalizedSelectedRows is used For Name Validation created after normalizing names and same is passed to payload

        const normalizedSelectedRows = this.tableData.filter(
            r => r.isSelected && r.ProcessedStatus !== 'Success ✅'
        );
        // 🔹 REMOVE DUPLICATE EMAILS (case-insensitive)
        const emailSet = new Set();
        const payload = [];

        // for (const row of selectedRows) {
            for (const row of normalizedSelectedRows) {
            const emailKey = row.Email.trim().toLowerCase();
            if (emailSet.has(emailKey)) {
                this.showToast(
                    'Error',
                    `Duplicate Email found: ${row.Email}`,
                    'error'
                );
                continue;
            }
            emailSet.add(emailKey);

            payload.push({
                CompanyId: this.selectedCompId,
                Type: row.Type,
                Name: row.Name,
                FirstName: row.FirstName,
                LastName: row.LastName,
                ContactNumber: row.ContactNumber,
                Email: row.Email,
                ToEmail: row.ToEmail,
                CcEmail: row.CcEmail,

                ABN: row.ABN,
                AddressStreet: row.AddressStreet,
                AddressCity: row.AddressCity,
                AddressState: row.AddressState,
                AddressPostCode: row.AddressPostCode,
                AddressCountry: row.AddressCountry,

                // 🔥 FINANCIAL (from edit modal)
                // TaxCode: row.TaxCode,
                TaxCode: row.TaxCodeLabel,        // ✅ TEXT
                Accountlist: row.AccountDisplay,
                TaxRate: row.TaxRate,
                AccountItemId: row.AccountId,
                IncludeOrgEmail: row.IncludeOrgEmail ? 'true' : 'false'
            });
        }

        if (payload.length === 0) return;

        console.log('📤 ENTITY SUBMIT PAYLOAD:', JSON.stringify(payload));

        this.uploadEntityToApex(payload);
      //  this.selectedRecordIds.clear();
        // this.tableData = this.tableData.map(row => ({
        //     ...row,
        //     isSelected: false
        // }));
        this.paginateData();
        localStorage.removeItem('activeFacilityTab');
    }

    normalizeNameFields(data) {
        let normalizationMessages = [];

        const normalizedData = data.map(row => {
            const type = (row.Type || '').toLowerCase();

            // 🏢 COMPANY → only Name
            if (type === 'company') {
                if (row.FirstName || row.LastName) {
                    normalizationMessages.push({
                        message: 'For Company type, First Name and Last Name are cleared.',
                        variant: 'error'
                    });
                }

                return {
                    ...row,
                    FirstName: '',
                    LastName: ''
                };
            }

            // 👤 INDIVIDUAL → only First + Last
            if (type === 'individual') {
                if (row.Name) {
                    normalizationMessages.push({
                        message: 'For Individual type, Company Name is cleared.',
                        variant: 'error'
                    });
                }

                return {
                    ...row,
                    Name: ''
                };
            }

            return row;
        });

        // 🔔 Show toast once per rule
        if (normalizationMessages.length > 0) {
            const uniqueMessages = [
                ...new Map(
                    normalizationMessages.map(m => [m.message, m])
                ).values()
            ];

            uniqueMessages.forEach(m => {
                this.showToast('Error', m.message, m.variant);
            });
        }

        return normalizedData;
    }
    
    uploadEntityToApex(records) {
        createEntityOnBulk({ records })
            .then(result => {
                const { successRecords, failedRecords } = result;

                this.tableData = this.tableData.map(row => {
                    if (!row.isSelected) return row;

                    const success = successRecords.find(
                        r => r.Email?.toLowerCase() === row.Email?.toLowerCase()
                    );

                    const failed = failedRecords.find(
                        r => r.Email?.toLowerCase() === row.Email?.toLowerCase()
                    );

                    if (success) {
                        return {
                            ...row,
                            ProcessedStatus: 'Success ✅',
                            isSelected: false
                        };
                    }

                    if (failed) {
                        return {
                            ...row,
                            ProcessedStatus: `Error ❌: ${failed.ErrorMessage}`,
                            isSelected: false
                        };
                    }

                    return row;
                });

                this.isProcessed = true;
                this.forceTableUpdate();
            })
            .catch(error => {
                console.error('❌ Entity bulk error:', error);
                this.showToast(
                    'Error',
                    error.body?.message || error.message,
                    'error'
                );
            });
    }
     forceTableUpdate() {
        // Recalculate pagination indexes after processing
        this.refreshPaginationIndexes(); 
    
        // Refresh pagination to show updated status
        this.refreshPaginatedData();
    }

    // 🚀 Recalculate Pagination Indexes
    refreshPaginationIndexes() {
        const pageSize = 10;  // Set the page size

        // Ensure currentPage is a valid number
        if (isNaN(this.currentPage) || this.currentPage <= 0) {
        this.currentPage = 1;  // Default to the first page if currentPage is invalid
        }

        // Calculate startIndex and endIndex based on current page
        this.startIndex = (this.currentPage - 1) * pageSize;
        this.endIndex = this.startIndex + pageSize;

        // Debugging log to check values
        console.log(`Pagination Indexes: Start - ${this.startIndex}, End - ${this.endIndex}`);
    }

    
    // 🚀 Refresh Paginated Data
    refreshPaginatedData() {
        // Ensure there is data in tableData before slicing
        if (this.tableData.length > 0) {
            this.paginatedData = this.tableData.slice(this.startIndex, this.endIndex);
        } else {
            console.log('No data available for pagination');
            this.paginatedData = [];  // Clear pagination data if no data is available
        }
    
        // Debugging log to check the paginated data
        console.log('Paginated Data:', JSON.stringify(this.paginatedData));
    }

    handleErrorClick(event) {
        // Log for debugging
        console.log('handleerror===>', event.target.closest('tr').dataset.id);
        
        // Get the user ID from the data-id attribute of the <tr> element
        const userId = event.target.closest('tr').dataset.id; 
    
        // Find the relevant user based on the ID
        const user = this.tableData.find(user => user.id === parseInt(userId)); // Ensure user ID is compared correctly (parseInt if it's a string)
    
        // Check if there's an error message for this user
        if (user && user.ProcessedStatus && user.ProcessedStatus.includes('Error')) {
            this.errorMessage = user.ProcessedStatus; // Set the error message
            this.isErrorPopupVisible = true;  // Show the popup
        }
    }
    handleClosePopup() {
        this.isErrorPopupVisible = false;
        this.errorMessage = '';  // Clear the error message
    }   
     childevent(event){
        const name = event.detail.message;
        console.log('CHILD MESSAGE'+name);
        switch (name) { 
            case 'Entities':
               // this.isHome=true; 
                this.isNewEntityFlag = true;
                
                break;

            default:
             this.isHome=true;  
        }  
    } 
    
    cancleTable() {
        console.log('🟥 Cancel clicked — resetting to upload state');

        this.tableData = [];
        this.paginatedData = [];
        this.totalRecords = 0;
        this.pageNumber = 1;

        this.selectedRecordMap = new Map();
        this.isAllSelected = false;
        this.enableddisabled = true;

        this.isEntityExist = true;
        this.disableBool = true;

        this.uploadBtnContainer = true;

        this.uploadedFileName = null;
        this.uploadfilenameflag = false;
        localStorage.removeItem('activeFacilityTab');

        console.log('✅ UI reset complete — upload visible, table hidden');
    }

            //---------Validations-----------//

         




}