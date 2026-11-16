/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @last modified on  : 06-17-2023
 * @last modified by  : Raja Sekhar Reddy
**/
public with sharing class EmployeeManagementHandler {
    @AuraEnabled
    public static void createEmployeeRecord(String JSONString){
        List<pdfWrapper> pdfQuestion = (List<pdfWrapper>)System.JSON.deserialize(JsonString,List<pdfWrapper>.class);
        
        List<Staff__c> staffList=new List<Staff__c>();
        for(pdfWrapper pdfwrap:pdfQuestion){
            string facId=pdfwrap.facname;
            string facilityId=facId.substring(0,15);
            system.debug('facilityId>>>'+facilityId);
            Staff__c staffRec= new Staff__c();
            staffRec.Name=pdfwrap.fname;
			staffRec.Last_Name__c=pdfwrap.lname;
            staffRec.Contact_Number__c=pdfwrap.contact;
            //staffRec.Date_Of_Birth__c=Date.parse(pdfwrap.dob);
            staffRec.Email_Address__c=pdfwrap.email;
            staffRec.Employment_type__c=pdfwrap.etype;
            staffRec.TFN_number__c=pdfwrap.tfn;
            staffRec.ABN_Number__c=pdfwrap.abn;
            staffRec.Accreditations__c=pdfwrap.acc;
            staffRec.Emergency_First_name__c=pdfwrap.fname;
            staffRec.Emergency_Last_Name__c=pdfwrap.lname;
            staffRec.Relationship__c=pdfwrap.relation;
          	staffRec.Emergency_Phone_Number__c=pdfwrap.econtact;
            staffRec.Emergency_Email__c=pdfwrap.eemail;
            staffRec.Account_Name__c=pdfwrap.acname;
            staffRec.Account_Number__c=pdfwrap.acnumber;
            staffRec.Address__Street__s=pdfwrap.street;
            staffRec.Address__City__s=pdfwrap.city;
            staffRec.Address__PostalCode__s=pdfwrap.postalcode;
            staffRec.Address__CountryCode__s='AU';
            staffRec.Address__StateCode__s=pdfwrap.state;
            staffRec.BSB__c=pdfwrap.bsb;
        	staffRec.Superannuation_Name__c=pdfwrap.sname;
            staffRec.Availability__c='Present';           
            staffRec.Facility__c=facilityId;            
            staffList.add(staffRec);
        }
        if(staffList.size()!=0){
            insert staffList;
            
        }
    }  

    public class pdfWrapper{

        public String fname;
        public String lname;
        public String contact;
        public String dob;
        public String email;
        public String etype;
        public String tfn;
        public String abn;
        public String acc;
        public String efname;
        public String elname;
        public String relation;
        public String econtact;
        public String eemail;
        public String acname;
        public String acnumber;
        public String bsb;
        public String sname;
        public String snumber;
        public String facname;
        public String street;
        public String city;
        public String state;
        public String country;
        public String postalcode;
    }

}