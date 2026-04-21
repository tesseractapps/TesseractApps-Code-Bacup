import { LightningElement, api, track } from 'lwc';

export default class TesseractAppsPrimaryMultiCombobox extends LightningElement {

    @api label;
    @api placeholder = 'Select';
    @api options = [];
    @api hideLabel = false;
    @api required = false;

    /* dynamic field mapping */
    @api labelField = 'label';
    @api subLabelField = 'facilityName';
    @api badgeField = 'type';
    @api valueField = 'value';

    @track isOpen = false;
    @track selectedValues = [];
    @track searchKey = '';
    @track searchKeyLower = '';  // for filtering
    @track focusedIndex = -1;

    _primaryValue;

    /* supports create + edit */
    @api
    set value(val){
        this.selectedValues = val ? [...val] : [];
    }
    get value(){
        return this.selectedValues;
    }

    @api
    set primaryValue(val){
        this._primaryValue = val;
    }
    get primaryValue(){
        return this._primaryValue;
    }

    connectedCallback(){
        window.addEventListener('click', this.handleOutsideClick);
    }

    disconnectedCallback(){
        window.removeEventListener('click', this.handleOutsideClick);
    }

    handleOutsideClick = (event)=>{
        const path = event.composedPath();
        if(path.includes(this.template.host)) return;

        this.isOpen = false;

        // 🔥 RESET EVERYTHING
        this.searchKey = '';
        this.searchKeyLower = '';
        this.focusedIndex = -1;
    }

    toggleDropdown(event){
        event.stopPropagation();

        this.isOpen = !this.isOpen;

        this.focusedIndex = -1;

        if(this.isOpen){
            this.searchKey = '';
            this.searchKeyLower = '';
        }
    }

    // handleSelect(event){

    //     const value = event.target.dataset.value;

    //     if(this.selectedValues.includes(value)){

    //         this.selectedValues =
    //             this.selectedValues.filter(v => v !== value);

    //         if(this._primaryValue === value){
    //             this._primaryValue = null;
    //         }

    //     }else{

    //         this.selectedValues = [...this.selectedValues,value];

    //         if(!this._primaryValue){
    //             this._primaryValue = value;
    //         }

    //     }

    // }



    handleSelect(event){

        const value = event.target.dataset.value;

        if(this.selectedValues.includes(value)){

            this.selectedValues =
                this.selectedValues.filter(v => v !== value);

            if(this._primaryValue === value){
                this._primaryValue = null;
            }

        }else{

            this.selectedValues = [...this.selectedValues,value];

            if(!this._primaryValue){
                this._primaryValue = value;
            }

        }

        /* 🔹 APPLY AUTOMATICALLY */
        this.dispatchEvent(
            new CustomEvent('change',{
                detail:{
                    values:this.selectedValues,
                    primary:this._primaryValue
                }
            })
        );

    }


    // setPrimary(event){

    //     event.stopPropagation();

    //     const value = event.target.dataset.value;

    //     this._primaryValue = value;

    // }


    setPrimary(event){

        event.stopPropagation();

        const value = event.target.dataset.value;

        this._primaryValue = value;

        this.dispatchEvent(
            new CustomEvent('change',{
                detail:{
                    values:this.selectedValues,
                    primary:this._primaryValue
                }
            })
        );

    }

    // handleApply(){

    //     this.dispatchEvent(
    //         new CustomEvent('change',{
    //             detail:{
    //                 values:this.selectedValues,
    //                 primary:this._primaryValue
    //             }
    //         })
    //     );

    //     this.isOpen = false;

    // }

    /* build dropdown options dynamically */
    get optionsComputed(){

        const selected = this.selectedValues || [];

        return (this.options || []).map(opt =>{

            const value = opt[this.valueField];

            return {

                label: opt[this.labelField],
                subLabel: opt[this.subLabelField],
                badge: opt[this.badgeField],

                value: value,

                checked: selected.includes(value),

                isPrimary: this._primaryValue === value

            };

        });

    }

    /* display selected values */
    // get displayValue(){

    //     if(!this.selectedValues.length) return '';

    //     const labels = (this.options || [])
    //         .filter(o => this.selectedValues.includes(o[this.valueField]))
    //         .map(o => o[this.labelField]);

    //     return labels.join(', ');

    // }

    get displayValue(){

        if(!this.selectedValues.length) return '';

        const labels = (this.options || [])
            .filter(o => this.selectedValues.includes(o[this.valueField]))
            .map(o => {

                const main = o[this.labelField];
                const sub = o[this.subLabelField];

                return sub ? `${main} - ${sub}` : main;

            });

        return labels.join(', ');

    }


