import { LightningElement, wire,api  } from 'lwc';
import getPlans from '@salesforce/apex/TSignSubscriptionController.getPlans';
import getSubscriptionDetails from '@salesforce/apex/TSignSubscriptionController.getSubscriptionDetails';
import { CurrentPageReference } from 'lightning/navigation';
//import createUpgradeCheckout from '@salesforce/apex/TSignSubscriptionController.createUpgradeCheckout';
import getCheckoutResult from '@salesforce/apex/TSignSubscriptionController.getCheckoutResult';
import getUpgradeFormDetails from '@salesforce/apex/TSignSubscriptionController.getUpgradeFormDetails';
import cancelSubscription from '@salesforce/apex/TSignSubscriptionController.cancelSubscription';
import startPlanChange from '@salesforce/apex/TSignSubscriptionController.startPlanChange';
import completePlanChange from '@salesforce/apex/TSignSubscriptionController.completePlanChange';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const PHONE_RULES = {
    AU: { code: '61', idd: '0011', trunk: '0', length: 9, mobile: /^4/, landline: /^[2378]/, notMobile: /^1/, groups: [3, 3, 3], example: '412 345 678' },
    US: { code: '1', idd: '011', trunk: '', length: 10, mobile: /^[2-9]\d{2}[2-9]/, groups: [3, 3, 4], example: '212 555 0100' },
    CA: { code: '1', idd: '011', trunk: '', length: 10, mobile: /^[2-9]\d{2}[2-9]/, groups: [3, 3, 4], example: '416 555 0100' },
    IN: { code: '91', idd: '00', trunk: '0', length: 10, mobile: /^[6-9]/, landline: /^[1-5]/, groups: [5, 5], example: '98765 43210' },
    SG: { code: '65', idd: '000', trunk: '', length: 8, mobile: /^[89]/, landline: /^[36]/, groups: [4, 4], example: '8123 4567' }
};
// other countries' dialling codes - only to say "This is a +44 number"
const OTHER_CODES = ['1', '7', '20', '27', '30', '31', '32', '33', '34', '36', '39', '40', '41', '43', '44', '45', '46', '47', '48', '49',
    '51', '52', '53', '54', '55', '56', '57', '58', '60', '61', '62', '63', '64', '65', '66', '81', '82', '84', '86', '90', '91', '92',
    '93', '94', '95', '98', '212', '234', '254', '351', '353', '852', '880', '966', '971', '972', '973', '974'];

// Postcode rules per country (cut to 20 characters and tidied first)
const POSTCODE_RULES = {
    AU: { word: 'postcode', example: '2000', tidy: (v) => v.replace(/\s/g, ''), valid: /^\d{4}$/ },
    US: { word: 'ZIP code', example: '94105', tidy: (v) => v.replace(/\s/g, '').replace(/^(\d{5})(\d{4})$/, '$1-$2'), valid: /^\d{5}(-\d{4})?$/ },
    CA: { word: 'postal code', example: 'M5V 2T6',
        tidy: (v) => { const c = v.replace(/\s/g, '').toUpperCase(); return c.length === 6 ? c.slice(0, 3) + ' ' + c.slice(3) : c; },
        valid: /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] \d[ABCEGHJ-NPRSTV-Z]\d$/ },
    IN: { word: 'PIN code', example: '400001', tidy: (v) => v.replace(/\s/g, ''), valid: /^[1-9]\d{5}$/ },
    SG: { word: 'postal code', example: '018956', tidy: (v) => v.replace(/\s/g, ''), valid: /^\d{6}$/ }
};

// GSTIN state codes -> state codes used in the State list
const GST_STATE_CODES = {
    '01': 'JK', '02': 'HP', '03': 'PB', '04': 'CH', '05': 'UK', '06': 'HR', '07': 'DL', '08': 'RJ', '09': 'UP', '10': 'BR',
    '11': 'SK', '12': 'AR', '13': 'NL', '14': 'MN', '15': 'MZ', '16': 'TR', '17': 'ML', '18': 'AS', '19': 'WB', '20': 'JH',
    '21': 'OD', '22': 'CG', '23': 'MP', '24': 'GJ', '25': 'DH', '26': 'DH', '27': 'MH', '28': 'AP', '29': 'KA', '30': 'GA',
    '31': 'LD', '32': 'KL', '33': 'TN', '34': 'PY', '35': 'AN', '36': 'TS', '37': 'AP', '38': 'LA'
};
// US EIN prefixes the IRS has issued
const EIN_PREFIXES = /^(0[1-6]|1[0-6]|2[0-7]|3\d|4[0-8]|5\d|6[0-8]|7[1-7]|8[0-8]|9[0-58-9])/;
const UEN_FORMAT = /^(\d{8}[A-Z]|\d{9}[A-Z]|[TSR]\d{2}[A-Z]{2}\d{4}[A-Z])$/;
const GST_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// "412345678" + [3,3,3] -> "412 345 678"
function groupDigits(digits, groups) {
    const parts = [];
    let pos = 0;
    groups.forEach((size) => {
        parts.push(digits.slice(pos, pos + size));
        pos += size;
    });
    return parts.filter(Boolean).join(' ');
}

// Mobile check -> { error } or { national: '412 345 678', e164: '+61412345678' }
function checkMobile(raw, country, countryName) {
    const rule = PHONE_RULES[country];
    if (!country || !rule) {
        return { error: 'Choose your country first.' };
    }
    let text = String(raw || '').trim().replace(/^tel:/i, '').replace(/\(0\)/g, '');
    let digits = text.replace(/\D/g, '');
    if (!digits) {
        return { error: 'Enter a mobile number.' };
    }
    let international = text.startsWith('+');
    if (!international && rule.idd && digits.startsWith(rule.idd)) {
        digits = digits.slice(rule.idd.length);           // 0011 61 ... / 011 1 ... / 00 91 ...
        international = true;
    } else if (!international && digits.startsWith(rule.code) && digits.length - rule.code.length === rule.length) {
        international = true;                              // 61 412 345 678 / 1 212 555 0123 / 91 98765 43210
    }
    let national = digits;
    if (international) {
        if (!digits.startsWith(rule.code)) {
            const other = OTHER_CODES.filter((c) => digits.startsWith(c)).sort((a, b) => b.length - a.length)[0];
            return other
                ? { error: `This is a +${other} number. Enter a mobile number for ${countryName}, or change the country.` }
                : { error: `This isn't a valid mobile number for ${countryName}. Enter it like ${rule.example}.` };
        }
        national = digits.slice(rule.code.length);
    }
    if (rule.trunk && national.startsWith(rule.trunk) && national.length === rule.length + 1) {
        national = national.slice(1);                      // 0412 345 678 -> 412345678
    }
    if (national.length < 6) {
        return { error: `This number is too short. Enter it like ${rule.example}.` };
    }
    if (rule.notMobile && rule.notMobile.test(national)) {
        return { error: 'This isn\'t a mobile number. Enter a mobile number.' };
    }
    if (national.length !== rule.length) {
        return { error: `This isn't a valid mobile number for ${countryName}. Enter it like ${rule.example}.` };
    }
    if (rule.landline && rule.landline.test(national)) {
        return { error: 'This looks like a landline. Enter a mobile number.' };
    }
    if (!rule.mobile.test(national)) {
        return { error: `This isn't a valid mobile number for ${countryName}. Enter it like ${rule.example}.` };
    }
    return { national: groupDigits(national, rule.groups), e164: '+' + rule.code + national };
}

// Postcode check -> { error } or { value }
function checkPostcode(raw, country) {
    const rule = POSTCODE_RULES[country];
    const text = String(raw || '').slice(0, 20).trim();
    if (!rule) {
        return text ? { value: text.toUpperCase() } : { error: 'Enter a postal code.' };
    }
    if (!text) {
        return { error: `Enter a ${rule.word}.` };
    }
    const value = rule.tidy(text);
    return rule.valid.test(value) ? { value } : { error: `Check the ${rule.word}. It should look like ${rule.example}.` };
}

// "ABN: 51-824-753-556" -> "51824753556"
function cleanTaxValue(raw) {
    return String(raw || '').replace(/^\s*[A-Za-z/ ]{2,12}:\s*/, '').replace(/[\s.\-_/]/g, '').toUpperCase();
}

function abnValid(d) {
    const w = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    const n = d.split('').map(Number);
    n[0] -= 1;
    return n.reduce((s, x, i) => s + x * w[i], 0) % 89 === 0;
}

function acnValid(d) {
    const n = d.split('').map(Number);
    const sum = n.slice(0, 8).reduce((s, x, i) => s + x * (8 - i), 0);
    return (10 - (sum % 10)) % 10 === n[8];
}

