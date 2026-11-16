@IsTest
public class WyzedCourseProgressBatchTest {

    class MockWyzedBatchResponse
        implements HttpCalloutMock {

        public HTTPResponse respond(
            HTTPRequest req
        ) {

            HttpResponse res =
                new HttpResponse();

            String endpoint =
                req.getEndpoint();

            res.setStatusCode(200);

            if (
                endpoint.contains(
                    '/enrolments/?user_id='
                )
            ) {

                res.setBody(
                    '{"enrolments":[{"course_key":{"id":101,"user_id":999},"metadata":{"is_overdue":false},"created_at":"2026-01-01"}],"more":false,"next_cursor":null}'
                );

            } else if (
                endpoint.contains(
                    '/course_progress/batch/read'
                )
            ) {

                res.setBody(
                    '{"course_progresses":[{"course_key":{"id":101,"user_id":999},"activity_progress":{"completed":2,"total":5},"is_completed":false,"is_graded":true}]}'
                );

            } else if (
                endpoint.contains('/courses/')
            ) {

                res.setBody(
                    '{"courses":[{"id":101,"name":"LWC Training","permalink":"test-course","is_published":true,"is_archived":false}]}'
                );

            } else if (
                endpoint.contains(
                    '/enrolments/batch/create'
                )
            ) {

                res.setBody(
                    '{"success":true}'
                );

            } else {

                res.setBody('{}');
            }

            return res;
        }
    }

    @TestSetup
    static void setupData() {

        TestDataFactory.createBaseData();

        Staff__c st =
            [SELECT Id
             FROM Staff__c
             LIMIT 1];

        st.Wyzed_User_Id__c =
            '5098125745979392';

        st.Wyzed_Learner__c = true;

        update st;

        Organisation__c org =
            [SELECT Id
             FROM Organisation__c
             LIMIT 1];

        org.Wyzed_Tenant_ID__c =
            '123';

        org.Wyzed_Client_ID__c =
            'client';

        org.Wyzed_Client_Secret__c =
            'secret';

        update org;
    }

    @IsTest
    static void testGetUserCoursesWithProgress() {

        User u =
            [SELECT Id
             FROM User
             WHERE
                Organization_Name__c =
                    'Ashfield Consultants'
             LIMIT 1];

        Test.setMock(
            HttpCalloutMock.class,
            new MockWyzedBatchResponse()
        );

        System.runAs(u) {

            Test.startTest();

            WyzedCourseProgressBatch.getUserCoursesWithProgress(
                    '5098125745979392'
                );

            Test.stopTest();
        }
    }

    @IsTest
    static void testGetCourseProgressBatch() {

        User u =
            [SELECT Id
             FROM User
             WHERE
                Organization_Name__c =
                    'Ashfield Consultants'
             LIMIT 1];

        Test.setMock(
            HttpCalloutMock.class,
            new MockWyzedBatchResponse()
        );

        List<Map<String, Object>> keys =
            new List<Map<String, Object>>();

        keys.add(
            new Map<String, Object>{
                'course_key' =>
                    new Map<String, Object>{
                        'id' => 101,
                        'user_id' => 999
                    },
                'user_id' => 1
            }
        );

        System.runAs(u) {

            Test.startTest();

            WyzedCourseProgressBatch.getCourseProgressBatch(
                    '123',
                    keys
                );

            Test.stopTest();
        }
    }

    @IsTest
    static void testGetCourseDetailsBatch() {

        User u =
            [SELECT Id
             FROM User
             WHERE
                Organization_Name__c =
                    'Ashfield Consultants'
             LIMIT 1];

        Test.setMock(
            HttpCalloutMock.class,
            new MockWyzedBatchResponse()
        );

        List<Map<String, Object>> keys =
            new List<Map<String, Object>>();

        keys.add(
            new Map<String, Object>{
                'course_key' =>
                    new Map<String, Object>{
                        'id' => 101,
                        'user_id' => 999
                    },
                'user_id' => 1
            }
        );

        System.runAs(u) {

            Test.startTest();

            WyzedCourseProgressBatch.getCourseDetailsBatch(
                    '123',
                    keys
                );

            Test.stopTest();
        }
    }

    @IsTest
    static void testGetUserCoursesWithProgressJSON() {

        User u =
            [SELECT Id
             FROM User
             WHERE
                Organization_Name__c =
                    'Ashfield Consultants'
             LIMIT 1];

        Test.setMock(
            HttpCalloutMock.class,
            new MockWyzedBatchResponse()
        );

        System.runAs(u) {

            Test.startTest();

            WyzedCourseProgressBatch.getUserCoursesWithProgressJSON();

            Test.stopTest();
        }
    }

    @IsTest
    static void testAssignSingleCourseToMultipleUsers() {

        User u =
            [SELECT Id
             FROM User
             WHERE
                Organization_Name__c =
                    'Ashfield Consultants'
             LIMIT 1];

        Test.setMock(
            HttpCalloutMock.class,
            new MockWyzedBatchResponse()
        );

        System.runAs(u) {

            Test.startTest();

            WyzedCourseProgressBatch.assignSingleCourseToMultipleUsers(
                    '101',
                    '999',
                    new List<String>{
                        '111',
                        '222'
                    }
                );

            Test.stopTest();
        }
    }

    @IsTest
    static void testGetStaffByFacilityAndRoles() {

        Facility__c fac =
            [SELECT Id
             FROM Facility__c
             LIMIT 1];

        Staff__c st =
            [SELECT Id
             FROM Staff__c
             LIMIT 1];

        StaffRole__c role =
            new StaffRole__c(
                StaffRole_To_Staff__c =
                    st.Id,
                Facility__c = fac.Id,
                RoleName__c = 'Admin',
                Active__c = true
            );

        insert role;

        Test.startTest();

        WyzedCourseProgressBatch.getStaffByFacilityAndRoles(
                new List<String>{
                    'Admin|' + fac.Id
                }
            );

        Test.stopTest();
    }
}