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
        doc.line(10, 86, 195, 86);
       
        doc.text("SALARY & WAGES",10,93);
        doc.setFont("roboto", "bold");
        doc.text("RATE",122,93);
        doc.setFont("roboto", "");
        
        doc.setFont("roboto", "");
        doc.setFontSize(10);
       
        let positionOFHourRows=0;

       if(this.currentRecordPdf[0].staffpayrollData.General_Shift_Hour__c > 0 ){
        doc.text("General Shift Hours",10,99-parseInt(positionOFHourRows));
        doc.text((this.currentRecordPdf[0].staffpayrollData.General_Shift_Hour__c).toString(), 97, 99-parseInt(positionOFHourRows));
        let generalShiftrate=this.currentRecordPdf[0].staffData.Working_Hours_Rate__c >=0 ?parseFloat(this.currentRecordPdf[0].staffData.Working_Hours_Rate__c) : 0;
        doc.text(dollarUSLocale.format(generalShiftrate).toString(), 122, 99-parseInt(positionOFHourRows));

       }else{
          positionOFHourRows +=6;
       }

       if(this.currentRecordPdf[0].staffpayrollData.Afternoon_shift_Hours__c > 0 ){ 

        doc.text("Afternoon Shift Hours",10,105-parseInt(positionOFHourRows));
        doc.text((this.currentRecordPdf[0].staffpayrollData.Afternoon_shift_Hours__c).toString(), 97, 105-parseInt(positionOFHourRows));
        let AfterNoonRate=this.currentRecordPdf[0].staffpayrollData.Afternoon_shift_Hourly_Rate__c >=0 ?parseFloat(this.currentRecordPdf[0].staffpayrollData.Afternoon_shift_Hourly_Rate__c) : 0;
        doc.text(dollarUSLocale.format(AfterNoonRate).toString(), 122, 105-parseInt(positionOFHourRows));
       }else{
        positionOFHourRows +=6;
       }
      if(this.currentRecordPdf[0].staffpayrollData.Night_Shift_Hours__c > 0 ){ 
        doc.text("Night  Shift Hours",10,111-parseInt(positionOFHourRows));
        doc.text((this.currentRecordPdf[0].staffpayrollData.Night_Shift_Hours__c).toString(), 97, 111-parseInt(positionOFHourRows));
        let nightShiftRate=this.currentRecordPdf[0].staffpayrollData.Night_shift_Hourly_Rate__c >=0 ?parseFloat(this.currentRecordPdf[0].staffpayrollData.Night_shift_Hourly_Rate__c) : 0;
        doc.text(dollarUSLocale.format(nightShiftRate).toString(), 122,111-parseInt(positionOFHourRows) );

      } else{
        positionOFHourRows +=6;
       }

      if(this.currentRecordPdf[0].staffpayrollData.Saturday_hours__c> 0 ){ 
        doc.text("Saturday Shift Hours",10,117-parseInt(positionOFHourRows));
        doc.text((this.currentRecordPdf[0].staffpayrollData.Saturday_hours__c).toString(), 97, 117-parseInt(positionOFHourRows));
        let saturdayRate=this.currentRecordPdf[0].staffpayrollData.Saturday_Hourly_Rate__c >=0 ?parseFloat(this.currentRecordPdf[0].staffpayrollData.Saturday_Hourly_Rate__c) : 0;
        doc.text(dollarUSLocale.format(saturdayRate).toString(), 122, 117-parseInt(positionOFHourRows));

      }else{
        positionOFHourRows +=6;
       }

     if(this.currentRecordPdf[0].staffpayrollData.Sunday_hours__c > 0 ){ 
        doc.text("Sunday Shift Hours",10,123-parseInt(positionOFHourRows));
        doc.text((this.currentRecordPdf[0].staffpayrollData.Sunday_hours__c).toString(), 97, 123-parseInt(positionOFHourRows));
        let saturdayRate=this.currentRecordPdf[0].staffpayrollData.Sunday_Hourly_Rate__c >=0 ?parseFloat(this.currentRecordPdf[0].staffpayrollData.Sunday_Hourly_Rate__c) : 0;
        doc.text(dollarUSLocale.format(saturdayRate).toString(), 122, 123-parseInt(positionOFHourRows));
     }else{
        positionOFHourRows +=6;
      }
      
      if(this.currentRecordPdf[0].staffpayrollData.Public_Holiday__c> 0 ){ 
        doc.text("Public Holiday Hours",10,129-parseInt(positionOFHourRows));
        doc.text((this.currentRecordPdf[0].staffpayrollData.Public_Holiday__c).toString(), 97, 129-parseInt(positionOFHourRows));
        let holidayRate=this.currentRecordPdf[0].staffpayrollData.Holiday_Hourly_Rate__c >=0 ?parseFloat(this.currentRecordPdf[0].staffpayrollData.Holiday_Hourly_Rate__c) : 0;
        doc.text(dollarUSLocale.format(holidayRate).toString(), 122, 129-parseInt(positionOFHourRows));
     }else{
        positionOFHourRows +=6;
      }

      if(this.currentRecordPdf[0].staffpayrollData.Sleepover_Hours__c > 0 ){  
        doc.text("Sleepover Shift Hours",10,135-parseInt(positionOFHourRows));
        doc.text((this.currentRecordPdf[0].staffpayrollData.Sleepover_Hours__c).toString(), 97, 135-parseInt(positionOFHourRows));
        doc.text(" --", 122, 135-parseInt(positionOFHourRows));
      }else{
        positionOFHourRows +=6;
       }
      if(this.currentRecordPdf[0].staffpayrollData.Extended_Duration__c > 0 ){   
        doc.text("Extended Hours",10,141-parseInt(positionOFHourRows));
        doc.text((this.currentRecordPdf[0].staffpayrollData.Extended_Duration__c).toString(), 97, 141-parseInt(positionOFHourRows));
        doc.text(" --", 122, 141-parseInt(positionOFHourRows));
      }else{
        positionOFHourRows +=6;
       }
      
      if(this.currentRecordPdf[0].staffpayrollData.Sleepover_Night_Shift_hours__c > 0 ){    
        //  console.log('Sleepover_Night_Shift_hours__c Hours'+this.currentRecordPdf[0].staffpayrollData.Sleepover_Night_Shift_hours__c );
        doc.text("Sleepover Night Hours",10,147-parseInt(positionOFHourRows));
        doc.text((this.currentRecordPdf[0].staffpayrollData.Sleepover_Night_Shift_hours__c).toString(), 97, 147-parseInt(positionOFHourRows));
        doc.text(" --", 122, 147-parseInt(positionOFHourRows));
      }else{
        positionOFHourRows +=6;
       }
       
      if(this.currentRecordPdf[0].staffpayrollData.Custom_Shift_Hours__c > 0 ){     
            //  console.log('Custom Shift Hours'+this.currentRecordPdf[0].staffpayrollData.Custom_Shift_Hours__c );
            doc.text("Custom Shift Hours",10,153-parseInt(positionOFHourRows));
            doc.text((this.currentRecordPdf[0].staffpayrollData.Custom_Shift_Hours__c).toString(), 97, 153-parseInt(positionOFHourRows));
            doc.text(" --", 122, 153-parseInt(positionOFHourRows));
      }else{
        positionOFHourRows +=6;
       } 
      if(parseFloat(this.currentRecordPdf[0].staffpayrollData.Working_Hours__c) > 0 ){     
        doc.text("Total Hours",10,158-parseInt(positionOFHourRows));
        doc.text((this.currentRecordPdf[0].staffpayrollData.Working_Hours__c).toString(), 97, 158-parseInt(positionOFHourRows));
        doc.text(" --", 122, 158-parseInt(positionOFHourRows));
      }
    
        if(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c==undefined){
            doc.text("$0.00", 144, 158-parseInt(positionOFHourRows));
            }else{
           doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c.toFixed(2)), 144, 158-parseInt(positionOFHourRows));
            }

            if(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c==undefined){
           doc.text("$0.00", 179, 158-parseInt(positionOFHourRows));
             }else{
           doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c.toFixed(2)), 179, 158-parseInt(positionOFHourRows));
            }
            doc.setDrawColor(229,229,229);
            doc.setFillColor(229, 229, 229);
            doc.rect(10, 160-parseInt(positionOFHourRows), 185, 6,"FD");
            doc.setFont("roboto", "bold");
            doc.text("TOTAL",122,164-parseInt(positionOFHourRows));
            doc.setFontSize(10);
            if(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c==undefined){
                doc.text("$0.00", 144, 164-parseInt(positionOFHourRows));
            }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c.toFixed(2)), 144, 164-parseInt(positionOFHourRows));
            }
        
            if(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c==undefined){
                    doc.text("$0.00", 179, 164-parseInt(positionOFHourRows));
             }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c.toFixed(2)), 179, 164-parseInt(positionOFHourRows));
            }
         // new condition added by praveen for pre tax
         if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Value__c >0 || this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Value__c >0
             || this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Value__c >0  || this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Value__c >0
             || this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Value__c >0){
               
               
                 
                 doc.text("Pre TAX Deductions",10,170-parseInt(positionOFHourRows));
                 doc.setFont("roboto", "");
                 doc.setFontSize(10);
                 let positionOfRows=0;
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Description__c !=undefined){
                     doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Description__c, 10, 175-parseInt(positionOFHourRows));
                     positionOfRows=28;
                 }
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Description__c !=undefined){
                     doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Description__c, 10, 180-parseInt(positionOFHourRows));
                     positionOfRows=20;
                 }
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Description__c !=undefined){
                     doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Description__c, 10, 185-parseInt(positionOFHourRows));
                     positionOfRows=12;
                 }
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Description__c !=undefined){
                     doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Description__c, 10, 190-parseInt(positionOFHourRows));
                     positionOfRows=4;
 
                 }if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Description__c !=undefined){
                     doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Description__c, 10, 195-parseInt(positionOFHourRows));
                     positionOfRows=0;
                 }
                 
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Value__c >0){
                
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Value__c.toFixed(2)), 144, 175-parseInt(positionOFHourRows));
                 }
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Value__c>0){
                  
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Value__c.toFixed(2)), 144, 180-parseInt(positionOFHourRows));
                 }
 
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Value__c>0){
                
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Value__c.toFixed(2)), 144, 185-parseInt(positionOFHourRows));
                 }
 
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Value__c>0){
                  
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Value__c.toFixed(2)), 144, 190-parseInt(positionOFHourRows));
                 }
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Value__c>0){
                 
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Value__c.toFixed(2)), 144, 195-parseInt(positionOFHourRows));
                 } 
                 doc.setFont("roboto", "bold");  
                 doc.setDrawColor(229,229,229);
                 doc.setFillColor(229, 229, 229);
                 doc.rect(10, 204-parseInt(positionOfRows)-parseInt(positionOFHourRows), 185, 6,"FD"); 
                 doc.text("TOTAL",122,208-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_tax_values__c==undefined){
                     doc.text("$0.00", 144, 208-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_tax_values__c.toFixed(2)), 144, 208-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                }
                if(this.currentRecordPdf[0].staffpayrollData.Current_Pre_Tax_YTD__c==undefined){
                 doc.text("$0.00", 179, 208-parseInt(positionOfRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Pre_Tax_YTD__c.toFixed(2)), 179, 208-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
                 doc.setFont("roboto", "bold");
                 doc.text("TAX",10,213-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 doc.text("PAYG",10,217-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 doc.setFont("roboto", "");
                 if(this.currentRecordPdf[0].staffpayrollData.Tax__c==undefined){
                     doc.text("$0.00", 144, 216-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Tax__c.toFixed(2)), 144, 216-parseInt(positionOfRows)-parseInt(positionOFHourRows));
         
                 } 
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c==undefined){
                     doc.text("$0.00", 179, 216-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }else{
                      doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c.toFixed(2)), 179, 216-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
                 doc.setDrawColor(229,229,229);
                 doc.setFillColor(229, 229, 229);
                 doc.setFont("roboto", "bold");
                 doc.rect(10, 221-parseInt(positionOfRows)-parseInt(positionOFHourRows), 185, 6,"FD"); 
                 doc.text("TOTAL",122,225-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 if(this.currentRecordPdf[0].staffpayrollData.Tax__c==undefined){
                     doc.text("$0.00", 144, 225-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Tax__c.toFixed(2)), 144, 225-parseInt(positionOfRows)-parseInt(positionOFHourRows));
         
                 } 
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c==undefined){
                     doc.text("$0.00", 179, 225-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }else{
                      doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c.toFixed(2)), 179, 225-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
         
                 doc.text("SUPERANNUATION",10,232-parseInt(positionOfRows)-parseInt(positionOFHourRows)); 
                 if(this.currentRecordPdf[0].staffData.Superannuation_Number__c ==undefined){
                     doc.text("Guaranteed Superannuation",10,237-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }else{
                     doc.text("Super Annuation | Account Number - "+this.currentRecordPdf[0].staffData.Superannuation_Number__c ,10,237-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
                 doc.setFont("roboto", "");
                 if(this.currentRecordPdf[0].staffpayrollData.Super_Annuation_Final__c==undefined){
                     doc.text("$0.00", 144, 237-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Super_Annuation_Final__c .toFixed(2)), 144, 237-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
         
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Superannuation_YTD__c==undefined){
                     doc.text("$0.00", 179, 237-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Superannuation_YTD__c.toFixed(2)), 179, 237-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
                 if(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c){
                     if(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c =='Fixed'){  
                         doc.text("Voluntary Superannuation-Fixed",10,242-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                         doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Fixed__c.toFixed(2)), 144, 242-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                     }else{
                         doc.text("Voluntary Superannuation-Percentage ("+this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Percent__c+"%)",10,242-parseInt(positionOfRows)-parseInt(positionOFHourRows)); 
                         //doc.text(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Percent__c +"%", 97,232-parseInt(positionOfRows) );
                         doc.text(dollarUSLocale.format(parseFloat(this.currentRecordPdf[0].staffpayrollData.Voluntary_Percent_Values__c.toFixed(2))), 144, 242-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                     } 
                 }else{
                     doc.text("Voluntary Superannuation",10,242-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                     doc.text("$0.00", 144, 242-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                    
                 }
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Voluntary_Superannuation_YTD__c==undefined){
                    doc.text("$0.00", 179, 242-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Voluntary_Superannuation_YTD__c.toFixed(2)), 179, 242-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                }
                 doc.setDrawColor(235,235,235);
                 doc.setFillColor(235, 235, 235);
                 doc.setFont("roboto", "bold");
                 doc.rect(10, 246-parseInt(positionOfRows)-parseInt(positionOFHourRows), 185, 6,"FD"); 
                 doc.text("TOTAL",122,250-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 
                 if(this.currentRecordPdf[0].staffpayrollData.Super_And_Voluntary_Supper_Annuation__c==undefined){
                     doc.text("$0.00", 144, 250-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Super_And_Voluntary_Supper_Annuation__c .toFixed(2)), 144, 250-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
         
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Super_and_Voluntaryannuation_YTD__c==undefined){
                    doc.text("$0.00", 179, 250-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Super_and_Voluntaryannuation_YTD__c.toFixed(2)), 179, 250-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                }
                 doc.setFont("roboto", "bold");
                 doc.text("Post Tax Deductions ",10,256-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 doc.setFont("roboto", "");
                 let posttaxRow=5
                 if(this.currentRecordPdf[0].staffpayrollData.Post_Tax_Decription__c !=undefined){
                     doc.text(this.currentRecordPdf[0].staffpayrollData.Post_Tax_Decription__c, 10, 261-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                     posttaxRow=0
                 }
         
                 if(this.currentRecordPdf[0].staffpayrollData.Post_tax_values__c==undefined)
                 {   
                     doc.text("$0.00", 144, 261-parseInt(positionOfRows)-parseInt(posttaxRow)-parseInt(positionOFHourRows));
                 }
                 else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Post_tax_values__c.toFixed(2)), 144, 261-parseInt(positionOfRows)-parseInt(posttaxRow)-parseInt(positionOFHourRows));
                 }
                 
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Post_Tax_YTD__c==undefined){
                     doc.text("$0.00", 179, 261-parseInt(positionOfRows)-parseInt(posttaxRow)-parseInt(positionOFHourRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Post_Tax_YTD__c.toFixed(2)), 179, 261-parseInt(positionOfRows)-parseInt(posttaxRow)-parseInt(positionOFHourRows));
                 }
                 doc.line(10, 263-parseInt(positionOfRows)-parseInt(positionOFHourRows), 195, 263-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 doc.text("Reimbursements",10,268-parseInt(positionOfRows)-parseInt(positionOFHourRows));
     
                 if(this.currentRecordPdf[0].staffpayrollData.Reimbursements__c==undefined)
                 {
                     doc.text("$0.00", 144, 268-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
                 else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Reimbursements__c.toFixed(2)), 144, 268-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
                
                 //Maheswari start few line 
                 doc.setDrawColor(229,229,229);
                 doc.setFillColor(229, 229, 229);

                doc.rect(10, 272-parseInt(positionOfRows)-parseInt(positionOFHourRows), 185, 6,"FD"); //265
               doc.text("Gross Salary",12,276-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 //Gross Salary
                 if(this.currentRecordPdf[0].staffpayrollData.Gross_Salary_Display__c==undefined)
                 {
                     doc.text("$0.00", 144, 276-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
                 else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary_Display__c.toFixed(2)), 144, 276-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
         
                 //Gross Salary YTD        
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Taxble_Gross_Salary_YTD__c==undefined)
                 {
                     doc.text("$0.00", 270,276-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
                 else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Taxble_Gross_Salary_YTD__c.toFixed(2)), 179,276-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 } 
                 doc.setDrawColor(229,229,229);
                 doc.setFillColor(229, 229, 229);
                 doc.rect(10, 280-parseInt(positionOfRows)-parseInt(positionOFHourRows), 185, 6,"FD");//273 maheswari code end
                
                 
                 doc.text("NET SALARY",12,285-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                  //Net Salary
                 if(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c==undefined){
                     doc.text("$0.00", 144, 285-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c.toFixed(2)), 144, 285-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
 
                 //Net YTD Salary
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Net_Pay_Salary_YTD__c==undefined){
                     doc.text("$0.00", 179, 285-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Net_Pay_Salary_YTD__c.toFixed(2)), 179, 285-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
             
             
             }else{
                positionOFHourRows=positionOFHourRows -18;
                doc.setFont("roboto", "");
                doc.setFontSize(10);
                doc.text("Pre TAX",10,155-parseInt(positionOFHourRows));
                if(this.currentRecordPdf[0].staffpayrollData.Pre_tax_values__c==undefined){
                    doc.text("$0.00", 144, 155-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_tax_values__c.toFixed(2)), 144, 155-parseInt(positionOFHourRows));
                }
                
                if(this.currentRecordPdf[0].staffpayrollData.Current_Pre_Tax_YTD__c==undefined){
                    doc.text("$0.00", 179, 155-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Pre_Tax_YTD__c.toFixed(2)), 179, 155-parseInt(positionOFHourRows));
                }   

                doc.setFont("roboto", "bold");
                doc.text("TAX",10,160-parseInt(positionOFHourRows));
                doc.text("PAYG",10,165-parseInt(positionOFHourRows));
                doc.setFont("roboto", "");
                if(this.currentRecordPdf[0].staffpayrollData.Tax__c==undefined){
                    doc.text("$0.00", 144, 165-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Tax__c.toFixed(2)), 144, 165-parseInt(positionOFHourRows));
        
                } 
                if(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c==undefined){
                    doc.text("$0.00", 179, 165-parseInt(positionOFHourRows));
                }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c.toFixed(2)), 179, 165-parseInt(positionOFHourRows));
                }
                doc.setDrawColor(229,229,229);
                doc.setFillColor(229, 229, 229);
                doc.setFont("roboto", "bold");
                doc.rect(10, 170-parseInt(positionOFHourRows), 185, 6,"FD"); 
                doc.text("TOTAL",122,174-parseInt(positionOFHourRows));
                if(this.currentRecordPdf[0].staffpayrollData.Tax__c==undefined){
                    doc.text("$0.00", 144, 174-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Tax__c.toFixed(2)), 144, 174-parseInt(positionOFHourRows));
        
                } 
                if(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c==undefined){
                    doc.text("$0.00", 179, 173-parseInt(positionOFHourRows));
                }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c.toFixed(2)), 179, 173-parseInt(positionOFHourRows));
                }
        
                doc.text("SUPERANNUATION",10,181-parseInt(positionOFHourRows)); 
                if(this.currentRecordPdf[0].staffData.Superannuation_Number__c ==undefined){
                    doc.text("Guaranteed Superannuation",10,186-parseInt(positionOFHourRows));
                }else{
                    doc.text("Super Annuation | Account Number - "+this.currentRecordPdf[0].staffData.Superannuation_Number__c ,10,186-parseInt(positionOFHourRows));
                }
                doc.setFont("roboto", "");
                if(this.currentRecordPdf[0].staffpayrollData.Super_Annuation_Final__c==undefined){
                    doc.text("$0.00", 144, 186-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Super_Annuation_Final__c .toFixed(2)), 144, 186-parseInt(positionOFHourRows));
                }
        
                if(this.currentRecordPdf[0].staffpayrollData.Current_Superannuation_YTD__c==undefined){
                    doc.text("$0.00", 179, 186-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Superannuation_YTD__c.toFixed(2)), 179, 186-parseInt(positionOFHourRows));
                }
                if(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c){
                    if(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c =='Fixed'){  
                        doc.text("Voluntary Superannuation-Fixed",10,191-parseInt(positionOFHourRows));
                        doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Fixed__c.toFixed(2)), 144, 191-parseInt(positionOFHourRows));
                    }else{
                        doc.text("Voluntary Superannuation-Percentage ("+this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Percent__c+"%)",10,191-parseInt(positionOFHourRows)); 
                        //doc.text(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Percent__c +"%", 97,232-parseInt(positionOfRows) );
                        doc.text(dollarUSLocale.format(parseFloat(this.currentRecordPdf[0].staffpayrollData.Voluntary_Percent_Values__c.toFixed(2))), 144, 191-parseInt(positionOFHourRows));
                    } 
                }else{
                    doc.text("Voluntary Superannuation",10,191-parseInt(positionOFHourRows));
                    doc.text("$0.00", 144, 191-parseInt(positionOFHourRows));
                   
                }
                if(this.currentRecordPdf[0].staffpayrollData.Current_Voluntary_Superannuation_YTD__c==undefined){
                    doc.text("$0.00", 179,191-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Voluntary_Superannuation_YTD__c.toFixed(2)), 179, 191-parseInt(positionOFHourRows));
                }
                doc.setDrawColor(235,235,235);
                doc.setFillColor(235, 235, 235);
                doc.setFont("roboto", "bold");
                doc.rect(10, 194-parseInt(positionOFHourRows), 185, 6,"FD"); 
                doc.text("TOTAL",122,198-parseInt(positionOFHourRows));
                
                if(this.currentRecordPdf[0].staffpayrollData.Super_And_Voluntary_Supper_Annuation__c==undefined){
                    doc.text("$0.00", 144, 198-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Super_And_Voluntary_Supper_Annuation__c .toFixed(2)), 144, 198-parseInt(positionOFHourRows));
                }
        
                if(this.currentRecordPdf[0].staffpayrollData.Current_Super_and_Voluntaryannuation_YTD__c==undefined){
                    doc.text("$0.00", 179, 198-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Super_and_Voluntaryannuation_YTD__c.toFixed(2)), 179, 198-parseInt(positionOFHourRows));
                } 
                doc.setFont("roboto", "bold");
                doc.text("Post Tax Deductions ",10,204-parseInt(positionOFHourRows));
                doc.setFont("roboto", "");
                let posttaxRow=5
                if(this.currentRecordPdf[0].staffpayrollData.Post_Tax_Decription__c !=undefined){
                    doc.text(this.currentRecordPdf[0].staffpayrollData.Post_Tax_Decription__c, 10, 209-parseInt(positionOFHourRows));
                    posttaxRow=0
                }
        
                if(this.currentRecordPdf[0].staffpayrollData.Post_tax_values__c==undefined)
                {   
                    doc.text("$0.00", 144, 209-parseInt(posttaxRow)-parseInt(positionOFHourRows));
                }
                else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Post_tax_values__c.toFixed(2)), 144, 209-parseInt(posttaxRow)-parseInt(positionOFHourRows));
                }
                
                if(this.currentRecordPdf[0].staffpayrollData.Current_Post_Tax_YTD__c==undefined){
                    doc.text("$0.00", 179, 209-parseInt(posttaxRow)-parseInt(positionOFHourRows)-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Post_Tax_YTD__c.toFixed(2)), 179, 209-parseInt(posttaxRow)-parseInt(positionOFHourRows));
                }
                doc.text("Reimbursements",10,214-parseInt(positionOFHourRows));
    
                if(this.currentRecordPdf[0].staffpayrollData.Reimbursements__c==undefined)
                {
                    doc.text("$0.00", 144, 214-parseInt(positionOFHourRows));
                }
                else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Reimbursements__c.toFixed(2)), 144, 214-parseInt(positionOFHourRows));
                }
               
                doc.setDrawColor(229,229,229);
                doc.setFillColor(229, 229, 229);
                doc.rect(10, 219-parseInt(positionOFHourRows), 185, 6,"FD"); //265
                doc.text("Gross Salary",12,223-parseInt(positionOFHourRows));

                //Gross Salary
                if(this.currentRecordPdf[0].staffpayrollData.Gross_Salary_Display__c==undefined)
                {
                    doc.text("$0.00", 144, 223-parseInt(positionOFHourRows));
                }
                else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary_Display__c.toFixed(2)), 144, 223-parseInt(positionOFHourRows));
                }
        
                //Gross Salary YTD        
                if(this.currentRecordPdf[0].staffpayrollData.Current_Taxble_Gross_Salary_YTD__c==undefined)
                {
                    doc.text("$0.00", 179,223-parseInt(positionOFHourRows));
                }
                else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Taxble_Gross_Salary_YTD__c.toFixed(2)), 179,223-parseInt(positionOFHourRows));
                }  
                doc.setDrawColor(229,229,229);
                doc.setFillColor(229, 229, 229);
                doc.rect(10, 227-parseInt(positionOFHourRows), 185, 6,"FD");//273 maheswari code end
                doc.text("NET SALARY",12,231-parseInt(positionOFHourRows));
                 //Net Salary
                if(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c==undefined){
                    doc.text("$0.00", 144, 231-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c.toFixed(2)), 144, 231-parseInt(positionOFHourRows));
                }

                //Net YTD Salary
                if(this.currentRecordPdf[0].staffpayrollData.Current_Net_Pay_Salary_YTD__c==undefined){
                    doc.text("$0.00", 179, 231-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Net_Pay_Salary_YTD__c.toFixed(2)), 179, 231-parseInt(positionOFHourRows));
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