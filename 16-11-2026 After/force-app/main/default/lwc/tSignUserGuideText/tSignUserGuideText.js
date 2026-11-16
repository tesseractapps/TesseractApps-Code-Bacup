import { LightningElement, api } from "lwc";

// One line of User Guide text: plain, **bold** and [link](topic#section) segments built by tSignUserGuide.
export default class TSignUserGuideText extends LightningElement {
  @api segments = [];

  handleClick(event) {
    event.preventDefault();
    this.dispatchEvent(new CustomEvent("guidelink", { detail: { href: event.currentTarget.dataset.href } }));
  }
}