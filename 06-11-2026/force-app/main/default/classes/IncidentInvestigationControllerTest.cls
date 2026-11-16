@IsTest
private class IncidentInvestigationControllerTest {

    @TestSetup
    static void testData() {

        Organisation__c org = new Organisation__c();
        org.Name = 'Ashfield Consultants12';
        org.ABN__c = '11234567891';
        org.ACN__c = '878787878';
        org.Contact_No__c = '6132899740';
        org.RCTI__c = 'RCTI1';
        org.Email__c = 'dsfdsfsd@gmail.com';
        org.Bank__c = 'Bank Test';
        org.BSB__c = 'BSB Test';
        org.Account_Name__c = 'Test Account';
        org.Account_Number__c = '1111111111';
        org.Description__c = 'test Desc';
        org.Address_Latest__Street__s = '101';
        org.Address_Latest__City__s = 'Himas Waterhen';
        org.Address_Latest__PostalCode__s = '2060';
        org.Address_Latest__CountryCode__s = 'AU';
        org.Address_Latest__StateCode__s = 'NSW';
        org.NDIS_Provider__c = '12341234565';
        org.BMSI_Identifier__c = 'TEST BMSI';
        org.SoftwareId__c = 'jhdfn18328';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c = 'Test Contact';
        org.User_Type__c = 'NDIS Org Admin';
        org.Week_Start_Day__c = 'Monday';
        insert org;

        Profile prof = [
            SELECT Id, Name
            FROM Profile
            WHERE Name LIKE '%Admin%'
            LIMIT 1
        ];

        User user = new User(
            Alias = 'praveen',
            Email = 'manualtesting.612233142@hotmail.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'StaffOne612233142',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'manualtesting.612233142@hotmail.com',
            Organization_Name__c = 'Ashfield Consultants12'
        );
        insert user;

        System.runAs(user) {

            Facility__c fac = new Facility__c();
            fac.Name = 'Ashfield Consultants';
            fac.Address__City__s = 'Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s = 'ACT';
            fac.Address__PostalCode__s = '2911';
            fac.Address__CountryCode__s = 'AU';
            fac.Email__c = 'testonefacility@gmail.com';
            fac.Status__c = true;
            fac.Organisation__c = org.Id;
            fac.ABN__c = '12345678912';
            fac.Phone__c = '12323432';
            insert fac;
 Client__c cli = new Client__c();
            cli.First_Name__c='Test';
            cli.Last_Name__c='Client';
            cli.Gendar__c='Male';
            cli.Date_Of_Birth__c=Date.newInstance(1991,2,17);
            cli.Address__Street__s='Street';
            cli.Address__City__s='City';
            cli.Address__StateCode__s='ACT';
            cli.Address__PostalCode__s='2911';
            cli.Contact_Number__c='4331237651';
            cli.Drivers_Licence__c='123456789012';
            cli.Primay_Contact_First_Name__c='Jason';
            cli.Primay_Contact_Last_Name__c='Smith';
            cli.Relationship__c='Parent';
            cli.Email__c='client@test.com';
            cli.Primary_Contact_Number__c='0433123123';
            cli.Facility__c=fac.id;
            cli.Status__c=true;
            cli.Medications__c='Test';
            cli.Allergies__c='Test';
            cli.Notes__c='Test';
            cli.Accessible_Forms__c='Test';
            cli.Unavailable_Date__c=Date.newInstance(2025,5,16);
            insert cli;
            List<Staff__c> staffList = new List<Staff__c>();

            for (Integer i = 0; i <= 10; i++) {

                Staff__c staff = new Staff__c();

                staff.Last_Name__c = 'Test staff ' + i;
                staff.Name = 'praveen' + i;
                staff.Name__c = 'abcd' + i;
                staff.Contact_Number__c = '5678990874' + i;
                staff.Email_Address__c =
                    'manualtesting.612233142' + i + '@hotmail.com';
                staff.Facility__c = fac.Id;

                staff.Address__Street__s = '8 Keewong Street';
                staff.Address__City__s = 'Crace';
                staff.Address__StateCode__s = 'ACT';
                staff.Address__PostalCode__s = '2911';

                staff.Emergency_Phone_Number__c = '4567876667' + i;
                staff.Primary_Contact_Name__c = 'Praveen';
                staff.Primary_Contact_Number__c = '990845829' + i;
                staff.Make_Primary_as_Approver__c = true;
                staff.Primary_Contact_Email__c =
                    'praveenshesham.sp+' + i + '@gmail.com';

                staff.Secondary_Contact_Name__c = 'Maheswari';
                staff.Secondary_Contact_Email__c =
                    'maheswari.adabala+' + i + '@gmail.com';
                staff.Make_Secondary_as_Approver__c = false;
                staff.Secondary_Contact_Number__c = '9908458295' + i;

                staff.Emp_exit_date__c = Date.newInstance(2028, 1, 5);
                staff.Emp_Start_Date__c = Date.newInstance(2023, 2, 1);
                staff.Payee_ETP_Payment_Date__c = Date.newInstance(2025, 2, 4);
                staff.Date_Of_Birth__c = Date.newInstance(2001, 2, 4);

                staff.Role__c = 'Admin';
                staff.Residency_Type__c = 'Australian';
                staff.Expiry_Date__c = Date.newInstance(2025, 2, 19);
                staff.Type__c = 'Visa Status';
                staff.Status__c = true;

                staff.Restrict_Set_Hours__c = true;
                staff.Set_Hours__c = 45;

                staff.Working_Hours_Rate__c = 50 + i;
                staff.Final_Overall_Rate__c = 150 + i;
                staff.Saturday_Hourly_Rate__c = 120 + i;
                staff.Sunday_Hourly_Rate__c = 130 + i;
                staff.Public_holiday_Hourly_Rate__c = 170 + i;

                staffList.add(staff);
            }

            insert staffList;

            List<StaffRole__c> staffRoles = new List<StaffRole__c>();

            for (Staff__c staff : staffList) {

                StaffRole__c sr = new StaffRole__c();

                sr.StaffRole_To_Staff__c = staff.Id;
                sr.RoleName__c = 'Admin';
                sr.Active__c = true;
                sr.Hourly_Rate__c = 50;
                sr.Afternoon_shift_Hourly_Rate__c = 60;
                sr.Night_shift_Hourly_Rate__c = 70;
                sr.Saturday_Hourly_Rate__c = 80;
                sr.Sunday_Hourly_Rate__c = 90;
                sr.Public_holiday_Hourly_Rate__c = 100;
                sr.Sleepover_Allowance__c = 40;

                staffRoles.add(sr);
            }

            insert staffRoles;

            List<Staff_Facility__c> staffFacilities =
                new List<Staff_Facility__c>();

            for (Staff__c staff : staffList) {

                Staff_Facility__c sf = new Staff_Facility__c();

                sf.Staff__c = staff.Id;
                sf.Facility__c = fac.Id;
                sf.Active__c = true;

                staffFacilities.add(sf);
            }

            insert staffFacilities;


            /*
             * Existing shift test data
             */

            Add_Shift__c shift = new Add_Shift__c();

            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c = true;
            shift.Start_Date__c = Date.newInstance(2027, 4, 29);
            shift.End_Date__c = Date.newInstance(2027, 4, 29);
            shift.Get_Facility__c = true;
            shift.Quantity__c = 5;
            shift.Start_Time__c = Time.newInstance(3, 30, 0, 0);
            shift.End_Time__c = Time.newInstance(10, 0, 0, 0);
            shift.Facility__c = fac.Id;
            shift.Status__c = 'Draft';
            shift.Location__StateCode__s = 'ACT';
            shift.Location__CountryCode__s = 'AU';
            shift.Location__PostalCode__s = '2911';
            shift.Shift_Type__c = 'Night';

            insert shift;


            ShiftwithStaff__c staffs = new ShiftwithStaff__c();

            staffs.Add_Shift__c = shift.Id;
            staffs.Attendence__c = true;
            staffs.Comments__c = 'test comments';
            staffs.Staff__c = staffList[0].Id;
            staffs.Start_Date__c = Date.newInstance(2027, 4, 29);
            staffs.Shift_End_Date__c = Date.newInstance(2027, 4, 29);
            staffs.Shift_Start_Time__c = Time.newInstance(3, 30, 0, 0);
            staffs.Shift_End_Time__c = Time.newInstance(3, 30, 0, 0);
            staffs.Role__c = 'Admin';
            staffs.Status__c = 'Accepted';

            staffs.Log_In_Date_Time__c = Time.newInstance(4, 30, 0, 0);
            staffs.Log_Out_Date_Time__c = Time.newInstance(10, 0, 0, 0);

            staffs.Is_long_Morning__c = true;
            staffs.Long_Morning_Start_Time__c = Time.newInstance(4, 30, 0, 0);
            staffs.Long_Morning_End_Time__c = Time.newInstance(10, 0, 0, 0);
            staffs.Long_Morning_Index__c = 0;
            staffs.Long_Morning_Hourly_Rate__c = 10;
            staffs.Long_Morning_Shift_Duartion__c = 10;
            staffs.Is_long_Morning_Next_Day_Start__c = false;
            staffs.Long_Morning_Start_Date_One__c =
                Date.newInstance(2027, 4, 29);

            staffs.Is_Long_Afternoon__c = true;
            staffs.Long_Afternoon_Start_Time__c =
                Time.newInstance(4, 30, 0, 0);
            staffs.Long_Afternoon_End_Time__c =
                Time.newInstance(10, 0, 0, 0);
            staffs.Long_Afternoon_Index__c = 0;
            staffs.Long_Afternoon_Hourly_Rate__c = 10;
            staffs.Long_Afternoon_Shift_Duartion__c = 10;
            staffs.Is_Long_Afternoon_Next_Day_Start__c = false;
            staffs.Long_Afternoon_Start_Date_One__c =
                Date.newInstance(2027, 4, 29);

            staffs.Is_Long_Night_Shift__c = true;
            staffs.Long_Night_Start_Time__c =
                Time.newInstance(4, 30, 0, 0);
            staffs.Long_Night_End_Time__c =
                Time.newInstance(10, 0, 0, 0);
            staffs.Long_Night_Index__c = 0;
            staffs.Long_Night_Hourly_Rate__c = 10;
            staffs.Long_Night_Shift_Duartion__c = 10;
            staffs.Is_Long_Night_Start_Next_Day__c = false;
            staffs.Long_Night_Start_Date__c =
                Date.newInstance(2027, 4, 29);

            insert staffs;


            /*
             * INCIDENT TEST DATA
             */

            Incident_Register_Response__c response =
                new Incident_Register_Response__c();

            response.Name__c = 'Test Incident';
            response.Status__c = 'Open';
            response.Severity__c = 'High';
            response.NDIS_Reportable__c = 'No';
            response.Next_Due__c = Date.today().addDays(5);
            response.Client_Id__c = null;
            response.Incident_Assigned_Staff__c = staffList[0].Id;
            response.History_Log__c = null;

            insert response;


            Incident_Investigation__c investigation =
                new Incident_Investigation__c();

            investigation.Incident_Response__c = response.Id;
            investigation.NDIS_Reportable__c = 'No';
            investigation.Assessment_Notes__c = 'Initial assessment';
            investigation.Findings_Summary__c = 'Initial findings';
            investigation.Status__c = 'In Progress';
            investigation.Assigned_Investigator__c = staffList[0].Id;
            investigation.Severity__c = 'High';
            investigation.Acknowledged__c = false;

            insert investigation;


            Incident_Corrective_Action__c action =
                new Incident_Corrective_Action__c();

            action.Incident_Investigation__c = investigation.Id;
            action.Action_Title__c = 'Test Corrective Action';
            action.Description__c = 'Test corrective action description';
            action.Assigned_Owner__c = staffList[0].Id;
            action.Due_Date__c = Date.today().addDays(7);
            action.Status__c = 'Open';

            insert action;


            Incident_Evidence__c evidence =
                new Incident_Evidence__c();

            evidence.Incident_Investigation__c = investigation.Id;
            evidence.Incident_Corrective_Action__c = action.Id;
            evidence.Attachment_Name__c = 'Test Attachment';
            evidence.File_Name__c = 'test.pdf';
            evidence.Type__c = 'PDF';
            evidence.Evidence_Type__c = 'Incident Evidence';
            evidence.Uploaded_By__c = staffList[0].Id;
            evidence.AWS_File_Key__c = 'test/key';
            evidence.AWS_File_URL__c =
                'https://example.com/test.pdf';

            insert evidence;


            Incident_NDIS_Submission__c submission =
                new Incident_NDIS_Submission__c();

            submission.Incident_Investigation__c = investigation.Id;
            submission.Submission_Type__c = 'Initial Notification';
            submission.Submitted_By__c = staffList[0].Id;
            submission.Submission_Date__c = Date.today();
            submission.Submission_Time__c =
                Time.newInstance(10, 30, 0, 0);
            submission.Reference_Number__c = 'TEST-001';
            submission.Summary_Notes__c = 'Test submission';

            insert submission;
        }
    }

