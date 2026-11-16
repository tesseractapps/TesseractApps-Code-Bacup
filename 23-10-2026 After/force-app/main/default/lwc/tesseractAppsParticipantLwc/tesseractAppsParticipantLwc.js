import { LightningElement, track, wire } from 'lwc';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import CLIENT_OBJECT from '@salesforce/schema/Client__c';
import GENDER_FIELD from '@salesforce/schema/Client__c.Gendar__c';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class TesseractAppsParticipantLwc extends LightningElement {
    @track organisationId;
    @track stateOptions=[];
    @track recordTypeId;
    @track genderOptions=[];
    @track facilityOptions=[];
    @track OrgNisationRoles=[];
    @track typeofuserOptions=[];
    @track FrequencyOptions=[];    
    @track Residency_statusOptions=[];    
    @track staffdetailsflag = true;
    @track fileName;
    @track doc;
    @track fileSize;
    @track file; //holding file instance
    @track myFile;    
    @track fileType;//holding file type
    @track fileReaderObj;
    @track base64FileData; 
    @track isIctUser=false;
    @track sectionFlags = {
        PartcipantDetails: true,
        Addressdetails: false,
        IdentificationDetails: false,
        InsuranceDetails: false,
        PrimaryContactDetails: false,
        SecondaryContactDetails: false,       
    };
    
    // Icons for the toggle buttons
    @track sectionIcons = {
        ParticipantDetails: '\u2B9F', 
        Addressdetails: '\u2B9C',
        IdentificationDetails: '\u2B9C',
        InsuranceDetails: '\u2B9C',
        PrimaryContactDetails: '\u2B9C',
        SecondaryContactDetails: '\u2B9C',        
    };
    
    @track clientData = {
        firstName:null,
        lastName: null,
        gender: null,
        contactNumber: null,
        driversLicence: null,
        dateOfBirth: null,
        emailAddress: null,
        status: false,
        facility: null,
        fileName:null,
    };
    @track address = {
        street:null,
        citySuburb:null,
        country:null,
        provinceState:null,
        postalcode:null
    };

    @wire(getObjectInfo, { objectApiName: CLIENT_OBJECT })
    handleObjectInfo({ data, error }) {
        if (data) {
            this.recordTypeId = data.defaultRecordTypeId; // Dynamically fetch the default record type
        } else if (error) {
            console.error(error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: '$recordTypeId', fieldApiName: GENDER_FIELD })
    handleGenderPicklistValues({ data, error }) {
        if (data) {
            this.genderOptions = data.values.map(item => ({
            label: item.label,
            value: item.value
            }));
        } else if (error) {
        console.error(error);
        }
    }

    onFileUpload(event) {        
        this.isattachError=false;
        if (event.target.files.length > 0) {
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
        console.log('fileName>>',this.fileName);
        console.log('file prepared');
    }

    toastMessage(tittle, message, variant){
        const toastEvent = new ShowToastEvent({
            title: tittle,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(toastEvent);
    }
}