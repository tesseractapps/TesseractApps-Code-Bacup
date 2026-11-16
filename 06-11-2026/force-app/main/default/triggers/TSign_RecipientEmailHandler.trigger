trigger TSign_RecipientEmailHandler on TSign_Child_Signature__c (After insert) {
    if (TriggerUtility.bypassTrigger) {
        return;
    }

    // Existing trigger logic
    TSign_RecipientEmailSender.sendToRecipient(Trigger.new);
}