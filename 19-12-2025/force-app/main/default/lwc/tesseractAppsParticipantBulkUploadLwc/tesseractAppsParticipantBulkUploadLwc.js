import { LightningElement, track, wire, api } from "lwc";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createClientsOnBulk from '@salesforce/apex/ClientDataController.createClientsOnBulk';
import getfacilityById from '@salesforce/apex/FacilityController.getfacilityById';

export default class TesseractAppsParticipantBulkUploadLwc extends LightningElement {

    @track bulkUploadHomePage= true;
    @track uploadBtnContainer= true;
    @track tableData = [];
    @track isAllSelected = false;
    @track isProcessed = false;
    @track uploadedFiles = [];
    // @track selectedFile = null;
    @track uploadedFileName = '';
    @track uploadfilenameflag = false;
    // @track isattachError = false;
    // @track file;
    // @track fileName;
    // @track fileType;
    // @track fileSize;
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
    @track facilityPreferredName;
    @track participantPreferredName;
    @track nonNdisFlag=false;
    @track  facilityService;
    @track selectedParticipantType;
    @track disableDownload= true;
    @track templateType = ''; 
    @track requiredHeaders = [];
    @track facilityId;
    @track selectedRecordIds = new Set();
    //@track isCompany = false;
   // @track isClientOrIndividual = false;
      allFields = [
        { key: 'FirstName', label: 'First Name' },
        { key: 'LastName', label: 'Last Name' },
        { key: 'Gender', label: 'Gender' },
        { key: 'ContactNumber', label: 'Contact Number' },
        { key: 'EmailID', label: 'Email ID' },
        { key: 'DateofBirth', label: 'Date of Birth' },
        //{ key: 'Facility', label: 'Facility' },
        { key: 'PrimaryContactFirstName', label: 'Primary Contact First Name' },
        { key: 'PrimaryContactLastName', label: 'Primary Contact Last Name' },
        { key: 'PrimaryContactEmail', label: 'Primary Contact Email' },
        { key: 'PrimaryContactNumber', label: 'Primary Contact Number' },
        { key: 'AddressStreet', label: 'Address Street' },
        { key: 'AddressCity', label: 'Address City' },
        { key: 'AddressState', label: 'Address State' },
        { key: 'AdressPostCode', label: 'Address Post Code' },
        { key: 'AddressCountry', label: 'Address Country' },
        { key: 'CompanyName', label: 'Company Name' },
        { key: 'StartDate', label: 'Start Date' }
    ];
    // Required headers per template
    requiredClientHeaders = [
        'FirstName', 'LastName', 'Gender', 'ContactNumber', 'EmailID', 'DateofBirth',
        'PrimaryContactFirstName', 'PrimaryContactLastName',
        'PrimaryContactEmail', 'PrimaryContactNumber',
        'AddressStreet', 'AddressCity', 'AddressState', 'AdressPostCode', 'AddressCountry'
    ];

    requiredCompanyHeaders = [
        'CompanyName', 'StartDate', 'ContactNumber', 'EmailID',
        'AddressStreet', 'AddressCity', 'AddressState', 'AdressPostCode', 'AddressCountry'
    ];

    requiredIndividualHeaders = [
        'FirstName', 'LastName', 'Gender', 'ContactNumber', 'EmailID', 'DateofBirth',
        'AddressStreet', 'AddressCity', 'AddressState', 'AdressPostCode', 'AddressCountry'
    ];

    @track participantTypeOptions = [
        { label: 'Company', value: 'Company' },
        { label: 'Individual', value: 'Individual' }
    ];
   // allFields = [];     // Populate with objects { key: 'FieldAPI', label: 'Field Label' }

   get isCompany() {
        return this.templateType === 'Company';
    }

