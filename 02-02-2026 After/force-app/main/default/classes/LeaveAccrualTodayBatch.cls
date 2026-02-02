public with sharing class LeaveAccrualTodayBatch
    implements Database.Batchable<SObject>, Database.Stateful {

    public Database.QueryLocator start(Database.BatchableContext bc) {

        return Database.getQueryLocator([
            SELECT Id,
                   (SELECT Id, Actual_Duration__c FROM ShiftwithStaffs__r)
            FROM Staff__c
             WHERE Status__c = true AND ( Type_of_Employe__c = 'Full Time Permanent' OR Type_of_Employe__c = 'Part Time Permanent')
        ]);
    }

    public void execute(Database.BatchableContext bc, List<Staff__c> staffList) {

        List<Staff__c> updates = new List<Staff__c>();

        // AU NES accrual % based on hours worked
        Decimal ANNUAL_RATE = 0.076923;  // 7.6923%
        Decimal SICK_RATE   = 0.038462;  // 3.8462%

        for (Staff__c staff : staffList) {

            Decimal totalHours = 0;

            // Loop through child shifts and sum Duration__c
            for (ShiftwithStaff__c shiftRec : staff.ShiftwithStaffs__r) {
                if (shiftRec.Actual_Duration__c != null) {
                    totalHours += shiftRec.Actual_Duration__c;
                }
            }

            // Calculate leave entitlement
            Decimal annualLeave = totalHours * ANNUAL_RATE;
            Decimal sickLeave   = totalHours * SICK_RATE;

            staff.Annual_Leave_Accrued__c = annualLeave.setScale(2);
            staff.Personal_Leave_Accur__c   = sickLeave.setScale(2);

            updates.add(staff);
        }

        if (!updates.isEmpty()) {
            update updates;
        }
    }

    public void finish(Database.BatchableContext bc) {
        System.debug('Leave accrual calculation completed for all staff.');
    }
}