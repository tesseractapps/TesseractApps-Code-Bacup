import { LightningElement, api, track } from "lwc";

export default class TesseractAppsTimePicker extends LightningElement {
  @track searchKey = "";
  @track filteredTimes = [];
  @track isDropdownOpen = false;
  @track highlightIndex = -1; // Index of highlighted dropdown item
  @api disableTimeButton = false;

  allTimes = [];
  times30 = [];
  ignoreNextOutside = false;

  _selectedHour;
  _selectedMinute;
  _isAm;
  _displayedTime;

  @api
  set selectedHour(value) {
    this._selectedHour = value;
    // console.log("⏰ [Child] selectedHour updated:", value);
    this.updateDisplayedTime();
  }
  get selectedHour() {
    return this._selectedHour;
  }

  @api
  set selectedMinute(value) {
    this._selectedMinute = value;
    // console.log("⏰ [Child] selectedMinute updated:", value);
    this.updateDisplayedTime();
  }
  get selectedMinute() {
    return this._selectedMinute;
  }

  @api
  set isAm(value) {
    this._isAm = value;
    // console.log("⏰ [Child] isAm updated:", value);
    this.updateDisplayedTime();
  }
  get isAm() {
    return this._isAm;
  }

  @api
  set displayedTime(value) {
    this._displayedTime = value;
    // console.log("⏰ [Child] displayedTime updated:", value);
    this.updateDisplayedTime();
  }
  get displayedTime() {
    return this._displayedTime;
  }

  updateDisplayedTime() {
    // console.log("🔄 [Child] updateDisplayedTime() called");

    // console.log("   ➡️ this._selectedHour:", this._selectedHour);
    // console.log("   ➡️ this._selectedMinute:", this._selectedMinute);
    // console.log("   ➡️ this._isAm:", this._isAm);

    if (
      this._selectedHour &&
      this._selectedMinute &&
      this._isAm !== undefined
    ) {
      const period = this._isAm === "AM" ? "AM" : "PM"; // ✅ fixed
      // console.log("   ⏳ Computed period:", period);

      this._displayedTime = `${this._selectedHour}:${this._selectedMinute} ${period}`;
      // console.log("✅ [Child] Computed displayedTime:", this._displayedTime);

      this.searchKey = this._displayedTime;
      //  console.log("🔑 searchKey set to:", this.searchKey);
    } else {
      // console.warn(
      //   "⚠️ [Child] Missing required values - cannot compute displayedTime"
      // );
    }
  }

  connectedCallback() {
    // console.log("⏱ [TimePicker] connectedCallback START");
    this.generateTimes(1);
    this.setFilteredTimes(this.times30);
    // console.log("⏱ [TimePicker] allTimes generated:", this.allTimes.length);
    // console.log("⏱ [TimePicker] connectedCallback END");
    document.addEventListener("click", this.handleOutsideClick);
  }

  disconnectedCallback() {
    document.removeEventListener("click", this.handleOutsideClick);
  }

  get dropdownClass() {
    return `slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ${this.isDropdownOpen ? "slds-is-open" : ""}`;
  }

  get noResults() {
    return this.isDropdownOpen && this.filteredTimes.length === 0;
  }

  // Main function to build dropdown items with optionClass for highlight
  setFilteredTimes(times) {
    this.filteredTimes = times.map((t, idx) => ({
      ...t,
      optionClass: `slds-media slds-listbox__option slds-listbox__option_plain${this.highlightIndex === idx ? " highlighted" : ""}`
    }));
  }

  // generateTimes(interval) {
  //   const times = [];
  //   for (let h = 0; h < 24; h++) {
  //     for (let m = 0; m < 60; m += interval) {
  //       const hours12 = h % 12 || 12;
  //       const minutes = m.toString().padStart(2, "0");
  //       const ampm = h < 12 ? "AM" : "PM";
  //       const label = `${hours12}:${minutes} ${ampm}`;
  //       const value = `${h.toString().padStart(2, "0")}${minutes}`;
  //       times.push({ label, value });
  //     }
  //   }
  //   this.allTimes = times;
  // }
  // ✅ generateTimes with AM first then PM

