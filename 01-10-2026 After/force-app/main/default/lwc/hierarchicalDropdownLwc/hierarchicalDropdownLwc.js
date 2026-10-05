import { LightningElement, track, api } from 'lwc';

export default class HierarchicalDropdownLwc extends LightningElement {
    @api options = [];
    @api value = '';
    @api placeholder = 'Select an option';
    @api variant = 'standard';
    @api disabled = false;

    @track isOpen = false;
    @track expandedItems = [];
    @track selectedOption = null;
    @track searchTerm = '';  // ✅ NEW: For storing search input

    connectedCallback() {
        // Add click outside listener
        document.addEventListener('click', this.handleClickOutside.bind(this));
        
        // Set initial selected option
        this.updateSelectedOption();
    }

    disconnectedCallback() {
        // Remove click outside listener
        document.removeEventListener('click', this.handleClickOutside.bind(this));
    }

    get dropdownButtonClass() {
        return `dropdown-button ${this.isOpen ? 'dropdown-button-open' : ''}`;
    }

    get selectedLabelClass() {
        return this.selectedOption ? 'selected-text' : 'placeholder-text';
    }

    get chevronClass() {
        return `chevron-icon ${this.isOpen ? 'chevron-rotated' : ''}`;
    }

    get displayLabel() {
        return this.selectedOption ? this.selectedOption.label : this.placeholder;
    }

    get containerStyle() {
        return this.variant === 'label-hidden' ? 'margin-bottom: 0;' : '';
    }

    /** ✅ NEW: Compute filtered options for display */
    get filteredOptions() {
    if (!this.searchTerm) {
        // Normal mode
        return this.flattenOptionsForDisplay(this.options, 0, false);
    }
    // Search mode: filter and expand all matches
    const filtered = this.filterOptions(this.options, this.searchTerm.toLowerCase());
    return this.flattenOptionsForDisplay(filtered, 0, true); // ✅ Force expand in search mode
    }

    /** ✅ NEW: Handle search input change */
    handleSearchChange(event) {
         event.stopPropagation();
        this.searchTerm = event.target.value;
    }

    /** ✅ NEW: Filter options recursively based on search term */
    filterOptions(options, searchTerm) {
        let result = [];
        for (const option of options) {
            const labelMatch = option.label.toLowerCase().includes(searchTerm);
            let children = [];
            if (option.children && option.children.length > 0) {
                children = this.filterOptions(option.children, searchTerm);
            }
            if (labelMatch || children.length > 0) {
                result.push({
                    ...option,
                    children: children
                });
            }
        }
        return result;
    }

    /** Flatten hierarchical options for rendering */
    flattenOptionsForDisplay(options, depth, forceExpand = false) {
    let flattened = [];

    options.forEach(option => {
        const hasChildren = option.children && option.children.length > 0;
        const isExpanded = forceExpand ? true : this.expandedItems.includes(option.id); // ✅ Force expand in search mode
        const isSelected = this.value === option.value;
        const isSelectable = !hasChildren;

        const displayOption = {
            ...option,
            depth: depth,
            hasChildren: hasChildren,
            isExpanded: isExpanded,
            isSelected: isSelected,
            isSelectable: isSelectable,
            expandIcon: isExpanded ? 'utility:chevrondown' : 'utility:chevronright',
            cssClass: this.getOptionCssClass(isSelected, isSelectable, depth),
            labelClass: this.getLabelCssClass(hasChildren),
            style: this.getOptionStyle(depth)
        };

        flattened.push(displayOption);

        if (hasChildren && isExpanded) {
            const childOptions = this.flattenOptionsForDisplay(option.children, depth + 1, forceExpand);
            flattened = flattened.concat(childOptions);
        }
    });

    return flattened;
}


    getOptionCssClass(isSelected, isSelectable, depth) {
        let classes = 'option-item';
        
        if (isSelected) {
            classes += ' option-selected';
        }
        
        if (!isSelectable) {
            classes += ' option-category';
        }
        
        if (depth > 0) {
            classes += ' option-nested';
        }
        
        return classes;
    }

    getLabelCssClass(hasChildren) {
        let classes = 'option-label';
        
        if (!hasChildren) {
            classes += ' option-label-indented';
        }
        
        return classes;
    }

    getOptionStyle(depth) {
        const paddingLeft = 12 + (depth * 16);
        return `padding-left: ${paddingLeft}px;`;
    }

    toggleDropdown(event) {
        event.stopPropagation();
        this.isOpen = !this.isOpen;
    }

   handleClickOutside(event) {
    const dropdownContainer = this.template.querySelector('.dropdown-container');
    if (dropdownContainer && !dropdownContainer.contains(event.target)) {
        this.isOpen = false;
    }
}

    handleOptionClick(event) {
        event.stopPropagation();
        
        const optionId = event.currentTarget.dataset.optionId;
        const optionValue = event.currentTarget.dataset.optionValue;
        const hasChildren = event.currentTarget.dataset.hasChildren === 'true';
        
        if (!hasChildren) {
            // Select the option
            this.value = optionValue;
            this.updateSelectedOption();
            this.isOpen = false;
            
            // Dispatch change event
            this.dispatchEvent(new CustomEvent('change', {
                detail: {
                    value: optionValue,
                    option: this.selectedOption
                }
            }));
        } else {
            // Toggle expansion
            this.handleToggleExpansion(optionId);
        }
    }

    handleToggleClick(event) {
        event.preventDefault();
        event.stopPropagation();
        const optionId = event.currentTarget.dataset.optionId;
        this.handleToggleExpansion(optionId);
    }

    stopEvent(event) {
        event.stopPropagation();
    }

    handleToggleExpansion(optionId) {
        const expandedSet = new Set(this.expandedItems);
        
        if (expandedSet.has(optionId)) {
            expandedSet.delete(optionId);
        } else {
            expandedSet.add(optionId);
        }
        
        this.expandedItems = Array.from(expandedSet);
    }

    updateSelectedOption() {
        this.selectedOption = this.findOptionByValue(this.options, this.value);
    }

    findOptionByValue(options, value) {
        if (!value || !options) return null;
        
        for (const option of options) {
            if (option.value === value) return option;
            if (option.children) {
                const found = this.findOptionByValue(option.children, value);
                if (found) return found;
            }
        }
        return null;
    }
}