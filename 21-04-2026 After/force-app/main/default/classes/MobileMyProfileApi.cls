@RestResource(urlMapping='/getLoggedinStaffDetails/*')
global with sharing class MobileMyProfileApi {

    @HttpGet
    global static StaffWrapper getStaffbyEmailId() {

        StaffWrapper staff = new StaffWrapper();
        staff.message = 'failure';

        try {
            String userEmail = UserInfo.getUserEmail();

            SObjectAccessDecision decision = Security.stripInaccessible(
                AccessType.READABLE,
                StaffController.getStaffByEmail(userEmail)
            );

            List<Staff__c> staffList =
                (List<Staff__c>) decision.getRecords();

            if (staffList.isEmpty()) {
                return staff;
            }

            Staff__c s = staffList[0];

            /* -----------------------------------------
             * BASIC STAFF DETAILS
             * ----------------------------------------- */
            staff.email        = s.Email_Address__c;
            staff.phone        = s.Contact_Number__c;
            staff.staffId      = s.Id;
            staff.state        = s.State__c;
            staff.typeOfUser   = s.Type_of_User__c;
            staff.typeOfEmployee = s.Type_of_Employe__c;
            staff.geoLocation  = s.Enable_Geolocation__c;
            staff.facilityId  = s.Facility__c;
            staff.managerName = s.Facility__r.Manager_Name__c;

            /* -----------------------------------------
             * ORG / FACILITY RULES
             * ----------------------------------------- */
            staff.negativeBalance =
                s.Facility__r.Organisation__r.Negative_Balance__c;

            staff.otherLeaveType =
                s.Facility__r.Organisation__r.Other_Leave_Type__c;

            /* -----------------------------------------
             * ACCRUED LEAVE
             * ----------------------------------------- */
            Decimal annualAccrued =
                s.Annual_leave_Accrued__c != null
                    ? s.Annual_leave_Accrued__c : 0;

            Decimal personalAccrued =
                s.Personal_Leave_Accur__c != null
                    ? s.Personal_Leave_Accur__c : 0;

            staff.annualAccrued   = annualAccrued;
            staff.personalAccrued = personalAccrued;

            /* -----------------------------------------
             * USED LEAVE (Leaves__r)
             * ----------------------------------------- */
            Decimal annualUsed = 0;
            Decimal personalUsed = 0;
            SYSTEM.DEBUG('s.Leaves__r ==>'+s.Leaves__r);

            if (s.Leaves__r != null) {
                for (Leave__c l : s.Leaves__r) {
                    annualUsed   += l.Annual_Used__c   != null ? l.Annual_Used__c   : 0;
                    personalUsed += l.Personal_Used__c != null ? l.Personal_Used__c : 0;
                }
            }

            staff.annualUsed   = annualUsed;
            staff.personalUsed = personalUsed;

            /* -----------------------------------------
             * REMAINING LEAVE (same as LWC)
             * ----------------------------------------- */
            staff.annualRemaining =
                (annualAccrued - annualUsed).setScale(2);

            staff.personalRemaining =
                (personalAccrued - personalUsed).setScale(2);
            
            staff.electricCostPerKm = s.Facility__r.Organisation__r.Mileage_Amount__c;
            staff.fuelCostPerKm = s.Facility__r.Organisation__r.Cost_per_Km_Electric__c;
            staff.activityTransportMaxKms = s.Facility__r.Organisation__r.Activity_Transport_Max_Kms__c;
            staff.providerTravelMaxMinutes = s.Facility__r.Organisation__r.Provider_Travel_Max_Minutes__c;
            staff.providerTravelMaxLimit = s.Facility__r.Organisation__r.Provider_Travel_Max_Kms__c;
            staff.providerTravelDailyLimit = s.Facility__r.Organisation__r.Provider_Travel_Daily_Kms_Limit__c;
            staff.journalRestriction = s.Facility__r.Organisation__r.Journal_Restriction__c;

            /* -----------------------------------------
             * SUCCESS FLAG
             * ----------------------------------------- */
            staff.message = 'success';

        } catch (Exception e) {
            System.debug('MobileMyProfileApi error: ' + e.getMessage());
            staff.message = 'failure';
        }

        return staff;
    }

    /* =========================================================
     * RESPONSE WRAPPER (mirrors LWC state)
     * ========================================================= */
    global class StaffWrapper {

        global String  email;
        global String  phone;
        global String  staffId;
        global String  state;
        global String  typeOfUser;
        global String  typeOfEmployee;
        global String  facilityId;
        global String  managerName;

        global Boolean geoLocation;
        global Boolean negativeBalance;

        global Boolean  otherLeaveType;

        global Decimal annualAccrued;
        global Decimal personalAccrued;

        global Decimal annualUsed;
        global Decimal personalUsed;

        global Decimal annualRemaining;
        global Decimal personalRemaining;
        global Decimal fuelCostPerKm;
        global Decimal electricCostPerKm;
        global Decimal providerTravelDailyLimit;
        global Decimal providerTravelMaxLimit;
        global Decimal providerTravelMaxMinutes;
        global Decimal activityTransportMaxKms;
        global Boolean journalRestriction;

        global String  message;
    }
}