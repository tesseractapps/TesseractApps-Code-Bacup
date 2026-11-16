import { LightningElement, api } from "lwc";
import getTourState from "@salesforce/apex/TSignGuidedTourController.getTourState";
import saveTourStatus from "@salesforce/apex/TSignGuidedTourController.saveTourStatus";
import TSIGN_LOGO from "@salesforce/resourceUrl/tsignapp_logo";

const CARD_WIDTH = 380;
const GAP = 16; // space between the lit area and the card
const EDGE = 12; // smallest space between the card and the window edge
const PAD = 6; // the ring sits this far outside the lit area
const RADIUS = 10;
const SHEET_BELOW = 640; // narrower windows: the card docks to the bottom
const AUTO_OPEN_MIN_WIDTH = 768; // the welcome popup opens by itself only on tablet/desktop widths

// Module_Access__c values -> sidebar labels, in menu order
const MENU_LABELS = [
  ["T Sign", "T sign"],
  ["Folders", "Folders"],
  ["My Organisation", "My Organisation"],
  ["My Profile", "My Profile"],
  ["Templates", "Templates"],
  ["Contact", "Contacts"],
  ["Reports", "Reports"]
];

const STEPS = [
  { key: "navigation", icon: "menu", label: "Navigation", title: "Explore the navigation", placement: "right", align: "start" },
  {
    key: "status",
    icon: "grid_view",
    label: "Status cards",
    title: "Track your documents",
    placement: "bottom",
    align: "center",
    body: [
      { text: "These cards count your documents by status: Action Required, Waiting for others, Expiring soon and Completed. Click " },
      { text: "View All", bold: true },
      { text: " on a card to see the list behind it." }
    ]
  },
  {
    key: "upload",
    icon: "cloud_upload",
    label: "Send a document",
    title: "Send a document for signature",
    placement: "right",
    align: "center",
    body: [
      { text: "Drag a Word or PDF file into this area, or click " },
      { text: "Browse", bold: true },
      { text: ", to start a signing request. Each file can be up to 20 MB." }
    ]
  },
  {
    key: "recent",
    icon: "history",
    label: "Recent Activity",
    title: "See what’s happening",
    placement: "left",
    align: "center",
    body: [{ text: "Recent Activity lists the latest signing events, newest first: who did what, to which document, and when." }]
  },
  { key: "help", icon: "help", label: "Help", title: "Help is always here", placement: "bottom", align: "end" }
];

// "module" is the sidebar item the row opens; "access" is the Module_Access__c value it needs
const CHECKLIST = [
  { key: "signature", icon: "signature", label: "Create your signature", module: "My Profile", access: "My Profile" },
  { key: "org", icon: "domain", label: "Add users and facilities", module: "My Organisation", access: "My Organisation", businessOnly: true },
  { key: "contacts", icon: "contact_page", label: "Add your contacts", module: "Contacts", access: "Contact" },
  { key: "templates", icon: "description", label: "Create templates", module: "Templates", access: "Templates" },
  { key: "folders", icon: "folder", label: "Store files in Folders", module: "Folders", access: "Folders" }
];

function joinWithAnd(items) {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function roundedRect({ x, y, w, h }) {
  const r = Math.min(RADIUS, w / 2, h / 2);
  return (
    `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}` +
    `V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
    `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}` +
    `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
  );
}

export default class TSignGuidedTour extends LightningElement {
  @api accountType = "Individual"; // "Business" | "Individual"
  @api modules = []; // Module_Access__c values, e.g. ["T Sign", "Folders", ...]
  @api measureTarget; // (key, scrollIntoView) => { top, left, width, height } | null, from the dashboard
  @api userGuideUrl = ""; // blank hides "View getting started" and "Open User Guide"
  @api hideHelpStep = false; // true = 4-step tour (when the Help menu is not on the page)

  // the dashboard sets this once its loading screen is gone and no other popup blocks the app
  @api
  get ready() {
    return this._ready;
  }
  set ready(value) {
    this._ready = !!value;
    this.maybeAutoOpen();
  }

  mode = "idle"; // idle | welcome | step | done
  stepIndex = 0;
  firstName = "";
  logoUrl = TSIGN_LOGO;

  targetRect = null;
  dimPath = "";
  rings = [];
  cardStyle = "visibility:hidden";
  arrowStyle = "";
  arrowSide = "";

