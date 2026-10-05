public class ShiftDateCalculator {
    
    public static Date getAdjustedDate(Date startDate, String shiftType, Time startTime24, Time endTime24) {
        System.debug('Start Date: ' + startDate);
        System.debug('Shift Type: ' + shiftType);
        System.debug('Start Time (24h): ' + startTime24);
        System.debug('End Time (24h): ' + endTime24);
        
        Date adjustedDate = startDate;
        List<String> specialShiftTypes = new List<String>{'Night', 'Custom', 'Sleepover Shift','Morning'};
        
        Boolean isSpecialShift = false;
        for (String type : specialShiftTypes) {
            if (type.toLowerCase() == shiftType?.toLowerCase()) {
                isSpecialShift = true;
                break;
            }
        }

        if (startTime24 != null && endTime24 != null) {
            Time startTime = startTime24;
            Time endTime = endTime24;
            
            // If end time is before start time, shift crosses into the next day
            if (endTime != null && startTime != null && endTime < startTime) {
                adjustedDate = startDate.addDays(1);
                System.debug('Shift ends next day — adjusted date by +1');
            } else {
                System.debug('No date adjustment needed');
            }
        } else {
            System.debug('Not a special shift or invalid input — no adjustment');
        }
        
        System.debug('Final Adjusted Date: ' + adjustedDate);
        return adjustedDate;
    }

}