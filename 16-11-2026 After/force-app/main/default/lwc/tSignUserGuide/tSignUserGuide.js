import { LightningElement, api, wire } from "lwc";
import GUIDE_IMAGES from "@salesforce/resourceUrl/tSignUserGuideImages";
import GUIDE_PDF from "@salesforce/resourceUrl/tSignUserGuidePdf";
import getSetupProgress from "@salesforce/apex/TSignUserGuideController.getSetupProgress";
import { publish, MessageContext } from "lightning/messageService";
import FOOTER_MESSAGE_CHANNEL from "@salesforce/messageChannel/FooterMessageChannel__c";
import {
  TOPICS,
  GROUPS,
  POPULAR,
  STAGES,
  CHECKLIST,
  TRY_SEARCHING,
  GUIDE_UPDATED,
  GUIDE_RELEASE,
  SUPPORT_EMAIL
} from "c/tSignUserGuideContent";

const WORDS_PER_MINUTE = 200;
const TOPIC_CACHE = new Map(); // "<accountType>:<topicId>" -> render model (content is static)
const SPY_OFFSET = 140; // a section counts as "current" once its heading is this close to the top

// ---------- text helpers ----------

// "**bold**" and "[text](topic#section)" -> segments for the template
function parseInline(text, keyBase, isVisible) {
  const segments = [];
  const pattern = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let match;
  let n = 0;
  const push = (seg) => segments.push({ key: `${keyBase}-${n++}`, ...seg });
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) push({ text: text.slice(last, match.index) });
    if (match[1] !== undefined) {
      push({ text: match[1], bold: true });
    } else {
      const href = match[3];
      if (isVisible(href)) push({ text: match[2], isLink: true, href });
      else push({ text: match[2] });
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) push({ text: text.slice(last) });
  return segments;
}

