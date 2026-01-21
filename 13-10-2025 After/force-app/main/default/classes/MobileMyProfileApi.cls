/*Test class:MobileAppSignRestResourceTest*/
@RestResource(urlMapping='/getLoggedinStaffDetails/*')
global class MobileMyProfileApi {
     @HttpGet
    global static Staffwrapper getStaffbyEmailId() {
        // Initialize the wrapper with default empty values
        Staffwrapper staff = new Staffwrapper();
        staff.email ='';
        staff.phone ='';
        staff.annualLeave = 0;
        staff.sickLeave = 0;
        staff.parentalLeave = 0;
        staff.otherLeave = 0;
        staff.StaffId ='';
        staff.message = 'failure'; // Default to failure
        staff.geoLocation=false;
        staff.managerName='';
        staff.facilityId='';

        try {
            String UserEmail = UserInfo.getUserEmail();
            SObjectAccessDecision decision = Security.stripInaccessible(
                AccessType.READABLE,
                StaffController.getStaffByEmail(UserEmail)
            );
            List<Staff__c> staffDetails = (List<Staff__c>) decision.getRecords();

            // Check if records are retrieved
            if (!staffDetails.isEmpty()) {
                staff.email = staffDetails[0].Email_Address__c;
                staff.phone = staffDetails[0].Contact_Number__c;
                staff.annualLeave = staffDetails[0].Annual_Leave__c;
                staff.sickLeave = staffDetails[0].Sick_Leave__c;
                staff.parentalLeave = staffDetails[0].Parental_Leave__c;
                staff.otherLeave = staffDetails[0].Bereavement_Leave__c;
                staff.StaffId = staffDetails[0].Id;
                staff.geoLocation=staffDetails[0].Enable_Geolocation__c;
                staff.managerName=staffDetails[0].Facility__r.Manager_Name__c;
                staff.message = 'success'; // Set to success if no errors occur
                staff.facilityId=staffDetails[0].Facility__c;
            }
        } catch (Exception e) {
            // Log the exception to debug logs
            System.debug('Error in getStaffbyEmailId: ' + e.getMessage());
            staff.message = 'failure'; // Retain failure message in case of an exception
        }

        return staff;
    }

    global class Staffwrapper {
        global string email;
        global string phone;
        global decimal annualLeave;
        global decimal sickLeave;
        global decimal parentalLeave;
        global decimal otherLeave;
        global string  StaffId;
        global string message; // New field to indicate success or failure
        global boolean geoLocation;
        global string managerName;
        global string facilityId;
    }
}