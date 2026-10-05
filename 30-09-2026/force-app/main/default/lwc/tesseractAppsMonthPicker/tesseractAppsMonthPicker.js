import { LightningElement, api, track } from 'lwc';

export default class TesseractAppsMonthPicker extends LightningElement {

_value;

@api
set value(val) {
    if (!val) return;

    this._value = val;

    this.currentDate = new Date(val);
    this.pickerYear = this.currentDate.getFullYear();
    this.focusedMonth = this.currentDate.getMonth();
}

    @api min;
    @api max;
    

    @track showDropdown = false;
    @track pickerYear;

    currentDate;
    focusedMonth = 0;

    monthsList = [
        { label: 'Jan', value: 0 },
        { label: 'Feb', value: 1 },
        { label: 'Mar', value: 2 },
        { label: 'Apr', value: 3 },
        { label: 'May', value: 4 },
        { label: 'Jun', value: 5 },
        { label: 'Jul', value: 6 },
        { label: 'Aug', value: 7 },
        { label: 'Sep', value: 8 },
        { label: 'Oct', value: 9 },
        { label: 'Nov', value: 10 },
        { label: 'Dec', value: 11 }
    ];

    

    // connectedCallback() {
    //     this.initialize();
    // }

    // initialize() {
    //     this.currentDate = this.value ? new Date(this.value) : new Date();
    //     this.pickerYear = this.currentDate.getFullYear();
    //     this.focusedMonth = this.currentDate.getMonth();
    // }


    initialize() {
        if (!this._value) {
            this.currentDate = new Date();
            this.pickerYear = this.currentDate.getFullYear();
            this.focusedMonth = this.currentDate.getMonth();
        }
    }
    
    get displayValue() {
        return this.currentDate.toLocaleString('default', {
            month: 'short',
            year: 'numeric'
        });
    }

    get computedMonths() {
        const currentMonth = this.currentDate.getMonth();
        const currentYear = this.currentDate.getFullYear();

        return this.monthsList.map(m => {
            const isSelected =
                m.value === currentMonth &&
                this.pickerYear === currentYear;

            const isDisabled = this.isMonthDisabled(m.value);
            const isFocused = this.focusedMonth === m.value;

            let cls = 'month-item';
            if (isSelected) cls += ' selected';
            if (isDisabled) cls += ' disabled';
            if (isFocused) cls += ' focused';

            return {
                ...m,
                class: cls
            };
        });
    }

    isMonthDisabled(month) {
        if (!this.min && !this.max) return false;

        const date = new Date(this.pickerYear, month, 1);

        if (this.min && date < new Date(this.min)) return true;
        if (this.max && date > new Date(this.max)) return true;

        return false;
    }

    // 🔥 FIX: STOP BUBBLING
    stopPropagation(event) {
        event.stopPropagation();
    }

    toggleDropdown(event) {
        event.stopPropagation(); // 🔥 CRITICAL FIX
        this.showDropdown = !this.showDropdown;
    }

    prevYear() {
        this.pickerYear--;
    }

    nextYear() {
        this.pickerYear++;
    }

    handleSelect(event) {
        const month = parseInt(event.currentTarget.dataset.month, 10);

        if (this.isMonthDisabled(month)) return;

        this.selectMonth(month);
    }

    selectMonth(month) {
        this.currentDate = new Date(this.pickerYear, month, 1);
        this.focusedMonth = month;
        this.showDropdown = false;

        this.dispatchEvent(new CustomEvent('change', {
            detail: { value: this.currentDate }
        }));
    }

    goToToday() {
        const today = new Date();
        this.currentDate = today;
        this.pickerYear = today.getFullYear();
        this.focusedMonth = today.getMonth();
        this.showDropdown = false;

        this.dispatchEvent(new CustomEvent('change', {
            detail: { value: today }
        }));
    }

    handleKeyDown(event) {
        if (!this.showDropdown && event.key === 'Enter') {
            this.showDropdown = true;
            return;
        }

        switch (event.key) {
            case 'ArrowRight':
                this.focusedMonth = (this.focusedMonth + 1) % 12;
                break;
            case 'ArrowLeft':
                this.focusedMonth = (this.focusedMonth + 11) % 12;
                break;
            case 'ArrowDown':
                this.focusedMonth = (this.focusedMonth + 3) % 12;
                break;
            case 'ArrowUp':
                this.focusedMonth = (this.focusedMonth + 9) % 12;
                break;
            case 'Enter':
                this.selectMonth(this.focusedMonth);
                break;
            case 'Escape':
                this.showDropdown = false;
                break;
        }
    }

    renderedCallback() {
        if (!this._listenerAdded) {
            window.addEventListener('click', this.handleOutsideClick);
            this._listenerAdded = true;
        }
    }

    handleOutsideClick = (event) => {
        if (!this.showDropdown) return;

        if (!this.template.contains(event.target)) {
            this.showDropdown = false;
        }
    }

    disconnectedCallback() {
        window.removeEventListener('click', this.handleOutsideClick);
    }



get value() {
    return this._value;
}
}