import { LightningElement, track,api,wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createOnboardingRawAndEmail from '@salesforce/apex/OnBoardingController.createOnboardingRawAndEmail';
import getOnboardingList from '@salesforce/apex/OnBoardingController.getOnboardingList';
import getOnboardingListByOrg from '@salesforce/apex/OnBoardingController.getOnboardingListByOrg';
import SEND_REMINDER_EMAILS from '@salesforce/apex/OnBoardingController.sendOnboardingReminderEmails';
import GET_RECEIVED_DATA from '@salesforce/apex/OnBoardingController.getReceivedData';
import APPROVE_ONBOARDING from '@salesforce/apex/OnBoardingController.approveOnboarding';
import SAVE_RECEIVED from '@salesforce/apex/OnBoardingController.saveOnboardingReceivedDataR';
import createAccountsContactsAndStaff from '@salesforce/apex/OnBoardingController.createAccountsContactsAndStaff';
import orgDetails from '@salesforce/apex/OrgDetails.orgDetails';
import Id from '@salesforce/user/Id'; 
import getUserRole  from '@salesforce/apex/PortalUserController.getUserRole';
import getUserTypeValuesfromOrg  from '@salesforce/apex/PortalUserController.getUserTypeValues';
import getOnboardingCounts from '@salesforce/apex/OnBoardingController.getOnboardingCounts';
import getFacilityData from "@salesforce/apex/HrHomeHandler.fetchFacilitiess";
import getEmailNotSent from '@salesforce/apex/OnBoardingController.getEmailNotSent';
import getExistingEmails from '@salesforce/apex/OnBoardingController.getExistingEmails';

const ROLE_ALIAS = {
  'Portal account partner Manager': 'Roster Manager',
  'Portal account partner User':    'Staff',
};
const toDisplayRole = (role) => ROLE_ALIAS[role] ?? role;
const DEBUG_ONBOARDING = true;
function dbg(...args) {
  if (DEBUG_ONBOARDING) console.log('[OnBoarding]', ...args);
}

function sanitizeEmail(e) {
  if (!e) return '';
  return e
    .replace(/[<>\(\)\[\]"']/g, '')
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, '') // zero-width chars (OK in JS)
    .trim();
}
function csvToMatrix(text) {
  const rows = [];
  let cur = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        const next = text[i + 1];
        if (next === '"') { // escaped quote
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        cur.push(field);
        field = '';
      } else if (c === '\n') {
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = '';
      } else if (c === '\r') {
        // handle CRLF: skip, LF will end the row
        continue;
      } else {
        field += c;
      }
    }
  }

  // last field/row
  cur.push(field);
  if (cur.length && !(cur.length === 1 && cur[0] === '' && rows.length === 0)) {
    rows.push(cur);
  }
  return rows;
}


export default class OnBoarding extends LightningElement {
  userId = Id;  
  emailInput = '';
  @track rows = [];
  invalidEmailsText = '';
@track selectedRole;
@track selectedUserType;
@track isUserTypeDisabled = true;
  roleOptions = [
        { label: 'Roster Admin', value: 'Portal account partner Manager' },
        { label: 'Staff', value: 'Portal account partner User' }
    ];

  recordColumns = [
  { label: 'Email', fieldName: 'Email__c' },
  { label: 'User Type', fieldName: 'User_Type__c' },
  { label: 'Created', fieldName: 'CreatedDate', type: 'date', typeAttributes: {
      year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
  }},
];
// holds the original parsed JSON object for the selected record
ob_originalData = null;
// optional saving spinner
ob_isSavingEdits = false;
  @track orgOnboardings = [];
onboardings = [];
isLoadingRecords = false;
handleRefreshRecords() {
  this.loadOnboardings();
}
// Facilities dropdown
facilityOptions = [{ label: 'All', value: 'ALL' }];
selectedFacilityId = 'ALL';

// Org list buckets
_allOrgOnboardings = [];     // full, mapped org list (unfiltered)
_filteredOrgOnboardings = []; // after facility filter

// Pagination
pageSizeOptions = [
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: '50', value: 50 }
];

pageSize = 10;
pageNumber = 1;

get totalPages() {
  return Math.max(1, Math.ceil(this._filteredOrgOnboardings.length / this.pageSize));
}
get disablePrev() { return this.pageNumber <= 1; }
get disableNext() { return this.pageNumber >= this.totalPages; }
get filteredCount() { return this._filteredOrgOnboardings.length; }

@wire(getFacilityData)
wiredFacilities({ data, error }) {
  if (data) {
    const opts = data.map(f => ({ label: f.Name, value: f.Id }));
    this.facilityOptions = [{ label: 'All', value: 'ALL' }, ...opts];
  } else if (error) {
    // optional: toast/log
  }
}


async loadOnboardings() {
  console.groupCollapsed('[Onboarding] loadOnboardings');
  try {
    const facilityId = this._facilityId;
    const orgId      = this.orgId;

    // Need at least orgId for either view
    if (!orgId) {
      console.warn('• Skipping query — missing orgId');
      this.onboardings = [];
      this.orgOnboardings = [];
      return;
    }

    // --- FACILITY VIEW (UNCHANGED) ---
    if (facilityId) {
      const rows = await getOnboardingList({
        maxRows: 200,
        facilityId,
        orgId
      });
      console.log('• Apex raw rows:', rows);

      const mapped = (rows || []).map(r => {
        const s = (r.status || '').toLowerCase();
        const need = r.userAccountNeeded === true; // boolean from Apex

        return {
          ...r,
          id: r.id,
          isRequestSent : s === 'request sent',
          isDataReceived: s === 'data received',
          isCreated     : s === 'created',
          isReviewed    : s === 'reviewed',
          displayRole   : toDisplayRole(r.role),
          needAccount   : need,
          needIcon      : need ? 'person_add' : 'person_off',
          reviewTitle   : need ? 'Reviewed — Account Needed' : 'Reviewed — No Account',
          needLabel     : need ? 'Account Needed' : 'No Account',
          needClass     : need ? 'status-pill account-needed' : 'status-pill account-not-needed',
          _selectedReviewed: false
        };
      });

      this.onboardings = mapped;         // facility view data
      this.orgOnboardings = [];          // clear org-only list when in facility view

      console.log('• Mapped rows (with flags):', mapped);
      console.log(
        '• Total:', mapped.length,
        '| sent:', mapped.filter(x => x.isRequestSent).length,
        '| received:', mapped.filter(x => x.isDataReceived).length,
        '| created:', mapped.filter(x => x.isCreated).length,
        '| reviewed:', mapped.filter(x => x.isReviewed).length,
        '| need acct:', mapped.filter(x => x.needAccount).length
      );
       await this.loadPillCounts();
      console.groupEnd();
      return; // IMPORTANT: preserve exact facility flow
    }

    // --- ORG-ONLY VIEW (new) ---
    const orgRows = await getOnboardingListByOrg({
      maxRows: 200,
      orgId
    });
    console.log('• Apex raw rows (org-only):', orgRows);

    const orgMapped = (orgRows || []).map(r => {
      const s = (r.status || '').toLowerCase();
      const need = r.userAccountNeeded === true;

      return {
        ...r,
        id: r.id,
        isRequestSent : s === 'request sent',
        isDataReceived: s === 'data received',
        isCreated     : s === 'created',
        isReviewed    : s === 'reviewed',
        displayRole   : toDisplayRole(r.role),
        needAccount   : need,
        needIcon      : need ? 'person_add' : 'person_off',
        reviewTitle   : need ? 'Reviewed — Account Needed' : 'Reviewed — No Account',
        needLabel     : need ? 'Account Needed' : 'No Account',
        needClass     : need ? 'status-pill account-needed' : 'status-pill account-not-needed',
        _selectedReviewed: false
      };
    });

    this._allOrgOnboardings = orgMapped;
this.applyOrgFilterAndPaginate(); // sets this.orgOnboardings for the table
this.onboardings = [];  
    console.log('• Mapped rows (org-only):', orgMapped);
    console.log(
      '• Total:', orgMapped.length,
      '| sent:', orgMapped.filter(x => x.isRequestSent).length,
      '| received:', orgMapped.filter(x => x.isDataReceived).length,
      '| created:', orgMapped.filter(x => x.isCreated).length,
      '| reviewed:', orgMapped.filter(x => x.isReviewed).length,
      '| need acct:', orgMapped.filter(x => x.needAccount).length
    );
  } catch (e) {
    const msg = e?.body?.message || e?.message || 'Failed to load';
    console.error('! loadOnboardings error:', e);
    this.toast?.('Load error', msg, 'error');
  } finally {
    console.groupEnd();
  }
}


async loadPillCounts() {
  const facilityId = this._facilityId;
  const orgId = this.orgId;

  console.groupCollapsed('[Pills] loadPillCounts', 'facilityId=', facilityId, 'orgId=', orgId);
  try {
    if (!facilityId) {
      console.warn('• Skipping counts — facilityId is required for facility pills');
      return;
    }
    const data = await getOnboardingCounts({ facilityId, orgId });
    console.log('• counts from Apex:', JSON.parse(JSON.stringify(data)));

    const before = JSON.parse(JSON.stringify(this.pillCounts));
    this.pillCounts = { ...this.pillCounts, ...data };

    console.log('• pillCounts BEFORE:', before);
    console.log('• pillCounts AFTER :', this.pillCounts);
  } catch (e) {
    console.error('! loadPillCounts error:', e);
  } finally {
    console.groupEnd();
  }
}


