@isTest
global class GeoTagggingMockGenerator implements HttpCalloutMock{
    
    global HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');        
        string respbody='{\"IsSuccess\":true,\"OverallResult\":\"Success\",\"Result\":{\"RefMessageID\":\"fce2b258-6d2f-40b8-b1f4-9ac488869180@govreports.com.au\"},\"MessageEvents\":[{\"EventType\":\"Information\",\"MessageCode\":\"PUSH_SUCCESS\",\"ShortMessage\":\"TherequesthasbeensubmittedtoATO.\",\"EventDescription\":null,\"Item\":null,\"Location\":null,\"RuleID\":null,\"Parameters\":null}]}';
        res.setBody(respbody);
        res.setStatusCode(200);    
        return res;
    }

}