    @IsTest
    static void testDashboardData_AllFilters() {
        User u = [
            SELECT Id
            FROM User
            WHERE Email = 'manualtesting.612233142@hotmail.com'
            LIMIT 1
        ];

        System.runAs(u) {
            
            IncidentInvestigationController.DashboardWrapper allData =
                IncidentInvestigationController.getDashboardData(null);
            IncidentInvestigationController.DashboardWrapper openData =
                IncidentInvestigationController.getDashboardData('Open');
            IncidentInvestigationController.DashboardWrapper reportableData =
                IncidentInvestigationController.getDashboardData('Reportable');
            IncidentInvestigationController.DashboardWrapper progressData =
                IncidentInvestigationController.getDashboardData('In Progress');
            IncidentInvestigationController.DashboardWrapper resolvedData =
                IncidentInvestigationController.getDashboardData('Resolved');
            IncidentInvestigationController.DashboardWrapper overdueData =
                IncidentInvestigationController.getDashboardData('Overdue');
            
            System.debug(allData);
            System.debug(openData);
            System.debug(reportableData);
            System.debug(progressData);
            System.debug(resolvedData);
            System.debug(overdueData);
        }
    }

    @IsTest
    static void testInvestigationReadMethods() {
        Incident_Register_Response__c response = [
            SELECT Id
            FROM Incident_Register_Response__c
            LIMIT 1
        ];

        Incident_Investigation__c investigation = [
            SELECT Id, Incident_Response__c, Assigned_Investigator__c,
                   NDIS_Reportable__c, Assessment_Notes__c,
                   Findings_Summary__c, Severity__c, Status__c,
                   Acknowledged__c
            FROM Incident_Investigation__c
            LIMIT 1
        ];

              /*  IncidentInvestigationController.InvestigationWrapper wrapper =
            IncidentInvestigationController.getInvestigationData(response.Id);  */

        Incident_Register_Response__c assessmentResponse =
            IncidentInvestigationController.getIncidentResponseForAssessment(response.Id);

        Map<String, Object> assessment =
            IncidentInvestigationController.getInvestigationForAssessment(
                String.valueOf(response.Id)
            );

        Map<String, Object> emptyAssessment =
            IncidentInvestigationController.getInvestigationForAssessment('');

        Id parentResponse =
            IncidentInvestigationController.getResponseIdFromInvestigation(
                investigation.Id
            );
        Id nullParent =
            IncidentInvestigationController.getResponseIdFromInvestigation(null);

        String safeValue = IncidentInvestigationController.safe('');
        String normalValue = IncidentInvestigationController.safe('value');

        List<Object> history = new List<Object>{
            new Map<String, Object>{
                'action' => 'Test Action',
                'content' => 'Test content'
            }
        };
        Boolean found = IncidentInvestigationController.hasEntryWithAction(
            history,
            'Test Action'
        );
        Boolean notFound = IncidentInvestigationController.hasEntryWithAction(
            history,
            'Missing Action'
        );
        
       // System.debug(wrapper);
        System.debug(assessmentResponse);
        System.debug(assessment);
        System.debug(emptyAssessment);
        System.debug(parentResponse);
        System.debug(nullParent);
        System.debug(safeValue);
        System.debug(normalValue);
        System.debug(found);
        System.debug(notFound);

        // Exercise the no-investigation branch.
        Incident_Register_Response__c responseWithoutInvestigation =
            new Incident_Register_Response__c(
                Name__c = 'Response Without Investigation',
                Status__c = 'Open',
                Severity__c = 'Low',
                NDIS_Reportable__c = 'No',
                Next_Due__c = Date.today().addDays(10)
            );
        insert responseWithoutInvestigation;

              /*  IncidentInvestigationController.InvestigationWrapper emptyWrapper =
            IncidentInvestigationController.getInvestigationData(
                responseWithoutInvestigation.Id
            ); 
        
        System.debug(emptyWrapper); */
    }