function luhnValid(d) {
    let sum = 0;
    d.split('').reverse().forEach((ch, i) => {
        let x = Number(ch);
        if (i % 2 === 1) {
            x *= 2;
            if (x > 9) x -= 9;
        }
        sum += x;
    });
    return sum % 10 === 0;
}

function gstinCheckChar(first14) {
    let sum = 0;
    first14.split('').forEach((ch, i) => {
        const product = GST_CHARS.indexOf(ch) * (i % 2 === 0 ? 1 : 2);
        sum += Math.floor(product / 36) + (product % 36);
    });
    return GST_CHARS[(36 - (sum % 36)) % 36];
}

// which tax fields are required for the chosen business type
function taxRequired(key, businessType) {
    const type = businessType || '';
    return {
        abn: true, pan: true, acn: type === 'Company',
        ein: type !== 'Sole trader', bn: type !== 'Sole trader', uen: type !== 'Sole trader'
    }[key] || false;
}

// Registration / tax check -> { error } or { value (saved), display (shown) }
// form = the whole popup form (business type, PAN, BN, state are used for cross-checks)
function checkTax(key, raw, form) {
    const required = taxRequired(key, form.businessType);
    const names = { abn: 'ABN', acn: 'ACN', ein: 'EIN', bn: 'Business Number (BN)', gstHst: 'GST/HST number',
        uen: 'UEN', sgGst: 'GST registration number', pan: 'PAN', gstin: 'GSTIN' };
    let v = cleanTaxValue(raw);
    if (!v) {
        return required ? { error: `Enter the ${key === 'bn' ? 'Business Number' : names[key]}.` } : { value: '', display: '' };
    }
    const typo = { error: `This isn't a valid ${names[key]}. Check each digit for a typo.` };
    switch (key) {
        case 'abn':
            if (!/^\d{11}$/.test(v)) return { error: 'Check the ABN. It should look like 51 824 753 556.' };
            if (!abnValid(v)) return typo;
            return { value: v, display: groupDigits(v, [2, 3, 3, 3]) };
        case 'acn':
            if (!/^\d{9}$/.test(v)) return { error: 'Check the ACN. It should look like 004 085 616.' };
            if (!acnValid(v)) return typo;
            return { value: v, display: groupDigits(v, [3, 3, 3]) };
        case 'ein':
            if (!/^\d{9}$/.test(v)) return { error: 'Check the EIN. It should look like 12-3456789.' };
            if (!EIN_PREFIXES.test(v)) return typo;
            return { value: v.slice(0, 2) + '-' + v.slice(2), display: v.slice(0, 2) + '-' + v.slice(2) };
        case 'bn':
            if (/^\d{9}RT\d{4}$/.test(v)) v = v.slice(0, 9);   // full GST/HST pasted - keep the BN
            if (!/^\d{9}$/.test(v)) return { error: 'Check the Business Number (BN). It should look like 123 456 789.' };
            if (!luhnValid(v)) return typo;
            return { value: v, display: groupDigits(v, [3, 3, 3]) };
        case 'gstHst': {
            if (!/^\d{9}RT\d{4}$/.test(v)) return { error: 'Check the GST/HST number. It should look like 123456789 RT 0001.' };
            const bn = cleanTaxValue(form.bn).slice(0, 9);
            if (bn && v.slice(0, 9) !== bn) {
                return { error: 'This GST/HST number doesn\'t match the Business Number. It starts with the BN.' };
            }
            return { value: v, display: v.slice(0, 9) + ' RT ' + v.slice(11) };
        }
        case 'uen':
            if (!UEN_FORMAT.test(v)) return { error: 'Check the UEN. It should look like 201912345K.' };
            return { value: v, display: v };
        case 'sgGst':
            if (!/^M[A-Z0-9]{9}$/.test(v) && !UEN_FORMAT.test(v)) {
                return { error: 'Check the GST registration number. It should look like M90312345A.' };
            }
            return { value: v, display: v };
        case 'pan':
            if (!/^[A-Z]{3}[ABCFGHJLPT][A-Z]\d{4}[A-Z]$/.test(v)) return { error: 'Check the PAN. It should look like AAAPL1234C.' };
            return { value: v, display: v };
        case 'gstin': {
            if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v)) {
                return { error: 'Check the GSTIN. It should look like 22AAAAA0000A1Z5.' };
            }
            if (gstinCheckChar(v.slice(0, 14)) !== v[14]) return typo;
            const pan = cleanTaxValue(form.pan);
            if (pan && v.slice(2, 12) !== pan) {
                return { error: 'This GSTIN doesn\'t match the PAN. Characters 3 to 12 of a GSTIN are the PAN.' };
            }
            if (form.state && GST_STATE_CODES[v.slice(0, 2)] !== form.state) {
                return { error: `This GSTIN is registered in another state. Check it's the one for ${form.stateName || form.state}.` };
            }
            return { value: v, display: v };
        }
        default:
            return { value: v, display: v };
    }
}

export default class TSignSubscriptionsLwc extends LightningElement {