  generateTimes(interval) {
    const amTimes = [];
    const pmTimes = [];

    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += interval) {
        const hours12 = h % 12 || 12;
        const minutes = m.toString().padStart(2, "0");
        const ampm = h < 12 ? "AM" : "PM";
        const label = `${hours12}:${minutes} ${ampm}`;
        const value = `${h.toString().padStart(2, "0")}${minutes}`;

        if (ampm === "AM") amTimes.push({ label, value });
        else pmTimes.push({ label, value });
      }
    }

    this.allTimes = [...amTimes, ...pmTimes];

    // Build 15-min intervals (also AM first)
    const amTimes15 = [];
    const pmTimes15 = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hours12 = h % 12 || 12;
        const minutes = m.toString().padStart(2, "0");
        const ampm = h < 12 ? "AM" : "PM";
        const label = `${hours12}:${minutes} ${ampm}`;
        const value = `${h.toString().padStart(2, "0")}${minutes}`;
        if (ampm === "AM") amTimes15.push({ label, value });
        else pmTimes15.push({ label, value });
      }
    }

    this.times30 = [...amTimes15, ...pmTimes15];
  }

  parseNumericInput(digits, raw) {
    let hours, minutes;
    if (digits.length <= 2) {
      hours = parseInt(digits, 10);
      minutes = 0;
    } else if (digits.length === 3) {
      hours = parseInt(digits[0], 10);
      minutes = parseInt(digits.slice(1), 10);
    } else if (digits.length === 4) {
      hours = parseInt(digits.slice(0, 2), 10);
      minutes = parseInt(digits.slice(2), 10);
    } else {
      return null;
    }
    if (isNaN(hours) || isNaN(minutes) || minutes > 59) return null;
    const lower = raw.toLowerCase();
    if (lower.includes("am") || lower.includes("pm")) {
      const isPm = lower.includes("pm");
      if (hours === 12 && !isPm) hours = 0;
      else if (isPm && hours < 12) hours += 12;
    }
    if (hours > 23) return null;
    return (
      hours.toString().padStart(2, "0") + minutes.toString().padStart(2, "0")
    );
  }

  // handleSearch = (event) => {
  //   // Skip arrow keys and Enter from triggering search
  //   if (
  //     event.key === "ArrowDown" ||
  //     event.key === "ArrowUp" ||
  //     event.key === "Enter"
  //   ) {
  //     return;
  //   }

  //   const raw = event.target.value.trim();
  //   this.searchKey = raw;
  //   const digits = raw.replace(/\D/g, "");
  //   const lower = raw.toLowerCase();

  //   let filtered = [];

  //   // Shortcut matching for patterns like "3p", "10a", "12p"
  //   const matchShortcut = lower.match(/^(\d{1,2})([ap])$/);
  //   if (matchShortcut) {
  //     let hours = parseInt(matchShortcut[1], 10);
  //     if (isNaN(hours) || hours < 1 || hours > 12) {
  //       filtered = [];
  //     } else {
  //       const isPm = matchShortcut[2] === "p";
  //       if (hours === 12 && !isPm) hours = 0;
  //       else if (isPm && hours < 12) hours += 12;
  //       const norm = hours.toString().padStart(2, "0");

  //       // Filter from times15 for shortcuts
  //       filtered = this.times15.filter((t) => {
  //         const timeHour = t.value.substring(0, 2);
  //         return timeHour === norm;
  //       });
  //     }
  //     this.highlightIndex = -1;
  //     this.setFilteredTimes(filtered);
  //     this.isDropdownOpen = true;
  //     return;
  //   }

  //   // If search is empty or only contains whitespace, show 15-min intervals
  //   if (!raw.trim()) {
  //     filtered = this.times15;
  //     this.highlightIndex = -1;
  //     this.setFilteredTimes(filtered);
  //     this.isDropdownOpen = true;
  //     return;
  //   }

  //   // Check if input contains colon (specific time like "12:01", "9:30", etc.)
  //   if (raw.includes(":")) {
  //     const timeMatch = lower.match(/^(\d{1,2}):(\d{1,2})\s*([ap]m)?$/);
  //     if (timeMatch) {
  //       let hours = parseInt(timeMatch[1], 10);
  //       const minutes = parseInt(timeMatch[2], 10);
  //       const ampm = timeMatch[3];

  //       if (
  //         !isNaN(hours) &&
  //         hours >= 1 &&
  //         hours <= 12 &&
  //         !isNaN(minutes) &&
  //         minutes >= 0 &&
  //         minutes <= 59
  //       ) {
  //         // Search in allTimes for the exact minute value
  //         filtered = this.allTimes.filter((t) => {
  //           const timeHour12 = parseInt(t.label.split(":")[0], 10);
  //           const timeMinutes = t.label.split(":")[1].split(" ")[0];
  //           const timeAmPm = t.label.split(" ")[1];

  //           const minuteMatch =
  //             timeMinutes === minutes.toString().padStart(2, "0");
  //           const hourMatch = timeHour12 === hours;

  //           // If AM/PM is specified in search, filter by it
  //           if (ampm) {
  //             const searchIsPm = ampm === "pm";
  //             const timeIsPm = timeAmPm === "PM";
  //             return hourMatch && minuteMatch && searchIsPm === timeIsPm;
  //           }

  //           return hourMatch && minuteMatch;
  //         });
  //       }
  //     }

  //     // If we found exact matches for colon-separated time, use them
  //     if (filtered.length > 0) {
  //       this.highlightIndex = -1;
  //       this.setFilteredTimes(filtered);
  //       this.isDropdownOpen = true;
  //       return;
  //     }
  //   }

  //   // Handle different digit lengths for time search (use times15 for general searches)
  //   if (digits.length > 0) {
  //     if (digits.length === 3) {
  //       // For 3-digit inputs like "115", "415", "101", etc.
  //       const hour1Digit = parseInt(digits.substring(0, 1), 10);
  //       const minute2Digit = digits.substring(1);

  //       const hour2Digit = parseInt(digits.substring(0, 2), 10);
  //       const minute1Digit = digits.substring(2);

  //       // First try: 1-digit hour + 2-digit minute (e.g., "115" = 1:15)
  //       if (!isNaN(hour1Digit) && hour1Digit >= 1 && hour1Digit <= 9) {
  //         const minute = parseInt(minute2Digit, 10);
  //         if (!isNaN(minute) && minute >= 0 && minute <= 59) {
  //           filtered = this.times15.filter((t) => {
  //             const timeHour12 = parseInt(t.label.split(":")[0], 10);
  //             const timeMinutes = t.label.split(":")[1].split(" ")[0];
  //             return timeHour12 === hour1Digit && timeMinutes === minute2Digit;
  //           });
  //         }
  //       }

  //       // Second try: 2-digit hour + 1-digit minute (e.g., "101" = 10:1X)
  //       if (
  //         filtered.length === 0 &&
  //         !isNaN(hour2Digit) &&
  //         hour2Digit >= 10 &&
  //         hour2Digit <= 12
  //       ) {
  //         filtered = this.times15.filter((t) => {
  //           const timeHour12 = parseInt(t.label.split(":")[0], 10);
  //           const timeMinutes = t.label.split(":")[1].split(" ")[0];
  //           return (
  //             timeHour12 === hour2Digit && timeMinutes.startsWith(minute1Digit)
  //           );
  //         });
  //       }
  //     } else if (digits.length === 1 || digits.length === 2) {
  //       // For 1 or 2 digit inputs, search by hour only in 15-min intervals
  //       const hour = parseInt(digits, 10);
  //       if (!isNaN(hour) && hour >= 1 && hour <= 12) {
  //         filtered = this.times15.filter((t) => {
  //           const timeHour12 = parseInt(t.label.split(":")[0], 10);
  //           return timeHour12 === hour;
  //         });
  //       } else {
  //         filtered = [];
  //       }
  //     } else if (digits.length === 4) {
  //       // For 4-digit inputs like "1015", "1115", "415" etc.
  //       const hour2Digit = parseInt(digits.substring(0, 2), 10);
  //       const minute2Digit = digits.substring(2);

  //       const hour1Digit = parseInt(digits.substring(0, 1), 10);
  //       const minute2DigitAlt = digits.substring(1, 3);

  //       // First try: 2-digit hour + 2-digit minute
  //       if (!isNaN(hour2Digit) && hour2Digit >= 10 && hour2Digit <= 12) {
  //         const minute = parseInt(minute2Digit, 10);
  //         if (!isNaN(minute) && minute >= 0 && minute <= 59) {
  //           filtered = this.times15.filter((t) => {
  //             const timeHour12 = parseInt(t.label.split(":")[0], 10);
  //             const timeMinutes = t.label.split(":")[1].split(" ")[0];
  //             return timeHour12 === hour2Digit && timeMinutes === minute2Digit;
  //           });
  //         }
  //       }

  //       // Second try: 1-digit hour + 2-digit minute (for cases like "415")
  //       if (
  //         filtered.length === 0 &&
  //         !isNaN(hour1Digit) &&
  //         hour1Digit >= 1 &&
  //         hour1Digit <= 9
  //       ) {
  //         const minute = parseInt(minute2DigitAlt, 10);
  //         if (!isNaN(minute) && minute >= 0 && minute <= 59) {
  //           filtered = this.times15.filter((t) => {
  //             const timeHour12 = parseInt(t.label.split(":")[0], 10);
  //             const timeMinutes = t.label.split(":")[1].split(" ")[0];
  //             return (
  //               timeHour12 === hour1Digit && timeMinutes === minute2DigitAlt
  //             );
  //           });
  //         }
  //       }
  //     } else {
  //       // Fallback to general search in 15-min intervals only
  //       filtered = this.times15.filter(
  //         (t) =>
  //           t.label.toLowerCase().includes(lower) || t.value.includes(digits)
  //       );
  //     }

  //     // Apply AM/PM filter if specified
  //     if (
  //       filtered.length > 0 &&
  //       (lower.includes("am") || lower.includes("pm"))
  //     ) {
  //       const isPm = lower.includes("pm");
  //       filtered = filtered.filter((t) => {
  //         const period = t.label.split(" ")[1];
  //         return (isPm && period === "PM") || (!isPm && period === "AM");
  //       });
  //     }
  //   } else {
  //     // Non-numeric search - use 15-min intervals only
  //     filtered = this.times15.filter(
  //       (t) => t.label.toLowerCase().includes(lower) || t.value.includes(lower)
  //     );
  //   }

  //   this.highlightIndex = -1;
  //   this.setFilteredTimes(filtered);
  //   this.isDropdownOpen = true;
  // };

  /* handleSearch = (event) => {
    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp" ||
      event.key === "Enter"
    ) {
      return;
    }

    const raw = event.target.value.trim();
    this.searchKey = raw;
    let digits = raw.replace(/\D/g, ""); // keep only numbers
    const lower = raw.toLowerCase();

    let filtered = [];

    // Shortcut like 3p, 12a
    const matchShortcut = lower.match(/^(\d{1,2})([ap])$/);
    if (matchShortcut) {
      let hours = parseInt(matchShortcut[1], 10);
      if (!isNaN(hours) && hours >= 1 && hours <= 12) {
        const isPm = matchShortcut[2] === "p";
        if (hours === 12 && !isPm) hours = 0;
        else if (isPm && hours < 12) hours += 12;
        const norm = hours.toString().padStart(2, "0") + "00";
        filtered = this.allTimes.filter((t) => t.value.startsWith(norm));
      }
      this.highlightIndex = -1;
      this.setFilteredTimes(filtered);
      this.isDropdownOpen = true;
      return;
    }

    // Handle single-digit hours like "3" or "12" → show 15-min intervals
    if (digits === "3" || digits === "12") {
      filtered = this.times15.filter((t) => {
        const hour = parseInt(t.label.split(":")[0], 10);
        return hour === parseInt(digits, 10);
      });
      this.highlightIndex = -1;
      this.setFilteredTimes(filtered);
      this.isDropdownOpen = true;
      return;
    }

    // Remove leading zeros for digit parsing
    digits = digits.replace(/^0+/, "");

    if (digits.length >= 3) {
      // 3 or 4 digit times like "130", "0130", "1015"
      const hour = parseInt(
        digits.length === 3 ? digits[0] : digits.substring(0, 2),
        10
      );
      const minute = parseInt(
        digits.length === 3 ? digits.substring(1) : digits.substring(2, 4),
        10
      );

      if (
        !isNaN(hour) &&
        hour >= 1 &&
        hour <= 12 &&
        !isNaN(minute) &&
        minute <= 59
      ) {
        filtered = this.allTimes.filter((t) => {
          const [hStr, mPart] = t.label.split(":");
          const mStr = mPart.split(" ")[0];
          const h = parseInt(hStr, 10);
          const m = parseInt(mStr, 10);
          return h === hour && m === minute;
        });
      }
    } else if (digits.length > 0) {
      // For 1 or 2 digit inputs → match hour and 15-min intervals
      const hour = parseInt(digits, 10);
      if (!isNaN(hour) && hour >= 1 && hour <= 12) {
        filtered = this.times15.filter((t) => {
          const h = parseInt(t.label.split(":")[0], 10);
          return h === hour;
        });
      }
    } else {
      // Non-numeric search
      filtered = this.times15.filter((t) =>
        t.label.toLowerCase().includes(lower)
      );
    }

    // Apply AM/PM filter if typed
    if (lower.includes("am") || lower.includes("pm")) {
      const isPm = lower.includes("pm");
      filtered = filtered.filter((t) => {
        const period = t.label.split(" ")[1];
        return (isPm && period === "PM") || (!isPm && period === "AM");
      });
    }

    if (!raw) {
      filtered = this.times15;
    } else {
      filtered = this.times15.filter((t) =>
        t.label.toLowerCase().includes(lower)
      );
    }

    // ✅ always sort AM first then PM
    filtered.sort((a, b) => {
      const isAmA = a.label.includes("AM");
      const isAmB = b.label.includes("AM");
      if (isAmA && !isAmB) return -1;
      if (!isAmA && isAmB) return 1;
      return 0;
    });

    this.highlightIndex = -1;
    this.setFilteredTimes(filtered);
    this.isDropdownOpen = true;
    // ✅ Auto-select if input exactly matches a time label
    const exactMatch = filtered.find(
      (t) => t.label.toLowerCase() === raw.toLowerCase()
    );

    if (exactMatch) {
      this.handleSelect({
        currentTarget: {
          dataset: {
            value: exactMatch.value,
            label: exactMatch.label
          }
        }
      });
      this.isDropdownOpen = false; // close dropdown since selection is done
    }
  }; */
  // handleSearch = (event) => {
  //   // Skip arrow keys and Enter from triggering search
  //   if (
  //     event.key === "ArrowDown" ||
  //     event.key === "ArrowUp" ||
  //     event.key === "Enter"
  //   ) {
  //     return;
  //   }

  //   const raw = event.target.value.trim();
  //   this.searchKey = raw;
  //   const digits = raw.replace(/\D/g, "");
  //   const lower = raw.toLowerCase();

  //   let filtered = [];

  //   // Shortcut matching for patterns like "3p", "10a", "12p"
  //   const matchShortcut = lower.match(/^(\d{1,2})([ap])$/);
  //   if (matchShortcut) {
  //     let hours = parseInt(matchShortcut[1], 10);
  //     if (isNaN(hours) || hours < 1 || hours > 12) {
  //       filtered = [];
  //     } else {
  //       const isPm = matchShortcut[2] === "p";
  //       if (hours === 12 && !isPm) hours = 0;
  //       else if (isPm && hours < 12) hours += 12;
  //       const norm = hours.toString().padStart(2, "0");

  //       // Filter from times15 for shortcuts
  //       filtered = this.times15.filter((t) => {
  //         const timeHour = t.value.substring(0, 2);
  //         return timeHour === norm;
  //       });
  //     }
  //     this.highlightIndex = -1;
  //     this.setFilteredTimes(filtered);
  //     this.isDropdownOpen = true;
  //     return;
  //   }

  //   // If search is empty or only contains whitespace, show 15-min intervals
  //   if (!raw.trim()) {
  //     filtered = this.times15;
  //     this.highlightIndex = -1;
  //     this.setFilteredTimes(filtered);
  //     this.isDropdownOpen = true;
  //     return;
  //   }

  //   // Check if input contains colon (specific time like "12:01", "9:30", etc.)
  //   if (raw.includes(":")) {
  //     const timeMatch = lower.match(/^(\d{1,2}):(\d{1,2})\s*([ap]m)?$/);
  //     if (timeMatch) {
  //       let hours = parseInt(timeMatch[1], 10);
  //       const minutes = parseInt(timeMatch[2], 10);
  //       const ampm = timeMatch[3];

  //       if (
  //         !isNaN(hours) &&
  //         hours >= 1 &&
  //         hours <= 12 &&
  //         !isNaN(minutes) &&
  //         minutes >= 0 &&
  //         minutes <= 59
  //       ) {
  //         // Search in allTimes for the exact minute value
  //         filtered = this.allTimes.filter((t) => {
  //           const timeHour12 = parseInt(t.label.split(":")[0], 10);
  //           const timeMinutes = t.label.split(":")[1].split(" ")[0];
  //           const timeAmPm = t.label.split(" ")[1];

  //           const minuteMatch =
  //             timeMinutes === minutes.toString().padStart(2, "0");
  //           const hourMatch = timeHour12 === hours;

  //           // If AM/PM is specified in search, filter by it
  //           if (ampm) {
  //             const searchIsPm = ampm === "pm";
  //             const timeIsPm = timeAmPm === "PM";
  //             return hourMatch && minuteMatch && searchIsPm === timeIsPm;
  //           }

  //           return hourMatch && minuteMatch;
  //         });
  //       }
  //     }

  //     // If we found exact matches for colon-separated time, use them
  //     if (filtered.length > 0) {
  //       this.highlightIndex = -1;
  //       this.setFilteredTimes(filtered);
  //       this.isDropdownOpen = true;
  //       return;
  //     }
  //   }

  //   // Handle different digit lengths for time search
  //   if (digits.length > 0) {
  //     // If digits are too long (more than 4), it's an invalid input - show no results
  //     if (digits.length > 4) {
  //       filtered = [];
  //     } else if (digits.length === 3) {
  //       // For 3-digit inputs like "901" (9:01), "115" (1:15), "415" (4:15), etc.
  //       const hour1Digit = parseInt(digits.substring(0, 1), 10);
  //       const minute2Digit = digits.substring(1);

  //       const hour2Digit = parseInt(digits.substring(0, 2), 10);
  //       const minute1Digit = digits.substring(2);

  //       // First try: 1-digit hour + 2-digit minute (e.g., "901" = 9:01)
  //       if (!isNaN(hour1Digit) && hour1Digit >= 1 && hour1Digit <= 9) {
  //         const minute = parseInt(minute2Digit, 10);
  //         if (!isNaN(minute) && minute >= 0 && minute <= 59) {
  //           // Search in allTimes for exact minute match (like 9:01)
  //           filtered = this.allTimes.filter((t) => {
  //             const timeHour12 = parseInt(t.label.split(":")[0], 10);
  //             const timeMinutes = t.label.split(":")[1].split(" ")[0];
  //             return timeHour12 === hour1Digit && timeMinutes === minute2Digit;
  //           });
  //         }
  //       }

  //       // Second try: 2-digit hour + 1-digit minute (e.g., "101" = 10:1X)
  //       if (
  //         filtered.length === 0 &&
  //         !isNaN(hour2Digit) &&
  //         hour2Digit >= 10 &&
  //         hour2Digit <= 12
  //       ) {
  //         filtered = this.times15.filter((t) => {
  //           const timeHour12 = parseInt(t.label.split(":")[0], 10);
  //           const timeMinutes = t.label.split(":")[1].split(" ")[0];
  //           return (
  //             timeHour12 === hour2Digit && timeMinutes.startsWith(minute1Digit)
  //           );
  //         });
  //       }
  //     } else if (digits.length === 1 || digits.length === 2) {
  //       // For 1 or 2 digit inputs, search by hour only in 15-min intervals
  //       const hour = parseInt(digits, 10);
  //       if (!isNaN(hour) && hour >= 1 && hour <= 12) {
  //         filtered = this.times15.filter((t) => {
  //           const timeHour12 = parseInt(t.label.split(":")[0], 10);
  //           return timeHour12 === hour;
  //         });
  //       } else {
  //         filtered = [];
  //       }
  //     } else if (digits.length === 4) {
  //       // For 4-digit inputs like "0433" (4:33), "0901" (9:01), "1001" (10:01), "1015" (10:15), etc.
  //       const hour2Digit = parseInt(digits.substring(0, 2), 10);
  //       const minute2Digit = digits.substring(2);

  //       const hour1Digit = parseInt(digits.substring(0, 1), 10);
  //       const minute2DigitAlt = digits.substring(1, 3);

  //       // First try: 2-digit hour + 2-digit minute (e.g., "0433" = 4:33, "1001" = 10:01)
  //       if (!isNaN(hour2Digit) && hour2Digit >= 1 && hour2Digit <= 12) {
  //         const minute = parseInt(minute2Digit, 10);
  //         if (!isNaN(minute) && minute >= 0 && minute <= 59) {
  //           // Search in allTimes for exact minute match
  //           filtered = this.allTimes.filter((t) => {
  //             const timeHour12 = parseInt(t.label.split(":")[0], 10);
  //             const timeMinutes = t.label.split(":")[1].split(" ")[0];
  //             return timeHour12 === hour2Digit && timeMinutes === minute2Digit;
  //           });
  //         }
  //       }

  //       // Second try: 1-digit hour + 2-digit minute (for cases like "901" = 9:01, "415" = 4:15)
  //       if (
  //         filtered.length === 0 &&
  //         !isNaN(hour1Digit) &&
  //         hour1Digit >= 1 &&
  //         hour1Digit <= 9
  //       ) {
  //         const minute = parseInt(minute2DigitAlt, 10);
  //         if (!isNaN(minute) && minute >= 0 && minute <= 59) {
  //           // Search in allTimes for exact minute match
  //           filtered = this.allTimes.filter((t) => {
  //             const timeHour12 = parseInt(t.label.split(":")[0], 10);
  //             const timeMinutes = t.label.split(":")[1].split(" ")[0];
  //             return (
  //               timeHour12 === hour1Digit && timeMinutes === minute2DigitAlt
  //             );
  //           });
  //         }
  //       }
  //     }

  //     // Apply AM/PM filter if specified
  //     if (
  //       filtered.length > 0 &&
  //       (lower.includes("am") || lower.includes("pm"))
  //     ) {
  //       const isPm = lower.includes("pm");
  //       filtered = filtered.filter((t) => {
  //         const period = t.label.split(" ")[1];
  //         return (isPm && period === "PM") || (!isPm && period === "AM");
  //       });
  //     }
  //   } else {
  //     // Non-numeric search - use 15-min intervals only if it matches
  //     filtered = this.times15.filter(
  //       (t) => t.label.toLowerCase().includes(lower) || t.value.includes(lower)
  //     );
  //   }

  //   // REMOVED THE FALLBACK LOGIC - Don't show 15-min intervals for invalid inputs
  //   // If no valid results found, filtered will remain empty and show "No times found"

  //   this.highlightIndex = -1;
  //   this.setFilteredTimes(filtered);
  //   this.isDropdownOpen = true;
  // };
  // Helper method to convert 12-hour format to military hour
  
