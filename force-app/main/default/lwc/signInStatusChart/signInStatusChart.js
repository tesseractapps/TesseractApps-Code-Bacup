import { LightningElement, wire, track } from 'lwc';
import My_Resource from "@salesforce/resourceUrl/myResource";
import userId from '@salesforce/user/Id';
import getSignInCounts from '@salesforce/apex/SignInStatusController.getSignInCounts';

export default class SignInStatusChart extends LightningElement {
    SingIn = My_Resource + '/myResource/images/Signin_Payroll.png';

    completedCount = 0;
    inProgressCount = 0;
    acceptedCount = 0;
    @track Id = userId;

    @wire(getSignInCounts, { userId: '$Id' })
    wiredSignInCounts({ error, data }) {
        if (data) {
            console.log('data====>'+JSON.stringify(data));
            // Assign values fetched from Apex
            this.completedCount = data.completedCount || 0;
            this.inProgressCount = data.inprogressCount || 0;
            this.acceptedCount = data.acceptedCount || 0;
        } else if (error) {
            console.error('Error fetching sign-in counts:', error);
        }
    }
    // grandchildevent(){
    //     const customEvent = new CustomEvent('grandchildevent', {
    //         detail: { message: 'signin' },
    //         bubbles: true,
    //         composed: true
    //     });
    //     this.dispatchEvent(customEvent);
    // }

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