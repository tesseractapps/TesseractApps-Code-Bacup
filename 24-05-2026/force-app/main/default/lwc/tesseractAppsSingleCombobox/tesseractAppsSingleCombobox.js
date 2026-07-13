import { LightningElement, api, track } from 'lwc';

export default class TesseractAppsSingleCombobox extends LightningElement {

    @api label;
    @api placeholder = 'Select';
    @api options = [];
    @api disabled = false;

    @track isOpen = false;
    @track searchKey = '';
    @track searchKeyLower = '';
    @track focusedIndex = -1;

    _value = null;
    _dropdownPositioned = false; // ✅ ADD    

    // ===== VALUE =====
    @api
    get value() {
        return this._value;
    }

    set value(val) {
        this._value = val;
    }

connectedCallback() {
    window.addEventListener('click', this.handleOutsideClick, true);
    window.addEventListener('scroll', this.handleScrollResize, true); // ✅ ADD
    window.addEventListener('resize', this.handleScrollResize);       // ✅ ADD
}

disconnectedCallback() {
    window.removeEventListener('click', this.handleOutsideClick, true);
    window.removeEventListener('scroll', this.handleScrollResize, true); // ✅ ADD
    window.removeEventListener('resize', this.handleScrollResize);        // ✅ ADD
}

// ✅ ADD entire method
renderedCallback() {
    // if (this.isOpen && !this._dropdownPositioned) {
    //     this._dropdownPositioned = true;
    //     this.positionDropdown();
    // }

    if (this.isOpen) {
        // Remove _dropdownPositioned flag entirely, always reposition
        setTimeout(() => this.positionDropdown(), 0);
    }

    if (!this.isOpen) {
        this._dropdownPositioned = false;
    }
}
    handleOutsideClick = (event) => {
        const path = event.composedPath();

        if (path.includes(this.template.host)) return;

        this.isOpen = false;
        this.searchKey = '';
        this.searchKeyLower = '';
    };

    // ===== UI =====
    // toggleDropdown(event) {
    //     event.stopPropagation();
    //     this.isOpen = !this.isOpen;
    //     this.focusedIndex = -1;
    // }

toggleDropdown(event) {
    event.stopPropagation();
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    this.focusedIndex = -1;
    if (this.isOpen) {
        // Extra safety: position after LWC re-renders
        Promise.resolve().then(() => setTimeout(() => this.positionDropdown(), 0));
    }
}    

    handleSearch(event) {
        const value = event.target.value || '';
        this.searchKey = value;
        this.searchKeyLower = value.toLowerCase().trim();
        this.focusedIndex = -1;
    }

    // ===== OPTIONS =====
    get filteredOptions() {

        let list = this.options;

        if (this.searchKeyLower) {
            list = list.filter(o =>
                (o.label || '').toLowerCase().includes(this.searchKeyLower)
            );
        }

        if (!list.length) {
            return [{
                label: 'No Results Found',
                value: 'no-results',
                disabled: true,
                className: 'slds-listbox__item no-results'
            }];
        }

        return list.map((o, index) => {

            const isSelected = this._value === o.value;

            return {
                ...o,
                selected: isSelected,
                className: [
                    'slds-listbox__item',
                    this.focusedIndex === index ? 'slds-has-focus' : '',
                    isSelected ? 'selected-item' : ''
                ].filter(Boolean).join(' ')
            };
        });
    }

    // ===== SELECT =====
    handleOptionClick(event) {

        event.stopPropagation();

        const value = event.currentTarget.dataset.value;

        if (value === 'no-results') return;

        this._value = value;

       this.dispatchEvent(
            new CustomEvent('change', {
                detail: { value },
                 field: 'facility' , 
                bubbles: true,
                composed: true
            })
        );

        this.isOpen = false;
    }

    // ===== DISPLAY =====
    get displayValue() {

        if (!this._value) return '';

        const selected = this.options.find(o => o.value === this._value);
        return selected ? selected.label : '';
    }

    get comboboxClass() {
        return `slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ${
            this.isOpen ? 'slds-is-open' : ''
        }`;
    }

    stopPropagation(event) {
        event.stopPropagation();
    }

    // ===== KEYBOARD =====
    handleKeyDown(event) {

        const list = this.filteredOptions;

        if (!list.length) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.focusedIndex =
                this.focusedIndex < list.length - 1
                    ? this.focusedIndex + 1
                    : 0;

            this.scrollToFocused();
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.focusedIndex =
                this.focusedIndex > 0
                    ? this.focusedIndex - 1
                    : list.length - 1;

            this.scrollToFocused();
        }

        if (event.key === 'Enter') {
            event.preventDefault();

            let index = this.focusedIndex;
            if (index < 0) index = 0;

            const option = list[index];

            if (option && option.value !== 'no-results') {

                this._value = option.value;
                    this.dispatchEvent(
                        new CustomEvent('change', {
                            detail: { value: option.value },
                             field: 'facility',
                            bubbles: true,
                            composed: true
                        })
                    );

                this.isOpen = false;
            }
        }

        if (event.key === 'Escape') {
            this.isOpen = false;
        }
    }

    scrollToFocused() {
        setTimeout(() => {
            const focused = this.template.querySelector('.slds-has-focus');
            if (focused) {
                focused.scrollIntoView({ block: 'nearest' });
            }
        });
    }
// ✅ ADD — reposition on scroll/resize
handleScrollResize = () => {
    if (this.isOpen) this.positionDropdown();
};

// ✅ ADD — core fix: calculates fixed position from trigger's screen coords
// positionDropdown() {
//     const trigger = this.template.querySelector('.slds-combobox__form-element');
//     const dropdown = this.template.querySelector('.dropdown-fixed');
//     if (!trigger || !dropdown) return;

//     const rect = trigger.getBoundingClientRect();
//     const spaceBelow = window.innerHeight - rect.bottom;
//     const spaceAbove = rect.top;
//     const dropdownHeight = 260;

//     // Flip above trigger if not enough space below
//     const top = (spaceBelow < dropdownHeight && spaceAbove > spaceBelow)
//         ? rect.top - dropdownHeight
//         : rect.bottom;

//     dropdown.style.position = 'fixed';
//     dropdown.style.top    = `${top}px`;
//     dropdown.style.width  = `${rect.width}px`;
//     dropdown.style.zIndex = '9002';
// }

positionDropdown() {
    const trigger = this.template.querySelector('.slds-combobox__form-element');
    const dropdown = this.template.querySelector('.dropdown-fixed');
    if (!trigger || !dropdown) return;

    const rect = trigger.getBoundingClientRect();
    
    // ✅ Use actual rendered height, fallback 260
    const dropdownHeight = dropdown.offsetHeight || 260;
    
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const top = (spaceBelow < dropdownHeight && spaceAbove > spaceBelow)
        ? rect.top - dropdownHeight
        : rect.bottom;

    dropdown.style.position = 'fixed';
    dropdown.style.top    = `${top}px`;
    // dropdown.style.left   = `${rect.left}px`;
    dropdown.style.width  = `${rect.width}px`;
    dropdown.style.zIndex = '9002';
}
get triggerClass() {
    return `slds-combobox__form-element slds-input-has-icon slds-input-has-icon_right${
        this.disabled ? ' combobox-disabled' : ''
    }`;
}
}