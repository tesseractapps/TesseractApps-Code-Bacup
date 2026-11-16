public with sharing class ParticipantFormHandler {
    @AuraEnabled
    public static List<Participant_Form__c> getParticipantForm(string clientId){       
        List<Participant_Form__c> pFormLisst = [select id,Date_Time__c,CreatedDate__c,Form_Type__c,Created_User__c,Staff_Name__c,Triggers__c,Behaviour_Text__c,Staff__c,
        Outcome_Consequences__c,Was_a_skill_used_Worked__c,Breakfast_Medication__c,Client_Name__c,Client__c,Amazon_URL__c,Client_Address__c,Client_Contact_Number__c,Name,Time_Breakfast_Medication_Formula__c,
        Time_Lunch_Medication_Formula__c,Time_Dinner_Medication_Formula__c,Time_Bedtime_Medication_Formula__c,Time_PRN_Medication_Formula__c,Time_SS_Care_Chart_Formula__c,Time_Weekly_BG_Formula__c,
        Time_Bowel_Movement_Formula__c,From_Personal_Formula__c,To_Personal_Formula__c,From_Mood_behaviour_Formula__c,To_Mood_behaviour_Formula__c,From_Cleaning_Cooking_House_Formula__c,To_Cleaning_Cooking_House_Formula__c,
        From_Observations_Formula__c,To_Observations_Formula__c,From_Progress_Formula__c,To_Progress_Formula__c,Time_Activity_Chart_Formula__c,Shift_from_Time_Formula__c,Shift_to_Time_Formula__c,Time_Breakfast_Formula__c,Time_Lunch_Formula__c,
        Time_Dinner_Formula__c,Sad_from_Formula__c,Sad_to_Formula__c,Tired_from_Formula__c,Tired_to_Formula__c,Anxiouis_from_Formula__c,Anxiouis_to_Formula__c,Angry_from_Formula__c,Angry_to_Formula__c,Guilty_from_Formula__c,Guilty_to_Formula__c,
        Worthless_from_Formula__c,Worthless_to_Formula__c,Happy_from_Formula__c,Happy_to_Formula__c,Hopeless_from_Formula__c,Hopeless_to_Formula__c,Proud_from_Formula__c,Proud_to_Formula__c,Confident_from_Formula__c,Confident_to_Formula__c,
        Energy_from_Formula__c,Energy_to_Formula__c,Productivity_from_Formula__c,Productivity_to_Formula__c,Helpfulness_from_Formula__c,Helpfulness_to_Formula__c,Time_Fluid_Intake_Formula__c,                                        
        Lunch_Medications__c,Dinner_Medication__c,Bedtime_Medication__c,
        Time_Breakfast_Medication__c,Time_Lunch_Medication__c,Time_Dinner_Medication__c,
        Time_Bedtime_Medication__c,Time_PRN_Medication__c,PRN_Medication__c,
        Time_Fluid_Intake__c,Description_Fluid_Intake__c,Estimated_Volume_in_ml_Fluid_Intake__c,
        Time_SS_Care_Chart__c,Comments_SS_Care__c,Type_SS_Care__c,
        Self_care_SS_Care__c,Medication_given_SS_Care__c,Actvitiy_did_with_client_SS_Care__c,
        Morning_Breakfast_Weekly_Glucose__c,Pre_Midday_Lunch__c,Pre_Evening_Dinner__c,
        Pre_Night_Pre_bed__c,Time_Weekly_BG__c,Post_Morning_Breakfast_Glucose__c,
        Post_Midday_Lunch__c,Post_Evening_Dinner__c,Post_Night_Pre_bed__c,
        Time_Bowel_Movement__c,Comments_Bowel_Movement__c,Type_Bowel_Movement__c,
        Breakfast_General_Weekly__c,Lunch_General_Weekly__c,Dinner_General_Weekly__c,
        Snacks_General_Weekly__c,From_Personal_Care_disposal_of_Waste_and__c,
        From_Mood_behaviour__c,From_Cleaning_cooking__c,From_Observations__c,
        From_Progress_Notes__c,Time_Activity_Chart__c,To_Personal_Care_Disposal_of_Waste_and__c,
        To_Mood_behaviour__c,To_Cleaning_cooking__c,To_Observations__c,To_Progress_Notes__c,
        Shift_From_Time__c,Breakfast_Shift_Report__c,What_Did_I_Have_Breakfast__c,
        Details_of_the_Food_Breakfast__c,Amount_Quantity_Breakfast__c,Time_Breakfast__c,
        Comments_Breakfast__c,Dinner_Shift_Report__c,What_Did_I_Have_Dinner__c,
        Details_of_the_Food_Dinner__c,Amount_Quantity_Dinner__c,Time_Dinner__c,
        Comments_Dinner__c,Medical_Appointment__c,Charts_Updated__c,Finances_Checked__c,
        Incident_Report_Completed__c,Sad_From__c,Tired_From__c,Anxiouis_From__c,Angry_From__c,
        Guilty_From__c,Worthless_From__c,Happy_From__c,Hopeless_From__c,Proud_From__c,
        Confident_From__c,Energy_From__c,Productivity_From__c,Helpfulness_From__c,
        Any_Bowelm_Movement__c,If_Sighted_Specify_Type__c,BP_is_Higherthan_Target_Notify_RN_or_TL__c,
        Shift_To_Time__c,Lunch_Shift_Report__c,What_Did_I_Have_Lunch__c,Details_of_the_Food_Lunch__c,
        Amount_Quantity_Lunch__c,Time_Lunch__c,Comments_Lunch__c,Client_Location__c,
        Shift_Duties__c,Notes__c,Oral_Care__c,Shower_Hygiene__c,
        Medication_Taken_and_Signed_Off__c,Sad_To__c,Tired_To__c,Anxiouis_To__c,
        Angry_To__c,Guilty_To__c,Worthless_To__c,Happy_To__c,Hopeless_To__c,Proud_To__c,
        Confident_To__c,Energy_To__c,Productivity_To__c,Helpfulness_To__c,
        Sighted_by_Staff_or_Reported_by_Particip__c,Reporting_Date_and_Time__c,BP_is_Lower_than_Systolic_100__c from Participant_Form__c where Client__c =:clientId Order by createddate desc ];
        return pFormLisst;
    }

    @AuraEnabled
    public static List<Participant_Form__c> getSelectedColumName(string recordId){       
        List<Participant_Form__c> pFormSelectedItem = [select Form_Type__c from Participant_Form__c where id =:recordId ];
        return pFormSelectedItem;
    }
}