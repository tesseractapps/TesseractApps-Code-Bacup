declare module "@salesforce/apex/DashboardLayoutController.getLayout" {
  export default function getLayout(param: {staffId: any}): Promise<any>;
}
declare module "@salesforce/apex/DashboardLayoutController.saveLayout" {
  export default function saveLayout(param: {staffId: any, layoutJson: any}): Promise<any>;
}
declare module "@salesforce/apex/DashboardLayoutController.deleteWidgetFromLayout" {
  export default function deleteWidgetFromLayout(param: {staffId: any, widgetId: any}): Promise<any>;
}
declare module "@salesforce/apex/DashboardLayoutController.addWidgetToLayout" {
  export default function addWidgetToLayout(param: {staffId: any, widgetId: any, widgetType: any, style: any}): Promise<any>;
}
declare module "@salesforce/apex/DashboardLayoutController.getAllFacilities" {
  export default function getAllFacilities(): Promise<any>;
}
