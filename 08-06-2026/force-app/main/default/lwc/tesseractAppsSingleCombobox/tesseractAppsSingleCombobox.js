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
    _dropdownPositioned = false;
    _animationFrameId = null;
    _lastRect = null;

    // ===== VALUE =====
    @api
    get value() {
        return this._value;
    }

    set value(val) {
        this._value = val;
    }

// connectedCallback() {
//     window.addEventListener('click', this.handleOutsideClick, true);
//     window.addEventListener('scroll', this.handleScrollResize, true); // ✅ ADD
//     window.addEventListener('resize', this.handleScrollResize);       // ✅ ADD
// }

// disconnectedCallback() {
//     window.removeEventListener('click', this.handleOutsideClick, true);
//     window.removeEventListener('scroll', this.handleScrollResize, true); // ✅ ADD
//     window.removeEventListener('resize', this.handleScrollResize);        // ✅ ADD
// }

// // ✅ ADD entire method
// renderedCallback() {
//     // if (this.isOpen && !this._dropdownPositioned) {
//     //     this._dropdownPositioned = true;
//     //     this.positionDropdown();
//     // }

//     if (this.isOpen) {
//         // Remove _dropdownPositioned flag entirely, always reposition
//         setTimeout(() => this.positionDropdown(), 0);
//     }

//     if (!this.isOpen) {
//         this._dropdownPositioned = false;
//     }
// }

connectedCallback() {
    window.addEventListener('click', this.handleOutsideClick, true);
    window.addEventListener('resize', this.handleScrollResize);
}

disconnectedCallback() {
    window.removeEventListener('click', this.handleOutsideClick, true);
    window.removeEventListener('resize', this.handleScrollResize);
    this.stopPositioningLoop();
}

renderedCallback() {
    if (this.isOpen) {
        this.startPositioningLoop();
    } else {
        this.stopPositioningLoop();
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
    // if (this.isOpen) {
    //     // Extra safety: position after LWC re-renders
    //     Promise.resolve().then(() => setTimeout(() => this.positionDropdown(), 0));
    // }
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

// positionDropdown() {
//     const trigger = this.template.querySelector('.slds-combobox__form-element');
//     const dropdown = this.template.querySelector('.dropdown-fixed');
//     if (!trigger || !dropdown) return;

//     const rect = trigger.getBoundingClientRect();
    
//     // ✅ Use actual rendered height, fallback 260
//     const dropdownHeight = dropdown.offsetHeight || 260;
    
//     const spaceBelow = window.innerHeight - rect.bottom;
//     const spaceAbove = rect.top;

//     const top = (spaceBelow < dropdownHeight && spaceAbove > spaceBelow)
//         ? rect.top - dropdownHeight
//         : rect.bottom;

//     dropdown.style.position = 'fixed';
//     dropdown.style.top    = `${top}px`;
//     // dropdown.style.left   = `${rect.left}px`;
//     dropdown.style.width  = `${rect.width}px`;
//     dropdown.style.zIndex = '9002';
// }


startPositioningLoop() {
    if (!this._animationFrameId) {
        this._lastRect = null; // Reset cache
        this.updatePositionLoop();
    }
}

stopPositioningLoop() {
    if (this._animationFrameId) {
        cancelAnimationFrame(this._animationFrameId);
        this._animationFrameId = null;
    }
}

updatePositionLoop = () => {
    if (this.isOpen) {
        this.positionDropdown();
        this._animationFrameId = requestAnimationFrame(this.updatePositionLoop);
    } else {
        this.stopPositioningLoop();
    }
};

positionDropdown() {
    const trigger = this.template.querySelector('.slds-combobox__form-element');
    const dropdown = this.template.querySelector('.dropdown-fixed');
    if (!trigger || !dropdown) return;

    const rect = trigger.getBoundingClientRect();

    // If the trigger has been scrolled completely out of view, close the dropdown
    const isTriggerVisible = rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0;
    if (!isTriggerVisible) {
        this.isOpen = false;
        return;
    }

    // Get offset parent coordinates if it is not BODY or HTML (e.g. inside a transformed modal or absolute container)
    let parentLeft = 0;
    let parentTop = 0;
    const offsetParent = dropdown.offsetParent;
    if (offsetParent && offsetParent.tagName !== 'BODY' && offsetParent.tagName !== 'HTML') {
        const parentRect = offsetParent.getBoundingClientRect();
        parentLeft = parentRect.left;
        parentTop = parentRect.top;
    }

    const dropdownHeight = dropdown.offsetHeight || 260;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const calculatedTop = (spaceBelow < dropdownHeight && spaceAbove > spaceBelow)
        ? rect.top - dropdownHeight
        : rect.bottom;

    const finalTop = calculatedTop - parentTop;
    const finalLeft = rect.left - parentLeft;

    // Check if position or dimensions changed to prevent unnecessary writes
    if (this._lastRect && 
        this._lastRect.top === finalTop && 
        this._lastRect.left === finalLeft && 
        this._lastRect.width === rect.width &&
        this._lastRect.height === rect.height) {
        return;
    }
    
    this._lastRect = {
        top: finalTop,
        left: finalLeft,
        width: rect.width,
        height: rect.height
    };

    dropdown.style.position = 'fixed';
    dropdown.style.top    = `${finalTop}px`;
    dropdown.style.left   = `${finalLeft}px`;
    dropdown.style.width  = `${rect.width}px`;
    dropdown.style.zIndex = '9002';
}


get triggerClass() {
    return `slds-combobox__form-element slds-input-has-icon slds-input-has-icon_right${
        this.disabled ? ' combobox-disabled' : ''
    }`;
}
}