public class FundTrackerHandler {
    
    public void PreventDuplicateFunds(List<Funds_Tracker__c> NewFunds){
        Set<String>groupName = new Set<String>();
         Set<String>clientName = new Set<String>();
	For(Funds_Tracker__c funds : NewFunds)
	{
		groupName.add(funds.Registration_Group__c);
        clientName.add(funds.Client__c);
	}
	
	if(clientName.size() > 0 )
	{
		List<Funds_Tracker__c> fundList = [select id ,Registration_Group__c,client__c from Funds_Tracker__c where client__c in :clientName and Registration_Group__c in :groupName ];
		
		Map<String ,Funds_Tracker__c> fundmap = new Map<String,Funds_Tracker__c>();
		For(Funds_Tracker__c fun: fundList)
		{
			fundmap.put(fun.client__c+fun.Registration_Group__c ,fun);
		}
		
		For(Funds_Tracker__c fund : NewFunds)
		{
            string uniqFund=fund.client__c+fund.Registration_Group__c;
			if(fundmap.containsKey(uniqFund))
			{
				fund.addError('Fund already Exist for this Participant and Group');
			}
		}
		
	}
} 
    }