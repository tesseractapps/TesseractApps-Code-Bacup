/**
* Test Class         : AddShiftControllerTest  
**/
public with sharing class StaffController {
    // apex method to fetch Staff__c records from salesforce database 
    @AuraEnabled(cacheable = true)
    public static list<Staff__c> fetchStaffs(string recordId,String firstname,String lastname){ //lastname
        list<Staff__c> staffList = new list<Staff__c>();
        System.debug('firstname '+firstname);
        System.debug('lastname '+lastname);
        
        System.debug('recordId '+recordId);
        String trucatedStr = recordId.substring(0,15);
        String[] filters = new String[0];
        if(firstname !=''){
            string fname='%'+firstname+'%';
            filters.add('Name Like : fname');
        }
        if(lastname !=''){
            string lname='%'+lastname+'%';
            filters.add('Last_Name__c Like : lname');  //Last_Name__c
        }
        filters.add('Organization_Name__c = : trucatedStr');       
        
        String query='SELECT id,Facility__r.Name,Facility__r.Id,Manager__c,User_Type__c,NameToDisplay__c,Display_Nickname__c,Facility_Name__c,CreatedBy.Name,Type_of_User__c,Staff_Status__c,Status__c,Organization_Name__c,Last_Name__c ,Name,picture__c,Facility__c,Contact_Number__c,Amazon_URL__c,address__Street__s,address__City__s,address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s,AddressData__c,Pre_Tax_Calculator__c,Pre_Tax_One_Description__c,Pre_Tax_One_Value__c,Pre_Tax_Two_Description__c,Pre_Tax_Two_Value__c,Pre_Tax_Three_Description__c,Pre_Tax_Three_Value__c,Pre_Tax_Four_Description__c,Pre_Tax_Four_Value__c,Pre_Tax_Five_Description__c,Pre_Tax_Five_Value__c,Post_Tax__c,Post_Tax_Decription__c,Make_Primary_as_Approver__c,Make_Secondary_as_Approver__c,Voluntary_Contribution__c,Voluntary_Contribution_Fixed__c,Annual_Leave__c,Sick_Leave__c,Parental_Leave__c,Bereavement_Leave__c,Voluntary_Contribution_Percent__c,Email_Address__c,Set_Hours__c,Role__c,(SELECT Id, RoleName__c, Active__c FROM StaffRoles__r WHERE Active__c = TRUE),(select id,Name,Type__c,Expiry_Date__c,View_File__c,Comments__c,Document_Type__c  from Child_Staffs__r),(Select  Id,Facility__c,Facility__r.Name, Active__c,Staff__c from Staff_Facilities__r WHERE Active__c = true )  FROM Staff__c ';
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
        system.debug('recordId >>'+ recordId);
        Staff__c staffRec = new Staff__c();
        // if(!Test.isRunningTest()) 
        staffRec = [SELECT Id,Facility__r.Name,NameToDisplay__c,Status__c,Nationality__c,Languages__c,Organization_Name__c,Last_Name__c,Name,Annual_Leave__c,Sick_Leave__c,Parental_Leave__c,Bereavement_Leave__c,Picture__c,Facility__c,Contact_Number__c,Address__Street__s,Address__City__s,Address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s,Pre_Tax_Calculator__c,Make_Primary_as_Approver__c,Make_Secondary_as_Approver__c,Pre_Tax_One_Description__c,Pre_Tax_One_Value__c,Pre_Tax_Two_Description__c,Pre_Tax_Two_Value__c,Pre_Tax_Three_Description__c,Pre_Tax_Three_Value__c,Pre_Tax_Four_Description__c,Pre_Tax_Four_Value__c,Pre_Tax_Five_Description__c,
        Pre_Tax_Five_Value__c,Post_Tax__c,Post_Tax_Decription__c,Voluntary_Contribution__c,Voluntary_Contribution_Fixed__c,Voluntary_Contribution_Percent__c,SelectedRole__c,Gender__c,Role__c,Display_Nickname__c,Nursning_Awards__c,Nursing_Category_Type__c,Nursing_Classification_Level__c,Nursing_Classification_Pay_Point__c,Child_Care_Awards__c,Age__c,Working_Hours_Rate__c,Saturday_Hourly_Rate__c,Sunday_Hourly_Rate__c,Public_holiday_Hourly_Rate__c,Afternoon_shift_Hourly_Rate__c,Night_shift_Hourly_Rate__c,Category_Type__c,Type_of_Job__c,Classification_Level__c,Classification_Pay_Point__c,Superannuation_Inc_or_Exc__c,Paid_Break__c,Sleepover_Allowance__c,Enable_Geolocation__c,Type_of_User__c,
        Fixed_Rate_or_Not__c,Attendance__c,Annual_leave_Accrued__c,Personal_Leave_Accur__c,ABN_Number__c,TFN_number__c,Facility__r.Organisation__c,Facility__r.Organisation__r.Cash_out__c,Facility__r.Organisation__r.Negative_Balance__c,Facility__r.Organisation__r.Other_Leave_Type__c,Type_of_Employe__c,(SELECT Id,RoleName__c,Active__c FROM StaffRoles__r WHERE Active__c=true),(SELECT Id,Facility__c,Facility__r.Name,Active__c,Staff__c FROM Staff_Facilities__r WHERE Active__c=true),(SELECT Id,Name,Type__c,Expiry_Date__c,View_File__c,Comments__c,Compliance__c,Status__c,Points__c,Key__c,Rejected_Comments__c,Document_Type__c FROM Child_Staffs__r),(SELECT Id,Annual_Used__c,Personal_Used__c FROM Leaves__r) FROM Staff__c WHERE Id=:recordId
 ];
        return staffRec;
    }
    
    @AuraEnabled(cacheable=true)
    public static list<Staff__c> getStaffById(Id recordId) {
        return [SELECT id,Facility__r.Name,SelectedRole__c,Nationality__c,Languages__c,Primary_Contact_First_Name__c,Primary_Contact_Last_Name__c,Primary_Contact_Number__c,Secondary_Contact_First_Name__c,Secondary_Contact_Last_Name__c,Secondary_Contact_Number__c,NameToDisplay__c,Status__c,Organization_Name__c,Last_Name__c ,Name,Picture__c,Gender__c,Role__c,Display_Nickname__c,Nursning_Awards__c,Nursing_Category_Type__c,Nursing_Classification_Level__c,Nursing_Classification_Pay_Point__c,Child_Care_Awards__c,
                Facility__c,Age__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Pre_Tax_Calculator__c,Make_Primary_as_Approver__c,Make_Secondary_as_Approver__c,Pre_Tax_One_Description__c,Pre_Tax_One_Value__c,Pre_Tax_Two_Description__c,Pre_Tax_Two_Value__c,Pre_Tax_Three_Description__c,Pre_Tax_Three_Value__c,Pre_Tax_Four_Description__c,Pre_Tax_Four_Value__c,Pre_Tax_Five_Description__c,Pre_Tax_Five_Value__c,Post_Tax__c,Post_Tax_Decription__c,
                Working_Hours_Rate__c,Saturday_Hourly_Rate__c,Sunday_Hourly_Rate__c,Public_holiday_Hourly_Rate__c,Afternoon_shift_Hourly_Rate__c,Night_shift_Hourly_Rate__c,Category_Type__c,Type_of_Job__c,Classification_Level__c,Classification_Pay_Point__c,Superannuation_Inc_or_Exc__c,Paid_Break__c,Sleepover_Allowance__c,
                TFN_number__c, ABN_Number__c,Enable_Geolocation__c,Type_of_User__c,Fixed_Rate_or_Not__c,Address__CountryCode__s,Address__PostalCode__s,Voluntary_Contribution__c,Voluntary_Contribution_Fixed__c,Voluntary_Contribution_Percent__c,Attendance__c,Annual_Leave__c,Sick_Leave__c,Parental_Leave__c,Bereavement_Leave__c,State__c,Annual_leave_Accrued__c,Personal_Leave_Accur__c,Facility__r.Organisation__c,Facility__r.Organisation__r.Cash_out__c, Facility__r.Organisation__r.Negative_Balance__c,Facility__r.Organisation__r.Leave_Loading__c,Facility__r.Organisation__r.Leave_Loading_Rate__c,Facility__r.Organisation__r.Other_Leave_Type__c,Type_of_Employe__c,(SELECT Id, RoleName__c, Active__c FROM StaffRoles__r WHERE Active__c = true),(select id,Name,Type__c,Expiry_Date__c,View_File__c,Comments__c,Compliance__c,Points__c,Status__c,key__c,Document_Type__c from Child_Staffs__r),(SELECT Id, Annual_Used__c, Personal_Used__c FROM Leaves__r),(Select  Id,Facility__c,Facility__r.Name, Active__c,Staff__c from Staff_Facilities__r WHERE Active__c = true ) FROM Staff__c where  Id  =: recordId];
    }
    
      @AuraEnabled
    public static list<Staff__c> getStaffsByOrg(Id recordId, Id FacilityId) {
        return [SELECT id,Facility__r.Name,SelectedRole__c,Manager__c,User_Type__c,Email_Address__c,Nationality__c,Languages__c,Primary_Contact_First_Name__c,Primary_Contact_Last_Name__c,Primary_Contact_Number__c,Secondary_Contact_First_Name__c,Secondary_Contact_Last_Name__c,Secondary_Contact_Number__c,NameToDisplay__c,Status__c,Organization_Name__c,Last_Name__c ,Name,Picture__c,Gender__c,Role__c,Display_Nickname__c,Nursning_Awards__c,Nursing_Category_Type__c,Nursing_Classification_Level__c,Nursing_Classification_Pay_Point__c,Child_Care_Awards__c,
                Facility__c,Age__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Pre_Tax_Calculator__c,Make_Primary_as_Approver__c,Make_Secondary_as_Approver__c,Pre_Tax_One_Description__c,Pre_Tax_One_Value__c,Pre_Tax_Two_Description__c,Pre_Tax_Two_Value__c,Pre_Tax_Three_Description__c,Pre_Tax_Three_Value__c,Pre_Tax_Four_Description__c,Pre_Tax_Four_Value__c,Pre_Tax_Five_Description__c,Pre_Tax_Five_Value__c,Post_Tax__c,Post_Tax_Decription__c,
                Working_Hours_Rate__c,Saturday_Hourly_Rate__c,Sunday_Hourly_Rate__c,Public_holiday_Hourly_Rate__c,Afternoon_shift_Hourly_Rate__c,Night_shift_Hourly_Rate__c,Category_Type__c,Type_of_Job__c,Classification_Level__c,Classification_Pay_Point__c,Superannuation_Inc_or_Exc__c,Paid_Break__c,Sleepover_Allowance__c,
                Enable_Geolocation__c,Type_of_User__c,Fixed_Rate_or_Not__c,Address__CountryCode__s,Address__PostalCode__s,Voluntary_Contribution__c,Voluntary_Contribution_Fixed__c,Voluntary_Contribution_Percent__c,Attendance__c,Annual_Leave__c,Sick_Leave__c,Parental_Leave__c,Bereavement_Leave__c,State__c,Annual_leave_Accrued__c,Personal_Leave_Accur__c,Facility__r.Organisation__c,Facility__r.Organisation__r.Cash_out__c, Facility__r.Organisation__r.Negative_Balance__c,Facility__r.Organisation__r.Other_Leave_Type__c,Type_of_Employe__c,(SELECT Id, RoleName__c, Active__c,Facility__c FROM StaffRoles__r WHERE Active__c = true),(select id,Name,Type__c,Expiry_Date__c,View_File__c,Comments__c,Compliance__c,Points__c,Status__c,key__c,Document_Type__c from Child_Staffs__r),(SELECT Id, Annual_Used__c, Personal_Used__c,Status__c  FROM Leaves__r) FROM Staff__c where  Facility__r.Organisation__c  =: recordId  AND ID IN  (SELECT Staff__c FROM Staff_Facility__c WHERE Active__c = true AND Facility__c =:facilityId)  AND Status__c = true ]; // AND Facility__c =: FacilityId
   }
    @AuraEnabled
        public static void updateLeaveApprover(Id staffId, Id approverId) {
            if (staffId == null || approverId == null) {
                throw new AuraHandledException('Invalid data');
            }
        
            Staff__c staff = [
                SELECT Id, Manager__c
                FROM Staff__c
                WHERE Id = :staffId
                LIMIT 1
            ];
        
            staff.Manager__c = approverId;
            update staff;
        }
    @AuraEnabled(cacheable=false)
    public static list<Staff__c> getStaffById1(Id recordId) {
        return [SELECT id,Facility__r.Name,SelectedRole__c,Nationality__c,Languages__c,Primary_Contact_First_Name__c,Primary_Contact_Last_Name__c,Primary_Contact_Number__c,Secondary_Contact_First_Name__c,Secondary_Contact_Last_Name__c,Secondary_Contact_Number__c,NameToDisplay__c,Status__c,Organization_Name__c,Last_Name__c ,Name,Picture__c,Gender__c,Role__c,Display_Nickname__c,Nursning_Awards__c,Nursing_Category_Type__c,Nursing_Classification_Level__c,Nursing_Classification_Pay_Point__c,Child_Care_Awards__c,
                Facility__c,Age__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Pre_Tax_Calculator__c,Make_Primary_as_Approver__c,Make_Secondary_as_Approver__c,Pre_Tax_One_Description__c,Pre_Tax_One_Value__c,Pre_Tax_Two_Description__c,Pre_Tax_Two_Value__c,Pre_Tax_Three_Description__c,Pre_Tax_Three_Value__c,Pre_Tax_Four_Description__c,Pre_Tax_Four_Value__c,Pre_Tax_Five_Description__c,Pre_Tax_Five_Value__c,Post_Tax__c,Post_Tax_Decription__c,
                Working_Hours_Rate__c,Saturday_Hourly_Rate__c,Sunday_Hourly_Rate__c,Public_holiday_Hourly_Rate__c,Afternoon_shift_Hourly_Rate__c,Night_shift_Hourly_Rate__c,Category_Type__c,Type_of_Job__c,Classification_Level__c,Classification_Pay_Point__c,Superannuation_Inc_or_Exc__c,Paid_Break__c,Sleepover_Allowance__c,
                TFN_number__c,ABN_Number__c,Enable_Geolocation__c,Type_of_User__c,Fixed_Rate_or_Not__c,Address__CountryCode__s,Address__PostalCode__s,Voluntary_Contribution__c,Voluntary_Contribution_Fixed__c,Voluntary_Contribution_Percent__c,Attendance__c,Annual_Leave__c,Sick_Leave__c,Parental_Leave__c,Bereavement_Leave__c,State__c,(SELECT Id, RoleName__c, Active__c FROM StaffRoles__r WHERE Active__c = true),(select id,Name,Type__c,Expiry_Date__c,View_File__c,Comments__c,Compliance__c,Points__c,Status__c,key__c,Document_Type__c from Child_Staffs__r),(Select  Id,Facility__c,Facility__r.Name, Active__c,Staff__c from Staff_Facilities__r WHERE Active__c = true ) FROM Staff__c where  Id  =: recordId];
    } 
    @AuraEnabled(cacheable=true)
    public static list<Staff__c> getStaffByStatus(String recordId) {
        return [SELECT id,Facility__r.Name,Primary_Contact_First_Name__c,Primary_Contact_Last_Name__c,Primary_Contact_Number__c,Secondary_Contact_First_Name__c,Secondary_Contact_Last_Name__c,Secondary_Contact_Number__c,NameToDisplay__c,Status__c,Organization_Name__c,Last_Name__c ,Name,Picture__c,Gender__c,Role__c,
                Facility__c,Age__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Pre_Tax_Calculator__c,Make_Primary_as_Approver__c,Make_Secondary_as_Approver__c,Pre_Tax_One_Description__c,Pre_Tax_One_Value__c,Pre_Tax_Two_Description__c,Pre_Tax_Two_Value__c,Pre_Tax_Three_Description__c,Pre_Tax_Three_Value__c,Pre_Tax_Four_Description__c,Pre_Tax_Four_Value__c,Pre_Tax_Five_Description__c,Pre_Tax_Five_Value__c,Post_Tax__c,Post_Tax_Decription__c,
                Working_Hours_Rate__c,Saturday_Hourly_Rate__c,Sunday_Hourly_Rate__c,Public_holiday_Hourly_Rate__c,Afternoon_shift_Hourly_Rate__c,Night_shift_Hourly_Rate__c,Category_Type__c,Type_of_Job__c,Classification_Level__c,Classification_Pay_Point__c,Superannuation_Inc_or_Exc__c,Paid_Break__c,
                Type_of_User__c,Fixed_Rate_or_Not__c,Address__CountryCode__s,Address__PostalCode__s,Voluntary_Contribution__c,Voluntary_Contribution_Fixed__c,Voluntary_Contribution_Percent__c,Attendance__c,Annual_Leave__c,Sick_Leave__c,Parental_Leave__c,Bereavement_Leave__c,State__c,(select id,Name,Type__c,Expiry_Date__c,View_File__c,Comments__c,key__c,Document_Type__c from Child_Staffs__r) FROM Staff__c where  Id  =: recordId and  Status__c=true ];
    }
    @AuraEnabled(cacheable=true)
    public static list<Staff__c> getStaffByEmail(String email) {
        return [SELECT id,Facility__r.Name,Facility__r.Manager_Name__c,Primary_Contact_First_Name__c,Role__c,Primary_Contact_Last_Name__c,Primary_Contact_Number__c,Secondary_Contact_First_Name__c,Secondary_Contact_Last_Name__c,Secondary_Contact_Number__c,NameToDisplay__c,Status__c,Organization_Name__c,Last_Name__c ,Name,Picture__c,Gender__c,Email_Address__c,Accessible_Forms__c,Enable_Geolocation__c,Annual_leave_Accrued__c,Personal_Leave_Accur__c,
                Facility__c,Age__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Pre_Tax_Calculator__c,Make_Primary_as_Approver__c,Make_Secondary_as_Approver__c,Pre_Tax_One_Description__c,Pre_Tax_One_Value__c,Pre_Tax_Two_Description__c,Pre_Tax_Two_Value__c,Pre_Tax_Three_Description__c,Pre_Tax_Three_Value__c,Pre_Tax_Four_Description__c,Pre_Tax_Four_Value__c,Pre_Tax_Five_Description__c,Pre_Tax_Five_Value__c,Post_Tax__c,Post_Tax_Decription__c,
                Type_of_User__c,Address__CountryCode__s,Address__PostalCode__s,Voluntary_Contribution__c,Voluntary_Contribution_Fixed__c,Voluntary_Contribution_Percent__c,Annual_Leave__c,Sick_Leave__c,Parental_Leave__c,Bereavement_Leave__c,Fixed_Rate_or_Not__c,State__c,Facility__r.Organisation__c,Facility__r.Organisation__r.Cash_out__c, Facility__r.Organisation__r.Negative_Balance__c,Facility__r.Organisation__r.Other_Leave_Type__c,Type_of_Employe__c,Facility__r.Organisation__r.Mileage_Amount__c,Facility__r.Organisation__r.Cost_per_Km_Electric__c,(select id,Name,Type__c,Expiry_Date__c,View_File__c,Comments__c,key__c,Document_Type__c from Child_Staffs__r), (SELECT Id, RoleName__c, Active__c FROM StaffRoles__r),(SELECT Id, Annual_Used__c, Personal_Used__c FROM Leaves__r) FROM Staff__c where  Email_Address__c  =: email];
    }
    
    
    @AuraEnabled(cacheable=true)
    public static List<Staff__History> getStaffHistory(Id staffId) {
        List<Staff__History> rawHistory = [
            SELECT Id, Field, OldValue, NewValue, CreatedBy.Name, CreatedDate
            FROM Staff__History
            WHERE ParentId = :staffId
            ORDER BY CreatedDate DESC
        ];
        
        List<Staff__History> filteredHistory = new List<Staff__History>();
        
        // Regex to detect Salesforce ID (15 or 18 alphanumeric characters)
        Pattern idPattern = Pattern.compile('^[a-zA-Z0-9]{15,18} $');
        
        for (Staff__History h : rawHistory) {
            Boolean skip = false;
            
            if (h.OldValue != null) {
                Matcher mOld = idPattern.matcher(String.valueOf(h.OldValue));
                if (mOld.matches()) {
                    skip = true;
                }
            }
            
            if (h.NewValue != null) {
                Matcher mNew = idPattern.matcher(String.valueOf(h.NewValue));
                if (mNew.matches()) {
                    skip = true;
                }
            }
            
            if (!skip) {
                filteredHistory.add(h);
            }
        }
        
        return filteredHistory;
        
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
    public static List<Staff__c> StaffsRolesWiseList(string orgId, List<string> facIdlist, list<string> roles, String name) {
    // If roles list is empty, return empty list immediately
    if (roles == null || roles.isEmpty()) {
        return new List<Staff__c>();
    }
    
    // If facility list is empty, return empty list immediately
    if (facIdlist == null || facIdlist.isEmpty()) {
        return new List<Staff__c>();
    }
    
    List<Staff__c> staffList = new List<Staff__c>();
    String trucatedStr = orgId.substring(0, 15);
    
    // Build dynamic SOQL query with direct subquery for roles
    String query = 'SELECT id, Facility__c, Display_Nickname__c, Set_Hours__c, picture__c, Restrict_Set_Hours__c, ' +
        'Name, Last_Name__c, Role__c, Working_Hours_Rate__c, Saturday_Hourly_Rate__c, ' +
        'Sunday_Hourly_Rate__c, Public_holiday_Hourly_Rate__c, Afternoon_shift_Hourly_Rate__c, ' +
        'Night_shift_Hourly_Rate__c, Attendance__c, NameToDisplay__c, SCR__c, ' +
        'Classification_Level__c, Classification_Pay_Point__c, Class_and_Paypont__c, ' +
        'Sleepover_Allowance__c, Paid_Break__c, ' +
        '(SELECT Id, Type_of_Leave__c, From__c, To__c, Reason__c, Status__c, ' +
        'Leave_Document__c, Duration__c, Approved_by__c, Comments__c ' +
        'FROM Leaves__r WHERE Status__c = \'Approved\'), ' +
        '(SELECT Id, RoleName__c,Afternoon_Shift_Hourly_Rate__c,Hourly_Rate__c,Night_Shift_Hourly_Rate__c,Public_Holiday_Hourly_Rate__c,Saturday_Hourly_Rate__c,Sleepover_Allowance__c,Sunday_Hourly_Rate__c, Active__c,Type_of_Job__c,Category_Type__c FROM StaffRoles__r WHERE Active__c = true AND RoleName__c IN :roles) ' + // Add child StaffRole__c relationship
        'FROM Staff__c ' +
        'WHERE Organization_Name__c = :trucatedStr ' +
        'AND Facility__r.Status__c = true ' +
        'AND Status__c = true ' +
      //  'AND Facility__c IN :facIdlist ' +
       'AND ID IN (SELECT Staff__c FROM Staff_Facility__c WHERE Active__c = true AND Facility__c IN :facIdlist) '+
        'AND ID IN (SELECT StaffRole_To_Staff__c FROM StaffRole__c WHERE Active__c = true AND RoleName__c IN :roles AND Facility__c IN :facIdlist) ';
    
    if (name != null && name.trim() != '') {
        query += 'AND Display_Nickname__c LIKE \'%' + String.escapeSingleQuotes(name) + '%\' ';
    }
    
    query += 'ORDER BY Name'; // Add ordering for consistent results
    
    system.debug('query>>>>' + query);          
    staffList = Database.query(query);
    system.debug('list>>>>' + staffList.size() + ' records found');  
    
    return staffList;
}
    
    @AuraEnabled
    public static List<Shad_award__c> getShadAwards(string categoryType,string jobType,string classificationType,string classificationPayType ){
        return [select id,Afternoon_shift_Hourly_Rate__c,Category_Type__c,Classification_Level__c,Classification_Pay_Point__c,General_Hourly_pay_rate__c,Night_shift_Hourly_Rate__c,Sleepover_Allowance__c,Weekly_Pay_Rate__c,
                Public_holiday_Hourly_Rate__c,Saturday_Hourly_Rate__c,Name,Sunday_Hourly_Rate__c,Type_of_Employment__c from Shad_award__c where Category_Type__c =:categoryType and  Type_of_Employment__c =: jobType and Classification_Level__c =:classificationType and Classification_Pay_Point__c=:classificationPayType ];
    
    }
    @AuraEnabled
    public static List<Nursing_Award__c> getNursingAwrds(string categoryType,string jobType,string classificationType,string classificationPayType ){
        return [SELECT Id, Name, Afternoon_Shift_Hourly_Rate__c, Night_Shift_Hourly_Rate__c, General_Hourly_Pay_Rate__c, Category_Type__c, Public_Holiday_Hourly_Rate__c, Saturday_Hourly_Rate__c, Sunday_Hourly_Rate__c, Type_of_Employment__c, Classification_Level__c, Classification_Pay_Point__c FROM Nursing_Award__c where Category_Type__c =:categoryType and  Type_of_Employment__c =: jobType and Classification_Level__c =:classificationType and Classification_Pay_Point__c=:classificationPayType ];
    }
    @AuraEnabled
    public static List<Child_Care_Award__c> getChildcareAwrds(string categoryType,string jobType,string classificationType,string classificationPayType ){
        return [SELECT Id, Name, Afternoon_Shift_Hourly_Rate__c, Night_Shift_Hourly_Rate__c, General_Hourly_Pay_Rate__c, Category_Type__c, Public_Holiday_Hourly_Rate__c, Saturday_Hourly_Rate__c, Sunday_Hourly_Rate__c, Type_of_Employment__c, Classification_Level__c, Classification_Pay_Point__c FROM Child_Care_Award__c where Category_Type__c =:categoryType and  Type_of_Employment__c =: jobType and Classification_Level__c =:classificationType and Classification_Pay_Point__c=:classificationPayType ];
    }
    
    @AuraEnabled
    public static list<Child_Staff__c> insertPreTax(String JsonString, string staffID, boolean isPretax){
        list<Child_Staff__c> StaffPreTaxList = new list<Child_Staff__c>();
        
        try {
            // Debug the incoming JSON
            System.debug('📥 Raw JSON received: ' + JsonString);
            
            List<preTaxWrapper> preWrapperList = (List<preTaxWrapper>)System.JSON.deserialize(JsonString, List<preTaxWrapper>.class);
            System.debug('📦 Parsed wrapper list size: ' + preWrapperList.size());
            System.debug('📦 Parsed wrapper list: ' + JSON.serializePretty(preWrapperList));
            
            for(preTaxWrapper pretax : preWrapperList){
                Child_Staff__c cs = new Child_Staff__c();
                
                // ✅ Map all fields properly
                if(String.isNotBlank(pretax.staffExpirydate)) {
                    cs.Expiry_Date__c = Date.valueOf(pretax.staffExpirydate);
                }
                if(pretax.admin)
                {
                  cs.Status__c=pretax.status;
                }else{
                    cs.Status__c = 'Pending';
                }
                
                cs.Document_Type__c = pretax.typeOfDocument;
                //cs.Type__c = pretax.typeOfDocument;
                cs.File_Name__c = pretax.fileName;
                cs.Comments__c = pretax.comment; // ✅ This should now work
                cs.Points__c = pretax.points != null ? pretax.points : 0;
                cs.Compliance__c = pretax.compliance != null ? pretax.compliance : false;
                
                // ✅ Handle AWS JSON data
                if(pretax.awsjson != null){
                    cs.View_File__c = pretax.awsjson.url;
                    cs.Awsjson__c = JSON.serialize(pretax.awsjson);
                    cs.key__c = pretax.awsjson.key;
                }
                
                cs.Staff__c = staffID;
               // cs.Status__c = 'Pending'; // Default status
                
                System.debug('✅ Creating Child_Staff__c record: ' + JSON.serializePretty(cs));
                StaffPreTaxList.add(cs);
            } 
            
            if(!StaffPreTaxList.isEmpty()) {
                insert StaffPreTaxList;
                System.debug('✅ Successfully inserted ' + StaffPreTaxList.size() + ' records');
            }
            
        } catch(Exception e){
            System.debug('❌ Error in insertPreTax: ' + e.getMessage() + ' at line ' + e.getLineNumber());
            throw new AuraHandledException('Failed to save documents: ' + e.getMessage());
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
        public String url;
        public boolean compliance;
        public boolean admin;
        public String status;
        public integer points;
        public AwsJson awsjson; // ✅ nested object
        
        
    } 
    public class AwsJson {
        public String fileId;
        public String url;
        public String recordId;
        public String key;
        public String originalName;
        public String type;
        public String modulePath;
        public String size;
        public Long totalBytes;
    }
    
    @AuraEnabled(cacheable = true)
    public static List<Facility__c> fetchFacilitiess() { 
        List<Facility__c> lstFacility = new List<Facility__c>();
        Organisation__c orgNames;
        
        // Fetch the current logged-in user's details
        User objUser = [
            SELECT Phone, Id, Email, Organization_Name__c 
            FROM User 
            WHERE Id = :UserInfo.getUserId()
        ];
        
        // Fetch the organisation based on the user's organisation name
        orgNames = [
            SELECT Id, Name, ABN__c, ACN__c, NDIS_Provider__c, Contact_No__c, Email__c, Address__c 
            FROM Organisation__c 
            WHERE Name = :objUser.Organization_Name__c
        ];
        
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
        
        System.debug('lstFacility.size() >> ' + lstFacility.size());
        
        // Fetch staff record
        List<Staff__c> staffRecords = [
            SELECT Id, Email_Address__c, Facility__c 
            FROM Staff__c 
            WHERE Email_Address__c = :objUser.Email 
            LIMIT 1
        ];
        
        System.debug('staffRecords >> ' + staffRecords);
        
        // Only proceed if staff record exists and has a facility
        if (!staffRecords.isEmpty() && staffRecords[0].Facility__c != null) {
            Id userFacilityId = staffRecords[0].Facility__c;
            System.debug('User Facility Id >> ' + userFacilityId);
            
            for (Integer i = 0; i < lstFacility.size(); i++) {
                if (lstFacility[i].Id == userFacilityId) {
                    // Only remove once, no debug remove!
                    Facility__c userFacility = lstFacility[i];
                    
                    // Only reorder if it's not already at the front
                    if (i != 0) {
                        lstFacility.remove(i);
                        lstFacility.add(0, userFacility);
                        System.debug('Moved facility to top: ' + userFacility.Name);
                    } else {
                        System.debug('User facility is already at the top: ' + userFacility.Name);
                    }
                    break;
                }
            }
        }
        
        
        return lstFacility;
    }
    
   
    @AuraEnabled(cacheable=true)
    public static List<Shift_Type__c> getShiftTypeCssMap() {

        // -------------------------------------------------
        // 1️⃣ Get current logged-in user
        // -------------------------------------------------
        User objUser = [
            SELECT Id, Email, Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        // -------------------------------------------------
        // 2️⃣ Fetch Organisation
        // -------------------------------------------------
        Organisation__c org = [
            SELECT Id, Name, ABN__c, ACN__c, NDIS_Provider__c,
                Contact_No__c, Email__c, Address__c
            FROM Organisation__c
            WHERE Name = :objUser.Organization_Name__c
            LIMIT 1
        ];

        // -------------------------------------------------
        // 3️⃣ Fetch ALL active Facilities for Organisation
        // -------------------------------------------------
        List<Facility__c> lstFacility = [
            SELECT Id, Name, Email__c, AddressData__c,
                Phone__c, Status__c, Services__c, Organisation__c
            FROM Facility__c
            WHERE Organisation__c = :org.Id
            AND Status__c = true
            ORDER BY Name ASC
        ];

        // -------------------------------------------------
        // 4️⃣ Collect Facility IDs
        // -------------------------------------------------
        Set<Id> facilityIds = new Set<Id>();

        for (Facility__c fac : lstFacility) {
            facilityIds.add(fac.Id);
        }

        if (facilityIds.isEmpty()) {
            return new List<Shift_Type__c>();
        }

        // -------------------------------------------------
        // 5️⃣ Fetch ALL Shift Types for ALL Facilities
        // -------------------------------------------------
        List<Shift_Type__c> shiftTypes = [
            SELECT
                Id,
                Name,
                Start_Time__c,
                End_Time__c,
                Shift_Type__c,
                Colour__c,
                Type_of_Shift__c,
                Duration__c,
                Facility__c,
                Facility__r.Type_of_Service__c,
                (
                    SELECT
                        Id,
                        Name,
                        Custom_Shift_Type__c,
                        Start_Time__c,
                        Shift_Type__c,
                        End_Time__c
                    FROM Custom_Shift_Timings__r
                    ORDER BY Index__c ASC
                )
            FROM Shift_Type__c
            WHERE Facility__c IN :facilityIds
            ORDER BY Facility__c, Start_Time__c
        ];

        System.debug('✅ Total Shift Types Found => ' + shiftTypes.size());
        return shiftTypes;
    }

    
    
   @AuraEnabled
public static String getOverlappingShiftsData(
    String strtTimeText,
    String endTimeText,
    String StaffID,
    String startdate,
    String shiftType,
    Id ShiftwithStaffId
) {
    // -------------------------------
    // 1. Basic Validation
    // -------------------------------
    if (String.isBlank(strtTimeText) ||
        String.isBlank(endTimeText) ||
        String.isBlank(StaffID) ||
        String.isBlank(startdate) ||
        String.isBlank(shiftType)) {

        return 'INVALID_INPUT';
    }

    // -------------------------------
    // 2. Parse Time Values
    // -------------------------------
    Time startTime = AddShiftHandler.getTimeIn24HrFormat(strtTimeText);
    Time endTime   = AddShiftHandler.getTimeIn24HrFormat(endTimeText);

    Date sDate = Date.valueOf(startdate);
    Date eDate;

    // -------------------------------
    // 3. Determine End Date
    // -------------------------------
    if (shiftType == 'Night' ||
        shiftType == 'Sleepover Shift' ||
        shiftType == 'Custom') {

        if (endTime < startTime) {
            eDate = sDate.addDays(1);
        } else {
            eDate = sDate;
        }
    } else {
        eDate = sDate;
    }

    // -------------------------------
    // 4. Create DateTime Range
    // -------------------------------
    System.debug('sDate >> ' + sDate);
    System.debug('eDate >> ' + eDate);
    System.debug('startTime >> ' + startTime);
    System.debug('endTime >> ' + endTime);

    DateTime newShiftStart = DateTime.newInstance(sDate, startTime);
    DateTime newShiftEnd   = DateTime.newInstance(eDate, endTime);

    // -------------------------------
    // 5. CHECK UNAVAILABLE FIRST
    // -------------------------------
    List<Availability__c> unavailabilities = [
        SELECT Id, Start_Date__c, Start_Time__c, End_Time__c
        FROM Availability__c
        WHERE Staff__c = :StaffID
        AND Type__c = 'Unavailable'
        AND Start_Date__c >= :newShiftStart.date()
        AND Start_Date__c <= :newShiftEnd.date()
    ];

    for (Availability__c unavail : unavailabilities) {

        DateTime unavailStart = DateTime.newInstance(
            unavail.Start_Date__c,
            unavail.Start_Time__c
        );

        DateTime unavailEnd = DateTime.newInstance(
            unavail.Start_Date__c,
            unavail.End_Time__c
        );

        // ✅ EXCLUSIVE boundary check
        if (unavailStart < newShiftEnd &&
            unavailEnd > newShiftStart) {

            System.debug('UNAVAILABLE CONFLICT FOUND');
            return 'UNAVAILABLE_CONFLICT';
        }
    }

    // -------------------------------
    // 6. CHECK EXISTING SHIFTS
    // -------------------------------
    String shiftQuery =
        'SELECT Id, Date__c, Start_Time__c, Start_Date__c, End_Date__c, ' +
        'End_Time__c, Shift_Start_Time__c, Shift_End_Time__c ' +
        'FROM ShiftwithStaff__c ' +
        'WHERE Attendence__c = true ' +
        'AND Staff__c = :StaffID ' +
        'AND Start_Date__c <= :sDate ' +
        'AND End_Date__c >= :eDate';

    if (ShiftwithStaffId != null) {
        shiftQuery += ' AND Id != :ShiftwithStaffId';
    }

    List<ShiftwithStaff__c> existingShifts =
        Database.query(shiftQuery);

    for (ShiftwithStaff__c shift : existingShifts) {

        System.debug('--- Checking Existing Shift ---');
        System.debug('Shift Id: ' + shift.Id);
        System.debug('Shift Start Date: ' + shift.Start_Date__c);
        System.debug('Shift Start Time: ' + shift.Shift_Start_Time__c);
        System.debug('Shift End Date: ' + shift.End_Date__c);
        System.debug('Shift End Time: ' + shift.Shift_End_Time__c);

        DateTime shiftStart = DateTime.newInstance(
            shift.Start_Date__c,
            shift.Shift_Start_Time__c
        );

        Date shiftEndDate =
            (shift.End_Date__c != null)
            ? shift.End_Date__c
            : shift.Date__c;

        DateTime shiftEnd = DateTime.newInstance(
            shiftEndDate,
            shift.Shift_End_Time__c
        );

        System.debug('Computed Shift Start DateTime: ' + shiftStart);
        System.debug('Computed Shift End DateTime: ' + shiftEnd);
        System.debug('New Shift Start DateTime: ' + newShiftStart);
        System.debug('New Shift End DateTime: ' + newShiftEnd);

        // ✅ EXCLUSIVE boundary check (FIX)
        if (shiftStart < newShiftEnd &&
            shiftEnd > newShiftStart) {

            System.debug('SHIFT CONFLICT FOUND for Shift Id: ' + shift.Id);
            return 'SHIFT_CONFLICT';
        }

        System.debug('No overlap for Shift Id: ' + shift.Id);
    }

    // -------------------------------
    // 7. NO CONFLICT
    // -------------------------------
    return 'NO_CONFLICT';
}

    
    
    @AuraEnabled(cacheable=true)
    public static  List<Company__c> getCompanyBasedOnFacility (String selectedfacility ) {
        String currentUserId = UserInfo.getUserId();
        User currentUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :currentUserId LIMIT 1];
        System.debug('Current User ID: ' + currentUserId);
        //System.debug('Current User Name: ' + currentUser.Name);
        System.debug('Current User Organization: ' + currentUser.Organization_Name__c);
        Facility__c  facility = [SELECT Id,Name  FROM Facility__c  WHERE Id=:selectedfacility  LIMIT 1];
        
        List<Company__c> company  = [SELECT Id,Company_Name__c, Organization__c,Organization__r.Name, ABN__c, Phone_Number__c, Email__c, Fax_Number__c, Tax__c, Address__c  FROM Company__c  WHERE Company_Name__c=:facility.Name AND Organization__r.Name = :currentUser.Organization_Name__c  LIMIT 1];
        System.debug('Company query returned: ' + company.size() + ' record(s)');
        if (!company.isEmpty()) {
            System.debug('Company ID: ' + company[0].Id);
            System.debug('Company Name: ' + company[0].Company_Name__c);
            System.debug('Company Organization__c: ' + company[0].Organization__c);
        } else {
            System.debug('No matching company found.');
        }
        return company;
    }
 @AuraEnabled(cacheable=true)
    public static List<Facility_Role__c> getRoleOptions(Id staffId) {
        System.debug('🚀 [getRoleOptions] START');
        System.debug('📥 Input staffId: ' + staffId);
        set<Id> facilityIdList=new set<Id>();
       
        list<Staff_Facility__c> staffFacilities=[select Id,Facility__c,Staff__c from Staff_Facility__c where Staff__c=:staffId];
        for(Staff_Facility__c staffFacility:staffFacilities){
            facilityIdList.add(staffFacility.Facility__c);

        }
        
        List<Facility_Role__c> optionList = new List<Facility_Role__c>();
        
        // Fetch Facility Roles related to this Facility
       optionList = [
            SELECT Id, Role_Name__c ,Is_Active__c,Facility__r.Name,Facility__c,Facility__r.Type_of_Service__c
            FROM Facility_Role__c 
            WHERE Facility__c IN:facilityIdList AND Is_Active__c = true
        ];  
        
        System.debug('🎯 Final optionList: ' + optionList);
        System.debug('🏁 [getRoleOptions] END');
        return optionList;
    }
    
    @AuraEnabled
    public static  List<Facility_Role__c> getRoleOptionsByFacility(List<String> facilityIdList) {
        System.debug('📥 facilityId received: ' + facilityIdList);

        List<Facility_Role__c>  optionList = new   List<Facility_Role__c> ();

        // Fetch Facility Roles related to this Facility
        List<Facility_Role__c> facilityRoles = [
            SELECT Id, Role_Name__c,Is_Active__c, Facility__r.Name,Facility__r.Type_of_Service__c
            FROM Facility_Role__c 
            WHERE Facility__c IN :facilityIdList AND Is_Active__c = true
        ];
        System.debug('📦 Facility Roles count: ' + facilityRoles.size());

       /*  for (Facility_Role__c role : facilityRoles) {
            System.debug('➡️ Adding Role: ' + role.Role_Name__c);
            optionList.add(role.Role_Name__c);
        } */

        System.debug('🎯 Final optionList: ' + optionList);
        return facilityRoles;
    } 

    @AuraEnabled
    public static void updateDocumentStatus(Id documentId, String status, String comments, Boolean isEditOperation) {
        if (documentId == null) {
            throw new AuraHandledException('Document ID is required');
        }

        try {
            Child_Staff__c doc = [
                SELECT Id, Status__c, Rejected_Comments__c 
                FROM Child_Staff__c 
                WHERE Id = :documentId 
                LIMIT 1
            ];

            // 🆕 If this is an edit operation, force status to 'Pending'
            if (isEditOperation == true) {
                doc.Status__c = 'Pending';
                doc.Rejected_Comments__c = null; // Clear previous rejection comments
            } else {
                doc.Status__c = status;
                
                // Only store comments when rejecting
                if (status == 'Rejected') {
                    doc.Rejected_Comments__c = comments;
                } else {
                    doc.Rejected_Comments__c = null;
                }
            }

            update doc;
            
        } catch (Exception e) {
            throw new AuraHandledException('Failed to update document status: ' + e.getMessage());
        }
    }
    
   /* @AuraEnabled
    public static List<Staff__c> fetchStaffDocuments() {
        User objUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
       Organisation__c orgRecord = [ SELECT Id  FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1];
        System.debug('➡️ orgRecord: ' + orgRecord.Id);
        

    return [
        SELECT Id,
               Name,NameToDisplay__c,Organization_Name__c,Facility__r.Name,Facility__r.Id,Status__c,
               (SELECT Id, RoleName__c, Active__c FROM StaffRoles__r WHERE Active__c = TRUE),
               (SELECT Id, Name, Type__c, Expiry_Date__c, View_File__c, Comments__c,Compliance__c,Points__c,key__c,Status__c,Document_Type__c FROM Child_Staffs__r)
        FROM Staff__c  where facility__r.Organisation__c =: orgRecord.Id AND Status__c=TRUE
        ORDER BY CreatedDate ASC
    ];
}*/
    
    @AuraEnabled
    public static List<Staff__c> fetchStaffDocuments() {
    
        // 1. Get logged-in user data
        User currentUser = [
            SELECT Id, Email, UserRole.Name, Organization_Name__c 
            FROM User 
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];
    
        // Identify Org Admin role
        Boolean isOrgAdmin = (currentUser.UserRole.Name == 'CEO' ||  currentUser.UserRole.Name == 'Portal Account Partner Executive');
         System.debug('isOrgAdmin'+isOrgAdmin);
    
        // 2. Get Staff__c record based on User email
        Staff__c loggedInStaff = [
            SELECT Id, Email_Address__c 
            FROM Staff__c 
            WHERE Email_Address__c = :currentUser.Email
            LIMIT 1
        ];
    
        // 3. Get organization record
        Organisation__c orgRecord = [
            SELECT Id 
            FROM Organisation__c 
            WHERE Name = :currentUser.Organization_Name__c 
            LIMIT 1
        ];
    
        // ==================================================================
        // CASE 1 — ORG ADMIN: Return all staff (no restrictions)
        // ==================================================================
        if (isOrgAdmin) {
            List<Staff__c> orgStaff= [
                SELECT Id, Name, NameToDisplay__c, Organization_Name__c,
                       Facility__r.Name, Facility__r.Id, Status__c,
                       (SELECT Id, RoleName__c, Active__c FROM StaffRoles__r WHERE Active__c = TRUE),
                       (SELECT Id, Name, Type__c, Expiry_Date__c, View_File__c, Comments__c,
                               Compliance__c, Points__c, Key__c, Status__c, Document_Type__c
                        FROM Child_Staffs__r)
                FROM Staff__c
                WHERE Facility__r.Organisation__c = :orgRecord.Id
                  AND Status__c = TRUE
                ORDER BY CreatedDate ASC
            ];
            return orgStaff;
        } else{
    
       List<Id> sharedDocIds = new List<Id>();

    for (StaffDocsShare__c s : [
        SELECT Child_Staff__c
        FROM StaffDocsShare__c
        WHERE Staff__c = :loggedInStaff.Id
    ]) {
        sharedDocIds.add(s.Child_Staff__c);
    }

    // Step B: Always include own documents
  //  sharedDocIds.add(loggedInStaff.Id);  // We will match Staff__c = loggedInStaff.Id in SOQL

    // Step C: Query Staff + merged docs through IN clause
    List<Staff__c> staffList = [
        SELECT Id, Name, NameToDisplay__c, Organization_Name__c,
               Facility__r.Name, Facility__r.Id, Status__c,

               (SELECT Id, RoleName__c, Active__c 
                FROM StaffRoles__r WHERE Active__c = TRUE),

               (SELECT Id, Name, Type__c, Expiry_Date__c, View_File__c,
                       Comments__c, Compliance__c, Points__c, Key__c, Status__c, Document_Type__c
                FROM Child_Staffs__r
               )

        FROM Staff__c
        WHERE Id = :loggedInStaff.Id
        LIMIT 1
    ];

    return staffList;
      }
    }
    
    
    @AuraEnabled
    public static List<Child_Staff__c> fetchSharedDocuments() {
    
     User currentUser = [SELECT Id, Email, UserRole.Name, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1]; 
     Staff__c loggedInStaff = [SELECT Id, Email_Address__c FROM Staff__c WHERE Email_Address__c = :currentUser.Email LIMIT 1];
        
    
        List<Child_Staff__c> sharedDocs = [
            SELECT Id, Name, Type__c, Expiry_Date__c, View_File__c,
                           Comments__c, Compliance__c, Points__c, Key__c, Status__c, Document_Type__c
            FROM Child_Staff__c
            WHERE Id IN (
                SELECT Child_Staff__c
                FROM StaffDocsShare__c
                WHERE Staff__c = :loggedInStaff.Id
            )
           
        ];
    
        return sharedDocs;
    }
    
     @AuraEnabled
    public static List<StaffDocsShare__c> fetchstaffBydoc(String docId) {
    
        List<StaffDocsShare__c> staffids = [ SELECT Staff__c FROM StaffDocsShare__c WHERE Child_Staff__c = :docId];
    
        return staffids;
    }
    
    

    
    

    @AuraEnabled
    public static void saveStaffDocShares(String docId, List<String> staffIds) {
    
        List<StaffDocsShare__c> shares = new List<StaffDocsShare__c>();
    
        for (Id staffId : staffIds) {
            shares.add(new StaffDocsShare__c(
                Child_Staff__c = docId,
                Staff__c = staffId
            ));
        }
    
        insert shares;
    }

    
    @AuraEnabled
    public static List<Client__c> fetchParticipantDocs(){
        
        User objUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
        Organisation__c orgRecord = [ SELECT Id  FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1];
        System.debug('➡️ orgRecord: ' + orgRecord.Id);
        return [SELECT Facility__c, Id, Organization_Name__c, Display_Nickname__c,Status__c,
        (SELECT Name,Type__c, Size__c,comments__c,USer_Name__c,Amazon_file_URL__c,Date__c,Date_Format__c from Attachments__r) FROM Client__c where facility__r.Organisation__c =: orgRecord.Id AND Status__c=true 
        ORDER BY CreatedDate ASC];
    }

public class TimelineItem {
    @AuraEnabled public Datetime activityDate;
    @AuraEnabled public String userName;
    @AuraEnabled public String title;
    @AuraEnabled public String description;

    public TimelineItem() {} // ✅ Required empty constructor for Aura serialization

    public TimelineItem(
        Datetime activityDate,
        String userName,
        String title,
        String description
    ) {
        this.activityDate = activityDate;
        this.userName = userName;
        this.title = title;
        this.description = description;
    }
}

@AuraEnabled
public static List<TimelineItem> getStaffDocumentHistory(Id documentId) {
    List<TimelineItem> timeline = new List<TimelineItem>();

    // 1️⃣ Document created / updated
    Child_Staff__c doc = [
        SELECT CreatedDate, CreatedBy.Name, LastModifiedDate, LastModifiedBy.Name
        FROM Child_Staff__c
        WHERE Id = :documentId
        LIMIT 1
    ];

    timeline.add(new TimelineItem(
        doc.CreatedDate,
        doc.CreatedBy.Name,
        'Document Created',
        'Document uploaded'
    ));

    if (doc.LastModifiedDate != doc.CreatedDate) {
        timeline.add(new TimelineItem(
            doc.LastModifiedDate,
            doc.LastModifiedBy.Name,
            'Document Updated',
            'Document details were updated'
        ));
    }

    // 2️⃣ Sharing history
    for (StaffDocsShare__c s : [
        SELECT LastModifiedDate, LastModifiedBy.Name, Staff__r.Name
        FROM StaffDocsShare__c
        WHERE Child_Staff__c = :documentId
    ]) {
        timeline.add(new TimelineItem(
            s.LastModifiedDate,
            s.LastModifiedBy.Name,
            'Document Shared',
            'Shared with ' + s.Staff__r.Name
        ));
    }

    // 3️⃣ File viewed history ✅ NEW
    for (Staff_Document_View__c v : [
        SELECT CreatedDate, Viewed_By__r.Name
        FROM Staff_Document_View__c
        WHERE Child_Staff__c = :documentId
    ]) {
        timeline.add(new TimelineItem(
            v.CreatedDate,
            v.Viewed_By__r.Name,
            'File Viewed',
            'Document file was opened'
        ));
    }
    // 4️⃣ Sort newest first
    timeline.sort(new TimelineDateDescSorter());
    return timeline;
}

public class TimelineDateDescSorter implements System.Comparator<TimelineItem> {
    public Integer compare(TimelineItem a, TimelineItem b) {
        if (a.activityDate == b.activityDate) {
            return 0;
        }
        if (a.activityDate > b.activityDate) {
            return -1; // DESC
        }
        return 1;
    }
}

@AuraEnabled
public static void logDocumentView(Id documentId) {
    if (documentId == null) return;

    insert new Staff_Document_View__c(
        Child_Staff__c = documentId,
        Viewed_By__c   = UserInfo.getUserId()
        // CreatedDate is auto-used as timestamp
    );
}

@AuraEnabled
public static void generateOtp(Id recordId, String fieldType) {

    if (recordId == null || String.isBlank(fieldType)) {
        throw new AuraHandledException('Invalid request');
    }

    // Generate 4-digit OTP (always positive)
    Integer randomInt = Math.abs(Crypto.getRandomInteger());
    String otp = String.valueOf(Math.mod(randomInt, 10000)).leftPad(4, '0');

    // Get current user
    User usr = [
        SELECT Id,Organization_Name__c
        FROM User
        WHERE Id = :UserInfo.getUserId()
        LIMIT 1
    ];

    // Store OTP details
    usr.OTP_Code__c = otp;
    usr.OTP_Field_Type__c = fieldType;
    usr.OTP_Record_Id__c = recordId;
    update usr;

    // Send Email
    Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
    mail.setToAddresses(new String[] {UserInfo.getUserEmail()});
    // mail.setToAddresses(new String[] {'saieswar.k@tesseractapps.com'});
    mail.setSenderDisplayName(usr.Organization_Name__c);
    mail.setSubject('Your Secure OTP for Access Verification');
    mail.setPlainTextBody(
    'Hello,\n\n' +
    'You have requested to access a secure field in the system.\n\n' +

    'Your One-Time Password (OTP): ' + otp + '\n\n' +

    'Regards,\n' +
    usr.Organization_Name__c
    );
        Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
    }

@AuraEnabled
public static String verifyOtp(Id recordId, String fieldType, String enteredOtp) {

    // Basic validation
    if (recordId == null) {
        throw new AuraHandledException('Invalid record');
    }

    if (String.isBlank(fieldType)) {
        throw new AuraHandledException('Invalid field type');
    }

    if (String.isBlank(enteredOtp)) {
        throw new AuraHandledException('Please enter OTP');
    }

    // Fetch current user OTP data
    User usr = [
        SELECT OTP_Code__c, OTP_Field_Type__c, OTP_Record_Id__c
        FROM User
        WHERE Id = :UserInfo.getUserId()
        LIMIT 1
    ];

    // Validate OTP exists
    if (String.isBlank(usr.OTP_Code__c)) {
        throw new AuraHandledException('No OTP found');
    }

    // Validate OTP value
    if (usr.OTP_Code__c.trim() != enteredOtp.trim()) {
        throw new AuraHandledException('Invalid OTP');
    }

    // Validate context (VERY IMPORTANT)
    if (usr.OTP_Field_Type__c != fieldType || usr.OTP_Record_Id__c != recordId) {
        throw new AuraHandledException('OTP mismatch');
    }

    // Clear OTP after successful verification
    usr.OTP_Code__c = null;
    usr.OTP_Field_Type__c = null;
    usr.OTP_Record_Id__c = null;
    update usr;

    // Fetch Staff safely
    List<Staff__c> staffList = [
        SELECT TFN_number__c, ABN_Number__c
        FROM Staff__c
        WHERE Id = :recordId
        LIMIT 1
    ];

    if (staffList.isEmpty()) {
        throw new AuraHandledException('Staff record not found');
    }

    Staff__c staff = staffList[0];

    // Return based on field type
    if (fieldType == 'TFN') {
        return staff.TFN_number__c;
    } else if (fieldType == 'ABN') {
        return staff.ABN_Number__c;
    } else {
        throw new AuraHandledException('Invalid field type');
    }
}

}