handleSearch = (event) => {
  // Skip arrow keys, Enter, and Space from triggering search
if (
    event.key === "ArrowDown" ||
    event.key === "ArrowUp" ||
    event.key === "Enter" ||
    event.key === " "
  ) {
    return;
  }

  const raw = event.target.value.trim();
  this.searchKey = raw;

  // If backspace results in empty input, clear the selection immediately
  if (!raw && (event.key === "Backspace" || event.key === "Delete")) {
    this.searchKey = "";
    this.filteredTimes = this.times30;
    this.isDropdownOpen = true;
    this.highlightIndex = -1;
    this.setFilteredTimes(this.filteredTimes);
    this.dispatchEvent(new CustomEvent("savetimefromchild", { detail: null }));
    return;
  }

  const digits = raw.replace(/\D/g, "");
  const lower = raw.toLowerCase();

  let filtered = [];


  // Shortcut matching for patterns like "3p", "10a", "12p"
  const matchShortcut = lower.match(/^(\d{1,2})([ap])$/);
  if (matchShortcut) {
    let hours = parseInt(matchShortcut[1], 10);
    if (isNaN(hours) || hours < 1 || hours > 12) {
      filtered = [];
    } else {
      const isPm = matchShortcut[2] === "p";
      if (hours === 12 && !isPm) hours = 0;
      else if (isPm && hours < 12) hours += 12;
      const norm = hours.toString().padStart(2, "0");

      // Filter from times30 for shortcuts
      filtered = this.times30.filter((t) => {
        const timeHour = t.value.substring(0, 2);
        return timeHour === norm;
      });
    }
    this.highlightIndex = -1;
    this.setFilteredTimes(filtered);
    this.isDropdownOpen = true;
    return;
  }

  // If search is empty or only contains whitespace, show 15-min intervals
  if (!raw.trim()) {
    filtered = this.times30;
    this.highlightIndex = -1;
    this.setFilteredTimes(filtered);
    this.isDropdownOpen = true;
    return;
  }

  // Check if input contains colon (specific time like "12:01", "9:30", etc.)
  if (raw.includes(":")) {
    const timeMatch = lower.match(/^(\d{1,2}):(\d{1,2})\s*([ap]m)?$/);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3];

      if (
        !isNaN(hours) &&
        hours >= 1 &&
        hours <= 12 &&
        !isNaN(minutes) &&
        minutes >= 0 &&
        minutes <= 59
      ) {
        // Search in allTimes for the exact minute value
        filtered = this.allTimes.filter((t) => {
          const timeHour12 = parseInt(t.label.split(":")[0], 10);
          const timeMinutes = t.label.split(":")[1].split(" ")[0];
          const timeAmPm = t.label.split(" ")[1];

          const minuteMatch =
            timeMinutes === minutes.toString().padStart(2, "0");
          const hourMatch = timeHour12 === hours;

          // If AM/PM is specified in search, filter by it
          if (ampm) {
            const searchIsPm = ampm === "pm";
            const timeIsPm = timeAmPm === "PM";
            return hourMatch && minuteMatch && searchIsPm === timeIsPm;
          }

          return hourMatch && minuteMatch;
        });
      }
    }

    // If we found exact matches for colon-separated time, use them
    if (filtered.length > 0) {
      this.highlightIndex = -1;
      this.setFilteredTimes(filtered);
      this.isDropdownOpen = true;
      return;
    }
  }

  // Handle different digit lengths for time search
  if (digits.length > 0) {
    // If digits are too long (more than 4), it's an invalid input - show no results
    if (digits.length > 4) {
      filtered = [];
    } else if (digits.length === 3) {
      // For 3-digit inputs like "901" (9:01), "115" (1:15), "415" (4:15), etc.
      const hour1Digit = parseInt(digits.substring(0, 1), 10);
      const minute2Digit = digits.substring(1);

      const hour2Digit = parseInt(digits.substring(0, 2), 10);
      const minute1Digit = digits.substring(2);

      // First try: 1-digit hour + 2-digit minute (e.g., "901" = 9:01)
      if (!isNaN(hour1Digit) && hour1Digit >= 1 && hour1Digit <= 9) {
        const minute = parseInt(minute2Digit, 10);
        // Only accept if minutes are valid (00-59)
        if (!isNaN(minute) && minute >= 0 && minute <= 59) {
          // Search in allTimes for exact minute match (like 9:01)
          filtered = this.allTimes.filter((t) => {
            const timeHour12 = parseInt(t.label.split(":")[0], 10);
            const timeMinutes = t.label.split(":")[1].split(" ")[0];
            return timeHour12 === hour1Digit && timeMinutes === minute2Digit;
          });
        }
      }

      // Second try: 2-digit hour + 1-digit minute (e.g., "101" = 10:1X)
      // Only try this if first attempt found no results AND hour is valid
      if (
        filtered.length === 0 &&
        !isNaN(hour2Digit) &&
        hour2Digit >= 10 &&
        hour2Digit <= 12
      ) {
        // For 2-digit hour + 1-digit minute, only show 15-min intervals that start with that minute
        filtered = this.times30.filter((t) => {
          const timeHour12 = parseInt(t.label.split(":")[0], 10);
          const timeMinutes = t.label.split(":")[1].split(" ")[0];
          return (
            timeHour12 === hour2Digit && timeMinutes.startsWith(minute1Digit)
          );
        });
      }

      // If we still have no results, check if the input is clearly invalid
      // For example, "137" where 37 is not a valid minute for 1-hour interpretation
      // or "137" where 13 is not a valid hour for 2-digit interpretation
      if (filtered.length === 0) {
        // Check if this might be an invalid time like "137" (1:37 is valid, but we want to be strict)
        const possibleHour1 = parseInt(digits.substring(0, 1), 10);
        const possibleMinutes1 = parseInt(digits.substring(1), 10);
        const possibleHour2 = parseInt(digits.substring(0, 2), 10);
        
        // If both interpretations are invalid, show no results
        const isValidHour1Minute2 = !isNaN(possibleHour1) && possibleHour1 >= 1 && possibleHour1 <= 9 && 
                                   !isNaN(possibleMinutes1) && possibleMinutes1 >= 0 && possibleMinutes1 <= 59;
        const isValidHour2 = !isNaN(possibleHour2) && possibleHour2 >= 10 && possibleHour2 <= 12;
        
        // If neither interpretation is clearly valid, show no results
        if (!isValidHour1Minute2 && !isValidHour2) {
          filtered = [];
        }
      }
    } else if (digits.length === 1 || digits.length === 2) {
      // For 1 or 2 digit inputs, search by hour only in 15-min intervals
      const hour = parseInt(digits, 10);
      if (!isNaN(hour) && hour >= 1 && hour <= 12) {
        filtered = this.times30.filter((t) => {
          const timeHour12 = parseInt(t.label.split(":")[0], 10);
          return timeHour12 === hour;
        });
      } else {
        filtered = [];
      }
    } else if (digits.length === 4) {
      // For 4-digit inputs like "0433" (4:33), "0901" (9:01), "1001" (10:01), "1015" (10:15), etc.
      const hour2Digit = parseInt(digits.substring(0, 2), 10);
      const minute2Digit = digits.substring(2);

      const hour1Digit = parseInt(digits.substring(0, 1), 10);
      const minute2DigitAlt = digits.substring(1, 3);

      // First try: 2-digit hour + 2-digit minute (e.g., "0433" = 4:33, "1001" = 10:01)
      if (!isNaN(hour2Digit) && hour2Digit >= 1 && hour2Digit <= 12) {
        const minute = parseInt(minute2Digit, 10);
        if (!isNaN(minute) && minute >= 0 && minute <= 59) {
          // Search in allTimes for exact minute match
          filtered = this.allTimes.filter((t) => {
            const timeHour12 = parseInt(t.label.split(":")[0], 10);
            const timeMinutes = t.label.split(":")[1].split(" ")[0];
            return timeHour12 === hour2Digit && timeMinutes === minute2Digit;
          });
        }
      }

      // Second try: 1-digit hour + 2-digit minute (for cases like "901" = 9:01, "415" = 4:15)
      if (
        filtered.length === 0 &&
        !isNaN(hour1Digit) &&
        hour1Digit >= 1 &&
        hour1Digit <= 9
      ) {
        const minute = parseInt(minute2DigitAlt, 10);
        if (!isNaN(minute) && minute >= 0 && minute <= 59) {
          // Search in allTimes for exact minute match
          filtered = this.allTimes.filter((t) => {
            const timeHour12 = parseInt(t.label.split(":")[0], 10);
            const timeMinutes = t.label.split(":")[1].split(" ")[0];
            return (
              timeHour12 === hour1Digit && timeMinutes === minute2DigitAlt
            );
          });
        }
      }
    }

    // Apply AM/PM filter if specified
    if (
      filtered.length > 0 &&
      (lower.includes("am") || lower.includes("pm"))
    ) {
      const isPm = lower.includes("pm");
      filtered = filtered.filter((t) => {
        const period = t.label.split(" ")[1];
        return (isPm && period === "PM") || (!isPm && period === "AM");
      });
    }
  } else {
    // Non-numeric search - use 15-min intervals only if it matches
    filtered = this.times30.filter(
      (t) => t.label.toLowerCase().includes(lower) || t.value.includes(lower)
    );
  }

  // REMOVED THE FALLBACK LOGIC - Don't show 15-min intervals for invalid inputs
  // If no valid results found, filtered will remain empty and show "No times found"

  this.highlightIndex = -1;
  this.setFilteredTimes(filtered);
  this.isDropdownOpen = true;
};
  
  convertToMilitaryHour(hour12, isPm) {
    if (hour12 === 12) {
      return isPm ? 12 : 0;
    }
    return isPm ? hour12 + 12 : hour12;
  }

