import { LightningElement, track, api, wire } from 'lwc';
import My_Resource from "@salesforce/resourceUrl/myResource";

export default class TesseractAppsAccountingBankFeed extends LightningElement {
   @track isHome =true; 
   @track isContent = true;
   @api companyname;
   @api orgid;
   @api companyid;
    coming = My_Resource + '/myResource/images/Livesoon.png';

   connectedCallback(){
        console.log("TesseractAppsAccountingBankFeed");
        console.log("this.companyname in bank feed"+this.companyname);
        console.log("this.companyid in bank feed"+this.companyid);
   }
}