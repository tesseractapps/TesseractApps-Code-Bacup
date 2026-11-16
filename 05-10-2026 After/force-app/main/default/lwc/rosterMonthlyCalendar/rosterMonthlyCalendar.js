import { LightningElement, api, track } from 'lwc';
import getStaffsByOrg from '@salesforce/apex/StaffController.getStaffsByOrg';
import getStaffMonthlyData from '@salesforce/apex/RosterMonthlyHandler.getStaffMonthlyData';


export default class RosterMonthlyCalendar extends LightningElement {
  @api orgid;
  @track selectedStaffId;
  @track shifts = []; // store staff shifts here

  @track currentDate = new Date();
  @track calendarDays = [];
  @track staffList = [];
  @track storedFacilityId;
  @track searchKey = '';
  @track monthStartDate;
  @track monthEndDate;
  @api dateFromParent;
  @api selectedDate;
  expandedShiftGroups = new Set();
  expandedCardIds = new Set();
  cellState = new Map();
    // @track animationClass = '';
    // @track isLoading = false;
  @api get isEdit() { return false; }
  @api get currentStep() { return ""; }
  @api currentTabSlug() { return ""; }
  @api selectTab(slug) {}
  @api startEdit() {}
  @api setStep(step) {}
  @api openPopup(slug) {}
    


  // 🔥 STATIC SHIFT DATA (no Apex)
staticShiftData = [
    {
        staffId: null,  // will dynamically assign
        shiftDate: '2026-02-05',
        shiftId: 's1',
        startTime: '09:00 AM',
        endTime: '05:00 PM'
    },
    {
        staffId: null,
        shiftDate: '2026-02-10',
        shiftId: 's2',
        startTime: '10:00 AM',
        endTime: '06:00 PM'
    }
];



  daysOfWeek = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

   async connectedCallback() {
      console.log('🔥 connectedCallback fired');

      this.storedFacilityId = localStorage.getItem("defaultFacilityId");
      console.log('📌 FacilityId from localStorage:', this.storedFacilityId);

      console.log('📌 OrgId value:', this.orgid);
      console.log('📌 recordId value:', this.recordId);
        console.log('📌 selectedDate:', this.selectedDate);

      if (!this.orgid) {
          console.warn('⚠️ orgid is undefined');
      }

      if (!this.storedFacilityId) {
          console.warn('⚠️ storedFacilityId is null');
      }
      if (this.selectedDate) {
        this.currentDate = new Date(this.selectedDate);
    }

      this.prepareData(); // build empty calendar initially
  // this.updateMonthDates();
    
      // 🔥 Get calendar start and end date
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();

      // First day of month
      const startDate = new Date(year, month, 1);

      // Last day of month
      const endDate = new Date(year, month + 1, 0);

    this.monthStartDate = this.formatDateLocal(startDate);
    this.monthEndDate = this.formatDateLocal(endDate);

      console.log('📅 Calendar Start Date:',this.monthStartDate);
      console.log('📅 Calendar End Date:',  this.monthEndDate);
            if (this.orgid && this.storedFacilityId) {
            console.log('🚀 Calling loadStaffData...');
            await this.loadStaffData();
        } else {
            console.warn('❌ Conditions not satisfied. Not calling Apex.');
        }


  }

    formatDateLocal(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }



  async loadStaffData() {
    try {

        const result = await getStaffsByOrg({
            recordId: this.orgid,
            FacilityId: this.storedFacilityId
        });

        console.log('staff list ' + JSON.stringify(result));

        if (!result || result.length === 0) {
            this.staffList = [];
            this.allStaffList = [];
            console.warn('⚠️ No staff records returned from SOQL');
            return;
        }

        // Filter staff who have StaffRoles
       const filteredStaff = result.filter(staff =>
            staff.StaffRoles__r &&
            staff.StaffRoles__r.some(role =>
                role.Active__c && role.Facility__c === this.storedFacilityId
            )
        );

        // Normalize staff data
        this.allStaffList = filteredStaff.map(staff => {
            return {
                staffId: staff.Id,
                staffName: staff.Display_Nickname__c,
                rowClass: 'staff-row',
                staffUrl:staff.picture__c
            };
        });

        // Sort A → Z
        this.allStaffList.sort((a, b) =>
            a.staffName.localeCompare(b.staffName)
        );

        this.staffList = [...this.allStaffList];

        if (this.staffList.length > 0) {
            this.selectedStaffId = this.staffList[0].staffId;
            this.updateSelectedStaffHighlight();
            await this.loadMonthlyShifts();
        }

    } catch (error) {
        console.error('❌ Apex Error:', JSON.stringify(error));
    }
}


