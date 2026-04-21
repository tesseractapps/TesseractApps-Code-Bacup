import { LightningElement,track,api } from 'lwc';
import feedback from '@salesforce/apex/InterviewFeedBackController.feedback';
import feedbackRec from '@salesforce/apex/InterviewFeedBackController.feedbackRec';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import Tell_us_about_yourselves from '@salesforce/label/c.Tell_us_about_yourselves';
import Tell_us_about_your_experience_in_NDIS from '@salesforce/label/c.Tell_us_about_your_experience_in_NDIS';
import Have_you_ever_faced_any_confilict from '@salesforce/label/c.Have_you_ever_faced_any_confilict';

export default class InterviewFeedback extends LightningElement {
    @api recordId;
    urSelfRating;
    abouturSelfAns;
    anyConfilict;
    anyConfilictAns;
    experienceInNDIS;
    experienceInNDISAns;
    @track saveboolean=true;
    @track urSelfRating1=false;
    @track urSelfRating2=false;
    @track urSelfRating3=false;
    @track urSelfRating4=false;
    @track urSelfRating5=false;
    @track experienceInNDIS1=false;
    @track experienceInNDIS2=false;
    @track experienceInNDIS3=false;
    @track experienceInNDIS4=false;
    @track experienceInNDIS5=false;
    @track anyConfilict1=false;
    @track anyConfilict2=false;
    @track anyConfilict3=false;
    @track anyConfilict4=false;
    @track anyConfilict5=false;
   
  label = {
    Tell_us_about_yourselves,
    Tell_us_about_your_experience_in_NDIS,
    Have_you_ever_faced_any_confilict
  };
  connectedCallback(){
    feedbackRec({recordId:this.recordId}).then(response=>{
      this.urSelfRating=response.Tell_us_about_yourselves_Rating__c;
      this.abouturSelfAns=response.Tell_us_about_yourselves__c;
      this.anyConfilict=response.Have_you_ever_faced_any_confilict_Rating__c;
      this.anyConfilictAns=response.Have_you_ever_faced_any_confilict__c;
      this.experienceInNDIS=response.Tell_us_about_your_NDISexperience_rating__c;
      this.experienceInNDISAns=response.Tell_us_about_your_experience_in_NDIS__c;
      this.saveboolean=false;

      if( this.urSelfRating=='5'){
        this.urSelfRating5=true;
      }
      if( this.urSelfRating=='4'){
        this.urSelfRating4=true;
      }
      if( this.urSelfRating=='3'){
        this.urSelfRating3=true;
      }
      if( this.urSelfRating=='2'){
        this.urSelfRating2=true;
      }
      if( this.urSelfRating=='1'){
        this.urSelfRating1=true;
      }

      if(this.experienceInNDIS=='5'){
        this.experienceInNDIS5=true;
      }
      if(this.experienceInNDIS=='4'){
        this.experienceInNDIS4=true;
      }
      if(this.experienceInNDIS=='3'){
        this.experienceInNDIS3=true;
      }
      if(this.experienceInNDIS=='2'){
        this.experienceInNDIS2=true;
      }
      if(this.experienceInNDIS=='1'){
        this.experienceInNDIS1=true;
      }
      if(this.anyConfilict=='5'){
        this.anyConfilict5=true;
      }
      if(this.anyConfilict=='4'){
        this.anyConfilict4=true;
      }
      if(this.anyConfilict=='3'){
        this.anyConfilict3=true;
      }
      if(this.anyConfilict=='2'){
        this.anyConfilict2=true;
      }
      if(this.anyConfilict=='1'){
        this.anyConfilict1=true;
      }

      const evt = new ShowToastEvent({
        title: '',
        message: 'Feedback is already submitted Successfully',
        variant: 'success',
        mode: 'dismissable'
      });
      this.dispatchEvent(evt);
      
      });
  }

  handleSave(){
    feedback({urSelfRating:this.urSelfRating,
              abouturSelfAns:this.abouturSelfAns,
              anyConfilict:this.anyConfilict,
              anyConfilictAns:this.anyConfilictAns,
              experienceInNDIS:this.experienceInNDIS,
              experienceInNDISAns:this.experienceInNDISAns,
              recordId:this.recordId
            }).then(respone=>{
              this.saveboolean=false;
              console.log('feedback form submitted successfully');
              setTimeout(function(){
                window.location.reload();
             }, 500);

            }).catch(err => {
              console.log('Oh noooo!!');
              console.log(err);
              //alert(err);
          });
          
  }

  rating(event) {
    if (event.target.name === "urSelfRating") {
      this.urSelfRating = event.target.value;
      console.log('rating of urSelfRating ',this.urSelfRating);
    }
    if (event.target.name === "experienceInNDIS") {
        this.experienceInNDIS = event.target.value;
        console.log('rating of experienceInNDIS ',this.experienceInNDIS);
    }
    if (event.target.name === "anyConfilict") {
      this.anyConfilict = event.target.value;
      console.log('rating of anyConfilict ',this.anyConfilict);
    }
  }
  questionCapture(event) {
    console.log('question name');
    if (event.target.name === "abouturSelfAns") {
      this.abouturSelfAns = event.target.value;
      console.log('rating of abouturSelfAns ',this.abouturSelfAns);
    }
    if (event.target.name === "experienceInNDISAns") {
        this.experienceInNDISAns = event.target.value;
        console.log('rating of experienceInNDIS ',this.experienceInNDISAns);
    }
    if (event.target.name === "anyConfilictAns") {
      this.anyConfilictAns = event.target.value;
      console.log('rating of anyConfilictAns ',this.anyConfilictAns);
    }
  }
 }