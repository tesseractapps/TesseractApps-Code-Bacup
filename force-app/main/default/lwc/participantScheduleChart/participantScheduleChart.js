import { LightningElement, track, wire } from 'lwc';
import currentUserId from '@salesforce/user/Id';
import getShiftTypeCssMap from '@salesforce/apex/StaffController.getShiftTypeCssMap';
import getServicesAndSupportPlans from '@salesforce/apex/ServiceSupportPlanHandler.getServicesAndSupportPlansforDashboard';
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";

export default class ParticipantScheduleChart extends LightningElement {
    @track events = [];
    @track positionedEvents = [];
    @track overlappingGroups = [];
    @track timeSlots = [];
    @track hasOverlappingServices = false;
    @track hasOverlaps = false;
    @track overlapCount = 0;
    @track shiftTypeCssMap = {};
    @track facilityPreferredName;
    @track participantPreferredName;
  
    clientId = currentUserId;
    
    // Configuration
    startHour = 0;
    endHour = 24;
    slotHeight = 60;

    connectedCallback() {
        this.generateTimeSlots();
        // Use mock data for demonstration
        
        // Set up scroll synchronization after component renders
        setTimeout(() => {
            this.setupScrollSync();
        }, 100);
        this.fetchOrgDetails();
    }

    fetchOrgDetails() {
              orgDetails()
                  .then((response) => {
                      console.log("Response for Org Details =>", response);
                      this.Orgid = response.Id;
                      this.orgfullname = response.Name;
                      this.facilityPreferredName = response.Facility_Preferred_Name_Formula__c;
                      this.participantPreferredName = response.Participant_Preferred_Name_Formula__c;
                  })
                  .catch((error) => {
                      console.error("Error fetching org details:", error);
                      this.error = error;
                  });
          }

    setupScrollSync() {
        const scheduleGrid = this.template.querySelector('.schedule-grid');
        const timeSlotsContent = this.template.querySelector('.time-slots-content');
        
        if (scheduleGrid && timeSlotsContent) {
            scheduleGrid.addEventListener('scroll', (event) => {
                // Sync the time slots scroll position with the schedule grid
                timeSlotsContent.style.transform = `translateY(-${event.target.scrollTop}px)`;
            });
        }
    }

    generateTimeSlots() {
        const slots = [];
        for (let i = this.startHour; i < this.endHour; i++) {
            const hour = i;
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
            slots.push(`${displayHour} ${period}`);
        }
        this.timeSlots = slots;
    }

    formatTime(dateTime) {
        const hours = dateTime.getHours();
        const minutes = dateTime.getMinutes().toString().padStart(2, '0');
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        return `${displayHour}:${minutes} ${period}`;
    }

    getEventPosition(startTime, endTime) {
        const startHours = startTime.getHours();
        const startMinutes = startTime.getMinutes();
        const endHours = endTime.getHours();
        const endMinutes = endTime.getMinutes();

        const topPosition = ((startHours * 60) + startMinutes) * (this.slotHeight / 60);
        const height = ((endHours * 60 + endMinutes) - (startHours * 60 + startMinutes)) * (this.slotHeight / 60);

        return { topPosition, height };
    }

    eventsOverlap(event1, event2) {
        return event1.startTime < event2.endTime && event2.startTime < event1.endTime;
    }

    /* getShiftTypeColor(typeofShift) {
        // Convert to lowercase for consistent matching
        const shiftTypeLower = typeofShift ? typeofShift.toLowerCase() : '';
        
        // Get color from the CSS map, fallback to default if not found
        if (this.shiftTypeCssMap && this.shiftTypeCssMap[shiftTypeLower]) {
            return this.shiftTypeCssMap[shiftTypeLower];
        }
        
        // Fallback colors based on shift type
        switch (shiftTypeLower) {
            case 'general':
                return '#3B82F6';
            case 'emergency':
                return '#EF4444';
            case 'overnight':
                return '#8B5CF6';
            case 'weekend':
                return '#10B981';
            case 'holiday':
                return '#F59E0B';
            default:
                return '#6B7280';
        }
    } */

    getShiftTypeColor(typeofShift) {
        const shiftTypeLower = typeofShift ? typeofShift.toLowerCase() : '';
        if (this.shiftTypeCssMap && this.shiftTypeCssMap[shiftTypeLower]) {
            return this.shiftTypeCssMap[shiftTypeLower]; // Uses Apex colors
        }
        // Fallback colors if Apex fails
    }

    getServiceIcon(serviceType) {
        const serviceTypeLower = serviceType ? serviceType.toLowerCase() : '';
        switch (serviceTypeLower) {
            case 'community nursing care':
                return 'utility:activity';
            case 'physical therapy':
                return 'utility:people';
            case 'home health aide':
                return 'utility:home';
            case 'medication management':
                return 'utility:pill';
            case 'occupational therapy':
                return 'utility:groups';
            case 'social work':
                return 'utility:user';
            default:
                return 'utility:clock';
        }
    }

