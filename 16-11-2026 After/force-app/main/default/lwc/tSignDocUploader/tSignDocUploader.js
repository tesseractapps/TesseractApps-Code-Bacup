import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getUploadConfig from '@salesforce/apex/tSignDocApiController.getUploadConfig';
import uploadFiles from '@salesforce/apex/tSignDocApiController.uploadFiles';
import convertFile from '@salesforce/apex/tSignDocApiController.convertFile';
import getPages from '@salesforce/apex/tSignDocApiController.getPages';
import deleteFiles from '@salesforce/apex/tSignDocApiController.deleteFiles';

const DOC_API_TRACE = true;
const TIMING_LOG = true;

export default class TSignDocUploader extends LightningElement {
    @api moduleName;
    @api organisationId;
    @api convert = false;
    @api isUsedForProfilePic = false;
    @api profilePicButtonLabel = 'Profile Picture (Max 1MB)';

    @track uploadFileList = [];
    @track uploadedFiles = [];
    @track isDragging = false;
    @track isUploading = false;
    @track isConfigLoaded = false;

    acceptedFormats = '';
    maxFileSize = null;
    allowMultiple = false;
    maxFileCount = null;
    isUnlimited = false;
    basePath = '';
    showUI = false;

    _configStartTime = null;
    _configTiming = null;

    // ===== LOGGING HELPERS =====
    _trace(msg) {
        if (DOC_API_TRACE) {
            console.log(`[DOC-API] ${msg}`);
        }
    }

    _fmtBytes(n) {
        if (n === null || n === undefined || isNaN(n)) return '0 B';
        const bytes = Number(n);
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }

    _redactUrl(url) {
        if (!url || typeof url !== 'string') return url;
        const qIdx = url.indexOf('?');
        return qIdx !== -1 ? url.substring(0, qIdx) + ' (signed, redacted)' : url;
    }

    _redactObj(obj) {
        if (!obj) return obj;
        try {
            const clone = JSON.parse(JSON.stringify(obj));
            const walk = (item) => {
                if (!item || typeof item !== 'object') return;
                if (Array.isArray(item)) {
                    item.forEach(walk);
                } else {
                    for (const key of Object.keys(item)) {
                        if ((key === 'uploadUrl' || key === 'imageUrl' || key === 'thumbUrl' || key === 'downloadUrl') && typeof item[key] === 'string') {
                            item[key] = this._redactUrl(item[key]);
                        } else if (typeof item[key] === 'object') {
                            walk(item[key]);
                        }
                    }
                }
            };
            walk(clone);
            return clone;
        } catch (e) {
            return obj;
        }
    }

    // ===== LIFECYCLE =====
    async connectedCallback() {
        this._trace(`connectedCallback: organisationId="${this.organisationId}", moduleName="${this.moduleName}"`);
        this._configStartTime = performance.now();
        if (this.organisationId) {
            await this.initializeUploadConfig();
        }
    }

    async initializeUploadConfig() {
        if (!this._configStartTime) {
            this._configStartTime = performance.now();
        }
        this._trace(`Initializing upload config for module="${this.moduleName}"`);

        try {
            const config = await getUploadConfig({ moduleName: this.moduleName });
            if (!config) {
                throw new Error('Upload config returned null');
            }

            this.acceptedFormats = config.formats || '';
            this.maxFileSize = config.maxSizeBytes;
            this.allowMultiple = config.allowMultiple || false;
            this.maxFileCount = config.maxFileCount;
            this.isUnlimited = config.isUnlimited || false;
            this.showUI = config.showUI ?? false;

            if (this.isUnlimited) {
                this.maxFileSize = null;
            }

            const template = config.basePathTemplate;
            const context = {
                organisationId: this.organisationId,
                date: this.getAwsFormattedDate(),
                module: (this.moduleName || '').toLowerCase()
            };

            let resolvedPath = template.replace(/{(.*?)}/g, (match, key) => {
                if (!context[key]) {
                    throw new Error(`Missing value for placeholder: ${key}`);
                }
                return context[key];
            });

            this.basePath = resolvedPath.replace(/\/+/g, '/').replace(/\/$/, '');
            this.isConfigLoaded = true;

            const configMs = Math.round(performance.now() - this._configStartTime);
            this._configTiming = { label: 'Config loaded (getUploadConfig)', ms: configMs };

            this._trace(`Config loaded: basePath="${this.basePath}", showUI=${this.showUI}, maxFileSize=${this._fmtBytes(this.maxFileSize)} in ${configMs} ms`);

            this.dispatchEvent(new CustomEvent('configload', { bubbles: false, composed: false }));
        } catch (error) {
            const errMsg = error?.body?.message || error?.message || 'Error loading config';
            this._trace(`initializeUploadConfig error: ${errMsg}`);
            this.dispatchEvent(new CustomEvent('configerror', { detail: errMsg, bubbles: false, composed: false }));
        }
    }