    get comboboxClass(){

        return `slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ${
            this.isOpen ? 'slds-is-open' : ''
        }`;

    }

    get noRecordsMessage(){

        if(!this.label){
            return 'No Records Found';
        }

        return `No ${this.label} Found`;

    }

    handleCheckbox(event){

        event.stopPropagation();

        const value = event.target.dataset.value;

        // 🔥 Route through SAME logic as row click
        this.handleSelect({
            target: {
                dataset: { value }
            }
        });
    }    

    // handleSearch(event){
    //     this.searchKey = (event.target.value || '').toLowerCase();
    // }

    handleSearch(event){

        const value = event.target.value || '';

        // ✅ keep original casing for UI
        this.searchKey = value;

        // ✅ use lowercase ONLY for filtering
        this.searchKeyLower = value.toLowerCase();
    }    


    // handleOptionClick(event){

    //     event.stopPropagation();

    //     const index = Number(event.currentTarget.dataset.index);

    //     this.focusedIndex = index;

    //     this.handleSelect({
    //         target: {
    //             dataset: { value: event.currentTarget.dataset.value }
    //         }
    //     });
    // }


    handleOptionClick(event){

        event.stopPropagation();

        // 🔥 IGNORE checkbox clicks
        if(event.target.tagName === 'INPUT'){
            return;
        }

        const index = Number(event.currentTarget.dataset.index);

        this.focusedIndex = index;

        this.handleSelect({
            target: {
                dataset: { value: event.currentTarget.dataset.value }
            }
        });
    }    

    handleKeyDown(event){

        const isSearchInput =
            event.target.tagName === 'INPUT';

        // ✅ allow typing in search
        if(isSearchInput && !['ArrowDown','ArrowUp','Enter','Escape'].includes(event.key)){
            return;
        }

        const list = this.filteredOptions;

        if (!list.length) return;

        // Arrow Down
        if (event.key === 'ArrowDown') {
            event.preventDefault();

            this.focusedIndex =
                this.focusedIndex < list.length - 1
                    ? this.focusedIndex + 1
                    : 0;

            this.scrollToFocused();
            return;
        }

        // Arrow Up
        if (event.key === 'ArrowUp') {
            event.preventDefault();

            this.focusedIndex =
                this.focusedIndex > 0
                    ? this.focusedIndex - 1
                    : list.length - 1;

            this.scrollToFocused();
            return;
        }

        // Enter
        if (event.key === 'Enter') {

            event.preventDefault();   // 🔥 THIS FIXES FORM SUBMIT
            event.stopPropagation();  // 🔥 extra safety

            let index = this.focusedIndex < 0 ? 0 : this.focusedIndex;

            const option = list[index];

            if(option){
                this.handleSelect({
                    target: {
                        dataset: { value: option.value }
                    }
                });
            }

            return;
        }

        // Escape
        if (event.key === 'Escape') {
            this.isOpen = false;
            this.searchKey = '';
            this.searchKeyLower = '';
            this.focusedIndex = -1;
        }
    }  



    scrollToFocused(){
        setTimeout(() => {
            const focused = this.template.querySelector('.slds-has-focus');
            if (focused) {
                focused.scrollIntoView({ block: 'nearest' });
            }
        });
    }
    // get filteredOptions(){

    //     const key = this.searchKeyLower;

    //     if(!key){
    //         return this.optionsComputed;
    //     }

    //     return this.optionsComputed.filter(opt =>{

    //         const label = (opt.label || '').toLowerCase();
    //         const sub = (opt.subLabel || '').toLowerCase();

    //         return label.includes(key) || sub.includes(key);

    //     });

    // }
    
    // get filteredOptions(){

    //     const key = this.searchKeyLower;

    //     if(!key){
    //         return this.optionsComputed;
    //     }

    //     return this.optionsComputed.filter(opt =>{

    //         const label = (opt.label || '').toLowerCase();
    //         const sub = (opt.subLabel || '').toLowerCase();

    //         return label.includes(key) || sub.includes(key);

    //     });

    // } 
    
    
    get filteredOptions(){

        const key = this.searchKeyLower;
        let list = this.optionsComputed;

        if(key){
            list = list.filter(opt =>{
                const label = (opt.label || '').toLowerCase();
                const sub = (opt.subLabel || '').toLowerCase();
                return label.includes(key) || sub.includes(key);
            });
        }

        return list.map((opt, index) => ({
            ...opt,
            index,
            className:
                this.focusedIndex === index
                    ? 'option-row slds-has-focus'
                    : 'option-row'
        }));
    }    
}