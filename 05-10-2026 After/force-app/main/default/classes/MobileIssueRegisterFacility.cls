/* Test Class:MobileAppSignRestResourceTest*/
@RestResource(urlMapping='/IssueRegisterFacility/')
global class MobileIssueRegisterFacility {
     @HttpGet
    global static list<facilityWrapper> getfacilityList(){
        list<facilityWrapper> facilityWrapperList = new list<facilityWrapper>();
        list<Facility__c> facList=HrHomeHandler.fetchFacilitiess();
        for(Facility__c fac:facList){
           facilityWrapper facWrapper= new facilityWrapper();
           facWrapper.facilityName=fac.name;
           facWrapper.facilityId=fac.Id;
            facWrapper.isActive=fac.Status__c;
           facilityWrapperList.add(facWrapper);
        }
       
        return facilityWrapperList;
    }
    
    global class facilityWrapper{
        global string facilityName;
        global ID facilityId;
        global boolean isActive;
    }


}