  get monthAndYear() {
    return this.currentDate.toLocaleString('default', {
      month: 'long',
      year: 'numeric'
    });
  }

    async previousMonth() {

        if (this.isLoading) return;

        this.isLoading = true;
      //  this.animationClass = 'slide-right';

        await this.animateDelay();

        this.currentDate = new Date(
            this.currentDate.getFullYear(),
            this.currentDate.getMonth() - 1,
            1
        );

        this.prepareData();
        this.updateMonthDates();

        await this.loadMonthlyShifts();

      //  this.animationClass = '';
        this.isLoading = false;
    }

    async nextMonth() {

        if (this.isLoading) return;

        this.isLoading = true;
       // this.animationClass = 'slide-left';

        await this.animateDelay();

        this.currentDate = new Date(
            this.currentDate.getFullYear(),
            this.currentDate.getMonth() + 1,
            1
        );

        this.prepareData();
        this.updateMonthDates();

        await this.loadMonthlyShifts();

     //   this.animationClass = '';
        this.isLoading = false;
    }


buildCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const totalDays = lastDay.getDate();

    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    const days = [];

    for (let i = 0; i < startDay; i++) {
        days.push({
            key: 'empty-' + i,
            isEmpty: true
        });
    }

    const shiftMap = new Map();

    (this.shifts || []).forEach(s => {
        if (!shiftMap.has(s.shiftDate)) {
            shiftMap.set(s.shiftDate, []);
        }

        const refId = s.splitShiftrefId;

        if ((s.isSplitShift || s.isBrokenShift) && refId) {
            let existing = shiftMap.get(s.shiftDate)
                .find(x => x.splitShiftrefId === refId);

            if (!existing) {
                existing = {
                    splitShiftrefId: refId,
                    allShifts: []
                };
                shiftMap.get(s.shiftDate).push(existing);
            }
            existing.allShifts.push(s);
        } else {
            shiftMap.get(s.shiftDate).push({
                id: s.shiftId,
                staffName: s.staffName,
                time: `${s.startTime} - ${s.endTime}`,
                status: s.status,
                color: s.color,
                originalColor: s.originalColor || s.color,
                isSplitShift: s.isSplitShift,
                isBrokenShift: s.isBrokenShift,
                isGroupShift: s.isGroupShift,
                shiftDate: s.shiftDate,
                isRecurring: s.isRecurring,
                splitShiftrefId: s.shiftId, // Use shiftId as refId for regular shifts
                groupShiftData: s.groupShiftData,
                groupShiftRatio: s.groupShiftRatio
            });
        }
    });

    const finalShiftMap = new Map();