handleKeyDown = (event) => {
  // console.log("KeyDown:", event.key);

  // 🔒 Restriction first
  const allowedKeys = [
    "Backspace",
    "Delete",
    "ArrowLeft",
    "ArrowRight",
    "Tab",
    "Enter",
    ":",
    "ArrowUp",
    "ArrowDown",
    " " // Added space key
  ];
  const key = event.key.toLowerCase();

  if (
    !/[0-9]/.test(key) &&
    !["a", "m", "p", " "].includes(key) && // Added space to allowed characters
    !allowedKeys.includes(event.key)
  ) {
    event.preventDefault();
    return; // stop if invalid
  }

  // 🎯 Existing arrow + enter logic here
  if (
    event.key === "ArrowDown" ||
    event.key === "ArrowUp" ||
    event.key === "Enter"
  ) {
    // Handle arrow keys and Enter here, let other keys trigger search
    if (!this.isDropdownOpen) {
      // console.log("Dropdown is not open—exiting.");
      return;
    }

    if (!this.filteredTimes.length) {
      // console.log("No filtered times in dropdown—exiting.");
      return;
    }

    event.preventDefault(); // Prevent default behavior for these keys

    if (event.key === "ArrowDown") {
      // console.log(
      //   "ArrowDown pressed. Current highlightIndex:",
      //   this.highlightIndex
      // );

      // Advance to next index, or loop to start
      if (
        this.highlightIndex < this.filteredTimes.length - 1 &&
        this.highlightIndex !== -1
      ) {
        this.highlightIndex++;
      } else if (this.highlightIndex === -1) {
        this.highlightIndex = 0; // First move, set to first index
      } else {
        this.highlightIndex = 0;
      }
      // console.log("Moved highlightIndex down to:", this.highlightIndex);
      this.updateHighlightClass();
      this.scrollToHighlightedItem();
      // console.log("updateHighlightClass called after ArrowDown.");
    } else if (event.key === "ArrowUp") {
      // console.log(
      //   "ArrowUp pressed. Current highlightIndex:",
      //   this.highlightIndex
      // );

      // Move to previous index, or loop to end
      if (this.highlightIndex > 0) {
        this.highlightIndex--;
      } else if (this.highlightIndex === -1) {
        this.highlightIndex = this.filteredTimes.length - 1; // First move, set to last index
      } else {
        this.highlightIndex = this.filteredTimes.length - 1;
      }
      // console.log("Moved highlightIndex up to:", this.highlightIndex);
      this.updateHighlightClass();
      this.scrollToHighlightedItem();
      // console.log("updateHighlightClass called after ArrowUp.");
    } else if (event.key === "Enter") {
      // console.log("Enter pressed. highlightIndex:", this.highlightIndex);

      if (this.highlightIndex > -1) {
        // console.log(
        //   "Selecting highlighted value:",
        //   this.filteredTimes[this.highlightIndex]
        // );
        this.handleSelect({
          currentTarget: {
            dataset: {
              value: this.filteredTimes[this.highlightIndex].value,
              label: this.filteredTimes[this.highlightIndex].label
            }
          }
        });
        this.isDropdownOpen = false;
        this.highlightIndex = -1;
        // console.log("Dropdown closed after selection by Enter.");
        this.updateHighlightClass();
        // console.log("updateHighlightClass called after Enter.");
      } else if (this.filteredTimes.length > 0) {
        // console.log(
        //   "No highlight, defaulting to first value:",
        //   this.filteredTimes[0]
        // );
        this.handleSelect({
          currentTarget: {
            dataset: {
              value: this.filteredTimes[0].value,
              label: this.filteredTimes[0].label
            }
          }
        });
        this.isDropdownOpen = false;
        this.highlightIndex = -1;
        // console.log(
        //   "Dropdown closed after selection by Enter (no highlight)."
        // );
        this.updateHighlightClass();
        // console.log("updateHighlightClass called after Enter.");
      }
    }
  }
};

  // New method to scroll the highlighted item into view
  scrollToHighlightedItem() {
    if (this.highlightIndex >= 0) {
      // Use setTimeout to ensure the DOM is updated with the new highlight
      setTimeout(() => {
        const dropdown = this.template.querySelector(".slds-dropdown");
        const highlightedItem = this.template.querySelector(".highlighted");

        if (dropdown && highlightedItem) {
          const dropdownRect = dropdown.getBoundingClientRect();
          const itemRect = highlightedItem.getBoundingClientRect();

          // Check if item is outside visible area
          if (itemRect.bottom > dropdownRect.bottom) {
            // Scroll down to make item visible
            dropdown.scrollTop += itemRect.bottom - dropdownRect.bottom;
          } else if (itemRect.top < dropdownRect.top) {
            // Scroll up to make item visible
            dropdown.scrollTop -= dropdownRect.top - itemRect.top;
          }
        }
      }, 0);
    }
  }

  updateHighlightClass() {
    this.filteredTimes = this.filteredTimes.map((t, idx) => ({
      ...t,
      optionClass: `slds-media slds-listbox__option slds-listbox__option_plain${this.highlightIndex === idx ? " highlighted" : ""}`
    }));
  }

  handleSelect = (event) => {
    const label = event.currentTarget.dataset.label;
    this.searchKey = label;
    this.isDropdownOpen = false;
    const [timePart, ampm] = label.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    const twentyFourHourFormat = `${hours
      .toString()
      .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00Z`;
    const output = {
      displaytime: label,
      twentyFourHourFormat: twentyFourHourFormat
    };
    this.dispatchEvent(
      new CustomEvent("savetimefromchild", { detail: output })
    );
  };

  /* handleSelect = (event) => {
    const label = event.currentTarget.dataset.label;
    this.searchKey = label;
    this.isDropdownOpen = false;

    // 🔹 Convert to 24-hour format
    const [timePart, ampm] = label.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);

    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;

    const twentyFourHourFormat = `${hours
      .toString()
      .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00Z`;

    // 🔹 Dispatch event back to parent
    const output = {
      displaytime: label,
      twentyFourHourFormat: twentyFourHourFormat
    };
    this.dispatchEvent(
      new CustomEvent("savetimefromchild", { detail: output })
    );

    // 🔹 Store selected hour for dropdown reuse
    this._selectedHour = parseInt(timePart.split(":")[0], 10);

    // 🔹 Show 15-min intervals for this hour (AM + PM)
    this.setFilteredTimes(this.generateHourIntervals(this._selectedHour));
    this.isDropdownOpen = true; // keep dropdown open with refreshed list
  }; */

  // handleSelect = (event) => {
  //   const label = event.currentTarget.dataset.label;
  //   const value = event.currentTarget.dataset.value; // optional if needed
  //   this.searchKey = label;
  //   this.isDropdownOpen = false;

  //   // 🔹 Convert 12-hour label to hours, minutes, AM/PM
  //   const [timePart, ampm] = label.split(" ");
  //   let [hours, minutes] = timePart.split(":").map(Number);

  //   const isPm = ampm === "PM";

  //   // 🔹 Convert to 24-hour
  //   if (hours === 12) {
  //     hours = isPm ? 12 : 0;
  //   } else if (isPm) {
  //     hours += 12;
  //   }

  //   // 🔹 Store selected hour, minute, AM/PM for display/update
  //   this._selectedHour = hours % 12 === 0 ? 12 : hours % 12;
  //   this._selectedMinute = minutes.toString().padStart(2, "0");
  //   this._isAm = ampm;
  //   this.updateDisplayedTime(); // optional if you have a display field

  //   // 🔹 Calculate 24-hour format for parent
  //   const twentyFourHourFormat = `${hours.toString().padStart(2, "0")}:${minutes
  //     .toString()
  //     .padStart(2, "0")}:00Z`;

  //   // 🔹 Dispatch event to parent
  //   const output = {
  //     displaytime: label,
  //     twentyFourHourFormat: twentyFourHourFormat,
  //     hour: this._selectedHour,
  //     minute: this._selectedMinute,
  //     isAm: this._isAm,
  //     value: value
  //   };
  //   this.dispatchEvent(
  //     new CustomEvent("savetimefromchild", { detail: output })
  //   );

  //   // 🔹 Store selected hour for dropdown reuse
  //   this._selectedHour = parseInt(timePart.split(":")[0], 10);

  //   // 🔹 Refresh 15-min intervals for this hour
  //   this.setFilteredTimes(this.generateHourIntervals(this._selectedHour));
  //   this.isDropdownOpen = true; // keep dropdown open with refreshed list
  // };

  // 🔹 Helper: Build all 15-min intervals for a given hour (AM + PM)
  // ✅ AM first then PM for intervals
  generateHourIntervals(hour) {
    const minutes = ["00","30"];
    const amValues = [];
    const pmValues = [];

    minutes.forEach((m) => {
      amValues.push({ label: `${hour}:${m} AM`, value: `${hour}${m}AM` });
      pmValues.push({ label: `${hour}:${m} PM`, value: `${hour}${m}PM` });
    });

    return [...amValues, ...pmValues];
  }

  // openDropdown = () => {
  //   this.highlightIndex = -1;

  //   if (this.searchKey) {
  //     // Extract hour from current value (e.g. "9:00 AM")
  //     const [timePart] = this.searchKey.split(" ");
  //     const hour = parseInt(timePart.split(":")[0], 10);

  //     if (!isNaN(hour)) {
  //       this.setFilteredTimes(this.generateHourIntervals(hour));
  //     } else {
  //       this.setFilteredTimes(this.times15); // fallback → full list
  //     }
  //   } else {
  //     this.setFilteredTimes(this.times15); // no value → full list
  //   }

  //   this.isDropdownOpen = true;
  //   this.ignoreNextOutside = true;
  // };

