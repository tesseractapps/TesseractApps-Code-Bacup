import { api, LightningElement, track, wire } from 'lwc';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import FullCalendarJS from '@salesforce/resourceUrl/FullCalendar';
import getServicesAndSupportPlans from '@salesforce/apex/ServiceSupportPlanHandler.getServicesAndSupportPlans';

export default class ParticipantScheduleLwc extends LightningElement {
    isLibraryLoaded = false;
    @api clientId;
    events=[];
    calendarInitialized = false;

     @wire(getServicesAndSupportPlans, { clientId: '$clientId' })
    wiredServices({ error, data }) {
        if (data) {
            // Transform data into FullCalendar event format
            this.events = data.map(service => {
            return {
                title: `${service.Resource_Name__c} - ${service.Service_Type_Name__c}`,

                //title: service.Service_Type_Name__c, // Set title
                start: service.start_datetime__c, // Format start time
                end: service.end_datetime__c, // Format end time
        
            };
            });
            console.log('events',JSON.stringify(this.events));
            this.calendarInitialized = true;
             if(this.isLibraryLoaded){
                this.initializeCalendar();// Initialize calendar only after data is available
                console.log('calender intialize');
            } 
            
        } else if (error) {
            console.error('Error fetching services: ', error);
        }
    } 

    

    renderedCallback() {
        if (this.isLibraryLoaded) {
            return;
        }        
        console.log('FullCalendar Resource URL:', FullCalendarJS);
        
        Promise.all([
            loadStyle(this, FullCalendarJS + '/lib/fullcalendar.min.css'),
            loadScript(this, FullCalendarJS + '/lib/jquery.min.js'),
            loadScript(this, FullCalendarJS + '/lib/moment.min.js'),
            loadScript(this, FullCalendarJS + '/lib/fullcalendar.min.js'),
            
        ])
        .then(() => {
            
           console.log('FullCalendar library loaded successfully.');
           if (this.calendarInitialized ) {
            // Destroy existing calendar instance
            this.initializeCalendar();
        }
           //this.wiredServices.refresh();
           this.isLibraryLoaded = true;
           
        })        
        .catch(error => console.log(error));
    }
        
    
            initializeCalendar() {
              
                
                    const calendarelement = this.template.querySelector('.fullcalendar');
                   
                    
                
                        $(calendarelement).fullCalendar({
                            header: {
                                left: 'prev today next',
                                center: 'title',
                                right: 'agendaWeek,agendaDay,listWeek',
                            },
                            buttonText: {
                                today: 'Today', // Custom label with capital "T"
                                month: 'Month',
                                week: 'Week',
                                day: 'Day',
                                listWeek: 'List'
                            },
                            defaultView: 'agendaWeek',
                           eventColor: '#0099DE',
                           // editable: true, // Enables drag-and-drop
                            events: this.events, // Sets initial events
                           /*  eventRender: function (event, element) {
                                console.log('Rendering event:', event);
                                if (event.start && event.end) {
                                    // Manually adjust the display format for the time
                                    element.find('.fc-time').text(
                                        `${moment(event.start).format('hh:mm A')} - ${moment(event.end).format('hh:mm A')}`
                                    );
                                }
                            }, */ 
                            /* eventRender: function(event, element) {
                                // Force a smaller font size or append the title explicitly
                                element.find('.fc-title').css('font-size', '12px'); // Adjust as needed
                                element.attr('title', event.title); // Add a tooltip
                              }, */
                              eventRender: function (event, element) {
                                // Format the tooltip content
                                const tooltipContent = `${event.title}\nStart: ${moment(event.start).format('hh:mm A')}\nEnd: ${moment(event.end).format('hh:mm A')}`;
                                element.attr('title', tooltipContent); // Set the tooltip content
                                element.addClass('custom-tooltip');
                            },
                            
                            
                            columnHeaderText: (date) => {
                                // Customize the header format here
                                return moment(date).format(' ddd DD-MM-YYYY'); // Example: "Monday, 01/01"
                            },
                            timeFormat: 'hh:mm A',
                            minTime: '00:00:00',
                            maxTime: '23:59:00',
                            //nowIndicator: true, 
                            allDaySlot: false,
                            slotLabelFormat: 'hh:mm A',
                          // slotDuration: '03:00:00',
                            height:600, // Set calendar height
                            //contentHeight: 'auto',
                            //slotLabelInterval: '01:00:00',
                           // aspectRatio: 5,
                           firstDay: 1, 
                           overlap: false,

                            

                        });
                        
                        
            } 
          
}