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
  
    if (this.currentRecordPdf && Array.isArray(this.currentRecordPdf)) {
        this.currentRecordPdf = this.currentRecordPdf.map(record => {
            const allocationData = record.AllocationData || [];

            // Collect all shifts from all allocation items
            let allShifts = [];
            allocationData.forEach(item => {
                const shifts = [
                    { name: 'General', rate: item.General_Hourly_pay_rate__c, hours: item.General_Working_Hours__c },
                    { name: 'Morning', rate: item.Morning_Hourly_pay_rate__c, hours: item.Morning_Working_Hours__c },
                    { name: 'Long Morning', rate: item.Long_Morning_Hourly_Rate__c, hours: item.Long_Morning_Shift_Duartion__c },
                    { name: 'Morning Two', rate: item.Long_Morning_Rate_Two__c, hours: item.Long_Moring_Duration_Two__c },
                    { name: 'Afternoon', rate: item.Afternoon_shift_Hourly_Rate__c, hours: item.Afternoon_Shift_hours__c },
                    { name: 'Long Afternoon', rate: item.Long_Afternoon_Hourly_Rate__c, hours: item.Long_Afternoon_Shift_Duartion__c },
                    { name: 'Afternoon Two', rate: item.Long_Afternoon_Rate_Two__c, hours: item.Long_Afternoon_Duration_Two__c },
                    { name: 'Night', rate: item.Night_shift_Hourly_Rate__c, hours: item.Night_Shift_Hours__c },
                    { name: 'Long Night', rate: item.Long_Night_Hourly_Rate__c, hours: item.Long_Night_Shift_Duartion__c },
                    { name: 'Sleepover', rate: item.Sleepover_Shift_Hourly_Rate__c, hours: item.Sleepover_Shift_Hours__c },
                    { name: 'Sleepover Night', rate: item.Sleepover_Night_Shift_hourly_rate__c, hours: item.Sleepover_Night_shift_hours__c },
                    { name: 'Saturday', rate: item.Saturday_Hourly_Rate__c, hours: item.Saturday_Hours__c },
                    { name: 'Sunday', rate: item.Sunday_Hourly_Rate__c, hours: item.Sunday_hours__c },
                    { name: 'long Sleepover', rate: item.Long_Sleepover_Allowance__c, hours: item.Long_Sleepover_Duartion__c },
                    { name: 'Extended Hours', rate: item.Extended_Hourly_Rate__c, hours: item.Extended_Hours__c } ,
                    { name: 'Public Holiday', rate: item.Public_Holiday_Hour_Rate__c, hours: item.Public_Holiday_Hours__c } ,
                   
                   
                ];
                 if (item.Shift_Cancelled__c) {
                        shifts.push({
                            name: 'Cancelled',
                            rate: item.Shift_Cancel_Payment__c,
                            hours: 0
                        });
                  }
               
                 allShifts = allShifts.concat(shifts);
            });
                console.log('allShifts',JSON.stringify(allShifts));

            // Combine across all records
            const groupedShifts = this.combineSubsequentShifts(allShifts);
            console.log('groupedShifts',JSON.stringify(groupedShifts));

            return { ...record, groupedAllocationData: groupedShifts };
        });
    }
        
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

     
combineSubsequentShifts(shifts) {
    // Logical shift name groupings
    const shiftGroups = {
        General: ['General'],
        Morning: ['Long Morning', 'Morning Two','Morning'],
        Afternoon: ['Afternoon', 'Long Afternoon', 'Afternoon Two'],
        Night: ['Night', 'Long Night'],
        Sleepover: ['Sleepover', 'Sleepover Night','long Sleepover'],
        Saturday: ['Saturday'],
        Sunday: ['Sunday'],
        Extended: ['Extended Hours'],
        Holiday: ['Public Holiday'],

    };

    // Normalize name (e.g., "Long Morning" -> "Morning")
    const normalizeShiftName = (name) => {
        for (const baseName in shiftGroups) {
            if (shiftGroups[baseName].includes(name)) {
                return baseName;
            }
        }
        return name;
    };
    console.log('filtered groupshift BEFORE ',JSON.stringify(shifts));
    // Filter valid shifts and normalize names
    const normalizedShifts = shifts
        .map(shift => ({
            name: normalizeShiftName(shift.name),
            rawName: shift.name, // keep original name
            rate: parseFloat(shift.rate) || 0,
            hours: parseFloat(shift.hours) || 0
        }))
        .filter(shift => (shift.hours > 0 )||( shift.rawName === 'Cancelled') ); // remove invalid entries
     console.log('filtered groupshift',JSON.stringify(normalizedShifts));
    // Combine by same shift name and rate
    const combinedMap = new Map();

    normalizedShifts.forEach(shift => {
        const key = `${shift.name}-${shift.rate}`;
        // const key = JSON.stringify({ name: shift.name, rate: shift.rate });
        if (combinedMap.has(key)) {
            combinedMap.get(key).hours += shift.hours;
        } else {
            combinedMap.set(key, { ...shift }); // copy
        }
    });
      console.log('combined map',JSON.stringify(Array.from(combinedMap.values())));

    // Return combined values as array
    return Array.from(combinedMap.values());
}






    generatePayroll() {        

        function checkPageSpace(doc, currentY, neededSpace = 6) {
            const pageHeight = doc.internal.pageSize.height;
            if (currentY + neededSpace > pageHeight - 10) { // 10px margin from bottom
                console.log('Adding new page - reached bottom');
                doc.addPage();
                return 20; // Return new Y position for new page
            }
            return currentY; // Return same Y position
        }

        function addTextWithPageBreak(doc, text, x, currentY, spaceAfter = 6) {
            // Check if we have space for this line
            currentY = checkPageSpace(doc, currentY, spaceAfter);
            
            // Add the text
            doc.text(text, x, currentY);
            
            // Move to next line
            return currentY + spaceAfter;
        }

        function addMultipleLinesWithPageBreak(doc, lines, x, currentY, lineHeight = 6) {
            lines.forEach(line => {
                currentY = addTextWithPageBreak(doc, line, x, currentY, lineHeight);
            });
            return currentY;
        }


        // console.log('staffData.Base_Rate__c ', this.currentRecordPdf[0].staffData.Base_Rate__c);
         const { jsPDF } = window.jspdf;
         var doc = new jsPDF();
         doc.addImage(this.currentRecordPdf[0].bolbdata, "PNG", 10, 16, 70, 18);
         this.orgEmail = this.currentRecordPdf[0].organization.Email__c;
             
         doc.setDrawColor(229,229,229);
         doc.setFillColor(229, 229, 229);
         doc.rect(134, 15, 66, 33,"FD");
 
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
         doc.rect(134,50, 66, 35,"FD");
 
         doc.setFont("roboto", "bold");
         doc.setFontSize(10);
         doc.text("EMPLOYMENT DETAILS", 137, 55);
         doc.setFont("roboto", "");
         doc.setFontSize(10);

         const staffData = this.currentRecordPdf[0].staffData;
          console.log('staffData',JSON.stringify(staffData));
         console.log('NURSING AWARDS',staffData.Fixed_Rate_or_Not__c);
         console.log('NURSING AWARDS',staffData.Nursning_Awards__c);
         let awardsText = "---";
         if (staffData.Fixed_Rate_or_Not__c === true) {
            awardsText = "SCHADS";
        } else if (staffData.Nursning_Awards__c === true) {
            awardsText = "Nursing Awards";
        }
         doc.text("Award: " + awardsText, 137, 60);
         doc.text("Classification: "+(this.currentRecordPdf?.[0]?.staffData.StaffRoles__r?.[0]?.Classification_Level__c??"---"), 137, 65);
         doc.text("Pay Point: "+(this.currentRecordPdf?.[0]?.staffData.StaffRoles__r?.[0]?.Classification_Pay_Point__c??"---"), 137, 70);
         doc.text("Employment Type: "+(this.currentRecordPdf?.[0]?.staffData.StaffRoles__r?.[0]?.Type_of_Job__c??"---"), 137, 75);
         
         doc.text("Pay Frequency: "+(this.currentRecordPdf?.[0]?.staffpayrollData.Payroll_Setting__r?.Frequency__c??"---"), 137, 80);
         doc.text(this.currentRecordPdf[0].staffData.Name + ' ' + this.currentRecordPdf[0].staffData.Last_Name__c, 10, 70);
        // console.log(this.currentRecordPdf[0].staffData.Address__c.street);
         doc.text(this.currentRecordPdf[0].staffData.Address__c.street + ', ' +this.currentRecordPdf[0].staffData.Address__c.city, 10, 75);
         doc.text(this.currentRecordPdf[0].staffData.Address__c.state + ', ' + this.currentRecordPdf[0].staffData.Address__c.postalCode, 10,80);
         doc.setDrawColor(229,229,229);
         doc.setFillColor(229, 229, 229);
         doc.rect(10, 88, 190, 10,"FD");

         doc.text("Pay Period:", 12, 93);
         doc.text("Payment Date:", 72, 93);

         const oldDate = this.currentRecordPdf[0].staffpayrollData.Payroll_Setting__r.Period_Start_Date__c;
         const finalDate = this.currentRecordPdf[0].staffpayrollData.Payroll_Setting__r.Period_End_Date__c;
     
         const nextPayDate = this.currentRecordPdf[0].staffpayrollData.Pay_Date__c;

         // Split the date string at '-' char
         const arr = oldDate.split('-');
         const arr1 = finalDate.split('-');   
         if (nextPayDate != undefined || !nextPayDate == '' || !nextPayDate == null){
             const arr2 = nextPayDate.split('-');
             const nextPayDateFinal = arr2[2]+'/'+arr2[1]+'/'+arr2[0];
             doc.text(nextPayDateFinal, 94, 93);
         }
         const newDate = arr[2]+'/'+arr[1]+'/'+arr[0];
         const newfinalDate = arr1[2]+'/'+arr1[1]+'/'+arr1[0];
         

         doc.setFont("roboto", "bold");
         doc.setFontSize(10);
         doc.text(newDate + ' - ' + newfinalDate, 30, 93);
         this.subjectName = this.currentRecordPdf[0].staffData.Name + ' ' + this.currentRecordPdf[0].staffData.Last_Name__c +' Pay slip for the period ' + newDate +' to '+newfinalDate;
         this.startEndDate = ' Please find attached your pay slip for the pay period  ' + newDate +' to '+newfinalDate;
         this.orgName = this.currentRecordPdf[0].organization.Name;

         
         let dollarUSLocale = Intl.NumberFormat('en-US', { 
                                                 style: 'currency', 
                                                 currency: 'USD' 
                                             });
         doc.setFont("roboto", "");
         doc.setFontSize(10);
         doc.text("Total Earnings:", 120, 93);
         doc.setFont("roboto", "bold");
         if(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c==undefined){
             doc.text("$0.00", 143, 73);
        }else{
            doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c.toFixed(2)), 143, 93);
        }
        doc.setFont("roboto", "");
        doc.text("Net Pay:", 165, 93);  
        doc.setFont("roboto", "bold");
        if(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c==undefined){
            doc.text("$0.00", 179, 93);
        }else{
            doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c.toFixed(2)), 179, 93);
        } 
        doc.text("THIS PAY", 142, 103);
        doc.text("YTD", 182, 103); 
        doc.line(10, 106, 200, 106);
       
        doc.text("SALARY & WAGES",10,113);
        doc.setFont("roboto", "bold");
        doc.text("RATE",122,113);
        doc.setFont("roboto", "");
        
        doc.setFont("roboto", "");
        doc.setFontSize(10);
        const groupedData = this.currentRecordPdf[0].groupedAllocationData || [];
        let startY = 119;
        let positionOFHourRows=0;

      /*  const groupedShifts = this.currentRecordPdf[0].groupedAllocationData || [];

    if (groupedShifts.length > 0) {
        groupedShifts.forEach((shift) => {
            const shiftName = shift.name;
            const hours = shift.hours || 0;
            const rate = shift.rate || 0;
            const total = rate * hours;
             startY = checkPageSpace(doc, startY, 6);
            doc.text(`${shiftName} Shift Hours`, 10, startY + positionOFHourRows);
            doc.text(hours.toString(), 97, startY + positionOFHourRows);
            doc.text(dollarUSLocale.format(rate).toString(), 122, startY + positionOFHourRows);
            doc.text(dollarUSLocale.format(total).toString(), 144, startY + positionOFHourRows);
            
           startY += 6;
        });
    } else {
         startY = addTextWithPageBreak(doc, "No Shift Data Found", 10, startY);
    }  */
  
         // ---------------- SALARY & WAGES (SHIFT-WISE WITH YTD) ----------------

