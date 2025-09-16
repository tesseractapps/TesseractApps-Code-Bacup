import { LightningElement, track, wire, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation'; 
//import GetOnBoardList from '@salesforce/apex/OnBoardingClass.GetOnBoardList';
const actions = [
    { label: 'Show details', name: 'show_details' },
    { label: 'Edit', name: 'Edit' },
];

const columns = [
    { label: 'Name', fieldName: 'Name',initialWidth: 140 },
    { label: 'Date of Joining', fieldName: 'Date__c',initialWidth: 140 },
    { label: 'Staff', fieldName: 'Staff__c',initialWidth: 140 },
    {
        type: 'action',
        typeAttributes: { rowActions: actions },
    },
];

export default class OfferDocumentation extends NavigationMixin(LightningElement) {
   @track  data = [];
   @track columns = columns;
   wiredOnBoardList;

    connectedCallback(){
       /*  getOnboardingList().then(response => {
        console.log('calling response ', JSON.stringify(response));
        this.data =response;

        }); */
    }
    /* @wire(GetOnBoardList)
    wiredClient(result) {
       // this.wiredClientResult = result;
       

        const { data, error } = result;
        if (data) {
           // console.log('Data: ', data); // Debugging line
           console.log('OnBoarding List ', JSON.stringify(data)); // Debugging line
           this.data = data;
           
        } else if (error) {
            console.error('Error: ', error); // Debugging line
            
        }
    } */
    handleClick(){
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Offer_Documentation__c',
                actionName: 'new'
            },
        });
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        switch (actionName) {
            case 'Edit':
        console.log('in edit');
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: row.Id,
                    actionName: 'view'
                  }
            });
              
           /*  const baseUrl = window.location.origin + '/s';
            const docusignUrl = `${baseUrl}/apex/dfsle__embeddedsigning?sId=${row.Id}&sendingExperience=null&isEmbedded=true&templateId=a0v9h0000013aHhAAI&recordId=${row.Id}&title=Send Offer Letter Demo`;
            console.log('site url => '+docusignUrl);
            window.open(docusignUrl, '_blank'); */
                break;
            case 'show_details':
                this.showRowDetails(row);
                break;
            default:
        }
    }
}