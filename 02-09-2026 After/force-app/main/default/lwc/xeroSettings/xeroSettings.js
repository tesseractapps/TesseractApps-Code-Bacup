import { LightningElement, track } from "lwc";
import getAllFacilityRoles from "@salesforce/apex/XeroSettingsController.getAllFacilityRoles";
import getXeroSettingByRoleName from "@salesforce/apex/XeroSettingsController.getXeroSettingByRoleName";
import getAllXeroSettings from "@salesforce/apex/XeroSettingsController.getAllXeroSettings";
import saveFacilityXeroSetting from "@salesforce/apex/XeroSettingsController.saveFacilityXeroSetting";
import updateFacilityXeroSetting from "@salesforce/apex/XeroSettingsController.updateFacilityXeroSetting";
import addNewPayItem from "@salesforce/apex/XeroSettingsController.addNewPayItem";
import getEarningsRatesFromXero from "@salesforce/apex/XeroSettingsController.getEarningsRatesFromXero";
import getReimbursementItemsFromXero from "@salesforce/apex/XeroSettingsController.getReimbursementItemsFromXero";
import getCurrentUserOrganisationId from "@salesforce/apex/XeroSettingsController.getCurrentUserOrganisationId";
import deleteMultipleXeroSettings from '@salesforce/apex/XeroSettingsController.deleteMultipleXeroSettings';
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class XeroSettings extends LightningElement {
    // Pay Item Type Options
    payItemTypeOptions = [
        { label: "Earnings Pay Item", value: "Earnings" },
        { label: "Reimbursement", value: "Reimbursement" }
    ];

    @track selectedPayItemType = "";
    @track roleOptions = [];
    @track selectedRole = "";
    @track facilityRoles = [];
    @track showAddPayitemModal = false;
    @track newPayitemName = "";
    @track xeroPayitemOptions = [];
    @track selectedPayitem = "";
    @track selectedPayitemLabel = "";
    @track isLoadingPayItems = false;
    @track organisationId = "";

    // Edit mode properties
    @track isEditMode = false;
    @track editingSettingId = "";
    @track editingRoleName = "";
    @track editingSettingIds = "";
    @track editingFacilityRoleIds = "";

    @track selectedCategory = "";
    @track savedSettings = [];
    @track isLoadingRoles = false;
    @track isLoadingSettings = false;
    @track isSaving = false;
    @track errorMessage = "";

    shiftTypeOptions = [
        { label: "General", value: "General" },
        { label: "Morning", value: "Morning" },
        { label: "Afternoon", value: "Afternoon" },
        { label: "Night", value: "Night" },/*
        { label: "Sleepover", value: "Sleepover" } ,
        { label: "Custom", value: "Custom" } */
    ];

    @track selectedShiftType = "";

    customShiftTypeOptions = [
        { label: "General", value: "General" },
        { label: "Morning", value: "Morning" },
        { label: "Afternoon", value: "Afternoon" },
        { label: "Night", value: "Night" },
        { label: "Sleepover", value: "Sleepover" }
    ];

    @track selectedCustomShiftType = "";

    brokenTypeOptions = [
        { label: "Fixed Rate", value: "Fixed Rate" },
        { label: "Allowance 1", value: "Allowance 1" },
        { label: "Allowance 2", value: "Allowance 2" }
    ];

    @track selectedBrokenType = "";

    sleepoverTypeOptions = [
        { label: "Fixed Rate", value: "Fixed Rate" },
        { label: "Allowance", value: "Allowance" }
    ];

    @track selectedSleepoverType = "";
    @track selectedCustomRateType = "";

    // ============================================================
    // LIFECYCLE HOOKS
    // ============================================================

    connectedCallback() {
        console.log("========================================");
        console.log("🔵 Xero Settings connected");
        console.log("========================================");

        this.initializeXeroSettings();
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================

    async initializeXeroSettings() {
        try {
            console.log('🔐 Fetching Organisation Id for logged-in user...');
            const organisationId = await getCurrentUserOrganisationId();
            console.log('🏢 Current User Organisation Id:', organisationId);

            if (!organisationId) {
                this.errorMessage = 'No Organisation is associated with the current user.';
                console.error('❌ No Organisation found for current user.');
                return;
            }

            this.organisationId = organisationId;
            console.log('✅ Organisation Id stored:', this.organisationId);

            this.loadRoles();
            await this.loadSavedSettingsImperative();

        } catch (error) {
            console.error('❌ Error initializing Xero Settings:', error);
            this.errorMessage = this.getErrorMessage(error);
        }
    }

    // ============================================================
    // LOAD ROLES
    // ============================================================

    loadRoles() {
        if (!this.organisationId) {
            return;
        }

        this.isLoadingRoles = true;
        this.errorMessage = "";

        getAllFacilityRoles({
            organisationId: this.organisationId
        })
            .then((result) => {
                console.log("✅ All Facility Roles:", JSON.stringify(result));
                this.facilityRoles = result || [];

                const uniqueRoles = new Map();
                this.facilityRoles.forEach((role) => {
                    if (role.Role_Name__c && role.Role_Name__c.trim()) {
                        const roleName = role.Role_Name__c.trim();
                        const key = roleName.toLowerCase();
                        if (!uniqueRoles.has(key)) {
                            uniqueRoles.set(key, {
                                label: roleName,
                                value: roleName
                            });
                        }
                    }
                });

                this.roleOptions = Array.from(uniqueRoles.values());
                console.log("🎯 Distinct Role Options:", JSON.stringify(this.roleOptions));
            })
            .catch((error) => {
                console.error("❌ Error loading Facility Roles:", error);
                this.facilityRoles = [];
                this.roleOptions = [];
                this.errorMessage = this.getErrorMessage(error);
            })
            .finally(() => {
                this.isLoadingRoles = false;
            });
    }

    // ============================================================
    // LOAD PAY ITEMS FROM XERO BASED ON TYPE
    // ============================================================

    loadPayItemsFromXero() {
        if (!this.selectedPayItemType) {
            this.xeroPayitemOptions = [];
            this.selectedPayitem = "";
            this.selectedPayitemLabel = "";
            return;
        }

        this.isLoadingPayItems = true;

        let apexMethod;
        if (this.selectedPayItemType === 'Earnings') {
            apexMethod = getEarningsRatesFromXero();
        } else {
            // Reimbursement
            apexMethod = getReimbursementItemsFromXero();
        }

        apexMethod
            .then((result) => {
                console.log(`✅ ${this.selectedPayItemType} items from Xero:`, JSON.stringify(result));
                
                const hasItems = result && Array.isArray(result) && result.length > 0;
                let options = [];
                
                if (hasItems) {
                    options = result.map((item) => {
                        return {
                            label: item.label,
                            value: item.value
                        };
                    });
                    
                    // Sort alphabetically
                    options.sort((a, b) => a.label.localeCompare(b.label));
                }
                
                // Always add "Add New PayItem" option
                options.push({
                    label: "Add New PayItem",
                    value: "add-new"
                });
                
                this.xeroPayitemOptions = options;
                
                // Auto-select first pay item only if not in edit mode and no selection
                if (!this.isEditMode && !this.selectedPayitem && hasItems) {
                    const firstPayItem = options.find(opt => opt.value !== "add-new");
                    if (firstPayItem) {
                        this.selectedPayitem = firstPayItem.value;
                        this.selectedPayitemLabel = firstPayItem.label;
                        console.log(`✅ Auto-selected ${this.selectedPayItemType}:`, this.selectedPayitemLabel);
                    }
                }
                
                console.log(`🎯 Xero ${this.selectedPayItemType} Options Count:`, this.xeroPayitemOptions.length);
            })
            .catch((error) => {
                console.error(`❌ Error loading ${this.selectedPayItemType} items from Xero:`, error);
                // Ensure "Add New" is available even on error
                this.xeroPayitemOptions = [
                    {
                        label: "Add New PayItem",
                        value: "add-new"
                    }
                ];
                this.selectedPayitem = "";
                this.selectedPayitemLabel = "";
                this.showToast(
                    "Warning",
                    `Could not load ${this.selectedPayItemType} items from Xero. Please try again.`,
                    "warning"
                );
            })
            .finally(() => {
                this.isLoadingPayItems = false;
            });
    }

    // ============================================================
    // IMPERATIVE METHOD TO LOAD SAVED SETTINGS
    // ============================================================

    async loadSavedSettingsImperative() {
        console.log("========================================");
        console.log("📥 loadSavedSettingsImperative called");
        console.log("Organisation ID:", this.organisationId);
        console.log("========================================");

        if (!this.organisationId) {
            console.warn('⚠️ Cannot load Xero Settings: Organisation Id is not available.');
            this.showToast(
                "Warning",
                "Organisation ID not available. Please refresh the page.",
                "warning"
            );
            return;
        }

        this.isLoadingSettings = true;
        this.savedSettings = [];
        this.pageNumber = 1;

        try {
            const result = await getAllXeroSettings({
                organisationId: this.organisationId
            });

            console.log("✅ Xero Settings API Response:", JSON.stringify(result));

            if (!result) {
                console.warn("⚠️ No results returned from API");
                this.savedSettings = [];
                return;
            }

            // Map the results with computed display properties
            this.savedSettings = result.map((setting) => {
                let countVariant = "neutral";
                if (setting.facilityCount > 1) {
                    countVariant = "brand";
                } else if (setting.facilityCount === 0) {
                    countVariant = "light";
                }

                return {
                    Id: setting.Id,
                    Name: setting.Name || "",
                    roleName: setting.roleName || "",
                    Xero_Payitem__c: setting.Xero_Payitem__c || "",
                    Xero_Payitem_Name__c: setting.Xero_Payitem_Name__c || "",
                    Category__c: setting.Category__c || "",
                    Shift_Type__c: setting.Shift_Type__c || "",
                    Custom_Shift_Type__c: setting.Custom_Shift_Type__c || "",
                    Broken_Type__c: setting.Broken_Type__c || "",
                    Sleepover_Type__c: setting.Sleepover_Type__c || "",
                    Custom_Rate_Type__c: setting.Custom_Rate_Type__c || "",
                    Pay_Item_Type__c: setting.Pay_Item_Type__c || "Earnings",
                    facilityRoleIds: setting.facilityRoleIds || "",
                    facilities: setting.facilities || "",
                    settingIds: setting.settingIds || "",
                    facilityCount: setting.facilityCount || 0,
                    facilityCountVariant: countVariant
                };
            });

            console.log("📋 Table Data Count (Grouped):", this.savedSettings.length);

            if (this.savedSettings.length === 0) {
                console.log("ℹ️ No saved settings found");
            }

        } catch (error) {
            console.error("❌ Error loading saved settings:", error);
            this.savedSettings = [];
            this.showToast(
                "Error",
                "Failed to load saved settings: " + this.getErrorMessage(error),
                "error"
            );
        } finally {
            this.isLoadingSettings = false;
        }
    }

    // ============================================================
    // GETTERS
    // ============================================================

    get isRoleDisabled() {
        return this.isEditMode || !this.selectedPayItemType;
    }

    get isEarningsSelected() {
        return this.selectedPayItemType === 'Earnings';
    }

    get isReimbursementSelected() {
        return this.selectedPayItemType === 'Reimbursement';
    }

    get payitemLabel() {
        return this.isReimbursementSelected ? 'Xero Reimbursement Item' : 'Xero Payitem';
    }

    get payitemPlaceholder() {
        return this.isReimbursementSelected ? 'Select Reimbursement Item' : 'Select Xero Payitem';
    }

    get savedSettingsWithDisplayValues() {
        if (!this.savedSettings || this.savedSettings.length === 0) {
            return [];
        }

        return this.savedSettings.map((setting) => {
            let rowClass = '';
            if (this.isEditMode && this.editingSettingId === setting.Id) {
                rowClass = 'editing-row';
            }

            return {
                ...setting,
                customShiftDisplay: setting.Custom_Shift_Type__c || '-',
                brokenTypeDisplay: setting.Broken_Type__c || '-',
                sleepoverTypeDisplay: setting.Sleepover_Type__c || '-',
                customRateTypeDisplay: setting.Custom_Rate_Type__c || '-',
                payItemTypeDisplay: setting.Pay_Item_Type__c || 'Earnings',
                rowClass: rowClass
            };
        });
    }

    get isCustomShiftType() {
        return this.selectedShiftType === "Custom";
    }

    get isBrokenShiftType() {
        return this.selectedShiftType === "Broken";
    }

    get isSleepoverShiftType() {
        return this.selectedShiftType === "Sleepover";
    }

    get isCustomRateTypeVisible() {
        return this.selectedShiftType === "Custom" &&
            (this.selectedCustomShiftType === "General" || this.selectedCustomShiftType === "Morning");
    }

    get customRateTypeOptions() {
        if (this.selectedCustomShiftType === "General") {
            return [
                { label: "General Rate 1", value: "General Rate 1" },
                { label: "General Rate 2", value: "General Rate 2" }
            ];
        }
        if (this.selectedCustomShiftType === "Morning") {
            return [
                { label: "Morning Rate 1", value: "Morning Rate 1" },
                { label: "Morning Rate 2", value: "Morning Rate 2" }
            ];
        }
        return [];
    }

    get isShiftTypeDisabled() {
        return !this.selectedRole;
    }

    get isReimbursementExists() {
        if (!this.savedSettings || this.savedSettings.length === 0) {
            return false;
        }
        return this.savedSettings.some(setting => setting.Pay_Item_Type__c === 'Reimbursement');
    }

    get isReimbursementExistsError() {
        return this.isReimbursementSelected && this.isReimbursementExists && !this.isEditMode;
    }

    get isSaveDisabled() {
        if (this.isSaving) {
            return true;
        }

        if (!this.selectedPayItemType) {
            return true;
        }

        if (!this.selectedPayitem) {
            return true;
        }

        /*
        * ============================================================
        * REIMBURSEMENT
        * ============================================================
        */
        if (this.isReimbursementSelected) {
            if (!this.isEditMode && this.isReimbursementExists) {
                return true;
            }
            return false;
        }

        /*
        * ============================================================
        * EARNINGS
        * ============================================================
        */
        if (
            !this.selectedRole ||
            !this.selectedCategory ||
            !this.selectedShiftType
        ) {
            return true;
        }

        if (
            this.selectedShiftType === "Custom" &&
            !this.selectedCustomShiftType
        ) {
            return true;
        }

        if (
            this.selectedShiftType === "Broken" &&
            !this.selectedBrokenType
        ) {
            return true;
        }

        if (
            this.selectedShiftType === "Sleepover" &&
            !this.selectedSleepoverType
        ) {
            return true;
        }

        if (
            this.isCustomRateTypeVisible &&
            !this.selectedCustomRateType
        ) {
            return true;
        }

        return false;
    }

    get isAddButtonDisabled() {
        return !this.newPayitemName || !this.newPayitemName.trim();
    }

    // ============================================================
    // HANDLE PAY ITEM TYPE CHANGE
    // ============================================================

    handlePayItemTypeChange(event) {
        if (this.isEditMode) {
            return;
        }

        this.selectedPayItemType = event.detail.value;
        console.log("🎯 Selected Pay Item Type:", this.selectedPayItemType);

        // Reset ALL form fields
        this.selectedRole = "";
        this.selectedPayitem = "";
        this.selectedPayitemLabel = "";
        this.selectedCategory = "";
        this.selectedShiftType = "";
        this.selectedCustomShiftType = "";
        this.selectedBrokenType = "";
        this.selectedSleepoverType = "";
        this.selectedCustomRateType = "";
        this.xeroPayitemOptions = [];

        // Load pay items based on selected type
        this.loadPayItemsFromXero();
    }

    // ============================================================
    // HANDLE EDIT
    // ============================================================

    handleEdit(event) {
        const settingId = event.currentTarget.dataset.id;
        const roleName = event.currentTarget.dataset.role;
        const shiftType = event.currentTarget.dataset.shiftType;
        const category = event.currentTarget.dataset.category;
        const payitem = event.currentTarget.dataset.payitem;
        const payitemName = event.currentTarget.dataset.payitemName;
        const customShift = event.currentTarget.dataset.customShift;
        const brokenType = event.currentTarget.dataset.brokenType;
        const sleepoverType = event.currentTarget.dataset.sleepoverType;
        const customRateType = event.currentTarget.dataset.customRateType;
        const payItemType = event.currentTarget.dataset.payItemType || "Earnings";

        console.log('✏️ Edit clicked for Setting ID:', settingId);
        console.log('Pay Item Type:', payItemType);
        console.log('category',category);

        const setting = this.savedSettings.find(s => s.Id === settingId);

        if (!setting) {
            this.showToast(
                'Error',
                'Unable to find the setting to edit.',
                'error'
            );
            return;
        }

        this.isEditMode = true;
        this.editingSettingId = settingId;
        this.editingRoleName = roleName;
        this.editingSettingIds = setting.settingIds || '';
        this.editingFacilityRoleIds = setting.facilityRoleIds || '';

        // Set Pay Item Type
        this.selectedPayItemType = payItemType;
        
        // Load pay items - this will NOT auto-populate because isEditMode is true
        this.loadPayItemsFromXero();

        // Populate the form with existing values
        this.selectedRole = roleName || '';
        this.selectedPayitem = payitem || '';
        this.selectedPayitemLabel = payitemName || '';

        // Only populate earnings fields if it's an Earnings type
        if (payItemType === 'Earnings') {
            this.selectedShiftType = shiftType || '';
            this.selectedCategory = category || '';
            this.selectedCustomShiftType = customShift || '';
            this.selectedBrokenType = brokenType || '';
            this.selectedSleepoverType = sleepoverType || '';
            this.selectedCustomRateType = customRateType || '';
        } else {
            // For Reimbursement, clear all earnings-specific fields
            this.selectedShiftType = '';
            this.selectedCategory = '';
            this.selectedCustomShiftType = '';
            this.selectedBrokenType = '';
            this.selectedSleepoverType = '';
            this.selectedCustomRateType = '';
        }

        console.log('✅ Edit mode enabled with values populated');
    }

    // ============================================================
    // HANDLE CANCEL EDIT
    // ============================================================

    handleCancelEdit() {
        console.log('❌ Cancelling edit mode');

        this.isEditMode = false;
        this.editingSettingId = '';
        this.editingRoleName = '';
        this.editingSettingIds = '';
        this.editingFacilityRoleIds = '';

        // Clear form
        this.selectedPayItemType = '';
        this.selectedRole = '';
        this.selectedShiftType = '';
        this.selectedCategory = '';
        this.selectedPayitem = '';
        this.selectedPayitemLabel = '';
        this.selectedCustomShiftType = '';
        this.selectedBrokenType = '';
        this.selectedSleepoverType = '';
        this.selectedCustomRateType = '';
        this.xeroPayitemOptions = [];

        this.loadSavedSettingsImperative();

        this.showToast(
            'Info',
            'Edit cancelled. No changes were made.',
            'info'
        );
    }

    // ============================================================
    // HANDLE ROLE CHANGE
    // ============================================================

    handleRoleChange(event) {
        if (this.isEditMode) {
            return;
        }

        this.selectedRole = event.detail.value;
        console.log("🎯 Selected Role:", this.selectedRole);

        // Reset all fields
        this.selectedPayitem = "";
        this.selectedPayitemLabel = "";
        this.selectedCategory = "";
        this.selectedShiftType = "";
        this.selectedCustomShiftType = "";
        this.selectedBrokenType = "";
        this.selectedSleepoverType = "";
        this.selectedCustomRateType = "";
    }

    // ============================================================
    // HANDLE PAYITEM CHANGE
    // ============================================================

    handlePayitemChange(event) {
        const selectedValue = event.detail.value;
        console.log("🎯 Xero Payitem selected value:", selectedValue);

        if (selectedValue === "add-new") {
            const nameParts = [];

            if (this.selectedPayItemType) {
                nameParts.push(this.selectedPayItemType);
            }

            // Only add role and earnings-specific parts if Earnings is selected
            if (this.isEarningsSelected) {
                if (this.selectedRole) {
                    nameParts.push(this.selectedRole);
                }

                if (this.selectedShiftType) {
                    nameParts.push(this.selectedShiftType);
                }

                // Sub-category goes BEFORE Category, only for Custom/Broken/Sleepover
                if (this.selectedShiftType === "Custom" && this.selectedCustomShiftType) {
                    nameParts.push(this.selectedCustomShiftType);
                } else if (this.selectedShiftType === "Broken" && this.selectedBrokenType) {
                    nameParts.push(this.selectedBrokenType);
                } else if (this.selectedShiftType === "Sleepover" && this.selectedSleepoverType) {
                    nameParts.push(this.selectedSleepoverType);
                }

                if (this.isCustomRateTypeVisible && this.selectedCustomRateType) {
                    nameParts.push(this.selectedCustomRateType);
                }

                if (this.selectedCategory) {
                    nameParts.push(this.selectedCategory);
                }
            }

            const defaultName = nameParts.join("_");

            this.showAddPayitemModal = true;
            this.newPayitemName = defaultName;
            this.selectedPayitem = "";
            this.selectedPayitemLabel = "";

            console.log("📝 Default PayItem Name:", defaultName);
        } else {
            this.selectedPayitem = selectedValue;

            const selectedOption = this.xeroPayitemOptions.find(
                option => option.value === selectedValue
            );

            this.selectedPayitemLabel = selectedOption ? selectedOption.label : "";

            console.log("🏷️ Xero Payitem label:", this.selectedPayitemLabel);
            console.log("🔑 Xero Payitem value:", this.selectedPayitem);
        }
    }

    // ============================================================
    // HANDLE NEW PAYITEM
    // ============================================================

    handleNewPayitemChange(event) {
        this.newPayitemName = event.detail.value;
    }

    // ============================================================
    // HANDLE ADD NEW PAYITEM - UPDATED WITH PROPER REFRESH
    // ============================================================

    handleAddNewPayitem() {
        if (!this.newPayitemName || !this.newPayitemName.trim()) {
            this.showToast(
                "Error",
                "Please enter a valid payitem name.",
                "error"
            );
            return;
        }

        const trimmedName = this.newPayitemName.trim();

        // Check if exists in current options (not "add-new")
        const exists = this.xeroPayitemOptions.some(
            option =>
                option.value !== "add-new" &&
                option.label &&
                option.label.toLowerCase() === trimmedName.toLowerCase()
        );

        if (exists) {
            this.showToast(
                "Error",
                `"${trimmedName}" already exists.`,
                "error"
            );
            return;
        }

        this.isSaving = true;

        addNewPayItem({
            payItemName: trimmedName,
            payItemType: this.selectedPayItemType || "Earnings"
        })
            .then(async (result) => {
                console.log("✅ PayItem added successfully:", JSON.stringify(result));

                let response = result;

                if (typeof result === "string") {
                    try {
                        response = JSON.parse(result);
                    } catch (e) {
                        console.error("❌ Unable to parse addNewPayItem response:", e);
                        this.showToast(
                            "Error",
                            "Invalid response received from Xero. Please try again.",
                            "error"
                        );
                        this.isSaving = false;
                        return;
                    }
                }

                console.log("📦 Parsed PayItem Response:", JSON.stringify(response));

                // ============================================================
                // EXISTING PAYITEM
                // ============================================================
                if (response.status === "exists") {
                    const xeroId = response.Id;
                    const xeroName = response.payItemName || trimmedName;

                    if (!xeroId) {
                        this.showToast(
                            "Warning",
                            `"${xeroName}" already exists in Xero, but the ID could not be retrieved. Refreshing the list...`,
                            "warning"
                        );
                        // Close modal and refresh
                        this.showAddPayitemModal = false;
                        this.newPayitemName = "";
                        await this.loadPayItemsFromXero();
                        this.isSaving = false;
                        return;
                    }

                    // Add to options if not already present
                    this.addPayItemToOptions(xeroId, xeroName);
                    
                    this.selectedPayitem = xeroId;
                    this.selectedPayitemLabel = xeroName;

                    this.showAddPayitemModal = false;
                    this.newPayitemName = "";

                    this.showToast(
                        "Info",
                        `"${xeroName}" already exists in Xero and has been selected.`,
                        "info"
                    );

                    this.isSaving = false;
                    return;
                }

                // ============================================================
                // NEW PAYITEM CREATED
                // ============================================================
                if (response.status === "success") {
                    const xeroId = response.Id;
                    const xeroName = response.payItemName || trimmedName;

                    console.log("🆕 New Xero PayItem - ID:", xeroId);
                    console.log("🆕 New Xero PayItem - Name:", xeroName);

                    // Close modal first
                    this.showAddPayitemModal = false;
                    this.newPayitemName = "";

                    // If we have the ID directly, add it immediately
                    if (xeroId) {
                        console.log("✅ PayItem has ID, adding to dropdown immediately");
                        this.addPayItemToOptions(xeroId, xeroName);
                        this.selectedPayitem = xeroId;
                        this.selectedPayitemLabel = xeroName;
                        
                        this.showToast(
                            "Success",
                            `"${xeroName}" has been added successfully to Xero and is now selected.`,
                            "success"
                        );
                        
                        this.isSaving = false;
                        return;
                    }

                    // If no ID, we need to refresh and find it
                    console.log("⚠️ No ID returned, refreshing list to find the item...");
                    
                    this.showToast(
                        "Info",
                        `"${xeroName}" was created in Xero. Refreshing the list to select it...`,
                        "info"
                    );

                    // IMPORTANT: Wait for Xero to process the new item
                    // Try multiple times with increasing delays
                    let foundItem = null;
                    let attempts = 0;
                    const maxAttempts = 5;
                    
                    while (attempts < maxAttempts && !foundItem) {
                        attempts++;
                        const delayMs = attempts * 400; // 400ms, 800ms, 1200ms, 1600ms, 2000ms
                        
                        console.log(`🔄 Attempt ${attempts} of ${maxAttempts} - Waiting ${delayMs}ms before checking...`);
                        
                        // Wait before checking
                        await this.delay(delayMs);
                        
                        // Refresh the list
                        await this.loadPayItemsFromXero();
                        
                        // Try to find the newly created item in the refreshed list
                        foundItem = this.xeroPayitemOptions.find(
                            option => 
                                option.label && 
                                option.label.toLowerCase() === xeroName.toLowerCase() &&
                                option.value !== "add-new"
                        );
                        
                        if (foundItem) {
                            console.log(`✅ Found item on attempt ${attempts}!`);
                            break;
                        }
                        
                        console.log(`⚠️ Item not found on attempt ${attempts}, will retry...`);
                    }

                    if (foundItem) {
                        this.selectedPayitem = foundItem.value;
                        this.selectedPayitemLabel = foundItem.label;
                        
                        console.log("✅ Found and selected the newly created PayItem:", foundItem);
                        
                        this.showToast(
                            "Success",
                            `"${xeroName}" has been added successfully to Xero and is now selected.`,
                            "success"
                        );
                    } else {
                        // One final refresh without selection
                        await this.loadPayItemsFromXero();
                        
                        this.showToast(
                            "Warning",
                            `"${xeroName}" was created in Xero, but could not be selected automatically. Please select it from the dropdown list.`,
                            "warning"
                        );
                        this.selectedPayitem = "";
                        this.selectedPayitemLabel = "";
                    }

                    this.isSaving = false;
                    return;
                }

                // ============================================================
                // ERROR RESPONSE
                // ============================================================
                throw new Error(
                    response.message || "Failed to add PayItem to Xero."
                );
            })
            .catch((error) => {
                console.error("❌ Error adding new PayItem:", error);

                this.showToast(
                    "Error",
                    this.getErrorMessage(error),
                    "error"
                );
                
                this.isSaving = false;
            })
            .finally(() => {
                // Ensure loading state is cleared
                this.isSaving = false;
            });
    }

    // ============================================================
    // HELPER: ADD PAYITEM TO OPTIONS
    // ============================================================

    addPayItemToOptions(id, name) {
        console.log("📝 Adding PayItem to options - ID:", id, "Name:", name);
        
        // Get current options without "add-new"
        const optionsWithoutAddNew = this.xeroPayitemOptions.filter(
            option => option.value !== "add-new"
        );
        
        // Check if already exists
        const exists = optionsWithoutAddNew.some(
            option => option.value === id || option.label === name
        );
        
        if (!exists) {
            // Add new item
            optionsWithoutAddNew.push({
                label: name,
                value: id
            });
            
            // Sort alphabetically
            optionsWithoutAddNew.sort((a, b) => a.label.localeCompare(b.label));
            
            // Add "Add New PayItem" at the end
            optionsWithoutAddNew.push({
                label: "Add New PayItem",
                value: "add-new"
            });
            
            // Update the options
            this.xeroPayitemOptions = optionsWithoutAddNew;
            
            console.log("✅ Updated PayItem options count:", this.xeroPayitemOptions.length);
        } else {
            console.log("ℹ️ PayItem already exists in options");
        }
    }

    // ============================================================
    // HELPER: DELAY
    // ============================================================

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ============================================================
    // HANDLE MODAL CLOSE
    // ============================================================

    handleModalClose() {
        this.showAddPayitemModal = false;
        this.newPayitemName = "";
        if (this.selectedPayitem === "add-new") {
            this.selectedPayitem = "";
            this.selectedPayitemLabel = "";
        }
    }

    // ============================================================
    // HANDLE CATEGORY CHANGE
    // ============================================================

    handleCategoryChange(event) {
        this.selectedCategory = event.detail.value;
        console.log("🎯 Category:", this.selectedCategory);
    }

    // ============================================================
    // HANDLE SHIFT TYPE CHANGE
    // ============================================================

    handleShiftTypeChange(event) {
        this.selectedShiftType = event.detail.value;
        console.log("🎯 Selected Shift Type:", this.selectedShiftType);

        // Reset category when shift type changes since options will change
        this.selectedCategory = "";

        if (this.selectedShiftType !== "Custom") {
            this.selectedCustomShiftType = "";
            this.selectedCustomRateType = "";
        }

        if (this.selectedShiftType !== "Broken") {
            this.selectedBrokenType = "";
        }

        if (this.selectedShiftType !== "Sleepover") {
            this.selectedSleepoverType = "";
        }
    }

    // ============================================================
    // HANDLE CUSTOM SHIFT TYPE CHANGE
    // ============================================================

    handleCustomShiftTypeChange(event) {
        this.selectedCustomShiftType = event.detail.value;
        this.selectedCustomRateType = "";
        console.log("🎯 Selected Custom Shift Type:", this.selectedCustomShiftType);
    }

    // ============================================================
    // HANDLE BROKEN TYPE CHANGE
    // ============================================================

    handleBrokenTypeChange(event) {
        this.selectedBrokenType = event.detail.value;
        console.log("🎯 Selected Broken Type:", this.selectedBrokenType);
    }

    // ============================================================
    // HANDLE SLEEPOVER TYPE CHANGE
    // ============================================================

    handleSleepoverTypeChange(event) {
        this.selectedSleepoverType = event.detail.value;
        console.log("🎯 Selected Sleepover Rate Type:", this.selectedSleepoverType);
    }

    // ============================================================
    // HANDLE CUSTOM RATE TYPE CHANGE
    // ============================================================

    handleCustomRateTypeChange(event) {
        this.selectedCustomRateType = event.detail.value;
        console.log("🎯 Selected Custom Rate Type:", this.selectedCustomRateType);
    }

    // ============================================================
    // HANDLE SAVE / UPDATE
    // ============================================================

    async handleSave() {
        if (this.isSaveDisabled) {
            this.showToast(
                "Error",
                "Please complete all required fields before saving.",
                "error"
            );
            return;
        }

        if (this.isEditMode) {
            await this.handleUpdate();
        } else {
            await this.handleCreate();
        }
    }

    // ============================================================
    // HANDLE CREATE (Save New)
    // ============================================================

    async handleCreate() {
        console.log("========================================");
        console.log("💾 Creating New Xero Setting");
        console.log("Pay Item Type:", this.selectedPayItemType);
        console.log("Role:", this.selectedRole || 'N/A for Reimbursement');
        console.log("Payitem:", this.selectedPayitem);
        console.log("========================================");

        this.isSaving = true;

        try {
            // For Reimbursement, we don't need a role
            let roleName = this.selectedRole;
            let category = this.selectedCategory;
            let shiftType = this.selectedShiftType;
            let customShiftType = this.selectedCustomShiftType;
            let brokenType = this.selectedBrokenType;
            let sleepoverType = this.selectedSleepoverType;
            let customRateType = this.selectedCustomRateType;

            if (this.isReimbursementSelected) {
                // For Reimbursement, use a default role name
                roleName = null;
                category = null;
                shiftType = null;
                customShiftType = null;
                brokenType = null;
                sleepoverType = null;
                customRateType = null;
            }

            const result = await saveFacilityXeroSetting({
                organisationId: this.organisationId,
                payItemType: this.selectedPayItemType,
                roleName: roleName,
                xeroPayitem: this.selectedPayitem,
                xeroPayitemName: this.selectedPayitemLabel,
                category: category,
                shiftType: shiftType,
                customShiftType: customShiftType,
                brokenType: brokenType,
                sleepoverType: sleepoverType,
                customRateType: customRateType
            });

            console.log("✅ Xero Setting saved:", JSON.stringify(result));

            this.showToast(
                "Success",
                "Xero setting(s) saved successfully.",
                "success"
            );

            this.savedSettings = [];
            this.isLoadingSettings = true;

            await this.loadSavedSettingsImperative();

            // Reset form
            this.selectedPayItemType = "";
            this.selectedRole = "";
            this.selectedPayitem = "";
            this.selectedPayitemLabel = "";
            this.selectedCategory = "";
            this.selectedShiftType = "";
            this.selectedCustomShiftType = "";
            this.selectedBrokenType = "";
            this.selectedSleepoverType = "";
            this.selectedCustomRateType = "";
            this.xeroPayitemOptions = [];

        } catch (error) {
            console.error("❌ Save Xero Setting error:", error);
            this.showToast(
                "Error",
                this.getErrorMessage(error),
                "error"
            );
        } finally {
            this.isSaving = false;
        }
    }

    // ============================================================
    // HANDLE UPDATE (Update Existing)
    // ============================================================

    async handleUpdate() {
        console.log("========================================");
        console.log("🔄 Updating Xero Setting");
        console.log("Editing Setting ID:", this.editingSettingId);
        console.log("Setting IDs to update:", this.editingSettingIds);
        console.log("Pay Item Type:", this.selectedPayItemType);
        console.log("Role:", this.selectedRole || 'N/A for Reimbursement');
        console.log("Payitem:", this.selectedPayitem);
        console.log("========================================");

        this.isSaving = true;

        try {
            let roleName = this.selectedRole;
            let category = this.selectedCategory;
            let shiftType = this.selectedShiftType;
            let customShiftType = this.selectedCustomShiftType;
            let brokenType = this.selectedBrokenType;
            let sleepoverType = this.selectedSleepoverType;
            let customRateType = this.selectedCustomRateType;

            if (this.isReimbursementSelected) {
                roleName = null;
                category = null;
                shiftType = null;
                customShiftType = null;
                brokenType = null;
                sleepoverType = null;
                customRateType = null;
            }

            const result = await updateFacilityXeroSetting({
                organisationId: this.organisationId,
                settingIds: this.editingSettingIds,
                payItemType: this.selectedPayItemType,
                roleName: roleName,
                xeroPayitem: this.selectedPayitem,
                xeroPayitemName: this.selectedPayitemLabel,
                category: category,
                shiftType: shiftType,
                customShiftType: customShiftType,
                brokenType: brokenType,
                sleepoverType: sleepoverType,
                customRateType: customRateType
            });

            console.log("✅ Xero Settings updated:", JSON.stringify(result));

            this.showToast(
                "Success",
                "Xero setting(s) updated successfully.",
                "success"
            );

            this.isEditMode = false;
            this.editingSettingId = "";
            this.editingRoleName = "";
            this.editingSettingIds = "";
            this.editingFacilityRoleIds = "";

            this.savedSettings = [];
            this.isLoadingSettings = true;
            await this.loadSavedSettingsImperative();

            // Reset form
            this.selectedPayItemType = "";
            this.selectedRole = "";
            this.selectedPayitem = "";
            this.selectedPayitemLabel = "";
            this.selectedCategory = "";
            this.selectedShiftType = "";
            this.selectedCustomShiftType = "";
            this.selectedBrokenType = "";
            this.selectedSleepoverType = "";
            this.selectedCustomRateType = "";
            this.xeroPayitemOptions = [];

        } catch (error) {
            console.error("❌ Update Xero Setting error:", error);
            this.showToast(
                "Error",
                this.getErrorMessage(error),
                "error"
            );
        } finally {
            this.isSaving = false;
        }
    }

    // ============================================================
    // HANDLE CANCEL
    // ============================================================

    handleCancel() {
        this.selectedPayItemType = "";
        this.selectedRole = "";
        this.selectedPayitem = "";
        this.selectedPayitemLabel = "";
        this.selectedCategory = "";
        this.selectedShiftType = "";
        this.selectedCustomShiftType = "";
        this.selectedBrokenType = "";
        this.selectedSleepoverType = "";
        this.selectedCustomRateType = "";
        this.xeroPayitemOptions = [];
    }

    // ============================================================
    // HANDLE BACK
    // ============================================================

    handleBack() {
        this.dispatchEvent(new CustomEvent("back"));
    }

    // ============================================================
    // HANDLE DELETE
    // ============================================================

    async handleDelete(event) {
        const settingId = event.currentTarget.dataset.id;
        const settingIds = event.currentTarget.dataset.settingIds;

        console.log('🗑️ Delete clicked for Setting ID:', settingId);
        console.log('🗑️ All Setting IDs to delete:', settingIds);

        if (!settingId || !settingIds) {
            this.showToast(
                'Error',
                'Unable to identify the Xero setting(s).',
                'error'
            );
            return;
        }

        const settingIdArray = settingIds.split(',').map(id => id.trim());
        const count = settingIdArray.length;

        try {
            await deleteMultipleXeroSettings({
                settingIds: settingIds,
                organisationId: this.organisationId
            });

            const successMessage = count > 1
                ? `${count} Xero settings deleted successfully.`
                : 'Xero setting deleted successfully.';

            this.showToast(
                'Success',
                successMessage,
                'success'
            );

            await this.loadSavedSettingsImperative();

        } catch (error) {
            console.error('❌ Error deleting Xero Settings:', error);
            this.showToast(
                'Error',
                this.getErrorMessage(error),
                'error'
            );
        } finally {
            this.isLoadingSettings = false;
        }
    }

    // ============================================================
    // UTILITY METHODS
    // ============================================================

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }

    getErrorMessage(error) {
        if (error && error.body && error.body.message) {
            return error.body.message;
        }
        if (error && error.message) {
            return error.message;
        }
        return "An unexpected error occurred.";
    }

    // Replace the static categoryOptions with a getter
    get categoryOptions() {
        // All available categories
        const allCategories = [
            { label: "Ordinary", value: "Ordinary" },
            { label: "Morning", value: "Morning" },
            { label: "Afternoon", value: "Afternoon" },
            { label: "Night", value: "Night" },
            { label: "Sleepover", value: "Sleepover" },
            { label: "Saturday", value: "Saturday" },
            { label: "Sunday", value: "Sunday" },
            { label: "Public Holiday", value: "Public Holiday" }
        ];

        // Base categories that are always available
        const baseCategories = [
            { label: "Ordinary", value: "Ordinary" },
            { label: "Saturday", value: "Saturday" },
            { label: "Sunday", value: "Sunday" },
            { label: "Public Holiday", value: "Public Holiday" }
        ];

        // If no shift type selected, return only Ordinary
        if (!this.selectedShiftType) {
            return [{ label: "Ordinary", value: "Ordinary" }];
        }

        // Categories based on Shift Type
        const shiftTypeCategories = {
            'General': baseCategories,
            'Morning': [
                { label: "Morning", value: "Morning" },
                { label: "Saturday", value: "Saturday" },
                { label: "Sunday", value: "Sunday" },
                { label: "Public Holiday", value: "Public Holiday" }
            ],
            'Afternoon': [
                { label: "Afternoon", value: "Afternoon" },
                { label: "Saturday", value: "Saturday" },
                { label: "Sunday", value: "Sunday" },
                { label: "Public Holiday", value: "Public Holiday" }
            ],
            'Night': [
                { label: "Night", value: "Night" },
                { label: "Saturday", value: "Saturday" },
                { label: "Sunday", value: "Sunday" },
                { label: "Public Holiday", value: "Public Holiday" }
            ],
            'Sleepover': [
                { label: "Sleepover", value: "Sleepover" },
                { label: "Saturday", value: "Saturday" },
                { label: "Sunday", value: "Sunday" },
                { label: "Public Holiday", value: "Public Holiday" }
            ],
            'Broken': allCategories,  // Show ALL categories for Broken
            'Custom': allCategories   // Show ALL categories for Custom
        };

        // Return categories based on selected shift type, or base if not found
        return shiftTypeCategories[this.selectedShiftType] || baseCategories;
    }


// ============================================================
// PAGINATION
// ============================================================

@track pageSizeOptions = [10, 25, 50];
@track pageSize = 10;
@track pageNumber = 1;
// ============================================================
// PAGINATION GETTERS
// ============================================================

get totalRecords() {
    return this.savedSettings.length;
}

get totalPages() {
    return Math.max(
        1,
        Math.ceil(
            this.totalRecords / this.pageSize
        )
    );
}

get bDisableFirst() {
    return this.pageNumber === 1;
}

get bDisableLast() {
    return this.pageNumber >= this.totalPages;
}

get pagedSavedSettings() {

    const start =
        (this.pageNumber - 1) * this.pageSize;

    return this.savedSettingsWithDisplayValues.slice(
        start,
        start + this.pageSize
    );
}

// ============================================================
// PAGINATION HANDLERS
// ============================================================

handlePageSizeChange(event) {

    this.pageSize =
        Number(event.target.value);

    // Always go back to page 1
    // when page size changes.
    this.pageNumber = 1;

    console.log(
        '📄 Page Size:',
        this.pageSize
    );

    console.log(
        '📄 Page Number:',
        this.pageNumber
    );
}

firstPage() {

    this.pageNumber = 1;

}

previousPage() {

    if (this.pageNumber > 1) {

        this.pageNumber--;

    }

}

nextPage() {

    if (this.pageNumber < this.totalPages) {

        this.pageNumber++;

    }

}

lastPage() {

    this.pageNumber =
        this.totalPages;

}


}