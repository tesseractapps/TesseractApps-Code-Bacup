@IsTest
public class MYOBTimeSheetControllerTest {
    
    
    	@testsetup Static void testData(){
        
       
                //system.debug(org.name);
                Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
                UserRole role = [SELECT Id FROM UserRole WHERE Name = 'Portal Account Partner User' LIMIT 1];
                UserRole role1 = [SELECT Id FROM UserRole WHERE Name = 'Portal Account Partner Manager' LIMIT 1];
                
                User user = new User(Alias = 'praveen', Email= 'manualtesting.20933@hotmail.com', 
                                     EmailEncodingKey='UTF-8', LastName='StaffOne20933', LanguageLocaleKey='en_US',        //UserRoleId = role1.Id,
                                     LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.20933@hotmail.com',Organization_Name__c ='Ashfield Consultants',User_Type__c='NDIS Org Admin');
                insert user;
                UserRole adminRole = [
            SELECT Id 
            FROM UserRole 
            WHERE Name = 'Admin' 
            LIMIT 1
        ];
                 User user1 = new User(Alias = 'praveen1', Email= 'manualtesting.20934@hotmail.com', 
                                     EmailEncodingKey='UTF-8', LastName='StaffOne20934', LanguageLocaleKey='en_US',
                                     LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.20934@hotmail.com',UserRoleId = adminRole.Id,Organization_Name__c ='Ashfield Consultants',User_Type__c='NDIS Staff');
                insert user1;
            System.runAs(user){ 
                Organisation__c org = new Organisation__c();
                org.Name='Ashfield Consultants';
                org.ABN__c='11234567891';
                org.ACN__c='878787878';
                org.Contact_No__c='6132899740';
                org.RCTI__c='RCTI1';
                org.Email__c='dsfdsfsd@gmail.com';
                org.Bank__c='Bank Test';
                org.BSB__c='BSB Test';
                org.Account_Name__c='Test Account';
                org.Account_Number__c='1111111111';
                org.Description__c='test Desc';
                org.Address_Latest__Street__s='101';
                org.Address_Latest__City__s='Himas Waterhen';
                org.Address_Latest__PostalCode__s='2060';
                org.Address_Latest__CountryCode__s='AU';
                org.Address_Latest__StateCode__s='NSW';
                org.NDIS_Provider__c='12341234565';
                org.BMSI_Identifier__c ='TEST BMSI';
                org.SoftwareId__c = 'jhdfn18328';
                org.Branch_code__c = 'BS123';
                org.Contact_Name__c = 'Test Contact';
                org.User_Type__c = 'NDIS Org Admin';
                org.Repository_Type__c = 'NDIS Org Admin';
                org.Client_Id__c = '123456789fghj';
                insert org;
            }
        }

    // ---------------------------------------------------------
    // MOCK CLASS
    // ---------------------------------------------------------
    private class MockMYOBResponse implements HttpCalloutMock {

        public HTTPResponse respond(HTTPRequest req) {

            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');

            // 🔹 If GET request → return EmployeePayrollDetails
            if (req.getMethod() == 'GET') {

                Map<String, Object> epd = new Map<String, Object>{

                    'Items' => new List<Object>{
                
                        new Map<String, Object>{
                
                            'UID' => 'EPD-123',
                
                            'Employee' => new Map<String, Object>{
                                'UID' => 'EMP-001'
                            },
                
                            'Wage' => new Map<String, Object>{
                                'WageCategories' => new List<Object>{
                                    new Map<String, Object>{
                                        'UID' => 'EXISTING-1'
                                    }
                                }
                            }
                        }
                    }
                };


                res.setBody(JSON.serialize(epd));
                res.setStatusCode(200);
                return res;
            }

            // 🔹 If PUT request → simulate success
            if (req.getMethod() == 'PUT') {
                res.setBody('{"Status":"Success"}');
                res.setStatusCode(200);
                return res;
            }

            res.setStatusCode(400);
            return res;
        }
    }

    // ---------------------------------------------------------
    // TEST 1 — Missing Wage Gets Added
    // ---------------------------------------------------------
    @IsTest
    static void testAddMissingWageCategory() {

        Test.setMock(HttpCalloutMock.class, new MockMYOBResponse());

        Set<String> requiredUids = new Set<String>{
            'EXISTING-1',
            'NEW-UID-1'
        };
            
        User user = [SELECT Id FROM User WHERE Email='manualtesting.20934@hotmail.com' LIMIT 1];
        system.runas(user){
            Test.startTest();
    
            MyobIntegrationController.updateEmployeePayrollDetailsWithAllMissing(
                'dummyCompanyUri',
                'dummyAccessToken',
                'EMP-001',
                requiredUids
            );
            Test.stopTest();
        }

    }
}