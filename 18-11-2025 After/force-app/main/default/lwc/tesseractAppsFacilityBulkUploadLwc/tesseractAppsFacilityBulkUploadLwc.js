import { LightningElement, track, wire, api } from "lwc";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createFacilityOnBulk from '@salesforce/apex/FacilityController.createFacilityOnBulk';
//import getfacilityById from '@salesforce/apex/FacilityController.getfacilityById';

export default class TesseractAppsFacilityBulkUploadLwc extends LightningElement {

    @track bulkUploadHomePage= true;
    @track uploadBtnContainer= true;
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
    @track selectedRecordIds = new Set();
    @track disableDownload= true;
    @track showModal= false;
    @track selectedABNOption = '';
    
    connectedCallback() {
        this.enableddisabled = true;
        //this.loadPaginatedData();
        // const storedFacilityId = localStorage.getItem('defaultFacilityId');
        // const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');
        // this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "Participant";
        // this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Facility";
        // // this.staffPreferredName = localStorage.getItem("defaultstaffPreferredName") || "Staff";
        // console.log('localStorage.getItem("defaultParticipantPreferredName") >>', localStorage.getItem("defaultParticipantPreferredName"));
        // console.log('localStorage.getItem("defaultFacilityPreferredName") >>', localStorage.getItem("defaultFacilityPreferredName"));
        
        // console.log('fetched',this.participantPreferredName);
        // console.log('fetched',this.facilityPreferredName);
        // // this.fetchOrgDetails();
        // console.log('storedFacilityId'+storedFacilityId);
        // console.log('storedFacilityLabel'+storedFacilityLabel);
        // this.facilityId=storedFacilityId;
        
        // window.addEventListener('keydown', this.handleKeyShortcut.bind(this));
        
        // if (storedFacilityId) {
        //         // Call Apex to get facility details
        //         getfacilityById({ facId: storedFacilityId })
        //             .then(result => {
        //                 console.log('Facility Record:', result);
        //                 this.facilityService = result.Type_of_Service__c || '';
        //                 console.log('  this.facilityService :',   this.facilityService );  
        //             })
        //             .catch(error => {
        //                 console.error('Error fetching facility:', error);
        //             });
        //     }
        //     this.paginateData();
        //     this.updatePaginationButtons();
    }
    disconnectedCallback() {
            window.removeEventListener('keydown', this.handleKeyShortcut.bind(this));
    }
      handleDownloadTemplate(event){
        const fileUrl = '/resource/Facility_Details_Template';  // Update the file URL if necessary
        window.open(fileUrl, '_blank');

        //this.showModal = true;

    }

    handleCloseModal(event){
        this.showModal = false;
    }

    handleConfirmReset(event){

        if(this.selectedABNOption == 'individualABN'){
            this.showModal = false;
            const fileUrl = '/resource/Facility_Details_Template_Individual';  // Update the file URL if necessary
            window.open(fileUrl, '_blank');
        }

        if(this.selectedABNOption == 'orgABN'){
            this.showModal = false;
            const fileUrl = '/resource/Facility_Details_Template_Org';  // Update the file URL if necessary
            window.open(fileUrl, '_blank');
        }
        
    }

    handleABNChange(event) {
        this.selectedABNOption = event.target.value;
        console.log('Selected ABN Option:', this.selectedABNOption);
    }


    handleInstructions(event){
        // console.log('type of user: ',this.typeOfUser);
        
        const fileUrl = '/resource/Facility_Instructions_Bulk';  // Update the file URL if necessary
        window.open(fileUrl, '_blank');
    }
    
    navigateToFacility() {
        this.isProcessed = false;
        
        console.log("Hello from Facility bulk upload .");

        const customEvent = new CustomEvent("facilityeventfrombulk", {
        detail: { message: "Hello from Facility bulk upload!" }
        });
        this.dispatchEvent(customEvent);
    }

