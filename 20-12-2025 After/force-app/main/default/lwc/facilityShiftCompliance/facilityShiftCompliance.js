import { LightningElement, track, api } from 'lwc';
import getFacilityRoles from '@salesforce/apex/FacilityController.getFacilityRoles';
import saveFacilityComplianceSettings from '@salesforce/apex/FacilityDocumentController.saveFacilityComplianceSettings';
import loadSettings from '@salesforce/apex/FacilityDocumentController.loadFacilityComplianceSettings';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class ShiftCompliance extends LightningElement {
@api facilityId;
@track baseFacilityRoles = [];
@track isMaxDaysOpen = false;
@track isMinHoursOpen = false;
@track isMaxWeekOpen = false;
@track isMaxShiftOpen = false;
@track isMandatoryBreakOpen = false;
@track isClockAccuracyOpen = false;
@track isAttendanceOpen = false;
@track maxDaysRolesUI = [];
@track minHoursRolesUI = [];
@track maxWeekRolesUI = [];
@track maxShiftRolesUI = [];
@track mandatoryBreakRolesUI = [];
@track clockAccuracyRolesUI = [];
@track attendanceRolesUI = [];
    // RULE MODELS
    @track maxDays = {
        active: false,
        value: 0,
        applyRoles: false,
        roles: []
    };

    @track minHours = {
        active: false,
        value: 0,
        applyRoles: false,
        roles: []
    };

    @track maxWeek = {
        active: false,
        value: 0,
        applyRoles: false,
        roles: [],
    };

    @track maxShift = {
        active: false,
        value: 0,
        applyRoles: false,
        roles: [],
    };

    @track mandatoryBreak = {
        active: false,
        breakEvery: 0,
        breakDuration: 0,
        applyRoles: false,
        roles: [],
    };

    @track clockAccuracy = {
        active: false,
        applyRoles: false,
        roles: [],
        maxLateMinutes: 0,
        allowedLatePerMonth: 0
    };

    @track attendance = {
        active: false,
        applyRoles: false,
        roles: [],
        maxMissed: 0,
        requireDocs: false
    };

get minHoursDisplayText() {
    return this.minHours.roles.length > 0
        ? this.minHours.roles.join(', ')
        : 'Select Roles';
}
get minHoursSelectedClass() {
    return this.minHours.roles.length > 0
        ? 'selected-text'
        : 'placeholder-text';
}
get minHoursChevron() {
    return this.isMinHoursOpen ? 'utility:chevrondown' : 'utility:chevronright';
}
    get chevronIcon() {
        return this.isMaxDaysOpen ? 'utility:chevrondown' : 'utility:chevronright';
    }
get maxDaysDisplayText() {
    return this.maxDays.roles.length > 0
        ? this.maxDays.roles.join(', ')
        : 'Select Roles';
}
get maxDaysSelectedClass() {
    return this.maxDays.roles.length > 0 
        ? 'selected-text' 
        : 'placeholder-text';
}
get maxWeekDisplayText() {
    return this.maxWeek.roles.length > 0
        ? this.maxWeek.roles.join(', ')
        : 'Select Roles';
}
get maxWeekSelectedClass() {
    return this.maxWeek.roles.length > 0
        ? 'selected-text'
        : 'placeholder-text';
}
get maxWeekChevron() {
    return this.isMaxWeekOpen ? 'utility:chevrondown' : 'utility:chevronright';
}
get activeRules() {
    let count = 0;
    if (this.maxDays.active) count++;
    if (this.minHours.active) count++;
    if (this.maxWeek.active) count++;
    if (this.maxShift.active) count++;
    if (this.mandatoryBreak.active) count++;
    if (this.clockAccuracy.active) count++;
    if (this.attendance.active) count++;
    return count;
}
get roleSpecificRules() {
    let count = 0;
    if (this.maxDays.applyRoles) count++;
    if (this.minHours.applyRoles) count++;
    if (this.maxWeek.applyRoles) count++;
    if (this.maxShift.applyRoles) count++;
    if (this.mandatoryBreak.applyRoles) count++;
    if (this.clockAccuracy.applyRoles) count++;
    if (this.attendance.applyRoles) count++;
    return count;
}
    get maxShiftDisplayText() {
    return this.maxShift.roles.length > 0
        ? this.maxShift.roles.join(', ')
        : 'Select Roles';
}
get maxShiftSelectedClass() {
    return this.maxShift.roles.length > 0
        ? 'selected-text'
        : 'placeholder-text';
}
get maxShiftChevron() {
    return this.isMaxShiftOpen ? 'utility:chevrondown' : 'utility:chevronright';
}
get mandatoryBreakDisplayText() {
    return this.mandatoryBreak.roles.length > 0
        ? this.mandatoryBreak.roles.join(', ')
        : 'Select Roles';
}
get mandatoryBreakSelectedClass() {
    return this.mandatoryBreak.roles.length > 0
        ? 'selected-text'
        : 'placeholder-text';
}
get mandatoryBreakChevron() {
    return this.isMandatoryBreakOpen ? 'utility:chevrondown' : 'utility:chevronright';
}
get clockAccuracyDisplayText() {
    return this.clockAccuracy.roles.length > 0
        ? this.clockAccuracy.roles.join(', ')
        : 'Select Roles';
}
get clockAccuracySelectedClass() {
    return this.clockAccuracy.roles.length > 0
        ? 'selected-text'
        : 'placeholder-text';
}
get clockAccuracyChevron() {
    return this.isClockAccuracyOpen ? 'utility:chevrondown' : 'utility:chevronright';
}
get attendanceDisplayText() {
    return this.attendance.roles.length > 0
        ? this.attendance.roles.join(', ')
        : 'Select Roles';
}
get attendanceSelectedClass() {
    return this.attendance.roles.length > 0
        ? 'selected-text'
        : 'placeholder-text';
}
get attendanceChevron() {
    return this.isAttendanceOpen ? 'utility:chevrondown' : 'utility:chevronright';
}
toggleMinHoursDropdown(event) {
    event.stopPropagation();
    this.isMinHoursOpen = !this.isMinHoursOpen;
}
    // Toggle full rule on/off
/*     toggleRule(e) {
        const rule = e.target.dataset.rule;
        this[rule].active = e.target.checked;
    } */
toggleRule(e) {
    const rule = e.target.dataset.rule;
    const isActive = e.target.checked;

    this[rule].active = isActive;

    // When rule is turned OFF, reset applyRoles and roles
    if (!isActive) {
        this[rule].applyRoles = false;
        this[rule].roles = [];

        // Reset UI list for this rule
        const listName = rule + 'RolesUI';
        this[listName] = this[listName].map(r => ({
            ...r,
            checked: false,
            badgeClass: 'status-badge1 status-badge-inactive1',
            statusText: 'Inactive'
        }));
    }
}

    // Toggle specific field (applyRoles)
    toggleField(e) {
        const rule = e.target.dataset.rule;
        const field = e.target.dataset.field;
        this[rule][field] = e.target.checked;
    }

    // Update numeric value
    updateNumber(e) {
        const rule = e.target.dataset.rule;
        const field = e.target.dataset.field;
        this[rule][field] = Number(e.target.value);
    }
    connectedCallback() {
        getFacilityRoles({ facilityId: this.facilityId })
            .then((result) => {
                const activeRoles = result.filter(r => r.Is_Active__c === true);

                this.baseFacilityRoles = activeRoles.map(r => ({
                    id: r.Id,
                    label: r.Role_Name__c
                }));

                // Clone for each rule
                const initUi = this.baseFacilityRoles.map(r => ({
                    id: r.id,
                    label: r.label,
                    checked: false,
                    statusText: 'Inactive',
                    badgeClass: 'status-badge1 status-badge-inactive1'
                }));

                this.maxDaysRolesUI = initUi.map(x => ({ ...x }));
                this.minHoursRolesUI = initUi.map(x => ({ ...x }));
                this.maxWeekRolesUI = initUi.map(x => ({ ...x }));
                this.maxShiftRolesUI = initUi.map(x => ({ ...x }));
                this.mandatoryBreakRolesUI = initUi.map(x => ({ ...x }));
                this.clockAccuracyRolesUI = initUi.map(x => ({ ...x }));
                this.attendanceRolesUI = initUi.map(x => ({ ...x }));
                // 2. Now load saved compliance settings
                return loadSettings({ facilityId: this.facilityId });
            })
            .then(data => {
                if (data) {
                    this.populateFromExisting(data);
                }
            })
            .catch(error => {
                console.error('Error initializing Shift Compliance', error);
            });
    }

    // Add this lifecycle hook
    renderedCallback() {
        // Add click event listener to the document
        if (!this.hasEventListener) {
            this.hasEventListener = true;
            document.addEventListener('click', this.handleOutsideClick.bind(this));
        }
    }

    // Clean up the event listener when component is destroyed
    disconnectedCallback() {
        if (this.hasEventListener) {
            document.removeEventListener('click', this.handleOutsideClick.bind(this));
            this.hasEventListener = false;
        }
    }

    populateFromExisting(records) {
        records.forEach(rec => {

            switch (rec.Compliance_Type__c) {

                case 'Maximum Consecutive Days':
                    this.maxDays.recordId = rec.Id;
                    this.maxDays.active = rec.Is_Active__c;
                    this.maxDays.applyRoles = rec.Apply_to_specific_roles__c;
                    this.maxDays.value = rec.Max_Consecutive_Days__c;
                    this.maxDays.roles = rec.Roles__c ? rec.Roles__c.split(',').map(r => r.trim()) : [];
                    this.updateRoleSelectionUI('maxDaysRolesUI', this.maxDays.roles);
                    break;

                case 'Minimum Hours Between Shifts':
                    this.minHours.recordId = rec.Id;
                    this.minHours.active = rec.Is_Active__c;
                    this.minHours.applyRoles = rec.Apply_to_specific_roles__c;
                    this.minHours.value = rec.Min_Hours_Between_Shifts__c;
                    this.minHours.roles = rec.Roles__c ? rec.Roles__c.split(',').map(r => r.trim()) : [];
                    this.updateRoleSelectionUI('minHoursRolesUI', this.minHours.roles);
                    break;

                case 'Maximum Hours Per Week':
                    this.maxWeek.recordId = rec.Id;
                    this.maxWeek.active = rec.Is_Active__c;
                    this.maxWeek.applyRoles = rec.Apply_to_specific_roles__c;
                    this.maxWeek.value = rec.Max_Hours_Per_Week__c;
                    this.maxWeek.roles = rec.Roles__c ? rec.Roles__c.split(',').map(r => r.trim()) : [];
                    this.updateRoleSelectionUI('maxWeekRolesUI', this.maxWeek.roles);
                    break;

                case 'Maximum Hours Per Shift':
                    this.maxShift.recordId = rec.Id;
                    this.maxShift.active = rec.Is_Active__c;
                    this.maxShift.applyRoles = rec.Apply_to_specific_roles__c;
                    this.maxShift.value = rec.Max_Hours_Per_Shift__c;
                    this.maxShift.roles = rec.Roles__c ? rec.Roles__c.split(',').map(r => r.trim()) : [];
                    this.updateRoleSelectionUI('maxShiftRolesUI', this.maxShift.roles);
                    break;

                case 'Mandatory Break Requirements':
                    this.mandatoryBreak.recordId = rec.Id;
                    this.mandatoryBreak.active = rec.Is_Active__c;
                    this.mandatoryBreak.applyRoles = rec.Apply_to_specific_roles__c;
                    this.mandatoryBreak.breakEvery = rec.Require_Break_Everyhours__c;
                    this.mandatoryBreak.breakDuration = rec.Break_Duration_minutes__c;
                    this.mandatoryBreak.roles = rec.Roles__c ? rec.Roles__c.split(',').map(r => r.trim()) : [];
                    this.updateRoleSelectionUI('mandatoryBreakRolesUI', this.mandatoryBreak.roles);
                    break;

                case 'Clock In/Out Accuracy':
                    this.clockAccuracy.recordId = rec.Id;
                    this.clockAccuracy.active = rec.Is_Active__c;
                    this.clockAccuracy.applyRoles = rec.Apply_to_specific_roles__c;
                    this.clockAccuracy.maxLateMinutes = rec.Max_Late_Clock_In_minutes__c;
                    this.clockAccuracy.allowedLatePerMonth = rec.Allowed_Late_Instances_Per_Month__c;
                    this.clockAccuracy.roles = rec.Roles__c ? rec.Roles__c.split(',').map(r => r.trim()) : [];
                    this.updateRoleSelectionUI('clockAccuracyRolesUI', this.clockAccuracy.roles);
                    break;

                case 'Shift Attendance Tracking':
                    this.attendance.recordId = rec.Id;
                    this.attendance.active = rec.Is_Active__c;
                    this.attendance.applyRoles = rec.Apply_to_specific_roles__c;
                    this.attendance.maxMissed = rec.Max_Missed_Shifts_Per_Month__c;
                    this.attendance.requireDocs = rec.Require_excuse_for_missed__c;
                    this.attendance.roles = rec.Roles__c ? rec.Roles__c.split(',').map(r => r.trim()) : [];
                    this.updateRoleSelectionUI('attendanceRolesUI', this.attendance.roles);
                    break;
            }
        });
    }

    updateRoleSelectionUI(listName, selected) {
        this[listName] = this[listName].map(r => {
            const inList = selected.includes(r.label);
            return {
                ...r,
                checked: inList,
                badgeClass: inList 
                    ? 'status-badge1 status-badge-active1'
                    : 'status-badge1 status-badge-inactive1',
                statusText: inList ? 'Active' : 'Inactive'
            };
        });
    }
/*             buildPayload() {
                const payload = [];
                // 1. Maximum Consecutive Days
                if (this.maxDays.active) {
                    payload.push({
                        sobjectType: 'Facility_Compliance_Setting__c',
                        Id: this.maxDays.recordId,   // <<< IMPORTANT
                        Compliance_Type__c: 'Maximum Consecutive Days',
                        Is_Active__c: true,
                        Apply_to_specific_roles__c: this.maxDays.applyRoles,
                        Roles__c: this.maxDays.roles.join(','),
                        Max_Consecutive_Days__c: this.maxDays.value
                    });
                }

                // 2. Minimum Hours Between Shifts
                if (this.minHours.active) {
                    payload.push({
                        sobjectType: 'Facility_Compliance_Setting__c',
                        Id: this.minHours.recordId,
                        Compliance_Type__c: 'Minimum Hours Between Shifts',
                        Is_Active__c: true,
                        Apply_to_specific_roles__c: this.minHours.applyRoles,
                        Roles__c: this.minHours.roles.join(','),
                        Min_Hours_Between_Shifts__c: this.minHours.value
                    });
                }

                // 3. Maximum Hours Per Week
                if (this.maxWeek.active) {
                    payload.push({
                        sobjectType: 'Facility_Compliance_Setting__c',
                        Id: this.maxWeek.recordId,
                        Compliance_Type__c: 'Maximum Hours Per Week',
                        Is_Active__c: true,
                        Apply_to_specific_roles__c: this.maxWeek.applyRoles,
                        Roles__c: this.maxWeek.roles.join(','),
                        Max_Hours_Per_Week__c: this.maxWeek.value
                    });
                }

                // 4. Maximum Hours Per Shift
                if (this.maxShift.active) {
                    payload.push({
                        sobjectType: 'Facility_Compliance_Setting__c',
                        Id: this.maxShift.recordId,
                        Compliance_Type__c: 'Maximum Hours Per Shift',
                        Is_Active__c: true,
                        Apply_to_specific_roles__c: this.maxShift.applyRoles,
                        Roles__c: this.maxShift.roles.join(','),
                        Max_Hours_Per_Shift__c: this.maxShift.value
                    });
                }

                // 5. Mandatory Break Requirements
                if (this.mandatoryBreak.active) {
                    payload.push({
                        sobjectType: 'Facility_Compliance_Setting__c',
                        Id: this.mandatoryBreak.recordId,
                        Compliance_Type__c: 'Mandatory Break Requirements',
                        Is_Active__c: true,
                        Apply_to_specific_roles__c: this.mandatoryBreak.applyRoles,
                        Roles__c: this.mandatoryBreak.roles.join(','),
                        Require_Break_Everyhours__c: this.mandatoryBreak.breakEvery,
                        Break_Duration_minutes__c: this.mandatoryBreak.breakDuration
                    });
                }

                // 6. Clock In/Out Accuracy
                if (this.clockAccuracy.active) {
                    payload.push({
                        sobjectType: 'Facility_Compliance_Setting__c',
                        Id: this.clockAccuracy.recordId,
                        Compliance_Type__c: 'Clock In/Out Accuracy',
                        Is_Active__c: true,
                        Apply_to_specific_roles__c: this.clockAccuracy.applyRoles,
                        Roles__c: this.clockAccuracy.roles.join(','),
                        Max_Late_Clock_In_minutes__c: this.clockAccuracy.maxLateMinutes,
                        Allowed_Late_Instances_Per_Month__c: this.clockAccuracy.allowedLatePerMonth
                    });
                }

                // 7. Shift Attendance Tracking
                if (this.attendance.active) {
                    payload.push({
                        sobjectType: 'Facility_Compliance_Setting__c',
                        Id: this.attendance.recordId,
                        Compliance_Type__c: 'Shift Attendance Tracking',
                        Is_Active__c: true,
                        Apply_to_specific_roles__c: this.attendance.applyRoles,
                        Roles__c: this.attendance.roles.join(','),
                        Max_Missed_Shifts_Per_Month__c: this.attendance.maxMissed,
                        Require_excuse_for_missed__c: this.attendance.requireDocs
                    });
                }

                return payload;
            } */
            buildPayload() {
    const payload = [];

    // helper function to push record ALWAYS when recordId exists OR active is true
    const pushRule = (rule, fields, type) => {
        if (!rule.active && !rule.recordId) {
            return; // rule inactive AND not saved before → skip
        }

        const rec = {
            sobjectType: 'Facility_Compliance_Setting__c',
            Id: rule.recordId ?? null,
            Compliance_Type__c: type,
            Is_Active__c: rule.active,
            Apply_to_specific_roles__c: rule.applyRoles,
            Roles__c: rule.roles.join(',')
        };

        Object.assign(rec, fields);

        payload.push(rec);
    };

    pushRule(this.maxDays,
        { Max_Consecutive_Days__c: this.maxDays.value },
        'Maximum Consecutive Days'
    );

    pushRule(this.minHours,
        { Min_Hours_Between_Shifts__c: this.minHours.value },
        'Minimum Hours Between Shifts'
    );

    pushRule(this.maxWeek,
        { Max_Hours_Per_Week__c: this.maxWeek.value },
        'Maximum Hours Per Week'
    );

    pushRule(this.maxShift,
        { Max_Hours_Per_Shift__c: this.maxShift.value },
        'Maximum Hours Per Shift'
    );

    pushRule(this.mandatoryBreak,
        {
            Require_Break_Everyhours__c: this.mandatoryBreak.breakEvery,
            Break_Duration_minutes__c: this.mandatoryBreak.breakDuration
        },
        'Mandatory Break Requirements'
    );

    pushRule(this.clockAccuracy,
        {
            Max_Late_Clock_In_minutes__c: this.clockAccuracy.maxLateMinutes,
            Allowed_Late_Instances_Per_Month__c: this.clockAccuracy.allowedLatePerMonth
        },
        'Clock In/Out Accuracy'
    );

    pushRule(this.attendance,
        {
            Max_Missed_Shifts_Per_Month__c: this.attendance.maxMissed,
            Require_excuse_for_missed__c: this.attendance.requireDocs
        },
        'Shift Attendance Tracking'
    );

    return payload;
}

                saveSettingsHandler() {
                const payload = this.buildPayload();
console.log('PAYLOAD >>> ', JSON.stringify(payload, null, 2));
                saveFacilityComplianceSettings({
                    settings: payload,
                    facilityId: this.facilityId
                })
                .then(() => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Shift compliance settings saved successfully.',
                            variant: 'success'
                        })
                    );
                })