    getAwsFormattedDate() {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        return `${year}/${month}/${day}/${day}-${month}-${year}`;
    }

    // ===== PUBLIC METHODS =====

    @api
    resetUploadList() {
        this._trace('resetUploadList called');
        this.uploadFileList = [];
        this.uploadedFiles = [];
        this.isUploading = false;
    }

    @api
    uploadFilesFromParent(files) {
        this._trace(`uploadFilesFromParent: count=${files?.length || 0}`);
        if (!files || !files.length) return;

        (files || []).forEach((f, idx) => {
            this._trace(`  file[${idx}]: name="${f.name}", type="${f.type}", size=${this._fmtBytes(f.size)}`);
        });

        this.handleFileSelection({ target: { files } });
    }

    @api
    async deleteFiles(keys) {
        this._trace(`deleteFiles called with keys: ${JSON.stringify(keys)}`);
        if (!keys || !keys.length) return null;
        try {
            const res = await deleteFiles({ keys });
            if (res.body) {
                return JSON.parse(res.body);
            }
            return res;
        } catch (e) {
            this._trace(`deleteFiles failed: ${e.message}`);
            throw e;
        }
    }

    // ===== FILE SELECTION =====

    handleFileSelection(event) {
        const files = [...(event.target.files || [])];
        if (!files.length) return;

        const resetExisting = !this.allowMultiple;
        if (resetExisting) {
            this.uploadFileList = [];
        }

        const validFiles = [];
        const invalidFiles = [];

        files.forEach((f) => {
            if (!this.isFormatAllowed(f)) {
                invalidFiles.push(`${f.name} (invalid format)`);
                return;
            }
            if (!this.isUnlimited && this.maxFileSize && f.size > this.maxFileSize) {
                invalidFiles.push(`${f.name} (size exceeded)`);
                return;
            }
            validFiles.push({
                file: f,
                name: f.name,
                size: f.size,
                type: f.type,
                progress: 0,
                progressStyle: 'width:0%',
                status: 'pending'
            });
        });

        this.uploadFileList = validFiles;
        this._trace(`handleFileSelection: validCount=${validFiles.length}, invalid=${JSON.stringify(invalidFiles)}`);

        if (invalidFiles.length) {
            this.dispatchEvent(new CustomEvent('uploaderror', { detail: invalidFiles.join(', ') }));
            return;
        }

        if (this.uploadFileList.length && !this.isUploading) {
            setTimeout(() => {
                this.handleUpload().catch((err) => {
                    const msg = err?.body?.message || err?.message || 'Upload execution failed';
                    this._trace(`handleUpload uncaught error: ${msg}`);
                    this.dispatchEvent(new CustomEvent('uploaderror', { detail: msg }));
                });
            }, 50);
        }
    }

    isFormatAllowed(file) {
        if (!this.acceptedFormats) return true;
        const allowed = this.acceptedFormats.split(',').map((x) => x.trim().toLowerCase());
        const fileName = (file.name || '').toLowerCase();
        const ext = fileName.includes('.') ? '.' + fileName.split('.').pop() : '';
        const mime = (file.type || '').toLowerCase();
        return allowed.some((fmt) => fmt === ext || fmt === mime);
    }

    buildFileRequest(files, isConvert) {
        let base = this.basePath || '';
        if (!base.endsWith('/')) {
            base += '/';
        }

        return files.map((f) => {
            const safeName = f.name.replace(/\s+/g, '_');
            const key = `${base}${Date.now()}_${safeName}`;
            const ext = safeName.includes('.') ? safeName.split('.').pop().toLowerCase() : '';
            return {
                key,
                contentType: f.type || 'application/octet-stream',
                format: ext || 'bin',
                convert: isConvert
            };
        });
    }

