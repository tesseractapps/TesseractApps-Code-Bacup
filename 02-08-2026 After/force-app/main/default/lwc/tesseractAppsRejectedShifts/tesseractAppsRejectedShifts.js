import { LightningElement, wire, track, api } from "lwc";
import getRejectedShifts from "@salesforce/apex/AddShiftController.getRejectedShifts";
import RejectedshiftAllocation from "@salesforce/apex/AddShiftController.RejectedshiftAllocation";
import holidayList from "@salesforce/apex/LeaveController.holidayListbyOrg";
import getStaffHourlyRates from "@salesforce/apex/RostersPublishAndAssignHandler.getStaffHourlyRates";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import assignAutoShifts from "@salesforce/apex/RosterRejectedShiftsAutoScheduleHandler.assignAutoShifts";
import { refreshApex } from "@salesforce/apex";
import publishShifts from "@salesforce/apex/RosterAutoScheduleHandler.publishShifts";
import getFacilityData from "@salesforce/apex/HrHomeHandler.fetchFacilitiess";
import getCurrentLoggedUserInfo from "@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo";
import fetchStaff from "@salesforce/apex/StaffController.fetchStaff";
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import getShiftTypes from "@salesforce/apex/AddShiftParticipantView.getShiftTypes";
import validateStaffAvailabilityWithReasons from '@salesforce/apex/RosterCreation.validateStaffAvailabilityWithReasons';
import markNotificationRead from '@salesforce/apex/NotificationServices.markNotificationRead';
import getUnreadRejectedShiftIds from "@salesforce/apex/NotificationServices.getUnreadRejectedShiftIds";
import getLoggedInStaffId from "@salesforce/apex/NotificationServices.getLoggedInStaffId";
import RejectedShiftSettings from "@salesforce/apex/OrgDetails.RejectedShiftSettings";

export default class TesseractAppsRejectedShifts extends LightningElement {
  @track loggedInStaffId;
  @api orgid;
  headers = [];
  currentStartDate = new Date();
  @api state;
  @track holidayList = [];
  @track rejectedShifts = [];
  @track staffHorlyRateList = [];
  @track isAllocateTable = false;
  @track shiftId;
  @track selectedStaffId;
  @api get isEdit() { return false; }
  @api get currentStep() { return ""; }
  // @api currentTabSlug() { return ""; }
  // @api selectTab(slug) {}

  @api get currentSelectedDate() {
      return this.selectedDateValue;
  }

  @api currentTabSlug() {
      if (this.isRejectedShiftReports) return "reports";
      return "calendar";
  }

  @api selectTab(slug) {
      if (slug === 'reports') {
          this.HandleReports();
      } else {
          this.handleCalendar();
      }
  }  
  @api startEdit() {}
  @api setStep(step) {}
  @api openPopup(slug) {}  
  @track shiftRows = [];
  @track rows = [
    {
      id: "1",
      label: "Classification",
      isIcon: true,
      direction: "arrowup",
      iconName: "utility:arrowup",
      directionLabel: "Low to High"
    },
    {
      id: "2",
      label: "Risk Index",
      isIcon: true,
      direction: "arrowup",
      iconName: "utility:arrowup",
      directionLabel: "Low to High"
    },
    { id: "3", label: "Employment Type", isRadio: true, value: "Permanent" },
    { id: "4", label: "Preferred Staff", isCheckbox: true, value: false },
    { id: "5", label: "Fatigue Management", isCheckbox: true, value: false },
    { id: "6", label: "Geo Location", isSlider: true, value: 50 }
  ];
  @track currentUserEmail;
  @track usererror;
  @track documentExpired = false;

  @track autoschdulePopup = false;
  @track publishTempalte = false;
  @track startDate;
  @track endDate;
  wiredRejectedShiftsResult;
  @track selectedDateValue;
  @track isHome = false;
  @track isRejectedShiftReports = false;
  @track facilityArray = [];
  @track facilityPreferredName;
  @track participantPreferredName;
  @track staffPreferredName;
  @track storedFacilityId;
  @track shiftTypes = [];

   get CalendarClass(){
        return (this.isHome) ? 'menu-item1' : 'menu-item'; 
    
    }
    get ReportsClass(){
        return (this.isRejectedShiftReports) ? 'menu-item1' : 'menu-item'; 
    
    }
  _navigatedDate;
  @api
  get navigatedDate() {
    return this._navigatedDate;
  }
  set navigatedDate(value) {
    this._navigatedDate = value;
    if (value) {
      console.log('📌 [tesseractAppsRejectedShifts] navigatedDate setter called with value:', value);
      this.selectedDateValue = value;
      this.currentStartDate = new Date(value);
      this.initializeHeaders();
      this.fetchHolidays();
    }
  }


