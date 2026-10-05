public with sharing class ShiftWithStaffHistoryHandler {

    public static void captureTimingHistory(
    List<ShiftwithStaff__c> newList,
    Map<Id, ShiftwithStaff__c> oldMap
) {

    List<ShiftWithStaff_History__c> historyList =
        new List<ShiftWithStaff_History__c>();

    Set<String> validStatuses = new Set<String>{
        'InProgress',
        'Completed'
    };

    // =========================================
    // Get current logged-in Staff
    // =========================================

    String userEmail = UserInfo.getUserEmail();

    Id staffId;

    List<Staff__c> staffList = [
        SELECT Id
        FROM Staff__c
        WHERE Email_Address__c = :userEmail
        LIMIT 1
    ];

    if (!staffList.isEmpty()) {
        staffId = staffList[0].Id;
    }

    Set<Id> shiftIds = new Set<Id>();
        for (ShiftwithStaff__c shift : newList) {
            shiftIds.add(shift.Id);
        }

        Set<Id> shiftsWithServices = new Set<Id>();

        for (Services_and_Support_Plan__c service : [
            SELECT ShiftwithStaff__c
            FROM Services_and_Support_Plan__c
            WHERE ShiftwithStaff__c IN :shiftIds
        ]) {
            shiftsWithServices.add(service.ShiftwithStaff__c);
        }


    // =========================================
    // Process shifts
    // =========================================

    for (ShiftwithStaff__c newShift : newList) {

        ShiftwithStaff__c oldShift =
            oldMap.get(newShift.Id);

        // Only In Progress / Completed
        if (!validStatuses.contains(newShift.Status__c)) {
            continue;
        }


        // =========================================
        // START TIME
        // =========================================

        Boolean startChanged =
            newShift.Shift_Start_Time__c !=
            oldShift.Shift_Start_Time__c;

        if (startChanged) {

            ShiftWithStaff_History__c history =
                new ShiftWithStaff_History__c();

            history.ShiftwithStaff__c =
                newShift.Id;

            history.Original_Start_Time__c =
                oldShift.Shift_Start_Time__c;

            history.Modified_Start_Time__c =
                newShift.Shift_Start_Time__c;

            history.Reason_For_Time__c =
                newShift.Time_Edit_Reason__c;

            history.Modified_By__c =
                staffId;

            historyList.add(history);
        }


        // =========================================
        // END TIME
        // =========================================

        Boolean endChanged =
            newShift.Shift_End_Time__c !=
            oldShift.Shift_End_Time__c;

        if (endChanged) {

            ShiftWithStaff_History__c history =
                new ShiftWithStaff_History__c();

            history.ShiftwithStaff__c =
                newShift.Id;

            history.Original_End_Time__c =
                oldShift.Shift_End_Time__c;

            history.Modified_End_time__c =
                newShift.Shift_End_Time__c;

            history.Reason_For_Time__c =
                newShift.Time_Edit_Reason__c;

            history.Modified_By__c =
                staffId;

            historyList.add(history);
        }

        if (!shiftsWithServices.contains(newShift.Id) &&
            newShift.Shift_Calculated_Duration__c != oldShift.Shift_Calculated_Duration__c) {

            ShiftWithStaff_History__c history =
                new ShiftWithStaff_History__c();

            history.ShiftwithStaff__c = newShift.Id;

            history.Original_Billable_Hours__c =
                oldShift.Shift_Calculated_Duration__c;

            history.Modified_Billable_Hours__c =
                newShift.Shift_Calculated_Duration__c;

            history.Reason_For_Time__c =
                newShift.Time_Edit_Reason__c;

            history.Modified_By__c =
                staffId;

            historyList.add(history);
        }
    }


    // =========================================
    // Insert
    // =========================================

    if (!historyList.isEmpty()) {
        insert historyList;
    }
}

   public static void captureSupportItemHistory(
    List<Services_and_Support_Plan__c> newList,
    Map<Id, Services_and_Support_Plan__c> oldMap
) {

    List<ShiftWithStaff_History__c> historyList =
        new List<ShiftWithStaff_History__c>();


    // =========================================
    // Collect Shift Ids
    // =========================================

    Set<Id> shiftIds = new Set<Id>();

    for (Services_and_Support_Plan__c rec : newList) {

        if (rec.ShiftwithStaff__c != null) {
            shiftIds.add(rec.ShiftwithStaff__c);
        }
    }

    if (shiftIds.isEmpty()) {
        return;
    }


    // =========================================
    // Get Parent Shift Status
    // =========================================

    Map<Id, ShiftwithStaff__c> shiftMap =
        new Map<Id, ShiftwithStaff__c>([
            SELECT Id, Status__c,Time_Edit_Reason__c
            FROM ShiftwithStaff__c
            WHERE Id IN :shiftIds
        ]);


    // =========================================
    // Get Logged-in Staff
    // =========================================

    String userEmail = UserInfo.getUserEmail();

    Id staffId;

    List<Staff__c> staffList = [
        SELECT Id
        FROM Staff__c
        WHERE Email_Address__c = :userEmail
        LIMIT 1
    ];

    if (!staffList.isEmpty()) {
        staffId = staffList[0].Id;
    }


    // =========================================
    // Valid Status
    // =========================================

    Set<String> validStatuses = new Set<String>{
        'InProgress',
        'Completed'
    };


    // =========================================
    // Process Service Records
    // =========================================

    for (Services_and_Support_Plan__c newRec : newList) {

        Services_and_Support_Plan__c oldRec =
            oldMap.get(newRec.Id);


        // -----------------------------------------
        // Must have parent Shift
        // -----------------------------------------

        if (newRec.ShiftwithStaff__c == null) {
            continue;
        }


        ShiftwithStaff__c shift =
            shiftMap.get(newRec.ShiftwithStaff__c);

        if (shift == null ||
            !validStatuses.contains(shift.Status__c)) {

            continue;
        }


        // =========================================
        // SERVICE TYPE
        // =========================================

        Boolean serviceTypeChanged =
            newRec.Service_Type__c !=
            oldRec.Service_Type__c;


        // =========================================
        // QUANTITY
        // =========================================

        Boolean qtyChanged =
            newRec.Qty__c !=
            oldRec.Qty__c;


        // =========================================
        // SUPPORT ITEM HISTORY
        // =========================================

        if (serviceTypeChanged) {

            String originalSupportItem =
                oldRec.Support_Item_Name__c != null
                    ? oldRec.Support_Item_Name__c
                    : '';

            String modifiedSupportItem =
                newRec.Support_Item_Name__c != null
                    ? newRec.Support_Item_Name__c
                    : '';


            // -----------------------------------------
            // Only create if displayed value actually
            // changed
            // -----------------------------------------

            if (originalSupportItem != modifiedSupportItem) {

                ShiftWithStaff_History__c history =  new ShiftWithStaff_History__c();

                history.ShiftwithStaff__c = newRec.ShiftwithStaff__c;
               history.Reason_For_Time__c = shift.Time_Edit_Reason__c;

                history.Original_Support_Item__c = originalSupportItem;

                history.Modified_Support_Item__c =modifiedSupportItem;

                history.Modified_By__c = staffId;historyList.add(history);
            }
        }


        // =========================================
        // BILLABLE HOURS HISTORY
        // =========================================

        if (qtyChanged) {

            ShiftWithStaff_History__c history =
                new ShiftWithStaff_History__c();

            history.ShiftwithStaff__c =
                newRec.ShiftwithStaff__c;

            history.Original_Billable_Hours__c =
                oldRec.Qty__c;

            history.Modified_Billable_Hours__c =
                newRec.Qty__c;

            history.Modified_By__c =
                staffId;
                history.Reason_For_Time__c =
        shift.Time_Edit_Reason__c;

            historyList.add(history);
        }
    }


    // =========================================
    // Insert
    // =========================================

    if (!historyList.isEmpty()) {
        insert historyList;
    }
}

    
}