public with sharing class PayrollReportingHandler {
    @AuraEnabled
    public static List<Expenses__c> fetchExpenses(Date startDate, Date endDate, String facility){       
        List<Expenses__c> expList = [SELECT id,name,Type_of_Expense__c,Sub_type__c,Comments__c,Date__c,Amount__c,Incl_GST__c,Description__c
                                     FROM Expenses__c  WHERE Date__c >=:startDate AND Date__c <=:endDate AND Facility__c =:facility Order by createddate desc];
        return expList;
    }
    
    @AuraEnabled
    public static List<Invoice_Parent__c> fetchInvoices(Date startDate, Date endDate, string orgName){       
        List<Invoice_Parent__c> invoiceList = [select id,Name,Tax_Invoice__c,Total_Amount__c,Total_GST__c,Date_Issued__c,Org_Name__c,CSV_Descriprion__c,Final_CSV_Total__c,Total_CSV_GST__c,Is_Created_From_CSV__c FROM Invoice_Parent__c
                                               WHERE Date_Issued__c >=:startDate AND Date_Issued__c <=:endDate AND Org_Name__c =:orgName Order by createddate desc];
        return invoiceList;
    }
    @AuraEnabled
    public static List<PayrollWrapper> fetchStaffPayrollSetting(Date startDate, Date endDate, string orgName, String facilityName) {
       
        List<Staff_Payroll_Setting__c> staffList = [
            SELECT id, Management_Fee__c, Post_tax_values__c, Pre_tax_values__c, Start_Date__c, Frequency__c,Taxable_Gross_Salary__c,Staff__r.Facility__c,
            End_Date__c, Tax__c, Super_Annuation1__c, Gross_Salary__c, Net_Pay__c, Net_Annual__c, Resource_Name__c,Pay_Date__c,Gross_Salary_Display__c
            FROM Staff_Payroll_Setting__c
            WHERE Pay_Date__c >= :startDate AND Pay_Date__c <= :endDate AND Resource_Name__c != NULL AND Org_Name__c =:orgName AND Staff__r.Facility__r.Id =:facilityName Order by createddate desc
        ];        
        Map<String, PayrollWrapper> payrollMap = new Map<String, PayrollWrapper>();
        system.debug('staff payroll  list '+staffList);
        for (Staff_Payroll_Setting__c staff : staffList) {
            if (!payrollMap.containsKey(staff.Resource_Name__c)) {
                payrollMap.put(staff.Resource_Name__c, new PayrollWrapper(staff.Resource_Name__c, 0, 0, 0, 0, 0, 0, 0, 0));
            }
            PayrollWrapper wrapper = payrollMap.get(staff.Resource_Name__c);
            if(staff.Tax__c == null){
                wrapper.totalTax += 0;
            } else {
           		wrapper.totalTax += staff.Tax__c;
            }
            if(staff.Super_Annuation1__c == null){
                wrapper.superAnnuation += 0;
            } else{
                wrapper.superAnnuation += staff.Super_Annuation1__c;
            }
            //wrapper.gross += staff.Gross_Salary__c;
            if(staff.Net_Annual__c == null){
                wrapper.netSal += 0;
            }else{
                wrapper.netSal += staff.Net_Annual__c;  
            }
            
           // wrapper.netSal += staff.Net_Annual__c;
            if(staff.Net_Pay__c == null){
                wrapper.netPayable += 0;
            } else {
                wrapper.netPayable += staff.Net_Pay__c;
            }
            if(staff.Gross_Salary_Display__c == null){
                wrapper.totalGross += 0;
            } else {
                wrapper.totalGross += staff.Gross_Salary_Display__c;
            }
            if(staff.Pre_tax_values__c == null){
                wrapper.totalpreTax += 0;
            } else {
                wrapper.totalpreTax += staff.Pre_tax_values__c;
            }
            if(staff.Post_tax_values__c == null){
                wrapper.totalpostTax += 0;
            } else {
				wrapper.totalpostTax += staff.Post_tax_values__c;                
            }
            if(staff.Management_Fee__c == null){
                wrapper.adminFee += 0;
            } else {
                wrapper.adminFee += staff.Management_Fee__c;
            }
            
        }
        
        return new List<PayrollWrapper>(payrollMap.values());
    }
    
    public class PayrollWrapper {
        @AuraEnabled
        public String resourceName { get; set; } // Updated to store resource name directly
        @AuraEnabled
        public Decimal totalTax { get; set; }
        @AuraEnabled
        public Decimal superAnnuation { get; set; }
        //@AuraEnabled
        //public Decimal gross { get; set; }
        @AuraEnabled
        public Decimal netSal { get; set; }
        @AuraEnabled
        public Decimal netPayable { get; set; }
        @AuraEnabled
        public Decimal totalGross { get; set; }
        @AuraEnabled
        public Decimal totalpreTax { get; set; }
        @AuraEnabled
        public Decimal totalpostTax { get; set; }
        @AuraEnabled
        public Decimal adminFee { get; set; }
        
        public PayrollWrapper(String resourceName, Decimal totalTax, Decimal adminFee, Decimal superAnnuation, Decimal netSalary, Decimal netPayable, Decimal totalGross, Decimal totalpreTax, Decimal totalpostTax ) {
            this.resourceName = resourceName;
            this.totalTax = totalTax;
            this.superAnnuation = superAnnuation;
            //this.gross = gross;
            this.netSal = netSalary;
            this.netPayable = netPayable;
            this.totalGross = totalGross;
            this.totalpreTax = totalpreTax;
            this.totalpostTax = totalpostTax;
            this.adminFee = adminFee;
        }
    }   
}