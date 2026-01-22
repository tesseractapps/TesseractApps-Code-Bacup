public with sharing class GeoTaggingfromAWS {  
    public string sName;
    public GeoTaggingfromAWS() {
        
    }

    @AuraEnabled
    public static String getS3JsonData(string shiftid, string shiftstatus, string sdate) {
        string sSelectedYear;
        string sSelectedMonth; 
        string sSelectedDate;   
        string sendPointURL; 
                
        //S3 Key 
        String key = System.Label.Geo_AWS_ACCESS_KEY; 
        System.debug('value of key '+(key==System.Label.AWSKey));
        //S3 Secret Key 
        System.debug('value of AWSSecret '+System.Label.Geo_AWS_SECRET_KEY);
        System.debug('value of AWSBucket '+System.Label.GeoBUCKET_NAME);
        String secret = System.Label.Geo_AWS_SECRET_KEY;
        String bucket = System.Label.GeoBUCKET_NAME;
        String host = System.Label.AWSHost;
        //String method = System.Label.AWSMethod;
        String sEnvironment = System.Label.Geo_SystemEnv; // UAT or Prod

        
        List<string> lstDate = sdate.split('-');

        sSelectedDate = lstDate[2];
        sSelectedMonth = getMonthName(lstDate[1]);
        //sSelectedMonth = lstDate[1];
        sSelectedYear = lstDate[0];        
        
        System.debug('Get Current Date : ' + sSelectedDate);        
        
        System.debug('Get Current Month : ' + sSelectedMonth);
                
        System.debug('Get Current Year : ' + sSelectedYear);

        //File name will be based on status ===== the status equals to In-progress then we need to call below location file
        //shiftLocationTrack/UAT/2024/sep/04/latest_a0KIm000000XnmnMAC.json
        
        //File name will be based on status ===== the status equals to Completed then we need to call below location file
        //shiftLocationTrack/UAT/2024/sep/04/allLocations_a0KIm000000XnmnMAC.json
        

        //BUCKET = shiftlocations
        //HOST NAME = s3.ap-southeast-2.amazonaws.com
        System.debug('Shift Status : ' + shiftstatus);
        if (shiftstatus == 'InProgress')
        {
            //sendPointURL = 'https://'+ bucket + '.' + host + '/shiftLocationTrack' + '/' + sEnvironment  + '/' + sSelectedYear + '/' + sSelectedMonth + '/' + sSelectedDate +'/latest_a0KIm000000XnmnMAC.json';
            sendPointURL = 'https://'+ bucket + '.' + host + '/shiftLocationTrack' + '/' + sEnvironment  + '/' + sSelectedYear + '/' + sSelectedMonth + '/' + sSelectedDate +'/latest_' + shiftid + '.json';
        }
        else if (shiftstatus == 'Completed')
        {
            //sendPointURL = 'https://'+ bucket + '.' + host + '/shiftLocationTrack' + '/' + sEnvironment  + '/' + sSelectedYear + '/' + sSelectedMonth + '/' + sSelectedDate +'/allLocations_a0KIm000000XnmnMAC.json';
            sendPointURL = 'https://'+ bucket + '.' + host + '/shiftLocationTrack' + '/' + sEnvironment  + '/' + sSelectedYear + '/' + sSelectedMonth + '/' + sSelectedDate +'/allLocations_' + shiftid + '.json';
        }
        else
        {
            System.debug('Shift Status : ' + shiftstatus);
        }
        
        System.debug('Geo Tracking End Point URL : ' + sendPointURL);

        HttpRequest req = new HttpRequest();
        req.setEndpoint(sendPointURL); // Named Credential
        req.setMethod('GET');
        req.setHeader('Content-Type', 'application/json');
        
        Http http = new Http();
        HttpResponse res = http.send(req);
        
        if (res.getStatusCode() == 200) {
            return res.getBody();
        } else {
            throw new AuraHandledException('Failed to retrieve JSON data from S3: ' + res.getStatus());
        }     
    } 
    
    public static string getMonthName(string sSelectedMonth)
    {   
        // Get the month number (1 = January, 2 = February, etc.)
        Integer monthNumber = Integer.valueOf(sSelectedMonth);

        // Create a list of month names
        List<String> monthNames = new List<String>{
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        };
        
        // Get the full month name
        String monthName = monthNames[monthNumber - 1];
        
        // Get the first three letters of the month name
        String abbreviatedMonth = monthName.substring(0, 3);
        return abbreviatedMonth;
    }
}