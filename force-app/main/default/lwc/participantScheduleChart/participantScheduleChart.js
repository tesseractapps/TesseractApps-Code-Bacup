import { LightningElement, track, wire } from 'lwc';
import currentuserId from '@salesforce/user/Id';
import getServicesAndSupportPlans from '@salesforce/apex/ServiceSupportPlanHandler.getServicesAndSupportPlansforDashboard';

export default class ScheduleComponent extends LightningElement {

    @track events = [];
    @track timeSlots = [];
    clientId = currentuserId;

    // Start from 12 AM to 11 PM (24 hours total)
    startHour = 0;
    endHour = 24;

    // Height of each hour slot in pixels
    slotHeight = 60; // Adjust based on your UI

    connectedCallback() {
        this.generateTimeSlots();
    }

    generateTimeSlots() {
        this.timeSlots = [];
        for (let i = this.startHour; i < this.endHour; i++) {
            let hour = i;
            let period = hour >= 12 ? 'PM' : 'AM';
            let displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
            this.timeSlots.push(`${displayHour} ${period}`);
        }
    }

    get formattedEvents() {
        return this.events.map(event => {
            const startTime = new Date(event.startDatetime); // Parse correct Date
            const endTime = new Date(event.endDatetime); // Parse correct Date

            // Extract hours & minutes for positioning
            const startHours = startTime.getHours();
            const startMinutes = startTime.getMinutes();
            const endHours = endTime.getHours();
            const endMinutes = endTime.getMinutes();

            // Calculate pixel position based on start time
            const eventTop = ((startHours * 60) + startMinutes) * (this.slotHeight / 60);
            const eventHeight = ((endHours * 60 + endMinutes) - (startHours * 60 + startMinutes)) * (this.slotHeight / 60);

            return {
                ...event,
                style: `top: ${eventTop}px; height: ${eventHeight}px;`,  // Corrected string interpolation
                time: this.formatTime(startTime)
            };
        });
    }

    // Helper function to format time
    formatTime(dateTime) {
        let hours = dateTime.getHours();
        let minutes = dateTime.getMinutes().toString().padStart(2, '0');
        let period = hours >= 12 ? 'PM' : 'AM';
        let displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        return `${displayHour}:${minutes} ${period}`;
    }

    @wire(getServicesAndSupportPlans, { recordId: '$clientId' })
    wiredEvents({ error, data }) {
        if (data) {
            console.log('Fetched Events:', JSON.stringify(data));

            this.events = data.map(event => {
                console.log('Event Data:', event);

                // Ensure field names are correctly referenced
                let startTime = event.startDatetime ? new Date(event.startDatetime) : null;
                let endTime = event.endDatetime ? new Date(event.endDatetime) : null;

                if (!startTime || isNaN(startTime)) {
                    console.error('Invalid startTime for event:', event);
                    return null; // Skip this event if the date is invalid
                }
                if (!endTime || isNaN(endTime)) {
                    console.error('Invalid endTime for event:', event);
                    return null; // Skip this event if the date is invalid
                }

                console.log('startTime:', startTime);
                console.log('endTime:', endTime);

                // Function to format time in 12-hour format
                let formatTime = (date) => {
                    let hours = date.getHours();
                    let minutes = date.getMinutes().toString().padStart(2, '0');
                    let period = hours >= 12 ? 'PM' : 'AM';
                    let displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
                    return `${displayHour}:${minutes} ${period}`;
                };

                // Calculate position and height for display
                let eventTop = startTime.getHours() * 60 + startTime.getMinutes(); // Position from midnight
                let eventHeight = (endTime - startTime) / (1000 * 60); // Duration in minutes

                // Assign colors based on service type
                let eventColor = event.serviceType === 'Community Nursing Care' ? 'blue' : 'green';

                return {
                    id: event.servicePlanId,
                    time: `${formatTime(startTime)} - ${formatTime(endTime)}`,
                    title: `${event.computedResourceName || ' '} - ${event.serviceType}`,
                    style: `top: ${eventTop}px; height: ${eventHeight}px;`,  // Corrected string interpolation
                    indicatorStyle: `background-color: ${eventColor};`
                };
            }).filter(event => event !== null); // Filter out null values caused by invalid dates
        } else if (error) {
            console.error('Error fetching events:', error);
        }
    }
}