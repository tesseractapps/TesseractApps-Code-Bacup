import { LightningElement, api, wire } from "lwc";
import { publish, MessageContext } from "lightning/messageService";
import FOOTER_MESSAGE_CHANNEL from "@salesforce/messageChannel/FooterMessageChannel__c";
// Same page as the footer's "Contact us"
const SUPPORT_URL = "https://tsignapp.com/contact";

export default class TSignHelpMenu extends LightningElement {
  @api userGuideUrl = ""; // blank hides the User Guide item until the guide exists
  @wire(MessageContext) messageContext;  

  isOpen = false;

  get ariaExpanded() {
    return this.isOpen ? "true" : "false";
  }

  get hasUserGuide() {
    return !!this.userGuideUrl;
  }

  get chevronIcon() {
    return this.isOpen ? "expand_less" : "expand_more";
  }

  handleToggle() {
    this.isOpen = !this.isOpen;
  }

  // the menu closes through its own backdrop and Esc key, not a window click listener,
  // because LWS cuts composedPath() for page-level listeners on this site
  handleClose() {
    this.isOpen = false;
  }

  handleKeydown(event) {
    if (event.key === "Escape" && this.isOpen) {
      event.stopPropagation();
      this.isOpen = false;
      this.template.querySelector(".help-btn")?.focus();
    }
  }

  handleTour() {
    this.isOpen = false;
    this.dispatchEvent(new CustomEvent("starttour"));
  }

  // handleUserGuide() {
  //   this.isOpen = false;
  //   window.open(this.userGuideUrl, "_blank", "noopener");
  // }
  handleUserGuide() {
    this.isOpen = false;
    // "#/..." is a page inside the app (the dashboard opens it); a full web address opens in a new tab
    if (this.userGuideUrl.startsWith("#")) {
      // Contact us opens without changing the address, so it can still say #/user-guide.
      // Clear it first, so the dashboard sees a change and opens the guide.
      if (window.location.hash === this.userGuideUrl) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      window.location.hash = this.userGuideUrl;
    } else window.open(this.userGuideUrl, "_blank", "noopener");
  }  

  // Same as the footer's "Contact us": the dashboard opens its Contact Us page
  handleSupport() {
    this.isOpen = false;
    publish(this.messageContext, FOOTER_MESSAGE_CHANNEL, { action: "openContactPanel" });
  }
}