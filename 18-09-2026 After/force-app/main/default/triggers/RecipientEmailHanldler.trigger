trigger RecipientEmailHanldler on Child_Signatures__c (after insert) {
   /* if (Trigger.isAfter && Trigger.isinsert) {
         RecipientEmailSender.sendToRecipient(Trigger.new);
    }    */
    
    if (TriggerUtility.bypassTrigger) {
        return;
    }

    // Existing trigger logic
    RecipientEmailSender.sendToRecipient(Trigger.new);
}