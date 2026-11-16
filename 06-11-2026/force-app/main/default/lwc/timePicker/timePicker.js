import { LightningElement, track,api } from 'lwc';

export default class TimePicker extends LightningElement {
    @track isTimePickerOpen = false;
    @track isHourSelection = true;
    @track isMinuteSelection = false;
    @track isHourInputEnabled = false;
    @track isMinuteInputEnabled = false;
    @api selectedHour = 12;
    @api selectedMinute = '00';
    @api isAm = false;
    @track formattedDisplayTime = 'Select Time';
    @track formattedSaveTime = '';
    @api displayedTime = 'Select Time';
    @api disableTimeButton=false;

    hours = [];
    minuteMarkers = [];

    connectedCallback() {
        if(this.displayedTime == null) {
            this.displayedTime = 'Select Time';
        }
         if(this.selectedHour == null) {
            this.selectedHour = 12;
        }
        if(this.selectedMinute == null) {
            this.selectedMinute = '00';
        } 
        if(this.disableTimeButton == null) {
            this.disableTimeButton = false;
        }
           
        this.initializeHours();
        this.initialize15MinuteMarkers(); // Only 15-minute intervals
        this.updateFormattedTime();
    }

    toggleTimePicker(event) {
        event.preventDefault();
        this.isTimePickerOpen = !this.isTimePickerOpen;
        if (!this.isTimePickerOpen) {
            this.isHourSelection = true;
            this.isMinuteSelection = false;
        }
    }

    initializeHours() {
        this.hours = Array.from({ length: 12 }, (_, i) => {
            const angle = (i + 1) * 30 - 90;
            const radians = (angle * Math.PI) / 180;
            return {
                label: i + 1,
                value: i + 1,
                x: 50 + 40 * Math.cos(radians),
                y: 50 + 40 * Math.sin(radians),
            };
        });
    }

    initialize15MinuteMarkers() {
        this.minuteMarkers = [0, 15, 30, 45].map((minute, index) => {
            const angle = index * 90 - 90;
            const radians = (angle * Math.PI) / 180;
            return {
                label: minute.toString().padStart(2, '0'),
                value: minute,
                x: 50 + 40 * Math.cos(radians),
                y: 50 + 40 * Math.sin(radians),
            };
        });
    }

    handleHourClick(event) {
        // Check if the user clicked on a number from the clock face
        console.log('selected hour in child  '+ this.selectedHour);
        if (event.target.dataset.value) {
            this.selectedHour = parseInt(event.target.dataset.value, 10);
            this.isHourSelection = false;
            this.isMinuteSelection = true; // Switch to minute selection mode
        } else {
            // If the user clicked on the input box, enable input mode
            this.isHourInputEnabled = true;
        }
        this.updateFormattedTime();
    }
    
    handleMinuteClick(event) {
        // Check if the user clicked on a number from the clock face
        if (event.target.dataset.value) {
            this.selectedMinute = parseInt(event.target.dataset.value, 10);
            this.isMinuteSelection = false; // Switch back to hour selection mode
            this.isHourSelection = true;
        } else {
            // If the user clicked on the input box, enable input mode
            this.isMinuteInputEnabled = true;
        }
        this.updateFormattedTime();
    }

    handleScrollHour(event) {
        event.preventDefault(); // Prevents page scrolling
        if (event.deltaY < 0) {
            // Scroll up (increase)
            this.selectedHour = this.selectedHour === 12 ? 1 : this.selectedHour + 1;
        } else {
            // Scroll down (decrease)
            this.selectedHour = this.selectedHour === 1 ? 12 : this.selectedHour - 1;
        }
        this.updateFormattedTime();
    }
    
    handleScrollMinute(event) {
        event.preventDefault(); // Prevents page scrolling
    
        let newMinute = this.selectedMinute;
    
        if (event.deltaY < 0) {
            // Scroll up (increase)
            newMinute = (this.selectedMinute + 1) % 60; // Ensures wrap from 59 → 0
        } else {
            // Scroll down (decrease)
            newMinute = Math.max(0, this.selectedMinute - 1); // Prevents going below 0
        }
    
        this.selectedMinute = newMinute; // Ensure value stays within 0-59
        this.updateFormattedTime();
    }
    
    handleKeyPress(event) {
        if (event.keyCode === 13) {
            this.saveTime();
        }
    }
    
    selectAm() {
        this.isAm = true;
        this.updateFormattedTime();
        event.preventDefault();
    }