openDropdown = () => {
  this.highlightIndex = -1;

  if (this.searchKey && this.searchKey.trim()) {
    // If there's a search value, re-trigger the search to show filtered results
    const raw = this.searchKey.trim();
    const digits = raw.replace(/\D/g, "");
    const lower = raw.toLowerCase();

    let filtered = [];

    // Shortcut matching for patterns like "3p", "10a", "12p"
    const matchShortcut = lower.match(/^(\d{1,2})([ap])$/);
    if (matchShortcut) {
      let hours = parseInt(matchShortcut[1], 10);
      if (isNaN(hours) || hours < 1 || hours > 12) {
        filtered = [];
      } else {
        const isPm = matchShortcut[2] === "p";
        if (hours === 12 && !isPm) hours = 0;
        else if (isPm && hours < 12) hours += 12;
        const norm = hours.toString().padStart(2, "0");

        filtered = this.times30.filter((t) => {
          const timeHour = t.value.substring(0, 2);
          return timeHour === norm;
        });
      }
    }
    // Check if input contains colon
    else if (raw.includes(":")) {
      const timeMatch = lower.match(/^(\d{1,2}):(\d{1,2})\s*([ap]m)?$/);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const ampm = timeMatch[3];

        if (
          !isNaN(hours) &&
          hours >= 1 &&
          hours <= 12 &&
          !isNaN(minutes) &&
          minutes >= 0 &&
          minutes <= 59
        ) {
          filtered = this.allTimes.filter((t) => {
            const timeHour12 = parseInt(t.label.split(":")[0], 10);
            const timeMinutes = t.label.split(":")[1].split(" ")[0];
            const timeAmPm = t.label.split(" ")[1];

            const minuteMatch =
              timeMinutes === minutes.toString().padStart(2, "0");
            const hourMatch = timeHour12 === hours;

            if (ampm) {
              const searchIsPm = ampm === "pm";
              const timeIsPm = timeAmPm === "PM";
              return hourMatch && minuteMatch && searchIsPm === timeIsPm;
            }

            return hourMatch && minuteMatch;
          });
        }
      }
    }
    // Handle digit-based searches
    else if (digits.length > 0) {
      if (digits.length > 4) {
        filtered = []; // Invalid long input
      } else if (digits.length === 3) {
        const hour1Digit = parseInt(digits.substring(0, 1), 10);
        const minute2Digit = digits.substring(1);
        const hour2Digit = parseInt(digits.substring(0, 2), 10);
        const minute1Digit = digits.substring(2);

        // First try: 1-digit hour + 2-digit minute (e.g., "901" = 9:01)
        if (!isNaN(hour1Digit) && hour1Digit >= 1 && hour1Digit <= 9) {
          const minute = parseInt(minute2Digit, 10);
          // Only accept if minutes are valid (00-59)
          if (!isNaN(minute) && minute >= 0 && minute <= 59) {
            // Search in allTimes for exact minute match
            filtered = this.allTimes.filter((t) => {
              const timeHour12 = parseInt(t.label.split(":")[0], 10);
              const timeMinutes = t.label.split(":")[1].split(" ")[0];
              return (
                timeHour12 === hour1Digit && timeMinutes === minute2Digit
              );
            });
          }
        }

        // Second try: 2-digit hour + 1-digit minute (e.g., "101" = 10:1X)
        // Only try this if first attempt found no results AND hour is valid
        if (
          filtered.length === 0 &&
          !isNaN(hour2Digit) &&
          hour2Digit >= 10 &&
          hour2Digit <= 12
        ) {
          // For 2-digit hour + 1-digit minute, only show 15-min intervals that start with that minute
          filtered = this.times30.filter((t) => {
            const timeHour12 = parseInt(t.label.split(":")[0], 10);
            const timeMinutes = t.label.split(":")[1].split(" ")[0];
            return (
              timeHour12 === hour2Digit &&
              timeMinutes.startsWith(minute1Digit)
            );
          });
        }

        // If we still have no results, check if the input is clearly invalid
        if (filtered.length === 0) {
          const possibleHour1 = parseInt(digits.substring(0, 1), 10);
          const possibleMinutes1 = parseInt(digits.substring(1), 10);
          const possibleHour2 = parseInt(digits.substring(0, 2), 10);
          
          // If both interpretations are invalid, show no results
          const isValidHour1Minute2 = !isNaN(possibleHour1) && possibleHour1 >= 1 && possibleHour1 <= 9 && 
                                     !isNaN(possibleMinutes1) && possibleMinutes1 >= 0 && possibleMinutes1 <= 59;
          const isValidHour2 = !isNaN(possibleHour2) && possibleHour2 >= 10 && possibleHour2 <= 12;
          
          // If neither interpretation is clearly valid, show no results
          if (!isValidHour1Minute2 && !isValidHour2) {
            filtered = [];
          }
        }
      } else if (digits.length === 1 || digits.length === 2) {
        const hour = parseInt(digits, 10);
        if (!isNaN(hour) && hour >= 1 && hour <= 12) {
          filtered = this.times30.filter((t) => {
            const timeHour12 = parseInt(t.label.split(":")[0], 10);
            return timeHour12 === hour;
          });
        } else {
          filtered = [];
        }
      } else if (digits.length === 4) {
        const hour2Digit = parseInt(digits.substring(0, 2), 10);
        const minute2Digit = digits.substring(2);
        const hour1Digit = parseInt(digits.substring(0, 1), 10);
        const minute2DigitAlt = digits.substring(1, 3);

        // First try: 2-digit hour + 2-digit minute (e.g., "0433" = 4:33, "1001" = 10:01)
        if (!isNaN(hour2Digit) && hour2Digit >= 1 && hour2Digit <= 12) {
          const minute = parseInt(minute2Digit, 10);
          if (!isNaN(minute) && minute >= 0 && minute <= 59) {
            // Search in allTimes for exact minute match
            filtered = this.allTimes.filter((t) => {
              const timeHour12 = parseInt(t.label.split(":")[0], 10);
              const timeMinutes = t.label.split(":")[1].split(" ")[0];
              return (
                timeHour12 === hour2Digit && timeMinutes === minute2Digit
              );
            });
          }
        }

        // Second try: 1-digit hour + 2-digit minute (for cases like "901" = 9:01, "415" = 4:15)
        if (
          filtered.length === 0 &&
          !isNaN(hour1Digit) &&
          hour1Digit >= 1 &&
          hour1Digit <= 9
        ) {
          const minute = parseInt(minute2DigitAlt, 10);
          if (!isNaN(minute) && minute >= 0 && minute <= 59) {
            // Search in allTimes for exact minute match
            filtered = this.allTimes.filter((t) => {
              const timeHour12 = parseInt(t.label.split(":")[0], 10);
              const timeMinutes = t.label.split(":")[1].split(" ")[0];
              return (
                timeHour12 === hour1Digit && timeMinutes === minute2DigitAlt
              );
            });
          }
        }
      }

      // Apply AM/PM filter if specified
      if (
        filtered.length > 0 &&
        (lower.includes("am") || lower.includes("pm"))
      ) {
        const isPm = lower.includes("pm");
        filtered = filtered.filter((t) => {
          const period = t.label.split(" ")[1];
          return (isPm && period === "PM") || (!isPm && period === "AM");
        });
      }
    } else {
      // Non-numeric search
      filtered = this.times30.filter(
        (t) =>
          t.label.toLowerCase().includes(lower) || t.value.includes(lower)
      );
    }

    this.setFilteredTimes(filtered);
  } else {
    // No search value, show all 15-min intervals
    this.setFilteredTimes(this.times30);
  }

  this.isDropdownOpen = true;
  this.ignoreNextOutside = true;
};