    get isClientOrIndividual() {
        return this.templateType === 'Client' || this.templateType === 'Individual';
    }
    connectedCallback() {
        this.enableddisabled = true;
        //this.loadPaginatedData();
        const storedFacilityId = localStorage.getItem('defaultFacilityId');
        const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');
        this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "Participant";
        this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Facility";
       // this.staffPreferredName = localStorage.getItem("defaultstaffPreferredName") || "Staff";
        console.log('localStorage.getItem("defaultParticipantPreferredName") >>', localStorage.getItem("defaultParticipantPreferredName"));
        console.log('localStorage.getItem("defaultFacilityPreferredName") >>', localStorage.getItem("defaultFacilityPreferredName"));
        
        console.log('fetched',this.participantPreferredName);
        console.log('fetched',this.facilityPreferredName);
       // this.fetchOrgDetails();
        console.log('storedFacilityId'+storedFacilityId);
        console.log('storedFacilityLabel'+storedFacilityLabel);
        this.facilityId=storedFacilityId;
        
        window.addEventListener('keydown', this.handleKeyShortcut.bind(this));
        
        if (storedFacilityId) {
                // Call Apex to get facility details
                getfacilityById({ facId: storedFacilityId })
                    .then(result => {
                        console.log('Facility Record:', result);
                        this.facilityService = result.Type_of_Service__c || '';
                        console.log('  this.facilityService :',   this.facilityService );  
                    })
                    .catch(error => {
                        console.error('Error fetching facility:', error);
                    });
            }
            this.paginateData();
            this.updatePaginationButtons();
    }
    disconnectedCallback() {
         window.removeEventListener('keydown', this.handleKeyShortcut.bind(this));
    }
    
    navigateToParticipant() {
        
        console.log("Hello from client bulk upload .");

        const customEvent = new CustomEvent("clienteventfrombulk", {
        detail: { message: "Hello from client bulk upload!" }
        });
        this.dispatchEvent(customEvent);
    }