  connectedCallback() {
    this.initializeHeaders();
    this.fetchOrgDetails();
    //this.loadShifts();
    this.fetchHolidays();
    this.loadLoggedInStaffId();
    // this.getUnreadRejectedShiftIds();//manendra added for notification badge count
    this.storedFacilityId = localStorage.getItem("defaultFacilityId");
    this.loadShiftTypes();
    // const today = new Date();
    // this.selectedDateValue = today.toISOString().split("T")[0]; // format: YYYY-MM-DD
    this.isHome = true;
    this.facilityArray = [];
    this.participantPreferredName = this.participantPreferredName =
      localStorage.getItem("defaultParticipantPreferredName") || "Participant";
    this.facilityPreferredName =
      localStorage.getItem("defaultFacilityPreferredName") || "Facility";
    this.staffPreferredName =
      localStorage.getItem("defaultStaffPreferredName") || "Staff";

    if (!this._navigatedDate) {
      const today = new Date();
      this.selectedDateValue = today.toISOString().split("T")[0]; // format: YYYY-MM-DD      
    setTimeout(() => {
      this.navigateToToday();
    }, 1000);
  }

    /*    getCurrentLoggedUserInfo().then((userInfo) => { 
                                    console.log('userInfo' +userInfo.User_Type__c);
                                    if(userInfo.User_Type__c =='Facility Admin' || userInfo.User_Type__c =='HR Admin' || userInfo.User_Type__c =='Roster Manager'){ 
                                        const storedFacilityId = localStorage.getItem('defaultFacilityId');
                                        const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');
                                        this.facilityArray.push(storedFacilityId);
                                  }else{
                                    getFacilityData().then(response => {
                                            response.forEach(rec=>{
                                                this.facilityArray.push(rec.Id);
                                            });
                                                 console.log('facilityArray '+JSON.stringify(facilityArray))
                                            }).catch(err => {
                                            console.error(err);
                                    });
                                  }
                }) */
      const activeClick = localStorage.getItem('rosterRejectedShiftTab'); 
    /* S */   
      window.addEventListener('keydown', this.handleKeyShortcut.bind(this));
  }

  disconnectedCallback() {
    window.removeEventListener('keydown', this.handleKeyShortcut.bind(this));
  }

  loadShiftTypes() {
      getShiftTypes({ facIdlist: this.storedFacilityId })
          .then(result => {
              console.log('✅ Shift Types from Apex:', JSON.stringify(result));
              this.shiftTypes = result.map(st => {
                  return {
                      ...st,
                      styleString: `border-left: 6px solid ${st.Colour__c}; 
                                    background-color: ${st.Colour__c}20; 
                                    color: ${st.Colour__c}; 
                                    border-radius: 6px;`
                  };
              });
              console.log('✅ Processed shiftTypes with style:', JSON.stringify(this.shiftTypes));

              // After loading shift types → map shifts
              this.mapShiftsToHeaders();
          })
          .catch(error => {
              console.error('❌ Error fetching shift types:', error);
          });
  }


  fetchOrgDetails() {
    orgDetails()
      .then((response) => {
        console.log("Org Details", JSON.stringify(response));
        this.Orgid = response.Id;
        this.orgfullname = response.Name;
        this.rejectShiftHours = response.Shift_Rejection_Hours__c;
        //this.facilityPreferredName = response.Facility_Preferred_Name_Formula__c;
        //this.participantPreferredName = response.Participant_Preferred_Name_Formula__c;
      })
      .catch((error) => {
        console.error("Error fetching org details:", error);
        this.error = error;
      });
  }
  handleCalendar(event){
    this.isHome=true;
    this.isRejectedShiftReports=false;
    this.notifyStateChange();
  }

  initializeHeaders() {
    const dayFormatter = new Intl.DateTimeFormat("en-GB", { weekday: "short" });

    const baseDate = new Date(this.currentStartDate);
    const dayOfWeek = baseDate.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6

    // Adjust to get Monday as the start of the week
    const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // if Sunday (0), go back 6 days

    const weekStart = new Date(baseDate);
    weekStart.setDate(baseDate.getDate() + offset);
    this.startDate = weekStart.toISOString().split("T")[0];
    this.headers = [];

    for (let i = 0; i < 7; i++) {
      const current = new Date(weekStart);
      current.setDate(weekStart.getDate() + i);

      const dd = String(current.getDate()).padStart(2, "0");
      const mm = String(current.getMonth() + 1).padStart(2, "0");
      const yyyy = current.getFullYear();
      const formattedDate = `${dd}`;
      const isoDate = current.toISOString().split("T")[0];

      this.headers.push({
        dayName: dayFormatter.format(current),
        date: formattedDate,
        key: isoDate,
        shifts: [],
        hasShifts: false
      });
      if (i === 6) {
        this.endDate = isoDate;
      }
    }
    refreshApex(this.wiredRejectedShiftsResult);
    //  console.log('headers:',  JSON.stringify(this.headers));
  }

  handlePreviousWeek() {
    this.currentStartDate = new Date(
      this.currentStartDate.getTime() - 7 * 24 * 60 * 60 * 1000
    );
    this.selectedDateValue = this.currentStartDate.toISOString().split("T")[0];
    this.initializeHeaders();
    this.fetchHolidays();
    this.notifyStateChange();
  }

  handleNextWeek() {
    this.currentStartDate = new Date(
      this.currentStartDate.getTime() + 7 * 24 * 60 * 60 * 1000
    );
    this.selectedDateValue = this.currentStartDate.toISOString().split("T")[0];
    this.initializeHeaders();
    this.fetchHolidays();
    this.notifyStateChange();
  }

