import { LightningElement, api, track,wire } from 'lwc';
const HEADER_SEL = '#CustomerPortalTemplate > div.cHeaderWrapper > div.cHeader.slds-container--fluid';
import saveOnboardingReceivedDataR
  from '@salesforce/apex/OnBoardingController.saveOnboardingReceivedDataR';
  import { ShowToastEvent } from 'lightning/platformShowToastEvent';
  import getOrgLogoUrlById from '@salesforce/apex/OnBoardingController.getOrgLogoUrlById';
  import TESSERACT_LOGO from '@salesforce/resourceUrl/TesseractLogo';
import ONBOARD_SVG    from '@salesforce/resourceUrl/Onboard';
import getFacilityManagerName
  from '@salesforce/apex/OnBoardingController.getFacilityManagerName';
  import getOnboardingRoleAndUserType
  from '@salesforce/apex/OnBoardingController.getOnboardingRoleAndUserType';
  import isLinkActive from '@salesforce/apex/OnBoardingController.isLinkActive';


export default class ExternalOnboardingLWC extends LightningElement {

    taxFreeOptions = [
        { label: 'With Tax Free Threshold', value: 'With Tax Free Threshold' },
        { label: 'Without Tax Free Threshold', value: 'Without Tax Free Threshold' }
    ];

    genderOptions = [
        { label: 'Male', value: 'Male' },
        { label: 'Female', value: 'Female' },
        { label: 'Not Specified', value: 'Not Specified' },
        { label: 'Indeterminate/Intersex/Unspecified', value: 'Indeterminate/Intersex/Unspecified' },
    ];
    roleOptions = [
        { label: 'Org Admin', value: 'Portal account partner Executive' },
        { label: 'Roster Admin', value: 'Portal account partner Manager' },
        { label: 'Staff', value: 'Portal account partner User' },
        { label: 'Participant', value: 'Portal account partner User' }
    ];

    participantValues = [
        { label: 'Parent / Guardian', value: 'Parent' },
        { label: 'Child (NDIS Participant)', value: 'Child' },
        { label: 'Both Parent and Child', value: 'Both' }
    ];

     get filteredRoleOptions() {
        console.log('this.userTypeRole===>'+this.userTypeRole);
        if (this.userTypeRole === 'NDIS Org Admin' || this.userTypeRole === 'Facility Admin') {
            return this.roleOptions;
        } else {
            return this.roleOptions.filter(role => 
                role.value === 'Portal account partner Executive' || 
                role.value === 'Portal account partner User'
            );
        }
    }


    // ================================
// Nationality + Languages (EXTRACTED FROM staffDataCommunity)
// ================================
@track showDropdown = false;
@track filteredOptions = [];
@track noResults = false;
@track hideNatLangFields = false;


@track Nationality = '';
@track searchKey = '';

@track LANGUAGE_OPTIONS = [
  'Arabic', 'Armenian', 'Azerbaijani', 'Bengali', 'Burmese', 'Dhivehi', 'Dzongkha',
  'English', 'Filipino', 'French', 'German', 'Greek', 'Hebrew', 'Hindi', 'Indonesian',
  'Italian', 'Japanese', 'Kazakh', 'Khmer', 'Korean', 'Kyrgyz', 'Lao', 'Malay', 'Mandarin',
  'Mongolian', 'Nepali', 'Persian', 'Portuguese', 'Russian', 'Samoan', 'Sinhala', 'Swahili',
  'Thai', 'Tongan', 'Turkish', 'Urdu', 'Uzbek', 'Vietnamese'
];

allNationalities = [
  'Afghan', 'American', 'Argentinian', 'Armenian', 'Australian', 'Azerbaijani', 'Bahraini', 'Bangladeshi',
  'Bhutanese', 'Brazilian', 'British', 'Bruneian', 'Burmese', 'Cambodian', 'Canadian', 'Chilean', 'Chinese',
  'Colombian', 'Cuban', 'Egyptian', 'Emirati', 'Fijian', 'Filipino', 'French', 'German', 'Ghanaian', 'Greek',
  'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Israeli', 'Italian', 'Jamaican', 'Japanese', 'Jordanian',
  'Kazakhstani', 'Kenyan', 'Kuwaiti', 'Kyrgyzstani', 'Laotian', 'Lebanese', 'Malaysian', 'Maldivian',
  'Mexican', 'Mongolian', 'Moroccan', 'Nepali', 'New Zealander', 'Nigerian', 'North Korean', 'Norwegian',
  'Omani', 'Pakistani', 'Peruvian', 'Portuguese', 'Qatari', 'Russian', 'Samoan', 'Saudi', 'Singaporean',
  'South African', 'South Korean', 'Spanish', 'Sri Lankan', 'Swedish', 'Syrian', 'Taiwanese', 'Tajikistani',
  'Thai', 'Tongan', 'Turkish', 'Uzbekistani', 'Vietnamese', 'Yemeni'
];

@track Languages = [];
@track selectedLangs = [];
@track isExpanded = false;

// These are present in staffDataCommunity and referenced by outside-click logic.
// Keep them to avoid breaking the copied handler.
@track isOpen = false;
@track facilityDropDownOpen = false;
@track roleDropDownForEmployment = false;