handleOutsideClick = (event) => {
  const inputElem = this.template.querySelector('[data-timeinput="true"]');
  if (this.ignoreNextOutside) {
    this.ignoreNextOutside = false;
    return;
  }
  if (
    inputElem &&
    (event.target === inputElem || inputElem.contains(event.target))
  ) {
    return;
  }
  if (!this.template.contains(event.target)) {
    // Auto-select first value if dropdown is open and there are filtered times AND search has meaningful text
    if (this.isDropdownOpen && this.filteredTimes.length > 0 && this.searchKey && this.searchKey.trim()) {
      // console.log(
      //   "Auto-selecting first value:",
      //   this.filteredTimes[0]
      // );
      this.handleSelect({
        currentTarget: {
          dataset: {
            value: this.filteredTimes[0].value,
            label: this.filteredTimes[0].label
          }
        }
      });
    } else if (this.isDropdownOpen && (!this.searchKey || !this.searchKey.trim())) {
      // If search is empty, clear the selection
      // console.log("Clearing selection - empty search");
      this.searchKey = "";
      this.dispatchEvent(new CustomEvent("savetimefromchild", { detail: null }));
    }
    this.isDropdownOpen = false;
  }
};

  // handleClear() {
  //   this.searchKey = "";
  //   this.filteredTimes = this.times15; // already AM → PM
  //   this.isDropdownOpen = true;
  //   this.highlightIndex = -1;
  //   this.setFilteredTimes(this.filteredTimes);

  //   const inputElem = this.template.querySelector('[data-timeinput="true"]');
  //   if (inputElem) inputElem.focus();

  //   this.dispatchEvent(new CustomEvent("savetimefromchild", { detail: null }));
  // }

  handleClear() {
    this.searchKey = "";
    this.filteredTimes = this.times30; // Reset to 15-min intervals
    this.isDropdownOpen = true;
    this.highlightIndex = -1;
    this.setFilteredTimes(this.filteredTimes);

    const inputElem = this.template.querySelector('[data-timeinput="true"]');
    if (inputElem) inputElem.focus();

    this.dispatchEvent(new CustomEvent("savetimefromchild", { detail: null }));
  }
}