  navigateToToday() {
    this.currentStartDate = new Date();
    this.selectedDateValue = this.currentStartDate.toISOString().split("T")[0];
    this.initializeHeaders();
    this.fetchHolidays();
    this.notifyStateChange();
  }
  handleDateChange(event) {
    this.selectedDateValue = event.target.value; // update tracked value
    if (this.selectedDateValue) {
      this.currentStartDate = new Date(this.selectedDateValue);
      this.initializeHeaders();
      this.fetchHolidays();
      this.notifyStateChange();
    }
  }
  get wiredDateParams() {
    return {
      datePicker: this.currentStartDate.toISOString().split("T")[0],
      orgId: this.orgid
    };
  }
// manendra added for notification badge count
getUnreadRejectedShiftIds() {

    getUnreadRejectedShiftIds({

        staffId: this.loggedInStaffId
    })
    .then(result => {

        this.unreadRejectedShiftIds = result;

        console.log(
            'Unread Rejected Shift Ids ==> ',
            JSON.stringify(result)
        );

        this.mapShiftsToHeaders();
    })
    .catch(error => {

        console.error(
            'Unread Rejected Shift Error ==> ',
            error
        );
    });
}
loadLoggedInStaffId() {

    getLoggedInStaffId()

    .then(result => {

        this.loggedInStaffId = result;

        console.log(
            'Logged In Staff Id ==> ',
            result
        );

        this.getUnreadRejectedShiftIds();
    })

    .catch(error => {

        console.error(
            'Logged In Staff Error ==> ',
            error
        );
    });
}// manendra added for notification badge count

  @wire(getRejectedShifts, {
    datePicker: "$wiredDateParams.datePicker",
    orgId: "$wiredDateParams.orgId"
  })
  wiredRejectedShifts(result) {
    this.wiredRejectedShiftsResult = result; // for refreshApex
    console.log("result getRejectedShifts " + JSON.stringify(result));
    if (result.data) {
      const storedFacilityId = localStorage.getItem("defaultFacilityId");
      const storedFacilityLabel = localStorage.getItem("defaultFacilityLabel");

      console.log("storedFacilityId >>", storedFacilityId);
      console.log("storedFacilityLabel >>", storedFacilityLabel);
     /*  let fanalData = result.data;
      let facilityIds = [];
      facilityIds.push(storedFacilityId);
      const filteredData = fanalData.filter((rec) =>
        facilityIds.includes(rec.Add_Shift__r?.Facility__c)
      ); */
      const unwrapped = (result.data || [])
            .filter(w => w && w.shift) // 🔴 FIX
            .map(w => ({
                ...w.shift,
                reassignedStaffName: w.reassignedStaffName || '',
                reassignedDate: w.reassignedDate ? new Date(w.reassignedDate).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        }) :'',
            }));

