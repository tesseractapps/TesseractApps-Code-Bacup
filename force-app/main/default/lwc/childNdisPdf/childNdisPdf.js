import { LightningElement, track, wire, api } from 'lwc';
import { loadScript } from "lightning/platformResourceLoader";
import jsPDF from '@salesforce/resourceUrl/jspdf';
import emailAttach from '@salesforce/apex/SingleEmailAttachment.emailAttach';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';

export default class ChildNdisPdf extends LightningElement {
    @api ndisPayrollRecords;
    @track currentRecordPdf=[]
    @api orgdeatils;
    @track orgEmail;
    @track startEndDate;
    @track subjectName;
    @track base64string;
    @track staffEmail;
    @track orgName;
    connectedCallback(){
        //console.log('ndis payroll pdf records '+JSON.stringify(this.ndisPayrollRecords));
        this.currentRecordPdf=this.ndisPayrollRecords;
        console.log('ndis payroll pdf records '+JSON.stringify( this.currentRecordPdf));
        this.generatePayroll();
    
    }
    renderedCallback() {
        Promise.all([
            loadScript(this, jsPDF).then(() => {
            }).catch(error => {
                console.error("Error " + error);
            })
        ]);
    }

    generatePayroll() {        
        // console.log('staffData.Base_Rate__c ', this.currentRecordPdf[0].staffData.Base_Rate__c);
         const { jsPDF } = window.jspdf;
         var doc = new jsPDF();
         doc.addImage(this.currentRecordPdf[0].bolbdata, "PNG", 10, 16, 70, 18);
         this.orgEmail = this.currentRecordPdf[0].organization.Email__c;
             
         doc.setDrawColor(229,229,229);
         doc.setFillColor(229, 229, 229);
         doc.rect(134, 15, 60, 33,"FD");
 
         doc.setFont("roboto", "bold");
         doc.setFontSize(10);
         doc.text("PAID BY", 137, 23);
         console.log('45 line')
         doc.setFont("roboto", "");
         doc.setFontSize(10);
         doc.text(this.currentRecordPdf[0].organization.Name, 137, 30);
         doc.text(this.currentRecordPdf[0].organization.Address_Latest__c.street + ', ' +this.currentRecordPdf[0].organization.Address_Latest__c.city, 137, 35);
         doc.text(this.currentRecordPdf[0].organization.Address_Latest__c.state + ', ' + this.currentRecordPdf[0].organization.Address_Latest__c.postalCode, 137, 40);
         doc.text("ABN: "+this.currentRecordPdf[0].organization.ABN__c, 137, 45);
 
         doc.setDrawColor(229,229,229);
         doc.setFillColor(229, 229, 229);
         doc.rect(134,50, 60, 15,"FD");
 
         doc.setFont("roboto", "bold");
         doc.setFontSize(10);
         doc.text("EMPLOYMENT DETAILS", 137, 55);
         doc.setFont("roboto", "");
         doc.setFontSize(10);
         
         doc.text("Pay Frequency: "+this.currentRecordPdf[0].staffpayrollData.Payroll_Setting__r.Frequency__c, 137, 60);
         doc.text(this.currentRecordPdf[0].staffData.Name + ' ' + this.currentRecordPdf[0].staffData.Last_Name__c, 10, 53);
        // console.log(this.currentRecordPdf[0].staffData.Address__c.street);
         doc.text(this.currentRecordPdf[0].staffData.Address__c.street + ', ' +this.currentRecordPdf[0].staffData.Address__c.city, 10, 58);
         doc.text(this.currentRecordPdf[0].staffData.Address__c.state + ', ' + this.currentRecordPdf[0].staffData.Address__c.postalCode, 10,63);
         doc.setDrawColor(229,229,229);
         doc.setFillColor(229, 229, 229);
         doc.rect(10, 68, 185, 10,"FD");

         doc.text("Pay Period:", 12, 73);
         doc.text("Payment Date:", 72, 73);

         const oldDate = this.currentRecordPdf[0].staffpayrollData.Payroll_Setting__r.Period_Start_Date__c;
         const finalDate = this.currentRecordPdf[0].staffpayrollData.Payroll_Setting__r.Period_End_Date__c;
     
         const nextPayDate = this.currentRecordPdf[0].staffpayrollData.Pay_Date__c;

         // Split the date string at '-' char
         const arr = oldDate.split('-');
         const arr1 = finalDate.split('-');   
         if (nextPayDate != undefined || !nextPayDate == '' || !nextPayDate == null){
             const arr2 = nextPayDate.split('-');
             const nextPayDateFinal = arr2[2]+'/'+arr2[1]+'/'+arr2[0];
             doc.text(nextPayDateFinal, 94, 73);
         }
         const newDate = arr[2]+'/'+arr[1]+'/'+arr[0];
         const newfinalDate = arr1[2]+'/'+arr1[1]+'/'+arr1[0];
         

         doc.setFont("roboto", "bold");
         doc.setFontSize(10);
         doc.text(newDate + ' - ' + newfinalDate, 30, 73);
         this.subjectName = this.currentRecordPdf[0].staffData.Name + ' ' + this.currentRecordPdf[0].staffData.Last_Name__c +' Pay slip for the period ' + newDate +' to '+newfinalDate;
         this.startEndDate = ' Please find attached your pay slip for the pay period  ' + newDate +' to '+newfinalDate;
         this.orgName = this.currentRecordPdf[0].organization.Name;

         
         let dollarUSLocale = Intl.NumberFormat('en-US', { 
                                                 style: 'currency', 
                                                 currency: 'USD' 
                                             });
         doc.setFont("roboto", "");
         doc.setFontSize(10);
         doc.text("Total Earnings:", 120, 73);
         doc.setFont("roboto", "bold");
         if(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c==undefined){
             doc.text("$0.00", 143, 73);
        }else{
            doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c.toFixed(2)), 143, 73);
        }
        doc.setFont("roboto", "");
        doc.text("Net Pay:", 165, 73);  
        doc.setFont("roboto", "bold");
        if(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c==undefined){
            doc.text("$0.00", 179, 73);
        }else{
            doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c.toFixed(2)), 179, 73);
        } 
        doc.text("THIS PAY", 142, 83);
        doc.text("YTD", 182, 83); 
        doc.line(10, 87, 195, 86);
       
        doc.text("SALARY & WAGES",10,91);
        doc.setFont("roboto", "bold");
        doc.text("RATE",122,91);
        doc.setFont("roboto", "");
        
        doc.setFont("roboto", "");
        doc.setFontSize(10);
       
        
        /* let  hours =this.currentRecordPdf[0].staffpayrollData.General_Shift_Hour__c
        doc.text( hours, 97, 105); */

        console.log('saturday '+this.currentRecordPdf[0].staffpayrollData.Extended_Duration__c );
        console.log('sunday '+this.currentRecordPdf[0].staffpayrollData.Sleepover_Night_Shift_hours__c );

        doc.text("General Shift Hours",10,96);
        doc.text((this.currentRecordPdf[0].staffpayrollData.General_Shift_Hour__c).toString(), 97, 96);
        doc.text(dollarUSLocale.format(parseFloat(this.currentRecordPdf[0].staffData.Working_Hours_Rate__c)).toString(), 122, 96);

        doc.text("Afternoon Shift Hours",10,102);
        doc.text((this.currentRecordPdf[0].staffpayrollData.Afternoon_shift_Hours__c).toString(), 97, 102);
        doc.text(dollarUSLocale.format(parseFloat(this.currentRecordPdf[0].staffpayrollData.Afternoon_shift_Hourly_Rate__c)).toString(), 122, 102);

        doc.text("Night  Shift Hours",10,108);
        doc.text((this.currentRecordPdf[0].staffpayrollData.Night_Shift_Hours__c).toString(), 97, 108);
        doc.text(dollarUSLocale.format(parseFloat(this.currentRecordPdf[0].staffpayrollData.Night_shift_Hourly_Rate__c)).toString(), 122, 108);

        doc.text("Saturday Shift Hours",10,114);
        doc.text((this.currentRecordPdf[0].staffpayrollData.Saturday_hours__c).toString(), 97, 114);
        doc.text(dollarUSLocale.format(parseFloat(this.currentRecordPdf[0].staffpayrollData.Saturday_Hourly_Rate__c)).toString(), 122, 114);

        doc.text("Sunday Shift Hours",10,120);
        doc.text((this.currentRecordPdf[0].staffpayrollData.Sunday_hours__c).toString(), 97, 120);
        doc.text(dollarUSLocale.format(parseFloat(this.currentRecordPdf[0].staffpayrollData.Sunday_Hourly_Rate__c)).toString(), 122, 120);

        doc.text("Sleepover Shift Hours",10,126);
        doc.text((this.currentRecordPdf[0].staffpayrollData.Sleepover_Hours__c).toString(), 97, 126);
        doc.text(" --", 122, 126);

        doc.text("Extended Hours",10,132);
        doc.text((this.currentRecordPdf[0].staffpayrollData.Extended_Duration__c).toString(), 97, 132);
        doc.text(" --", 122, 132);

        doc.text("Sleepover Night Hours",10,138);
        doc.text((this.currentRecordPdf[0].staffpayrollData.Sleepover_Night_Shift_hours__c).toString(), 97, 138);
        doc.text(" --", 122, 138);
       

        doc.text("Total Hours",10,144);
        doc.text((this.currentRecordPdf[0].staffpayrollData.Working_Hours__c).toString(), 97, 144);
        doc.text(this.currentRecordPdf[0].staffpayrollData.Working_Hours__c.toString(), 122, 144);

      
    
        if(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c==undefined){
            doc.text("$0.00", 144, 144);
            }else{
           doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c.toFixed(2)), 144, 144);
            }

            if(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c==undefined){
           doc.text("$0.00", 179, 144);
             }else{
           doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c.toFixed(2)), 179, 144);
            }
            doc.setDrawColor(229,229,229);
            doc.setFillColor(229, 229, 229);
            doc.rect(10, 147, 185, 6,"FD");
            doc.setFont("roboto", "bold");
            doc.text("TOTAL",122,151);
            doc.setFontSize(10);
            if(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c==undefined){
                doc.text("$0.00", 144, 151);
            }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c.toFixed(2)), 144, 151);
            }
        
            if(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c==undefined){
                    doc.text("$0.00", 179, 151);
             }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c.toFixed(2)), 179, 151);
            }
         // new condition added by praveen for pre tax
         if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Value__c >0 || this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Value__c >0
             || this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Value__c >0  || this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Value__c >0
             || this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Value__c >0){
               
               
                 
                 doc.text("Pre TAX Deductions",10,157);
                 doc.setFont("roboto", "");
                 doc.setFontSize(10);
                 let positionOfRows=0;
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Description__c !=undefined){
                     doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Description__c, 10, 161);
                     positionOfRows=28;
                 }
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Description__c !=undefined){
                     doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Description__c, 10, 166);
                     positionOfRows=20;
                 }
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Description__c !=undefined){
                     doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Description__c, 10, 171);
                     positionOfRows=12;
                 }
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Description__c !=undefined){
                     doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Description__c, 10, 176);
                     positionOfRows=4;
 
                 }if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Description__c !=undefined){
                     doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Description__c, 10, 181);
                     positionOfRows=0;
                 }
                 
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Value__c >0){
                
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Value__c.toFixed(2)), 144, 161);
                 }
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Value__c>0){
                  
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Value__c.toFixed(2)), 144, 166);
                 }
 
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Value__c>0){
                
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Value__c.toFixed(2)), 144, 171);
                 }
 
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Value__c>0){
                  
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Value__c.toFixed(2)), 144, 176);
                 }
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Value__c>0){
                 
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Value__c.toFixed(2)), 144, 181);
                 } 
                 doc.setFont("roboto", "bold");  
                 doc.setDrawColor(229,229,229);
                 doc.setFillColor(229, 229, 229);
                 doc.rect(10, 188-parseInt(positionOfRows), 185, 6,"FD"); 
                 doc.text("TOTAL",122,192-parseInt(positionOfRows));
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_tax_values__c==undefined){
                     doc.text("$0.00", 144, 192-parseInt(positionOfRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_tax_values__c.toFixed(2)), 144, 192-parseInt(positionOfRows));
                }
                if(this.currentRecordPdf[0].staffpayrollData.Current_Pre_Tax_YTD__c==undefined){
                 doc.text("$0.00", 179, 192-parseInt(positionOfRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Pre_Tax_YTD__c.toFixed(2)), 179, 192-parseInt(positionOfRows));
                 }
                 doc.setFont("roboto", "bold");
                 doc.text("TAX",10,197-parseInt(positionOfRows));
                 doc.text("PAYG",10,202-parseInt(positionOfRows));
                 doc.setFont("roboto", "");
                 if(this.currentRecordPdf[0].staffpayrollData.Tax__c==undefined){
                     doc.text("$0.00", 144, 202-parseInt(positionOfRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Tax__c.toFixed(2)), 144, 202-parseInt(positionOfRows));
         
                 } 
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c==undefined){
                     doc.text("$0.00", 179, 202-parseInt(positionOfRows));
                 }else{
                      doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c.toFixed(2)), 179, 202-parseInt(positionOfRows));
                 }
                 doc.setDrawColor(229,229,229);
                 doc.setFillColor(229, 229, 229);
                 doc.setFont("roboto", "bold");
                 doc.rect(10, 203-parseInt(positionOfRows), 185, 6,"FD"); 
                 doc.text("TOTAL",122,207-parseInt(positionOfRows));
                 if(this.currentRecordPdf[0].staffpayrollData.Tax__c==undefined){
                     doc.text("$0.00", 144, 207-parseInt(positionOfRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Tax__c.toFixed(2)), 144, 207-parseInt(positionOfRows));
         
                 } 
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c==undefined){
                     doc.text("$0.00", 179, 207-parseInt(positionOfRows));
                 }else{
                      doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c.toFixed(2)), 179, 207-parseInt(positionOfRows));
                 }
         
                 doc.text("SUPERANNUATION",10,216-parseInt(positionOfRows)); 
                 if(this.currentRecordPdf[0].staffData.Superannuation_Number__c ==undefined){
                     doc.text("Guaranteed Superannuation",10,224-parseInt(positionOfRows));
                 }else{
                     doc.text("Super Annuation | Account Number - "+this.currentRecordPdf[0].staffData.Superannuation_Number__c ,10,224-parseInt(positionOfRows));
                 }
                 doc.setFont("roboto", "");
                 if(this.currentRecordPdf[0].staffpayrollData.Super_Annuation_Final__c==undefined){
                     doc.text("$0.00", 144, 224-parseInt(positionOfRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Super_Annuation_Final__c .toFixed(2)), 144, 224-parseInt(positionOfRows));
                 }
         
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Superannuation_YTD__c==undefined){
                     doc.text("$0.00", 179, 224-parseInt(positionOfRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Superannuation_YTD__c.toFixed(2)), 179, 224-parseInt(positionOfRows));
                 }
                 if(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c){
                     if(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c =='Fixed'){  
                         doc.text("Voluntary Superannuation-Fixed",10,232-parseInt(positionOfRows));
                         doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Fixed__c.toFixed(2)), 144, 232-parseInt(positionOfRows));
                     }else{
                         doc.text("Voluntary Superannuation-Percentage ("+this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Percent__c+"%)",10,232-parseInt(positionOfRows)); 
                         //doc.text(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Percent__c +"%", 97,232-parseInt(positionOfRows) );
                         doc.text(dollarUSLocale.format(parseFloat(this.currentRecordPdf[0].staffpayrollData.Voluntary_Percent_Values__c.toFixed(2))), 144, 232-parseInt(positionOfRows));
                     } 
                 }else{
                     doc.text("Voluntary Superannuation",10,232-parseInt(positionOfRows));
                     doc.text("$0.00", 144, 232-parseInt(positionOfRows));
                    
                 }
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Voluntary_Superannuation_YTD__c==undefined){
                    doc.text("$0.00", 179, 232-parseInt(positionOfRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Voluntary_Superannuation_YTD__c.toFixed(2)), 179, 232-parseInt(positionOfRows));
                }
                 doc.setDrawColor(235,235,235);
                 doc.setFillColor(235, 235, 235);
                 doc.setFont("roboto", "bold");
                 doc.rect(10, 235-parseInt(positionOfRows), 185, 6,"FD"); 
                 doc.text("TOTAL",122,239-parseInt(positionOfRows));
                 
                 if(this.currentRecordPdf[0].staffpayrollData.Super_And_Voluntary_Supper_Annuation__c==undefined){
                     doc.text("$0.00", 144, 239-parseInt(positionOfRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Super_And_Voluntary_Supper_Annuation__c .toFixed(2)), 144, 239-parseInt(positionOfRows));
                 }
         
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Super_and_Voluntaryannuation_YTD__c==undefined){
                    doc.text("$0.00", 179, 240-parseInt(positionOfRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Super_and_Voluntaryannuation_YTD__c.toFixed(2)), 179, 240-parseInt(positionOfRows));
                }
                 doc.setFont("roboto", "bold");
                 doc.text("Post Tax Deductions ",10,248-parseInt(positionOfRows));
                 doc.setFont("roboto", "");
                 let posttaxRow=5
                 if(this.currentRecordPdf[0].staffpayrollData.Post_Tax_Decription__c !=undefined){
                     doc.text(this.currentRecordPdf[0].staffpayrollData.Post_Tax_Decription__c, 10, 253-parseInt(positionOfRows));
                     posttaxRow=0
                 }
         
                 if(this.currentRecordPdf[0].staffpayrollData.Post_tax_values__c==undefined)
                 {   
                     doc.text("$0.00", 144, 253-parseInt(positionOfRows)-parseInt(posttaxRow));
                 }
                 else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Post_tax_values__c.toFixed(2)), 144, 253-parseInt(positionOfRows)-parseInt(posttaxRow));
                 }
                 
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Post_Tax_YTD__c==undefined){
                     doc.text("$0.00", 179, 253-parseInt(positionOfRows)-parseInt(posttaxRow));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Post_Tax_YTD__c.toFixed(2)), 179, 253-parseInt(positionOfRows)-parseInt(posttaxRow));
                 }
                 doc.text("Reimbursements",10,258-parseInt(positionOfRows));
     
                 if(this.currentRecordPdf[0].staffpayrollData.Reimbursements__c==undefined)
                 {
                     doc.text("$0.00", 144, 258-parseInt(positionOfRows));
                 }
                 else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Reimbursements__c.toFixed(2)), 144, 258-parseInt(positionOfRows));
                 }
                
 
                 doc.line(10, 260-parseInt(positionOfRows), 195, 260-parseInt(positionOfRows));
                 //doc.text("Gross Salary",12,263-parseInt(positionOfRows));
                 //Maheswari start few line 
                 doc.setDrawColor(229,229,229);
                 doc.setFillColor(229, 229, 229);
                 doc.rect(10, 260-parseInt(positionOfRows), 185, 6,"FD"); //265
                 doc.text("Gross Salary",12,264-parseInt(positionOfRows));
 
                 doc.setDrawColor(229,229,229);
                 doc.setFillColor(229, 229, 229);
                 doc.rect(10, 270-parseInt(positionOfRows), 185, 6,"FD");//273 maheswari code end
               
                 //Gross Salary
                 if(this.currentRecordPdf[0].staffpayrollData.Gross_Salary_Display__c==undefined)
                 {
                     doc.text("$0.00", 144, 264-parseInt(positionOfRows));
                 }
                 else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary_Display__c.toFixed(2)), 144, 264-parseInt(positionOfRows));
                 }
         
                 //Gross Salary YTD        
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Taxble_Gross_Salary_YTD__c==undefined)
                 {
                     doc.text("$0.00", 179,264-parseInt(positionOfRows));
                 }
                 else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Taxble_Gross_Salary_YTD__c.toFixed(2)), 179,264-parseInt(positionOfRows));
                 }  
                 
                 doc.text("NET SALARY",12,275-parseInt(positionOfRows));
                  //Net Salary
                 if(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c==undefined){
                     doc.text("$0.00", 144, 274-parseInt(positionOfRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c.toFixed(2)), 144, 274-parseInt(positionOfRows));
                 }
 
                 //Net YTD Salary
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Net_Pay_Salary_YTD__c==undefined){
                     doc.text("$0.00", 179, 274-parseInt(positionOfRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Net_Pay_Salary_YTD__c.toFixed(2)), 179, 274-parseInt(positionOfRows));
                 }
             
             
             }else{

                doc.setFont("roboto", "");
                doc.setFontSize(10);
                doc.text("Pre TAX",10,155);
                if(this.currentRecordPdf[0].staffpayrollData.Pre_tax_values__c==undefined){
                    doc.text("$0.00", 144, 155);
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_tax_values__c.toFixed(2)), 144, 155);
                }
                
                if(this.currentRecordPdf[0].staffpayrollData.Current_Pre_Tax_YTD__c==undefined){
                    doc.text("$0.00", 179, 155);
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Pre_Tax_YTD__c.toFixed(2)), 179, 155);
                }   

                doc.setFont("roboto", "bold");
                doc.text("TAX",10,160);
                doc.text("PAYG",10,165);
                doc.setFont("roboto", "");
                if(this.currentRecordPdf[0].staffpayrollData.Tax__c==undefined){
                    doc.text("$0.00", 144, 165);
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Tax__c.toFixed(2)), 144, 165);
        
                } 
                if(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c==undefined){
                    doc.text("$0.00", 179, 165);
                }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c.toFixed(2)), 179, 165);
                }
                doc.setDrawColor(229,229,229);
                doc.setFillColor(229, 229, 229);
                doc.setFont("roboto", "bold");
                doc.rect(10, 170, 185, 6,"FD"); 
                doc.text("TOTAL",122,174);
                if(this.currentRecordPdf[0].staffpayrollData.Tax__c==undefined){
                    doc.text("$0.00", 144, 174);
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Tax__c.toFixed(2)), 144, 174);
        
                } 
                if(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c==undefined){
                    doc.text("$0.00", 179, 173);
                }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c.toFixed(2)), 179, 173);
                }
        
                doc.text("SUPERANNUATION",10,181); 
                if(this.currentRecordPdf[0].staffData.Superannuation_Number__c ==undefined){
                    doc.text("Guaranteed Superannuation",10,186);
                }else{
                    doc.text("Super Annuation | Account Number - "+this.currentRecordPdf[0].staffData.Superannuation_Number__c ,10,186);
                }
                doc.setFont("roboto", "");
                if(this.currentRecordPdf[0].staffpayrollData.Super_Annuation_Final__c==undefined){
                    doc.text("$0.00", 144, 186);
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Super_Annuation_Final__c .toFixed(2)), 144, 186);
                }
        
                if(this.currentRecordPdf[0].staffpayrollData.Current_Superannuation_YTD__c==undefined){
                    doc.text("$0.00", 179, 186);
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Superannuation_YTD__c.toFixed(2)), 179, 186);
                }
                if(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c){
                    if(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c =='Fixed'){  
                        doc.text("Voluntary Superannuation-Fixed",10,191);
                        doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Fixed__c.toFixed(2)), 144, 191);
                    }else{
                        doc.text("Voluntary Superannuation-Percentage ("+this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Percent__c+"%)",10,191); 
                        //doc.text(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Percent__c +"%", 97,232-parseInt(positionOfRows) );
                        doc.text(dollarUSLocale.format(parseFloat(this.currentRecordPdf[0].staffpayrollData.Voluntary_Percent_Values__c.toFixed(2))), 144, 191);
                    } 
                }else{
                    doc.text("Voluntary Superannuation",10,191);
                    doc.text("$0.00", 144, 191);
                   
                }
                if(this.currentRecordPdf[0].staffpayrollData.Current_Voluntary_Superannuation_YTD__c==undefined){
                    doc.text("$0.00", 179,191);
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Voluntary_Superannuation_YTD__c.toFixed(2)), 179, 191);
                }
                doc.setDrawColor(235,235,235);
                doc.setFillColor(235, 235, 235);
                doc.setFont("roboto", "bold");
                doc.rect(10, 194, 185, 6,"FD"); 
                doc.text("TOTAL",122,198);
                
                if(this.currentRecordPdf[0].staffpayrollData.Super_And_Voluntary_Supper_Annuation__c==undefined){
                    doc.text("$0.00", 144, 198);
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Super_And_Voluntary_Supper_Annuation__c .toFixed(2)), 144, 198);
                }
        
                if(this.currentRecordPdf[0].staffpayrollData.Current_Super_and_Voluntaryannuation_YTD__c==undefined){
                    doc.text("$0.00", 179, 198);
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Super_and_Voluntaryannuation_YTD__c.toFixed(2)), 179, 198);
                } 
                doc.setFont("roboto", "bold");
                doc.text("Post Tax Deductions ",10,204);
                doc.setFont("roboto", "");
                let posttaxRow=5
                if(this.currentRecordPdf[0].staffpayrollData.Post_Tax_Decription__c !=undefined){
                    doc.text(this.currentRecordPdf[0].staffpayrollData.Post_Tax_Decription__c, 10, 209);
                    posttaxRow=0
                }
        
                if(this.currentRecordPdf[0].staffpayrollData.Post_tax_values__c==undefined)
                {   
                    doc.text("$0.00", 144, 209-parseInt(posttaxRow));
                }
                else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Post_tax_values__c.toFixed(2)), 144, 209-parseInt(posttaxRow));
                }
                
                if(this.currentRecordPdf[0].staffpayrollData.Current_Post_Tax_YTD__c==undefined){
                    doc.text("$0.00", 179, 209-parseInt(posttaxRow));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Post_Tax_YTD__c.toFixed(2)), 179, 209-parseInt(posttaxRow));
                }
                doc.text("Reimbursements",10,214);
    
                if(this.currentRecordPdf[0].staffpayrollData.Reimbursements__c==undefined)
                {
                    doc.text("$0.00", 144, 214);
                }
                else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Reimbursements__c.toFixed(2)), 144, 214);
                }
               
                doc.setDrawColor(229,229,229);
                doc.setFillColor(229, 229, 229);
                doc.rect(10, 219, 185, 6,"FD"); //265
                doc.text("Gross Salary",12,223);

                //Gross Salary
                if(this.currentRecordPdf[0].staffpayrollData.Gross_Salary_Display__c==undefined)
                {
                    doc.text("$0.00", 144, 223);
                }
                else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary_Display__c.toFixed(2)), 144, 223);
                }
        
                //Gross Salary YTD        
                if(this.currentRecordPdf[0].staffpayrollData.Current_Taxble_Gross_Salary_YTD__c==undefined)
                {
                    doc.text("$0.00", 179,223);
                }
                else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Taxble_Gross_Salary_YTD__c.toFixed(2)), 179,223);
                }  
                doc.setDrawColor(229,229,229);
                doc.setFillColor(229, 229, 229);
                doc.rect(10, 227, 185, 6,"FD");//273 maheswari code end
                doc.text("NET SALARY",12,231);
                 //Net Salary
                if(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c==undefined){
                    doc.text("$0.00", 144, 231);
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c.toFixed(2)), 144, 231);
                }

                //Net YTD Salary
                if(this.currentRecordPdf[0].staffpayrollData.Current_Net_Pay_Salary_YTD__c==undefined){
                    doc.text("$0.00", 179, 231);
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Net_Pay_Salary_YTD__c.toFixed(2)), 179, 231);
                }
                
         }
        /*  var paySlipName = this.currentRecordPdf[0].staffpayrollData.Name; */
        var paySlipName = this.currentRecordPdf[0].staffpayrollData.Name;
         var docName=paySlipName+'.pdf';
        // console.log('public holiday');
         this.base64string = btoa(doc.output());
        // console.log('public staffEmail',this.currentRecordPdf[0].staffpayrollData.Email_Address__c);
         this.staffEmail = this.currentRecordPdf[0].staffData.Email_Address__c;
         //doc.save(paySlipName);
         
         uploadFile({base64:JSON.stringify(this.base64string), filename:docName, recordId: this.currentRecordPdf[0].staffpayrollData.Id, obj:'audit'}).then(result=>{
            // console.log('data'); 
             const event = new ShowToastEvent({
                 title: '',
                 message: 'Pay Slip '+docName+ ' generated successfully',
                 variant: 'Success',
                 mode: 'dismissable'
             });
             this.dispatchEvent(event);  
            
         }).catch(error =>{
             console.error('Received error from server: ', error);
         });
        
        this.handleClick();
     }
     handleClick() {
        // console.log('data',JSON.stringify(this.base64string) );
         emailAttach({ base64: JSON.stringify(this.base64string) ,staffEmail:this.staffEmail,subjectName:this.subjectName,startEndDate:this.startEndDate,orgEmail:this.orgEmail,orgName:this.orgName}).then(result => {
            // console.log('data');
         });
     }

}