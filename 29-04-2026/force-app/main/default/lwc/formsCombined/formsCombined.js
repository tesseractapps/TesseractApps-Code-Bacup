import { LightningElement,wire, track, api } from 'lwc';
import { MessageContext, subscribe } from 'lightning/messageService';
import LAYOUT_MESSAGE_CHANNEL from '@salesforce/messageChannel/LayoutMessageChannel__c';
import BOT_ACTION_CHANNEL from '@salesforce/messageChannel/BotActionMessageChannel__c';

export default class FormsManage extends LightningElement {
  @track isCreatedTabSelected = false;
  @track isDesignTabSelected = true;
  @track isDraftTabSelected = false;
 @track receivedLayoutData = null;
 @track isSubmittedTabSelected = false;
  @track renderKey = 0;
  @track shouldRenderFormRender = true;


  @api orgid = '';
  @api clientId = '';
  @track viewModeFromParent = false;

  @wire(MessageContext) messageContext;
  subscription;

  connectedCallback() {
    this.subscribeToMessageChannel();
    this.subscribeBot();
    console.log('📌 Received Org ID in Manage Forms:', this.orgid);
    console.log('📌 Received Client ID in Manage Forms:', this.clientId);
  }

  get designTabClass() {
    return this.isDesignTabSelected ? 'menu-item1' : 'menu-item';
  }

  get createdTabClass() {
    return this.isCreatedTabSelected ? 'menu-item1' : 'menu-item';
  }

   get draftTabClass() {
    return this.isDraftTabSelected ? 'menu-item1' : 'menu-item';
  }
   get submitTabClass() {
    return this.isSubmittedTabSelected ? 'menu-item1' : 'menu-item';
  }

  subscribeBot() {
  if (this.botSubscription) return;
  this.botSubscription = subscribe(this.messageContext, BOT_ACTION_CHANNEL, (msg) => {
    if (!msg || !msg.action) return;

    if (msg.action === 'open_default_layout') {
      const query = (msg.query || '').trim();
      // 1) Ensure "Design New Form" tab is active
      this.activateDesignTab?.() || this.handleDesignTab?.();

      // 2) Defer to the child once it's rendered
      // small delay to let the formCreate render its layout cards
      setTimeout(() => {
        const formCreate = this.template.querySelector('c-form-create');
        if (formCreate && formCreate.openDefaultLayoutByQuery) {
          formCreate.openDefaultLayoutByQuery(query);
        }
      }, 250);
    }
  });
}

  // handleCreatedTab() {
  //   this.isCreatedTabSelected = true;
  //   this.isDesignTabSelected = false;
  //   this.isDraftTabSelected = false;
  //   this.isSubmittedTabSelected = false;
  //   this.receivedLayoutData = null;
  //   this.renderKey++;
  //   this.shouldRenderFormRender = false;
  //   this.viewModeFromParent=true;
  //   console.log('🔁 Switched to Created Forms');
  // }

  // handleDraftTab() {
  //   this.isCreatedTabSelected = false;
  //   this.isDesignTabSelected = false;
  //   this.isDraftTabSelected = true;
  //   this.isSubmittedTabSelected = false;
  //   this.receivedLayoutData = null;
  // }

  handleConfirmedTabSwitch(event) {
    const tab = event.detail.tab;
    if (tab === 'draft') {
        this.activateDraftTab();
    } else if (tab === 'created') {
        this.activateCreatedTab();
    }
}


handleDraftTab() {
    console.log('[handleDraftTab] Tab clicked.');

    const formCreateComponent = this.template.querySelector('c-form-create');

    if (!formCreateComponent) {
        console.log('[handleDraftTab] No formCreateComponent found. Proceeding with tab switch.');
        this.activateDraftTab();
        return;
    }

    const hasUnsaved = formCreateComponent.hasUnsavedChanges();
    console.log(`[handleDraftTab] formCreateComponent found. Unsaved changes: ${hasUnsaved}`);

    if (hasUnsaved) {
        console.log('[handleDraftTab] Showing confirmation popup for unsaved changes.');
        formCreateComponent.triggerUnsavedChangesPopup('draft');
    } else {
        console.log('[handleDraftTab] No unsaved changes. Proceeding with tab switch.');
        this.activateDraftTab();
    }
}



handleCreatedTab() {
    console.log('[handleCreatedTab] Tab clicked.');

    const formCreateComponent = this.template.querySelector('c-form-create');

    if (!formCreateComponent) {
        console.log('[handleCreatedTab] No formCreateComponent found. Proceeding with tab switch.');
        this.activateCreatedTab();
        return;
    }

    const hasUnsaved = formCreateComponent.hasUnsavedChanges();
    console.log(`[handleCreatedTab] formCreateComponent found. Unsaved changes: ${hasUnsaved}`);

    if (hasUnsaved) {
        console.log('[handleCreatedTab] Showing confirmation popup for unsaved changes.');
        formCreateComponent.triggerUnsavedChangesPopup('created');
    } else {
        console.log('[handleCreatedTab] No unsaved changes. Proceeding with tab switch.');
        this.activateCreatedTab();
    }
}



activateDraftTab() {
    this.isCreatedTabSelected = false;
    this.isDesignTabSelected = false;
    this.isDraftTabSelected = true;
    this.isSubmittedTabSelected = false;
    this.receivedLayoutData = null;
}

activateCreatedTab() {
    this.isCreatedTabSelected = true;
    this.isDesignTabSelected = false;
    this.isDraftTabSelected = false;
    this.isSubmittedTabSelected = false;
    this.receivedLayoutData = null;
    this.renderKey++;
    this.shouldRenderFormRender = false;
    this.viewModeFromParent = true;
}



  handleDesignTab() {
    this.isDesignTabSelected = true;
    this.isCreatedTabSelected = false;
    this.isSubmittedTabSelected = false;
    this.isDraftTabSelected = false;
    this.shouldRenderFormRender = false;
    setTimeout(() => {
      this.renderKey++;
      this.shouldRenderFormRender = true;
      console.log('🔁 Switched to Design New Forms');
    }, 0);
  }

    handleSubmitTab() {
   this.isCreatedTabSelected = false;
    this.isDesignTabSelected = false;
    this.isDraftTabSelected = false;
    this.isSubmittedTabSelected = true;
    this.receivedLayoutData = null;
    this.viewModeFromParent=false;
  }


  subscribeToMessageChannel() {
    this.subscription = subscribe(
      this.messageContext,
      LAYOUT_MESSAGE_CHANNEL,
      (message) => this.handleLayoutEditMessage(message)
    );
  }

  handleLayoutEditMessage(message) {
  console.log('📩 Received layout edit message:', JSON.stringify(message, null, 2));

  if (message.actionType === 'edit') {
    this.isDesignTabSelected = true;
    this.isCreatedTabSelected = false;
    this.isDraftTabSelected = false;
    this.receivedLayoutData = message;
    this.shouldRenderFormRender = false;

    // Re-render the form-create component
    setTimeout(() => {
      this.renderKey++;
      this.shouldRenderFormRender = true;
    }, 0);
  }
}

handleBackClick() {
    const backEvent = new CustomEvent('navigateback', {
        detail: { target: 'participants' }
    });
    this.dispatchEvent(backEvent);
}


}