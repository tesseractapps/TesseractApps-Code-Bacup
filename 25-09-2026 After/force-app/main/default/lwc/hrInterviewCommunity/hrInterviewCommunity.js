import { LightningElement,track } from 'lwc';
import getInterviewUpdate from '@salesforce/apex/HrIntervieHandler.getInterviewUpdate';
import FORM_FACTOR from '@salesforce/client/formFactor';

export default class HrInterviewCommunity extends LightningElement {
    @track interviewdata;
get isDesktop() {
    //alert(FORM_FACTOR);
    return FORM_FACTOR === 'Large';
}

get isMobile() {
    //alert(FORM_FACTOR);
    return FORM_FACTOR === 'Small';
}

    connectedCallback(){
        console.log('interview data');
        let tempConList=[];
        getInterviewUpdate().then(response=>{
            console.log('interview data for Loop');
            //this.jobAdsList=response; 
            response.forEach(record => {
                let tempRec=Object.assign({},record);
                tempRec.Name = '/' + tempRec.Id;
                tempRec.jobTitile = '/' + tempRec.Advertisement__c;
                tempRec.interviewDate = new Date(tempRec.Interview_date__c).toLocaleDateString('en-GB');
                tempRec.fullname = tempRec.First_Name__c+' '+tempRec.Last_Name__c;
                tempConList.push(tempRec);
            });
            //this.accounts=tempConList; 
            this.interviewdata=tempConList;
            console.log('interview Data=====>', JSON.stringify(this.interviewdata));
            
            }).catch(err => {
                console.log('Oh noooo!!');
                console.log(err);
               
        });
    }    
}