public class ShiftTypeTimings {
    
    @AuraEnabled
    public static List<Shift_Type__c> saveMultipleShifts(
        List<Map<String, Object>> shiftsData,
        List<Map<String, Object>> shiftsDataforown,
        List<Map<String, Object>> shiftsDataforcustom,
        Decimal costPerKmElectric,
        Decimal costPerKmFuel,
        Id facilityId
    ) {
        try {
            System.debug('shiftsDataforcustom >> ' + shiftsDataforcustom);
            System.debug('=== saveMultipleShifts START ===');
            
            // 1️⃣ Query the facility
            Facility__c facility = [
                SELECT Id, Name, Cost_per_Km_Electric__c, Cost_per_Km_Fuel__c
                FROM Facility__c
                WHERE Id = :facilityId
                LIMIT 1
            ];
            
            // 2️⃣ Update the cost fields
            if (costPerKmElectric != null) {
                facility.Cost_per_Km_Electric__c = costPerKmElectric;
            }
            if (costPerKmFuel != null) {
                facility.Cost_per_Km_Fuel__c = costPerKmFuel;
            }
            
            // 3️⃣ Save the update
            update facility;
            System.debug('🏢 Facility updated with new costs >> ' + facility);
            
            List<Shift_Type__c> shiftsToUpsert = new List<Shift_Type__c>();
            Map<Id, Shift_Type__c> existingShifts = new Map<Id, Shift_Type__c>();
            Set<Id> existingIds = new Set<Id>();
            
            // Collect IDs from Default + Own + Custom parents
            for (Map<String, Object> shiftData : (shiftsData != null ? shiftsData : new List<Map<String, Object>>())) {
                if (shiftData.get('Id') != null) existingIds.add((Id) shiftData.get('Id'));
            }
            for (Map<String, Object> shiftData : (shiftsDataforown != null ? shiftsDataforown : new List<Map<String, Object>>())) {
                if (shiftData.get('Id') != null) existingIds.add((Id) shiftData.get('Id'));
            }
            for (Map<String, Object> shiftData : (shiftsDataforcustom != null ? shiftsDataforcustom : new List<Map<String, Object>>())) {
                if (shiftData.get('salesforceId') != null) existingIds.add((Id) shiftData.get('salesforceId'));
            }
            
            // Query existing shifts by Id
            if (!existingIds.isEmpty()) {
                existingShifts.putAll([
                    SELECT Id, Name, Shift_Type__c, Start_Time__c, End_Time__c, Colour__c, Type_of_Shift__c, Facility__c,Duration__c
                    FROM Shift_Type__c
                    WHERE Id IN :existingIds
                ]);
            }
            
            // Default + Own
            shiftsToUpsert.addAll(buildShiftList(shiftsData, existingShifts, 'Default'));
            shiftsToUpsert.addAll(buildShiftList(shiftsDataforown, existingShifts, 'Own'));
            
            // --- CUSTOM SHIFT (Parent + Child) ---
            if (shiftsDataforcustom != null && !shiftsDataforcustom.isEmpty()) {
                System.debug('🔍 Received shiftsDataforcustom: ' + JSON.serialize(shiftsDataforcustom));
                
                List<Map<String, Object>> customGroups = coerceListOfMaps(shiftsDataforcustom);
                System.debug('📦 Coerced customGroups: ' + JSON.serialize(customGroups));
                
                List<Shift_Type__c> parentCustomShifts = new List<Shift_Type__c>();
                List<List<Map<String, Object>>> childrenPerGroup = new List<List<Map<String, Object>>>();
                
                for (Map<String, Object> rawGroup : customGroups) {
                    System.debug('➡️ Processing rawGroup: ' + JSON.serialize(rawGroup));
                    
                    Map<String, Object> grouprow = coerceMap(rawGroup);
                    System.debug('📄 Coerced grouprow: ' + JSON.serialize(grouprow));
                    
                    List<Map<String, Object>> childShifts = coerceListOfMaps(grouprow.get('shifts'));
                    System.debug('👶 Child shifts in this group: ' + JSON.serialize(childShifts));
                    
                    if (childShifts.isEmpty()) {
                        System.debug('⏩ Skipping group with no child shifts.');
                        continue;
                    }
                    
                    Map<String, Object> firstChild = pickFirstByDisplayIndex(childShifts);
                    Map<String, Object> lastChild  = pickLastByDisplayIndex(childShifts);
                    System.debug('🕐 First child: ' + JSON.serialize(firstChild));
                    System.debug('🕐 Last child : ' + JSON.serialize(lastChild));
                    
                    System.debug('🕐 salesforceId : ' + rawGroup.get('salesforceId'));
                    System.debug('🕐 salesforceId : ' + rawGroup.get('Id'));
                    System.debug('🕐 existingShifts : ' + rawGroup.get('existingShifts'));
                    
                    Shift_Type__c parent = (rawGroup.get('salesforceId') != null && existingShifts.containsKey((Id) rawGroup.get('salesforceId')))
                        ? existingShifts.get((Id) rawGroup.get('salesforceId'))
                        : new Shift_Type__c();
                    
                    System.debug('📂 Parent Shift before setting fields: ' + parent);
                    
                    parent.Name = (String) grouprow.get('customShiftName');
                    parent.Type_of_Shift__c = 'Custom';
                    parent.Shift_Type__c = 'Custom';
                    parent.Start_Time__c = parseTimeString(firstChild != null ? firstChild.get('startTime24') : null);
                    parent.End_Time__c   = parseTimeString(lastChild  != null ? lastChild.get('endTime24')  : null);
                    parent.Colour__c = (String) grouprow.get('selectedColor');
                    if (grouprow.containsKey('Facility__c')) {
                        parent.Facility__c = (String) grouprow.get('Facility__c');
                    }
                    
                    System.debug('✅ Parent Shift after setting fields: ' + parent);
                    
                    parentCustomShifts.add(parent);
                    childrenPerGroup.add(childShifts);
                }
                
                if (!parentCustomShifts.isEmpty()) {
                    System.debug('📢 Upserting Parent Custom Shifts: ' + JSON.serialize(parentCustomShifts));
                    
                    upsert parentCustomShifts;
                    
                    System.debug('🔄 Parent Custom Shifts after upsert (with Ids): ' + JSON.serialize(parentCustomShifts));
                    
                    // --- Handle Child Records ---
                    List<Custom_Shift_Timings__c> childRows = new List<Custom_Shift_Timings__c>();
                    
                    // 1️⃣ Collect all incoming Ids first (outside your main loop)
                    Set<Id> incomingIds = new Set<Id>();
                    for (List<Map<String, Object>> groupchildId : childrenPerGroup) {
                        for (Map<String, Object> child : groupchildId) {
                            if (child.containsKey('id') && child.get('id') != null) {
                                String idStr = String.valueOf(child.get('id'));
                                if (idStr.length() == 18 || idStr.length() == 15) {
                                    try {
                                        incomingIds.add((Id) idStr);
                                    } catch (Exception e) {
                                        // Ignore invalid Id formats
                                    }
                                }
                            }
                        }
                    }
                    
                    // 2️⃣ Query existing Custom_Shift_Timings__c records
                    Map<Id, Custom_Shift_Timings__c> existingMap = new Map<Id, Custom_Shift_Timings__c>(
                        [SELECT Id FROM Custom_Shift_Timings__c WHERE Id IN :incomingIds]
                    );
                    
                    system.debug('existingMap >>'+ existingMap);
                    
                    // 3️⃣ Now your main loop with existence check
                    for (Integer i = 0; i < parentCustomShifts.size(); i++) {
                        Id parentId = parentCustomShifts[i].Id;
                        System.debug('👪 Processing child shifts for parent: ' + parentId);
                        System.debug('👪 Processing child shifts for parent: ' + parentCustomShifts[i]);
                        
                        for (Map<String, Object> child : childrenPerGroup[i]) {
                            System.debug('📄 Raw child shift: ' + JSON.serialize(child));
                            System.debug('📄 Raw child shift (full): ' + JSON.serializePretty(child));
                            System.debug('👶 decimalHours: ' + child.get('duration'));
                            
                            Custom_Shift_Timings__c row = new Custom_Shift_Timings__c();
                            
                            Object incomingId = child.get('id');
                            String idStr = String.valueOf(incomingId);
                            if (idStr != null && idStr.length() >= 15 && idStr.length() <= 18 && Pattern.matches('^[a-zA-Z0-9]+$', idStr)) {
                                // Only process if it's a valid Salesforce Id format and exists in DB
                                if (existingMap.containsKey((Id) idStr)) {
                                    row.Id = (Id) idStr;
                                    System.debug('✏️ Updating existing child row Id: ' + row.Id);
                                }
                            } else {
                                System.debug('🆕 Creating new child row (invalid or missing Id) >> ' + idStr);
                            }
                            
                            row.Custom_Shift_Type__c = parentId;
                            row.Name          = stringOr(child.get('name'), (String) child.get('type'));
                            row.Shift_Type__c = (String) child.get('type');
                            row.Start_Time__c = parseTimeString(child.get('startTime24'));
                            row.End_Time__c   = parseTimeString(child.get('endTime24'));
                            row.Index__c      = Decimal.valueOf(String.valueOf(child.get('displayIndex')));
                            Object durationObj = child.get('duration');
                            if (durationObj != null) {
                                row.Duration__c = Decimal.valueOf(String.valueOf(durationObj));
                                row.Actual_Duration__c = Decimal.valueOf(String.valueOf(durationObj));
                            }
                            
                            
                            System.debug('✅ Prepared Child Row: ' + row);
                            
                            childRows.add(row);
                        }
                    }
                    
                    if (!childRows.isEmpty()) {
                        System.debug('📢 Upserting Child Shift Timings: ' + JSON.serialize(childRows));
                        upsert childRows;
                    } else {
                        System.debug('⚠️ No child rows to upsert.');
                    }
                    
                    shiftsToUpsert.addAll(parentCustomShifts);
                } else {
                    System.debug('⚠️ No parent custom shifts found to process.');
                }
            }
            
            // Final upsert for all shifts
            if (!shiftsToUpsert.isEmpty()) {
                upsert shiftsToUpsert;
            }
            
            System.debug('=== saveMultipleShifts END — Successfully processed shifts ===');
            return shiftsToUpsert;
            
        } catch (Exception e) {
            System.debug('❌ Error in saveMultipleShifts: ' + e.getMessage());
            throw new AuraHandledException('Error saving shifts: ' + e.getMessage());
        }
    }
    
    
    // --- EXISTING HELPERS ---
    private static List<Shift_Type__c> buildShiftList(
        List<Map<String, Object>> shiftDataList,
        Map<Id, Shift_Type__c> existingShifts,
        String typeOfShift
    ) {
        List<Shift_Type__c> result = new List<Shift_Type__c>();
        if (shiftDataList == null) return result;
        
        for (Map<String, Object> shiftData : shiftDataList) {
            Shift_Type__c shift = (shiftData.get('Id') != null && existingShifts.containsKey((Id) shiftData.get('Id')))
                ? existingShifts.get((Id) shiftData.get('Id'))
                : new Shift_Type__c();
            
            shift.Name = (String) shiftData.get('Name');
            shift.Shift_Type__c = (String) shiftData.get('Shift_Type__c');
            shift.Start_Time__c = parseTimeString(shiftData.get('Start_Time__c'));
            shift.End_Time__c = parseTimeString(shiftData.get('End_Time__c'));
            shift.Colour__c = (String) shiftData.get('Color__c');
            shift.Type_of_Shift__c = typeOfShift;
            shift.Duration__c = (Decimal) shiftData.get('Duration');
            shift.Actual_Duration__c = (Decimal) shiftData.get('DurationActual');
            if (shiftData.get('Facility__c') != null) {
                shift.Facility__c = (String) shiftData.get('Facility__c');
            }
            
            result.add(shift);
        }
        return result;
    }
    