  _ready = false;
  _welcomeDue = false;
  _cardHeight = 0;
  _placed = false;
  _focusPending = false;
  _raf = null;
  _onViewportChange = null;

  connectedCallback() {
    getTourState()
      .then((state) => {
        this.firstName = state?.firstName || "";
        this._welcomeDue = state?.showWelcome === true;
        this.maybeAutoOpen();
      })
      .catch((error) => console.error("TSign guided tour - tour state not loaded", error));
  }

  disconnectedCallback() {
    this.listen(false);
  }

  renderedCallback() {
    if (this.mode === "step") {
      const card = this.template.querySelector(".tour-card");
      const height = card ? card.offsetHeight : 0;
      if (height && Math.abs(height - this._cardHeight) > 1) {
        this._cardHeight = height;
        this.position();
      }
    }
    if (this._focusPending) {
      const primary = this.template.querySelector('[data-focus="primary"]');
      if (primary) {
        this._focusPending = false;
        primary.focus({ preventScroll: true });
      }
    }
  }

  /* ---------------- public ---------------- */

  @api
  openWelcome() {
    this._welcomeDue = false;
    this.setMode("welcome");
  }

  // Help › Take the guided tour: straight to step 1
  @api
  start() {
    this.beginTour();
  }

  /* ---------------- template state ---------------- */

  get isOpen() {
    return this.mode !== "idle";
  }
  get isWelcome() {
    return this.mode === "welcome";
  }
  get isStep() {
    return this.mode === "step";
  }
  get isDone() {
    return this.mode === "done";
  }
  get rootClass() {
    return this.mode === "step" ? "tour-root" : "tour-root tour-root-modal";
  }
  get hasUserGuide() {
    return !!this.userGuideUrl;
  }
  get isBusiness() {
    return this.accountType === "Business";
  }
  get welcomeTitle() {
    return this.firstName ? `Welcome to T sign, ${this.firstName}` : "Welcome to T sign";
  }
  get doneTitle() {
    return this.firstName ? `You’re all set, ${this.firstName}` : "You’re all set";
  }

  get steps() {
    return this.hideHelpStep ? STEPS.filter((step) => step.key !== "help") : STEPS;
  }
  get tourTopics() {
    return this.steps.map((step, index) => ({ key: step.key, icon: step.icon, label: step.label, number: index + 1 }));
  }
  get currentStep() {
    return this.steps[this.stepIndex] || this.steps[0];
  }
  get stepLabel() {
    return `Step ${this.stepIndex + 1} of ${this.steps.length}`;
  }
  get progress() {
    return this.steps.map((step, index) => ({
      key: step.key,
      cls: index <= this.stepIndex ? "tour-seg tour-seg-on" : "tour-seg"
    }));
  }
  get isFirstStep() {
    return this.stepIndex === 0;
  }
  get isLastStep() {
    return this.stepIndex === this.steps.length - 1;
  }
  get nextLabel() {
    return this.isLastStep ? "Finish" : "Next";
  }
  get showNextArrow() {
    return !this.isLastStep;
  }

  get currentBody() {
    const step = this.currentStep;
    let parts = step.body;
    if (step.key === "navigation") {
      parts = [{ text: `Use the menu to open ${joinWithAnd(this.menuLabels)}. The page you are on is highlighted.` }];
    } else if (step.key === "help") {
      parts = [
        {
          text: this.hasUserGuide
            ? "Click Help for the User Guide or to contact support. You can restart this tour from Help at any time."
            : "Click Help to contact support, or to take this tour again at any time."
        }
      ];
    }
    return parts.map((part, index) => ({ key: `${step.key}-${index}`, text: part.text, cls: part.bold ? "tour-bold" : "" }));
  }

  // menu items this person actually has; falls back to the account's default menu
  get menuLabels() {
    const modules = Array.isArray(this.modules) ? this.modules : [];
    const labels = MENU_LABELS.filter(([access]) => modules.includes(access)).map(([, label]) => label);
    if (labels.length) {
      return labels;
    }
    return MENU_LABELS.filter(([access]) => this.isBusiness || access !== "My Organisation").map(([, label]) => label);
  }

  get checklist() {
    const modules = Array.isArray(this.modules) ? this.modules : [];
    return CHECKLIST.filter(
      (item) => (!item.businessOnly || this.isBusiness) && (!modules.length || modules.includes(item.access))
    );
  }

