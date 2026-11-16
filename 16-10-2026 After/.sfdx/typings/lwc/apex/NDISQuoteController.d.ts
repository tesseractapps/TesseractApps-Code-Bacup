declare module "@salesforce/apex/NDISQuoteController.getQuoteData" {
  export default function getQuoteData(param: {participantId: any, newContactId: any}): Promise<any>;
}
declare module "@salesforce/apex/NDISQuoteController.saveQuoteHeader" {
  export default function saveQuoteHeader(param: {headerJson: any}): Promise<any>;
}
declare module "@salesforce/apex/NDISQuoteController.saveQuotePdfUrl" {
  export default function saveQuotePdfUrl(param: {quoteId: any, pdfUrl: any, quoteJson: any}): Promise<any>;
}
declare module "@salesforce/apex/NDISQuoteController.createQuoteHeader" {
  export default function createQuoteHeader(param: {headerJson: any}): Promise<any>;
}
declare module "@salesforce/apex/NDISQuoteController.saveLineItems" {
  export default function saveLineItems(param: {itemsJson: any}): Promise<any>;
}
declare module "@salesforce/apex/NDISQuoteController.getQuoteById" {
  export default function getQuoteById(param: {quoteId: any}): Promise<any>;
}
declare module "@salesforce/apex/NDISQuoteController.getQuoteByIdWithLines" {
  export default function getQuoteByIdWithLines(param: {quoteId: any}): Promise<any>;
}
declare module "@salesforce/apex/NDISQuoteController.getDraftQuotes" {
  export default function getDraftQuotes(param: {facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/NDISQuoteController.deleteLineItem" {
  export default function deleteLineItem(param: {lineItemId: any}): Promise<any>;
}
declare module "@salesforce/apex/NDISQuoteController.deleteQuoteLineItem" {
  export default function deleteQuoteLineItem(param: {lineItemId: any}): Promise<any>;
}
declare module "@salesforce/apex/NDISQuoteController.createNewContact" {
  export default function createNewContact(param: {newCon: any}): Promise<any>;
}
declare module "@salesforce/apex/NDISQuoteController.getNewContacts" {
  export default function getNewContacts(param: {searchTerm: any, facilityId: any}): Promise<any>;
}
declare module "@salesforce/apex/NDISQuoteController.getNewContactById" {
  export default function getNewContactById(param: {contactId: any}): Promise<any>;
}
declare module "@salesforce/apex/NDISQuoteController.getQuoteRecipientEmail" {
  export default function getQuoteRecipientEmail(param: {quoteId: any}): Promise<any>;
}