    shiftMap.forEach((value, dateKey) => {
        const result = [];
        
        // Check if any regular shift in this day is in FULL EXPANDED mode
        let hasFullExpandedRegular = false;
        let expandedShift = null;

        const dayShiftCount = value.reduce((count, item) => {
            return count + (item.allShifts ? item.allShifts.length : 1);
        }, 0);

        // 🔥 UI rules
        // 🔥 FIXED RULES
        let hideStatus = false;
        let hideNameAndStatus = false;

        if (dayShiftCount === 2) {
            hideStatus = true;              // show name + time
        }
        else if (dayShiftCount >= 3) {
            hideStatus = true;
            hideNameAndStatus = true;      // 🔥 ONLY TIME
        }
        
        value.forEach((item) => {
            if (!item.allShifts) { // Regular shift
                const refId = item.id;
                const key = dateKey + '_' + refId;
                const level = this.cellState?.get(key) || 0;
                
                if (level === 1) {
                    hasFullExpandedRegular = true;
                    expandedShift = item;
                }
            }
        });

        // If there's a full expanded regular shift, only show that shift
        if (hasFullExpandedRegular && expandedShift) {
            result.push({
                ...expandedShift,
                splitShiftrefId: expandedShift.id,
                isGroupExpanded: false,
                isFullExpanded: true,
                cardClass: 'shift-pill expanded-shift',
                hideStatus: false,
                hideNameAndStatus: false,
                isRecurring: expandedShift.isRecurring
            });
            finalShiftMap.set(dateKey, result);
            return;
        }

        // Process normally if no full expanded regular shift
        value.forEach((item) => {
            /* ---------- SPLIT / BROKEN GROUP ---------- */
    
            if (item.allShifts) {
                const refId = item.splitShiftrefId;
                const key = dateKey + '_' + refId;
                const level = this.cellState?.get(key) || 0;

                const isGroupExpanded = level === 1;
                const isFullExpanded = level === 2;
                const splitCount = item.allShifts.length;

                if (isFullExpanded) {
                    // Find which shift to expand - either the active one or default to first
                    let expandedShift;
                    if (this.activeSplitShiftId) {
                        expandedShift = item.allShifts.find(s => s.shiftId === this.activeSplitShiftId);
                    }
                    // If not found, default to first shift
                    if (!expandedShift) {
                        expandedShift = item.allShifts[0];
                    }
                    
                    result.push({
                        id: expandedShift.shiftId,
                        staffName: expandedShift.staffName,
                        time: `${expandedShift.startTime} - ${expandedShift.endTime}`,
                        status: expandedShift.status,
                        color: expandedShift.color,
                        splitShiftrefId: refId,
                        isSplitShift: expandedShift.isSplitShift,
                        isBrokenShift: expandedShift.isBrokenShift,
                        isGroupShift: expandedShift.isGroupShift,
                        isGroupExpanded: false,
                        isFullExpanded: true,
                        cardClass: 'shift-pill expanded-shift',
                        hideStatus: false,
                        hideNameAndStatus: false,
                        isRecurring: expandedShift.isRecurring
                    });
                } else {
                    // Normal or group expanded mode
                    let shiftsToShow = [];
                    
                    if (level === 0) {
                        shiftsToShow = [item.allShifts[0]];
                    } else if (level === 1) {
                        shiftsToShow = item.allShifts;
                    }
                    let localHideStatus = hideStatus;
                    let localHideNameAndStatus = hideNameAndStatus;
                    if (level === 0) {
                        localHideStatus = false;
                        localHideNameAndStatus = false;
                    }
                    if (level === 1) {
                        if (splitCount === 2) {
                            localHideStatus = true;
                            localHideNameAndStatus = false;
                        }
                        else if (splitCount >= 3) {
                            localHideStatus = true;
                            localHideNameAndStatus = true; // 🔥 ONLY TIME
                        }
                    }

                    shiftsToShow.forEach((s, index) => {
                        let isGroupShiftExpanded = this.expandedCardIds.has(s.shiftId);
                        let colorStyle = s.originalColor || s.color || '';
                        if (s.isGroupShift) {
                            colorStyle = this.adjustShiftHeight(colorStyle, isGroupShiftExpanded, s.isGroupShift);
                        }
                        let processedGroup = s.groupShiftData;
                        if (s.isGroupShift && s.groupShiftData) {
                            const colorSource = s.originalColor || s.color || '';
                            processedGroup = this.processGroupShiftData(s.groupShiftData, colorSource);
                        }

                        result.push({
                            id: s.shiftId,
                            staffName: s.staffName,
                            time: `${s.startTime} - ${s.endTime}`,
                            status: s.status,
                            color: colorStyle,
                            splitShiftrefId: refId,
                            isSplitShift: s.isSplitShift,
                            isBrokenShift: s.isBrokenShift,
                            isGroupShift: s.isGroupShift,
                            isGroupExpanded: isGroupExpanded,
                            isFullExpanded: false,
                            cardClass: 'shift-pill',
                            hideStatus: localHideStatus,
                            hideNameAndStatus: localHideNameAndStatus,
                            isRecurring: s.isRecurring,
                            showBackButton: (s.isSplitShift || s.isBrokenShift) ? index === 0 : true,
                            isGroupShiftExpanded: isGroupShiftExpanded,
                            groupShiftChevron: isGroupShiftExpanded ? 'expand_less' : 'expand_more',
                            groupShiftData: processedGroup,
                            groupShiftRatio: s.groupShiftRatio || (processedGroup ? `Group ${processedGroup.staffList?.length || 0}:${processedGroup.participantList?.length || 0}` : '')
                        });
                    });
                }
            }
            /* ---------- REGULAR SHIFTS ---------- */
            else {
                const refId = item.id;
                const key = dateKey + '_' + refId;
                const level = this.cellState?.get(key) || 0;
                const isFullExpanded = level === 1;

                // 🔥 RULE: Regular expanded → always show everything
                let localHideStatus = hideStatus;
                let localHideNameAndStatus = hideNameAndStatus;

                if (isFullExpanded) {
                    localHideStatus = false;
                    localHideNameAndStatus = false;
                }

                let isGroupShiftExpanded = this.expandedCardIds.has(item.id);
                let colorStyle = item.originalColor || item.color || '';
                if (item.isGroupShift) {
                    colorStyle = this.adjustShiftHeight(colorStyle, isGroupShiftExpanded, item.isGroupShift);
                }
                let processedGroup = item.groupShiftData;
                if (item.isGroupShift && item.groupShiftData) {
                    const colorSource = item.originalColor || item.color || '';
                    processedGroup = this.processGroupShiftData(item.groupShiftData, colorSource);
                }

                result.push({
                    ...item,
                    splitShiftrefId: refId,
                    isGroupExpanded: false,
                    isFullExpanded: isFullExpanded,
                    cardClass: isFullExpanded ? 'shift-pill expanded-shift' : 'shift-pill',
                    hideStatus: localHideStatus,
                    hideNameAndStatus: localHideNameAndStatus,
                    color: colorStyle,
                    isGroupShiftExpanded: isGroupShiftExpanded,
                    groupShiftChevron: isGroupShiftExpanded ? 'expand_less' : 'expand_more',
                    groupShiftData: processedGroup,
                    groupShiftRatio: item.groupShiftRatio || (processedGroup ? `Group ${processedGroup.staffList?.length || 0}:${processedGroup.participantList?.length || 0}` : '')
                });
            }
        });

        finalShiftMap.set(dateKey, result);
    });

