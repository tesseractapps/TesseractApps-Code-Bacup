import { LightningElement, track, api } from 'lwc';

export default class TSignAddressSelector extends LightningElement {
    @api
    get address() {
        return this._address;
    }

    set address(value) {
        if (value) {
            this._address = { ...value };
        }
    }

    @track _address = {
        street: '',
        city: '',
        province: '',
        postalCode: '',
        country: ''
    };

    countryOptions = [
        { label: 'Australia', value: 'AU' },
        { label: 'Canada', value: 'CA' },
        { label: 'India', value: 'IN' },
      //  { label: 'New Zealand', value: 'NZ' },
       
        { label: 'Singapore', value: 'SG' },
      //  { label: 'United Arab Emirates', value: 'AE' },
      //  { label: 'United Kingdom', value: 'GB' },
        { label: 'United States', value: 'US' }
    ];/*  { label: 'Saudi Arabia', value: 'SA' }, */

    countryProvinceMap = {
        AU: [
            { label: 'Australian Capital Territory', value: 'ACT' },
            { label: 'New South Wales', value: 'NSW' },
            { label: 'Northern Territory', value: 'NT' },
            { label: 'Queensland', value: 'QLD' },
            { label: 'South Australia', value: 'SA' },
            { label: 'Tasmania', value: 'TAS' },
            { label: 'Victoria', value: 'VIC' },
            { label: 'Western Australia', value: 'WA' }
        ],

        CA: [
            { label: 'Alberta', value: 'AB' },
            { label: 'British Columbia', value: 'BC' },
            { label: 'Manitoba', value: 'MB' },
            { label: 'New Brunswick', value: 'NB' },
            { label: 'Newfoundland and Labrador', value: 'NL' },
            { label: 'Northwest Territories', value: 'NT' },
            { label: 'Nova Scotia', value: 'NS' },
            { label: 'Nunavut', value: 'NU' },
            { label: 'Ontario', value: 'ON' },
            { label: 'Prince Edward Island', value: 'PE' },
            { label: 'Quebec', value: 'QC' },
            { label: 'Saskatchewan', value: 'SK' },
            { label: 'Yukon', value: 'YT' }
        ],

        IN: [
            { label: 'Andaman and Nicobar Islands', value: 'AN' },
            { label: 'Andhra Pradesh', value: 'AP' },
            { label: 'Arunachal Pradesh', value: 'AR' },
            { label: 'Assam', value: 'AS' },
            { label: 'Bihar', value: 'BR' },
            { label: 'Chandigarh', value: 'CH' },
            { label: 'Chhattisgarh', value: 'CG' },
            { label: 'Dadra and Nagar Haveli and Daman and Diu', value: 'DH' },
            { label: 'Delhi', value: 'DL' },
            { label: 'Goa', value: 'GA' },
            { label: 'Gujarat', value: 'GJ' },
            { label: 'Haryana', value: 'HR' },
            { label: 'Himachal Pradesh', value: 'HP' },
            { label: 'Jammu and Kashmir', value: 'JK' },
            { label: 'Jharkhand', value: 'JH' },
            { label: 'Karnataka', value: 'KA' },
            { label: 'Kerala', value: 'KL' },
            { label: 'Ladakh', value: 'LA' },
            { label: 'Lakshadweep', value: 'LD' },
            { label: 'Madhya Pradesh', value: 'MP' },
            { label: 'Maharashtra', value: 'MH' },
            { label: 'Manipur', value: 'MN' },
            { label: 'Meghalaya', value: 'ML' },
            { label: 'Mizoram', value: 'MZ' },
            { label: 'Nagaland', value: 'NL' },
            { label: 'Odisha', value: 'OD' },
            { label: 'Puducherry', value: 'PY' },
            { label: 'Punjab', value: 'PB' },
            { label: 'Rajasthan', value: 'RJ' },
            { label: 'Sikkim', value: 'SK' },
            { label: 'Tamil Nadu', value: 'TN' },
            { label: 'Telangana', value: 'TS' },
            { label: 'Tripura', value: 'TR' },
            { label: 'Uttar Pradesh', value: 'UP' },
            { label: 'Uttarakhand', value: 'UK' },
            { label: 'West Bengal', value: 'WB' }
        ],

        NZ: [
            { label: 'Auckland', value: 'AUK' },
            { label: 'Bay of Plenty', value: 'BOP' },
            { label: 'Canterbury', value: 'CAN' },
            { label: 'Chatham Islands Territory', value: 'CIT' },
            { label: 'Gisborne', value: 'GIS' },
            { label: "Hawke's Bay", value: 'HKB' },
            { label: 'Manawatū-Whanganui', value: 'MWT' },
            { label: 'Marlborough', value: 'MBH' },
            { label: 'Nelson', value: 'NSN' },
            { label: 'Northland', value: 'NTL' },
            { label: 'Otago', value: 'OTA' },
            { label: 'Southland', value: 'STL' },
            { label: 'Taranaki', value: 'TKI' },
            { label: 'Tasman', value: 'TAS' },
            { label: 'Waikato', value: 'WKO' },
            { label: 'Wellington', value: 'WGN' },
            { label: 'West Coast', value: 'WTC' }
        ],

        GB: [
            { label: 'England', value: 'ENG' },
            { label: 'Scotland', value: 'SCT' },
            { label: 'Wales', value: 'WLS' },
            { label: 'Northern Ireland', value: 'NIR' }
        ],

        AE: [
            { label: 'Abu Dhabi', value: 'AZ' },
            { label: 'Ajman', value: 'AJ' },
            { label: 'Dubai', value: 'DU' },
            { label: 'Fujairah', value: 'FU' },
            { label: 'Ras Al Khaimah', value: 'RK' },
            { label: 'Sharjah', value: 'SH' },
            { label: 'Umm Al Quwain', value: 'UQ' }
        ],

        SA: [
            { label: 'Al Bahah', value: '11' },
            { label: 'Al Jawf', value: '12' },
            { label: 'Asir', value: '14' },
            { label: 'Eastern Province', value: '04' },
            { label: "Ha'il", value: '06' },
            { label: 'Jazan', value: '09' },
            { label: 'Madinah', value: '03' },
            { label: 'Makkah', value: '02' },
            { label: 'Najran', value: '10' },
            { label: 'Northern Borders', value: '08' },
            { label: 'Qassim', value: '05' },
            { label: 'Riyadh', value: '01' },
            { label: 'Tabuk', value: '07' }
        ],
        US: [
            { label: 'Alabama', value: 'AL' },
            { label: 'Alaska', value: 'AK' },
            { label: 'Arizona', value: 'AZ' },
            { label: 'Arkansas', value: 'AR' },
            { label: 'California', value: 'CA' },
            { label: 'Colorado', value: 'CO' },
            { label: 'Connecticut', value: 'CT' },
            { label: 'Delaware', value: 'DE' },
            { label: 'District of Columbia', value: 'DC' },
            { label: 'Florida', value: 'FL' },
            { label: 'Georgia', value: 'GA' },
            { label: 'Hawaii', value: 'HI' },
            { label: 'Idaho', value: 'ID' },
            { label: 'Illinois', value: 'IL' },
            { label: 'Indiana', value: 'IN' },
            { label: 'Iowa', value: 'IA' },
            { label: 'Kansas', value: 'KS' },
            { label: 'Kentucky', value: 'KY' },
            { label: 'Louisiana', value: 'LA' },
            { label: 'Maine', value: 'ME' },
            { label: 'Maryland', value: 'MD' },
            { label: 'Massachusetts', value: 'MA' },
            { label: 'Michigan', value: 'MI' },
            { label: 'Minnesota', value: 'MN' },
            { label: 'Mississippi', value: 'MS' },
            { label: 'Missouri', value: 'MO' },
            { label: 'Montana', value: 'MT' },
            { label: 'Nebraska', value: 'NE' },
            { label: 'Nevada', value: 'NV' },
            { label: 'New Hampshire', value: 'NH' },
            { label: 'New Jersey', value: 'NJ' },
            { label: 'New Mexico', value: 'NM' },
            { label: 'New York', value: 'NY' },
            { label: 'North Carolina', value: 'NC' },
            { label: 'North Dakota', value: 'ND' },
            { label: 'Ohio', value: 'OH' },
            { label: 'Oklahoma', value: 'OK' },
            { label: 'Oregon', value: 'OR' },
            { label: 'Pennsylvania', value: 'PA' },
            { label: 'Rhode Island', value: 'RI' },
            { label: 'South Carolina', value: 'SC' },
            { label: 'South Dakota', value: 'SD' },
            { label: 'Tennessee', value: 'TN' },
            { label: 'Texas', value: 'TX' },
            { label: 'Utah', value: 'UT' },
            { label: 'Vermont', value: 'VT' },
            { label: 'Virginia', value: 'VA' },
            { label: 'Washington', value: 'WA' },
            { label: 'West Virginia', value: 'WV' },
            { label: 'Wisconsin', value: 'WI' },
            { label: 'Wyoming', value: 'WY' }
        ],

        SG: [],

        // Continue with your existing US mapping in Part 2.
    };

        // Add your existing US array inside countryProvinceMap above.

    get provinceOptions() {
        return this.countryProvinceMap[this._address.country] || [];
    }

    // Disable the province field for Singapore.
    get isProvinceDisabled() {
        return this._address.country === 'SG';
    }

    handleAddressChange(event) {
        const detail = event.detail;
        console.log('Address Chnage '+JSON.stringify(detail));

        const selectedCountry = detail.country || '';

        this._address = {
            street: detail.street || '',
            city: detail.city || '',
            country: selectedCountry,
            province: selectedCountry === 'SG'
                ? ''
                : (detail.province || ''),
            postalCode: detail.postalCode || ''
        };

        this.dispatchEvent(
            new CustomEvent('addresschange', {
                detail: { ...this._address }
            })
        );
    }
}