import { LightningElement } from 'lwc';
import My_Resource from "@salesforce/resourceUrl/myResource";
export default class HumanResourcesMenuDashboard extends LightningElement {

    HR = My_Resource+'/myResource/images/HR.svg';
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

}