declare module "@salesforce/apex/XeroSettingsController.getCurrentUserOrganisationId" {
  export default function getCurrentUserOrganisationId(): Promise<any>;
}
declare module "@salesforce/apex/XeroSettingsController.saveFacilityXeroSetting" {
  export default function saveFacilityXeroSetting(param: {organisationId: any, payItemType: any, roleName: any, roleIds: any, xeroPayitem: any, xeroPayitemName: any, category: any, shiftType: any, customShiftType: any, brokenType: any, sleepoverType: any, overTimeType: any, subShiftType: any, customRateType: any}): Promise<any>;
}
declare module "@salesforce/apex/XeroSettingsController.getXeroSettingByRoleName" {
  export default function getXeroSettingByRoleName(param: {roleName: any, organisationId: any}): Promise<any>;
}
declare module "@salesforce/apex/XeroSettingsController.getAllFacilityRoles" {
  export default function getAllFacilityRoles(param: {organisationId: any}): Promise<any>;
}
declare module "@salesforce/apex/XeroSettingsController.getAllXeroSettings" {
  export default function getAllXeroSettings(param: {organisationId: any}): Promise<any>;
}
declare module "@salesforce/apex/XeroSettingsController.getEarningsRatesFromXero" {
  export default function getEarningsRatesFromXero(): Promise<any>;
}
declare module "@salesforce/apex/XeroSettingsController.getReimbursementItemsFromXero" {
  export default function getReimbursementItemsFromXero(): Promise<any>;
}
declare module "@salesforce/apex/XeroSettingsController.addNewPayItem" {
  export default function addNewPayItem(param: {payItemName: any, payItemType: any}): Promise<any>;
}
declare module "@salesforce/apex/XeroSettingsController.updateFacilityXeroSetting" {
  export default function updateFacilityXeroSetting(param: {organisationId: any, settingIds: any, payItemType: any, roleName: any, roleIds: any, xeroPayitem: any, xeroPayitemName: any, category: any, shiftType: any, customShiftType: any, brokenType: any, sleepoverType: any, overTimeType: any, subShiftType: any, customRateType: any}): Promise<any>;
}
declare module "@salesforce/apex/XeroSettingsController.deleteMultipleXeroSettings" {
  export default function deleteMultipleXeroSettings(param: {settingIds: any, organisationId: any}): Promise<any>;
}
