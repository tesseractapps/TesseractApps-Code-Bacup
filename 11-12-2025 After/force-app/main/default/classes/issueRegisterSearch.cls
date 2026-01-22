public without sharing class issueRegisterSearch {
    @AuraEnabled
    public static List< Case > searchIssues(String listOfsearchString, String typeofIssue){
        System.debug('listOfsearchString==>'+listOfsearchString);
        User objUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
        String orgID = [SELECT Id FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1].Id;
        List<Case> listOfIssues = new List<Case>();
        List<String> obj=(List<String>)JSON.deserialize(listOfsearchString,List<String>.class);
        system.debug('Data'+obj);
        String[] filters = new String[0];
        if(obj.size()>0){
             if (obj.size() > 0 && obj[0] != '') {
                String caseNumber = '%'+ obj[0] + '%';
                filters.add('CaseNumber LIKE :caseNumber');
                System.debug('CaseNumber>>' + caseNumber);
            }
            if (obj.size() > 1 && obj[1] != '') {
                String cName = '%'+ obj[1] + '%';
                System.debug('cName>>>' + cName);
                filters.add('Client_Name__c LIKE :cName');
            }
            if (obj.size() > 2 && obj[2] != '') {
                String fName = '%'+ obj[2] + '%';
                System.debug('fName>>>' + fName);
                filters.add('Facility_Name__c LIKE :fName');
            }
            if (obj.size() > 3 && obj[3] != '') {
                String status = '%'+ obj[3] + '%';
                System.debug('status>>>' + status);
                filters.add('Status_1__c LIKE :status');
            }
            if (obj.size() > 4 && obj[4] != '') {
                String priority = '%'+ obj[4] + '%';
                System.debug('priority>>>' + priority);
                filters.add('Priority LIKE :priority');
            }
           /* if (obj.size() > 5 && obj[5] != '') {
                date startDate = Date.valueof(obj[5] ) ;
                System.debug('start date>>>' + startDate);
                filters.add('Date__c >= :startDate');
            }
             if (obj.size() > 6 && obj[6] != '') {
                date endDate = Date.valueof(obj[6] ) ;
                System.debug('end date>>>' + endDate);
                filters.add('Date__c <= :endDate');
            } */
            
        }
        System.debug('Type of Issue>>'+typeofIssue);
            if(typeofIssue !='' && typeofIssue !=NULL){
                
                filters.add('Type_of_Issue__c =: typeofIssue');
            }
        system.debug(filters);
        String query='SELECT Id,First_Name__c,Last_Name__c,Assign_to__c,Assign_to_1__c,Assign_to_1__r.NameToDisplay__c,Participant_Name__c,Facility_Name_1__c,Allegation_description__c,Role__c,Email__c,Date__c,Subject,User_Name__c,Raised_By__c,Incident_Time__c,Date_of_Incident__c,Alleged_Date__c,Alleged_Time__c,Revelant_Issue_Type__c,Date_And_Time_Alleged__c,Date_and_Time_Incident__c,Allegation__c,Phone_Number__c,Name__c,Type_of_Issue__c,Description,Description1__c,Description2__c,Description3__c,Reported_to_the_Police__c,Police_Comments__c,Regarding_the_Issue__c,CreatedDate,CreatedDateDisplay__c,Client_Name__c,Client__r.Id,Client__c,Facility__c,Facility_Name__c,Client__r.First_Name__c,Client__r.Last_Name__c,Client__r.Name__c,Facility__r.Name,Type,Service_Name__c,Status,Actions__c,Priority,CreatedBy.Name,Status_1__c,Amazon_URL__c,CaseNumber,Org_Name__c,Assign_Tesseract_Staff__c,Most_Relevant_Others__c,Participant_Representative__c,Sub_Contractor__c,Signature__c,Reviewer_Name__c,Designation__c,StaffRole__c FROM Case WHERE Organization__c=:orgID ';
        if(filters.size() > 0) {
            query += ' AND ' + String.join(filters, ' AND ');
        }
        query += ' ORDER BY CreatedDate DESC';
        
        system.debug('query>>>>'+query);
        
        if(obj.size()>0){
            listOfIssues = Database.query(query);
        }
        else{
            listOfIssues = Database.query(query);
        }
        system.debug('listOfIssues>>>>'+listOfIssues.size());
        return listOfIssues;
    } 
    
    @AuraEnabled
    public static List<Case> getIssues(String typeofIssue, String orgId){
        System.debug('Type of issue>>'+typeofIssue);
        System.debug('Orga Id>>'+orgId);
        return [SELECT Id, Name__c,Email__c,Assign_to__c,Assign_to_1__c,Assign_to_1__r.NameToDisplay__c,Participant_Name__c,Facility_Name_1__c,Type_of_Issue__c,Facility_Name__c,Allegation_description__c,Incident_Time__c,Date_of_Incident__c,Alleged_Date__c,Alleged_Time__c,Raised_By__c,Date__c,Subject,User_Name__c,Comments_Added_by_Tesseract_Teams__c,Description,Description1__c,Description2__c,Description3__c,ClosedDate,CreatedDate,Client_Name__c,Type,Service_Name__c,Status,Actions__c,Priority,Status_1__c,Amazon_URL__c,Reported_to_the_Police__c,Regarding_the_Issue__c,CaseNumber,Org_Name__c FROM Case WHERE Type_of_Issue__c=:typeofIssue AND Organization__c=:orgId Order by createddate desc];
    }
     @AuraEnabled
    public static Case getIssuesbyId(String caseid){
        System.debug('case Id>>'+caseid);
        Case caseRecord = [SELECT Id, Name__c, Email__c, Assign_to__c, Assign_to_1__c, Assign_to_1__r.NameToDisplay__c,Last_Name__c,First_Name__c,Phone_Number__c,Role__c,StaffRole__c,
                      Participant_Name__c, Facility_Name_1__c, Type_of_Issue__c, Facility_Name__c, Allegation_description__c,Participant_Representative__c,Sub_Contractor__c,
                      Incident_Time__c, Date_of_Incident__c, Alleged_Date__c, Alleged_Time__c, Raised_By__c, Date__c, 
                      Subject, User_Name__c, Comments_Added_by_Tesseract_Teams__c, Description, Description1__c, Description2__c,
                      Description3__c, ClosedDate, CreatedDate, Client_Name__c, Type, Service_Name__c, Status, Actions__c,
                      Priority, Status_1__c, Amazon_URL__c, Reported_to_the_Police__c,Police_Comments__c,Most_Relevant_Others__c, Regarding_the_Issue__c, CaseNumber,Allegation__c,Revelant_Issue_Type__c,
                      Signature__c,Reviewer_Name__c,Designation__c,Org_Name__c 
                      FROM Case 
                      WHERE Id = :caseid LIMIT 1];
    
    return caseRecord;
    }
   @AuraEnabled
        public static Case saveCaseRecord(String organisationName, String firstName, String others, String lastName, Id clientId, Id facilityId, String role, String email, String phone, String status,
                                          String priorityValue, String raisedByValue, String issueTypeValue, Date incidentDate, String incidentTime, Date allegedDate, String allegedTime, String description,
                                          String reportToPolice, String regardingtheIssue, String policeComments, String actionsTaken, String additionalInfo, String futureActions,
                                          String participantValue, String subContractorValue, String selectedParticipant, String selectedFacility, String selectedStaff, String selectedEmployee, String staffid, String jsonsignature) {
                                              
             String signature = '';
             String reviewerName = '';
             String designation = '';
             String mostReleventOthers = '';                                
        System.debug('jsonsignature: ' + jsonsignature);
            if (!String.isBlank(jsonsignature)) {
                Map<String, Object> Fields = (Map<String, Object>) JSON.deserializeUntyped(jsonsignature);
                System.debug('Fields: ' + Fields);
                signature = (String) Fields.get('signature');
                reviewerName = (String) Fields.get('name');
                designation = (String) Fields.get('designation');
                mostReleventOthers = (String) Fields.get('mostReleventOthers');
            }
            
            // Debug logs for all input parameters
            System.debug('organisationName: ' + organisationName);
            System.debug('firstName: ' + firstName);
            System.debug('others: ' + others);
            System.debug('lastName: ' + lastName);
            System.debug('clientId: ' + clientId);
            System.debug('facilityId: ' + facilityId);
            System.debug('role: ' + role);
            System.debug('email: ' + email);
            System.debug('phone: ' + phone);
            System.debug('status: ' + status);
            System.debug('priorityValue: ' + priorityValue);
            System.debug('raisedByValue: ' + raisedByValue);
            System.debug('issueTypeValue: ' + issueTypeValue);
            System.debug('incidentDate: ' + incidentDate);
            System.debug('incidentTime: ' + incidentTime);
            System.debug('allegedDate: ' + allegedDate);
            System.debug('allegedTime: ' + allegedTime);
            System.debug('description: ' + description);
            System.debug('reportToPolice: ' + reportToPolice);
            System.debug('regardingtheIssue: ' + regardingtheIssue);
            System.debug('policeComments: ' + policeComments);
            System.debug('actionsTaken: ' + actionsTaken);
            System.debug('additionalInfo: ' + additionalInfo);
            System.debug('futureActions: ' + futureActions);
            System.debug('participantValue: ' + participantValue);
            System.debug('subContractorValue: ' + subContractorValue);
            System.debug('selectedParticipant: ' + selectedParticipant);
            System.debug('selectedFacility: ' + selectedFacility);
            System.debug('selectedStaff: ' + selectedStaff);
            System.debug('selectedEmployee: ' + selectedEmployee);
            System.debug('most relevent others: ' + mostReleventOthers);
            
            System.debug('signature: ' + signature);
            System.debug('reviewerName: ' + reviewerName);
            System.debug('designation: ' + designation);
        
            // Create new Case record
            Case newCase = new Case();
            newCase.First_Name__c = firstName;
            newCase.Last_Name__c = lastName;
            newCase.Client__c = clientId;
            newCase.Facility__c = facilityId;                                  
            newCase.Organization__c = organisationName;                                  
          //  newCase.Role__c = role;
            newCase.StaffRole__c = role;
            newCase.Origin = 'Email';
            newCase.Email__c = email;
            newCase.Participant_Representative__c = participantValue;
            newCase.Sub_Contractor__c = subContractorValue;
            newCase.Participant_Name__c = selectedParticipant;
            newCase.Facility_Name_1__c = selectedFacility;
            if(selectedStaff !=null && selectedStaff !=''){
                   newCase.Assign_to__c = selectedStaff;
              }
              if(selectedEmployee !=null && selectedEmployee !=''){
                    newCase.Assign_to_1__c = selectedEmployee;
              }
            newCase.Phone_Number__c = phone;
            newCase.Type_of_Issue__c = 'Own Org';
            newCase.Status_1__c = status;                                  
            newCase.Priority = priorityValue;
            newCase.Allegation__c = raisedByValue;
            newCase.Allegation_description__c = others;                                  
            newCase.Revelant_Issue_Type__c = issueTypeValue;
            
            newCase.Date_of_Incident__c = incidentDate;
            newCase.Incident_Time__c = incidentTime; 
            newCase.Alleged_Date__c = allegedDate;
            newCase.Alleged_Time__c = allegedTime;
            newCase.Description = description;
            newCase.Reported_to_the_Police__c = !String.isBlank(reportToPolice) ? reportToPolice : 'No';
            newCase.Police_Comments__c = policeComments;
            newCase.Regarding_the_Issue__c = regardingtheIssue;
            newCase.Description1__c = actionsTaken;
            newCase.Description2__c = additionalInfo;
            newCase.Description3__c = futureActions;
            newCase.Most_Relevant_Others__c=mostReleventOthers;
            newCase.Signature__c = signature;
            newCase.Reviewer_Name__c = reviewerName;
            newCase.Designation__c = designation;
            newCase.Staffid__c = staffid;                                  
                                              
                                              
            System.debug('most relevent others: ' + newCase.Reported_to_the_Police__c);                                
                                              
        // Build creation history log
    try {
        User currentUser = [SELECT FirstName, LastName FROM User WHERE Id = :UserInfo.getUserId()];
        String userFullName = currentUser.FirstName + ' ' + currentUser.LastName;

        String assignedTo = 'None';
        if (!String.isBlank(selectedEmployee)) {
            try {
                Staff__c staffMember = [
                    SELECT Name, Last_Name__c 
                    FROM Staff__c 
                    WHERE Id = :selectedEmployee 
                    LIMIT 1
                ];
                assignedTo = staffMember.Name + ' ' + staffMember.Last_Name__c;
            } catch (Exception e) {
                assignedTo = 'Unknown';
            }
        }

        DateTime now = DateTime.now();
        String formattedDate = now.format('dd/MM/yyyy', 'en_US');
        String formattedTime = now.format('hh:mm a', 'en_US').toLowerCase(); // e.g., 02:35 pm

        List<Map<String, String>> history = new List<Map<String, String>>();
        history.add(new Map<String, String>{
            'timestamp' => formattedDate + ' ' + formattedTime,
            'user' => userFullName,
            'action' => 'Created Form',
            'changes' => 'Assigned To:' + assignedTo + '; Status:' + status
        });

        newCase.History_Log__c = JSON.serialize(history);
    } catch (Exception logErr) {
        System.debug('⚠️ Failed to generate history log on creation: ' + logErr.getMessage());
    }
            // Insert the new Case record
            insert newCase;
        
            return newCase;
   }
    
    @AuraEnabled
    public static Case updateCaseRecord(Id recordId,String organisationName, String firstName, String others, String lastName,Id clientId, Id facilityId, String role, String email, String phone, String status,
                                      String priorityValue,String raisedByValue,String issueTypeValue, Date incidentDate, String incidentTime, Date allegedDate, String allegedTime, String description,
                                      String reportToPolice, String regardingtheIssue,String policeComments,String actionsTaken, String additionalInfo, String futureActions,
                                      String participantValue, String subContractorValue,String selectedParticipant,String selectedFacility,String selectedStaff,String selectedEmployee,String jsonsignature) { // Checkbox regardingtheIssue,
                                          // Fetch the existing Case record
        Case existingCase = [SELECT Id, Assign_to__c, Assign_to__r.Name, Assign_to_1__c, Assign_to_1__r.Name,Phone_Number__c,Email__c,Reviewer_Name__c,Designation__c,Signature__c,
               Status_1__c, History_Log__c, Participant_Representative__c,Participant_Name__c,Priority,Facility__c,Facility__r.Name,Client__c,Client__r.First_Name__c,Client__r.Last_Name__c,Sub_Contractor__c,
                             Allegation__c,Allegation_description__c,Facility_Name_1__c,Revelant_Issue_Type__c,Description,Reported_to_the_Police__c,Police_Comments__c,Regarding_the_Issue__c,Description1__c,Description2__c,Description3__c,Date_of_Incident__c,Incident_Time__c,Alleged_Date__c,Alleged_Time__c,Most_Relevant_Others__c
                FROM Case WHERE Id = :recordId LIMIT 1];

        String signature = '';
        String reviewerName = '';
        String designation = '';
        String mostReleventOthers = '';
        System.debug('jsonsignature: ' + jsonsignature);
            if (!String.isBlank(jsonsignature)) {
                Map<String, Object> Fields = (Map<String, Object>) JSON.deserializeUntyped(jsonsignature);
                System.debug('Fields: ' + Fields);
                signature = (String) Fields.get('signature');
                reviewerName = (String) Fields.get('name');
                designation = (String) Fields.get('designation');
                mostReleventOthers = (String) Fields.get('mostReleventOthers');
            }
                                          
        // Track changes for 'Assigned To' and 'Status'
        List<String> changes = new List<String>();

        if (existingCase.Assign_to_1__c != selectedEmployee) {
            String oldAssigneeName = existingCase.Assign_to_1__r != null ? existingCase.Assign_to_1__r.Name : 'None';
            String newAssigneeName = 'None';
        
            if (selectedEmployee != null) {
                try {
                    Staff__c staffMember = [
                        SELECT Name, Last_Name__c 
                        FROM Staff__c 
                        WHERE Id = :selectedEmployee 
                        LIMIT 1
                    ];
                    newAssigneeName = staffMember.Name + ' ' + staffMember.Last_Name__c;
                } catch (Exception e) {
                    newAssigneeName = 'Unknown';
                }
            }
        System.debug('📌 New selectedStaf: ' + selectedEmployee); 
        System.debug('📌 New Assignee Name: ' + newAssigneeName);
        changes.add('Assigned To: ' + oldAssigneeName + ' → ' + newAssigneeName);
    }

    // Compare 'Status'
    if (existingCase.Status_1__c != status) {
        changes.add('Status: ' + existingCase.Status_1__c + ' → ' + status);
    }
    if (existingCase.Client__c != clientId) {
        String oldClientName = existingCase.Client__r != null ? existingCase.Client__r.First_Name__c : 'None';
        String newClientName = 'None';
    
        if (clientId != null) {
            try {
                Client__c clientRecord = [
                    SELECT Name,First_Name__c,Last_Name__c  
                    FROM Client__c 
                    WHERE Id = :clientId 
                    LIMIT 1
                ];
                newClientName = clientRecord.First_Name__c+ ' ' + clientRecord.Last_Name__c;
            } catch (Exception e) {
                newClientName = 'Unknown';
            }
        }
    
        System.debug('📌 New selectedClient: ' + clientId);
        System.debug('📌 New Client Name: ' + newClientName);    
        changes.add('Client: ' + oldClientName + ' → ' + newClientName);
    }
    if (existingCase.Facility__c != facilityId) {
       // changes.add(' Selected Facility: ' + existingCase.Facility__c + ' → ' + facilityId);
        String oldFacName = existingCase.Facility__c != null ? existingCase.Facility__r.Name : 'None';
            String newFacName = 'None';
        
            if (facilityId != null) {
                try {
                    Facility__c facMember = [
                        SELECT Name FROM Facility__c 
                        WHERE Id = :facilityId 
                        LIMIT 1
                    ];
                    newFacName = facMember.Name;
                } catch (Exception e) {
                    newFacName = 'Unknown';
                }
            }
        System.debug('📌 New Fac Name: ' + newFacName); 
        System.debug('📌 Old Fac Name: ' + oldFacName);
        changes.add('Facility To: ' + oldFacName + ' → ' + newFacName);
    } 
        
    if (existingCase.Email__c != email) {
        changes.add('Email Address: ' + existingCase.Email__c + ' → ' + email);
    }
    if (existingCase.Phone_Number__c != phone) {
        changes.add('Phone Number: ' + existingCase.Phone_Number__c + ' → ' + phone);
    }
    if (existingCase.Priority != priorityValue) {
        changes.add('Priority: ' + existingCase.Priority + ' → ' + priorityValue);
    } 
    if (existingCase.Participant_Representative__c != participantValue) {
        changes.add('Participant Representative: ' + existingCase.Participant_Representative__c + ' → ' + participantValue);
    } 
    if (existingCase.Sub_Contractor__c != subContractorValue) {
        changes.add('Sub Contractor: ' + existingCase.Sub_Contractor__c + ' → ' + subContractorValue);
    }   
    if (existingCase.Participant_Name__c != selectedParticipant) {
        // old client name
        String oldClientName1 = 'None';
        if (existingCase.Participant_Name__c != null) {
            try {
                Client__c oldClientRecord = [
                    SELECT First_Name__c, Last_Name__c 
                    FROM Client__c 
                    WHERE Id = :existingCase.Participant_Name__c 
                    LIMIT 1
                ];
                oldClientName1 = oldClientRecord.First_Name__c + ' ' + oldClientRecord.Last_Name__c;
            } catch (Exception e) {
                oldClientName1 = 'Unknown';
            }
        }
    
        // new client name
        String newClientName1 = 'None';
        if (selectedParticipant != null) {
            try {
                Client__c newClientRecord = [
                    SELECT First_Name__c, Last_Name__c 
                    FROM Client__c 
                    WHERE Id = :selectedParticipant 
                    LIMIT 1
                ];
                newClientName1 = newClientRecord.First_Name__c + ' ' + newClientRecord.Last_Name__c;
            } catch (Exception e) {
                newClientName1 = 'Unknown';
            }
        }
    
        System.debug('📌 Old Client Name: ' + oldClientName1);
        System.debug('📌 New Client Name: ' + newClientName1);    
        changes.add('Selected Participant: ' + oldClientName1 + ' → ' + newClientName1);
    }

     if (existingCase.Facility_Name_1__c != selectedFacility) {
        // old facility name
        String oldFacName1 = 'None';
        if (existingCase.Facility_Name_1__c != null) {
            try {
                Facility__c oldFacility = [
                    SELECT Name 
                    FROM Facility__c 
                    WHERE Id = :existingCase.Facility_Name_1__c 
                    LIMIT 1
                ];
                oldFacName1 = oldFacility.Name;
            } catch (Exception e) {
                oldFacName1 = 'Unknown';
            }
        }
    
        // new facility name
        String newFacName1 = 'None';
        if (selectedFacility != null) {
            try {
                Facility__c newFacility = [
                    SELECT Name 
                    FROM Facility__c 
                    WHERE Id = :selectedFacility 
                    LIMIT 1
                ];
                newFacName1 = newFacility.Name;
            } catch (Exception e) {
                newFacName1 = 'Unknown';
            }
        }
    
        System.debug('📌 Old Fac Name: ' + oldFacName1);
        System.debug('📌 New Fac Name: ' + newFacName1);    
        changes.add('Selected Facility: ' + oldFacName1 + ' → ' + newFacName1);
    }
    if (existingCase.Assign_to__c != selectedStaff) {
        // old staff name
        String oldStaffName = 'None';
        if (existingCase.Assign_to__c != null) {
            try {
                Staff__c oldStaff = [
                    SELECT Name, Last_Name__c 
                    FROM Staff__c 
                    WHERE Id = :existingCase.Assign_to__c 
                    LIMIT 1
                ];
                oldStaffName = oldStaff.Name + ' ' + oldStaff.Last_Name__c;
            } catch (Exception e) {
                oldStaffName = 'Unknown';
            }
        }
    
        // new staff name
        String newStaffName = 'None';
        if (selectedStaff != null) {
            try {
                Staff__c newStaff = [
                    SELECT Name, Last_Name__c 
                    FROM Staff__c 
                    WHERE Id = :selectedStaff 
                    LIMIT 1
                ];
                newStaffName = newStaff.Name + ' ' + newStaff.Last_Name__c;
            } catch (Exception e) {
                newStaffName = 'Unknown';
            }
        }    
        System.debug('📌 Old Staff Name: ' + oldStaffName);
        System.debug('📌 New Staff Name: ' + newStaffName);    
        changes.add('Selected Employee  To: ' + oldStaffName + ' → ' + newStaffName);
    }
    if (existingCase.Revelant_Issue_Type__c != issueTypeValue) {
        changes.add('Revelant Issue Type: ' + existingCase.Revelant_Issue_Type__c + ' → ' + issueTypeValue);
    }
    if (existingCase.Description != description) {
        changes.add('Allegation Description: ' + existingCase.Description + ' → ' + description);
    } 
    if (existingCase.Alleged_Date__c != allegedDate) {
        changes.add('Alleged Date: ' + existingCase.Alleged_Date__c + ' → ' + allegedDate);
    } 
    if (existingCase.Alleged_Time__c != allegedTime) {
        changes.add('Alleged Time: ' + existingCase.Alleged_Time__c + ' → ' + allegedTime);
    } 
    if (existingCase.Regarding_the_Issue__c != regardingtheIssue) {
        changes.add('Regarding the Issue: ' + existingCase.Regarding_the_Issue__c + ' → ' + regardingtheIssue);
    }
   /* if (existingCase.Reported_to_the_Police__c != reportToPolice) {
        changes.add('Reported to the police : ' + existingCase.Reported_to_the_Police__c + ' → ' + reportToPolice);
    } */
    System.debug('existingCase.Police_Comments__c :' + existingCase.Police_Comments__c);

    // Normalize null/blank to the same value
    String prevPolice = normBlankToNull(existingCase.Police_Comments__c);
    String newPolice  = normBlankToNull(policeComments);
    Boolean reportedPrev = 'yes'.equalsIgnoreCase(String.valueOf(existingCase.Reported_to_the_Police__c));
    Boolean reportedCurr = 'yes'.equalsIgnoreCase(String.valueOf(reportToPolice));
    
    if ((reportedPrev || reportedCurr) && prevPolice != newPolice) {
        changes.add(
            'Police Comments: ' +
            (prevPolice == null ? 'None' : prevPolice) + ' → ' +
            (newPolice  == null ? 'None' : newPolice)
        );
    }

    if (existingCase.Description1__c != actionsTaken) {
        changes.add('Action Taken Description: ' + existingCase.Description1__c + ' → ' + actionsTaken);
    } 
    if (existingCase.Description2__c != additionalInfo) {
        changes.add('Addition Inf Description: ' + existingCase.Description2__c + ' → ' + additionalInfo);
    }
    if (existingCase.Description3__c != futureActions) {
        changes.add('Future Actions Description: ' + existingCase.Description3__c + ' → ' + futureActions);
    }if (existingCase.Reviewer_Name__c != reviewerName) {
        changes.add('Reviewer Name: ' + existingCase.Reviewer_Name__c + ' → ' + reviewerName);
    }
    if (existingCase.Designation__c != designation) {
        changes.add('Designation: ' + existingCase.Designation__c + ' → ' + designation);  
    }
    if (existingCase.Signature__c != signature) {
        changes.add('Signature: ' + existingCase.Signature__c + ' → ' + signature);  
    }                                
    
                                          // Debug logs for all input parameters
                                          System.debug('record id: ' + recordId);
                                          System.debug('organisationName: ' + organisationName);
                                          System.debug('firstName: ' + firstName);
                                          System.debug('others: ' + others);
                                          System.debug('lastName: ' + lastName);
                                          System.debug('clientId: ' + clientId);
                                          System.debug('facilityId: ' + facilityId);
                                          System.debug('role: ' + role);
                                          System.debug('email: ' + email);
                                          System.debug('phone: ' + phone);
                                          System.debug('status: ' + status);
                                          System.debug('priorityValue: ' + priorityValue);
                                          System.debug('raisedByValue: ' + raisedByValue);
                                          System.debug('issueTypeValue: ' + issueTypeValue);
                                          System.debug('incidentDate: ' + incidentDate);
                                          System.debug('incidentTime: ' + incidentTime);
                                          System.debug('allegedDate: ' + allegedDate);
                                          System.debug('allegedTime: ' + allegedTime);
                                          System.debug('description: ' + description);
                                          System.debug('reportToPolice: ' + reportToPolice);
                                          System.debug('regardingtheIssue: ' + regardingtheIssue);
                                          System.debug('policeComments: ' + policeComments);
                                          System.debug('actionsTaken: ' + actionsTaken);
                                          System.debug('additionalInfo: ' + additionalInfo);
                                          System.debug('futureActions: ' + futureActions);
                                          System.debug('participantValue: ' + participantValue);
                                          System.debug('subContractorValue: ' + subContractorValue);
                                          System.debug('selectedParticipant: ' + selectedParticipant);
                                          System.debug('selectedFacility: ' + selectedFacility);
                                          System.debug('selectedStaff: ' + selectedStaff);
                                          System.debug('selectedEmployee: ' + selectedEmployee);
                                          System.debug('most relevent others: ' + mostReleventOthers);
                                          Case newCase = new Case();
                                          
                                          newCase.Id = recordId;                                 
                                          /*newCase.First_Name__c = firstName;
                                          newCase.Last_Name__c = lastName;*/
                                          newCase.Client__c = clientId ;
                                           newCase.Facility__c = facilityId;
                                          newCase.Organization__c = organisationName;                                  
                                          //newCase.Role__c = role;
                                          newCase.StaffRole__c = role;
                                          newCase.Origin = 'Email';
                                          newCase.Email__c = email;
                                          newCase.Participant_Representative__c = participantValue;
                                          newCase.Sub_Contractor__c = subContractorValue;
                                          newCase.Participant_Name__c = selectedParticipant;
                                          newCase.Facility_Name_1__c    = selectedFacility;
                                          if(selectedStaff !=null && selectedStaff !=''){
                                              newCase.Assign_to__c = selectedStaff;
                                          }
                                          if(selectedEmployee !=null && selectedEmployee !=''){
                                               newCase.Assign_to_1__c = selectedEmployee;
                                          }
                                         
                                          newCase.Phone_Number__c = phone;
                                          newCase.Type_of_Issue__c='Own Org';
                                          newCase.Status_1__c = status;                                  
                                          newCase.Priority = priorityValue;
                                          newCase.Allegation__c = raisedByValue;
                                          newCase.Allegation_description__c = others;                                  
                                          newCase.Revelant_Issue_Type__c = issueTypeValue;
                                          System.debug('Revelant Issue>>'+newCase.Revelant_Issue_Type__c);                                  
                                          newCase.Description = description;
                                          newCase.Reported_to_the_Police__c = !String.isBlank(reportToPolice) ? reportToPolice : 'No';
                                          newCase.Police_Comments__c= policeComments;
                                          newCase.Regarding_the_Issue__c = regardingtheIssue;
                                          newCase.Description1__c   = actionsTaken;
                                          newCase.Description2__c = additionalInfo;
                                          newCase.Description3__c = futureActions;
                                          newCase.Date_of_Incident__c=incidentDate;
                                          newCase.Incident_Time__c=incidentTime; 
                                          newCase.Alleged_Date__c=allegedDate;
                                          newCase.Alleged_Time__c=allegedTime;
                                          newCase.Most_Relevant_Others__c=mostReleventOthers; 
                                          newCase.Signature__c = signature;
                                          newCase.Reviewer_Name__c = reviewerName;
                                          newCase.Designation__c = designation; 
                                          
                                          System.debug('First Name>>'+newCase.First_Name__c);
                                          System.debug('Last Name>>'+newCase.Last_Name__c);
                                          
                                          // If there are any changes, append to the history log
    if (!changes.isEmpty()) {
        String historyLog = existingCase.History_Log__c != null ? existingCase.History_Log__c : '[]';
        List<Map<String, String>> history = (List<Map<String, String>>) JSON.deserialize(historyLog, List<Map<String, String>>.class);

        User currentUser = [SELECT FirstName, LastName FROM User WHERE Id = :UserInfo.getUserId()];
    String userFullName = currentUser.FirstName + ' ' + currentUser.LastName;
    
    DateTime now = DateTime.now();
    String formattedDate = now.format('dd/MM/yyyy', 'en_US');
    String formattedTime = now.format('hh:mm a', 'en_US').toLowerCase(); // Example: 09:45 pm

    history.add(new Map<String, String>{
        'timestamp' => formattedDate + ' ' + formattedTime,
        'user' => userFullName,
        'action' => 'Edited Form',
        'changes' => String.join(changes, '; ')
    });
    
    
            // Update the History Log field
            newCase.History_Log__c = JSON.serialize(history);
        }
                                              update newCase;
                                              
                                              
                                              return newCase;
    }
    
    private static String normBlankToNull(String s) {
    return String.isBlank(s) ? null : s;
	}

    
    @AuraEnabled
    public static List<Lead> getLeads(){
        //System.debug('Orga Id>>'+orgId);
        return [Select Id,Name,Status,Company,Plan_End_Date__c,Plan_Start_Date__c,Billing_Per_user__c,Sales_Exec_First_Name__c,Referred_by_First_Name__c,Chief_of_Sales_Executive_First_Name__c,Sales_Exec_Last_Name__c,Referred_by_Last_Name__c,Chief_of_Sales_Executive_Last_Name__c,
                Account_Manager_Name__c,Reference_Name__c,Sales_Exec_Name__c,Amazon_Url__c from LEAD Order by createddate desc];
    }
    
    @AuraEnabled
    public static List<UserLicense> getUserLicense(){
        return [SELECT Id,Name, Status, TotalLicenses, UsedLicenses FROM UserLicense];
    }
    
    @AuraEnabled
    public static List<staff__c> getEmployeeData(String facilityid){
        System.debug('facilityid'+facilityid);
       // String orgId = CurrentUserOrganization.currentOrgId();
       // String organizationId = orgId.substring(0,15);
        User objUser = [ SELECT Organization_Name__c,Email FROM User WHERE Id = : UserInfo.getUserId() AND IsActive = TRUE ];
        System.debug('objUser detail : '+objUser);
        String email = objUser.Email;
        System.debug('getting email address :'+email);
       // string orgName = [Select id,Name from Organisation__c where name=:objUser.Organization_Name__c limit 1].Name; 
        List<User> listUsers = [ SELECT Organization_Name__c,Email FROM User WHERE Organization_Name__c =:objUser.Organization_Name__c AND IsActive = TRUE ];
        List<String> emailAddres = new List<String>();
        for(User u:listUsers){
            emailAddres.add(u.Email);
        }
        try {
            return [SELECT Id, Name,Last_Name__c,NameToDisplay__c, Display_Nickname__c, LastViewedDate,Contact_Number__c,Email_Address__c,Emergency_Phone_Number__c,Facility__c
             FROM staff__c WHERE Organization_Full_Name__c  =:objUser.Organization_Name__c AND Facility__c=:facilityid AND Email_Address__c =:emailAddres ORDER BY NameToDisplay__c ASC];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    @AuraEnabled
    public static User getUserDetails() {
        try {
            // Return current user's first and last name
            return [SELECT FirstName, LastName FROM User WHERE Id = :UserInfo.getUserId()];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=false)
    public static String getImageAsBase64(String refId) {
        if (String.isBlank(refId)) {
            throw new AuraHandledException('Missing refId');
        }

        // Query the document using refId
        List<Attachment> attachments = [SELECT Body FROM Attachment WHERE Id = :refId LIMIT 1];
        if (!attachments.isEmpty()) {
            Blob body = attachments[0].Body;
            return EncodingUtil.base64Encode(body);
        }

        // Try ContentVersion if Attachment is not found
        List<ContentVersion> versions = [SELECT VersionData FROM ContentVersion WHERE Id = :refId LIMIT 1];
        if (!versions.isEmpty()) {
            Blob body = versions[0].VersionData;
            return EncodingUtil.base64Encode(body);
        }

        throw new AuraHandledException('No image found for the given refId.');
    }
    
    @AuraEnabled
    public static String getCaseHistoryLog(Id caseId) {
        Case c = [SELECT History_Log__c FROM Case WHERE Id = :caseId LIMIT 1];
        return c.History_Log__c != null ? c.History_Log__c : '[]';
    }

    /* @AuraEnabled(cacheable=true)
    public static List<Case> getIncidents() {
        return [
            SELECT Client_Name__c, Facility_Name__c, First_Name__c,Last_Name__c,Assign_to_1__r.NameToDisplay__c,
                   Priority, Assign_to__c, CreatedDate, Status_1__c,CaseNumber
            FROM Case
            ORDER BY CreatedDate DESC
            LIMIT 100
        ];
    }  */
    
     @AuraEnabled(cacheable=true)
    public static List<Case> getIncidents(String userRole, Id currentUserId) {
        // Admin-type roles → return all
        if (userRole == 'Portal Account Partner Executive' ||
            userRole == 'CEO' ||
            userRole == 'Admin' || userRole == 'Portal Account Partner Manager') {

            return [
                SELECT Id, CaseNumber, Client_Name__c, Facility_Name__c,
                       First_Name__c, Last_Name__c,
                       Assign_to_1__r.NameToDisplay__c,
                       Priority, Assign_to__c,
                       CreatedDate, Status_1__c
                FROM Case
                ORDER BY CreatedDate DESC
                LIMIT 100
            ];

        } else {
            // Staff / Roster Admin → only their created or assigned records
            return [
                SELECT Id, CaseNumber, Client_Name__c, Facility_Name__c,
                       First_Name__c, Last_Name__c,
                       Assign_to_1__r.NameToDisplay__c,
                       Priority, Assign_to__c,
                       CreatedDate, Status_1__c
                FROM Case
                WHERE CreatedById = :currentUserId
                   OR Assign_to__c = :currentUserId
                ORDER BY CreatedDate DESC
                LIMIT 100
            ];
        }
    }

}