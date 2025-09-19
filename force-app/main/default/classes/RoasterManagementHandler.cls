/**
* @description       : 
* @author            : Raja Sekhar Reddy
* @group             : 
* @last modified on  : 06-17-2023
* @last modified by  : Raja Sekhar Reddy
**/
public with sharing class RoasterManagementHandler {
    
    @AuraEnabled
    public static List<Allocation__c> getStaffAlocationData( String staffId){
        
        return [SELECT id,name,End_Date__c,Start_Date__c,Staff__c,Shift_Type__c,Start_Date_Time__c,End_Date_Time__c,Working_Hours__c,Shift_time_AMPM__c,Status__c,Start_time__c,End_time__c,Break__c,Status_Formula__c,Comments__c,
                ICT_TimeSheet__r.Status__c FROM Allocation__c WHERE Staff__c=:staffId] ;
    }
    
    @AuraEnabled
    public static List<Allocation__c> getAlocationData(string datePicker, string facName){ 
        system.debug('facilityName '+facName);
        
        system.debug('start string '+datePicker);
        Date sDate = Date.valueOf(datePicker) -7 ;
        Date eDate = Date.valueOf(datePicker)+7;
        system.debug('start date '+sDate);
        system.debug('end date '+eDate); 
        
        List<Allocation__c> allocList= [SELECT id,name,End_Date__c,Start_Date__c,Staff__c,Shift_Type__c,Working_Hours__c,Start_Time_Formula__c,Break_Start_Time_Formula__c,Break_End_Time_Formula__c,Break_Start_Time2_Formula__c,Break_End_Time2_Formula__c,
                                        Break_Start_Time3_Formula__c,Break_End_Time3_Formula__c,End_Time_Formula__c,Shift_time_AMPM__c,Status__c,Start_time__c,End_time__c,Break__c,ICT_TimeSheet__r.Status__c,Status_Formula__c,Comments__c,Break_End_Time__c,Break_Start_Time__c
                                        FROM Allocation__c  where Start_Date__c >= :sDate and End_Date__c <= :eDate  and Facility_Name__c=:facName  ] ;
        system.debug('allocList' +allocList);
        return allocList; 
    }
    
    @AuraEnabled
    public static List<Staff__c> getStaffAllocation( string facId){
        List<Staff__c> staffList = new List<Staff__c>();
        String UserEmail = UserInfo.getUserEmail();
        string rolename = [select id,name from userrole where id=:UserInfo.getUserRoleId()].name;
        List<Staff__c> checkStaffList = [select id,name,Last_Name__c, Email_Address__c,Facility__c,Working_Hours_Rate__c,Invoice_Rate__c,Description__c from Staff__c where Email_Address__c=:UserEmail];
        if( (rolename != 'Portal Account Partner Executive' && rolename != 'Portal Account Partner Manager' ) ){
            staffList =  [SELECT id,Name,Last_Name__c,Email_Address__c,Working_Hours_Rate__c,Invoice_Rate__c,Invoice_To__c,NameToDisplay__c,Role__c,Description__c FROM  Staff__c
                          WHERE Facility__c=:facId and Email_Address__c=:UserEmail]  ; 
        }
        else{
            
            staffList =  [SELECT id,Name,Last_Name__c ,Email_Address__c,Working_Hours_Rate__c,Invoice_Rate__c,Invoice_To__c,NameToDisplay__c,Role__c,Description__c FROM  Staff__c
                          WHERE Facility__c=:facId]  ;
        }
        system.debug('allocList' +staffList);
        return staffList;
    }
    
    @AuraEnabled
    public static Map<String, List<Allocation__c>> getRosterAllocationGroupedByWeek(String staffId, String StartDate, String endDate) {
        system.debug('staffId >>'+ staffId);
        system.debug('StartDate >>'+ StartDate);
        system.debug('EndDate >>'+ endDate);
        Date sDate = Date.valueOf(StartDate);
        Date eDate = Date.valueOf(endDate);
        
        List<Allocation__c> allocations = [
            SELECT Id, Name, End_Date__c, Start_Date__c, Staff__c, Shift_Type__c, Working_Hours__c,
            Start_Time_Formula__c, LastModifiedBy.Name, ICT_TimeSheet__r.Approver_Name__c,
            Extended_Hours__c, LastModifiedBy.Full_Name__c, End_Date_Time__c, Shift_time_AMPM__c,
            Status__c, Start_time__c, End_time__c, Break__c, ICT_TimeSheet__r.Status__c,
            Status_Formula__c, Comments__c, Start_Date_Time__c, Staff__r.Type_of_User__c
            FROM Allocation__c
            WHERE Staff__c = :staffId
            AND Start_Date__c >= :sDate
            AND End_Date__c <= :eDate
            AND Status__c = 'Approved'
            ORDER BY Start_Date__c ASC
        ];
        
        Map<String, List<Allocation__c>> weekMap = new Map<String, List<Allocation__c>>();
        
        for (Allocation__c alloc : allocations) {
            Date weekStart = alloc.Start_Date__c.toStartOfWeek(); // Monday
            Date weekEnd = weekStart.addDays(6); // Sunday
            
            String key = weekStart.format() + ' to ' + weekEnd.format(); // "2025-06-16 to 2025-06-22"
            
            if (!weekMap.containsKey(key)) {
                weekMap.put(key, new List<Allocation__c>());
            }
            weekMap.get(key).add(alloc);
        }
        
        return weekMap;
    }
    
    
    @AuraEnabled
    public static List<ICT_TimeSheet__c> getIctList(string staffId, string StartDate ,string endDate){
        Date sDate = Date.valueOf(StartDate);
        Date eDate = Date.valueOf(endDate);
        
        
        list<ICT_TimeSheet__c>  ictList= [select Id,Name, Staff__c,Total_Duration__c,Week_end_Date__c,Week_Start_Date__c,Status__c ,Approver_Name__c,LastModifiedDate,(select id,Start_Date__c,End_time__c,Start_time__c,Break__c,Working_Hours__c,Day_name__c,Break_Start__c,Break_End__c,Start_Time_Formula__c,Break_Start_Time_Formula__c,Break_End_Time_Formula__c,
                                                                                                                                                                       End_Time_Formula__c,Break_Start_Time2_Formula__c,Break_End_Time2_Formula__c,
                                                                                                                                                                       Break_Start_Time3_Formula__c,Break_End_Time3_Formula__c from Allocations__r  where Start_Date__c >=: sDate and Start_Date__c<=: eDate //where Start_Date__c >=: sDate and Start_Date__c<=: eDate
                                                                                                                                                                       order by  Start_Date__c asc) from ICT_TimeSheet__c where  Staff__c=:staffId  and
                                          Week_Start_Date__c <=:eDate  and  Week_end_Date__c >=:sDate and Status__c='Approved' order by Week_Start_Date__c ASC ]; //Week_Start_Date__c >=:sDate and  Week_end_Date__c <=:eDate 
        return ictList;
    }
    
    
    
    @AuraEnabled
    public static void createAllocation(String sDate,String staffId ,string whours,string starttime,string endtime,string breakTime,string status,string startTimeString, string endTimeString,boolean isupdate,String allocationId ){
        system.debug(isupdate+'----- '+allocationId+';;;;;'+sDate +';;;;;;;;;;;'+whours+';;;;;;'+staffId+';;;;'+breakTime+';;;;'+startTimeString+';;;;;'+endTimeString);
        Time startTimeformat;
        Time endTimeformat;
        if(starttime != null){
            String[] strTimeSplit = starttime.split(':');
            startTimeformat = Time.newInstance( Integer.valueOf(strTimeSplit[0]) //hour
                                               ,Integer.valueOf(strTimeSplit[1]) //min
                                               ,0                                //sec
                                               ,0);
            system.debug('startTime==> ' + startTimeformat);
        }
        if(endtime != null){
            String[] endTimeSplit = endtime.split(':');
            endTimeformat = Time.newInstance( Integer.valueOf(endTimeSplit[0]) //hour
                                             ,Integer.valueOf(endTimeSplit[1]) //min
                                             ,0                                //sec
                                             ,0);
            system.debug('endTime==> ' + endTimeformat);
        }
        //     List<Allocation__c> alocList=new List<Allocation__c>();
        try {
            Allocation__c alocRec=new Allocation__c();          
            alocRec.Working_Hours__c=Decimal.valueOf(whours);
            if(startTimeformat != null){
                alocRec.Start_Date_Time__c=startTimeformat;
            }if(endTimeformat != null){
                alocRec.End_Date_Time__c=endTimeformat;
            }
            alocRec.Break__c=breakTime;
            alocRec.Start_time__c =startTimeString;
            alocRec.End_time__c=endTimeString;
            alocRec.Status__c=status;
            if(isupdate ==true){
                system.debug('in update');
                alocRec.Id= allocationId;               
                update alocRec;
            }else{
                system.debug('in insert');
                alocRec.Staff__c=staffId;
                alocRec.End_Date__c=Date.valueOf(sDate);
                alocRec.Start_Date__c=Date.valueOf(sDate);
                //  alocList.add(alocRec);
                insert alocRec;
            }    
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    @AuraEnabled
    public static void createTimeSheet(date WeekStartDate,date WeekendDate ,list<string> allocationIds,string duration,string staffId){       // List<string> allocationIds
        system.debug('in creation time');
        String UserEmail = UserInfo.getUserEmail();
        boolean issucc =false;
        string approverName;
        string approvalFullNAme;
        Staff__c staff = [select Id,Primary_Contact_Email__c,Make_Primary_as_Approver__c,Make_Secondary_as_Approver__c,
                          Secondary_Contact_Email__c,Name__c,Name,Primary_Contact_First_Name__c,Secondary_Contact_First_Name__c,Primary_Contact_Last_Name__c,Secondary_Contact_Last_Name__c,
                          Email_Address__c,Last_Name__c,Organization_Full_Name__c from Staff__c where id=:staffId limit 1];
       /* If(staff.Make_Primary_as_Approver__c == true){
            approverName=staff.Primary_Contact_First_Name__c;
            approvalFullNAme=staff.Primary_Contact_First_Name__c+' '+staff.Primary_Contact_Last_Name__c;
        }else{
            approverName=staff.Secondary_Contact_First_Name__c;
            approvalFullNAme=staff.Secondary_Contact_First_Name__c+' '+staff.Secondary_Contact_Last_Name__c;
        } */
        if (staff.Make_Primary_as_Approver__c == true) {
            String firstName = staff.Primary_Contact_First_Name__c != null ? staff.Primary_Contact_First_Name__c : '';
            String lastName = staff.Primary_Contact_Last_Name__c != null ? staff.Primary_Contact_Last_Name__c : '';
            approverName = firstName;
            approvalFullNAme = (firstName + ' ' + lastName).trim();
        } else {
            String firstName = staff.Secondary_Contact_First_Name__c != null ? staff.Secondary_Contact_First_Name__c : '';
            String lastName = staff.Secondary_Contact_Last_Name__c != null ? staff.Secondary_Contact_Last_Name__c : '';
            approverName = firstName;
            approvalFullNAme = (firstName + ' ' + lastName).trim();
        }
        
        ICT_TimeSheet__c t= new ICT_TimeSheet__c();     
        date strtDt=Date.valueof(WeekStartDate);//Date.ValueOf(WeekStartDate);
        system.debug(strtDt );
        date formstr=Date.newInstance(strtDt.year(), strtDt.month(), strtDt.day());
        system.debug(formstr );
        
        date enddt=Date.ValueOf(WeekendDate);
        date formend=Date.newInstance(enddt.year(), enddt.month(), enddt.day());
        t.Staff__c= staff.Id;
        t.Week_Start_Date__c=formstr;
        t.Week_end_Date__c=enddt;
        t.status__c ='Submitted';
        system.debug('Duration'+decimal.valueof(duration));
        t.Total_Duration__c=decimal.valueof(duration);
        List<ICT_TimeSheet__c> existtime =[select id ,Name,Total_Duration__c from ICT_TimeSheet__c where Week_Start_Date__c=:formstr and Week_end_Date__c=:formend
                                           and Staff__c=: staff.Id];
        if(existtime.size()>0){
            system.debug('lexists');
            t.id=existtime[0].Id;
            try{
                Update t;
                issucc=true;
            }catch(Exception e){
                issucc=false;
                throw new AuraHandledException(e.getMessage());
                
            }
        }else{   
            try{
                insert t;
                issucc=true;
            }catch(Exception e){
                issucc=false;
                throw new AuraHandledException(e.getMessage());
            }
            
        }
        system.debug('allocations id'+allocationIds);
        if( issucc=true){
            list<Allocation__c>  allocationList=[select id,Start_Date__c,End_time__c,Start_time__c,Break__c,Working_Hours__c,Day_name__c,Break_Start__c,Break_End__c,Break_Start_Time2__c,Break_End_Time2__c,Break_Start_Time3__c,Break_End_Time3__c,Start_Time_Formula__c,End_Time_Formula__c,
                                                 Break_Start_Time_Formula__c,Break_End_Time_Formula__c,Break_Start_Time2_Formula__c,Break_End_Time2_Formula__c,Break_Start_Time3_Formula__c,Break_End_Time3_Formula__c from Allocation__c where id IN :allocationIds
                                                 order by  Start_Date__c asc ] ;
            if(allocationIds.size()>0){ 
                list<Allocation__c> allocationListupd = new list<Allocation__c> ();
                try{
                    for(Allocation__c  AllocId :allocationList){                     
                        AllocId.ICT_TimeSheet__c =t.id;
                        AllocId.Status__c='Submitted';
                        AllocId.Id=AllocId.Id;
                        allocationListupd.add(AllocId);
                        
                    }
                    update allocationListupd;
                }catch( Exception e){
                    throw new AuraHandledException(e.getMessage());
                }
                
            }
            Map<String, Allocation__c> allocationMap = new Map<String, Allocation__c>();
            for (Allocation__c acc : allocationList) {
                allocationMap.put(acc.Day_name__c, acc);
            }
            List<String> allDays = new List<String>{'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'};
                Map<String, date> daysWithDates = new Map<String, date>();
            for (String day : allDays) {
                daysWithDates.put(day,(t.Week_Start_Date__c+(allDays.indexOf(day))));
            }
            
            ICT_TimeSheet__c ictRec=[select id,name,Email_Body__c,Approver_Name__c from ICT_TimeSheet__c where id=:t.id];
            OrgWideEmailAddress oweaddress = [select Id,DisplayName from OrgWideEmailAddress where Address =:System.Label.OrgWideEmailAddress limit 1]; 
            
            List<Messaging.SingleEmailMessage> mails =  new List<Messaging.SingleEmailMessage>();    
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            List<String> sendTo = new List<String>(); 
            If(staff.Make_Primary_as_Approver__c == true){
                sendTo.add(staff.Primary_Contact_Email__c);
            }else{
                sendTo.add(staff.Secondary_Contact_Email__c);
            }
            system.debug('send to '+sendTo);
            mail.setToAddresses(sendTo);
            mail.setOrgWideEmailAddressId(oweaddress.Id);
            mail.setReplyTo(System.Label.ICTInboundEmail);
            
            // mail.setSubject(staff.Name__c +' '+staff.Last_Name__c+' Timesheet '+ictRec.Name+' approval from '+ t.Week_Start_Date__c.format() +'-'+ t.Week_end_Date__c.format());
            mail.setSubject('Timesheet approval for '+staff.Name +' '+staff.Last_Name__c+' '+ictRec.Name+' from '+ t.Week_Start_Date__c.format() +'-'+ t.Week_end_Date__c.format());
            String body = 'Hi '+approverName+ ','+'<br/><br/>';
            body +='Following hours have been submitted by '+staff.Name +' '+staff.Last_Name__c +' from '+staff.Organization_Full_Name__c+' for the period '+t.Week_Start_Date__c.format()+' to '+t.Week_end_Date__c.format() +'<br/><br/>' ;
            string ICTTable ='<table border="1"><tr><th style="width:120px;">Days</th><th style="width:120px;">Start Time</th><th style="width:120px;">End Time</th><th style="width:120px;">Break Start</th><th style="width:120px;">Break End</th><th style="width:120px;">Break Start 2</th><th style="width:120px;">Break End 2</th><th style="width:120px;">Break Start 3</th><th style="width:120px;">Break End 3</th><th style="width:120px;">Break(mins)</th><th style="width:120px;">Hours</th></tr>' ;            	
            for (String day : allDays) {    
                system.debug('Number of Days: '+ day);
                // Check if there is data for the current day
                if (allocationMap.containsKey(day)) {
                    Allocation__c acc = allocationMap.get(day);
                    //if(acc.Break_Start_Time_Formula__c != null && acc.Break_Start_Time_Formula__c != null){
                    ICTTable +='<tr><td style="text-align: center; vertical-align: middle;">'+acc.Day_name__c+'<br/>'+acc.Start_Date__c.format()+'</td><td style="text-align: center; vertical-align: middle;">'+acc.Start_Time_Formula__c+'</td><td style="text-align: center; vertical-align: middle;">'+acc.End_Time_Formula__c+'</td><td style="text-align: center; vertical-align: middle;">'+(acc.Break_Start_Time_Formula__c != null ? acc.Break_Start_Time_Formula__c : '-')+'</td><td style="text-align: center; vertical-align: middle;">'+(acc.Break_End_Time_Formula__c != null ? acc.Break_End_Time_Formula__c : '-')+'</td><td style="text-align: center; vertical-align: middle;">'+(acc.Break_Start_Time2_Formula__c != null ? acc.Break_Start_Time2_Formula__c : '-')+'</td><td style="text-align: center; vertical-align: middle;">'+(acc.Break_End_Time2_Formula__c != null ? acc.Break_End_Time2_Formula__c : '-')+'</td><td style="text-align: center; vertical-align: middle;">'+(acc.Break_Start_Time3_Formula__c != null ? acc.Break_Start_Time3_Formula__c : '-')+'</td><td style="text-align: center; vertical-align: middle;">'+(acc.Break_End_Time3_Formula__c != null ? acc.Break_End_Time3_Formula__c : '-')+'</td><td style="text-align: center; vertical-align: middle;">'+acc.Break__c+'</td><td style="text-align: center; vertical-align: middle;">'+acc.Working_Hours__c+'</td></tr>';  
                    /*}else{
ICTTable +='<tr><td style="text-align: center; vertical-align: middle;">'+acc.Day_name__c+'<br/>'+acc.Start_Date__c.format()+'</td><td style="text-align: center; vertical-align: middle;">'+acc.Start_Time_Formula__c+'</td><td style="text-align: center; vertical-align: middle;">'+acc.End_Time_Formula__c+'</td><td style="text-align: center; vertical-align: middle;">'+'No Data'+'</td><td style="text-align: center; vertical-align: middle;">'+'No Data'+'</td><td style="text-align: center; vertical-align: middle;">'+'No Data'+'</td><td style="text-align: center; vertical-align: middle;">'+'No Data'+'</td><td style="text-align: center; vertical-align: middle;">'+'No Data'+'</td><td style="text-align: center; vertical-align: middle;">'+'No Data'+'</td><td style="text-align: center; vertical-align: middle;">'+acc.Break__c+'</td><td style="text-align: center; vertical-align: middle;">'+acc.Working_Hours__c+'</td></tr>'; 
}*/
                    
                } else{
                    date dateOFallocation=daysWithDates.get(day);
                    ICTTable +='<tr><td style="text-align: center; vertical-align: middle;">'+day+'<br/>'+dateOFallocation.format()+'</td><td style="text-align: center; vertical-align: middle;">'+'-'+'</td><td style="text-align: center; vertical-align: middle;">'+'-'+'</td><td style="text-align: center; vertical-align: middle;">'+'-'+'</td><td style="text-align: center; vertical-align: middle;">'+'-'+'</td><td style="text-align: center; vertical-align: middle;">'+'-'+'</td><td style="text-align: center; vertical-align: middle;">'+'-'+'</td><td style="text-align: center; vertical-align: middle;">'+'-'+'</td><td style="text-align: center; vertical-align: middle;">'+'-'+'</td><td style="text-align: center; vertical-align: middle;">'+'-'+'</td><td style="text-align: center; vertical-align: middle;">'+'-'+'</td></tr>';  
                }
            }
            ICTTable +='<tr><td style="text-align:right;" colspan="11">Total Hours: '+t.Total_Duration__c+'</td></tr/>' ;
            ICTTable +='</table>';
            
            body +=ICTTable;
            body += 'Please reply as '+'<b>“Approved” </b>'+' if you agree with the submitted timesheet, kindly reply as'+'<span style="color:red"> <b>“Rejected:</b> {your comments}”</span> '+' if you choose to Reject.<br/><br/>  ';
            body += 'Regards<br/>' ;
            body += staff.Organization_Full_Name__c +'.';
            mail.setHtmlBody(body); 
            mails.add(mail);
            Messaging.sendEmail(mails);
            ictRec.Email_Body__c=ICTTable;
            ictRec.Approver_Name__c=approvalFullNAme;
            update ictRec;
        }
        
    }
    @AuraEnabled
    public static Allocation__c clonePreviousDayAllocation(Date selectedDate, Id staffId) {
        List<Allocation__c> allocations = [
            SELECT Staff__c, Start_Date__c, Start_Date_Time__c, End_Date_Time__c, 
            Break_Start_Time__c, Break_End_Time__c, Break_Start_Time2__c, 
            Break_End_Time2__c, Break_Start_Time3__c, Break_End_Time3__c, 
            Break__c, Working_Hours__c
            FROM Allocation__c
            WHERE Start_Date__c = :selectedDate AND Staff__c = :staffId 
            LIMIT 1
        ];
        return allocations.isEmpty() ? null : allocations[0];
        
        
    }
    @AuraEnabled
    public static void updateTimeSheets(Date WeekStartDate, Date WeekendDate, String staffId) {
        if (WeekStartDate == null || WeekendDate == null || String.isEmpty(staffId)) {
            System.debug('Invalid parameters provided.');
            return;
        }
        date strtDt=Date.valueof(WeekStartDate);
        system.debug(strtDt );
        date formstr=Date.newInstance(strtDt.year(), strtDt.month(), strtDt.day());
        system.debug(formstr );
        
        date enddt=Date.ValueOf(WeekendDate);
        date formend=Date.newInstance(enddt.year(), enddt.month(), enddt.day());
        
        List<ICT_TimeSheet__c> timeSheetsToUpdate = [
            SELECT Id, Status__c, 
            (SELECT Id, Status__c FROM Allocations__r) 
            FROM ICT_TimeSheet__c 
            WHERE Week_end_Date__c >= :formstr 
            AND Week_Start_Date__c <= :formend 
            AND Status__c = 'Approved'
            AND Staff__c = :staffId
        ];
        
        List<ICT_TimeSheet__c> parentUpdates = new List<ICT_TimeSheet__c>();
        List<Allocation__c> childUpdates = new List<Allocation__c>();
        
        for (ICT_TimeSheet__c ts : timeSheetsToUpdate) {
            ts.Status__c = 'Draft';
            parentUpdates.add(ts);
            
            for (Allocation__c alloc : ts.Allocations__r) {
                alloc.Status__c = 'Draft';
                childUpdates.add(alloc);
            }
        }
        
        if (!parentUpdates.isEmpty()) {
            update parentUpdates;
        }
        
        if (!childUpdates.isEmpty()) {
            update childUpdates;
        }
        
        System.debug('Updated ' + parentUpdates.size() + ' timesheets and ' + childUpdates.size() + ' allocations.');
    }
    
    
}