// --- Selection state for Reviewed rows ---
selectedReviewedIds = new Set();
 _facilityId;

  @api
  get facilityId() { return this._facilityId; }
  set facilityId(v) {
    this._facilityId = v;
    console.log('[OnBoarding] @api facilityId set ->', v);
  }

  get hasFacility() {
  return !!this._facilityId;
}
  orgId;
  orgName;
 _orgLoaded = false;

// Mount
connectedCallback() {
console.log('[OnBoarding] connectedCallback facilityId =', this._facilityId);
 this.fetchOrgInfo().then(() => this.loadOnboardings());
  const origin = window.location.origin;           
  this.signerBaseUrl = `${origin}/Onboarding/s/`;
}
  // ===== Derived state =====
  get allSelected() {
    return this.rows.length && this.rows.every(r => r.selected);
  }
  get disableRemoveSelected() {
    return !this.rows.some(r => r.selected);
  }
  get disableCreate() {
    return !this.rows.some(r => !r.error);
  }

   async fetchOrgInfo() {
    if (this._orgLoaded) return;
    this._orgLoaded = true;

    console.groupCollapsed('[OnBoarding] fetchOrgInfo');
    try {
      console.log('• calling Apex: OrgDetails.orgDetails()');
      const resp = await orgDetails(); // returns Organisation__c or null per your Apex
      console.log('• orgDetails response =>', resp);

      if (resp) {
        this.orgId = resp.Id;
        this.orgName = resp.Name;
        console.log('✓ orgId =', this.orgId, ', orgName =', this.orgName);
      } else {
        console.warn('! orgDetails returned null/empty');
      }
    } catch (e) {
      console.error('! orgDetails call failed:', e?.body?.message || e?.message || e);
    } finally {
      console.groupEnd();
    }
  }

  // ===== UI handlers =====
  handleEmailInput(e) {
    this.emailInput = e.target.value || '';
    this.computeInvalidsPreview();
  }

// class fields
inputVisible = true;


isClearingEmail = false;

handleClearInput() {
  // 1) swap views first (so the cancel always takes effect)
  this.issendinvite  = false;
  this.isexistonboard = true;

  // 2) block late input events from writing old text back (optional but helpful)
  this.isClearingEmail = true;

  // 3) defer the cleanup so it runs after the template re-renders
  Promise.resolve().then(() => {
    try {
      this.resetCompose(true);
    } finally {
      this.isClearingEmail = false;
    }
  });
}


resetCompose(clearFiles = true) {
  // state
  this.rows = [];
  this.emailInput = '';
  this.invalidEmailsText = '';
  this.csvErrors = [];
  this.allSelected = false;


  // force remount of the textarea
  this.inputVisible = false;
  requestAnimationFrame(() => { this.inputVisible = true; });

  // clear file inputs
  if (clearFiles && this.template) {
    try {
      const csv = this.template.querySelector('#csvInput');
      if (csv) csv.value = null;
      const doc = this.template.querySelector('#SN-docInput');
      if (doc) doc.value = null;
    } catch (_) {}
  }

}
  @track isUserTypeDisabled = true;
@track isexistonboard= true;
@track issendinvite=false;
userTypeRole;  
 UserTypeValues = [];

@wire(getUserTypeValuesfromOrg, { selectedroleValue: '$selectedRole', userId: '$userId' })
wiredMultiPicklistValues({ data, error }) {
  if (data) {
    // Apex returns an array of strings -> map to label/value
    this.UserTypeValues = data.map(s => ({ label: s, value: s }));
  } else if (error) {
    console.error('UserType wire error', error);
    this.UserTypeValues = [];
  }
}

handlesendinvite(){
  this.isexistonboard = false;
  this.issendinvite =true;
}


  toggleSelectAll(e) {
    const checked = e.target.checked;
    this.rows = this.rows.map(r => ({ ...r, selected: checked }));
  }

  handleRowSelect(e) {
    const id = e.target.dataset.id;
    const checked = e.target.checked;
    this.rows = this.rows.map(r => (r.id === id ? { ...r, selected: checked } : r));
  }

userId = Id;
userTypeCache = {}; // { [role: string]: Array<{label,value}> }

handleRoleChange = (event) => {
  const id   = String(event.currentTarget.dataset.id);
  const role = event.detail?.value || '';

  // Disable user type until options load, and set roleError when role is empty
  this.rows = this.rows.map(r =>
    String(r.id) === id
      ? {
          ...r,
          role,
          roleError: !role,                                   // ✅ NEW: show error when empty
          roleWrapperClass: !role ? 'SN-cell has-error' : '', // (optional styling helper)
          userType: null,
          userTypeError: false,                               // ✅ NEW: clear userType error when role changes
          isUserTypeDisabled: !role,
          userTypeOptions: [],
          userTypeWrapperClass: !role ? 'slds-is-disabled usertype_disable' : '',
          userTypePlaceholder: !role ? 'Select a role first' : 'Select user type'
        }
      : r
  );

  if (!role) return; // nothing to fetch if role cleared

  this.fetchUserTypesForRole(role)
    .then((opts) => {
      this.rows = this.rows.map(r =>
        String(r.id) === id
          ? {
              ...r,
              userTypeOptions: opts,
              isUserTypeDisabled: !opts.length,
              userTypeWrapperClass: !opts.length ? 'slds-is-disabled usertype_disable' : '',
              userTypePlaceholder: !opts.length ? 'No user types for role' : 'Select user type'
            }
          : r
      );
    })
    .catch(() => {
      this.rows = this.rows.map(r =>
        String(r.id) === id
          ? {
              ...r,
              userTypeOptions: [],
              isUserTypeDisabled: true,
              userTypeWrapperClass: 'slds-is-disabled usertype_disable',
              userTypePlaceholder: 'Select a role first'
            }
          : r
      );
    });
};



handleUserTypeChange = (event) => {
  const id = String(event.currentTarget.dataset.id);
  const value = event.detail.value;
  this.rows = this.rows.map(r => String(r.id) === id ? { ...r, userType: value } : r);
};

// ---- helpers ----
fetchUserTypesForRole(role) {
  if (!role) return Promise.resolve([]);
  if (this.userTypeCache[role]) return Promise.resolve(this.userTypeCache[role]);

  return getUserTypeValuesfromOrg({ selectedroleValue: role, userId: this.userId })
    .then(data => {
      const opts = (data || []).map(s => ({ label: s, value: s }));
      this.userTypeCache[role] = opts;
      return opts;
    });
}

  handleRemoveRow(e) {
    const id = e.currentTarget.dataset.id;
    this.rows = this.rows.filter(r => r.id !== id);
  }

  handleRemoveSelected() {
    this.rows = this.rows.filter(r => !r.selected);
  }

async handleAddEmails() {
  const parsed = parseEmails(this.emailInput || '');
  if (!parsed.length) {
    this.toast('Nothing to add', 'Please enter at least one email.', 'warning');
    return;
  }

  const existing = new Set((this.rows || []).map(r => (r.email || '').toLowerCase()));
  const seenInBatch = new Set();

  const goodCandidates = [];    // valid format & not dup in table or batch
  const errors = [];            // to display in invalidEmailsText
  let skippedInvalid = 0;
  let skippedDuplicates = 0;

  for (const p of parsed) {
    const emailOrig = (p.email || '').trim();
    const lower = emailOrig.toLowerCase();

    if (p.error) {
      skippedInvalid++;
      errors.push({ code: 'INVALID_EMAIL', msg: `Invalid email: ${emailOrig}` });
      continue;
    }

    if (existing.has(lower) || seenInBatch.has(lower)) {
      skippedDuplicates++;
      // (don’t need to show every dup unless you want)
      continue;
    }

    goodCandidates.push(emailOrig);
    seenInBatch.add(lower);
  }

  if (!goodCandidates.length) {
    const parts = [];
    if (skippedInvalid)    parts.push(`${skippedInvalid} invalid`);
    if (skippedDuplicates) parts.push(`${skippedDuplicates} duplicate`);
    const suffix = parts.length ? ` (${parts.join(', ')})` : '';
    this.invalidEmailsText = errors.map(e => e.msg).join('\n');
    this.computeInvalidsPreview?.();
    this.toast('No new emails', `Nothing added${suffix}.`, 'info');
    return;
  }

  // 🔹 DB check
  let existingMap = {};
  try {
    existingMap = await getExistingEmails({ emails: goodCandidates }); // Map<lowerEmail, ObjectName>
  } catch (e) {
    existingMap = {};
  }

  // Only add the ones NOT in Salesforce; gather DB dupes into errors
  const rowsToAdd = [];
  let dbDupes = 0;

  for (const email of goodCandidates) {
    const lower = email.toLowerCase();
    const inObj = existingMap[lower];
    // when marking DB duplicates
if (inObj) {
  dbDupes++;
  errors.push({ code: 'DB_DUPLICATE', msg: `${email} already exists` }); // ← simplified
  continue; // do NOT add
}

// after processing, set the textarea:
this.invalidEmailsText = errors.map(e => e.msg).join('\n'); // ← one per line


    rowsToAdd.push({
      id: newId(),
      email,
      role: null,
      userType: null,
      userTypeOptions: [],
      isUserTypeDisabled: true,
      userTypeError: false,
      progress: 0,
      progressStyle: 'width:0%',
      selected: false,
      error: null
    });

    existing.add(lower);
  }

  if (rowsToAdd.length) {
    this.rows = [...(this.rows || []), ...rowsToAdd];
  }

  // show errors directly in the textarea
  this.invalidEmailsText = errors.map(e => e.msg).join('\n');
  this.computeInvalidsPreview?.();

  // toast summary
  let msg = `${rowsToAdd.length} Email(s) added to onboarding list.`;
  const extras = [];
  if (skippedInvalid)    extras.push(`${skippedInvalid} invalid`);
  if (skippedDuplicates) extras.push(`${skippedDuplicates} duplicate`);
  if (dbDupes)           extras.push(`${dbDupes} duplicate`);
  if (extras.length) msg += ` Skipped: ${extras.join(', ')}.`;

  this.toast('Added', msg, rowsToAdd.length ? 'success' : 'info');
}

  // ===== STATE =====
