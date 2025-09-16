trigger FundTrackerTrigger on Funds_Tracker__c (before insert) {
/*
    list<string> st=new list<string>();
    
   
    for(Funds_Tracker__c fund:trigger.new){
        list<Funds_Tracker__c> fundList=[select id,Service_Type_Name__c from Funds_Tracker__c];
        if(fundList.size()>0){
            fund.Service_Type_Name__c.adderror('This Service Type is Already Existing');
        }
    }*/
    FundTrackerHandler handler = New FundTrackerHandler();
    if(trigger.isinsert && trigger.isbefore){
    handler.PreventDuplicateFunds(trigger.new);
    }
    
}