@RestResource(urlMapping='/staffChanges/*')
global class MobileAdminStaffChanges {
     @HttpGet
     global static List<Staff__c> doGet() {  
         RestRequest req = RestContext.request;
         RestResponse res = Restcontext.response;
         Map<String, String> requestParam = req.params;
         string shiftid=requestParam.get('shiftid');
         system.debug('shift id '+shiftid);
        Add_Shift__c sft = [select id,Role__c,Start_Time__c,End_Time__c,Start_Date__c,Is_EOI__c,Start_time_picklist__c,End_time_formula__c from Add_Shift__c where id=:shiftid];
        List<Staff__c> staff=new  List<Staff__c>();
        User objUser = [ SELECT Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
        string orgID = [Select id from Organisation__c where name=:objUser.Organization_Name__c limit 1].Id;    
        if(sft.Is_EOI__c){
            try { 
            staff=AddShiftController.getEOIStaff( sft.Role__c,shiftid);
                }catch (Exception e) {
            system.debug(e);
        }
        }else{
           try {    
          staff=AddShiftController.getAvailableStaff( sft.Role__c, sft.Start_Date__c,  sft.Start_Time__c,  sft.End_Time__c);
            
        } catch (Exception e) {
            system.debug('mobile staffChanges error: '+e);
        }

        }
            
                return staff;

   }
    @HttpPost
    global static String doPost() { 
        RestRequest req = RestContext.request;
        String requestBody = req.requestBody.toString();
        
        List<StaffAllocationWrapper> allocations = (List<StaffAllocationWrapper>) JSON.deserialize(requestBody, List<StaffAllocationWrapper>.class);
        String response = 'success';
        
        for (StaffAllocationWrapper allocation : allocations) {
            try {
                ShiftwithStaff__c allocatedStaff = new ShiftwithStaff__c();
                allocatedStaff.Id = allocation.shiftwithstaffid;
                allocatedStaff.Staff__c = allocation.updstfid;
                update allocatedStaff;
            } catch (DmlException e) {
                System.debug('Error updating ShiftwithStaff: ' + e.getMessage());
                response = 'error: ' + e.getMessage();
            }
        }
        
        return response;
    }

    global class StaffAllocationWrapper {
    global String shiftwithstaffid;
    global String updstfid;
	}
 }