    for (let d = 1; d <= totalDays; d++) {
        const dateObj = new Date(year, month, d);
        const dateStr = this.formatDateLocal(dateObj);
        const shifts = finalShiftMap.get(dateStr) || [];
        const dayHasGroupShift = shifts.some(s => s.isGroupShift);

        days.push({
            key: dateStr,
            date: d,
            isEmpty: false,
            shifts: shifts,
            iconContainerStyle: dayHasGroupShift ? 'height: auto !important;' : ''
        });
    }

    this.calendarDays = days;
    console.log('Final calendar days ' + JSON.stringify(this.calendarDays));
}

updateMonthDates() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    this.monthStartDate = this.formatDateLocal(startDate);
    this.monthEndDate = this.formatDateLocal(endDate);

    console.log('📅 Calendar Start Date:', this.monthStartDate);
    console.log('📅 Calendar End Date:', this.monthEndDate);
}

  
  handleBack() {
    this.dispatchEvent(
      new CustomEvent('back')
    );
  }

handleBackToShift(event) {
    event.stopPropagation();

    const date = event.currentTarget.dataset.date;
    const refId = event.currentTarget.dataset.refid;

    const key = date + '_' + refId;
    let level = this.cellState.get(key) || 0;

    // Go back one level
    level = Math.max(level - 1, 0);

    // If going back to level 1 or 0, clear the active shift ID
    if (level < 2) {
        this.activeSplitShiftId = null;
    }

    this.cellState.set(key, level);
    this.buildCalendar();
}

  async handleStaffClick(event) {
      const staffId = event.currentTarget.dataset.id;
      this.selectedStaffId = staffId;
      this.updateSelectedStaffHighlight();
      console.log('Loading shifts for:', this.selectedStaffId,  this.monthStartDate, this.monthEndDate);
       await this.loadMonthlyShifts();
  }


