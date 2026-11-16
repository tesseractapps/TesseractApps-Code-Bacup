import { LightningElement, track, wire, api } from 'lwc';
import getAddShiftById from '@salesforce/apex/ShiftReportsController.getAddShiftById';
import getJSONdata from '@salesforce/apex/GeoTaggingfromAWS.getS3JsonData';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import LEAFLET from '@salesforce/resourceUrl/leaflet';
import { loadScript, loadStyle } from "lightning/platformResourceLoader";
import getCasesByStaff from '@salesforce/apex/ShiftReportsController.getCasesByStaff';
import getjournalsByStaff from '@salesforce/apex/ShiftReportsController.getjournalsByStaff';
import getformsByStaff from '@salesforce/apex/ShiftReportsController.getformsByStaff';

export default class ShiftReportsViewLwc extends LightningElement {
     @api shiftId;
    wiredShiftDetails;
    
    @track shiftNotes = [];
    @track activityLogs = [];
    @track checklist = [];
    @track servicesDelivered = [];
    @track reimbursements = [];
    @track isSidebarHome = true;
    @track sign;
    @track shiftDate;
    @track shiftStatus;
    @track jsonData;
    //@track incidentsList = [];
    @track staffSummary = {
      name: '',
      date: '',
      shift: '',
      role: ''
    };
     leafletInitialized = false;
    connectedCallback() {
        console.log('shiftId  in connectedCallback StaffShiftSummary=> ' , this.shiftId);
        this.fetchShiftData();
    }
      renderedCallback() {
        // Check if leaflet resources are already loaded
        if (this.leafletInitialized) {
            return;
        }
  
        // Load Leaflet.js and Leaflet.css files
        Promise.all([
            loadScript(this, LEAFLET + '/leaflet.js'),
            loadStyle(this, LEAFLET + '/leaflet.css')
        ])
        .then(() => {
            this.leafletInitialized = true;
        })
        .catch(error => {
            console.error('Error loading Leaflet:', error);
        });
    }
   
    //  @wire(getAddShiftDataById, { shiftId: '$shiftId'})
    //   wiredShiftData(result) {
      
    //       this.wiredShiftDetails = result;
    //       const { data, error } = result;
    //         console.log('result =>', JSON.stringify(result));
    //       if (data) {
    //           this.staffData = data.map(shift => ({
    //               id: shift.Id,
    //               date: shift.Start_Date__c 
    //                           ? new Date(shift.Start_Date__c).toLocaleDateString('en-GB') 
    //                           : '',
    //               shiftType: shift.Shift_Type__c,
    //               name: shift.Staff_Name__c,
    //               scheduledTime: shift.Add_Shift__r.Shift_Start_End_Time__c,
    //               participants: (shift.Services_and_Support_Plans__r || []).map(p => p.Participant_Name__c).join(', ')
    //                 //participants: shift.Services_and_Support_Plans__r[0].Participant_Name__c
    //           }));
              