const groupedShifts = this.currentRecordPdf[0].groupedAllocationData || [];

// Backend YTD values
const shiftYtdMap = {
    General: this.currentRecordPdf[0].staffpayrollData.Current_General_Shift_Ytd__c || 0,
    Morning: this.currentRecordPdf[0].staffpayrollData.Current_Morning_Shift_Ytd__c || 0,
    Afternoon: this.currentRecordPdf[0].staffpayrollData.Current_Afternoon_Shift_Ytd__c || 0,
    Night: this.currentRecordPdf[0].staffpayrollData.Current_Night_Shift_Ytd__c || 0,
    Sleepover: this.currentRecordPdf[0].staffpayrollData.Current_Sleepover_Shift_Ytd__c || 0,
    Saturday: this.currentRecordPdf[0].staffpayrollData.Current_Saturday_Shift_Ytd__c || 0,
    Sunday: this.currentRecordPdf[0].staffpayrollData.Current_Sunday_Shift_Ytd__c || 0,
    Extended: this.currentRecordPdf[0].staffpayrollData.Current_Extended_Shift_Ytd__c || 0, 
    Holiday: this.currentRecordPdf[0].staffpayrollData.Current_Holiday_Shift_Ytd__c || 0
};

// Group shifts by name
const shiftsByName = {};
groupedShifts.forEach(shift => {
    if ((shift.hours || 0) <= 0) return;
    if (!shiftsByName[shift.name]) {
        shiftsByName[shift.name] = [];
    }
    shiftsByName[shift.name].push(shift);
});