    // ===== MAIN UPLOAD FLOW =====

    async handleUpload() {
        if (!this.uploadFileList.length) {
            return;
        }
        if (!this.basePath) {
            const err = 'Upload path not initialized';
            this._trace(err);
            this.dispatchEvent(new CustomEvent('uploaderror', { detail: err }));
            return;
        }

        this.isUploading = true;
        const tStart = performance.now();
        const isConvert = this.convert === true || this.convert === 'true';
        const timings = [];
        if (this._configTiming) {
            timings.push(this._configTiming);
        }

        this._trace(`handleUpload START: basePath="${this.basePath}", convert=${isConvert}`);

        try {
            // 1. Build File Request
            const fileReq = this.buildFileRequest(this.uploadFileList, isConvert);
            this._trace(`Calling Apex uploadFiles with payload: ${JSON.stringify(fileReq)}`);

            // 2. Request Presigned URL from /tsign/upload
            const tUploadStart = performance.now();
            const uploadRes = await uploadFiles({ files: fileReq });
            const uploadMs = Math.round(performance.now() - tUploadStart);
            timings.push({ label: 'Apex uploadFiles (/tsign/upload)', ms: uploadMs });

            if (uploadRes.error) {
                throw new Error(`Upload init failed: ${uploadRes.error}`);
            }

            const parsedUpload = JSON.parse(uploadRes.body || '{}');
            const resultItem = parsedUpload.results?.[0];
            if (!resultItem || resultItem.status !== 'ok' || !resultItem.uploadUrl) {
                throw new Error(`Upload URL generation failed: ${resultItem?.error || 'Invalid response'}`);
            }

            const activeKey = resultItem.key;
            const fullUrl = resultItem.fullUrl;
            this._trace(`Presigned URL generated for key="${activeKey}", uploadUrl="${this._redactUrl(resultItem.uploadUrl)}"`);

            // 3. S3 Direct PUT with uploadHeaders
            const currentFileObj = this.uploadFileList[0];
            const { elapsed: putMs } = await this.putToS3(currentFileObj, resultItem.uploadUrl, resultItem.uploadHeaders);
            const fileSize = currentFileObj.file ? currentFileObj.file.size : (currentFileObj.size || 0);
            const speedKBps = putMs > 0 ? Math.round((fileSize / 1024) / (putMs / 1000)) : 0;
            timings.push({
                label: `S3 PUT (${this._fmtBytes(fileSize)} @ ${speedKBps} KB/s)`,
                ms: putMs
            });
            this._trace(`S3 PUT completed successfully for "${currentFileObj.name}" in ${putMs} ms`);

            // 4. Post-upload processing (Convert vs Pages)
            let finalFileResult = null;

            if (isConvert || resultItem.convertWith) {
                // DOCX Conversion path
                this._trace(`Executing DOCX conversion for key="${activeKey}"...`);
                finalFileResult = await this.pollConvert(activeKey, resultItem, timings);
            } else {
                // PDF Pages path
                this._trace(`Fetching server pages for key="${activeKey}"...`);
                finalFileResult = await this.pollPages(activeKey, fullUrl, timings);
            }

            const totalMs = Math.round(performance.now() - tStart);
            this._trace(`Upload & server processing finished in ${totalMs} ms`);

            const finalResponse = {
                files: [finalFileResult],
                total: 1,
                succeeded: 1,
                failed: 0,
                timings
            };

            this._trace(`Dispatching uploadsuccess detail: ${JSON.stringify(this._redactObj(finalResponse))}`);
            this.dispatchEvent(new CustomEvent('uploadsuccess', { detail: finalResponse }));

        } catch (error) {
            const msg = error?.body?.message || error?.message || 'File upload failed';
            this._trace(`Upload failed with error: ${msg}`);
            this.dispatchEvent(new CustomEvent('uploaderror', { detail: msg }));
            throw error;
        } finally {
            this.isUploading = false;
        }
    }

