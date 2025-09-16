import { LightningElement, track, wire, api } from 'lwc';
import UpdateFileSize from '@salesforce/apex/ClientAttachmentHandler.UpdateFileSize';   
import fetchRepositoryData from '@salesforce/apex/ClientAttachmentHandler.fetchRepositoryData';
import deleteRepository from '@salesforce/apex/ClientAttachmentHandler.deleteRepository';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';  
import { RefreshEvent } from 'lightning/refresh';
import { refreshApex } from '@salesforce/apex';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import LightningConfirm from 'lightning/confirm';
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import UserType from '@salesforce/schema/User.User_Type__c';
import attachmentType from '@salesforce/schema/Attachment__c.Type__c';
//import getPrivilegeData from "@salesforce/apex/SecurityPrivilege.getPrivilegeData";
const MAX_FILE_SIZE = 100000000; //10mb  
const MIN_FILE_SIZE = 1000; //10mb  
const actions = [   
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' }
 ];
 const columns = [
    { label: 'Name', fieldName: 'Name' },
    { label: 'Type', fieldName: 'Type__c' },
    { label: 'Size', fieldName: 'Size__c' },
    { label: 'Comments', fieldName: 'Comments__c' },
    { label: 'User', fieldName: 'USer_Name__c' },
    { label: 'Date', fieldName: 'Date__c' },
    {
        type: 'action',
        typeAttributes: {
            rowActions: actions,
            menuAlignment: 'right'
        }
    }
 ];