csvErrors = []; // [{row, msg}]

async handleCsvUpload(event) {
  const inputEl = event?.target;
  try {
    this.csvErrors = [];
    const file = inputEl && inputEl.files && inputEl.files[0];
    if (!file) return;

    const maxBytes = 2 * 1024 * 1024; // 2 MB
    if (file.size > maxBytes) {
      this.toast('File too large', 'Please upload a CSV up to 2 MB.', 'error');
      if (inputEl) inputEl.value = null;
      return;
    }

    const nameOk = /\.csv$/i.test(file.name);
    const typeOk = /(^text\/csv$)|(^application\/vnd\.ms-excel$)/i.test(file.type) || file.type === '';
    if (!nameOk && !typeOk) {
      this.toast('Invalid file', 'Please upload a .csv file.', 'error');
      if (inputEl) inputEl.value = null;
      return;
    }

    const text = await file.text();

    // ⬇️ new: async + DB check inside, and it WON’T add errored rows
    const { addedCount, skippedDuplicates, errors } = await this.parseCsvAndAddRows(text);

    const now = Date.now();
    this.csvErrors = (errors || []).map((e, idx) => ({
      key: e.key || `csv-${now}-${idx}-${e.row ?? 'r'}`,
      ...e
    }));

    // after: just the message per line
this.invalidEmailsText = (this.csvErrors || [])
  .map(e => e.msg)
  .join('\n');


    const invalidEmailCount  = this.csvErrors.filter(e => e.code === 'INVALID_EMAIL').length;
    const duplicateDbCount   = this.csvErrors.filter(e => e.code === 'DB_DUPLICATE').length;
    const invalidFileCount   = this.csvErrors.filter(e => e.code === 'INVALID_FILE').length;

    if (addedCount > 0) {
      let msg = `${addedCount} row(s) added`;
      if (skippedDuplicates)  msg += `, ${skippedDuplicates} duplicate(s) skipped`;
      if (invalidEmailCount)  msg += `, ${invalidEmailCount} invalid email(s) ignored`;
      if (duplicateDbCount)   msg += `, ${duplicateDbCount} duplicate(s)`;
      if (invalidFileCount)   msg += `, ${invalidFileCount} invalid row(s)`;
      msg += '.';
      this.toast('Added from CSV', msg, 'success');
    } else {
      let msg = 'Nothing to add from the file.';
      const parts = [];
      if (skippedDuplicates) parts.push(`${skippedDuplicates} duplicate(s)`);
      if (invalidEmailCount) parts.push(`${invalidEmailCount} invalid email(s)`);
      if (duplicateDbCount)  parts.push(`${duplicateDbCount} duplicate(s)`);
      if (invalidFileCount)  parts.push(`${invalidFileCount} invalid row(s)`);
      if (parts.length) msg = parts.join(', ') + '.';
      this.toast('Error in bulk upload, Invalid file format or missing data. ', msg, 'error');
    }
  } catch (e) {
    this.toast('CSV error', this.reduceError ? this.reduceError(e) : (e?.message || 'Failed to read CSV'), 'error');
  } finally {
    if (inputEl) inputEl.value = null;
  }
}

SN_openCsvPicker = () => {
  const inp = this.template.querySelector('#csvInput');
  if (inp) inp.click();
};

SN_onDragOver = (e) => {
  e.preventDefault();                  // allow drop
  e.dataTransfer.dropEffect = 'copy';
  e.currentTarget.classList.add('SN-dropzone--active');
};

SN_onDragLeave = (e) => {
  e.currentTarget.classList.remove('SN-dropzone--active');
};

SN_onDrop = async (e) => {
  e.preventDefault();
  const dz = e.currentTarget;
  dz.classList.remove('SN-dropzone--active');

  const files = Array.from(e.dataTransfer?.files || []);
  if (!files.length) return;

  const csvs = files.filter(f => {
    const name = (f.name || '').toLowerCase();
    const type = (f.type || '').toLowerCase();
    return name.endsWith('.csv') || type.includes('text/csv') || type.includes('application/vnd.ms-excel');
  });

  if (!csvs.length) {
    this.toast('Unsupported file', 'Please drop a CSV file.', 'warning');
    return;
  }

  for (const file of csvs) {
    try {
      const text = await readFileText(file);
      const { addedCount, skippedDuplicates, errors } = this.parseCsvAndAddRows(text);
      if (addedCount) this.toast('Added', `${addedCount} row(s) from ${file.name}`, 'success');
      if (skippedDuplicates) this.toast('Duplicates', `${skippedDuplicates} duplicate row(s) skipped from ${file.name}`, 'info');
      if (errors?.length) this.csvErrors = [...(this.csvErrors || []), ...errors];
    } catch (_err) {
      this.toast('Read failed', `Could not read ${file.name}`, 'error');
    }
  }
};

downloadSampleCsv() {
  const sample = [
    'Email',
    'alice@example.com',
    'bob@example.com'
  ].join('\n');
  const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'onboarding_sample.csv';
  a.click();
  URL.revokeObjectURL(url);
}
async parseCsvAndAddRows(csvText) {
  const errors = [];
  const matrix = csvToMatrix(csvText);
  if (!matrix.length) {
    return { addedCount: 0, skippedDuplicates: 0, errors };
  }

  // 🔹 Enforce single column rule
  const headerRow = matrix[0] || [];
  const headersLower = headerRow.map(h => (h || '').toString().trim().toLowerCase());

  // must be exactly 1 column, and must be some variant of "email"
  if (headerRow.length !== 1 || !['email', 'email address', 'email_address'].includes(headersLower[0])) {
    errors.push({
      code: 'INVALID_FILE',
      row: 1,
      msg: 'File must contain exactly one column with header "Email".'
    });

    this.invalidEmailsText = errors.map(e => e.msg).join('\n');
    return { addedCount: 0, skippedDuplicates: 0, errors };
  }

  // after this point → guaranteed 1 col = email
  let startIdx = 1; // always skip header
  let emailCol = 0;

  if (!Array.isArray(this.rows)) this.rows = [];
  const existingInTable = new Set((this.rows || []).map(r => (r.email || '').toLowerCase()));

  let added = 0;
  let skippedDuplicates = 0;

  const candidateRows = [];
  const emailsForDbCheck = [];
  const emailRowNum = new Map();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

  for (let rowIdx = startIdx; rowIdx < matrix.length; rowIdx++) {
    const cells = matrix[rowIdx] || [];
    const rawEmail = (cells[emailCol] ?? '').toString().trim();

    if (!rawEmail) continue;

    if (!emailRegex.test(rawEmail)) {
      errors.push({
        code: 'INVALID_EMAIL',
        row: rowIdx + 1,
        msg: `Invalid email format: "${rawEmail}"`
      });
      continue;
    }

    const lower = rawEmail.toLowerCase();
    if (existingInTable.has(lower)) {
      skippedDuplicates++;
      continue;
    }

    candidateRows.push(rawEmail);
    emailsForDbCheck.push(rawEmail);
    emailRowNum.set(lower, rowIdx + 1);
  }

  // 🔹 DB check (User, Staff__c, Client__c, Onboarding__c)
  let existingMap = {};
  if (emailsForDbCheck.length) {
    try {
      existingMap = await getExistingEmails({ emails: emailsForDbCheck });
    } catch {
      existingMap = {};
    }
  }

  const toActuallyAdd = [];
  for (const email of candidateRows) {
    const lower = email.toLowerCase();
    const inObj = existingMap[lower];
    if (inObj) {
      errors.push({
        code: 'DB_DUPLICATE',
        row: emailRowNum.get(lower),
        msg: `${email} already exists`
      });
      continue;
    }

    toActuallyAdd.push({
      id: newId(),
      email,
      role: null,
      userType: null,
      userTypeOptions: [],
      isUserTypeDisabled: true,
      userTypeError: false,
      progress: 0,
      progressStyle: 'width:0%',
      selected: false,
      error: null
    });
  }

  if (toActuallyAdd.length) {
    this.rows = [...this.rows, ...toActuallyAdd];
    added = toActuallyAdd.length;
  }

  this.invalidEmailsText = errors
    .map(e => e.row ? `Line ${e.row}: ${e.msg}` : e.msg)
    .join('\n');

  this.computeInvalidsPreview?.();

  return { addedCount: added, skippedDuplicates, errors };
}



