/*Test class:MobileAppSignRestResourceTest*/
@RestResource(urlMapping='/IssueRegisterStaffList/')
global class MobileIssueRegisterStaff {
       @HttpGet
    global static list<staffWrapper> getfacilityList(){
        list<staffWrapper> staffWrapperList = new list<staffWrapper>();
         User objUser = [ SELECT Organization_Name__c,Email FROM User WHERE Id = : UserInfo.getUserId() AND IsActive = TRUE ];
        System.debug('objUser detail : '+objUser);
        String email = objUser.Email;
        System.debug('getting email address :'+email);
       // string orgName = [Select id,Name from Organisation__c where name=:objUser.Organization_Name__c limit 1].Name; 
        List<User> listUsers = [ SELECT Organization_Name__c,Email FROM User WHERE Organization_Name__c =:objUser.Organization_Name__c AND IsActive = TRUE ];
        List<String> emailAddres = new List<String>();
        for(User u:listUsers){
            emailAddres.add(u.Email);
        }
       
          List<staff__c> staffList=  [SELECT Id, Name,Last_Name__c,Status__c,NameToDisplay__c, Display_Nickname__c, LastViewedDate,Contact_Number__c,Email_Address__c,Emergency_Phone_Number__c,Facility__c
             FROM staff__c WHERE Organization_Full_Name__c  =:objUser.Organization_Name__c AND Email_Address__c =:emailAddres AND Status__c=true  ORDER BY NameToDisplay__c ASC];
       // List<staff__c> staffList=issueRegisterSearch.getEmployeeData();
        for(staff__c staff:staffList){
           staffWrapper st= new staffWrapper();
           st.StaffName=staff.NameToDisplay__c;
           st.staffId=staff.Id;
            st.isActive=staff.Status__c;
           staffWrapperList.add(st);
        }
       
        return staffWrapperList;
    }
    
    global class staffWrapper{
        global string StaffName;
        global ID staffId;
        global boolean isActive;
    }

}