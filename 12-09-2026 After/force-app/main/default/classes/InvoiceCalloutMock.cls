@isTest
global class InvoiceCalloutMock implements HttpCalloutMock {
    global HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/pdf');
        res.setBody('JVBERi0xLjMKJbrfrOAKGFydHhyZWYKMTg2NTIKJSVFT0Y='); // dummy Base64 content
        res.setStatusCode(200);
        return res;
    }
}