    @AuraEnabled
    public static List<Shift_Type__c> getShiftsByFacility(String facilityId) {
        try {
            if (facilityId != null) {
                return [
                        SELECT Id, Name, Shift_Type__c, Start_Time__c, End_Time__c, Colour__c, Facility__c, Type_of_Shift__c,Duration__c,Actual_Duration__c,
                    (SELECT Id, Name, Custom_Shift_Type__c, End_Time__c,Index__c,Shift_Type__c,Start_Time__c,Duration__c,Actual_Duration__c 
                     FROM Custom_Shift_Timings__r ORDER BY Index__c ASC)
                    FROM Shift_Type__c
                    WHERE Facility__c = :facilityId
                    ORDER BY Shift_Type__c
                ];
            }
            return new List<Shift_Type__c>();
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving shifts: ' + e.getMessage());
        }
    }
    
    public static Time parseTimeString(Object rawTime) {
        if (rawTime == null) return null;
        
        if (rawTime instanceof Decimal || rawTime instanceof Integer || String.valueOf(rawTime).isNumeric()) {
            Long millis = Long.valueOf(String.valueOf(rawTime));
            if (millis < 86400) millis *= 1000;
            Integer totalSeconds = Integer.valueOf(millis / 1000);
            Integer hour = totalSeconds / 3600;
            Integer minute = Math.mod(totalSeconds, 3600) / 60;
            Integer second = Math.mod(totalSeconds, 60);
            return Time.newInstance(hour, minute, second, 0);
        }
        
        String timeStr = String.valueOf(rawTime).replace('Z', '');
        if (timeStr.contains('.')) {
            timeStr = timeStr.substring(0, timeStr.indexOf('.'));
        }
        List<String> parts = timeStr.split(':');
        Integer hour   = Integer.valueOf(parts[0]);
        Integer minute = (parts.size() > 1) ? Integer.valueOf(parts[1]) : 0;
        Integer second = (parts.size() > 2) ? Integer.valueOf(parts[2]) : 0;
        return Time.newInstance(hour, minute, second, 0);
    }
    
