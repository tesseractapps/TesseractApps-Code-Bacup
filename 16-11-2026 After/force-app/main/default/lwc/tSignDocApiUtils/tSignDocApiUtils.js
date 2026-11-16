/**
 * Shared utility functions for tSign CloudFront Doc API interactions.
 */

/**
 * Normalizes a URL or key for the Doc API.
 * Trims; if it starts with http, returns it without the query string (Apex sends http values as fullUrl);
 * otherwise returns it unchanged.
 */
export function docApiTarget(urlOrKey) {
    const v = String(urlOrKey || '').trim();
    return /^https?:\/\//i.test(v) ? v.split('?')[0] : v;
}

/**
 * Validates and parses the ApiResult body returned from Apex.
 * Throws Error(res?.error || 'Empty response') if !res, res.error or !res.body;
 * JSON.parse when it's a string.
 */
export function parseDocApiBody(res) {
    if (!res || res.error || !res.body) {
        throw new Error(res?.error || 'Empty response');
    }
    return typeof res.body === 'string' ? JSON.parse(res.body) : res.body;
}

/**
 * Polls for document pages and transforms them for image list rendering.
 * @param {Function} getDocPagesFn - Apex getPages method
 * @param {String} keyOrUrl - S3 key or full URL
 * @param {Object} options - { maxAttempts, delayMs }
 * @returns {Promise<Array>} Array of mapped page objects sorted by pageNumber
 */
export async function fetchDocPages(getDocPagesFn, keyOrUrl, { maxAttempts = 5, delayMs = 2000 } = {}) {
    let attempts = 0;
    while (attempts < maxAttempts) {
        attempts++;
        const res = await getDocPagesFn({ keyOrUrl });
        const data = parseDocApiBody(res);
        const item = data.results?.[0] || data;

        if (item?.status === 'processing') {
            if (attempts < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
                continue;
            }
            const err = new Error(`Document pages still processing after ${maxAttempts} attempts: ${item.error || 'timeout'}`);
            err.serverError = item.error;
            throw err;
        }

        if (item?.status !== 'ok') {
            const msg = `Pages request failed (${item?.status || 'unknown'}): ${item?.error || 'Unknown error'}`;
            const err = new Error(msg);
            err.serverError = item?.error;
            throw err;
        }

        const rawPages = item.pages || data.pages;
        if (!rawPages || !rawPages.length) {
            const msg = `No pages returned: ${item?.error || 'Pages array empty'}`;
            const err = new Error(msg);
            err.serverError = item?.error;
            throw err;
        }

        const pages = rawPages.map((pg, idx) => {
            const pageNum = Number(pg.pageNumber ?? pg.page ?? (idx + 1));
            const w = Number(pg.widthPt) || 612;
            const h = Number(pg.heightPt) || 792;
            const imageUrl = pg.imageUrl || pg.thumbUrl || pg.thumbnailUrl;
            return {
                pageNumber: pageNum,
                src: imageUrl,
                wrapperStyle: `aspect-ratio: ${w} / ${h};`,
                altText: `Page ${pageNum}`
            };
        }).sort((a, b) => a.pageNumber - b.pageNumber);

        return pages;
    }
    const err = new Error(`Exceeded max attempts (${maxAttempts}) fetching document pages`);
    throw err;
}

/**
 * Retrieves a download URL via Apex.
 * @param {Function} getDocDownloadUrlFn - Apex getDownloadUrl method
 * @param {String} keyOrUrl - S3 key or full URL
 * @returns {Promise<String>} Download URL
 */
export async function fetchDownloadUrl(getDocDownloadUrlFn, keyOrUrl) {
    const res = await getDocDownloadUrlFn({ keyOrUrl });
    const data = parseDocApiBody(res);
    const item = data.results?.[0] || data;

    if (item?.status === 'error') {
        throw new Error(item.error || 'Download failed');
    }

    const downloadUrl = item?.downloadUrl || data.downloadUrl;
    if (!downloadUrl) {
        throw new Error(item?.error || data?.error || 'No download URL returned');
    }

    return downloadUrl;
}

/**
 * Downloads a file from a URL.
 * Attempts fetch -> blob -> object URL -> anchor click -> revoke after 1s;
 * falls back to window.open(url, '_blank') if fetch fails.
 * @param {String} url - File URL
 * @param {String} fileName - Desired file name
 */
export async function downloadFile(url, fileName) {
    try {
        const resp = await fetch(url);
        if (!resp.ok) {
            throw new Error(`Fetch failed: ${resp.status}`);
        }
        const blob = await resp.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
        }, 1000);
    } catch (e) {
        window.open(url, '_blank');
    }
}

/**
 * Sanitizes a file name for downloading.
 * Strips characters outside [A-Za-z0-9 ._-], drops trailing .pdf, returns `${base}.pdf`, default 'Document.pdf'.
 * @param {String} name - Input file name
 * @returns {String} Safe file name ending in .pdf
 */
export function safeFileName(name) {
    const cleaned = String(name || '').replace(/[^A-Za-z0-9 ._-]/g, '').trim();
    const base = cleaned.replace(/\.pdf$/i, '').trim();
    return base ? `${base}.pdf` : 'Document.pdf';
}

/**
 * Strips query string from a URL for safe logging.
 * @param {String} url - Full URL
 * @returns {String} URL without query parameters
 */
export function stripQuery(url) {
    return String(url || '').split('?')[0];
}

/**
 * Resolves a download file name for a given variant.
 * Strips characters outside [A-Za-z0-9 ._-], drops trailing .pdf and __signed_ suffix, returns appropriate variant file name.
 * Default names: document "<docName>.pdf", certificate "<docName>_Certificate.pdf", combined "<docName>_with_Certificate.pdf"
 * @param {String} baseName - Original document file name
 * @param {String} variant - 'document' | 'certificate' | 'combined'
 * @returns {String} Formatted variant file name
 */
export function getVariantFileName(baseName, variant) {
    let clean = String(baseName || 'Document').replace(/\.pdf$/i, '').trim();
    clean = clean.replace(/__signed_.*$/i, '').trim();
    clean = clean.replace(/[^A-Za-z0-9 ._-]/g, '').trim();
    if (!clean) clean = 'Document';
    const v = String(variant || 'document').toLowerCase();
    if (v === 'certificate') {
        return `${clean}_Certificate.pdf`;
    } else if (v === 'combined') {
        return `${clean}_with_Certificate.pdf`;
    }
    return `${clean}.pdf`;
}