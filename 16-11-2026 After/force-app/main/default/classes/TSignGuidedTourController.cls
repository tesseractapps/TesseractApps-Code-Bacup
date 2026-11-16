/**
 * T-Sign first-login welcome popup and guided tour (tSignGuidedTour LWC).
 * Remembers, per person, on their TSign_Staff__c record whether the tour
 * was Started, Skipped or Completed. A blank status means "never seen".
 */
public without sharing class TSignGuidedTourController {

    public static final String STARTED = 'Started';
    public static final String SKIPPED = 'Skipped';
    public static final String COMPLETED = 'Completed';
    private static final Set<String> STATUSES = new Set<String>{ STARTED, SKIPPED, COMPLETED };

    public class TourState {
        @AuraEnabled public Boolean showWelcome = false;
        @AuraEnabled public String status;
        @AuraEnabled public String firstName;
    }

    // Read once when the dashboard loads.
    @AuraEnabled
    public static TourState getTourState() {
        TourState state = new TourState();
        TSign_Staff__c staff = findCurrentStaff();
        if (staff != null) {
            state.status = staff.Guided_Tour_Status__c;
            state.firstName = staff.First_Name__c;
            state.showWelcome = String.isBlank(staff.Guided_Tour_Status__c);
        }
        return state;
    }

    // Started / Skipped / Completed. Once Completed it stays Completed,
    // so replaying the tour from Help and skipping it does not undo it.
    @AuraEnabled
    public static void saveTourStatus(String status) {
        if (!STATUSES.contains(status)) {
            throw new AuraHandledException('Unknown guided tour status: ' + status);
        }
        TSign_Staff__c staff = findCurrentStaff();
        if (staff == null || staff.Guided_Tour_Status__c == status || staff.Guided_Tour_Status__c == COMPLETED) {
            return;
        }
        try {
            update new TSign_Staff__c(
                Id = staff.Id,
                Guided_Tour_Status__c = status,
                Guided_Tour_Date__c = System.now()
            );
        } catch (DmlException e) {
            throw new AuraHandledException('Could not save the guided tour status: ' + e.getDmlMessage(0));
        }
    }

    // The logged-in person's staff record: by the User__c link first, then by email
    // (the same email match TsignUserManagementController.getUserNameInfo uses).
    private static TSign_Staff__c findCurrentStaff() {
        List<TSign_Staff__c> rows = [
            SELECT Id, First_Name__c, Guided_Tour_Status__c
            FROM TSign_Staff__c
            WHERE User__c = :UserInfo.getUserId()
            ORDER BY CreatedDate DESC
            LIMIT 1
        ];
        if (rows.isEmpty()) {
            String email = UserInfo.getUserEmail();
            if (String.isBlank(email)) {
                return null;
            }
            rows = [
                SELECT Id, First_Name__c, Guided_Tour_Status__c
                FROM TSign_Staff__c
                WHERE Email__c = :email
                ORDER BY CreatedDate DESC
                LIMIT 1
            ];
        }
        return rows.isEmpty() ? null : rows[0];
    }
}