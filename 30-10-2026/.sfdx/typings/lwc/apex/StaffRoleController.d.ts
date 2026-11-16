declare module "@salesforce/apex/StaffRoleController.getStaffRoles" {
  export default function getStaffRoles(param: {staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffRoleController.getStaffRoleWithRates" {
  export default function getStaffRoleWithRates(param: {staffId: any, roleName: any, facility: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffRoleController.createStaffRoles" {
  export default function createStaffRoles(param: {staffId: any, selectedRoles: any, dropdownSelectedRole: any, hourlyRate: any, saturdayHourlyRate: any, sundayHourlyRate: any, publicHolidayHourlyRate: any, afternoonShiftRate: any, nightShiftRate: any, sleepoverAllowance: any, categoryType: any, classificationLevel: any, classificationPayType: any, jobType: any, selectedDropDownFacilityValue: any, allowanceMethod: any, twoBreakAllowance: any, oneBreakAllowance: any, roleEmploymentData: any, standardWeeklyRate: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffRoleController.getSelectedRole" {
  export default function getSelectedRole(param: {staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/StaffRoleController.getActiveStaffRoles" {
  export default function getActiveStaffRoles(param: {staffId: any}): Promise<any>;
}
