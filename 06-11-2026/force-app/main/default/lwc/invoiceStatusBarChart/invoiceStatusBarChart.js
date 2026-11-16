import { LightningElement,wire, track } from 'lwc';
import getInvoiceCounts from '@salesforce/apex/InvoiceController.getInvoiceCounts';
import userId from '@salesforce/user/Id';
import { publish, MessageContext } from 'lightning/messageService';
import DASHBOARD_REDIRECT_CHANNEL from '@salesforce/messageChannel/DashboardRedirectMessageChannel__c';

export default class InvoiceStatus extends LightningElement {

    @track draftInvoiceCount = 0;
    @track issuedInvoiceCount = 0;
    @track receivedInvoiceCount = 0;
    @track tooltipText = '';
    @track tooltipStyle = '';
    @track showTooltip = false;
    @track mouse = '';

    @wire(MessageContext)
    messageContext;

    connectedCallback() {
        this.fetchInvoiceCounts();
    }

    fetchInvoiceCounts() {
        getInvoiceCounts({ userId })
            .then(data => {
                this.draftInvoiceCount = data.draftInvoice > 0 ? Math.min(data.draftInvoice, 100) : 0;
                this.issuedInvoiceCount = data.issuedInvoice > 0 ? Math.min(data.issuedInvoice, 100) : 0;
                this.receivedInvoiceCount = data.receivedInvoice > 0 ? Math.min(data.receivedInvoice, 100) : 0;
            })
            .catch(error => {
                console.error("Error fetching invoice counts", error);
            });
    }

    get invoicesStyle() {
        return `width:${this.issuedInvoiceCount}%`;
    }

    get collectedStyle() {
        return `width:${this.receivedInvoiceCount}%`;
    }

    get pendingStyle() {
        return `width:${this.draftInvoiceCount}%`;
    }

    ontooltip(event) {
        this.tooltipText = event.currentTarget.dataset.number; // Set tooltip text
        this.mouse = this.tooltipText;
    
        // Get mouse position
        let mouseX = event.clientX;
        let mouseY = event.clientY;
    
        // Tooltip dimensions and offsets
        let tooltipWidth = 120;  // Approximate tooltip width
        let tooltipHeight = 40;  // Approximate tooltip height
        let offsetX = 10;  // Space from cursor (horizontal)
        let offsetY = 20;  // Space from cursor (vertical)
    
        let leftPosition = mouseX;
        let topPosition = mouseY + offsetY;
    
        // **Prevent tooltip from going off-screen (RIGHT SIDE)**
        if (leftPosition + tooltipWidth > window.innerWidth) {
            leftPosition = mouseX - tooltipWidth - offsetX; // Move to left if needed
        }

        console.log('leftPosition==>'+leftPosition);
        // **Prevent tooltip from going off-screen (LEFT SIDE)**
        if (leftPosition < 0) {
            leftPosition = offsetX; // Keep it inside the screen
        }

        console.log('window.innerHeight===>'+window.innerHeight);
    
        // **Prevent tooltip from going off-screen (BOTTOM SIDE)**
        if (topPosition + tooltipHeight > window.innerHeight) {
            topPosition = mouseY - tooltipHeight - offsetY; // Move it up if needed
        }
    
        // **Prevent tooltip from going off-screen (TOP SIDE)**
        if (topPosition < 0) {
            topPosition = offsetY; // Keep it inside the screen
        }
    
        // Apply new position
        this.tooltipStyle = `position: fixed; top: ${topPosition}px; left: ${leftPosition}px; opacity: 1;`;
        this.showTooltip = true;
    }
    
    

    hidetooltip() {
        this.showTooltip = false;
    }

    grandchildevent(event){
        event.preventDefault();
        const message = event.currentTarget.dataset.name;
        console.log(message);

        const customEvent = new CustomEvent('grandchildevent', {
            detail: { message: message },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(customEvent);
    }
    // handleRedirectClick(event) {
    //     event.preventDefault();
    //     const message = event.currentTarget.dataset.name || 'Sign In';

    //     publish(this.messageContext, DASHBOARD_REDIRECT_CHANNEL, {
    //         target: message
    //     });
    // }
}