declare module "@salesforce/apex/WyzedIntegrationHandler.encodeJWT" {
  export default function encodeJWT(param: {uid: any, firstname: any, surname: any, email: any, isAdmin: any}): Promise<any>;
}
declare module "@salesforce/apex/WyzedIntegrationHandler.redirectToWyzedSSO" {
  export default function redirectToWyzedSSO(param: {uid: any, firstname: any, surname: any, email: any, isAdmin: any}): Promise<any>;
}
