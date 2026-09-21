import { LightningElement, api } from 'lwc';
import SALES_EMAIL from '@salesforce/label/c.Sales_Email';

export default class UpgradeModal extends LightningElement {

    @api isOpen = false;

    handleClose() {
        this.isOpen = false;

        // Notify parent
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleUpgrade() {
        // Opens email client
        window.location.href =
            'mailto:itsupport@tesseractapps.com?subject=Upgrade%20Request';

        this.handleClose();
    }

    label = {
        SALES_EMAIL
    };

    get mailToLink() {
        return 'mailto:' + this.label.SALES_EMAIL;
    }
}