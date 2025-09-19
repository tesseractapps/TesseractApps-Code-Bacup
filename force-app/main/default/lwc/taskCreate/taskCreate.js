import { LightningElement, track, wire,api } from 'lwc';
import listOfUsers from '@salesforce/apex/TaskCreateHandler.listOfUsers';
import createTaskRecord from '@salesforce/apex/TaskCreateHandler.createTaskRecord';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class TaskCreate extends LightningElement {
    @track userOption = [];
    @track userList;
    @track userId;

    

    @track statusValue = '';
    @track subjectValue='';
    @track priorityValue='';
    @track dueDateValue='';
    @track commentsValue='';
    get optionsStatus() {
        return [
            { label: 'New', value: 'New' },
            { label: 'In Progress', value: 'In Progress' },
            { label: 'Completed', value: 'Completed' },
        ];
    }

    get optionsSubject() {
        return [
            { label: 'Call', value: 'Call' },
            { label: 'Send Letter', value: 'Send Letter' },
            { label: 'Send Quote', value: 'Send Quote' },
            { label: 'Other', value: 'Other' },
        ];
    }

    get optionsPriority() {
        return [
            { label: 'High', value: 'High' },
            { label: 'Normal', value: 'Normal' },
        ];
    }


    handleUser(event) {
        this.userId = event.detail.value;
    }
    handleChange(event) {
        if(event.target.name=='status'){
            this.statusValue = event.detail.value;
        }
        if(event.target.name=='subject'){
            this.subjectValue = event.detail.value;
            console.log('subject'+this.subjectValue);
        }
        if(event.target.name=='priority'){
            this.priorityValue = event.detail.value;
        }
        if(event.target.name=='dueDate'){
            this.dueDateValue = event.detail.value;
        }
        if(event.target.name=='comments'){
            this.commentsValue = event.detail.value;
        } 
        
    }
    @api
     createTask(){
        console.log('calling method')
        if(!this.userId){
            const event = new ShowToastEvent({
                title: 'Error',
                message: 'Please select the user',
                variant: 'error'
            });
            this.dispatchEvent(event);
            return;
        }
        else{
        
    
        createTaskRecord({userId:this.userId,statusValue:this.statusValue,
                        subjectValue:this.subjectValue,priorityValue:this.priorityValue,
                        dueDateValue:this.dueDateValue,commentsValue:this.commentsValue}).then(response=>{
                            console.log('created Task');
                            
                    
                        })
                        this.dispatchEvent(
                            new ShowToastEvent({
                              title: 'Success',
                              message: 'Task Created succesfully',
                              variant: 'success'
                            })
                          );
                          
                    }
    }

    connectedCallback() {
        listOfUsers().then(response => {
            console.log('response >>',response);
            this.userList = response;
            console.log('this.userList >>',this.userList);
            this.userOption = response.map(record => ({ value: record.Id, label: record.Full_Name__c }))

        }).catch(err => {
            console.log(err);
        });

    }
}