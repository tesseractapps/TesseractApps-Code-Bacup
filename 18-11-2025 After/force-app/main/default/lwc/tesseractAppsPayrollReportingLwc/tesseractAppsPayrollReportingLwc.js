import { LightningElement,track,wire,api } from 'lwc';
import NAME_FIELD from '@salesforce/schema/Organisation__c.Name';
import ABN_FIELD from '@salesforce/schema/Organisation__c.ABN__c';
import ACN_FIELD from '@salesforce/schema/Organisation__c.ACN__c';
import NDIS_FIELD from '@salesforce/schema/Organisation__c.NDIS_Provider__c';
import CONTACT_FIELD from '@salesforce/schema/Organisation__c.Contact_No__c';
import EMAIL_FIELD from '@salesforce/schema/Organisation__c.Email__c';
import Add_FIELD from '@salesforce/schema/Organisation__c.Address__c';
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import My_Resource from "@salesforce/resourceUrl/myResource";
import Objects_Type from "@salesforce/apex/OrgDetails.orgName"; 
import getFacilityData from '@salesforce/apex/PayrunSettingHandler.fetchFacilitiesByOrgId';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import fetchExpenses from '@salesforce/apex/PayrollReportingHandler.fetchExpenses';
import fetchInvoices from '@salesforce/apex/PayrollReportingHandler.fetchInvoices';
import fetchStaffPayrollSetting from '@salesforce/apex/PayrollReportingHandler.fetchStaffPayrollSetting';

export default class TesseractAppsPayrollReportingLwc extends LightningElement {
    @api orgid;
    @api companyid;
    @api companyname;
    admin = My_Resource+'/myResource/images/admin.svg';
    @track Picklist_Value;
    @track objectApiName='Organisation__c';
    fields = [NAME_FIELD, ABN_FIELD, ACN_FIELD,NDIS_FIELD,CONTACT_FIELD,EMAIL_FIELD,Add_FIELD];
    @track orgRecord;
    @track editFlag=false;
    @track sdate;
    @track edate;
    @track isVisible;   
    @track invoiceTable=[];
    @track expenseTable=[];
    @track PayrollSettingTable=[];
    @track expensesAmount;
    @track paryollSettingAmount;
    @track invoiceAmount;
    @track abn;
    @track orgName;
    @track orgStreet;
    @track stateCode;
    @track postalCode;
    @track countryCode;
    @track orgCity;
    @track contactNo;
    @track logo;
    @track excelDataInvoice=[];
    @track excelDataExpense=[];
    @track excelDataWages=[];
    @track selectedFacilityValue;
    @track facilityOptions;

    connectedCallback(){
        console.log('companyid IN TesseractAppsPayrollReportingLwc : '+this.companyid);
        console.log('companyname IN TesseractAppsPayrollReportingLwc : '+this.companyname);
        orgDetails().then(response=>{
            this.orgRecord=response;
            //console.log('recordsnew>>>>>',response);
            this.Picklist_Value = response.Id;
            this.abn = response.ABN__c;
            this.orgName = response.Name;
            this.orgStreet = response.Address_Latest__Street__s;
            this.orgCity = response.Address_Latest__City__s;
            this.stateCode = response.Address_Latest__StateCode__s;
            this.postalCode = response.Address_Latest__PostalCode__s;
            this.countryCode = response.Address_Latest__CountryCode__s;
            this.contactNo = response.Contact_No__c; 
           
            const searchEvent = new CustomEvent("getsearchvalue",{
                detail : this.Picklist_Value
            });        
            //Dispatches the event
            this.dispatchEvent(searchEvent);
        });
        getFacilityData().then(response => {
            this.facilityOptions = response.map(record => ({ value: record.Id, label: record.Name }))
            console.log('facilityOptions IN getFacilityData : '+JSON.stringify(this.facilityOptions)); 
            const matchedFacility = this.facilityOptions.find(
                option => option.label === this.companyname
            );
            console.log('matchedFacility IN getFacilityData:', matchedFacility);
        
            if (matchedFacility) {
                this.selectedFacilityValue = matchedFacility.value; // Auto-select the matching facility
            }        
        }).catch(err => {
            
        });
        // console.log('facilityOptions IN TesseractAppsPayrollReportingLwc : '+JSON.stringify(this.facilityOptions));
        // const matchedFacility = this.facilityOptions.find(
        //     option => option.label === this.companyname
        // );
        // console.log('matchedFacility IN TesseractAppsPayrollReportingLwc : '+matchedFacility);
        // if (matchedFacility) {
        //     this.selectedFacilityValue = matchedFacility.value; // Auto-select in combobox
        // }
        this.records=[];
        this.handleInvoiceData();
    }

