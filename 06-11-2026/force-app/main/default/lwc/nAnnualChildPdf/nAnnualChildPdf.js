import { LightningElement,track, api } from 'lwc';
import { loadScript } from "lightning/platformResourceLoader";
import jsPDF from '@salesforce/resourceUrl/jspdf';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';

export default class NAnnualChildPdf extends LightningElement {
    @api childRecordId;
    @track currentRecordPdf;
    @track base64string;
    @api childResponseData = [];
    @track responseDataFromParent=[];

    connectedCallback(){
        this.currentRecordPdf=this.childRecordId;
        console.log('ndis payroll pdf records '+this.currentRecordPdf);
        this.responseDataFromParent=this.childResponseData;
        if (this.responseDataFromParent && this.responseDataFromParent.length > 0) {
            this.generatePayroll();
        } else {
            console.error('No data available to generate PDF.');
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'No data available to generate PDF.',
                    variant: 'error',
                })
            );
        }
    }
    renderedCallback() {
        Promise.all([
            loadScript(this, jsPDF).then(() => {
            }).catch(error => {
                console.error("Error " + error);
            })
        ]);
    }

    formatDate(dateString) {
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-GB', options);
    }

    generatePayroll() {
        const { jsPDF } = window.jspdf;
        var doc = new jsPDF();

        doc.setFontSize(10);
        doc.setFont("Helvetica", "normal");
        doc.text(this.responseDataFromParent[0].Client_Name__c, 200, 8, { align: 'right' });

        const startDate = this.formatDate(this.responseDataFromParent[0].Start_Date__c);
        const endDate = this.formatDate(this.responseDataFromParent[0].End_Date__c);

        let dateYear = startDate.split(' ');
        console.log('date year >>'+dateYear);
        let currentYear = dateYear[2];
        console.log('Current Year >>'+ currentYear);

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12);
        doc.text(currentYear + ' ACTIVITY STATEMENT SUBSTANTIATION DECLARATION', 10, 20);
        doc.line(10, 25, 200, 25);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Activity statements are assessed on a Self-Assessment basis. This means that the ATO may not check whether the information you have submitted is correct. We will make every endeavour to ensure that your activity statement is prepared accurately and correctly, however we rely on you to ensure that all relevant information is disclosed to us.`, 10, 30, { maxWidth: 190 });

        doc.setFont("Helvetica", "bold");
        doc.text(`I, declare the following in relation to the attached Activity Statement:`, 10, 46);
        doc.setFont("Helvetica", "normal");
        doc.text('1. I have disclosed all transactions for the relevant period.', 15, 51, { maxWidth: 165 } );
        doc.text('2. GST payable, as shown on the front of the activity statement, correctly reflects the GST on taxable supplies made during the period.', 15, 56, { maxWidth: 180 } );
        doc.text('3. An input tax credit has not been claimed for any acquisitions that are GST-free, input taxed, or otherwise have no GST in the price.', 15, 64, { maxWidth: 180 } );
        doc.text('4. No supplies have been made to associates at less than their GST-inclusive market value, except for those specifically advised by me.', 15, 72, { maxWidth: 180 } );
        doc.text('5. Where an insurance claim has been made, I have advised the insurer of the extent to which I am entitled to claim an input tax credit.', 15, 80, { maxWidth: 180 } );
        doc.text('i. If the real property was acquired on or after 1 July 2000, it was so acquired under the margin scheme, or;', 20, 88, { maxWidth: 180 } );
        doc.text('ii. If the real property was acquired before 1 July 2000, a valid valuation was obtained in the period of this BAS', 20, 93, { maxWidth: 180 } );
        doc.text('6. Where supplies are used for both business and private purposes (individuals only) e.g. car, mobile telephone, home telephone, computer etc, I have kept appropriate apportionment records to verify my business usage claim and that I am aware that an input tax credit cannot be claimed for supplies for private purposes. I have instructed you to prepare the activity statement based on my specific instructions on the understanding I will be able to produce such information to the satisfaction of the ATO under audit.', 15, 98, { maxWidth: 180 });

        let yPosition = 105;
        doc.setFont("Helvetica", "bold");
        doc.text('Valid tax invoices:', 10 ,118);
        doc.setFont("Helvetica", "normal");
        doc.text('1. I have maintained records to ensure that there are valid tax invoices and adjustment notes to support input tax credits claimed.',15, 123, { maxWidth: 165 });
        doc.text('2. I am aware of the need to retain such records for a minimum of five years from the date of lodgment of the activity statement.',15, 131, { maxWidth: 165 });
    
        doc.setFont("Helvetica", "bold");
        doc.text('Penalties and Audits:',10, 142);
        doc.setFont("Helvetica", "normal");
        doc.text('1. I am also aware that various additional tax, interest charges and other penalties may apply where the amounts of the various tax liabilities which comprise the activity statement, are understated.',15, 148, { maxWidth: 165 });
        doc.text('2. I am aware that the procedures to follow if a document is lost or destroyed is to obtain a copy from the supplier;',15, 156, { maxWidth: 165 });
        doc.text('3. I may be required to substantiate or verify any income or expense item declared or claimed in my activity statement in the event of an ATO audit;',15, 161, { maxWidth: 165 });
    
        doc.text('Signature: ____________________________  Date: _______________', 10, yPosition + 85);

        doc.addPage("a4","portrait");

        doc.setFontSize(10);
        doc.setFont("Helvetica", "normal");
        doc.text(this.responseDataFromParent[0].Client_Name__c, 200, 8, { align: 'right' });

        doc.setFontSize(20);
        doc.setFont("Helvetica", "bold");
        doc.text('Activity Statement', 10, 20);
        doc.text(currentYear, 184, 20);

        doc.setFontSize(13);
        doc.setFont("Helvetica", "normal");        
        doc.text(`${startDate} — ${endDate}`, 143, 28);
        
        doc.line(10, 32, 200, 32);

        yPosition += 20;
        doc.setFontSize(12);
        doc.setFont("Helvetica", "normal");
        console.log('Response Daata >>'+JSON.stringify(this.responseDataFromParent));
        doc.text('Client Name: ' +this.responseDataFromParent[0].Client_Name__c, 10, 40);
        console.log('Client Name >>'+this.responseDataFromParent[0].Client_Name__c);
        doc.line(10, 42, 107, 42);            
        doc.text('TFN:            ' + (this.responseDataFromParent[0].TFN__c ? this.responseDataFromParent[0].TFN__c : 'No Data'), 110, 40);
        doc.text('Document ID:         ' + (this.responseDataFromParent[0].Document_Id__c ? this.responseDataFromParent[0].Document_Id__c : 'No Data'), 10, 56);
        console.log('TFN Number >>'+this.responseDataFromParent[0].TFN__c);
        doc.line(110, 42, 200, 42);

        /* let formType = this.responseDataFromParent[0].Form_Type__c;

        // Rearrange the form type to 'BAS-A'
        let formattedFormType = formType.split('.').reverse().join('-'); */

        // Display the formatted form type
        doc.text('Form type:                  ' + 'IAS-N', 10, 47);

        // doc.text('Form type:              '+this.responseDataFromParent[0].Form_Type__c, 10, 47); //+this.responseDataFromParent[0].Form_Type__c
        doc.line(10, 50, 107, 50);
        doc.text('ABN:           '+this.responseDataFromParent[0].ABN__c, 110, 48);
        console.log('ABN Number >>'+this.responseDataFromParent[0].ABN__c);
        doc.line(110, 50, 200, 50);
       // doc.text('Document ID:         '+this.responseDataFromParent[0].Document_Id__c,10, 56);
        console.log('Document Id is >>'+this.responseDataFromParent[0].Document_Id__c);
        doc.line(10, 59, 107, 59);
        doc.line(110, 59, 200, 59);

        doc.line(10, 68, 200, 68);

        doc.setFontSize(13);
        doc.setFont("Helvetica", "bold");
        doc.text('Declaration',10 , 76);       
        doc.line(10, 78, 195, 78);
        doc.setFontSize(9);
        doc.setFont("Helvetica", "normal");
        doc.text('I authorise Lovelin Jagjit Gandhi to give this activity statement to the Commissioner of Taxation for '+ this.responseDataFromParent[0].Client_Name__c +'. I declare that I am authorised to make this declaration, and the information provided for the preparation of this activity statement is true and correct.',10 , 84, { maxWidth: 180 });

        doc.setFontSize(10);
        doc.setFont("Helvetica", "normal");
        doc.text('Signature: ____________________________  Date: _______________', 10, 104);

        if(this.responseDataFromParent.length > 0) {
            this.base64string = btoa(doc.output());
            let docName = this.responseDataFromParent[0].Name+'.pdf';
            console.log('DocName is >> '+ docName);
            uploadFile({base64: JSON.stringify(this.base64string), filename:docName, recordId: this.childRecordId, obj:'activity'}).then(result => {
            // this.fileName = this.recordId + ' - Uploaded Successfully';                
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success!!',
                        message: 'PDF Generated Successfully!!!',
                        variant: 'success',
                    }),
                );
            }).catch(error =>{
                console.error('Received error from server: ', error);
            });
        }
    }
}