    cancleTable() {
        this.uploadBtnContainer= true;
        this.tableData=[]
        // this.isAllSelected= false;
        this.isProcessed = false;
        this.selectedRecordIds = new Set();
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

   
    readFileContent(file) {
         console.log('readFileContent ');
        const reader = new FileReader();
        reader.onload = () => {
            const fileContent = reader.result;
            //console.log('File Content:', JSON.stringify(fileContent));
            
            // Parse CSV data
            const parsedData = this.parseCSV(fileContent);
            //console.log('Parsed Data:', parsedData.length);

            // Update data table
            this.tableData = parsedData;
            this.paginateData();
        };
        reader.onerror = () => {
            console.error('Error reading file:', reader.error);
        };
    
        reader.readAsText(file); // Read the file as text (for CSV files)
        
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
         this.paginatedData = this.tableData.slice(startIndex, endIndex).map(user => ({
            ...user,
            isSelected: this.selectedRecordIds.has(user.id)
        }));
        this.totalPages = Math.ceil(this.totalRecords / this.recordsPerPage);
      //  this.enableddisabled = true;

        this.enableddisabled = this.selectedRecordIds.size === 0;
        this.isAllSelected =
            this.paginatedData.length > 0 &&
            this.paginatedData.every(u => u.isSelected);

        this.updatePaginationButtons();
    
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
        const headerRow = rows[0].split(',').map(header => header.trim());
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

        // ✅ 5. Check for missing required headers
        const requiredHeaders = [
            'FacilityName', 'ContactNumber', 'ManagerName', 'EmailID', 'ABN',
            'UseOrgABN', 'TypeofService', 'Services', 'Role',
            'AddressStreet', 'AddressCity', 'AddressState', 'AdressPostCode', 'AddressCountry'
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

            // Handle quoted CSV values
            const rowValues = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < row.length; i++) {
                const char = row[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    rowValues.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            rowValues.push(current.trim());

            const isMeaningful = rowValues.some(val => val && val.replace(/[`"']/g, '').trim() !== '');
            if (!isMeaningful) return;

            const rowObject = { id: baseTimestamp + index };

            headerRow.forEach((header, i) => {
                const trimmedHeader = header.replace(/ /g, '');
                let cellValue = rowValues[i] !== undefined ? rowValues[i].trim() : '';
                if (trimmedHeader === 'Services' && cellValue.includes(',')) {
                    // Replace comma with semicolon in case user accidentally used commas
                    cellValue = cellValue.replace(/,/g, ';');
                }
                rowObject[trimmedHeader] = cellValue;
            });

            parsedData.push(rowObject);
        });

        // ✅ 7. Post-parse validation: ABN requirement rule
        for (const [index, record] of parsedData.entries()) {
            const useOrgABN = record.UseOrgABN?.toString().toLowerCase();
            const abn = record.ABN?.trim();

            // If UseOrgABN is not 'yes' or 'true', ABN is required
            if (useOrgABN !== 'yes' && useOrgABN !== 'true' && !abn) {
                this.uploadBtnContainer = true;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Missing ABN',
                        message: `Row ${index + 2}: ABN is required when "UseOrgABN" is not 'Yes' or 'True'.`,
                        variant: 'error',
                        mode: 'sticky'
                    })
                );
                return [];
            }
        }

        console.log('Parsed Data:', JSON.stringify(parsedData));
        return parsedData;
    }


  @track selectedRecordIds = new Set();
    handleRowSelection(event) {
        const userId = Number(event.currentTarget.dataset.id);
        const isChecked = event.target.checked;
    
        if (!userId) {
            console.error('User ID is undefined');
            return;
        }
        if (isChecked) {
            this.selectedRecordIds.add(userId);
        } else {
            this.selectedRecordIds.delete(userId);
        }
    
        // Update main tableData instead of just paginatedData
        // this.tableData = this.tableData.map(user =>
        //     user.id === userId ? { ...user, isSelected: isChecked } : user
        // );
         this.tableData = this.tableData.map(user => ({
            ...user,
            isSelected: this.selectedRecordIds.has(user.id)
        }));
    
        // Ensure paginatedData reflects the change
        this.paginateData();
    
        // Check if all rows on the current page are selected
       // this.isAllSelected = this.paginatedData.every(user => user.isSelected);
    
        // Reverse logic: disable when at least one row is selected
        //this.enableddisabled = !this.tableData.some(user => user.isSelected);
         this.enableddisabled = this.selectedRecordIds.size === 0;
        this.isAllSelected =
                this.paginatedData.length > 0 &&
                this.paginatedData.every(user => user.isSelected);
    
        console.log('this.isAllSelected ===> ' + this.isAllSelected);
        console.log('this.enableddisabled ===> ' + this.enableddisabled);
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
       // this.enableddisabled = !isChecked;
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

    handleFinalSubmit() {
         console.log('Table data before processing:', JSON.stringify(this.tableData));
 
         const selectedRecords = this.tableData.filter(user => user.isSelected);
         let validRecords = [];
         let hasInvalidRecords = false;
 
         const unprocessedRecords = selectedRecords.filter(user => user.ProcessedStatus !== 'Success ✅');
 
         // Required field list with friendly names
         const requiredFields = [
            { key: 'FacilityName', label: 'Facility Name' },
            { key: 'ContactNumber', label: 'Contact Number' },
            { key: 'ManagerName', label: 'Manager Name' },
            { key: 'EmailID', label: 'Email ID' },
            { key: 'UseOrgABN', label: 'Use Org ABN' },
            { key: 'TypeofService', label: 'Type of Service' },
            { key: 'Services', label: 'Services' },
            { key: 'Role', label: 'Role' },
            { key: 'AddressStreet', label: 'Address Street' },
            { key: 'AddressCity', label: 'Address City' },
            { key: 'AddressState', label: 'Address State' },
            { key: 'AdressPostCode', label: 'Address Post Code' },
            { key: 'AddressCountry', label: 'Address Country' }
         ];
 
         // Update records with error if fields are missing
         this.tableData = this.tableData.map(user => {
             if (user.isSelected && user.ProcessedStatus !== 'Success ✅') {
                 const missingFields = requiredFields
                     .filter(field => !user[field.key])
                     .map(field => field.label);
 
                 if (missingFields.length > 0) {
                     hasInvalidRecords = true;
                     const name = `${user.FacilityName || ''}`;
                     const message = `Missing required fields for ${name}: ${missingFields.join(', ')}`;
                     this.showToast('Error ', message, 'error');
                     return { ...user, ProcessedStatus: 'Error ❌: Missing Required Fields' };
                 }
             }
             return user;
         });
 
         try {
             //validRecords = unprocessedRecords
             //    .filter(user => {
                let tempValidRecords = unprocessedRecords.filter(user => {
                     return requiredFields.every(field => !!user[field.key]);
                 })
                 .map(user => {
                    
                     const name = `${user.FacilityName  || ''}`;
 
                     return {
                         ...user
                        //  DateofBirth: formattedDOB,
                        //  StartDate: formattedStart
                     };
                 });
                const emailMap = new Map();
            const duplicateEmails = [];
            validRecords = [];

            tempValidRecords.forEach(user => {
                const email = user.EmailID.trim().toLowerCase();
                if (emailMap.has(email)) {
                    duplicateEmails.push(email);
                    // mark duplicate in table
                    // this.tableData = this.tableData.map(u => {
                    //     if (u.EmailID.trim().toLowerCase() === email && u.isSelected) {
                    //         return { ...u, ProcessedStatus: 'Error ❌: Duplicate Email' };
                    //     }
                    //     return u;
                    // });
                } else {
                    emailMap.set(email, true);
                    validRecords.push(user);
                }
            });

            if (duplicateEmails.length > 0) {
                this.showToast('Error', `Duplicate emails found: ${duplicateEmails.join(', ')}`, 'error');
            }

 
             if (validRecords.length > 0) {
                 console.log('Submitting Records:', JSON.stringify(validRecords));
                 this.uploadDataToApex(validRecords);
             }
 
         } catch (error) {
             console.error('Submission failed:', error.message);
             this.showToast('Error', error.message, 'error');
         }
 
         this.forceTableUpdate(); // UI refresh
    }
     
    uploadDataToApex(formattedRecords) {
        console.log('formattedRecords:', JSON.stringify(formattedRecords));
        console.log('this.tableData after formattedRecords:', JSON.stringify(this.tableData));
          
        createFacilityOnBulk({ records: formattedRecords })
            .then(result => {
                console.log('result:', JSON.stringify(result));
                const { successRecords, failedRecords } = result;
                console.log('Successful Records:', JSON.stringify(successRecords));
                console.log('Failed Records:', JSON.stringify(failedRecords));
    
                // Update tableData with success or failure messages
                // this.tableData = this.tableData.map(user => {
                //     if (user.isSelected !== true) {
                //         // If not selected, reset ProcessedStatus
                //         return { ...user, ProcessedStatus: '' };
                //     }
                //     let successRecord = successRecords.find(record => 
                //         record.EmailID.trim().toLowerCase() === user.EmailID.trim().toLowerCase() && user.isSelected === true
                //         // record.EmailID?.trim().toLowerCase() === user.EmailID?.trim().toLowerCase() &&
                //         // record.Name?.trim().toLowerCase() === user.FacilityName?.trim().toLowerCase() &&
                //         // user.isSelected === true
                //                          );
                //     let failedRecord = failedRecords.find(record => 
                //         record.EmailID.trim().toLowerCase() === user.EmailID.trim().toLowerCase() && user.isSelected === true
                //         // record.EmailID?.trim().toLowerCase() === user.EmailID?.trim().toLowerCase() &&
                //         // record.Name?.trim().toLowerCase() === user.FacilityName?.trim().toLowerCase() &&
                //         // user.isSelected === true
                //                         );
    
                //     // if (successRecord) {
                //     //     if(user.isSelected == true){
                //     //         user.isSelected = false;
                //     //         return { ...user, ProcessedStatus: 'Success ✅' };
                //     //     } else{
                //     //          return { ...user, ProcessedStatus: '' };
                //     //     }
                        
                //     // } else if (failedRecord) {
                //     //     console.log('failedRecord.ErrorMessage : ',failedRecord.ErrorMessage);
                //     //     if(user.isSelected == true){
                          
                //     //          return { ...user, ProcessedStatus: `Error ❌: ${failedRecord.ErrorMessage}` };
                //     //     } else{
                //     //          return { ...user, ProcessedStatus: '' };
                //     //     }
                //     //     //return { ...user, ProcessedStatus: `Error ❌: ${failedRecord.ErrorMessage}` };
                //     // }
                //       if (successRecord) {
                //         user.isSelected = false;
                //        //return { ...user, ProcessedStatus: 'Success ✅' };
                //         return {
                //             ...user,
                //             ProcessedStatus: user.isSelected ? 'Success ✅' : ''
                //         };
                //     } else if (failedRecord) {
                //         console.log('failedRecord.ErrorMessage : ',failedRecord.ErrorMessage);
                //         //return { ...user, ProcessedStatus: `Error ❌: ${failedRecord.ErrorMessage}` };
                //         return {
                //             ...user,
                //             ProcessedStatus: user.isSelected ? `Error ❌: ${failedRecord.ErrorMessage}` : ''
                //         };
                //     }

                //      return user;
                //     //return { ...user, ProcessedStatus: '' };
                // });
                this.tableData = this.tableData.map(user => {
                    let successRecord = successRecords.find(record => 
                        record.EmailID?.trim().toLowerCase() === user.EmailID?.trim().toLowerCase() &&
                        record.FacilityName?.trim().toLowerCase() === user.FacilityName?.trim().toLowerCase()
                    );

                    let failedRecord = failedRecords.find(record => 
                        record.EmailID?.trim().toLowerCase() === user.EmailID?.trim().toLowerCase() &&
                        record.FacilityName?.trim().toLowerCase() === user.FacilityName?.trim().toLowerCase()
                    );

                    if (successRecord && user.isSelected) {
                        return { ...user, ProcessedStatus: 'Success ✅', isSelected: false };
                    } else if (failedRecord && user.isSelected) {
                        return { ...user, ProcessedStatus: `Error ❌: ${failedRecord.ErrorMessage}`, isSelected: false };
                    } else if (!successRecord && user.isSelected) {
                         return { ...user, ProcessedStatus: '', isSelected: false };
                    }
                    return user;
                });
    
                this.isProcessed = true;  // Make "Processed Status" column visible
                this.forceTableUpdate();  // Refresh UI and pagination
            })
            .catch(error => {
                console.error('Error in Apex method:', error);
                // Mark all selected records with a general error
                this.tableData = this.tableData.map(user => ({
                    ...user,
                    ProcessedStatus: user.isSelected ? 'Error ❌: Unexpected Processing Error' : user.ProcessedStatus
                }));
                this.isProcessed = true;
                this.forceTableUpdate();
            });
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
         handleClosePopup() {
            this.isErrorPopupVisible = false;
            this.errorMessage = '';  // Clear the error message
        }   
            
}