    @IsTest
    static void testAssessmentSaveAndStartAssessment() {
        Incident_Register_Response__c response = [
            SELECT Id
            FROM Incident_Register_Response__c
            LIMIT 1
        ];
        Incident_Investigation__c investigation = [
            SELECT Id, Incident_Response__c, Assigned_Investigator__c
            FROM Incident_Investigation__c
            LIMIT 1
        ];
        Staff__c staff = [
            SELECT Id
            FROM Staff__c
            LIMIT 1
        ];

        Incident_Investigation__c assessmentToSave =
            new Incident_Investigation__c(
                Id = investigation.Id,
                Assessment_Notes__c = 'Updated assessment',
                Findings_Summary__c = 'Updated findings',
                Status__c = 'In Progress',
                NDIS_Reportable__c = 'No',
                Assigned_Investigator__c = staff.Id,
                Severity__c = 'High'
            );

           
        
        Map<String, Object> saveData = new Map<String, Object>{
            'Id' => investigation.Id,
            'NDIS_Reportable__c' => 'Yes',
            'Assessment_Notes__c' => 'Final assessment',
            'Findings_Summary__c' => 'Final findings',
            'Status__c' => 'Resolved',
            'Assigned_Investigator__c' => String.valueOf(staff.Id),
            'Severity__c' => 'High',
            'Final_Notes__c' => 'Resolution notes',
            'acknowledged' => true
        };

                try {
            Id savedId =
                IncidentInvestigationController.saveInvestigation(saveData);
            System.debug(savedId);
        } catch (Exception e) {
            System.debug('saveInvestigation: ' + e.getMessage());
        }
        
        // Exercise the invalid-input branch.
                try {
            IncidentInvestigationController.saveInvestigation(null);
        } catch (Exception e) {
            System.debug('Expected saveInvestigation exception: ' + e.getMessage());
        }
        
        // Exercise startAssessment through the controller. The response already
        // has an investigation, so the service may reject it; the controller
        // catch path is intentionally exercised if that happens.
                try {
            Incident_Investigation__c started =
                IncidentInvestigationController.startAssessment(
                    response.Id,
                    staff.Id
                );
            System.debug(started);
        } catch (Exception e) {
            System.debug('startAssessment: ' + e.getMessage());
        }
            }

