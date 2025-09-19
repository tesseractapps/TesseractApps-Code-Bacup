import { LightningElement, api, track, wire } from 'lwc';
import listOfClientjounel from '@salesforce/apex/ParticipantDetailsHandler.listOfClientjounel';
import saveDesc from '@salesforce/apex/ParticipantDetailsHandler.saveDesc';
import communityPage from '@salesforce/apex/ParticipantDetailsHandler.communityPage';
import { refreshApex } from '@salesforce/apex';
import { getRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import NAME_FIELD from '@salesforce/schema/User.Name';
import { NavigationMixin } from 'lightning/navigation';
import My_Resource from "@salesforce/resourceUrl/myResource";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getClientById from '@salesforce/apex/ClientDataController.getClientById';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import UserType from '@salesforce/schema/User.User_Type__c'; 

export default class DetailsLwc extends NavigationMixin(LightningElement) {
    @api recordId;
    @api state;
    @api riskindexdetailsfromparent={}
    @track ClientJournel = true;    
    @track addNew = false;
    @track createTask = false;
    @track detailsFlag = false;
    @track serviceSupportFlag = false;
    @track journelDescription = false;  
    @track journelProgress = false;  
    @track objectApiName = 'Client__c';
    @track clientJournelList = [];
    @track iscreateNew = false;
    @track editJournel=false;
    @track jounelId;
    @track jNoteType;
    @track NoteType;
    @track name;
    @track isVisible=true;
    @track fundTranfer=false;
    @track attachment=false;
    @track Formsflag=false;
    @track feedback=false;
    @track scheduleFlag=false;
    @track ParticipantAvailabiltyFlag = false;
    @track servicerecordId;
    @track clientId;
    @track photo;
    @track CareNotes;
    @track ProgressNotes;
    @track SpecialInstructions;
    Search = My_Resource+'/myResource/images/Participants.svg';
    primary = My_Resource + '/myResource/images/Primary.svg';
    secondary = My_Resource + '/myResource/images/Secondary.svg';
    @track currentUserRole;
    @track error;
    @track isExec=false;
    @track notesflag=false;
    @track buttonlabel='Save';
    @track isManager=false;
    @track isStaff=false;
    @track communityurl
    @track clientData=[];
    @track participantlogin = false;
    @track userTypeValue;
    @track isFeedback = false;
    @track clientName;
    wiredClientResult;
    @track description='';
    isListening = false; 
    showMuteIcon = false; 
    showClearIcon = false; 
    recognition; 
    @track addressdata;
    admin = My_Resource + '/myResource/images/admin.svg';
    Search = My_Resource+'/myResource/images/Participants.svg';
    infoicon = My_Resource + '/myResource/images/Info_Icon.png';
    infoiconhover = My_Resource + '/myResource/images/Info_Icon_Hover.png';
    @track image;
    @track riskFlag = false;

    //@track services;
 
    @wire(getRecord, {
        recordId: USER_ID,
        fields: [NAME_FIELD,UsrRoleName,UserType]
        }) wireuser({
            error,
            data
        }) {
        if (error) {
            this.error = error;
        } else if (data) {
            this.name = data.fields.Name.value;
            this.currentUserRole =data.fields.User_Role__c.value;
            this.userTypeValue=data.fields.User_Type__c.value;
            if( this.currentUserRole == 'Portal Account Partner Executive' || this.currentUserRole == 'CEO' );{
                this.isExec=true;
                this.isManager=false;
                this.isStaff=false;
                this.participantlogin= true;
                this.isFeedback = true;
            }
            if(this.currentUserRole == 'Portal Account Partner Manager'){
                this.isExec=false;
                this.isManager=true;
                this.isStaff=false;
                this.participantlogin= true;
                this.isFeedback = true;
            }
            if(this.currentUserRole == 'Portal Account Partner User'){
                this.isExec=false;
                this.isManager=false;
                this.isStaff=true;
                this.isFeedback = false;
            } 
            if(this.userTypeValue == 'NDIS Participants'){
                this.participantlogin=false;
            }            
        }
    }
    @wire(getClientById, { recordId: '$recordId' })
    wiredClient(result) {
      this.wiredClientResult = result;
        const { data, error } = result;

        if (data) {
            this.clientData = data;
            console.log('Client data 11 :', JSON.stringify(this.clientData));
            this.image = this.clientData[0].Picture__c;
            console.log('Client image :', this.image);
            this.city = this.clientData[0].Address__City__s;
            this.country = this.clientData[0].Address__CountryCode__s;
            this.province = this.clientData[0].Address__StateCode__s;
            this.postalcode = this.clientData[0].Address__PostalCode__s;
            this.street1=this.clientData[0].Address__Street__s;
            this.addressdata=this.clientData[0].AddressData__c;
            /* this.clientId = this.clientData[0].Id;
            this.clientName = this.clientData[0].Name;
            console.log('User CleintId >>'+this.clientId);
            console.log('Participant Name >>'+this.clientName); */
            console.log('Client data:', JSON.stringify(this.clientData));
        } else if (error) {
            this.handleError(error);
        }
    }
    refreshParent(event) {
       
       console.log('event fired from child');
        setTimeout(() => {
            refreshApex(this.wiredClientResult); 
        }, 1000);
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

    connectedCallback() {
        console.log('recordId ', this.recordId);
        this.servicerecordId=this.recordId;
        this.clientId=this.recordId;        
        this.ClientJournel = true;
        //this.scheduleFlag= true;
               
        listOfClientjounel({ recordId: this.recordId }).then(response => {
           // console.log('user image url2'+JSON.stringify(response)); 
            response.forEach((record) => {
                let tempConRec = Object.assign({}, record);
                let today = new Date().toISOString().slice(0, 10);
                if (tempConRec.CreatedBy.Name === this.name && today === tempConRec.CreatedDate__c) {                                   
                    tempConRec.journelDescription = true;
                    this.journelDescription = true; 
                } else {
                    tempConRec.journelDescription = false; 
                }
                
                if (tempConRec.Staff__r ) {
                    tempConRec.picture = tempConRec.Staff__r.picture__c; 
                    tempConRec.createdname=tempConRec.Staff__r.Name+' '+tempConRec.Staff__r.Last_Name__c;
                } else {
                    tempConRec.createdname=tempConRec.CreatedBy.Name;
                    tempConRec.picture = tempConRec.CreatedBy.SmallPhotoUrl;
                }

                console.log('user image url1 ' + tempConRec.picture);                              
                this.clientJournelList.push(tempConRec);
        
                refreshApex(this.clientJournelList);
                
                if(this.clientJournelList.length>0){
                    this.iscreateNew = true;
                }
            });  
        })
        communityPage().then(result=>{
            this.communityurl=result;
            console.log('url ==>'+result);
        }).catch(error=>{
                console.log('error ==>'+error);
        });
       // this.getStaffValues();
        document.addEventListener('click', this.handleOutsideClick.bind(this));
        document.body.style.overflowX = 'hidden';  
        
        console.log('risk details from participant module '+JSON.stringify(this.riskindexdetailsfromparent));
        if((this.riskindexdetailsfromparent.naviagte !=null || this.riskindexdetailsfromparent.naviagte != undefined || this.riskindexdetailsfromparent.naviagte !='')&&this.riskindexdetailsfromparent.naviagte=='riskmanagement'){
           // this.recordId=this.riskindexdetailsfromparent.participantId;
            this.createTask = false;
            this.addNew = false;               
            this.ClientJournel = false;
            this.detailsFlag = false;
            this.serviceSupportFlag = false;
            this.iscreateNew = false;
            this.fundTranfer=false;
            this.Formsflag=false;
            this.attachment=false;
            this.iscreateNew = false;
            this.isVisible=true;
            this.feedback = false;
            this.scheduleFlag = false;
            this.riskFlag = true;
           
         }
    }

    disconnectedCallback() {
        document.removeEventListener('click', this.handleOutsideClick.bind(this));
    }

    handleClick(event) {
        if (event.target.dataset.name == 'ClientJournel') {
            console.log(event.target.dataset.name);
            this.ClientJournel = true;
            this.iscreateNew = true;
            this.addNew = false;                        
            this.createTask = false;
            this.detailsFlag = false;
            this.serviceSupportFlag = false;
            this.fundTranfer=false;
            this.Formsflag=false;
            this.attachment=false;
            this.isVisible=true;
            this.feedback = false;
            this.scheduleFlag = false;
            this.riskFlag = false;
            this.ParticipantAvailabiltyFlag = false;

        }
        if (event.target.name == 'addNew') {            
            this.iscreateNew = true;
            this.addNew = true;              
            this.detailsFlag = false;
            this.serviceSupportFlag = false;
            this.isVisible=false;
            this.Formsflag=false;
            this.fundTranfer=false;
            this.attachment=false;
            this.notesflag=false;
            this.jounelId='';
            this.jNoteType='';
            this.buttonlabel='Save';
            this.feedback = false;
            this.scheduleFlag = false;
            this.showMuteIcon = false;
            this.showClearIcon = false;
            this.riskFlag = false;
            this.ParticipantAvailabiltyFlag = false;
        }
        if (event.target.name == 'createTask') {            
            this.createTask = true;
            this.addNew = false;                
            this.detailsFlag = false;
            this.serviceSupportFlag = false;
            this.iscreateNew = true;
            this.isVisible=false;
            this.Formsflag=false;
            this.fundTranfer=false;
            this.attachment=false;
            this.feedback = false;
            this.scheduleFlag = false;
            this.riskFlag = false;
            this.ParticipantAvailabiltyFlag = false;
        }
        if (event.target.dataset.name == 'details') {            
            this.createTask = false;
            this.addNew = false;            
            this.ClientJournel = false;
            this.detailsFlag = true;
            this.serviceSupportFlag = false;
            this.iscreateNew = false;
            this.fundTranfer=false;
            this.Formsflag=false;
            this.attachment=false;
            this.isVisible=true;
            this.feedback = false;
            this.scheduleFlag = false;
            this.riskFlag = false;
            this.ParticipantAvailabiltyFlag = false;
        }
        if (event.target.dataset.name == 'ServiceandSupportPlan') {
            this.createTask = false;
            this.addNew = false;              
            this.ClientJournel = false;
            this.detailsFlag = false;
            this.serviceSupportFlag = true;
            this.iscreateNew = false;
            this.fundTranfer=false;
            this.Formsflag=false;
            this.attachment=false;
            this.iscreateNew = false;
            this.isVisible=true;
            this.feedback = false;
            this.scheduleFlag = false;
            this.riskFlag = false;
            this.ParticipantAvailabiltyFlag = false;
        }
        
        if (event.target.dataset.name == 'fundtranfer') {
            this.createTask = false;
            this.addNew = false;            
            this.ClientJournel = false;
            this.detailsFlag = false;
            this.serviceSupportFlag = false;
            this.iscreateNew = false;
            this.fundTranfer=true;
            this.Formsflag=false;
            this.attachment=false;
            this.iscreateNew = false;
            this.isVisible=true;
            this.feedback = false;
            this.scheduleFlag = false;
            this.riskFlag = false;
            this.ParticipantAvailabiltyFlag = false;
        }
        if (event.target.dataset.name == 'ParticipantForms') {
            this.createTask = false;
            this.addNew = false;               
            this.ClientJournel = false;
            this.detailsFlag = false;
            this.serviceSupportFlag = false;
            this.iscreateNew = false;
            this.fundTranfer=false;
            this.Formsflag=true;
            this.attachment=false;
            this.iscreateNew = false;
            this.isVisible=true;
            this.feedback = false;
            this.scheduleFlag = false;
            this.riskFlag = false;
            this.ParticipantAvailabiltyFlag = false;
        }
        if (event.target.dataset.name == 'attachment') {
            this.createTask = false;
            this.addNew = false;               
            this.ClientJournel = false;
            this.detailsFlag = false;
            this.serviceSupportFlag = false;
            this.iscreateNew = false;
            this.fundTranfer=false;
            this.Formsflag=false;
            this.attachment=true;
            this.iscreateNew = false;
            this.isVisible=true;
            this.feedback = false;
            this.scheduleFlag = false;
            this.riskFlag = false;
            this.ParticipantAvailabiltyFlag = false;
        }
        if (event.target.dataset.name == 'feedback') {
            this.createTask = false;
            this.addNew = false;               
            this.ClientJournel = false;
            this.detailsFlag = false;
            this.serviceSupportFlag = false;
            this.iscreateNew = false;
            this.fundTranfer=false;
            this.Formsflag=false;
            this.attachment=false;
            this.iscreateNew = false;
            this.isVisible=true;
            this.feedback = true;
            this.scheduleFlag = false;
            this.riskFlag = false;
            this.ParticipantAvailabiltyFlag = false;
        }
        if (event.target.dataset.name == 'schedule') {
            this.createTask = false;
            this.addNew = false;               
            this.ClientJournel = false;
            this.detailsFlag = false;
            this.serviceSupportFlag = false;
            this.iscreateNew = false;
            this.fundTranfer=false;
            this.Formsflag=false;
            this.attachment=false;
            this.iscreateNew = false;
            this.isVisible=true;
            this.feedback = false;
            this.scheduleFlag = true;
            this.riskFlag = false;
            this.ParticipantAvailabiltyFlag = false;
        }
        if (event.target.dataset.name == 'risk') {
            this.createTask = false;
            this.addNew = false;               
            this.ClientJournel = false;
            this.detailsFlag = false;
            this.serviceSupportFlag = false;
            this.iscreateNew = false;
            this.fundTranfer=false;
            this.Formsflag=false;
            this.attachment=false;
            this.iscreateNew = false;
            this.isVisible=true;
            this.feedback = false;
            this.scheduleFlag = false;
            this.riskFlag = true;
            this.ParticipantAvailabiltyFlag = false;
        }
        if (event.target.dataset.name == 'ParticipantAvailabilty') {
            this.createTask = false;
            this.addNew = false;               
            this.ClientJournel = false;
            this.detailsFlag = false;
            this.serviceSupportFlag = false;
            this.iscreateNew = false;
            this.fundTranfer=false;
            this.Formsflag=false;
            this.attachment=false;
            this.iscreateNew = false;
            this.isVisible=false;
            this.feedback = false;
            this.scheduleFlag = false;
            this.riskFlag = false;
            this.ParticipantAvailabiltyFlag = true;
        }
    }

    handleEdit(event) {              
        this.jounelId = event.currentTarget.dataset.id;
        this.description=event.target.dataset.name;
        this.jNoteType=event.target.dataset.notestype;
        this.iscreateNew=false;
        this.addNew=true;
        this.isVisible=false;
        this.notesflag=true; 
        this.buttonlabel='Update';  
         
    }

    // onchangeJournel(event){
    //     this.description=event.target.value;
    // }

    value = 'inProgress';

    get options() {
        return [
            { label: 'Care Notes', value: 'Care Notes' },
            { label: 'Progress Notes', value: 'Progress Notes' },
            { label: 'Special Instructions', value: 'Special Instructions' },
        ];
    }

    handleChange(event) {
        this.jNoteType = event.detail.value;
        //alert(this.journelNoteType);
    }

    closeAddJournel(){
        this.iscreateNew=true;
        this.addNew=false;
        this.description='';
        this.notesType='';
        this.isVisible=true;  
        this.assignClient = false; 
        this.ClientJournel = true;
        this.showMuteIcon = false;
    }

    handleSave(event){  
        if (!this.jNoteType) {
            const event = new ShowToastEvent({
                title: 'Error',
                message: 'Please select an option for the picklist field',
                variant: 'error'
            });
            this.dispatchEvent(event);
            return; // Stop further execution
        }
        if(!this.description){
            const event = new ShowToastEvent({
                title: 'Error',
                message: 'Please enter description',
                variant: 'error'
            });
            this.dispatchEvent(event);
            return;
        }      
        saveDesc({recordId:this.recordId,jounelId:this.jounelId,description:this.description,jNoteType:this.jNoteType})
        
        .then(result=>{ 
            if (result.includes('Created Successfully!')) {          
            this.clientJournelList=[];
            listOfClientjounel({ recordId: this.recordId }).then(response => {
                response.forEach((record) => {                    
                    let tempConRec = Object.assign({}, record);
                    let today = new Date().toISOString().slice(0, 10);
                    if (tempConRec.CreatedBy.Name === this.name && today === tempConRec.CreatedDate__c) {                                   
                        tempConRec.journelDescription = true;
                        this.journelDescription = true; 
                    } else {
                        tempConRec.journelDescription = false; 
                    }
                    
                    if (tempConRec.Staff__r ) {
                        tempConRec.picture = tempConRec.Staff__r.picture__c; 
                        tempConRec.createdname=tempConRec.Staff__r.Name+' '+tempConRec.Staff__r.Last_Name__c;
                    } else {
                        tempConRec.createdname=tempConRec.CreatedBy.Name;
                        tempConRec.picture = tempConRec.CreatedBy.SmallPhotoUrl;
                    }
                    this.clientJournelList.push(tempConRec);
                    refreshApex(this.clientJournelList);
                });
            })
                 this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'The record has been inserted successfully!',
                            variant: 'success',
                        })
                    );
                
            }
            if (result.includes('Updated')) {          
            this.clientJournelList=[];
            listOfClientjounel({ recordId: this.recordId }).then(response => {
                response.forEach((record) => {                    
                    let tempConRec = Object.assign({}, record);
                    let today = new Date().toISOString().slice(0, 10);
                    if (tempConRec.CreatedBy.Name === this.name && today === tempConRec.CreatedDate__c) {                                   
                        tempConRec.journelDescription = true;
                        this.journelDescription = true; 
                    } else {
                        tempConRec.journelDescription = false; 
                    }
                    
                    if (tempConRec.Staff__r ) {
                        tempConRec.picture = tempConRec.Staff__r.picture__c; 
                        tempConRec.createdname=tempConRec.Staff__r.Name+' '+tempConRec.Staff__r.Last_Name__c;
                    } else {
                        tempConRec.createdname=tempConRec.CreatedBy.Name;
                        tempConRec.picture = tempConRec.CreatedBy.SmallPhotoUrl;
                    }
                    this.clientJournelList.push(tempConRec);
                    refreshApex(this.clientJournelList);
                });
            })
                 this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'The record has been updated successfully!',
                            variant: 'success',
                        })
                    );
                
            }
            if(result.includes('existing value selected')){
                 this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Record cannot be updated because you have selected duplcated notes type',
                        variant: 'error',
                    })
                );

            }
            else if (result === 'duplicate') {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Duplicate Notes Type found, the record cannot be saved!',
                        variant: 'error',
                    })
                );

            }
        })       

        this.iscreateNew=true;
        this.addNew=false;
        this.isVisible=true; 
        this.description='';
    }

    createTaskParent(){
        this.template.querySelector('c-task-create ').createTask(); 
        this.createTask=false;
        this.ClientJournel=true;
        this.isVisible=true;
        this.iscreateNew=true;
        }

    closeTask(){
        this.createTask=false;
        this.ClientJournel=true;
        this.isVisible=true;        
        this.iscreateNew=true;
    } 

    get journelClass(){       
        return  this.ClientJournel ? 'participantClass2' : 'participantClass'; // you can use your custom class here.
  
    }
    get detailsClass(){
        return this.detailsFlag ? 'participantClass2' : 'participantClass'; // you can use your custom class here.
  
    }

    get fundClass(){
        return this.fundTranfer ? 'participantClass2' : 'participantClass'; // you can use your custom class here.
  
    }
    get serviceClass(){
        return this.serviceSupportFlag ? 'participantClass2' : 'participantClass'; // you can use your custom class here.
  
    }
    get fundsClass(){
        return this.Formsflag ? 'participantClass2' : 'participantClass'; // you can use your custom class here.
    }
    get attachClass(){
        return this.attachment ? 'participantClass2' : 'participantClass'; // you can use your custom class here.
    }
    get servClass(){
        return this.feedback ? 'participantClass2' : 'participantClass'; // you can use your custom class here.
    }
    get scheduleClass(){
        return this.scheduleFlag ? 'participantClass2' : 'participantClass'; // you can use your custom class here.
    } 
    get riskClass(){
        return this.riskFlag ? 'participantClass2' : 'participantClass'; // you can use your custom class here.
    }   
    get ParticipantAvailabiltyClass(){
        return this.ParticipantAvailabiltyFlag ? 'participantClass2' : 'participantClass'; // you can use your custom class here.
    }  
    
    navigateToParticipant(){
        const customEvent = new CustomEvent('clientevent', {
            detail: { message: 'Hello from Child!' }
        });
        this.dispatchEvent(customEvent);
    }
   
    /* @track assignClient = false;
    handleAssignClient(){
        this.assignClient = true;
        this.participantlayout = false;
        this.ClientJournel = false;
    }
    handleBack(){
        this.assignClient = false;
        this.participantlayout = false;
        this.ClientJournel = true;
    }

    @track staffOptions = [];    
    @track staffVal;
   
    getStaffValues(){
        getEmployeeData().then(response => {
            this.staffOptions = response.map(record => ({ value: record.Id, label: record.Name })); 
            console.log('staff options '+JSON.stringify(this.staffOptions));
           // console.log('staff options1 >>'+JSON.stringify(this.staffOptions1));

            let staffLength=Object.keys(this.staffOptions).length;           
            this.staffVal = this.staffOptions[0].label;
            this.staffVal1 = this.staffOptions1[0].label
            //this.stafflabel=this.staffOptions2[0].label;
            console.log('staff Options label '+ this.staffOptions[0].label);
        }).catch(err => {
       
        });
    }

    @track stafflabel;
    @track staffName=[];
    handleStaffChange(event) {
       // this.stafflabel = this.staffOptions.find(rec=>rec.value==event.detail.value).label;
       // console.log('Staff label----->'+this.stafflabel);
        this.staffName = event.target.value;
        console.log('Staff Name >> '+ this.staffName);
    } */

    get iconName() {
       if (this.isListening) {
            return 'utility:unmuted';
       } else {
            return 'utility:muted';
       }
    }
        
     // Alternative text for accessibility
    get altText() {
        if (this.isListening) {
             return 'Unmute';
        } else {
            return 'Mute';
        }
    }
    // Toggle between mute/unmute
    toggleListening() {
        try {
            this.isListening = !this.isListening;
            if (this.isListening) {
                this.startListening();
            } else {
                this.stopListening();
            }
        } catch (error) {
            console.error('Error in toggleListening:', error.message);
        }
    }
    // Show icons when text area gains focus
    handleFocus() {
        console.log('handleFocus executing >>');
        try {
            this.showMuteIcon = true;
            this.isListening = false; // Ensure the state is not in listening mode
            if (this.recognition) {
               this.recognition.stop(); // Stop any ongoing recognition process
               this.recognition = null; // Clear recognition instance
            }
        } catch (error) {
            console.error('Error in handleFocus:', error.message);
        }
    }
    // Start speech recognition
    startListening() {
        try {
            console.log('Listening started...');
            if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
                const SpeechRecognition =
                    window.SpeechRecognition || window.webkitSpeechRecognition;
                const recognition = new SpeechRecognition();
                recognition.lang = 'en-US';
                recognition.continuous = true;
                recognition.interimResults = false;

                recognition.onresult = (event) => {
                    this.description += Array.from(event.results)
                        .map((result) => result[0].transcript)
                        .join('');
                    this.showClearIcon = true; // Show clear icon after transcription
                };

                recognition.onerror = (event) => {
                    console.error('Error during speech recognition:', event.error);
                };

                recognition.onend = () => {
                    console.log('Recognition ended');
                    this.isListening = false;
                };

                recognition.start();
                this.recognition = recognition;
            } else {
                console.error('SpeechRecognition API not supported by this browser.');
                alert('SpeechRecognition API is not supported in this browser.');
            }
        } catch (error) {
            console.error('Error in startListening:', error.message);
        }
    }

    // Stop speech recognition
    stopListening() {
        try {
            console.log('Listening stopped...');
            if (this.recognition) {
                this.recognition.stop();
                this.recognition = null;
            }
        } catch (error) {
            console.error('Error in stopListening:', error.message);
        }
    }

    // Clear text and hide clear icon
    clearText() {
        try {
            this.description = '';
            this.showClearIcon = false;
            if (this.isListening) {
                //this.startListening();
                this.stopListening();
                this.description = '';
               } 
        } catch (error) {
            console.error('Error in clearText:', error.message);
        }
        
    }

    // Handle text change to show clear icon
    onchangeJournel(event) {
        try {
            this.description = event.target.value;
            this.showClearIcon = this.description.length > 0;
        } catch (error) {
            console.error('Error in handleTextChange:', error.message);
        }
    }

    //Slide-In-Out-Animation
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
     
}