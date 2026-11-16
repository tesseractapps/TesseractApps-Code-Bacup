import { LightningElement, api, track, wire } from 'lwc';
import getLeavesByOrg from '@salesforce/apex/LeaveController.getLeavesByOrg';
import getStaffsByOrg from '@salesforce/apex/StaffController.getStaffsByOrg';

export default class MonthlyLeaveCalendar extends LightningElement {


@api orgid;

@track staffList = [];
@track allStaffList = [];

@track calendarDays = [];
@track leaves = [];

@track selectedStaffId;

@track searchKey = '';
@track storedFacilityId;

@track isLoading = false;
@track animationClass = '';

currentDate = new Date();

monthStartDate;
monthEndDate;

daysOfWeek = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

    async connectedCallback() {
        this.storedFacilityId = localStorage.getItem("defaultFacilityId");
        if (this.orgid && this.storedFacilityId) {
            console.log('🚀 Calling loadStaffData...');
            await this.loadStaffData();
        } else {
            console.warn('❌ Conditions not satisfied. Not calling Apex.');
        }
        this.prepareMonthDates();
    }

    get monthAndYear(){
        return this.currentDate.toLocaleString('default',{
            month:'long',
            year:'numeric'
        });
    }

    prepareMonthDates(){

        const firstDay = new Date(
            this.currentDate.getFullYear(),
            this.currentDate.getMonth(),
            1
        );
        const lastDay = new Date(
            this.currentDate.getFullYear(),
            this.currentDate.getMonth() + 1,
            0
        );
        const format = (d) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2,'0');
            const day = String(d.getDate()).padStart(2,'0');
            return `${year}-${month}-${day}`;
        };

        this.monthStartDate = format(firstDay);
        this.monthEndDate = format(lastDay);

        console.log('Correct Month Start:', this.monthStartDate);
        console.log('Correct Month End:', this.monthEndDate);
    }

    formatLocalDate(date){

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2,'0');
        const day = String(date.getDate()).padStart(2,'0');

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
                staff.StaffRoles__r && staff.StaffRoles__r.length > 0
            );

            // Normalize staff data
            this.allStaffList = filteredStaff.map(staff => {
                return {
                    staffId: staff.Id,
                    staffName: staff.Display_Nickname__c,
                    rowClass: 'staff-row',
                    staffUrl: staff.picture__c
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

                // 🔹 Load leaves instead of shifts
                await this.loadLeaves();
            }

        } catch (error) {
            console.error('❌ Apex Error:', JSON.stringify(error));
        }
    }

    async loadLeaves(){
        try{
            const result = await getLeavesByOrg({
                orgId:this.orgid,
                startDate:this.monthStartDate,
                endDate:this.monthEndDate
            });
            this.leaves = result;
            this.buildCalendar();
        }
        catch(error){
            console.error(error);
        }
    }

    buildCalendar(){

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const totalDays = lastDay.getDate();

        let startDay = firstDay.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1;

        console.log('Calendar Start Offset:', startDay);

        const days = [];

        /* -----------------------------
        EMPTY CELLS
        ----------------------------- */

        for(let i = 0; i < startDay; i++){
            days.push({
                key: 'empty-' + i,
                isEmpty: true
            });
        }

        /* -----------------------------
        BUILD LEAVE MAP
        ----------------------------- */

        const leaveMap = new Map();

        (this.leaves || []).forEach(lv => {

            console.group('Processing Leave');

            console.log('Leave Id:', lv.Id);
            console.log('Staff Id:', lv.Staff__c);
            console.log('Staff Name:', lv.Staff__r?.Name);
            console.log('Leave Type:', lv.Type_of_Leave__c);
            console.log('Status:', lv.Status__c);
            console.log('From Date:', lv.From__c);
            console.log('To Date:', lv.To__c);

            if(this.selectedStaffId && lv.Staff__c !== this.selectedStaffId){
                console.log('Skipping leave because staff does not match selected staff');
                console.groupEnd();
                return;
            }

            const start = new Date(lv.From__c);
            const end = new Date(lv.To__c);

            for(let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)){

                const iso = this.formatLocalDate(d);

                console.log('Applying Leave On Date:', iso);

                if(!leaveMap.has(iso)){
                    leaveMap.set(iso, []);
                }

                leaveMap.get(iso).push({
                    id: lv.Id,
                    leaveType: lv.Type_of_Leave__c,
                    className: this.getLeaveClass(lv.Status__c)
                });

            }

            console.groupEnd();

        });

        console.groupEnd();


        /* -----------------------------
        BUILD CALENDAR DAYS
        ----------------------------- */

        console.group('Calendar Day Build');

        for(let day = 1; day <= totalDays; day++){

            const dateObj = new Date(year, month, day);

            const iso = this.formatLocalDate(dateObj);

            const leavesForDay = leaveMap.get(iso) || [];

            console.log('Calendar Date:', iso, '| Leaves:', leavesForDay.length);

            days.push({
                key: iso,
                date: day,
                isEmpty: false,
                leaves: leavesForDay
            });

        }

        console.groupEnd();

        this.calendarDays = days;

        console.log('Final Calendar Days Count:', this.calendarDays.length);
        console.log('Calendar Data:', JSON.parse(JSON.stringify(this.calendarDays)));

        console.log('================ BUILD CALENDAR END ================');

    }

    getLeaveClass(status){
        if(status === 'Approved'){
            return 'leave-pill approved';
        }
        if(status === 'Requested'){
            return 'leave-pill requested';
        }
        if(status === 'Rejected'){
            return 'leave-pill rejected';
        }
        if(status === 'Cancelled'){
            return 'leave-pill cancelled';
        }
        if(status === 'Withdraw'){
            return 'leave-pill withdrawn';
        }
        return 'leave-pill';
    }

    async previousMonth() {

        if (this.isLoading) return;
        this.isLoading = true;
        this.currentDate = new Date(
            this.currentDate.getFullYear(),
            this.currentDate.getMonth() - 1,
            1
        );
        this.prepareMonthDates();
        await this.loadLeaves();
        this.isLoading = false;
    }

    async nextMonth() {

        if (this.isLoading) return;
        this.isLoading = true;
        this.currentDate = new Date(
            this.currentDate.getFullYear(),
            this.currentDate.getMonth() + 1,
            1
        );
        this.prepareMonthDates();
        await this.loadLeaves();
        this.isLoading = false;
    }

    handleStaffClick(event){
        this.selectedStaffId = event.currentTarget.dataset.id;

        console.log('===== STAFF SELECTED =====');
        console.log('Selected Staff Id:', this.selectedStaffId);

        const selectedStaff = this.staffList.find(s => s.staffId === this.selectedStaffId);
        console.log('Selected Staff Name:', selectedStaff?.staffName);

        this.updateSelectedStaffHighlight();

        this.buildCalendar();
    }

    updateSelectedStaffHighlight(){
        this.staffList = this.staffList.map(staff=>{
            return{
                ...staff,
                rowClass: staff.staffId === this.selectedStaffId
                    ? 'staff-row staff-selected'
                    : 'staff-row'
            };
        });
    }

    handleSearch(event){
        this.searchKey = event.target.value.toLowerCase();
        if(!this.searchKey){
            this.staffList = [...this.allStaffList];
            return;
        }
        this.staffList = this.allStaffList.filter(staff =>
            staff.staffName.toLowerCase().includes(this.searchKey)
        );
    }

    getLeaveClass(status){

        if(status === 'Approved'){
            return 'calendar-pill calendar-pill_approved slds-truncate';
        }
        if(status === 'Requested'){
            return 'calendar-pill calendar-pill_requested slds-truncate';
        }
        if(status === 'Rejected'){
            return 'calendar-pill calendar-pill_rejected slds-truncate';
        }
        if(status === 'Cancelled'){
            return 'calendar-pill calendar-pill_cancelled slds-truncate';
        }
        if(status === 'Withdraw'){
            return 'calendar-pill calendar-pill_withdrawn slds-truncate';
        }
        return 'calendar-pill';
    }

    backToHome() {
        const event = new CustomEvent('backtohome', {
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }

    weeklyView = false;  
    monthlyView = true;

    showWeeklyView() {

        // ✅ update local state immediately (UI responsiveness)
        this.weeklyView = true;
        this.monthlyView = false;

        // ✅ notify parent to switch component
        const event = new CustomEvent('showweekly', {
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }

    showMonthlyView() {
        this.weeklyView = false;
        this.monthlyView = true;
    }

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

    async handleMonthChange(event) {

        if (this.isLoading) return;
        this.isLoading = true;
        const selectedDate = event.detail.value;
        if (!selectedDate) {
            this.isLoading = false;
            return;
        }

        this.currentDate = new Date(selectedDate);
        this.prepareMonthDates();
        await this.loadLeaves();
        this.isLoading = false;
    }

    get calendarClass() {
        return `calendar-grid ${this.animationClass} ${this.isLoading ? 'loading' : ''}`;
    }

}