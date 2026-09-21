public with sharing class ShiftWithStaffHistoryController {

    // =========================
    // History Wrapper
    // =========================
    public class HistoryWrapper {

        @AuraEnabled
        public Id historyId;

        @AuraEnabled
        public Id shiftId;

        @AuraEnabled
        public String shiftName;

        @AuraEnabled
        public String modifiedBy;

        @AuraEnabled
        public Datetime modifiedDate;

        @AuraEnabled
        public String modifiedDateFormatted;

        @AuraEnabled
        public String changeType;

        @AuraEnabled
        public String originalValue;

        @AuraEnabled
        public String modifiedValue;

        @AuraEnabled
        public String reason;

        public HistoryWrapper() {
        }
    }


    // =========================
    // Get History
    // =========================
    @AuraEnabled
    public static List<HistoryWrapper> getShiftHistory(string shiftId) {

        if (shiftId == null) {
            return new List<HistoryWrapper>();
        }

        List<ShiftWithStaff_History__c> historyRecords = [
            SELECT
                Id,
                ShiftwithStaff__c,
                ShiftwithStaff__r.Name,

                Original_Start_Time__c,
                Original_End_Time__c,

                Modified_Start_Time__c,
                Modified_End_time__c,

                Reason_For_Time__c,

                Original_Support_Item__c,
                Modified_Support_Item__c,

                Original_Billable_Hours__c,
                Modified_Billable_Hours__c,

                Modified_By__c,
                Modified_By__r.NameToDisplay__c,

                CreatedDate

            FROM ShiftWithStaff_History__c

            WHERE ShiftwithStaff__c = :shiftId

            ORDER BY CreatedDate DESC
        ];


        List<HistoryWrapper> result = new List<HistoryWrapper>();


        for (ShiftWithStaff_History__c history : historyRecords) {

            // =========================================
            // TIME CHANGES
            // =========================================

            Boolean startChanged =
                history.Original_Start_Time__c != null ||
                history.Modified_Start_Time__c != null;

            Boolean endChanged =
                history.Original_End_Time__c != null ||
                history.Modified_End_time__c != null;


            if (startChanged || endChanged) {

                // -------------------------------------
                // START TIME
                // -------------------------------------

                if (history.Original_Start_Time__c != null ||
                    history.Modified_Start_Time__c != null) {

                    HistoryWrapper row = createBaseRow(history);

                    row.changeType = 'Start Time';

                    row.originalValue =
                        formatTime(history.Original_Start_Time__c);

                    row.modifiedValue =
                        formatTime(history.Modified_Start_Time__c);

                    row.reason = history.Reason_For_Time__c;

                    result.add(row);
                }


                // -------------------------------------
                // END TIME
                // -------------------------------------

                if (history.Original_End_Time__c != null ||
                    history.Modified_End_time__c != null) {

                    HistoryWrapper row = createBaseRow(history);

                    row.changeType = 'End Time';

                    row.originalValue =
                        formatTime(history.Original_End_Time__c);

                    row.modifiedValue =
                        formatTime(history.Modified_End_time__c);

                    row.reason = history.Reason_For_Time__c;

                    result.add(row);
                }
            }


            // =========================================
            // SUPPORT ITEM CHANGE
            // =========================================

            if (history.Original_Support_Item__c != null ||
                history.Modified_Support_Item__c != null) {

                HistoryWrapper row = createBaseRow(history);

                row.changeType = 'Support Item';

                row.originalValue =
                    history.Original_Support_Item__c != null
                        ? history.Original_Support_Item__c
                        : '';

                row.modifiedValue =
                    history.Modified_Support_Item__c != null
                        ? history.Modified_Support_Item__c
                        : '';
               row.reason = history.Reason_For_Time__c;

                result.add(row);
            }


            // =========================================
            // BILLABLE HOURS CHANGE
            // =========================================

            if (history.Original_Billable_Hours__c != null ||
                history.Modified_Billable_Hours__c != null) {

                HistoryWrapper row = createBaseRow(history);

                row.changeType = 'Billable Hours';

                row.originalValue =
                    history.Original_Billable_Hours__c != null
                        ? String.valueOf(
                            history.Original_Billable_Hours__c
                        )
                        : '';

                row.modifiedValue =
                    history.Modified_Billable_Hours__c != null
                        ? String.valueOf(
                            history.Modified_Billable_Hours__c
                        )
                        : '';
                row.reason = history.Reason_For_Time__c;

                result.add(row);
            }
        }


        return result;
    }


    // =========================
    // Create Common Row
    // =========================
    private static HistoryWrapper createBaseRow(
        ShiftWithStaff_History__c history
    ) {

        HistoryWrapper row = new HistoryWrapper();

        row.historyId = history.Id;

        row.shiftId = history.ShiftwithStaff__c;

        row.shiftName =
            history.ShiftwithStaff__r != null
                ? history.ShiftwithStaff__r.Name
                : '';

        row.modifiedBy =
            history.Modified_By__r != null
                ? history.Modified_By__r.NameToDisplay__c
                : '';

        row.modifiedDate = history.CreatedDate;

        row.modifiedDateFormatted =
            history.CreatedDate.format('dd/MM/yyyy hh:mm a');

        return row;
    }


    // =========================
    // Format Time
    // =========================
    private static String formatTime(Time value) {

        if (value == null) {
            return '';
        }

        Datetime dt = Datetime.newInstance(
            Date.today(),
            value
        );

        return dt.format('hh:mm a');
    }
}