    @IsTest
    static void testCorrectiveActionCreateUpdateAndAttachments() {
        Incident_Investigation__c investigation = [
            SELECT Id, Incident_Response__c
            FROM Incident_Investigation__c
            LIMIT 1
        ];
        Staff__c staff = [
            SELECT Id
            FROM Staff__c
            LIMIT 1
        ];

        Map<String, Object> newActionData = new Map<String, Object>{
            'Incident_Investigation__c' => String.valueOf(investigation.Id),
            'Action_Title__c' => 'Coverage Action',
            'Description__c' => 'Coverage action description',
            'Assigned_Owner__c' => String.valueOf(staff.Id),
            'Due_Date__c' => String.valueOf(Date.today().addDays(2)),
            'Status__c' => 'Open'
        };

        Id actionId;
                try {
            actionId =
                IncidentInvestigationController.saveCorrectiveAction(
                    newActionData
                );
        } catch (Exception e) {
            System.debug('new saveCorrectiveAction: ' + e.getMessage());
        }
        
        if (actionId == null) {
            actionId = [
                SELECT Id
                FROM Incident_Corrective_Action__c
                LIMIT 1
            ].Id;
        }

        Map<String, Object> updateActionData = new Map<String, Object>{
            'Id' => String.valueOf(actionId),
            'Action_Title__c' => 'Updated Coverage Action',
            'Description__c' => 'Updated description',
            'Assigned_Owner__c' => String.valueOf(staff.Id),
            'Due_Date__c' => String.valueOf(Date.today().addDays(-1)),
            'Status__c' => 'In Progress'
        };

                try {
            Id updatedActionId =
                IncidentInvestigationController.saveCorrectiveAction(
                    updateActionData
                );
            System.debug(updatedActionId);
        } catch (Exception e) {
            System.debug('update saveCorrectiveAction: ' + e.getMessage());
        }
        
        List<Object> attachments = new List<Object>{
            new Map<String, Object>{
                'Attachment_Name__c' => 'Coverage Evidence',
                'File_Name__c' => 'coverage.pdf',
                'Type__c' => 'PDF',
                'Uploaded_By__c' => String.valueOf(staff.Id),
                'AWS_File_Key__c' => 'coverage/key',
                'AWS_File_URL__c' => 'https://example.com/coverage.pdf',
                'Evidence_Type__c' => 'Incident Evidence'
            }
        };

                try {
            List<Incident_Evidence__c> savedEvidence =
                IncidentInvestigationController.saveIncidentEvidence(
                    attachments
                );
            System.debug(savedEvidence);
        } catch (Exception e) {
            System.debug('saveIncidentEvidence: ' + e.getMessage());
        }
        
                try {
            List<Incident_Evidence__c> actionAttachments =
                IncidentInvestigationController.getCorrectiveActionAttachments(
                    actionId
                );
            System.debug(actionAttachments);

            List<Incident_Evidence__c> nullAttachments =
                IncidentInvestigationController.getCorrectiveActionAttachments(
                    null
                );
            System.debug(nullAttachments);
        } catch (Exception e) {
            System.debug('getCorrectiveActionAttachments: ' + e.getMessage());
        }
            }

    @IsTest
    static void testUpdateCorrectiveActionCompletion() {
        Incident_Corrective_Action__c action = [
            SELECT Id, Incident_Investigation__c, Status__c
            FROM Incident_Corrective_Action__c
            LIMIT 1
        ];
        Staff__c staff = [
            SELECT Id
            FROM Staff__c
            LIMIT 1
        ];

        List<Object> attachments = new List<Object>{
            new Map<String, Object>{
                'Attachment_Name__c' => 'Completion Evidence',
                'File_Name__c' => 'completion.pdf',
                'Type__c' => 'PDF',
                'Uploaded_By__c' => String.valueOf(staff.Id),
                'AWS_File_Key__c' => 'completion/key',
                'AWS_File_URL__c' => 'https://example.com/completion.pdf',
                'Evidence_Type__c' => 'Incident Evidence'
            }
        };

                try {
            IncidentInvestigationController.updateCorrectiveAction(
                action.Id,
                'Completed',
                'Completed notes',
                'Completed description',
                attachments
            );
        } catch (Exception e) {
            System.debug('updateCorrectiveAction complete: ' + e.getMessage());
        }
        
                try {
            IncidentInvestigationController.updateCorrectiveAction(
                action.Id,
                'Completed',
                'Updated completed notes',
                'Updated completed description',
                null
            );
        } catch (Exception e) {
            System.debug('updateCorrectiveAction second update: ' + e.getMessage());
        }
        
              
    }