    handleInvoiceData() {
        organizationDetails().then(response => {     
            this.orgId = response.listofPriceBook.Id;
            this.orgname = response.listofPriceBook.Name;
            this.abn = response.listofPriceBook.ABN__c;
            this.address =response.listofPriceBook.Address_Latest__Street__s;
            this.statePostal = response.listofPriceBook.Address_Latest__City__s + ',' + response.listofPriceBook.Address_Latest__StateCode__s + ',' + response.listofPriceBook.Address_Latest__PostalCode__s;            
            this.orgLogo = response.bolbdata;
            // console.log('org name>>>>', this.orgname); 
        });
    } 

    hadleDates(event) {
        var sname = event.target.name;        

        if (event.target.name == 'sdate') {
            this.sdate = event.detail.value;
            console.log('Start Date>>>>'+this.sdate);
        }
        if (event.target.name == 'edate') {
            this.edate = event.detail.value;
            console.log('End Date>>>>'+this.edate);
        }
        if (event.target.name == 'Facility') {             
            this.selectedFacilityValue = event.detail.value;
            console.log('215 SelectedFacilityValue>>'+this.selectedFacilityValue);
        } 
        let tempconList=[];
        var expAmount = 0;
        fetchExpenses({ startDate: this.sdate, endDate: this.edate, facility: this.selectedFacilityValue }).then(response => {  
            console.log("expenses data>>>>>",JSON.stringify(response));   
            //this.excelDataExpense = response;        
            response.forEach((record) => {
                let tempConRec = Object.assign({}, record); 
                tempConRec.name = tempConRec.Name;               
                tempConRec.typeOfExpenses = tempConRec.Type_of_Expense__c;
                if(tempConRec.Type_of_Expense__c == 'Other'){
                    tempConRec.description = tempConRec.Description__c;
                } else{
                    tempConRec.description = tempConRec.Sub_type__c;
                }                
                //tempConRec.otherComment = tempConRec.Comments__c;
                tempConRec.gst = tempConRec.Incl_GST__c.toFixed(2);
                tempConRec.amount = tempConRec.Amount__c.toFixed(2);

                expAmount = expAmount + tempConRec.Amount__c;
                tempconList.push(tempConRec);               
            })
            this.expensesAmount = expAmount.toFixed(2);
            this.expenseTable=tempconList;
            this.excelDataExpense = tempconList;
            
        })

        let tempconList1=[];
        var invAmount = 0;
        fetchInvoices ({ startDate: this.sdate, endDate: this.edate, orgName: this.orgName }).then(response => {
            //this.excelDataInvoice = response;
            response.forEach((record) => {
                let tempConRec = Object.assign({}, record); 
                if(tempConRec.Tax_Invoice__c != undefined){
                    tempConRec.taxinvoice = tempConRec.Tax_Invoice__c;
                }else {
                    tempConRec.taxinvoice = tempConRec.Name;
                }
                if(tempConRec.Is_Created_From_CSV__c){
                    tempConRec.gst = tempConRec.Total_CSV_GST__c.toFixed(2);
                    tempConRec.totalamount = tempConRec.Final_CSV_Total__c.toFixed(2);
                }else{
                    tempConRec.gst = tempConRec.Total_GST__c.toFixed(2);
                    tempConRec.totalamount = tempConRec.Total_Amount__c.toFixed(2);
                }
                
                tempConRec.date = new Date(tempConRec.Date_Issued__c).toLocaleDateString('en-GB');
                invAmount = invAmount + tempConRec.Total_Amount__c;
                tempconList1.push(tempConRec);               
            })
            this.invoiceAmount = invAmount.toFixed(2);
            this.invoiceTable=tempconList1;
            this.excelDataInvoice = tempconList1;
            console.log("Invoice data>>>>>",JSON.stringify(this.invoiceTable));  
        })

        let tempconList2=[];  
        var expAmount2 = 0;   
        let parollSatff={} ;  

        fetchStaffPayrollSetting ({ startDate: this.sdate, endDate: this.edate, orgName: this.orgName, facilityName: this.selectedFacilityValue }).then(response => {
       
        console.log('277 response>>'+JSON.stringify(response)); 

        response.forEach((wrapper) => {
        let tempConRec = Object.assign({}, wrapper.staffRecord);
        //tempConRec.adminFee = tempConRec.Management_Fee__c;
        if(typeof wrapper.adminFee != 'undefined'){
            tempConRec.adminFee = tempConRec.Management_Fee__c + 0.00;
        }
        tempConRec.postTax = wrapper.totalpostTax.toFixed(2);
        tempConRec.preTax = wrapper.totalpreTax.toFixed(2);    
        if (typeof wrapper.superAnnuation !== 'undefined') {
            tempConRec.superAnnuation = parseFloat(wrapper.superAnnuation).toFixed(2);
        } else {
    
            tempConRec.superAnnuation = 0; 
            }   
        // tempConRec.superAnnuation = parseFloat(wrapper.superAnnuation).toFixed(2);
        
        tempConRec.tax = wrapper.totalTax.toFixed(2);
        tempConRec.gross = wrapper.totalGross.toFixed(2);
        tempConRec.netPay = wrapper.netPayable.toFixed(2);
        tempConRec.netSal = wrapper.netSal.toFixed(2);
        tempConRec.staffname = wrapper.resourceName;
        //tempConRec.superAnnuation = wrapper.superAnnuation;
        tempConRec.adminFee = wrapper.adminFee.toFixed(2);
        tempConRec.sdate = new Date(tempConRec.Start_Date__c);
        tempConRec.edate = new Date(tempConRec.End_Date__c);        
        expAmount2 = expAmount2 + tempConRec.Net_Pay__c;
        let parollSatff = { name: tempConRec.Resource_Name__c, amount: expAmount2 };
        tempconList2.push(tempConRec);
        //}
        }); 
            this.PayrollSettingTable=tempconList2;
            this.excelDataWages = tempconList2;
            //console.log("Payroll setting data  line 243>>>>>"+JSON.stringify(this.PayrollSettingTable)); 
        })
    }
    
