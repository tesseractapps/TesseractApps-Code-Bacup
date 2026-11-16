import { LightningElement,track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation'; 
import getEmployee from '@salesforce/apex/SearchEmployeeHandler.getEmployee';
import FORM_FACTOR from '@salesforce/client/formFactor';
import { refreshApex } from '@salesforce/apex';

const columns = [ 
         
    {
        label: 'First Name',
        fieldName: 'fname',
        type: 'url',
        typeAttributes: {label: { fieldName: 'Name__c' }, target: '_self'}
    },
    
    { label: 'Last Name', fieldName: 'Last_Name__c'},
    { label: 'Contact Number', fieldName: 'Contact_Number__c'},
    { label: 'Email Address', fieldName: 'Email_Address__c'},
     
]   

export default class SearchEmployee extends LightningElement {

    @track fname='';
    @track lname='';
    @track phone='';
    @track email='';
    @track availableIssues;
    @track refreshTable=[];
    initialRecords;
    error;
    columns = columns;
    availableIssues;
    searchString;
    totalRecords=0;
    pageSize;
    pageNumber = 1;

    connectedCallback(){
        let listOfsearchString=[];
        getEmployee({listOfsearchString: JSON.stringify(listOfsearchString)})
                    .then(response=>{
                        this.refreshTable = response;                       
                        this.handleResponseData(response);
                        refreshApex(this.refreshTable);
                      
        }).catch(err => {
            console.log('Oh noooo!!');
            console.log(err);
            alert(err);
        });
    }

    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }
    handleResponseData(responseValue){
        if ( responseValue) {
            let tempConList = []; 
            
            responseValue.forEach((record) => {
                let tempConRec = Object.assign({}, record);  
              
                tempConRec.fname = '/' + tempConRec.Id;
                tempConList.push(tempConRec);
                
            });
            //this.availableIssues = tempConList;
            console.log('tempConList>>>>',JSON.stringify(tempConList));          
            this.initialRecords = tempConList;
            console.log('initialRecords>>>>',JSON.stringify(this.initialRecords));
            this.totalRecords=responseValue.length;
            this.pageSize=5;
            this.error = undefined;
            this.paginationHelper();
        }
    }

    handleRecordsPerPage(event) {
        this.pageSize = event.target.value;
        this.paginationHelper();
    }
    previousPage() {
        this.pageNumber = this.pageNumber - 1;
        this.paginationHelper();
    }
    nextPage() {
        this.pageNumber = this.pageNumber + 1;
        this.paginationHelper();
    }
    firstPage() {
        this.pageNumber = 1;
        this.paginationHelper();
    }
    lastPage() {
        this.pageNumber = this.totalPages;
        this.paginationHelper();
    }
    get isDesktop() {
        //alert(FORM_FACTOR);
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        return FORM_FACTOR === 'Small';
    }

    paginationHelper() {
        this.availableIssues = [];
        // calculate total pages
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        // set page number 
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
        // set records to display on current page 
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
                break;
            }
            this.availableIssues.push(this.initialRecords[i]);
        }
        refreshApex(this.refreshTable); 
        
    }

    handleClear(){
        let listOfsearchString=[];
        this.fname='';
        this.lname='';
        this.phone='';
        this.email='';
        
        getEmployee({listOfsearchString: JSON.stringify(listOfsearchString)})
                    .then(response=>{
                        this.refreshTable = response;
                        this.handleResponseData(response);
                        refreshApex(this.refreshTable);
                      
    });
        
    }

    handleSearch(event){
        console.log(event.target.label);
        var inp=this.template.querySelectorAll("lightning-input");
        let listOfsearchString=[];
        
        inp.forEach(function(element){
            listOfsearchString.push(element.value)
            if(element.name=="fname"){
                this.fname=element.value;
                console.log("fname>>>", this.fname);
            }

            else if(element.name=="lname")
                this.lname=element.value;

            else if(element.name=="phone")
                this.phone=element.value;

            else if(element.name=="email")
                this.email=element.value;
        },this);

        getEmployee({listOfsearchString: JSON.stringify(listOfsearchString)})
                    .then(response=>{
                        this.refreshTable = response;
                        this.handleResponseData(response)
    });
}
}