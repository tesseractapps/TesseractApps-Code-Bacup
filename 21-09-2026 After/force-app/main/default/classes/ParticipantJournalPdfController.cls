public without sharing class ParticipantJournalPdfController {

        public String orgName { get; set; }
        public String orgLogo { get; set; }
        public String orgAddress { get; set; }
        public String participantName { get; set; }
        public List<Client_Journel__c> journals { get; set; }
        public List<Task> tasks { get; set; }
        public List<ActivityWrapper> activities { get; set; }


        public class ActivityWrapper {
        public Boolean isTask { get; set; }
        public Client_Journel__c journal { get; set; }
        public Task task { get; set; }
        public Datetime createdDate { get; set; }
        public String createdOnFormatted { get; set; }
        public String journalDescription { get; set; }

        public String taskStatusText { get; set; }
        public String taskCreatedBy { get; set; }

        public String taskPriority { get; set; }
        public Date taskDate { get; set; }
        public String taskDescription { get; set; }

         public Map<Id, String> historyUpdatedOnMap { get; set; }
        }

        public ParticipantJournalPdfController() {
            activities = new List<ActivityWrapper>();
            String participantId = ApexPages.currentPage().getParameters().get('participantId');
            String selectedType = ApexPages.currentPage().getParameters().get('type');
            // -----------------------------
            // Organisation Details
            // -----------------------------
            User objUser = [
                SELECT Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];
            List<Organisation__c> orgList = [
                SELECT Id,
                        Name,
                        Organization_Logo__c,
                        Address_Latest__Street__s,
                        Address_Latest__City__s,
                        Address_Latest__StateCode__s,
                        Address_Latest__PostalCode__s,
                        Address_Latest__CountryCode__s
                FROM Organisation__c
                WHERE Name = :objUser.Organization_Name__c
                LIMIT 1
            ];
            if (!orgList.isEmpty()) {
                Organisation__c org = orgList[0];
                orgName = org.Name;
                orgLogo = org.Organization_Logo__c;
                List<String> addressParts = new List<String>();
                if (!String.isBlank(org.Address_Latest__Street__s))
                    addressParts.add(org.Address_Latest__Street__s);
                if (!String.isBlank(org.Address_Latest__City__s))
                    addressParts.add(org.Address_Latest__City__s);
                if (!String.isBlank(org.Address_Latest__StateCode__s))
                    addressParts.add(org.Address_Latest__StateCode__s);
                if (!String.isBlank(org.Address_Latest__PostalCode__s))
                    addressParts.add(org.Address_Latest__PostalCode__s);
                if (!String.isBlank(org.Address_Latest__CountryCode__s))
                    addressParts.add(org.Address_Latest__CountryCode__s);
                orgAddress = String.join(addressParts, ', ');
            }

            // -----------------------------
            // Participant
            // -----------------------------
            if (participantId != null) {

                Client__c client = [
                    SELECT Name
                    FROM Client__c
                    WHERE Id = :participantId
                    LIMIT 1
                ];
                

                participantName = client.Name;
            }
            journals = [
                SELECT
                    Id,
                    Care_Notes__c,
                    Description__c,
                    CreatedDate,
                    CreatedBy.Name,
                    ShiftwithStaff__r.Shift_Start_End_Time__c,ShiftwithStaff__r.Shift_Start_DateTime__c,

                    (
                        SELECT
                            Id,
                            Description__c,
                            Care_Notes__c,
                            CreatedDate,
                            CreatedBy.Name,
                            Reason__c
                        FROM Client_Journels__r
                        ORDER BY CreatedDate DESC
                    )
                FROM Client_Journel__c
                WHERE Client__c = :participantId
                AND Original_Client_Journel__c = null
                ORDER BY CreatedDate DESC
                ];
            tasks = [
            SELECT
                Id,
                Task_Tittle__c,
                Task_Date__c,
                Task_Time__c,
                Description,
                Status,
                Priority,
                CreatedDate,
                CreatedBy.Name,
                Participant__c
            FROM Task
            WHERE Participant__c = :participantId
            ORDER BY CreatedDate DESC
            ];

                    System.debug('================ TASK QUERY =================');
        System.debug('Logged In User : ' + UserInfo.getName());
        System.debug('Participant Id : ' + participantId);
        System.debug('Task Count : ' + tasks.size());
        for(Task t : tasks){

            System.debug('================ TASK DETAILS ================');
            System.debug('Id          : ' + t.Id);
            System.debug('Title       : ' + t.Task_Tittle__c);
            System.debug('Created By  : ' + t.CreatedBy.Name);
            System.debug('Status      : ' + t.Status);
            System.debug('Priority    : ' + t.Priority);
            System.debug('Task Date   : ' + t.Task_Date__c);
            System.debug('Description : ' + t.Description);

        }
            for (Client_Journel__c journal : journals) {
                    // Apply filter
        if (!String.isBlank(selectedType)
            && selectedType != 'All'
            && journal.Care_Notes__c != selectedType) {

            continue;
        }

        ActivityWrapper wrapper = new ActivityWrapper();

        wrapper.isTask = false;
        wrapper.journal = journal;
        wrapper.createdDate = journal.CreatedDate;
        wrapper.createdOnFormatted =
        journal.CreatedDate.format('dd/MM/yyyy hh:mm a');
        wrapper.journalDescription =
        removeImages(journal.Description__c);
        System.debug('===== JOURNAL =====');
        System.debug('CreatedDate DB  : ' + journal.CreatedDate);
        System.debug('User TimeZone   : ' + UserInfo.getTimeZone().getID());
        System.debug('Formatted       : ' + journal.CreatedDate.format('dd/MM/yyyy hh:mm a'));
        System.debug('Formatted GMT   : ' + journal.CreatedDate.formatGMT('dd/MM/yyyy hh:mm a'));

        wrapper.historyUpdatedOnMap = new Map<Id, String>();

for (Client_Journel__c history : journal.Client_Journels__r) {

    wrapper.historyUpdatedOnMap.put(
        history.Id,
        history.CreatedDate.format(
            'dd/MM/yyyy hh:mm a',
            'Australia/Sydney'
        )
    );
}
        activities.add(wrapper);
        }

        // -----------------------------
        // Merge Tasks
        // -----------------------------
        for (Task taskRec : tasks) {
            // Show tasks only when Task or All is selected
        if (!String.isBlank(selectedType)
            && selectedType != 'All'
            && selectedType != 'Task') {

            continue;
        }

        ActivityWrapper wrapper = new ActivityWrapper();

        wrapper.isTask = true;
        wrapper.task = taskRec;

        // Add this
        wrapper.taskCreatedBy = taskRec.CreatedBy.Name;
        wrapper.taskStatusText = taskRec.Status;
        wrapper.taskPriority = taskRec.Priority;
        wrapper.taskDate = taskRec.Task_Date__c;
        wrapper.taskDescription = taskRec.Description;
        System.debug('=========== WRAPPER VALUES ===========');
        System.debug('Wrapper Title       : ' + wrapper.task.Task_Tittle__c);
        System.debug('Wrapper Status      : ' + wrapper.task.Status);
        System.debug('Wrapper Priority    : ' + wrapper.task.Priority);
        System.debug('Wrapper Task Date   : ' + wrapper.task.Task_Date__c);
        System.debug('Wrapper Description : ' + wrapper.task.Description);
        System.debug('Wrapper Created By  : ' + wrapper.task.CreatedBy.Name);
        wrapper.createdDate = taskRec.CreatedDate;
        wrapper.createdOnFormatted =
        taskRec.CreatedDate.format('dd/MM/yyyy hh:mm a');
            System.debug('Adding Task To Activity List : ' + taskRec.Id);
        activities.add(wrapper);
        }
        activities.sort(new ActivitySorter());
        System.debug('================ FINAL ACTIVITIES =================');
        System.debug('Total Activities : ' + activities.size());

        for(ActivityWrapper a : activities){

        if(a.isTask){

            System.debug('TASK -> ' + a.task.Task_Tittle__c);

        }else{

            System.debug('JOURNAL -> ' + a.journal.Care_Notes__c);

        }

        }
        }

        public class ActivitySorter implements System.Comparator<ActivityWrapper> {

        public Integer compare(ActivityWrapper a, ActivityWrapper b) {

            if (a.createdDate == b.createdDate) {
                return 0;
            }

            return a.createdDate > b.createdDate ? -1 : 1;
        }
        }

        public static String removeImages(String html) {

        if (String.isBlank(html)) {
            return '';
        }

        // Remove all <img ...> tags
        html = html.replaceAll('(?i)<img[^>]*>', '');

        return html;
        }
        }