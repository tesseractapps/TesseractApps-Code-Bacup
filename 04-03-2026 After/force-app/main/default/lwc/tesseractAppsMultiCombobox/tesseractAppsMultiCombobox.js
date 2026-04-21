import { LightningElement, api, track } from 'lwc';

export default class TesseractAppsMultiCombobox extends LightningElement {

    @api label;
    @api required = false;
    @api options = [];

    _value = [];

    @api
    get value() {
        return this._value;
    }
    set value(val) {
        this._value = Array.isArray(val) ? [...val] : [];
    }

    @track isOpen = false;
    @track searchKey = '';

    connectedCallback() {
        window.addEventListener('click', this.handleOutsideClick, true);
    }

    disconnectedCallback() {
        window.removeEventListener('click', this.handleOutsideClick, true);
    }

    handleOutsideClick = (event) => {

        if (!this.isOpen) return;

        const path = event.composedPath();

        if (path.includes(this.template.host)) {
            return;
        }

        this.isOpen = false;
        this.searchKey = '';
    };

    openDropdown() {
        this.isOpen = true;
    }

    handleSearch(event) {
        this.searchKey = event.target.value.toLowerCase();
        this.isOpen = true;
    }

    get computedOptions() {

        let filteredOptions = this.options;

        if (this.searchKey) {
            filteredOptions = this.options.filter(opt =>
                opt.label.toLowerCase().includes(this.searchKey)
            );
        }

        const allSelected =
            this.options.length > 0 &&
            this._value.length === this.options.length;

        const selectAllOption = {
            label: 'Select All',
            value: '__all__',
            checked: allSelected
        };

        const mapped = filteredOptions.map(opt => ({
            ...opt,
            checked: this._value.includes(opt.value)
        }));

        return [selectAllOption, ...mapped];
    }

    handleSelect(event) {

        // Support both real checkbox event
        // and manually triggered row toggle
        const value = event.target.value;
        let checked = event.target.checked;

        let newValues = [...this._value];

        // ============================
        // SELECT ALL
        // ============================
        if (value === '__all__') {

            if (checked) {
                newValues = this.options.map(o => o.value);
            } else {
                newValues = [];
            }

        } else {

            // If checkbox was clicked normally
            if (typeof checked === 'boolean') {

                if (checked) {
                    if (!newValues.includes(value)) {
                        newValues.push(value);
                    }
                } else {
                    newValues = newValues.filter(v => v !== value);
                }

            } 
            // If row click toggled manually
            else {

                if (newValues.includes(value)) {
                    newValues = newValues.filter(v => v !== value);
                } else {
                    newValues.push(value);
                }
            }
        }

        this._value = newValues;

        this.dispatchEvent(
            new CustomEvent('change', {
                detail: { value: this._value }
            })
        );
    }

    get inputValue() {
        if (this.searchKey) return this.searchKey;

        if (!this._value.length) return '';

        const labels = this.options
            .filter(opt => this._value.includes(opt.value))
            .map(opt => opt.label);

        return labels.join(', ');
    }

    get comboboxClass() {
        return `slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ${
            this.isOpen ? 'slds-is-open' : ''
        }`;
    }

    handleRowClick(event) {

        const value = event.currentTarget.dataset.value;

        // find checkbox inside clicked row
        const checkbox = event.currentTarget.querySelector(
            'lightning-input'
        );

        if (!checkbox) return;

        // toggle checkbox
        checkbox.checked = !checkbox.checked;

        // trigger same logic
        this.handleSelect({
            target: checkbox
        });
    }    
}