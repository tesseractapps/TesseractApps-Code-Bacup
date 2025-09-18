@isTest
global class GovReportsMockGenerator  implements HttpCalloutMock{ 
    
    global HTTPResponse respond(HTTPRequest req) {
        if(req.getEndpoint().endsWith('token')){
        // Create a fake response
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/xml');        
        string tokenbody='{"IsSuccess": true,"Result": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHb3ZSZXBvcnRzX0FQSV9TZXJ2aWNlX0FjY2Vzc1Rva2VuIiwianRpIjoiNmY5MDdhYTYtZDYyYi00MjY0LWFkYjItYjJlZDk3NzQ3ZmE3IiwiaWF0IjoiMDYvMDEvMjAyNCAyOjA5OjUwIFBNIiwiU2VjdXJlS2V5IjoiUm5kTFVXOUpla3RvVkdKbGVHbFRlV05aVUVGak9Ea3hSVmRUVUdGWlYzVjZXazVMTkZseWJYUlNlVTVKT0RNd1RUZHNUbHBpZUcxUWEwWnlPSGxhTm05MU1HdENkWGRpYVRoTVNHb3JVV0Z0VG1ZcmEzTmpiVUZPWTBKUVFtZEciLCJleHAiOjE3MDQ1NTEzOTAsImlzcyI6IkdvdlJlcG9ydHMuY29tLmF1IiwiYXVkIjoiR292UmVwb3J0c19BUElfQ09VU1VNRVJTIn0.GD2SLUK0euqSgMiWy0S3h9XQhPA00efZkt9qCJrjRGk","MessageEvents": [{"EventType": "Information", "MessageCode": "200","ShortMessage": "Token generated successfully","EventDescription": null,"Item": null,"Location": null, "RuleID": null }]}';
        res.setBody(tokenbody);
        res.setStatusCode(200);       
        return res;
        }else {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/xml');        
        string respbody='{\"IsSuccess\":true,\"OverallResult\":\"Success\",\"Result\":{\"RefMessageID\":\"fce2b258-6d2f-40b8-b1f4-9ac488869180@govreports.com.au\"},\"MessageEvents\":[{\"EventType\":\"Information\",\"MessageCode\":\"PUSH_SUCCESS\",\"ShortMessage\":\"TherequesthasbeensubmittedtoATO.\",\"EventDescription\":null,\"Item\":null,\"Location\":null,\"RuleID\":null,\"Parameters\":null}]}';
        res.setBody(respbody);
        res.setStatusCode(200);    
            return res;
        }
     
    }
}