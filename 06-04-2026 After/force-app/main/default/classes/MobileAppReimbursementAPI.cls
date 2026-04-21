@RestResource(urlMapping='/createReimbursement/')
global class MobileAppReimbursementAPI{  
     @Httpget
    global static user doGet() {        
        user u =[select id,userrole.name,FirstName,LastName,Organization_Name__c,email from user where id=: UserInfo.getUserid()];
        return u;
    }
    
    @HttpPost
    global static string doPost(string signinId,string Mileage,string others,string comments, boolean isupdate, string reimbId,string base64, String filename,
                               String typeofvehicle,String transportType, String startTime,String  endTime, String transportMode,string activityVehicleType,  String multipleExpensesJson) {
                                   Decimal amount=String.isNotEmpty(others)?decimal.valueof(others) :0;
                                   String vehicle =String.isNotEmpty(typeofvehicle) ?typeofvehicle :'Fuel';
                                   string expenseType;
                                   string recordid=SignInController.craeteReimbursement(signinId,amount,Mileage,comments, isupdate, reimbId,vehicle,transportType,startTime,endTime,transportMode,expenseType,activityVehicleType,multipleExpensesJson);
                                   system.debug('recordid'+recordid);
                                   if(recordid != '' && filename !=''){
                                       AWSS3FileUploadController.uploadFile(base64, filename,  recordid,'reimburse');
                                       //   string url =[select Amazon_file_URL__c from Reimbursement__c where id=:recordid].Amazon_file_URL__c;
                                       
                                }  
        return recordid;
    }

}