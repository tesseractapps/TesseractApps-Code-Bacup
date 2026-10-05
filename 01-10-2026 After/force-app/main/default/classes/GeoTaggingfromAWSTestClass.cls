@isTest
public class GeoTaggingfromAWSTestClass {
	 @isTest
    public static void getGeoLocationMethod(){
        GeoTagggingMockGenerator payLoadMock = new GeoTagggingMockGenerator();
        Test.setMock(HttpCalloutMock.class, payLoadMock);
           test.startTest();
           GeoTaggingfromAWS.getS3JsonData('abcedftgrhjg', 'Completed', '2024-03-16');
           test.stopTest(); 
    }
}