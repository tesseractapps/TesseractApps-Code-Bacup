/*Test class:ClientSearchControllerTest */
@RestResource(urlMapping='/IssueRegisterParticipant/')
global class MobileIssueRegisterParticipant {
    @HttpGet
    global static List<ParticipantWrapper> getParticipantList() {
        List<ParticipantWrapper> participantWrapperList = new List<ParticipantWrapper>();
        User objUser = [ SELECT Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
        string orgID = [Select id from Organisation__c where name=:objUser.Organization_Name__c limit 1].Id; 
        list<Client__c> clientList=ClientDataController.fetchFacilitiess(orgID, null, null);
        system.debug('partcipant list '+clientList);
        for(Client__c cc:clientList){
            ParticipantWrapper pp = new ParticipantWrapper();
            pp.participantName=cc.First_Name__c+' '+ cc.Last_Name__c; 
            pp.participantId=cc.id;
            pp.FacilityName=cc.Facility__r.Name;
            pp.FacilityId=cc.Facility__c;
            participantWrapperList.add(pp); 
        }
    	
 		system.debug('partcipant list '+clientList);
        return participantWrapperList;
    }


    global class ParticipantWrapper {
        global String participantName;
        global Id participantId;
        global String FacilityName;
        global Id FacilityId;
       
    }
}