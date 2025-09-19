global class ICTTimeSheetInboundEmailHandler   implements Messaging.InboundEmailHandler{
    global Messaging.InboundEmailResult handleInboundEmail(Messaging.inboundEmail email, 
                                                       Messaging.InboundEnvelope env){
 
    Messaging.InboundEmailResult result = new Messaging.InboundEmailResult(); 
      string emailSubject=email.subject;  
      system.debug('Email subject==> '+emailSubject);                                                 
      String[] emailParts= emailSubject.split(' ');
      system.debug('Email parts ==> '+emailParts);
      //string ictName=emailParts[5] ; 
      string ictName; 
      String subjectPattern='\\b(ICT-\\d{5}|ICT-\\d{6})\\b';
      Pattern subjectRegex= System.pattern.compile(subjectPattern); 
      Matcher subjectMatcher = subjectRegex.matcher(emailSubject);
      if(subjectMatcher.find()){
        ictName=subjectMatcher.group(1);
      }                                                     
                                                           
      string emailBody= email.plainTextBody ; 
      system.debug('email body==> '+emailBody); 
      String[] emailBodyLines = emailBody.split('\n');
	  String firstLine = emailBodyLines[0] ;
       system.debug('First lines of the email body ==>'+firstLine);                                           
                                                          
      List<string> emailBodyParts= emailbody.split(' ');                                                
      String approvePattern = '\\b(Approved|Rejected|Aprovd|Apprved|Approvd|approved)\\b' ;
      Pattern pattern = Pattern.compile(approvePattern); 
      Matcher matcher = pattern.matcher(firstLine);
      string expressionOutput;
      string comments; 
        if(matcher.find())  {
        expressionOutput=  matcher.group(1) ;
            if(expressionOutput=='Rejected'){
                System.debug('Matcher position'+matcher.end());
              //  String rejectpattern = 'Rejected:([^\\n]+)\\n\\n';
            	 String rejectpattern = 'Rejected:([^\\n]+)'; 
           		Pattern  regexPattern = System.pattern.compile(rejectpattern);
               //Matcher rejectMatcher = regexPattern.matcher(emailBody);
               // new line changed by praveen
               Matcher rejectMatcher = regexPattern.matcher(firstLine);
                if(rejectMatcher.find()){
                  comments=rejectMatcher.group(1);
                }
                
            }
        }                                                                                         
 	 system.debug('expression output ==>'+expressionOutput); 
     system.debug('comments ==>'+comments);
     system.debug('email parts ==> '+emailBodyParts);                                                 
          try{
              ICT_TimeSheet__c ictRecord =[select id,(select id,Status__c from Allocations__r),Staff__r.Email_Address__c,Week_Start_Date__c,Week_end_Date__c from ICT_TimeSheet__c where name =:ictName limit 1];
              system.debug('Ict record'+ictRecord);
              if(expressionOutput =='Approved' || expressionOutput =='Aprovd' ||
                 expressionOutput =='Apprved' || expressionOutput =='Approvd' || expressionOutput =='approved' ){
                 ictRecord.Status__c='Approved';
                     List<Messaging.SingleEmailMessage> mails =  new List<Messaging.SingleEmailMessage>(); 
                    OrgWideEmailAddress[] owea = [select Id from OrgWideEmailAddress where Address =:System.Label.OrgWideEmailAddress limit 1];
                  //uncomment below line during prod deployment and comment above line--sowmya
                  // OrgWideEmailAddress[] owea = [select Id from OrgWideEmailAddress where Address = 'timesheets@tesseract-app.com'];
                  	Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
                   	List<String> sendTo = new List<String>();
                  	sendTo.add(ictRecord.Staff__r.Email_Address__c);
                   	mail.setToAddresses(sendTo);
                    mail.setOrgWideEmailAddressId(owea.get(0).Id);
                  	mail.setSubject('ICT time sheet update');
                  	String body = 'Hi,'+'<br/>' ;
                  	body +=' Your timesheet for '+ictRecord.Week_Start_Date__c.format()+'-'+ictRecord.Week_end_Date__c.format()+'  has been approved.'+'</br><br/>';
                  	body +='Thanks and Regards,'+'<br/>';
                    body +='Administrator';
                  	mail.setHtmlBody(body);
                 	mails.add(mail);
                  Messaging.sendEmail(mails);
              } 
              if(expressionOutput =='Rejected' || expressionOutput == null ){
                   ictRecord.Status__c='Rejected';
                   system.debug('comments'+comments);
                   ictRecord.Comments__c=comments;  
                  
                   List<Messaging.SingleEmailMessage> mails =  new List<Messaging.SingleEmailMessage>(); 
                    OrgWideEmailAddress[] owea = [select Id from OrgWideEmailAddress where Address =:System.Label.OrgWideEmailAddress limit 1];
                  //uncomment below line during prod deployment and comment above line--sowmya
                  // OrgWideEmailAddress[] owea = [select Id from OrgWideEmailAddress where Address = 'timesheets@tesseract-app.com'];
                  	Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
                   	List<String> sendTo = new List<String>();
                  	sendTo.add(ictRecord.Staff__r.Email_Address__c);
                   	mail.setToAddresses(sendTo);
                    mail.setOrgWideEmailAddressId(owea.get(0).Id);
                  	mail.setSubject('ICT time sheet update');
                  	String body = 'Hi,'+'<br/>' ;
                  	body +=' Your timesheet for '+ictRecord.Week_Start_Date__c.format()+'-'+ictRecord.Week_end_Date__c.format()+'  has been rejected.'+'</br>';
                  if(comments == null){
                      body += 'Reason:&nbsp;'+'The reason for the action has not been specified.'+'<br/><br/>';
                  }else{
                      body += 'Reason:&nbsp;'+comments +'.<br/><br/>';
                  }
                  
                  	body +='Thanks and Regards,'+'<br/>';
                    body +='Administrator';
                  	mail.setHtmlBody(body);
                 	mails.add(mail);
                  Messaging.sendEmail(mails);
                  
              } 
              update ictRecord;
              list<Allocation__c> allocationList=ictRecord.Allocations__r ;
              system.debug('child records'+allocationList);
              for(Allocation__c alloc:allocationList){
                  alloc.Status__c=ictRecord.Status__c;
              }
              update allocationList;
              
             result.success = true;                                    
          }catch(exception e){
               result.success = false;   
          }
            return result ;                                       
     }


}