async handleCreateRecords() {
  // Prevent double-submit
  if (this.isSaving) return;

  // Nothing to save
  if (!this.rows?.length) {
    this.toast('Nothing to create', 'Add at least one email to the table.', 'warning');
    return;
  }

  // --- NEW: figure out target rows (selected or all) ---
  const selectedIdxs = this.rows.map((r, i) => (r.selected ? i : -1)).filter(i => i >= 0);
  const targetIdxs   = selectedIdxs.length ? selectedIdxs : this.rows.map((_, i) => i);
  const targetRows   = targetIdxs.map(i => this.rows[i]);

  const missingRoleIds = targetRows.filter(r => !r.role).map(r => r.id);
  const missingTypeIds = targetRows.filter(r => !r.userType).map(r => r.id);
   if (missingRoleIds.length || missingTypeIds.length) {
    const roleSet = new Set(missingRoleIds);
    const typeSet = new Set(missingTypeIds);
    this.rows = this.rows.map(r => ({
      ...r,
      roleError: roleSet.has(r.id) || r.roleError === true,
      userTypeError: typeSet.has(r.id) || r.userTypeError === true
    }));
    this.toast('Missing data', 'Role and User Type are required for all selected rows.', 'error');
    return;
  }
   const facilityId = this._facilityId;
    console.log('[OnBoarding] handleCreateRecords using facilityId =', facilityId);

    if (!facilityId) {
      this.toast('Missing Facility', 'Open/select a Facility before sending invites.', 'error');
      return;
    }

  // Build a plain JSON payload (no proxies/getters) from target rows only
   console.log('[OnBoarding] handleCreateRecords using orgId      =', this.orgId);
  const payload = targetRows.map(r => ({
    email: r?.email ?? '',
    userType: r?.userType ?? '',
    role:    r?.role    ?? ''  
  }));
  const plain = JSON.parse(JSON.stringify(payload));
  console.groupCollapsed('[OnBoarding] createOnboardingRawAndEmail payload');
console.log('targetIdxs:', targetIdxs);
console.log('facilityId:', this.facilityId, 'orgId:', this.orgId);
console.log('baseUrl:', this.signerBaseUrl);
console.log('count:', plain.length);
try {
  console.table(plain);                    // nice tabular view
} catch {
  console.log('plain:', plain);
}
console.log('plain JSON:', JSON.stringify(plain)); // full serialized view if needed
console.groupEnd();

  // UI state
  this.isSaving = true;

  // --- NEW: bump progress to 25% only for targeted rows ---
  this.rows = this.rows.map((r, i) =>
    targetIdxs.includes(i)
      ? { ...r, progress: 25, progressStyle: 'width:25%' }
      : r
  );

  try {
    if (!this.signerBaseUrl) {
      throw new Error('Signing page URL is missing. Set this.signerBaseUrl.');
    }

    const results = (await createOnboardingRawAndEmail({
      rows: plain,
      baseUrl: this.signerBaseUrl,
      facilityId: this.facilityId,
      orgId: this.orgId
    })) || [];

    this.lastSendResults = (results || []).map(r => ({
  email: r.email,
  recordId: r.recordId,
  success: r.success === true,
  message: r.message || ''
}));

// Show results view with Successful tab selected
this.showResultTabs = true;
this.activeTab = 'success';
    const arr = Array.isArray(results) ? results : [];

    // Ensure we can map 1:1 by index even if server returns fewer items
    const padded = [...arr];
    while (padded.length < targetRows.length) padded.push(null);

    // --- NEW: quick map of rowIndex -> position within targetIdxs ---
    const posByRowIndex = new Map();
    targetIdxs.forEach((rowIdx, pos) => posByRowIndex.set(rowIdx, pos));

    // Map results into rows (only targeted rows are updated)
    this.rows = this.rows.map((r, i) => {
      const pos = posByRowIndex.get(i);
      if (pos === undefined) return r; // untouched row

      const res = padded[pos];
      if (!res) {
        return { ...r, progress: 0, progressStyle: 'width:0%', error: r.error || 'No server response' };
      }

      return {
        ...r,
        email: (res.email && res.email.trim()) ? res.email : r.email,
        progress: res.success ? 100 : 0,
        progressStyle: `width:${res?.success ? 100 : 0}%`,
        error: res.success ? null : (res.message || 'Failed')
      };
    });

    const ok  = padded.filter(x => x && x.success).length;
    const bad = padded.filter(x => !x || (x && !x.success)).length;

    if (ok) this.toast('Success', `${ok} record(s) created & emails queued.`, 'success');
    if (bad) this.toast('Some failed', `${bad} row(s) failed. Check errors in the table.`, 'warning');

    // Refresh the "Existing Onboarding Records" table after any success
    if (ok > 0 && typeof this.loadOnboardings === 'function') {
      await this.loadOnboardings();
    }

    // If ALL succeeded:
    // - if user targeted all rows in the table, do your full reset (unchanged)
    // - else just remove the succeeded targeted rows, keep the rest
    if (ok > 0 && bad === 0) {
      if (targetIdxs.length === this.rows.length) {
        // Full reset (same as your current behavior)
        this.rows = [];
        this.emailInput = '';
        this.invalidEmailsText = '';
        this.csvErrors = [];
        this.issendinvite = false;
        this.isexistonboard = true;
        if (this.template) {
          const csv = this.template.querySelector('#csvInput');
          if (csv) csv.value = null;
          const doc = this.template.querySelector('#SN-docInput');
          if (doc) doc.value = null;
        }
        return; // nothing else to do
      }
    }

    // Partial or mixed: remove only succeeded targeted rows; keep failures and any non-targeted rows
    if (ok > 0) {
      const successSet = new Set(
        targetIdxs.filter((_, pos) => padded[pos]?.success === true)
      );
      this.rows = this.rows.filter((_, i) => !successSet.has(i));
      if (!this.rows.length) this.emailInput = '';
    }

  } catch (e) {
    // --- NEW: reset progress only for targeted rows on error ---
    this.rows = this.rows.map((r, i) =>
      targetIdxs.includes(i) ? { ...r, progress: 0, progressStyle: 'width:0%' } : r
    );
    this.toast('Error', reduceError(e), 'error');
  } finally {
    this.isSaving = false;
  }
}


// add next to bumpProgressAll
bumpProgressSome(indexes, value) {
  const set = new Set(indexes);
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  this.rows = this.rows.map((r, i) =>
    set.has(i) ? { ...r, progress: pct, progressStyle: `width:${pct}%` } : r
  );
}



bumpProgressAll(value) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  this.rows = this.rows.map(r => ({
    ...r,
    progress: pct,
    progressStyle: `width:${pct}%`     // <-- keep style in sync
  }));
}


  toast(title, message, variant) {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
  }


 // ===== Onboarding details + approval (prefixed ob_*) =====
ob_showDetailsModal = false;
ob_showConfirmModal = false;
ob_isLoadingDetails = false;
ob_isApproving = false;

ob_selectedRecordId = null;
/** Array<{ apiName: string, label: string, value: string }> */
ob_selectedRecordFields = [];
ob_handleStatusToggle = (evt) => {
  const checked = !!evt.detail.checked;
  this.ob_statusActive = checked;
  this._writeStatusIntoJson(checked);
};

toBoolFlexible(v) {
  if (v === true || v === false) return v;
  const x = String(v ?? '').trim().toLowerCase();
  if (!x) return false;
  if (['active','enabled','true','yes','y','1','on'].includes(x))  return true;
  if (['inactive','disabled','false','no','n','0','off'].includes(x)) return false;
  return false;
}

pickStatusFromPayload(obj) {
  if (!obj || typeof obj !== 'object') return null;
  return obj.Status ?? obj.status ?? obj.Active ?? obj.active ?? obj.IsActive ?? obj.isActive ?? null;
}

