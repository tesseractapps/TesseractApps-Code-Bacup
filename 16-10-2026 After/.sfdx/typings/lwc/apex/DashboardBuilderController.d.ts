declare module "@salesforce/apex/DashboardBuilderController.getLayout" {
  export default function getLayout(param: {staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/DashboardBuilderController.saveLayout" {
  export default function saveLayout(param: {staffId: any, layoutJson: any}): Promise<any>;
}
declare module "@salesforce/apex/DashboardBuilderController.getNormalizedData" {
  export default function getNormalizedData(param: {widgetType: any, facilityId: any, filterStartDate: any, filterEndDate: any, dateRange: any}): Promise<any>;
}
