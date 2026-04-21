import { LightningElement, api, track, wire } from 'lwc';
import getLeavesByUserRole from '@salesforce/apex/LeaveController.getLeavesByUserRole';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class LeaveCalendarLwc extends LightningElement {
    
@api orgid;
@track startDate;     // month start (for Apex)
@track endDate;       // month end (for Apex)
@track weekStartIso;  // week start (for UI mapping)
@track weekEndIso;    // week end (for UI mapping)
@track selectedDate;
@track weekDays = [];
@track employees = [];
@track allEmployees = [];
@track searchKey = '';

monthLeaves = []; // stores the entire month result from Apex


    // Keep an anchor date for week navigation
    anchorDate = new Date();

    connectedCallback() {
        // Ensure we start on "today"
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        this.anchorDate = today;
        this.selectedDate = this.toIsoDate(today);

        // Build the current week immediately (sets weekDays + startDate/endDate)
        this.setWeekRange(today);

        // eslint-disable-next-line no-console
        console.log('[LeaveCalendar] connectedCallback orgid:', this.orgid);
        // eslint-disable-next-line no-console
        console.log('[LeaveCalendar] connectedCallback selectedDate:', this.selectedDate);
        // eslint-disable-next-line no-console
        console.log('[LeaveCalendar] connectedCallback startDate/endDate:', this.startDate, this.endDate);
    }

@wire(getLeavesByUserRole, { orgId: '$orgid', startDate: '$startDate', endDate: '$endDate' })
wiredLeaves({ data, error }) {
    if (!this.orgid || !this.startDate || !this.endDate) {
        // eslint-disable-next-line no-console
        console.log('[LeaveCalendar] wire skipped – params not ready');
        return;
    }

    // eslint-disable-next-line no-console
    console.log('[LeaveCalendar] orgid:', this.orgid);
    // eslint-disable-next-line no-console
    console.log('[LeaveCalendar] Month startDate:', this.startDate, 'Month endDate:', this.endDate);
    // eslint-disable-next-line no-console
    console.log('[LeaveCalendar] Week start/end:', this.weekStartIso, this.weekEndIso);
    // eslint-disable-next-line no-console
    console.log('[LeaveCalendar] data length (month fetch):', data?.length);

    if (data) {
        const storedFacilityId = localStorage.getItem('defaultFacilityId');
        // eslint-disable-next-line no-console
        console.log('[LeaveCalendar] storedFacilityId:', storedFacilityId);
        this.logRawApexData('WIRE RESPONSE', data);


        let finalData = data;
        if (storedFacilityId) {
            finalData = data.filter(rec => rec?.Staff__r?.Facility__c === storedFacilityId);
        }

        // Store month leaves
        this.monthLeaves = finalData;

        // Now build employees for CURRENT WEEK using overlap filter
        this.allEmployees = this.buildEmployeesForWeek(this.monthLeaves);
        this.applySearch();

        // eslint-disable-next-line no-console
        console.log('[LeaveCalendar] finalData length (after facility):', finalData.length);
        // eslint-disable-next-line no-console
        console.log('[LeaveCalendar] employees length (week view):', this.employees.length);
        this.logStaffWeekCells(this.employees);

    } else if (error) {
        // eslint-disable-next-line no-console
        console.error('[LeaveCalendar] Error in getLeavesByUserRole:', error);
        this.monthLeaves = [];
        this.employees = [];
    }
}




buildEmployeesForWeek(leaves) {
    if (!this.weekStartIso || !this.weekEndIso) return [];

    const weekStart = new Date(this.weekStartIso);
    const weekEnd = new Date(this.weekEndIso);

    // Only keep leaves that overlap the selected week
    const weekLeaves = leaves.filter(lv => {
        const from = new Date(lv.From__c);
        const to = new Date(lv.To__c);
        return from <= weekEnd && to >= weekStart;
    });

    // Group by staff
    const byStaff = new Map();
    weekLeaves.forEach(lv => {
        const staffId = lv.Staff__c;
        if (!staffId) return;

        if (!byStaff.has(staffId)) {
            const staffName = lv?.Staff__r?.Name || 'Unknown';
            byStaff.set(staffId, {
                staffId,
                staffName,
                leaves: []
            });
        }
        byStaff.get(staffId).leaves.push(lv);
    });

    return Array.from(byStaff.values()).map((staff, idx) => {
        const cells = this.weekDays.map(d => ({
    id: `${staff.staffId}_${d.iso}`,
    typeApproved: false,
    typeRequested: false,
    typeRejected: false,
    typeCancelled: false,
    typeWithdrawn: false,
    approvedClass: '',
    rejectedClass: '',
    cancelledClass: '',
    withdrawnClass: '',
    label: ''
}));


        staff.leaves.forEach(lv => this.applyLeaveToCells(lv, cells));

        return {
            id: staff.staffId,
            initials: this.getInitials(staff.staffName),
            name: staff.staffName,
            hours: '',
            avatarClass: this.avatarClassByIndex(idx),
            cells
        };
    });
}


applyLeaveToCells(lv, cells) {
    const from = this.toDateOnly(lv.From__c);
    const to = this.toDateOnly(lv.To__c);

    if (!from || !to) return;

    const weekStart = this.toDateOnly(this.weekStartIso);
    const weekEnd = this.toDateOnly(this.weekEndIso);

    const overlapStart = from > weekStart ? from : weekStart;
    const overlapEnd = to < weekEnd ? to : weekEnd;

    if (overlapStart > overlapEnd) return;

    const status = (lv.Status__c || '').trim(); // Approved / Requested / Rejected / Cancelled / Withdraw
    const leaveType = lv.Type_of_Leave__c || '';

    for (let d = new Date(overlapStart); d <= overlapEnd; d.setDate(d.getDate() + 1)) {
        const iso = this.toIsoDate(d);
        const cellIndex = this.weekDays.findIndex(x => x.iso === iso);
        if (cellIndex < 0) continue;

        const isFirstDay = iso === this.toIsoDate(overlapStart);

        const cell = cells[cellIndex];
        const existingRank = this.statusRank(cell);
        const incomingRank = this.statusRankFromStatus(status);

        if (incomingRank < existingRank) continue;

        // Reset cell flags/classes
        cell.typeApproved = false;
        cell.typeRequested = false;
        cell.typeRejected = false;
        cell.typeCancelled = false;
        cell.typeWithdrawn = false;

        cell.approvedClass = '';
        cell.rejectedClass = '';
        cell.cancelledClass = '';
        cell.withdrawnClass = '';

        cell.label = leaveType;

if (status === 'Approved') {
    cell.typeApproved = true;
    cell.approvedClass = 'calendar-pill calendar-pill_approved slds-truncate';

} else if (status === 'Rejected') {
    cell.typeRejected = true;
    cell.rejectedClass = 'calendar-pill calendar-pill_rejected slds-truncate';

} else if (status === 'Cancelled') {
    cell.typeCancelled = true;
    cell.cancelledClass = 'calendar-pill calendar-pill_cancelled slds-truncate';

} else if (status === 'Withdraw') {
    cell.typeWithdrawn = true;
    cell.withdrawnClass = 'calendar-pill calendar-pill_withdrawn slds-truncate';

} else if (status === 'Requested') {
    cell.typeRequested = true;
    cell.requestedClass = 'calendar-pill calendar-pill_requested slds-truncate';
}

    }
}

statusRank(cell) {
    // higher = stronger
    if (cell.typeApproved) return 5;
    if (cell.typeRequested) return 4;
    if (cell.typeRejected) return 3;
    if (cell.typeWithdrawn) return 2;
    if (cell.typeCancelled) return 1;
    return 0;
}

statusRankFromStatus(status) {
    if (status === 'Approved') return 5;
    if (status === 'Requested') return 4;
    if (status === 'Rejected') return 3;
    if (status === 'Withdraw') return 2;
    if (status === 'Cancelled') return 1;
    return 0;
}


    // ===== Week range / weekDays builder =====
   toIsoDate(dateLike) {
        const d = new Date(dateLike);
        if (Number.isNaN(d.getTime())) return null;

        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    startOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay(); // 0=Sun..6=Sat
        const diff = (day === 0 ? -6 : 1) - day; // Monday start
        d.setDate(d.getDate() + diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

setWeekRange(anchor) {
    const weekStart = this.startOfWeek(anchor); // Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Week range for UI mapping
    this.weekStartIso = this.toIsoDate(weekStart);
    this.weekEndIso = this.toIsoDate(weekEnd);

    // Month range for Apex (DON'T change Apex, so we call like LeaveManagementLwc)
    const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);

    this.startDate = this.toIsoDate(monthStart); // for Apex
    this.endDate = this.toIsoDate(monthEnd);     // for Apex

    // Build the 7 UI columns
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        days.push({
            name: this.toIsoDate(d),
            label: d.toLocaleDateString('en-US', { weekday: 'short' }),
            date: String(d.getDate()),
            iso: this.toIsoDate(d)
        });
    }
    this.weekDays = days;

    // eslint-disable-next-line no-console
    console.log('[LeaveCalendar] Week range (UI):', this.weekStartIso, this.weekEndIso);
    // eslint-disable-next-line no-console
    console.log('[LeaveCalendar] Month range (Apex):', this.startDate, this.endDate);
}


handleWeekPick(event) {
    const picked = event.target.value; // YYYY-MM-DD
    this.selectedDate = picked;

    const d = new Date(picked);
    d.setHours(0, 0, 0, 0);

    const prevMonthStart = this.startDate;
    const prevMonthEnd = this.endDate;

    this.anchorDate = d;
    this.setWeekRange(d);

    // Clear UI immediately to avoid stale view
    this.employees = [];

    // If month range didn't change, reuse cached monthLeaves and refresh week view immediately
    if (this.startDate === prevMonthStart && this.endDate === prevMonthEnd) {
            this.logRawApexData('CACHED (same month)', this.monthLeaves || []);
        this.employees = this.buildEmployeesForWeek(this.monthLeaves || []);

        // ✅ LOG PER DAY PER STAFF
        // eslint-disable-next-line no-console
        console.log('[LeaveCalendar] (nav) rebuilt employees:', this.employees.length);
        this.logStaffWeekCells(this.employees);
    } else {
        // Month changed -> wire will refetch; still log the selected week
        // eslint-disable-next-line no-console
        console.log('[LeaveCalendar] (nav) month changed, waiting for wire refetch');
    }

    // eslint-disable-next-line no-console
    console.log('[LeaveCalendar] handleWeekPick picked:', picked);
    // eslint-disable-next-line no-console
    console.log('[LeaveCalendar] Week (UI):', this.weekStartIso, this.weekEndIso);
    // eslint-disable-next-line no-console
    console.log('[LeaveCalendar] Month (Apex):', this.startDate, this.endDate);
}

handlePrevWeek() {
    const d = new Date(this.anchorDate);
    d.setDate(d.getDate() - 7);
    d.setHours(0, 0, 0, 0);

    const prevMonthStart = this.startDate;
    const prevMonthEnd = this.endDate;

    this.anchorDate = d;
    this.selectedDate = this.toIsoDate(d);
    this.setWeekRange(d);

    // Clear UI immediately to avoid stale view
    this.employees = [];

    // If month range didn't change, reuse cached monthLeaves and refresh week view immediately
    if (this.startDate === prevMonthStart && this.endDate === prevMonthEnd) {

            this.logRawApexData('CACHED (same month)', this.monthLeaves || []);
        this.employees = this.buildEmployeesForWeek(this.monthLeaves || []);

        // ✅ LOG PER DAY PER STAFF
        // eslint-disable-next-line no-console
        console.log('[LeaveCalendar] (nav) rebuilt employees:', this.employees.length);
        this.logStaffWeekCells(this.employees);
    } else {
        // eslint-disable-next-line no-console
        console.log('[LeaveCalendar] (nav) month changed, waiting for wire refetch');
    }

    // eslint-disable-next-line no-console
    console.log('[LeaveCalendar] handlePrevWeek selectedDate:', this.selectedDate);
    // eslint-disable-next-line no-console
    console.log('[LeaveCalendar] Week (UI):', this.weekStartIso, this.weekEndIso);
    // eslint-disable-next-line no-console
    console.log('[LeaveCalendar] Month (Apex):', this.startDate, this.endDate);
}

handleNextWeek() {
    const d = new Date(this.anchorDate);
    d.setDate(d.getDate() + 7);
    d.setHours(0, 0, 0, 0);

    const prevMonthStart = this.startDate;
    const prevMonthEnd = this.endDate;

    this.anchorDate = d;
    this.selectedDate = this.toIsoDate(d);
    this.setWeekRange(d);

    // Clear UI immediately to avoid stale view
    this.employees = [];

    // If month range didn't change, reuse cached monthLeaves and refresh week view immediately
    if (this.startDate === prevMonthStart && this.endDate === prevMonthEnd) {
            this.logRawApexData('CACHED (same month)', this.monthLeaves || []);
        this.employees = this.buildEmployeesForWeek(this.monthLeaves || []);

        // ✅ LOG PER DAY PER STAFF
        // eslint-disable-next-line no-console
        console.log('[LeaveCalendar] (nav) rebuilt employees:', this.employees.length);
        this.logStaffWeekCells(this.employees);
    } else {
        // eslint-disable-next-line no-console
        console.log('[LeaveCalendar] (nav) month changed, waiting for wire refetch');
    }

    // eslint-disable-next-line no-console
    console.log('[LeaveCalendar] handleNextWeek selectedDate:', this.selectedDate);
    // eslint-disable-next-line no-console
    console.log('[LeaveCalendar] Week (UI):', this.weekStartIso, this.weekEndIso);
    // eslint-disable-next-line no-console
    console.log('[LeaveCalendar] Month (Apex):', this.startDate, this.endDate);
}


    toDateOnly(dateLike) {
        const d = new Date(dateLike);
        if (Number.isNaN(d.getTime())) return null;
        d.setHours(0, 0, 0, 0);
        return d;
    }

    getInitials(name) {
        const parts = (name || '').trim().split(/\s+/).filter(Boolean);
        const first = parts[0]?.[0] || '';
        const second = parts.length > 1 ? parts[1][0] : (parts[0]?.[1] || '');
        return (first + second).toUpperCase();
    }

    avatarClassByIndex(idx) {
        // You already have avatar-color-1/2/3 in CSS 
        const n = (idx % 3) + 1;
        return `calendar-avatar avatar-color-${n} slds-m-right_small`;
    }


    logStaffWeekCells(employees) {
    try {
        // eslint-disable-next-line no-console
        console.log('================ [LeaveCalendar] STAFF WEEK CELLS ================');
        // eslint-disable-next-line no-console
        console.log('[LeaveCalendar] Week:', this.weekStartIso, '->', this.weekEndIso);

        (employees || []).forEach(emp => {
            // eslint-disable-next-line no-console
            console.log(`--- Staff: ${emp.name} (${emp.id}) ---`);

            // Assumes emp.cells aligns with this.weekDays (same index)
            this.weekDays.forEach((day, i) => {
                const cell = emp.cells?.[i];

                if (!cell) {
                    // eslint-disable-next-line no-console
                    console.log(`${day.iso} (${day.label} ${day.date}): NO CELL`);
                    return;
                }

                let status = 'EMPTY';
if (cell.typeApproved) status = 'APPROVED';
else if (cell.typeRequested) status = 'REQUESTED';
else if (cell.typeRejected) status = 'REJECTED';
else if (cell.typeCancelled) status = 'CANCELLED';
else if (cell.typeWithdrawn) status = 'WITHDRAW';


                const cls =
    cell.approvedClass ||
    cell.rejectedClass ||
    cell.cancelledClass ||
    cell.withdrawnClass ||
    cell.requestedClass ||
    '';

                const label = cell.label || '';

                // eslint-disable-next-line no-console
                console.log(`${day.iso} (${day.label} ${day.date}): ${status} | label="${label}" | class="${cls}"`);
            });
        });

        // eslint-disable-next-line no-console
        console.log('===================================================================');
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[LeaveCalendar] Error logging staff week cells:', e);
    }
}

logRawApexData(sourceLabel, data) {
    try {
        // eslint-disable-next-line no-console
        console.log(`================ [LeaveCalendar] RAW APEX DATA (${sourceLabel}) ================`);
        // eslint-disable-next-line no-console
        console.log('[LeaveCalendar] orgid:', this.orgid);
        // eslint-disable-next-line no-console
        console.log('[LeaveCalendar] Month (Apex):', this.startDate, '->', this.endDate);
        // eslint-disable-next-line no-console
        console.log('[LeaveCalendar] Week (UI):', this.weekStartIso, '->', this.weekEndIso);

        const raw = JSON.parse(JSON.stringify(data || []));
        // eslint-disable-next-line no-console
        console.log('[LeaveCalendar] RAW JSON:', raw);
        // eslint-disable-next-line no-console
        console.log('[LeaveCalendar] RAW count:', raw.length);

        raw.forEach((rec, idx) => {
            // eslint-disable-next-line no-console
            console.log(`#${idx + 1}`, {
                Id: rec.Id,
                StaffId: rec.Staff__c,
                StaffName: rec?.Staff__r?.Name,
                Facility: rec?.Staff__r?.Facility__c,
                From: rec.From__c,
                To: rec.To__c,
                Status: rec.Status__c,
                Type: rec.Type_of_Leave__c
            });
        });

        // eslint-disable-next-line no-console
        console.log('===============================================================================');
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[LeaveCalendar] Error logging RAW Apex data:', e);
    }
}

backToHome() {
    const event = new CustomEvent('backtohome', {
        bubbles: true,
        composed: true
    });
    this.dispatchEvent(event);
}

handleSearchChange(event) {
    this.searchKey = (event.target.value || '').toLowerCase().trim();
    this.applySearch();
}

applySearch() {
    if (!this.searchKey) {
        this.employees = [...this.allEmployees];
        return;
    }

    this.employees = this.allEmployees.filter(emp =>
        emp.name && emp.name.toLowerCase().includes(this.searchKey)
    );
}

    weeklyView = true;
    monthlyView = false;

    get weeklyTabClass() {
        return this.weeklyView
            ? 'tab-button active'
            : 'tab-button';
    }

    get monthlyTabClass() {
        return this.monthlyView
            ? 'tab-button active'
            : 'tab-button';
    }

    showWeeklyView() {
        this.weeklyView = true;
        this.monthlyView = false;

        this.dispatchEvent(
            new CustomEvent('showweekly', {
                bubbles: true,
                composed: true
            })
        );
    }

    showMonthlyView() {
        this.weeklyView = false;
        this.monthlyView = true;

        this.dispatchEvent(
            new CustomEvent('showmonthly', {
                bubbles: true,
                composed: true
            })
        );
    }

    handleShowWeekly() {
        this.weeklyView = true;
        this.monthlyView = false;
    }

}