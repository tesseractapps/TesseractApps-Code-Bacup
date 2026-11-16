public with sharing class RosterStaffConflictController {

    @AuraEnabled
    public static Map<Id, StaffConflictWrapper> checkStaffConflicts(

        List<Id> staffIds,
        string startDate,
        string endDate,
        String startTimeStr,
        String endTimeStr,

        Id facilityId,
        String shiftRole,
        String shiftType,

        Id currentShiftId, 
        List<String> otherGroupShiftShiftIds

    ){

        Map<Id, StaffConflictWrapper> result = new Map<Id, StaffConflictWrapper>();
        if(staffIds == null || staffIds.isEmpty()){
            return result;
        }
        for(Id sid : staffIds){

            StaffConflictWrapper wrap =new StaffConflictWrapper();

            wrap.staffId = sid;
            wrap.conflicts =new List<ConflictDetail>();

            result.put(sid,wrap);
        }

        Time startTime;
        Time endTime;

        if(String.isNotBlank(startTimeStr)){

            List<String> startParts =startTimeStr.replace('Z','').split(':');
            startTime = Time.newInstance( Integer.valueOf(startParts[0]),Integer.valueOf(startParts[1]),Integer.valueOf(startParts[2]), 0 );
        }


        if(String.isNotBlank(endTimeStr)){
            List<String> endParts =endTimeStr.replace('Z','').split(':');
            endTime = Time.newInstance(Integer.valueOf(endParts[0]),Integer.valueOf(endParts[1]),Integer.valueOf(endParts[2]),0 );
        }
     
        // ===============================
        // STAFF DATA
        // ===============================

        Map<Id,Staff__c> staffMap = new Map<Id,Staff__c>(
            [SELECT Id, Set_Hours__c, Restrict_Set_Hours__c,Facility__r.Organisation__c FROM Staff__c WHERE Id IN:staffIds ]);

        // ===============================
        // STAFF ROLES
        // ===============================

        List<StaffRole__c> staffRoles =  [
            SELECT Id, StaffRole_To_Staff__c, Facility__c, RoleName__c FROM StaffRole__c  WHERE StaffRole_To_Staff__c IN:staffIds  AND Active__c = true
        ];

        Map<Id,Set<Id>> facilitiesByStaff = new Map<Id,Set<Id>>();
        Map<Id,Map<Id,Set<String>>> rolesByStaffFacility = new Map<Id,Map<Id,Set<String>>>();

        Set<Id> facilityIds = new Set<Id>();
        for(StaffRole__c sr : staffRoles){
            facilityIds.add(sr.Facility__c);
            if(!facilitiesByStaff.containsKey(sr.StaffRole_To_Staff__c)){
                facilitiesByStaff.put( sr.StaffRole_To_Staff__c, new Set<Id>());
            }
            facilitiesByStaff.get(sr.StaffRole_To_Staff__c).add(sr.Facility__c);
            if(!rolesByStaffFacility.containsKey(sr.StaffRole_To_Staff__c)){
                rolesByStaffFacility.put(  sr.StaffRole_To_Staff__c, new Map<Id,Set<String>>()
                );
            }


            if( !rolesByStaffFacility.get(sr.StaffRole_To_Staff__c).containsKey(sr.Facility__c) ){
                rolesByStaffFacility.get(sr.StaffRole_To_Staff__c).put( sr.Facility__c,new Set<String>());
            }
            rolesByStaffFacility.get(sr.StaffRole_To_Staff__c).get(sr.Facility__c).add(sr.RoleName__c);

        }



        // ===============================
        // RUN VALIDATORS
        // ===============================


        checkDocuments(staffIds,staffMap,facilitiesByStaff,rolesByStaffFacility, facilityIds,facilityId, shiftRole, result, Date.valueOf(startDate));

        System.debug('===== CHECK SHIFT OVERLAP INPUT START =====');

        System.debug('staffIds => ' + staffIds);
        System.debug('startDate => ' + Date.valueOf(startDate));
        System.debug('endDate => ' +  Date.valueOf(endDate));

        System.debug('startTimeStr => ' + startTimeStr);
        System.debug('endTimeStr => ' + endTimeStr);

        System.debug('Converted startTime => ' + startTime);
        System.debug('Converted endTime => ' + endTime);

        System.debug('currentShiftId => ' + currentShiftId);

        System.debug('result null? => ' + (result == null));

        System.debug('===== CHECK SHIFT OVERLAP INPUT END =====');

        checkShiftOverlap( staffIds, DateTime.newInstance( Date.valueOf(startDate), startTime),DateTime.newInstance( Date.valueOf(endDate), endTime ),currentShiftId, otherGroupShiftShiftIds, result);

        checkSetHours(
                staffIds,
                staffMap,
                Date.valueOf(startDate),
                Date.valueOf(endDate),
                startTime,
                endTime,
                shiftType,
                currentShiftId,
                otherGroupShiftShiftIds,
                result
            );
        return result;

    }




    // =========================
    // WRAPPERS
    // =========================


    public class StaffConflictWrapper {


        @AuraEnabled
        public Id staffId;


        @AuraEnabled
        public Integer count {

            get{
                return conflicts == null
                    ? 0
                    : conflicts.size();
            }
        }


        @AuraEnabled
        public List<ConflictDetail> conflicts;

    }

    // ===========================================
// DOCUMENT + COMPLIANCE VALIDATION
// ===========================================

public static void checkDocuments( List<Id> staffIds, Map<Id,Staff__c> staffMap, Map<Id,Set<Id>> facilitiesByStaff,Map<Id,Map<Id,Set<String>>> rolesByStaffFacility,Set<Id> facilityIds, Id shiftFacilityId, String shiftRole,Map<Id,StaffConflictWrapper> result,Date currentDate){


    // ===============================
    // COMPLIANCE SETTINGS
    // ===============================

    List<Facility_Compliance_Setting__c> settings =
    [ SELECT Id,Facility__c,Facility__r.Name, Organisation__c,Roles__c, Org_Roles__c,Document_Name__c FROM Facility_Compliance_Setting__c
        WHERE ( Facility__c IN:facilityIds OR ( Organisation__c != null AND Org__c = true )) AND Mandatory_Document__c = true AND Visible_to_Staff__c = true];

    Map<Id,Map<String,Set<String>>> mandatoryDocsByFacilityRole = new Map<Id,Map<String,Set<String>>>();

    Map<Id,Map<String,Set<String>>> mandatoryDocsByOrgRole =new Map<Id,Map<String,Set<String>>>();

    Map<Id,String> facilityNameById = new Map<Id,String>();



    for(Facility_Compliance_Setting__c fc : settings){


        if(fc.Facility__c != null){

            facilityNameById.put(
                fc.Facility__c,fc.Facility__r.Name
            );
        }
        // FACILITY LEVEL
        if( fc.Facility__c != null &&String.isNotBlank(fc.Roles__c) ){

            for(String roleName : fc.Roles__c.split('[,;]')){

                roleName = roleName.trim();
                if(!mandatoryDocsByFacilityRole.containsKey(fc.Facility__c)){
                    mandatoryDocsByFacilityRole.put( fc.Facility__c,new Map<String,Set<String>>() );
                }

                if( !mandatoryDocsByFacilityRole.get(fc.Facility__c).containsKey(roleName)){  mandatoryDocsByFacilityRole.get(fc.Facility__c).put( roleName, new Set<String>());
                }

                mandatoryDocsByFacilityRole.get(fc.Facility__c).get(roleName).add(fc.Document_Name__c);

            }

        }


        // ORG LEVEL

        if( fc.Organisation__c != null && String.isNotBlank(fc.Org_Roles__c) ){


            for(String roleName : fc.Org_Roles__c.split('[,;]')){


                roleName = roleName.trim();



                if(!mandatoryDocsByOrgRole.containsKey(fc.Organisation__c)){

                    mandatoryDocsByOrgRole.put(
                        fc.Organisation__c,
                        new Map<String,Set<String>>()
                    );
                }



                if(
                    !mandatoryDocsByOrgRole
                    .get(fc.Organisation__c)
                    .containsKey(roleName)
                ){

                    mandatoryDocsByOrgRole
                    .get(fc.Organisation__c)
                    .put(
                        roleName,
                        new Set<String>()
                    );
                }


                mandatoryDocsByOrgRole
                .get(fc.Organisation__c)
                .get(roleName)
                .add(fc.Document_Name__c);

            }
        }

    }



    // ===============================
    // STAFF DOCUMENTS
    // ===============================


    List<Child_Staff__c> docs =
    [
        SELECT Id,
               Staff__c,
               Document_Type__c,
               Expiry_Date__c,
               Status__c,
               Compliance__c
        FROM Child_Staff__c
        WHERE Staff__c IN:staffIds AND Is_Archived__c =false
    ];



    Map<Id,Set<String>> submittedDocsByStaff =
        new Map<Id,Set<String>>();


    Map<Id,List<Child_Staff__c>> docsByStaff =
        new Map<Id,List<Child_Staff__c>>();



    for(Child_Staff__c d : docs){


        if(!submittedDocsByStaff.containsKey(d.Staff__c)){

            submittedDocsByStaff.put(
                d.Staff__c,
                new Set<String>()
            );
        }


        submittedDocsByStaff
        .get(d.Staff__c)
        .add(d.Document_Type__c);



        if(!docsByStaff.containsKey(d.Staff__c)){

            docsByStaff.put(
                d.Staff__c,
                new List<Child_Staff__c>()
            );
        }


        docsByStaff.get(d.Staff__c).add(d);

    }




    // ===============================
    // VALIDATE EACH STAFF
    // ===============================


    for(Id staffId : staffIds){


        Set<String> submitted =
            submittedDocsByStaff.containsKey(staffId)
            ? submittedDocsByStaff.get(staffId)
            : new Set<String>();


        // ============================
        // FACILITY + ROLE PASSED
        // ============================

        if(
            shiftFacilityId != null &&
            String.isNotBlank(shiftRole)
        ){


            if(
            mandatoryDocsByFacilityRole
            .containsKey(shiftFacilityId)
            ){


                Map<String,Set<String>> roleDocs =
                    mandatoryDocsByFacilityRole
                    .get(shiftFacilityId);



                if(roleDocs.containsKey(shiftRole)){


                    for(
                        String requiredDoc :
                        roleDocs.get(shiftRole)
                    ){


                        if(!submitted.contains(requiredDoc)){


                            String facilityName =
                            facilityNameById.containsKey(shiftFacilityId)
                            ? facilityNameById.get(shiftFacilityId)
                            : 'selected facility';



                            result.get(staffId)
                            .conflicts.add(

                                new ConflictDetail(

                                'Compliance',
                                'Error',

                                '<b>'+requiredDoc+
                                '</b> document is required for facility <b>'+
                                facilityName+
                                '</b>'

                                )
                            );

                        }
                    }
                }
            }
        }



                        // ============================
                    // ORG LEVEL
                    // ============================

                    Id orgId = staffMap.get(staffId).Facility__r.Organisation__c;

                    if (
                        orgId != null &&
                        !String.isBlank(shiftRole) &&
                        mandatoryDocsByOrgRole.containsKey(orgId)
                    ) {

                        Map<String, Set<String>> roleDocs = mandatoryDocsByOrgRole.get(orgId);

                        if (roleDocs.containsKey(shiftRole)) {

                            for (String requiredDoc : roleDocs.get(shiftRole)) {

                                if (!submitted.contains(requiredDoc)) {

                                    result.get(staffId).conflicts.add(
                                        new ConflictDetail(
                                            'Compliance',
                                            'Error',
                                            '<b>' + requiredDoc + '</b> organisation level document is required'
                                        )
                                    );
                                }
                            }
                        }
                    }




        // ============================
        // EXPIRED / PENDING / REJECTED
        // ============================


        if(docsByStaff.containsKey(staffId)){


            for(Child_Staff__c d :
                docsByStaff.get(staffId)
            ){


                String name =
                '<b>'+d.Document_Type__c+'</b>';



                if(
                d.Expiry_Date__c != null &&
                d.Expiry_Date__c <= currentDate &&
                d.Compliance__c == true
                ){

                    result.get(staffId)
                    .conflicts.add(

                    new ConflictDetail(
                    'Expired Document',
                    'Error',
                    name+' has expired.'
                    ));

                }



                if(d.Status__c == 'Pending'){


                    result.get(staffId)
                    .conflicts.add(

                    new ConflictDetail(
                    'Document',
                    'Warning',
                    name+' is awaiting approval.'
                    ));

                }



                if(d.Status__c == 'Rejected'){


                    result.get(staffId).conflicts.add(

                    new ConflictDetail( 'Document', 'Error',name+' was rejected.' ));

                }

            }
        }

    }

}

// =====================================================
// SHIFT OVERLAP VALIDATION
// =====================================================

public static void checkShiftOverlap(

    List<Id> staffIds,

    DateTime proposedStart,
    DateTime proposedEnd,

    Id currentShiftId,
   List<String> otherGroupShiftShiftIds,
    Map<Id,StaffConflictWrapper> result
){


    List<ShiftwithStaff__c> shifts = [ SELECT Id, Staff__c, Role__c, Add_Shift__r.Facility__r.Name, Start_Date__c, Shift_End_Date__c,Shift_Start_Time__c, Shift_End_Time__c

        FROM ShiftwithStaff__c WHERE Staff__c IN:staffIds  AND Shift_Rejected__c !=true AND ( (Status__c = 'Draft' AND Attendence__c = false) OR  (Status__c != 'Unassigned' AND Attendence__c = true)) ];
 


    for(ShiftwithStaff__c sh : shifts){


        if((currentShiftId != null && sh.Id == currentShiftId) ||
            (otherGroupShiftShiftIds != null &&
            otherGroupShiftShiftIds.contains(String.valueOf(sh.Id)))
        ){
            continue;
        }



        DateTime existingStart =
            getShiftStartDateTime(sh);


        DateTime existingEnd =
            getShiftEndDateTime(sh);



        if(
            existingStart != null &&
            existingEnd != null &&
            isShiftOverlap(
                proposedStart,
                proposedEnd,
                existingStart,
                existingEnd
            )
        ){


            String msg =
                existingStart.format('hh:mm a')+
                ' - '+
                existingEnd.format('hh:mm a')+
                '<br/>'+
                sh.Role__c+
                '<br/>'+
                (
                    sh.Add_Shift__r.Facility__r != null
                    ? sh.Add_Shift__r.Facility__r.Name
                    : ''
                );



            result.get(sh.Staff__c)
            .conflicts.add(

                new ConflictDetail(
                    'Shift Overlap',
                    'Warning',
                    msg
                )

            );

        }

    }

}





// =====================================================
// SET HOURS VALIDATION
// =====================================================

public static void checkSetHours(

    List<Id> staffIds,

    Map<Id,Staff__c> staffMap,

    Date startDate,
    Date endDate,

    Time startTime,
    Time endTime,

    String shiftType,

    Id currentShiftId,
    List<String> otherGroupShiftShiftIds,

    Map<Id,StaffConflictWrapper> result
){


    Boolean isSleepoverShift =
        shiftType == 'Sleepover Shift';


    Integer dayOfWeek =
        Integer.valueOf(
            DateTime.newInstance(
                startDate,
                Time.newInstance(0,0,0,0)
            ).format('u')
        );


    Boolean isWeekend =
        (
            dayOfWeek == 6 ||
            dayOfWeek == 7
        );


    if(isWeekend || isSleepoverShift){
        return;
    }



    // ===========================================
    // GET ORGANISATION WEEK START
    // ===========================================

    User objUser = [
        SELECT Organization_Name__c
        FROM User
        WHERE Id = :UserInfo.getUserId()
    ];


    String organisationStartDay = [
        SELECT Week_Start_Day__c
        FROM Organisation__c
        WHERE Name = :objUser.Organization_Name__c
        LIMIT 1
    ].Week_Start_Day__c;



    Date weekStart =
        RosterCreation.getCustomWeekStart(
            startDate,
            organisationStartDay
        );


    Date weekEnd =
        weekStart.addDays(6);



    System.debug('Week Start => '+weekStart);
    System.debug('Week End => '+weekEnd);



    // ===========================================
    // EXISTING SHIFT QUERY
    // ===========================================


    Date queryStartDate = weekStart;
    Date queryEndDate = weekEnd;



    String hoursShiftQuery =

        'SELECT Id,'+
        ' Staff__c,'+
        ' Start_Date__c,'+
        ' Staff__r.Name,'+   // add this
        ' Shift_End_Date__c,'+
        ' Shift_Start_Time__c,'+
        ' Shift_End_Time__c,'+
        ' Date__c,'+
        ' End_Date__c,'+
        ' Start_Time__c,'+
        ' End_Time__c,'+
        ' Duration__c,'+
        ' Type_of_Shift__c,'+
        ' Attendence__c,'+
        ' Status__c '+

        ' FROM ShiftwithStaff__c '+

        ' WHERE Staff__c IN :staffIds '+

        ' AND ( '+

        ' (Start_Date__c <= :queryEndDate '+
        ' AND Shift_End_Date__c >= :queryStartDate) '+

        ' OR '+

        ' (Date__c <= :queryEndDate '+
        ' AND End_Date__c >= :queryStartDate) '+

        ' ) '+

        ' AND Shift_Rejected__c != true '+

        ' AND Type_of_Shift__c != \'Sleepover Shift\' '+


        ' AND ( '+

        ' (Status__c = \'Draft\' '+
        ' AND Attendence__c = false) '+

        ' OR '+

        ' (Status__c != \'Unassigned\' '+
        ' AND Attendence__c = true) '+

        ' ) ';



    if(currentShiftId != null){

        hoursShiftQuery +=
            ' AND Id != :currentShiftId ';
    }
    if(otherGroupShiftShiftIds != null && !otherGroupShiftShiftIds.isEmpty()){
        hoursShiftQuery += ' AND Id NOT IN :otherGroupShiftShiftIds ';
    }



    List<ShiftwithStaff__c> weekShifts =
        Database.query(hoursShiftQuery);
       /*  System.debug('===== EXISTING WEEK SHIFTS START =====');

        Id debugStaffId = 'a03Bo00000a2QxzIAE';

        for(ShiftwithStaff__c sh : weekShifts){

            if(sh.Staff__c == debugStaffId){

                System.debug(
                    'Shift Id => ' + sh.Id +
                    ' | Staff Id => ' + sh.Staff__c +
                    ' | Staff Name => ' + (sh.Staff__r != null ? sh.Staff__r.Name : '') +
                    ' | Start Date => ' + sh.Start_Date__c +
                    ' | End Date => ' + sh.Shift_End_Date__c +
                    ' | Status => ' + sh.Status__c +
                    ' | Attendance => ' + sh.Attendence__c +
                    ' | Type => ' + sh.Type_of_Shift__c +
                    ' | Duration => ' + sh.Duration__c
                );

            }

        }

        System.debug('===== EXISTING WEEK SHIFTS END =====');


    System.debug(
        'Existing shifts count => '+
        weekShifts.size()
    );
 */


    // ===========================================
    // CALCULATE EXISTING HOURS
    // ===========================================


    Map<Id,Map<Date,List<ShiftwithStaff__c>>> hoursMap =
        RosterCreation.organizeShiftsByStaffAndDate(
            weekShifts
        );
       



    Map<String,Date> weekStartMap =
        new Map<String,Date>();


    weekStartMap.put(
        'CURRENT',
        weekStart
    );



    Map<String,Date> weekEndMap =
        new Map<String,Date>();


    weekEndMap.put(
        'CURRENT',
        weekEnd
    );



    Map<Id,Map<String,Decimal>> existingHours =
        calculateExistingWeeklyHours(

            staffIds,

            hoursMap,

            weekStartMap,

            weekEndMap

        );




    // ===========================================
    // CURRENT SHIFT HOURS
    // ===========================================


    Decimal proposedHours =
        calculateShiftDuration(

            startDate,

            startTime,

            endDate,

            endTime
        );



    System.debug(
        'Proposed Shift Hours => '+
        proposedHours
    );



    // ===========================================
    // VALIDATE STAFF
    // ===========================================


    for(Id staffId : staffIds){



        Staff__c staff =
            staffMap.get(staffId);



        if(
            staff != null &&
            staff.Restrict_Set_Hours__c == true &&
            staff.Set_Hours__c > 0
        ){



            Decimal currentHours =
                existingHours.containsKey(staffId)
                ?
                existingHours.get(staffId).get('CURRENT')
                :
                0;



            Decimal totalHours =
                currentHours + proposedHours;



            System.debug(
                'Staff => '+staffId+
                ' Existing Hours => '+currentHours+
                ' Proposed => '+proposedHours+
                ' Total => '+totalHours+
                ' Limit => '+staff.Set_Hours__c
            );



            if(
                totalHours >
                staff.Set_Hours__c
            ){


                result.get(staffId)
                .conflicts.add(

                    new ConflictDetail(

                        'Set Hours',

                        'Error',

                        'Set Hours: <b>'+
                        staff.Set_Hours__c+
                        ' hrs</b><br/>'+
                        'Current Hours: <b>'+
                        totalHours+
                        ' hrs</b>'

                    )

                );

            }

        }

    }

}

// =====================================================
// EXISTING WEEKLY HOURS
// SAME AS YOUR OLD METHOD
// =====================================================


public static Map<Id, Map<String, Decimal>> calculateExistingWeeklyHours(
    List<Id> staffIds,
    Map<Id, Map<Date,List<ShiftwithStaff__c>>> hoursShiftsByStaffDate,
    Map<String,Date> weekStartMap,
    Map<String,Date> weekEndMap
){

    Map<Id,Map<String,Decimal>> result = new Map<Id,Map<String,Decimal>>();

    Id debugStaffId = 'a03Bo00000a2QxzIAE';

    System.debug('===== calculateExistingWeeklyHours START =====');

    for(Id staffId : staffIds){

        if(staffId == debugStaffId){
            System.debug('DEBUG STAFF FOUND => ' + staffId);
            System.debug('Week Start Map => ' + weekStartMap);
            System.debug('Week End Map => ' + weekEndMap);
        }

        result.put(staffId,new Map<String,Decimal>());

        for(String weekKey : weekStartMap.keySet()){
            result.get(staffId).put(weekKey,0);
        }


        if(hoursShiftsByStaffDate.containsKey(staffId)){

            if(staffId == debugStaffId){
                System.debug('Staff Shift Dates => ' + hoursShiftsByStaffDate.get(staffId).keySet());
            }


            for(Date d : hoursShiftsByStaffDate.get(staffId).keySet()){


                Integer dow = Integer.valueOf(DateTime.newInstance(d,Time.newInstance(0,0,0,0)).format('u'));


                if(staffId == debugStaffId){
                    System.debug('Checking Date => ' + d + ' | Day => ' + dow);
                }


                if(dow == 6 || dow == 7){

                    if(staffId == debugStaffId){
                        System.debug('Skipping weekend => ' + d);
                    }

                    continue;
                }


                String weekKey = findWeekKeyForDate(d,weekStartMap);


                if(staffId == debugStaffId){
                    System.debug('Week Key Found => ' + weekKey);
                }


                if(weekKey != null){


                    for(ShiftwithStaff__c sh : hoursShiftsByStaffDate.get(staffId).get(d)){


                        Decimal duration = sh.Duration__c != null ? sh.Duration__c : 0;


                        Decimal beforeHours = result.get(staffId).get(weekKey);


                        if(staffId == debugStaffId){

                            System.debug(
                                'Adding Shift => ' + sh.Id +
                                ' | Date => ' + sh.Start_Date__c +
                                ' | Duration => ' + duration +
                                ' | Before Total => ' + beforeHours
                            );

                        }


                        result.get(staffId).put(weekKey,beforeHours + duration);


                        if(staffId == debugStaffId){

                            System.debug(
                                'After Total => ' +
                                result.get(staffId).get(weekKey)
                            );

                        }

                    }

                }

            }

        }
        else{

            if(staffId == debugStaffId){
                System.debug('No shifts found in hours map for staff');
            }

        }


        if(staffId == debugStaffId){
            System.debug('FINAL HOURS FOR STAFF => ' + result.get(staffId));
        }

    }


    System.debug('===== calculateExistingWeeklyHours END =====');

    return result;

}






// =====================================================
// HELPERS
// =====================================================


public static Boolean isShiftOverlap(
    DateTime aStart,
    DateTime aEnd,
    DateTime bStart,
    DateTime bEnd
){

    return
        aStart < bEnd &&
        aEnd > bStart;

}



public static DateTime getShiftStartDateTime(
    ShiftwithStaff__c sh
){

    return DateTime.newInstance(
        sh.Start_Date__c,
        sh.Shift_Start_Time__c
    );

}



public static DateTime getShiftEndDateTime(
    ShiftwithStaff__c sh
){

    return DateTime.newInstance(
        sh.Shift_End_Date__c,
        sh.Shift_End_Time__c
    );

}



public static String findWeekKeyForDate(

    Date d,

    Map<String,Date> weekStartMap

){

    for(String key:weekStartMap.keySet()){

        Date start =
            weekStartMap.get(key);


        if(
            d >= start &&
            d <= start.addDays(6)
        ){
            return key;
        }

    }


    return null;
}





public static Decimal calculateShiftDuration(

    Date startDate,
    Time startTime,

    Date endDate,
    Time endTime
){

    DateTime s =
        DateTime.newInstance(
            startDate,
            startTime
        );


    DateTime e =
        DateTime.newInstance(
            endDate,
            endTime
        );



    Decimal hours =
        Decimal.valueOf(
            e.getTime() - s.getTime()
        )
        /
        (1000*60*60);



    return hours.setScale(2);

}



    public class ConflictDetail {


        @AuraEnabled
        public String type;


        @AuraEnabled
        public String severity;


        @AuraEnabled
        public String message;



        public ConflictDetail( String t, String s, String m ){
            type=t;
            severity=s;
            message=m;
        }
    }
   
}