// write the Status value back into the JSON payload
_writeStatusIntoJson(activeBool) {
  if (!this.ob_originalData || typeof this.ob_originalData !== 'object') {
    this.ob_originalData = {};
  }
  const newVal = activeBool ? 'Active' : 'Inactive';

  // case-insensitive map of top-level keys
  const topMap = Object.keys(this.ob_originalData).reduce((m, k) => {
    m[k.toLowerCase()] = k; return m;
  }, {});

  // candidates to store status (prefer employment.status)
  const candidates = [
    ['employment','status'],
    ['person','status'],
    ['status'] // top-level
  ];

  let done = false;
  for (const path of candidates) {
    if (path.length === 2) {
      const [secLo, keyLo] = path;
      const secReal = topMap[secLo];
      if (secReal && typeof this.ob_originalData[secReal] === 'object') {
        const secObj = this.ob_originalData[secReal];
        const secKeys = Object.keys(secObj).reduce((m, k) => { m[k.toLowerCase()] = k; return m; }, {});
        const keyReal = secKeys[keyLo] || 'status';
        secObj[keyReal] = newVal;
        done = true; break;
      }
    } else {
      const keyReal = topMap['status'] || 'status';
      this.ob_originalData[keyReal] = newVal;
      done = true; break;
    }
  }
  if (!done) {
    // default: create employment.status
    this.ob_originalData.employment = this.ob_originalData.employment || {};
    this.ob_originalData.employment.status = newVal;
  }
}

// ---- UPDATED (drop-in) ----
ob_modalOpenDetails = async (event) => {
  try {
    const idFromDom = event?.currentTarget?.dataset?.id;
    console.log('[ob_modalOpenDetails] idFromDom =', idFromDom);
    if (!idFromDom) {
      this.toast('Missing Id', 'No record id found on clicked pill.', 'error');
      return;
    }

    // select record + open modal
    this.ob_selectedRecordId = idFromDom;
    this.ob_showDetailsModal = true;
    this.ob_isLoadingDetails = true;

    // fetch DTO from Apex (payload + checkbox)
    const dto = await GET_RECEIVED_DATA({ onboardingId: this.ob_selectedRecordId });
    const raw = dto?.payloadJson || '';
    this.ob_userAccountNeeded = !!dto?.userAccountNeeded;

    console.log('[getReceivedData] raw =', raw, 'userAccountNeeded =', this.ob_userAccountNeeded);

    // parse and hold original data for later Save
    try {
      this.ob_originalData = raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn('Invalid JSON in Recieved_Data__c, showing as empty preview.', e);
      this.ob_originalData = {};
    }

    // NEW: derive read-only status toggle from JSON payload
    const statusVal = this.pickStatusFromPayload(this.ob_originalData);
    this.ob_statusActive = this.toBoolFlexible(statusVal);

    // build flat preview (no sections, ignore _meta)
    // NEW: exclude Status/Active fields from the preview grid
    const allFields = this.obBuildFlatPreview(raw) || [];
    const EXCLUDE = new Set(['status','Status','active','Active','isActive','IsActive']);
    this.ob_selectedRecordFields = allFields.filter(f => !EXCLUDE.has(String(f.apiName || '')));

    console.log('[preview] fields =', this.ob_selectedRecordFields);

    // seed edit draft from current fields so Edit is instant (unchanged)
    const draft = {};
    (this.ob_selectedRecordFields || []).forEach(f => { draft[f.apiName] = f.value; });
    this.ob_editDraft = draft;

    if (!this.ob_selectedRecordFields.length) {
      this.toast('No details', 'No details available for this record.', 'info');
    }
  } catch (e) {
    console.error('load error', e);
    this.toast('Load error', (e && (e.body?.message || e.message)) || 'Failed to load details', 'error');
    this.ob_showDetailsModal = false;
  } finally {
    this.ob_isLoadingDetails = false;
  }
};


ob_statusActive = false; // drives the read-only toggle


ob_modalCloseDetails = () => {

    try {
    // rebuild the UI list from the original JSON we stored when opening the modal
    const payloadJson = JSON.stringify(this.ob_originalData || {});
    this.ob_selectedRecordFields = this.obBuildFlatPreview(payloadJson);

    // clear draft and exit edit mode
    this.ob_editDraft = {};
    this.ob_isEditing = false;
  } catch (e) {
    // even if something goes wrong, exit edit mode to avoid trapping the user
    this.ob_isEditing = false;
  }

  this.ob_showDetailsModal = false;
  this.ob_selectedRecordId = null;
  this.ob_selectedRecordFields = [];
};

ob_handleApproveClick = () => {
  // hide details drawer, show confirmation
  this.ob_showDetailsModal = false;
  this.ob_showConfirmModal = true;
};

ob_closeConfirm = () => {
  this.ob_showConfirmModal = false;
};

ob_confirmApprove = async () => { 
  if (!this.ob_selectedRecordId) {
    this.toast('Missing Id', 'No onboarding id selected.', 'error');
    return;
  }
  this.ob_isApproving = true;
  try {
    const updatedPayloadJson = JSON.stringify(this.ob_originalData ?? {});
    const res = await APPROVE_ONBOARDING({
      onboardingId: this.ob_selectedRecordId,
      userAccountNeeded: this.ob_userAccountNeeded,
      payloadJson: updatedPayloadJson  
    });
    if (res && res.success) {
      this.toast('User verified.', 'You may proceed with next steps.', 'success');
      this.ob_showConfirmModal = false;

      // optional: close details modal after approve
      this.ob_showDetailsModal = false;

      // refresh list
      if (typeof this.loadOnboardings === 'function') {
        await this.loadOnboardings();
      }
    } else {
      throw new Error((res && res.message) || 'Approval failed');
    }
  } catch (e) {
    this.toast('Approval failed', (e && (e.body?.message || e.message)) || 'Unknown error', 'error');
  } finally {
    this.ob_isApproving = false;
  }
};
obBuildFlatPreview(raw) {
  if (!raw) return [];
  let data;
  try { 
    data = JSON.parse(raw); 
  } catch { 
    return []; 
  }

  // case-insensitive top keys
  const top = {};
  Object.keys(data || {}).forEach(k => { 
    top[k.toLowerCase()] = data[k]; 
  });

  const nonEditable = new Set(['person.email', 'employment.role']);
  const isAddr = (api) => api.startsWith('address.');
  const EXCLUDE_KEYS = new Set(['status', 'facilityidorname']);

  const labelMap = {
    firstName: 'First Name', lastName: 'Last Name', gender: 'Gender',
    dateOfBirth: 'Date of Birth', email: 'Email', phone: 'Phone',
    role: 'Role', userType: 'User Type', facilityIdOrName: 'Facility',
    hourlyRate: 'Hourly Rate', taxFileNumber: 'Tax File Number',
    taxFreeThreshold: 'Tax Threshold', startDate: 'Start Date',
    street: 'Street', city: 'City', province: 'Province / State',
    postalCode: 'Postal Code', country: 'Country'
  };

  const wanted = ['person', 'employment', 'address'];
  const out = [];

  for (const sec of wanted) {
    const obj = top[sec];
    if (!obj || typeof obj !== 'object') continue;

    Object.keys(obj).forEach(k => {
      if (EXCLUDE_KEYS.has(String(k).toLowerCase())) return;
      const val = obj[k];
      if (val === null || val === undefined) return;

      let str = this.obStringify(val).trim();
      if (!str && str !== '0') return;

      const api = `${sec}.${k}`;

      // special case for DOB + Start Date
      if (api === 'person.dateOfBirth' || api === 'employment.startDate') {
        try {
          const d = new Date(val);
          if (!isNaN(d)) {
            const iso = d.toISOString().slice(0, 10); // yyyy-MM-dd
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            const display = `${dd}/${mm}/${yyyy}`;

            out.push({
              apiName: api,
              label: labelMap[k] || this.obLabelize(k),
              value: display,   // dd/MM/yyyy for preview
              rawValue: iso,    // yyyy-MM-dd for editing
              _editable: !(nonEditable.has(api) || isAddr(api)),
              _isDate: true
            });
            return; // prevent pushing twice
          }
        } catch (e) { /* ignore */ }
      }

      // default push (all non-date fields)
      out.push({
        apiName: api,
        label: labelMap[k] || this.obLabelize(k),
        value: str,
        _editable: !(nonEditable.has(api) || isAddr(api)),
        _isDate: false
      });
    });
  }

  // Primary contact logic (unchanged)
  const pc = top['primarycontact'];
  const meta = top['_meta'];
  const tokenRole     = (meta?.tokenRole || meta?.role || '').toString().trim().toLowerCase();
  const tokenUserType = (meta?.tokenUserType || meta?.userType || '').toString().trim().toLowerCase();

  const emp = top['employment'] || {};
  const empRole     = (emp.role || '').toString().trim().toLowerCase();
  const empUserType = (emp.userType || '').toString().trim().toLowerCase();

  const roleMatch = tokenRole === 'portal account partner manager' || empRole === 'portal account partner manager';
  const utMatch   = tokenUserType === 'ndis participant' || empUserType === 'ndis participant';

  if (pc && typeof pc === 'object' && roleMatch && utMatch) {
    const add = (key) => {
      const val = pc[key];
      if (val == null) return;
      const str = this.obStringify(val).trim();
      if (!str && str !== '0') return;
      out.push({
        apiName: `primaryContact.${key}`,
        label: `Primary Contact - ${(labelMap[key] || this.obLabelize(key))}`,
        value: str,
        _editable: true
      });
    };
    ['firstName', 'lastName', 'relationship', 'phone'].forEach(add);
  }

  return out;
}



obStringify(v) {
  if (v === null || v === undefined) return '';
  return typeof v === 'object' ? JSON.stringify(v) : String(v);
}