    @IsTest
    static void testNdisSubmissionAndEvidenceDelete() {
        Incident_Investigation__c investigation = [
            SELECT Id
            FROM Incident_Investigation__c
            LIMIT 1
        ];
        Staff__c staff = [
            SELECT Id
            FROM Staff__c
            LIMIT 1
        ];

        Map<String, Object> initialSubmission = new Map<String, Object>{
            'investigationId' => investigation.Id,
            'submissionType' => 'Initial Notification',
            'submittedById' => staff.Id,
            'submissionDate' => String.valueOf(Date.today()),
            'submissionTime' => '10:30:15.000Z',
            'referenceNumber' => 'COVERAGE-INITIAL',
            'summaryNotes' => 'Initial coverage submission',
            'ndisReportable' => 'Yes',
            'attachments' => new List<Object>{
                new Map<String, Object>{
                    'Attachment_Name__c' => 'NDIS Initial Evidence',
                    'File_Name__c' => 'initial.pdf',
                    'Type__c' => 'PDF',
                    'Uploaded_By__c' => String.valueOf(staff.Id),
                    'AWS_File_Key__c' => 'ndis/initial',
                    'AWS_File_URL__c' => 'https://example.com/initial.pdf',
                    'Evidence_Type__c' => 'Incident Evidence'
                }
            }
        };

                try {
            IncidentInvestigationController.saveNdisSubmission(
                initialSubmission
            );
        } catch (Exception e) {
            System.debug('Initial NDIS submission: ' + e.getMessage());
        }
        
        Map<String, Object> fiveDaySubmission = new Map<String, Object>{
            'investigationId' => investigation.Id,
            'submissionType' => '5-Day Report',
            'submittedById' => staff.Id,
            'submissionDate' => String.valueOf(Date.today()),
            'submissionTime' => '11:45',
            'referenceNumber' => 'COVERAGE-5DAY',
            'summaryNotes' => 'Five day coverage submission',
            'ndisReportable' => 'Yes'
        };

                try {
            IncidentInvestigationController.saveNdisSubmission(
                fiveDaySubmission
            );
        } catch (Exception e) {
            System.debug('5-Day NDIS submission: ' + e.getMessage());
        }
        
        // Invalid time exercises parseTimeString's validation/catch path.
        Map<String, Object> invalidTimeSubmission = new Map<String, Object>{
            'investigationId' => investigation.Id,
            'submissionType' => 'Initial Notification',
            'submittedById' => staff.Id,
            'submissionDate' => String.valueOf(Date.today()),
            'submissionTime' => 'invalid',
            'referenceNumber' => 'INVALID-TIME',
            'summaryNotes' => 'Invalid time coverage path',
            'ndisReportable' => 'No'
        };

                try {
            IncidentInvestigationController.saveNdisSubmission(
                invalidTimeSubmission
            );
        } catch (Exception e) {
            System.debug('Expected invalid time exception: ' + e.getMessage());
        }
        
        Incident_Evidence__c evidence = [
            SELECT Id, Evidence_Type__c
            FROM Incident_Evidence__c
            LIMIT 1
        ];

                try {
            IncidentInvestigationController.deleteIncidentEvidence(
                evidence.Id,
                evidence.Evidence_Type__c
            );
        } catch (Exception e) {
            System.debug('deleteIncidentEvidence: ' + e.getMessage());
        }
        
                try {
            IncidentInvestigationController.saveIncidentEvidence(null);
        } catch (Exception e) {
            System.debug('Expected empty attachment exception: ' + e.getMessage());
        }
            }

    @IsTest
    static void testActionRegisterAllFilters() {
        User u = [
            SELECT Id
            FROM User
            WHERE Email = 'manualtesting.612233142@hotmail.com'
            LIMIT 1
        ];

        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            WHERE Name = 'Ashfield Consultants12'
            LIMIT 1
        ];

        Facility__c facility = [
            SELECT Id
            FROM Facility__c
            WHERE Name = 'Ashfield Consultants'
            LIMIT 1
        ];

