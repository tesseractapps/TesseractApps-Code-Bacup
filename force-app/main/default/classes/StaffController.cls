/**
 * Test Class         : AddShiftControllerTest  
**/
public with sharing class StaffController {
    // apex method to fetch Staff__c records from salesforce database 
    @AuraEnabled(cacheable = true)
    public static list<Staff__c> fetchStaffs(string recordId,String firstname,String lastname){ 
        list<Staff__c> staffList = new list<Staff__c>();
        System.debug('firstname '+firstname);
        System.debug('lastname '+lastname);
        
        System.debug('recordId '+recordId);
        String trucatedStr = recordId.substring(0,15);
        String[] filters = new String[0];
        if(firstname !=''){
            string fname=firstname+'%';
            filters.add('Name Like : fname');
        }
        if(lastname !=''){
            string lname=lastname+'%';
            filters.add('Last_Name__c Like : lname');
        }
        filters.add('Organization_Name__c = : trucatedStr');       
        
        String query='SELECT id,Facility__r.Name,NameToDisplay__c,Facility_Name__c,CreatedBy.Name,Type_of_User__c,Staff_Status__c,Status__c,Organization_Name__c,Last_Name__c ,Name,picture__c,Facility__c,Contact_Number__c,Amazon_URL__c,address__Street__s,address__City__s,address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s,AddressData__c,Pre_Tax_Calculator__c,Pre_Tax_One_Description__c,Pre_Tax_One_Value__c,Pre_Tax_Two_Description__c,Pre_Tax_Two_Value__c,Pre_Tax_Three_Description__c,Pre_Tax_Three_Value__c,Pre_Tax_Four_Description__c,Pre_Tax_Four_Value__c,Pre_Tax_Five_Description__c,Pre_Tax_Five_Value__c,Post_Tax__c,Post_Tax_Decription__c,Make_Primary_as_Approver__c,Make_Secondary_as_Approver__c,Voluntary_Contribution__c,Voluntary_Contribution_Fixed__c,Annual_Leave__c,Sick_Leave__c,Parental_Leave__c,Bereavement_Leave__c,Voluntary_Contribution_Percent__c,Email_Address__c,Set_Hours__c,(select id,Name,Type__c,Expiry_Date__c,View_File__c,Comments__c  from Child_Staffs__r) FROM Staff__c ';
        if(filters.size() > 0) {
            query += ' WHERE ' + String.join(filters, ' AND ');
        } 
        query += ' ORDER BY CreatedDate ASC';
        system.debug('query>>>>'+query);           
        staffList=Database.query(query);
        
        return staffList;   
    } 
    @AuraEnabled
    public static void statusStaff(String IdValue,String status){
        Staff__c fact=new Staff__c(Id=IdValue);
        fact.Status__c=Boolean.valueOf(status);
        try{
            Update fact;
        }catch(Exception e){
            System.debug(e);
        }
    }
    @AuraEnabled
    public static Staff__c fetchStaff(String recordId){
        Staff__c staffRec = new Staff__c();
        // if(!Test.isRunningTest()) 
        staffRec = [SELECT id,Facility__r.Name,NameToDisplay__c,Status__c,Organization_Name__c,Last_Name__c ,Name,Annual_Leave__c,Sick_Leave__c,Parental_Leave__c,Bereavement_Leave__c,Picture__c,
                    Facility__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Pre_Tax_Calculator__c,Make_Primary_as_Approver__c,Make_Secondary_as_Approver__c,Pre_Tax_One_Description__c,Pre_Tax_One_Value__c,Pre_Tax_Two_Description__c,Pre_Tax_Two_Value__c,Pre_Tax_Three_Description__c,Pre_Tax_Three_Value__c,Pre_Tax_Four_Description__c,Pre_Tax_Four_Value__c,Pre_Tax_Five_Description__c,Pre_Tax_Five_Value__c,Post_Tax__c,Post_Tax_Decription__c,
                    Address__CountryCode__s,Address__PostalCode__s,Voluntary_Contribution__c,Voluntary_Contribution_Fixed__c,Voluntary_Contribution_Percent__c,(select id,Name,Type__c,Expiry_Date__c,View_File__c,Comments__c from Child_Staffs__r) FROM Staff__c where  Id  =: recordId ];
        return staffRec;
    }
    
    @AuraEnabled(cacheable=true)
    public static list<Staff__c> getStaffById(Id recordId) {
        return [SELECT id,Facility__r.Name,Primary_Contact_First_Name__c,Primary_Contact_Last_Name__c,Primary_Contact_Number__c,Secondary_Contact_First_Name__c,Secondary_Contact_Last_Name__c,Secondary_Contact_Number__c,NameToDisplay__c,Status__c,Organization_Name__c,Last_Name__c ,Name,Picture__c,Gender__c,Role__c,
                Facility__c,Age__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Pre_Tax_Calculator__c,Make_Primary_as_Approver__c,Make_Secondary_as_Approver__c,Pre_Tax_One_Description__c,Pre_Tax_One_Value__c,Pre_Tax_Two_Description__c,Pre_Tax_Two_Value__c,Pre_Tax_Three_Description__c,Pre_Tax_Three_Value__c,Pre_Tax_Four_Description__c,Pre_Tax_Four_Value__c,Pre_Tax_Five_Description__c,Pre_Tax_Five_Value__c,Post_Tax__c,Post_Tax_Decription__c,
                Working_Hours_Rate__c,Saturday_Hourly_Rate__c,Sunday_Hourly_Rate__c,Public_holiday_Hourly_Rate__c,Afternoon_shift_Hourly_Rate__c,Night_shift_Hourly_Rate__c,Category_Type__c,Type_of_Job__c,Classification_Level__c,Classification_Pay_Point__c,Superannuation_Inc_or_Exc__c,Paid_Break__c,
                Type_of_User__c,Fixed_Rate_or_Not__c,Address__CountryCode__s,Address__PostalCode__s,Voluntary_Contribution__c,Voluntary_Contribution_Fixed__c,Voluntary_Contribution_Percent__c,Attendance__c,Annual_Leave__c,Sick_Leave__c,Parental_Leave__c,Bereavement_Leave__c,State__c,(select id,Name,Type__c,Expiry_Date__c,View_File__c,Comments__c from Child_Staffs__r) FROM Staff__c where  Id  =: recordId];
    } 
    @AuraEnabled(cacheable=true)
    public static list<Staff__c> getStaffByStatus(String recordId) {
        return [SELECT id,Facility__r.Name,Primary_Contact_First_Name__c,Primary_Contact_Last_Name__c,Primary_Contact_Number__c,Secondary_Contact_First_Name__c,Secondary_Contact_Last_Name__c,Secondary_Contact_Number__c,NameToDisplay__c,Status__c,Organization_Name__c,Last_Name__c ,Name,Picture__c,Gender__c,Role__c,
                Facility__c,Age__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Pre_Tax_Calculator__c,Make_Primary_as_Approver__c,Make_Secondary_as_Approver__c,Pre_Tax_One_Description__c,Pre_Tax_One_Value__c,Pre_Tax_Two_Description__c,Pre_Tax_Two_Value__c,Pre_Tax_Three_Description__c,Pre_Tax_Three_Value__c,Pre_Tax_Four_Description__c,Pre_Tax_Four_Value__c,Pre_Tax_Five_Description__c,Pre_Tax_Five_Value__c,Post_Tax__c,Post_Tax_Decription__c,
                Working_Hours_Rate__c,Saturday_Hourly_Rate__c,Sunday_Hourly_Rate__c,Public_holiday_Hourly_Rate__c,Afternoon_shift_Hourly_Rate__c,Night_shift_Hourly_Rate__c,Category_Type__c,Type_of_Job__c,Classification_Level__c,Classification_Pay_Point__c,Superannuation_Inc_or_Exc__c,Paid_Break__c,
                Type_of_User__c,Fixed_Rate_or_Not__c,Address__CountryCode__s,Address__PostalCode__s,Voluntary_Contribution__c,Voluntary_Contribution_Fixed__c,Voluntary_Contribution_Percent__c,Attendance__c,Annual_Leave__c,Sick_Leave__c,Parental_Leave__c,Bereavement_Leave__c,State__c,(select id,Name,Type__c,Expiry_Date__c,View_File__c,Comments__c from Child_Staffs__r) FROM Staff__c where  Id  =: recordId and  Status__c=true ];
    }
    @AuraEnabled(cacheable=true)
    public static list<Staff__c> getStaffByEmail(String email) {
        return [SELECT id,Facility__r.Name,Primary_Contact_First_Name__c,Role__c,Primary_Contact_Last_Name__c,Primary_Contact_Number__c,Secondary_Contact_First_Name__c,Secondary_Contact_Last_Name__c,Secondary_Contact_Number__c,NameToDisplay__c,Status__c,Organization_Name__c,Last_Name__c ,Name,Picture__c,Gender__c,Email_Address__c,Accessible_Forms__c,Enable_Geolocation__c,
                Facility__c,Age__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Pre_Tax_Calculator__c,Make_Primary_as_Approver__c,Make_Secondary_as_Approver__c,Pre_Tax_One_Description__c,Pre_Tax_One_Value__c,Pre_Tax_Two_Description__c,Pre_Tax_Two_Value__c,Pre_Tax_Three_Description__c,Pre_Tax_Three_Value__c,Pre_Tax_Four_Description__c,Pre_Tax_Four_Value__c,Pre_Tax_Five_Description__c,Pre_Tax_Five_Value__c,Post_Tax__c,Post_Tax_Decription__c,
                Address__CountryCode__s,Address__PostalCode__s,Voluntary_Contribution__c,Voluntary_Contribution_Fixed__c,Voluntary_Contribution_Percent__c,Annual_Leave__c,Sick_Leave__c,Parental_Leave__c,Bereavement_Leave__c,Fixed_Rate_or_Not__c,(select id,Name,Type__c,Expiry_Date__c,View_File__c,Comments__c from Child_Staffs__r) FROM Staff__c where  Email_Address__c  =: email];
    }
    
    @AuraEnabled
    public static List<Staff__c> fetchStaffList(String recordId){
        List<Staff__c> staffList = new List<Staff__c>();
        String trucatedStr = recordId.substring(0,15);
        // if(!Test.isRunningTest()) 
        staffList =  [SELECT id,Facility__r.Name,Tax_free_threshold__c,NameToDisplay__c,Status__c,Organization_Name__c,Last_Name__c ,Name,
                      Facility__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,
                      Address__CountryCode__s,Address__PostalCode__s FROM Staff__c where  Organization_Name__c = : trucatedStr ];
        return staffList;
    }
    
    @AuraEnabled
    public static List<Staff__c> StaffsRolesWiseList(string orgId,List<string> facIdlist,list<string> roles,String name){
        list<Staff__c> staffList= new list<Staff__c>();
        String trucatedStr = orgId.substring(0,15);
        system.debug('faclist list '+facIdlist);
        system.debug(' Roles list '+roles);
        String query = 'SELECT id, Set_Hours__c, picture__c, Name, Last_Name__c, Role__c, Working_Hours_Rate__c, Saturday_Hourly_Rate__c, Sunday_Hourly_Rate__c, Public_holiday_Hourly_Rate__c, Afternoon_shift_Hourly_Rate__c, Night_shift_Hourly_Rate__c, Attendance__c, NameToDisplay__c,SCR__c,Classification_Level__c,Classification_Pay_Point__c,Class_and_Paypont__c , (SELECT Id, Type_of_Leave__c, From__c, To__c, Reason__c, Status__c, Leave_Document__c, Duration__c, Approved_by__c, Comments__c FROM Leaves__r WHERE Status__c = \'Approved\') FROM Staff__c WHERE Organization_Name__c = :trucatedStr AND Facility__r.Status__c = true and Status__c=true';
        if(facIdlist.size()>0){
            query += ' AND Facility__c IN:facIdlist ' ;
            
        } 
        if (roles.size() > 0) {
            // Construct INCLUDES clause properly with parentheses
            List<String> includesConditions = new List<String>();
            for (String role : roles) {
                includesConditions.add('Role__c INCLUDES (\'' + role + '\')');
            }
            // Join all the INCLUDES conditions with OR
            query += ' AND (' + String.join(includesConditions, ' OR ') + ')';
        }
        if (name != null && name.trim() != '') {
            query += ' AND NameToDisplay__c LIKE \'%' + name + '%\'';
        }
        
        system.debug('query>>>>'+query);          
        staffList=Database.query(query);
        system.debug('list>>>>'+staffList);  
        return staffList;
        
    }
    
    @AuraEnabled
    public static list<Child_Staff__c> insertPreTax(String JsonString,string staffID,boolean isPretax){
        list<Child_Staff__c> StaffPreTaxList= new list<Child_Staff__c> ();
        List<preTaxWrapper> preWrapperList = (List<preTaxWrapper>)System.JSON.deserialize(JsonString,List<preTaxWrapper>.class);
        system.debug('Pre tax wrapper'+preWrapperList);
        try{
            for(preTaxWrapper pretax:preWrapperList){
                Child_Staff__c cs = new Child_Staff__c ();
                
                cs.Expiry_Date__c=Date.valueOf(pretax.staffExpirydate);
                cs.Type__c=pretax.typeOfDocument;
                // cs.Base64__c=pretax.base64Data;
                cs.File_Name__c=pretax.fileName;
                cs.Comments__c=pretax.comment;
                cs.Staff__c=staffID;
                StaffPreTaxList.add(cs);
            } 
            insert StaffPreTaxList;
        }catch(exception e){
            throw new AuraHandledException(e.getMessage());
        }
        return StaffPreTaxList;
    }
    public class preTaxWrapper{
        public String index;
        public String description;  
        public String quantity; 
        public String typeOfDocument;  
        public String fileName; 
        public String staffExpirydate;
        public String comment;
    } 
    @AuraEnabled
    public static List<Shad_award__c> getShadAwards(string categoryType,string jobType,string classificationType,string classificationPayType ){
        return [select id,Afternoon_shift_Hourly_Rate__c,Category_Type__c,Classification_Level__c,Classification_Pay_Point__c,General_Hourly_pay_rate__c,Night_shift_Hourly_Rate__c,
                Public_holiday_Hourly_Rate__c,Saturday_Hourly_Rate__c,Name,Sunday_Hourly_Rate__c,Type_of_Employment__c from Shad_award__c where Category_Type__c =:categoryType and  Type_of_Employment__c =: jobType and Classification_Level__c =:classificationType and Classification_Pay_Point__c=:classificationPayType ];
    }
    
    @AuraEnabled(cacheable = true)
    public static List<Facility__c> fetchFacilitiess() { 
        List<Facility__c> lstFacility = new List<Facility__c>();
        Organisation__c orgNames = new Organisation__c();
        
        // Fetch the current logged-in user's details
        User objUser = [SELECT Phone, Id,Email, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
        
        // Fetch the organisation based on the user's organisation name
        if (!Test.isRunningTest()) {
            orgNames = [SELECT Id, Name, ABN__c, ACN__c, NDIS_Provider__c, Contact_No__c, Email__c, Address__c FROM Organisation__c WHERE Name = :objUser.Organization_Name__c];
        }
        
        // Query all the facilities related to the user's organisation
        lstFacility = [
            SELECT Id, Name, Email__c, AddressData__c, Phone__c, Status__c, Services__c, Organisation__r.Name,
            Manager_Name__c, Address__Street__s, Address__City__s, Address__StateCode__s, Address__CountryCode__s,
            Address__PostalCode__s, Organisation__r.Afternoon_Shift_End_Time__c, Organisation__r.Afternoon_Shift_Start_Time__c,
            Organisation__r.Custom_Shift_End_Time__c, Organisation__r.Custom_Shift_Start_Time__c, 
            Organisation__r.General_Shift_End_Time__c, Organisation__r.General_Shift_Start_Time__c, 
            Organisation__r.Morning_Shift_End_Time__c, Organisation__r.Morning_Shift_Start_Time__c,
            Organisation__r.Night_Shift_Start_Time__c, Organisation__r.Night_Shift_End_Time__c,
            Organisation__r.Sleepover_Start__c, Organisation__r.Sleepover_Shift_End_Time__c
            FROM Facility__c
            WHERE Organisation__r.Id = :orgNames.Id AND Status__c = TRUE
            ORDER BY Name ASC
        ];
        
        List<Staff__c> staffRecords = [SELECT Id, Email_Address__c, Facility__c 
                                           FROM Staff__c 
                                           WHERE Email_Address__c = :objUser.Email LIMIT 1];	
        
        // Now prioritize the current user's facility (if any) by moving it to the top
        if (staffRecords[0].Facility__c != null) {
            // Find the current user's facility in the list
            for (Integer i = 0; i < lstFacility.size(); i++) {
                if (lstFacility[i].Id == staffRecords[0].Facility__c) {
                    // Move this facility to the front of the list
                    Facility__c currentFacility = lstFacility.remove(i);
                    lstFacility.add(0, currentFacility);
                    break;
                }
            }
        }
        
        return lstFacility;   
    }
    
    
}