obLabelize(k) {
  if (!k) return '';
  return String(k)
    .replace(/__c$/i, '')
    .replace(/[_\-]+/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

// ===== footer state =====
ob_userAccountNeeded = false;
ob_isEditing = false;
// edits kept here while in edit mode: { 'person.firstName': 'Tony', ... }
ob_editDraft = {};

// checkbox toggle
ob_toggleUserAccountNeeded = (e) => {
  this.ob_userAccountNeeded = e.detail.checked;
};

ob_toggleEdit = async () => {
  if (!this.ob_isEditing) {
    // enter edit mode: seed draft
    const draft = {};
    (this.ob_selectedRecordFields || []).forEach(f => { draft[f.apiName] = f.value; });
    this.ob_editDraft = draft;
    this.ob_isEditing = true;
    return;
  }

  // leaving edit mode (Save)
  try {
    this.ob_isSavingEdits = true;

    // 1) apply edits to UI list
    this.ob_selectedRecordFields = (this.ob_selectedRecordFields || []).map(f => {
      if (f._editable && Object.prototype.hasOwnProperty.call(this.ob_editDraft, f.apiName)) {
        return { ...f, value: this.ob_editDraft[f.apiName] };
      }
      return f;
    });

    // 2) merge edits back into the original JSON object by path ("person.firstName", etc.)
    const updated = this.obDeepClone(this.ob_originalData || {});
    for (const [path, val] of Object.entries(this.ob_editDraft || {})) {
      // only set editable fields; skip address.*, person.email, employment.role (already enforced by _editable)
      const field = (this.ob_selectedRecordFields || []).find(x => x.apiName === path);
      if (field && field._editable) this.obSetByPath(updated, path, val);
    }

    // 3) persist via Apex (do NOT deactivate link here)
    const payloadJson = JSON.stringify(updated);
    const saveRes = await SAVE_RECEIVED({
      onboardingId: this.ob_selectedRecordId,
      payloadJson,
      deactivateLink: false
    });

    if (!saveRes || !saveRes.success) {
      throw new Error(saveRes?.message || 'Failed to save changes');
    }

    // 4) update local originals and refresh preview from the just-saved JSON
    this.ob_originalData = updated;
    this.ob_selectedRecordFields = this.obBuildFlatPreview(JSON.stringify(updated));

    this.toast('Saved', 'Changes saved successfully.', 'success');
  } catch (e) {
    this.toast('Save failed', (e?.body?.message || e?.message) || 'Unable to save', 'error');
  } finally {
    this.ob_isSavingEdits = false;
    this.ob_isEditing = false;
  }
};

obDeepClone(obj) {
  try { return JSON.parse(JSON.stringify(obj)); } catch { return {}; }
}

// path like "person.firstName" → sets updated.person.firstName = value
obSetByPath(root, path, value) {
  if (!root || !path) return;
  const parts = String(path).split('.');
  let cur = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (typeof cur[p] !== 'object' || cur[p] === null) cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

ob_handleFieldChange = (e) => {
  const key = e.currentTarget?.dataset?.key;
  const val = e.detail?.value;
  if (!key) return;

  if (key === 'person.dateOfBirth' || key === 'employment.startDate') {
    // val is ISO yyyy-MM-dd (from date input)
    this.ob_editDraft = { ...this.ob_editDraft, [key]: val };
    return;
  }

  this.ob_editDraft = { ...this.ob_editDraft, [key]: val };
};


isDateField(apiName) {
  return apiName === 'person.dateOfBirth' || apiName === 'employment.startDate';
}


ob_resendEmail = async () => {
  try {
    if (!this.ob_selectedRecordId) {
      this.toast('No record', 'Select a record first.', 'warning');
      return;
    }
    if (!this.signerBaseUrl) {
      this.toast('Missing URL', 'Signing page URL not configured.', 'error');
      return;
    }
    const res = await SEND_REMINDER_EMAILS({
      onboardingIds: [this.ob_selectedRecordId],
      baseUrl: this.signerBaseUrl
    });
    const ok = Array.isArray(res) && res.some(r => r?.success);
    this.toast(
      ok ? 'Reminder sent' : 'Email failed',
      ok ? 'Email sent successfully.' : (res?.[0]?.message || 'Send failed'),
      ok ? 'success' : 'error'
    );
  } catch (e) {
    this.toast('Email error', (e?.body?.message || e?.message || 'Failed to resend'), 'error');
  }
};
get ob_editButtonLabel() {
  return this.ob_isEditing ? 'Save' : 'Edit';
}

// Cancel edit without saving: discard draft and rebuild from original data
ob_cancelEdit = () => {
  try {
    // rebuild the UI list from the original JSON we stored when opening the modal
    const payloadJson = JSON.stringify(this.ob_originalData || {});
    this.ob_selectedRecordFields = this.obBuildFlatPreview(payloadJson);

    // clear draft and exit edit mode
    this.ob_editDraft = {};
    this.ob_isEditing = false;
  } catch (e) {
    // even if something goes wrong, exit edit mode to avoid trapping the user
    this.ob_isEditing = false;
  }
};
// Prevent rapid double-clicks on resend
isResending = false;

ob_resendEmailFromList = async (e) => {
  if (this.isResending) return;

  const rid = e?.currentTarget?.dataset?.id;
  if (!rid) {
    this.toast?.('No record', 'Could not determine the onboarding record.', 'warning');
    return;
  }
  if (!this.signerBaseUrl) {
    this.toast?.('Missing URL', 'Signing page URL not configured.', 'error');
    return;
  }

  try {
    this.isResending = true;

    // Optional: store it if other flows rely on this var
    this.ob_selectedRecordId = rid;

    const res = await SEND_REMINDER_EMAILS({
      onboardingIds: [rid],
      baseUrl: this.signerBaseUrl
    });

    const ok = Array.isArray(res) && res.some(r => r?.success);
    this.toast?.(
      ok ? 'Reminder sent' : 'Email failed',
      ok ? 'Email sent successfully.' : (res?.[0]?.message || 'Send failed'),
      ok ? 'success' : 'error'
    );

    if (ok && typeof this.loadOnboardings === 'function') {
      await this.loadOnboardings();
    }
  } catch (err) {
    this.toast?.('Email error', (err?.body?.message || err?.message || 'Failed to resend'), 'error');
  } finally {
    this.isResending = false;
  }
};




 @track isFinalizeDisabled = true;
  selectedReviewedIds = new Set();      // track selected reviewed rows

  // Header: “select all reviewed”
  get anyReviewed() {
    return (this.onboardings || []).some(r => r.isReviewed);
  }
  get allReviewedSelected() {
    if (!this.anyReviewed) return false;
    const reviewedIds = (this.onboardings || []).filter(r => r.isReviewed).map(r => r.id);
    return reviewedIds.length > 0 && reviewedIds.every(id => this.selectedReviewedIds.has(id));
  }

  handleToggleAllReviewed = (event) => {
    const checked = event.target.checked; // <-- use target, not detail
    const next = new Set(this.selectedReviewedIds);

    this.onboardings = (this.onboardings || []).map(r => {
      if (r.isReviewed) {
        if (checked) next.add(r.id);
        else next.delete(r.id);
        return { ...r, _selectedForFinalize: checked };
      }
      return r;
    });

    this.selectedReviewedIds = next;
    console.log('[OnboardingGrid] handleToggleAllReviewed checked=', checked, ' selectedIds=', Array.from(this.selectedReviewedIds));
    this.recomputeFinalizeState();
  };

  // Row checkbox
  handleToggleRowReviewed = (event) => {
    const rowId = event.target.dataset.id;      // <-- use dataset.id
    const checked = event.target.checked;       // <-- use target.checked
    const next = new Set(this.selectedReviewedIds);

    this.onboardings = (this.onboardings || []).map(r => {
      if (String(r.id) === String(rowId)) {
        if (checked) next.add(r.id); else next.delete(r.id);
        return { ...r, _selectedForFinalize: checked };
      }
      return r;
    });

    this.selectedReviewedIds = next;
    console.log('[OnboardingGrid] handleToggleRowReviewed rowId=', rowId, ' checked=', checked, ' selectedIds=', Array.from(this.selectedReviewedIds));
    this.recomputeFinalizeState();
  };

  // Enable button if any reviewed row is selected
  recomputeFinalizeState() {
    const anySelectedReviewed = (this.onboardings || []).some(r => r.isReviewed && r._selectedForFinalize);
    this.isFinalizeDisabled = !anySelectedReviewed;
    console.log('[OnboardingGrid] recomputeFinalizeState anySelectedReviewed=', anySelectedReviewed, ' disabled=', this.isFinalizeDisabled);
  }

async handleFinalizeOnboarding() {
  console.log('[OnboardingGrid] handleFinalizeOnboarding BEGIN');
  const facilityId = this.facilityId || this.recordId; // use whichever you have on this component
  console.log('[OnboardingGrid] using FacilityId =', facilityId);

  // Build payload from reviewed + selected rows, parsing each row's JSON
  const payload = (this.onboardings || [])
    .filter(r => r.isReviewed && r._selectedForFinalize)
    .map(r => {
      const parsed = parseOnboardingJson(r.payloadJson || r.receivedData || r.Recieved_Data__c);

      // prefer explicit row fields if present; else use parsed values
      const firstName = r.firstName || parsed.firstName;
      const lastName  = r.lastName  || parsed.lastName;
      const email     = r.email     || parsed.email;

      const roleSimple = r.role || '';       // RowDTO.role (Role__c)
      const userType   = r.userType || '';

      const facilityName = r.facilityName || parsed.facilityName;

      const startDate = r.startDate || parsed.startDateDDMMYYYY;       // dd/MM/yyyy
      const dateOfBirth = r.dateOfBirth || parsed.dobDDMMYYYY;

      const phone = r.phoneNumber || parsed.phone;

      const addrStreet = r.addressStreet || parsed.address?.street || '';
      const addrCity   = r.addressCity   || parsed.address?.city   || '';
      const addrState  = r.addressState  || parsed.address?.state  || '';
      const addrPost   = r.addressPostCode || parsed.address?.postalCode || '';
      const addrCountry= r.addressCountry  || parsed.address?.country    || '';

      // IMPORTANT: UserAccountNeeded comes from your review step/checkbox on the row
      const needUser = !!r.userAccountNeeded;

      return {
        FirstName: firstName,
        LastName:  lastName,
        EmailAddress: email,

        FacilityId: facilityId,     // NOTE: Apex looks up Facility by Name. If you only have Id, resolve name on UI.
        Role: roleSimple,           // Apex maps 'Org Admin'|'Roster Admin'|'Staff' to permission labels
        UserType: userType,
        Status: 'Reviewed',         // required for Apex gate
        UserAccountNeeded: needUser ? 'true' : 'false',

        HourlyRate: String(r.hourlyRate ?? parsed.hourlyRate ?? ''),
        TaxFileNumber: r.taxFileNumber ?? parsed.taxFileNumber ?? '',
        TaxFreeThreshold: r.taxFreeThreshold ?? parsed.taxFreeThreshold ?? '',

        StartDate: startDate,       // dd/MM/yyyy
        DateofBirth: dateOfBirth,   // dd/MM/yyyy

        PhoneNumber: phone,

        AddressStreet: addrStreet,
        AddressCity:   addrCity,
        AddressState:  addrState,
        AddressPostCode: addrPost,
        AddressCountry:  addrCountry
      };
    });

  console.log('[OnboardingGrid] Finalize payload size=', payload.length, ' payload=', JSON.parse(JSON.stringify(payload)));
  if (payload.length === 0) {
    console.warn('[OnboardingGrid] No reviewed rows selected — aborting.');
    this.toast?.('Nothing selected', 'Select at least one reviewed row to finalize.', 'warning'); // <<<
    return;
  }

  this.isFinalizing = true; // <<< optional UI lock/spinner

  try {
    const result = await createAccountsContactsAndStaff({ records: payload });
    console.log('[OnboardingGrid] APEX result =', JSON.parse(JSON.stringify(result)));

    const successes = (result?.successRecords || []).length;
    const failures  = (result?.failedRecords  || []).length;
    console.log(`[OnboardingGrid] Success=${successes}, Failed=${failures}`);

    // NEW: batch summary back from Apex
    console.log('[OnboardingGrid] Users requested =', result?.userCreationRequestedCount);
    console.log('[OnboardingGrid] Batch Job Id   =', result?.userCreationBatchJobId);

    // NEW: show which rows queued user creation
    if (Array.isArray(result?.successRecords)) {
      const mini = result.successRecords.map(r => ({
        Email: r?.EmailAddress,
        UserCreation: r?.UserCreation, // 'Queued' | 'Skipped'
        FacilityId: r?.FacilityId,
        Status: r?.Status
      }));
      console.table(mini);
    }

    if (failures > 0) {
      console.warn('[OnboardingGrid] Failed records detail =', JSON.parse(JSON.stringify(result.failedRecords)));
    }

    // >>> Toasts <<< //
    if (successes > 0 && failures === 0) {
      const extra =
        (result?.userCreationRequestedCount ? ` • Users queued: ${result.userCreationRequestedCount}` : '') +
        (result?.userCreationBatchJobId ? ` • Batch: ${result.userCreationBatchJobId}` : '');
      this.toast?.('Success', `Onboarding finalized successfully. ${successes} record(s) created.`, 'success'); 
    } else if (successes > 0 && failures > 0) {
      this.toast?.(
        'Partial success',
        `Created ${successes}, failed ${failures}. See table/console for details.`,
        'warning'
      ); // <<<
    } else if (successes === 0 && failures > 0) {
      this.toast?.('No records created', 'All rows failed.', 'error'); // <<<
    }

    // >>> Refresh list after any success <<< //
    if (successes > 0 && typeof this.loadOnboardings === 'function') {
      await this.loadOnboardings(); // <<<
      // Clear selection flags so refreshed grid starts clean
      this.onboardings = (this.onboardings || []).map(r => ({ ...r, _selectedForFinalize: false })); // <<<
    }
    await this.loadPillCounts();

  } catch (e) {
    console.error('[OnboardingGrid] APEX call FAILED', e);
    this.toast?.('Finalize failed', (e && (e.body?.message || e.message)) || 'Unknown error', 'error'); // <<<
  } finally {
    this.isFinalizing = false; // <<<
    console.log('[OnboardingGrid] handleFinalizeOnboarding END');
  }
}



   @wire(getUserRole)
wiredUserRole({ data, error }) {
  if (data) this.userTypeRole = data;
  if (error) console.error(error);
}

get filteredRoleOptions() {
  if (this.userTypeRole === 'NDIS Org Admin' || this.userTypeRole === 'Facility Admin') {
    return this.roleOptions;
  }
  return this.roleOptions.filter(r =>
    r.value === 'Portal account partner Executive' ||
    r.value === 'Portal account partner User'
  );
}




  @track pillCounts = {
    sent: 0,
    received: 0,
    reviewed: 0,
    created: 0,
    totalInvites: 0,
    usersCreated: 0
  };

  _countsWire; // to refresh later


  // Call this after successful actions (send invites, finalize, etc.)
  async refreshPills() {
    if (this._countsWire) {
      try { await refreshApex(this._countsWire); } catch(e) { console.error(e); }
    }
  }



  recomputeOrgPillCounts() {
  // Only for ORG view (no facilityId driving the dedicated wire)
  // If you have a boolean like `hasFacility`, you can guard: if (this.hasFacility) return;
  const rows = this._filteredOrgOnboardings || [];

  const sent     = rows.filter(x => x.isRequestSent).length;
  const received = rows.filter(x => x.isDataReceived).length;
  const created  = rows.filter(x => x.isCreated).length;
  const reviewed = rows.filter(x => x.isReviewed).length;

  const next = {
    ...this.pillCounts,
    sent,
    received,
    created,
    reviewed,
    totalInvites: rows.length,
    // usersCreated: keep as-is unless you have a specific rule;
    // for example, if "created" implies user accounts created, use:
    // usersCreated: created
  };

  // Log for sanity
  console.log('[Onboarding] recomputeOrgPillCounts →', next);

  this.pillCounts = next;
}



handleFacilityChange = (event) => {
  console.groupCollapsed('[Onboarding] handleFacilityChange');
  try {
    const prev = this.selectedFacilityId;
    this.selectedFacilityId = event.detail?.value;
    this.pageNumber = 1;

    console.log('• Previous facility:', prev);
    console.log('• New facility    :', this.selectedFacilityId);
    console.log('• Page reset to   :', this.pageNumber);

    this.applyOrgFilterAndPaginate();
  } catch (e) {
    console.error('! handleFacilityChange error:', e);
  } finally {
    console.groupEnd();
  }
};


handlePageSizeChange = (event) => {
  this.pageSize = Number(event.detail.value);
  this.pageNumber = 1;
  this.applyOrgFilterAndPaginate();
};

// Pager actions
goFirst = () => { if (!this.disablePrev) { this.pageNumber = 1; this.applyOrgFilterAndPaginate(); } };
goPrev  = () => { if (!this.disablePrev) { this.pageNumber -= 1; this.applyOrgFilterAndPaginate(); } };
goNext  = () => { if (!this.disableNext) { this.pageNumber += 1; this.applyOrgFilterAndPaginate(); } };
goLast  = () => { if (!this.disableNext) { this.pageNumber = this.totalPages; this.applyOrgFilterAndPaginate(); } };

applyOrgFilterAndPaginate() {
  console.groupCollapsed('[Onboarding] applyOrgFilterAndPaginate');
  const t0 = performance?.now?.() ?? Date.now();
  try {
    const fidRaw = this.selectedFacilityId;
    const fid = normId(fidRaw);

    const totalBefore = this._allOrgOnboardings?.length ?? 0;
    console.log('• Selected facility (raw):', fidRaw);
    console.log('• Selected facility (norm):', fid);
    console.log('• Total (pre-filter):', totalBefore);

    // --- Diagnostics: show what facility keys exist in the first few rows ---
    const sample = (this._allOrgOnboardings || []).slice(0, 3);
    sample.forEach((r, i) => {
      const rowFid = getFacilityIdFromRow(r);
      console.log(`• Sample[${i}] Facility candidates`, {
        'Facility__c'      : r?.Facility__c,
        'facility__c'      : r?.facility__c,
        'FacilityId'       : r?.FacilityId,
        'facilityId'       : r?.facilityId,
        'Facility__r?.Id'  : r?.Facility__r?.Id,
        'facility__r?.Id'  : r?.facility__r?.Id,
        'facility?.Id'     : r?.facility?.Id,
        'Facility?.Id'     : r?.Facility?.Id,
        'chosen'           : rowFid,
        'chosen(norm15)'   : normId(rowFid),
      });
    });

    // --- Distribution by facility (to verify your “belongs to same facility” claim) ---
    const dist = {};
    (this._allOrgOnboardings || []).forEach(r => {
      const k = normId(getFacilityIdFromRow(r)) || '(none)';
      dist[k] = (dist[k] || 0) + 1;
    });
    console.log('• Facility distribution (norm15 -> count):', dist);

    // 1) Filter (compare normalized IDs)
    this._filteredOrgOnboardings = (fidRaw === 'ALL')
      ? this._allOrgOnboardings
      : (this._allOrgOnboardings || []).filter(r => normId(getFacilityIdFromRow(r)) === fid);

    const totalAfter = this._filteredOrgOnboardings?.length ?? 0;
    console.log('• Total (post-filter):', totalAfter);

    // 2) Clamp page
    const pages = this.totalPages;
    const beforeClamp = this.pageNumber;
    if (this.pageNumber > pages) this.pageNumber = pages;
    if (this.pageNumber < 1) this.pageNumber = 1;
    console.log('• Pages available    :', pages);
    console.log('• Page (before clamp):', beforeClamp, '→ (after):', this.pageNumber);

    // 3) Slice current page
    const start = (this.pageNumber - 1) * this.pageSize;
    const end   = start + this.pageSize;
    this.orgOnboardings = this._filteredOrgOnboardings.slice(start, end);

    console.log('• Page size          :', this.pageSize);
    console.log('• Slice range        :', `[${start}, ${end})`);
    console.log('• Rows on page       :', this.orgOnboardings.length);

    this.recomputeOrgPillCounts();

    // Optional status breakdown
    const counts = {
      sent     : this._filteredOrgOnboardings.filter(x => x.isRequestSent).length,
      received : this._filteredOrgOnboardings.filter(x => x.isDataReceived).length,
      created  : this._filteredOrgOnboardings.filter(x => x.isCreated).length,
      reviewed : this._filteredOrgOnboardings.filter(x => x.isReviewed).length
    };
    console.log('• Status counts      :', counts);
  } catch (e) {
    console.error('! applyOrgFilterAndPaginate error:', e);
  } finally {
    const t1 = performance?.now?.() ?? Date.now();
    console.log('• Duration (ms)      :', (t1 - t0).toFixed(1));
    console.groupEnd();
  }
}

// ===== Tabs/results =====
showResultTabs = true;           // keep tabs visible at all times
activeTab = 'success';           // 'success' | 'failed'
lastSendResults = [];            // from your send flow

// Failed list pulled on demand
dbFailedRows = [];
isLoadingFailed = false;

// Counts
get successCount() {
  // show latest send successes; fallback to current compose rows
  const sentOk = (this.lastSendResults || []).filter(r => r.success === true).length;
  return sentOk || (this.rows?.length || 0);
}
get failedCount() {
  return this.dbFailedRows?.length || 0;
}

// UI list for Failed tab
get failedRows() {
  return (this.dbFailedRows || []).map((r, idx) => ({
    key: r.Id || r.Email__c || `fail-${idx}`,
    email: r.Email__c || '',
    message: r.Last_Email_Error__c || 'Email not sent or pending'
  }));
}

// Active tab flags
get isTabSuccess() { return this.activeTab === 'success'; }
get isTabFailed()  { return this.activeTab === 'failed'; }
get tabClassSuccess() { return `SN-tab ${this.isTabSuccess ? 'is-active' : ''}`; }
get tabClassFailed()  { return `SN-tab ${this.isTabFailed  ? 'is-active' : ''}`; }

switchTab = (e) => {
  const t = e.currentTarget?.dataset?.tab;
  if (t !== 'success' && t !== 'failed') return;

  this.activeTab = t;

  // Load only when user switches to "failed"
  if (t === 'failed') {
    this.loadFailedFromServer();
  }
};

// Single place to call Apex (no wire)
loadFailedFromServer() {
  if (this.isLoadingFailed) return;
  this.isLoadingFailed = true;

  const orgId = this.orgId;                                 // use what you already have in the component
  const facilityId = this._facilityId || this.selectedFacilityId || null;

  getEmailNotSent({ orgId, facilityId, maxRows: 500 })
    .then(rows => { this.dbFailedRows = rows || []; })
    .catch(err => {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch failed email rows', err);
      this.dbFailedRows = [];
    })
    .finally(() => { this.isLoadingFailed = false; });
}


}

// Normalize an Id to 15 upper for comparison (works for 15 or 18 input)
const normId = (x) => (x ? String(x).substring(0, 15).toUpperCase() : null);

// Try all likely shapes where Facility Id might live
const getFacilityIdFromRow = (row) =>
  row?.Facility__c ??
  row?.facility__c ??
  row?.FacilityId ??
  row?.facilityId ??
  row?.Facility__r?.Id ??
  row?.facility__r?.Id ??
  row?.facility?.Id ??
  row?.Facility?.Id ??
  null;


// ===== Helpers =====
function splitEmails(text) {
  if (!text) return [];
  return text
    .split(/[\s,;]+/g)
    .map(s => s.trim())
    .filter(Boolean);
}
function isEmailValid(email) {
  const re = /^[^\s,@;]+@[^\s,@;]+\.[^\s,@;]{2,}$/i;
  return re.test(email);
}
function parseEmails(text) {
  return splitEmails(text).map(raw => {
    const email = sanitizeEmail(raw);
    return { email, error: isEmailValid(email) ? null : 'Invalid email format' };
  });
}

function reduceError(err) {
  let msg = 'Unknown error';
  if (Array.isArray(err?.body)) msg = err.body.map(e => e.message).join(', ');
  else if (typeof err?.body?.message === 'string') msg = err.body.message;
  else if (typeof err?.message === 'string') msg = err.message;
  return msg;
}
function newId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
// file -> text helper (Locker-safe)
function readFileText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error || new Error('read error'));
    r.readAsText(file);
  });
}