    positionEventsWithOverlapHandling() {
        const positioned = [];
        const overlapGroups = [];
        const processedEvents = new Set();

        // Group overlapping events
        this.events.forEach(event => {
            if (processedEvents.has(event.id)) return;

            const overlappingEvents = this.events.filter(otherEvent => 
                this.eventsOverlap(event, otherEvent)
            );

            if (overlappingEvents.length > 1) {
                // Mark all events in this group as processed
                overlappingEvents.forEach(e => processedEvents.add(e.id));

                // Sort by start time for consistent positioning
                overlappingEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

                // Calculate group time range
                const groupStartTime = new Date(Math.min(...overlappingEvents.map(e => e.startTime.getTime())));
                const groupEndTime = new Date(Math.max(...overlappingEvents.map(e => e.endTime.getTime())));

                // Create overlap group for table
                const groupServices = overlappingEvents.map(e => {
                    return {
                        id: e.id,
                        serviceType: e.serviceType,
                        resourceName: e.resourceName,
                        individualTime: e.individualTime,
                        indicatorStyle: `background-color: ${e.color};`
                    };
                });

                overlapGroups.push({
                    timeSlot: `${this.formatTime(groupStartTime)} - ${this.formatTime(groupEndTime)}`,
                    services: groupServices,
                    serviceCount: `${overlappingEvents.length}`
                });

                // Position overlapping events horizontally
                const totalColumns = overlappingEvents.length;
                const columnWidth = 100 / totalColumns;

                overlappingEvents.forEach((overlappingEvent, index) => {
                    const { topPosition, height } = this.getEventPosition(overlappingEvent.startTime, overlappingEvent.endTime);
                    const color = this.getShiftTypeColor(overlappingEvent.typeofShift);
                    
                    positioned.push({
                        id: overlappingEvent.id,
                        title: overlappingEvent.title,
                        resourceName: overlappingEvent.resourceName,
                        serviceType: overlappingEvent.serviceType,
                        cardStyle: `top: ${topPosition}px; height: ${Math.max(height, 60)}px; left: ${index * columnWidth}%; width: ${columnWidth - 1}%; border-left: 4px solid ${color}; z-index: ${10 + index};`,
                        iconStyle: `background-color: ${color}20; color: ${color};`,
                        iconName: this.getServiceIcon(overlappingEvent.serviceType),
                        timeDisplay: `${this.formatTime(overlappingEvent.startTime)} - ${this.formatTime(overlappingEvent.endTime)}`,
                        isOverlapping: true,
                        overlapPosition: `${index + 1}/${totalColumns}`
                    });
                });
            } else {
                // Single event - no overlap
                processedEvents.add(event.id);
                const { topPosition, height } = this.getEventPosition(event.startTime, event.endTime);
                const color = this.getShiftTypeColor(event.typeofShift);
                
                positioned.push({
                    id: event.id,
                    title: event.title,
                    resourceName: event.resourceName,
                    serviceType: event.serviceType,
                    cardStyle: `top: ${topPosition - 50}px; height: ${Math.max(height, 60)}px; left: 0%; width: 99%; border-left: 4px solid ${color};`,
                    iconStyle: `background-color: ${color}20; color: ${color};`,
                    iconName: this.getServiceIcon(event.serviceType),
                    timeDisplay: `${this.formatTime(event.startTime)} - ${this.formatTime(event.endTime)}`,
                    isOverlapping: false,
                    overlapPosition: ''
                });
            }
        });

        this.positionedEvents = positioned;
        this.overlappingGroups = overlapGroups;
        this.hasOverlappingServices = overlapGroups.length > 0;
        this.hasOverlaps = overlapGroups.length > 0;
        this.overlapCount = overlapGroups.length;
    }

    processEvents(data) {
        if (!data || data.length === 0) {
            this.events = [];
            this.positionedEvents = [];
            this.overlappingGroups = [];
            this.hasOverlappingServices = false;
            this.hasOverlaps = false;
            this.overlapCount = 0;
            return;
        }

        const processedEvents = data.map(event => {
            const startTime = event.startDatetime ? new Date(event.startDatetime) : null;
            const endTime = event.endDatetime ? new Date(event.endDatetime) : null;

            if (!startTime || isNaN(startTime) || !endTime || isNaN(endTime)) {
                console.error('Invalid date for event:', event);
                return null;
            }

            const eventColor = this.getShiftTypeColor(event.typeofShift);

            return {
                id: event.servicePlanId || event.id,
                title: event.serviceType,
                resourceName: event.computedResourceName,
                typeofShift: event.typeofShift,
                startTime: startTime,
                endTime: endTime,
                individualTime: `${this.formatTime(startTime)} - ${this.formatTime(endTime)}`,
                serviceType: event.serviceType,
                color: eventColor
            };
        }).filter(event => event !== null);

        this.events = processedEvents;

        if (this.events.length > 0) {
            this.positionEventsWithOverlapHandling();
        }
    }

    @wire(getShiftTypeCssMap)
    wiredShiftTypeCssMap({ error, data }) {
        if (data) {
            this.shiftTypeCssMap = data;
            // Re-processes events when colors are loaded
        }
    }

    
    @wire(getServicesAndSupportPlans, { recordId: '$clientId' })
    wiredEvents({ error, data }) {
        if (data) {
            console.log('Fetched Events:', JSON.stringify(data));
            this.processEvents(data);
        } else if (error) {
            console.error('Error fetching events:', error);
            // Fallback to mock data on error
        }
    }
   
}