    @api subscriberEmail;
    @api stripeCustomerId;
    @api orgRecordId;
     @api userType; 
    plans = [];
    plansLoaded = false;
    details;
    detailsLoaded = false;
    errorMessage;
    statusMessage;
    billingInterval = 'month'; 
    isRedirecting = false;
    checkoutResultLoaded = false;
    checkoutResult;
    showBusinessForm = false;
    bizLoading = false;
    pendingPriceId = '';
    bizForm = {};
    bizError = '';
    showCancelConfirm = false;
    cancelAction = '';
    cancelBusy = false;
    cancelError = '';
    // Business popup - address labels, states (same codes as tSignAddressSelector) and registration / tax fields per country
    countries = {
        AU: {
            label: 'Australia', cityLabel: 'Suburb', cityPlaceholder: 'Suburb...',
            stateLabel: 'State or territory', postcodeLabel: 'Postcode', postcodePlaceholder: '2000',
            states: [['ACT', 'Australian Capital Territory'], ['NSW', 'New South Wales'], ['NT', 'Northern Territory'],
                ['QLD', 'Queensland'], ['SA', 'South Australia'], ['TAS', 'Tasmania'], ['VIC', 'Victoria'], ['WA', 'Western Australia']],
            tax: [
                { key: 'abn', label: 'ABN', placeholder: '51 824 753 556', required: true, pattern: /^\d{11}$/, message: 'ABN must be 11 digits.' },
                { key: 'acn', label: 'ACN', placeholder: '004 085 616', required: false, pattern: /^\d{9}$/, message: 'ACN must be 9 digits.' }
            ]
        },
        CA: {
            label: 'Canada', cityLabel: 'City', cityPlaceholder: 'City...',
            stateLabel: 'Province or territory', postcodeLabel: 'Postal code', postcodePlaceholder: 'M5V 2T6',
            states: [['AB', 'Alberta'], ['BC', 'British Columbia'], ['MB', 'Manitoba'], ['NB', 'New Brunswick'],
                ['NL', 'Newfoundland and Labrador'], ['NT', 'Northwest Territories'], ['NS', 'Nova Scotia'], ['NU', 'Nunavut'],
                ['ON', 'Ontario'], ['PE', 'Prince Edward Island'], ['QC', 'Quebec'], ['SK', 'Saskatchewan'], ['YT', 'Yukon']],
            tax: [
                { key: 'bn', label: 'Business Number (BN)', placeholder: '123 456 789', required: true, pattern: /^\d{9}$/, message: 'Business Number must be 9 digits.' },
                { key: 'gstHst', label: 'GST/HST number', placeholder: '123456789 RT 0001', required: false, pattern: /^\d{9}RT\d{4}$/i, message: 'GST/HST number must look like 123456789 RT 0001.' }
            ]
        },
        IN: {
            label: 'India', cityLabel: 'City', cityPlaceholder: 'City...',
            stateLabel: 'State or union territory', postcodeLabel: 'PIN code', postcodePlaceholder: '400001',
            states: [['AN', 'Andaman and Nicobar Islands'], ['AP', 'Andhra Pradesh'], ['AR', 'Arunachal Pradesh'], ['AS', 'Assam'],
                ['BR', 'Bihar'], ['CH', 'Chandigarh'], ['CG', 'Chhattisgarh'], ['DH', 'Dadra and Nagar Haveli and Daman and Diu'],
                ['DL', 'Delhi'], ['GA', 'Goa'], ['GJ', 'Gujarat'], ['HR', 'Haryana'], ['HP', 'Himachal Pradesh'],
                ['JK', 'Jammu and Kashmir'], ['JH', 'Jharkhand'], ['KA', 'Karnataka'], ['KL', 'Kerala'], ['LA', 'Ladakh'],
                ['LD', 'Lakshadweep'], ['MP', 'Madhya Pradesh'], ['MH', 'Maharashtra'], ['MN', 'Manipur'], ['ML', 'Meghalaya'],
                ['MZ', 'Mizoram'], ['NL', 'Nagaland'], ['OD', 'Odisha'], ['PY', 'Puducherry'], ['PB', 'Punjab'],
                ['RJ', 'Rajasthan'], ['SK', 'Sikkim'], ['TN', 'Tamil Nadu'], ['TS', 'Telangana'], ['TR', 'Tripura'],
                ['UP', 'Uttar Pradesh'], ['UK', 'Uttarakhand'], ['WB', 'West Bengal']],
            tax: [
                { key: 'pan', label: 'PAN', placeholder: 'AAAPL1234C', required: true, pattern: /^[A-Z]{5}\d{4}[A-Z]$/i, message: 'PAN must look like AAAPL1234C.' },
                { key: 'gstin', label: 'GSTIN', placeholder: '36AAAPL1234C1ZF', required: false, pattern: /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/i, message: 'GSTIN must be 15 characters, e.g. 36AAAPL1234C1ZF.' }
            ]
        },
        SG: {
            label: 'Singapore', postcodeLabel: 'Postal code', postcodePlaceholder: '018956',
            states: [],
            tax: [
                { key: 'uen', label: 'UEN', placeholder: '201912345K', required: true, pattern: /^[A-Z0-9]{9,10}$/i, message: 'UEN must be 9 or 10 letters / digits.' },
                { key: 'sgGst', label: 'GST registration number', placeholder: 'M2-1234567-8', required: false }
            ]
        },
        US: {
            label: 'United States', cityLabel: 'City', cityPlaceholder: 'City...',
            stateLabel: 'State', postcodeLabel: 'ZIP code', postcodePlaceholder: '94105',
            states: [['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'],
                ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'], ['FL', 'Florida'],
                ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
                ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'],
                ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'], ['MO', 'Missouri'],
                ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'],
                ['NM', 'New Mexico'], ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'],
                ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'],
                ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'],
                ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming']],
            tax: [
                { key: 'ein', label: 'EIN', placeholder: '12-3456789', required: true, pattern: /^\d{2}-?\d{7}$/, message: 'EIN must look like 12-3456789.' }
            ]
        }
    };

    connectedCallback() {
        this.loadDetails();
    }
    get isCancelAllowed() {
        return !this.isBusinessPlan || this.userType === 'T Sign Org Admin';
    }

    async loadDetails() {
        try {
            //const result = await getSubscriptionDetails();
            console.log('TSign from parent - email: ' + this.subscriberEmail + ' | customer: ' + this.stripeCustomerId + ' | org: ' + this.orgRecordId);
            const result = await getSubscriptionDetails({ subscriberEmail: this.subscriberEmail, stripeCustomerId: this.stripeCustomerId});
            this.details = { ...result };
            console.log('TSign lookup - subscriber email: ' + result.subscriberEmail
                + ' | user: ' + result.userName
                + ' | TSign Org Id: ' + result.orgId
                + ' | TSign Organisation: ' + result.orgName
                + ' | subscription id in record: ' + result.subscriptionId
                + ' | Stripe lookup email: ' + result.lookupEmail
                + ' | current plan found by: ' + result.foundBy);
            console.log('TSign current plan', JSON.stringify(result.currentPlan));
            if (result.currentPlan && result.currentPlan.interval) {
                this.billingInterval = result.currentPlan.interval; // toggle follows the current plan
            } else if (result.lastPlan && result.lastPlan.interval) {
                this.billingInterval = result.lastPlan.interval;   // no current plan - toggle follows the last cancelled plan
            }
            console.log('TSign last cancelled plan', JSON.stringify(result.lastPlan));
          
        } catch (error) {
            //this.errorMessage = this.readError(error, 'Could not load the subscription.');
             this.showErrorToast(this.readError(error, 'Could not load the subscription.'));
            console.error('TSign getSubscriptionDetails failed', this.errorMessage);
        }
        this.detailsLoaded = true;
    }

    @wire(getPlans)
    wiredPlans({ data, error }) {
        if (data) {
            //this.plans = [...data];
            const rank = (plan) => {
                const name = String(plan.productName || '').toLowerCase();
                return name.includes('individual') ? 0 : name.includes('business') ? 1 : 2;
            };
            this.plans = [...data].sort((a, b) => rank(a) - rank(b));
            this.plansLoaded = true;
            console.log('TSign plans', JSON.stringify(data));
        } else if (error) {
            this.plans = [];
            this.plansLoaded = true;
            //this.errorMessage = this.readError(error, 'Could not load plans from Stripe.');
             this.showErrorToast(this.readError(error, 'Could not load plans from Stripe.'));
            console.error('TSign getPlans failed', this.errorMessage);
        }
    }
    //  @wire(CurrentPageReference)
    // wiredPageRef(pageRef) {
    //     const state = pageRef?.state ? { ...pageRef.state } : {};
    //     console.log('TSign page state', JSON.stringify(state));
    //     if (state.stripe === 'success') {
    //          console.log('TSign returned from Stripe: SUCCESS | statusMessage : ' + this.statusMessage);
    //         this.statusMessage = 'Payment details saved and your new plan has started.';
    //         // console.log('TSign returned from Stripe: SUCCESS | session_id: ' + state.session_id);
    //         console.log('TSign returned from Stripe: SUCCESS | session_id: ' + state.session_id);
    //         if (state.session_id && !this.checkoutResultLoaded) {
    //             this.checkoutResultLoaded = true;
    //             this.loadCheckoutResult(state.session_id);
    //         }
    //     } else if (state.stripe === 'cancel') {
    //         this.statusMessage = 'Checkout was cancelled. No charge was made.';
    //          this.clearStripeParams();
    //         console.log('TSign returned from Stripe: CANCELLED | statusMessage : ' + this.statusMessage);
    //         //console.log('TSign returned from Stripe: CANCELLED');
    //     }
    // }
         @wire(CurrentPageReference)
    wiredPageRef() {
        // real URL - CurrentPageReference keeps the old ?stripe= state even after it was cleared
        const params = new URLSearchParams(window.location.search);
        const stripeStatus = params.get('stripe');
        const sessionId = params.get('session_id');
        const changeToken = params.get('change'); 
        if (!stripeStatus) {
            return;
        }
        console.log('TSign page state - stripe: ' + stripeStatus + ' | session: ' + sessionId);

        // remove ?stripe= at once, so no other component (dashboard, profile, org) reacts to it again
        this.clearStripeParams();

        if (stripeStatus === 'success' && sessionId) {
            // the same payment is handled only once, even if this component is created again
            if (this.checkoutResultLoaded || sessionStorage.getItem('tsignHandledSession') === sessionId) {
                console.log('TSign checkout ' + sessionId + ' already handled - skipped');
                return;
            }
            this.checkoutResultLoaded = true;
            sessionStorage.setItem('tsignHandledSession', sessionId);
            this.statusMessage = 'Payment details saved and your new plan has started.';
            console.log('TSign returned from Stripe: SUCCESS | session_id: ' + sessionId);
            this.loadCheckoutResult(sessionId);
        } else if (stripeStatus === 'updated' && changeToken) {
            // the same plan change is handled only once
            if (sessionStorage.getItem('tsignHandledChange') === changeToken) {
                console.log('TSign plan change ' + changeToken + ' already handled - skipped');
                return;
            }
            sessionStorage.setItem('tsignHandledChange', changeToken);
            console.log('TSign returned from Stripe: PLAN CHANGE CONFIRMED | change: ' + changeToken);
            this.loadPlanChangeResult(changeToken);
        } else if (stripeStatus === 'cancel') {
            this.statusMessage = 'No change was made to your plan.';
            console.log('TSign returned from Stripe: CANCELLED');
        }
    }
    async loadCheckoutResult(sessionId) {
        try {
            const result = await getCheckoutResult({ sessionId, orgRecordId: this.orgRecordId});
            this.checkoutResult = result;
            console.log('TSign ALL METADATA', JSON.stringify(result.allMetadata));
            console.log('TSign FULL session', JSON.stringify(result.session));
            console.log('TSign FULL subscription', JSON.stringify(result.subscription));
            console.log('TSign FULL customer', JSON.stringify(result.customer));
            console.log('TSign FULL invoice', JSON.stringify(result.invoice));
            console.log('TSign FULL price', JSON.stringify(result.price));
            console.log('TSign FULL product', JSON.stringify(result.product));
            // if (result.savedOrgId) {
            //     await this.loadDetails();                                   // show the new plan
            //     this.dispatchEvent(new CustomEvent('subscriptionupdated')); // parent reloads the record
            // }
            if (result.savedOrgId) {
                await this.loadDetails();                                   // show the new plan
                this.dispatchEvent(new CustomEvent('subscriptionupdated')); // parent reloads the record
                // dashboard: Individual -> Organisation (or back) switches My Profile / My Organisation
                console.log('TSign account type after upgrade: ' + result.accountType);
                this.dispatchEvent(new CustomEvent('tsignaccounttypechange', {
                    detail: { accountType: result.accountType },
                    bubbles: true,
                    composed: true
                }));
            }
        } catch (error) {
            console.error('TSign getCheckoutResult failed', this.readError(error, 'Could not read the Stripe result.'));
        }
        //this.clearStripeParams();
    }
        // back from the Stripe "confirm plan change" page - check in Apex that Stripe changed the plan, then save
    async loadPlanChangeResult(changeToken) {
        this.isRedirecting = true;
        try {
            const result = await completePlanChange({ orgRecordId: this.orgRecordId, token: changeToken });
            console.log('TSign plan change result', JSON.stringify(result));
            this.isRedirecting = false;
            if (!result.changed) {
                //this.errorMessage = 'Your plan was not changed. If you confirmed on Stripe, please refresh this page in a minute.';
                 this.showErrorToast('Your plan was not changed. If you confirmed on Stripe, please refresh this page in a minute.');
                return;
            }
            this.statusMessage = this.planChangeMessage(result);
            await this.loadDetails();                                   // show the new plan + credit
            this.dispatchEvent(new CustomEvent('subscriptionupdated')); // dashboard header / org reload
            console.log('TSign account type after plan change: ' + result.accountType);
            this.dispatchEvent(new CustomEvent('tsignaccounttypechange', {
                detail: { accountType: result.accountType },
                bubbles: true,
                composed: true
            }));
        } catch (error) {
            this.isRedirecting = false;
            //this.errorMessage = this.readError(error, 'Could not read the plan change from Stripe.');
            this.showErrorToast(this.readError(error, 'Could not read the plan change from Stripe.'));
            console.error('TSign completePlanChange failed', this.errorMessage);
        }
    }

    // "Your plan has been changed. ₹1,956.00 was charged ... You have ₹500.00 credit ..."
    planChangeMessage(result) {
        const currency = result.currencyCode;
        let message = 'Your plan has been changed.';
        if (result.amountPaid > 0) {
            message += ` ${this.formatPrice(result.amountPaid, currency)} was charged for the difference.`;
        } else {
            message += ' Nothing was charged today.';
        }
        if (result.creditBalance > 0) {
            message += ` You have ${this.formatPrice(result.creditBalance, currency)} credit, used automatically on your next invoices.`;
        }
        return message;
    }

    // credit Stripe holds for this customer (e.g. after moving to a cheaper plan)
    get creditText() {
        const credit = Number(this.details?.creditBalance || 0);
        if (credit <= 0) {
            return '';
        }
        return `Credit available: ${this.formatPrice(credit, this.details.customerCurrency)} - used automatically on your next invoices.`;
    }
    clearStripeParams() {
        try {
            //window.history.replaceState(window.history.state, '', window.location.pathname);
            window.history.replaceState(window.history.state, '', window.location.pathname + window.location.hash);
            console.log('TSign stripe params removed from URL');
        } catch (e) {
            console.error('TSign could not clean URL', e);
        }
    }

    readError(error, fallback) {
        if (error?.body?.message) {
            return error.body.message;
        }
        if (Array.isArray(error?.body) && error.body[0]?.message) {
            return error.body[0].message;
        }
        return error?.message || fallback;
    }
     showErrorToast(message) {
        this.errorMessage = message;
        console.error('TSign subscription error: ' + message);
        this.dispatchEvent(new ShowToastEvent({ title: 'Error', message, variant: 'error' }));
    }
    showBizErrorToast(message) {
        console.error('TSign business popup error: ' + message);
        this.dispatchEvent(new ShowToastEvent({ title: 'Error', message, variant: 'error' }));
    }

    // get isLoading() {
    //     return !this.plansLoaded || !this.detailsLoaded;
    // }
     get isLoading() {
        return !this.plansLoaded || !this.detailsLoaded || this.isRedirecting;
    }

    get isReady() {
        return this.plansLoaded && this.detailsLoaded;
    }

    get currentPlan() {
        return this.details?.currentPlan;
    }

    // OLD currentPlanInfo (before redesign 3 Nov 2026) - kept for reference
    // get currentPlanInfo() {
    //     const sub = this.currentPlan;
    //     if (!sub) {
    //         return undefined;
    //     }
    //     const plan = this.plans.find((p) => String(p.productId) === String(sub.productId));
    //     const qty = Number(sub.quantity || 1);
    //    // let statusLine = sub.status;
    //     const statusLabels = {
    //         trialing: 'Trial', active: 'Active', past_due: 'Payment overdue', unpaid: 'Unpaid',
    //         incomplete: 'Payment pending', incomplete_expired: 'Expired', canceled: 'Cancelled', paused: 'Paused'
    //     };
    //     let statusLine = statusLabels[sub.status] || sub.status;
    //
    //     if (qty > 1) {
    //         statusLine += ` · ${qty} users`;
    //     }
    //     if (sub.amount != null) {
    //         statusLine += ` · ${this.formatPrice(Number(sub.amount) * qty, sub.currencyCode)} / ${sub.interval}`;
    //     }
    //     let dateLine;
    //     if (sub.cancelAtPeriodEnd) {
    //         dateLine = `Cancels on ${this.formatDate(sub.currentPeriodEnd)}`;
    //     } else if (sub.status === 'trialing' && sub.trialEnd) {
    //         dateLine = `Trial ends ${this.formatDate(sub.trialEnd)}`;
    //     } else if (sub.currentPeriodEnd) {
    //         dateLine = `Renews on ${this.formatDate(sub.currentPeriodEnd)}`;
    //     }
    //     return { name: plan ? plan.productName : sub.priceId, statusLine, dateLine };
    // }
    // NEW (redesign): name, status pill, price, Billing | Users | date row, cancel note
    get currentPlanInfo() {
        const sub = this.currentPlan;
        if (!sub) {
            return undefined;
        }
        const plan = this.plans.find((p) => String(p.productId) === String(sub.productId));
        const qty = Number(sub.quantity || 1);
        const isTrial = sub.status === 'trialing';
        const statusLabels = {
            trialing: 'Trial', active: 'Active', past_due: 'Payment overdue', unpaid: 'Unpaid',
            incomplete: 'Payment pending', incomplete_expired: 'Expired', canceled: 'Cancelled', paused: 'Paused'
        };
        // pill colour per status
        const statusTones = {
            trialing: 'info', active: 'success', past_due: 'error', unpaid: 'error',
            incomplete: 'warning', incomplete_expired: 'neutral', canceled: 'neutral', paused: 'neutral'
        };

        // old one-line texts - still returned, nothing else changes
        let statusLine = statusLabels[sub.status] || sub.status;
        if (qty > 1) {
            statusLine += ` · ${qty} users`;
        }
        if (sub.amount != null) {
            statusLine += ` · ${this.formatPrice(Number(sub.amount) * qty, sub.currencyCode)} / ${sub.interval}`;
        }
        let dateLine;
        if (sub.cancelAtPeriodEnd) {
            dateLine = `Cancels on ${this.formatDate(sub.currentPeriodEnd)}`;
        } else if (isTrial && sub.trialEnd) {
            dateLine = `Trial ends ${this.formatDate(sub.trialEnd)}`;
        } else if (sub.currentPeriodEnd) {
            dateLine = `Renews on ${this.formatDate(sub.currentPeriodEnd)}`;
        }

        // status pill
        let statusLabel = statusLabels[sub.status] || sub.status;
        let tone = statusTones[sub.status] || 'neutral';
        if (sub.cancelAtPeriodEnd) {
            statusLabel = `Cancels on ${this.formatDate(sub.currentPeriodEnd)}`;
            tone = 'warning';
        }

        // Billing | Users | date row
        const meta = [
            { key: 'billing', label: 'Billing', value: this.intervalName(sub.interval) },
            { key: 'users', label: 'Users', value: String(qty) }
        ];
        if (sub.cancelAtPeriodEnd && sub.currentPeriodEnd) {
            meta.push({ key: 'date', label: 'Access until', value: this.formatDate(sub.currentPeriodEnd) });
        } else if (isTrial && sub.trialEnd) {
            meta.push({ key: 'date', label: 'Trial ends', value: this.formatDate(sub.trialEnd) });
        } else if (sub.currentPeriodEnd) {
            meta.push({ key: 'date', label: 'Renews on', value: this.formatDate(sub.currentPeriodEnd) });
        }

        const hasPrice = sub.amount != null;
        return {
            name: plan ? plan.productName : sub.priceId,
            statusLine,
            dateLine,
            statusLabel,
            statusClass: `sub-pill sub-pill_${tone}`,
            priceAmount: hasPrice ? this.formatPrice(Number(sub.amount) * qty, sub.currencyCode) : '',
            pricePer: hasPrice ? `/ ${sub.interval}${isTrial ? ' after trial' : ''}` : '',
            meta,
            note: sub.cancelAtPeriodEnd
                ? `Your plan stops on ${this.formatDate(sub.currentPeriodEnd)}. No further payments will be taken.`
                : ''
        };
    }

    // 'year' -> 'Yearly', 'month' -> 'Monthly'
    intervalName(interval) {
        if (interval === 'year') {
            return 'Yearly';
        }
        if (interval === 'month') {
            return 'Monthly';
        }
        return interval || '';
    }

    // close (x) on the blue info banner
    handleDismissStatus() {
        this.statusMessage = undefined;
    }

    get introText() {
       // return this.currentPlan ? 'Upgrade or change your plan.' : 'No current plan. Available plans:';
        if (this.currentPlan) {
            return 'Upgrade or change your plan.';
        }
        return this.lastPlan ? 'Renew your last plan or choose another one:' : 'No current plan. Available plans:';
    }

    handleIntervalChange(event) {
        const interval = event.currentTarget.dataset.interval;
        if (interval && interval !== this.billingInterval) {
            this.billingInterval = interval; // cards re-render with this interval's prices
            console.log('TSign billing interval', this.billingInterval);
        }
    }

    get isMonthly() {
        return this.billingInterval === 'month';
    }

    get isYearly() {
        return this.billingInterval === 'year';
    }

    get monthlyClass() {
        return this.isMonthly ? 'interval-option is-active' : 'interval-option';
    }

    get yearlyClass() {
        return this.isYearly ? 'interval-option is-active' : 'interval-option';
    }

    // >>> NEW: "Save X%" on Yearly, worked out from the Stripe prices (yearly vs 12 x monthly)
    get yearlySavingLabel() {
        let best = 0;
        this.plans.forEach((plan) => {
            const monthly = (plan.prices || []).find((p) => p.interval === 'month');
            const yearly = (plan.prices || []).find((p) => p.interval === 'year');
            if (monthly && yearly && Number(monthly.amount) > 0) {
                const saving = Math.round((1 - Number(yearly.amount) / (Number(monthly.amount) * 12)) * 100);
                if (saving > best) {
                    best = saving;
                }
            }
        });
        return best > 0 ? `Save ${best}%` : '';
    }
    get isBusinessPlan() {
        const sub = this.currentPlan;
        if (!sub) {
            return false;
        }
        const product = this.plans.find((p) => String(p.productId) === String(sub.productId));
        return !!product && String(product.productName || '').toLowerCase().includes('business');
    }

    // One card per product; shows that product's price for the selected interval
    // get planCards() {
    //     if (!this.isReady) {
    //         return [];
    //     }
    //     const sub = this.currentPlan;
    //     return this.plans.map((plan) => {
    //         const price = (plan.prices || []).find((p) => p.interval === this.billingInterval);
    //         //const isCurrent = !!sub && !!price && String(price.priceId) === String(sub.priceId);
    //                     // current = same price, or same product + same interval (price may have been recreated / archived in Stripe)
    //         const isCurrent = !!sub && !!price && (
    //             String(price.priceId) === String(sub.priceId)
    //             || (String(plan.productId) === String(sub.productId) && price.interval === sub.interval)
    //         );
    //         return {
    //             productId: plan.productId,
    //             productName: plan.productName,
    //             description: plan.description,
    //             priceId: price ? price.priceId : null,
    //             isCurrent,
    //             // priceLabel: price && price.amount != null
    //             //     ? `${this.formatPrice(price.amount, price.currencyCode)} / ${price.interval}`
    //             //     : `No ${this.isYearly ? 'yearly' : 'monthly'} price`,
    //             priceLabel: this.priceLabelFor(price),
    //             // showUpgrade: !!sub && !isCurrent && !!price,
    //             // upgradeDisabled: this.isRedirecting,
    //             showUpgrade: !isCurrent && !!price,          // also shown with no plan (cancelled) - to subscribe again
    //             upgradeDisabled: this.isRedirecting,
    //             buttonLabel: sub ? 'Upgrade' : 'Subscribe',
    //             //boxClass: isCurrent ? 'slds-box slds-theme_shade' : 'slds-box'
    //              boxClass: isCurrent ? 'slds-box slds-theme_shade plan-card' : 'slds-box plan-card'
                
    //         };
    //     });
    // }
        // Business plan: one card per Business price (Monthly, then Yearly)
    // otherwise: one card per product, with the price of the selected interval
    // OLD planCards (before redesign 3 Nov 2026) - kept for reference
    // get planCards() {
    //     if (!this.isReady) {
    //         return [];
    //     }
    //     const sub = this.currentPlan;
    //     const businessOnly = this.isBusinessPlan;
    //     const pairs = [];
    //     if (businessOnly) {
    //         this.plans
    //             .filter((plan) => String(plan.productName || '').toLowerCase().includes('business'))
    //             .forEach((plan) => {
    //                 (plan.prices || [])
    //                     .filter((price) => price.interval === 'month' || price.interval === 'year')
    //                     .sort((a, b) => (a.interval === 'month' ? -1 : 1) - (b.interval === 'month' ? -1 : 1))
    //                     .forEach((price) => pairs.push({ plan, price }));
    //             });
    //     } else {
    //         this.plans.forEach((plan) => {
    //             pairs.push({ plan, price: (plan.prices || []).find((p) => p.interval === this.billingInterval) });
    //         });
    //     }
    //     return pairs.map(({ plan, price }) => {
    //         // current = same price, or same product + same interval (price may have been recreated / archived in Stripe)
    //         const isCurrent = !!sub && !!price && (
    //             String(price.priceId) === String(sub.priceId)
    //             || (String(plan.productId) === String(sub.productId) && price.interval === sub.interval)
    //         );
    //         return {
    //             cardKey: plan.productId + '-' + (price ? price.priceId : 'none'),
    //             productId: plan.productId,
    //             productName: businessOnly && price
    //                 ? `${plan.productName} - ${price.interval === 'year' ? 'Yearly' : 'Monthly'}`
    //                 : plan.productName,
    //             description: plan.description,
    //             priceId: price ? price.priceId : null,
    //             isCurrent,
    //             priceLabel: this.priceLabelFor(price),
    //             showUpgrade: !isCurrent && !!price,          // also shown with no plan (cancelled) - to subscribe again
    //             upgradeDisabled: this.isRedirecting,
    //             buttonLabel: sub ? 'Upgrade' : 'Subscribe',
    //             boxClass: isCurrent ? 'slds-box slds-theme_shade plan-card' : 'slds-box plan-card'
    //         };
    //     });
    // }
    // NEW (redesign): same cards as before + priceAmount / pricePer / cardClass for the new layout
    // Business plan: one card per Business price (Monthly, then Yearly)
    // otherwise: one card per product, with the price of the selected interval
    get planCards() {
        if (!this.isReady) {
            return [];
        }
        const sub = this.currentPlan;
        const businessOnly = this.isBusinessPlan;
        const pairs = [];
        if (businessOnly) {
            this.plans
                .filter((plan) => String(plan.productName || '').toLowerCase().includes('business'))
                .forEach((plan) => {
                    (plan.prices || [])
                        .filter((price) => price.interval === 'month' || price.interval === 'year')
                        .sort((a, b) => (a.interval === 'month' ? -1 : 1) - (b.interval === 'month' ? -1 : 1))
                        .forEach((price) => pairs.push({ plan, price }));
                });
        } else {
            this.plans.forEach((plan) => {
                pairs.push({ plan, price: (plan.prices || []).find((p) => p.interval === this.billingInterval) });
            });
        }
        return pairs.map(({ plan, price }) => {
            // current = same price, or same product + same interval (price may have been recreated / archived in Stripe)
            const isCurrent = !!sub && !!price && (
                String(price.priceId) === String(sub.priceId)
                || (String(plan.productId) === String(sub.productId) && price.interval === sub.interval)
            );
            const isBusiness = String(plan.productName || '').toLowerCase().includes('business');
            return {
                cardKey: plan.productId + '-' + (price ? price.priceId : 'none'),
                productId: plan.productId,
                productName: businessOnly && price
                    ? `${plan.productName} - ${price.interval === 'year' ? 'Yearly' : 'Monthly'}`
                    : plan.productName,
                description: plan.description,
                priceId: price ? price.priceId : null,
                isCurrent,
                priceLabel: this.priceLabelFor(price),
                priceAmount: this.priceAmountFor(price),
                pricePer: price ? `${isBusiness ? '/ user ' : ''}/ ${price.interval}` : '',
                showUpgrade: !isCurrent && !!price,          // also shown with no plan (cancelled) - to subscribe again
                upgradeDisabled: this.isRedirecting,
                buttonLabel: sub ? 'Switch plan' : 'Subscribe',
                boxClass: isCurrent ? 'slds-box slds-theme_shade plan-card' : 'slds-box plan-card',
                cardClass: isCurrent ? 'plan-card plan-card_current' : 'plan-card'
            };
        });
    }
    get noPlans() {
        return this.plansLoaded && this.plans.length === 0 && !this.errorMessage;
    }

    //  async handleUpgrade(event) {
    //     const priceId = event.currentTarget.dataset.price;
    //     console.log('TSign upgrade clicked - priceId: ' + priceId);
    //     this.errorMessage = undefined;
    //     this.statusMessage = undefined;
    //     this.isRedirecting = true;
    //     try {
    //         const returnUrl = window.location.origin + window.location.pathname;
    //         console.log('TSign calling createUpgradeCheckout - priceId: ' + priceId + ' | returnUrl: ' + returnUrl);

    //         const checkoutUrl = await createUpgradeCheckout({ priceId, returnUrl,subscriberEmail: this.subscriberEmail,stripeCustomerId: this.stripeCustomerId,orgRecordId: this.orgRecordId });
    //         console.log('TSign checkout URL received: ' + checkoutUrl);

    //         if (!checkoutUrl) {
    //             throw new Error('Stripe did not return a checkout URL.');
    //         }
    //         window.location.assign(checkoutUrl);
    //     } catch (error) {
    //         this.errorMessage = this.readError(error, 'Could not start checkout.');
    //         this.isRedirecting = false;
    //         console.error('TSign createUpgradeCheckout failed', this.errorMessage);
    //     }
    // }
        // Upgrade clicked - Business plan opens the details popup first, other plans go straight to Stripe
    // handleUpgrade(event) {
    //     const priceId = event.currentTarget.dataset.price;
    //     const productName = event.currentTarget.dataset.product || '';
    //     console.log('TSign upgrade clicked - priceId: ' + priceId + ' | product: ' + productName);
    //     if (productName.toLowerCase().includes('business')) {
    //         this.openBusinessForm(priceId);
    //     } 
    //     // else {
    //     //     this.startCheckout(priceId, null);
    //     // }
    // }
     handleUpgrade(event) {
        const priceId = event.currentTarget.dataset.price;
        const productName = event.currentTarget.dataset.product || '';

        //const currentProduct = this.plans.find((p) => String(p.productId) === String(this.currentPlan?.productId));
        // no current plan (cancelled) - compare with the last plan, so a Business customer coming back gets no popup again
        const compareProductId = this.currentPlan?.productId || this.lastPlan?.productId;
        const currentProduct = this.plans.find((p) => String(p.productId) === String(compareProductId));
        const currentProductName = currentProduct ? currentProduct.productName : '';
        const isToBusiness = productName.toLowerCase().includes('business');
        const isFromBusiness = currentProductName.toLowerCase().includes('business');

        console.log('TSign upgrade clicked - priceId: ' + priceId + ' | from: ' + currentProductName + ' | to: ' + productName);
        if (isToBusiness && !isFromBusiness) {
            this.openBusinessForm(priceId);   // Individual -> Business: business details needed first
        } 
        else {
            this.startCheckout(priceId, null);   // same plan type (e.g. Monthly -> Yearly) - no popup
        }
    }

    // Create the Stripe Checkout in Apex, then redirect to it
    // async startCheckout(priceId, businessDetails) {
    //     this.errorMessage = undefined;
    //     this.statusMessage = undefined;
    //     this.isRedirecting = true;
    //     try {
    //         const returnUrl = window.location.origin + window.location.pathname;
    //         console.log('TSign calling createUpgradeCheckout - priceId: ' + priceId + ' | returnUrl: ' + returnUrl
    //             + ' | business: ' + JSON.stringify(businessDetails));
    //         const checkoutUrl = await createUpgradeCheckout({ priceId, returnUrl, subscriberEmail: this.subscriberEmail,
    //             stripeCustomerId: this.stripeCustomerId, orgRecordId: this.orgRecordId,
    //             businessDetails: businessDetails ? JSON.stringify(businessDetails) : '' });
    //         console.log('TSign checkout URL received: ' + checkoutUrl);

    //         if (!checkoutUrl) {
    //             throw new Error('Stripe did not return a checkout URL.');
    //         }
    //         window.location.assign(checkoutUrl);
    //     } catch (error) {
    //         this.errorMessage = this.readError(error, 'Could not start checkout.');
    //         this.isRedirecting = false;
    //         console.error('TSign createUpgradeCheckout failed', this.errorMessage);
    //     }
    // }
    
    //  current subscription    -> the SAME subscription is updated (difference charged now, no Stripe page)
    //  no current subscription -> new subscription through Stripe Checkout (old cancelled one stays cancelled)
    async startCheckout(priceId, businessDetails) {
        this.errorMessage = undefined;
        this.statusMessage = undefined;
        this.isRedirecting = true;
        try {
            const returnUrl = window.location.origin + window.location.pathname;
            console.log('TSign calling startPlanChange - priceId: ' + priceId + ' | current subscription: '
                + (this.currentPlan ? this.currentPlan.subscriptionId : 'none')
                + ' | business: ' + JSON.stringify(businessDetails));
            const result = await startPlanChange({ priceId, returnUrl, subscriberEmail: this.subscriberEmail,
                stripeCustomerId: this.stripeCustomerId, orgRecordId: this.orgRecordId,
                businessDetails: businessDetails ? JSON.stringify(businessDetails) : '' });
            console.log('TSign plan change result', JSON.stringify(result));

            if (result.mode === 'checkout') {
                // new subscription, or a card has to be saved first - Stripe page
                if (!result.url) {
                    throw new Error('Stripe did not return a checkout URL.');
                }
                window.location.assign(result.url);
                return;
            }

            // current subscription updated in place - already saved in Salesforce
            this.isRedirecting = false;
            await this.loadDetails();                                   // show the new plan
            this.dispatchEvent(new CustomEvent('subscriptionupdated')); // dashboard header / org reload
            console.log('TSign account type after plan change: ' + result.accountType);
            this.dispatchEvent(new CustomEvent('tsignaccounttypechange', {
                detail: { accountType: result.accountType },
                bubbles: true,
                composed: true
            }));
        } catch (error) {
            //this.errorMessage = this.readError(error, 'Could not change the plan.');
            this.showErrorToast(this.readError(error, 'Could not change the plan.'));
            this.isRedirecting = false;
            console.error('TSign startPlanChange failed', this.errorMessage);
        }
    }

    // ---------------------------------------------------------------- Business popup

    // open the popup, then fill it with the details already saved on the TSign Organisation
    async openBusinessForm(priceId) {
       // const countryByCurrency = { AUD: 'AU', INR: 'IN', USD: 'US', CAD: 'CA' };
        const countryByCurrency = { AUD: 'AU', INR: 'IN', USD: 'US', CAD: 'CA', SGD: 'SG' };
        this.pendingPriceId = priceId;
        this.bizError = '';
        this.bizForm = {
            teamSize: '2', legalName: '', tradingName: '', businessType: '',
            firstName: '', lastName: '', email: this.subscriberEmail || '', phone: '',
            country: countryByCurrency[this.details?.customerCurrency] || 'AU',
            street: '', unit: '', suburb: '', state: '', postcode: '',
            abn: '', acn: '', pan: '', gstin: '', bn: '', gstHst: '', uen: '', sgGst: '', ein: '',
            agreed: false
        };
        
        this.showBusinessForm = true;
        this.bizLoading = true;
        console.log('TSign business popup opened - priceId: ' + priceId + ' | org: ' + this.orgRecordId);
        try {
            const saved = await getUpgradeFormDetails({ orgRecordId: this.orgRecordId });
            console.log('TSign business popup saved details', JSON.stringify(saved));
            const filled = {};
            Object.keys(saved || {}).forEach((key) => {
                if (saved[key] !== null && saved[key] !== undefined && saved[key] !== '') {
                    filled[key] = String(saved[key]);
                }
            });
            if (filled.country && !this.countries[filled.country]) {
                delete filled.country;   // only AU / CA / IN / SG / US - keep the default
            }
            if (filled.teamSize) {
                const size = parseInt(filled.teamSize, 10);
                filled.teamSize = size >= 2 ? String(size) : '2';   // Business starts at 2 - a saved 1 (from Individual) shows as 2
            }
           // this.bizForm = { ...this.bizForm, ...filled, agreed: false };
            this.bizForm = { ...this.bizForm, ...filled, agreed: false };
            // saved +61412345678 -> shown as +61 412 345 678
            const savedPhone = checkMobile(this.bizForm.phone, this.bizForm.country, this.countryConfig.label);
            if (!savedPhone.error) {
                this.bizForm = { ...this.bizForm, phone: '+' + PHONE_RULES[this.bizForm.country].code + ' ' + savedPhone.national };
            }
            console.log('TSign business popup form', JSON.stringify(this.bizForm));
        } catch (error) {
            console.error('TSign getUpgradeFormDetails failed', this.readError(error, 'Could not load saved details.'));
        }
        this.bizLoading = false;
    }

    // handleBizChange(event) {
    //     const field = event.target.dataset.field;
    //     const value = event.target.type === 'checkbox' ? event.target.checked : event.detail.value;
    //     this.bizForm = { ...this.bizForm, [field]: value };
    //     if (field === 'country') {
    //         this.bizForm = { ...this.bizForm, state: '' };
    //     }
    // }
        handleBizChange(event) {
        const field = event.target.dataset.field;
        const value = event.target.type === 'checkbox' ? event.target.checked : event.detail.value;
        this.bizForm = { ...this.bizForm, [field]: value };
        if (field !== 'agreed' && event.target.setCustomValidity) {
            event.target.setCustomValidity('');   // edited - the old message is replaced on the next check
        }
        if (field === 'country') {
            // new country - all address fields cleared
            this.bizForm = { ...this.bizForm, street: '', unit: '', suburb: '', state: '', postcode: '' };
            ['street', 'unit', 'suburb', 'state', 'postcode'].forEach((name) => {
                const input = this.template.querySelector(`[data-field="${name}"]`);
                if (input && input.setCustomValidity) {
                    input.setCustomValidity('');
                }
            });
            console.log('TSign business popup - country changed to ' + value + ', address cleared');
            if (String(this.bizForm.phone || '').trim()) {
                this.checkBizField('phone', true);
            }
        }
    }

    // field left - a filled field is checked now; empty required fields are flagged on Continue
    handleBizBlur(event) {
        const field = event.target.dataset.field;
        if (String(this.bizForm[field] || '').trim()) {
            this.checkBizField(field, true);
        }
    }

    // runs one field's rule, tidies the shown value and puts the message under the field
    // returns { error } or { value } - value is what is saved (phone as +61412345678)
    checkBizField(field, show) {
        const form = this.bizForm;
        let result;
        if (field === 'phone') {
            result = checkMobile(form.phone, form.country, this.countryConfig.label);
            if (!result.error) {
                this.bizForm = { ...this.bizForm, phone: '+' + PHONE_RULES[form.country].code + ' ' + result.national };
                result.value = result.e164;
            }
        } else if (field === 'postcode') {
            result = checkPostcode(form.postcode, form.country);
            if (!result.error) {
                this.bizForm = { ...this.bizForm, postcode: result.value };
            }
        } else {
            const state = this.countryConfig.states.find(([code]) => code === form.state);
            result = checkTax(field, form[field], { ...form, stateName: state ? state[1] : '' });
            if (!result.error) {
                this.bizForm = { ...this.bizForm, [field]: result.display };
            }
        }
        if (show) {
            const input = this.template.querySelector(`[data-field="${field}"]`);
            if (input) {
                input.setCustomValidity(result.error || '');
                input.reportValidity();
            }
        }
        console.log('TSign business popup check - ' + field + ': ' + (result.error || 'ok ' + result.value));
        return result;
    }

    handleBizCancel() {
        this.showBusinessForm = false;
        this.pendingPriceId = '';
        console.log('TSign business popup cancelled');
    }

    // handleBizContinue() {
    //     this.bizError = '';
    //     const fields = [...this.template.querySelectorAll('.biz-field')];
    //     const allValid = fields.reduce((valid, field) => {
    //         field.reportValidity();
    //         return valid && field.checkValidity();
    //     }, true);
    //     if (!allValid) {
    //         this.bizError = 'Please fill in the required fields.';
    //         return;
    //     }
    //     const config = this.countryConfig;
    //     for (const field of config.tax) {
    //         const value = (this.bizForm[field.key] || '').replace(/\s/g, '');
    //         if (value && field.pattern && !field.pattern.test(value)) {
    //             this.bizError = field.message;
    //             return;
    //         }
    //     }
    //     if (!this.bizForm.agreed) {
    //         this.bizError = 'Please confirm you are authorised to act for this organisation and agree to the Terms.';
    //         return;
    //     }
    //     // send only the selected country's tax fields (and no city / state for Singapore)
    //     const details = { ...this.bizForm };
    //     delete details.agreed;
    //     Object.values(this.countries).forEach((country) => {
    //         country.tax.forEach((field) => {
    //             if (!config.tax.some((own) => own.key === field.key)) {
    //                 delete details[field.key];
    //             }
    //         });
    //     });
    //     if (!config.cityLabel) {
    //         delete details.suburb;
    //         delete details.state;
    //     }
    //     console.log('TSign business details', JSON.stringify(details));
    //     this.showBusinessForm = false;
    //     this.startCheckout(this.pendingPriceId, details);
    // }
        handleBizContinue() {
        this.bizError = '';
        // phone, postcode and this country's tax fields - checked with the rules, message under each field
        const checked = {};
        let rulesValid = true;
        ['phone', 'postcode', ...this.countryConfig.tax.map((f) => f.key)].forEach((field) => {
            const result = this.checkBizField(field, true);
            checked[field] = result.value;
            if (result.error) {
                rulesValid = false;
            }
        });
        const fields = [...this.template.querySelectorAll('.biz-field')];
        const allValid = fields.reduce((valid, field) => {
            field.reportValidity();
            return valid && field.checkValidity();
        }, true);
        if (!allValid || !rulesValid) {
            //this.bizError = 'Please check the highlighted fields.';
            this.showBizErrorToast('Please check the required fields.');
            return;
        }
        if (!this.bizForm.agreed) {
           // this.bizError = 'Please confirm you are authorised to act for this organisation and agree to the Terms.';
            this.showBizErrorToast('Please confirm you are authorised to act for this organisation and agree to the Terms.');
            return;
        }
        const config = this.countryConfig;
        // send only the selected country's tax fields (and no city / state for Singapore)
        const details = { ...this.bizForm };
        delete details.agreed;
        Object.keys(checked).forEach((key) => {
            details[key] = checked[key] || '';   // saved form: +61412345678, 51824753556, 12-3456789 ...
        });
        Object.values(this.countries).forEach((country) => {
            country.tax.forEach((field) => {
                if (!config.tax.some((own) => own.key === field.key)) {
                    delete details[field.key];
                }
            });
        });
        if (!config.cityLabel) {
            delete details.suburb;
            delete details.state;
        }
        console.log('TSign business details', JSON.stringify(details));
        this.showBusinessForm = false;
        this.startCheckout(this.pendingPriceId, details);
    }

    get pendingPrice() {
        for (const plan of this.plans) {
            const price = (plan.prices || []).find((p) => p.priceId === this.pendingPriceId);
            if (price) {
                return price;
            }
        }
        return null;
    }

    get bizSubtitle() {
        const billed = this.pendingPrice?.interval === 'year' ? 'yearly' : 'monthly';
        // //return `Billed ${billed}. Payment details come next, on Stripe.`;
        // return this.currentPlan
        //     ? `Billed ${billed}. Your current plan is changed and the price difference is charged to your saved card.`
        //     : `Billed ${billed}. Payment details come next, on Stripe.`;
        return this.currentPlan && !this.isTrialing
            ? `Billed ${billed}. Next, Stripe shows the price difference for you to confirm.`
            : `Billed ${billed}. Payment details come next, on Stripe.`;
    }

    // e.g. "2 users × A$36 = A$72 / month" - in the customer's Stripe currency
    get teamPriceText() {
        const price = this.pendingPrice;
        const size = Number(this.bizForm.teamSize) || 0;
        if (!price || size < 1) {
            return '';
        }
        const customerCurrency = this.details?.customerCurrency;
        const amounts = price.amountsByCurrency || {};
        const currency = customerCurrency && amounts[customerCurrency] != null ? customerCurrency : price.currencyCode;
        const unit = currency === customerCurrency ? amounts[customerCurrency] : price.amount;
        return `${size} ${size === 1 ? 'user' : 'users'} × ${this.formatPrice(unit, currency)} = `
            + `${this.formatPrice(unit * size, currency)} / ${price.interval}`;
    }

    // saved value is added to the list if it isn't one of these, so it still shows
    get businessTypeOptions() {
        const types = ['Sole trader','Partnership', 'Company', 'Trust', 'Non-profit or charity', 'Government body', 'Other'];
        if (this.bizForm.businessType && !types.includes(this.bizForm.businessType)) {
            types.unshift(this.bizForm.businessType);
        }
        return types.map((type) => ({ label: type, value: type }));
    }

    get countryConfig() {
        return this.countries[this.bizForm.country] || this.countries.AU;
    }

    // Australia, Canada, India, Singapore, United States
    get countryOptions() {
        return Object.keys(this.countries)
            .map((code) => ({ label: this.countries[code].label, value: code }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }

    // Singapore has no city / state
    get showCityState() {
        return !!this.countryConfig.cityLabel;
    }

    // states of the selected country (saved state is added if it isn't in the list, so it still shows)
    get stateOptions() {
        const options = this.countryConfig.states.map(([code, name]) => ({ label: name, value: code }));
        if (this.bizForm.state && !options.some((o) => o.value === this.bizForm.state)) {
            options.unshift({ label: this.bizForm.state, value: this.bizForm.state });
        }
        return options;
    }

    // registration / tax inputs for the selected country, with their current values
    // get taxFields() {
    //     return this.countryConfig.tax.map((field) => ({
    //         key: field.key,
    //         label: field.required ? field.label : field.label + ' (optional)',
    //         placeholder: field.placeholder,
    //         required: field.required,
    //         value: this.bizForm[field.key] || ''
    //     }));
    // }
    get taxFields() {
        return this.countryConfig.tax.map((field) => {
            const required = taxRequired(field.key, this.bizForm.businessType);
            return {
                key: field.key,
                label: required ? field.label : field.label + ' (optional)',
                placeholder: field.placeholder,
                required,
                value: this.bizForm[field.key] || ''
            };
        });
    }
    formatPrice(amount, currencyCode) {
        try {
            return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currencyCode }).format(Number(amount));
        } catch (e) {
            return `${currencyCode} ${Number(amount).toFixed(2)}`;
        }
    }

    formatDate(unixSeconds) {
        if (!unixSeconds) {
            return '';
        }
        return new Date(Number(unixSeconds) * 1000).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    }
        // >>> NEW: price in the customer's currency if available, else the price's default currency
    priceLabelFor(price) {
        if (!price) {
            return `No ${this.isYearly ? 'yearly' : 'monthly'} price`;
        }
        const customerCurrency = this.details?.customerCurrency;
        const amounts = price.amountsByCurrency || {};
        if (customerCurrency && amounts[customerCurrency] != null) {
            return `${this.formatPrice(amounts[customerCurrency], customerCurrency)} / ${price.interval}`;
        }
        return `${this.formatPrice(price.amount, price.currencyCode)} / ${price.interval}`;
    }

    // NEW (redesign): price only (no "/ month") - in the customer's currency if available
    priceAmountFor(price) {
        if (!price) {
            return '';
        }
        const customerCurrency = this.details?.customerCurrency;
        const amounts = price.amountsByCurrency || {};
        if (customerCurrency && amounts[customerCurrency] != null) {
            return this.formatPrice(amounts[customerCurrency], customerCurrency);
        }
        return this.formatPrice(price.amount, price.currencyCode);
    }
        // ---------------------------------------------------------------- Stop trial / cancel subscription

    get isTrialing() {
        return this.currentPlan?.status === 'trialing';
    }

    get canCancel() {
        const sub = this.currentPlan;
        return !!sub && !sub.cancelAtPeriodEnd && ['active', 'trialing', 'past_due', 'unpaid'].includes(sub.status);
    }

    get canResume() {
        return !!this.currentPlan?.cancelAtPeriodEnd;
    }

    get cancelButtonLabel() {
        return this.isTrialing ? 'Cancel trial' : 'Cancel subscription';
    }

    get cancelConfirmText() {
        if (this.cancelAction === 'now') {
            return 'Your trial stops now and you will not be charged. You can choose a plan again at any time.';
        }
        return `Your plan stays active until ${this.formatDate(this.currentPlan?.currentPeriodEnd)}, then it stops. No further payments will be taken.`;
    }

    handleCancelClick() {
        this.cancelError = '';
         if (!this.isCancelAllowed) {
            const what = this.isTrialing ? 'free trial' : 'subscription';
            console.log('T sign cancel blocked - user type: ' + this.userType + ' | business plan: ' + this.isBusinessPlan);
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: `Only your organisation admin can cancel this ${what}.`,
                variant: 'error'
            }));
            return;
        }
        this.cancelAction = this.isTrialing ? 'now' : 'periodEnd';
        this.showCancelConfirm = true;
        console.log('TSign cancel clicked - action: ' + this.cancelAction);
    }

    handleCancelClose() {
        if (this.cancelBusy) {
            return;
        }
        this.showCancelConfirm = false;
        this.cancelAction = '';
    }

    async handleCancelConfirm() {
        const done = await this.changeSubscription(this.cancelAction);
        if (done) {
            this.showCancelConfirm = false;
            this.cancelAction = '';
        }
    }

    handleResume() {
        this.cancelError = '';
        this.changeSubscription('resume');
    }

    async changeSubscription(action) {
        this.cancelBusy = true;
        let done = false;
        try {
            const result = await cancelSubscription({ subscriberEmail: this.subscriberEmail,
                stripeCustomerId: this.stripeCustomerId, orgRecordId: this.orgRecordId, action });
            console.log('TSign cancel result', JSON.stringify(result));
            await this.loadDetails();                                   // show the new state
            this.dispatchEvent(new CustomEvent('subscriptionupdated')); // parent reloads the record
            done = true;
        } catch (error) {
            this.cancelError = this.readError(error, 'Could not change the subscription.');
            console.error('TSign cancelSubscription failed', this.cancelError);
        }
        this.cancelBusy = false;
        return done;
    }

    // ---------------------------------------------------------------- Renew (already cancelled)

    get lastPlan() {
        return this.currentPlan ? null : this.details?.lastPlan;
    }

    // OLD lastPlanInfo (before redesign 3 Nov 2026) - kept for reference
    // get lastPlanInfo() {
    //     const last = this.lastPlan;
    //     if (!last) {
    //         return undefined;
    //     }
    //     const plan = this.plans.find((p) => String(p.productId) === String(last.productId));
    //     const qty = Number(last.quantity || 1);
    //     let line = (last.interval === 'year' ? 'Yearly' : 'Monthly') + (qty > 1 ? ` · ${qty} users` : '');
    //     if (last.endedAt) {
    //         line += ` · Cancelled on ${this.formatDate(last.endedAt)}`;
    //     }
    //     return { name: plan ? plan.productName : 'Previous plan', line };
    // }
    // NEW (redesign): same as before + Billing | Users | Cancelled on row
    get lastPlanInfo() {
        const last = this.lastPlan;
        if (!last) {
            return undefined;
        }
        const plan = this.plans.find((p) => String(p.productId) === String(last.productId));
        const qty = Number(last.quantity || 1);
        let line = (last.interval === 'year' ? 'Yearly' : 'Monthly') + (qty > 1 ? ` · ${qty} users` : '');
        if (last.endedAt) {
            line += ` · Cancelled on ${this.formatDate(last.endedAt)}`;
        }
        const meta = [
            { key: 'billing', label: 'Billing', value: this.intervalName(last.interval) },
            { key: 'users', label: 'Users', value: String(qty) }
        ];
        if (last.endedAt) {
            meta.push({ key: 'ended', label: 'Cancelled on', value: this.formatDate(last.endedAt) });
        }
        return { name: plan ? plan.productName : 'Previous plan', line, meta };
    }

    // same price if still active in Stripe, else the active price of the same product + billing period
    get renewPriceId() {
        const last = this.lastPlan;
        if (!last) {
            return null;
        }
        const plan = this.plans.find((p) => String(p.productId) === String(last.productId));
        const prices = plan ? plan.prices || [] : [];
        const same = prices.find((p) => String(p.priceId) === String(last.priceId));
        const sameInterval = prices.find((p) => p.interval === last.interval);
        return same ? same.priceId : sameInterval ? sameInterval.priceId : null;
    }

    get renewDisabled() {
        return !this.renewPriceId || this.isRedirecting;
    }
     get cancelConfirmQuestion() {
        return this.isTrialing
            ? 'Are you sure want to stop the trial ?'
            : 'Are you sure want to cancel the subscription ?';
    }

    // NEW (redesign): heading of the cancel popup
    get cancelConfirmTitle() {
        return this.isTrialing ? 'Cancel your trial?' : 'Cancel your subscription?';
    }

    handleRenew() {
        const priceId = this.renewPriceId;
        const qty = Number(this.lastPlan?.quantity || 1);
        console.log('TSign renew clicked - priceId: ' + priceId + ' | users: ' + qty);
        if (!priceId) {
            return;
        }
        // same number of users as before (Apex reads teamSize as the Stripe quantity)
        this.startCheckout(priceId, qty > 1 ? { teamSize: String(qty) } : null);
    }
     handleBack() {
        console.log('TSign back to organisation details');
        this.dispatchEvent(new CustomEvent('closesubscription'));
    }
}