export default class ClientAttachment extends LightningElement {
    // JS Properties 
    @api clientId;
    @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
    @track records = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number    
    @track recordsToDisplay = []; //Records to be displayed on the page
    @track recordId;
    @track isOpenModal=false; 
    @track isattachError=false;
    @track data;
    @track columns = columns;
    @track isEdit=false;
    @track isFileAttached=false
    @track selectedFilesToUpload = []; //store selected files
    @track showSpinner = false; //used for when to show spinner
   // @track fileName;
    @track doc;
    @track fileSize;
    @track UpdateDetails = false;
    @track tempConList = [];
    @track timeoutId;
    @track noRecordsFlag=false;
    @track successmessage;
    file; //holding file instance
    myFile;    
    fileType;//holding file type
    fileReaderObj;
    base64FileData;
    @track editFlag=false;;
    @track deleteFlag=false;
    @track viewFlag=false;  
    wiredSecurityResult;
    @track finalSecurityResult=[];
    @track textboxFlag = false;
    @track currentUserId = Id;
    @track isHome = true;
    @track fieldErrorMap = {};
    @track isFileExpand = false;
     @track uploadedFiles = [];
    fileName = '';
    @track downloadLinks = [];
    @track isFileExpand = false;
    
   
    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }  
   
    connectedCallback() {        
        this.fetchReplist();
    }

    changeExpense(event){        
        if (event.detail.value == 'Other') {
            this.textboxFlag = true;
        } else{
            this.textboxFlag = false;
        } 
    }

    fetchReplist(){  
        fetchRepositoryData({clientId:this.clientId}).then(result=>{
            if (result != null) {  
                this.data = [];    
                this.records = [];  
                this.tempConList = [];  
              //  console.log('attchments data '+(this.data))               
                result.forEach((record) => {                    
                    let tempConRec = Object.assign({}, record);
                    tempConRec.Name = record.Name;
                    tempConRec.type = record.Type__c;
                    tempConRec.comment = record.Comments__c;
                    tempConRec.UserName = record.USer_Name__c;
                    tempConRec.Date = record.Date_Format__c;
                    tempConRec.AmazonURL = record.Amazon_file_URL__c;
                  /*   tempConRec.fileName =this.getFileName(record.Amazon_file_URL__c) ;
                    console.log('file name '+ tempConRec.fileName); */
                    tempConRec.fileSize = this.formatFileSize(parseInt(record.Size__c));
                    this.tempConList.push(tempConRec);
                })                
                this.records = this.tempConList;
                this.totalRecords = this.tempConList.length; // update total records count                 
                this.pageSize = this.pageSizeOptions[0]; //set pageSize with default value as first option
                this.pageNumber = 1;
                //refreshApex(this.records);                
                this.paginationHelper(); // call helper menthod to update pagination logic                 
            }
        }).catch(error=>{
            this.records = undefined; 
            this.error = error;
        })          
    }

    @track isOrgName;
    @track currentUserRole;
    @track isStaff=false;
   // @track attachType;
    @wire(getRecord, { recordId: Id, fields: [UsrRoleName,UserType]}) 
    currentUserInfo({error, data}) { 
        if (data) {
            this.currentUserRole =data.fields.User_Role__c.value;
            this.userType = data.fields.User_Type__c.value;
            this.userType = data.fields.User_Type__c.value;
            //this.attachmentType = data.fields.Type__c.value;
            
            console.log('current logged in user==>'+this.currentUserRole);
            if(this.currentUserRole =='Portal Account Partner Executive' || this.currentUserRole =='CEO' || this.currentUserRole =='Admin' ||this.currentUserRole =='Portal Account Partner Manager'){
                this.isStaff = true;
            } else if(this.currentUserRole =='Portal Account Partner User'){
                this.isStaff = false;
            } 
        } else if (error) {
            this.usererror = error ;
        }
    }
     

    RefreshAttachmentsData(event)
    {
        this.fetchReplist();        
    }

    handleAttachment(){
        this.fieldErrorMap ={};
        this.successmessage='Attachment created successfully.';
        this.isOpenModal=true;
        this.isEdit=false;
        this.UpdateDetails = false;
        this.fileName='';
    }

    onFileUpload(event) {
        this.isattachError=false;
        this.isFileAttached=true;
        this.isEdit=false;
      //  console.log('in files upload',event.target.files.length);
        if (event.target.files.length > 0) {
            this.showSpinner = true;
            this.selectedFilesToUpload = event.target.files;      
            this.file = this.selectedFilesToUpload[0];
            this.fileName = this.selectedFilesToUpload[0].name.split(" ").join("");
            this.fileType = this.selectedFilesToUpload[0].type;
            this.fileSize = this.selectedFilesToUpload[0].size;     
            
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
        this.showSpinner = false;
      //  console.log('fileName>>',typeof(JSON.stringify(event.target.files) ));
    }    

    handleSubmit(event){
       // console.log('onsubmit event recordEditForm'+ event.detail.fields);
      //  console.log('file chk>>',this.isFileAttached);
      event.preventDefault();
        if (this.isEdit == true){
            this.UpdateDetails = true;            
        }
        else{
            this.UpdateDetails = false;                  
        }

        if(!(this.isFileAttached) && !(this.isEdit)){     
            this.dispatchEvent(  
                new ShowToastEvent({
                title: 'Error',
                variant: 'error',  
                message: 'Upload file is mandatory.',  
                }),  
            );
            return;
        }else{
            event.preventDefault();
            const fields=event.detail.fields;
            fields.Added_By__c=this.clientId;
           /*  fields.UploadFile_Result__c = JSON.stringify(this.uploadedFiles);
            fields.Amazon_file_URL__c = this.downloadLinks[0]; */
            this.template.querySelector('lightning-record-edit-form').submit(fields);
            console.log('Attachment data : '+JSON.stringify(fields));          
        }        
        this.isOpenModal=false;      
        this.isEdit=false;
    }    

    handleSuccess(event){
       // console.log(this.isEdit);
       // console.log('base64>> ',this.base64FileData);
        this.recordId = event.detail.id;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success!!',
                message: this.successmessage,
                variant: 'success',
            }),
        ); 
        if(this.UpdateDetails == false){
            UpdateFileSize({clientId : this.recordId, filesize: this.fileSize})
            .then(fileresult =>{
               // console.log('Updated file size = ' +fileresult);
            })
            .catch(error => {
               // window.console.log(error);
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error in uploading File',
                            message: error.message,
                            variant: 'error',
                        }),
                    );
            })
           // console.log('in is edit false'); 
            this.showSpinner = true;
            //Uploading files to AWS S3 bucket
           /*  uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId:this.recordId,obj:'attach'})
            .then(result => {
               // console.log('Upload result = ' +result);
                this.fileName = this.fileName + ' - Uploaded Successfully';                
                this.showSpinner = false;                
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success!!',
                        message: this.file.name + ' - Uploaded Successfully!!!',
                        variant: 'success',
                    }),
                );
            })
            .catch(error => {
                // Error to show during upload
               // window.console.log(error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error in uploading File',
                        message: error.message,
                        variant: 'error',
                    }),
                );
                this.showSpinner = false;
            });    */         
        }
        this.isOpenModal=false;
        this.isEdit=false;        
        this.showSpinner = false;  
        
        this.fetchReplist();
    }

  /*   handleError(event){    
        alert(JSON.stringify(event.detail));
        this.showToast(event.detail.detail); 
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
       
     
    // 4. Show all errors as a toast
     this.dispatchEvent(
        new ShowToastEvent({
            title: 'Update Failed',
            message: message,
            variant: 'error',
           
        })
    ); 
}


    showToast(msg){
        const event = new ShowToastEvent({
            title: 'Error',
            message: msg,
            variant: 'Error',
            mode: 'dismissable'
        });
        this.dispatchEvent(event);
    }

    hideModalBox(){
        this.isOpenModal=false; 
        this.isEdit=false;  
        this.isFileAttached=false;      
    }

    handleEdit(event)    {        
        this.isEdit=true;
        this.successmessage='Attachment updated successfully.';
        this.isFileAttached=false;
        this.recordId = event.currentTarget.dataset.id;
       // console.log('Edit', this.recordId);     
    }
    @track deleteFlag =false;
     handleDelete(event){
        this.recordId = event.currentTarget.dataset.id;
        this.deleteFlag= true;
        /* const result = await LightningConfirm.open({
            message: 'Are you sure you want to delete this file?',
            variant: 'header',
            label: 'Please Confirm',
            theme: 'Warning',
        }); 
        if(result){ */
           // console.log('Delete', this.recordId);        
           /*  this.delRep(this.recordId);  
            this.fetchReplist();  */
       /*  }  */
    }
    handledeletefile(){
        this.delRep(this.recordId);  
            this.fetchReplist(); 
            this.deleteFlag= false;
    }
    handleclose(){
        this.deleteFlag= false;
    }

    handleRowActions(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        this.clientId = row.Id;
        switch (actionName) {        
            case 'edit':          
                this.isEdit=true;
                break;
            case 'delete':
                this.delRep(row);
                break;
        }
    }    

    delRep(currentRow) {
        deleteRepository({ repData: currentRow }).then(result => {
           // window.console.log('result^^' + result);
            this.showLoadingSpinner = false;
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success!!',
                message: 'Attachment deleted successfully!!.',
                variant: 'success'
            }));            
        }).catch(error => {
           // window.console.log('Error ====> ' + error);
            this.showLoadingSpinner = false;
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error!!',
                message: JSON.stringify(error),
                variant: 'error'
            }));            
        });    
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
    get userClass() {
        return this.getFieldClass('User__c');
    }

    //Pagination code start
    handleRecordsPerPage(event) {        
        this.pageSize = event.target.value;        
        this.paginationHelper();
    }

    previousPage() {
        this.pageNumber = this.pageNumber - 1;
        this.paginationHelper();
    }

    nextPage() {
        this.pageNumber = this.pageNumber + 1;
        this.paginationHelper();
    }

    firstPage() {
        this.pageNumber = 1;
        this.paginationHelper();
    }

    lastPage() {
        this.pageNumber = this.totalPages;
        this.paginationHelper();
    }

    // JS function to handel pagination logic 
    paginationHelper() {
        this.data = [];
        if(this.totalRecords>0) {
                                 this.noRecordsFlag=false;
                             }else{
                                 this.noRecordsFlag=true;
                             } 
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        // set page number 
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
        // set records to display on current page
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
                break;
            }
            this.data.push(this.records[i]);
        } 
        refreshApex(this.data);
    }

    formatFileSize(bytes) {        
        var marker = 1024; // Change to 1000 if required
        var decimal = 2; // Change as required
        var kiloBytes = marker; // One Kilobyte is 1024 bytes
        var megaBytes = marker * marker; // One MB is 1024 KB
        var gigaBytes = marker * marker * marker; // One GB is 1024 MB
        
        if(bytes < gigaBytes) return(bytes / megaBytes).toFixed(decimal) + " MB";
    }

    @track isModalOpen = false;
    @track currentUrl;

    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
        console.log('url '+this.currentUrl);

        this.isModalOpen = true;
        this.isHome = false;
        const fileType = this.getFileType(this.currentUrl);
        
        //console.log('file type: ' + fileType);
        // Check if the file type is not PNG or PDF
         if (fileType !== 'png' && fileType !== 'pdf' && fileType !== 'jpeg' && fileType !== 'csv' && fileType !== 'svg' && fileType !== 'jpg' && fileType !== 'gif' && fileType !== 'bmp' && fileType !== 'tiff') {
            setTimeout(() => {
                this.closeModal();
            }, 1700);
            
        }  
    }

    closeModal() {
        this.isModalOpen = false;
        this.currentUrl = null;
        this.isHome = true;
    }
    
    getFileType(url) {
        const fileName = url.substring(url.lastIndexOf('/') + 1);
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }
  /*   triggerFileInput() {
        this.template.querySelector('input[type="file"]').click();
    } */

    // code regarding upload file
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
     handleFileUploadInputChange(event) {
        console.log('handleFileUploadInputChange called ');
       
        const files = Array.from(event.target.files || []);
         if (!files.length) return;
        // this.isFileExpand = true;
        // if (!files.length) {
        //     this.isFileExpand = false; // Optional, if you want to collapse the panel
        //     return;
        // } else {
        //     this.isFileExpand = true;
        // }
        setTimeout(() => {
            this.isFileExpand = true;

            // Now child will definitely be rendered — wait for that
            setTimeout(() => {
                const svc = this.template.querySelector('c-document-office-service');
                if (!svc) {
                    console.warn('⚠️ No <c-document-office-service> component found.');
                    return;
                }

                svc.incomingFiles = files;
                //event.target.value = '';
            }, 1000);
        }, 0); // delay can be adjusted if needed
        
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

            console.log('All URLs:', urls);
            console.log('All names:', names);
            console.log('All types:', types);
            console.log('All s3 keys:', s3Keys);

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

            //const cellId = ctx;

            // Update tableRows
            // this.tableRows = this.tableRows.map((row) => ({
            // ...row,
            // cells: row.cells.map((cell) => {
            //     if (cell.id === cellId) {
            //     const updatedCell = {
            //         ...cell,
            //         field: {
            //         ...cell.field,
            //         value: valueForField,                // ✅ all file URLs
            //         downloadLink: urls,                  // keep as array too
            //         fileName: names.join(', '),          // display-friendly
            //         contentType: files.length === 1 ? (types[0] || null) : 'multiple',
            //         s3Key: s3Keys,                       // array of keys
            //         urls,                                // alias for clarity
            //         meta: metaPayload                    // ✅ full payload in meta
            //         }
            //     };
            //     console.log('Updated cell in tableRows:', { cellId, updatedField: updatedCell.field });
            //     return updatedCell;
            //     }
            //     return cell;
            // })
            // }));

            // // Update stepPagedRows
            // this.stepPagedRows = this.stepPagedRows.map((page) =>
            // page.map((row) => ({
            //     ...row,
            //     cells: row.cells.map((cell) => {
            //     if (cell.id === cellId) {
            //         const updatedCell = {
            //         ...cell,
            //         field: {
            //             ...cell.field,
            //             value: valueForField,
            //             downloadLink: urls,
            //             fileName: names.join(', '),
            //             contentType: files.length === 1 ? (types[0] || null) : 'multiple',
            //             s3Key: s3Keys,
            //             urls,
            //             meta: metaPayload
            //         }
            //         };
            //         console.log('Updated cell in stepPagedRows:', { cellId, updatedField: updatedCell.field });
            //         return updatedCell;
            //     }
            //     return cell;
            //     })
            // }))
            // );

            // Clear the input so the same file can be selected again
            this.uploadedFiles = files;
            this.fileName = names.join(', ');
            this.downloadLinks = urls;
           // this.showSpinner = false;
            console.log(' Files in last  : ',  files);
            console.log(' this.uploadedFiles  : ',  JSON.stringify(this.uploadedFiles));
            console.log(' this.downloadLinks : ',  JSON.stringify(this.downloadLinks));
            this.isFileAttached=true;
            console.groupEnd();
        } catch (e) {
            console.error('[AWS Upload Complete] handler error:', e);
        }
    }
     handleFileDeleted(event) {
        console.group('handleFileDeleted called ');
        const { key, fileId ,files} = event.detail;
        console.log('File deleted in child. Key:', key, 'FileId:', fileId, 'files:',JSON.stringify(files) );

        // Example: remove it from parent's tracking
        this.uploadedFiles = this.uploadedFiles.filter(f => f.fileId !== fileId);
        console.log(' this.uploadedFiles in handleFileDeleted: ',  JSON.stringify(this.uploadedFiles));
        // if (!this.uploadedFiles || this.uploadedFiles.length === 0) {
        //    this.isFileExpand = false;
        // }
        if (!files || files.length === 0) {
           this.isFileExpand = false;
        }
    }
}