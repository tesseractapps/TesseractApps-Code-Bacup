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
        
        String query='SELECT id,Facility__r.Name,Facility__r.Id,NameToDisplay__c,Display_Nickname__c,Facility_Name__c,CreatedBy.Name,Type_of_User__c,Staff_Status__c,Status__c,Organization_Name__c,Last_Name__c ,Name,picture__c,Facility__c,Contact_Number__c,Amazon_URL__c,address__Street__s,address__City__s,address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s,AddressData__c,Pre_Tax_Calculator__c,Pre_Tax_One_Description__c,Pre_Tax_One_Value__c,Pre_Tax_Two_Description__c,Pre_Tax_Two_Value__c,Pre_Tax_Three_Description__c,Pre_Tax_Three_Value__c,Pre_Tax_Four_Description__c,Pre_Tax_Four_Value__c,Pre_Tax_Five_Description__c,Pre_Tax_Five_Value__c,Post_Tax__c,Post_Tax_Decription__c,Make_Primary_as_Approver__c,Make_Secondary_as_Approver__c,Voluntary_Contribution__c,Voluntary_Contribution_Fixed__c,Annual_Leave__c,Sick_Leave__c,Parental_Leave__c,Bereavement_Leave__c,Voluntary_Contribution_Percent__c,Email_Address__c,Set_Hours__c,Role__c,(select id,Name,Type__c,Expiry_Date__c,View_File__c,Comments__c  from Child_Staffs__r) FROM Staff__c ';
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
        return [SELECT id,Facility__r.Name,Primary_Contact_First_Name__c,Primary_Contact_Last_Name__c,Primary_Contact_Number__c,Secondary_Contact_First_Name__c,Secondary_Contact_Last_Name__c,Secondary_Contact_Number__c,NameToDisplay__c,Status__c,Organization_Name__c,Last_Name__c ,Name,Picture__c,Gender__c,Role__c,Display_Nickname__c,
                Facility__c,Age__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Pre_Tax_Calculator__c,Make_Primary_as_Approver__c,Make_Secondary_as_Approver__c,Pre_Tax_One_Description__c,Pre_Tax_One_Value__c,Pre_Tax_Two_Description__c,Pre_Tax_Two_Value__c,Pre_Tax_Three_Description__c,Pre_Tax_Three_Value__c,Pre_Tax_Four_Description__c,Pre_Tax_Four_Value__c,Pre_Tax_Five_Description__c,Pre_Tax_Five_Value__c,Post_Tax__c,Post_Tax_Decription__c,
                Working_Hours_Rate__c,Saturday_Hourly_Rate__c,Sunday_Hourly_Rate__c,Public_holiday_Hourly_Rate__c,Afternoon_shift_Hourly_Rate__c,Night_shift_Hourly_Rate__c,Category_Type__c,Type_of_Job__c,Classification_Level__c,Classification_Pay_Point__c,Superannuation_Inc_or_Exc__c,Paid_Break__c,Sleepover_Allowance__c,
                Enable_Geolocation__c,Type_of_User__c,Fixed_Rate_or_Not__c,Address__CountryCode__s,Address__PostalCode__s,Voluntary_Contribution__c,Voluntary_Contribution_Fixed__c,Voluntary_Contribution_Percent__c,Attendance__c,Annual_Leave__c,Sick_Leave__c,Parental_Leave__c,Bereavement_Leave__c,State__c,(select id,Name,Type__c,Expiry_Date__c,View_File__c,Comments__c from Child_Staffs__r) FROM Staff__c where  Id  =: recordId];
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
        return [SELECT id,Facility__r.Name,Facility__r.Manager_Name__c,Primary_Contact_First_Name__c,Role__c,Primary_Contact_Last_Name__c,Primary_Contact_Number__c,Secondary_Contact_First_Name__c,Secondary_Contact_Last_Name__c,Secondary_Contact_Number__c,NameToDisplay__c,Status__c,Organization_Name__c,Last_Name__c ,Name,Picture__c,Gender__c,Email_Address__c,Accessible_Forms__c,Enable_Geolocation__c,
                Facility__c,Age__c,Contact_Number__c,address__Street__s,address__City__s,address__StateCode__s,Pre_Tax_Calculator__c,Make_Primary_as_Approver__c,Make_Secondary_as_Approver__c,Pre_Tax_One_Description__c,Pre_Tax_One_Value__c,Pre_Tax_Two_Description__c,Pre_Tax_Two_Value__c,Pre_Tax_Three_Description__c,Pre_Tax_Three_Value__c,Pre_Tax_Four_Description__c,Pre_Tax_Four_Value__c,Pre_Tax_Five_Description__c,Pre_Tax_Five_Value__c,Post_Tax__c,Post_Tax_Decription__c,
                Address__CountryCode__s,Address__PostalCode__s,Voluntary_Contribution__c,Voluntary_Contribution_Fixed__c,Voluntary_Contribution_Percent__c,Annual_Leave__c,Sick_Leave__c,Parental_Leave__c,Bereavement_Leave__c,Fixed_Rate_or_Not__c,(select id,Name,Type__c,Expiry_Date__c,View_File__c,Comments__c from Child_Staffs__r) FROM Staff__c where  Email_Address__c  =: email];
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
        Pattern idPattern = Pattern.compile('^[a-zA-Z0-9]{15,18}$');
        
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
    public static List<Staff__c> StaffsRolesWiseList(string orgId,List<string> facIdlist,list<string> roles,String name){
        list<Staff__c> staffList= new list<Staff__c>();
        String trucatedStr = orgId.substring(0,15);
        system.debug('faclist list '+facIdlist);
        system.debug(' Roles list '+roles);
        String query = 'SELECT id,Facility__c,Display_Nickname__c, Set_Hours__c, picture__c, Name, Last_Name__c, Role__c, Working_Hours_Rate__c, Saturday_Hourly_Rate__c, Sunday_Hourly_Rate__c, Public_holiday_Hourly_Rate__c, Afternoon_shift_Hourly_Rate__c, Night_shift_Hourly_Rate__c, Attendance__c, NameToDisplay__c,SCR__c,Classification_Level__c,Classification_Pay_Point__c,Class_and_Paypont__c ,Sleepover_Allowance__c, (SELECT Id, Type_of_Leave__c, From__c, To__c, Reason__c, Status__c, Leave_Document__c, Duration__c, Approved_by__c, Comments__c FROM Leaves__r WHERE Status__c = \'Approved\') FROM Staff__c WHERE Organization_Name__c = :trucatedStr AND Facility__r.Status__c = true and Status__c=true';
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
            query += ' AND Display_Nickname__c LIKE \'%' + name + '%\'';
        }
        
        system.debug('query>>>>'+query);          
        staffList=Database.query(query);
        system.debug('list>>>>'+staffList);  
        return staffList;
        
    }
    
    @AuraEnabled
    public static List<Shad_award__c> getShadAwards(string categoryType,string jobType,string classificationType,string classificationPayType ){
        return [select id,Afternoon_shift_Hourly_Rate__c,Category_Type__c,Classification_Level__c,Classification_Pay_Point__c,General_Hourly_pay_rate__c,Night_shift_Hourly_Rate__c,Sleepover_Allowance__c,
                Public_holiday_Hourly_Rate__c,Saturday_Hourly_Rate__c,Name,Sunday_Hourly_Rate__c,Type_of_Employment__c from Shad_award__c where Category_Type__c =:categoryType and  Type_of_Employment__c =: jobType and Classification_Level__c =:classificationType and Classification_Pay_Point__c=:classificationPayType ];
    }
    
    @AuraEnabled
    public static list<Child_Staff__c> insertPreTax(String JsonString,string staffID,boolean isPretax){
        list<Child_Staff__c> StaffPreTaxList= new list<Child_Staff__c> ();
        List<preTaxWrapper> preWrapperList = (List<preTaxWrapper>)System.JSON.deserialize(JsonString,List<preTaxWrapper>.class);
        system.debug('Pre tax wrapper'+preWrapperList);
        try{
            for(preTaxWrapper pretax:preWrapperList){
                Child_Staff__c cs = new Child_Staff__c ();
                if(String.isNotBlank(pretax.staffExpirydate)) {
                    cs.Expiry_Date__c=Date.valueOf(pretax.staffExpirydate);
                }
                
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
    public static Map<String, String> getShiftTypeCssMap() {
        Map<String, String> shiftMap = new Map<String, String>();
        
        // Step 1: Get current user
        User currentUser = [
            SELECT Id, Organization_Name__c, User_Type__c, Email
            FROM User 
            WHERE Id = :UserInfo.getUserId() 
            LIMIT 1
        ];
        
        if (currentUser.User_Type__c == 'NDIS Org Admin' && currentUser.Organization_Name__c != null) {
            // Step 2: Fetch from Organisation for NDIS Org Admin
            Organisation__c org = [
                SELECT Generalshiftcolor__c, Morningshiftcolor__c, Afternoonshiftcolor__c, 
                Nightshiftcolor__c, Customshiftcolor__c, Sleepover_Shift_Color__c
                FROM Organisation__c 
                WHERE Name = :currentUser.Organization_Name__c 
                LIMIT 1
            ];
            
            if (org != null) {
                shiftMap.put('general', org.Generalshiftcolor__c);
                shiftMap.put('morning', org.Morningshiftcolor__c);
                shiftMap.put('afternoon', org.Afternoonshiftcolor__c);
                shiftMap.put('night', org.Nightshiftcolor__c);
                shiftMap.put('custom', org.Customshiftcolor__c);
                shiftMap.put('sleepover shift', org.Sleepover_Shift_Color__c);
            }
        } else {
            // Step 3: Get related Staff and Facility
            Staff__c staff = [
                SELECT Id, Facility__c, Email_Address__c 
                FROM Staff__c 
                WHERE Email_Address__c = :currentUser.Email 
                LIMIT 1
            ];
            
            Facility__c fac = [
                SELECT Afternoon_Shift_Color__c, Custom_Shift_Color__c, General_Shift_Color__c, 
                Morning_Shift_Color__c, Night_Shift_Color__c, Sleepover_Shift_Color__c,
                Organisation__r.Generalshiftcolor__c, Organisation__r.Morningshiftcolor__c, 
                Organisation__r.Afternoonshiftcolor__c, Organisation__r.Nightshiftcolor__c, 
                Organisation__r.Customshiftcolor__c, Organisation__r.Sleepover_Shift_Color__c
                FROM Facility__c 
                WHERE Id = :staff.Facility__c
                LIMIT 1
            ];
            
            // Step 4: Assign with fallback to Organisation
            shiftMap.put('general', 
                         fac.General_Shift_Color__c != null ? fac.General_Shift_Color__c : fac.Organisation__r.Generalshiftcolor__c);
            shiftMap.put('morning', 
                         fac.Morning_Shift_Color__c != null ? fac.Morning_Shift_Color__c : fac.Organisation__r.Morningshiftcolor__c);
            shiftMap.put('afternoon', 
                         fac.Afternoon_Shift_Color__c != null ? fac.Afternoon_Shift_Color__c : fac.Organisation__r.Afternoonshiftcolor__c);
            shiftMap.put('night', 
                         fac.Night_Shift_Color__c != null ? fac.Night_Shift_Color__c : fac.Organisation__r.Nightshiftcolor__c);
            shiftMap.put('custom', 
                         fac.Custom_Shift_Color__c != null ? fac.Custom_Shift_Color__c : fac.Organisation__r.Customshiftcolor__c);
            shiftMap.put('sleepover shift', 
                         fac.Sleepover_Shift_Color__c != null ? fac.Sleepover_Shift_Color__c : fac.Organisation__r.Sleepover_Shift_Color__c);
        }
        
        System.debug('shiftMap >> ' + shiftMap);
        return shiftMap;
    }
    
    
    
    
    @AuraEnabled
    public static boolean getOverlappingShiftsData(String strtTimeText, String endTimeText, String StaffID, String startdate, String shiftType, Id ShiftwithStaffId) {
        DateTime startDateTime;
        DateTime endDateTime;
        Date enddate;
        boolean errorMessage = false;
        system.debug('ShiftwithStaffId >>'+ShiftwithStaffId);
        
        // Check if input time values are provided
        if (strtTimeText == null || endTimeText == null || StaffID == null || startdate == null || shiftType == null) {
            System.debug('One or more input values are null.');
            return false; // Early exit if any required value is missing
        }
        
        // Calculate Start and End Time
        Time startTime = AddShiftHandler.getTimeIn24HrFormat(strtTimeText);
        Time endTime = AddShiftHandler.getTimeIn24HrFormat(endTimeText);
        
        // Determine End Date based on Shift Type
        if (shiftType == 'Night' || shiftType == 'Sleepover Shift' || shiftType =='Custom') {
            List<String> timeSplit = endTimeText.split(' ');
            List<String> startTimeSplits = strtTimeText.split(' ');
            
            if (timeSplit[1] == 'am' && startTimeSplits[1] != 'am') {
                enddate = Date.valueOf(startdate).addDays(1);
            } else {
                enddate = Date.valueOf(startdate);
            }
        } else {
            enddate = Date.valueOf(startdate);
        }
        
        // Create DateTime for Start and End Shifts
        startDateTime = DateTime.newInstance(Date.valueOf(startdate), startTime);
        Date endShiftDate = (enddate != null) ? enddate : Date.valueOf(startdate);
        endDateTime = DateTime.newInstance(endShiftDate, endTime);
        
        
        Date startDateforQuery = startDateTime.date();
        Date endDateforQuery = endDateTime.date();
        List<Id> staffIdList = new List<Id>{StaffID};
            system.debug('startDateforQuery '+startDateforQuery);
        system.debug('endDateforQuery '+endDateforQuery);
        system.debug('staffIdList '+staffIdList);
        system.debug('ShiftwithStaffId '+ShiftwithStaffId);
        
        
        String baseQuery = 'SELECT Id, Staff__c, Date__c, Start_Time__c, End_Date__c, End_Time__c ' +
            'FROM ShiftwithStaff__c WHERE Attendence__c = true ' +
            'AND (Date__c <= :endDateforQuery AND End_Date__c >= :startDateforQuery) ' +
            'AND Staff__c IN :staffIdList';
        
        if (ShiftwithStaffId != null) {
            baseQuery += ' AND Id != :ShiftwithStaffId';
        }
        
        List<ShiftwithStaff__c> potentialShifts = Database.query(baseQuery);
        system.debug('baseQuery >>'+baseQuery);
        system.debug('potentialShifts >>'+potentialShifts.size());
        
        List<ShiftwithStaff__c> overlappingShifts = new List<ShiftwithStaff__c>();
        
        // Perform DateTime comparison to find overlaps
        for (ShiftwithStaff__c shift : potentialShifts) {
            DateTime shiftStart = DateTime.newInstance(shift.Date__c, shift.Start_Time__c);
            Date shiftEndDate = (shift.End_Date__c != null) ? shift.End_Date__c : shift.Date__c;
            DateTime shiftEnd = DateTime.newInstance(shiftEndDate, shift.End_Time__c);
            
            // Check for overlap
            if (shiftStart <= endDateTime && shiftEnd >= startDateTime) {
                overlappingShifts.add(shift);
            }
        }
        
        // Debugging to check overlapping shifts
        System.debug('Available overlapping shifts: ' + overlappingShifts);
        
        // Handle the overlapping shifts
        if (overlappingShifts.size() > 0) {
            // Your logic to handle overlapping shifts
            errorMessage = true;
        } else {
            errorMessage = false;
        }
        
        return errorMessage;
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
    
}