     tesseractLogoUrl = TESSERACT_LOGO;
  onboardUrl       = ONBOARD_SVG; 


  managerName = '';

// --- Person ---
firstName = '';
lastName = '';
selectedGender = '';    
phoneNumber = '';
email = '';               
dateOfBirth = '';

// --- Employment ---
selectedRole = null;    
selectedUserType = '';   
StaffFacility = '';      
hourlyRate = '';
abnNumber = '';
taxFileNumber = '';
selectedTaxFree = '';   
startDate = '';
status = 'Inactive';             
hasSuperFund = false;
SuperMemberNumber = '';
superFundName = '';

// --- Address ---
street = '';
city = '';
province = '';
postalcode = '';
country = '';

// UI / config
isUserTypeDisabled = true; 
errorMessage = '';


brandLogoUrl;
 @track decoded = {
    recordId: null,
    email: null,
    userType: null,
    exp: null,           
    isExpired: null
  };
  @track decodeError = null;
  @track hasTriedSubmit = false;



connectedCallback() {
  this._hideHeaderTries = 0;
  this._tryHideHeader();
  this.decodeFromUrl();

   this._onResize = () => { if (this.isSubmitted) this.positionConfettiOrigin(); };
  window.addEventListener('resize', this._onResize);

  this.filteredOptions = this.allNationalities.map(n => ({ label: n, value: n }));

// Init Languages list (same structure as staffDataCommunity)
this.Languages = this.LANGUAGE_OPTIONS.map(lang => ({
  id: lang,
  label: lang,
  checked: false,
  buttonClass: 'option-button',
  badgeClass: 'status-badge inactive',
  statusText: 'Inactive'
}));
}

disconnectedCallback() {
  if (this._headerObserver) {
    this._headerObserver.disconnect();
    this._headerObserver = null;
     window.removeEventListener('resize', this._onResize);
     window.removeEventListener('click', this._boundHandleClickOutside);

  }
}

get chevronIcon() {
  return this.isExpanded ? 'utility:chevrondown' : 'utility:chevronright';
}

get selectedOptionClass() {
  return this.selectedLangs.length > 0 ? 'selected-text slds-truncate' : 'placeholder-text slds-truncate';
}

get displayTextLang() {
  return this.selectedLangs.length
    ? this.selectedLangs.join(', ')
    : 'Select Languages';
}


handleSearchChange(event) {
  const searchKey = (event.target.value || '').toLowerCase();
  this.searchKey = searchKey;

  if (searchKey) {
    const filtered = this.allNationalities
      .filter(nation => nation.toLowerCase().includes(searchKey))
      .map(n => ({ label: n, value: n }));

    this.filteredOptions = filtered;
    this.noResults = filtered.length === 0;
  } else {
    this.filteredOptions = this.allNationalities.map(n => ({ label: n, value: n }));
    this.noResults = false;
  }

  this.showDropdown = true;
}

toggleDrop(event) {
  event.stopPropagation();

  // Close other dropdowns
  this.isOpen = false;
  this.isExpanded = false;

  this.showDropdown = !this.showDropdown;

  if (this.showDropdown) {
    this.filteredOptions = this.allNationalities.map(n => ({ label: n, value: n }));
    this.noResults = false;

    // Attach listener AFTER event completes (same as staffDataCommunity)
    setTimeout(() => {
      this._boundHandleClickOutside = this.handleClickOutside.bind(this);
      window.addEventListener('click', this._boundHandleClickOutside);
    }, 0);
  } else {
    window.removeEventListener('click', this._boundHandleClickOutside);
  }
}

handleSelect(event) {
  const selectedValue = event.currentTarget.dataset.value;

  this.searchKey = selectedValue;
  this.showDropdown = false;
  this.Nationality = selectedValue;

  // Optional: if you want parent listening behavior later
  this.dispatchEvent(new CustomEvent('change', {
    detail: { Nationality: selectedValue }
  }));
}
handleDropdownToggle(event) {
  event.stopPropagation();

  // Close others
  this.isOpen = false;
  this.showDropdown = false;

  this.isExpanded = !this.isExpanded;

  if (this.isExpanded) {
    setTimeout(() => {
      this._boundHandleClickOutside = this.handleClickOutside.bind(this);
      window.addEventListener('click', this._boundHandleClickOutside);
    }, 0);
  }
}

handleLanguageToggle(event) {
  const optionId = event.target.dataset.optionId;
  const isChecked = event.target.checked;

  // Ensure selectedLangs is always an array
  if (!Array.isArray(this.selectedLangs)) {
    this.selectedLangs = [];
  }

  if (isChecked) {
    if (!this.selectedLangs.includes(optionId)) {
      this.selectedLangs = [...this.selectedLangs, optionId];
    }
  } else {
    this.selectedLangs = this.selectedLangs.filter(v => v !== optionId);
  }

  this.refreshValues();
}

refreshValues() {
  this.Languages = this.Languages.map(opt => {
    const isSelected = this.selectedLangs.includes(opt.id);

    return {
      ...opt,
      checked: isSelected,
      badgeClass: isSelected ? 'status-badge active' : 'status-badge inactive',
      statusText: isSelected ? 'Active' : 'Inactive'
    };
  });
}
handleClickOutside(event) {
  const path = event.composedPath();

  const roleBox = this.template.querySelector('.role-dropdown');
  const nationalityBox = this.template.querySelector('.nationality-dropdown');
  const languageBox = this.template.querySelector('.language-dropdown');
  const gridElement = this.template.querySelector('.grid');
  const facilityBox = this.template.querySelector('.facility-dropdown');
  const employmentBox = this.template.querySelector('.employment-role-dropdown');

  const clickedInsideRole = roleBox && path.includes(roleBox);
  const clickedInsideNationality = nationalityBox && path.includes(nationalityBox);
  const clickedInsideLanguage = languageBox && path.includes(languageBox);
  const clickedInsideGrid = gridElement && path.includes(gridElement);
  const clickedInsideFaciltiy = facilityBox && path.includes(facilityBox);
  const clickedInsideEmployment = employmentBox && path.includes(employmentBox);

  if (this.isOpen && !clickedInsideRole) this.isOpen = false;
  if (this.showDropdown && !clickedInsideNationality) this.showDropdown = false;
  if (this.isExpanded && !clickedInsideLanguage) this.isExpanded = false;
  if (this.facilityDropDownOpen && !clickedInsideFaciltiy) this.facilityDropDownOpen = false;
  if (this.roleDropDownForEmployment && !clickedInsideEmployment) this.roleDropDownForEmployment = false;

  if (
    gridElement &&
    !clickedInsideGrid &&
    !path.some(node => node.tagName === 'IMG')
  ) {
    if (gridElement.classList.contains('slide-in')) {
      gridElement.classList.remove('slide-in');
      gridElement.classList.add('slide-out');
    }
  }

  if (!this.isOpen && !this.showDropdown && !this.isExpanded && !this.facilityDropDownOpen && !this.roleDropDownForEmployment) {
    window.removeEventListener('click', this._boundHandleClickOutside);
  }
}


_tryHideHeader() {
  const el = document.querySelector(HEADER_SEL);
  if (el) {
    // hide it
    el.style.setProperty('display', 'none', 'important');
    return;
  }

  // retry a few times while layout loads
  this._hideHeaderTries++;
  if (this._hideHeaderTries < 20) {              // ~2s total
    window.setTimeout(() => this._tryHideHeader(), 100);
    return;
  }

  // fallback: observe until it appears
  if (!this._headerObserver) {
    this._headerObserver = new MutationObserver(() => {
      const node = document.querySelector(HEADER_SEL);
      if (node) {
        node.style.setProperty('display', 'none', 'important');
        this._headerObserver.disconnect();
        this._headerObserver = null;
      }
    });
    this._headerObserver.observe(document.body, { childList: true, subtree: true });
  }
}



handleFieldChange = (e) => {
  const field = e.target?.dataset?.field;
  const value = e.detail?.value;
  if (!field) return;
  this[field] = value;

  // Optional: for ABN / TFN, clear previous custom error and re-check
  if (field === 'abnNumber' || field === 'taxFileNumber') {
    e.target.setCustomValidity('');
    e.target.reportValidity();
  }
};

PhonenumberChange = (e) => {
  let v = (e.detail?.value || '').replace(/\D/g, '').slice(0, 10);
  this.phoneNumber = v;
  // e.target.value = v; // optional: reflect cleaned value back into the UI
};

handleGenderChange = (e) => {
  this.selectedGender = e.detail?.value || '';
};

handlerolechange = (e) => {
  this.selectedRole = e.detail?.value || '';
};

handleUserTypeChange = (e) => {
  this.selectedUserType = e.detail?.value || '';
};

handleFacilityChange = (e) => {
  this.StaffFacility = e.detail?.value || '';
};

handleTaxFreeThreesholdChange = (e) => {
  this.selectedTaxFree = e.detail?.value || '';
};

handleSuperFundChange(event) {
    this.hasSuperFund = event.target.checked;

    if(!this.hasSuperFund){
        this.SuperMemberNumber = '';
        this.superFundName = '';
    }
}

handleStatus = (e) => {
  const checked = !!e.detail?.checked;
  this.status = checked ? 'Active' : 'Inactive';
};
addressInputChange = (e) => {
  const a = e.detail || {};
  this.street     = a.street     || '';
  this.city       = a.city       || '';
  this.country    = a.country    || '';
  this.province   = a.province   || '';
  this.postalcode = a.postalCode || a.postalcode || '';

  if (this.hasTriedSubmit) {
    e.target.reportValidity();
  }
};

isSubmitted = false;          // controls which template is shown
confettiPieces = [];          // array to render confetti pieces
confettiFront = false; 
confettiFading = false; 
 @track userTypeName;


async handleUserCreation() {
  console.groupCollapsed('[ExternalOnboarding] handleUserCreation');
  this.hasTriedSubmit = true;

   if (!this.validateInputs()) {
    this.toast('Missing Fields', 'Please fill in all required fields correctly.', 'error');
    console.groupEnd();
    return;
  }
  try {
    // Sanity logs
    const decodedPlain = JSON.parse(JSON.stringify(this.decoded || {}));
    console.log('decoded (plain):', decodedPlain);
    console.log('recordId:', decodedPlain.recordId);

    if (!decodedPlain.recordId) {
      this.toast('Missing Invite', 'Invalid or missing invite token.', 'error');
      return;
    }
    if (decodedPlain.isExpired) {
      this.toast('Link Expired', 'This invitation link has expired.', 'error');
      return;
    }

    // Build each section with explicit string coercion
    const meta = {
      source: 'externalOnboardingLWC',
      collectedAtIso: new Date().toISOString(),
      tokenEmail: String(decodedPlain.email || ''),
      tokenUserType: String(decodedPlain.userType || ''),
      tokenRole: String(this.decoded?.roleRaw || this.decoded?.role || ''),
      tokenRecordId: String(decodedPlain.recordId || ''),
      tokenExpiryIso: String(decodedPlain.exp || '')
    };
    const person = {
      firstName: String(this.firstName || ''),
      lastName: String(this.lastName || ''),
      gender: String(this.selectedGender || ''),
      dateOfBirth: String(this.dateOfBirth || ''),
      email: String(this.email || ''),              // prefilled + disabled
      phone: String(this.phoneNumber || ''),
      nationality: String(this.Nationality || ''),
      languages: String((this.selectedLangs || []).join(';')),
      participantType: String(this.participantType || ''),
    };
    const employment = {

      facilityIdOrName: String(this.StaffFacility || ''),
      hourlyRate: String(this.hourlyRate ?? ''),   
      abnNumber: String(this.abnNumber || ''),
      taxFileNumber: String(this.taxFileNumber || ''),
      taxFreeThreshold: String(this.selectedTaxFree || ''),
      startDate: String(this.startDate || ''),
      status: String(this.status ?? ''),
      hasSuperFund: this.hasSuperFund,
      SuperMemberNumber: String(this.SuperMemberNumber || ''),
      superFundName: String(this.superFundName || '')
    };
    const address = {
      street: String(this.street || ''),
      city: String(this.city || ''),
      province: String(this.province || ''),
      postalCode: String(this.postalcode || ''),
      country: String(this.country || '')
    };
    const primaryContact = {
  firstName:    String(this.pcFirstName || ''),
  lastName:     String(this.pcLastName || ''),
  relationship: String(this.pcRelationship || ''),
  phone:        String(this.pcPhone || '')
};

    // Assemble payload
    const payload = { _meta: meta, person, employment, address,primaryContact  };
console.log('payload.primaryContact:', primaryContact);
    // Deep-clone to plain data (strips Proxies) BEFORE stringify
    const safePayload = JSON.parse(JSON.stringify(payload));

    // Diagnostics
    console.log('payload keys:', Object.keys(safePayload));
    console.log('payload._meta:', safePayload._meta);
    console.log('payload.person:', safePayload.person);
    console.log('payload.employment:', safePayload.employment);
    console.log('payload.address:', safePayload.address);

    // Guard: if somehow empty, bail with a readable message
    if (!Object.keys(safePayload).length) {
      console.error('Built payload is empty {}. Check field bindings.');
      this.toast('Save error', 'Nothing to submit — form values are empty.', 'error');
      console.groupEnd();
      return;
    }

    const payloadJson = JSON.stringify(safePayload);
    console.log('payloadJson:', payloadJson);
    console.log('• payloadJson length:', payloadJson.length);
    console.log('• decodedPlain.recordId:', decodedPlain.recordId);

    await saveOnboardingReceivedDataR({
      onboardingId: decodedPlain.recordId,
      payloadJson,
      deactivateLink: true
    });
     this.showThankYouView();
  } catch (e) {
    const plain = JSON.parse(JSON.stringify(e || {}));
    console.error('handleUserCreation error (plain):', plain);
    console.error('handleUserCreation error (raw):', e);
    this.toast('Save error', this.reduceError ? this.reduceError(e) : (e?.body?.message || e?.message || 'Unknown error'), 'error');
  } finally {
    console.groupEnd();
  }
}

validateInputs() {
  let allValid = true;

  // Get ABN/TFN inputs once
  const tfnInput = this.template.querySelector('[data-field="taxFileNumber"]');
  const abnInput = this.template.querySelector('[data-field="abnNumber"]');

  // 🔹 0) Clear *our* previous custom errors BEFORE generic validation
  if (tfnInput) tfnInput.setCustomValidity('');
  if (abnInput) abnInput.setCustomValidity('');

  // 1) Run normal validity checks on all inputs / comboboxes / address
  const inputs = this.template.querySelectorAll(
    'lightning-input, lightning-combobox, lightning-input-address'
  );
  inputs.forEach((input) => {
    if (!input.checkValidity()) {
      input.reportValidity();
      allValid = false;
    }
  });

  // 2) Custom ABN / TFN rule: either one required, not both,
  //    and ABN=11 digits, TFN=9 digits.
  if (tfnInput || abnInput) {
    // Read the actual DOM value so we don't depend on onchange firing
    const tfn = (tfnInput?.value || '').trim();
    const abn = (abnInput?.value || '').trim();

    const hasTFN = tfn.length > 0;
    const hasABN = abn.length > 0;

    // (customValidity already cleared above)

    // 2a) XOR rule: must have exactly one
    if (!hasTFN && !hasABN) {
      const msg = 'Either ABN or Tax File Number is required.';
      if (tfnInput) {
        tfnInput.setCustomValidity(msg);
        tfnInput.reportValidity();
      }
      if (abnInput) {
        abnInput.setCustomValidity(msg);
        abnInput.reportValidity();
      }
      allValid = false;
    } else if (hasTFN && hasABN) {
      const msg = 'Please enter either ABN or Tax File Number, not both.';
      if (tfnInput) {
        tfnInput.setCustomValidity(msg);
        tfnInput.reportValidity();
      }
      if (abnInput) {
        abnInput.setCustomValidity(msg);
        abnInput.reportValidity();
      }
      allValid = false;
    } else {
      // 2b) Length / format rules when exactly one is present
      // ABN: 11 digits
      if (hasABN && abnInput) {
        const abnIsValid = /^[0-9]{11}$/.test(abn);
        if (!abnIsValid) {
          abnInput.setCustomValidity('ABN must be exactly 11 digits.');
          abnInput.reportValidity();
          allValid = false;
        }
      }

      // TFN: 9 digits
      if (hasTFN && tfnInput) {
        const tfnIsValid = /^[0-9]{9}$/.test(tfn);
        if (!tfnIsValid) {
          tfnInput.setCustomValidity('Tax File Number must be exactly 9 digits.');
          tfnInput.reportValidity();
          allValid = false;
        }
      }
    }
  }

  return allValid;
}





// put this once in your component
reduceError(err) {
  const errors = [];

  // LDS/Apex array of errors
  if (Array.isArray(err?.body)) {
    errors.push(...err.body.map(e => e?.message));
  }
  // AuraHandledException or DML error
  else if (typeof err?.body?.message === 'string') {
    errors.push(err.body.message);
    // include page errors & field errors if present
    if (Array.isArray(err.body?.pageErrors) && err.body.pageErrors.length) {
      errors.push(...err.body.pageErrors.map(e => e.message));
    }
    if (err.body?.fieldErrors) {
      Object.values(err.body.fieldErrors).forEach(list => {
        errors.push(...list.map(e => e.message));
      });
    }
  }
  // plain JS error
  else if (typeof err?.message === 'string') {
    errors.push(err.message);
  }

  return errors.filter(Boolean).join(' | ') || 'Unknown error';
}


get orgDisplayName() {
  // prefer org name; fall back to facility name if desired
  return (this.decoded?.orgName && this.decoded.orgName.trim())
      ? this.decoded.orgName.trim()
      : (this.decoded?.facilityName || null);
}

