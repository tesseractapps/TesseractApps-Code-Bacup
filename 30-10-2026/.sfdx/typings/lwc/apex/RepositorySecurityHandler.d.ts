declare module "@salesforce/apex/RepositorySecurityHandler.insertSecurityRecord" {
  export default function insertSecurityRecord(param: {repositoryId: any, attachmentId: any, userPermissions: any}): Promise<any>;
}
declare module "@salesforce/apex/RepositorySecurityHandler.insertSecurityPrivilege" {
  export default function insertSecurityPrivilege(param: {repositoryId: any, userId: any}): Promise<any>;
}
declare module "@salesforce/apex/RepositorySecurityHandler.getUserRole" {
  export default function getUserRole(): Promise<any>;
}
declare module "@salesforce/apex/RepositorySecurityHandler.getUsersWithViewPermission" {
  export default function getUsersWithViewPermission(param: {repositoryId: any, roles: any}): Promise<any>;
}
declare module "@salesforce/apex/RepositorySecurityHandler.getConsentReport" {
  export default function getConsentReport(param: {repositoryId: any, attachmentId: any}): Promise<any>;
}
declare module "@salesforce/apex/RepositorySecurityHandler.getStaffNicknameByEmail" {
  export default function getStaffNicknameByEmail(param: {userIds: any}): Promise<any>;
}
declare module "@salesforce/apex/RepositorySecurityHandler.markConsentAsViewed" {
  export default function markConsentAsViewed(param: {repositoryId: any, attachmentId: any}): Promise<any>;
}
declare module "@salesforce/apex/RepositorySecurityHandler.acceptConsent" {
  export default function acceptConsent(param: {repositoryId: any, attachmentId: any}): Promise<any>;
}
