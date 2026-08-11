public with sharing class AdminPaginationController {

    public class StaffPaginationWrapper {
        @AuraEnabled public List<Staff__c> records;
        @AuraEnabled public Integer totalRecords;
    }

    /*@AuraEnabled(cacheable=true)
    public static StaffPaginationWrapper fetchStaffPaginatedData(
        String searchText,
        String facilityId,
        Integer pageSize,
        Integer pageNumber,
        Boolean isActive
    ){
        StaffPaginationWrapper result = new StaffPaginationWrapper();

        List<String> filters = new List<String>();

        // 🔹 STEP 1: Build matching Ids (for global search)
        Set<Id> matchedIds = new Set<Id>();

        if(String.isNotBlank(searchText)){
            String searchLike = '%' + searchText + '%';

            // 🔍 Parent fields
           for (Staff__c s : [
                    SELECT Id
                    FROM Staff__c
                    WHERE (
                        Display_Nickname__c LIKE :searchLike
                        OR Contact_Number__c LIKE :searchLike
                    )
                    AND 
                       
                        Id IN (
                            SELECT Staff__c
                            FROM Staff_Facility__c
                            WHERE Active__c = true
                            AND Facility__c = :facilityId
                        )
                    
                ]) {
                    matchedIds.add(s.Id);
                }

            // 🎭 Role match
            for(StaffRole__c sr : [
                SELECT StaffRole_To_Staff__c FROM StaffRole__c
                WHERE Active__c = true AND RoleName__c LIKE :searchLike AND Facility__c =:facilityId
            ]){
                if(sr.StaffRole_To_Staff__c != null){
                    matchedIds.add(sr.StaffRole_To_Staff__c);
                }
            }

            // 🏢 Facility name match
            for(Staff_Facility__c sf : [
                SELECT Staff__c FROM Staff_Facility__c
                WHERE Active__c = true AND Facility__r.Name LIKE :searchLike
            ]){
                if(sf.Staff__c != null){
                    matchedIds.add(sf.Staff__c);
                }
            }

            // Apply filter
            if(!matchedIds.isEmpty()){
                filters.add('Id IN :matchedIds');
            } else {
                filters.add('Id = null'); // no results
            }
        }

        // 🏢 Facility filter (ONLY semi-join in main query)


        // ✅ Status filter
        if (isActive != null) {
            filters.add('Status__c = :isActive');
        }

        // 🔹 Base query
       String baseQuery = 
        ' FROM Staff__c WHERE Id IN (' +
        'SELECT Staff__c FROM Staff_Facility__c ' +
        'WHERE Active__c = true AND Facility__c != null AND Facility__c = :facilityId' +
        ')';

        // Add additional filters dynamically
        if(filters.size() > 0){
            baseQuery += ' AND ' + String.join(filters, ' AND ');
        }
        // 🔹 COUNT
        String countQuery = 'SELECT COUNT() ' + baseQuery;
        result.totalRecords = Database.countQuery(countQuery);
 
        // 🔹 Pagination
        Integer offsetVal = (pageNumber - 1) * pageSize;

        // 🔥 FULL DATA QUERY (UNCHANGED)
        String dataQuery =
            'SELECT id,Facility__r.Name,Facility__r.Id,Manager__c,User_Type__c,NameToDisplay__c,' +
            'Display_Nickname__c,Facility_Name__c,CreatedBy.Name,Type_of_User__c,Staff_Status__c,' +
            'Status__c,Organization_Name__c,Last_Name__c ,Name,picture__c,Facility__c,Contact_Number__c,' +
            'Amazon_URL__c,address__Street__s,address__City__s,address__StateCode__s,' +
            'Address__CountryCode__s,Address__PostalCode__s,AddressData__c,Pre_Tax_Calculator__c,' +
            'Pre_Tax_One_Description__c,Pre_Tax_One_Value__c,Pre_Tax_Two_Description__c,' +
            'Pre_Tax_Two_Value__c,Pre_Tax_Three_Description__c,Pre_Tax_Three_Value__c,' +
            'Pre_Tax_Four_Description__c,Pre_Tax_Four_Value__c,Pre_Tax_Five_Description__c,' +
            'Pre_Tax_Five_Value__c,Post_Tax__c,Post_Tax_Decription__c,Make_Primary_as_Approver__c,' +
            'Make_Secondary_as_Approver__c,Voluntary_Contribution__c,Voluntary_Contribution_Fixed__c,' +
            'Annual_Leave__c,Sick_Leave__c,Parental_Leave__c,Bereavement_Leave__c,' +
            'Voluntary_Contribution_Percent__c,Email_Address__c,Set_Hours__c,Role__c,' +

            '(SELECT Id, RoleName__c, Active__c FROM StaffRoles__r WHERE Active__c = TRUE),' +

            '(SELECT id,Name,Type__c,Expiry_Date__c,View_File__c,Comments__c,Document_Type__c FROM Child_Staffs__r),' +

            '(SELECT Id,Facility__c,Facility__r.Name, Active__c,Staff__c FROM Staff_Facilities__r WHERE Active__c = true) ' +

            baseQuery +
            ' ORDER BY Display_Nickname__c ASC ' +
            ' LIMIT :pageSize OFFSET :offsetVal';

        result.records = Database.query(dataQuery);

        return result;
    }*/

    @AuraEnabled(cacheable=true)
    public static StaffPaginationWrapper fetchStaffPaginatedData(
        String searchText,
        String facilityId,
        Integer pageSize,
        Integer pageNumber,
        Boolean isActive,
        String sortField,
        String sortDirection
    ){
        System.debug('================ START fetchStaffPaginatedData ================');
        System.debug('searchText => ' + searchText);
        System.debug('facilityId => ' + facilityId);
        System.debug('pageSize => ' + pageSize);
        System.debug('pageNumber => ' + pageNumber);
        System.debug('isActive => ' + isActive);

        StaffPaginationWrapper result = new StaffPaginationWrapper();

        List<String> filters = new List<String>();

        Set<Id> matchedIds = new Set<Id>();

        if(String.isNotBlank(searchText)){
            String searchLike = '%' + searchText + '%';

            System.debug('searchLike => ' + searchLike);

            // Parent Search
            for (Staff__c s : [
                SELECT Id
                FROM Staff__c
                WHERE (
                    Display_Nickname__c LIKE :searchLike
                    OR Contact_Number__c LIKE :searchLike
                )
                AND Id IN (
                    SELECT Staff__c
                    FROM Staff_Facility__c
                    WHERE Active__c = true
                    AND Facility__c = :facilityId
                )
            ]) {
                matchedIds.add(s.Id);
            }

            System.debug('Matched IDs After Staff Search => ' + matchedIds);

            // Role Search
            for(StaffRole__c sr : [
                SELECT StaffRole_To_Staff__c
                FROM StaffRole__c
                WHERE Active__c = true
                AND RoleName__c LIKE :searchLike
                AND Facility__c = :facilityId
            ]){
                if(sr.StaffRole_To_Staff__c != null){
                    matchedIds.add(sr.StaffRole_To_Staff__c);
                }
            }

            System.debug('Matched IDs After Role Search => ' + matchedIds);

            // Facility Search
            for(Staff_Facility__c sf : [
                SELECT Staff__c
                FROM Staff_Facility__c
                WHERE Active__c = true
                AND Facility__r.Name LIKE :searchLike
            ]){
                if(sf.Staff__c != null){
                    matchedIds.add(sf.Staff__c);
                }
            }

            System.debug('Matched IDs After Facility Search => ' + matchedIds);
            System.debug('Matched IDs Count => ' + matchedIds.size());

            if(!matchedIds.isEmpty()){
                filters.add('Id IN :matchedIds');
            } else {
                filters.add('Id = null');
            }
        }

        if (isActive != null) {
            filters.add('Status__c = :isActive');
        }

        System.debug('Filters => ' + filters);

        String baseQuery =
            ' FROM Staff__c WHERE Id IN (' +
            'SELECT Staff__c FROM Staff_Facility__c ' +
            'WHERE Active__c = true AND Facility__c != null AND Facility__c = :facilityId' +
            ')';

        if(filters.size() > 0){
            baseQuery += ' AND ' + String.join(filters, ' AND ');
        }

        System.debug('Base Query => ' + baseQuery);

        String countQuery = 'SELECT COUNT() ' + baseQuery;

        System.debug('Count Query => ' + countQuery);

        result.totalRecords = Database.countQuery(countQuery);

        System.debug('Total Records => ' + result.totalRecords);

        Integer offsetVal = (pageNumber - 1) * pageSize;

        System.debug('Offset Value => ' + offsetVal);
        //manendra addin for sorting the data in table
        Map<String, String> sortFieldMap = new Map<String, String>{
        'Display_Nickname__c' => 'Display_Nickname__c',
        'Contact_Number__c' => 'Contact_Number__c',
        'activeFaciltyDisplay' => 'Facility__r.Name',
        'Staff_Status__c' => 'Staff_Status__c'
    };

String orderByField = sortFieldMap.containsKey(sortField)
    ? sortFieldMap.get(sortField)
    : 'Display_Nickname__c';

String orderDirection =
    sortDirection == 'desc' ? 'DESC' : 'ASC';
    //end


        String dataQuery =
            'SELECT id,Staff_UID__c,Facility__r.Name,Facility__r.Id,Manager__c,User_Type__c,NameToDisplay__c,' +
            'Display_Nickname__c,Facility_Name__c,CreatedBy.Name,Type_of_User__c,Staff_Status__c,' +
            'Status__c,Organization_Name__c,Last_Name__c ,Name,picture__c,Facility__c,Contact_Number__c,' +
            'Amazon_URL__c,address__Street__s,address__City__s,address__StateCode__s,' +
            'Address__CountryCode__s,Address__PostalCode__s,AddressData__c,Pre_Tax_Calculator__c,' +
            'Pre_Tax_One_Description__c,Pre_Tax_One_Value__c,Pre_Tax_Two_Description__c,' +
            'Pre_Tax_Two_Value__c,Pre_Tax_Three_Description__c,Pre_Tax_Three_Value__c,' +
            'Pre_Tax_Four_Description__c,Pre_Tax_Four_Value__c,Pre_Tax_Five_Description__c,' +
            'Pre_Tax_Five_Value__c,Post_Tax__c,Post_Tax_Decription__c,Make_Primary_as_Approver__c,' +
            'Make_Secondary_as_Approver__c,Voluntary_Contribution__c,Voluntary_Contribution_Fixed__c,' +
            'Annual_Leave__c,Sick_Leave__c,Parental_Leave__c,Bereavement_Leave__c,' +
            'Voluntary_Contribution_Percent__c,Email_Address__c,Set_Hours__c,Role__c,' +
            '(SELECT Id, RoleName__c, Active__c FROM StaffRoles__r WHERE Active__c = TRUE),' +
            '(SELECT id,Name,Type__c,Expiry_Date__c,View_File__c,Comments__c,Document_Type__c FROM Child_Staffs__r),' +
            '(SELECT Id,Facility__c,Facility__r.Name, Active__c,Staff__c FROM Staff_Facilities__r WHERE Active__c = true) ' +
            baseQuery +
            ' ORDER BY ' + orderByField + ' ' + orderDirection +
            ' LIMIT :pageSize OFFSET :offsetVal';

        System.debug('Data Query => ' + dataQuery);

        result.records = Database.query(dataQuery);

        System.debug('Records Returned => ' + result.records.size());

        for(Staff__c st : result.records){
            System.debug(
                'Staff => ' + st.Id +
                ' | Name => ' + st.Display_Nickname__c +
                ' | Status => ' + st.Status__c
            );
        }

        System.debug('================ END fetchStaffPaginatedData ================');

        return result;
    }

  @AuraEnabled(cacheable=true)
    public static List<Staff__c> fetchStaffForDropdown(Id facilityId){

        if (facilityId == null) {
            return new List<Staff__c>();
        }

        return [
            SELECT Id, Display_Nickname__c, User_Type__c
            FROM Staff__c
            WHERE Id IN (
                SELECT Staff__c
                FROM Staff_Facility__c
                WHERE Active__c = true
                AND Facility__c = :facilityId
            )
           
        ];
    }

    @AuraEnabled
    public static List<Staff__c> getStaffsByFacility(Id facilityId) {

        if (facilityId == null) {
            return new List<Staff__c>();
        }

        return [
            SELECT Id,Name,Display_Nickname__c,Status__c FROM Staff__c WHERE Status__c = true AND Id IN (
                SELECT Staff__c FROM Staff_Facility__c WHERE Active__c = true AND Facility__c = :facilityId) ORDER BY Display_Nickname__c
        ];
    }
}