.catch(error => {
    console.error('SAVE ERROR RAW:', error);
    console.error('BODY:', error?.body);
    console.error('MESSAGE:', error?.body?.message);
    console.error('STACK:', error?.body?.stackTrace);
});
            }

            toggleMaxDaysDropdown(event) {
                event.stopPropagation();
                this.isMaxDaysOpen = !this.isMaxDaysOpen;
            }
            handleMaxDaysRoleSelect(event) {
                event.stopPropagation();
                const roleId = event.currentTarget.dataset.roleId;
              /*   const roleObj = this.maxDaysRolesUI.find(r => r.id === roleId);
                if (!roleObj) return;

                const roleName = roleObj.label;

                if (this.maxDays.roles.includes(roleName)) {
                    this.maxDays.roles = this.maxDays.roles.filter(r => r !== roleName);
                } else {
                    this.maxDays.roles = [...this.maxDays.roles, roleName];
                } */

                // (Optional) update a selected visual style on this rule's UI array, if you used classes for selection
                // e.g. no blue pills approach -> not required
            }
            handleMaxDaysToggleActive(event) {
                const roleId = event.target.dataset.roleId;
                const isActive = event.target.checked;

                let roleObj = this.maxDaysRolesUI.find(r => r.id === roleId);
                if (!roleObj) return;

                // Update UI
                roleObj.checked = isActive;
                roleObj.badgeClass = isActive
                    ? 'status-badge1 status-badge-active1'
                    : 'status-badge1 status-badge-inactive1';
                roleObj.statusText = isActive ? 'Active' : 'Inactive';

                // IMPORTANT FIX → UPDATE THE ROLES ARRAY
                if (isActive) {
                    if (!this.maxDays.roles.includes(roleObj.label)) {
                        this.maxDays.roles = [...this.maxDays.roles, roleObj.label];
                    }
                } else {
                    this.maxDays.roles = this.maxDays.roles.filter(r => r !== roleObj.label);
                }
            }
            handleMinHoursRoleSelect(event) {
                event.stopPropagation();
                const roleId = event.currentTarget.dataset.roleId;
              /*   const roleObj = this.minHoursRolesUI.find(r => r.id === roleId);
                if (!roleObj) return;

                const roleName = roleObj.label;

                if (this.minHours.roles.includes(roleName)) {
                    this.minHours.roles = this.minHours.roles.filter(r => r !== roleName);
                } else {
                    this.minHours.roles = [...this.minHours.roles, roleName];
                } */
            }
            handleMinHoursToggleActive(event) {
                const roleId = event.target.dataset.roleId;
                const isActive = event.target.checked;

                let roleObj = this.minHoursRolesUI.find(r => r.id === roleId);
                if (!roleObj) return;

                // Update UI
                roleObj.checked = isActive;
                roleObj.badgeClass = isActive
                    ? 'status-badge1 status-badge-active1'
                    : 'status-badge1 status-badge-inactive1';
                roleObj.statusText = isActive ? 'Active' : 'Inactive';

                // Update roles[]
                if (isActive) {
                    if (!this.minHours.roles.includes(roleObj.label)) {
                        this.minHours.roles = [...this.minHours.roles, roleObj.label];
                    }
                } else {
                    this.minHours.roles = this.minHours.roles.filter(r => r !== roleObj.label);
                }
            }

            toggleMaxWeekDropdown(event) {
                event.stopPropagation();
                this.isMaxWeekOpen = !this.isMaxWeekOpen;
            }
            handleMaxWeekRoleSelect(event) {
                   event.stopPropagation();
                const roleId = event.currentTarget.dataset.roleId;
                /* const roleObj = this.maxWeekRolesUI.find(r => r.id === roleId);
                if (!roleObj) return;

                const roleName = roleObj.label;

                if (this.maxWeek.roles.includes(roleName)) {
                    this.maxWeek.roles = this.maxWeek.roles.filter(r => r !== roleName);
                } else {
                    this.maxWeek.roles = [...this.maxWeek.roles, roleName];
                } */
            }
            handleMaxWeekToggleActive(event) {
                const roleId = event.target.dataset.roleId;
                const isActive = event.target.checked;

                let roleObj = this.maxWeekRolesUI.find(r => r.id === roleId);
                if (!roleObj) return;

                // Update UI
                roleObj.checked = isActive;
                roleObj.badgeClass = isActive
                    ? 'status-badge1 status-badge-active1'
                    : 'status-badge1 status-badge-inactive1';
                roleObj.statusText = isActive ? 'Active' : 'Inactive';

                // Update roles[]
                if (isActive) {
                    if (!this.maxWeek.roles.includes(roleObj.label)) {
                        this.maxWeek.roles = [...this.maxWeek.roles, roleObj.label];
                    }
                } else {
                    this.maxWeek.roles = this.maxWeek.roles.filter(r => r !== roleObj.label);
                }
            }

            toggleMaxShiftDropdown(event) {
                event.stopPropagation();
                this.isMaxShiftOpen = !this.isMaxShiftOpen;
            }
            handleMaxShiftRoleSelect(event) {
                   event.stopPropagation();
                const roleId = event.currentTarget.dataset.roleId;
                /* const roleObj = this.maxShiftRolesUI.find(r => r.id === roleId);
                if (!roleObj) return;

                const roleName = roleObj.label;

                if (this.maxShift.roles.includes(roleName)) {
                    this.maxShift.roles = this.maxShift.roles.filter(r => r !== roleName);
                } else {
                    this.maxShift.roles = [...this.maxShift.roles, roleName];
                } */
            }
            handleMaxShiftToggleActive(event) {
                const roleId = event.target.dataset.roleId;
                const isActive = event.target.checked;

                let roleObj = this.maxShiftRolesUI.find(r => r.id === roleId);
                if (!roleObj) return;

                // Update UI
                roleObj.checked = isActive;
                roleObj.badgeClass = isActive
                    ? 'status-badge1 status-badge-active1'
                    : 'status-badge1 status-badge-inactive1';
                roleObj.statusText = isActive ? 'Active' : 'Inactive';

                // Update roles[]
                if (isActive) {
                    if (!this.maxShift.roles.includes(roleObj.label)) {
                        this.maxShift.roles = [...this.maxShift.roles, roleObj.label];
                    }
                } else {
                    this.maxShift.roles = this.maxShift.roles.filter(r => r !== roleObj.label);
                }
            }

            toggleMandatoryBreakDropdown(event) {
                event.stopPropagation();
                this.isMandatoryBreakOpen = !this.isMandatoryBreakOpen;
            }
            handleMandatoryBreakRoleSelect(event) {
                   event.stopPropagation();
                const roleId = event.currentTarget.dataset.roleId;
                /* const roleObj = this.mandatoryBreakRolesUI.find(r => r.id === roleId);
                if (!roleObj) return;

                const roleName = roleObj.label;

                if (this.mandatoryBreak.roles.includes(roleName)) {
                    this.mandatoryBreak.roles = this.mandatoryBreak.roles.filter(r => r !== roleName);
                } else {
                    this.mandatoryBreak.roles = [...this.mandatoryBreak.roles, roleName];
                } */
            }
            handleMandatoryBreakToggleActive(event) {
                const roleId = event.target.dataset.roleId;
                const isActive = event.target.checked;

                let roleObj = this.mandatoryBreakRolesUI.find(r => r.id === roleId);
                if (!roleObj) return;

                // Update UI
                roleObj.checked = isActive;
                roleObj.badgeClass = isActive
                    ? 'status-badge1 status-badge-active1'
                    : 'status-badge1 status-badge-inactive1';
                roleObj.statusText = isActive ? 'Active' : 'Inactive';

                // Update roles[]
                if (isActive) {
                    if (!this.mandatoryBreak.roles.includes(roleObj.label)) {
                        this.mandatoryBreak.roles = [...this.mandatoryBreak.roles, roleObj.label];
                    }
                } else {
                    this.mandatoryBreak.roles = this.mandatoryBreak.roles.filter(r => r !== roleObj.label);
                }
            }

            toggleClockAccuracyDropdown(event) {
                event.stopPropagation();
                this.isClockAccuracyOpen = !this.isClockAccuracyOpen;
            }
            handleClockAccuracyRoleSelect(event) {
                   event.stopPropagation();
                const roleId = event.currentTarget.dataset.roleId;
              /*   const roleObj = this.clockAccuracyRolesUI.find(r => r.id === roleId);
                if (!roleObj) return;

                const roleName = roleObj.label;

                if (this.clockAccuracy.roles.includes(roleName)) {
                    this.clockAccuracy.roles = this.clockAccuracy.roles.filter(r => r !== roleName);
                } else {
                    this.clockAccuracy.roles = [...this.clockAccuracy.roles, roleName];
                } */
            }
            handleClockAccuracyToggleActive(event) {
                const roleId = event.target.dataset.roleId;
                const isActive = event.target.checked;

                let roleObj = this.clockAccuracyRolesUI.find(r => r.id === roleId);
                if (!roleObj) return;

                // Update UI
                roleObj.checked = isActive;
                roleObj.badgeClass = isActive
                    ? 'status-badge1 status-badge-active1'
                    : 'status-badge1 status-badge-inactive1';
                roleObj.statusText = isActive ? 'Active' : 'Inactive';

                // Update roles[]
                if (isActive) {
                    if (!this.clockAccuracy.roles.includes(roleObj.label)) {
                        this.clockAccuracy.roles = [...this.clockAccuracy.roles, roleObj.label];
                    }
                } else {
                    this.clockAccuracy.roles = this.clockAccuracy.roles.filter(r => r !== roleObj.label);
                }
            }

            toggleAttendanceDropdown(event) {
                event.stopPropagation();
                this.isAttendanceOpen = !this.isAttendanceOpen;
            }
            handleAttendanceRoleSelect(event) {
                   event.stopPropagation();
                const roleId = event.currentTarget.dataset.roleId;
             /*    const roleObj = this.attendanceRolesUI.find(r => r.id === roleId);
                if (!roleObj) return;

                const roleName = roleObj.label;

                if (this.attendance.roles.includes(roleName)) {
                    this.attendance.roles = this.attendance.roles.filter(r => r !== roleName);
                } else {
                    this.attendance.roles = [...this.attendance.roles, roleName];
                } */
            }
            handleAttendanceToggleActive(event) {
                const roleId = event.target.dataset.roleId;
                const isActive = event.target.checked;

                let roleObj = this.attendanceRolesUI.find(r => r.id === roleId);
                if (!roleObj) return;

                // Update UI
                roleObj.checked = isActive;
                roleObj.badgeClass = isActive
                    ? 'status-badge1 status-badge-active1'
                    : 'status-badge1 status-badge-inactive1';
                roleObj.statusText = isActive ? 'Active' : 'Inactive';

                // Update roles[]
                if (isActive) {
                    if (!this.attendance.roles.includes(roleObj.label)) {
                        this.attendance.roles = [...this.attendance.roles, roleObj.label];
                    }
                } else {
                    this.attendance.roles = this.attendance.roles.filter(r => r !== roleObj.label);
                }
            }

            handleOutsideClick(event) {
                // Get all dropdown containers
                const dropdowns = this.template.querySelectorAll('.dropdown-container');
                const clickedInsideDropdown = Array.from(dropdowns).some(dropdown => 
                    dropdown.contains(event.target)
                );
                
                // Check if click is on a dropdown button (to allow toggle to work)
                const isDropdownButton = event.target.closest('.dropdown-button1');
                
                // Only close dropdowns if click is outside ALL dropdown containers
                // AND not on a dropdown button
                if (!clickedInsideDropdown && !isDropdownButton) {
                    this.closeAllDropdowns();
                }
            }
            closeAllDropdowns() {
                this.isMaxDaysOpen = false;
                this.isMinHoursOpen = false;
                this.isMaxWeekOpen = false;
                this.isMaxShiftOpen = false;
                this.isMandatoryBreakOpen = false;
                this.isClockAccuracyOpen = false;
                this.isAttendanceOpen = false;
            }

}