    //           //this.error = undefined;
    //       } else  {
    //           //this.error = error;
    //           this.staffData = [];
    //           // console.error('Error in wired data:', error);
    //       }
    //   }
   @track ClientId;
    fetchShiftData() {
      getAddShiftById({ shiftId: this.shiftId })
        .then(data => {
             console.log('Raw Apex data:', JSON.stringify(data));
             
            const shift = data.shiftwithstaffdata;
            if (shift?.Services_and_Support_Plans__r?.length) {
                this.ClientId = shift.Services_and_Support_Plans__r[0].Client__c;
                console.log('ClientId:', this.ClientId);
            }
            console.log('ClientId:', this.ClientId);
            const checklistRaw = JSON.parse(data.checklistdata || '[]');
            if (shift) {
              this.staffSummary = {
                //name: shift.Staff_Name__c || '', // adjust based on your actual field
                staffid: shift.Staff__c || '',
                name: shift.Staff__r.Display_Nickname__c || '',
                date: shift.Date__c 
                            ? new Date(shift.Date__c).toLocaleDateString('en-GB') 
                            : '',
                shift: shift.Shift_Start_End_Time__c || '',
                role: shift.Add_Shift__r?.Role__c || '',
                Startdate: shift.Date__c || ''
              };

              console.log('Summary updated:', JSON.stringify(this.staffSummary));
              const rawActivities = shift.ShiftWithStaff_Activities__r || [];
              this.activityLogs = rawActivities.map(act => ({
              time: act.CreatedDate
                  ? new Date(act.CreatedDate).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })
                  : '',
                task: act.Notes__c || ''
              }));

            console.log('Activity Logs:', JSON.stringify(this.activityLogs));
          
            const notesRaw = shift.Add_Shift__r?.Shift_Notes__c || '';

            // Example: split notes by line breaks
            this.shiftNotes = notesRaw
              .split(/\r?\n/)           // split by newlines
              .map(n => n.trim())       // remove surrounding spaces
              .filter(n => n.length);   
              console.log('Notes:', JSON.stringify(this.shiftNotes));

              //this.sign = shift.Client_Signature__c || '';
              const html = shift.Client_Signature__c || '';
              this.sign = this.extractImgSrcFromHtml(html);

              this.shiftStatus = shift.Status__c || '';
              this.shiftDate = shift.Date__c || '';
              console.log('sign  in  fetchShiftData    => ' , this.sign);
               console.log('shiftId  in  fetchShiftData    => ' , this.shiftId);
               console.log('shiftStatus  in  fetchShiftData    => ' , this.shiftStatus);
               console.log('shiftDate  in  fetchShiftData    => ' , this.shiftDate);

              const rawReimbursements = shift.Reimbursements__r || [];
              this.reimbursements = rawReimbursements.map((r, index) => ({
                item: r.Type_of_Vehicle__c || `Item ${index + 1}`,
                amount: r.Total_Amount__c || 0,
                comments: r.Comments__c || 'No Comment',
                approvalStatus: r.Approval_Status__c || ''
              
              }));
              console.log('Reimbursements:', JSON.stringify(this.reimbursements));

              // ✅ Services Delivered
              const rawServices = shift.Services_and_Support_Plans__r || [];
              this.servicesDelivered = rawServices.map((s, index) => ({
                time: s.Start_Time_Formula__c || `Time ${index + 1}`,
                service: s.Service_Type_Name__c || 'Unknown Service',
                hours: s.Qty__c || 0,
                Client:s.Client__c ||''
              }));
              console.log('Services Delivered:', JSON.stringify(this.servicesDelivered));
                          
            } else {
              console.warn('No shift data found for summary.');
              this.staffSummary = { name: '', date: '', shift: '', role: '' };
            }
           
            if(checklistRaw){
               this.checklist = checklistRaw.map(item => item.Description__c || '');
                console.log('Checklist:', JSON.stringify(this.checklist));
            } else {
              this.checklist = [];
            }
            
            // ✅ Extract and store just the description (or any other fields you want)
           
            this.getIncidents();
            this.loadJournals();
            this.getForms();
            this.handleGetlocation();
          })
      .catch(error => {
        console.error('Error fetching shift summary:', error);
        this.staffSummary = { name: '', date: '', shift: '', role: '' };
      });
     
  }
  extractImgSrcFromHtml(htmlString) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    const img = tempDiv.querySelector('img');
    const src = img ? img.getAttribute('src') : '';
    return src.startsWith('/') ? window.location.origin + src : src;
  }
  // handleBack(){
  //    this.isSidebarHome = false;
  // }
  handleBack() {
    const backEvent = new CustomEvent('back');
    this.dispatchEvent(backEvent);
     this.isSidebarHome = false;
  }
  geoTagErrorMessage = '';
  handleGetlocation(){
    console.log('Activity clicked for shift ID in handleGetlocation:', this.shiftId+''+this.shiftDate+''+this.shiftStatus );
    getJSONdata( {shiftid: this.shiftId, shiftstatus: this.shiftStatus, sdate: this.shiftDate} )
    .then(result => {
        this.jsonData = JSON.parse(result);
        console.log("JSON Data handleGetlocation : " + JSON.stringify(this.jsonData));  
    //     //this.isShowMap = true;           
    //     this.setLatitudeLongitudeData();
    
    // })
    // .catch(error => {
    //  // this.isShowMap=false;
    //     console.error('Error loading JSON:', error);
    //     this.dispatchEvent(
    //         new ShowToastEvent({
    //           title: 'Error',
    //           message: 'No data found .',
    //           variant: 'Error'
    //         })
    //         );
  
    // });
    if (!this.jsonData || this.jsonData.length === 0) {
        this.geoTagErrorMessage = 'No data found.';
      } else {
        this.geoTagErrorMessage = ''; // clear any previous errors
        this.setLatitudeLongitudeData();
      }
    })
    .catch(error => {
      console.error('Error loading JSON:', error);
      this.geoTagErrorMessage = 'No data found.';
    });
  }
  
  setLatitudeLongitudeData() {
    console.log('setLatitudeLongitudeData is found ');
    // Ensure the DOM is rendered before accessing it
    setTimeout(() => {
        const mapContainer = this.template.querySelector('.map-container');
        // Check if the mapContainer exists
        if (!mapContainer) {
            console.error('Map container not found');
            return; // Exit the function if the container is not found
        }
        if (this.map) {
         this.map.off();      // removes all listeners
         this.map.remove();   // completely destroys the map
         this.map = null;
       }
        // Initialize the Leaflet map if not already done
        if (!this.map) {
            this.map = L.map(mapContainer).setView([this.jsonData[0].coords.latitude, this.jsonData[0].coords.longitude], 20);
  
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(this.map);
        }
        // Add markers to the map
        this.jsonData.forEach(item => {
            const lat = item.coords.latitude;
            const lng = item.coords.longitude;
            L.marker([lat, lng]).addTo(this.map).bindPopup(`Location: ${lat}, ${lng}`);
            
        });
        // Draw the polyline between coordinates
        const polylineCoordinates = this.jsonData.map(item => [item.coords.latitude, item.coords.longitude]);
  
        // Check if a polyline already exists, and remove it
        if (this.polyline) {
            this.map.removeLayer(this.polyline);
        }
  
        this.polyline = L.polyline(polylineCoordinates, {
            color: 'blue',
            weight: 4,
            opacity: 0.6
        }).addTo(this.map);
    }, 1000); // Use setTimeout to ensure the DOM is rendered
  }
  @track incidentRegister = [];
   getIncidents(){
       console.log(' shift ID in getIncidents:', this.staffSummary.staffid+''+this.staffSummary.date+''+this.shiftStatus );
        getCasesByStaff({ staffId:  this.staffSummary.staffid, StartDate: this.staffSummary.Startdate})
          /*  .then(result => {
               console.log("result  IN getShiftWithCases : " + JSON.stringify(result));  
                 if (result.status === 'success' && result.incidents) {
                    // Map Apex cases to your expected structure if needed
                     this.incidentsList = result.incidents.map(inc => {
                     return {
                      Id: inc.Id,
                            //Name: inc.CaseNumber + ': ' + inc.Subject ||'',
                             Name: inc.CaseNumber,
                           status: inc.Status
                         };
                   });
                    this.error = null;
                 } else {
                     this.incidentsList = [];
                    this.error = result.message || 'No incidents found';
              }
           })
            .catch(error => {
                 this.incidentsList = [];
                this.error = error.body ? error.body.message : error.message;
             }); */
          .then(result => {
            this.incidentRegister = result;
            console.log("result  IN getShiftWithCases : " + JSON.stringify(result));
        })
        .catch(error => {
            console.error(error);
        });
            }

@track journalList = [];
     loadJournals() {
        getjournalsByStaff({ staffId: this.staffSummary.staffid, StartDate: this.staffSummary.Startdate, ClientId:this.ClientId })
        .then(result => {
            this.journalList = result;
            console.log('Journals: ',JSON.stringify(result));
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    @track FormsList = [];

     getForms() {
        getformsByStaff({ staffId: this.staffSummary.staffid, StartDate: this.staffSummary.Startdate, ClientId:this.ClientId })
        .then(result => {
            this.FormsList = result;
            console.log('FormsList: ',JSON.stringify(result));
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
 
  
}