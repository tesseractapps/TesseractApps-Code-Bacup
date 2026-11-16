import { LightningElement, track } from 'lwc';
import RELEASE_GIFS from '@salesforce/resourceUrl/releaseGifs';
import Slide1 from '@salesforce/resourceUrl/tesseractAppsSlide1';
import Slide2 from '@salesforce/resourceUrl/tesseractAppsSlide2';
import Slide3 from '@salesforce/resourceUrl/tesseractAppsSlide3';
import Slide4 from '@salesforce/resourceUrl/tesseractAppsSlide4';
import Slide5 from '@salesforce/resourceUrl/tesseractAppsSlide5';





/* --------------------------------------------------------------------------
   EMBEDDED JSON (updated for separate newUpdates.png resource)
--------------------------------------------------------------------------- */
const RELEASE_DATA = {
    zipPrefix: "gifs/",
    fallback: "New_Update.jpg",
    slides: [
        {
            id: 1,
            title: "Welcome to Version 1.28.0",
            description:
                "This release introduces a modern, redesigned Login Page and enhances communication with real-time Comet Chat features including group chat, polls, and file sharing. Participant creation is improved with support for adding unlimited contacts. Bulk upload capabilities for both staff and facilities significantly speed up large data imports.",
            filename: "",                // prevents ZIP lookup
            mediaUrl: Slide1,       // <<< direct static res call
            layout: "normal"
        },
        {
            id: 2,
            title: "Login Page",
            description:
                "Introduced a newly designed Login Page featuring an improved and modern UI. Enhanced user experience with a cleaner layout, updated styling, and smoother interaction flow.",
            filename: "",
            mediaUrl: Slide2, 
            layout: "normal"
        },
        {
            id: 3,
            title: "Comet Chat Integration",
            description:
                "Enabled real-time one-to-one and group messaging with added support for polls and file sharing. This enhancement allows users to collaborate and communicate more efficiently within the platform.",
            filename: "",
            mediaUrl: Slide3, 
            layout: "normal"
        },
        {
            id: 4,
            title: "Participant",
            description:
                "Users can now add an unlimited number of contacts while creating a participant. This improvement provides greater flexibility and simplifies data entry.",
            filename: "",
            mediaUrl: Slide4, 
            layout: "normal"
        },
        {
            id: 5,
            title: "Staff Bulk Upload",
            description:
                "Introduced bulk upload functionality allowing users to add multiple staff records at once. This significantly speeds up data entry and reduces manual effort.",
            filename: "",
            mediaUrl: Slide5, 
            layout: "normal"
        },
        {
            id: 6,
            title: "Facility Bulk Upload",
            description:
                "Enabled bulk upload for facilities, making it easier to import large sets of facility data efficiently and accurately.",
            filename: "",
            mediaUrl: Slide5, 
            layout: "normal"
        }
    ]
};

/* -------------------------------------------------------------------------- */

export default class TesseractAppsReleaseUpdate extends LightningElement {
    @track currentIndex = 0;
    @track isOpen = true;
    @track isAnimating = false;
    @track loadError = false;
    @track releases = [];

    static joinUrl(...parts) {
        const cleaned = parts
            .filter(Boolean)
            .map((p, i) =>
                i === 0 ? p.replace(/\/+$/, "") : p.replace(/^\/+|\/+$/g, "")
            );
        const last = cleaned.pop() ?? "";
        return [...cleaned, encodeURI(last)].join("/");
    }

    connectedCallback() {
        this.loadReleasesFromEmbeddedJson();
    }

    /* ----------------------------------------------------------------------
       NEW: Load JSON with support for separate PNG static resources
    ----------------------------------------------------------------------- */
    loadReleasesFromEmbeddedJson() {
        const data = RELEASE_DATA;

        const zipPrefix = data.zipPrefix || "";
        const fallbackName = data.fallback || "New_Update.jpg";

        const fallbackUrl = this.constructor.joinUrl(
            RELEASE_GIFS,
            zipPrefix,
            fallbackName
        );

        const slides = (data.slides ?? []).map((s) => {
            let mediaUrlPreferred;

            // 1. DIRECT STATIC RESOURCE (NEW)
            if (s.mediaUrl) {
                mediaUrlPreferred = s.mediaUrl;

            // 2. ZIP-FILENAME (OLD)
            } else if (s.filename && s.filename.trim() !== "") {
                mediaUrlPreferred = this.constructor.joinUrl(
                    RELEASE_GIFS,
                    zipPrefix,
                    s.filename
                );

            // 3. FALLBACK
            } else {
                mediaUrlPreferred = fallbackUrl;
            }

            return {
                id: s.id,
                title: s.title || "",
                description: s.description || "",
                layout: "normal",
                isVideo: false,
                filename: s.filename,
                mediaUrlPreferred,
                mediaUrlFallback: fallbackUrl,
                mediaUrl: mediaUrlPreferred
            };
        });

        this.releases = slides;
    }

    /* --- Getters (unchanged) --- */

    get currentRelease() {
        return this.releases?.[this.currentIndex] ?? null;
    }
    get currentTitle() {
        return this.currentRelease ? this.currentRelease.title : "";
    }
    get currentDescription() {
        return this.currentRelease ? this.currentRelease.description : "";
    }
    get currentMediaUrl() {
        return this.currentRelease ? this.currentRelease.mediaUrl : "";
    }
    get currentIsVideo() {
        return this.currentRelease ? !!this.currentRelease.isVideo : false;
    }
    get hasSlides() {
        return Array.isArray(this.releases) && this.releases.length > 0;
    }
    get currentStepNumber() {
        const num = this.currentIndex + 1;
        return num < 10 ? `0${num}` : `${num}`;
    }
    get totalSteps() {
        return this.releases?.length ?? 0;
    }
    get progressBarStyle() {
        if (!this.releases || this.releases.length === 0) return "width: 0%";
        const pct = ((this.currentIndex + 1) / this.releases.length) * 100;
        return `width: ${pct}%`;
    }
    get isPreviousDisabled() {
        return this.releases.length === 0 || this.currentIndex === 0;
    }
    get isNextDisabled() {
        return (
            this.releases.length === 0 ||
            this.currentIndex === this.releases.length - 1
        );
    }
    get isLastSlide() {
        return this.currentIndex === this.releases.length - 1;
    }

    /* --- Navigation --- */
    handleNext() {
        if (this.currentIndex < this.releases.length - 1) {
            this.currentIndex++;
        }
    }
    handlePrevious() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        }
    }
    handleFinish() {
        this.handleClose();
    }
    handleClose() {
        this.isOpen = false;
        this.dispatchEvent(new CustomEvent("close"));
    }
    handleOverlayClick() {
        this.handleClose();
    }
    handleStopPropagation(event) {
        event.stopPropagation();
    }

    /* --- Image load handlers --- */
    handleImgLoad() {
        this.loadError = false;
    }
    handleImgError() {
        const cur = this.releases[this.currentIndex];
        if (!cur) return;
        if (cur.mediaUrl !== cur.mediaUrlFallback) {
            const updated = { ...cur, mediaUrl: cur.mediaUrlFallback };
            this.releases = [
                ...this.releases.slice(0, this.currentIndex),
                updated,
                ...this.releases.slice(this.currentIndex + 1)
            ];
        }
    }
}