    get showForm() {
  return !this.linkInactive && !this.linkExpired;
}

@track linkInactive = false;
@track linkExpired  = false;
decodeFromUrl() {
  console.groupCollapsed('[ExternalOnboarding] decodeFromUrl()');
  this.decodeError = null;
  this.linkInactive = false; 
  this.linkExpired  = false; // 🔹 NEW flag for expiry

  try {
    const href = window.location.href;
    console.log('• Current URL:', href);

    const url = new URL(href);
    const dataParam = url.searchParams.get('data');
    console.log('• data param (raw):', dataParam);

    if (!dataParam) {
      this.decodeError = 'Missing "data" in URL.';
      console.warn('! decodeError:', this.decodeError);
      console.groupEnd();
      return;
    }

    // 1) URL-decode
    const urlDecoded = decodeURIComponent(dataParam);
    console.log('• data param (URL-decoded):', urlDecoded);

    // 2) Base64-decode raw payload
    let raw;
    try {
      raw = atob(urlDecoded);
      console.log('• payload (base64-decoded raw):', raw);
    } catch (e) {
      this.decodeError = 'Invalid token: cannot decode.';
      console.error('! base64 decode failed:', e);
      console.groupEnd();
      return;
    }

    // 3) Parse key/value pairs
    const kv = new URLSearchParams(raw);
    const recordId     = kv.get('recordId')    || null;
    const email        = kv.get('email')       || null;
    const userType     = kv.get('userType')    || null;
    const expB64       = kv.get('exp')         || null;
    const facilityId   = kv.get('facilityId')  || null;
    const facilityName = kv.get('facilityName')|| null; 
    const orgId        = kv.get('orgId')       || null;
    const orgName      = kv.get('orgName')     || null;
    const roleRaw      = kv.get('role')        || null; 
    const roleDisplay  = kv.get('roleDisplay') || null; 

    console.log('• parsed fields:', { recordId, email, userType, expB64 });

    if (!recordId || !email || !expB64) {
      this.decodeError = 'Token missing required fields.';
      console.warn('! decodeError:', this.decodeError);
      console.groupEnd();
      return;
    }

    // 4) Decode expiry
    let expIso = null;
    try {
      expIso = atob(expB64);
      console.log('• expiry (ISO from base64):', expIso);
    } catch (e) {
      this.decodeError = 'Invalid expiry payload.';
      console.error('! expiry base64 decode failed:', e);
      console.groupEnd();
      return;
    }

    // 5) Check expiry
    const expDate = new Date(expIso);
    if (isNaN(expDate.getTime())) {
      this.decodeError = 'Malformed expiry timestamp.';
      console.warn('! decodeError:', this.decodeError);
      console.groupEnd();
      return;
    }

    const now = new Date();
    const isExpired = now > expDate;
    console.log('• now:', now.toISOString(), '| isExpired:', isExpired);

    // 🔹 NEW: set flag and short-circuit if expired
    if (isExpired) {
      this.linkExpired = true;
      console.warn('Onboarding link expired.');
      return; // stop here, skip isLinkActive
    }

    // 6) Save decoded values
    this.decoded = {
      recordId,
      email,
      userType,
      roleRaw,
      roleDisplay,
      role: (roleDisplay || roleRaw || ''),
      exp: expIso,
      isExpired,
      facilityId,
      facilityName,
      orgId,
      orgName
    };
    console.log('✓ decoded object:', this.decoded);

    // Employment toggle
    const roleCheck = (roleRaw || '').toLowerCase().trim();
    const utCheck   = (userType || '').toLowerCase().trim();
    this.hideEmploymentFields =
      roleCheck === 'portal account partner manager' && utCheck === 'ndis participant';

    console.log('• hideEmploymentFields (from token):', this.hideEmploymentFields);

    // ✅ Hide Nationality + Languages for these user types
    this.hideNatLangFields = ['ict admin', 'participant', 'ict staff'].includes(utCheck);

    // Optional: if hiding, clear values so they don't get saved accidentally
    if (this.hideNatLangFields) {
      this.Nationality = '';
      this.selectedLangs = [];
      this.isExpanded = false;
      this.showDropdown = false;
    }
    console.log('• hideNatLangFields (from token):', this.hideNatLangFields);


    // Existing linkActive check only runs if not expired
    isLinkActive({ onboardingId: recordId })
      .then((active) => {
        if (!active) {
          this.linkInactive = true;
          console.warn('Onboarding link inactive (already submitted).');
        } else {
          this.prefillFromDecoded();
          this.linkInactive = false;
          if (orgId) {
            this.loadOrgLogo(orgId);
          }
        }
      })
      .catch((err) => {
        this.decodeError = 'Error verifying link status.';
        console.error(err);
      });

  } catch (err) {
    this.decodeError = 'Unexpected error while decoding.';
    console.error('! unexpected error:', err);
  } finally {
    if (this.decodeError) {
      console.warn('Final decodeError:', this.decodeError);
    }
    console.groupEnd();
  }
}



hideEmploymentFields = false;