    // ===== S3 PUT WITH HEADERS =====

    putToS3(fileObj, uploadUrl, uploadHeaders) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const s3Start = performance.now();

            xhr.open('PUT', uploadUrl, true);

            // Set required uploadHeaders
            let hasContentType = false;
            if (uploadHeaders && typeof uploadHeaders === 'object') {
                for (const [headerName, headerVal] of Object.entries(uploadHeaders)) {
                    if (headerName && headerVal) {
                        xhr.setRequestHeader(headerName, String(headerVal));
                        if (headerName.toLowerCase() === 'content-type') {
                            hasContentType = true;
                        }
                    }
                }
            }

            if (!hasContentType && fileObj.type) {
                xhr.setRequestHeader('Content-Type', fileObj.type);
            }

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    fileObj.progress = percent;
                    fileObj.progressStyle = `width:${percent}%`;
                    this.uploadFileList = [...this.uploadFileList];
                }
            };

            xhr.onload = () => {
                const elapsed = Math.round(performance.now() - s3Start);
                if (xhr.status >= 200 && xhr.status < 300) {
                    this._trace(`S3 PUT done in ${elapsed} ms: status=${xhr.status} ${xhr.statusText}`);
                    fileObj.status = 'uploaded';
                    fileObj.progress = 100;
                    fileObj.progressStyle = 'width:100%';
                    this.uploadFileList = [...this.uploadFileList];
                    resolve({ elapsed });
                } else {
                    this._trace(`S3 PUT error after ${elapsed} ms: status=${xhr.status} ${xhr.statusText}`);
                    fileObj.status = 'error';
                    this.uploadFileList = [...this.uploadFileList];
                    reject(new Error(`S3 upload failed: HTTP ${xhr.status} ${xhr.statusText}`));
                }
            };

            xhr.onerror = () => {
                const elapsed = Math.round(performance.now() - s3Start);
                this._trace(`S3 PUT network error after ${elapsed} ms`);
                fileObj.status = 'error';
                this.uploadFileList = [...this.uploadFileList];
                reject(new Error('S3 upload network failure'));
            };

            xhr.send(fileObj.file || fileObj);
        });
    }

    // ===== CONVERT POLLING (DOCX) =====

    async pollConvert(docxKey, uploadResultItem, timings) {
        let attempts = 0;
        const maxAttempts = 5;
        let totalCalloutMs = 0;
        let totalWaitMs = 0;

        while (attempts < maxAttempts) {
            attempts++;
            this._trace(`convertFile attempt ${attempts} for "${docxKey}"...`);

            const t0 = performance.now();
            const convRes = await convertFile({ key: docxKey });
            totalCalloutMs += Math.round(performance.now() - t0);

            if (convRes.error) {
                throw new Error(`Conversion request failed: ${convRes.error}`);
            }

            const parsed = JSON.parse(convRes.body || '{}');
            const item = parsed.results?.[0];

            if (!item) {
                throw new Error('Invalid conversion response: missing results[0]');
            }

            if (item.status === 'processing') {
                this._trace(`File is processing, retrying in 2000 ms (attempt ${attempts}/${maxAttempts})...`);
                const tw0 = performance.now();
                await new Promise((r) => setTimeout(r, 2000));
                totalWaitMs += Math.round(performance.now() - tw0);
                continue;
            }

            if (item.status === 'converted') {
                const pdfKey = item.pdfKey || item.key;
                const pdfFullUrl = item.fullUrl || item.pdfFullUrl;
                const pages = item.pagesStatus === 'ok' ? this.normalizePages(item.pages) : [];

                if (item.pagesStatus !== 'ok' && item.pagesError) {
                    this._trace(`Server pages generation warning: ${item.pagesError}`);
                }

                if (Array.isArray(timings)) {
                    timings.push({ label: 'Apex convertFile (/tsign/convert)', ms: totalCalloutMs });
                    if (totalWaitMs > 0) {
                        timings.push({ label: 'processing retries', ms: totalWaitMs });
                    }
                }

                return {
                    status: 'ok',
                    key: pdfKey,
                    url: pdfFullUrl,
                    sourceKey: docxKey,
                    sourceUrl: uploadResultItem.fullUrl,
                    pageCount: item.pageCount || pages.length,
                    pages,
                    pagesStatus: item.pagesStatus,
                    expiresAt: item.expiresAt,
                    cached: item.cached
                };
            }

            if (item.status === 'error') {
                throw new Error(`Conversion error: ${item.error || 'Server conversion failed'}`);
            }

            throw new Error(`Unexpected conversion status: "${item.status}"`);
        }

        throw new Error('Document conversion timed out after 5 attempts');
    }

    // ===== PAGES POLLING (PDF) =====

    async pollPages(pdfKey, pdfFullUrl, timings) {
        let attempts = 0;
        const maxAttempts = 5;
        let totalCalloutMs = 0;
        let totalWaitMs = 0;

        while (attempts < maxAttempts) {
            attempts++;
            this._trace(`getPages attempt ${attempts} for "${pdfKey}"...`);

            const t0 = performance.now();
            const pagesRes = await getPages({ keyOrUrl: pdfKey });
            totalCalloutMs += Math.round(performance.now() - t0);

            if (pagesRes.error) {
                throw new Error(`getPages request failed: ${pagesRes.error}`);
            }

            const parsed = JSON.parse(pagesRes.body || '{}');
            const item = parsed.results?.[0];

            if (!item) {
                throw new Error('Invalid pages response: missing results[0]');
            }

            if (item.status === 'processing') {
                this._trace(`PDF pages are processing, retrying in 2000 ms (attempt ${attempts}/${maxAttempts})...`);
                const tw0 = performance.now();
                await new Promise((r) => setTimeout(r, 2000));
                totalWaitMs += Math.round(performance.now() - tw0);
                continue;
            }

            if (item.status === 'ok') {
                const pages = this.normalizePages(item.pages);

                if (Array.isArray(timings)) {
                    timings.push({
                        label: `Apex getPages (/tsign/pages, cached=${item.cached === true})`,
                        ms: totalCalloutMs
                    });
                    if (totalWaitMs > 0) {
                        timings.push({ label: 'processing retries', ms: totalWaitMs });
                    }
                }

                return {
                    status: 'ok',
                    key: pdfKey,
                    url: pdfFullUrl,
                    pageCount: item.pageCount || pages.length,
                    pages,
                    expiresAt: item.expiresAt,
                    cached: item.cached
                };
            }

            if (item.status === 'error') {
                throw new Error(`Pages retrieval error: ${item.error || 'Failed to render pages'}`);
            }

            throw new Error(`Unexpected pages status: "${item.status}"`);
        }

        throw new Error('PDF page rendering timed out after 5 attempts');
    }

    normalizePages(pages) {
        return (pages || []).map((p) => {
            const pageNum = Number(p.pageNumber ?? p.page) || 1;
            const widthPt = Number(p.widthPt ?? p.width) || 612;
            const heightPt = Number(p.heightPt ?? p.height) || 792;
            const thumb = p.thumbUrl || p.thumbnailUrl || p.imageUrl;
            return {
                page: pageNum,
                pageNumber: pageNum,
                imageUrl: p.imageUrl,
                thumbUrl: thumb,
                thumbnailUrl: thumb,
                widthPt,
                heightPt,
                aspectRatio: widthPt / heightPt
            };
        });
    }

    // ===== UI EVENT HANDLERS (WHEN showUI IS TRUE) =====

    get shouldRenderComponent() {
        return this.showUI;
    }

    get formattedFormats() {
        return this.acceptedFormats || '.pdf, .docx';
    }

    get formattedMaxSize() {
        return this._fmtBytes(this.maxFileSize);
    }

    get uploadBoxClass() {
        return `upload-box ${this.isDragging ? 'dragging' : ''}`;
    }

    openFileDialog() {
        const input = this.template.querySelector('input[data-id="fileInput"]');
        if (input) {
            input.click();
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        this.isDragging = true;
    }

    handleDragLeave(event) {
        event.preventDefault();
        this.isDragging = false;
    }

    handleDrop(event) {
        event.preventDefault();
        this.isDragging = false;
        if (event.dataTransfer && event.dataTransfer.files) {
            this.handleFileSelection({ target: { files: event.dataTransfer.files } });
        }
    }
}