        const filteredData = unwrapped.filter(
            rec => rec.Add_Shift__r?.Facility__c === storedFacilityId
        );
      this.rejectedShifts = filteredData;
      console.log("this.rejectedShifts >>", JSON.stringify(this.rejectedShifts));
      this.mapShiftsToHeaders();
    } else if (result.error) {
      console.error("Error in wiredRejectedShifts:", result.error);
    }
  }

  /* mapShiftsToHeaders() {
    this.headers.forEach((header) => {
      header.shifts = [];
      header.hasShifts = false;
    });

    this.rejectedShifts.forEach((shift) => {
      const startDateStr = shift.Add_Shift__r?.Start_Date__c;
      const header = this.headers.find((h) => h.key === startDateStr);
      if (header) {
        header.shifts.push({
          id: shift.Id,
          staffName: shift.Staff__r?.Name || "Unknown",
          staffName1: shift.Staff__r?.Display_Nickname__c || "Unknown",
          time: shift.Add_Shift__r?.Shift_Start_End_Time__c || "",
          role: shift.Add_Shift__r?.Role__c || "",
          location: shift.Add_Shift__r?.Location__Street__s || "",
          direction: shift.Add_Shift__r?.Direction__r?.Name || "",
          staffId: shift.Staff__c,
          picture: shift.Staff__r?.picture__c || "",
          shiftColor: shift.Shiftcolor__c || "",
          isAssigned: shift.Rejected_Assigned__c || false
        });
        header.hasShifts = true;
      }
    });

    this.headers = [...this.headers]; // trigger reactivity
    this.computeShiftRows();
  } */

    /* mapShiftsToHeaders() {
      this.headers.forEach((header) => {
          header.shifts = [];
          header.hasShifts = false;
      });


      console.log('this.rejectedShifts ' + JSON.stringify(this.rejectedShifts));

      this.rejectedShifts.forEach((shift) => {
          const startDateStr = shift.Add_Shift__r?.Start_Date__c;
          const header = this.headers.find((h) => h.key === startDateStr);

          if (header) {
              // 🔹 Debug incoming shift
              console.log("=======================================");
              console.log("Shift Id:", shift.Id);
              console.log("Shift_Name__c (from Add_Shift__r):", shift.Add_Shift__r.Shift_Name__c);

              // 🔹 Try match by Id first
              let matchedShiftType = this.shiftTypes.find(
                  (st) => st.Id === shift.Add_Shift__r.Shift_Name__c
              );

              // 🔹 If not found, try match by Name
              if (!matchedShiftType) {
                  matchedShiftType = this.shiftTypes.find(
                      (st) => st.Name === shift.Add_Shift__r.Shift_Name__c
                  );
              }

              // 🔹 Debug shift types and match
              console.log("Available Shift Types Ids:", this.shiftTypes.map(st => st.Id));
              console.log("Available Shift Types Names:", this.shiftTypes.map(st => st.Name));
              console.log("Matched Shift Type:", JSON.stringify(matchedShiftType));

              // ✅ Build CSS style
              let shiftColorStyle = shift.Shiftcolor__c; // fallback from backend
              if (matchedShiftType && matchedShiftType.Colour__c) {
                  shiftColorStyle = `border-left: 6px solid ${matchedShiftType.Colour__c}; 
                                    background-color: ${matchedShiftType.Colour__c}20; 
                                    color: ${matchedShiftType.Colour__c}; 
                                    border-radius: 6px;`;
              }

              console.log("Final shiftColorStyle:", shiftColorStyle);

              // ✅ Push into header
              header.shifts.push({
                  id: shift.Id,
                  staffName: shift.Staff__r?.Name || "Unknown",
                  staffName1: shift.Staff__r?.Display_Nickname__c || "Unknown",
                  time: shift.Add_Shift__r?.Shift_Start_End_Time__c || "",
                  role: shift.Add_Shift__r?.Role__c || "",
                  location: shift.Add_Shift__r?.Location__Street__s || "",
                  direction: shift.Add_Shift__r?.Direction__r?.Name || "",
                  staffId: shift.Staff__c,
                  picture: shift.Staff__r?.picture__c || "",
                  shiftColor: shiftColorStyle,
                  isAssigned: shift.Rejected_Assigned__c || false
              });

              header.hasShifts = true;
          }
      });

      this.headers = [...this.headers]; // trigger reactivity
      this.computeShiftRows();

      // 🔹 Summary log
      console.log("✅ Final shiftRows:", JSON.stringify(this.shiftRows));
  } */

  mapShiftsToHeaders() {
      console.log("🔄 [mapShiftsToHeaders] START");

      // Reset headers
      this.headers.forEach((header) => {
          header.shifts = [];
          header.hasShifts = false;
      });
      console.log("🧹 Headers reset. Count:", this.headers.length);

      // Debug rejected shifts
      console.log("📥 Incoming rejectedShifts:", JSON.stringify(this.rejectedShifts));

      this.rejectedShifts.forEach((shift, index) => {
          console.log("=======================================");
          console.log(`📌 Processing rejectedShift [${index + 1}/${this.rejectedShifts.length}]`);

          const startDateStr = shift.Date__c;
          console.log("📅 StartDate:", startDateStr);

          const header = this.headers.find((h) => h.key === startDateStr);

          if (!header) {
              console.warn("⚠️ No matching header found for startDate:", startDateStr);
              return;
          }

          console.log("✅ Found matching header:", header.key);

          // Debug shift basics
          console.log("🆔 Shift Id:", shift.Id);
          console.log("🔹 Shift_Name__c:", shift.Add_Shift__r?.Shift_Name__c);
          console.log("👤 Staff:", shift.Staff__r?.Name || "Unknown");

          // Try match by Id
          let matchedShiftType = this.shiftTypes.find(
              (st) => st.Id === shift.Add_Shift__r.Shift_Name__c
          );

          // If not found, try match by Name
          if (!matchedShiftType) {
              matchedShiftType = this.shiftTypes.find(
                  (st) => st.Name === shift.Add_Shift__r.Shift_Name__c
              );
          }

          console.log("🔍 Available ShiftTypes Ids:", this.shiftTypes.map(st => st.Id));
          console.log("🔍 Available ShiftTypes Names:", this.shiftTypes.map(st => st.Name));
          console.log("🎯 Matched ShiftType:", JSON.stringify(matchedShiftType));

          // Build CSS style
         /*  let shiftColorStyle = shift.Shiftcolor__c; // fallback from backend
          if (matchedShiftType?.Colour__c) {
              shiftColorStyle = `border-left: 6px solid ${matchedShiftType.Colour__c}; 
                                background-color: ${matchedShiftType.Colour__c}20; 
                                color: ${matchedShiftType.Colour__c}; 
                                border-radius: 6px;`;
          } */

                                let shiftColorStyle = '';

                      if (shift.Rejected_Assigned__c === true) {
                          // ✅ Reassigned (Green)
                          shiftColorStyle = `
                              border-left: 6px solid #2ECC71;
                              background-color: #E9F7EF;
                              color: #000000;
                              
                          `;
                      } 
                      else  {
                          // ❌ Rejected (Red)
                          shiftColorStyle = `
                              border-left: 6px solid #E74C3C;
                              background-color: #FDEDEC;
                              color: #000000;
                              
                          `;
                      } 



          console.log("🎨 Final shiftColorStyle:", shiftColorStyle);

          // Push into header
          const builtShift = {
              id: shift.Id,
              staffName: shift.Staff__r?.Name || "Unknown",
              staffName1: shift.Staff__r?.Display_Nickname__c || "Unknown",
              time:shift.Shift_Start_End_Time__c?shift.Shift_Start_End_Time__c: shift.Add_Shift__r?.Shift_Start_End_Time__c || "",
              role:shift.Role_formula__c ? shift.Role_formula__c :  shift.Add_Shift__r?.Role__c || "",
              location: this.formatAddress(shift.Add_Shift__r?.Location__c),
              direction: shift.Add_Shift__r?.Direction__r?.Name || "",
              staffId: shift.Staff__c,
              picture: shift.Staff__r?.picture__c || "",
              shiftColor: shiftColorStyle,
              isAssigned: shift.Rejected_Assigned__c || false,
              showDot:
        this.unreadRejectedShiftIds.includes(
            shift.Id
        ), // manendra added for notification badge count
              rejectedComments: shift.RejectedComments__c || '',
              reassignedStaffName: shift.reassignedStaffName || null,
              reassignedDate: shift.reassignedDate || null,
               participantName:shift.Services_and_Support_Plans__r?.length
 ? shift.Services_and_Support_Plans__r[0].Participant_Name__c
            : '' 
          };

          header.shifts.push(builtShift);
          header.hasShifts = true;

          console.log("📦 Built shift object:", JSON.stringify(builtShift));
          console.log("📊 Header now has shifts count:", header.shifts.length);
      });

      // Update reactivity
      this.headers = [...this.headers];
      console.log("🔁 Headers updated (reactivity triggered)");

      // Compute shift rows
      this.computeShiftRows();

      console.log("✅ Final shiftRows:", JSON.stringify(this.shiftRows));
      console.log("🏁 [mapShiftsToHeaders] END");
  }

  formatAddress(location) {
    if (!location) {
        return '';
    }

    const parts = [
        location.street,
        location.city,
        location.state || location.stateCode,
        location.postalCode,
        location.country || location.countryCode
    ];

    // Remove empty/null values
    return parts.filter(part => part && part.trim() !== '').join(', ');
}



  computeShiftRows() {
    const maxRows = Math.max(...this.headers.map((h) => h.shifts.length));
    const rows = [];

    for (let i = 0; i < maxRows; i++) {
      const row = this.headers.map((header, colIndex) => {
        const shift = header.shifts[i] || null;
        return {
          shift,
          key: `cell-${i}-${colIndex}`
        };
      });
      rows.push({
        key: `row-${i}`,
        cells: row
      });
    }

    this.shiftRows = rows; // This is now a tracked variable you use in template
    console.log("shiftRows:", JSON.stringify(this.shiftRows));
  }

  fetchHolidays() {
    const todayDate = new Date().toISOString().split("T")[0];
    const formattedDate = this.currentStartDate.toISOString().split("T")[0];

    if (formattedDate && this.state) {
      console.log("state------>" + this.state);
      holidayList({ datePicker: formattedDate, state: this.state })
        .then((response) => {
          this.holidayList = response;
          console.log("Fetched Holidays:", JSON.stringify(this.holidayList));

          this.headers.forEach((header) => {
            const headerDate = header.key; // ISO date (YYYY-MM-DD)
            const holiday = this.holidayList.find(
              (h) => h.Date__c === headerDate
            );

            const isHoliday = !!holiday;
            const isToday = headerDate === todayDate;

            if (isHoliday && isToday) {
              header.holidayName = holiday.Holiday_Name__c;
              header.isHoliday = true;
              header.bgColor = "bgColor3"; // Today + Holiday
            } else if (isHoliday) {
              header.holidayName = holiday.Holiday_Name__c;
              header.isHoliday = true;
              header.bgColor = "bgColor1"; // Just Holiday
            } else if (isToday) {
              header.holidayName = "";
              header.isHoliday = false;
              header.bgColor = "bgColor3"; // Just Today
            } else {
              header.holidayName = "";
              header.isHoliday = false;
              header.bgColor = "bgColor2"; // Normal
            }
          });

          this.headers = [...this.headers]; // Trigger UI update
        })
        .catch((error) => {
          console.error("Error fetching holiday list:", error);
        });
    }
  }

  @track selectedRejectedShift=null;

  AllocateShift(event) {
    this.shiftId = event.target.dataset.id;
    //manendra added for notification badge count
    markNotificationRead({

    recordId: this.shiftId,
    moduleName: 'Roster Manager'
})
.then(() => {

    console.log(
        'Rejected Shift Notification Marked Read'
    );

    // Remove unread id locally

    this.unreadRejectedShiftIds =
        this.unreadRejectedShiftIds.filter(
            id => id !== this.shiftId,
            
        );

    // Update local UI

    this.rejectedShifts =
        this.rejectedShifts.map(shift => {

            if (shift.Id === this.shiftId) {

                return {
                    ...shift,
                    showDot: false
                };
            }

            return shift;
        });

    this.initializeHeaders();

    this.shiftRows = [];

    this.mapShiftsToHeaders();
})
.catch(error => {

    console.error(
        'Rejected Shift Read Error ==> ',
        error
    );
});//end manedra added for notification badge count
    let staffId = event.target.dataset.staff;
    console.log("staff id " + staffId);
    const selectedRecord = this.rejectedShifts.find(
      (item) => item.Id === this.shiftId
    );
    console.log("selectedRecord:", JSON.stringify(selectedRecord));
     this.selectedRejectedShift = {
        // Original Staff
        originalStaff: selectedRecord.Staff__r?.Display_Nickname__c|| '—',

        // Date
        date: selectedRecord.Date__c? new Date(selectedRecord.Date__c).toLocaleDateString('en-GB'): '',

        // Time
        time: selectedRecord.Add_Shift__r?.Shift_Start_End_Time__c || '—',

        // Role
        role: selectedRecord.Add_Shift__r?.Role__c || selectedRecord.Role__c ,
        facilityId :selectedRecord.Add_Shift__r?.Fcaility__c,

        // Address
        address: selectedRecord.Add_Shift__r?.Location__Street__s || '—',

        // Participant (first participant)
        participant:
            selectedRecord.Services_and_Support_Plans__r?.[0]
                ?.Participant_Name__c || '—',

        // Rejection Reason (if exists)
        rejectionReason:
            selectedRecord.RejectedComments__c || '—'
    };
    const startdate = selectedRecord.Date__c;
    console.log("startdate:", startdate);

    const enddate = selectedRecord.End_Date__c;
    console.log("enddate:", enddate);
    const addshift = [selectedRecord.Add_Shift__r];
    console.log("addshift:", JSON.stringify(addshift));
    this.facilityArray.push(addshift[0].Facility__c);
    console.log('this.facilityArray',JSON.stringify(this.facilityArray));

    getStaffHourlyRates({
      addShiftList: addshift,
      startdate: startdate,
      enddate: enddate,
      facilityVal: this.facilityArray
    })
      .then((result) => {
        const parsedResult = JSON.parse(result);
        console.log("Staff Hourly Rates (full):", JSON.stringify(parsedResult));

        // Filter out the record with the given staffId
        this.staffHorlyRateList = parsedResult.map((item, index) => ({
            ...item,
            serialNumber: index + 1
          }));

        console.log(
          "Filtered Hourly Rates:",
          JSON.stringify(this.staffHorlyRateList)
        );
        // Do something with the result
      })
      .catch((error) => {
        console.error("Error retrieving staff hourly rates:", error);
      });
    this.isAllocateTable = true;
  }

