import { LightningElement, track , api} from 'lwc';
import createEmployeeRecord from '@salesforce/apex/EmployeeManagementHandler.createEmployeeRecord';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';

export default class EmpManagement extends LightningElement {

    activeSections = ['EmployeeDetails', 'EmergencyContact','BankDetails','Attachments'];

    strStreet;
    strCity;
    strState;
    strCountry;
    strPostalCode;

    @track selectedEmp;
    @track fname;
    @track lname;
    @track contact;
    @track dob;
    @track email;
    @track etype;
    @track tfn;
    @track abn;
    @track acc;
    @track efname;
    @track elname;
    @track selectedFacility;
    @track relation;
    @track econtact;
    @track eemail;
    @track acname;
    @track acnumber;
    @track bsb;
    @track sname;
    @track snumber;
    @track employeeDetails =[];
    @track facilityOptions;


    get empOptions(){
        return [
            { label: 'Full time', value: 'fulltime' },
            { label: 'Part time', value: 'parttime' },
            { label: 'Casual', value: 'casual' },
        ];
    }
    connectedCallback(){
        getFacilityData({recordId: 'text'}).then(response=>{
            this.facilityList=response;
             this.facilityOptions = response.map(record => ({ value: record.Id, label: record.Name }))                       
      
        }).catch(err => {
            console.log('Oh noooo!!');
            console.log(err);
           });
    }

    addressInputChange( event ) {
                this.strStreet = event.target.street;
                this.strCity =  event.target.city;
                this.strState = event.target.province;
                this.strCountry = event.target.country;
                this.strPostalCode = event.target.postalCode;
        }

    handleChange(event){
        let value = event.detail.value;
        if(event.target.name=='fname'){
            this.fname= event.detail.value;
            console.log('fname>>>>',this.fname);
        }
        
        if(event.target.name=='lname'){
            this.lname= event.detail.value;
           
            console.log('lname>>>>',this.lname);
        }
        if(event.target.name=='facility'){
            this.selectedFacility=event.detail.value;
            console.log('lname>>>>',this.selectedFacility);
        }
       
        if(event.target.name=='contact'){
            this.contact= event.detail.value;
           
            console.log('contact>>>>',this.contact);
        }
        
        if(event.target.name=='dob'){
            this.dob= event.detail.value;
            
            console.log('dob>>>>',this.dob);
        }
       
        if(event.target.name=='email'){
            this.email= event.detail.value;
           
            console.log('email>>>>',this.email);
        }
        
        if(event.target.name=='etype'){
            this.etype= event.detail.value;
           
            console.log('etype>>>>',this.etype);
        }
       
        if(event.target.name=='tfn'){
            this.tfn= event.detail.value;
           
            console.log('tfn>>>>',this.tfn);
        }
       
        if(event.target.name=='abn'){
            this.abn= event.detail.value;
            
            console.log('abn>>>>',this.abn);
        }
        
        if(event.target.name=='acc'){
            this.acc= event.detail.value;
           
            console.log('acc>>>>',this.acc);
        }
       
        if(event.target.name=='efname'){
            this.efname= event.detail.value;
            console.log('efname>>>>',this.efname);
        }
        
        
        if(event.target.name=='elname'){
            this.elname= event.detail.value;
           
            console.log('elname>>>>',this.elname);
        }
        
        if(event.target.name=='relation'){
            this.relation= event.detail.value;
           
            console.log('relation>>>>',this.relation);
        }
        
        if(event.target.name=='econtact'){
            this.econtact= event.detail.value;
            
            console.log('econtact>>>>',this.econtact);
        }
        
        if(event.target.name=='eemail'){
            this.eemail= event.detail.value;
            
            console.log('eemail>>>>',this.eemail);
        }
        
        if(event.target.name=='acname'){
            this.acname= event.detail.value;
           
            console.log('acname>>>>',this.acname);
        }
        
        if(event.target.name=='acnumber'){
            this.acnumber= event.detail.value;
           
            console.log('acnumber>>>>',this.acnumber);
        }
        
        if(event.target.name=='bsb'){
            this.bsb= event.detail.value;
           
            console.log('bsb>>>>',this.bsb);
        }
        
        if(event.target.name=='sname'){
            this.sname= event.detail.value;
            
            console.log('sname>>>>',this.sname);
        }
        
        if(event.target.name=='snumber'){
            this.snumber= event.detail.value;
           
            console.log('snumber>>>>',this.snumber);
        }
        
    }

    @api
    employmeeSaveRecord(){
        this.employeeDetails.push({"fname":this.fname,
                                   "lname":this.lname,
                                   "contact":this.contact,
                                   "email":this.email,
                                   "etype":this.etype,
                                   "dob":this.dob,
                                   "tfn":this.tfn,
                                   "abn":this.abn,
                                   "acc":this.acc,
                                   "efname":this.efname,
                                   "elname":this.elname,
                                   "relation":this.relation,
                                   "econtact":this.econtact,
                                   "eemail":this.eemail,
                                   "acname":this.acname,
                                   "acnumber":this.acnumber,
                                   "bsb":this.bsb,
                                   "sname":this.sname,
                                   "snumber":this.snumber,
                                   "facname":this.selectedFacility,
                                "street":this.strStreet,
                                "city":this.strCity,
                                "state":this.strState,
                                "country":this.strCountry,
                                "postalcode":this.strPostalCode});


        if(this.employeeDetails.length>0){
            console.log('debug child',JSON.stringify(this.employeeDetails));
            createEmployeeRecord({JSONString : JSON.stringify(this.employeeDetails)}).then({
               
            }).catch(err => {
                console.log(err);
            });


          }
        console.log('debug child',JSON.stringify(this.employeeDetails));
    }
}