  // Example helper (optional): show a friendly message
  get decodedSummary() {
    if (this.decodeError) return this.decodeError;
    const { recordId, email, userType, exp, isExpired } = this.decoded;
    return `recordId=${recordId} | email=${email} | userType=${userType || '(none)'} | exp=${exp} | expired=${isExpired}`;
  }



async prefillFromDecoded() {
  if (!this.decoded) return;

  // 1) Email
  if (this.decoded.email) {
    this.email = this.decoded.email;
    console.log('• prefilled email =', this.email);
  }

  // 2) Facility (from decoded payload)
  const { facilityId, facilityName } = this.decoded || {};
  if (facilityId) {
    // ensure option exists { label, value } (even if combobox is disabled)
    const exists = (this.finalListFacilities || []).some(o => o.value === facilityId);
    if (!exists) {
      this.finalListFacilities = [
        ...(this.finalListFacilities || []),
        { label: facilityName || facilityId, value: facilityId }
      ];
    }
    this.StaffFacility = facilityId; // select it
    console.log('• prefilled facility =', { facilityId, facilityName });

    // 3) Manager Name (fetch from Facility__c.Manager_Name__c)
    try {
      const name = await getFacilityManagerName({ facilityId });
      this.managerName = name || '';
      console.log('• prefilled managerName =', this.managerName);
    } catch (e) {
      console.warn('getFacilityManagerName failed', e);
      this.managerName = '';
    }
  } else {
    this.managerName = '';
  }

  // NOTE: intentionally removed any User Type / Role prefill.
}


toast(title, message, variant = 'info') {
  this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
}

// after getOrgLogoUrlById({ orgId }) returns Organization_Logo__c (HTML), do:
async loadOrgLogo(orgId) {
  try {
    console.log('[ExternalOnboarding] loadOrgLogo orgId =', orgId);
    const html = await getOrgLogoUrlById({ orgId });   // this is HTML, not a URL
    this.brandLogoHtml = html || null;                 // if you want to render as rich text

    // Extract <img src="..."> from the HTML
    const src = extractImgSrc(html);
    if (src) {
      // Unescape &amp; -> &
      const unescaped = src.replace(/&amp;/g, '&');

      // Make absolute if needed
      const absolute = unescaped.startsWith('http')
        ? unescaped
        : `${window.location.origin}${unescaped}`;

      this.brandLogoUrl = absolute;
      console.log('[ExternalOnboarding] brandLogoUrl =', this.brandLogoUrl);
    } else {
      this.brandLogoUrl = null;
      console.warn('[ExternalOnboarding] No <img> src found in Organization_Logo__c');
    }
  } catch (e) {
    console.error('[ExternalOnboarding] getOrgLogoUrlById failed:', e);
    this.brandLogoUrl = null;
  }
}

confettiHostStyle = ''; 
// ----- NEW: host style string (for origin anchoring) -----
confettiHostStyle = '';   // e.g. "--originX: 640px; --originY: 240px;"
isSubmitted = false;
confettiPieces = [];
confettiFading = false;

positionConfettiOrigin() {
  const card = this.template.querySelector('.ty-card');
  if (!card) return;
  const r = card.getBoundingClientRect();
  const ox = r.left + r.width / 2;
  const oy = r.top  + r.height / 2;
  this.confettiHostStyle = `--originX:${ox}px;--originY:${oy}px;`;
}


// Build pieces for a tight burst that goes UP first, then falls
buildConfetti(count = 140) {
  const colors = ['c1','c2','c3','c4','c5'];

  this.confettiPieces = Array.from({ length: count }, (_, i) => {
    // short stagger so it feels like a single burst
    const delay     = Number((Math.random() * 0.25).toFixed(2)); // 0–0.25s
    // ~6s lifetime per piece
    const durSec    = Number((Math.random() * 0.6 + 5.7).toFixed(2)); // 5.7–6.3s

    // start near center (tiny sideways nudge so it's not a line)
    const startXpx  = `${(Math.random() * 32 - 16).toFixed(0)}px`;  // -16px..+16px

    // burst vector: drift sideways while going up, then fall
    const driftXvw  = `${(Math.random() * 60 - 30).toFixed(1)}vw`;  // -30vw..+30vw
    const upVh      = `${(-1 * (Math.random() * 40 + 35)).toFixed(1)}vh`; // -35..-75vh

    const rotStart  = Math.floor(Math.random() * 360);
    const spinDeg   = `${(720 + Math.floor(Math.random() * 720))}deg`; // 720–1440°
    const sizePx    = Math.floor(Math.random() * 8) + 6;

    const style = [
      `--delay:${delay}s`,
      `--dur:${durSec}s`,
      `--sx:${startXpx}`,     // small sideways offset at start
      `--vx:${driftXvw}`,     // sideways drift by the end
      `--up:${upVh}`,         // how high to shoot up first
      `--rot:${rotStart}deg`,
      `--spin:${spinDeg}`,
      `--size:${sizePx}px`
    ].join(';');

    return {
      id: i,
      color: colors[i % colors.length],
      className: `confetti-piece ${colors[i % colors.length]}`,
      style,
      delaySec: delay,
      durSec
    };
  });
}

showThankYouView() {
  this.isSubmitted = true;

  requestAnimationFrame(() => {
    this.positionConfettiOrigin(); // you already have this
    this.buildConfetti();          // you already have this

    // Start BEHIND the card, then pop in FRONT after the press (~0.22 * 900ms ≈ 200–250ms)
    this.confettiFront = false;
    window.setTimeout(() => { this.confettiFront = true; }, 240);

    // Fade out after the longest piece finishes (~6s)
    const maxMs = Math.max(...this.confettiPieces.map(p => (p.delaySec + p.durSec) * 1000));
    window.setTimeout(() => { this.confettiFading = true; }, maxMs + 300);
  });
}

get confettiHostClass() {
  return `confetti-host${this.confettiFading ? ' is-fading' : ''}`;
}

// --- Primary Contact ---
pcFirstName = '';
pcLastName  = '';
pcRelationship = '';
pcPhone = '';

// optional: sanitize primary contact phone to digits only
handlePrimaryContactPhoneChange = (e) => {
  const v = (e.detail?.value || '').replace(/\D/g, '').slice(0, 15);
  this.pcPhone = v;
};



}

function extractImgSrc(html) {
  if (!html) return null;
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

// helpers (safe decode for ?data=)
function parseDataBlob(blob) {
  // blob is the Base64 string from ?data=
  try {
    const raw = atob(decodeURIComponent(blob)); // base64 -> utf8 string
    // raw format: key=value&key2=value2...
    const out = {};
    raw.split('&').forEach(pair => {
      if (!pair) return;
      const idx = pair.indexOf('=');
      const k = idx >= 0 ? pair.slice(0, idx) : pair;
      const v = idx >= 0 ? pair.slice(idx + 1) : '';
      out[k] = v;
    });
    return out;
  } catch (e) {
    console.error('[externalOnboarding] parseDataBlob error:', e);
    return {};
  }
}

// ensure {label, value} exists in options; optionally select it
function ensureFacilityOption(opts, id, name) {
  if (!id) return opts;
  const exists = (opts || []).some(o => o.value === id);
  if (!exists) {
    const label = name && name.trim() ? name : id;
    opts = [...(opts || []), { label, value: id }];
  }
  return opts;
}