async handleSearch(event) {
    const value = event.target.value;
    this.searchKey = value;

    const searchLower = value.toLowerCase();

    // 🔎 CLEAR SEARCH
    if (!searchLower) {
        this.staffList = [...this.allStaffList];

        // keep previous selection
        this.updateSelectedStaffHighlight();
        return;
    }

    // 🔎 FILTER
    const filtered = this.allStaffList.filter(staff =>
        staff.staffName.toLowerCase().includes(searchLower)
    );

    // ❌ NO MATCH FOUND
    if (filtered.length === 0) {
        this.staffList = []; // empty list → show "No staff found"
        return;
    }

    // ✅ MATCH FOUND
    this.staffList = filtered;

     if (this.staffList.length > 0) {
            this.selectedStaffId = this.staffList[0].staffId;
            this.updateSelectedStaffHighlight();
            await this.loadMonthlyShifts();
     }
}
 
async loadMonthlyShifts() {

    try {

        const result = await getStaffMonthlyData({
            staffId: this.selectedStaffId,
            startDate: this.monthStartDate,
            endDate: this.monthEndDate,
            facilityId: this.storedFacilityId
        });

        console.log('Shifts result', result);

        // Convert Apex wrapper data to calendar format
        this.shifts = (result || []).map(shift => {

            let start = '';
            let end = '';

            if (shift.shiftTime) {
                const parts = shift.shiftTime.split('-');
                start = parts[0]?.trim();
                end = parts[1]?.trim();
            }

            return {
                shiftId: shift.shiftId,
                shiftDate: shift.shiftDate,
                startTime: start,
                endTime: end,
                staffName: shift.staffName,
                status: shift.status,
                color: shift.color,
                originalColor: shift.color,

                isSplitShift: shift.isSplitShift,
                isBrokenShift: shift.isBrokenShift,
                isGroupShift: shift.isGroupShift,
                splitShiftrefId:shift.splitShiftrefId,
                 isRecurring: shift.isRecurring, 
                groupShiftData: shift.groupShiftData,
                groupShiftRatio: shift.groupShiftRatio
            };

        });

        this.buildCalendar();

    } catch (error) {

        console.error('Error loading shifts', error);

    }
    
}
updateSelectedStaffHighlight() {

    this.staffList = this.staffList.map(staff => {
        return {
            ...staff,
            rowClass: staff.staffId === this.selectedStaffId
                ? 'staff-row staff-selected'
                : 'staff-row'
        };
    });
}
handleShiftClick(event) {
    const date = event.currentTarget.dataset.date;
    const refId = event.currentTarget.dataset.refid;
    const shiftId = event.currentTarget.dataset.id; // Add this - get the shift ID
    const isSplit = event.currentTarget.dataset.issplit === "true";
    const isBroken = event.currentTarget.dataset.isbroken === "true";
    const isGroup = event.currentTarget.dataset.isgroup === "true";

    // Don't expand group shifts
    if (isGroup) {
        return;
    }
    const dayData = this.calendarDays.find(d => d.key === date);
    const totalShifts = dayData?.shifts?.length || 0;

    const key = date + '_' + refId;
    let level = this.cellState.get(key) || 0;

    if (isSplit || isBroken) {
        // Store which specific shift was clicked
        if (level === 0) {
            // First click - store the shift ID for when we go to level 2
            this.activeSplitShiftId = shiftId;
            level = 1; // show both shifts
        } else if (level === 1) {
            // Second click - use the stored shift ID for full expand
            // If no shift ID stored, use the current one
            this.activeSplitShiftId = this.activeSplitShiftId || shiftId;
            level = 2; // full expand
        } else {
            // Third click - reset
            this.activeSplitShiftId = null;
            level = 0; // back to normal
        }
    } else {
         if (totalShifts === 1) {
            return; // ❌ block only single shift
        }
        // Regular shift: toggle between 0 and 1
        level = level === 0 ? 1 : 0;
        if (level === 1) {
            this.activeSplitShiftId = shiftId;
        } else {
            this.activeSplitShiftId = null;
        }
    }

    this.cellState.set(key, level);
    this.buildCalendar();
}