/*   async handleAllocateToggle(event) {
    const selectedId = event.target.dataset.id;
    const checked = event.target.checked;
    this.staffHorlyRateList = this.staffHorlyRateList.map((staff) =>
      staff.Id === selectedId
        ? { ...staff, isAllocate: event.target.checked }
        : staff
    );
    await this.DocExpiryCheck(selectedId);
    if (this.documentExpired) {
      this.staffHorlyRateList = this.staffHorlyRateList.map((staff) =>
        staff.Id === selectedId ? { ...staff, isAllocate: false } : staff
      );

      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message:
            "One or more documents have expired. Please update them before proceeding.",
          variant: "error"
        })
      );

      return;
    }

    if (checked) {
      // User is trying to select a toggle
      if (this.selectedStaffId && this.selectedStaffId !== selectedId) {
        // Already selected someone else — not allowed
        event.target.checked = false; // Revert the toggle
        this.staffHorlyRateList = this.staffHorlyRateList.map((staff) =>
          staff.Id === selectedId ? { ...staff, isAllocate: false } : staff
        );

        this.confirMationMessage(
          "Error",
          "Only one staff can be allocated at a time.",
          "error"
        );
        return;
      }

      // Set selected ID
      this.selectedStaffId = selectedId;
      console.log("selectedStaffId" + this.selectedStaffId);
    } else {
      // Toggle was unchecked — remove selected ID
      this.selectedStaffId = null;
    }
  } */

    async handleAllocateToggle(event) {
    const selectedId = event.target.dataset.id;
    const checked = event.target.checked;

    // Optimistic UI update
    this.staffHorlyRateList = this.staffHorlyRateList.map(staff =>
        staff.Id === selectedId
            ? { ...staff, isAllocate: checked }
            : staff
    );

    // If toggle turned OFF
    if (!checked) {
        if (this.selectedStaffId === selectedId) {
            this.selectedStaffId = null;
        }
        return;
    }

    /* ================================
       1️⃣ SINGLE STAFF CONSTRAINT
    ================================= */
    if (this.selectedStaffId && this.selectedStaffId !== selectedId) {
        this.revertToggle(selectedId, event);

        this.confirMationMessage(
            "Error",
            "Only one staff can be allocated at a time.",
            "error"
        );
        return;
    }

    /* ================================
       2️⃣ AVAILABILITY / OVERLAP CHECK
    ================================= */
    try {
        this.isShowSpinner = true;

        const staffIds = [selectedId];
       const recurrenceDates = [this.formatDateForApex(this.selectedRejectedShift.date)];
       const { startTimeStr, endTimeStr } = this.splitTimeRange(this.selectedRejectedShift.time);
       console.log('recurrenceDates ==> ', JSON.stringify(recurrenceDates));
       console.log('startTimeStr ==> ', startTimeStr);
       console.log('endTimeStr ==> ', endTimeStr);


        const result = await validateStaffAvailabilityWithReasons({
            staffIds: staffIds,
            inputDates: recurrenceDates,
            startTimeStr: startTimeStr,
            endTimeStr: endTimeStr,
            isAvailability: 'Yes',
            isEditMode: false,
            currentShiftId: null,
            currentAvailabilityId: null,
             shiftFacilityId:this.selectedRejectedShift.facilityId,
            shiftRole :this.selectedRejectedShift.role
        });

        console.log(
            'validateStaffAvailability result ==> ',
            JSON.stringify(result)
        );

        const isValid = this.handleNonRecurringValidation(result);
        console.log('isValid ==> ', isValid);
        
        if (!isValid) {
            this.revertToggle(selectedId, event);
            return;
        }

        /* ================================
           ✅ ALL VALIDATIONS PASSED
        ================================= */
        this.selectedStaffId = selectedId;

    } catch (error) {
        console.error(error);
        this.revertToggle(selectedId, event);
    } finally {
        this.isShowSpinner = false;
    }
}