        System.runAs(u) {
            
            IncidentInvestigationController.ActionRegisterWrapper allActions =
                IncidentInvestigationController.getActionRegisterData(
                    null,
                    null,
                    null
                );
            IncidentInvestigationController.ActionRegisterWrapper openActions =
                IncidentInvestigationController.getActionRegisterData(
                    'Open',
                    org.Id,
                    facility.Id
                );
            IncidentInvestigationController.ActionRegisterWrapper progressActions =
                IncidentInvestigationController.getActionRegisterData(
                    'In Progress',
                    org.Id,
                    facility.Id
                );
            IncidentInvestigationController.ActionRegisterWrapper completedActions =
                IncidentInvestigationController.getActionRegisterData(
                    'Completed',
                    org.Id,
                    facility.Id
                );
            IncidentInvestigationController.ActionRegisterWrapper overdueActions =
                IncidentInvestigationController.getActionRegisterData(
                    'Overdue',
                    org.Id,
                    facility.Id
                );
            IncidentInvestigationController.ActionRegisterWrapper weekActions =
                IncidentInvestigationController.getActionRegisterData(
                    'Due This Week',
                    org.Id,
                    facility.Id
                );

            
            System.debug(allActions);
            System.debug(openActions);
            System.debug(progressActions);
            System.debug(completedActions);
            System.debug(overdueActions);
            System.debug(weekActions);
        }
    }

    @IsTest
    static void testLoggedInStaffAndNotifications() {
        User u = [
            SELECT Id
            FROM User
            WHERE Email = 'manualtesting.612233142@hotmail.com'
            LIMIT 1
        ];

        Incident_Register_Response__c response = [
            SELECT Id, Facility__c
            FROM Incident_Register_Response__c
            LIMIT 1
        ];

        Staff__c staff = [
            SELECT Id
            FROM Staff__c
            LIMIT 1
        ];

        System.runAs(u) {
            
            Map<String, String> staffDetails =
                IncidentInvestigationController.getLoggedInStaffDetails();

            // Empty-recipient branches.
            IncidentInvestigationController.createAssignmentNotification(
                response.Id,
                null
            );
            IncidentInvestigationController.createCorrectiveActionNotification(
                response.Id,
                null,
                'No Owner Action',
                null
            );

            // Valid-recipient branches.
            IncidentInvestigationController.createAssignmentNotification(
                response.Id,
                String.valueOf(staff.Id)
            );
            IncidentInvestigationController.createCorrectiveActionNotification(
                response.Id,
                String.valueOf(staff.Id),
                'Normal Due Action',
                Date.today().addDays(3)
            );
            IncidentInvestigationController.createCorrectiveActionNotification(
                response.Id,
                String.valueOf(staff.Id),
                'Overdue Action',
                Date.today().addDays(-3)
            );

            
            System.debug(staffDetails);
        }
    }

    @IsTest
    static void testHistoryLogHelpers() {
        Incident_Register_Response__c response = [
            SELECT Id, History_Log__c
            FROM Incident_Register_Response__c
            LIMIT 1
        ];

                IncidentInvestigationController.appendHistoryLog(
            response.Id,
            'Coverage Test',
            'Coverage history entry'
        );
        IncidentInvestigationController.appendHistoryLog(
            null,
            'Ignored',
            'Ignored because response is null'
        );
        IncidentInvestigationController.appendHistoryLog(
            response.Id,
            'Ignored',
            ''
        );
        
        Incident_Register_Response__c refreshed = [
            SELECT Id, History_Log__c
            FROM Incident_Register_Response__c
            WHERE Id = :response.Id
            LIMIT 1
        ];

        if (String.isNotBlank(refreshed.History_Log__c)) {
            List<Object> entries =
                (List<Object>) JSON.deserializeUntyped(
                    refreshed.History_Log__c
                );
            Boolean hasCoverageEntry =
                IncidentInvestigationController.hasEntryWithAction(
                    entries,
                    'Coverage Test'
                );
            System.debug(hasCoverageEntry);
        }
    }

    @IsTest
    static void testInvalidControllerInputs() {
        
        try {
            IncidentInvestigationController.getIncidentResponseForAssessment(null);
        } catch (Exception e) {
            System.debug('Expected response exception: ' + e.getMessage());
        }

        try {
            IncidentInvestigationController.getCorrectiveActionAttachments(null);
        } catch (Exception e) {
            System.debug('Unexpected attachment exception: ' + e.getMessage());
        }

        try {
            IncidentInvestigationController.deleteIncidentEvidence(
                null,
                'Incident Evidence'
            );
        } catch (Exception e) {
            System.debug('Expected delete exception: ' + e.getMessage());
        }

        try {
            IncidentInvestigationController.saveCorrectiveAction(null);
        } catch (Exception e) {
            System.debug('Expected action exception: ' + e.getMessage());
        }

        try {
            IncidentInvestigationController.saveNdisSubmission(
                new Map<String, Object>()
            );
        } catch (Exception e) {
            System.debug('Expected submission exception: ' + e.getMessage());
        }

            }

@IsTest
static void testServiceStartInvestigation_NewInvestigation() {
    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
    Incident_Register_Response__c response = new Incident_Register_Response__c(Name__c = 'Service New Investigation', Status__c = 'Open', Severity__c = 'High', NDIS_Reportable__c = 'No', Next_Due__c = Date.today().addDays(5));
    insert response;
    Test.startTest();
    Incident_Investigation__c investigation = IncidentInvestigationService.startInvestigation(response.Id, staff.Id);
    Test.stopTest();
    System.debug('New investigation: ' + investigation);
}

@IsTest
static void testServiceStartInvestigation_Existing() {
    Incident_Investigation__c investigation = [SELECT Id, Incident_Response__c, Assigned_Investigator__c FROM Incident_Investigation__c LIMIT 1];
    Test.startTest();
    Incident_Investigation__c result = IncidentInvestigationService.startInvestigation(investigation.Incident_Response__c, investigation.Assigned_Investigator__c);
    Test.stopTest();
    System.debug('Existing investigation: ' + result);
}

@IsTest
static void testServiceSaveAssessment() {
    Incident_Investigation__c existing = [SELECT Id, Incident_Response__c, Assigned_Investigator__c, Severity__c, Status__c, NDIS_Reportable__c FROM Incident_Investigation__c LIMIT 1];
    Incident_Investigation__c updated = new Incident_Investigation__c(Id = existing.Id, Severity__c = existing.Severity__c, Status__c = 'In Progress', Assigned_Investigator__c = existing.Assigned_Investigator__c, NDIS_Reportable__c = existing.NDIS_Reportable__c, Assessment_Notes__c = 'Service coverage assessment', Findings_Summary__c = 'Service coverage findings', Root_Cause__c = 'Service coverage root cause', Final_Notes__c = 'Service coverage final notes');
    Test.startTest();
    try {
        IncidentInvestigationService.saveAssessment(updated);
    } catch (Exception e) {
        System.debug('saveAssessment: ' + e.getMessage());
    }
    Test.stopTest();
}

@IsTest
static void testServiceAddCorrectiveAction() {
    Incident_Investigation__c investigation = [SELECT Id FROM Incident_Investigation__c LIMIT 1];
    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
    Incident_Corrective_Action__c action = new Incident_Corrective_Action__c(Incident_Investigation__c = investigation.Id, Action_Title__c = 'Service Coverage Action', Description__c = 'Service coverage action', Assigned_Owner__c = staff.Id, Due_Date__c = Date.today().addDays(5), Status__c = 'Open');
    Test.startTest();
    try {
        Incident_Corrective_Action__c result = IncidentInvestigationService.addCorrectiveAction(action);
        System.debug('Created action: ' + result);
    } catch (Exception e) {
        System.debug('addCorrectiveAction: ' + e.getMessage());
    }
    Test.stopTest();
}

