@RestResource(urlMapping='/FetchMyProfile/*')
global class mobileAppMyProfileRest {
    @HttpGet
    global static void getMyProfile() {
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();
        
        try {
            List<myProfileWrapper> ProfileList = new List<myProfileWrapper>();
            String UserEmail = UserInfo.getUserEmail();
            List<Staff__c> myProfileList = [
                SELECT 
                Id, Name, Last_Name__c, Display_Nickname__c, Prefer_Nickname__c, Gender__c,
                Contact_Number__c, Drivers_Licence__c, State__c, Date_Of_Birth__c, Email_Address__c,
                Status__c, Facility_Name__c, Role__c, Nationality__c, Languages__c,
                Address__Street__s, Address__City__s, Address__StateCode__s, Address__CountryCode__s,
                Address__PostalCode__s, Type_of_User__c, Management_Fee__c,
                Employment_type__c, Fixed_Rate_or_Not__c, Nursning_Awards__c,
                Working_Hours_Rate__c, Working_Percentage_for_Saturday__c,
                Working_Percentage_for_Sunday__c, Working_Percentage_for_Holiday__c,
                Type_of_Employe__c, Annual_Leave__c, Sick_Leave__c, Parental_Leave__c,
                Bereavement_Leave__c, Invoice_Rate__c, Invoice_To__c, Residency_status__c,
                TFN_number__c, ABN_Number__c, Tax_free_threshold__c,
                Pre_Tax_One_Description__c, Pre_Tax_One_Value__c,
                Pre_Tax_Two_Description__c, Pre_Tax_Two_Value__c,
                Pre_Tax_Three_Description__c, Pre_Tax_Three_Value__c,
                Pre_Tax_Four_Description__c, Pre_Tax_Four_Value__c,
                Pre_Tax_Five_Description__c, Pre_Tax_Five_Value__c,
                Pre_Tax_Calculator__c, Post_Tax_Decription__c, Post_Tax__c,
                BSB__c, Account_Name__c, Account_Number__c, Name__c,
                Emergency_Last_Name__c, Relationship__c, Emergency_Phone_Number__c, Emergency_Email__c, Job_Title__c,
                
                /* CHILD DOCUMENTS */
                (
                    SELECT Id, Name, key__c, Comments__c, File_Name__c, Points__c, Staff__c,Awsjson__c,
                    Status__c, Type__c, View_File__c, Compliance__c, Expiry_Date__c,Document_Type__c
                    FROM Child_Staffs__r
                ),
                
                /* EMPLOYMENT RATES */
                (
                    SELECT Id, Afternoon_shift_Hourly_Rate__c, Category_Type__c,
                    Classification_Level__c, Classification_Pay_Point__c,
                    Hourly_Rate__c, Night_shift_Hourly_Rate__c,
                    Sleepover_Allowance__c, Public_holiday_Hourly_Rate__c,
                    Saturday_Hourly_Rate__c, Sunday_Hourly_Rate__c,
                    Type_of_Job__c, RoleName__c,Active__c
                    FROM StaffRoles__r  where Active__c = TRUE
                )
                FROM Staff__c  where  Email_Address__c  =: UserEmail
            ];
            System.debug('myProfile (pretty) => ' + JSON.serializePretty(myProfileList));
            for (Staff__c s : myProfileList) {
                
                myProfileWrapper mp = new myProfileWrapper();
                
                mp.staffId 		  =	(s.Id);
                mp.FirstName      = (s.Name == null) ? '' : s.Name;
                mp.LastName       = (s.Last_Name__c == null) ? '' : s.Last_Name__c;
                mp.NickName       = (s.Display_Nickname__c == null) ? '' : s.Display_Nickname__c;
                mp.PreferNickName = String.valueOf(s.Prefer_Nickname__c);
                mp.Gender         = (s.Gender__c == null) ? '' : s.Gender__c;
                mp.Contact        = (s.Contact_Number__c == null) ? '' : s.Contact_Number__c;
                mp.State          = (s.State__c == null) ? '' : s.State__c;
              //  mp.Role           = (s.Role__c == null) ? '' : s.Role__c;
              
                mp.DOB            = s.Date_Of_Birth__c;   // date supports null
                mp.Email          = (s.Email_Address__c == null) ? '' : s.Email_Address__c;
                mp.Status         = (s.Status__c == null) ? false : s.Status__c;
                mp.Facility       = (s.Facility_Name__c == null) ? '' : s.Facility_Name__c;
                mp.Nationality    = (s.Nationality__c == null) ? '' : s.Nationality__c;
                mp.Languages      = (s.Languages__c == null) ? '' : s.Languages__c;
                mp.ManagementFee = s.Management_Fee__c == null ? null : s.Management_Fee__c;
                mp.TypeofUser    = (s.Type_of_User__c == null) ? '' : s.Type_of_User__c;
                mp.DriversLicence = (s.Drivers_Licence__c == null) ? '' : s.Drivers_Licence__c;
                mp.AddressStreet   = (s.Address__Street__s == null) ? '' : s.Address__Street__s;
                mp.AddressCity     = (s.Address__City__s == null) ? '' : s.Address__City__s;
                mp.AddressState    = (s.Address__StateCode__s == null) ? '' : s.Address__StateCode__s;
                mp.AddressCountry  = (s.Address__CountryCode__s == null) ? '' : s.Address__CountryCode__s;
                mp.AddressPostCode = (s.Address__PostalCode__s == null) ? '' : s.Address__PostalCode__s;
                mp.EmploymentType = (s.Type_of_Employe__c == null) ? '' : s.Type_of_Employe__c;
                mp.Frequency        = (s.Employment_type__c == null) ? '' : s.Employment_type__c;
                mp.Annual   = (s.Annual_Leave__c == null)   ? '' : String.valueOf(s.Annual_Leave__c);
                mp.Sick     = (s.Sick_Leave__c == null)     ? '' : String.valueOf(s.Sick_Leave__c);
                mp.Parental = (s.Parental_Leave__c == null) ? '' : String.valueOf(s.Parental_Leave__c);
                mp.Other    = (s.Bereavement_Leave__c == null) ? '' : String.valueOf(s.Bereavement_Leave__c);
                mp.JobTitle         = (s.Job_Title__c == null) ? '' : s.Job_Title__c;
                mp.EmergencyFirstName = (s.Name__c == null) ? '' : s.Name__c;
                mp.EmergencyLastName = (s.Emergency_Last_Name__c == null) ? '' : s.Emergency_Last_Name__c;
                mp.Relationship       = (s.Relationship__c == null) ? '' : s.Relationship__c;
                mp.EmergencyContact   = (s.Emergency_Phone_Number__c == null) ? '' : s.Emergency_Phone_Number__c;
                mp.EmergencyEmail     = (s.Emergency_Email__c == null) ? '' : s.Emergency_Email__c;
                mp.BSB      		  = (s.BSB__c == null) ? '' : s.BSB__c;
                mp.AccountName   = (s.Account_Name__c == null) ? '' : s.Account_Name__c;
                mp.AccountNumber = (s.Account_Number__c == null) ? '' : s.Account_Number__c;
                mp.SchadsAwards  = s.Fixed_Rate_or_Not__c; 
                mp.NursingAwards = s.Nursning_Awards__c;
                mp.document = new List<DocumentationWrapper>();
                system.debug('s.Child_Staffs__r ' +s.Child_Staffs__r);
                
                if (s.Child_Staffs__r != null) {
                    for (Child_Staff__c doc : s.Child_Staffs__r) {
                        DocumentationWrapper dw = new DocumentationWrapper();
                        System.debug('Record Id: ' + doc.Id);
                        System.debug('View_File__c: ' + doc.View_File__c);
                        dw.docId          = doc.Id;
                        dw.DocNo          = (doc.Name == null) ? '' : doc.Name;
                        dw.TypeofDocument = (doc.Document_Type__c == null) ? '' : doc.Document_Type__c;
                        dw.Comments       = (doc.Comments__c == null) ? '' : doc.Comments__c;
                        dw.Points         = (doc.Points__c == null) ? 0 : Integer.valueOf(doc.Points__c);
                        dw.Status         = (doc.Status__c == null) ? '' : doc.Status__c;
                        dw.Compliance     = doc.Compliance__c;
                        dw.ExpiryDate = String.valueOf(doc.Expiry_Date__c);
                        dw.Key            = doc.key__c;
                        dw.URL            = doc.View_File__c;
                         if (String.isNotBlank(doc.Awsjson__c)) {
                           Map<String, Object> awsMap =   (Map<String, Object>) JSON.deserializeUntyped(doc.Awsjson__c);
                              dw.fileType = (String) awsMap.get('type');  
                            
                        }
                        mp.document.add(dw);
                    }
                }
         
                system.debug('s.Child_Staffs__r ' +s.Child_Staffs__r);
                
                mp.employeedetails = new List<EmploymentWrapper>();
                
                if (s.StaffRoles__r != null) {
                    for (StaffRole__c sr : s.StaffRoles__r) {
                        EmploymentWrapper ew = new EmploymentWrapper();
                        
                        ew.CategoryType          = (sr.Category_Type__c == null) ? '' : sr.Category_Type__c;
                        ew.ClassificationLevel   = (sr.Classification_Level__c == null) ? '' : sr.Classification_Level__c;
                        ew.ClassificationPayPoint= (sr.Classification_Pay_Point__c == null) ? '' : sr.Classification_Pay_Point__c;
                        ew.RoleName = (sr.RoleName__c == null) ? '' : String.valueOf(sr.RoleName__c);
                        //mp.Role =  mp.Role +';'+sr.RoleName__c;
                        if (String.isNotBlank(sr.RoleName__c)) {
                            mp.Role = (mp.Role == '' ? sr.RoleName__c : mp.Role + ';' + sr.RoleName__c);
                        }
                        ew.HourlyRate       = (sr.Hourly_Rate__c == null) ? 0 : sr.Hourly_Rate__c;
                        ew.AfternoonRate    = (sr.Afternoon_shift_Hourly_Rate__c == null) ? 0 : sr.Afternoon_shift_Hourly_Rate__c;
                        ew.NightRate        = (sr.Night_shift_Hourly_Rate__c == null) ? 0 : sr.Night_shift_Hourly_Rate__c;
                        ew.SaturdayRate     = (sr.Saturday_Hourly_Rate__c == null) ? 0 : sr.Saturday_Hourly_Rate__c;
                        ew.SundayRate       = (sr.Sunday_Hourly_Rate__c == null) ? 0 : sr.Sunday_Hourly_Rate__c;
                        ew.PublicHolidayRate= (sr.Public_holiday_Hourly_Rate__c == null) ? 0 : sr.Public_holiday_Hourly_Rate__c;
                        ew.Sleepover        = (sr.Sleepover_Allowance__c == null) ? 0 : sr.Sleepover_Allowance__c;
                        ew.EmploymentType   = (sr.Type_of_Job__c == null) ? '' : sr.Type_of_Job__c;
                        mp.employeedetails.add(ew);
                    }
                }
                
                profileList.add(mp);
            }
            responseMap.put('isSuccess', true);
            responseMap.put('message', 'Staff details fetched successfully');
            responseMap.put('staffDetails', profileList);
            
        }
        catch (Exception e) {
            responseMap.put('isSuccess', false);
            responseMap.put('message', 'Error fetching Staff details');
            responseMap.put('error', e.getMessage());
            res.statusCode = 200;
        }
        res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        res.statusCode = 200;
    }
    global class myProfileWrapper {
        global string staffId;
        global string FirstName;
        global string LastName;
        global string NickName;
        global string PreferNickName;
        global string Gender;
        global string Contact;
        global string Role ='';
        global string State;
        global date DOB;
        global string Email;
        global boolean Status;
        global string Facility;
        global string Nationality;
        global string Languages;
        global string DriversLicence;
        global string AddressStreet;
        global string AddressCity;
        global string AddressState;
        global string AddressCountry;
        global string AddressPostCode;
        global List<EmploymentWrapper> employeedetails;
        global List<DocumentationWrapper> document;
        global string Frequency;
        global string EmploymentType;
        global string Annual;
        global string Sick;
        global string Parental;
        global string Other;
        global string EmergencyFirstName;
        global string EmergencyLastName;
        global string Relationship;
        global string EmergencyContact;
        global string EmergencyEmail;
        global string BSB;
        global string AccountName;
        global string AccountNumber;
        global decimal ManagementFee;
        global string JobTitle;
        global string TypeofUser;
        global boolean SchadsAwards;
        global boolean NursingAwards;
    }
    global class EmploymentWrapper {
        global string RoleName;
        global decimal HourlyRate;
        global decimal SaturdayRate;
        global decimal SundayRate;
        global decimal PublicHolidayRate;
        global decimal AfternoonRate;
        global decimal NightRate;
        global decimal Sleepover;
        global string CategoryType;
        global string ClassificationLevel;
        global string ClassificationPayPoint;  
        global string EmploymentType;
    }
    global class DocumentationWrapper {
        global string DocNo;
        global string TypeofDocument;
        global string Comments;
        global string ExpiryDate;
        global boolean Compliance;
        global integer Points;
        global string Status;
        global string docId;
        global string Key;
        global string URL;
        global string fileType;
    }
    
    @HttpPost
    global static void createProfile() {
        
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        Map<String, Object> responseMap = new Map<String, Object>();
        
        try {
            // 1️⃣ Get JSON body
            String body = req.requestBody.toString();
            System.debug('POST Body: ' + body);
            
            // 2️⃣ Deserialize into wrapper list
            myProfileWrapper mp = (myProfileWrapper) JSON.deserialize(body, myProfileWrapper.class);
            
            System.debug('POST Body: ' + mp);
            
            // 3️⃣ Create Staff__c record
            Staff__c staff = new Staff__c();
            staff.Id						 = mp.StaffId;
            staff.Contact_Number__c       	 = mp.Contact;
            staff.State__c                	 = mp.State;
            staff.Drivers_Licence__c         = mp.DriversLicence;
			staff.Address__Street__s	  	 = mp.AddressStreet;
            staff.Address__City__s		  	 = mp.AddressCity;
            staff.Address__StateCode__s 	 = mp.AddressState;
            staff.Address__CountryCode__s    = mp.AddressCountry;
            staff.Address__PostalCode__s   	 = mp.AddressPostCode;
            staff.Emergency_First_name__c    = mp.EmergencyFirstName;
            staff.Emergency_Last_Name__c     = mp.EmergencyLastName;
            staff.Relationship__c            = mp.Relationship;
            staff.Emergency_Email__c         = mp.EmergencyEmail;
            staff.Emergency_Phone_Number__c  = mp.EmergencyContact;
            staff.BSB__c					 = mp.BSB;
            staff.Account_Name__c			 = mp.AccountName;
            staff.Account_Number__c			 = mp.AccountNumber;
            update staff;
            
            // 4️⃣ Create Child Staff Documents
            if (mp.document != null) {
                List<Child_Staff__c> docs = new List<Child_Staff__c>();
                
               for (DocumentationWrapper dw : mp.document) {

                Child_Staff__c d = new Child_Staff__c();
            
                if (String.isNotBlank(dw.docId)) {
                    d.Id = dw.docId;
                }
            
                d.Staff__c        = mp.StaffId;
                d.Document_Type__c= dw.TypeofDocument;
                d.Comments__c     = dw.Comments;
                d.Points__c       = dw.Points;
                d.Compliance__c   = dw.Compliance;
                d.Status__c       = dw.Status;
                d.key__c          = dw.Key;
                d.View_File__c    = dw.URL;
            
                // ✅ SAFE DATE HANDLING
                if (String.isNotBlank(dw.ExpiryDate)) {
                    d.Expiry_Date__c = Date.valueOf(dw.ExpiryDate);
                }
            
                docs.add(d);
            }
                upsert docs;
            }
            
            responseMap.put('isSuccess', true);
            responseMap.put('message', 'Staff profile created successfully');
            responseMap.put('staffId', mp.StaffId);
            
        } catch (Exception e) {
            responseMap.put('isSuccess', false);
            responseMap.put('message', 'Error creating profile');
            responseMap.put('error', e.getMessage());
        }
        
        res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        res.statusCode = 200;
    }
    
}