    @track invoicesHeader = ['Invoice Number', 'Date', 'GST', 'Total Amount' ];
    @track expensesHeader = ['Type of Expenses', 'Sub Type/Description', 'GST', 'Amount' ];
    @track wagesHeader = ['Staff Name', 'Admin Fee', 'Pre Tax FBT', 'Post FBT', 'Super Annuation','Gross','Tax','Net Payable' ];

   /*  downloadWagesExcel() {
        let csvContent = "\uFEFF"; // Add BOM for proper encoding
    
        // Organization Details
        csvContent += `"${this.orgName}"\n`;
        csvContent += `"Address: ${this.orgStreet}, ${this.orgCity}, ${this.stateCode}, ${this.postalCode}"\n`;
        csvContent += `"Contact No: ${this.contactNo}"\n`;
        csvContent += `"ABN: ${this.abn}"\n\n`;
    
        // Formatting the date
        function formatDate(dateStr) {
            let parts = dateStr.split('-');
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        let formattedSDate = formatDate(this.sdate);
        let formattedEDate = formatDate(this.edate);
    
        csvContent += `"Start Date: ${formattedSDate}","End Date: ${formattedEDate}"\n\n`;
    
        // **Wages Data Section**
        csvContent += `"Wages Data"\n`;
        csvContent += this.wagesHeader.join(",") + "\n"; // Header row
    
        this.excelDataWages.forEach(fieldsData => {
            csvContent += `"${fieldsData.staffname}",` +
                          `"${fieldsData.adminFee}",` +
                          `"${fieldsData.preTax}",` +
                          `"${fieldsData.postTax}",` +
                          `"${fieldsData.superAnnuation}",` +
                          `"${fieldsData.gross}",` +
                          `"${fieldsData.tax}",` +
                          `"${fieldsData.netPay}"\n`;
        });
    
        csvContent += `\n\n`;
    
        // **Expenses Data Section**
        csvContent += `"Expenses Data"\n`;
        csvContent += this.expensesHeader.join(",") + "\n"; // Header row
    
        this.excelDataExpense.forEach(fieldsData => {
            csvContent += `"${fieldsData.typeOfExpenses || 'No Data'}",` +
                          `"${fieldsData.description || 'No Data'}",` +
                          `"${fieldsData.gst}",` +
                          `"${fieldsData.amount}"\n`;
        });
    
        csvContent += `,"Total Expenses","","${this.expensesAmount}"\n\n`;
    
        // **Invoice Data Section**
        csvContent += `"Invoice Data"\n`;
        csvContent += this.invoicesHeader.join(",") + "\n"; // Header row
    
        this.excelDataInvoice.forEach(fieldsData => {
            csvContent += `"${fieldsData.taxinvoice}",` +
                          `"${fieldsData.date}",` +
                          `"${fieldsData.gst}",` +
                          `"${fieldsData.totalamount}"\n`;
        });
    
        csvContent += `,"Total Invoices","${this.invoiceAmount}"\n\n`;
    
        // **Download CSV File**
        let blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        let downloadElement = document.createElement("a");
        downloadElement.href = URL.createObjectURL(blob);
        downloadElement.target = "_self";
        downloadElement.download = "Wages.csv";
        document.body.appendChild(downloadElement);
        downloadElement.click();
    } */


