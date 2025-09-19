/**
* @description       : 
* @author            : Raja Sekhar Reddy
* @group             : 
* @Test Class 		  : PayrollPdfDataTest
* @last modified on  : 06-29-2023
* @last modified by  : Raja Sekhar Reddy
**/
public class PayrollPdfData {
    @AuraEnabled
    public static Payroll_Setting__c statusPayrollSetting(String paysetId){
        return [select id,Status__c from Payroll_Setting__c where id=:paysetId];
        
    }
    
    @AuraEnabled
    public static List<String> updateSubmit(String paysetId,String statusValue, string changedpayDate){
        String trucatedStr = paysetId.substring(0,15); 
        List<String> StaffPayrollIds = new List<String>();
        if(statusValue == 'Submitted'){
            List<Staff_Payroll_Setting__c> staffList = [select id,Payroll_Setting__c from Staff_Payroll_Setting__c where Payroll_Setting__c=:trucatedStr];
            for(Staff_Payroll_Setting__c stafList : staffList){
                StaffPayrollIds.add(stafList.Id);

                Staff_Payroll_Setting__c chPayrollSetting = new Staff_Payroll_Setting__c(Id=stafList.Id); 
                chPayrollSetting.Pay_Date__c = Date.valueOf(changedpayDate);
                update chPayrollSetting;
            }
            
        }
        Payroll_Setting__c payrollSetting = new Payroll_Setting__c(Id=paysetId);
        if (statusValue == 'Delete')
        {
            payrollSetting.Status__c='';
        }
        else
        {
            payrollSetting.Status__c=statusValue;
        }     
        
        //if(statusValue == 'Delete'){
            //PayrollSettingSchedular.createPayRunSettingDelete(paysetId);
        //}
        
        update payrollSetting;
        return StaffPayrollIds;
    }
    @AuraEnabled
    public static List<paySlipData> payrollRun(String staffPayrollId){ 
        List<paySlipData> payDataList= new List<paySlipData>(); 
        
        Staff_Payroll_Setting__c staffpayroll = [ Select id,Name,Gross_Salary__c,Gross_Salary_Display__c,Post_tax_values__c,Post_Tax_Decription__c,Post_Tax_Formula__c,Tax__c,Net_Pay__c,Super_Annuation_Final__c,Tax_Annual__c,Taxable_Gross_Salary__c,
                                                 Pre_tax_values__c,Pre_Tax_Formula__c,Staff__c,Payroll_Setting__r.Period_End_Date__c,Net_Annual__c,Super_Annuation_Annual__c,
                                                 Payroll_Setting__r.Period_Start_Date__c,Payroll_Setting__r.Next_Pay_Date__c,Payroll_Setting__r.Frequency__c,Working_Hours__c,Saturday_hours__c,Sunday_hours__c,
                                                 Current_Salary_Wages_YTD__c,Current_Superannuation_YTD__c,Current_Tax_YTD__c,Current_Post_Tax_YTD__c,Current_Pre_Tax_YTD__c,
                                                 Penalty_Hours__c,Public_Holiday__c,Payroll_Setting__r.Period__c,Pay_Date__c,Current_Taxble_Gross_Salary_YTD__c,Current_Net_Pay_Salary_YTD__c,Reimbursements__c,
                                                 Pre_Tax_One_Description__c,Pre_Tax_One_Value__c,Pre_Tax_Two_Description__c,Pre_Tax_Two_Value__c,Pre_Tax_Three_Description__c,Custom_Shift_Hours__c,
                                                 Pre_Tax_Three_Value__c,Pre_Tax_Four_Description__c,Pre_Tax_Four_Value__c ,Pre_Tax_Five_Description__c ,Pre_Tax_Five_Value__c,Voluntary_Contribution__c,Holiday_Hourly_Rate__c
                                                 ,Voluntary_Contribution_Percent__c ,Voluntary_Contribution_Fixed__c,Voluntary_Percent_Values__c,Super_And_Voluntary_Supper_Annuation__c,Type_of_User__c,Sleepover_Hours__c,Extended_Duration__c,Sleepover_Night_Shift_hours__c,
                                                 General_Shift_Hour__c,Night_Shift_Hours__c,Afternoon_shift_Hours__c,Afternoon_shift_Hourly_Rate__c,Night_shift_Hourly_Rate__c,Saturday_Hourly_Rate__c,Sunday_Hourly_Rate__c,Current_Voluntary_Superannuation_YTD__c,
                                                 Current_Super_and_Voluntaryannuation_YTD__c  from 
                                                
                                                 Staff_Payroll_Setting__c where id=:staffPayrollId];
        System.debug('staffpayroll.Staff__c '+staffpayroll); 
        Staff__c staffRec = new Staff__c();
        if(!Test.isRunningTest())
        staffRec =[select id,Name,Last_Name__c,Facility__c,Working_Hours_Rate__c,Contact_Number__c,
                            Address__c,Employment_type__c,BSB__c,Account_Number__c,Email_Address__c,
                            Organization_Name__c,Address__Street__s,
                            Address__City__s,Address__StateCode__s,Address__CountryCode__s,
                            Address__PostalCode__s,Base_Rate__c,Job_Title__c,Pre_Tax_Calculator__c,Post_Tax__c
                            From Staff__c where id=:staffpayroll.Staff__c];
        
        System.debug('staffRec '+staffRec.Email_Address__c);
        
        paySlipData payData= new paySlipData();
        
        Organisation__c orgDetails=new Organisation__c();
        String orgName=staffRec.Organization_Name__c;
         If(!Test.isRunningTest()){
            orgDetails=[select id,Name,ABN__c,ACN__c,Email__c,Address_Latest__c,Contact_No__c,
                    NDIS_Provider__c,Organization_Logo__c,Account_Name__c,Account_Number__c,
                    Bank__c,BSB__c,Description__c,RCTI__c,Address_Latest__Street__s,
                    Address_Latest__City__s,Address_Latest__StateCode__s,Address_Latest__CountryCode__s,
                    Address_Latest__PostalCode__s  from Organisation__c where Id=:orgName];
        
    
            Matcher imgMatcher = Pattern.compile( '<p(.+?)>' ).matcher( orgDetails.Organization_Logo__c );
            
            // iterate each image tag found
            while ( imgMatcher.find() ) {
                String imageTag = imgMatcher.group(); String imageURL = imageTag.substringBetween( ' src="', '"' );
                String decodedURL = imageURL.unescapeHtml4();
                PageReference page=new PageReference(decodedURL);
                Blob imageblob = page.getContent(); String fileString='data:image/png;base64,'+EncodingUtil.Base64Encode(imageblob);
                
                payData.bolbdata=fileString;

            }
            System.debug('payData.bolbdata Information '+payData.bolbdata);
        } 
        payData.organization=orgDetails;
        payData.workingHours=staffpayroll.Working_Hours__c;
        payData.publicHolidayHours=staffpayroll.Public_Holiday__c;
        payData.penaltyWorkHours=staffpayroll.Penalty_Hours__c;
        payData.staffData=staffRec;
        payData.staffpayrollData=staffpayroll;
        payDataList.add(payData);
        
        return payDataList;
        
    }
    public class paySlipData{
        @AuraEnabled
        public decimal workingHours{set;get;}
        @AuraEnabled
        public decimal penaltyWorkHours{set;get;}
        @AuraEnabled
        public decimal publicHolidayHours{set;get;}
        @AuraEnabled
        public Organisation__c organization{set;get;}
        @AuraEnabled
        public Staff__c staffData{set;get;}
        @AuraEnabled
        public Staff_Payroll_Setting__c staffpayrollData{set;get;}
        @AuraEnabled
        public String bolbdata{set;get;}
        
    }
    
}