public  class FacilityTriggerHandler {

    

    public static void createDefaultShifts(List<Facility__c> facilities){

		System.debug('===== createDefaultShifts START =====');
        System.debug('Facilities: ' + facilities);
	

        for(Facility__c facility : facilities){

            ShiftTypeTimings.saveMultipleShifts(
                getDefaultShifts(facility.Id),
                new List<Map<String,Object>>(),
                new List<Map<String,Object>>(),
                facility.Cost_per_Km_Electric__c,
                facility.Cost_per_Km_Fuel__c,
                facility.Id
            );
           System.debug('saveMultipleShifts completed');
        }

		System.debug('===== createDefaultShifts END =====');

    }

   /* private static List<Map<String,Object>> getDefaultShifts(){

        return new List<Map<String,Object>>{

            new Map<String,Object>{
                'salesforceId' => null,
                'name' => 'General',
                'computedId' => null,
                'shiftType' => 'General',
                'startHour' => '9',
                'startMinute' => '00',
                'startAMPM' => 'AM',
                'displayedStartTime' => '09:00 AM',
                'startTime24' => '09:00:00.000Z',
                'endHour' => '5',
                'endMinute' => '00',
                'endAMPM' => 'PM',
                'duration' => '0.00',
                'displayedEndTime' => '05:00 PM',
                'endTime24' => '17:00:00.000Z',
                'color' => '#AE016A',
                'durationActual' => 8,
                'colorStyle' => 'background-color: #AE016A; width: 25px; height: 25px; border: 1px solid #ccc;',
                'address' => 'Facility'
            },

            new Map<String,Object>{
                'salesforceId' => null,
                'name' => 'Morning',
                'computedId' => null,
                'shiftType' => 'Morning',
                'startHour' => '6',
                'startMinute' => '00',
                'startAMPM' => 'AM',
                'displayedStartTime' => '06:00 AM',
                'startTime24' => '06:00:00.000Z',
                'endHour' => '2',
                'endMinute' => '00',
                'endAMPM' => 'PM',
                'duration' => '0.00',
                'displayedEndTime' => '02:00 PM',
                'endTime24' => '14:00:00.000Z',
                'color' => '#0C7CEC',
                'durationActual' => 8,
                'colorStyle' => 'background-color: #0C7CEC; width: 25px; height: 25px; border: 1px solid #ccc;',
                'address' => 'Facility'
            },

            new Map<String,Object>{
                'salesforceId' => null,
                'name' => 'Afternoon',
                'computedId' => null,
                'shiftType' => 'Afternoon',
                'startHour' => '2',
                'startMinute' => '00',
                'startAMPM' => 'PM',
                'displayedStartTime' => '02:00 PM',
                'startTime24' => '14:00:00.000Z',
                'endHour' => '10',
                'endMinute' => '00',
                'endAMPM' => 'PM',
                'duration' => '0.00',
                'displayedEndTime' => '10:00 PM',
                'endTime24' => '22:00:00.000Z',
                'color' => '#D35701',
                'durationActual' => 8,
                'colorStyle' => 'background-color: #D35701; width: 25px; height: 25px; border: 1px solid #ccc;',
                'address' => 'Facility'
            },

            new Map<String,Object>{
                'salesforceId' => null,
                'name' => 'Night',
                'computedId' => null,
                'shiftType' => 'Night',
                'startHour' => '10',
                'startMinute' => '00',
                'startAMPM' => 'PM',
                'displayedStartTime' => '10:00 PM',
                'startTime24' => '22:00:00.000Z',
                'endHour' => '6',
                'endMinute' => '00',
                'endAMPM' => 'AM',
                'duration' => '0.00',
                'displayedEndTime' => '06:00 AM',
                'endTime24' => '06:00:00.000Z',
                'color' => '#0E185F',
                'durationActual' => 8,
                'colorStyle' => 'background-color: #0E185F; width: 25px; height: 25px; border: 1px solid #ccc;',
                'address' => 'Facility'
            },

            new Map<String,Object>{
                'salesforceId' => null,
                'name' => 'Sleepover Shift',
                'computedId' => null,
                'shiftType' => 'Sleepover Shift',
                'startHour' => '10',
                'startMinute' => '00',
                'startAMPM' => 'PM',
                'displayedStartTime' => '10:00 PM',
                'startTime24' => '22:00:00.000Z',
                'endHour' => '8',
                'endMinute' => '00',
                'endAMPM' => 'AM',
                'duration' => '0.00',
                'displayedEndTime' => '08:00 AM',
                'endTime24' => '08:00:00.000Z',
                'color' => '#0D815C',
                'durationActual' => 8,
                'colorStyle' => 'background-color: #0D815C; width: 25px; height: 25px; border: 1px solid #ccc;',
                'address' => 'Facility'
            }
        };

    }*/

	private static List<Map<String,Object>> getDefaultShifts(Id facilityId){

    return new List<Map<String,Object>>{

        new Map<String,Object>{
            'Id' => null,
            'Name' => 'General',
            'Shift_Type__c' => 'General',
            'Start_Time__c' => '09:00:00.000Z',
            'End_Time__c' => '17:00:00.000Z',
            'Color__c' => '#AE016A',
            'Duration' => Decimal.valueOf('0.00'),
            'DurationActual' => Decimal.valueOf('8'),
            'Facility__c' => facilityId,
            'address' => 'Facility'
        },

        new Map<String,Object>{
            'Id' => null,
            'Name' => 'Morning',
            'Shift_Type__c' => 'Morning',
            'Start_Time__c' => '06:00:00.000Z',
            'End_Time__c' => '14:00:00.000Z',
            'Color__c' => '#0C7CEC',
            'Duration' => Decimal.valueOf('0.00'),
            'DurationActual' => Decimal.valueOf('8'),
            'Facility__c' => facilityId,
            'address' => 'Facility'
        },

        new Map<String,Object>{
            'Id' => null,
            'Name' => 'Afternoon',
            'Shift_Type__c' => 'Afternoon',
            'Start_Time__c' => '14:00:00.000Z',
            'End_Time__c' => '22:00:00.000Z',
            'Color__c' => '#D35701',
            'Duration' => Decimal.valueOf('0.00'),
            'DurationActual' => Decimal.valueOf('8'),
            'Facility__c' => facilityId,
            'address' => 'Facility'
        },

        new Map<String,Object>{
            'Id' => null,
            'Name' => 'Night',
            'Shift_Type__c' => 'Night',
            'Start_Time__c' => '22:00:00.000Z',
            'End_Time__c' => '06:00:00.000Z',
            'Color__c' => '#0E185F',
            'Duration' => Decimal.valueOf('0.00'),
            'DurationActual' => Decimal.valueOf('8'),
            'Facility__c' => facilityId,
            'address' => 'Facility'
        },

        new Map<String,Object>{
            'Id' => null,
            'Name' => 'Sleepover Shift',
            'Shift_Type__c' => 'Sleepover Shift',
            'Start_Time__c' => '22:00:00.000Z',
            'End_Time__c' => '08:00:00.000Z',
            'Color__c' => '#0D815C',
            'Duration' => Decimal.valueOf('0.00'),
            'DurationActual' => Decimal.valueOf('8'),
            'Facility__c' => facilityId,
            'address' => 'Facility'
        }
    };
}



}