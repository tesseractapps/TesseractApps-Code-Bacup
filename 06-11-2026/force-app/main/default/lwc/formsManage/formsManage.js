import { LightningElement, track, api } from 'lwc';

export default class FormsManage extends LightningElement {
  @track isIncidentRegisterSelected = true;
  @track isCustomisableFormSelected = false;

  @track renderKey = 0; // Forces re-render
  @track shouldRenderFormRender = true; // Controls <c-form-render> visibility

  @api orgid = '';
  @api clientId = '';

  connectedCallback() {
    console.log('📌 Received Org ID in Manage Forms:', this.orgid);
    console.log('📌 Received Client ID in Manage Forms:', this.clientId);
  }

  get customizableformsClass() {
    return this.isCustomisableFormSelected ? 'menu-item1' : 'menu-item';
  }

  get incidentClass() {
    return this.isIncidentRegisterSelected ? 'menu-item1' : 'menu-item';
  }

  handleIncidentRegister() {
    this.isIncidentRegisterSelected = true;
    this.isCustomisableFormSelected = false;
    this.renderKey++;
    this.shouldRenderFormRender = false;
    console.log('🔁 Switched to Incident Register');
  }

  handleCustomisableForms() {
    this.isCustomisableFormSelected = true;
    this.isIncidentRegisterSelected = false;

    // Force <c-form-render> to remount by toggling it off and back on
    this.shouldRenderFormRender = false;
    setTimeout(() => {
      this.renderKey++;
      this.shouldRenderFormRender = true;
      console.log('🔁 Switched to Customisable Forms');
    }, 0);
  }
}