  get showArrow() {
    return !!this.arrowSide;
  }
  get arrowClass() {
    return `tour-arrow tour-arrow-${this.arrowSide}`;
  }
  get cardClass() {
    return this._placed ? "tour-card tour-card-animated" : "tour-card";
  }

  /* ---------------- actions ---------------- */

  handleStartTour() {
    this.save("Started");
    this.beginTour();
  }

  handleSkipWelcome() {
    this.save("Skipped");
    this.close();
  }

  handleViewGettingStarted() {
    this.save("Skipped");
    this.openUserGuide();
    this.close();
  }

  handleNext() {
    if (this.isLastStep) {
      this.save("Completed");
      this.setMode("done");
      return;
    }
    this.stepIndex += 1;
    this.showStep(true);
  }

  handleBack() {
    if (this.stepIndex > 0) {
      this.stepIndex -= 1;
      this.showStep(true);
    }
  }

  handleSkipTour() {
    this.save("Skipped");
    this.close();
  }

  handleRestart() {
    this.beginTour();
  }

  handleOpenGuide() {
    this.openUserGuide();
    this.close();
  }

  handleGoToDashboard() {
    this.close();
  }

  handleChecklistClick(event) {
    const module = event.currentTarget.dataset.module;
    this.close();
    this.dispatchEvent(new CustomEvent("tournavigate", { detail: { module } }));
  }

  // keyboard handled on the tour itself (no window listener, so LWS cannot get in the way)
  handleKeydown(event) {
    const key = event.key;
    if (key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (this.mode === "welcome") this.handleSkipWelcome();
      else if (this.mode === "step") this.handleSkipTour();
      else this.close();
    } else if (this.mode === "step" && (key === "ArrowRight" || key === "ArrowLeft")) {
      event.preventDefault();
      event.stopPropagation();
      if (key === "ArrowRight") this.handleNext();
      else this.handleBack();
    } else if (key === "Tab") {
      this.trapFocus(event);
    }
  }

  /* ---------------- internals ---------------- */

  setMode(mode) {
    this.mode = mode;
    this._focusPending = mode !== "idle";
    this.listen(mode === "step");
  }

  maybeAutoOpen() {
    if (!this._welcomeDue || !this._ready || this.mode !== "idle" || window.innerWidth < AUTO_OPEN_MIN_WIDTH) {
      return;
    }
    this.openWelcome();
  }

  beginTour() {
    // the dashboard opens the T sign home and the full sidebar
    this.dispatchEvent(new CustomEvent("tourprepare"));
    this.stepIndex = 0;
    this.targetRect = null;
    this.rings = [];
    this.dimPath = "";
    this.arrowSide = "";
    this.cardStyle = "visibility:hidden";
    this._placed = false;
    this.setMode("step");
    // give the dashboard a moment to render the home page before measuring
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    setTimeout(() => {
      if (this.mode === "step") this.showStep(true);
    }, 350);
  }

  showStep(scrollIntoView) {
    let rect = null;
    try {
      rect = typeof this.measureTarget === "function" ? this.measureTarget(this.currentStep.key, scrollIntoView) : null;
    } catch (error) {
      console.error("TSign guided tour - could not measure " + this.currentStep.key, error);
    }
    this.targetRect = rect && rect.width > 0 && rect.height > 0 ? rect : null;
    this.position();
    if (scrollIntoView) this._focusPending = true;
  }

  position() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const r = this.targetRect;
    const step = this.currentStep;
    const cardH = this._cardHeight || 240;

    // lit area: target plus padding, kept just inside the window so the ring stays visible
    let hole = null;
    if (r) {
      const x = Math.max(2, r.left - PAD);
      const y = Math.max(2, r.top - PAD);
      hole = { x, y, w: Math.min(vw - 2, r.left + r.width + PAD) - x, h: Math.min(vh - 2, r.top + r.height + PAD) - y };
    }
    this.dimPath = `M0 0H${vw}V${vh}H0Z` + (hole ? roundedRect(hole) : "");
    this.rings = hole ? [{ key: "ring", style: `top:${hole.y}px;left:${hole.x}px;width:${hole.w}px;height:${hole.h}px;` }] : [];