    downloadWagesExcel() { 
        let doc = '<table>';

        // Add styles for the table
        doc += '<style>';
        doc += 'table, th, td {';
        doc += '    border: 0.8px solid gray;';
        doc += '    border-collapse: collapse;';
        doc += '}';
        doc += '</style>';
       
        doc += '<tr>';
        doc += '<td colspan="4"><h3 style="font-size: 24; font-family: Calibri;">' +  this.orgName + '</td>';
        doc += '</tr>';
        doc += '<tr>';
        doc += '<td colspan="4" style="font-size: 20; font-family: Calibri;">Address: ' + this.orgStreet +', '+ this.orgCity  +', '+ this.stateCode +', '+this.postalCode + '</td>';
        doc += '</tr>';
        doc += '<tr>';
        doc += '<td colspan="4" style="text-align:left;font-size: 20; font-family: Calibri;">Contact No: ' +  this.contactNo + '</td>';
        doc += '</tr>';
        doc += '<tr>';
        doc += '<td colspan="4" style="text-align:left; font-size: 20; font-family: Calibri;">ABN: ' + this.abn + '</td>';
        doc += '</tr>';
        
        doc += '<tr><td colspan="4"></td></tr>';
        doc += '<tr><td colspan="4"></td></tr>';

        doc += '<tr >';
        doc += '<th bgcolor="1a4876" colspan="8" style="font-size: 10; font-family: Calibri;">' + '<h2>' + '<font color="white" style="font-size: 17; font-family: Calibri;">' + 'Wages Data' + '</font>' + '</h2>' + '</th>';
        doc += '</tr>';

        function formatDate(dateStr) {
            var parts = dateStr.split('-');
            return parts[2] + '-' + parts[1] + '-' + parts[0];
        }

        // Reformat the dates
        var formattedSDate = formatDate(this.sdate);
        var formattedEDate = formatDate(this.edate);   
        
        doc += '<tr><td colspan="8" style="text-align:left;font-size: 17px; font-family: Calibri;">Start Date: ' + formattedSDate + ' and End Date: ' + formattedEDate +' </td></tr>';

        doc += '<tr>';
        this.wagesHeader.forEach(header => {
            doc += '<th bgcolor="c6c6c6" style="font-size: 17; font-family: Calibri;">' + header + '</th>'
        });
        doc += '</tr>';
        

        this.excelDataWages.forEach(fieldsData => {
            doc += '<tr>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.staffname + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + '$' +fieldsData.adminFee + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' +  '$' +fieldsData.preTax + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + '$' + fieldsData.postTax + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + '$' + fieldsData.superAnnuation + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + '$' + fieldsData.gross + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + '$' + fieldsData.tax + '</td>';
            //doc += '<td>' + fieldsData.netSal + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + '$' + fieldsData.netPay + '</td>';
            doc += '</tr>';
        });
        
        // Add a blank row for spacing
        doc += '<tr><td colspan="8"></td></tr>';

        // End of Table 1
        doc += '</table>';

        // Start of Table 2
        doc += '<table>';

        doc += '<tr >';
        doc += '<th bgcolor="1a4876" colspan="4" style="font-size: 10; font-family: Calibri;">' + '<h2>' + '<font color="white" style="font-size: 17; font-family: Calibri;">' + 'Expenses Data' + '</font>' + '</h2>' + '</th>';
        doc += '</tr>';

        doc += '<tr>';
        this.expensesHeader.forEach(header => {
            doc += '<th bgcolor="c6c6c6" style="font-size: 17; font-family: Calibri;">' + header + '</th>'
        });
        doc += '</tr>';

        // Add rows for the second table - Invoice Data
        this.excelDataExpense.forEach(fieldsData => {
                doc += '<tr>';
                //doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.name + '</td>';
                if(fieldsData.typeOfExpenses != undefined){
                    doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.typeOfExpenses + '</td>';
                } else {
                    doc += '<td style="font-size: 17px; font-family: Calibri;">' + 'No Data' + '</td>';
                }                
                if(fieldsData.description != undefined)
                {
                    doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.description + '</td>';
                } else {
                    doc += '<td style="font-size: 17px; font-family: Calibri;">' + 'No Data' + '</td>';
                }
                doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + '$' + fieldsData.gst + '</td>';
                doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + '$' + fieldsData.amount + '</td>';
                doc += '</tr>';
            });
            doc += '<tr><td colspan="4" style="text-align:right; font-size: 17px; font-family: Calibri;"><b>Total Amount : ' + '$' + this.expensesAmount + '</b></td></tr>';

            // Add a blank row for spacing
            doc += '<tr><td colspan="4"></td></tr>';

        // End of Table 2
        doc += '</table>';        

        // Start of Table 3
        doc += '<table>';
        doc += '<tr >';
        doc += '<th bgcolor="1a4876" colspan="4" style="font-size: 10; font-family: Calibri;">' + '<h2>' + '<font color="white" style="font-size: 17; font-family: Calibri;">' + 'Invoice Data' + '</font>' + '</h2>' + '</th>';
        doc += '</tr>';
        doc += '<tr>';
        this.invoicesHeader.forEach(header => {
            doc += '<th bgcolor="c6c6c6" style="font-size: 17; font-family: Calibri;">' + header + '</th>'
        });
        doc += '</tr>';

        // Add rows for the second table - Invoice Data
        this.excelDataInvoice.forEach(fieldsData => {
            doc += '<tr>';
            doc += '<td style="font-size: 17; font-family: Calibri;">' + fieldsData.taxinvoice + '</td>';
            // doc += '<td>' + fieldsData.Description__c + '</td>';
            doc += '<td style="font-size: 17; font-family: Calibri;">' + fieldsData.date + '</td>';
            doc += '<td style="font-size: 17; font-family: Calibri; text-align:right;">' + '$' +fieldsData.gst + '</td>';
            doc += '<td style="font-size: 17; font-family: Calibri; text-align:right;">' + '$' +fieldsData.totalamount + '</td>';            
            doc += '</tr>';
        });
        doc += '<tr><td colspan="4" style="text-align:right; font-size: 17px; font-family: Calibri;"><b>Total Amount : ' + '$' + this.invoiceAmount + '</b></td></tr>';
        // End of Table 3
        doc += '</table>';
        
        //var element = 'data:text/csv;charset=utf-8,' + encodeURIComponent(doc); //data:application/vnd.ms-excel
        var element = 'data:text/csv;charset=utf-8,' + encodeURIComponent(doc);
        let downloadElement = document.createElement('a');
        downloadElement.href = element;
        downloadElement.target = '_self';
        // use .csv or .xls as extension on below line if you want to export data
        downloadElement.download = 'Wages.xls';
        //downloadElement.download = 'Wages.xlsm';
        //downloadElement.download = 'Wages.xlsx';
        document.body.appendChild(downloadElement);
        downloadElement.click();
    } 
    handleBack(){
        // this.isHome=false;
        // this.backFlag=true;
         const customEvent = new CustomEvent('myevent', {
             detail: { message: 'WAGES' }
         });
         this.dispatchEvent(customEvent);
        
     }        
    
}