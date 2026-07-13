@RestResource(urlMapping='/signInForms/*')
global with sharing class mobileAppSignInForms {

    @HttpGet
    global static void getTaskDetails() {

        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();

        try {

            RestRequest req = RestContext.request;

            // Expecting: ?formIdList=a1Wxx,a1Wyy,a1Wzz
            String formIdParam = req.params.get('formIdList');

            if(String.isBlank(formIdParam)){
                responseMap.put('isSuccess', false);
                responseMap.put('message', 'formIdList parameter is required');
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }

            // Convert comma-separated string → Set<Id>
            Set<Id> formIds = new Set<Id>();

            for(String idStr : formIdParam.split(',')){
                if(!String.isBlank(idStr)){
                    formIds.add((Id)idStr.trim());
                }
            }

            // 🔥 Required Query
            List<Dynamic_Form__c> forms = [
                SELECT Id,
                       Name,
                       Status__c,
                       Form_JSON__c,
                       Audience__c
                FROM Dynamic_Form__c
                WHERE Id IN :formIds
                AND Audience__c = 'Participant'
            ];

            List<formWrapper> wrapperList = new List<formWrapper>();

            for(Dynamic_Form__c formRec : forms){

                formWrapper wrap = new formWrapper();
                wrap.name = formRec.Name;
                wrap.formJson = formRec.Form_JSON__c;
                wrap.audienceType = formRec.Audience__c;
                wrap.formId = formRec.Id;

                wrapperList.add(wrap);
            }

            responseMap.put('isSuccess', true);
            responseMap.put('data', wrapperList);
            responseMap.put('message', 'Forms fetched successfully');

        } catch (Exception e) {

            responseMap.put('isSuccess', false);
            responseMap.put('message', 'Error fetching forms');
            responseMap.put('error', e.getMessage());
        }

        res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        res.statusCode = 200;
    }

    global class formWrapper {
        global String name;
        global String formJson;
        global String audienceType;
        global String formId;
    }
}