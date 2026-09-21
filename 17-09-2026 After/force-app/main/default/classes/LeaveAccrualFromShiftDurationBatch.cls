/*public with sharing class LeaveAccrualFromShiftDurationBatch
implements Database.Batchable<SObject>, Database.Stateful {

public Database.QueryLocator start(Database.BatchableContext bc) {

return Database.getQueryLocator([
SELECT Id, Employment_type__c,
(SELECT Id, Duration__c FROM ShiftwithStaffs__r)
FROM Staff__c
WHERE Status__c = true
]);
}

public void execute(Database.BatchableContext bc, List<Staff__c> staffList) {

List<Staff__c> updates = new List<Staff__c>();

// Exact NES accrual rates
Decimal ANNUAL_WEEKLY     = 152 / 52;   // 2.923076
Decimal ANNUAL_FORTNIGHT  = 152 / 26;   // 5.846153
Decimal ANNUAL_MONTHLY    = 152 / 12;   // 12.666666

Decimal SICK_WEEKLY       = 76 / 52;    // 1.461538
Decimal SICK_FORTNIGHT    = 76 / 26;    // 2.923076
Decimal SICK_MONTHLY      = 76 / 12;    // 6.333333

for (Staff__c staff : staffList) {

Decimal totalHours = 0;

if (staff.ShiftwithStaffs__r != null) {
for (ShiftwithStaff__c shiftRec : staff.ShiftwithStaffs__r) {
if (shiftRec.Duration__c != null) {
totalHours += shiftRec.Duration__c;
}
}
}

// Skip if no hours
if (totalHours == 0) continue;

Decimal annualLeave = 0;
Decimal sickLeave   = 0;

// Apply frequency logic
if (staff.Employment_type__c == 'Weekly') {
annualLeave = (totalHours/38)*ANNUAL_WEEKLY;
sickLeave   = (totalHours/38)*SICK_WEEKLY;

} else if (staff.Employment_type__c == 'Fortnightly') {
annualLeave = (totalHours/76)*ANNUAL_FORTNIGHT;
sickLeave   = (totalHours/76)*SICK_FORTNIGHT;

} else if (staff.Employment_type__c == 'Monthly') {
annualLeave = (totalHours/152)*ANNUAL_MONTHLY;
sickLeave   = (totalHours/152)*SICK_MONTHLY;

} 

// Assign results
staff.Annual_leave_Accrued__c = annualLeave.setScale(2);
staff.Personal_Leave_Accur__c = sickLeave.setScale(2);

updates.add(staff);
}

if (!updates.isEmpty()) {
update updates;
}
}

public void finish(Database.BatchableContext bc) {
System.debug('Leave accrual calculation completed for all staff.');
}
}*/


/*public with sharing class LeaveAccrualFromShiftDurationBatch
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
} */

public with sharing class LeaveAccrualFromShiftDurationBatch
implements Database.Batchable<SObject> {
    
    public Database.QueryLocator start(Database.BatchableContext bc) {
        
        Date yesterday = Date.today().addDays(-1);
        
        return Database.getQueryLocator([
            SELECT Id,Type_of_Employe__c,
            Annual_Leave_Accrued__c,
            Personal_Leave_Accur__c,
            (SELECT Id, Actual_Duration__c
             FROM ShiftwithStaffs__r
             WHERE Start_Date__c = yesterday)
            FROM Staff__c
            WHERE Status__c = true AND ( Type_of_Employe__c = 'Full Time Permanent' OR Type_of_Employe__c = 'Part Time Permanent')
        ]);
    }
    
    public void execute(Database.BatchableContext bc, List<Staff__c> staffList) {
        
        List<Staff__c> updates = new List<Staff__c>();
        
        // NES hourly accrual rates
        Decimal ANNUAL_RATE = 0.076923;  // Annual Leave
        Decimal SICK_RATE   = 0.038462;  // Personal Leave
        
        for (Staff__c staff : staffList) {
            
            Decimal yesterdayHours = 0;
            system.debug('check'+staff.ShiftwithStaffs__r);
            // Sum yesterday's shift hours only
            for (ShiftwithStaff__c shiftRec : staff.ShiftwithStaffs__r) {
                   system.debug('shiftRec.Actual_Duration__c '+shiftRec.Actual_Duration__c);
                if (shiftRec.Actual_Duration__c != null) {yesterdayHours += shiftRec.Actual_Duration__c;
                }
            }
            
            // Skip staff with no shifts yesterday
            if (yesterdayHours == 0) continue; Decimal annualAccruedToday = yesterdayHours * ANNUAL_RATE; Decimal sickAccruedToday   = yesterdayHours * SICK_RATE; staff.Annual_Leave_Accrued__c = (staff.Annual_Leave_Accrued__c == null ? 0 : staff.Annual_Leave_Accrued__c) + annualAccruedToday; staff.Personal_Leave_Accur__c = (staff.Personal_Leave_Accur__c == null ? 0 : staff.Personal_Leave_Accur__c) + sickAccruedToday; staff.Annual_Leave_Accrued__c = staff.Annual_Leave_Accrued__c.setScale(2);
            staff.Personal_Leave_Accur__c =
                staff.Personal_Leave_Accur__c.setScale(2);
            
            updates.add(staff);
        }
        
        if (!updates.isEmpty()) {
            update updates;
        }
    }
    
    public void finish(Database.BatchableContext bc) {
        System.debug('Daily leave accrual completed using Date__c.');
    }
}