formatDateForApex(dateStr) {
    // dateStr = "dd/MM/yyyy"
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
}

splitTimeRange(timeRange) {
    // "9:00am-6:00pm"
    const [start, end] = timeRange.split('-');
    return {
        startTimeStr: start.replace(/(am|pm)/i, ' $1').trim(),
        endTimeStr: end.replace(/(am|pm)/i, ' $1').trim()
    };
}

@track staffDateConflicts = [];
@track showErrorModal = false;

handleNonRecurringValidation(validationResult) {
    this.staffDateConflicts = [];
   
    for (const [staffId, dateReasons] of Object.entries(validationResult)) {
        if (Object.keys(dateReasons).length > 0) {
           /*  const staffRecord = this.staffOptions.find(staff => staff.value === staffId);
            const staffName = staffRecord ? staffRecord.label : 'Unknown Staff'; */
           
            const conflictDates = [];
            for (const [dateString, reason] of Object.entries(dateReasons)) {
                conflictDates.push({
                    dateString: this.formatDateForApex(dateString), // Format for backend
                    displayDate: this.formatDisplayDate(dateString), // Format for UI
                    reason: reason
                });
            }
           
            this.staffDateConflicts.push({
                staffId: staffId,
             
                conflictDates: conflictDates
            });
        }
    }
   
    if (this.staffDateConflicts.length > 0) {
        this.showErrorModal = true;
        return false;
    }
    return true;
}