// Track shifts present this cycle
const presentShifts = new Set(Object.keys(shiftsByName));

// Render shift rows
Object.keys(shiftsByName).forEach(shiftName => {
    const rows = shiftsByName[shiftName];
    const shiftYTD = shiftYtdMap[shiftName] || 0;

    rows.forEach((row, index) => {
        const hours = row.hours || 0;
        const rate = row.rate || 0;
        const total = rate * hours;

        startY = checkPageSpace(doc, startY, 6);

        doc.text(`${shiftName} `, 10, startY);/* @ ${rate} */
        doc.text(hours.toString(), 97, startY);
        doc.text(dollarUSLocale.format(rate), 122, startY);
        doc.text(dollarUSLocale.format(total), 144, startY);

        // ✅ YTD ONLY ON LAST ROW OF THE SHIFT
        if (index === rows.length - 1 && shiftYTD > 0) {
            doc.text(dollarUSLocale.format(shiftYTD), 179, startY);
        }

        startY += 6;
    });
});

// ---------------- OTHER SHIFT INCOME ----------------

let otherShiftIncomeYTD = 0;
Object.keys(shiftYtdMap).forEach(shiftName => {
    if (!presentShifts.has(shiftName)) {
        otherShiftIncomeYTD += shiftYtdMap[shiftName];
    }
});