function plain(text) {
  return String(text || "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

function blockText(block) {
  const parts = [];
  ["p", "h", "note", "warning", "tip", "title", "caption", "label"].forEach((k) => {
    if (block[k]) parts.push(block[k]);
  });
  ["steps", "bullets", "chips"].forEach((k) => {
    if (block[k]) parts.push(...block[k]);
  });
  if (block.table) block.table.forEach((row) => parts.push(...row));
  return plain(parts.join(" "));
}

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

// bold every query word inside a plain snippet
function highlight(snippet, words, keyBase) {
  if (!words.length) return [{ key: `${keyBase}-0`, text: snippet }];
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "gi");
  return snippet
    .split(re)
    .filter((part) => part !== "")
    .map((part, i) => ({ key: `${keyBase}-${i}`, text: part, bold: words.includes(part.toLowerCase()) }));
}

function makeSnippet(text, words) {
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
  const hit = sentences.find((s) => words.some((w) => s.toLowerCase().includes(w))) || sentences[0] || "";
  const trimmed = hit.trim();
  return trimmed.length > 220 ? `${trimmed.slice(0, 217).trim()}…` : trimmed;
}

export default class TSignUserGuide extends LightningElement {
  @api accountType = "Business"; // "Business" or "Individual" (Individual hides My Organisation)
  @api modules = []; // Module_Access__c values; checklist rows for missing modules are hidden
  @wire(MessageContext) messageContext;
  view = "home"; // home | topic | search
  topicId = "";
  activeSectionId = "";
  query = "";
  searchInput = "";
  groupFilter = "all";
  audienceFilter = [];
  progress = null;
  progressFailed = false;

  _pendingScroll = null;
  _boundScroll;

  connectedCallback() {
    this._boundScroll = this.handleWindowScroll.bind(this);
    window.addEventListener("scroll", this._boundScroll, true);
    this.loadProgress();
  }

  disconnectedCallback() {
    window.removeEventListener("scroll", this._boundScroll, true);
  }

  renderedCallback() {
    if (!this._pendingScroll) return;
    const target = this._pendingScroll;
    this._pendingScroll = null;
    const el =
      target === "top"
        ? this.template.querySelector(".ug")
        : this.template.querySelector(`[data-section="${target}"]`);
    if (el) el.scrollIntoView({ block: "start" });
  }

  loadProgress() {
    getSetupProgress()
      .then((result) => {
        this.progress = result || {};
      })
      .catch((error) => {
        this.progressFailed = true;
        console.error("TSign user guide - setup checklist not loaded", error);
      });
  }

  // ---------- account / topics ----------

  get isBusiness() {
    return this.accountType !== "Individual";
  }

  get visibleTopics() {
    return TOPICS.filter((t) => this.isBusiness || !t.businessOnly);
  }

  isTopicVisible(id) {
    return this.visibleTopics.some((t) => t.id === id);
  }

  linkVisible = (href) => this.isTopicVisible(String(href).split("#")[0]);

  // blocks marked businessOnly / individualOnly show only for that account type
  forAccount(blocks) {
    return blocks.filter((b) => (this.isBusiness ? !b.individualOnly : !b.businessOnly));
  }  

  topicStats(topic) {
    const allBlocks = this.forAccount([...topic.intro, ...topic.sections.flatMap((s) => s.blocks)]);
    const words = countWords(allBlocks.map(blockText).join(" "));
    const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
    const articles = Math.max(1, topic.sections.length);
    return { minutes, articles };
  }

  groupLabel(groupId) {
    return (GROUPS.find((g) => g.id === groupId) || {}).label || "";
  }

  // ---------- home ----------

  get updatedText() {
    return `Updated ${GUIDE_UPDATED} · Release ${GUIDE_RELEASE}`;
  }

  get pdfUrl() {
    return GUIDE_PDF;
  }

  get supportEmail() {
    return SUPPORT_EMAIL;
  }

  // Same as the footer's "Contact us": the dashboard opens its Contact Us page
  handleContactSupport() {
    publish(this.messageContext, FOOTER_MESSAGE_CHANNEL, { action: "openContactPanel" });
  }

  get supportMailto() {
    return `mailto:${SUPPORT_EMAIL}`;
  }

  get popular() {
    return POPULAR.filter(([, href]) => this.linkVisible(href)).map(([label, href]) => ({ key: href, label, href }));
  }

  get stages() {
    return STAGES.map((s, i) => ({
      ...s,
      key: `stage-${i}`,
      num: i + 1,
      numClass: i === 0 ? "ug-stage-num ug-stage-num-on" : "ug-stage-num",
      badgeClass: `ug-badge ug-badge-${s.tone}`,
      lineClass: i < STAGES.length - 1 ? "ug-stage-line" : "ug-stage-line ug-stage-line-none"
    }));
  }

  get checklist() {
    const modules = Array.isArray(this.modules) ? this.modules : [];
    return CHECKLIST.filter((item) => !item.businessOnly || this.isBusiness)
      .filter((item) => !item.module || modules.length === 0 || modules.includes(item.module))
      .map((item) => {
        const done = !!(this.progress && this.progress[item.key]);
        return {
          ...item,
          done,
          rowClass: done ? "ug-check ug-check-done" : "ug-check",
          icon: done ? "check_circle" : "radio_button_unchecked",
          iconClass: done ? "ms ug-check-icon ug-check-icon-done" : "ms ug-check-icon"
        };
      });
  }

  get checklistDoneCount() {
    return this.checklist.filter((i) => i.done).length;
  }

  get checklistSummary() {
    if (!this.progress) return "";
    return `${this.checklistDoneCount} of ${this.checklist.length} done`;
  }

  get checklistBarStyle() {
    const total = this.checklist.length || 1;
    return `width: ${Math.round((this.checklistDoneCount / total) * 100)}%`;
  }

  get homeGroups() {
    return GROUPS.map((g) => ({
      ...g,
      topics: this.visibleTopics
        .filter((t) => t.group === g.id)
        .map((t) => {
          const stats = this.topicStats(t);
          return {
            key: t.id,
            id: t.id,
            title: t.title,
            summary: t.summary,
            icon: t.icon,
            meta: `${stats.articles} ${stats.articles === 1 ? "article" : "articles"} · ${stats.minutes} min`
          };
        })
    })).filter((g) => g.topics.length);
  }

  // ---------- topic (article) ----------

  get isHome() {
    return this.view === "home";
  }

  get isTopic() {
    return this.view === "topic";
  }

  get isSearch() {
    return this.view === "search";
  }

  get topic() {
    if (!this.topicId) return null;
    const cacheKey = `${this.isBusiness ? "Business" : "Individual"}:${this.topicId}`;
    if (!TOPIC_CACHE.has(cacheKey)) {
      const raw = this.visibleTopics.find((t) => t.id === this.topicId);
      if (!raw) return null;
      TOPIC_CACHE.set(cacheKey, this.buildTopic(raw));
    }
    return TOPIC_CACHE.get(cacheKey);
  }

  buildTopic(raw) {
    const stats = this.topicStats(raw);
    const parts = [];
    if (raw.intro.length) {
      parts.push({ key: "intro", id: "", hasHeader: false, partClass: "ug-part ug-part-intro", blocks: this.buildBlocks(this.forAccount(raw.intro), `${raw.id}-intro`) });
    }
    raw.sections.forEach((s, i) => {
      parts.push({
        key: s.id,
        id: s.id,
        num: i + 1,
        title: s.title,
        hasHeader: true,
        partClass: "ug-part",
        blocks: this.buildBlocks(this.forAccount(s.blocks), `${raw.id}-${s.id}`)
      });
    });
    const meta = [];
    if (raw.sections.length) meta.push(`${raw.sections.length} ${raw.sections.length === 1 ? "step" : "steps"}`);
    meta.push(`${stats.minutes} min read`);
    meta.push(`Updated ${GUIDE_UPDATED}`);
    return {
      id: raw.id,
      title: raw.title,
      group: raw.group,
      groupLabel: this.groupLabel(raw.group),
      audience: raw.audience.join(" · "),
      meta: meta.join("  •  "),
      parts,
      sections: raw.sections.map((s, i) => ({ key: s.id, id: s.id, num: i + 1, title: s.title })),
      related: (raw.related || [])
        .map((id) => this.visibleTopics.find((t) => t.id === id))
        .filter(Boolean)
        .map((t) => ({ key: t.id, id: t.id, title: t.title }))
    };
  }

  buildBlocks(blocks, keyBase) {
    return blocks.map((b, i) => {
      const key = `${keyBase}-${i}`;
      const seg = (text, k) => parseInline(text, k, this.linkVisible);
      const block = { key };
      if (b.p !== undefined) {
        block.isP = true;
        block.segments = seg(b.p, key);
      } else if (b.h !== undefined) {
        block.isH = true;
        block.text = b.h;
      } else if (b.steps || b.bullets) {
        block.isSteps = !!b.steps;
        block.isBullets = !!b.bullets;
        block.items = (b.steps || b.bullets).map((t, j) => ({ key: `${key}-${j}`, num: j + 1, segments: seg(t, `${key}-${j}`) }));
      } else if (b.img !== undefined) {
        block.isImg = true;
        block.src = `${GUIDE_IMAGES}/img/fig${b.img}.jpg`;
        block.caption = b.caption || "";
        block.alt = b.caption || "Screenshot";
      } else if (b.table) {
        block.isTable = true;
        const [head, ...rows] = b.table;
        block.head = head.map((c, j) => ({ key: `${key}-h${j}`, text: plain(c) }));
        block.rows = rows.map((r, j) => ({
          key: `${key}-r${j}`,
          cells: r.map((c, k) => ({ key: `${key}-r${j}-${k}`, segments: seg(c, `${key}-r${j}-${k}`) }))
        }));
      } else if (b.chips) {
        block.isChips = true;
        block.label = b.label || "";
        block.chips = b.chips.map((c, j) => ({ key: `${key}-${j}`, text: c }));
      } else if (b.note !== undefined || b.warning !== undefined || b.tip !== undefined) {
        const kind = b.warning !== undefined ? "warning" : b.tip !== undefined ? "tip" : "note";
        block.isCallout = true;
        block.calloutClass = `ug-callout ug-callout-${kind}`;
        block.icon = { note: "info", warning: "warning", tip: "lightbulb" }[kind];
        block.title = b.title || { note: "Note", warning: "Important", tip: "Tip" }[kind];
        block.segments = seg(b[kind], key);
      }
      return block;
    });
  }

  get navGroups() {
    return GROUPS.map((g) => ({
      ...g,
      topics: this.visibleTopics
        .filter((t) => t.group === g.id)
        .map((t) => {
          const current = this.isTopic && t.id === this.topicId;
          return {
            key: t.id,
            id: t.id,
            title: t.title,
            current,
            linkClass: current ? "ug-nav-topic ug-nav-topic-current" : "ug-nav-topic",
            ariaCurrent: current ? "page" : undefined,
            sections: current
              ? t.sections.map((s, i) => ({
                  key: s.id,
                  id: s.id,
                  label: `${i + 1}. ${s.title}`,
                  href: `${t.id}#${s.id}`,
                  linkClass: s.id === this.activeSectionId ? "ug-nav-sec ug-nav-sec-on" : "ug-nav-sec"
                }))
              : []
          };
        })
    })).filter((g) => g.topics.length);
  }

  get onThisPage() {
    const topic = this.topic;
    if (!topic) return [];
    return topic.sections.map((s) => ({
      ...s,
      href: `${topic.id}#${s.id}`,
      linkClass: s.id === this.activeSectionId ? "ug-toc-link ug-toc-link-on" : "ug-toc-link"
    }));
  }

  get hasOnThisPage() {
    return this.onThisPage.length > 1;
  }

  get hasRelated() {
    return !!(this.topic && this.topic.related.length);
  }

  get prevTopic() {
    const list = this.visibleTopics;
    const i = list.findIndex((t) => t.id === this.topicId);
    return i > 0 ? { id: list[i - 1].id, title: list[i - 1].title } : null;
  }

  get nextTopic() {
    const list = this.visibleTopics;
    const i = list.findIndex((t) => t.id === this.topicId);
    return i >= 0 && i < list.length - 1 ? { id: list[i + 1].id, title: list[i + 1].title } : null;
  }

  get pagerClass() {
    return this.prevTopic ? "ug-pager" : "ug-pager ug-pager-next-only";
  }

  // ---------- search ----------

  get searchIndex() {
    const entries = [];
    this.visibleTopics.forEach((t) => {
      const base = { topicId: t.id, topicTitle: t.title, group: t.group, icon: t.icon, audience: t.audience };
      if (t.intro.length) {
        entries.push({ ...base, sectionId: "", title: t.title, text: plain(t.summary) + " " + this.forAccount(t.intro).map(blockText).join(" ") });
      }
      t.sections.forEach((s) => {
        entries.push({ ...base, sectionId: s.id, title: s.title, text: this.forAccount(s.blocks).map(blockText).join(" ") });
      });
    });
    return entries;
  }

  get queryWords() {
    return this.query
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z0-9'-]/g, ""))
      .filter((w) => w.length > 1);
  }

  get matchedEntries() {
    const words = this.queryWords;
    if (!words.length) return [];
    return this.searchIndex
      .map((e) => {
        const title = e.title.toLowerCase();
        const text = e.text.toLowerCase();
        if (!words.every((w) => title.includes(w) || text.includes(w))) return null;
        let score = 0;
        words.forEach((w) => {
          if (title.includes(w)) score += 10;
          score += Math.min(5, text.split(w).length - 1);
        });
        return { ...e, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
  }

  get audienceFiltered() {
    if (!this.audienceFilter.length) return this.matchedEntries;
    return this.matchedEntries.filter((e) => e.audience.some((a) => this.audienceFilter.includes(a)));
  }

  get results() {
    const words = this.queryWords;
    return this.audienceFiltered
      .filter((e) => this.groupFilter === "all" || e.group === this.groupFilter)
      .map((e, i) => ({
        key: `${e.topicId}-${e.sectionId || "intro"}`,
        href: e.sectionId ? `${e.topicId}#${e.sectionId}` : e.topicId,
        title: e.title,
        topicTitle: e.topicTitle,
        icon: e.icon,
        audience: e.audience.join(" · "),
        snippet: highlight(makeSnippet(e.text, words), words, `snip-${i}`)
      }));
  }

  get hasResults() {
    return this.results.length > 0;
  }

  get resultSummary() {
    const n = this.results.length;
    return `${n} ${n === 1 ? "result" : "results"} for “${this.query}”`;
  }

  get topicFilters() {
    const counts = {};
    this.audienceFiltered.forEach((e) => {
      counts[e.group] = (counts[e.group] || 0) + 1;
    });
    const all = {
      key: "all",
      id: "all",
      label: "All topics",
      count: this.audienceFiltered.length,
      itemClass: this.groupFilter === "all" ? "ug-filter ug-filter-on" : "ug-filter",
      pressed: this.groupFilter === "all" ? "true" : "false"
    };
    const groups = GROUPS.filter((g) => counts[g.id]).map((g) => ({
      key: g.id,
      id: g.id,
      label: g.label,
      count: counts[g.id],
      itemClass: this.groupFilter === g.id ? "ug-filter ug-filter-on" : "ug-filter",
      pressed: this.groupFilter === g.id ? "true" : "false"
    }));
    return [all, ...groups];
  }

  get audienceOptions() {
    return ["Account owners", "Senders", "Recipients"].map((a) => ({
      key: a,
      label: a,
      checked: this.audienceFilter.includes(a)
    }));
  }

  get trySearching() {
    return TRY_SEARCHING.map((t) => ({ key: t, label: t }));
  }

  // ---------- navigation ----------

  goHome() {
    this.view = "home";
    this.topicId = "";
    this.activeSectionId = "";
    this._pendingScroll = "top";
  }

  openHref(href) {
    const [topicId, sectionId] = String(href || "").split("#");
    if (!this.isTopicVisible(topicId)) return;
    const firstSection = (TOPICS.find((t) => t.id === topicId) || { sections: [] }).sections[0];
    this.view = "topic";
    this.topicId = topicId;
    // this.activeSectionId = sectionId || (firstSection ? firstSection.id : "");
    this._pendingScroll = sectionId || "top";
  }

  runSearch(text) {
    const q = String(text || "").trim();
    if (!q) return;
    this.query = q;
    this.searchInput = q;
    this.groupFilter = "all"; // each new search starts with no filters
    this.audienceFilter = [];
    this.view = "search";
    this._pendingScroll = "top";
  }

  // ---------- handlers ----------

  handleHome(event) {
    event.preventDefault();
    this.goHome();
  }

  handleOpen(event) {
    event.preventDefault();
    this.openHref(event.currentTarget.dataset.href);
  }

  // a link inside guide text (c-t-sign-user-guide-text)
  handleGuideLink(event) {
    this.openHref(event.detail && event.detail.href);
  }

  handleSearchInput(event) {
    this.searchInput = event.target.value;
  }

  handleSearchKeydown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      this.runSearch(event.target.value);
    }
  }

  handleClearSearch() {
    this.searchInput = "";
    const input = this.template.querySelector(".ug-search-page input");
    if (input) {
      input.value = "";
      input.focus();
    }
  }

  handleTrySearch(event) {
    this.runSearch(event.currentTarget.dataset.query);
  }

  handleGroupFilter(event) {
    this.groupFilter = event.currentTarget.dataset.id;
  }

  handleAudience(event) {
    const value = event.target.value;
    const set = new Set(this.audienceFilter);
    if (event.target.checked) set.add(value);
    else set.delete(value);
    this.audienceFilter = [...set];
  }

  handleWindowScroll() {
    if (!this.isTopic) return;
    const headers = this.template.querySelectorAll("[data-section]");
    if (!headers.length) return;
    let current = headers[0].dataset.section;
    headers.forEach((el) => {
      if (el.getBoundingClientRect().top <= SPY_OFFSET) current = el.dataset.section;
    });
    if (current !== this.activeSectionId) this.activeSectionId = current;
  }
}