import { LightningElement, api, track } from 'lwc';

export default class TesseractAppsMultiCombobox extends LightningElement {

    @api label;
    @api placeholder = 'Select';
    @api options = [];

    @track isOpen = false;
    @track searchKey = '';
    @track focusedIndex = -1;

    _value = [];

    @api
    get value() {
        return this._value;
    }

    connectedCallback() {
        window.addEventListener('click', this.handleOutsideClick, true);
    }

    disconnectedCallback() {
        window.removeEventListener('click', this.handleOutsideClick, true);
    }

    handleOutsideClick = (event) => {

        const path = event.composedPath();

        if (path.includes(this.template.host)) return;

        this.isOpen = false;
        this.searchKey = '';
    };

    toggleDropdown(event) {

        event.stopPropagation();

        this.isOpen = !this.isOpen;
        this.focusedIndex = -1;
    }

    handleSearch(event) {

        const value = event.target.value || '';

        this.searchKey = value.toLowerCase().trim();

        this.focusedIndex = -1;
    }

    get filteredOptions() {

        let list = this.options;

        // Apply search
        if (this.searchKey) {
                list = this.options.filter(o => {
                    const label = (o.label || '').toLowerCase();
                    return label.includes(this.searchKey);
                });

            // No results case
            if (list.length === 0) {
                return [{
                    label: 'No Results Found',
                    value: 'no-results',
                    checked: false,
                    disabled: true,
                    id: 'no-results',
                    className: 'slds-listbox__item no-results'
                }];
            }

            // When searching → DO NOT show Select All
            return list.map((o, index) => ({
                ...o,
                checked: this._value.includes(o.value),
                id: `option-${index}`,
                className:
                    this.focusedIndex === index
                        ? 'slds-listbox__item slds-has-focus'
                        : 'slds-listbox__item'
            }));
        }

        // When NOT searching → show Select All
        const selectAllOption = {
            label: 'Select All',
            value: '__all__'
        };

        list = [selectAllOption, ...list];

        return list.map((o, index) => {

            const checked =
                o.value === '__all__'
                    ? this._value.length === this.options.length
                    : this._value.includes(o.value);

            return {
                ...o,
                checked,
                id: `option-${index}`,
                className:
                    this.focusedIndex === index
                        ? 'slds-listbox__item slds-has-focus'
                        : 'slds-listbox__item'
            };
        });
    }

    handleSelect(event) {

        event.stopPropagation();

        const value = event.currentTarget.dataset.value;

        // prevent clicking "No Results Found"
        if (value === 'no-results') {
            return;
        }

        let values = [...this._value];

        if (value === '__all__') {

            if (values.length === this.options.length) {
                values = [];
            } else {
                values = this.options.map(o => o.value);
            }

        } else {

            if (values.includes(value)) {
                values = values.filter(v => v !== value);
            } else {
                values.push(value);
            }
        }

        this._value = values;

        this.dispatchEvent(
            new CustomEvent('change', {
                detail: { value: [...values] }
            })
        );
    }

    handleCheckbox(event) {

        event.stopPropagation();

        const value = event.target.dataset.value;

        this.handleSelect({
            currentTarget: {
                dataset: { value }
            },
            stopPropagation: () => {}
        });
    }

    stopPropagation(event) {
        event.stopPropagation();
    }

    get displayValue() {

        if (!this._value.length) return '';

        const labels = this.options
            .filter(o => this._value.includes(o.value))
            .map(o => o.label);

        return labels.join(', ');
    }

    get comboboxClass() {

        return `slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ${
            this.isOpen ? 'slds-is-open' : ''
        }`;
    }

    get activeDescendant() {

        if (this.focusedIndex < 0) return null;

        return `option-${this.focusedIndex}`;
    }

    handleKeyDown(event) {

        const list = this.filteredOptions;

        if (!list.length) return;

        if (event.key === 'ArrowDown') {

            event.preventDefault();

            this.focusedIndex =
                this.focusedIndex < list.length - 1
                    ? this.focusedIndex + 1
                    : 0;
        }

        if (event.key === 'ArrowUp') {

            event.preventDefault();

            this.focusedIndex =
                this.focusedIndex > 0
                    ? this.focusedIndex - 1
                    : list.length - 1;
        }

        if (event.key === 'Enter') {

            if (this.focusedIndex >= 0) {

                const option = list[this.focusedIndex];

                this.handleSelect({
                    currentTarget: {
                        dataset: { value: option.value }
                    },
                    stopPropagation: () => {}
                });
            }
        }

        if (event.key === 'Escape') {
            this.isOpen = false;
        }
        if (event.key === ' ') {

            event.preventDefault();

            if (this.focusedIndex >= 0) {

                const option = list[this.focusedIndex];

                this.handleSelect({
                    currentTarget: {
                        dataset: { value: option.value }
                    },
                    stopPropagation: () => {}
                });
            }
        }
        setTimeout(() => {

            const focused = this.template.querySelector('.slds-has-focus');

            if (focused) {
                focused.scrollIntoView({
                    block: 'nearest'
                });
            }

        });        
    }




    set value(val) {

        if (!val) {
            this._value = [];
            return;
        }

        // handle string values (Salesforce multi picklist format)
        if (typeof val === 'string') {

            if (val.includes(';')) {
                this._value = val.split(';');
            }
            else if (val.includes(',')) {
                this._value = val.split(',');
            }
            else {
                this._value = [val];
            }

        } 
        else if (Array.isArray(val)) {

            this._value = [...val];

        }
    }
}