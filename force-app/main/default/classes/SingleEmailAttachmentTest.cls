@isTest
public class SingleEmailAttachmentTest {
    
    static testMethod void payRollHandlerTest(){
        Test.startTest();
        
        Organisation__c org = OrgDetailsTest.createOrganization();
        List<Facility__c> facilityList = FacilityControllerTest.createFacility(org.Id);
        System.debug(facilityList[0]);
        Organisation__c orgRec =[select id,name from Organisation__c where id=:facilityList[0].Organisation__c];
        List<Staff__c> staffRec = new List<Staff__c>();
            staffRec = StaffControllerTest.createStaff(facilityList[0].id);
        
        /*
        Attachment attach=new Attachment();   	
        attach.Name='Unit Test Attachment';
        Blob bodyBlob=Blob.valueOf('Unit Test Attachment Body');
        attach.body=bodyBlob;
        attach.parentId=staffRec[0].id;
        insert attach;*/
        
        String base64Content ='"JVBERi0xLjMKJbrfrOAKGFydHhyZWYKMTg2NTIKJSVFT0Y="';
        String orgName ='Age Grace Innovation Pvt Ltd';
        string enddate='2023-12-13';
        
        SingleEmailAttachment.emailAttach(base64Content, 'raja94reddy@gmail.com','subjectName',enddate,'raja94reddy@gmail.com',orgName);
        Test.stopTest();
    }
    
}