revertToggle(staffId, event) {
    event.target.checked = false;
    this.staffHorlyRateList = this.staffHorlyRateList.map(staff =>
        staff.Id === staffId
            ? { ...staff, isAllocate: false }
            : staff
    );
}

formatDateForApex1(dateString) {
      // Convert to YYYY-MM-DD format for backend
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      }
 
formatDisplayDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
        });
     }



  async DocExpiryCheck(staffId) {
    console.log("Parent record Id in addingPreTax: " + staffId);

    const response = await fetchStaff({ recordId: staffId }); // ⏳ wait for Apex
    console.log("staff list after save: " + JSON.stringify(response));
    console.log("response.length: " + Object.keys(response).length);

    let childRec = response.Child_Staffs__r || [];
    this.documentExpired = false; // reset flag
    const today = new Date();

    for (let rec of childRec) {
      if (rec.Compliance__c === true && new Date(rec.Expiry_Date__c) < today) {
        this.documentExpired = true;
        console.log("Expired doc", this.documentExpired);
        break;
      }
    }
  }

  confirMationMessage(title, message, variant) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: title,
        message: message,
        variant: variant
      })
    );
  }

     handleAllocate() {
    if (!this.selectedStaffId) {
      this.confirMationMessage(
        "Error",
        "Please select a staff to allocate.",
        "error"
      );
      return;
    }

    RejectedshiftAllocation({
      shiftId: this.shiftId, // Make sure this.shiftId is set
      StaffId: this.selectedStaffId
    })
      .then(() => {
        this.confirMationMessage(
          "Success",
          "Shift allocated successfully.",
          "success"
        );
        this.isAllocateTable = false;
        this.shiftId = "";
        this.selectedStaffId = "";
        this.initializeHeaders();
        // this.loadShifts();
        refreshApex(this.wiredRejectedShiftsResult);
       /*  //manendra added start
        this.shiftRows = [];
       this.mapShiftsToHeaders();//manendra end */
        this.fetchHolidays();
      })
      .catch((error) => {
        console.error("Error allocating shift:", error);
        this.showErrorToast("Failed to allocate shift.");
        this.confirMationMessage("Error", error, "error");
      });
  }   
 
  handleBack() {
    this.isAllocateTable = false;
    this.shiftId = "";
    this.selectedStaffId = "";
  }
  handleautoSchedule() {
    this.autoschdulePopup = true;
  }
  handleDragOver(event) {
    event.preventDefault();
  }
  handleCloseautoSchedule() {
    this.autoschdulePopup = false;
  }
  handleDrop(event) {
    const droppedIndex = +event.currentTarget.dataset.index;
    const rows = [...this.rows];

    const [movedItem] = rows.splice(this.draggedIndex, 1);
    rows.splice(droppedIndex, 0, movedItem);
    this.rows = rows;
    console.log("  auto schedule row in drop " + JSON.stringify(this.rows));
  }
  handleDragStart(event) {
    this.draggedIndex = +event.currentTarget.dataset.index;
  }

  handleDrop(event) {
    const droppedIndex = +event.currentTarget.dataset.index;
    const rows = [...this.rows];

    const [movedItem] = rows.splice(this.draggedIndex, 1);
    rows.splice(droppedIndex, 0, movedItem);
    this.rows = rows;
    console.log("  auto schedule row in drop " + JSON.stringify(this.rows));
  }
  stopDragPropagation(event) {
    event.stopPropagation();
  }

  toggleArrow(event) {
    const index = +event.currentTarget.dataset.index;
    const currentDirection = this.rows[index].direction;
    const newDirection =
      currentDirection === "arrowup" ? "arrowdown" : "arrowup";
    const updatedRows = [...this.rows];

    updatedRows[index].direction = newDirection;
    updatedRows[index].iconName = `utility:${newDirection}`;
    updatedRows[index].directionLabel =
      newDirection === "arrowup" ? "Low to High" : "High to Low";

    this.rows = updatedRows; // trigger reactivity
    console.log("  auto schedule row " + JSON.stringify(this.rows));
  }

  get rowIconName() {
    return (row) => {
      return row.direction === "up" ? "utility:arrowup" : "utility:arrowdown";
    };
  }

  handleInputChange(event) {
    const index = +event.target.dataset.index;
    let value;

    if (event.target.type === "checkbox") {
      value = event.target.checked;
    } else {
      value = event.target.value; // slider/radio both use value
    }

    this.rows[index].value = value;
    this.rows = [...this.rows]; // trigger reactivity

    console.log("Updated rows:", JSON.stringify(this.rows));
  }

  get previewRows() {
    return this.rows.map((row) => {
      let displayValue = "";

      if (row.isCheckbox) {
        displayValue = row.value ? "Checked" : "Unchecked";
      } else if (row.isRadio) {
        displayValue = row.value || "Not selected";
      } else if (row.isIcon) {
        displayValue = row.direction.toUpperCase();
      }

      return {
        id: row.id,
        label: row.label,
        displayValue: displayValue
      };
    });
  }

  get employmentTypeOptions() {
    return [
      { label: "Permanent", value: "Permanent" },
      { label: "Casual", value: "Casual" }
    ];
  }
  handleRun() {
    console.log("startDate: " + this.startDate);
    console.log("endDate: " + this.endDate);
    console.log("auto schedule row (before): " + JSON.stringify(this.rows));

    if (Array.isArray(this.rows)) {
      this.rows = this.rows.map((row, index) => {
        return {
          ...row,
          index: index + 1
        };
      });
    }
    assignAutoShifts({
      startDate: this.startDate,
      endDate: this.endDate,
      orgId: this.orgid,
      AutoScheduleParameters: JSON.stringify(this.rows)
    })
      .then((result) => {
        this.confirMationMessage(
          "Success",
          "Auto-scheduling completed successfully.",
          "Success"
        );
        this.autoschdulePopup = false;
        //  this.loadShifts();
        refreshApex(this.wiredRejectedShiftsResult);
      })
      .catch((error) => {
        console.log(error);
        this.confirMationMessage(
          "Error",
          "Error Occured While Assigning Shifts",
          "Error"
        );
        this.autoschdulePopup = false;
      });

    console.log("auto schedule row (after): " + JSON.stringify(this.rows));
  }

  handleFinalPublish() {
    publishShifts({ startDate: this.startDate, endDate: this.endDate })
      .then(() => {
        this.confirMationMessage(
          "Success",
          "Shifts Published Successfully",
          "Success"
        );
        refreshApex(this.wiredRejectedShiftsResult);
        this.publishTempalte = false;
      })
      .catch((error) => {
        console.error("Error updating shift:", error);
        this.confirMationMessage(
          "Error",
          "Error Occured While Publishing Shifts",
          "Error"
        );
        this.publishTempalte = false;
      });
  }
  handlePublishShifts() {
    this.publishTempalte = true;
  }
  HandleReports() {
    this.isHome = false;
    this.isRejectedShiftReports = true;
    localStorage.setItem('rosterRejectedShiftTab', 'rejectedReports');
      this.notifyStateChange();
  }
  handleCloseChild() {
    this.isHome = true;
    this.isRejectedShiftReports = false;
    localStorage.removeItem('rosterRejectedShiftTab');
    this.notifyStateChange();
  }

  notifyStateChange() {
      this.dispatchEvent(new CustomEvent('childstatechange', {
          bubbles: true,
          composed: true
      }));    
  }

  handleKeyShortcut(event) {
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyU') {
        event.preventDefault();
        this.handleautoSchedule();
        }
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyO') {
        event.preventDefault();
        this.HandleReports();
        }
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyB') {
        event.preventDefault();
        this.handleBack();
        }
  }

  HandleBackButton(){
    this.dispatchEvent(new CustomEvent("rejectedshiftsback"));
  }
  closeErrorModal(){
    this.showErrorModal = false;
  }

  @track RejectedSettingsFlag=false;
  @track rejectShiftHours;
  @track disableSaveButton = false;

  handlesettingsClick(event){
    this.RejectedSettingsFlag=true;

  }

  handleRejectHoursChange(event) {
    const input = event.target;
    const value = Number(input.value);

    if (value > 100) {
        input.setCustomValidity('Maximum allowed value is 100 hours.');
          this.disableSaveButton = true;
    } else if (value < 0) {
        input.setCustomValidity('Value cannot be less than 0.');
          this.disableSaveButton = true;
    } else {
        input.setCustomValidity('');
          this.disableSaveButton = false;
    }

    input.reportValidity();
    this.rejectShiftHours = value;
    console.log('this.rejectShiftHours',this.rejectShiftHours);
}

handleClose(){
   this.RejectedSettingsFlag=false;
}




handleSaveRejectSettings(){

   RejectedShiftSettings({orgId: this.orgid, rejectShiftHours: this.rejectShiftHours  })
          .then(() => {

              this.dispatchEvent(
                  new ShowToastEvent({
                      title: 'Success',
                      message: 'RejectedShift Settings Updated',
                      variant: 'success'
                  })
              );
             this.RejectedSettingsFlag=false;
              this.fetchOrgDetails();
          })
          .catch(error => {
              console.log(error);
          });
}




}