if (otherShiftIncomeYTD > 0) {
    startY = checkPageSpace(doc, startY + 2, 6);
    doc.setFont("roboto", "");
    doc.text("Prior Period earnings", 10, startY);
    doc.setFont("roboto", "");
    doc.text(dollarUSLocale.format(otherShiftIncomeYTD), 179, startY);
    startY += 6;
}

    startY = checkPageSpace(doc, startY, 6);
     
      if(parseFloat(this.currentRecordPdf[0].staffpayrollData.Working_Hours__c) > 0 ){     
        doc.text("Total Hours",10,startY);
        doc.text((this.currentRecordPdf[0].staffpayrollData.Working_Hours__c).toString(), 97, startY);
        doc.text(" --", 122, startY);
        if(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c==undefined){
            doc.text("$0.00", 144, startY);
            }else{
           doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c.toFixed(2)), 144, startY);
            }

            if(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c==undefined){
           doc.text("$0.00", 179, startY);
             }else{
           doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c.toFixed(2)), 179, startY);
            }
        startY += 6;
      }
      startY = checkPageSpace(doc, startY, 10);
        
            doc.setDrawColor(229,229,229);
            doc.setFillColor(229, 229, 229);
            doc.rect(10, startY-4, 190, 6,"FD");
            doc.setFont("roboto", "bold");
            doc.text("TOTAL",122,startY);
            doc.setFontSize(10);
            if(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c==undefined){
                doc.text("$0.00", 144, startY);
            }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c.toFixed(2)), 144, startY);
            }
        
            if(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c==undefined){
                    doc.text("$0.00", 179, startY);
             }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c.toFixed(2)), 179, startY);
            }
           startY += 6;
           startY = checkPageSpace(doc, startY, 10);
         // new condition added by praveen for pre tax
         if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Value__c >0 || this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Value__c >0
             || this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Value__c >0  || this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Value__c >0
             || this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Value__c >0){
               
const preTaxFields = [
    { desc: this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Description__c, val: this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Value__c },
    { desc: this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Description__c, val: this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Value__c },
    { desc: this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Description__c, val: this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Value__c },
    { desc: this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Description__c, val: this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Value__c },
    { desc: this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Description__c, val: this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Value__c }
].filter(item => item.val && item.val > 0);

if (preTaxFields.length > 0) {
    startY = checkPageSpace(doc, startY, 6);
    doc.setFont("roboto", "bold");
    doc.text("Pre TAX Deductions", 10, startY);
    doc.setFont("roboto", "");
    doc.setFontSize(10);

    let currentY = startY + 6;
    preTaxFields.forEach(item => {
        currentY = checkPageSpace(doc, currentY, 6); // page break check before each row
        doc.text(item.desc || "---", 10, currentY);
        doc.text(dollarUSLocale.format(item.val.toFixed(2)), 144, currentY);
        currentY += 6;
    });

    // TOTAL Pre-Tax
    const totalPreTax = this.currentRecordPdf[0].staffpayrollData.Pre_tax_values__c || 0;
    const totalPreTaxYTD = this.currentRecordPdf[0].staffpayrollData.Current_Pre_Tax_YTD__c || 0;

    currentY = checkPageSpace(doc, currentY, 6);
    doc.setDrawColor(229, 229, 229);
    doc.setFillColor(229, 229, 229);
    doc.setFont("roboto", "bold");
    doc.rect(10, currentY-4, 190, 6, "FD");
    doc.text("TOTAL", 122, currentY );
    doc.text(dollarUSLocale.format(totalPreTax.toFixed(2)), 144, currentY);
    doc.text(dollarUSLocale.format(totalPreTaxYTD.toFixed(2)), 179, currentY);

    startY = currentY + 6; // update startY for next section
}
       let positionOfRows=0;        
                 /* 
                 doc.text("Pre TAX Deductions",10,startY);
                 doc.setFont("roboto", "");
                 doc.setFontSize(10);
                 
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Description__c !=undefined){
                     doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Description__c, 10, 195-parseInt(positionOFHourRows));
                     positionOfRows=28;
                 }
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Description__c !=undefined){
                     doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Description__c, 10, 200-parseInt(positionOFHourRows));
                     positionOfRows=20;
                 }
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Description__c !=undefined){
                     doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Description__c, 10, 205-parseInt(positionOFHourRows));
                     positionOfRows=12;
                 }
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Description__c !=undefined){
                     doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Description__c, 10, 210-parseInt(positionOFHourRows));
                     positionOfRows=4;
 
                 }if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Description__c !=undefined){
                     doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Description__c, 10, 215-parseInt(positionOFHourRows));
                     positionOfRows=0;
                 }
                 
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Value__c >0){
                
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Value__c.toFixed(2)), 144, 195-parseInt(positionOFHourRows));
                 }
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Value__c>0){
                  
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Value__c.toFixed(2)), 144, 200-parseInt(positionOFHourRows));
                 }
 
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Value__c>0){
                
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Value__c.toFixed(2)), 144, 205-parseInt(positionOFHourRows));
                 }
 
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Value__c>0){
                  
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Value__c.toFixed(2)), 144, 210-parseInt(positionOFHourRows));
                 }
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Value__c>0){
                 
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Value__c.toFixed(2)), 144, 215-parseInt(positionOFHourRows));
                 } 
                 doc.setFont("roboto", "bold");  
                 doc.setDrawColor(229,229,229);
                 doc.setFillColor(229, 229, 229);
                 doc.rect(10, 224-parseInt(positionOfRows)-parseInt(positionOFHourRows), 190, 6,"FD"); 
                 doc.text("TOTAL",122,228-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 if(this.currentRecordPdf[0].staffpayrollData.Pre_tax_values__c==undefined){
                     doc.text("$0.00", 144, 228-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_tax_values__c.toFixed(2)), 144, 228-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                }
                if(this.currentRecordPdf[0].staffpayrollData.Current_Pre_Tax_YTD__c==undefined){
                 doc.text("$0.00", 179, 228-parseInt(positionOfRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Pre_Tax_YTD__c.toFixed(2)), 179, 228-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 } */
                 startY = checkPageSpace(doc, startY, 10);
                 doc.setFont("roboto", "bold");
                 doc.text("TAX",10,startY );
                 startY = checkPageSpace(doc, startY + 6, 6);
                 doc.text("PAYG",10,startY );
                 doc.setFont("roboto", "");
                 const taxValue = this.currentRecordPdf[0].staffpayrollData.Tax__c || 0;
    const taxYTD = this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c || 0;

    doc.text(dollarUSLocale.format(taxValue.toFixed(2)), 144, startY);
    doc.text(dollarUSLocale.format(taxYTD.toFixed(2)), 179, startY);

    // ✅ TOTAL TAX Row (same spacing as Pre-Tax TOTAL)
    startY = checkPageSpace(doc, startY + 6, 6);
    doc.setDrawColor(229, 229, 229);
    doc.setFillColor(229, 229, 229);
    doc.setFont("roboto", "bold");
    doc.rect(10, startY - 4, 190, 6, "FD");
    doc.text("TOTAL", 122, startY);
    doc.text(dollarUSLocale.format(taxValue.toFixed(2)), 144, startY);
    doc.text(dollarUSLocale.format(taxYTD.toFixed(2)), 179, startY);

                 /* if(this.currentRecordPdf[0].staffpayrollData.Tax__c==undefined){
                     doc.text("$0.00", 144, 236-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Tax__c.toFixed(2)), 144, 236-parseInt(positionOfRows)-parseInt(positionOFHourRows));
         
                 } 
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c==undefined){
                     doc.text("$0.00", 179, 236-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }else{
                      doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c.toFixed(2)), 179, 236-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
                 doc.setDrawColor(229,229,229);
                 doc.setFillColor(229, 229, 229);
                 doc.setFont("roboto", "bold");
                 doc.rect(10, 241-parseInt(positionOfRows)-parseInt(positionOFHourRows), 190, 6,"FD"); 
                 doc.text("TOTAL",122,245-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 if(this.currentRecordPdf[0].staffpayrollData.Tax__c==undefined){
                     doc.text("$0.00", 144, 245-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Tax__c.toFixed(2)), 144, 245-parseInt(positionOfRows)-parseInt(positionOFHourRows));
         
                 } 
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c==undefined){
                     doc.text("$0.00", 179, 245-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }else{
                      doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c.toFixed(2)), 179, 245-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 } */
                // ✅ SUPERANNUATION Section (Dynamic version)
startY = checkPageSpace(doc, startY+6, 10);
doc.setFont("roboto", "bold");
doc.text("SUPERANNUATION", 10, startY);

// Guaranteed Superannuation / Super Annuation with Account Number
startY = checkPageSpace(doc, startY + 6, 6);
let superDesc = "Guaranteed Superannuation";
if (this.currentRecordPdf[0].staffData.Superannuation_Number__c) {
    superDesc = "Super Annuation | Account Number - " + this.currentRecordPdf[0].staffData.Superannuation_Number__c;
}
doc.setFont("roboto", "");
doc.text(superDesc, 10, startY);

// Super Annuation Final and YTD
const superValue = this.currentRecordPdf[0].staffpayrollData.Super_Annuation_Final__c || 0;
const superYTD = this.currentRecordPdf[0].staffpayrollData.Current_Superannuation_YTD__c || 0;

doc.text(dollarUSLocale.format(superValue.toFixed(2)), 144, startY);
doc.text(dollarUSLocale.format(superYTD.toFixed(2)), 179, startY);

// Voluntary Superannuation
startY = checkPageSpace(doc, startY + 6, 6);
let voluntaryDesc = "Voluntary Superannuation";
let voluntaryValue = 0;
if (this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c) {
    if (this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c === 'Fixed') {
        voluntaryDesc = "Voluntary Superannuation - Fixed";
        voluntaryValue = this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Fixed__c || 0;
    } else {
        const percent = this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Percent__c || 0;
        voluntaryDesc = `Voluntary Superannuation - Percentage (${percent}%)`;
        voluntaryValue = this.currentRecordPdf[0].staffpayrollData.Voluntary_Percent_Values__c || 0;
    }
}

doc.text(voluntaryDesc, 10, startY);
doc.text(dollarUSLocale.format(voluntaryValue.toFixed(2)), 144, startY);

const voluntaryYTD = this.currentRecordPdf[0].staffpayrollData.Current_Voluntary_Superannuation_YTD__c || 0;
doc.text(dollarUSLocale.format(voluntaryYTD.toFixed(2)), 179, startY);

// ✅ TOTAL Super + Voluntary
startY = checkPageSpace(doc, startY + 6, 6);
doc.setDrawColor(235, 235, 235);
doc.setFillColor(235, 235, 235);
doc.setFont("roboto", "bold");
doc.rect(10, startY - 4, 190, 6, "FD");
doc.text("TOTAL", 122, startY);

const totalSuper = this.currentRecordPdf[0].staffpayrollData.Super_And_Voluntary_Supper_Annuation__c || 0;
const totalSuperYTD = this.currentRecordPdf[0].staffpayrollData.Current_Super_and_Voluntaryannuation_YTD__c || 0;

doc.text(dollarUSLocale.format(totalSuper.toFixed(2)), 144, startY);
doc.text(dollarUSLocale.format(totalSuperYTD.toFixed(2)), 179, startY);

// Add a bit of space before next section


         
                 /* doc.text("SUPERANNUATION",10,252-parseInt(positionOfRows)-parseInt(positionOFHourRows)); 
                 if(this.currentRecordPdf[0].staffData.Superannuation_Number__c ==undefined){
                     doc.text("Guaranteed Superannuation",10,257-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }else{
                     doc.text("Super Annuation | Account Number - "+this.currentRecordPdf[0].staffData.Superannuation_Number__c ,10,257-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
                 doc.setFont("roboto", "");
                 if(this.currentRecordPdf[0].staffpayrollData.Super_Annuation_Final__c==undefined){
                     doc.text("$0.00", 144, 257-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Super_Annuation_Final__c .toFixed(2)), 144, 257-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
         
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Superannuation_YTD__c==undefined){
                     doc.text("$0.00", 179, 257-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Superannuation_YTD__c.toFixed(2)), 179, 257-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
                 if(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c){
                     if(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c =='Fixed'){  
                         doc.text("Voluntary Superannuation-Fixed",10,262-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                         doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Fixed__c.toFixed(2)), 144, 262-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                     }else{
                         doc.text("Voluntary Superannuation-Percentage ("+this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Percent__c+"%)",10,262-parseInt(positionOfRows)-parseInt(positionOFHourRows)); 
                         //doc.text(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Percent__c +"%", 97,232-parseInt(positionOfRows) );
                         doc.text(dollarUSLocale.format(parseFloat(this.currentRecordPdf[0].staffpayrollData.Voluntary_Percent_Values__c.toFixed(2))), 144, 262-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                     } 
                 }else{
                     doc.text("Voluntary Superannuation",10,262-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                     doc.text("$0.00", 144, 262-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                    
                 }
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Voluntary_Superannuation_YTD__c==undefined){
                    doc.text("$0.00", 179, 262-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Voluntary_Superannuation_YTD__c.toFixed(2)), 179, 262-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                }
                 doc.setDrawColor(235,235,235);
                 doc.setFillColor(235, 235, 235);
                 doc.setFont("roboto", "bold");
                 doc.rect(10, 266-parseInt(positionOfRows)-parseInt(positionOFHourRows), 190, 6,"FD"); 
                 doc.text("TOTAL",122,270-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 
                 if(this.currentRecordPdf[0].staffpayrollData.Super_And_Voluntary_Supper_Annuation__c==undefined){
                     doc.text("$0.00", 144, 270-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Super_And_Voluntary_Supper_Annuation__c .toFixed(2)), 144, 270-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
         
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Super_and_Voluntaryannuation_YTD__c==undefined){
                    doc.text("$0.00", 179, 270-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Super_and_Voluntaryannuation_YTD__c.toFixed(2)), 179, 270-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                } */
               // ------------------ POST TAX DEDUCTIONS ------------------
startY = checkPageSpace(doc, startY + 6, 10);
doc.setFont("roboto", "bold");
doc.text("Post Tax Deductions", 10, startY);
startY = checkPageSpace(doc, startY + 6);

// Description
doc.setFont("roboto", "");
let postTaxDesc = this.currentRecordPdf[0].staffpayrollData.Post_Tax_Decription__c || "---";
doc.text(postTaxDesc, 10, startY);

// Values
let postTaxValue = this.currentRecordPdf[0].staffpayrollData.Post_tax_values__c || 0;
let postTaxYTD = this.currentRecordPdf[0].staffpayrollData.Current_Post_Tax_YTD__c || 0;

doc.text(dollarUSLocale.format(postTaxValue.toFixed(2)), 144, startY);
doc.text(dollarUSLocale.format(postTaxYTD.toFixed(2)), 179, startY);

// ------------------ REIMBURSEMENTS ------------------
startY = checkPageSpace(doc, startY + 6);
doc.text("Reimbursements", 10, startY);

let reimbValue = this.currentRecordPdf[0].staffpayrollData.Reimbursements__c || 0;
doc.text(dollarUSLocale.format(reimbValue.toFixed(2)), 144, startY);
/* if(this.currentRecordPdf[0].staffData.Type_of_Employe__c && (this.currentRecordPdf[0].staffData.Type_of_Employe__c === 'Full Time Permanent' || this.currentRecordPdf[0].staffData.Type_of_Employe__c === 'Part Time Permanent'))
{
// After rendering reimbursements, add a section for Leave Summary
startY = checkPageSpace(doc, startY + 10, 10);
doc.setFont("roboto", "bold");
doc.text("Leave Summary", 10, startY);
doc.text("TOTAL", 122, startY);
doc.text("USED", 144, startY);
doc.text("BALANCE", 179, startY);
//startY = checkPageSpace(doc, startY + 6);

// Get the leaveSummary map
const leaveSummary = this.currentRecordPdf[0].leaveSummary || {};

Object.keys(leaveSummary).forEach((leaveType) => {
    const leaveData = leaveSummary[leaveType];
    // Format values (Remaining, Approved, Total)
    const remaining = leaveData.Remaining || 0;
    const approved = leaveData.Approved || 0;
    const total = leaveData.Total || 0;

    startY = checkPageSpace(doc, startY + 6);
    doc.setFont("roboto", "normal");
    // Print Leave Type
    doc.text(leaveType, 10, startY);
    // Print values aligned to right columns
     doc.text(total.toString(), 122, startY);
     doc.text(approved.toString(), 144, startY);
    doc.text(remaining.toString(), 179, startY);
    
   
});

} */

// ------------------ GROSS SALARY ------------------
startY = checkPageSpace(doc, startY + 6, 6);
doc.setDrawColor(229, 229, 229);
doc.setFillColor(229, 229, 229);
doc.setFont("roboto", "bold");
doc.rect(10, startY - 4, 190, 6, "FD");
doc.text("Gross Salary", 12, startY);

doc.setFont("roboto", "");
let grossValue = this.currentRecordPdf[0].staffpayrollData.Gross_Salary_Display__c || 0;
let grossYTD = this.currentRecordPdf[0].staffpayrollData.Current_Taxble_Gross_Salary_YTD__c || 0;

doc.text(dollarUSLocale.format(grossValue.toFixed(2)), 144, startY);
doc.text(dollarUSLocale.format(grossYTD.toFixed(2)), 179, startY);

// ------------------ NET SALARY ------------------
startY = checkPageSpace(doc, startY + 10, 6);
doc.setDrawColor(229, 229, 229);
doc.setFillColor(229, 229, 229);
doc.setFont("roboto", "bold");
doc.rect(10, startY - 4, 190, 6, "FD");
doc.text("NET SALARY", 12, startY);

doc.setFont("roboto", "");
let netValue = this.currentRecordPdf[0].staffpayrollData.Net_Pay__c || 0;
let netYTD = this.currentRecordPdf[0].staffpayrollData.Current_Net_Pay_Salary_YTD__c || 0;

doc.text(dollarUSLocale.format(netValue.toFixed(2)), 144, startY);
doc.text(dollarUSLocale.format(netYTD.toFixed(2)), 179, startY);
let disclaimerText = "Disclaimer: Paid breaks are included in the total paid hours only when they are explicitly recorded as paid.";
doc.text(disclaimerText, 10, startY + 10);

// ✅ update startY for the next section


                 /* doc.setFont("roboto", "bold");
                 doc.text("Post Tax Deductions ",10,276-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 doc.setFont("roboto", "");
                 let posttaxRow=5
                 if(this.currentRecordPdf[0].staffpayrollData.Post_Tax_Decription__c !=undefined){
                     doc.text(this.currentRecordPdf[0].staffpayrollData.Post_Tax_Decription__c, 10, 281-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                     posttaxRow=0
                 }
         
                 if(this.currentRecordPdf[0].staffpayrollData.Post_tax_values__c==undefined)
                 {   
                     doc.text("$0.00", 144, 281-parseInt(positionOfRows)-parseInt(posttaxRow)-parseInt(positionOFHourRows));
                 }
                 else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Post_tax_values__c.toFixed(2)), 144, 281-parseInt(positionOfRows)-parseInt(posttaxRow)-parseInt(positionOFHourRows));
                 }
                 
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Post_Tax_YTD__c==undefined){
                     doc.text("$0.00", 179, 281-parseInt(positionOfRows)-parseInt(posttaxRow)-parseInt(positionOFHourRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Post_Tax_YTD__c.toFixed(2)), 179, 281-parseInt(positionOfRows)-parseInt(posttaxRow)-parseInt(positionOFHourRows));
                 }
                 doc.line(10, 283-parseInt(positionOfRows)-parseInt(positionOFHourRows), 195, 283-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 doc.text("Reimbursements",10,288-parseInt(positionOfRows)-parseInt(positionOFHourRows));
     
                 if(this.currentRecordPdf[0].staffpayrollData.Reimbursements__c==undefined)
                 {
                     doc.text("$0.00", 144, 288-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
                 else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Reimbursements__c.toFixed(2)), 144, 288-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
                
                 //Maheswari start few line 
                 doc.setDrawColor(229,229,229);
                 doc.setFillColor(229, 229, 229);

                doc.rect(10, 292-parseInt(positionOfRows)-parseInt(positionOFHourRows), 190, 6,"FD"); //265
               doc.text("Gross Salary",12,296-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 //Gross Salary
                 if(this.currentRecordPdf[0].staffpayrollData.Gross_Salary_Display__c==undefined)
                 {
                     doc.text("$0.00", 144, 296-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
                 else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary_Display__c.toFixed(2)), 144, 296-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
         
                 //Gross Salary YTD        
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Taxble_Gross_Salary_YTD__c==undefined)
                 {
                     doc.text("$0.00", 270,296-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
                 else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Taxble_Gross_Salary_YTD__c.toFixed(2)), 179,296-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 } 
                 doc.setDrawColor(229,229,229);
                 doc.setFillColor(229, 229, 229);
                 doc.rect(10, 300-parseInt(positionOfRows)-parseInt(positionOFHourRows), 190, 6,"FD");//273 maheswari code end
                
                 
                 doc.text("NET SALARY",12,305-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                  //Net Salary
                 if(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c==undefined){
                     doc.text("$0.00", 144, 305-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c.toFixed(2)), 144, 305-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }
 
                 //Net YTD Salary
                 if(this.currentRecordPdf[0].staffpayrollData.Current_Net_Pay_Salary_YTD__c==undefined){
                     doc.text("$0.00", 179, 305-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Net_Pay_Salary_YTD__c.toFixed(2)), 179, 305-parseInt(positionOfRows)-parseInt(positionOFHourRows));
                 } */
             
             
             }else{
                  doc.setFont("roboto", "");
    doc.setFontSize(10);

    // Initialize startY for this section
   startY = checkPageSpace(doc, startY, 6);

    // ------------------ PRE TAX ------------------
    doc.text("Pre TAX", 10, startY);
    let preTaxValue = this.currentRecordPdf[0].staffpayrollData.Pre_tax_values__c || 0;
    let preTaxYTD = this.currentRecordPdf[0].staffpayrollData.Current_Pre_Tax_YTD__c || 0;

    doc.text(dollarUSLocale.format(preTaxValue.toFixed(2)), 144, startY);
    doc.text(dollarUSLocale.format(preTaxYTD.toFixed(2)), 179, startY);

    // ------------------ TAX ------------------
    startY = checkPageSpace(doc, startY + 6, 6);
    doc.setFont("roboto", "bold");
    doc.text("TAX", 10, startY);
    startY = checkPageSpace(doc, startY + 6, 6);
    doc.text("PAYG", 10, startY);

    doc.setFont("roboto", "");
    let taxValue = this.currentRecordPdf[0].staffpayrollData.Tax__c || 0;
    let taxYTD = this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c || 0;
    doc.text(dollarUSLocale.format(taxValue.toFixed(2)), 144, startY);
    doc.text(dollarUSLocale.format(taxYTD.toFixed(2)), 179, startY);

    // TAX TOTAL BOX
    startY = checkPageSpace(doc, startY +6, 6);
    doc.setDrawColor(229, 229, 229);
    doc.setFillColor(229, 229, 229);
    doc.setFont("roboto", "bold");
    doc.rect(10, startY - 4, 190, 6, "FD");
    doc.text("TOTAL", 122, startY);
    doc.text(dollarUSLocale.format(taxValue.toFixed(2)), 144, startY);
    doc.text(dollarUSLocale.format(taxYTD.toFixed(2)), 179, startY);

    // ------------------ SUPERANNUATION ------------------
    startY = checkPageSpace(doc, startY + 6, 6);
    doc.text("SUPERANNUATION", 10, startY);

    let superDesc = "Guaranteed Superannuation";
    if (this.currentRecordPdf[0].staffData.Superannuation_Number__c) {
        superDesc = "Super Annuation | Account Number - " + this.currentRecordPdf[0].staffData.Superannuation_Number__c;
    }
    startY = checkPageSpace(doc, startY + 6);
    doc.setFont("roboto", "");
    doc.text(superDesc, 10, startY);

    let superValue = this.currentRecordPdf[0].staffpayrollData.Super_Annuation_Final__c || 0;
    let superYTD = this.currentRecordPdf[0].staffpayrollData.Current_Superannuation_YTD__c || 0;
    doc.text(dollarUSLocale.format(superValue.toFixed(2)), 144, startY);
    doc.text(dollarUSLocale.format(superYTD.toFixed(2)), 179, startY);

    // Voluntary Superannuation
    startY = checkPageSpace(doc, startY + 6, 6);
    let voluntaryDesc = "Voluntary Superannuation";
    let voluntaryValue = 0;

    if (this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c) {
        if (this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c === 'Fixed') {
            voluntaryDesc = "Voluntary Superannuation - Fixed";
            voluntaryValue = this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Fixed__c || 0;
        } else {
            const percent = this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Percent__c || 0;
            voluntaryDesc = `Voluntary Superannuation - Percentage (${percent}%)`;
            voluntaryValue = this.currentRecordPdf[0].staffpayrollData.Voluntary_Percent_Values__c || 0;
        }
    }

    doc.text(voluntaryDesc, 10, startY);
    doc.text(dollarUSLocale.format(voluntaryValue.toFixed(2)), 144, startY);

    let voluntaryYTD = this.currentRecordPdf[0].staffpayrollData.Current_Voluntary_Superannuation_YTD__c || 0;
    doc.text(dollarUSLocale.format(voluntaryYTD.toFixed(2)), 179, startY);

    // TOTAL SUPER + VOLUNTARY
    startY = checkPageSpace(doc, startY + 6, 6);
    doc.setDrawColor(235, 235, 235);
    doc.setFillColor(235, 235, 235);
    doc.setFont("roboto", "bold");
    doc.rect(10, startY - 4, 190, 6, "FD");
    doc.text("TOTAL", 122, startY);

    let totalSuper = this.currentRecordPdf[0].staffpayrollData.Super_And_Voluntary_Supper_Annuation__c || 0;
    let totalSuperYTD = this.currentRecordPdf[0].staffpayrollData.Current_Super_and_Voluntaryannuation_YTD__c || 0;
    doc.text(dollarUSLocale.format(totalSuper.toFixed(2)), 144, startY);
    doc.text(dollarUSLocale.format(totalSuperYTD.toFixed(2)), 179, startY);

    // ------------------ POST TAX DEDUCTIONS ------------------
    startY = checkPageSpace(doc, startY + 6, 6);
    doc.setFont("roboto", "bold");
    doc.text("Post Tax Deductions", 10, startY);
    doc.setFont("roboto", "");

    startY = checkPageSpace(doc, startY + 6, 6);
    let postTaxDesc = this.currentRecordPdf[0].staffpayrollData.Post_Tax_Decription__c || "---";
    doc.text(postTaxDesc, 10, startY);

    let postTaxValue = this.currentRecordPdf[0].staffpayrollData.Post_tax_values__c || 0;
    let postTaxYTD = this.currentRecordPdf[0].staffpayrollData.Current_Post_Tax_YTD__c || 0;
    doc.text(dollarUSLocale.format(postTaxValue.toFixed(2)), 144, startY);
    doc.text(dollarUSLocale.format(postTaxYTD.toFixed(2)), 179, startY);

    // Reimbursements
    startY = checkPageSpace(doc, startY + 6, 6);
    doc.text("Reimbursements", 10, startY);
    let reimbValue = this.currentRecordPdf[0].staffpayrollData.Reimbursements__c || 0;
    doc.text(dollarUSLocale.format(reimbValue.toFixed(2)), 144, startY);
  /*   if(this.currentRecordPdf[0].staffData.Type_of_Employe__c && (this.currentRecordPdf[0].staffData.Type_of_Employe__c === 'Full Time Permanent' || this.currentRecordPdf[0].staffData.Type_of_Employe__c === 'Part Time Permanent'))
    {
        
        // After rendering reimbursements, add a section for Leave Summary
    startY = checkPageSpace(doc, startY + 10, 10);
    doc.setFont("roboto", "bold");
    doc.text("Leave Summary", 10, startY);
    doc.text("TOTAL", 122, startY);
    doc.text("USED", 144, startY);
    doc.text("BALANCE", 179, startY);
    //startY = checkPageSpace(doc, startY + 6);

    // Get the leaveSummary map
    const leaveSummary = this.currentRecordPdf[0].leaveSummary || {};

    Object.keys(leaveSummary).forEach((leaveType) => {
        const leaveData = leaveSummary[leaveType];
        // Format values (Remaining, Approved, Total)
        const remaining = leaveData.Remaining || 0;
        const approved = leaveData.Approved || 0;
        const total = leaveData.Total || 0;

        startY = checkPageSpace(doc, startY + 6);
        doc.setFont("roboto", "normal");
        // Print Leave Type
        doc.text(leaveType, 10, startY);
        // Print values aligned to right columns
        doc.text(total.toString(), 122, startY);
        doc.text(approved.toString(), 144, startY);
        doc.text(remaining.toString(), 179, startY);
        
    
    });

   } */

    // ------------------ GROSS SALARY ------------------
    startY = checkPageSpace(doc, startY + 6, 6);
    doc.setDrawColor(229, 229, 229);
    doc.setFillColor(229, 229, 229);
    doc.rect(10, startY - 4, 190, 6, "FD");
    doc.setFont("roboto", "bold");
    doc.text("Gross Salary", 12, startY);

    let grossValue = this.currentRecordPdf[0].staffpayrollData.Gross_Salary_Display__c || 0;
    let grossYTD = this.currentRecordPdf[0].staffpayrollData.Current_Taxble_Gross_Salary_YTD__c || 0;
    doc.setFont("roboto", "");
    doc.text(dollarUSLocale.format(grossValue.toFixed(2)), 144, startY);
    doc.text(dollarUSLocale.format(grossYTD.toFixed(2)), 179, startY);

    // ------------------ NET SALARY ------------------
    startY = checkPageSpace(doc, startY + 10, 6);
    doc.setDrawColor(229, 229, 229);
    doc.setFillColor(229, 229, 229);
    doc.rect(10, startY - 4, 190, 6, "FD");
    doc.setFont("roboto", "bold");
    doc.text("NET SALARY", 12, startY);

    let netValue = this.currentRecordPdf[0].staffpayrollData.Net_Pay__c || 0;
    let netYTD = this.currentRecordPdf[0].staffpayrollData.Current_Net_Pay_Salary_YTD__c || 0;
    doc.setFont("roboto", "");
    doc.text(dollarUSLocale.format(netValue.toFixed(2)), 144, startY);
    doc.text(dollarUSLocale.format(netYTD.toFixed(2)), 179, startY);
    let disclaimerText = "Disclaimer: Paid breaks are included in the total paid hours only when they are explicitly recorded as paid.";
    doc.text(disclaimerText, 10, startY + 10);

   
               /*  positionOFHourRows=positionOFHourRows -18;
                doc.setFont("roboto", "");
                doc.setFontSize(10);
                doc.text("Pre TAX",10,175-parseInt(positionOFHourRows));
                if(this.currentRecordPdf[0].staffpayrollData.Pre_tax_values__c==undefined){
                    doc.text("$0.00", 144, 175-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_tax_values__c.toFixed(2)), 144, 175-parseInt(positionOFHourRows));
                }
                
                if(this.currentRecordPdf[0].staffpayrollData.Current_Pre_Tax_YTD__c==undefined){
                    doc.text("$0.00", 179, 175-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Pre_Tax_YTD__c.toFixed(2)), 179, 175-parseInt(positionOFHourRows));
                }   

                doc.setFont("roboto", "bold");
                doc.text("TAX",10,180-parseInt(positionOFHourRows));
                doc.text("PAYG",10,185-parseInt(positionOFHourRows));
                doc.setFont("roboto", "");
                if(this.currentRecordPdf[0].staffpayrollData.Tax__c==undefined){
                    doc.text("$0.00", 144, 185-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Tax__c.toFixed(2)), 144, 185-parseInt(positionOFHourRows));
        
                } 
                if(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c==undefined){
                    doc.text("$0.00", 179, 185-parseInt(positionOFHourRows));
                }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c.toFixed(2)), 179, 185-parseInt(positionOFHourRows));
                }
                doc.setDrawColor(229,229,229);
                doc.setFillColor(229, 229, 229);
                doc.setFont("roboto", "bold");
                doc.rect(10, 190-parseInt(positionOFHourRows), 190, 6,"FD"); 
                doc.text("TOTAL",122,194-parseInt(positionOFHourRows));
                if(this.currentRecordPdf[0].staffpayrollData.Tax__c==undefined){
                    doc.text("$0.00", 144, 194-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Tax__c.toFixed(2)), 144, 194-parseInt(positionOFHourRows));
        
                } 
                if(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c==undefined){
                    doc.text("$0.00", 179, 193-parseInt(positionOFHourRows));
                }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c.toFixed(2)), 179, 193-parseInt(positionOFHourRows));
                }
        
                doc.text("SUPERANNUATION",10,201-parseInt(positionOFHourRows)); 
                if(this.currentRecordPdf[0].staffData.Superannuation_Number__c ==undefined){
                    doc.text("Guaranteed Superannuation",10,206-parseInt(positionOFHourRows));
                }else{
                    doc.text("Super Annuation | Account Number - "+this.currentRecordPdf[0].staffData.Superannuation_Number__c ,10,206-parseInt(positionOFHourRows));
                }
                doc.setFont("roboto", "");
                if(this.currentRecordPdf[0].staffpayrollData.Super_Annuation_Final__c==undefined){
                    doc.text("$0.00", 144, 206-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Super_Annuation_Final__c .toFixed(2)), 144, 206-parseInt(positionOFHourRows));
                }
        
                if(this.currentRecordPdf[0].staffpayrollData.Current_Superannuation_YTD__c==undefined){
                    doc.text("$0.00", 179, 206-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Superannuation_YTD__c.toFixed(2)), 179, 206-parseInt(positionOFHourRows));
                }
                if(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c){
                    if(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c =='Fixed'){  
                        doc.text("Voluntary Superannuation-Fixed",10,211-parseInt(positionOFHourRows));
                        doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Fixed__c.toFixed(2)), 144, 211-parseInt(positionOFHourRows));
                    }else{
                        doc.text("Voluntary Superannuation-Percentage ("+this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Percent__c+"%)",10,211-parseInt(positionOFHourRows)); 
                        //doc.text(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Percent__c +"%", 97,232-parseInt(positionOfRows) );
                        doc.text(dollarUSLocale.format(parseFloat(this.currentRecordPdf[0].staffpayrollData.Voluntary_Percent_Values__c.toFixed(2))), 144, 211-parseInt(positionOFHourRows));
                    } 
                }else{
                    doc.text("Voluntary Superannuation",10,211-parseInt(positionOFHourRows));
                    doc.text("$0.00", 144, 211-parseInt(positionOFHourRows));
                   
                }
                if(this.currentRecordPdf[0].staffpayrollData.Current_Voluntary_Superannuation_YTD__c==undefined){
                    doc.text("$0.00", 179,211-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Voluntary_Superannuation_YTD__c.toFixed(2)), 179, 211-parseInt(positionOFHourRows));
                }
                doc.setDrawColor(235,235,235);
                doc.setFillColor(235, 235, 235);
                doc.setFont("roboto", "bold");
                doc.rect(10, 214-parseInt(positionOFHourRows), 190, 6,"FD"); 
                doc.text("TOTAL",122,218-parseInt(positionOFHourRows));
                
                if(this.currentRecordPdf[0].staffpayrollData.Super_And_Voluntary_Supper_Annuation__c==undefined){
                    doc.text("$0.00", 144, 218-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Super_And_Voluntary_Supper_Annuation__c .toFixed(2)), 144, 218-parseInt(positionOFHourRows));
                }
        
                if(this.currentRecordPdf[0].staffpayrollData.Current_Super_and_Voluntaryannuation_YTD__c==undefined){
                    doc.text("$0.00", 179, 218-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Super_and_Voluntaryannuation_YTD__c.toFixed(2)), 179, 218-parseInt(positionOFHourRows));
                } 
                doc.setFont("roboto", "bold");
                doc.text("Post Tax Deductions ",10,224-parseInt(positionOFHourRows));
                doc.setFont("roboto", "");
                let posttaxRow=5
                if(this.currentRecordPdf[0].staffpayrollData.Post_Tax_Decription__c !=undefined){
                    doc.text(this.currentRecordPdf[0].staffpayrollData.Post_Tax_Decription__c, 10, 229-parseInt(positionOFHourRows));
                    posttaxRow=0
                }
        
                if(this.currentRecordPdf[0].staffpayrollData.Post_tax_values__c==undefined)
                {   
                    doc.text("$0.00", 144, 229-parseInt(posttaxRow)-parseInt(positionOFHourRows));
                }
                else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Post_tax_values__c.toFixed(2)), 144, 229-parseInt(posttaxRow)-parseInt(positionOFHourRows));
                }
                
                if(this.currentRecordPdf[0].staffpayrollData.Current_Post_Tax_YTD__c==undefined){
                    doc.text("$0.00", 179, 229-parseInt(posttaxRow)-parseInt(positionOFHourRows)-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Post_Tax_YTD__c.toFixed(2)), 179, 229-parseInt(posttaxRow)-parseInt(positionOFHourRows));
                }
                doc.text("Reimbursements",10,234-parseInt(positionOFHourRows));
    
                if(this.currentRecordPdf[0].staffpayrollData.Reimbursements__c==undefined)
                {
                    doc.text("$0.00", 144, 234-parseInt(positionOFHourRows));
                }
                else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Reimbursements__c.toFixed(2)), 144, 234-parseInt(positionOFHourRows));
                }
               
                doc.setDrawColor(229,229,229);
                doc.setFillColor(229, 229, 229);
                doc.rect(10, 239-parseInt(positionOFHourRows), 190, 6,"FD"); //265
                doc.text("Gross Salary",12,243-parseInt(positionOFHourRows));

                //Gross Salary
                if(this.currentRecordPdf[0].staffpayrollData.Gross_Salary_Display__c==undefined)
                {
                    doc.text("$0.00", 144, 243-parseInt(positionOFHourRows));
                }
                else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary_Display__c.toFixed(2)), 144, 243-parseInt(positionOFHourRows));
                }
        
                //Gross Salary YTD        
                if(this.currentRecordPdf[0].staffpayrollData.Current_Taxble_Gross_Salary_YTD__c==undefined)
                {
                    doc.text("$0.00", 179,243-parseInt(positionOFHourRows));
                }
                else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Taxble_Gross_Salary_YTD__c.toFixed(2)), 179,243-parseInt(positionOFHourRows));
                }  
                doc.setDrawColor(229,229,229);
                doc.setFillColor(229, 229, 229);
                doc.rect(10, 247-parseInt(positionOFHourRows), 190, 6,"FD");//273 maheswari code end
                doc.text("NET SALARY",12,251-parseInt(positionOFHourRows));
                 //Net Salary
                if(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c==undefined){
                    doc.text("$0.00", 144, 251-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c.toFixed(2)), 144, 251-parseInt(positionOFHourRows));
                }

                //Net YTD Salary
                if(this.currentRecordPdf[0].staffpayrollData.Current_Net_Pay_Salary_YTD__c==undefined){
                    doc.text("$0.00", 179, 251-parseInt(positionOFHourRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Net_Pay_Salary_YTD__c.toFixed(2)), 179, 251-parseInt(positionOFHourRows));
                } */
                
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