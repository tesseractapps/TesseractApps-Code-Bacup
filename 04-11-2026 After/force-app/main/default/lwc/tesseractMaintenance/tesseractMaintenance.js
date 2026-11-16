import { LightningElement, track } from 'lwc';
import getUserLicense from '@salesforce/apex/issueRegisterSearch.getUserLicense';

export default class TesseractMaintenance extends LightningElement {
    // Production
    prodNumLic = '6';
    prodChannelAccount = '450';
    prodUsedLic = '5';
    prodAvailLic = '5';
    prodUsedData = '7 GB';
    prodUsedFile = '2000 files';
    prodAdmin = '5';
    prodChannel = '350'
    prodAvailableAdmin = '1';
    prodAvailableChannel = '100';

    // UAT
    noUatAdmin = '6';
    noUatChannel = '200';
    usedAdmin = '4';
    usedChannel = '22';
    availableAdmin = '2';
    availableChannel = '178';

    // QA
    noQAAdmin = '6';
    noQAChannel = '200';
    usedAdminQA = '5';
    usedChannelQA = '15';
    availableAdminQA = '1';
    availableChannelQA = '185';

    // Dev
    @track noDevAdmin;
    @track noDevChannel;
    @track usedAdminDev;
    @track usedChannelDev;
    @track availableAdminDev;
    @track availableChannelDev;
    @track name1;
    @track name2;

    
    connectedCallback(){
        //let tempconList1 = [];
        //let tempconList2 = [];
        getUserLicense()
            .then(response => {
                if (response && response.length > 0) {
                    response.forEach(record => {
                        if(record.Name == 'Salesforce'){
                            this.noDevAdmin = record.TotalLicenses;
                            this.usedAdminDev = record.UsedLicenses;
                            this.availableAdminDev = this.noDevAdmin - this.usedAdminDev;
                        } else if(record.Name == 'Channel Account'){
                            this.noDevChannel = record.TotalLicenses;
                            this.usedChannelDev = record.UsedLicenses;
                            this.availableChannelDev = this.noDevChannel - this.usedChannelDev;
                        }

                    });
                } else {
                   
                }
            })
        .catch(error => {
           
        });
    }
}