@IsTest
static void testServiceCompleteCorrectiveAction() {
    Incident_Corrective_Action__c action = [SELECT Id, Incident_Investigation__c, Status__c FROM Incident_Corrective_Action__c LIMIT 1];
    Test.startTest();
    try {
        IncidentInvestigationService.completeCorrectiveAction(action.Id, 'Completed by service', 'aws/service/completion');
    } catch (Exception e) {
        System.debug('completeCorrectiveAction: ' + e.getMessage());
    }
    Test.stopTest();
}

@IsTest
static void testServiceRecordNdisSubmission_Initial() {
    Incident_Investigation__c investigation = [SELECT Id FROM Incident_Investigation__c LIMIT 1];
    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
    Incident_NDIS_Submission__c submission = new Incident_NDIS_Submission__c(Incident_Investigation__c = investigation.Id, Submission_Type__c = 'Initial Notification', Submitted_By__c = staff.Id, Submission_Date__c = Date.today(), Submission_Time__c = Time.newInstance(10, 30, 0, 0), Reference_Number__c = 'SERVICE-INITIAL', Summary_Notes__c = 'Initial notification');
    Test.startTest();
    try {
        Incident_NDIS_Submission__c result = IncidentInvestigationService.recordNdisSubmission(submission);
        System.debug('Initial submission: ' + result);
    } catch (Exception e) {
        System.debug('Initial submission: ' + e.getMessage());
    }
    Test.stopTest();
}

@IsTest
static void testServiceRecordNdisSubmission_FiveDay() {
    Incident_Investigation__c investigation = [SELECT Id FROM Incident_Investigation__c LIMIT 1];
    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
    Incident_NDIS_Submission__c submission = new Incident_NDIS_Submission__c(Incident_Investigation__c = investigation.Id, Submission_Type__c = '5-Day Report', Submitted_By__c = staff.Id, Submission_Date__c = Date.today(), Submission_Time__c = Time.newInstance(11, 45, 0, 0), Reference_Number__c = 'SERVICE-5DAY', Summary_Notes__c = 'Five day report');
    Test.startTest();
    try {
        Incident_NDIS_Submission__c result = IncidentInvestigationService.recordNdisSubmission(submission);
        System.debug('Five day submission: ' + result);
    } catch (Exception e) {
        System.debug('Five day submission: ' + e.getMessage());
    }
    Test.stopTest();
}

@IsTest
static void testServiceRollupOpenCorrectiveActions() {
    Incident_Investigation__c investigation = [SELECT Id FROM Incident_Investigation__c LIMIT 1];
    Set<Id> investigationIds = new Set<Id>{ investigation.Id };
    Test.startTest();
    try {
        IncidentInvestigationService.rollupOpenCorrectiveActions(investigationIds);
    } catch (Exception e) {
        System.debug('rollupOpenCorrectiveActions: ' + e.getMessage());
    }
    Test.stopTest();
}

@IsTest
static void testServiceRollupEmptySet() {
    Test.startTest();
    IncidentInvestigationService.rollupOpenCorrectiveActions(new Set<Id>());
    Test.stopTest();
    System.debug('Empty rollup branch executed');
}

@IsTest
static void testServiceRollupNull() {
    Test.startTest();
    IncidentInvestigationService.rollupOpenCorrectiveActions(null);
    Test.stopTest();
    System.debug('Null rollup branch executed');
}

@IsTest
static void testServiceValidateResolution_NotResolved() {
    Incident_Investigation__c investigation = [SELECT Id, Status__c, NDIS_Reportable__c, Final_Notes__c FROM Incident_Investigation__c LIMIT 1];
    Test.startTest();
    IncidentInvestigationService.validateResolution(new List<Incident_Investigation__c>{ investigation });
    Test.stopTest();
    System.debug('Non-resolved validation executed');
}

@IsTest
static void testServiceValidateResolution_Empty() {
    Test.startTest();
    IncidentInvestigationService.validateResolution(new List<Incident_Investigation__c>());
    Test.stopTest();
    System.debug('Empty validation executed');
}

@IsTest
static void testServiceValidateResolution_NullList() {
    Test.startTest();
    try {
        IncidentInvestigationService.validateResolution(null);
    } catch (Exception e) {
        System.debug('Null validation: ' + e.getMessage());
    }
    Test.stopTest();
}

@IsTest
static void testServiceCompleteCorrectiveActionAgain() {
    Incident_Corrective_Action__c action = [SELECT Id, Status__c FROM Incident_Corrective_Action__c LIMIT 1];
    Test.startTest();
    try {
        IncidentInvestigationService.completeCorrectiveAction(action.Id, null, null);
    } catch (Exception e) {
        System.debug('Second corrective action completion: ' + e.getMessage());
    }
    Test.stopTest();
}

private class IncidentBatchMockHttp implements HttpCalloutMock {
    private Integer status;
    private String body;
    public IncidentBatchMockHttp(Integer status, String body) {
        this.status = status;
        this.body = body;
    }
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setStatusCode(status);
        res.setBody(body);
        return res;
    }
}

private static String buildBody(String participantValue, String priorityValue) {
    return '[{"cells":[{"field":{"label":"Participant","value":"' + participantValue + '"}}]},'
         + '{"cells":[{"field":{"label":"Priority","value":"' + priorityValue + '"}}]}]';
}

// Happy path: participant + severity extracted, valid participant, update runs
@IsTest
static void testBatch_HappyPath() {
    Client__c cli = [SELECT Id FROM Client__c LIMIT 1];
    Incident_Register_Response__c resp = new Incident_Register_Response__c(
        Name__c = 'Batch Happy', Status__c = 'Open', NDIS_Reportable__c = 'No',
        Response_JSON__c = '{"url":"https://example.com/r.json"}'
    );
    insert resp;

    Test.setMock(HttpCalloutMock.class,
        new IncidentBatchMockHttp(200, buildBody(String.valueOf(cli.Id), 'High')));

    Test.startTest();
    Database.executeBatch(new IncicidentExistingRecordBatch(false), 200);
    Test.stopTest();

    System.debug([SELECT Participant__c, Severity__c
                  FROM Incident_Register_Response__c WHERE Id = :resp.Id]);
}

