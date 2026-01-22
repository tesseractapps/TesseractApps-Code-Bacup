/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @Test Class		  : HrHomeHandlerTest
 * @last modified on  : 06-17-2023
 * @last modified by  : Raja Sekhar Reddy
**/
public with sharing class HrHomeHandler {

    @AuraEnabled
    public static List<staff__c> getEmployeeData(){
        String orgId = CurrentUserOrganization.currentOrgId();
        String organizationId = orgId.substring(0,15);
        try {
            return [SELECT Id, Name,Last_Name__c, LastViewedDate,Contact_Number__c,Email_Address__c,Emergency_Phone_Number__c
             FROM staff__c WHERE Organization_Name__c  =:organizationId and LastViewedDate !=null ORDER BY LastViewedDate DESC limit 5];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<Advertisement__c> getJobAds(){
        String orgId = CurrentUserOrganization.currentOrgId();
        String organizationId = orgId.substring(0,15);
        try {
            return [SELECT id,Name,Job_Title__c,Job_description__c,Facility_Name__c,Contract_type__c,FName__c,Organization_Name__c
                     FROM Advertisement__c where Organization_Name__c =:organizationId order by Name asc];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }


    @AuraEnabled
    public static void createJobAds(string title,string description,string ctype,string facility,string loc,string roles,string contactId,String sDate,String eDate){

        List<Advertisement__c> adList=new List<Advertisement__c>();
        Advertisement__c adRec=new Advertisement__c();
        adRec.Job_Title__c=title;
        adRec.Job_description__c=description;
        adRec.Contract_type__c=ctype;
        adRec.Location__c=loc;
        adRec.Facility_Name__c=facility;
        adRec.User__c=contactId;
        adRec.Roles_and_Responsibilities__c=roles;
        adRec.Start_Date__c=Date.valueOf(sDate);
        adRec.End_Date__c=Date.valueOf(eDate);
        adList.add(adRec);

        if(adList.size()!=0){
            insert adList;
        }

    }  

    // Current User details
    @AuraEnabled(cacheable = true)
    public static user userDetials(){ 
        User userRec = [select id,name,Email,MobilePhone from user where Id=:UserInfo.getUserId()];
        return userRec;
    }

    // apex method to fetch Facility__c records from salesforce database 
    @AuraEnabled(cacheable = true)
    public static list<Facility__c> fetchFacilitiess(){ 

        list<Facility__c> lstFacility = new list<Facility__c>();
        Organisation__c orgNames =  new Organisation__c();
        
        User objUser = [ SELECT Phone, Id,Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
        orgNames = [Select id, Name,ABN__c,ACN__c,NDIS_Provider__c,Contact_No__c,Email__c,Address__c from Organisation__c where name=:objUser.Organization_Name__c]; // Can include multiple fields, 
        lstFacility= [SELECT id,name,Email__c,AddressData__c,Phone__c,Status__c,Services__c,Organisation__r.name,Type_of_Service__c,
                                Manager_Name__c,Address__Street__s,Facility_Preferred_Name_Formula__c,Participant_Preferred_Name_Formla__c,Staff_Preferred_Name_Formula__c,
                              	Address__City__s,Address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s,Organisation__r.Afternoon_Shift_End_Time__c,
                      			Organisation__r.Afternoon_Shift_Start_Time__c,Organisation__r.Custom_Shift_End_Time__c,Organisation__r.Custom_Shift_Start_Time__c,
                      			Organisation__r.General_Shift_End_time__c,Organisation__r.General_Shift_Start_Time__c,Organisation__r.Morning_Shift_End_Time__c,
                      			Organisation__r.Morning_Shift_Start_Time__c,Organisation__r.Night_Shift_Start_Time__c,Organisation__r.Night_Shift_End_Time__c,
                      			Organisation__r.Sleepover_Start__c,Organisation__r.Sleepover_Shift_End_Time__c
                                FROM Facility__c where  Organisation__r.Id=:orgNames.Id  And Status__c = TRUE order by name asc ];
      
            return lstFacility;   
        }
        @AuraEnabled
    public static void dummyData2(){
        List<String> s1= new List<String>();
        List<String> s2= new List<String>();
        List<String> s3= new List<String>();
        List<String> s4= new List<String>();
        List<String> s5= new List<String>();
        List<String> s6= new List<String>();
        List<String> s7= new List<String>();
        List<String> s8= new List<String>();
        List<String> s9= new List<String>();
        List<String> s10= new List<String>();
        List<String> s11= new List<String>();
        List<String> s12= new List<String>();
        List<String> s13= new List<String>();
        List<String> s14= new List<String>();
        List<String> s15= new List<String>();
        List<String> s16= new List<String>();
        List<String> s17= new List<String>();
        
        
        List<String> s18= new List<String>();
        List<String> s19= new List<String>();
        List<String> s20= new List<String>();
        List<String> s21= new List<String>();
        List<String> s22= new List<String>();
        List<String> s23= new List<String>();
        List<String> s24= new List<String>();
        List<String> s25= new List<String>();
        List<String> s26= new List<String>();
        List<String> s27= new List<String>();
        List<String> s28= new List<String>();
        List<String> s29= new List<String>();
        List<String> s30= new List<String>();
        List<String> s31= new List<String>();
        List<String> s32= new List<String>();
        List<String> s33= new List<String>();
        
    }
     @AuraEnabled
    public static void dummyData(){
        List<String> s1= new List<String>();
        List<String> s2= new List<String>();
        List<String> s3= new List<String>();
        List<String> s4= new List<String>();
        List<String> s5= new List<String>();
        List<String> s6= new List<String>();
        List<String> s7= new List<String>();
        List<String> s8= new List<String>();
        List<String> s9= new List<String>();
        List<String> s10= new List<String>();
        List<String> s11= new List<String>();
        List<String> s12= new List<String>();
        List<String> s13= new List<String>();
        List<String> s14= new List<String>();
        List<String> s15= new List<String>();
        List<String> s16= new List<String>();
        List<String> s17= new List<String>();
        
        
        List<String> s18= new List<String>();
        List<String> s19= new List<String>();
        List<String> s20= new List<String>();
        List<String> s21= new List<String>();
        List<String> s22= new List<String>();
        List<String> s23= new List<String>();
        List<String> s24= new List<String>();
        List<String> s25= new List<String>();
        List<String> s26= new List<String>();
        List<String> s27= new List<String>();
        List<String> s28= new List<String>();
        List<String> s29= new List<String>();
        List<String> s30= new List<String>();
        List<String> s31= new List<String>();
        List<String> s32= new List<String>();
        List<String> s33= new List<String>();
        
    }
}