    if (vw < SHEET_BELOW) {
      this.arrowSide = "";
      this.cardStyle = `left:${EDGE}px;right:${EDGE}px;bottom:${EDGE}px;width:auto;max-height:60vh;overflow:auto;`;
      this.markPlaced();
      return;
    }

    const fits = {
      right: () => hole && hole.x + hole.w + GAP + CARD_WIDTH <= vw - EDGE,
      left: () => hole && hole.x - GAP - CARD_WIDTH >= EDGE,
      bottom: () => hole && hole.y + hole.h + GAP + cardH <= vh - EDGE,
      top: () => hole && hole.y - GAP - cardH >= EDGE
    };
    const side = [step.placement, "right", "bottom", "left", "top"].find((p) => fits[p]()) || "center";

    const clampX = (x) => Math.min(Math.max(x, EDGE), vw - CARD_WIDTH - EDGE);
    const clampY = (y) => Math.min(Math.max(y, EDGE), vh - cardH - EDGE);
    const clampArrow = (value, size) => Math.min(Math.max(value, 24), size - 24);
    let left;
    let top;
    let arrow = "";

    if (side === "right" || side === "left") {
      left = side === "right" ? hole.x + hole.w + GAP : hole.x - GAP - CARD_WIDTH;
      top = clampY(step.align === "start" ? hole.y : hole.y + hole.h / 2 - cardH / 2);
      const arrowY = step.align === "start" ? 32 : clampArrow(hole.y + hole.h / 2 - top, cardH);
      arrow = `top:${arrowY - 7}px;`;
    } else if (side === "bottom" || side === "top") {
      top = side === "bottom" ? hole.y + hole.h + GAP : hole.y - GAP - cardH;
      if (step.align === "end") left = clampX(hole.x + hole.w - CARD_WIDTH);
      else if (step.align === "start") left = clampX(hole.x);
      else left = clampX(hole.x + hole.w / 2 - CARD_WIDTH / 2);
      const arrowX = clampArrow(hole.x + hole.w / 2 - left, CARD_WIDTH);
      arrow = `left:${arrowX - 7}px;`;
    } else {
      left = (vw - CARD_WIDTH) / 2;
      top = Math.max(EDGE, (vh - cardH) / 2);
    }

    // the arrow points back at the lit area, so it sits on the opposite side of the card
    this.arrowSide = { right: "left", left: "right", bottom: "top", top: "bottom" }[side] || "";
    this.arrowStyle = arrow;
    this.cardStyle = `top:${Math.round(top)}px;left:${Math.round(left)}px;width:${CARD_WIDTH}px;`;
    this.markPlaced();
  }

  markPlaced() {
    if (this._placed) return;
    // turn on the slide animation only after the first placement
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    requestAnimationFrame(() => {
      this._placed = true;
    });
  }

  listen(on) {
    if (on && !this._onViewportChange) {
      this._onViewportChange = () => {
        if (this._raf) return;
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this._raf = requestAnimationFrame(() => {
          this._raf = null;
          if (this.mode === "step") this.showStep(false);
        });
      };
      window.addEventListener("resize", this._onViewportChange);
      window.addEventListener("scroll", this._onViewportChange, true);
    } else if (!on && this._onViewportChange) {
      window.removeEventListener("resize", this._onViewportChange);
      window.removeEventListener("scroll", this._onViewportChange, true);
      this._onViewportChange = null;
    }
  }

  trapFocus(event) {
    const buttons = [...this.template.querySelectorAll(".tour-dialog button:not([disabled])")];
    if (!buttons.length) return;
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    const active = this.template.activeElement;
    if (event.shiftKey && (active === first || !buttons.includes(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !buttons.includes(active))) {
      event.preventDefault();
      first.focus();
    }
  }

  close() {
    this.setMode("idle");
    this.targetRect = null;
    this.rings = [];
    this.arrowSide = "";
  }

  // openUserGuide() {
  //   if (this.userGuideUrl) window.open(this.userGuideUrl, "_blank", "noopener");
  // }
  openUserGuide() {
    if (!this.userGuideUrl) return;
    // "#/..." is a page inside the app (the dashboard opens it); a full web address opens in a new tab
    if (this.userGuideUrl.startsWith("#")) window.location.hash = this.userGuideUrl;
    else window.open(this.userGuideUrl, "_blank", "noopener");
  }  

  save(status) {
    saveTourStatus({ status }).catch((error) => console.error("TSign guided tour - status not saved", error));
  }
}