    // --- NEW HELPERS TO FIX Map<ANY,ANY> ISSUES ---
    private static Map<String, Object> coerceMap(Object anyMap) {
        if (anyMap == null) return new Map<String, Object>();
        return (Map<String, Object>) JSON.deserializeUntyped(JSON.serialize(anyMap));
    }
    
    private static List<Map<String, Object>> coerceListOfMaps(Object anyList) {
        List<Map<String, Object>> out = new List<Map<String, Object>>();
        if (anyList == null) return out;
        List<Object> listAny = (List<Object>) JSON.deserializeUntyped(JSON.serialize(anyList));
        for (Object item : listAny) {
            out.add(coerceMap(item));
        }
        return out;
    }
    
    private static Map<String, Object> pickFirstByDisplayIndex(List<Map<String, Object>> items) {
        Map<String, Object> pick = null;
        Integer best = 2147483647; // Apex max integer value
        for (Map<String, Object> m : items) {
            Integer idx = toInteger(m.get('displayIndex'));
            if (idx != null && idx < best) { 
                best = idx; 
                pick = m; 
            }
        }
        if (pick == null && !items.isEmpty()) pick = items[0];
        return pick;
    }
    
    private static Map<String, Object> pickLastByDisplayIndex(List<Map<String, Object>> items) {
        Map<String, Object> pick = null;
        Integer best = -2147483647 - 1; // ✅ resolves to MIN_VALUE at runtime
        for (Map<String, Object> m : items) {
            Integer idx = toInteger(m.get('displayIndex'));
            if (idx != null && idx > best) { 
                best = idx; 
                pick = m; 
            }
        }
        if (pick == null && !items.isEmpty()) pick = items[items.size() - 1];
        return pick;
    }    
    
    private static Integer toInteger(Object o) {
        if (o == null) return null;
        try { return Integer.valueOf(String.valueOf(o)); } catch (Exception e) { return null; }
    }
    
    private static String stringOr(Object a, String fallback) {
        String s = (a == null) ? null : String.valueOf(a);
        return String.isBlank(s) ? fallback : s;
    }
}