    cancleTable() {
        this.uploadBtnContainer= true;
        this.tableData=[]
       // this.isAllSelected= false;
       this.selectedRecordIds = new Set();
    }
     handleInstructions(event){
       const fileUrl = '/resource/Participant_Details_Instructions';  // Update the file URL if necessary
       window.open(fileUrl, '_blank');
    }
     handleDownloadTemplate(event){
        
        console.log('handleDownloadTemplate called');
        if(this.facilityService === 'NDIS'){
           // this.templateType === 'Client'
             // this.nonNdisFlag= false;
              const fileUrl = '/resource/Participant_Template_Download';  // Update the file URL if necessary
              window.open(fileUrl, '_blank');
        }  else {
             this.nonNdisFlag= true;
           
        }
      
    }
    handleNonNdisTemplate(event){
        if(this.selectedParticipantType==='Company' ){
            //this.templateType === 'Company'
            const fileUrl = '/resource/Participant_Template_Company';  // Update the file URL if necessary
            window.open(fileUrl, '_blank');
        } else  if(this.selectedParticipantType==='Individual'){
            // this.templateType === 'Individual'
            const fileUrl = '/resource/Participant_Template_Individual';  // Update the file URL if necessary
            window.open(fileUrl, '_blank');
        }
        this.nonNdisFlag= false; 
        this.disableDownload = true;
        this.selectedParticipantType = '';
    }

   
    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
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
    }

    // readFileContent(file) {
    //      console.log('readFileContent ');
    //     const reader = new FileReader();
    //     reader.onload = () => {
    //         const fileContent = reader.result;
    //         const parsedData = this.parseCSV(fileContent);
    //         this.tableData = parsedData;
    //        // this.setTemplateFlags();
    //         this.paginateData();
    //     };
    //     reader.onerror = () => console.error('Error reading file:', reader.error);
    //     reader.readAsText(file);
    // }
    readFileContent(file) {
        console.log('readFileContent start');
        const reader = new FileReader();

        reader.onload = () => {
            const fileContent = reader.result;
            console.log('File content loaded:', fileContent.substring(0, 200));

            // Parse CSV
            const parsedData = this.parseCSV(fileContent);
            console.log('Parsed Data:', parsedData);

            // ⭐ REMOVE DUPLICATES BY EMAIL
            const uniqueData = [];
            const emailSet = new Set();

            parsedData.forEach(row => {
                const email = (row.EmailID || row["Email ID"] || '').trim().toLowerCase();
                
                if (email && !emailSet.has(email)) {
                    emailSet.add(email);
                    uniqueData.push(row);
                }
            });

            console.log("Filtered unique rows (no duplicate EmailID):", uniqueData);

            // Save final table data
            this.tableData = uniqueData;

            // Continue pagination
            this.paginateData();
        };

        reader.onerror = () => console.error('Error reading file:', reader.error);
        reader.readAsText(file);
    }



    // parseCSV(data) {
    //       console.log('parseCSV ');
    //     const lines = data.split(/\r?\n/).filter(l => l.trim() !== '');
    //     if (!lines.length) return [];

    //     const headers = lines[0].split(',').map(h => h.trim());
    //     const lowerHeaders = headers.map(h => h.toLowerCase());

    //     // ---------------- Detect Template ----------------
    //     if (lowerHeaders.includes('companyname')) {
    //         this.templateType = 'Company';
    //     } else if (lowerHeaders.includes('firstname') && lowerHeaders.includes('lastname')) {
    //         // Could be Client or Individual
    //         this.templateType = 'Individual'; // default
    //         if (lowerHeaders.includes('primarycontactfirstname')) {
    //             this.templateType = 'Client';
    //         }
    //     } 
    //     // else {
    //     //     this.templateType = '';
    //     // }

    //     // ---------------- Validate Headers ----------------
    //     let requiredHeaders = [];
    //     switch (this.templateType) {
    //         case 'Client':
    //             requiredHeaders = this.requiredClientHeaders;
    //             break;
    //         case 'Company':
    //             requiredHeaders = this.requiredCompanyHeaders;
    //             break;
    //         case 'Individual':
    //             requiredHeaders = this.requiredIndividualHeaders;
    //             break;
    //     }

    //     const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    //     if (missingHeaders.length) {
    //         this.showToast('Error', `Missing required CSV headers: ${missingHeaders.join(', ')}`, 'error');
    //     } else {
    //         this.showToast('Success', 'CSV loaded successfully!', 'success');
    //     }
    //       console.log('templateType in csv ',this.templateType);
    //       console.log('parseCSV', JSON.stringify(this.tableData));

    //     // ---------------- Map CSV Rows ----------------
    //     return lines.slice(1).map((line, idx) => {
    //         const values = line.split(',');
    //         const obj = {};
    //         headers.forEach((header, index) => {
    //             obj[header] = values[index] ? values[index].trim() : '';
    //         });
    //         obj.isSelected = true;
    //         obj.id = idx + 1; // unique row ID for table
    //         obj.ProcessedStatus = '';
    //         return obj;
    //     });
      
    // }
    parseCSV(data) {
        console.log('parseCSV start');

        if (!data || data.trim() === '') {
            console.log('CSV data is empty');
            return [];
        }

        const lines = data.split(/\r?\n/).filter(l => l.trim() !== '');
        console.log('Lines:', lines);

        if (!lines.length) {
            console.log('No valid lines found');
            return [];
        }

        const headers = lines[0].split(',').map(h => h.trim());
        console.log('Headers:', headers);

        const lowerHeaders = headers.map(h => h.toLowerCase());
        console.log('Lowercase headers:', lowerHeaders);

        // Normalize headers: lowercase + remove spaces
        const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/\s+/g, ''));
        console.log('Normalized headers (no spaces):', normalizedHeaders);

        // ---------------- Detect Template ----------------
        if (normalizedHeaders.includes('companyname')) {
            this.templateType = 'Company';
        } else if (normalizedHeaders.includes('firstname') && normalizedHeaders.includes('lastname')) {
            this.templateType = 'Individual'; // default
            if (normalizedHeaders.includes('primarycontactfirstname')) {
                this.templateType = 'Client';
            }
        } else {
            this.templateType = '';
        }
        console.log('Detected templateType:', this.templateType);

        // ---------------- Validate Headers ----------------
        let requiredHeaders = [];
        switch (this.templateType) {
            case 'Client':
                requiredHeaders = this.requiredClientHeaders;
                break;
            case 'Company':
                requiredHeaders = this.requiredCompanyHeaders;
                break;
            case 'Individual':
                requiredHeaders = this.requiredIndividualHeaders;
                break;
        }

        // Normalize required headers
        const normalizedRequiredHeaders = requiredHeaders.map(h => h.toLowerCase().replace(/\s+/g, ''));
        
        // Check for missing headers
        const missingHeaders = normalizedRequiredHeaders.filter(
            rh => !normalizedHeaders.includes(rh)
        );

        if (missingHeaders.length) {
            this.showToast(
                'Error',
                `Missing required CSV headers: ${missingHeaders.join(', ')}`,
                'error'
            );
        } else {
            this.showToast('Success', 'CSV loaded successfully!', 'success');
        }

        // ---------------- Map CSV Rows ----------------
        return lines.slice(1).map((line, idx) => {
            const values = line.split(',');
            const obj = {};
            headers.forEach((header, index) => {
                obj[header.replace(/\s+/g, '')] = values[index] ? values[index].trim() : '';
            });
            obj.isSelected = false;
            obj.id = idx + 1; // unique row ID for table
            obj.ProcessedStatus = '';
            return obj;
        });
    }
    @track startIndex;
    @track endIndex;
    paginateData() {
        if (!this.tableData || this.tableData.length === 0) {
            this.paginatedData = [];
            this.totalRecords = 0;
            this.totalPages = 0;
            this.updatePaginationButtons();
            return;
        }

        this.totalRecords = this.tableData.length;
        this.totalPages = Math.ceil(this.totalRecords / this.recordsPerPage);

        const start = (this.pageNumber - 1) * this.recordsPerPage;
        const end = start + this.recordsPerPage;

        this.startIndex = start;
        this.endIndex = end;

        // FIXED — Compare IDs as strings
        this.paginatedData = this.tableData.slice(start, end).map(row => ({
            ...row,
            isSelected: this.selectedRecordIds.has(String(row.id))
        }));

        this.enableddisabled = this.selectedRecordIds.size === 0;

        this.updatePaginationButtons();
    }


    handleRowSelection(event) {
        const rowId = event.currentTarget.dataset.id;
        const isChecked = event.target.checked;

        if (isChecked) {
            this.selectedRecordIds.add(String(rowId));
        } else {
            this.selectedRecordIds.delete(String(rowId));
        }

        this.tableData = this.tableData.map(row => ({
            ...row,
            isSelected: this.selectedRecordIds.has(String(row.id))
        }));

        this.paginateData();

        this.enableddisabled = this.selectedRecordIds.size === 0;

        this.isAllSelected =
            this.paginatedData.length > 0 &&
            this.paginatedData.every(r => r.isSelected);
    }



    handleSelectAll(event) {
        const isChecked = event.target.checked;
    
        // Update selection in full tableData
        // this.tableData = this.tableData.map(user => ({
        //     ...user,
        //     isSelected: isChecked
        // }));
        this.paginatedData.forEach(user => {
            if (isChecked) {
                this.selectedRecordIds.add(user.id);
            } else {
                this.selectedRecordIds.delete(user.id);
            }
        });

        // Update main tableData flags
        this.tableData = this.tableData.map(user => ({
            ...user,
            isSelected: this.selectedRecordIds.has(user.id)
        }));
    
        // Refresh paginatedData
        this.paginateData();
    
        // Reverse logic: disable when at least one row is selected
        //this.enableddisabled = !isChecked;
        this.enableddisabled = this.selectedRecordIds.size === 0;
    
        console.log('isChecked ===>', isChecked);
        console.log('this.enableddisabled ===>', this.enableddisabled);
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
        if (this.pageNumber !== 1) {
            this.pageNumber = 1;
            this.paginateData();
            this.updatePaginationButtons();
        }
    }

    // Navigate to the previous page
    previousPage() {
        if (this.pageNumber > 1) {
            this.pageNumber--;
            this.paginateData();
            this.updatePaginationButtons();
        }
    }

    // Navigate to the next page
    nextPage() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber++;
            this.paginateData();
            this.updatePaginationButtons();
        }
    }

    // Navigate to the last page
    lastPage() {
        if (this.pageNumber !== this.totalPages) {
            this.pageNumber = this.totalPages;
            this.paginateData();
            this.updatePaginationButtons();
        }
    }

   
    handleFinalSubmit() {
        if (!this.tableData.length) {
            this.showToast('Error', 'No data to submit', 'error');
            return;
        }

        const selectedRecords = this.tableData.filter(r => r.isSelected);

        if (!selectedRecords.length) {
            this.showToast('Error', 'Please select at least one record', 'error');
            return;
        }

        let templateHeaders = [];
        switch (this.templateType) {
            case 'Client': templateHeaders = this.requiredClientHeaders; break;
            case 'Company': templateHeaders = this.requiredCompanyHeaders; break;
            case 'Individual': templateHeaders = this.requiredIndividualHeaders; break;
        }

        const templateFields = this.allFields.filter(f => templateHeaders.includes(f.key));

        let validRecords = [];
        let invalidRecords = [];

        selectedRecords.forEach(record => {
            const missingFields = templateFields.filter(f => !record[f.key] || record[f.key].trim() === '');

            if (missingFields.length) {
                record.ProcessedStatus =
                    `Error ❌: Missing - ${missingFields.map(f => f.label).join(', ')}`;
                invalidRecords.push(record);
            } else {
                validRecords.push(record);
            }
        });

        // Refresh UI with local errors immediately
        this.tableData = [...this.tableData];

        // Send only valid rows to Apex
        if (validRecords.length > 0) {
            this.uploadDataToApex(validRecords);
        }

        // Uncheck ALL rows after submit
        this.tableData = this.tableData.map(r => ({
            ...r,
            isSelected: false
        }));

        // Disable submit button
        this.enableddisabled = true;

        this.isProcessed = true;

        this.paginateData();
    }


    
    uploadDataToApex(unprocessedRecords) {
        createClientsOnBulk({
            templateType: this.templateType,
            records: unprocessedRecords,
            facilityId: this.facilityId
        })
        .then(result => {
            console.log("Apex result:", JSON.stringify(result));

            const { results } = result;

            this.tableData = this.tableData.map(row => {
                const match = results.find(r => this.matchRecord(r.Row, row));

                if (match) {
                    return {
                        ...row,
                        ProcessedStatus: match.Row.ProcessedStatus
                    };
                }
                return row;
            });

            this.isProcessed = true;
            this.forceTableUpdate();
        })
        .catch(error => {
            console.error("Apex Error:", error);

            this.tableData = this.tableData.map(row => ({
                ...row,
                ProcessedStatus: row.isSelected
                    ? "Error ❌: Unexpected Error"
                    : row.ProcessedStatus
            }));

            this.isProcessed = true;
            this.forceTableUpdate();
        });
    }



    matchRecord(apexRow, tableRow) {
        return (
            apexRow &&
            tableRow &&
            apexRow.id != null &&
            tableRow.id != null &&
            String(apexRow.id) === String(tableRow.id)
        );
    }


    // 🚀 Force UI to Refresh Processed Status and Pagination
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
    handleParticipantTypeChange(event) {
        this.selectedParticipantType = event.detail.value;

        // Example: handle immediate logic when user selects an option
        console.log('selectedParticipantType:', this.selectedParticipantType);

        // Optional: close modal automatically after selection
        this.disableDownload = false;
    }
    closeModal(){
         this.nonNdisFlag = false;
         this.disableDownload = true;
    }
    handleKeyShortcut(event) {
        if (event.ctrlKey && event.shiftKey && event.code === 'KeyB') {
            event.preventDefault();
            this.navigateToParticipant();
            }
        }
        
     
}