// get monthInput() {
//     const year = this.currentDate.getFullYear();
//     const month = String(this.currentDate.getMonth() + 1).padStart(2, '0');
//     return `${year}-${month}`; // format: YYYY-MM
// }

    // async handleMonthChange(event) {
    //     const selectedDate = event.detail.value; // ✅ from child

    //     if (!selectedDate) return;

    //     this.currentDate = new Date(selectedDate);

    //     this.prepareData();
    //     this.updateMonthDates();
    //     await this.loadMonthlyShifts();
    // }

    async handleMonthChange(event) {

        if (this.isLoading) return;

        this.isLoading = true;
     //   this.animationClass = 'fade-in';

        await this.animateDelay();

        const selectedDate = event.detail.value;

        if (!selectedDate) {
            this.isLoading = false;
            return;
        }

        this.currentDate = new Date(selectedDate);

        // ✅ DIRECT CALL (instead of prepareData)
        this.buildCalendar();
        this.updateMonthDates();
        await this.loadMonthlyShifts();

      //  this.animationClass = '';
        this.isLoading = false;
    }


    animateDelay(ms = 180) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    get calendarClass() {
        return `calendar-grid ${this.animationClass} ${this.isLoading ? 'loading' : ''}`;
    }


    prepareData() {
        this.buildCalendar();
        this.updateMonthDates();
    }

    get getTypeIconClass() {
        // Start with the classes based on isExpandedView (which likely corresponds to fortnightly)
        let classString = this.isExpandedView
        ? "material-icons shiftTypeIcon"
        : "material-icons shiftTypeIcon";

        // ⭐ Check selectedViewType and append the font size class
        if (this.selectedViewType === 'fortnightly') {
            classString += " delete-icon-fortnightly";
        }

        return classString;
    }  
    
    handleGroupShiftClick(event) {

        event.stopPropagation();

        const shiftId = event.currentTarget.dataset.id;

        const shift = this.shifts.find(s => s.shiftId === shiftId);

        if (!shift) {
            return;
        }

        this.selectedGroupShift = shift.groupShiftData;
        this.groupShiftRatio = shift.groupShiftRatio;

        console.log(
            'Selected Group Shift',
            JSON.stringify(this.selectedGroupShift)
        );

        this.showGroupShiftModal = true;
    }

    extractHexColor(styleStr) {
        if (!styleStr) return '#ff3366';
        const match = styleStr.match(/#([0-9a-fA-F]{6})/);
        return match ? match[0] : '#ff3366';
    }

    adjustShiftHeight(computedStyle, isExpanded, showGroupShiftIcon) {
        let style = computedStyle || '';
        if (isExpanded) {
            if (!style.includes('height: auto !important;')) {
                style += ' height: auto !important;';
            }
        } else {
            style = style.replace(' height: auto !important;', '');
            if (showGroupShiftIcon) {
                const heightMatch = style.match(/height:\s*(\d+(\.\d+)?)\s*px/);
                if (heightMatch) {
                    const originalHeight = parseFloat(heightMatch[1]);
                    if (originalHeight <= 84) {
                        const newHeight = originalHeight + 30;
                        style = style.replace(heightMatch[0], `height: ${newHeight}px`);
                    }
                }
            }
        }
        return style;
    }

    processGroupShiftData(groupShiftData, originalColor) {
        if (!groupShiftData) return null;
        
        const hex = this.extractHexColor(originalColor);
        const barStyle = `background-color: ${hex}12; border: 1px solid ${hex}30; color: ${hex};`;
        const textStyle = `color: ${hex};`;
        const circleStaffStyle = `background-color: ${hex};`;

        const staffList = (groupShiftData.staffList || []).map(staff => {
            const name = staff.displayName || staff.staffName || '';
            return {
                ...staff,
                displayNameLetter: name ? name.trim().charAt(0).toUpperCase() : '',
                circleStaffStyle
            };
        });

        const participantList = (groupShiftData.participantList || []).map(part => {
            const name = part.participantName || '';
            return {
                ...part,
                participantNameLetter: name ? name.trim().charAt(0).toUpperCase() : ''
            };
        });

        return {
            ...groupShiftData,
            staffList,
            participantList,
            barStyle,
            textStyle
        };
    }

    handleGroupShiftBarToggle(event) {
        event.stopPropagation();
        const shiftId = event.currentTarget.dataset.shiftid;
        if (!shiftId) return;

        if (this.expandedCardIds.has(shiftId)) {
            this.expandedCardIds.delete(shiftId);
        } else {
            this.expandedCardIds.add(shiftId);
        }

        this.buildCalendar();
    }

    handlePreventBubbling(event) {
        event.stopPropagation();
    }
}