// Dry run WITH staged data — hits dryRun debug loop (old dry-run test staged nothing)
@IsTest
static void testBatch_DryRunWithData() {
    Client__c cli = [SELECT Id FROM Client__c LIMIT 1];
    Incident_Register_Response__c resp = new Incident_Register_Response__c(
        Name__c = 'Batch Dry', Status__c = 'Open', NDIS_Reportable__c = 'No',
        Response_JSON__c = '{"url":"https://example.com/r.json"}'
    );
    insert resp;

    Test.setMock(HttpCalloutMock.class,
        new IncidentBatchMockHttp(200, buildBody(String.valueOf(cli.Id), 'High')));

    Test.startTest();
    Database.executeBatch(new IncicidentExistingRecordBatch(true), 200);
    Test.stopTest();
}

// Callout != 200 — hits "Callout failed" continue
@IsTest
static void testBatch_CalloutFailure() {
    Incident_Register_Response__c resp = new Incident_Register_Response__c(
        Name__c = 'Batch 500', Status__c = 'Open', NDIS_Reportable__c = 'No',
        Response_JSON__c = '{"url":"https://example.com/r.json"}'
    );
    insert resp;

    Test.setMock(HttpCalloutMock.class, new IncidentBatchMockHttp(500, 'error'));

    Test.startTest();
    Database.executeBatch(new IncicidentExistingRecordBatch(false), 200);
    Test.stopTest();
}

// JSON edge cases — no url (blank continue) + non-map array (instanceof continue)
@IsTest
static void testBatch_JsonEdgeCases() {
    insert new Incident_Register_Response__c(
        Name__c = 'NoUrl', Status__c = 'Open', NDIS_Reportable__c = 'No',
        Response_JSON__c = '{"foo":"bar"}');
    insert new Incident_Register_Response__c(
        Name__c = 'NotMap', Status__c = 'Open', NDIS_Reportable__c = 'No',
        Response_JSON__c = '["x","y"]');

    Test.setMock(HttpCalloutMock.class, new IncidentBatchMockHttp(200, '[]'));

    Test.startTest();
    Database.executeBatch(new IncicidentExistingRecordBatch(false), 200);
    Test.stopTest();
}

// Bad participant format — length check fails, severity still updates
@IsTest
static void testBatch_InvalidParticipantId() {
    Incident_Register_Response__c resp = new Incident_Register_Response__c(
        Name__c = 'BadPid', Status__c = 'Open', NDIS_Reportable__c = 'No',
        Response_JSON__c = '{"url":"https://example.com/r.json"}'
    );
    insert resp;

    Test.setMock(HttpCalloutMock.class,
        new IncidentBatchMockHttp(200, buildBody('not-an-id', 'Medium')));

    Test.startTest();
    Database.executeBatch(new IncicidentExistingRecordBatch(false), 200);
    Test.stopTest();
}

// Valid-format Id that does NOT exist in Client__c — hits SKIPPED branch
@IsTest
static void testBatch_NonexistentParticipant() {
    Client__c ghost = [SELECT Id FROM Client__c LIMIT 1];
    Id ghostId = ghost.Id;
    delete ghost;   // id still valid format, but query now returns nothing

    Incident_Register_Response__c resp = new Incident_Register_Response__c(
        Name__c = 'Ghost', Status__c = 'Open', NDIS_Reportable__c = 'No',
        Response_JSON__c = '{"url":"https://example.com/r.json"}'
    );
    insert resp;

    Test.setMock(HttpCalloutMock.class,
        new IncidentBatchMockHttp(200, buildBody(String.valueOf(ghostId), 'Low')));

    Test.startTest();
    Database.executeBatch(new IncicidentExistingRecordBatch(false), 200);
    Test.stopTest();
}
     @IsTest
    static void testCorrectiveActionEmail() {

        Incident_Corrective_Action__c action = [
            SELECT Id, Action_Title__c, Due_Date__c
            FROM Incident_Corrective_Action__c
            LIMIT 1
        ];

        CorrectiveActionEmailNotificationHandler.CorrectiveActionEmailInput input =
            new CorrectiveActionEmailNotificationHandler.CorrectiveActionEmailInput();

        input.CorrectiveActionId = action.Id;
        input.EmailTo = new List<String>{
            'staff@test.com'
        };
        input.StatusLabel = 'due today';
        input.orgName = 'Test Organisation';
        input.orgEmail = 'test@test.com';

        Test.startTest();

        CorrectiveActionEmailNotificationHandler.sendCorrectiveActionEmail(
            new List<CorrectiveActionEmailNotificationHandler.CorrectiveActionEmailInput>{
                input
            }
        );

        Test.stopTest();

    }
     @IsTest
    static void testNdisInitialNotificationEmail() {

        Incident_Investigation__c investigation = [
            SELECT Id
            FROM Incident_Investigation__c
            LIMIT 1
        ];

        NdisSubmissionEmailNotificationHandler.NdisSubmissionEmailInput input =
            new NdisSubmissionEmailNotificationHandler.NdisSubmissionEmailInput();

        input.InvestigationId = investigation.Id;
        input.EmailTo = new List<String>{
            'staff@test.com'
        };
        input.NotificationType = 'Initial Notification';
        input.StatusLabel = 'due';
        input.orgName = 'Test Organisation';
        input.orgEmail = 'test@test.com';

        Test.startTest();

        NdisSubmissionEmailNotificationHandler.sendNdisSubmissionEmail(
            new List<NdisSubmissionEmailNotificationHandler.NdisSubmissionEmailInput>{
                input
            }
        );

        Test.stopTest();

       
    }


}