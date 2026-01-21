import {LightningElement, wire, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import saveEntity from '@salesforce/apex/XeroIntegrationController.saveEntity';

export default class TesseractAppsEntityForXero extends LightningElement {
    @api createEntityForXeroOnly;
    @api createEntityForXeroAll;
    @api selectedName;
    @api entityData;
    @track entityFirstName;
    @track entityLastName;
    @track entityEmail;
    @track contactNo;
    @track abn;
    @track street;
    @track city;
    @track country;
    @track province;
    @track postalCode;
    @track xeroId;
    //@track errorMessage;
    @track createEntity = true;
    @track errorMessage;
    @track entity;

    connectedCallback(){
        console.log('createEntityForXeroOnly in create entity : ', this.createEntityForXeroOnly);
        console.log('createEntityForXeroAll  in create entity :', this.createEntityForXeroAll);
        console.log('selectedName  in create entity :', this.selectedName);
        console.log('entityData  in create entity :', JSON.stringify(this.entityData));

        if(this.entityData){
            this.entityFirstName = this.entityData.name || '';
            this.entityLastName = this.entityData.entityLastName || '';
            this.entityEmail = this.entityData.email|| '';
            this.contactNo = this.entityData.phone|| '';
            this.abn = this.entityData.abn|| '';
            this.xeroId = this.entityData.xeroId || '';
           // this.address = this.entityData.address1 || {};
            const addr = this.entityData.address || {};
            this.street = addr.street || '';
            this.city = addr.city || '';
            this.province = addr.region || '';
            this.postalCode = addr.postalCode || '';
            this.country = addr.country || '';
        }
    }
    handleChange(event) {
        const fieldName = event.target.name;
        const fieldValue = event.target.value;
        
        console.log(`Updated Field - ${fieldName}:`, fieldValue);
        
            switch (fieldName) {
            
            case 'entityFirstName':
                this.entityFirstName = fieldValue;
                console.log('entityFirstName:', this.entityFirstName);
                break;
            case 'entityLastName':
                this.entityLastName = fieldValue;
                console.log('entityLastName:', this.entityLastName);
                break;
            case 'email':
                this.entityEmail = fieldValue;
                console.log('entityEmail:', this.entityEmail);
                break;
            case 'contact':
                this.contactNo = fieldValue;
                console.log('contactNo:', this.contactNo);
                break;
            case 'abn':
                this.abn = fieldValue;
                console.log('abn:', this.abn);
                break;
            
            default:
                console.warn(`Unhandled field name: ${fieldName}`);
                break;
        }
    
    } 
    handleClear(event) {
        this.createEntity = false;
        this.entityFirstName = '';
        this.entityLastName = '';
        this.entityEmail = '';
        this.contactNo = '';
        this.abn= '';
        // if (this.createEntityForXeroOnly || this.createEntityForXeroAll) {
            const cancelEvent = new CustomEvent('backtoxero', {
                bubbles: true,
                composed: true
            });
            this.dispatchEvent(cancelEvent);
           
       // }
    }  
    handleSave() {
        console.log('entityFirstName:', this.entityFirstName);
        console.log('abn:', this.abn);
        console.log('entityEmail:', this.entityEmail);
        console.log('contactNo:', this.contactNo);

        const isAddressIncomplete = !this.street || !this.city || !this.province || !this.postalCode || !this.country;

        if (!this.entityFirstName || !this.abn || !this.entityEmail || !this.contactNo || isAddressIncomplete) {
           // this.errorMessage = 'Please fill all required fields.';
             this.showToast('Error','Please fill all required fields.','Error');
            return;
        }
        this.errorMessage = '';

        const entityPayload = {
            firstName: this.entityFirstName,
            lastName: this.entityLastName || '',
            email: this.entityEmail || '',
            contactNo: this.contactNo || '',
            abn: this.abn||'',
            xeroId: this.xeroId || '',
            //address1:this.address || {},
            address: {
                street: this.street,
                city: this.city,
                province: this.province,
                postalCode: this.postalCode,
                country: this.country
            }
        };

        console.log('🔁 Saving to Apex:', JSON.stringify(entityPayload));

        saveEntity({ entityData: entityPayload, orgId:this.selectedName })
            .then(() => {
                this.showToast('Success', 'Entity saved successfully.', 'success');
                //this.handleClear(); // Optional: Clear form
                 setTimeout(() => {
                    this.handleClear();

                    // if (this.createEntityForXeroOnly || this.createEntityForXeroAll) {
                    //     const cancelEvent = new CustomEvent('backtoxero', {
                    //         bubbles: true,
                    //         composed: true
                    //     });
                    //     this.dispatchEvent(cancelEvent);
                // }
                }, 2000); // 2-second delay
                console.log('back to xero contacts ');
                
            })
            .catch(error => {
                console.error('❌ Error saving entity:', error);
                this.showToast('Error', 'Failed to save entity.', 'error');
            });
    }
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }
      addressInputChange(event) {
        /* console.log('event detail'+JSON.stringify(event.detail));  */
        this.street = event.detail.street;
        this.city = event.detail.city;
        this.province = event.detail.province;
        this.country = event.detail.country;
        this.postalcode = event.detail.postalCode;
    }

    
}