// --- helpers ---
const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);

function isoToDDMMYYYY(iso) {
  if (!iso) return '';
  // Accept "YYYY-MM-DD" or full ISO; split on 'T' then hyphens
  const ymd = iso.split('T')[0].split('-');
  if (ymd.length !== 3) return '';
  const [y, m, d] = ymd;
  return `${d.padStart(2,'0')}/${m.padStart(2,'0')}/${y}`;
}

// Map Experience role label -> simple Role expected by Apex
function simpleRoleFromLabel(label) {
  if (!label) return 'Staff';
  const s = label.toLowerCase();
  if (s.includes('executive')) return 'Org Admin';
  if (s.includes('manager'))   return 'Roster Admin';
  return 'Staff'; // labels with "User" → Staff
}

// Robust parse of the onboarding JSON we stored
function parseOnboardingJson(raw) {
  try {
    const j = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
    const meta = j._meta || {};
    const person = j.person || {};
    const emp = j.employment || {};
    const addr = j.address || {};

    const firstName = person.firstName || cap((meta.tokenEmail || '').split('@')[0]) || 'User';
    const lastName  = person.lastName || 'Unknown';

    // prefer explicit userType; else fall back to token
    const userType = (emp.userType && emp.userType.trim()) ? emp.userType : (meta.tokenUserType || '');

    // facility: prefer provided name; if you only have an Id, consider fetching name earlier on the UI
    const facilityName = emp.facilityIdOrName && !/^[a-zA-Z0-9]{15,18}$/.test(emp.facilityIdOrName)
      ? emp.facilityIdOrName
      : '';

    return {
      email: person.email || meta.tokenEmail || '',
      firstName,
      lastName,
      phone: person.phone || '',
      userType,
      roleSimple: simpleRoleFromLabel(emp.role),  // 'Org Admin'|'Roster Admin'|'Staff'
      hourlyRate: emp.hourlyRate || '',
      taxFileNumber: emp.taxFileNumber || '',
      taxFreeThreshold: emp.taxFreeThreshold || '',

      startDateDDMMYYYY: isoToDDMMYYYY(emp.startDate),     // server expects dd/MM/yyyy
      dobDDMMYYYY:       isoToDDMMYYYY(person.dateOfBirth),

      status: (emp.status || '').trim() || 'Active',       // you'll still send 'Reviewed' below
      facilityName,

      address: {
        street: addr.street || '',
        city: addr.city || '',
        state: addr.province || '',
        postalCode: addr.postalCode || '',
        country: addr.country || ''
      }
    };
  } catch (e) {
    console.warn('[OnboardingGrid] Failed to parse payload JSON', e);
    return {};
  }


  
}