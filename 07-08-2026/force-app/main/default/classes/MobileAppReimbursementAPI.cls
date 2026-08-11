@RestResource(urlMapping='/createReimbursement/')
global class MobileAppReimbursementAPI{  
     @Httpget
   /* global static user doGet() {        
        user u =[select id,userrole.name,FirstName,LastName,Organization_Name__c,email from user where id=: UserInfo.getUserid()];
        return u;
    }*/
    global static User doGet() {

    User u = [
        SELECT Id,
               UserRole.Name,
               FirstName,
               LastName,
               Organization_Name__c,
               Email
        FROM User
        WHERE Id = :UserInfo.getUserId()
        LIMIT 1
    ];

    List<Staff__c> staffList = [
        SELECT Name,
               Last_Name__c
        FROM Staff__c
        WHERE Email_Address__c = :u.Email
        LIMIT 1
    ];

    if (!staffList.isEmpty()) {
        Staff__c s = staffList[0];

        u.FirstName = s.Name;
        u.LastName  = s.Last_Name__c;
    }

    return u;
}
    
    @HttpPost
    global static string doPost(string signinId,string Mileage,string others,string comments, boolean isupdate, string reimbId,string base64, String filename,
                               String typeofvehicle,String transportType, String startTime,String  endTime, String transportMode,string activityVehicleType,  String multipleExpensesJson,decimal OdoMeterEnd,decimal odoMeterStart) {
                                   Decimal amount=String.isNotEmpty(others)?decimal.valueof(others) :0;
                                   String vehicle =String.isNotEmpty(typeofvehicle) ?typeofvehicle :'Fuel'; 
                                   string expenseType;
                                   string recordid=SignInController.craeteReimbursement(signinId,amount,Mileage,comments, isupdate, reimbId,vehicle,transportType,startTime,endTime,transportMode,expenseType,activityVehicleType,multipleExpensesJson,odoMeterStart,OdoMeterEnd);
                                   system.debug('recordid'+recordid);
                                   if(recordid != '' && filename !=''){
                                       AWSS3FileUploadController.uploadFile(base64, filename,  recordid,'reimburse');
                                       //   string url =[select Amazon_file_URL__c from Reimbursement__c where id=:recordid].Amazon_file_URL__c;
                                       
                                }  
        return recordid;
    }

}