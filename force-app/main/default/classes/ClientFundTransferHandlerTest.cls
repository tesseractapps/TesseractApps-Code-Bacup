@isTest
public class ClientFundTransferHandlerTest {    
	@testsetup Static void TestClientData(){
        Client__c cli =  new Client__c();
        cli.First_Name__c = 'Test';
        cli.Last_Name__c = 'Participant';
        cli.Gendar__c = 'Male';
        cli.Date_Of_Birth__c = Date.newInstance(1991, 2, 17);
        cli.Address__Street__s='8 Keewong Street';
        cli.Address__City__s = 'Crace';
        cli.Address__StateCode__s='ACT';
        cli.Address__PostalCode__s='2911';
        cli.Contact_Number__c='4331237651';
        cli.Drivers_Licence__c = '123456789012';
        cli.Primay_Contact_First_Name__c='Jason';
        cli.Primay_Contact_Last_Name__c='Smith';
        cli.Relationship__c='Parent';
        cli.Primary_Contact_Number__c='0433123123';
        insert cli;
        
        Funds_Tracker__c funds = new Funds_Tracker__c();
        funds.Registration_Group__c='Assistance Animals';
        funds.Amount_approved__c=5000;
        funds.Client__c=cli.Id;
        insert funds;
                
        Fund_Transfer_Amount__c	fundsTransfer = new Fund_Transfer_Amount__c();
        fundsTransfer.Funds_Tracker__c = funds.Id;
        insert fundsTransfer;
        
        Test.startTest();
        	ClientFundTransferHandler.fetchfundTracker(cli.Id);
        Test.stopTest();
    }
    @isTest
    public static void CallMe(){
        string name='test record';
        List<Fund_Transfer_Amount__c> fudList = [select id,Amount_incl_GST__c,Funds_Tracker__c,Amount__c,GST__c,Service_Date__c,Description__c,Status__c from Fund_Transfer_Amount__c];
        ClientFundTransferHandler.fundTrackerSpent(name);
    }
    
    @isTest
    public static void fundTrackerSpentAmountTest(){
        Client__c cid = [select id from Client__c ];
        string clientid=cid.id;
        ClientFundTransferHandler.fundTrackerSpentAmount(clientid,'1000','2000', '1000');
    }
     @isTest
    public static void TestsaveFundTracker(){
        Fund_Transfer_Amount__c FTA = [select id, Funds_Tracker__c from Fund_Transfer_Amount__c ];
        string FTAID=FTA.Funds_Tracker__c;
        String Year = '2023';
        String Month = '4';
        String Day = '5';
        String string_type = Year + '-' + Month + '-' + Day;        //string dt1=stringValueof
        ClientFundTransferHandler.saveFundTracker(FTAID, '1000','120.00', 'test',string_type, 'testStatus');
    }
    @isTest
    public static void testfundTrackerRecord(){
        Client__c cid = [select id from Client__c ];
        string clientid=cid.id;
        ClientFundTransferHandler.fundTrackerRecord(clientid);
    }
     @isTest
    public static void TestsavFundTransfer(){
        Client__c cid = [select id from Client__c ];
        string clientid=cid.id;
        String Year = '2023';
        String Month = '4';
        String Day = '5';
        String string_type = Year + '-' + Month + '-' + Day;      
        ClientFundTransferHandler.savFundTransfer(clientid,'1000', string_type);
    }
}