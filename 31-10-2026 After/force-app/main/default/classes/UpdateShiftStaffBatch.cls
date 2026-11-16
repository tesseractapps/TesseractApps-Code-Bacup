global class UpdateShiftStaffBatch implements Database.Batchable<SObject> {
    
    global Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator([
            SELECT Id FROM Add_Shift__c WHERE Id != null
        ]);
    }

    global void execute(Database.BatchableContext bc, List<Add_Shift__c> scope) {
        List<Add_Shift__c> parents = [
            SELECT Id, Start_Date__c, Start_Time__c, End_Time__c, End_Date__c,
                   Get_Facility__c, Participant_Address_checkbox__c,
                   Location__Street__s, Location__City__s, Location__StateCode__s,
                   Location__PostalCode__s, Location__Latitude__s, Location__Longitude__s,
                   Location__CountryCode__s, Duration__c, Break__c, Shift_Name__c, Shift_Type__c,
                   (SELECT Id FROM ShiftwithStaffs__r)
            FROM Add_Shift__c WHERE Id IN :scope
        ];
        
        List<ShiftwithStaff__c> updates = new List<ShiftwithStaff__c>();
        
        for (Add_Shift__c p : parents) {
            for (ShiftwithStaff__c c : p.ShiftwithStaffs__r) {
                c.Start_Date__c = p.Start_Date__c;
                c.Shift_End_Date__c = p.End_Date__c;
                c.Shift_Start_Time__c = p.Start_Time__c;
                c.Shift_End_Time__c = p.End_Time__c;
                c.Shift_Address__Street__s = p.Location__Street__s;
                c.Shift_Address__City__s = p.Location__City__s;
                c.Shift_Address__StateCode__s = p.Location__StateCode__s;
                c.Shift_Address__PostalCode__s = p.Location__PostalCode__s;
                c.Shift_Address__CountryCode__s = p.Location__CountryCode__s;
                c.Shift_Address__Latitude__s = p.Location__Latitude__s;
                c.Shift_Address__Longitude__s = p.Location__Longitude__s;
                
                if (p.Participant_Address_checkbox__c)
                    c.Type_of_Address__c = 'Participant';
                else if (p.Get_Facility__c && !p.Participant_Address_checkbox__c)
                    c.Type_of_Address__c = 'New';
                else
                    c.Type_of_Address__c = 'Facility';
                
                c.Shift_Day_Name__c = p.Shift_Name__c;
                c.Shift_Calculated_Duration__c = p.Duration__c;
                c.Shift_Break__c = (p.Break__c == '30') ? 0.5 : 0;
                c.Shift_Name__c = p.Shift_Name__c;
                c.Shift_Category__c = p.Shift_Type__c;
                
                updates.add(c);
            }
        }
        
        if (!updates.isEmpty()) {
            update updates;
        }
    }

    global void finish(Database.BatchableContext bc) {
        System.debug('✅ Batch update complete.');
    }
}