    selectPm() {
        this.isAm = false;
        this.updateFormattedTime();
        event.preventDefault();
    }

    enableHourInput() {
        this.isHourInputEnabled = true;
    }

    disableHourInput(event) {
        const value = parseInt(event.target.value, 10);
        if (!isNaN(value) && value >= 1 && value <= 12) {
            this.selectedHour = value;
        }
        this.isHourInputEnabled = false;
        this.updateFormattedTime();
    }

    enableMinuteInput() {
        this.isMinuteInputEnabled = true;
    }

    disableMinuteInput(event) {
        const value = parseInt(event.target.value, 10);
        if (!isNaN(value) && value >= 0 && value <= 59) {
            this.selectedMinute = value;
        }
        this.isMinuteInputEnabled = false;
        this.updateFormattedTime();
    }

    get amButtonClass() {
        return this.isAm ? 'active' : '';
    }

    get pmButtonClass() {
        return this.isAm ? '' : 'active';
    }

    get hourHandX() {
        const angle = (this.selectedHour % 12) * 30 - 90;
        return 50 + 30 * Math.cos((angle * Math.PI) / 180);
    }

    get hourHandY() {
        const angle = (this.selectedHour % 12) * 30 - 90;
        return 50 + 30 * Math.sin((angle * Math.PI) / 180);
    }

    get minuteHandX() {
        const angle = this.selectedMinute * 6 - 90;
        return 50 + 40 * Math.cos((angle * Math.PI) / 180);
    }

    get minuteHandY() {
        const angle = this.selectedMinute * 6 - 90;
        return 50 + 40 * Math.sin((angle * Math.PI) / 180);
    }

    updateFormattedTime() {
        event.preventDefault();
        const selectedHour = parseInt(this.selectedHour, 10);
        const selectedMinute = parseInt(this.selectedMinute, 10);
        
        const hour = this.isAm
            ? selectedHour === 12
                ? 0
                : selectedHour
            : selectedHour === 12
                ? 12
                : selectedHour + 12;
        
        const displayHour = selectedHour.toString();
        const period = this.isAm ? 'AM' : 'PM';
        
        this.formattedDisplayTime = `${displayHour}:${selectedMinute
            .toString()
            .padStart(2, '0')} ${period}`;
        
        this.formattedSaveTime = `${hour.toString().padStart(2, '0')}:${selectedMinute
            .toString()
            .padStart(2, '0')}:00Z`;
        
    }

    saveTime() {
        this.displayedTime = this.formattedDisplayTime;
        console.log('Saved Time (backend format):', this.formattedSaveTime);
        const dataToParent = {
            displaytime: this.formattedDisplayTime,
            twentyFourHourFormat: this.formattedSaveTime,
        };
        this.dispatchEvent(
            new CustomEvent('savetimefromchild', {
                detail: dataToParent,
            })
        );
        this.isTimePickerOpen = false; // Close the modal
    }

    cancelTimePicker() {
        this.isTimePickerOpen = false; // Close the modal without saving
    }

    updateHourFromInput(event) {
        const input = event.target.value;
    
        // Allow empty input while typing
        if (input === '') {
            return;
        }
    
        const value = parseInt(input, 10);
    
        if (!isNaN(value)) {
            if (value >= 1 && value <= 12) {
                this.selectedHour = value;
                this.updateFormattedTime();
            }
        }
    }
    
    updateMinuteFromInput(event) {
        const input = event.target.value;
    
        // Allow empty input while typing
        if (input === '') {
            return;
        }
    
        const value = parseInt(input, 10);
    
        if (!isNaN(value)) {
            if (value >= 0 && value <= 59) {
                this.selectedMinute = value;
                this.updateFormattedTime();
            }
        }
    }
    
    restrictHourInput(event) {
        const key = event.key;
        const value = event.target.value;
    
        // Allow only digits
        if (!/^\d$/.test(key)) {
            event.preventDefault();
            return;
        }
    
        const proposedValue = value + key;
        if (parseInt(proposedValue, 10) > 12) {
            event.preventDefault();
        }
    }
    restrictMinuteInput(event) {
        const key = event.key;
        const value = event.target.value;
    
        // Allow only digits
        if (!/^\d$/.test(key)) {
            event.preventDefault();
            return;
        }
    
        const proposedValue = value + key;
        if (parseInt(proposedValue, 10) > 59) {
            event.preventDefault();
        }
    }
    
    
}