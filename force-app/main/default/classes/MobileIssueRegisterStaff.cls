/*Test class:MobileAppSignRestResourceTest*/
@RestResource(urlMapping='/IssueRegisterStaffList/')
global class MobileIssueRegisterStaff {
       @HttpGet
    global static list<staffWrapper> getfacilityList(){
        list<staffWrapper> staffWrapperList = new list<staffWrapper>();
        List<staff__c> staffList=issueRegisterSearch.getEmployeeData();
        for(staff__c staff:staffList){
           staffWrapper st= new staffWrapper();
           st.StaffName=staff.NameToDisplay__c;
           st.staffId=staff.Id;
           staffWrapperList.add(st);
        }
       
        return staffWrapperList;
    }
    
    global class staffWrapper{
        global string StaffName;
        global ID staffId;
    }

}